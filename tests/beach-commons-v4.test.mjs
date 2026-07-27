import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-element-yard.png',
  '02-sun-crown.png',
  '03-moon-basin.png',
  '04-wind-loom.png',
  '05-rain-organ.png',
  '06-water-court.png',
  '07-fire-stone-long-night.png',
  '08-seasonal-score.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Beach Commons V4 publishes seven elemental systems and eight sculpture plates', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v4.astro'),
    read('src/lib/beach-commons-v4.ts'),
  ]);

  assert.match(page, /Weather is the artist/);
  assert.match(page, /Choose a season/);
  assert.match(page, /Eight field plates/);
  assert.match(page, /aria-label="Beach Commons V4 full image viewer"/);
  assert.match(page, /returnFocus\?\.focus\(\)/);
  assert.match(page, /event\.key === 'Escape'/);
  assert.match(page, /prefers-reduced-motion/);
  for (const title of [
    'The Element Yard',
    'Sun Crown',
    'Moon Basin',
    'Wind Loom',
    'Rain Organ',
    'Water Court',
    'Fire, Stone, Long Night',
    'The Seasonal Score',
  ]) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const element of ['Sun', 'Moon', 'Wind', 'Rain', 'Water', 'Fire', 'Stone']) {
    assert.match(data, new RegExp(`title: '${element}'`));
  }
});

test('Beach Commons V4 has machine, Block, edition, and discovery twins', async () => {
  const [endpoint, blockText, sitemap, llms, llmsFull, v3Page, v3Data] = await Promise.all([
    read('src/pages/beach-commons/v4.json.ts'),
    read('src/content/blocks/0511.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/beach-commons/v3.astro'),
    read('src/lib/beach-commons-v3.ts'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0511');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.works, 8);
  assert.equal(block.meta.elements, 7);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v4');
  assert.match(block.meta.designStatus, /conceptual/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v4'/);
  assert.match(llms, /PointCast Field Study 004/);
  assert.match(llmsFull, /Sculpture Yard \+ Element Maxxing/);
  assert.match(v3Page, /href="\/beach-commons\/v4"/);
  assert.match(v3Data, /nextEdition/);
});

test('V4 keeps element, engineering, habitat, access, and permit boundaries explicit', async () => {
  const [data, blockText] = await Promise.all([
    read('src/lib/beach-commons-v4.ts'),
    read('src/content/blocks/0511.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /not controlling weather or inventing unlimited energy/);
  assert.match(data, /never aim concentrated sunlight toward people, traffic, aircraft, or wildlife/);
  assert.match(data, /no standing water/);
  assert.match(data, /designated public rings/);
  assert.match(data, /shoreline passage, bike travel, emergency access/);
  assert.match(data, /Speculative architecture and public-art fiction only/);
  assert.match(block.meta.amplificationBoundary, /no weather-control/);
});

test('Beach Commons V4 image and social assets have intended dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v4/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  const cardUrl = new URL('../public/images/og/beach-commons-v4.png', import.meta.url);
  const blockCardUrl = new URL('../public/images/og/b/0511.png', import.meta.url);
  await access(cardUrl);
  await access(blockCardUrl);
  const cardSize = pngSize(await readFile(cardUrl));
  const blockCardSize = pngSize(await readFile(blockCardUrl));

  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));
  assert.deepEqual(cardSize, { width: 1200, height: 630 });
  assert.deepEqual(blockCardSize, { width: 1200, height: 630 });
});
