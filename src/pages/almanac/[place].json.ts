/**
 * /almanac/{place}.json — machine mirror of the place almanac.
 *
 * Completes the agent-native pattern: every human surface has a JSON twin.
 * Thirty days of sun and moon, the year's turning points, and a pointer to
 * the tide endpoint — never tide values, because those are NOAA's to serve.
 */
import type { APIRoute } from 'astro';
import {
  ALMANAC_PLACES,
  FACETS,
  NOAA_STATION_FINDER,
  buildDay,
  buildRange,
  isoDate,
  noaaStationUrl,
  pacificDate,
  yearExtremes,
  type AlmanacPlace,
} from '../../lib/almanac';

export function getStaticPaths() {
  return ALMANAC_PLACES.map((place) => ({ params: { place: place.slug }, props: { place } }));
}

export const GET: APIRoute = ({ props }) => {
  const place = props.place as AlmanacPlace;
  const today = pacificDate();
  const year = today.getUTCFullYear();
  const days = buildRange(place, today, 30);
  const ext = yearExtremes(place, year);
  const day = buildDay(place, today);

  const slim = (d: (typeof days)[number]) => ({
    date: d.iso,
    sunrise: d.sun.sunrise?.toISOString() ?? null,
    sunset: d.sun.sunset?.toISOString() ?? null,
    solarNoon: d.sun.solarNoon.toISOString(),
    daylightSeconds: Math.round(d.sun.dayLengthMs / 1000),
    daylightDeltaSeconds: Math.round(d.daylightDeltaMs / 1000),
    moonPhase: d.moon.phase,
    moonIllumination: Number(d.moon.illumination.toFixed(4)),
  });

  const payload = {
    $schema: 'https://pointcast.xyz/almanac.schema.json',
    name: `PointCast Almanac · ${place.formalName}`,
    description:
      'Sun and moon computed from the NOAA solar formulas and the standard synodic model. ' +
      'Tide is never computed or cached here — fetch it from the NOAA endpoint named below.',
    home: `https://pointcast.xyz/almanac/${place.slug}`,
    generatedAt: new Date().toISOString(),
    generatedFor: isoDate(today),
    timeZone: 'America/Los_Angeles',

    place: {
      slug: place.slug,
      name: place.name,
      formalName: place.formalName,
      latitude: place.lat,
      longitude: place.lng,
      milesFromAnchor: place.miles,
      directionFromAnchor: place.direction,
      note: place.blurb,
    },

    today: slim(day),
    days: days.map(slim),

    year: {
      year,
      longestDay: { date: ext.longest.iso, daylightSeconds: Math.round(ext.longest.sun.dayLengthMs / 1000) },
      shortestDay: { date: ext.shortest.iso, daylightSeconds: Math.round(ext.shortest.sun.dayLengthMs / 1000) },
      latestSunset: { date: ext.latestSunset.iso, at: ext.latestSunset.sun.sunset?.toISOString() ?? null },
      earliestSunset: { date: ext.earliestSunset.iso, at: ext.earliestSunset.sun.sunset?.toISOString() ?? null },
      earliestSunrise: { date: ext.earliestSunrise.iso, at: ext.earliestSunrise.sun.sunrise?.toISOString() ?? null },
      latestSunrise: { date: ext.latestSunrise.iso, at: ext.latestSunrise.sun.sunrise?.toISOString() ?? null },
    },

    tide: place.noaaStation
      ? {
          policy: 'not-computed',
          source: 'NOAA CO-OPS',
          station: place.noaaStation.id,
          stationName: place.noaaStation.name,
          stationUrl: noaaStationUrl(place.noaaStation.id),
          liveEndpoint: `https://pointcast.xyz/api/tide?station=${place.noaaStation.id}`,
        }
      : {
          policy: 'not-computed',
          source: 'NOAA CO-OPS',
          station: null,
          note: 'No gauge is asserted for this place. Guessing one would produce confidently wrong water.',
          stationFinder: NOAA_STATION_FINDER,
        },

    facets: FACETS.map((f) => ({
      slug: f.slug,
      label: f.label,
      url: `https://pointcast.xyz/almanac/${place.slug}/${f.slug}`,
    })),

    places: ALMANAC_PLACES.map((p) => ({
      slug: p.slug,
      name: p.name,
      url: `https://pointcast.xyz/almanac/${p.slug}`,
      json: `https://pointcast.xyz/almanac/${p.slug}.json`,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
