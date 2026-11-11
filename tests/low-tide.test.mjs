import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  W, WALL, H_MIN, H_MAX, GULL_Y, SHELL_H, BUCKET_W, MAX_BUCKETS, WAVE_COUNTS, GULL, SHELL, GOLD_POINTS,
  waveSpec, catchPoints, bucketTop, sandY, catchNote, bucketsAfter, seeded,
  createTide, startWave, setBucketX, setHeight, tideStep, applyCalm, lowestShell,
} from '../src/lib/low-tide/tide.mjs';
import { createMood, moodEvent, moodStep, moodResponse, beginGame, serializeMood, setDial } from '../src/lib/breakwater/mood.mjs';
import { ROW, readSave } from '../src/lib/breakwater/row.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const DT = 1 / 60;

test('waves: fixed counts, each faster than the last, each catch worth more up to eight', () => {
  let prev = null;
  for (let n = 0; n < 14; n += 1) {
    const s = waveSpec(n);
    assert.equal(s.count, WAVE_COUNTS[Math.min(n, WAVE_COUNTS.length - 1)]);
    assert.equal(s.points, Math.min(8, n + 1));
    if (prev) {
      assert.ok(s.fall >= prev.fall && s.gull >= prev.gull && s.interval <= prev.interval, `wave ${n + 1} is not slower`);
      if (n < 7) assert.ok(s.fall > prev.fall, `wave ${n + 1} is faster`);
    }
    assert.ok(s.interval >= 0.3 && s.fall <= 240);
    prev = s;
  }
  assert.equal(catchPoints(0), 1);
  assert.equal(catchPoints(7), 8);
  assert.equal(catchPoints(20), 8);
  assert.equal(catchPoints(2, true), 3 * GOLD_POINTS);
  assert.deepEqual(waveSpec(-3), waveSpec(0));
});

test('buckets: one comes back every 1000 points, never more than three', () => {
  assert.equal(bucketsAfter(990, 1001, 1), 2);
  assert.equal(bucketsAfter(990, 1001, 3), 3);
  assert.equal(bucketsAfter(900, 2100, 1), 3);
  assert.equal(bucketsAfter(100, 900, 2), 2);
});

test('art: gull frames and the shell are rectangular bitmaps', () => {
  for (const frame of GULL) {
    assert.equal(frame.length, GULL[0].length);
    for (const row of frame) assert.match(row, new RegExp(`^[01]{${GULL[0][0].length}}$`));
  }
  for (const row of SHELL) assert.match(row, /^[01]{7}$/);
  assert.equal(SHELL.length, SHELL_H);
});

test('catch notes rise through a wave and stay in a sane range', () => {
  for (const scale of ['major', 'bright', 'minor', 'soft']) {
    const run = Array.from({ length: 8 }, (_, i) => catchNote(i, scale));
    for (let i = 1; i < run.length; i += 1) assert.ok(run[i] > run[i - 1], `${scale} rises at ${i}`);
    assert.equal(catchNote(8, scale), catchNote(0, scale), 'rolls over after eight');
    for (const n of run) assert.ok(n >= 60 && n <= 100);
  }
});

test('geometry: buckets sit above the tide line on every field height', () => {
  for (let h = H_MIN; h <= H_MAX; h += 16) {
    for (let i = 0; i < MAX_BUCKETS; i += 1) assert.ok(bucketTop(i, h) + 8 < sandY(h));
    assert.ok(bucketTop(0, h) > GULL_Y + 200);
  }
});

test('the buckets follow the control absolutely and stay on the field', () => {
  const s = createTide();
  assert.equal(setBucketX(s, 100), 100);
  assert.equal(setBucketX(s, -50), WALL + s.bucketW / 2);
  assert.equal(setBucketX(s, 9999), W - WALL - s.bucketW / 2);
  assert.equal(setBucketX(s, NaN), W - WALL - s.bucketW / 2);
});

function autopilot(s, lag = 0) {
  const target = lowestShell(s);
  if (target) setBucketX(s, lag ? s.bucketX + (target.x - s.bucketX) * lag : target.x);
}

function play(s, seconds, opts = {}, pilot = autopilot) {
  const events = [];
  for (let f = 0; f < seconds * 60; f += 1) {
    if (s.phase === 'ready') startWave(s);
    pilot(s);
    events.push(...tideStep(s, DT, typeof opts === 'function' ? opts() : opts));
    if (s.phase === 'over') break;
  }
  return events;
}

