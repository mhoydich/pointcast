/**
 * Morning Route sprites and colors: every figure on the street is a short
 * list of plain rects, and every color comes from the two machine palettes
 * in src/lib/breakwater/waves.mjs. Original art, drawn for this game; no
 * Paperboy characters, names or graphics.
 *
 * A sprite is { w, h, rects: [[x, y, w, h, key]] } with (0, 0) at its top-left
 * on screen. `key` names a color in paletteFor(machine). The page and
 * scripts/generate-morning-route-og.mjs both draw from these tables.
 */
import { MACHINES } from '../breakwater/waves.mjs';

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = (c) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;

/** Blend two #rrggbb colors: t = 0 gives a, t = 1 gives b. */
export function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
}

function luminance(h) {
  return hex(h).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}

/** WCAG contrast ratio between two #rrggbb colors. */
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** The page chrome around the field, shared with the other cabinets. */
export const CHROME = Object.freeze({ bar: '#0b0d1a', button: '#15183a', buttonText: '#dfe3f5', buttonOff: '#9aa1cc', readout: '#7f86b5' });

/** Every named color the street uses, for one machine. */
export function paletteFor(machineId = 'xl') {
  const m = MACHINES[machineId] || MACHINES.xl;
  const night = '#000000';
  return {
    field: m.field,
    border: m.border,
    text: m.text,
    dim: m.dim,
    bright: m.bright,
    rider: m.paddle,
    road: mix(m.field, night, 0.32),
    gutter: mix(m.field, night, 0.5),
    lane: m.bands.yellow,
    curb: m.text,
    walk: mix(m.text, m.field, 0.45),
    joint: mix(m.text, m.field, 0.7),
    lawn: m.bands.green,
    lawnDark: mix(m.bands.green, m.field, 0.35),
    hedge: mix(m.bands.green, night, 0.35),
    drive: mix(m.text, m.field, 0.6),
    roofA: mix(m.bands.red, night, 0.25),
    roofB: mix(m.bands.orange, night, 0.3),
    roofC: mix(m.dim, night, 0.2),
    roofD: mix(m.bands.green, night, 0.45),
    wall: mix(m.text, m.bright, 0.4),
    wallDark: mix(m.dim, night, 0.35),
    lit: m.bands.yellow,
    unlit: mix(m.field, night, 0.55),
    porch: mix(m.bands.orange, m.bright, 0.25),
    porchDark: mix(m.dim, night, 0.45),
    paper: m.bright,
    ink: mix(m.field, night, 0.2),
    red: m.bands.red,
    orange: m.bands.orange,
    yellow: m.bands.yellow,
    green: m.bands.green,
    skin: mix(m.bands.orange, m.bright, 0.45),
    tire: '#111111',
    metal: mix(m.text, m.bright, 0.5),
    water: mix(m.raster[4] || m.text, m.bright, 0.35),
    car: m.bands.red,
    glass: mix(m.text, m.field, 0.25),
    dog: mix(m.bands.orange, m.bright, 0.15),
    dogDark: mix(m.bands.orange, night, 0.35),
    bin: mix(m.dim, m.bright, 0.15),
    binLid: mix(m.text, m.bright, 0.3),
    ramp: m.bands.yellow,
    rampEdge: m.bands.orange,
    panel: m.field,
    prompt: m.paddle,
  };
}

/** The colors in-field prompts sit on and are drawn in; tests hold them to 4.5:1. */
export function promptColors(machineId) {
  const p = paletteFor(machineId);
  return { panel: p.panel, text: p.bright, accent: p.prompt };
}

const S = (w, h, rects) => Object.freeze({ w, h, rects: Object.freeze(rects.map((r) => Object.freeze(r))) });

/** The rider from above, heading up the street: wheels, frame, a bag of papers, a cap. */
export const RIDER_SPRITE = S(10, 18, [
  [4, 0, 2, 4, 'tire'],
  [4, 14, 2, 4, 'tire'],
  [4, 4, 2, 10, 'metal'],
  [1, 4, 8, 2, 'metal'],
  [2, 7, 6, 6, 'rider'],
  [3, 6, 4, 3, 'skin'],
  [3, 5, 4, 2, 'red'],
  [7, 9, 3, 5, 'paper'],
  [7, 11, 3, 1, 'red'],
]);

