/**
 * Sandcastle shore: the pure rules for /sandcastle, a Missile Command made
 * innocent. Six sandcastles stand on the beach with three bucket brigades
 * between them; thin wave lines run down from the sea toward them, and some
 * split on the way. A sand burst thrown from a brigade opens into a circle
 * that grows and shrinks and stops any wave line whose head enters it.
 *
 * Shape follows the 1980 arcade original: three bases of ten shots each per
 * round, six cities, a bonus for every city standing and every shot left, a
 * score multiplier that climbs every second round to 6x, and a rebuilt city
 * every 10,000 points. Everything else (speeds, split odds, the rogue wave)
 * was tuned for a phone held upright.
 *
 * No DOM, no clock: the page passes `dt` and a `tune` drawn from the mood, so
 * tests/sandcastle.test.mjs can play whole games with a seeded generator.
 */
export const W = 288;
export const H_MIN = 384;
export const H_MAX = 480;
export const HUD = 32;
/** Wave lines leave the sea at this height. */
export const SEA_Y = 44;
/** The beach is this far above the bottom of the field. */
export const GROUND_DROP = 28;
export const BRIGADE_X = Object.freeze([22, 144, 266]);
export const CASTLE_X = Object.freeze([52, 82, 112, 176, 206, 236]);
export const SAND_PER_BRIGADE = 10;
export const REBUILD_EVERY = 10000;
export const POINTS = Object.freeze({ line: 25, rogue: 125, castle: 100, sand: 5 });
/** Seconds to open, hold and close; radius in logical pixels before the mood's multiplier. */
export const BURST = Object.freeze({ radius: 15, grow: 0.5, hold: 0.25, shrink: 0.6 });
/** The middle brigade throws faster, as the arcade's center base fired faster. */
export const SHOT_SPEED = Object.freeze([250, 360, 250]);
export const MAX_SHOTS = 8;
/** What RUSH adds: more splits, a chance per volley of a fast rogue wave. */
export const RUSH = Object.freeze({ split: 0.2, rogue: 0.3, rogueSpeed: 2.4, children: 2 });

/** Small seeded generator, so a test can replay a game exactly. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function multiplier(round) {
  return Math.min(6, 1 + Math.floor((Math.max(1, round) - 1) / 2));
}

/** How round `n` (1-based) plays before the mood touches it. */
export function roundPlan(round) {
  const n = Math.max(1, Math.floor(round));
  return {
    round: n,
    count: Math.min(30, 8 + 2 * n),
    speed: Math.min(84, 20 + 5 * (n - 1)),
    volley: Math.min(4, 2 + Math.floor((n - 1) / 3)),
    interval: Math.max(1.6, 3.6 - 0.2 * (n - 1)),
    split: Math.min(0.5, 0.12 + 0.04 * (n - 1)),
    multiplier: multiplier(n),
  };
}

export const groundY = (s) => s.h - GROUND_DROP;
export const castlesStanding = (s) => s.castles.filter((c) => c.standing).length;
export const sandLeft = (s) => s.brigades.reduce((n, b) => n + (b.washed ? 0 : b.sand), 0);

/** Open, hold, close. Zero once the burst is spent. */
export function burstRadius(b) {
  const { grow, hold, shrink } = BURST;
  if (b.t < 0) return 0;
  if (b.t < grow) return b.max * Math.sin((b.t / grow) * (Math.PI / 2));
  if (b.t < grow + hold) return b.max;
  if (b.t < grow + hold + shrink) return b.max * (1 - (b.t - grow - hold) / shrink);
  return 0;
}

export function createGame({ height = H_MIN, calm = false, seed = null } = {}) {
  const s = {
    h: clamp(height, H_MIN, H_MAX),
    calm: Boolean(calm),
    rng: seed == null ? Math.random : mulberry32(seed),
    round: 0,
    plan: null,
    score: 0,
    nextRebuild: REBUILD_EVERY,
    spares: 0,
    castles: CASTLE_X.map((x) => ({ x, standing: true })),
    brigades: BRIGADE_X.map((x) => ({ x, sand: SAND_PER_BRIGADE, washed: false })),
    lines: [],
    shots: [],
    bursts: [],
    events: [],
    queue: 0,
    spawnClock: 0,
    stopped: 0,
    chains: 0,
    washedThisRound: 0,
    lost: false,
    nextId: 1,
  };
  startRound(s, 1);
  return s;
}

