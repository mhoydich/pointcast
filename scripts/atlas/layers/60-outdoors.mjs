// Layer: outdoors. The OPEN/25 field guide (src/lib/radius25-outdoors.ts): public outdoor places inside the
// 25-mile radius, each tied to the official page it names. Placed only where the elsegundo.xyz curated
// places register (or its architecture catalog) already holds a sourced coordinate for the same place.
import { loadTs } from '../_ts.mjs';

const PAGE = 'https://pointcast.xyz/beach-commons/v18/outdoors';
const DATA = 'https://pointcast.xyz/beach-commons/v18/outdoors.json';
const CURATED = '/home/user/hello-token-reserve/content/places/curated.json';
const BUILDINGS = '/home/user/hello-token-reserve/public/architecture/buildings.json';

export const layer = {
  id: 'outdoors',
  name: 'Outdoors (OPEN/25)',
  description: 'Public parks, beaches, courts, gardens and preserves from the PointCast OPEN/25 open-air field guide, each linked to the official page that describes it.',
  types: ['place', 'quiet-place'],
  inline: true,
  data: DATA,
  page: PAGE,
  license: 'CC0-1.0',
  updated: '2026-08-02',
  source: { url: 'https://www.elsegundorecparks.gov/parks-facilities/parks-facilities-directory', checked: '2026-08-02', label: 'fact' },
  notes: 'Facts come from OUTDOOR_RESOURCES in src/lib/radius25-outdoors.ts (25 resources). The module carries one edition date (OPEN_AIR_COMMONS.updatedAt, 2026-08-02) and no per-resource dates, so every record uses that date as checked/updated. Coordinates exist only where the elsegundo.xyz curated places register (or architecture catalog, non-estimated points) holds the same place; other resources carry no location.',
};

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export async function records({ site, readJson, helpers }) {
  const { rid, slug, src, loc, summary, compact } = helpers;
  const { existsSync } = await import('node:fs');
  const mod = await loadTs('src/lib/radius25-outdoors.ts');
  const date = String(mod.OPEN_AIR_COMMONS.updatedAt).slice(0, 10);
  const places = existsSync(CURATED) ? readJson(CURATED).places || [] : [];
  const buildings = existsSync(BUILDINGS) ? readJson(BUILDINGS).buildings || [] : [];
  const byId = new Map(places.map((p) => [p.id, p]));
  const byName = new Map(places.map((p) => [norm(p.name), p]));
  const bByName = new Map(buildings.map((b) => [norm(b.name), b]));

  return mod.OUTDOOR_RESOURCES.map((r) => {
    const quiet = r.modes.includes('quiet');
    const type = quiet ? 'quiet-place' : 'place';
    let host = '';
    try { host = new URL(r.source).hostname; } catch { host = ''; }
    const rec = {
      id: rid(site.host, type, r.id),
      type,
      name: r.name,
      summary: summary(`${r.name}, ${r.city}: ${r.surface.toLowerCase()}. ${r.use}`),
      site: site.host,
      url: `${PAGE}#${r.id}`,
      data: DATA,
      source: [src(r.source, date, host.endsWith('.gov') ? 'fact' : 'listing', r.sourceLabel)],
      updated: date,
      license: 'CC0-1.0',
      tags: ['outdoors', r.arc, ...r.modes],
      layer: 'outdoors',
    };
    const p = byId.get(r.id) || byName.get(norm(r.name));
    if (p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) {
      rec.location = loc(p.latitude, p.longitude, 'address', {
        address: p.address,
        area: slug(r.city),
        method: 'coordinates of the matching elsegundo.xyz curated place',
        source: p.sources?.[0]?.url,
      });
      rec.links = [{ rel: 'same-as', id: `es:place:${p.id}` }];
    } else {
      const b = bByName.get(norm(r.name));
      if (b && b.coordSource && b.coordSource !== 'estimate') {
        const first = (b.claims || []).map((c) => c.source).find(Boolean);
        const srcUrl = (b.sources || []).find?.((s) => s.id === first)?.url;
        if (srcUrl) rec.location = loc(b.lat, b.lng, 'point', { area: slug(r.city), method: 'coordinates from the elsegundo.xyz architecture catalog', source: srcUrl });
      }
    }
    return compact(rec);
  });
}
