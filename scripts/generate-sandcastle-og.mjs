#!/usr/bin/env node
/**
 * Sandcastle cover art: an SVG drawn from the game's own palette, pixel font
 * and beach layout, rasterized to a 1200x630 PNG with sharp (already an
 * Astro dependency).
 *
 *   node scripts/generate-sandcastle-og.mjs
 *
 * Writes public/images/sandcastle/og.png and public/images/sandcastle/cover.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';
import { W as FIELD_W, CASTLE_X, BRIGADE_X } from '../src/lib/sandcastle/shore.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/sandcastle');
const W = 1200;
const H = 630;

function pixelText(text, x, y, scale, color) {
  const rects = [];
  eachPixel(text, x, y, scale, (px, py, s) => rects.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}" fill="${color}"/>`));
  return rects.join('');
}

/** The castle outline from the game, in field units around (x, g). */
function castlePath(x, g) {
  const p = [[-10, 0], [-10, -8], [-7, -8], [-7, -6], [-5, -6], [-5, -8], [-4, -8], [-4, -15], [-2, -15], [-2, -13], [2, -13], [2, -15], [4, -15], [4, -8], [5, -8], [5, -6], [7, -6], [7, -8], [10, -8], [10, 0]];
  return `M${p.map(([dx, dy]) => `${x + dx} ${g + dy}`).join(' L')} M${x} ${g - 15} L${x} ${g - 21} L${x + 5} ${g - 19.5} L${x} ${g - 18}`;
}

export function coverSvg(machineId = 'xl') {
  const m = MACHINES[machineId];
  // The field: one game screen at 1.5x, 288 by 384 logical pixels.
  const k = 1.5, fx = 70, fy = 6, fw = FIELD_W * k, fh = 384 * k;
  const g = 384 - 28;
  const u = (v) => (v * k).toFixed(1);
  const lines = [
    [30, 44, 82, 210], [120, 44, 112, 260], [200, 44, 206, 170], [260, 44, 236, 300], [64, 44, 144, 232], [160, 44, 176, 150],
  ];
  const split = [112, 260, 52, 330];
  const bursts = [[112, 262, 15, m.raster[2]], [206, 172, 13, m.raster[4]], [150, 236, 10, m.raster[6]]];
  const shots = [[144, g - 6, 112, 262], [266, g - 6, 206, 172]];
  const sea = [0, 1].map((row) => {
    const pts = [];
    for (let x = 0; x <= FIELD_W; x += 4) pts.push(`${u(x)} ${u(36 + row * 5 + Math.sin(x / 18 + row * 1.7) * 1.6)}`);
    return `<path d="M${pts.join(' L')}" stroke="${row ? m.text : '#ffffff'}" stroke-opacity="${row ? 1 : 0.6}" fill="none" stroke-width="1.5"/>`;
  }).join('');
  const field = `<g transform="translate(${fx} ${fy})">
    <rect width="${fw}" height="${fh}" fill="${m.field}"/>
    ${pixelText('004350', 9, 12, 4.5, m.bright)}
    ${pixelText('FLOW', fw - 12 - textWidth('FLOW', 3), 16, 3, m.bands.yellow)}
    ${sea}
    <rect x="0" y="${u(g)}" width="${fw}" height="${u(28)}" fill="${m.bands.yellow}" fill-opacity="0.12"/>
    <line x1="0" y1="${u(g)}" x2="${fw}" y2="${u(g)}" stroke="${m.bands.yellow}" stroke-width="1.5"/>
    ${lines.map(([a, b, c, d]) => `<line x1="${u(a)}" y1="${u(b)}" x2="${u(c)}" y2="${u(d)}" stroke="#ffffff" stroke-opacity="0.85" stroke-width="1.5"/><rect x="${u(c) - 2}" y="${u(d) - 2}" width="4" height="4" fill="#ffffff"/>`).join('')}
    <line x1="${u(split[0])}" y1="${u(split[1] - 60)}" x2="${u(split[2])}" y2="${u(split[3])}" stroke="${m.bands.red}" stroke-width="1.5"/>
    ${shots.map(([a, b, c, d]) => `<line x1="${u(a)}" y1="${u(b)}" x2="${u(c)}" y2="${u(d)}" stroke="${m.paddle}" stroke-opacity="0.7" stroke-width="1.5"/>`).join('')}
    ${bursts.map(([x, y, r, c]) => `<circle cx="${u(x)}" cy="${u(y)}" r="${u(r)}" fill="${c}" fill-opacity="0.25" stroke="${c}" stroke-width="1.5"/>`).join('')}
    <g transform="scale(${k})" fill="none" stroke-width="1">
      ${CASTLE_X.map((x, i) => (i === 4 ? `<path d="M${x - 10} ${g} Q${x} ${g - 6} ${x + 10} ${g}" stroke="${m.bands.yellow}" stroke-opacity="0.45"/>` : `<path d="${castlePath(x, g)}" stroke="${m.bands.yellow}"/>`)).join('')}
      ${BRIGADE_X.map((x) => `<path d="M${x - 7} ${g - 11} L${x - 5} ${g - 1} L${x + 5} ${g - 1} L${x + 7} ${g - 11} Z M${x - 6} ${g - 11} A6 6 0 0 1 ${x + 6} ${g - 11}" stroke="${m.paddle}"/>`).join('')}
    </g>
  </g>`;
  const rasterBars = m.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const right = 580;
  const light = machineId === 'xl' ? '#a9b9f5' : '#ffffff';
  const quiet = machineId === 'xl' ? '#8b9de6' : '#dcd8ff';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${m.border === '#000000' ? '#0b0d1a' : m.border}"/>
  ${field}
  <g shape-rendering="crispEdges">
  ${pixelText('SANDCASTLE', right, 92, 9, '#ffffff')}
  ${pixelText('HOLD BACK THE TIDE', right, 170, 4, light)}
  ${pixelText('SIX CASTLES, THREE BUCKETS', right, 214, 3, light)}
  ${pixelText(`${m.name} / ${m.chip}`, right, 270, 3, m.bands.yellow)}
  ${pixelText('MOOD  DAWN FLOW RUSH DRIFT', right, 312, 3, light)}
  ${pixelText('TAP WHERE THE WAVES GO', right, 366, 3, m.paddle)}
  ${pixelText('POINTCAST.XYZ/SANDCASTLE', right, 470, 3, '#ffffff')}
  ${pixelText('DIRECTED BY MICHAEL HOYDICH', right, 496, 3, quiet)}
  ${rasterBars}
  </g>
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
