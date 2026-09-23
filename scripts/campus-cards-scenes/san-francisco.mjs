// Campus Cards · Set 09 · San Francisco — scenes. Unofficial, places only, CC0.
// Set data (titles, rarities, flavor) lives in src/data/campus-cards.json.

// ------------------------------------------------------------ helpers
const SKIN = ['#e9b48a', '#c98a5a', '#8a5a3a', '#f0c8a0'];

function person(c, x, y, shirt, skin = '#e0aa80', layer, legs = '#2a2a3a') {
  c.px(x, y - 7, 2, 2, skin, layer);
  c.px(x, y - 5, 2, 3, shirt, layer);
  c.px(x, y - 2, 1, 2, legs, layer);
  c.px(x + 1, y - 2, 1, 2, legs, layer);
}

function dog(c, x, y, col = '#8a5a3a', layer) {
  c.px(x, y - 2, 4, 2, col, layer);
  c.px(x + 3, y - 3, 2, 2, col, layer);
  c.dot(x, y, col, layer); c.dot(x + 3, y, col, layer);
  c.dot(x - 1, y - 3, col, layer);
}

// Sutro Tower, seen side-on: three tapering legs, two crossbars, a trident of
// masts above the upper deck, red and white bands, red lights at the tips.
function sutro(c, cx, top, bottom, wb, opts = {}) {
  const { red = '#d8453a', white = '#f2eee8', back = '#b9a9a6', lamp = true, lw = wb > 24 ? 2 : 1 } = opts;
  const H = bottom - top;
  const deck = top + Math.round(H * 0.27);
  const low = top + Math.round(H * 0.6);
  const wt = Math.max(4, Math.round(wb * 0.3));
  const step = Math.max(2, Math.round(H / 12));
  const band = (y) => (Math.floor((y - top) / step) % 2 ? white : red);
  const halfAt = (y) => wt / 2 + ((y - deck) / (bottom - deck)) * (wb - wt) / 2;
  // back (third) leg, straight down the middle
  for (let y = deck; y < bottom; y++) c.px(cx, y, 1, 1, back);
  for (let y = deck; y < bottom; y++) {
    const h = halfAt(y);
    c.px(Math.round(cx - h) - lw + 1, y, lw, 1, band(y));
    c.px(Math.round(cx + h), y, lw, 1, band(y));
  }
  // lower crossbar + bracing
  const hl = Math.round(halfAt(low));
  c.px(cx - hl, low, hl * 2 + 1, 1, band(low));
  for (let i = 0; i <= hl; i++) { c.dot(cx - hl + i, low + Math.round(i * 0.9), back); c.dot(cx + hl - i, low + Math.round(i * 0.9), back); }
  // upper deck
  c.px(cx - Math.round(wt / 2) - 2, deck, wt + 5, 2, red);
  // masts
  const mastTop = [top + Math.round(H * 0.08), top, top + Math.round(H * 0.08)];
  [cx - Math.round(wt / 2), cx, cx + Math.round(wt / 2)].forEach((mx, i) => {
    for (let y = mastTop[i]; y < deck; y++) c.px(mx, y, 1, 1, band(y));
    if (lamp) c.dot(mx, mastTop[i] - 1, '#ff3a2a', 'glint');
  });
  c.px(cx - Math.round(wt / 2), top + Math.round(H * 0.16), wt + 1, 1, white);
}

// A row of San Francisco flats with bay windows.
function flats(c, x0, x1, ground, opts = {}) {
  const { hMin = 18, hVar = 8, w = 12, cols = ['#f2d6c4', '#cfe0d4', '#f5e6b0', '#d8d4ec', '#f2c4c8', '#c8dcec', '#eadfcf'], seed = 0, lit = false } = opts;
  let x = x0; let i = seed;
  while (x < x1) {
    const col = cols[i % cols.length];
    const h = hMin + ((i * 5) % (hVar + 1));
    const top = ground - h;
    c.px(x, top, w, h, col);
    c.px(x, top, w, 2, '#f8f4ea');
    c.px(x - 0, top + 2, w, 1, '#9a8e80');
    // bay window column
    c.px(x + 2, top + 4, 5, h - 9, '#ffffff');
    for (let wy = top + 5; wy < ground - 6; wy += 5) { c.px(x + 3, wy, 3, 3, lit ? '#ffd98a' : '#6a86a8'); }
    c.px(x + 8, top + 5, 2, 3, lit ? '#ffd98a' : '#6a86a8');
    // door + stoop
    c.px(x + 8, ground - 5, 3, 5, '#6a4a3a');
    c.px(x + w - 1, top, 1, h, '#8a7e70');
    x += w; i++;
  }
}

