#!/usr/bin/env node
/**
 * Kelp cover art: an SVG drawn from the game's own palette, grid and pixel
 * font, rasterized to a 1200x630 PNG with sharp (already an Astro dependency).
 *
 *   node scripts/generate-kelp-og.mjs
 *
 * Writes public/images/kelp/og.png and public/images/kelp/cover.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';
import { COLS, ROWS, rocksFor, cellKey } from '../src/lib/kelp/grid.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/kelp');
const W = 1200;
const H = 630;

function pixelText(text, x, y, scale, color) {
  const rects = [];
  eachPixel(text, x, y, scale, (px, py, s) => rects.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}" fill="${color}"/>`));
  return rects.join('');
}

/** A strand that winds through the nameplate stage toward a plankton, drawn once for the card. */
const STRAND = [
  [15, 29], [15, 28], [15, 27], [15, 26], [15, 25], [15, 24], [15, 23], [15, 22], [15, 21], [15, 20],
  [15, 19], [14, 19], [13, 19], [12, 19], [11, 19], [10, 19], [9, 19], [8, 19], [8, 20], [8, 21], [8, 22], [8, 23],
];
const PLANKTON = [4, 11];

export function coverSvg(machineId = 'xl') {
  const m = MACHINES[machineId];
  const other = MACHINES[machineId === 'xl' ? 'c64' : 'xl'];
  const cell = 15;
  const fieldX = 90;
  const fieldY = 40;
  const gridW = COLS * cell;
  const gridH = ROWS * cell;
  const fieldW = gridW + 36;
  const fieldH = gridH + 70;
  const gx = fieldX + 18;
  const gy = fieldY + 52;
  const rocks = rocksFor(3, machineId, 1);
  const strandSet = new Set(STRAND.map(([c, r]) => cellKey(c, r)));
  const rockRects = rocks.cells
    .filter(([c, r]) => !strandSet.has(cellKey(c, r)))
    .map(([c, r]) => `<rect x="${gx + c * cell}" y="${gy + r * cell}" width="${cell}" height="${cell}" fill="${m.dim}"/><rect x="${gx + c * cell}" y="${gy + r * cell}" width="${cell}" height="1.5" fill="${m.text}"/><rect x="${gx + c * cell}" y="${gy + r * cell}" width="1.5" height="${cell}" fill="${m.text}"/>`)
    .join('');
  const strandRects = STRAND.map(([c, r], i) => {
    const color = i === 0 ? m.bright : m.raster[i % m.raster.length];
    return `<rect x="${gx + c * cell}" y="${gy + r * cell}" width="${cell - 1.5}" height="${cell - 1.5}" fill="${color}"/>`;
  }).join('');
  const headX = gx + STRAND[0][0] * cell, headY = gy + STRAND[0][1] * cell;
  const eyes = `<rect x="${headX + 3}" y="${headY + 3}" width="3" height="3" fill="${m.field}"/><rect x="${headX + 9}" y="${headY + 3}" width="3" height="3" fill="${m.field}"/>`;
  const px = gx + PLANKTON[0] * cell, py = gy + PLANKTON[1] * cell;
  const plankton = `<rect x="${px + 4}" y="${py + 4}" width="7" height="7" fill="${m.bright}"/><rect x="${px + 6}" y="${py + 1}" width="3" height="1.5" fill="${m.bands.green}"/><rect x="${px + 6}" y="${py + 12.5}" width="3" height="1.5" fill="${m.bands.green}"/><rect x="${px + 1}" y="${py + 6}" width="1.5" height="3" fill="${m.bands.green}"/><rect x="${px + 12.5}" y="${py + 6}" width="1.5" height="3" fill="${m.bands.green}"/>`;
  const wall = `<rect x="${gx - 3}" y="${gy - 3}" width="${gridW + 6}" height="${gridH + 6}" fill="none" stroke="${m.text}" stroke-width="3"/>`;
  const rasterBars = m.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const right = 560;
  const soft = machineId === 'xl' ? '#a9b9f5' : '#ffffff';
  const dim = machineId === 'xl' ? '#6a7fd6' : '#dcd8ff';
  const title = 'KELP'.split('').map((ch, i) => pixelText(ch, right + i * 4 * 14, 78, 14, [m.bands.green, m.bands.yellow, m.bands.orange, m.bands.red][i])).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="${m.border === '#000000' ? '#0b0d1a' : m.border}"/>
  <rect x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" fill="${m.field}"/>
  ${pixelText('000640', fieldX + 18, fieldY + 14, 5, m.bright)}
  ${pixelText('FLOW', fieldX + fieldW - 18 - textWidth('FLOW', 4), fieldY + 16, 4, m.bands.yellow)}
  ${wall}
  ${rockRects}
  ${plankton}
  ${strandRects}
  ${eyes}
  ${title}
  ${pixelText('A SNAKE FOR THE', right, 170, 4, soft)}
  ${pixelText('8-BIT HEART', right, 200, 4, soft)}
  ${pixelText(`${m.name} / ${m.chip}`, right, 270, 3, m.bands.yellow)}
  ${pixelText(`${other.name} / ${other.chip}`, right, 296, 3, dim)}
  ${pixelText('MOOD  DAWN FLOW RUSH DRIFT', right, 350, 3, soft)}
  ${pixelText('SWIPE OR ARROWS', right, 404, 3, m.paddle)}
  ${pixelText('POINTCAST.XYZ/KELP', right, 470, 3, '#ffffff')}
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
