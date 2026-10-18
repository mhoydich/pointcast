import assert from 'node:assert/strict';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import { DIRECTOR_WALLET } from '../functions/_lib/air-house.mjs';
import {
  FREEZE_LINE,
  KILL_TEST,
  KILL_TEST_RULES,
  countLine,
  countedKind,
  killTestCount,
  readLine,
} from '../functions/_lib/air-killtest.mjs';

// A "now" on Oct 20 (LA): not a fixture day, so a day found in the JSON
// could only have come from the rows.
const NOW = Date.parse('2026-10-20T19:00:00Z');

let n = 0;
/** One counted row; override any field. */
function row(over = {}) {
  n += 1;
  return {
    spot: 'el-segundo', kind: 'wait', day: '2026-10-05', slot: 1000 + n, who: `pid-${n}`,
    onsite: 1, source: 'page', status: 'ok', house_pid: 0, house_user: 0, user_payload: null,
    ...over,
  };
}
const count = (rows, now = NOW) => killTestCount(config, rows, now);

test('kill test: the numbers decided in the spec', () => {
  assert.deepEqual({ ...KILL_TEST }, { from: '2026-09-28', to: '2026-10-23', readOn: '2026-10-24', minReports: 10, minPeople: 3 });
  assert.ok(Object.isFrozen(KILL_TEST));
  assert.equal(KILL_TEST_RULES.length, 13);
  assert.ok(Object.isFrozen(KILL_TEST_RULES));
});

test('kill test: countedKind is the spot\'s live question only', () => {
  assert.equal(countedKind(config, 'courts', 'wait'), true);
  assert.equal(countedKind(config, 'el-segundo', 'wait'), true);
  assert.equal(countedKind(config, 'beach', 'fog'), true);
  for (const [spot, kind] of [['courts', 'parking'], ['courts', 'vibe'], ['courts', 'sign'], ['el-segundo', 'lights'],
    ['manhattan-heights', 'closes'], ['beach', 'tide'], ['beach', 'swell'], ['beach', 'aqi'], ['beach', 'wait'],
    ['nowhere', 'wait'], ['how', 'wait'], ['courts', 'nope']]) {
    assert.equal(countedKind(config, spot, kind), false, `${spot} ${kind}`);
  }
});

test('kill test: one plain report counts once', () => {
  const c = count([row({ who: 'guest-a' })]);
  assert.equal(c.reports, 1);
  assert.equal(c.people, 1);
  assert.equal(c.pass, false);
  assert.equal(c.final, false);
  assert.deepEqual(c.window, { from: '2026-09-28', to: '2026-10-23' });
  assert.deepEqual(c.needs, { reports: 10, people: 3 });
  assert.equal(c.asOf, '2026-10-20T19:00:00Z');
});

test('kill test: every filter drops its row', () => {
  const dropped = {
    'agent source': row({ source: 'agent:early-shift' }),
    'remote (onsite 0)': row({ onsite: 0 }),
    'remote (onsite false)': row({ onsite: false }),
    'onsite null': row({ onsite: null }),
    flagged: row({ status: 'flagged' }),
    removed: row({ status: 'removed' }),
    'before Sep 28': row({ day: '2026-09-27' }),
    'after Oct 23': row({ day: '2026-10-24' }),
    'a Friday (Court Call, Oct 2)': row({ day: '2026-10-02' }),
    'a Friday (Court Call, Oct 23)': row({ day: '2026-10-23' }),
    'no day': row({ day: null }),
    parking: row({ kind: 'parking' }),
    vibe: row({ kind: 'vibe' }),
    sign: row({ spot: 'courts', kind: 'sign' }),
    lights: row({ kind: 'lights' }),
    'beach tide': row({ spot: 'beach', kind: 'tide' }),
    'unknown spot': row({ spot: 'mars' }),
    'reserved id as spot': row({ spot: 'killtest' }),
    'empty who': row({ who: '' }),
    'null who': row({ who: null }),
  };
  for (const [name, r] of Object.entries(dropped)) {
    const c = count([r]);
    assert.equal(c.reports, 0, name);
    assert.equal(c.people, 0, name);
  }
  assert.equal(count([row({ spot: 'beach', kind: 'fog' })]).reports, 1, 'beach fog counts');
  assert.equal(count([row({ day: '2026-09-28' }), row({ day: '2026-10-22' })]).reports, 2, 'the first day and the last non-Friday day count');
  assert.equal(count([row({ onsite: true })]).reports, 1, 'onsite true counts');
  assert.equal(count(null).reports, 0);
  assert.equal(count([null, 3, 'x']).reports, 0);
});

