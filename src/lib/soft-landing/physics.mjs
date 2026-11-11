/**
 * Soft Landing physics: one lander, gravity, a main engine, two side jets,
 * fuel and wind. Units are logical field pixels and seconds; y grows
 * downward, so a falling lander has a positive vy and a positive gravity.
 * `angle` is radians from upright, positive when the lander leans right,
 * which is also where its thrust then pushes it.
 *
 * Pure functions, no DOM, so tests/soft-landing.test.mjs can fly it.
 */
export const LANDER = Object.freeze({ w: 10, h: 10, legSpan: 10 });

/** Fuel at the start of a game per dial. CALM never runs dry. */
export const FUEL_START = Object.freeze({ calm: Infinity, play: 1200, rush: 900 });

/** Fuel refunded for a landing, times the pad multiplier. */
export const FUEL_REFUND = 100;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function createLander(x, y, fuel = FUEL_START.play, vx = 0, vy = 0) {
  return { x, y, vx, vy, angle: 0, fuel, burning: false, alive: true };
}

/**
 * The environment the mood hands the physics. All values are per second or
 * per second squared except the flags.
 */
export const DEFAULT_ENV = Object.freeze({
  gravity: 18,
  thrust: 46,
  tiltRate: 2.2,
  maxTilt: 1.2,
  fuelRate: 14,
  tiltFuel: 2,
  wind: 0,
  unlimitedFuel: false,
});

/** Advance the lander by `dt` seconds under `input` ({ thrust, left, right }). Mutates and returns `l`. */
export function stepLander(l, input, dt, env = DEFAULT_ENV) {
  const tilt = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (tilt) {
    l.angle = clamp(l.angle + tilt * env.tiltRate * dt, -env.maxTilt, env.maxTilt);
    if (!env.unlimitedFuel) l.fuel = Math.max(0, l.fuel - env.tiltFuel * dt);
  }
  const burning = !!input.thrust && (env.unlimitedFuel || l.fuel > 0);
  l.burning = burning;
  let ax = env.wind;
  let ay = env.gravity;
  if (burning) {
    ax += Math.sin(l.angle) * env.thrust;
    ay -= Math.cos(l.angle) * env.thrust;
    if (!env.unlimitedFuel) l.fuel = Math.max(0, l.fuel - env.fuelRate * dt);
  }
  // Semi-implicit Euler: velocity first, then position, which keeps a hover stable.
  l.vx += ax * dt;
  l.vy += ay * dt;
  l.x += l.vx * dt;
  l.y += l.vy * dt;
  return l;
}

/** The field has no edges to crash into: a lander that leaves one side returns on the other. */
export function wrapX(l, width) {
  if (l.x < 0) l.x += width;
  else if (l.x >= width) l.x -= width;
  return l;
}

/** The HUD is a ceiling: a lander that climbs into it stops there. */
export function ceiling(l, top) {
  if (l.y - LANDER.h / 2 < top) { l.y = top + LANDER.h / 2; if (l.vy < 0) l.vy = 0; }
  return l;
}

export const speedOf = (l) => Math.hypot(l.vx, l.vy);

/**
 * A controlled burn is one that leaves the lander slower than it found it.
 * The game maps that to the mood's 'paddle' event, one per burn.
 */
export function createBurnTracker(minDrop = 6, minHold = 0.15) {
  let speedAtStart = 0, held = 0, burning = false;
  return {
    /** Call every frame with the lander and dt; returns true once when a burn ends having slowed the lander. */
    step(l, dt) {
      if (l.burning && !burning) { burning = true; speedAtStart = speedOf(l); held = 0; return false; }
      if (l.burning) { held += dt; return false; }
      if (!burning) return false;
      burning = false;
      return held >= minHold && speedOf(l) <= speedAtStart - minDrop;
    },
    reset() { burning = false; held = 0; },
  };
}
