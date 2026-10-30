/**
 * Sea Glass: the pyramid, its rules and a small hop engine.
 *
 * Geometry follows the 1982 Gottlieb arcade Q*bert: 28 cubes in seven rows,
 * drawn isometric, with diagonal hops only. Row r holds cubes c = 0..r. From
 * (r, c) the four hops land on
 *
 *   up-left (r-1, c-1)   up-right (r-1, c)
 *   down-left (r+1, c)   down-right (r+1, c+1)
 *
 * Any landing outside the pyramid is a fall, unless a lifebuoy floats at that
 * exact spot; a buoy carries the crab back to the top. Cubes start as sand and
 * turn to sea glass. Rules: ONE HOP (one landing finishes a cube), TWO HOPS
 * (sand, frost, glass) and TOGGLE (a landing on finished glass turns it back).
 *
 * Hazards: bubbles drop in at the second row and bounce down at random until
 * they roll off the bottom; one gull follows the crab, and will follow it off
 * the edge toward a buoy the crab just took.
 *
 * Pure functions and plain objects, no DOM, so tests/sea-glass.test.mjs can
 * play whole games. Time is in seconds; positions are in cube units where one
 * row down is y + 1 and one cube across is x + 1, with the apex at x = 0.
 */
export const ROWS = 7;
export const CUBES = (ROWS * (ROWS + 1)) / 2;

export const DIRS = Object.freeze({
  ul: Object.freeze({ id: 'ul', dr: -1, dc: -1, label: 'UP-LEFT' }),
  ur: Object.freeze({ id: 'ur', dr: -1, dc: 0, label: 'UP-RIGHT' }),
  dl: Object.freeze({ id: 'dl', dr: 1, dc: 0, label: 'DOWN-LEFT' }),
  dr: Object.freeze({ id: 'dr', dr: 1, dc: 1, label: 'DOWN-RIGHT' }),
});
export const DIR_IDS = Object.freeze(Object.keys(DIRS));

/**
 * Keys: Q E A D sit where the four diagonals sit on a keyboard. The arrows are
 * turned 45 degrees the way the 1983 home ports turned a joystick:
 * up = up-right, left = up-left, down = down-left, right = down-right.
 */
export const KEYMAP = Object.freeze({
  KeyQ: 'ul', KeyE: 'ur', KeyA: 'dl', KeyD: 'dr',
  ArrowLeft: 'ul', ArrowUp: 'ur', ArrowDown: 'dl', ArrowRight: 'dr',
});

export const RULES = Object.freeze({
  one: Object.freeze({ id: 'one', label: 'ONE HOP', target: 1, revert: false }),
  two: Object.freeze({ id: 'two', label: 'TWO HOPS', target: 2, revert: false }),
  toggle: Object.freeze({ id: 'toggle', label: 'TOGGLE', target: 1, revert: true }),
});

export const POINTS = Object.freeze({ frost: 15, glass: 25, lure: 500, buoyLeft: 50, clear: 1000, clearStep: 250 });
export const EXTRA_EVERY = 6000;

/** Seconds. The crab's hop never slows with the mood; the hazards do. */
export const TIMING = Object.freeze({ hop: 0.26, rest: 0.05, drop: 0.5, ride: 1.5, hazardHop: 0.32, bubbleWait: 0.5, gullWait: 0.72 });

export const onPyramid = (r, c) => r >= 0 && r < ROWS && c >= 0 && c <= r;
export const cubeIndex = (r, c) => (r * (r + 1)) / 2 + c;
export function cellOf(i) {
  let r = 0;
  while (cubeIndex(r + 1, 0) <= i) r += 1;
  return [r, i - cubeIndex(r, 0)];
}
export function neighbor(r, c, dir) {
  const d = DIRS[dir];
  return [r + d.dr, c + d.dc];
}
export const screenOf = (r, c) => ({ x: c - r / 2, y: r });

/** A tap or click picks the quadrant of the field around (cx, cy). */
export function quadrantDir(x, y, cx, cy) {
  if (y < cy) return x < cx ? 'ul' : 'ur';
  return x < cx ? 'dl' : 'dr';
}

