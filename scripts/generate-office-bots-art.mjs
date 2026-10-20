#!/usr/bin/env node
/**
 * Office Bots art generator.
 *
 * Writes, deterministically (seeded PRNG, no network, no external assets):
 *   public/images/office-bots/cast/<slug>.svg   320x320 pixel-art bot Noun
 *   public/images/office-bots/bg/<slug>.svg     1600x900 procedural scene with that Noun composited in
 *   public/images/office-bots/cover.svg|png     1200x630 lineup on a dithered field
 *   src/lib/office-bots-art.json                per-image technical manifest (algorithm, seed, size, sha256)
 *
 * Run: npm run art:office-bots
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/images/office-bots');
mkdirSync(join(OUT, 'cast'), { recursive: true });
mkdirSync(join(OUT, 'bg'), { recursive: true });

const W = 1600;
const H = 900;

// ───────────────────────── PRNG + noise ─────────────────────────
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (t) => t * t * (3 - 2 * t);
const smoothstep = (a, b, x) => smooth(clamp((x - a) / (b - a)));

/** 2D gradient (Perlin) noise, permutation table seeded from the PRNG. */
function makeNoise(rng) {
  const p = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [base[i], base[j]] = [base[j], base[i]]; }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  const grad = (h, x, y) => { const u = h & 1 ? -x : x; const v = h & 2 ? -y : y; return u + v; };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const noise2 = (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const aa = p[p[X] + Y], ab = p[p[X] + Y + 1], ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
    return lerp(lerp(grad(aa, x, y), grad(ba, x - 1, y), u), lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u), v);
  };
  const fbm = (x, y, oct = 4) => {
    let amp = 0.5, f = 1, sum = 0, norm = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise2(x * f, y * f); norm += amp; amp *= 0.5; f *= 2; }
    return sum / norm; // roughly [-0.7, 0.7]
  };
  return { noise2, fbm };
}

const BAYER8 = (() => {
  // Recursive Bayer matrix, order 3 → 8x8, values 0..63.
  let m = [[0]];
  for (let n = 1; n <= 3; n++) {
    const s = m.length;
    const next = Array.from({ length: s * 2 }, () => new Array(s * 2));
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const v = m[y][x] * 4;
      next[y][x] = v; next[y][x + s] = v + 2; next[y + s][x] = v + 3; next[y + s][x + s] = v + 1;
    }
    m = next;
  }
  return m;
})();

const r1 = (n) => Math.round(n * 10) / 10;
const hex = (n) => n.toString(16).padStart(2, '0');
const mix = (c1, c2, t) => {
  const a = [1, 3, 5].map((i) => parseInt(c1.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(c2.slice(i, i + 2), 16));
  return '#' + a.map((v, i) => hex(Math.round(lerp(v, b[i], clamp(t))))).join('');
};
const ramp = (stops, t) => {
  t = clamp(t);
  const seg = stops.length - 1;
  const i = Math.min(seg - 1, Math.floor(t * seg));
  return mix(stops[i], stops[i + 1], t * seg - i);
};

// ───────────────────────── pixel Noun painter ─────────────────────────
class Grid {
  constructor(n = 32) { this.n = n; this.c = Array.from({ length: n }, () => new Array(n).fill(null)); }
  set(x, y, col) { if (x >= 0 && y >= 0 && x < this.n && y < this.n) this.c[y][x] = col; }
  rect(x, y, w, h, col) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, col); }
  disc(cx, cy, r, col) {
    for (let y = 0; y < this.n; y++) for (let x = 0; x < this.n; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, col);
  }
  /** Merge identical horizontal runs, then identical vertically stacked runs. */
  rects(cell = 10) {
    const runs = [];
    for (let y = 0; y < this.n; y++) {
      let x = 0;
      while (x < this.n) {
        const col = this.c[y][x];
        if (!col) { x++; continue; }
        let w = 1;
        while (x + w < this.n && this.c[y][x + w] === col) w++;
        runs.push({ x, y, w, h: 1, col });
        x += w;
      }
    }
    const merged = [];
    const open = new Map();
    for (const r of runs) {
      const key = `${r.x}:${r.w}:${r.col}`;
      const prev = open.get(key);
      if (prev && prev.y + prev.h === r.y) { prev.h++; } else { const o = { ...r }; merged.push(o); open.set(key, o); }
    }
    return merged.map((r) => `<rect width="${r.w * cell}" height="${r.h * cell}" x="${r.x * cell}" y="${r.y * cell}" fill="${r.col}"/>`).join('');
  }
}

const INK = '#1f1d29';

function paintGlasses(g, frame) {
  for (const [a, b] of [[10, 15], [17, 22]]) {
    for (let x = a; x <= b; x++) { g.set(x, 11, frame); g.set(x, 16, frame); }
    for (let y = 12; y <= 15; y++) { g.set(a, y, frame); g.set(b, y, frame); }
    g.rect(a + 1, 12, 2, 4, '#ffffff');
    g.rect(a + 3, 12, 2, 4, INK);
  }
  g.rect(7, 13, 3, 2, frame); // arm
  g.set(7, 15, frame);
  g.rect(15, 13, 3, 2, frame); // bridge
}

function paintBody(g, { shirt, tie, collar = '#f4f0e7' }) {
  g.rect(9, 21, 14, 11, shirt);
  g.rect(8, 25, 16, 7, shirt);
  g.rect(13, 21, 6, 1, collar); g.rect(14, 22, 4, 1, collar); g.rect(15, 23, 2, 1, collar);
  if (tie) { g.rect(15, 22, 2, 8, tie); g.rect(15, 21, 2, 1, tie); }
}

