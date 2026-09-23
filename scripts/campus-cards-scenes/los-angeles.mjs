// Campus Cards · Set 05 · Los Angeles — scenes. Unofficial, places only, CC0.
// Set data (titles, rarities, flavor) lives in src/data/campus-cards.json.

// ------------------------------------------------------------ local kit
const BRICK = '#b24a32';
const BRICK_D = '#8a3524';
const BRICK_L = '#cc6444';
const STONE = '#efdfbf';
const STONE_D = '#cbb58c';
const TILE = '#d0703e';
const TILE_D = '#9c4a28';

// Round-topped opening: w wide, h tall, top-left at (x, y).
function arch(c, x, y, w, h, fill, layer) {
  const r = Math.floor(w / 2);
  const cx = x + r;
  const odd = w % 2;
  for (let dy = 0; dy < r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - (r - dy) ** 2) + 0.3);
    if (odd) c.px(cx - half, y + dy, half * 2 + 1, 1, fill, layer);
    else c.px(cx - half, y + dy, half * 2, 1, fill, layer);
  }
  c.px(x, y + r, w, h - r, fill, layer);
}

function ellipse(c, cx, cy, rx, ry, fill, layer) {
  for (let y = -ry; y <= ry; y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)));
    c.px(cx - half, cy + y, half * 2 + 1, 1, fill, layer);
  }
}

function person(c, x, y, shirt, skin = '#e0aa80', layer) {
  c.px(x, y - 4, 2, 4, shirt, layer);
  c.px(x, y - 6, 2, 2, skin, layer);
}

// Brick texture: staggered mortar dots over an existing brick fill.
function mortar(c, x0, y0, w, h, color = BRICK_D) {
  for (let y = y0 + 1; y < y0 + h; y += 2) {
    for (let x = x0 + ((y >> 1) % 2) * 2; x < x0 + w; x += 4) c.dot(x, y, color);
  }
}

// Twin Romanesque tower with arched belfry and a hipped tile cap.
function tower(c, x, top, w, bottom) {
  c.px(x, top + 7, w, bottom - top - 7, BRICK);
  mortar(c, x, top + 7, w, bottom - top - 7);
  c.px(x + w - 2, top + 7, 2, bottom - top - 7, BRICK_D);
  // stone string courses
  [top + 7, top + 16, top + 26].forEach((y) => c.px(x - 1, y, w + 2, 1, STONE));
  // belfry: paired arched openings
  const bw = Math.floor((w - 3) / 2);
  arch(c, x + 1, top + 9, bw, 7, '#2a1c2a');
  arch(c, x + 2 + bw, top + 9, bw, 7, '#2a1c2a');
  c.px(x + 1 + bw, top + 11, 1, 5, STONE);
  // small arched windows further down
  arch(c, x + Math.floor(w / 2) - 1, top + 19, 3, 5, '#3a2430');
  // hipped roof
  for (let i = 0; i < 7; i++) {
    const inset = Math.round(i * (w / 2) / 7);
    c.px(x - 1 + inset, top + 6 - i, w + 2 - inset * 2, 1, i % 2 ? TILE : TILE_D);
  }
  c.px(x + Math.floor(w / 2), top - 2, 1, 2, STONE_D);
}

