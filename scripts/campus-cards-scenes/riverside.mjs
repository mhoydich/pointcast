// Campus Cards · Set 07 · Riverside — scenes. Unofficial, places only, CC0.
// Set data (titles, rarities, flavor) lives in src/data/campus-cards.json.

// ---- small local helpers (kept inside the module so names never collide)
function person(c, x, y, shirt, skin = '#e0aa80', layer) {
  c.px(x, y - 5, 2, 4, shirt, layer);
  c.px(x, y - 7, 2, 2, skin, layer);
  c.px(x, y - 1, 1, 1, '#2a2a36', layer); c.px(x + 1, y - 1, 1, 1, '#2a2a36', layer);
}

function orangeTree(c, x, y, r, leaf = '#2f6b32', leaf2 = '#3f8a3e', fruit = '#f28c1a', layer = 'twinkle') {
  c.px(x - 1, y, 2, 3, '#5a3e28');
  c.disc(x, y - r + 1, r, leaf);
  c.disc(x - 1, y - r, Math.max(1, r - 2), leaf2);
  const n = Math.max(3, r * 2);
  for (let i = 0; i < n; i++) {
    const a = c.rand() * Math.PI * 2; const d = c.rand() * (r - 0.6);
    c.dot(x + Math.round(Math.cos(a) * d), y - r + 1 + Math.round(Math.sin(a) * d), fruit, i % 3 ? undefined : layer);
  }
}

function boulder(c, x, y, w, h, fill = '#b89a78', shade = '#8e7458', hi = '#d6bc98') {
  for (let i = 0; i < h; i++) {
    const inset = Math.round(Math.abs(i - h * 0.45) * (w / (h * 2.4)));
    c.px(x + inset, y + i, w - inset * 2, 1, fill);
  }
  c.px(x + Math.round(w * 0.6), y + Math.round(h * 0.35), Math.max(1, Math.round(w * 0.35)), Math.max(1, Math.round(h * 0.6)), shade);
  c.px(x + Math.round(w * 0.25), y + 1, Math.max(1, Math.round(w * 0.3)), 1, hi);
}

function fanPalm(c, x, base, h, lean = 0) {
  // tall skinny fan palm; fronds stream downwind when it leans
  for (let i = 0; i < h; i++) c.px(x + Math.round((lean * i) / h), base - i, 2, 1, i % 4 ? '#7a5a3a' : '#5e442c');
  const tx = x + lean; const ty = base - h;
  c.px(tx - 1, ty + 1, 3, 4, '#8a6a42'); c.px(tx - 1, ty + 5, 2, 2, '#9a7a4a');
  const w = Math.sign(lean);
  const fr = ['#2f7a3a', '#3f9a4a', '#256a30'];
  [[-5, 0], [-4, -3], [-1, -4], [2, -4], [5, -2], [6, 1], [4, 3], [-3, 3]].forEach(([dx, dy], i) => {
    const ex = dx + w * 3; const ey = dy + 1;
    const n = Math.max(Math.abs(ex), Math.abs(ey));
    for (let s = 1; s <= n; s++) c.dot(tx + Math.round((ex * s) / n), ty + Math.round((ey * s) / n) + (s === n ? 1 : 0), fr[i % 3]);
  });
  c.px(tx - 1, ty - 1, 3, 2, '#2f7a3a');
}

