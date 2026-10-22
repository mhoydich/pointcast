/**
 * Driftwood simulation: one field of water, headless.
 *
 * The page (src/pages/driftwood.astro) owns rendering, sound, the mood model
 * and the title/boot/over phases. Everything that happens on the water goes
 * through here, so tests/driftwood.test.mjs can play a whole field without a
 * browser: `createSim`, then `stepSim(sim, dt, input, tuning)` once per frame.
 * Each step returns the events that happened, in order:
 *
 *   hit    a flare struck a log (size) or the bird
 *   split  a log broke into two pieces (size of the parent)
 *   small  a small log was cleared, nothing left of it
 *   bird   the tide bird was hit, or (reason: 'enter') crossed onto the field
 *   loss   the boat struck something
 *   again  the boat came back with a shield
 *   clear  the last log is gone; the next field follows after a pause
 *   field  the next field was laid out (index)
 *   extra  an extra boat was earned
 *   over   no boats left
 *
 * `tuning` is what the mood hands down each frame:
 *   logSpeed    multiplier on every log's drift (DRIFT slows them)
 *   fireRate    multiplier on the flare rate
 *   shield      seconds of shield after a loss
 *   extraLogs   more big logs on the next field (RUSH)
 *   bird        whether the tide bird may cross, and how often (seconds between visits)
 */
import {
  FIELD_W, FIELD_TOP, FIELD_H_MIN, SIZES, BOAT, FLARE, FIELD_CLEAR_POINTS,
  makeRng, makeBoat, makeFlare, makeBird, buildField, splitLog, scoreFor, fieldSpeed,
  integrate, wrap, rotateBoat, thrustBoat, circleHitsPolygon, circlesTouch, pointInPolygon, worldPoly, nearestImage, torusDelta,
} from './field.mjs';

export const DEFAULT_TUNING = Object.freeze({ logSpeed: 1, fireRate: 1, shield: 1.6, extraLogs: 0, bird: 14 });
export const EXTRA_BOAT_EVERY = 2000;
const CLEAR_PAUSE = 1.6;
const RESPAWN_PAUSE = 1.2;
const START_SHIELD = 1.8;

export function createSim({ width = FIELD_W, top = FIELD_TOP, height = FIELD_H_MIN, seed = 1, lives = 3, field = 0, rng = null } = {}) {
  const sim = {
    bounds: { x0: 0, y0: top, x1: width, y1: height },
    rng: rng || makeRng(seed),
    boat: makeBoat(width / 2, (top + height) / 2),
    logs: [],
    flares: [],
    sparks: [],
    bird: null,
    birdClock: 0,
    fieldIndex: field,
    score: 0,
    lives,
    nextExtra: EXTRA_BOAT_EVERY,
    fireClock: 0,
    fieldClock: 0,
    clearTimer: 0,
    respawnTimer: 0,
    over: false,
    time: 0,
    hits: 0,
    splits: 0,
    cleared: 0,
    events: [],
  };
  sim.boat.shield = START_SHIELD;
  layField(sim, field, 0);
  return sim;
}

function emit(sim, type, extra) {
  sim.events.push(extra ? { type, ...extra } : { type });
}

function layField(sim, index, extra) {
  sim.fieldIndex = index;
  sim.logs = buildField(index, sim.bounds, sim.boat, sim.rng, { extra });
  sim.flares = [];
  sim.bird = null;
  sim.birdClock = 0;
  sim.fieldClock = 0;
  sim.boat.shield = Math.max(sim.boat.shield, START_SHIELD);
  emit(sim, 'field', { index, count: sim.logs.length });
}

/**
 * The page calls this when the stage grows or shrinks (a rotation, fullscreen).
 * Everything is wrapped back onto the water at once; a shrink that may have
 * moved a log onto the boat gives the boat a moment of shield.
 */
export function resizeSim(sim, height) {
  const before = sim.bounds.y1;
  sim.bounds.y1 = Math.max(sim.bounds.y0 + 120, height);
  for (const b of [sim.boat, ...sim.logs, ...sim.flares]) wrap(b, sim.bounds);
  if (sim.bounds.y1 < before && sim.boat.alive) sim.boat.shield = Math.max(sim.boat.shield, 1);
}

