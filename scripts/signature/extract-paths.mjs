/**
 * Turn the shipped open-licensed TTFs into the path JSON Signature Studio draws.
 *
 *   node scripts/signature/extract-paths.mjs
 *
 * The studio renders vectors from these files. It does not download a font
 * at view time. Re-run after you add a TTF and a catalog row. See
 * public/signature/fonts/README.md.
 */

import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import opentype from 'opentype.js';

const ROOT = resolve(import.meta.dirname, '../..');
const OUT = resolve(ROOT, 'public/signature/paths');

/** Characters a name, a date and a short sign-off need. */
export const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,\'-!?&';

const round = (n) => Math.round(n * 100) / 100;

function contourFromCommands(commands) {
  let d = '';
  for (const c of commands) {
    if (c.type === 'M') d += `M ${round(c.x)} ${round(-c.y)} `;
    else if (c.type === 'L') d += `L ${round(c.x)} ${round(-c.y)} `;
    else if (c.type === 'Q') d += `Q ${round(c.x1)} ${round(-c.y1)} ${round(c.x)} ${round(-c.y)} `;
    else if (c.type === 'C') d += `C ${round(c.x1)} ${round(-c.y1)} ${round(c.x2)} ${round(-c.y2)} ${round(c.x)} ${round(-c.y)} `;
    else if (c.type === 'Z') d += 'Z ';
  }
  return d.trim();
}

/**
 * opentype.js getPath uses y-down canvas coordinates with the baseline at the
 * y you pass. Negating y puts the contour back in font units, y up, the same
 * space PointCast Script uses.
 */
export function extractFont(file, { id, family, license }) {
  const font = opentype.loadSync(file);
  const glyphs = {};
  const missing = [];
  for (const ch of CHARSET) {
    const g = font.charToGlyph(ch);
    if (!g || g.name === '.notdef' || !g.unicode) {
      missing.push(ch);
      continue;
    }
    const path = g.getPath(0, 0, font.unitsPerEm);
    const contours = [];
    let current = [];
    for (const c of path.commands) {
      if (c.type === 'M' && current.length) {
        contours.push(contourFromCommands(current));
        current = [];
      }
      current.push(c);
      if (c.type === 'Z') {
        contours.push(contourFromCommands(current));
        current = [];
      }
    }
    if (current.length) contours.push(contourFromCommands(current));
    glyphs[ch] = { advance: g.advanceWidth, contours: contours.filter(Boolean) };
  }
  const space = font.charToGlyph(' ').advanceWidth || Math.round(font.unitsPerEm / 4);
  return {
    id,
    family: family || font.names.fontFamily.en,
    license,
    unitsPerEm: font.unitsPerEm,
    ascender: font.ascender,
    descender: font.descender,
    space,
    missing,
    glyphs,
  };
}

export const FACES = [
  { id: 'dancing-script', dir: 'dancing-script', family: 'Dancing Script', license: 'OFL-1.1' },
  { id: 'great-vibes', dir: 'great-vibes', family: 'Great Vibes', license: 'OFL-1.1' },
  { id: 'allura', dir: 'allura', family: 'Allura', license: 'OFL-1.1' },
  { id: 'sacramento', dir: 'sacramento', family: 'Sacramento', license: 'OFL-1.1' },
  { id: 'mrs-saint-delafield', dir: 'mrs-saint-delafield', family: 'Mrs Saint Delafield', license: 'OFL-1.1' },
  { id: 'herr-von-muellerhoff', dir: 'herr-von-muellerhoff', family: 'Herr Von Muellerhoff', license: 'OFL-1.1' },
  { id: 'homemade-apple', dir: 'homemade-apple', family: 'Homemade Apple', license: 'Apache-2.0' },
];

function main() {
  mkdirSync(OUT, { recursive: true });
  for (const face of FACES) {
    const dir = resolve(ROOT, 'public/signature/fonts', face.dir);
    const ttf = readdirSync(dir).find((f) => f.endsWith('.ttf'));
    if (!ttf) throw new Error('no ttf in ' + dir);
    const json = extractFont(resolve(dir, ttf), face);
    const missing = json.missing;
    delete json.missing;
    writeFileSync(resolve(OUT, face.id + '.json'), JSON.stringify(json));
    console.log(`${face.id}: ${Object.keys(json.glyphs).length} glyphs${missing.length ? ', missing ' + missing.join('') : ''}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
