/**
 * /api/tide?station=9410660 — today's high and low tides, straight from NOAA.
 *
 * "Do not invent the water." The almanac computes sun and moon itself because
 * those are closed-form; tide prediction needs NOAA's per-station harmonic
 * constituents, so we proxy the real thing rather than approximate it. If NOAA
 * is unreachable this returns an error payload and the UI says so — it never
 * falls back to a guess.
 *
 * NOAA CO-OPS datagetter is public and needs no key. We pass an `application`
 * identifier because their terms ask callers to identify themselves.
 */

const NOAA_ENDPOINT = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

/**
 * Stations this endpoint will query. An allowlist, not a passthrough — it keeps
 * the route from being used as an open proxy, and it matches the stations the
 * almanac is willing to name (see the warning in src/lib/almanac.ts).
 */
const ALLOWED_STATIONS: Record<string, string> = {
  '9410660': 'Los Angeles (Outer Harbor)',
  '9410840': 'Santa Monica',
};

type NoaaPrediction = { t: string; v: string; type: 'H' | 'L' };

/** NOAA wants YYYYMMDD in the station's local time. */
function pacificStamp(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}${get('month')}${get('day')}`;
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const station = url.searchParams.get('station') ?? '9410660';

  const stationName = ALLOWED_STATIONS[station];
  if (!stationName) {
    return json(
      {
        ok: false,
        error: 'unknown_station',
        message:
          'This endpoint only serves NOAA stations the almanac names. Use tidesandcurrents.noaa.gov directly for others.',
        allowed: Object.keys(ALLOWED_STATIONS),
      },
      400,
    );
  }

  const query = new URLSearchParams({
    product: 'predictions',
    application: 'pointcast.xyz',
    begin_date: pacificStamp(),
    end_date: pacificStamp(1),
    datum: 'MLLW',
    station,
    time_zone: 'lst_ldt',
    units: 'english',
    interval: 'hilo',
    format: 'json',
  });

  try {
    // Never cache tide data. Unlike the closed-form sun and moon values, the
    // water is useful here only as a live NOAA answer (or an explicit miss).
    const upstream = await fetch(`${NOAA_ENDPOINT}?${query}`, {
      headers: { Accept: 'application/json' },
    });

    if (!upstream.ok) {
      return json({ ok: false, error: 'noaa_unavailable', status: upstream.status, station, stationName }, 502);
    }

    const body = (await upstream.json()) as { predictions?: NoaaPrediction[]; error?: { message: string } };
    if (body.error || !body.predictions) {
      return json(
        { ok: false, error: 'noaa_error', message: body.error?.message ?? 'No predictions returned.', station, stationName },
        502,
      );
    }

    return json({
      ok: true,
      source: 'NOAA CO-OPS',
      station,
      stationName,
      stationUrl: `https://tidesandcurrents.noaa.gov/stationhome.html?id=${station}`,
      datum: 'MLLW',
      units: 'feet',
      timeZone: 'America/Los_Angeles',
      fetchedAt: new Date().toISOString(),
      predictions: body.predictions.map((p) => ({
        time: p.t,
        heightFt: Number(p.v),
        kind: p.type === 'H' ? 'high' : 'low',
      })),
    });
  } catch (err) {
    return json(
      { ok: false, error: 'fetch_failed', message: err instanceof Error ? err.message : String(err), station, stationName },
      502,
    );
  }
};

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Do not turn a live NOAA proxy into a stale tide source.
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const onRequestOptions: PagesFunction = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
