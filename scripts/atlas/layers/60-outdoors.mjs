// Layer: outdoors. The OPEN/25 field guide (src/lib/radius25-outdoors.ts): public outdoor places inside the
// 25-mile radius, each tied to the official page it names. Placed only where the elsegundo.xyz curated
// places register (or its architecture catalog) already holds a sourced coordinate for the same place.
import { loadTs } from '../_ts.mjs';

const PAGE = 'https://pointcast.xyz/beach-commons/v18/outdoors';
const DATA = 'https://pointcast.xyz/beach-commons/v18/outdoors.json';
import { sisterById, sisterByName, locationFrom } from '../_sister.mjs';

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


export async function records({ site, helpers, root }) {
  const { rid, slug, src, summary, compact } = helpers;
  const mod = await loadTs('src/lib/radius25-outdoors.ts');
  const date = String(mod.OPEN_AIR_COMMONS.updatedAt).slice(0, 10);

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
    // Place it only where the committed elsegundo.xyz atlas snapshot already holds a sourced coordinate for
    // the same place (curated places, Here cards or architecture landmarks that are not estimates).
    const p = sisterById(root, `es:place:${r.id}`) || sisterByName(root, ['place', 'quiet-place'], r.name);
    if (p && p.location && p.location.precision !== 'neighborhood') {
      rec.location = locationFrom(p, { area: slug(r.city) });
      rec.links = [{ rel: 'same-as', id: p.id }];
    }
    return compact(rec);
  });
}
