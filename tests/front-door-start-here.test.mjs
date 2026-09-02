import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the front door orients a first-time visitor and recycles the back catalog', async () => {
  const [home, start, catalog] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeStartHere.astro'),
    read('src/components/HomeBackCatalog.astro'),
  ]);
  assert.match(home, /<HomeStartHere blockCount=\{blockCount\} \/>/);
  assert.match(home, /<HomeBackCatalog pool=\{catalogPool\} total=\{blockCount\} \/>/);
  // front door rebuilt 2026-09-01: the dated edition modules (Second Shift, Ocean Drum,
  // Wednesday) became doors in the magazine rack and the drum house. Start Here still
  // leads those shelves, and the demoted editions stay present as hrefs.
  assert.match(home, /<HomeStartHere[\s\S]*<HomeMagazineRack[\s\S]*<HomeDrumUniverse/);
  for (const href of ['/second-shift', '/drum', '/wednesday']) {
    assert.match(home, new RegExp(`href: '${href}'`));
  }
  // Six evergreen doors, all long-lived rooms.
  for (const href of ['/coffee', '/window', '/race', '/bell-choir', '/win95-games', '/drum']) {
    assert.match(start, new RegExp(`href: '${href}'`));
  }
  assert.match(start, /noun\.pics\//);
  assert.match(home, /<HomeScoreboard \/>/);
  // Back catalog: 30+ days old, no Cola flood, deterministic daily deal.
  assert.match(home, /CATALOG_MIN_AGE_MS = 30 \* 24/);
  assert.match(home, /Nouns Cola poster/);
  assert.match(catalog, /data-back-catalog-shuffle/);
  assert.match(catalog, /0x811c9dc5/);
  assert.match(catalog, /timeZone: 'America\/Los_Angeles'/);
});
