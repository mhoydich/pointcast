import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const reviewPagePath = new URL('../src/pages/reviews/the-listening-grove.astro', import.meta.url);
const reviewJsonPath = new URL('../src/pages/reviews/the-listening-grove.json.ts', import.meta.url);
const viewerPath = new URL('../src/pages/listening-grove.astro', import.meta.url);
const deskPath = new URL('../src/pages/reviews/index.astro', import.meta.url);
const deskJsonPath = new URL('../src/pages/reviews.json.ts', import.meta.url);
const catalogPath = new URL('../src/data/reviews.ts', import.meta.url);
const blockPath = new URL('../src/content/blocks/0495.json', import.meta.url);
const sitemapPath = new URL('../src/pages/sitemap-discovery.xml.ts', import.meta.url);
const llmsPath = new URL('../public/llms.txt', import.meta.url);
const desktopPath = new URL(
  '../public/images/listening-grove-review/listening-grove-tide-desktop.jpg',
  import.meta.url,
);
const prismPath = new URL(
  '../public/images/listening-grove-review/listening-grove-prism-auto.jpg',
  import.meta.url,
);
const mobilePath = new URL(
  '../public/images/listening-grove-review/listening-grove-ritual-mobile.jpg',
  import.meta.url,
);

test('Listening Grove review publishes tested facts, screenshots, scores, and honest collect status', async () => {
  const page = await readFile(reviewPagePath, 'utf8');

  assert.match(page, /617 covers/i);
  assert.match(page, /TIDE/);
  assert.match(page, /PRISM/);
  assert.match(page, /RITUAL/);
  assert.match(page, /15-second drift/);
  assert.match(page, /8-second flow/);
  assert.match(page, /3\.5-second quick cut/);
  assert.match(page, /390 × 844/);
  assert.match(page, /10ꜩ/);
  assert.match(page, /edition size of five/);
  assert.match(page, /not proof of a mint/i);
  assert.match(page, /OPEN POINTCAST EDITION/);
  assert.match(page, /OPEN STANDALONE/);
  assert.match(page, /listening-grove-tide-desktop\.jpg/);
  assert.match(page, /listening-grove-prism-auto\.jpg/);
  assert.match(page, /listening-grove-ritual-mobile\.jpg/);
});

test('Listening Grove has a PointCast viewer, adjacent JSON, and permanent block', async () => {
  const [viewer, endpoint, blockText] = await Promise.all([
    readFile(viewerPath, 'utf8'),
    readFile(reviewJsonPath, 'utf8'),
    readFile(blockPath, 'utf8'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(viewer, /the-listening-grove\.mhoydich\.chatgpt\.site/);
  assert.match(viewer, /allow="autoplay; fullscreen"/);
  assert.match(viewer, /reviews\/the-listening-grove/);
  assert.match(endpoint, /pointcast\.review\/v1/);
  assert.match(endpoint, /collectionStatus/);
  assert.match(endpoint, /no verified operation hash/i);
  assert.equal(block.id, '0495');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.rating, 4.5);
  assert.equal(block.meta.works, 617);
  assert.equal(block.meta.collectionStatus, 'preview-only');
  assert.equal(block.external.url, 'https://pointcast.xyz/reviews/the-listening-grove');
});

test('PointCast Reviews framework exposes an editorial desk and JSON catalog', async () => {
  const [desk, endpoint, catalog] = await Promise.all([
    readFile(deskPath, 'utf8'),
    readFile(deskJsonPath, 'utf8'),
    readFile(catalogPath, 'utf8'),
  ]);

  assert.match(desk, /THE POINTCAST METHOD/);
  assert.match(desk, /ALL REVIEWS/);
  assert.match(endpoint, /pointcast\.reviews\/v1/);
  assert.match(endpoint, /editorsChoiceAt/);
  assert.match(catalog, /The Listening Grove/);
  assert.match(catalog, /Tone Bloom/);
  assert.match(catalog, /blockId/);
});

test('Review framework routes are discoverable', async () => {
  const [sitemap, llms] = await Promise.all([
    readFile(sitemapPath, 'utf8'),
    readFile(llmsPath, 'utf8'),
  ]);

  assert.match(sitemap, /pointcast\.xyz\/reviews'/);
  assert.match(sitemap, /pointcast\.xyz\/reviews\.json/);
  assert.match(sitemap, /pointcast\.xyz\/reviews\/the-listening-grove/);
  assert.match(sitemap, /pointcast\.xyz\/listening-grove/);
  assert.match(llms, /PointCast Reviews/);
  assert.match(llms, /Block 0495/);
});

test('Listening Grove review image assets are present', async () => {
  await Promise.all([access(desktopPath), access(prismPath), access(mobilePath)]);
});
