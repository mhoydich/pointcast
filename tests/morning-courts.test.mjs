import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import {
  COURT_ITEMS_MAX, canFreeze, composeEdition, cutoffMs, freezeEdition, nwsAtTime, todaysCourtsLine, todaysSessions,
} from '../functions/_lib/morning.mjs';

/* ---------- fixtures in the schedule's shape (src/lib/courts.ts) ---------- */

const prov = (checked = '2026-09-28', confidence = 'verified') => ({ src: 'T1', checked, confidence });
const block = (over = {}) => ({ kind: 'dropin', label: 'Drop-in', days: [1], start: '09:00', end: '12:00', from: null, until: null, fee: '$5', ...prov(), ...over });
const court = (id, name, order, over = {}) => ({
  id, air: true, order, name, short: name, city: 'El Segundo', shape: null, status: 'open', facts: [], hours: null, walkOn: null, blocks: [], reserve: null, ...over,
});

const MIDDLE = court('courts', 'Manhattan Middle School courts', 1, {
  hours: { rules: [{ days: [0, 6], open: '08:00', close: 'dusk' }], else: 'unknown', ...prov() },
  facts: [{ key: 'fee', text: 'Free', ...prov() }],
});
const ES = court('el-segundo', 'El Segundo Recreation Park courts', 2, {
  blocks: [
    block({ label: 'Advanced drop-in', days: [1], start: '17:00', end: '19:00', from: '2026-09-07', until: '2026-10-26', fee: '$5' }),
    block({ label: 'Advanced drop-in', days: [5], start: '09:00', end: '12:00', from: '2026-09-04', until: '2026-10-30', fee: '$7' }),
    block({ label: '3.0 drop-in', days: [0, 6], start: '09:00', end: '12:00', from: '2026-09-05', until: '2026-10-31', fee: '$7' }),
    block({ label: '3.5 drop-in', days: [0, 6], start: '15:00', end: '17:00', from: '2026-09-05', until: '2026-10-31', fee: '$5' }),
    block({ kind: 'priority', label: 'Basketball priority', days: [0, 1, 2, 3, 4, 5, 6], start: '08:00', end: '09:00', fee: null }),
  ],
});
const HEIGHTS = court('manhattan-heights', 'Manhattan Heights Park courts', 3, {
  blocks: [
    block({ label: 'Drop-in · 7 courts', days: [1, 2, 4, 5], start: '08:00', end: '12:00', fee: '$3 resident / $4 non-resident a day' }),
    block({ label: 'Evening drop-in', days: [1, 5], start: '18:00', end: '21:00', fee: '$3 resident / $4 non-resident a day' }),
  ],
});
const ALTA = court('alta-vista', 'Alta Vista Park courts', 4, {
  blocks: [
    block({ days: [1, 3, 5], start: '08:00', end: '12:00', fee: '$5' }),
    block({ days: [2, 4], start: '17:00', end: '21:00', fee: '$5' }),
  ],
});
const DEE = court('torrance-dee', 'Dee Hardison Sports Center', 5, { blocks: [block({ days: [1, 3], start: '10:00', end: '14:00', fee: '$5' })] });
const KELLY = court('kelly', 'Kelly Courts', 6, {
  status: 'closed',
  hours: { rules: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '09:00', close: '19:00' }], else: 'closed', ...prov() },
  blocks: [block({ days: [0, 1, 2, 3, 4, 5, 6], start: '09:00', end: '12:00' })],
});
const COURTS = [MIDDLE, ES, HEIGHTS, ALTA, DEE, KELLY];

const SAT_IN_SEASON = '2026-10-24';
const MON = '2026-10-19';
const TUE = '2026-10-20';
const SUN_NOV_1 = '2026-11-01';
const names = (r) => r.items.map((i) => `${i.court} | ${i.label} | ${i.start}-${i.end} | ${i.fee}`);

/* ---------- todaysSessions ---------- */

