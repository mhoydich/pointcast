import assert from 'node:assert/strict';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import { guestByline, kindOf } from '../functions/_lib/air-kinds.mjs';
import {
  bars, crewFrom, evidence, inHours, laClock, laDate, laParts, reading, stationLine, streakWeeks, supportLabel, weekOf, windowIdx, winKey,
} from '../functions/_lib/air-reading.mjs';

const MIN = 60_000;
const COURTS = kindOf(config, 'courts', 'wait');
const BEACH = kindOf(config, 'beach', 'fog');
const T0 = Date.parse('2026-10-02T14:36:00Z'); // Fri 7:36 AM in El Segundo

let n = 0;
const report = (pid, value, t, over = {}) => ({
  id: `ar_${String(++n).padStart(16, '0')}`, spot: 'courts', kind: 'wait', value, observed_at: t,
  pid_hash: pid.padEnd(16, '0'), user_id: null, byline: `@${pid}`, onsite: 1, status: 'ok', source: 'page', ...over,
});
const confirm = (pid, r, t, over = {}) => ({ report_id: r.id, pid_hash: pid.padEnd(16, '0'), user_id: null, verdict: 'still', onsite: 1, at: t, ...over });
const read = (rows, confirms = [], now = T0, cfg = COURTS, spot = 'courts') => reading({ spot, cfg, rows, confirms, now });

test('reading: none, single and agree', () => {
  const none = read([]);
  assert.equal(none.status, 'none');
  assert.equal(none.value, null);
  assert.equal(none.support, 0);
  assert.equal(none.last, null);

  const a = report('aaaa', '1-4', T0);
  const single = read([a], [], T0 + MIN);
  assert.equal(single.status, 'single');
  assert.equal(single.value, '1-4');
  assert.equal(single.label, '1–4 in the rack');
  assert.equal(single.support, 1);
  assert.equal(single.reportId, a.id);
  assert.equal(single.observedAt, '2026-10-02T14:36:00Z');
  assert.equal(single.ageMin, 1);
  assert.equal(single.bars, 5);
  assert.equal(single.liveUntil, '2026-10-02T15:21:00Z');
  assert.deepEqual(single.bylines, ['@aaaa']);
  assert.equal(supportLabel(single.support), '1 reporter');

  const jen = confirm('bbbb', a, T0 + 2 * MIN);
  const sam = report('cccc', '1-4', T0 + 3 * MIN);
  const agree = read([a, sam], [jen], T0 + 3 * MIN);
  assert.equal(agree.status, 'agree');
  assert.equal(agree.support, 3);
  assert.deepEqual(agree.bylines, ['@aaaa', guestByline('bbbb000000000000'), '@cccc'], 'a guest confirm gets the phone\'s guest byline');
  assert.equal(agree.reportId, sam.id, 'the newest report leads');
  assert.equal(supportLabel(agree.support), '3 agree');
  assert.ok(!JSON.stringify(agree).includes('pid'), 'no phone hashes in a reading');
});

test('reading: only the latest row per phone counts', () => {
  const rows = [report('aaaa', '0', T0), report('aaaa', '5-8', T0 + 31 * MIN), report('bbbb', '0', T0 + 32 * MIN)];
  const r = read(rows, [], T0 + 33 * MIN);
  assert.equal(r.support, 1);
  assert.equal(r.value, '0', 'a tie goes to the newest');
  const r2 = read([...rows, report('cccc', '5-8', T0 + 20 * MIN)], [], T0 + 33 * MIN);
  assert.equal(r2.value, '5-8');
  assert.equal(r2.support, 2);
});

test('reading: "can\'t say" never wins against a real answer', () => {
  const rows = [report('aaaa', 'cant', T0), report('bbbb', 'cant', T0 + MIN), report('cccc', '1-4', T0 - MIN)];
  const r = read(rows, [], T0 + 2 * MIN);
  assert.equal(r.value, '1-4');
  assert.equal(r.support, 1);
  const alone = read([report('dddd', 'cant', T0)], [], T0 + MIN);
  assert.equal(alone.value, 'cant', 'alone, an honest non-answer is the reading');
  assert.equal(alone.label, "Can't say");
});

