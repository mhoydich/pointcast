import assert from 'node:assert/strict';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import { kindOf } from '../functions/_lib/air-kinds.mjs';
import { laDate, reading } from '../functions/_lib/air-reading.mjs';
import {
  LEADERS_MAX, PRIOR_LOOKBACK_DAYS, SHUT, accessOverride, addDays, parkingLine, priorDayWord, priorLine, todayStats, vibeLine, weekLeaders, weekRange,
} from '../functions/_lib/air-spot-stats.mjs';

const MIN = 60_000;
const HOUR = 60 * MIN;
const WAIT = kindOf(config, 'courts', 'wait');
const PARKING = kindOf(config, 'courts', 'parking');
const MON = Date.parse('2026-09-28T22:46:00Z'); // Mon Sep 28, 3:46 PM in El Segundo

let n = 0;
const report = (pid, value, t, over = {}) => ({
  id: `ar_${String(++n).padStart(16, '0')}`, spot: 'courts', kind: 'wait', value, observed_at: t, day: laDate(t),
  pid_hash: pid.padEnd(16, '0'), ip_hash: `ip-${pid}`, user_id: null, byline: `Guest ${pid}`, onsite: 1, status: 'ok', source: 'page', ...over,
});
const confirm = (pid, r, t, over = {}) => ({ report_id: r.id, pid_hash: pid.padEnd(16, '0'), ip_hash: `ip-${pid}`, user_id: null, verdict: 'still', value: r.value, onsite: 1, at: t, ...over });

/* ---------- the week ---------- */

test('week: Monday to Sunday in El Segundo, whatever the UTC day says', () => {
  assert.deepEqual(weekRange(MON), { from: '2026-09-28', to: '2026-10-04' });
  assert.deepEqual(weekRange(Date.parse('2026-10-05T06:30:00Z')), { from: '2026-09-28', to: '2026-10-04' }, 'Sun 11:30 PM in LA is still this week (Monday in UTC)');
  assert.deepEqual(weekRange(Date.parse('2026-10-05T07:30:00Z')), { from: '2026-10-05', to: '2026-10-11' }, 'Mon 12:30 AM starts the next');
  assert.deepEqual(weekRange(Date.parse('2026-09-28T07:05:00Z')), { from: '2026-09-28', to: '2026-10-04' }, 'Mon 12:05 AM');
  assert.deepEqual(weekRange(Date.parse('2026-11-01T19:00:00Z')), { from: '2026-10-26', to: '2026-11-01' }, 'the DST Sunday stays in its week');
  assert.equal(addDays('2026-11-01', 1), '2026-11-02');
});

/* ---------- today ---------- */

test('today: reports are every ok row today; validators are distinct on-site phones, reports and "still" confirms', () => {
  const t1 = Date.parse('2026-09-28T14:41:00Z'); // 7:41 AM
  const a = report('aaaa', 'locked', t1);
  const rows = [
    a,
    report('bbbb', '1-4', t1 + 20 * MIN, { onsite: 0 }), // remote: a report, never a validator
    report('cccc', '1-4', t1 + 30 * MIN, { onsite: 0, source: 'agent:codex', byline: 'codex' }), // agent: a report, never a validator
    report('dddd', '0', t1 + 40 * MIN, { status: 'flagged' }), // flagged: neither
    report('eeee', '5-8', t1 - 20 * HOUR), // yesterday: neither
  ];
  const confirms = [
    confirm('ffff', a, t1 + 5 * MIN),
    confirm('aaaa', a, t1 + 6 * MIN), // the reporter confirming their own: still one phone
    confirm('gggg', a, t1 + 7 * MIN, { onsite: 0 }), // from away: not a validator
    confirm('hhhh', a, t1 + 8 * MIN, { verdict: 'changed' }),
  ];
  const s = todayStats({ rows, confirms, crew: null, now: MON });
  assert.deepEqual(s, { reports: 3, validators: 2, crew: false, lastAt: '2026-09-28T14:41:00Z', lastAgeMin: 485 });
  assert.equal(todayStats({ rows, confirms, crew: { id: 'x', at: t1, n: 3 }, now: MON }).crew, true);
  const quiet = todayStats({ rows: [report('eeee', '5-8', t1 - 20 * HOUR)], now: MON });
  assert.deepEqual(quiet, { reports: 0, validators: 0, crew: false, lastAt: null, lastAgeMin: null });
  const text = JSON.stringify(s);
  assert.doesNotMatch(text, /aaaa|ffff|ip-/, 'only counts leave');
});