export function startRound(s, n) {
  s.round = n;
  s.plan = roundPlan(n);
  s.queue = s.plan.count;
  s.spawnClock = 0.8;
  s.lines = []; s.shots = []; s.bursts = [];
  s.washedThisRound = 0;
  for (const b of s.brigades) { b.sand = SAND_PER_BRIGADE; b.washed = false; }
  return s;
}

function emit(s, type, data = {}) { s.events.push({ type, ...data }); }

/** Drain the events since the last call: the page plays sounds and feeds the mood from these. */
export function takeEvents(s) {
  const out = s.events;
  s.events = [];
  return out;
}

function addScore(s, points) {
  s.score += points;
  while (s.score >= s.nextRebuild) {
    s.nextRebuild += REBUILD_EVERY;
    s.spares += 1;
    emit(s, 'spare', { spares: s.spares });
  }
}

function pickTarget(s) {
  const r = s.rng();
  const standing = [];
  s.castles.forEach((c, i) => { if (c.standing) standing.push(i); });
  if (r < 0.72 && standing.length) return { kind: 'castle', i: standing[Math.floor(s.rng() * standing.length)] };
  if (r < 0.9) return { kind: 'brigade', i: Math.floor(s.rng() * s.brigades.length) };
  return { kind: 'castle', i: Math.floor(s.rng() * s.castles.length) };
}

export const targetX = (s, t) => (t.kind === 'castle' ? s.castles[t.i].x : s.brigades[t.i].x);

function makeLine(s, x, y, speed, { rogue = false, child = false, splitChance = 0 } = {}) {
  const g = groundY(s);
  const splitAt = !child && !rogue && s.rng() < splitChance ? y + (g - y) * (0.3 + 0.3 * s.rng()) : null;
  const line = { id: s.nextId++, sx: x, sy: y, x, y, target: pickTarget(s), speed, rogue, child, splitAt };
  s.lines.push(line);
  return line;
}

function spawnVolley(s, tune) {
  const n = Math.min(s.queue, s.plan.volley);
  const splitChance = Math.min(0.75, s.plan.split + (tune.rush ? RUSH.split : 0));
  for (let i = 0; i < n; i += 1) {
    makeLine(s, 8 + s.rng() * (W - 16), SEA_Y, s.plan.speed * (0.85 + 0.3 * s.rng()), { splitChance });
    s.queue -= 1;
  }
  if (tune.rush && s.queue > 0 && s.rng() < RUSH.rogue) {
    const line = makeLine(s, 8 + s.rng() * (W - 16), SEA_Y, s.plan.speed * RUSH.rogueSpeed, { rogue: true });
    s.queue -= 1;
    emit(s, 'rogue', { x: line.x });
  }
}

function wash(s, line) {
  const t = line.target;
  if (t.kind === 'castle') {
    const c = s.castles[t.i];
    if (!c.standing) { emit(s, 'splash', { x: c.x }); return; }
    c.standing = false;
    s.washedThisRound += 1;
    emit(s, 'castle', { i: t.i, x: c.x, standing: castlesStanding(s) });
    if (!s.calm && castlesStanding(s) === 0 && s.spares === 0) { s.lost = true; emit(s, 'lost'); }
  } else {
    const b = s.brigades[t.i];
    if (b.washed) { emit(s, 'splash', { x: b.x }); return; }
    b.washed = true; b.sand = 0;
    emit(s, 'brigade', { i: t.i, x: b.x });
  }
}

/**
 * Advance `dt` seconds. `tune` comes from the mood: `speed` multiplies the
 * wave lines, `burst` the burst radius, and `rush` adds splits and rogues.
 */
