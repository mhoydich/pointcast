import test from 'node:test';
import assert from 'node:assert/strict';
import {
  planCheckin, planDrumDay, chainLines, verifyChain, summarize, rulebook,
  MAX_SAME_DAY_CHECKINS, POINT_KINDS, POINTS_GENESIS,
} from '../src/lib/network-points.mjs';
import { SERIES_ONE, noteFrontSVG, noteBackSVG, machineEdition, serial } from '../src/lib/currency-builder/series-one.mjs';

const P = 'a1b2c3d4e5f6a1b2c3d4e5f6';
const day = (n, h = 15) => new Date(Date.UTC(2026, 10, 9 + n, h)).toISOString();

async function run(events) {
  let lines = [];
  for (const e of events) {
    const drafts = e.drum ? planDrumDay({ profile: P, at: e.at }, lines) : planCheckin({ profile: P, place: '', ...e }, lines);
    lines = lines.concat(await chainLines(drafts, lines.at(-1)?.id ?? POINTS_GENESIS));
  }
  return lines;
}

test('first check-in of the day writes one Enjoy. line; repeats earn less and stop at the cap', async () => {
  const events = Array.from({ length: MAX_SAME_DAY_CHECKINS + 2 }, (_, i) => ({ at: day(0, 10 + i), ref: `c${i}` }));
  const lines = await run(events);
  assert.equal(lines.length, MAX_SAME_DAY_CHECKINS);
  assert.equal(lines[0].kind, 'checkin');
  assert.equal(lines[0].note, 'enjoy');
  assert.ok(lines.slice(1).every((l) => l.kind === 'checkin-again' && l.note === null));
});

test('streaks add a Blue Note every third day and a Nouns Reserve every seventh', async () => {
  const lines = await run(Array.from({ length: 7 }, (_, i) => ({ at: day(i), ref: `d${i}` })));
  const s = summarize(P, lines, { now: new Date(day(6)) });
  assert.equal(s.checkins.streak, 7);
  assert.deepEqual(s.held, { enjoy: 7, blue: 2, reserve: 1 });
  assert.equal(s.points, 7 * POINT_KINDS.checkin.points + 2 * POINT_KINDS.streak.points + POINT_KINDS['long-streak'].points);
});

test('a missed day resets the streak but keeps the notes', async () => {
  const lines = await run([{ at: day(0), ref: 'a' }, { at: day(1), ref: 'b' }, { at: day(3), ref: 'c' }]);
  const s = summarize(P, lines, { now: new Date(day(3)) });
  assert.equal(s.checkins.streak, 1);
  assert.equal(s.held.enjoy, 3);
  assert.equal(s.held.blue, 0);
});

test('first check-in from a network town adds one Nouns Reserve, only once per town', async () => {
  const lines = await run([{ at: day(0), ref: 'a', place: 'Medway' }, { at: day(1), ref: 'b', place: 'Medway' }]);
  assert.equal(lines.filter((l) => l.kind === 'sister-town').length, 1);
});

test('drumming earns one line a day', async () => {
  const lines = await run([{ drum: true, at: day(0, 9) }, { drum: true, at: day(0, 11) }, { drum: true, at: day(1) }]);
  assert.equal(lines.length, 2);
  assert.equal(summarize(P, lines, { now: new Date(day(1)) }).drums.days, 2);
});

test('the chain verifies, and any edited field breaks it', async () => {
  const lines = await run([{ at: day(0), ref: 'a' }, { at: day(1), ref: 'b' }, { at: day(2), ref: 'c' }]);
  assert.equal((await verifyChain(lines)).ok, true);
  const tampered = lines.map((l, i) => (i === 1 ? { ...l, points: 99 } : l));
  const v = await verifyChain(tampered);
  assert.equal(v.ok, false);
});

test('rulebook says no cash value and lists the three notes', () => {
  const r = rulebook();
  assert.match(JSON.stringify(r), /no cash value/i);
  assert.deepEqual(SERIES_ONE.notes.map((n) => n.id), ['enjoy', 'blue', 'reserve']);
});

test('Series 1 faces render as SVG with their serials and the disclaimer', () => {
  for (const n of SERIES_ONE.notes) {
    const front = noteFrontSVG(n);
    const back = noteBackSVG(n);
    assert.match(front, /^<svg/);
    assert.ok(front.includes(serial(n)));
    assert.match(back, /NEVER SOLD/);
  }
  const m = machineEdition();
  assert.equal(m.notes.length, 3);
  assert.ok(m.notes.every((n) => n.noun.id >= 0 && n.noun.id <= 99));
});
