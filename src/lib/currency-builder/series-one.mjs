/**
 * Nouns Money, Series 1 — the three notes earned by checking in.
 *
 * Issued by Hoydich Enterprises: the "Enjoy." house note, the KansasDAO Blue
 * Note and the Nouns Reserve note. Each carries one actual CC0 Noun and is
 * drawn with the shared Currency Builder primitives, so it sits beside the
 * Commons, Barter and Almanac sets. The earn rules are the ledger's rules
 * (src/lib/network-points.mjs); this file only draws.
 *
 * Collectible marks: never sold, redeemed or traded for money.
 */
import {
  W, H, SANS, MONO, NOUN_PROVENANCE, esc, pad, wrap, nounArt, rosette, chevrons,
  frame, corners, disclaimer, svgOpen, nameSize, faceValue, frontNoun, backNoun,
} from './primitives.mjs';
import { NOUNS_MONEY_EDITIONS, POINT_KINDS } from '../network-points.mjs';

export { nounArt, W, H };
export const BASE = '/currency-builder/series-1';
const EDITION = NOUNS_MONEY_EDITIONS.find((e) => e.id === 'series-1');

/** Drawing details per note. Rules and names come from the ledger. */
const FACES = {
  enjoy: {
    nounId: 57,
    code: 'ENJ',
    denomination: '1',
    unit: 'ENJOY.',
    line: 'For showing up. One for each day you check in, from anywhere.',
    how: 'Check in once on any network site: PointCast, elsegundo.xyz, Industry Next or the University of El Segundo. The first check-in of the day writes one line on the open ledger and one Enjoy. note to your profile.',
    palette: { paper: '#f6efe0', ink: '#3b2414', accent: '#d9622b', accent2: '#1f8a8a', text: '#a8461c' },
  },
  blue: {
    nounId: 92,
    code: 'BLU',
    denomination: '3',
    unit: 'BLUE NOTE',
    line: 'Three days in a row. The KansasDAO Blue Note, back in circulation.',
    how: 'Check in three days running and the third day adds a Blue Note. Day six adds another, and so on. Miss a day and the count starts again; the notes you have stay.',
    palette: { paper: '#e8edf6', ink: '#0f2347', accent: '#1f4fa8', accent2: '#d4a72c', text: '#1f4fa8' },
  },
  reserve: {
    nounId: 26,
    code: 'RSV',
    denomination: '7',
    unit: 'NOUNS RESERVE',
    line: 'Seven days in a row, or your first check-in from a network town.',
    how: 'Every seventh day in a row adds a Nouns Reserve note. So does your first check-in from each network town: El Segundo, Medway, New Braunfels and Elizabeth.',
    palette: { paper: '#f4ede4', ink: '#2a0f0f', accent: '#b8261f', accent2: '#c9a227', text: '#8f1d18' },
  },
};

export const SERIES_ONE = {
  ...EDITION,
  notes: EDITION.notes.map((note) => ({
    ...note,
    ...FACES[note.id],
    slug: note.id,
    points: note.id === 'enjoy' ? POINT_KINDS.checkin.points : note.id === 'blue' ? POINT_KINDS.streak.points : POINT_KINDS['long-streak'].points,
  })),
};

export function serial(entry) {
  return `HE-S1-${entry.code}-N${pad(entry.nounId, 4)}`;
}

/** A row of square noggles across the top band: the house mark of Series 1. */
function noggleBand(p, y, opacity) {
  const out = [];
  for (let i = 0; i < 12; i += 1) {
    const x = 110 + i * 56;
    out.push(`<g opacity="${opacity}" fill="${i % 3 === 1 ? p.accent2 : p.accent}"><rect x="${x}" y="${y}" width="16" height="12"/><rect x="${x + 22}" y="${y}" width="16" height="12"/><rect x="${x + 16}" y="${y + 4}" width="6" height="3"/></g>`);
  }
  return out.join('');
}

