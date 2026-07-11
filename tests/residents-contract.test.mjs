import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const endpoint = fs.readFileSync(path.join(root, 'src/pages/residents.json.ts'), 'utf8');
const page = fs.readFileSync(path.join(root, 'src/pages/residents.astro'), 'utf8');

test('residents contract uses the canonical roster and participation contract', () => {
  assert.match(endpoint, /import \{ RESIDENTS, RESIDENTS_CONTRACT \} from '\.\.\/data\/residents'/);
  assert.match(endpoint, /agents: RESIDENTS/);
  assert.match(endpoint, /contract: RESIDENTS_CONTRACT/);
  assert.match(endpoint, /counts,/);
});

test('residents contract is cross-origin readable and linked from the human page', () => {
  assert.match(endpoint, /'access-control-allow-origin': '\*'/);
  assert.match(page, /href="\/residents\.json"/);
});
