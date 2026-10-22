/**
 * Security Edition (v2) for every Currency Builder collection: adapts Commons,
 * Global Barter and Almanac entries to the banknote renderer in ./security.mjs.
 */
import { BARTER, region } from './barter.mjs';
import { COMMONS, theme } from './commons.mjs';
import { ALMANAC, quarter } from './almanac.mjs';
import { pad } from './primitives.mjs';
import { securityFront, securityBack, FEATURES } from './security.mjs';
import { TYPE_CREDITS } from './type.mjs';

export { FEATURES, TYPE_CREDITS };
export const SECURITY_BASE = '/currency-builder/security';
export const COLLECTIONS = {
  commons: { id: 'commons', name: 'Commons', data: COMMONS, base: '/currency-builder/commons' },
  barter: { id: 'barter', name: 'Global Barter', data: BARTER, base: '/currency-builder/barter' },
  almanac: { id: 'almanac', name: 'Almanac', data: ALMANAC, base: '/currency-builder/almanac' },
};

const host = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};
const trim = (value) => String(value).replace(/[.\s]+$/, '');

/** The renderer's view of one currency. */
export function securityNote(collection, entry) {
  const unitWord = entry.denomination === 1 ? entry.unit : entry.units;
  if (collection === 'barter') {
    const r = region(entry.region);
    return {
      name: entry.name,
      kicker: `Global Barter · ${r.name}`,
      line: entry.line,
      place: `${entry.place} · ${entry.era}`,
      value: entry.denomination,
      unitWord,
      serial: `GB${entry.code.slice(1)}${pad(entry.nounId, 4)}`,
      nounId: entry.nounId,
      palette: r.palette,
      back: {
        heading: `The tradition · ${entry.era}`,
        title: entry.tradition,
        paragraphs: [{ body: entry.fact }, { label: 'How a note would work', body: entry.how }],
        source: host(entry.source_url),
      },
    };
  }
  if (collection === 'commons') {
    const t = theme(entry.theme);
    return {
      name: entry.name,
      kicker: `Commons · ${t.name} · ${trim(t.motto)}`,
      line: entry.line,
      place: 'Currency Builder · El Segundo',
      value: entry.denomination,
      unitWord,
      serial: `CB${entry.code}${pad(entry.nounId, 4)}`,
      nounId: entry.nounId,
      palette: t.palette,
      back: {
        heading: `${t.name} · ${trim(t.motto)}`,
        title: entry.name,
        paragraphs: [{ body: entry.line }, { label: 'How it would work', body: entry.how }],
      },
    };
  }
  if (collection === 'almanac') {
    const q = quarter(entry.quarter);
    return {
      name: entry.name,
      kicker: `Almanac · ${q.name} · Week ${entry.week}`,
      line: entry.line,
      place: entry.when,
      value: entry.week,
      unitWord: 'of fifty-two',
      serial: `AL${entry.code.slice(1)}${pad(entry.nounId, 4)}`,
      nounId: entry.nounId,
      palette: q.palette,
      back: {
        heading: `${q.name} · ${entry.when}`,
        title: entry.name,
        paragraphs: [{ body: entry.line }, { label: 'How it is earned', body: entry.how }],
        source: host(entry.source_url),
      },
    };
  }
  throw new Error(`unknown collection: ${collection}`);
}

export function securityFiles(collection, entry) {
  return {
    front: `${SECURITY_BASE}/${collection}/front/${entry.slug}.svg`,
    back: `${SECURITY_BASE}/${collection}/back/${entry.slug}.svg`,
  };
}

export function securitySVG(collection, entry, face) {
  const note = securityNote(collection, entry);
  return face === 'front' ? securityFront(note) : securityBack(note);
}

/** Every note in every collection, in collection order. */
export function securityEntries() {
  return Object.values(COLLECTIONS).flatMap((c) => c.data.currencies.map((entry) => ({ collection: c.id, entry })));
}
