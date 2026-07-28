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

test('The Song Yard defines six original songs and four legible rehearsal parts', async () => {
  const data = await read('src/lib/pointcast-2029-song-yard.ts');
  const seeds = data.split('export const SONG_YARD_SEEDS')[1].split('export const SONG_YARD_PRACTICE_PATH')[0];

  assert.equal((seeds.match(/^\s{4}id: /gm) || []).length, 6);
  assert.equal((data.split('export const SONG_YARD_PARTS')[1].split('export const SONG_YARD_SEEDS')[0].match(/^\s{4}id: /gm) || []).length, 4);
  assert.match(data, /pointcast\.saturday-commons\.song-yard\/v1/);
  assert.match(data, /Open the Gate/);
  assert.match(data, /Rain Roof Round/);
  assert.match(data, /Walk Home Slow/);
  assert.match(data, /not official fight songs/);
});

test('the practice instrument is sample-free, gesture-gated, stoppable, and reduced-motion safe', async () => {
  const [page, audio] = await Promise.all([
    read('src/pages/25/2029/song-yard/index.astro'),
    read('src/lib/pointcast-2029-song-yard-audio.ts'),
  ]);

  assert.match(page, /data-play-part/);
  assert.match(page, /data-play-bowl/);
  assert.match(page, /data-stop/);
  assert.match(page, /data-practice-part/);
  assert.match(page, /data-beat-step/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /recordings or uploads/);
  assert.match(audio, /createOscillator/);
  assert.match(audio, /createDeterministicNoise/);
  assert.match(audio, /createStereoPanner/);
  assert.match(audio, /audio\.state === 'suspended'/);
  assert.match(audio, /stopTransport/);
  assert.doesNotMatch(audio, /\bfetch\s*\(/);
  assert.doesNotMatch(audio, /MediaRecorder/);
  assert.doesNotMatch(page, /<audio|<iframe/);
});

test('optional microphone analysis remains local and is not required for the room', async () => {
  const [page, audio, json] = await Promise.all([
    read('src/pages/25/2029/song-yard/index.astro'),
    read('src/lib/pointcast-2029-song-yard-audio.ts'),
    read('src/pages/25/2029/song-yard.json.ts'),
  ]);

  assert.match(page, /data-mic-toggle/);
  assert.match(page, /never records,\s*stores, transmits, identifies, or scores your voice/);
  assert.match(audio, /getUserMedia/);
  assert.match(audio, /createMediaStreamSource/);
  assert.match(audio, /getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
  assert.doesNotMatch(audio, /\.connect\(micContext\.destination\)/);
  assert.match(json, /microphoneRequiredForCoreExperience: false/);
  assert.match(json, /recordsVoice: false/);
  assert.match(json, /storesVoice: false/);
  assert.match(json, /uploadsVoice: false/);
  assert.match(json, /voiceIdentification: false/);
  assert.match(json, /voiceScoring: false/);
  assert.match(json, /Access-Control-Allow-Origin/);
});

test('The Song Yard is discoverable across the full PointCast contract', async () => {
  const [homeCss, ...surfaces] = await Promise.all([
    read('src/styles/front-door-fresh.css'),
    read('src/pages/index.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/25/2029/index.astro'),
    read('src/pages/25/2029/field-kit/index.astro'),
    read('src/lib/pointcast-2029.ts'),
    read('src/lib/pointcast-2029-field-kit.ts'),
  ]);

  assert.match(homeCss, /fresh-field-card--song/);
  for (const surface of surfaces) assert.match(surface, /25\/2029\/song-yard/);
});

test('Block 0527 accurately bounds the practice room', async () => {
  const block = JSON.parse(await read('src/content/blocks/0527.json'));

  assert.equal(block.id, '0527');
  assert.equal(block.channel, 'BTL');
  assert.equal(block.type, 'LISTEN');
  assert.equal(block.meta.originalSongSeeds, 6);
  assert.equal(block.meta.rehearsalParts, 4);
  assert.equal(block.meta.audioSamples, 0);
  assert.equal(block.meta.officialFightSongs, 0);
  assert.equal(block.meta.autoplay, false);
  assert.equal(block.meta.recordsVoice, false);
  assert.equal(block.meta.uploadsVoice, false);
  assert.equal(block.meta.telemetryAdded, false);
  assert.equal(block.meta.official, false);
});

test('the Song Yard social card is a 1200 by 630 PNG', async () => {
  const path = new URL('../public/images/pointcast-2029-song-yard/social-card.png', import.meta.url);
  await access(path);
  assert.deepEqual(pngSize(await readFile(path)), { width: 1200, height: 630 });
});
