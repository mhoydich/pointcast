import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Haptic Dreams ships one event grammar across three legible outputs', async () => {
  const [data, page, endpoint, headers] = await Promise.all([
    read('src/lib/pointcast-haptic-dreams.ts'),
    read('src/pages/haptic-dreams.astro'),
    read('src/pages/haptic-dreams.json.ts'),
    read('public/_headers'),
  ]);

  assert.equal((data.match(/world: \{ possession:/g) ?? []).length, 18);
  assert.equal((data.match(/phrase: '/g) ?? []).length, 11);
  assert.match(page, /data-view="world"/);
  assert.match(page, /data-view="sleeve"/);
  assert.match(page, /data-view="translation"/);
  assert.match(page, /BroadcastChannel\('pointcast-haptic-dreams'\)/);
  assert.match(page, /navigator\.vibrate/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(headers, /\/haptic-dreams\.json[\s\S]*Access-Control-Allow-Origin: \*/);
  assert.match(endpoint, /liveFeed: false/);
  assert.match(endpoint, /tokenOrNftOffer: false/);
});

test('Haptic Dreams keeps real-game, artwork, and hardware boundaries visible', async () => {
  const [data, page, blockText] = await Promise.all([
    read('src/lib/pointcast-haptic-dreams.ts'),
    read('src/pages/haptic-dreams.astro'),
    read('src/content/blocks/0567.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /ESPN play-by-play/);
  assert.match(data, /Ohio State official box score/);
  assert.match(data, /not affiliated with either university/);
  assert.match(page, /JON SNOW/);
  assert.match(page, /not a claim of live infrastructure/);
  assert.equal(block.id, '0567');
  assert.equal(block.author, 'mh+cc');
  assert.equal(block.meta.selectedPlays, 18);
  assert.equal(block.meta.artworkGenerativelyRedrawn, false);
  assert.equal(block.meta.certifiedHardware, false);
  assert.equal(block.meta.tokenOrNftOffer, false);
});

test('Haptic Dreams is discoverable from the homepage, magazine, apps, agents text, sitemap, and Block', async () => {
  const [homeEdition, magazine, magazineJson, apps, llms, llmsFull, sitemap] = await Promise.all([
    read('src/components/HomeNewEdition.astro'),
    read('src/pages/25/magazine/index.astro'),
    read('src/pages/25/magazine.json.ts'),
    read('src/lib/pointcast-apps.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/sitemap-discovery.xml.ts'),
  ]);

  assert.match(homeEdition, /id: '0567'/);
  assert.match(magazine, /href="\/haptic-dreams"/);
  assert.match(magazineJson, /hapticDreamsJson/);
  assert.match(apps, /slug: 'haptic-dreams-saturday-kingdom'/);
  assert.match(llms, /Haptic Dreams: Saturday Kingdom/);
  assert.match(llmsFull, /`\/haptic-dreams`/);
  assert.match(sitemap, /pointcast\.xyz\/haptic-dreams/);
});

test('credited artwork derivatives and social card are checked in at production dimensions', async () => {
  const lionPath = new URL('../public/images/pointcast-haptic-dreams/jon-snow-lion.webp', import.meta.url);
  const trainPath = new URL('../public/images/pointcast-haptic-dreams/jon-snow-train.webp', import.meta.url);
  const socialPath = new URL('../public/images/pointcast-haptic-dreams/social-card.png', import.meta.url);
  await Promise.all([access(lionPath), access(trainPath), access(socialPath)]);
  const [lion, train, social] = await Promise.all([
    sharp(fileURLToPath(lionPath)).metadata(),
    sharp(fileURLToPath(trainPath)).metadata(),
    sharp(fileURLToPath(socialPath)).metadata(),
  ]);

  assert.equal(lion.width, 960);
  assert.equal(train.width, 2200);
  assert.equal(social.width, 1200);
  assert.equal(social.height, 630);
  assert.equal(social.format, 'png');
});
