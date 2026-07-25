import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const shrineUrl = new URL('../src/pages/open-road-v6.astro', import.meta.url);
const appsUrl = new URL('../src/lib/pointcast-apps.ts', import.meta.url);
const launchStripUrl = new URL('../src/components/AppLaunchStrip.astro', import.meta.url);
const previousEditionUrl = new URL('../src/pages/open-road-v5.astro', import.meta.url);
const layoutUrl = new URL('../src/layouts/BlockLayout.astro', import.meta.url);

test('Open Road VI holds ten unique archive images for one sixty-second vigil', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');
  const assetNames = [
    ...shrineSource.matchAll(
      /from\s+['"]\.\.\/assets\/shrines\/open-road-v6\/([^'"]+\.webp)['"]/g,
    ),
  ].map((match) => match[1]);

  assert.equal(assetNames.length, 10);
  assert.equal(new Set(assetNames).size, 10);
  assert.match(shrineSource, /const\s+(?:moments|slides|images|stations)\s*=\s*\[/i);
  assert.match(shrineSource, /(?:moments|slides|images|stations)\.map\(/i);
  assert.match(
    shrineSource,
    /\b(?:VIGIL|TOTAL|SEQUENCE)[A-Z0-9_]*\s*=\s*(?:60(?:\s*;|\s*\n)|60_?000|60\s*\*\s*1000)/,
  );
  assert.match(
    shrineSource,
    /(?:\b(?:SLIDE|IMAGE|STEP)[A-Z0-9_]*\s*=\s*(?:6_?000|6\s*\*\s*1000)|\b(?:SLIDE|IMAGE|STEP)[A-Z0-9_]*\s*=\s*(?:VIGIL|TOTAL|SEQUENCE)[A-Z0-9_]*\s*\/\s*(?:moments|slides|images|stations)\.length)/i,
  );
  assert.match(shrineSource, /(?:requestAnimationFrame|setInterval|setTimeout)\(/);
  assert.match(shrineSource, /Begin the minute/);

  await Promise.all(
    assetNames.map((name) =>
      access(new URL('../src/assets/shrines/open-road-v6/' + name, import.meta.url)),
    ),
  );
});

test('Open Road VI gives the visitor quiet control of the vigil and its ending', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  for (const label of [
    'Hold this image',
    'Let it pass',
    'Previous',
    'Next',
    'Leave the vigil',
    'Sit a little longer',
    'Begin again',
    'Share this tribute',
  ]) {
    assert.match(shrineSource, new RegExp(label));
  }

  assert.match(shrineSource, /(?:paused|holding|held)/i);
  assert.match(shrineSource, /(?:restart|beginAgain|resetVigil)/i);
  assert.match(shrineSource, /(?:still|linger)/i);
  assert.match(shrineSource, /(?:navigator\.share|clipboard\.writeText)/);
  assert.match(shrineSource, /For Pete\. Held in love\. Carried in light\./);
});

test('Open Road VI keeps bells silent until a visitor asks for them', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  assert.match(shrineSource, /Bells off/);
  assert.match(shrineSource, /aria-pressed=['"]false['"]/);
  assert.match(shrineSource, /(?:window\.)?(?:AudioContext|webkitAudioContext)/);
  assert.match(shrineSource, /createGain\(\)/);
  assert.match(shrineSource, /createOscillator\(\)/);
  assert.match(
    shrineSource,
    /(?:sound|bell)\w*(?:\?\.|\.)addEventListener\(\s*['"]click['"][\s\S]{0,2400}(?:ensureAudio|AudioContext|resume\(\))/i,
  );
  assert.doesNotMatch(shrineSource, /\bautoplay\b/i);
});

test('Open Road VI remains calm and operable without motion, sound, or a pointer', async () => {
  const [shrineSource, layoutSource] = await Promise.all([
    readFile(shrineUrl, 'utf8'),
    readFile(layoutUrl, 'utf8'),
  ]);

  assert.match(shrineSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(shrineSource, /document\.addEventListener\(\s*['"]visibilitychange['"]/);
  assert.match(shrineSource, /document\.hidden/);
  assert.match(shrineSource, /event\.(?:key|code)\s*===?\s*['"](?: |Space|Spacebar)['"]/);
  assert.match(shrineSource, /event\.(?:key|code)\s*===?\s*['"]Escape['"]/);
  assert.match(shrineSource, /event\.(?:key|code)\s*===?\s*['"]ArrowLeft['"]/);
  assert.match(shrineSource, /event\.(?:key|code)\s*===?\s*['"]ArrowRight['"]/);
  assert.match(shrineSource, /aria-live=['"]polite['"]/);
  assert.match(shrineSource, /object-fit:\s*contain/);
  assert.match(shrineSource, /<BlockLayout[\s\S]{0,320}\bimmersive\b/);
  assert.match(layoutSource, /!immersive[\s\S]{0,320}<CursorRoom\s*\/>/);
  assert.match(shrineSource, /beginVigil\(\)[\s\S]{0,900}holdButton\?\.focus/);
  assert.match(shrineSource, /elapsed\s*=\s*target\s*\*\s*STEP_MS/);
  assert.doesNotMatch(shrineSource, /<main\s+class=['"]or6__body['"]/);
});

test('Open Road VI metadata, edition navigation, and PointCast discovery agree', async () => {
  const [shrineSource, appsSource, launchStripSource, previousEditionSource] =
    await Promise.all([
      readFile(shrineUrl, 'utf8'),
      readFile(appsUrl, 'utf8'),
      readFile(launchStripUrl, 'utf8'),
      readFile(previousEditionUrl, 'utf8'),
    ]);

  assert.match(shrineSource, /Open Road VI · A Light for Pete/);
  assert.match(shrineSource, /https:\/\/pointcast\.xyz\/open-road-v6/);
  assert.match(shrineSource, /open-road-v6-og\.(?:jpg|jpeg|png)/);
  assert.match(shrineSource, /['"]@type['"]:\s*['"]WebApplication['"]/);
  for (const path of [
    '/open-road',
    '/open-road-v2',
    '/open-road-v3',
    '/open-road-v4',
    '/open-road-v5',
  ]) {
    assert.match(shrineSource, new RegExp(`href=['"]${path}['"]`));
  }
  assert.match(shrineSource, /aria-current=['"]page['"][^>]*>\s*VI\s*</);
  assert.match(previousEditionSource, /href=['"]\/open-road-v6['"]>VI<\/a>/);

  assert.match(appsSource, /slug:\s*['"]open-road-v6['"]/);
  assert.match(appsSource, /name:\s*['"]Open Road VI['"]/);
  assert.match(appsSource, /kicker:\s*['"]ONE QUIET MINUTE · TEN IMAGES · FOR PETE['"]/);
  assert.match(appsSource, /path:\s*['"]\/open-road-v6['"]/);
  assert.match(launchStripSource, /name:\s*['"]OPEN ROAD VI['"]/);
  assert.match(launchStripSource, /detail:\s*['"]A LIGHT FOR PETE['"]/);
  assert.match(launchStripSource, /href:\s*['"]\/open-road-v6['"]/);
});
