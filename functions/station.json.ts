import { stationPayload, STATION } from './api/station.ts';
import type { SpotifyBroadcastEnv } from './api/spotify/_broadcast.ts';

// The agent-readable twin of /station. Same numbers as the page, pretty-printed.
export const onRequestGet: PagesFunction<SpotifyBroadcastEnv> = async ({ env }) => {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300', 'Access-Control-Allow-Origin': '*' };
  try { return new Response(JSON.stringify(await stationPayload(env), null, 2), { headers }); }
  catch { return new Response(JSON.stringify({ ...STATION, ok: false, reason: 'station-unavailable' }, null, 2), { status: 503, headers }); }
};
