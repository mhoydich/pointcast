import type { APIRoute } from 'astro';
import { CLOCK, RADIO_BASE, RADIO_STATUS, STATIONS, STATION_SEATS, stationBySlug, stationLaunch } from '../../data/radio-network';

export function getStaticPaths() {
  return STATIONS.map((s) => ({ params: { slug: s.slug } }));
}

export const GET: APIRoute = ({ params }) => {
  const station = stationBySlug(String(params.slug))!;
  const body = {
    ...station,
    status: RADIO_STATUS,
    launch: stationLaunch(station.phase),
    seats: STATION_SEATS.map((s) => ({ ...s, status: 'open' })),
    localSlots: CLOCK.filter((c) => c.who.startsWith('Local')),
    url: `${RADIO_BASE}/${station.slug}`,
    network: `${RADIO_BASE}.json`,
    launchKit: `${RADIO_BASE}/kit.json`,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};
