#!/usr/bin/env node
/**
 * Lighthouse cover art: an SVG drawn from the game's own palette, lens
 * geometry and pixel font, rasterized to a 1200x630 PNG with sharp (already
 * an Astro dependency).
 *
 *   node scripts/generate-lighthouse-og.mjs
 *
 * Writes public/images/lighthouse/og.png and public/images/lighthouse/cover.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';
import { LAMPS, lensCells, hubCells } from '../src/lib/lighthouse/lens.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/lighthouse');
const W = 1200;
const H = 630;

function pixelText(text, x, y, scale, color) {
  const rects = [];
  eachPixel(text, x, y, scale, (px, py, s) => rects.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}" fill="${color}"/>`));
  return rects.join('');
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => `#${hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;

export function coverSvg(machineId = 'xl') {
  const m = MACHINES[machineId];
  const other = MACHINES[machineId === 'xl' ? 'c64' : 'xl'];
  const fieldX = 60;
  const fieldY = 40;
  const fieldW = 560;
  const fieldH = 550;
  // The game's own lens at 2x: geometry in field pixels, drawn with 8 px cells.
  const k = 2;
  const geo = { cx: (fieldX + fieldW / 2) / k, cy: (fieldY + fieldH / 2 - 6) / k, rOuter: 116, rInner: 38, gap: 6 };
  const lit = 1; // the east lamp is mid-flash
  const glass = lensCells(geo, 4).map((c) => {
    const base = m.bands[LAMPS[c.lamp].band];
    let col = c.lamp === lit ? mix(base, '#ffffff', 0.3) : mix(base, m.field, 0.55);
    if (c.ring % 2) col = mix(col, '#000000', 0.16);
    return `<rect x="${c.x * k}" y="${c.y * k}" width="${3 * k}" height="${3 * k}" fill="${col}"/>`;
  }).join('');
  const lantern = hubCells(geo, 4).map((c) => `<rect x="${c.x * k}" y="${c.y * k}" width="${3 * k}" height="${3 * k}" fill="${mix(mix(m.field, '#000000', 0.35), m.paddle, 0.4)}"/>`).join('');
  const frame = `<circle cx="${geo.cx * k}" cy="${geo.cy * k}" r="${(geo.rOuter + 4) * k}" fill="${mix(m.field, '#000000', 0.55)}"/>`;
  const cx = geo.cx * k;
  const cy = geo.cy * k;
  const beam = (a, half, op) => `<polygon points="${cx},${cy} ${cx + Math.cos(a - half) * 900},${cy + Math.sin(a - half) * 900} ${cx + Math.cos(a + half) * 900},${cy + Math.sin(a + half) * 900}" fill="#ffffff" opacity="${op}"/>`;
  const stars = Array.from({ length: 40 }, (_, i) => `<rect x="${fieldX + 10 + ((i * 131) % (fieldW - 20))}" y="${fieldY + 12 + ((i * 71) % 420)}" width="3" height="3" fill="#ffffff" opacity="${0.25 + (i % 3) * 0.12}"/>`).join('');
  const sea = [];
  for (let r = 0; r < 4; r += 1) for (let x = fieldX + 10 + (r % 2) * 20; x < fieldX + fieldW - 20; x += 40) sea.push(`<rect x="${x}" y="${fieldY + fieldH - 50 + r * 12}" width="16" height="2" fill="${m.text}" opacity="0.3"/>`);
  const rasterBars = m.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const right = 670;
  const soft = machineId === 'xl' ? '#a9b9f5' : '#ffffff';
  const quiet = machineId === 'xl' ? '#8d9ce6' : '#dcd8ff';
  const n = '07';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="${m.border === '#000000' ? '#0b0d1a' : m.border}"/>
  <rect x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" fill="${m.field}"/>
  ${stars}
  ${sea.join('')}
  <svg x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" viewBox="${fieldX} ${fieldY} ${fieldW} ${fieldH}" overflow="hidden">${beam(-0.5, 0.13, 0.12)}${beam(-0.5, 0.045, 0.1)}${beam(Math.PI - 0.5, 0.13, 0.12)}${beam(Math.PI - 0.5, 0.045, 0.1)}</svg>
  ${frame}
  ${glass}
  ${lantern}
  ${pixelText(n, Math.round(cx - textWidth(n, 8) / 2), cy - 20, 8, '#ffffff')}
  ${pixelText('STEP 07', fieldX + 16, fieldY + 18, 4, '#ffffff')}
  ${pixelText('FLOW', fieldX + fieldW - 16 - textWidth('FLOW', 4), fieldY + 18, 4, m.bands.yellow)}
  ${pixelText('LIGHTHOUSE', right, 92, 9, '#ffffff')}
  ${pixelText('FOLLOW THE LIGHT', right, 170, 4, soft)}
  ${pixelText('SIMON AS A LENS AT NIGHT', right, 200, 3, soft)}
  ${pixelText(`${m.name} / ${m.chip}`, right, 262, 3, m.bands.yellow)}
  ${pixelText(`${other.name} / ${other.chip}`, right, 288, 3, quiet)}
  ${pixelText('MOOD  DAWN FLOW RUSH DRIFT', right, 340, 3, soft)}
  ${pixelText('TAP THE LAMPS', right, 394, 3, m.paddle)}
  ${pixelText('POINTCAST.XYZ/LIGHTHOUSE', right, 470, 3, '#ffffff')}
  ${pixelText('DIRECTED BY MICHAEL HOYDICH', right, 496, 3, quiet)}
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
