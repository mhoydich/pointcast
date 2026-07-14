import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const shrineUrl = new URL('../src/pages/open-road-v3.astro', import.meta.url);
const shrineSource = await readFile(shrineUrl, 'utf8');
const appsSource = await readFile(new URL('../src/lib/pointcast-apps.ts', import.meta.url), 'utf8');
const launchStripSource = await readFile(new URL('../src/components/AppLaunchStrip.astro', import.meta.url), 'utf8');
const homeSource = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

test('Open Road III contains exactly two five-image passages from ten unique assets', async () => {
  const assetMatches = [
    ...shrineSource.matchAll(
      /from '\.\.\/assets\/shrines\/open-road-v3\/([^']+\.webp)'/g,
    ),
  ];
  const assetNames = assetMatches.map((match) => match[1]);

  assert.equal(assetNames.length, 10);
  assert.equal(new Set(assetNames).size, 10);
  assert.equal((shrineSource.match(/stations: \[/g) ?? []).length, 2);

  const waysideSource = shrineSource.slice(
    shrineSource.indexOf("id: 'wayside'"),
    shrineSource.indexOf("id: 'chorus'"),
  );
  const chorusSource = shrineSource.slice(
    shrineSource.indexOf("id: 'chorus'"),
    shrineSource.indexOf('const jsonLd'),
  );

  assert.equal((waysideSource.match(/image: /g) ?? []).length, 5);
  assert.equal((chorusSource.match(/image: /g) ?? []).length, 5);

  await Promise.all(
    assetNames.map((name) =>
      access(new URL('../src/assets/shrines/open-road-v3/' + name, import.meta.url)),
    ),
  );
});

test('Open Road III advances one station for every five-seven breath', () => {
  assert.equal((shrineSource.match(/class="or3__measure"/g) ?? []).length, 5);
  assert.match(shrineSource, /const SIT_DURATION = 60_000/);
  assert.match(shrineSource, /const RECEIVE_DURATION = 5_000/);
  assert.match(shrineSource, /const RELEASE_DURATION = 7_000/);
  assert.match(shrineSource, /const BREATH_DURATION = RECEIVE_DURATION \+ RELEASE_DURATION/);
  assert.match(shrineSource, /Math\.floor\(elapsed \/ BREATH_DURATION\)/);
  assert.match(shrineSource, /Each complete breath reveals the next image/);
});

test('Open Road III keeps the wider-world shrine accessible, local, and calm', () => {
  assert.match(shrineSource, /id="or3-dove" aria-hidden="true">🕊︎<\/span>/);
  assert.match(shrineSource, /html\.cr-cursor-active body:has\(#open-road-v3-shrine\)/);
  assert.match(shrineSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(shrineSource, /event\.key === 'Escape'/);
  assert.match(shrineSource, /event\.key === 'ArrowRight'/);
  assert.match(shrineSource, /document\.addEventListener\('visibilitychange'/);
  assert.match(shrineSource, /sessionStorage\.setItem\(SILENCE_STORAGE_KEY, '1'\)/);
  assert.match(shrineSource, /const SILENCE_STORAGE_KEY = 'pc:open-road-v3:silence'/);
  assert.match(shrineSource, /aria-hidden=\{passageIndex === 0 && stationIndex === 0/);
  assert.match(shrineSource, /The road was never only the car\./);
  assert.match(shrineSource, /looking beyond the car/);
  assert.match(shrineSource, /href="\/open-road"/);
  assert.match(shrineSource, /href="\/open-road-v2"/);
});

test('all three Open Road editions remain discoverable', () => {
  assert.match(appsSource, /slug: 'open-road-shrine'/);
  assert.match(appsSource, /slug: 'open-road-v2'/);
  assert.match(appsSource, /slug: 'open-road-v3'/);
  assert.match(appsSource, /path: '\/open-road-v3'/);
  assert.match(launchStripSource, /href: '\/open-road'/);
  assert.match(launchStripSource, /href: '\/open-road-v2'/);
  assert.match(launchStripSource, /href: '\/open-road-v3'/);
  assert.match(homeSource, /discoveryAppItems\.slice\(0, 9\)/);
});