test('todaysSessions: a Saturday in season is the Middle School window plus El Segundo\'s 3.0 and 3.5', () => {
  const r = todaysSessions(COURTS, SAT_IN_SEASON);
  assert.deepEqual(names(r), [
    'Manhattan Middle School | open play | 08:00-dusk | Free',
    'El Segundo Recreation Park | 3.0 drop-in | 09:00-12:00 | $7',
    'El Segundo Recreation Park | 3.5 drop-in | 15:00-17:00 | $5',
  ]);
  assert.equal(r.more, 0);
  assert.deepEqual(r.unpublished, []);
  assert.equal(r.checked, '2026-09-28');
  assert.ok(r.items.every((i) => i.unconfirmed === false));
  assert.ok(!r.items.some((i) => /priority/i.test(i.label)), 'a priority block is not a drop-in');
});

test('todaysSessions: a Monday is capped at four, sorted by start, with the rest counted', () => {
  const r = todaysSessions(COURTS, MON);
  assert.equal(COURT_ITEMS_MAX, 4);
  assert.deepEqual(names(r), [
    'Manhattan Heights Park | Drop-in · 7 courts | 08:00-12:00 | $3 resident / $4 non-resident a day',
    'Alta Vista Park | Drop-in | 08:00-12:00 | $5',
    'Dee Hardison Sports Center | Drop-in | 10:00-14:00 | $5',
    'El Segundo Recreation Park | Advanced drop-in | 17:00-19:00 | $5',
  ], 'same start: the court that is listed first; the Middle School has no Monday window');
  assert.equal(r.more, 1, 'the 6 PM evening drop-in is the one that did not fit');
  assert.equal(r.items.length + r.more, 5);
});

test('todaysSessions: a Tuesday has no El Segundo session and nothing is invented for it', () => {
  const r = todaysSessions(COURTS, TUE);
  assert.deepEqual(names(r), [
    'Manhattan Heights Park | Drop-in · 7 courts | 08:00-12:00 | $3 resident / $4 non-resident a day',
    'Alta Vista Park | Drop-in | 17:00-21:00 | $5',
  ]);
  assert.deepEqual(r.unpublished, [], 'El Segundo\'s schedule runs through Oct 31: a quiet Tuesday is not a gap');
});

test('todaysSessions: Sunday Nov 1 is past El Segundo\'s last published session', () => {
  const r = todaysSessions(COURTS, SUN_NOV_1);
  assert.deepEqual(names(r), ['Manhattan Middle School | open play | 08:00-dusk | Free']);
  assert.deepEqual(r.unpublished, [{ court: 'El Segundo Recreation Park', through: '2026-10-31' }]);
  assert.equal(r.checked, '2026-09-28', 'the oldest date among the printed items and the courts that stopped');
  // Oct 31 itself is still inside the season.
  const last = todaysSessions(COURTS, '2026-10-31');
  assert.deepEqual(last.unpublished, []);
  assert.ok(names(last).some((n) => n.includes('3.5 drop-in')));
  // A court with one open-ended block has not "stopped".
  const open = court('x', 'Open Courts', 7, { blocks: [block({ days: [0], until: '2026-10-31' }), block({ days: [0], until: null })] });
  assert.deepEqual(todaysSessions([open], SUN_NOV_1).unpublished, []);
  // Priority-only and block-less courts never show up as unpublished.
  assert.deepEqual(todaysSessions([DEE, court('y', 'Plain', 8)], SUN_NOV_1).unpublished, []);
});

test('todaysSessions: a partial block is unconfirmed, an unverified one is not printed, fees can be absent', () => {
  const partial = court('p', 'Partial Park courts', 7, { blocks: [
    block({ label: 'Drop-in', days: [6], start: '10:00', end: '12:00', confidence: 'partial', fee: null }),
    block({ label: 'Guess', days: [6], start: '07:00', end: '08:00', confidence: 'unverified' }),
  ] });
  const r = todaysSessions([partial], SAT_IN_SEASON);
  assert.deepEqual(r.items.map((i) => [i.court, i.label, i.fee, i.unconfirmed]), [['Partial Park', 'Drop-in', null, true]]);
  const middle = { ...MIDDLE, hours: { ...MIDDLE.hours, confidence: 'partial' } };
  assert.equal(todaysSessions([middle], SAT_IN_SEASON).items[0].unconfirmed, true, 'partial hours are unconfirmed too');
  const unverified = { ...MIDDLE, hours: { ...MIDDLE.hours, confidence: 'unverified' } };
  assert.deepEqual(todaysSessions([unverified], SAT_IN_SEASON).items, [], 'unverified hours never print');
  const noFee = { ...MIDDLE, facts: [{ key: 'fee', text: 'Free', ...prov('2026-09-28', 'partial') }] };
  assert.equal(todaysSessions([noFee], SAT_IN_SEASON).items[0].fee, null, 'only a verified fee fact prints');
  assert.deepEqual(todaysSessions([MIDDLE], TUE).items, [], 'the Middle School window has no weekday rule');
});

