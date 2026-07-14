import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const shrineUrl = new URL('../src/pages/open-road-v4.astro', import.meta.url);
const appsUrl = new URL('../src/lib/pointcast-apps.ts', import.meta.url);
const launchStripUrl = new URL('../src/components/AppLaunchStrip.astro', import.meta.url);
const homeUrl = new URL('../src/pages/index.astro', import.meta.url);

test('Open Road IV contains five calls and five answers from ten unique older works', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');
  const assetNames = [
    ...shrineSource.matchAll(/from '\.\.\/assets\/shrines\/open-road-v4\/([^']+\.webp)'/g),
  ].map((match) => match[1]);

  assert.equal(assetNames.length, 10);
  assert.equal(new Set(assetNames).size, 10);
  assert.equal((shrineSource.match(/call: \{/g) ?? []).length, 5);
  assert.equal((shrineSource.match(/answer: \{/g) ?? []).length, 5);

  await Promise.all(
    assetNames.map((name) =>
      access(new URL('../src/assets/shrines/open-road-v4/' + name, import.meta.url)),
    ),
  );
});

test('Open Road IV makes bells optional, gentle, and local to a user gesture', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  assert.match(shrineSource, /id="or4-bells"/);
  assert.match(shrineSource, /aria-pressed="false"/);
  assert.match(shrineSource, /AudioContext/);
  assert.match(shrineSource, /createDynamicsCompressor/);
  assert.match(shrineSource, /2\.76/);
  assert.match(shrineSource, /5\.17/);
  assert.match(shrineSource, /\.createOscillator\(\)/);
  assert.match(shrineSource, /bellsButton\.addEventListener\('click'/);
  assert.match(shrineSource, /!ready \|\| !audioContext \|\| !bellsOn \|\| document\.hidden/);
  assert.doesNotMatch(shrineSource, /fetch\(/);
  assert.doesNotMatch(shrineSource, /broadcast/i);
});

test('Open Road IV keeps its constellation, drift, and paired reveals calm and accessible', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  assert.match(shrineSource, /const DRIFT_INTERVAL = 14_000/);
  assert.match(shrineSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(shrineSource, /document\.addEventListener\('visibilitychange'/);
  assert.match(shrineSource, /\.suspend\(\)/);
  assert.match(shrineSource, /\.resume\(\)/);
  assert.match(shrineSource, /event\.key === 'Escape'/);
  assert.match(shrineSource, /event\.key === 'ArrowRight'/);
  assert.match(shrineSource, /aria-live="polite"/);
  assert.match(shrineSource, /data-side="call"/);
  assert.match(shrineSource, /data-side="answer"/);
  assert.match(shrineSource, /class="or4__bell-halo" aria-hidden="true"/);
  assert.match(shrineSource, /object-fit: contain/);
  assert.match(shrineSource, /if \(focusedIndex < 0\) return/);
  assert.match(shrineSource, /pairView\.contains\(event\.target\)/);
  assert.match(shrineSource, /Five images call\. Five answer\. Listen for the space between\./);
  assert.match(shrineSource, /The bell is gone\. The listening remains\./);
  assert.match(shrineSource, /href="\/open-road"/);
  assert.match(shrineSource, /href="\/open-road-v2"/);
  assert.match(shrineSource, /href="\/open-road-v3"/);
});

test('all four Open Road editions are discoverable', async () => {
  const [appsSource, launchStripSource, homeSource] = await Promise.all([
    readFile(appsUrl, 'utf8'),
    readFile(launchStripUrl, 'utf8'),
    readFile(homeUrl, 'utf8'),
  ]);

  for (const slug of ['open-road-shrine', 'open-road-v2', 'open-road-v3', 'open-road-v4']) {
    assert.match(appsSource, new RegExp("slug: '" + slug + "'"));
  }
  for (const path of ['/open-road', '/open-road-v2', '/open-road-v3', '/open-road-v4']) {
    assert.match(launchStripSource, new RegExp("href: '" + path + "'"));
  }
  assert.match(appsSource, /path: '\/open-road-v4'/);
  assert.match(homeSource, /discoveryAppItems\.slice\(0, 11\)/);
});