const HEADS = {
  // 1. Cron — alarm clock
  cron(g) {
    g.rect(8, 5, 3, 1, '#d22209'); g.rect(20, 5, 3, 1, '#d22209');
    g.disc(15, 13, 7.6, INK); g.disc(15, 13, 6.4, '#f4f0e7');
    g.rect(15, 7, 1, 1, INK); g.rect(15, 19, 1, 1, '#d22209');
    g.rect(15, 8, 1, 3, INK); g.rect(15, 9, 3, 1, '#d22209');
  },
  // 2. Ping — speech bubble with antenna
  ping(g) {
    g.rect(15, 2, 1, 5, '#757576'); g.rect(14, 1, 3, 2, '#ff638d');
    g.rect(5, 8, 22, 12, '#26b1f3'); g.rect(6, 7, 20, 14, '#26b1f3');
    g.rect(8, 20, 4, 2, '#26b1f3'); g.rect(8, 22, 2, 1, '#26b1f3');
    for (const x of [11, 15, 19]) g.rect(x, 18, 2, 2, '#ffffff');
  },
  // 3. Token — coin
  token(g) {
    g.disc(15, 13, 8, '#a8700e'); g.disc(15, 13, 7, '#f5c542'); g.disc(15, 13, 5.8, '#e0a91f');
    g.rect(12, 8, 7, 1, '#7a4f06'); g.rect(15, 9, 1, 2, '#7a4f06');
    g.rect(11, 18, 2, 1, '#7a4f06'); g.rect(18, 18, 2, 1, '#7a4f06');
  },
  // 4. Cache — database cylinder, half faded (stale)
  cache(g) {
    g.rect(6, 8, 20, 12, '#7a8fb0');
    g.rect(8, 20, 16, 2, '#7a8fb0');
    g.rect(9, 6, 14, 1, '#a9bad6'); g.rect(7, 7, 18, 1, '#a9bad6'); g.rect(6, 8, 20, 2, '#a9bad6');
    g.rect(6, 10, 20, 1, '#4f6288'); g.rect(6, 17, 20, 1, '#4f6288'); g.rect(8, 20, 16, 1, '#4f6288');
    g.rect(22, 18, 3, 1, '#3ddc84'); g.rect(22, 19, 3, 1, '#e0a91f');
    for (let y = 8; y < 20; y += 2) g.rect(24, y, 2, 1, '#9fb0cc');
  },
  // 5. Patch — adhesive bandage
  patch(g) {
    g.rect(5, 8, 22, 12, '#f0c9a0'); g.rect(6, 7, 20, 14, '#f0c9a0');
    g.rect(10, 7, 12, 14, '#fbe8d0');
    for (let x = 11; x < 21; x += 2) { g.set(x, 8, '#d9a77b'); g.set(x, 10, '#d9a77b'); g.set(x + 1, 18, '#d9a77b'); g.set(x + 1, 20, '#d9a77b'); }
    for (const x of [7, 24]) for (let y = 9; y < 20; y += 2) g.set(x, y, '#d9a77b');
    g.rect(24, 5, 3, 1, '#d22209'); g.rect(25, 4, 1, 3, '#d22209');
  },
  // 6. Loop — circular arrows
  loop(g) {
    g.disc(15, 13, 8, '#1e7c4c'); g.disc(15, 13, 6.4, '#d8f3e4');
    for (let y = 4; y < 12; y++) for (let x = 18; x < 27; x++) if ((x - 15) ** 2 + (y - 13) ** 2 > 36 && x - 15 > 2 && y < 12) g.set(x, y, null);
    g.rect(20, 5, 5, 1, '#2fa66a'); g.rect(24, 5, 1, 4, '#2fa66a'); g.rect(22, 8, 5, 1, '#2fa66a'); g.rect(23, 9, 3, 1, '#2fa66a');
    g.rect(14, 19, 4, 1, '#2fa66a');
  },
  // 7. Prompt — terminal window
  prompt(g) {
    g.rect(5, 6, 22, 16, INK); g.rect(5, 6, 22, 3, '#3a3752');
    g.set(7, 7, '#f3322c'); g.set(9, 7, '#e0a91f'); g.set(11, 7, '#3ddc84');
    g.rect(14, 10, 8, 1, '#3ddc84'); g.rect(7, 10, 4, 1, '#6dff9a');
    g.set(7, 18, '#6dff9a'); g.set(8, 19, '#6dff9a'); g.set(9, 20, '#6dff9a'); g.set(8, 21, '#6dff9a'); g.set(7, 22, '#6dff9a');
    g.rect(12, 20, 3, 2, '#6dff9a');
    g.rect(17, 19, 7, 1, '#3ddc84'); g.rect(17, 21, 4, 1, '#3ddc84');
  },
  // 8. Bandwidth — megaphone
  bandwidth(g) {
    for (let x = 5; x <= 24; x++) {
      const half = Math.round(1.5 + (x - 5) * 0.34);
      g.rect(x, 13 - half, 1, half * 2 + 1, '#ff7a1a');
    }
    g.rect(24, 6, 3, 15, '#c4520a');
    g.rect(14, 8, 1, 11, '#ffffff'); g.rect(15, 8, 1, 11, '#ffffff');
    g.rect(8, 17, 3, 5, INK);
    for (const [x, h] of [[28, 5], [30, 9]]) g.rect(x, 13 - Math.floor(h / 2), 1, h, INK);
  },
  // 9. Firewall — brick wall with flames
  firewall(g) {
    for (let row = 0; row < 7; row++) {
      const y = 7 + row * 2;
      g.rect(5, y, 22, 2, '#8a2a1e');
      const off = row % 2 ? 2 : 0;
      for (let x = 5 - off; x < 27; x += 5) {
        const x0 = Math.max(5, x), x1 = Math.min(26, x + 3);
        if (x1 >= x0) g.rect(x0, y, x1 - x0 + 1, 1, '#c43c2a');
      }
    }
    for (const [x, h, c] of [[7, 3, '#ff7a1a'], [11, 4, '#ffd34d'], [15, 3, '#ff7a1a'], [19, 5, '#ffd34d'], [23, 3, '#ff7a1a']]) {
      g.rect(x, 6 - h, 2, h, c); g.rect(x, 6 - h - 1, 1, 1, c);
    }
  },
  // 10. Legacy — CRT monitor
  legacy(g) {
    g.rect(5, 6, 22, 15, '#d8cfae'); g.rect(6, 5, 20, 1, '#d8cfae');
    g.rect(8, 8, 16, 10, '#0f2a1a');
    for (let y = 8; y < 18; y += 2) g.rect(8, y, 16, 1, '#143a24');
    g.rect(10, 9, 5, 1, '#6dff9a'); g.rect(10, 17, 3, 1, '#6dff9a');
    g.rect(17, 19, 8, 1, '#b8ae8c'); g.rect(17, 20, 8, 1, '#d8cfae');
    g.rect(6, 19, 2, 1, '#3ddc84');
    g.rect(10, 21, 12, 1, '#b8ae8c');
  },
};

export const CAST = [
  { slug: 'loop',      name: 'Loop',      bg: '#d5e8dc', frame: '#1e7c4c', shirt: '#2fa66a', tie: '#1f1d29' },
  { slug: 'cron',      name: 'Cron',      bg: '#e1d6ec', frame: '#6a1b9a', shirt: '#3d0b5c', tie: '#d22209' },
  { slug: 'token',     name: 'Token',     bg: '#f3e6c4', frame: '#7a4f06', shirt: '#1d3557', tie: '#f5c542' },
  { slug: 'cache',     name: 'Cache',     bg: '#d3dcee', frame: '#4f6288', shirt: '#4f6288', tie: null },
  { slug: 'patch',     name: 'Patch',     bg: '#f1dccb', frame: '#8a4b2a', shirt: '#26b1f3', tie: '#f0c9a0' },
  { slug: 'prompt',    name: 'Prompt',    bg: '#d6d4e6', frame: '#3ddc84', shirt: '#3a3752', tie: '#6dff9a' },
  { slug: 'bandwidth', name: 'Bandwidth', bg: '#f6dcc2', frame: '#c4520a', shirt: '#ff7a1a', tie: '#ffffff' },
  { slug: 'firewall',  name: 'Firewall',  bg: '#ecd0c8', frame: '#1f1d29', shirt: '#8a2a1e', tie: '#ffd34d' },
  { slug: 'legacy',    name: 'Legacy',    bg: '#e4dfc9', frame: '#6b6247', shirt: '#b8ae8c', tie: '#143a24' },
  { slug: 'ping',      name: 'Ping',      bg: '#d2e9f7', frame: '#ff638d', shirt: '#26b1f3', tie: '#ff638d' },
];

