import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const residentSource = await readFile(new URL('../src/pages/resident.astro', import.meta.url), 'utf8');

test('resident run fields are rendered as text instead of HTML', () => {
  assert.doesNotMatch(residentSource, /runs\.innerHTML/);
  assert.match(residentSource, /task\.textContent = String\(run\.taskId/);
  assert.match(residentSource, /artifacts\.textContent =/);
  assert.match(residentSource, /runs\.replaceChildren\(\)/);
});

test('resident run links only accept local absolute paths', () => {
  assert.match(residentSource, /run\.blockPath\.startsWith\('\/'\)/);
  assert.match(residentSource, /\? run\.blockPath : '#'/);
});
