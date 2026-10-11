/**
 * Commons — 40 Currency Builder note designs, each carrying one actual Noun.
 *
 * Seeds come from the verified Nouns #0–99 provenance; pixels come from the
 * official CC0 image data through renderSeed(). Every note is deterministic:
 * the same entry always produces the same SVG bytes.
 */
import DATA from '../../data/currency-builder/commons-40.json' with { type: 'json' };
import PROVENANCE from '../../../public/images/nouns-money/source-100/provenance.json' with { type: 'json' };
import { renderSeed, traitLabel } from '../nouns-parts.mjs';

export const COMMONS = DATA;
export const BASE = '/currency-builder/commons';
export const W = 1200;
export const H = 600;

const THEMES = Object.fromEntries(DATA.themes.map((theme) => [theme.id, theme]));
const PROOFS = new Map(PROVENANCE.notes.map((note) => [note.noun_id, note]));

const SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad = (n, width) => String(n).padStart(width, '0');
const round = (n) => Math.round(n * 10) / 10;

/** Small deterministic generator so each note's pattern is stable and distinct. */
function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if (line && (line + ' ' + word).length > maxChars) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

export function theme(id) {
  const found = THEMES[id];
  if (!found) throw new Error(`unknown Commons theme: ${id}`);
  return found;
}

