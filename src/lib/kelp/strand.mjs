/**
 * Kelp strand: movement, growth, collision and stages, as one pure reducer.
 *
 * The strand is a list of cells, head first. Each tick the head moves one
 * cell in its direction, the tail follows unless the strand is growing, and
 * the new head cell decides the event: open water, plankton, golden plankton,
 * or a collision with the wall, a rock or the strand itself. A stage is
 * cleared when the strand reaches the stage's target length; the next stage
 * stands a new rock pattern and the strand starts over at its start length,
 * the way Nibbler restarted each maze.
 *
 * The mood response is read by the page and handed in here as plain numbers
 * (density, startLength, label), so this module never imports the mood.
 */
import { COLS, ROWS, START, START_LENGTH, MIN_START_LENGTH, DIRS, DIR_IDS, OPPOSITE, cellKey, inBounds, rocksFor } from './grid.mjs';

export const BASE_VALUE = 10;
export const GOLDEN_MULT = 3;
export const GOLDEN_TTL = 48;
export const GOLDEN_CHANCE = 1 / 40;
export const BOOST_TICKS = 24;
export const EXTRA_LIFE_EVERY = 3;
export const MAX_QUEUE = 2;
/** The base tick interval in seconds at stage 0, before the mood multiplies it. */
export const BASE_TICK = 0.17;
export const MIN_TICK = 0.07;

const PENTA = [0, 2, 4, 7, 9];

/** Length that clears stage `n`. */
export function targetLength(n) {
  return Math.min(40, 12 + 4 * n);
}

/** Points for one plankton at stage `n` under mood `label`. */
export function planktonValue(n, label = 'DAWN') {
  const mult = label === 'FLOW' ? 1.5 : label === 'RUSH' ? 2 : 1;
  return Math.round(BASE_VALUE * (n + 1) * mult);
}

/** The start length the mood asks for: DRIFT shortens the next strand, RUSH never lengthens it past the default. */
export function startLengthFor(response) {
  const paddle = response && typeof response.paddle === 'number' ? response.paddle : 1;
  return Math.max(MIN_START_LENGTH, Math.min(START_LENGTH, Math.round(START_LENGTH * (2 - paddle))));
}

/** Seconds between ticks for stage `n` at mood speed `speed`, faster while boosted. */
export function tickInterval(n, speed = 1, boosted = false) {
  const t = BASE_TICK / (1 + 0.06 * Math.min(n, 12)) / Math.max(0.5, speed) / (boosted ? 1.3 : 1);
  return Math.max(MIN_TICK, t);
}

/** Semitone offset above the root for a strand of `length`: climbs a pentatonic, an octave every five plankton. */
export function noteForLength(length, startLength = START_LENGTH) {
  const i = Math.max(0, length - startLength);
  return Math.min(31, 12 * Math.floor(i / PENTA.length) + PENTA[i % PENTA.length]);
}

function freshStrand(startLength) {
  const cells = [];
  for (let i = 0; i < startLength; i += 1) cells.push({ c: START.c, r: START.r + i });
  return cells;
}

function occupiedSet(g) {
  const set = new Set(g.rocks.set);
  for (const s of g.strand) set.add(cellKey(s.c, s.r));
  return set;
}

/** Pick an open cell with `rng`. Returns null only when the field is full. */
export function placePlankton(g, rng = Math.random) {
  const taken = occupiedSet(g);
  if (g.plankton) taken.add(cellKey(g.plankton.c, g.plankton.r));
  if (g.golden) taken.add(cellKey(g.golden.c, g.golden.r));
  const open = [];
  for (let r = 0; r < ROWS; r += 1) for (let c = 0; c < COLS; c += 1) if (!taken.has(cellKey(c, r))) open.push([c, r]);
  if (!open.length) return null;
  const [c, r] = open[Math.min(open.length - 1, Math.floor(rng() * open.length))];
  return { c, r };
}

