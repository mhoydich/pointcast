import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('all public layout families render the shared open-ad rail', async () => {
  const layouts = await Promise.all([
    'BaseLayout.astro',
    'BlockLayout.astro',
    'DrumLayout.astro',
    'SparrowLayout.astro',
  ].map((name) => readFile(new URL(`src/layouts/${name}`, root), 'utf8')));

  for (const layout of layouts) {
    assert.match(layout, /import OpenAdRail/);
    assert.match(layout, /<OpenAdRail\s*\/>/);
  }
});

test('ad inventory is contextual, transparent, and does not claim live settlement', async () => {
  const [registry, component, receipt] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/components/OpenAdRail.astro', root), 'utf8'),
    readFile(new URL('src/pages/ads.json.ts', root), 'utf8'),
  ]);

  assert.equal((registry.match(/id: 'PC-HOUSE-/g) || []).length, 9);
  assert.equal((registry.match(/sourceTool: 'Reve'/g) || []).length, 3);
  assert.equal((registry.match(/image: reve[A-Z][A-Za-z]+\.src/g) || []).length, 3);
  assert.match(registry, /tracking: 'none'/);
  assert.match(registry, /settlement: 'prototype'/);
  assert.match(component, /NO BEHAVIORAL PROFILE/);
  assert.match(component, /WALLET SETTLEMENT ARE NOT LIVE YET/);
  assert.match(receipt, /OPEN_AD_PLACEMENT/);
});

test('Post Office opens with a flowing latest-across-the-wire strip', async () => {
  const press = await readFile(new URL('src/pages/press.astro', root), 'utf8');
  assert.match(press, /POST OFFICE · SIGNAL DESK/);
  assert.match(press, /post-office-wire-flow/);
  assert.match(press, /wireLatest/);
  assert.match(press, /prefers-reduced-motion/);
});
