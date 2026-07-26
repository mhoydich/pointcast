import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/resident.astro', import.meta.url), 'utf8');

test('resident console only polls the oracle from a loopback host', () => {
  assert.match(source, /LOCAL_HOSTS = new Set\(\['localhost', '127\.0\.0\.1', '::1'\]\)/);
  assert.match(source, /if \(isLocalConsole\) \{/);
  assert.match(source, /setInterval\(\(\) => loadStatus\(\)/);
});

test('deployed resident console explains its local-only contract', () => {
  assert.match(source, /set\('\[data-current\]', 'local-only'\)/);
  assert.match(source, /href: '\/resident\.json'/);
  assert.match(source, /Read the resident contract/);
});
