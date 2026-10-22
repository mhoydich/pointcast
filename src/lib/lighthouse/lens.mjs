/**
 * Lighthouse lens: the four lamps, their tones and the round lens geometry.
 *
 * Simon (Milton Bradley, 1978; Ralph Baer and Howard Morrison) sounded four
 * tones that together form an A major chord: E, C sharp, A and the E an
 * octave below. Lighthouse turns Simon's quadrants a quarter turn so the
 * lamps sit at the four compass points of a lighthouse lens, which lets the
 * arrow keys (and W A S D, and 1 to 4 clockwise from north) name them
 * directly. Colors come from the machine palette's four bands in
 * src/lib/breakwater/waves.mjs.
 *
 * Pure functions, no DOM, so tests/lighthouse.test.mjs can drive them.
 */

/** Clockwise from north. `midi` 52 = E3, 57 = A3, 61 = C#4, 64 = E4: the chord rises as the light turns. */
export const LAMPS = Object.freeze([
  Object.freeze({ id: 'north', name: 'NORTH', band: 'green', midi: 52, note: 'E', arrow: 'ArrowUp', letter: 'KeyW', digit: 'Digit1' }),
  Object.freeze({ id: 'east', name: 'EAST', band: 'red', midi: 57, note: 'A', arrow: 'ArrowRight', letter: 'KeyD', digit: 'Digit2' }),
  Object.freeze({ id: 'south', name: 'SOUTH', band: 'yellow', midi: 61, note: 'C#', arrow: 'ArrowDown', letter: 'KeyS', digit: 'Digit3' }),
  Object.freeze({ id: 'west', name: 'WEST', band: 'orange', midi: 64, note: 'E', arrow: 'ArrowLeft', letter: 'KeyA', digit: 'Digit4' }),
]);

/** Spoken color names for the live region, by band. */
export const BAND_NAMES = Object.freeze({ red: 'red', orange: 'orange', green: 'green', yellow: 'yellow' });

export const midiToHz = (n) => 440 * Math.pow(2, (n - 69) / 12);

/** Which lamp a keyboard `code` names, or -1. Numpad digits count too. */
export function lampForKey(code) {
  for (let i = 0; i < LAMPS.length; i += 1) {
    const l = LAMPS[i];
    if (code === l.arrow || code === l.letter || code === l.digit || code === `Numpad${i + 1}`) return i;
  }
  return -1;
}

/**
 * Where the lens sits in a field `w` wide and `h` tall with a HUD of `hud`
 * pixels on top. The lens keeps its size and centers in the space between
 * the HUD and the prompt line, so a tall phone gets sky above and sea below.
 */
export function lensGeometry(w = 288, h = 384, hud = 32) {
  const rOuter = Math.min(116, Math.floor((w - 40) / 2));
  const rInner = 38;
  const cx = Math.round(w / 2);
  const cy = Math.round(hud + (h - hud - 40) / 2 + 4);
  return { cx, cy, rOuter, rInner, gap: 6, w, h };
}

/** Lamp under a field point, or -1. A little slack past the rim makes the lamps forgiving to a thumb. */
export function lampAt(x, y, geo, slack = 16) {
  const dx = x - geo.cx;
  const dy = y - geo.cy;
  const d = Math.hypot(dx, dy);
  if (d > geo.rOuter + slack || d < geo.rInner * 0.75) return -1;
  if (Math.abs(dy) >= Math.abs(dx)) return dy < 0 ? 0 : 2;
  return dx > 0 ? 1 : 3;
}

/**
 * The lens as chunky cells, the way an 8-bit machine would draw a circle.
 * Each cell carries its lamp and its prism ring, so the page can shade
 * alternate rings like the glass of a Fresnel lens. Cells within `gap` of
 * the two diagonals are left dark: those are the brass frame.
 */
export function lensCells(geo, cell = 4) {
  const out = [];
  const { cx, cy, rOuter, rInner, gap } = geo;
  const r0 = rInner + gap;
  for (let y = cy - rOuter; y < cy + rOuter; y += cell) {
    for (let x = cx - rOuter; x < cx + rOuter; x += cell) {
      const dx = x + cell / 2 - cx;
      const dy = y + cell / 2 - cy;
      const d = Math.hypot(dx, dy);
      if (d > rOuter || d < r0) continue;
      if (Math.abs(Math.abs(dx) - Math.abs(dy)) / Math.SQRT2 < gap / 2) continue;
      const lamp = Math.abs(dy) >= Math.abs(dx) ? (dy < 0 ? 0 : 2) : (dx > 0 ? 1 : 3);
      out.push({ x, y, lamp, ring: Math.floor((d - r0) / 12) });
    }
  }
  return out;
}

/** The hub: the lantern in the middle of the lens, as cells. */
export function hubCells(geo, cell = 4) {
  const out = [];
  const r = geo.rInner - 2;
  for (let y = geo.cy - r; y < geo.cy + r; y += cell) {
    for (let x = geo.cx - r; x < geo.cx + r; x += cell) {
      if (Math.hypot(x + cell / 2 - geo.cx, y + cell / 2 - geo.cy) <= r) out.push({ x, y });
    }
  }
  return out;
}
