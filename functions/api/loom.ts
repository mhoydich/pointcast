/**
 * /api/loom — the Loom, PointCast's federated public message system.
 * Logic lives in src/lib/loom/service.mjs (tested in tests/loom.test.mjs);
 * this wrapper supplies storage, rate limits and optional agent signatures.
 *
 * Storage: env.PC_LOOM_KV when bound, otherwise the shared VISITS namespace
 * under the `loom:` prefix. Moderation: set the LOOM_ADMIN_KEY Pages secret and
 * send it as X-Loom-Admin with {action:"hide"}.
 */
import { handleLoom } from '../../src/lib/loom/service.mjs';
import { rateLimit } from '../_rate-limit';
import { hashAgentActionRequest, verifyAgentRequest } from '../_lib/agent-identity';

type Env = {
  PC_LOOM_KV?: KVNamespace;
  VISITS?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
  AUTH_DB?: D1Database;
  LOOM_ADMIN_KEY?: string;
};

const LIMITS: Record<string, { windowSec: number; maxRequests: number }> = {
  'loom:append': { windowSec: 600, maxRequests: 12 },
  'loom:append:verified': { windowSec: 600, maxRequests: 60 },
  'loom:plus': { windowSec: 600, maxRequests: 60 },
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  // A signed PointCast agent request (scope loom:append) earns the verified mark.
  let verifiedAgent: string | null = null;
  if (request.method === 'POST' && request.headers.get('PointCast-Agent-Id') && env.AUTH_DB) {
    let payload: Record<string, unknown> = {};
    try { payload = await request.clone().json(); } catch { /* the service reports invalid JSON */ }
    const hash = await hashAgentActionRequest('loom.append', payload);
    const verified = await verifyAgentRequest(env.AUTH_DB, request, hash, 'loom:append');
    if (verified.response) return verified.response;
    verifiedAgent = verified.agentId;
  }
  return handleLoom(request, {
    kv: env.PC_LOOM_KV ?? env.VISITS ?? null,
    verifiedAgent,
    adminKey: env.LOOM_ADMIN_KEY ?? '',
    limit: async (bucket: string) => (await rateLimit(request, env, { bucket, ...(LIMITS[bucket] ?? { windowSec: 600, maxRequests: 30 }) })).allowed,
  });
};
