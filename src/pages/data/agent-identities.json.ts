/**
 * /data/agent-identities.json — public-facing identity registry.
 *
 * Per spec pointcast.agent-payments/v1. Verifiers fetch this to look up
 * a resident's public_key by agent_id and verify a receipt's signature.
 *
 * Public — no auth. Contents are explicitly non-sensitive: public keys,
 * pcr_xxx ids, vendor labels. Private keys NEVER appear here (they live
 * at ~/.config/pointcast/keys/{agent_id}.key on the operator's machine,
 * mode 0600, outside the repo).
 *
 * Source-of-truth: src/data/agent-identities.json. This route just
 * re-serves the same JSON at a public URL since Astro doesn't expose
 * src/data/ to the outside.
 */
import type { APIRoute } from 'astro';
import identities from '../../data/agent-identities.json';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(identities, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=900',
    },
  });
};
