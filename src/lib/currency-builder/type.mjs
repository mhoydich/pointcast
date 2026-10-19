/**
 * Outlined type for Currency Builder notes. Text is drawn as glyph paths from
 * src/data/currency-builder/glyphs.json (Cinzel, Bodoni Moda, IBM Plex Mono;
 * all OFL), so print files never depend on installed fonts and every width is
 * measured, not guessed.
 */
import GLYPHS from '../../data/currency-builder/glyphs.json' with { type: 'json' };

const SUBSTITUTES = { 'ʻ': '‘', '­': '', '№': 'No.', '\n': ' ' };

function styleOf(name) {
  const style = GLYPHS.styles[name];
  if (!style) throw new Error(`unknown type style: ${name}`);
  return style;
}

/** A small hook above (Vietnamese dấu hỏi) for faces that lack U+0309. */
function hookAbove(style, x, advance) {
  const u = style.unitsPerEm;
  const cx = x + advance * 0.62;
  const top = style.capHeight + u * 0.2;
  const s = u / 1000;
  return `M${cx - 32 * s} ${top + 70 * s}Q${cx - 30 * s} ${top + 150 * s} ${cx + 30 * s} ${top + 150 * s}Q${cx + 80 * s} ${top + 140 * s} ${cx + 70 * s} ${top + 95 * s}Q${cx + 60 * s} ${top + 60 * s} ${cx + 10 * s} ${top + 55 * s}L${cx + 8 * s} ${top + 20 * s}L${cx - 12 * s} ${top + 20 * s}L${cx - 10 * s} ${top + 75 * s}Q${cx + 40 * s} ${top + 80 * s} ${cx + 45 * s} ${top + 100 * s}Q${cx + 45 * s} ${top + 122 * s} ${cx + 22 * s} ${top + 124 * s}Q${cx - 8 * s} ${top + 124 * s} ${cx - 10 * s} ${top + 70 * s}Z`;
}

/** Resolve one character to glyph records: [advance, path, extraPath?]. */
function glyphsFor(style, ch) {
  const sub = SUBSTITUTES[ch];
  if (sub !== undefined) return [...sub].flatMap((c) => glyphsFor(style, c));
  const direct = style.glyphs[ch];
  if (direct) return [{ advance: direct[0], path: direct[1] }];
  // Compose from a precomposed base plus the marks the face lacks.
  const parts = [...ch.normalize('NFD')];
  for (let keep = parts.length - 1; keep >= 1; keep--) {
    const base = parts.slice(0, keep).join('').normalize('NFC');
    const glyph = style.glyphs[base];
    if (!glyph) continue;
    const rest = parts.slice(keep);
    return [{ advance: glyph[0], path: glyph[1], marks: rest }];
  }
  const space = style.glyphs[' '];
  return [{ advance: space ? space[0] : style.unitsPerEm / 3, path: '' }];
}

/** Shift every absolute x in a path (fontkit emits only M, L, Q, C, Z). */
function shiftPath(d, dx) {
  if (!dx) return d;
  let i = 0;
  return d.replace(/([MLQCZ])([^MLQCZ]*)/g, (_, cmd, args) => {
    if (cmd === 'Z') return 'Z';
    const nums = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    const moved = nums.map((n, k) => (k % 2 === 0 ? Math.round((n + dx) * 10) / 10 : n));
    i += 1;
    return cmd + moved.join(' ');
  });
}

function layout(styleName, text, tracking = 0, size = 1) {
  const style = styleOf(styleName);
  const k = size / style.unitsPerEm;
  const trackUnits = tracking / k;
  let x = 0;
  const pieces = [];
  const chars = [...String(text)];
  chars.forEach((ch, index) => {
    for (const g of glyphsFor(style, ch)) {
      if (g.path) pieces.push(shiftPath(g.path, x));
      for (const mark of g.marks ?? []) {
        if (mark === '̉') pieces.push(hookAbove(style, x, g.advance));
      }
      x += g.advance;
    }
    if (index < chars.length - 1) x += trackUnits;
  });
  return { style, d: pieces.join(''), widthUnits: x, k };
}

