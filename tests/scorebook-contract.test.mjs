import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sourceUrl = new URL('../src/pages/scorebook.json.ts', import.meta.url);

test('scorebook JSON remains cross-origin readable', async () => {
  const source = await readFile(sourceUrl, 'utf8');

  assert.match(source, /'Access-Control-Allow-Origin': '\*'/);
});

test('scorebook JSON advertises its human ledger and agent altar', async () => {
  const source = await readFile(sourceUrl, 'utf8');

  assert.match(
    source,
    /<https:\/\/pointcast\.xyz\/drum-scorebook>; rel="canonical"; type="text\/html"/,
  );
  assert.match(
    source,
    /<https:\/\/pointcast\.xyz\/drum-agent-altar>; rel="related"; type="text\/html"/,
  );
});