/** Verified seed, traits and rendered pixels for an actual Noun. */
export function nounArt(nounId) {
  const proof = PROOFS.get(nounId);
  if (!proof) throw new Error(`Noun #${nounId} is not in the verified #0–99 provenance`);
  const art = renderSeed(proof.seed);
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
function placeNoun(art, x, y, size) {
  return art.svg.replace('<svg width="320" height="320"', `<svg x="${x}" y="${y}" width="${size}" height="${size}"`);
}

/** A hypotrochoid rosette: the guilloche-style signature of each note. */
function rosette(cx, cy, r, seed, stroke, opacity) {
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

function rentalPattern(p, seed) {
  const out = [];
  for (let y = 44; y < H - 30; y += 22) out.push(`<circle cx="770" cy="${y}" r="4" fill="${p.ink}" opacity="0.35"/>`);
  for (let i = 0; i < 9; i++) {
    const inset = 44 + i * 14;
    out.push(`<rect x="${inset}" y="${inset}" width="${740 - inset * 2 + 30}" height="${H - inset * 2}" rx="18" fill="none" stroke="${p.accent}" stroke-width="0.8" opacity="${0.22 - i * 0.02}"/>`);
  }
  out.push(`<circle cx="62" cy="300" r="14" fill="${p.paper}" stroke="${p.ink}" stroke-width="2" opacity="0.8"/>`);
  out.push(rosette(640, 470, 210, seed, p.accent2, 0.5));
  return out.join('');
}

function meshPattern(p, seed) {
  const rand = rng(seed);
  const nodes = Array.from({ length: 34 }, () => [40 + rand() * (W - 80), 40 + rand() * (H - 80)]);
  const out = [];
  nodes.forEach(([x, y], i) => {
    const near = nodes
      .map(([nx, ny], j) => [j, (nx - x) ** 2 + (ny - y) ** 2])
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);
    near.forEach(([j]) => {
      if (j > i) out.push(`<line x1="${round(x)}" y1="${round(y)}" x2="${round(nodes[j][0])}" y2="${round(nodes[j][1])}" stroke="${p.accent}" stroke-width="1" opacity="0.32"/>`);
    });
  });
  nodes.forEach(([x, y], i) => out.push(`<circle cx="${round(x)}" cy="${round(y)}" r="${i % 5 === 0 ? 6 : 3}" fill="${i % 5 === 0 ? p.accent2 : p.accent}" opacity="0.7"/>`));
  out.push(rosette(600, 300, 260, seed, p.accent, 0.35));
  return out.join('');
}

function sharingPattern(p, seed, denomination) {
  const out = [];
  const wedges = Math.max(6, Math.min(20, denomination * 2));
  const cx = 420, cy = 300, r = 520;
  for (let i = 0; i < wedges; i++) {
    const a0 = (i / wedges) * Math.PI * 2;
    const a1 = ((i + 1) / wedges) * Math.PI * 2;
    const fill = i % 2 ? p.accent : p.accent2;
    out.push(`<path d="M${cx} ${cy}L${round(cx + r * Math.cos(a0))} ${round(cy + r * Math.sin(a0))}A${r} ${r} 0 0 1 ${round(cx + r * Math.cos(a1))} ${round(cy + r * Math.sin(a1))}Z" fill="${fill}" opacity="0.09"/>`);
  }
  for (let i = 1; i <= 6; i++) out.push(`<circle cx="${cx}" cy="${cy}" r="${i * 48}" fill="none" stroke="${p.ink}" stroke-width="0.7" opacity="0.12"/>`);
  out.push(rosette(160, 470, 200, seed, p.accent, 0.45));
  return out.join('');
}

function barterPattern(p, seed) {
  const out = [];
  for (let row = 0; row < 12; row++) {
    const y = 50 + row * 46;
    const dir = row % 2 ? -1 : 1;
    for (let col = 0; col < 26; col++) {
      const x = 40 + col * 46 + (row % 2 ? 23 : 0);
      out.push(`<path d="M${x - 8 * dir} ${y - 9}L${x + 8 * dir} ${y}L${x - 8 * dir} ${y + 9}" fill="none" stroke="${row % 2 ? p.accent : p.accent2}" stroke-width="2" opacity="0.16"/>`);
    }
  }
  out.push(`<g opacity="0.5" stroke="${p.ink}" stroke-width="3" fill="none" transform="translate(470 300) scale(0.6)"><path d="M400 120V200M330 140H470M330 140L305 200M330 140L355 200M470 140L445 200M470 140L495 200"/><path d="M300 200A30 12 0 0 0 360 200M440 200A30 12 0 0 0 500 200"/></g>`);
  out.push(rosette(620, 470, 200, seed, p.accent, 0.4));
  return out.join('');
}

function pattern(entry, p) {
  if (entry.theme === 'rental') return rentalPattern(p, entry.nounId);
  if (entry.theme === 'mesh') return meshPattern(p, entry.nounId);
  if (entry.theme === 'sharing') return sharingPattern(p, entry.nounId, entry.denomination);
  return barterPattern(p, entry.nounId);
}

function frame(p) {
  return `<rect width="${W}" height="${H}" fill="${p.paper}"/>`
    + `<rect x="16" y="16" width="${W - 32}" height="${H - 32}" fill="none" stroke="${p.ink}" stroke-width="3"/>`
    + `<rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${p.accent}" stroke-width="1.5"/>`;
}

function corners(entry, p) {
  const d = esc(entry.denomination);
  const style = `font-family="${SANS}" font-weight="700" font-size="26" fill="${p.ink}"`;
  return `<text x="44" y="68" ${style}>${d}</text>`
    + `<text x="${W - 44}" y="68" text-anchor="end" ${style}>${d}</text>`
    + `<text x="44" y="${H - 44}" ${style}>${d}</text>`
    + `<text x="${W - 44}" y="${H - 44}" text-anchor="end" ${style}>${d}</text>`;
}

function disclaimer(entry, p) {
  return `<text x="${W / 2}" y="${H - 38}" text-anchor="middle" font-family="${MONO}" font-size="13" letter-spacing="2.4" fill="${p.ink}" opacity="0.85">DESIGN CONCEPT · NOT LEGAL TENDER · NO CASH VALUE · CC0 NOUN #${entry.nounId}</text>`;
}

export function serial(entry) {
  return `CB-${entry.code}-N${pad(entry.nounId, 4)}`;
}

export function noteFrontSVG(entry) {
  const t = theme(entry.theme);
  const p = t.palette;
  const art = nounArt(entry.nounId);
  const name = entry.name.toUpperCase();
  const nameSize = Math.min(96, Math.floor(680 / (name.length * 0.72)));
  const lines = wrap(entry.line, 40).slice(0, 3);
  const unitLabel = (entry.denomination === 1 ? entry.unit : entry.units).toUpperCase();
  const label = `${esc(entry.name)}, a Commons ${esc(t.name.toLowerCase())} currency design with actual Noun #${entry.nounId}; ${entry.denomination} ${esc(unitLabel.toLowerCase())}; design concept, not legal tender`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}">`
    + frame(p)
    + `<g>${pattern(entry, p)}</g>`
    + corners(entry, p)
    + `<text x="110" y="70" font-family="${MONO}" font-size="18" letter-spacing="3" fill="${p.ink}">NOUNS MONEY · COMMONS</text>`
    + `<text x="110" y="100" font-family="${MONO}" font-size="16" letter-spacing="3" fill="${p.accent}">${esc(t.name.toUpperCase())} · ${esc(t.motto.toUpperCase())}</text>`
    + `<text x="110" y="${150 + nameSize * 0.6}" font-family="${SANS}" font-weight="800" font-size="${nameSize}" letter-spacing="-2" fill="${p.ink}">${esc(name)}</text>`
    + lines.map((line, i) => `<text x="112" y="${262 + i * 32}" font-family="${SANS}" font-size="25" fill="${p.ink}" opacity="0.9">${esc(line)}</text>`).join('')
    + `<text x="106" y="500" font-family="${SANS}" font-weight="800" font-size="150" letter-spacing="-6" fill="${p.accent}">${esc(entry.denomination)}</text>`
    + `<text x="${114 + String(entry.denomination).length * 84}" y="466" font-family="${MONO}" font-weight="700" font-size="24" letter-spacing="2" fill="${p.ink}">${esc(unitLabel)}</text>`
    + `<text x="${114 + String(entry.denomination).length * 84}" y="496" font-family="${MONO}" font-size="16" letter-spacing="2" fill="${p.ink}" opacity="0.8">${esc(serial(entry))}</text>`
    + `<rect x="812" y="112" width="336" height="336" fill="${p.ink}"/>`
    + placeNoun(art, 820, 120, 320)
    + `<text x="980" y="482" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="18" letter-spacing="3" fill="${p.ink}">NOUN ${pad(entry.nounId, 4)}</text>`
    + `<text x="980" y="508" text-anchor="middle" font-family="${MONO}" font-size="13" letter-spacing="2" fill="${p.ink}" opacity="0.8">${esc(art.labels.head.toUpperCase())} HEAD</text>`
    + `<text x="${W - 110}" y="70" text-anchor="end" font-family="${MONO}" font-size="16" letter-spacing="3" fill="${p.ink}">CURRENCY BUILDER</text>`
    + disclaimer(entry, p)
    + `</svg>`;
}

