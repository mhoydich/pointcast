import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const LEVELS_FILE = new URL('../src/lib/drum-runner-levels.json', import.meta.url);
const RUNNER_PAGE = new URL('../src/pages/drum-runner.astro', import.meta.url);
const DRUM_GAMES = new URL('../src/lib/drum-games.ts', import.meta.url);

const levels = JSON.parse(await readFile(LEVELS_FILE, 'utf8'));
const runnerSource = await readFile(RUNNER_PAGE, 'utf8');

test('Beat Runner v2 defines a four-scene campaign with a rising tempo', () => {
  assert.equal(levels.length, 4);
  assert.deepEqual(levels.map((level) => level.number), ['01', '02', '03', '04']);
  assert.equal(new Set(levels.map((level) => level.id)).size, levels.length);
  assert.equal(new Set(levels.map((level) => level.scene)).size, levels.length);

  for (let index = 1; index < levels.length; index++) {
    assert.ok(levels[index].bpm > levels[index - 1].bpm, 'level tempos should rise');
  }
});

test('every authored level keeps obstacle cues sorted and jumpable', () => {
  const allowedKinds = new Set(['cone', 'crate', 'tall-crate', 'barrier', 'speaker', 'luggage', 'hydrant']);

  for (const level of levels) {
    assert.ok(level.obstacles.length >= 7, `${level.name} needs a full phrase`);
    assert.ok(level.obstacles[0].beat >= 6, `${level.name} needs a safe opening count`);
    assert.ok(level.obstacles.at(-1).beat <= level.beats - 4, `${level.name} needs a clean finish runway`);

    for (let index = 0; index < level.obstacles.length; index++) {
      const cue = level.obstacles[index];
      assert.ok(allowedKinds.has(cue.kind), `${cue.kind} is not a supported obstacle`);
      if (index > 0) {
        assert.ok(cue.beat > level.obstacles[index - 1].beat, `${level.name} cues must be sorted`);
        assert.ok(cue.beat - level.obstacles[index - 1].beat >= 3, `${level.name} cues need at least three beats of recovery`);
      }
    }
  }
});

test('an on-grid jump clears every obstacle across the full collision window', () => {
  const dimensions = {
    cone: [26, 32],
    crate: [38, 44],
    'tall-crate': [40, 62],
    barrier: [54, 41],
    speaker: [40, 55],
    luggage: [48, 35],
    hydrant: [30, 45],
  };
  const beatPixels = 150;
  const runnerWidth = 50;
  const gravity = Number(runnerSource.match(/const GRAV = (\d+);/)?.[1]);
  const jumpVelocity = Number(runnerSource.match(/const JUMP_V = (\d+);/)?.[1]);

  assert.ok(Number.isFinite(gravity));
  assert.ok(Number.isFinite(jumpVelocity));

  for (const level of levels) {
    const beatSeconds = 60 / level.bpm;
    const speed = beatPixels / beatSeconds;

    for (const cue of level.obstacles) {
      const [width, height] = dimensions[cue.kind];
      const collisionHalfTime = (runnerWidth / 2 + width / 2) / speed;
      const collisionTimes = [beatSeconds - collisionHalfTime, beatSeconds + collisionHalfTime];

      for (const time of collisionTimes) {
        const jumpHeight = jumpVelocity * time - gravity * time * time / 2;
        assert.ok(
          jumpHeight >= height - 5,
          `${level.name} ${cue.kind} punishes an on-grid jump at ${time.toFixed(3)}s`,
        );
      }
    }
  }
});

test('every level interstitial has a checked-in postcard image', async () => {
  for (const level of levels) {
    assert.match(level.postcard, /^\/images\/postcards\/.+\.svg$/);
    await access(new URL(`../public${level.postcard}`, import.meta.url));
  }
});

test('Beat Runner v2 keeps explicit phases, accessible interstitial focus, and reduced-motion canvas handling', () => {
  for (const phase of ['intro', 'playing', 'interstitial', 'gameover', 'victory']) {
    assert.match(runnerSource, new RegExp(`'${phase}'`));
  }

  assert.match(runnerSource, /aria-live="polite" aria-atomic="true"/);
  assert.doesNotMatch(runnerSource, /id="drn-overlay"[^>]*aria-live/);
  assert.match(runnerSource, /goButton\.focus\(\{ preventScroll: true \}\)/);
  assert.match(runnerSource, /jumpButton\.focus\(\{ preventScroll: true \}\)/);
  assert.match(runnerSource, /if \(event\.repeat\) \{\s*event\.preventDefault\(\);\s*return;/);
  assert.match(runnerSource, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(runnerSource, /if \(shakeMag > 0 && !reducedMotion\)/);
  assert.match(runnerSource, /if \(reducedMotion\) return;/);
  assert.match(runnerSource, /document\.addEventListener\('visibilitychange'/);
});

test('Beat Runner v2 uses authored cues and only rewards beat locks tied to the next obstacle', () => {
  assert.match(runnerSource, /import levelData from '\.\.\/lib\/drum-runner-levels\.json'/);
  assert.match(runnerSource, /cfg\.obstacles\.map/);
  assert.match(runnerSource, /function nearestObstacle\(\)/);
  assert.match(runnerSource, /runner\.cleanTarget = target\.ox/);
  assert.match(runnerSource, /runner\.cleanTarget === obstacle\.ox/);
  assert.match(runnerSource, /const BEST_KEY = 'pc-drum-runner-v2-best'/);
  assert.match(runnerSource, /saveProgress\(currentLevelIndex - 1\)/);
  assert.match(runnerSource, /Number\.isFinite\(value\)/);
});

test('Drum Arcade discovery describes the v2 level campaign', async () => {
  const source = await readFile(DRUM_GAMES, 'utf8');
  assert.match(source, /kicker: '4 LEVELS · JUMP THE GRID'/);
  assert.match(source, /four beat-mapped El Segundo postcards/);
  assert.match(source, /bestKey: 'pc-drum-runner-v2-best'/);
});
