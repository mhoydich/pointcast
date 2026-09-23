// Campus Cards · Set 08 · San Diego — scenes. Unofficial, places only, CC0.
// Set data (titles, rarities, flavor) lives in src/data/campus-cards.json.

// ---- local helpers
function walker(c, x, y, shirt, layer, skin = '#e0aa80') {
  c.px(x, y - 2, 2, 2, skin, layer);
  c.px(x, y, 2, 3, shirt, layer);
  c.px(x, y + 3, 1, 1, '#1d1d2b', layer); c.px(x + 1, y + 3, 1, 1, '#1d1d2b', layer);
}

function pelican(c, x, y, layer) {
  c.px(x, y, 4, 1, '#6a5a4a', layer); c.px(x - 2, y - 1, 2, 1, '#6a5a4a', layer); c.px(x + 4, y - 1, 2, 1, '#6a5a4a', layer);
  c.px(x + 1, y - 1, 2, 1, '#8a7a66', layer); c.dot(x + 3, y + 1, '#d9a24a', layer);
}

function torreyPine(c, x, base, h, lean = 1) {
  // crooked trunk with branches ending in dark tufts
  let tx = x;
  for (let i = 0; i < h; i++) {
    if (i % 4 === 3) tx += lean;
    c.px(tx, base - i, 2, 1, '#5a4030');
  }
  const top = base - h;
  const tufts = [[tx - 5, top + 3, 4], [tx + 4, top + 1, 4], [tx, top - 2, 5], [tx - 2 - lean * 2, top + 7, 3], [tx + 5 + lean, top + 6, 3]];
  tufts.forEach(([bx, by, r], i) => {
    const sx = tx + 1; const dx = bx - sx; const dy = by - top;
    for (let s = 0; s <= Math.abs(dx); s++) c.dot(sx + Math.sign(dx) * s, top + Math.round((dy * s) / Math.max(1, Math.abs(dx))), '#5a4030');
    c.disc(bx, by, r, i % 2 ? '#24503a' : '#2e6246');
    c.px(bx - r + 1, by - r + 1, r, 1, '#3f7a52');
  });
}

function sandstone(c, x0, x1, top, bottom) {
  // layered cliff face with erosion gullies
  const bandsC = ['#e2b87a', '#d4a266', '#c98f55', '#e8c890', '#b97c48'];
  for (let x = x0; x < x1; x++) {
    const t = Math.round(top(x));
    for (let y = t; y < bottom; y++) {
      const b = Math.floor((y + Math.round(Math.sin(x / 6) * 1.5)) / 3) % bandsC.length;
      c.dot(x, y, bandsC[b]);
    }
    if (x % 7 === 2) c.px(x, t + 3, 1, bottom - t - 4, '#a86a3c');
  }
}

function eucTree(c, x, top, bottom, w = 3) {
  c.px(x, top, w, bottom - top, '#d8ccb4');
  c.px(x + w - 1, top, 1, bottom - top, '#a8987c');
  for (let y = top + 3; y < bottom; y += 6) c.px(x + (y % 2), y, 1, 3, '#f1e9d8');
  for (let y = top + 6; y < bottom; y += 9) c.px(x, y, w, 1, '#b8a88a');
}

