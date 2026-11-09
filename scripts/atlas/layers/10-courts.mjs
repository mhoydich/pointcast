// Layer: courts. Public pickleball courts from the PointCast court schedule, placed only when the
// elsegundo.xyz venue register (which cites each venue page) has a matching address.
export const layer = {
  id: 'courts',
  name: 'Courts',
  description: 'South Bay public pickleball courts from the PointCast Air desk: where they are, what they cost, how to get on.',
  types: ['court'],
  inline: true,
  data: 'https://pointcast.xyz/air.json',
  page: 'https://pointcast.xyz/air',
  license: 'CC0-1.0',
  updated: '2026-10-18',
  source: { url: 'https://www.manhattanbeach.gov/departments/parks-and-recreation/tennis', checked: '2026-10-18', label: 'fact' },
  notes: 'Facts and dates come from src/data/courts-schedule.json; each fact cites a public page. Facts credited only to the desk (not a public page) are left out. Coordinates exist only where the elsegundo.xyz pickleball venue register matches by address; other courts carry no location.',
};

// court id -> venue id in elsegundo.xyz public/pickleball/static.json (matched by street address)
const VENUE = {
  courts: 'mb-middle-school',
  'el-segundo': 'es-recreation-park',
  'manhattan-heights': 'mb-manhattan-heights',
  'alta-vista': 'rb-alta-vista',
  ainsworth: 'haw-betty-ainsworth',
  kelly: 'hb-kelly-courts',
};
import { sisterById, locationFrom, norm as sisterNorm } from '../_sister.mjs';

const normAddr = (a) => String(a || '').toLowerCase().replace(/\bavenue\b/g, 'ave').replace(/[^a-z0-9]+/g, ' ').trim();

export async function records({ site, readJson, helpers, resolve, root }) {
  const { rid, slug, src, summary, compact } = helpers;
  const sched = readJson(resolve('src/data/courts-schedule.json'));

  return sched.courts.map((court) => {
    const facts = (court.facts || []).filter((f) => sched.sources[f.src]?.url);
    const sources = new Map();
    for (const f of facts) {
      const s = sched.sources[f.src];
      const label = /\.gov\b|\.org\b|revize/.test(s.url) && !/rec\.us/.test(s.url) ? 'fact' : 'listing';
      const prev = sources.get(s.url);
      if (!prev || f.checked > prev.checked) sources.set(s.url, src(s.url, f.checked, label, s.label));
    }
    const updated = facts.map((f) => f.checked).sort().pop();
    const text = facts.map((f) => f.text).filter((t) => !/\d{3}[\s.-]\d{3}[\s.-]\d{4}/.test(t));
    const city = court.city;
    const body = text.slice(1).join('; ');
    const rec = {
      id: rid(site.host, 'court', court.id),
      type: 'court',
      name: court.name,
      summary: summary(`${city} public pickleball. ${body}`),
      site: site.host,
      url: `https://pointcast.xyz/air#${court.id}`,
      data: 'https://pointcast.xyz/air.json',
      source: [...sources.values()],
      updated,
      license: 'CC0-1.0',
      tags: ['pickleball', slug(court.shape), slug(city)].filter(Boolean),
      layer: 'courts',
    };
    // Coordinates come from the committed elsegundo.xyz atlas snapshot (its pickleball venue layer),
    // never from another repo's working tree, and keep that record's precision and source.
    const v = VENUE[court.id] ? sisterById(root, `es:court:${VENUE[court.id]}`) : null;
    const vAddr = v && v.location ? normAddr(v.location.address).split(' ').slice(0, 3).join(' ') : '';
    if (v && v.location && vAddr && vAddr === normAddr(facts[0]?.text).split(' ').slice(0, 3).join(' ')) {
      rec.location = locationFrom(v, { area: slug(city) });
      rec.links = [{ rel: 'same-as', id: v.id }];
    }
    return compact(rec);
  });
}
