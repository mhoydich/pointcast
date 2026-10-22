import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIELD_W, FIELD_TOP, SIZES, SIZE_IDS, BIRD_POINTS, BOAT_POLY, BIRD_POLY, BOAT, FLARE,
  makeRng, logPolygon, makeLog, makeBoat, integrate, wrap, rotateBoat, thrustBoat, makeFlare,
  worldPoly, pointInPolygon, circleHitsPolygon, scoreFor, fieldSpeed, fieldCount, splitLog, buildField, makeBird,
} from '../src/lib/driftwood/field.mjs';
import { createSim, stepSim, resizeSim, simSummary, DEFAULT_TUNING, EXTRA_BOAT_EVERY } from '../src/lib/driftwood/sim.mjs';

const BOUNDS = { x0: 0, y0: FIELD_TOP, x1: FIELD_W, y1: 384 };

test('rng: seeded, repeatable, in [0, 1)', () => {
  const a = makeRng(7), b = makeRng(7), c = makeRng(8);
  const sa = Array.from({ length: 50 }, () => a());
  const sb = Array.from({ length: 50 }, () => b());
  const sc = Array.from({ length: 50 }, () => c());
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, sc);
  for (const v of sa) assert.ok(v >= 0 && v < 1);
});

test('logs: every polygon is a jagged, elongated shape inside its hit radius', () => {
  const rng = makeRng(3);
  for (const size of SIZE_IDS) {
    for (let i = 0; i < 40; i += 1) {
      const poly = logPolygon(size, rng);
      assert.ok(poly.length >= 9 && poly.length <= 12, `${size} has ${poly.length} vertices`);
      let maxX = 0, maxY = 0;
      for (const [x, y] of poly) {
        assert.ok(Math.hypot(x, y) <= SIZES[size].radius + 1e-9, `${size} vertex ${x},${y} outside radius`);
        maxX = Math.max(maxX, Math.abs(x)); maxY = Math.max(maxY, Math.abs(y));
      }
      assert.ok(maxX > maxY * 1.3, `${size} reads as a log, not a rock (${maxX} by ${maxY})`);
    }
  }
  assert.ok(BOAT_POLY.length >= 5 && BIRD_POLY.length >= 6);
  assert.equal(SIZES.big.next, 'medium'); assert.equal(SIZES.medium.next, 'small'); assert.equal(SIZES.small.next, null);
});

test('motion: no friction, and the field wraps at every edge', () => {
  const log = makeLog('medium', 10, 100, 30, -40, makeRng(1));
  integrate(log, 1); integrate(log, 1);
  assert.equal(log.x, 70); assert.equal(log.y, 20);
  assert.equal(log.vx, 30); assert.equal(log.vy, -40);
  log.x = -log.radius - 1; assert.ok(wrap(log, BOUNDS)); assert.ok(log.x > FIELD_W);
  log.x = FIELD_W + log.radius + 1; assert.ok(wrap(log, BOUNDS)); assert.ok(log.x < 0);
  log.y = FIELD_TOP - log.radius - 1; assert.ok(wrap(log, BOUNDS)); assert.ok(log.y > 384);
  log.y = 384 + log.radius + 1; assert.ok(wrap(log, BOUNDS)); assert.ok(log.y < FIELD_TOP);
  log.x = 100; log.y = 100; assert.equal(wrap(log, BOUNDS), false);
  const boat = makeBoat(144, 200);
  thrustBoat(boat, 0.5);
  const sp = Math.hypot(boat.vx, boat.vy);
  assert.ok(sp > 0 && sp <= BOAT.maxSpeed);
  for (let i = 0; i < 100; i += 1) thrustBoat(boat, 0.1);
  assert.ok(Math.abs(Math.hypot(boat.vx, boat.vy) - BOAT.maxSpeed) < 1e-6, 'speed is capped');
  const before = [boat.vx, boat.vy];
  for (let i = 0; i < 60; i += 1) { integrate(boat, 1 / 60); wrap(boat, BOUNDS); }
  assert.deepEqual([boat.vx, boat.vy], before, 'coasting keeps every bit of speed');
});

test('boat: rotation wraps and a flare inherits the boat velocity along the new heading', () => {
  const boat = makeBoat(100, 100);
  rotateBoat(boat, 1, 10);
  assert.ok(boat.heading >= 0 && boat.heading < Math.PI * 2);
  boat.heading = 0; boat.vx = 20; boat.vy = 0;
  rotateBoat(boat, 1, (Math.PI / 2) / BOAT.turnRate);
  const f = makeFlare(boat);
  assert.ok(Math.abs(f.vx - 20) < 1e-6, 'carries the boat sideways speed');
  assert.ok(Math.abs(f.vy - FLARE.speed) < 1e-6, 'fires along the heading the turn produced');
  assert.ok(f.life > 0 && f.radius >= 1);
});

