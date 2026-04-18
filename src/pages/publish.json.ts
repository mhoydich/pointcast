/**
 * /publish.json — static descriptor of the publishing system.
 *
 * Live queue of user-published thoughts comes later via /api/publish
 * (KV-backed). This JSON documents the protocol shape.
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    version: 'v1 · signed-payload queue',
    status: 'live · contract anchor pending',
    protocol: {
      step1: 'User writes title + body (title ≤ 80 chars, body ≤ 4,000 chars).',
      step2: 'Client computes SHA-256 of body. Builds payload: { type: "pc-publish-v1", title, body, sha256, timestamp, address }.',
      step3: 'Beacon wallet signs the payload (v1 stores the unsigned shape; next iter calls client.requestSignPayload).',
      step4: 'Signed payload persists to browser localStorage + POSTs to /api/publish (KV-backed when PC_PUBLISH_KV is bound).',
      step5: 'When the PointCast Dispatch FA2 contract lands, a batch process mints an NFT per queued payload, with the signature as provenance + IPFS copy as tokenURI.',
    },
    contractPending: {
      name: 'PointCast Dispatch FA2',
      chain: 'Tezos mainnet',
      standard: 'FA2 single-asset with public mint_with_signature entrypoint',
      status: 'contract not yet written — Mike decides whether to layer on existing Visit Nouns FA2 or spin a dedicated collection',
    },
    queueEndpoint: {
      url: 'https://pointcast.xyz/api/publish',
      method: 'POST',
      body: '{ type, title, body, sha256, timestamp, address }',
      responses: {
        200: 'accepted — payload queued',
        503: 'key-not-bound — KV namespace not yet configured',
        400: 'invalid payload shape or missing fields',
      },
    },
    moderation: {
      policy: 'zero-moderation by design',
      mechanism: 'content is signed by wallet + hashed; wallet is Sybil-gated by Visit Nouns holding (future). No comments, no threads, no editor.',
    },
    links: {
      human: 'https://pointcast.xyz/publish',
      rationale: 'https://pointcast.xyz/b/0243',
      dao: 'https://pointcast.xyz/dao',
      manifesto: 'https://pointcast.xyz/manifesto',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
