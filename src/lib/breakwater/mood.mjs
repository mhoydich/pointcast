/**
 * Breakwater mood model: the symbiosis between a player and the game.
 *
 * The game keeps two continuous values. `energy` rises with every brick and
 * paddle return and falls back toward the player's chosen dial. `calm` rises
 * slowly with time and drops hard when a ball is lost, so DRIFT lasts long
 * enough to be felt (one loss from rest: a few seconds; two quick losses:
 * ten seconds or more). Together with the current rally
 * streak they resolve into one of four labels:
 *
 *   DAWN   warming up, steady, cool colors, a slow major arpeggio
 *   FLOW   a long rally, bright palette, the music opens up
 *   RUSH   high energy, hot colors, faster tempo, a second ball may appear
 *   DRIFT  after losses, the game widens the paddle, slows down and softens
 *
 * `moodResponse` turns the state into what the game actually does: speed,
 * paddle width, tempo, scale, particle density. The player feels the game
 * respond; the game reads the player. Neither side owns the mood alone.
 *
 * Pure functions, no DOM, so tests/breakwater.test.mjs can drive them.
 */
export const LABELS = Object.freeze(['DAWN', 'FLOW', 'RUSH', 'DRIFT']);

export const DIALS = Object.freeze({
  calm: Object.freeze({ id: 'calm', label: 'CALM', baseline: 0.22, cap: 0.62, unlimitedBalls: true, blurb: 'No game over. The wall is a place to be.' }),
  play: Object.freeze({ id: 'play', label: 'PLAY', baseline: 0.45, cap: 1, unlimitedBalls: false, blurb: 'Three balls, extra balls every 400 points.' }),
  rush: Object.freeze({ id: 'rush', label: 'RUSH', baseline: 0.66, cap: 1, unlimitedBalls: false, blurb: 'Starts hot. Leans into the second ball.' }),
});

export const DIAL_IDS = Object.freeze(Object.keys(DIALS));

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const RANK = { DAWN: 0, DRIFT: 0, FLOW: 1, RUSH: 2 };

export function createMood(dial = 'play') {
  const d = DIALS[dial] ? dial : 'play';
  return {
    dial: d,
    energy: DIALS[d].baseline,
    calm: 0.72,
    streak: 0,
    hits: 0,
    losses: 0,
    sinceLoss: 30,
    label: 'DAWN',
    labelAge: 99,
    tape: [],
    tapeClock: 0,
    peak: 'DAWN',
  };
}

/** Enter and exit thresholds differ, and a label holds for DWELL seconds, so a steady rally does not flicker. */
const ENTER = { drift: 0.38, rush: 0.7, flow: 0.42 };
const EXIT = { drift: 0.46, rush: 0.62, flow: 0.36 };
const DWELL = 1.5;

export function computeLabel(m) {
  const current = m.label || 'DAWN';
  const inDrift = current === 'DRIFT' ? m.calm < EXIT.drift : m.calm < ENTER.drift;
  let next;
  if (inDrift) next = 'DRIFT';
  else if (current === 'RUSH' ? m.energy > EXIT.rush : m.energy > ENTER.rush) next = 'RUSH';
  else if (m.streak >= 5 && (current === 'FLOW' ? m.energy > EXIT.flow : m.energy > ENTER.flow)) next = 'FLOW';
  else next = 'DAWN';
  // A fresh label holds for a moment, except that a loss drops to DRIFT at once.
  if (next !== current && next !== 'DRIFT' && (m.labelAge ?? 99) < DWELL) return current;
  return next;
}

function settle(m, label) {
  if (label !== m.label) { m.label = label; m.labelAge = 0; }
  if (RANK[m.label] > RANK[m.peak]) m.peak = m.label;
}

/** Apply a game event. Mutates and returns `m`. */
export function moodEvent(m, type) {
  const cap = DIALS[m.dial].cap;
  switch (type) {
    case 'brick':
      m.energy = Math.min(cap, m.energy + 0.028);
      m.hits += 1;
      break;
    case 'paddle':
      m.energy = Math.min(cap, m.energy + 0.012);
      m.calm = clamp01(m.calm + 0.012);
      m.streak += 1;
      break;
    case 'loss':
      m.energy = clamp01(m.energy - 0.22);
      // Bite from a ceiling, so a loss after a long calm stretch still reaches DRIFT.
      m.calm = clamp01(Math.min(m.calm, 0.72) - 0.4);
      m.streak = 0;
      m.losses += 1;
      m.sinceLoss = 0;
      m.labelAge = 99;
      break;
    case 'wave':
      m.energy = Math.min(cap, m.energy + 0.1);
      m.calm = clamp01(m.calm + 0.12);
      break;
    default:
      break;
  }
  settle(m, computeLabel(m));
  return m;
}

