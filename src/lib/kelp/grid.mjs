/**
 * Kelp grid: the portrait field a snake game of 1982 would have run on.
 *
 * 24 columns by 32 rows of cells. The frame around the grid is the wall;
 * touching it ends a life. Rocks are the stage's obstacle pattern. Several
 * patterns are spelled with the 3x5 Breakwater font blown up three times,
 * the same trick Breakwater's nameplate wave uses, so the machine name and
 * the stage number become walls the strand has to swim around.
 *
 * The lower middle of the grid is the haven: no pattern ever places a rock
 * there, so a fresh strand always has room to start.
 *
 * Pure functions, no DOM. tests/kelp.test.mjs drives them.
 */
import { GLYPHS, GLYPH_W, GLYPH_H } from '../breakwater/font.mjs';
import { MACHINES } from '../breakwater/waves.mjs';

export const COLS = 24;
export const ROWS = 32;
export const START_LENGTH = 4;
export const MIN_START_LENGTH = 2;

export const DIRS = Object.freeze({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] });
export const DIR_IDS = Object.freeze(Object.keys(DIRS));
export const OPPOSITE = Object.freeze({ up: 'down', down: 'up', left: 'right', right: 'left' });

/** The strand's head starts here, body hanging below it, swimming up. */
export const START = Object.freeze({ c: 11, r: 22, dir: 'up' });
/** Rock-free rectangle around the start, inclusive. */
export const HAVEN = Object.freeze({ c0: 9, c1: 14, r0: 18, r1: 29 });

export const PATTERNS = Object.freeze(['open', 'posts', 'bars', 'nameplate', 'reef', 'gates', 'counter']);

export const cellKey = (c, r) => r * COLS + c;
export const inBounds = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS;
export const inHaven = (c, r) => c >= HAVEN.c0 && c <= HAVEN.c1 && r >= HAVEN.r0 && r <= HAVEN.r1;

/** Cells of `text` drawn from the 3x5 font at `scale`, top-left at (left, top). */
export function glyphCells(text, left, top, scale = 3) {
  const cells = [];
  const letters = String(text).toUpperCase().split('');
  letters.forEach((ch, i) => {
    const rows = GLYPHS[ch] || GLYPHS['?'];
    for (let r = 0; r < GLYPH_H; r += 1) {
      for (let c = 0; c < GLYPH_W; c += 1) {
        if (rows[r][c] !== '1') continue;
        for (let dy = 0; dy < scale; dy += 1) {
          for (let dx = 0; dx < scale; dx += 1) {
            cells.push([left + (i * (GLYPH_W + 1) + c) * scale + dx, top + r * scale + dy]);
          }
        }
      }
    }
  });
  return cells;
}

/** Width in cells of `text` at `scale`, one blank column between glyphs. */
export function glyphWidth(text, scale = 3) {
  const n = String(text).length;
  return n ? (n * (GLYPH_W + 1) - 1) * scale : 0;
}

function centeredGlyphs(text, top, scale = 3) {
  const left = Math.floor((COLS - glyphWidth(text, scale)) / 2);
  return glyphCells(text, left, top, scale);
}

/** A deterministic 0..1 value per cell, used to thin a pattern when the mood is low. */
export function cellRank(c, r) {
  return ((c * 73 + r * 151 + 17) % 97) / 97;
}

/** Which pattern stage `n` (0-based) uses. */
export function patternFor(n) {
  return PATTERNS[((n % PATTERNS.length) + PATTERNS.length) % PATTERNS.length];
}

