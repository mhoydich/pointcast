/**
 * bloom.js — Checkpoint Blooms for the PointCast devnet (/chain/bloom).
 *
 * A bloom is a drawing of a checkpoint block's hash. Every 10th block of the
 * devnet is a checkpoint (the Daily Net's witnesses attest them); the hash of
 * that block is 64 hex characters, and this module turns those characters into
 * one abstract SVG: a ground, three rings of petals, a few rings and signal
 * arcs, a bud, and a calm stipple. Same hash, same bytes. The blooms are free,
 * have no price and are not tokens: they are drawings of the chain's own
 * checkpoints. Devnet · no value · may reset.
 *
 * How the hash becomes a drawing (the code between the recipe markers below is
 * the whole of it, and /chain/bloom prints exactly that text):
 *   - seeds: the chain's own blake2b-512 (public/chain/sdk/pointcast-chain.js)
 *     over [the 32 hash bytes, one counter byte] for counters 0, 1 and 2 gives
 *     192 seed bytes. Two bytes make one number in [0, 1).
 *   - palette: chosen in OKLCH, in the PointCast mood (a deep ground tinted like
 *     --pc-ink, a near-white ink like --pc-bg, three saturated-but-calm petal
 *     colours whose chroma sits where the BLOCKS.md channel ramps sit), then
 *     written as sRGB hex so every SVG renderer agrees.
 *   - geometry: petal count, ring radii, arc starts and sweeps and stipple
 *     jitter all come from the next numbers in order.
 * The SVG has no text, no image, no script and no external reference: only
 * rect, circle, path and g. auditSvg() proves it for every SVG the page shows
 * or offers for download.
 *
 * Importable by node and by browsers; touches no DOM and no network.
 * Floating point: Math.sin, cos and pow are not specified to the last bit, so
 * the numbers are rounded to 0.1 and the colours to 8 bits. Checked by hand on
 * 2026-10-19 (Pacific): V8 (node 24) and JavaScriptCore (macOS jsc) draw byte-identical
 * SVG for 1,000 hashes. SpiderMonkey (Firefox) has not been run; the test
 * suite itself runs on V8 only.
 */
import { blake2b, hexToBytes } from '../sdk/pointcast-chain.js';

export const BLOOM_VERSION = 'bloom/1';
export const CHECKPOINT_INTERVAL = 10;
export const GRID_COUNT = 120;
export const MAX_WITNESS_RINGS = 14;
export const HEX64 = /^[0-9a-f]{64}$/;
export const SVG_NS = 'http://www.w3.org/2000/svg';

