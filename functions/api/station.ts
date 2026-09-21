/**
 * /api/station — the broadcaster's radio station: on air now, the play log, and
 * what the log adds up to. GET is public and cached a minute. DELETE erases the
 * log and is the broadcaster's alone.
 */
import { authJson, readSessionFromRequest } from './auth/session.ts';
import { resolveNowPlaying, type SpotifyBroadcastEnv } from './spotify/_broadcast.ts';
import { clearStation, readStation, resolveOnAir, syncStation } from './spotify/_station.ts';

export const STATION = {
  name: 'Mike Hoydich Radio',
  tagline: 'One listener’s station, broadcasting from El Segundo.',
  canonical: 'https://pointcast.xyz/station',
  json: 'https://pointcast.xyz/station.json',
  channel: 'https://pointcast.xyz/c/spinning',
  broadcaster: 'Mike Hoydich',
};

export async function stationPayload(env: SpotifyBroadcastEnv) {
  await syncStation(env); // throttled in the edge cache; a no-op most of the time
  const [nowPlaying, station] = await Promise.all([resolveNowPlaying(env).then((n) => resolveOnAir(env, n)), readStation(env)]);
  return {
    ...STATION,
    generatedAt: new Date().toISOString(),
    method: 'Counted from the station’s own play log. Nothing is inferred about how a track sounds. “seen” plays were observed by the town’s now-playing signal; “spotify” plays come from the broadcaster’s recently-played list.',
    onAir: nowPlaying,
    ...station,
  };
}

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60', 'Access-Control-Allow-Origin': '*' };

export const onRequestGet: PagesFunction<SpotifyBroadcastEnv> = async ({ env }) => {
  try { return new Response(JSON.stringify(await stationPayload(env)), { headers }); }
  catch { return new Response(JSON.stringify({ ...STATION, ok: false, reason: 'station-unavailable' }), { status: 503, headers: { ...headers, 'Cache-Control': 'no-store' } }); }
};

export const onRequestDelete: PagesFunction<SpotifyBroadcastEnv> = async ({ request, env }) => {
  if (request.headers.get('Origin') !== new URL(request.url).origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    return authJson({ ok: false, reason: 'same-origin-required' }, { status: 403 });
  }
  const current = await readSessionFromRequest(request, env);
  if (!current?.user.roles?.includes('broadcaster')) return authJson({ ok: false, reason: 'broadcaster-only' }, { status: 403 });
  return authJson({ ok: true, erased: await clearStation(env) });
};
