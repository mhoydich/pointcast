// PointCast-only helper: look things up in the committed sister atlas snapshot
// (src/data/atlas/snapshots/elsegundo.xyz.json) so adapters never read another repo's working tree.
// A coordinate copied from a sister record keeps that record's precision, source and license.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SNAPSHOT = 'src/data/atlas/snapshots/elsegundo.xyz.json';
let cache = null;

export const norm = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function sisterAtlas(root) {
  if (!cache) {
    const p = resolve(root, SNAPSHOT);
    cache = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { records: [], layers: [] };
  }
  return cache;
}

export function sisterById(root, id) {
  return sisterAtlas(root).records.find((r) => r.id === id) || null;
}

/** The one located sister record of the given type(s) whose normalized name equals `name`; null when none or ambiguous. */
export function sisterByName(root, types, name, { located = true } = {}) {
  const want = norm(name);
  const list = [].concat(types);
  const hits = sisterAtlas(root).records.filter((r) => list.includes(r.type) && norm(r.name) === want && (!located || r.location));
  return hits.length === 1 ? hits[0] : null;
}

/** Located sister records of the given type(s), longest names first (for substring matching). */
export function sisterLocated(root, types) {
  const list = [].concat(types);
  return sisterAtlas(root).records.filter((r) => list.includes(r.type) && r.location).sort((a, b) => b.name.length - a.name.length);
}

/** Build a PointCast `location` from a sister record, keeping its precision, source and license. */
export function locationFrom(rec, extra = {}) {
  const l = rec && rec.location;
  if (!l) return undefined;
  const out = { lat: l.lat, lon: l.lon, precision: l.precision };
  if (l.address) out.address = l.address;
  if (extra.area || l.area) out.area = extra.area || l.area;
  out.method = `copied from the elsegundo.xyz atlas record ${rec.id}${l.method ? ` (${l.method})` : ''}`;
  const source = l.source || (rec.source && rec.source[0] && rec.source[0].url);
  if (source) out.source = source;
  if (l.license) out.license = l.license;
  return out;
}

export const sameAs = (rec) => (rec ? [{ rel: 'same-as', id: rec.id }] : undefined);
