import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test("Today's Art is a provenance-forward 14-work edit with separate Reve ad proofs", async () => {
  const [page, manifest, homeEdit] = await Promise.all([
    readFile(new URL('src/components/gallery/PositiveIndexEdition.astro', root), 'utf8'),
    readFile(new URL('src/lib/todays-gallery.ts', root), 'utf8'),
    readFile(new URL('src/components/TodaysArt.astro', root), 'utf8'),
  ]);

  assert.match(page, /14 WORKS · 3 ART TOOLS · 1 HUMAN EDIT/);
  assert.match(page, /ROOM 01 \/ MIDJOURNEY \/ FRESH TODAY/);
  assert.match(page, /ROOM 02 \/ IDEOGRAM PROFILE DEEP DIVE/);
  assert.match(page, /ROOM 03 \/ IMAGEAPP\.XYZ \/ PRESERVED PROFILE EXPORT/);
  assert.match(page, /CAMPAIGN DESK \/ REVE \/ HOUSE ADS/);
  assert.match(page, /Curated and published does not mean minted/i);
  assert.match(manifest, /pointcast\.gallery\.edit\.v1/);
  assert.match(manifest, /Site Maintenance/);
  assert.match(manifest, /not counted in the 14 artwork total/);
  assert.match(homeEdit, /\/gallery\/today/);
  assert.doesNotMatch(homeEdit, /\/images\/ads\/positive-index/);
});

test('the selected original files are present in the source tree', async () => {
  const files = [
    'src/assets/todays-art/2026-07-21/midjourney/bicycle-repair-shrine.webp',
    'src/assets/todays-art/2026-07-21/midjourney/neighborhood-star-map.webp',
    'src/assets/todays-art/2026-07-21/ideogram/abundance-flows-01.webp',
    'src/assets/todays-art/2026-07-21/ideogram/abundance-flows-04.webp',
    'src/assets/todays-art/imageapp/money-ocean.png',
    'src/assets/todays-art/imageapp/so-tired.png',
    'src/assets/todays-art/2026-07-21/reve/the-positive-index.webp',
    'src/assets/todays-art/2026-07-21/reve/small-public-miracle.webp',
    'src/assets/todays-art/2026-07-21/reve/abundance-flows.webp',
  ];
  await Promise.all(files.map((file) => access(new URL(file, root))));
});

test('gallery and ad receipts are in priority discovery', async () => {
  const [sitemap, llms] = await Promise.all([
    readFile(new URL('src/pages/sitemap-discovery.xml.ts', root), 'utf8'),
    readFile(new URL('public/llms.txt', root), 'utf8'),
  ]);
  assert.match(sitemap, /pointcast\.xyz\/gallery\/today/);
  assert.match(sitemap, /pointcast\.xyz\/ads\.json/);
  assert.match(llms, /Today's Art edit/);
  assert.match(llms, /open-ad desk/);
});

test('v2 keeps a permanent human and JSON edition spine as the daily edit advances', async () => {
  const [page, json, plan] = await Promise.all([
    readFile(new URL('src/pages/gallery/editions.astro', root), 'utf8'),
    readFile(new URL('src/pages/gallery/editions.json.ts', root), 'utf8'),
    readFile(new URL('docs/plans/2026-07-20-todays-art-v2.md', root), 'utf8'),
  ]);
  assert.match(page, /Today,<br \/><i>kept\.<\/i>/);
  assert.match(json, /pointcast\.gallery\.editions\.v1/);
  assert.match(json, /count: 3/);
  assert.match(json, /workCount: todaysGalleryManifest\.workCount/);
  assert.match(json, /workCount: 14/);
  assert.match(json, /workCount: 28/);
  assert.match(plan, /Slice B — data-driven renderer/);
  assert.match(plan, /No private wallet material/);
});

test('the Reve campaign is a labeled contextual house-ad rotation', async () => {
  const [network, rail, desk] = await Promise.all([
    readFile(new URL('src/lib/open-ad-network.ts', root), 'utf8'),
    readFile(new URL('src/components/OpenAdRail.astro', root), 'utf8'),
    readFile(new URL('src/pages/ads.astro', root), 'utf8'),
  ]);
  assert.match(network, /PC-HOUSE-007/);
  assert.match(network, /PC-HOUSE-008/);
  assert.match(network, /PC-HOUSE-009/);
  assert.match(network, /sourceTool: 'Reve'/);
  assert.match(rail, /HOUSE AD/);
  assert.match(rail, /ad\.image/);
  assert.match(desk, /POINTCAST_ADS\.length/);
});
