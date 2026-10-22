/**
 * Soft Landing skylines: a wobbly vector horizon with a few flat pads.
 *
 * A skyline is a polyline from the left edge of the field to the right.
 * Pads are flat runs with a multiplier; the narrower the pad, the higher
 * the multiplier, as on the 1979 arcade machine. Generation is seeded so a
 * test and the page see the same ground for the same seed.
 */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** No pad is narrower than the lander's legs; the five-times sliver is exactly that wide. */
export const MIN_PAD = 12;

/** mulberry32: a small seeded generator that returns numbers in [0, 1). */
export function mulberry32(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pad widths and multipliers; RUSH adds a sliver worth five. */
export const PAD_KINDS = Object.freeze([
  Object.freeze({ width: 30, mult: 1 }),
  Object.freeze({ width: 22, mult: 2 }),
  Object.freeze({ width: 14, mult: 4 }),
]);
export const RUSH_PAD = Object.freeze({ width: 12, mult: 5 });

/**
 * Build skyline `seed` for a field of `width` by `height`.
 * `padScale` widens or narrows every pad (the mood's paddle response).
 * `rush` adds the narrow five-times pad.
 */
export function generateSkyline(seed, { width = 288, height = 384, padScale = 1, rush = false, margin = 6 } = {}) {
  const rnd = mulberry32(seed);
  const yMin = Math.round(height * 0.56);
  const yMax = height - 26;
  const kinds = rush ? [...PAD_KINDS, RUSH_PAD] : [...PAD_KINDS];
  // Five slots across the field; each pad takes its own slot so they never touch.
  const slots = [0, 1, 2, 3, 4];
  for (let i = slots.length - 1; i > 0; i -= 1) { const j = Math.floor(rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const usable = width - margin * 2;
  const slotW = usable / 5;
  const pads = kinds.map((kind, i) => {
    const w = clamp(Math.round(kind.width * padScale), MIN_PAD, 44);
    const slot = slots[i];
    const center = margin + slot * slotW + slotW / 2 + (rnd() - 0.5) * (slotW - w - 6);
    const x0 = Math.round(center - w / 2);
    const y = Math.round(yMin + 12 + rnd() * (yMax - yMin - 12));
    return { x0, x1: x0 + w, y, mult: kind.mult, width: w };
  }).sort((a, b) => a.x0 - b.x0);

  const points = [];
  const wobble = 0.6 + rnd() * 0.8;
  const phase = rnd() * Math.PI * 2;
  let x = 0;
  let y = Math.round(yMin + (yMax - yMin) * (0.3 + rnd() * 0.4));
  points.push([0, y]);
  const walkTo = (limit) => {
    while (x + 8 < limit) {
      const step = 8 + Math.floor(rnd() * 10);
      x = Math.min(limit, x + step);
      const drift = (rnd() - 0.5) * 34 * wobble + Math.sin(x * 0.06 + phase) * 4;
      y = Math.round(clamp(y + drift, yMin, yMax));
      points.push([x, y]);
    }
  };
  for (const pad of pads) {
    walkTo(pad.x0 - 4);
    // A short shoulder up or down to the pad, then the flat run.
    points.push([pad.x0, pad.y], [pad.x1, pad.y]);
    x = pad.x1;
    y = pad.y;
  }
  walkTo(width);
  if (points[points.length - 1][0] < width) points.push([width, y]);
  return { seed, width, height, points, pads };
}

/** Ground height under field x, by linear interpolation along the polyline. */
export function groundAt(sky, x) {
  const pts = sky.points;
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (x <= x1) { if (x1 === x0) return Math.max(y0, y1); return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0); }
  }
  return pts[pts.length - 1][1];
}

/** The pad whose flat run holds the whole span [left, right], or null. */
export function padUnder(sky, left, right, tolerance = 1.5) {
  return sky.pads.find((p) => left >= p.x0 - tolerance && right <= p.x1 + tolerance) || null;
}

export function widestPad(sky) {
  return sky.pads.reduce((best, p) => (p.width > best.width ? p : best), sky.pads[0]);
}
