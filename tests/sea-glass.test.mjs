import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROWS, CUBES, DIRS, DIR_IDS, KEYMAP, RULES, POINTS, TIMING,
  onPyramid, cubeIndex, cellOf, neighbor, screenOf, quadrantDir, ruleFor, buoyRows, createPyramid, land,
  remaining, isCleared, rowComplete, buoyAt, clearBonus, createGame, queueHop, stepGame, respawn, nextPyramid,
  gullDir, touches, autoDir, posOf, cellNow,
} from '../src/lib/sea-glass/pyramid.mjs';
import { createMood, moodEvent, moodStep, moodResponse, beginGame, DIALS } from '../src/lib/breakwater/mood.mjs';

/** A seeded generator so every simulated game is the same game. */
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

test('pyramid: 28 cubes in seven rows, indexed both ways', () => {
  assert.equal(ROWS, 7);
  assert.equal(CUBES, 28);
  const seen = new Set();
  for (let r = 0; r < ROWS; r += 1) for (let c = 0; c <= r; c += 1) {
    const i = cubeIndex(r, c);
    assert.ok(i >= 0 && i < CUBES);
    assert.deepEqual(cellOf(i), [r, c]);
    seen.add(i);
  }
  assert.equal(seen.size, CUBES);
  assert.ok(!onPyramid(0, 1) && !onPyramid(7, 0) && !onPyramid(3, -1));
});

test('hops: four diagonals, and every on-pyramid hop lands half a cube across and one row', () => {
  assert.deepEqual(DIR_IDS, ['ul', 'ur', 'dl', 'dr']);
  assert.deepEqual(neighbor(0, 0, 'dl'), [1, 0]);
  assert.deepEqual(neighbor(0, 0, 'dr'), [1, 1]);
  assert.deepEqual(neighbor(3, 1, 'ul'), [2, 0]);
  assert.deepEqual(neighbor(3, 1, 'ur'), [2, 1]);
  for (let i = 0; i < CUBES; i += 1) {
    const [r, c] = cellOf(i);
    for (const id of DIR_IDS) {
      const [a, b] = neighbor(r, c, id);
      const s0 = screenOf(r, c), s1 = screenOf(a, b);
      assert.equal(Math.abs(s1.x - s0.x), 0.5);
      assert.equal(s1.y - s0.y, DIRS[id].dr);
      assert.equal(s1.x > s0.x, id === 'ur' || id === 'dr');
    }
  }
  // From the apex only the two downward hops stay on.
  assert.deepEqual(DIR_IDS.filter((id) => onPyramid(...neighbor(0, 0, id))), ['dl', 'dr']);
});

test('controls: Q E A D and arrows turned 45 degrees, taps by quadrant', () => {
  assert.deepEqual(KEYMAP, { KeyQ: 'ul', KeyE: 'ur', KeyA: 'dl', KeyD: 'dr', ArrowLeft: 'ul', ArrowUp: 'ur', ArrowDown: 'dl', ArrowRight: 'dr' });
  assert.equal(quadrantDir(10, 10, 144, 200), 'ul');
  assert.equal(quadrantDir(200, 10, 144, 200), 'ur');
  assert.equal(quadrantDir(10, 300, 144, 200), 'dl');
  assert.equal(quadrantDir(200, 300, 144, 200), 'dr');
});

test('rules: one hop, two hops through frost, and toggle turns finished glass back', () => {
  assert.deepEqual(land(0, 'one'), { state: 1, delta: 1, points: POINTS.glass, done: true });
  assert.equal(land(1, 'one').delta, 0);
  assert.deepEqual(land(0, 'two'), { state: 1, delta: 1, points: POINTS.frost, done: false });
  assert.deepEqual(land(1, 'two'), { state: 2, delta: 1, points: POINTS.glass, done: true });
  assert.equal(land(2, 'two').delta, 0);
  assert.deepEqual(land(1, 'toggle'), { state: 0, delta: -1, points: 0, done: false });
  for (const r of Object.values(RULES)) assert.ok(r.target >= 1 && r.label);
});

