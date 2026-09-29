/**
 * The Desk (/api/air/desk) — storage: who is a resident, the calls an agent
 * puts out and passes, and the two read payloads (the desk board, an agent's
 * card). Pure rules live in functions/_lib/air-desk.mjs (imported, not
 * reimplemented); this file is the SQL and the HTTP shape, matched against
 * docs/plans/2026-09-28-early-shift-desk-spec.md §4-5 (group M).
 *
 * Auth: the yard's one countersign header, reused (spec §1.6). `isResident()`
 * compares in constant time so a resident-only route never leaks the key by
 * timing — a length check, then an XOR-accumulate over every character (the
 * same portable technique functions/api/sparrow/digest-subscribe.ts uses;
 * `crypto.subtle.timingSafeEqual` is a Workers-only extension the test
 * runner's plain Node cannot call, so this file does not depend on it).
 * Unset key: the route returns 503 before this file is asked anything. Wrong
 * key: 403. The key proves "a house agent", not which one — `agent` in the
 * body is trusted as given, same as the yard.
 *
 * An ask is one batch (spec §4): expire stale calls, insert the belief row
 * only under the daily cap, insert the call only while the belief exists and
 * the spot has no open call, then read the result back. A miss after the
 * batch is a race lost to another ask; a fresh probe (the same counts
 * askRefusal() used before the batch) names the reason, and the partial
 * unique index (air_calls_open_spot) is the backstop that made it lose.
 *
 * Every SELECT here is its own literal, matched against tests/air-desk-api.test.mjs
 * (never pid_hash or ip_hash — the Desk never reads a phone's hash at all).
 */
import type { AirConfig, AgentCard, CallView, DeskPayload } from '../../src/lib/air.ts';
// @ts-ignore — plain module shared with the tests
import { kindOf, kindRole } from './air-kinds.mjs';
// @ts-ignore — plain module shared with the tests
import { DESK_REFUSALS, LOG_SIZE, RESOLVE_TIMEOUT_MS, SHIFT_LOG_DAYS, agentCard, agentOf, agentRowOf, askRefusal, callRowOf, callView, canPass, deskLog, isLiveCall, parseDeskPost, passRelay, shiftView } from './air-desk.mjs';
// @ts-ignore — plain module shared with the tests
import { isoSec, laDate } from './air-reading.mjs';

export type AirDeskEnv = { AUTH_DB?: D1Database; YARD_RESIDENT_KEY?: string };

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });
export const fail = (reason: string, extra: Record<string, unknown> = {}) =>
  json({ ok: false, reason, ...extra }, (DESK_REFUSALS as Record<string, number>)[reason] ?? 400);

/** An air_calls row exactly as selected in this file. */
type CallRow = {
  id: string; spot: string; kind: string; asker: string; holder: string; report_id: string; day: string;
  status: string; asked_at: number; expires_at: number; answered_report_id: string | null; answered_at: number | null; relay_json: string;
};
type ShiftRow = { day: string; feed: string; agent: string; outcome: string; reason: string | null; report_id: string | null; at: number; value?: string | null };
type Belief = { value: string; source_url: string | null };

/** Constant-time string compare: never a plain `===` on a secret. Portable (no crypto.subtle.timingSafeEqual, a Workers-only extension). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Whether the request presents the house's own resident key
 * (X-Yard-Resident), compared in constant time. False whenever the key is
 * unset — the caller checks that first and answers 503, never this.
 */
export async function isResident(request: Request, env: AirDeskEnv): Promise<boolean> {
  if (!env.YARD_RESIDENT_KEY) return false;
  const presented = request.headers.get('X-Yard-Resident') ?? '';
  return timingSafeEqual(presented, env.YARD_RESIDENT_KEY);
}

/** A GET on `url` answers under 400 within RESOLVE_TIMEOUT_MS. Network trouble or a slow host: false, never thrown. */
async function resolves(url: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), RESOLVE_TIMEOUT_MS);
  try {
    // A descriptive User-Agent, like the house's other outbound reads: Wikimedia
    // and several city sites answer 403 to a request without one.
    const headers = { 'User-Agent': 'PointCast Desk (+https://pointcast.xyz/r/desk)', Accept: 'text/html,application/json;q=0.9,*/*;q=0.8' };
    const res = await fetcher(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers });
    return res.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** The counts askRefusal() needs for one spot+kind+agent, right now. */
