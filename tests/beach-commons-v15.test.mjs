import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-utility-parade.png',
  '02-one-good-cart.png',
  '03-first-light-coffee.png',
  '04-portable-room.png',
  '05-repair-light.png',
  '06-blue-hour-lantern.png',
  '07-cheap-sweet-lifetime.png',
  '08-all-gear-goes-home.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('The Good Gear publishes fifteen scored official-source picks', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v15.astro'),
    read('src/lib/beach-commons-v15.ts'),
  ]);

  const pickRanks = [...data.matchAll(/^\s{4}rank: (\d+),$/gm)].map((match) => Number(match[1]));
  assert.deepEqual(pickRanks, Array.from({ length: 15 }, (_, index) => index + 1));
  for (const product of [
    'Gear Tie Original',
    'FRAKTA',
    'Pocket Blanket',
    'Range 500',
    'Chair One',
    'Moonlander',
    'RUX',
    'LoadOut GoBox',
  ]) {
    assert.match(data, new RegExp(product));
  }
  assert.match(page, /Fifteen things worth explaining\./);
  assert.match(page, /Official page ↗/);
  assert.match(page, /No samples\. No affiliate money\. No invented field test\./);
  assert.match(page, /aria-label="The Good Gear full image viewer"/);
  assert.match(page, /prefers-reduced-motion/);
});

test('the score, carts, composer, playlist, and Pinterest companion stay bounded', async () => {
  const [page, data, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v15.astro'),
    read('src/lib/beach-commons-v15.ts'),
    read('src/pages/beach-commons/v15.json.ts'),
    read('src/content/blocks/0542.json'),
  ]);
  const block = JSON.parse(blockText);
  const points = [...data.matchAll(/points: (\d+)/g)].map((match) => Number(match[1]));

  assert.equal(points.reduce((sum, point) => sum + point, 0), 100);
  assert.match(data, /total: 79\.93/);
  assert.match(data, /total: 466\.84/);
  assert.match(data, /total: 925\.79/);
  assert.match(page, /Cart Composer/);
  assert.match(page, /'100': \['frakta', 'gear-tie', 'alpenglow'\]/);
  assert.doesNotMatch(page, /'100': \['frakta', 'gear-tie', 'matador', 'alpenglow'\]/);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /www\.pinterest\.com\/pin\/create\/button/);
  assert.match(data, /PACK LIGHT, STAY LONG/);
  assert.match(data, /open\.spotify\.com\/track/);
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
  assert.doesNotMatch(page, /\bfetch\(/);
  assert.match(endpoint, /checkout: false/);
  assert.match(endpoint, /networkWrites: false/);
  assert.equal(block.meta.localCartComposer, true);
  assert.equal(block.meta.spotifyPlaylistCreated, false);
  assert.equal(block.meta.affiliateRevenue, 0);
});

test('The Good Gear has JSON, Block, series, homepage, and discovery twins', async () => {
  const [endpoint, blockText, series, sitemap, llms, llmsFull, homepage, homeEdition] =
    await Promise.all([
      read('src/pages/beach-commons/v15.json.ts'),
      read('src/content/blocks/0542.json'),
      read('src/lib/beach-commons-series.ts'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('src/pages/index.astro'),
      read('src/components/HomeNewEdition.astro'),
    ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0542');
  assert.equal(block.meta.rankedPicks, 15);
  assert.equal(block.meta.originalVisualPlates, 8);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v15');
  assert.match(series, /currentEdition: 15/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v15'/);
  assert.match(llms, /PointCast Field Study 015/);
  assert.match(llmsFull, /THE GOOD GEAR/);
  assert.match(homepage, /href="\/beach-commons\/v15"/);
  assert.match(homepage, /Block 0542/);
  assert.match(homeEdition, /href="\/beach-commons\/v15"/);
  assert.match(homeEdition, /New<br \/>0542/);
});

test('The Good Gear images have vertical pin and social dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v15/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  assert.deepEqual(assets, assetNames.map(() => ({ width: 1024, height: 1536 })));

  const socialUrl = new URL('../public/images/og/b/0542.png', import.meta.url);
  await access(socialUrl);
  assert.deepEqual(pngSize(await readFile(socialUrl)), { width: 1200, height: 630 });
});
