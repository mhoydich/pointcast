// Campus Cards · Set 03 · Davis — scenes. Unofficial, places only, CC0.
// Set data (titles, rarities, flavor) lives in src/data/campus-cards.json.

// ---------------------------------------------------------------- helpers
const SKIN = ['#e0aa80', '#8a5a3a', '#c68a5e', '#f0c8a0'];
const SHIRTS = ['#e05a4a', '#3f6fd1', '#f0b82a', '#4a9a6a', '#8e3fd0', '#ff8fc4', '#3fb8a8', '#1d1d2b'];

function person(c, x, feet, shirt, skin = '#e0aa80', layer) {
  c.px(x, feet - 5, 2, 3, shirt, layer);
  c.px(x, feet - 2, 1, 2, '#3a3a50', layer); c.px(x + 1, feet - 2, 1, 2, '#3a3a50', layer);
  c.px(x, feet - 7, 2, 2, skin, layer);
}

// broad valley shade tree: trunk + lumpy canopy
function shadeTree(c, x, ground, r, dark, mid, light, trunk = '#4a3526', layer) {
  c.px(x - 1, ground - r - 2, 2, r + 2, trunk, layer);
  c.disc(x, ground - r - 4, r, dark, layer);
  c.disc(x - Math.round(r / 2), ground - r - 3, Math.max(2, r - 3), dark, layer);
  c.disc(x + Math.round(r / 2), ground - r - 3, Math.max(2, r - 3), dark, layer);
  c.disc(x - 1, ground - r - 6, Math.max(2, r - 3), mid, layer);
  if (light) c.disc(x - 2, ground - r - 7, Math.max(1, r - 6), light, layer);
}

// top-down bike with a rider (heading right if dir > 0)
function topBike(c, x, y, shirt, dir, layer) {
  c.px(x, y, 6, 1, '#1d1d2b', layer);
  c.px(x + (dir > 0 ? 1 : 3), y - 1, 2, 3, shirt, layer);
  c.dot(x + (dir > 0 ? 3 : 2), y, '#6a4a30', layer);
}

function cow(c, x, y, flip = false, layer) {
  // Holstein-ish: white body, black patches, head at one end
  c.px(x, y, 8, 4, '#f4f2ea', layer);
  c.px(x + 2, y, 3, 2, '#1d1d2b', layer); c.px(x + 6, y + 2, 2, 2, '#1d1d2b', layer);
  const hx = flip ? x - 2 : x + 8;
  c.px(hx, y - 1, 2, 3, '#f4f2ea', layer); c.dot(hx + (flip ? 0 : 1), y - 1, '#1d1d2b', layer);
  c.dot(hx + (flip ? 0 : 1), y + 1, '#e8a0a0', layer);
  [0, 2, 5, 7].forEach((dx) => c.px(x + dx, y + 4, 1, 2, '#3a3a3a', layer));
}

