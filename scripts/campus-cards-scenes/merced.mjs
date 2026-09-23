// Campus Cards · Set 06 · Merced — scenes. Unofficial, places only, CC0.
// Set data (titles, rarities, flavor) lives in src/data/campus-cards.json.

const SKIN = ['#e0aa80', '#8a5a3a', '#b07850'];

function person(c, x, y, shirt, skin = SKIN[0], layer) {
  c.px(x, y, 2, 4, shirt, layer); c.px(x, y - 2, 2, 2, skin, layer); c.px(x, y + 4, 1, 2, '#2a2a3a', layer); c.px(x + 1, y + 4, 1, 2, '#2a2a3a', layer);
}

function cow(c, x, y, body, layer, face = 1) {
  // body 7x4, legs, head on one side
  c.px(x, y, 7, 4, body, layer);
  c.px(x + 1, y + 4, 1, 2, body, layer); c.px(x + 5, y + 4, 1, 2, body, layer);
  const hx = face > 0 ? x + 7 : x - 3;
  c.px(hx, y + 1, 3, 3, body, layer);
  c.dot(face > 0 ? hx + 2 : hx, y + 3, '#e8b8a8', layer);
  c.dot(face > 0 ? x - 1 : x + 7, y + 1, body, layer);
}

function oak(c, x, base, r, trunk = '#4a3526', leaf = '#3e5a2a', leaf2 = '#51703a', layer) {
  c.px(x - 1, base - r - 2, 2, r + 2, trunk, layer);
  c.disc(x, base - r - 3, r, leaf, layer);
  c.disc(x - Math.round(r / 2), base - r - 4, Math.max(1, r - 2), leaf2, layer);
  c.disc(x + Math.round(r / 2) + 1, base - r - 2, Math.max(1, r - 3), leaf, layer);
}