function nounRects(spec) {
  const g = new Grid(32);
  paintBody(g, spec);
  HEADS[spec.slug === 'ping' ? 'ping' : spec.slug](g);
  paintGlasses(g, spec.frame);
  return g.rects(10);
}
function nounSvg(spec) {
  return `<svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><title>${spec.name}, a bot Noun</title><rect width="100%" height="100%" fill="${spec.bg}"/>${nounRects(spec)}</svg>\n`;
}

// ───────────────────────── scene helpers ─────────────────────────
/** Pixel-cell field → compact path data, one path per colour. */
function cellPaths(rowsOfRuns, cell) {
  const byColor = new Map();
  for (const { y, x, w, col } of rowsOfRuns) {
    if (!byColor.has(col)) byColor.set(col, []);
    byColor.get(col).push(`M${x * cell} ${y * cell}h${w * cell}v${cell}h${-w * cell}z`);
  }
  return [...byColor].map(([col, d]) => `<path fill="${col}" d="${d.join('')}"/>`).join('');
}
function runsFromBool(rows, colorFor) {
  const runs = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) { x++; continue; }
      const col = colorFor(x, y);
      let w = 1;
      while (x + w < row.length && row[x + w] && colorFor(x + w, y) === col) w++;
      runs.push({ y, x, w, col });
      x += w;
    }
  });
  return runs;
}
function polyPath(points) {
  let d = '';
  let px = 0, py = 0;
  points.forEach(([x, y], i) => {
    const ix = Math.round(x), iy = Math.round(y);
    d += i === 0 ? `M${ix} ${iy}` : `l${ix - px} ${iy - py}`;
    px = ix; py = iy;
  });
  return d;
}

const SCALE = 1.95;
function compositeNoun(spec, { x = 910, y = 295, shadow = 'rgba(0,0,0,0.45)' } = {}) {
  const size = 320 * SCALE;
  return (
    `<ellipse cx="${x + size / 2}" cy="${y + size - 6}" rx="${size * 0.42}" ry="22" fill="${shadow}" filter="url(#soft)"/>` +
    `<g transform="translate(${x} ${y}) scale(${SCALE})" shape-rendering="crispEdges"><title>${spec.name}</title>${nounRects(spec)}</g>`
  );
}
const SOFT = '<filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>';
const GLOW = '<filter id="glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
function frame(defs, inner, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}"><defs>${SOFT}${GLOW}${defs}</defs>${inner}</svg>\n`;
}

// ───────────────────────── 01 Loop · curl-noise streamlines ─────────────────────────
function bgLoop(spec, rng) {
  const { fbm } = makeNoise(rng);
  const psi = (x, y) => fbm(x * 0.0021, y * 0.0021, 4);
  const velocity = (x, y) => {
    const e = 2.5;
    const dy = (psi(x, y + e) - psi(x, y - e)) / (2 * e);
    const dx = (psi(x + e, y) - psi(x - e, y)) / (2 * e);
    return [dy, -dx]; // curl of a scalar potential → divergence-free, so lines never bunch into sinks
  };
  const CELL = 9;
  const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);
  const occ = new Int32Array(cols * rows).fill(-1);
  const palette = ['#1e7c4c', '#2fa66a', '#5fd39a', '#a8f0c8', '#d8f3e4', '#7ad7f0'];
  const buckets = palette.map(() => []);
  const seeds = [];
  for (let i = 0; i < 2600; i++) seeds.push([rng() * W, rng() * H]);
  let id = 0, points = 0, lines = 0;
  for (const [sx, sy] of seeds) {
    if (occ[Math.floor(sy / CELL) * cols + Math.floor(sx / CELL)] !== -1) continue;
    const trace = (dir) => {
      const pts = [];
      let x = sx, y = sy;
      for (let s = 0; s < 120; s++) {
        let [vx, vy] = velocity(x, y);
        const m = Math.hypot(vx, vy) || 1e-9;
        vx = (vx / m) * dir; vy = (vy / m) * dir;
        const [mx, my] = velocity(x + vx * 2.5, y + vy * 2.5); // RK2 midpoint
        const mm = Math.hypot(mx, my) || 1e-9;
        x += (mx / mm) * dir * 5; y += (my / mm) * dir * 5;
        if (x < 0 || y < 0 || x >= W || y >= H) break;
        const c = Math.floor(y / CELL) * cols + Math.floor(x / CELL);
        if (occ[c] !== -1 && occ[c] !== id) break;
        occ[c] = id;
        pts.push([x, y]);
      }
      return pts;
    };
    const back = trace(-1).reverse();
    const fwd = trace(1);
    const pts = [...back, [sx, sy], ...fwd];
    id++;
    if (pts.length < 14) continue;
    const a = Math.atan2(pts[pts.length - 1][1] - pts[0][1], pts[pts.length - 1][0] - pts[0][0]);
    const bucket = Math.min(palette.length - 1, Math.floor(((a + Math.PI) / (2 * Math.PI)) * palette.length));
    buckets[bucket].push(polyPath(pts));
    points += pts.length; lines++;
  }
  const defs = '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#03201e"/><stop offset="1" stop-color="#0b3b3a"/></linearGradient>';
  const strokes = buckets.map((d, i) => `<path fill="none" stroke="${palette[i]}" stroke-width="${1.2 + (i % 3) * 0.35}" stroke-linecap="round" stroke-opacity="0.85" d="${d.join('')}"/>`).join('');
  return {
    defs, inner: `<rect width="${W}" height="${H}" fill="url(#g)"/>${strokes}`,
    meta: { algorithm: 'Evenly-spaced streamlines of a divergence-free field: v = (∂ψ/∂y, −∂ψ/∂x), ψ = 4-octave Perlin fbm', technique: 'RK2 midpoint integration, 5 px step; Jobard–Lefer style separation via a 9 px occupancy grid so lines stop when they near a neighbour', stats: { streamlines: lines, vertices: points, strokeColours: palette.length } },
  };
}

