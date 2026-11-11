/**
 * Tideline ball physics: a Pong table stood on its end.
 *
 * The field is the same 288-wide logical screen as Breakwater, so the two
 * games read as one cabinet row. The house paddle sits under the score
 * digits at the top, your paddle sits near the bottom, and the ball goes
 * between them. Everything here is pure: `stepBall` mutates the ball it is
 * given and returns the list of things that happened, so tests can run a
 * whole rally without a canvas.
 *
 * The return angle follows the 1972 arcade: the paddle is split into eight
 * segments, the middle two send the ball back steeply and the outer ones
 * send it off at flatter angles. Speed is a property the caller sets each
 * frame (see rules.mjs `rallySpeed`), and the ball keeps a minimum vertical
 * component so a flat shot can never stall between the side walls.
 */
export const FIELD = Object.freeze({
  W: 288,
  H_MIN: 384,
  H_MAX: 480,
  WALL: 8,
  HUD: 36,
  BALL: 4,
  PADDLE_H: 6,
  PADDLE_W: 32,
  HOUSE_Y: 44,
  YOU_INSET: 32,
});

export const SEGMENTS = 8;
/** Degrees off the vertical for each of the eight paddle segments, left to right. */
export const SEGMENT_ANGLES = Object.freeze([-58, -44, -30, -14, 14, 30, 44, 58]);
const MIN_VERTICAL = 0.34;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Which of the eight segments `rel` (-1 left edge .. 1 right edge) lands in. */
export function segmentOf(rel) {
  const r = clamp(rel, -1, 1);
  return Math.min(SEGMENTS - 1, Math.floor(((r + 1) / 2) * SEGMENTS));
}

/** Return angle in radians off the vertical for a hit at `rel`. */
export function returnAngle(rel) {
  return (SEGMENT_ANGLES[segmentOf(rel)] * Math.PI) / 180;
}

export function createBall(x, y, vx = 0, vy = 0, speed = 140) {
  return { x, y, vx, vy, speed, volleys: 0, trail: [], stuck: null };
}

/** Keep |v| = speed and keep the vertical component above the floor, preserving direction signs. */
export function normalize(b) {
  const len = Math.hypot(b.vx, b.vy) || 1;
  b.vx = (b.vx / len) * b.speed;
  b.vy = (b.vy / len) * b.speed;
  const minY = MIN_VERTICAL * b.speed;
  if (Math.abs(b.vy) < minY) {
    b.vy = (b.vy < 0 ? -1 : 1) * minY;
    const sx = b.vx < 0 ? -1 : 1;
    b.vx = sx * Math.sqrt(Math.max(0, b.speed * b.speed - b.vy * b.vy));
  }
  return b;
}

/** Send the ball away from a paddle whose center is `paddleX`, width `paddleW`, in vertical direction `dir` (-1 up, 1 down). */
export function deflect(b, paddleX, paddleW, dir) {
  const rel = clamp((b.x + FIELD.BALL / 2 - paddleX) / (paddleW / 2), -1, 1);
  const ang = returnAngle(rel);
  b.vx = Math.sin(ang) * b.speed;
  b.vy = dir * Math.cos(ang) * b.speed;
  return segmentOf(rel);
}

/**
 * Advance `b` by `dt` seconds inside `g`:
 *   { W, H, WALL, HUD, BALL, youX, youW, youY, houseX, houseW, houseY, PADDLE_H }
 * Returns events in order: 'wall', 'you' (your return), 'house' (the house
 * returned it), 'outTop' (past the house: your point), 'outBottom' (past you).
 * The ball is left where it was when it went out so the caller can decide.
 */
export function stepBall(b, g, dt) {
  const events = [];
  if (b.stuck) return events;
  normalize(b);
  const ballSize = g.BALL ?? FIELD.BALL;
  const ph = g.PADDLE_H ?? FIELD.PADDLE_H;
  const dist = Math.hypot(b.vx, b.vy) * dt;
  const n = Math.max(1, Math.ceil(dist / 2));
  const sdt = dt / n;
  for (let i = 0; i < n; i += 1) {
    b.x += b.vx * sdt;
    b.y += b.vy * sdt;
    if (b.x < g.WALL) { b.x = g.WALL; b.vx = Math.abs(b.vx); events.push('wall'); }
    if (b.x + ballSize > g.W - g.WALL) { b.x = g.W - g.WALL - ballSize; b.vx = -Math.abs(b.vx); events.push('wall'); }
    // Your paddle, ball coming down.
    if (b.vy > 0 && b.y + ballSize >= g.youY && b.y + ballSize <= g.youY + ph + 3 && b.x + ballSize >= g.youX - g.youW / 2 && b.x <= g.youX + g.youW / 2) {
      b.y = g.youY - ballSize;
      deflect(b, g.youX, g.youW, -1);
      b.volleys += 1;
      events.push('you');
    }
    // The house paddle, ball going up.
    if (b.vy < 0 && b.y <= g.houseY + ph && b.y >= g.houseY - 3 && b.x + ballSize >= g.houseX - g.houseW / 2 && b.x <= g.houseX + g.houseW / 2) {
      b.y = g.houseY + ph;
      deflect(b, g.houseX, g.houseW, 1);
      b.volleys += 1;
      events.push('house');
    }
    if (b.y + ballSize < g.HUD - 6) { events.push('outTop'); return events; }
    if (b.y > g.H + 2) { events.push('outBottom'); return events; }
  }
  b.trail.push([b.x, b.y]);
  if (b.trail.length > 7) b.trail.shift();
  return events;
}

/**
 * Where the ball will cross `targetY` if nothing touches it, with side-wall
 * reflections folded in. Returns null when the ball is not heading there.
 */
export function predictX(b, targetY, g) {
  const ballSize = g.BALL ?? FIELD.BALL;
  const going = targetY < b.y ? b.vy < 0 : b.vy > 0;
  if (!going || Math.abs(b.vy) < 1e-6) return null;
  const t = (targetY - b.y) / b.vy;
  const span = g.W - 2 * g.WALL - ballSize;
  if (span <= 0) return b.x;
  let x = b.x - g.WALL + b.vx * t;
  // Fold into [0, 2*span) then mirror the second half: a reflection off each wall.
  const period = 2 * span;
  x = ((x % period) + period) % period;
  if (x > span) x = period - x;
  return x + g.WALL + ballSize / 2;
}
