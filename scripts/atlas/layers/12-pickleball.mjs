// Layer: pickleball. The Squeeze league desk and the pickleball home page. No rosters, no player names.
export const layer = {
  id: 'pickleball',
  name: 'Pickleball',
  description: 'The Squeeze PTL team desk and the Pickleball Home page, as a league and page records.',
  types: ['league', 'page'],
  inline: true,
  data: 'https://pointcast.xyz/pickleball/the-squeeze.json',
  page: 'https://pointcast.xyz/pickleball/the-squeeze/',
  license: 'CC0-1.0',
  updated: '2026-10-06',
  source: { url: 'https://pointcast.xyz/pickleball/the-squeeze.json', checked: '2026-10-06', label: 'derived' },
  notes: 'The league desk is transcribed from app screenshots and has no public PTL page, so its source is the desk JSON itself (derived). Roster and player names are deliberately not published. The paddle exchange page has no dated data and is left out.',
};

export async function records({ site, readJson, helpers, resolve }) {
  const { rid, src, summary, compact } = helpers;
  const sq = readJson(resolve('src/data/squeeze-league.json'));
  const out = [];
  const court = rid(site.host, 'court', 'el-segundo');
  out.push(compact({
    id: rid(site.host, 'league', sq.id),
    type: 'league',
    name: sq.title,
    summary: summary(`Rec-park team desk for a ${sq.league.name} ${sq.league.division} team, ${sq.league.season}: standings, results and schedule, transcribed from league app screenshots.`),
    site: site.host,
    url: sq.url,
    data: sq.json,
    source: [src(sq.json, sq.transcribedAbout, 'derived', 'The Squeeze desk data')],
    updated: sq.transcribedAbout,
    license: 'CC0-1.0',
    tags: ['pickleball', 'ptl', 'mixed-4.0'],
    links: [{ rel: 'plays-at', id: court }],
    layer: 'pickleball',
  }));
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
