import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Bell & Signal listening stations are distributed across the PointCast homepage', async () => {
  const [home, component] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeSignalStation.astro'),
  ]);

  const placements = [...home.matchAll(/<HomeSignalStation station="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(placements, ['front', 'field', 'wire', 'commons', 'archive']);
  assert.match(component, /data-home-casting=/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /visibilitychange/);
  assert.match(component, /prefers-reduced-motion/);
  assert.match(component, /visit the foundry/);
});

test('Catalog No. 2 defines fifteen unique live-coded castings and recipes', async () => {
  const [catalog, audio, foundry, adverts] = await Promise.all([
    read('src/lib/bell-signal-home.ts'),
    read('src/lib/bell-signal-home-audio.ts'),
    read('src/pages/bell-and-signal.astro'),
    read('src/components/TownAdverts.astro'),
  ]);

  const ids = [...catalog.matchAll(/\{ id: '((?:BEL|SIG|BRE|BLM|TIK|DRN|RIT)-\d+)'/g)].map((match) => match[1]);
  assert.equal(ids.length, 15);
  assert.equal(new Set(ids).size, 15);
  ids.forEach((id) => assert.match(audio, new RegExp(`case '${id.replace('-', '\\-')}'`)));

  assert.match(audio, /pinkBuffer/);
  assert.match(audio, /createOscillator/);
  assert.match(audio, /createConvolver/);
  assert.doesNotMatch(audio, /fetch\(/);
  assert.match(foundry, /CATALOG No\. 2 · FIFTEEN HOME CASTINGS/);
  assert.match(foundry, /HOME_SIGNAL_STATIONS/);
  assert.match(adverts, /Thirty-two castings/);
});
