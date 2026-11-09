// Layer: geology. The four UES Track 08 field walks from src/lib/geology.ts as quiet places.
import { loadTs } from '../_ts.mjs';

const PAGE = 'https://pointcast.xyz/geology.json';
const CURATED = '/home/user/hello-token-reserve/content/places/curated.json';

export const layer = {
  id: 'geology',
  name: 'Geology field walks',
  description: 'Four slow field walks from the University of El Segundo geology track: where to stand and what to read in the ground.',
  types: ['quiet-place'],
  inline: true,
  data: PAGE,
  page: PAGE,
  license: 'CC0-1.0',
  updated: '2026-10-06',
  source: { url: PAGE, checked: '2026-10-06', label: 'derived' },
  notes: 'FIELD_WALKS in src/lib/geology.ts cite no per-walk public sources (CITATIONS list publishers without URLs, and the module has no as-of date), so each record is labeled derived from the geology.json twin and uses the git date of src/lib/geology.ts (2026-10-06) as checked/updated. The route /geology has no human page in src/pages, so url points at the JSON twin. A walk is located only when its place text contains the name of an elsegundo.xyz curated place with coordinates.',
};

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export async function records({ site, readJson, helpers }) {
  const { rid, slug, src, loc, summary, compact } = helpers;
  const { existsSync } = await import('node:fs');
  const mod = await loadTs('src/lib/geology.ts');
  const date = layer.updated;
  const places = existsSync(CURATED) ? (readJson(CURATED).places || []).filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) : [];
  // longest names first so "El Segundo Beach" wins over shorter names
  const sorted = [...places].sort((a, b) => b.name.length - a.name.length);

  return mod.FIELD_WALKS.map((w) => {
    const first = String(w.read).split(/(?<=[.!?])\s/)[0];
    const rec = {
      id: rid(site.host, 'quiet-place', `walk-${w.slug}`),
      type: 'quiet-place',
      name: w.title,
      summary: summary(`A field walk at ${w.place}: ${first}`),
      site: site.host,
      url: `${PAGE}#${w.slug}`,
      data: PAGE,
      source: [src(PAGE, date, 'derived', 'PointCast geology.json (UES Track 08)')],
      updated: date,
      license: 'CC0-1.0',
      tags: ['geology', 'walk', 'quiet'],
      layer: 'geology',
    };
    const hay = ` ${norm(w.place)} `;
    const p = sorted.find((x) => hay.includes(` ${norm(x.name)} `));
    if (p) {
      rec.location = loc(p.latitude, p.longitude, 'address', {
        address: p.address,
        area: 'el-segundo',
        method: 'coordinates of the matching elsegundo.xyz curated place',
        source: p.sources?.[0]?.url,
      });
      rec.links = [{ rel: 'same-as', id: `es:place:${p.id}` }];
    }
    return compact(rec);
  });
}
