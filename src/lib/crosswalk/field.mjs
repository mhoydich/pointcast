/**
 * Crosswalk field: the El Segundo strip a beach-goer has to cross, lane by
 * lane, drawn on the same 288-wide logical screen as Breakwater.
 *
 * Rows run top to bottom: the water with four lifeguard towers (the homes),
 * the sand, two bike-path lanes, the median, five traffic lanes, and the
 * sidewalk you start on. Each lane holds a few vehicle slots spaced around a
 * track longer than the screen; the slots wrap, so a lane is a loop with a
 * fixed rhythm. Mood thins or thickens the traffic by switching slots off and
 * on while they are off screen, and scales every lane's speed.
 *
 * Pure data and functions, no DOM: tests/crosswalk.test.mjs drives them.
 */
export const W = 288;
export const COLS = 12;
export const CELL = 24;
export const HUD = 32;
export const WATER_H = 40;
export const ROW_H = 28;
export const TIMER_H = 32;

/** Row kinds, top to bottom. Index 0 is the water, the last row is the sidewalk. */
export const ROW_KINDS = Object.freeze(['water', 'sand', 'lane', 'lane', 'median', 'lane', 'lane', 'lane', 'lane', 'lane', 'sidewalk']);
export const ROWS = ROW_KINDS.length;
export const START = Object.freeze({ col: 5, row: ROWS - 1 });
export const TOWER_COLS = Object.freeze([1, 4, 7, 10]);
export const H = HUD + WATER_H + (ROWS - 1) * ROW_H + TIMER_H;

/** Top edge of row `r` in logical pixels, and its height. */
export function rowY(r) {
  if (r <= 0) return HUD;
  return HUD + WATER_H + (r - 1) * ROW_H;
}
export function rowHeight(r) {
  return r === 0 ? WATER_H : ROW_H;
}
/** Tallest a lane may grow on a tall screen, and the tallest field that buys. */
export const ROW_H_MAX = 40;
export const H_MAX = HUD + (WATER_H + ROW_H_MAX - ROW_H) + (ROWS - 1) * ROW_H_MAX + TIMER_H;

/**
 * Drawing geometry for a screen `height` logical pixels tall. A tall phone
 * gets taller lanes (never shorter than the base 28, never past 40) so the
 * field fills more of the glass; the water keeps its extra 12. Hops and
 * collisions use row indexes and x only, so the rules never see this.
 */
export function layoutFor(height = H) {
  const spare = Math.max(0, Math.floor(Number.isFinite(height) ? height : H) - H);
  const rowH = Math.min(ROW_H_MAX, ROW_H + Math.floor(spare / ROWS));
  const waterH = WATER_H + (rowH - ROW_H);
  const total = HUD + waterH + (ROWS - 1) * rowH + TIMER_H;
  const y = (r) => (r <= 0 ? HUD : HUD + waterH + (r - 1) * rowH);
  const h = (r) => (r === 0 ? waterH : rowH);
  return { rowH, waterH, H: total, timerY: total - TIMER_H, rowY: y, rowHeight: h };
}

export const SAFE_ROWS = Object.freeze(ROW_KINDS.map((k, i) => (k === 'lane' ? -1 : i)).filter((i) => i >= 0));
export const LANE_ROWS = Object.freeze(ROW_KINDS.map((k, i) => (k === 'lane' ? i : -1)).filter((i) => i >= 0));

/**
 * Vehicle kinds. `w` and `h` are the hit box in logical pixels; sprites are
 * drawn around that box by the page. Speeds are pixels per second at pace 1.
 */
export const VEHICLES = Object.freeze({
  car: Object.freeze({ id: 'car', w: 24, h: 14, name: 'CAR' }),
  bus: Object.freeze({ id: 'bus', w: 48, h: 16, name: 'BUS' }),
  skate: Object.freeze({ id: 'skate', w: 18, h: 16, name: 'SKATEBOARD' }),
  bike: Object.freeze({ id: 'bike', w: 20, h: 16, name: 'BIKE' }),
});

/**
 * One spec per lane row, keyed by row index. Direction +1 moves right.
 * Slots are how many vehicles the lane holds at full density. The two bike
 * lanes are the path by the sand; the five below are the street.
 */
