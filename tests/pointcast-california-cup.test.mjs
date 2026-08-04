import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('California Cup launches with seven scheduled games, eight programs, and two separate trophies', async () => {
  const [data, endpoint, blockText] = await Promise.all([
    read('src/lib/pointcast-california-cup.ts'),
    read('src/pages/25/magazine/california-cup.json.ts'),
    read('src/content/blocks/0559.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /spec: 'pointcast\.college-football\.california-cup\/v1'/);
  assert.match(data, /pointsForWin: 3/);
  assert.match(data, /maximumPerGame: CALIFORNIA_CUP_INVITATION_DIMENSIONS\.length \* 10/);
  assert.match(endpoint, /scheduledGames: CALIFORNIA_CUP_GAMES\.length/);
  assert.match(endpoint, /finalGames: 0/);
  assert.match(endpoint, /footballResultAffectedByInvitationScore: false/);
  assert.equal(block.id, '0559');
  assert.equal(block.meta.programs, 8);
  assert.equal(block.meta.scheduledGames, 7);
  assert.equal(block.meta.trophies, 2);
  assert.equal(block.meta.invitationDimensions, 5);
});

test('the California circuit uses the refreshed official August 3 schedule state', async () => {
  const data = await read('src/lib/pointcast-california-football.ts');

  assert.match(data, /date: 'SEP 04'[\s\S]*kickoff: '6:00 PM PT'[\s\S]*game: 'FRESNO STATE AT USC'/);
  assert.match(data, /date: 'SEP 05'[\s\S]*kickoff: '7:30 PM PT'[\s\S]*game: 'UCLA AT CALIFORNIA'/);
  assert.match(data, /game: 'FRESNO STATE AT SAN DIEGO STATE'/);
  assert.doesNotMatch(data, /game: 'SAN DIEGO STATE AT FRESNO STATE'/);
  assert.match(data, /id: 'usc-schedule-2026'/);
  assert.match(data, /id: 'cal-schedule-2026'/);
  assert.match(data, /id: 'sac-state-schedule-current'/);
  assert.match(data, /id: 'sjsu-schedule-2026'/);
  assert.match(data, /id: 'sdsu-schedule-2026'/);
});

test('the circuit card is browser-local, explicit to share, and clearable', async () => {
  const page = await read('src/pages/25/magazine/california-cup.astro');

  assert.match(page, /pointcast\.california-cup\.card\.v1/);
  assert.match(page, /localStorage\.setItem/);
  assert.match(page, /localStorage\.removeItem/);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /navigator\.share/);
  assert.match(page, /PRIVATE UNTIL SHARED/);
  assert.match(page, /data-clear-card/);
  assert.doesNotMatch(page, /fetch\(/);
});

test('California Cup travels through the State Desk, magazine, homepage, app registry, discovery, and Block', async () => {
  const [stateDesk, departments, magazine, magazineJson, home, homeEdition, apps, llms, llmsFull] = await Promise.all([
    read('src/pages/25/magazine/california-football.astro'),
    read('src/lib/pointcast-college-football-magazine.ts'),
    read('src/pages/25/magazine/index.astro'),
    read('src/pages/25/magazine.json.ts'),
    read('src/pages/index.astro'),
    read('src/components/HomeNewEdition.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  for (const text of [stateDesk, departments, magazine, magazineJson, home, homeEdition, apps, llms, llmsFull]) {
    assert.match(text, /california-cup/i);
  }
  assert.match(departments, /number: '17'/);
  assert.match(homeEdition, /id: '0559'/);
  assert.match(apps, /slug: 'california-cup-2026'/);
});

test('California Cup social art is checked in at production dimensions', async () => {
  const socialPath = new URL(
    '../public/images/pointcast-california-football/california-cup-social.png',
    import.meta.url,
  );
  await access(socialPath);
  const social = await sharp(fileURLToPath(socialPath)).metadata();
  assert.equal(social.width, 1200);
  assert.equal(social.height, 630);
  assert.equal(social.format, 'png');
});
