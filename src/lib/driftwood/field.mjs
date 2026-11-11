/**
 * Driftwood field geometry: logs, the boat, the flares, the tide bird, and
 * the torus they live on.
 *
 * Driftwood is Asteroids (Atari, 1979) on the water. A log is a jagged,
 * elongated polygon; a big one splits into two medium ones, a medium one into
 * two small ones, and a small one is cleared. The field wraps at every edge,
 * nothing has friction, and the boat only ever turns and pushes.
 *
 * Pure functions, no DOM, no Math.random: every random choice goes through a
 * caller-supplied `rng()` (0 <= r < 1) so tests/driftwood.test.mjs can replay
 * a field exactly. `makeRng(seed)` is a small deterministic generator.
 */
export const FIELD_W = 288;
export const FIELD_TOP = 32;
export const FIELD_H_MIN = 384;
export const FIELD_H_MAX = 480;

/** Log sizes: hit radius (logical px), points, what the pieces become. Scoring follows the arcade: 20, 50, 100. */
export const SIZES = Object.freeze({
  big: Object.freeze({ id: 'big', radius: 20, points: 20, next: 'medium', speed: 1 }),
  medium: Object.freeze({ id: 'medium', radius: 11, points: 50, next: 'small', speed: 1.4 }),
  small: Object.freeze({ id: 'small', radius: 6, points: 100, next: null, speed: 1.9 }),
});
export const SIZE_IDS = Object.freeze(['big', 'medium', 'small']);

export const BIRD_POINTS = 200;
export const FIELD_CLEAR_POINTS = 100;

/** The boat, nose along +x. A pointed bow, a square stern, 9 px long. */
export const BOAT_POLY = Object.freeze([[9, 0], [1, 4], [-6, 4], [-8, 2], [-8, -2], [-6, -4], [1, -4]]);
export const BOAT_RADIUS = 5;
export const BIRD_RADIUS = 7;
export const BOAT = Object.freeze({ turnRate: 4.2, thrust: 190, maxSpeed: 190 });
export const FLARE = Object.freeze({ speed: 250, life: 0.9, cooldown: 0.22, maxLive: 5 });

/** mulberry32: a tiny seeded generator, enough to replay a field in a test. */
export function makeRng(seed = 1) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * A driftwood log: 9 to 12 vertices around an ellipse about 2.2 times longer
 * than it is wide, each pushed in or out so the outline reads as bark and
 * broken ends rather than a rock. Local coordinates, long axis along +x,
 * every vertex within `radius` of the origin.
 */
export function logPolygon(size, rng) {
  const spec = SIZES[size] || SIZES.big;
  const n = 9 + Math.floor(rng() * 4);
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * TAU + (rng() - 0.5) * (TAU / n) * 0.6;
    const along = Math.cos(a);
    const across = Math.sin(a);
    // Elongate along x, then bite out notches so the ends look split.
    const bite = 0.72 + rng() * 0.28;
    const x = along * spec.radius * bite;
    const y = across * spec.radius * (0.42 + rng() * 0.14) * bite;
    pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  return pts;
}

/** The tide bird: a gull chevron, wings along x, nose along +x. */
export const BIRD_POLY = Object.freeze([[6, 0], [1, -2], [-5, -6], [-1, -1], [-6, 0], [-1, 1], [-5, 6], [1, 2]]);

export function makeLog(size, x, y, vx, vy, rng) {
  const spec = SIZES[size] || SIZES.big;
  return {
    kind: 'log',
    size: spec.id,
    x, y, vx, vy,
    angle: rng() * TAU,
    spin: (rng() - 0.5) * (spec.id === 'small' ? 4 : spec.id === 'medium' ? 2.6 : 1.4),
    radius: spec.radius,
    poly: logPolygon(spec.id, rng),
    alive: true,
  };
}

export function makeBoat(x, y) {
  return { kind: 'boat', x, y, vx: 0, vy: 0, heading: -Math.PI / 2, radius: BOAT_RADIUS, alive: true, shield: 0, thrusting: false };
}