test('kill test: one report per person per spot per kind per half hour', () => {
  const same = { who: 'guest-a', spot: 'el-segundo', kind: 'wait', slot: 5 };
  assert.equal(count([row(same), row(same), row(same)]).reports, 1, 'three in one slot');
  const c = count([row(same), row({ ...same, slot: 6 })]);
  assert.equal(c.reports, 2, 'two slots count twice');
  assert.equal(c.people, 1);
  assert.equal(count([row(same), row({ ...same, spot: 'courts' })]).reports, 2, 'two spots count twice');
  assert.equal(count([row(same), row({ ...same, who: 'guest-b' })]).people, 2);
});

test('kill test: house rows never count, by phone, by account, by role and by wallet', () => {
  const house = {
    'house_pid 1': row({ house_pid: 1 }),
    'house_pid true': row({ house_pid: true }),
    'house_user 1': row({ house_user: 1 }),
    broadcaster: row({ user_payload: JSON.stringify({ roles: ['broadcaster'] }) }),
    director: row({ user_payload: JSON.stringify({ roles: ['director'] }) }),
    wallet: row({ user_payload: JSON.stringify({ identities: [{ provider: 'kukai', id: DIRECTOR_WALLET }] }) }),
  };
  for (const [name, r] of Object.entries(house)) assert.equal(count([r]).reports, 0, name);
  assert.equal(count([row({ user_payload: JSON.stringify({ roles: ['reader'] }) })]).reports, 1, 'a reader counts');
});

test('kill test: passes at exactly 10 reports from 3 people', () => {
  const build = (reports, people) => Array.from({ length: reports }, (_, i) => row({ who: `p${i % people}`, slot: i }));
  const at = count(build(10, 3));
  assert.equal(at.reports, 10);
  assert.equal(at.people, 3);
  assert.equal(at.pass, true);
  assert.equal(count(build(9, 3)).pass, false, '9 from 3');
  assert.equal(count(build(10, 2)).pass, false, '10 from 2');
  assert.equal(count(build(30, 9)).pass, true);
});

test('kill test: final flips 16 minutes after midnight Oct 24 in El Segundo, once late Oct 23 rows have landed', () => {
  assert.equal(count([], Date.parse('2026-10-24T06:59:00Z')).final, false, 'Oct 23 11:59 PM PDT');
  assert.equal(count([], Date.parse('2026-10-24T07:00:00Z')).final, false, 'Oct 24 12:00 AM PDT: a queued Oct 23 report can still land');
  assert.equal(count([], Date.parse('2026-10-24T07:15:59Z')).final, false, '12:15:59 AM');
  assert.equal(count([], Date.parse('2026-10-24T07:16:00Z')).final, true, '12:16 AM PDT');
  assert.equal(count([], Date.parse('2026-11-30T12:00:00Z')).final, true);
});

test('kill test: the result is numbers, booleans and the two window dates only', () => {
  const rows = [
    row({ who: 'user_secret_1', day: '2026-10-01' }),
    row({ who: 'pidhash_secret_2', day: '2026-10-09', house_pid: 0 }),
    row({ who: 'pidhash_secret_3', day: '2026-10-15', user_payload: JSON.stringify({ roles: ['broadcaster'], name: 'payload_secret' }) }),
    row({ who: 'pidhash_secret_4', day: '2026-09-30', source: 'agent:early-shift' }),
  ];
  const c = count(rows);
  const text = JSON.stringify(c);
  for (const r of rows) {
    assert.ok(!text.includes(r.who), `no who ${r.who}`);
    assert.ok(!text.includes(r.day), `no day ${r.day}`);
  }
  assert.ok(!text.includes('secret'));
  assert.deepEqual(Object.keys(c).sort(), ['asOf', 'final', 'needs', 'pass', 'people', 'reports', 'window']);
  const days = text.match(/\d{4}-\d{2}-\d{2}/g);
  assert.deepEqual(days.filter((d) => d !== '2026-10-20'), ['2026-09-28', '2026-10-23'], 'only the window dates, and asOf');
});

test('kill test: countLine plurals', () => {
  assert.equal(countLine({ reports: 0, people: 0 }), '0 reports from 0 people so far. The test needs 10 non-Friday reports from 3 people, Sep 28 to Oct 23.');
  assert.equal(countLine({ reports: 1, people: 1 }), '1 report from 1 person so far. The test needs 10 non-Friday reports from 3 people, Sep 28 to Oct 23.');
  assert.equal(countLine({ reports: 2, people: 2 }), '2 reports from 2 people so far. The test needs 10 non-Friday reports from 3 people, Sep 28 to Oct 23.');
  assert.equal(countLine(count([row()])), '1 report from 1 person so far. The test needs 10 non-Friday reports from 3 people, Sep 28 to Oct 23.');
});

