import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test("Today's Art is a provenance-forward 28-work, three-tool edit", async () => {
  const [page, manifest, homeEdit] = await Promise.all([
    readFile(new URL('src/pages/gallery/today.astro', root), 'utf8'),
    readFile(new URL('src/lib/todays-gallery.ts', root), 'utf8'),
    readFile(new URL('src/components/TodaysArt.astro', root), 'utf8'),
  ]);

  assert.match(page, /28 WORKS · 3 TOOLS · 1 ARTIST/);
  assert.match(page, /ROOM 01 \/ NOW/);
  assert.match(page, /ROOM 02 \/ MIDJOURNEY DEEP CUT/);
  assert.match(page, /ROOM 03 \/ IDEOGRAM PROFILE DEEP CUT/);
  assert.match(page, /ROOM 04 \/ IMAGEAPP\.XYZ/);
  assert.match(page, /No work in this edit is represented as minted/i);
  assert.match(manifest, /pointcast\.gallery\.edit\.v1/);
  assert.match(manifest, /maintenance mode/);
  assert.match(homeEdit, /\/gallery\/today/);
});

test('the selected original files are present in the source tree', async () => {
  const files = [
    'src/assets/todays-art/2026-07-20-signal-garden.png',
    'src/assets/todays-art/2026-07-20-flower-field-04.png',
    'src/assets/todays-art/ideogram/everything-is-possible-01.webp',
    'src/assets/todays-art/ideogram/everything-is-possible-10.webp',
    'src/assets/todays-art/imageapp/money-ocean.png',
    'src/assets/todays-art/imageapp/so-tired.png',
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
