import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
  planCheckin, planPass, passInFor, planDeskCheck, heldCount, chainLines, verifyChain, summarize,
  editionFor, POINTS_GENESIS, POINT_KINDS,
} from '../src/lib/network-points.mjs';
import { DESK_NOTES, noteFrontSVG, noteBackSVG, machineEdition } from '../src/lib/currency-builder/desk-notes.mjs';
import { railsDocument, LAYERS } from '../src/lib/nouns-money-rails.mjs';

const A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const day = (n, h = 15) => new Date(Date.UTC(2026, 10, 9 + n, h)).toISOString();

async function streak(profile, days) {
  let lines = [];
  for (let i = 0; i < days; i += 1) {
    const drafts = planCheckin({ profile, at: day(i), ref: `${profile}-${i}` }, lines);
    lines = lines.concat(await chainLines(drafts, lines.at(-1)?.id ?? POINTS_GENESIS));
  }
  return lines;
}
const append = async (lines, drafts) => lines.concat(await chainLines(drafts, lines.at(-1)?.id ?? POINTS_GENESIS));

test('passing moves one held note from one chain to the other, and both chains still verify', async () => {
  let a = await streak(A, 3);
  let b = [];
  assert.equal(heldCount(a, 'blue'), 1);
  a = await append(a, [planPass({ from: A, to: B, note: 'blue', at: day(2, 18) }, a)]);
  b = await append(b, [passInFor(a.at(-1))]);
  assert.equal(heldCount(a, 'blue'), 0);
  assert.equal(heldCount(b, 'blue'), 1);
  assert.equal(b[0].ref, `pass:${a.at(-1).id}`);
  assert.equal(a.at(-1).ref.endsWith(B), true);
  assert.equal((await verifyChain(a)).ok, true);
  assert.equal((await verifyChain(b)).ok, true);
  const sa = summarize(A, a, { now: new Date(day(2)) });
  assert.equal(sa.held.blue, 0);
  assert.equal(sa.points, summarize(A, a.slice(0, -1), { now: new Date(day(2)) }).points);
  assert.equal(summarize(B, b, { now: new Date(day(2)) }).held.blue, 1);
});

test('passing refuses a note you do not hold, a second pass the same day, and yourself', async () => {
  let a = await streak(A, 3);
  assert.throws(() => planPass({ from: A, to: B, note: 'reserve', at: day(2) }, a), /note-not-held/);
  assert.throws(() => planPass({ from: A, to: A, note: 'enjoy', at: day(2) }, a), /pass-to-self/);
  assert.throws(() => planPass({ from: A, to: B, note: 'gold', at: day(2) }, a), /unknown-note/);
  assert.throws(() => planPass({ from: A, to: 'nope', note: 'enjoy', at: day(2) }, a), /bad-profile/);
  a = await append(a, [planPass({ from: A, to: B, note: 'enjoy', at: day(2) }, a)]);
  assert.throws(() => planPass({ from: A, to: B, note: 'enjoy', at: day(2, 20) }, a), /pass-limit/);
  assert.doesNotThrow(() => planPass({ from: A, to: B, note: 'enjoy', at: day(3) }, a));
});

test('a desk check earns that agent’s Desk Note once a day, and an unknown agent earns nothing', async () => {
  let lines = await append([], planDeskCheck({ profile: A, agent: 'sky', callId: 'ac_0123456789abcdef', at: day(0) }, []));
  assert.equal(lines[0].note, 'desk-sky');
  assert.equal(lines[0].edition, 'desk-notes');
  assert.equal(lines[0].points, POINT_KINDS['desk-check'].points);
  assert.deepEqual(planDeskCheck({ profile: A, agent: 'sky', callId: 'ac_1123456789abcdef', at: day(0, 20) }, lines), []);
  lines = await append(lines, planDeskCheck({ profile: A, agent: 'tides', callId: 'ac_2123456789abcdef', at: day(0, 20) }, lines));
  assert.equal(summarize(A, lines, { now: new Date(day(0)) }).notes['desk-notes']['desk-tides'], 1);
  assert.throws(() => planDeskCheck({ profile: A, agent: 'moon', callId: 'x', at: day(0) }, []), /unknown-agent/);
});

test('the standing Desk Notes edition never becomes the season a check-in falls in', () => {
  assert.equal(editionFor(day(0)).id, 'series-1');
  assert.equal(editionFor('2027-06-01T00:00:00Z').standing, undefined);
});

test('Desk Notes draw five faces, each with an actual Noun and the no-cash-value line', () => {
  assert.equal(DESK_NOTES.notes.length, 5);
  const ids = new Set(DESK_NOTES.notes.map((n) => n.nounId));
  assert.equal(ids.size, 5);
  assert.equal(ids.has(94), false);
  for (const n of DESK_NOTES.notes) {
    const front = noteFrontSVG(n);
    assert.match(front, /NO CASH VALUE/);
    assert.match(front, new RegExp(`NOUN #${n.nounId}`));
    assert.match(noteBackSVG(n), /NEVER SOLD/);
  }
  assert.match(machineEdition().status, /Reserved/);
});

test('the ledger table takes Desk Note ids and still refuses odd note values', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/auth/0035_points_ledger.sql', import.meta.url), 'utf8'));
  db.exec(`INSERT INTO points_profiles VALUES ('${A}', 'u1', NULL, NULL, 'now')`);
  const ins = db.prepare(`INSERT INTO points_ledger (id, prev, profile, kind, points, note, edition, site, ref, day, at) VALUES (?, ?, '${A}', 'desk-check', 5, ?, 'desk-notes', 'pointcast.xyz', ?, '2026-11-09', 'now')`);
  ins.run('i1', 'genesis', 'desk-sky', 'r1');
  ins.run('i2', 'i1', null, 'r2');
  assert.throws(() => ins.run('i3', 'i2', 'Desk Sky', 'r3'));
  assert.throws(() => ins.run('i4', 'i2', "x'; --", 'r4'));
  assert.throws(() => ins.run('i5', 'i2', '', 'r5'));
});

test('the rails spec names four layers in a loop, and keeps the no-cash-value rule', () => {
  const doc = railsDocument();
  assert.deepEqual(LAYERS.map((l) => l.id), ['connection', 'money', 'communication', 'verification']);
  assert.deepEqual(doc.loop, ['connection → money', 'money → communication', 'communication → verification', 'verification → connection']);
  assert.ok(doc.rules.some((r) => /never traded for money/.test(r)));
  assert.equal(doc.license, 'CC0-1.0');
  assert.ok(doc.editions.some((e) => e.id === 'desk-notes' && e.status === 'reserved'));
});
