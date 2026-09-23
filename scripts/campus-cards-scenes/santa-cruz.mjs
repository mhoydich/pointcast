// Campus Cards · Set 10 · Santa Cruz — scenes. Unofficial, places only, CC0.
// Set data (titles, rarities, flavor) lives in src/data/campus-cards.json.

// ---------------------------------------------------------------- helpers
const BARK = ['#9a4a2c', '#b35d36', '#6a2f1e', '#c8744a'];

// A redwood trunk: flat face, shaded right edge, lit left edge, vertical furrows.
function trunk(c, x, w, top, bottom, pal = BARK, flare = true) {
  const [mid, lit, dark, hi] = pal;
  c.px(x, top, w, bottom - top, mid);
  c.px(x, top, 1, bottom - top, lit);
  c.px(x + w - Math.max(1, Math.floor(w / 4)), top, Math.max(1, Math.floor(w / 4)), bottom - top, dark);
  for (let fx = x + 2; fx < x + w - 2; fx += 3) {
    for (let y = top; y < bottom; y++) if ((y * 7 + fx * 3) % 11 < 7) c.dot(fx, y, dark);
  }
  for (let y = top + 3; y < bottom; y += 9) c.dot(x + 1, y, hi);
  if (flare) { c.px(x - 1, bottom - 4, w + 2, 4, mid); c.px(x - 2, bottom - 2, w + 4, 2, mid); c.px(x + w - 1, bottom - 4, 3, 4, dark); }
}

// A spray of redwood foliage: a few stacked, drooping horizontal tufts.
function spray(c, x, y, w, dark = '#1d4a2c', mid = '#2e6b3c', layer) {
  c.px(x, y, w, 2, dark, layer);
  c.px(x + 1, y - 1, w - 2, 1, mid, layer);
  c.dot(x - 1, y + 2, dark, layer); c.dot(x + w, y + 2, dark, layer);
}

function person(c, x, y, shirt, skin = '#e0aa80', layer) {
  c.px(x, y - 4, 2, 4, shirt, layer);
  c.px(x, y - 6, 2, 2, skin, layer);
  c.dot(x, y, '#2a2a36', layer); c.dot(x + 1, y, '#2a2a36', layer);
}

function deer(c, x0, y0, grazing = false, body = '#9a6a42', dark = '#6a4428', layer, s = 1) {
  const q = { px: (x, y, w, h, col, l) => c.px(x0 + (x - x0) * s, y0 + (y - y0) * s, w * s, h * s, col, l), dot: (x, y, col, l) => c.px(x0 + (x - x0) * s, y0 + (y - y0) * s, s, s, col, l) };
  deerAt(q, x0, y0, grazing, body, dark, layer);
}
function deerAt(c, x, y, grazing, body, dark, layer) {
  // body
  c.px(x, y - 5, 8, 3, body, layer);
  c.px(x + 1, y - 2, 6, 1, '#e9dcc4', layer); // pale belly
  c.dot(x - 1, y - 5, '#f2ece0', layer); // white tail flag
  // legs
  [[x, y - 2], [x + 1, y - 2], [x + 6, y - 2], [x + 7, y - 2]].forEach(([lx, ly]) => c.px(lx, ly, 1, 3, dark, layer));
  if (grazing) {
    c.px(x + 8, y - 4, 1, 3, body, layer);
    c.px(x + 9, y - 2, 2, 2, body, layer);
    c.dot(x + 10, y - 1, '#2a2a2a', layer);
    c.dot(x + 8, y - 5, dark, layer);
  } else {
    c.px(x + 7, y - 8, 2, 3, body, layer);
    c.px(x + 8, y - 9, 3, 2, body, layer);
    c.dot(x + 11, y - 8, '#2a2a2a', layer);
    c.dot(x + 7, y - 10, dark, layer); c.dot(x + 8, y - 11, dark, layer);
  }
}

function fern(c, x, y, dark = '#3f7a34', lit = '#5c9a44', layer = 'sway') {
  c.px(x, y - 3, 1, 3, dark, layer);
  c.dot(x - 1, y - 2, lit, layer); c.dot(x + 1, y - 2, lit, layer);
  c.dot(x - 2, y - 1, dark, layer); c.dot(x + 2, y - 1, dark, layer);
}

