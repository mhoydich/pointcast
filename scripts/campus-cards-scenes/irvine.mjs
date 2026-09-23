// Campus Cards · Set 04 · Irvine — scenes. Unofficial, places only, CC0.
// Set data (titles, rarities, flavor) lives in src/data/campus-cards.json.

// ---------------------------------------------------------------- helpers
function ringFill(c, GW, GH, cx, cy, r0, r1, color, layer) {
  for (let y = Math.max(0, cy - r1 - 1); y <= Math.min(GH - 1, cy + r1 + 1); y++) {
    let run = -1;
    for (let x = Math.max(0, cx - r1 - 1); x <= Math.min(GW, cx + r1 + 1); x++) {
      const d = Math.hypot(x - cx, y - cy);
      const inside = x < GW && d >= r0 - 0.3 && d <= r1 + 0.3;
      if (inside && run < 0) run = x;
      if (!inside && run >= 0) { c.px(run, y, x - run, 1, color, layer); run = -1; }
    }
  }
}

function line(c, x0, y0, x1, y1, color, layer, w = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) c.px(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), w, w, color, layer);
}

function person(c, x, y, shirt, layer, skin = '#e0aa80', legs = '#2d2d3d') {
  // y is the feet row
  c.px(x, y - 6, 2, 2, skin, layer);
  c.px(x, y - 4, 2, 3, shirt, layer);
  c.dot(x, y - 1, legs, layer); c.dot(x + 1, y - 1, legs, layer);
}

function tree(c, x, y, r, dark = '#2f6b3a', light = '#3f8a4a', layer) {
  c.disc(x, y, r, dark, layer);
  if (r > 1) c.disc(x - 1, y - 1, Math.max(1, r - 2), light, layer);
}