// ───────────────────────── 02 Cron · projective grid + banded sun ─────────────────────────
function bgCron(spec, rng) {
  const horizon = 470;
  const stars = Array.from({ length: 140 }, () => {
    const y = rng() * (horizon - 30);
    return `<circle cx="${r1(rng() * W)}" cy="${r1(y)}" r="${r1(0.5 + rng() * 1.3)}" fill="#fff" opacity="${r1(0.25 + 0.6 * (1 - y / horizon) * rng())}"/>`;
  }).join('');
  // Horizontal grid lines: perspective foreshortening, y = h + (H-h)(i/n)^p, p>1 packs lines toward the horizon.
  const n = 26, pwr = 2.5;
  let hl = '';
  for (let i = 1; i <= n; i++) {
    const t = i / n, y = horizon + (H - horizon) * t ** pwr;
    hl += `<path d="M0 ${r1(y)}H${W}" stroke="#ff4fd8" stroke-width="${r1(0.8 + t * 2.4)}" opacity="${r1(0.25 + t * 0.7)}"/>`;
  }
  // Vertical lines: all converge on the vanishing point (W/2, horizon); the bottom-edge spacing is uniform.
  let vl = '';
  for (let k = -34; k <= 34; k++) vl += `<path d="M${W / 2} ${horizon}L${W / 2 + k * 118} ${H}" stroke="#22d3ee" stroke-width="1.6" opacity="0.7"/>`;
  // Sun slits: bars grow with distance below centre → classic "venetian" cut mask.
  let slits = '';
  for (let i = 0; i < 9; i++) { const y = 290 + i * 21; slits += `<rect x="560" y="${y}" width="480" height="${r1(2.5 + i * 1.7)}" fill="#000"/>`; }
  const defs = `
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10042a"/><stop offset="0.55" stop-color="#3d0b5c"/><stop offset="1" stop-color="#c2185b"/></linearGradient>
<linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0733"/><stop offset="1" stop-color="#05010f"/></linearGradient>
<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe14d"/><stop offset="0.55" stop-color="#ff7a3d"/><stop offset="1" stop-color="#ff2d95"/></linearGradient>
<mask id="slit"><rect width="${W}" height="${H}" fill="#fff"/>${slits}</mask>
<clipPath id="below"><rect y="${horizon}" width="${W}" height="${H - horizon}"/></clipPath>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000" opacity="0.28"/></pattern>`;
  const inner =
    `<rect width="${W}" height="${horizon}" fill="url(#sky)"/>${stars}` +
    `<circle cx="${W / 2}" cy="${horizon - 70}" r="210" fill="url(#sun)" mask="url(#slit)" filter="url(#glow)"/>` +
    `<rect y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#gnd)"/>` +
    `<g clip-path="url(#below)" filter="url(#glow)">${vl}${hl}</g>` +
    `<path d="M0 ${horizon}H${W}" stroke="#ff9bf0" stroke-width="2.5" filter="url(#glow)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#scan)"/>`;
  return { defs, inner, meta: { algorithm: 'One-point perspective grid', technique: 'Rows at y = h + (H−h)(i/26)^2.5; 69 columns share the vanishing point (800, 470); sun is a gradient disc under a mask of 9 slits whose height grows linearly; scanline pattern + SVG gaussian bloom', stats: { rows: n, columns: 69, stars: 140, slits: 9 } } };
}

// ───────────────────────── 03 Token · isometric budget skyline ─────────────────────────
function bgToken(spec, rng) {
  const { fbm } = makeNoise(rng);
  const N = 15, TW = 64, TH = 32, ox = 560, oy = 250;
  const iso = (gx, gy, z = 0) => [ox + (gx - gy) * (TW / 2), oy + (gx + gy) * (TH / 2) - z];
  const cubes = [];
  for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
    const fall = ((2 * N - (gx + gy)) / (2 * N)) ** 1.9; // the budget only goes one direction
    const h = Math.max(6, Math.round((fbm(gx * 0.45, gy * 0.45, 3) * 0.9 + 0.55) * 300 * fall));
    cubes.push({ gx, gy, h });
  }
  cubes.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  let out = '';
  let faces = 0;
  for (const { gx, gy, h } of cubes) {
    const t = clamp(h / 240);
    const top = ramp(['#8a6a1d', '#f5c542', '#fff1b0'], t);
    const left = mix(top, '#0a1630', 0.45), right = mix(top, '#0a1630', 0.68);
    const [tx, ty] = iso(gx, gy, h), [rx, ry] = iso(gx + 1, gy, h), [bx, by] = iso(gx + 1, gy + 1, h), [lx, ly] = iso(gx, gy + 1, h);
    const [rbx, rby] = iso(gx + 1, gy + 1, 0), [rrx, rrY] = iso(gx + 1, gy, 0), [llx, lly] = iso(gx, gy + 1, 0);
    out += `<path d="M${lx} ${ly}L${bx} ${by}L${rbx} ${rby}L${llx} ${lly}Z" fill="${left}"/>`;
    out += `<path d="M${bx} ${by}L${rx} ${ry}L${rrx} ${rrY}L${rbx} ${rby}Z" fill="${right}"/>`;
    out += `<path d="M${tx} ${ty}L${rx} ${ry}L${bx} ${by}L${lx} ${ly}Z" fill="${top}"/>`;
    faces += 3;
    // coin-stack seams every 14px on the two visible side faces
    let seams = '';
    for (let z = 14; z < h; z += 14) {
      const [a1, a2] = iso(gx, gy + 1, z), [b1, b2] = iso(gx + 1, gy + 1, z), [c1, c2] = iso(gx + 1, gy, z);
      seams += `M${a1} ${a2}L${b1} ${b2}L${c1} ${c2}`;
    }
    if (seams) out += `<path d="${seams}" fill="none" stroke="#000" stroke-opacity="0.22" stroke-width="1"/>`;
  }
  // floor grid
  let floor = '';
  for (let i = 0; i <= N; i++) { const [a, b] = iso(i, 0), [c, d] = iso(i, N), [e, f] = iso(0, i), [g, hh] = iso(N, i); floor += `M${a} ${b}L${c} ${d}M${e} ${f}L${g} ${hh}`; }
  const defs = '<radialGradient id="bg" cx="0.35" cy="0.45" r="0.9"><stop offset="0" stop-color="#17305f"/><stop offset="1" stop-color="#050b1a"/></radialGradient>';
  const inner = `<rect width="${W}" height="${H}" fill="url(#bg)"/><path d="${floor}" stroke="#4a6fb5" stroke-opacity="0.45" fill="none"/>${out}`;
  return { defs, inner, meta: { algorithm: 'True isometric projection', technique: 'x′ = ox + (gx−gy)·32, y′ = oy + (gx+gy)·16 − z; 15×15 grid of prisms with height = fbm(gx,gy)·300·((2N−gx−gy)/2N)^1.9; painter\'s algorithm sorted by gx+gy; per-face shading by mixing toward navy; "coin seams" every 14 px of height', stats: { prisms: N * N, faces, projection: '2:1 dimetric (26.565°)' } } };
}

