/**
 * /api/guides/intake — bot data collection + intern feedback for PointCast Guides.
 * Logic lives in src/lib/guides-intake/service.mjs (tested in
 * tests/guides-intake.test.mjs); this wrapper supplies storage, rate limits and
 * optional agent signatures. Spec: docs/specs/guides-intake.md.
 *
 * Storage: env.PC_GUIDES_KV when bound, otherwise the shared VISITS namespace
 * under the `gi:` prefix. Review: set the GUIDES_ADMIN_KEY Pages secret and send
 * it as X-Guides-Admin.
 */
import { handleGuidesIntake } from '../../../src/lib/guides-intake/service.mjs';
import { GUIDES, INTERN_ASSIGNMENTS } from '../../../src/data/guides';
import { rateLimit } from '../../_rate-limit';
import { hashAgentActionRequest, verifyAgentRequest } from '../../_lib/agent-identity';

type Env = {
  PC_GUIDES_KV?: KVNamespace;
  VISITS?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
  AUTH_DB?: D1Database;
  GUIDES_ADMIN_KEY?: string;
};

const LIMITS: Record<string, { windowSec: number; maxRequests: number }> = {
  'guides-intake:submit': { windowSec: 600, maxRequests: 10 },
  'guides-intake:revise': { windowSec: 600, maxRequests: 20 },
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  // A signed PointCast agent request (scope guides:intake) earns the verified mark.
  let verifiedAgent: string | null = null;
  if (request.method === 'POST' && request.headers.get('PointCast-Agent-Id') && env.AUTH_DB) {
    let payload: Record<string, unknown> = {};
    try { payload = await request.clone().json(); } catch { /* the service reports invalid JSON */ }
    const hash = await hashAgentActionRequest('guides.intake', payload);
    const verified = await verifyAgentRequest(env.AUTH_DB, request, hash, 'guides:intake');
    if (verified.response) return verified.response;
    verifiedAgent = verified.agentId;
  }
  return handleGuidesIntake(request, {
    kv: env.PC_GUIDES_KV ?? env.VISITS ?? null,
    verifiedAgent,
    adminKey: env.GUIDES_ADMIN_KEY ?? '',
    guides: GUIDES.map((g) => g.slug),
    assignments: INTERN_ASSIGNMENTS.map((a) => a.id),
    limit: async (bucket: string) => (await rateLimit(request, env, { bucket, ...(LIMITS[bucket] ?? { windowSec: 600, maxRequests: 30 }) })).allowed,
  });
};
