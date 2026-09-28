// Pure parts of /api/air — the reading, signal bars, the crew and streaks —
// kept in a plain module so tests run them under node without the Pages runtime.
//
// Inputs are D1 rows as selected, snake_case:
//   report  { id, spot, kind, value, observed_at, pid_hash, ip_hash?, user_id?, byline, onsite, status?, source? }
//   confirm { report_id, pid_hash, ip_hash?, user_id?, byline?, verdict, value?, onsite, at }
// Pass today's rows for one spot+kind (at least the last decay window + 30 min)
// and the confirms on them. Agent rows (source 'agent:*'), remote rows and
// non-'ok' rows are never evidence: they carry no support, crew or streak.
// Outputs never carry pid_hash except crewFrom().members, which is internal,
// and never carry ip_hash at all (it only tells networks apart).

import { guestByline, labelOf, ownerOf } from './air-kinds.mjs';

export const CREW_AT = 3;
export const CREW_NETS = 2;
export const CREW_WINDOW_MIN = 30;

/**
 * The network a row counts as for the crew rule. A signed-in phone is its own
 * network: friends on one carrier often share a CGNAT address, and an account
 * is harder to mint than a device id. Guests fall back to the hashed IP, then
 * the phone. The full IP stays hashed; prefixes would only widen collisions.
 */
const netOf = (row) => (row.user_id ? `user:${row.user_id}` : (row.ip_hash || row.pid_hash));
const MIN = 60_000;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LA_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** El Segundo wall time for an epoch ms: {day:'YYYY-MM-DD', weekday 0-6 (Sun 0), hour, minute, minuteOfDay}. */
export function laParts(ms) {
  const p = {};
  for (const part of LA_FMT.formatToParts(new Date(ms))) p[part.type] = part.value;
  const hour = Number(p.hour) % 24, minute = Number(p.minute);
  return { day: `${p.year}-${p.month}-${p.day}`, weekday: WEEKDAYS.indexOf(p.weekday), hour, minute, minuteOfDay: hour * 60 + minute };
}

/** The LA day, same answer as townDate() in src/lib/band.ts. */
export const laDate = (ms) => laParts(ms).day;

const minuteOfDay = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m; };

/**
 * Whether an epoch ms is inside a spot's open hours ({open, close}, LA "HH:MM"):
 * open inclusive, close exclusive; a close at or before the open runs past
 * midnight. No hours (or unreadable ones) is never open.
 */
export function inHours(hours, ms) {
  if (!hours?.open || !hours?.close) return false;
  const t = laParts(ms).minuteOfDay;
  const open = minuteOfDay(hours.open);
  const close = minuteOfDay(hours.close);
  if (!Number.isFinite(open) || !Number.isFinite(close)) return false;
  return open < close ? t >= open && t < close : t >= open || t < close;
}

/** "07:36" (pad) or "7:36"; with ampm "7:36 AM". LA time. */
export function laClock(ms, { pad = false, ampm = false } = {}) {
  const { hour, minute } = laParts(ms);
  const mm = String(minute).padStart(2, '0');
  if (ampm) return `${hour % 12 || 12}:${mm} ${hour < 12 ? 'AM' : 'PM'}`;
  return `${pad ? String(hour).padStart(2, '0') : hour}:${mm}`;
}

/** ISO without milliseconds: "2026-10-02T14:39:10Z". */
export const isoSec = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

/** floor(minuteOfDayLA / decayMin): the decay window a moment falls in. */
export function windowIdx(ms, decayMin) {
  return Math.floor(laParts(ms).minuteOfDay / decayMin);
}

/** '<day>:<windowIdx>', the air_broadcasts.win key. */
export function winKey(ms, decayMin) {
  return `${laDate(ms)}:${windowIdx(ms, decayMin)}`;
}

/** Signal bars: ceil(5 × (1 − age ÷ decay)); 5 when fresh, 0 once expired. */
export function bars(ageMs, decayMin) {
  const decay = decayMin * MIN;
  const age = Math.max(0, ageMs);
  if (age >= decay) return 0;
  return Math.ceil(5 * (1 - age / decay));
}

/** "1 reporter" or "3 agree"; empty with no support. */
export function supportLabel(support) {
  return support >= 2 ? `${support} agree` : support === 1 ? '1 reporter' : '';
}

const on = (v) => v === 1 || v === true;
const human = (r) => !String(r.source ?? 'page').startsWith('agent:');
const ok = (r) => (r.status ?? 'ok') === 'ok';

/**
 * Every on-site human observation: ok reports, plus on-site "still" confirms
 * (read as the confirmer seeing the value the report had when they confirmed,
 * `value` on the confirm row). A confirm of your own report is dropped. A human
 * confirming an agent row counts: the human is the witness, the agent row
 * itself never is. `net` tells networks apart (ip_hash, else the phone).
 */
export function evidence(rows, confirms = []) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out = [];
  for (const r of rows) {
    if (!ok(r) || !on(r.onsite) || !human(r)) continue;
    out.push({ pid: r.pid_hash, net: netOf(r), owner: ownerOf(r), value: r.value, t: r.observed_at, reportId: r.id, byline: r.byline || guestByline(r.pid_hash), via: 'report' });
  }
  for (const c of confirms) {
    if (c.verdict !== 'still' || !on(c.onsite)) continue;
    const r = byId.get(c.report_id);
    if (!r || !ok(r) || r.pid_hash === c.pid_hash) continue;
    out.push({ pid: c.pid_hash, net: netOf(c), owner: ownerOf(c), value: c.value ?? r.value, t: c.at, reportId: r.id, byline: c.byline || guestByline(c.pid_hash), via: 'confirm' });
  }
  return out.sort((a, b) => a.t - b.t);
}

