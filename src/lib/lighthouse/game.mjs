/**
 * Lighthouse rules: the growing sequence, the speed steps and how the mood
 * bends the timing.
 *
 * Simon's own rules, from the 1978 Milton Bradley manual: the machine plays
 * a signal, the player repeats it, the machine adds one, and after the 5th,
 * 9th and 13th signal of a sequence it plays faster. A wrong press or a slow
 * one ends the game with a low buzz. Lighthouse keeps that and adds the
 * mood from src/lib/breakwater/mood.mjs:
 *
 *   each correct press         'paddle'
 *   each completed sequence    'brick'
 *   a miss (wrong or too slow) 'loss'
 *   every eighth step reached  'wave'
 *
 * DRIFT slows the playback and lengthens the response window; RUSH speeds
 * the playback and dims the lamps between flashes; on the CALM dial a miss
 * replays the same sequence instead of ending the game. `best` is the
 * longest sequence repeated.
 *
 * Pure functions, no DOM, so tests/lighthouse.test.mjs can drive them.
 */
import { LAMPS } from './lens.mjs';

/** The sequence lengths after which playback steps up, as on Simon. */
export const SPEED_STEPS = Object.freeze([5, 9, 13]);
/** Seconds each lamp stays lit during playback, per speed tier. */
export const FLASH_ON = Object.freeze([0.46, 0.34, 0.26, 0.2]);
/** Seconds to answer before the light counts a miss, before the mood bends it. Simon allowed about three. */
export const BASE_WINDOW = 3;
export const EIGHTH = 8;

/** How many speed steps a sequence of `length` has passed: 0 for 1 to 5, 1 for 6 to 9, 2 for 10 to 13, 3 after. */
export function speedTier(length) {
  return SPEED_STEPS.filter((s) => length > s).length;
}

/** Seconds per flash (`on`), dark between flashes (`gap`) and before the first (`lead`), stretched by `mult`. */
export function playbackTiming(length, mult = 1) {
  const m = Number.isFinite(mult) && mult > 0 ? mult : 1;
  const on = Math.max(0.12, FLASH_ON[speedTier(length)] * m);
  return { on, gap: Math.max(0.06, on * 0.45), lead: 0.7 * m };
}

/** When each flash of a sequence starts and ends, in seconds from the start of playback. */
export function playbackPlan(sequence, mult = 1) {
  const t = playbackTiming(sequence.length, mult);
  let at = t.lead;
  return sequence.map((lamp) => {
    const step = { lamp, start: at, end: at + t.on };
    at += t.on + t.gap;
    return step;
  });
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * What the mood does to the light. `response` is moodResponse(mood).
 * - `mult` stretches playback (above 1 is slower); DRIFT is never quick, RUSH never slow.
 * - `window` is the seconds to answer: DRIFT and DAWN are generous, RUSH is tight, CALM adds a little.
 * - `idle` is how bright an unlit lamp glows; RUSH dims it so the flashes stand alone.
 * - `sparks` is how many sparks a correct press throws; `glow` lights the beam.
 */
export function tuning(response, dial = 'play') {
  const label = response?.label || 'DAWN';
  const speed = Number.isFinite(response?.speed) ? response.speed : 1;
  let mult = 1 / speed;
  if (label === 'DRIFT') mult = Math.max(mult, 1.3);
  if (label === 'RUSH') mult = Math.min(mult, 0.86);
  const byLabel = { DRIFT: 1.6, DAWN: 1.15, FLOW: 1, RUSH: 0.9 }[label] ?? 1;
  const window = clamp(BASE_WINDOW * byLabel * (dial === 'calm' ? 1.2 : 1), 2.2, 6);
  const idle = label === 'RUSH' ? 0.24 : label === 'DRIFT' ? 0.6 : 0.5;
  const density = Number.isFinite(response?.density) ? response.density : 0.5;
  return { label, mult, window, idle, sparks: Math.round(2 + 10 * density), glow: clamp(response?.glow ?? 0.5, 0, 1) };
}

/** A small seeded generator (mulberry32) so tests can replay a game exactly. */
export function createRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGame(rng = Math.random) {
  return { rng, sequence: [], pos: 0, longest: 0, misses: 0, over: false };
}

/** The light adds one lamp and the player starts again from the first. Returns the new lamp. */
export function extend(g) {
  const lamp = Math.min(LAMPS.length - 1, Math.floor(g.rng() * LAMPS.length));
  g.sequence.push(lamp);
  g.pos = 0;
  return lamp;
}

/** The lamp the player owes next, or -1. */
export function due(g) {
  return g.over || g.pos >= g.sequence.length ? -1 : g.sequence[g.pos];
}

/**
 * A miss: a wrong lamp or too slow. On CALM (`calm` true) the same sequence
 * replays from the start; otherwise the game is over. The caller decides
 * `calm` at the moment of the miss, so a dial turned during the loss pause
 * cannot undo a game that already ended.
 */
export function miss(g, calm = false) {
  const expected = due(g);
  g.misses += 1;
  g.pos = 0;
  if (!calm) g.over = true;
  return { result: calm ? 'replay' : 'over', expected, events: ['loss'] };
}

/** The player presses `lamp`. Returns the result and the mood events it earns. */
export function press(g, lamp, calm = false) {
  if (g.over || !g.sequence.length) return { result: 'ignored', expected: -1, events: [] };
  const expected = due(g);
  if (lamp !== expected) return miss(g, calm);
  g.pos += 1;
  const events = ['paddle'];
  if (g.pos < g.sequence.length) return { result: 'correct', expected, events };
  const length = g.sequence.length;
  g.longest = Math.max(g.longest, length);
  events.push('brick');
  if (length % EIGHTH === 0) events.push('wave');
  return { result: 'complete', expected, events, length };
}
