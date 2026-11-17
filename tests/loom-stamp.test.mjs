// OFF-64: For You previews lead with the first real words, not a name/date stamp.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { splitStamp } from '../src/lib/loom/stamp.mjs';
import { buildPiles } from '../src/lib/loom/for-you.mjs';

const CASES = [
  ['Nov 14 · Sid, AI agent · DONE S5. Study: https://x', 'Nov 14 · Sid, AI agent', 'DONE S5. Study: https://x'],
  ['2026-11-14 PT · MINE S5 · OFF-58 · Sid, an AI agent. No S5 claim', '2026-11-14 PT', 'MINE S5 · OFF-58 · Sid, an AI agent. No S5 claim'],
  ['Shwa here, an AI agent. Work has moved.', 'Shwa here, an AI agent', 'Work has moved.'],
  ['Sat Nov 14, 2026, 9:14am ET · Chief, an AI agent · I am Chief', 'Sat Nov 14, 2026, 9:14am ET · Chief, an AI agent', 'I am Chief'],
  ["Loom desk (Mike's agent, an AI) · OFF-64 · show the answer", "Loom desk (Mike's agent, an AI)", 'OFF-64 · show the answer'],
  ['Nov 14 · Sid, AI agent\nThe real first line.', 'Nov 14 · Sid, AI agent', 'The real first line.'],
];
const KEEP = ['hey', 'green lights', 'OFF-60 · CODEX, FULL SPEED · posted by the Loom desk', 'Sweep, Sun Nov 15 10:20am ET. Read go', 'Nov 14'];

test('a leading date/identity stamp is split off; status words and titles stay', () => {
  for (const [body, stamp, text] of CASES) assert.deepEqual(splitStamp(body), { stamp, text }, body);
});

test('bodies without a stamp, or that are only a stamp, come back untouched', () => {
  for (const body of KEEP) assert.deepEqual(splitStamp(body), { stamp: '', text: body }, body);
});

test('the /loom page copy behaves exactly like the module', () => {
  const src = readFileSync(new URL('../src/pages/loom/index.astro', import.meta.url), 'utf8');
  const block = src.slice(src.indexOf('/* stamp:start'), src.indexOf('/* stamp:end */'));
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(block + '\nthis.f = splitStampPage;', ctx);
  for (const body of [...CASES.map((c) => c[0]), ...KEEP]) assert.deepEqual({ ...ctx.f(body) }, splitStamp(body), body);
});

test('For You pile items lead with the content and carry the stamp separately', () => {
  const NOW = new Date('2026-11-15T12:00:00Z');
  const r = buildPiles({ owner: 'mike', now: NOW, threads: [{ address: '#work', key: 'k', label: '#work', messages: [
    { id: 'm_1', seq: 1, at: '2026-11-15T11:00:00Z', from: { name: 'Sam', kind: 'human' }, body: 'Nov 15 · Sam here · the court lights are out', parent: null, kind: 'note' },
    { id: 'm_2', seq: 2, at: '2026-11-15T11:30:00Z', from: { name: 'Desk', kind: 'agent' }, body: 'NEEDS MIKE · sign the form · here', parent: null, kind: 'note' },
  ] }] });
  const yes = r.piles.needsYes[0];
  assert.equal(yes.snippet, 'NEEDS MIKE · sign the form · here');
  assert.equal(yes.stamp, undefined);
  const sam = r.piles.people[0];
  assert.equal(sam.snippet, 'Sam here · the court lights are out');
  assert.equal(sam.stamp, 'Nov 15');
});
