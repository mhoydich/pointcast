import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const APP_PATH = new URL('../public/games/nouns-nation-battler/app.js', import.meta.url);
const DESK_PATH = new URL('../public/games/nouns-nation-battler/desk/desk.js', import.meta.url);

function resultScore(winnerSide, leftAlive, rightAlive, scoreOverride = null) {
  if (scoreOverride) {
    return {
      winnerScore: Math.max(1, Math.round(scoreOverride.winnerScore || 0)),
      loserScore: Math.max(0, Math.round(scoreOverride.loserScore || 0)),
    };
  }
  const winnerAlive = winnerSide === 0 ? leftAlive : rightAlive;
  return {
    winnerScore: Math.max(1, Math.round(winnerAlive || 0)),
    loserScore: Math.max(0, Math.round(30 - (winnerAlive || 0))),
  };
}

test('live battle scoring derives the losing score from the winner survivor count', () => {
  assert.deepEqual(resultScore(0, 22, 0), { winnerScore: 22, loserScore: 8 });
  assert.deepEqual(resultScore(1, 0, 17), { winnerScore: 17, loserScore: 13 });
});

test('quick sim scoring preserves the simulated final score', () => {
  assert.deepEqual(
    resultScore(0, 24, 11, { winnerScore: 24, loserScore: 11 }),
    { winnerScore: 24, loserScore: 11 }
  );
  assert.deepEqual(
    resultScore(1, 7, 19, { winnerScore: 19, loserScore: 7 }),
    { winnerScore: 19, loserScore: 7 }
  );
});

test('browser battler wires quick sim overrides into league results', async () => {
  const source = await readFile(APP_PATH, 'utf8');

  assert.match(source, /function resultScore\(winnerSide, leftAlive, rightAlive, scoreOverride = null\)/);
  assert.match(source, /function applyLeagueResult\(winnerSide, loserSide, leftAlive, rightAlive, source = "live", scoreOverride = null\)/);
  assert.match(source, /applyLeagueResult\([\s\S]*"quick",[\s\S]*\{ winnerScore, loserScore \}[\s\S]*\);/);
});

test('Desk Wall card links canonicalize localhost shares to PointCast', async () => {
  const source = await readFile(DESK_PATH, 'utf8');

  assert.match(source, /const CANONICAL_DESK_URL = "https:\/\/pointcast\.xyz\/games\/nouns-nation-battler\/desk\/";/);
  assert.match(source, /current\.hostname === "localhost" \|\| current\.hostname === "127\.0\.0\.1"/);
  assert.match(source, /params\.set\("view", "card"\)/);
});
