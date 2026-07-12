import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const endpoint = await readFile(new URL('../src/pages/residents.json.ts', import.meta.url), 'utf8');
const page = await readFile(new URL('../src/pages/residents.astro', import.meta.url), 'utf8');

test('resident directory derives its roster and contract from the canonical registry', () => {
  assert.match(endpoint, /import \{ RESIDENTS, RESIDENTS_CONTRACT \} from '\.\.\/data\/residents'/);
  assert.match(endpoint, /RESIDENTS\.map/);
  assert.match(endpoint, /contract: RESIDENTS_CONTRACT/);
  assert.match(endpoint, /profile: `\$\{SITE_URL\}\/residents#resident-\$\{resident\.slug\}`/);
});

test('resident directory is portable and discoverable from the human page', () => {
  assert.match(endpoint, /'Access-Control-Allow-Origin': '\*'/);
  assert.match(endpoint, /rel="canonical"/);
  assert.match(endpoint, /agentManifest: `\$\{SITE_URL\}\/agents\.json`/);
  assert.match(page, /href="\/residents\.json"/);
});
