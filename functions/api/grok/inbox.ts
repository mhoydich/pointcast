/**
 * /api/grok/inbox — pings for Grok Bot.
 *
 * POST { text, kind: "ping"|"question"|"game"|"sky", handle?, sky?: "yes"|"no", company? }
 *   company is a honeypot and must be empty.
 *   201 { ok, ping }  ping is waiting for grok.
 *   Rate limit: 8 posts / 10 minutes / IP via PC_RATES_KV (shared helper).
 *
 * GET ?status=open|answered|all
 *   { ok, status, count, pings: [{ id, created_at, handle, kind, text, status, sky, reply_text, devnet_tx }] }
 *   CORS *.
 *
 * Storage: VISITS KV, prefix grok:inbox:. 90-day record TTL.
 * Answering is POST /api/grok/inbox/:id/answer with bearer GROK_INBOX_TOKEN.
 */
import { rateLimit, rateLimitResponse } from '../../_rate-limit.ts';
import { listPings, parseIncoming, savePing } from '../../_lib/grok-inbox.mjs';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
};

type InboxEnv = { VISITS?: KVNamespace; PC_RATES_KV?: KVNamespace; GROK_INBOX_TOKEN?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });
}

export const onRequestOptions: PagesFunction<InboxEnv> = () =>
  new Response(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<InboxEnv> = async ({ request, env }) => {
  const status = new URL(request.url).searchParams.get('status') || 'all';
  if (!['open', 'answered', 'all'].includes(status)) {
    return json({ ok: false, error: 'status must be open, answered, or all' }, 400);
  }
  if (!env.VISITS) {
    return json({
      ok: false,
      reason: 'kv-not-bound',
      hint: 'Bind the VISITS KV namespace on the Pages project. The inbox uses that store.',
      pings: [],
    }, 503);
  }
  const pings = await listPings(env.VISITS, status);
  return json({
    ok: true,
    schema: 'pointcast.grok-inbox/v1',
    status,
    kvBound: true,
    answerTokenSet: Boolean(env.GROK_INBOX_TOKEN),
    count: pings.length,
    pings,
    answer: {
      method: 'POST',
      path: '/api/grok/inbox/{id}/answer',
      auth: 'Authorization: Bearer $GROK_INBOX_TOKEN',
      body: { reply_text: 'string, required, up to 500 characters', devnet_tx: 'optional string' },
      setup: 'Cloudflare Pages → Settings → Environment variables → GROK_INBOX_TOKEN, encrypted. Do not commit it.',
      infer: 'Until a token is set, /grok treats a grok devnet post whose title or body contains "re: ping <id>" as the reply.',
    },
  });
};

export const onRequestPost: PagesFunction<InboxEnv> = async ({ request, env }) => {
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, 503);
  const limited = await rateLimit(request, env, { bucket: 'grok:inbox', windowSec: 600, maxRequests: 8 });
  if (!limited.allowed) return rateLimitResponse(limited, 'eight pings every ten minutes');
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  const parsed = parseIncoming(body);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);
  const ping = await savePing(env.VISITS, parsed);
  return json({ ok: true, ping, waiting: 'waiting for grok' }, 201);
};
