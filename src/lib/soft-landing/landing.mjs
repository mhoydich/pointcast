/**
 * Soft Landing judgement, scoring, the mood-to-environment mapping and an
 * autopilot the title screen flies and the tests fly.
 */
import { LANDER, DEFAULT_ENV } from './physics.mjs';
import { groundAt, padUnder, widestPad } from './skyline.mjs';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** A landing is safe when it is slow, straight and level, and on a pad. */
export const LIMITS = Object.freeze({ vy: 24, vx: 14, angle: 0.24 });

export const REASON_TEXT = Object.freeze({ fast: 'TOO FAST', sideways: 'DRIFTING', tilted: 'TILTED', 'off-pad': 'NO PAD' });

/** Height of the lander's feet above the ground under its centre. */
export function altitudeOf(l, sky) {
  return groundAt(sky, l.x) - (l.y + LANDER.h / 2);
}

/** True once any foot or the centre has reached the ground. */
export function touchedDown(l, sky) {
  const bottom = l.y + LANDER.h / 2;
  const half = LANDER.legSpan / 2;
  return groundAt(sky, l.x) <= bottom || groundAt(sky, l.x - half) <= bottom || groundAt(sky, l.x + half) <= bottom;
}

export function judgeLanding(l, sky, limits = LIMITS) {
  const half = LANDER.legSpan / 2;
  const pad = padUnder(sky, l.x - half, l.x + half);
  const reasons = [];
  if (!pad) reasons.push('off-pad');
  if (l.vy > limits.vy) reasons.push('fast');
  if (Math.abs(l.vx) > limits.vx) reasons.push('sideways');
  if (Math.abs(l.angle) > limits.angle) reasons.push('tilted');
  const landed = reasons.length === 0;
  const soft = landed && l.vy <= limits.vy * 0.4 && Math.abs(l.vx) <= limits.vx * 0.4;
  return { landed, soft, pad, reasons };
}

export const SCORING = Object.freeze({ base: 50, softBonus: 25, fuelPer: 10 });

/** Points for a landing: the pad multiplier times the base (and a soft bonus), plus fuel left. */
export function landingScore(judgement, l, scoring = SCORING) {
  if (!judgement.landed || !judgement.pad) return { points: 0, fuelBonus: 0 };
  const mult = judgement.pad.mult;
  const fuelBonus = Number.isFinite(l.fuel) ? Math.floor(l.fuel / scoring.fuelPer) : 0;
  const points = mult * (scoring.base + (judgement.soft ? scoring.softBonus : 0)) + fuelBonus;
  return { points, fuelBonus, mult };
}

/** How many `step`-unit altitude lines were crossed going down from `fromAlt` to `toAlt`. */
export function descentMarks(fromAlt, toAlt, step = 100) {
  if (!(toAlt < fromAlt)) return 0;
  return Math.max(0, Math.floor(fromAlt / step) - Math.floor(Math.max(0, toAlt) / step));
}

/**
 * The mood's response, as the physics sees it. `speed` drives gravity, `paddle`
 * drives pad width, RUSH brings a crosswind (`crosswind` is -1, 0 or 1, chosen
 * per skyline), CALM's unlimited balls become unlimited fuel.
 */
export function envFor(response, crosswind = 0) {
  const label = response.label;
  const wind = label === 'RUSH' ? crosswind * (2.5 + 4 * response.glow) : label === 'FLOW' ? crosswind * 1 : 0;
  return {
    ...DEFAULT_ENV,
    gravity: Number((DEFAULT_ENV.gravity * response.speed).toFixed(2)),
    wind: Number(wind.toFixed(2)),
    unlimitedFuel: !!response.unlimitedBalls,
    padScale: response.paddle,
    rushPad: label === 'RUSH',
  };
}

/**
 * A plain feedback autopilot: line up over the pad, then sink slowly and level.
 * The title screen flies it; the descent test proves it lands.
 */
export function autopilot(l, sky, env = DEFAULT_ENV, pad = widestPad(sky)) {
  const alt = altitudeOf(l, sky);
  // Aim a little upwind of the centre: the last metres of a level descent drift with the wind.
  const cx = (pad.x0 + pad.x1) / 2 - clamp(env.wind * 0.6, -(pad.width / 2 - 1), pad.width / 2 - 1);
  let dx = cx - l.x;
  // The field wraps, so the short way round may cross an edge.
  if (dx > sky.width / 2) dx -= sky.width; else if (dx < -sky.width / 2) dx += sky.width;
  const maxH = Math.min(18, 3 + alt * 0.12);
  const wantVx = clamp(dx * 0.22, -maxH, maxH);
  const errVx = wantVx - l.vx;
  // In a hover the engine runs about gravity/thrust of the time, so this lean cancels the wind on average.
  const lean = -Math.asin(clamp(env.wind / Math.max(1, env.gravity), -0.9, 0.9));
  let wantAngle = clamp(errVx * 0.05 + lean, -0.55, 0.55);
  // On final the lander stays level enough to pass, leaning only into the wind.
  if (alt < 10) wantAngle = clamp(wantAngle, -0.22, 0.22);
  const left = l.angle > wantAngle + 0.03;
  const right = l.angle < wantAngle - 0.03;
  const overPad = Math.abs(dx) < Math.max(1.5, pad.width / 2 - 3);
  let wantVy = clamp(3 + alt * 0.09, 3, 36);
  // Not lined up yet and low: hover, but keep sinking once the error is down to a pixel or two,
  // and below ten units commit, since a level hover cannot always hold against the wind.
  if (!overPad && alt < 45 && alt >= 10) wantVy = Math.abs(dx) < 4 ? 1.5 : -1;
  return { thrust: l.vy > wantVy, left, right };
}
