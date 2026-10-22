import test from 'node:test';
import assert from 'node:assert/strict';
import {
  W, H_MIN, H_MAX, HUD, SEA_Y, BRIGADE_X, CASTLE_X, SAND_PER_BRIGADE, REBUILD_EVERY, POINTS, BURST, MAX_SHOTS,
  mulberry32, multiplier, roundPlan, groundY, castlesStanding, sandLeft, burstRadius, createGame, startRound,
  takeEvents, step, roundDone, nearestBrigade, clampTarget, throwSand, endRound, setCalm, setHeight, autoAim,
} from '../src/lib/sandcastle/shore.mjs';
import { createMood, moodEvent, moodStep, moodResponse, beginGame, LABELS } from '../src/lib/breakwater/mood.mjs';
import { ROW } from '../src/lib/breakwater/row.mjs';

const tuneFor = (r) => ({ speed: r.speed * (r.label === 'DRIFT' ? 0.8 : 1), burst: r.paddle, rush: r.label === 'RUSH' });

test('layout: six castles and three brigades fit the 288 field in arcade order, none overlapping', () => {
  assert.equal(W, 288);
  assert.equal(CASTLE_X.length, 6);
  assert.equal(BRIGADE_X.length, 3);
  const all = [...BRIGADE_X.map((x) => ['b', x]), ...CASTLE_X.map((x) => ['c', x])].sort((a, b) => a[1] - b[1]);
  assert.equal(all.map((p) => p[0]).join(''), 'bcccbcccb');
  for (let i = 1; i < all.length; i += 1) assert.ok(all[i][1] - all[i - 1][1] >= 24, 'room for a castle or a bucket');
  for (const [, x] of all) assert.ok(x >= 14 && x <= W - 14);
  assert.ok(ROW.some((c) => c.slug === 'sandcastle' && c.after === 'Missile Command'));
});

test('rounds: the multiplier climbs every second round to 6x and later rounds send more, faster', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 10, 11, 40].map(multiplier), [1, 1, 2, 2, 3, 5, 6, 6]);
  let prev = roundPlan(1);
  assert.equal(prev.count, 10);
  for (let n = 2; n <= 30; n += 1) {
    const p = roundPlan(n);
    assert.ok(p.count >= prev.count && p.speed >= prev.speed && p.interval <= prev.interval);
    assert.ok(p.count <= 30 && p.speed <= 84 && p.split <= 0.5 && p.volley <= 4);
    prev = p;
  }
});

test('bursts open, hold and close', () => {
  const b = { t: 0, max: 15 };
  assert.equal(burstRadius(b), 0);
  b.t = BURST.grow / 2; const half = burstRadius(b); assert.ok(half > 0 && half < 15);
  b.t = BURST.grow + 0.01; assert.equal(burstRadius(b), 15);
  b.t = BURST.grow + BURST.hold + BURST.shrink / 2; assert.ok(Math.abs(burstRadius(b) - 7.5) < 1e-9);
  b.t = 10; assert.equal(burstRadius(b), 0);
});

test('throwing: nearest brigade with sand, ten each, a dry bucket says so, targets stay on the field', () => {
  const s = createGame({ seed: 1 });
  assert.equal(sandLeft(s), 30);
  assert.equal(nearestBrigade(s, 10), 0);
  assert.equal(nearestBrigade(s, 150), 1);
  assert.equal(nearestBrigade(s, 280), 2);
  for (let i = 0; i < SAND_PER_BRIGADE; i += 1) { throwSand(s, null, 20, 100); s.shots = []; }
  assert.equal(s.brigades[0].sand, 0);
  assert.equal(nearestBrigade(s, 10), 1, 'an empty bucket hands over to its neighbour');
  takeEvents(s);
  assert.equal(throwSand(s, 0, 20, 100), null);
  assert.equal(takeEvents(s).at(-1).type, 'dry');
  const shot = throwSand(s, 2, 999, 9999);
  const g = groundY(s);
  assert.deepEqual([shot.tx, shot.ty], [W - 4, g - 14]);
  assert.deepEqual(clampTarget(s, -5, 0), { x: 4, y: HUD + 4 });
  s.shots = [];
  for (let i = 0; i < MAX_SHOTS + 3; i += 1) throwSand(s, 1, 100, 100);
  assert.equal(s.shots.length, MAX_SHOTS);
});

test('a burst stops a wave line and three in one burst is a chain', () => {
  const s = createGame({ seed: 2 });
  s.queue = 0;
  takeEvents(s);
  for (const dx of [-3, 0, 3]) s.lines.push({ id: 90 + dx, sx: 100 + dx, sy: SEA_Y, x: 100 + dx, y: 150, target: { kind: 'castle', i: 0 }, speed: 20, splitAt: null });
  s.bursts.push({ x: 100, y: 152, t: BURST.grow, max: 15, stops: 0 });
  step(s, 1 / 60);
  const ev = takeEvents(s);
  assert.equal(ev.filter((e) => e.type === 'stop').length, 3);
  assert.equal(ev.filter((e) => e.type === 'chain').length, 1);
  assert.equal(s.score, 3 * POINTS.line);
  assert.equal(s.lines.length, 0);
  assert.ok(roundDone(s));
});