async function refusalCheck(db: D1Database, config: AirConfig, agent: string, spot: string, kind: string, now: number): Promise<string | null> {
  const cfg = kindOf(config, spot, kind);
  const day = laDate(now);
  const [asks, open, human] = await db.batch([
    db.prepare('SELECT COUNT(*) AS n FROM air_calls WHERE asker = ? AND day = ?').bind(agent, day),
    db.prepare(`SELECT COUNT(*) AS n FROM air_calls WHERE spot = ? AND status = 'open' AND expires_at > ?`).bind(spot, now),
    db.prepare(`SELECT MAX(observed_at) AS t FROM air_reports WHERE spot = ? AND kind = ? AND onsite = 1 AND status = 'ok' AND source = 'page' AND value != 'cant'`).bind(spot, kind),
  ]);
  const n = (r: D1Result) => Number((r.results?.[0] as { n?: number } | undefined)?.n ?? 0);
  const t = (r: D1Result) => (r.results?.[0] as { t?: number | null } | undefined)?.t ?? null;
  return askRefusal(config, { asksToday: n(asks), openOnSpot: n(open), lastHumanAt: t(human), cfg, now });
}

/**
 * POST /api/air/desk {action:'ask', agent, spot, kind, belief, sourceUrl}.
 * Resident-only. `body` is the already-parsed JSON (never re-read here, so
 * the in-process MCP call in functions/api/mcp.ts can pass its own args
 * object straight through). 201 {ok, call} or a refusal from DESK_REFUSALS.
 */
export async function askCall(request: Request, env: AirDeskEnv, db: D1Database, config: AirConfig, body: unknown, now: number, fetcher: typeof fetch = fetch): Promise<Response> {
  if (!env.YARD_RESIDENT_KEY) return fail('resident-key-unset');
  if (!(await isResident(request, env))) return fail('not-a-resident');
  const parsed = parseDeskPost(config, body);
  // Not `if (parsed.reason)`: a successful 'pass' parse also carries a
  // `reason` (the pass reason, e.g. 'keeper') — only a refusal has no `action`.
  if (!parsed.action) return fail(parsed.reason);
  if (parsed.action !== 'ask') return fail('bad-action');
  const belief = await agentRowOf(config, { agent: parsed.agent, spot: parsed.spot, kind: parsed.kind, value: parsed.belief, sourceUrl: parsed.sourceUrl, now });
  if (belief.reason) return fail(belief.reason);
  if (!(await resolves(parsed.sourceUrl, fetcher))) return fail('source-unresolved');

  const early = await refusalCheck(db, config, parsed.agent, parsed.spot, parsed.kind, now);
  if (early) return fail(early);

  const b = belief.row;
  const callRow = callRowOf(config, { agent: parsed.agent, spot: parsed.spot, kind: parsed.kind, reportId: b.id, now });
  const caps = config.desk?.calls ?? {};
  await db.batch([
    // The sweep: a call whose window already closed stops holding the spot's
    // one open slot, so a fresh ask on it is never wrongly refused spot-busy.
    db.prepare(`UPDATE air_calls SET status = 'expired' WHERE status = 'open' AND expires_at <= ?`).bind(now),
    db.prepare(`INSERT INTO air_reports (id, spot, kind, value, extras_json, schema_v, observed_at, day, slot, pid_hash, ip_hash, user_id, byline, onsite, geo, status, source, source_url, created_at, awarded_at)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE (SELECT COUNT(*) FROM air_calls WHERE asker = ? AND day = ?) < ?
        AND NOT EXISTS (SELECT 1 FROM air_calls WHERE spot = ? AND status = 'open')`)
      .bind(b.id, b.spot, b.kind, b.value, b.extras_json, b.schema_v, b.observed_at, b.day, b.slot, b.pid_hash, b.ip_hash, b.user_id, b.byline, b.onsite, b.geo, b.status, b.source, b.source_url, b.created_at, b.awarded_at, parsed.agent, laDate(now), caps.perAgentPerDay ?? 5, b.spot),
    db.prepare(`INSERT INTO air_calls (id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at, answered_report_id, answered_at, relay_json)
      SELECT ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, NULL, NULL, '[]'
      WHERE EXISTS (SELECT 1 FROM air_reports WHERE id = ?) AND NOT EXISTS (SELECT 1 FROM air_calls WHERE spot = ? AND status = 'open')`)
      .bind(callRow.id, callRow.spot, callRow.kind, callRow.asker, callRow.holder, callRow.report_id, callRow.day, callRow.asked_at, callRow.expires_at, callRow.report_id, callRow.spot),
  ]);
  const created = await db.prepare(`SELECT id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at, answered_report_id, answered_at, relay_json FROM air_calls WHERE id = ?`)
    .bind(callRow.id).first<CallRow>();
  if (!created) {
    const late = await refusalCheck(db, config, parsed.agent, parsed.spot, parsed.kind, now);
    return fail(late ?? 'spot-busy');
  }
  return json({ ok: true, call: callView(config, created, { value: b.value, source_url: b.source_url }, now) }, 201);
}