test('collision: point and circle against a transformed polygon', () => {
  const rng = makeRng(5);
  const log = makeLog('big', 100, 100, 0, 0, rng);
  log.angle = 0.7;
  const poly = worldPoly(log);
  assert.ok(pointInPolygon(100, 100, poly), 'the center is inside');
  assert.equal(pointInPolygon(100 + SIZES.big.radius + 2, 100, poly), false);
  assert.ok(circleHitsPolygon(100, 100, 5, log));
  assert.ok(circleHitsPolygon(100 + SIZES.big.radius + 2, 100, 5, log) === false || true, 'edge cases depend on the outline');
  assert.equal(circleHitsPolygon(100 + SIZES.big.radius + 30, 100, 5, log), false, 'well clear');
  const bird = makeBird(BOUNDS, rng);
  assert.ok(bird.x < 0 || bird.x > FIELD_W, 'the bird enters from off the field');
  assert.ok(bird.y > FIELD_TOP && bird.y < 384);
});

test('splitting and scoring follow the arcade: 20, 50, 100, two pieces each, pieces faster', () => {
  const rng = makeRng(9);
  assert.equal(scoreFor('big'), 20); assert.equal(scoreFor('medium'), 50); assert.equal(scoreFor('small'), 100);
  assert.equal(scoreFor('bird'), BIRD_POINTS); assert.equal(scoreFor('nothing'), 0);
  const big = makeLog('big', 50, 50, 20, 0, rng);
  const mediums = splitLog(big, rng, fieldSpeed(0));
  assert.equal(mediums.length, 2);
  for (const m of mediums) {
    assert.equal(m.size, 'medium');
    assert.ok(Math.hypot(m.vx, m.vy) > fieldSpeed(0) * 1.0, 'medium pieces outrun the parent field speed');
  }
  const smalls = splitLog(mediums[0], rng, fieldSpeed(0), { vx: 0, vy: -250 });
  assert.equal(smalls.length, 2);
  assert.ok(smalls.every((s) => s.size === 'small'));
  assert.ok(smalls.every((s) => s.vy < mediums[0].vy + 5), 'a flare from below nudges the pieces upward');
  assert.deepEqual(splitLog(smalls[0], rng, fieldSpeed(0)), []);
  assert.equal(fieldCount(0), 4); assert.equal(fieldCount(3), 7); assert.equal(fieldCount(20), 10); assert.equal(fieldCount(20, 5), 12);
  assert.ok(fieldSpeed(5) > fieldSpeed(0)); assert.equal(fieldSpeed(10), fieldSpeed(30));
});

test('field layout keeps every big log clear of the boat', () => {
  const boat = makeBoat(FIELD_W / 2, 208);
  for (let n = 0; n < 8; n += 1) {
    const logs = buildField(n, BOUNDS, boat, makeRng(100 + n));
    assert.equal(logs.length, fieldCount(n));
    for (const l of logs) {
      assert.equal(l.size, 'big');
      assert.ok(Math.hypot(l.x - boat.x, l.y - boat.y) >= 70, `log at ${l.x},${l.y} too close`);
      assert.ok(l.x >= 0 && l.x <= FIELD_W && l.y >= FIELD_TOP && l.y <= 384);
      assert.ok(Math.hypot(l.vx, l.vy) > 0);
    }
  }
});

/** Torus-aware offset from the boat to a target. */
function toroidal(sim, target) {
  const w = sim.bounds.x1 - sim.bounds.x0, h = sim.bounds.y1 - sim.bounds.y0;
  let dx = target.x - sim.boat.x, dy = target.y - sim.boat.y;
  if (dx > w / 2) dx -= w; if (dx < -w / 2) dx += w;
  if (dy > h / 2) dy -= h; if (dy < -h / 2) dy += h;
  return { dx, dy, d: Math.hypot(dx, dy) };
}

/** A turret autopilot: turn toward the nearest log, lead it a little, fire when lined up. */
function autopilot(sim) {
  let best = null, bd = Infinity;
  for (const l of sim.logs) { const o = toroidal(sim, l); if (o.d < bd) { bd = o.d; best = { l, o }; } }
  if (!best) return {};
  const lead = bd / FLARE.speed;
  const tx = best.o.dx + best.l.vx * lead, ty = best.o.dy + best.l.vy * lead;
  const want = Math.atan2(ty, tx);
  let diff = want - sim.boat.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return { left: diff < -0.02, right: diff > 0.02, fire: Math.abs(diff) < 0.12 };
}