test('a wave line that reaches a castle washes it; one that reaches a brigade empties it for the round', () => {
  const s = createGame({ seed: 3 });
  s.queue = 0;
  const g = groundY(s);
  s.lines.push({ id: 1, sx: CASTLE_X[3], sy: SEA_Y, x: CASTLE_X[3], y: g - 1, target: { kind: 'castle', i: 3 }, speed: 40, splitAt: null });
  s.lines.push({ id: 2, sx: BRIGADE_X[1], sy: SEA_Y, x: BRIGADE_X[1], y: g - 1, target: { kind: 'brigade', i: 1 }, speed: 40, splitAt: null });
  step(s, 0.1);
  assert.equal(s.castles[3].standing, false);
  assert.equal(s.brigades[1].washed, true);
  assert.equal(s.brigades[1].sand, 0);
  assert.equal(castlesStanding(s), 5);
  startRound(s, 2);
  assert.equal(s.brigades[1].washed, false);
  assert.equal(s.brigades[1].sand, SAND_PER_BRIGADE);
  assert.equal(s.castles[3].standing, false, 'castles stay washed until rebuilt');
});

test('splits: a line past its split point sends another; RUSH sends two and the odd fast rogue', () => {
  const s = createGame({ seed: 4 });
  s.queue = 0;
  s.lines.push({ id: 1, sx: 100, sy: SEA_Y, x: 100, y: 199, target: { kind: 'castle', i: 0 }, speed: 30, splitAt: 200 });
  step(s, 0.1);
  assert.equal(s.lines.length, 2);
  s.lines = [{ id: 2, sx: 100, sy: SEA_Y, x: 100, y: 199, target: { kind: 'castle', i: 0 }, speed: 30, splitAt: 200 }];
  step(s, 0.1, { rush: true });
  assert.equal(s.lines.length, 3);
  let rogues = 0;
  for (let seed = 0; seed < 40; seed += 1) {
    const r = createGame({ seed });
    for (let i = 0; i < 60 * 30; i += 1) step(r, 1 / 60, { rush: true, speed: 0.01 });
    rogues += r.lines.filter((l) => l.rogue).length;
  }
  assert.ok(rogues > 0, 'RUSH brings rogue waves');
});

test('end of round: bonus per castle and per sand, multiplied; a castle back every 10,000; CALM rebuilds all', () => {
  const s = createGame({ seed: 5 });
  startRound(s, 3);
  s.castles[0].standing = false; s.castles[1].standing = false;
  s.brigades[0].sand = 4; s.brigades[1].washed = true; s.brigades[2].sand = 6;
  const r = endRound(s);
  assert.equal(r.mult, 2);
  assert.equal(r.castleBonus, 4 * POINTS.castle * 2);
  assert.equal(r.sandBonus, 10 * POINTS.sand * 2);
  assert.equal(r.allStanding, false);
  assert.equal(r.rebuilt, 0);
  assert.equal(castlesStanding(s), 4);
  s.score = REBUILD_EVERY - 10;
  s.lines.push({ id: 9, sx: 50, sy: SEA_Y, x: 50, y: 100, target: { kind: 'castle', i: 2 }, speed: 1, splitAt: null });
  s.bursts.push({ x: 50, y: 100, t: BURST.grow, max: 15, stops: 0 });
  s.queue = 0;
  takeEvents(s);
  step(s, 1 / 60);
  assert.equal(s.spares, 1);
  assert.ok(takeEvents(s).some((e) => e.type === 'spare'));
  assert.equal(endRound(s).rebuilt, 1);
  assert.equal(s.spares, 0);
  assert.equal(castlesStanding(s), 5);
  const calm = createGame({ seed: 6, calm: true });
  for (const c of calm.castles) c.standing = false;
  const cr = endRound(calm);
  assert.equal(cr.over, false);
  assert.equal(cr.rebuilt, 6);
});

test('the last castle ends a PLAY game at once; CALM never ends; leaving CALM with nothing standing rebuilds one', () => {
  const s = createGame({ seed: 7 });
  s.queue = 0;
  for (const c of s.castles.slice(1)) c.standing = false;
  const g = groundY(s);
  s.lines.push({ id: 1, sx: CASTLE_X[0], sy: SEA_Y, x: CASTLE_X[0], y: g - 1, target: { kind: 'castle', i: 0 }, speed: 40, splitAt: null });
  step(s, 0.1);
  assert.equal(s.lost, true);
  assert.ok(takeEvents(s).some((e) => e.type === 'lost'));
  assert.equal(throwSand(s, 1, 100, 100), null, 'nothing more to do once lost');
  setCalm(s, true);
  assert.equal(s.lost, true, 'a dial change during the loss pause does not undo a final loss');
  const c = createGame({ seed: 8, calm: true });
  for (const x of c.castles) x.standing = false;
  c.queue = 0;
  c.lines.push({ id: 1, sx: CASTLE_X[0], sy: SEA_Y, x: CASTLE_X[0], y: groundY(c) - 1, target: { kind: 'castle', i: 0 }, speed: 40, splitAt: null });
  step(c, 0.1);
  assert.equal(c.lost, false);
  setCalm(c, false);
  assert.equal(castlesStanding(c), 1);
});

