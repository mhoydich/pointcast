import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-public-parts-counter.png',
  '02-crystal-radio-picnic.png',
  '03-cassette-sun-station.png',
  '04-mesh-message-lanterns.png',
  '05-weather-ear.png',
  '06-goes-weather-window.png',
  '07-offline-ai-repair-bench.png',
  '08-quiet-hifi-assembly.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Signal Shack publishes eight low-fi to hi-fi group benches', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v9.astro'),
    read('src/lib/beach-commons-v9.ts'),
  ]);

  assert.match(page, /The old parts counter/);
  assert.match(page, /Eight benches/);
  assert.match(page, /Tune the/);
  assert.match(page, /Everyone contributes/);
  assert.match(page, /Three paths/);
  assert.match(page, /aria-label="Signal Shack full image viewer"/);
  assert.match(page, /returnFocus\?\.focus\(\)/);
  assert.match(page, /event\.key === 'Escape'/);
  assert.match(page, /prefers-reduced-motion/);

  for (const title of [
    'The Public Parts Counter',
    'Crystal Radio Picnic',
    'Cassette Sun Station',
    'Mesh Message Lanterns',
    'Weather Ear',
    'GOES Weather Window',
    'Offline AI Repair Bench',
    'Quiet Hi-Fi Assembly',
  ]) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const lane of ['LOW-FI', 'FIELD-FI', 'SKY-FI', 'HI-FI']) {
    assert.match(data, new RegExp(`title: '${lane}'`));
  }
});

test('Signal Shack audio is gesture-only original browser synthesis', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v9.astro'),
    read('src/pages/beach-commons/v9.json.ts'),
    read('src/content/blocks/0526.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /new \(window\.AudioContext \|\| window\.webkitAudioContext\)/);
  assert.match(page, /createOscillator/);
  assert.match(page, /createBuffer/);
  assert.match(page, /addEventListener\('click'/);
  assert.doesNotMatch(page, /<audio/i);
  assert.doesNotMatch(page, /autoplay/i);
  assert.match(endpoint, /samplesOrRecordings: false/);
  assert.match(endpoint, /autoPlay: false/);
  assert.equal(block.meta.browserAudioVoices, 6);
  assert.equal(block.meta.audioSamples, 0);
  assert.equal(block.meta.autoPlay, false);
});

test('Signal Shack keeps affiliation, radio, event, habitat, power, and sound limits explicit', async () => {
  const [data, blockText] = await Promise.all([
    read('src/lib/beach-commons-v9.ts'),
    read('src/content/blocks/0526.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /not affiliated with, sponsored by, or endorsed by RadioShack/);
  assert.match(data, /Certified modules and stock antennas only/);
  assert.match(data, /Receive-only demonstration/);
  assert.match(data, /no event is announced, scheduled, permitted/);
  assert.match(data, /western snowy plover enclosure/);
  assert.match(data, /away from saltwater and fire rings/);
  assert.match(data, /prohibit amplified music/);
  assert.match(block.meta.radioBoundary, /receive-only SDR or certified modules/);
  assert.match(block.meta.eventBoundary, /no event announced/);
});

test('Signal Shack has machine, Block, feed, homepage, and discovery twins', async () => {
  const [endpoint, blockText, sitemap, llms, llmsFull, homepage] = await Promise.all([
    read('src/pages/beach-commons/v9.json.ts'),
    read('src/content/blocks/0526.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/index.astro'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0526');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.visualPlates, 8);
  assert.equal(block.meta.groupBenches, 8);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v9');
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v9'/);
  assert.match(llms, /PointCast Field Study 009/);
  assert.match(llmsFull, /SIGNAL SHACK/);
  // front door rebuilt 2026-09-01: V9 is a Beach Commons chip in index.astro's
  // beachCommonsVolumes array (HomeMagazineRack renders it as "V9 Signal Shack · № 0526").
  assert.match(homepage, /href: '\/beach-commons\/v9'/);
  assert.match(homepage, /href: '\/beach-commons\/v9'[^\n]*blockId: '0526'/);
});

test('Signal Shack image assets have the intended dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v9/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );

  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));
});
