// first-mint.js: the First Mint recipe codec and a deterministic, abstract
// card renderer. Zero dependencies beyond ./pointcast-chain.js. Works in
// browsers and Node 20+.
//
//   import * as fm from "./first-mint.js";
//   const fields = { body: 14, accessory: 132, head: 94, glasses: 18, background: 1,
//                    pattern: 1, font: 2, ink: 0, layout: 0, text: "EL SEGUNDO" };
//   fm.validate(fields);                    // { ok: true, errors: [] }
//   const bytes = fm.encodeRecipe(fields);  // 24 bytes, recipe_v1
//   fm.recipeHash(bytes);                   // hex blake2b-256, domain-separated
//   fm.humanCode(fields);                   // "FM1 14.132.94.18 warm scanlines syne / EL SEGUNDO"
//   const svg = fm.renderCard(bytes, { serial: 42 });
//
// The renderer is pinned by the sha256 of THIS FILE (an open_edition's
// renderer_hash; see scripts/renderer-hash.sh and docs/FIRST_MINT_ART.md).
// Its output is byte-for-byte reproducible on any JS engine: geometry uses
// only + - * / and Math.round/floor (no Math.sin/cos), randomness comes
// only from a splitmix64 stream seeded by the recipe hash, and every
// coordinate is printed as an integer or with one decimal. (The contrast
// check uses Math.pow, but no palette pair lies within 0.01 of 4.5, so an
// ulp of difference between engines cannot flip a verdict; a test pins it.)
//
// ART RULE: the card is abstract. Rings, arcs, tiles, grids, dots, signal
// bars and pixel glyphs only. Never portraits, faces, figures, buildings,
// windows, roofs, vehicles, or recognizable places.
//
// HOSTILE DATA: recipe text is user input. It reaches the SVG only as
// <rect> runs of a built-in 5x7 pixel font with numeric attributes. The
// SVG never contains <text>, <script>, <style>, <image>, <foreignObject>,
// url(), external hrefs or on* attributes; auditSvg() checks that.

import { blake2b, sha256, bytesToHex } from "./pointcast-chain.js";

// ---------------------------------------------------------------- constants

export const RECIPE_VERSION = 1;
export const RENDERER_ID = "pcc-first-mint-abstract/v1";
export const RECIPE_DOMAIN = "pointcast/first-mints/recipe/v1";
export const TEXT_MAX_BYTES = 24;
/** version + 9 u8 fields + u32 text length. */
export const RECIPE_HEADER_LEN = 14;
export const RECIPE_MIN_LEN = RECIPE_HEADER_LEN + 1;
export const RECIPE_MAX_LEN = RECIPE_HEADER_LEN + TEXT_MAX_BYTES;
export const MIN_CONTRAST = 4.5;

/** The nine u8 fields, in encoding order. */
export const FIELDS = Object.freeze([
  "body", "accessory", "head", "glasses", "background", "pattern", "font", "ink", "layout",
]);

/** Inclusive ranges. The four traits are a real Nouns seed minus its background. */
export const RANGES = Object.freeze({
  body: Object.freeze([0, 29]),
  accessory: Object.freeze([0, 142]),
  head: Object.freeze([0, 253]),
  glasses: Object.freeze([0, 22]),
  background: Object.freeze([0, 15]),
  pattern: Object.freeze([0, 15]),
  font: Object.freeze([0, 7]),
  ink: Object.freeze([0, 15]),
  layout: Object.freeze([0, 3]),
});

/** The 44 printable characters plus space. */
export const TEXT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !?&'.,#-";

/** BG_V1 (docs/WALLETS.md). 0-1 Nouns cool/warm, 2-10 town card colors, 11-15 night/paper/signal/marine/ink. */
export const BG_V1 = Object.freeze([
  "#d5d7e1", "#e1d7d5", "#185fa5", "#0a6c9f", "#2f8f4e", "#e0a100", "#e5663b", "#c0262d",
  "#d6457a", "#7152a4", "#1f2a33", "#07172c", "#f3ead7", "#f9c56c", "#9fb8c8", "#111111",
]);
/** One lowercase word per background, used in human codes. */
export const BG_NAMES = Object.freeze([
  "cool", "warm", "cobalt", "cerulean", "fern", "gold", "tangerine", "crimson",
  "rose", "violet", "slate", "night", "paper", "signal", "marine", "ink",
]);

/** INK_V1: 16 inks. The same hex always carries the same name as in BG_NAMES. */
export const INK_V1 = Object.freeze([
  "#111111", "#ffffff", "#f3ead7", "#f9c56c", "#07172c", "#185fa5", "#2f8f4e", "#c0262d",
  "#d6457a", "#7152a4", "#e0a100", "#e5663b", "#0a6c9f", "#1f2a33", "#9fb8c8", "#e1d7d5",
]);
export const INK_NAMES = Object.freeze([
  "ink", "white", "paper", "signal", "night", "cobalt", "fern", "crimson",
  "rose", "violet", "gold", "tangerine", "cerulean", "slate", "marine", "warm",
]);

/** PATTERN_V1 (docs/WALLETS.md). Every one is drawn as abstract geometry. */
export const PATTERN_V1 = Object.freeze([
  "none", "scanlines", "pixel-grid", "dots", "checker", "diagonal", "sunburst", "marine-waves",
  "noggle-tile", "halftone", "static", "signal-rings", "bricks", "plaid", "stars", "confetti",
]);