test('schedule: two landings come later, toggling later still, and RUSH brings both sooner', () => {
  const play = Array.from({ length: 12 }, (_, n) => ruleFor(n, 'play'));
  const rush = Array.from({ length: 12 }, (_, n) => ruleFor(n, 'rush'));
  assert.equal(play[0], 'one');
  assert.ok(play.indexOf('two') > 0 && play.indexOf('toggle') > play.indexOf('two'));
  assert.ok(rush.indexOf('two') < play.indexOf('two'));
  assert.ok(rush.indexOf('toggle') < play.indexOf('toggle'));
  assert.deepEqual(Array.from({ length: 12 }, (_, n) => ruleFor(n, 'calm')), play);
});

test('buoys: one on each side, reachable by an up hop from the edge, used once', () => {
  for (let n = 0; n < 8; n += 1) {
    const { L, R } = buoyRows(n);
    assert.ok(L >= 1 && L <= 4 && R >= 1 && R <= 4);
    const p = createPyramid(n);
    const [l, r] = p.buoys;
    assert.ok(!onPyramid(l.r, l.c) && !onPyramid(r.r, r.c));
    assert.deepEqual(neighbor(l.r + 1, 0, 'ul'), [l.r, l.c]);
    assert.deepEqual(neighbor(r.r + 1, r.r + 1, 'ur'), [r.r, r.c]);
  }
  const p = createPyramid(0);
  const b = p.buoys[0];
  assert.ok(buoyAt(p, b.r, b.c));
  b.used = true;
  assert.equal(buoyAt(p, b.r, b.c), null);
});

test('engine: a hop lands and colors, a row and a clear are reported once', () => {
  const g = createGame();
  g.crab.rest = 0;
  const events = [];
  const run = (dir) => { assert.ok(queueHop(g, dir)); for (let i = 0; i < 40; i += 1) events.push(...stepGame(g, 1 / 60, { gull: false, bubbleCap: 0 })); };
  run('dl');
  assert.deepEqual([g.crab.r, g.crab.c], [1, 0]);
  assert.equal(g.pyr.cubes[cubeIndex(1, 0)], 1);
  assert.equal(g.score, POINTS.glass);
  run('ur');
  assert.equal(g.pyr.cubes[cubeIndex(0, 0)], 1);
  assert.ok(events.some((e) => e.type === 'row' && e.r === 0));
  run('dr');
  assert.ok(events.some((e) => e.type === 'row' && e.r === 1));
  assert.ok(rowComplete(g.pyr, 1));
  assert.equal(events.filter((e) => e.type === 'row').length, 2);
  // Fill the rest by hand and land once more.
  g.pyr.cubes.fill(1);
  g.pyr.cubes[cubeIndex(2, 2)] = 0;
  run('dr');
  assert.ok(isCleared(g.pyr));
  const clear = events.find((e) => e.type === 'clear');
  assert.ok(clear);
  assert.equal(clear.bonus, clearBonus(g.pyr));
  assert.equal(clear.bonus, POINTS.clear + 2 * POINTS.buoyLeft);
  assert.equal(queueHop(g, 'dl'), false, 'no hops after a clear until the next pyramid');
  nextPyramid(g);
  assert.equal(g.level, 1);
  assert.equal(remaining(g.pyr), CUBES);
});

test('engine: hopping off the edge is a fall; onto a buoy is a ride back to the top', () => {
  const g = createGame();
  g.crab.rest = 0;
  queueHop(g, 'ul');
  let ev = [];
  for (let i = 0; i < 40 && !ev.some((e) => e.type === 'fall'); i += 1) ev = stepGame(g, 1 / 60, { gull: false, bubbleCap: 0 });
  assert.ok(ev.some((e) => e.type === 'fall'));
  assert.equal(g.crab.state, 'fall');
  assert.deepEqual(stepGame(g, 1 / 60), [], 'the engine waits for respawn after a fall');
  respawn(g, { top: true });
  assert.deepEqual([g.crab.r, g.crab.c, g.crab.state], [0, 0, 'idle']);

  const h = createGame();
  const b = h.pyr.buoys[0];
  h.crab = { ...h.crab, r: b.r + 1, c: 0, rest: 0 };
  queueHop(h, 'ul');
  const all = [];
  for (let i = 0; i < 60 * 3; i += 1) all.push(...stepGame(h, 1 / 60, { gull: false, bubbleCap: 0 }));
  assert.ok(all.some((e) => e.type === 'buoy' && e.side === 'L'));
  assert.ok(b.used);
  assert.deepEqual([h.crab.r, h.crab.c, h.crab.state], [0, 0, 'idle']);
  assert.equal(h.pyr.cubes[0], 1, 'setting down on the apex colors it');
});