/** Which rule pyramid n (0-based) plays. RUSH brings two landings and toggling sooner. */
export function ruleFor(n, dial = 'play') {
  const two = dial === 'rush' ? 2 : 4;
  const toggle = dial === 'rush' ? 5 : 8;
  if (n < two) return 'one';
  if (n < toggle) return 'two';
  return (n - toggle) % 2 === 0 ? 'toggle' : 'two';
}

/** Lifebuoy rows (1..4) for pyramid n: the left one and the right one move between pyramids. */
export function buoyRows(n) {
  return { L: 1 + (n % 4), R: 1 + ((n + 2) % 4) };
}

export function createPyramid(n = 0, dial = 'play') {
  const rule = ruleFor(n, dial);
  const { L, R } = buoyRows(n);
  return {
    index: n,
    rule,
    target: RULES[rule].target,
    cubes: new Array(CUBES).fill(0),
    rowsDone: new Array(ROWS).fill(false),
    buoys: [
      { side: 'L', r: L, c: -1, used: false },
      { side: 'R', r: R, c: R + 1, used: false },
    ],
  };
}

/** What one landing does to a cube in `state` under `ruleId`. */
export function land(state, ruleId) {
  const rule = RULES[ruleId] || RULES.one;
  if (state < rule.target) {
    const next = state + 1;
    return { state: next, delta: 1, points: next === rule.target ? POINTS.glass : POINTS.frost, done: next === rule.target };
  }
  if (rule.revert) return { state: 0, delta: -1, points: 0, done: false };
  return { state, delta: 0, points: 0, done: true };
}

export const cubeAt = (p, r, c) => p.cubes[cubeIndex(r, c)];
export const remaining = (p) => p.cubes.filter((s) => s < p.target).length;
export const isCleared = (p) => remaining(p) === 0;
export function rowComplete(p, r) {
  for (let c = 0; c <= r; c += 1) if (cubeAt(p, r, c) < p.target) return false;
  return true;
}
export const buoyAt = (p, r, c) => p.buoys.find((b) => !b.used && b.r === r && b.c === c) || null;
export const clearBonus = (p) => POINTS.clear + POINTS.clearStep * Math.min(p.index, 8) + POINTS.buoyLeft * p.buoys.filter((b) => !b.used).length;

// ---------- the hop engine ----------

function newCrab(r = 0, c = 0) {
  const s = screenOf(r, c);
  return { r, c, pr: r, pc: c, ax: s.x, ay: s.y, t: 0, dur: 0, state: 'idle', rest: 0.3, face: 1, dir: 'dr', ride: null };
}

export function createGame({ dial = 'play', level = 0 } = {}) {
  const g = { dial, level, pyr: createPyramid(level, dial), crab: newCrab(), hazards: [], score: 0, nextExtra: EXTRA_EVERY, queued: null, bubbleTimer: 0, gullTimer: 0, clock: 0, cleared: false, ids: 0 };
  resetTimers(g, 1);
  return g;
}

function resetTimers(g, generosity) {
  g.bubbleTimer = 2.2 * generosity;
  g.gullTimer = 7 * generosity;
}

/** Continuous position of any hopping thing, with p in 0..1 and a hop arc `lift` in 0..1. */
export function posOf(e) {
  const p = e.dur > 0 ? Math.min(1, e.t / e.dur) : 1;
  const b = screenOf(e.r, e.c);
  return { x: e.ax + (b.x - e.ax) * p, y: e.ay + (b.y - e.ay) * p, p, lift: e.state === 'hop' ? Math.sin(Math.PI * p) : 0 };
}

/** The cube an entity counts as standing on: its old cube for the first half of a hop. */
export function cellNow(e) {
  if (e.state === 'hop' && e.dur > 0 && e.t < e.dur / 2) return [e.pr, e.pc];
  return [e.r, e.c];
}

/** Pin an entity to its destination so its timer can count something else (a fall, a fly-off). */
function pin(e) {
  const s = screenOf(e.r, e.c);
  e.ax = s.x; e.ay = s.y; e.t = 0; e.dur = 0;
}

function startHop(e, dir, dur) {
  const [r, c] = neighbor(e.r, e.c, dir);
  const s = screenOf(e.r, e.c);
  e.pr = e.r; e.pc = e.c; e.ax = s.x; e.ay = s.y;
  e.r = r; e.c = c; e.t = 0; e.dur = dur; e.state = 'hop'; e.dir = dir;
  e.face = dir === 'ul' || dir === 'dl' ? -1 : 1;
}