/** FONT_V1 labels (human codes) and the pixel stroke style each one picks. */
export const FONT_V1 = Object.freeze([
  "pixelify", "jetbrains", "syne", "lora", "gloock", "outfit", "reserved6", "reserved7",
]);
export const FONT_STYLES = Object.freeze([
  "pixel", "thin", "block", "skew", "dotted", "rounded", "pixel", "pixel",
]);

export const LAYOUT_NAMES = Object.freeze(["classic", "words-first", "offset", "monument"]);

/** Every element a card or sigil may contain. */
export const SVG_ELEMENTS = Object.freeze(["svg", "g", "rect", "circle", "path", "line", "polygon", "title"]);
/** Every attribute a card or sigil may carry. */
export const SVG_ATTRIBUTES = Object.freeze([
  "xmlns", "viewBox", "width", "height", "x", "y", "rx", "cx", "cy", "r", "d", "points",
  "x1", "y1", "x2", "y2", "fill", "fill-opacity", "stroke", "stroke-width", "stroke-opacity",
  "stroke-linecap", "stroke-linejoin", "opacity", "shape-rendering",
]);

const W = 360;
const H = 480;

// ---------------------------------------------------------------- errors

/** A recipe failed a rule. `field` and `rule` match validate()'s errors. */
export class FirstMintError extends Error {
  constructor(field, rule, message) {
    super(message || `first mint: ${field} fails ${rule}`);
    this.name = "FirstMintError";
    this.field = field;
    this.rule = rule;
  }
}

// ---------------------------------------------------------------- color

