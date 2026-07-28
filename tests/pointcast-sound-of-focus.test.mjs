import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Sound Desk 001 is a PointCast 25 × Tone Bloom college-football feature', async () => {
  const [data, page, endpoint] = await Promise.all([
    read('src/lib/pointcast-focus.ts'),
    read('src/pages/25/magazine/sound-of-focus.astro'),
    read('src/pages/25/magazine/sound-of-focus.json.ts'),
  ]);

  assert.match(data, /pointcast\.college-football-sound-desk\/v1/);
  assert.match(data, /Michael Hoydich/);
  assert.match(data, /PointCast 25 × Tone Bloom/);
  assert.match(data, /The Film Room/);
  assert.match(data, /The Playbook/);
  assert.match(data, /The Belief Board/);
  assert.match(data, /Saturday Operations/);
  assert.match(data, /The Walk Home/);
  assert.match(data, /Caffeine/);
  assert.match(data, /Cannabis/);
  assert.match(data, /social-card-v2\.png/);
  assert.equal((data.match(/playlist: \{/g) || []).length, 5);

  assert.match(page, /THE 25-SECOND READ/);
  assert.match(page, /data-snap-start/);
  assert.match(page, /data-focus-tab/);
  assert.match(page, /OPEN 25 × TONE BLOOM/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /interactiveLab/);
});

test('Sound Desk 001 publishes credits, research boundaries, and a Block', async () => {
  const [data, blockText] = await Promise.all([
    read('src/lib/pointcast-focus.ts'),
    read('src/content/blocks/0535.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.equal(block.id, '0535');
  assert.equal(block.channel, 'SPN');
  assert.equal(block.author, 'mike');
  assert.equal(block.external.url, 'https://pointcast.xyz/25/magazine/sound-of-focus');
  assert.equal(block.meta.focusModes, 5);
  assert.equal(block.meta.spotifyPlaylists, 5);
  assert.equal(block.meta.localStudyDataUploaded, false);
  assert.equal(block.meta.hostsCommercialRecordings, false);

  assert.match(data, /medicalAdvice: false/);
  assert.match(data, /localStudyDataUploaded: false/);
  assert.match(data, /spotifyPlaybackHostedByPointCast: false/);
  assert.match(data, /World Health Organization/);
  assert.match(data, /cdc\.gov\/cannabis/);
  assert.match(data, /fda\.gov/);
  assert.match(data, /nccih\.nih\.gov/);
});

test('Sound Desk 001 is discoverable across the magazine and agent surfaces', async () => {
  const surfaces = await Promise.all([
    read('src/pages/25/index.astro'),
    read('src/pages/25.json.ts'),
    read('src/pages/25/magazine/index.astro'),
    read('src/pages/25/magazine.json.ts'),
    read('src/lib/pointcast-college-football-magazine.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/components/HomeNewEdition.astro'),
  ]);

  for (const surface of surfaces) {
    assert.match(surface, /25\/magazine\/sound-of-focus|POINTCAST_SOUND_OF_FOCUS/);
  }
});

test('Sound Desk social card is a 1200 by 630 PNG', async () => {
  const card = new URL(
    '../public/images/pointcast-focus/social-card-v2.png',
    import.meta.url,
  );
  await access(card);
  assert.deepEqual(pngSize(await readFile(card)), { width: 1200, height: 630 });
});
