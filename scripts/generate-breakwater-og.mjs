#!/usr/bin/env node
/**
 * Breakwater cover art: an SVG drawn from the game's own palette and pixel
 * font, rasterized to a 1200x630 PNG with sharp (already an Astro dependency).
 *
 *   node scripts/generate-breakwater-og.mjs
 *
 * Writes public/images/breakwater/og.png and public/images/breakwater/cover.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES, COLS, ROWS, ROW_BAND } from '../src/lib/breakwater/waves.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/breakwater');
const W = 1200;
const H = 630;

function pixelText(text, x, y, scale, color) {
  const rects = [];
  eachPixel(text, x, y, scale, (px, py, s) => rects.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}" fill="${color}"/>`));
  return rects.join('');
}

function centered(text, y, scale, color, cx = W / 2) {
  return pixelText(text, Math.round(cx - textWidth(text, scale) / 2), y, scale, color);
}

export function coverSvg(machineId = 'xl') {
  const m = MACHINES[machineId];
  const other = MACHINES[machineId === 'xl' ? 'c64' : 'xl'];
  const fieldX = 80;
  const fieldY = 60;
  const fieldW = 540;
  const fieldH = 510;
  const bw = 34;
  const bh = 16;
  const gap = 4;
  const gridW = COLS * (bw + gap) - gap;
  const gx = fieldX + Math.round((fieldW - gridW) / 2);
  const gy = fieldY + 70;
  const bricks = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const gapHole = (c === 5 && r === 6) || (c === 6 && r === 7) || (c === 5 && r === 7) || (c === 9 && r === 7);
      if (gapHole) continue;
      bricks.push(`<rect x="${gx + c * (bw + gap)}" y="${gy + r * (bh + gap)}" width="${bw}" height="${bh}" fill="${m.bands[ROW_BAND[r]]}"/>`);
    }
  }
  const paddleW = 110;
  const paddleX = fieldX + 300;
  const paddleY = fieldY + fieldH - 54;
  const ballX = paddleX + 62;
  const ballY = paddleY - 118;
  const trail = [0.45, 0.3, 0.18, 0.1].map((a, i) => `<rect x="${ballX - (i + 1) * 9}" y="${ballY + (i + 1) * 12}" width="12" height="12" fill="${m.ball}" opacity="${a}"/>`).join('');
  const rasterBars = m.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const right = 690;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="${m.border === '#000000' ? '#0b0d1a' : m.border}"/>
  <rect x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" fill="${m.field}"/>
  ${pixelText('000470', fieldX + 18, fieldY + 18, 6, m.bright)}
  ${pixelText('FLOW', fieldX + fieldW - 18 - textWidth('FLOW', 4), fieldY + 22, 4, m.bands.yellow)}
  ${bricks.join('')}
  ${trail}
  <rect x="${ballX}" y="${ballY}" width="12" height="12" fill="${m.ball}"/>
  <rect x="${paddleX}" y="${paddleY}" width="${paddleW}" height="16" fill="${m.paddle}"/>
  ${pixelText('BREAKWATER', right, 92, 9, '#ffffff')}
  ${pixelText('A BREAKOUT FOR THE', right, 170, 4, m.text === '#000000' ? '#ffffff' : (machineId === 'xl' ? '#a9b9f5' : '#ffffff'))}
  ${pixelText('8-BIT HEART', right, 200, 4, machineId === 'xl' ? '#a9b9f5' : '#ffffff')}
  ${pixelText(`${m.name} / ${m.chip}`, right, 270, 3, m.bands.yellow)}
  ${pixelText(`${other.name} / ${other.chip}`, right, 296, 3, machineId === 'xl' ? '#6a7fd6' : '#dcd8ff')}
  ${pixelText('MOOD  DAWN FLOW RUSH DRIFT', right, 350, 3, machineId === 'xl' ? '#a9b9f5' : '#ffffff')}
  ${pixelText('TAP OR PRESS SPACE', right, 404, 3, m.paddle)}
  ${pixelText('POINTCAST.XYZ/BREAKWATER', right, 470, 3, '#ffffff')}
  ${pixelText('DIRECTED BY MICHAEL HOYDICH', right, 496, 3, machineId === 'xl' ? '#6a7fd6' : '#dcd8ff')}
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
