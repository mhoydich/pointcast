import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-zero-mile.png',
  '02-one-armspan.png',
  '03-living-odometer.png',
  '04-handoff-house.png',
  '05-great-pause.png',
  '06-twenty-two-mile-dream.png',
  '07-moon-fire-ring.png',
  '08-return-arc.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('The Reach Line publishes eight continuous-custody relay plates', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v11.astro'),
    read('src/lib/beach-commons-v11.ts'),
  ]);

  assert.match(page, /The distance is not speed/);
  assert.match(page, /Reach Meter/);
  assert.match(page, /Four honest measures/);
  assert.match(page, /Three[\s\S]*scales/);
  assert.match(page, /Everyone[\s\S]*holds a job/);
  assert.match(page, /aria-label="The Reach Line full image viewer"/);
  assert.match(page, /returnFocus\?\.focus\(\)/);
  assert.match(page, /event\.key === 'Escape'/);
  assert.match(page, /prefers-reduced-motion/);

  for (const title of [
    'Zero Mile — The Pacific Start',
    'The One-Armspan Game',
    'The Living Odometer',
    'The Handoff House',
    'The Great Pause',
    'The Twenty-Two-Mile Dream',
    'Moon + Fire-Ring Relay',
    'The Return Arc',
  ]) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const dimension of ['HANDS', 'GROUND', 'FARTHEST', 'CONTINUITY']) {
    assert.match(data, new RegExp(`title: '${dimension}'`));
  }
});

test('Reach Meter is a local, undoable rehearsal with gesture-only original audio', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v11.astro'),
    read('src/pages/beach-commons/v11.json.ts'),
    read('src/content/blocks/0531.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /pointcast\.reach-line\.v11/);
  assert.match(page, /One armspan/);
  assert.match(page, /Station leg/);
  assert.match(page, /Pause in cradle/);
  assert.match(page, /Turn toward home/);
  assert.match(page, /Undo/);
  assert.match(page, /Copy receipt/);
  assert.match(page, /Reset local game/);
  assert.match(page, /new AudioContext/);
  assert.match(page, /createOscillator/);
  assert.match(page, /\[392, 523\.25, 659\.25\]/);
  assert.doesNotMatch(page, /<audio/i);
  assert.doesNotMatch(page, /<[^>]+autoplay/i);
  assert.match(endpoint, /networkWrites: false/);
  assert.match(endpoint, /liveParticipantCount: false/);
  assert.match(endpoint, /requiresVisitorGesture: true/);
  assert.equal(block.meta.localGame, true);
  assert.equal(block.meta.browserAudioVoices, 3);
  assert.equal(block.meta.audioSamples, 0);
  assert.equal(block.meta.autoPlay, false);
  assert.equal(block.meta.liveTracking, false);
});

test('Relay safety and event boundaries remain explicit', async () => {
  const [data, endpoint, blockText] = await Promise.all([
    read('src/lib/beach-commons-v11.ts'),
    read('src/pages/beach-commons/v11.json.ts'),
    read('src/content/blocks/0531.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /Continuous means unbroken custody, not nonstop motion/);
  assert.match(data, /At every crossing the relay stops completely/);
  assert.match(data, /Volunteers never direct traffic/);
  assert.match(data, /not an approved relay route/);
  assert.match(data, /No participant enters a bike lane, roadway, surf, dune/);
  assert.match(endpoint, /No relay, route, gathering, ticket, contribution drive/);
  assert.match(block.meta.custodyBoundary, /staffed cradle/);
  assert.match(block.meta.crossingBoundary, /no volunteer traffic direction/);
  assert.match(block.meta.eventBoundary, /no relay, route, gathering, permit/);
});

test('The Reach Line has machine, Block, homepage, and discovery twins', async () => {
  const [endpoint, blockText, sitemap, llms, llmsFull, homepage, rack] = await Promise.all([
    read('src/pages/beach-commons/v11.json.ts'),
    read('src/content/blocks/0531.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/index.astro'),
    read('src/components/HomeMagazineRack.astro'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0531');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.visualPlates, 8);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v11');
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v11'/);
  assert.match(llms, /PointCast Field Study 011/);
  assert.match(llmsFull, /THE REACH LINE/);
  // front door rebuilt 2026-09-01: Beach Commons doors live in index.astro's covers/beachCommonsVolumes
  // arrays (single-quoted hrefs, block ids as blockId) and render as chips through HomeMagazineRack.
  assert.match(homepage, /href: '\/beach-commons\/v11'/);
  assert.match(homepage, /'\/beach-commons\/v11'.*blockId: '0531'/);
  assert.match(homepage, /href: '\/beach-commons'/);
  assert.match(homepage, /<HomeMagazineRack\b/);
  assert.match(rack, /href="\/beach-commons"/);
  assert.match(rack, /href="\/beach-commons\.json"/);
  assert.match(homepage, /href: '\/beach-commons\/v10'/);
});

test('The Reach Line image assets have the intended dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v11/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));
});
