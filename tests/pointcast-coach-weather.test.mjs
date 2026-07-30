import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Coach Weather publishes twelve honest preseason pressure fronts', async () => {
  const [data, endpoint] = await Promise.all([
    read('src/lib/pointcast-coach-weather.ts'),
    read('src/pages/25/magazine/coach-weather.json.ts'),
  ]);

  assert.equal((data.match(/front\(/g) ?? []).length, 12);
  assert.equal((data.match(/\n    'heating',/g) ?? []).length, 5);
  assert.equal((data.match(/\n    'clearing',/g) ?? []).length, 5);
  assert.equal((data.match(/\n    'storm-cell',/g) ?? []).length, 2);
  assert.match(data, /movement: 0/);
  assert.match(data, /No coach moves before the first game/);
  assert.match(endpoint, /firstMovementEligibleAfter/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
});

test('Coach Weather is a local returning product, not a static ranking page', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/25/magazine/coach-weather.astro'),
    read('src/lib/pointcast-coach-weather.ts'),
  ]);

  assert.match(data, /day: 'MON'/);
  assert.match(data, /title: 'Movement Report'/);
  assert.match(page, /pointcast:coach-weather-watchlist:v1/);
  assert.match(page, /data-watch-filter/);
  assert.match(page, /data-build-axis/);
  assert.match(page, /data-share-match/);
  assert.match(page, /data-download-match/);
  assert.match(page, /canvas\.width = 1200/);
  assert.match(page, /searchParams\.set\('build'/);
  assert.match(page, /allocation remains on this device/i);
  assert.doesNotMatch(page, /fetch\(/);
  assert.doesNotMatch(page, /XMLHttpRequest/);
});

test('Coach Weather has Block, magazine, homepage, app, and agent discovery surfaces', async () => {
  const [blockText, departments, magazine, home, apps, llms, llmsFull] =
    await Promise.all([
      read('src/content/blocks/0545.json'),
      read('src/lib/pointcast-college-football-magazine.ts'),
      read('src/pages/25/magazine/index.astro'),
      read('src/components/HomeNewEdition.astro'),
      read('src/lib/pointcast-apps.ts'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
    ]);
  const block = JSON.parse(blockText);

  assert.equal(block.id, '0545');
  assert.equal(block.meta.pressureFronts, 12);
  assert.equal(block.meta.movementCount, 0);
  assert.equal(block.meta.matcherCandidates, 50);
  assert.equal(block.meta.localOnly, true);
  assert.equal(
    block.external.url,
    'https://pointcast.xyz/25/magazine/coach-weather',
  );
  assert.match(departments, /name: 'Coach Weather'/);
  assert.match(magazine, /href="\/25\/magazine\/coach-weather"/);
  assert.match(home, /id: '0545'/);
  assert.match(home, /href: '\/25\/magazine\/coach-weather'/);
  assert.match(apps, /slug: 'coach-weather-2026'/);
  assert.match(llms, /Coach Weather — Preseason Pressure Map 000/);
  assert.match(llmsFull, /`\/25\/magazine\/coach-weather`/);
});

test('Coach Weather social card is a checked-in 1200 by 630 PNG', async () => {
  const socialPath = new URL(
    '../public/images/pointcast-coach-weather/social-card.png',
    import.meta.url,
  );
  await access(socialPath);
  const metadata = await sharp(fileURLToPath(socialPath)).metadata();

  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  assert.equal(metadata.format, 'png');
});
