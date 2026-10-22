/**
 * Security Edition (v2) — Currency Builder notes drawn the way banknotes are
 * printed: a rainbow lathe underprint with security fibers, guilloche borders
 * and rosettes, a line-engraved portrait of the note's actual Noun, a
 * watermark window, a windowed thread, a holographic stripe, a color-shift
 * numeral, a latent image, see-through register, microtext and paired serials.
 *
 * Every portrait is the full Noun, drawn from its verified on-chain seed and
 * never cropped or faded. Glasses appear only on the Noun itself: there are no
 * standalone noggle motifs.
 *
 * Every "feature" is flat-printed art: no foil, thread, window or fiber is
 * physically present. Text is outlined from OFL fonts (./type.mjs) and each
 * glyph is defined once per file. Ids are per file, so embed faces with <img>.
 * Output is deterministic.
 */
import { W, H, esc, round, rng, nounArt, placeNoun } from './primitives.mjs';
import { text as outline, typesetter, wrapMeasured, fitSize } from './type.mjs';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';


/* ---------- color ---------- */

function hexRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function rgbHex(rgb) {
  return '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function mix(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(A.map((v, i) => v + (B[i] - v) * t));
}
function luminance(hex) {
  const [r, g, b] = hexRgb(hex).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Banknote palette from a collection palette: always light paper, deep intaglio ink. */
export function securityPalette(p) {
  const dark = luminance(p.paper) < 0.35;
  const paper = dark ? '#eef2f6' : mix(p.paper, '#ffffff', 0.35);
  const ink = dark ? p.paper : p.ink;
  const text = dark ? mix(p.accent, '#000000', 0.45) : p.text;
  return {
    paper,
    ink,
    accent: p.accent,
    accent2: p.accent2,
    text,
    tintA: mix(paper, p.accent2, 0.42),
    tintB: mix(paper, p.accent, 0.38),
    tintC: mix(paper, ink, 0.22),
    lathe: mix(paper, ink, 0.45),
    red: '#b3262e',
  };
}

/* ---------- numbers ---------- */

const ONES = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
const TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
export function words(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n === 100) return 'ONE HUNDRED';
  return String(n);
}

/* ---------- document ---------- */

/** Per-file state: the typesetter, extra <defs>, and which shared defs exist. */
function newDoc(prefix) {
  return { prefix, t: typesetter(`${prefix}g`), defs: [], made: new Set() };
}

function finish(doc, p, open, body, flip = false) {
  return open + baseDefs(p, flip, doc.defs.join('') + doc.t.defs()) + body + '</svg>';
}

/* ---------- Noun pixels ---------- */

/** The Noun as a 32 × 32 grid of colors (null where the background shows). */
function nounGrid(svg) {
  const grid = Array.from({ length: 32 }, () => Array(32).fill(null));
  const re = /<rect width="(\d+)" height="10" x="(\d+)" y="(\d+)" fill="(#[0-9a-fA-F]{6})" \/>/g;
  let m;
  while ((m = re.exec(svg))) {
    const w = +m[1] / 10, x = +m[2] / 10, y = +m[3] / 10;
    for (let i = 0; i < w; i++) grid[y][x + i] = m[4];
  }
  return grid;
}

/** The note's full Noun, plus its head alone for the foil silhouette. */
function nounFor(nounId) {
  const art = nounArt(nounId);
  const head = nounArt(nounId, { layers: ['head'] });
  return { art, grid: nounGrid(art.svg), head: nounGrid(head.svg) };
}

/**
 * Largest size (≤ max) at which every pixel of the Noun, centered, fits inside
 * an ellipse with semi-axes a × b, so no part of the Noun is ever cut off.
 */
function fitNoun(grid, a, b, max) {
  let m = 0;
  for (let r = 0; r < 32; r++) for (let c = 0; c < 32; c++) {
    if (!grid[r][c]) continue;
    const dx = Math.max(Math.abs(c - 16), Math.abs(c + 1 - 16));
    const dy = Math.max(Math.abs(r - 16), Math.abs(r + 1 - 16));
    m = Math.max(m, Math.hypot(dx / a, dy / b));
  }
  return m ? Math.min(max, Math.floor(32 / m)) : max;
}

/** Merge cells into horizontal runs, one path per key (null keys are skipped). */
function runPaths(grid, x0, y0, cell, keyOf) {
  const paths = new Map();
  for (let r = 0; r < 32; r++) {
    let c = 0;
    while (c < 32) {
      const key = keyOf(grid[r][c]);
      if (key == null) { c++; continue; }
      let end = c + 1;
      while (end < 32 && keyOf(grid[r][end]) === key) end++;
      const w = round((end - c) * cell);
      const d = `M${round(x0 + c * cell)} ${round(y0 + r * cell)}h${w}v${round(cell)}h${-w}z`;
      paths.set(key, (paths.get(key) ?? '') + d);
      c = end;
    }
  }
  return paths;
}

