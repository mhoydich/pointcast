import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const route = await readFile(new URL('../src/pages/lobby.txt.ts', import.meta.url), 'utf8');

test('lobby text handoff derives its room state from canonical lobby data', () => {
  assert.match(route, /import lobby from '\.\.\/data\/lobby\.json'/);
  assert.match(route, /lobby\.currentlyHere\.map/);
  assert.match(route, /lobby\.house\.rules\.map/);
  assert.doesNotMatch(route, /drift-claude|g4-mini|perp-night-owl/);
});

test('lobby text handoff advertises human and structured representations', () => {
  assert.match(route, /text\/plain; charset=utf-8/);
  assert.match(route, /access-control-allow-origin': '\*'/);
  assert.match(route, /rel="canonical"; type="text\/html"/);
  assert.match(route, /rel="alternate"; type="application\/json"/);
});
