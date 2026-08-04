import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('California State Desk publishes an eight-program, five-conference report', async () => {
  const [data, page, endpoint] = await Promise.all([
    read('src/lib/pointcast-california-football.ts'),
    read('src/pages/25/magazine/california-football.astro'),
    read('src/pages/25/magazine/california-football.json.ts'),
  ]);

  assert.equal((data.match(/program: '/g) ?? []).length, 16);
  assert.equal((data.match(/conference: '/g) ?? []).length, 5);
  assert.equal((data.match(/number: '0[1-5]'/g) ?? []).length, 5);
  assert.match(endpoint, /fbsPrograms: CALIFORNIA_PROGRAM_PULSE\.length/);
  assert.match(page, /FOOTBALL COMPACT/);
  assert.match(page, /It needs to become more like California, together, on Saturdays/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(endpoint, /adopted: false/);
});

test('attendance, participation, and circuit claims remain source-bounded', async () => {
  const [data, endpoint, blockText] = await Promise.all([
    read('src/lib/pointcast-california-football.ts'),
    read('src/pages/25/magazine/california-football.json.ts'),
    read('src/content/blocks/0557.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.equal((data.match(/average: \d+/g) ?? []).length, 8);
  assert.equal((data.match(/label: 'THE /g) ?? []).length, 7);
  assert.match(data, /boys in 11-player football and 19,921 girls in flag football/);
  assert.match(endpoint, /boysElevenPlayer: 91411/);
  assert.match(endpoint, /girlsFlag: 19921/);
  assert.match(endpoint, /official: false/);
  assert.equal(block.id, '0557');
  assert.equal(block.author, 'codex');
  assert.ok(block.source.length > 0);
  assert.equal(block.meta.fbsPrograms, 8);
  assert.equal(block.meta.conferences, 5);
  assert.equal(block.meta.inStateCircuitGames, 7);
  assert.equal(block.meta.compactPromises, 5);
  assert.equal(block.meta.generatedImageIsDocumentaryPhotography, false);
});

test('California State Desk is discoverable across the magazine, homepage, app, agents, and Block', async () => {
  const [departments, magazine, magazineJson, home, homeEdition, apps, llms, llmsFull] =
    await Promise.all([
      read('src/lib/pointcast-college-football-magazine.ts'),
      read('src/pages/25/magazine/index.astro'),
      read('src/pages/25/magazine.json.ts'),
      read('src/pages/index.astro'),
      read('src/components/HomeNewEdition.astro'),
      read('src/lib/pointcast-apps.ts'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
    ]);

  assert.match(departments, /name: 'California State Desk'/);
  assert.match(magazine, /href="\/25\/magazine\/california-football"/);
  assert.match(magazineJson, /californiaFootballJson/);
  assert.match(home, /California Football Is Not Dead/);
  assert.match(homeEdition, /id: '0557'/);
  assert.match(apps, /slug: 'california-football-2026'/);
  assert.match(llms, /California Football Is Not Dead — State Desk 001/);
  assert.match(llmsFull, /`\/25\/magazine\/california-football`/);
});

test('California editorial art and social card are checked in at production dimensions', async () => {
  const heroPath = new URL(
    '../public/images/pointcast-california-football/california-signal-field.webp',
    import.meta.url,
  );
  const socialPath = new URL(
    '../public/images/pointcast-california-football/social-card.png',
    import.meta.url,
  );
  await Promise.all([access(heroPath), access(socialPath)]);
  const [hero, social] = await Promise.all([
    sharp(fileURLToPath(heroPath)).metadata(),
    sharp(fileURLToPath(socialPath)).metadata(),
  ]);

  assert.equal(hero.width, 1920);
  assert.equal(hero.height, 1080);
  assert.equal(hero.format, 'webp');
  assert.equal(social.width, 1200);
  assert.equal(social.height, 630);
  assert.equal(social.format, 'png');
});