test('todaysSessions: the hours rule is for the Middle School only, and a closed court is skipped whole', () => {
  const elsHours = { ...ES, hours: { rules: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '08:00', close: '22:00' }], else: 'closed', ...prov() } };
  assert.ok(!todaysSessions([elsHours], TUE).items.some((i) => i.label === 'open play'), 'other courts\' hours are not sessions');
  const r = todaysSessions(COURTS, SAT_IN_SEASON);
  assert.ok(!JSON.stringify(r).includes('Kelly'), 'a closed court is never an item or an unpublished court');
  assert.deepEqual(todaysSessions([KELLY], SAT_IN_SEASON), { items: [], more: 0, unpublished: [], checked: null });
  assert.deepEqual(todaysSessions([], SAT_IN_SEASON), { items: [], more: 0, unpublished: [], checked: null });
  assert.deepEqual(todaysSessions(COURTS, 'nope'), { items: [], more: 0, unpublished: [], checked: null });
  assert.deepEqual(todaysSessions(null, SAT_IN_SEASON), { items: [], more: 0, unpublished: [], checked: null });
});

test('todaysSessions: a season that has not started or has ended never shows', () => {
  assert.deepEqual(names(todaysSessions([ES], '2026-09-04')), ['El Segundo Recreation Park | Advanced drop-in | 09:00-12:00 | $7'], 'Fri Sep 4 is the first day of the Friday block');
  assert.deepEqual(todaysSessions([ES], '2026-08-28').items, [], 'the Friday before it has nothing');
  assert.deepEqual(todaysSessions([ES], '2026-09-03').items, [], 'neither does a Thursday');
  assert.equal(todaysSessions([ES], '2026-10-26').items.length, 1, 'Mon Oct 26 is the last day of the Monday block');
  assert.equal(todaysSessions([ES], '2026-11-02').items.length, 0, 'Mon Nov 2 is past it');
});

/* ---------- nwsAtTime ---------- */

const HOUR = 3_600_000;
const T9 = Date.parse('2026-10-24T16:00:00Z'); // 9 AM PDT
const period = (startMs, over = {}) => ({
  startTime: new Date(startMs).toISOString(), endTime: new Date(startMs + HOUR).toISOString(), temperature: 66.4, temperatureUnit: 'F', windSpeed: '7 mph', ...over,
});

test('nwsAtTime: the period that covers the hour, wind as the largest number, Fahrenheit only', () => {
  const periods = [period(T9 - HOUR, { windSpeed: '3 mph', temperature: 60 }), period(T9), period(T9 + HOUR, { windSpeed: '12 mph', temperature: 70 })];
  assert.deepEqual(nwsAtTime(periods, T9 + 20 * 60_000), { windMph: 7, tempF: 66 }, 'inside a period');
  assert.deepEqual(nwsAtTime(periods, T9), { windMph: 7, tempF: 66 }, 'at its exact start');
  assert.deepEqual(nwsAtTime(periods, T9 + HOUR), { windMph: 12, tempF: 70 }, 'the end is exclusive: the next period starts there');
  assert.equal(nwsAtTime(periods, T9 + 5 * HOUR), null, 'outside every period');
  assert.equal(nwsAtTime(periods, T9 - 3 * HOUR), null);
  assert.deepEqual(nwsAtTime([period(T9, { windSpeed: '5 to 10 mph' })], T9), { windMph: 10, tempF: 66 }, 'a range reads as its top');
  assert.deepEqual(nwsAtTime([period(T9, { windSpeed: '4.6 mph' })], T9), { windMph: 5, tempF: 66 }, 'rounded');
  assert.deepEqual(nwsAtTime([period(T9, { temperatureUnit: 'C', temperature: 19 })], T9), { windMph: 7, tempF: null }, 'Celsius is not Fahrenheit');
  assert.deepEqual(nwsAtTime([period(T9, { windSpeed: 'Calm' })], T9), { windMph: null, tempF: 66 }, 'no number in the wind');
  assert.equal(nwsAtTime([period(T9, { windSpeed: 'Calm', temperatureUnit: 'C' })], T9), null, 'nothing to say at all');
  assert.deepEqual(nwsAtTime([period(T9, { windSpeed: undefined, temperature: undefined })], T9), null);
});

