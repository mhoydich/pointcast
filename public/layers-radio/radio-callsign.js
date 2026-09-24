/**
 * Call signs: a short melody and a pixel mark derived from a 4-byte alias, so
 * people in a room learn to recognise each other by ear.
 *
 * Pure and deterministic: the same alias always gives the same melody, mark and
 * hue on every device. A call sign is cosmetic and unverified. Anyone can
 * produce any alias, so a matching melody means "the same call sign as before",
 * never "the same person".
 */
const PENTA = [0, 2, 4, 7, 9];                       // major pentatonic, semitones
const RHYTHMS = Object.freeze([                      // note onsets in seconds, 4 notes each
  [0, 0.16, 0.32, 0.48],
  [0, 0.12, 0.36, 0.48],
  [0, 0.24, 0.36, 0.6],
  [0, 0.16, 0.28, 0.52],
]);
export const CALLSIGN_MAX_SECONDS = 1.0;

const toBytes = alias => {
  if (alias instanceof Uint8Array && alias.length === 4) return alias;
  if (typeof alias === 'string' && /^[0-9a-f]{8}$/i.test(alias)) return Uint8Array.from(alias.match(/../g), h => parseInt(h, 16));
  throw new TypeError('alias must be 4 bytes or 8 hex characters');
};
const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');

function fnv1a(bytes) {
  let h = 0x811c9dc5;
  for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
function mix(x) {                                     // splitmix-style avalanche
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}
const midiToHz = m => 440 * 2 ** ((m - 69) / 12);

export function callSign(alias) {
  const bytes = toBytes(alias);
  const h = fnv1a(bytes);
  const root = 57 + (h % 7);                          // A3 .. D#4
  const steps = [];
  let x = h;
  for (let i = 0; i < 4; i++) { x = mix(x + i + 1); steps.push(x % 10); } // two octaves of pentatonic
  if (steps.every(s => s === steps[0])) steps[3] = (steps[3] + 3) % 10;    // never a single repeated note
  const rhythm = RHYTHMS[(mix(h ^ 0x9e3779b9) >>> 3) & 3];
  const notes = steps.map((s, i) => {
    const midi = root + PENTA[s % 5] + 12 * Math.floor(s / 5);
    return Object.freeze({ midi, f: +midiToHz(midi).toFixed(3), t: rhythm[i], d: i === 3 ? 0.3 : 0.14 });
  });
  const seconds = +(notes[3].t + notes[3].d).toFixed(3);
  const hue = mix(h ^ 0x51ed27) % 360;
  // 5x5 mark, mirrored left-right (3 source columns), like a tiny invader
  let bits = mix(h ^ 0xc2b2ae35);
  const mark = [];
  for (let r = 0; r < 5; r++) {
    const row = [0, 0, 0, 0, 0];
    for (let c = 0; c < 3; c++) { const on = (bits >>> (r * 3 + c)) & 1; row[c] = on; row[4 - c] = on; }
    mark.push(row);
  }
  const lit = mark.flat().filter(Boolean).length;
  if (lit < 6) { mark[2] = [1, 1, 1, 1, 1]; mark[1][1] = mark[1][3] = 1; }   // keep every mark legible
  const aliasHex = hex(bytes);
  return Object.freeze({
    alias: aliasHex,
    label: aliasHex.slice(0, 4).toUpperCase(),
    notes: Object.freeze(notes),
    seconds,
    hue,
    mark: Object.freeze(mark.map(r => Object.freeze(r))),
  });
}

/** Inline SVG for a call-sign mark (safe: numbers only, no user text). */
export function markSVG(cs, size = 20) {
  const cell = size / 5;
  let rects = '';
  cs.mark.forEach((row, r) => row.forEach((on, c) => {
    if (on) rects += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}"/>`;
  }));
  return `<svg class="pcr-mark" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" fill="hsl(${cs.hue} 80% 62%)" shape-rendering="crispEdges">${rects}</svg>`;
}
