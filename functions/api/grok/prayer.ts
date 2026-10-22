/**
 * /api/grok/prayer — the quiet bell on /grok.
 *
 * GET  → { ok, total, storage: "kv" }
 * POST { sessionId } → offer one prayer, rate-limited to one per 5 seconds.
 *
 * Storage is the VISITS KV namespace, key grok:prayer:total, the same
 * store /api/drum uses for drum:total. Counts do not reset. When VISITS
 * is unbound the route answers 503 and the page keeps the number in
 * localStorage instead.
 */

import { offerPrayer, readTotal } from '../../_lib/grok-prayer.mjs';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

type PrayerEnv = { VISITS?: KVNamespace };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

export const onRequestOptions: PagesFunction<PrayerEnv> = () =>
  new Response(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<PrayerEnv> = async ({ env }) => {
  const body = await readTotal(env.VISITS);
  return json(body, body.ok ? 200 : 503);
};

export const onRequestPost: PagesFunction<PrayerEnv> = async ({ request, env }) => {
  let payload: { sessionId?: unknown };
  try {
    payload = (await request.json()) as { sessionId?: unknown };
  } catch {
    return json({ ok: false, reason: 'bad-body' }, 400);
  }
  const result = await offerPrayer(env.VISITS, { sessionId: payload.sessionId });
  return json(result.body, result.status);
};
