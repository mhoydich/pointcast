#!/usr/bin/env node
/**
 * Sea Glass cover art: an SVG drawn from the game's own palette, pixel font,
 * sprites and pyramid geometry, rasterized to a 1200x630 PNG with sharp
 * (already an Astro dependency).
 *
 *   node scripts/generate-sea-glass-og.mjs
 *
 * Writes public/images/sea-glass/og.png, cover.svg and cover-c64.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';
import { ROWS, screenOf } from '../src/lib/sea-glass/pyramid.mjs';
import { CRAB, BUBBLE, GULL, eachSpritePixel, eachBuoyPixel } from '../src/lib/sea-glass/sprites.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/sea-glass');
const W = 1200;
const H = 630;

function pixelText(text, x, y, scale, color) {
  const rects = [];
  eachPixel(text, x, y, scale, (px, py, s) => rects.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}" fill="${color}"/>`));
  return rects.join('');
}

function spriteRects(rows, x, y, s, colors, flip = false) {
  const rects = [];
  eachSpritePixel(rows, 0, 0, (px, py, ch) => {
    const col = colors[ch];
    if (col) rects.push(`<rect x="${x + px * s}" y="${y + py * s}" width="${s}" height="${s}" fill="${col}"${ch === 'f' ? ' opacity="0.3"' : ''}/>`);
  }, flip);
  return rects.join('');
}

function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

// Which tops are already sea glass on the cover: the top four rows and a scatter below.
const GLASS = new Set(['0,0', '1,0', '1,1', '2,0', '2,1', '2,2', '3,1', '3,2', '3,3', '4,2', '4,3', '5,4', '6,5']);

export function coverSvg(machineId = 'xl') {
  const m = MACHINES[machineId];
  const fieldX = 60, fieldY = 40, fieldW = 600, fieldH = 550;
  const CW = 40, TH = 20, SH = 44, RY = TH + SH;
  const X0 = fieldX + fieldW / 2, Y0 = fieldY + 92;
  const left = mix(m.text, m.field, 0.35), right = mix(m.field, '#000000', 0.5);
  const cubes = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c <= r; c += 1) {
      const cx = X0 + screenOf(r, c).x * 2 * CW, cy = Y0 + r * RY;
      const glass = GLASS.has(`${r},${c}`);
      const top = glass ? ((r + c) % 2 ? m.bands.green : m.raster[4]) : m.bands.yellow;
      cubes.push(`<polygon points="${cx - CW},${cy} ${cx},${cy + TH} ${cx},${cy + TH + SH} ${cx - CW},${cy + SH}" fill="${left}"/>`);
      cubes.push(`<polygon points="${cx},${cy + TH} ${cx + CW},${cy} ${cx + CW},${cy + SH} ${cx},${cy + TH + SH}" fill="${right}"/>`);
      cubes.push(`<polygon points="${cx},${cy - TH} ${cx + CW},${cy} ${cx},${cy + TH} ${cx - CW},${cy}" fill="${top}"/>`);
      if (glass) cubes.push(`<rect x="${cx - 16}" y="${cy - 5}" width="8" height="3" fill="${m.bright}" opacity="0.8"/>`);
    }
  }
  const buoy = (r, c) => {
    const s = screenOf(r, c);
    const bx = X0 + s.x * 2 * CW - 24, by = Y0 + r * RY - 6;
    const rects = [];
    eachBuoyPixel(0, 0, (px, py, seg) => rects.push(`<rect x="${bx + px * 3}" y="${by + py * 3}" width="3" height="3" fill="${seg ? m.bands.red : m.bright}"/>`));
    return rects.join('');
  };
  const crabColors = { S: mix(m.bands.orange, '#000000', 0.25), s: m.paddle, B: m.bands.red, k: mix(m.bands.red, '#ffffff', 0.3), '|': m.bands.red, e: '#101018' };
  const crab = spriteRects(CRAB, X0 + screenOf(4, 2).x * 2 * CW - 28, Y0 + 4 * RY - 44, 4, crabColors);
  const bubble = spriteRects(BUBBLE, X0 + screenOf(5, 2).x * 2 * CW - 16, Y0 + 5 * RY - 34, 4, { o: m.ball, h: m.bright, f: m.raster[4] });
  const gull = spriteRects(GULL, X0 + screenOf(6, 1).x * 2 * CW - 24, Y0 + 6 * RY - 42, 4, { H: m.bright, w: mix(m.bright, m.field, 0.25), g: mix(m.bright, '#000000', 0.55), e: '#101018', y: m.bands.orange }, true);
  const rasterBars = m.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const rightX = 700;
  const soft = machineId === 'xl' ? '#a9b9f5' : '#ffffff';
  const quiet = machineId === 'xl' ? '#8b9ce6' : '#dcd8ff';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="${m.border === '#000000' ? '#0b0d1a' : m.border}"/>
  <rect x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" fill="${m.field}"/>
  ${pixelText('012475', fieldX + 18, fieldY + 18, 6, m.bright)}
  ${pixelText('FLOW', fieldX + fieldW - 18 - textWidth('FLOW', 4), fieldY + 22, 4, m.bands.yellow)}
  ${cubes.join('')}
  ${buoy(2, -1)}
  ${buoy(4, 5)}
  ${crab}
  ${bubble}
  ${gull}
  ${pixelText('SEA GLASS', rightX, 92, 9, '#ffffff')}
  ${pixelText('TURN EVERY STONE', rightX, 170, 4, soft)}
  ${pixelText(`${m.name} / ${m.chip}`, rightX, 236, 3, m.bands.yellow)}
  ${pixelText('28 CUBES / 7 ROWS', rightX, 262, 3, soft)}
  ${pixelText('MOOD  DAWN FLOW RUSH DRIFT', rightX, 314, 3, soft)}
  ${pixelText('TAP A CORNER TO HOP', rightX, 366, 3, m.paddle)}
  ${pixelText('OR Q E A D', rightX, 392, 3, m.paddle)}
  ${pixelText('POINTCAST.XYZ/SEA-GLASS', rightX, 470, 3, '#ffffff')}
  ${pixelText('DIRECTED BY MICHAEL HOYDICH', rightX, 496, 3, quiet)}
  ${rasterBars}
</svg>`;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const svg = coverSvg('xl');
  await fs.writeFile(path.join(OUT, 'cover.svg'), svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'og.png'));
  await fs.writeFile(path.join(OUT, 'cover-c64.svg'), coverSvg('c64'));
  console.log('wrote', path.relative(process.cwd(), OUT));
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) await main();
