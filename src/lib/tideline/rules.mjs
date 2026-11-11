/**
 * Tideline match rules and the house paddle's brain.
 *
 * Rally to 11, as the arcade Pong cabinet did. Serve alternates every point.
 * Speed rises with each volley and resets on a point. On the CALM dial no
 * game ends: the digits just keep counting.
 *
 * The house paddle's skill is a number from 0 to 1 that the mood sets
 * (DRIFT eases it, RUSH sharpens it). Skill decides how fast the house can
 * move, how early it starts tracking and how far off its aim lands. The
 * random part is injected, so tests can make the house perfect or hopeless.
 */
export const WIN_SCORE = 11;
export const SPEED = Object.freeze({ base: 138, step: 8, max: 330 });

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function createMatch({ toWin = WIN_SCORE, unlimited = false, server = 'you' } = {}) {
  return { you: 0, house: 0, server, toWin, unlimited, points: 0, over: false, winner: null, longest: 0 };
}

/** Speed for a rally `volleys` returns old, before the mood multiplier. Resets to base on every point. */
export function rallySpeed(volleys, s = SPEED) {
  return Math.min(s.max, s.base + s.step * Math.max(0, volleys));
}

/** Award a point to 'you' or 'house'. Mutates and returns the match. Serve passes to the other side. */
export function awardPoint(m, winner, rallyLength = 0) {
  if (m.over) return m;
  if (winner === 'you') m.you += 1; else m.house += 1;
  m.points += 1;
  m.longest = Math.max(m.longest, rallyLength);
  m.server = m.server === 'you' ? 'house' : 'you';
  if (!m.unlimited && (m.you >= m.toWin || m.house >= m.toWin)) {
    m.over = true;
    m.winner = m.you >= m.toWin ? 'you' : 'house';
  }
  return m;
}

/** Who serves next: the serve alternates, starting with whoever the match was created for. */
export function serverFor(m) {
  return m.server;
}

/** 0..1 from the mood response: DRIFT eases the house, RUSH sharpens it, energy fills in between. */
export function houseSkill(response) {
  const energy = clamp(response?.glow ?? 0.45, 0, 1);
  const byLabel = { DRIFT: -0.22, DAWN: 0, FLOW: 0.08, RUSH: 0.2 };
  return clamp(0.34 + 0.46 * energy + (byLabel[response?.label] ?? 0), 0.12, 0.97);
}

/** Movement traits for a given skill. Pixels per second and pixels of aim error. */
export function houseTraits(skill) {
  const s = clamp(skill, 0, 1);
  return {
    speed: Math.round(60 + 190 * s),
    /** Aim error in pixels. The paddle is 32 wide and the ball 4, so an error past about 18 is a miss. */
    error: Math.round(16 + 24 * (1 - s)),
    /** How far from the house (fraction of the field) the ball must be before it starts tracking. */
    reach: 0.4 + 0.55 * s,
  };
}

export function createHouse(x) {
  return { x, target: x, aimError: 0, aimedFor: null };
}

/**
 * Move the house paddle for one frame. `predict` is the x where the ball
 * will cross the house line (null when it is going away), `rand` returns
 * 0..1 and is called once per approach so the miss is decided early and
 * looks like a judgement, not a tremor.
 */
export function stepHouse(h, ball, predict, dt, skill, g, rand = Math.random) {
  const t = houseTraits(skill);
  const center = g.W / 2;
  const approaching = ball && ball.vy < 0;
  const far = ball ? (ball.y - g.houseY) / (g.H - g.houseY) : 1;
  if (approaching && predict != null && far <= t.reach) {
    if (h.aimedFor !== ball) { h.aimedFor = ball; h.aimError = (rand() * 2 - 1) * t.error; }
    h.target = clamp(predict + h.aimError, g.WALL + g.houseW / 2, g.W - g.WALL - g.houseW / 2);
  } else {
    if (!approaching) h.aimedFor = null;
    h.target = center + (h.target - center) * 0.98;
  }
  const dx = h.target - h.x;
  const maxMove = t.speed * dt;
  h.x += Math.abs(dx) <= maxMove ? dx : Math.sign(dx) * maxMove;
  h.x = clamp(h.x, g.WALL + g.houseW / 2, g.W - g.WALL - g.houseW / 2);
  return h;
}

/** The 2600 drew two digits a side. Scores past 99 keep counting but wrap on the display, as a BCD counter would. */
export function scoreDigits(n) {
  return String(Math.max(0, Math.floor(n)) % 100).padStart(2, '0');
}
