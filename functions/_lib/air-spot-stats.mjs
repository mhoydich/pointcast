// Pure parts of the spot page header (GET /api/air/[spot] `header`): today's
// strip, the prior readings, the access override, the week's leaderboard,
// parking and vibe — kept in a plain module so tests run them under node
// without the Pages runtime. air-store.ts runs the SQL and hands rows in.
//
// Privacy, the leaderboard's rules (docs: spot header design, 2026-09-28):
//   - it counts DAYS on air this week (Mon–Sun, LA), never times: a named
//     handle next to a time of day is a log of when a person stands at a court;
//   - only card @handles are named; everyone else is one number, "+N guests";
//   - agent rows never count (the SQL filters source = 'page', and on-site
//     rows can only be page rows anyway);
//   - house accounts (role 'broadcaster') can appear, marked `house: true`.
// Inputs to weekLeaders() carry `first` (the member's first report of the
// week, epoch ms) for the tie-break only; it never reaches the output.
// todayStats() reads phone hashes through evidence() to count distinct
// phones; only the count leaves.

import { evidence, isoSec, laClock, laDate, laParts } from './air-reading.mjs';
import { labelOf } from './air-kinds.mjs';
import { qualityVibe } from './court-board.mjs';

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Names on the board at most; the rest of the named are simply not shown. */
export const LEADERS_MAX = 5;
/** Members read per spot per week, enough to fill LEADERS_MAX after released handles drop out. */
export const MEMBERS_READ = 12;
/** A live `wait` answer that says there is no court to be had (court-board.mjs's SHUT). */
export const SHUT = Object.freeze(['locked', 'booked', 'taken']);
/** How far back "the newest day before today" looks, in days. */
export const PRIOR_LOOKBACK_DAYS = 90;
/** Parking reports older than today and the six days before are not shown (so a weekday name is never ambiguous). */
export const PARKING_DAYS = 7;
/** The vibe line's window (court-board.mjs's qualityVibe default). */
export const VIBE_WINDOW_MS = 30 * DAY;

/** 'YYYY-MM-DD' + n days, UTC-noon anchored so DST never shifts the calendar date. */
export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}
const dayNum = (day) => Math.floor(Date.parse(`${day}T12:00:00Z`) / DAY);
const weekdayName = (day) => WEEKDAYS[new Date(`${day}T12:00:00Z`).getUTCDay()];

/** The LA week holding `now`, Monday to Sunday: { from, to } as 'YYYY-MM-DD'. */
export function weekRange(now) {
  const { day, weekday } = laParts(now);
  const from = addDays(day, -((weekday + 6) % 7));
  return { from, to: addDays(from, 6) };
}

/**
 * Pure: the TODAY strip for one spot's question. `rows`/`confirms` are the
 * spot page's evidence (air-store loadSpot: the last 49 hours of that
 * question); `crew` is the day's anchored crew row or null.
 * - reports: today's 'ok' rows, any source (remote and agent rows are
 *   reports too; they just never count as evidence)
 * - validators: distinct on-site phones today, reports plus "still" confirms
 * - crew: whether today has a crew
 * - lastAt/lastAgeMin: the newest on-site human report today, or null
 */
export function todayStats({ rows, confirms = [], crew = null, now }) {
  const today = laDate(now);
  const reports = rows.filter((r) => (r.status ?? 'ok') === 'ok' && r.day === today).length;
  const ev = evidence(rows, confirms).filter((e) => laDate(e.t) === today && e.t <= now + MIN);
  const validators = new Set(ev.map((e) => e.pid)).size;
  const last = ev.filter((e) => e.via === 'report').at(-1);
  return {
    reports,
    validators,
    crew: Boolean(crew),
    lastAt: last ? isoSec(last.t) : null,
    lastAgeMin: last ? Math.max(0, Math.floor((now - last.t) / MIN)) : null,
  };
}

/**
 * Pure: one PRIOR line from air-store's lastOfDay() result ({r, t}, a
 * reading at the day's last on-site moment), or null. `at` is 12-hour LA
 * time; `daysAgo` lets the page pick its words (priorDayWord). No bylines:
 * a name next to a past time is the log this header never keeps.
 */