test('reading: remote, agent, removed and self-confirm rows carry zero support', () => {
  const remote = report('aaaa', '5-8', T0, { onsite: 0 });
  const agent = report('agnt', '0', T0, { onsite: 0, source: 'agent:cc', source_url: 'https://example.com' });
  const removed = report('bbbb', '5-8', T0, { status: 'removed' });
  const flagged = report('eeee', '5-8', T0, { status: 'flagged' });
  assert.equal(read([remote, agent, removed, flagged], [], T0 + MIN).status, 'none');
  const own = report('cccc', '1-4', T0);
  const r = read([own], [confirm('cccc', own, T0 + MIN), confirm('dddd', own, T0 + MIN, { onsite: 0 }), confirm('ffff', own, T0 + MIN, { verdict: 'changed' })], T0 + 2 * MIN);
  assert.equal(r.support, 1, 'self, remote and "changed" confirms add nothing');
  const onAgent = read([agent], [confirm('1234', agent, T0 + MIN)], T0 + 2 * MIN);
  assert.equal(onAgent.support, 1, 'a person on site confirming an agent row is the witness');
  assert.deepEqual(onAgent.bylines, ['Guest 5660'], 'and gets the guest byline, not the agent\'s');
});

test('reading: rows expire at 45 minutes (courts) and 120 minutes (beach)', () => {
  const a = report('aaaa', '1-4', T0);
  assert.equal(read([a], [], T0 + 45 * MIN - 1).status, 'single');
  const gone = read([a], [], T0 + 45 * MIN);
  assert.equal(gone.status, 'none');
  assert.deepEqual(gone.last, { value: '1-4', label: '1–4 in the rack', observedAt: '2026-10-02T14:36:00Z', byline: '@aaaa' }, 'the grey "last report" line');
  const fog = report('bbbb', 'hazy', T0, { spot: 'beach', kind: 'fog' });
  assert.equal(read([fog], [], T0 + 119 * MIN, BEACH, 'beach').label, 'Pier hazy');
  assert.equal(read([fog], [], T0 + 120 * MIN, BEACH, 'beach').status, 'none');
  const c = confirm('cccc', a, T0 + 40 * MIN);
  const kept = read([a], [c], T0 + 50 * MIN);
  assert.equal(kept.status, 'single', 'a still confirm is a fresh observation');
  assert.equal(kept.observedAt, '2026-10-02T15:16:00Z');
});

test('reading: bars go 5, then down to 1, then expire', () => {
  assert.deepEqual([0, 8.99, 9, 18, 27, 36, 44.99, 45, 60].map((m) => bars(m * MIN, 45)), [5, 5, 4, 3, 2, 1, 1, 0, 0]);
  assert.equal(bars(-5 * MIN, 45), 5, 'a fast clock is fresh, not six bars');
  assert.deepEqual([0, 24, 48, 119, 120].map((m) => bars(m * MIN, 120)), [5, 4, 3, 1, 0]);
  const a = report('aaaa', '1-4', T0);
  assert.deepEqual([0, 10, 20, 30, 40].map((m) => read([a], [], T0 + m * MIN).bars), [5, 4, 3, 2, 1]);
});

test('crew: fires at 3 distinct on-site phones within 30 minutes', () => {
  const a = report('aaaa', '1-4', T0);
  const b = confirm('bbbb', a, T0 + 2 * MIN);
  const c = report('cccc', '1-4', T0 + 3 * MIN + 10_000);
  const crew = crewFrom({ spot: 'courts', cfg: COURTS, rows: [a, c], confirms: [b], now: T0 + 4 * MIN });
  assert.equal(crew.n, 3);
  assert.equal(crew.at, T0 + 3 * MIN + 10_000);
  assert.equal(crew.id, `courts:2026-10-02:${Math.floor((7 * 60 + 39) / 45)}`);
  assert.deepEqual(crew.members.map((m) => m.owner), ['dev:aaaa000000000000', 'dev:bbbb000000000000', 'dev:cccc000000000000']);
  const r = read([a, c], [b], T0 + 4 * MIN);
  assert.deepEqual(r.crew, { id: crew.id, n: 3, at: '2026-10-02T14:39:10Z' });
  assert.ok(!('members' in r.crew), 'members never ride in a reading');
  const five = crewFrom({ spot: 'courts', cfg: COURTS, rows: [a, c, report('dddd', '1-4', T0 + 5 * MIN), report('eeee', '5-8', T0 + 5 * MIN)], confirms: [b], now: T0 + 6 * MIN });
  assert.equal(five.n, 5);
  assert.equal(five.at, T0 + 3 * MIN + 10_000, 'the crew time is when the third phone landed');
});

