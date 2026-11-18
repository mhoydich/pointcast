(() => {
  'use strict';

  // Architectural studies based on the Midjourney plates published by PointCast.
  // Plate credits and original URLs live in the building catalogue.
  const terracotta = '#a35343';
  const leaf = '#77914e';
  const textile = ['#c49c78', '#d2af89', '#b58463', '#cba685'];
  const names = ['architect-cut', 'southern-row', 'northern-row', 'missing-house', 'row-2030', 'court-society'];
  const models = new Map();

  function createModel(id) {
    const faces = [];
    function face(vertices, color, shadow = true) {
      faces.push({ vertices, color, shadow });
    }
    function box(x, y, z, width, height, depth, color, shadow = true, openFront = false) {
      const a = x - width / 2, b = x + width / 2;
      const c = z - depth / 2, d = z + depth / 2, t = y + height;
      face([[a,t,c],[a,t,d],[b,t,d],[b,t,c]], color, shadow);
      if (!openFront) face([[a,y,d],[b,y,d],[b,t,d],[a,t,d]], color, shadow);
      face([[b,y,d],[b,y,c],[b,t,c],[b,t,d]], color, shadow);
      face([[b,y,c],[a,y,c],[a,t,c],[b,t,c]], color, shadow);
      face([[a,y,c],[a,y,d],[a,t,d],[a,t,c]], color, shadow);
      face([[a,y,d],[a,y,c],[b,y,c],[b,y,d]], color, shadow);
    }
    function frustum(x, y, z, radius, height, topRadius, color, sides = 8) {
      const ring = (r, h) => Array.from({ length: sides }, (_, n) => {
        const theta = Math.PI / sides + 2 * Math.PI * n / sides;
        return [x + r * Math.cos(theta), h, z + r * Math.sin(theta)];
      });
      const base = ring(radius, y);
      const top = ring(topRadius, y + height);
      for (let side = 0; side < sides; side++) {
        const next = (side + 1) % sides;
        face([base[side], top[side], top[next], base[next]], color);
      }
      face(top.slice().reverse(), color);
    }
    // Surface details are inset into frames and only need one face each.
    function panel(side, offset, start, y, span, height, color) {
      const end = start + span;
      const top = y + height;
      const vertices = [
        [[start,y,offset],[end,y,offset],[end,top,offset],[start,top,offset]],
        [[offset,y,end],[offset,y,start],[offset,top,start],[offset,top,end]],
        [[end,y,-offset],[start,y,-offset],[start,top,-offset],[end,top,-offset]],
        [[-offset,y,start],[-offset,y,end],[-offset,top,end],[-offset,top,start]],
      ];
      face(vertices[side], color, false);
    }
    const ivory = '#e7ddc7';
    const brick = '#a16d54';
    const limestone = '#d7c7a8';
    const glass = '#759590';
    const glassDark = '#425755';
    const forest = '#3c6154';

    // Roofs are watertight gabled prisms with front-facing ridge ends.
    function gable(x, y, z, w, d, rise, color, endColor) {
      const l = x - w / 2, r = x + w / 2, f = z + d / 2, b = z - d / 2;
      const t = y + rise;
      face([[l,y,f],[r,y,f],[x,t,f]], endColor);
      face([[r,y,b],[l,y,b],[x,t,b]], endColor);
      face([[l,y,b],[l,y,f],[x,t,f],[x,t,b]], color);
      face([[x,t,b],[x,t,f],[r,y,f],[r,y,b]], color);
      face([[l,y,f],[l,y,b],[r,y,b],[r,y,f]], color);
    }

    function windows(x, y, z, w, h, count, frame, tint) {
      const gap = .29;
      const opening = (w - (count - 1) * gap) / count;
      for (let col = 0; col < count; col++) {
        const center = x - w/2 + opening/2 + col * (opening + gap);
        box(center, y, z, opening, h, .14, frame, false);
        panel(0, z+.08, center-opening/2+.09, y+.09, opening-.18, h-.18, tint);
        if (opening > 1.25) panel(0, z+.094, center-.045, y+.075, .09, h-.15, frame);
      }
    }

    function masonry(x, y, z, w, h, base, alternate) {
      panel(0, z, x - w/2, y, w, h, base);
      for (let row = 0; row < Math.floor(h / .62); row++) {
        for (let col = 0; col < Math.floor((w - .3) / 1.4); col++) {
          const left = x - w/2 + .14 + col * 1.4 + (row % 2 ? .22 : 0);
          panel(0, z+.006, left, y + row * .62 + .07, 1.26, .49, alternate[(row + col) % alternate.length]);
        }
      }
    }

    function tree(x, z, height, hue = leaf) {
      box(x, .22, z, .26, height * .66, .27, '#70503f');
      frustum(x, height * .47, z, .8, height * .27, 1.17, hue, 6);
      frustum(x, height * .74, z, 1.17, height * .26, .33, '#8a985e', 6);
    }

    if (id === 'architect-cut') {
      // Open axonometric cross-section, separated wings, ivory roofs and interior terraces.
      box(0, 0, 0, 19.5, .56, 19.3, '#827462');
      box(0, .56, 0, 19.4, .18, 19.2, limestone);
      box(.2, .74, 2.34, 6.4, .3, 6.9, '#a9a479');
      box(0, 1.04, 2.07, 3.7, .23, 2.99, '#9aaf9f');
      for (const [x, z, w, d, h] of [[-6.35,1,5.8,9.8,8.2],[6.55,2.7,5.2,7.4,7.4],[0,-6.15,12.9,5.4,11.4]]) {
        box(x, .74, z, w, h, d, '#a48060');
        for (const y of [1.05, 4.5, 7.9]) {
          if (y + 1.7 > h + .74) continue;
          windows(x, y, z + d/2, w - .59, 2.32, Math.round(w/2.6), '#98704d', '#adc0b4');
          box(x, y-.19, z+.37, w+1.1, .29, d+.84, ivory);
        }
        box(x, h+.74, z, w+.8, .37, d+.65, ivory);
        for (let n = 0; n < 5; n++) {
          box(x - w/2 + (n+.5)*w/5, h+1.11, z, .075, .05, d+.55, '#beaf95', false);
        }
      }
      box(-.4, .72, 7.65, 6.2, .42, 2.2, ivory);
      box(-.4, 4.0, 7.8, 6.4, .27, 1.8, ivory);
      for (const x of [-3.15, -.4, 2.32]) box(x, 1.05, 8.47, .23, 2.95, .29, '#9a7656');
      for (const [x,z] of [[-1.8,4.2],[2.1,3.8],[1,-2.75]]) tree(x,z,2.6, '#75845c');
    } else if (id === 'southern-row') {
      // Red-clay brick, cream two-story veranda, dark shutters and landscaped courts.
      box(0, 0, 0, 19.8, .22, 19.2, '#9d7862');
      box(0, .22, -2.2, 16.6, 10.2, 11.6, terracotta);
      masonry(0, .23, 3.61, 16.6, 9.8, terracotta, ['#a65e48','#af6950','#b97560']);
      box(0, 10.42, -2.2, 17.1, .4, 12.2, ivory);
      gable(0, 10.82, -2.2, 17.1, 12.1, 1.85, '#7f6a58', '#a66c53');
      for (const y of [.43, 5.75]) {
        windows(0, y, 3.65, 13.4, 3.55, 5, ivory, '#426050');
        for (const x of [-6.6,-3.3,0,3.3,6.6]) box(x, y+.22, 5.83, .36, 4.24, .52, ivory);
        box(0, y-.22, 5.2, 15.3, .37, 3.85, limestone);
      }
      box(0, 10.32, 5.06, 15.6, .44, 4.06, '#c6b493');
      box(0, 5.72, 6.62, 14.6, .28, .18, ivory);
      for (let x = -6.9; x <= 7; x += .8) box(x, 5.17, 6.62, .11, .6, .16, '#d7c7a8');
      for (const x of [-8.1, 7.75]) tree(x, 7.8, 7.35, '#617653');
    } else if (id === 'northern-row') {
      // Gabled brick and charcoal houses, a snowy court and tall chimneys.
      box(0, 0, 0, 19.6, .42, 18.5, '#e6e6db');
      for (const [x,w,h,d,z] of [[-6.5,5.7,10.2,11,-1],[.1,7.1,13.5,12.2,-1.5],[6.6,5.8,9.2,10.4,-.2]]) {
        box(x, .42, z, w, h, d, x > 5 ? '#50585a' : brick);
        masonry(x, .43, z+d/2+.014, w, h-.1, brick, ['#a77362','#925f50','#b88771']);
        gable(x, h+.42, z, w+.5, d+.56, 3.6, '#e5e7e7', x > 5 ? '#565d5c' : brick);
        for (let y = 1; y + 1.9 < h; y += 3.1) windows(x, y, z+d/2+.04, w-.9, 2.25, 2, '#4b4a45', '#92a4a5');
        box(x - 1.7, h+.42, z - 2, .85, 3.95, .92, brick);
        box(x - 1.7, h+4.37, z - 2, 1.02, .2, 1.04, '#d8d8d0');
        box(x, .42, z + d/2 + .8, 3.1, .2, 1.45, '#d5d7cb');
      }
    } else if (id === 'missing-house') {
      // Low glass infill behind an open green pergola and a brick forecourt.
      box(0, 0, 0, 19.7, .25, 18.6, '#9c6d57');
      box(0, .25, -1.65, 18.3, 5.6, 9.5, '#45594e');
      box(4.15, 5.85, -2.1, 10.1, .43, 9.8, '#3f4942');
      box(-8.5, .25, -1.5, 1.45, 7.5, 10.1, brick);
      box(8.5, .25, -1.5, 1.45, 7.5, 10.1, brick);
      windows(.2, .53, 3.18, 16, 5.1, 6, forest, '#aab19b');
      for (const x of [-7.25, -.75, 6.95]) {
        box(x, .25, 6.7, .48, 7.05, .53, forest);
        box(x, 7.02, 2.1, .52, .4, 9.75, forest);
      }
      for (let x = -6.95; x <= 7; x += .92) box(x, 7.11, 2.45, .15, .22, 8.4, '#9e7759');
      box(-.06, 7.06, 6.7, 15, .39, .37, forest);
      for (let p = 0; p < 8; p++) box(.1, .25, 4.55 + p * .53, 8.2, .055, .47, textile[p % textile.length], false);
      tree(-8.15, 7.4, 6.9, forest);
      tree(8.15, 7.1, 7.4, forest);
    } else if (id === 'row-2030') {
      // Variegated contemporary rows face a shared garden and open pedestrian axis.
      box(0, 0, 0, 19.7, .25, 19.65, '#a9a083');
      box(0, .25, 0, 3.85, .16, 19.4, '#d2b6a0');
      const tones = ['#9ab7b2','#b16e54','#687e6a','#a9a888'];
      for (const [n, x, z] of [[0,-6,-4.55],[1,6,-4.55],[2,6,3.9],[3,-6,3.9]]) {
        const h = [9.4,10.8,7.9,8.65][n];
        box(x, .25, z, 6.22, h, 7.75, tones[n]);
        box(x, h+.25, z, 6.48, .37, 8.02, limestone);
        windows(x, .68, z+3.92, 5.42, 3.2, 3, ivory, glassDark);
        windows(x, 4.7, z+3.92, 5.42, 2.05, 3, '#596b5e', glass);
        box(x, 4.05, z+4.0, 6.47, .23, .65, ivory);
        const side = x > 0 ? 3 : 1;
        for (let k = 0; k < 3; k++) {
          panel(side, 2.90, z - 3.4 + k*2.23, 4.7, 1.36, 2, '#47645c');
        }
      }
      for (const [x,z] of [[-2.4,-6.55],[2.25,-3.78],[-2.3,.18],[2.25,4.68],[-2.32,6.61]]) {
        box(x, .25, z, 1.22, .31, 1.82, forest);
        tree(x, z, 4.4, '#728959');
      }
    } else if (id === 'court-society') {
      // The published green court graphic interpreted as an ivory-framed club pavilion.
      box(0, 0, 0, 19.6, .27, 18.9, '#c9ae7e');
      box(0, .27, -1.5, 15, 8, 9.9, '#326047', true, true);
      for (let n = 0; n < 12; n++) {
        const x = -7.5 + n * 1.25;
        const green = n >= 6 ? '#245444' : '#3b7454';
        for (const [y, h] of [[.27,.41],[.87,3.73],[4.79,2.63]]) {
          panel(0, 3.45, x + .055, y, 1.195, h, green);
          panel(0, 3.45, x, y, .055, h, '#326047');
        }
        for (const y of [.68, 4.6, 7.42, 8.24]) panel(0, 3.46, x, y, 1.25, .19, ivory);
        panel(0, 3.45, x, 7.61, 1.25, .63, '#65a5b5');
      }
      for (const x of [-7.5, 0, 7.5]) box(x, .28, 3.55, .24, 8.45, .39, ivory);
      box(0, 8.27, -1.55, 15.65, .48, 10.64, ivory);
      box(0, .28, 6.2, 15.1, .19, 5.1, '#4f825d');
      for (const x of [-6.7, 0, 6.7]) box(x, .47, 6.2, .085, .013, 4.65, ivory, false);
      for (const z of [4.05, 6.2, 8.45]) box(0, .47, z, 13.4, .013, .075, ivory, false);
      // Coupé silhouette from the original plate, parked on the club apron.
      box(4.25, .28, -7.7, 3.05, .49, 1.32, ivory);
      box(4.3, .75, -7.7, 1.38, .48, 1.15, '#7d9294');
      box(4.3, 1.21, -7.7, 1.48, .11, 1.19, ivory);
    }

    return { faces };
  }

  window.LoomModel = function LoomModel(name, index = 0) {
    const key = String(name || '').toLowerCase().trim().replace(/\s+/g, '-');
    const id = names.includes(key) ? key : names[((index % names.length) + names.length) % names.length] || names[0];
    if (!models.has(id)) models.set(id, createModel(id));
    return models.get(id);
  };
})();