export function priorLine(found, day, now) {
  if (!found || !day) return null;
  return {
    day,
    daysAgo: dayNum(laDate(now)) - dayNum(day),
    at: laClock(found.t, { ampm: true }),
    value: found.r.value,
    label: found.r.label,
    support: found.r.support,
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/**
 * Pure: the words a PRIOR line opens with, from its `day` and `daysAgo`.
 * "Yesterday" (1), the bare weekday inside the week behind ("Sat", 2–6),
 * "Last Mon" for exactly a week, and a dated "Wed Sep 3" for anything older
 * — the lookback reaches PRIOR_LOOKBACK_DAYS, so a month-old reading must
 * never read as last week's. The page (air-client.ts) prints this.
 */
export function priorDayWord(day, daysAgo) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return '';
  if (daysAgo === 1) return 'Yesterday';
  const wd = weekdayName(day);
  if (daysAgo >= 2 && daysAgo <= 6) return wd;
  if (daysAgo === 7) return `Last ${wd}`;
  const [, m, d] = day.split('-').map(Number);
  return `${wd} ${MONTHS[m - 1]} ${d}`;
}

/**
 * Pure: the access override under the hours line — a live reading of an
 * access value (SHUT), or else today's last on-site reading when that was
 * one ("Last: Gate locked · reported 7:41 AM"). Never a fact: always the
 * time it was reported and how many agree. `reading` is the page's live
 * Reading; `lastToday` is lastOfDay(today) ({r, t}) or null. A live reading
 * of anything else (a wait, "can't say") means no override.
 */
export function accessOverride(reading, lastToday) {
  if (reading && reading.status !== 'none') {
    if (!SHUT.includes(reading.value)) return null;
    return { value: reading.value, label: reading.label, at: laClock(Date.parse(reading.observedAt), { ampm: true }), support: reading.support, live: true };
  }
  if (!lastToday || !SHUT.includes(lastToday.r.value)) return null;
  return { value: lastToday.r.value, label: lastToday.r.label, at: laClock(lastToday.t, { ampm: true }), support: lastToday.r.support, live: false };
}

/**
 * Pure: the ON THE AIR THIS WEEK line. `members` are the week's signed-in
 * on-site reporters at the spot, one per account, already resolved at read
 * time to `{handle|null, days, first, house}` (a released handle or no card
 * is null). `guestPhones` is the server's count of distinct guest phones.
 * A member without a handle is one more guest. Ranked by days, then the
 * earlier first report of the week; LEADERS_MAX at most. Leaders carry
 * {handle, days, house} and nothing else.
 */
export function weekLeaders(members, guestPhones = 0, max = LEADERS_MAX) {
  let guests = Math.max(0, Number(guestPhones) || 0);
  const leaders = [];
  const seen = new Set();
  const ranked = [...members].sort((a, b) => Number(b.days) - Number(a.days) || Number(a.first) - Number(b.first));
  for (const m of ranked) {
    const handle = typeof m.handle === 'string' && m.handle ? m.handle : null;
    if (!handle) { guests++; continue; }
    if (seen.has(handle)) continue;
    seen.add(handle);
    if (leaders.length < max) leaders.push({ handle, days: Number(m.days), house: m.house === true });
  }
  return { leaders, guests };
}

/**
 * Pure: the parking line from the newest on-site human parking report of
 * the last PARKING_DAYS ({value, observed_at, day}), or null. `at` is
 * "9:10 AM" today, else "Sun 9:10 AM".
 */
export function parkingLine(row, cfg, now) {
  if (!row || !cfg) return null;
  const clock = laClock(row.observed_at, { ampm: true });
  return {
    value: row.value,
    label: labelOf(cfg, row.value),
    day: row.day,
    at: row.day === laDate(now) ? clock : `${weekdayName(row.day)} ${clock}`,
  };
}

/** Pure: the vibe line (qualityVibe, 3+ raters on 2+ networks) as {label, n, runnerUp, chips}, or null. */
export function vibeLine(rows, now) {
  const v = qualityVibe(rows, now, VIBE_WINDOW_MS);
  return v ? { label: v.label, n: v.n, runnerUp: v.runnerUp, chips: v.chips.map((c) => c.v) } : null;
}