/**
 * Line engraving of the Noun: three bowed scan lines per pixel row whose
 * stroke weight follows each pixel's darkness (seven weights, round caps),
 * cross-hatching in the darkest areas and a fine contour.
 */
function engravedNoun(grid, x0, y0, size, ink) {
  const cell = size / 32;
  const L = 3;
  const levels = 7;
  const maxW = (cell / L) * 0.96;
  const levelOf = (color) => Math.min(levels - 1, Math.round(Math.pow(1 - luminance(color), 0.78) * (levels - 1)));
  const buckets = Array.from({ length: levels }, () => []);
  const cy = y0 + size / 2;
  for (let r = 0; r < 32; r++) {
    for (let j = 0; j < L; j++) {
      const y = y0 + (r + (j + 0.5) / L) * cell;
      let c = 0;
      while (c < 32) {
        const color = grid[r][c];
        if (!color) { c++; continue; }
        const level = levelOf(color);
        let end = c + 1;
        while (end < 32 && grid[r][end] && levelOf(grid[r][end]) === level) end++;
        const xa = x0 + c * cell + cell * 0.1, xb = x0 + end * cell - cell * 0.1;
        const len = xb - xa;
        const bow = ((y - cy) / (size / 2)) * cell * 0.9 * (len / size);
        buckets[level].push(`M${round(xa)} ${round(y)}q${round(len / 2)} ${round(bow)} ${round(len)} 0`);
        c = end;
      }
    }
  }
  const strokes = buckets.map((segs, level) => segs.length
    ? `<path d="${segs.join('')}" stroke-width="${round((0.2 + 0.8 * (level / (levels - 1))) * maxW * 10) / 10}"/>`
    : '').join('');
  const hatch = [];
  const edge = [];
  for (let r = 0; r < 32; r++) for (let c = 0; c < 32; c++) {
    const color = grid[r][c];
    if (!color) continue;
    const x = x0 + c * cell, y = y0 + r * cell;
    if (1 - luminance(color) >= 0.7) hatch.push(`M${round(x + cell * 0.1)} ${round(y + cell * 0.9)}l${round(cell * 0.8)} ${round(-cell * 0.8)}`);
    if (r === 0 || !grid[r - 1][c]) edge.push(`M${round(x)} ${round(y)}h${round(cell)}`);
    if (r === 31 || !grid[r + 1][c]) edge.push(`M${round(x)} ${round(y + cell)}h${round(cell)}`);
    if (c === 0 || !grid[r][c - 1]) edge.push(`M${round(x)} ${round(y)}v${round(cell)}`);
    if (c === 31 || !grid[r][c + 1]) edge.push(`M${round(x + cell)} ${round(y)}v${round(cell)}`);
  }
  return `<g fill="none" stroke="${ink}" stroke-linecap="round">${strokes}`
    + (hatch.length ? `<path d="${hatch.join('')}" stroke-width="${round(cell * 0.09)}" opacity="0.8"/>` : '')
    + `<path d="${edge.join('')}" stroke-width="${round(cell * 0.12)}" stroke-linecap="square"/></g>`;
}

/** A pale offset tint of the Noun's own colors, printed under the engraving. */
function tintedNoun(grid, x0, y0, size, paper) {
  const paths = runPaths(grid, x0, y0, size / 32, (color) => (color ? mix(color, paper, 0.6) : null));
  return [...paths].map(([fill, d]) => `<path fill="${fill}" d="${d}"/>`).join('');
}

/** Watermark: the Noun as soft tonal shading, as if formed in the paper. */
function watermarkNoun(grid, x0, y0, size, ink) {
  const paths = runPaths(grid, x0, y0, size / 32, (color) => (color ? Math.round((1 - luminance(color)) * 4) : null));
  return `<g filter="url(#soft)" fill="${ink}">`
    + [...paths].sort((a, b) => a[0] - b[0]).map(([level, d]) => `<path opacity="${round((0.07 + 0.05 * level) * 100) / 100}" d="${d}"/>`).join('')
    + '</g>';
}

/* ---------- guilloche ---------- */

/** One period of a k-fold hypotrochoid, scaled so its outer reach is R. */
function petal(k, dr, R, steps) {
  const r = 1 / k, d = r * dr;
  const s = R / (1 - r + d);
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * ((2 * Math.PI) / k);
    pts.push(`${round(((1 - r) * Math.cos(t) + d * Math.cos((k - 1) * t)) * s)} ${round(((1 - r) * Math.sin(t) - d * Math.sin((k - 1) * t)) * s)}`);
  }
  return 'M' + pts.join('L');
}

