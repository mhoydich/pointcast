// Pure parts of GET /api/air/board (the Pickleball Board's API) — schedule
// math, court quality and the hero pick — kept in a plain module so tests run
// them under node without the Pages runtime. D1 rows and the sourced
// schedule (src/data/courts-schedule.json, src/lib/courts.ts) are passed in;
// this file has no imports beyond air-reading.mjs and air-kinds.mjs, which are
// already plain modules themselves. Everything here is a fact about *now* or
// about a source; it never guesses a wait and never reads a hash past what
// qualityVibe needs internally to dedupe by phone (which never leaves it).

import { CREW_NETS, evidence, isoSec, laDate, laParts, reading, supportLabel } from './air-reading.mjs';
import { guestByline, labelOf } from './air-kinds.mjs';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ---------- provenance ---------- */

/** Calendar day count for a 'YYYY-MM-DD' string (anchored to local noon so a bad TZ never shifts it). */
const dayNum = (day) => Math.floor(Date.parse(`${day}T12:00:00Z`) / DAY);

/**
 * Pure: whether a sourced thing (a Fact, Hours or Block — anything carrying
 * {confidence, checked}) renders, and what tag it carries.
 * - 'unverified': never shows.
 * - 'partial': shows, tagged "unconfirmed".
 * - 'verified': shows; tagged "may have changed" once `checked` is 45+ days
 *   old (by LA calendar day, so a build run just after midnight still reads
 *   the day the page will show).
 */
export function showable(sourced, now = Date.now()) {
  if (!sourced) return { show: false, tag: null };
  if (sourced.confidence === 'unverified') return { show: false, tag: null };
  if (sourced.confidence === 'partial') return { show: true, tag: 'unconfirmed' };
  const age = dayNum(laDate(now)) - dayNum(sourced.checked);
  return { show: true, tag: age >= 45 ? 'may have changed' : null };
}

/* ---------- schedule ---------- */

const minutesOf = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m; };

/** "5 PM" / "12:30 PM", LA wall time from a minute-of-day. */
function clockLabel(totalMin) {
  const wrapped = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** 'YYYY-MM-DD' + n days, UTC-noon anchored so DST never shifts the calendar date. */
function addDays(day, n) {
  const [y, mo, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d + n, 12)).toISOString().slice(0, 10);
}
/** Sun 0 .. Sat 6 for a 'YYYY-MM-DD' string. */
const weekdayOf = (day) => new Date(`${day}T12:00:00Z`).getUTCDay();

/**
 * Pure: a court's blocks active on the LA calendar day of `nowMs` — matching
 * weekday, and inside the inclusive `from`..`until` season (either absent is
 * open-ended). A block with a season that ended (say, Oct 26) never shows for
 * a later Monday (Oct 27 and on), even though the weekday still matches.
 */
export function blocksOn(court, nowMs) {
  const { weekday, day } = laParts(nowMs);
  return (court.blocks ?? []).filter((b) => b.confidence !== 'unverified'
    && b.days.includes(weekday) && (!b.from || day >= b.from) && (!b.until || day <= b.until));
}

/**
 * Pure: the blocks running right now — active today, and `nowMs`'s
 * minute-of-day falls inside [start, end). `sunsetMin` is unused here (blocks
 * always carry literal HH:MM, never 'dusk'); it is only threaded through for
 * a caller building `now` and `next` from the same court in one pass.
 */
export function sessionsNow(court, nowMs, sunsetMin) {
  void sunsetMin;
  const { minuteOfDay } = laParts(nowMs);
  return blocksOn(court, nowMs)
    .map((b) => ({ block: b, start: minutesOf(b.start), end: minutesOf(b.end) }))
    .filter(({ start, end }) => minuteOfDay >= start && minuteOfDay < end)
    .map(({ block, end }) => ({ block, until: clockLabel(end) }));
}

/**
 * Pure: the soonest block start within `days` days (today included), never
 * past its own season (`until`). A block already running now is "now", not
 * "next": on today, only a start strictly later than `nowMs` counts. Ties
 * (same court, several blocks) go to the earliest start; across courts the
 * caller (bestBet) breaks ties by `order`. `when` is "today 5 PM" for a start
 * later today, else "Sat 9 AM". `kinds` (e.g. ['dropin']) limits which
 * block kinds count; an `unverified` block never counts.
 */