/**
 * Pure: 3+ distinct on-site phones (reports or "still" confirms) inside the
 * last 30 minutes, from at least two networks (a signed-in phone is its own network), so one person minting device
 * ids on one connection is never a crew. Returns null, or {id, n, at, members};
 * `at` is epoch ms of the phone that completed it and `id` is
 * '<spot>:<day>:<windowIdx>' of that moment. `members` ([{pid_hash, owner,
 * byline}]) is for stamping only — never send it. This decides when a crew
 * forms; the crew a page shows is the day's first one (air_crews).
 */
export function crewFrom({ spot, cfg, rows, confirms = [], now }) {
  const since = now - CREW_WINDOW_MIN * MIN;
  const seen = new Map();
  const nets = new Set();
  let at = null;
  for (const e of evidence(rows, confirms)) {
    if (e.t < since || e.t > now || seen.has(e.pid)) continue;
    seen.set(e.pid, { pid_hash: e.pid, owner: e.owner, byline: e.byline });
    nets.add(e.net);
    if (at == null && seen.size >= CREW_AT && nets.size >= CREW_NETS) at = e.t;
  }
  if (at == null) return null;
  return { id: `${spot}:${laDate(at)}:${windowIdx(at, cfg.decayMin)}`, n: seen.size, at, members: [...seen.values()] };
}

const NONE = { value: null, label: null, status: 'none', support: 0, reportId: null, observedAt: null, ageMin: null, bars: 0, liveUntil: null, bylines: [], crew: null, last: null };

/**
 * Pure: the reading for one spot+kind at `now`, in the GET /api/air/[spot] shape.
 * 1. Live evidence only (inside decayMin), latest observation per phone.
 * 2. Support for a value = phones whose latest observation is that value.
 * 3. Most support wins, ties go to the newest; "cant" never beats a real answer.
 * `reportId` is the report the confirm strip offers: the newest supporter's
 * report that still says the winning value (null when every such report has
 * since changed its answer). A "still" confirm keeps its report confirmable,
 * so a reading can live on through confirms (see confirmReport).
 * With status 'none', `last` holds the newest expired on-site report, or null.
 */
export function reading({ spot, cfg, rows, confirms = [], now }) {
  const decay = cfg.decayMin * MIN;
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ev = evidence(rows, confirms);
  const latest = new Map();
  for (const e of ev) if (e.t <= now + 60_000) latest.set(e.pid, e); // sorted ascending, so the last write wins
  const tally = new Map();
  for (const e of latest.values()) {
    if (now - e.t >= decay) continue;
    const v = tally.get(e.value) ?? { value: e.value, newest: e, supporters: [] };
    v.supporters.push(e);
    if (e.t >= v.newest.t) v.newest = e;
    tally.set(e.value, v);
  }
  let candidates = [...tally.values()];
  if (candidates.some((c) => c.value !== 'cant')) candidates = candidates.filter((c) => c.value !== 'cant');
  candidates.sort((a, b) => b.supporters.length - a.supporters.length || b.newest.t - a.newest.t);
  const win = candidates[0];
  const crew = crewFrom({ spot, cfg, rows, confirms, now });
  const crewOut = crew ? { id: crew.id, n: crew.n, at: isoSec(crew.at) } : null;
  if (!win) {
    const expired = ev.filter((e) => e.via === 'report').at(-1);
    const last = expired ? { value: expired.value, label: labelOf(cfg, expired.value), observedAt: isoSec(expired.t), byline: expired.byline } : null;
    return { ...NONE, crew: crewOut, last };
  }
  const support = win.supporters.length;
  const t = win.newest.t;
  const lead = [...win.supporters].sort((a, b) => b.t - a.t).find((e) => byId.get(e.reportId)?.value === win.value);
  return {
    value: win.value,
    label: labelOf(cfg, win.value),
    status: support >= 2 ? 'agree' : 'single',
    support,
    reportId: lead?.reportId ?? null,
    observedAt: isoSec(t),
    ageMin: Math.max(0, Math.floor((now - t) / MIN)),
    bars: bars(now - t, cfg.decayMin),
    liveUntil: isoSec(t + decay),
    bylines: [...win.supporters].sort((a, b) => a.t - b.t).map((e) => e.byline),
    crew: crewOut,
    last: null,
  };
}

/**
 * The station post line, 280 chars or fewer:
 * "On the air from Manhattan Middle School courts: 1–4 in the rack · 1 reporter · 7:36".
 */
export function stationLine({ name, label, support, at }) {
  return `On the air from ${name}: ${label} · ${supportLabel(Math.max(1, support))} · ${laClock(at)}`.slice(0, 280);
}

/** Monday-based week number for an LA day string. 1970-01-05 was a Monday. */
export function weekOf(day) {
  const d = Math.floor(Date.parse(`${day}T12:00:00Z`) / 86_400_000);
  return Math.floor((d - 4) / 7);
}

/**
 * Pure: weekly streak (Mon–Sun, LA). Entries are the owner's reports and
 * confirms as {day, onsite, source?, status?}; only on-site human ok rows
 * count. A week with nothing yet keeps last week's streak alive.
 */
export function streakWeeks(entries, now) {
  const weeks = new Set();
  for (const e of entries) if (on(e.onsite) && human(e) && ok(e) && typeof e.day === 'string') weeks.add(weekOf(e.day));
  const current = weekOf(laDate(now));
  let w = weeks.has(current) ? current : current - 1;
  let n = 0;
  while (weeks.has(w)) { n++; w--; }
  return n;
}
