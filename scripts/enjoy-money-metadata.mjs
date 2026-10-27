#!/usr/bin/env node

/**
 * Write Enjoy. Money TZIP-16 contract metadata, TZIP-21 token metadata and the
 * note art SVGs. Token definitions mirror TOKENS in
 * contracts/enjoy-money/enjoy_money_fa2.py; tests/enjoy-money-contract.test.mjs
 * keeps the two in step.
 *
 *   node scripts/enjoy-money-metadata.mjs                      testnet: https art on pointcast.xyz
 *   node scripts/enjoy-money-metadata.mjs --art-base ipfs://CID --out /tmp/enjoy-ipfs
 *                                                               mainnet: after the final art is pinned
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_ART_BASE = 'https://pointcast.xyz/nouns-money/enjoy/art';
const DEFAULT_OUT = path.join(ROOT, 'public/nouns-money/enjoy');
const CLOSED_LOOP = 'Closed loop: no cash value, no redemption for dollars, USDC or goods.';

export const ENJOY_TOKENS = [
  { id: 0, name: 'Enjoy. Note — Series 1', symbol: 'ENJOY', kind: 'paper-backed note', mark: 'Enjoy.', ink: '#0d3b22', paper: '#eef5e2', accent: '#b8862b',
    description: 'One Enjoy. note from Hoydich Enterprises, Series 1. Each printed note carries a serial and a one-time code; scanning it claims this token to your wallet. Signed Michael Hoydich.' },
  { id: 1, name: 'Nouns Reserve — Series 1', symbol: 'NOUNR', kind: 'paper-backed note', mark: 'Nouns Reserve', ink: '#5c1414', paper: '#fbeee6', accent: '#d63c2f',
    description: 'One Nouns Reserve note from Hoydich Enterprises, Series 1. A paper-backed note with a fixed print run, claimed by scanning its printed code.' },
  { id: 2, name: 'KansasDAO Blue Note — Series 1', symbol: 'BLUE', kind: 'paper-backed note', mark: 'Blue Note', ink: '#10285c', paper: '#e8eef9', accent: '#2f6fd6',
    description: 'One KansasDAO Blue Note from Hoydich Enterprises, Series 1. A paper-backed note with a fixed print run, claimed by scanning its printed code.' },
  { id: 3, name: 'Bot Note (Enjoy. credits)', symbol: 'BOT', kind: 'agent unit', mark: 'Bot Note', ink: '#1f2328', paper: '#f1efe8', accent: '#8a6d1f',
    description: 'Enjoy. credits for agents. Agents earn Bot Notes for approved PointCast work and spend them on priced PointCast tools. Fungible; minted only by the admin to Treasury.' },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function noteSvg(token) {
  const { ink, paper, accent, mark, symbol, id } = token;
  const markSize = mark.length > 8 ? 74 : 112;
  const lines = Array.from({ length: 22 }, (_, i) => `<path d="M60 ${120 + i * 12} Q 500 ${60 + i * 12} 940 ${120 + i * 12}" />`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" width="1000" height="500" role="img" aria-label="${esc(token.name)}">
<rect width="1000" height="500" fill="${paper}"/>
<g fill="none" stroke="${accent}" stroke-opacity=".18" stroke-width="1.2">${lines}</g>
<rect x="18" y="18" width="964" height="464" fill="none" stroke="${ink}" stroke-width="6"/>
<rect x="32" y="32" width="936" height="436" fill="none" stroke="${ink}" stroke-width="1.5"/>
<g fill="${ink}" font-family="Georgia, 'Times New Roman', serif">
<text x="60" y="110" font-size="72" font-weight="700">1</text>
<text x="940" y="440" font-size="72" font-weight="700" text-anchor="end">1</text>
<text x="500" y="96" font-size="20" letter-spacing="8" text-anchor="middle" font-family="ui-monospace, Menlo, monospace">HOYDICH ENTERPRISES</text>
<text x="500" y="${markSize > 100 ? 280 : 268}" font-size="${markSize}" font-style="italic" text-anchor="middle">${esc(mark)}</text>
<text x="500" y="330" font-size="18" letter-spacing="6" text-anchor="middle" font-family="ui-monospace, Menlo, monospace">${symbol} · SERIES 1 · TOKEN ${id}</text>
<line x1="370" y1="402" x2="630" y2="402" stroke="${ink}" stroke-width="1.5"/>
<text x="500" y="392" font-size="26" font-style="italic" text-anchor="middle">Michael Hoydich</text>
<text x="500" y="426" font-size="13" letter-spacing="4" text-anchor="middle" font-family="ui-monospace, Menlo, monospace">NO CASH VALUE · CLOSED LOOP</text>
</g>
<circle cx="160" cy="370" r="54" fill="none" stroke="${accent}" stroke-width="5"/>
<text x="160" y="380" font-size="28" font-style="italic" text-anchor="middle" fill="${accent}" font-family="Georgia, serif">E.</text>
</svg>
`;
}

export function tokenMetadata(token, artBase = DEFAULT_ART_BASE) {
  const uri = `${artBase}/${token.id}.svg`;
  return {
    name: token.name,
    symbol: token.symbol,
    decimals: 0,
    description: `${token.description} ${CLOSED_LOOP}`,
    artifactUri: uri,
    displayUri: uri,
    thumbnailUri: uri,
    formats: [{ uri, mimeType: 'image/svg+xml', fileName: `${token.id}.svg`, dimensions: { value: '1000x500', unit: 'px' } }],
    creators: ['Hoydich Enterprises'],
    publishers: ['Hoydich Enterprises'],
    tags: ['enjoy', 'hoydich-enterprises', 'series-1', token.symbol.toLowerCase()],
    attributes: [
      { name: 'issuer', value: 'Hoydich Enterprises' },
      { name: 'series', value: '1' },
      { name: 'kind', value: token.kind },
      { name: 'signed', value: 'Michael Hoydich' },
    ],
    isBooleanAmount: false,
    shouldPreferSymbol: token.id === 3,
  };
}

export function contractMetadata() {
  return {
    name: 'Enjoy. Money',
    description: `Hoydich Enterprises paper notes and bot money. Four tokens: three paper-backed Series 1 notes with fixed, sealed print runs, and the Bot Note credit for agents. ${CLOSED_LOOP}`,
    version: '1.0.0',
    license: { name: 'All rights reserved, Hoydich Enterprises' },
    authors: ['Hoydich Enterprises'],
    homepage: 'https://pointcast.xyz/nouns-money/enjoy/',
    interfaces: ['TZIP-012', 'TZIP-016', 'TZIP-021'],
  };
}

function parseArgs(argv) {
  const options = { artBase: DEFAULT_ART_BASE, out: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--art-base') options.artBase = argv[++i].replace(/\/$/, '');
    else if (argv[i] === '--out') options.out = path.resolve(argv[++i]);
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return options;
}

async function main() {
  const { artBase, out } = parseArgs(process.argv.slice(2));
  await mkdir(path.join(out, 'metadata'), { recursive: true });
  await mkdir(path.join(out, 'art'), { recursive: true });
  const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(path.join(out, 'metadata/contract.json'), json(contractMetadata()));
  for (const token of ENJOY_TOKENS) {
    await writeFile(path.join(out, 'metadata', `${token.id}.json`), json(tokenMetadata(token, artBase)));
    await writeFile(path.join(out, 'art', `${token.id}.svg`), noteSvg(token));
  }
  console.log(`Wrote contract + ${ENJOY_TOKENS.length} token metadata files and art to ${path.relative(ROOT, out) || out} (art base ${artBase}).`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  main().catch((error) => {
    console.error(`[enjoy-money-metadata] ${error.message}`);
    process.exitCode = 1;
  });
}
