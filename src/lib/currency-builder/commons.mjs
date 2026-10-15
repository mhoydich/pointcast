/**
 * Commons — 40 Currency Builder note designs, each carrying one actual Noun.
 *
 * Shared drawing and Noun rendering live in ./primitives.mjs. Every note is
 * deterministic: the same entry always produces the same SVG bytes.
 */
import DATA from '../../data/currency-builder/commons-40.json' with { type: 'json' };
import {
  W, H, SANS, MONO, NOUN_PROVENANCE, esc, pad, round, rng, wrap, nounArt, rosette, chevrons, scales,
  frame, corners, disclaimer, svgOpen, nameSize, faceValue, frontNoun, backNoun,
} from './primitives.mjs';

export { nounArt, W, H };
export const COMMONS = DATA;
export const BASE = '/currency-builder/commons';

const THEMES = Object.fromEntries(DATA.themes.map((theme) => [theme.id, theme]));

export function theme(id) {
  const found = THEMES[id];
  if (!found) throw new Error(`unknown Commons theme: ${id}`);
  return found;
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
  return chevrons(p) + scales(p, 470, 300, 0.6) + rosette(620, 470, 200, seed, p.accent, 0.4);
}

function pattern(entry, p) {
  if (entry.theme === 'rental') return rentalPattern(p, entry.nounId);
  if (entry.theme === 'mesh') return meshPattern(p, entry.nounId);
  if (entry.theme === 'sharing') return sharingPattern(p, entry.nounId, entry.denomination);
  return barterPattern(p, entry.nounId);
}

export function serial(entry) {
  return `CB-${entry.code}-N${pad(entry.nounId, 4)}`;
}

/** Front line and how text, wrapped the way the note faces draw them. */
export function textLines(entry) {
  return { line: wrap(entry.line, 40), how: wrap(entry.how, 50) };
}

export function noteFrontSVG(entry) {
  const t = theme(entry.theme);
  const p = t.palette;
  const art = nounArt(entry.nounId);
  const name = entry.name.toUpperCase();
  const size = nameSize(name);
  const lines = textLines(entry).line.slice(0, 3);
  const unitLabel = (entry.denomination === 1 ? entry.unit : entry.units).toUpperCase();
  const label = `${esc(entry.name)}, a Commons ${esc(t.name.toLowerCase())} currency design with actual Noun #${entry.nounId}; ${entry.denomination} ${esc(unitLabel.toLowerCase())}; design concept, not legal tender`;
  return svgOpen(label)
    + frame(p)
    + `<g>${pattern(entry, p)}</g>`
    + corners(entry, p)
    + `<text x="110" y="70" font-family="${MONO}" font-size="18" letter-spacing="3" fill="${p.ink}">NOUNS MONEY · COMMONS</text>`
    + `<text x="110" y="100" font-family="${MONO}" font-size="16" letter-spacing="3" fill="${p.text}">${esc(t.name.toUpperCase())} · ${esc(t.motto.toUpperCase())}</text>`
    + `<text x="110" y="${150 + size * 0.6}" font-family="${SANS}" font-weight="800" font-size="${size}" letter-spacing="-2" fill="${p.ink}">${esc(name)}</text>`
    + lines.map((line, i) => `<text x="112" y="${262 + i * 32}" font-family="${SANS}" font-size="25" fill="${p.ink}" opacity="0.9">${esc(line)}</text>`).join('')
    + faceValue(entry, p, unitLabel, serial(entry))
    + frontNoun(entry, art, p)
    + disclaimer(entry, p)
    + `</svg>`;
}

export function noteBackSVG(entry) {
  const t = theme(entry.theme);
  const p = t.palette;
  const art = nounArt(entry.nounId);
  const how = textLines(entry).how.slice(0, 7);
  const unitLabel = (entry.denomination === 1 ? entry.unit : entry.units).toUpperCase();
  return svgOpen(`Reverse of ${esc(entry.name)}: how the currency would work, and the provenance of actual Noun #${entry.nounId}`)
    + frame(p)
    + `<g opacity="0.7">${pattern(entry, p)}</g>`
    + corners(entry, p)
    + `<text x="110" y="80" font-family="${MONO}" font-size="18" letter-spacing="3" fill="${p.text}">HOW IT WOULD WORK</text>`
    + `<text x="110" y="130" font-family="${SANS}" font-weight="800" font-size="40" fill="${p.ink}">${esc(entry.name)}</text>`
    + how.map((line, i) => `<text x="112" y="${182 + i * 34}" font-family="${SANS}" font-size="25" fill="${p.ink}">${esc(line)}</text>`).join('')
    + `<text x="110" y="440" font-family="${MONO}" font-size="14" letter-spacing="1.6" fill="${p.ink}">EARNED BY CONTRIBUTING · SPENT ON THE SHARED THING</text>`
    + `<text x="110" y="462" font-family="${MONO}" font-size="14" letter-spacing="1.6" fill="${p.ink}">NEVER SOLD · NEVER CASHED OUT</text>`
    + `<text x="110" y="500" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="2" fill="${p.text}">${esc(entry.denomination)} ${esc(unitLabel)} · ${esc(serial(entry))}</text>`
    + backNoun(entry, art, p)
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
    noun_provenance: NOUN_PROVENANCE,
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