function channel(v) {
  const c = v / 255;
  // WCAG 2 relative luminance in sRGB. 0.03928 vs 0.04045 makes no
  // difference for 8-bit channels (10/255 is below both, 11/255 above).
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of a #rrggbb color. */
export function relativeLuminance(hex) {
  if (typeof hex !== "string" || !/^#[0-9a-fA-F]{6}$/.test(hex)) throw new TypeError("expected #rrggbb");
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG contrast ratio (1..21) between two #rrggbb colors. */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Every (background, ink) index pair that meets MIN_CONTRAST, background-major. */
export const CONTRAST_PAIRS = Object.freeze(
  BG_V1.flatMap((bg, b) =>
    INK_V1.flatMap((ink, i) => (contrastRatio(bg, ink) >= MIN_CONTRAST ? [Object.freeze([b, i])] : [])),
  ),
);

// ---------------------------------------------------------------- validation

const inRange = (field, v) => Number.isInteger(v) && v >= RANGES[field][0] && v <= RANGES[field][1];
const utf8 = (s) => new TextEncoder().encode(s);
const CHARSET_RE = /^[A-Z0-9 !?&'.,#-]*$/;

/**
 * Text rules, in check order. Every rule is evaluated (not first-fail) so
 * the composer can show them all; decodeRecipe() reports the first.
 */
function textRules(text) {
  if (typeof text !== "string") return ["type"];
  const out = [];
  const n = utf8(text).length;
  if (n < 1 || n > TEXT_MAX_BYTES) out.push("length");
  if (!CHARSET_RE.test(text)) out.push("charset");
  if (/^ | $| {2}/.test(text)) out.push("spacing");
  if (/HTTP|WWW/.test(text)) out.push("url");
  if (/\.[A-Z]{2,}/.test(text)) out.push("tld");
  if (/[0-9]{7,}/.test(text)) out.push("digits");
  return out;
}

/**
 * Check a recipe. Errors are `{field, rule}` with rule one of:
 * range (a u8 field), type / length / charset / spacing / url / tld /
 * digits (text), contrast (ink against background).
 *
 * `contrast: false` checks the structural rules only: the ones the codec
 * and the chain enforce. Contrast is renderer and attestor policy.
 */
export function validate(fields, { contrast = true } = {}) {
  if (!fields || typeof fields !== "object" || fields instanceof Uint8Array) {
    return { ok: false, errors: [{ field: "recipe", rule: "type" }] };
  }
  const errors = [];
  for (const f of FIELDS) if (!inRange(f, fields[f])) errors.push({ field: f, rule: "range" });
  for (const rule of textRules(fields.text)) errors.push({ field: "text", rule });
  if (
    contrast &&
    inRange("background", fields.background) &&
    inRange("ink", fields.ink) &&
    contrastRatio(BG_V1[fields.background], INK_V1[fields.ink]) < MIN_CONTRAST
  ) {
    errors.push({ field: "ink", rule: "contrast" });
  }
  return { ok: errors.length === 0, errors };
}

function assertValid(fields, opts) {
  const v = validate(fields, opts);
  if (!v.ok) throw new FirstMintError(v.errors[0].field, v.errors[0].rule);
}

// ---------------------------------------------------------------- codec

/**
 * recipe_v1 = u8 version ‖ u8 body ‖ u8 accessory ‖ u8 head ‖ u8 glasses ‖
 * u8 background ‖ u8 pattern ‖ u8 font ‖ u8 ink ‖ u8 layout ‖ u32 BE length ‖ text.
 * Throws FirstMintError unless the structural rules pass.
 */
export function encodeRecipe(fields) {
  assertValid(fields, { contrast: false });
  const text = utf8(fields.text);
  const out = new Uint8Array(RECIPE_HEADER_LEN + text.length);
  out[0] = RECIPE_VERSION;
  FIELDS.forEach((f, i) => (out[1 + i] = fields[f]));
  new DataView(out.buffer).setUint32(10, text.length);
  out.set(text, RECIPE_HEADER_LEN);
  return out;
}

/**
 * Strict decode. Checks, in this order, and throws the first failure:
 *   recipe/type, recipe/truncated (under 14 bytes), version/version,
 *   <field>/range in FIELDS order, text/length (declared length 1..=24),
 *   recipe/truncated or recipe/trailing (total length must be exact),
 *   text/charset (every byte), then text spacing, url, tld, digits.
 * Contrast is not a structural rule and is not checked here.
 */
export function decodeRecipe(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new FirstMintError("recipe", "type");
  if (bytes.length < RECIPE_HEADER_LEN) throw new FirstMintError("recipe", "truncated");
  if (bytes[0] !== RECIPE_VERSION) throw new FirstMintError("version", "version");
  const fields = {};
  FIELDS.forEach((f, i) => {
    const v = bytes[1 + i];
    if (!inRange(f, v)) throw new FirstMintError(f, "range");
    fields[f] = v;
  });
  const len = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(10);
  if (len < 1 || len > TEXT_MAX_BYTES) throw new FirstMintError("text", "length");
  const rest = bytes.length - RECIPE_HEADER_LEN;
  if (rest < len) throw new FirstMintError("recipe", "truncated");
  if (rest > len) throw new FirstMintError("recipe", "trailing");
  let text = "";
  for (let i = RECIPE_HEADER_LEN; i < bytes.length; i++) {
    const ch = String.fromCharCode(bytes[i]);
    if (bytes[i] > 0x7e || !TEXT_CHARSET.includes(ch)) throw new FirstMintError("text", "charset");
    text += ch;
  }
  const rules = textRules(text);
  if (rules.length) throw new FirstMintError("text", rules[0]);
  fields.text = text;
  return fields;
}

/** Fields or recipe bytes -> { bytes, fields }, structurally valid (throws otherwise). */
export function toRecipe(input) {
  if (input instanceof Uint8Array) return { bytes: input, fields: decodeRecipe(input) };
  const bytes = encodeRecipe(input);
  return { bytes, fields: decodeRecipe(bytes) };
}

function recipeHashBytes(bytes) {
  return blake2b([utf8(RECIPE_DOMAIN), bytes], 32);
}

/** hex(blake2b-256(utf8('pointcast/first-mints/recipe/v1') ‖ recipe_v1)). */
export function recipeHash(input) {
  return bytesToHex(recipeHashBytes(toRecipe(input).bytes));
}

// ---------------------------------------------------------------- share and human codes

const B64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function b64urlEncode(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = i + 2 < bytes.length ? 4 : i + 1 < bytes.length ? 3 : 2;
    for (let k = 0; k < chars; k++) s += B64URL[(n >> (18 - 6 * k)) & 63];
  }
  return s;
}

function b64urlDecode(s) {
  if (s.length % 4 === 1) return null;
  const out = new Uint8Array(Math.floor((s.length * 6) / 8));
  let acc = 0;
  let bits = 0;
  let o = 0;
  for (const ch of s) {
    const v = B64URL.indexOf(ch);
    if (v < 0) return null;
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (acc >> bits) & 255;
    }
    acc &= (1 << bits) - 1;
  }
  return out;
}

/** base64url (no padding) of recipe_v1. Share URL: /first-mints/r/{code}, lab: ?r={code}. */
export function shareCode(input) {
  return b64urlEncode(toRecipe(input).bytes);
}

/**
 * Strict inverse of shareCode(): canonical base64url only (no padding, no
 * stray bits), then decodeRecipe(). Returns { bytes, fields }.
 */
export function fromShareCode(code) {
  if (typeof code !== "string" || code.length === 0 || code.length > 64 || !/^[A-Za-z0-9_-]+$/.test(code)) {
    throw new FirstMintError("share", "format");
  }
  const bytes = b64urlDecode(code);
  if (!bytes || b64urlEncode(bytes) !== code) throw new FirstMintError("share", "format");
  return { bytes, fields: decodeRecipe(bytes) };
}

/**
 * 'FM1 14.132.94.18 warm scanlines syne / EL SEGUNDO'. Ink and layout are
 * appended as ' ink:<name>' and ' L<n>' only when not 0, so the code stays
 * lossless and the WALLETS example reads exactly as written.
 */
export function humanCode(input) {
  const { fields: f } = toRecipe(input);
  let s = `FM1 ${f.body}.${f.accessory}.${f.head}.${f.glasses} ${BG_NAMES[f.background]} ${PATTERN_V1[f.pattern]} ${FONT_V1[f.font]}`;
  if (f.ink !== 0) s += ` ink:${INK_NAMES[f.ink]}`;
  if (f.layout !== 0) s += ` L${f.layout}`;
  return `${s} / ${f.text}`;
}

const HUMAN_RE = /^FM1 (\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3}) ([a-z]+) ([a-z-]+) ([a-z0-9]+)(?: ink:([a-z]+))?(?: L(\d))? \/ (.{1,24})$/;

/** Strict inverse of humanCode(): the result must re-encode to the same code. */
export function parseHumanCode(code) {
  const m = typeof code === "string" ? HUMAN_RE.exec(code) : null;
  if (!m) throw new FirstMintError("human", "format");
  const fields = {
    body: Number(m[1]),
    accessory: Number(m[2]),
    head: Number(m[3]),
    glasses: Number(m[4]),
    background: BG_NAMES.indexOf(m[5]),
    pattern: PATTERN_V1.indexOf(m[6]),
    font: FONT_V1.indexOf(m[7]),
    ink: m[8] === undefined ? 0 : INK_NAMES.indexOf(m[8]),
    layout: m[9] === undefined ? 0 : Number(m[9]),
    text: m[10],
  };
  assertValid(fields, { contrast: false });
  if (humanCode(fields) !== code) throw new FirstMintError("human", "format");
  return fields;
}

// ---------------------------------------------------------------- deterministic math

/** Number -> SVG coordinate: integer or one decimal, never "-0", never exponent form. */
export function fmt(n) {
  const r = Math.round(n * 10) / 10;
  return r === 0 ? "0" : String(r);
}

// Taylor series on [-pi/4, pi/4]; only + - * / so every engine agrees.
function sinSmall(x) {
  const x2 = x * x;
  return x * (1 - (x2 / 6) * (1 - (x2 / 20) * (1 - (x2 / 42) * (1 - (x2 / 72) * (1 - (x2 / 110) * (1 - (x2 / 156) * (1 - x2 / 210)))))));
}
function cosSmall(x) {
  const x2 = x * x;
  return 1 - (x2 / 2) * (1 - (x2 / 12) * (1 - (x2 / 30) * (1 - (x2 / 56) * (1 - (x2 / 90) * (1 - (x2 / 132) * (1 - x2 / 182))))));
}

/** [cos, sin] of an angle in degrees, engine-independent. */
export function cosSinDeg(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  const k = Math.floor((d + 45) / 90); // 0..4; 4 wraps to quadrant 0
  const r = ((d - k * 90) * Math.PI) / 180; // in [-pi/4, pi/4)
  const q = k % 4;
  const s = sinSmall(r);
  const c = cosSmall(r);
  if (q === 0) return [c, s];
  if (q === 1) return [-s, c];
  if (q === 2) return [-c, -s];
  return [s, -c];
}

const MASK64 = (1n << 64n) - 1n;

/** splitmix64: returns next() -> BigInt in [0, 2^64). */
export function splitmix64(seed) {
  let s = BigInt.asUintN(64, BigInt(seed));
  return () => {
    s = (s + 0x9e3779b97f4a7c15n) & MASK64;
    let z = s;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
    return z ^ (z >> 31n);
  };
}

/** The first 8 bytes of a hash as a big-endian BigInt (the PRNG seed). */
export function seedFromHash(hashBytes) {
  let s = 0n;
  for (let i = 0; i < 8; i++) s = (s << 8n) | BigInt(hashBytes[i]);
  return s;
}

// ---------------------------------------------------------------- 5x7 pixel font

// One glyph per printable character; rows top to bottom, '#' = on.
const FONT_5X7 = {
  A: ".###. #...# #...# ##### #...# #...# #...#",
  B: "####. #...# #...# ####. #...# #...# ####.",
  C: ".###. #...# #.... #.... #.... #...# .###.",
  D: "####. #...# #...# #...# #...# #...# ####.",
  E: "##### #.... #.... ####. #.... #.... #####",
  F: "##### #.... #.... ####. #.... #.... #....",
  G: ".###. #...# #.... #.### #...# #...# .####",
  H: "#...# #...# #...# ##### #...# #...# #...#",
  I: ".###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.",
  J: "..### ...#. ...#. ...#. ...#. #..#. .##..",
  K: "#...# #..#. #.#.. ##... #.#.. #..#. #...#",
  L: "#.... #.... #.... #.... #.... #.... #####",
  M: "#...# ##.## #.#.# #.#.# #...# #...# #...#",
  N: "#...# #...# ##..# #.#.# #..## #...# #...#",
  O: ".###. #...# #...# #...# #...# #...# .###.",
  P: "####. #...# #...# ####. #.... #.... #....",
  Q: ".###. #...# #...# #...# #.#.# #..#. .##.#",
  R: "####. #...# #...# ####. #.#.. #..#. #...#",
  S: ".#### #.... #.... .###. ....# ....# ####.",
  T: "##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..",
  U: "#...# #...# #...# #...# #...# #...# .###.",
  V: "#...# #...# #...# #...# #...# .#.#. ..#..",
  W: "#...# #...# #...# #.#.# #.#.# #.#.# .#.#.",
  X: "#...# #...# .#.#. ..#.. .#.#. #...# #...#",
  Y: "#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..",
  Z: "##### ....# ...#. ..#.. .#... #.... #####",
  0: ".###. #...# #..## #.#.# ##..# #...# .###.",
  1: "..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.",
  2: ".###. #...# ....# ...#. ..#.. .#... #####",
  3: "##### ...#. ..#.. ...#. ....# #...# .###.",
  4: "...#. ..##. .#.#. #..#. ##### ...#. ...#.",
  5: "##### #.... ####. ....# ....# #...# .###.",
  6: "..##. .#... #.... ####. #...# #...# .###.",
  7: "##### ....# ...#. ..#.. .#... .#... .#...",
  8: ".###. #...# #...# .###. #...# #...# .###.",
  9: ".###. #...# #...# .#### ....# ...#. .##..",
  "!": "..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..",
  "?": ".###. #...# ....# ...#. ..#.. ..... ..#..",
  "&": ".##.. #..#. #.#.. .#... #.#.# #..#. .##.#",
  "'": "..#.. ..#.. .#... ..... ..... ..... .....",
  ".": "..... ..... ..... ..... ..... .##.. .##..",
  ",": "..... ..... ..... ..... .##.. ..#.. .#...",
  "#": ".#.#. .#.#. ##### .#.#. ##### .#.#. .#.#.",
  "-": "..... ..... ..... ##### ..... ..... .....",
};

/** char -> 7 rows of 5 booleans. Space has no glyph (it only advances). */
export const GLYPHS = Object.freeze(
  Object.fromEntries(
    Object.entries(FONT_5X7).map(([ch, rows]) => [
      ch,
      Object.freeze(rows.split(" ").map((r) => Object.freeze([...r].map((c) => c === "#")))),
    ]),
  ),
);

const STYLE_SET = new Set(["pixel", "thin", "block", "skew", "dotted", "rounded"]);

function styleMetrics(style) {
  if (!STYLE_SET.has(style)) throw new TypeError(`unknown pixel style ${style}`);
  return {
    adv: style === "block" ? 7 : 6, // cells per character, gap included
    extra: style === "skew" ? 1.8 : 0, // cells of italic lean at the top row
  };
}

/** Width in px of `str` drawn at `cell` px per pixel. */
export function pixelTextWidth(str, cell, style = "pixel") {
  if (str.length === 0) return 0;
  const { adv, extra } = styleMetrics(style);
  return (str.length * adv - 1 + extra) * cell;
}

function glyphRows(ch, style) {
  const g = GLYPHS[ch];
  if (!g) throw new FirstMintError("text", "charset");
  if (style !== "block") return g;
  // Bitmap emboldening: every pixel also lights the one to its right.
  return g.map((row) => Array.from({ length: 6 }, (_, c) => Boolean(row[c] || row[c - 1])));
}

/**
 * `str` as <rect> runs at (x, y), top-left, `cell` px per pixel. Only
 * characters of TEXT_CHARSET are accepted. Output carries numeric
 * attributes only; the caller supplies fill on a parent <g>.
 */
export function pixelTextRects(str, x, y, cell, style = "pixel") {
  const { adv } = styleMetrics(style);
  const out = [];
  const rx = style === "rounded" ? ` rx="${fmt(cell * 0.35)}"` : "";
  [...str].forEach((ch, i) => {
    if (ch === " ") return;
    const gx = x + i * adv * cell;
    glyphRows(ch, style).forEach((row, r) => {
      const gy = y + r * cell;
      if (style === "dotted") {
        row.forEach((on, c) => {
          if (on) out.push(rect(gx + c * cell + cell * 0.2, gy + cell * 0.2, cell * 0.6, cell * 0.6));
        });
        return;
      }
      const lean = style === "skew" ? (6 - r) * cell * 0.3 : 0;
      for (let c = 0; c < row.length; c++) {
        if (!row[c]) continue;
        let e = c;
        while (e + 1 < row.length && row[e + 1]) e++;
        const rx0 = gx + c * cell + lean;
        if (style === "thin") out.push(rect(rx0, gy + cell * 0.25, (e - c + 1) * cell, cell * 0.5));
        else out.push(rect(rx0, gy, (e - c + 1) * cell, cell, rx));
        c = e;
      }
    });
  });
  return out.join("");
}

function rect(x, y, w, h, extra = "") {
  return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}"${extra}/>`;
}

