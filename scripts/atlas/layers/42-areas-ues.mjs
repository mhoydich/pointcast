// Layer: areas-ues — South Bay towns (areas), the planned radio network, UES classes and the
// local-area program pages. All of it is PointCast's own planning data.
import { loadTs } from '../_ts.mjs';

export const layer = {
  id: 'areas-ues',
  name: 'Areas, radio plan and UES',
  description: 'The 19 South Bay towns PointCast plans around, the seven planned radio stations, University of El Segundo classes, and the local-area program pages.',
  types: ['area', 'page'],
  inline: true,
  data: 'https://pointcast.xyz/agents.json',
  page: 'https://pointcast.xyz/beacon',
  license: 'CC0-1.0',
  updated: '2026-10-20',
  source: { url: 'https://pointcast.xyz/agents.json', checked: '2026-10-06', label: 'derived', title: 'PointCast agents manifest' },
  notes: 'Area records carry no coordinates: the beacon list in src/lib/neighborhoods.ts states only a rounded distance and a compass bearing, which would put different towns on the same point, so they list and filter by area until a sourced representative point (Census place or GNIS) is added (NEXT-20-LAYERS layer 17). The neighborhoods file carries no as-of date, so 2026-10-06 is its last commit date. UES and local-area pages use the same commit date (2026-10-06) because those files carry no as-of field. Radio stations are a plan: nothing is on air. UES-104 and UES-207 mention cannabis education and carry sensitive: ["cannabis"].',
};

const R_MILES = 3958.7613;
const BEARINGS = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** Great-circle destination point from (lat, lon) after `miles` along initial bearing `brg` degrees. */
export function destination(lat, lon, miles, brg) {
  const d = miles / R_MILES;
  const t = rad(brg);
  const p1 = rad(lat);
  const l1 = rad(lon);
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(t));
  const l2 = l1 + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return { lat: deg(p2), lon: ((deg(l2) + 540) % 360) - 180 };
}

const AGENTS = 'https://pointcast.xyz/agents.json';
const SRC_DATE = '2026-10-06';
const CLASSES_JSON = 'https://pointcast.xyz/ues/classes.json';