export function nextSession(court, nowMs, sunsetMin, days = 7, kinds = null) {
  void sunsetMin;
  const { day: today, minuteOfDay } = laParts(nowMs);
  for (let i = 0; i < days; i++) {
    const day = addDays(today, i);
    const weekday = weekdayOf(day);
    const candidates = (court.blocks ?? [])
      .filter((b) => b.confidence !== 'unverified' && (!kinds || kinds.includes(b.kind)))
      .filter((b) => b.days.includes(weekday) && (!b.from || day >= b.from) && (!b.until || day <= b.until))
      .filter((b) => i > 0 || minutesOf(b.start) > minuteOfDay)
      .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
    if (candidates.length) {
      const block = candidates[0];
      const when = i === 0 ? `today ${clockLabel(minutesOf(block.start))}` : `${WEEKDAYS[weekday]} ${clockLabel(minutesOf(block.start))}`;
      // dayOffset/startMin are extra, for bestBet's cross-court ranking only; the public BoardNext is just {block, when}.
      return { block, when, dayOffset: i, startMin: minutesOf(block.start) };
    }
  }
  return null;
}

/**
 * Pure: 'closed' for a standing closure (renovation, not today's hours),
 * 'unknown' without verified hours, else whether `nowMs` falls inside today's
 * rule. `close: 'dusk'` resolves against `sunsetMin` (minute-of-day of
 * today's actual sunset, computed by the caller from Conditions.sunset — a
 * real astronomical time, already DST-correct, so this function needs no DST
 * logic of its own). A day with no rule reads `hours.else`. Unverified hours
 * read 'unknown', and so does any minute where `hours.conflict`'s other
 * reading of the source disagrees.
 */
export function openState(court, nowMs, sunsetMin) {
  if (court.status === 'closed') return 'closed';
  if (!court.hours || court.hours.confidence === 'unverified') return 'unknown';
  const { weekday, minuteOfDay } = laParts(nowMs);
  const byRules = (rules) => {
    const rule = rules.find((r) => r.days.includes(weekday));
    if (!rule) return court.hours.else === 'closed' ? 'closed' : 'unknown';
    const open = minutesOf(rule.open);
    const close = rule.close === 'dusk' ? sunsetMin : minutesOf(rule.close);
    if (close == null) return 'unknown';
    return minuteOfDay >= open && minuteOfDay < close ? 'open' : 'closed';
  };
  const state = byRules(court.hours.rules);
  // The source reads two ways (hours.conflict): where the readings disagree
  // right now, the board doesn't pick one.
  if (court.hours.conflict && byRules(court.hours.conflict.rules ?? []) !== state) return 'unknown';
  return state;
}

/* ---------- evidence grouping ---------- */

/**
 * Pure: every row and confirm grouped by 'spot:kind', for a caller (or a
 * test) that has one flat batch of rows across many spots and kinds and
 * wants each spot+kind's own evidence set, the shape reading() and
 * qualityVibe() take. A confirm without its report in `rows` is dropped (the
 * report row itself decides which spot+kind a confirm belongs to).
 */
export function groupEvidence(rows, confirms = []) {
  const map = new Map();
  const ensure = (key) => { if (!map.has(key)) map.set(key, { rows: [], confirms: [] }); return map.get(key); };
  for (const r of rows) ensure(`${r.spot}:${r.kind}`).rows.push(r);
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const c of confirms) {
    const r = byId.get(c.report_id);
    if (r) ensure(`${r.spot}:${r.kind}`).confirms.push(c);
  }
  return map;
}

/** Today's newest on-site human 'ok' report at a spot+kind ("Last report 4:10: tight"), or null. Never an agent or remote row. */
export function lastOnSite(rows, cfg, nowMs) {
  const today = laDate(nowMs);
  const human = (r) => !String(r.source ?? 'page').startsWith('agent:');
  const on = (v) => v === 1 || v === true;
  const rowsToday = rows.filter((r) => (r.status ?? 'ok') === 'ok' && on(r.onsite) && human(r) && r.day === today);
  const last = rowsToday.sort((a, b) => a.observed_at - b.observed_at).at(-1);
  if (!last) return null;
  return { value: last.value, label: labelOf(cfg, last.value), observedAt: isoSec(last.observed_at), byline: last.byline || guestByline(last.pid_hash) };
}

