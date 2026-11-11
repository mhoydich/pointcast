#!/usr/bin/env node
// PMM brand v2 asset generator. Every visual here is procedural: hand-drawn pixel grids
// written out as SVG rects, rasterised to PNG with sharp. No image model, no photos.
//
//   node scripts/pmm-brand.mjs        writes public/pmm/brand/{wordmark.svg,logo/,icons/,sigils.svg,sticker-sheet.*,tokens.json}
//
// Re-running it is safe: the output is byte-for-byte deterministic.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';
import { EXAMPLES, sigil } from '../public/pmm/brand/sigil.js';

const ROOT = resolve(import.meta.dirname, '..');
const BRAND = join(ROOT, 'public/pmm/brand');

// ---------- Tokens (mirror of the :root block in public/pmm/style.css) ----------
export const TOKENS = {
  '--border': '#7869C4', '--field': '#40318D', '--field-2': '#352577', '--panel': '#4A3A9C',
  '--ink': '#F2F0FF', '--ink-2': '#BDB4F0',
  '--r1': '#E8453C', '--r2': '#F28C28', '--r3': '#F5D142', '--r4': '#58B947', '--r5': '#2F86D8', '--r6': '#7E57B5',
  '--err': '#FF8F85', '--ok': '#7FD86E', '--badge': '#C62F27',
};
const T = Object.fromEntries(Object.entries(TOKENS).map(([k, v]) => [k.slice(2).replace('-', ''), v]));
const FUJI = [T.r1, T.r2, T.r3, T.r4, T.r5, T.r6];
const MOODS = [['calm', '#2F86D8'], ['hyped', '#E8453C'], ['soft', '#7E57B5'], ['sunny', '#F5D142'], ['salty', '#58B947'], ['tired', '#8A86A8'], ['curious', '#F28C28'], ['low', '#4B5BA6']];

// ---------- Pixel font: 5 x 7, one cell per pixel, 1 cell between letters ----------
const F = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.', J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.###.|#...#|#....|.###.|....#|#...#|.###.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 3: '.###.|#...#|....#|..##.|....#|#...#|.###.',
  4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '..##.|.#...|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
  8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|...#.|.##..',
  '.': '.....|.....|.....|.....|.....|.##..|.##..', ',': '.....|.....|.....|.....|.##..|..#..|.#...',
  '"': '.#.#.|.#.#.|.....|.....|.....|.....|.....', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..', '-': '.....|.....|.....|#####|.....|.....|.....',
  '/': '....#|...#.|...#.|..#..|.#...|.#...|#....', ':': '.....|.##..|.##..|.....|.##..|.##..|.....',
  '*': '.....|....#|...##|#.##.|###..|.#...|.....', // a pixel check mark
  ' ': '.....|.....|.....|.....|.....|.....|.....',
};
const FONT = Object.fromEntries(Object.entries(F).map(([k, v]) => [k, v.split('|')]));
const textWidth = (s) => s.length * 6 - 1;

// The wordmark letters: bespoke, two-cell stems, nine cells tall.
const BIG = {
  P: ['######.', '##...##', '##...##', '##...##', '######.', '##.....', '##.....', '##.....', '##.....'],
  M: ['##.....##', '###...###', '####.####', '##.###.##', '##..#..##', '##.....##', '##.....##', '##.....##', '##.....##'],
};

