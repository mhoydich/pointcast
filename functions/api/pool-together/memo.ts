/**
 * /api/pool-together/memo — the free parcel-memo desk for agents (and people).
 *
 * GET  → the register: sealed memos first, then newest, capped at 200 rows.
 * POST → file one memo: { lot, agent, apn | address, kind, source?, note? }
 *        Free. Caps, counted in D1 so they hold: 20 per client address per
 *        day and 20 per agent handle per day; a KV rate limit sits in front as
 *        a best-effort brake. Optional PointCast agent identity headers
 *        (PointCast-Agent-Id / -Timestamp / -Signature over the canonical body,
 *        scope action:memo) mark the memo as filed by a verified agent.
 *        To seal a memo with one cent and a countersigned x402 receipt, POST
 *        the same body to /api/agent/memo instead.
 */
import { rateLimit, rateLimitResponse } from '../../_rate-limit';
import { hashAgentActionRequest, verifyAgentRequest } from '../../_lib/agent-identity.ts';
import { LIMITS } from '../../../src/lib/pool-together.ts';
import { countMemosSince, hashClient, insertMemo, json, listMemos, newMemoId, normalizeMemo, publicMemo, registerTotals, type Memo, type PoolTogetherEnv } from './_store';

export { publicMemo } from './_store';

const REGISTER_CAP = 200;

export async function handleMemoGet(env: PoolTogetherEnv): Promise<Response> {
  if (!env.AUTH_DB) return json({ ok: true, dbBound: false, count: 0, sealed: 0, eligible: 0, agents: 0, verifiedAgents: 0, memos: [], generatedAt: new Date().toISOString() });
  const [totals, memos] = await Promise.all([registerTotals(env.AUTH_DB), listMemos(env.AUTH_DB, REGISTER_CAP)]);
  return json({ ok: true, dbBound: true, ...totals, memos: memos.map(publicMemo), generatedAt: new Date().toISOString() });
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
  if (!env.AUTH_DB) return json({ ok: false, error: 'The memo register is unavailable; nothing was recorded.' }, 503);
  const db = env.AUTH_DB;
  const normalized = normalizeMemo(input);
  if (!normalized.ok) return json({ ok: false, error: normalized.error }, 400);

  const identity = await verifyAgentRequest(db, request, await hashAgentActionRequest('memo', normalized.canonical), 'action:memo');
  if (identity.response) return identity.response;

  const limit = await rateLimit(request, env, { bucket: 'pool-together-memo', windowSec: 86400, maxRequests: LIMITS.memosPerIpPerDay });
  if (!limit.allowed) return rateLimitResponse(limit, 'twenty memos a day per address. seal one with a cent at /api/agent/memo, or come back tomorrow.');
  const since = new Date(Date.now() - 86400_000).toISOString();
  const ipHash = await hashClient(request);
  const [byIp, byAgent] = await Promise.all([
    ipHash === 'anon' ? Promise.resolve(0) : countMemosSince(db, 'ip_hash', ipHash, since),
    countMemosSince(db, 'agent', normalized.memo.agent, since),
  ]);
  if (byIp >= LIMITS.memosPerIpPerDay || byAgent >= LIMITS.memosPerIpPerDay) {
    return json({ ok: false, error: `Twenty memos a day per address and per handle. Seal one with a cent at /api/agent/memo, or come back tomorrow.`, seal: 'https://pointcast.xyz/api/agent/memo' }, 429);
  }

  const memo: Memo = { id: newMemoId(), ...normalized.memo, agentId: identity.agentId, t: Date.now(), sealed: null };
  await insertMemo(db, memo, ipHash === 'anon' ? null : ipHash);
  const totals = await registerTotals(db);
  return json({ ok: true, memo: publicMemo(memo), count: totals.count, eligible: totals.eligible, sealed: false, seal: 'https://pointcast.xyz/api/agent/memo' }, 201);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, PointCast-Agent-Id, PointCast-Agent-Timestamp, PointCast-Agent-Signature' } });
export const onRequestGet: PagesFunction<PoolTogetherEnv> = async ({ env }) => handleMemoGet(env);
export const onRequestPost: PagesFunction<PoolTogetherEnv> = async ({ request, env }) => handleMemoPost(request, env);
