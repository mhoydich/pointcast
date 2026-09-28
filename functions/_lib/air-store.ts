/**
 * Field Reports storage — reports, confirms, points, stamps and station posts
 * in AUTH_DB (D1, migrations/auth/0023_air.sql), and the operations the
 * /api/air routes run. Pure rules live in functions/_lib/air-*.mjs; this file
 * is the SQL, who is asking (device hash, session, town card), and the order
 * things happen in:
 *
 *   report   one row per phone per spot per 30-minute slot (a second tap
 *            replaces your own and earns nothing) → first light (open
 *            hours only) → points
 *            (daily cap applied inside the INSERT) → stamps → dial and crew.
 *            A row pays once, marked by awarded_at, so a retry after a failed
 *            write still pays and a replacement never pays twice.
 *   confirm  one row per phone per report → points → stamps → crew
 *
 * First light, the dial and the crew are for live kinds only (kindRole(), the
 * default). A 'side' kind (parking) files, pays and takes confirms but never
 * goes on the air; a 'rating' (vibe) files and pays, and refuses confirms.
 *
 * Rate limits count D1 rows by created_at (server time; observed_at is the
 * client's and can be backdated); nothing here writes PC_RATES_KV. The only KV
 * write is the station post, through writeStationPost(), normally twice per
 * spot per window: air_broadcasts is claimed first, so two phones landing
 * together still make one post, and publish() writes whatever the row says
 * last. pid_hash and ip_hash never leave this file:
 * every response body is shaped in the views section at the bottom, which
 * never reads them. Only prepared statements with bound values. The spots
 * config (AIR_CONFIG from src/lib/air.ts) is passed in, as in the .mjs rules,
 * so tests run this file under node against node:sqlite.
 */
import { readSessionFromRequest, type AuthEnv } from '../api/auth/session.ts';
import { stationPostId, writeStationPost } from '../api/shortwave.ts';
import { readCardByUser } from './town-card.ts';
import type { AirConfig, AirKind, AirSpot } from '../../src/lib/air.ts';
import { courtCallState } from '../../src/lib/band.ts';
// @ts-ignore — plain modules shared with the tests
import { AIR_LIMITS, codeHash, guestByline, ipHash, kindOf, kindRole, labelOf, newAirId, ownerOf, pidHash, slotOf, spotOf } from './air-kinds.mjs';
// @ts-ignore — plain modules shared with the tests
import { CREW_WINDOW_MIN, crewFrom, evidence, isoSec, laClock, laDate, reading, stationLine, streakWeeks, winKey } from './air-reading.mjs';
// @ts-ignore — plain modules shared with the tests
import { DAILY_CAP, badgeStamp, badgesFor, confirmAwards, crewStamp, firstLightOpen, placeStamp, receiptStamps, reportAwards, stampText, stampTraits } from './air-points.mjs';
// Field Report Assignments (docs/plans/2026-09-28-field-assignments.md §3): the
// pure rules and view shapes; the SQL below is this file's, matched against
// them by tests/air-assign.test.mjs's pickAssignment() cross-check.
// @ts-ignore — plain module shared with the tests
import { assignAward, assignReceiptStamp, assignmentView, canFill, canWitness, fillNet, fillView, laDayStart, recentView } from './air-assign.mjs';

export type AirEnv = AuthEnv & {
  VISITS?: KVNamespace;
  PRESENCE?: DurableObjectNamespace;
  PC_RATES_KV?: KVNamespace;
  /** Optional secret salt for ip_hash; the default is public. */
  AIR_IP_SALT?: string;
  /** Secret key for spot-code hashes. Unset, no code verifies: every report files from away. */
  AIR_CODE_PEPPER?: string;
};
type Defer = (p: Promise<unknown>) => void;
// `config` rides along so spotPayload (which takes no config of its own) can
// still build the assignment view; fileReport and confirmReport already have
// their own `config` parameter and never need to read it off Target.
type Target = { spot: AirSpot; kind: string; cfg: AirKind; config: AirConfig };
export type ReportRow = {
  id: string; spot: string; kind: string; value: string; observed_at: number; day: string;
  pid_hash: string; ip_hash: string; user_id: string | null; byline: string; onsite: number; status: string; source: string;
};
export type ConfirmRow = { report_id: string; pid_hash: string; ip_hash: string; user_id: string | null; verdict: string; value: string; onsite: number; at: number; byline?: string | null };
/** The day's crew as air_crews keeps it: anchored at its first formation. */
type CrewRow = { id: string; at: number; n: number };
type Stamp = { kind: 'place' | 'crew' | 'badge'; ref: string; day: string };
/** The display-only ASSIGNMENT stamp (assignReceiptStamp): ranks first on the receipt, never an air_stamps row. */
type AssignStamp = { kind: 'assignment'; ref: string; day: string; text: string; fresh: true };
/** viewAward.assignment: the seat this report just filled. */
type AssignAward = { id: string; label: string; reward: number; text: string };
type HeldStamp = Stamp & { fresh: boolean };
type Who = { userId: string | null; handle: string | null };
/** reading() from air-reading.mjs: the GET /api/air/[spot] reading shape. */
type Reading = {
  value: string | null; label: string | null; status: 'none' | 'single' | 'agree'; support: number; reportId: string | null;
  observedAt: string | null; ageMin: number | null; bars: number; liveUntil: string | null; bylines: string[];
  crew: { id: string; n: number; at: string } | null; last: { value: string; label: string; observedAt: string; byline: string } | null;
};
type Crew = { id: string; n: number; at: number; members: { pid_hash: string; owner: string; byline: string }[] };
type Saved = { id: string; value: string; observed_at: number; byline: string; onsite: number; awarded_at: number | null; status: string };
export type ParsedReport = { spot: string; kind: string; value: string; extras: string[]; device: string; code: string | null; asGuest: boolean; observedAt: number };
export type ParsedConfirm = { reportId: string; verdict: 'still' | 'changed' | 'cant'; device: string; code: string | null };

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
/** Workers KV takes one write per key per second, and the bus one burst per handle per second. */
const KV_GAP_MS = 1_100;
const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

/* ---------- HTTP ---------- */

const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });
export const fail = (reason: string, status = 400, extra: Record<string, unknown> = {}) => json({ ok: false, reason, ...extra }, status);
/** 503: the client keeps the report on the phone and sends it later. */
export const unavailable = () => fail('store-unavailable', 503);
export const limited = (retryAfter: number) => json({ ok: false, reason: 'rate-limited', retryAfter }, 429, { 'Retry-After': String(retryAfter) });

async function readCapped(request: Request, max: number): Promise<string> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > max) { await reader.cancel(); throw new Error('too-large'); }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}

/**
 * Every POST: our own pages only (Origin must be this site, as in
 * shopping-metrics.ts), JSON, 4,000 bytes or fewer. The body, or the refusal.
 */
export async function readPost(request: Request): Promise<{ body: unknown } | { refused: Response }> {
  if (request.headers.get('Origin') !== new URL(request.url).origin) return { refused: fail('bad-origin', 403) };
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return { refused: fail('bad-content-type', 415) };
  if (Number(request.headers.get('Content-Length') || 0) > AIR_LIMITS.bodyBytes) return { refused: fail('too-large', 413) };
  let text: string;
  try { text = await readCapped(request, AIR_LIMITS.bodyBytes); } catch { return { refused: fail('too-large', 413) }; }
  try { return { body: JSON.parse(text) }; } catch { return { refused: fail('bad-json') }; }
}

/** A spot's first (in v1, only) question. */
function firstKind(spot: AirSpot): { kind: string; cfg: AirKind } {
  const kind = Object.keys(spot.kinds)[0];
  return { kind, cfg: spot.kinds[kind] };
}

/** The spot and its (v1: only) question, or null for unknown and reserved ids. */
export function targetOf(config: AirConfig, id: string): Target | null {
  const spot = spotOf(config, id) as AirSpot | null;
  return spot ? { spot, config, ...firstKind(spot) } : null;
}

/* ---------- who is asking ---------- */

/** The signed-in account and its card handle, or nobody. A broken session never blocks a report. */
export async function whoIs(request: Request, env: AirEnv): Promise<Who> {
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return { userId: null, handle: null };
    const card = await readCardByUser(env, current.user.userId);
    return { userId: current.user.userId, handle: card && !card.released && card.handle ? card.handle : null };
  } catch { return { userId: null, handle: null }; }
}