const ROSETTES = {
  full: (rand) => [
    { k: 16 + 2 * Math.floor(rand() * 4), dr: 2.4 + rand() * 0.8, scale: 1, copies: 5 },
    { k: 12 + 2 * Math.floor(rand() * 3), dr: 1.8 + rand() * 0.6, scale: 0.8, copies: 4 },
    { k: 9 + 2 * Math.floor(rand() * 3), dr: 1.6 + rand() * 0.5, scale: 0.6, copies: 3 },
    { k: 6 + 2 * Math.floor(rand() * 2), dr: 7 + rand() * 3, scale: 0.42, copies: 3 },
  ],
  simple: (rand) => [
    { k: 10 + 2 * Math.floor(rand() * 3), dr: 1.8 + rand() * 0.6, scale: 1, copies: 3 },
    { k: 6 + 2 * Math.floor(rand() * 2), dr: 6 + rand() * 2, scale: 0.62, copies: 2 },
  ],
  tiny: () => [{ k: 8, dr: 3, scale: 1, copies: 2 }],
  ring: (rand) => [
    { k: 44 + 2 * Math.floor(rand() * 4), dr: 2.3, scale: 1, copies: 3 },
    { k: 36 + 2 * Math.floor(rand() * 4), dr: 1.5, scale: 0.955, copies: 2 },
  ],
};

/**
 * A guilloche rosette: each layer is one petal path, rotated k times into a
 * closed curve, then repeated a few times at small offsets for the woven look.
 * Rosettes sharing a key share their defs.
 */
function rosette(doc, key, cx, cy, R, seed, colors, width = 0.5, kind = 'full') {
  const id = `${doc.prefix}r${key}`;
  const spec = ROSETTES[kind](rng(seed * 7 + 3));
  if (!doc.made.has(id)) {
    doc.made.add(id);
    spec.forEach((layer, i) => {
      const steps = Math.round((R > 60 ? 34 : 20) * (layer.dr > 4 ? 1.8 : 1));
      doc.defs.push(`<path id="${id}p${i}" d="${petal(layer.k, layer.dr, R * layer.scale, steps)}"/>`
        + `<g id="${id}c${i}">${Array.from({ length: layer.k }, (_, j) => `<use href="#${id}p${i}"${j ? ` transform="rotate(${round((360 / layer.k) * j * 100) / 100})"` : ''}/>`).join('')}</g>`);
    });
  }
  return `<g transform="translate(${cx} ${cy})" fill="none" stroke-width="${width}">`
    + spec.map((layer, i) => `<g stroke="${colors[i % colors.length]}">`
      + Array.from({ length: layer.copies }, (_, c) => `<use href="#${id}c${i}"${c ? ` transform="rotate(${round((360 / layer.k / layer.copies) * c * 100) / 100})"` : ''}/>`).join('')
      + '</g>').join('')
    + '</g>';
}

/** A braided guilloche band as a tiling pattern, centered on y = 0. */
function bandPattern(doc, amp, period, color, width) {
  const id = `${doc.prefix}b`;
  const tile = period * 4;
  const mid = amp + 2;
  const out = [];
  const families = [[amp, 4, 1], [amp * 0.46, 3, 2]];
  for (const [a, strands, freq] of families) {
    for (let k = 0; k < strands; k++) {
      for (const sign of [1, -1]) {
        const phase = (Math.PI * 2 * k) / strands;
        const pts = [];
        for (let s = 0; s <= tile; s += period / 14) {
          pts.push(`${round(s)} ${round(mid + sign * a * Math.sin((Math.PI * 2 * freq * s) / period + phase))}`);
        }
        out.push('M' + pts.join('L'));
      }
    }
  }
  doc.defs.push(`<pattern id="${id}" width="${tile}" height="${2 * mid}" y="${-mid}" patternUnits="userSpaceOnUse"><path d="${out.join('')}" fill="none" stroke="${color}" stroke-width="${width}"/></pattern>`);
  return { id, mid };
}

function bandRect(band, x1, y1, x2, y2) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const deg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return `<rect x="0" y="${-band.mid}" width="${round(len)}" height="${2 * band.mid}" fill="url(#${band.id})" transform="translate(${x1} ${y1})${deg ? ` rotate(${round(deg)})` : ''}"/>`;
}

function frame(doc, p, seed) {
  const m = 30;
  const band = bandPattern(doc, 9, 26, p.text, 0.42);
  const corners = [[m, m], [W - m, m], [m, H - m], [W - m, H - m]];
  return `<rect width="${W}" height="${H}" fill="${p.paper}"/>`
    + `<rect width="${W}" height="${H}" fill="url(#fountain)" opacity="0.55"/>`
    + `<rect width="${W}" height="${H}" fill="url(#lathe)"/>`
    + fibers(seed)
    + `<rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="${p.ink}" stroke-width="1.6"/>`
    + `<rect x="${m + 15}" y="${m + 15}" width="${W - 2 * (m + 15)}" height="${H - 2 * (m + 15)}" fill="none" stroke="${p.ink}" stroke-width="0.8"/>`
    + bandRect(band, m, m, W - m, m)
    + bandRect(band, m, H - m, W - m, H - m)
    + bandRect(band, m, m, m, H - m)
    + bandRect(band, W - m, m, W - m, H - m)
    + corners.map(([x, y]) => `<rect x="${x - 13}" y="${y - 13}" width="26" height="26" fill="${p.paper}" stroke="${p.ink}" stroke-width="0.8"/>`
      + rosette(doc, 'k', x, y, 10.5, seed, [p.text], 0.4, 'tiny')).join('');
}

