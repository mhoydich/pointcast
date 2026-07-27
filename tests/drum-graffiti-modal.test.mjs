import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(
  new URL('../src/pages/drum-graffiti.astro', import.meta.url),
  'utf8',
);

test('graffiti modal honors its hidden state after spraying or cancelling', () => {
  assert.match(page, /id="gf-modal" hidden/);
  assert.match(page, /\.gf__modal\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
  assert.match(page, /function closeModal\(\)\s*\{\s*modal\.hidden = true;/);
});
