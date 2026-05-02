/**
 * /api/verify/spend/{id}.json — verify a Block's spend signature.
 *
 * Per spec pointcast.agent-payments/v1.
 *
 * Response shape:
 *   {
 *     block_id, agent_id, status: 'valid' | 'invalid' | 'unsigned',
 *     reason, public_key_used, signed_manifest_fields, spec,
 *     references: { block_url, identities_url, spec_url }
 *   }
 *
 * Public endpoint. No auth. Reads the static Block JSON + agent-identities
 * config + runs Ed25519 verify on the canonical manifest.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import identities from '../../../../data/agent-identities.json';
import { verifySpend, MANIFEST_FIELDS, SPEC_VERSION } from '../../../../lib/agent-signing.mjs';

export async function getStaticPaths() {
  const all = await getCollection('blocks');
  return all
    .filter((b) => (b.data as any).spend)
    .map((b) => ({ params: { id: b.data.id } }));
}

export const GET: APIRoute = async ({ params }) => {
  const all = await getCollection('blocks');
  const block = all.find((b) => b.data.id === params.id);
  if (!block || !(block.data as any).spend) {
    return json(404, { error: 'no spend block', block_id: params.id });
  }

  const spend = (block.data as any).spend;
  const result = verifySpend({ id: block.data.id, timestamp: (block.data as any).timestamp, spend }, identities);
  const status = !spend.signature ? 'unsigned' : (result.ok ? 'valid' : 'invalid');

  // Find which public_key was used (or would have been used) for verification.
  let publicKeyUsed: string | null = null;
  if (spend.agent_id) {
    for (const v of Object.values((identities as any).instances ?? {})) {
      if ((v as any).agent_id === spend.agent_id) {
        publicKeyUsed = (v as any).public_key ?? null;
        break;
      }
    }
  }

  const body = {
    block_id: block.data.id,
    block_url: `https://pointcast.xyz/b/${block.data.id}/`,
    agent: spend.agent ?? null,
    agent_id: spend.agent_id ?? null,
    payee_agent: spend.payee_agent ?? null,
    payee_agent_id: spend.payee_agent_id ?? null,
    status,
    reason: result.reason,
    spec: spend.spec ?? SPEC_VERSION,
    signing_alg: spend.signing_alg ?? null,
    signature_present: !!spend.signature,
    public_key_used: publicKeyUsed,
    signed_manifest_fields: MANIFEST_FIELDS.concat(['block_id', 'block_timestamp', 'spec']),
    timestamp: (block.data as any).timestamp,
    verified_at: new Date().toISOString(),
    references: {
      block: `https://pointcast.xyz/b/${block.data.id}/`,
      block_json: `https://pointcast.xyz/b/${block.data.id}.json`,
      money: 'https://pointcast.xyz/money',
      money_json: 'https://pointcast.xyz/money.json',
      issue: 'https://github.com/mhoydich/pointcast/issues/262',
    },
  };

  return json(200, body);
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300',
    },
  });
}