/** Short red and blue fibers scattered through the paper. */
function fibers(seed) {
  const rand = rng(seed * 13 + 5);
  const sets = [[], []];
  for (let i = 0; i < 48; i++) {
    const x = 24 + rand() * (W - 48), y = 24 + rand() * (H - 48);
    const a = rand() * Math.PI * 2, len = 6 + rand() * 10, bend = (rand() - 0.5) * 0.8;
    const dx = Math.cos(a) * len, dy = Math.sin(a) * len;
    sets[i % 2].push(`M${round(x)} ${round(y)}q${round(dx / 2 - dy * bend)} ${round(dy / 2 + dx * bend)} ${round(dx)} ${round(dy)}`);
  }
  return `<path d="${sets[0].join('')}" fill="none" stroke="#c23a3f" stroke-width="0.55" opacity="0.55"/>`
    + `<path d="${sets[1].join('')}" fill="none" stroke="#2f5fb3" stroke-width="0.55" opacity="0.5"/>`;
}

function baseDefs(p, flip, extra) {
  const g = flip ? 'x1="1" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="1"';
  const portrait = flip ? '' : `<mask id="portraitMask"><rect width="${W}" height="${H}" fill="#000"/><ellipse cx="980" cy="292" rx="168" ry="214" fill="url(#vignette)"/></mask>`;
  return '<defs>'
    + `<linearGradient id="fountain" ${g}><stop offset="0" stop-color="${p.tintA}"/><stop offset="0.5" stop-color="${p.paper}"/><stop offset="1" stop-color="${p.tintB}"/></linearGradient>`
    + `<linearGradient id="latheInk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.accent2}"/><stop offset="0.5" stop-color="${p.lathe}"/><stop offset="1" stop-color="${p.accent}"/></linearGradient>`
    + `<pattern id="lathe" width="168" height="36" patternUnits="userSpaceOnUse">`
    + [0, 6, 12, 18, 24, 30].map((y, i) => `<path d="M0 ${y + 3}C28 ${round(y - 3 + i * 0.4)} 56 ${round(y + 9 - i * 0.4)} 84 ${y + 3}S140 ${round(y - 3 + i * 0.4)} 168 ${y + 3}" fill="none" stroke="url(#latheInk)" stroke-width="0.42" opacity="0.6"/>`).join('')
    + '</pattern>'
    + `<pattern id="hl" width="8" height="2.6" patternUnits="userSpaceOnUse"><path d="M0 1.3H8" stroke="${p.ink}" stroke-width="0.45" opacity="0.4"/></pattern>`
    + `<pattern id="moire" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><path d="M0 2.5H5" stroke="${p.ink}" stroke-width="0.5" opacity="0.5"/></pattern>`
    + `<pattern id="foilLines" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 2H4" stroke="#ffffff" stroke-width="0.7" opacity="0.55"/></pattern>`
    + '<linearGradient id="foil" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#d8f3ff"/><stop offset="0.16" stop-color="#f7d6ff"/><stop offset="0.32" stop-color="#fff2c2"/><stop offset="0.48" stop-color="#c7ffe0"/><stop offset="0.64" stop-color="#cfd8ff"/><stop offset="0.8" stop-color="#ffd2dc"/><stop offset="1" stop-color="#e2fff5"/></linearGradient>'
    + '<linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d737a"/><stop offset="0.45" stop-color="#e9edf0"/><stop offset="0.6" stop-color="#b9c0c6"/><stop offset="1" stop-color="#5d636a"/></linearGradient>'
    + '<linearGradient id="ovi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6a12"/><stop offset="0.35" stop-color="#d9b44a"/><stop offset="0.55" stop-color="#2f7d5a"/><stop offset="0.8" stop-color="#1f5b6e"/><stop offset="1" stop-color="#8a6a12"/></linearGradient>'
    + '<radialGradient id="vignette" cx="0.5" cy="0.5" r="0.5"><stop offset="0.62" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
    + portrait
    + '<filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.6"/></filter>'
    + extra
    + '</defs>';
}

/* ---------- features ---------- */

function microLine(x1, y, x2, label, fill, size = 4.2) {
  const unit = `${label} · `;
  const reps = Math.ceil((x2 - x1) / (unit.length * size * 0.62)) + 1;
  return `<text x="${x1}" y="${y}" font-family="${MONO}" font-size="${size}" letter-spacing="0.2" fill="${fill}" textLength="${round(x2 - x1)}" lengthAdjust="spacingAndGlyphs">${esc(unit.repeat(reps).slice(0, Math.floor((x2 - x1) / (size * 0.62))))}</text>`;
}