// ---------- Tiny SVG kit ----------
const px = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
function grid(rows, x0, y0, u, fill) {
  // Run-length each row so the SVG stays small.
  let out = '';
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      if (row[c] === '.' || row[c] === ' ') { c++; continue; }
      const ch = row[c]; let n = 1;
      while (row[c + n] === ch) n++;
      const f = typeof fill === 'function' ? fill(ch) : fill;
      out += px(x0 + c * u, y0 + r * u, n * u, u, f);
      c += n;
    }
  });
  return out;
}
function text(s, x0, y0, u, fill) {
  let out = '';
  [...s.toUpperCase()].forEach((ch, i) => { out += grid(FONT[ch] || FONT['?'], x0 + i * 6 * u, y0, u, fill); });
  return out;
}
const svg = (w, h, body, { label, scale = 1, bg } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges"${label ? ` role="img" aria-label="${label}"` : ''}>`
  + (label ? `<title>${label}</title>` : '') + (bg ? px(0, 0, w, h, bg) : '') + body + '</svg>\n';
const BLINK = '<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.5;.5;1" dur="1s" repeatCount="indefinite"/>';

// ---------- The wordmark: stripes, P M M, cursor. 46 x 9 cells. ----------
// The cursor is a full 6-cell block, three cells clear of the last M, so it never reads as a letter I.
export const WM = { w: 46, h: 9 };
function wordmark(x0, y0, u, { ink = T.ink, stripes = FUJI, cursor = true, blink = false } = {}) {
  let out = '';
  stripes.forEach((c, i) => { out += px(x0 + i * u, y0, u * 0.75, 9 * u, c); });
  out += grid(BIG.P, x0 + 8 * u, y0, u, ink);
  out += grid(BIG.M, x0 + 17 * u, y0, u, ink);
  out += grid(BIG.M, x0 + 28 * u, y0, u, ink);
  if (cursor) out += blink ? `<rect x="${x0 + 40 * u}" y="${y0}" width="${6 * u}" height="${9 * u}" fill="${ink}">${BLINK}</rect>` : px(x0 + 40 * u, y0, 6 * u, 9 * u, ink);
  return out;
}

// ---------- The mark (icon-only): 24 x 24 cells ----------
function mark(x0, y0, u, { outer = T.border, field = T.field, ink = T.ink, stripes = FUJI } = {}) {
  let out = px(x0, y0, 24 * u, 24 * u, outer) + px(x0 + 2 * u, y0 + 2 * u, 20 * u, 20 * u, field);
  stripes.forEach((c, i) => { out += px(x0 + (5 + i) * u, y0 + 5 * u, u * 0.75, 14 * u, c); });
  out += grid(BIG.P, x0 + 12 * u, y0 + 5 * u, u, ink);
  out += px(x0 + 12 * u, y0 + 16 * u, 5 * u, 3 * u, ink);
  return out;
}
// Below 32 px the P goes; stripes and cursor carry it. 16 x 16 cells.
function mark16(u = 1) {
  let out = px(0, 0, 16 * u, 16 * u, T.border) + px(u, u, 14 * u, 14 * u, T.field);
  FUJI.forEach((c, i) => { out += px((3 + i) * u, 3 * u, u, 10 * u, c); });
  out += px(10 * u, 9 * u, 3 * u, 4 * u, T.ink);
  return out;
}

// ---------- Pixel sprites for the sticker sheet ----------
const SPRITES = {
  joystick: ['......rr......', '.....rrrr.....', '.....rrrr.....', '......rr......', '......gg......', '......gg......', '......gg......', '......gg......',
    '..kkkkkkkkkk..', '.kwwwwwwwwwwk.', '.kwrrwwwwwwwk.', '.kwrrwwwwwwwk.', '.kwwwwwwwwwwk.', '.kkkkkkkkkkkk.'],
  floppy: ['kkkkkkkkkkkkk.', 'kkkggggggggkkk', 'kkkggkkggggkkk', 'kkkggkkggggkkk', 'kkkggggggggkkk', 'kkkkkkkkkkkkkk', 'kkwwwwwwwwwwkk',
    'kk1111111111kk', 'kk2222222222kk', 'kk3333333333kk', 'kk4444444444kk', 'kk5555555555kk', 'kk6666666666kk', 'kkkkkkkkkkkkkk'],
  heart: ['.rr...rr.', 'rrrr.rrrr', 'rrrrrrrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....'],
  phone: ['.kkkkkkkk.', 'kwwwwwwwwk', 'kwbbbbbbwk', 'kwbyybbbwk', 'kwbbbbbbwk', 'kwbyyybbwk', 'kwbbbbbbwk', 'kwbbbbbbwk', 'kwbbbbbbwk', 'kwwwwwwwwk', 'kwwwkkwwwk', '.kkkkkkkk.'],
};
const SPRITE_INK = { r: T.r1, g: '#8A86A8', k: '#1E1650', w: T.ink, b: T.field, y: T.r3, 1: T.r1, 2: T.r2, 3: T.r3, 4: T.r4, 5: T.r5, 6: T.r6 };

// ---------- Sticker sheet ----------
// Each sticker is drawn at its own origin in cells; the sheet packs them into rows.
function stickerSheet() {
  const U = 6; // px per cell on the sheet
  const stickers = [];
  const add = (w, h, body, ground = T.field) => stickers.push({ w, h, body, ground });
  const tx = (s, fill = T.ink) => ({ w: textWidth(s) + 8, h: 15, body: (x, y) => text(s, x + 4 * U, y + 4 * U, U, fill) });

  add(WM.w + 8, WM.h + 8, (x, y) => wordmark(x + 4 * U, y + 4 * U, U));
  add(28, 28, (x, y) => mark(x + 2 * U, y + 2 * U, U), T.border);
  for (const [s, c] of [['READY.', T.ink], ['?SYNTAX ERROR', T.err], ['LOAD "FRIEND",8,1', T.r3], ['PRESS PLAY ON TAPE', T.ink], ['FOUND', T.ok],
    ['RUN', T.ink], ['LINE DROPPED', T.err], ['* SIGNED', T.ok], ['SEARCHING FOR FRIEND', T.ink2], ['MADE IN EL SEGUNDO', T.ink2]]) {
    const t = tx(s, c);
    if (s === 'READY.') { t.w += 6; const b = t.body; t.body = (x, y) => b(x, y) + px(x + (textWidth(s) + 6) * U, y + 4 * U, 5 * U, 7 * U, T.ink); }
    add(t.w, t.h, t.body);
  }
  for (const [name, rows] of Object.entries(SPRITES)) {
    const w = rows[0].length, h = rows.length;
    add(w + 6, h + 6, (x, y) => grid(rows, x + 3 * U, y + 3 * U, U, (ch) => SPRITE_INK[ch]), name === 'heart' ? T.field2 : T.field);
  }
  add(14, 22, (x, y) => FUJI.map((c, i) => px(x + 4 * U, y + (4 + i * 2.5) * U, 6 * U, 2 * U, c)).join(''), T.field);
  for (const hex of EXAMPLES.slice(0, 6)) {
    const s = sigil(hex);
    add(14, 22, (x, y) => grid(s.sprite.map((r) => r.map((on) => (on ? '#' : '.')).join('')), x + 3 * U, y + 3 * U, U, s.color)
      + text(s.hex.slice(0, 2), x + 2 * U, y + 13 * U, U, T.ink2), T.field2);
  }
  add(MOODS.length * 7 + 5, 13, (x, y) => MOODS.map(([, c], i) => px(x + (4 + i * 7) * U, y + 4 * U, 5 * U, 5 * U, c)).join(''), T.field);

  // Shelf packing: tallest first, each sticker into the first shelf with room, else a new shelf.
  const W = 250, PAD = 8, GAP = 6;
  const shelves = [];
  let body = '';
  for (const s of [...stickers].sort((p, q) => q.h - p.h)) {
    let shelf = shelves.find((r) => r.x + s.w + 2 <= W - PAD);
    if (!shelf) { const last = shelves.at(-1); shelf = { x: PAD, y: last ? last.y + last.h + GAP : PAD, h: s.h + 2 }; shelves.push(shelf); }
    const X = shelf.x * U, Y = shelf.y * U;
    // die-cut: ink outline 1 cell, hard shadow 1 cell, then the sticker ground
    body += px(X + U, Y + U, (s.w + 2) * U, (s.h + 2) * U, 'rgba(30,22,80,.35)');
    body += px(X, Y, (s.w + 2) * U, (s.h + 2) * U, T.ink);
    body += px(X + U, Y + U, s.w * U, s.h * U, s.ground);
    body += s.body(X + U, Y + U);
    shelf.x += s.w + 2 + GAP;
  }
  const H = shelves.at(-1).y + shelves.at(-1).h + PAD + 12;
  // backing paper and a footer line
  const paper = px(0, 0, W * U, H * U, '#DCD7F2') + px(0, 0, W * U, 3 * U, T.border);
  const foot = text('PMM STICKERS  SHEET 1  POINTCAST.XYZ/PMM', PAD * U, (H - 11) * U, U, T.field);
  return svg(W * U, H * U, paper + body + foot, { label: 'PMM pixel sticker sheet' });
}

// ---------- Home screen icon variants, 512 x 512, art inside the 80% maskable safe zone ----------
function icons() {
  const S = 512;
  return {
    classic: svg(S, S, px(0, 0, S, S, T.border) + mark(64, 64, 16), { label: 'PMM icon, classic' }),
    ready: svg(S, S, px(0, 0, S, S, T.field) + text('READY.', 85, 168, 10, T.ink) + px(85, 268, 50, 70, T.ink)
      + FUJI.map((c, i) => px(85 + i * 57, 380, 50, 24, c)).join(''), { label: 'PMM icon, READY.' }),
    fuji: svg(S, S, px(0, 0, S, S, T.field) + FUJI.map((c, i) => px(112 + i * 48, 112, 36, 288, c)).join(''), { label: 'PMM icon, Fuji stripes' }),
    paper: svg(S, S, px(0, 0, S, S, T.ink) + mark(64, 64, 16, { outer: T.ink, field: T.ink, ink: T.field }), { label: 'PMM icon, paper' }),
  };
}

// ---------- Write everything ----------
async function out(rel, data) {
  const p = join(BRAND, rel); mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, data);
}
async function png(rel, svgText, size) {
  const p = join(BRAND, rel); mkdirSync(dirname(p), { recursive: true });
  const img = sharp(Buffer.from(svgText), { density: 72 });
  await (size ? img.resize(size, size, { kernel: 'nearest' }) : img).png({ compressionLevel: 9, palette: true }).toFile(p);
}

