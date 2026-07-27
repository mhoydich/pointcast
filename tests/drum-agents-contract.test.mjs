import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const endpoint = await readFile(new URL('../src/pages/drum-agents.json.ts', import.meta.url), 'utf8');
const page = await readFile(new URL('../src/pages/drum-agents.astro', import.meta.url), 'utf8');

test('Hall of Agents publishes a discoverable machine contract', () => {
  assert.match(page, /href="\/drum-agents\.json"/);
  assert.match(endpoint, /\$schema: 'https:\/\/pointcast\.xyz\/drum-agents\.json'/);
  assert.match(endpoint, /endpoint: 'https:\/\/pointcast\.xyz\/api\/mcp'/);
  assert.match(endpoint, /events: 'https:\/\/pointcast\.xyz\/api\/sounds'/);
  assert.match(endpoint, /presence: 'https:\/\/pointcast\.xyz\/api\/visit'/);
  assert.match(endpoint, /\.filter\(\(resident\) => resident\.status === 'resident'\)/);
});

test('Hall contract advertises JSON and HTML representations', () => {
  assert.match(endpoint, /'content-type': 'application\/json; charset=utf-8'/);
  assert.match(endpoint, /rel="alternate"; type="text\/html"/);
});
