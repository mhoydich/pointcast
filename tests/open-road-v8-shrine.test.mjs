import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const shrineUrl = new URL('../src/pages/open-road-v8.astro', import.meta.url);
const appsUrl = new URL('../src/lib/pointcast-apps.ts', import.meta.url);
const launchStripUrl = new URL('../src/components/AppLaunchStrip.astro', import.meta.url);
const previousEditionUrl = new URL('../src/pages/open-road-v7.astro', import.meta.url);

test('Open Road VIII turns sixteen archive images into eight mile markers', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');
  const assetNames = [
    ...shrineSource.matchAll(
      /from\s+['"]\.\.\/assets\/shrines\/open-road-v7\/([^'"]+\.webp)['"]/g,
    ),
  ].map((match) => match[1]);

  assert.equal(assetNames.length, 16);
  assert.equal(new Set(assetNames).size, 16);
  assert.match(shrineSource, /const\s+miles\s*=\s*\[/);
  assert.match(shrineSource, /Eight mile markers/);
  assert.match(shrineSource, /data-mile-panel/);
  assert.match(shrineSource, /The Long Way Home/);

  await Promise.all(
    assetNames.map((name) =>
      access(new URL('../src/assets/shrines/open-road-v7/' + name, import.meta.url)),
    ),
  );
});

test('Open Road VIII supports self-paced walking, local progress, sound by request, and quiet motion', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  assert.match(shrineSource, /const\s+stepMs\s*=\s*9000/);
  assert.match(shrineSource, /requestAnimationFrame\(tick\)/);
  assert.match(shrineSource, /pointcast-open-road-v8-mile/);
  assert.match(shrineSource, /navigator|localStorage/);
  assert.match(shrineSource, /new AudioContext\(\)/);
  assert.match(shrineSource, /createOscillator\(\)/);
  assert.match(shrineSource, /createBufferSource\(\)/);
  assert.doesNotMatch(shrineSource, /\bautoplay\b/i);
  assert.match(shrineSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  for (const key of ['ArrowRight', 'ArrowLeft']) {
    assert.match(shrineSource, new RegExp(key));
  }
  assert.match(shrineSource, /event\.key\s*===\s*['"] ['"]/);
  assert.match(shrineSource, /pointerdown/);
  assert.match(shrineSource, /pointerup/);
  assert.match(shrineSource, /aria-live=['"]polite['"]/);
});

test('Open Road VIII metadata, edition navigation, and PointCast discovery agree', async () => {
  const [shrineSource, appsSource, launchStripSource, previousEditionSource] =
    await Promise.all([
      readFile(shrineUrl, 'utf8'),
      readFile(appsUrl, 'utf8'),
      readFile(launchStripUrl, 'utf8'),
      readFile(previousEditionUrl, 'utf8'),
    ]);

  assert.match(shrineSource, /Open Road VIII · The Long Way Home/);
  assert.match(shrineSource, /https:\/\/pointcast\.xyz\/open-road-v8/);
  assert.match(shrineSource, /open-road-v8-og\.(?:jpg|jpeg|png)/);
  assert.match(shrineSource, /['"]@type['"]:\s*['"]WebApplication['"]/);
  for (const path of [
    '/open-road',
    '/open-road-v2',
    '/open-road-v3',
    '/open-road-v4',
    '/open-road-v5',
    '/open-road-v6',
    '/open-road-v7',
  ]) {
    assert.match(shrineSource, new RegExp(`href=['"]${path}['"]`));
  }
  assert.match(shrineSource, /aria-current=['"]page['"][^>]*>\s*VIII\s*</);
  assert.match(previousEditionSource, /href=['"]\/open-road-v8['"]>VIII<\/a>/);

  assert.match(appsSource, /slug:\s*['"]open-road-v8['"]/);
  assert.match(appsSource, /name:\s*['"]Open Road VIII['"]/);
  assert.match(appsSource, /kicker:\s*['"]EIGHT MILES · CHANGING LIGHT · THE LONG WAY HOME['"]/);
  assert.match(appsSource, /path:\s*['"]\/open-road-v8['"]/);
  assert.match(launchStripSource, /name:\s*['"]OPEN ROAD VIII['"]/);
  assert.match(launchStripSource, /detail:\s*['"]THE LONG WAY HOME['"]/);
  assert.match(launchStripSource, /href:\s*['"]\/open-road-v8['"]/);
});
