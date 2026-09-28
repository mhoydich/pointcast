// Pure parts of Field Report Assignments (/r/assign) — templates, the window
// in LA time, who may take a seat, the WITNESSED rule and the shapes the views
// send — kept in a plain module so tests run them under node without the
// Pages runtime.
//
// An assignment is a template, a date and a seat count. Only the house creates
// one (the director session, hasDirectorDeskAccess); nothing is typed in but a
// director's void note. A seat fills on the proof a report pays on: the spot
// code, observed_at inside the window, a real answer. "Can't say" never fills
// a seat (the report still earns its normal point). Every fill pays the
// assignment's flat reward whatever the answer, outside the 30/day report cap,
// FILLS_PER_DAY at most per owner or network. A second phone's on-site "still" from another network
// marks the fill WITNESSED and never holds up the reward. The fill row
// (air_assignment_fills, migrations/auth/0024_air_assignments.sql) is the
// ASSIGNMENT stamp. Points and a stamp, never cash.
//
// The SQL that enforces seats, networks and the daily cap lives in
// functions/_lib/air-store.ts; pickAssignment() is the same rule in plain code
// for tests. The views here never carry owner, net or created_by.

import { kindOf, spotOf } from './air-kinds.mjs';
import { dayStamp } from './air-points.mjs';
import { inHours, isoSec, laDate, laParts } from './air-reading.mjs';

export const ASSIGN_REWARD = 10;
export const FILLS_PER_DAY = 2;
export const OPEN_PER_SPOT = 3;
export const CREATES_PER_DAY = 20;
export const MAX_AHEAD_DAYS = 7;
export const MAX_SEATS = 3;
/** The longest window air_assignments takes (its CHECK): four hours. */
export const MAX_WINDOW_MS = 4 * 3_600_000;
export const VOID_REASON_MAX = 80;
export const ASSIGN_REASONS = [
  'bad-json', 'bad-action', 'bad-template', 'bad-day', 'bad-start', 'bad-seats', 'too-many-open', 'forbidden', 'not-found',
];
/** newAirId('aa'): `aa_` + 20 hex. */
export const ASSIGN_ID_RE = /^aa_[0-9a-f]{16,40}$/;
export const ASSIGN_COPY = 'Assignments pay points and a stamp for being there. Never cash, never for what you answer.';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const on = (v) => v === 1 || v === true;
const utcOf = (day, hour, minute) => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d, hour, minute);
};
const realDay = (day) => typeof day === 'string' && DAY_RE.test(day) && new Date(utcOf(day, 12, 0)).toISOString().slice(0, 10) === day;

/** A template from config.assignTemplates by id, or null. */
export function templateOf(config, id) {
  if (typeof id !== 'string') return null;
  return (config.assignTemplates ?? []).find((t) => t.id === id) ?? null;
}

/** The template's label ("Rack at open"); an id no longer in the config prints as itself. */
export function assignLabel(config, templateId) {
  return templateOf(config, templateId)?.label ?? String(templateId);
}

/**
 * LA wall clock to epoch ms: laWallToMs('2026-11-01', '06:00') → 14:00Z.
 * Guesses PST, then corrects twice against laParts(), so daylight saving
 * lands either way. A time that happens twice (the November fall-back hour)
 * reads as the second, PST one; a time that never happens (the March
 * spring-forward hour) lands an hour later. Spot hours avoid both.
 */
export function laWallToMs(day, hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  const want = utcOf(day, h, m);
  let t = want + 8 * HOUR;
  for (let i = 0; i < 2; i++) {
    const p = laParts(t);
    t += want - utcOf(p.day, p.hour, p.minute);
  }
  return t;
}

/** Epoch ms of LA midnight starting the LA day `ms` falls in: the CREATES_PER_DAY count starts here. */
export const laDayStart = (ms) => laWallToMs(laDate(ms), '00:00');

/** Calendar days from one 'YYYY-MM-DD' to another: daysAhead('2026-10-02', '2026-10-09') → 7. */
export function daysAhead(fromDay, toDay) {
  return Math.round((utcOf(toDay, 12, 0) - utcOf(fromDay, 12, 0)) / DAY);
}

/**
 * Pure: a create body ({template, day, start?, seats?}) to an assignment, or
 * `{reason}`. Checks, in order: the template exists (and its spot and kind
 * do); `day` is a real 'YYYY-MM-DD' 0-7 days after LA today; `start` ("HH:MM",
 * default the template's) is inside the spot's open hours on that day; the
 * window (start + template.min) ends after `now`; seats (default the
 * template's) are 1-3. The reward is always ASSIGN_REWARD; a body cannot set it.
 * → {template, spot, kind, startsAt, endsAt, seats, reward}
 */