// ---- scenes
export const scenes = {
  sd_geisel(c, { GW, GH, bird }) {
    // dusk over the mesa
    c.bands(0, [[9, '#1f2f6e'], [8, '#39478f'], [8, '#6a5aaa'], [7, '#c46a9e'], [7, '#f0996a'], [6, '#ffc27a']]);
    [[6, 3], [20, 6], [76, 2], [84, 8], [60, 5]].forEach(([x, y]) => c.dot(x, y, '#ffffff', 'twinkle'));
    // eucalyptus canopy behind
    c.silhouette((x) => 40 - Math.round(3 * Math.sin(x / 4.2) + 2 * Math.sin(x / 1.7)), '#2c4a46', 58);
    c.silhouette((x) => 45 - Math.round(2 * Math.sin(x / 3.1 + 1) + (x % 9 < 3 ? 2 : 0)), '#223a38', 58);
    // plaza
    c.px(0, 56, GW, 8, '#8f8a86');
    for (let x = 0; x < GW; x += 6) c.px(x, 58, 3, 1, '#a7a29c');
    c.px(0, 56, GW, 1, '#6e6a68');
    // the library: podium, splayed struts, stacked glass floors wider than the base
    const cx = 44;
    c.px(cx - 14, 48, 28, 8, '#bfb8ae');
    c.px(cx - 14, 48, 28, 1, '#dcd6cc');
    for (let x = cx - 12; x < cx + 12; x += 4) c.px(x, 50, 2, 5, '#3d4a6a');
    // central core
    c.px(cx - 4, 36, 8, 12, '#c9c2b6');
    // splayed concrete struts
    for (let i = 0; i < 13; i++) {
      const y = 47 - i;
      c.px(cx - 6 - i, y, 2, 1, '#d6cfc3'); c.px(cx + 4 + i, y, 2, 1, '#b1aa9e');
      c.px(cx - 3 - Math.floor(i / 2), y, 1, 1, '#cfc8bc'); c.px(cx + 2 + Math.floor(i / 2), y, 1, 1, '#aca598');
    }
    // floors, widest in the upper middle
    const floors = [[34, 44], [29, 52], [24, 56], [19, 54], [14, 44], [10, 30]];
    floors.forEach(([y, w], i) => {
      const h = i === floors.length - 1 ? 4 : 5;
      c.px(cx - w / 2, y, w, h - 1, i % 2 ? '#44608e' : '#3a5586');
      c.px(cx - w / 2, y + h - 1, w, 1, '#d8d1c5');
      for (let x = cx - w / 2 + 1; x < cx + w / 2 - 1; x += 3) c.px(x, y, 1, h - 1, '#2a3c62');
    });
    c.px(cx - 15, 9, 30, 1, '#d8d1c5');
    // warm window glow (twinkles on top)
    [[26, 26], [31, 21], [37, 31], [42, 16], [48, 26], [53, 21], [58, 31], [61, 26], [34, 12], [50, 12], [45, 36], [22, 21]].forEach(([x, y]) => c.px(x, y, 2, 2, '#ffd98a', 'twinkle'));
    [[29, 31], [40, 26], [55, 16], [64, 21]].forEach(([x, y]) => c.px(x, y, 2, 2, '#ffe9b0', 'glint'));
    // late walkers
    walker(c, 14, 57, '#e05a4a', 'ride'); walker(c, 70, 58, '#3fb8a8', 'ride2'); walker(c, 76, 57, '#f0b82a', 'ride2');
    for (let i = 0; i < 3; i++) bird(c, 8 + i * 5, 14 + (i % 2) * 2, '#1b2440', 'drift');
  },

  sd_pier(c, { GW, glints, waves }) {
    // late gold hour
    c.bands(0, [[7, '#3f5ba8'], [7, '#6f7fc4'], [6, '#d88aa0'], [6, '#f6b07a'], [5, '#ffd88a']]);
    c.disc(62, 26, 5, '#fff2b8');
    // ocean
    const sea = 31;
    c.bands(sea, [[3, '#f0b07a'], [5, '#5f7fb8'], [7, '#3a64a8'], [6, '#2f5a9e']]);
    for (let y = sea + 1; y < sea + 14; y += 2) c.px(58 - Math.floor((y - sea) / 3), y, 9 - Math.floor((y - sea) / 3), 1, '#ffe09a', 'glint');
    glints(c, sea + 4, sea + 20, 14, '#cfe4ff');
    // the pier: long straight deck on piles, receding slightly
    for (let x = 0; x < 80; x++) {
      const y = 36 - Math.floor(x / 18);
      c.px(x, y, 1, 2, '#e9e4da');
      c.dot(x, y + 2, '#9c9890');
      if (x % 4 === 0) c.px(x, y + 3, 1, 12 - Math.floor(x / 8), '#5a5660');
      if (x % 2 === 0) c.dot(x, y - 1, '#b8b2a8');
    }
    // lab shed + crane at the end
    c.px(68, 26, 12, 6, '#f1ece2'); c.px(68, 26, 12, 1, '#c8452e'); c.px(70, 28, 2, 2, '#3a5586'); c.px(75, 28, 2, 2, '#3a5586');
    c.px(81, 20, 1, 12, '#e9c23a'); c.px(78, 20, 6, 1, '#e9c23a'); c.px(78, 21, 1, 4, '#7a7a80');
    // beach + surf line
    c.px(0, 52, GW, 12, '#e6cf9a');
    for (let i = 0; i < 40; i++) c.dot(Math.floor(c.rand() * GW), 53 + Math.floor(c.rand() * 11), '#d4ba84');
    c.px(0, 50, GW, 2, '#f4f1ea');
    waves(c, 48, '#ffffff'); waves(c, 45, '#d8e8ff');
    pelican(c, 20, 14, 'drift'); pelican(c, 30, 11, 'drift'); pelican(c, 40, 15, 'drift');
    walker(c, 16, 55, '#3f6fd1', 'ride'); c.px(24, 58, 6, 2, '#e05a4a'); c.px(25, 57, 2, 1, '#e0aa80');
  },

  sd_torrey(c, { GW, GH, glints, waves, bird }) {
    c.bands(0, [[10, '#4fa8e8'], [8, '#7cc4f0'], [6, '#b6e0f8']]);
    c.disc(76, 7, 4, '#fffbe0');
    c.px(8, 6, 14, 2, '#ffffff', 'drift'); c.px(12, 5, 6, 1, '#ffffff', 'drift');
    // ocean at left
    c.bands(24, [[4, '#2f86c8'], [6, '#2a74b8'], [10, '#23649e']]);
    for (let i = 0; i < 10; i++) c.px(Math.floor(c.rand() * 22), 25 + Math.floor(c.rand() * 12), 2, 1, '#d8f0ff', 'glint');
    waves(c, 32, '#e8f6ff', 'waves', 0, 22); waves(c, 37, '#ffffff', 'waves', 0, 20);
    // beach strip under the cliffs
    c.silhouette((x) => 42 - Math.round(x / 12), '#e8d29c', GH, 'base', 0, 40);
    for (let x = 0; x < 30; x += 4) c.px(x, 43 - Math.round(x / 12), 3, 1, '#ffffff', 'waves');
    // bluffs: layered sandstone, ragged top
    const top = (x) => 25 + Math.max(0, Math.round((36 - x) * 0.8)) + Math.round(1.5 * Math.sin(x / 3));
    sandstone(c, 14, GW, top, 58);
    // chaparral on the mesa top
    c.silhouette((x) => top(x) - 1 - (x % 5 < 2 ? 1 : 0), '#7a8a4a', 0, 'base', 30, GW);
    for (let x = 30; x < GW; x++) c.px(x, top(x) - 2 - (x % 5 < 2 ? 1 : 0), 1, 2, x % 3 ? '#8a9a52' : '#6a7a3e');
    // trail
    c.px(0, 58, GW, 6, '#c9a870');
    for (let i = 0; i < 30; i++) c.dot(Math.floor(c.rand() * GW), 59 + Math.floor(c.rand() * 5), '#b08e5a');
    // the pines
    torreyPine(c, 46, 24, 15, 1);
    torreyPine(c, 68, 22, 18, -1);
    torreyPine(c, 84, 21, 11, 1);
    c.px(60, 56, 2, 2, '#e0aa80'); c.px(60, 58, 2, 3, '#e05a4a');
    for (let x = 18; x < GW; x += 9) c.px(x, 57, 1, 1, '#6a7a3e', 'sway');
    bird(c, 22, 12, '#2b2b3a', 'drift'); bird(c, 28, 15, '#2b2b3a', 'drift');
  },

  sd_glider(c, { GW, GH, glints }) {
    c.bands(0, [[12, '#58b6f0'], [10, '#86ccf4'], [6, '#bfe5fa']]);
    // ocean far below, horizon
    c.bands(28, [[3, '#6fb0e0'], [6, '#3a8ac8'], [27, '#2f78b8']]);
    for (let y = 50; y < GH; y += 4) c.px((y * 7) % 20, y, 4, 1, '#e8f6ff', 'waves');
    glints(c, 29, 44, 16, '#e8f6ff');
    // cliff edge foreground: flat mesa top, drop-off on the left
    const edge = (x) => 44 + Math.round(Math.sin(x / 2.3));
    sandstone(c, 12, 34, (x) => 44 + Math.round((34 - x) * 0.25 + Math.sin(x / 1.7)), GH);
    c.silhouette(edge, '#c9b07a', GH, 'base', 32, GW);
    c.px(12, 60, 10, 4, '#e8d29c'); c.px(8, 60, 4, 1, '#ffffff', 'waves');
    c.px(32, 44, GW - 32, 2, '#9aa25a');
    for (let x = 32; x < GW; x += 3) c.dot(x, 43, '#7a8a44', 'sway');
    // launch field + windsock
    c.px(72, 34, 1, 11, '#d8d8d8');
    c.px(73, 34, 3, 2, '#ff6a2a', 'sway'); c.px(76, 34, 2, 2, '#ffffff', 'sway'); c.px(78, 35, 2, 1, '#ff6a2a', 'sway');
    // a wing laid out, pilots
    c.px(44, 50, 14, 2, '#ffd23f'); c.px(46, 49, 10, 1, '#e05a4a');
    walker(c, 60, 49, '#3f6fd1'); walker(c, 38, 50, '#1d1d2b');
    c.px(64, 54, 10, 3, '#8a5a3a'); c.px(64, 53, 10, 1, '#a8744a');
    // paragliders riding the lift (arc wings + lines + pilot)
    const glider = (x, y, col, col2, layer) => {
      for (let i = 0; i < 11; i++) {
        const dy = Math.round(((i - 5) ** 2) / 12);
        c.px(x + i, y + dy, 1, 2, i % 2 ? col : col2, layer);
      }
      c.dot(x + 2, y + 4, '#5a5a66', layer); c.dot(x + 8, y + 4, '#5a5a66', layer);
      c.dot(x + 3, y + 6, '#5a5a66', layer); c.dot(x + 7, y + 6, '#5a5a66', layer);
      c.px(x + 5, y + 8, 1, 2, '#1d1d2b', layer);
    };
    glider(14, 8, '#ff5a8a', '#ffd23f', 'bob');
    glider(46, 4, '#3fb8a8', '#ffffff', 'drift');
    glider(62, 16, '#8e3fd0', '#ff8f3a', 'bob');
    glider(30, 20, '#e05a4a', '#ffffff', 'drift2');
    // a gull for scale
    c.dot(80, 10, '#ffffff', 'drift'); c.dot(81, 11, '#ffffff', 'drift'); c.dot(82, 10, '#ffffff', 'drift');
  },

  sd_cove(c, { GW, GH, glints, waves }) {
    c.bands(0, [[8, '#6cc0f0'], [6, '#a4dcf6']]);
    // headland with low town far right
    c.silhouette((x) => (x > 50 ? 11 + Math.round((GW - x) / 10) : 15), '#8aa0b0', 16);
    for (let x = 56; x < GW; x += 5) c.px(x, 12 + Math.round((GW - x) / 10), 3, 2, '#e8e2d6');
    // cove water, deep to turquoise
    c.bands(14, [[5, '#1f78b0'], [6, '#2a90c0'], [8, '#36a8c8'], [8, '#4fc0c8']]);
    glints(c, 15, 36, 16, '#e8fbff');
    waves(c, 28, '#ffffff'); waves(c, 33, '#dff8ff');
    // dark rock shelf
    const rtop = (x) => 38 - Math.round(3 * Math.sin(x / 11) + 2 * Math.sin(x / 3.4));
    c.silhouette(rtop, '#4e443c');
    c.silhouette((x) => 48 - Math.round(3 * Math.sin(x / 9 + 1)), '#3e362f');
    for (let i = 0; i < 80; i++) c.dot(Math.floor(c.rand() * GW), 40 + Math.floor(c.rand() * 24), c.rand() > 0.5 ? '#5e5248' : '#342d27');
    for (let x = 0; x < GW; x++) c.dot(x, rtop(x), '#6e6258');
    for (let x = 0; x < GW; x += 4) c.px(x, rtop(x), 2, 1, '#ffffff', 'waves');
    // sea lions: big tan-brown loaves, heads up
    const lion = (x, y, flip, col, dark, layer) => {
      c.px(x + 1, y - 1, 10, 1, col, layer);
      c.px(x, y, 13, 3, col, layer);
      c.px(x + 2, y + 3, 9, 1, dark, layer);
      c.px(x + 3, y, 6, 1, '#d8a878', layer);
      const hx = flip ? x - 3 : x + 11;
      c.px(hx, y - 3, 4, 3, col, layer); c.px(flip ? hx - 1 : hx + 3, y - 2, 2, 2, col, layer);
      c.dot(flip ? hx : hx + 3, y - 3, '#1d1d2b', layer);
      c.px(flip ? x + 12 : x - 2, y + 2, 3, 1, dark, layer);
      c.px(flip ? x + 3 : x + 7, y + 3, 2, 1, dark, layer);
    };
    lion(6, 44, false, '#b07a4a', '#6a4428');
    lion(30, 42, true, '#9a6a40', '#5a3a22');
    lion(58, 45, false, '#b8845a', '#6a4428');
    lion(18, 54, true, '#a47048', '#5a3a22');
    lion(48, 56, false, '#b07a4a', '#6a4428');
    lion(70, 53, true, '#9a6a40', '#5a3a22', 'bob');
    // a bark
    c.px(76, 50, 1, 1, '#ffffff', 'ring'); c.px(78, 49, 1, 2, '#ffffff', 'ring');
    // one out swimming
    c.px(22, 24, 3, 2, '#6a4428', 'bob'); c.px(20, 26, 7, 1, '#bff0ff', 'bob');
    pelican(c, 62, 7, 'drift'); pelican(c, 72, 4, 'drift');
  },

  sd_eucalyptus(c, { GW, GH, rider }) {
    // morning light through tall trunks, from low on the path
    c.bands(0, [[14, '#cfe6e8'], [14, '#dcecd6'], [12, '#e8f0d0'], [12, '#d8dcc0']]);
    // back rows (paler)
    for (let x = 2; x < GW; x += 8) { c.px(x, 0, 2, 50, '#c8c8b8'); c.px(x + 1, 0, 1, 50, '#b0b0a0'); }
    // canopy of narrow blue-green leaves
    for (let i = 0; i < 160; i++) {
      const x = Math.floor(c.rand() * GW); const y = Math.floor(c.rand() * 14);
      c.px(x, y, 1 + Math.floor(c.rand() * 2), 1, c.rand() > 0.5 ? '#6f9a88' : '#4f7a6a', i % 3 ? 'base' : 'sway');
    }
    // sun shafts
    for (let i = 0; i < 4; i++) for (let y = 4; y < 50; y += 2) c.dot(10 + i * 21 + Math.floor(y / 2.5), y, '#fff6c8', 'glow');
    // ground: leaf litter + bark strips
    c.px(0, 50, GW, 14, '#9a7e5a');
    for (let i = 0; i < 90; i++) c.dot(Math.floor(c.rand() * GW), 50 + Math.floor(c.rand() * 14), c.rand() > 0.5 ? '#b8986a' : '#7a6044');
    for (let i = 0; i < 14; i++) c.px(Math.floor(c.rand() * GW), 51 + Math.floor(c.rand() * 12), 4, 1, '#e4d6bc');
    // front row trunks
    [[4, 4], [20, 5], [38, 3], [60, 5], [78, 4]].forEach(([x, w], i) => eucTree(c, x, 0, 52 + (i % 2) * 2, w));
    // path running between rows
    for (let y = 52; y < GH; y++) { const w = 6 + (y - 52); c.px(46 - w / 2, y, w, 1, '#d8c8a0'); }
    rider(c, 44, 58, '#e05a4a', 'ride');
    walker(c, 70, 53, '#3f6fd1', 'ride2');
  },

  sd_tidepools(c, { GW, GH }) {
    // top-down rock shelf at low tide
    c.px(0, 0, GW, GH, '#6a5a4c');
    for (let i = 0; i < 260; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * GH), ['#7e6c5c', '#584a3e', '#8a7866', '#5e5044'][i % 4]);
    // surf edge top
    c.bands(0, [[3, '#2f7ab8'], [3, '#4a9ad0']]);
    for (let x = 0; x < GW; x += 5) c.px(x, 6 + (x % 3), 4, 1, '#ffffff', 'waves');
    // pools
    const pool = (cx, cy, rx, ry) => {
      for (let y = -ry; y <= ry; y++) {
        const half = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.5)));
        c.px(cx - half, cy + y, half * 2 + 1, 1, y < 0 ? '#2e8a92' : '#257a84');
      }
      c.px(cx - rx + 2, cy - ry, rx, 1, '#8fd6d0', 'glint');
    };
    pool(22, 22, 14, 8); pool(62, 18, 12, 6); pool(46, 44, 18, 9); pool(12, 50, 8, 5);
    // anemones (green rings with pink hearts)
    [[16, 20], [26, 24], [40, 42], [52, 46], [58, 16]].forEach(([x, y]) => { c.disc(x, y, 2, '#4fbf7a'); c.dot(x, y, '#ff7ab0', 'glint'); });
    // ochre sea stars
    const star = (x, y, col) => { c.px(x - 2, y, 5, 1, col); c.px(x, y - 2, 1, 5, col); c.dot(x - 1, y + 1, col); c.dot(x + 1, y + 1, col); };
    star(32, 20, '#ff7a2a'); star(46, 48, '#9a3fb0'); star(66, 20, '#ff9a3a');
    // mussels + barnacles along the edges
    for (let x = 0; x < GW; x += 3) c.px(x, 8 + (x % 2), 2, 1, '#1d2230');
    for (let i = 0; i < 20; i++) c.dot(Math.floor(c.rand() * GW), 10 + Math.floor(c.rand() * 4), '#e8e2d4');
    // crab scuttling
    c.px(72, 40, 4, 2, '#d8452e', 'sway'); c.dot(71, 39, '#d8452e', 'sway'); c.dot(76, 39, '#d8452e', 'sway'); c.dot(71, 42, '#d8452e', 'sway'); c.dot(76, 42, '#d8452e', 'sway');
    // tiny fish in the big pool
    c.px(38, 46, 2, 1, '#e8f0ff', 'ride2'); c.px(50, 41, 2, 1, '#e8f0ff', 'ride');
    // someone's sneakers at the bottom edge
    c.px(28, 60, 4, 4, '#3f6fd1'); c.px(34, 61, 4, 3, '#3f6fd1'); c.px(28, 60, 4, 1, '#ffffff'); c.px(34, 61, 4, 1, '#ffffff');
  },

  sd_blacks(c, { GW, GH, glints, waves }) {
    // down on the sand, looking north along the cliffs
    c.bands(0, [[8, '#7cc4f4'], [6, '#a6d8f8'], [4, '#d4eefc']]);
    c.px(10, 5, 12, 1, '#ffffff', 'drift');
    // ocean on the left, down to the bottom
    c.bands(18, [[3, '#4a9ad0'], [6, '#3a8ac8'], [37, '#2f7fc0']]);
    glints(c, 19, 34, 10, '#e8f6ff');
    // sand strip between the surf line and the cliff foot, converging north
    const surf = (y) => 44 - (y - 18) * 0.95 + Math.sin(y / 2) * 1.5;
    const foot = (y) => 46 + (y - 18) * 0.9;
    for (let y = 18; y < GH; y++) {
      const s0 = Math.round(surf(y));
      c.px(s0, y, GW - s0, 1, y % 5 ? '#ead6a2' : '#dcc690');
      c.px(s0 - 2, y, 3, 1, '#ffffff');
      c.dot(s0 - 4, y, '#cfeeff');
    }
    // cliffs on the right: tall sandstone wall, foot slides toward you
    const ctop = (x) => 12 + Math.round((GW - x) / 3.2) + Math.round(Math.sin(x / 2.1));
    for (let x = 46; x < GW; x++) {
      const bottom = Math.min(GH, Math.round(18 + (x - 46) / 0.9));
      const bandsC = ['#e2b87a', '#d4a266', '#c98f55', '#e8c890', '#b97c48'];
      for (let y = ctop(x); y < bottom; y++) c.dot(x, y, bandsC[Math.floor((y + Math.round(Math.sin(x / 5) * 1.5)) / 3) % 5]);
      if (x % 6 === 1) c.px(x, ctop(x) + 3, 1, Math.max(0, bottom - ctop(x) - 4), '#a86a3c');
      c.px(x, ctop(x) - 1, 1, 2, '#8a9a52');
    }
    // swell lines in the water
    for (let y = 24; y < GH; y += 5) for (let x = 0; x < surf(y) - 8; x += 8) c.px(x + (y % 4), y, 5, 1, '#e8f6ff', 'waves');
    // surfers waiting in the lineup
    [[8, 36], [16, 32], [22, 42], [6, 50], [26, 28]].forEach(([x, y], i) => { c.px(x, y, 4, 1, i % 2 ? '#ff5a8a' : '#ffd23f', 'bob'); c.px(x + 1, y - 2, 1, 2, '#1d1d2b', 'bob'); c.dot(x + 1, y - 3, '#8a5a3a', 'bob'); });
    // one riding
    c.px(10, 58, 12, 1, '#ffffff', 'ride'); c.px(13, 57, 4, 1, '#ffd23f', 'ride'); c.px(14, 54, 1, 3, '#1d1d2b', 'ride'); c.dot(14, 53, '#8a5a3a', 'ride');
    // walkers on the sand, a board under an arm
    walker(c, 44, 52, '#e05a4a'); c.px(46, 51, 1, 6, '#ffffff');
    walker(c, 40, 34, '#3f6fd1');
    c.px(36, 26, 1, 2, '#1d1d2b');
    c.px(52, 60, 5, 2, '#ffd23f'); c.px(53, 59, 3, 1, '#f0b82a');
  },

  sd_trolley(c, { GW, GH }) {
    c.bands(0, [[10, '#4fb0ee'], [8, '#80c8f4'], [6, '#b4e0f8']]);
    c.disc(14, 8, 4, '#fffbe0');
    // eucalyptus + campus buildings behind
    c.silhouette((x) => 22 - Math.round(3 * Math.sin(x / 3.3) + 2 * Math.sin(x / 1.4)), '#4f7a5a', 40);
    [[4, 14], [50, 18], [70, 12]].forEach(([x, w]) => { c.px(x, 20, w, 18, '#e8e2d6'); for (let wx = x + 1; wx < x + w - 1; wx += 3) for (let wy = 22; wy < 36; wy += 4) c.px(wx, wy, 2, 2, '#6a8ab0'); });
    c.px(0, 38, GW, 2, '#5f8a5a');
    // raised concrete guideway with piers
    c.px(0, 40, GW, 3, '#c8c2b8'); c.px(0, 43, GW, 1, '#9c968c');
    for (let x = 6; x < GW; x += 20) { c.px(x, 44, 4, 14, '#b8b2a8'); c.px(x + 3, 44, 1, 14, '#948e84'); }
    // overhead wire + masts
    c.px(0, 24, GW, 1, '#3a3a44');
    for (let x = 2; x < GW; x += 20) c.px(x, 24, 1, 16, '#6a6a74');
    // station canopy
    c.px(58, 30, 26, 2, '#e8e8ee'); c.px(60, 32, 1, 8, '#9a9aa4'); c.px(80, 32, 1, 8, '#9a9aa4');
    walker(c, 66, 35, '#f0b82a'); walker(c, 72, 35, '#8e3fd0');
    // the trolley: two red cars on the ride layer
    const car = (x) => {
      c.px(x, 30, 22, 9, '#c8302e', 'ride');
      c.px(x, 30, 22, 1, '#e86a5a', 'ride');
      c.px(x, 36, 22, 1, '#f1ece2', 'ride');
      for (let wx = x + 2; wx < x + 20; wx += 4) c.px(wx, 32, 3, 3, '#bfe4ff', 'ride');
      c.px(x + 2, 39, 3, 1, '#1d1d2b', 'ride'); c.px(x + 17, 39, 3, 1, '#1d1d2b', 'ride');
      c.px(x + 10, 26, 1, 4, '#3a3a44', 'ride'); c.px(x + 8, 25, 5, 1, '#3a3a44', 'ride');
    };
    car(12); car(35);
    // street + lawn below
    c.px(0, 58, GW, 6, '#6a6a70');
    for (let x = 2; x < GW; x += 10) c.px(x, 60, 5, 1, '#f0e08a');
    c.px(0, 44, GW, 14, '#7fb05a');
    for (let x = 6; x < GW; x += 20) { c.px(x, 44, 4, 14, '#b8b2a8'); c.px(x + 3, 44, 1, 14, '#948e84'); }
    c.px(0, 56, GW, 2, '#d8d0c0');
    walker(c, 30, 51, '#3fb8a8', 'ride2'); walker(c, 50, 52, '#e05a4a', 'ride');
  },

  sd_gloom(c, { GW, GH, glints, waves }) {
    // flat grey marine layer
    c.bands(0, [[10, '#9aa2aa'], [10, '#aab2b8'], [8, '#b8c0c4']]);
    for (let y = 4; y < 26; y += 5) for (let x = -10; x < GW; x += 22) c.px(x + (y % 7) * 2, y, 16, 2, '#c8ced2', y % 2 ? 'drift' : 'drift2');
    // muted sea
    c.bands(28, [[4, '#8a98a4'], [6, '#7a8a98'], [8, '#6e7e8e']]);
    glints(c, 30, 44, 8, '#c8d2da');
    waves(c, 42, '#d8dee2'); waves(c, 45, '#e8ecee');
    // lifeguard tower on stilts
    c.px(58, 32, 12, 8, '#cfd2c8'); c.px(57, 31, 14, 1, '#8a8e86'); c.px(60, 34, 8, 3, '#5a6a7a');
    c.px(59, 40, 1, 10, '#8a8e86'); c.px(68, 40, 1, 10, '#8a8e86'); c.px(62, 40, 1, 10, '#8a8e86', 'base');
    for (let i = 0; i < 6; i++) c.px(52 + i, 50 - i * 2, 2, 1, '#8a8e86');
    // sand
    c.px(0, 48, GW, 16, '#c8bca0');
    c.px(0, 47, GW, 2, '#e8ecee');
    for (let i = 0; i < 40; i++) c.dot(Math.floor(c.rand() * GW), 49 + Math.floor(c.rand() * 15), '#b4a88c');
    c.px(58, 50, 12, 1, '#b0a488');
    // a person in a hoodie with a coffee, and a dog
    c.px(22, 50, 3, 2, '#e0aa80'); c.px(21, 49, 5, 2, '#6a4a8a'); c.px(21, 52, 5, 5, '#6a4a8a'); c.px(22, 57, 1, 3, '#2a2a36'); c.px(24, 57, 1, 3, '#2a2a36');
    c.px(26, 53, 2, 2, '#ffffff'); c.dot(26, 52, '#e8e2d4', 'glow');
    c.px(31, 57, 5, 2, '#b07850', 'bob'); c.px(35, 55, 2, 2, '#b07850', 'bob'); c.dot(31, 59, '#8a5a3a', 'bob'); c.dot(35, 59, '#8a5a3a', 'bob');
    // footprints
    for (let x = 4; x < 20; x += 3) c.dot(x, 60 - (x % 2), '#a89c80');
    // gulls
    c.dot(40, 14, '#6a727a', 'drift'); c.dot(41, 15, '#6a727a', 'drift'); c.dot(42, 14, '#6a727a', 'drift');
  },

  sd_walk(c, { GW, GH }) {
    // long pedestrian spine in perspective, the library small at the far end
    c.bands(0, [[8, '#5ab4f0'], [6, '#8ccaf4'], [6, '#bfe4fa']]);
    // distant library
    const cx = 44;
    c.px(cx - 2, 14, 4, 5, '#c9c2b6');
    [[12, 12], [10, 14], [8, 12], [6, 8]].forEach(([y, w]) => { c.px(cx - w / 2, y, w, 2, '#3f5a8a'); c.px(cx - w / 2, y + 1, w, 1, '#d8d1c5'); });
    c.dot(cx - 5, 17, '#d6cfc3'); c.dot(cx + 4, 17, '#d6cfc3'); c.dot(cx - 4, 16, '#d6cfc3'); c.dot(cx + 3, 16, '#d6cfc3');
    // tree rows converging
    c.silhouette((x) => 18 - Math.round(Math.abs(x - cx) / 3) + Math.round(Math.sin(x / 2) * 1.5), '#3f7a4a', 40);
    c.silhouette((x) => 26 - Math.round(Math.abs(x - cx) / 4) + Math.round(Math.sin(x / 1.6)), '#2f6a3c', 44);
    // lawns
    c.px(0, 20, GW, 44, '#6fae4a');
    c.silhouette((x) => 18 - Math.round(Math.abs(x - cx) / 3) + Math.round(Math.sin(x / 2) * 1.5), '#3f7a4a', 24);
    for (let y = 26; y < GH; y += 5) c.px(0, y, GW, 2, '#7cbc56');
    // the walk: widening wedge
    for (let y = 19; y < GH; y++) {
      const w = 4 + Math.round((y - 19) * 1.3);
      c.px(cx - w / 2, y, w, 1, y % 4 ? '#d8d0bc' : '#c8c0aa');
    }
    // club tables with colored cloths down both edges
    const cloths = ['#e05a4a', '#f0b82a', '#3f6fd1', '#8e3fd0', '#3fb8a8', '#ff8fc4'];
    for (let i = 0; i < 6; i++) {
      const y = 26 + i * 6; const off = 3 + Math.round((y - 19) * 0.65);
      const tw = 2 + Math.floor(i / 2);
      c.px(cx - off - tw, y, tw, 2, cloths[i % 6]); c.px(cx + off, y, tw, 2, cloths[(i + 3) % 6]);
      c.px(cx - off - tw + 1, y - 1 - Math.floor(i / 3), 1, 1, '#ffffff', i % 2 ? 'sway' : undefined);
    }
    // sandwich boards
    c.px(20, 54, 3, 5, '#ffd23f'); c.px(20, 55, 3, 1, '#1d1d2b'); c.px(64, 52, 3, 5, '#ffffff'); c.px(64, 53, 3, 1, '#e05a4a');
    // walkers heading both ways
    walker(c, 40, 40, '#e05a4a', 'bob'); walker(c, 47, 46, '#1d1d2b'); walker(c, 36, 54, '#3f6fd1', 'bob'); walker(c, 52, 56, '#f0b82a');
    c.px(43, 31, 1, 2, '#4a9a6a'); c.px(46, 27, 1, 2, '#e05a4a');
  },

  sd_sunset(c, { GW, GH, palm, bird }) {
    c.bands(0, [[7, '#2a2a6e'], [6, '#5a3a8e'], [6, '#a84a8e'], [6, '#e86a6a'], [6, '#f79a5a'], [5, '#ffc46a']]);
    c.dot(10, 3, '#ffffff', 'twinkle'); c.dot(30, 2, '#ffffff', 'twinkle');
    // thin cloud bars lit from below
    c.px(8, 20, 24, 1, '#ffd88a', 'drift'); c.px(54, 17, 20, 1, '#ffb07a', 'drift2'); c.px(60, 22, 14, 1, '#ffe0a0', 'drift');
    // sun half-gone into the sea
    const sea = 36;
    c.disc(44, sea, 7, '#ffe27a');
    c.disc(44, sea, 5, '#fff2b0');
    c.bands(sea, [[3, '#f08a5a'], [4, '#9a4a7a'], [5, '#5a3a6e'], [4, '#3a2a58']]);
    for (let y = sea + 1; y < sea + 15; y += 2) { const w = 12 - Math.floor((y - sea) / 2); c.px(44 - w / 2 + (y % 3) - 1, y, w, 1, '#ffd070', 'glint'); }
    // grassy park + silhouettes along the seawall
    c.px(0, 52, GW, 12, '#1e2a28');
    c.px(0, 51, GW, 1, '#2e3a36');
    palm(c, 8, 52, 20, '#1a1a24', '#1a1a24', '#24242e');
    palm(c, 78, 52, 24, '#1a1a24', '#1a1a24', '#24242e');
    palm(c, 70, 52, 16, '#1a1a24', '#1a1a24', '#24242e');
    // people sitting and standing, watching
    [[20, 49], [26, 50], [48, 49], [58, 50]].forEach(([x, y], i) => { c.px(x, y, 2, 3, '#14141c'); c.px(x, y - 2, 2, 2, '#14141c'); if (i % 2) c.px(x + 2, y + 1, 2, 2, '#14141c'); });
    c.px(34, 50, 5, 2, '#14141c'); c.px(35, 48, 2, 2, '#14141c');
    c.px(62, 44, 1, 1, '#ffe7a8', 'ring'); c.px(64, 45, 1, 1, '#ffe7a8', 'ring');
    for (let i = 0; i < 3; i++) bird(c, 18 + i * 6, 26 + (i % 2) * 2, '#2a1a3a', 'drift');
    for (let i = 0; i < 20; i++) c.dot(Math.floor(c.rand() * GW), 54 + Math.floor(c.rand() * 10), '#2a3632');
  },
};
