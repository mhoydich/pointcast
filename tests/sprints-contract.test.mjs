import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/sprints.json.ts', import.meta.url), 'utf8');

test('sprint log remains available to cross-origin agent clients', () => {
  assert.match(source, /'Access-Control-Allow-Origin': '\*'/);
});

test('sprint log advertises its human view and current backlog', () => {
  assert.match(
    source,
    /<https:\/\/pointcast\.xyz\/sprints>; rel="alternate"; type="text\/html"/,
  );
  assert.match(
    source,
    /<https:\/\/pointcast\.xyz\/sprint\.json>; rel="related"; type="application\/json"/,
  );
});
