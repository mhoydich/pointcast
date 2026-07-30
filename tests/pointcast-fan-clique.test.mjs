import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Fan Clique is a 35-program live click game with an honest boundary', async () => {
  const [data, page, json] = await Promise.all([
    read('src/lib/pointcast-fan-clique.ts'),
    read('src/pages/25/fan-clique.astro'),
    read('src/pages/25/fan-clique.json.ts'),
  ]);

  assert.match(data, /pointcast\.college-football\.fan-clique\/v1/);
  assert.match(data, /SONG_YARD_PROGRAMS\.map/);
  assert.match(data, /not a scientific poll/i);
  assert.match(page, /FAN<br \/><em>CLIQUE<\/em>/);
  assert.match(page, /VOTE FOR MY TEAM/);
  assert.match(page, /THE WHOLE FIELD/);
  assert.match(page, /data-team-search/);
  assert.match(page, /data-conference/);
  assert.match(page, /data-top-five/);
  assert.match(page, /one PointCast room/i);
  assert.match(json, /eligiblePrograms: FAN_CLIQUE_TEAMS\.length/);
  assert.match(json, /personalDataCollected|No account, email, wallet, name/);
});

test('Fan Clique counts one anonymous browser click and returns a truthful receipt', async () => {
  const [endpoint, page] = await Promise.all([
    read('functions/api/fan-clique.ts'),
    read('src/pages/25/fan-clique.astro'),
  ]);

  assert.match(endpoint, /PC_POLLS_KV/);
  assert.match(endpoint, /PC_RATES_KV/);
  assert.match(endpoint, /const VOTER_PREFIX = `\$\{PREFIX\}:voter:`/);
  assert.match(endpoint, /already-voted/);
  assert.match(endpoint, /status: 409|}, 409/);
  assert.match(endpoint, /applyFreshCount/);
  assert.match(endpoint, /Cache-Control': 'no-store/);
  assert.match(page, /pc-fan-clique-v1-voter-id/);
  assert.match(page, /crypto\.getRandomValues/);
  assert.match(page, /localStorage\.setItem/);
  assert.match(page, /fetch\('\/api\/fan-clique'/);
  assert.match(page, /searchParams\.set\('team'/);
  assert.match(page, /navigator\.share/);
});

test('Fan Clique is discoverable from the board and living magazine', async () => {
  const [board, magazine, magazineData, magazineJson] = await Promise.all([
    read('src/pages/25/index.astro'),
    read('src/pages/25/magazine/index.astro'),
    read('src/lib/pointcast-college-football-magazine.ts'),
    read('src/pages/25/magazine.json.ts'),
  ]);

  assert.match(board, /href="\/25\/fan-clique"/);
  assert.match(board, /fan-clique-door/);
  assert.match(magazine, /clique-flash/);
  assert.match(magazine, /FAN_CLIQUE_FEATURE/);
  assert.match(magazineData, /number: '12'/);
  assert.match(magazineData, /name: 'Fan Clique'/);
  assert.match(magazineJson, /fanCliqueLive/);
});
