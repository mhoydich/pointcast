/**
 * Nouns Money, Desk Notes — one note for each PointCast house agent.
 *
 * The Desk's five agents (Sky, Tides, Swell, Sun, Air) file a reading every
 * morning at the beach. A person standing there can check it. A check is the
 * one thing agents cannot do for themselves, so it is what earns the note:
 * the person who checked Sky's reading gets a Sky Note.
 *
 * A standing edition, reserved: the rules and faces are published; nothing
 * writes these lines yet. Drawn with the shared Currency Builder primitives.
 * Collectible marks: never sold, redeemed or traded for money.
 */
import {
  SANS, MONO, NOUN_PROVENANCE, esc, pad, wrap, nounArt, rosette, chevrons,
  frame, corners, disclaimer, svgOpen, nameSize, faceValue, frontNoun, backNoun,
} from './primitives.mjs';
import { NOUNS_MONEY_EDITIONS, POINT_KINDS } from '../network-points.mjs';

export const BASE = '/currency-builder/desk-notes';
const EDITION = NOUNS_MONEY_EDITIONS.find((e) => e.id === 'desk-notes');

const FACES = {
  sky: {
    nounId: 64, code: 'SKY',
    line: 'For checking the sky. Sky calls the morning; you look up and say if it is right.',
    how: "Sky files a sky reading at the beach each morning. Stand there, look up, and mark it checked or wrong. Either answer earns a Sky Note, one a day, because the check is what the Desk can't do for itself.",
    palette: { paper: '#f7efe6', ink: '#2b1c3d', accent: '#e07a3f', accent2: '#6b5bb8', text: '#b4552a' },
  },
  tides: {
    nounId: 27, code: 'TID',
    line: 'For checking the water. Tides calls high and low; you stand at the line.',
    how: "Tides files the day's tide call from the Los Angeles tide gauge. Check it against the water at the beach and mark it. One Tides Note a day.",
    palette: { paper: '#e6f0f1', ink: '#0d2f38', accent: '#1f6f8a', accent2: '#d9a441', text: '#1a5d73' },
  },
  swell: {
    nounId: 36, code: 'SWL',
    line: 'For checking the surf. Swell calls the height; you watch a set come in.',
    how: "Swell files a surf height from the offshore buoy. Watch a set from the sand and mark it checked or wrong. One Swell Note a day.",
    palette: { paper: '#e9eef7', ink: '#0f1f45', accent: '#2a5fa8', accent2: '#e8b04a', text: '#244f8f' },
  },
  sun: {
    nounId: 54, code: 'SUN',
    line: 'For checking the light. Sun calls sunrise and sunset; you see it happen.',
    how: "Sun files the day's sunrise and sunset times. Be there for one and mark the call. One Sun Note a day.",
    palette: { paper: '#f8f0dc', ink: '#3a2408', accent: '#c99a1c', accent2: '#c2452d', text: '#9a7310' },
  },
  air: {
    nounId: 21, code: 'AIR',
    line: 'For checking the air. Air calls the quality; you breathe it and say.',
    how: "Air files the morning air-quality reading. Check it on site, haze, smoke or clear, and mark it. One Air Note a day.",
    palette: { paper: '#eaf3ec', ink: '#12301f', accent: '#3f8a5c', accent2: '#c7a03a', text: '#2f7049' },
  },
};

export const DESK_NOTES = {
  ...EDITION,
  notes: EDITION.notes.map((note) => ({
    ...note,
    ...FACES[note.agent],
    slug: note.id,
    denomination: '1',
    unit: `${note.agent.toUpperCase()} · DESK NOTE`,
    points: POINT_KINDS['desk-check'].points,
  })),
};

export function serial(entry) {
  return `HE-DN-${entry.code}-N${pad(entry.nounId, 4)}`;
}