// ---------------------------------------------------------------- shared drawing

/** A clockwise arc starting at `startDeg` (-90 = 12 o'clock) covering `frac` (0..1) of the circle, as path data. */
export function arcPath(cx, cy, r, startDeg, frac) {
  const [c0, s0] = cosSinDeg(startDeg);
  const [c1, s1] = cosSinDeg(startDeg + 360 * frac);
  const large = frac > 0.5 ? 1 : 0;
  return `M${fmt(cx + r * c0)} ${fmt(cy + r * s0)}A${fmt(r)} ${fmt(r)} 0 ${large} 1 ${fmt(cx + r * c1)} ${fmt(cy + r * s1)}`;
}

/** A 4x4 tile code: row i is the low nibble of nibbles[i], MSB on the left. */
export function tileCodeSvg(cx, cy, cell, gap, nibbles, ink) {
  const size = 4 * cell + 3 * gap;
  const x0 = cx - size / 2;
  const y0 = cy - size / 2;
  const on = [];
  const off = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = x0 + c * (cell + gap);
      const y = y0 + r * (cell + gap);
      if ((nibbles[r] >> (3 - c)) & 1) on.push(rect(x, y, cell, cell));
      else off.push(rect(x + cell * 0.35, y + cell * 0.35, cell * 0.3, cell * 0.3));
    }
  }
  return `<g fill="${ink}">${on.join("")}</g><g fill="${ink}" fill-opacity="0.35">${off.join("")}</g>`;
}