export const scenes = {
  // 01 · legendary · the carillon tower at dusk on a hot evening
  riverside_belltower(c, { GW, GH, palm, bird }) {
    c.bands(0, [[8, '#3a2466'], [8, '#6a2f7a'], [8, '#b8457a'], [8, '#ec6a4a'], [7, '#f79a3a'], [6, '#ffc85a']]);
    c.dot(10, 3, '#ffffff', 'twinkle'); c.dot(76, 5, '#ffffff', 'twinkle'); c.dot(64, 2, '#ffffff', 'twinkle');
    // Box Springs silhouette behind campus
    c.ridge(42, 7, 71, '#6a3a4a', 64);
    c.ridge(46, 4, 72, '#4a2a3e', 64);
    // campus canopy and low buildings
    c.silhouette((x) => 49 - Math.round(2 * Math.sin(x / 4.5) + (x % 14 < 5 ? 2 : 0)), '#2a3a2a');
    for (let x = 3; x < GW; x += 19) { if (x > 30 && x < 56) continue; c.px(x, 49, 12, 7, '#c9b48e'); c.px(x, 48, 12, 1, '#8e6a4a'); for (let wx = x + 2; wx < x + 11; wx += 3) c.px(wx, 51, 2, 2, '#ffd98a', 'twinkle'); }
    // lawn
    c.px(0, 56, GW, 8, '#3f6a32');
    for (let x = 0; x < GW; x += 4) c.px(x, 58 + (x % 3), 2, 1, '#4f7e3c');
    // tower: tapered concrete shaft with ribs, open bell cage, slender top
    const cx = 44;
    for (let y = 22; y < 57; y++) {
      const half = 4 + Math.round((y - 22) / 12);
      c.px(cx - half, y, half * 2 + 1, 1, '#e8dcc6');
      c.px(cx + half - 1, y, 2, 1, '#bfae92');
      c.dot(cx - 1, y, '#d6c8ae'); c.dot(cx + 2, y, '#d6c8ae');
    }
    // cage frame
    c.px(cx - 6, 10, 13, 12, '#2a1e3a');
    c.px(cx - 6, 10, 2, 12, '#e8dcc6'); c.px(cx + 5, 10, 2, 12, '#bfae92'); c.px(cx - 1, 10, 2, 12, '#d6c8ae');
    c.px(cx - 7, 21, 15, 2, '#e8dcc6'); c.px(cx - 7, 9, 15, 2, '#e8dcc6'); c.px(cx - 7, 15, 15, 1, '#cfc0a4');
    // bells hanging in the cage
    [[cx - 3, 12], [cx + 3, 12], [cx - 3, 17], [cx + 3, 17]].forEach(([x, y]) => { c.px(x - 1, y, 2, 1, '#c9973a'); c.px(x - 1, y + 1, 3, 2, '#e0b04a'); c.dot(x, y + 1, '#fff0b0', 'bell'); });
    // top
    for (let i = 0; i < 6; i++) c.px(cx - 5 + i, 8 - i, 11 - i * 2, 1, i % 2 ? '#d6c8ae' : '#e8dcc6');
    c.px(cx, 0, 1, 3, '#bfae92');
    // ring marks
    [[cx - 12, 13], [cx + 12, 13]].forEach(([x, y]) => { c.px(x, y, 1, 3, '#ffe7a8', 'ring'); c.px(x + (x < cx ? -2 : 2), y - 1, 1, 5, '#ffe7a8', 'ring'); });
    palm(c, 14, 57, 16, '#5e442c', '#1f4a2a', '#2e6a3a'); palm(c, 74, 57, 18, '#5e442c', '#1f4a2a', '#2e6a3a'); palm(c, 82, 58, 12, '#5e442c', '#1f4a2a', '#2e6a3a');
    person(c, 30, 61, '#f0b82a', '#8a5a3a', 'ride'); person(c, 58, 62, '#3f6fd1', '#e0aa80', 'ride2');
    for (let i = 0; i < 3; i++) bird(c, 60 + i * 6, 6 + (i % 2) * 2, '#2a1a3a', 'drift');
  },

  // 02 · rare · rows of citrus in morning light, hills behind
  riverside_citrus(c, { GW, GH, bird }) {
    c.bands(0, [[8, '#7fc4ee'], [6, '#a6d6f2'], [6, '#d4ecf4'], [4, '#f6ecd0']]);
    c.disc(72, 9, 4, '#fff6c8');
    c.ridge(22, 6, 21, '#a88a78', 34);
    c.ridge(25, 4, 22, '#8e7462', 34);
    for (let i = 0; i < 12; i++) c.dot(Math.floor(c.rand() * GW), 18 + Math.floor(c.rand() * 8), '#c9ad90');
    // grove floor with furrows between rows
    c.px(0, 26, GW, 38, '#c09a6a');
    // rows run across the frame, small far away, big up close
    const rows = [[30, 2, 7, 0], [37, 3, 10, 4], [46, 5, 14, 2], [60, 8, 20, 9]];
    rows.forEach(([y, r, sp, off], ri) => {
      c.px(0, y + 1, GW, Math.max(1, Math.round(r / 2)), '#a8825a');
      for (let x = -sp + off; x < GW + sp; x += sp) orangeTree(c, x, y, r, ri % 2 ? '#2a6230' : '#2f6b32', '#3f8a3e', (x + ri) % 3 === 0 ? '#f4d23a' : '#f28c1a');
    });
    // sprinkler mist between rows + a picker with a crate
    for (let i = 0; i < 14; i++) c.dot(Math.floor(c.rand() * GW), 48 + Math.floor(c.rand() * 3), '#e8f6ff', 'glint');
    person(c, 44, 52, '#3f6fd1', '#8a5a3a');
    c.px(47, 49, 4, 3, '#b07a3a'); c.px(47, 48, 4, 1, '#f28c1a');
    bird(c, 20, 8, '#3a3a4a', 'drift'); bird(c, 27, 5, '#3a3a4a', 'drift');
  },

  // 03 · rare · the old hotel downtown at night, strung with lights
  riverside_missioninn(c, { GW, GH, palm }) {
    c.bands(0, [[10, '#0e1234'], [10, '#1a1e4e'], [36, '#2a2a66']]);
    for (let i = 0; i < 14; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * 16), '#ffffff', 'twinkle');
    c.disc(10, 7, 3, '#f4f1dc');
    const wall = '#e2c9a0'; const shade = '#b89a70'; const roof = '#b4523a';
    // left wing with arcade
    c.px(0, 30, 34, 26, wall); c.px(0, 28, 34, 2, roof);
    for (let x = 2; x < 32; x += 6) { c.px(x, 44, 4, 12, '#3a2a2a'); c.px(x + 1, 43, 2, 1, '#3a2a2a'); c.px(x, 34, 3, 4, '#ffcf6a'); }
    // bell wall (campanario) with arched openings and bells
    c.px(34, 18, 20, 38, wall); c.px(52, 18, 2, 38, shade);
    c.px(36, 16, 16, 2, wall); c.px(39, 14, 10, 2, wall); c.px(42, 12, 4, 2, wall);
    [[37, 20], [43, 20], [48, 20], [40, 27], [46, 27]].forEach(([x, y]) => { c.px(x, y, 3, 4, '#1a1430'); c.dot(x + 1, y, '#1a1430'); c.px(x + 1, y + 2, 1, 2, '#e0b04a'); });
    c.px(40, 44, 8, 12, '#3a2a2a'); c.px(41, 43, 6, 1, '#3a2a2a'); c.px(42, 42, 4, 1, '#3a2a2a');
    // dome tower right
    c.px(56, 26, 16, 30, wall); c.px(70, 26, 2, 30, shade);
    c.px(58, 18, 12, 8, wall); c.px(68, 18, 2, 8, shade);
    c.disc(64, 16, 5, '#c8943a'); c.px(58, 17, 13, 5, wall); c.disc(64, 14, 4, '#d8a44a');
    c.px(64, 7, 1, 4, '#8a6a3a');
    for (let x = 58; x < 70; x += 4) c.px(x, 30, 2, 4, '#ffcf6a');
    for (let x = 58; x < 70; x += 4) c.px(x, 40, 2, 4, '#ffcf6a');
    // right wing
    c.px(72, 32, 16, 24, wall); c.px(72, 30, 16, 2, roof);
    for (let x = 74; x < 88; x += 5) c.px(x, 36, 2, 3, '#ffcf6a');
    // sidewalk + street
    c.px(0, 56, GW, 3, '#8a8478'); c.px(0, 59, GW, 5, '#3a3a44');
    // string lights along every roofline
    const lines = [[0, 28, 34], [34, 15, 20], [56, 25, 16], [72, 29, 16], [0, 42, 34], [56, 38, 16]];
    lines.forEach(([x0, y, w], i) => { for (let x = x0; x < x0 + w; x += 2) c.dot(x, y + ((x / 2) % 2), ['#ffe39a', '#ff6a6a', '#8affc8', '#9ac8ff'][(x + i) % 4], (x / 2) % 2 ? 'twinkle' : 'glint'); });
    palm(c, 28, 56, 20, '#4a3526', '#1a3a2a', '#244a34'); palm(c, 80, 57, 22, '#4a3526', '#1a3a2a', '#244a34');
    person(c, 12, 58, '#e05a4a', '#e0aa80', 'ride'); person(c, 16, 58, '#3f6fd1', '#8a5a3a', 'ride');
  },

  // 04 · uncommon · boulder hills behind campus, midday, hikers on the trail
  riverside_boxsprings(c, { GW, GH, bird }) {
    c.bands(0, [[8, '#5aa8e8'], [7, '#86c2f0'], [5, '#b8dcf4'], [10, '#d4ecf8']]);
    // far ridge + near slope
    c.ridge(22, 8, 41, '#b48a6a', 64);
    c.silhouette((x) => 30 + Math.round(x / 6 - 3 * Math.sin(x / 7)), '#c49a6e');
    c.silhouette((x) => 44 + Math.round(x / 10 - 2 * Math.sin(x / 5)), '#a8804e');
    // scrub
    for (let i = 0; i < 60; i++) { const x = Math.floor(c.rand() * GW); const y = 26 + Math.floor(c.rand() * 36); c.px(x, y, 2, 1, c.rand() > 0.5 ? '#6f7a3a' : '#8a8a4a'); }
    // boulders scattered
    [[8, 36, 8, 5], [22, 40, 6, 4], [60, 30, 7, 5], [74, 36, 10, 6], [50, 48, 9, 6], [4, 52, 12, 8], [70, 52, 14, 9], [36, 24, 5, 3], [80, 22, 5, 3]].forEach(([x, y, w, h]) => boulder(c, x, y, w, h));
    // switchback trail
    const pts = [[20, 63], [58, 54], [30, 46], [62, 38], [40, 30], [56, 24]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= n; s++) c.px(Math.round(x0 + ((x1 - x0) * s) / n), Math.round(y0 + ((y1 - y0) * s) / n), 2, 1, '#e4c89c');
    }
    person(c, 44, 51, '#e05a4a', '#e0aa80', 'bob'); person(c, 47, 51, '#3fb8a8', '#8a5a3a', 'bob');
    person(c, 52, 36, '#f0b82a', '#b07850');
    // hawk circling
    c.px(24, 10, 5, 1, '#3a2a22', 'drift'); c.px(26, 9, 1, 2, '#3a2a22', 'drift');
    bird(c, 66, 7, '#3a2a22', 'drift2');
  },

  // 05 · uncommon · close on desert plants along a garden path
  riverside_botanic(c, { GW, GH }) {
    c.bands(0, [[10, '#6ab8f0'], [8, '#9ad0f4'], [6, '#c4e2f6']]);
    c.ridge(22, 5, 51, '#a89a82', 30);
    c.px(0, 22, GW, 42, '#d4b88a');
    for (let i = 0; i < 80; i++) c.dot(Math.floor(c.rand() * GW), 22 + Math.floor(c.rand() * 42), c.rand() > 0.5 ? '#c4a676' : '#e2caa0');
    // sage mounds + shade trees in the back
    [[8, 26, 6], [30, 25, 5], [70, 26, 7], [52, 24, 4]].forEach(([x, y, r]) => { c.disc(x, y, r, '#7a8a5a'); c.disc(x - 1, y - 1, r - 2, '#94a46e'); });
    // winding path
    for (let y = 30; y < GH; y++) { const cx = 46 + Math.round(10 * Math.sin(y / 8)); const w = 3 + Math.round((y - 30) / 5); c.px(cx - w, y, w * 2, 1, '#ecdcb6'); }
    // a clump of columnar cactus, left
    [[8, 36, 4], [13, 30, 5], [19, 40, 3]].forEach(([x, y, w]) => {
      c.px(x, y, w, 60 - y, '#3f7a3a'); c.px(x + w - 1, y, 1, 60 - y, '#2f5e2e'); c.px(x, y - 1, w, 1, '#4f8a44');
      for (let yy = y + 2; yy < 60; yy += 3) c.dot(x + 1, yy, '#6aa45a');
    });
    c.px(14, 28, 3, 2, '#ffd23f', 'glow');
    // round barrel cacti
    [[26, 58, 3], [31, 59, 2]].forEach(([x, y, r]) => { c.disc(x, y, r, '#5a9a4a'); c.dot(x, y - r, '#ffd23f'); });
    // agave rosette right
    const ax = 70; const ay = 56;
    [[-9, -2], [-7, -5], [-4, -8], [0, -10], [4, -8], [7, -5], [9, -2]].forEach(([dx, dy]) => {
      const n = Math.max(Math.abs(dx), Math.abs(dy));
      for (let s = 0; s <= n; s++) c.px(ax + Math.round((dx * s) / n), ay + Math.round((dy * s) / n), 2, 1, s > n - 2 ? '#8ab0a0' : '#5a8a7a');
    });
    c.px(ax - 3, ay - 1, 7, 3, '#4a7a6a');
    // prickly pear with fruit, front center-left
    [[28, 54, 4], [33, 50, 3], [24, 50, 3], [30, 46, 2]].forEach(([x, y, r]) => c.disc(x, y, r, '#5a9a4a'));
    [[27, 47], [34, 47], [22, 48], [31, 43]].forEach(([x, y]) => c.dot(x, y, '#d8406a'));
    // flowering shrub + hummingbird working it
    c.disc(64, 34, 6, '#6a8a4a'); c.disc(62, 32, 4, '#7a9a54');
    for (let i = 0; i < 14; i++) c.dot(59 + Math.floor(c.rand() * 11), 29 + Math.floor(c.rand() * 9), ['#ff6a9a', '#ffd23f', '#c86aff'][i % 3], i % 2 ? 'twinkle' : undefined);
    c.px(54, 30, 3, 2, '#3aa878', 'bob'); c.px(57, 30, 2, 1, '#1d1d2b', 'bob'); c.dot(54, 29, '#9ae8c8', 'bob'); c.dot(55, 32, '#c8406a', 'bob'); c.dot(53, 28, '#9ae8c8', 'bob');
    person(c, 44, 42, '#8e3fd0', '#e0aa80', 'ride2');
  },

  // 06 · uncommon · sunrise from the granite top, town in the haze below
  riverside_rubidoux(c, { GW, GH, palm, bird }) {
    c.bands(0, [[7, '#4a5aa8'], [6, '#8a6ab8'], [6, '#e88a9a'], [6, '#f8b87a'], [7, '#ffe0a0']]);
    c.disc(60, 21, 5, '#fff2b8');
    for (let y = 16; y < 27; y += 2) c.px(60 - (y % 4), y, 1, 1, '#fff8d8', 'glow');
    // haze layers and distant mountains
    c.ridge(32, 3, 61, '#b08aa0', 40);
    c.px(0, 32, GW, 8, '#d8b0a8');
    for (let x = -10; x < GW; x += 30) c.px(x, 34, 16, 1, '#e6c4b4', 'drift');
    // town grid in the valley
    c.px(0, 38, GW, 20, '#9a8a8a');
    for (let i = 0; i < 40; i++) { const x = Math.floor(c.rand() * GW); const y = 38 + Math.floor(c.rand() * 7); c.px(x, y, 2, 1, c.rand() > 0.5 ? '#c8b8a8' : '#6a7a5a'); }
    for (let x = 4; x < GW; x += 9) palm(c, x, 44, 4, '#5a4a4a', '#4a5a4a', '#5a6a54');
    // river line
    for (let x = 0; x < GW; x++) c.dot(x, 44 + Math.round(Math.sin(x / 9)), '#8ab0c8');
    // granite summit foreground
    c.silhouette((x) => 48 + Math.round(3 * Math.sin(x / 6) + (x > 60 ? (x - 60) / 6 : 0)), '#8e7c6a');
    [[0, 44, 16, 12], [14, 50, 10, 7], [62, 48, 12, 8], [74, 44, 14, 12], [34, 54, 8, 5]].forEach(([x, y, w, h]) => boulder(c, x, y, w, h, '#b8a490', '#8a7866', '#d8c8b0'));
    c.px(0, 58, GW, 6, '#8a7866');
    // stone path to the top + walkers stopping for the view
    for (let x = 18; x < 64; x += 3) c.px(x, 56 + Math.round(Math.sin(x / 5)), 2, 1, '#d8c8b0');
    person(c, 40, 55, '#e05a4a', '#8a5a3a'); person(c, 44, 55, '#f0b82a', '#e0aa80');
    person(c, 26, 58, '#3f6fd1', '#b07850', 'ride');
    for (let i = 0; i < 3; i++) bird(c, 20 + i * 5, 12 + (i % 2), '#3a2a4a', 'drift');
  },

  // 07 · common · the palm parkway in one-point perspective, early morning
  riverside_victoria(c, { GW, GH, rider }) {
    c.bands(0, [[8, '#8ac8f0'], [6, '#b6dcf2'], [10, '#f2e2c4']]);
    c.ridge(22, 3, 81, '#a8a0b8', 26);
    // groves on both sides
    c.px(0, 24, GW, 40, '#3f7a3a');
    for (let i = 0; i < 90; i++) c.dot(Math.floor(c.rand() * GW), 24 + Math.floor(c.rand() * 40), c.rand() > 0.7 ? '#f28c1a' : '#2f6232');
    // road wedge + median
    const vx = 44; const vy = 24;
    for (let y = vy; y < GH; y++) {
      const t = (y - vy) / (GH - vy);
      const half = Math.round(2 + 36 * t);
      c.px(vx - half, y, half * 2, 1, '#8a8a8e');
      c.px(vx - Math.round(half * 0.12), y, Math.max(1, Math.round(half * 0.24)), 1, '#6a9a4a');
      c.dot(vx - half, y, '#d8d0bc'); c.dot(vx + half - 1, y, '#d8d0bc');
    }
    // palms marching toward the vanishing point, both edges
    const steps = [0.08, 0.16, 0.27, 0.42, 0.62, 0.9];
    steps.forEach((t) => {
      const y = vy + Math.round(t * (GH - vy));
      const off = Math.round(3 + 40 * t);
      const h = Math.round(4 + 44 * t);
      [vx - off, vx + off].forEach((x) => {
        const w = t > 0.5 ? 2 : 1;
        c.px(x, y - h, w, h, '#7a5a3a');
        const r = Math.max(1, Math.round(1 + 5 * t));
        for (let k = -r; k <= r; k++) { c.dot(x + k, y - h + Math.round(Math.abs(k) * 0.5), '#2f7a3a'); c.dot(x + k, y - h - 1 + Math.round(Math.abs(k) * 0.3), '#3f9a4a'); }
        if (t > 0.3) c.px(x - 1, y - h + 1, w + 2, Math.round(2 + 3 * t), '#8a6a42');
      });
    });
    rider(c, 30, 60, '#e05a4a', 'ride'); rider(c, 50, 56, '#3fb8a8', 'ride2');
  },

  // 08 · common · wind day: leaning palms, blowing dust, knife-blue sky
  riverside_santaana(c, { GW, GH }) {
    c.bands(0, [[10, '#1a5ad8'], [10, '#2a74e8'], [8, '#4a94f0'], [8, '#6aacf4']]);
    // crisp far mountains with a dusting of snow
    c.ridge(30, 10, 91, '#5a6a9a', 42);
    for (let x = 0; x < GW; x++) { const t = 30 - 10 * (0.55 * Math.sin(x / 9) + 0.3 * Math.sin(x / 4.3) + 0.15 * Math.sin(x / 1.9) + 0.5); if (t < 23) c.dot(x, Math.round(t), '#f2f6ff'); }
    // brown foothills and a flat of dry grass
    c.ridge(40, 5, 92, '#b0885a', 64);
    c.px(0, 48, GW, 16, '#d4b070');
    for (let x = 0; x < GW; x += 2) c.px(x, 48 + (x % 5), 1, 2, '#bf9a5a', 'sway');
    // leaning fan palms
    [[14, 58, 34], [30, 60, 42], [62, 59, 30], [76, 61, 38]].forEach(([x, b, h]) => fanPalm(c, x, b, h, 6));
    // dust and tumbling leaves
    for (let y = 36; y < 62; y += 4) c.px(-10 + (y * 7) % 40, y, 22, 1, '#e8cfa0', y % 8 ? 'drift' : 'drift2');
    for (let i = 0; i < 14; i++) c.dot(Math.floor(c.rand() * GW), 20 + Math.floor(c.rand() * 40), i % 2 ? '#c89a3a' : '#8a6a3a', 'drift2');
    // a tumbleweed
    c.disc(46, 58, 2, '#a8864a', 'ride'); c.dot(45, 57, '#c8a86a', 'ride'); c.dot(47, 59, '#7a5a32', 'ride');
  },

  // 09 · common · white-hot afternoon on a lawn, sprinkler and a shade tree
  riverside_summer(c, { GW, GH }) {
    c.bands(0, [[8, '#f8f0c8'], [8, '#fce8a8'], [8, '#f8d890'], [12, '#f0c880']]);
    c.disc(18, 10, 7, '#ffffff'); c.disc(18, 10, 5, '#fffbe8');
    // hazy hills, bleached
    c.ridge(32, 5, 101, '#d8b8a0', 40);
    // heat shimmer bands (glow)
    for (let y = 29; y < 36; y += 3) for (let x = 32 + (y % 4) * 4; x < GW; x += 16) c.px(x, y, 4, 1, '#fff4d0', 'glow');
    // lawn
    c.px(0, 36, GW, 28, '#6aa840');
    for (let y = 38; y < GH; y += 5) c.px(0, y, GW, 2, '#78b84c');
    // dry patch
    // big shade tree right with a shadow pool
    c.px(0, 50, 30, 6, '#3f7a2e');
    c.px(12, 34, 3, 18, '#5a3e28');
    c.disc(13, 28, 10, '#2f6a2e'); c.disc(10, 25, 6, '#3f8a3a'); c.disc(18, 26, 5, '#3a7a34');
    person(c, 8, 54, '#3f6fd1', '#8a5a3a'); c.px(10, 52, 3, 2, '#ffffff');
    person(c, 19, 55, '#ff8fc4', '#e0aa80');
    // sprinkler arc
    const sx = 52; const sy = 52;
    c.px(sx, sy, 2, 2, '#4a4a54');
    for (let k = 0; k < 18; k++) { const a = Math.PI * (k / 17); c.dot(sx + Math.round(Math.cos(a) * 14), sy - Math.round(Math.sin(a) * 9), '#e8f8ff', k % 2 ? 'glint' : 'twinkle'); }
    for (let k = 0; k < 10; k++) c.dot(sx - 12 + Math.floor(c.rand() * 26), sy - 2 + Math.floor(c.rand() * 6), '#bfe8ff', 'glint');
    // kid running through it
    person(c, 44, 58, '#f0b82a', '#b07850', 'bob');
  },

  // 10 · common · inside the packing house: crates, conveyor, generic painted labels
  riverside_packing(c, { GW, GH }) {
    c.px(0, 0, GW, GH, '#4a3226');
    // roof trusses + skylight
    c.px(0, 0, GW, 4, '#2e1e16');
    for (let x = 0; x < GW; x += 11) { c.px(x, 0, 2, 14, '#6a4a32'); for (let s = 0; s < 10; s++) c.dot(x + 2 + s, 3 + Math.round(s * 0.9), '#6a4a32'); }
    c.px(30, 0, 28, 3, '#f8e0a0', 'glow');
    for (let y = 3; y < 40; y += 2) for (let x = 32 + Math.floor(y / 3) + (y % 4); x < 56 + Math.floor(y / 3); x += 4) c.dot(x, y, '#d8a870', 'glow');
    // back wall planks
    c.px(0, 14, GW, 26, '#8a5e3c');
    for (let y = 16; y < 40; y += 3) c.px(0, y, GW, 1, '#7a5034');
    // stacks of crates with generic labels (sun over groves; no real brands)
    const crate = (x, y) => {
      c.px(x, y, 10, 6, '#c8965a'); c.px(x, y, 10, 1, '#a87a44'); c.px(x, y + 5, 10, 1, '#a87a44');
      c.px(x + 2, y + 1, 6, 4, '#2a5aa8'); c.px(x + 2, y + 3, 6, 2, '#3f8a3e'); c.dot(x + 5, y + 2, '#ffd23f'); c.dot(x + 3, y + 3, '#f28c1a'); c.dot(x + 6, y + 4, '#f28c1a');
    };
    [[2, 34], [12, 34], [2, 28], [12, 28], [7, 22], [66, 34], [76, 34], [66, 28], [76, 28], [71, 22], [76, 22]].forEach(([x, y]) => crate(x, y));
    // floor
    c.px(0, 40, GW, 24, '#7a6a5a');
    for (let x = 0; x < GW; x += 8) c.px(x, 40, 1, 24, '#6a5a4a');
    // conveyor belt with oranges rolling
    c.px(0, 44, GW, 5, '#3a3a40'); c.px(0, 44, GW, 1, '#8a8a90');
    for (let x = 4; x < GW; x += 10) c.px(x, 49, 2, 6, '#2a2a30');
    for (let x = -20; x < GW + 20; x += 5) c.px(x, 42, 2, 2, x % 3 ? '#f28c1a' : '#f8a83a', 'ride');
    // packers
    person(c, 24, 44, '#e05a4a', '#e0aa80'); person(c, 44, 44, '#f0b82a', '#8a5a3a'); person(c, 62, 44, '#3fb8a8', '#b07850');
    // hand truck with a stack
    c.px(40, 52, 1, 10, '#2a2a30'); c.px(40, 61, 6, 1, '#2a2a30'); crate(41, 55); crate(41, 49);
    c.px(50, 58, 10, 5, '#c8965a'); for (let x = 51; x < 59; x += 2) c.dot(x, 57, '#f28c1a');
  },

  // 11 · common · the old tree on its corner, close and top-lit
  riverside_navel(c, { GW, GH }) {
    c.bands(0, [[10, '#8ac8f0'], [8, '#b8dcf4'], [10, '#dcecf4']]);
    // street trees and roofs behind
    c.silhouette((x) => 22 - Math.round(3 * Math.sin(x / 5) + (x % 17 < 4 ? 2 : 0)), '#4a7a4a', 34);
    c.px(0, 30, GW, 4, '#c8b89a');
    c.px(0, 34, GW, 18, '#5f9a44');
    for (let y = 36; y < 52; y += 4) c.px(0, y, GW, 1, '#6aa84e');
    // the tree, broad and a little gnarled
    c.px(40, 34, 5, 14, '#5a3e28'); c.px(38, 36, 2, 3, '#5a3e28'); c.px(45, 38, 3, 2, '#5a3e28');
    c.px(42, 34, 1, 12, '#7a5a3a');
    c.disc(42, 22, 14, '#2a622e');
    c.disc(36, 18, 8, '#347a36'); c.disc(50, 20, 8, '#2e6e32'); c.disc(42, 14, 7, '#3f8a3e');
    for (let i = 0; i < 34; i++) { const a = c.rand() * Math.PI * 2; const d = c.rand() * 13; c.disc(42 + Math.round(Math.cos(a) * d), 22 + Math.round(Math.sin(a) * d * 0.9), 0, '#f28c1a', i % 4 ? undefined : 'twinkle'); }
    for (let i = 0; i < 6; i++) c.dot(32 + Math.floor(c.rand() * 22), 10 + Math.floor(c.rand() * 6), '#fff6e0', 'glint');
    // mulch bed + low iron fence
    c.px(18, 46, 50, 6, '#6a4a32');
    c.px(18, 44, 50, 1, '#2a2a30'); c.px(18, 50, 50, 1, '#2a2a30');
    for (let x = 18; x < 68; x += 3) c.px(x, 43, 1, 8, '#2a2a30');
    // small plaque on a post (no text)
    c.px(70, 42, 6, 4, '#8a6a3a'); c.px(71, 43, 4, 2, '#c8a860'); c.px(72, 46, 1, 5, '#5a4a3a');
    // sidewalk + busy street
    c.px(0, 52, GW, 3, '#d4ccbc'); c.px(0, 55, GW, 9, '#5a5a62');
    for (let x = 2; x < GW; x += 10) c.px(x, 59, 5, 1, '#f0d060');
    c.px(8, 55, 14, 5, '#e05a4a', 'ride'); c.px(10, 54, 9, 2, '#9ac8ff', 'ride'); c.px(10, 60, 2, 1, '#1d1d2b', 'ride'); c.px(18, 60, 2, 1, '#1d1d2b', 'ride');
    person(c, 12, 52, '#f0b82a', '#8a5a3a');
    c.px(58, 57, 12, 5, '#3f6fd1', 'ride2'); c.px(60, 56, 7, 2, '#9ac8ff', 'ride2');
  },

  // 12 · common · a long train at dusk under the hills, crossing lights blinking
  riverside_freight(c, { GW, GH, bird }) {
    c.bands(0, [[8, '#2a2458'], [7, '#5a3a78'], [7, '#b0507a'], [7, '#f07a4a'], [5, '#ffb45a']]);
    c.dot(70, 4, '#ffffff', 'twinkle'); c.dot(20, 6, '#ffffff', 'twinkle');
    c.ridge(34, 8, 111, '#6a3a5a', 64);
    c.ridge(38, 4, 112, '#4a2a44', 64);
    // warehouse roofs and lights
    c.px(0, 38, GW, 6, '#3a2a3e');
    for (let x = 4; x < GW; x += 13) { c.px(x, 35, 10, 3, '#4a3a4e'); c.dot(x + 4, 36, '#ffd98a', 'twinkle'); }
    // rail bed
    c.px(0, 44, GW, 14, '#2e2630');
    c.px(0, 54, GW, 1, '#8a8090'); c.px(0, 57, GW, 1, '#8a8090');
    for (let x = 0; x < GW; x += 3) c.px(x, 55, 2, 2, '#4a3a34');
    // the train: engine + a long run of cars, sliding
    c.px(8, 43, 20, 11, '#e0a030', 'ride2'); c.px(18, 40, 8, 4, '#e0a030', 'ride2'); c.px(20, 41, 5, 2, '#9ac8ff', 'ride2'); c.px(8, 47, 2, 2, '#fff6c8', 'ride2'); c.px(8, 51, 20, 1, '#1d1a22', 'ride2');
    const cars = ['#8a3a2a', '#3a5a7a', '#6a6a70', '#a86a2a', '#3a6a4a', '#7a2a3a'];
    for (let i = 0; i < 12; i++) { const x = 29 + i * 13; c.px(x, 44, 12, 9, cars[i % cars.length], 'ride2'); c.px(x, 44, 12, 1, '#1d1a22', 'ride2'); c.px(x + 2, 46, 8, 1, '#1d1a22', 'ride2'); }
    // crossing gate + signal
    c.px(84, 56, 1, 8, '#e8e8e8'); c.px(82, 55, 5, 3, '#1d1a22');
    c.px(82, 55, 2, 2, '#ff3a3a', 'bell'); c.px(85, 55, 2, 2, '#ff3a3a', 'bell');
    // road in front + a waiting car
    c.px(0, 58, GW, 6, '#4a4450');
    c.px(60, 59, 14, 4, '#3fb8a8'); c.px(63, 58, 8, 2, '#1d2a3a'); c.px(72, 60, 2, 1, '#ffe39a', 'glow');
    for (let i = 0; i < 3; i++) bird(c, 34 + i * 6, 10 + (i % 2) * 2, '#1a1430', 'drift');
  },
};
