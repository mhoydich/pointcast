import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const shrineSource = await readFile(new URL('../src/pages/open-road.astro', import.meta.url), 'utf8');
const appsSource = await readFile(new URL('../src/lib/pointcast-apps.ts', import.meta.url), 'utf8');
const launchStripSource = await readFile(new URL('../src/components/AppLaunchStrip.astro', import.meta.url), 'utf8');

test('Open Road keeps a visible native cursor with a fine-pointer dove companion', () => {
  assert.match(shrineSource, /html\.cr-cursor-active body:has\(#open-road-shrine\)/);
  assert.match(shrineSource, /id="ors-dove-cursor" aria-hidden="true">🕊︎<\/span>/);
  assert.match(shrineSource, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(shrineSource, /window\.matchMedia\('\(hover: hover\) and \(pointer: fine\)'\)/);
});

test('Open Road marks five quiet miles across the one-minute breath practice', () => {
  assert.equal((shrineSource.match(/class="ors__mile"/g) ?? []).length, 5);
  assert.match(shrineSource, /const SIT_DURATION = 60_000/);
  assert.match(shrineSource, /const RECEIVE_DURATION = 5_000/);
  assert.match(shrineSource, /const RELEASE_DURATION = 7_000/);
  assert.match(shrineSource, /setMiles\(SIT_DURATION\)/);
});

test('Open Road keeps the votive local to the tab and closes with a timed benediction', () => {
  assert.match(shrineSource, /sessionStorage\.setItem\(LIGHT_STORAGE_KEY, '1'\)/);
  assert.match(shrineSource, /Let evening receive you\./);
  assert.match(shrineSource, /May every road lead home\./);
  assert.match(appsSource, /slug: 'open-road-shrine'/);
  assert.match(launchStripSource, /href: '\/open-road'/);
});