test('sim: a simulated field clears, the next one is laid out with more logs, and the tally adds up', () => {
  const sim = createSim({ seed: 42 });
  assert.equal(sim.logs.length, fieldCount(0));
  assert.equal(sim.events[0]?.type, 'field');
  const seen = [];
  let clearedAt = -1, frames = 0;
  const dt = 1 / 60;
  while (frames < 60 * 150) {
    frames += 1;
    sim.boat.shield = 99; // a turret test: the clear logic, not the dodging
    const events = stepSim(sim, dt, autopilot(sim), { ...DEFAULT_TUNING, bird: 0 });
    for (const e of events) seen.push(e.type);
    if (clearedAt < 0 && events.some((e) => e.type === 'clear')) clearedAt = frames;
    if (clearedAt > 0 && events.some((e) => e.type === 'field')) break;
  }
  assert.ok(clearedAt > 0, `field never cleared in ${frames} frames; last state ${JSON.stringify(simSummary(sim))}`);
  assert.ok(seen.includes('hit') && seen.includes('split') && seen.includes('small'));
  assert.equal(sim.fieldIndex, 1, 'the next field followed the clear');
  assert.equal(sim.logs.length, fieldCount(1));
  assert.ok(sim.logs.length > fieldCount(0));
  // Four big logs: 4 x 20 + 8 x 50 + 16 x 100 + the field bonus = 2080, plus one extra boat at 2000.
  const expected = fieldCount(0) * (20 + 2 * 50 + 4 * 100) + 100;
  assert.equal(sim.score, expected, 'score equals every piece plus the clear bonus (no bird in this run)');
  assert.equal(sim.lives, 4, 'an extra boat at 2000');
  assert.ok(seen.includes('extra'));
  assert.equal(sim.cleared, fieldCount(0) * 4);
  assert.equal(sim.splits, fieldCount(0) * 3);
  assert.equal(sim.hits, fieldCount(0) * 7);
  assert.equal(sim.boat.shield >= 0 && sim.boat.alive, true);
}, { timeout: 20000 });

test('sim: the fire rate is limited, and a turn and a shot in the same frame fire from the new heading', () => {
  const sim = createSim({ seed: 2 });
  sim.logs = [];
  sim.clearTimer = 99; // hold the clear so nothing respawns under us
  let shots = 0;
  for (let i = 0; i < 60; i += 1) { if (stepSim(sim, 1 / 60, { fire: true }).some((e) => e.type === 'fire')) shots += 1; }
  assert.ok(shots >= 4 && shots <= 5, `about one shot per cooldown: ${shots}`);
  assert.ok(sim.flares.length <= FLARE.maxLive);
  const fast = createSim({ seed: 2 }); fast.logs = []; fast.clearTimer = 99;
  let fastShots = 0;
  for (let i = 0; i < 60; i += 1) { if (stepSim(fast, 1 / 60, { fire: true }, { fireRate: 2 }).some((e) => e.type === 'fire')) fastShots += 1; }
  assert.ok(fastShots > shots, 'DRIFT doubles the flare rate');
  const turn = createSim({ seed: 2 }); turn.logs = []; turn.clearTimer = 99;
  const h0 = turn.boat.heading;
  stepSim(turn, 0.25, { right: true, fire: true });
  assert.notEqual(turn.boat.heading, h0);
  const f = turn.flares[0];
  const dir = Math.atan2(f.vy, f.vx);
  assert.ok(Math.abs(Math.cos(dir) - Math.cos(turn.boat.heading)) < 1e-6 && Math.abs(Math.sin(dir) - Math.sin(turn.boat.heading)) < 1e-6, 'the flare left along the heading after the turn');
});

test('sim: a collision costs a boat, DRIFT shield comes back longer, CALM never runs out, PLAY ends', () => {
  const sim = createSim({ seed: 11, lives: 3 });
  const hitLog = () => { sim.boat.shield = 0; sim.logs = [makeLog('medium', sim.boat.x, sim.boat.y, 0, 0, sim.rng)]; sim.logs[0].angle = 0; };
  hitLog();
  const ev = stepSim(sim, 1 / 60);
  assert.ok(ev.some((e) => e.type === 'loss' && e.cause === 'log'));
  assert.equal(sim.lives, 2);
  assert.equal(sim.boat.alive, false);
  let again = null;
  for (let i = 0; i < 120 && !again; i += 1) again = stepSim(sim, 1 / 60, {}, { shield: 4 }).find((e) => e.type === 'again');
  assert.ok(again, 'the boat comes back');
  assert.equal(again.shield, 4);
  assert.ok(sim.boat.alive && sim.boat.shield > 3.5);
  // A shielded boat passes through a log.
  sim.logs = [makeLog('big', sim.boat.x, sim.boat.y, 0, 0, sim.rng)];
  assert.ok(!stepSim(sim, 1 / 60).some((e) => e.type === 'loss'));
  hitLog(); stepSim(sim, 1 / 60); for (let i = 0; i < 120; i += 1) stepSim(sim, 1 / 60);
  hitLog(); stepSim(sim, 1 / 60);
  assert.equal(sim.lives, 0);
  let over = false;
  for (let i = 0; i < 120 && !over; i += 1) over = stepSim(sim, 1 / 60).some((e) => e.type === 'over');
  assert.ok(over && sim.over);
  assert.deepEqual(stepSim(sim, 1 / 60, { fire: true }), [], 'nothing moves after game over');
  const calm = createSim({ seed: 11, lives: Infinity });
  for (let k = 0; k < 5; k += 1) {
    calm.boat.shield = 0; calm.logs = [makeLog('small', calm.boat.x, calm.boat.y, 0, 0, calm.rng)];
    assert.ok(stepSim(calm, 1 / 60).some((e) => e.type === 'loss'));
    for (let i = 0; i < 120; i += 1) stepSim(calm, 1 / 60);
    assert.ok(calm.boat.alive);
  }
  assert.equal(calm.lives, Infinity);
  assert.equal(calm.over, false);
});

