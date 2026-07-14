import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const LEVELS_FILE = new URL('../src/lib/drum-runner-v4-levels.json', import.meta.url);
const V6_PAGE = new URL('../src/pages/drum-runner.astro', import.meta.url);
const V5_PAGE = new URL('../src/pages/drum-runner-v5.astro', import.meta.url);
const V4_PAGE = new URL('../src/pages/drum-runner-v4.astro', import.meta.url);
const V3_PAGE = new URL('../src/pages/drum-runner-v3.astro', import.meta.url);
const V2_PAGE = new URL('../src/pages/drum-runner-v2.astro', import.meta.url);
const V1_PAGE = new URL('../src/pages/drum-runner-v1.astro', import.meta.url);
const V4_HELPERS = new URL('../src/lib/drum-runner-v4.ts', import.meta.url);
const GAME_REGISTRY = new URL('../src/lib/drum-games.ts', import.meta.url);

const levels = JSON.parse(await readFile(LEVELS_FILE, 'utf8'));
const v4Source = await readFile(V4_PAGE, 'utf8');
const {
  POWER_UP_SPECS,
  collectPowerUp,
  consumeAcceptedPower,
  consumeGhostCharge,
  emptyPowerState,
  isPowerUpPlacementSafe,
  nounChoices,
  nounVoiceFor,
  powerUpDisplayX,
  powerStateAtBeat,
} = await import(V4_HELPERS);
const { DRUM_RUNNER_VERSIONS } = await import(GAME_REGISTRY);

test('v4 authors safe musical gear into every beat road', () => {
  assert.equal(levels.length, 4);
  const kinds = new Set();
  for (const level of levels) {
    assert.ok(level.powerUps.length >= 2, `${level.name} needs authored gear`);
    assert.deepEqual(level.powerUps, [...level.powerUps].sort((a, b) => a.beat - b.beat));
    const cueBeats = level.obstacles.map((cue) => cue.cueBeat);
    for (const powerUp of level.powerUps) {
      assert.ok(powerUp.kind in POWER_UP_SPECS);
      assert.ok(isPowerUpPlacementSafe(powerUp.beat, cueBeats, level.beats), `${level.name} ${powerUp.kind} at ${powerUp.beat}`);
      kinds.add(powerUp.kind);
    }
  }
  assert.deepEqual([...kinds].sort(), ['bass', 'ghost', 'noggles', 'tape']);
  assert.equal(powerUpDisplayX(7, 3, 89.7, 390), 360, 'mobile gear must pin inside the road at four beats');
  assert.equal(powerUpDisplayX(7, 3, 170, 1280), 770, 'wide screens should preserve world-space placement');
  assert.match(v4Source, /beatsAway > 4\.1/, 'gear must begin telegraphing four beats ahead');
  assert.match(v4Source, /rawX > x \+ 1/, 'offscreen gear needs a pinned road-edge treatment');
  assert.match(v4Source, /if \(gear && collectGear\(gear, beat\)\) return/, 'optional gear must bypass off-grid penalties');
});

test('Gold Noggles and Loop Tape each affect exactly four accepted notes', () => {
  let noggles = collectPowerUp(emptyPowerState(), 'noggles', 7);
  for (let index = 0; index < 4; index++) {
    const result = consumeAcceptedPower(noggles, 9 + index * 4);
    assert.equal(result.harmonyDouble, true);
    assert.equal(result.tapeRecord, false);
    noggles = result.state;
  }
  assert.equal(noggles.musical, null);

  let tape = collectPowerUp(emptyPowerState(), 'tape', 7);
  for (let index = 0; index < 4; index++) {
    const result = consumeAcceptedPower(tape, 9 + index * 4);
    assert.equal(result.harmonyDouble, false);
    assert.equal(result.tapeRecord, true);
    tape = result.state;
  }
  assert.equal(tape.musical, null);
  assert.match(v4Source, /target\.cueBeat \+ 8/, 'Loop Tape needs an audible eight-beat replay distinct from v3 echoes');
});

