#!/usr/bin/env node
/**
 * build-passport-posters — compose the gpt-image-2 Passport Stamps poster set.
 *
 * Source art lives in public/posters/passport/sources/{slug}.png. This script
 * overlays exact campaign typography and writes 1200×1800 PNG posters to
 * public/posters/passport/{slug}.png.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const W = 1200;
const H = 1800;
const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, 'src/data/passport-posters.json');
const OUT_DIR = path.join(ROOT, 'public/posters/passport');

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[char]));

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function tspans(lines, x, y, lineHeight, attrs = '') {
  return lines
    .map((line, index) => `<tspan x="${x}" y="${y + index * lineHeight}"${attrs}>${esc(line)}</tspan>`)
    .join('');
}

function stampPills(codes, accent) {
  const pillW = 76;
  const gap = 12;
  const totalW = codes.length * pillW + Math.max(0, codes.length - 1) * gap;
  const startX = W - 78 - totalW;
  return codes
    .map((code, index) => {
      const x = startX + index * (pillW + gap);
      return `
        <rect x="${x}" y="78" width="${pillW}" height="42" rx="0" fill="${accent}" opacity="0.96"/>
        <text x="${x + pillW / 2}" y="105" text-anchor="middle" class="pill">${esc(code)}</text>`;
    })
    .join('');
}

async function posterSvg(poster, sourcePath) {
  const source = await fs.readFile(sourcePath);
  const encoded = source.toString('base64');
  const bodyLines = wrapText(poster.body, 39).slice(0, 3);
  const titleLines = wrapText(poster.title.toUpperCase(), 12).slice(0, 2);
  const subtitleLines = wrapText(poster.subtitle.toUpperCase(), 28).slice(0, 2);
  const accent = poster.accent || '#F0B94A';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#050505" stop-opacity="0.70"/>
      <stop offset="1" stop-color="#050505" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bottomShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#050505" stop-opacity="0"/>
      <stop offset="0.34" stop-color="#050505" stop-opacity="0.64"/>
      <stop offset="1" stop-color="#050505" stop-opacity="0.96"/>
    </linearGradient>
    <style>
      .mono { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 500; letter-spacing: 0; }
      .sans { font-family: 'Inter', 'Helvetica', sans-serif; font-weight: 500; letter-spacing: 0; }
      .copy { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 400; letter-spacing: 0; }
      .kicker { font-size: 24px; fill: #F8F2E8; }
      .num { font-size: 32px; fill: ${accent}; }
      .pill { font-family: 'JetBrains Mono', 'Menlo', monospace; font-weight: 500; font-size: 18px; fill: #080806; letter-spacing: 0; }
      .title { font-size: 108px; fill: #FFF8EA; }
      .subtitle { font-size: 34px; fill: ${accent}; }
      .body { font-size: 28px; fill: #F8F2E8; opacity: 0.92; }
      .badge { font-size: 23px; fill: #080806; }
      .footer { font-size: 18px; fill: #F8F2E8; opacity: 0.78; }
    </style>
  </defs>

  <image href="data:image/png;base64,${encoded}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${W}" height="${H}" fill="url(#topShade)"/>
  <rect y="720" width="${W}" height="1080" fill="url(#bottomShade)"/>
  <rect x="46" y="46" width="${W - 92}" height="${H - 92}" fill="none" stroke="#F8F2E8" stroke-opacity="0.72" stroke-width="2"/>
  <rect x="60" y="60" width="${W - 120}" height="${H - 120}" fill="none" stroke="${accent}" stroke-opacity="0.68" stroke-width="4"/>

  <text x="78" y="108" class="mono kicker">${esc(poster.kicker)}</text>
  <text x="78" y="154" class="mono num">POSTER ${esc(poster.number)}</text>
  ${stampPills(poster.stampCodes || [], accent)}

  <g transform="translate(0 0)">
    <text class="sans title">${tspans(titleLines, 76, 1290, 116)}</text>
    <text class="mono subtitle">${tspans(subtitleLines, 82, 1470, 46)}</text>
    <text class="copy body">${tspans(bodyLines, 82, 1586, 42)}</text>
  </g>

  <rect x="78" y="1668" width="${Math.max(188, poster.badge.length * 15 + 34)}" height="45" fill="${accent}" opacity="0.96"/>
  <text x="96" y="1698" class="mono badge">${esc(poster.badge)}</text>
  <text x="78" y="1748" class="mono footer">${esc(poster.cta)}</text>
  <text x="${W - 78}" y="1748" text-anchor="end" class="mono footer">OPENAI · GPT-IMAGE-2 · TEZOS</text>
</svg>`;
}

async function renderPoster(poster) {
  const sourcePath = path.join(ROOT, 'public', poster.sourceImage.replace(/^\//, ''));
  const outPath = path.join(ROOT, 'public', poster.image.replace(/^\//, ''));
  await fs.access(sourcePath);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const svg = await posterSvg(poster, sourcePath);
  const png = new Resvg(svg, {
    background: '#080806',
    fitTo: { mode: 'width', value: W },
    font: { loadSystemFonts: true },
  })
    .render()
    .asPng();
  await fs.writeFile(outPath, png);
  return { slug: poster.slug, bytes: png.length, path: outPath };
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
  const only = process.argv[2];
  const posters = only
    ? manifest.posters.filter((poster) => poster.slug === only)
    : manifest.posters;

  if (only && posters.length === 0) {
    console.error(`unknown passport poster slug: ${only}`);
    process.exit(1);
  }

  const results = [];
  for (const poster of posters) {
    const result = await renderPoster(poster);
    results.push(result);
    console.log(`rendered ${result.slug} -> ${result.path} (${(result.bytes / 1024 / 1024).toFixed(2)} MB)`);
  }
  console.log(`\n${results.length} passport poster${results.length === 1 ? '' : 's'} written to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