function euc(c, x, base, h, trunk = '#cbbca2', leaf = '#5f7f62', leaf2 = '#7f9a78', layer) {
  // tall narrow eucalyptus: pale bare trunk, ragged columnar crown hanging off it
  c.px(x, base - h, 2, h, trunk);
  c.px(x + 1, base - h, 1, h, '#a8987c');
  for (let y = base - Math.round(h * 0.35); y < base; y += 5) c.dot(x, y, '#efe6d2');
  // branches forking off the top third
  c.dot(x - 1, base - h + 4, trunk); c.dot(x - 2, base - h + 3, trunk); c.dot(x + 2, base - h + 5, trunk); c.dot(x + 3, base - h + 4, trunk);
  const crown = Math.round(h * 0.6);
  const r = (k) => { const v = Math.sin(x * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  for (let k = 0; k < 10 + Math.round(h / 3); k++) {
    const t = r(k);
    const y = base - h - 3 + Math.round(t * crown);
    const spread = 1 + Math.sin(t * Math.PI) * 4;
    const cx = x + Math.round((r(k + 40) - 0.5) * 2 * spread);
    const w = 2 + Math.round(r(k + 80) * 2);
    c.px(cx - 1, y, w, 2, k % 3 ? leaf : leaf2, layer);
    if (r(k + 120) > 0.5) c.dot(cx, y + 2, leaf, layer); // drooping leaf tips
  }
}

// ---------------------------------------------------------------- scenes
export const scenes = {
  // 01 · top-down: the park inside the ring, buildings facing in, walkers orbiting
  irvine_ring(c, { GW, GH }) {
    c.px(0, 0, GW, GH, '#b5bd7c');
    for (let i = 0; i < 160; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * GH), c.rand() > 0.5 ? '#c6c98c' : '#9fae6a');
    const cx = 44; const cy = 32;
    // outer ring road
    ringFill(c, GW, GH, cx, cy, 29, 31, '#7f7c76');
    for (let a = 0; a < 360; a += 12) {
      const r = (a * Math.PI) / 180;
      c.dot(cx + Math.round(Math.cos(r) * 30), cy + Math.round(Math.sin(r) * 30), '#e8e2c8');
    }
    // concrete buildings between road and mall, set between the spokes
    for (let i = 0; i < 12; i++) {
      const ang = ((i + 0.5) / 12) * Math.PI * 2;
      const bx = cx + Math.round(Math.cos(ang) * 24.5); const by = cy + Math.round(Math.sin(ang) * 24.5);
      const horiz = Math.abs(Math.cos(ang)) < 0.6;
      const w = horiz ? 7 : 4; const h = horiz ? 4 : 6;
      c.px(bx - Math.floor(w / 2) + 1, by - Math.floor(h / 2) + 1, w, h, '#8f8878');
      c.px(bx - Math.floor(w / 2), by - Math.floor(h / 2), w, h, '#e3dac6');
      c.px(bx - Math.floor(w / 2), by - Math.floor(h / 2), w, 1, '#f4efe2');
      if (i % 3 === 0) c.dot(bx, by, '#6fb8c8', 'twinkle');
    }
    // the ring mall walkway
    ringFill(c, GW, GH, cx, cy, 18, 20, '#ece2c6');
    // the park
    c.disc(cx, cy, 17, '#4d9a45');
    for (let i = 0; i < 70; i++) {
      const a = c.rand() * Math.PI * 2; const r = Math.sqrt(c.rand()) * 16;
      c.dot(cx + Math.round(Math.cos(a) * r), cy + Math.round(Math.sin(a) * r), '#5fae52');
    }
    // spoke paths from the mall to the middle
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.26;
      line(c, cx + Math.round(Math.cos(ang) * 4), cy + Math.round(Math.sin(ang) * 4), cx + Math.round(Math.cos(ang) * 18), cy + Math.round(Math.sin(ang) * 18), '#ece2c6');
      line(c, cx + Math.round(Math.cos(ang) * 20), cy + Math.round(Math.sin(ang) * 20), cx + Math.round(Math.cos(ang) * 29), cy + Math.round(Math.sin(ang) * 29), '#d8cfb6');
    }
    c.disc(cx, cy, 4, '#ece2c6');
    c.disc(cx, cy, 2, '#7ec4d8');
    c.dot(cx, cy, '#e8f7ff', 'glint');
    // groves in the park
    [[36, 22], [52, 21], [33, 36], [55, 38], [44, 44], [40, 27], [50, 31], [37, 42], [53, 27]].forEach(([x, y], i) => tree(c, x, y, i % 3 ? 2 : 3, '#2c6636', '#3f8a4a'));
    // eucalyptus windbreak dots in the corners
    [[5, 6], [10, 3], [4, 14], [82, 58], [77, 61], [84, 50], [6, 58], [82, 5]].forEach(([x, y]) => tree(c, x, y, 2, '#5f7f62', '#7f9a78'));
    // walkers orbiting the mall (symmetric bbox so it spins about the park's center)
    c.px(cx - 19, cy - 19, 39, 39, 'none', 'spin');
    const cols = ['#ff6b4a', '#ffd23f', '#5a6bff', '#f07fbf', '#ffffff', '#3fb8a8', '#ff9a3a'];
    cols.forEach((col, i) => {
      const a = (i / cols.length) * Math.PI * 2 + 0.2;
      c.px(cx + Math.round(Math.cos(a) * 19) - 1, cy + Math.round(Math.sin(a) * 19) - 1, 2, 2, '#1d1d2b', 'spin');
      c.dot(cx + Math.round(Math.cos(a) * 19), cy + Math.round(Math.sin(a) * 19), col, 'spin');
    });
    // a car on the outer road
    c.px(cx + 29, cy - 2, 2, 3, '#d23b3b', 'bob');
  },

  // 02 · the concrete library, clear afternoon
  irvine_library(c, { GW, GH, bird }) {
    c.bands(0, [[7, '#3f9ee0'], [6, '#6db8ec'], [5, '#9fd2f4']]);
    bird(c, 12, 5, '#2b3a55', 'drift'); bird(c, 20, 3, '#2b3a55', 'drift');
    // distant trees behind
    c.px(0, 18, GW, 32, '#3d7a48');
    c.silhouette((x) => 17 - Math.round(2 * Math.sin(x / 4) + (x % 9 < 3 ? 1 : 0)), '#3d7a48', 20);
    for (let i = 0; i < 50; i++) c.dot(Math.floor(c.rand() * GW), 16 + Math.floor(c.rand() * 34), '#2c6636');
    // main mass
    const x0 = 10; const x1 = 78;
    c.px(x0, 12, x1 - x0, 38, '#d9d0bc');
    // heavy cornice + shadow line
    c.px(x0 - 2, 10, x1 - x0 + 4, 4, '#e8e0cc');
    c.px(x0 - 2, 14, x1 - x0 + 4, 1, '#9d9482');
    // three stacked floors of deep-set windows between fins
    [16, 25, 34].forEach((fy) => {
      for (let x = x0 + 2; x < x1 - 2; x += 5) {
        c.px(x, fy, 3, 7, '#2e3a55');
        c.px(x, fy, 3, 1, '#1d2438');
        c.px(x + 3, fy - 1, 2, 9, '#ece4d0');
        c.dot(x + 4, fy + 7, '#a79e8a');
      }
      c.px(x0, fy + 8, x1 - x0, 1, '#b4ab96');
    });
    // sun catches a few panes
    [[17, 18], [37, 27], [57, 18], [67, 36], [27, 36]].forEach(([x, y]) => c.px(x, y, 2, 1, '#9fe0f0', 'glint'));
    // recessed ground floor on piers
    c.px(x0 + 2, 43, x1 - x0 - 4, 7, '#3b3a44');
    for (let x = x0 + 3; x < x1 - 3; x += 8) c.px(x, 43, 3, 7, '#cfc6b0');
    c.px(40, 45, 8, 5, '#f3d98a', 'glow');
    // plaza, steps, lawn
    c.px(0, 50, GW, 3, '#cfc6b0');
    c.px(0, 53, GW, 11, '#6fae4a');
    for (let y = 55; y < GH; y += 4) c.px(0, y, GW, 2, '#7cbc56');
    c.px(36, 50, 16, 14, '#e6ddc6');
    for (let y = 52; y < GH; y += 3) c.px(36, y, 16, 1, '#cfc6b0');
    // flanking trees
    tree(c, 4, 40, 7, '#2c6636', '#3f8a4a'); c.px(3, 46, 2, 8, '#5a4232');
    tree(c, 84, 38, 7, '#2c6636', '#3f8a4a'); c.px(83, 44, 2, 10, '#5a4232');
    // people with books
    person(c, 30, 60, '#ff6b4a'); person(c, 56, 58, '#3f6fd1');
    person(c, 44, 62, '#ffd23f', 'ride');
    c.px(20, 58, 6, 3, '#e05a8a'); c.px(21, 57, 2, 1, '#e0aa80');
  },

  // 03 · the marsh at first light: ponds, cattails, heron and egret
  irvine_marsh(c, { GW, GH, bird, glints }) {
    c.bands(0, [[7, '#f4d8a4'], [6, '#f6c690'], [5, '#f2ad86'], [8, '#dca3a8']]);
    c.disc(66, 18, 4, '#fff0c0');
    c.ridge(22, 5, 41, '#8f7fa6', 26);
    c.silhouette((x) => 24 - (x % 13 < 4 ? 2 : 0) - (x % 29 < 2 ? 3 : 0), '#586a5c', 28);
    // ponds
    c.bands(26, [[6, '#8ba6c2'], [8, '#9cb6cf'], [10, '#aec5d8']]);
    for (let y = 28; y < 46; y += 3) c.px(62 + ((y / 3) % 2), y, 8 - Math.floor((y - 28) / 5), 1, '#ffe7b8', 'glint');
    // a spit of marsh across the middle
    c.silhouette((x) => (x > 40 && x < 76 ? 40 + Math.round(Math.abs(x - 58) / 5 + Math.sin(x / 3)) : GH), '#6b8a4a', 44, 'base');
    for (let x = 42; x < 74; x += 3) c.px(x, 38 + Math.round(Math.abs(x - 58) / 5), 1, 3, '#56733f', 'sway');
    c.px(0, 50, GW, 14, '#5d7a3d');
    c.bands(50, [[4, '#8ba6c2'], [3, '#7c98b6']]);
    c.px(0, 57, GW, 7, '#4f6a34');
    // cattails
    for (let x = 0; x < GW; x += 2) {
      if (x > 26 && x < 44) continue;
      const h = 7 + ((x * 7) % 5);
      c.px(x, GH - h, 1, h, x % 4 ? '#3f5a2e' : '#56733f', 'sway');
      if (x % 6 === 0) c.px(x, GH - h - 3, 1, 3, '#7a4a2a', 'sway');
    }
    // great blue heron, standing still in the shallows
    const hx = 32; const hy = 55;
    c.px(hx - 1, hy - 11, 6, 7, '#4a5a78'); c.px(hx + 3, hy - 10, 2, 6, '#36445e'); c.px(hx - 1, hy - 5, 3, 1, '#6a7c98');
    c.px(hx, hy - 15, 2, 4, '#8a9ab4'); c.px(hx, hy - 17, 3, 2, '#f2f4f6'); c.px(hx, hy - 18, 3, 1, '#1d1d2b');
    c.dot(hx + 1, hy - 17, '#1d1d2b'); c.px(hx + 3, hy - 16, 4, 1, '#e0a93a');
    c.px(hx, hy - 4, 1, 5, '#3a3430'); c.px(hx + 3, hy - 4, 1, 5, '#3a3430');
    for (let x = hx - 4; x < hx + 8; x += 3) c.px(x, hy + 1, 2, 1, '#e8f4ff', 'waves');
    // white egret further off
    c.px(56, 36, 3, 3, '#ffffff'); c.px(57, 33, 1, 3, '#ffffff'); c.px(57, 32, 2, 1, '#ffffff'); c.dot(59, 32, '#e0a93a');
    c.px(57, 39, 1, 2, '#2d2d3d');
    // ducks
    [[10, 32], [16, 34]].forEach(([x, y]) => { c.px(x, y, 3, 1, '#5a4a3a', 'bob'); c.dot(x + 2, y - 1, '#2f6b4a', 'bob'); });
    glints(c, 27, 44, 10, '#ffffff');
    for (let i = 0; i < 3; i++) bird(c, 20 + i * 6, 8 + (i % 2) * 2, '#3a2e3a', 'drift');
  },

  // 04 · beach cottages under the bluff at sunset
  irvine_cottages(c, { GW, GH, glints, waves, bird }) {
    c.bands(0, [[6, '#3a3a86'], [5, '#6a4aa0'], [5, '#c65a8a'], [5, '#f28a6a'], [4, '#ffc27a']]);
    c.disc(18, 24, 4, '#fff0b0');
    // the bluff behind, coastal scrub on top
    c.silhouette((x) => 14 + Math.round(3 * Math.sin(x / 11) + Math.sin(x / 3.7)), '#9a7a5a', 40, 'base');
    c.silhouette((x) => 14 + Math.round(3 * Math.sin(x / 11) + Math.sin(x / 3.7)), '#6a7a4a', 18, 'base');
    for (let x = 1; x < GW; x += 4) c.dot(x, 16 + Math.round(3 * Math.sin(x / 11)), '#8a9a5a');
    // sand
    c.px(0, 38, GW, 10, '#e8c890');
    for (let i = 0; i < 40; i++) c.dot(Math.floor(c.rand() * GW), 38 + Math.floor(c.rand() * 10), '#d6b47a');
    // cottages on short stilts, each a different paint
    const paints = [['#e8d6a8', '#b0463a'], ['#8fc7c4', '#3f5a7a'], ['#f2e8d8', '#6a8a4a'], ['#e5a86a', '#5a3a2a'], ['#c8d8e8', '#8a3a4a'], ['#f0c8c0', '#3a6a6a']];
    paints.forEach(([wall, roof], i) => {
      const x = 4 + i * 14; const y = 28 + (i % 2);
      c.px(x, y, 10, 7, wall);
      for (let r = 0; r < 3; r++) c.px(x - 1 + r, y - 1 - r, 12 - r * 2, 1, roof);
      c.px(x + 2, y + 2, 2, 2, '#ffd98a', 'twinkle'); c.px(x + 6, y + 2, 2, 2, '#3a3a50');
      c.px(x, y + 7, 1, 3, '#6a4a2f'); c.px(x + 9, y + 7, 1, 3, '#6a4a2f');
      c.px(x - 1, y + 6, 12, 1, '#8a6a4a');
    });
    // ocean foreground
    c.bands(48, [[4, '#e6f2f0'], [4, '#4f9ab8'], [8, '#2f7aa8']]);
    for (let y = 52; y < GH; y += 3) waves(c, y, '#bfe6f2');
    for (let y = 52; y < GH; y += 4) c.px(14 + ((y / 2) % 2), y, 8, 1, '#ffd98a', 'glint');
    glints(c, 52, 63, 8, '#ffffff');
    person(c, 50, 47, '#ff6b4a');
    bird(c, 60, 8, '#2b2240', 'drift'); bird(c, 66, 6, '#2b2240', 'drift'); bird(c, 72, 9, '#2b2240', 'drift');
  },

  // 05 · the back bay from the bluff: winding channel through the marsh
  irvine_backbay(c, { GW, GH, bird, glints }) {
    c.bands(0, [[6, '#5fb6ea'], [5, '#8fcdf2'], [4, '#c2e6f7']]);
    // far bluff with houses along the rim
    c.silhouette((x) => 14 + Math.round(Math.sin(x / 8) * 1.2), '#c7a978', 22);
    for (let x = 2; x < GW; x += 6) { c.px(x, 12 + Math.round(Math.sin(x / 8) * 1.2), 3, 2, '#f2eee4'); c.dot(x + 1, 11 + Math.round(Math.sin(x / 8) * 1.2), '#b0463a'); }
    // marsh floor
    c.px(0, 20, GW, 44, '#7a9a54');
    for (let i = 0; i < 200; i++) c.dot(Math.floor(c.rand() * GW), 20 + Math.floor(c.rand() * 44), c.rand() > 0.5 ? '#8aab5e' : '#9a8a5a');
    // mud flats + channel snaking toward the viewer
    for (let y = 20; y < GH; y++) {
      const t = (y - 20) / 44;
      const cx = 44 + Math.round(18 * Math.sin(y / 7));
      const w = 2 + Math.round(t * 9);
      c.px(cx - w - 3, y, w * 2 + 6, 1, '#a8906a');
      c.px(cx - w, y, w * 2, 1, y % 3 ? '#3f8ec0' : '#4f9fcf');
    }
    for (let y = 24; y < GH; y += 5) c.px(44 + Math.round(18 * Math.sin(y / 7)) - 1, y, 3, 1, '#e6f6ff', 'waves');
    // near bluff edge + trail
    c.silhouette((x) => 56 + Math.round(3 * Math.sin(x / 9 + 2)), '#b89a68');
    c.px(0, 61, GW, 3, '#d8c49a');
    for (let x = 1; x < GW; x += 5) c.px(x, 56 + Math.round(3 * Math.sin(x / 9 + 2)) - 2, 1, 2, '#6a8a4a', 'sway');
    // egrets on the flats
    [[20, 30], [66, 36], [30, 44], [72, 26]].forEach(([x, y]) => { c.px(x, y, 2, 2, '#ffffff'); c.dot(x + 1, y - 1, '#ffffff'); c.dot(x + 2, y - 1, '#e0a93a'); c.dot(x, y + 2, '#2d2d3d'); });
    // a kayak coming up the channel
    c.px(40, 50, 6, 1, '#ffd23f', 'bob'); c.px(42, 48, 2, 2, '#ff6b4a', 'bob'); c.dot(42, 47, '#e0aa80', 'bob');
    glints(c, 22, 60, 6, '#ffffff');
    rider(c, 10, 62, '#3fb8a8', 'ride');
    for (let i = 0; i < 3; i++) bird(c, 50 + i * 6, 5 + (i % 2) * 2, '#2b3a55', 'drift');
    function rider(cc, x, y, shirt, layer) { person(cc, x, y - 1, shirt, layer); }
  },

  // 06 · early modern concrete at night, sunshades lit from inside
  irvine_concrete(c, { GW, GH, bird }) {
    c.bands(0, [[10, '#0f1840'], [8, '#1c2a60'], [6, '#2d3d7a']]);
    [[6, 3], [18, 7], [30, 2], [70, 4], [82, 9], [58, 6], [12, 12]].forEach(([x, y]) => c.dot(x, y, '#ffffff', 'twinkle'));
    c.disc(76, 7, 3, '#f7f0d0'); c.disc(77, 6, 2, '#0f1840');
    // eucalyptus silhouettes behind
    c.silhouette((x) => 22 - Math.round(3 * Math.abs(Math.sin(x / 5))) - (x % 17 < 3 ? 4 : 0), '#16203a', 52);
    // the building: a heavy upper mass cantilevered over a narrow glass base
    const x0 = 8; const x1 = 80;
    c.px(x0, 14, x1 - x0, 28, '#b7ad9a');
    c.px(x0 - 1, 12, x1 - x0 + 2, 3, '#d6ccb6');
    c.px(x0, 41, x1 - x0, 2, '#8d8474');
    // sculpted fins with arched window heads, two tiers
    for (let x = x0 + 2; x < x1 - 3; x += 6) {
      [[17, 10], [30, 9]].forEach(([wy, wh], tier) => {
        c.dot(x + 1, wy, '#2a2a44'); c.px(x, wy + 1, 3, wh, '#2a2a44');
        const lit = ((x * 13 + tier * 5) % 7) < 3;
        if (lit) { c.dot(x + 1, wy + 1, '#ffcf6a', 'glow'); c.px(x, wy + 2, 3, wh - 1, '#ffcf6a', 'glow'); }
      });
      c.px(x + 3, 14, 3, 27, '#d6ccb6');
      c.px(x + 5, 14, 1, 27, '#9d9380');
    }
    c.px(x0, 28, x1 - x0, 1, '#9d9380');
    // shadow under the cantilever, glass base on round columns
    c.px(x0, 43, x1 - x0, 2, '#0c0c18');
    c.px(20, 45, 48, 7, '#1c2436');
    for (let x = 22; x < 66; x += 4) c.px(x, 45, 2, 7, '#2f3d5a');
    c.px(38, 46, 10, 6, '#ffdf8a', 'glow');
    [x0 + 2, 18, 70, x1 - 4].forEach((x) => c.px(x, 43, 2, 9, '#a39a86'));
    // plaza
    c.px(0, 52, GW, 12, '#3a3a4a');
    for (let x = 0; x < GW; x += 8) c.px(x, 52, 1, 12, '#2e2e3c');
    for (let y = 56; y < GH; y += 4) c.px(0, y, GW, 1, '#2e2e3c');
    // lamp pools + a late walker
    [[16, 54], [70, 54]].forEach(([x, y]) => { c.px(x, y - 8, 1, 8, '#6a6a76'); c.px(x - 1, y - 9, 3, 1, '#fff2c0', 'glow'); c.px(x - 4, y + 2, 9, 2, '#5a5646'); });
    person(c, 30, 60, '#3fb8a8', 'ride', '#c9926a', '#12121e');
    bird(c, 22, 14, '#0a0f24', 'drift');
  },

  // 07 · the ring walkway at golden hour, bending away around the park
  irvine_ringmall(c, { GW, GH }) {
    c.bands(0, [[6, '#f6c07a'], [6, '#f8d49a'], [6, '#fbe6bc']]);
    // concrete buildings on the outside of the curve
    c.px(56, 8, 32, 30, '#e2d4b8');
    for (let x = 58; x < GW; x += 4) { c.px(x, 12, 2, 20, '#8a7a66'); c.px(x, 12, 2, 4, '#ffcf8a', 'twinkle'); }
    c.px(54, 6, 34, 3, '#f0e4c8');
    c.px(56, 32, 32, 6, '#6a5e52');
    // park canopy inside the curve
    c.silhouette((x) => 14 + Math.round(3 * Math.sin(x / 5) + 2 * Math.sin(x / 2.2)), '#3f7a3a', 42, 'base', 0, 56);
    for (let i = 0; i < 60; i++) c.dot(Math.floor(c.rand() * 54), 14 + Math.floor(c.rand() * 24), c.rand() > 0.5 ? '#5a9a48' : '#e0b86a', 'sway');
    // lawn
    c.px(0, 38, GW, 26, '#6fae4a');
    for (let y = 40; y < GH; y += 5) c.px(0, y, GW, 2, '#7cbc56');
    // the walkway: wide at the bottom, curving up and to the right behind the canopy
    for (let y = 38; y < GH; y++) {
      const t = (y - 38) / 26;
      const cx = 64 - Math.round(38 * t * t);
      const w = 3 + Math.round(t * 12);
      c.px(cx - w, y, w * 2, 1, '#ece2c6');
      c.px(cx - w, y, 1, 1, '#c8bca0'); c.px(cx + w - 1, y, 1, 1, '#c8bca0');
    }
    // long shadows from trees
    for (let y = 44; y < GH; y += 6) c.px(0, y, 20 - (y - 44) / 2, 1, '#4f8a3a');
    // walkers and a rider moving along it
    person(c, 34, 57, '#ff6b4a', 'drift'); person(c, 46, 50, '#5a6bff', 'drift2');
    person(c, 56, 44, '#ffd23f', 'drift'); person(c, 22, 63, '#f07fbf', 'drift2');
    c.px(40, 61, 6, 1, '#1d1d2b', 'ride'); c.px(42, 56, 2, 4, '#3fb8a8', 'ride'); c.px(42, 54, 2, 2, '#e0aa80', 'ride');
    c.dot(40, 62, '#1d1d2b', 'ride'); c.dot(45, 62, '#1d1d2b', 'ride');
  },

  // 08 · a windbreak row across open ground, windy afternoon
  irvine_eucalyptus(c, { GW, GH, bird }) {
    c.bands(0, [[8, '#7cc4ec'], [8, '#a4d6f2'], [18, '#cfe8f4']]);
    // clouds drifting
    [[6, 6], [40, 3], [64, 9]].forEach(([x, y]) => { c.px(x, y, 12, 2, '#ffffff', 'drift'); c.px(x + 3, y - 1, 6, 1, '#ffffff', 'drift'); });
    c.ridge(30, 4, 52, '#b9a6b8', 34);
    // dry field
    c.px(0, 34, GW, 30, '#d8b86a');
    for (let y = 36; y < GH; y += 3) for (let x = (y % 2) * 3; x < GW; x += 7) c.px(x, y, 2, 1, '#c6a458');
    // the row, receding from left to right
    for (let i = 0; i < 9; i++) {
      const x = 4 + i * 9 + Math.round(i * i * 0.2);
      const h = 32 - i * 2;
      euc(c, x, 40 - Math.round(i * 0.6), h, i % 2 ? '#cbbca2' : '#d9ccb2', '#5a7a5e', '#7f9a78', 'sway');
    }
    // dirt trail along the row
    c.px(0, 44, GW, 3, '#bfa27a');
    c.px(0, 45, GW, 1, '#ae9068');
    // leaves blowing
    for (let i = 0; i < 12; i++) c.dot(Math.floor(c.rand() * GW), 18 + Math.floor(c.rand() * 30), '#8faa7a', 'drift2');
    // a rider on the trail
    c.px(0, 50, GW, 1, '#c6a458');
    person(c, 30, 45, '#d23b3b', 'ride');
    c.px(29, 45, 5, 1, '#1d1d2b', 'ride');
    bird(c, 52, 12, '#3a3a50', 'drift');
    // foreground grass
    for (let x = 1; x < GW; x += 3) c.px(x, 58 + (x % 4), 1, 6 - (x % 4), '#b0903e', 'sway');
  },

  // 09 · close up: jacaranda canopy over a sidewalk, petals everywhere
  irvine_jacaranda(c, { GW, GH }) {
    c.px(0, 0, GW, GH, '#8fcff0');
    // concrete wall behind
    c.px(0, 18, GW, 30, '#d6ccb8');
    for (let x = 0; x < GW; x += 11) c.px(x, 18, 1, 30, '#b8ae98');
    c.px(0, 30, GW, 1, '#b8ae98');
    // canopy
    for (let i = 0; i < 520; i++) {
      const x = Math.floor(c.rand() * GW);
      const y = Math.floor(Math.pow(c.rand(), 1.4) * 26);
      c.dot(x, y, ['#7a52c8', '#9a6ae0', '#b88af0', '#5a3aa0'][Math.floor(c.rand() * 4)]);
    }
    c.px(0, 0, GW, 6, '#7a52c8');
    for (let x = 0; x < GW; x += 2) c.dot(x, 6, '#9a6ae0');
    // trunks
    [[14, 3], [66, 3]].forEach(([x, w]) => { c.px(x, 14, w, 36, '#5a4a3a'); c.px(x + w - 1, 14, 1, 36, '#3e3228'); line(c, x + 1, 16, x - 7, 6, '#5a4a3a'); line(c, x + 1, 18, x + 9, 8, '#5a4a3a'); });
    // sidewalk carpeted in purple
    c.px(0, 48, GW, 16, '#cfc6b4');
    for (let y = 48; y < GH; y += 5) c.px(0, y, GW, 1, '#b4ab98');
    for (let x = 0; x < GW; x += 12) c.px(x, 48, 1, 16, '#b4ab98');
    for (let i = 0; i < 180; i++) c.dot(Math.floor(c.rand() * GW), 48 + Math.floor(c.rand() * 16), c.rand() > 0.5 ? '#9a6ae0' : '#b88af0');
    // parked bike under the tree
    const bx = 36; const by = 55;
    c.px(bx, by - 1, 2, 1, '#1d1d2b'); c.px(bx - 1, by, 1, 1, '#1d1d2b'); c.px(bx + 2, by, 1, 1, '#1d1d2b'); c.px(bx, by + 1, 2, 1, '#1d1d2b');
    c.px(bx + 7, by - 1, 2, 1, '#1d1d2b'); c.px(bx + 6, by, 1, 1, '#1d1d2b'); c.px(bx + 9, by, 1, 1, '#1d1d2b'); c.px(bx + 7, by + 1, 2, 1, '#1d1d2b');
    c.px(bx + 1, by - 3, 7, 1, '#3fb8a8'); c.px(bx + 4, by - 2, 1, 2, '#3fb8a8'); c.px(bx + 7, by - 5, 1, 3, '#3fb8a8'); c.px(bx + 1, by - 4, 2, 1, '#1d1d2b');
    c.px(bx + 7, by - 6, 3, 1, '#1d1d2b');
    // falling petals
    for (let i = 0; i < 16; i++) c.dot(Math.floor(c.rand() * GW), 10 + Math.floor(c.rand() * 36), i % 2 ? '#b88af0' : '#d4b0ff', i % 2 ? 'drift' : 'drift2');
    person(c, 58, 61, '#ffd23f', 'ride');
  },

  // 10 · top-down: a trail ducking under a big road
  irvine_biketrail(c, { GW, GH }) {
    c.px(0, 0, GW, GH, '#6fa850');
    for (let i = 0; i < 120; i++) c.dot(Math.floor(c.rand() * GW), Math.floor(c.rand() * GH), c.rand() > 0.5 ? '#80b860' : '#5f9444');
    // the trail, winding top to bottom
    for (let y = 0; y < GH; y++) {
      const cx = 40 + Math.round(10 * Math.sin(y / 10));
      c.px(cx - 4, y, 8, 1, '#8a8a92');
      if (y % 4 < 2) c.dot(cx, y, '#f4e27a');
    }
    // big road crossing, with its bridge shadow over the trail
    c.px(0, 24, GW, 16, '#4a4a54');
    c.px(0, 24, GW, 1, '#c8c8c8'); c.px(0, 39, GW, 1, '#c8c8c8');
    for (let x = 2; x < GW; x += 8) { c.px(x, 28, 4, 1, '#e8e8e8'); c.px(x + 4, 35, 4, 1, '#e8e8e8'); }
    c.px(0, 31, GW, 2, '#d8b83a');
    const ux = 40 + Math.round(10 * Math.sin(3.2));
    c.px(ux - 7, 22, 14, 2, '#b9b4a6'); c.px(ux - 7, 40, 14, 2, '#b9b4a6');
    c.px(ux - 6, 40, 12, 1, '#2e2e38');
    // cars on the road
    c.px(10, 26, 6, 3, '#d23b3b', 'ride'); c.px(12, 26, 2, 3, '#9ad0f0', 'ride');
    c.px(60, 34, 6, 3, '#f4f4f4', 'ride2'); c.px(62, 34, 2, 3, '#9ad0f0', 'ride2');
    c.px(30, 34, 6, 3, '#3f6fd1', 'ride2');
    // riders on the trail, top-down
    [[42, 8, '#ff6b4a'], [38, 50, '#ffd23f'], [46, 58, '#f07fbf']].forEach(([x, y, col]) => { c.px(x, y, 2, 4, '#1d1d2b', 'bob'); c.px(x, y + 1, 2, 2, col, 'bob'); });
    // shrubs + trees, and a pocket of eucalyptus
    [[10, 8], [74, 12], [16, 52], [70, 54], [8, 46], [80, 48]].forEach(([x, y], i) => tree(c, x, y, 3 + (i % 2), '#2c6636', '#3f8a4a'));
    for (let i = 0; i < 5; i++) tree(c, 60 + i * 5, 4, 2, '#5f7f62', '#7f9a78');
    // a little concrete footbridge over a drainage channel
    c.px(0, 16, 26, 2, '#5f9ac0');
    c.px(0, 16, 26, 1, '#7fb6d8', 'glint');
  },

  // 11 · dawn in the open hills, marine layer filling the flats below
  irvine_hills(c, { GW, GH, bird }) {
    c.bands(0, [[6, '#5a7ac0'], [5, '#8a9ad0'], [5, '#e4a8b4'], [5, '#f8c89a'], [4, '#fde0b0']]);
    c.disc(18, 22, 4, '#fff4c8');
    // far mountains
    c.ridge(22, 6, 91, '#9a88b0', 30);
    // the marine layer, a flat white sea below
    c.px(0, 26, GW, 14, '#eef0f2');
    c.px(0, 26, GW, 1, '#ffffff');
    for (let y = 28; y < 40; y += 3) for (let x = -12; x < GW; x += 20) c.px(x + (y % 7) * 2, y, 12, 1, '#dfe4ea', y % 2 ? 'drift' : 'drift2');
    // a few hilltops poking through
    c.silhouette((x) => (x > 48 && x < 70 ? 28 + Math.round(Math.abs(x - 59) / 3) : GH), '#b89a70', 31);
    // near golden hills
    c.px(0, 40, GW, 24, '#c8943e');
    c.silhouette((x) => 38 + Math.round(3 * Math.sin(x / 7)), '#b08a5a', 48);
    c.silhouette((x) => 40 + Math.round(5 * Math.sin(x / 13 + 1) + 2 * Math.sin(x / 5)), '#d8a850');
    c.silhouette((x) => 48 + Math.round(4 * Math.sin(x / 10 + 3)), '#c8943e');
    for (let i = 0; i < 90; i++) { const x = Math.floor(c.rand() * GW); const y = 44 + Math.floor(c.rand() * 20); c.dot(x, y, c.rand() > 0.5 ? '#e6bc62' : '#b08030'); }
    // oaks and scrub
    [[16, 44], [24, 46], [74, 50]].forEach(([x, y]) => { tree(c, x, y, 3, '#3e5a34', '#56753f'); c.px(x, y + 2, 1, 3, '#4a3a2a'); });
    for (let x = 30; x < 70; x += 6) c.px(x, 50 + Math.round(4 * Math.sin(x / 10 + 3)) - 1, 3, 2, '#7a8a4a');
    // dirt trail cutting down the slope
    line(c, 88, 52, 60, 56, '#e8d0a0', undefined, 2); line(c, 60, 56, 30, 62, '#e8d0a0', undefined, 2);
    person(c, 52, 58, '#3fb8a8');
    // a hawk turning circles
    c.px(34, 6, 16, 16, 'none', 'spin');
    c.px(35, 12, 3, 1, '#4a3a2a', 'spin'); c.px(38, 11, 2, 2, '#6a4a2f', 'spin'); c.px(40, 12, 3, 1, '#4a3a2a', 'spin');
    bird(c, 70, 10, '#4a3a4a', 'drift');
  },

  // 12 · top-down close up: rocks and pools at low tide
  irvine_tidepools(c, { GW, GH, glints, waves }) {
    // foam line and surf at the top
    c.bands(0, [[5, '#2f7aa8'], [3, '#5aa8cc'], [3, '#dff2f6']]);
    waves(c, 2, '#bfe6f2'); waves(c, 6, '#ffffff');
    // wet rock shelf
    c.px(0, 10, GW, 54, '#5e5a52');
    for (let i = 0; i < 260; i++) c.dot(Math.floor(c.rand() * GW), 10 + Math.floor(c.rand() * 54), ['#6e6a60', '#4e4a44', '#7a7466', '#3f5a3a'][Math.floor(c.rand() * 4)]);
    // pools
    const pools = [[22, 26, 11], [60, 22, 8], [48, 48, 12], [12, 52, 6], [78, 44, 6]];
    pools.forEach(([x, y, r]) => { c.disc(x, y, r + 1, '#3e3a34'); c.disc(x, y, r, '#2f8a9a'); c.disc(x - 1, y - 1, Math.max(1, r - 3), '#46a8b4'); });
    glints(c, 14, 60, 14, '#dffaff');
    // green anemones in the pools
    [[18, 24], [25, 29], [46, 45], [52, 51], [59, 20]].forEach(([x, y], i) => { c.px(x - 1, y - 1, 3, 3, '#4fc47a'); c.dot(x, y, i % 2 ? '#f07fbf' : '#b8f0a0', 'glint'); });
    // sea stars
    const star = (x, y, col) => { c.px(x - 2, y, 5, 1, col); c.px(x, y - 2, 1, 5, col); c.dot(x - 1, y + 1, col); c.dot(x + 1, y + 1, col); c.dot(x, y, '#ffe0a0'); };
    star(28, 22, '#e86a2a'); star(44, 52, '#9a4ab8'); star(78, 44, '#e86a2a');
    // snails + mussel beds
    for (let i = 0; i < 16; i++) c.dot(4 + Math.floor(c.rand() * 80), 12 + Math.floor(c.rand() * 50), '#2a2a36');
    for (let x = 64; x < 86; x += 2) c.px(x, 12 + ((x * 3) % 4), 2, 2, '#1d2438');
    for (let x = 0; x < 16; x += 2) c.px(x, 32 + ((x * 5) % 3), 2, 2, '#1d2438');
    // a small crab, sidestepping
    c.px(36, 34, 4, 2, '#d0503a', 'peck'); c.dot(35, 33, '#d0503a', 'peck'); c.dot(40, 33, '#d0503a', 'peck');
    c.dot(35, 36, '#a03a2a', 'peck'); c.dot(40, 36, '#a03a2a', 'peck'); c.dot(37, 33, '#1d1d2b', 'peck'); c.dot(38, 33, '#1d1d2b', 'peck');
    // kelp strands in the big pool
    for (let y = 44; y < 56; y += 2) c.dot(44 + (y % 4), y, '#6a7a2a', 'sway');
    // a hermit shell and a bit of surfgrass at the edge
    c.px(66, 58, 3, 2, '#c8a878', 'peck'); c.dot(67, 57, '#8a6a4a', 'peck');
    for (let x = 0; x < GW; x += 3) c.px(x, 62 - (x % 2), 2, 2 + (x % 2), '#3f8a4a', 'sway');
  },
};
