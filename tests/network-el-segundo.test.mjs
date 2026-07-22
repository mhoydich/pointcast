import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = new URL('../src/pages/network-el-segundo.astro', import.meta.url);

test('PointCast publishes the Network El Segundo release with a direct fallback', async () => {
  const source = await readFile(page, 'utf8');

  assert.match(source, /https:\/\/network-el-segundo\.mhoydich\.chatgpt\.site/);
  assert.match(source, /Buy art → enter roster → reserve 50% for participants/);
  assert.match(source, /Open the release/);
  assert.match(source, /https:\/\/pointcast\.xyz\/network-el-segundo/);
});