test('nwsAtTime: bad input is null, never a throw', () => {
  for (const bad of [null, undefined, 'x', {}, 42]) assert.equal(nwsAtTime(bad, T9), null);
  assert.equal(nwsAtTime([null, 3, 'x', {}, { startTime: 'x', endTime: 'y' }], T9), null);
  assert.equal(nwsAtTime([period(T9)], NaN), null);
  assert.equal(nwsAtTime([period(T9)], undefined), null);
});

/* ---------- todaysCourtsLine ---------- */

const sat = () => todaysSessions(COURTS, SAT_IN_SEASON);

test('todaysCourtsLine: the sessions, where they were checked, then the forecast and sunset', () => {
  const today = { sessions: sat(), nws: { at: 480, windMph: 6, tempF: 64 }, sunset: '6:05 PM' };
  assert.equal(todaysCourtsLine(today, SAT_IN_SEASON),
    'Today\'s courts: Manhattan Middle School open play 8 AM to dusk, free; El Segundo Recreation Park 3.0 drop-in 9 AM–12 PM, $7; El Segundo Recreation Park 3.5 drop-in 3–5 PM, $5. From the posted schedules, checked Sep 28. NWS for 8 AM: wind 6 mph, 64°F. Sunset 6:05 PM.');
  assert.equal(todaysCourtsLine({ sessions: sat(), nws: null, sunset: null }, SAT_IN_SEASON),
    'Today\'s courts: Manhattan Middle School open play 8 AM to dusk, free; El Segundo Recreation Park 3.0 drop-in 9 AM–12 PM, $7; El Segundo Recreation Park 3.5 drop-in 3–5 PM, $5. From the posted schedules, checked Sep 28.');
  assert.ok(!/!/.test(todaysCourtsLine(today, SAT_IN_SEASON)), 'no exclamation marks');
});

test('todaysCourtsLine: forecast values print only when they exist', () => {
  const sessions = sat();
  const line = (nws, sunset = null) => todaysCourtsLine({ sessions, nws, sunset }, SAT_IN_SEASON);
  assert.match(line({ at: 540, windMph: 7, tempF: 66 }), / NWS for 9 AM: wind 7 mph, 66°F\.$/);
  assert.match(line({ at: 540, windMph: 7, tempF: null }), / NWS for 9 AM: wind 7 mph\.$/);
  assert.match(line({ at: 540, windMph: null, tempF: 66 }), / NWS for 9 AM: 66°F\.$/);
  assert.match(line({ at: 570, windMph: 0, tempF: 66 }), / NWS for 9:30 AM: wind 0 mph, 66°F\.$/, 'calm is a number, not a gap');
  assert.match(line({ at: 17 * 60, windMph: 7, tempF: null }), / NWS for 5 PM: wind 7 mph\.$/);
  assert.doesNotMatch(line({ at: 540, windMph: null, tempF: null }), /NWS/);
  assert.doesNotMatch(line({ at: 'nine', windMph: 7, tempF: 66 }), /NWS/);
  assert.doesNotMatch(line(undefined), /NWS/);
  assert.match(line(null, '6:05 PM'), / Sunset 6:05 PM\.$/);
  assert.doesNotMatch(line(null, '—'), /Sunset/);
  assert.doesNotMatch(line(null, ''), /Sunset/);
  assert.match(line({ at: 540, windMph: 7, tempF: 66 }, '6:05 PM'), /NWS for 9 AM: wind 7 mph, 66°F\. Sunset 6:05 PM\.$/, 'forecast, then sunset');
});