export function parseAssign(config, body, now = Date.now()) {
  if (!isObj(body)) return { reason: 'bad-json' };
  const tpl = templateOf(config, body.template);
  const spot = tpl ? spotOf(config, tpl.spot) : null;
  if (!tpl || !spot || !kindOf(config, tpl.spot, tpl.kind)
    || !Number.isInteger(tpl.min) || tpl.min <= 0 || tpl.min * MIN > MAX_WINDOW_MS) return { reason: 'bad-template' };
  const day = body.day;
  if (!realDay(day)) return { reason: 'bad-day' };
  const ahead = daysAhead(laDate(now), day);
  if (ahead < 0 || ahead > MAX_AHEAD_DAYS) return { reason: 'bad-day' };
  const start = body.start == null ? tpl.start : body.start;
  if (typeof start !== 'string' || !HHMM_RE.test(start)) return { reason: 'bad-start' };
  const startsAt = laWallToMs(day, start);
  if (!inHours(spot.hours, startsAt)) return { reason: 'bad-start' };
  const endsAt = startsAt + tpl.min * MIN;
  if (endsAt <= now) return { reason: 'bad-start' };
  const seats = body.seats == null ? tpl.seats : body.seats;
  if (!Number.isInteger(seats) || seats < 1 || seats > MAX_SEATS) return { reason: 'bad-seats' };
  return { template: tpl.id, spot: spot.id, kind: tpl.kind, startsAt, endsAt, seats, reward: ASSIGN_REWARD };
}

/**
 * Pure: a void body ({id, reason?}) or `{reason}` on failure. A malformed id
 * cannot exist, so it is 'not-found'. The director's note comes back as
 * `voidReason` (not `reason`, which means failure here as in every parser):
 * control characters and runs of space collapse, 80 characters at most,
 * empty is null. → {id, voidReason}
 */
export function parseVoid(body) {
  if (!isObj(body)) return { reason: 'bad-json' };
  const id = typeof body.id === 'string' && ASSIGN_ID_RE.test(body.id) ? body.id : null;
  if (!id) return { reason: 'not-found' };
  if (body.reason != null && typeof body.reason !== 'string') return { reason: 'bad-json' };
  const text = String(body.reason ?? '').replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim();
  const capped = [...text].slice(0, VOID_REASON_MAX).join('').trim();
  return { id, voidReason: capped || null };
}

/**
 * Pure: POST /api/air/assign's body by `action`, or `{reason}`.
 * → {action: 'create', template, spot, kind, startsAt, endsAt, seats, reward} | {action: 'void', id, voidReason}
 */
export function parseAssignPost(config, body, now = Date.now()) {
  if (!isObj(body)) return { reason: 'bad-json' };
  if (body.action === 'create') {
    const p = parseAssign(config, body, now);
    return 'reason' in p ? p : { action: 'create', ...p };
  }
  if (body.action === 'void') {
    const v = parseVoid(body);
    return 'reason' in v ? v : { action: 'void', ...v };
  }
  return { reason: 'bad-action' };
}

/**
 * Pure: whether a saved report may take a seat, checked before any fill SQL
 * runs. On site (the spot code verified) and a real answer: "Can't say" never
 * fills a seat. The answer itself never matters beyond that.
 */
export function canFill({ onsite, value }) {
  return on(onsite) && typeof value === 'string' && value !== 'cant';
}

/**
 * Pure: whether a confirm marks the report's fill WITNESSED. An on-site
 * "still" only; confirmReport's `onsite` already excludes remote confirms,
 * confirms from the reporter's own network and confirming your own report.
 * The mark never pays: agreement is never paid for.
 */
export function canWitness({ onsite, verdict }) {
  return on(onsite) && verdict === 'still';
}

/**
 * The network a fill counts as, the crew rule's netOf() in air-reading.mjs:
 * 'user:<id>' when signed in, else the report's ip_hash (else the phone).
 * Stored in air_assignment_fills.net and never sent.
 */
export function fillNet(row) {
  return row.user_id ? `user:${row.user_id}` : (row.ip_hash || row.pid_hash);
}

/** Seats still open: max(0, seats − filled). */
export function seatsLeft(seats, filled) {
  return Math.max(0, Number(seats) - Number(filled || 0));
}

/** Whether an assignment row is taking fills at `now`: unvoided, starts_at <= now < ends_at. */
export function isLive(row, now) {
  return row.voided_at == null && row.starts_at <= now && now < row.ends_at;
}

