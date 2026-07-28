import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Beach Commons V8 publishes photographed blanket reviews and computed systems', async () => {
  const [page, data, endpoint] = await Promise.all([
    read('src/pages/beach-commons/v8.astro'),
    read('src/lib/beach-commons-v8.ts'),
    read('src/pages/beach-commons/v8.json.ts'),
  ]);

  assert.match(page, /The Beach/);
  assert.match(page, /Blanket Review/);
  assert.match(page, /data-system-console/);
  assert.match(page, /data-copy-system/);
  assert.match(page, /data-filter/);
  assert.match(page, /Compare the physics/);
  assert.match(page, /No PointCast code yet/);
  assert.match(data, /The exact sand kit/);
  assert.match(data, /The four-blanket color field/);
  assert.match(data, /The sunset stack/);
  assert.match(endpoint, /affiliateTracked: false/);
  assert.match(endpoint, /handsOnTestedByPointCast: false/);
  assert.match(endpoint, /photography/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
});

test('V8 publishes twelve optimized product photographs with credits and source URLs', async () => {
  const data = await read('src/lib/beach-commons-v8.ts');
  const images = [...data.matchAll(/image: '(\/beach-commons\/v8\/products\/[^']+)'/g)]
    .map((match) => match[1]);

  assert.equal(images.length, 12);
  assert.equal(new Set(images).size, 12);
  assert.equal((data.match(/imageSource: 'https:\/\//g) ?? []).length, 12);
  assert.equal((data.match(/imageCredit: 'Product photograph:/g) ?? []).length, 12);

  await Promise.all(images.map((image) => access(new URL(`public${image}`, root))));
});

test('V8 keeps affiliate, promotion, image, test, price, and event boundaries explicit', async () => {
  const [page, data, blockText] = await Promise.all([
    read('src/pages/beach-commons/v8.astro'),
    read('src/lib/beach-commons-v8.ts'),
    read('src/content/blocks/0521.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /PointCast is not enrolled/);
  assert.match(data, /earns \$0/);
  assert.match(data, /no referral, campaign, or affiliate parameters/);
  assert.match(data, /not PointCast product photography/);
  assert.match(data, /no merchant paid, supplied samples, reviewed copy, or determined placement/);
  assert.match(data, /unofficial shopping and coordination prototype/);
  assert.match(page, /merchant offers/i);
  assert.match(page, /No blanket is fire protection/);
  assert.equal(block.id, '0521');
  assert.equal(block.meta.products, 12);
  assert.equal(block.meta.productPhotographs, 12);
  assert.equal(block.meta.computedSystems, 7);
  assert.equal(block.meta.pointcastAffiliateCodes, 0);
});

test('V8 has Block, discovery, llms, press, and previous-edition navigation surfaces', async () => {
  const [sitemap, llms, llmsFull, press, v7] = await Promise.all([
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/data/press-releases.json'),
    read('src/pages/beach-commons/v7.astro'),
  ]);

  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v8'/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v8\.json'/);
  assert.match(llms, /PointCast Field Study 008/);
  assert.match(llmsFull, /The Beach Blanket Review/);
  assert.match(press, /beach-commons-v8-publishes-beach-blanket-review/);
  assert.match(v7, /href="\/beach-commons\/v8"/);
});

test('V8 system arithmetic matches the published labels', async () => {
  const data = await read('src/lib/beach-commons-v8.ts');
  const prices = new Map(
    [...data.matchAll(/\n  \{\n    id: '([^']+)',[\s\S]*?priceUsd: ([0-9.]+),/g)]
      .map((match) => [match[1], Number(match[2])]),
  );
  const expected = new Map([
    ['ikea-layer-lab', 99.96],
    ['exact-sand-kit', 99.99],
    ['warm-dry', 124.9],
    ['engineered-pair', 149.95],
    ['cotton-square', 140],
    ['graphic-room', 229],
    ['yeti-single', 200],
  ]);

  for (const [systemId, total] of expected) {
    const pattern = new RegExp(`id: '${systemId}',[\\s\\S]*?lines: \\[([\\s\\S]*?)\\],\\n    assignment:`);
    const body = data.match(pattern)?.[1] ?? '';
    const actual = [...body.matchAll(/\{ id: '([^']+)', quantity: ([0-9]+) \}/g)]
      .reduce((sum, match) => sum + (prices.get(match[1]) ?? 0) * Number(match[2]), 0);
    assert.equal(Number(actual.toFixed(2)), total, `${systemId} total`);
  }
});