test('todaysCourtsLine: a capped list, a partial block, no sessions and a schedule that stopped', () => {
  const mon = todaysCourtsLine({ sessions: todaysSessions(COURTS, MON), nws: null, sunset: '6:14 PM' }, MON);
  assert.equal(mon, 'Today\'s courts: Manhattan Heights Park drop-in · 7 courts 8 AM–12 PM, $3 resident / $4 non-resident a day; Alta Vista Park drop-in 8 AM–12 PM, $5; Dee Hardison Sports Center drop-in 10 AM–2 PM, $5; El Segundo Recreation Park advanced drop-in 5–7 PM, $5; +1 more at pointcast.xyz/pickleball. From the posted schedules, checked Sep 28. Sunset 6:14 PM.');
  const partial = court('p', 'Partial Park courts', 7, { blocks: [block({ days: [6], start: '10:00', end: '12:30', confidence: 'partial', fee: null })] });
  assert.equal(todaysCourtsLine({ sessions: todaysSessions([partial], SAT_IN_SEASON) }, SAT_IN_SEASON),
    'Today\'s courts: Partial Park drop-in 10 AM–12:30 PM (unconfirmed). From the posted schedules, checked Sep 28.');
  const nov = todaysCourtsLine({ sessions: todaysSessions(COURTS, SUN_NOV_1), nws: null, sunset: '5:00 PM' }, SUN_NOV_1);
  assert.equal(nov, 'Today\'s courts: Manhattan Middle School open play 8 AM to dusk, free. From the posted schedules, checked Sep 28. El Segundo Recreation Park has not published drop-ins past Oct 31 yet. Sunset 5:00 PM.');
  const none = todaysCourtsLine({ sessions: todaysSessions([KELLY], SAT_IN_SEASON), nws: { at: 540, windMph: 5, tempF: 70 }, sunset: '6:05 PM' }, SAT_IN_SEASON);
  assert.equal(none, 'Today\'s courts: no sourced sessions today. NWS for 9 AM: wind 5 mph, 70°F. Sunset 6:05 PM.', 'no items, so no "from the posted schedules" claim');
  const stopped = todaysCourtsLine({ sessions: { items: [], more: 0, unpublished: [{ court: 'El Segundo Recreation Park', through: '2026-10-31' }], checked: '2026-09-28' } }, SUN_NOV_1);
  assert.equal(stopped, 'Today\'s courts: no sourced sessions today. El Segundo Recreation Park has not published drop-ins past Oct 31 yet.');
  // A court that has not stopped yet (through is not before the date) is never reported as stopped.
  assert.doesNotMatch(todaysCourtsLine({ sessions: { items: [], more: 0, unpublished: [{ court: 'X Park', through: '2026-11-05' }], checked: null } }, SUN_NOV_1), /has not published/);
  // Garbage in, the quiet sentence out.
  for (const bad of [null, undefined, {}, { sessions: null }, { sessions: { items: [{ court: 'X' }, null, 3] } }]) {
    assert.equal(todaysCourtsLine(bad, SAT_IN_SEASON), 'Today\'s courts: no sourced sessions today.');
  }
});

/* ---------- the edition ---------- */

const SAT = '2026-10-03'; // No. 1, a Saturday in season
const KLAX = { underTheLayerNow: true, observedAt: '2026-10-03T12:53:00.000Z' };
const rid = (n) => `ar_${String(n).padStart(20, '0')}`;
const byId = (e, id) => e.slots.find((s) => s.id === id);
const COURT_CALL = 'Next Court Call Fri 7:30 AM on 7.500.';
const todayFor = (date, extra = {}) => ({ sessions: todaysSessions(COURTS, date), nws: null, sunset: '6:30 PM', ...extra });