/** Fixed label text in the pixel font on a background plate. align: left | right. */
export function labelSvg(str, x, y, cell, align, ink, bg, opacity = "0.75") {
  const w = pixelTextWidth(str, cell);
  const lx = align === "right" ? x - w : x;
  const pad = cell * 1.5;
  return (
    `<rect x="${fmt(lx - pad)}" y="${fmt(y - pad)}" width="${fmt(w + 2 * pad)}" height="${fmt(7 * cell + 2 * pad)}" fill="${bg}"/>` +
    `<g fill="${ink}" opacity="${opacity}" shape-rendering="crispEdges">${pixelTextRects(str, lx, y, cell)}</g>`
  );
}

// ---------------------------------------------------------------- patterns

const sq = (x, y, s) => `M${fmt(x)} ${fmt(y)}h${fmt(s)}v${fmt(s)}h${fmt(-s)}z`;
const dot = (x, y, r) => `M${fmt(x - r)} ${fmt(y)}a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(2 * r)} 0a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-2 * r)} 0`;
const fillG = (ink, d, op = "0.16") => `<g fill="${ink}" opacity="${op}"><path d="${d}"/></g>`;
const strokeG = (ink, d, sw, op = "0.16", cap = "butt") =>
  `<g fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linecap="${cap}" opacity="${op}"><path d="${d}"/></g>`;