function spawnSparks(sim, x, y, n, speed) {
  for (let i = 0; i < n; i += 1) {
    const a = sim.rng() * Math.PI * 2, sp = speed * (0.3 + sim.rng() * 0.7);
    sim.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.25 + sim.rng() * 0.45, t: 0 });
  }
  if (sim.sparks.length > 160) sim.sparks.splice(0, sim.sparks.length - 160);
}

function addScore(sim, points) {
  sim.score += points;
  if (sim.score >= sim.nextExtra) {
    sim.nextExtra += EXTRA_BOAT_EVERY;
    if (Number.isFinite(sim.lives)) { sim.lives += 1; emit(sim, 'extra', { lives: sim.lives }); }
  }
}

function breakLog(sim, log, impulse, tuning) {
  log.alive = false;
  sim.hits += 1;
  addScore(sim, scoreFor(log.size));
  emit(sim, 'hit', { size: log.size, x: log.x, y: log.y });
  const pieces = splitLog(log, sim.rng, fieldSpeed(sim.fieldIndex) * tuning.logSpeed, impulse);
  if (pieces.length) {
    sim.splits += 1;
    sim.logs.push(...pieces);
    emit(sim, 'split', { size: log.size, x: log.x, y: log.y });
    spawnSparks(sim, log.x, log.y, log.size === 'big' ? 10 : 6, 70);
  } else {
    sim.cleared += 1;
    emit(sim, 'small', { x: log.x, y: log.y });
    spawnSparks(sim, log.x, log.y, 8, 90);
  }
}

function loseBoat(sim, cause) {
  const boat = sim.boat;
  boat.alive = false;
  boat.vx = 0; boat.vy = 0;
  boat.thrusting = false;
  spawnSparks(sim, boat.x, boat.y, 18, 110);
  if (Number.isFinite(sim.lives)) sim.lives -= 1;
  sim.respawnTimer = RESPAWN_PAUSE;
  emit(sim, 'loss', { cause, lives: sim.lives, x: boat.x, y: boat.y });
}

/**
 * One frame. `input` = { left, right, thrust, fire } booleans. Rotation is
 * applied before the shot, so a turn and a tap in the same frame fire from
 * the new heading.
 */