/* ---------- quality (vibe) ---------- */

const VIBE_LABELS = {
  pancake: 'Pancake', solid: 'Solid', character: 'Character', survival: 'Survival Mode', condemned: 'Condemned',
};
/** A rating counts once a phone's own extras cap has been enforced upstream; this is display-only. */
const RUNNER_UP_SHARE = 0.3;
/**
 * The network a rating counts as, the crew rule's netOf (air-reading.mjs): a
 * signed-in phone is its own network, a guest is its hashed IP, else the phone.
 */
const netOf = (r) => (r.user_id ? `user:${r.user_id}` : (r.ip_hash || r.pid_hash));

/**
 * Pure: the 30-day vibe line. Reads on-site, 'ok' page rows only (never an
 * agent or remote row — a rating is never inferred), keeps the latest row
 * per phone (`user_id` when signed in, else `pid_hash`), and returns null
 * under 3 raters — or when every rater sits on one network (CREW_NETS, the
 * crew's own guard: device ids are free, so three private tabs on one
 * connection are one person, not a consensus). Otherwise `{mode, label, runnerUp, n, chips}`: `mode`/
 * `label` are the most-rated bucket; `runnerUp` is the second bucket's label,
 * shown only once it holds 30%+ of `n`; `chips` are extras by count, most
 * first. There is deliberately no star average: the bucket a phone picked is
 * the unit, not a number to blend.
 */