/** The full rock list of a pattern before thinning. */
export function patternCells(n, machineId = 'xl') {
  const pattern = patternFor(n);
  let cells = [];
  if (pattern === 'posts') {
    for (const [pc, pr] of [[5, 7], [17, 7], [5, 21], [17, 21]]) {
      for (let dy = 0; dy < 2; dy += 1) for (let dx = 0; dx < 2; dx += 1) cells.push([pc + dx, pr + dy]);
    }
  } else if (pattern === 'bars') {
    for (const r of [10, 21]) for (let c = 3; c <= 20; c += 1) if (c < 9 || c > 14) cells.push([c, r]);
  } else if (pattern === 'nameplate') {
    cells = centeredGlyphs(MACHINES[machineId]?.short ?? 'XL', 3, 3);
  } else if (pattern === 'reef') {
    for (let r = 2; r < ROWS - 2; r += 4) {
      for (let c = 1; c < COLS - 1; c += 1) if ((c + r) % 6 < 2) cells.push([c, r]);
    }
  } else if (pattern === 'gates') {
    for (const c of [6, 17]) {
      for (let r = 3; r <= 28; r += 1) {
        if ((r >= 9 && r <= 12) || (r >= 19 && r <= 22)) continue;
        cells.push([c, r]);
      }
    }
    for (let c = 9; c <= 14; c += 1) cells.push([c, 8]);
  } else if (pattern === 'counter') {
    cells = centeredGlyphs(String(n + 1).padStart(2, '0'), 3, 3);
  }
  const seen = new Set();
  const out = [];
  for (const [c, r] of cells) {
    if (!inBounds(c, r) || inHaven(c, r)) continue;
    const k = cellKey(c, r);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push([c, r]);
  }
  return { pattern, cells: openPockets(out) };
}

/**
 * Glyphs like 6, 8, 0 and A enclose water. A snake must be able to reach
 * every cell, so each pocket gets a one-cell doorway cut straight down
 * through the stroke below it, the way a stencil font is cut.
 */
export function openPockets(cells) {
  const set = new Set(cells.map(([c, r]) => cellKey(c, r)));
  for (let guard = 0; guard < 16; guard += 1) {
    const water = reachable(set);
    const pocket = [];
    for (let r = 0; r < ROWS; r += 1) for (let c = 0; c < COLS; c += 1) {
      const k = cellKey(c, r);
      if (!set.has(k) && !water.has(k)) pocket.push([c, r]);
    }
    if (!pocket.length) break;
    // One pocket at a time: the first cell found and everything connected to it.
    const inside = reachable(set, pocket[0][0], pocket[0][1]);
    let bottom = -1, col = 0, count = 0;
    for (const k of inside) {
      const r = Math.floor(k / COLS), c = k % COLS;
      if (r > bottom) { bottom = r; col = c; count = 1; } else if (r === bottom) { col += c; count += 1; }
    }
    col = Math.round(col / count);
    for (let r = bottom + 1; r < ROWS; r += 1) {
      const k = cellKey(col, r);
      if (!set.has(k)) break;
      set.delete(k);
    }
  }
  return cells.filter(([c, r]) => set.has(cellKey(c, r)));
}

/**
 * Rocks for stage `n`. `density` 0..1 comes from the mood response: at 1 the
 * whole pattern stands, lower values dither rocks away. Dithering a thick
 * glyph stroke can leave a lone open cell with rock on all four sides, which
 * plankton could land in and never be reached; any such sealed cell stays
 * rock. So every open cell is reachable at any density, and a thinned
 * pattern is always a subset of the full one.
 */
export function rocksFor(n, machineId = 'xl', density = 1) {
  const { pattern, cells } = patternCells(n, machineId);
  const keep = 0.55 + 0.45 * Math.min(1, Math.max(0, density));
  const set = new Set(cells.filter(([c, r]) => cellRank(c, r) <= keep).map(([c, r]) => cellKey(c, r)));
  const water = reachable(set);
  for (const [c, r] of cells) { const k = cellKey(c, r); if (!set.has(k) && !water.has(k)) set.add(k); }
  const kept = cells.filter(([c, r]) => set.has(cellKey(c, r)));
  return { index: n, pattern, cells: kept, set, total: cells.length };
}

/** Every cell reachable from (c, r) stepping through non-rock cells. */
export function reachable(rocks, c = START.c, r = START.r) {
  const seen = new Set([cellKey(c, r)]);
  const stack = [[c, r]];
  while (stack.length) {
    const [x, y] = stack.pop();
    for (const id of DIR_IDS) {
      const nx = x + DIRS[id][0], ny = y + DIRS[id][1];
      if (!inBounds(nx, ny)) continue;
      const k = cellKey(nx, ny);
      if (seen.has(k) || rocks.has(k)) continue;
      seen.add(k);
      stack.push([nx, ny]);
    }
  }
  return seen;
}
