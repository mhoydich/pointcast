/**
 * POST /api/link/spend — agent-facing spend request endpoint.
 *
 * SCAFFOLDING. v0 status: file exists, not yet wired to a live link-cli.
 * Will activate when:
 *   1. Mike runs `link-cli onboard` and produces a `csmrpd_xxx` payment-
 *      method-id (per docs/proposals/2026-04-30-link-agent-payments.md).
 *   2. `LINK_PAYMENT_METHOD_ID` is set in wrangler.toml [vars].
 *   3. The Cloudflare Worker runtime exposes `child_process.spawn` — which
 *      it does NOT. This route is therefore Node-only; it cannot run on
 *      the edge. v0 deployment plan: run as a separate Node service called
 *      from PointCast's Worker via fetch, OR run agents locally and have
 *      them shell-out without going through this route at all.
 *      The simpler v0 is the latter — local agents calling link-cli
 *      directly, then POSTing the receipt up to /api/link/receipt to write
 *      the Block. This file is kept as the placeholder for the eventual
 *      hosted variant.
 *
 * Auth: a shared secret in `LINK_AGENT_TOKEN` env, sent in the
 * `Authorization: Bearer ...` header. Token rotation via wrangler.
 *
 * Request body (JSON):
 *   {
 *     agent: 'codex' | 'claude' | 'manus',
 *     loop:  'scout' | 'producer' | ...,
 *     amount_usd: number,
 *     merchant: string,
 *     merchant_url: string,
 *     context: string  // >= 100 chars, user-facing approval blurb
 *   }
 *
 * Returns: SpendRequestResult JSON, or 4xx with error message.
 */
import type { APIRoute } from 'astro';
import { createSpendRequest, type SpendRequestInput } from '../../../lib/link';

export const POST: APIRoute = async ({ request }) => {
  // v0 hard-disable: prevent accidental activation before the env wiring is done.
  // Flip this off in a follow-up PR after Mike's onboard + wrangler env land.
  if (process.env.LINK_SPEND_ENDPOINT_ENABLED !== 'true') {
    return json(503, {
      error: 'link-spend-endpoint-disabled',
      message: 'POST /api/link/spend is scaffolding. Enable via LINK_SPEND_ENDPOINT_ENABLED=true after onboard + payment-method-id are wired. See src/pages/api/link/spend.ts.',
    });
  }

  const auth = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${process.env.LINK_AGENT_TOKEN ?? ''}`;
  if (!process.env.LINK_AGENT_TOKEN || auth !== expected) {
    return json(401, { error: 'unauthorized' });
  }

  let body: SpendRequestInput;
  try {
    body = await request.json() as SpendRequestInput;
  } catch {
    return json(400, { error: 'invalid-json' });
  }

  try {
    const result = await createSpendRequest(body);
    return json(200, result);
  } catch (err) {
    return json(400, { error: 'spend-failed', message: (err as Error).message });
  }
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
