#!/usr/bin/env node
/**
 * Low Tide cover art: an SVG drawn from the game's own palette, pixel font
 * and sprites, rasterized to a 1200x630 PNG with sharp (already an Astro
 * dependency).
 *
 *   node scripts/generate-low-tide-og.mjs
 *
 * Writes public/images/low-tide/og.png and public/images/low-tide/cover.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';
import { GULL, SHELL } from '../src/lib/low-tide/tide.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/low-tide');
const W = 1200;
const H = 630;

const mix = (a, b, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');

function pixelText(text, x, y, scale, color) {
  const rects = [];
  eachPixel(text, x, y, scale, (px, py, s) => rects.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}" fill="${color}"/>`));
  return rects.join('');
}

function sprite(rows, x, y, scale, color, opacity = 1) {
  const rects = [];
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c += 1) if (row[c] === '1') rects.push(`<rect x="${x + c * scale}" y="${y + r * scale}" width="${scale}" height="${scale}" fill="${color}"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`);
  });
  return rects.join('');
}

export function coverSvg(machineId = 'xl') {
  const m = MACHINES[machineId];
  const other = MACHINES[machineId === 'xl' ? 'c64' : 'xl'];
  const soft = machineId === 'xl' ? '#a9b9f5' : '#ffffff';
  const fieldX = 80;
  const fieldY = 60;
  const fieldW = 540;
  const fieldH = 510;
  const s = 4;
  const sandY = fieldY + fieldH - 70;
  const waterY = sandY + 28;
  const bucketX = fieldX + 180;
  const bucketW = 120;
  const shells = [
    [fieldX + 120, fieldY + 150, m.bands.orange],
    [fieldX + 330, fieldY + 230, m.bands.orange],
    [bucketX + 46, sandY - 158, m.bands.yellow],
    [fieldX + 290, fieldY + 92, m.bands.orange],
  ].map(([x, y, c]) => sprite(SHELL, x, y, s, c)).join('');
  const buckets = [0, 1, 2].map((i) => {
    const y = sandY - 120 + i * 40;
    return `<rect x="${bucketX}" y="${y}" width="${bucketW}" height="28" fill="${m.paddle}"/><rect x="${bucketX}" y="${y}" width="${bucketW}" height="4" fill="#ffffff"/>`;
  }).join('');
  const ripples = [0, 1, 2].map((r) => Array.from({ length: 11 }, (_, i) => `<rect x="${fieldX + 10 + i * 46 + r * 18}" y="${waterY + 8 + r * 14}" width="${24 - r * 4}" height="4" fill="${r ? m.raster[4] : '#ffffff'}" opacity="0.7"/>`).join('')).join('');
  const rasterBars = m.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const right = 690;
  const sparks = [[bucketX + 14, sandY - 140], [bucketX + 92, sandY - 146], [bucketX + 104, sandY - 134]].map(([x, y]) => `<rect x="${x}" y="${y}" width="8" height="8" fill="${m.raster[4]}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="${m.border === '#000000' ? '#0b0d1a' : m.border}"/>
  <rect x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" fill="${m.field}"/>
  ${pixelText('000245', fieldX + 18, fieldY + 18, 6, m.bright)}
  ${pixelText('FLOW', fieldX + fieldW - 18 - textWidth('FLOW', 4), fieldY + 22, 4, m.bands.yellow)}
  ${sprite(GULL[0], fieldX + 250, fieldY + 60, 5, m.bright)}
  ${shells}
  ${sparks}
  ${buckets}
  <rect x="${fieldX}" y="${sandY}" width="${fieldW}" height="${fieldY + fieldH - sandY}" fill="${mix(m.bands.yellow, m.field, 0.3)}"/>
  <rect x="${fieldX}" y="${waterY}" width="${fieldW}" height="${fieldY + fieldH - waterY}" fill="${mix(m.field, '#000000', 0.3)}"/>
  ${ripples}
  ${pixelText('LOW TIDE', right, 92, 10, '#ffffff')}
  ${pixelText('CATCH WHAT THE', right, 170, 4, soft)}
  ${pixelText('GULL DROPS', right, 200, 4, soft)}
  ${pixelText(`${m.name} / ${m.chip}`, right, 270, 3, m.bands.yellow)}
  ${pixelText(`${other.name} / ${other.chip}`, right, 296, 3, machineId === 'xl' ? '#6a7fd6' : '#dcd8ff')}
  ${pixelText('MOOD  DAWN FLOW RUSH DRIFT', right, 350, 3, soft)}
  ${pixelText('DRAG, TAP OR PRESS SPACE', right, 404, 3, m.paddle)}
  ${pixelText('POINTCAST.XYZ/LOW-TIDE', right, 470, 3, '#ffffff')}
  ${pixelText('DIRECTED BY MICHAEL HOYDICH', right, 496, 3, machineId === 'xl' ? '#6a7fd6' : '#dcd8ff')}
  ${rasterBars}
</svg>`;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const svg = coverSvg('xl');
  await fs.writeFile(path.join(OUT, 'cover.svg'), svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'og.png'));
  console.log('wrote', path.relative(process.cwd(), OUT));
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) await main();