function microCircle(id, cx, cy, r, label, fill, size = 4.4) {
  const circ = 2 * Math.PI * r;
  const unit = `${label} · `;
  const reps = Math.max(1, Math.floor(circ / (unit.length * size * 0.62)));
  return `<path id="${id}" d="M${cx - r} ${cy}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0" fill="none"/>`
    + `<text font-family="${MONO}" font-size="${size}" letter-spacing="0.25" fill="${fill}"><textPath href="#${id}" textLength="${round(circ - 2)}" lengthAdjust="spacingAndGlyphs">${esc(unit.repeat(reps))}</textPath></text>`;
}

/** A metallic-look thread that surfaces in windows, its microtext read bottom to top. */
function thread(doc, x, label, flip = false) {
  const out = [];
  for (let y = 22, i = 0; y < H - 22; y += 30, i++) {
    if ((i % 2 === 0) !== flip) {
      out.push(`<rect x="${x - 3.5}" y="${y}" width="7" height="18" rx="1" fill="url(#metal)"/>`
        + `<g transform="translate(${round(x + 1.9)} ${y + 9}) rotate(-90)">${doc.t.text('serial', label, { x: 0, y: 0, size: 5.2, anchor: 'middle', fill: '#2f3439' })}</g>`);
    } else {
      out.push(`<rect x="${x - 2.5}" y="${y}" width="5" height="18" fill="#9aa1a8" opacity="0.18"/>`);
    }
  }
  return out.join('');
}

/** A foil-look stripe: the Noun's head in silhouette, alternating with denomination rings. */
function foilStripe(doc, x, w, value, head) {
  const id = `${doc.prefix}h`;
  let minR = 32, maxR = -1, minC = 32, maxC = -1;
  head.forEach((row, r) => row.forEach((color, c) => {
    if (!color) return;
    minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c);
  }));
  const span = Math.max(maxR - minR + 1, maxC - minC + 1, 1);
  const s = round(((w - 12) / span) * 100) / 100;
  const [d = ''] = runPaths(head, 0, 0, 1, (color) => (color ? 1 : null)).values();
  doc.defs.push(`<path id="${id}" d="${d}"/>`);
  const cx = x + w / 2;
  const out = [`<rect x="${x}" y="40" width="${w}" height="${H - 80}" rx="${w / 2}" fill="url(#foil)"/>`, `<rect x="${x}" y="40" width="${w}" height="${H - 80}" rx="${w / 2}" fill="url(#foilLines)"/>`];
  for (let i = 0; i < 6; i++) {
    const y = 90 + i * 84;
    if (i % 2 === 0) {
      const ox = round(cx - ((minC + maxC + 1) / 2) * s), oy = round(y - ((minR + maxR + 1) / 2) * s);
      out.push(`<use href="#${id}" transform="translate(${ox} ${oy}) scale(${s})" fill="#ffffff" opacity="0.85"/>`);
    } else {
      out.push(`<circle cx="${cx}" cy="${y}" r="14" fill="none" stroke="#ffffff" stroke-width="1.1" opacity="0.8"/>`);
      out.push(doc.t.text('numeral', String(value), { x: cx, y: y + 6, size: value >= 100 ? 13 : 17, anchor: 'middle', fill: '#ffffff', opacity: 0.9 }));
    }
  }
  out.push(`<rect x="${x}" y="40" width="${w}" height="${H - 80}" rx="${w / 2}" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.7"/>`);
  return out.join('');
}

function latent(x, y, w, h, letters, p) {
  const id = `latent${x}${y}`;
  const glyphs = outline('title', letters, { x: x + w / 2, y: y + h * 0.78, size: h * 0.82, anchor: 'middle', fill: '#000', tracking: 2 });
  const vert = [], horiz = [];
  for (let i = 0; i <= w; i += 2.2) vert.push(`M${round(x + i)} ${y}v${h}`);
  for (let i = 0; i <= h; i += 2.2) horiz.push(`M${x} ${round(y + i)}h${w}`);
  return `<clipPath id="${id}">${glyphs.replace(' fill="#000"', '')}</clipPath>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}"/>`
    + `<path d="${vert.join('')}" stroke="${p.ink}" stroke-width="0.9"/>`
    + `<g clip-path="url(#${id})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.paper}"/><path d="${horiz.join('')}" stroke="${p.ink}" stroke-width="0.9"/></g>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${p.ink}" stroke-width="0.6"/>`;
}

/**
 * See-through register: a pixel diamond split at random between the faces.
 * The back draws its half mirrored, so against the light the halves meet.
 */
export function registerCells(seed) {
  const rand = rng(seed * 31 + 7);
  const cells = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if (Math.abs(r - 4) + Math.abs(c - 4) <= 4) cells.push({ r, c, front: rand() < 0.5 });
  }
  return cells;
}

