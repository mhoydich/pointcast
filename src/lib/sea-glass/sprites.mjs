/**
 * Sea Glass sprites: original pixel art, one character per pixel, '.' clear.
 * Drawn for this game (a hermit crab, a bubble, a gull); no arcade art is
 * traced or copied. Shared by src/pages/sea-glass.astro and
 * scripts/generate-sea-glass-og.mjs; tests/sea-glass.test.mjs checks the shapes.
 *
 * Crab:  S shell rim, s shell, B body, k claw, | eye stalk, e eye
 * Bubble: o rim, h highlight, f fill (drawn faint)
 * Gull:  H head and body, w wing, g wingtip, e eye, y beak and feet
 */
export const CRAB = Object.freeze([
  '....SSSS......',
  '...SssssS.....',
  '..SssSSssS....',
  '..SsS..SsS.e.e',
  '..SssSSsS..|.|',
  '...SSSSS.BBBB.',
  '..BBBBBBBBBBkk',
  '.BBBBBBBBBB.kk',
  '..B.B..B.B....',
  '.B..B..B..B...',
]);

export const BUBBLE = Object.freeze([
  '..oooo..',
  '.offffo.',
  'ofhhfffo',
  'ofhffffo',
  'offffffo',
  'offffffo',
  '.offffo.',
  '..oooo..',
]);

export const GULL = Object.freeze([
  '.......HHH..',
  '......HHeHyy',
  '......HHHH..',
  '..wwwwHHHH..',
  '.wggwwwHHH..',
  'wggggwwwHH..',
  '.gggwwwwwH..',
  '....HHHHH...',
  '.....y..y...',
  '....yy.yy...',
]);

export const GULL_FLAP = Object.freeze([
  'wg.....HHH..',
  '.wg...HHeHyy',
  '..ww..HHHH..',
  '...wwwHHHH..',
  '....wwwHHH..',
  '......wwHH..',
  '.......wwH..',
  '....HHHHH...',
  '.....y..y...',
  '....yy.yy...',
]);

export const SPRITES = Object.freeze({ crab: CRAB, bubble: BUBBLE, gull: GULL, gullFlap: GULL_FLAP });

/** Call cb(x, y, ch) for every set pixel; `flip` mirrors left to right. */
export function eachSpritePixel(rows, x, y, cb, flip = false) {
  const w = rows[0].length;
  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < w; c += 1) {
      const ch = rows[r][c];
      if (ch !== '.') cb(x + (flip ? w - 1 - c : c), y + r, ch);
    }
  }
}

/**
 * A lifebuoy seen at an angle: an elliptical ring of `w` by `h` pixels in
 * eight alternating segments. cb(x, y, segment) with segment 0 or 1.
 */
export function eachBuoyPixel(x, y, cb, w = 16, h = 8) {
  const rx = w / 2, ry = h / 2;
  for (let py = 0; py < h; py += 1) {
    for (let px = 0; px < w; px += 1) {
      const dx = (px + 0.5 - rx) / rx, dy = (py + 0.5 - ry) / ry;
      const d = dx * dx + dy * dy;
      if (d > 1 || d < 0.3) continue;
      const a = Math.atan2(dy, dx) + Math.PI;
      cb(x + px, y + py, Math.floor((a / (Math.PI * 2)) * 8) % 2);
    }
  }
}
