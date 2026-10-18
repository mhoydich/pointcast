/**
 * Almanac — 52 Currency Builder note designs, one for each week of the South
 * Bay year, each carrying one actual Noun.
 *
 * Every note draws the same 52-tick year wheel with its own week lit, so the
 * full set reads as one calendar. Shared drawing and Noun rendering live in
 * ./primitives.mjs. Output is deterministic.
 */
import DATA from '../../data/currency-builder/almanac-52.json' with { type: 'json' };
import {
  W, H, SANS, MONO, NOUN_PROVENANCE, esc, pad, round, wrap, nounArt, rosette,
  frame, corners, disclaimer, svgOpen, nameSize, faceValue, frontNoun, backNoun,
} from './primitives.mjs';

export { nounArt, W, H };
export const ALMANAC = DATA;
export const BASE = '/currency-builder/almanac';

const QUARTERS = Object.fromEntries(DATA.quarters.map((quarter) => [quarter.id, quarter]));

export function quarter(id) {
  const found = QUARTERS[id];
  if (!found) throw new Error(`unknown Almanac quarter: ${id}`);
  return found;
}

/** The year wheel: 52 ticks clockwise from the top, with this note's week lit. */
function yearWheel(entry, p, cx, cy, r) {
  const out = [];
  for (let i = 1; i <= 4; i++) out.push(`<circle cx="${cx}" cy="${cy}" r="${r - i * 34}" fill="none" stroke="${p.ink}" stroke-width="0.7" opacity="0.1"/>`);
  for (let q = 0; q < 4; q++) {
    const a = -Math.PI / 2 + (q / 4) * Math.PI * 2;
    out.push(`<line x1="${cx}" y1="${cy}" x2="${round(cx + r * Math.cos(a))}" y2="${round(cy + r * Math.sin(a))}" stroke="${p.ink}" stroke-width="0.8" opacity="0.12"/>`);
  }
  for (let week = 1; week <= 52; week++) {
    const a = -Math.PI / 2 + ((week - 0.5) / 52) * Math.PI * 2;
    const lit = week === entry.week;
    const inner = r - (lit ? 46 : week % 13 === 0 ? 30 : 18);
    out.push(`<line x1="${round(cx + inner * Math.cos(a))}" y1="${round(cy + inner * Math.sin(a))}" x2="${round(cx + r * Math.cos(a))}" y2="${round(cy + r * Math.sin(a))}" stroke="${lit ? p.accent2 : p.accent}" stroke-width="${lit ? 7 : 2}" stroke-linecap="round" opacity="${lit ? 0.95 : 0.38}"/>`);
    if (lit) out.push(`<circle cx="${round(cx + (r + 16) * Math.cos(a))}" cy="${round(cy + (r + 16) * Math.sin(a))}" r="7" fill="${p.accent2}"/>`);
  }
  out.push(rosette(cx, cy, r * 0.9, entry.nounId + entry.week, p.accent, 0.3));
  return out.join('');
}

export function serial(entry) {
  return `CB-ALM-${entry.code}-N${pad(entry.nounId, 4)}`;
}

export function unitLabel(entry) {
  return `WEEK ${pad(entry.week, 2)} OF 52`;
}

/** Front line and how text, wrapped the way the note faces draw them. */
export function textLines(entry) {
  return { line: wrap(entry.line, 40), how: wrap(entry.how, 50) };
}

export function noteFrontSVG(entry) {
  const q = quarter(entry.quarter);
  const p = q.palette;
  const art = nounArt(entry.nounId);
  const name = entry.name.toUpperCase();
  const size = nameSize(name);
  const lines = textLines(entry).line.slice(0, 3);
  const label = `${esc(entry.name)}, week ${entry.week} of the Almanac, a currency design with actual Noun #${entry.nounId}; ${esc(entry.when.toLowerCase())}; design concept, not legal tender`;
  return svgOpen(label)
    + frame(p)
    + `<g>${yearWheel(entry, p, 560, 300, 230)}</g>`
    + corners(entry, p)
    + `<text x="110" y="70" font-family="${MONO}" font-size="18" letter-spacing="3" fill="${p.ink}">NOUNS MONEY · ALMANAC</text>`
    + `<text x="110" y="100" font-family="${MONO}" font-size="16" letter-spacing="3" fill="${p.text}">${esc(q.name.toUpperCase())} · ${esc(entry.when.toUpperCase())}</text>`
    + `<text x="110" y="${150 + size * 0.6}" font-family="${SANS}" font-weight="800" font-size="${size}" letter-spacing="-2" fill="${p.ink}">${esc(name)}</text>`
    + lines.map((line, i) => `<text x="112" y="${262 + i * 32}" font-family="${SANS}" font-size="25" fill="${p.ink}" opacity="0.9">${esc(line)}</text>`).join('')
    + faceValue(entry, p, unitLabel(entry), serial(entry))
    + frontNoun(entry, art, p)
    + disclaimer(entry, p)
    + `</svg>`;
}

export function noteBackSVG(entry) {
  const q = quarter(entry.quarter);
  const p = q.palette;
  const art = nounArt(entry.nounId);
  const how = textLines(entry).how.slice(0, 7);
  return svgOpen(`Reverse of ${esc(entry.name)}: how the note is earned, and the provenance of actual Noun #${entry.nounId}`)
    + frame(p)
    + `<g opacity="0.6">${yearWheel(entry, p, 560, 300, 230)}</g>`
    + corners(entry, p)
    + `<text x="110" y="80" font-family="${MONO}" font-size="18" letter-spacing="3" fill="${p.text}">HOW IT IS EARNED</text>`
    + `<text x="110" y="130" font-family="${SANS}" font-weight="800" font-size="40" fill="${p.ink}">${esc(entry.name)}</text>`
    + how.map((line, i) => `<text x="112" y="${182 + i * 34}" font-family="${SANS}" font-size="25" fill="${p.ink}">${esc(line)}</text>`).join('')
    + `<text x="110" y="414" font-family="${MONO}" font-weight="700" font-size="14" letter-spacing="1.6" fill="${p.text}">WHERE · ${esc(entry.where.toUpperCase())}</text>`
    + `<text x="110" y="440" font-family="${MONO}" font-size="14" letter-spacing="1.6" fill="${p.ink}">EARNED BY NOTICING · LOGGED IN THE TOWN ALMANAC</text>`
    + `<text x="110" y="462" font-family="${MONO}" font-size="14" letter-spacing="1.6" fill="${p.ink}">TRADED ONE FOR ONE · NEVER SOLD · WILDLIFE FIRST</text>`
    + `<text x="110" y="500" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="2" fill="${p.text}">${esc(unitLabel(entry))} · ${esc(serial(entry))}</text>`
    + backNoun(entry, art, p)
    + disclaimer(entry, p)
    + `</svg>`;
}

export function noteFiles(entry) {
  return { front: `${BASE}/notes/front/${entry.slug}.svg`, back: `${BASE}/notes/back/${entry.slug}.svg` };
}

/** The machine edition: every week with its Noun provenance, source and files. */
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
    rules: DATA.rules,
    noun_provenance: NOUN_PROVENANCE,
    quarters: DATA.quarters,
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