test('composeEdition: no reading and a `today` prints the schedules, then the Court Call; it still freezes', () => {
  const today = todayFor(SAT);
  const e = composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX }, courts: { spot: 'courts', yesterday: null, lastWeek: null, today } } });
  const c = byId(e, 'courts');
  assert.equal(c.line, `${todaysCourtsLine(today, SAT)} ${COURT_CALL}`);
  assert.match(c.line, /^Today's courts: Manhattan Middle School open play 8 AM to dusk, free; El Segundo Recreation Park 3\.0 drop-in 9 AM–12 PM, \$7; /);
  assert.equal(c.source, 'schedule');
  assert.equal(c.fallback, true, 'no report reached the line');
  assert.deepEqual(c.reportIds, []);
  assert.deepEqual(c.bylines, []);
  assert.equal(c.spot, 'courts');
  assert.equal(c.label, 'Courts · 7.500');
  assert.equal(e.slots.length, 7);
  assert.deepEqual(e.slots.map((s) => s.id), ['sky', 'courts', 'price', 'town', 'ritual', 'pick', 'shop']);
  assert.equal(e.provisional, false);
  assert.deepEqual(e.missing, []);
  assert.deepEqual(e.reportIds, []);
  assert.ok(canFreeze(e, cutoffMs(SAT)), 'a day with no reports and a schedule line is a whole edition');
  assert.equal(freezeEdition(e, cutoffMs(SAT) + 60_000).slots[1].line, c.line);
});

test('composeEdition: the source says what the line is made of', () => {
  const week = { value: '5-8', at: Date.parse('2026-09-25T14:38:00Z'), support: 3, bylines: ['@jen'], reportIds: [rid(7)] };
  const nws = { at: 480, windMph: 6, tempF: 64 };
  const make = (courts) => composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX }, courts } });
  assert.equal(byId(make({ yesterday: null, lastWeek: null, today: todayFor(SAT) }), 'courts').source, 'schedule');
  assert.equal(byId(make({ yesterday: null, lastWeek: null, today: todayFor(SAT, { nws }) }), 'courts').source, 'schedule+nws');
  const both = byId(make({ yesterday: null, lastWeek: week, today: todayFor(SAT, { nws }) }), 'courts');
  assert.equal(both.source, 'schedule+air+nws');
  assert.equal(byId(make({ yesterday: null, lastWeek: week, today: todayFor(SAT) }), 'courts').source, 'schedule+air');
  assert.equal(both.line, `${todaysCourtsLine(todayFor(SAT, { nws }), SAT)} The week before, Fri 25 Sep 7:38 AM: 5–8 in the rack, 3 agree. ${COURT_CALL}`, 'schedules, week before, Court Call');
  assert.equal(both.fallback, true);
  assert.deepEqual(both.reportIds, [], 'a week-old summary cites nobody');
  assert.deepEqual(both.bylines, []);
  assert.match(both.line, /NWS for 8 AM: wind 6 mph, 64°F\./);
});

test('composeEdition: a reading wins over `today`, and an unavailable store keeps its v1 line', () => {
  const m = { value: '1-4', at: Date.parse('2026-10-02T14:41:00Z'), support: 2, bylines: ['@mike', 'Guest 4471'], reportIds: [rid(1)] };
  const read = byId(composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX }, courts: { yesterday: m, lastWeek: null, today: todayFor(SAT) } } }), 'courts');
  assert.equal(read.line, `Yesterday 7:41 AM: 1–4 in the rack, 2 agree — @mike, Guest 4471. ${COURT_CALL}`);
  assert.equal(read.source, 'air');
  assert.doesNotMatch(read.line, /Today's courts/);
  const down = composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX }, courts: undefined } });
  assert.equal(byId(down, 'courts').line, `The courts log is not in yet. ${COURT_CALL}`);
  assert.deepEqual(down.missing, ['reports']);
  const none = byId(composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX }, courts: { yesterday: null, lastWeek: null } } }), 'courts');
  assert.equal(none.line, `No reports from the courts yesterday. ${COURT_CALL}`, 'no `today`: the v1 line');
  assert.equal(none.source, 'template');
  const junk = byId(composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX }, courts: { yesterday: null, today: 'Saturday' } } }), 'courts');
  assert.equal(junk.line, `No reports from the courts yesterday. ${COURT_CALL}`, 'a `today` that is not an object is ignored');
});

