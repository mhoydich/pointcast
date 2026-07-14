import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const V7_HELPERS = new URL('../src/lib/drum-runner-v7.ts', import.meta.url);
const V7_PAGE = new URL('../src/pages/drum-runner.astro', import.meta.url);
const V6_PAGE = new URL('../src/pages/drum-runner-v6.astro', import.meta.url);
const DRUM_GAMES = new URL('../src/lib/drum-games.ts', import.meta.url);
const DRUM_GAMES_PAGE = new URL('../src/pages/drum-games.astro', import.meta.url);

const {
  SIEGE_BEST_KEY,
  SIEGE_LANE_META,
  SIEGE_LANE_ORDER,
  SIEGE_LOOP_STEPS,
  SIEGE_STEP_BEATS,
  SIEGE_WAVES,
  absoluteStepAtTime,
  applyAttack,
  audioTimeForPerformanceTimestamp,
  buildWaveEnemies,
  echoEventsForBar,
  gradeLoopHit,
  laneForKey,
  loopStepAtTime,
  powerupForKills,
  recordLoopHit,
  resolveEnemyDeadlines,
  secondsPerBeat,
} = await import(V7_HELPERS);

const [v7Source, v6Source, gamesSource, gamesPageSource] = await Promise.all([
  readFile(V7_PAGE, 'utf8'),
  readFile(V6_PAGE, 'utf8'),
  readFile(DRUM_GAMES, 'utf8'),
  readFile(DRUM_GAMES_PAGE, 'utf8'),
]);