/** Straight-line motion with spin. No friction anywhere on the water. */
export function integrate(body, dt) {
  body.x += body.vx * dt;
  body.y += body.vy * dt;
  if (typeof body.spin === 'number') body.angle += body.spin * dt;
  return body;
}

const mod = (v, n) => ((v % n) + n) % n;

/**
 * Torus wrap with one fixed period for every body, so the seam lines up for
 * everything on the water: a center that leaves on one side comes back on
 * the other. A body near an edge is drawn on both sides (see `images`), and
 * collisions test the nearest wrapped image (see `nearestImage`). Returns
 * true when it wrapped.
 */
export function wrap(body, bounds) {
  const w = bounds.x1 - bounds.x0, h = bounds.y1 - bounds.y0;
  const x = bounds.x0 + mod(body.x - bounds.x0, w);
  const y = bounds.y0 + mod(body.y - bounds.y0, h);
  const did = x !== body.x || y !== body.y;
  body.x = x; body.y = y;
  return did;
}

/** Shortest offset from (ax, ay) to (bx, by) on the torus. */
export function torusDelta(ax, ay, bx, by, bounds) {
  const w = bounds.x1 - bounds.x0, h = bounds.y1 - bounds.y0;
  let dx = bx - ax, dy = by - ay;
  dx -= w * Math.round(dx / w);
  dy -= h * Math.round(dy / h);
  return { dx, dy };
}

/** The wrapped copy of point (px, py) nearest to `body`, for collision tests across the seam. */
export function nearestImage(px, py, body, bounds) {
  if (!bounds) return [px, py];
  const { dx, dy } = torusDelta(body.x, body.y, px, py, bounds);
  return [body.x + dx, body.y + dy];
}

/** Offsets at which a body of radius `r` must be drawn so it shows on both sides of a seam. */
export function images(body, bounds, r = body.radius || 0) {
  const w = bounds.x1 - bounds.x0, h = bounds.y1 - bounds.y0;
  const xs = [0], ys = [0];
  if (body.x - r < bounds.x0) xs.push(w); else if (body.x + r > bounds.x1) xs.push(-w);
  if (body.y - r < bounds.y0) ys.push(h); else if (body.y + r > bounds.y1) ys.push(-h);
  const out = [];
  for (const ox of xs) for (const oy of ys) out.push([ox, oy]);
  return out;
}

export function rotateBoat(boat, dir, dt, rate = BOAT.turnRate) {
  boat.heading += dir * rate * dt;
  boat.heading = ((boat.heading % TAU) + TAU) % TAU;
  return boat;
}

/** Push along the heading and clamp the speed; coasting keeps every bit of it. */
export function thrustBoat(boat, dt, accel = BOAT.thrust, maxSpeed = BOAT.maxSpeed) {
  boat.vx += Math.cos(boat.heading) * accel * dt;
  boat.vy += Math.sin(boat.heading) * accel * dt;
  const sp = Math.hypot(boat.vx, boat.vy);
  if (sp > maxSpeed) { boat.vx = (boat.vx / sp) * maxSpeed; boat.vy = (boat.vy / sp) * maxSpeed; }
  return boat;
}

/** A flare leaves the bow with the boat's own velocity added, the way the arcade did it. */
export function makeFlare(boat, speed = FLARE.speed, life = FLARE.life) {
  const cx = Math.cos(boat.heading), sy = Math.sin(boat.heading);
  return { kind: 'flare', x: boat.x + cx * 9, y: boat.y + sy * 9, vx: boat.vx + cx * speed, vy: boat.vy + sy * speed, life, radius: 1, alive: true };
}

/** World-space vertices of a polygon body. */
export function worldPoly(body) {
  const c = Math.cos(body.angle ?? body.heading ?? 0), s = Math.sin(body.angle ?? body.heading ?? 0);
  return body.poly.map(([px, py]) => [body.x + px * c - py * s, body.y + px * s + py * c]);
}

export function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function segmentDistanceSq(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
  const qx = ax + dx * t, qy = ay + dy * t;
  return (px - qx) ** 2 + (py - qy) ** 2;
}

