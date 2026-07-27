import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-ten-modules-arrive.png',
  '02-forty-five-minute-commons.png',
  '03-jet-wave-fire-us.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Beach Commons V6 publishes the $100 module challenge, Stripe path, and interactive score', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v6.astro'),
    read('src/lib/beach-commons-v6.ts'),
  ]);

  assert.match(page, /Everyone brings/);
  assert.match(page, /Contribute \$100 securely with Stripe/);
  assert.match(page, /Jet\. Wave\. Fire/);
  assert.match(page, /window\.AudioContext/);
  assert.match(page, /No recording, tracking, microphone, autoplay/);
  assert.match(data, /people: '10–20 adults'/);
  assert.match(data, /target: '\$1,000/);
  assert.match(data, /BEACH_COMMONS_V6_CHECKOUT_URL|hosted-external/);
  for (const title of ['Ten Modules Arrive', 'The Forty-Five-Minute Commons', 'Jet / Wave / Fire / Us']) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Beach Commons V6 has machine, Block, checkout, thanks, navigation, and discovery surfaces', async () => {
  const [endpoint, checkout, thanks, blockText, sitemap, llms, llmsFull, v5Page] = await Promise.all([
    read('src/pages/beach-commons/v6.json.ts'),
    read('functions/api/beach-commons/v6/checkout.ts'),
    read('src/pages/beach-commons/v6/thanks.astro'),
    read('src/content/blocks/0516.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/beach-commons/v5.astro'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(checkout, /BEACH_COMMONS_V6_CHECKOUT_URL/);
  assert.match(checkout, /buy\.stripe\.com/);
  assert.match(checkout, /Response\.redirect\(target\.toString\(\), 302\)/);
  assert.match(checkout, /checkout-not-configured/);
  assert.match(thanks, /Stripe will send the payment receipt/);
  assert.match(thanks, /noindex, nofollow/);
  assert.equal(block.id, '0516');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.works, 3);
  assert.equal(block.meta.prototypeTargetUsd, 1000);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v6');
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v6'/);
  assert.match(llms, /PointCast Field Study 006/);
  assert.match(llmsFull, /The \$100 Fire-Ring Commons/);
  assert.match(v5Page, /href="\/beach-commons\/v6"/);
});

test('V6 keeps contribution, permit, fire, access, and habitat boundaries explicit', async () => {
  const [data, blockText, page] = await Promise.all([
    read('src/lib/beach-commons-v6.ts'),
    read('src/content/blocks/0516.json'),
    read('src/pages/beach-commons/v6.astro'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /not a ticket, reservation, charitable donation, tax-deductible gift/);
  assert.match(data, /existing official fire ring/);
  assert.match(data, /bike path, shoreline passage, emergency access/);
  assert.match(data, /No public event date is announced/);
  assert.match(block.meta.paymentBoundary, /not ticket/);
  assert.match(block.meta.eventBoundary, /required LA County clearance/);
  assert.match(page, /no later than three weeks/);
  assert.match(page, /Official permit page/);
});

test('Beach Commons V6 image and social assets have intended dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v6/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  const cardUrl = new URL('../public/images/og/beach-commons-v6.png', import.meta.url);
  await access(cardUrl);
  const cardSize = pngSize(await readFile(cardUrl));

  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));
  assert.deepEqual(cardSize, { width: 1200, height: 630 });
});