/** Width in user units of text set at `size` with `tracking` user units between letters. */
export function measure(styleName, text, size, tracking = 0) {
  const { widthUnits, k } = layout(styleName, text, tracking, size);
  return widthUnits * k;
}

/** Largest size (≤ size) at which the text fits maxWidth. */
export function fitSize(styleName, text, size, maxWidth, tracking = 0) {
  const width = measure(styleName, text, size, tracking);
  return width <= maxWidth ? size : Math.floor((size * maxWidth) / width * 10) / 10;
}

/**
 * Text as one outlined <path>. Options: x, y (baseline), size, tracking,
 * anchor ('start' | 'middle' | 'end'), fill, opacity, maxWidth (shrinks to fit),
 * extra (raw attributes).
 */
export function text(styleName, value, opts) {
  const { x, y, tracking = 0, anchor = 'start', fill = '#000', opacity, maxWidth, extra = '' } = opts;
  let size = opts.size;
  if (maxWidth) size = fitSize(styleName, value, size, maxWidth, tracking);
  const { d, widthUnits, k } = layout(styleName, value, tracking, size);
  const width = widthUnits * k;
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  const op = opacity == null ? '' : ` opacity="${opacity}"`;
  const r = (n) => Math.round(n * 1000) / 1000;
  return `<path transform="translate(${r(left)} ${r(y)}) scale(${r(k * 1e3) / 1e3} ${-r(k * 1e3) / 1e3})" fill="${fill}"${op}${extra ? ' ' + extra : ''} d="${d}"/>`;
}

/** Text wrapped to maxWidth, returning lines (strings) measured in this style. */
export function wrapMeasured(styleName, value, size, maxWidth, tracking = 0) {
  const lines = [];
  let line = '';
  for (const word of String(value).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(styleName, next, size, tracking) > maxWidth) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export const TYPE_CREDITS = Object.keys(GLYPHS.fonts);

/**
 * A per-document typesetter that defines each glyph once in <defs> and places
 * it with <use>, so repeated letters cost a few bytes instead of a full outline.
 */
export function typesetter(prefix = 't') {
  const used = new Map();
  function glyphId(styleName, ch, path) {
    const key = `${styleName}\u0000${ch}`;
    if (!used.has(key)) used.set(key, { id: `${prefix}${used.size.toString(36)}`, path });
    return used.get(key).id;
  }
  function draw(styleName, value, opts) {
    const { x, y, tracking = 0, anchor = 'start', fill = '#000', opacity, maxWidth, extra = '' } = opts;
    let size = opts.size;
    if (maxWidth) size = fitSize(styleName, value, size, maxWidth, tracking);
    const style = styleOf(styleName);
    const k = size / style.unitsPerEm;
    const trackUnits = tracking / k;
    let pen = 0;
    const uses = [];
    const chars = [...String(value)];
    chars.forEach((ch, index) => {
      for (const g of glyphsFor(style, ch)) {
        if (g.path) uses.push(`<use href="#${glyphId(styleName, ch.normalize('NFC') + (g.marks ? '+' : ''), g.path)}" x="${Math.round(pen)}"/>`);
        for (const mark of g.marks ?? []) {
          if (mark === '̉') uses.push(`<path d="${hookAbove(style, pen, g.advance)}"/>`);
        }
        pen += g.advance;
      }
      if (index < chars.length - 1) pen += trackUnits;
    });
    const width = pen * k;
    const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
    const r = (n) => Math.round(n * 1000) / 1000;
    const op = opacity == null ? '' : ` opacity="${opacity}"`;
    return `<g transform="translate(${r(left)} ${r(y)}) scale(${r(k * 1e4) / 1e4} ${-r(k * 1e4) / 1e4})" fill="${fill}"${op}${extra ? ' ' + extra : ''}>${uses.join('')}</g>`;
  }
  function defs() {
    return [...used.values()].map((g) => `<path id="${g.id}" d="${g.path}"/>`).join('');
  }
  return { text: draw, defs, measure, fitSize, wrap: wrapMeasured };
}
