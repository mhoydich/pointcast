/**
 * Global Barter — 100 Currency Builder note designs, each inspired by a real
 * barter tradition and each carrying a different actual Noun (#0–99, once each).
 *
 * Shared drawing and Noun rendering live in ./primitives.mjs. Every note is
 * deterministic: the same entry always produces the same SVG bytes.
 */
import DATA from '../../data/currency-builder/barter-100.json' with { type: 'json' };
import {
  W, H, SANS, MONO, NOUN_PROVENANCE, esc, pad, round, wrap, nounArt, rosette, chevrons,
  frame, corners, disclaimer, svgOpen, nameSize, faceValue, frontNoun, backNoun,
} from './primitives.mjs';

export { nounArt };
export const BARTER = DATA;
export const BASE = '/currency-builder/barter';

const REGIONS = Object.fromEntries(DATA.regions.map((region) => [region.id, region]));

export function region(id) {
  const found = REGIONS[id];
  if (!found) throw new Error(`unknown Global Barter region: ${id}`);
  return found;
}

export function serial(entry) {
  return `GB-${entry.code}-N${pad(entry.nounId, 4)}`;
}

/** Text as the note faces wrap it, so tests can check nothing is cut. */
export function textLines(entry) {
  return {
    line: wrap(entry.line, 40),
    tradition: wrap(entry.tradition, 38),
    fact: wrap(entry.fact, 56),
    how: wrap(entry.how, 56),
  };
}

/** A small globe: meridians and parallels, the barter notes' shared motif. */
function globe(p, cx, cy, r, opacity) {
  const out = [`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.ink}" stroke-width="1.2" opacity="${opacity}"/>`];
  for (let i = 1; i <= 4; i++) {
    const rx = round(r * (i / 5));
    out.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${r}" fill="none" stroke="${p.ink}" stroke-width="0.8" opacity="${opacity}"/>`);
  }
  for (let i = -3; i <= 3; i++) {
    const y = cy + (i * r) / 4;
    const half = round(Math.sqrt(Math.max(0, r * r - (y - cy) ** 2)));
    out.push(`<line x1="${round(cx - half)}" y1="${round(y)}" x2="${round(cx + half)}" y2="${round(y)}" stroke="${p.ink}" stroke-width="0.8" opacity="${opacity}"/>`);
  }
  return out.join('');
}

function pattern(entry, p) {
  return chevrons(p, 0.14)
    + globe(p, 640, 420, 120, 0.22)
    + rosette(entry.nounId % 2 ? 300 : 620, 470, 190, entry.nounId, p.accent, 0.35);
}

export function noteFrontSVG(entry) {
  const r = region(entry.region);
  const p = r.palette;
  const art = nounArt(entry.nounId);
  const name = entry.name.toUpperCase();
  const size = nameSize(name, 88);
  const lines = textLines(entry).line.slice(0, 2);
  const unitLabel = (entry.denomination === 1 ? entry.unit : entry.units).toUpperCase();
  const label = `${esc(entry.name)}, a Global Barter currency design inspired by ${esc(entry.tradition)} (${esc(entry.place)}), with actual Noun #${entry.nounId}; ${entry.denomination} ${esc(unitLabel.toLowerCase())}; design concept, not legal tender`;
  return svgOpen(label)
    + frame(p)
    + `<g>${pattern(entry, p)}</g>`
    + corners(entry, p)
    + `<text x="110" y="70" font-family="${MONO}" font-size="18" letter-spacing="3" fill="${p.ink}">NOUNS MONEY · GLOBAL BARTER</text>`
    + `<text x="110" y="100" font-family="${MONO}" font-size="16" letter-spacing="3" fill="${p.text}">${esc(r.name.toUpperCase())} · ${esc(entry.era.toUpperCase())}</text>`
    + `<text x="110" y="${150 + size * 0.6}" font-family="${SANS}" font-weight="800" font-size="${size}" letter-spacing="-2" fill="${p.ink}">${esc(name)}</text>`
    + lines.map((line, i) => `<text x="112" y="${262 + i * 32}" font-family="${SANS}" font-size="25" fill="${p.ink}" opacity="0.9">${esc(line)}</text>`).join('')
    + `<text x="112" y="${262 + lines.length * 32 + 14}" font-family="${MONO}" font-size="16" letter-spacing="2" fill="${p.text}">${esc(entry.place.toUpperCase())}</text>`
    + faceValue(entry, p, unitLabel, serial(entry))
    + frontNoun(entry, art, p)
    + disclaimer(entry, p)
    + `</svg>`;
}

export function noteBackSVG(entry) {
  const r = region(entry.region);
  const p = r.palette;
  const art = nounArt(entry.nounId);
  const t = textLines(entry);
  const tradition = t.tradition.slice(0, 2);
  const fact = t.fact.slice(0, 4);
  const how = t.how.slice(0, 5);
  const factTop = 118 + tradition.length * 34 + 14;
  const howHead = factTop + fact.length * 26 + 22;
  const unitLabel = (entry.denomination === 1 ? entry.unit : entry.units).toUpperCase();
  let host = entry.source_url;
  try { host = new URL(entry.source_url).hostname.replace(/^www\./, ''); } catch {}
  return svgOpen(`Reverse of ${esc(entry.name)}: the ${esc(entry.tradition)} tradition, how a note inspired by it would work, and the provenance of actual Noun #${entry.nounId}`)
    + frame(p)
    + `<g opacity="0.6">${pattern(entry, p)}</g>`
    + corners(entry, p)
    + `<text x="110" y="80" font-family="${MONO}" font-size="16" letter-spacing="3" fill="${p.text}">THE TRADITION · ${esc(entry.era.toUpperCase())}</text>`
    + tradition.map((line, i) => `<text x="110" y="${118 + i * 34}" font-family="${SANS}" font-weight="800" font-size="30" fill="${p.ink}">${esc(line)}</text>`).join('')
    + fact.map((line, i) => `<text x="112" y="${factTop + i * 26}" font-family="${SANS}" font-size="20" fill="${p.ink}">${esc(line)}</text>`).join('')
    + `<text x="110" y="${howHead}" font-family="${MONO}" font-size="14" letter-spacing="2" fill="${p.text}">HOW A NOTE WOULD WORK</text>`
    + how.map((line, i) => `<text x="112" y="${howHead + 28 + i * 26}" font-family="${SANS}" font-size="20" fill="${p.ink}">${esc(line)}</text>`).join('')
    + `<text x="110" y="488" font-family="${MONO}" font-size="13" letter-spacing="1.5" fill="${p.ink}" opacity="0.85">SOURCE · ${esc(host)}</text>`
    + `<text x="110" y="514" font-family="${MONO}" font-weight="700" font-size="18" letter-spacing="2" fill="${p.text}">${esc(entry.denomination)} ${esc(unitLabel)} · ${esc(serial(entry))}</text>`
    + backNoun(entry, art, p)
    + disclaimer(entry, p)
    + `</svg>`;
}

export function noteFiles(entry) {
  return { front: `${BASE}/notes/front/${entry.slug}.svg`, back: `${BASE}/notes/back/${entry.slug}.svg` };
}

/** The machine edition: every currency with its tradition, Noun provenance and files. */
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
    regions: DATA.regions,
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