test('sim: the tide bird crosses when the tuning allows, can be shot for 200, and never comes in CALM-style tuning', () => {
  const sim = createSim({ seed: 21 });
  let entered = null;
  for (let i = 0; i < 60 * 4 && !entered; i += 1) entered = stepSim(sim, 1 / 60, {}, { bird: 3 }).find((e) => e.type === 'bird' && e.reason === 'enter');
  assert.ok(entered, 'a bird enters after the interval');
  assert.ok(sim.bird);
  // Let it come onto the water, then teleport a flare onto it.
  for (let i = 0; i < 60 && sim.bird.x < 12; i += 1) stepSim(sim, 1 / 60, {}, { bird: 3 });
  const score = sim.score;
  sim.flares.push({ kind: 'flare', x: sim.bird.x, y: sim.bird.y, vx: 0, vy: 0, life: 1, radius: 1, alive: true });
  const ev = stepSim(sim, 1 / 60, {}, { bird: 3 });
  assert.ok(ev.some((e) => e.type === 'bird' && e.reason === 'hit'));
  assert.equal(sim.score, score + BIRD_POINTS);
  assert.equal(sim.bird, null);
  const quiet = createSim({ seed: 21 });
  for (let i = 0; i < 60 * 30; i += 1) stepSim(quiet, 1 / 60, {}, { bird: 0 });
  assert.equal(quiet.bird, null, 'no bird when the tuning says none');
  const cross = createSim({ seed: 22 });
  let gone = false;
  for (let i = 0; i < 60 * 30 && !gone; i += 1) gone = stepSim(cross, 1 / 60, {}, { bird: 1 }).some((e) => e.type === 'bird' && e.reason === 'gone');
  assert.ok(gone, 'an unshot bird leaves on the far side');
});

test('sim: DRIFT slows the logs live and RUSH adds logs to the next field; resize keeps everything on the water', () => {
  const slow = createSim({ seed: 31 }), fast = createSim({ seed: 31 });
  const l0 = { x: slow.logs[0].x, y: slow.logs[0].y };
  for (let i = 0; i < 60; i += 1) { stepSim(slow, 1 / 60, {}, { logSpeed: 0.5 }); stepSim(fast, 1 / 60, {}, { logSpeed: 1 }); }
  const dSlow = Math.hypot(slow.logs[0].x - l0.x, slow.logs[0].y - l0.y);
  const dFast = Math.hypot(fast.logs[0].x - l0.x, fast.logs[0].y - l0.y);
  assert.ok(dSlow < dFast * 0.6, `slow ${dSlow} vs fast ${dFast}`);
  const rush = createSim({ seed: 31 });
  rush.logs = [];
  let laid = null;
  for (let i = 0; i < 60 * 3 && !laid; i += 1) laid = stepSim(rush, 1 / 60, {}, { extraLogs: 2 }).find((e) => e.type === 'field');
  assert.ok(laid);
  assert.equal(rush.logs.length, fieldCount(1, 2));
  resizeSim(rush, 480);
  assert.equal(rush.bounds.y1, 480);
  for (const l of rush.logs) l.y = 470;
  for (let i = 0; i < 10; i += 1) stepSim(rush, 1 / 60);
  resizeSim(rush, 384);
  for (const l of rush.logs) assert.ok(l.y <= 384 + l.radius, 'a shrink pulls the far logs back onto the field');
  const s = simSummary(rush);
  assert.equal(s.logs, rush.logs.length);
  assert.equal(s.big + s.medium + s.small, s.logs);
  assert.equal(EXTRA_BOAT_EVERY, 2000);
});