/** A folded Morning Edition in flight. */
export const PAPER_SPRITE = S(6, 4, [[0, 0, 6, 4, 'paper'], [2, 0, 1, 4, 'ink'], [0, 3, 6, 1, 'walk']]);

export const BUNDLE_SPRITE = S(12, 8, [
  [0, 0, 12, 8, 'paper'], [0, 2, 12, 1, 'ink'], [0, 5, 12, 1, 'ink'], [5, 0, 2, 8, 'red'],
]);

export const BIN_SPRITE = S(8, 10, [[0, 2, 8, 8, 'bin'], [0, 0, 8, 3, 'binLid'], [3, 0, 2, 1, 'ink'], [1, 5, 1, 4, 'binLid'], [6, 5, 1, 4, 'binLid']]);

/** A friendly dog that has decided to sit right there. Two frames: tail left and tail right. */
export const DOG_SPRITES = Object.freeze([
  S(14, 12, [[3, 3, 7, 8, 'dog'], [4, 0, 5, 5, 'dog'], [3, 0, 2, 3, 'dogDark'], [8, 0, 2, 3, 'dogDark'], [5, 2, 1, 1, 'ink'], [7, 2, 1, 1, 'ink'], [6, 4, 1, 1, 'ink'], [0, 8, 3, 2, 'dogDark'], [4, 11, 2, 1, 'dogDark'], [7, 11, 2, 1, 'dogDark']]),
  S(14, 12, [[3, 3, 7, 8, 'dog'], [4, 0, 5, 5, 'dog'], [3, 0, 2, 3, 'dogDark'], [8, 0, 2, 3, 'dogDark'], [5, 2, 1, 1, 'ink'], [7, 2, 1, 1, 'ink'], [6, 4, 1, 1, 'ink'], [10, 8, 3, 2, 'dogDark'], [4, 11, 2, 1, 'dogDark'], [7, 11, 2, 1, 'dogDark']]),
]);

export const SPRINKLER_SPRITE = S(4, 4, [[0, 0, 4, 4, 'metal'], [1, 1, 2, 2, 'ink']]);

/** A skateboarder rolling down the road toward you. */
export const SKATER_SPRITE = S(8, 14, [[1, 0, 6, 14, 'ink'], [0, 1, 8, 1, 'tire'], [0, 12, 8, 1, 'tire'], [2, 4, 4, 6, 'green'], [2, 3, 4, 3, 'skin'], [1, 6, 1, 3, 'skin'], [6, 6, 1, 3, 'skin']]);

/** A car seen from above, nose to the right, backing out of its driveway. */
export const CAR_SPRITE = S(26, 14, [
  [0, 0, 26, 14, 'car'], [5, 2, 6, 10, 'glass'], [16, 2, 5, 10, 'glass'], [11, 2, 5, 10, 'car'],
  [2, -1, 5, 2, 'tire'], [19, -1, 5, 2, 'tire'], [2, 13, 5, 2, 'tire'], [19, 13, 5, 2, 'tire'],
  [0, 3, 1, 3, 'red'], [0, 8, 1, 3, 'red'], [25, 3, 1, 2, 'yellow'], [25, 9, 1, 2, 'yellow'],
]);

/** RUSH's ramp: plank stripes rising up the screen. */
export const RAMP_SPRITE = S(24, 16, [[0, 0, 24, 16, 'ramp'], [0, 0, 24, 2, 'rampEdge'], [0, 5, 24, 2, 'rampEdge'], [0, 10, 24, 2, 'rampEdge'], [0, 14, 24, 2, 'ink']]);

/** A curbside mailbox. `full` shows a paper in it and the flag down. */
export function mailboxSprite(full) {
  return S(8, 12, full
    ? [[3, 5, 2, 7, 'metal'], [0, 0, 8, 6, 'bin'], [1, 1, 6, 4, 'ink'], [1, 2, 6, 2, 'paper'], [7, 3, 1, 3, 'red']]
    : [[3, 5, 2, 7, 'metal'], [0, 0, 8, 6, 'bin'], [1, 1, 6, 4, 'ink'], [7, -2, 1, 5, 'red'], [7, -2, 2, 2, 'red']]);
}

/** Call `cb(x, y, w, h, color)` for every rect of `sprite` at (x, y), colors from `pal`. */
export function eachRect(sprite, x, y, pal, cb) {
  for (const [rx, ry, rw, rh, key] of sprite.rects) cb(x + rx, y + ry, rw, rh, pal[key] ?? key);
}