export const scenes = {
  // 01 · Lake Yosemite at dawn: low grassy hills round the water, a paddler, geese
  merced_lake(c, { GW, GH, bird, glints }) {
    c.bands(0, [[7, '#3c3f8a'], [6, '#6a5aa8'], [6, '#c47aa8'], [5, '#f39a8a'], [4, '#ffc98a']]);
    c.disc(22, 27, 4, '#fff0b8', 'glow');
    // clouds lit from below
    c.px(46, 9, 18, 2, '#e89ab8', 'drift'); c.px(50, 8, 10, 1, '#f4b8c8', 'drift');
    c.px(8, 14, 14, 1, '#f7b89a', 'drift2');
    // low rolling hills across the lake, gold in the dawn
    c.silhouette((x) => 26 - Math.round(2.5 * Math.sin(x / 8 + 1) + 1.5 * Math.sin(x / 3.3)), '#8a6a5a', 32);
    c.silhouette((x) => 29 - Math.round(1.5 * Math.sin(x / 6 + 2)), '#6a5058', 32);
    // a line of trees + the dam road on the far shore
    for (let x = 58; x < 84; x += 3) c.disc(x, 29, 1 + (x % 2), '#3f4a3a');
    c.px(0, 31, GW, 1, '#b08a78');
    // the water: mirrored sky
    c.bands(32, [[3, '#ffc98a'], [4, '#f39a8a'], [5, '#c47aa8'], [7, '#6a5aa8'], [5, '#3c3f8a']]);
    for (let y = 33; y < 52; y += 2) c.px(19 + (y % 3), y, Math.max(2, 9 - Math.floor((y - 33) / 2)), 1, '#fff0b8', 'glint');
    glints(c, 36, 54, 14, '#f6d8e8');
    // hill reflections, broken by ripple lines
    for (let y = 33; y < 37; y++) for (let x = (y % 2); x < GW; x += 3) c.dot(x, y, '#9a7a78');
    // near shore: grass bank + tules
    c.silhouette((x) => 55 + Math.round(1.5 * Math.sin(x / 7)), '#6a7a3a');
    c.px(0, 59, GW, 5, '#4f5e2a');
    for (let x = 1; x < GW; x += 3) c.px(x, 51 + (x % 4), 1, 5, x % 2 ? '#7a8a44' : '#5a6a30', 'sway');
    c.px(60, 56, 10, 2, '#9a8a6a'); c.px(62, 55, 6, 1, '#b8a888');
    // paddler gliding across
    c.px(36, 46, 11, 1, '#f0b82a', 'ride'); c.px(37, 47, 9, 1, '#c8901a', 'ride');
    c.px(40, 43, 2, 3, '#3f6fd1', 'ride'); c.px(40, 41, 2, 2, SKIN[0], 'ride');
    c.px(37, 42, 1, 1, '#2a2a3a', 'ride'); c.px(38, 43, 6, 1, '#6a4a2e', 'ride'); c.px(44, 44, 1, 1, '#2a2a3a', 'ride');
    // geese in a loose line
    for (let i = 0; i < 5; i++) bird(c, 52 + i * 5, 13 + Math.abs(2 - i), '#2b2b4a', 'drift');
  },

  // 02 · Vernal pools in spring: close, low, rings of bloom round a sky-mirror
  merced_pools(c, { GW, GH }) {
    c.bands(0, [[8, '#6fb6ec'], [6, '#9fd0f2'], [4, '#c8e4f6']]);
    c.px(10, 5, 16, 3, '#ffffff', 'drift'); c.px(14, 3, 8, 2, '#ffffff', 'drift'); c.px(56, 8, 20, 3, '#f4f8fc', 'drift2'); c.px(60, 6, 10, 2, '#ffffff', 'drift2');
    // far faint hills + green grassland
    c.silhouette((x) => 17 - Math.round(Math.sin(x / 10) * 1.2), '#8ab0a8', 19);
    c.px(0, 18, GW, 46, '#6fa84a');
    for (let y = 19; y < GH; y += 3) for (let x = (y % 2) * 2; x < GW; x += 5) c.dot(x, y, '#5a9440');
    // a small far pool
    for (let y = 21; y < 25; y++) { const w = 7 - Math.abs(y - 22.5) * 2; c.px(70 - w, y, w * 2, 1, '#8fc4ec'); }
    for (let x = 60; x < 81; x += 2) c.dot(x, 20 + (x % 3 ? 0 : 5), '#f4d23a');
    // the big pool, drying at the edges: rings out from the water
    const cx = 40; const cy = 44;
    // filled ovals from outside in: white (popcorn flower), yellow (goldfields), mud, water
    const oval = (rx, ry, col) => { for (let y = -ry; y <= ry; y++) { const k = Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))); const l = Math.round(rx * k * (1 + 0.1 * Math.sin(y / 2.1 + 1))); const r = Math.round(rx * k * (1 + 0.14 * Math.sin(y / 3.3 + 4)) + 3 * Math.sin(y / 5)); c.px(cx - l, cy + y, l + r + 1, 1, col); } };
    oval(36, 15, '#f7f4e8');
    oval(33, 13, '#f4d23a');
    oval(28, 11, '#e9b820');
    oval(24, 9, '#8a9a5a');
    oval(21, 8, '#6a8aa8');
    oval(20, 7, '#8fc4ec');
    // speckle the flower rings so they read as flowers not paint
    for (let i = 0; i < 260; i++) {
      const a = c.rand() * Math.PI * 2; const r = 0.72 + c.rand() * 0.3;
      const x = Math.round(cx + Math.cos(a) * 34 * r); const y = Math.round(cy + Math.sin(a) * 14 * r);
      c.dot(x, y, r > 0.9 ? (c.rand() > 0.5 ? '#ffffff' : '#6fa84a') : (c.rand() > 0.6 ? '#fff38a' : '#c89a10'));
    }
        for (let i = 0; i < 40; i++) { const a = c.rand() * Math.PI * 2; c.dot(Math.round(cx + Math.cos(a) * 30), Math.round(cy + Math.sin(a) * 12), '#fffbe0', 'twinkle'); }
    // sky + cloud in the water
    c.px(28, 40, 12, 2, '#ffffff', 'drift'); c.px(31, 39, 6, 1, '#ffffff', 'drift');
    for (let y = 42; y < 50; y += 3) c.px(30 + (y % 4) * 3, y, 4, 1, '#c8e4f6', 'waves');
    // a small wading bird at the waterline
    c.px(56, 46, 3, 2, '#f7f7f7', 'peck'); c.px(58, 43, 1, 3, '#f7f7f7', 'peck'); c.dot(59, 43, '#f0b82a', 'peck'); c.px(57, 48, 1, 3, '#2a2a3a');
    // foreground grass blades
    for (let x = 0; x < GW; x += 2) c.px(x, 60 + (x % 3), 1, 4, x % 4 ? '#4f8a34' : '#3f7a2a', 'sway');
  },

  // 03 · The Sierra on a clear winter morning, seen across wet green grassland
  merced_sierra(c, { GW, GH, bird }) {
    c.bands(0, [[8, '#4a78c0'], [7, '#6e98d4'], [6, '#9ab8e2'], [5, '#e8c0c8'], [4, '#f8dcc0']]);
    // the range: far blue foothills, then the long snowy crest
    c.silhouette((x) => 22 - Math.round(3 * Math.sin(x / 7 + 0.5) + 2 * Math.sin(x / 2.7) + 1.5 * Math.sin(x / 13)), '#8a94c0', 34);
    // snow caps on the crest
    for (let x = 0; x < GW; x++) {
      const t = 22 - Math.round(3 * Math.sin(x / 7 + 0.5) + 2 * Math.sin(x / 2.7) + 1.5 * Math.sin(x / 13));
      if (t < 22) { c.px(x, t, 1, 22 - t + 1, '#f4f2fa'); c.dot(x, t, '#ffd8e0', 'glow'); }
      if (t < 20 && x % 3 === 0) c.px(x, t + 2, 1, 3, '#c8cce8');
    }
    c.silhouette((x) => 29 - Math.round(1.5 * Math.sin(x / 5 + 2) + Math.sin(x / 11)), '#6a7aa8', 34);
    c.silhouette((x) => 32 - Math.round(Math.sin(x / 4 + 1)), '#7a8a78', 35);
    // valley floor, green after rain
    c.px(0, 34, GW, 30, '#5f9a44');
    c.bands(34, [[3, '#86a86a'], [4, '#74a256'], [8, '#62963f'], [17, '#548a36']]);
    // a line of distant farm trees and a barn
    for (let x = 6; x < 40; x += 4) { c.px(x, 33, 2, 3, '#3f5a3a'); c.dot(x + 1, 32, '#4f6a44'); }
    c.px(62, 32, 6, 4, '#a8402e'); c.px(61, 31, 8, 1, '#7a2e22'); c.px(64, 34, 2, 2, '#3a2a22');
    // puddles in the grass reflecting the sky
    c.px(18, 48, 14, 2, '#a8c8ea'); c.px(20, 47, 8, 1, '#c8dcf2'); c.px(50, 54, 18, 2, '#98bce6'); c.px(54, 53, 10, 1, '#bcd4f0');
    c.px(22, 48, 3, 1, '#ffffff', 'glint'); c.px(58, 54, 3, 1, '#ffffff', 'glint');
    // barbed wire fence in the foreground
    for (let x = 3; x < GW; x += 12) { c.px(x, 50, 1, 11, '#6a5040'); c.dot(x, 50, '#8a6a50'); }
    c.px(0, 52, GW, 1, '#5a5048'); c.px(0, 56, GW, 1, '#5a5048');
    for (let x = 1; x < GW; x += 4) { c.dot(x, 51, '#5a5048'); c.dot(x + 2, 55, '#5a5048'); }
    // a hawk on a post, a person stopped to look
    c.px(38, 47, 2, 3, '#6a4a2e'); c.dot(39, 46, '#8a6a4a'); c.px(38, 50, 1, 1, '#6a5040');
    c.px(38, 51, 1, 10, '#6a5040');
    person(c, 72, 55, '#e05a4a', SKIN[1]);
    for (let i = 0; i < 3; i++) bird(c, 20 + i * 8, 10 + (i % 2) * 3, '#2b3a6a', 'drift');
  },

  // 04 · Almond orchard in bloom: rows running to a point, hives at the end of a row
  merced_almonds(c, { GW, GH }) {
    c.bands(0, [[8, '#5aa8e8'], [7, '#86c0ee'], [6, '#b4d8f4'], [4, '#d4e8f6']]);
    const vx = 44; const vy = 24;
    c.silhouette((x) => 22 - Math.round(Math.sin(x / 9) + 0.6 * Math.sin(x / 3.4)), '#a8b4cc', 25);
    // orchard floor: green cover crop, a mown alley down the middle
    c.px(0, vy, GW, GH - vy, '#7aa850');
    for (let y = vy; y < GH; y++) {
      const s = (y - vy) / (GH - vy);
      const w = Math.max(1, Math.round(s * 13));
      c.px(vx - w, y, w * 2, 1, y % 3 ? '#9ac068' : '#a8cc74');
      for (const k of [-1.8, 1.8, -3.0, 3.0]) { const x = Math.round(vx + k * s * 26); const ww = Math.max(1, Math.round(s * 7)); c.px(x - ww, y, ww * 2, 1, '#8a7a50'); }
    }
    // trees, far to near, four rows
    for (let z = 9; z >= 1.15; z -= 0.55) {
      const s = 1 / z;
      const y = Math.round(vy + s * 40);
      const r = Math.max(1, Math.round(s * 9.5));
      for (const k of [-1.8, 1.8, -3.0, 3.0]) {
        const x = Math.round(vx + k * s * 30);
        if (x < -r - 2 || x > GW + r + 2) continue;
        const th = Math.max(1, Math.round(r * 1.1));
        c.px(x, y - th, Math.max(1, Math.round(r / 3)), th + 1, '#3a2a22');
        if (r > 3) { c.px(x - 2, y - th - 1, 1, 2, '#3a2a22'); c.px(x + 2, y - th - 1, 1, 2, '#3a2a22'); }
        const cy = y - th - Math.round(r * 0.6);
        c.disc(x, cy, r, '#f1e6ea');
        if (r > 1) c.disc(x - Math.round(r / 3), cy - Math.round(r / 3), Math.max(1, Math.round(r * 0.6)), '#ffffff');
        if (r > 2) for (let i = 0; i < r * 2; i++) c.dot(x - r + Math.floor(c.rand() * r * 2), cy - r + 1 + Math.floor(c.rand() * r * 2), c.rand() > 0.5 ? '#f4b8c8' : '#e2d6dc');
      }
    }
    // bee boxes stacked at the end of a row
    [[36, 57, '#f4f4f4'], [42, 57, '#6ab8e8'], [36, 53, '#f0d060'], [42, 53, '#f4f4f4']].forEach(([x, y, col]) => { c.px(x, y, 6, 4, col); c.px(x, y, 6, 1, '#c8c0b0'); c.px(x + 2, y + 3, 2, 1, '#2a2a2a'); });
    c.px(35, 61, 14, 1, '#6a8a40');
    for (let i = 0; i < 6; i++) c.dot(38 + i * 3, 49 - (i % 3), '#2a2a1a', i % 2 ? 'bob' : 'sway');
    // petals drifting across
    for (let i = 0; i < 26; i++) c.dot(Math.floor(c.rand() * GW), 4 + Math.floor(c.rand() * 56), c.rand() > 0.4 ? '#ffffff' : '#f7c8d8', i % 2 ? 'drift' : 'drift2');
    // petal carpet in the foreground
    for (let i = 0; i < 50; i++) c.dot(Math.floor(c.rand() * GW), 58 + Math.floor(c.rand() * 6), '#f4ecee');
  },

  // 05 · Tule fog: a country road, fence posts fading, headlights coming slow
  merced_fog(c, { GW, GH }) {
    c.bands(0, [[14, '#b8bcbe'], [12, '#c6c9ca'], [10, '#d2d4d4'], [28, '#c0c2bc']]);
    // road perspective
    for (let y = 30; y < GH; y++) {
      const s = (y - 30) / (GH - 30);
      const w = Math.round(2 + s * 40);
      c.px(44 - w, y, w * 2, 1, s < 0.3 ? '#a8aaa8' : s < 0.6 ? '#8e908e' : '#76787a');
      if (y % 4 < 2 && s > 0.1) c.px(44, y, Math.max(1, Math.round(s * 2)), 1, s < 0.4 ? '#c8c4a0' : '#e8d880');
    }
    // shoulder + grass
    c.silhouette((x) => 30 + Math.round(Math.abs(x - 44) < 3 ? 0 : 0), '#b0b4a8', 36);
    for (let y = 36; y < GH; y++) {
      const s = (y - 30) / (GH - 30); const w = Math.round(2 + s * 40);
      c.px(0, y, 44 - w, 1, y > 50 ? '#7a8468' : '#9aa092'); c.px(44 + w, y, GW, 1, y > 50 ? '#7a8468' : '#9aa092');
    }
    // fence posts marching into nothing, each fainter than the last
    const posts = [[10, 62, 10, '#4a4238'], [20, 52, 7, '#6a645a'], [26, 45, 5, '#8a8680'], [30, 40, 3, '#a4a29c'], [33, 36, 2, '#b4b4ae']];
    posts.forEach(([x, y, h, col]) => { c.px(x, y - h, Math.max(1, Math.round(h / 4)), h, col); c.px(GW - x - 1, y - h, Math.max(1, Math.round(h / 4)), h, col); });
    c.px(0, 55, 12, 1, '#5a544a'); c.px(76, 55, 12, 1, '#5a544a');
    // one bare tree, barely there
    c.px(66, 18, 2, 14, '#aaaca8'); c.px(62, 20, 4, 1, '#aaaca8'); c.px(68, 17, 5, 1, '#aaaca8'); c.px(64, 16, 1, 4, '#aaaca8'); c.px(70, 14, 1, 3, '#aaaca8');
    // headlights far down the road, glowing
    
    c.px(40, 30, 3, 2, '#fffbe0'); c.px(45, 30, 3, 2, '#fffbe0'); c.px(36, 29, 16, 1, '#e8e6d0', 'glow'); c.px(34, 32, 20, 1, '#e8e6d0', 'glow');
    // fog banks rolling across in two layers
    for (let y = 4; y < 62; y += 6) for (let x = -40; x < GW; x += 56) c.px(x + (y % 11) * 4, y, 44, 2, y < 14 ? '#c4c7c8' : y < 26 ? '#d0d2d2' : y < 36 ? '#dadcdc' : '#cfd1cc', y % 4 ? 'drift' : 'drift2');
    c.px(0, 34, GW, 2, '#dcdedd', 'drift2');
  },

  // 06 · Cattle on the range: golden late-spring grass, low rolling land, an afternoon sky
  merced_cattle(c, { GW, GH, bird }) {
    c.bands(0, [[10, '#6aaee8'], [8, '#94c6ee'], [10, '#c4def2']]);
    c.px(52, 6, 22, 3, '#ffffff', 'drift'); c.px(56, 4, 12, 2, '#ffffff', 'drift'); c.px(8, 12, 14, 2, '#f4f8fc', 'drift2');
    // gentle swells of grassland
    c.silhouette((x) => 24 - Math.round(2 * Math.sin(x / 11 + 1)), '#c8a860');
    c.silhouette((x) => 30 - Math.round(3 * Math.sin(x / 9 + 3)), '#d8b464');
    c.silhouette((x) => 40 - Math.round(3 * Math.sin(x / 13)), '#e0bc6a');
    c.px(0, 52, GW, 12, '#c89c4a');
    for (let i = 0; i < 140; i++) c.dot(Math.floor(c.rand() * GW), 30 + Math.floor(c.rand() * 34), c.rand() > 0.5 ? '#ecd08a' : '#b88c40');
    // a stock pond + trough
    for (let y = 33; y < 36; y++) { const w = 6 - Math.abs(y - 34) * 2; c.px(20 - w, y, w * 2, 1, '#7ab0d8'); }
    c.px(62, 34, 8, 2, '#8a8a90'); c.px(64, 29, 1, 5, '#5a5048'); c.px(62, 27, 5, 1, '#8a8a90'); c.px(64, 26, 1, 1, '#5a5048', 'spin');
    // a fence line along a far swell
    for (let x = 0; x < GW; x += 5) c.px(x, 27 - Math.round(2 * Math.sin(x / 11 + 1)), 1, 2, '#6a5040');
    // the herd, far to near
    cow(c, 30, 30, '#3a2a22', 'peck', -1);
    cow(c, 46, 32, '#1d1d24', undefined, 1);
    cow(c, 76, 36, '#8a4a2a', 'peck', 1);
    cow(c, 12, 44, '#1d1d24', 'peck', 1);
    cow(c, 50, 48, '#6a3a22', undefined, -1);
    c.px(57, 48, 2, 3, '#f4f0e8'); // white face on the near one
    // a cattle egret or two tagging along
    c.px(60, 53, 2, 2, '#fbfbf6', 'bob'); c.dot(62, 52, '#f0b82a', 'bob'); c.px(22, 49, 2, 2, '#fbfbf6', 'bob');
    // foreground seed heads
    for (let x = 0; x < GW; x += 3) { c.px(x, 58 + (x % 4), 1, 6, '#a88038', 'sway'); c.dot(x, 57 + (x % 4), '#f0d890', 'sway'); }
    bird(c, 70, 10, '#3a2a2a', 'drift');
  },

  // 07 · Shade walks on campus: modern facades, a slatted canopy striping the path
  merced_shade(c, { GW, GH, bike, rider }) {
    c.bands(0, [[6, '#5aa0e8'], [5, '#82bcee']]);
    // buildings: tan panels, deep-set windows, a glass stair tower
    c.px(0, 8, 34, 34, '#dcc6a0'); c.px(0, 8, 34, 2, '#b89c70');
    for (let y = 13; y < 38; y += 7) for (let x = 3; x < 32; x += 7) { c.px(x, y, 5, 4, '#3a5068'); c.px(x, y, 5, 1, '#8aa8c0'); }
    c.px(34, 4, 14, 38, '#6a9ab8'); for (let y = 6; y < 42; y += 4) c.px(34, y, 14, 1, '#4a7898'); c.px(40, 4, 1, 38, '#4a7898');
    c.px(35, 8, 4, 2, '#e8f4ff', 'glint');
    c.px(48, 11, 40, 31, '#e8dcc4'); c.px(48, 11, 40, 2, '#c8b494');
    for (let x = 52; x < GW; x += 6) c.px(x, 15, 2, 24, '#b8a07a'); // vertical sun fins
    for (let x = 54; x < GW; x += 6) c.px(x, 16, 3, 22, '#46607a');
    // solar panels glinting on the far roof
    for (let x = 50; x < 86; x += 5) c.px(x, 9, 4, 2, '#2a3a6a');
    c.px(62, 9, 2, 1, '#bcd8ff', 'glint');
    // the canopy: posts + slats casting stripes
    c.px(0, 0, GW, 2, '#6a7078'); c.px(0, 2, GW, 1, '#8a9098');
    for (let x = 0; x < GW; x += 5) c.px(x, 3, 3, 4 - (x % 2), '#9aa0a8');
    for (let x = 0; x < GW; x += 5) c.px(x, 3, 1, 3, '#6a7078');
    c.px(2, 2, 3, 50, '#8a9098'); c.px(4, 2, 1, 50, '#6a7078'); c.px(82, 2, 3, 50, '#8a9098'); c.px(84, 2, 1, 50, '#6a7078');
    // walkway with striped shade
    c.px(0, 42, GW, 22, '#e2d4b8');
    for (let y = 44; y < GH; y += 4) c.px(0, y, GW, 2, '#b8a888');
    // shade stripes on the ground
    for (let x = -10; x < GW; x += 7) for (let y = 42; y < GH; y++) c.px(x + Math.round((y - 42) / 3), y, 3, 1, '#a89878');
    // drought-tolerant planting bed + a young tree
    c.px(0, 40, GW, 2, '#8a7a5a');
    [[10, '#8a9a5a'], [26, '#a8a860'], [62, '#7a8a4a'], [78, '#9aa860']].forEach(([x, col]) => { c.px(x, 38, 4, 3, col, 'sway'); c.dot(x + 1, 37, '#e8c040', 'sway'); });
    // people keeping to the shade, a bike rolling through
    person(c, 18, 48, '#e05a4a', SKIN[0], 'ride2');
    person(c, 44, 50, '#3fb8a8', SKIN[1], 'ride');
    person(c, 70, 47, '#f0b82a', SKIN[2]);
    person(c, 73, 47, '#8e3fd0', SKIN[0]);
    rider(c, 26, 61, '#3f6fd1', 'ride');
    bike(c, 80, 60, '#e05a4a');
    // heat shimmer above the sunny walk
    c.px(0, 2, GW, 1, '#a8d0f4', 'glow');
  },

  // 08 · The road in: dead straight, poles and a ditch, campus far off on the flat
  merced_road(c, { GW, GH, bird }) {
    c.bands(0, [[7, '#4a88d8'], [7, '#78a8e0'], [6, '#b0c8e6'], [5, '#f0d8b0'], [3, '#f8e4c0']]);
    // the Sierra faint behind the flats
    c.silhouette((x) => 25 - Math.round(1.5 * Math.sin(x / 6) + Math.sin(x / 2.5)), '#b8bcd6', 28);
    // campus on the horizon: a low cluster of pale buildings
    c.px(38, 23, 4, 5, '#e8dcc4'); c.px(42, 21, 5, 7, '#f0e4cc'); c.px(47, 24, 4, 4, '#dccab0'); c.px(43, 22, 3, 1, '#6a9ab8');
    c.dot(44, 21, '#fff6c8', 'twinkle');
    // fields
    c.px(0, 28, GW, 36, '#b89a52');
    for (let y = 29; y < GH; y += 2) { const s = (y - 28) / 36; c.px(0, y, GW, 1, s < 0.4 ? '#c4a860' : '#a8883e'); }
    // green row crop on the right, rows converging
    for (let y = 28; y < GH; y++) { const s = (y - 28) / 36; const edge = Math.round(44 + 3 + s * 30); c.px(edge, y, GW - edge, 1, y % 2 ? '#6a9a3a' : '#5a8a30'); }
    // the road
    for (let y = 28; y < GH; y++) {
      const s = (y - 28) / 36; const w = Math.max(1, Math.round(1 + s * 22));
      c.px(44 - w, y, w * 2, 1, '#5a5a62');
      if (y % 5 < 2) c.px(44, y, Math.max(1, Math.round(s * 2)), 1, '#f0d060');
      c.dot(44 - w, y, '#d8d4c8'); c.dot(44 + w - 1, y, '#d8d4c8');
    }
    // irrigation ditch on the left, catching the sky
    for (let y = 30; y < GH; y++) { const s = (y - 28) / 36; const x = Math.round(44 - 4 - s * 34); c.px(x - Math.round(s * 4), y, Math.max(1, Math.round(s * 4)), 1, '#7ab0d8'); }
    for (let y = 40; y < GH; y += 5) { const s = (y - 28) / 36; c.px(Math.round(44 - 6 - s * 34), y, 2, 1, '#e8f4ff', 'glint'); }
    // telephone poles shrinking toward town
    [[4, 62, 34], [18, 44, 18], [27, 36, 9], [33, 31, 5], [37, 29, 3]].forEach(([x, y, h]) => { c.px(x, y - h, Math.max(1, Math.round(h / 12)), h, '#4a3a2e'); c.px(x - Math.round(h / 8), y - h + 1, Math.round(h / 4) + 1, 1, '#4a3a2e'); });
    for (let x = 4; x < 38; x++) c.dot(x, Math.round(30 + (37 - x) * 0.9) - 2, '#3a3a3a');
    // a car heading in
    c.px(40, 50, 8, 4, '#e05a4a', 'bob'); c.px(41, 48, 6, 2, '#b8d4e8', 'bob'); c.px(40, 54, 2, 1, '#1d1d24', 'bob'); c.px(46, 54, 2, 1, '#1d1d24', 'bob');
    bird(c, 20, 10, '#3a3a4a', 'drift'); bird(c, 66, 6, '#3a3a4a', 'drift2');
  },

  // 09 · Merced River: cottonwood shade, a gravel bar, slow green water, someone wading
  merced_river(c, { GW, GH, waves, glints }) {
    c.bands(0, [[8, '#7ab8ec'], [8, '#a4d0f2'], [12, '#c4e0f4']]);
    // far bank trees in the gap
    c.silhouette((x) => 22 - Math.round(2 * Math.sin(x / 3)), '#6a9a6a', 28, 'base', 28, 60);
    // cottonwood canopy on both banks
    c.silhouette((x) => 4 + Math.round(4 * Math.sin(x / 5) + 3 * Math.sin(x / 2.3)) + (x > 30 && x < 58 ? 8 : 0), '#4a7a3a', 30);
    for (let i = 0; i < 90; i++) { const x = Math.floor(c.rand() * GW); if (x > 32 && x < 56) continue; c.dot(x, 2 + Math.floor(c.rand() * 22), c.rand() > 0.5 ? '#7aa84a' : '#3a6a2e', 'sway'); }
    // pale trunks
    [[8, 3], [22, 2], [64, 3], [80, 2]].forEach(([x, w]) => { c.px(x, 14, w, 18, '#c8c0a8'); c.px(x + w - 1, 14, 1, 18, '#948a74'); c.px(x - 2, 16, 2, 1, '#c8c0a8'); });
    // far bank + water
    c.px(0, 28, GW, 4, '#5a6a3a');
    c.bands(32, [[4, '#4a8a6a'], [6, '#3e7e62'], [8, '#347058']]);
    for (let y = 34; y < 48; y += 5) waves(c, y, '#8ac0a0');
    glints(c, 33, 48, 10, '#e8fff0');
    // canopy reflection
    for (let y = 32; y < 38; y++) for (let x = (y % 2); x < 30; x += 2) c.dot(x, y, '#3a6a4a');
    // gravel bar, near side
    c.silhouette((x) => 48 + Math.round(2 * Math.sin(x / 9 + 1)) - (x > 50 ? Math.round((x - 50) / 8) : 0), '#b8a888');
    for (let i = 0; i < 160; i++) c.dot(Math.floor(c.rand() * GW), 46 + Math.floor(c.rand() * 18), ['#d8ccb0', '#8a7a64', '#a89880', '#6a8aa8'][i % 4]);
    // a person wading, a float tube drifting by
    c.px(44, 38, 2, 4, '#e05a4a'); c.px(44, 36, 2, 2, SKIN[1]); c.px(43, 42, 4, 1, '#8ac0a0', 'waves');
    c.px(20, 40, 7, 3, '#1d1d24', 'ride2'); c.px(22, 41, 3, 1, '#347058', 'ride2'); c.px(22, 38, 2, 2, SKIN[0], 'ride2'); c.px(21, 40, 4, 1, '#f0b82a', 'ride2');
    // towel + sandals on the gravel
    c.px(62, 55, 10, 4, '#3fb8a8'); c.px(62, 56, 10, 1, '#ffffff'); c.px(74, 58, 2, 1, '#e05a4a'); c.px(74, 60, 2, 1, '#e05a4a');
    // cottonwood fluff floating
    for (let i = 0; i < 12; i++) c.dot(8 + Math.floor(c.rand() * 72), 10 + Math.floor(c.rand() * 30), '#ffffff', 'drift');
  },

  // 10 · Big valley sky: a huge summer sunset over flat fields and one farmhouse
  merced_sky(c, { GW, GH, bird }) {
    c.bands(0, [[8, '#2a2e78'], [7, '#4a3e98'], [7, '#7a4aa8'], [7, '#c85a98'], [7, '#ee7a70'], [7, '#f8a458'], [6, '#fcc868'], [5, '#fee6a0']]);
    // long flat streaks of cloud lit underneath
    [[6, 12, 30], [48, 16, 34], [20, 24, 26], [60, 30, 22], [4, 36, 18]].forEach(([x, y, w], i) => { c.px(x, y, w, 1, i < 2 ? '#e87aa8' : '#ffcf80', i % 2 ? 'drift' : 'drift2'); c.px(x + 3, y + 1, w - 6, 1, i < 2 ? '#a84a88' : '#e8905a', i % 2 ? 'drift' : 'drift2'); });
    // sun sitting on the flat line
    c.disc(58, 54, 7, '#fee6a0'); c.disc(58, 54, 5, '#fff4c0');
    c.px(50, 47, 17, 1, '#fff8d8', 'glow');
    // the horizon: dead flat, a farmhouse, a windbreak, a water tank
    c.px(0, 54, GW, 10, '#2a2238');
    c.px(0, 54, GW, 1, '#6a4a58');
    for (let x = 6; x < 28; x += 3) c.disc(x, 53, 2, '#2a2238');
    c.px(32, 49, 7, 5, '#2a2238'); for (let i = 0; i < 4; i++) c.px(31 + i, 49 - i, 9 - i * 2, 1, '#2a2238');
    c.px(34, 51, 1, 1, '#ffd98a', 'twinkle');
    c.px(76, 46, 4, 3, '#2a2238'); c.px(77, 49, 1, 5, '#2a2238'); c.px(79, 49, 1, 5, '#2a2238');
    // rows of the field running toward you
    for (let y = 56; y < GH; y += 2) c.px(0, y, GW, 1, '#3a2e48');
    for (let x = 2; x < GW; x += 6) c.px(x + Math.round((x - 44) / 8), 58, 1, 6, '#4a3a58');
    for (let i = 0; i < 5; i++) bird(c, 16 + i * 4, 30 + (i % 2), '#1d1a30', 'drift');
    c.dot(80, 4, '#ffffff', 'twinkle'); c.dot(12, 3, '#ffffff', 'twinkle');
  },

  // 11 · Toward Yosemite: the highway climbing into oak foothills, granite in the haze
  merced_foothills(c, { GW, GH }) {
    c.bands(0, [[9, '#5a9ee8'], [7, '#84b8ec'], [6, '#b0d2f0']]);
    // far granite walls and domes, blue with distance
    c.silhouette((x) => 20 - Math.round(x > 50 && x < 70 ? 6 * Math.sin(((x - 50) / 20) * Math.PI) : 2 * Math.sin(x / 6)), '#a8b4cc');
    c.silhouette((x) => (x > 54 && x < 66 ? 17 - Math.round(4 * Math.sin(((x - 54) / 12) * Math.PI)) : 40), '#c4ccdc', 30);
    // snow patches
    c.px(58, 13, 4, 1, '#f4f6fa'); c.px(22, 17, 3, 1, '#f4f6fa');
    // blue-green foothills, then golden oak hills
    c.silhouette((x) => 27 - Math.round(3 * Math.sin(x / 7 + 1) + Math.sin(x / 3)), '#7a8a8a');
    c.silhouette((x) => 34 - Math.round(4 * Math.sin(x / 9 + 2)), '#b89a58');
    c.silhouette((x) => 42 - Math.round(3 * Math.sin(x / 6 + 4)), '#caa862');
    c.px(0, 52, GW, 12, '#d4b06a');
    // dark round oaks dotted on the hills
    [[6, 36, 2], [14, 33, 2], [30, 31, 1], [70, 30, 2], [80, 34, 2], [8, 46, 3], [72, 44, 3], [82, 50, 4]].forEach(([x, y, r]) => oak(c, x, y, r, '#3a2a22', '#4a5a2a', '#5e7036'));
    // the road winding up
    const road = (y) => Math.round(44 + 18 * Math.sin((y - 24) / 7) * ((y - 24) / 40));
    for (let y = 30; y < GH; y++) {
      const w = Math.max(1, Math.round((y - 28) / 4));
      const x = road(y);
      c.px(x - w, y, w * 2, 1, '#5a5a62');
      if (y % 4 === 0 && w > 1) c.dot(x, y, '#f0d060');
    }
    // a car climbing, a pullout sign
    c.px(road(46) - 3, 43, 6, 3, '#3f6fd1', 'bob'); c.px(road(46) - 2, 42, 4, 1, '#b8d4e8', 'bob');
    c.px(16, 54, 1, 6, '#5a5048'); c.px(13, 50, 7, 4, '#3a7a4a'); c.px(14, 51, 5, 1, '#ffffff'); c.px(14, 52, 3, 1, '#ffffff');
    // dry grass flicker in the foreground
    for (let x = 1; x < GW; x += 4) c.px(x, 59 + (x % 3), 1, 5, '#a88840', 'sway');
    c.px(40, 4, 12, 2, '#ffffff', 'drift'); c.px(43, 3, 6, 1, '#ffffff', 'drift');
  },

  // 12 · Valley stars: night over the fields, a farm light, the Milky Way
  merced_stars(c, { GW, GH }) {
    c.bands(0, [[14, '#0c1030'], [14, '#141a44'], [12, '#1e2656'], [8, '#2a3264']]);
    // the Milky Way, a diagonal haze
    for (let i = 0; i < 26; i++) { const t = i / 26; c.px(Math.round(10 + t * 70), Math.round(4 + t * 36 - Math.sin(t * 3) * 4), 5, 2, '#2c3470'); }
    for (let i = 0; i < 60; i++) { const t = c.rand(); c.dot(Math.round(10 + t * 72 + (c.rand() - 0.5) * 8), Math.round(4 + t * 36 - Math.sin(t * 3) * 4 + (c.rand() - 0.5) * 6), '#9aa4d8'); }
    for (let i = 0; i < 50; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * 44), '#ffffff', i % 3 ? 'twinkle' : 'glint');
    [[14, 8], [70, 12], [40, 6]].forEach(([x, y]) => { c.dot(x, y, '#ffffff'); c.dot(x - 1, y, '#8a94d0'); c.dot(x + 1, y, '#8a94d0'); c.dot(x, y - 1, '#8a94d0'); c.dot(x, y + 1, '#8a94d0'); });
    // a thin glow where town is, off to the west
    c.px(0, 44, 26, 3, '#3a3464'); c.px(0, 46, 16, 2, '#5a4a6a');
    // flat dark land
    c.px(0, 48, GW, 16, '#0e1222');
    c.px(0, 48, GW, 1, '#1a2034');
    // farm: barn, a pole light, a line of trees
    c.px(56, 42, 10, 6, '#161a2c'); for (let i = 0; i < 4; i++) c.px(55 + i, 42 - i, 12 - i * 2, 1, '#161a2c');
    c.px(70, 38, 1, 10, '#161a2c'); c.px(69, 37, 3, 1, '#ffe6a0', 'glow'); c.disc(70, 40, 3, '#3a3860', 'glow');
    c.px(60, 45, 2, 2, '#ffd98a', 'twinkle');
    for (let x = 74; x < GW; x += 3) c.disc(x, 46, 2, '#10142a');
    // crickets and fireflies in the grass
    for (let i = 0; i < 14; i++) c.dot(Math.floor(c.rand() * GW), 50 + Math.floor(c.rand() * 12), '#d8f080', i % 2 ? 'glint' : 'twinkle');
    for (let x = 0; x < GW; x += 3) c.px(x, 58 + (x % 3), 1, 6, '#1a2238', 'sway');
    // two people on a truck tailgate looking up
    c.px(22, 50, 14, 5, '#2a3048'); c.px(22, 49, 14, 1, '#3a4260'); c.px(24, 55, 3, 3, '#0a0a14'); c.px(31, 55, 3, 3, '#0a0a14');
    c.px(24, 45, 2, 4, '#4a5a8a'); c.px(24, 43, 2, 2, '#6a5a60'); c.px(28, 45, 2, 4, '#7a4a6a'); c.px(28, 43, 2, 2, '#5a4a4a');
  },
};
