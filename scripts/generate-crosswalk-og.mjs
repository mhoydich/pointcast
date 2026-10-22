#!/usr/bin/env node
/**
 * Crosswalk cover art: an SVG drawn from the game's own palette, sprites and
 * pixel font, rasterized to a 1200x630 PNG with sharp (an Astro dependency).
 *
 *   node scripts/generate-crosswalk-og.mjs
 *
 * Writes public/images/crosswalk/og.png and public/images/crosswalk/cover.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';
import { ROW_KINDS, TOWER_COLS, CELL, LANE_SPECS } from '../src/lib/crosswalk/field.mjs';
import { eachSpriteCell } from '../src/lib/crosswalk/sprites.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/crosswalk');
const W = 1200;
const H = 630;

/** Merge horizontal runs of same-colored cells into one rect each, so the SVG stays small. */
function runs(cells) {
  const byRow = new Map();
  for (const [x, y, s, fill] of cells) { const k = `${y}|${s}|${fill}`; if (!byRow.has(k)) byRow.set(k, []); byRow.get(k).push(x); }
  const out = [];
  for (const [k, xs] of byRow) {
    const [y, s, fill] = k.split('|');
    xs.sort((a, b) => a - b);
    let start = xs[0], prev = xs[0];
    const flush = () => out.push(`<rect x="${start}" y="${y}" width="${prev - start + Number(s)}" height="${s}" fill="${fill}"/>`);
    for (let i = 1; i < xs.length; i += 1) { if (xs[i] - prev > Number(s) + 1e-9) { flush(); start = xs[i]; } prev = xs[i]; }
    flush();
  }
  return out.join('');
}

function pixelText(text, x, y, scale, color) {
  const cells = [];
  eachPixel(text, Math.round(x), Math.round(y), scale, (px, py, s) => cells.push([px, py, s, color]));
  return runs(cells);
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `#${[0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join('')}`; };

function spriteSvg(name, x, y, scale, pal, opts, variant = 0) {
  const cells = [];
  eachSpriteCell(name, Math.round(x), Math.round(y), scale, (px, py, s, key) => {
    const fill = key === 'B' && variant === 1 ? pal.Y : key === 'B' && variant === 2 ? pal.R : pal[key] || '#ffffff';
    cells.push([px, py, s, fill]);
  }, opts);
  return runs(cells);
}