/** Ask the crab to hop. Hops start at once when the crab stands still; one more is buffered mid-hop. */
export function queueHop(g, dir) {
  if (!DIRS[dir] || g.cleared) return false;
  const k = g.crab;
  if (k.state === 'idle' && k.rest <= 0) { startHop(k, dir, TIMING.hop); return true; }
  if (k.state === 'idle' || k.state === 'hop' || k.state === 'drop') { g.queued = dir; return true; }
  return false;
}

function landCrab(g, ev) {
  const k = g.crab, p = g.pyr;
  if (!onPyramid(k.r, k.c)) {
    const buoy = buoyAt(p, k.r, k.c);
    if (buoy) {
      buoy.used = true;
      k.state = 'ride'; k.ride = { side: buoy.side, r: buoy.r, c: buoy.c, t: 0, dur: TIMING.ride };
      ev.push({ type: 'buoy', side: buoy.side });
      return;
    }
    pin(k);
    k.state = 'fall';
    g.queued = null;
    ev.push({ type: 'fall', r: k.r, c: k.c });
    return;
  }
  k.state = 'idle'; k.rest = TIMING.rest; k.t = 0; k.dur = 0;
  const i = cubeIndex(k.r, k.c);
  const res = land(p.cubes[i], p.rule);
  p.cubes[i] = res.state;
  g.score += res.points;
  ev.push({ type: 'land', r: k.r, c: k.c });
  if (res.delta !== 0) ev.push({ type: 'color', r: k.r, c: k.c, state: res.state, delta: res.delta, done: res.done, points: res.points });
  if (res.delta > 0 && !p.rowsDone[k.r] && rowComplete(p, k.r)) { p.rowsDone[k.r] = true; ev.push({ type: 'row', r: k.r }); }
  if (isCleared(p)) {
    const bonus = clearBonus(p);
    g.score += bonus;
    g.cleared = true;
    g.queued = null;
    ev.push({ type: 'clear', index: p.index, bonus });
  }
}

function stepCrab(g, dt, ev) {
  const k = g.crab;
  if (k.state === 'idle') {
    k.rest -= dt;
    if (k.rest <= 0 && g.queued) { const d = g.queued; g.queued = null; startHop(k, d, TIMING.hop); }
    return;
  }
  if (k.state === 'hop' || k.state === 'drop') {
    k.t += dt;
    if (k.t >= k.dur) {
      k.t = k.dur;
      if (k.state === 'drop') { k.state = 'idle'; k.rest = TIMING.rest; landCrab(g, ev); }
      else landCrab(g, ev);
    }
    return;
  }
  if (k.state === 'ride') {
    k.ride.t += dt;
    if (k.ride.t >= k.ride.dur) {
      // Set down on the apex from just above it; that landing counts.
      k.ride = null;
      k.r = 0; k.c = 0; k.pr = 0; k.pc = 0; k.ax = 0; k.ay = -1.4; k.t = 0; k.dur = TIMING.drop; k.state = 'drop';
      ev.push({ type: 'set-down' });
    }
  }
}

function crabTarget(g) {
  const k = g.crab;
  if (k.state === 'ride' && k.ride) return [k.ride.r, k.ride.c];
  return [k.r, k.c];
}

/** The gull's next hop toward (tr, tc): the closest cube, and off the edge only onto the target itself. */
export function gullDir(r, c, tr, tc) {
  const t = screenOf(tr, tc);
  let best = null, bestD = Infinity;
  for (const id of DIR_IDS) {
    const [nr, nc] = neighbor(r, c, id);
    if (!onPyramid(nr, nc) && !(nr === tr && nc === tc)) continue;
    const s = screenOf(nr, nc);
    const d = (s.x - t.x) ** 2 + (s.y - t.y) ** 2;
    if (d < bestD - 1e-9) { best = id; bestD = d; }
  }
  return best;
}

function spawnHazard(g, kind, rng) {
  const k = g.crab;
  const [cr, cc] = cellNow(k);
  // Drop in at the second row, never straight onto the crab.
  let c = rng() < 0.5 ? 0 : 1;
  if (cr === 1 && cc === c) c = 1 - c;
  const s = screenOf(1, c);
  const h = { id: (g.ids += 1), kind, r: 1, c, pr: 1, pc: c, ax: s.x, ay: -1.2, t: 0, dur: TIMING.drop, state: 'drop', wait: 0, face: 1, dir: 'dl' };
  g.hazards.push(h);
  return h;
}

