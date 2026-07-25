import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('BELLS / BLOOM ships a complete human, machine, feed, discovery, and ad-network release', async () => {
  const [page, manifestText, block, sitemap, llms, llmsFull, ads, adsJson, assets] = await Promise.all([
    read('src/pages/showcast/bells-bloom.astro'),
    read('public/showcast/bells-bloom.json'),
    read('src/content/blocks/0492.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/lib/open-ad-network.ts'),
    read('src/pages/ads.json.ts'),
    readdir(new URL('../public/showcast/bells-bloom/assets/', import.meta.url)),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.match(page, /https:\/\/pointcast\.xyz\/showcast\/bells-bloom/);
  assert.match(page, /ImageGallery/);
  assert.match(page, /const WORKS = \[/);
  assert.equal(manifest.workCount, 28);
  assert.equal(manifest.acts.length, 4);
  assert.equal(manifest.works.length, 28);
  assert.ok(manifest.works.every((work) => work.source.startsWith('https://www.midjourney.com/jobs/')));
  assert.equal(assets.filter((name) => name.endsWith('.jpg')).length, 28);
  assert.match(block, /"id": "0492"/);
  assert.match(block, /"author": "mh\+cc"/);
  assert.match(sitemap, /pointcast\.xyz\/showcast\/bells-bloom\.json/);
  assert.match(llms, /PointCast Showcast/);
  assert.match(llmsFull, /PointCast Showcast 001/);
  assert.match(ads, /PC-BELLS-BLOOM-001/);
  assert.match(ads, /PC-BELLS-BLOOM-2026/);
  assert.match(adsJson, /BELLS_BLOOM_CAMPAIGN/);
});

test('BELLS / BLOOM prerenders every binary surface despite the empty Astro public directory', async () => {
  const [assetsRoute, shareRoute, blockRoute, manifestRoute] = await Promise.all([
    read('src/pages/showcast/bells-bloom/assets/[asset].jpg.ts'),
    read('src/pages/images/og/bells-bloom-showcast.png.ts'),
    read('src/pages/images/og/b/0492.png.ts'),
    read('src/pages/showcast/bells-bloom.json.ts'),
  ]);

  assert.match(assetsRoute, /export const getStaticPaths/);
  assert.match(assetsRoute, /Content-Type': 'image\/jpeg/);
  assert.match(shareRoute, /bells-bloom-showcast\.png/);
  assert.match(blockRoute, /0492\.png/);
  assert.match(manifestRoute, /Content-Type': 'application\/json/);
});