// ------------------------------------------------------------- scenes
export const scenes = {
  // 01 · the hillside campus with the tower on the ridge behind
  sf_parnassus(c, { GW, GH, bird }) {
    c.bands(0, [[8, '#56659a'], [8, '#7c84b8'], [8, '#aea3cc'], [6, '#dcb6c4'], [6, '#f0ccb8']]);
    sutro(c, 64, 1, 36, 26);
    // Mount Sutro forest ridge
    c.ridge(30, 5, 21, '#3b5a48', GH);
    for (let i = 0; i < 70; i++) c.dot(Math.floor(c.rand() * GW), 24 + Math.floor(c.rand() * 10), c.rand() > 0.5 ? '#4f7458' : '#2f4a3c');
    // the slope: high on the right, low on the left
    const slope = (x) => 52 - x / 4.4;
    c.silhouette((x) => Math.round(slope(x)), '#557a4e');
    for (let i = 0; i < 40; i++) { const x = Math.floor(c.rand() * GW); c.dot(x, Math.round(slope(x)) + 1 + Math.floor(c.rand() * 4), '#6a9a5a'); }
    // hospital + lab towers stepping up the hill
    const blocks = [[3, 12, 12, '#e8e0d0'], [17, 16, 20, '#f1ebe0'], [35, 14, 26, '#e3dccd'], [51, 12, 20, '#ece4d6'], [65, 18, 16, '#f3eee4']]
      .map(([x, w, h, col]) => [x, Math.round(slope(x + w)) + 3 - h, w, h, col]);
    blocks.forEach(([x, y, w, h, col], bi) => {
      c.px(x, y, w, h, col);
      c.px(x + w - 2, y, 2, h, '#c7bca8');
      c.px(x - 1, y - 1, w + 2, 1, '#a89c88');
      for (let wy = y + 2; wy < y + h - 2; wy += 3) {
        for (let wx = x + 1; wx < x + w - 3; wx += 3) {
          const lit = (wx * 7 + wy * 3 + bi) % 5 === 0;
          c.px(wx, wy, 2, 1, lit ? '#ffd98a' : '#7a8fb0', lit ? 'twinkle' : undefined);
        }
      }
    });
    // Inner Sunset roofs at the foot of the hill
    c.px(0, 52, GW, 6, '#8a7f8c');
    for (let x = 0; x < GW; x += 9) { c.px(x, 50, 8, 6, ['#f2d6c4', '#d8d4ec', '#cfe0d4', '#f5e6b0'][(x / 9) % 4]); c.px(x, 50, 8, 1, '#f8f4ea'); c.px(x + 2, 52, 2, 2, '#ffd98a', 'twinkle'); }
    // street
    c.px(0, 56, GW, 8, '#5a5a66');
    for (let x = 3; x < GW; x += 11) c.px(x, 60, 5, 1, '#e8e4d8');
    person(c, 20, 58, '#3f6fd1', SKIN[0], 'ride');
    person(c, 50, 59, '#f0b82a', SKIN[2], 'ride2');
    // fog easing over the ridge and around the tower
    for (let y = 10; y < 26; y += 5) for (let x = -12; x < GW; x += 26) c.px(x + (y % 7) * 2, y, 13, 2, '#f4f1f4', y % 2 ? 'drift' : 'drift2');
    bird(c, 16, 10, '#2a2c48', 'drift'); bird(c, 24, 13, '#2a2c48', 'drift');
  },

  // 02 · the tower's top above a sea of fog at sunset
  sf_sutrofog(c, { GW, GH, bird }) {
    c.bands(0, [[8, '#2f3a7a'], [7, '#6a4f9e'], [7, '#c0609a'], [6, '#f08a6a'], [6, '#ffc27a'], [6, '#ffd89a']]);
    c.dot(10, 3, '#ffffff', 'twinkle'); c.dot(78, 5, '#ffffff', 'twinkle'); c.dot(30, 2, '#ffffff', 'twinkle');
    c.disc(16, 33, 5, '#fff0b0');
    // Twin Peaks-ish humps just breaking the fog
    c.silhouette((x) => (x > 64 ? 32 - Math.round(3 * Math.sin((x - 64) / 7.6)) : GH), '#7a6890', 40, 'base', 64, GW);
    sutro(c, 42, 3, 64, 40);
    // the fog sea, static body
    c.silhouette((x) => 36 + Math.round(1.5 * Math.sin(x / 5) + Math.sin(x / 2.1)), '#f4e6e6');
    c.silhouette((x) => 42 + Math.round(1.5 * Math.sin(x / 6 + 1)), '#e8d8e2');
    c.silhouette((x) => 50 + Math.round(1.5 * Math.sin(x / 7 + 2)), '#d8cbe0');
    c.px(0, 58, GW, 6, '#cabedb');
    // sunlight on the fog top
    for (let x = 4; x < 36; x += 3) c.dot(x, 36 + Math.round(1.5 * Math.sin(x / 5) + Math.sin(x / 2.1)), '#ffd98a', 'glint');
    // wisps curling past
    for (let y = 30; y < 56; y += 6) for (let x = -10; x < GW; x += 26) c.px(x + (y % 5) * 3, y, 12, 1, '#fff8f4', y % 2 ? 'drift' : 'drift2');
    bird(c, 60, 14, '#3a2a4a', 'drift'); bird(c, 67, 11, '#3a2a4a', 'drift');
  },

  // 03 · the bayside campus, bright day
  sf_missionbay(c, { GW, GH, glints, waves, rider, bird }) {
    c.bands(0, [[10, '#6fb8ec'], [10, '#9ed2f4'], [8, '#cfe9f8']]);
    c.px(62, 6, 10, 2, '#ffffff', 'drift'); c.px(60, 7, 14, 1, '#ffffff', 'drift');
    c.ridge(27, 3, 33, '#8aa0b8', 30);
    c.bands(28, [[5, '#2f78b8'], [6, '#3f8cc8'], [6, '#52a0d6']]);
    glints(c, 29, 44, 16, '#ffffff');
    waves(c, 38, '#d8f0ff', 'waves', 44, GW);
    // a sailboat
    c.px(70, 34, 6, 2, '#f4f4f4', 'bob'); c.px(72, 27, 1, 7, '#3a3a44', 'bob'); c.px(73, 28, 3, 5, '#ffffff', 'bob');
    // modern buildings on the left
    // glass block
    c.px(2, 10, 16, 36, '#5f9ccc');
    for (let y = 12; y < 44; y += 3) c.px(2, y, 16, 1, '#8cc0e4');
    for (let x = 5; x < 18; x += 4) c.px(x, 10, 1, 36, '#3f78a8');
    c.px(2, 9, 16, 1, '#2f5f88');
    // white louvered block
    c.px(18, 16, 14, 30, '#f2f0ea');
    for (let y = 18; y < 44; y += 3) c.px(19, y, 12, 1, '#b8c4cc');
    c.px(30, 16, 2, 30, '#d4d0c6');
    // warm panel block
    c.px(32, 22, 12, 24, '#e98a5a');
    for (let y = 24; y < 44; y += 4) for (let x = 33; x < 43; x += 4) c.px(x, y, 2, 2, (x + y) % 3 ? '#fbe3cc' : '#ffd98a', (x + y) % 3 ? undefined : 'twinkle');
    c.px(42, 22, 2, 24, '#c46a3e');
    // shoreline edge, promenade, lawn
    c.px(0, 45, GW, 2, '#8a8a86');
    c.px(0, 47, GW, 5, '#d8d2c4');
    for (let x = 0; x < GW; x += 8) c.px(x, 47, 1, 5, '#c4bca8');
    c.px(0, 52, GW, 12, '#6fae4a');
    for (let y = 54; y < GH; y += 4) c.px(0, y, GW, 2, '#7cbc56');
    // young trees along the walk
    [8, 26, 48, 66, 82].forEach((x) => { c.px(x, 48, 1, 4, '#5a4030'); c.disc(x, 46, 2, '#3f8a4a'); });
    person(c, 36, 51, '#e05a4a', SKIN[0], 'ride');
    person(c, 58, 51, '#8e3fd0', SKIN[1], 'ride2');
    rider(c, 14, 51, '#f0b82a', 'ride2');
    // lunch on the lawn
    c.px(40, 57, 8, 4, '#3f6fd1'); c.px(42, 56, 2, 2, SKIN[2]); c.px(45, 58, 2, 2, '#ffffff');
    bird(c, 52, 12, '#e8e8f0', 'drift'); bird(c, 58, 16, '#e8e8f0', 'drift');
  },

  // 04 · a foggy trail through the eucalyptus above campus
  sf_forest(c, { GW, GH }) {
    c.bands(0, [[18, '#c4d2ca'], [12, '#aabcb2'], [10, '#90a89c'], [24, '#4a6454']]);
    // far trunks, pale in the mist
    for (let x = 3; x < GW; x += 7) { const lean = (x % 3) - 1; for (let y = 0; y < 40; y++) c.dot(x + Math.round((y / 40) * lean * 2), y, '#9fb0a6'); }
    // mid trunks
    [[10, 2], [24, 2], [58, 2], [74, 2]].forEach(([x, w], i) => {
      for (let y = 0; y < 48; y++) c.px(x + Math.round((y / 48) * (i % 2 ? -2 : 2)), y, w, 1, y % 9 < 3 ? '#b8a890' : '#8f8472');
    });
    // near trunks, peeling bark
    [[2, 4], [80, 5]].forEach(([x, w]) => {
      c.px(x, 0, w, 58, '#b9a88e');
      c.px(x + w - 1, 0, 1, 58, '#7a6a54');
      for (let y = 3; y < 58; y += 6) c.px(x + 1, y, 2, 3, '#ece0c8');
      for (let y = 6; y < 58; y += 10) c.px(x, y, 1, 4, '#6a5a44');
    });
    // hanging leaf clumps
    for (let i = 0; i < 80; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * 12), c.rand() > 0.5 ? '#5f7a66' : '#7a947e', 'sway');
    // the trail, winding up and away
    for (let y = 34; y < GH; y++) {
      const t = (y - 34) / (GH - 34);
      const cx = 44 + Math.round(8 * Math.sin(y / 6));
      const w = 2 + Math.round(t * 12);
      c.px(cx - w, y, w * 2, 1, y % 4 ? '#b89a72' : '#a88a64');
    }
    // ferns + blackberry understory
    for (let x = 0; x < GW; x += 3) {
      const base = 50 + (x % 5);
      const cx = 44 + Math.round(8 * Math.sin(base / 6));
      if (Math.abs(x - cx) < 10) continue;
      c.px(x, base, 1, GH - base, '#3f6a3a', 'sway'); c.dot(x - 1, base + 1, '#5a8a4a', 'sway'); c.dot(x + 1, base + 2, '#5a8a4a', 'sway');
    }
    c.px(0, 60, GW, 4, '#2f4a34');
    for (let x = 0; x < GW; x += 5) { const cx = 44 + Math.round(8 * Math.sin(61 / 6)); if (Math.abs(x - cx) > 12) c.px(x, 58, 3, 2, '#4a7a42'); }
    const tcx = 44 + Math.round(8 * Math.sin(61 / 6));
    c.px(tcx - 12, 60, 24, 4, '#b89a72');
    // walker + dog heading up
    person(c, 46, 48, '#d84a4a', SKIN[0]);
    dog(c, 40, 48, '#e0c48a');
    // mist bands + drips
    for (let y = 14; y < 46; y += 8) for (let x = -10; x < GW; x += 28) c.px(x + (y % 5) * 2, y, 16, 2, '#eef4f0', y % 2 ? 'drift' : 'drift2');
    for (let i = 0; i < 10; i++) c.dot(6 + Math.floor(c.rand() * 76), 14 + Math.floor(c.rand() * 30), '#ffffff', 'glint');
  },

  // 05 · the streetcar on a foggy morning block
  sf_njudah(c, { GW, GH, rider }) {
    c.bands(0, [[10, '#c2ccd6'], [8, '#d4dae0'], [4, '#e2e5e8']]);
    flats(c, 0, GW, 42, { hMin: 24, hVar: 10, seed: 1 });
    // sidewalk
    c.px(0, 42, GW, 4, '#c8c2b6');
    for (let x = 0; x < GW; x += 6) c.px(x, 42, 1, 4, '#b4aea0');
    // street + rails
    c.px(0, 46, GW, 18, '#5c5c64');
    c.px(0, 58, GW, 1, '#9a9aa2'); c.px(0, 61, GW, 1, '#9a9aa2');
    // overhead wire + poles
    c.px(0, 16, GW, 1, '#2a2a32');
    [4, 60].forEach((x) => c.px(x, 16, 1, 30, '#4a4a52'));
    // the streetcar
    const L = 'ride';
    c.px(14, 34, 60, 22, '#d6d9de', L);
    c.px(14, 34, 60, 2, '#a8adb6', L);
    c.px(14, 46, 60, 3, '#c8352e', L);
    for (let wx = 20; wx < 72; wx += 7) c.px(wx, 37, 5, 7, '#3a4a64', L);
    c.px(14, 37, 4, 12, '#eef0f2', L);
    c.px(15, 38, 3, 5, '#3a4a64', L);
    // destination sign with the route letter
    c.px(20, 35, 9, 2, '#1d1d2b', L);
    c.px(21, 35, 1, 2, '#ffb43a', L); c.px(22, 35, 1, 1, '#ffb43a', L); c.px(23, 36, 1, 1, '#ffb43a', L); c.px(24, 35, 1, 2, '#ffb43a', L);
    // doors + wheels
    c.px(40, 38, 5, 11, '#b8bcc4', L); c.px(42, 38, 1, 11, '#8a8e96', L);
    c.px(18, 55, 5, 3, '#1d1d2b', L); c.px(64, 55, 5, 3, '#1d1d2b', L);
    c.px(15, 50, 2, 2, '#ffe39a', L);
    // pantograph up to the wire
    c.px(38, 33, 8, 1, '#2a2a32', L);
    for (let i = 0; i < 8; i++) c.dot(40 + Math.round(i / 2), 32 - i, '#2a2a32', L);
    for (let i = 0; i < 7; i++) c.dot(44 - Math.round(i / 2), 24 - i, '#2a2a32', L);
    c.px(39, 17, 6, 1, '#2a2a32', L);
    c.dot(42, 17, '#bfe3ff', 'glint');
    rider(c, 70, 62, '#3fb8a8', 'ride2');
    // morning fog along the rooftops
    for (let x = -10; x < GW; x += 22) c.px(x, 8, 16, 2, '#eef0f2', 'drift');
  },

  // 06 · lit windows on the hill, late at night
  sf_nightshift(c, { GW, GH }) {
    c.bands(0, [[10, '#0f1433'], [10, '#1a2250'], [10, '#262f66']]);
    for (let i = 0; i < 18; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * 16), '#ffffff', 'twinkle');
    c.disc(12, 8, 3, '#f4f1dc');
    // the ridge and a little tower with its red lights
    sutro(c, 76, 6, 26, 10, { red: '#5a3a4a', white: '#4a4a66', back: '#3a3a55' });
    c.ridge(26, 3, 41, '#141a30', GH);
    // hillside
    c.silhouette((x) => 38 - Math.round(x / 12), '#1a2035');
    // the big building on the hill
    const bx = 14; const by = 14; const bw = 58; const bh = 42;
    c.px(bx, by, bw, bh, '#3a3f5c');
    c.px(bx + bw - 3, by, 3, bh, '#2e3250');
    c.px(bx - 1, by - 1, bw + 2, 1, '#50557a');
    for (let wy = by + 2; wy < by + bh - 3; wy += 4) {
      for (let wx = bx + 2; wx < bx + bw - 4; wx += 4) {
        const k = (wx * 13 + wy * 7) % 11;
        const col = k < 5 ? '#ffd98a' : k < 7 ? '#bfe3ff' : '#262a44';
        c.px(wx, wy, 2, 2, col, k === 2 || k === 6 ? 'twinkle' : undefined);
      }
    }
    // one window with a small figure and a lamp
    c.px(bx + 26, by + 22, 2, 2, '#ffe9b0'); c.dot(bx + 27, by + 23, '#3a2a2a');
    // lower wing
    c.px(4, 40, 12, 16, '#343852');
    for (let wy = 42; wy < 54; wy += 4) for (let wx = 6; wx < 14; wx += 4) c.px(wx, wy, 2, 2, '#ffd98a');
    // street, lamps, a slow car
    c.px(0, 56, GW, 8, '#16182a');
    for (let x = 0; x < GW; x += 10) c.px(x + 3, 60, 4, 1, '#3a3c55');
    [8, 44, 80].forEach((x) => { c.px(x, 48, 1, 8, '#4a4c66'); c.px(x - 1, 47, 3, 1, '#fff3c8', 'glow'); c.dot(x, 49, '#fff3c8', 'glow'); });
    c.px(30, 57, 8, 3, '#5a6a8a', 'ride'); c.px(31, 56, 5, 1, '#5a6a8a', 'ride'); c.dot(38, 58, '#ffe39a', 'ride');
    // a thin fog veil
    for (let x = -10; x < GW; x += 30) c.px(x, 30, 18, 1, '#8a90b8', 'drift2');
  },

  // 07 · Irving Street storefronts, close up
  sf_innersunset(c, { GW, GH, bike }) {
    c.bands(0, [[6, '#a7d3ef'], [6, '#d6ebf5']]);
    // fog bank sliding in over the rooftops
    c.px(0, 0, GW, 3, '#eef1f4');
    for (let x = -10; x < GW; x += 20) c.px(x, 3, 14, 2, '#f4f6f8', 'drift');
    const shops = [['#e8c8a0', '#d8453a'], ['#cfe0d4', '#2f7a5a'], ['#f2d6c4', '#f0b82a'], ['#d8d4ec', '#3f6fd1']];
    shops.forEach(([wall, awn], i) => {
      const x = i * 22; const top = 6 + (i % 2) * 3;
      c.px(x, top, 22, 38 - top, wall);
      c.px(x, top, 22, 2, '#f8f4ea'); c.px(x, top + 2, 22, 1, '#9a8e80');
      c.px(x + 21, top, 1, 38 - top, '#8a7e70');
      // bay window above the shop
      c.px(x + 4, top + 5, 14, 12, '#ffffff');
      c.px(x + 5, top + 6, 3, 10, '#6a86a8'); c.px(x + 9, top + 6, 4, 10, '#6a86a8'); c.px(x + 14, top + 6, 3, 10, '#6a86a8');
      // awning (scalloped)
      c.px(x + 1, 25, 20, 3, awn);
      for (let s = 1; s < 21; s += 2) c.dot(x + s, 28, awn);
      // shop window with warm light and a door
      c.px(x + 2, 29, 12, 9, '#ffe6a8');
      c.px(x + 2, 29, 12, 1, '#c8a060');
      c.px(x + 15, 29, 5, 9, '#5a3a2a'); c.dot(x + 16, 33, '#ffd23f');
      c.px(x + 4, 31, 8, 1, '#c89a5a');
    });
    // bowls + cups in the windows
    c.px(26, 34, 3, 2, '#ffffff'); c.px(31, 34, 3, 2, '#ffffff'); c.px(5, 33, 2, 3, '#8a5a3a'); c.px(9, 33, 2, 3, '#8a5a3a');
    c.px(48, 32, 2, 5, '#3f6fd1'); c.px(51, 32, 2, 5, '#e05a4a'); c.px(54, 32, 2, 5, '#f0b82a');
    c.dot(69, 31, '#e05a4a', 'twinkle'); c.dot(72, 33, '#4a9a6a', 'twinkle');
    // sidewalk with a table outside
    c.px(0, 38, GW, 8, '#c8c2b6');
    for (let x = 0; x < GW; x += 8) c.px(x, 38, 1, 8, '#b4aea0');
    c.px(34, 40, 6, 1, '#6a4a3a'); c.px(36, 41, 1, 3, '#6a4a3a'); c.dot(35, 39, '#ffffff');
    person(c, 30, 45, '#4a9a6a', SKIN[1]);
    person(c, 42, 45, '#f0b82a', SKIN[0]);
    person(c, 62, 46, '#8e3fd0', SKIN[2], 'ride');
    // a sidewalk tree
    c.px(80, 36, 1, 9, '#5a4030'); c.disc(80, 33, 4, '#3f7a4a'); c.disc(79, 31, 2, '#56904e');
    // street with rails
    c.px(0, 46, GW, 18, '#5a5a62');
    c.px(0, 54, GW, 1, '#8a8a92'); c.px(0, 57, GW, 1, '#8a8a92');
    for (let x = 2; x < GW; x += 12) c.px(x, 62, 6, 1, '#e8e4d8');
    bike(c, 14, 51, '#3f6fd1', 'ride2');
    c.px(15, 45, 2, 3, '#e05a4a', 'ride2'); c.px(15, 43, 2, 2, SKIN[0], 'ride2');
  },

  // 08 · a quiet lake in the park, afternoon
  sf_ggpark(c, { GW, GH, bird, glints }) {
    c.bands(0, [[8, '#5fb0ea'], [8, '#8fcaf0'], [8, '#c2e2f6']]);
    c.px(10, 5, 14, 2, '#ffffff', 'drift'); c.px(12, 4, 8, 1, '#ffffff', 'drift'); c.px(56, 9, 16, 2, '#ffffff', 'drift2');
    // big dark cypress + pine line
    c.silhouette((x) => 16 + Math.round(4 * Math.sin(x / 4.5) + 3 * Math.sin(x / 1.9) + (x % 17 < 5 ? -3 : 0)), '#2a4a32', 34);
    for (let i = 0; i < 60; i++) c.dot(Math.floor(c.rand() * GW), 14 + Math.floor(c.rand() * 16), '#3f6a44', 'sway');
    // meadow edge
    c.px(0, 30, GW, 4, '#6fae4a');
    // lake
    c.bands(34, [[4, '#4a7a6a'], [8, '#5a8f82'], [12, '#6aa39a']]);
    // reflections of the treeline
    for (let x = 0; x < GW; x += 2) c.px(x, 34, 1, 2 + (x % 5 < 2 ? 2 : 0), '#3a5a4a');
    glints(c, 38, 54, 14, '#e6fff6');
    // rowboat
    c.px(50, 44, 10, 2, '#b8452e', 'bob'); c.px(51, 46, 8, 1, '#8a3222', 'bob');
    c.px(54, 41, 2, 3, '#f0b82a', 'bob'); c.px(54, 39, 2, 2, SKIN[0], 'bob');
    c.px(48, 43, 3, 1, '#8a6a4a', 'bob'); c.px(59, 43, 3, 1, '#8a6a4a', 'bob');
    // ducks
    [[20, 48], [26, 50], [32, 47]].forEach(([x, y]) => { c.px(x, y, 3, 1, '#6a5a3a', 'peck'); c.dot(x + 2, y - 1, '#2f7a4a', 'peck'); c.dot(x + 3, y - 1, '#f0b82a', 'peck'); });
    // near shore: grass, a bench, a reader
    c.silhouette((x) => 56 + Math.round(1.5 * Math.sin(x / 8)), '#5a9a44');
    c.px(0, 60, GW, 4, '#4a8a3a');
    for (let x = 1; x < GW; x += 4) c.px(x, 55 + Math.round(1.5 * Math.sin(x / 8)), 1, 2, '#7cbc56', 'sway');
    c.px(66, 55, 12, 1, '#8a5e3c'); c.px(66, 53, 12, 1, '#8a5e3c'); c.px(67, 56, 1, 2, '#5a3e2a'); c.px(76, 56, 1, 2, '#5a3e2a');
    c.px(70, 50, 2, 4, '#3f6fd1'); c.px(70, 48, 2, 2, SKIN[2]); c.px(72, 51, 2, 2, '#ffffff');
    bird(c, 40, 8, '#2a3a4a', 'drift');
  },

  // 09 · the fog wall swallowing rows of houses
  sf_fogroll(c, { GW, GH, bird }) {
    c.bands(0, [[8, '#6fb4e6'], [8, '#98cbee'], [8, '#c4e0f2'], [8, '#dcecf6']]);
    c.disc(78, 7, 4, '#fff4c2');
    // one hill rising to the right, houses following its contour
    const top = (x) => 34 - x / 6;
    c.silhouette((x) => Math.round(top(x)), '#6a8a58');
    const cols = ['#d8d4ec', '#f2d6c4', '#cfe0d4', '#f5e6b0', '#f2c4c8', '#c8dcec', '#f8f0e0'];
    [7, 17, 27].forEach((d, r) => {
      for (let x = (r * 3) % 8 - 8; x < GW; x += 8) {
        const g = Math.round(top(x + 4)) + d;
        const h = 6 + ((x / 8 + r + 9) | 0) % 3;
        c.px(x, g - h, 7, h, cols[((x + 16) / 8 + r * 2 | 0) % cols.length]);
        c.px(x, g - h, 7, 1, '#fbf8f0');
        c.px(x + 1, g - h + 2, 2, 2, '#6a86a8'); c.px(x + 4, g - h + 2, 2, 2, '#6a86a8');
        c.px(x + 7, g - h, 1, h, '#5a7a4c');
      }
      // street below each row
      for (let x = 0; x < GW; x++) c.dot(x, Math.round(top(x)) + d + 1, '#9a9a94');
    });
    // the fog front, billowing in from the left (the ocean side)
    const fx = (y) => Math.round(30 + 6 * Math.sin(y / 4.3) + 3 * Math.sin(y / 1.9) + (y > 40 ? (40 - y) * 0.8 : 0));
    for (let y = 0; y < GH; y++) {
      c.px(0, y, fx(y), 1, '#eef1f4');
      c.px(0, y, fx(y) - 7, 1, '#e3e7eb');
    }
    for (let y = 4; y < 56; y += 7) c.disc(fx(y), y, 3, '#f4f6f8');
    // wisps running ahead of the bank
    for (let y = 6; y < 54; y += 5) for (let x = 16; x < 64; x += 26) c.px(x + (y % 7) * 2, y, 12, 2, '#f6f7f8', y % 2 ? 'drift' : 'drift2');
    // someone walking uphill ahead of it
    c.px(72, 43, 2, 3, '#e05a4a', 'ride'); c.px(72, 41, 2, 2, SKIN[0], 'ride');
    bird(c, 60, 12, '#3a4a6a', 'drift');
  },

  // 10 · a garden stairway climbing between houses
  sf_stairs(c, { GW, GH, bird }) {
    c.bands(0, [[6, '#f6c89a'], [5, '#f9dfb8'], [4, '#cfe4ef']]);
    // the view at the top: a strip of park green and far ocean
    c.px(0, 15, GW, 2, '#6aa0c8'); c.px(0, 17, GW, 2, '#3f6a44');
    c.px(0, 19, GW, 45, '#5a8a4a');
    // houses stepping up either side
    for (let i = 0; i < 5; i++) {
      const g = 60 - i * 9;
      c.px(0, g - 12, 22 - i * 2, 12, ['#f2d6c4', '#d8d4ec', '#cfe0d4', '#f5e6b0', '#f2c4c8'][i]);
      c.px(0, g - 12, 22 - i * 2, 1, '#f8f4ea');
      c.px(4, g - 9, 3, 4, '#6a86a8'); c.px(10, g - 9, 3, 4, i % 2 ? '#ffd98a' : '#6a86a8');
      c.px(66 + i * 2, g - 13, 22 - i * 2, 13, ['#c8dcec', '#f5e6b0', '#f2d6c4', '#cfe0d4', '#eadfcf'][i]);
      c.px(66 + i * 2, g - 13, 22 - i * 2, 1, '#f8f4ea');
      c.px(70 + i * 2, g - 10, 3, 4, '#6a86a8'); c.px(76 + i * 2, g - 10, 3, 4, '#6a86a8');
    }
    // hillside gardens behind the stairs
    c.silhouette((x) => 19 + Math.abs(x - 44) / 8, '#5a8a4a', GH, 'base', 18, 70);
    for (let i = 0; i < 90; i++) {
      const x = 18 + Math.floor(c.rand() * 50); const y = 22 + Math.floor(c.rand() * 42);
      c.dot(x, y, ['#7cbc56', '#3f7a3a', '#9ad06a'][i % 3], i % 4 ? undefined : 'sway');
    }
    for (let i = 0; i < 24; i++) c.dot(20 + Math.floor(c.rand() * 46), 24 + Math.floor(c.rand() * 38), ['#ff8fc4', '#ffd23f', '#e05a4a', '#ffffff'][i % 4], 'twinkle');
    // the stairway: concrete flights zigzagging up
    for (let i = 0; i < 22; i++) {
      const y = 62 - i * 2;
      const x = 34 + Math.round(6 * Math.sin(i / 3.5));
      c.px(x, y, 12, 2, i % 2 ? '#d8d2c4' : '#e8e2d4');
      c.px(x, y + 1, 12, 1, '#a8a294');
    }
    // handrail
    for (let i = 0; i < 22; i++) { const x = 34 + Math.round(6 * Math.sin(i / 3.5)); c.dot(x + 12, 60 - i * 2, '#5a5a66'); if (i % 3 === 0) c.px(x + 12, 60 - i * 2, 1, 3, '#5a5a66'); }
    // a climber halfway up
    person(c, 42 + Math.round(6 * Math.sin(10 / 3.5)) - 6, 42, '#3f6fd1', SKIN[1]);
    // a cat on a wall
    c.px(20, 44, 3, 2, '#3a3a44'); c.dot(22, 43, '#3a3a44'); c.dot(19, 43, '#3a3a44', 'sway');
    bird(c, 50, 6, '#6a4a3a', 'drift'); bird(c, 58, 4, '#6a4a3a', 'drift');
  },

  // 11 · sunset at the end of the line
  sf_oceanbeach(c, { GW, GH, glints, waves, bird }) {
    c.bands(0, [[6, '#3a3a88'], [6, '#8a4f9e'], [6, '#e06a7a'], [6, '#f79a5a'], [4, '#ffd07a']]);
    c.disc(40, 28, 6, '#fff0b0');
    c.bands(28, [[5, '#6a4f8a'], [6, '#4a4f8a'], [7, '#3a4a7a']]);
    for (let y = 29; y < 44; y += 2) c.px(36 + (y % 3), y, 9 - Math.round((y - 29) / 3), 1, '#ffd98a', 'glint');
    glints(c, 30, 44, 10, '#ffe6c0');
    // surf lines
    waves(c, 40, '#f4e8f0'); waves(c, 43, '#f4e8f0');
    c.px(0, 45, GW, 2, '#f4e8f0');
    c.px(0, 46, GW, 2, '#e8d8e4', 'waves');
    // wet sand then dry sand
    c.px(0, 47, GW, 5, '#b89a8a');
    c.px(0, 52, GW, 12, '#e0c89a');
    for (let i = 0; i < 40; i++) c.dot(Math.floor(c.rand() * GW), 53 + Math.floor(c.rand() * 11), '#c8ae80');
    // reflections of people on wet sand
    person(c, 22, 51, '#e05a4a', SKIN[1]);
    c.px(22, 52, 2, 1, '#8a6a70');
    dog(c, 27, 51, '#3a2a2a', 'ride');
    person(c, 50, 58, '#f0b82a', SKIN[0]);
    person(c, 53, 58, '#3fb8a8', SKIN[2]);
    // surfers
    c.px(14, 38, 5, 1, '#ffd23f', 'bob'); c.px(16, 36, 1, 2, '#1d1d2b', 'bob');
    c.px(66, 40, 5, 1, '#ff6b4a', 'bob'); c.px(68, 38, 1, 2, '#1d1d2b', 'bob');
    // seawall and the streetcar waiting at the end of the line
    c.px(62, 54, 26, 10, '#9a8e86');
    c.px(62, 54, 26, 1, '#b8aca2');
    for (let x = 64; x < GW; x += 6) c.px(x, 57, 1, 7, '#8a7e76');
    c.px(67, 44, 21, 10, '#d6d9de');
    c.px(67, 44, 21, 1, '#a8adb6');
    c.px(67, 45, 1, 8, '#c4c8ce');
    c.px(68, 46, 3, 3, '#ffd98a');
    for (let wx = 72; wx < GW; wx += 4) c.px(wx, 46, 3, 3, '#ffd98a', 'twinkle');
    c.px(67, 50, 21, 1, '#c8352e');
    c.dot(67, 52, '#ffe39a', 'glow');
    c.px(69, 53, 4, 2, '#1d1d2b'); c.px(82, 53, 4, 2, '#1d1d2b');
    c.px(75, 43, 6, 1, '#2a2a32'); c.px(76, 42, 4, 1, '#4a4a52');
    bird(c, 60, 12, '#3a2a4a', 'drift'); bird(c, 66, 15, '#3a2a4a', 'drift'); bird(c, 20, 10, '#3a2a4a', 'drift2');
  },

  // 12 · the reading room window, fog over the treetops
  sf_library(c, { GW, GH }) {
    // warm wall
    c.px(0, 0, GW, GH, '#d8c8a8');
    for (let y = 0; y < 44; y += 6) c.px(0, y, GW, 1, '#ccbc9c');
    // the big window
    const wx = 10; const wy = 4; const ww = 68; const wh = 36;
    c.px(wx - 2, wy - 2, ww + 4, wh + 4, '#6a5a4a');
    c.bands(wy, [[8, '#b8c2cc'], [8, '#cad2da'], [4, '#dadfe4']]);
    c.px(0, 0, wx - 2, GH, '#d8c8a8'); c.px(wx + ww + 2, 0, GW - wx - ww - 2, GH, '#d8c8a8');
    c.px(0, 0, GW, wy - 2, '#d8c8a8');
    c.px(wx - 2, wy - 2, ww + 4, 2, '#6a5a4a');
    c.px(wx - 2, wy - 2, 2, wh + 4, '#6a5a4a'); c.px(wx + ww, wy - 2, 2, wh + 4, '#6a5a4a');
    // the view: rooftops then treetops of the park, far hills in haze
    c.silhouette((x) => (x >= wx && x < wx + ww ? 20 + Math.round(2 * Math.sin(x / 7)) : GH), '#9aa8a8', wy + wh, 'base', wx, wx + ww);
    c.silhouette((x) => (x >= wx && x < wx + ww ? 26 + Math.round(3 * Math.sin(x / 3.3) + 2 * Math.sin(x / 1.7)) : GH), '#3a5a44', wy + wh, 'base', wx, wx + ww);
    for (let i = 0; i < 50; i++) c.dot(wx + Math.floor(c.rand() * ww), 26 + Math.floor(c.rand() * 12), '#4f7458');
    // fog moving across, inside the glass only
    for (let y = 12; y < 36; y += 5) for (let x = wx; x < wx + ww - 16; x += 26) c.px(x + (y % 7), y, 14, 2, '#f0f2f4', y % 2 ? 'drift' : 'drift2');
    // mullions (drawn on a top layer so the fog passes behind them)
    c.px(wx + 22, wy, 2, wh, '#6a5a4a', 'frame');
    c.px(wx + 45, wy, 2, wh, '#6a5a4a', 'frame');
    c.px(wx, wy + 17, ww, 2, '#6a5a4a', 'frame');
    // walls beside the window glass, repainted over any drifting fog
    c.px(0, wy, wx - 2, wh, '#d8c8a8', 'frame'); c.px(wx + ww + 2, wy, GW - wx - ww - 2, wh, '#d8c8a8', 'frame');
    c.px(wx - 2, wy, 2, wh, '#6a5a4a', 'frame'); c.px(wx + ww, wy, 2, wh, '#6a5a4a', 'frame');
    // sill + a small plant
    c.px(wx - 4, wy + wh + 2, ww + 8, 2, '#8a6a4a');
    c.px(64, 38, 4, 4, '#c46a3e'); c.px(65, 34, 1, 4, '#4a8a3a', 'sway'); c.dot(64, 35, '#5aa04a', 'sway'); c.dot(66, 36, '#5aa04a', 'sway');
    // long desk
    c.px(0, 48, GW, 3, '#8a5e3c'); c.px(0, 51, GW, 13, '#5a3e2a');
    c.px(0, 51, GW, 1, '#6e4a30');
    // lamp with a warm pool of light
    c.px(14, 40, 1, 8, '#2f4a3a'); c.px(11, 38, 8, 2, '#2f7a4a'); c.px(12, 40, 6, 1, '#ffe9a8', 'glow');
    c.px(8, 47, 16, 1, '#ffe9a8', 'glow');
    // books, a mug, an open notebook
    c.px(28, 42, 3, 6, '#d8453a'); c.px(31, 43, 3, 5, '#3f6fd1'); c.px(34, 41, 2, 7, '#f0b82a');
    c.px(44, 46, 14, 2, '#f8f4ea'); c.px(51, 46, 1, 2, '#c8c0b0'); for (let x = 45; x < 57; x += 2) c.dot(x, 46, '#9aa0b8');
    c.px(66, 44, 3, 4, '#f2f0ea'); c.dot(69, 45, '#f2f0ea'); c.dot(67, 42, '#ffffff', 'drift2'); c.dot(66, 41, '#ffffff', 'drift2');
    // the reader, from behind
    c.px(74, 40, 8, 8, '#6b5aa8'); c.px(76, 36, 4, 4, '#3a2a22'); c.px(73, 44, 2, 4, '#6b5aa8');
  },
};