// Confirm rows have no byline column; a signed-in confirmer reads as their card.
// Polls ask every few seconds, so card lookups are kept per isolate for 5 minutes.
const cardBylines = new Map<string, { byline: string | null; at: number }>();
async function cardByline(env: AirEnv, userId: string): Promise<string | null> {
  const hit = cardBylines.get(userId);
  if (hit && Date.now() - hit.at < 5 * MIN) return hit.byline;
  let byline: string | null = null;
  try {
    const card = await readCardByUser(env, userId);
    byline = card && !card.released && card.handle ? `@${card.handle}` : null;
  } catch { /* a guest byline */ }
  if (cardBylines.size > 500) cardBylines.clear();
  cardBylines.set(userId, { byline, at: Date.now() });
  return byline;
}
/**
 * Confirm rows with a signed-in confirmer's card byline filled in (`byline`),
 * card lookups cached per isolate for 5 minutes. Rows keep every column they
 * came with, hashes included: shape them in a view before they leave.
 */
export async function withBylines(env: AirEnv, confirms: ConfirmRow[]): Promise<ConfirmRow[]> {
  const ids = [...new Set(confirms.map((c) => c.user_id).filter((id): id is string => Boolean(id)))];
  const names = new Map(await Promise.all(ids.map(async (id) => [id, await cardByline(env, id)] as const)));
  return confirms.map((c) => (c.user_id && names.get(c.user_id) ? { ...c, byline: names.get(c.user_id) } : c));
}

const clientIp = (request: Request) => request.headers.get('CF-Connecting-IP') || 'local';

/* ---------- reads ---------- */

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}

type SpotData = {
  rows: ReportRow[]; confirms: ConfirmRow[]; weekRows: ReportRow[]; weekConfirms: ConfirmRow[]; crew: CrewRow | null;
  /** Set by spotPayload, outside loadSpot's batch (its own try/catch: an assignment failure never blocks the spot page). */
  assignment?: ReturnType<typeof assignmentView> | null;
};

/**
 * A spot's evidence since `since`: reports observed since then, plus any older
 * report a live on-site "still" confirm (at or after `liveSince`) is keeping
 * on the air, and the confirms on all of them. A confirm keeps evidence live
 * past its report's own decay, so selecting by the report's time alone would
 * drop readings the spot page still shows.
 */
function evidenceStmts(db: D1Database, spot: string, kind: string, since: number, liveSince: number, limit: number): D1PreparedStatement[] {
  return [
    db.prepare(`SELECT id, spot, kind, value, observed_at, day, pid_hash, ip_hash, user_id, byline, onsite, status, source FROM air_reports
      WHERE spot = ? AND kind = ? AND status = 'ok'
        AND (observed_at >= ? OR id IN (SELECT report_id FROM air_confirms WHERE at >= ? AND verdict = 'still' AND onsite = 1))
      ORDER BY observed_at DESC LIMIT ?`).bind(spot, kind, since, liveSince, limit),
    db.prepare(`SELECT c.report_id, c.pid_hash, c.ip_hash, c.user_id, c.verdict, c.value, c.onsite, c.at FROM air_confirms c JOIN air_reports r ON r.id = c.report_id
      WHERE r.spot = ? AND r.kind = ? AND r.status = 'ok' AND (r.observed_at >= ? OR c.at >= ?) LIMIT ?`).bind(spot, kind, since, liveSince, limit * 2),
  ];
}

/**
 * Everything one spot page needs: the last 49 hours (today and all of
 * yesterday in LA, and any window still decaying across midnight) and the
 * same weekday last week, with the confirms on those reports, and today's crew.
 */
async function loadSpot(db: D1Database, t: Target, now: number): Promise<SpotData> {
  const { kind } = t;
  const spot = t.spot.id;
  const week = addDays(laDate(now), -7);
  const [rows, confirms, weekRows, weekConfirms, crew] = await db.batch([
    ...evidenceStmts(db, spot, kind, now - 49 * HOUR, now - t.cfg.decayMin * MIN, 600),
    db.prepare(`SELECT id, spot, kind, value, observed_at, day, pid_hash, ip_hash, user_id, byline, onsite, status, source FROM air_reports
      WHERE spot = ? AND kind = ? AND day = ? AND status = 'ok' ORDER BY observed_at DESC LIMIT 300`).bind(spot, kind, week),
    db.prepare(`SELECT c.report_id, c.pid_hash, c.ip_hash, c.user_id, c.verdict, c.value, c.onsite, c.at FROM air_confirms c JOIN air_reports r ON r.id = c.report_id
      WHERE r.spot = ? AND r.kind = ? AND r.day = ? AND r.status = 'ok' LIMIT 600`).bind(spot, kind, week),
    db.prepare('SELECT id, at, n FROM air_crews WHERE spot = ? AND kind = ? AND day = ?').bind(spot, kind, laDate(now)),
  ]);
  return {
    rows: (rows.results ?? []) as ReportRow[],
    confirms: (confirms.results ?? []) as ConfirmRow[],
    weekRows: (weekRows.results ?? []) as ReportRow[],
    weekConfirms: (weekConfirms.results ?? []) as ConfirmRow[],
    crew: ((crew.results ?? [])[0] as CrewRow | undefined) ?? null,
  };
}

/** The reading at the last on-site moment of a day ("Yesterday 7:41: 1–4 waiting, 5 agree"), or null. */
function lastOfDay(t: Target, rows: ReportRow[], confirms: ConfirmRow[], day: string): { r: Reading; t: number } | null {
  const dayRows = rows.filter((r) => r.day === day);
  const ids = new Set(dayRows.map((r) => r.id));
  const dayConfirms = confirms.filter((c) => ids.has(c.report_id));
  const last = (evidence(dayRows, dayConfirms) as { t: number }[]).filter((e) => laDate(e.t) === day).at(-1);
  if (!last) return null;
  const r = reading({ spot: t.spot.id, cfg: t.cfg, rows: dayRows, confirms: dayConfirms, now: last.t }) as Reading;
  return r.status === 'none' ? null : { r, t: last.t };
}

/** Newest earlier on-site human report at a spot (any kind): the dead-air trait. */
async function prevOnsiteAt(db: D1Database, spot: string, before: number, excludeId: string): Promise<number | null> {
  const row = await db.prepare(`SELECT MAX(observed_at) AS t FROM air_reports
    WHERE spot = ? AND onsite = 1 AND status = 'ok' AND source = 'page' AND observed_at < ? AND id != ?`).bind(spot, before, excludeId).first<{ t: number | null }>();
  return row?.t ?? null;
}

/** GET /api/air/[spot]. With the phone's own device header, also what this phone did. */
export async function spotPayload(env: AirEnv, db: D1Database, t: Target, now: number, device: string | null = null) {
  const data = await loadSpot(db, t, now);
  data.confirms = await withBylines(env, data.confirms);
  const you = device ? await yours(db, t, data, now, device) : null;
  data.assignment = await loadAssignment(db, t.config, t.spot.id, now);
  return viewPayload(t, data, now, you);
}

/** The spot's next open assignment (spec §3.4), or null. Its own query and its own try/catch: never in loadSpot's batch, never blocks the spot page. */
async function loadAssignment(db: D1Database, config: AirConfig, spotId: string, now: number) {
  try {
    const row = await db.prepare(`SELECT a.id, a.spot, a.kind, a.template, a.starts_at, a.ends_at, a.seats, a.reward, a.voided_at,
        (SELECT COUNT(*) FROM air_assignment_fills f WHERE f.assignment_id = a.id) AS filled
      FROM air_assignments a WHERE a.voided_at IS NULL AND a.ends_at > ? AND a.spot = ? ORDER BY a.starts_at, a.id LIMIT 1`).bind(now, spotId).first<AssignRow>();
    return row ? assignmentView(config, row, now) : null;
  } catch {
    return null;
  }
}

/**
 * What this phone did today. Crew membership is the phone's crew stamp for
 * today (as a guest, or under the account its rows were filed with), so a
 * phone that slept through the crew still gets the reveal when it wakes.
 */
async function yours(db: D1Database, t: Target, data: SpotData, now: number, device: string) {
  const pid: string = await pidHash(device);
  const today = laDate(now);
  const own = data.rows.find((r) => r.pid_hash === pid && r.day === today);
  let crewMember = false;
  if (data.crew) {
    const userId = [...data.rows, ...data.confirms].find((r) => r.pid_hash === pid && r.user_id)?.user_id ?? null;
    const dev = `dev:${pid}`;
    const stamp = await db.prepare(`SELECT 1 AS ok FROM air_stamps WHERE kind = 'crew' AND ref = ? AND day = ? AND owner IN (?, ?) LIMIT 1`)
      .bind(t.spot.id, today, dev, userId ? `user:${userId}` : dev).first<{ ok: number }>();
    crewMember = Boolean(stamp);
  }
  return {
    reportId: own?.id ?? null,
    confirmed: data.confirms.filter((c) => c.pid_hash === pid && laDate(c.at) === today).map((c) => c.report_id),
    crewMember,
  };
}

