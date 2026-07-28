import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Beach Commons V7 publishes a researched product desk and interactive carts', async () => {
  const [page, data, endpoint] = await Promise.all([
    read('src/pages/beach-commons/v7.astro'),
    read('src/lib/beach-commons-v7.ts'),
    read('src/pages/beach-commons/v7.json.ts'),
  ]);

  assert.match(page, /The Beach/);
  assert.match(page, /Utility Index/);
  assert.match(page, /Buy a beach day that can put itself away/);
  assert.match(page, /data-cart-console/);
  assert.match(page, /data-copy-cart/);
  assert.match(page, /data-filter/);
  assert.match(page, /navigator\.clipboard/);
  assert.match(data, /Twenty-five useful things/);
  assert.match(data, /The \$98\.95 IKEA Commons/);
  assert.match(data, /The Exact \$100 Seat Module/);
  assert.match(data, /The \$94\.89 Two-Flask Coffee Dock/);
  assert.match(endpoint, /affiliateTracked: false/);
  assert.match(endpoint, /handsOnTestedByPointCast: false/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
});

test('V7 keeps affiliate, editorial, price, permit, fire, shelter, and access boundaries explicit', async () => {
  const [page, data, blockText] = await Promise.all([
    read('src/pages/beach-commons/v7.astro'),
    read('src/lib/beach-commons-v7.ts'),
    read('src/content/blocks/0518.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /PointCast earns \$0/);
  assert.match(data, /plain direct merchant link/);
  assert.match(data, /not affiliated with, commissioned by, or presented as New York Magazine or The Strategist/);
  assert.match(data, /Prices are editorial snapshots/);
  assert.match(data, /shopping and coordination prototype, not an announced or permitted event/);
  assert.match(page, /Portable fire pits/);
  assert.match(page, /Overnight tents: beach camping is prohibited/);
  assert.match(page, /Use the access that already exists/);
  assert.equal(block.id, '0518');
  assert.equal(block.meta.products, 25);
  assert.equal(block.meta.computedCarts, 8);
  assert.equal(block.meta.affiliateRevenueStatus, 'zero; all links plain and direct');
});

test('V7 has Block, discovery, llms, press, and previous-edition navigation surfaces', async () => {
  const [sitemap, llms, llmsFull, press, v6] = await Promise.all([
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/data/press-releases.json'),
    read('src/pages/beach-commons/v6.astro'),
  ]);

  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v7'/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v7\.json'/);
  assert.match(llms, /PointCast Field Study 007/);
  assert.match(llmsFull, /The Beach Utility Index/);
  assert.match(press, /beach-commons-v7-opens-2026-beach-utility-index/);
  assert.match(v6, /href="\/beach-commons\/v7"/);
});

test('V7 cart arithmetic matches the published labels', async () => {
  const data = await read('src/lib/beach-commons-v7.ts');
  const prices = new Map(
    [...data.matchAll(/\n  \{\n    id: '([^']+)',[\s\S]*?priceUsd: ([0-9.]+),/g)]
      .map((match) => [match[1], Number(match[2])]),
  );

  const expected = new Map([
    ['blue-bag-commons', 98.95],
    ['four-stools', 100],
    ['coffee-dock', 94.89],
    ['ground-truth', 106.47],
    ['low-light', 84.94],
    ['fire-backup', 66.83],
    ['pack-out', 135.89],
    ['shared-shade', 279.99],
  ]);

  for (const [cartId, total] of expected) {
    const cartPattern = new RegExp(`id: '${cartId}',[\\s\\S]*?productIds: \\[([\\s\\S]*?)\\],\\n    note:`);
    const body = data.match(cartPattern)?.[1] ?? '';
    const actual = [...body.matchAll(/\{ id: '([^']+)', quantity: ([0-9]+) \}/g)]
      .reduce((sum, match) => sum + (prices.get(match[1]) ?? 0) * Number(match[2]), 0);
    assert.equal(Number(actual.toFixed(2)), total, `${cartId} total`);
  }
});
