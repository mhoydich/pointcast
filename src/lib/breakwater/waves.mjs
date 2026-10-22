/**
 * Breakwater wall patterns, scoring bands and the two machine palettes.
 *
 * Geometry follows the 1976 arcade Breakout: 14 columns, 8 rows, two rows
 * each of red (7 points), orange (5), green (3) and yellow (1), top to bottom.
 * The palettes are tributes: the Atari 800XL's Graphics 0 blue field with a
 * black border and light-blue text, and the Commodore 64's blue field inside
 * a light-blue border. Values are chosen to read on a modern screen, not to
 * match one chip's output exactly.
 */
import { GLYPHS, GLYPH_W, GLYPH_H } from './font.mjs';

export const COLS = 14;
export const ROWS = 8;
export const ROW_BAND = Object.freeze(['red', 'red', 'orange', 'orange', 'green', 'green', 'yellow', 'yellow']);
export const BAND_POINTS = Object.freeze({ red: 7, orange: 5, green: 3, yellow: 1 });

export const MACHINES = Object.freeze({
  xl: Object.freeze({
    id: 'xl',
    name: 'ATARI 800XL',
    short: 'XL',
    label: '800XL',
    year: 1983,
    chip: 'POKEY',
    prompt: 'READY',
    field: '#2545a8',
    border: '#000000',
    text: '#a9b9f5',
    dim: '#6a7fd6',
    bright: '#ffffff',
    paddle: '#f4d27a',
    ball: '#ffffff',
    bands: Object.freeze({ red: '#d84a3a', orange: '#e7893a', green: '#67b24a', yellow: '#efd25a' }),
    raster: Object.freeze(['#d84a3a', '#e7893a', '#efd25a', '#67b24a', '#3aa0c8', '#6b5ad8', '#b85ab0']),
  }),
  c64: Object.freeze({
    id: 'c64',
    name: 'COMMODORE 64',
    short: '64',
    label: 'C64',
    year: 1982,
    chip: 'SID',
    prompt: 'READY.',
    field: '#3e31a2',
    border: '#7c70da',
    text: '#7c70da',
    dim: '#5e55c4',
    bright: '#ffffff',
    paddle: '#75cec8',
    ball: '#ffffff',
    bands: Object.freeze({ red: '#c46c71', orange: '#dd8855', green: '#a9ff9f', yellow: '#edf171' }),
    raster: Object.freeze(['#813338', '#c46c71', '#edf171', '#a9ff9f', '#75cec8', '#7c70da', '#8e3c97']),
  }),
});

export const MACHINE_IDS = Object.freeze(Object.keys(MACHINES));

export const PATTERNS = Object.freeze(['wall', 'checker', 'pyramid', 'gates', 'nameplate', 'surf']);

function nameplateCells(short) {
  const cells = new Set();
  const letters = short.toUpperCase().split('');
  const width = letters.length * (GLYPH_W + 1) - 1;
  const left = Math.floor((COLS - width) / 2);
  letters.forEach((ch, i) => {
    const rows = GLYPHS[ch] || GLYPHS['?'];
    for (let r = 0; r < GLYPH_H; r += 1) {
      for (let c = 0; c < GLYPH_W; c += 1) {
        if (rows[r][c] === '1') cells.add(`${left + i * (GLYPH_W + 1) + c},${r + 1}`);
      }
    }
  });
  for (let c = 0; c < COLS; c += 1) { cells.add(`${c},0`); cells.add(`${c},7`); }
  return cells;
}

/** Which cells of the 14x8 grid hold a brick for wave `n` on `machineId`. */
export function patternCells(n, machineId = 'xl') {
  const pattern = PATTERNS[((n % PATTERNS.length) + PATTERNS.length) % PATTERNS.length];
  const cells = [];
  const nameplate = pattern === 'nameplate' ? nameplateCells(MACHINES[machineId]?.short ?? 'XL') : null;
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      let on = true;
      if (pattern === 'checker') on = (c + r) % 2 === 0;
      else if (pattern === 'pyramid') on = Math.abs(c - 6.5) <= r * 0.95 + 0.6;
      else if (pattern === 'gates') on = !((c === 3 || c === 4 || c === 9 || c === 10) && r >= 2 && r <= 5);
      else if (pattern === 'nameplate') on = nameplate.has(`${c},${r}`);
      else if (pattern === 'surf') {
        const height = 4 + Math.round(2.2 * Math.sin((c / COLS) * Math.PI * 2 * 1.5 + n));
        on = r >= ROWS - height;
      }
      if (on) cells.push([c, r]);
    }
  }
  return { pattern, cells };
}

/** Build the brick list for wave `n` (0-based). */
export function buildWave(n, machineId = 'xl') {
  const { pattern, cells } = patternCells(n, machineId);
  const bricks = cells.map(([c, r]) => ({ c, r, band: ROW_BAND[r], points: BAND_POINTS[ROW_BAND[r]], alive: true }));
  return { index: n, pattern, bricks, total: bricks.length, points: bricks.reduce((sum, b) => sum + b.points, 0) };
}

/** Speed step rule from the arcade: faster after the 4th and 12th hit, and on first orange/red contact. */
export function speedStepsFor(hits, touchedOrange, touchedRed) {
  let steps = 0;
  if (hits >= 4) steps += 1;
  if (hits >= 12) steps += 1;
  if (touchedOrange) steps += 1;
  if (touchedRed) steps += 1;
  return steps;
}