function seeThrough(cx, cy, p, face, seed) {
  const cell = 6;
  const d = registerCells(seed)
    .filter((k) => k.front === (face === 'front'))
    .map(({ r, c }) => `M${round(face === 'front' ? cx + (c - 4.5) * cell : cx + (3.5 - c) * cell)} ${round(cy + (r - 4.5) * cell)}h${cell}v${cell}h-${cell}z`)
    .join('');
  return `<path d="${d}" fill="${p.text}" opacity="0.9"/>`
    + `<rect x="${cx - 33}" y="${cy - 33}" width="66" height="66" fill="none" stroke="${p.ink}" stroke-width="0.5" stroke-dasharray="1.5 1.5"/>`;
}

function signature(doc, x, y, ink) {
  return `<path d="M${x} ${y}c14 -26 28 -30 34 -14s-10 22 -4 4 18 -26 26 -10 -6 16 4 4 14 -18 22 -8 4 12 14 2 22 -14 30 -4" fill="none" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>`
    + `<path d="M${x - 6} ${y + 9}h170" stroke="${ink}" stroke-width="0.5"/>`
    + doc.t.text('caps', 'CURATOR · CURRENCY BUILDER', { x: x - 6, y: y + 22, size: 8.5, tracking: 1.6, fill: ink });
}

function serialRun(doc, x, y, value, fill, ascending) {
  if (!ascending) return doc.t.text('serial', value, { x, y, size: 17, tracking: 2.2, fill });
  let cx = x;
  return [...value].map((ch, i) => {
    const size = round(12 + i * (10 / Math.max(1, value.length - 1)));
    const glyph = doc.t.text('serial', ch, { x: round(cx), y, size, fill });
    cx += size * 0.62 + 1.2;
    return glyph;
  }).join('');
}

function cornerNumeral(doc, cx, cy, value, p, seed) {
  return rosette(doc, 'n', cx, cy, 30, seed, [p.text, p.accent], 0.45, 'simple')
    + `<circle cx="${cx}" cy="${cy}" r="17" fill="${p.paper}" opacity="0.92"/>`
    + doc.t.text('numeral', String(value), { x: cx, y: cy + 8, size: value >= 100 ? 17 : 24, anchor: 'middle', fill: p.ink });
}

