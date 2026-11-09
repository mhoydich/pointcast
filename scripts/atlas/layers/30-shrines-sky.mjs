// Layer: quiet. PointCast's Small Shrines (quiet places on the web), the NOAA stations behind the
// weather atlas and the Tide shrine, and the sun / moon / sea / air guide feeds.
import { loadTs } from '../_ts.mjs';

export const layer = {
  id: 'quiet',
  name: 'Quiet places, weather stations and sky feeds',
  description: 'Small Shrines (five one-minute pauses), the NOAA stations the weather atlas and the Tide shrine read, and the sun, moon, Pacific and air guide feeds.',
  types: ['shrine', 'place', 'feed'],
  inline: true,
  data: 'https://pointcast.xyz/small-shrines.json',
  page: 'https://pointcast.xyz/small-shrines/',
  license: 'CC0-1.0',
  updated: '2026-11-08',
  source: { url: 'https://pointcast.xyz/images/small-shrines/provenance.json', title: 'Small Shrines provenance', checked: '2026-11-08', label: 'fact' },
  notes: 'Shrines come from src/data/small-shrines.ts and are dated by public/images/small-shrines/provenance.json. Stations come from src/data/weather-atlas.json (NOAA coordinates as published there, dated 2026-10-02); the Santa Monica tide station 9410840 takes its coordinates from public/pacific.json (reviewed 2026-10-06). Feeds are dated by their own reviewed field. Shrine-crawl, Elemental Shrine, Shrine of the Open Road, Ten Doors and Sitting with Gandalf are not emitted: none carries a dated, citable provenance. The morning-*.json manifests and the Desk house agents are not feeds of an upstream provider and are left out.',
};

const TIDE_ID = '9410840';
const PROV_CREATED = '2026-10-20'; // provenance.json "created" for the project