/** Five small marks across the top band, the one for this agent filled. */
function deskBand(entry, p, y) {
  return DESK_NOTES.notes.map((n, i) => {
    const x = 110 + i * 46;
    return `<rect x="${x}" y="${y}" width="34" height="10" fill="${n.id === entry.id ? p.accent : 'none'}" stroke="${p.ink}" stroke-width="1.5"/>`;
  }).join('');
}

export function noteFrontSVG(entry) {
  const p = entry.palette;
  const art = nounArt(entry.nounId);
  const name = entry.name.toUpperCase();
  const size = nameSize(name, 104);
  const lines = wrap(entry.line, 40).slice(0, 3);
  return svgOpen(`${esc(entry.long)}, a Nouns Money Desk Note with actual Noun #${entry.nounId}; earned by checking a house agent's reading on site; no cash value`)
    + frame(p)
    + chevrons(p, 0.05)
    + rosette(560, 300, 200, entry.nounId + 3, p.accent, 0.2)
    + corners(entry, p)
    + `<text x="110" y="70" font-family="${MONO}" font-size="18" letter-spacing="3" fill="${p.ink}">NOUNS MONEY · DESK NOTES</text>`
    + `<text x="110" y="100" font-family="${MONO}" font-size="16" letter-spacing="3" fill="${p.text}">ISSUED BY THE DESK · CHECKED BY A PERSON</text>`
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
    + deskBand(entry, p, 48)
    + corners(entry, p)
    + `<text x="110" y="100" font-family="${MONO}" font-size="18" letter-spacing="3" fill="${p.text}">HOW IT IS EARNED</text>`
    + `<text x="110" y="148" font-family="${SANS}" font-weight="800" font-size="40" fill="${p.ink}">${esc(entry.long)}</text>`
    + how.map((line, i) => `<text x="112" y="${196 + i * 34}" font-family="${SANS}" font-size="25" fill="${p.ink}">${esc(line)}</text>`).join('')
    + `<text x="110" y="420" font-family="${MONO}" font-weight="700" font-size="14" letter-spacing="1.6" fill="${p.text}">PROFILE MARK · ${esc(entry.frame.toUpperCase())}</text>`
    + `<text x="110" y="446" font-family="${MONO}" font-size="14" letter-spacing="1.6" fill="${p.ink}">THE AGENT FILES · A PERSON CHECKS · THE LEDGER KEEPS BOTH</text>`
    + `<text x="110" y="468" font-family="${MONO}" font-size="14" letter-spacing="1.6" fill="${p.ink}">NEVER SOLD · NEVER REDEEMED · PASS ONE A DAY TO A FRIEND</text>`
    + `<text x="110" y="506" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="2" fill="${p.text}">${esc(serial(entry))}</text>`
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
    title: 'Nouns Money · Desk Notes',
    collection: 'desk-notes',
    issuer: EDITION.issuer,
    season: EDITION.season,
    status: 'Reserved. Rules and faces are published; nothing writes Desk Note lines yet, and nothing is on chain.',
    earned_by: { kind: 'desk-check', points: POINT_KINDS['desk-check'].points, rule: POINT_KINDS['desk-check'].rule, source: 'https://pointcast.xyz/desk/' },
    canonical: `https://pointcast.xyz${BASE}/`,
    ledger: 'https://pointcast.xyz/points.json',
    trim_mm: { width: 150, height: 75, bleed: 3 },
    noun_provenance: NOUN_PROVENANCE,
    disclosure: 'Collectible marks with no cash value. Never sold, redeemed or traded for money. Not part of Good Feels or any cannabis program. Nouns art is CC0; not affiliated with or endorsed by Nouns DAO.',
    notes: DESK_NOTES.notes.map((entry) => {
      const art = nounArt(entry.nounId);
      return {
        id: entry.id, agent: entry.agent, name: entry.name, long: entry.long, rule: entry.rule, frame: entry.frame,
        points: entry.points, serial: serial(entry),
        noun: { id: entry.nounId, traits: art.labels, source: `https://nouns.wtf/noun/${entry.nounId}` },
        files: noteFiles(entry),
      };
    }),
  };
}