/* ---------- prior ---------- */

test('prior: a line is the day, days ago, 12-hour time, the reading and its support; never a byline', () => {
  const t = Date.parse('2026-09-28T01:12:00Z'); // Sun Sep 27, 6:12 PM
  const rows = [report('aaaa', '1-4', t - 5 * MIN, { byline: '@mike' }), report('bbbb', '1-4', t, { byline: '@claire' })];
  const r = reading({ spot: 'courts', cfg: WAIT, rows, confirms: [], now: t });
  const line = priorLine({ r, t }, '2026-09-27', MON);
  assert.deepEqual(line, { day: '2026-09-27', daysAgo: 1, at: '6:12 PM', value: '1-4', label: '1–4 in the rack', support: 2 });
  assert.doesNotMatch(JSON.stringify(line), /@|Guest/);
  assert.equal(priorLine(null, '2026-09-27', MON), null);
  assert.equal(priorLine({ r, t }, '2026-09-21', MON).daysAgo, 7);
});

test('prior words: a reading older than a week is dated, never "Last <weekday>"', () => {
  // Monday Sep 28 is today.
  assert.equal(priorDayWord('2026-09-27', 1), 'Yesterday');
  assert.equal(priorDayWord('2026-09-26', 2), 'Sat');
  assert.equal(priorDayWord('2026-09-22', 6), 'Tue');
  assert.equal(priorDayWord('2026-09-21', 7), 'Last Mon');
  assert.equal(priorDayWord('2026-09-20', 8), 'Sun Sep 20');
  assert.equal(priorDayWord('2026-09-03', 25), 'Thu Sep 3', 'almost a month back reads as its date');
  assert.equal(priorDayWord('2026-06-30', PRIOR_LOOKBACK_DAYS), 'Tue Jun 30');
  assert.equal(priorDayWord('nope', 3), '');
  // The words follow priorLine's own daysAgo, across a DST change too.
  const t = Date.parse('2026-09-04T01:12:00Z'); // Thu Sep 3, 6:12 PM
  const r = reading({ spot: 'courts', cfg: WAIT, rows: [report('aaaa', '1-4', t)], confirms: [], now: t });
  const old = priorLine({ r, t }, '2026-09-03', MON);
  assert.equal(old.daysAgo, 25);
  assert.equal(`${priorDayWord(old.day, old.daysAgo)} ${old.at}`, 'Thu Sep 3 6:12 PM');
  assert.equal(priorLine({ r, t }, '2026-10-31', Date.parse('2026-11-02T20:00:00Z')).daysAgo, 2, 'Sat Oct 31 is two days before Mon Nov 2');
});

/* ---------- the access override ---------- */

test('override: a live locked/booked/taken reading, else today\'s last on-site reading if it was one; never anything else', () => {
  assert.deepEqual([...SHUT], ['locked', 'booked', 'taken']);
  const t1 = Date.parse('2026-09-28T14:41:00Z'); // 7:41 AM
  const rows = [report('aaaa', 'locked', t1), report('bbbb', 'locked', t1 + MIN)];
  const live = reading({ spot: 'courts', cfg: WAIT, rows, confirms: [], now: t1 + 10 * MIN });
  assert.deepEqual(accessOverride(live, null), { value: 'locked', label: 'Gate locked', at: '7:42 AM', support: 2, live: true });

  const expired = reading({ spot: 'courts', cfg: WAIT, rows, confirms: [], now: MON });
  assert.equal(expired.status, 'none');
  const lastToday = { r: reading({ spot: 'courts', cfg: WAIT, rows, confirms: [], now: t1 + MIN }), t: t1 + MIN };
  assert.deepEqual(accessOverride(expired, lastToday), { value: 'locked', label: 'Gate locked', at: '7:42 AM', support: 2, live: false });

  const open = reading({ spot: 'courts', cfg: WAIT, rows: [report('cccc', '1-4', MON - MIN)], confirms: [], now: MON });
  assert.equal(accessOverride(open, lastToday), null, 'a live wait answer overrides the morning\'s locked gate');
  const waitToday = { r: reading({ spot: 'courts', cfg: WAIT, rows: [report('cccc', '1-4', t1)], confirms: [], now: t1 }), t: t1 };
  assert.equal(accessOverride(expired, waitToday), null);
  assert.equal(accessOverride(expired, null), null);
});

