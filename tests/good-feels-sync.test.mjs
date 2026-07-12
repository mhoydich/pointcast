import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const product = {
  id: 42,
  handle: 'fresh-seltzer',
  title: 'Fresh Seltzer',
  vendor: 'Good Feels',
  product_type: 'THC Seltzer',
  body_html: '<p>A bright test pour.</p>',
  published_at: '2026-07-12T12:00:00Z',
  variants: [{ price: '12.00', available: true }],
  images: [{ src: 'https://cdn.example/fresh.jpg' }],
  tags: [],
};

function dryRun(outDir) {
  const source = `data:application/json,${encodeURIComponent(JSON.stringify({ products: [product] }))}`;
  return spawnSync(process.execPath, [
    'scripts/sync-good-feels-products.mjs',
    '--dry-run',
    '--out', outDir,
  ], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, GOOD_FEELS_PRODUCTS_URL: source },
    encoding: 'utf8',
  });
}

test('Good Feels dry-run reports local catalog freshness without writing', async () => {
  const outDir = await mkdtemp(path.join(tmpdir(), 'pointcast-good-feels-'));
  const first = dryRun(outDir);
  assert.equal(first.status, 0, first.stderr);
  const firstPayload = JSON.parse(first.stdout);
  assert.deepEqual(firstPayload.changes.added, ['fresh-seltzer']);
  assert.equal(firstPayload.changes.isFresh, false);

  await writeFile(
    path.join(outDir, 'fresh-seltzer.json'),
    `${JSON.stringify(firstPayload.products[0], null, 2)}\n`,
  );
  await writeFile(
    path.join(outDir, 'retired.json'),
    `${JSON.stringify({ slug: 'retired', brand: 'Good Feels', url: 'https://getgoodfeels.com/products/retired' })}\n`,
  );

  const second = dryRun(outDir);
  assert.equal(second.status, 0, second.stderr);
  const secondPayload = JSON.parse(second.stdout);
  assert.deepEqual(secondPayload.changes.unchanged, ['fresh-seltzer']);
  assert.deepEqual(secondPayload.changes.stale, ['retired']);
  assert.equal(secondPayload.changes.isFresh, false);
});
