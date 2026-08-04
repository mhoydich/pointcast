import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('SHRINE/25 publishes twelve leave-with-you protocols', async () => {
  const [data, blockText] = await Promise.all([read('src/lib/radius25-shrines.ts'), read('src/content/blocks/0562.json')]);
  const block = JSON.parse(blockText);
  const protocols = data.split('SHRINE_PROTOCOLS')[1].split('SHRINE_WATCHES')[0];
  assert.equal((protocols.match(/number:'\d{2}'/g) || []).length, 12);
  assert.equal(block.meta.protocols, 12);
  assert.equal(block.meta.publicDoors, 25);
  assert.match(block.body, /hosted interval of attention/);
});

test('the shrine composer is private, explicit, erasable, and has a clean close', async () => {
  const [page, endpoint] = await Promise.all([read('src/pages/beach-commons/v18/shrines.astro'), read('src/pages/beach-commons/v18/shrines.json.ts')]);
  for (const hook of ['data-shrine-select', 'data-door-select', 'data-watch-select', 'data-company-select', 'data-copy-score', 'data-save-score', 'data-erase-score', 'data-clean-close']) assert.match(page, new RegExp(hook));
  assert.match(page, /localStorage\.setItem\(storageKey/);
  assert.match(page, /localStorage\.removeItem\(storageKey\)/);
  for (const boundary of ['geolocation: false', 'account: false', 'camera: false', 'microphone: false', 'analytics: false', 'networkWrites: false']) assert.match(endpoint, new RegExp(boundary));
  assert.match(endpoint, /does not announce, authorize, reserve, install, schedule/);
});

test('audio is a gesture-only bell and the four reality lanes remain visible', async () => {
  const [page, data] = await Promise.all([read('src/pages/beach-commons/v18/shrines.astro'), read('src/lib/radius25-shrines.ts')]);
  assert.match(page, /AudioContext/);
  assert.match(page, /createOscillator/);
  assert.doesNotMatch(page, /getUserMedia|MediaRecorder|autoplay\s*=|\.play\(/);
  assert.equal((data.split('SHRINE_LANES')[1].split('SHRINE_SOURCES')[0].match(/number:'\d{2}'/g) || []).length, 4);
});

test('SHRINE/25 has human, JSON, Block, and social-image surfaces', async () => {
  const [page, endpoint, blockText, social] = await Promise.all([
    read('src/pages/beach-commons/v18/shrines.astro'), read('src/pages/beach-commons/v18/shrines.json.ts'), read('src/content/blocks/0562.json'), read('public/beach-commons/v18/shrines/og.svg'),
  ]);
  const block = JSON.parse(blockText);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v18/shrines');
  assert.match(page, /SHRINE\/25/);
  assert.match(endpoint, /SHRINE_PROTOCOLS/);
  assert.match(page, /Block 0562/);
  assert.match(block.media.src, /og\.png$/);
  assert.match(social, /NOTHING LEFT BEHIND/);
});
