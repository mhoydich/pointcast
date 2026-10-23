/**
 * Build PointCast Script from scripts/signature/glyphs.mjs.
 *
 *   node scripts/signature/build-font.mjs
 *
 * Writes:
 *   public/signature/fonts/pointcast-script/PointCastScript.ttf
 *   public/signature/paths/pointcast-script.json
 *
 * Re-run this after adding or changing a glyph. See
 * public/signature/fonts/pointcast-script/README.md.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import opentype from 'opentype.js';
import { ASCENDER, DESCENDER, GLYPHS, SLANT, SPACE, UNITS } from './glyphs.mjs';
import { glyphContours } from './pen.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const TTF = resolve(ROOT, 'public/signature/fonts/pointcast-script/PointCastScript.ttf');
const JSON_PATH = resolve(ROOT, 'public/signature/paths/pointcast-script.json');

function commandsOf(d) {
  const out = [];
  const re = /([MLZ])|(-?\d*\.?\d+)/gi;
  let cmd = '';
  let args = [];
  const flush = () => {
    if (!cmd) return;
    out.push({ cmd, args: args.slice() });
    args = [];
  };
  for (const m of d.matchAll(re)) {
    if (m[1]) {
      flush();
      cmd = m[1].toUpperCase();
      if (cmd === 'Z') flush();
    } else args.push(Number(m[0]));
  }
  flush();
  return out;
}

function toOpentypePath(contours) {
  const path = new opentype.Path();
  for (const d of contours) {
    let x = 0;
    let y = 0;
    let open = false;
    for (const tok of commandsOf(d)) {
      if (tok.cmd === 'M') {
        x = tok.args[0];
        y = tok.args[1];
        path.moveTo(x, y);
        open = true;
      } else if (tok.cmd === 'L') {
        for (let i = 0; i < tok.args.length; i += 2) {
          x = tok.args[i];
          y = tok.args[i + 1];
          path.lineTo(x, y);
        }
      } else if (tok.cmd === 'Z' && open) {
        path.close();
        open = false;
      }
    }
  }
  return path;
}

export function buildGlyph(ch, spec) {
  const contours = glyphContours(spec.strokes, SLANT);
  let maxX = 0;
  for (const d of contours) {
    for (const n of d.matchAll(/-?\d*\.?\d+/g)) maxX = Math.max(maxX, Number(n[0]));
  }
  const advance = spec.advance || Math.ceil(maxX + 40) || SPACE;
  return { ch, contours, advance, unicode: spec.unicode || ch.codePointAt(0) };
}

export function buildFont() {
  const built = [];
  for (const [ch, spec] of Object.entries(GLYPHS)) built.push(buildGlyph(ch, spec));
  const notdef = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 360,
    path: toOpentypePath(glyphContours([{ d: 'M 40 0 L 320 0 L 320 700 L 40 700 Z', w: 28, pressure: false }], SLANT)),
  });
  const glyphs = [notdef];
  const jsonGlyphs = {};
  for (const g of built) {
    const name = g.ch === ' ' ? 'space' : g.ch;
    glyphs.push(new opentype.Glyph({
      name,
      unicode: g.unicode,
      advanceWidth: g.advance,
      path: toOpentypePath(g.contours),
    }));
    if (g.ch !== ' ') jsonGlyphs[g.ch] = { advance: g.advance, contours: g.contours };
  }
  const font = new opentype.Font({
    familyName: 'PointCast Script',
    styleName: 'Regular',
    unitsPerEm: UNITS,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs,
  });
  font.names.designer = { en: 'PointCast' };
  font.names.description = { en: 'PointCast Script, an original signature face drawn for pointcast.xyz/signature.' };
  font.names.license = { en: 'This Font Software is licensed under the SIL Open Font License, Version 1.1.' };
  font.names.licenseURL = { en: 'https://scripts.sil.org/OFL' };
  const json = {
    id: 'pointcast-script',
    family: 'PointCast Script',
    license: 'OFL-1.1',
    unitsPerEm: UNITS,
    ascender: ASCENDER,
    descender: DESCENDER,
    space: GLYPHS[' '].advance,
    glyphs: jsonGlyphs,
  };
  return { font, json };
}

function main() {
  const { font, json } = buildFont();
  mkdirSync(dirname(TTF), { recursive: true });
  mkdirSync(dirname(JSON_PATH), { recursive: true });
  writeFileSync(TTF, Buffer.from(font.toArrayBuffer()));
  writeFileSync(JSON_PATH, JSON.stringify(json));
  console.log(`wrote ${TTF} (${font.glyphs.length} glyphs)`);
  console.log(`wrote ${JSON_PATH}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
