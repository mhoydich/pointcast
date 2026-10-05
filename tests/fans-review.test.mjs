import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('fans guide data is a dated desk review with six non-affiliate picks', async () => {
  const review = JSON.parse(await read('src/data/fans.json'));
  assert.equal(review.schema, 'pointcast.fans/v1');
  assert.equal(review.asOf, '2026-10-05');
  assert.equal(review.handsOn, false);
  assert.equal(review.affiliateLinks, false);
  assert.equal(review.picks.length, 6);
  assert.deepEqual(review.picks.map((p) => p.id), [
    'vornado-630',
    'dreo-turbopoly-312',
    'vornado-eos9',
    'windmill-fan',
    'hunter-zentech-44',
    'vornado-transom',
  ]);
  assert.deepEqual(review.picks.map((p) => p.price), [79.99, 44.99, 149.99, 79, 379.99, 109.99]);
  for (const pick of review.picks) {
    assert.match(pick.priceNote, /October 5, 2026/);
    assert.match(pick.url, /^https:\/\/[^?]+$/);
    assert.doesNotMatch(pick.url, /utm_|affiliate|amazon\.|amzn\.to/i);
    assert.match(pick.credit, /^Product photo:/);
    assert.ok(pick.testerNote.url.startsWith('https://'));
    await access(new URL(`../public${pick.image}`, import.meta.url));
  }
  assert.match(review.climate.almanac2026_10_05.note, /83°F/);
  assert.match(review.climate.almanac2026_10_05.note, /not found/);
  assert.match(review.doubts.join(' '), /does not treat 98°F as a PointCast measurement/);
});

test('fan pages say desk review, cite sources, and omit priceValidUntil', async () => {
  const [page, historyPage, methodPage] = await Promise.all([
    read('src/pages/reviews/fans.astro'),
    read('src/pages/reviews/fans/history.astro'),
    read('src/pages/reviews/method.astro'),
  ]);
  assert.match(page, /REVIEW LAB · DESK REVIEW/);
  assert.match(page, /Desk review; no hands-on testing/);
  assert.match(page, /The catch\./);
  assert.match(page, /\/reviews\/fans\/history/);
  assert.match(page, /'@type': 'Product'/);
  assert.match(page, /priceCurrency: 'USD'/);
  assert.doesNotMatch(page, /priceValidUntil/);
  assert.doesNotMatch(page, /utm_|amazon\.|amzn\.to/i);
  assert.match(historyPage, /\/reviews\/fans/);
  assert.match(historyPage, /No hands-on testing/);
  assert.match(methodPage, /non-affiliate/i);
  assert.match(methodPage, /Desk review; no hands-on testing/);
});

test('catalog, sitemap, llms, shop, and Front Door block agree', async () => {
  const [catalog, sitemap, llms, llmsFull, shop, blockText, today] = await Promise.all([
    read('src/data/reviews.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/lib/shop-front.ts'),
    read('src/content/blocks/0693.json'),
    read('src/data/new-today.json'),
  ]);
  const block = JSON.parse(blockText);
  assert.match(catalog, /id: 'fans-2026'/);
  assert.match(catalog, /slug: 'fans'/);
  assert.match(catalog, /category: 'Desk review'/);
  assert.match(catalog, /rating: null/);
  assert.match(catalog, /blockId: '0693'/);
  assert.match(sitemap, /pointcast\.xyz\/reviews\/fans'/);
  assert.match(sitemap, /pointcast\.xyz\/reviews\/fans\.json'/);
  assert.match(sitemap, /pointcast\.xyz\/reviews\/fans\/history'/);
  assert.match(sitemap, /pointcast\.xyz\/reviews\/fans\/history\.json'/);
  for (const file of [llms, llmsFull]) {
    assert.match(file, /https:\/\/pointcast\.xyz\/reviews\/fans /);
    assert.match(file, /https:\/\/pointcast\.xyz\/reviews\/fans\.json/);
    assert.match(file, /https:\/\/pointcast\.xyz\/reviews\/fans\/history /);
    assert.match(file, /Desk review; no hands-on testing/);
  }
  assert.match(shop, /guide: 'fans'/);
  assert.equal(block.id, '0693');
  assert.equal(block.channel, 'FD');
  assert.equal(block.external.url, 'https://pointcast.xyz/reviews/fans');
  assert.ok(block.dek.length <= 200);
  assert.match(block.body, /No link, no commission/);
  assert.match(block.body, /has not handled these fans/);
  const strip = JSON.parse(today);
  assert.equal(strip[0].link, '/reviews/fans');
  assert.equal(strip[0].block, '0693');
});
