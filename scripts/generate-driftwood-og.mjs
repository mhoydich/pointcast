#!/usr/bin/env node
/**
 * Driftwood cover art: an SVG drawn from the game's own palette, log
 * generator and pixel font, rasterized to a 1200x630 PNG with sharp
 * (already an Astro dependency).
 *
 *   node scripts/generate-driftwood-og.mjs
 *
 * Writes public/images/driftwood/og.png, cover.svg and cover-c64.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';
import { makeRng, makeLog, worldPoly, BOAT_POLY, BIRD_POLY } from '../src/lib/driftwood/field.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/driftwood');
const W = 1200;
const H = 630;

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${[0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t)).join(',')})`; };

function pixelText(text, x, y, scale, color) {
  const rects = [];
  eachPixel(text, x, y, scale, (px, py, s) => rects.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}" fill="${color}"/>`));
  return rects.join('');
}

function polyPath(body, k, ox, oy) {
  return worldPoly(body).map(([x, y], i) => `${i ? 'L' : 'M'}${(ox + x * k).toFixed(1)} ${(oy + y * k).toFixed(1)}`).join(' ') + ' Z';
}

export function coverSvg(machineId = 'xl') {
  const m = MACHINES[machineId];
  const other = MACHINES[machineId === 'xl' ? 'c64' : 'xl'];
  const rng = makeRng(2026);
  const fieldX = 80, fieldY = 60, fieldW = 540, fieldH = 510;
  const k = 1.8; // logical px -> cover px
  const night = mix(m.field, '#000000', 0.66);
  const glowId = `g${machineId}`;
  // Logs of all three sizes, laid by hand so the cover reads at a glance.
  const logs = [
    makeLog('big', 70, 70, 0, 0, rng), makeLog('big', 230, 110, 0, 0, rng), makeLog('big', 60, 230, 0, 0, rng),
    makeLog('medium', 160, 60, 0, 0, rng), makeLog('medium', 250, 210, 0, 0, rng), makeLog('medium', 110, 160, 0, 0, rng),
    makeLog('small', 200, 150, 0, 0, rng), makeLog('small', 80, 130, 0, 0, rng), makeLog('small', 240, 260, 0, 0, rng), makeLog('small', 170, 240, 0, 0, rng),
  ];
  const logPaths = logs.map((l) => `<path d="${polyPath(l, k, fieldX, fieldY)}" fill="none" stroke="${m.text}" stroke-width="${l.size === 'big' ? 3 : 2.2}" stroke-linejoin="round"/>`).join('');
  const boat = { x: 150, y: 150, angle: -Math.PI / 2 + 0.5, poly: BOAT_POLY };
  const bird = { x: 40, y: 40, angle: 0, poly: BIRD_POLY };
  const flares = [[0.9, 1], [0.78, 1], [0.65, 0.9], [0.52, 0.8]].map(([d, a]) => {
    const fx = fieldX + (boat.x + Math.cos(boat.angle) * 9 * d * 12) * k, fy = fieldY + (boat.y + Math.sin(boat.angle) * 9 * d * 12) * k;
    return `<rect x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" width="5" height="5" fill="${m.bright}" opacity="${a}"/>`;
  }).join('');
  const swell = [];
  for (let y = fieldY + 30; y < fieldY + fieldH; y += 50) {
    let d = '';
    for (let x = 0; x <= fieldW; x += 20) d += `${x ? 'L' : 'M'}${fieldX + x} ${(y + Math.sin((x / fieldW) * Math.PI * 4) * 4).toFixed(1)} `;
    swell.push(`<path d="${d}" fill="none" stroke="${m.text}" stroke-width="1" opacity="0.1"/>`);
  }
  const rasterBars = m.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const right = 690;
  const sub = machineId === 'xl' ? '#a9b9f5' : '#ffffff';
  const dim = machineId === 'xl' ? '#6a7fd6' : '#dcd8ff';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><filter id="${glowId}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <rect width="${W}" height="${H}" fill="${m.border === '#000000' ? '#0b0d1a' : m.border}"/>
  <rect x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" fill="${night}"/>
  ${swell.join('')}
  <g shape-rendering="crispEdges">${pixelText('001250', fieldX + 18, fieldY + 18, 6, m.bright)}${pixelText('RUSH', fieldX + fieldW - 18 - textWidth('RUSH', 4), fieldY + 22, 4, m.bands.red)}</g>
  <g filter="url(#${glowId})">${logPaths}
  <path d="${polyPath(bird, k, fieldX, fieldY)}" fill="none" stroke="${m.bands.yellow}" stroke-width="2" stroke-linejoin="round"/>
  <path d="${polyPath(boat, k * 1.4, fieldX, fieldY)}" fill="none" stroke="${m.bright}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="${fieldX + boat.x * k}" cy="${fieldY + boat.y * k}" r="30" fill="none" stroke="${m.paddle}" stroke-width="2" opacity="0.7"/>
  ${flares}</g>
  <g shape-rendering="crispEdges">
  ${pixelText('DRIFTWOOD', right, 92, 9, '#ffffff')}
  ${pixelText('ASTEROIDS ON', right, 170, 4, sub)}
  ${pixelText('THE WATER', right, 200, 4, sub)}
  ${pixelText(`${m.name} / ${m.chip}`, right, 270, 3, m.bands.yellow)}
  ${pixelText(`${other.name} / ${other.chip}`, right, 296, 3, dim)}
  ${pixelText('MOOD  DAWN FLOW RUSH DRIFT', right, 350, 3, sub)}
  ${pixelText('TURN PUSH FIRE', right, 404, 3, m.paddle)}
  ${pixelText('POINTCAST.XYZ/DRIFTWOOD', right, 470, 3, '#ffffff')}
  ${pixelText('DIRECTED BY MICHAEL HOYDICH', right, 496, 3, dim)}
  ${rasterBars}
  </g>
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
