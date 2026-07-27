import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-weather-school.png',
  '02-sun-studio.png',
  '03-wind-notation-hall.png',
  '04-rain-roof-choir.png',
  '05-water-accounting-court.png',
  '06-moon-assembly.png',
  '07-fire-stone-seminar.png',
  '08-tide-parliament.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Beach Commons V5 publishes the Weather School and Tide Parliament in eight plates', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v5.astro'),
    read('src/lib/beach-commons-v5.ts'),
  ]);

  assert.match(page, /Weather is the curriculum/);
  assert.match(page, /Choose a school hour/);
  assert.match(page, /Eight field plates/);
  assert.match(page, /aria-label="Beach Commons V5 full image viewer"/);
  assert.match(page, /returnFocus\?\.focus\(\)/);
  assert.match(page, /event\.key === 'Escape'/);
  assert.match(page, /prefers-reduced-motion/);
  for (const title of [
    'The Weather School',
    'Sun Studio',
    'Wind Notation Hall',
    'Rain Roof Choir',
    'Water Accounting Court',
    'Moon Assembly',
    'Fire + Stone Seminar',
    'Tide Parliament',
  ]) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const element of ['Sun', 'Moon', 'Wind', 'Rain', 'Water', 'Fire', 'Stone']) {
    assert.match(data, new RegExp(`title: '${element}'`));
  }
});

test('Beach Commons V5 has machine, Block, edition, and discovery twins', async () => {
  const [endpoint, blockText, sitemap, llms, llmsFull, v4Page, v4Data] = await Promise.all([
    read('src/pages/beach-commons/v5.json.ts'),
    read('src/content/blocks/0513.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/beach-commons/v4.astro'),
    read('src/lib/beach-commons-v4.ts'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0513');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.works, 8);
  assert.equal(block.meta.elements, 7);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v5');
  assert.match(block.meta.designStatus, /conceptual/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v5'/);
  assert.match(llms, /PointCast Field Study 005/);
  assert.match(llmsFull, /Weather School \+ Tide Parliament/);
  assert.match(v4Page, /href="\/beach-commons\/v5"/);
  assert.match(v4Data, /nextEdition/);
});

test('V5 keeps education, weather, engineering, habitat, access, and permit boundaries explicit', async () => {
  const [data, blockText] = await Promise.all([
    read('src/lib/beach-commons-v5.ts'),
    read('src/content/blocks/0513.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /not a government, regulator, forecast service, or scientific authority/);
  assert.match(data, /never aim concentrated light toward people, traffic, aircraft, or wildlife/);
  assert.match(data, /no standing water/);
  assert.match(data, /designated public rings/);
  assert.match(data, /shoreline passage, bike travel, emergency access/);
  assert.match(data, /Speculative architecture, public-art fiction, and an imagined civic curriculum only/);
  assert.match(block.meta.authorityBoundary, /not a school, government, regulator, forecast service, or scientific authority/);
});

test('Beach Commons V5 image and social assets have intended dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v5/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  const cardUrl = new URL('../public/images/og/beach-commons-v5.png', import.meta.url);
  const blockCardUrl = new URL('../public/images/og/b/0513.png', import.meta.url);
  await access(cardUrl);
  await access(blockCardUrl);
  const cardSize = pngSize(await readFile(cardUrl));
  const blockCardSize = pngSize(await readFile(blockCardUrl));

  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));
  assert.deepEqual(cardSize, { width: 1200, height: 630 });
  assert.deepEqual(blockCardSize, { width: 1200, height: 630 });
});