test('hazards: bubbles bounce down and roll off the bottom; the gull chases and can be lured off', () => {
  const g = createGame();
  const rng = seeded(7);
  g.bubbleTimer = 0;
  const ev = [];
  // The crab stands still at the apex, out of the bubble's way below.
  g.crab.rest = 1e9;
  for (let i = 0; i < 60 * 8; i += 1) ev.push(...stepGame(g, 1 / 60, { gull: false, bubbleCap: 1 }, rng));
  assert.ok(ev.some((e) => e.type === 'spawn' && e.kind === 'bubble'));
  assert.ok(ev.filter((e) => e.type === 'bounce').length >= 5);
  assert.ok(ev.some((e) => e.type === 'roll-off'));
  assert.ok(!ev.some((e) => e.type === 'hit'));

  assert.equal(gullDir(1, 0, 4, 2), 'dr');
  assert.equal(gullDir(4, 2, 1, 0), 'ul');
  assert.equal(gullDir(2, 0, 1, -1), 'ul', 'the gull follows the crab off the edge onto the buoy spot');
  assert.equal(gullDir(1, 0, 6, 6) === null, false);
  for (let i = 0; i < CUBES; i += 1) {
    const [r, c] = cellOf(i);
    const d = gullDir(r, c, 3, 1);
    if (r === 3 && c === 1) continue;
    assert.ok(onPyramid(...neighbor(r, c, d)), 'the gull never leaves the pyramid chasing a crab on it');
  }

  // Lure: the crab takes the left buoy with the gull right behind it.
  const h = createGame();
  const b = h.pyr.buoys[0];
  h.crab = { ...h.crab, r: b.r + 1, c: 0, rest: 0 };
  h.hazards.push({ id: 99, kind: 'gull', r: b.r + 2, c: 0, pr: b.r + 2, pc: 0, ax: 0, ay: 0, t: 0, dur: 0, state: 'wait', wait: 0.4, face: 1, dir: 'ul' });
  h.gullTimer = 1e9;
  queueHop(h, 'ul');
  const all = [];
  for (let i = 0; i < 60 * 3; i += 1) all.push(...stepGame(h, 1 / 60, { gull: true, bubbleCap: 0 }, rng));
  assert.ok(all.some((e) => e.type === 'buoy'));
  assert.ok(all.some((e) => e.type === 'lure'), JSON.stringify(all.map((e) => e.type)));
  assert.ok(!all.some((e) => e.type === 'hit'));
  assert.ok(h.score >= POINTS.lure);

  // DRIFT sends the gull away.
  const d = createGame();
  d.hazards.push({ id: 5, kind: 'gull', r: 3, c: 1, pr: 3, pc: 1, ax: 0, ay: 0, t: 0, dur: 0, state: 'wait', wait: 9, face: 1, dir: 'ul' });
  const away = stepGame(d, 1 / 60, { gull: false, bubbleCap: 0 });
  assert.ok(away.some((e) => e.type === 'gull-away'));
  d.gullTimer = 0;
  for (let i = 0; i < 120; i += 1) stepGame(d, 1 / 60, { gull: false, bubbleCap: 0 });
  assert.ok(!d.hazards.some((x) => x.kind === 'gull' && x.state !== 'away'));
});

