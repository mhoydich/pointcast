// Layer: market-lenses. The area lenses of the PointCast 25-mile real-estate study. Editorial study
// anchors, not boundaries, listings or valuations.
const PAGE = 'https://pointcast.xyz/real-estate';
const mod = await import('../../../src/lib/real-estate-local.mjs');

export const layer = {
  id: 'market-lenses',
  name: 'Real-estate market lenses',
  description: 'The place lenses of the PointCast 25-mile real-estate study: one anchor per city or district, with the public planning sources behind it.',
  types: ['area'],
  inline: true,
  data: 'https://pointcast.xyz/real-estate.json',
  page: PAGE,
  license: 'CC0-1.0',
  updated: mod.CHECKED_DATE,
  source: { url: mod.localSources.find((s) => s.id === 'census-geocoder').url, checked: mod.CHECKED_DATE, label: 'fact' },
  notes: 'From localMarkets in src/lib/real-estate-local.mjs (checked 2026-10-03). Only the Main Street lens carries a coordinate (Census-geocoded City Hall point); the other anchors are editorial and unsourced, so they are listed without a location. Each lens point in the study is an approximate editorial study anchor: the module states that no neighborhood, city, parcel or listing boundary is implied, so location precision is city. The module gives no coordinate source for most anchors; the source on each location is the lens\'s first cited public source, and only the El Segundo Main Street anchor is the Census-geocoded City Hall point. Not a legal boundary.',
};

const isGov = (u) => { try { return /\.gov$/.test(new URL(u).hostname); } catch { return false; } };

export async function records({ site, helpers }) {
  const { rid, slug, src, loc, summary, compact } = helpers;
  const { localMarkets, localSources, CHECKED_DATE } = mod;
  const byId = new Map(localSources.map((s) => [s.id, s]));
  return localMarkets.map((m) => {
    const sources = (m.sourceIds || []).map((id) => byId.get(id)).filter((s) => s && /^https:\/\//.test(s.url));
    const srcs = sources.map((s) => src(s.url, s.checkedDate || CHECKED_DATE, isGov(s.url) ? 'fact' : 'listing', s.title));
    // Only the Main Street anchor has a recorded coordinate source (the Census geocoder); the other
    // anchors are editorial and unsourced, so per ATLAS.md §3 they are listed without a location.
    const pointSrc = m.id === 'el-segundo-main' ? byId.get('census-geocoder') : null;
    const rec = {
      id: rid(site.host, 'area', `lens-${slug(m.id)}`),
      type: 'area',
      name: m.name,
      summary: summary(`A market lens of the 25-mile real-estate study (${m.propertyTypes.join(', ').toLowerCase()}), about ${m.distanceMiles} miles from the study center. An editorial anchor, not a legal boundary.`),
      site: site.host,
      url: `${PAGE}#${m.id}`,
      data: 'https://pointcast.xyz/real-estate.json',
      source: srcs,
      updated: CHECKED_DATE,
      license: 'CC0-1.0',
      tags: ['real-estate', 'lens'],
      layer: 'market-lenses',
    };
    if (pointSrc) rec.location = loc(m.lat, m.lon, 'city', { area: slug(m.name.split(/\s[·\/]/)[0]), method: m.id === 'el-segundo-main' ? 'Census current-benchmark street-range interpolation of City Hall; approximate address point' : m.coordinateNote, source: pointSrc.url });
    return compact(rec);
  });
}