export const LANE_SPECS = Object.freeze({
  2: Object.freeze({ row: 2, kind: 'bike', dir: -1, speed: 92, slots: 3, name: 'BIKE PATH' }),
  3: Object.freeze({ row: 3, kind: 'bike', dir: 1, speed: 66, slots: 3, name: 'BIKE PATH' }),
  5: Object.freeze({ row: 5, kind: 'car', dir: -1, speed: 96, slots: 2, name: 'FAST LANE' }),
  6: Object.freeze({ row: 6, kind: 'bus', dir: 1, speed: 38, slots: 2, name: 'BUS LANE' }),
  7: Object.freeze({ row: 7, kind: 'skate', dir: -1, speed: 58, slots: 4, name: 'SKATE LANE' }),
  8: Object.freeze({ row: 8, kind: 'car', dir: 1, speed: 52, slots: 3, name: 'STREET' }),
  9: Object.freeze({ row: 9, kind: 'car', dir: -1, speed: 44, slots: 3, name: 'STREET' }),
});

/** Track length a lane loops over, and where screen x = 0 sits on the track. */
export const PERIOD = W + 96;
export const TRACK_OFFSET = 48;

/** A tiny seeded generator (mulberry32) so a stage's lanes are reproducible. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Each stage is a little faster and a little shorter on the clock. */
export function paceForStage(stage) {
  const s = Math.max(0, stage | 0);
  return { speed: 1 + 0.12 * s, timer: Math.max(18, 30 - 2 * s), stage: s };
}

/** Build the lanes for `stage` from `seed`. Every lane alternates direction after the first stage. */
export function buildLanes(stage = 0, seed = 1) {
  const r = rng((seed * 7919 + stage * 104729) >>> 0);
  const flip = stage % 2 === 1 ? -1 : 1;
  return LANE_ROWS.map((row) => {
    const spec = LANE_SPECS[row];
    const kind = VEHICLES[spec.kind];
    const spacing = PERIOD / spec.slots;
    const vehicles = [];
    for (let i = 0; i < spec.slots; i += 1) {
      const jitter = (r() - 0.5) * Math.max(0, spacing - kind.w - 36) * 0.6;
      vehicles.push({ slot: i, x: (i * spacing + spacing / 2 + jitter + PERIOD) % PERIOD, w: kind.w, h: kind.h, active: true, kind: kind.id, variant: Math.floor(r() * 3) });
    }
    return { row, kind: kind.id, dir: spec.dir * flip, speed: spec.speed, slots: spec.slots, name: spec.name, vehicles };
  });
}

/** Screen x of a vehicle's left edge from its track position. */
export function screenX(v) {
  return v.x - TRACK_OFFSET;
}
export function onScreen(v) {
  const x = screenX(v);
  return x + v.w > 0 && x < W;
}

/**
 * Advance every lane by `dt` seconds. `traffic.speed` scales all lanes (pace
 * times mood); `traffic.density` in 0..1 is the share of slots that should be
 * active. Slots only switch while they are off screen, so nothing pops.
 */
export function stepLanes(lanes, dt, traffic = {}) {
  const speed = Number.isFinite(traffic.speed) ? traffic.speed : 1;
  const density = Number.isFinite(traffic.density) ? Math.min(1, Math.max(0, traffic.density)) : 1;
  for (const lane of lanes) {
    const want = Math.max(1, Math.round(lane.slots * density));
    for (const v of lane.vehicles) {
      v.x = (((v.x + lane.dir * lane.speed * speed * dt) % PERIOD) + PERIOD) % PERIOD;
    }
    const activeCount = lane.vehicles.filter((v) => v.active).length;
    if (activeCount > want) {
      for (const v of lane.vehicles) { if (v.active && !onScreen(v) && lane.vehicles.filter((x) => x.active).length > want) v.active = false; }
    } else if (activeCount < want) {
      for (const v of lane.vehicles) { if (!v.active && !onScreen(v) && lane.vehicles.filter((x) => x.active).length < want) v.active = true; }
    }
  }
  return lanes;
}

/** The lane at `row`, or null for a safe row. */
export function laneAt(lanes, row) {
  return lanes.find((l) => l.row === row) || null;
}

/** Every active vehicle whose hit box overlaps [x0, x1) in this lane. Vehicles are tall enough to fill the lane. */
export function vehiclesOverlapping(lane, x0, x1) {
  const out = [];
  if (!lane) return out;
  for (const v of lane.vehicles) {
    if (!v.active) continue;
    const vx = screenX(v);
    // The track wraps, so a vehicle near the seam also exists one period away.
    for (const ox of [0, -PERIOD, PERIOD]) {
      const a = vx + ox, b = a + v.w;
      if (b > x0 && a < x1) { out.push(v); break; }
    }
  }
  return out;
}