// ───────────────────────── 04 Cache · ordered dithering, fresh → stale ─────────────────────────
function bgCache(spec, rng) {
  const { fbm } = makeNoise(rng);
  const C = 6, cols = Math.ceil(W / C), rows = Math.ceil(H / C);
  const field = (x, y) => {
    const px = x * C, py = y * C;
    const radial = 1 - Math.hypot(px - 520, py - 430) / 980;
    return clamp(0.5 + fbm(px * 0.0035, py * 0.0035, 5) * 1.1 + radial * 0.55 - 0.25);
  };
  const on = [];
  let count = 0;
  for (let y = 0; y < rows; y++) {
    const row = new Array(cols);
    for (let x = 0; x < cols; x++) {
      row[x] = field(x, y) > (BAYER8[y & 7][x & 7] + 0.5) / 64; // threshold against the 8×8 Bayer matrix
      if (row[x]) count++;
    }
    on.push(row);
  }
  const fresh = '#cfe3ff', stale = '#b99a62';
  const runs = runsFromBool(on, (x) => (x * C < W * 0.52 ? fresh : stale));
  const defs = '<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0f2b5c"/><stop offset="1" stop-color="#2a2417"/></linearGradient>';
  const inner = `<rect width="${W}" height="${H}" fill="url(#g)"/>${cellPaths(runs, C)}`;
  return { defs, inner, meta: { algorithm: 'Ordered (Bayer) dithering', technique: 'Luminance field = 5-octave Perlin fbm + radial falloff; each 6 px cell is lit when L > (B8[y&7][x&7] + ½)/64; lit cells run-length merged into one path per colour; palette cuts from cool "fresh" to sepia "stale" at 52 % width', stats: { grid: `${cols}×${rows}`, litCells: count, paths: 2, runs: runs.length } } };
}

// ───────────────────────── 05 Patch · PCB bus routing ─────────────────────────
function bgPatch(spec, rng) {
  const P = 14; // trace pitch
  const occ = new Set();
  const key = (x, y) => `${Math.round(x / 20)}:${Math.round(y / 20)}`;
  const buses = [];
  let tries = 0;
  while (buses.length < 12 && tries < 400) {
    tries++;
    const vertical = rng() < 0.4;
    const lanes = 4 + Math.floor(rng() * 6);
    const dir = rng() < 0.5 ? 1 : -1;
    const along = vertical ? H : W, across = vertical ? W : H;
    let u = dir === 1 ? 30 + rng() * 200 : along - 30 - rng() * 200;
    let v = 60 + rng() * (across - 120 - lanes * P);
    const local = [[u, v]];
    const segs = 3 + Math.floor(rng() * 3);
    for (let s = 0; s < segs; s++) {
      const run = (4 + Math.floor(rng() * 8)) * 40;
      u += dir * run; local.push([u, v]);
      if (s < segs - 1 && rng() < 0.85) {
        const rise = (rng() < 0.5 ? -1 : 1) * (1 + Math.floor(rng() * 3)) * 40;
        u += dir * Math.abs(rise); v += rise; local.push([u, v]);
      }
    }
    const traces = Array.from({ length: lanes }, (_, i) => local.map(([a, b]) => { const bb = b + i * P; return vertical ? [bb, a] : [a, bb]; }));
    const ok = traces.every((t) => t.every(([x, y]) => x > 24 && x < W - 24 && y > 24 && y < H - 24));
    if (!ok) continue;
    let hits = 0, total = 0;
    const cells = [];
    for (const [x0, y0] of [traces[0], traces[lanes - 1]].flatMap((t) => t.slice(0, -1).map((p, i) => [p, t[i + 1]]))) {
      for (let s = 0; s <= 1; s += 0.1) { const c = key(lerp(x0[0], y0[0], s), lerp(x0[1], y0[1], s)); total++; if (occ.has(c)) hits++; cells.push(c); }
    }
    if (hits / total > 0.22) continue;
    cells.forEach((c) => occ.add(c));
    buses.push({ traces, lanes });
  }
  let copper = '', pads = '', vias = '', segCount = 0;
  for (const { traces } of buses) {
    for (const t of traces) {
      copper += `<path d="${polyPath(t)}"/>`;
      segCount += t.length - 1;
      pads += `<circle cx="${t[0][0]}" cy="${t[0][1]}" r="5.5"/>`;
      const e = t[t.length - 1];
      vias += `<circle cx="${e[0]}" cy="${e[1]}" r="8.5" fill="#0b3d2e" stroke="#e0a84a" stroke-width="3.5"/><circle cx="${e[0]}" cy="${e[1]}" r="2.8" fill="#05140f"/>`;
    }
  }
  // Three QFP-style IC footprints in clear zones.
  let ics = '';
  for (const [x, y, ref] of [[250, 700, 'U1'], [1010, 120, 'U2'], [700, 560, 'U3']]) {
    ics += `<rect x="${x}" y="${y}" width="130" height="130" rx="8" fill="#14161a" stroke="#2c3138" stroke-width="2"/><circle cx="${x + 18}" cy="${y + 18}" r="6" fill="#2c3138"/>`;
    for (let i = 0; i < 12; i++) { const o = 12 + i * 9.4; ics += `<path d="M${x + o} ${y - 9}v9M${x + o} ${y + 130}v9M${x - 9} ${y + o}h9M${x + 130} ${y + o}h9" stroke="#bfc4cc" stroke-width="3"/>`; }
    ics += `<text x="${x + 65}" y="${y + 74}" text-anchor="middle" font-family="monospace" font-size="20" fill="#7c8590">${ref}</text>`;
  }
  const defs = `<linearGradient id="mask" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f5a3f"/><stop offset="1" stop-color="#062a1d"/></linearGradient>
<pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1.4" fill="#2c8a63" opacity="0.5"/></pattern>`;
  const inner =
    `<rect width="${W}" height="${H}" fill="url(#mask)"/><rect width="${W}" height="${H}" fill="url(#dots)"/>` +
    `<g fill="none" stroke="#e0a84a" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" opacity="0.55" filter="url(#soft)">${copper}</g>` +
    `<g fill="none" stroke="#e0a84a" stroke-width="4.2" stroke-linejoin="round" stroke-linecap="round">${copper}</g>` +
    `<g fill="#f2c36b">${pads}</g>${vias}${ics}`;
  return { defs, inner, meta: { algorithm: 'Bus routing with 45° chamfers', technique: 'Each bus is a monotone polyline of 40 px grid runs and 45° rises; its 4–9 lanes are exact translates at 14 px pitch, so they stay parallel and never cross. Candidate buses are rejected when >22 % of samples land in cells already occupied (20 px occupancy hash). Half run vertically via an axis swap.', stats: { buses: buses.length, traces: buses.reduce((a, b) => a + b.lanes, 0), segments: segCount, vias: buses.reduce((a, b) => a + b.lanes, 0), icFootprints: 3 } } };
}