test('composeEdition: the Court Call is the station\'s own on a Friday, with today\'s courts above it', () => {
  const FRI = '2026-10-09';
  const e = composeEdition({ date: FRI, config, sources: { sky: { marine: KLAX }, courts: { yesterday: null, lastWeek: null, today: todayFor(FRI) } } });
  assert.match(byId(e, 'courts').line, /^Today's courts: .*El Segundo Recreation Park advanced drop-in 9 AM–12 PM, \$7;/);
  assert.match(byId(e, 'courts').line, /Court Call today, 7:30 AM on 7\.500\.$/);
});

/* ---------- the real schedule ---------- */

const REAL = JSON.parse(readFileSync(new URL('../src/data/courts-schedule.json', import.meta.url), 'utf8')).courts.sort((a, b) => a.order - b.order);
const trim = (name) => name.replace(/ courts?$/, '');

function addDay(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}

test('the real schedule: every printed session is a line in courts-schedule.json, for every day to the end of the year', () => {
  let printedDays = 0;
  for (let date = '2026-10-03'; date <= '2026-12-31'; date = addDay(date, 1)) {
    const r = todaysSessions(REAL, date);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    assert.ok(r.items.length <= COURT_ITEMS_MAX, date);
    for (const item of r.items) {
      const owner = REAL.find((c) => trim(c.name) === item.court);
      assert.ok(owner, `${date}: ${item.court} is a court in the file`);
      assert.notEqual(owner.status, 'closed', `${date}: ${item.court} is open`);
      const fromHours = owner.id === 'courts' && item.label === 'open play'
        && owner.hours.rules.some((rule) => rule.days.includes(weekday) && rule.open === item.start && rule.close === item.end);
      const fromBlock = owner.blocks.some((b) => b.kind === 'dropin' && b.label === item.label && b.start === item.start && b.end === item.end
        && b.fee === item.fee && b.days.includes(weekday) && (!b.from || date >= b.from) && (!b.until || date <= b.until) && b.confidence !== 'unverified');
      assert.ok(fromHours || fromBlock, `${date}: ${JSON.stringify(item)} comes from the schedule`);
    }
    // A court is "unpublished" only when every one of its drop-in blocks has ended.
    for (const u of r.unpublished) {
      const owner = REAL.find((c) => trim(c.name) === u.court);
      const drops = owner.blocks.filter((b) => b.kind === 'dropin' && b.confidence !== 'unverified');
      assert.ok(drops.length > 0 && drops.every((b) => b.until && b.until < date), `${date}: ${u.court}`);
      assert.equal(u.through, drops.map((b) => b.until).sort().at(-1));
    }
    const line = todaysCourtsLine({ sessions: r, nws: null, sunset: '6:00 PM' }, date);
    assert.match(line, /^Today's courts: /);
    assert.ok(!/!/.test(line) && !/\bnull\b|undefined|NaN/.test(line), `${date}: ${line}`);
    assert.doesNotMatch(line, /Kelly/, 'the closed court never prints');
    if (r.items.length) printedDays++;
  }
  assert.ok(printedDays > 60, 'most days of the quarter have something sourced');
});

test('the real schedule: Sat Oct 24 and Sun Nov 1 2026 read as the paper will print them', () => {
  const oct24 = todaysSessions(REAL, '2026-10-24');
  assert.ok(oct24.items.some((i) => i.court === 'El Segundo Recreation Park' && i.label === '3.0 drop-in' && i.start === '09:00' && i.end === '12:00'), 'El Segundo\'s Saturday morning 3.0');
  assert.deepEqual(oct24.unpublished, [], 'inside every season');
  const line = todaysCourtsLine({ sessions: oct24, nws: null, sunset: '6:09 PM' }, '2026-10-24');
  assert.match(line, /El Segundo Recreation Park 3\.0 drop-in 9 AM–12 PM, \$7/);
  assert.match(line, / From the posted schedules, checked [A-Z][a-z]{2} \d{1,2}\. Sunset 6:09 PM\.$/);
  const es = REAL.find((c) => c.id === 'el-segundo');
  const stops = es.blocks.filter((b) => b.kind === 'dropin').every((b) => b.until && b.until < '2026-11-01');
  const nov = todaysSessions(REAL, '2026-11-01');
  assert.equal(nov.unpublished.some((u) => u.court === 'El Segundo Recreation Park'), stops, 'El Segundo is "unpublished" on Nov 1 exactly while its last sourced day is before it');
  if (stops) assert.match(todaysCourtsLine({ sessions: nov, nws: null, sunset: null }, '2026-11-01'), /El Segundo Recreation Park has not published drop-ins past [A-Z][a-z]{2} \d{1,2} yet\./);
});
