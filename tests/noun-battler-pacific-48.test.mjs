import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../src/pages/noun-battler.astro', import.meta.url), 'utf8');
const apps = await readFile(new URL('../src/lib/pointcast-apps.ts', import.meta.url), 'utf8');
const launchStrip = await readFile(new URL('../src/components/AppLaunchStrip.astro', import.meta.url), 'utf8');

test('Pacific 48 launch page preserves the local receipt and wallet boundaries', () => {
  assert.match(page, /48 battlers/i);
  assert.match(page, /local stamp book/i);
  assert.match(page, /portable Passport card/i);
  assert.match(page, /No wallet required/);
  assert.match(page, /not minted tokens/);
  assert.match(page, /noun-battler\.mhoydich\.chatgpt\.site/);
});

test('Noun Battler is discoverable from the PointCast app surfaces', () => {
  assert.match(apps, /slug: 'noun-battler-pacific-48'/);
  assert.match(apps, /path: '\/noun-battler'/);
  assert.match(launchStrip, /PACIFIC 48 \+ PASSPORT/);
});