export function step(s, dt, tune = {}) {
  if (s.lost) return s;
  const speedMul = tune.speed ?? 1, burstMul = tune.burst ?? 1, rush = Boolean(tune.rush);
  const g = groundY(s);

  if (s.queue > 0) {
    // An empty sea brings the next volley forward, so a cleared screen never waits long.
    if (!s.lines.length) s.spawnClock = Math.min(s.spawnClock, 0.6);
    s.spawnClock -= dt;
    if (s.spawnClock <= 0) { spawnVolley(s, { rush }); s.spawnClock = s.plan.interval * (0.8 + 0.4 * s.rng()); }
  }

  // Wave lines.
  const children = [];
  for (const line of s.lines) {
    const tx = targetX(s, line.target);
    const dx = tx - line.x, dy = g - line.y;
    const dist = Math.hypot(dx, dy);
    const move = line.speed * speedMul * dt;
    if (dist <= move || dist < 0.5) { line.x = tx; line.y = g; line.landed = true; continue; }
    line.x += (dx / dist) * move; line.y += (dy / dist) * move;
    if (line.splitAt != null && line.y >= line.splitAt) {
      line.splitAt = null;
      const n = rush ? RUSH.children : 1;
      for (let i = 0; i < n; i += 1) children.push(makeLine(s, line.x, line.y, line.speed, { child: true }));
      emit(s, 'split', { x: line.x, y: line.y, n });
    }
  }
  for (const line of s.lines) if (line.landed) wash(s, line);
  s.lines = s.lines.filter((l) => !l.landed);
  if (s.lost) return s;

  // Sand in flight.
  for (const shot of s.shots) {
    const dx = shot.tx - shot.x, dy = shot.ty - shot.y;
    const dist = Math.hypot(dx, dy);
    const move = shot.speed * dt;
    if (dist <= move) {
      shot.done = true;
      s.bursts.push({ x: shot.tx, y: shot.ty, t: 0, max: BURST.radius * burstMul, stops: 0, from: shot.from, hue: shot.hue });
      emit(s, 'burst', { x: shot.tx, y: shot.ty, from: shot.from });
    } else { shot.x += (dx / dist) * move; shot.y += (dy / dist) * move; }
  }
  s.shots = s.shots.filter((x) => !x.done);

  // Bursts open and close; any wave line whose head is inside one stops.
  const total = BURST.grow + BURST.hold + BURST.shrink;
  for (const b of s.bursts) { b.t += dt; b.r = burstRadius(b); }
  for (const line of s.lines) {
    for (const b of s.bursts) {
      if (b.r > 1 && Math.hypot(line.x - b.x, line.y - b.y) <= b.r) {
        line.stopped = true;
        const points = (line.rogue ? POINTS.rogue : POINTS.line) * s.plan.multiplier;
        addScore(s, points);
        b.stops += 1; s.stopped += 1;
        emit(s, 'stop', { x: line.x, y: line.y, chain: b.stops, points, rogue: line.rogue });
        if (b.stops === 3) { s.chains += 1; emit(s, 'chain', { x: b.x, y: b.y }); }
        break;
      }
    }
  }
  s.lines = s.lines.filter((l) => !l.stopped);
  s.bursts = s.bursts.filter((b) => b.t < total);
  return s;
}

/** The round is spent when the sea has nothing left to send and no line is still running. */
export const roundDone = (s) => !s.lost && s.queue === 0 && s.lines.length === 0;

/** The brigade nearest to `x` that still has sand, or null. */
export function nearestBrigade(s, x) {
  let best = null;
  s.brigades.forEach((b, i) => {
    if (b.washed || b.sand <= 0) return;
    if (best == null || Math.abs(b.x - x) < Math.abs(s.brigades[best].x - x)) best = i;
  });
  return best;
}

/** Highest point a burst may open, and lowest: never inside the sea bar, never on the beach. */
export function clampTarget(s, x, y) {
  return { x: clamp(x, 4, W - 4), y: clamp(y, HUD + 4, groundY(s) - 14) };
}

/**
 * Throw sand at (x, y) from brigade `index`, or from the nearest one with
 * sand when `index` is null. Returns the shot, or null (and a `dry` event)
 * when that brigade has nothing to throw.
 */
