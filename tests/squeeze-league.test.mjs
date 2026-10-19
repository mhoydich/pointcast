import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('The Squeeze desk transcribes the PTL screenshots and does not invent a result', async () => {
  const league = JSON.parse(await read('src/data/squeeze-league.json'));
  assert.equal(league.schema, 'pointcast.squeeze-league/v1');
  assert.equal(league.block, '0699');
  assert.equal(league.officialPtlPage, false);
  assert.equal(league.affiliate, false);
  assert.equal(league.monetization, false);
  assert.equal(league.team.name, 'The Squeeze');
  assert.equal(league.team.rank, 5);
  assert.equal(league.team.duprDisplay, '18.124');
  assert.equal(league.team.matchupsPlayed, 2);
  assert.equal(league.league.division, 'Mixed 4.0');
  assert.equal(league.league.season, 'Fall 2026');
  assert.equal(league.homeCourt, 'El Segundo Recreation Park Sports Courts');
  assert.deepEqual(league.roster.map((player) => player.name), [
    'Michael Hoydich',
    'Morgan Fukunaga Hoydich',
  ]);
  assert.match(league.rosterNote, /do not list players/i);

  const stats = league.stats;
  assert.equal(stats.points.earned, 202);
  assert.equal(stats.points.allowed, 200);
  assert.equal(stats.points.diffDisplay, '+2');
  assert.equal(stats.points.pdPercentDisplay, '0.5');
  assert.deepEqual(stats.matchups.wins, { regular: 1, tiebreak: 0, total: 1 });
  assert.deepEqual(stats.matchups.losses, { regular: 1, tiebreak: 0, total: 1 });
  assert.deepEqual(stats.matches, { wins: 12, losses: 12, diff: 0 });
  assert.deepEqual(stats.games, { wins: 12, losses: 12, diff: 0 });
  assert.equal(stats.matchupWinPercent, '50.00%');
  assert.equal(stats.matchWinPercent, '50.00%');
  assert.equal(stats.gameWinPercent, '50.00%');
  assert.equal(stats.pointsEarnedPercent, '50.25%');
  assert.equal(stats.avgOpponentTeamRatingDisplay, '29.701');

  assert.equal(league.results.length, 2);
  assert.equal(league.results[0].date, '2026-09-16');
  assert.equal(league.results[0].winner, 'Approach Pickleball');
  assert.equal(league.results[0].away.pdPercentDisplay, '9.09');
  assert.equal(league.results[0].home.name, 'The Squeeze');
  assert.equal(league.results[0].home.pdPercentDisplay, '-9.09');
  assert.deepEqual(league.results[0].teamPoints, [7, 5]);
  assert.equal(league.results[1].date, '2026-09-30');
  assert.equal(league.results[1].winner, 'The Squeeze');
  assert.equal(league.results[1].away.pdPercentDisplay, '10.61');
  assert.equal(league.results[1].home.name, 'Beach Bangers');
  assert.equal(league.results[1].home.pdPercentDisplay, '-10.61');
  assert.deepEqual(league.results[1].teamPoints, [7, 5]);
  for (const match of league.results) {
    assert.equal(match.games, undefined);
    assert.equal(match.lineScore, undefined);
  }

  assert.deepEqual(
    league.upcoming.map((game) => [game.date, game.time, game.away.name, game.away.rankDisplay, game.home.name, game.home.rankDisplay]),
    [
      ['2026-10-07', '6:00 PM PDT', "Carpe Dink'em", '#6', 'The Squeeze', '#5'],
      ['2026-10-14', '6:00 PM PDT', 'The Squeeze', '#5', 'Eleven MXD', '#3'],
      ['2026-10-21', '6:00 PM PDT', 'Dink Life', '#1', 'The Squeeze', '#5'],
      ['2026-10-28', '6:00 PM PDT', 'The Squeeze', '#5', 'Unforced Terrors', '#7'],
    ],
  );
  for (const game of league.upcoming) {
    assert.equal(game.court, 'El Segundo Recreation Park Sports Courts');
    assert.equal(game.winner, undefined);
    assert.equal(game.teamPoints, undefined);
  }

  assert.deepEqual(
    league.standings.rows.map((row) => [row.rank, row.team, row.points, row.matchupsPlayed, row.winsTotal, row.losses, row.pointsPerMatchup]),
    [
      [1, 'Dink Life', 28, 3, 3, 0, '9.33'],
      [2, 'Approach Pickleball', 19, 3, 2, 1, '6.33'],
      [3, 'Eleven MXD', 18, 2, 2, 0, '9.00'],
      [4, 'Beach Bangers', 17, 3, 1, 2, '5.67'],
      [5, 'The Squeeze', 12, 2, 1, 1, '6.00'],
      [6, "Carpe Dink'em", 11, 3, 0, 3, '3.67'],
      [7, 'Unforced Terrors', 3, 2, 0, 2, '1.50'],
    ],
  );
  assert.ok(league.omitted.some((line) => /last-match/i.test(line)));
});