function stepHazard(g, h, dt, speed, rng, ev) {
  if (h.state === 'fall' || h.state === 'away') { h.clock = (h.clock || 0) + dt; if (h.clock > 1.2) h.state = 'gone'; return; }
  if (h.state === 'drop' || h.state === 'hop') {
    h.t += dt * speed;
    if (h.t < h.dur) return;
    h.t = h.dur;
    if (!onPyramid(h.r, h.c)) {
      pin(h);
      h.state = 'fall'; h.clock = 0;
      if (h.kind === 'gull') ev.push({ type: 'lure', points: POINTS.lure });
      else ev.push({ type: 'roll-off' });
      if (h.kind === 'gull') g.score += POINTS.lure;
      return;
    }
    if (h.kind === 'bubble') ev.push({ type: 'bounce', r: h.r, c: h.c });
    h.state = 'wait';
    h.wait = h.kind === 'gull' ? TIMING.gullWait : TIMING.bubbleWait;
    return;
  }
  if (h.state === 'wait') {
    h.wait -= dt * speed;
    if (h.wait > 0) return;
    let dir;
    if (h.kind === 'gull') {
      const [tr, tc] = crabTarget(g);
      dir = gullDir(h.r, h.c, tr, tc);
      if (!dir) { h.wait = 0.2; return; }
    } else dir = rng() < 0.5 ? 'dl' : 'dr';
    startHop(h, dir, TIMING.hazardHop);
  }
}

const crabVulnerable = (k) => k.state === 'idle' || k.state === 'hop';
function hazardSolid(h) {
  if (h.state === 'wait' || h.state === 'hop') return true;
  return h.state === 'drop' && h.t >= h.dur * 0.75;
}

/** Did hazard `h` touch the crab? Same cube, or two hops passing each other. */
export function touches(k, h) {
  if (!crabVulnerable(k) || !hazardSolid(h)) return false;
  if (!onPyramid(h.r, h.c) && h.state !== 'hop') return false;
  const [a, b] = cellNow(k), [x, y] = cellNow(h);
  if (a === x && b === y) return true;
  return k.state === 'hop' && h.state === 'hop' && k.pr === h.r && k.pc === h.c && k.r === h.pr && k.c === h.pc;
}

/**
 * Advance the game by dt. `tune` comes from the mood:
 *   speed       multiplies hazard time (the crab keeps its own pace)
 *   generosity  stretches spawn gaps (above 1 is kinder)
 *   gull        false sends the gull away and keeps it away
 *   bubbleCap   how many bubbles may be on the pyramid at once
 * Returns this step's events. After 'clear', 'fall' or 'hit' the caller pauses
 * the engine and calls nextPyramid() or respawn().
 */
export function stepGame(g, dt, tune = {}, rng = Math.random) {
  const ev = [];
  if (g.cleared || g.crab.state === 'fall') return ev;
  const speed = tune.speed ?? 1, gen = tune.generosity ?? 1, gullOn = tune.gull !== false, cap = tune.bubbleCap ?? 1;
  g.clock += dt;
  stepCrab(g, dt, ev);
  if (g.cleared || g.crab.state === 'fall') return finish(g, ev);

  if (!gullOn) {
    for (const h of g.hazards) if (h.kind === 'gull' && h.state !== 'fall' && h.state !== 'away' && h.state !== 'gone') { pin(h); h.state = 'away'; h.clock = 0; ev.push({ type: 'gull-away' }); }
  }
  // Nothing new drops in while the crab rides a buoy home.
  if (g.crab.state !== 'ride' && g.crab.state !== 'drop') {
    g.bubbleTimer -= dt;
    if (g.bubbleTimer <= 0) {
      const live = g.hazards.filter((h) => h.kind === 'bubble' && h.state !== 'fall' && h.state !== 'gone').length;
      if (live < cap) { spawnHazard(g, 'bubble', rng); ev.push({ type: 'spawn', kind: 'bubble' }); g.bubbleTimer = (2.4 + rng() * 2.4) * gen / Math.max(0.5, speed); }
      else g.bubbleTimer = 0.6;
    }
    const gull = g.hazards.some((h) => h.kind === 'gull' && h.state !== 'gone');
    if (gullOn && !gull) {
      g.gullTimer -= dt;
      if (g.gullTimer <= 0) { spawnHazard(g, 'gull', rng); ev.push({ type: 'spawn', kind: 'gull' }); g.gullTimer = (5 + rng() * 3) * gen; }
    }
  }
  for (const h of g.hazards) stepHazard(g, h, dt, speed, rng, ev);
  g.hazards = g.hazards.filter((h) => h.state !== 'gone');
  for (const h of g.hazards) {
    if (touches(g.crab, h)) { ev.push({ type: 'hit', kind: h.kind, r: g.crab.r, c: g.crab.c }); break; }
  }
  return finish(g, ev);
}

