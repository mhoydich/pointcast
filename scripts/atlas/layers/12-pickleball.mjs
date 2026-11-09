// Layer: pickleball. The pickleball home page. The Squeeze league desk is held back (app-only data, named people).
export const layer = {
  id: 'pickleball',
  name: 'Pickleball',
  description: 'The Pickleball Home page. The Squeeze team desk is held back until a public source exists.',
  types: ['page'],
  inline: true,
  data: 'https://pointcast.xyz/pickleball/home.json',
  page: 'https://pointcast.xyz/pickleball/home',
  license: 'CC0-1.0',
  updated: '2026-10-03',
  source: { url: 'https://pointcast.xyz/pickleball/home.json', checked: '2026-10-03', label: 'derived' },
  notes: 'The Squeeze league desk is omitted: its facts are transcribed from league-app screenshots with no public PTL page, it carries a DUPR figure, and the desk names people. It can be added as a league record once Mike approves a first-party exception in ATLAS.md §5. No rosters or player names anywhere.',
};

export async function records({ site, readJson, helpers, resolve }) {
  const { rid, src, summary, compact } = helpers;
  // The Squeeze desk (src/data/squeeze-league.json) is transcribed from league-app screenshots with no public
  // source page and names people, so it has no record until Mike approves a first-party exception (ATLAS.md §5).
  const out = [];
  out.push(compact({
    id: rid(site.host, 'page', 'pickleball-home'),
    type: 'page',
    name: 'Pickleball Home',
    summary: summary('Practice planner, learning links, court directory and paddle lab for pickleball, with sourced and dated facts and no live availability claims.'),
    site: site.host,
    url: 'https://pointcast.xyz/pickleball/home',
    data: 'https://pointcast.xyz/pickleball/home.json',
    source: [src('https://pointcast.xyz/pickleball/home.json', '2026-10-03', 'derived', 'Pickleball Home data')],
    updated: '2026-10-03',
    license: 'CC0-1.0',
    tags: ['pickleball'],
    layer: 'pickleball',
  }));
  return out;
}
