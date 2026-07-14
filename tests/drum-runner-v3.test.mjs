import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import { test } from 'node:test';

const V3_LEVELS_FILE = new URL('../src/lib/drum-runner-v3-levels.json', import.meta.url);
const V3_PAGE = new URL('../src/pages/drum-runner-v3.astro', import.meta.url);
const V7_PAGE = new URL('../src/pages/drum-runner.astro', import.meta.url);
const V6_PAGE = new URL('../src/pages/drum-runner-v6.astro', import.meta.url);
const V5_PAGE = new URL('../src/pages/drum-runner-v5.astro', import.meta.url);
const V4_PAGE = new URL('../src/pages/drum-runner-v4.astro', import.meta.url);
const V2_PAGE = new URL('../src/pages/drum-runner-v2.astro', import.meta.url);
const V1_PAGE = new URL('../src/pages/drum-runner-v1.astro', import.meta.url);
const MUSIC_HELPERS = new URL('../src/lib/drum-runner-music.ts', import.meta.url);
const DRUM_GAMES = new URL('../src/lib/drum-games.ts', import.meta.url);
const JSON_ROUTE = new URL('../src/pages/drum-games.json.ts', import.meta.url);

const levels = JSON.parse(await readFile(V3_LEVELS_FILE, 'utf8'));
const v3Source = await readFile(V3_PAGE, 'utf8');
const helperSource = await readFile(MUSIC_HELPERS, 'utf8');
const { accuracyPercent, gradeBeatDelta, jumpHeightAtBeat, phraseStep } = await import(MUSIC_HELPERS);

test('Beat Runner v3 authors four increasingly musical scenes', () => {
  assert.equal(levels.length, 4);
  assert.deepEqual(levels.map((level) => level.bpm), [92, 104, 116, 128]);
  assert.deepEqual(levels.map((level) => level.music.playerVoice), ['rim', 'clap', 'tom', 'metal']);
  assert.ok(levels.some((level) => level.music.swing > 0.5), 'at least one scene should swing');
  const swingingLevel = levels.find((level) => level.music.swing > 0.5);
  assert.ok(swingingLevel.music.backing.hat.some((step) => step % 2 === 1), 'the swung scene needs audible offbeat hats');
  assert.ok(levels.slice(1).some((level) => level.obstacles.some((cue) => !Number.isInteger(cue.cueBeat))), 'later scenes should introduce offbeat cues');
});

test('every level has a coherent, reachable musical schema', () => {
  assert.equal(new Set(levels.map((level) => level.id)).size, levels.length);
  assert.equal(new Set(levels.map((level) => level.number)).size, levels.length);
  assert.equal(new Set(levels.map((level) => level.scene)).size, levels.length);
  for (const level of levels) {
    assert.ok(Number.isFinite(level.bpm) && level.bpm > 0);
    assert.ok(Number.isFinite(level.beats) && level.beats > 0);
    assert.ok(level.bass.length > 0 && level.music.scale.length > 0);
    const { bass, harmony, counterline } = level.music.stemUnlocks;
    assert.ok(0 < bass && bass < harmony && harmony < counterline);
    assert.ok(counterline <= level.obstacles.length, `${level.name} counterline must be earnable`);
    for (const pattern of Object.values(level.music.backing)) {
      assert.ok(pattern.length > 0);
      assert.ok(pattern.every((step) => Number.isInteger(step) && step >= 0 && step < 16));
    }
  }
});

test('every performed cue arrives exactly one beat before a jumpable obstacle', () => {
  const allowedKinds = new Set(['cone', 'crate', 'tall-crate', 'barrier', 'speaker', 'luggage', 'hydrant']);
  for (const level of levels) {
    assert.ok(level.obstacles.length >= 7);
    assert.ok(level.obstacles[0].cueBeat >= 5, `${level.name} needs a count-in`);
    assert.ok(level.obstacles.at(-1).beat <= level.beats - 3, `${level.name} needs a landing runway`);
    for (let index = 0; index < level.obstacles.length; index++) {
      const cue = level.obstacles[index];
      assert.equal(cue.beat - cue.cueBeat, 1, `${level.name} must apex one beat after input`);
      assert.ok(allowedKinds.has(cue.kind));
      assert.ok(cue.note >= 0 && cue.note < level.music.scale.length);
      if (index > 0) assert.ok(cue.cueBeat - level.obstacles[index - 1].cueBeat >= 3, `${level.name} cues need two flight beats plus recovery`);
    }
  }
});

