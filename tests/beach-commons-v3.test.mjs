import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-flash-bakery.png',
  '02-palm-loom-court.png',
  '03-dough-relay.png',
  '04-sun-flour-water.png',
  '05-shade-raising-games.png',
  '06-oven-hour.png',
  '07-wildlife-breakfast.png',
  '08-maximum-beach.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Beach Commons V3 publishes eight flash bakery and palm loom states', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v3.astro'),
    read('src/lib/beach-commons-v3.ts'),
  ]);

  assert.match(page, /The building is a breakfast clock/);
  assert.match(page, /Four closed loops/);
  assert.match(page, /Four games\. Four useful scores/);
  assert.match(page, /aria-label="Beach Commons V3 full image viewer"/);
  assert.match(page, /returnFocus\?\.focus\(\)/);
  assert.match(page, /event\.key === 'Escape'/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /href="\/reviews\/beach-commons-v3"/);
  for (const title of [
    'The Flash Bakery',
    'Palm Loom Court',
    'The Dough Relay',
    'Sun, Flour, Water',
    'Shade Raising Games',
    'Oven Hour',
    'Breakfast for the Birds, Without Feeding Them',
    'The Maximum Beach',
  ]) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Beach Commons V3 has machine, Block, edition, and discovery twins', async () => {
  const [endpoint, blockText, sitemap, llms, llmsFull, v2Page] = await Promise.all([
    read('src/pages/beach-commons/v3.json.ts'),
    read('src/content/blocks/0509.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/beach-commons/v2.astro'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /companion unofficial magazine feature/);
  assert.equal(block.id, '0509');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.works, 8);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v3');
  assert.match(block.meta.designStatus, /conceptual/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v3'/);
  assert.match(sitemap, /pointcast\.xyz\/reviews\/beach-commons-v3'/);
  assert.match(llms, /PointCast Field Study 003/);
  assert.match(llmsFull, /The Maximum Beach/);
  assert.match(v2Page, /href="\/beach-commons\/v3"/);
});

test('V3 keeps material, food, fire, wildlife, access, and permit boundaries explicit', async () => {
  const [data, blockText] = await Promise.all([
    read('src/lib/beach-commons-v3.ts'),
    read('src/content/blocks/0509.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /never harvest living beach, dune, or park vegetation/);
  assert.match(data, /professional operators, sanitation, allergen controls/);
  assert.match(data, /approved inland hardscape/);
  assert.match(data, /Food, scraps, wastewater, and loose material never enter habitat or reach wildlife/);
  assert.match(data, /shoreline, bike path, emergency routes/);
  assert.match(data, /Speculative architecture and editorial fiction only/);
  assert.match(block.meta.affiliationBoundary, /no Maxim affiliation or endorsement/);
});

test('The Maximum Beach is a disclosed PointCast Review with its own JSON contract', async () => {
  const [page, endpoint, catalog, desk] = await Promise.all([
    read('src/pages/reviews/beach-commons-v3.astro'),
    read('src/pages/reviews/beach-commons-v3.json.ts'),
    read('src/data/reviews.ts'),
    read('src/pages/reviews/index.astro'),
  ]);

  assert.match(page, /THE MAXIMUM BEACH/);
  assert.match(page, /NOT AFFILIATED WITH MAXIM/);
  assert.match(page, /THE 30-SECOND VERSION/);
  assert.match(page, /THE SCORECARD/);
  assert.match(page, /4\.6/);
  assert.match(endpoint, /pointcast\.review\/v1/);
  assert.match(endpoint, /not commissioned, reviewed, sponsored, or endorsed/i);
  assert.match(endpoint, /scope: 'published conceptual experience/);
  assert.match(catalog, /slug: 'beach-commons-v3'/);
  assert.match(catalog, /blockId: '0509'/);
  assert.match(desk, /image="\/images\/og\/beach-commons-v3\.png"/);
});

test('Beach Commons V3 image and social assets have intended dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v3/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  const cardUrl = new URL('../public/images/og/beach-commons-v3.png', import.meta.url);
  const blockCardUrl = new URL('../public/images/og/b/0509.png', import.meta.url);
  await access(cardUrl);
  await access(blockCardUrl);
  const cardSize = pngSize(await readFile(cardUrl));
  const blockCardSize = pngSize(await readFile(blockCardUrl));

  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));
  assert.deepEqual(cardSize, { width: 1200, height: 630 });
  assert.deepEqual(blockCardSize, { width: 1200, height: 630 });
});