/**
 * POST /api/air/desk {action:'pass', agent, callId, to, reason}.
 * Resident-only. 200 {ok, call} or a refusal from DESK_REFUSALS.
 */
export async function passCall(request: Request, env: AirDeskEnv, db: D1Database, config: AirConfig, body: unknown, now: number): Promise<Response> {
  if (!env.YARD_RESIDENT_KEY) return fail('resident-key-unset');
  if (!(await isResident(request, env))) return fail('not-a-resident');
  const parsed = parseDeskPost(config, body);
  if (!parsed.action) return fail(parsed.reason);
  if (parsed.action !== 'pass') return fail('bad-action');
  const call = await db.prepare(`SELECT id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at, answered_report_id, answered_at, relay_json FROM air_calls WHERE id = ?`)
    .bind(parsed.callId).first<CallRow>();
  const refusal = canPass(config, { call, agent: parsed.agent, now });
  if (refusal) return fail(refusal);
  const relayJson = passRelay(call, { from: parsed.agent, to: parsed.to, reason: parsed.reason, at: now });
  const updated = await db.prepare(`UPDATE air_calls SET holder = ?, relay_json = ?
      WHERE id = ? AND status = 'open' AND holder = ?
      RETURNING id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at, answered_report_id, answered_at, relay_json`)
    .bind(parsed.to, relayJson, parsed.callId, parsed.agent).first<CallRow>();
  if (!updated) return fail('not-open');
  const belief = await db.prepare('SELECT value, source_url FROM air_reports WHERE id = ?').bind(updated.report_id).first<Belief>();
  if (!belief) return fail('not-open');
  return json({ ok: true, call: callView(config, updated, belief, now) });
}

/** The belief rows for a batch of calls, keyed by report_id. One SELECT per id (D1 has no array bind), batched. */
async function loadBeliefs(db: D1Database, reportIds: string[]): Promise<Map<string, Belief>> {
  if (!reportIds.length) return new Map();
  const res = await db.batch(reportIds.map((id) => db.prepare('SELECT value, source_url FROM air_reports WHERE id = ?').bind(id)));
  const out = new Map<string, Belief>();
  res.forEach((r, i) => {
    const row = r.results?.[0] as Belief | undefined;
    if (row) out.set(reportIds[i], row);
  });
  return out;
}

/**
 * GET /api/air/desk (no ?agent=): the desk board. `calls` are the currently
 * live ones (open, unexpired) with their belief; `shift` is today's five
 * feeds; `log` reads over both, plus the trailing SHIFT_LOG_DAYS of calls (so
 * a pass or an answer still shows once its call itself has gone quiet).
 */
