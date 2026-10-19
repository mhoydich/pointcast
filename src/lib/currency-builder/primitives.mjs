/**
 * Shared drawing primitives for Currency Builder notes (Commons, Global Barter).
 *
 * Every Noun comes from the verified Nouns #0–99 provenance and is drawn by
 * renderSeed() from the official CC0 image data. Output is deterministic.
 */
import PROVENANCE from '../../../public/images/nouns-money/source-100/provenance.json' with { type: 'json' };
import { renderSeed, traitLabel } from '../nouns-parts.mjs';

export const W = 1200;
export const H = 600;
export const SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif';
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
export const NOUN_PROVENANCE = '/images/nouns-money/source-100/provenance.json';

const PROOFS = new Map(PROVENANCE.notes.map((note) => [note.noun_id, note]));

export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const pad = (n, width) => String(n).padStart(width, '0');
export const round = (n) => Math.round(n * 10) / 10;

/** Small deterministic generator so each note's pattern is stable and distinct. */
export function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if (line && (line + ' ' + word).length > maxChars) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Verified seed, traits and rendered pixels for an actual Noun. `layers`
 * picks which of its traits to draw (all four by default, in official order).
 */
export function nounArt(nounId, { layers } = {}) {
  const proof = PROOFS.get(nounId);
  if (!proof) throw new Error(`Noun #${nounId} is not in the verified #0–99 provenance`);
  const art = renderSeed(proof.seed, layers ? { layers } : undefined);
  for (const kind of ['body', 'accessory', 'head', 'glasses']) {
    if (art.filenames[kind] !== proof.traits[kind]) {
      throw new Error(`Noun #${nounId} ${kind} mismatch: ${art.filenames[kind]} vs ${proof.traits[kind]}`);
    }
  }
  return {
    nounId,
    seed: proof.seed,
    traits: proof.traits,
    labels: Object.fromEntries(Object.entries(proof.traits).map(([k, v]) => [k, traitLabel(v)])),
    background: art.background,
    svg: art.svg,
    officialUrl: proof.official_nft_url,
  };
}

/** Place the 320 × 320 Noun SVG at (x, y) with the given size. */
export function placeNoun(art, x, y, size) {
  const head = '<svg width="320" height="320"';
  if (!art.svg.startsWith(head)) throw new Error(`unexpected Noun SVG header for Noun #${art.nounId}`);
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}"` + art.svg.slice(head.length);
}

/** A hypotrochoid rosette: the guilloche-style signature of each note. */
export function rosette(cx, cy, r, seed, stroke, opacity) {
  const rand = rng(seed + 7);
  const R = r;
  const rr = r * (0.18 + rand() * 0.22);
  const d = r * (0.35 + rand() * 0.4);
  const k = (R - rr) / rr;
  const steps = 720;
  const turns = 12;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns;
    const x = (R - rr) * Math.cos(t) + d * Math.cos(k * t);
    const y = (R - rr) * Math.sin(t) - d * Math.sin(k * t);
    pts.push(`${round(cx + x * 0.5)},${round(cy + y * 0.5)}`);
  }
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="${stroke}" stroke-width="0.8" opacity="${opacity}"/>`;
}

/** Rows of opposing chevrons: goods going one way, goods coming back. */
export function chevrons(p, opacity = 0.16) {
  const out = [];
  for (let row = 0; row < 12; row++) {
    const y = 50 + row * 46;
    const dir = row % 2 ? -1 : 1;
    for (let col = 0; col < 26; col++) {
      const x = 40 + col * 46 + (row % 2 ? 23 : 0);
      out.push(`<path d="M${x - 8 * dir} ${y - 9}L${x + 8 * dir} ${y}L${x - 8 * dir} ${y + 9}" fill="none" stroke="${row % 2 ? p.accent : p.accent2}" stroke-width="2" opacity="${opacity}"/>`);
    }
  }
  return out.join('');
}

/** A balance scale, drawn at (x, y) with the given scale. */
export function scales(p, x, y, scale, opacity = 0.5) {
  return `<g opacity="${opacity}" stroke="${p.ink}" stroke-width="3" fill="none" transform="translate(${x} ${y}) scale(${scale})"><path d="M400 120V200M330 140H470M330 140L305 200M330 140L355 200M470 140L445 200M470 140L495 200"/><path d="M300 200A30 12 0 0 0 360 200M440 200A30 12 0 0 0 500 200"/></g>`;
}

export function frame(p) {
  return `<rect width="${W}" height="${H}" fill="${p.paper}"/>`
    + `<rect x="16" y="16" width="${W - 32}" height="${H - 32}" fill="none" stroke="${p.ink}" stroke-width="3"/>`
    + `<rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${p.accent}" stroke-width="1.5"/>`;
}

