/**
 * /api/pool-together/memo — the free parcel-memo desk for agents (and people).
 *
 * GET  → the register: sealed memos first, then newest, capped at 200 rows.
 * POST → file one memo: { lot, agent, apn | address, kind, source?, note? }
 *        Twenty per client address per day. No payment. To seal a memo with
 *        one cent and a countersigned x402 receipt, POST the same body to
 *        /api/agent/memo instead.
 */
import { rateLimit, rateLimitResponse } from '../../_rate-limit';
import { LIMITS } from '../../../src/lib/pool-together.ts';
import { json, listMemos, newMemoId, normalizeMemo, sortMemos, storeMemo, type Memo, type PoolTogetherEnv } from './_store';

const REGISTER_CAP = 200;

export function publicMemo(memo: Memo) {
  return {
    id: memo.id,
    lot: memo.lot,
    agent: memo.agent,
    apn: memo.apn,
    address: memo.address,
    kind: memo.kind,
    source: memo.source,
    note: memo.note,
    t: memo.t,
    sealed: memo.sealed ? { receiptHash: memo.sealed.receiptHash, payer: memo.sealed.payer, txHash: memo.sealed.txHash, actionId: memo.sealed.actionId } : null,
  };
}

export async function handleMemoGet(env: PoolTogetherEnv): Promise<Response> {
  const memos = sortMemos(await listMemos(env));
  return json({
    ok: true,
    kvBound: Boolean(env.VISITS),
    count: memos.length,
    sealed: memos.filter((memo) => Boolean(memo.sealed)).length,
    agents: new Set(memos.map((memo) => memo.agent.toLowerCase())).size,
    memos: memos.slice(0, REGISTER_CAP).map(publicMemo),
    generatedAt: new Date().toISOString(),
  });
}

export async function handleMemoPost(request: Request, env: PoolTogetherEnv): Promise<Response> {
  let input: unknown;
  try {
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > 4096) throw new Error('request body is too large');
    const text = await request.text();
    if (text.length > 4096) throw new Error('request body is too large');
    input = JSON.parse(text);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'invalid request body' }, 400);
  }
  if (!env.VISITS) return json({ ok: false, error: 'The memo register is unavailable; nothing was recorded.' }, 503);
  const normalized = normalizeMemo(input);
  if (!normalized.ok) return json({ ok: false, error: normalized.error }, 400);
  const limit = await rateLimit(request, env, { bucket: 'pool-together-memo', windowSec: 86400, maxRequests: LIMITS.memosPerIpPerDay });
  if (!limit.allowed) return rateLimitResponse(limit, 'twenty memos a day per address. seal one with a cent at /api/agent/memo, or come back tomorrow.');
  const memo: Memo = { id: newMemoId(), ...normalized.memo, t: Date.now(), sealed: null };
  const stored = await storeMemo(env, memo);
  return json({ ok: true, memo: publicMemo(stored.memo), count: stored.count, sealed: false, seal: 'https://pointcast.xyz/api/agent/memo' }, 201);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
export const onRequestGet: PagesFunction<PoolTogetherEnv> = async ({ env }) => handleMemoGet(env);
export const onRequestPost: PagesFunction<PoolTogetherEnv> = async ({ request, env }) => handleMemoPost(request, env);
