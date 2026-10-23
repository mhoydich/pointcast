#!/usr/bin/env node
/**
 * PMM progress art: a Commodore 64 READY screen with two pixel phones
 * passing mood-coloured packets, drawn as SVG from the shared 8-bit font
 * and PMM's mood palette, rasterized with sharp (already an Astro dependency).
 *
 *   node scripts/generate-pmm-progress-art.mjs
 *
 * Writes public/images/pmm/progress/og.png (1200x630), hero.png (2400x1260)
 * and cover.svg. The numbers drawn on it are passed in below so the art
 * says what the post says.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/pmm/progress');
const W = 1200;
const H = 630;
const MERGED = 15;
const IN_REVIEW = 2;

// PMM's eight moods, in public/pmm/app.js order.
const MOODS = ['#2F86D8', '#E8453C', '#7E57B5', '#F5D142', '#58B947', '#8A86A8', '#F28C28', '#4B5BA6'];
const BORDER = '#7B71D6';
const SCREEN = '#352879';
const INK = '#A9A2FF';
const BRIGHT = '#E4E0FF';

function pixelText(text, x, y, scale, color) {
  const rects = [];
  eachPixel(text, x, y, scale, (px, py, s) => rects.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}" fill="${color}"/>`));
  return rects.join('');
}

function phone(x, y, mood) {
  // A chunky handset: body, screen, a sigil block and two message bars, all on an 8px grid.
  return [
    `<rect x="${x}" y="${y}" width="112" height="200" rx="16" fill="${BRIGHT}"/>`,
    `<rect x="${x + 8}" y="${y + 24}" width="96" height="144" fill="${SCREEN}"/>`,
    `<rect x="${x + 16}" y="${y + 32}" width="24" height="24" fill="${mood}"/>`,
    `<rect x="${x + 48}" y="${y + 40}" width="48" height="8" fill="${INK}"/>`,
    `<rect x="${x + 16}" y="${y + 72}" width="64" height="8" fill="${INK}"/>`,
    `<rect x="${x + 32}" y="${y + 96}" width="64" height="8" fill="${mood}"/>`,
    `<rect x="${x + 16}" y="${y + 120}" width="48" height="8" fill="${INK}"/>`,
    `<rect x="${x + 48}" y="${y + 180}" width="16" height="8" fill="${SCREEN}"/>`,
  ].join('');
}

export function coverSvg() {
  const parts = [];
  parts.push(`<rect width="${W}" height="${H}" fill="${BORDER}"/>`);
  parts.push(`<rect x="48" y="40" width="${W - 96}" height="${H - 80}" fill="${SCREEN}"/>`);

  // Fuji-style stripes in the top-right corner of the screen.
  const stripes = ['#E8453C', '#F28C28', '#F5D142', '#58B947', '#2F86D8'];
  stripes.forEach((c, i) => parts.push(`<rect x="${W - 48 - 260 + i * 28}" y="40" width="20" height="${120 - i * 16}" fill="${c}"/>`));

  // Header lines, C64 boot-screen style.
  parts.push(pixelText('POINTCAST MOBILE MESSAGING', 88, 80, 6, INK));
  parts.push(pixelText('READY.', 88, 136, 6, BRIGHT));
  parts.push(pixelText('LOAD "FRIEND",8,1', 88, 184, 6, INK));

  // Two phones and the packets between them, one per mood.
  const ly = 330;
  parts.push(phone(160, 250, MOODS[0]));
  parts.push(phone(W - 160 - 112, 250, MOODS[3]));
  const x0 = 160 + 112 + 32;
  const x1 = W - 160 - 112 - 32;
  const step = (x1 - x0) / (MOODS.length * 2 - 1);
  for (let i = 0; i < MOODS.length * 2; i++) {
    const c = MOODS[i % MOODS.length];
    const size = i % 2 ? 16 : 24;
    parts.push(`<rect x="${(x0 + i * step).toFixed(0)}" y="${ly + (i % 2 ? 4 : 0)}" width="${size}" height="${size}" fill="${c}"/>`);
  }

  // Merged and in-review tally, one tile per pull request.
  const ty = 500;
  for (let i = 0; i < MERGED + IN_REVIEW; i++) {
    const x = 88 + i * 36;
    if (i < MERGED) parts.push(`<rect x="${x}" y="${ty}" width="24" height="24" fill="${MOODS[i % MOODS.length]}"/>`);
    else parts.push(`<rect x="${x + 2}" y="${ty + 2}" width="20" height="20" fill="none" stroke="${BRIGHT}" stroke-width="4"/>`);
  }
  const label = `${MERGED} MERGED  ${IN_REVIEW} IN REVIEW`;
  parts.push(pixelText(label, 88 + (MERGED + IN_REVIEW) * 36 + 16, ty + 2, 4, BRIGHT));
  if (88 + (MERGED + IN_REVIEW) * 36 + 16 + textWidth(label, 4) > W - 64) throw new Error('tally label runs off the screen');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${parts.join('')}</svg>`;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const svg = coverSvg();
  await fs.writeFile(path.join(OUT, 'cover.svg'), svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'og.png'));
  await sharp(Buffer.from(svg), { density: 144 }).resize(W * 2, H * 2, { kernel: 'nearest' }).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'hero.png'));
  console.log('wrote', path.relative(process.cwd(), OUT), 'og.png hero.png cover.svg');
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
