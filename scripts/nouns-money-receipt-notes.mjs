#!/usr/bin/env node
// Nouns Money receipt notes: one free CC0 note per office-wallet buy.
// Usage: node scripts/nouns-money-receipt-notes.mjs [buys.json] [outDir]
// Writes NM-RCPT-<n>.svg per buy plus manifest.json. The Noun is a whole CC0 Noun
// (body, accessory, head, glasses) from the official image data, seeded by sha256 of
// the serial, so nobody picks the face. No prices or amounts ever appear on a note.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const data = JSON.parse(readFileSync(join(root, 'public/images/nouns-money/source-100/sources/official-image-data.json'), 'utf8'));

export function decode(hex) {
  const b = Buffer.from(hex.replace(/^0x/, ''), 'hex');
  const [, top, right, , left] = b;
  const px = [];
  let x = left;
  let y = top;
  for (let i = 5; i < b.length; i += 2) {
    const len = b[i];
    const color = b[i + 1];
    for (let k = 0; k < len; k++) {
      if (color !== 0) px.push([x, y, data.palette[color]]);
      x++;
      if (x === right) { x = left; y++; }
    }
  }
  return px;
}

export function pickNoun(seed) {
  const h = createHash('sha256').update(seed).digest();
  const im = data.images;
  const at = (arr, i) => arr[h.readUInt16BE(i) % arr.length];
  return {
    bg: data.bgcolors[h[10] % data.bgcolors.length],
    body: at(im.bodies, 0),
    accessory: at(im.accessories, 2),
    head: at(im.heads, 4),
    glasses: at(im.glasses, 6),
  };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function receiptSvg(buy) {
  const serial = `NM-RCPT-${String(buy.n).padStart(3, '0')}`;
  const noun = pickNoun(`${serial}:${buy.ticker}:${buy.date}`);
  const W = 240;
  const H = 400;
  const ink = '#1C1A16';
  const mono = 'ui-monospace, Menlo, monospace';
  const serif = 'Iowan Old Style, Palatino, Georgia, serif';
  let d = `M0 0H${W}V${H - 10}`;
  for (let x = W; x >= 0; x -= 12) d += `L${x} ${H - ((x / 12) % 2 ? 0 : 10)}`;
  d += 'Z';
  const out = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 10}" height="${H * 10}">`,
    `<rect width="${W}" height="${H}" fill="#EAE5D6"/>`,
    `<path d="${d}" fill="#FBF9F3"/>`,
  ];
  // Later attributes override the defaults (an SVG parser keeps only the first copy of an attribute).
  const t = (y, s, a = '') => {
    const attrs = { 'font-family': mono, 'font-size': '11', 'letter-spacing': '1.5', fill: ink };
    for (const [, k, v] of a.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[k] = v;
    const list = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    out.push(`<text x="${W / 2}" y="${y}" text-anchor="middle" ${list}>${esc(s)}</text>`);
  };
  t(30, 'NOUNS MONEY PRINTERS', 'font-weight="700" font-size="12"');
  t(44, 'OPEN LATE', 'font-size="9"');
  out.push(`<line x1="18" y1="54" x2="${W - 18}" y2="54" stroke="${ink}" stroke-dasharray="3 3"/>`);
  t(74, `RECEIPT NOTE ${serial.slice(8)}`);
  t(90, `COIN SIDE: $${buy.ticker}`, 'font-size="10"');
  const s = 3;
  const ox = W / 2 - 48;
  const oy = 100;
  out.push(`<g shape-rendering="crispEdges"><rect x="${ox}" y="${oy}" width="96" height="96" fill="#${noun.bg}"/>`);
  for (const part of [noun.body, noun.accessory, noun.head, noun.glasses]) {
    for (const [x, y, c] of decode(part.data)) out.push(`<rect x="${ox + x * s}" y="${oy + y * s}" width="${s}" height="${s}" fill="#${c}"/>`);
  }
  out.push('</g>');
  t(218, 'good for', `font-family="${serif}" font-style="italic" font-size="14" letter-spacing="0"`);
  t(243, buy.good, `font-family="${serif}" font-size="20" letter-spacing="0"`);
  out.push(`<line x1="18" y1="260" x2="${W - 18}" y2="260" stroke="${ink}" stroke-dasharray="3 3"/>`);
  out.push(`<text x="20" y="286" font-family="${mono}" font-size="11" letter-spacing="1.5" fill="${ink}">FOR</text>`);
  out.push(`<line x1="50" y1="288" x2="${W - 20}" y2="288" stroke="${ink}"/>`);
  t(314, `PRINTED ${buy.date}`, 'font-size="9"');
  t(330, 'FREE · CC0 · NO CASH VALUE', 'font-size="9" letter-spacing="0.8"');
  t(346, 'NOT LEGAL TENDER. JUST TENDER.', 'font-size="8.5" letter-spacing="0.4" fill="#B8321F"');
  t(366, serial, 'font-size="10" font-weight="700" fill="#B8321F"');
  out.push('</svg>');
  return { serial, noun, svg: out.join('\n') };
}

export function buildManifest(buys) {
  return buys.map((b) => {
    const r = receiptSvg(b);
    return {
      serial: r.serial,
      file: `${r.serial}.png`,
      name: `Receipt Note ${r.serial.slice(8)} · $${b.ticker}`,
      goodFor: b.good,
      coinSide: b.ticker,
      printed: b.date,
      receipt: b.receipt,
      traits: {
        background: r.noun.bg,
        body: r.noun.body.filename,
        accessory: r.noun.accessory.filename,
        head: r.noun.head.filename,
        glasses: r.noun.glasses.filename,
      },
      edition: 1,
      price: 'free, listed at 0 tez',
      royalty: 0,
      rights: 'CC0',
      description: `Nouns Money receipt note ${r.serial.slice(8)}. The office bought $${b.ticker}; the printer made this note, good for ${b.good}. It is finished when someone names who it's for. Free, CC0, no cash value. Not legal tender, just tender. Not affiliated with Nouns DAO.`,
      svg: r.svg,
    };
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const buysPath = process.argv[2] || join(root, 'art/nouns-money/receipt-notes/buys.json');
  const outDir = process.argv[3] || join(root, 'art/nouns-money/receipt-notes');
  const { buys } = JSON.parse(readFileSync(buysPath, 'utf8'));
  mkdirSync(outDir, { recursive: true });
  const notes = buildManifest(buys);
  for (const n of notes) writeFileSync(join(outDir, `${n.serial}.svg`), n.svg);
  const manifest = { collection: 'Nouns Money · Receipt Notes', notes: notes.map(({ svg, ...rest }) => rest) };
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`wrote ${notes.length} receipt notes to ${outDir}`);
}