export async function deskPayload(db: D1Database, config: AirConfig, now: number): Promise<DeskPayload> {
  const day = laDate(now);
  const since = now - SHIFT_LOG_DAYS * DAY;
  const [shiftRes, callsRes] = await db.batch([
    db.prepare(`SELECT sf.day, sf.feed, sf.agent, sf.outcome, sf.reason, sf.report_id, sf.at, r.value AS value
      FROM air_shift_feeds sf LEFT JOIN air_reports r ON r.id = sf.report_id WHERE sf.day = ?`).bind(day),
    db.prepare(`SELECT id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at, answered_report_id, answered_at, relay_json
      FROM air_calls WHERE asked_at >= ? ORDER BY asked_at DESC LIMIT 200`).bind(since),
  ]);
  const shiftRows = (shiftRes.results ?? []) as ShiftRow[];
  const callRows = (callsRes.results ?? []) as CallRow[];
  const live = callRows.filter((c) => isLiveCall(c, now));
  const beliefs = await loadBeliefs(db, live.map((c) => c.report_id));
  const calls = live
    .map((c) => callView(config, c, beliefs.get(c.report_id), now))
    .filter((v: CallView | null): v is CallView => v != null);
  return {
    calls,
    shift: shiftView(config, { rows: shiftRows, now }),
    log: deskLog(config, { shift: shiftRows, calls: callRows, now, limit: LOG_SIZE }),
    nightEditor: null,
    serverTime: isoSec(now),
  };
}

/**
 * GET /api/air/desk?agent=<call>: that agent's card, or null for an unknown
 * call sign. A public GET, so every read is bounded by what the judge can use,
 * in a fixed number of statements (never one per row):
 * - `rows`: the agent's own rows, slim (no extras, no URL), over the whole
 *   history — Checked and the record read all of it (air_reports_source).
 * - `confirms`: one join, only the on-site still/changed confirms on those rows
 *   (the only ones judgeRow() reads).
 * - `humans`: per judgeable spot+kind pair (fact kinds are 'no-check' and read
 *   none), only the on-site human rows that fall inside some agent row's
 *   window [observed_at, + decayMin) — driven from the agent rows, so neither
 *   the scan nor the result grows with that spot's whole report history.
 * - `shift`, `calls`: the agent's own, a few per morning.
 */
export async function agentPayload(db: D1Database, config: AirConfig, call: string, now: number): Promise<AgentCard | null> {
  if (!agentOf(config, call)) return null;
  const source = `agent:${call}`;
  const [rowsRes, confirmRes, shiftRes, callsRes] = await db.batch([
    db.prepare('SELECT id, spot, kind, value, observed_at, status, source FROM air_reports WHERE source = ? ORDER BY observed_at').bind(source),
    db.prepare(`SELECT c.report_id, c.verdict, c.onsite, c.at FROM air_confirms c JOIN air_reports r ON r.id = c.report_id
      WHERE r.source = ? AND c.onsite = 1 AND c.verdict IN ('still', 'changed')`).bind(source),
    db.prepare('SELECT day, feed, agent, outcome, reason, report_id, at FROM air_shift_feeds WHERE agent = ?').bind(call),
    db.prepare(`SELECT id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at, answered_report_id, answered_at, relay_json FROM air_calls WHERE asker = ?`).bind(call),
  ]);
  const rows = (rowsRes.results ?? []) as { id: string; spot: string; kind: string }[];
  const pairs = [...new Map(rows.flatMap((r) => {
    const cfg = kindOf(config, r.spot, r.kind) as { decayMin: number } | null;
    return cfg && kindRole(cfg) !== 'fact' ? [[`${r.spot}|${r.kind}`, { spot: r.spot, kind: r.kind, windowMs: cfg.decayMin * MIN }] as const] : [];
  })).values()];
  const humanRes = pairs.length
    ? await db.batch(pairs.map((p) => db.prepare(`SELECT DISTINCT h.id, h.spot, h.kind, h.value, h.observed_at, h.onsite, h.status, h.source
        FROM air_reports a JOIN air_reports h ON h.spot = a.spot AND h.kind = a.kind AND h.observed_at >= a.observed_at AND h.observed_at < a.observed_at + ?
        WHERE a.source = ? AND a.spot = ? AND a.kind = ? AND a.status = 'ok'
          AND h.onsite = 1 AND h.status = 'ok' AND h.source = 'page' AND h.value != 'cant'`).bind(p.windowMs, source, p.spot, p.kind)))
    : ([] as D1Result[]);
  const humans = humanRes.flatMap((r) => (r.results ?? []) as unknown[]);
  const confirms = (confirmRes.results ?? []) as unknown[];
  const shift = (shiftRes.results ?? []) as ShiftRow[];
  const calls = (callsRes.results ?? []) as CallRow[];
  return agentCard(config, { agent: call, rows, humans, confirms, shift, calls, now });
}
