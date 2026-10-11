#!/usr/bin/env node
// Builds src/data/currency-builder/glyphs.json: outline paths and advance
// widths for the characters Currency Builder notes use, from the OFL fonts in
// src/assets/currency-builder/fonts. Notes then draw text as paths, so print
// files never depend on installed fonts and every width is measured exactly.
//
// Run after adding currencies with new characters:
//   node scripts/build-currency-builder-glyphs.mjs
import { create } from 'fontkitten';
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, ROOT));
const FONTS = 'src/assets/currency-builder/fonts/';

const STYLES = {
  title: { file: 'Cinzel-wght.ttf', variation: { wght: 700 }, credit: 'Cinzel (OFL)' },
  caps: { file: 'Cinzel-wght.ttf', variation: { wght: 500 }, credit: 'Cinzel (OFL)' },
  numeral: { file: 'BodoniModa-opsz-wght.ttf', variation: { opsz: 96, wght: 800 }, credit: 'Bodoni Moda (OFL)' },
  body: { file: 'BodoniModa-opsz-wght.ttf', variation: { opsz: 11, wght: 500 }, credit: 'Bodoni Moda (OFL)' },
  serial: { file: 'IBMPlexMono-SemiBold.ttf', variation: null, credit: 'IBM Plex Mono (OFL)' },
};

// Every character the notes can draw: printable ASCII, Latin-1, typographic
// punctuation, and whatever the collection data actually contains.
const chars = new Set();
for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCodePoint(c));
for (let c = 0xa0; c <= 0xff; c++) chars.add(String.fromCodePoint(c));
for (const ch of '·–—‘’“”…•×№') chars.add(ch);
for (const file of ['src/data/currency-builder/commons-40.json', 'src/data/currency-builder/barter-100.json']) {
  const text = read(file).toString('utf8');
  for (const ch of text) chars.add(ch);
  for (const ch of text.toUpperCase()) chars.add(ch);
}
for (const ch of [...chars]) for (const part of ch.normalize('NFD')) chars.add(part);

// Each style only carries what it draws: numerals and serials are small sets,
// the engraved caps only need uppercase, and the body face takes everything.
const PUNCT = ' .,·-–—:;!?/()&#%+\'‘’“”"…×';
const upper = new Set([...chars].filter((ch) => ch === ch.toUpperCase()));
const SETS = {
  title: upper,
  caps: upper,
  numeral: new Set([...'0123456789', ...PUNCT]),
  serial: new Set([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', ...PUNCT]),
  body: chars,
};

const round = (n) => Math.round(n * 10) / 10;
function compactPath(d) {
  return d.replace(/-?\d+\.\d+/g, (m) => String(round(parseFloat(m))));
}

const out = { generated: 'scripts/build-currency-builder-glyphs.mjs', fonts: {}, styles: {} };
for (const [name, style] of Object.entries(STYLES)) {
  const base = create(read(FONTS + style.file));
  const font = style.variation ? base.getVariation(style.variation) : base;
  const glyphs = {};
  let missing = [];
  for (const ch of [...SETS[name]].sort()) {
    if (ch === '\n' || ch === '\r' || ch === '\t') continue;
    const cp = ch.codePointAt(0);
    if (!font.hasGlyphForCodePoint(cp)) { missing.push(ch); continue; }
    const glyph = font.glyphForCodePoint(cp);
    glyphs[ch] = [round(glyph.advanceWidth), compactPath(glyph.path.toSVG())];
  }
  out.styles[name] = {
    font: style.credit,
    unitsPerEm: base.unitsPerEm,
    ascent: base.ascent,
    descent: base.descent,
    capHeight: base.capHeight,
    xHeight: base.xHeight,
    glyphs,
  };
  out.fonts[style.credit] = `src/assets/currency-builder/fonts/${style.file}`;
  const shown = missing.filter((ch) => ch.trim() && !/[̀-ͯ]/.test(ch));
  console.log(`${name}: ${Object.keys(glyphs).length} glyphs${shown.length ? `, missing ${shown.join(' ')}` : ''}`);
}
writeFileSync(new URL('src/data/currency-builder/glyphs.json', ROOT), JSON.stringify(out));
console.log('wrote src/data/currency-builder/glyphs.json');