test('kill test: readLine is empty before the read, then says pass or not', () => {
  assert.equal(readLine({ reports: 12, people: 4, pass: true, final: false }), '');
  assert.equal(readLine(count([])), '');
  assert.equal(readLine({ reports: 12, people: 4, pass: true, final: true }), 'The read, Sat Oct 24: passed, with 12 non-Friday reports from 4 people.');
  const fail = readLine({ reports: 1, people: 1, pass: false, final: true });
  assert.equal(fail, `The read, Sat Oct 24: not passed. 1 non-Friday report from 1 person, short of 10 from 3. ${FREEZE_LINE}`);
  assert.ok(fail.endsWith(FREEZE_LINE));
  const finalFail = readLine(count([row()], Date.parse('2026-10-24T15:00:00Z')));
  assert.ok(finalFail.startsWith('The read, Sat Oct 24: not passed. 1 non-Friday report from 1 person'));
  assert.equal(readLine({ reports: 9, people: 3, pass: false, final: true, recount: { reports: 10, people: 3 } }),
    `The read, Sat Oct 24: not passed. 9 non-Friday reports from 3 people, short of 10 from 3. ${FREEZE_LINE} A recount now shows 10 reports from 3 people; the read stands.`);
});

test('kill test: Friday reports are left out (the PRD\'s strict count; Friday is the Court Call)', () => {
  // Court Call Fri Oct 23: 5 phones on site, each in two half-hour slots, is 10 reports from 5 people on a Friday.
  const fridays = Array.from({ length: 10 }, (_, i) => row({ who: `cc-${i % 5}`, day: '2026-10-23', slot: 9000 + i }));
  const c = count([...fridays, row({ who: 'guest-mon', day: '2026-09-28' })]);
  assert.deepEqual([c.reports, c.people, c.pass], [1, 1, false]);
  for (const day of ['2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23']) assert.equal(count([row({ day })]).reports, 0, day);
  for (const day of ['2026-10-01', '2026-10-03', '2026-10-04', '2026-10-22']) assert.equal(count([row({ day })]).reports, 1, day);
});

test('kill test: a guest who later signs in on the same phone is one person, not two', () => {
  const guest = row({ who: 'pid-x', pid: 'pid-x', uid: null, day: '2026-09-28', slot: 1 });
  const signedIn = [2, 3, 4].map((slot) => row({ who: 'user-u', pid: 'pid-x', uid: 'user-u', day: '2026-10-05', slot }));
  const c = count([guest, ...signedIn]);
  assert.deepEqual([c.reports, c.people], [4, 1]);
  // Two humans, one of whom reported as a guest more than a day before signing in: 2 people, not 3.
  const other = Array.from({ length: 6 }, (_, i) => row({ who: 'user-b', pid: 'pid-b', uid: 'user-b', slot: 100 + i }));
  const both = count([guest, ...signedIn, ...other]);
  assert.deepEqual([both.reports, both.people, both.pass], [10, 2, false]);
  // A guest phone never seen signed in is its own person.
  assert.equal(count([guest, row({ who: 'pid-y', pid: 'pid-y', uid: null })]).people, 2);
  // A guest row from a phone that signed in to a house account is house too.
  const houseGuest = row({ who: 'pid-h', pid: 'pid-h', uid: null, day: '2026-09-29' });
  const houseSigned = row({ who: 'user-h', pid: 'pid-h', uid: 'user-h', house_user: 1 });
  assert.equal(count([houseGuest, houseSigned]).reports, 0);
  // Rows without pid/uid (older callers) still count by who.
  assert.equal(count([row({ who: 'a' }), row({ who: 'b' })]).people, 2);
});

test('kill test: the rules read plainly', () => {
  for (const line of [...KILL_TEST_RULES, FREEZE_LINE]) {
    assert.ok(!line.includes('!'), line);
    assert.ok(!/(^|\s)I\s/.test(line), `no first person: ${line}`);
    assert.ok(!/(^|\s)my\s/i.test(line), `no first person: ${line}`);
    assert.ok(line.endsWith('.'), line);
  }
  assert.ok(KILL_TEST_RULES[11].endsWith(FREEZE_LINE.replace(/^The game layer freezes/, 'the game layer freezes')));
  assert.ok(KILL_TEST_RULES.some((r) => r.includes('10 or more non-Friday reports from 3 or more people')));
  assert.ok(KILL_TEST_RULES.some((r) => r.startsWith('Friday reports are left out.')));
  assert.ok(!KILL_TEST_RULES.some((r) => /filed from away does not count/.test(r)), 'no promise the code check cannot keep');
  assert.ok(KILL_TEST_RULES.some((r) => r.includes('we cannot tell where a phone is')));
});
