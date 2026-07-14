import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const shrineUrl = new URL('../src/pages/open-road-v2.astro', import.meta.url);
const shrineSource = await readFile(shrineUrl, 'utf8');
const appsSource = await readFile(new URL('../src/lib/pointcast-apps.ts', import.meta.url), 'utf8');
const launchStripSource = await readFile(new URL('../src/components/AppLaunchStrip.astro', import.meta.url), 'utf8');

test('Open Road II contains exactly two five-image passages from ten unique assets', async () => {
  const assetMatches = [
    ...shrineSource.matchAll(
      /from '\.\.\/assets\/shrines\/open-road-v2\/([^']+\.webp)'/g,
    ),
  ];
  const assetNames = assetMatches.map((match) => match[1]);

  assert.equal(assetNames.length, 10);
  assert.equal(new Set(assetNames).size, 10);
  assert.equal((shrineSource.match(/stations: \[/g) ?? []).length, 2);

  const firstLightSource = shrineSource.slice(
    shrineSource.indexOf("id: 'first-light'"),
    shrineSource.indexOf("id: 'vespers'"),
  );
  const vespersSource = shrineSource.slice(
    shrineSource.indexOf("id: 'vespers'"),
    shrineSource.indexOf('const jsonLd'),
  );

  assert.equal((firstLightSource.match(/image: /g) ?? []).length, 5);
  assert.equal((vespersSource.match(/image: /g) ?? []).length, 5);

  await Promise.all(
    assetNames.map((name) =>
      access(new URL('../src/assets/shrines/open-road-v2/' + name, import.meta.url)),
    ),
  );
});

test('Open Road II advances one station for each five-seven breath', () => {
  assert.equal((shrineSource.match(/class="or2__mile"/g) ?? []).length, 5);
  assert.match(shrineSource, /const SIT_DURATION = 60_000/);
  assert.match(shrineSource, /const RECEIVE_DURATION = 5_000/);
  assert.match(shrineSource, /const RELEASE_DURATION = 7_000/);
  assert.match(shrineSource, /const BREATH_DURATION = RECEIVE_DURATION \+ RELEASE_DURATION/);
  assert.match(shrineSource, /Math\.floor\(elapsed \/ BREATH_DURATION\)/);
  assert.match(shrineSource, /Each complete breath reveals the next image/);
});

test('Open Road II keeps the shrine accessible, local, and calm', () => {
  assert.match(shrineSource, /id="or2-dove-cursor" aria-hidden="true">🕊︎<\/span>/);
  assert.match(shrineSource, /html\.cr-cursor-active body:has\(#open-road-v2-shrine\)/);
  assert.match(shrineSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(shrineSource, /event\.key === 'Escape'/);
  assert.match(shrineSource, /event\.key === 'ArrowRight'/);
  assert.match(shrineSource, /document\.addEventListener\('visibilitychange'/);
  assert.match(shrineSource, /sessionStorage\.setItem\(LIGHT_STORAGE_KEY, '1'\)/);
  assert.match(shrineSource, /const LIGHT_STORAGE_KEY = 'pc:open-road-v2:light'/);
  assert.match(shrineSource, /href="\/open-road"/);
});

test('both Open Road editions remain discoverable', () => {
  assert.match(appsSource, /slug: 'open-road-shrine'/);
  assert.match(appsSource, /slug: 'open-road-v2'/);
  assert.match(appsSource, /path: '\/open-road-v2'/);
  assert.match(launchStripSource, /href: '\/open-road'/);
  assert.match(launchStripSource, /href: '\/open-road-v2'/);
});
