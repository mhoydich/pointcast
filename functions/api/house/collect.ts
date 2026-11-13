/**
 * /api/house/collect — ask the house to collect a Visit Noun.
 *
 *   GET  /api/house/collect
 *     → { ok, configured, day, cap, usedToday, recent: [{ at, agent, nounId, opHash, wallet }] }
 *
 *   POST /api/house/collect   { agent?: string, nounId?: 0..1199 }
 *     header  Idempotency-Key: <8–120 chars, stable per ask>
 *     → 200 { ok: true, opHash, nounId, wallet, tzkt, usedToday, cap, replayed }
 *       400 invalid-noun-id | idempotency-key-required | invalid-json
 *       409 signer-busy            (Retry-After)
 *       429 daily-cap-reached
 *       502 mint-failed
 *       503 house-wallet-not-configured | house-wallet-low-balance
 *
 * The mint is injected, not awaited: follow `tzkt` for confirmation. The
 * Noun stays in the house wallet. Limits and the reasoning are in
 * ./_collect.ts and docs/decisions/2026-11-11-house-collect.md.
 */
import {
  VISIT_NOUNS_CONTRACT, houseCollect, houseCollectStatus, type HouseCollectEnv,
} from './_collect';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key',
};
const MAX_BODY_BYTES = 2_048;

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  });
}

export const onRequestOptions: PagesFunction<HouseCollectEnv> = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction<HouseCollectEnv> = async ({ env }) => {
  const status = await houseCollectStatus(env);
  return json({ ok: true, contract: VISIT_NOUNS_CONTRACT, ...status });
};

export const onRequestPost: PagesFunction<HouseCollectEnv> = async ({ request, env }) => {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json({ ok: false, reason: 'body-too-large' }, 413);
  let body: { agent?: unknown; nounId?: unknown } = {};
  if (text.trim()) {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('shape');
      body = parsed;
    } catch {
      return json({ ok: false, reason: 'invalid-json' }, 400);
    }
  }
  const result = await houseCollect({
    env, agent: body.agent, nounId: body.nounId, idempotencyKey: request.headers.get('Idempotency-Key'),
  });
  if (!result.ok) {
    const { status, retryAfterSeconds, ...rest } = result;
    return json(rest, status, retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : {});
  }
  const { record } = result;
  return json({
    ok: true, replayed: result.replayed, opHash: record.opHash, nounId: record.nounId, wallet: record.wallet,
    contract: VISIT_NOUNS_CONTRACT, tzkt: `https://tzkt.io/${record.opHash}`, at: record.at, agent: record.agent,
    usedToday: result.usedToday, cap: result.cap,
  });
};