async function main() {
  const C = 3; // clear space, in cells, on every side of every lockup
  // Wordmark with its clear space on the field (the default artwork) and transparent / mono variants.
  const wmW = WM.w + 2 * C, wmH = WM.h + 2 * C;
  await out('wordmark.svg', svg(wmW, wmH, wordmark(C, C, 1, { blink: true }), { label: 'PMM wordmark', scale: 12, bg: T.field }));
  await out('logo/pmm-wordmark.svg', svg(wmW, wmH, wordmark(C, C, 1), { label: 'PMM wordmark', scale: 12 }));
  await out('logo/pmm-wordmark-mono.svg', svg(wmW, wmH, wordmark(C, C, 1, { ink: T.field, stripes: Array(6).fill(T.field) }), { label: 'PMM wordmark, one colour', scale: 12 }));

  // Horizontal: wordmark | rule | POINTCAST / MOBILE MESSAGING. Base grid is half a wordmark cell.
  {
    const b = 0.5, w = WM.w + 4 + 1 + 4 + textWidth('MOBILE MESSAGING') * b, h = WM.h;
    const x2 = WM.w + 4 + 1 + 4;
    const body = wordmark(C, C, 1) + px(C + WM.w + 4, C, 1, 9, T.border)
      + text('POINTCAST', C + x2, C, b, T.ink) + text('MOBILE MESSAGING', C + x2, C + 5.5, b, T.ink2);
    await out('logo/pmm-lockup-horizontal.svg', svg(w + 2 * C, h + 2 * C, body, { label: 'PMM horizontal lockup', scale: 8, bg: T.field }));
  }
  // Stacked: mark / wordmark / two-line tagline, centred.
  {
    const b = 0.5, tw = textWidth('MOBILE MESSAGING') * b, w = Math.max(WM.w, tw), cx = (n) => C + (w - n) / 2;
    // No stripes on the letters here: the mark above already carries them once.
    const body = mark(cx(24), C, 1) + wordmark(cx(WM.w - 8) - 8, C + 28, 1, { stripes: [] })
      + text('POINTCAST', cx(textWidth('POINTCAST') * b), C + 41, b, T.ink) + text('MOBILE MESSAGING', cx(tw), C + 46.5, b, T.ink2);
    await out('logo/pmm-lockup-stacked.svg', svg(w + 2 * C, 50 + 2 * C, body, { label: 'PMM stacked lockup', scale: 8, bg: T.field }));
  }
  await out('logo/pmm-mark.svg', svg(24, 24, mark(0, 0, 1), { label: 'PMM mark', scale: 16 }));
  await out('logo/pmm-mark-16.svg', svg(16, 16, mark16(), { label: 'PMM mark, 16 px', scale: 2 }));

  // Twelve sigils on one strip, glyphs under each sprite.
  {
    const cell = 12, cols = 6, rows = 2, gap = 2;
    let body = '';
    EXAMPLES.forEach((hex, i) => {
      const s = sigil(hex), x = gap + (i % cols) * (cell + gap), y = gap + Math.floor(i / cols) * (cell + 5 + gap);
      body += px(x, y, cell, cell, T.field2) + grid(s.sprite.map((r) => r.map((on) => (on ? '#' : '.')).join('')), x + 2, y + 2, 1, s.color);
      body += text(s.hex.slice(0, 4), x + 0.5, y + cell + 1, 0.5, T.ink2);
    });
    await out('sigils.svg', svg(gap + cols * (cell + gap), gap + rows * (cell + 5 + gap), body, { label: 'Twelve example PMM sigils', scale: 8, bg: T.field }));
  }

  const sheet = stickerSheet();
  await out('sticker-sheet.svg', sheet);
  await png('sticker-sheet.png', sheet);

  for (const [name, s] of Object.entries(icons())) {
    await out(`icons/pmm-icon-${name}.svg`, s);
    for (const size of [180, 192, 512]) await png(`icons/pmm-icon-${name}-${size}.png`, s, size);
  }

  await out('tokens.json', JSON.stringify({
    name: 'PMM brand tokens', version: 2, source: 'https://pointcast.xyz/pmm/style.css', generator: 'scripts/pmm-brand.mjs',
    color: TOKENS, mood: Object.fromEntries(MOODS),
    sigil: { module: 'https://pointcast.xyz/pmm/brand/sigil.js', glyphs: '16 PETSCII-style glyphs, low nibble of each of 4 bytes', colors: 8, sprite: '8 x 8, 32 bits mirrored' },
    type: { '--mono': 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace', body: '16px/1.4', label: '12px, uppercase, letter-spacing .14em', key: '13px 700, uppercase, letter-spacing .08em', meta: '10px uppercase, letter-spacing .1em' },
  }, null, 2) + '\n');
  console.log('pmm brand assets written to public/pmm/brand/');
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