// ───────────────────────── 06 Prompt · Rule 110 cellular automaton ─────────────────────────
function bgPrompt(spec, rng) {
  const C = 5, cols = W / C, rows = H / C;
  let cur = Array.from({ length: cols }, () => (rng() < 0.5 ? 1 : 0));
  const grid = [];
  const RULE = 110;
  let alive = 0;
  for (let y = 0; y < rows; y++) {
    grid.push(cur);
    for (const c of cur) alive += c;
    const next = new Array(cols);
    for (let x = 0; x < cols; x++) {
      const idx = (cur[(x - 1 + cols) % cols] << 2) | (cur[x] << 1) | cur[(x + 1) % cols];
      next[x] = (RULE >> idx) & 1;
    }
    cur = next;
  }
  const bands = ['#5b2a9d', '#6a3fd0', '#4f7cff', '#27b6ff', '#3de0d0', '#8cf5b0'];
  const runs = runsFromBool(grid, (x, y) => bands[Math.min(bands.length - 1, Math.floor((y / rows) * bands.length))]);
  const defs = '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0820"/><stop offset="1" stop-color="#05040f"/></linearGradient>';
  const inner = `<rect width="${W}" height="${H}" fill="url(#g)"/><g opacity="0.9">${cellPaths(runs, C)}</g>`;
  return { defs, inner, meta: { algorithm: 'Elementary cellular automaton, Rule 110', technique: 'Random 320-cell seed row with wrap-around; next[x] = (110 >> (L·4 + C·2 + R)) & 1; 180 generations drawn top→bottom as 5 px cells, coloured in six horizontal bands, run-length merged. Rule 110 is Turing-complete — a fitting wallpaper for an agent that agrees to everything.', stats: { grid: `${cols}×${rows}`, liveCells: alive, runs: runs.length, paths: bands.length } } };
}

// ───────────────────────── 07 Bandwidth · Truchet tiles with packet loss ─────────────────────────
function bgBandwidth(spec, rng) {
  const T = 50, R = T / 2;
  const colors = ['#ff7a1a', '#ff4fa3', '#22d3ee', '#ffe9c2'];
  const paths = colors.map(() => []);
  let kept = 0, dropped = 0;
  for (let ty = 0; ty < H / T; ty++) for (let tx = 0; tx < W / T; tx++) {
    const x = tx * T, y = ty * T;
    const p = 0.9 * smoothstep(0.38, 1, x / W) ** 1.1; // the call degrades left → right
    if (rng() < p) { dropped++; continue; }
    kept++;
    const ci = Math.floor(rng() * colors.length);
    const o = rng() < 0.5;
    paths[ci].push(o
      ? `M${x} ${y + R}A${R} ${R} 0 0 0 ${x + R} ${y}M${x + T} ${y + R}A${R} ${R} 0 0 0 ${x + R} ${y + T}`
      : `M${x + R} ${y}A${R} ${R} 0 0 0 ${x + T} ${y + R}M${x} ${y + R}A${R} ${R} 0 0 0 ${x + R} ${y + T}`);
  }
  let bars = '';
  for (let i = 0; i < 4; i++) bars += `<rect x="${64 + i * 26}" y="${96 - i * 18}" width="16" height="${18 + i * 18}" fill="#ffe9c2" opacity="${i < 2 ? 1 : 0.22}"/>`;
  const defs = '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b0f52"/><stop offset="1" stop-color="#0d0620"/></linearGradient>';
  const inner = `<rect width="${W}" height="${H}" fill="url(#g)"/>` + colors.map((c, i) => `<path d="${paths[i].join('')}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="butt"/>`).join('') + `<g>${bars}</g>`;
  return { defs, inner, meta: { algorithm: 'Truchet tiling with progressive dropout', technique: '50 px tiles, each a pair of quarter-circle arcs in one of two orientations; tile removal probability p(x) = 0.9·smoothstep(0.38, 1, x/W)^1.1 simulates packet loss growing toward the right edge; four colour classes batched into four paths', stats: { tiles: kept + dropped, drawn: kept, dropped, dropRatePct: Math.round((dropped / (kept + dropped)) * 100) } } };
}

// ───────────────────────── 08 Firewall · heat-mapped brick wall ─────────────────────────
function bgFirewall(spec, rng) {
  const { fbm } = makeNoise(rng);
  const heatStops = ['#17110f', '#4a1810', '#b3291a', '#ff7a1a', '#ffd34d'];
  const heat = (x, y) => clamp(((y / H) ** 1.7) * 1.15 + 0.32 * fbm(x * 0.006, y * 0.012, 3) - 0.04);
  const BW = 96, BH = 36, M = 4;
  let mortar = '', bricks = '', count = 0;
  for (let row = 0; row * BH < H + BH; row++) {
    const y = row * BH, off = row % 2 ? BW / 2 : 0;
    for (let x = -off; x < W; x += BW) {
      const h = heat(x + BW / 2, y + BH / 2);
      bricks += `<rect x="${x + M / 2}" y="${y + M / 2}" width="${BW - M}" height="${BH - M}" rx="2" fill="${ramp(heatStops, h * 0.95)}"/>`;
      mortar += `<rect x="${x}" y="${y}" width="${BW}" height="${BH}" fill="${ramp(heatStops, clamp(h + 0.28))}"/>`;
      count++;
    }
  }
  // Flame tongues along the bottom from 1-D noise.
  let flames = '';
  for (let layer = 0; layer < 3; layer++) {
    let d = `M0 ${H}`;
    for (let x = 0; x <= W; x += 14) d += `L${x} ${r1(H - 40 - layer * 18 - Math.abs(fbm(x * 0.012 + layer * 9, layer * 3.1, 3)) * (300 - layer * 70) * (0.6 + 0.4 * Math.sin(x * 0.005)))}`;
    flames += `<path d="${d}L${W} ${H}Z" fill="${['#b3291a', '#ff7a1a', '#ffd34d'][layer]}" opacity="${[0.4, 0.45, 0.5][layer]}"/>`;
  }
  let embers = '';
  for (let i = 0; i < 180; i++) {
    const y = H * (1 - rng() ** 1.8);
    embers += `<circle cx="${r1(rng() * W)}" cy="${r1(y)}" r="${r1(0.8 + rng() * 2.8 * (y / H))}" fill="${rng() < 0.5 ? '#ffd34d' : '#ff7a1a'}" opacity="${r1(0.35 + rng() * 0.6)}"/>`;
  }
  const inner = `<rect width="${W}" height="${H}" fill="#17110f"/>${mortar}${bricks}<g filter="url(#soft)">${flames}</g>${flames}<g filter="url(#glow)">${embers}</g>`;
  return { defs: '', inner, meta: { algorithm: 'Heat-mapped masonry', technique: 'Running-bond bricks (96×36, 4 px mortar). Heat h = (y/H)^1.7·1.15 + 0.32·fbm(0.006x, 0.012y) mapped through a 5-stop ramp charcoal→ember→orange→yellow; mortar is the same ramp +0.28 so joints glow brighter than faces; three flame layers from 1-D fbm; 180 embers with y-biased distribution', stats: { bricks: count, flameLayers: 3, embers: 180, rampStops: heatStops.length } } };
}