/** GET /api/air: every station at a glance, and whether Court Call is on. */
export async function stationsPayload(db: D1Database, config: AirConfig, now: number) {
  const stmts: D1PreparedStatement[] = [];
  for (const spot of config.spots) {
    const { kind, cfg } = firstKind(spot);
    stmts.push(
      ...evidenceStmts(db, spot.id, kind, now - (cfg.decayMin + CREW_WINDOW_MIN) * MIN, now - cfg.decayMin * MIN, 400),
      db.prepare(`SELECT MAX(observed_at) AS t FROM air_reports
        WHERE spot = ? AND kind = ? AND onsite = 1 AND status = 'ok' AND source = 'page'`).bind(spot.id, kind),
    );
  }
  const res = await db.batch(stmts);
  const spots = config.spots.map((spot, i) => {
    const { kind, cfg } = firstKind(spot);
    const r = reading({ spot: spot.id, cfg, rows: res[3 * i].results ?? [], confirms: res[3 * i + 1].results ?? [], now }) as Reading;
    const lastAt = (res[3 * i + 2].results?.[0] as { t: number | null } | undefined)?.t ?? null;
    return viewStation(spot, kind, r, lastAt);
  });
  const call = courtCallState(new Date(now));
  return { spots, courtCall: { live: call.live, minutesUntil: call.minutesUntil, minutesLeft: call.minutesLeft }, serverTime: isoSec(now) };
}

/** The live reading for one spot, for the unfurl card. No bylines needed. */
export async function liveReading(db: D1Database, t: Target, now: number): Promise<Reading> {
  const [rows, confirms] = await db.batch(evidenceStmts(db, t.spot.id, t.kind, now - (t.cfg.decayMin + CREW_WINDOW_MIN) * MIN, now - t.cfg.decayMin * MIN, 400));
  return reading({ spot: t.spot.id, cfg: t.cfg, rows: rows.results ?? [], confirms: confirms.results ?? [], now }) as Reading;
}

/* ---------- assignments: Field Report Assignments (spec §3.3-3.5) ---------- */

type AssignRow = {
  id: string; spot: string; kind: string; template: string; starts_at: number; ends_at: number;
  seats: number; reward: number; voided_at: number | null; filled: number;
};
type RecentRow = AssignRow & { void_reason: string | null; created_at: number; witnessed: number; fillers?: string[] };
type AssignFillRow = { assignment_id: string; template: string; spot: string; day: string; reward: number; witnessed_at: number | null };

// Every statement below is the one tests/air-assign.test.mjs cross-checks
// against pickAssignment() (the fill) and asserts literally (create, void,
// open, me, assigned): copied here verbatim, inline at each call site (every
// prepared statement in this file is), so the store and the pure rule never drift.

/**
 * Match a saved on-site report to an open assignment and pay its flat reward
 * (spec §3.4): the same rule as pickAssignment() in air-assign.mjs, run as one
 * INSERT so two phones racing for the last seat never both fill. Called from
 * fileReport's on-site branch (a row with status 'ok'), after points, only when canFill; wrapped in
 * its own try/catch there so a missing table or a write failure never blocks
 * the report. `net` is the fill's own network (spec §3.4: a signed-in phone is
 * its own network, else the report's IP); the 2-a-day cap counts fills by this
 * owner or on this network, as the seat rule does, so a guest cannot rotate
 * device ids past it. witnessed_at starts from an on-site "still" already on
 * file for this report and value (the report turned on-site, or a retry filled,
 * after its witness confirmed); later witnesses go through witnessAssignment.
 */
async function fillAssignment(
  db: D1Database, config: AirConfig, target: Target, saved: Saved, owner: string, who: Who, pid: string, ip: string, now: number,
): Promise<{ award: AssignAward; stamp: AssignStamp } | null> {
  if (!canFill({ onsite: 1, value: saved.value })) return null;
  const net: string = fillNet({ user_id: who.userId, ip_hash: ip, pid_hash: pid });
  const day: string = laDate(saved.observed_at);
  const row = await db.prepare(`INSERT OR IGNORE INTO air_assignment_fills (assignment_id, report_id, owner, net, day, reward, witnessed_at, created_at)
    SELECT a.id, ?1, ?2, ?3, ?4, a.reward,
      (SELECT MIN(c.at) FROM air_confirms c JOIN air_reports r ON r.id = c.report_id
        WHERE c.report_id = ?1 AND c.verdict = 'still' AND c.onsite = 1 AND c.value = r.value), ?5
    FROM air_assignments a
    WHERE a.spot = ?6 AND a.kind = ?7 AND a.voided_at IS NULL
      AND a.starts_at <= ?8 AND a.ends_at > ?8 AND a.created_by != ?2
      AND (SELECT COUNT(*) FROM air_assignment_fills f WHERE f.assignment_id = a.id) < a.seats
      AND NOT EXISTS (SELECT 1 FROM air_assignment_fills f WHERE f.assignment_id = a.id AND (f.owner = ?2 OR f.net = ?3))
      AND NOT EXISTS (SELECT 1 FROM air_assignment_fills f WHERE f.report_id = ?1)
      AND (SELECT COUNT(*) FROM air_assignment_fills f WHERE (f.owner = ?2 OR f.net = ?3) AND f.day = ?4) < 2
    ORDER BY a.ends_at, a.id LIMIT 1
    RETURNING assignment_id, reward`)
    .bind(saved.id, owner, net, day, now, target.spot.id, target.kind, saved.observed_at)
    .first<{ assignment_id: string; reward: number }>();
  if (!row) return null;
  const tpl = await db.prepare('SELECT template FROM air_assignments WHERE id = ?').bind(row.assignment_id).first<{ template: string }>();
  if (!tpl) return null;
  const filled = { assignment_id: row.assignment_id, template: tpl.template, spot: target.spot.id, day, reward: row.reward };
  return { award: assignAward(config, filled) as AssignAward, stamp: assignReceiptStamp(config, filled) as AssignStamp };
}

/**
 * Mark a fill WITNESSED (spec §3.4): an on-site "still" only, never a reward
 * change. Called from confirmReport after the confirm insert, only when
 * canWitness; wrapped in its own try/catch there.
 */
async function witnessAssignment(db: D1Database, reportId: string, now: number): Promise<void> {
  await db.prepare('UPDATE air_assignment_fills SET witnessed_at = ? WHERE report_id = ? AND witnessed_at IS NULL').bind(now, reportId).run();
}

/** The last 14 days of assignments, voided too, with each one's filler bylines. Director-only (GET /api/air/assign `recent`). */
async function loadRecentAssignments(db: D1Database, now: number): Promise<RecentRow[]> {
  const res = await db.prepare(`SELECT a.id, a.spot, a.kind, a.template, a.starts_at, a.ends_at, a.seats, a.reward, a.voided_at, a.void_reason, a.created_at,
      (SELECT COUNT(*) FROM air_assignment_fills f WHERE f.assignment_id = a.id) AS filled,
      (SELECT COUNT(*) FROM air_assignment_fills f WHERE f.assignment_id = a.id AND f.witnessed_at IS NOT NULL) AS witnessed
    FROM air_assignments a WHERE a.created_at >= ? ORDER BY a.created_at DESC LIMIT 50`).bind(now - 14 * DAY).all<RecentRow>();
  const rows = (res.results ?? []) as RecentRow[];
  if (!rows.length) return rows;
  const fillerRes = await db.batch(rows.map((r) => db.prepare(`SELECT f.assignment_id, r.byline FROM air_assignment_fills f JOIN air_reports r ON r.id = f.report_id
    WHERE f.assignment_id = ? ORDER BY f.created_at`).bind(r.id)));
  return rows.map((r, i) => ({ ...r, fillers: ((fillerRes[i].results ?? []) as { byline: string }[]).map((f) => f.byline) }));
}

/** GET /api/air/assign[?spot=]. Public; a director session additionally gets `recent`. */
export async function assignListPayload(db: D1Database, config: AirConfig, spot: string | null, director: boolean, now: number): Promise<Response> {
  const ahead = now + 8 * DAY;
  const openRes = spot
    ? await db.prepare(`SELECT a.id, a.spot, a.kind, a.template, a.starts_at, a.ends_at, a.seats, a.reward, a.voided_at,
        (SELECT COUNT(*) FROM air_assignment_fills f WHERE f.assignment_id = a.id) AS filled
      FROM air_assignments a WHERE a.voided_at IS NULL AND a.ends_at > ? AND a.starts_at < ? AND a.spot = ? ORDER BY a.starts_at, a.id LIMIT 20`).bind(now, ahead, spot).all<AssignRow>()
    : await db.prepare(`SELECT a.id, a.spot, a.kind, a.template, a.starts_at, a.ends_at, a.seats, a.reward, a.voided_at,
        (SELECT COUNT(*) FROM air_assignment_fills f WHERE f.assignment_id = a.id) AS filled
      FROM air_assignments a WHERE a.voided_at IS NULL AND a.ends_at > ? AND a.starts_at < ? ORDER BY a.starts_at, a.id LIMIT 20`).bind(now, ahead).all<AssignRow>();
  const recent = director ? await loadRecentAssignments(db, now) : null;
  return json(viewAssignList(config, (openRes.results ?? []) as AssignRow[], director, recent, now));
}