const PATTERNS = [
  // 0 none
  () => "",
  // 1 scanlines: 2 px bars every 6 px
  ({ ink }) => {
    let d = "";
    for (let y = 3; y < H; y += 6) d += `M0 ${y}h${W}`;
    return strokeG(ink, d, 2);
  },
  // 2 pixel-grid: a 24 px grid
  ({ ink }) => {
    let d = "";
    for (let x = 12; x < W; x += 24) d += `M${x} 0v${H}`;
    for (let y = 12; y < H; y += 24) d += `M0 ${y}h${W}`;
    return strokeG(ink, d, 1, "0.2");
  },
  // 3 dots: a 20 px dot lattice
  ({ ink }) => {
    let d = "";
    for (let y = 10; y < H; y += 20) for (let x = 10; x < W; x += 20) d += dot(x, y, 2);
    return fillG(ink, d, "0.2");
  },
  // 4 checker: 30 px squares
  ({ ink }) => {
    let d = "";
    for (let r = 0; r < H / 30; r++) for (let c = 0; c < W / 30; c++) if ((r + c) % 2 === 0) d += sq(c * 30, r * 30, 30);
    return fillG(ink, d, "0.08");
  },
  // 5 diagonal: 45 degree strokes every 16 px
  ({ ink }) => {
    let d = "";
    for (let k = -H; k < W; k += 16) d += `M${k} 0L${k + H} ${H}`;
    return strokeG(ink, d, 2, "0.14");
  },
  // 6 sunburst: 18 wedges of 10 degrees around the glyph centre
  ({ ink, gx, gy }) => {
    let d = "";
    for (let i = 0; i < 18; i++) {
      const [c0, s0] = cosSinDeg(i * 20 - 90);
      const [c1, s1] = cosSinDeg(i * 20 - 80);
      d += `M${fmt(gx)} ${fmt(gy)}L${fmt(gx + 720 * c0)} ${fmt(gy + 720 * s0)}L${fmt(gx + 720 * c1)} ${fmt(gy + 720 * s1)}z`;
    }
    return fillG(ink, d, "0.1");
  },
  // 7 marine-waves: sine strokes (smooth quadratic half-waves), 48 px period
  ({ ink }) => {
    let d = "";
    for (let y = 12; y < H + 12; y += 24) {
      d += `M-24 ${y}q12 -7 24 0`;
      for (let x = 0; x < W + 24; x += 24) d += "t24 0";
    }
    return strokeG(ink, d, 2, "0.16", "round");
  },
  // 8 noggle-tile: a two-square tile, half-offset rows
  ({ ink }) => {
    let d = "";
    for (let r = 0; r * 32 < H; r++) {
      const off = r % 2 ? -24 : 0;
      for (let x = off; x < W; x += 48) d += sq(x + 6, r * 32 + 9, 14) + sq(x + 24, r * 32 + 9, 14);
    }
    return fillG(ink, d, "0.12");
  },
  // 9 halftone: dots that grow toward the lower right
  ({ ink }) => {
    let d = "";
    for (let y = 10; y < H; y += 20) for (let x = 10; x < W; x += 20) d += dot(x, y, 0.6 + (5 * (x + y)) / (W + H));
    return fillG(ink, d, "0.16");
  },
  // 10 static: 6 px cells, one in eight lit, from the recipe-seeded stream
  ({ ink, rng }) => {
    let d = "";
    for (let y = 0; y < H; y += 6) for (let x = 0; x < W; x += 6) if ((rng() & 7n) === 0n) d += sq(x, y, 6);
    return fillG(ink, d, "0.2");
  },
  // 11 signal-rings: concentric rings around the glyph centre
  ({ ink, gx, gy }) => {
    let s = "";
    for (let r = 24; r < 620; r += 18) s += `<circle cx="${fmt(gx)}" cy="${fmt(gy)}" r="${r}"/>`;
    return `<g fill="none" stroke="${ink}" stroke-width="2" opacity="0.14">${s}</g>`;
  },
  // 12 bricks: an offset tile bond, 40 x 16
  ({ ink }) => {
    let d = "";
    for (let r = 0; r * 16 <= H; r++) {
      d += `M0 ${r * 16}h${W}`;
      for (let x = r % 2 ? 20 : 0; x <= W; x += 40) d += `M${x} ${r * 16}v16`;
    }
    return strokeG(ink, d, "1.5", "0.16");
  },
  // 13 plaid: wide and thin bands both ways; crossings darken
  ({ ink }) => {
    let s = "";
    for (let x = 0; x < W; x += 60) s += rect(x + 8, 0, 20, H) + rect(x + 40, 0, 3, H);
    for (let y = 0; y < H; y += 60) s += rect(0, y + 8, W, 20) + rect(0, y + 40, W, 3);
    return `<g fill="${ink}" fill-opacity="0.08">${s}</g>`;
  },
  // 14 stars: four-point sparkles, jittered on a 60 px lattice
  ({ ink, rng }) => {
    let d = "";
    for (let gy0 = 0; gy0 < H; gy0 += 60) {
      for (let gx0 = 0; gx0 < W; gx0 += 60) {
        const v = rng();
        if (v % 3n === 0n) continue;
        const x = gx0 + 10 + Number((v >> 8n) % 40n);
        const y = gy0 + 10 + Number((v >> 16n) % 40n);
        const s = 3 + Number((v >> 24n) % 5n);
        const t = s * 0.25;
        d += `M${fmt(x)} ${fmt(y - s)}L${fmt(x + t)} ${fmt(y - t)}L${fmt(x + s)} ${fmt(y)}L${fmt(x + t)} ${fmt(y + t)}L${fmt(x)} ${fmt(y + s)}L${fmt(x - t)} ${fmt(y + t)}L${fmt(x - s)} ${fmt(y)}L${fmt(x - t)} ${fmt(y - t)}z`;
      }
    }
    return fillG(ink, d, "0.28");
  },
  // 15 confetti: short strokes in 8 directions, jittered on a 40 px lattice
  ({ ink, rng }) => {
    let d = "";
    for (let gy0 = 0; gy0 < H; gy0 += 40) {
      for (let gx0 = 0; gx0 < W; gx0 += 40) {
        const v = rng();
        const x = gx0 + 8 + Number(v % 24n);
        const y = gy0 + 8 + Number((v >> 8n) % 24n);
        const [c, s] = cosSinDeg(Number((v >> 16n) % 8n) * 22.5);
        d += `M${fmt(x - 4 * c)} ${fmt(y - 4 * s)}L${fmt(x + 4 * c)} ${fmt(y + 4 * s)}`;
      }
    }
    return strokeG(ink, d, 3, "0.24", "square");
  },
];

