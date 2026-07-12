import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/drum-room.astro', import.meta.url), 'utf8');

test('the shared chamber ring control is keyboard discoverable', () => {
  assert.match(source, /id="dr-field" role="button" tabindex="0" aria-label="Ring the shared chamber"/);
  assert.match(source, /\.dr__field:focus-visible/);
});

test('Enter and Space trigger the same ring action as a click', () => {
  assert.match(source, /fieldEl\?\.addEventListener\('click', ringRoom\)/);
  assert.match(source, /event\.key !== 'Enter' && event\.key !== ' '/);
  assert.match(source, /event\.preventDefault\(\);\s+ringRoom\(\);/);
});