export function noteFrontSVG(entry) {
  const p = entry.palette;
  const art = nounArt(entry.nounId);
  const name = entry.name.toUpperCase();
  const size = nameSize(name, 104);
  const lines = wrap(entry.line, 40).slice(0, 3);
  return svgOpen(`${esc(entry.long)}, Nouns Money Series 1 by Hoydich Enterprises, a collectible note with actual Noun #${entry.nounId}; earned by checking in; no cash value`)
    + frame(p)
    + chevrons(p, 0.06)
    + rosette(560, 300, 210, entry.nounId + 1, p.accent, 0.22)
    + corners(entry, p)
    + `<text x="110" y="70" font-family="${MONO}" font-size="18" letter-spacing="3" fill="${p.ink}">NOUNS MONEY · SERIES 1</text>`
    + `<text x="110" y="100" font-family="${MONO}" font-size="16" letter-spacing="3" fill="${p.text}">HOYDICH ENTERPRISES · ${esc(EDITION.season.toUpperCase())}</text>`
    + `<text x="110" y="${150 + size * 0.6}" font-family="${SANS}" font-weight="800" font-size="${size}" letter-spacing="-2" fill="${p.ink}">${esc(name)}</text>`
    + lines.map((line, i) => `<text x="112" y="${268 + i * 32}" font-family="${SANS}" font-size="25" fill="${p.ink}" opacity="0.9">${esc(line)}</text>`).join('')
    + faceValue(entry, p, entry.unit, serial(entry))
    + frontNoun(entry, art, p)
    + disclaimer(entry, p)
    + `</svg>`;
}

export function noteBackSVG(entry) {
  const p = entry.palette;
  const art = nounArt(entry.nounId);
  const how = wrap(entry.how, 50).slice(0, 6);
  return svgOpen(`Reverse of the ${esc(entry.long)}: how it is earned, and the provenance of actual Noun #${entry.nounId}`)
    + frame(p)
    + noggleBand(p, 44, 0.5)
    + corners(entry, p)
    + `<text x="110" y="100" font-family="${MONO}" font-size="18" letter-spacing="3" fill="${p.text}">HOW IT IS EARNED</text>`
    + `<text x="110" y="148" font-family="${SANS}" font-weight="800" font-size="40" fill="${p.ink}">${esc(entry.long)}</text>`
    + how.map((line, i) => `<text x="112" y="${196 + i * 34}" font-family="${SANS}" font-size="25" fill="${p.ink}">${esc(line)}</text>`).join('')
    + `<text x="110" y="420" font-family="${MONO}" font-weight="700" font-size="14" letter-spacing="1.6" fill="${p.text}">PROFILE MARK · ${esc(entry.frame.toUpperCase())}</text>`
    + `<text x="110" y="446" font-family="${MONO}" font-size="14" letter-spacing="1.6" fill="${p.ink}">WRITTEN TO THE OPEN LEDGER · POINTCAST.XYZ/POINTS</text>`
    + `<text x="110" y="468" font-family="${MONO}" font-size="14" letter-spacing="1.6" fill="${p.ink}">EARNED BY SHOWING UP · NEVER SOLD · NEVER REDEEMED</text>`
    + `<text x="110" y="506" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="2" fill="${p.text}">ENJOY. · ${esc(serial(entry))}</text>`
    + backNoun(entry, art, p)
    + disclaimer(entry, p)
    + `</svg>`;
}

export function noteFiles(entry) {
  return { front: `${BASE}/notes/front/${entry.slug}.svg`, back: `${BASE}/notes/back/${entry.slug}.svg` };
}

export function machineEdition() {
  return {
    schema_version: 1,
    title: 'Nouns Money · Series 1',
    collection: 'series-1',
    issuer: EDITION.issuer,
    season: EDITION.season,
    opens: EDITION.opens,
    closes: EDITION.closes,
    canonical: `https://pointcast.xyz${BASE}/`,
    ledger: 'https://pointcast.xyz/points.json',
    trim_mm: { width: 150, height: 75, bleed: 3 },
    noun_provenance: NOUN_PROVENANCE,
    status: 'Earn rules published; the ledger is built and switched off until Mike turns it on. Nothing is on chain.',
    disclosure: 'Collectible marks with no cash value. Never sold, redeemed or traded for money. Not part of Good Feels or any cannabis program. Nouns art is CC0; not affiliated with or endorsed by Nouns DAO.',
    notes: SERIES_ONE.notes.map((entry) => {
      const art = nounArt(entry.nounId);
      return {
        id: entry.id, name: entry.name, long: entry.long, rule: entry.rule, frame: entry.frame,
        points: entry.points, denomination: entry.denomination, serial: serial(entry),
        noun: { id: entry.nounId, traits: art.labels, source: `https://nouns.wtf/noun/${entry.nounId}` },
        files: noteFiles(entry),
      };
    }),
  };
}
