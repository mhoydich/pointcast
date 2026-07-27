import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-great-canopy-loop.png',
  '02-commons-field-games.png',
  '03-moon-court.png',
  '04-wave-relay.png',
  '05-fire-commons-constellation.png',
  '06-wildlife-interval.png',
  '07-repair-tournament.png',
  '08-long-wave-final.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Beach Commons V2 publishes eight coherent collective states', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v2.astro'),
    read('src/lib/beach-commons-v2.ts'),
  ]);

  assert.match(page, /Superstructures \+ Living Games/);
  assert.match(page, /Four energy loops/);
  assert.match(page, /Ten rules for going big/);
  assert.match(page, /event\.key === 'Escape'/);
  assert.match(page, /opener\?\.focus\(\)/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /href="\/beach-commons"/);
  assert.match(data, /The Great Canopy Loop/);
  assert.match(data, /Commons Field Games/);
  assert.match(data, /Moon Court/);
  assert.match(data, /Wave Relay/);
  assert.match(data, /Fire Commons Constellation/);
  assert.match(data, /Wildlife Interval/);
  assert.match(data, /The Repair Tournament/);
  assert.match(data, /The Long Wave Final/);
  assert.match(data, /No grid-scale output is claimed|no grid-scale claim/i);
});

test('Beach Commons V2 has a machine twin, Block 0508, and edition discovery', async () => {
  const [endpoint, blockText, sitemap, llms, llmsFull, v1Page] = await Promise.all([
    read('src/pages/beach-commons/v2.json.ts'),
    read('src/content/blocks/0508.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/beach-commons.astro'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /official designated-fire context/);
  assert.equal(block.id, '0508');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.works, 8);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v2');
  assert.match(block.meta.designStatus, /conceptual/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v2'/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v2\.json/);
  assert.match(llms, /PointCast Field Study 002/);
  assert.match(llmsFull, /Beach Commons V2/);
  assert.match(v1Page, /href="\/beach-commons\/v2"/);
});

test('Beach Commons V2 keeps fire, wildlife, access, and permit boundaries explicit', async () => {
  const [data, endpoint] = await Promise.all([
    read('src/lib/beach-commons-v2.ts'),
    read('src/pages/beach-commons/v2.json.ts'),
  ]);

  assert.match(data, /designated public fire rings/);
  assert.match(data, /Wildlife is watched from a distance/);
  assert.match(data, /shoreline, bike path, emergency routes/);
  assert.match(data, /Speculative architecture only/);
  assert.match(endpoint, /dockweiler-beach-fire-pits/);
  assert.match(endpoint, /coastal-resilience\/living-shorelines/);
  assert.match(endpoint, /la-county-beach-rules-faq/);
});

test('Beach Commons V2 image and social assets have intended dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v2/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  const cardUrl = new URL('../public/images/og/beach-commons-v2.png', import.meta.url);
  await access(cardUrl);
  const cardSize = pngSize(await readFile(cardUrl));

  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));
  assert.deepEqual(cardSize, { width: 1200, height: 630 });
});