export function noteBackSVG(entry) {
  const t = theme(entry.theme);
  const p = t.palette;
  const art = nounArt(entry.nounId);
  const how = wrap(entry.how, 50).slice(0, 7);
  const unitLabel = (entry.denomination === 1 ? entry.unit : entry.units).toUpperCase();
  const traitRows = ['head', 'glasses', 'body', 'accessory'];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Reverse of ${esc(entry.name)}: how the currency would work, and the provenance of actual Noun #${entry.nounId}">`
    + frame(p)
    + `<g opacity="0.7">${pattern(entry, p)}</g>`
    + corners(entry, p)
    + `<text x="110" y="80" font-family="${MONO}" font-size="18" letter-spacing="3" fill="${p.accent}">HOW IT WOULD WORK</text>`
    + `<text x="110" y="130" font-family="${SANS}" font-weight="800" font-size="40" fill="${p.ink}">${esc(entry.name)}</text>`
    + how.map((line, i) => `<text x="112" y="${182 + i * 34}" font-family="${SANS}" font-size="25" fill="${p.ink}">${esc(line)}</text>`).join('')
    + `<text x="110" y="440" font-family="${MONO}" font-size="14" letter-spacing="1.6" fill="${p.ink}">EARNED BY CONTRIBUTING · SPENT ON THE SHARED THING</text>`
    + `<text x="110" y="462" font-family="${MONO}" font-size="14" letter-spacing="1.6" fill="${p.ink}">NEVER BOUGHT · NEVER CASHED OUT</text>`
    + `<text x="110" y="500" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="2" fill="${p.accent}">${esc(entry.denomination)} ${esc(unitLabel)} · ${esc(serial(entry))}</text>`
    + `<rect x="868" y="72" width="224" height="224" fill="${p.ink}"/>`
    + placeNoun(art, 876, 80, 208)
    + `<text x="980" y="330" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="18" letter-spacing="3" fill="${p.ink}">ACTUAL NOUN #${entry.nounId}</text>`
    + traitRows.map((kind, i) => `<text x="812" y="${368 + i * 24}" font-family="${MONO}" font-size="12" letter-spacing="1.5" fill="${p.accent}">${kind.toUpperCase()}</text><text x="920" y="${368 + i * 24}" font-family="${MONO}" font-size="13" letter-spacing="1" fill="${p.ink}">${esc(art.labels[kind])}</text>`).join('')
    + `<text x="812" y="482" font-family="${MONO}" font-size="13" letter-spacing="1.5" fill="${p.ink}" opacity="0.8">CC0 ART · nouns.wtf/noun/${entry.nounId}</text>`
    + disclaimer(entry, p)
    + `</svg>`;
}

export function noteFiles(entry) {
  return { front: `${BASE}/notes/front/${entry.slug}.svg`, back: `${BASE}/notes/back/${entry.slug}.svg` };
}

/** The machine edition: every currency with its Noun provenance and files. */
export function machineEdition() {
  return {
    schema_version: DATA.schema_version,
    title: DATA.title,
    collection: DATA.collection,
    builder: DATA.builder,
    created: DATA.created,
    status: DATA.status,
    art: DATA.art,
    canonical: `https://pointcast.xyz${BASE}/`,
    trim_mm: DATA.trim_mm,
    noun_provenance: '/images/nouns-money/source-100/provenance.json',
    themes: DATA.themes,
    currencies: DATA.currencies.map((entry) => {
      const art = nounArt(entry.nounId);
      return {
        ...entry,
        serial: serial(entry),
        page: `${BASE}/${entry.slug}/`,
        files: noteFiles(entry),
        noun: { id: entry.nounId, seed: art.seed, traits: art.traits, official_url: art.officialUrl },
      };
    }),
  };
}
