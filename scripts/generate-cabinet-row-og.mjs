#!/usr/bin/env node
/**
 * Cabinet Row cover art: a row of small arcade cabinets drawn from the
 * Breakwater palette and pixel font, rasterized to 1200x630 with sharp.
 *
 *   node scripts/generate-cabinet-row-og.mjs
 *
 * Writes public/images/cabinet-row/og.png and cover.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES, ROW_BAND } from '../src/lib/breakwater/waves.mjs';
import { ROW } from '../src/lib/breakwater/row.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/cabinet-row');
const W = 1200;
const H = 630;
const xl = MACHINES.xl;
const c64 = MACHINES.c64;

function pixelText(text, x, y, scale, color) {
  let d = '';
  eachPixel(text, x, y, scale, (px, py, s) => { d += `M${px} ${py}h${s}v${s}h-${s}z`; });
  return `<path d="${d}" fill="${color}"/>`;
}
const centered = (text, cx, y, scale, color) => pixelText(text, Math.round(cx - textWidth(text, scale) / 2), y, scale, color);

function cabinet(x, y, w, c, i) {
  const m = i % 2 ? c64 : xl;
  const h = 300;
  const band = (r) => m.bands[ROW_BAND[r]];
  const screenX = x + 12;
  const screenY = y + 64;
  const sw = w - 24;
  const sh = 120;
  const bricks = [];
  const cols = 7;
  const bw = Math.floor((sw - 16) / cols) - 2;
  for (let r = 0; r < 4; r += 1) for (let col = 0; col < cols; col += 1) {
    if ((i + r + col) % 9 === 0) continue;
    bricks.push(`<rect x="${screenX + 8 + col * (bw + 2)}" y="${screenY + 10 + r * 9}" width="${bw}" height="7" fill="${band(r * 2)}"/>`);
  }
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${i % 2 ? '#2a2470' : '#1b2350'}"/>
  <rect x="${x}" y="${y + h - 14}" width="${w}" height="14" fill="#070918"/>
  <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="44" rx="6" fill="#05060f"/>
  <rect x="${x + 8}" y="${y + 50}" width="${w - 16}" height="3" fill="${m.paddle}"/>
  ${centered(c.name.toUpperCase(), x + w / 2, y + 22, c.name.length > 10 ? 2 : 3, m.paddle)}
  <rect x="${screenX - 6}" y="${screenY - 6}" width="${sw + 12}" height="${sh + 12}" rx="6" fill="#05060f"/>
  <rect x="${screenX}" y="${screenY}" width="${sw}" height="${sh}" fill="${m.field}"/>
  ${bricks.join('')}
  <rect x="${screenX + sw / 2 - 16}" y="${screenY + sh - 16}" width="32" height="5" fill="${m.paddle}"/>
  <rect x="${screenX + sw / 2 + 6}" y="${screenY + sh - 40}" width="5" height="5" fill="#ffffff"/>
  <circle cx="${x + w / 2 - 22}" cy="${y + 226}" r="9" fill="${m.bands.red}"/>
  <circle cx="${x + w / 2 + 4}" cy="${y + 226}" r="9" fill="${m.bands.yellow}"/>
  <rect x="${x + w / 2 + 22}" y="${y + 216}" width="6" height="20" rx="3" fill="#9aa1cc"/>`;
}

export function coverSvg() {
  const shown = ROW.slice(0, 6);
  const gap = 18;
  const w = 168;
  const total = shown.length * w + (shown.length - 1) * gap;
  const x0 = Math.round((W - total) / 2);
  const cabs = shown.map((c, i) => cabinet(x0 + i * (w + gap), 230, w, c, i)).join('');
  const rasters = xl.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const title = 'CABINET ROW';
  const scale = 12;
  const tw = textWidth(title, scale);
  let tx = Math.round((W - tw) / 2);
  const colors = [xl.bands.red, xl.bands.orange, xl.bands.yellow, xl.bands.green];
  let titleSvg = '';
  title.split('').forEach((ch, i) => { titleSvg += pixelText(ch, tx, 46, scale, colors[i % 4]); tx += 4 * scale; });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="#0b0d1a"/>
  ${titleSvg}
  ${centered('THE LOBBY FOR THE 8-BIT HEART', W / 2, 130, 4, '#ffffff')}
  ${centered('THE ROW IS IN FLOW', W / 2, 172, 3, xl.bands.yellow)}
  ${cabs}
  ${rasters}
</svg>`;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const svg = coverSvg();
  await fs.writeFile(path.join(OUT, 'cover.svg'), svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'og.png'));
  console.log('wrote', path.relative(process.cwd(), OUT));
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) await main();