// <recipe>
export function bloom(hash) {
  const B = [0, 1, 2].flatMap((c) => [...blake2b([hexToBytes(hash), [c]], 64)]); let i = 0; // 192 seed bytes: the chain's own hash, three counters
  const u = (a, b) => a + (b - a) * ((B[i++] << 8) | B[i++]) / 65536, R = (x) => Math.round(x * 10) / 10, P = (r, t) => `${R(500 + r * Math.sin(t))} ${R(500 - r * Math.cos(t))}`; // u: next two bytes as a number in [a, b)
  const T = (n, a, k = '') => `<${n} ${Object.entries(a).map(([x, v]) => `${x}="${v}"`).join(' ')}${k ? `>${k}</${n}>` : '/>'}`; // one SVG tag; every value is a number or a hex colour
  const hex = (L, C, H) => { const [a, b] = [Math.cos, Math.sin].map((f) => C * f(H * Math.PI / 180)), g = (v) => (v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055);
    const [l, m, s] = [[.3963, .2158], [-.1056, -.0639], [-.0895, -1.2915]].map(([p, q]) => (L + p * a + q * b) ** 3); // OKLCH -> OKLab -> linear sRGB -> hex
    return '#' + [[4.0767, -3.3077, .231], [-1.2684, 2.6098, -.3413], [-.0042, -.7034, 1.7076]].map(([p, q, r]) => Math.round(255 * Math.min(1, Math.max(0, g(p * l + q * m + r * s)))).toString(16).padStart(2, '0')).join(''); };
  const h0 = u(0, 360), ink = hex(.94, .02, h0), bg = hex(u(.17, .25), u(.02, .06), h0 + 190); // palette: a hue, a near-white ink, a deep ground
  const c = [hex(u(.7, .88), u(.08, .14), h0), hex(u(.62, .78), u(.1, .16), h0 + u(25, 70)), hex(u(.82, .93), u(.05, .1), h0 - u(20, 60)), hex(u(.74, .86), u(.1, .15), h0 + u(150, 210))];
  const n = Math.floor(u(5, 14)), len = u(280, 340), wide = u(.35, .8), tip = u(.35, 1), ratio = u(.55, .8); // petals: count, length, width, tip, inner ratio
  const petals = [0, 1, 2].map((j) => { const m = n * (1 + (j > 1)), L = len * [1, ratio, ratio * .6][j], x = L * wide / 2; // three layers of petals, drawn as paths
    const d = `M500 500C${R(500 - x)} ${R(500 - L * .35)} ${R(500 - x * tip)} ${R(500 - L * .9)} 500 ${R(500 - L)}C${R(500 + x * tip)} ${R(500 - L * .9)} ${R(500 + x)} ${R(500 - L * .35)} 500 500Z`;
    return Array.from({ length: m }, (_, k) => T('path', { d, transform: `rotate(${R((k + [0, .5, .25][j]) * 360 / m)} 500 500)`, fill: c[j], 'fill-opacity': [.8, .7, .9][j] })).join(''); }).join('');
  const rings = Array.from({ length: Math.floor(u(3, 7)) }, () => T('circle', { cx: 500, cy: 500, r: R(u(60, 372)), fill: 'none', stroke: ink, 'stroke-opacity': .6, 'stroke-width': R(u(1, 3)), ...(u(0, 1) > .5 && { 'stroke-dasharray': `${R(u(2, 10))} ${R(u(4, 16))}` }) })).join('');
  const arcs = Array.from({ length: Math.floor(u(3, 6)) }, (_, k) => { const r = u(90, 372), t = u(0, 6.2832), s = u(.5, 3.4); // signal arcs: radius, start angle, sweep
    return T('path', { d: `M${P(r, t)}A${R(r)} ${R(r)} 0 ${+(s > Math.PI)} 1 ${P(r, t + s)}`, fill: 'none', stroke: c[k % 2 ? 3 : 1], 'stroke-width': R(u(4, 10)), 'stroke-linecap': 'round', 'stroke-opacity': .95 }); }).join('');
  const grain = T('path', { d: Array.from({ length: 120 }, (_, k) => `M${P(Math.sqrt((k + .5) / 120) * 480, k * 2.39996 + B[k] / 40)}h0`).join(''), stroke: ink, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-opacity': .2 }); // calm grain
  return T('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 1000 1000', width: 1000, height: 1000 }, T('rect', { x: -1e3, y: -1e3, width: 3e3, height: 3e3, fill: bg })
    + T('circle', { cx: 500, cy: 500, r: R(u(150, 330)), fill: c[1], 'fill-opacity': .12 }) + T('g', { class: 'p' }, petals) + rings + arcs + T('circle', { cx: 500, cy: 500, r: R(u(8, 22)), fill: ink }) + grain);
}
// </recipe>

// ---------------------------------------------------------------- the public drawing API

/** Warm gold for the thin rings outside the bloom (one per witness key); the faint halos of the OG variant stay pale. */
const RING_INK = '#f2d48a';
const HALO_INK = '#f4f1ea';
const DRIFT = '<animateTransform attributeName="transform" type="rotate" from="0 500 500" to="360 500 500" dur="240s" repeatCount="indefinite"/>';
export const OG_SIZE = Object.freeze({ width: 1200, height: 630 });
// 1000 * 1200 / 630 = 1904.8 wide, centred on x = 500: the whole bloom, with the ground reaching both sides.
const OG_HEAD = 'viewBox="-452.4 0 1904.8 1000" width="1200" height="630"';
const HALOS = [560, 700, 860]
  .map((r) => `<circle cx="500" cy="500" r="${r}" fill="none" stroke="${HALO_INK}" stroke-opacity=".07" stroke-width="1.5"/>`)
  .join('');

/** Throws unless `hash` is 64 lowercase hex characters (a block hash as the devnet writes it). */
export function assertHash(hash) {
  if (typeof hash !== 'string' || !HEX64.test(hash)) throw new TypeError('bloom: a block hash is 64 lowercase hex characters');
  return hash;
}

/**
 * The bloom of one block hash, as an SVG string. Same hash and options, same
 * bytes. With no options it is exactly bloom(hash), the recipe.
 *   witnesses  distinct witness keys that attested this checkpoint: one thin
 *              gold ring outside the bloom for each (radius 390 + 7 k), at most MAX_WITNESS_RINGS
 *   og         1200 x 630 instead of square: the same bloom, centred, with
 *              three faint halo rings reaching the sides
 *   drift      adds a 240 s petal rotation (SMIL); the still bloom is the
 *              default and the only thing the page ever offers for download
 */
export function bloomSvg(hash, opts = {}) {
  assertHash(hash);
  const witnesses = Math.min(MAX_WITNESS_RINGS, Math.max(0, Math.floor(Number(opts.witnesses) || 0)));
  let svg = bloom(hash);
  if (opts.og) svg = svg.replace('viewBox="0 0 1000 1000" width="1000" height="1000"', OG_HEAD).replace('<g class="p">', `${HALOS}<g class="p">`);
  if (witnesses) {
    const rings = Array.from({ length: witnesses }, (_, k) => `<circle cx="500" cy="500" r="${390 + 7 * k}" fill="none" stroke="${RING_INK}" stroke-opacity=".9" stroke-width="1.6"/>`).join('');
    svg = svg.replace(/<\/svg>$/, `${rings}</svg>`);
  }
  if (opts.drift) svg = svg.replace('<g class="p">', `<g class="p">${DRIFT}`);
  return svg;
}

/** The 1200 x 630 social-card variant of a bloom (for later use: an OG image, a card). */
export const bloomOgSvg = (hash, opts = {}) => bloomSvg(hash, { ...opts, og: true });

// ---------------------------------------------------------------- the audit

// The only elements a bloom uses, plus the one animation the drift option adds.
const OK_TAGS = new Set(['svg', 'g', 'rect', 'circle', 'path', 'animateTransform']);
const NAMED_BAD = new Set([
  'text', 'tspan', 'textpath', 'title', 'desc', 'metadata', 'image', 'foreignobject', 'script', 'style', 'a', 'use', 'iframe', 'object', 'embed',
  'link', 'animate', 'set', 'animatemotion', 'font', 'glyph', 'symbol', 'pattern', 'filter', 'marker', 'switch', 'view', 'cursor',
]);
const TAG_RE = /<(\/?)([A-Za-z][A-Za-z0-9:._-]*)((?:\s+[A-Za-z_:][A-Za-z0-9_:.-]*\s*=\s*(?:"[^"<>]*"|'[^'<>]*'))*)\s*(\/?)>/y;
const ATTR_RE = /([A-Za-z_:][A-Za-z0-9_:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const REF_ATTRS = new Set(['href', 'xlink:href', 'src', 'action', 'formaction', 'data', 'poster']);

/**
 * What is wrong with an SVG string, as a list of plain sentences (empty when
 * it is clean). A clean bloom has: one svg root with the SVG namespace and no
 * other namespace; only svg, g, rect, circle, path (and the drift's
 * animateTransform); no text between tags and no text-bearing or embedding
 * element (text, tspan, title, desc, image, foreignObject, script, style, a,
 * use, animate, set, filter ...); no comment, doctype, CDATA or processing
 * instruction; no on* handler; no href or src of any kind; no url() that is not
 * a fragment; no javascript:, data: or network address in any value.
 */
export function auditSvg(svg) {
  const problems = [];
  if (typeof svg !== 'string') return ['the SVG is not a string'];
  if (svg.length > 400_000) problems.push('the SVG is larger than 400 KB');
  const stack = [];
  let roots = 0;
  let pos = 0;
  while (pos < svg.length) {
    const lt = svg.indexOf('<', pos);
    const between = svg.slice(pos, lt < 0 ? svg.length : lt);
    if (/\S/.test(between)) problems.push('text between tags: a bloom has no letters or numerals');
    if (lt < 0) break;
    TAG_RE.lastIndex = lt;
    const m = TAG_RE.exec(svg);
    if (!m) {
      problems.push(`markup the audit does not accept at offset ${lt}: a comment, doctype, CDATA, processing instruction or malformed tag`);
      break;
    }
    pos = TAG_RE.lastIndex;
    const [, closing, name, attrText, selfClosing] = m;
    const lower = name.toLowerCase();
    if (!OK_TAGS.has(name)) problems.push(NAMED_BAD.has(lower) ? `<${name}> is not allowed` : `<${name}> is not an element a bloom uses`);
    if (closing) {
      if (stack.pop() !== name) problems.push(`</${name}> does not close the element that is open`);
      continue;
    }
    if (stack.length === 0) {
      roots += 1;
      if (name !== 'svg') problems.push('the root element is not svg');
    }
    const attrs = new Map();
    for (const a of attrText.matchAll(ATTR_RE)) {
      const key = a[1];
      const val = a[2] ?? a[3] ?? '';
      const kl = key.toLowerCase();
      if (attrs.has(key)) problems.push(`<${name}> repeats ${key}`);
      attrs.set(key, val);
      if (kl.startsWith('on')) problems.push(`<${name}> has an event handler (${key})`);
      if (kl === 'style') problems.push(`<${name}> has a style attribute`);
      if (kl.startsWith('xmlns')) {
        if (!(key === 'xmlns' && name === 'svg' && val === SVG_NS)) problems.push(`<${name}> declares a namespace other than the SVG one (${key})`);
        continue;
      }
      if (REF_ATTRS.has(kl)) problems.push(`<${name}> has a ${key} (a bloom links to nothing)`);
      if (/javascript:|vbscript:|data:|https?:|\/\//i.test(val)) problems.push(`<${name} ${key}> holds a script or network address`);
      if (/url\(\s*(?!#)/i.test(val)) problems.push(`<${name} ${key}> holds a url() that is not a fragment`);
    }
    if (name === 'svg' && attrs.get('xmlns') !== SVG_NS) problems.push('the svg root has no SVG namespace');
    if (name === 'animateTransform' && !(attrs.get('attributeName') === 'transform' && attrs.get('type') === 'rotate')) {
      problems.push('animateTransform may only rotate the transform');
    }
    if (!selfClosing) stack.push(name);
  }
  if (stack.length) problems.push(`<${stack[stack.length - 1]}> is never closed`);
  if (roots !== 1) problems.push(`the SVG has ${roots} root elements, not one`);
  return [...new Set(problems)];
}

/** Throws with every problem if the SVG is not clean. Returns the SVG so it can wrap a call. */
export function assertCleanSvg(svg) {
  const problems = auditSvg(svg);
  if (problems.length) throw new Error(`bloom: the SVG failed its audit: ${problems.join('; ')}`);
  return svg;
}

// ---------------------------------------------------------------- fingerprints

/** Every number in the geometry attributes (not colours, not opacities) of an SVG, in order. */
export function geometryNumbers(svg) {
  const out = [];
  for (const m of String(svg).matchAll(/\s(?:d|r|cx|cy|x|y|width|height|viewBox|transform|stroke-width|stroke-dasharray)="([^"]*)"/g)) {
    for (const n of m[1].matchAll(/-?\d+(?:\.\d+)?/g)) out.push(Number(n[0]));
  }
  return out;
}

/**
 * A short fingerprint of a bloom's geometry: its geometry numbers, each rounded
 * to a multiple of `q` units on the 1000-unit canvas (8 is under 1% of the
 * width, about 3 px at 400 px), hashed with blake2b. Two blooms with different
 * fingerprints differ somewhere by more than the rounding step.
 */
export function geometryFingerprint(svg, q = 8) {
  const nums = geometryNumbers(svg).map((n) => Math.round(n / q));
  return bytesHex(blake2b([new TextEncoder().encode(nums.join(','))], 8));
}

/** How many of the rounded geometry numbers differ between two SVGs (a missing number counts as a difference). */
export function geometryDistance(a, b, q = 8) {
  const x = geometryNumbers(a).map((n) => Math.round(n / q));
  const y = geometryNumbers(b).map((n) => Math.round(n / q));
  let d = Math.abs(x.length - y.length);
  for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) d += 1;
  return d;
}

/** The distinct hex colours of a bloom, in drawing order: the ground first. */
export function paletteOf(svg) {
  return [...new Set(String(svg).match(/#[0-9a-f]{6}(?=")/g) ?? [])];
}

const bytesHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

// ---------------------------------------------------------------- checkpoints and time

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const nat = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : null);
const str = (v) => (typeof v === 'string' ? v : '');

/** The latest checkpoint at or below a chain height, or null before the first one. */
export function latestCheckpoint(height, interval = CHECKPOINT_INTERVAL) {
  return Number.isSafeInteger(height) && height >= interval ? Math.floor(height / interval) * interval : null;
}

/** `count` checkpoint heights, newest first, never below the first checkpoint. */
export function checkpointHeights(latest, count = GRID_COUNT, interval = CHECKPOINT_INTERVAL) {
  const out = [];
  for (let h = latest; Number.isSafeInteger(h) && h >= interval && out.length < count; h -= interval) out.push(h);
  return out;
}

/** The /checkpoints?from=&to= windows (the devnet allows at most 1000 heights each) that cover a list of heights. */
export function rangeWindows(heights, span = 990) {
  if (!heights.length) return [];
  const lo = Math.min(...heights);
  const hi = Math.max(...heights);
  const out = [];
  for (let to = hi; to >= lo; to -= span + 1) out.push({ from: Math.max(1, lo, to - span), to });
  return out;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

/**
 * Which devnet to read: the page's own (`fallback`), unless the URL carries
 * ?devnet=<origin> and that origin is http(s)://localhost or 127.0.0.1 (a
 * local devnet for end-to-end runs). Any other ?devnet= is ignored and flagged,
 * so a link cannot point this page at someone else's chain.
 */
export function resolveApi(search, fallback) {
  const base = String(fallback || '').replace(/\/+$/, '');
  let raw = null;
  try {
    raw = new URLSearchParams(search || '').get('devnet');
  } catch {
    raw = null;
  }
  if (raw === null || raw === '') return { base, local: false, rejected: false };
  try {
    const u = new URL(raw);
    if ((u.protocol === 'http:' || u.protocol === 'https:') && LOCAL_HOSTS.has(u.hostname) && !u.username && !u.password) {
      return { base: u.origin, local: true, rejected: false };
    }
  } catch {
    // not a URL: fall through
  }
  return { base, local: false, rejected: true };
}

export const TIME_MIN = Date.UTC(2026, 0, 1);
export const TIME_MAX = Date.UTC(2100, 0, 1);
export const goodTime = (ms) => Number.isSafeInteger(ms) && ms >= TIME_MIN && ms < TIME_MAX;
/** 2026-10-20 */
export const utcDay = (ms) => (goodTime(ms) ? new Date(ms).toISOString().slice(0, 10) : '');
/** 05:20 */
export const utcClock = (ms) => (goodTime(ms) ? new Date(ms).toISOString().slice(11, 16) : '');
/** 2026-10-20 05:20:14 UTC */
export const utcStamp = (ms) => (goodTime(ms) ? `${new Date(ms).toISOString().slice(0, 19).replace('T', ' ')} UTC` : 'time unknown');

/** Items already sorted newest first, grouped by UTC day: [{ day, items }]. Items without a good time share the group 'unknown'. */
export function groupByDay(items) {
  const groups = [];
  for (const it of items) {
    const day = utcDay(it.timestamp) || 'unknown';
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(it);
    else groups.push({ day, items: [it] });
  }
  return groups;
}

/** pointcast-devnet-2-bloom-3320.svg */
export function fileName(chainId, height) {
  const id = /^[a-z0-9-]{3,40}$/.test(chainId) ? chainId : 'devnet';
  return `${id}-bloom-${Number(height) | 0}.svg`;
}

// ---------------------------------------------------------------- reading the devnet

const NAME_RE = /^[a-z0-9-]{2,24}$/;
const ADDRESS_RE = /^(?:tz[1-4]|KT1|pc[ap]1)[1-9A-HJ-NP-Za-km-z]{20,60}$/;
const RESULTS = new Set(['correct', 'over_cap', 'mismatch', 'conflict']);

/** An address shortened for display (tz1RGA…KZoz), or '' when it does not look like one. */
export const shortAddr = (v) => (typeof v === 'string' && ADDRESS_RE.test(v) ? `${v.slice(0, 6)}…${v.slice(-4)}` : '');

/** GET /status → the few facts the page uses. Throws on anything that is not a devnet status. */
export function readStatus(json) {
  if (!isObj(json)) throw new Error('bloom: unexpected status shape');
  if (json.network !== 'devnet') throw new Error('bloom: not a devnet');
  const height = nat(json.height);
  if (height === null) throw new Error('bloom: no height');
  if (!HEX64.test(str(json.genesis_hash))) throw new Error('bloom: no genesis hash');
  const chainId = /^[a-z0-9-]{3,40}$/.test(str(json.chain_id)) ? json.chain_id : '';
  if (!chainId) throw new Error('bloom: no chain id');
  const ts = nat(json.tip_timestamp);
  return { chainId, genesis: json.genesis_hash, height, tipTimestamp: ts !== null && goodTime(ts) ? ts : null };
}

/** GET /block/{N} → the hash and time of block N. Throws if it is not block N or the hash is not 64 hex. */
export function readBlock(json, height) {
  if (!isObj(json)) throw new Error('bloom: unexpected block shape');
  if (json.network !== undefined && json.network !== 'devnet') throw new Error('bloom: not a devnet');
  if (nat(json.height) !== height) throw new Error('bloom: that is not the block asked for');
  if (!HEX64.test(str(json.hash))) throw new Error('bloom: the block has no 64-hex hash');
  const ts = nat(json.timestamp);
  return {
    height,
    hash: json.hash,
    prevHash: HEX64.test(str(json.prev_hash)) ? json.prev_hash : '',
    stateRoot: HEX64.test(str(json.state_root)) ? json.state_root : '',
    timestamp: ts !== null && goodTime(ts) ? ts : null,
    txs: Array.isArray(json.txs) ? Math.min(json.txs.length, 99_999) : null,
  };
}

/** GET /raw/block/{N} → its height and the hash it names as its parent. */
export function readRawHeader(json, height) {
  const head = isObj(json) && isObj(json.header) ? json.header : null;
  if (!head || nat(head.height) !== height) throw new Error('bloom: that is not the block asked for');
  if (!HEX64.test(str(head.prev_hash))) throw new Error('bloom: the header has no parent hash');
  return { height, prevHash: head.prev_hash };
}

/** The next block's parent hash names this block's hash: the devnet's own chain agrees with itself. */
export const linkHolds = (block, next) => Boolean(block && next && next.height === block.height + 1 && next.prevHash === block.hash);

/** GET /checkpoints/{N}/witnesses → who signed this checkpoint. `distinct` is the count of keys. */
export function readWitnesses(json, height) {
  if (!isObj(json)) throw new Error('bloom: unexpected witnesses shape');
  if (json.network !== undefined && json.network !== 'devnet') throw new Error('bloom: not a devnet');
  if (nat(json.height) !== height) throw new Error('bloom: those are not the witnesses asked for');
  const keys = (Array.isArray(json.witnesses) ? json.witnesses : []).filter(isObj).slice(0, 50).map((w) => ({
    name: NAME_RE.test(str(w.name)) ? w.name : '',
    addr: shortAddr(w.addr),
    result: RESULTS.has(str(w.result)) ? w.result : 'other',
  }));
  const distinct = nat(json.distinct);
  return {
    height,
    blockHash: HEX64.test(str(json.block_hash)) ? json.block_hash : '',
    sealed: json.sealed === true,
    distinct: distinct === null ? 0 : Math.min(distinct, 9_999),
    correct: Math.min(nat(json.correct) ?? 0, 9_999),
    strikes: Math.min(nat(json.strikes) ?? 0, 9_999),
    keys,
    more: Math.min(nat(json.more) ?? 0, 9_999),
  };
}

/** GET /checkpoints?from=&to= → Map of checkpoint height → { distinct, correct, strikes } (attested heights only). */
export function readCheckpointRange(json) {
  if (!isObj(json) || !Array.isArray(json.checkpoints)) throw new Error('bloom: unexpected checkpoints shape');
  const out = new Map();
  for (const c of json.checkpoints.slice(0, 1000)) {
    if (!isObj(c)) continue;
    const h = nat(c.height);
    const distinct = nat(c.distinct);
    if (h === null || h % CHECKPOINT_INTERVAL !== 0 || distinct === null) continue;
    out.set(h, { distinct: Math.min(distinct, 9_999), correct: Math.min(nat(c.correct) ?? 0, 9_999), strikes: Math.min(nat(c.strikes) ?? 0, 9_999) });
  }
  return out;
}

const plural = (n, one, many) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/** What the outer rings mean, in words, for a checkpoint with `w` = { distinct, correct, strikes } (or null when unread). */
export function witnessSentence(w) {
  if (!w) return 'Witness keys for this checkpoint were not read, so no outer rings are drawn.';
  if (w.distinct === 0) return 'No witness key has signed this checkpoint, so the bloom has no outer rings.';
  const drawn = Math.min(w.distinct, MAX_WITNESS_RINGS);
  const bits = [`${plural(w.distinct, 'distinct witness key', 'distinct witness keys')} signed this checkpoint`];
  bits.push(`${w.correct.toLocaleString('en-US')} agreed with this server’s hash${w.strikes ? ` and ${w.strikes.toLocaleString('en-US')} did not` : ''}`);
  const rings = w.distinct > drawn ? `${plural(drawn, 'thin ring is', 'thin rings are')} drawn outside the bloom, one per key (the first ${MAX_WITNESS_RINGS})` : `${plural(drawn, 'thin ring', 'thin rings')} outside the bloom, one per key`;
  return `${bits.join('; ')}. ${rings}.`;
}
