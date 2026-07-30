import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const pngSize = async (path) => {
  const buffer = await readFile(new URL(`../${path}`, import.meta.url));
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
};

test('Rally Kit is a 35-school recruiting campaign with one honest public invitation', async () => {
  const [data, page, json] = await Promise.all([
    read('src/lib/pointcast-fan-clique-rally.ts'),
    read('src/pages/25/fan-clique/rally.astro'),
    read('src/pages/25/fan-clique/rally.json.ts'),
  ]);

  assert.match(data, /pointcast\.college-football\.fan-clique-rally\/v1/);
  assert.match(data, /MAKE YOUR SCHOOL IMPOSSIBLE TO IGNORE/);
  assert.match(data, /utm_campaign/);
  assert.match(data, /@barstoolsports @UnnecRoughness/);
  assert.match(data, /independent and unaffiliated with Barstool Sports/);
  assert.match(page, /FAN_CLIQUE_RALLY_TEAMS\.map/);
  assert.match(page, /data-copy-key/);
  assert.match(page, /twitter\.com\/intent\/tweet/);
  assert.match(data, /barstoolsports\.com\/shows\/52\/college-football-show/);
  assert.match(data, /barstoolsports\.com\/shows\/88\/unnecessary-roughness/);
  assert.match(json, /eligiblePrograms/);
});

test('Rally Kit carries its full original poster suite and exact social card', async () => {
  const [hero, rush, relay, social] = await Promise.all([
    pngSize('public/images/pointcast-fan-clique-rally/the-room-is-open.png'),
    pngSize('public/images/pointcast-fan-clique-rally/conference-rush.png'),
    pngSize('public/images/pointcast-fan-clique-rally/send-in-your-people.png'),
    pngSize('public/images/pointcast-fan-clique-rally/social-card.png'),
  ]);

  assert.deepEqual(hero, { width: 1536, height: 1024 });
  assert.deepEqual(rush, { width: 1536, height: 1024 });
  assert.deepEqual(relay, { width: 1536, height: 1024 });
  assert.deepEqual(social, { width: 1200, height: 630 });
});

test('Fan Clique sends organizers into the public rally desk', async () => {
  const [game, magazine] = await Promise.all([
    read('src/pages/25/fan-clique.astro'),
    read('src/lib/pointcast-college-football-magazine.ts'),
  ]);

  assert.match(game, /href="\/25\/fan-clique\/rally"/);
  assert.match(game, /class="rally-door"/);
  assert.match(magazine, /name: 'The Rally Desk'/);
});