test('resize: the beach moves at once and nothing in flight is left below it', () => {
  const s = createGame({ seed: 9, height: H_MAX });
  for (let i = 0; i < 60 * 12; i += 1) step(s, 1 / 60);
  s.lines.push({ id: 99, sx: 40, sy: SEA_Y, x: 40, y: groundY(s) - 3, target: { kind: 'castle', i: 0 }, speed: 20, splitAt: groundY(s) - 2 });
  throwSand(s, 1, 140, groundY(s) - 14);
  s.bursts.push({ x: 60, y: groundY(s) - 10, t: 0.1, max: 15, stops: 0 });
  setHeight(s, 300);
  assert.equal(s.h, H_MIN);
  const g = groundY(s);
  for (const l of s.lines) { assert.ok(l.y < g); if (l.splitAt != null) assert.ok(l.splitAt < g); }
  for (const sh of s.shots) assert.ok(sh.y <= g - 6 && sh.ty <= g - 14);
  for (const b of s.bursts) assert.ok(b.y <= g - 4);
  for (let i = 0; i < 60; i += 1) step(s, 1 / 60);
  for (const l of s.lines) assert.ok(l.y <= g);
});

test('simulated play: a careful player holds the beach for rounds, the mood answers, and an idle one loses', () => {
  const s = createGame({ seed: 2026 });
  const mood = createMood('play');
  beginGame(mood);
  const labels = new Set();
  let clock = 0, rounds = 0, stops = 0, chains = 0;
  for (let frame = 0; frame < 60 * 60 * 6 && !s.lost && rounds < 8; frame += 1) {
    const dt = 1 / 60;
    moodStep(mood, dt);
    const r = moodResponse(mood);
    labels.add(r.label);
    step(s, dt, tuneFor(r));
    clock += dt;
    if (clock >= 0.3) { clock = 0; const aim = autoAim(s, tuneFor(r).speed); if (aim) throwSand(s, aim.brigade, aim.x, aim.y); }
    for (const e of takeEvents(s)) {
      if (e.type === 'stop') { stops += 1; moodEvent(mood, 'paddle'); }
      if (e.type === 'chain') { chains += 1; moodEvent(mood, 'brick'); }
      if (e.type === 'castle') moodEvent(mood, 'loss');
    }
    if (roundDone(s) && s.bursts.length === 0 && s.shots.length === 0) {
      const res = endRound(s);
      if (res.allStanding) moodEvent(mood, 'wave');
      if (res.over) break;
      rounds += 1;
      startRound(s, s.round + 1);
    }
  }
  assert.ok(rounds >= 3, `cleared ${rounds} rounds`);
  assert.ok(stops >= 30, `stopped ${stops} lines`);
  assert.ok(s.score > 1000, `score ${s.score}`);
  assert.ok(castlesStanding(s) > 0);
  assert.ok([...labels].every((l) => LABELS.includes(l)));
  assert.ok(labels.size >= 2, `mood moved: ${[...labels]}`);
  assert.ok(chains >= 0);

  const idle = createGame({ seed: 11 });
  let seconds = 0;
  while (!idle.lost && seconds < 60 * 20) {
    for (let i = 0; i < 60; i += 1) step(idle, 1 / 60);
    seconds += 1;
    if (roundDone(idle)) { if (endRound(idle).over) break; startRound(idle, idle.round + 1); }
  }
  assert.ok(idle.lost || castlesStanding(idle) === 0, 'an untended beach washes away');

  const calm = createGame({ seed: 12, calm: true });
  for (let round = 0; round < 6; round += 1) {
    let guard = 0;
    while (!roundDone(calm) && guard < 60 * 120) { step(calm, 1 / 60); guard += 1; }
    assert.ok(roundDone(calm), 'every round ends');
    const res = endRound(calm);
    assert.equal(res.over, false);
    assert.equal(castlesStanding(calm), 6);
    startRound(calm, calm.round + 1);
  }
  assert.equal(calm.lost, false);
});

test('determinism: the same seed plays the same game', () => {
  const run = () => { const s = createGame({ seed: 77 }); for (let i = 0; i < 60 * 20; i += 1) { step(s, 1 / 60); if (i % 20 === 0) { const a = autoAim(s); if (a) throwSand(s, a.brigade, a.x, a.y); } } return [s.score, s.stopped, castlesStanding(s), s.lines.length]; };
  assert.deepEqual(run(), run());
  const r = mulberry32(1);
  for (let i = 0; i < 100; i += 1) { const v = r(); assert.ok(v >= 0 && v < 1); }
});