export async function records({ site, readJson, helpers, resolve }) {
  const { rid, src, loc, summary, compact } = helpers;
  const out = [];

  // --- Tide station (coordinates from public/pacific.json, which cites NOAA CO-OPS) ---
  const pacific = readJson(resolve('public/pacific.json'));
  const tideRef = (pacific.data_sources || []).find((d) => String(d.name).includes(TIDE_ID));
  const tideSrc = (id) => (pacific.sources || []).find((s) => s.id === id);
  const s03 = tideSrc('S03');
  const s04 = tideSrc('S04');
  const pacChecked = pacific.reviewed;
  const tidePlaceId = rid(site.host, 'place', `noaa-${TIDE_ID}`);
  const m = tideRef && String(tideRef.location).match(/(-?\d+\.\d+),\s*[−-](\d+\.\d+)/);
  if (m && s03 && s04 && pacChecked) {
    out.push(compact({
      id: tidePlaceId,
      type: 'place',
      name: 'NOAA CO-OPS Santa Monica tide station 9410840',
      summary: summary('NOAA tide and water-level station at Santa Monica. The Tide shrine and the Pacific guide read its predictions and observed water level for the El Segundo coast, about 7.5 miles away in a straight line.'),
      site: site.host,
      url: 'https://pointcast.xyz/pacific/',
      data: 'https://pointcast.xyz/pacific.json',
      location: loc(m[1], -Number(m[2]), 'point', {
        area: 'santa-monica',
        method: 'station coordinates as published in the PointCast Pacific guide data_sources',
        source: s03.url,
        license: 'public-domain-us-government',
      }),
      source: [src(s03.url, pacChecked, 'fact', s03.label), src(s04.url, pacChecked, 'fact', s04.label)],
      updated: pacChecked,
      license: 'public-domain-us-government',
      attribution: 'NOAA CO-OPS',
      tags: ['tide', 'station', 'weather'],
      layer: layer.id,
    }));
  }
  const haveTide = out.length > 0;

  // --- Small Shrines ---
  const { SHRINES } = await loadTs('src/data/small-shrines.ts');
  const prov = readJson(resolve('public/images/small-shrines/provenance.json'));
  const assets = new Map((prov.assets || []).map((a) => [a.name, a]));
  for (const sh of SHRINES) {
    const asset = assets.get(sh.id);
    const date = (asset && asset.created) || prov.created || PROV_CREATED;
    const sources = [src('https://pointcast.xyz/images/small-shrines/provenance.json', date, 'fact', 'Small Shrines provenance')];
    if (/^https:\/\//.test(sh.sourceUrl)) sources.push(src(sh.sourceUrl, date, 'listing', 'Artwork source'));
    const links = sh.id === 'tide' && haveTide ? [{ rel: 'about', id: tidePlaceId, note: 'reads NOAA predicted tides for this station' }] : [];
    out.push(compact({
      id: rid(site.host, 'shrine', sh.id),
      type: 'shrine',
      name: `${sh.title} shrine`,
      summary: summary(`${sh.kicker}. ${sh.invitation} A one-minute secular pause with artwork and optional synthesized sound.`),
      site: site.host,
      url: `https://pointcast.xyz/small-shrines/#${sh.id}`,
      data: 'https://pointcast.xyz/small-shrines.json',
      source: sources,
      updated: date,
      links,
      license: 'CC0-1.0',
      tags: ['quiet', 'meditation', sh.audioMode],
      layer: layer.id,
    }));
  }

  // --- Weather stations ---
  const wa = readJson(resolve('src/data/weather-atlas.json'));
  const homr = (wa.sources || []).find((s) => s.id === 'homr');
  for (const st of wa.stations || []) {
    const sources = [src(st.url, wa.date, 'fact', `NOAA monthly normals ${st.id}`)];
    if (homr) sources.push(src(homr.url, wa.date, 'fact', homr.title));
    out.push(compact({
      id: rid(site.host, 'place', `noaa-${st.id.toLowerCase()}`),
      type: 'place',
      name: st.name,
      summary: summary(`NOAA climate-normals station ${st.id} used by the weather atlas, ${st.distanceMiles} miles from the El Segundo reference point, elevation ${st.elevation} m.`),
      site: site.host,
      url: `https://pointcast.xyz/weather-atlas/#${st.id}`,
      data: 'https://pointcast.xyz/weather-atlas.json',
      location: loc(st.lat, st.lon, 'point', {
        method: 'NOAA station coordinates as published in the weather atlas',
        source: st.url,
        license: 'public-domain-us-government',
      }),
      source: sources,
      updated: wa.date,
      license: 'public-domain-us-government',
      attribution: 'NOAA NCEI',
      tags: ['weather', 'station'],
      layer: layer.id,
    }));
  }

  // --- Feeds: sun, moon, pacific, air ---
  const feeds = [
    { f: 'sun', up: ['api_usno', 'kp'] },
    { f: 'moon', up: ['api_usno'] },
    { f: 'pacific', up: ['S04', 'S05'] },
    { f: 'air', up: ['S24', 'S40'] },
  ];
  for (const { f, up } of feeds) {
    const j = readJson(resolve(`public/${f}.json`));
    const sources = up.map((id) => (j.sources || []).find((s) => s.id === id)).filter(Boolean)
      .map((s) => src(s.url, j.reviewed, 'fact', s.label));
    if (!sources.length || !j.reviewed) continue;
    out.push(compact({
      id: rid(site.host, 'feed', f),
      type: 'feed',
      name: `${j.title} guide feed`,
      summary: summary(j.description),
      site: site.host,
      url: j.canonical,
      data: `https://pointcast.xyz/${f}.json`,
      source: sources,
      updated: j.reviewed,
      links: f === 'pacific' && haveTide ? [{ rel: 'about', id: tidePlaceId }] : [],
      license: 'CC0-1.0',
      tags: ['feed', 'sky', f],
      layer: layer.id,
    }));
  }
  return out;
}
