import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../src/pages/reviews/year-one.astro', import.meta.url);
const jsonPath = new URL('../src/pages/reviews/year-one.json.ts', import.meta.url);
const catalogPath = new URL('../src/data/reviews.ts', import.meta.url);
const blockPath = new URL('../src/content/blocks/0506.json', import.meta.url);
const sitemapPath = new URL('../src/pages/sitemap-discovery.xml.ts', import.meta.url);
const llmsPath = new URL('../public/llms.txt', import.meta.url);
const assetsPath = new URL('../public/images/year-one/', import.meta.url);

const expectedAssets = [
  'cover.webp',
  'transmission.webp',
  'porcelain-color.webp',
  'classic-black.webp',
  'classic-window.webp',
  'blue-arch.webp',
  'flower-wave.webp',
  'pop-curl.webp',
  'pop-swan.webp',
  'minimal-line.webp',
  'minimal-arc.webp',
  'double-rainbow.webp',
  'soft-lilac.webp',
  'great-wave.webp',
  'neon-pillar.webp',
  'neon-run.webp',
  'neon-ring.webp',
  'emerald-curl.webp',
  'maximal-wave.webp',
  'lime-curl.webp',
  'paper-model.webp',
  'primitive.webp',
  'year-one-og.jpg',
  'manifest.json',
];

test('Year One publishes a short-form magazine feature with the supplied archive facts', async () => {
  const page = await readFile(pagePath, 'utf8');

  assert.match(page, /THE MALL LEARNED TO SURF/);
  assert.match(page, /THE 30-SECOND VERSION/);
  assert.match(page, /116/);
  assert.match(page, /29/);
  assert.match(page, /BEST IN SHOW/);
  assert.match(page, /FAST MATH/);
  assert.match(page, /4\.5/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /reviews\/year-one\.json/);
});

test('Year One has an adjacent review contract and permanent PointCast block', async () => {
  const [endpoint, catalog, blockText] = await Promise.all([
    readFile(jsonPath, 'utf8'),
    readFile(catalogPath, 'utf8'),
    readFile(blockPath, 'utf8'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /pointcast\.review\/v1/);
  assert.match(endpoint, /totalImages: 116/);
  assert.match(endpoint, /selectedForFeature: 22/);
  assert.match(catalog, /slug: 'year-one'/);
  assert.match(catalog, /blockId: '0506'/);
  assert.equal(block.id, '0506');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.rating, 4.5);
  assert.equal(block.meta.sourceImages, 116);
  assert.equal(block.meta.selectedWorks, 22);
  assert.equal(block.external.url, 'https://pointcast.xyz/reviews/year-one');
});

test('Year One is advertised through Reviews discovery surfaces', async () => {
  const [sitemap, llms] = await Promise.all([
    readFile(sitemapPath, 'utf8'),
    readFile(llmsPath, 'utf8'),
  ]);

  assert.match(sitemap, /pointcast\.xyz\/reviews\/year-one'/);
  assert.match(sitemap, /pointcast\.xyz\/reviews\/year-one\.json/);
  assert.match(llms, /Year One lives/);
  assert.match(llms, /Block 0506/);
});

test('Year One keeps the complete curated image set and source manifest', async () => {
  await Promise.all(expectedAssets.map((asset) => access(new URL(asset, assetsPath))));
  const manifest = JSON.parse(await readFile(new URL('manifest.json', assetsPath), 'utf8'));

  assert.equal(manifest.length, 22);
  assert.ok(manifest.every((item) => item.sourceName.endsWith('.png')));
  assert.ok(manifest.every((item) => item.width > 0 && item.height > 0));
});
