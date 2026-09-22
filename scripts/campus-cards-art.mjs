#!/usr/bin/env node
/**
 * Campus Cards art generator.
 *
 * Paints every card in src/data/campus-cards.json as a pixel-art trading
 * card SVG (animated with CSS keyframes only; static geometry lives in
 * presentation attributes so sharp/librsvg rasterize a clean still) and a
 * PNG twin for marketplaces and unfurls.
 *
 *   node scripts/campus-cards-art.mjs            # all sets
 *   node scripts/campus-cards-art.mjs --no-png   # svg only
 *
 * Output: public/images/campus-cards/{set}/{NN}-{slug}.svg|.png
 * Everything here is original, CC0, and deliberately uses no university
 * marks: places only.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = JSON.parse(readFileSync(path.join(ROOT, 'src/data/campus-cards.json'), 'utf8'));
const WANT_PNG = !process.argv.includes('--no-png');

// Card geometry (SVG units). The art window is a GW x GH pixel grid.
const W = 400;
const H = 560;
const P = 4; // one art pixel
const GW = 88;
const GH = 64;
const AX = 24;
const AY = 76;

// ---------------------------------------------------------------- painter
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

class Canvas {
  constructor(seed) {
    this.layers = { base: [] };
    this.order = ['base'];
    this.rand = rng(seed);
  }
  layer(name) {
    if (!this.layers[name]) { this.layers[name] = []; this.order.push(name); }
    return name;
  }
  px(x, y, w, h, fill, layer = 'base') {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (w <= 0 || h <= 0) return;
    if (x >= GW || y >= GH || x + w <= 0 || y + h <= 0) return;
    const x0 = Math.max(0, x); const y0 = Math.max(0, y);
    const x1 = Math.min(GW, x + w); const y1 = Math.min(GH, y + h);
    this.layer(layer);
    this.layers[layer].push(`<rect x="${x0 * P}" y="${y0 * P}" width="${(x1 - x0) * P}" height="${(y1 - y0) * P}" fill="${fill}"/>`);
  }
  dot(x, y, fill, layer) { this.px(x, y, 1, 1, fill, layer); }
  // Horizontal sky/sea bands with a one-row checker dither between bands.
  bands(y0, stops, layer = 'base') {
    let y = y0;
    stops.forEach(([h, color], i) => {
      this.px(0, y, GW, h, color, layer);
      const next = stops[i + 1];
      if (next) for (let x = (i % 2); x < GW; x += 2) this.dot(x, y + h - 1, next[1], layer);
      y += h;
    });
    return y;
  }
  disc(cx, cy, r, fill, layer) {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y) + 0.3);
      this.px(cx - half, cy + y, half * 2 + 1, 1, fill, layer);
    }
  }
  // Column silhouette: top(x) gives the first filled row; fills to bottom.
  silhouette(top, fill, bottom = GH, layer = 'base', x0 = 0, x1 = GW) {
    for (let x = x0; x < x1; x++) {
      const t = Math.round(top(x));
      if (t < bottom) this.px(x, t, 1, bottom - t, fill, layer);
    }
  }
  ridge(base, amp, seedOff, fill, bottom = GH, layer = 'base') {
    const r = rng(seedOff);
    const a = [r() * 6, r() * 6, r() * 6];
    this.silhouette((x) => base - amp * (0.55 * Math.sin(x / 9 + a[0]) + 0.3 * Math.sin(x / 4.3 + a[1]) + 0.15 * Math.sin(x / 1.9 + a[2]) + 0.5), fill, bottom, layer);
  }
  svg() {
    return this.order
      .map((name) => (name === 'base' ? this.layers[name].join('') : `<g class="${name}">${this.layers[name].join('')}</g>`))
      .join('');
  }
}

// --------------------------------------------------------------- sprites
function palm(c, x, base, h, trunk = '#6b4a2f', frond = '#1f5b3a', frond2 = '#2e7d4f') {
  for (let i = 0; i < h; i++) c.dot(x + Math.round(Math.sin(i / 5) * 1.2), base - i, trunk);
  const tx = x + Math.round(Math.sin((h - 1) / 5) * 1.2);
  const ty = base - h;
  const fronds = [[-5, 2], [-4, 1], [-3, 0], [-2, -1], [2, -1], [3, 0], [4, 1], [5, 2]];
  fronds.forEach(([dx, dy], i) => {
    const steps = Math.abs(dx);
    for (let s = 1; s <= steps; s++) c.dot(tx + Math.sign(dx) * s, ty + Math.round((dy * s) / steps), i % 2 ? frond : frond2);
  });
  c.px(tx - 1, ty - 1, 3, 2, frond);
}

function bike(c, x, y, frame = '#d23b3b', layer) {
  const ink = '#1d1d2b';
  // wheels
  [[x, y], [x + 5, y]].forEach(([wx, wy]) => {
    c.px(wx, wy - 1, 2, 1, ink, layer); c.px(wx - 1, wy, 1, 1, ink, layer); c.px(wx + 2, wy, 1, 1, ink, layer); c.px(wx, wy + 1, 2, 1, ink, layer);
  });
  c.px(x + 1, y - 2, 4, 1, frame, layer);
  c.px(x + 3, y - 1, 1, 1, frame, layer);
  c.px(x + 5, y - 3, 1, 2, frame, layer);
  c.px(x + 1, y - 3, 2, 1, ink, layer);
}

function rider(c, x, y, shirt, layer) {
  bike(c, x, y, '#1d1d2b', layer);
  c.px(x + 2, y - 6, 2, 3, shirt, layer);
  c.px(x + 2, y - 8, 2, 2, '#e9b48a', layer);
  c.px(x + 4, y - 5, 1, 1, shirt, layer);
}

function bird(c, x, y, color = '#2b2b3a', layer) {
  c.dot(x, y, color, layer); c.dot(x + 1, y + 1, color, layer); c.dot(x + 2, y, color, layer);
}

function glints(c, y0, y1, n, color, layer = 'glint') {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(c.rand() * GW);
    const y = y0 + Math.floor(c.rand() * (y1 - y0));
    c.px(x, y, 1 + Math.floor(c.rand() * 3), 1, color, layer);
  }
}

function waves(c, y, color, layer = 'waves', x0 = 0, x1 = GW) {
  for (let x = x0; x < x1 - 3; x += 6) c.px(x + (y % 3), y, 3, 1, color, layer);
}

// ---------------------------------------------------------------- scenes
const SCENES = {
  tower(c) {
    c.bands(0, [[10, '#1b2a6b'], [10, '#34409a'], [9, '#6c58b8'], [8, '#d96c9a'], [8, '#f39a6b']]);
    c.disc(70, 40, 5, '#ffd27a');
    c.ridge(44, 7, 11, '#3b2d5c', 64);
    // campus trees + buildings
    c.silhouette((x) => 50 - (x % 11 < 6 ? 2 : 0) - (x % 23 < 3 ? 3 : 0), '#1e2a3d');
    c.px(0, 56, GW, 8, '#16202e');
    // Storke-style tower: slim shaft, slit windows, open belfry, spire.
    const tx = 38; const tw = 11; const top = 8;
    c.px(tx, top + 8, tw, 56 - top - 8, '#efe6d2');
    c.px(tx + tw - 3, top + 8, 3, 56 - top - 8, '#cdbfa3');
    for (let y = top + 14; y < 52; y += 4) { c.px(tx + 2, y, 1, 2, '#8d7e66'); c.px(tx + 5, y, 1, 2, '#8d7e66'); }
    // belfry
    c.px(tx - 1, top + 2, tw + 2, 6, '#efe6d2');
    c.px(tx + 1, top + 3, 2, 4, '#2a2340'); c.px(tx + 4, top + 3, 3, 4, '#2a2340'); c.px(tx + 8, top + 3, 2, 4, '#2a2340');
    c.px(tx + 5, top + 5, 1, 1, '#ffcf5a', 'bell');
    c.px(tx - 1, top + 1, tw + 2, 1, '#cdbfa3');
    c.px(tx + 4, top - 4, 3, 5, '#efe6d2');
    c.px(tx + 5, top - 7, 1, 3, '#cdbfa3');
    // windows lit
    [[8, 52], [15, 51], [62, 50], [74, 52], [80, 49]].forEach(([x, y]) => c.px(x, y, 2, 1, '#ffd98a', 'twinkle'));
    palm(c, 16, 56, 14); palm(c, 66, 56, 16); palm(c, 78, 57, 11);
    for (let i = 0; i < 4; i++) bird(c, 10 + i * 5, 12 + (i % 2) * 2, '#1b2440', 'drift');
    // bell ripples
    [[tx - 6, top + 4], [tx + tw + 4, top + 4]].forEach(([x, y]) => { c.px(x, y, 1, 3, '#ffe7a8', 'ring'); c.px(x + (x < tx ? -2 : 2), y - 1, 1, 5, '#ffe7a8', 'ring'); });
  },

  point(c) {
    c.bands(0, [[8, '#6fc3ff'], [10, '#9ad7ff'], [8, '#c9ecff']]);
    c.disc(18, 8, 4, '#fff4c2');
    const sea = 26;
    c.bands(sea, [[6, '#1e6fb8'], [8, '#2a86cf'], [10, '#3aa0dd']]);
    c.silhouette((x) => sea - 2 + Math.round(Math.sin(x / 7) * 0.8), '#6a8fb0', sea + 1, 'base', 0, 30);
    // bluff jutting from the right
    c.silhouette((x) => (x < 34 ? GH : 30 + Math.round((88 - x) / 12) - (x > 60 ? 2 : 0)), '#c8995c');
    c.silhouette((x) => (x < 36 ? GH : 31 + Math.round((88 - x) / 12)), '#a8783f', GH, 'base', 36, GW);
    c.silhouette((x) => (x < 34 ? GH : 29 + Math.round((88 - x) / 12) - (x > 60 ? 2 : 0)), '#5f9a4a', 0 + 33, 'base', 34, GW);
    // beach
    c.silhouette((x) => (x < 46 ? 50 + Math.round((46 - x) / 10) : GH), '#e8d3a2', GH, 'base', 0, 46);
    for (let y = 36; y < 50; y += 4) waves(c, y, '#e6f6ff', 'waves', 0, 30 - (y - 36));
    glints(c, sea, 48, 18, '#ffffff');
    // surfers
    c.px(20, 42, 5, 1, '#ff6b4a', 'bob'); c.px(22, 40, 1, 2, '#1d1d2b', 'bob');
    c.px(8, 46, 5, 1, '#ffd23f', 'bob'); c.px(10, 44, 1, 2, '#1d1d2b', 'bob');
    palm(c, 70, 30, 12); palm(c, 80, 31, 9);
    bird(c, 40, 10); bird(c, 46, 7);
  },

  plovers(c) {
    c.bands(0, [[9, '#a9d6f5'], [9, '#cfe8f7'], [6, '#f2f1e6']]);
    c.bands(24, [[4, '#2f7fb8'], [5, '#4a9ccc']]);
    c.silhouette((x) => 33 + Math.round(Math.sin(x / 6) * 2 + Math.sin(x / 2.3)), '#e7cf97');
    c.silhouette((x) => 39 + Math.round(Math.sin(x / 9 + 1) * 3), '#d9bd7c');
    // dune grass
    for (let x = 2; x < GW; x += 3) {
      const base = 39 + Math.round(Math.sin(x / 9 + 1) * 3);
      if (x % 7 < 4) { c.px(x, base - 3, 1, 3, '#6d8f3d', 'sway'); c.dot(x + 1, base - 2, '#88a94f', 'sway'); }
    }
    c.px(0, 52, GW, 12, '#cdae6c');
    // small round shorebirds
    [[20, 50], [29, 52], [44, 49], [58, 53], [67, 50]].forEach(([x, y], i) => {
      c.px(x, y, 3, 2, '#d8c7a6', 'peck');
      c.px(x, y - 1, 2, 1, '#a58f6a', 'peck');
      c.dot(x + (i % 2 ? -1 : 3), y, '#3a2e22', 'peck');
      c.dot(x + 1, y + 2, '#e7a24a'); c.dot(x + 2, y + 2, '#e7a24a');
    });
    // rope fence
    for (let x = 4; x < GW; x += 12) c.px(x, 44, 1, 7, '#7a5a3a');
    for (let x = 4; x < GW - 12; x += 12) for (let s = 0; s < 12; s++) c.dot(x + s, 45 + Math.round(Math.sin((s / 12) * Math.PI) * 1.4), '#b09368');
    glints(c, 24, 32, 10, '#ffffff');
    waves(c, 30, '#e9f7ff');
  },

  lagoon(c) {
    c.bands(0, [[10, '#f7c98b'], [8, '#f5a97b'], [8, '#e98d86']]);
    c.disc(60, 22, 4, '#fff1b8');
    c.ridge(30, 5, 7, '#7b6a8f', 34);
    c.silhouette((x) => 32 - (x % 9 < 3 ? 2 : 0), '#4c5a52', 36);
    c.bands(34, [[8, '#6a86a8'], [10, '#7d9dbd'], [12, '#90b1cc']]);
    // reflection of sun
    for (let y = 36; y < 56; y += 3) c.px(56 + ((y / 3) % 2), y, 8 - ((y - 36) / 6), 1, '#ffe0a0', 'glint');
    // reeds front
    for (let x = 0; x < GW; x += 2) if (x < 22 || x > 74) c.px(x, 52 - (x % 5), 1, 12, x % 4 ? '#3f5a34' : '#56733f', 'sway');
    // heron
    const hx = 30; const hy = 50;
    c.px(hx, hy - 12, 3, 6, '#d9dde3'); c.px(hx + 1, hy - 16, 1, 4, '#d9dde3'); c.px(hx + 1, hy - 18, 2, 2, '#d9dde3');
    c.px(hx + 3, hy - 17, 3, 1, '#e6b43c'); c.px(hx - 1, hy - 11, 1, 4, '#9aa3ad');
    c.px(hx + 1, hy - 6, 1, 6, '#4a4a4a'); c.px(hx + 2, hy - 6, 1, 6, '#4a4a4a');
    c.px(hx - 2, hy, 8, 1, '#a9c3d6');
    bird(c, 20, 8); bird(c, 26, 5); bird(c, 70, 10);
  },

  delplaya(c) {
    c.bands(0, [[8, '#3a2f6b'], [8, '#7a3f86'], [8, '#d85a7a'], [7, '#f08a4b'], [5, '#ffc15a']]);
    c.disc(22, 35, 6, '#ffe28a');
    c.bands(34, [[4, '#b65a55'], [6, '#7c4a6e'], [14, '#54456e']]);
    for (let y = 35; y < 48; y += 2) c.px(16 + (y % 4), y, 12 - (y - 35) / 2, 1, '#ffcf7a', 'glint');
    // cliff top with houses facing west
    c.silhouette((x) => (x < 44 ? GH : 40 - Math.round((x - 44) / 18)), '#3a2a2e');
    const houses = [[48, 9, '#f2a65a'], [58, 8, '#79c2b0'], [67, 10, '#f07f7f'], [78, 9, '#f5d76e']];
    houses.forEach(([x, w, col], i) => {
      const base = 40 - Math.round((x - 44) / 18);
      const h = 8 + (i % 2) * 3;
      c.px(x, base - h, w, h, col);
      c.px(x - 1, base - h - 1, w + 2, 1, '#2a1f2a');
      c.px(x + 1, base - h + 2, 2, 2, '#ffe9a8', 'twinkle'); c.px(x + w - 3, base - h + 2, 2, 2, '#ffe9a8');
      c.px(x + 3, base - 4, 2, 4, '#3a2a2e');
    });
    // silhouettes watching
    [[46, 40], [50, 40], [54, 39]].forEach(([x, y]) => { c.px(x, y - 4, 1, 4, '#1a1320'); c.dot(x, y - 5, '#1a1320'); });
    c.px(44, 40, 1, 24, '#2a1f24');
    c.px(0, 56, 44, 8, '#e0b58a');
    waves(c, 54, '#f7c6b0', 'waves', 0, 44);
  },

  islands(c) {
    c.bands(0, [[12, '#5bb8f0'], [10, '#8fd0f5'], [6, '#c5e8f8']]);
    // islands on horizon
    c.silhouette((x) => 25 - Math.round(4 * Math.sin((x - 4) / 14) + 2 * Math.sin(x / 5)) + (x > 58 ? 3 : 0), '#6d86a3', 28);
    c.silhouette((x) => (x > 62 && x < 80 ? 26 - Math.round(2 * Math.sin((x - 62) / 6)) : 28), '#7f97b2', 28);
    c.bands(28, [[5, '#1f67a8'], [7, '#2479bb'], [8, '#2f8ccb']]);
    glints(c, 28, 46, 22, '#ffffff');
    // sailboat
    c.px(40, 38, 7, 2, '#f4f4f4', 'bob'); c.px(43, 30, 1, 8, '#6b4a2f', 'bob');
    for (let i = 0; i < 7; i++) c.px(44, 31 + i, Math.max(1, 4 - Math.floor(i / 2)), 1, '#ff6b4a', 'bob');
    // foreground bluff with ice plant
    c.silhouette((x) => 48 + Math.round(Math.sin(x / 8) * 2), '#8c6a3f');
    c.silhouette((x) => 48 + Math.round(Math.sin(x / 8) * 2), '#c54f8f', 51);
    for (let x = 1; x < GW; x += 4) c.dot(x, 49 + Math.round(Math.sin(x / 8) * 2), '#ff8fc4', 'twinkle');
    // dolphins
    c.px(18, 42, 4, 1, '#3f5670', 'bob'); c.dot(19, 41, '#3f5670', 'bob'); c.px(26, 43, 4, 1, '#3f5670', 'bob'); c.dot(27, 42, '#3f5670', 'bob');
    bird(c, 60, 10); bird(c, 66, 12);
  },

  tunnel(c) {
    c.px(0, 0, GW, GH, '#8fa3a6');
    // hillside above, sky slice
    c.bands(0, [[6, '#a7ddf7'], [4, '#cdeefb']]);
    c.silhouette((x) => 9 + Math.round(Math.sin(x / 10) * 2), '#6a9b4d', 26);
    for (let x = 0; x < GW; x += 5) c.px(x, 10 + Math.round(Math.sin(x / 10) * 2), 3, 2, '#86b85f');
    // concrete headwall
    c.px(0, 20, GW, 44, '#b9b4a6');
    for (let y = 24; y < 64; y += 6) c.px(0, y, GW, 1, '#a39e90');
    // arch opening
    const cx = 44; const r = 24;
    for (let y = 0; y < 34; y++) {
      const dy = Math.max(0, 14 - y);
      const half = y < 14 ? Math.floor(Math.sqrt(r * r - (dy * dy * 3))) : r;
      c.px(cx - half, 26 + y, half * 2, 1, y < 4 ? '#3a3a44' : '#232330');
    }
    // light at the other end
    c.px(cx - 6, 36, 12, 16, '#fff3c8', 'glow');
    c.px(cx - 4, 38, 8, 14, '#ffffff', 'glow');
    // mural stripes on headwall
    ['#ff6b4a', '#ffd23f', '#3fb8a8', '#5a6bff'].forEach((col, i) => c.px(2 + i * 4, 30, 3, 20, col));
    ['#5a6bff', '#3fb8a8', '#ffd23f', '#ff6b4a'].forEach((col, i) => c.px(71 + i * 4, 30, 3, 20, col));
    // path + riders
    c.px(0, 60, GW, 4, '#6f6f76');
    for (let x = 2; x < GW; x += 8) c.px(x, 61, 4, 1, '#f2f2f2');
    rider(c, 30, 58, '#ff6b4a', 'ride');
    rider(c, 50, 58, '#3fb8a8', 'ride2');
  },

  roundabout(c) {
    c.px(0, 0, GW, GH, '#77a85a');
    for (let i = 0; i < 90; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * GH), c.rand() > 0.5 ? '#88b968' : '#6a9a4f');
    // four paths
    c.px(38, 0, 12, GH, '#9a978f'); c.px(0, 26, GW, 12, '#9a978f');
    // ring
    const cx = 44; const cy = 32;
    c.disc(cx, cy, 20, '#9a978f');
    c.disc(cx, cy, 9, '#5f944a');
    c.disc(cx, cy, 5, '#e05a8a');
    c.disc(cx, cy, 2, '#ffd23f');
    // dashed lane ring
    for (let a = 0; a < 360; a += 15) {
      const rad = (a * Math.PI) / 180;
      c.dot(cx + Math.round(Math.cos(rad) * 14.5), cy + Math.round(Math.sin(rad) * 14.5), '#f4f1e8');
    }
    // bikes orbiting (top-down dots with heads) — on their own spinning layer
    c.px(cx - 20, cy - 20, 41, 41, 'none', 'spin'); // symmetric bbox so the orbit spins about the ring's center
    const cols = ['#ff6b4a', '#3fb8a8', '#5a6bff', '#ffd23f', '#f07fbf', '#ffffff'];
    for (let i = 0; i < 6; i++) {
      const rad = (i / 6) * Math.PI * 2;
      const r = i % 2 ? 12 : 17;
      const x = cx + Math.round(Math.cos(rad) * r); const y = cy + Math.round(Math.sin(rad) * r);
      c.px(x - 1, y - 1, 3, 3, '#1d1d2b', 'spin'); c.dot(x, y, cols[i], 'spin');
    }
    // trees at corners
    [[10, 10], [76, 10], [10, 54], [76, 54]].forEach(([x, y]) => { c.disc(x, y, 5, '#2f6b3a'); c.disc(x - 1, y - 1, 3, '#3f8a4a'); });
  },

  bikes(c) {
    c.bands(0, [[14, '#9ed6f7'], [6, '#c8ebfb']]);
    // lecture hall facade
    c.px(0, 8, GW, 36, '#e9dcc0');
    for (let x = 4; x < GW; x += 10) { c.px(x, 12, 6, 10, '#6d8fb3'); c.px(x, 26, 6, 10, '#6d8fb3'); c.px(x + 3, 12, 1, 10, '#e9dcc0'); c.px(x + 3, 26, 1, 10, '#e9dcc0'); }
    c.px(0, 8, GW, 2, '#b89f74');
    c.px(36, 30, 16, 14, '#4a3a2c');
    c.px(0, 44, GW, 20, '#c9c5bb');
    // a clock over the door: ten to the hour
    c.disc(44, 24, 3, '#ffffff'); c.dot(44, 23, '#1d1d2b'); c.dot(44, 22, '#1d1d2b'); c.dot(43, 24, '#1d1d2b'); c.dot(42, 23, '#1d1d2b');
    // racks of bikes, three rows
    const cols = ['#d23b3b', '#1f6fd1', '#3a7d44', '#e0a100', '#8e3fd0', '#ff6b4a', '#3fb8a8', '#1d1d2b', '#f07fbf'];
    let k = 0;
    [50, 56, 62].forEach((y, row) => {
      for (let x = 1 + row * 2; x < GW - 6; x += 8) bike(c, x, y, cols[(k++) % cols.length]);
      c.px(0, y + 2, GW, 1, '#7e7a70');
    });
    // one rider arriving late
    rider(c, 70, 47, '#ffd23f', 'ride');
    palm(c, 4, 44, 14);
  },

  pier(c) {
    c.bands(0, [[10, '#8ec9ee'], [8, '#b3dcf3'], [6, '#e2f1f7']]);
    c.ridge(26, 6, 23, '#8aa6a0', 26);
    c.bands(24, [[8, '#2b82bf'], [10, '#3b97cf'], [14, '#56acd9']]);
    glints(c, 26, 50, 16, '#ffffff');
    // pier from lower-left to horizon
    for (let x = 0; x < 70; x++) {
      const y = 46 - Math.round(x * 0.22);
      const thick = Math.max(1, 3 - Math.floor(x / 25));
      c.px(x, y, 1, thick, '#8b5e3c');
      if (x % 5 === 0) c.px(x, y + thick, 1, Math.max(2, 10 - Math.floor(x / 7)), '#5e3f2a');
    }
    c.px(0, 44, 4, 1, '#b07d52');
    c.px(68, 29, 4, 2, '#e8e0d0'); c.px(69, 27, 2, 2, '#e04a3a');
    // fishing lines
    [[18, 42], [34, 38], [50, 35]].forEach(([x, y]) => { c.px(x, y - 4, 1, 4, '#2a2a2a'); c.dot(x, y - 5, '#e9b48a'); for (let i = 1; i < 6; i++) c.dot(x + i, y - 5 + i * 2, '#f2f2f2'); });
    // pelicans
    [[30, 12], [38, 14], [46, 11]].forEach(([x, y]) => { c.px(x, y, 4, 1, '#6b5a4a', 'drift'); c.dot(x + 4, y + 1, '#e0a14a', 'drift'); c.dot(x - 1, y - 1, '#6b5a4a', 'drift'); });
    c.px(0, 56, GW, 8, '#e5cf9c');
    waves(c, 54, '#e8f6ff', 'waves', 12, GW);
    palm(c, 80, 56, 18);
  },

  mountains(c) {
    c.bands(0, [[10, '#3b3f8a'], [8, '#7e5aa8'], [8, '#e38fb0'], [6, '#f7c29b']]);
    c.dot(12, 5, '#ffffff', 'twinkle'); c.dot(30, 3, '#ffffff', 'twinkle'); c.dot(70, 6, '#ffffff', 'twinkle');
    c.ridge(30, 14, 5, '#c97a9a', 64);
    c.ridge(34, 10, 9, '#8e5f86', 64);
    c.ridge(42, 6, 13, '#5b4a70', 64);
    // chaparral hills + town lights
    c.silhouette((x) => 50 + Math.round(Math.sin(x / 6) * 1.5), '#2f3350');
    for (let i = 0; i < 26; i++) c.dot(Math.floor(c.rand() * GW), 52 + Math.floor(c.rand() * 8), '#ffd98a', 'twinkle');
    c.px(0, 60, GW, 4, '#232640');
    palm(c, 12, 60, 18, '#2a2436', '#2a2436', '#322b42');
    palm(c, 20, 61, 13, '#2a2436', '#2a2436', '#322b42');
  },

  fog(c) {
    c.bands(0, [[16, '#c7cdd3'], [10, '#d6dadd'], [6, '#e2e4e4']]);
    c.ridge(28, 5, 3, '#aeb6bb', 34);
    c.bands(32, [[6, '#8fa2ac'], [8, '#9fb0b8'], [8, '#aebcc2']]);
    // foreground bluff and path
    c.silhouette((x) => 50 + Math.round(Math.sin(x / 11) * 2), '#6e7f6a');
    c.px(0, 58, GW, 6, '#8d8a7c');
    palm(c, 70, 54, 22, '#5f6b66', '#6f7e76', '#7d8b83');
    palm(c, 60, 55, 16, '#6c7771', '#7b8982', '#8a978f');
    // a lone walker with coffee
    c.px(28, 51, 2, 5, '#b24a3a'); c.px(28, 49, 2, 2, '#e9b48a'); c.px(28, 56, 1, 2, '#3a3a44'); c.px(29, 56, 1, 2, '#3a3a44'); c.dot(30, 52, '#ffffff');
    // fog bands drift
    for (let y = 18; y < 56; y += 7) {
      for (let x = -10; x < GW + 10; x += 22) c.px(x + (y % 11), y, 16, 2, '#f4f5f5', y % 2 ? 'drift' : 'drift2');
    }
    // sun trying to break through
    c.disc(74, 10, 4, '#f3efe0', 'glow');
  },
};

// ------------------------------------------------------------- the card
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(text, max) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) { lines.push(line.trim()); line = w; } else line += ' ' + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function gem(rarity, x, y) {
  const shapes = {
    common: [[1, 0, 2, 1], [0, 1, 4, 2], [1, 3, 2, 1]],
    uncommon: [[1, 0, 2, 1], [0, 1, 4, 1], [0, 2, 4, 1], [1, 3, 2, 1]],
    rare: [[1, 0, 2, 1], [0, 1, 4, 1], [1, 2, 2, 1], [1, 3, 2, 1]],
    legendary: [[0, 0, 1, 1], [3, 0, 1, 1], [0, 1, 4, 1], [0, 2, 4, 1], [1, 3, 2, 1]],
  };
  return shapes[rarity].map(([dx, dy, w, h]) => `<rect x="${x + dx * 3}" y="${y + dy * 3}" width="${w * 3}" height="${h * 3}" fill="#fff"/>`).join('');
}

const MONO = "ui-monospace, 'SF Mono', Menlo, 'DejaVu Sans Mono', monospace";

function card(series, set, c) {
  const rarity = series.rarities[c.rarity];
  const canvas = new Canvas(c.n * 7919 + set.id.length);
  SCENES[c.scene](canvas);
  const total = set.cards.length;
  const no = `${String(c.n).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
  const flavor = wrap(c.flavor, 42).slice(0, 3);
  const price = `${rarity.priceMutez / 1e6} TEZ`;
  const edition = rarity.cap ? `${rarity.cap} MAX` : 'OPEN';
  const foil = c.rarity === 'legendary' || c.rarity === 'rare';
  const campus = series.campuses.find((x) => x.slug === set.campus);
  const setLabel = `${set.title.toUpperCase()}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges" role="img" aria-labelledby="t d">
<title id="t">${esc(`Campus Cards · ${set.title} · ${no} ${c.title} (${rarity.label})`)}</title>
<desc id="d">${esc(c.flavor + ' ' + series.notice)}</desc>
<style>
.glint{animation:blink 2.4s steps(2) infinite}
.twinkle{animation:blink 3.1s steps(2) infinite .7s}
.waves{animation:slide 3s steps(3) infinite}
.drift{animation:drift 14s linear infinite alternate}
.drift2{animation:drift 19s linear infinite alternate-reverse}
.bob{animation:bob 2.2s steps(2) infinite}
.sway{animation:sway 2.8s steps(2) infinite}
.peck{animation:bob 1.7s steps(2) infinite}
.ride{animation:ride 6s steps(24) infinite}
.ride2{animation:ride 7.5s steps(30) infinite reverse}
.spin{transform-box:fill-box;transform-origin:center;animation:spin 9s steps(36) infinite}
.glow{animation:glow 4s ease-in-out infinite}
.ring{animation:ring 3.2s steps(2) infinite}
.bell{animation:blink 1.6s steps(2) infinite}
.alpen{animation:glow 6s ease-in-out infinite}
.foil{animation:foil 5s linear infinite}
@keyframes blink{50%{opacity:.25}}
@keyframes slide{to{transform:translateX(8px)}}
@keyframes drift{to{transform:translateX(24px)}}
@keyframes bob{50%{transform:translateY(4px)}}
@keyframes sway{50%{transform:translateX(4px)}}
@keyframes ride{from{transform:translateX(-160px)}to{transform:translateX(160px)}}
@keyframes spin{to{transform:rotate(-360deg)}}
@keyframes glow{50%{opacity:.6}}
@keyframes ring{0%,100%{opacity:0}50%{opacity:.9}}
@keyframes foil{from{transform:translateX(-360px)}to{transform:translateX(360px)}}
</style>
<defs>
<clipPath id="art"><rect x="0" y="0" width="${GW * P}" height="${GH * P}"/></clipPath>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${rarity.color}"/><rect x="0" y="0" width="2" height="2" fill="#000" fill-opacity=".18"/></pattern>
</defs>
<rect width="${W}" height="${H}" fill="#12121c"/>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="url(#dots)"/>
<rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="#f7f1e1" stroke="#12121c" stroke-width="3"/>
<rect x="14" y="14" width="${W - 28}" height="44" fill="${set.accent}" stroke="#12121c" stroke-width="3"/>
<text x="26" y="34" font-family="${MONO}" font-size="10" font-weight="700" fill="#ffffff" letter-spacing="1.5">${esc(`CAMPUS CARDS · SET ${set.id.split('-')[1]} · ${campus.name.toUpperCase()}`)}</text>
<text x="26" y="51" font-family="${MONO}" font-size="17" font-weight="700" fill="#ffffff">${esc(c.title)}</text>
<text x="${W - 26}" y="51" font-family="${MONO}" font-size="14" font-weight="700" fill="#ffffff" text-anchor="end">${no}</text>
<rect x="${AX - 3}" y="${AY - 3}" width="${GW * P + 6}" height="${GH * P + 6}" fill="#12121c"/>
<g transform="translate(${AX} ${AY})" clip-path="url(#art)">${canvas.svg()}${foil ? `<rect class="foil" x="0" y="0" width="${GW * P}" height="${GH * P}" fill="url(#sheen)"/>` : ''}</g>
<rect x="${AX - 3}" y="${AY + GH * P + 8}" width="${GW * P + 6}" height="26" fill="${rarity.color}" stroke="#12121c" stroke-width="3"/>
${gem(c.rarity, AX + 6, AY + GH * P + 15)}
<text x="${AX + 24}" y="${AY + GH * P + 26}" font-family="${MONO}" font-size="12" font-weight="700" fill="#ffffff" letter-spacing="2">${rarity.label.toUpperCase()}</text>
<text x="${W - AX - 6}" y="${AY + GH * P + 26}" font-family="${MONO}" font-size="11" font-weight="700" fill="#ffffff" text-anchor="end">${esc(campus.place.toUpperCase())}</text>
${flavor.map((line, i) => `<text x="${AX}" y="${AY + GH * P + 60 + i * 18}" font-family="${MONO}" font-size="13" fill="#2a2a36">${esc(line)}</text>`).join('\n')}
${[['EDITION', edition], ['MINT', price], ['CARD', no]].map(([k, v], i) => { const bw = (GW * P) / 3 - 4; const bx = AX + i * (bw + 6); const by = H - 104; return `<rect x="${bx}" y="${by}" width="${bw}" height="40" fill="#ffffff" stroke="#12121c" stroke-width="2"/><rect x="${bx + 3}" y="${by + 3}" width="${bw - 6}" height="12" fill="${i === 0 ? rarity.color : '#12121c'}"/><text x="${bx + 8}" y="${by + 12}" font-family="${MONO}" font-size="8" font-weight="700" fill="#ffffff" letter-spacing="1.5">${k}</text><text x="${bx + 8}" y="${by + 32}" font-family="${MONO}" font-size="13" font-weight="700" fill="#12121c">${esc(v)}</text>`; }).join('')}
<line x1="${AX}" y1="${H - 50}" x2="${W - AX}" y2="${H - 50}" stroke="#12121c" stroke-width="2" stroke-dasharray="4 4"/>
<text x="${AX}" y="${H - 32}" font-family="${MONO}" font-size="9" font-weight="700" fill="#5a5a66" letter-spacing="1">UNOFFICIAL · PLACES ONLY · CC0 · POINTCAST.XYZ</text>
<text x="${W - AX}" y="${H - 32}" font-family="${MONO}" font-size="9" font-weight="700" fill="#5a5a66" text-anchor="end">TEZOS</text>
</svg>
`;
}

// ------------------------------------------------------------------ main
const sharp = WANT_PNG ? (await import('sharp')).default : null;
let count = 0;
for (const set of DATA.sets) {
  const dir = path.join(ROOT, 'public/images/campus-cards', set.id);
  mkdirSync(dir, { recursive: true });
  for (const c of set.cards) {
    const base = `${String(c.n).padStart(2, '0')}-${c.slug}`;
    const svg = card(DATA, set, c);
    writeFileSync(path.join(dir, `${base}.svg`), svg);
    if (sharp) await sharp(Buffer.from(svg), { density: 216 }).resize(1200, 1680).png({ compressionLevel: 9 }).toFile(path.join(dir, `${base}.png`));
    count++;
  }
}
console.log(`campus-cards: painted ${count} cards${sharp ? ' (+png)' : ''}`);

// Landscape unfurl card for /campus-cards: five cards fanned on the set accent.
if (sharp) {
  const set = DATA.sets[0];
  const picks = [1, 2, 5, 4, 7].map((n) => set.cards.find((c) => c.n === n));
  const tiles = await Promise.all(picks.map((c) => sharp(Buffer.from(card(DATA, set, c)), { density: 144 }).resize(300, 420).png().toBuffer()));
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" shape-rendering="crispEdges"><rect width="1200" height="630" fill="${set.accent}"/>${Array.from({ length: 40 }, (_, i) => `<rect x="0" y="${i * 16}" width="1200" height="2" fill="#000" fill-opacity=".08"/>`).join('')}<rect x="0" y="560" width="1200" height="70" fill="#12121c"/><text x="40" y="604" font-family="${MONO}" font-size="30" font-weight="700" fill="#fff">CAMPUS CARDS · SET 01 · SANTA BARBARA</text><text x="1160" y="604" font-family="${MONO}" font-size="20" font-weight="700" fill="#ffd23f" text-anchor="end">TEZOS · POINTCAST</text></svg>`;
  const x = [40, 265, 450, 635, 860];
  const y = [110, 70, 40, 70, 110];
  await sharp(Buffer.from(bg)).composite(tiles.map((input, i) => ({ input, left: x[i], top: y[i] - 20 }))).png().toFile(path.join(ROOT, 'public/images/campus-cards/og.png'));
  console.log('campus-cards: wrote og.png');
}
