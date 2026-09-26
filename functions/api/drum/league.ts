/**
 * /api/drum/league — Drum League standings.
 *
 * Every app that tags its beats (see /drum-kit, /api/drum/signal) is a team.
 * A league week runs Monday–Sunday UTC; points are beats with each app's day
 * capped (Season 0: 5,000) so a runaway script can't bury everyone else.
 *
 * GET /api/drum/league[?week=YYYY-MM-DD]
 *   → { season: { id, name, start, dailyCap },
 *       week: { number, start, end, current },
 *       standings: [{ rank, kind, app, points, beats, hits, activeDays, lastAt }] }
 */

interface Env {
  DRUM_COUNTER?: DurableObjectNamespace;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=15',
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DRUM_COUNTER) {
    return new Response(JSON.stringify({ ok: false, reason: 'counter-unavailable' }), { status: 503, headers: HEADERS });
  }
  const week = new URL(request.url).searchParams.get('week') ?? '';
  const query = /^\d{4}-\d{2}-\d{2}$/.test(week) ? `league=1&week=${week}` : 'league=1';
  try {
    const stub = env.DRUM_COUNTER.get(env.DRUM_COUNTER.idFromName('global'));
    const response = await stub.fetch(`https://drum-counter.internal/?${query}`);
    return new Response(response.body, { status: response.status, headers: HEADERS });
  } catch {
    return new Response(JSON.stringify({ ok: false, reason: 'counter-unavailable' }), { status: 503, headers: HEADERS });
  }
};
