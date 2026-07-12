import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/resident.json.ts', import.meta.url), 'utf8');

test('resident JSON publishes the local loop contract', () => {
  assert.match(source, /npm run oracle/);
  assert.match(source, /npm run resident:overnight/);
  assert.match(source, /npm run resident:once/);
  assert.match(source, /127\.0\.0\.1:8789\/api\/resident\/status/);
  assert.match(source, /deployedStatusAvailable: false/);
});

test('resident JSON documents artifacts, status fields, and approval gates', () => {
  assert.match(source, /\.pointcast\/resident\/status\.json/);
  assert.match(source, /docs\/briefs\/YYYY-MM-DD-resident-<task>\.md/);
  assert.match(source, /currentTask/);
  assert.match(source, /computeHours/);
  assert.match(source, /approval gates/);
});

test('resident JSON is portable and points to the human console', () => {
  assert.match(source, /application\/json; charset=utf-8/);
  assert.match(source, /access-control-allow-origin': '\*'/);
  assert.match(source, /pointcast\.xyz\/resident/);
  assert.match(source, /rel="canonical"; type="text\/html"/);
});