export function coverSvg(machineId = 'xl') {
  const m = MACHINES[machineId];
  const other = MACHINES[machineId === 'xl' ? 'c64' : 'xl'];
  const pal = {
    S: m.bands.orange, H: m.bands.red, T: m.paddle, K: m.border === '#000000' ? '#0b0d1a' : mix(m.border, '#000000', 0.7), W: m.bright, B: m.bands.green, G: m.text, R: m.bands.red, Y: m.bands.yellow, O: m.bands.orange, L: m.bands.green, D: m.bands.red,
    asphalt: mix(m.field, '#000000', 0.55), sidewalk: mix('#ffffff', m.field, 0.68), median: mix(m.bands.green, m.field, 0.55), path: mix(m.bands.green, m.field, 0.38), sand: mix(m.bands.yellow, m.field, 0.3),
  };
  // The field: the 288-wide strip scaled by 1.5 (432 wide); sprites use a whole 4 px cell so edges stay crisp.
  const sc = 1.5, sp = 4;
  const fieldX = 60, fieldY = 30;
  const rowH = (r) => (r === 0 ? 40 : 28) * sc;
  let y = fieldY + 30 * sc;
  const rows = [];
  const fieldTop = y;
  for (let r = 0; r < ROW_KINDS.length; r += 1) {
    const kind = ROW_KINDS[r];
    const fill = kind === 'water' ? m.field : kind === 'sand' ? pal.sand : kind === 'median' ? pal.median : kind === 'sidewalk' ? pal.sidewalk : r <= 3 ? pal.path : pal.asphalt;
    rows.push({ r, kind, y, h: rowH(r), fill });
    y += rowH(r);
  }
  const fieldH = y - fieldY + 10 * sc;
  const fieldW = 288 * sc;
  const parts = [];
  parts.push(`<rect x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" fill="${m.field}"/>`);
  for (const row of rows) parts.push(`<rect x="${fieldX}" y="${row.y}" width="${fieldW}" height="${row.h}" fill="${row.fill}"/>`);
  const water = rows[0];
  for (let i = 0; i < 4; i += 1) for (let x = 0; x < fieldW; x += 16 * sc) parts.push(`<rect x="${fieldX + x + (i % 2) * 8 * sc}" y="${water.y + (6 + i * 9) * sc}" width="${6 * sc}" height="${sc}" fill="${m.text}" opacity="0.45"/>`);
  TOWER_COLS.forEach((c, i) => parts.push(spriteSvg(i === 1 ? 'towerHome' : 'tower', fieldX + c * CELL * sc + 2, water.y + 8 * sc, sp, pal)));
  const median = rows[4];
  for (let i = 0; i < 3; i += 1) parts.push(spriteSvg('palm', fieldX + (32 + i * 96) * sc, median.y + 2 * sc + 2, sp, pal));
  // Vehicles, one picture of the street in motion.
  const placements = { 2: [20, 150, 240], 3: [70, 200], 5: [110, 250], 6: [40, 190], 7: [10, 90, 170, 250], 8: [60, 160, 230], 9: [30, 140, 220] };
  for (const [rowIdx, xs] of Object.entries(placements)) {
    const spec = LANE_SPECS[rowIdx];
    const row = rows[Number(rowIdx)];
    xs.forEach((x, i) => {
      const flip = spec.dir < 0;
      const name = spec.kind === 'bus' ? 'bus' : spec.kind === 'car' ? 'car' : spec.kind === 'bike' ? 'bike' : 'skate';
      const yy = name === 'bus' || name === 'car' ? row.y + row.h - 8 * sp - 2 : row.y + 5;
      parts.push(spriteSvg(name, fieldX + x * sc, yy, sp, pal, { flip }, i % 3));
    });
  }
  // The beach-goer, one hop up from the sidewalk, and the clock.
  const sidewalk = rows[ROW_KINDS.length - 1];
  parts.push(spriteSvg('walkerHop', fieldX + 5 * CELL * sc + 2, rows[9].y + 5, sp, pal));
  parts.push(spriteSvg('ball', fieldX + 9 * CELL * sc + 2, rows[1].y + 5, sp, pal));
  parts.push(pixelText('000620', fieldX + 10 * sc, fieldY + 8 * sc, 4, m.bright));
  parts.push(pixelText('FLOW', fieldX + fieldW / 2 + 10 * sc - textWidth('FLOW', 3) / 2, fieldY + 11 * sc, 3, m.bands.yellow));
  for (let i = 0; i < 3; i += 1) { parts.push(`<rect x="${fieldX + fieldW - (10 + (i + 1) * 8) * sc}" y="${fieldY + 10 * sc}" width="${4 * sc}" height="${3 * sc}" fill="${m.bands.red}"/>`); parts.push(`<rect x="${fieldX + fieldW - (10 + (i + 1) * 8) * sc}" y="${fieldY + 13 * sc}" width="${4 * sc}" height="${3 * sc}" fill="${m.paddle}"/>`); }
  const clockY = fieldY + fieldH - 10 * sc - 8 * sc;
  parts.push(`<rect x="${fieldX + 10 * sc}" y="${clockY}" width="${(288 - 64) * sc}" height="${8 * sc}" fill="${m.dim}"/>`);
  parts.push(`<rect x="${fieldX + 10 * sc}" y="${clockY}" width="${Math.round((288 - 64) * sc * 0.7)}" height="${8 * sc}" fill="${m.bands.green}"/>`);
  parts.push(pixelText('TIME', fieldX + fieldW - 10 * sc - textWidth('TIME', 3), clockY - 2, 3, m.text));
  void sidewalk; void fieldTop;

  const rasterBars = m.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const right = 560;
  const light = machineId === 'xl' ? '#a9b9f5' : '#ffffff';
  const dim = machineId === 'xl' ? '#6a7fd6' : '#dcd8ff';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="${m.border === '#000000' ? '#0b0d1a' : m.border}"/>
  ${parts.join('\n  ')}
  ${pixelText('CROSSWALK', right, 92, 9, '#ffffff')}
  ${pixelText('FIVE LANES', right, 170, 4, light)}
  ${pixelText('TO THE SAND', right, 200, 4, light)}
  ${pixelText(`${m.name} / ${m.chip}`, right, 270, 3, m.bands.yellow)}
  ${pixelText(`${other.name} / ${other.chip}`, right, 296, 3, dim)}
  ${pixelText('MOOD  DAWN FLOW RUSH DRIFT', right, 350, 3, light)}
  ${pixelText('SWIPE OR ARROWS TO HOP', right, 404, 3, m.paddle)}
  ${pixelText('POINTCAST.XYZ/CROSSWALK', right, 470, 3, '#ffffff')}
  ${pixelText('DIRECTED BY MICHAEL HOYDICH', right, 496, 3, dim)}
  ${rasterBars}
</svg>`;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const svg = coverSvg('xl');
  await fs.writeFile(path.join(OUT, 'cover.svg'), svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'og.png'));
  const c64 = coverSvg('c64');
  await fs.writeFile(path.join(OUT, 'cover-c64.svg'), c64);
  console.log('wrote', path.relative(process.cwd(), OUT));
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) await main();
