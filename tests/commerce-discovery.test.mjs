import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../src/pages/sitemap-discovery.xml.ts', import.meta.url), 'utf8');
const productDetail = await readFile(new URL('../src/pages/products/[slug].astro', import.meta.url), 'utf8');
const productJson = await readFile(new URL('../src/pages/products/[slug].json.ts', import.meta.url), 'utf8');
const pairingDetail = await readFile(new URL('../src/pages/pairings/[mood].astro', import.meta.url), 'utf8');
const pairingJson = await readFile(new URL('../src/pages/pairings/[mood].json.ts', import.meta.url), 'utf8');
const productsJson = await readFile(new URL('../src/pages/products.json.ts', import.meta.url), 'utf8');
const productsJsonl = await readFile(new URL('../src/pages/api/products.jsonl.ts', import.meta.url), 'utf8');
const shopJson = await readFile(new URL('../src/pages/shop.json.ts', import.meta.url), 'utf8');
const agentsManifest = await readFile(new URL('../src/pages/agents.json.ts', import.meta.url), 'utf8');
const forAgents = await readFile(new URL('../src/pages/for-agents.astro', import.meta.url), 'utf8');
const commercePages = await Promise.all([
  '../src/pages/shop.astro',
  '../src/pages/products/[slug].astro',
  '../src/pages/pairings/[mood].astro',
].map(async (path) => [path, await readFile(new URL(path, import.meta.url), 'utf8')]));

test('every crawler group can reach public JSONL feeds', () => {
  const groups = robots.trim().split(/\n\s*\n/).filter((group) => group.startsWith('User-agent:'));
  assert.ok(groups.length > 1, 'expected named crawler groups');

  for (const group of groups) {
    const agent = group.match(/^User-agent:\s*(.+)$/m)?.[1];
    assert.match(group, /^Allow: \/api\/products\.jsonl$/m, `${agent} must allow the commerce feed`);
    assert.match(group, /^Allow: \/api\/blocks\.jsonl$/m, `${agent} must allow the blocks feed`);
    assert.match(group, /^Disallow: \/api\/$/m, `${agent} must keep other API routes private`);
  }
});

test('discovery sitemap advertises the public JSONL feeds', () => {
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/api\/products\.jsonl/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/api\/blocks\.jsonl/);
});

test('product detail pages expose discoverable per-product JSON', () => {
  assert.match(productDetail, /href: `\/products\/\$\{d\.slug\}\.json`/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/products\/\$\{data\.slug\}\.json/);
  assert.match(productJson, /isPublicProduct\(data\)/);
  assert.match(productJson, /checkoutPolicy: CHECKOUT_POLICY/);
  assert.match(productJson, /'Access-Control-Allow-Origin': '\*'/);
});

test('agent entry points advertise aggregate and per-product commerce JSON', () => {
  assert.match(agentsManifest, /productsJsonl: 'https:\/\/pointcast\.xyz\/api\/products\.jsonl'/);
  assert.match(agentsManifest, /productDetailTemplate: 'https:\/\/pointcast\.xyz\/products\/\{slug\}\.json'/);
  assert.match(forAgents, /<code>\/products\/\{'\{slug\}'\}\.json<\/code>/);
});

test('pairing pages expose public machine-readable companions', () => {
  assert.match(pairingDetail, /href: `\/pairings\/\$\{mood\}\.json`/);
  assert.match(pairingDetail, /href=\{`\/pairings\/\$\{mood\}\.json`\}/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/pairings\/\$\{mood\}\.json/);
  assert.match(pairingJson, /isPublicProduct\(data\)/);
  assert.match(pairingJson, /checkoutPolicy: CHECKOUT_POLICY/);
  assert.match(pairingJson, /'Access-Control-Allow-Origin': '\*'/);
});

test('outbound product checkout links are marked sponsored', () => {
  for (const [path, page] of commercePages) {
    const checkoutLinks = page.match(/<a\b[^>]*href=\{(?:product\.data|p\.data|d)\.url\}[^>]*>/g) ?? [];
    assert.ok(checkoutLinks.length > 0, `${path} must expose a product checkout link`);

    for (const link of checkoutLinks) {
      assert.match(link, /target="_blank"/, `${path} checkout must open on the merchant site`);
      assert.match(link, /rel="[^"]*\bnoopener\b[^"]*"/, `${path} checkout must isolate the opener`);
      assert.match(link, /rel="[^"]*\bsponsored\b[^"]*"/, `${path} checkout must identify the commercial relationship`);
    }
  }
});

test('commerce JSON surfaces expose the shared outbound checkout contract', () => {
  for (const [path, source] of [
    ['products.json', productsJson],
    ['products.jsonl', productsJsonl],
    ['product detail JSON', productJson],
    ['shop.json', shopJson],
    ['pairing JSON', pairingJson],
  ]) {
    assert.match(source, /checkout: outboundCheckout\(/, `${path} must expose explicit checkout routing`);
  }
});

test('catalog feeds expose merchant-backed freshness timestamps', () => {
  assert.match(productsJson, /catalogUpdatedAt: catalogUpdatedAt\(products\)/);
  assert.match(shopJson, /catalogUpdatedAt: catalogUpdatedAt\(products\)/);
  assert.match(productsJson, /updatedAt: \(p\.data\.updatedAt \?\? p\.data\.addedAt\)\.toISOString\(\)/);
  assert.match(productsJsonl, /updatedAt: \(p\.data\.updatedAt \?\? p\.data\.addedAt\)\.toISOString\(\)/);
  assert.match(productJson, /updatedAt: \(data\.updatedAt \?\? data\.addedAt\)\.toISOString\(\)/);
});