test('Bass Battery is beat-counted and Ghost Soles remains a separate stored save', () => {
  const bass = collectPowerUp(emptyPowerState(), 'bass', 12);
  assert.equal(bass.expiresAtBeat, 20);
  assert.equal(powerStateAtBeat(bass, 19.999).musical, 'bass');
  assert.equal(powerStateAtBeat(bass, 20).musical, null);

  const bassAndGhost = collectPowerUp(bass, 'ghost', 13);
  assert.equal(bassAndGhost.musical, 'bass');
  assert.equal(bassAndGhost.ghostCharges, 1);
  const first = consumeGhostCharge(bassAndGhost);
  assert.equal(first.protected, true);
  assert.equal(first.state.ghostCharges, 0);
  assert.equal(first.state.musical, 'bass');
  assert.equal(consumeGhostCharge(first.state).protected, false);
});

test('Noun selection changes timbre but never timing, score, or physics', () => {
  const choices = nounChoices(137);
  assert.equal(new Set(choices).size, 3);
  assert.equal(new Set(choices.map(nounVoiceFor)).size, 3, 'the three choices need distinct deterministic timbres');
  assert.ok(choices.every((nounId) => nounId >= 0 && nounId <= 1199));
  assert.match(v4Source, /const RUNNER_W = 62/);
  assert.match(v4Source, /const RUNNER_H = 70/);
  assert.match(v4Source, /gradeBeatDelta\(delta, level\(\)\.bpm\)/);
  assert.match(v4Source, /jumpHeightAtBeat\(beat, runner\.jumpStartBeat, JUMP_APEX_PX\)/);
  assert.doesNotMatch(v4Source, /selectedNounId[^\n]*(bonus|lives|JUMP|GOOD_WINDOW|bpm)/);
});

test('the bottom road is the sequencer and Noun bandmates expose the mix', () => {
  assert.match(v4Source, /function groundY\(\): number \{ return height \* \.71; \}/);
  assert.match(v4Source, /const cellWidth = BEAT_PX \/ subdivision/);
  assert.match(v4Source, /roadGrades\.get\(step\)/);
  assert.match(v4Source, /function drawPowerUp/);
  assert.match(v4Source, /function drawBandmates/);
  assert.match(v4Source, /for \(let index = 0; index < arrangement; index\+\+\)/);
  assert.match(v4Source, /context\.lineTo\(runnerX, height\)/, 'the Noun needs a fixed road playhead');
  assert.match(v4Source, /@media \(max-width: 600px\)/);
  assert.match(v4Source, /overflow-x: hidden/);
});

test('all six Beat Runner editions link each other with one current marker', async () => {
  const sources = await Promise.all([V1_PAGE, V2_PAGE, V3_PAGE, V4_PAGE, V5_PAGE, V6_PAGE].map((url) => readFile(url, 'utf8')));
  for (const source of sources) {
    const versionNav = source.match(/<nav class="(?:drn|arena)__versions"[\s\S]*?<\/nav>/)?.[0] || '';
    for (const path of ['/drum-runner-v1', '/drum-runner-v2', '/drum-runner-v3', '/drum-runner-v4', '/drum-runner-v5', '/drum-runner']) {
      assert.match(versionNav, new RegExp(`href="${path.replaceAll('/', '\\/')}"`));
    }
    assert.equal((versionNav.match(/aria-current="page"/g) || []).length, 1);
  }
  assert.deepEqual(DRUM_RUNNER_VERSIONS.map((version) => version.id), ['v6', 'v5', 'v4', 'v3', 'v2', 'v1']);
  assert.deepEqual(DRUM_RUNNER_VERSIONS.map((version) => version.path), ['/drum-runner', '/drum-runner-v5', '/drum-runner-v4', '/drum-runner-v3', '/drum-runner-v2', '/drum-runner-v1']);
  assert.equal(new Set(DRUM_RUNNER_VERSIONS.map((version) => version.storageKey)).size, 6);
});