// ───────────────────────── 09 Legacy · CRT phosphor emulation ─────────────────────────
function bgLegacy(spec, rng) {
  const lines = [
    'IDENTIFICATION DIVISION.', 'PROGRAM-ID. PAYROLL.', 'ENVIRONMENT DIVISION.', 'DATA DIVISION.', 'WORKING-STORAGE SECTION.',
    '01 WS-BOTS        PIC 9(03) VALUE 010.', '01 WS-HOURS       PIC 9(03)V99.', '01 WS-RATE        PIC 9(03)V99.', 'PROCEDURE DIVISION.',
    'MAIN-PARA.', '    PERFORM PAY-BOT VARYING I FROM 1 BY 1', '        UNTIL I > WS-BOTS.', '    DISPLAY "PAYROLL RUN COMPLETE".',
    '    STOP RUN.', 'PAY-BOT.', '    COMPUTE WS-PAY = WS-HOURS * WS-RATE.', '    DISPLAY "PAID " I.', '', 'READY.',
  ];
  const fs = 24, lh = 34, x0 = 130, y0 = 150;
  const text = (dx, fill, op, filter = '') => `<g font-family="'Courier New',monospace" font-size="${fs}" fill="${fill}" opacity="${op}" ${filter}>${lines.map((l, i) => `<text x="${x0 + dx}" y="${y0 + i * lh}" xml:space="preserve">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`).join('')}</g>`;
  const defs = `
<radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></radialGradient>
<linearGradient id="roll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9dffbf" stop-opacity="0"/><stop offset="0.5" stop-color="#9dffbf" stop-opacity="0.09"/><stop offset="1" stop-color="#9dffbf" stop-opacity="0"/></linearGradient>
<pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity="0.42"/></pattern>
<pattern id="triad" width="6" height="3" patternUnits="userSpaceOnUse"><rect width="2" height="3" fill="#ff2a2a" opacity="0.17"/><rect x="2" width="2" height="3" fill="#2aff5a" opacity="0.17"/><rect x="4" width="2" height="3" fill="#2a5aff" opacity="0.17"/></pattern>
<filter id="phos" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${hashSeed('legacy') % 997}"/><feColorMatrix values="0 0 0 0 0.6  0 0 0 0 1  0 0 0 0 0.7  0 0 0 0.9 -0.35"/></filter>`;
  const inner =
    `<rect width="${W}" height="${H}" fill="#020a05"/>` +
    `<rect x="46" y="46" width="${W - 92}" height="${H - 92}" rx="70" fill="#04130a" stroke="#1b2a20" stroke-width="10"/>` +
    text(-2.2, '#ff3b3b', 0.22) + text(2.2, '#3b6bff', 0.22) + text(0, '#6dff9a', 1, 'filter="url(#phos)"') +
    `<rect x="${x0 + 168}" y="${y0 + 18 * lh - 24}" width="14" height="26" fill="#6dff9a" filter="url(#phos)"/>` +
    `<rect x="46" y="300" width="${W - 92}" height="170" fill="url(#roll)"/>` +
    `<rect x="46" y="46" width="${W - 92}" height="${H - 92}" rx="70" filter="url(#grain)" opacity="0.28"/>` +
    `<rect width="${W}" height="${H}" fill="url(#triad)"/><rect width="${W}" height="${H}" fill="url(#scan)"/><rect width="${W}" height="${H}" fill="url(#vig)"/>`;
  return { defs, inner, meta: { algorithm: 'CRT phosphor emulation', technique: 'Monospace listing drawn three times (red −2.2 px, blue +2.2 px, green 0) for chromatic aberration; green pass gets a double gaussian bloom; RGB aperture-grille tiles (6×3 px triad), 4×3 scanline mask, feTurbulence phosphor grain, radial vignette and a 170 px rolling hum bar; screen is a 70 px-radius rounded rect to fake tube curvature', stats: { listingLines: lines.length, textPasses: 3, overlayLayers: 5 } } };
}