/* ---------- the week's leaderboard ---------- */

test('leaderboard: days on air, ties to the earlier first report, five names at most, the rest one number', () => {
  const members = [
    { handle: 'claire', days: 3, first: 300, house: false },
    { handle: 'mike', days: 4, first: 500, house: false },
    { handle: 'pointcast', days: 3, first: 100, house: true },
    { handle: null, days: 5, first: 50, house: false }, // released handle or no card: a guest
    { handle: 'dee', days: 1, first: 10, house: false },
    { handle: 'eve', days: 1, first: 20, house: false },
    { handle: 'fay', days: 1, first: 30, house: false },
  ];
  const { leaders, guests } = weekLeaders(members, 6);
  assert.equal(LEADERS_MAX, 5);
  assert.deepEqual(leaders, [
    { handle: 'mike', days: 4, house: false },
    { handle: 'pointcast', days: 3, house: true },
    { handle: 'claire', days: 3, house: false },
    { handle: 'dee', days: 1, house: false },
    { handle: 'eve', days: 1, house: false },
  ]);
  assert.equal(guests, 7, 'six guest phones and one member with no handle');
  for (const l of leaders) assert.deepEqual(Object.keys(l), ['handle', 'days', 'house'], 'a leader is handle, days and house; never a time');
  assert.deepEqual(weekLeaders([], 0), { leaders: [], guests: 0 });
  assert.deepEqual(weekLeaders([{ handle: '', days: 2, first: 1, house: true }], 0), { leaders: [], guests: 1 });
});

test('leaderboard privacy: no time of day, no first-report stamp, no hash reaches the output', () => {
  const first = Date.parse('2026-09-28T14:41:00Z');
  const members = [{ handle: 'mike', days: 2, first, house: false, user_id: 'u_mike', pid_hash: 'deadbeefdeadbeef' }];
  const out = weekLeaders(members, 3);
  const text = JSON.stringify(out);
  assert.doesNotMatch(text, /\d{1,2}:\d{2}|T\d{2}:|AM|PM/, 'no clock');
  assert.ok(!text.includes(String(first)), 'no first-report epoch');
  assert.doesNotMatch(text, /u_mike|deadbeef|pid|user_id|first/);
  assert.deepEqual(out, { leaders: [{ handle: 'mike', days: 2, house: false }], guests: 3 });
});

/* ---------- parking and vibe ---------- */

test('parking: the newest on-site report with its time; a weekday name once it is not today', () => {
  const sun = Date.parse('2026-09-27T16:10:00Z'); // Sun 9:10 AM
  assert.deepEqual(parkingLine({ value: 'easy', observed_at: sun, day: '2026-09-27' }, PARKING, MON), { value: 'easy', label: 'Parking easy', day: '2026-09-27', at: 'Sun 9:10 AM' });
  const mon = Date.parse('2026-09-28T16:10:00Z');
  assert.equal(parkingLine({ value: 'tight', observed_at: mon, day: '2026-09-28' }, PARKING, MON).at, '9:10 AM');
  assert.equal(parkingLine(null, PARKING, MON), null);
  assert.equal(parkingLine({ value: 'easy', observed_at: sun, day: '2026-09-27' }, null, MON), null, 'no parking question, no line');
});

test('vibe: hidden under three raters or on one network; else the mode, n and chips by name', () => {
  const v = (pid, value, extras = [], over = {}) => report(pid, value, MON - HOUR, { kind: 'vibe', extras_json: JSON.stringify(extras), ...over });
  assert.equal(vibeLine([v('aaaa', 'solid'), v('bbbb', 'solid')], MON), null);
  assert.equal(vibeLine([v('aaaa', 'solid', [], { ip_hash: 'one' }), v('bbbb', 'solid', [], { ip_hash: 'one' }), v('cccc', 'solid', [], { ip_hash: 'one' })], MON), null);
  const line = vibeLine([v('aaaa', 'solid', ['no-shade']), v('bbbb', 'solid', ['no-shade']), v('cccc', 'character')], MON);
  assert.deepEqual(line, { label: 'Solid', n: 3, runnerUp: 'Character', chips: ['no-shade'] });
});
