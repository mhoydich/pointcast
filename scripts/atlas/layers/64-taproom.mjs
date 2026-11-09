// Layer: taprooms. Breweries on the PointCast Taproom carry list (src/data/taproom.json).
export const layer = {
  id: 'taprooms',
  name: 'Taprooms',
  description: 'Southern California breweries on the PointCast Taproom carry list, each linked to its own website.',
  types: ['business'],
  inline: true,
  data: 'https://pointcast.xyz/taproom.json',
  page: 'https://pointcast.xyz/taproom',
  license: 'CC0-1.0',
  updated: '2026-04-24',
  source: { url: 'https://pointcast.xyz/taproom.json', checked: '2026-04-24', label: 'derived' },
  notes: 'Names, neighborhoods and founding years come from src/data/taproom.json (_lastReviewed 2026-04-24). Each record cites the brewery\'s own website. Vibe copy and beer lists stay on the page. Coordinates come from the OpenStreetMap-derived elsegundo.xyz business directory only when exactly one row matches the brewery name exactly; those records carry ODbL attribution for the position.',
};

const DIRECTORY = '/home/user/hello-token-reserve/public/businesses/directory-lite.json';
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export async function records({ site, readJson, helpers, resolve }) {
  const { rid, slug, src, loc, summary, compact } = helpers;
  const { existsSync } = await import('node:fs');
  const data = readJson(resolve('src/data/taproom.json'));
  const date = data._lastReviewed;
  const rows = existsSync(DIRECTORY) ? readJson(DIRECTORY).rows || [] : [];
  const byName = new Map();
  for (const row of rows) { const k = norm(row[1]); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(row); }

  return data.breweries.map((b) => {
    const rec = {
      id: rid(site.host, 'business', b.id),
      type: 'business',
      name: b.name,
      summary: summary(`${b.name}, a brewery in ${b.neighborhood}, founded ${b.founded}.`),
      site: site.host,
      url: `https://pointcast.xyz/taproom#${b.id}`,
      data: 'https://pointcast.xyz/taproom.json',
      source: [src(b.url, date, 'listing', `${b.name} website`)],
      updated: date,
      license: 'CC0-1.0',
      tags: ['brewery', slug(b.neighborhood)].filter(Boolean),
      layer: 'taprooms',
    };
    const hits = byName.get(norm(b.name)) || [];
    if (hits.length === 1) {
      const row = hits[0];
      rec.location = loc(row[6], row[7], 'point', {
        address: row[4],
        area: slug(row[5]),
        method: 'OpenStreetMap position of the matching business record',
        source: 'https://www.openstreetmap.org/' + String(row[0]).replace('osm-', '').replace('-', '/'),
        license: 'ODbL-1.0',
      });
      if (rec.location) rec.attribution = '© OpenStreetMap contributors';
    }
    return compact(rec);
  });
}