test('collision: same cube, or two hops passing each other', () => {
  const crab = { r: 2, c: 1, pr: 1, pc: 0, state: 'hop', t: 0.2, dur: 0.26 };
  const bubble = { kind: 'bubble', r: 2, c: 1, pr: 1, pc: 1, state: 'wait', t: 0, dur: 0 };
  assert.equal(touches(crab, bubble), true);
  assert.equal(touches({ ...crab, state: 'ride' }, bubble), false, 'safe on a buoy');
  const swapA = { r: 2, c: 1, pr: 1, pc: 0, state: 'hop', t: 0.05, dur: 0.26 };
  const swapB = { kind: 'bubble', r: 1, c: 0, pr: 2, pc: 1, state: 'hop', t: 0.05, dur: 0.32 };
  assert.equal(touches(swapA, swapB), true);
  const apart = { kind: 'bubble', r: 5, c: 3, pr: 4, pc: 3, state: 'hop', t: 0.1, dur: 0.32 };
  assert.equal(touches(crab, apart), false);
  assert.deepEqual(cellNow({ r: 2, c: 1, pr: 1, pc: 0, state: 'hop', t: 0.1, dur: 0.26 }), [1, 0]);
  const p = posOf({ r: 1, c: 1, ax: 0, ay: 0, t: 0.13, dur: 0.26, state: 'hop' });
  assert.ok(Math.abs(p.x - 0.25) < 1e-9 && Math.abs(p.y - 0.5) < 1e-9 && Math.abs(p.lift - 1) < 1e-9);
});

/**
 * Play a whole game the way the page does: mood in, tune out, the autopilot
 * on the stick, a pause after every loss and every clear.
 */
function simulate({ dial = 'play', seconds = 900, seed = 1 } = {}) {
  const rng = seeded(seed);
  const mood = createMood(dial);
  beginGame(mood);
  const g = createGame({ dial });
  const stats = { clears: 0, falls: 0, hits: 0, colors: 0, rows: 0, lures: 0, rides: 0, labels: new Set(), extra: 0, over: false, maxBubbles: 0, rules: new Set() };
  let lives = 3, pause = 0, pending = null;
  const dt = 1 / 60;
  for (let f = 0; f < seconds * 60; f += 1) {
    moodStep(mood, dt);
    const res = moodResponse(mood);
    stats.labels.add(res.label);
    stats.rules.add(g.pyr.rule);
    if (pause > 0) {
      pause -= dt;
      if (pause <= 0) {
        if (pending === 'clear') nextPyramid(g, res.paddle);
        else if (pending === 'over') { stats.over = true; break; }
        else respawn(g, { top: pending === 'fall', generosity: res.paddle });
        pending = null;
      }
      continue;
    }
    if (g.crab.state === 'idle' && g.crab.rest <= 0) { const d = autoDir(g); if (d) queueHop(g, d); }
    const tune = {
      speed: res.speed * (1 + 0.04 * Math.min(g.level, 10)),
      generosity: res.paddle,
      gull: res.label !== 'DRIFT',
      bubbleCap: Math.min(4, 1 + Math.floor(g.level / 3) + (dial === 'rush' ? 1 : 0) + (res.label === 'RUSH' ? 1 : 0)),
    };
    const ev = stepGame(g, dt, tune, rng);
    stats.maxBubbles = Math.max(stats.maxBubbles, g.hazards.filter((h) => h.kind === 'bubble' && h.state !== 'fall').length);
    for (const e of ev) {
      if (e.type === 'color') { if (e.delta > 0) { moodEvent(mood, 'paddle'); stats.colors += 1; } }
      else if (e.type === 'row') { moodEvent(mood, 'brick'); stats.rows += 1; }
      else if (e.type === 'lure') stats.lures += 1;
      else if (e.type === 'buoy') stats.rides += 1;
      else if (e.type === 'extra' && !DIALS[mood.dial].unlimitedBalls) { lives += 1; stats.extra += 1; }
      else if (e.type === 'clear') { moodEvent(mood, 'wave'); stats.clears += 1; pause = 1.4; pending = 'clear'; }
      else if (e.type === 'fall' || e.type === 'hit') {
        moodEvent(mood, 'loss');
        stats[e.type === 'fall' ? 'falls' : 'hits'] += 1;
        if (!DIALS[mood.dial].unlimitedBalls) lives -= 1;
        pause = 1.1; pending = lives <= 0 ? 'over' : e.type;
      }
    }
    // Invariants: every cube is between sand and the target; an idle crab stands on the pyramid.
    for (const s of g.pyr.cubes) assert.ok(s >= 0 && s <= g.pyr.target);
    if (g.crab.state === 'idle') assert.ok(onPyramid(g.crab.r, g.crab.c));
  }
  return { g, mood, lives, stats };
}