function closeTo(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} should be within ${epsilon} of ${expected}`);
}

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const open = source.indexOf('{', start);
  assert.notEqual(open, -1, `missing body for ${name}`);
  let depth = 0;
  for (let index = open; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}') depth--;
    if (depth === 0) return source.slice(open + 1, index);
  }
  assert.fail(`unterminated body for ${name}`);
}

test('Loop Siege authors four deterministic waves with a rising musical pace', () => {
  assert.deepEqual(SIEGE_WAVES.map((wave) => wave.bpm), [132, 148, 164, 180]);
  assert.deepEqual(SIEGE_WAVES.map((wave) => wave.noteBudget), [16, 14, 12, 12]);
  assert.equal(new Set(SIEGE_WAVES.map((wave) => wave.id)).size, 4);

  const allLanes = new Set();
  const enemyCounts = [];
  for (const wave of SIEGE_WAVES) {
    const enemies = buildWaveEnemies(wave);
    assert.deepEqual(enemies, buildWaveEnemies(wave), `${wave.name} enemy schedule must be reproducible`);
    assert.ok(enemies.length > 0, `${wave.name} needs enemies`);
    assert.equal(new Set(enemies.map((enemy) => enemy.id)).size, enemies.length);
    assert.ok(enemies.every((enemy) => SIEGE_LANE_ORDER.includes(enemy.lane)));
    assert.ok(enemies.every((enemy) => Number.isInteger(enemy.spawnBeat / SIEGE_STEP_BEATS)));
    assert.ok(enemies.every((enemy) => Number.isInteger(enemy.deadlineBeat / SIEGE_STEP_BEATS)));
    assert.ok(enemies.every((enemy) => enemy.deadlineBeat > enemy.spawnBeat));
    assert.ok(enemies.every((enemy) => enemy.deadlineBeat - enemy.spawnBeat <= 3.5), 'gate pressure must demand active lane choices');
    assert.ok(enemies.every((enemy) => Number.isInteger(enemy.hp) && enemy.hp > 0));
    enemies.forEach((enemy) => allLanes.add(enemy.lane));
    enemyCounts.push(enemies.length);
  }

  assert.deepEqual(allLanes, new Set(SIEGE_LANE_ORDER));
  for (let index = 1; index < enemyCounts.length; index++) {
    assert.ok(enemyCounts[index] >= enemyCounts[index - 1], 'later waves should not become emptier');
  }
});

test('the loop is sixteen free-choice eighth-note cells on the audio timeline', () => {
  assert.equal(SIEGE_LOOP_STEPS, 16);
  assert.equal(SIEGE_STEP_BEATS, 0.5);

  const bpm = 148;
  const start = 20;
  const stepSeconds = secondsPerBeat(bpm) * SIEGE_STEP_BEATS;
  for (let step = 0; step < SIEGE_LOOP_STEPS; step++) {
    assert.equal(loopStepAtTime(start + step * stepSeconds, start, bpm), step);
  }
  assert.equal(loopStepAtTime(start + SIEGE_LOOP_STEPS * stepSeconds, start, bpm), 0, 'the next loop starts at cell zero');
  assert.equal(absoluteStepAtTime(start + stepSeconds * 0.75, start, bpm), 0, 'the transport must not advance before the audio tick');
  assert.equal(absoluteStepAtTime(start + stepSeconds, start, bpm), 1, 'the transport advances on the audio tick');

  const earlySide = gradeLoopHit(start + stepSeconds * 0.49, start, bpm);
  const lateSide = gradeLoopHit(start + stepSeconds * 0.51, start, bpm);
  assert.equal(earlySide.step, 0, 'input judgment snaps to the nearest cell before the midpoint');
  assert.equal(lateSide.step, 1, 'input judgment snaps to the nearest cell after the midpoint');
  assert.equal(gradeLoopHit(start + stepSeconds * 0.4, start, bpm).grade, 'late', 'loose hits must affect the final grade');

  let pattern = [];
  pattern = recordLoopHit(pattern, 'west', 6);
  pattern = recordLoopHit(pattern, 'north', 6);
  pattern = recordLoopHit(pattern, 'east', 1);
  pattern = recordLoopHit(pattern, 'west', 6);
  assert.deepEqual(pattern, [
    { lane: 'east', step: 1 },
    { lane: 'west', step: 6 },
    { lane: 'north', step: 6 },
  ], 'a cell may hold a chord, while duplicate lane hits remain one ghost attack');

  assert.throws(() => recordLoopHit(pattern, 'west', -1), /step/i);
  assert.throws(() => recordLoopHit(pattern, 'west', SIEGE_LOOP_STEPS), /step/i);
});

test('the following loop replays the recorded rhythm as precisely timed ghost attacks', () => {
  const pattern = [
    { lane: 'west', step: 0 },
    { lane: 'east', step: 3 },
    { lane: 'north', step: 15 },
  ];
  const barStart = 30;
  const bpm = 164;
  const echoes = echoEventsForBar(pattern, barStart, bpm);
  assert.deepEqual(echoes, echoEventsForBar(pattern, barStart, bpm), 'echo scheduling must be deterministic');
  assert.deepEqual(echoes.map(({ lane, step }) => ({ lane, step })), pattern);
  echoes.forEach((echo, index) => {
    closeTo(echo.hitTime, barStart + pattern[index].step * secondsPerBeat(bpm) * SIEGE_STEP_BEATS);
    assert.equal(echo.ghost, true);
  });

  assert.match(v7Source, /recordLoopHit\(/);
  assert.match(v7Source, /echoEventsForBar\(/);
  assert.match(v7Source, /ghost/i);
  assert.doesNotMatch(v7Source, /Math\.random\(\)/, 'the player loop and enemy schedule must not drift between runs');
});

test('lane attacks damage only their lane and dead enemies cannot breach the shields', () => {
  const enemy = {
    id: 'test-west',
    lane: 'west',
    spawnBeat: 0,
    deadlineBeat: 4,
    hp: 2,
    breached: false,
  };

  assert.deepEqual(applyAttack(enemy, 'east', 1), enemy, 'a different lane cannot damage the enemy');
  const wounded = applyAttack(enemy, 'west', 1);
  assert.equal(wounded.hp, 1);
  assert.equal(wounded.dead, false);
  const dead = applyAttack(wounded, 'west', 1);
  assert.equal(dead.hp, 0);
  assert.equal(dead.dead, true);

  const early = resolveEnemyDeadlines([enemy], 3.5, 4);
  assert.equal(early.shields, 4);
  assert.equal(early.breaches, 0);

  const breach = resolveEnemyDeadlines([enemy], 4, 4);
  assert.equal(breach.shields, 3);
  assert.equal(breach.breaches, 1);
  const alreadyResolved = resolveEnemyDeadlines(breach.enemies, 8, breach.shields);
  assert.equal(alreadyResolved.shields, 3, 'one enemy may damage the player at most once');
  assert.equal(alreadyResolved.breaches, 0);

  const cleared = resolveEnemyDeadlines([dead], 8, 4);
  assert.equal(cleared.shields, 4);
  assert.equal(cleared.breaches, 0);
});

test('powerups are earned deterministically from kills rather than timers or randomness', () => {
  const firstPass = Array.from({ length: 49 }, (_, kills) => powerupForKills(kills));
  const secondPass = Array.from({ length: 49 }, (_, kills) => powerupForKills(kills));
  assert.deepEqual(firstPass, secondPass);
  assert.equal(firstPass[0], null);
  const drops = firstPass.filter(Boolean);
  assert.ok(drops.length >= 3, 'a full run should award several powerups');
  assert.ok(new Set(drops).size >= 2, 'gameplay should produce more than one tactical option');
  assert.ok(drops.every((drop) => typeof drop === 'string'));

  assert.match(v7Source, /powerupForKills\(/);
  assert.match(v7Source, /kills/);
  assert.doesNotMatch(v7Source, /setInterval\([^)]*power/i, 'powerups should come from combat, not passive waiting');
});

test('event timestamps and every game system share one AudioContext clock', () => {
  closeTo(audioTimeForPerformanceTimestamp(8, 1000, 1025), 8.025);
  closeTo(audioTimeForPerformanceTimestamp(8, 1000, 975), 7.975);
  closeTo(audioTimeForPerformanceTimestamp(8, 1000, 1025, 15), 8.01);
  assert.ok(Number.isNaN(audioTimeForPerformanceTimestamp(Number.NaN, 1000, 1025)));

  const clock = functionBody(v7Source, 'siegeAudioNow');
  const input = functionBody(v7Source, 'performLane');
  const frame = functionBody(v7Source, 'runFrame');
  const draw = functionBody(v7Source, 'drawSiege');

  assert.match(clock, /getOutputTimestamp/);
  assert.match(clock, /actx\.currentTime/);
  assert.match(clock, /compensatedAudioTime/);
  assert.doesNotMatch(v7Source, /performance\.now\(\)/, 'wall-clock time must never become gameplay time');

  assert.match(input, /siegeInputTime\(eventTime\)/);
  assert.match(input, /playLane\(/, 'every attack should sound when the player makes it');
  assert.match(input, /gradeLoopHit\(/);
  assert.match(input, /const step=timing\.step/);
  assert.match(input, /quantizedLoop>activeLoopOrdinal/);
  assert.match(input, /targetPattern\.length>=currentWave\(\)\.noteBudget/);
  assert.match(input, /showJudge\('LOOP FULL'/);
  assert.match(v7Source, /recordPattern=pendingPattern;pendingPattern=\[\]/, 'a hit quantized across the loop edge must still wait one full loop before ghosting');
  assert.match(input, /recordLoopHit\(/);

  assert.match(frame, /const now = siegeAudioNow\(\)/);
  assert.match(frame, /resolveEnemyDeadlines\(/);
  assert.match(frame, /drawSiege\(now\)/);
  assert.doesNotMatch(draw, /siegeAudioNow\(\)/, 'drawing should reuse the frame clock sample');
  assert.match(v7Source, /performLane\([^\n]*event\.timeStamp\)/, 'pointer and key input need the captured event timestamp');
  assert.match(v7Source, /gradeCounts\[timing\.grade\]\+\+/);
  assert.match(v7Source, /gradeCounts\.late/, 'loose hits must lower the final run grade');
});

test('D F J K, arrows, and native pads all address the same four attack lanes', () => {
  assert.deepEqual(SIEGE_LANE_ORDER, ['west', 'north', 'south', 'east']);
  assert.deepEqual(SIEGE_LANE_ORDER.map((lane) => SIEGE_LANE_META[lane].key), ['D', 'F', 'J', 'K']);
  assert.deepEqual(SIEGE_LANE_ORDER.map((lane) => SIEGE_LANE_META[lane].arrowKey), [
    'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight',
  ]);
  assert.deepEqual(
    ['d', 'f', 'j', 'k', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'].map(laneForKey),
    ['west', 'north', 'south', 'east', 'west', 'north', 'south', 'east'],
  );
  assert.equal(laneForKey('Space'), null);

  assert.match(v7Source, /<div class="siege__pads" role="group"[^>]*aria-label=/);
  assert.match(v7Source, /SIEGE_LANE_ORDER\.map\(\(lane\) =>/);
  assert.match(v7Source, /<button[\s\S]*?type="button"[\s\S]*?data-lane=\{lane\}[\s\S]*?aria-label=/);
  assert.match(v7Source, /aria-keyshortcuts=\{`\$\{SIEGE_LANE_META\[lane\]\.key\} \$\{SIEGE_LANE_META\[lane\]\.arrowKey\}`\}/);
  assert.match(v7Source, /role="status" aria-live="polite"/);
  assert.match(v7Source, /<canvas[\s\S]*?role="img"[\s\S]*?aria-label=/);

  const pointer = v7Source.match(/button\.addEventListener\('pointerdown',[\s\S]*?\n\s*\}\);/)?.[0] ?? '';
  assert.match(pointer, /event\.pointerType === 'mouse' && event\.button !== 0/);
  assert.match(pointer, /event\.preventDefault\(\)/);
  assert.match(pointer, /performLane\(button\.dataset\.lane as SiegeLane, event\.timeStamp\)/);
  assert.doesNotMatch(pointer, /isPrimary/, 'two-finger lane attacks need secondary touches');
  assert.match(v7Source, /if \(event\.repeat \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return/);
  assert.match(v7Source, /const lane = laneForKey\(event\.key\)/);

  assert.match(v7Source, /\.siege__pads \{[\s\S]*?touch-action: none/);
  assert.match(v7Source, /\.siege__pad \{[\s\S]*?min-height: (?:7[2-9]|[89]\d)px[\s\S]*?touch-action: none/);
  assert.match(v7Source, /@media \(max-width: 700px\)[\s\S]*?\.siege__pads \{[\s\S]*?grid-template-columns: repeat\(2,\s*1fr\)/);
  assert.match(v7Source, /height:clamp\(300px,calc\(100dvh - 328px\),500px\)/, 'the playfield should clear the fixed mobile pad tray');
  assert.match(v7Source, /padButtons\[0\]\?\.focus\(\{preventScroll:true\}\)/, 'focus should enter the live controls when play begins');
  assert.match(v7Source, /goButton\.focus\(\{preventScroll:true\}\)/, 'focus should return to the retry control after failure');
  assert.match(v7Source, /overflow-x: hidden/);
});

test('local best storage is guarded and v7 discovery keeps v6 playable', () => {
  assert.equal(SIEGE_BEST_KEY, 'pc-drum-runner-v7-best');
  const readStorage = functionBody(v7Source, 'readStorage');
  const writeStorage = functionBody(v7Source, 'writeStorage');
  assert.match(readStorage, /try[\s\S]*localStorage\.getItem\(key\)[\s\S]*catch[\s\S]*return null/);
  assert.match(writeStorage, /try[\s\S]*localStorage\.setItem\(key, value\)[\s\S]*catch/);
  assert.equal((v7Source.match(/localStorage\.getItem\(/g) ?? []).length, 1, 'all reads should use the safe wrapper');
  assert.equal((v7Source.match(/localStorage\.setItem\(/g) ?? []).length, 1, 'all writes should use the safe wrapper');
  assert.match(v7Source, /writeStorage\(SIEGE_BEST_KEY, String\(best\)\)/);
  assert.doesNotMatch(v7Source, /if\(source==='live'\)score\+=/, 'empty-lane mashing must not farm points');
  assert.match(v7Source, /stopScheduled\(\);setPhase\('interstitial'\)/, 'ghost audio must stop when combat stops');
  assert.match(v7Source, /dropReady=value\.dropReady/, 'earned DROP should survive wave transitions and retries');

  assert.match(v7Source, /Beat Runner v7[^\n]*Loop Siege/);
  assert.match(v6Source, /Beat Runner v6[^\n]*Pulse Arena/);
  assert.match(gamesSource, /id: 'v7', name: 'Loop Siege', path: '\/drum-runner'/);
  assert.match(gamesSource, /bestKey: 'pc-drum-runner-v7-best'/);
  assert.match(gamesSource, /id: 'v6', name: 'Pulse Arena', path: '\/drum-runner-v6'/);
  assert.match(gamesPageSource, /Loop Siege/i);
});