test('the BPM-independent good window clears every obstacle envelope', () => {
  const dimensions = {
    cone: [26, 32], crate: [38, 44], 'tall-crate': [40, 62], barrier: [54, 41],
    speaker: [40, 55], luggage: [48, 35], hydrant: [30, 45],
  };
  const apex = 112;
  const runnerWidth = 50;
  const beatPixels = 150;
  const goodMs = 145;
  const heightAt = (beat) => {
    const progress = beat / 2;
    return progress <= 0 || progress >= 1 ? 0 : 4 * apex * progress * (1 - progress);
  };
  for (const level of levels) {
    const timingWindow = goodMs * level.bpm / 60_000;
    for (const cue of level.obstacles) {
      const [width, height] = dimensions[cue.kind];
      const collisionHalfBeats = ((runnerWidth + width) / 2) / beatPixels;
      assert.ok(heightAt(1 - collisionHalfBeats - timingWindow) >= height - 5, `${level.name} early good ${cue.kind}`);
      assert.ok(heightAt(1 + collisionHalfBeats + timingWindow) >= height - 5, `${level.name} late good ${cue.kind}`);
    }
  }
});

test('v3 timing helpers enforce exact millisecond grades and a two-beat analytic jump', () => {
  assert.match(helperSource, /PERFECT_WINDOW_MS = 65/);
  assert.match(helperSource, /GOOD_WINDOW_MS = 145/);
  assert.match(helperSource, /JUMP_BEATS = 2/);
  assert.match(helperSource, /4 \* apex \* progress \* \(1 - progress\)/);
  assert.match(helperSource, /Math\.abs\(deltaBeats\) \* 60_000 \/ bpm/);
  for (const bpm of [92, 104, 116, 128]) {
    const beatsAt = (milliseconds) => milliseconds * bpm / 60_000;
    assert.equal(gradeBeatDelta(beatsAt(65), bpm), 'perfect');
    assert.equal(gradeBeatDelta(-beatsAt(65), bpm), 'perfect');
    assert.equal(gradeBeatDelta(beatsAt(65.01), bpm), 'good');
    assert.equal(gradeBeatDelta(beatsAt(145), bpm), 'good');
    assert.equal(gradeBeatDelta(-beatsAt(145), bpm), 'good');
    assert.equal(gradeBeatDelta(beatsAt(145.01), bpm), 'offgrid');
  }
  assert.equal(jumpHeightAtBeat(0, 0), 0);
  assert.equal(jumpHeightAtBeat(1, 0), 112);
  assert.equal(jumpHeightAtBeat(2, 0), 0);
  assert.notEqual(phraseStep(5, 16, 2), phraseStep(5.5, 16, 2));
  assert.equal(accuracyPercent(10, 0, 7), 100, 'stored accuracy must be clamped');
  assert.equal(accuracyPercent(0, 0, 0), 0);
});

test('all generated background plates are checked in and compact', async () => {
  const names = ['marine-layer.webp', 'el-porto-pier.webp', 'grocery-3pm.webp', 'refinery-night.webp'];
  for (const name of names) {
    const url = new URL(`../src/assets/drum-runner-v3/${name}`, import.meta.url);
    await access(url);
    const info = await stat(url);
    assert.ok(info.size > 40_000, `${name} should contain real artwork`);
    assert.ok(info.size < 250_000, `${name} should stay under 250 KB`);
  }
});

