import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('homepage carries the Sound Garden banner with a silent-until-pressed daily sprout', async () => {
  const [home, banner] = await Promise.all([read('src/pages/index.astro'), read('src/components/HomeSoundGarden.astro')]);
  assert.match(home, /<HomeSoundGarden \/>/);
  assert.match(banner, /getPointcastApp\('sound-garden'\)/);
  assert.match(banner, /href="\/sound-garden"/);
  assert.match(banner, /Today’s sprout/);
  assert.match(banner, /America\/Los_Angeles/);
  assert.match(banner, /Audio starts only when you press Plant/);
  assert.doesNotMatch(banner, /getUserMedia/);
  // Server and client must derive the same sprout from the same day string.
  const hashes = banner.match(/h = Math\.imul\(h, 16777619\) >>> 0/g) ?? [];
  assert.equal(hashes.length, 2);
});
