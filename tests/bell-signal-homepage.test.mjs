import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('the edited PointCast front door carries Nouns and Bell & Signal art as a switchable live signal', async () => {
  const [home, signals] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/lib/home-signals.ts'),
  ]);

  assert.match(signals, /pointcast-drum-noun-universe\/115-rooms-one-shared-pulse\.webp/);
  assert.match(signals, /bell-fall-v2\/bg-05-yellow-car\.jpg/);
  assert.match(signals, /bell-fall-v2\/bg-10-nageire-vase\.png/);
  assert.match(signals, /bell-fall-v2\/bg-09-el-segundo-skyline\.png/);
  assert.match(home, /data-fresh-hero-image/);
  assert.match(home, /data-fresh-shuffle/);
  assert.match(home, /image\.alt = next\.alt/);
  assert.match(home, /Field signal \$\{String\(active \+ 1\)\.padStart\(2, '0'\)\}/);
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