const svgOpen = (label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="150mm" height="75mm" role="img" aria-label="${esc(label)}">`;

/* ---------- faces ---------- */

/**
 * Collection adapter fields: { name, kicker, line, place, value, unitWord,
 * serial, nounId, palette, back: { heading, title, paragraphs:[{label?, body}], source? } }
 */
export function securityFront(n) {
  const p = securityPalette(n.palette);
  const doc = newDoc('f');
  const t = doc.t;
  const noun = nounFor(n.nounId);
  const seed = n.nounId + 11;
  const nameSize = fitSize('title', n.name.toUpperCase(), 54, 390, 1.5);
  // Two lines at 19 px; a longer line drops to 16.5 px and takes a third.
  const wide = wrapMeasured('body', n.line, 19, 390);
  const lineSize = wide.length > 2 ? 16.5 : 19;
  const lineLead = wide.length > 2 ? 21 : 25;
  const lineLines = (wide.length > 2 ? wrapMeasured('body', n.line, 16.5, 390) : wide).slice(0, 3);
  const lineTop = wide.length > 2 ? 266 : 272;
  const valueWords = `${words(n.value)} ${n.unitWord}`.toUpperCase();
  const size = fitNoun(noun.grid, 150, 172, 288);
  const px = round(980 - size / 2), py = round(280 - size / 2);
  const body = frame(doc, p, seed)
    // Watermark window (left) and its electrotype numeral.
    + `<ellipse cx="182" cy="262" rx="112" ry="150" fill="${p.paper}"/>`
    + watermarkNoun(noun.grid, 102, 162, 160, p.ink)
    + t.text('numeral', String(n.value), { x: 182, y: 384, size: 40, anchor: 'middle', fill: p.ink, opacity: 0.1 })
    + `<ellipse cx="182" cy="262" rx="112" ry="150" fill="none" stroke="${p.lathe}" stroke-width="0.4" stroke-dasharray="2 3" opacity="0.6"/>`
    + seeThrough(182, 482, p, 'front', n.nounId)
    // Windowed security thread.
    + thread(doc, 316, `NM ${n.value}`)
    // Title block.
    + t.text('title', 'NOUNS MONEY', { x: 545, y: 104, size: 34, tracking: 7, anchor: 'middle', fill: p.ink })
    + microLine(350, 116, 740, 'NOUNS MONEY CURRENCY BUILDER ART NOTE', p.text)
    + t.text('caps', n.kicker.toUpperCase(), { x: 545, y: 140, size: 12.5, tracking: 3.2, anchor: 'middle', fill: p.text, maxWidth: 390 })
    + rosette(doc, 'm', 545, 236, 92, seed + 5, [mix(p.paper, p.accent, 0.62), mix(p.paper, p.accent2, 0.66), mix(p.paper, p.ink, 0.42), mix(p.paper, p.accent, 0.5)], 0.5)
    + t.text('title', n.name.toUpperCase(), { x: 545, y: 232, size: nameSize, tracking: 1.5, anchor: 'middle', fill: p.ink, extra: `stroke="${p.paper}" stroke-width="${Math.round(5000 / nameSize)}" stroke-linejoin="round" paint-order="stroke"` })
    + lineLines.map((l, i) => t.text('body', l, { x: 545, y: lineTop + i * lineLead, size: lineSize, anchor: 'middle', fill: p.ink })).join('')
    + t.text('caps', n.place.toUpperCase(), { x: 545, y: 335, size: 11.5, tracking: 2.4, anchor: 'middle', fill: p.text, maxWidth: 390 })
    + `<path d="M410 356h270" stroke="${p.ink}" stroke-width="0.5"/>`
    + t.text('caps', valueWords, { x: 545, y: 384, size: 15, tracking: 4, anchor: 'middle', fill: p.ink, maxWidth: 390 })
    + latent(360, 410, 74, 40, 'NM', p)
    + signature(doc, 470, 440, p.ink)
    // Holographic stripe.
    + foilStripe(doc, 750, 46, n.value, noun.head)
    // Full engraved Noun over a pale tint, on a vignetted lined ground, in a guilloche oval.
    + `<g mask="url(#portraitMask)"><rect x="800" y="70" width="360" height="450" fill="${p.paper}" opacity="0.7"/><rect x="800" y="70" width="360" height="450" fill="url(#hl)"/></g>`
    + tintedNoun(noun.grid, px, py, size, p.paper)
    + engravedNoun(noun.grid, px, py, size, p.ink)
    + `<g transform="translate(980 292) scale(1 1.24)">${rosette(doc, 'o', 0, 0, 178, seed, [p.text, mix(p.paper, p.accent, 0.6)], 0.45, 'ring')}</g>`
    + microCircle('ringF', 980, 292, 158, `ACTUAL NOUN ${n.nounId} CC0 NOUNS MONEY`, p.text, 4.3)
    + t.text('caps', `NOUN ${n.nounId} · ${noun.art.labels.head.toUpperCase()}`, { x: 980, y: 444, size: 9, tracking: 2, anchor: 'middle', fill: p.ink, maxWidth: 180 })
    // Color-shift numeral.
    + t.text('numeral', String(n.value), { x: 1146, y: 548, size: 96, anchor: 'end', fill: 'url(#ovi)', extra: `stroke="${p.ink}" stroke-width="12" stroke-opacity="0.35"` })
    // Corner numerals and serials.
    + cornerNumeral(doc, 84, 84, n.value, p, seed)
    + cornerNumeral(doc, W - 84, 84, n.value, p, seed)
    + cornerNumeral(doc, 84, H - 84, n.value, p, seed)
    + serialRun(doc, 128, 76, n.serial, p.red, true)
    + serialRun(doc, 800, 560, n.serial, p.ink, false)
    + t.text('caps', 'ART NOTE · NOT LEGAL TENDER · NO CASH VALUE', { x: 545, y: 556, size: 9, tracking: 2.2, anchor: 'middle', fill: p.ink })
    + microLine(350, 566, 740, 'ART NOTE NOT LEGAL TENDER', p.text, 3.6);
  return finish(doc, p, svgOpen(`${n.name}, a Currency Builder Security Edition art note with actual Noun #${n.nounId}; design concept, not legal tender`), body);
}