// ---------------------------------------------------------------- card

// glyph: ring centre and outer radius. words: box, horizontal align,
// vertical align, largest pixel cell.
const LAYOUTS = [
  { gx: 180, gy: 192, R: 96, words: { x: 32, y: 316, w: 296, h: 100, align: "center", valign: "middle", maxCell: 10 } },
  { gx: 180, gy: 300, R: 96, words: { x: 32, y: 60, w: 296, h: 112, align: "center", valign: "middle", maxCell: 10 } },
  { gx: 118, gy: 156, R: 80, words: { x: 32, y: 264, w: 296, h: 152, align: "left", valign: "bottom", maxCell: 12 } },
  { gx: 180, gy: 208, R: 128, words: { x: 32, y: 362, w: 296, h: 54, align: "center", valign: "middle", maxCell: 6 } },
];
const CELLS = [12, 11, 10, 9, 8, 7, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2];

/** Greedy word wrap at `max` characters; words longer than a line are hard-broken. */
export function wrapWords(text, max) {
  const lines = [];
  let cur = "";
  for (let w of text.split(" ")) {
    while (w.length > max) {
      if (cur) lines.push(cur);
      cur = "";
      lines.push(w.slice(0, max));
      w = w.slice(max);
    }
    if (!w) continue;
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= max) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * The cell size and lines for `text` in the layout's word box. Prefers the
 * largest cell that needs no mid-word break; a mid-word break is used only
 * when it allows a cell more than twice as large (a single long word).
 */
export function fitWords(text, layout, style) {
  const box = LAYOUTS[layout].words;
  const { adv, extra } = styleMetrics(style);
  const longest = Math.max(...text.split(" ").map((w) => w.length));
  let clean = null;
  let broken = null;
  for (const cell of CELLS) {
    if (cell > box.maxCell) continue;
    const max = Math.floor((box.w / cell - extra + 1) / adv);
    if (max < 1) continue;
    const lines = wrapWords(text, max);
    if ((lines.length * 9 - 2) * cell > box.h) continue;
    if (!broken) broken = { cell, lines };
    if (max >= longest) {
      clean = { cell, lines };
      break;
    }
  }
  if (clean && clean.cell * 2 >= broken.cell) return clean;
  if (broken) return broken;
  throw new FirstMintError("text", "fit");
}

function seedGlyph(f, { gx, gy, R }, ink, bg) {
  const sw = R * 0.085;
  const out = [`<circle cx="${fmt(gx)}" cy="${fmt(gy)}" r="${fmt(R * 1.12)}" fill="${bg}"/>`];
  const tracks = [];
  const arcs = [];
  const caps = [];
  ["body", "accessory", "head", "glasses"].forEach((t, i) => {
    const r = R * (1 - i * 0.2);
    const count = RANGES[t][1] + 1;
    tracks.push(`<circle cx="${fmt(gx)}" cy="${fmt(gy)}" r="${fmt(r)}"/>`);
    if (f[t] === 0) caps.push(`<circle cx="${fmt(gx)}" cy="${fmt(gy - r)}" r="${fmt(sw / 2)}"/>`);
    else arcs.push(`<path d="${arcPath(gx, gy, r, -90, f[t] / count)}"/>`);
  });
  out.push(`<g fill="none" stroke="${ink}" stroke-width="${fmt(sw)}" stroke-opacity="0.18">${tracks.join("")}</g>`);
  out.push(`<g fill="none" stroke="${ink}" stroke-width="${fmt(sw)}" stroke-linecap="round">${arcs.join("")}</g>`);
  if (caps.length) out.push(`<g fill="${ink}">${caps.join("")}</g>`);
  const cell = Math.round(R * 0.09 * 2) / 2;
  const gap = Math.round(R * 0.02 * 2) / 2;
  out.push(tileCodeSvg(gx, gy, cell, gap, [f.body & 15, f.accessory & 15, f.head & 15, f.glasses & 15], ink));
  return out.join("");
}

function wordsSvg(f, layout, ink, bg) {
  const style = FONT_STYLES[f.font];
  const box = LAYOUTS[layout].words;
  const { cell, lines } = fitWords(f.text, layout, style);
  const blockH = (lines.length * 9 - 2) * cell;
  const top = box.valign === "bottom" ? box.y + box.h - blockH : Math.round(box.y + (box.h - blockH) / 2);
  const widths = lines.map((l) => pixelTextWidth(l, cell, style));
  const xs = widths.map((w) => (box.align === "left" ? box.x : Math.round(box.x + (box.w - w) / 2)));
  const pad = Math.max(6, 2 * cell);
  const left = Math.min(...xs);
  const right = Math.max(...xs.map((x, i) => x + widths[i]));
  const plate = rect(left - pad, top - pad, right - left + 2 * pad, blockH + 2 * pad, ` fill="${bg}"`);
  const crisp = style === "skew" || style === "rounded" ? "" : ` shape-rendering="crispEdges"`;
  const rects = lines.map((l, i) => pixelTextRects(l, xs[i], top + i * 9 * cell, cell, style)).join("");
  return `${plate}<g fill="${ink}"${crisp}>${rects}</g>`;
}

function serialLabel(serial) {
  if (!Number.isInteger(serial) || serial < 1 || serial > 0xffffffff) throw new FirstMintError("serial", "range");
  return `#${String(serial).padStart(4, "0")}`;
}

/**
 * The card for a recipe (fields or recipe_v1 bytes), as an SVG string.
 * Throws FirstMintError unless validate() passes, contrast included.
 * Options: serial (1..=2^32-1) draws '#0042' in pixel digits.
 */
export function renderCard(input, { serial } = {}) {
  const { bytes, fields: f } = toRecipe(input);
  assertValid(f);
  const label = serial === undefined || serial === null ? null : serialLabel(serial);
  const hash = recipeHashBytes(bytes);
  const bg = BG_V1[f.background];
  const ink = INK_V1[f.ink];
  const L = LAYOUTS[f.layout];
  const rng = splitmix64(seedFromHash(hash));
  const code = `FM1 ${f.body}.${f.accessory}.${f.head}.${f.glasses}`;
  // A serial that would meet the trait code rides one row up, its plate
  // starting below y=416, where every word box ends.
  const serialY = label && 28 + pixelTextWidth(code, 2) + 12 > W - 28 - pixelTextWidth(label, 2) ? H - 60 : H - 42;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<title>First Mint${label ? " " + label : ""}</title>`,
    `<rect width="${W}" height="${H}" fill="${bg}"/>`,
    PATTERNS[f.pattern]({ ink, gx: L.gx, gy: L.gy, rng }),
    `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${ink}" stroke-opacity="0.4" stroke-width="1"/>`,
    seedGlyph(f, L, ink, bg),
    wordsSvg(f, f.layout, ink, bg),
    labelSvg("FIRST MINT", 28, 28, 2, "left", ink, bg),
    labelSvg(bytesToHex(hash.subarray(0, 4)).toUpperCase(), W - 28, 28, 2, "right", ink, bg),
    labelSvg(code, 28, H - 42, 2, "left", ink, bg),
    label ? labelSvg(label, W - 28, serialY, 2, "right", ink, bg, "1") : "",
    `</svg>`,
  ].join("");
}