/** Advance time by `dt` seconds. Mutates and returns `m`. */
export function moodStep(m, dt) {
  const d = DIALS[m.dial];
  const pull = Math.min(1, 0.09 * dt);
  m.energy = clamp01(m.energy + (d.baseline - m.energy) * pull);
  m.energy = Math.min(d.cap, m.energy);
  m.calm = clamp01(m.calm + 0.016 * dt);
  m.sinceLoss += dt;
  m.labelAge = (m.labelAge ?? 99) + dt;
  settle(m, computeLabel(m));
  m.tapeClock += dt;
  if (m.tapeClock >= 2) {
    m.tapeClock = 0;
    m.tape.push(LABELS.indexOf(m.label));
    if (m.tape.length > 240) m.tape.shift();
  }
  return m;
}

export function setDial(m, dial) {
  if (!DIALS[dial]) return m;
  m.dial = dial;
  m.energy = Math.min(DIALS[dial].cap, m.energy);
  settle(m, computeLabel(m));
  return m;
}

/** A new game keeps the mood's momentum but starts its own peak and streak. */
export function beginGame(m) {
  m.streak = 0;
  m.peak = m.label === 'DRIFT' ? 'DAWN' : m.label;
  m.labelAge = 99;
  return m;
}

/** What the game does with the mood. All values are multipliers or plain settings. */
export function moodResponse(m) {
  const label = m.label;
  let speed = 0.84 + 0.36 * m.energy;
  if (label === 'DRIFT') speed = Math.min(speed, 0.9);
  const paddle = label === 'DRIFT' ? 1.35 : label === 'DAWN' ? 1.12 : label === 'FLOW' ? 1 : 0.9;
  const tempo = Math.round(92 + 70 * m.energy);
  const scale = label === 'DRIFT' ? 'soft' : label === 'FLOW' ? 'bright' : label === 'RUSH' ? 'minor' : 'major';
  return {
    label,
    speed,
    paddle,
    tempo,
    scale,
    density: 0.2 + 0.8 * m.energy,
    glow: m.energy,
    multiball: label === 'RUSH' && m.streak >= 10,
    unlimitedBalls: DIALS[m.dial].unlimitedBalls,
  };
}

/** A small record the next session can start from. */
export function serializeMood(m) {
  return { dial: m.dial, energy: Number(m.energy.toFixed(3)), calm: Number(m.calm.toFixed(3)), label: m.label, peak: m.peak, tape: m.tape.slice(-120) };
}

/** Restore: the remembered energy pulls the new session 70% of the way back to where it was. */
export function restoreMood(saved, dialOverride) {
  const dial = DIALS[dialOverride] ? dialOverride : DIALS[saved?.dial] ? saved.dial : 'play';
  const m = createMood(dial);
  if (saved && typeof saved.energy === 'number') {
    m.energy = Math.min(DIALS[dial].cap, clamp01(DIALS[dial].baseline * 0.3 + saved.energy * 0.7));
  }
  if (saved && typeof saved.calm === 'number') m.calm = clamp01(0.5 + saved.calm * 0.5);
  if (Array.isArray(saved?.tape)) m.tape = saved.tape.filter((v) => Number.isInteger(v) && v >= 0 && v < LABELS.length).slice(-120);
  settle(m, computeLabel(m));
  m.peak = m.label;
  return m;
}

/** The sitewide `pc:mood` slug, read by BlockLayout, chooses the starting dial. */
export function dialFromSiteMood(slug) {
  if (slug === 'chill' || slug === 'quiet') return 'calm';
  if (slug === 'hype') return 'rush';
  return 'play';
}

/** Hand the mood back to the town when the player leaves. */
export function siteMoodFromLabel(label) {
  return { DAWN: 'chill', FLOW: 'flow', RUSH: 'hype', DRIFT: 'quiet' }[label] || 'chill';
}