/** A circle against a polygon body: inside it, or within `r` of one of its edges. */
export function circleHitsPolygon(cx, cy, r, body) {
  const d = Math.hypot(cx - body.x, cy - body.y);
  if (d > r + body.radius) return false;
  const poly = worldPoly(body);
  if (pointInPolygon(cx, cy, poly)) return true;
  const rr = r * r;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    if (segmentDistanceSq(cx, cy, poly[j][0], poly[j][1], poly[i][0], poly[i][1]) <= rr) return true;
  }
  return false;
}

export function circlesTouch(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < (a.radius || 0) + (b.radius || 0);
}

/** Points for a log of `size` (or the bird). */
export function scoreFor(size) {
  if (size === 'bird') return BIRD_POINTS;
  return SIZES[size]?.points ?? 0;
}

/** Base drift speed of a big log on field `n` (0-based). Medium and small pieces multiply it. */
export function fieldSpeed(n) {
  return 26 + 5 * Math.min(n, 10);
}

/** How many big logs field `n` opens with: four, then one more per field, capped. */
export function fieldCount(n, extra = 0) {
  return Math.min(12, 4 + Math.min(n, 6) + extra);
}

/**
 * Split a log. A big one becomes two medium, a medium two small, a small
 * nothing. The pieces leave at an angle to the parent's travel and faster,
 * and inherit a little of the flare's direction when one is given.
 */
export function splitLog(log, rng, baseSpeed, impulse = null) {
  const next = SIZES[log.size]?.next;
  if (!next) return [];
  const out = [];
  const parentAngle = Math.atan2(log.vy, log.vx);
  const speed = baseSpeed * SIZES[next].speed;
  for (let i = 0; i < 2; i += 1) {
    const side = i === 0 ? 1 : -1;
    const a = parentAngle + side * (0.55 + rng() * 0.5);
    let vx = Math.cos(a) * speed * (0.8 + rng() * 0.4);
    let vy = Math.sin(a) * speed * (0.8 + rng() * 0.4);
    if (impulse) { vx += impulse.vx * 0.08; vy += impulse.vy * 0.08; }
    const piece = makeLog(next, log.x + side * 3, log.y - side * 2, vx, vy, rng);
    out.push(piece);
  }
  return out;
}

/**
 * Lay out field `n`: `fieldCount(n, extra)` big logs, each at least `clearance`
 * away from the boat, drifting in random directions at `fieldSpeed(n)`.
 */
export function buildField(n, bounds, boat, rng, { extra = 0, clearance = 70 } = {}) {
  const logs = [];
  const count = fieldCount(n, extra);
  const speed = fieldSpeed(n);
  for (let i = 0; i < count; i += 1) {
    let x = 0, y = 0;
    for (let tries = 0; tries < 24; tries += 1) {
      x = lerp(bounds.x0, bounds.x1, rng());
      y = lerp(bounds.y0, bounds.y1, rng());
      if (!boat) break;
      const { dx, dy } = torusDelta(boat.x, boat.y, x, y, bounds);
      if (Math.hypot(dx, dy) >= clearance) break;
    }
    const a = rng() * TAU;
    const sp = speed * (0.7 + rng() * 0.6);
    logs.push(makeLog('big', x, y, Math.cos(a) * sp, Math.sin(a) * sp, rng));
  }
  return logs;
}

/** The tide bird enters from one side at a random height and crosses. */
export function makeBird(bounds, rng, speed = 70) {
  const fromLeft = rng() < 0.5;
  const y = lerp(bounds.y0 + 30, bounds.y1 - 30, rng());
  return {
    kind: 'bird',
    x: fromLeft ? bounds.x0 - BIRD_RADIUS : bounds.x1 + BIRD_RADIUS,
    y, baseY: y,
    vx: fromLeft ? speed : -speed,
    vy: 0,
    radius: BIRD_RADIUS,
    poly: BIRD_POLY,
    angle: fromLeft ? 0 : Math.PI,
    t: 0,
    alive: true,
  };
}
