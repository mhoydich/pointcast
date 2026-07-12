import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const NEXT_SPRINT_ENDPOINT = new URL('../src/pages/next-sprint.json.ts', import.meta.url);

test('next sprint JSON remains available to cross-origin agents', async () => {
  const source = await readFile(NEXT_SPRINT_ENDPOINT, 'utf8');

  assert.match(source, /'Access-Control-Allow-Origin': '\*'/);
  assert.match(source, /'Content-Type': 'application\/json; charset=utf-8'/);
});

test('next sprint JSON advertises its human board and adjacent sprint contracts', async () => {
  const source = await readFile(NEXT_SPRINT_ENDPOINT, 'utf8');

  assert.match(source, /<https:\/\/pointcast\.xyz\/next-sprint>; rel="canonical"; type="text\/html"/);
  assert.match(source, /<https:\/\/pointcast\.xyz\/sprint\.json>; rel="related"; type="application\/json"; title="Live sprint backlog"/);
  assert.match(source, /<https:\/\/pointcast\.xyz\/sprints\.json>; rel="related"; type="application\/json"; title="Shipped sprint log"/);
});
