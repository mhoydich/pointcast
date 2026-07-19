import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const shrineUrl = new URL('../src/pages/open-road-v7.astro', import.meta.url);
const appsUrl = new URL('../src/lib/pointcast-apps.ts', import.meta.url);
const launchStripUrl = new URL('../src/components/AppLaunchStrip.astro', import.meta.url);
const previousEditionUrl = new URL('../src/pages/open-road-v6.astro', import.meta.url);

test('Open Road VII arranges sixteen unique archive images into four watches', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');
  const assetNames = [
    ...shrineSource.matchAll(
      /from\s+['"]\.\.\/assets\/shrines\/open-road-v7\/([^'"]+\.webp)['"]/g,
    ),
  ].map((match) => match[1]);

  assert.equal(assetNames.length, 16);
  assert.equal(new Set(assetNames).size, 16);
  assert.match(shrineSource, /(?:const|interface)\s+WATCH/i);
  assert.match(shrineSource, /First Light/);
  assert.match(shrineSource, /Wide Day/);
  assert.match(shrineSource, /Long Light/);
  assert.match(shrineSource, /Night Watch/);
  assert.match(shrineSource, /(?:WATCH|VIGIL|TOTAL)[A-Z0-9_]*\s*=\s*(?:60_?000|60\s*\*\s*1000)/);
  assert.match(shrineSource, /(?:IMAGE|SLIDE|STEP)[A-Z0-9_]*\s*=\s*(?:15_?000|15\s*\*\s*1000)/);

  await Promise.all(
    assetNames.map((name) =>
      access(new URL('../src/assets/shrines/open-road-v7/' + name, import.meta.url)),
    ),
  );
});

test('Open Road VII begins with the local hour and keeps watch navigation deterministic', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  assert.match(shrineSource, /new Date\(\)\.getHours\(\)/);
  assert.match(shrineSource, /hour\s*>=\s*5[\s\S]{0,120}hour\s*<\s*10/);
  assert.match(shrineSource, /hour\s*>=\s*10[\s\S]{0,120}hour\s*<\s*17/);
  assert.match(shrineSource, /hour\s*>=\s*17[\s\S]{0,120}hour\s*<\s*21/);
  assert.match(shrineSource, /data-watch/);
  assert.match(shrineSource, /target\s*\*\s*(?:IMAGE|SLIDE|STEP)[A-Z0-9_]*/i);
  for (const label of ['Enter this hour', 'Hold this image', 'Previous', 'Next', 'Leave the watch']) {
    assert.match(shrineSource, new RegExp(label));
  }
});

test('Open Road VII keeps one pocket light locally and restores share links', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  assert.match(shrineSource, /Keep this light/);
  assert.match(shrineSource, /pocket light/i);
  assert.match(shrineSource, /Carry one light into the next hour\./);
  assert.match(shrineSource, /(?:location\.hash|URLSearchParams|hashchange)/);
  assert.match(shrineSource, /(?:history\.replaceState|history\.pushState|location\.hash\s*=)/);
  assert.match(shrineSource, /(?:navigator\.share|clipboard\.writeText)/);
  assert.doesNotMatch(shrineSource, /fetch\s*\(/);
  assert.doesNotMatch(shrineSource, /localStorage|sessionStorage/);
});

test('Open Road VII remains silent, private, and operable without motion or a pointer', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  assert.match(shrineSource, /Bells off/);
  assert.match(shrineSource, /aria-pressed=['"]false['"]/);
  assert.match(shrineSource, /(?:window\.)?(?:AudioContext|webkitAudioContext)/);
  assert.match(shrineSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(shrineSource, /document\.addEventListener\(\s*['"]visibilitychange['"]/);
  assert.match(shrineSource, /document\.hidden/);
  for (const key of ['Escape', 'ArrowLeft', 'ArrowRight']) {
    assert.match(shrineSource, new RegExp(`event\\.(?:key|code)\\s*===?\\s*['"]${key}['"]`));
  }
  assert.match(shrineSource, /['"](?:1|2|3|4)['"]\.includes\(event\.key\)|event\.key\s*>=\s*['"]1['"]/);
  assert.match(shrineSource, /aria-live=['"]polite['"]/);
  assert.match(shrineSource, /object-fit:\s*contain/);
  assert.match(shrineSource, /<BlockLayout[\s\S]{0,420}\bimmersive\b/);
});

test('Open Road VII protects native controls and safely resets shared state', async () => {
  const shrineSource = await readFile(shrineUrl, 'utf8');

  assert.match(shrineSource, /target\.closest\(\s*['"]input, textarea, select/);
  assert.match(shrineSource, /event\.code\s*===?\s*['"]Space['"][\s\S]{0,180}target\.closest\(\s*['"]button, a/);
  assert.match(shrineSource, /Number\.parseInt\(params\.get\(['"]image['"]\)/);
  assert.match(shrineSource, /Number\.isInteger\(restoredImage\)/);
  assert.match(shrineSource, /function\s+selectWatch[\s\S]{0,900}history\.replaceState/);
  assert.match(shrineSource, /selectWatch\(watchIndex,\s*false\)/);
  for (const target of ['holdButton', 'keepButton', 'shareButton', 'enterButton']) {
    assert.match(shrineSource, new RegExp(`focusSoon\\(${target}\\)`));
  }
  assert.match(shrineSource, /!openingBellPlayed\.has\(key\)\s*&&\s*bell\(['"]opening['"]\)/);
  assert.match(shrineSource, /!closingBellPlayed\.has\(key\)\s*&&\s*bell\(['"]closing['"]\)/);
});

test('Open Road VII metadata, edition navigation, and PointCast discovery agree', async () => {
  const [shrineSource, appsSource, launchStripSource, previousEditionSource] =
    await Promise.all([
      readFile(shrineUrl, 'utf8'),
      readFile(appsUrl, 'utf8'),
      readFile(launchStripUrl, 'utf8'),
      readFile(previousEditionUrl, 'utf8'),
    ]);

  assert.match(shrineSource, /Open Road VII · The Hour That Finds You/);
  assert.match(shrineSource, /https:\/\/pointcast\.xyz\/open-road-v7/);
  assert.match(shrineSource, /open-road-v7-og\.(?:jpg|jpeg|png)/);
  assert.match(shrineSource, /['"]@type['"]:\s*['"]WebApplication['"]/);
  for (const path of [
    '/open-road',
    '/open-road-v2',
    '/open-road-v3',
    '/open-road-v4',
    '/open-road-v5',
    '/open-road-v6',
  ]) {
    assert.match(shrineSource, new RegExp(`href=['"]${path}['"]`));
  }
  assert.match(shrineSource, /aria-current=['"]page['"][^>]*>\s*VII\s*</);
  assert.match(previousEditionSource, /href=['"]\/open-road-v7['"]>VII<\/a>/);

  assert.match(appsSource, /slug:\s*['"]open-road-v7['"]/);
  assert.match(appsSource, /name:\s*['"]Open Road VII['"]/);
  assert.match(appsSource, /kicker:\s*['"]SIXTEEN WITNESSES · FOUR WATCHES · KEEP ONE LIGHT['"]/);
  assert.match(appsSource, /path:\s*['"]\/open-road-v7['"]/);
  assert.match(launchStripSource, /name:\s*['"]OPEN ROAD VII['"]/);
  assert.match(launchStripSource, /detail:\s*['"]THE HOUR THAT FINDS YOU['"]/);
  assert.match(launchStripSource, /href:\s*['"]\/open-road-v7['"]/);
});