/** POST /api/air/assign {action:'create', ...parseAssign output}. House-only (checked by the route). */
export async function createAssignment(
  db: D1Database, config: AirConfig,
  p: { template: string; spot: string; kind: string; startsAt: number; endsAt: number; seats: number; reward: number },
  createdBy: string, now: number,
): Promise<Response> {
  const row = await db.prepare(`INSERT INTO air_assignments (id, spot, kind, template, starts_at, ends_at, seats, reward, created_by, created_at)
    SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10
    WHERE (SELECT COUNT(*) FROM air_assignments WHERE spot = ?2 AND voided_at IS NULL AND ends_at > ?10) < 3
      AND (SELECT COUNT(*) FROM air_assignments WHERE created_at >= ?11) < 20
    RETURNING id`)
    .bind(newAirId('aa'), p.spot, p.kind, p.template, p.startsAt, p.endsAt, p.seats, p.reward, createdBy, now, laDayStart(now))
    .first<{ id: string }>();
  if (!row) return fail('too-many-open', 409);
  const view = assignmentView(config, {
    id: row.id, spot: p.spot, kind: p.kind, template: p.template, starts_at: p.startsAt, ends_at: p.endsAt,
    seats: p.seats, reward: p.reward, voided_at: null, filled: 0,
  }, now);
  return json(viewAssignCreated(view), 201);
}

/** POST /api/air/assign {action:'void', id, voidReason}. House-only (checked by the route). Filled seats keep their points. */
export async function voidAssignment(db: D1Database, id: string, voidReason: string | null, now: number): Promise<Response> {
  const res = await db.prepare('UPDATE air_assignments SET voided_at = ?, void_reason = ? WHERE id = ? AND voided_at IS NULL').bind(now, voidReason, id).run();
  if ((res.meta?.changes ?? 0) === 0) return fail('not-found', 404);
  return json(viewAssignVoided());
}

/* ---------- writes ---------- */

/**
 * Before any write: D1-counted limits (reports or confirms per phone per
 * hour; reports plus confirms per hashed IP per 10 minutes, a burst ceiling
 * because friends at the courts share an IP) and the spot code check. Rows
 * are counted by when the server wrote them (created_at, and a confirm's `at`
 * is server time too): a report may be backdated 15 minutes, and counting by
 * observed_at would let a backdated flood skip the ten-minute ceiling.
 */
async function writeGate(db: D1Database, g: { pid: string; ip: string; spot: string; code: string | null; pepper?: string; now: number; kind: 'report' | 'confirm' }) {
  const { pid, ip, now } = g;
  const hourAgo = now - HOUR;
  const tenAgo = now - 10 * MIN;
  const stmts = [
    g.kind === 'report'
      ? db.prepare('SELECT COUNT(*) AS n, MIN(created_at) AS oldest FROM air_reports WHERE pid_hash = ? AND created_at >= ?').bind(pid, hourAgo)
      : db.prepare('SELECT COUNT(*) AS n, MIN(at) AS oldest FROM air_confirms WHERE pid_hash = ? AND at >= ?').bind(pid, hourAgo),
    db.prepare('SELECT COUNT(*) AS n, MIN(created_at) AS oldest FROM air_reports WHERE ip_hash = ? AND created_at >= ?').bind(ip, tenAgo),
    db.prepare('SELECT COUNT(*) AS n, MIN(at) AS oldest FROM air_confirms WHERE ip_hash = ? AND at >= ?').bind(ip, tenAgo),
  ];
  const today = laDate(now);
  const hash: string | null = g.code ? await codeHash(g.spot, g.code, g.pepper) : null;
  if (hash) stmts.push(db.prepare('SELECT 1 AS ok FROM air_codes WHERE spot = ? AND code_hash = ? AND valid_from <= ? AND valid_to >= ?').bind(g.spot, hash, today, today));
  const res = await db.batch(stmts);
  const count = (i: number) => res[i].results?.[0] as { n: number; oldest: number | null } | undefined;
  const mine = count(0);
  const cap = g.kind === 'report' ? AIR_LIMITS.reportsPerHour : AIR_LIMITS.confirmsPerHour;
  const wait = (oldest: number | null | undefined, span: number) => Math.max(1, Math.ceil(((oldest ?? now) + span - now) / 1000));
  if (Number(mine?.n ?? 0) >= cap) return { retryAfter: wait(mine?.oldest, HOUR), onsite: false };
  const ipReports = count(1);
  const ipConfirms = count(2);
  if (Number(ipReports?.n ?? 0) + Number(ipConfirms?.n ?? 0) >= AIR_LIMITS.ipWritesPer10Min) {
    const oldest = Math.min(ipReports?.oldest ?? now, ipConfirms?.oldest ?? now);
    return { retryAfter: wait(oldest, 10 * MIN), onsite: false };
  }
  return { retryAfter: 0, onsite: Boolean(hash && res[3]?.results?.length) };
}

/**
 * Pay awards in order, each capped inside its INSERT against what the owner
 * already has that day, so two requests at once cannot pass the cap.
 * UNIQUE (owner, action, ref) makes each pay once. Returns the units paid and
 * the actions that were written now (a capped award is written with 0 units).
 */
async function payPoints(db: D1Database, owner: string, awards: { action: string; ref: string; units: number; day: string }[], reportId: string, now: number): Promise<{ units: number; paid: string[] }> {
  if (!awards.length) return { units: 0, paid: [] };
  const res = await db.batch(awards.map((a) => db.prepare(`INSERT OR IGNORE INTO air_points (id, owner, action, ref, units, day, report_id, created_at)
    SELECT ?, ?, ?, ?, MAX(0, MIN(?, ? - COALESCE(SUM(units), 0))), ?, ?, ? FROM air_points WHERE owner = ? AND day = ?
    RETURNING units`).bind(newAirId('ap'), owner, a.action, a.ref, a.units, DAILY_CAP, a.day, reportId, now, owner, a.day)));
  const rows = res.map((r) => r.results?.[0] as { units?: number } | undefined);
  return { units: rows.reduce((sum, r) => sum + Number(r?.units ?? 0), 0), paid: awards.filter((_, i) => rows[i]).map((a) => a.action) };
}