// ───────────────────────── 10 Ping · dawn over the marine layer ─────────────────────────
function bgPing(spec, rng) {
  const { fbm } = makeNoise(rng);
  const ridge = (base, amp, freq, off, col, op = 1) => {
    let d = `M0 ${H}`;
    for (let x = 0; x <= W; x += 8) d += `L${x} ${Math.round(base + fbm(x * freq + off, off * 0.7, 5) * amp * 2)}`;
    return `<path d="${d}L${W} ${H}Z" fill="${col}" opacity="${op}"/>`;
  };
  const layers = [
    ridge(520, 120, 0.0019, 3, '#7b5aa6', 0.55), ridge(570, 110, 0.0024, 11, '#5a3f86', 0.75), ridge(640, 100, 0.0031, 23, '#3b2a63', 0.9),
    ridge(700, 80, 0.0038, 37, '#241a45'), ridge(770, 60, 0.0049, 51, '#150f2c'), ridge(830, 40, 0.0066, 77, '#0a0818'),
  ];
  let stars = '';
  for (let i = 0; i < 200; i++) { const y = rng() ** 1.8 * 420; stars += `<circle cx="${r1(rng() * W)}" cy="${r1(y)}" r="${r1(0.5 + rng() * 1.2)}" fill="#fff" opacity="${r1((1 - y / 420) * (0.3 + rng() * 0.7))}"/>`; }
  let city = '', windows = 0, lit = 0;
  for (let x = 20; x < 880; ) {
    const w = 26 + Math.floor(rng() * 40), h = 40 + Math.floor(rng() * 140);
    city += `<rect x="${x}" y="${H - h - 18}" width="${w}" height="${h + 18}" fill="#070510"/>`;
    for (let wy = H - h - 10; wy < H - 20; wy += 12) for (let wx = x + 5; wx < x + w - 6; wx += 9) {
      windows++;
      if (rng() < 0.42) { lit++; city += `<rect x="${wx}" y="${wy}" width="4" height="6" fill="${rng() < 0.8 ? '#ffd68a' : '#9dffe0'}" opacity="0.9"/>`; }
    }
    x += w + 3 + Math.floor(rng() * 8);
  }
  const defs = `
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090c2b"/><stop offset="0.35" stop-color="#2b2a6b"/><stop offset="0.62" stop-color="#c9567a"/><stop offset="0.8" stop-color="#ffb36b"/><stop offset="0.92" stop-color="#ffe3a3"/></linearGradient>
<radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff6d0"/><stop offset="0.18" stop-color="#ffd68a"/><stop offset="1" stop-color="#ffb36b" stop-opacity="0"/></radialGradient>
<filter id="fog" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0032 0.017" numOctaves="4" seed="${hashSeed('ping') % 991}"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 0.92  0 0 0 0 0.86  0 0 0 1.7 -0.62"/></filter>
<linearGradient id="fogfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="band"><rect y="520" width="${W}" height="260" fill="url(#fogfade)"/></mask>`;
  const inner =
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>${stars}` +
    `<circle cx="520" cy="610" r="340" fill="url(#sun)"/><circle cx="520" cy="610" r="60" fill="#fff3c4"/>` +
    layers.slice(0, 3).join('') +
    `<rect y="520" width="${W}" height="260" filter="url(#fog)" mask="url(#band)" opacity="0.9"/>` +
    layers.slice(3).join('') + city;
  return { defs, inner, meta: { algorithm: 'Atmospheric-perspective ridgelines + marine layer', technique: 'Six ridges from 5-octave 1-D fbm at increasing frequency/darkness (aerial perspective); stratus bank = feTurbulence fractalNoise (baseFrequency 0.0032×0.017, 4 octaves) → colour matrix alpha = 1.7·A − 0.62, masked by a vertical gaussian-ish fade; skyline of 40+ blocks with randomised lit windows', stats: { ridges: 6, stars: 200, windows, litWindows: lit, litPct: Math.round((lit / windows) * 100) } } };
}

const SCENES = {
  loop: bgLoop, cron: bgCron, token: bgToken, cache: bgCache, patch: bgPatch,
  prompt: bgPrompt, bandwidth: bgBandwidth, firewall: bgFirewall, legacy: bgLegacy, ping: bgPing,
};
// Where the Noun stands in each scene (px). Chosen against each composition's quiet area.
const STAND = {
  loop: { x: 930, y: 300 }, cron: { x: 880, y: 330 }, token: { x: 980, y: 300 }, cache: { x: 900, y: 310 }, patch: { x: 930, y: 300 },
  prompt: { x: 900, y: 300 }, bandwidth: { x: 340, y: 300 }, firewall: { x: 900, y: 310 }, legacy: { x: 920, y: 300 }, ping: { x: 930, y: 300 },
};

// ───────────────────────── cover ─────────────────────────
function cover() {
  const CW = 1200, CH = 630, C = 5;
  const rng = mulberry32(hashSeed('office-bots-cover'));
  const { fbm } = makeNoise(rng);
  const cols = CW / C, rows = CH / C;
  const on = [];
  for (let y = 0; y < rows; y++) {
    const row = new Array(cols);
    for (let x = 0; x < cols; x++) {
      const l = clamp(0.2 + (1 - y / rows) * 0.75 + fbm(x * 0.018, y * 0.018, 3) * 0.5);
      row[x] = l > (BAYER8[y & 7][x & 7] + 0.5) / 64;
    }
    on.push(row);
  }
  const dither = cellPaths(runsFromBool(on, (x, y) => (y < rows * 0.45 ? '#3de0d0' : '#27b6ff')), C);
  let nouns = '';
  CAST.forEach((spec, i) => {
    const s = 0.5;
    const x = 20 + i * 116, y = CH - 160 - 40;
    nouns += `<g transform="translate(${x} ${y}) scale(${s})" shape-rendering="crispEdges">${nounRects(spec)}</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}" role="img" aria-label="Office Bots: ten pixel-art bot Nouns lined up at the office"><rect width="${CW}" height="${CH}" fill="#0c0820"/>${dither}<rect x="0" y="${CH - 90}" width="${CW}" height="90" fill="#0c0820"/><g shape-rendering="crispEdges" opacity="1">${nouns}</g><rect x="24" y="62" width="790" height="214" rx="8" fill="#0c0820" opacity="0.8"/><g font-family="Arial,Helvetica,sans-serif" fill="#ffffff"><text x="48" y="108" font-size="22" letter-spacing="4" opacity="0.85">POINTCAST  /  A SITCOM</text><text x="44" y="206" font-size="108" font-weight="700" letter-spacing="-3">Office Bots</text><text x="48" y="252" font-size="30" opacity="0.9">Ten bots. One office. Nobody asked them to stay late.</text></g></svg>\n`;
}

// ───────────────────────── main ─────────────────────────
const manifest = { generatedBy: 'scripts/generate-office-bots-art.mjs', canvas: { width: W, height: H }, cast: {}, backgrounds: {}, cover: {} };
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

for (const spec of CAST) {
  const svg = nounSvg(spec);
  writeFileSync(join(OUT, 'cast', `${spec.slug}.svg`), svg);
  manifest.cast[spec.slug] = { file: `/images/office-bots/cast/${spec.slug}.svg`, bytes: Buffer.byteLength(svg), rects: (svg.match(/<rect/g) || []).length - 1, grid: '32×32 @10px', sha256_16: sha(svg) };

  const seed = hashSeed(`office-bots/${spec.slug}`);
  const scene = SCENES[spec.slug](spec, mulberry32(seed));
  const svgBg = frame(scene.defs, scene.inner + compositeNoun(spec, STAND[spec.slug]), `${spec.name}: ${scene.meta.algorithm}, with the ${spec.name} bot Noun in the foreground`);
  writeFileSync(join(OUT, 'bg', `${spec.slug}.svg`), svgBg);
  manifest.backgrounds[spec.slug] = {
    file: `/images/office-bots/bg/${spec.slug}.svg`, seed, bytes: Buffer.byteLength(svgBg), sha256_16: sha(svgBg),
    elements: (svgBg.match(/<(path|rect|circle|text|g|ellipse)\b/g) || []).length, ...scene.meta,
  };
  console.log(`${spec.slug.padEnd(10)} ${String(Buffer.byteLength(svgBg)).padStart(8)} bytes  ${scene.meta.algorithm}`);
}

const coverSvg = cover();
writeFileSync(join(OUT, 'cover.svg'), coverSvg);
await sharp(Buffer.from(coverSvg)).png({ compressionLevel: 9 }).toFile(join(OUT, 'cover.png'));
manifest.cover = { svg: '/images/office-bots/cover.svg', png: '/images/office-bots/cover.png', bytes: Buffer.byteLength(coverSvg), sha256_16: sha(coverSvg) };

writeFileSync(join(ROOT, 'src/lib/office-bots-art.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('wrote manifest, cover.svg, cover.png');