export function throwSand(s, index, x, y, hue = 0) {
  if (s.lost) return null;
  const i = index == null ? nearestBrigade(s, x) : index;
  const b = i == null ? null : s.brigades[i];
  if (!b || b.washed || b.sand <= 0 || s.shots.length >= MAX_SHOTS) { emit(s, 'dry', { i }); return null; }
  const t = clampTarget(s, x, y);
  b.sand -= 1;
  const shot = { x: b.x, y: groundY(s) - 6, sx: b.x, sy: groundY(s) - 6, tx: t.x, ty: t.y, speed: SHOT_SPEED[i], from: i, hue };
  s.shots.push(shot);
  emit(s, 'throw', { i, x: t.x, y: t.y, left: b.sand });
  return shot;
}

/**
 * Close the round: a bonus for every castle standing and every handful of
 * sand left, then rebuilt castles. On CALM every castle comes back; otherwise
 * spares fill the gaps. `over` is true when no castle stands afterwards.
 */
export function endRound(s) {
  const mult = s.plan.multiplier;
  const standing = castlesStanding(s);
  const sand = sandLeft(s);
  const castleBonus = standing * POINTS.castle * mult;
  const sandBonus = sand * POINTS.sand * mult;
  addScore(s, castleBonus + sandBonus);
  const allStanding = standing === s.castles.length;
  let rebuilt = 0;
  for (const c of s.castles) {
    if (c.standing) continue;
    if (s.calm) { c.standing = true; rebuilt += 1; }
    else if (s.spares > 0) { c.standing = true; s.spares -= 1; rebuilt += 1; }
  }
  const over = !s.calm && castlesStanding(s) === 0;
  return { round: s.round, standing, sand, mult, castleBonus, sandBonus, bonus: castleBonus + sandBonus, allStanding, rebuilt, over };
}

/** Turning the dial: leaving CALM with every castle gone rebuilds one, so the dial never ends a game by itself. */
export function setCalm(s, calm) {
  s.calm = Boolean(calm);
  if (!s.calm && !s.lost && castlesStanding(s) === 0) {
    const c = s.castles[2];
    c.standing = true;
    emit(s, 'rebuild', { x: c.x });
  }
  return s;
}

/** A resize or rotation: move the beach at once and clamp everything in flight onto the new field. */
export function setHeight(s, h) {
  s.h = clamp(Math.floor(h), H_MIN, H_MAX);
  const g = groundY(s);
  for (const l of s.lines) {
    l.y = Math.min(l.y, g - 1);
    l.sy = Math.min(l.sy, l.y);
    if (l.splitAt != null) l.splitAt = Math.min(l.splitAt, g - 2);
  }
  for (const shot of s.shots) {
    shot.sy = Math.min(shot.sy, g - 6);
    shot.y = Math.min(shot.y, g - 6);
    shot.ty = Math.min(shot.ty, g - 14);
  }
  for (const b of s.bursts) b.y = Math.min(b.y, g - 4);
  return s;
}

/**
 * Where a careful player would throw next: the lowest unclaimed wave line,
 * led by where it will be when the burst opens. Used by the title screen's
 * attract mode and by the simulated play test. Marks the line as claimed.
 */
export function autoAim(s, speedMul = 1) {
  const g = groundY(s);
  const open = s.lines.filter((l) => !l.claimed).sort((a, b) => b.y - a.y);
  for (const line of open) {
    const tx = targetX(s, line.target);
    const d = Math.hypot(tx - line.x, g - line.y) || 1;
    const vx = ((tx - line.x) / d) * line.speed * speedMul, vy = ((g - line.y) / d) * line.speed * speedMul;
    const i = nearestBrigade(s, line.x);
    if (i == null) return null;
    const b = s.brigades[i];
    let t = 0, px = line.x, py = line.y;
    for (let k = 0; k < 4; k += 1) {
      px = line.x + vx * t; py = line.y + vy * t;
      t = Math.hypot(px - b.x, py - (g - 6)) / SHOT_SPEED[i] + BURST.grow * 0.5;
    }
    if (py > g - 14) continue;
    line.claimed = true;
    return { brigade: i, x: px, y: py, line: line.id };
  }
  return null;
}