export function stepSim(sim, dt, input = {}, tuning = DEFAULT_TUNING) {
  sim.events = [];
  if (sim.over) return sim.events;
  const t = { ...DEFAULT_TUNING, ...tuning };
  const { bounds, boat, rng } = sim;
  sim.time += dt;
  sim.fieldClock += dt;
  sim.fireClock = Math.max(0, sim.fireClock - dt);
  const speedScale = t.logSpeed;

  // ---- boat ----
  if (boat.alive) {
    if (boat.shield > 0) boat.shield -= dt;
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir) rotateBoat(boat, dir, dt);
    boat.thrusting = !!input.thrust;
    if (boat.thrusting) thrustBoat(boat, dt);
    integrate(boat, dt);
    wrap(boat, bounds);
    const live = sim.flares.length;
    if (input.fire && sim.fireClock <= 0 && live < FLARE.maxLive) {
      sim.flares.push(makeFlare(boat));
      sim.fireClock = FLARE.cooldown / Math.max(0.25, t.fireRate);
      emit(sim, 'fire');
    }
  } else if (sim.respawnTimer > 0) {
    sim.respawnTimer -= dt;
    if (sim.respawnTimer <= 0) {
      if (Number.isFinite(sim.lives) && sim.lives <= 0) { sim.over = true; emit(sim, 'over', { score: sim.score }); return sim.events; }
      boat.x = (bounds.x0 + bounds.x1) / 2; boat.y = (bounds.y0 + bounds.y1) / 2;
      boat.vx = 0; boat.vy = 0; boat.heading = -Math.PI / 2;
      boat.alive = true; boat.shield = t.shield;
      emit(sim, 'again', { shield: t.shield });
    }
  }

  // ---- logs ----
  for (const log of sim.logs) {
    // Drift is scaled live so DRIFT slows a field that is already moving.
    log.x += log.vx * speedScale * dt;
    log.y += log.vy * speedScale * dt;
    log.angle += log.spin * dt;
    wrap(log, bounds);
  }

  // ---- flares ----
  for (const f of sim.flares) {
    f.life -= dt;
    if (f.life <= 0) { f.alive = false; continue; }
    integrate(f, dt);
    wrap(f, bounds);
    for (const log of sim.logs) {
      if (!log.alive) continue;
      // Test the flare's wrapped copy nearest the log, so a hit across the seam counts.
      const [fx, fy] = nearestImage(f.x, f.y, log, bounds);
      if (Math.hypot(fx - log.x, fy - log.y) > log.radius + 1) continue;
      if (pointInPolygon(fx, fy, worldPoly(log))) { f.alive = false; breakLog(sim, log, f, t); break; }
    }
    if (f.alive && sim.bird && sim.bird.alive && circlesTouch(f, sim.bird)) {
      f.alive = false; sim.bird.alive = false; sim.hits += 1;
      addScore(sim, scoreFor('bird'));
      emit(sim, 'hit', { size: 'bird', x: sim.bird.x, y: sim.bird.y });
      emit(sim, 'bird', { reason: 'hit', x: sim.bird.x, y: sim.bird.y });
      spawnSparks(sim, sim.bird.x, sim.bird.y, 12, 100);
      sim.bird = null;
    }
  }
  sim.flares = sim.flares.filter((f) => f.alive);
  sim.logs = sim.logs.filter((l) => l.alive);

  // ---- tide bird ----
  if (sim.bird) {
    const b = sim.bird;
    b.t += dt;
    b.x += b.vx * dt;
    b.y = b.baseY + Math.sin(b.t * 2.2) * 9;
    if (b.x < bounds.x0 - 2 * b.radius - 4 || b.x > bounds.x1 + 2 * b.radius + 4) { sim.bird = null; emit(sim, 'bird', { reason: 'gone' }); }
  } else if (t.bird && t.bird > 0 && sim.logs.length > 0 && boat.alive) {
    sim.birdClock += dt;
    if (sim.birdClock >= t.bird) {
      sim.birdClock = 0;
      sim.bird = makeBird(bounds, rng, 60 + 10 * Math.min(sim.fieldIndex, 5));
      emit(sim, 'bird', { reason: 'enter', x: sim.bird.x, y: sim.bird.y });
    }
  }

  // ---- collisions with the boat ----
  if (boat.alive && boat.shield <= 0) {
    let struck = null;
    for (const log of sim.logs) {
      const [bx, by] = nearestImage(boat.x, boat.y, log, bounds);
      if (circleHitsPolygon(bx, by, boat.radius, log)) { struck = log; break; }
    }
    if (struck) { breakLog(sim, struck, null, t); sim.logs = sim.logs.filter((l) => l.alive); loseBoat(sim, 'log'); }
    else if (sim.bird) {
      const { dx, dy } = torusDelta(sim.bird.x, sim.bird.y, boat.x, boat.y, bounds);
      if (Math.hypot(dx, dy) < boat.radius + sim.bird.radius) { sim.bird = null; loseBoat(sim, 'bird'); }
    }
  }

  // ---- sparks ----
  for (const s of sim.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 1 - 1.5 * dt; s.vy *= 1 - 1.5 * dt; }
  sim.sparks = sim.sparks.filter((s) => s.t < s.life);

  // ---- field clear ----
  if (sim.logs.length === 0) {
    if (sim.clearTimer <= 0) {
      sim.clearTimer = CLEAR_PAUSE;
      addScore(sim, FIELD_CLEAR_POINTS);
      emit(sim, 'clear', { index: sim.fieldIndex, score: sim.score });
    } else {
      sim.clearTimer -= dt;
      if (sim.clearTimer <= 0) { sim.clearTimer = 0; layField(sim, sim.fieldIndex + 1, t.extraLogs); }
    }
  }
  return sim.events;
}

/** Counts the readout and the mood want each frame. */
export function simSummary(sim) {
  let big = 0, medium = 0, small = 0;
  for (const l of sim.logs) { if (l.size === 'big') big += 1; else if (l.size === 'medium') medium += 1; else small += 1; }
  const speed = Math.hypot(sim.boat.vx, sim.boat.vy);
  return { logs: sim.logs.length, big, medium, small, speed, flares: sim.flares.length, bird: !!sim.bird };
}

export { SIZES, BOAT, FLARE };