// ---------------------------------------------------------------- scenes
export const scenes = {
  // 01 · The redwoods: looking into the forest, a pale building between trunks.
  sc_redwoods(c, { GW, GH, bird }) {
    c.bands(0, [[6, '#bfe4d8'], [6, '#9fd0b8'], [6, '#7cb895'], [8, '#4f8f64'], [38, '#2f6a45']]);
    // distant trunks in the green haze
    [[4, 3], [22, 2], [58, 3], [79, 2]].forEach(([x, w]) => c.px(x, 0, w, 52, '#6f7a5a'));
    // the canopy
    for (let i = 0; i < 26; i++) spray(c, Math.floor(c.rand() * GW) - 4, Math.floor(c.rand() * 16), 6 + Math.floor(c.rand() * 8), '#1d4a2c', '#2e6b3c');
    // a pale building with long ribbon windows, set between the trunks
    c.px(24, 30, 42, 26, '#d9d6c8');
    c.px(22, 28, 46, 2, '#aaa697'); c.px(22, 41, 46, 1, '#aaa697');
    c.px(24, 33, 42, 4, '#4a6a78'); c.px(24, 44, 42, 4, '#4a6a78');
    for (let x = 26; x < 66; x += 5) { c.px(x, 33, 1, 4, '#d9d6c8'); c.px(x, 44, 1, 4, '#d9d6c8'); }
    c.px(40, 49, 8, 7, '#4a6a78'); c.px(43, 49, 1, 7, '#d9d6c8');
    c.px(24, 30, 42, 1, '#ebe8dc'); c.px(62, 30, 4, 26, '#bdb9aa');
    [[29, 34], [48, 45], [55, 34], [34, 45]].forEach(([x, y]) => c.px(x, y, 2, 2, '#ffe39a', 'twinkle'));
    // big trunks, near and far
    trunk(c, 12, 9, 0, 56);
    trunk(c, 64, 12, 0, 57);
    trunk(c, 44, 5, 0, 28, ['#8a4a30', '#a15a38', '#6a3522', '#b86a44'], false);
    trunk(c, 0, 5, 0, 58);
    trunk(c, 82, 6, 0, 58);
    // sun shafts
    for (let i = 0; i < 2; i++) for (let y = 0; y < 28; y++) if (y % 3) c.dot(26 + i * 26 + Math.floor(y / 3), y, '#f4f2c0', 'glow');
    // duff floor and path
    c.px(0, 56, GW, 8, '#6a4a30');
    for (let i = 0; i < 70; i++) c.dot(Math.floor(c.rand() * GW), 56 + Math.floor(c.rand() * 8), c.rand() > 0.5 ? '#8a6040' : '#4e3622');
    c.px(24, 55, 40, 3, '#b89a70');
    c.px(18, 58, 52, 2, '#a88a62');
    for (let x = 2; x < GW; x += 6) if (x < 12 || x > 76 || (x > 22 && x < 26)) fern(c, x, 58);
    person(c, 32, 60, '#f0b82a', '#e0aa80', 'ride');
    person(c, 54, 61, '#3f6fd1', '#8a5a3a', 'ride2');
    bird(c, 36, 6, '#1d3a26', 'drift');
  },

  // 02 · The great meadow: golden slope down to the bay.
  sc_meadow(c, { GW, GH, glints, bird }) {
    c.bands(0, [[8, '#7ec3ee'], [7, '#a6d6f2'], [5, '#d3e9f0'], [4, '#f3e6c4']]);
    c.disc(72, 9, 4, '#fff4c8');
    // far peninsula across the bay
    c.silhouette((x) => 22 - Math.round(2 * Math.sin((x - 20) / 10) + (x > 50 ? 1 : 0)), '#8a9cb8', 24, 'base', 30, GW);
    c.bands(23, [[3, '#3f86c4'], [4, '#4f98d0'], [3, '#63a8d8']]);
    glints(c, 23, 32, 12, '#ffffff');
    // town at the shoreline
    c.px(0, 31, GW, 6, '#7a8c7a');
    for (let x = 2; x < GW; x += 4) c.px(x, 30 - (x % 3), 2, 1 + (x % 3), ['#f2efe6', '#e8c9a8', '#d8dde2'][x % 3]);
    // tree line
    c.silhouette((x) => 34 - Math.round(2 * Math.sin(x / 3) + (x % 7 < 2 ? 1 : 0)), '#3d6a3a');
    // the meadow, rising to the right
    c.silhouette((x) => 36 + Math.round((GW - x) / 7) - Math.round(Math.sin(x / 9) * 1.5), '#c9a650');
    c.silhouette((x) => 44 + Math.round((GW - x) / 6) - Math.round(Math.sin(x / 9) * 1.5), '#b8923e');
    c.silhouette((x) => 54 + Math.round((GW - x) / 10), '#a88035');
    for (let x = 0; x < GW; x += 2) { const t = 40 + Math.round((GW - x) / 7); c.dot(x, t + (x % 5), '#e3c778', 'sway'); }
    // a path winding down
    for (let y = 40; y < GH; y++) c.px(56 - Math.round((y - 40) * 0.9) + Math.round(3 * Math.sin(y / 5)), y, 2 + Math.floor((y - 40) / 8), 1, '#d9c9a0');
    // lone oak
    c.px(20, 38, 2, 9, '#4a3526'); c.disc(21, 36, 5, '#3e5a2e'); c.disc(19, 34, 3, '#4f6e38');
    person(c, 48, 50, '#e05a4a', '#e0aa80', 'bob');
    person(c, 51, 51, '#3fb8a8', '#8a5a3a');
    bird(c, 30, 8); bird(c, 36, 10);
  },

  // 03 · Steamer Lane: surfers below the lighthouse, cliff rail on the right.
  sc_steamer(c, { GW, GH, glints, waves }) {
    c.bands(0, [[8, '#6fbcf0'], [8, '#98d0f4'], [6, '#c7e7f7']]);
    c.silhouette((x) => 21 - Math.round(1.5 * Math.sin(x / 8)), '#9aabbf', 22, 'base', 0, 50);
    c.bands(22, [[6, '#1f6fb0'], [8, '#2a84c4'], [10, '#3a9ad4'], [18, '#48a8dc']]);
    glints(c, 22, 44, 16, '#ffffff');
    // a breaking wave rolling in from the left
    for (let x = 0; x < 58; x++) {
      const y = 40 - Math.round(x * 0.12);
      c.px(x, y, 1, 2, '#e8f7ff');
      if (x % 3 === 0) c.dot(x, y - 1, '#ffffff', 'waves');
    }
    c.px(0, 42, 50, 3, '#8fd0ee');
    for (let y = 46; y < 60; y += 4) waves(c, y, '#dff3ff', 'waves', 0, 54);
    // the cliff with its rail, and a little lighthouse on the point
    c.silhouette((x) => (x < 56 ? GH : 34 - Math.round((x - 56) / 10)), '#b58a5a');
    c.silhouette((x) => (x < 58 ? GH : 38 - Math.round((x - 56) / 10)), '#946a42', GH, 'base', 58, GW);
    c.silhouette((x) => (x < 56 ? GH : 32 - Math.round((x - 56) / 10)), '#6a9a4a', 35, 'base', 56, GW);
    for (let y = 40; y < GH; y += 5) c.px(58 + (y % 3), y, 3, 1, '#7a5230');
    c.px(62, 27, GW - 62, 1, '#e8e2d6');
    for (let x = 62; x < GW; x += 4) c.px(x, 27, 1, 4, '#e8e2d6');
    const lx = 76;
    c.px(lx, 14, 6, 16, '#a8543a');
    c.px(lx + 4, 14, 2, 16, '#8a4230');
    for (let y = 17; y < 30; y += 3) c.px(lx, y, 4, 1, '#bf6a4a');
    c.px(lx - 1, 13, 8, 1, '#3a3a44');
    c.px(lx + 1, 9, 4, 4, '#f4f1e6'); c.px(lx + 2, 10, 2, 2, '#ffe39a', 'glow');
    c.px(lx + 1, 7, 4, 2, '#3a3a44'); c.dot(lx + 3, 6, '#3a3a44');
    // watchers at the rail
    person(c, 66, 30, '#e05a4a'); person(c, 70, 30, '#1d1d2b', '#8a5a3a');
    // surfers in the lineup and one on a wave
    [[12, 36], [22, 35], [32, 34]].forEach(([x, y]) => { c.px(x, y, 5, 1, '#f4f1e6', 'bob'); c.px(x + 2, y - 2, 1, 2, '#1d1d2b', 'bob'); });
    c.px(36, 38, 6, 1, '#ffd23f'); c.px(38, 35, 2, 3, '#1d1d2b'); c.px(37, 34, 1, 1, '#1d1d2b'); c.px(40, 34, 1, 1, '#1d1d2b');
    c.px(42, 37, 3, 1, '#ffffff', 'glint');
  },

  // 04 · Lime kilns: mossy stone kilns in a dim green wood.
  sc_kilns(c, { GW, GH }) {
    c.bands(0, [[10, '#3f6a48'], [10, '#34603f'], [44, '#2a4e34']]);
    for (let i = 0; i < 120; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * 24), c.rand() > 0.5 ? '#4f7f52' : '#22452c', 'sway');
    trunk(c, 2, 7, 0, 50, ['#7a3e28', '#8f4c30', '#52261a', '#a45a3a']);
    trunk(c, 76, 9, 0, 50, ['#7a3e28', '#8f4c30', '#52261a', '#a45a3a']);
    trunk(c, 60, 4, 0, 36, ['#5f4032', '#6e4a3a', '#473024', '#7d5644'], false);
    // light shaft
    for (let y = 0; y < 22; y++) if (y % 3) { c.dot(34 + Math.floor(y / 4), y, '#d8ecb0', 'glow'); c.dot(37 + Math.floor(y / 4), y, '#d8ecb0', 'glow'); }
    // hillside the kilns are built into
    c.silhouette((x) => 26 + Math.round(3 * Math.sin(x / 11)), '#3a5a36', 50);
    // two stone kilns
    [[8, 22], [48, 20]].forEach(([x, w]) => {
      c.px(x, 24, w, 26, '#9a9488');
      for (let y = 25; y < 50; y += 3) for (let sx = x + ((y / 3) % 2 ? 0 : 2); sx < x + w; sx += 4) c.px(sx, y, 3, 2, (sx + y) % 3 ? '#aaa498' : '#8a8478');
      c.px(x + w - 2, 24, 2, 26, '#7a7468');
      // arched firing opening
      const ax = x + Math.floor(w / 2) - 4;
      c.px(ax, 38, 8, 12, '#1c1a18'); c.px(ax + 1, 36, 6, 2, '#1c1a18'); c.px(ax + 2, 35, 4, 1, '#1c1a18');
      c.px(ax - 1, 35, 1, 15, '#c0b8a8'); c.px(ax + 8, 35, 1, 15, '#c0b8a8');
      // moss on the top and dribbling down
      c.px(x - 1, 22, w + 2, 3, '#5a8a3a');
      for (let mx = x; mx < x + w; mx += 3) c.px(mx, 25, 1, 2 + (mx % 4), '#6a9a44');
      c.dot(x + 3, 30, '#6a9a44'); c.dot(x + w - 5, 33, '#6a9a44');
    });
    // the hill banks up against both kilns
    c.silhouette((x) => 34 + Math.round(8 * Math.abs(Math.sin((x - 8) / 12.5))), '#34522f', 50, 'base', 30, 48);
    for (let x = 31; x < 47; x += 3) fern(c, x, 44 + (x % 4), '#3f7a34', '#5c9a44');
    // forest floor
    c.px(0, 50, GW, 14, '#4a3a26');
    for (let i = 0; i < 60; i++) c.dot(Math.floor(c.rand() * GW), 50 + Math.floor(c.rand() * 14), c.rand() > 0.5 ? '#6a5236' : '#35291a');
    for (let x = 1; x < GW; x += 5) fern(c, x, 54 + (x % 3), '#3f7a34', '#5c9a44');
    c.px(34, 53, 10, 3, '#b8a07a');
    person(c, 38, 54, '#f0b82a');
  },

  // 05 · The quarry: pale limestone walls around a grass floor.
  sc_quarry(c, { GW, GH, bird }) {
    c.bands(0, [[8, '#5fb4ee'], [10, '#86c6f2']]);
    // trees on the rim
    c.silhouette((x) => 12 - Math.round(3 * Math.sin(x / 3.4) + 2 * Math.sin(x / 1.6)), '#2f5a36', 20);
    [[10, 3], [70, 4]].forEach(([x, w]) => { c.px(x, 0, w, 16, '#8a4a30'); spray(c, x - 3, 2, w + 6); spray(c, x - 2, 7, w + 4); });
    // the quarry walls: stepped pale rock, lit left, shaded right
    c.px(0, 16, GW, 30, '#e4dcc8');
    c.silhouette((x) => (x < 30 ? 16 + Math.round(x / 3) : GH), '#efe8d6', 46, 'base', 0, 30);
    c.silhouette((x) => (x > 58 ? 16 + Math.round((GW - x) / 3) : GH), '#bfb5a0', 46, 'base', 58, GW);
    for (let y = 20; y < 46; y += 5) { c.px(0, y, GW, 1, '#cfc5ae'); for (let x = (y % 10); x < GW; x += 13) c.px(x, y + 1, 1, 3, '#b4aa94'); }
    // vines and scrub clinging on
    for (let i = 0; i < 34; i++) c.px(Math.floor(c.rand() * GW), 18 + Math.floor(c.rand() * 24), 2, 1, c.rand() > 0.5 ? '#6a8a44' : '#4f7036');
    // back wall shadow band
    c.px(24, 34, 40, 12, '#d4cab4');
    // afternoon shadow falling across the right wall
    c.silhouette((x) => (x > 50 ? 46 - Math.round((x - 50) * 0.8) : GH), '#a89e8a', 46, 'base', 50, GW);
    // grass floor with a curved lip where the walls meet it
    c.px(0, 46, GW, 18, '#6aa048');
    c.silhouette((x) => 44 + Math.round(2 * ((x - 44) / 44) ** 2 * -1 + 2), '#5a8a3e', 47);
    for (let y = 48; y < GH; y += 5) c.px(0, y, GW, 2, '#78ae52');
    // people sitting in a loose circle
    [[20, 52, '#e05a4a'], [30, 56, '#f0b82a'], [44, 50, '#3f6fd1'], [56, 55, '#ff8fc4'], [66, 51, '#3fb8a8'], [40, 58, '#8e3fd0']].forEach(([x, y, col], i) => {
      c.px(x, y, 2, 2, col); c.px(x, y - 2, 2, 2, i % 2 ? '#8a5a3a' : '#e0aa80', i % 3 ? undefined : 'bob');
    });
    c.px(38, 53, 6, 3, '#e8e2d6'); // a blanket
    bird(c, 40, 5, '#1b2440', 'drift'); bird(c, 48, 3, '#1b2440', 'drift');
  },

  // 06 · The boardwalk: dusk, a wooden coaster lattice over the beach.
  sc_boardwalk(c, { GW, GH, glints, waves }) {
    c.bands(0, [[8, '#2e2a6a'], [7, '#6a3f8a'], [7, '#c85a86'], [6, '#f0885a'], [10, '#ffc46a']]);
    c.dot(10, 3, '#ffffff', 'twinkle'); c.dot(60, 5, '#ffffff', 'twinkle');
    // coaster lattice: white wooden bents with a hill-shaped track
    const track = (x) => 14 + Math.round(10 * Math.abs(Math.sin((x + 6) / 14)));
    for (let x = 0; x < GW; x += 4) {
      const t = track(x);
      c.px(x, t, 1, 42 - t, '#e8e0cc');
      for (let y = t + 3; y < 42; y += 5) c.px(x, y, 4, 1, '#cfc6b0');
      if (x % 8 === 0) for (let s = 0; s < 4; s++) c.dot(x + s, Math.min(41, t + 2 + s * 3), '#bdb49e');
    }
    for (let x = 0; x < GW; x++) { const t = track(x); c.px(x, t - 1, 1, 2, '#f4efe0'); }
    // a train cresting a hill
    const cx = 34; const ct = track(cx);
    ['#e0453a', '#ffd23f', '#3f6fd1'].forEach((col, i) => { const tx = cx + i * 4; c.px(tx, track(tx) - 3, 3, 2, col); c.dot(tx + 1, track(tx) - 4, '#e0aa80'); });
    c.dot(cx + 1, ct - 5, '#e0aa80', 'bob');
    // arcade front with bulb strings
    c.px(0, 38, GW, 8, '#f2e3c4');
    for (let x = 0; x < GW; x += 10) { c.px(x, 38, 5, 8, '#e05a6a'); c.px(x + 5, 38, 5, 8, '#f7f0dc'); }
    c.px(0, 37, GW, 1, '#8a3a2a');
    for (let x = 1; x < GW; x += 3) c.dot(x, 36 + (x % 2), ['#ffe39a', '#ff8fc4', '#9ae6ff'][x % 3], 'twinkle');
    for (let x = 6; x < GW; x += 12) c.px(x, 41, 4, 5, '#3a2a3a');
    // beach and surf
    c.px(0, 46, GW, 6, '#e8c89a');
    c.bands(52, [[4, '#7a5a8e'], [8, '#4f5a8e']]);
    for (let y = 53; y < GH; y += 2) c.px(22 + (y % 4), y, 10 - (y - 53) / 2, 1, '#ffcf8a', 'glint');
    waves(c, 52, '#f4d8e0'); waves(c, 57, '#c8b8d8');
    glints(c, 54, 63, 6, '#ffe7c0', 'twinkle');
    [[14, '#1d1d2b'], [60, '#1d1d2b'], [64, '#1d1d2b']].forEach(([x, col]) => c.px(x, 46, 1, 3, col));
    c.dot(14, 45, '#1d1d2b'); c.dot(60, 45, '#1d1d2b'); c.dot(64, 45, '#1d1d2b');
  },

  // 07 · The old barns: weathered ranch buildings in morning grass.
  sc_barns(c, { GW, GH, bird }) {
    c.bands(0, [[10, '#9fd4f4'], [8, '#c4e5f6'], [6, '#e6f2f2']]);
    // redwoods on the ridge behind
    c.silhouette((x) => 16 - Math.round(4 * Math.abs(Math.sin(x / 3.3)) + 2 * Math.sin(x / 9)), '#2a5236', 34);
    c.silhouette((x) => 24 - Math.round(2 * Math.sin(x / 5)), '#3a6a3e', 34);
    c.px(0, 34, GW, 30, '#7fae52');
    for (let y = 36; y < GH; y += 4) c.px(0, y, GW, 1, '#8cbc5c');
    // big barn: weathered boards, gable roof
    const bx = 10; const bw = 36;
    c.px(bx, 24, bw, 22, '#9a7a60');
    for (let x = bx + 1; x < bx + bw; x += 3) c.px(x, 24, 1, 22, '#7e6048');
    for (let i = 0; i < 9; i++) c.px(bx - 2 + i * 2, 23 - i, bw + 4 - i * 4, 1, i % 2 ? '#6a5a50' : '#7a6a5e');
    c.px(bx + 13, 32, 10, 14, '#4a3526'); c.px(bx + 13, 32, 10, 1, '#e8e0cc'); c.px(bx + 17, 32, 1, 14, '#e8e0cc');
    for (let i = 0; i < 10; i++) { c.dot(bx + 13 + i, 33 + i, '#e8e0cc'); c.dot(bx + 22 - i, 33 + i, '#e8e0cc'); }
    c.px(bx + 15, 18, 6, 4, '#3a2a20'); c.px(bx + 16, 19, 4, 2, '#e8d2a0');
    // smaller shed
    const sx = 54;
    c.px(sx, 32, 22, 14, '#b0906e');
    for (let x = sx + 1; x < sx + 22; x += 3) c.px(x, 32, 1, 14, '#907258');
    for (let i = 0; i < 5; i++) c.px(sx - 1 + i * 2, 31 - i, 24 - i * 4, 1, '#8a5e48');
    c.px(sx + 4, 36, 4, 4, '#3a3a44'); c.px(sx + 13, 38, 5, 8, '#5a4030');
    // split-rail fence across the front
    for (let x = 0; x < GW; x += 9) c.px(x, 48, 1, 7, '#8a6a4a');
    c.px(0, 50, GW, 1, '#a88a62'); c.px(0, 53, GW, 1, '#a88a62');
    // wildflowers and a cyclist on the road
    for (let i = 0; i < 26; i++) c.dot(Math.floor(c.rand() * GW), 56 + Math.floor(c.rand() * 3), ['#ffd23f', '#ff8fc4', '#ffffff'][i % 3], 'sway');
    c.px(0, 59, GW, 5, '#9a978f');
    for (let x = 3; x < GW; x += 9) c.px(x, 61, 4, 1, '#f2f2f2');
    bird(c, 60, 8); bird(c, 66, 6); bird(c, 70, 9);
  },

  // 08 · Ravine bridges: a wooden footbridge over a fern gully.
  sc_bridges(c, { GW, GH, rider }) {
    c.bands(0, [[8, '#a8d8c0'], [8, '#7cb896'], [48, '#2f5e3e']]);
    for (let i = 0; i < 20; i++) spray(c, Math.floor(c.rand() * GW) - 3, Math.floor(c.rand() * 14), 5 + Math.floor(c.rand() * 7));
    trunk(c, 6, 8, 0, 34);
    trunk(c, 70, 10, 0, 32);
    trunk(c, 52, 4, 0, 30, ['#7a4a34', '#8a5a40', '#5a3424', '#9a6a4a'], false);
    trunk(c, 26, 3, 0, 30, ['#7a4a34', '#8a5a40', '#5a3424', '#9a6a4a'], false);
    // the ravine: two banks dropping to a creek at the bottom
    const bank = (x) => 34 + Math.round(26 * (1 - ((x - 44) / 44) ** 2) ** 1.6);
    c.px(0, 34, GW, 30, '#16301f');
    for (let i = 0; i < 40; i++) c.dot(Math.floor(c.rand() * GW), 36 + Math.floor(c.rand() * 24), '#24462e');
    c.silhouette((x) => bank(x) - 1, '#5a4430');
    c.silhouette((x) => bank(x) + 1, '#3a6a34');
    for (let i = 0; i < 30; i++) { const x = Math.floor(c.rand() * GW); fern(c, x, Math.min(GH - 1, bank(x) + 4)); }
    c.px(36, 60, 16, 4, '#4f8fb0');
    c.px(38, 61, 3, 1, '#d8f0ff', 'waves'); c.px(46, 62, 3, 1, '#d8f0ff', 'waves');
    // the footbridge
    c.px(0, 32, GW, 2, '#8a5e3c');
    c.px(0, 34, GW, 1, '#5e3f2a');
    c.px(0, 27, GW, 1, '#a07048');
    for (let x = 2; x < GW; x += 5) c.px(x, 27, 1, 5, '#6a4a2e');
    for (let x = 14; x < GW - 10; x += 22) { c.px(x, 34, 1, 10, '#5e3f2a'); c.px(x + 1, 36, 1, 1, '#5e3f2a'); }
    rider(c, 30, 31, '#e05a4a', 'ride');
    c.px(58, 27, 2, 5, '#3f6fd1'); c.px(58, 25, 2, 2, '#e0aa80');
  },

  // 09 · The farm: rows running down the slope, the bay beyond.
  sc_farm(c, { GW, GH, bird }) {
    c.bands(0, [[6, '#8ccaf0'], [4, '#b8def4']]);
    c.silhouette((x) => 9 - Math.round(1.5 * Math.sin(x / 9)), '#9aabc0', 11, 'base', 40, GW);
    c.bands(10, [[3, '#4a94cc'], [5, '#62a6d6']]);
    c.silhouette((x) => 15 - Math.round(2 * Math.sin(x / 3) + (x % 5 < 2 ? 1 : 0)), '#3d6a3a', 18);
    // rows, fanning toward the viewer
    const rowCols = ['#4f8a3a', '#6a4a30', '#7ab84a', '#6a4a30', '#3f7a48', '#6a4a30', '#8cc458', '#6a4a30'];
    let y = 18; let h = 1;
    for (let i = 0; y < GH; i++) { c.px(0, y, GW, h, rowCols[i % rowCols.length]); y += h; if (i % 2) h += 1; }
    // flower rows and sprouts
    for (let x = 0; x < GW; x += 2) { c.dot(x, 23, ['#ff8fc4', '#ffd23f', '#e05a4a'][x % 3], 'twinkle'); }
    for (let x = 1; x < GW; x += 3) { c.dot(x, 36, '#a6dc6a'); c.dot(x, 37, '#5a9a3a'); }
    for (let x = 2; x < GW; x += 5) { c.px(x, 52, 2, 2, '#9ad05a', 'sway'); c.dot(x, 51, '#c4ec7a', 'sway'); }
    // greenhouse on the right
    c.px(66, 16, 18, 10, '#dff0ec');
    for (let x = 67; x < 84; x += 3) c.px(x, 16, 1, 10, '#b4ccc8');
    for (let i = 0; i < 4; i++) c.px(66 + i, 15 - i, 18 - i * 2, 1, '#eef8f6');
    c.px(72, 20, 4, 6, '#8aa6a0');
    // gardener kneeling, a watering can
    c.px(30, 44, 3, 3, '#3fb8a8'); c.px(30, 42, 2, 2, '#e0aa80'); c.px(29, 41, 4, 1, '#e8d2a0'); c.px(33, 46, 2, 1, '#3a3a44');
    c.px(36, 45, 3, 2, '#9aa3ad'); c.dot(39, 44, '#9aa3ad');
    c.px(52, 30, 2, 3, '#f0b82a'); c.px(52, 28, 2, 2, '#8a5a3a');
    bird(c, 20, 3); bird(c, 26, 5);
  },

  // 10 · Deer at dawn: pink sky, tall grass, two deer.
  sc_deer(c, { GW, GH }) {
    c.bands(0, [[8, '#5a6ab0'], [7, '#9a7ab8'], [7, '#e59ab0'], [6, '#f7c2a0'], [4, '#fde2b8']]);
    c.disc(18, 30, 4, '#fff0c8', 'glow');
    // far tree line in blue shadow
    c.silhouette((x) => 26 - Math.round(4 * Math.abs(Math.sin(x / 3.1)) + 2 * Math.sin(x / 8)), '#4a4a6e', 34);
    // mist
    c.px(0, 30, GW, 3, '#e8d4dc');
    for (let x = -10; x < GW; x += 24) c.px(x, 32, 16, 2, '#f6ecee', 'drift');
    // meadow bands
    c.px(0, 34, GW, 30, '#9a9a52');
    c.bands(34, [[6, '#a8a45c'], [8, '#b8ac5a'], [16, '#c8b460']]);
    // deer
    deer(c, 62, 38, true, '#7e6a5a', '#5a4a3e');
    deer(c, 72, 40, false, '#8a6a52', '#5a4a3e');
    deer(c, 18, 54, false, '#9a6a42', '#6a4428', undefined, 2);
    deer(c, 42, 52, true, '#8a5e3c', '#5e3e26', undefined, 2);
    // tall foreground grass
    for (let x = 0; x < GW; x += 1) {
      const h = 5 + ((x * 7) % 6);
      c.px(x, GH - h, 1, h, x % 3 ? '#d8c070' : '#b09a48', x % 4 ? undefined : 'sway');
    }
    for (let x = 2; x < GW; x += 7) c.dot(x, GH - 11, '#f4e0a0', 'sway');
    c.dot(40, 20, '#3a3050'); c.dot(41, 21, '#3a3050'); c.dot(42, 20, '#3a3050');
  },

  // 11 · The wharf: long pier into the bay, sea lions on the beams.
  sc_wharf(c, { GW, GH, glints, waves, bird }) {
    c.bands(0, [[8, '#b8c8d4'], [8, '#ccd8e0'], [6, '#dfe6ea']]);
    c.silhouette((x) => 20 - Math.round(2 * Math.sin((x - 10) / 12)), '#9aa8b4', 22, 'base', 30, GW);
    c.bands(22, [[8, '#3a7aa8'], [10, '#4a8ab6'], [24, '#5a9ac2']]);
    glints(c, 24, 62, 18, '#e8f4ff');
    // the wharf deck with buildings, coming in from the left
    c.px(0, 30, 78, 3, '#8a6a4a');
    c.px(0, 33, 78, 1, '#5e4630');
    for (let x = 1; x < 78; x += 4) c.px(x, 34, 1, 14, '#5e4630');
    c.px(0, 40, 78, 1, '#6a5038');
    [[4, 14, '#e8dcc4', '#3f7a8a'], [22, 10, '#f2e6c8', '#c0472e'], [36, 16, '#dfe8e4', '#3a6a9a'], [58, 12, '#f0e0d0', '#8a5e3c']].forEach(([x, w, wall, roof]) => {
      c.px(x, 22, w, 8, wall); c.px(x - 1, 20, w + 2, 2, roof);
      for (let wx = x + 2; wx < x + w - 2; wx += 4) c.px(wx, 24, 2, 3, '#6a86a8');
    });
    c.px(72, 26, 1, 4, '#3a3a44'); c.px(72, 25, 3, 1, '#3a3a44');
    // sea lions hauled out on the cross beams
    [[6, 39], [13, 39], [30, 39], [46, 39], [53, 39]].forEach(([x, y], i) => {
      c.px(x, y, 5, 2, i % 2 ? '#6a4a34' : '#7e5a3e', i % 2 ? 'bob' : undefined);
      c.px(x + 4, y - 2, 2, 2, i % 2 ? '#6a4a34' : '#7e5a3e', i % 2 ? 'bob' : undefined);
      c.dot(x + 5, y - 2, '#2a1e18', i % 2 ? 'bob' : undefined);
    });
    // one swimming
    c.px(60, 52, 4, 1, '#5a3e2c', 'bob'); c.dot(63, 51, '#5a3e2c', 'bob');
    for (let y = 46; y < GH; y += 5) waves(c, y, '#dfeef6');
    // pelicans and gulls
    [[20, 10], [27, 12], [34, 9]].forEach(([x, y]) => { c.px(x, y, 4, 1, '#6b5a4a', 'drift'); c.dot(x + 4, y + 1, '#e0a14a', 'drift'); c.dot(x - 1, y - 1, '#6b5a4a', 'drift'); });
    bird(c, 70, 6, '#f4f4f4', 'drift2'); bird(c, 78, 12, '#f4f4f4', 'drift2');
    person(c, 16, 30, '#e05a4a'); person(c, 50, 30, '#3f6fd1', '#8a5a3a');
  },

  // 12 · Redwood fog: trunks fading back into grey.
  sc_fog(c, { GW, GH }) {
    c.bands(0, [[20, '#c9ced0'], [16, '#d4d8d8'], [28, '#bfc6c4']]);
    // three depth layers of trunks, farther = paler
    [[8, 2, '#b8b2ac'], [30, 3, '#b8b2ac'], [52, 2, '#b8b2ac'], [74, 3, '#b8b2ac']].forEach(([x, w, col]) => c.px(x, 0, w, 50, col));
    [[16, 4, '#9a8a80'], [44, 5, '#9a8a80'], [66, 4, '#9a8a80']].forEach(([x, w, col]) => c.px(x, 0, w, 54, col));
    for (let y = 10; y < 50; y += 8) for (let x = -6; x < GW; x += 20) c.px(x + (y % 9), y, 12, 2, '#e4e6e6', 'drift2');
    trunk(c, 2, 9, 0, 58, ['#7a5448', '#8a6456', '#5a4038', '#9a7466']);
    trunk(c, 58, 11, 0, 58, ['#7a5448', '#8a6456', '#5a4038', '#9a7466']);
    for (let i = 0; i < 14; i++) spray(c, Math.floor(c.rand() * GW) - 3, Math.floor(c.rand() * 12), 5 + Math.floor(c.rand() * 6), '#6a7a70', '#7e8c82');
    // path, lamp, a walker in a rain shell
    c.px(0, 56, GW, 8, '#8a8074');
    c.px(20, 56, 34, 8, '#a89c8a');
    c.px(40, 40, 1, 16, '#4a4a50'); c.px(39, 39, 3, 1, '#4a4a50');
    c.px(39, 40, 3, 2, '#fff0b8', 'glow'); c.disc(40, 41, 3, '#f4ecd0', 'glow');
    person(c, 28, 58, '#d8a030', '#e0aa80', 'ride');
    for (let x = 1; x < 18; x += 4) c.px(x, 58, 1, 3, '#6a7a60', 'sway');
    for (let x = 72; x < GW; x += 4) c.px(x, 58, 1, 3, '#6a7a60', 'sway');
    // fog bands drifting in front
    for (let y = 16; y < 58; y += 9) for (let x = -14; x < GW + 10; x += 24) c.px(x + (y % 7) * 2, y, 16, 2, '#f2f3f3', y % 2 ? 'drift' : 'drift2');
  },
};
