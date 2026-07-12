/**
 * functions/api/weather.ts — weather proxy for PointCast.
 *
 * Three call shapes, all backed by Open-Meteo:
 *
 *   1. GET /api/weather                — rich El Segundo anchor payload
 *      (temp, feelsLike, condition, conditionCode, humidity, windSpeed,
 *      windDirection, uvIndex, sunrise, sunset, location, fetchedAt).
 *      Cached at the edge for 30 min. Used by /gm + future homepage brief.
 *
 *   2. GET /api/weather?station={slug} — station weather for /tv STATIONS mode
 *      and /api/mcp. Returns { ok, station, name, tempF, condition, sunset,
 *      updatedAt }. 10-min edge cache. Behavior preserved from the original
 *      Codex implementation.
 *
 *   3. GET /api/weather?lat=..&lng=..[&label=..] — ad hoc coordinates,
 *      same shape as (2). Used by /window.
 *
 * On upstream failure the rich El Segundo path returns the most recent edge
 * cache entry if one exists, otherwise a 503 with { error, fallback: true }.
 */
import { getStationBySlug } from '../../src/lib/local';

const EL_SEGUNDO = {
  latitude: 33.9192,
  longitude: -118.4165,
  location: 'El Segundo, CA',
} as const;

const RICH_CACHE_TTL_SECONDS = 1800; // 30 minutes
const STATION_CACHE_TTL_SECONDS = 600; // 10 minutes

function corsHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...extra,
  };
}

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const ri: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...ri,
    headers: corsHeaders((ri.headers as Record<string, string>) ?? {}),
  });
}

const WX_CODE_SHORT: Record<number, string> = {
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

const WX_CODE_HUMAN: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Drizzle',
  53: 'Drizzle',
  55: 'Drizzle',
  61: 'Rain',
  63: 'Rain',
  65: 'Rain',
  71: 'Snow',
  73: 'Snow',
  75: 'Snow',
  80: 'Showers',
  81: 'Showers',
  82: 'Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
};

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

function degreesToCompass(deg: number | null | undefined): string {
  if (typeof deg !== 'number' || !Number.isFinite(deg)) return 'N';
  const normalized = ((deg % 360) + 360) % 360;
  // 8 sectors of 45deg each, centered on the cardinal directions.
  const idx = Math.round(normalized / 45) % 8;
  return COMPASS[idx];
}

function formatClock(iso: string | null | undefined): string | null {
  if (!iso) return null;
  // Open-Meteo with timezone=America/Los_Angeles returns naive local strings
  // like "2026-05-08T05:52". Parse the HH:MM directly so we don't double-shift.
  const match = /T(\d{2}):(\d{2})/.exec(iso);
  if (!match) return null;
  let hour = Number.parseInt(match[1], 10);
  const minute = match[2];
  if (!Number.isFinite(hour)) return null;
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${period}`;
}

function parseCoord(raw: string | null): number | null {
  if (!raw) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

type RichWeather = {
  temp: number;
  feelsLike: number;
  condition: string;
  conditionCode: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  uvIndex: number;
  sunrise: string | null;
  sunset: string | null;
  location: string;
  fetchedAt: string;
};

function buildRichPayload(weather: any): RichWeather {
  const code = Number(weather?.current?.weather_code ?? -1);
  return {
    temp: Math.round(weather?.current?.temperature_2m ?? 0),
    feelsLike: Math.round(weather?.current?.apparent_temperature ?? 0),
    condition: WX_CODE_HUMAN[code] ?? 'Unknown',
    conditionCode: Number.isFinite(code) ? code : -1,
    humidity: Math.round(weather?.current?.relative_humidity_2m ?? 0),
    windSpeed: Math.round(weather?.current?.wind_speed_10m ?? 0),
    windDirection: degreesToCompass(weather?.current?.wind_direction_10m),
    uvIndex: Math.round(weather?.current?.uv_index ?? 0),
    sunrise: formatClock(weather?.daily?.sunrise?.[0]),
    sunset: formatClock(weather?.daily?.sunset?.[0]),
    location: EL_SEGUNDO.location,
    fetchedAt: new Date().toISOString(),
  };
}

function richResponse(payload: RichWeather, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: corsHeaders({
      'Cache-Control': `public, max-age=${RICH_CACHE_TTL_SECONDS}, s-maxage=${RICH_CACHE_TTL_SECONDS}`,
      'X-Pc-Weather-Source': 'open-meteo',
      'X-Pc-Weather-Cache': 'caches.default',
    }),
  });
}

async function handleRichElSegundo(request: Request, ctx: EventContext<unknown, any, unknown>): Promise<Response> {
  // Stable cache key — independent of the inbound URL — so /api/weather
  // and /api/weather.json share one upstream fetch window.
  const cacheKey = new Request('https://pointcast.xyz/__cache/weather/el-segundo/v1', { method: 'GET' });
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = new URL('https://api.open-meteo.com/v1/forecast');
  upstream.searchParams.set('latitude', String(EL_SEGUNDO.latitude));
  upstream.searchParams.set('longitude', String(EL_SEGUNDO.longitude));
  upstream.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index',
  );
  upstream.searchParams.set('daily', 'sunrise,sunset');
  upstream.searchParams.set('temperature_unit', 'fahrenheit');
  upstream.searchParams.set('wind_speed_unit', 'mph');
  upstream.searchParams.set('timezone', 'America/Los_Angeles');
  upstream.searchParams.set('forecast_days', '1');

  try {
    const upstreamResponse = await fetch(upstream.toString(), {
      headers: { 'User-Agent': 'pointcast-weather/1.0 (+https://pointcast.xyz)' },
    });
    if (!upstreamResponse.ok) {
      return json({ error: 'weather unavailable', fallback: true }, 503);
    }
    const weather = await upstreamResponse.json<any>();
    const payload = buildRichPayload(weather);
    const response = richResponse(payload);
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error: any) {
    return json({ error: 'weather unavailable', fallback: true }, 503);
  }
}

async function handleStationOrCoords(
  request: Request,
  ctx: EventContext<unknown, any, unknown>,
  url: URL,
): Promise<Response> {
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
    // Should not happen — caller guards on presence of params.
    return json({ ok: false, error: 'missing-coords' }, 400);
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
      condition: WX_CODE_SHORT[weather?.current?.weather_code ?? -1] ?? 'unknown',
      sunset: weather?.daily?.sunset?.[0] ?? null,
      updatedAt: weather?.current?.time ?? new Date().toISOString(),
    };
  } catch (error: any) {
    return json({ ok: false, error: 'fetch-failed', message: error?.message ?? String(error) }, 502);
  }

  const response = json(payload, {
    status: 200,
    headers: {
      'Cache-Control': `public, max-age=${STATION_CACHE_TTL_SECONDS}, s-maxage=${STATION_CACHE_TTL_SECONDS}`,
      'X-Pc-Weather-Source': 'open-meteo',
    },
  });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export const onRequest: PagesFunction = async (ctx) => {
  const { request } = ctx;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders({
        'X-Pc-Service': 'weather',
        'X-Pc-Cache': 'caches.default',
      }),
    });
  }

  if (request.method !== 'GET') {
    return json({ ok: false, error: 'method-not-allowed' }, 405);
  }

  const url = new URL(request.url);
  const hasStation = url.searchParams.has('station');
  const hasCoords = url.searchParams.has('lat') || url.searchParams.has('lng');

  if (hasStation || hasCoords) {
    return handleStationOrCoords(request, ctx, url);
  }
  return handleRichElSegundo(request, ctx);
};