/** Insert stamps once each (UNIQUE owner, kind, ref, day); every row carries the rarity traits. */
async function putStamps(db: D1Database, rows: { owner: string; stamp: Stamp }[], traits: object, reportId: string | null, now: number): Promise<(HeldStamp & { owner: string })[]> {
  if (!rows.length) return [];
  const meta = JSON.stringify(traits);
  const res = await db.batch(rows.map(({ owner, stamp }) => db.prepare(`INSERT OR IGNORE INTO air_stamps (id, owner, kind, ref, day, report_id, meta_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(newAirId('as'), owner, stamp.kind, stamp.ref, stamp.day, reportId, meta, now)));
  return rows.map(({ owner, stamp }, i) => ({ ...stamp, owner, fresh: (res[i].meta?.changes ?? 0) > 0 }));
}

/** Points today and the weekly streak for one owner, in one round trip. */
async function standing(db: D1Database, owner: string, who: Who, pid: string, now: number) {
  const since = now - 104 * 7 * DAY;
  const [points, days, confirms] = await db.batch([
    db.prepare('SELECT COALESCE(SUM(units), 0) AS n FROM air_points WHERE owner = ? AND day = ?').bind(owner, laDate(now)),
    who.userId
      ? db.prepare(`SELECT DISTINCT day FROM air_reports WHERE user_id = ? AND onsite = 1 AND status = 'ok' AND source = 'page' AND observed_at >= ?`).bind(who.userId, since)
      : db.prepare(`SELECT DISTINCT day FROM air_reports WHERE pid_hash = ? AND user_id IS NULL AND onsite = 1 AND status = 'ok' AND source = 'page' AND observed_at >= ?`).bind(pid, since),
    who.userId
      ? db.prepare('SELECT at FROM air_confirms WHERE user_id = ? AND onsite = 1 AND at >= ? ORDER BY at DESC LIMIT 2000').bind(who.userId, since)
      : db.prepare('SELECT at FROM air_confirms WHERE pid_hash = ? AND user_id IS NULL AND onsite = 1 AND at >= ? ORDER BY at DESC LIMIT 2000').bind(pid, since),
  ]);
  const entries = [
    ...((days.results ?? []) as { day: string }[]).map((r) => ({ day: r.day, onsite: 1 })),
    ...((confirms.results ?? []) as { at: number }[]).map((c) => ({ day: laDate(c.at), onsite: 1 })),
  ];
  return { pointsToday: Number((points.results?.[0] as { n?: number } | undefined)?.n ?? 0), streakWeeks: streakWeeks(entries, now) as number };
}

type Station = { spot: string; mhz: number; color: string; noun: number; who: string };

/**
 * Write a window's station post from its air_broadcasts row. The row, not the
 * caller, says what the post reads, and it is read again after every write: a
 * first post whose put lands after the crew update is written over with the
 * crew line a second later, so the feed never keeps "1 reporter" for a window
 * that filled. A failed write (KV allows one per key per second) retries a
 * second later. Three writes at most; runs after the response.
 */
async function publish(env: AirEnv, db: D1Database, station: Station, kind: string, win: string, delayMs: number, origin: string): Promise<void> {
  const read = () => db.prepare('SELECT post_id, text FROM air_broadcasts WHERE spot = ? AND kind = ? AND win = ?')
    .bind(station.spot, kind, win).first<{ post_id: string; text: string }>();
  if (delayMs > 0) await sleep(delayMs);
  let wrote = '';
  for (let i = 0; i < 3; i++) {
    let row = await read();
    if (!row || row.text === wrote) return;
    if (i > 0) { await sleep(KV_GAP_MS); row = (await read()) ?? row; }
    try {
      await writeStationPost(env, { ...station, id: row.post_id, text: row.text }, origin);
      wrote = row.text;
    } catch { /* KV busy or down: the next pass tries again */ }
  }
}

/**
 * Anchor the day's crew. The first formation writes air_crews and is the crew
 * from then on (its id, its time); a later sliding window of the same people
 * joins it and only raises n, the people stamped into it today. `formed` is
 * true when `crew` is that first formation, the only crew that updates a post.
 * Call after the members' crew stamps are in.
 */
async function anchorCrew(db: D1Database, t: Target, crew: Crew): Promise<CrewRow & { formed: boolean }> {
  const day = laDate(crew.at);
  const [, row] = await db.batch([
    db.prepare(`INSERT INTO air_crews (spot, kind, day, id, at, n)
      VALUES (?, ?, ?, ?, ?, MAX(?, (SELECT COUNT(*) FROM air_stamps WHERE kind = 'crew' AND ref = ? AND day = ?)))
      ON CONFLICT (spot, kind, day) DO UPDATE SET n = excluded.n WHERE excluded.n > air_crews.n`).bind(t.spot.id, t.kind, day, crew.id, crew.at, crew.n, t.spot.id, day),
    db.prepare('SELECT id, at, n FROM air_crews WHERE spot = ? AND kind = ? AND day = ?').bind(t.spot.id, t.kind, day),
  ]);
  const anchor = (row.results?.[0] as CrewRow | undefined) ?? { id: crew.id, at: crew.at, n: crew.n };
  return { ...anchor, formed: anchor.id === crew.id };
}

/**
 * The dial and the crew, after an on-site write.
 * - Crew: 3+ distinct on-site phones from 2+ networks in 30 minutes. Every
 *   member's owner gets a crew stamp and the MORNING CREW badge (idempotent,
 *   so a fourth phone joining later earns them too). The day's first crew is
 *   the crew (anchorCrew); its window's post updates once, when the
 *   air_broadcasts upsert sets crew_at, at least a second after the first post.
 * - First post: the first on-site report with a real answer in a spot's
 *   decay window claims air_broadcasts, then writes the post.
 * "Can't say" alone never goes on the air. Posts go out after the response.
 */
async function onAir(env: AirEnv, db: D1Database, t: Target, data: SpotData, now: number, reportAt: number | null, origin: string, defer: Defer) {
  const r = reading({ spot: t.spot.id, cfg: t.cfg, rows: data.rows, confirms: data.confirms, now }) as Reading;
  const crew = crewFrom({ spot: t.spot.id, cfg: t.cfg, rows: data.rows, confirms: data.confirms, now }) as Crew | null;
  const said = r.value != null && r.value !== 'cant';
  const station: Station = { spot: t.spot.id, mhz: t.spot.mhz, color: t.spot.color, noun: t.spot.noun, who: t.spot.name };
  let crewStamps: (HeldStamp & { owner: string })[] = [];
  let anchor: CrewRow | null = null;
  let crewWin = '';
  if (crew) {
    const window = (evidence(data.rows, data.confirms) as { t: number }[]).filter((e) => e.t >= now - CREW_WINDOW_MIN * MIN && e.t <= now);
    const since = Math.min(crew.at, ...window.map((e) => e.t));
    const traits = stampTraits({ spot: t.spot.id, kind: t.kind, answer: r.value, observedAt: crew.at, crewSize: crew.n, prevOnsiteAt: await prevOnsiteAt(db, t.spot.id, since, '') });
    const day = laDate(crew.at);
    crewStamps = await putStamps(db, crew.members.flatMap((m) => [
      { owner: m.owner, stamp: crewStamp(t.spot.id, day) as Stamp },
      { owner: m.owner, stamp: badgeStamp('morning-crew') as Stamp },
    ]), traits, null, now);
    const held = await anchorCrew(db, t, crew);
    anchor = { id: held.id, at: held.at, n: held.n };
    if (said && held.formed) {
      crewWin = winKey(crew.at, t.cfg.decayMin);
      const text = stationLine({ name: t.spot.name, label: r.label, support: r.support, at: crew.at });
      const fresh = stationPostId(now);
      const row = await db.prepare(`INSERT INTO air_broadcasts (spot, kind, win, post_id, support, crew_at, text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (spot, kind, win) DO UPDATE SET crew_at = excluded.crew_at, support = excluded.support, text = excluded.text WHERE air_broadcasts.crew_at IS NULL
        RETURNING post_id, created_at`).bind(t.spot.id, t.kind, crewWin, fresh, r.support, crew.at, text, now).first<{ post_id: string; created_at: number }>();
      // Updating a first post: wait until a second after it went out, so the two writes never share a KV second.
      if (row) defer(publish(env, db, station, t.kind, crewWin, row.post_id === fresh ? 0 : Math.max(0, row.created_at + KV_GAP_MS - now), origin).catch(() => null));
      else crewWin = '';
    }
  }
  if (said && reportAt != null) {
    const win = winKey(reportAt, t.cfg.decayMin);
    if (win !== crewWin) {
      const text = stationLine({ name: t.spot.name, label: r.label, support: r.support, at: reportAt });
      const claimed = await db.prepare(`INSERT OR IGNORE INTO air_broadcasts (spot, kind, win, post_id, support, crew_at, text, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`)
        .bind(t.spot.id, t.kind, win, stationPostId(now), r.support, text, now).run();
      if ((claimed.meta?.changes ?? 0) > 0) defer(publish(env, db, station, t.kind, win, 0, origin).catch(() => null));
    }
  }
  if (anchor) data.crew = anchor;
  return { crew, anchor, crewStamps };
}

/** POST /api/air/[spot]: file a report. `p` is parseAirReport() output. */
export async function fileReport(request: Request, env: AirEnv, db: D1Database, config: AirConfig, p: ParsedReport, now: number, defer: Defer): Promise<Response> {
  const t = targetOf(config, p.spot);
  const cfg = t ? kindOf(config, p.spot, p.kind) as AirKind | null : null;
  if (!t || !cfg) return fail('bad-spot');
  const target: Target = { ...t, kind: p.kind, cfg };
  // Only a live kind (the default) takes First Light, goes on the air or forms a crew.
  const live = kindRole(cfg) === 'live';
  const pid: string = await pidHash(p.device);
  const ip: string = await ipHash(clientIp(request), laDate(now), env.AIR_IP_SALT);
  const gate = await writeGate(db, { pid, ip, spot: p.spot, code: p.code, pepper: env.AIR_CODE_PEPPER, now, kind: 'report' });
  if (gate.retryAfter) return limited(gate.retryAfter);
  const onsite = gate.onsite;
  const who = await whoIs(request, env);
  const byline = !p.asGuest && who.handle ? `@${who.handle}` : guestByline(pid);
  const owner: string = ownerOf({ user_id: who.userId, pid_hash: pid });
  const id: string = newAirId('ar');

  // One row per phone per slot. A newer tap in the same slot replaces the
  // answer (and can only raise onsite); an older queued one changes nothing.
  const upsert = await db.prepare(`INSERT INTO air_reports (id, spot, kind, value, extras_json, observed_at, day, slot, pid_hash, ip_hash, user_id, byline, onsite, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (spot, kind, pid_hash, slot) DO UPDATE SET value = excluded.value, extras_json = excluded.extras_json,
      observed_at = excluded.observed_at, onsite = MAX(air_reports.onsite, excluded.onsite)
    WHERE excluded.observed_at >= air_reports.observed_at AND air_reports.status = 'ok'
    RETURNING id, value, observed_at, byline, onsite, awarded_at, status`)
    .bind(id, p.spot, p.kind, p.value, JSON.stringify(p.extras), p.observedAt, laDate(p.observedAt), slotOf(p.observedAt), pid, ip, who.userId, byline, onsite ? 1 : 0, now)
    .first<Saved>();
  const saved = upsert ?? await db.prepare('SELECT id, value, observed_at, byline, onsite, awarded_at, status FROM air_reports WHERE spot = ? AND kind = ? AND pid_hash = ? AND slot = ?')
    .bind(p.spot, p.kind, pid, slotOf(p.observedAt)).first<Saved>();
  if (!saved) return unavailable();
  const replaced = saved.id !== id;
  const isOnsite = saved.onsite === 1;

  // Awards follow the saved row, not the request (an older queued tap keeps the newer answer).
  let points = 0;
  let firstLight = false;
  let held: HeldStamp[] = [];
  let assignment: { award: AssignAward; stamp: AssignStamp } | null = null;
  // A row the house flagged or removed earns nothing more: a same-slot re-tap
  // skips the upsert and reads the old row back, which must not take first
  // light, a late award or an assignment seat.
  if (isOnsite && saved.status === 'ok') {
    const day: string = laDate(saved.observed_at);
    // First light: the first real on-site answer of the day at this spot, inside
    // its open hours (a report from bed at 00:01 files but never claims it).
    // Checked on every on-site write, so an answer that moves off "Can't say", a
    // remote row that turns on-site and a retried request all find their own claim.
    let holdsFirst = false;
    if (live && firstLightOpen({ spot: t.spot, value: saved.value, observedAt: saved.observed_at })) {
      const [, holder] = await db.batch([
        db.prepare('INSERT OR IGNORE INTO air_firsts (spot, day, report_id) VALUES (?, ?, ?)').bind(p.spot, day, saved.id),
        db.prepare('SELECT report_id FROM air_firsts WHERE spot = ? AND day = ?').bind(p.spot, day),
      ]);
      holdsFirst = (holder.results?.[0] as { report_id?: string } | undefined)?.report_id === saved.id;
    }
    // A row pays once: new, just turned on-site, or retried after a write that
    // failed before awarded_at was set (every award below is idempotent). A
    // paid row only adds a first light it has just taken.
    const unpaid = saved.awarded_at == null;
    const all = reportAwards({
      spot: p.spot, kind: p.kind, value: saved.value, onsite: true, observedAt: saved.observed_at, decayMin: cfg.decayMin, firstLight: holdsFirst,
      units: cfg.points ?? 6, payEvery: cfg.payEvery ?? null,
    });
    const pay = await payPoints(db, owner, unpaid ? all : all.filter((a: { action: string }) => a.action === 'first-light'), saved.id, now);
    points = pay.units;
    firstLight = holdsFirst && (unpaid || pay.paid.includes('first-light'));
    const stamps: Stamp[] = [
      ...(unpaid ? [placeStamp(p.spot, day) as Stamp] : []),
      ...(unpaid || firstLight ? badgesFor({ firstLight: holdsFirst }).map((b: string) => badgeStamp(b) as Stamp) : []),
    ];
    if (stamps.length) {
      const traits = stampTraits({ spot: p.spot, kind: p.kind, answer: saved.value, observedAt: saved.observed_at, firstLight: holdsFirst, prevOnsiteAt: await prevOnsiteAt(db, p.spot, saved.observed_at, saved.id) });
      held = await putStamps(db, stamps.map((stamp) => ({ owner, stamp })), traits, saved.id, now);
    }
    if (unpaid) await db.prepare('UPDATE air_reports SET awarded_at = ? WHERE id = ?').bind(now, saved.id).run();
    // Field Report Assignments (spec §3.4): a seat, and its flat reward, on
    // the same proof the report just paid on. Never blocks the report: a
    // missing air_assignments table or a write failure just means no fill.
    try {
      assignment = await fillAssignment(db, config, target, saved, owner, who, pid, ip, now);
    } catch { /* no fill */ }
  }

  const data = await loadSpot(db, target, now);
  data.confirms = await withBylines(env, data.confirms);
  const air = live && isOnsite && upsert ? await onAir(env, db, target, data, now, saved.observed_at, new URL(request.url).origin, defer) : null;
  const mine = air?.crewStamps.filter((s) => s.owner === owner) ?? [];
  const member = Boolean(air?.crew?.members.some((m) => m.pid_hash === pid));
  const { pointsToday, streakWeeks: weeks } = await standing(db, owner, who, pid, now);
  const codeStatus = !p.code ? 'none' : onsite ? 'ok' : 'unknown';
  return json(viewFiled({
    t: target, data, now, replaced, saved, codeStatus, signedIn: Boolean(who.userId),
    award: {
      points, pointsToday, streakWeeks: weeks, firstLight, crew: member ? air?.anchor ?? null : null,
      // The ASSIGNMENT stamp rides with the held stamps for the receipt only (RECEIPT_ORDER ranks it first); it was never written to air_stamps.
      held: [...held, ...mine, ...(assignment ? [assignment.stamp] : [])], assignment: assignment?.award ?? null,
    },
  }), replaced ? 200 : 201);
}

/** POST /api/air/confirm. `c` is parseConfirm() output. */
export async function confirmReport(request: Request, env: AirEnv, db: D1Database, config: AirConfig, c: ParsedConfirm, now: number, defer: Defer): Promise<Response> {
  const [found, still] = await db.batch([
    db.prepare('SELECT id, spot, kind, value, observed_at, day, pid_hash, ip_hash, user_id, byline, onsite, status, source FROM air_reports WHERE id = ?').bind(c.reportId),
    db.prepare(`SELECT MAX(c.at) AS t FROM air_confirms c JOIN air_reports r ON r.id = c.report_id
      WHERE c.report_id = ? AND c.verdict = 'still' AND c.onsite = 1 AND c.value = r.value`).bind(c.reportId),
  ]);
  const report = ((found.results ?? [])[0] as ReportRow | undefined) ?? null;
  const t = report ? targetOf(config, report.spot) : null;
  const cfg = report && t ? kindOf(config, report.spot, report.kind) as AirKind | null : null;
  if (!report || report.status !== 'ok' || !t || !cfg) return fail('not-found', 404);
  // A rating is an aggregate, not a claim about now: nothing to confirm.
  const role = kindRole(cfg);
  if (role === 'rating') return fail('not-confirmable');
  const target: Target = { ...t, kind: report.kind, cfg };
  const pid: string = await pidHash(c.device);
  const who = await whoIs(request, env);
  if (report.pid_hash === pid || (who.userId && report.user_id === who.userId)) return fail('own-report');
  // A report stays confirmable while its newest on-site "still" is live, as the
  // reading does: confirms keep a reading on the air past its first report.
  const liveAt = Math.max(report.observed_at, Number((still.results?.[0] as { t?: number | null } | undefined)?.t ?? 0));
  if (now - liveAt >= cfg.decayMin * MIN) return fail('expired', 410);
  const ip: string = await ipHash(clientIp(request), laDate(now), env.AIR_IP_SALT);
  const gate = await writeGate(db, { pid, ip, spot: report.spot, code: c.code, pepper: env.AIR_CODE_PEPPER, now, kind: 'confirm' });
  if (gate.retryAfter) return limited(gate.retryAfter);
  // Device ids are free, so a confirm from the reporter's own network is the
  // reporter agreeing with themselves unless it comes from a different signed-in
  // account. It is kept, but from away: no support, crew or points.
  const sameNet = report.ip_hash === ip && !(who.userId && who.userId !== report.user_id);
  const onsite = gate.onsite && !sameNet;
  const origin = new URL(request.url).origin;

  const inserted = await db.prepare('INSERT OR IGNORE INTO air_confirms (report_id, pid_hash, ip_hash, user_id, verdict, value, onsite, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(report.id, pid, ip, who.userId, c.verdict, report.value, onsite ? 1 : 0, now).run();
  if ((inserted.meta?.changes ?? 0) === 0) {
    const data = await loadSpot(db, target, now);
    data.confirms = await withBylines(env, data.confirms);
    return fail('already-confirmed', 409, { reading: viewReading(target, data, now) });
  }
  // Field Report Assignments (spec §3.4): an on-site "still" marks the fill
  // WITNESSED. The mark never pays — agreement is never paid for — and never
  // blocks the confirm.
  if (canWitness({ onsite, verdict: c.verdict })) {
    try { await witnessAssignment(db, report.id, now); } catch { /* no mark */ }
  }

  const owner: string = ownerOf({ user_id: who.userId, pid_hash: pid });
  let points = 0;
  let held: HeldStamp[] = [];
  if (onsite) {
    points = (await payPoints(db, owner, confirmAwards({ reportId: report.id, verdict: c.verdict, onsite: true, at: now }), report.id, now)).units;
    const given = who.userId
      ? await db.prepare('SELECT COUNT(*) AS n FROM air_confirms WHERE user_id = ? AND onsite = 1').bind(who.userId).first<{ n: number }>()
      : await db.prepare('SELECT COUNT(*) AS n FROM air_confirms WHERE pid_hash = ? AND user_id IS NULL AND onsite = 1').bind(pid).first<{ n: number }>();
    const traits = stampTraits({ spot: report.spot, kind: report.kind, answer: report.value, observedAt: now, prevOnsiteAt: await prevOnsiteAt(db, report.spot, now, '') });
    const stamps: Stamp[] = [placeStamp(report.spot, laDate(now)), ...badgesFor({ onsiteConfirmsGiven: Number(given?.n ?? 0) }).map((b: string) => badgeStamp(b))];
    held = await putStamps(db, stamps.map((stamp) => ({ owner, stamp })), traits, report.id, now);
  }

  const data = await loadSpot(db, target, now);
  data.confirms = await withBylines(env, data.confirms);
  const air = role === 'live' && onsite && c.verdict === 'still' ? await onAir(env, db, target, data, now, null, origin, defer) : null;
  const mine = air?.crewStamps.filter((s) => s.owner === owner) ?? [];
  const member = Boolean(air?.crew?.members.some((m) => m.pid_hash === pid));
  const { pointsToday, streakWeeks: weeks } = await standing(db, owner, who, pid, now);
  return json(viewConfirmed({
    t: target, data, now, verdict: c.verdict, onsite, signedIn: Boolean(who.userId),
    award: { points, pointsToday, streakWeeks: weeks, firstLight: false, held: [...held, ...mine], crew: member ? air?.anchor ?? null : null },
  }));
}

/** GET /api/air/me: the caller's own card — by session, by device header, or both. */
export async function mePayload(request: Request, env: AirEnv, db: D1Database, config: AirConfig, device: string | null, now: number): Promise<Response> {
  const who = await whoIs(request, env);
  if (!who.userId && !device) return fail('bad-device');
  const pid: string = device ? await pidHash(device) : '';
  const owner: string = who.userId ? `user:${who.userId}` : `dev:${pid}`;
  const [today, total, stamps, reports] = await db.batch([
    db.prepare('SELECT COALESCE(SUM(units), 0) AS n FROM air_points WHERE owner = ? AND day = ?').bind(owner, laDate(now)),
    db.prepare('SELECT COALESCE(SUM(units), 0) AS n FROM air_points WHERE owner = ?').bind(owner),
    db.prepare('SELECT kind, ref, day, meta_json, created_at FROM air_stamps WHERE owner = ? ORDER BY created_at DESC LIMIT 200').bind(owner),
    who.userId
      ? db.prepare('SELECT id, spot, kind, value, observed_at, byline, onsite, status FROM air_reports WHERE user_id = ? ORDER BY observed_at DESC LIMIT 20').bind(who.userId)
      : db.prepare('SELECT id, spot, kind, value, observed_at, byline, onsite, status FROM air_reports WHERE pid_hash = ? AND user_id IS NULL ORDER BY observed_at DESC LIMIT 20').bind(pid),
  ]);
  const { streakWeeks: weeks } = await standing(db, owner, who, pid, now);
  // Field Report Assignments (spec §3.4): points.assigned and the caller's own
  // fills. Its own query, never part of the batch above: no air_assignments
  // table yet just means nothing assigned, not a broken /me.
  let assignedPoints = 0;
  let assignFills: AssignFillRow[] = [];
  try {
    const [assigned, fills] = await db.batch([
      db.prepare('SELECT COALESCE(SUM(reward), 0) AS n FROM air_assignment_fills WHERE owner = ?').bind(owner),
      db.prepare(`SELECT f.assignment_id, a.template, a.spot, f.day, f.reward, f.witnessed_at FROM air_assignment_fills f
        JOIN air_assignments a ON a.id = f.assignment_id WHERE f.owner = ? ORDER BY f.created_at DESC LIMIT 50`).bind(owner),
    ]);
    assignedPoints = Number((assigned.results?.[0] as { n?: number } | undefined)?.n ?? 0);
    assignFills = (fills.results ?? []) as AssignFillRow[];
  } catch { /* no assignments */ }
  // Signed in with this phone's unclaimed rows still on it: say what a claim would move.
  let claimable = null;
  if (who.userId && device) {
    const since = now - DAY;
    const [r, p, s] = await db.batch([
      db.prepare('SELECT COUNT(*) AS n FROM air_reports WHERE pid_hash = ? AND user_id IS NULL AND created_at >= ?').bind(pid, since),
      db.prepare('SELECT COUNT(*) AS n FROM air_points WHERE owner = ? AND created_at >= ?').bind(`dev:${pid}`, since),
      db.prepare('SELECT COUNT(*) AS n FROM air_stamps WHERE owner = ? AND created_at >= ?').bind(`dev:${pid}`, since),
    ]);
    const n = (x: D1Result) => Number((x.results?.[0] as { n?: number } | undefined)?.n ?? 0);
    claimable = { reports: n(r), points: n(p), stamps: n(s) };
  }
  const byline = who.handle ? `@${who.handle}` : device ? guestByline(pid) : null;
  return json(viewMe(config, {
    signedIn: Boolean(who.userId), byline, now, claimable, streakWeeks: weeks,
    points: { today: Number((today.results?.[0] as { n?: number } | undefined)?.n ?? 0), total: Number((total.results?.[0] as { n?: number } | undefined)?.n ?? 0) },
    assigned: assignedPoints, assignFills,
    stamps: (stamps.results ?? []) as { kind: Stamp['kind']; ref: string; day: string; meta_json: string; created_at: number }[],
    reports: (reports.results ?? []) as { id: string; spot: string; kind: string; value: string; observed_at: number; byline: string; onsite: number; status: string }[],
  }));
}

/**
 * POST /api/air/claim: move this phone's last 24 hours (reports and confirms
 * without an account, points, stamps) to the signed-in account, and put the
 * card @handle on those reports. Stamps move with UPDATE OR IGNORE (one the
 * account already holds stays with the phone). Points are re-paid into the
 * account under the same daily cap payPoints applies, in the order they were
 * earned, and leave the phone; an award the account already has is dropped.
 * One transaction.
 */
export async function claimDevice(db: D1Database, who: Who & { userId: string }, device: string, now: number): Promise<Response> {
  const pid: string = await pidHash(device);
  const since = now - DAY;
  const byline = who.handle ? `@${who.handle}` : null;
  const user = `user:${who.userId}`;
  const dev = `dev:${pid}`;
  const [reports, confirms, points, , stamps] = await db.batch([
    db.prepare('UPDATE OR IGNORE air_reports SET user_id = ?, byline = COALESCE(?, byline) WHERE pid_hash = ? AND user_id IS NULL AND created_at >= ?').bind(who.userId, byline, pid, since),
    db.prepare('UPDATE OR IGNORE air_confirms SET user_id = ? WHERE pid_hash = ? AND user_id IS NULL AND at >= ?').bind(who.userId, pid, since),
    // Room left under the cap = cap − the account's day so far − the phone's earlier rows that day.
    db.prepare(`INSERT OR IGNORE INTO air_points (id, owner, action, ref, units, day, report_id, created_at)
      SELECT 'ap_' || lower(hex(randomblob(10))), ?, d.action, d.ref,
        MAX(0, MIN(d.units, ? - COALESCE((SELECT SUM(u.units) FROM air_points u WHERE u.owner = ? AND u.day = d.day), 0)
          - COALESCE(SUM(d.units) OVER (PARTITION BY d.day ORDER BY d.created_at, d.id ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0))),
        d.day, d.report_id, d.created_at
      FROM air_points d
      WHERE d.owner = ? AND d.created_at >= ?
        AND NOT EXISTS (SELECT 1 FROM air_points x WHERE x.owner = ? AND x.action = d.action AND x.ref = d.ref)`).bind(user, DAILY_CAP, user, dev, since, user),
    db.prepare(`DELETE FROM air_points WHERE owner = ? AND created_at >= ?
      AND EXISTS (SELECT 1 FROM air_points x WHERE x.owner = ? AND x.action = air_points.action AND x.ref = air_points.ref)`).bind(dev, since, user),
    db.prepare('UPDATE OR IGNORE air_stamps SET owner = ? WHERE owner = ? AND created_at >= ?').bind(user, dev, since),
  ]);
  // Field Report Assignments: move this phone's fills too. Kept out of the
  // batch above (and its own try/catch) so a missing air_assignments table
  // never breaks the claim the other four rows already made.
  try { await db.prepare('UPDATE OR IGNORE air_assignment_fills SET owner = ? WHERE owner = ? AND created_at >= ?').bind(user, dev, since).run(); } catch { /* no fills to move */ }
  const moved = (r: D1Result) => Number(r.meta?.changes ?? 0);
  return json({ ok: true, moved: { reports: moved(reports), confirms: moved(confirms), points: moved(points), stamps: moved(stamps) }, byline });
}

/* ---------- views: every response body is shaped below; no hashes past this line ---------- */

function viewSpot(t: Target) {
  const { spot, kind, cfg } = t;
  return {
    id: spot.id, name: spot.name, short: spot.short, channel: spot.channel, color: spot.color, mhz: spot.mhz,
    kind, question: cfg.question, options: cfg.options, extras: cfg.extras, decayMin: cfg.decayMin, courtCall: spot.courtCall ?? null,
  };
}

/** The reading, with the day's anchored crew in place of the sliding window's (one crew, one id, all day). */
function viewReading(t: Target, data: SpotData, now: number): Reading {
  const r = reading({ spot: t.spot.id, cfg: t.cfg, rows: data.rows, confirms: data.confirms, now }) as Reading;
  return { ...r, crew: data.crew ? { id: data.crew.id, n: data.crew.n, at: isoSec(data.crew.at) } : null };
}

/** Today's rows, LA day, newest first, 20 at most. Remote and agent rows show; they just never count. */
function viewToday(t: Target, data: SpotData, now: number) {
  const today = laDate(now);
  const decay = t.cfg.decayMin * MIN;
  return data.rows.filter((r) => r.day === today).sort((a, b) => b.observed_at - a.observed_at).slice(0, 20).map((r) => ({
    id: r.id, at: laClock(r.observed_at, { pad: true }), byline: r.byline, value: r.value, label: labelOf(t.cfg, r.value) as string,
    onsite: r.onsite === 1, agent: r.source !== 'page',
    confirms: data.confirms.filter((c) => c.report_id === r.id && c.verdict === 'still' && c.onsite === 1).length,
    live: now - r.observed_at < decay,
  }));
}

function viewPayload(t: Target, data: SpotData, now: number, you: { reportId: string | null; confirmed: string[]; crewMember: boolean } | null) {
  const day = laDate(now);
  const y = lastOfDay(t, data.rows, data.confirms, addDays(day, -1));
  const weekDay = addDays(day, -7);
  const w = lastOfDay(t, data.weekRows, data.weekConfirms, weekDay);
  return {
    spot: viewSpot(t),
    reading: viewReading(t, data, now),
    today: viewToday(t, data, now),
    yesterday: y ? { at: laClock(y.t, { pad: true }), label: y.r.label, support: y.r.support, bylines: y.r.bylines.slice(0, 3), more: Math.max(0, y.r.bylines.length - 3) } : null,
    lastWeek: w ? { date: weekDay, at: laClock(w.t, { pad: true }), label: w.r.label, support: w.r.support } : null,
    // Needs 4+ same-weekday days with 3+ reports each (MIN_SHOWN); none exist before November.
    typical: null,
    editorGuess: t.cfg.editorGuess ?? null,
    serverTime: isoSec(now),
    assignment: data.assignment ?? null,
    ...(you ? { you } : {}),
  };
}

function viewStation(spot: AirSpot, kind: string, r: Reading, lastAt: number | null) {
  return {
    id: spot.id, name: spot.name, short: spot.short, mhz: spot.mhz, channel: spot.channel, color: spot.color, kind,
    reading: r.status === 'none' ? null : { label: r.label, status: r.status, ageMin: r.ageMin, bars: r.bars },
    lastAt: lastAt == null ? null : isoSec(lastAt),
  };
}

const shortOf = (config: AirConfig, spotId: string) => (spotOf(config, spotId) as AirSpot | null)?.short ?? spotId.toUpperCase();
function viewStamps(held: (HeldStamp | AssignStamp)[], short: string) {
  return held.map((s) => ({ kind: s.kind, ref: s.ref, day: s.day, text: stampText(s, short) as string, new: s.fresh }));
}

type AwardIn = {
  points: number; pointsToday: number; streakWeeks: number; firstLight: boolean; held: (HeldStamp | AssignStamp)[]; crew: CrewRow | null;
  /** Field Report Assignments (spec §3.4): the seat this report just filled, or null. Never a confirm's award. */
  assignment?: AssignAward | null;
};
function viewAward(a: AwardIn, short: string) {
  const { slam, more } = receiptStamps(a.held) as { slam: (HeldStamp | AssignStamp)[]; more: number };
  return {
    points: a.points, pointsToday: a.pointsToday, cap: DAILY_CAP, streakWeeks: a.streakWeeks, firstLight: a.firstLight,
    // The receipt: two stamps at most (the place and the highest new one: an ASSIGNMENT stamp, else the highest new badge); `more` counts the rest, all in the book.
    stamps: viewStamps(slam, short),
    more,
    // Every badge this action earned, slammed or counted.
    badges: a.held.filter((s) => s.kind === 'badge' && s.fresh).map((s) => s.ref),
    crew: a.crew ? { id: a.crew.id, n: a.crew.n, at: isoSec(a.crew.at) } : null,
    // "ON THE AIR · ASSIGNMENT +10" (spec §3.8): {id, label, reward, text} of
    // the seat this report filled; its stamp is in `stamps` above, not a badge.
    assignment: a.assignment ?? null,
  };
}

function viewFiled(o: {
  t: Target; data: SpotData; now: number; replaced: boolean; codeStatus: 'none' | 'ok' | 'unknown'; signedIn: boolean; award: AwardIn; saved: Saved;
}) {
  return {
    ok: true,
    replaced: o.replaced,
    report: {
      id: o.saved.id, value: o.saved.value, label: labelOf(o.t.cfg, o.saved.value) as string, observedAt: isoSec(o.saved.observed_at),
      byline: o.saved.byline, onsite: o.saved.onsite === 1, code: o.codeStatus,
    },
    reading: viewReading(o.t, o.data, o.now),
    today: viewToday(o.t, o.data, o.now),
    award: viewAward(o.award, o.t.spot.short),
    // Anonymous stamps stay on the phone; signing in within a day moves them to the card.
    claim: o.signedIn ? null : { until: isoSec(o.now + DAY) },
  };
}

function viewConfirmed(o: { t: Target; data: SpotData; now: number; verdict: string; onsite: boolean; signedIn: boolean; award: AwardIn }) {
  return {
    ok: true,
    // Whether this confirm counted (it had the spot's code, and did not come from the reporter's own network).
    onsite: o.onsite,
    reading: viewReading(o.t, o.data, o.now),
    today: viewToday(o.t, o.data, o.now),
    award: viewAward(o.award, o.t.spot.short),
    claim: o.signedIn ? null : { until: isoSec(o.now + DAY) },
    // "Changed" means the reading is stale: show the four buttons next.
    next: o.verdict === 'changed' ? 'report' : null,
  };
}

function viewMe(config: AirConfig, o: {
  signedIn: boolean; byline: string | null; now: number; streakWeeks: number; points: { today: number; total: number };
  assigned: number; assignFills: AssignFillRow[];
  claimable: { reports: number; points: number; stamps: number } | null;
  stamps: { kind: Stamp['kind']; ref: string; day: string; meta_json: string; created_at: number }[];
  reports: { id: string; spot: string; kind: string; value: string; observed_at: number; byline: string; onsite: number; status: string }[];
}) {
  const traits = (meta: string) => { try { return JSON.parse(meta); } catch { return {}; } };
  return {
    ok: true,
    owner: o.signedIn ? 'user' : 'device',
    byline: o.byline,
    // "+40 from assignments" (spec §3.8): points.assigned sits beside today/total; it never changes the report cap.
    points: { ...o.points, assigned: o.assigned },
    assignments: o.assignFills.map((r) => fillView(config, r)),
    streakWeeks: o.streakWeeks,
    stamps: o.stamps.filter((s) => s.kind !== 'badge').map((s) => ({
      kind: s.kind, ref: s.ref, day: s.day, text: stampText(s, shortOf(config, s.ref)) as string, at: isoSec(s.created_at), traits: traits(s.meta_json),
    })),
    badges: o.stamps.filter((s) => s.kind === 'badge').map((s) => s.ref),
    reports: o.reports.map((r) => {
      const cfg = kindOf(config, r.spot, r.kind) as AirKind | null;
      return {
        id: r.id, spot: r.spot, kind: r.kind, value: r.value, label: cfg ? labelOf(cfg, r.value) as string : r.value,
        observedAt: isoSec(r.observed_at), byline: r.byline, onsite: r.onsite === 1, status: r.status,
      };
    }),
    claimable: o.claimable,
  };
}

/** GET /api/air/assign. `recent` (directors only) implies canCreate. */
function viewAssignList(config: AirConfig, open: AssignRow[], director: boolean, recent: RecentRow[] | null, now: number) {
  return {
    open: open.map((r) => assignmentView(config, r, now)),
    canCreate: director,
    ...(recent ? { recent: recent.map((r) => recentView(config, r, now)) } : {}),
    serverTime: isoSec(now),
  };
}

function viewAssignCreated(assignment: ReturnType<typeof assignmentView>) {
  return { ok: true, assignment };
}

function viewAssignVoided() {
  return { ok: true };
}
