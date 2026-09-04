import {
  PAID_ACTION_HEADERS,
  paidIntentJson,
  publicPaidIntent,
  type PaidIntentRow,
} from '../../../_lib/paid-town-actions.ts';

type ActionsByTxEnv = Cloudflare.Env & { AUTH_DB?: D1Database };
const TX_HASH = /^0x[0-9a-fA-F]{64}$/u;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: PAID_ACTION_HEADERS,
});

export async function handleActionByTransaction(env: ActionsByTxEnv, rawHash: unknown): Promise<Response> {
  if (!env.AUTH_DB) return json({ ok: false, error: 'action-intents-unavailable' }, 503);
  if (typeof rawHash !== 'string' || !TX_HASH.test(rawHash)) return json({ ok: false, error: 'action-not-found' }, 404);
  const txHash = rawHash.toLowerCase();
  const intent = await env.AUTH_DB.prepare(`
    SELECT id, action, idempotency_key, request_hash, request_json, status,
           capacity_key, settlement_json, result_json, tx_hash, agent_id,
           error, created_at, updated_at
    FROM paid_action_intents
    WHERE lower(tx_hash) = ?
       OR (tx_hash IS NULL AND lower(json_extract(settlement_json, '$.receipt.settlement.tx')) = ?)
    LIMIT 1
  `).bind(txHash, txHash).first<PaidIntentRow>();
  if (!intent) return json({ ok: false, error: 'action-not-found' }, 404);
  return paidIntentJson(intent.id, { ok: true, ...publicPaidIntent(intent) });
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });
export const onRequestGet: PagesFunction<ActionsByTxEnv> = async ({ env, params }) => (
  handleActionByTransaction(env, params.txHash)
);