test('simulated play: an autopilot clears pyramids, meets hazards, scores honestly and moves the mood', () => {
  const { g, stats } = simulate({ dial: 'play', seconds: 900, seed: 3 });
  assert.ok(stats.clears >= 3, `cleared ${stats.clears}`);
  assert.ok(stats.colors >= 28 * 3);
  assert.ok(stats.rows >= 7 * 3);
  assert.ok(stats.hits + stats.falls >= 1, 'the hazards get it sometimes');
  assert.ok(stats.labels.has('FLOW') || stats.labels.has('RUSH'), [...stats.labels].join());
  assert.ok(stats.labels.has('DRIFT'));
  assert.ok(stats.rules.has('two'));
  assert.ok(g.score >= stats.clears * POINTS.clear + 28 * stats.clears * POINTS.glass);
  assert.equal(g.score % 5, 0);
});

test('simulated play: CALM never ends; RUSH fields more bubbles and two landings sooner', () => {
  const calm = simulate({ dial: 'calm', seconds: 600, seed: 11 });
  assert.equal(calm.stats.over, false);
  assert.equal(calm.lives, 3);
  const rush = simulate({ dial: 'rush', seconds: 600, seed: 11 });
  const play = simulate({ dial: 'play', seconds: 600, seed: 11 });
  assert.ok(rush.stats.maxBubbles > play.stats.maxBubbles || rush.stats.maxBubbles >= 2, `rush ${rush.stats.maxBubbles} play ${play.stats.maxBubbles}`);
  assert.ok(ruleFor(2, 'rush') === 'two' && ruleFor(2, 'play') === 'one');
  // A long PLAY game ends.
  let ended = false;
  for (let seed = 1; seed <= 6 && !ended; seed += 1) ended = simulate({ dial: 'rush', seconds: 1800, seed }).stats.over;
  assert.ok(ended, 'some RUSH game reaches game over within half an hour');
});

test('timing: the crab hop is quicker than any hazard hop at normal speed', () => {
  assert.ok(TIMING.hop < TIMING.hazardHop);
  assert.ok(TIMING.ride > TIMING.hop);
});

test('sprites: rectangular, original shapes with a known palette of characters', async () => {
  const { SPRITES, eachSpritePixel, eachBuoyPixel } = await import('../src/lib/sea-glass/sprites.mjs');
  const allowed = { crab: 'SsBk|e', bubble: 'ohf', gull: 'Hwgey', gullFlap: 'Hwgey' };
  for (const [name, rows] of Object.entries(SPRITES)) {
    const w = rows[0].length;
    for (const row of rows) {
      assert.equal(row.length, w, `${name} row width`);
      for (const ch of row) assert.ok(ch === '.' || allowed[name].includes(ch), `${name} char ${ch}`);
    }
    let n = 0;
    eachSpritePixel(rows, 0, 0, () => { n += 1; });
    assert.ok(n > 10);
    const left = [], right = [];
    eachSpritePixel(rows, 0, 0, (x) => left.push(x));
    eachSpritePixel(rows, 0, 0, (x) => right.push(w - 1 - x), true);
    assert.deepEqual(left.sort(), right.sort(), `${name} flips cleanly`);
  }
  assert.equal(SPRITES.gull.length, SPRITES.gullFlap.length);
  const segs = new Set();
  let ring = 0;
  eachBuoyPixel(0, 0, (x, y, s) => { ring += 1; segs.add(s); assert.ok(x >= 0 && x < 16 && y >= 0 && y < 8); });
  assert.ok(ring > 40);
  assert.deepEqual([...segs].sort(), [0, 1]);
});
