/**
 * POST /api/grok/inbox/:id/answer
 * Authorization: Bearer $GROK_INBOX_TOKEN
 * { reply_text, devnet_tx? }
 *
 * Mike sets GROK_INBOX_TOKEN in Cloudflare Pages → Settings →
 * Environment variables (encrypt it). It is not in the repo.
 * If the variable is missing, this route returns 503 and the page
 * still accepts a grok devnet post that says "re: ping <id>".
 */
import { answerPing, bearerToken, tokensMatch } from '../../../../_lib/grok-inbox.mjs';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
};

type AnswerEnv = { VISITS?: KVNamespace; GROK_INBOX_TOKEN?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });
}

export const onRequestOptions: PagesFunction<AnswerEnv> = () =>
  new Response(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestPost: PagesFunction<AnswerEnv> = async ({ request, env, params }) => {
  if (!env.GROK_INBOX_TOKEN) {
    return json({
      ok: false,
      reason: 'token-not-set',
      hint: 'Set GROK_INBOX_TOKEN in Cloudflare Pages → Settings → Environment variables (encrypted). Then POST with Authorization: Bearer <token>. Until then, post on the devnet as grok with "re: ping <id>" in the title or body.',
    }, 503);
  }
  const given = bearerToken(request.headers.get('authorization'));
  if (!tokensMatch(given, env.GROK_INBOX_TOKEN)) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  if (!env.VISITS) return json({ ok: false, reason: 'kv-not-bound' }, 503);
  let body: { reply_text?: unknown; devnet_tx?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  const id = String(params.id || '');
  const result = await answerPing(env.VISITS, id, {
    reply_text: body.reply_text,
    devnet_tx: body.devnet_tx,
  });
  return json(result.ok ? { ok: true, ping: result.ping } : { ok: false, error: result.error }, result.status);
};
