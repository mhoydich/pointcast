/**
 * Crosswalk sprites: 8x8 (and one 16x8) pixel pictures written as rows of
 * palette keys. Nothing is traced from any game; these are chunky rects the
 * way a 1983 character set would hold them. The page maps each key to a
 * color from the machine palette (src/lib/breakwater/waves.mjs), so the same
 * sprite reads as Atari or Commodore.
 *
 * Keys: . transparent, S skin, H hat, T towel or shirt, K dark, W white,
 *       B body (vehicle), G glass, R red, Y yellow, O orange, L leaf green, D ball.
 */
const RAW = {
  walker: [
    '..HHHH..',
    '.HHHHHH.',
    '..SSSS..',
    '.TSSSST.',
    'TTTTTTTT',
    '.TTTTTT.',
    '..S..S..',
    '.SS..SS.',
  ],
  walkerHop: [
    '..HHHH..',
    '.HHHHHH.',
    '..SSSS..',
    'T.SSSS.T',
    '.TTTTTT.',
    '.TTTTTT.',
    '.S....S.',
    'S......S',
  ],
  splat: [
    '........',
    '.T....T.',
    '..TSST..',
    '.TSKKST.',
    '.TSKKST.',
    '..TSST..',
    '.T....T.',
    '........',
  ],
  car: [
    '........',
    '........',
    '..BBBB..',
    '.BGGGGB.',
    'BBBBBBBB',
    'BBBBBBBB',
    '.K....K.',
    '........',
  ],
  bus: [
    '................',
    '.BBBBBBBBBBBBBB.',
    '.BGGBGGBGGBGGBB.',
    '.BBBBBBBBBBBBBB.',
    '.BBBBBBBBBBBBBB.',
    '.BBBBBBBBBBBBBB.',
    '..K..........K..',
    '................',
  ],
  bike: [
    '...H....',
    '...SS...',
    '..TT.T..',
    '.T.TTT..',
    '.T..T.T.',
    'KKK.KKK.',
    'K.K.K.K.',
    'KKK.KKK.',
  ],
  skate: [
    '...H....',
    '...SS...',
    '..TTT...',
    '..TT.T..',
    '..TT....',
    '..S.S...',
    '.BBBBBB.',
    '.K....K.',
  ],
  tower: [
    '.RRRRRR.',
    '.RWWWWR.',
    '.RWWWWR.',
    '.RRRRRR.',
    '..Y..Y..',
    '..Y..Y..',
    '..Y..Y..',
    '.YY..YY.',
  ],
  towerHome: [
    '.RRRRRR.',
    '.RWHHWR.',
    '.RWSSWR.',
    '.RRTTRR.',
    '..Y..Y..',
    '..Y..Y..',
    '..Y..Y..',
    '.YY..YY.',
  ],
  ball: [
    '..DWWD..',
    '.DDWWDD.',
    'DDDWWDDD',
    'WWWWWWWW',
    'DDDWWDDD',
    '.DDWWDD.',
    '..DWWD..',
    '........',
  ],
  palm: [
    '.L.LL.L.',
    'LLLLLLLL',
    '.L.LL.L.',
    '...KK...',
    '...KK...',
    '...KK...',
    '...KK...',
    '..KKKK..',
  ],
};

export const SPRITES = Object.freeze(Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k, Object.freeze(v.slice())])));
export const SPRITE_KEYS = Object.freeze('SHTKWBGRYOLD'.split(''));

export function sprite(name) {
  return RAW[name] || RAW.walker;
}

/**
 * Call `cb(x, y, size, key)` once per lit cell of `name` placed at (x, y) with
 * cell size `scale`. `flip` mirrors left to right; `rot` of 1 turns the
 * picture a quarter turn clockwise, 2 upside down, 3 counter-clockwise.
 */
export function eachSpriteCell(name, x, y, scale, cb, { flip = false, rot = 0 } = {}) {
  const rows = sprite(name);
  const h = rows.length, w = rows[0].length;
  for (let r = 0; r < h; r += 1) {
    for (let c = 0; c < w; c += 1) {
      const key = rows[r][c];
      if (key === '.') continue;
      let cc = flip ? w - 1 - c : c, rr = r;
      if (rot === 1) [cc, rr] = [h - 1 - rr, cc];
      else if (rot === 2) [cc, rr] = [w - 1 - cc, h - 1 - rr];
      else if (rot === 3) [cc, rr] = [rr, w - 1 - cc];
      cb(x + cc * scale, y + rr * scale, scale, key);
    }
  }
}

/** All lit cells as [x, y, key] for tests and static art. */
export function spriteCells(name, x = 0, y = 0, scale = 1, opts) {
  const out = [];
  eachSpriteCell(name, x, y, scale, (px, py, s, key) => out.push([px, py, key]), opts);
  return out;
}