test('simulated play: a steady hand clears waves cleanly, scores climb, the catch run counts up', () => {
  const s = createTide({ rng: seeded(7) });
  const ev = play(s, 120);
  const waves = ev.filter((e) => e.type === 'wave');
  assert.ok(waves.length >= 5, `cleared ${waves.length} waves`);
  assert.ok(waves.every((w) => w.clean));
  assert.equal(s.misses, 0);
  // Wave n's catches were worth n points each.
  const firstFive = WAVE_COUNTS.slice(0, 5).reduce((sum, c, i) => sum + c * (i + 1), 0);
  assert.ok(s.score >= firstFive, `score ${s.score}`);
  const runs = ev.filter((e) => e.type === 'catch').slice(0, WAVE_COUNTS[0]).map((e) => e.run);
  assert.deepEqual(runs, Array.from({ length: WAVE_COUNTS[0] }, (_, i) => i));
  assert.equal(s.buckets, MAX_BUCKETS);
});

test('simulated play: a still hand loses buckets to the tide, goes back a wave each time, and the game ends', () => {
  const s = createTide({ rng: seeded(3) });
  s.wave = 2;
  setBucketX(s, WALL);
  const ev = play(s, 120, {}, () => {});
  const misses = ev.filter((e) => e.type === 'miss');
  assert.equal(misses.length, 3);
  assert.deepEqual(misses.map((m) => m.buckets), [2, 1, 0]);
  assert.ok(misses[0].cleared > 0, 'the rest of the wave is washed away');
  assert.ok(misses[2].final);
  assert.equal(ev.at(-1).type, 'over');
  assert.equal(s.phase, 'over');
  assert.equal(s.wave, 0, 'stepped back from wave 3 to wave 1');
  assert.deepEqual(tideStep(s, DT), [], 'nothing moves after game over');
});

test('simulated play: CALM never loses a bucket and never ends', () => {
  const s = createTide({ rng: seeded(5) });
  setBucketX(s, WALL);
  const ev = play(s, 240, { calm: true }, () => {});
  assert.ok(ev.filter((e) => e.type === 'miss').length >= 5);
  assert.equal(s.buckets, MAX_BUCKETS);
  assert.notEqual(s.phase, 'over');
  assert.ok(!ev.some((e) => e.type === 'over'));
});

test('a final loss still ends the game when CALM is chosen during the wash', () => {
  const s = createTide({ rng: seeded(11) });
  s.buckets = 1;
  setBucketX(s, WALL);
  let ev = [];
  for (let f = 0; f < 60 * 30 && !ev.some((e) => e.type === 'miss'); f += 1) { if (s.phase === 'ready') startWave(s); ev = tideStep(s, DT); }
  assert.equal(s.phase, 'wash');
  applyCalm(s);
  const rest = [];
  for (let f = 0; f < 120; f += 1) rest.push(...tideStep(s, DT, { calm: true }));
  assert.ok(rest.some((e) => e.type === 'over'));
  // And CALM chosen before any loss refills the stack.
  const t = createTide();
  t.buckets = 1;
  applyCalm(t);
  assert.equal(t.buckets, MAX_BUCKETS);
});

test('a bucket comes back at 1000 points', () => {
  const s = createTide({ rng: seeded(2) });
  s.buckets = 2;
  s.score = 995;
  s.wave = 6;
  const ev = play(s, 20);
  assert.ok(ev.some((e) => e.type === 'extra' && e.buckets === 3));
  assert.equal(s.buckets, 3);
});

test('RUSH drops golden shells worth more; without RUSH there are none', () => {
  const rush = createTide({ rng: seeded(9) });
  const ev = play(rush, 90, { rush: true });
  const golds = ev.filter((e) => e.type === 'catch' && e.golden);
  assert.ok(golds.length > 0);
  for (const g of golds) assert.equal(g.points % GOLD_POINTS, 0);
  const plain = createTide({ rng: seeded(9) });
  assert.ok(!play(plain, 90).some((e) => e.type === 'drop' && e.golden));
});

test('mood response drives the field: DRIFT is slower and wider than RUSH', () => {
  const run = (opts) => {
    const s = createTide({ rng: seeded(4) });
    startWave(s);
    for (let f = 0; f < 60 * 3; f += 1) tideStep(s, DT, opts);
    return s;
  };
  const drift = run({ speed: 0.85, widen: 1.35 });
  const rush = run({ speed: 1.2, widen: 0.9, rush: true });
  assert.ok(drift.bucketW > rush.bucketW + 8);
  assert.ok(rush.dropped > drift.dropped);
});

test('resize mid-play applies at once and keeps falling shells on the field', () => {
  const s = createTide({ height: H_MAX, rng: seeded(6) });
  startWave(s);
  for (let f = 0; f < 60 * 6; f += 1) tideStep(s, DT);
  s.shells.push({ x: W + 40, y: H_MAX - 30, golden: false, id: 99 });
  setHeight(s, H_MIN);
  assert.equal(s.h, H_MIN);
  for (const sh of s.shells) {
    assert.ok(sh.y + SHELL_H < bucketTop(0, H_MIN), 'above the buckets');
    assert.ok(sh.x <= W - WALL);
  }
  setHeight(s, 10000);
  assert.equal(s.h, H_MAX);
});

