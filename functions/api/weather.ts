/**
 * functions/api/weather.ts — station weather proxy for /tv STATIONS mode.
 *
 * GET ?station={slug} → normalized Open-Meteo payload for a known station.
 * Optional fallback: GET ?lat=..&lng=..[&label=..] for ad hoc coordinates.
 *
 * Caching strategy:
 *   - No KV namespace. Weather is read-mostly and time-bounded, so the
 *     worker uses caches.default with a 10-minute TTL.
 *   - Query params are normalized into a stable cache key so all viewers of
 *     the same station share one upstream fetch window.
 */
import { getStationBySlug } from '../../src/lib/local';

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const ri: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...ri,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      ...((ri.headers as Record<string, string>) ?? {}),
    },
  });
}

const WX_CODE: Record<number, string> = {
  0: 'clear',
  1: 'mostly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  80: 'showers',
  81: 'showers',
  82: 'showers',
  95: 'storm',
  96: 'storm',
  99: 'storm',
};

function parseCoord(raw: string | null): number | null {
  if (!raw) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

export const onRequest: PagesFunction = async (ctx) => {
  const { request } = ctx;

  if (request.method === 'OPTIONS') return json({ ok: true }, 204);

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'weather',
        'X-Pc-Cache': 'caches.default',
      },
    });
  }

  if (request.method !== 'GET') {
    return json({ ok: false, error: 'method-not-allowed' }, 405);
  }

  const url = new URL(request.url);
  const stationSlug = url.searchParams.get('station');

  let label = 'custom';
  let lat: number | null = null;
  let lng: number | null = null;

  if (stationSlug) {
    const station = getStationBySlug(stationSlug);
    if (!station) return json({ ok: false, error: 'unknown-station', station: stationSlug }, 404);
    label = station.name;
    lat = station.coords.lat;
    lng = station.coords.lng;
  } else {
    lat = parseCoord(url.searchParams.get('lat'));
    lng = parseCoord(url.searchParams.get('lng'));
    label = url.searchParams.get('label') || label;
  }

  if (lat === null || lng === null) {
    return json({
      ok: true,
      endpoint: 'https://pointcast.xyz/api/weather',
      usage: 'GET ?station={slug} or ?lat={number}&lng={number}[&label=name]',
      cache: '10 minute edge cache via caches.default',
      returns: '{ tempF, condition, sunset, updatedAt }',
    });
  }

  const cacheUrl = new URL(request.url);
  cacheUrl.search = '';
  if (stationSlug) {
    cacheUrl.searchParams.set('station', stationSlug);
  } else {
    cacheUrl.searchParams.set('lat', lat.toFixed(2));
    cacheUrl.searchParams.set('lng', lng.toFixed(2));
    cacheUrl.searchParams.set('label', label.toLowerCase());
  }
  const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = new URL('https://api.open-meteo.com/v1/forecast');
  upstream.searchParams.set('latitude', lat.toFixed(2));
  upstream.searchParams.set('longitude', lng.toFixed(2));
  upstream.searchParams.set('current', 'temperature_2m,weather_code');
  upstream.searchParams.set('daily', 'sunset');
  upstream.searchParams.set('temperature_unit', 'fahrenheit');
  upstream.searchParams.set('timezone', 'America/Los_Angeles');
  upstream.searchParams.set('forecast_days', '1');

  let payload: Record<string, unknown>;
  try {
    const upstreamResponse = await fetch(upstream.toString(), {
      headers: { 'User-Agent': 'pointcast-weather-proxy/1.0' },
    });
    if (!upstreamResponse.ok) {
      return json({ ok: false, error: 'upstream-failed', status: upstreamResponse.status }, 502);
    }

    const weather = await upstreamResponse.json<any>();
    payload = {
      ok: true,
      station: stationSlug ?? null,
      name: label,
      tempF: Math.round(weather?.current?.temperature_2m ?? 0),
      condition: WX_CODE[weather?.current?.weather_code ?? -1] ?? 'unknown',
      sunset: weather?.daily?.sunset?.[0] ?? null,
      updatedAt: weather?.current?.time ?? new Date().toISOString(),
    };
  } catch (error: any) {
    return json({ ok: false, error: 'fetch-failed', message: error?.message ?? String(error) }, 502);
  }

  const response = json(payload, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=600, s-maxage=600',
      'X-Pc-Weather-Source': 'open-meteo',
    },
  });

  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
};