export function securityBack(n) {
  const p = securityPalette(n.palette);
  const doc = newDoc('k');
  const t = doc.t;
  const noun = nounFor(n.nounId);
  const seed = n.nounId + 29;
  const b = n.back;
  const column = [];
  let y = 104;
  column.push(t.text('caps', b.heading.toUpperCase(), { x: 396, y, size: 12, tracking: 3, fill: p.text, maxWidth: 440 }));
  y += 34;
  for (const line of wrapMeasured('title', b.title.toUpperCase(), 26, 440, 1).slice(0, 2)) {
    column.push(t.text('title', line, { x: 396, y, size: 26, tracking: 1, fill: p.ink }));
    y += 30;
  }
  y += 8;
  for (const para of b.paragraphs) {
    if (para.label) {
      y += 6;
      column.push(t.text('caps', para.label.toUpperCase(), { x: 396, y, size: 10.5, tracking: 2.4, fill: p.text }));
      y += 22;
    }
    for (const line of wrapMeasured('body', para.body, 16.5, 440).slice(0, 5)) {
      column.push(t.text('body', line, { x: 396, y, size: 16.5, fill: p.ink }));
      y += 21;
    }
    y += 4;
  }
  if (b.source) column.push(t.text('caps', `SOURCE · ${b.source.toUpperCase()}`, { x: 396, y: Math.min(y + 12, 505), size: 9, tracking: 1.6, fill: p.text, maxWidth: 440 }));
  const traits = ['head', 'glasses', 'body', 'accessory'];
  const medal = fitNoun(noun.grid, 96, 96, 184);
  const body = frame(doc, p, seed)
    // Giant ghost numeral.
    + t.text('numeral', String(n.value), { x: 210, y: 470, size: n.value >= 100 ? 240 : 330, anchor: 'middle', fill: p.ink, opacity: 0.06 })
    // Color Noun medallion with guilloche ring and microtext.
    + rosette(doc, 'm', 210, 236, 138, seed, [p.tintC, mix(p.paper, p.accent, 0.45), mix(p.paper, p.accent2, 0.5), mix(p.paper, p.ink, 0.3)], 0.5)
    + `<circle cx="210" cy="236" r="104" fill="${p.ink}"/>`
    + `<circle cx="210" cy="236" r="100" fill="${noun.art.background}"/>`
    + placeNoun(noun.art, round(210 - medal / 2), round(236 - medal / 2), medal).replace(/<rect width="100%" height="100%"[^>]*\/>/, '')
    + microCircle('ringB', 210, 236, 110, `NOUN ${n.nounId} · ${noun.art.labels.head.toUpperCase()} HEAD`, p.text, 4.2)
    + traits.map((k, i) => t.text('caps', k.toUpperCase(), { x: 92, y: 388 + i * 19, size: 8.5, tracking: 1.6, fill: p.text })
      + t.text('body', noun.art.labels[k], { x: 170, y: 388 + i * 19, size: 13, fill: p.ink, maxWidth: 190 })).join('')
    + t.text('caps', `ACTUAL NOUN ${n.nounId} · CC0 · FULL NOUN FROM ITS ON-CHAIN SEED`, { x: 92, y: 466, size: 7.5, tracking: 1.2, fill: p.ink, maxWidth: 270 })
    + t.text('caps', `NOUNS.WTF/NOUN/${n.nounId} · NOT ENDORSED BY NOUNS DAO`, { x: 92, y: 480, size: 7.5, tracking: 1.2, fill: p.ink, maxWidth: 270 })
    // Text column.
    + column.join('')
    // Thread (mirrored), watermark window and see-through partner.
    + thread(doc, W - 316, `NM ${n.value}`, true)
    + `<ellipse cx="${W - 182}" cy="262" rx="112" ry="150" fill="${p.paper}"/>`
    + `<g transform="translate(${2 * (W - 182)} 0) scale(-1 1)">${watermarkNoun(noun.grid, W - 262, 162, 160, p.ink)}</g>`
    + `<ellipse cx="${W - 182}" cy="262" rx="112" ry="150" fill="none" stroke="${p.lathe}" stroke-width="0.4" stroke-dasharray="2 3" opacity="0.6"/>`
    + seeThrough(W - 182, 482, p, 'back', n.nounId)
    + `<rect x="852" y="40" width="10" height="${H - 80}" fill="url(#moire)" opacity="0.6"/>`
    + t.text('title', 'CURRENCY BUILDER', { x: 545, y: 72, size: 15, tracking: 6, anchor: 'middle', fill: p.ink })
    + cornerNumeral(doc, 84, 84, n.value, p, seed)
    + cornerNumeral(doc, W - 84, H - 84, n.value, p, seed)
    + serialRun(doc, W - 330, H - 70, n.serial, p.red, false)
    + t.text('caps', 'ART NOTE · NOT LEGAL TENDER · NO CASH VALUE', { x: 545, y: 556, size: 9, tracking: 2.2, anchor: 'middle', fill: p.ink })
    + microLine(350, 566, 740, 'SECURITY FEATURES ARE PRINTED ART', p.text, 3.6);
  return finish(doc, p, svgOpen(`Reverse of ${n.name}, Security Edition: ${b.title}, and actual Noun #${n.nounId}`), body, true);
}

/** The legend of printed features, for pages that explain the edition. */
export const FEATURES = [
  ['Rainbow lathe underprint', 'Split-fountain color under a field of fine wave lines.'],
  ['Security fibers', 'Short red and blue fibers scattered through the paper.'],
  ['Guilloche border and rosettes', 'Braided bands and layered rosettes, each seeded by the note.'],
  ['Engraved portrait', 'The full actual Noun as a line engraving over a pale tint of its own colors, never cropped.'],
  ['Watermark window', 'The Noun again, as soft tonal shading in an unprinted window.'],
  ['Windowed thread', 'A metallic-look thread that surfaces in windows, with microtext.'],
  ['Holographic stripe', 'A foil-look band with the Noun’s head in silhouette and denomination rings.'],
  ['Color-shift numeral', 'The big face value in a gold-to-green gradient.'],
  ['Latent image', 'Letters hidden in a line field, visible as the line direction changes.'],
  ['See-through register', 'Half of a pixel diamond on each face; hold the note to the light and the halves meet.'],
  ['Microtext', 'Lines and rings of type too small to read without a loupe.'],
  ['Paired serials', 'One ascending red serial, one plain dark serial.'],
];
