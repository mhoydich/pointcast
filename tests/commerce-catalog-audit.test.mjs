import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
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