export function corners(entry, p) {
  const d = esc(entry.denomination);
  const style = `font-family="${SANS}" font-weight="700" font-size="26" fill="${p.ink}"`;
  return `<text x="44" y="68" ${style}>${d}</text>`
    + `<text x="${W - 44}" y="68" text-anchor="end" ${style}>${d}</text>`
    + `<text x="44" y="${H - 44}" ${style}>${d}</text>`
    + `<text x="${W - 44}" y="${H - 44}" text-anchor="end" ${style}>${d}</text>`;
}

export function disclaimer(entry, p) {
  return `<text x="${W / 2}" y="${H - 38}" text-anchor="middle" font-family="${MONO}" font-size="13" letter-spacing="2.4" fill="${p.ink}" opacity="0.85">DESIGN CONCEPT · NOT LEGAL TENDER · NO CASH VALUE · CC0 NOUN #${entry.nounId}</text>`;
}

/** Root element: 1200 × 600 user units printed at the 150 × 75 mm trim. */
export function svgOpen(label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="150mm" height="75mm" role="img" aria-label="${label}">`;
}

/**
 * Name size that keeps a note's title inside the 680 px left column. The
 * 0.8 em per character is conservative enough for non-Helvetica fallbacks.
 */
export function nameSize(name, max = 96) {
  return Math.min(max, Math.floor(680 / (name.length * 0.8)));
}

/**
 * The big face value with its unit and serial beside it. The label column
 * sits after a conservative digit advance (0.7 em at 150 px), so it clears
 * the numeral in fallback fonts too.
 */
export function faceValue(entry, p, unitLabel, serialText) {
  const x = 106 + String(entry.denomination).length * 99 + 8;
  return `<text x="106" y="500" font-family="${SANS}" font-weight="800" font-size="150" letter-spacing="-6" fill="${p.accent}">${esc(entry.denomination)}</text>`
    + `<text x="${x}" y="466" font-family="${MONO}" font-weight="700" font-size="24" letter-spacing="2" fill="${p.ink}">${esc(unitLabel)}</text>`
    + `<text x="${x}" y="496" font-family="${MONO}" font-size="16" letter-spacing="2" fill="${p.ink}" opacity="0.8">${esc(serialText)}</text>`;
}

/** The right-hand Noun window and its caption on a note front. */
export function frontNoun(entry, art, p) {
  return `<rect x="812" y="112" width="336" height="336" fill="${p.ink}"/>`
    + placeNoun(art, 820, 120, 320)
    + `<text x="980" y="482" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="18" letter-spacing="3" fill="${p.ink}">NOUN ${pad(entry.nounId, 4)}</text>`
    + `<text x="980" y="508" text-anchor="middle" font-family="${MONO}" font-size="13" letter-spacing="2" fill="${p.ink}" opacity="0.8">${esc(art.labels.head.toUpperCase())} HEAD</text>`
    + `<text x="${W - 110}" y="70" text-anchor="end" font-family="${MONO}" font-size="16" letter-spacing="3" fill="${p.ink}">CURRENCY BUILDER</text>`;
}

/** The right-hand provenance column on a note back. */
export function backNoun(entry, art, p) {
  const traitRows = ['head', 'glasses', 'body', 'accessory'];
  return `<rect x="868" y="72" width="224" height="224" fill="${p.ink}"/>`
    + placeNoun(art, 876, 80, 208)
    + `<text x="980" y="330" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="18" letter-spacing="3" fill="${p.ink}">ACTUAL NOUN #${entry.nounId}</text>`
    + traitRows.map((kind, i) => `<text x="812" y="${368 + i * 24}" font-family="${MONO}" font-size="12" letter-spacing="1.5" fill="${p.text}">${kind.toUpperCase()}</text><text x="920" y="${368 + i * 24}" font-family="${MONO}" font-size="13" letter-spacing="1" fill="${p.ink}">${esc(art.labels[kind])}</text>`).join('')
    + `<text x="812" y="482" font-family="${MONO}" font-size="13" letter-spacing="1.5" fill="${p.ink}" opacity="0.85">CC0 ART · nouns.wtf/noun/${entry.nounId}</text>`
    + `<text x="812" y="504" font-family="${MONO}" font-size="12" letter-spacing="1.5" fill="${p.ink}" opacity="0.85">NOT ENDORSED BY NOUNS DAO</text>`;
}
