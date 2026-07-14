import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const shrineUrl = new URL('../src/pages/open-road-v5.astro', import.meta.url);
const appsUrl = new URL('../src/lib/pointcast-apps.ts', import.meta.url);
const launchStripUrl = new URL('../src/components/AppLaunchStrip.astro', import.meta.url);
const homeUrl = new URL('../src/pages/index.astro', import.meta.url);

test('Open Road V offers ten unique image fragments for a five-petal window', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');
  const assetNames = [
    ...shrineSource.matchAll(
      /from\s+['"]\.\.\/assets\/shrines\/open-road-v5\/([^'"]+\.webp)['"]/g,
    ),
  ].map((match) => match[1]);

  assert.equal(assetNames.length, 10);
  assert.equal(new Set(assetNames).size, 10);
  assert.match(shrineSource, /const\s+fragments\s*=\s*\[/);
  assert.match(shrineSource, /fragments\.map\(/);
  assert.match(shrineSource, /<button\b[^>]*\bdata-fragment(?:\s|=|>)/);
  assert.match(shrineSource, /const\s+PETAL_COUNT\s*=\s*5/);
  assert.match(shrineSource, /\bdata-petal(?:\s|=|>)/);

  await Promise.all(
    assetNames.map((name) =>
      access(new URL('../src/assets/shrines/open-road-v5/' + name, import.meta.url)),
    ),
  );
});

test('Open Road V composition prevents duplicates and supports undo, reset, completion, and hash sharing', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  assert.match(
    shrineSource,
    /(?:selected|chosen|composition)\w*\.(?:has|includes|some)\(/i,
  );
  assert.match(shrineSource, /id=['"]or5-undo['"]/);
  assert.match(shrineSource, /id=['"]or5-reset['"]/);
  assert.match(shrineSource, /id=['"]or5-share['"]/);
  assert.match(shrineSource, /(?:\.pop\(\)|\.slice\(\s*0\s*,\s*-1\s*\))/);
  assert.match(
    shrineSource,
    /(?:selected|chosen|composition)\w*\s*=\s*\[\]|(?:selected|chosen|composition)\w*\.clear\(\)/i,
  );
  assert.match(shrineSource, /(?:\.length|\.size)\s*===?\s*(?:PETAL_COUNT|5)/);
  assert.match(shrineSource, /(?:window\.)?location\.hash|\burl\.hash\s*=/i);
  assert.match(shrineSource, /(?:hashchange|decodeURIComponent|URLSearchParams)/);
  assert.match(shrineSource, /rawHash\s*&&\s*!rawHash\.startsWith\(['"]window=['"]\)\)\s*return/);
  assert.doesNotMatch(shrineSource, /decodeURIComponent\(id\)/);
});

test('Open Road V keeps sound off until a user asks for it', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  assert.match(shrineSource, /id=['"]or5-sound['"]/);
  assert.match(shrineSource, /aria-pressed=['"]false['"]/);
  assert.match(shrineSource, /(?:window\.)?(?:AudioContext|webkitAudioContext)/);
  assert.match(shrineSource, /createGain\(\)/);
  assert.match(shrineSource, /createOscillator\(\)/);
  assert.match(
    shrineSource,
    /soundButton(?:\?\.|\.)addEventListener\(\s*['"]click['"][\s\S]{0,1800}ensureAudio\(/,
  );
  assert.doesNotMatch(shrineSource, /\bautoplay\b/i);
});

test('Open Road V remains calm, inspectable, and operable without motion or a pointer', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  assert.match(shrineSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(shrineSource, /document\.addEventListener\(\s*['"]visibilitychange['"]/);
  assert.match(shrineSource, /document\.hidden/);
  assert.match(shrineSource, /event\.key\s*===\s*['"]Escape['"]/);
  assert.match(shrineSource, /event\.key\s*===\s*['"]ArrowLeft['"]/);
  assert.match(shrineSource, /event\.key\s*===\s*['"]ArrowRight['"]/);
  assert.match(shrineSource, /aria-live=['"]polite['"]/);
  assert.match(shrineSource, /object-fit:\s*contain/);
  assert.match(shrineSource, /@media\s*\(min-width:\s*1051px\)\s*and\s*\(max-height:\s*1050px\)/);
});

test('Open Road V metadata, edition navigation, and PointCast discovery agree', async () => {
  const [shrineSource, appsSource, launchStripSource, homeSource] = await Promise.all([
    readFile(shrineUrl, 'utf8'),
    readFile(appsUrl, 'utf8'),
    readFile(launchStripUrl, 'utf8'),
    readFile(homeUrl, 'utf8'),
  ]);

  assert.match(shrineSource, /Open Road V · The Window You Make/);
  assert.match(shrineSource, /https:\/\/pointcast\.xyz\/open-road-v5/);
  assert.match(shrineSource, /open-road-v5-og\.(?:jpg|jpeg|png)/);
  for (const path of ['/open-road', '/open-road-v2', '/open-road-v3', '/open-road-v4']) {
    assert.match(shrineSource, new RegExp(`href=['"]${path}['"]`));
  }
  assert.match(shrineSource, /aria-current=['"]page['"][^>]*>\s*V\s*</);

  assert.match(appsSource, /slug:\s*['"]open-road-v5['"]/);
  assert.match(appsSource, /name:\s*['"]Open Road V['"]/);
  assert.match(appsSource, /path:\s*['"]\/open-road-v5['"]/);
  assert.match(launchStripSource, /href:\s*['"]\/open-road-v5['"]/);
  assert.match(homeSource, /discoveryAppItems\.slice\(0, 11\)/);
});
