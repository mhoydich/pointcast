// Layer: dispensary — one dataset record pointing at the El Segundo Dispensary Atlas.
// The 485 licensed retailers stay in src/data/dispensary-atlas.json and /dispensary-atlas.json;
// they are deliberately NOT inlined, so elsegundo.xyz (which never lists cannabis) is not affected.
export const layer = {
  id: 'dispensary',
  name: 'Dispensary Atlas (reference)',
  description: 'Pointer to the research atlas of licensed cannabis retailers within 25 miles of El Segundo. The stores are not inlined.',
  types: ['dataset'],
  inline: false,
  count: 485,
  data: 'https://pointcast.xyz/dispensary-atlas.json',
  page: 'https://pointcast.xyz/dispensary-atlas',
  license: 'CC0-1.0',
  updated: '2026-10-03',
  source: { url: 'https://search.cannabis.ca.gov/retailers', checked: '2026-10-03', label: 'fact', title: 'DCC public retailer location snapshot' },
  notes: 'Cannabis material: every record in this layer carries sensitive: ["cannabis"] so sister sites and map filters can drop it. One dataset record only; the 485 licensed retailers (46 microbusinesses are excluded by the dataset) are read from /dispensary-atlas.json, not copied into the atlas.',
  sensitive: ['cannabis'],
};

const WANT = ['dcc-search-help', 'dcc-local-csv', 'dcc-map'];

export async function records(ctx) {
  const { site, helpers } = ctx;
  const { rid, src, summary } = helpers;
  const d = ctx.readJson(ctx.resolve('src/data/dispensary-atlas.json'));
  const checked = d.checkedOn;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checked || '')) throw new Error('dispensary-atlas.json checkedOn missing');
  const byId = new Map((d.sources || []).map((s) => [s.id, s]));
  const source = WANT.map((id) => byId.get(id)).filter(Boolean).map((s) => src(s.url, s.checkedOn || checked, 'fact', s.title));
  if (!source.length) throw new Error('dispensary-atlas.json lists none of the DCC registry sources');
  return [{
    id: rid(site.host, 'dataset', 'dispensary-atlas'),
    type: 'dataset',
    name: 'El Segundo Dispensary Atlas',
    summary: summary(`A research atlas of ${d.stores.length} state-licensed cannabis retailers within ${d.radiusMiles} miles of El Segundo, with method notes and coverage gaps. Informational only; adults 21+.`),
    site: site.host,
    url: 'https://pointcast.xyz/dispensary-atlas',
    data: 'https://pointcast.xyz/dispensary-atlas.json',
    source,
    updated: checked,
    license: 'CC0-1.0',
    tags: ['cannabis', 'research'],
    sensitive: ['cannabis'],
    layer: 'dispensary',
  }];
}
