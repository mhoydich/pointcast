import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('PASS/25 publishes the complete passport instrument', async () => {
  const [data, blockText] = await Promise.all([
    read('src/lib/radius25-passport.ts'),
    read('src/content/blocks/0558.json'),
  ]);
  const block = JSON.parse(blockText);
  const lensSection = data.split('PASSPORT_LENSES')[1].split('PASSPORT_STAMPS')[0];
  const stampSection = data.split('PASSPORT_STAMPS')[1].split('TREASURE_ROUTES')[0];
  const routeSection = data.split('TREASURE_ROUTES')[1].split('AUDIO_COMPANIONS')[0];
  assert.equal((lensSection.match(/number: '\d{2}'/g) || []).length, 6);
  assert.equal((stampSection.match(/title:/g) || []).length, 24);
  assert.equal((routeSection.match(/number: '\d{2}'/g) || []).length, 12);
  assert.equal(block.meta.publicDoors, 25);
  assert.equal(block.meta.spotifyPlaylists, 6);
  assert.equal(block.meta.pinterestPins, 50);
});

test('the Pinterest package is four exact boards and fifty rendered vertical cards', async () => {
  const data = await read('src/lib/radius25-passport.ts');
  const files = (await readdir(new URL('public/beach-commons/v18/passport/pins/', root))).filter((file) => file.endsWith('.png'));
  assert.match(data, /count: 13/);
  assert.match(data, /count: 12/);
  assert.equal(files.length, 50);
  assert.equal(files[0], 'pass-25-01.png');
  assert.equal(files.at(-1), 'pass-25-50.png');
});

test('check-ins remain local, explicit, erasable, and exportable', async () => {
  const [page, endpoint] = await Promise.all([
    read('src/pages/beach-commons/v18/passport.astro'),
    read('src/pages/beach-commons/v18/passport.json.ts'),
  ]);
  for (const hook of ['data-check-form', 'data-save-device', 'data-export', 'data-erase', 'data-stamp-slot']) assert.match(page, new RegExp(hook));
  assert.match(page, /localStorage\.setItem\(storageKey/);
  assert.match(page, /localStorage\.removeItem\(storageKey\)/);
  assert.match(page, /new Blob/);
  assert.match(endpoint, /defaultPersistence: 'page memory/);
  assert.match(endpoint, /optionalPersistence: 'browser localStorage only after/);
  for (const boundary of ['geolocation: false', 'account: false', 'camera: false', 'microphone: false', 'analytics: false', 'networkWrites: false']) assert.match(endpoint, new RegExp(boundary));
});

test('the audio companion is gesture-only synthesis, not recording or provider restreaming', async () => {
  const [page, endpoint] = await Promise.all([
    read('src/pages/beach-commons/v18/passport.astro'),
    read('src/pages/beach-commons/v18/passport.json.ts'),
  ]);
  assert.match(page, /AudioContext/);
  assert.match(page, /createOscillator/);
  assert.doesNotMatch(page, /getUserMedia|MediaRecorder|autoplay\s*=|\.play\(/);
  assert.match(endpoint, /PointCast does not proxy or restream Spotify audio/);
});

test('PASS/25 has human, JSON, Block, and fifty visual artifacts', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v18/passport.astro'),
    read('src/pages/beach-commons/v18/passport.json.ts'),
    read('src/content/blocks/0558.json'),
  ]);
  const block = JSON.parse(blockText);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v18/passport');
  assert.match(page, /PASS\/25/);
  assert.match(endpoint, /PINTEREST_PINS/);
  assert.match(page, /Block 0558/);
});
