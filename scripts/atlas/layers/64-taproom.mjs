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
  notes: 'Names, neighborhoods and founding years come from src/data/taproom.json (_lastReviewed 2026-04-24). Each record cites the brewery\'s own website. Vibe copy and beer lists stay on the page. Coordinates come from the committed elsegundo.xyz atlas snapshot only when exactly one located business there has the same name; the position keeps that record\'s precision, source and license.',
};

import { sisterByName, locationFrom } from '../_sister.mjs';

export async function records({ site, readJson, helpers, resolve, root }) {
  const { rid, slug, src, summary, compact } = helpers;
  const data = readJson(resolve('src/data/taproom.json'));
  const date = data._lastReviewed;

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
    // Placed only when the committed elsegundo.xyz atlas snapshot has exactly one located business of the same name
    // (its breweries guide or hand-checked directory); the coordinate keeps that record's precision, source and license.
    const m = sisterByName(root, 'business', b.name);
    if (m) {
      rec.location = locationFrom(m, { area: slug(b.neighborhood) });
      if (rec.location && rec.location.license === 'ODbL-1.0') rec.attribution = '© OpenStreetMap contributors';
      rec.links = [{ rel: 'same-as', id: m.id }];
    }
    return compact(rec);
  });
}