test('mood mapping in a played game: catches are paddle, waves are brick, misses are loss, clean waves are wave', () => {
  const mood = createMood('play');
  beginGame(mood);
  const s = createTide({ rng: seeded(8) });
  const feed = (events) => {
    for (const e of events) {
      if (e.type === 'catch') moodEvent(mood, 'paddle');
      if (e.type === 'wave') { moodEvent(mood, 'brick'); if (e.clean) moodEvent(mood, 'wave'); }
      if (e.type === 'miss') moodEvent(mood, 'loss');
    }
  };
  for (let f = 0; f < 60 * 90; f += 1) {
    if (s.phase === 'ready') startWave(s);
    autopilot(s);
    moodStep(mood, DT);
    const r = moodResponse(mood);
    feed(tideStep(s, DT, { speed: r.speed, widen: r.paddle, rush: r.label === 'RUSH' }));
  }
  assert.ok(['FLOW', 'RUSH'].includes(mood.peak), `peak ${mood.peak}`);
  // A miss drops the mood to DRIFT, which widens the buckets and slows the shells.
  setBucketX(s, WALL);
  for (let f = 0; f < 60 * 30 && mood.label !== 'DRIFT'; f += 1) {
    if (s.phase === 'ready') startWave(s);
    moodStep(mood, DT);
    const r = moodResponse(mood);
    feed(tideStep(s, DT, { speed: r.speed, widen: r.paddle, rush: r.label === 'RUSH' }));
  }
  assert.equal(mood.label, 'DRIFT');
  const r = moodResponse(mood);
  assert.ok(r.paddle > 1.2 && r.speed <= 0.9);
  setDial(mood, 'calm');
  assert.equal(moodResponse(mood).unlimitedBalls, true);
});

test('the save the lobby reads: best, machine, dial, sound, crt and the mood', () => {
  const cab = ROW.find((c) => c.slug === 'low-tide');
  assert.ok(cab);
  assert.equal(cab.storeKey, 'low-tide:v1');
  const mood = createMood('rush');
  moodEvent(mood, 'paddle');
  for (let i = 0; i < 5; i += 1) moodStep(mood, 2);
  const save = { best: 1234, machine: 'c64', dial: 'rush', sound: true, crt: false, mood: serializeMood(mood) };
  const read = readSave(JSON.stringify(save));
  assert.equal(read.best, 1234);
  assert.equal(read.machine, 'c64');
  assert.equal(read.dial, 'rush');
  assert.ok(read.played);
});

test('the page wires the shared modules and the house rules', () => {
  const page = fs.readFileSync(path.join(root, 'src/pages/low-tide.astro'), 'utf8');
  for (const name of ['createMood', 'moodEvent', 'moodStep', 'moodResponse', 'setDial', 'beginGame', 'serializeMood', 'restoreMood', 'dialFromSiteMood', 'siteMoodFromLabel']) assert.ok(page.includes(name), name);
  assert.ok(page.includes("'low-tide:v1'"));
  assert.ok(page.includes('immersive') && page.includes('isolated'));
  assert.ok(page.includes('Directed by Michael Hoydich. Designed and built by Claude Code'));
  assert.ok(page.includes('href="/cabinet-row"'));
  assert.ok(page.includes('height: 100vh; height: 100dvh'));
  assert.ok(page.includes(':-webkit-full-screen') && !/:fullscreen\s*,/.test(page));
  assert.ok(page.includes('(pointer: coarse)'));
  assert.ok(page.includes('e.detail > 0'));
  assert.ok(!/\.(mp3|wav|ogg)\b/.test(page), 'synthesized sound only');
  assert.ok(fs.existsSync(path.join(root, 'public/images/low-tide/og.png')));
  assert.ok(fs.existsSync(path.join(root, 'public/images/low-tide/cover.svg')));
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/data/game-catalog.json'), 'utf8'));
  const i = catalog.findIndex((g) => g.slug === 'low-tide');
  assert.ok(i >= 0);
  // Wave two sits together just before Breakwater (wave one follows it), in any order.
  const bw = catalog.findIndex((g) => g.slug === 'breakwater');
  assert.ok(i < bw && catalog.slice(i, bw).every((g) => ['lighthouse', 'low-tide', 'morning-route', 'sea-glass', 'sandcastle'].includes(g.slug)), 'in the wave-two run before Breakwater');
  assert.equal(catalog[i].family, 'Retro arcade');
});
