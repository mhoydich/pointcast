/**
 * GET /api/sit/presence — HTTP snapshot fallback for the sitting room.
 */

interface Env {
  SIT_ROOM?: DurableObjectNamespace;
  SIT_STATS?: KVNamespace;
}

const ROOM_NAME = 'global';
const TOTAL_MINUTES_KEY = 'sit:total_minutes';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function kvTotalMinutes(env: Env): Promise<number> {
  if (!env.SIT_STATS) return 0;
  const raw = await env.SIT_STATS.get(TOTAL_MINUTES_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.SIT_ROOM) {
    return json({
      sitting: 0,
      total_minutes: await kvTotalMinutes(env),
      note: 'SIT_ROOM Durable Object binding is not configured.',
    });
  }

  try {
    const id = env.SIT_ROOM.idFromName(ROOM_NAME);
    const stub = env.SIT_ROOM.get(id);
    const url = new URL(request.url);
    url.pathname = '/presence';
    url.search = '';
    const response = await stub.fetch(new Request(url.toString(), { method: 'GET' }));
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'no-store');
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    console.error('[sit/presence] DO fetch failed:', err);
    return json({
      sitting: 0,
      total_minutes: await kvTotalMinutes(env),
      note: 'SIT_ROOM request failed; returning KV fallback.',
    });
  }
};