export async function records(ctx) {
  const { site, helpers } = ctx;
  const { rid, slug, src, loc, summary } = helpers;
  const out = [];

  // (a) Areas
  const nb = await loadTs('src/lib/neighborhoods.ts');
  const C = nb.BEACON_CENTER;
  const areaIds = new Map();
  for (const n of nb.NEIGHBORHOODS) {
    const s = slug(n.name);
    const brg = BEARINGS[n.bearing];
    let p;
    if (n.distance !== 0 && brg == null) continue;
    const id = rid(site.host, 'area', s);
    areaIds.set(s, id);
    out.push({
      id,
      type: 'area',
      name: n.name,
      summary: summary(n.distance === 0
        ? `El Segundo, the PointCast home town and the center of its 25-mile beacon radius. Status in the growth plan: ${n.status}.`
        : `South Bay area about ${n.distance} miles ${n.bearing} of the PointCast beacon in El Segundo. Status in the 25-mile growth plan: ${n.status}.`),
      site: site.host,
      url: 'https://pointcast.xyz/beacon',
      data: 'https://pointcast.xyz/beacon.json',
      source: [src(AGENTS, SRC_DATE, 'derived', 'PointCast agents manifest (beacon radius)')],
      updated: SRC_DATE,
      license: 'CC0-1.0',
      tags: ['south-bay', n.status],
      layer: 'areas-ues',
    });
  }

  // (b) Radio network plan
  const rn = await loadTs('src/data/radio-network.ts');
  for (const st of rn.STATIONS) {
    const links = [];
    for (const part of String(st.town).split(/\s+and\s+/)) {
      const aid = areaIds.get(slug(part));
      if (aid) links.push({ rel: 'in', id: aid });
    }
    out.push({
      id: rid(site.host, 'page', `radio-${st.slug}`),
      type: 'page',
      name: st.name,
      summary: summary(`Planned ${st.role === 'flagship' ? 'flagship' : 'sister'} station for ${st.town} (${st.zip}), phase ${st.phase}. A plan only: nothing is on air and no frequency is held.`),
      site: site.host,
      url: `https://pointcast.xyz/radio-network/${st.slug}`,
      data: `https://pointcast.xyz/radio-network/${st.slug}.json`,
      source: [src('https://pointcast.xyz/radio-network.json', rn.RADIO_PUBLISHED, 'derived', 'PointCast Radio Network plan')],
      updated: rn.RADIO_PUBLISHED,
      status: 'planned',
      license: 'CC0-1.0',
      links,
      tags: ['radio', 'planned'],
      layer: 'areas-ues',
    });
  }

  // (c) UES
  const ues = await loadTs('src/lib/ues-classes.ts');
  const prog = await loadTs('src/lib/ues-program.ts');
  const cannabisCourse = (c) => /cannabis/i.test(`${c.slug} ${c.title} ${c.boundary || ''}`);
  for (const c of ues.UES_SEASON_ONE_COURSES) {
    out.push({
      id: rid(site.host, 'page', c.slug),
      type: 'page',
      name: `${c.code} ${c.title}`,
      summary: summary(`Online Season 1 UES class, self-paced and free: ${c.outcome}`),
      site: site.host,
      url: `https://pointcast.xyz${c.path}`,
      data: `https://pointcast.xyz${c.jsonPath}`,
      source: [src(CLASSES_JSON, SRC_DATE, 'derived', 'UES classes')],
      updated: SRC_DATE,
      status: 'live',
      license: 'CC0-1.0',
      sensitive: cannabisCourse(c) ? ['cannabis'] : undefined,
      tags: ['ues', 'class', 'season-1'],
      layer: 'areas-ues',
    });
  }
  for (const c of prog.UES_COURSES) {
    out.push({
      id: rid(site.host, 'page', c.slug),
      type: 'page',
      name: `${c.code} ${c.title}`,
      summary: summary(`Season 0 launch studio in the University of El Segundo program: ${c.publicOutcome}`),
      site: site.host,
      url: 'https://pointcast.xyz/ues#launch-studios',
      data: CLASSES_JSON,
      source: [src(CLASSES_JSON, SRC_DATE, 'derived', 'UES classes')],
      updated: SRC_DATE,
      status: 'planned',
      license: 'CC0-1.0',
      sensitive: cannabisCourse(c) ? ['cannabis'] : undefined,
      tags: ['ues', 'class', 'season-0'],
      layer: 'areas-ues',
    });
  }
  out.push({
    id: rid(site.host, 'page', 'ues-cartography-course'),
    type: 'page',
    name: 'Cartography: Read the World, Make a Map',
    summary: summary('An independent short course on reading maps and making one: six lessons plus a capstone, with dated sources and stated claim boundaries. Noncredit and self-paced.'),
    site: site.host,
    url: 'https://pointcast.xyz/ues/cartography-course',
    source: [
      src('https://datatracker.ietf.org/doc/html/rfc7946', '2026-10-05', 'fact', 'GeoJSON (RFC 7946)'),
      src('https://www.usgs.gov/educational-resources/topographic-mapping', '2026-10-05', 'fact', 'USGS topographic mapping'),
      src('https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html', '2026-10-05', 'fact', 'Census TIGER/Line'),
      src('https://www.openstreetmap.org/copyright', '2026-10-05', 'fact', 'OpenStreetMap copyright'),
    ],
    updated: '2026-10-05',
    status: 'live',
    license: 'CC0-1.0',
    tags: ['ues', 'class', 'cartography'],
    layer: 'areas-ues',
  });

  // (d) Local areas
  const la = await loadTs('src/lib/localAreas.ts');
  for (const a of la.LOCAL_AREAS) {
    out.push({
      id: rid(site.host, 'page', `local-${a.slug}`),
      type: 'page',
      name: a.name,
      summary: summary(`${a.kicker}: a PointCast local program page, status ${a.status}, built around the 25-mile radius.`),
      site: site.host,
      url: `https://pointcast.xyz${a.path}`,
      source: [src(AGENTS, SRC_DATE, 'derived', 'PointCast agents manifest')],
      updated: SRC_DATE,
      status: a.status === 'forming' || a.status === 'seed' ? 'planned' : 'live',
      license: 'CC0-1.0',
      tags: ['local', 'program', a.status],
      layer: 'areas-ues',
    });
  }
  return out;
}