export function createGame({ stage = 0, machineId = 'xl', density = 1, startLength = START_LENGTH, lives = 3, unlimited = false, rng = Math.random } = {}) {
  const g = {
    stage, machineId, rocks: rocksFor(stage, machineId, density), strand: freshStrand(startLength), dir: START.dir, queue: [],
    startLength, target: targetLength(stage), plankton: null, golden: null, score: 0, lives, unlimited, streak: 0,
    eaten: 0, totalEaten: 0, ticks: 0, grow: 0, boost: 0, phase: 'ready', lastEvent: null, best: 0,
  };
  g.plankton = placePlankton(g, rng);
  return g;
}

/** Queue a turn. Rejects reversals and repeats of the pending direction. */
export function setDirection(g, dir) {
  if (!DIRS[dir]) return false;
  const last = g.queue.length ? g.queue[g.queue.length - 1] : g.dir;
  if (dir === last || dir === OPPOSITE[last]) return false;
  if (g.queue.length >= MAX_QUEUE) g.queue[g.queue.length - 1] = dir; else g.queue.push(dir);
  return true;
}

export function head(g) { return g.strand[0]; }

/** Classify the cell one step from the head in `dir`: 'open', 'plankton', 'golden', 'wall', 'rock' or 'self'. */
export function probe(g, dir, growing = g.grow > 0) {
  const h = head(g);
  const c = h.c + DIRS[dir][0], r = h.r + DIRS[dir][1];
  if (!inBounds(c, r)) return 'wall';
  const k = cellKey(c, r);
  if (g.rocks.set.has(k)) return 'rock';
  // The tail cell frees up this tick unless the strand is growing into it.
  const last = growing ? g.strand.length : g.strand.length - 1;
  for (let i = 0; i < last; i += 1) if (g.strand[i].c === c && g.strand[i].r === r) return 'self';
  if (g.plankton && g.plankton.c === c && g.plankton.r === r) return 'plankton';
  if (g.golden && g.golden.c === c && g.golden.r === r) return 'golden';
  return 'open';
}

/**
 * Advance one tick. `ctx.label` is the mood label (plankton value, golden
 * spawns in RUSH), `ctx.rng` the random source. Returns the list of events.
 */
export function tick(g, ctx = {}) {
  const rng = ctx.rng || Math.random;
  const label = ctx.label || 'DAWN';
  const events = [];
  if (g.phase !== 'play') return events;
  if (g.queue.length) g.dir = g.queue.shift();
  const what = probe(g, g.dir);
  g.ticks += 1;
  if (what === 'wall' || what === 'rock' || what === 'self') {
    g.phase = 'lost';
    g.streak = 0;
    g.lastEvent = what;
    if (!g.unlimited) {
      g.lives -= 1;
      if (g.lives <= 0) { g.phase = 'over'; events.push({ type: 'collide', with: what }, { type: 'over' }); return events; }
    }
    events.push({ type: 'collide', with: what });
    return events;
  }
  const h = head(g);
  g.strand.unshift({ c: h.c + DIRS[g.dir][0], r: h.r + DIRS[g.dir][1] });
  if (g.grow > 0) g.grow -= 1; else g.strand.pop();
  if (g.boost > 0) g.boost -= 1;
  if (what === 'plankton' || what === 'golden') {
    const golden = what === 'golden';
    const value = planktonValue(g.stage, label) * (golden ? GOLDEN_MULT : 1);
    g.score += value;
    g.streak += 1; g.eaten += 1; g.totalEaten += 1;
    g.grow += golden ? 2 : 1;
    if (golden) { g.golden = null; g.boost = BOOST_TICKS; } else { g.plankton = placePlankton(g, rng); }
    events.push({ type: golden ? 'golden' : 'eat', value, length: g.strand.length + g.grow, note: noteForLength(g.strand.length + g.grow, g.startLength) });
    if (g.strand.length + g.grow >= g.target) {
      g.phase = 'clear';
      events.push({ type: 'clear', stage: g.stage });
      return events;
    }
  } else {
    events.push({ type: 'move' });
  }
  if (g.golden) { g.golden.ttl -= 1; if (g.golden.ttl <= 0) g.golden = null; }
  else if (label === 'RUSH' && rng() < GOLDEN_CHANCE) {
    const spot = placePlankton(g, rng);
    if (spot) { g.golden = { ...spot, ttl: GOLDEN_TTL }; events.push({ type: 'goldenSpawn' }); }
  }
  return events;
}

