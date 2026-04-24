#!/usr/bin/env node
/**
 * build-deck-poster — renders a 1200×630 PNG poster for any /decks/{slug}.html.
 *
 * Why: Manus V-2 (the X launch thread) and V-1 (Warpcast frame) both want a
 * canonical social-card image for the versioned-narrative decks. Rather than
 * screenshot the deck cover in a browser, we hand-author an SVG that carries
 * the same visual DNA (sunset gradient, iconic red nouns noggles, DM Serif
 * Display serif wordmark, mono eyebrows) at a 1200×630 aspect so platforms
 * unfurl it cleanly. Same pattern as `build-og.mjs` — SVG + @resvg/resvg-js.
 *
 * Usage:
 *   node scripts/build-deck-poster.mjs           # renders all known decks
 *   node scripts/build-deck-poster.mjs vol-2     # single deck
 *
 * Output:
 *   public/posters/vol-{n}.png  (1200×630 PNG)
 *
 * Add a new deck by appending to DECKS below and rerun.
 *
 * Author: cc. Source: Mike chat 2026-04-21 PT 'ok go' approving poster-infra
 * follow-up to the Vol. II deck ship (block 0360).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const W = 1200;
const H = 630;
const OUT_DIR = path.resolve(process.cwd(), 'public/posters');

/** Deck registry. Add new decks here. */
const DECKS = [
  {
    slug: 'vol-1',
    roman: 'Vol. I',
    kicker: 'POINTCAST · DECK № 001 · 2026-04-20',
    title: 'The Dispatch from El Segundo',
    dek: 'A living broadcast · 13 slides · Blocks, channels, meshes, the 25-mile beacon.',
    url: 'pointcast.xyz/decks/vol-1.html',
  },
  {
    slug: 'vol-2',
    roman: 'Vol. II',
    kicker: 'POINTCAST · DECK № 002 · 2026-04-21',
    title: 'The Network Shape',
    dek: '100 commits · 15 slides · Compute is the currency. The ledger is the receipt.',
    url: 'pointcast.xyz/decks/vol-2.html',
  },
];

/** Iconic red Nouns noggles — returned as raw SVG markup at the given x/y/scale. */
function noggles(x, y, cellPx) {
  // 14 cells wide × 4 cells tall. Each cell = cellPx.
  const cell = (cx, cy, w, h, fill) =>
    `<rect x="${x + cx * cellPx}" y="${y + cy * cellPx}" width="${w * cellPx}" height="${h * cellPx}" fill="${fill}"/>`;
  return [
    // lens 1 frame
    cell(0, 0, 6, 4, '#e73838'),
    cell(1, 1, 4, 2, '#ffffff'),
    cell(3, 1, 2, 2, '#000000'),
    // bridge
    cell(6, 1, 1, 2, '#e73838'),
    // lens 2 frame
    cell(7, 0, 6, 4, '#e73838'),
    cell(8, 1, 4, 2, '#ffffff'),
    cell(10, 1, 2, 2, '#000000'),
  ].join('\n');
}

/** XML-escape a short string. */
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

function posterSvg({ roman, kicker, title, dek, url }) {
  // Noggles: cell 22 → 308×88 noggles. Place top-right, visually prominent.
  const nogCell = 22;
  const nogW = 14 * nogCell;
  const nogX = W - nogW - 72;
  const nogY = 72;
  // Roman chip: fits below noggles on the right column. Width auto-scales to text.
  const romanFontSize = 76;
  const romanText = roman;
  const romanChipW = Math.max(romanText.length * 40 + 40, 200);
  const romanChipX = W - romanChipW - 72;
  const romanChipY = 200;
  const romanChipH = 110;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="geometricPrecision">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0A0716"/>
      <stop offset="0.42" stop-color="#2b1a4d"/>
      <stop offset="0.82" stop-color="#6A1E3A"/>
      <stop offset="1" stop-color="#FF7A5C"/>
    </linearGradient>
    <radialGradient id="sun" cx="82%" cy="80%" r="48%">
      <stop offset="0" stop-color="#FFD089" stop-opacity="0.65"/>
      <stop offset="0.55" stop-color="#FF7A5C" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#FF7A5C" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow" cx="10%" cy="15%" r="55%">
      <stop offset="0" stop-color="#5F3DC4" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#5F3DC4" stop-opacity="0"/>
    </radialGradient>
    <style>
      .kick { font-family: 'JetBrains Mono', 'Menlo', monospace; font-size: 20px; letter-spacing: 0.28em; fill: #F4ECDC; opacity: 0.72; text-transform: uppercase; }
      .url  { font-family: 'JetBrains Mono', 'Menlo', monospace; font-size: 22px; letter-spacing: 0.3em; fill: #F0B94A; text-transform: uppercase; }
      .name { font-family: 'DM Serif Display', 'Times New Roman', serif; fill: #F4ECDC; font-size: 128px; letter-spacing: -0.02em; }
      .roman{ font-family: 'DM Serif Display', 'Times New Roman', serif; fill: #F0B94A; font-size: ${romanFontSize}px; letter-spacing: -0.01em; }
      .title{ font-family: 'DM Serif Display', 'Times New Roman', serif; fill: #F4ECDC; font-size: 52px; letter-spacing: -0.01em; font-style: italic; }
      .dek  { font-family: 'Inter', 'Helvetica', sans-serif; font-weight: 400; fill: #F4ECDC; opacity: 0.88; font-size: 24px; }
    </style>
  </defs>

  <!-- background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#sun)"/>

  <!-- kicker top-left -->
  <text x="72" y="98" class="kick">${esc(kicker)}</text>

  <!-- noggles top-right -->
  ${noggles(nogX, nogY, nogCell)}

  <!-- roman numeral chip (black inline) under noggles -->
  <rect x="${romanChipX}" y="${romanChipY}" width="${romanChipW}" height="${romanChipH}" fill="#000000"/>
  <text x="${romanChipX + romanChipW / 2}" y="${romanChipY + romanChipH / 2 + 26}" text-anchor="middle" class="roman">${esc(romanText)}</text>

  <!-- PointCast wordmark (left column, sits under kicker) -->
  <text x="72" y="280" class="name">PointCast</text>

  <!-- title (italic) -->
  <text x="72" y="400" class="title">${esc(title)}</text>

  <!-- dek -->
  <text x="72" y="470" class="dek">${esc(dek)}</text>

  <!-- URL bottom-left -->
  <text x="72" y="570" class="url">${esc(url)}</text>
</svg>`;
}

async function renderDeck(deck) {
  const svg = posterSvg(deck);
  const png = new Resvg(svg, {
    background: '#0A0716',
    fitTo: { mode: 'width', value: W },
    font: {
      loadSystemFonts: true,
    },
  })
    .render()
    .asPng();
  const outPath = path.join(OUT_DIR, `${deck.slug}.png`);
  await fs.writeFile(outPath, png);
  return { slug: deck.slug, bytes: png.length, path: outPath };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const only = process.argv[2];
  const targets = only ? DECKS.filter((d) => d.slug === only) : DECKS;
  if (only && targets.length === 0) {
    console.error(`unknown deck slug: ${only}. known: ${DECKS.map((d) => d.slug).join(', ')}`);
    process.exit(1);
  }
  const results = [];
  for (const deck of targets) {
    const r = await renderDeck(deck);
    results.push(r);
    console.log(`rendered ${r.slug} → ${r.path} (${(r.bytes / 1024).toFixed(1)} kb)`);
  }
  console.log(`\n${results.length} poster${results.length === 1 ? '' : 's'} written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
