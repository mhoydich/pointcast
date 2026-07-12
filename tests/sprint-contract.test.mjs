import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/sprint.json.ts', import.meta.url), 'utf8');

test('sprint contract is readable across origins', () => {
  assert.match(source, /'Access-Control-Allow-Origin': '\*'/);
});

test('sprint contract advertises its human view and shipped log', () => {
  assert.match(source, /pointcast\.xyz\/sprint>; rel="alternate"; type="text\/html"/);
  assert.match(source, /pointcast\.xyz\/sprints\.json>; rel="related"; type="application\/json"/);
});
