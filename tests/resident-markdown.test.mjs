import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/resident.md.ts', import.meta.url), 'utf8');

test('resident Markdown documents the local overnight loop', () => {
  assert.match(source, /npm run oracle/);
  assert.match(source, /npm run resident:overnight/);
  assert.match(source, /npm run resident:once/);
  assert.match(source, /127\.0\.0\.1:8789\/api\/resident\/status/);
  assert.match(source, /\.pointcast\/resident\/status\.json/);
  assert.match(source, /approval gates/);
});

test('resident Markdown is portable and advertises the human console', () => {
  assert.match(source, /text\/markdown; charset=utf-8/);
  assert.match(source, /access-control-allow-origin': '\*'/);
  assert.match(source, /pointcast\.xyz\/resident/);
  assert.match(source, /rel="canonical"; type="text\/html"/);
});
