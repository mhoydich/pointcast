#!/usr/bin/env node
/**
 * generate-coffee-mug-svgs.mjs — emit one standalone SVG per Coffee Mug
 * tier into public/images/coffee-mugs/{slug}.svg, using the same pixel-
 * art data that drives the SVGs on /coffee.
 *
 * Run once after editing the MUGS array below. Used by the TZIP-21
 * metadata endpoint at /api/tezos-metadata/coffee-mugs/[tokenId] —
 * those URIs need to resolve to a real image so wallets/marketplaces
 * (objkt, Kukai, TzKT, better-call.dev) can render the NFT visually.
 *
 *   node scripts/generate-coffee-mug-svgs.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const MUGS = [
  {
    slug: 'ceramic',
    pixels: [
      [4, 6, 12, 1, '#f8f4ec'],
      [4, 7, 12, 8, '#f3eee0'],
      [4, 15, 12, 1, '#d8cdb8'],
      [5, 7, 10, 2, '#3c2817'],
      [5, 9, 10, 1, '#5a3b22'],
      [16, 8, 1, 1, '#1a1208'],
      [17, 8, 2, 1, '#1a1208'],
      [19, 9, 1, 1, '#1a1208'],
      [19, 10, 1, 1, '#1a1208'],
      [19, 11, 1, 1, '#1a1208'],
      [17, 12, 2, 1, '#1a1208'],
      [16, 12, 1, 1, '#1a1208'],
    ],
  },
  {
    slug: 'espresso',
    pixels: [
      [9, 9, 6, 1, '#f8f4ec'],
      [9, 10, 6, 4, '#f3eee0'],
      [10, 10, 4, 1, '#1a1208'],
      [10, 11, 4, 2, '#3c2817'],
      [10, 14, 4, 1, '#d8cdb8'],
      [15, 11, 1, 1, '#1a1208'],
      [16, 11, 1, 1, '#1a1208'],
      [16, 12, 1, 1, '#1a1208'],
      [15, 12, 1, 1, '#1a1208'],
      [7, 16, 10, 1, '#e8dec8'],
      [8, 17, 8, 1, '#d8cdb8'],
    ],
  },
  {
    slug: 'latte',
    pixels: [
      [7, 4, 9, 1, '#e0dccc'],
      [7, 5, 9, 12, '#f1eedf'],
      [7, 17, 9, 1, '#c8bfa8'],
      [8, 5, 7, 2, '#fef5e7'],
      [8, 7, 7, 3, '#e9dcc0'],
      [8, 10, 7, 1, '#b89668'],
      [8, 11, 7, 5, '#3c2817'],
      [8, 16, 7, 1, '#5a3b22'],
    ],
  },
  {
    slug: 'paper',
    pixels: [
      [6, 4, 12, 1, '#3c2817'],
      [6, 5, 12, 1, '#5a3b22'],
      [10, 5, 4, 1, '#1a1208'],
      [7, 6, 10, 1, '#f3eee0'],
      [7, 7, 10, 2, '#f8f4ec'],
      [7, 9, 10, 4, '#8d6b3a'],
      [8, 9, 8, 1, '#a87f48'],
      [8, 13, 8, 2, '#f3eee0'],
      [9, 15, 6, 1, '#e8dec8'],
      [10, 16, 4, 1, '#d8cdb8'],
    ],
  },
  {
    slug: 'bistro',
    pixels: [
      [4, 7, 14, 1, '#f8f4ec'],
      [4, 8, 14, 4, '#f3eee0'],
      [5, 8, 12, 2, '#1a1208'],
      [5, 10, 12, 1, '#3c2817'],
      [5, 12, 12, 1, '#e8dec8'],
      [6, 13, 10, 1, '#d8cdb8'],
      [3, 15, 16, 1, '#e8dec8'],
      [4, 16, 14, 1, '#c8bfa8'],
    ],
  },
];

// Background per rarity tier — solid colour band that frames the mug
// and lets the marketplace thumbnail look "designed" rather than naked
// pixel-art on a white square.
const BG = {
  ceramic: '#f5efe4',  // warm paper
  espresso: '#e8dccb',
  latte: '#ece1c6',
  paper: '#f0e2c8',
  bistro: '#f6e8c4',
};

const OUT_DIR = path.resolve('public/images/coffee-mugs');
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const mug of MUGS) {
  const rects = mug.pixels
    .map(([x, y, w, h, fill]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`)
    .join('');
  const svg =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges" width="512" height="512">` +
    `<rect x="0" y="0" width="24" height="24" fill="${BG[mug.slug]}"/>` +
    rects +
    `</svg>`;
  const outPath = path.join(OUT_DIR, `${mug.slug}.svg`);
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log(`wrote ${outPath} (${svg.length} bytes)`);
}