function finish(g, ev) {
  while (g.score >= g.nextExtra) { g.nextExtra += EXTRA_EVERY; ev.push({ type: 'extra' }); }
  return ev;
}

/** After a loss: clear the hazards, stand the crab on the top (after a fall) or where it was hit. */
export function respawn(g, { top = false, generosity = 1 } = {}) {
  const k = g.crab;
  let [r, c] = cellNow(k);
  if (top || !onPyramid(r, c)) { r = 0; c = 0; }
  g.crab = newCrab(r, c);
  g.crab.rest = 0.35;
  g.hazards = [];
  g.queued = null;
  resetTimers(g, generosity);
  return g;
}

/** The next pyramid, after a clear. */
export function nextPyramid(g, generosity = 1) {
  g.level += 1;
  g.pyr = createPyramid(g.level, g.dial);
  g.crab = newCrab();
  g.hazards = [];
  g.queued = null;
  g.cleared = false;
  resetTimers(g, generosity);
  return g;
}

/** A dial change mid-game only affects pyramids not yet built. */
export function setGameDial(g, dial) { g.dial = dial; return g; }

/**
 * A small autopilot for the attract screen and the tests: hop toward the
 * nearest unfinished cube, never onto a hazard or its next cube, never off the
 * edge except onto a free buoy when the gull is close.
 */
export function autoDir(g) {
  const k = g.crab, p = g.pyr;
  const [r, c] = [k.r, k.c];
  if (!onPyramid(r, c)) return null;
  const danger = new Set();
  let gullNear = false;
  for (const h of g.hazards) {
    if (h.state === 'fall' || h.state === 'away' || h.state === 'gone') continue;
    const cells = [[h.r, h.c], [h.pr, h.pc]];
    if (h.kind === 'bubble') cells.push(neighbor(h.r, h.c, 'dl'), neighbor(h.r, h.c, 'dr'));
    else for (const id of DIR_IDS) cells.push(neighbor(h.r, h.c, id));
    for (const [a, b] of cells) danger.add(`${a},${b}`);
    if (h.kind === 'gull' && Math.abs(h.r - r) + Math.abs(h.c - c) <= 2) gullNear = true;
  }
  if (gullNear) for (const id of ['ul', 'ur']) { const [a, b] = neighbor(r, c, id); if (buoyAt(p, a, b)) return id; }
  // Distance from each cube to the nearest unfinished one, walking only safe cubes.
  const dist = new Map();
  const queue = [];
  for (let i = 0; i < CUBES; i += 1) {
    const [a, b] = cellOf(i);
    if (p.cubes[i] < p.target && !danger.has(`${a},${b}`)) { dist.set(`${a},${b}`, 0); queue.push([a, b]); }
  }
  while (queue.length) {
    const [a, b] = queue.shift();
    const d = dist.get(`${a},${b}`);
    for (const id of DIR_IDS) {
      const [x, y] = neighbor(a, b, id);
      const key = `${x},${y}`;
      if (!onPyramid(x, y) || dist.has(key) || danger.has(key)) continue;
      dist.set(key, d + 1);
      queue.push([x, y]);
    }
  }
  let best = null, bestScore = Infinity;
  for (const id of DIR_IDS) {
    const [x, y] = neighbor(r, c, id);
    if (!onPyramid(x, y)) continue;
    const key = `${x},${y}`;
    let s = dist.has(key) ? dist.get(key) : 50;
    if (danger.has(key)) s += 1000;
    const st = cubeAt(p, x, y);
    if (RULES[p.rule].revert && st >= p.target) s += 3;
    if (s < bestScore) { bestScore = s; best = id; }
  }
  return best;
}
