// Layer: geology. The four UES Track 08 field walks from src/lib/geology.ts as quiet places.
import { loadTs } from '../_ts.mjs';

const PAGE = 'https://pointcast.xyz/geology.json';
import { sisterLocated, locationFrom, norm } from '../_sister.mjs';

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
  notes: 'FIELD_WALKS in src/lib/geology.ts cite no per-walk public sources (CITATIONS list publishers without URLs, and the module has no as-of date), so each record is labeled derived from the geology.json twin and uses the git date of src/lib/geology.ts (2026-10-06) as checked/updated. The route /geology has no human page in src/pages, so url points at the JSON twin. A walk is located only when its place text contains the name of a located place in the committed elsegundo.xyz atlas snapshot.',
};


export async function records({ site, helpers, root }) {
  const { rid, src, summary, compact } = helpers;
  const mod = await loadTs('src/lib/geology.ts');
  const date = layer.updated;
  // located elsegundo.xyz places from the committed snapshot, longest names first so "El Segundo Beach" wins
  const sorted = sisterLocated(root, ['place', 'quiet-place']).filter((p) => p.layer === 'places' || p.layer === 'here');

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
      rec.location = locationFrom(p, { area: 'el-segundo' });
      rec.links = [{ rel: 'same-as', id: p.id }];
    }
    return compact(rec);
  });
}