test('crew: does not fire at 2, with a remote or agent third, the same phone twice, or the reporter confirming', () => {
  const a = report('aaaa', '1-4', T0);
  const b = report('bbbb', '1-4', T0 + MIN);
  const crew = (rows, confirms = [], now = T0 + 5 * MIN) => crewFrom({ spot: 'courts', cfg: COURTS, rows, confirms, now });
  assert.equal(crew([a, b]), null, 'two phones');
  assert.equal(crew([a, b, report('cccc', '1-4', T0 + 2 * MIN, { onsite: 0 })]), null, 'a remote third');
  assert.equal(crew([a, b, report('agnt', '1-4', T0 + 2 * MIN, { onsite: 0, source: 'agent:cc', source_url: 'https://example.com' })]), null, 'an agent third');
  assert.equal(crew([a, b, report('aaaa', '5-8', T0 + 3 * MIN)]), null, 'the same phone twice');
  assert.equal(crew([a, b], [confirm('aaaa', a, T0 + 2 * MIN), confirm('bbbb', a, T0 + 2 * MIN)]), null, 'confirms by phones already counted');
  assert.equal(crew([a, b, report('cccc', '1-4', T0 + 2 * MIN)], [], T0 + 33 * MIN), null, 'the first phone fell out of the 30 minutes');
  assert.ok(crew([a, b, report('cccc', '1-4', T0 + 2 * MIN)], [], T0 + 30 * MIN), 'still inside at exactly 30');
});

test('evidence: reports and still confirms, oldest first', () => {
  const a = report('aaaa', '0', T0);
  const ev = evidence([a], [confirm('bbbb', a, T0 + MIN)]);
  assert.deepEqual(ev.map((e) => [e.via, e.value, e.reportId]), [['report', '0', a.id], ['confirm', '0', a.id]]);
});

test('time: LA days, windows and clocks', () => {
  assert.deepEqual(laParts(T0), { day: '2026-10-02', weekday: 5, hour: 7, minute: 36, minuteOfDay: 456 });
  assert.equal(windowIdx(T0, 45), 10);
  assert.equal(winKey(T0, 45), '2026-10-02:10');
  assert.equal(laDate(Date.parse('2026-10-03T06:59:00Z')), '2026-10-02', 'still Friday night in El Segundo');
  assert.equal(laClock(T0), '7:36');
  assert.equal(laClock(T0, { pad: true }), '07:36');
  assert.equal(laClock(T0 + 12 * 3600_000, { ampm: true }), '7:36 PM');
  assert.equal(laParts(Date.parse('2026-11-01T15:00:00Z')).hour, 7, 'after DST ends LA is UTC-8');
  assert.equal(stationLine({ name: 'Manhattan Middle School courts', label: '1–4 in the rack', support: 1, at: T0 }), 'On the air from Manhattan Middle School courts: 1–4 in the rack · 1 reporter · 7:36');
  assert.equal(stationLine({ name: 'Manhattan Middle School courts', label: '1–4 in the rack', support: 3, at: T0 + 3 * MIN }), 'On the air from Manhattan Middle School courts: 1–4 in the rack · 3 agree · 7:39');
});

test('streaks: weekly, Monday to Sunday in El Segundo, across the week boundary', () => {
  const sunNight = laDate(Date.parse('2026-10-05T06:30:00Z')); // Sun 4 Oct, 11:30 PM LA; already Monday in UTC
  const monMorning = laDate(Date.parse('2026-10-05T16:00:00Z')); // Mon 5 Oct, 9 AM LA
  assert.equal(sunNight, '2026-10-04');
  assert.equal(weekOf('2026-10-04'), weekOf('2026-09-28'), 'Sunday closes the week that began Monday');
  assert.equal(weekOf('2026-10-05'), weekOf('2026-10-04') + 1);
  const now = Date.parse('2026-10-05T17:00:00Z');
  const e = (day, over = {}) => ({ day, onsite: 1, source: 'page', ...over });
  assert.equal(streakWeeks([e(sunNight), e(monMorning)], now), 2);
  assert.equal(streakWeeks([e('2026-09-28'), e(sunNight)], now), 1, 'two days in one week is one week');
  assert.equal(streakWeeks([e('2026-09-28'), e(sunNight)], Date.parse('2026-10-11T12:00:00Z')), 1, 'an empty current week keeps the streak alive');
  assert.equal(streakWeeks([e('2026-09-28')], Date.parse('2026-10-12T17:00:00Z')), 0, 'a whole missed week ends it');
  assert.equal(streakWeeks([e('2026-09-21'), e('2026-10-05')], now), 1, 'a gap breaks the run');
  assert.equal(streakWeeks([e(sunNight, { onsite: 0 }), e(monMorning, { source: 'agent:cc' }), e('2026-09-28', { status: 'removed' })], now), 0, 'remote, agent and removed rows never count');
  assert.equal(streakWeeks([e('2026-09-14'), e('2026-09-21'), e('2026-09-28'), e(monMorning)], now), 4);
});

