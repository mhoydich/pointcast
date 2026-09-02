import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-tide-cabinet.png',
  '02-shell-stone-borrowing-library.png',
  '03-net-walk.png',
  '04-wrack-line-reading-room.png',
  '05-grunion-moon-watch.png',
  '06-eelgrass-window.png',
  '07-oyster-relay.png',
  '08-life-returns-by-season.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Tide Cabinet publishes eight exact-return coastal field plates', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v10.astro'),
    read('src/lib/beach-commons-v10.ts'),
  ]);

  assert.match(page, /A museum that ends/);
  assert.match(page, /Eight plates/);
  assert.match(page, /Shoreline Score/);
  assert.match(page, /Everyone contributes/);
  assert.match(page, /Three paths/);
  assert.match(page, /aria-label="Tide Cabinet full image viewer"/);
  assert.match(page, /returnFocus\?\.focus\(\)/);
  assert.match(page, /event\.key === 'Escape'/);
  assert.match(page, /prefers-reduced-motion/);

  for (const title of [
    'The Tide Cabinet',
    'Shell + Stone Borrowing Library',
    'The Net Walk',
    'Wrack Line Reading Room',
    'Grunion Moon Watch',
    'Eelgrass Window',
    'The Oyster Relay — Not Here',
    'Life Returns by Season',
  ]) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const zone of ['LOOK', 'WALK', 'NIGHT + WATER', 'RESTORE']) {
    assert.match(data, new RegExp(`title: '${zone.replace('+', '\\+')}'`));
  }
});

test('Shoreline Score is gesture-only original browser synthesis', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v10.astro'),
    read('src/pages/beach-commons/v10.json.ts'),
    read('src/content/blocks/0528.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /new \(window\.AudioContext \|\| window\.webkitAudioContext\)/);
  assert.match(page, /createOscillator/);
  assert.match(page, /createBuffer/);
  assert.match(page, /addEventListener\('click'/);
  assert.doesNotMatch(page, /<audio/i);
  assert.doesNotMatch(page, /<[^>]+autoplay/i);
  assert.match(endpoint, /samplesOrRecordings: false/);
  assert.match(endpoint, /autoPlay: false/);
  assert.equal(block.meta.browserAudioVoices, 6);
  assert.equal(block.meta.audioSamples, 0);
  assert.equal(block.meta.autoPlay, false);
});

test('Collecting, netting, wildlife, restoration, and event boundaries stay explicit', async () => {
  const [data, endpoint, blockText] = await Promise.all([
    read('src/lib/beach-commons-v10.ts'),
    read('src/pages/beach-commons/v10.json.ts'),
    read('src/content/blocks/0528.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /removing natural resources is generally prohibited/i);
  assert.match(data, /never a sweep net, seine, trap, or wildlife tool/i);
  assert.match(data, /Closed season is April through June/i);
  assert.match(data, /offshore eelgrass pilot/i);
  assert.match(data, /Olympia oysters are bay and estuary restoration organisms/i);
  assert.match(data, /western snowy plover enclosure/i);
  assert.match(endpoint, /No shellfish, plants, fish, habitat material/);
  assert.match(block.meta.takeBoundary, /return exactly/);
  assert.match(block.meta.netBoundary, /never sweep, drag, seine/);
  assert.match(block.meta.restorationBoundary, /qualified partners/);
  assert.match(block.meta.eventBoundary, /no event announced/);
});

test('Tide Cabinet has machine, Block, feed, homepage, and discovery twins', async () => {
  const [endpoint, blockText, sitemap, llms, llmsFull, homepage, rack] = await Promise.all([
    read('src/pages/beach-commons/v10.json.ts'),
    read('src/content/blocks/0528.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/index.astro'),
    read('src/components/HomeMagazineRack.astro'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0528');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.visualPlates, 8);
  assert.equal(block.meta.browserAudioVoices, 6);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v10');
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v10'/);
  assert.match(llms, /PointCast Field Study 010/);
  assert.match(llmsFull, /TIDE CABINET/);
  // front door rebuilt 2026-09-01: Beach Commons doors live in index.astro's beachCommonsVolumes/covers arrays and render through <HomeMagazineRack /> (№ blockId chips + the index JSON link).
  assert.match(homepage, /<HomeMagazineRack\b/);
  assert.match(homepage, /href: '\/beach-commons\/v10'/);
  assert.match(homepage, /blockId: '0528'/);
  assert.match(rack, /№ \{v\.blockId\}/);
  assert.match(homepage, /href: '\/beach-commons'/);
  assert.match(rack, /href="\/beach-commons\.json"/);
});

test('Tide Cabinet image assets have the intended dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v10/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );

  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));
});
