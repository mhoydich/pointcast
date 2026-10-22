#!/usr/bin/env node
/**
 * Soft Landing cover art: an SVG drawn from the game's own palette, pixel
 * font and skyline generator, rasterized to a 1200x630 PNG with sharp
 * (already an Astro dependency).
 *
 *   node scripts/generate-soft-landing-og.mjs
 *
 * Writes public/images/soft-landing/og.png and public/images/soft-landing/cover.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';
import { generateSkyline, mulberry32 } from '../src/lib/soft-landing/skyline.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/soft-landing');
const W = 1200;
const H = 630;

function pixelText(text, x, y, scale, color) {
  const rects = [];
  eachPixel(text, x, y, scale, (px, py, s) => rects.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}" fill="${color}"/>`));
  return rects.join('');
}

function lander(cx, cy, s, color, flame, flameColor) {
  const p = (x, y) => `${(cx + x * s).toFixed(1)},${(cy + y * s).toFixed(1)}`;
  const body = `<polygon points="${[[-3, -5], [3, -5], [5, -2], [5, 2], [3, 3], [-3, 3], [-5, 2], [-5, -2]].map(([x, y]) => p(x, y)).join(' ')}" fill="none" stroke="${color}" stroke-width="${s * 0.9}" stroke-linejoin="round"/>`;
  const legs = `<path d="M${p(-4, 3)} L${p(-5.5, 6)} M${p(-7, 6)} L${p(-4, 6)} M${p(4, 3)} L${p(5.5, 6)} M${p(7, 6)} L${p(4, 6)} M${p(-2, 3)} L${p(-3, 5.5)} L${p(3, 5.5)} L${p(2, 3)}" fill="none" stroke="${color}" stroke-width="${s * 0.9}" stroke-linecap="round"/>`;
  const fire = flame ? `<path d="M${p(-2, 5.5)} L${p(0, 5.5 + flame)} L${p(2, 5.5)}" fill="none" stroke="${flameColor}" stroke-width="${s * 0.9}" stroke-linejoin="round"/>` : '';
  return body + legs + fire;
}

export function coverSvg(machineId = 'xl') {
  const m = MACHINES[machineId];
  const other = MACHINES[machineId === 'xl' ? 'c64' : 'xl'];
  const fieldX = 80, fieldY = 60, fieldW = 540, fieldH = 510;
  const sky = generateSkyline(1979, { width: 288, height: 272 });
  const k = fieldW / 288;
  const gy = fieldY + fieldH - 272 * k;
  const poly = sky.points.map(([x, y]) => `${(fieldX + x * k).toFixed(1)},${(gy + y * k).toFixed(1)}`).join(' ');
  const pads = sky.pads.map((pad) => {
    const x = fieldX + pad.x0 * k, y = gy + pad.y * k, w = pad.width * k;
    const label = `${pad.mult}X`;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="4" fill="${m.bright}"/>` + pixelText(label, Math.round(x + w / 2 - textWidth(label, 2) / 2), Math.round(y + 10), 2, pad.mult >= 4 ? m.bands.yellow : m.paddle);
  }).join('');
  const r = mulberry32(42);
  const stars = Array.from({ length: 40 }, () => `<rect x="${Math.round(fieldX + 8 + r() * (fieldW - 16))}" y="${Math.round(fieldY + 56 + r() * 200)}" width="${r() < 0.3 ? 3 : 2}" height="${r() < 0.3 ? 3 : 2}" fill="${m.text}" opacity="0.7"/>`).join('');
  const rasterBars = m.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const right = 690;
  const sub = machineId === 'xl' ? '#a9b9f5' : '#ffffff';
  const dim = machineId === 'xl' ? '#6a7fd6' : '#dcd8ff';
  const target = sky.pads.find((p) => p.mult === 2);
  const lx = fieldX + ((target.x0 + target.x1) / 2) * k;
  const ly = gy + target.y * k - 150;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="${m.border === '#000000' ? '#0b0d1a' : m.border}"/>
  <rect x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" fill="${m.field}"/>
  ${pixelText('000350', fieldX + 18, fieldY + 18, 6, m.bright)}
  ${pixelText('FLOW', fieldX + fieldW - 18 - textWidth('FLOW', 4), fieldY + 22, 4, m.bands.yellow)}
  ${stars}
  ${pixelText('ALT 148', fieldX + fieldW - 18 - textWidth('ALT 148', 3), fieldY + 70, 3, m.text)}
  ${pixelText('HS +003', fieldX + fieldW - 18 - textWidth('HS +003', 3), fieldY + 92, 3, m.text)}
  ${pixelText('VS -009', fieldX + fieldW - 18 - textWidth('VS -009', 3), fieldY + 114, 3, m.text)}
  ${pixelText('FUEL 0910', fieldX + fieldW - 18 - textWidth('FUEL 0910', 3), fieldY + 136, 3, m.text)}
  <polyline points="${poly}" fill="none" stroke="${m.text}" stroke-width="2.5" shape-rendering="geometricPrecision"/>
  ${pads}
  <g shape-rendering="geometricPrecision">${lander(lx, ly, 3.2, m.bright, 9, m.paddle)}</g>
  ${pixelText('SOFT', right, 80, 11, '#ffffff')}
  ${pixelText('LANDING', right, 146, 9, '#ffffff')}
  ${pixelText('A LUNAR LANDER FOR', right, 216, 4, sub)}
  ${pixelText('THE 8-BIT HEART', right, 246, 4, sub)}
  ${pixelText(`${m.name} / ${m.chip}`, right, 304, 3, m.bands.yellow)}
  ${pixelText(`${other.name} / ${other.chip}`, right, 330, 3, dim)}
  ${pixelText('MOOD  DAWN FLOW RUSH DRIFT', right, 376, 3, sub)}
  ${pixelText('HOLD TO BURN  TILT TO STEER', right, 416, 3, m.paddle)}
  ${pixelText('POINTCAST.XYZ/SOFT-LANDING', right, 470, 3, '#ffffff')}
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
