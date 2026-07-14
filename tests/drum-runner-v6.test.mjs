import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const V6_HELPERS = new URL('../src/lib/drum-runner-v6.ts', import.meta.url);
const V6_PAGE = new URL('../src/pages/drum-runner.astro', import.meta.url);
const DRUM_GAMES = new URL('../src/lib/drum-games.ts', import.meta.url);
const DRUM_GAMES_PAGE = new URL('../src/pages/drum-games.astro', import.meta.url);
const DRUM_PRESS_PAGE = new URL('../src/pages/drum-press.astro', import.meta.url);

const {
  ARENA_APPROACH_BEATS,
  ARENA_ROUNDS,
  CHORD_WINDOW_MS,
  HIT_WINDOWS_MS,
  LANE_META,
  LANE_ORDER,
  approachProgress,
  approachSecondsForRound,
  advanceShieldRepair,
  arenaTravelProgress,
  audioTimeForPerformanceTimestamp,
  buildRoundCues,
  chordSpanMs,
  compensatedAudioTime,
  countInDisplay,
  findHittableCue,
  gradeHit,
  laneForKey,
  roundDurationSeconds,
  runtimeCues,
  worstGrade,
} = await import(V6_HELPERS);

const [v6Source, gamesSource, gamesPageSource, pressSource] = await Promise.all([
  readFile(V6_PAGE, 'utf8'),
  readFile(DRUM_GAMES, 'utf8'),
  readFile(DRUM_GAMES_PAGE, 'utf8'),
  readFile(DRUM_PRESS_PAGE, 'utf8'),
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

test('Pulse Arena authors valid deterministic rounds with strictly increasing pace', () => {
  assert.deepEqual(ARENA_ROUNDS.map((round) => round.bpm), [126, 140, 154, 168]);
  assert.equal(new Set(ARENA_ROUNDS.map((round) => round.id)).size, 4);

  const onsetCounts = [];
  const laneCounts = [];
  const onsetRates = [];
  const laneRates = [];
  const authoredKinds = new Set();

  for (const round of ARENA_ROUNDS) {
    assert.ok(round.bars.every((bar) => bar.trim().split(/\s+/).length === 8), `${round.name} bars need eight eighth-note slots`);
    const cues = buildRoundCues(round);
    assert.deepEqual(cues, buildRoundCues(round), `${round.name} expansion must be deterministic`);
    assert.ok(cues.length > 0);
    assert.deepEqual(new Set(cues.map((cue) => cue.lane)), new Set(LANE_ORDER));
    assert.ok(cues.every((cue) => Number.isFinite(cue.beat) && cue.beat >= 0 && cue.beat < round.bars.length * 4));
    assert.ok(cues.every((cue) => Number.isInteger(cue.beat * 2)), `${round.name} cues must stay on the eighth-note grid`);

    const groups = Map.groupBy(cues, (cue) => cue.groupId);
    for (const group of groups.values()) {
      assert.ok(group.length >= 1 && group.length <= 2, `${round.name} groups must be one- or two-hand actions`);
      assert.equal(new Set(group.map((cue) => cue.beat)).size, 1);
      assert.equal(new Set(group.map((cue) => cue.lane)).size, group.length);
      assert.ok(group.every((cue) => group.length === 2 ? cue.kind === 'chord' : cue.kind === 'single' || cue.kind === 'roll'));
      group.forEach((cue) => authoredKinds.add(cue.kind));
    }

    const sorted = [...cues].sort((a, b) => a.beat - b.beat || LANE_ORDER.indexOf(a.lane) - LANE_ORDER.indexOf(b.lane));
    assert.deepEqual(cues, sorted, `${round.name} cues must be ordered by beat then lane`);
    const duration = roundDurationSeconds(round);
    onsetCounts.push(groups.size);
    laneCounts.push(cues.length);
    onsetRates.push(groups.size / duration);
    laneRates.push(cues.length / duration);
  }

  assert.deepEqual(onsetCounts, [24, 32, 38, 47]);
  assert.deepEqual(laneCounts, [24, 36, 42, 56]);
  for (const rates of [onsetRates, laneRates]) {
    for (let index = 1; index < rates.length; index++) {
      assert.ok(rates[index] > rates[index - 1], `pace must rise: ${rates.map((rate) => rate.toFixed(2)).join(' → ')}`);
    }
  }
  assert.deepEqual(authoredKinds, new Set(['single', 'chord', 'roll']));
});

test('three-beat approaches accelerate while targets remain on one absolute audio timeline', () => {
  assert.equal(ARENA_APPROACH_BEATS, 3);
  const approaches = ARENA_ROUNDS.map(approachSecondsForRound);
  approaches.forEach((seconds, index) => closeTo(seconds, 3 * 60 / ARENA_ROUNDS[index].bpm));
  for (let index = 1; index < approaches.length; index++) assert.ok(approaches[index] < approaches[index - 1]);

  const startTime = 12.5;
  for (const round of ARENA_ROUNDS) {
    const cues = runtimeCues(round, startTime);
    for (const cue of cues) closeTo(cue.hitTime, startTime + cue.beat * 60 / round.bpm);
    const sample = cues[Math.floor(cues.length / 2)];
    const approach = approachSecondsForRound(round);
    closeTo(approachProgress(sample.hitTime, sample.hitTime - approach, approach), 0);
    closeTo(approachProgress(sample.hitTime, sample.hitTime - approach / 2, approach), 0.5);
    closeTo(approachProgress(sample.hitTime, sample.hitTime, approach), 1);
  }

  closeTo(compensatedAudioTime(10, 0.05, 15), 9.935);
  closeTo(compensatedAudioTime(10, 9, 999), 9.6, 1e-12, 'latency and sync compensation should be safely clamped');
});

test('event timestamps map through the AudioContext output timestamp', () => {
  closeTo(audioTimeForPerformanceTimestamp(8, 1000, 1025), 8.025);
  closeTo(audioTimeForPerformanceTimestamp(8, 1000, 975), 7.975);
  closeTo(audioTimeForPerformanceTimestamp(8, 1000, 1025, 15), 8.01);
  assert.ok(Number.isNaN(audioTimeForPerformanceTimestamp(Number.NaN, 1000, 1025)));
  assert.ok(Number.isNaN(audioTimeForPerformanceTimestamp(8, Number.NaN, 1025)));
  assert.ok(Number.isNaN(audioTimeForPerformanceTimestamp(8, 1000, Number.NaN)));

  assert.match(v6Source, /getOutputTimestamp\?\.\(\)/);
  assert.match(v6Source, /stamp\.contextTime/);
  assert.match(v6Source, /stamp\.performanceTime/);
  assert.match(v6Source, /audioTimeForPerformanceTimestamp\([\s\S]*?eventTime/);
  assert.match(v6Source, /performLane\([^)]*eventTime/);
  assert.match(v6Source, /performLane\([^\n]*event\.timeStamp\)/, 'pointer, click, and key events should pass their captured event timestamp');
});

test('dense targets keep visual spacing with ease-in travel and a clamped three-count', () => {
  const samples = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map(arenaTravelProgress);
  assert.equal(samples[0], 0);
  assert.equal(samples.at(-1), 1);
  for (let index = 1; index < samples.length; index++) assert.ok(samples[index] > samples[index - 1]);
  assert.ok(arenaTravelProgress(0.5) < 0.5, 'targets should ease in rather than rush outward and collapse near the core');
  const denseGap = arenaTravelProgress(0.9) - arenaTravelProgress(0.8);
  const oldEaseOutGap = (1 - (1 - 0.9) ** 2) - (1 - (1 - 0.8) ** 2);
  assert.ok(denseGap > oldEaseOutGap * 3, 'adjacent dense cues need materially more separation than the old ease-out curve');
  assert.equal(arenaTravelProgress(-1), 0);
  assert.equal(arenaTravelProgress(2), 1);

  assert.equal(countInDisplay(10, 0, 1), '3', 'long initialization delays must never display more than three');
  assert.equal(countInDisplay(10, 7, 1), '3');
  assert.equal(countInDisplay(10, 8.1, 1), '2');
  assert.equal(countInDisplay(10, 9.1, 1), '1');
  assert.equal(countInDisplay(10, 10, 1), 'GO');
  assert.equal(countInDisplay(10, 12, 1), 'GO');

  assert.match(v6Source, /const eased = arenaTravelProgress\(progress\)/);
  assert.doesNotMatch(v6Source, /1 - \(1 - progress\) \*\* 2/, 'the old ease-out collapse must stay removed');
  assert.match(v6Source, /flashEl\.textContent = countInDisplay\(roundStart, now, currentBeatSeconds\(\)\)/);
});

test('hit windows, nearest-lane selection, and chord grading are deterministic', () => {
  assert.deepEqual(HIT_WINDOWS_MS, { perfect: 45, great: 90, good: 125 });
  const cases = [
    [0, 'perfect'], [45, 'perfect'], [-45, 'perfect'],
    [45.001, 'great'], [-45.001, 'great'], [90, 'great'], [-90, 'great'],
    [90.001, 'good'], [-90.001, 'good'], [125, 'good'], [-125, 'good'],
    [125.001, 'miss'], [-125.001, 'miss'],
  ];
  for (const [delta, grade] of cases) assert.equal(gradeHit(delta), grade, `${delta}ms should be ${grade}`);

  const cues = [
    { id: 'west-a', groupId: 'a', beat: 0, lane: 'west', kind: 'single', hitTime: 10 },
    { id: 'north-a', groupId: 'b', beat: 0, lane: 'north', kind: 'single', hitTime: 10.04 },
    { id: 'west-b', groupId: 'c', beat: 0, lane: 'west', kind: 'single', hitTime: 10.2 },
    { id: 'west-judged', groupId: 'd', beat: 0, lane: 'west', kind: 'single', hitTime: 10.11, judged: true },
  ];
  assert.equal(findHittableCue(cues, 'west', 10.08)?.cue.id, 'west-a');
  assert.equal(findHittableCue(cues, 'west', 10.12)?.cue.id, 'west-b');
  assert.equal(findHittableCue(cues, 'north', 10.04)?.cue.id, 'north-a');
  assert.equal(findHittableCue(cues, 'east', 10.04), null);
  assert.equal(findHittableCue(cues, 'west', 9.874), null);
  const tied = findHittableCue(cues, 'west', 10.1)?.cue.id;
  assert.equal(findHittableCue(cues, 'west', 10.1)?.cue.id, tied, 'ties must resolve consistently');

  assert.equal(CHORD_WINDOW_MS, 75);
  closeTo(chordSpanMs([
    { ...cues[0], pressedAt: 20 },
    { ...cues[2], pressedAt: 20.075 },
  ]), 75);
  assert.ok(chordSpanMs([
    { ...cues[0], pressedAt: 20 },
    { ...cues[2], pressedAt: 20.076 },
  ]) > CHORD_WINDOW_MS);
  assert.equal(worstGrade(['perfect', 'great']), 'great');
  assert.equal(worstGrade(['good', 'perfect']), 'good');
  assert.equal(worstGrade(['great', 'miss']), 'miss');
  assert.match(v6Source, /span <= CHORD_WINDOW_MS/);
  assert.match(v6Source, /worstGrade\(group\.map/);
  assert.match(v6Source, /resolveMiss\(group, now\)/, 'a failed chord should resolve as one group miss');
});

test('the page uses one latency-aware AudioContext sample for drawing and judgment', () => {
  const clock = functionBody(v6Source, 'arenaAudioNow');
  const startRound = functionBody(v6Source, 'startRound');
  const perform = functionBody(v6Source, 'performLane');
  const frame = functionBody(v6Source, 'runFrame');
  const draw = functionBody(v6Source, 'drawArena');

  assert.match(clock, /getOutputTimestamp/);
  assert.match(clock, /actx\.currentTime/);
  assert.match(clock, /outputLatency\(\)/);
  assert.match(clock, /compensatedAudioTime/);
  assert.doesNotMatch(v6Source, /performance\.now\(\)/, 'animation time must never become gameplay time');

  assert.match(startRound, /const approach = approachSecondsForRound\(round\)/);
  assert.match(startRound, /roundStart = arenaAudioNow\(\) \+ approach \+ \.12/);
  assert.match(startRound, /cues = runtimeCues\(round, roundStart\)/);

  assert.match(perform, /const now = arenaInputTime\(eventTime\)/);
  assert.match(perform, /findHittableCue\(cues, lane, now\)/);
  assert.match(perform, /playLane\(lane, actx\.currentTime \+ \.003, match \? 1 : \.42\)/, 'every press should make its lane sound immediately');

  assert.match(frame, /const now = arenaAudioNow\(\)/);
  assert.match(frame, /expireMisses\(now\)/);
  assert.match(frame, /drawArena\(now\)/);
  assert.match(frame, /now >= roundEnd \+ HIT_WINDOWS_MS\.good \/ 1000/);
  assert.match(draw, /approachProgress\(cue\.hitTime, now, approach\)/);
  assert.doesNotMatch(draw, /arenaAudioNow\(\)/, 'drawing must use the frame clock sample rather than sampling a second clock');
});

test('clean streaks repair shields while misses reset repair progress', () => {
  assert.deepEqual(advanceShieldRepair(3, 7, 1), { shields: 4, repairProgress: 0, repaired: true });
  assert.deepEqual(advanceShieldRepair(2, 0, 8), { shields: 3, repairProgress: 0, repaired: true });
  assert.deepEqual(advanceShieldRepair(2, 6, 2), { shields: 3, repairProgress: 0, repaired: true });
  assert.deepEqual(advanceShieldRepair(4, 7, 1), { shields: 4, repairProgress: 0, repaired: false });
  assert.deepEqual(advanceShieldRepair(3, 0, 0), { shields: 3, repairProgress: 0, repaired: false });

  const success = functionBody(v6Source, 'resolveSuccess');
  const miss = functionBody(v6Source, 'resolveMiss');
  const startRound = functionBody(v6Source, 'startRound');
  const hud = functionBody(v6Source, 'updateHud');
  assert.match(success, /advanceShieldRepair\(shields, shieldRepair, group\.length\)/);
  assert.match(success, /shields = repair\.shields/);
  assert.match(success, /shieldRepair = repair\.repairProgress/);
  assert.match(success, /repair\.repaired/);
  assert.match(miss, /shieldRepair = 0/, 'a miss must break shield-repair progress');
  assert.match(startRound, /shieldRepair = 0/);
  assert.match(hud, /shieldEl\.setAttribute\('aria-label'/);
  assert.match(hud, /\$\{shields\} of 4 shields remaining/);
});

test('storage failures are contained and hidden interstitials defer progression', () => {
  const readStorage = functionBody(v6Source, 'readStorage');
  const writeStorage = functionBody(v6Source, 'writeStorage');
  assert.match(readStorage, /try \{ return localStorage\.getItem\(key\); \} catch \{ return null; \}/);
  assert.match(writeStorage, /try \{ localStorage\.setItem\(key, value\); \} catch \{\}/);
  assert.equal((v6Source.match(/localStorage\.getItem\(/g) ?? []).length, 1, 'all reads must route through readStorage');
  assert.equal((v6Source.match(/localStorage\.setItem\(/g) ?? []).length, 1, 'all writes must route through writeStorage');
  assert.match(v6Source, /writeStorage\(ARENA_BEST_KEY, String\(best\)\)/);
  assert.match(v6Source, /writeStorage\('pc:nounId', String\(selectedNoun\)\)/);
  assert.match(v6Source, /writeStorage\(ARENA_MUTED_KEY, muted \? '1' : '0'\)/);
  assert.match(v6Source, /writeStorage\(ARENA_SYNC_KEY, String\(syncMs\)\)/);

  assert.match(v6Source, /deferredTransition/);
  const roundTransition = functionBody(v6Source, 'runRoundTransition');
  assert.match(roundTransition, /if \(document\.hidden\)/);
  assert.match(roundTransition, /deferredTransition = transition/);
  assert.match(roundTransition, /return/);
  const finishRound = functionBody(v6Source, 'finishRound');
  assert.match(finishRound, /setPhase\('interstitial'\)/);
  assert.match(finishRound, /runRoundTransition\(transition\)/);
  assert.match(v6Source, /if \(!document\.hidden && deferredTransition\)/);
  assert.match(v6Source, /visibilitychange/);
});

test('four native pads expose complete keyboard, pointer, touch, and mobile semantics', () => {
  assert.deepEqual(LANE_ORDER, ['west', 'north', 'south', 'east']);
  assert.deepEqual(LANE_ORDER.map((lane) => LANE_META[lane].key), ['D', 'F', 'J', 'K']);
  assert.deepEqual(LANE_ORDER.map((lane) => LANE_META[lane].arrowKey), ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight']);
  assert.deepEqual(
    ['d', 'f', 'j', 'k', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'].map(laneForKey),
    ['west', 'north', 'south', 'east', 'west', 'north', 'south', 'east'],
  );
  assert.equal(laneForKey('Space'), null);

  assert.match(v6Source, /<div class="arena__pads" role="group" aria-label="Pulse Arena drums">/);
  assert.match(v6Source, /LANE_ORDER\.map\(\(lane\) =>/);
  assert.match(v6Source, /<button[\s\S]*?type="button"[\s\S]*?data-lane=\{lane\}[\s\S]*?aria-label=/);
  assert.match(v6Source, /aria-keyshortcuts=\{`\$\{LANE_META\[lane\]\.key\} \$\{LANE_META\[lane\]\.arrowKey\}`\}/);
  assert.match(v6Source, /id="arena-live" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(v6Source, /id="arena-judge" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(v6Source, /id="arena-canvas"[\s\S]*?role="img"[\s\S]*?aria-label=/);

  const pointer = v6Source.match(/button\.addEventListener\('pointerdown',[\s\S]*?\n\s*\}\);/)?.[0] ?? '';
  assert.match(pointer, /event\.pointerType === 'mouse' && event\.button !== 0/);
  assert.match(pointer, /event\.preventDefault\(\)/);
  assert.match(pointer, /performLane\(button\.dataset\.lane as ArenaLane, event\.timeStamp\)/);
  assert.doesNotMatch(pointer, /isPrimary/, 'secondary touches are required for two-finger chords');
  assert.match(v6Source, /if \(event\.detail > 0\) return/);
  assert.doesNotMatch(v6Source, /pointerFired|setTimeout\([^)]*pointerFired/);
  assert.match(v6Source, /if \(event\.repeat \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return/);
  assert.match(v6Source, /const lane = laneForKey\(event\.key\)/);

  assert.match(v6Source, /\.arena__pads \{[\s\S]*?touch-action: none/);
  assert.match(v6Source, /\.arena__pad \{[\s\S]*?min-height: 88px[\s\S]*?touch-action: none/);
  assert.match(v6Source, /@media \(max-width: 700px\)[\s\S]*?\.arena__pads \{ grid-template-columns: repeat\(2,1fr\)/);
  assert.match(v6Source, /overflow-x: hidden/);
});

test('discovery consistently describes the four-lane v6 game', () => {
  assert.match(gamesSource, /id: 'v6', name: 'Pulse Arena', path: '\/drum-runner'/);
  assert.match(gamesSource, /bestKey: 'pc-drum-runner-v6-best'/);
  assert.match(gamesSource, /controls: 'Four drums · D F J K, arrows, or tap'/);
  assert.match(gamesPageSource, /fast four-lane arena/);
  assert.match(pressSource, /pulse arena · four-lane beat rush/g);
  for (const source of [gamesSource, gamesPageSource, pressSource]) assert.doesNotMatch(source, /three-action/i);
});