/** hex sha256 of an SVG string's UTF-8 bytes (what the vectors pin). */
export function svgSha256(svg) {
  return bytesToHex(sha256(utf8(svg)));
}

// ---------------------------------------------------------------- audit

/**
 * Check an SVG string against the element and attribute allowlists.
 * Returns { ok, problems } and never throws. Mint walls can run this
 * before showing any card or sigil.
 */
export function auditSvg(svg) {
  const problems = [];
  if (typeof svg !== "string") return { ok: false, problems: ["not a string"] };
  if (!svg.startsWith("<svg ") || !svg.endsWith("</svg>")) problems.push("not a single <svg> root");
  if (/<!|<\?|&|url\(|javascript:|\\/i.test(svg)) problems.push("forbidden token (<!, <?, &, url(, javascript:, backslash)");
  const tagRe = /<(\/?)([A-Za-z][A-Za-z0-9:-]*)((?:\s+[A-Za-z][A-Za-z0-9:-]*="[^"<>]*")*)\s*(\/?)>/g;
  let consumed = 0;
  let prev = "";
  let m;
  while ((m = tagRe.exec(svg))) {
    const between = svg.slice(consumed, m.index);
    const name = m[2];
    // Only <title> may hold text, and only fixed words, digits and '#'.
    const inTitle = prev === "<title" && m[1] === "/" && name === "title";
    if (between && !(inTitle && /^[A-Za-z0-9 #]*$/.test(between))) {
      problems.push(`stray text ${JSON.stringify(between.slice(0, 24))}`);
    }
    consumed = m.index + m[0].length;
    prev = `<${m[1]}${name}${m[4]}`; // '<title/' (self-closed) never opens a text slot
    if (!SVG_ELEMENTS.includes(name)) problems.push(`element <${name}>`);
    for (const a of m[3].matchAll(/([A-Za-z][A-Za-z0-9:-]*)="([^"]*)"/g)) {
      if (!SVG_ATTRIBUTES.includes(a[1])) problems.push(`attribute ${a[1]} on <${name}>`);
      if (a[1] === "xmlns" ? a[2] !== "http://www.w3.org/2000/svg" : !/^[#0-9A-Za-z .,-]*$/.test(a[2])) {
        problems.push(`value of ${a[1]} on <${name}>`);
      }
    }
  }
  if (consumed !== svg.length) problems.push("trailing or unparsed markup");
  const titles = svg.match(/<title>[^<]*<\/title>/g) || [];
  if (titles.length > 1) problems.push("more than one <title>");
  return { ok: problems.length === 0, problems };
}