test('v3 couples performance, transport, arrangement, and accessible controls', () => {
  assert.match(v3Source, /import levelData from '\.\.\/lib\/drum-runner-v3-levels\.json'/);
  assert.match(v3Source, /setInterval\(scheduleAhead, 25\)/);
  assert.match(v3Source, /transportStartPerf/);
  assert.match(v3Source, /playPlayerVoice/);
  assert.match(v3Source, /echoNotes\.push/);
  assert.match(v3Source, /campaignMotif\.push/);
  assert.match(v3Source, /index === LEVELS\.length - 1/);
  assert.match(v3Source, /refreshArrangement/);
  assert.match(v3Source, /jumpHeightAtBeat/);
  assert.match(v3Source, /if \(accepted \|\| runner\.grounded\)/, 'an accepted cue must restart an early jump');
  assert.match(v3Source, /actx\.state !== 'running'/, 'suspended audio must never freeze visual transport');
  assert.match(v3Source, /const judgedTargets = totalPerfect \+ totalGood \+ totalMisses/);
  assert.match(v3Source, /Math\.max\(readCompletedLevel\(\), completedLevel\)/);
  assert.match(v3Source, /aria-label="Perform beat and jump/);
  assert.match(v3Source, /id="drn-audio"[^>]*aria-pressed="false"/);
  assert.doesNotMatch(v3Source, /id="drn-judge"[^>]*aria-live/);
  assert.match(v3Source, /document\.addEventListener\('visibilitychange'/);
  assert.match(v3Source, /pauseTransport\(\)/);
  assert.match(v3Source, /resumeTransport\(\)/);
});

test('v1 through v7 remain isolated playable editions', async () => {
  const [v1, v2, v4, v5, v6, v7] = await Promise.all([V1_PAGE, V2_PAGE, V4_PAGE, V5_PAGE, V6_PAGE, V7_PAGE].map((url) => readFile(url, 'utf8')));
  assert.match(v1, /https:\/\/pointcast\.xyz\/drum-runner-v1/);
  assert.match(v2, /https:\/\/pointcast\.xyz\/drum-runner-v2/);
  assert.match(v3Source, /https:\/\/pointcast\.xyz\/drum-runner-v3/);
  assert.match(v4, /https:\/\/pointcast\.xyz\/drum-runner-v4/);
  assert.match(v5, /https:\/\/pointcast\.xyz\/drum-runner-v5/);
  assert.match(v6, /https:\/\/pointcast\.xyz\/drum-runner-v6/);
  assert.match(v7, /https:\/\/pointcast\.xyz\/drum-runner/);
  assert.match(v1, /pc-drum-runner-best/);
  assert.match(v2, /pc-drum-runner-v2-best/);
  assert.match(v3Source, /pc-drum-runner-v3-best/);
  assert.match(v4, /pc-drum-runner-v4-best/);
  assert.match(v5, /pc-drum-runner-v5-best/);
  assert.match(v6, /ARENA_BEST_KEY/);
  for (const source of [v1, v2, v3Source, v4, v5, v6, v7]) {
    assert.match(source, /href="\/drum-runner-v1"/);
    assert.match(source, /href="\/drum-runner-v2"/);
    assert.match(source, /href="\/drum-runner-v3"/);
    assert.match(source, /href="\/drum-runner-v4"/);
    assert.match(source, /href="\/drum-runner-v5"/);
    assert.match(source, /href="\/drum-runner-v6"/);
    assert.match(source, /href="\/drum-runner"/);
    assert.match(source, /<canvas/);
    assert.match(source, /type="button"/);
  }
});

test('Drum Arcade keeps one game while exposing all seven Beat Runner editions', async () => {
  const [gamesSource, jsonSource] = await Promise.all([readFile(DRUM_GAMES, 'utf8'), readFile(JSON_ROUTE, 'utf8')]);
  assert.match(gamesSource, /kicker: 'LOOP SIEGE/);
  assert.match(gamesSource, /bestKey: 'pc-drum-runner-v7-best'/);
  assert.match(gamesSource, /id: 'v7', name: 'Loop Siege', path: '\/drum-runner'/);
  assert.match(gamesSource, /id: 'v6', name: 'Pulse Arena', path: '\/drum-runner-v6'/);
  assert.match(gamesSource, /id: 'v5', name: 'Bright Miles', path: '\/drum-runner-v5'/);
  assert.match(gamesSource, /id: 'v4', name: 'Road Band', path: '\/drum-runner-v4'/);
  assert.match(gamesSource, /name: 'Pocket', path: '\/drum-runner-v3'/);
  assert.match(gamesSource, /name: 'Postcards', path: '\/drum-runner-v2'/);
  assert.match(gamesSource, /name: 'Endless', path: '\/drum-runner-v1'/);
  assert.match(jsonSource, /versions: DRUM_RUNNER_VERSIONS\.map/);
});