/**
 * Pure: the assignment a report's fill takes, or null — the fill INSERT in
 * air-store.ts in plain code. `assignments` are air_assignments rows, `fills`
 * air_assignment_fills rows, `r` the report as {reportId, owner, net, day,
 * spot, kind, observedAt, onsite, value}. Same spot and kind, unvoided,
 * starts_at <= observedAt < ends_at, not the creator, a seat left, neither
 * this owner nor this network already in it, this report in no fill yet, and
 * fewer than FILLS_PER_DAY fills on the report's LA day by this owner or on
 * this network, counted together as the seat rule counts them (a guest's
 * fresh device id on the same IP is not a fresh cap).
 * Earliest-ending wins, then the lower id, so one report fills one assignment.
 */
export function pickAssignment(assignments, fills, r) {
  if (!canFill(r)) return null;
  if (fills.some((f) => f.report_id === r.reportId)) return null;
  if (fills.filter((f) => (f.owner === r.owner || f.net === r.net) && f.day === r.day).length >= FILLS_PER_DAY) return null;
  const open = assignments.filter((a) => a.spot === r.spot && a.kind === r.kind && a.voided_at == null
    && a.starts_at <= r.observedAt && a.ends_at > r.observedAt && a.created_by !== r.owner
    && fills.filter((f) => f.assignment_id === a.id).length < a.seats
    && !fills.some((f) => f.assignment_id === a.id && (f.owner === r.owner || f.net === r.net)));
  return open.sort((a, b) => a.ends_at - b.ends_at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0] ?? null;
}

/** What the ASSIGNMENT stamp prints: "ASSIGNMENT · RACK AT OPEN · MANHATTAN MIDDLE · FRI 02 OCT 2026". */
export function assignStampText(label, short, day) {
  return `ASSIGNMENT · ${String(label).toUpperCase()} · ${short} · ${dayStamp(day)}`;
}

const shortOf = (config, spotId) => spotOf(config, spotId)?.short ?? String(spotId).toUpperCase();

/**
 * One assignment as GET /api/air/assign lists it, and as spotPayload.assignment.
 * `row` is an air_assignments row plus `filled` (its fill count).
 * → {id, spot, label, question, startsAt, endsAt, seats, seatsLeft, reward, live}
 */
export function assignmentView(config, row, now) {
  return {
    id: row.id,
    spot: row.spot,
    label: assignLabel(config, row.template),
    question: kindOf(config, row.spot, row.kind)?.question ?? null,
    startsAt: isoSec(row.starts_at),
    endsAt: isoSec(row.ends_at),
    seats: row.seats,
    seatsLeft: seatsLeft(row.seats, row.filled),
    reward: row.reward,
    live: isLive(row, now),
  };
}

/**
 * One assignment in the directors' `recent` list (last 14 days, voided too).
 * `row` adds `filled`, `witnessed` (fills with a WITNESSED mark) and
 * `fillers` (the fill reports' bylines, oldest first) to the air_assignments row.
 * → assignmentView + {filled, witnessed, fillers, voidedAt, voidReason, createdAt}
 */
export function recentView(config, row, now) {
  return {
    ...assignmentView(config, row, now),
    filled: Number(row.filled || 0),
    witnessed: Number(row.witnessed || 0),
    fillers: Array.isArray(row.fillers) ? row.fillers : [],
    voidedAt: row.voided_at == null ? null : isoSec(row.voided_at),
    voidReason: row.void_reason ?? null,
    createdAt: isoSec(row.created_at),
  };
}

/**
 * The receipt's ASSIGNMENT line (viewAward.assignment) for a fill written
 * now. `row` is {assignment_id, template, spot, day, reward}; `day` is the
 * fill's LA day. → {id, label, reward, text}
 */
export function assignAward(config, row) {
  const label = assignLabel(config, row.template);
  return { id: row.assignment_id, label, reward: row.reward, text: assignStampText(label, shortOf(config, row.spot), row.day) };
}

/**
 * The display-only stamp a receipt slams beside the place stamp. It is not an
 * air_stamps row: it carries its own `text`, so stampText's assignment branch
 * returns stamp.text, and 'assignment' ranks first in RECEIPT_ORDER.
 * → {kind: 'assignment', ref: <assignment id>, day, text, fresh: true}
 */
export function assignReceiptStamp(config, row) {
  const a = assignAward(config, row);
  return { kind: 'assignment', ref: a.id, day: row.day, text: a.text, fresh: true };
}

/**
 * One fill in /api/air/me's `assignments` (the caller's own, 50 at most).
 * `row` is {assignment_id, template, spot, day, reward, witnessed_at}.
 * → {id, label, spot, day, reward, witnessed, text}
 */
export function fillView(config, row) {
  const label = assignLabel(config, row.template);
  return {
    id: row.assignment_id, label, spot: row.spot, day: row.day, reward: row.reward,
    witnessed: row.witnessed_at != null, text: assignStampText(label, shortOf(config, row.spot), row.day),
  };
}
