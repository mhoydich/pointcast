import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-billion-little-new-yorkers.png',
  '02-two-scoreboards.png',
  '03-el-segundo-radius.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('The Billion Little New Yorkers gives Billion Oyster Project a three-part verdict', async () => {
  const [page, data, endpoint] = await Promise.all([
    read('src/pages/beach-commons/v16.astro'),
    read('src/lib/beach-commons-v16.ts'),
    read('src/pages/beach-commons/v16.json.ts'),
  ]);

  assert.match(page, /Yes, it worked\. No, the slogan has not come true\./);
  assert.match(page, /As a civic institution, it is a knockout\./);
  assert.match(page, /Oysters are not a municipal alibi\./);
  assert.match(data, /150M/);
  assert.match(data, /5\.8M/);
  assert.match(endpoint, /natural recruitment remains uneven/);
  assert.match(endpoint, /wastewater treatment, stormwater systems, overflow control/);
});

test('the edition publishes two independent scoreboards', async () => {
  const [page, data, endpoint] = await Promise.all([
    read('src/pages/beach-commons/v16.astro'),
    read('src/lib/beach-commons-v16.ts'),
    read('src/pages/beach-commons/v16.json.ts'),
  ]);

  assert.match(page, /Every restoration commons needs two scoreboards\./);
  assert.match(data, /Does the human commons reproduce\?/);
  assert.match(data, /Does the living system reproduce\?/);
  assert.match(data, /Yes—convincingly\./);
  assert.match(data, /Promising, local, unfinished\./);
  assert.match(endpoint, /twoScoreboards/);
});

test('the El Segundo radius desk filters eight current independent resources without writing data', async () => {
  const [page, data, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v16.astro'),
    read('src/lib/beach-commons-v16.ts'),
    read('src/pages/beach-commons/v16.json.ts'),
    read('src/content/blocks/0544.json'),
  ]);
  const block = JSON.parse(blockText);

  for (const organization of [
    'Los Angeles County Beaches & Harbors',
    'The Bay Foundation · LAX Dunes',
    'City of El Segundo · Hyperion information',
    'Roundhouse Aquarium',
    'Friends of Ballona Wetlands',
    'Los Angeles Waterkeeper',
    'AltaSea · LA Waterfront STEM Network',
    'Cabrillo Marine Aquarium',
  ]) {
    assert.match(data, new RegExp(organization.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(page, /data-radius="near"/);
  assert.match(page, /data-work="habitat"/);
  assert.match(page, /aria-live="polite"/);
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
  assert.doesNotMatch(page, /\bfetch\(/);
  assert.match(endpoint, /storage: false/);
  assert.match(endpoint, /networkWrites: false/);
  assert.match(endpoint, /geolocation: false/);
  assert.equal(block.meta.radiusResources, 8);
  assert.equal(block.meta.networkWrites, false);
});

test('V16 includes two created Spotify companions and declares the 40-pin Pinterest package', async () => {
  const [page, data, blockText] = await Promise.all([
    read('src/pages/beach-commons/v16.astro'),
    read('src/lib/beach-commons-v16.ts'),
    read('src/content/blocks/0544.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /spotify:playlist|open\.spotify\.com\/playlist\/3Rv5BAIFyOpcOtTW5kFUdZ/);
  assert.match(data, /open\.spotify\.com\/playlist\/5hs7CoajyoNu135rQjk4BO/);
  assert.match(page, /Two listening rooms/);
  assert.match(page, /Forty field pins, evenly split\./);
  assert.match(data, /pinterest\.com\/hoydich\/living-reefs-billion-little-new-yorkers/);
  assert.match(data, /pinterest\.com\/hoydich\/25-miles-of-pacific-el-segundo-commons/);
  assert.equal(block.meta.spotifyPlaylists, 2);
  assert.equal(block.meta.pinterestBoards, 2);
  assert.equal(block.meta.pinterestPins, 40);
});

test('V16 keeps activity, place, reporting, and affiliation boundaries explicit', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v16.astro'),
    read('src/pages/beach-commons/v16.json.ts'),
    read('src/content/blocks/0544.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /No habitat work,\s+event, volunteer shift, partnership, permit/);
  assert.match(endpoint, /institutional method, not oyster habitat/);
  assert.match(endpoint, /No organization, agency, school, aquarium, nonprofit/);
  assert.match(endpoint, /No collection, planting, monitoring protocol, habitat intervention/);
  assert.match(block.meta.activityBoundary, /no restoration project, habitat work, collection/);
});

test('V16 has JSON, Block, series, homepage, and discovery twins', async () => {
  const [endpoint, blockText, series, sitemap, llms, llmsFull, homepage, homeEdition, homeRack] =
    await Promise.all([
      read('src/pages/beach-commons/v16.json.ts'),
      read('src/content/blocks/0544.json'),
      read('src/lib/beach-commons-series.ts'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('src/pages/index.astro'),
      read('src/components/HomeNewEdition.astro'),
      read('src/components/HomeMagazineRack.astro'),
    ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0544');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.visualPlates, 3);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v16');
  assert.match(series, /edition: 16/);
  assert.match(series, /blockId: '0544'/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v16'/);
  assert.match(llms, /PointCast Field Study 016/);
  assert.match(llmsFull, /THE BILLION LITTLE NEW YORKERS/);
  assert.match(homeEdition, /href: '\/beach-commons\/v16'/);
  assert.match(homeEdition, /id: '0544'/);
  // front door rebuilt 2026-09-01: index.astro shelves V16 as a Beach Commons chip; the
  // "All eighteen …" link now renders from HomeMagazineRack, which index.astro imports.
  assert.match(homepage, /href: '\/beach-commons\/v16'/);
  assert.match(homepage, /HomeMagazineRack/);
  assert.match(homeRack, /All eighteen Beach Commons editions/);
});

test('V16 images have intended edition and social dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v16/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));

  const socialUrl = new URL('../public/images/og/b/0544.png', import.meta.url);
  await access(socialUrl);
  assert.deepEqual(pngSize(await readFile(socialUrl)), { width: 1200, height: 630 });
});