export const scenes = {
  // 01 · the legendary: Royce Hall at golden hour, lawn in front.
  la_royce(c, { GW, bird }) {
    c.bands(0, [[9, '#3f7ec8'], [8, '#6aa2dc'], [8, '#a9c8e6'], [7, '#f2d6a4'], [10, '#f7b777']]);
    // distant trees behind the hall
    c.silhouette((x) => 40 - Math.round(2 * Math.sin(x / 4) + (x % 9 < 3 ? 1 : 0)), '#3e5a3a', 56);
    // central block with gable
    c.px(24, 30, 40, 26, BRICK);
    mortar(c, 24, 30, 40, 26);
    for (let i = 0; i < 6; i++) c.px(24 + i * 3, 29 - i, 40 - i * 6, 1, i % 2 ? TILE_D : TILE);
    c.px(24, 30, 40, 1, STONE);
    // rose window / gable ornament
    c.disc(44, 34, 2, STONE); c.dot(44, 34, '#6a3a3a');
    // triple-arch entrance loggia
    c.px(26, 40, 36, 1, STONE);
    [30, 40, 50].forEach((x) => { arch(c, x, 42, 8, 14, STONE); arch(c, x + 1, 43, 6, 13, '#3a2230'); });
    c.px(26, 55, 36, 1, STONE_D);
    // row of small arched windows above the loggia
    for (let x = 28; x < 60; x += 4) arch(c, x, 37, 2, 3, '#3a2230');
    // the two towers
    tower(c, 12, 3, 13, 56);
    tower(c, 63, 3, 13, 56);
    // warm window glints
    [[16, 23], [67, 23], [33, 50], [53, 50]].forEach(([x, y]) => c.px(x, y, 2, 1, '#ffd98a', 'twinkle'));
    // steps + lawn
    c.px(0, 56, GW, 2, '#c9b08a');
    c.px(0, 58, GW, 6, '#5f9e44');
    for (let x = 0; x < GW; x += 6) c.px(x, 60, 3, 1, '#72b252');
    // side trees
    c.px(4, 44, 2, 12, '#4a3526'); c.disc(5, 42, 5, '#2f5e34'); c.disc(3, 40, 3, '#3f7a42');
    c.px(83, 46, 2, 10, '#4a3526'); c.disc(84, 43, 5, '#2f5e34'); c.disc(86, 41, 3, '#3f7a42');
    // people on the lawn
    person(c, 30, 62, '#3f6fd1', '#e0aa80', 'ride');
    person(c, 58, 63, '#f0b82a', '#8a5a3a', 'ride2');
    c.px(40, 60, 7, 3, '#e05a4a'); c.px(42, 59, 2, 1, '#e0aa80');
    bird(c, 34, 8, '#2a3050', 'drift'); bird(c, 42, 5, '#2a3050', 'drift'); bird(c, 50, 10, '#2a3050', 'drift2');
  },

  // 02 · Powell Library at blue hour, windows lit.
  la_powell(c, { GW, GH }) {
    c.bands(0, [[10, '#1f2a5e'], [9, '#35448a'], [8, '#5a5aa8'], [7, '#9a6ab0'], [6, '#d98a9a']]);
    c.dot(6, 3, '#ffffff', 'twinkle'); c.dot(78, 5, '#ffffff', 'twinkle'); c.dot(20, 8, '#ffffff', 'twinkle');
    c.silhouette((x) => 36 - Math.round(2 * Math.sin(x / 3) + (x % 7 < 3 ? 1 : 0)), '#232a44', 56);
    // wings
    c.px(2, 30, 30, 26, BRICK); mortar(c, 2, 30, 30, 26);
    c.px(56, 30, 30, 26, BRICK); mortar(c, 56, 30, 30, 26);
    c.px(1, 28, 32, 2, TILE_D); c.px(55, 28, 32, 2, TILE_D);
    c.px(2, 30, 30, 1, STONE); c.px(56, 30, 30, 1, STONE);
    [5, 13, 21].forEach((x) => { arch(c, x, 36, 6, 14, STONE); arch(c, x + 1, 37, 4, 13, '#ffcf6a'); c.px(x + 3, 37, 1, 13, '#c89a48'); });
    [61, 69, 77].forEach((x) => { arch(c, x, 36, 6, 14, STONE); arch(c, x + 1, 37, 4, 13, '#ffcf6a'); c.px(x + 3, 37, 1, 13, '#c89a48'); });
    // central pavilion
    c.px(30, 22, 28, 34, BRICK_L); mortar(c, 30, 22, 28, 34, BRICK);
    c.px(29, 21, 30, 1, STONE); c.px(29, 26, 30, 1, STONE);
    // great arched doorway, lit
    arch(c, 36, 32, 16, 24, STONE);
    arch(c, 38, 34, 12, 22, '#ffd98a');
    arch(c, 40, 36, 8, 8, '#f7b04a');
    for (let x = 40; x < 48; x += 2) c.px(x, 36, 1, 20, '#d49a4a');
    c.px(38, 45, 12, 1, '#c07a3a');
    // octagonal drum
    c.px(35, 10, 18, 11, BRICK);
    c.px(35, 10, 2, 11, BRICK_D); c.px(51, 10, 2, 11, BRICK_D);
    for (let x = 38; x < 50; x += 4) arch(c, x, 12, 2, 6, '#ffcf6a');
    c.px(34, 9, 20, 1, STONE); c.px(34, 20, 20, 1, STONE);
    // dome + lantern
    for (let i = 0; i < 5; i++) c.px(36 + i * 2, 8 - i, 16 - i * 4, 1, i % 2 ? TILE : TILE_D);
    c.px(42, 1, 4, 3, STONE); c.px(43, 0, 2, 1, TILE_D);
    c.px(43, 2, 2, 1, '#ffe39a', 'glow');
    // plaza + lamps
    c.px(0, 56, GW, GH - 56, '#6a5a6a');
    for (let x = 0; x < GW; x += 4) c.px(x, 58 + (x % 8 ? 0 : 3), 2, 1, '#7c6a78');
    [[26, 46], [60, 46]].forEach(([x, y]) => { c.px(x, y, 1, 10, '#2a2230'); c.px(x - 1, y - 2, 3, 2, '#fff1c0', 'glow'); });
    person(c, 44, 62, '#3f6fd1', '#e0aa80', 'ride');
    person(c, 18, 63, '#4a9a6a', '#8a5a3a', 'ride2');
  },

  // 03 · Janss Steps, looking up from the bottom on a bright morning.
  la_janss(c, { GW, GH, bird }) {
    c.bands(0, [[8, '#5aa0e0'], [7, '#8cc0ea'], [6, '#c4e0f4']]);
    // hilltop silhouettes: two little brick towers left, a dome right
    c.silhouette((x) => 20 - Math.round(1.5 * Math.sin(x / 5)), '#3f6a3e', 30);
    [[24, 5], [33, 5]].forEach(([x, w]) => { c.px(x, 10, w, 12, BRICK); c.px(x, 9, w, 1, STONE); for (let i = 0; i < 3; i++) c.px(x + i, 8 - i, w - i * 2, 1, TILE_D); arch(c, x + 1, 12, 3, 4, '#3a2230'); });
    c.px(29, 16, 4, 6, BRICK_D);
    c.px(56, 14, 12, 8, BRICK); c.px(58, 11, 8, 3, BRICK_L); for (let i = 0; i < 3; i++) c.px(59 + i, 10 - i, 6 - i * 2, 1, TILE_D);
    // lawns on both sides, sloping up
    c.px(0, 22, GW, GH - 22, '#5a9a40');
    for (let y = 24; y < GH; y += 5) c.px(0, y, GW, 2, '#68aa4a');
    // the steps: a trapezoid that narrows as it climbs
    for (let y = 22; y < GH; y++) {
      const t = (y - 22) / (GH - 22);
      const half = Math.round(12 + t * 30);
      const landing = (y > 34 && y < 37) || (y > 48 && y < 52);
      const col = landing ? '#c07a5a' : (y % 2 ? BRICK : '#e0c8a0');
      c.px(44 - half, y, half * 2, 1, col);
      c.dot(44 - half - 1, y, '#8a5a40'); c.dot(44 + half, y, '#8a5a40');
    }
    // center handrail
    for (let y = 24; y < GH; y++) c.dot(44, y, y % 2 ? '#6a6a72' : '#8a8a92');
    // trees flanking
    [[8, 40, 7], [80, 40, 7], [16, 28, 4], [72, 28, 4]].forEach(([x, y, r]) => { c.px(x - 1, y, 2, r + 2, '#4a3526'); c.disc(x, y - 1, r, '#2f6b3a'); c.disc(x - 1, y - 2, Math.max(2, r - 3), '#44874a'); });
    // people climbing
    [[36, 60, '#e05a4a'], [52, 56, '#3f6fd1'], [40, 44, '#f0b82a'], [49, 38, '#8e3fd0'], [42, 30, '#4a9a6a']].forEach(([x, y, col], i) => person(c, x, y, col, i % 2 ? '#8a5a3a' : '#e0aa80', i % 2 ? 'bob' : undefined));
    bird(c, 70, 6, '#2a3050', 'drift'); bird(c, 76, 4, '#2a3050', 'drift');
  },

  // 04 · Inverted Fountain, from above at midday.
  la_fountain(c, { GW, GH }) {
    // brick plaza
    c.px(0, 0, GW, GH, '#b86a4a');
    for (let y = 0; y < GH; y += 3) for (let x = (y % 6 ? 0 : 3); x < GW; x += 6) c.px(x, y, 3, 1, '#a45a3e');
    // lawn corners + tree crowns
    c.px(0, 0, 14, 12, '#5f9e44'); c.px(74, 52, 14, 12, '#5f9e44');
    c.disc(6, 6, 8, '#2f6b3a'); c.disc(4, 4, 4, '#44874a');
    c.disc(82, 58, 8, '#2f6b3a'); c.disc(84, 56, 4, '#44874a');
    c.disc(84, 4, 6, '#3a7a3e'); c.disc(4, 60, 6, '#3a7a3e');
    // basin rim, water, falls, and the rocky center
    ellipse(c, 44, 32, 34, 21, STONE);
    ellipse(c, 44, 32, 31, 18, '#bcae90');
    ellipse(c, 44, 32, 29, 17, '#4a94c4');
    ellipse(c, 44, 32, 22, 13, '#5fa8d4');
    ellipse(c, 44, 32, 14, 8, '#3a78a8');
    ellipse(c, 44, 32, 10, 6, '#6a6258');
    ellipse(c, 44, 32, 6, 3, '#2a2a30');
    [[38, 30], [48, 33], [42, 35], [50, 29], [36, 34]].forEach(([x, y]) => { c.px(x, y, 3, 2, '#8a8070'); c.dot(x + 1, y, '#a89c88'); });
    // water pouring inward: rings of foam that blink
    for (let a = 0; a < 40; a++) {
      const th = (a / 40) * Math.PI * 2;
      c.dot(44 + Math.round(Math.cos(th) * 26), 32 + Math.round(Math.sin(th) * 15), '#e8f6ff', a % 2 ? 'glint' : 'twinkle');
      c.dot(44 + Math.round(Math.cos(th + 0.08) * 18), 32 + Math.round(Math.sin(th + 0.08) * 10), '#d0ecff', a % 2 ? 'twinkle' : 'glint');
      if (a % 2 === 0) c.dot(44 + Math.round(Math.cos(th) * 12), 32 + Math.round(Math.sin(th) * 7), '#ffffff', 'glint');
    }
    // people sitting on the rim, seen from above (heads + shoulders)
    [[14, 30, '#e05a4a'], [74, 34, '#3f6fd1'], [30, 12, '#f0b82a'], [60, 51, '#4a9a6a'], [22, 47, '#8e3fd0'], [66, 14, '#ff8fc4']].forEach(([x, y, col], i) => {
      c.px(x - 1, y, 3, 2, col); c.px(x, y - 1, 1, 1, i % 2 ? '#3a2a1e' : '#6a4a2a');
    });
    // someone walking across the plaza
    c.px(8, 26, 2, 2, '#1d1d2b', 'ride2'); c.dot(8, 25, '#3a2a1e', 'ride2');
  },

  // 05 · Sculpture Garden lawn: trees, long shadows, no sculptures pictured.
  la_sculpture_garden(c, { GW, GH }) {
    c.bands(0, [[8, '#7ab8ea'], [6, '#a8d2f2'], [7, '#d8ecf6']]);
    // modern campus buildings behind
    c.px(4, 8, 22, 14, '#d9cdb4'); for (let x = 6; x < 25; x += 3) c.px(x, 10, 2, 10, '#8aa3bd');
    c.px(60, 5, 26, 17, '#c9b89a'); for (let y = 7; y < 21; y += 3) c.px(62, y, 22, 1, '#7a8ea8');
    c.px(30, 12, 26, 10, '#e2d8c4'); for (let x = 32; x < 55; x += 4) c.px(x, 14, 2, 6, '#8aa3bd');
    // lawn
    c.px(0, 20, GW, GH - 20, '#6aa84a');
    for (let y = 22; y < GH; y += 5) c.px(0, y, GW, 2, '#76b454');
    // curving path
    for (let y = 20; y < GH; y++) { const cx = 50 + Math.round(10 * Math.sin(y / 9)); const w = 2 + Math.round((y - 20) / 7); c.px(cx - w, y, w * 2, 1, '#e6d8b8'); }
    // tree shadows (stretched east), trunks, canopies
    const trees = [[12, 34, 8, '#2f6b3a', '#44874a'], [30, 26, 6, '#2c5e38', '#3f7a42'], [72, 36, 9, '#6a4a9a', '#8a6ac0'], [84, 24, 5, '#2f6b3a', '#44874a']];
    trees.forEach(([x, y, r]) => ellipse(c, x + r + 3, y + r + 2, r + 4, 2, '#4f8a38'));
    trees.forEach(([x, y, r, d, l]) => { c.px(x - 1, y, 2, r + 2, '#5a3e2a'); c.disc(x, y - 1, r, d); c.disc(x - 2, y - 3, Math.max(2, r - 3), l); });
    for (let i = 0; i < 14; i++) c.dot(64 + Math.floor(c.rand() * 16), 28 + Math.floor(c.rand() * 14), '#b89ae0', 'twinkle');
    // people: blankets, a reader, walkers on the path
    [[18, 50, '#e05a4a'], [60, 56, '#f0b82a']].forEach(([x, y, col]) => { c.px(x, y, 9, 4, col); c.px(x + 2, y + 1, 2, 2, '#e0aa80'); c.px(x + 5, y + 1, 3, 1, '#ffffff'); });
    c.px(34, 42, 3, 2, '#3f6fd1'); c.px(34, 41, 2, 1, '#8a5a3a');
    person(c, 49, 40, '#8e3fd0', '#e0aa80', 'ride');
    person(c, 56, 62, '#4a9a6a', '#8a5a3a', 'ride2');
    // leaves drifting
    c.dot(40, 10, '#6aa84a', 'drift'); c.dot(22, 16, '#b89ae0', 'drift2');
  },

  // 06 · Botanical garden in the ravine, early morning, mist.
  la_botanical(c, { GW, GH, bird }) {
    c.bands(0, [[10, '#cfe6d8'], [12, '#b4d6c0']]);
    // tall trees on both slopes, stepping down toward the middle
    for (let x = 0; x < GW; x++) {
      const d = Math.abs(x - 44);
      const top = Math.round(2 + (44 - d) * 0.35 + 3 * Math.sin(x / 2.7) + 2 * Math.sin(x / 1.3));
      c.px(x, top, 1, GH - top, x % 3 ? '#23523a' : '#1c4430');
    }
    // lighter mid-layer canopy
    c.silhouette((x) => 26 + Math.round(Math.abs(x - 44) * -0.25 + 3 * Math.sin(x / 3.1)), '#2f6b45', GH);
    // a couple of tall palms poking above
    [[14, 30, 26], [74, 32, 28]].forEach(([x, base, h]) => {
      for (let i = 0; i < h; i++) c.dot(x, base - i, '#7a6a52');
      const ty = base - h;
      [[-4, 2], [-3, 0], [3, 0], [4, 2], [-2, -2], [2, -2]].forEach(([dx, dy]) => { for (let s = 1; s <= Math.abs(dx); s++) c.dot(x + Math.sign(dx) * s, ty + Math.round((dy * s) / Math.abs(dx)), '#4a8a4a', 'sway'); });
    });
    // ravine floor: stream running away from you
    c.silhouette((x) => 40 + Math.round(Math.abs(x - 44) * 0.18), '#4a4030');
    for (let y = 40; y < GH; y++) {
      const t = (y - 40) / (GH - 40);
      const cx = 44 + Math.round(6 * Math.sin(y / 6));
      const w = Math.round(2 + t * 10);
      c.px(cx - w, y, w * 2, 1, y % 3 ? '#5a9ab4' : '#6aacc4');
    }
    for (let y = 42; y < GH; y += 3) { const cx = 44 + Math.round(6 * Math.sin(y / 6)); c.px(cx - 1 + (y % 4), y, 2, 1, '#e0f4ff', 'waves'); }
    // stepping stones
    [[40, 50], [47, 55], [38, 60]].forEach(([x, y]) => { c.px(x, y, 4, 2, '#a8a294'); c.px(x + 1, y - 1, 2, 1, '#c4beb0'); });
    // ferns + big leaves in the foreground
    for (let x = 0; x < GW; x += 5) {
      if (x > 26 && x < 60) continue;
      c.px(x, 54, 1, 10, '#3f8a3a', 'sway'); c.px(x - 2, 56, 2, 1, '#56a04a', 'sway'); c.px(x + 1, 57, 2, 1, '#56a04a', 'sway'); c.px(x - 2, 59, 2, 1, '#56a04a', 'sway');
    }
    c.disc(8, 60, 5, '#3a7a3a'); c.disc(80, 61, 5, '#3a7a3a');
    // morning mist + light shafts
    for (let y = 18; y < 44; y += 7) for (let x = -10; x < GW; x += 30) c.px(x + (y % 5) * 2, y, 16, 1, '#4a8a66', y % 2 ? 'drift' : 'drift2');
    for (let y = 2; y < 30; y += 3) c.px(54 + Math.floor(y / 3), y, 2, 1, '#9ac89a', 'glow');
    // a walker on the path above the stream
    person(c, 30, 46, '#f0b82a', '#e0aa80');
    bird(c, 60, 6, '#2a3a30', 'drift');
  },

  // 07 · Westwood Village at night, the theater tower lit.
  la_village(c, { GW, GH }) {
    c.bands(0, [[10, '#141a3a'], [10, '#212a58'], [8, '#34306a'], [6, '#5a3a78']]);
    for (let i = 0; i < 14; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * 20), '#ffffff', 'twinkle');
    // Spanish-style blocks with tile roofs
    [[0, 30, 22, '#e8d4b0'], [62, 28, 26, '#e2c8a0']].forEach(([x, y, w, col]) => {
      c.px(x, y, w, 46 - y, col); c.px(x, y - 2, w, 2, TILE);
      for (let wx = x + 2; wx < x + w - 2; wx += 5) { arch(c, wx, y + 3, 3, 5, '#ffcf6a'); c.px(wx, y + 12, 3, 4, '#ffcf6a', 'twinkle'); }
    });
    // theater: body, marquee, tower with neon bands and a spire
    c.px(22, 30, 40, 16, '#f2eee4');
    c.px(22, 30, 40, 1, '#cfc8b8');
    c.px(18, 38, 48, 4, '#b8283a');
    for (let x = 19; x < 66; x += 2) c.dot(x, 38, '#ffe39a', x % 4 ? 'twinkle' : 'glint');
    for (let x = 19; x < 66; x += 2) c.dot(x, 41, '#ffe39a', x % 4 ? 'glint' : 'twinkle');
    c.px(24, 39, 36, 2, '#f7f1e1');
    for (let x = 26; x < 58; x += 4) c.px(x, 39, 2, 1, '#3a3a4a');
    c.px(30, 42, 24, 4, '#ffd98a');
    // tower
    c.px(38, 8, 8, 30, '#f6f2ea');
    c.px(44, 8, 2, 30, '#d4cebe');
    [12, 17, 22, 27, 32].forEach((y) => c.px(37, y, 10, 1, '#5ad0ff', 'glow'));
    c.px(40, 13, 4, 18, '#ff5a8a', 'glow');
    c.px(39, 6, 6, 2, '#f6f2ea'); c.px(40, 4, 4, 2, '#f6f2ea'); c.px(41, 1, 2, 3, '#f6f2ea'); c.dot(41, 0, '#5ad0ff', 'glint');
    // sidewalk + street
    c.px(0, 46, GW, 3, '#8a8494');
    c.px(0, 49, GW, GH - 49, '#34323e');
    for (let x = 2; x < GW; x += 10) c.px(x, 56, 5, 1, '#e8d060');
    // glow on the street under the marquee
    for (let x = 24; x < 62; x += 2) c.dot(x, 50, '#6a5a58');
    // cars
    c.px(8, 51, 14, 4, '#d84a4a', 'ride'); c.px(11, 49, 8, 2, '#a83a3a', 'ride'); c.dot(21, 52, '#fff6c0', 'ride'); c.px(10, 55, 2, 1, '#111', 'ride'); c.px(18, 55, 2, 1, '#111', 'ride');
    c.px(50, 58, 14, 4, '#e8e8f0', 'ride2'); c.px(53, 56, 8, 2, '#b8b8c8', 'ride2'); c.dot(50, 59, '#ff4a4a', 'ride2'); c.px(52, 62, 2, 1, '#111', 'ride2'); c.px(60, 62, 2, 1, '#111', 'ride2');
    // a queue for the late show
    [[26, '#3f6fd1'], [29, '#f0b82a'], [32, '#e05a4a'], [35, '#4a9a6a']].forEach(([x, col], i) => person(c, x, 49, col, i % 2 ? '#8a5a3a' : '#e0aa80', i === 3 ? 'bob' : undefined));
  },

  // 08 · Jacaranda season: purple canopy overhead, purple sidewalk below.
  la_jacaranda(c, { GW, GH, rider }) {
    c.bands(0, [[14, '#6ab0ea'], [14, '#9acaf0'], [12, '#c4e0f4']]);
    c.silhouette((x) => 30 - Math.round(2 * Math.sin(x / 3) + (x % 7 < 3 ? 1 : 0)), '#4f7a52', 40);
    // brick building in the background
    c.px(20, 16, 48, 24, BRICK); mortar(c, 20, 16, 48, 24);
    c.px(19, 15, 50, 1, STONE);
    for (let x = 24; x < 66; x += 8) arch(c, x, 20, 4, 8, '#4a3040');
    // trunks
    [[10, 3], [76, 3], [36, 2], [56, 2]].forEach(([x, w]) => c.px(x, 18, w, 30, '#4a3a30'));
    c.px(11, 20, 8, 1, '#4a3a30'); c.px(70, 22, 7, 1, '#4a3a30');
    // canopy: a purple ceiling with sky holes
    c.silhouette((x) => 10 + Math.round(4 * Math.sin(x / 5) + 3 * Math.sin(x / 2.1)), '#7a5ac0', 0);
    for (let x = 0; x < GW; x++) { const b = 10 + Math.round(4 * Math.sin(x / 5) + 3 * Math.sin(x / 2.1)); c.px(x, 0, 1, b, '#8a6ad0'); c.dot(x, b, x % 3 ? '#7050b0' : '#8a6ad0'); }
    for (let i = 0; i < 90; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * 16), c.rand() > 0.5 ? '#b89af0' : '#6a4aa8');
    for (let i = 0; i < 8; i++) c.px(Math.floor(c.rand() * 80) + 4, 2 + Math.floor(c.rand() * 6), 2, 1, '#9acaf0');
    c.disc(8, 16, 6, '#8a6ad0'); c.disc(80, 16, 6, '#8a6ad0'); c.disc(46, 13, 4, '#8a6ad0');
    // sidewalk + grass strip + street, all dusted purple
    c.px(0, 40, GW, 4, '#6aa84a');
    c.px(0, 44, GW, 10, '#d8d0c4');
    for (let x = 0; x < GW; x += 12) c.px(x, 44, 1, 10, '#b8b0a4');
    c.px(0, 54, GW, GH - 54, '#5a5a62');
    for (let i = 0; i < 110; i++) c.dot(Math.floor(c.rand() * GW), 40 + Math.floor(c.rand() * 24), c.rand() > 0.4 ? '#9a7ad8' : '#b89af0');
    // falling blossoms
    for (let i = 0; i < 10; i++) c.dot(Math.floor(c.rand() * GW), 16 + Math.floor(c.rand() * 24), '#c8aaf8', i % 2 ? 'drift' : 'drift2');
    // someone riding through, someone walking
    rider(c, 40, 61, '#f0b82a', 'ride');
    person(c, 64, 52, '#3f6fd1', '#8a5a3a', 'bob');
  },

  // 09 · Sunset Boulevard curves at night, from high above.
  la_sunset_blvd(c, { GW, GH }) {
    c.bands(0, [[4, '#1a1a40'], [4, '#3a2a5a'], [3, '#7a4a6a']]);
    // dark hillsides with house lights
    c.px(0, 10, GW, GH - 10, '#1e2e2a');
    for (let i = 0; i < 70; i++) c.dot(Math.floor(c.rand() * GW), 12 + Math.floor(c.rand() * 52), c.rand() > 0.5 ? '#2a4238' : '#162420');
    for (let i = 0; i < 26; i++) c.dot(Math.floor(c.rand() * GW), 12 + Math.floor(c.rand() * 50), '#ffd98a', 'twinkle');
    [[20, 3, '#26382f'], [34, 4, '#223430'], [48, 5, '#26382f']].forEach(([y, a, col], i) => { for (let x = 0; x < GW; x++) c.dot(x, y + Math.round(a * Math.sin(x / 7 + i * 2)), col); });
    // far city glow on the horizon
    c.px(0, 10, GW, 2, '#4a3a4a');
    for (let x = 0; x < GW; x += 3) c.dot(x, 11, '#ffc27a', x % 2 ? 'twinkle' : 'glint');
    // the road: an S curve that widens toward you
    const cx = (y) => 44 + Math.round(26 * Math.sin((y - 12) / 9)) * ((y - 8) / 56);
    for (let y = 12; y < GH; y++) {
      const w = 1 + Math.round((y - 12) / 10);
      const x = Math.round(cx(y));
      c.px(x - w - 1, y, w * 2 + 2, 1, '#3a3a44');
      c.dot(x, y, y % 4 < 2 ? '#c8b040' : '#3a3a44');
    }
    // headlights one way, tail lights the other
    for (let y = 14; y < GH; y += 3) {
      const x = Math.round(cx(y));
      const w = 1 + Math.round((y - 12) / 10);
      c.dot(x - w, y, '#fff8d8', y % 2 ? 'glint' : 'twinkle');
      c.dot(x + w, y + 1, '#ff4a4a', y % 2 ? 'twinkle' : 'glint');
    }
    // canopy of big trees framing the lower corners
    c.disc(4, 60, 9, '#122018'); c.disc(84, 58, 10, '#122018'); c.disc(10, 64, 6, '#18281e');
    // street lamps along the curve
    [20, 34, 48].forEach((y) => { const x = Math.round(cx(y)) + 3 + Math.round(y / 12); c.px(x, y, 1, 3, '#5a5a62'); c.dot(x, y - 1, '#ffe8a8', 'glow'); });
  },

  // 10 · Santa Ana afternoon: hot wind, bent palms, sharp mountains.
  la_santa_ana(c, { GW, GH }) {
    c.bands(0, [[10, '#1f5aa8'], [9, '#3a78c4'], [8, '#6aa0d8'], [6, '#c8c8b0']]);
    c.disc(72, 9, 5, '#fff4c8'); c.disc(72, 9, 3, '#ffffff');
    // mountains, crisp enough to see every ridge
    c.px(0, 33, GW, 8, '#c8c8b0');
    c.ridge(30, 10, 5, '#a8784a', GH);
    c.ridge(34, 6, 9, '#8a5e3a', GH);
    for (let x = 0; x < GW; x += 3) c.dot(x, 30 + Math.round(3 * Math.sin(x / 4)), '#c8946a');
    // city below, bleached in the heat
    c.px(0, 40, GW, GH - 40, '#d8c8a4');
    for (let x = 0; x < GW; x += 7) { const h = 3 + ((x * 7) % 5); c.px(x, 44 - h, 5, h, x % 2 ? '#efe4cc' : '#e0cfae'); c.px(x, 44 - h, 5, 1, TILE); }
    c.px(0, 44, GW, 3, '#b8a888');
    // dry grass hill in the foreground
    c.silhouette((x) => 50 + Math.round(3 * Math.sin(x / 8)), '#c9a454');
    c.silhouette((x) => 56 + Math.round(2 * Math.sin(x / 6 + 1)), '#b08a3e');
    for (let x = 1; x < GW; x += 4) c.px(x, 49 + Math.round(3 * Math.sin(x / 8)), 1, 2, '#e0c070', 'sway');
    // palms leaning with the wind
    [[16, 58, 32], [28, 60, 24], [66, 58, 36]].forEach(([x, base, h]) => {
      const lean = (i) => Math.round((i * i) / (h * 4));
      for (let i = 0; i < h; i++) c.px(x - lean(i), base - i, 2, 1, i % 3 ? '#6b4a2f' : '#58391f');
      const tx = x - lean(h - 1);
      const ty = base - h;
      [[-9, 3], [-8, 0], [-7, -2], [-6, 5], [-4, 6], [3, -2], [4, 2]].forEach(([dx, dy], i) => {
        const n = Math.abs(dx);
        for (let s = 1; s <= n; s++) c.px(tx + Math.sign(dx) * s, ty + Math.round((dy * s) / n), 1, 2, i % 2 ? '#2e6b3a' : '#3f8a4a', 'sway');
      });
      c.px(tx - 1, ty - 1, 4, 3, '#2e6b3a');
    });
    // heat shimmer + blowing leaves
    for (let x = 0; x < GW; x += 14) c.px(x + 3, 47, 5, 1, '#c8b890', 'drift');
    [[80, 20], [70, 30], [58, 24], [84, 40]].forEach(([x, y], i) => c.px(x, y, 2, 1, '#c89a3a', i % 2 ? 'drift2' : 'drift'));
  },

  // 11 · The view west at sunset, ocean in the haze.
  la_view_west(c, { GW, GH, bird }) {
    c.bands(0, [[7, '#4a4a90'], [6, '#8a5aa0'], [6, '#d8708a'], [6, '#f59a6a'], [6, '#fbc47a'], [4, '#ffe0a0']]);
    c.disc(40, 30, 4, '#fff4c8');
    // ocean sliver on the horizon
    c.px(0, 34, GW, 3, '#e8a878');
    for (let x = 30; x < 52; x += 3) c.px(x, 35, 2, 1, '#fff0c0', 'glint');
    // Santa Monica Mountains running down to the sea on the right
    c.silhouette((x) => (x < 48 ? GH : 36 - Math.round((x - 48) / 3.2) + Math.round(1.5 * Math.sin(x / 3))), '#7a5a7a', 40);
    c.silhouette((x) => (x < 60 ? GH : 38 - Math.round((x - 60) / 4) + Math.round(Math.sin(x / 2.5))), '#5e4a6a', 42);
    // haze bands
    c.px(0, 37, GW, 3, '#c89090');
    for (let y = 36; y < 44; y += 3) for (let x = -10; x < GW; x += 22) c.px(x + (y % 4) * 3, y, 14, 1, '#d8a0a0', y % 2 ? 'drift' : 'drift2');
    // the city spreading west
    c.px(0, 40, GW, 10, '#6a4a64');
    for (let i = 0; i < 40; i++) c.dot(Math.floor(c.rand() * GW), 41 + Math.floor(c.rand() * 9), c.rand() > 0.4 ? '#ffd98a' : '#ffffff', 'twinkle');
    // foreground rooftops: tile roofs, palms, a brick parapet
    c.px(0, 50, GW, GH - 50, '#3a2434');
    [[2, 48, 18], [26, 50, 14], [58, 49, 20]].forEach(([x, y, w]) => { c.px(x, y, w, GH - y, '#4a2e3e'); c.px(x - 1, y - 1, w + 2, 1, '#7a3a34'); });
    c.px(0, 58, GW, 6, BRICK_D);
    for (let x = 0; x < GW; x += 4) c.px(x, 58, 2, 1, '#6a2a1e');
    [[22, 58, 20], [48, 58, 16], [82, 58, 22]].forEach(([x, base, h]) => {
      for (let i = 0; i < h; i++) c.dot(x, base - i, '#2a1a24');
      [[-4, 2], [-3, 0], [3, 0], [4, 2], [-2, -1], [2, -1]].forEach(([dx, dy]) => { for (let s = 1; s <= Math.abs(dx); s++) c.dot(x + Math.sign(dx) * s, base - h + Math.round((dy * s) / Math.abs(dx)), '#2a1a24', 'sway'); });
    });
    bird(c, 60, 14, '#3a2a4a', 'drift'); bird(c, 66, 11, '#3a2a4a', 'drift');
  },

  // 12 · Looking out through the brick arcades onto a sunny quad.
  la_arcades(c, { GW, GH }) {
    // what you see through the arches
    c.bands(0, [[12, '#6ab0ea'], [18, '#a8d4f4']]);
    c.silhouette((x) => 22 - Math.round(3 * Math.sin(x / 4) + 2 * Math.sin(x / 1.8)), '#3f7a42', 40);
    c.px(0, 30, GW, 16, '#6aa84a');
    for (let y = 32; y < 46; y += 4) c.px(0, y, GW, 2, '#78b656');
    person(c, 30, 38, '#e05a4a', '#e0aa80', 'ride');
    person(c, 62, 40, '#3f6fd1', '#8a5a3a', 'ride2');
    // the arcade wall: brick with three round arches, in shade
    const openings = [[6, 20], [34, 20], [62, 20]];
    for (let y = 0; y < 46; y++) {
      for (let x = 0; x < GW; x++) {
        const inside = openings.some(([ox, w]) => {
          const r = w / 2; const cx = ox + r;
          if (x < ox || x >= ox + w) return false;
          if (y >= 18) return true;
          const dy = 18 - y; const dx = x + 0.5 - cx;
          return dy * dy + dx * dx <= r * r && y >= 8;
        });
        if (!inside) c.dot(x, y, (y + (x >> 2)) % 2 && x % 4 === 0 ? '#6a2a1e' : '#8a3a28');
      }
    }
    // stone voussoir trim around each arch + capitals
    openings.forEach(([ox, w]) => {
      const r = w / 2; const cx = ox + r;
      for (let a = 0; a <= 40; a++) {
        const th = Math.PI * (a / 40);
        c.dot(Math.round(cx - 0.5 - Math.cos(th) * (r + 0.5)), Math.round(18 - Math.sin(th) * (r + 0.5)), a % 4 < 2 ? STONE : STONE_D);
      }
      c.px(ox - 2, 18, 3, 2, STONE); c.px(ox + w - 1, 18, 3, 2, STONE);
    });
    // columns
    [[3, 3], [30, 4], [58, 4], [83, 3]].forEach(([x, w]) => { c.px(x, 20, w, 26, '#e0cca8'); c.px(x + w - 1, 20, 1, 26, '#b8a07a'); });
    // walkway floor in shade with sunlit arch shapes thrown across it
    c.px(0, 46, GW, GH - 46, '#8a6a58');
    for (let y = 46; y < GH; y += 3) c.px(0, y, GW, 1, '#7a5a4a');
    openings.forEach(([ox, w]) => {
      for (let y = 48; y < GH; y++) {
        const t = (y - 48) / (GH - 48);
        const sx = ox + 6 + Math.round(t * 12);
        const sw = w - 4 + Math.round(t * 4);
        c.px(sx, y, sw, 1, y > 58 ? '#e8c8a0' : '#dcb890');
      }
    });
    // someone crossing the arcade
    c.px(46, 50, 2, 6, '#f0b82a', 'ride2'); c.px(46, 48, 2, 2, '#e0aa80', 'ride2');
  },
};
