import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-the-hardpoint.png',
  '02-common-chassis.png',
  '03-six-material-houses.png',
  '04-opening-day-raising.png',
  '05-proof-ground.png',
  '06-rooms-come-alive.png',
  '07-repair-exchange.png',
  '08-what-the-league-learned.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('The Hardpoint League publishes a complete eight-plate architecture season', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v14.astro'),
    read('src/lib/beach-commons-v14.ts'),
  ]);

  for (const title of [
    'The Hardpoint',
    'Common Chassis',
    'Six Material Houses',
    'Opening Day Raising',
    'The Proof Ground',
    'The Rooms Come Alive',
    'The Repair Exchange',
    'What the League Learned',
  ]) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(page, /The foundation is the constitution\. Every shelter is an amendment\./);
  assert.match(page, /One foundation\. Six architectures\. Let the rooms compete\./);
  assert.match(page, /No central stage\. Six reasons to keep walking\./);
  assert.match(page, /aria-label="Hardpoint League full image viewer"/);
  assert.match(page, /prefers-reduced-motion/);
});

test('six material houses share a 100-point complete-room score', async () => {
  const data = await read('src/lib/beach-commons-v14.ts');

  for (const house of [
    'Lantern Truss',
    'Palm Vault',
    'Cork Court',
    'Blue Rig',
    'Salt Lantern',
    'Second Sail',
  ]) {
    assert.match(data, new RegExp(house));
  }

  const points = [...data.matchAll(/points: (\d+)/g)].map((match) => Number(match[1]));
  assert.equal(points.reduce((sum, point) => sum + point, 0), 100);
  assert.match(data, /Inspection-ready structural concept', points: 20/);
  assert.match(data, /Repair exchange \+ legibility', points: 15/);
  assert.match(data, /Lantern Truss wins because/);
  assert.match(data, /Second Sail finishes last overall but wins/);
});

test('the Fixture Board is local, private, and not an engineering calculator or registration', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v14.astro'),
    read('src/pages/beach-commons/v14.json.ts'),
    read('src/content/blocks/0540.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /Fixture Board/);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /fields\.team\.textContent = activeTeam\.title/);
  assert.match(page, /fields\.fixture\.textContent = activeFixture\.title/);
  assert.match(page, /data-team=\{house\.id\}/);
  assert.match(page, /data-fixture=\{fixture\.id\}/);
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
  assert.doesNotMatch(page, /\bfetch\(/);
  assert.match(endpoint, /storage: false/);
  assert.match(endpoint, /networkWrites: false/);
  assert.match(endpoint, /engineeringCalculator: false/);
  assert.match(endpoint, /realEventRegistration: false/);
  assert.equal(block.meta.localFixtureBoard, true);
  assert.equal(block.meta.networkWrites, false);
});

test('coastal materials, structure, place, and event boundaries stay explicit', async () => {
  const [page, data, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v14.astro'),
    read('src/lib/beach-commons-v14.ts'),
    read('src/pages/beach-commons/v14.json.ts'),
    read('src/content/blocks/0540.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /not\s+engineering guidance, construction drawings, approvals, products, or an invitation to gather/);
  assert.match(data, /No team attaches an improvised tarp or membrane/);
  assert.match(data, /Dissimilar metals are isolated/);
  assert.match(data, /No public extreme-weather test/);
  assert.match(endpoint, /No structural calculations, connection dimensions, wind ratings/);
  assert.match(endpoint, /No exact Dockweiler or other public-property site is proposed/);
  assert.equal(block.meta.engineeringCalculator, false);
  assert.equal(block.meta.fictionalResults, true);
  assert.match(block.meta.eventBoundary, /no hardpoint, structure, chassis, league/);
});

test('The Hardpoint League has JSON, Block, series, homepage, and discovery twins', async () => {
  const [endpoint, blockText, series, sitemap, llms, llmsFull, homepage, homeEdition] =
    await Promise.all([
      read('src/pages/beach-commons/v14.json.ts'),
      read('src/content/blocks/0540.json'),
      read('src/lib/beach-commons-series.ts'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('src/pages/index.astro'),
      read('src/components/HomeNewEdition.astro'),
    ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0540');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.visualPlates, 8);
  assert.equal(block.meta.materialHouses, 6);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v14');
  assert.match(series, /currentEdition: 14/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v14'/);
  assert.match(llms, /PointCast Field Study 014/);
  assert.match(llmsFull, /THE HARDPOINT LEAGUE/);
  assert.match(homepage, /href="\/beach-commons\/v14"/);
  assert.match(homepage, /Block 0540/);
  assert.match(homeEdition, /href="\/beach-commons\/v14"/);
  assert.match(homeEdition, /New<br \/>0540/);
});

test('Hardpoint League images have intended edition and social dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v14/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));

  const socialUrl = new URL('../public/images/og/b/0540.png', import.meta.url);
  await access(socialUrl);
  assert.deepEqual(pngSize(await readFile(socialUrl)), { width: 1200, height: 630 });
});