export function qualityVibe(rows, nowMs, windowMs = 30 * DAY) {
  const since = nowMs - windowMs;
  const on = (v) => v === 1 || v === true;
  const human = (r) => !String(r.source ?? 'page').startsWith('agent:');
  const ok = (r) => (r.status ?? 'ok') === 'ok';
  const eligible = rows
    .filter((r) => ok(r) && on(r.onsite) && human(r) && r.observed_at >= since && r.observed_at <= nowMs)
    .sort((a, b) => a.observed_at - b.observed_at);
  const latest = new Map();
  for (const r of eligible) latest.set(r.user_id ? `user:${r.user_id}` : `dev:${r.pid_hash}`, r); // ascending, so the last write wins
  const rated = [...latest.values()];
  const n = rated.length;
  if (n < 3) return null;
  if (new Set(rated.map(netOf)).size < CREW_NETS) return null;
  const counts = new Map();
  const chipCounts = new Map();
  for (const r of rated) {
    counts.set(r.value, (counts.get(r.value) ?? 0) + 1);
    let extras = [];
    try { extras = JSON.parse(r.extras_json ?? '[]'); } catch { /* malformed row: no chips from it */ }
    if (Array.isArray(extras)) for (const e of extras) chipCounts.set(e, (chipCounts.get(e) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [mode] = ranked[0];
  const runner = ranked[1];
  const runnerUp = runner && runner[1] / n >= RUNNER_UP_SHARE ? (VIBE_LABELS[runner[0]] ?? runner[0]) : null;
  const chips = [...chipCounts.entries()].sort((a, b) => b[1] - a[1]).map(([v, count]) => ({ v, n: count }));
  return { mode, label: VIBE_LABELS[mode] ?? mode, runnerUp, n, chips };
}

/* ---------- the hero pick ---------- */

/** Lower is a better bet: an empty rack beats a line. */
const WAIT_RANK = { '0': 0, '1-4': 1, '5-8': 2, '9+': 3 };
/** A live on-site answer that says there is no court to be had right now. */
const SHUT = new Set(['locked', 'booked', 'taken']);

/** Only the provenance of a sourced thing: {src, checked, confidence}. */
const provOf = (p) => (p ? { src: p.src, checked: p.checked, confidence: p.confidence } : null);

/**
 * Pure: the first rule that matches, ties going to `order` (lower first):
 *   1. A live `wait` reading of 0, 1-4, 5-8 or 9+ (never `locked`, `booked`,
 *      `taken` or `cant` — those are never a bet), ranked by bucket (0 best),
 *      then support, then freshness (lower ageMin).
 *   2. A drop-in block running now (`card.now` has one).
 *   3. An open court (`openState` 'open') with a showable `walkOn` fact.
 *   4. The soonest `next` drop-in, by day offset then start time (a
 *      priority or closed block — "Basketball priority" — is never a bet).
 * A court whose live on-site `wait` reading says `locked`, `booked` or
 * `taken` is skipped by every rule (build spec §6: never picks them): a
 * phone at the fence outranks the schedule. Cards: `{ id, order, short?,
 * status, walkOn: Fact|null, now: [{block, until}], next: {block, when}|null,
 * readings: {wait, parking?} }`. Returns `{court, reason, line, prov}` or null
 * when nothing on the board qualifies. `line` leads with the court's `short`
 * ("EL SEGUNDO REC · Advanced drop-in now until 7 PM · $5 · no reports yet"):
 * the hero and the OG card print it as the whole answer, so it says what the
 * phones say ("no reports yet" only when there is no report), and a partial
 * block carries its "unconfirmed" tag. `prov` is the block's or walk-on
 * fact's {src, checked, confidence} (null for a live reading).
 */
export function bestBet(cards, nowMs = Date.now()) {
  const shut = (c) => Boolean(c.readings?.wait && SHUT.has(c.readings.wait.value));
  const byOrder = [...cards].sort((a, b) => a.order - b.order).filter((c) => !shut(c));
  const lead = (c) => (c.short ? `${c.short} · ` : '');
  const tagOf = (b) => (b?.confidence === 'partial' ? ' · unconfirmed' : '');
  /** What the phones say at a scheduled court (a live 0–9+ would have won rule 1). */
  const phones = (c) => {
    const w = c.readings?.wait;
    if (w) return `${w.label} · ${supportLabel(Math.max(1, w.support))}`;
    return c.readings?.parking ? 'no wait report yet' : 'no reports yet';
  };

  const live = byOrder.filter((c) => c.readings?.wait && Object.prototype.hasOwnProperty.call(WAIT_RANK, c.readings.wait.value));
  if (live.length) {
    live.sort((a, b) =>
      WAIT_RANK[a.readings.wait.value] - WAIT_RANK[b.readings.wait.value]
      || b.readings.wait.support - a.readings.wait.support
      || a.readings.wait.ageMin - b.readings.wait.ageMin
      || a.order - b.order);
    const c = live[0];
    const r = c.readings.wait;
    return { court: c.id, reason: 'live', line: `${lead(c)}${r.label} · ${r.status === 'agree' ? `${r.support} agree` : '1 reporter'}`, prov: null };
  }

  const dropin = byOrder.find((c) => (c.now ?? []).some((s) => s.block.kind === 'dropin'));
  if (dropin) {
    const s = dropin.now.find((x) => x.block.kind === 'dropin');
    const fee = s.block.fee ? ` · ${s.block.fee}` : '';
    return { court: dropin.id, reason: 'dropin', line: `${lead(dropin)}${s.block.label} now until ${s.until}${fee}${tagOf(s.block)} · ${phones(dropin)}`, prov: provOf(s.block) };
  }

  const openWalk = byOrder.find((c) => c.status === 'open' && c.walkOn && showable(c.walkOn, nowMs).show);
  if (openWalk) return { court: openWalk.id, reason: 'open', line: `${lead(openWalk)}Open · ${openWalk.walkOn.text}${tagOf(openWalk.walkOn)}`, prov: provOf(openWalk.walkOn) };

  const withNext = byOrder.filter((c) => c.next && (c.next.block.kind ?? 'dropin') === 'dropin');
  if (withNext.length) {
    withNext.sort((a, b) =>
      (a.next.dayOffset ?? 0) - (b.next.dayOffset ?? 0)
      || (a.next.startMin ?? 0) - (b.next.startMin ?? 0)
      || a.order - b.order);
    const c = withNext[0];
    return { court: c.id, reason: 'next', line: `${lead(c)}Next: ${c.next.block.label} ${c.next.when}${tagOf(c.next.block)}`, prov: provOf(c.next.block) };
  }

  return null;
}

/**
 * Pure: a BoardReading as the open /courts.json feed publishes it — the
 * reading and its strength, never who. `bylines` (card @handles, and "Guest
 * NNNN" names that stay the same per phone), `crew` and `reportId` stay on
 * the board's own same-origin API: polled from anywhere every 30 s, a byline
 * next to `ageMin` would be a log of when a named person stands at a court.
 */
export function publicReading(r) {
  if (!r) return null;
  return { value: r.value, label: r.label, status: r.status, support: r.support, ageMin: r.ageMin, bars: r.bars, liveUntil: r.liveUntil };
}

/* ---------- the board payload ---------- */

/**
 * Pure: the BoardPayload (src/lib/courts.ts), no hashes past this point.
 * `o.courts` is COURTS (courtsSchedule order, air and listing alike).
 * `o.kindCfg` is `{ [spotId]: { wait: AirKind|null, parking: AirKind|null } }`
 * (a listing with no air spot has neither). `o.rows`/`o.confirms` are the
 * flat wait+parking evidence batch (groupEvidence sorts it out per spot);
 * `o.lastRows` is today's newest on-site, ok, human rows, for BoardLast — a
 * wider window than the live evidence (a decayed reading still shows a last
 * line); lastOnSite() re-checks the same filters.
 * `o.vibeRows` is the flat 30-day on-site vibe batch, newest first. `o.conditions` travels through
 * unchanged; its `sunset` (ISO) resolves any `hours.close: 'dusk'`.
 */
export function boardSummary(o) {
  const { now, courts, kindCfg = {}, rows = [], confirms = [], lastRows = [], vibeRows = [], validatorsToday = { phones: 0, courts: 0 }, conditions = null } = o;
  const evGroups = groupEvidence(rows, confirms);
  const sunsetMin = conditions?.sunset ? laParts(Date.parse(conditions.sunset)).minuteOfDay : null;

  const cards = courts.map((court) => {
    const cfg = kindCfg[court.id] ?? {};
    const status = openState(court, now, sunsetMin);
    const sessions = sessionsNow(court, now, sunsetMin);
    const next = nextSession(court, now, sunsetMin);
    // bestBet's rule 4 ranks the soonest drop-in, which may come after the card's own next block.
    const nextDropin = nextSession(court, now, sunsetMin, 7, ['dropin']);
    const readings = { wait: null, parking: null };
    const last = { wait: null, parking: null };
    for (const kind of /** @type {const} */ (['wait', 'parking'])) {
      const kcfg = cfg[kind];
      if (!kcfg) continue;
      const ev = evGroups.get(`${court.id}:${kind}`) ?? { rows: [], confirms: [] };
      const r = reading({ spot: court.id, cfg: kcfg, rows: ev.rows, confirms: ev.confirms, now });
      readings[kind] = r.status === 'none' ? null : {
        value: r.value, label: r.label, status: r.status, support: r.support, reportId: r.reportId,
        ageMin: r.ageMin, bars: r.bars, liveUntil: r.liveUntil,
        // No bylines on the board: it is fetchable by anyone and the page never shows them.
        // A sliding-window crew belongs to the live 'wait' question only; a
        // 'side' kind (parking) never forms one, whatever its own window finds.
        crew: kind === 'parking' ? null : r.crew,
      };
      last[kind] = lastOnSite(lastRows.filter((row) => row.spot === court.id && row.kind === kind), kcfg, now);
    }
    const vibe = qualityVibe(vibeRows.filter((row) => row.spot === court.id), now);
    return { id: court.id, order: court.order, short: court.short, status, walkOn: court.walkOn ?? null, now: sessions, next, nextDropin, readings, last, vibe };
  });

  const best = bestBet(cards.map((c) => ({ ...c, next: c.nextDropin })), now);
  return {
    serverTime: isoSec(now),
    validatorsToday,
    conditions,
    best,
    courts: cards.map((c) => ({
      id: c.id, status: c.status, now: c.now,
      next: c.next ? { block: c.next.block, when: c.next.when } : null,
      readings: c.readings, last: c.last, vibe: c.vibe,
    })),
  };
}