// ---------------------------------------------------------------- scenes
export const scenes = {
  davis_quad(c, { GW, GH, rider, bird }) {
    c.px(0, 0, GW, GH, '#6aa84a');
    c.bands(0, [[8, '#5fb2ec'], [7, '#8cccf2'], [6, '#bfe4f7']]);
    c.px(60, 3, 12, 2, '#ffffff', 'drift'); c.px(63, 2, 6, 1, '#ffffff', 'drift');
    c.px(10, 6, 10, 2, '#ffffff', 'drift2');
    // low building across the far side of the lawn
    c.px(18, 14, 52, 12, '#d9c7a4');
    c.px(16, 12, 56, 2, '#9a5a3e');
    c.px(18, 14, 52, 1, '#b89a74');
    for (let x = 21; x < 68; x += 5) c.px(x, 17, 3, 4, '#6d8fb3');
    c.px(40, 21, 8, 5, '#4a3a2c');
    // the lawn, deep and wide
    c.px(0, 26, GW, 26, '#6aa84a');
    for (let y = 28; y < 52; y += 5) c.px(0, y, GW, 2, '#78b856');
    // huge old shade trees framing the quad
    shadeTree(c, 9, 40, 11, '#2c5a2e', '#3a7438', '#4d8c44');
    shadeTree(c, 80, 42, 12, '#2c5a2e', '#3a7438', '#4d8c44');
    shadeTree(c, 30, 30, 6, '#2f6231', '#3f7c3c', null);
    shadeTree(c, 60, 29, 6, '#2f6231', '#3f7c3c', null);
    // tree shadows on the grass
    c.px(2, 40, 18, 2, '#4f8a3a'); c.px(70, 42, 18, 2, '#4f8a3a');
    [[9, 25, 11], [80, 26, 12], [30, 20, 6], [60, 19, 6]].forEach(([tx, ty, r]) => { for (let i = 0; i < r * 2; i++) c.dot(tx - r + Math.floor(c.rand() * r * 2), ty - r + Math.floor(c.rand() * r * 2), c.rand() > 0.5 ? '#5a9a3e' : '#4d8c44', 'sway'); });
    // blankets + loungers
    [[24, 38, '#e05a4a'], [46, 34, '#f0b82a'], [54, 44, '#3f6fd1']].forEach(([x, y, col], i) => { c.px(x, y, 8, 4, col); c.px(x + 1, y + 1, 2, 2, SKIN[i % 4]); c.px(x + 4, y + 1, 3, 2, '#ffffff'); });
    person(c, 36, 44, '#8e3fd0', '#8a5a3a');
    person(c, 64, 37, '#3fb8a8', '#f0c8a0');
    c.px(40, 30, 3, 1, '#ffffff', 'drift'); // frisbee
    // perimeter bike path
    c.px(0, 52, GW, 6, '#a7a39a');
    c.px(0, 52, GW, 1, '#8e8a80');
    for (let x = 2; x < GW; x += 8) c.px(x, 55, 4, 1, '#f4f1e8');
    rider(c, 14, 56, '#e05a4a', 'ride');
    rider(c, 44, 56, '#3f6fd1', 'ride');
    rider(c, 70, 56, '#f0b82a', 'ride2');
    // foreground grass + a rack of parked bikes
    c.px(0, 58, GW, 6, '#5a9a3e');
    for (let x = 1; x < GW; x += 3) c.dot(x, 58 + (x % 2), '#78b856');
    bird(c, 34, 5, '#2b3a5a', 'drift'); bird(c, 40, 8, '#2b3a5a', 'drift');
  },

  davis_arboretum(c, { GW, GH, bird }) {
    c.px(0, 0, GW, GH, '#3f6a3a');
    c.bands(0, [[6, '#f6c48a'], [6, '#f8d8a4'], [6, '#fbe9c8']]);
    c.disc(64, 13, 4, '#fff6d8', 'glow');
    // far bank: a line of oaks
    c.silhouette((x) => 18 + Math.round(3 * Math.sin(x / 5) + 2 * Math.sin(x / 2.2)), '#4a6a44', 28);
    c.silhouette((x) => 22 + Math.round(2 * Math.sin(x / 3.4 + 1)), '#35553a', 28);
    c.px(0, 27, GW, 2, '#6a7a4a');
    // the waterway, with the trees mirrored in it
    c.px(0, 29, GW, 21, '#8fb0b0');
    for (let x = 0; x < GW; x++) { const d = 4 + Math.round(3 * Math.sin(x / 5) + 2 * Math.sin(x / 2.2)); c.px(x, 29, 1, Math.max(1, d), '#6a8c80'); }
    c.bands(38, [[5, '#9dbcbc'], [7, '#b0cccb']]);
    for (let y = 31; y < 48; y += 2) c.px(58 + (y % 3), y, 10 - Math.floor((y - 31) / 3), 1, '#fff2c8', 'glint');
    for (let y = 33; y < 50; y += 4) { for (let x = (y % 8); x < GW - 3; x += 14) c.px(x, y, 4, 1, '#d8eceb', 'waves'); }
    // geese paddling
    [[20, 40], [30, 43], [38, 39]].forEach(([x, y]) => {
      c.px(x, y, 5, 2, '#8a7a66', 'bob'); c.px(x + 4, y - 3, 1, 3, '#2a2a2a', 'bob'); c.dot(x + 5, y - 3, '#2a2a2a', 'bob'); c.dot(x + 4, y - 2, '#f4f1e8', 'bob');
      c.px(x - 1, y + 2, 7, 1, '#cfe2e0', 'bob');
    });
    // near bank: path, reeds, one big valley oak leaning over the water
    c.px(0, 50, GW, 14, '#5a7a3a');
    c.silhouette((x) => 50 + Math.round(Math.sin(x / 7)), '#6d8a44', 53);
    c.px(0, 55, GW, 4, '#c9b48a');
    for (let x = 0; x < GW; x += 5) c.dot(x + 2, 57, '#b09a70');
    for (let x = 0; x < GW; x += 2) if (x < 14 || (x > 48 && x < 56)) c.px(x, 46 - (x % 3), 1, 5, x % 4 ? '#5a7a3a' : '#7a9a4a', 'sway');
    c.px(76, 20, 3, 36, '#3a2a1e'); c.px(72, 26, 5, 2, '#3a2a1e'); c.px(66, 22, 7, 2, '#3a2a1e');
    c.disc(70, 16, 9, '#2c4a2a'); c.disc(80, 12, 9, '#2c4a2a'); c.disc(62, 18, 6, '#2c4a2a');
    c.disc(72, 13, 5, '#3f643a'); c.disc(82, 9, 5, '#3f643a');
    for (let i = 0; i < 24; i++) c.dot(58 + Math.floor(c.rand() * 30), 4 + Math.floor(c.rand() * 18), '#4f7a44', 'sway');
    // morning walker
    person(c, 30, 58, '#e05a4a', '#e0aa80', 'ride');
    c.px(0, 59, GW, 5, '#4f6e34');
    bird(c, 20, 6, '#6a5a4a', 'drift'); bird(c, 27, 9, '#6a5a4a', 'drift');
  },

  davis_bus(c, { GW, GH, rider, bird }) {
    c.px(0, 0, GW, GH, '#6a6a72');
    c.bands(0, [[8, '#6cc0f0'], [6, '#9ad4f5']]);
    // street trees, shady canopy overhead
    c.silhouette((x) => 4 + Math.round(4 * Math.sin(x / 6) + 2 * Math.sin(x / 2.5)), '#2f6231', 22);
    c.silhouette((x) => 2 + Math.round(3 * Math.sin(x / 4 + 2)), '#3f7c3c', 10);
    for (let i = 0; i < 40; i++) c.dot(Math.floor(c.rand() * GW), 2 + Math.floor(c.rand() * 14), '#56944a', 'sway');
    // houses behind
    [[0, 14, '#e8d4a8'], [16, 12, '#b8d0c8'], [58, 14, '#f0c8a0'], [74, 14, '#d8c0d8']].forEach(([x, w, col]) => {
      c.px(x, 22, w, 14, col); c.px(x + 3, 26, 3, 3, '#6d8fb3'); c.px(x + w - 5, 26, 3, 3, '#6d8fb3');
    });
    c.px(0, 20, GW, 3, '#2f6231');
    c.px(0, 36, GW, 4, '#c9c3b4');
    // road
    c.px(0, 40, GW, 24, '#5a5a62');
    c.px(0, 40, GW, 1, '#8a8a90');
    for (let x = 2; x < GW; x += 10) c.px(x, 58, 5, 1, '#f0d060');
    // the double-decker, side view
    const bx = 18; const by = 18; const bw = 54;
    c.px(bx + 1, by, bw - 2, 1, '#b8201e');
    c.px(bx, by + 1, bw, 29, '#d42a24');
    c.px(bx + bw - 3, by + 1, 3, 29, '#a81f1c');
    // upper deck windows
    for (let x = bx + 3; x < bx + bw - 6; x += 7) c.px(x, by + 3, 5, 6, '#2a3448');
    for (let x = bx + 3; x < bx + bw - 6; x += 7) c.dot(x + 1, by + 4, '#8aa8c8', 'glint');
    // cream band between decks
    c.px(bx, by + 11, bw, 2, '#f1e6c8');
    // lower deck windows + platform door at the back
    for (let x = bx + 10; x < bx + bw - 6; x += 7) c.px(x, by + 15, 5, 6, '#2a3448');
    c.px(bx + 2, by + 14, 5, 15, '#1d1d2b');
    c.px(bx + 4, by + 14, 1, 15, '#e8e0c8');
    // riders visible up top
    [[bx + 5, '#f0b82a'], [bx + 19, '#3fb8a8'], [bx + 33, '#ff8fc4']].forEach(([x, col], i) => { c.px(x, by + 5, 2, 2, SKIN[i]); c.px(x, by + 7, 2, 2, col); });
    // front: cab window + headlamp
    c.px(bx + bw - 5, by + 15, 4, 5, '#3a4a64');
    c.px(bx + bw - 2, by + 24, 2, 2, '#ffe39a', 'glow');
    c.px(bx, by + 27, bw, 2, '#7a1614');
    // wheels
    [bx + 9, bx + bw - 12].forEach((wx) => { c.disc(wx, by + 30, 3, '#1d1d2b'); c.px(wx - 1, by + 29, 2, 2, '#9a9aa0'); });
    c.px(bx - 2, by + 34, bw + 4, 1, '#3a3a42');
    // bikes sharing the road
    rider(c, 6, 61, '#4a9a6a', 'ride2');
    rider(c, 48, 61, '#e05a4a', 'ride2');
    bird(c, 8, 8, '#1b2440', 'drift');
  },

  davis_market(c, { GW, GH }) {
    // three-quarter top-down: rows of canopy tents on the park lawn
    c.px(0, 0, GW, GH, '#6aa84a');
    for (let i = 0; i < 120; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * GH), c.rand() > 0.5 ? '#78b856' : '#5f9a42');
    // shade trees along the top edge
    for (let x = 4; x < GW; x += 14) { c.disc(x, 3, 7, '#2f6231'); c.disc(x - 2, 1, 4, '#3f7c3c'); }
    // aisles
    c.px(0, 22, GW, 6, '#cdbb98'); c.px(0, 44, GW, 6, '#cdbb98');
    c.px(0, 10, GW, 2, '#cdbb98');
    const tents = [
      ['#f4f4f4', '#e05a4a'], ['#f0b82a', '#f4f4f4'], ['#3f6fd1', '#f4f4f4'], ['#f4f4f4', '#4a9a6a'], ['#ff8fc4', '#f4f4f4'], ['#f4f4f4', '#3fb8a8'],
    ];
    const produce = [['#e0453a', '#c43a2e'], ['#f28c3a', '#e8a04a'], ['#6aa84f', '#3f8a3a'], ['#8e3fd0', '#6a2aa0'], ['#f0d040', '#e0b020'], ['#f4a0a0', '#e07070']];
    [12, 30].forEach((ty, row) => {
      for (let i = 0; i < 6; i++) {
        const tx = 1 + i * 15 + (row ? 4 : 0);
        const [a, b] = tents[(i + row * 2) % 6];
        // canopy seen from above: striped square
        c.px(tx, ty, 12, 9, a);
        for (let s = 0; s < 12; s += 4) c.px(tx + s, ty, 2, 9, b);
        c.px(tx, ty + 9, 12, 1, '#4a5a3a');
        // table of produce poking out front
        const [p1, p2] = produce[(i + row) % 6];
        c.px(tx + 1, ty + 10, 10, 2, '#8a5e3c');
        for (let k = 0; k < 10; k++) c.dot(tx + 1 + k, ty + 10 + (k % 2), k % 2 ? p1 : p2);
      }
    });
    // bottom row: bigger tents cut off by the frame (closer to us)
    for (let i = 0; i < 5; i++) {
      const tx = -4 + i * 19; const [a, b] = tents[(i + 3) % 6];
      c.px(tx, 52, 16, 12, a); for (let s = 0; s < 16; s += 5) c.px(tx + s, 52, 2, 12, b);
    }
    // shoppers in the aisles
    for (let i = 0; i < 26; i++) {
      const lane = i % 2 ? 23 : 45;
      const x = Math.floor(c.rand() * (GW - 2)); const y = lane + Math.floor(c.rand() * 3);
      const layer = i % 3 === 0 ? 'ride' : i % 3 === 1 ? 'ride2' : undefined;
      c.px(x, y + 1, 2, 2, SHIRTS[i % SHIRTS.length], layer); c.px(x, y, 2, 1, SKIN[i % 4], layer);
    }
    // a little band under the far trees
    [[36, 8], [40, 8], [44, 8]].forEach(([x, y], i) => { c.px(x, y, 2, 2, SHIRTS[i + 2], 'bob'); c.px(x, y - 1, 2, 1, SKIN[i], 'bob'); });
    c.px(38, 9, 1, 1, '#f0b82a', 'twinkle');
    // balloons tied to a stall
    [[16, 18, '#e05a4a'], [18, 17, '#f0d040']].forEach(([x, y, col]) => c.px(x, y, 2, 2, col, 'bob'));
  },

  davis_mondavi(c, { GW, GH }) {
    c.px(0, 0, GW, GH, '#3a3450');
    c.bands(0, [[8, '#1c1f4a'], [8, '#33306e'], [7, '#6a4a8e'], [6, '#c46a8a'], [5, '#f09a6a']]);
    for (let i = 0; i < 10; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * 12), '#ffffff', 'twinkle');
    // trees in silhouette behind
    c.silhouette((x) => 26 + Math.round(2 * Math.sin(x / 3) + 2 * Math.sin(x / 7)), '#232444', 36);
    // sandstone side wings
    c.px(2, 22, 20, 20, '#c9a878'); c.px(2, 22, 20, 2, '#a88a5e');
    c.px(66, 22, 20, 20, '#c9a878'); c.px(66, 22, 20, 2, '#a88a5e');
    for (let y = 26; y < 42; y += 4) { c.px(2, y, 20, 1, '#b8966a'); c.px(66, y, 20, 1, '#b8966a'); }
    // the glass lobby: tall, glowing, mullioned
    c.px(22, 16, 44, 26, '#ffcf7a');
    c.px(22, 16, 44, 8, '#ffe3a4'); c.px(22, 24, 44, 10, '#ffcf7a'); c.px(22, 34, 44, 8, '#f5b25a');
    for (let x = 22; x < 66; x += 2) { c.dot(x, 23, '#ffcf7a'); c.dot(x + 1, 33, '#f5b25a'); }
    for (let x = 22; x <= 66; x += 5) c.px(x, 16, 1, 26, '#6a4a2e');
    c.px(22, 24, 44, 1, '#6a4a2e'); c.px(22, 33, 44, 1, '#6a4a2e');
    // big thin roof plane overhanging the glass
    c.px(14, 13, 60, 2, '#e8e0cc'); c.px(14, 15, 60, 1, '#8a8070');
    for (let x = 18; x < 72; x += 18) c.px(x, 15, 1, 27, '#d8d0bc');
    // people inside, shadowed against the glow
    [[28, 41], [33, 40], [44, 41], [50, 41], [58, 40], [39, 32]].forEach(([x, y], i) => { c.px(x, y - 4, 2, 4, '#4a2e2a', i % 2 ? 'bob' : undefined); c.px(x, y - 6, 2, 2, '#4a2e2a', i % 2 ? 'bob' : undefined); });
    for (let x = 23; x < 66; x += 10) c.px(x, 17, 4, 7, '#fff8e0', 'glow');
    // plaza, glow spilling onto it, lamps
    c.px(0, 42, GW, 22, '#4a4460');
    for (let y = 44; y < GH; y += 4) c.px(0, y, GW, 1, '#403a56');
    for (let y = 42; y < 56; y++) { const w = 22 + Math.round((y - 42) * 1.2); c.px(44 - w, y, w * 2, 1, y % 2 ? '#7a6456' : '#6e5a52'); }
    [[8, 48], [80, 48]].forEach(([x, y]) => { c.px(x, y, 1, 10, '#2a2a3a'); c.px(x - 1, y - 2, 3, 2, '#ffe39a', 'glow'); });
    // arriving
    [[16, 60, '#e05a4a'], [22, 61, '#3f6fd1'], [66, 60, '#f0b82a'], [72, 62, '#8e3fd0']].forEach(([x, y, col], i) => person(c, x, y, col, '#2a2230', i % 2 ? 'ride' : 'ride2'));
  },

  davis_bikerush(c, { GW, GH }) {
    // straight overhead: two-way bike path through lawn and trees
    c.px(0, 0, GW, GH, '#6aa84a');
    for (let i = 0; i < 100; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * GH), c.rand() > 0.5 ? '#78b856' : '#5f9a42');
    // path
    c.px(0, 20, GW, 26, '#8e8a84');
    c.px(0, 20, GW, 1, '#c9c3b4'); c.px(0, 45, GW, 1, '#c9c3b4');
    for (let x = 1; x < GW; x += 6) c.px(x, 32, 3, 1, '#f4f1e8');
    // a crossing walkway
    c.px(38, 0, 8, 20, '#cdbb98'); c.px(38, 46, 8, 18, '#cdbb98');
    // tree canopies from above
    [[10, 8, 8], [70, 9, 9], [18, 56, 8], [74, 57, 7], [58, 4, 5]].forEach(([x, y, r]) => { c.disc(x + 2, y + 2, r, '#4f8a3a'); c.disc(x, y, r, '#2f6231'); c.disc(x - 2, y - 2, Math.max(2, r - 3), '#3f7c3c'); c.disc(x - 3, y - 3, Math.max(1, r - 6), '#56944a'); });
    // bike rack at the edge
    for (let x = 50; x < 66; x += 2) c.px(x, 50, 1, 5, '#1d1d2b');
    for (let x = 50; x < 66; x += 2) c.dot(x, 49, SHIRTS[(x / 2) % SHIRTS.length]);
    // the rush: eastbound lanes top, westbound bottom
    let k = 0;
    [23, 27, 30].forEach((y, row) => { for (let x = (row * 5) % 11; x < GW; x += 11 + row) topBike(c, x, y, SHIRTS[(k++) % SHIRTS.length], 1, row === 1 ? 'ride2' : 'ride'); });
    [35, 38, 42].forEach((y, row) => { for (let x = 3 + (row * 4) % 9; x < GW; x += 10 + row) topBike(c, x, y, SHIRTS[(k++) % SHIRTS.length], -1, 'ride2'); });
    // walkers waiting to cross
    [[39, 17], [43, 16], [40, 48]].forEach(([x, y], i) => { c.px(x, y, 2, 2, SHIRTS[i + 4]); c.dot(x, y - 1, SKIN[i]); c.dot(x + 1, y - 1, SKIN[i]); });
  },

  davis_watertower(c, { GW, GH, bird }) {
    c.px(0, 0, GW, GH, '#3a6a3a');
    c.bands(0, [[12, '#3a8fe0'], [12, '#5aa8ec'], [10, '#86c4f2'], [8, '#b4dcf6']]);
    c.px(8, 10, 14, 2, '#ffffff', 'drift'); c.px(11, 9, 7, 1, '#ffffff', 'drift');
    c.px(58, 30, 18, 2, '#ffffff', 'drift2');
    // the tower: four legs with cross bracing, round tank, cone cap
    const tx = 50;
    const legs = [tx - 9, tx - 3, tx + 3, tx + 9];
    legs.forEach((x, i) => { const lean = i < 2 ? 1 : -1; for (let y = 24; y < 54; y++) c.dot(x + Math.round(((y - 24) / 30) * -lean * 2), y, i % 3 ? '#b8bcc4' : '#9aa0aa'); });
    for (let y = 28; y < 54; y += 8) {
      for (let s = 0; s <= 18; s++) { c.dot(tx - 9 + s, y + Math.round((s / 18) * 6), '#8a909a'); c.dot(tx + 9 - s, y + Math.round((s / 18) * 6), '#8a909a'); }
      c.px(tx - 10, y, 21, 1, '#9aa0aa');
    }
    c.px(tx - 1, 24, 2, 30, '#8a909a'); // riser pipe
    // tank: straight drum over a shallow bowl
    c.px(tx - 13, 12, 27, 13, '#eef0f2');
    c.px(tx + 7, 12, 7, 13, '#cfd4da');
    for (let y = 25; y < 31; y++) {
      const w = Math.floor(Math.sqrt(1 - ((y - 24) / 7) ** 2) * 13);
      c.px(tx - w, y, w * 2 + 1, 1, '#e2e6ea'); c.px(tx + Math.round(w / 2), y, Math.ceil(w / 2) + 1, 1, '#c4cad2');
    }
    c.px(tx - 13, 17, 27, 1, '#dde1e6');
    // catwalk rail round the drum's waist
    c.px(tx - 15, 25, 31, 1, '#6a7078');
    for (let x = tx - 15; x <= tx + 15; x += 3) c.px(x, 23, 1, 2, '#6a7078');
    c.px(tx - 15, 23, 31, 1, '#8a909a');
    // cone roof + finial
    for (let i = 0; i < 6; i++) c.px(tx - 13 + i * 2, 11 - i, 27 - i * 4, 1, i % 2 ? '#d8dce2' : '#c4cad2');
    c.px(tx, 3, 1, 3, '#6a7078'); c.dot(tx, 2, '#e04a3a', 'twinkle');
    // treetops + rooflines below
    c.silhouette((x) => 48 + Math.round(3 * Math.sin(x / 4) + 2 * Math.sin(x / 1.8)), '#2f6231');
    for (let i = 0; i < 40; i++) c.dot(Math.floor(c.rand() * GW), 46 + Math.floor(c.rand() * 8), '#4a8a44', 'sway');
    c.px(4, 52, 22, 12, '#d9c7a4'); c.px(2, 50, 26, 2, '#9a5a3e'); for (let x = 7; x < 24; x += 5) c.px(x, 55, 3, 3, '#6d8fb3');
    c.px(0, 60, GW, 4, '#8e8a80');
    c.px(0, 60, GW, 1, '#b0aca2');
    [[34, 62], [60, 62]].forEach(([x, y], i) => { c.px(x, y - 1, 5, 1, '#1d1d2b', i ? 'ride2' : 'ride'); c.px(x + 2, y - 3, 2, 2, SHIRTS[i + 1], i ? 'ride2' : 'ride'); });
    bird(c, 20, 20, '#2b3a5a', 'drift'); bird(c, 26, 17, '#2b3a5a', 'drift'); bird(c, 74, 12, '#2b3a5a', 'drift2');
  },

  davis_dairy(c, { GW, GH, bird }) {
    c.px(0, 0, GW, GH, '#8aaa5a');
    c.bands(0, [[7, '#9fcfe8'], [6, '#c4e2ee'], [5, '#f2e6c8'], [4, '#f8dca8']]);
    c.disc(14, 16, 4, '#fff4d0', 'glow');
    // far fields + row of trees
    c.px(0, 22, GW, 4, '#9aa85a');
    c.silhouette((x) => 20 + Math.round(2 * Math.sin(x / 3) + (x % 17 < 5 ? -2 : 0)), '#4a6a3a', 23);
    // barns: long low sheds with pitched metal roofs + one tall barn
    c.px(4, 26, 34, 10, '#e4ddd0'); for (let i = 0; i < 4; i++) c.px(3 + i, 25 - i, 36 - i * 2, 1, i % 2 ? '#a8adb2' : '#9aa0a6');
    for (let x = 6; x < 36; x += 5) c.px(x, 29, 3, 7, '#5a5048');
    c.px(44, 18, 18, 18, '#b84a3a'); for (let i = 0; i < 7; i++) c.px(43 + i, 17 - i, 20 - i * 2, 1, i % 2 ? '#8a9096' : '#7a8086');
    c.px(50, 26, 6, 10, '#5a2a22'); c.px(52, 20, 2, 3, '#f4f1e8'); c.px(44, 18, 18, 1, '#f4f1e8');
    c.px(50, 26, 1, 10, '#f4f1e8'); c.px(55, 26, 1, 10, '#f4f1e8');
    // silo
    c.px(64, 12, 7, 24, '#c9ccd0'); c.disc(67, 12, 3, '#aab0b6'); c.px(69, 12, 2, 24, '#aab0b6');
    c.px(72, 28, 14, 8, '#e4ddd0'); c.px(71, 26, 16, 2, '#9aa0a6');
    // pasture
    c.px(0, 36, GW, 28, '#86a852');
    for (let y = 38; y < GH; y += 5) for (let x = (y % 4); x < GW; x += 7) c.px(x, y, 2, 1, '#9aba60');
    // fence
    c.px(0, 40, GW, 1, '#8a6a48'); c.px(0, 43, GW, 1, '#8a6a48');
    for (let x = 2; x < GW; x += 9) c.px(x, 39, 1, 6, '#6a4a30');
    // cows
    cow(c, 10, 50); cow(c, 30, 54, true); cow(c, 52, 49); cow(c, 70, 55, true);
    cow(c, 20, 44, true, 'peck');
    // hay bales + egrets following the herd
    [[62, 41], [66, 41]].forEach(([x, y]) => { c.px(x, y, 4, 3, '#e8c86a'); c.px(x, y, 4, 1, '#d4b050'); });
    [[42, 57], [46, 59], [84, 50]].forEach(([x, y]) => { c.px(x, y, 2, 2, '#ffffff', 'peck'); c.dot(x + 2, y - 1, '#ffffff', 'peck'); c.dot(x + 3, y - 1, '#e0b040', 'peck'); c.dot(x, y + 2, '#2a2a2a'); });
    bird(c, 30, 6, '#4a4a5a', 'drift'); bird(c, 36, 8, '#4a4a5a', 'drift');
  },

  davis_tomato(c, { GW, GH, bird }) {
    c.px(0, 0, GW, GH, '#5a8a3a');
    c.bands(0, [[8, '#4aa0e8'], [8, '#76baf0'], [6, '#b6dcf2'], [2, '#e8eed8']]);
    c.disc(72, 7, 4, '#fffbe0', 'glow');
    // far tree line + coast range smudge
    c.silhouette((x) => 20 + Math.round(1.5 * Math.sin(x / 9)), '#8aa0b8', 24);
    c.silhouette((x) => 22 + (x % 13 < 4 ? -1 : 0), '#4a6a3a', 24);
    // fields: rows converging to a point on the horizon
    const vx = 30; const hy = 24;
    c.px(0, hy, GW, GH - hy, '#6a9a3a');
    for (let y = hy; y < GH; y++) {
      const t = (y - hy) / (GH - hy);
      for (let r = -20; r <= 20; r++) {
        const x = Math.round(vx + r * (1.5 + t * 9));
        c.dot(x, y, t > 0.5 ? '#4f7a2a' : '#5a8a30');
        if (t > 0.35 && (y + r) % 3 === 0) c.dot(x + 1, y, '#e0453a');
      }
    }
    // dirt farm road on the right
    c.silhouette((x) => (x < 54 ? GH : hy + 1 + Math.round((x - 54) * 0.2)), '#c9a878', GH, 'base', 54, GW);
    for (let x = 58; x < GW; x += 4) c.dot(x, 40 + Math.round((x - 58) * 0.3), '#b09060');
    // harvester in the field
    const hx = 18; const hyy = 38;
    c.px(hx, hyy, 16, 7, '#d8c020'); c.px(hx + 10, hyy - 5, 6, 5, '#d8c020'); c.px(hx + 11, hyy - 4, 4, 3, '#3a4a64');
    c.px(hx - 6, hyy + 1, 6, 2, '#8a8a90'); c.px(hx + 16, hyy - 2, 6, 2, '#8a8a90');
    c.disc(hx + 3, hyy + 8, 2, '#1d1d2b'); c.disc(hx + 12, hyy + 8, 2, '#1d1d2b');
    c.dot(hx + 21, hyy - 1, '#e0453a', 'glint');
    // trucks with open trailers heaped red
    [[56, 50, 'ride2'], [70, 58, 'ride2']].forEach(([x, y, layer]) => {
      c.px(x, y - 5, 5, 5, '#f4f4f4', layer); c.px(x + 1, y - 4, 3, 2, '#3a4a64', layer);
      c.px(x + 6, y - 4, 12, 4, '#8a8a90', layer); c.px(x + 6, y - 6, 12, 2, '#e0453a', layer);
      for (let k = 0; k < 12; k += 2) c.dot(x + 6 + k, y - 7, '#c43a2e', layer);
      [x + 1, x + 8, x + 15].forEach((wx) => c.px(wx, y, 2, 1, '#1d1d2b', layer));
    });
    // dust behind the harvester
    for (let i = 0; i < 6; i++) c.px(hx - 12 + i * 2, hyy - 2 - (i % 2), 3, 1, '#e8d8b0', 'drift');
    bird(c, 40, 8, '#3a3a4a', 'drift'); bird(c, 46, 10, '#3a3a4a', 'drift');
  },

  davis_orchard(c, { GW, GH, bird }) {
    c.px(0, 0, GW, GH, '#e8c830');
    c.bands(0, [[8, '#a8d4f0'], [6, '#c8e4f4'], [4, '#e4f0f4']]);
    // distant rows fading into haze
    c.px(0, 18, GW, 4, '#c8d4c0');
    for (let x = 0; x < GW; x += 3) c.px(x, 15, 3, 3, '#f0e4ec');
    // mustard between the rows
    c.px(0, 22, GW, 42, '#e8c830');
    for (let i = 0; i < 160; i++) c.dot(Math.floor(c.rand() * GW), 22 + Math.floor(c.rand() * 42), c.rand() > 0.5 ? '#f4dc50' : '#b8a020');
    // the grass strip of the center lane, receding
    for (let y = 22; y < GH; y++) { const t = (y - 22) / 42; const w = Math.round(2 + t * 18); c.px(44 - w, y, w * 2, 1, y % 2 ? '#7aaa4a' : '#6a9a3e'); }
    // rows of blooming trees on both sides, bigger as they come closer
    const rows = [[25, 2, 4], [28, 3, 8], [33, 5, 13], [41, 7, 21], [55, 10, 32]];
    rows.forEach(([ground, r, gap]) => {
      [44 - gap - r, 44 + gap + r].forEach((cx, side) => {
        for (let k = 0; k < 4; k++) {
          const x = side ? cx + k * (r * 2 + 2) : cx - k * (r * 2 + 2);
          c.px(x - 1, ground - r, 2, r + 1, '#4a3a2e');
          c.disc(x, ground - r - Math.round(r / 2), r, '#f7f0f2');
          c.disc(x - Math.round(r / 3), ground - r - Math.round(r / 2) - 1, Math.max(1, r - 2), '#ffffff');
          for (let d = 0; d < r; d++) c.dot(x - r + Math.floor(c.rand() * r * 2), ground - r * 2 + Math.floor(c.rand() * r), '#f4b8c8');
        }
      });
    });
    // petals coming down
    for (let i = 0; i < 26; i++) c.dot(Math.floor(c.rand() * GW), 10 + Math.floor(c.rand() * 50), i % 3 ? '#ffffff' : '#f8c8d4', i % 2 ? 'drift' : 'drift2');
    // beehives at the end of a row
    [[36, 56], [41, 57]].forEach(([x, y]) => { c.px(x, y, 4, 5, '#f4f1e8'); c.px(x, y, 4, 1, '#c9c3b4'); c.px(x, y + 5, 4, 1, '#6a5a4a'); });
    for (let i = 0; i < 6; i++) c.dot(34 + i * 2, 52 - (i % 3), '#3a3020', 'bob');
    bird(c, 60, 4, '#4a4a5a', 'drift');
  },

  davis_sunset(c, { GW, GH, rider, bird }) {
    c.px(0, 0, GW, GH, '#2a1a2e');
    c.bands(0, [[7, '#2c2a6a'], [7, '#5a3a8a'], [7, '#a84a8a'], [7, '#e0605a'], [6, '#f48a4a'], [6, '#fab25a'], [4, '#fdd88a']]);
    c.px(8, 12, 22, 1, '#f4a0b0', 'drift'); c.px(50, 18, 26, 1, '#fcb0a0', 'drift2'); c.px(20, 24, 18, 1, '#ffd0a0', 'drift');
    // sun sitting on the flat horizon
    c.disc(58, 44, 7, '#ffe8a0');
    c.disc(58, 44, 5, '#fff4c8', 'glow');
    // flat valley line: tree windbreak + a barn far off
    c.px(0, 44, GW, 20, '#2a1a2e');
    [[6, 43, 2], [10, 42, 2], [13, 43, 1], [22, 42, 2], [25, 43, 1], [34, 43, 1], [38, 42, 2]].forEach(([x, y, r]) => c.disc(x, y, r, '#2a1a2e'));
    [[10, 38], [22, 39], [38, 39]].forEach(([x, y]) => c.px(x, y, 1, 44 - y, '#2a1a2e'));
    c.px(72, 40, 6, 4, '#2a1a2e'); for (let i = 0; i < 3; i++) c.px(71 + i, 39 - i, 8 - i * 2, 1, '#2a1a2e');
    // fields catching the last light
    c.bands(45, [[3, '#6a3a3a'], [5, '#4a2a34'], [11, '#34202e']]);
    for (let y = 46; y < GH; y += 3) c.px(0, y, GW, 1, '#5a3238');
    // road straight away from us
    for (let y = 45; y < GH; y++) { const w = Math.round(1 + (y - 45) * 0.9); c.px(44 - w, y, w * 2, 1, '#1e1420'); }
    for (let y = 48; y < GH; y += 4) c.px(44, y, 1, 2, '#e0a060');
    // telephone poles marching off with sagging wires
    // [x, base, height, crossbar half-width], receding toward the road's vanishing point
    const poles = [[84, 64, 36, 4], [68, 54, 18, 2], [59, 49, 9, 1], [54, 47, 5, 1], [51, 46, 3, 0]];
    poles.forEach(([x, base, h, cw]) => { c.px(x, base - h, x > 80 ? 2 : 1, h, '#1a1018'); c.px(x - cw, base - h + 1, cw * 2 + 1, 1, '#1a1018'); });
    for (let i = 0; i < poles.length - 1; i++) {
      const [x1, b1, h1, w1] = poles[i]; const [x2, b2, h2, w2] = poles[i + 1];
      [-1, 1].forEach((side) => {
        const ax = x1 + side * w1; const ay = b1 - h1 + 1; const bx = x2 + side * w2; const by = b2 - h2 + 1;
        for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) { const t = (x - bx) / ((ax - bx) || 1); c.dot(x, Math.round(by + (ay - by) * t + Math.sin(t * Math.PI) * (h1 > 20 ? 1 : 0)), '#1a1018'); }
      });
    }
    // one rider heading home
    rider(c, 34, 60, '#1a1018', 'ride2');
    for (let i = 0; i < 5; i++) bird(c, 14 + i * 5, 16 + (i % 2) * 3, '#1a1030', 'drift');
  },

  davis_fog(c, { GW, GH }) {
    c.px(0, 0, GW, GH, '#cfd2d2');
    c.bands(0, [[14, '#d8dada'], [12, '#d0d3d3'], [10, '#c6caca']]);
    // flat field first, then bare winter trees fading with distance
    c.px(0, 34, GW, 30, '#b6bab2');
    c.bands(38, [[8, '#aeb2a8'], [18, '#a2a89c']]);
    const tree = (x, ground, h, col) => {
      c.px(x, ground - h, 1, h, col);
      for (let b = 0; b < h - 3; b += 3) { const L = Math.max(1, Math.round((h - b) / 3)); for (let s = 1; s <= L; s++) { c.dot(x - s, ground - b - 3 - s, col); c.dot(x + s, ground - b - 4 - s, col); } }
    };
    tree(14, 35, 9, '#c2c6c6'); tree(26, 34, 7, '#c6caca'); tree(66, 35, 10, '#bec2c2');
    tree(6, 46, 20, '#8e9496'); tree(80, 50, 26, '#6e7476');
    // fence posts sliding into the white
    [[56, 36, 2], [62, 38, 3], [69, 41, 4], [77, 44, 5]].forEach(([x, y, h]) => c.px(x, y, 1, h, '#7e8480'));
    for (let x = 56; x < 78; x++) c.dot(x, 37 + Math.round((x - 56) * 0.36), '#8e9490');
    // the bike path, vanishing ahead
    for (let y = 34; y < GH; y++) { const w = Math.round(1 + (y - 34) * 0.6); c.px(36 - w + Math.round((y - 34) * 0.15), y, w * 2, 1, '#8e9294'); }
    for (let y = 36; y < GH; y += 5) c.px(36 + Math.round((y - 34) * 0.15), y, 1, 2, '#e8eaea');
    // soft fog layers over the far field (static, so the rider stays clear)
    c.px(0, 30, GW, 4, '#dfe2e2'); c.px(0, 36, 30, 2, '#d4d8d6'); c.px(50, 38, 38, 2, '#d4d8d6');
    // a rider coming toward us, front view, headlight on
    const rx = 38; const ry = 56;
    c.px(rx + 1, ry - 4, 1, 6, '#1d1d24');                 // front wheel
    c.px(rx - 2, ry - 9, 7, 1, '#1d1d24');                 // handlebar
    c.px(rx - 1, ry - 15, 5, 6, '#3a3048');                // jacket
    c.px(rx - 2, ry - 13, 1, 4, '#3a3048'); c.px(rx + 4, ry - 13, 1, 4, '#3a3048');
    c.px(rx, ry - 18, 3, 3, '#c89a78'); c.px(rx, ry - 19, 3, 1, '#b83a3a'); // head + red beanie
    c.px(rx + 1, ry - 8, 1, 2, '#1d1d24');
    c.px(rx, ry - 7, 3, 2, '#fff2a0');                     // lamp
    c.px(rx, ry - 8, 3, 1, '#fffbe8', 'glow'); c.dot(rx - 1, ry - 7, '#f4f0d8', 'glow'); c.dot(rx + 3, ry - 7, '#f4f0d8', 'glow');
    for (let y = ry + 2; y < GH; y++) { const w = Math.round((y - ry - 1) * 0.8); c.px(rx + 1 - w, y, w * 2 + 1, 1, '#b8b8a8'); }
    c.px(rx + 1, ry - 4, 1, 6, '#1d1d24');
    // a crow on the last post
    c.px(76, 42, 3, 2, '#3a3a40'); c.dot(79, 42, '#3a3a40');
    // thin fog wisps drifting across the top half only
    for (let y = 8; y < 34; y += 6) for (let x = -12; x < GW + 12; x += 30) c.px(x + (y % 9), y, 16, 1, '#eef0f0', y % 12 ? 'drift' : 'drift2');
    for (let x = -10; x < GW; x += 34) c.px(x, 44, 14, 1, '#dcdfdd', 'drift2');
  },
};
