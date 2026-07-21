import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
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
  assert.equal((registry.match(/id: 'PC-DRUM-\d{3}'/g) || []).length, 6);
  assert.equal((registry.match(/id: 'PC-DRUM-UNIVERSE-001'/g) || []).length, 1);
  assert.equal((registry.match(/sourceTool: 'Reve'/g) || []).length, 3);
  assert.equal((registry.match(/image: reve[A-Z][A-Za-z]+\.src/g) || []).length, 3);
  assert.match(registry, /tracking: 'none'/);
  assert.match(registry, /settlement: 'prototype'/);
  assert.match(component, /NO BEHAVIORAL PROFILE/);
  assert.match(component, /WALLET SETTLEMENT ARE NOT LIVE YET/);
  assert.match(receipt, /OPEN_AD_PLACEMENT/);
  assert.match(receipt, /DRUM_COMPENDIUM_CAMPAIGN/);
  assert.match(receipt, /DRUM_NOUN_UNIVERSE_CAMPAIGN/);
});

test('Drum Noun Universe is featured on home and guaranteed across other public pages', async () => {
  const [registry, home, homeAd, rail] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/pages/index.astro', root), 'utf8'),
    readFile(new URL('src/components/DrumNounUniverseAd.astro', root), 'utf8'),
    readFile(new URL('src/components/OpenAdRail.astro', root), 'utf8'),
  ]);

  assert.match(registry, /PC-DRUM-NOUN-UNIVERSE-2026/);
  assert.match(registry, /Featured homepage unit and contextual placement across public non-Drum pages/);
  assert.match(registry, /return \[universeCreative, \.\.\.companionAds\]\.slice/);
  assert.match(home, /<DrumNounUniverseAd\s*\/>/);
  assert.match(homeAd, /data-ad-record=\{ad\.id\}/);
  assert.match(homeAd, /NO BEHAVIORAL PROFILE · NO PAID MEDIA/);
  assert.match(rail, /DRUM_NOUN_UNIVERSE_CAMPAIGN/);
});

test('Drum Compendium gets one coherent PointCast house series across every route', async () => {
  const [registry, component, desk] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/components/OpenAdRail.astro', root), 'utf8'),
    readFile(new URL('src/pages/ads.astro', root), 'utf8'),
  ]);

  assert.match(registry, /PC-DRUM-COMPENDIUM-2026/);
  assert.match(registry, /A six-part PointCast house campaign distributed by URL context/);
  assert.match(registry, /const isDrumSurface/);
  assert.match(registry, /ad\.campaign === DRUM_COMPENDIUM_CAMPAIGN\.id/);
  assert.match(component, /DrumCompendiumAdArt/);
  assert.match(component, /POINTCAST HOUSE SERIES · DRUM COMPENDIUM/);
  assert.match(desk, /One compendium\./);

  const pagesDir = new URL('src/pages/', root);
  const drumPages = (await readdir(pagesDir))
    .filter((name) => /^drum.*\.astro$/.test(name));
  assert.ok(drumPages.length >= 100, `expected the full drum compendium, found ${drumPages.length} routes`);

  for (const name of drumPages) {
    const source = await readFile(new URL(name, pagesDir), 'utf8');
    const inheritsSharedRail = /import (?:Base|Block|Drum|Sparrow)Layout from '\.\.\/layouts\//.test(source);
    const rendersRailDirectly = /import OpenAdRail/.test(source) && /<OpenAdRail\s*\/>/.test(source);
    assert.ok(inheritsSharedRail || rendersRailDirectly, `${name} does not render the shared ad rail`);
  }
});

test('Post Office opens with a flowing latest-across-the-wire strip', async () => {
  const press = await readFile(new URL('src/pages/press.astro', root), 'utf8');
  assert.match(press, /POST OFFICE · SIGNAL DESK/);
  assert.match(press, /post-office-wire-flow/);
  assert.match(press, /wireLatest/);
  assert.match(press, /prefers-reduced-motion/);
});
