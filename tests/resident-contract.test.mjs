import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/resident.json.ts', import.meta.url), 'utf8');

test('resident contract keeps status loopback-only', () => {
  assert.match(source, /scope: 'local-machine-only'/);
  assert.match(source, /http:\/\/127\.0\.0\.1:8789\/api\/resident\/status/);
  assert.match(source, /Do not proxy or expose the loopback status endpoint/);
});

test('resident contract documents start commands and offline behavior', () => {
  assert.match(source, /oracle: 'npm run oracle'/);
  assert.match(source, /residentOnce: 'npm run resident -- --once'/);
  assert.match(source, /retry on the normal polling interval/);
});

test('resident contract is agent-readable across origins', () => {
  assert.match(source, /'Access-Control-Allow-Origin': '\*'/);
  assert.match(source, /rel="alternate"; type="text\/html"/);
});
