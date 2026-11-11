/* PMM sigil generator. Pure, deterministic, no DOM, no crypto: the same eight hex
   characters always give the same glyphs, colour and sprite, on any machine.

   Input: the first 8 hex characters of a person's key fingerprint (SHA-256 of their
   P-256 public key, as public/pmm/app.js computes it). That is 4 bytes, 32 bits.

   - glyphs: the low nibble of each byte picks one of 16 PETSCII-style glyphs. This is
     exactly app.js sigilOf(), so the brand and the app never disagree.
   - colour: the four bytes XORed together, low 3 bits, pick one of 8 sigil colours. Every
     colour clears 3:1 against both blue fields (WCAG non-text contrast) and 4.5:1 against
     --field-2, the sigil tile.
   - sprite: the 32 bits fill a 4 x 8 half-sprite, row by row, most significant bit first,
     mirrored into an 8 x 8 C64-style sprite. Symmetric, so it reads as a face or a badge.

   Used by /pmm/brand/ and scripts/pmm-brand.mjs. Tested by tests/pmm-brand.test.mjs. */

export const GLYPHS = ['▌', '▐', '▀', '▄', '█', '▖', '▗', '▘', '▝', '▚', '▞', '░', '▒', '▓', '●', '◆'];

export const SIGIL_COLORS = [
  ['red', '#FF7366'],
  ['orange', '#F28C28'],
  ['yellow', '#F5D142'],
  ['green', '#58B947'],
  ['blue', '#5AA8F0'],
  ['purple', '#B08CE8'],
  ['cyan', '#6FD3E0'],
  ['pink', '#F28CC0'],
];

// Twelve example fingerprints for the brand page and sticker sheet (sha256 of "pmm sigil example N",
// picked so all eight colours show). Not anyone's real key.
export const EXAMPLES = ['572e3abb', 'c6392af0', '20757fa4', '3609a380', 'cf8eb983', '1f190cfd', '45ce88d2', 'cb297292', 'e86013cd', 'bd546b1f', '2a2ccfa6', '81de1cf3'];

export function bytesOf(hex8) {
  const h = String(hex8 || '').trim().toLowerCase();
  if (!/^[0-9a-f]{8}/.test(h)) throw new TypeError(`sigil needs 8 hex characters, got "${hex8}"`);
  return [0, 2, 4, 6].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function sigil(hex8) {
  const b = bytesOf(hex8);
  const hex = String(hex8).trim().slice(0, 8).toUpperCase();
  const glyphs = b.map((x) => GLYPHS[x & 15]).join('');
  const [colorName, color] = SIGIL_COLORS[(b[0] ^ b[1] ^ b[2] ^ b[3]) & 7];
  const sprite = [];
  for (let r = 0; r < 8; r++) {
    const row = new Array(8).fill(0);
    for (let c = 0; c < 4; c++) {
      const k = r * 4 + c;
      const on = (b[k >> 3] >> (7 - (k & 7))) & 1;
      row[c] = on; row[7 - c] = on;
    }
    sprite.push(row);
  }
  return { hex, glyphs, color, colorName, sprite };
}

// The sprite as a crisp SVG tile: --field-2 ground, a one-pixel margin, the sprite in the sigil colour.
export function sigilSVG(hex8, { size = 80, ground = '#352577', title = true } = {}) {
  const s = sigil(hex8);
  const rects = [];
  s.sprite.forEach((row, r) => row.forEach((on, c) => { if (on) rects.push(`<rect x="${c + 1}" y="${r + 1}" width="1" height="1"/>`); }));
  const label = `Sigil ${s.hex}: ${s.glyphs}, ${s.colorName}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="${label}">`
    + (title ? `<title>${label}</title>` : '')
    + `<rect width="10" height="10" fill="${ground}"/><g fill="${s.color}">${rects.join('')}</g></svg>`;
}
