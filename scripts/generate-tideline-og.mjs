#!/usr/bin/env node
/**
 * Tideline cover art: an SVG drawn from the game's own palette and pixel
 * font, rasterized to a 1200x630 PNG with sharp (already an Astro dependency).
 *
 *   node scripts/generate-tideline-og.mjs
 *
 * Writes public/images/tideline/og.png and public/images/tideline/cover.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/tideline');
const W = 1200;
const H = 630;

function pixelText(text, x, y, scale, color) {
  const rects = [];
  eachPixel(text, x, y, scale, (px, py, s) => rects.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}" fill="${color}"/>`));
  return rects.join('');
}

export function coverSvg(machineId = 'xl') {
  const m = MACHINES[machineId];
  const other = MACHINES[machineId === 'xl' ? 'c64' : 'xl'];
  const soft = machineId === 'xl' ? '#a9b9f5' : '#ffffff';
  const dim = machineId === 'xl' ? '#6a7fd6' : '#dcd8ff';
  // A portrait field on the left, the way the phone shows it.
  const fieldX = 110;
  const fieldY = 40;
  const fieldW = 420;
  const fieldH = 550;
  const px = 5; // one logical pixel
  const cx = fieldX + fieldW / 2;
  // Score digits, 2600 style, big, one a side.
  const digits = `${pixelText('07', fieldX + 28, fieldY + 22, 11, m.bright)}${pixelText('05', fieldX + fieldW - 28 - textWidth('05', 11), fieldY + 22, 11, m.bright)}`;
  // Net: a dashed line across the middle.
  const netY = fieldY + Math.round(fieldH * 0.52);
  let net = '';
  for (let x = fieldX + 16; x < fieldX + fieldW - 16; x += 24) net += `<rect x="${x}" y="${netY}" width="12" height="${px}" fill="${m.dim}"/>`;
  const houseW = 150, houseX = cx - 40, houseY = fieldY + 118;
  const youW = 150, youX = cx + 10, youY = fieldY + fieldH - 72;
  const ballX = cx + 48, ballY = fieldY + 300;
  const trail = [0.45, 0.3, 0.18, 0.1].map((a, i) => `<rect x="${ballX + (i + 1) * 9}" y="${ballY - (i + 1) * 13}" width="18" height="18" fill="${m.ball}" opacity="${a}"/>`).join('');
  const rasterBars = m.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const right = 600;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="${m.border === '#000000' ? '#0b0d1a' : m.border}"/>
  <rect x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" fill="${m.field}"/>
  ${digits}
  ${pixelText('RUSH', cx - textWidth('RUSH', 4) / 2, fieldY + 40, 4, m.bands.red)}
  ${net}
  <rect x="${houseX - houseW / 2}" y="${houseY}" width="${houseW}" height="20" fill="${m.text}"/>
  ${trail}
  <rect x="${ballX}" y="${ballY}" width="18" height="18" fill="${m.ball}"/>
  <rect x="${youX - youW / 2}" y="${youY}" width="${youW}" height="20" fill="${m.paddle}"/>
  ${pixelText('TIDELINE', right, 86, 12, '#ffffff')}
  ${pixelText('PONG STOOD ON ITS END', right, 180, 4, soft)}
  ${pixelText('RALLY TO 11', right, 212, 4, soft)}
  ${pixelText(`${m.name} / ${m.chip}`, right, 278, 3, m.bands.yellow)}
  ${pixelText(`${other.name} / ${other.chip}`, right, 304, 3, dim)}
  ${pixelText('MOOD  DAWN FLOW RUSH DRIFT', right, 356, 3, soft)}
  ${pixelText('THE HOUSE FOLLOWS THE MOOD', right, 382, 3, soft)}
  ${pixelText('TAP OR PRESS SPACE', right, 434, 3, m.paddle)}
  ${pixelText('POINTCAST.XYZ/TIDELINE', right, 490, 3, '#ffffff')}
  ${pixelText('DIRECTED BY MICHAEL HOYDICH', right, 516, 3, dim)}
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
