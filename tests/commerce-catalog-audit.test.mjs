import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const auditScript = path.resolve('scripts/audit-commerce-catalog.mjs');

test('Shopify-hosted merch stays hidden until it is in stock', async () => {
  const productsDir = await mkdtemp(path.join(tmpdir(), 'pointcast-commerce-audit-'));

  try {
    await writeFile(path.join(productsDir, 'vendor-neutral-merch.json'), JSON.stringify({
      slug: 'vendor-neutral-merch',
      name: 'Vendor Neutral Merch',
      brand: 'Independent Printer',
      url: 'https://pointcast-store.myshopify.com/products/vendor-neutral-merch',
      availability: 'out-of-stock',
    }));

    const result = spawnSync(process.execPath, [auditScript], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, COMMERCE_PRODUCTS_DIR: productsDir },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /0 public products, 1 hidden product/);
  } finally {
    await rm(productsDir, { recursive: true, force: true });
  }
});

test('static deployment headers keep commerce feeds CORS-open', async () => {
  const headers = await readFile('public/_headers', 'utf8');
  const routes = [
    '/shop.json',
    '/products.json',
    '/products/*.json',
    '/pairings.json',
    '/pairings/*.json',
    '/api/products.jsonl',
  ];

  for (const route of routes) {
    const start = headers.indexOf(`\n${route}\n`);
    assert.notEqual(start, -1, `${route} must have a static header rule`);
    const nextRoute = headers.indexOf('\n/', start + 2);
    const rule = headers.slice(start, nextRoute === -1 ? undefined : nextRoute);
    assert.match(rule, /Access-Control-Allow-Origin: \*/);
    assert.match(rule, /Cache-Control: public, max-age=60, s-maxage=300/);
  }
});

test('agent-readable product feeds expose a consistent outbound link map', async () => {
  const routes = [
    'src/pages/products.json.ts',
    'src/pages/products/[slug].json.ts',
    'src/pages/api/products.jsonl.ts',
    'src/pages/shop.json.ts',
    'src/pages/pairings/[mood].json.ts',
  ];

  for (const route of routes) {
    const source = await readFile(route, 'utf8');
    assert.match(source, /productLinks/);
    assert.match(source, /links,/);
  }

  const commerce = await readFile('src/lib/commerce.ts', 'utf8');
  assert.match(commerce, /self: `\$\{html\}\.json`/);
  assert.match(commerce, /catalog: 'https:\/\/pointcast\.xyz\/products\.json'/);
  assert.match(commerce, /shop: 'https:\/\/pointcast\.xyz\/shop\.json'/);
  assert.match(commerce, /checkout: checkoutUrl/);
});
