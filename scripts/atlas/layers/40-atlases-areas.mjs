// Layer: atlases — published atlases that are datasets in their own right (weather, blocks,
// Home Cartography demo) plus the manufacturing atlas, one business record per organization.
// The dispensary atlas is in its own layer (41-dispensary.mjs) because it is cannabis material.
import { loadTs } from '../_ts.mjs';

export const layer = {
  id: 'atlases',
  name: 'Atlases and manufacturers',
  description: 'PointCast research atlases as dataset records, and the 23 South Bay manufacturers from the manufacturing atlas.',
  types: ['dataset', 'business', 'place'],
  inline: true,
  data: 'https://pointcast.xyz/manufacturing.json',
  page: 'https://pointcast.xyz/manufacturing',
  license: 'CC0-1.0',
  updated: '2026-10-06',
  source: { url: 'https://pointcast.xyz/manufacturing.json', checked: '2026-10-02', label: 'derived', title: 'Manufacturing atlas' },
  notes: 'Manufacturing records come from src/data/manufacturing-atlas.json (checkedDate 2026-10-02). That dataset intentionally has null coordinates, so these businesses carry no location; each cites the organization\'s own public pages, which show advertised capability, not audited capacity. The blocks atlas is derived from the blocks feed (generatedAt 2026-07-19). The Home Cartography demo is fictional; its check date 2026-10-06 is the last commit date of its feed file, as the data carries no as-of field. No store-level cannabis data is here.',
};

const isHttps = (u) => typeof u === 'string' && /^https:\/\//.test(u);
const date = (s) => String(s || '').slice(0, 10);
const okDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function records(ctx) {
  const { site, helpers } = ctx;
  const { rid, slug, src, summary } = helpers;
  const out = [];

  // (b) Manufacturing atlas
  const m = ctx.readJson(ctx.resolve('src/data/manufacturing-atlas.json'));
  for (const c of m.companies) {
    const urls = [];
    for (const s of c.sources || []) if (isHttps(s.url) && !urls.some((u) => u.url === s.url)) urls.push({ url: s.url, checked: date(s.checkedDate || m.checkedDate) });
    if (!urls.length || urls.some((u) => !okDate(u.checked))) continue;
    const id = String(c.id).toLowerCase();
    const caps = (c.capabilities || []).map(String);
    const tags = ['manufacturing', ...caps.map(slug), slug(c.city)].filter(Boolean);
    out.push({
      id: rid(site.host, 'business', id),
      type: 'business',
      name: c.name,
      summary: summary(`${c.kind} in ${c.city}, California. Advertised capabilities: ${caps.join(', ')}. Public-source listing only; not audited and not a partnership.`),
      site: site.host,
      url: `https://pointcast.xyz/manufacturing/#${id}`,
      data: 'https://pointcast.xyz/manufacturing.json',
      source: urls.map((u) => src(u.url, u.checked, 'listing')),
      updated: urls.map((u) => u.checked).sort().at(-1),
      license: 'CC0-1.0',
      tags: [...new Set(tags)],
      layer: 'atlases',
    });
  }

  // (c) Weather atlas
  const w = ctx.readJson(ctx.resolve('src/data/weather-atlas.json'));
  if (okDate(w.date)) {
    const first = (w.sources || []).filter((s) => isHttps(s.url)).slice(0, 4).map((s) => src(s.url, w.date, 'fact', s.title));
    out.push({
      id: rid(site.host, 'dataset', 'weather-atlas'),
      type: 'dataset',
      name: 'Weather Atlas: a year within reach',
      summary: summary('Historical NOAA climate normals (1991 to 2020) and illustrative seasonal living notes for the 25-mile radius around El Segundo. Not a forecast; neighborhood shapes are schematic.'),
      site: site.host,
      url: 'https://pointcast.xyz/weather-atlas/',
      data: 'https://pointcast.xyz/weather-atlas.json',
      source: [src('https://pointcast.xyz/weather-atlas.json', w.date, 'derived', 'Weather Atlas'), ...first],
      updated: w.date,
      license: 'CC0-1.0',
      tags: ['weather', 'climate', 'noaa', 'research'],
      layer: 'atlases',
    });
  }

  // (c) Blocks semantic atlas
  const b = ctx.readJson(ctx.resolve('public/atlas/blocks-atlas.json'));
  const bd = date(b.generatedAt);
  if (okDate(bd)) {
    out.push({
      id: rid(site.host, 'dataset', 'blocks-atlas'),
      type: 'dataset',
      name: 'Blocks semantic atlas',
      summary: summary(`A 2D map of ${b.pointCount} PointCast blocks laid out by meaning, so similar posts sit near each other. A reading aid, not a geographic map; coordinates are not places.`),
      site: site.host,
      url: 'https://pointcast.xyz/atlas',
      data: 'https://pointcast.xyz/atlas/blocks-atlas.json',
      source: [src('https://pointcast.xyz/blocks.json', bd, 'derived', 'PointCast blocks feed')],
      updated: bd,
      license: 'CC0-1.0',
      tags: ['blocks', 'semantic-map', 'research'],
      layer: 'atlases',
    });
  }

  // (c) Home Cartography demo (fictional)
  out.push({
    id: rid(site.host, 'dataset', 'home-cartography-demo'),
    type: 'dataset',
    name: 'Home Cartography demo household',
    summary: summary('A fictional demo household index showing how a home inventory map could work: rooms, items, receipts, lend and sell flows. Every item and person is invented; no real inventory is collected.'),
    site: site.host,
    url: 'https://pointcast.xyz/cartography/home',
    data: 'https://pointcast.xyz/cartography/home/demo.json',
    source: [src('https://pointcast.xyz/cartography/home/demo.json', '2026-10-06', 'derived', 'Home Cartography demo')],
    updated: '2026-10-06',
    license: 'CC0-1.0',
    tags: ['fiction', 'demo', 'home'],
    layer: 'atlases',
  });
  return out;
}