/** After a collision: a new strand at the start, same stage and rocks. */
export function respawn(g, { startLength = g.startLength, rng = Math.random } = {}) {
  g.startLength = startLength;
  g.strand = freshStrand(startLength);
  g.dir = START.dir; g.queue = []; g.grow = 0; g.boost = 0; g.golden = null;
  g.phase = 'ready';
  const taken = occupiedSet(g);
  if (!g.plankton || taken.has(cellKey(g.plankton.c, g.plankton.r))) { g.plankton = null; g.plankton = placePlankton(g, rng); }
  return g;
}

/** After a clear: the next stage's rocks, a fresh strand, an extra life every third stage. */
export function nextStage(g, { density = 1, startLength = g.startLength, rng = Math.random } = {}) {
  g.stage += 1;
  g.rocks = rocksFor(g.stage, g.machineId, density);
  g.target = targetLength(g.stage);
  g.eaten = 0;
  const extra = !g.unlimited && g.stage % EXTRA_LIFE_EVERY === 0;
  if (extra) g.lives += 1;
  g.plankton = null;
  respawn(g, { startLength, rng });
  return extra;
}

/** Swap the machine mid-game: same pattern index and density, so only a nameplate stage changes shape. */
export function setMachine(g, machineId, density = 1) {
  g.machineId = machineId;
  const next = rocksFor(g.stage, machineId, density);
  // Never drop a rock onto the strand or the plankton.
  for (const s of g.strand) next.set.delete(cellKey(s.c, s.r));
  if (g.plankton) next.set.delete(cellKey(g.plankton.c, g.plankton.r));
  if (g.golden) next.set.delete(cellKey(g.golden.c, g.golden.r));
  next.cells = next.cells.filter(([c, r]) => next.set.has(cellKey(c, r)));
  g.rocks = next;
  return g;
}

export function start(g) {
  if (g.phase === 'ready') g.phase = 'play';
  return g;
}

/**
 * A small autopilot for the attract mode and the simulated-run test: head
 * for the plankton, never into a wall, rock or the body, and prefer a cell
 * that still has a way out. Deterministic, so a seeded run is repeatable.
 */
export function autoDirection(g) {
  const h = head(g);
  const goal = g.golden || g.plankton;
  const options = DIR_IDS.filter((d) => d !== OPPOSITE[g.dir]);
  let best = null, bestScore = -Infinity;
  for (const d of options) {
    const what = probe(g, d);
    if (what === 'wall' || what === 'rock' || what === 'self') continue;
    const c = h.c + DIRS[d][0], r = h.r + DIRS[d][1];
    // Look one more step ahead: how many exits does the next cell keep?
    let exits = 0;
    for (const e of DIR_IDS) {
      if (e === OPPOSITE[d]) continue;
      const nc = c + DIRS[e][0], nr = r + DIRS[e][1];
      if (!inBounds(nc, nr) || g.rocks.set.has(cellKey(nc, nr))) continue;
      if (g.strand.slice(0, -2).some((s) => s.c === nc && s.r === nr)) continue;
      exits += 1;
    }
    if (exits === 0) continue;
    const dist = goal ? Math.abs(goal.c - c) + Math.abs(goal.r - r) : 0;
    const room = exits * 0.4;
    const score = -dist + room + (d === g.dir ? 0.2 : 0);
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best || g.dir;
}
