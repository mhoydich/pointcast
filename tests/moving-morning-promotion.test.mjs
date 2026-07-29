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

test('The Moving Morning receives a clear, finite homepage invitation', async () => {
  const [home, component] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeMovingMorning.astro'),
  ]);

  assert.match(home, /import HomeMovingMorning/);
  assert.match(home, /<HomeMovingMorning \/>[\s\S]*<HomeNewEdition \/>/);
  assert.match(component, /TONE BLOOM DAILY 003/);
  assert.match(component, /seventy-two seconds/i);
  assert.match(component, /NO LOGIN/);
  assert.match(component, /NO STREAK/);
  assert.match(component, /https:\/\/tonebloom\.xyz\/daily\/2026-07-29/);
  assert.match(component, /6Oat4B39aGzpv9EYu13KpT/);
  assert.match(component, /@media \(max-width: 720px\)/);
  assert.match(component, /prefers-reduced-motion: reduce/);
});

test('Block 0543 records the public companion and original-audio boundaries', async () => {
  const block = JSON.parse(await read('src/content/blocks/0543.json'));

  assert.equal(block.id, '0543');
  assert.equal(block.channel, 'SPN');
  assert.equal(block.type, 'LISTEN');
  assert.equal(block.meta.playlistVisibility, 'public');
  assert.equal(block.meta.playlistTracks, 30);
  assert.equal(block.meta.durationSeconds, 72);
  assert.equal(block.meta.originalWebAudioMovements, 12);
  assert.equal(block.meta.officialSpotifyPlayer, true);
  assert.equal(block.meta.audioProxy, false);
  assert.equal(block.meta.loginRequired, false);
  assert.equal(block.meta.streaks, false);
  assert.equal(block.author, 'codex');
  assert.match(block.source, /Michael Hoydich chat directive/);
});

test('the Airy Garden Mix cover is a checked-in square source asset', async () => {
  const cover = new URL('../public/images/tone-bloom/airy-garden-mix.png', import.meta.url);
  await access(cover);
  assert.deepEqual(pngSize(await readFile(cover)), { width: 1024, height: 1024 });
});
