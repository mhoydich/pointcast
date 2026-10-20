/**
 * Seeded randomness for the simulator: sfc32 seeded through cyrb128, with
 * named forks so every bot and actor draws from its own stream.
 */
function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

export function prng(seed) {
  const label = String(seed);
  let [a, b, c, d] = cyrb128(label);
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();
  const api = {
    next,
    int: (n) => Math.floor(next() * n),
    range: (lo, hi) => lo + next() * (hi - lo),
    chance: (p) => next() < p,
    pick: (list) => list[Math.floor(next() * list.length)],
    shuffle(list) {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    /** Knuth's method; fine for the small rates the simulator uses. */
    poisson(lambda) {
      const limit = Math.exp(-lambda);
      let k = 0, p = 1;
      do { k++; p *= next(); } while (p > limit);
      return k - 1;
    },
    fork: (name) => prng(`${label}/${name}`),
  };
  return api;
}

/** A short, stable, non-cryptographic hash of a string (two 32-bit lanes, hex). */
export function hashString(str) {
  const [a, b] = cyrb128(str);
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}