test('the page, JSON twin, block, and discovery all point at the same desk', async () => {
  const [page, twin, blockText, sitemap, llms, llmsFull, today, apps, surfaces, agents, board, local, town, townJson] = await Promise.all([
    read('src/pages/pickleball/the-squeeze.astro'),
    read('src/pages/pickleball/the-squeeze.json.ts'),
    read('src/content/blocks/0699.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/data/new-today.json'),
    read('src/lib/pointcast-apps.ts'),
    read('src/data/agent-surfaces.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/pickleball.astro'),
    read('src/pages/local.astro'),
    read('src/pages/town.astro'),
    read('src/pages/town.json.ts'),
  ]);
  assert.match(page, /squeeze-league\.json/);
  assert.match(page, /No affiliate links/);
  assert.match(page, /not an official PTL page/i);
  assert.match(twin, /squeeze-league\.json/);
  const block = JSON.parse(blockText);
  assert.equal(block.id, '0699');
  assert.equal(block.channel, 'CRT');
  assert.equal(block.type, 'LINK');
  assert.equal(block.author, 'guest');
  assert.equal(block.external.url, 'https://pointcast.xyz/pickleball/the-squeeze/');
  assert.equal(block.meta.location, 'El Segundo Recreation Park');
  assert.equal(block.meta.officialPtlPage, false);
  assert.match(sitemap, /pointcast\.xyz\/pickleball\/the-squeeze\/'/);
  assert.match(sitemap, /pointcast\.xyz\/pickleball\/the-squeeze\.json'/);
  for (const file of [llms, llmsFull]) {
    assert.match(file, /https:\/\/pointcast\.xyz\/pickleball\/the-squeeze\//);
    assert.match(file, /https:\/\/pointcast\.xyz\/pickleball\/the-squeeze\.json/);
    assert.match(file, /Not an official PTL page/);
  }
  const strip = JSON.parse(today);
  assert.equal(strip[0].link, '/pickleball/the-squeeze/');
  assert.equal(strip[0].block, '0699');
  assert.ok(strip[0].title.length <= 28);
  assert.ok(strip[0].kicker.length <= 21);
  assert.match(apps, /slug: 'the-squeeze'/);
  assert.match(surfaces, /theSqueeze: 'https:\/\/pointcast\.xyz\/pickleball\/the-squeeze\/'/);
  assert.match(surfaces, /theSqueeze: 'https:\/\/pointcast\.xyz\/pickleball\/the-squeeze\.json'/);
  assert.match(agents, /theSqueeze: AGENT_SURFACES\.human\.theSqueeze/);
  assert.match(agents, /theSqueeze: AGENT_SURFACES\.json\.theSqueeze/);
  assert.match(board, /href="\/pickleball\/the-squeeze\/"/);
  assert.match(local, /href="\/pickleball\/the-squeeze\/"/);
  assert.match(town, /href="\/pickleball\/the-squeeze\/"/);
  assert.match(townJson, /\/pickleball\/the-squeeze\//);
  assert.doesNotMatch(page, /shopify|amazon\.com|go\.magik\.ly|utm_/i);
});