test('crew needs two networks; a confirm counts the value it saw; the strip leads with a report that still says it', () => {
  const net = (r, ip) => ({ ...r, ip_hash: ip });
  const a = net(report('aaaa', '1-4', T0), 'ip1');
  const b = net(report('bbbb', '1-4', T0 + MIN), 'ip1');
  const c = net(report('cccc', '1-4', T0 + 2 * MIN), 'ip1');
  assert.equal(crewFrom({ spot: 'courts', cfg: COURTS, rows: [a, b, c], now: T0 + 3 * MIN }), null, 'three ids, one network');
  const d = net(report('dddd', '1-4', T0 + 3 * MIN), 'ip2');
  const crew = crewFrom({ spot: 'courts', cfg: COURTS, rows: [a, b, c, d], now: T0 + 4 * MIN });
  assert.equal(crew.at, T0 + 3 * MIN, 'the crew lands with the second network');
  assert.equal(crew.n, 4);
  // Friends on one carrier share a CGNAT address; a signed-in phone counts as its own network.
  const signedIn = { ...c, user_id: 'u-jen' };
  const cgnat = crewFrom({ spot: 'courts', cfg: COURTS, rows: [a, b, signedIn], now: T0 + 3 * MIN });
  assert.equal(cgnat?.n, 3, 'two guests and one signed-in phone on one IP make a crew');
  const allSignedIn = [a, b, c].map((r, i) => ({ ...r, user_id: `u${i}` }));
  assert.equal(crewFrom({ spot: 'courts', cfg: COURTS, rows: allSignedIn, now: T0 + 3 * MIN })?.n, 3);

  const p1 = report('eeee', '5-8', T0 + 5 * MIN); // changed from '0' after p2 confirmed it
  const p2 = confirm('ffff', p1, T0 + 3 * MIN, { value: '0' });
  const r = read([p1], [p2], T0 + 6 * MIN);
  assert.equal(r.value, '5-8');
  assert.equal(r.support, 1, 'the confirm backed "0", not "5+"');
  const old = read([p1], [p2], T0 + 3.5 * MIN);
  assert.equal(old.value, '0');
  assert.equal(old.reportId, null, 'no report still says "0", so there is nothing to confirm');
});

test('open hours: LA wall time, open inclusive, close exclusive, every spot has them', () => {
  for (const s of config.spots) assert.match(`${s.hours?.open}-${s.hours?.close}`, /^\d{2}:\d{2}-\d{2}:\d{2}$/, `${s.id} has open hours`);
  const courts = config.spots.find((s) => s.id === 'courts').hours;
  assert.deepEqual(courts, { open: '06:00', close: '22:00' });
  assert.deepEqual(config.spots.find((s) => s.id === 'beach').hours, { open: '05:30', close: '20:30' });
  assert.equal(inHours(courts, Date.parse('2026-10-02T07:01:00Z')), false, '00:01 PDT');
  assert.equal(inHours(courts, Date.parse('2026-10-02T13:00:00Z')), true, '06:00 PDT opens');
  assert.equal(inHours(courts, Date.parse('2026-10-02T13:05:00Z')), true, '06:05 PDT');
  assert.equal(inHours(courts, Date.parse('2026-10-03T05:00:00Z')), false, '22:00 PDT closes');
  assert.equal(inHours(courts, Date.parse('2026-11-06T13:05:00Z')), false, '05:05 PST: after DST ends it is still LA time');
  assert.equal(inHours(courts, Date.parse('2026-11-06T14:05:00Z')), true, '06:05 PST');
  const late = { open: '18:00', close: '02:00' };
  assert.equal(inHours(late, Date.parse('2026-10-03T08:00:00Z')), true, '01:00, past midnight');
  assert.equal(inHours(late, Date.parse('2026-10-03T10:00:00Z')), false, '03:00');
  assert.equal(inHours(undefined, T0), false, 'no hours is never open');
  assert.equal(inHours({ open: 'dawn', close: '22:00' }, T0), false, 'unreadable hours are never open');
});
