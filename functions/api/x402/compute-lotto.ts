/**
 * /api/x402/compute-lotto — x402 facilitator for Compute Lotto agent entries.
 *
 * v0 scaffold. Real flow lands when ComputeLotto.sol is deployed to Base +
 * the facilitator relayer keypair is funded. For now, this endpoint:
 *
 *   - GET : returns the service manifest (mirror of /.well-known/x402/compute-lotto.json).
 *   - POST: responds with HTTP 402 + a machine-readable payment challenge,
 *           then (post-deploy) accepts the payment receipt + calls
 *           buyTicketForAgent on the contract via the relayer.
 *
 * CORS open. Rate limits: session-scoped via cookie + IP, mirrors the
 * pattern in functions/api/tank/_shared.ts on the Tezos side.
 */

export interface Env {
  // Populated post-deploy. Currently all stubbed.
  COMPUTE_LOTTO_RELAYER_KEY?: string;
  COMPUTE_LOTTO_CONTRACT?: string;
  COMPUTE_LOTTO_RPC?: string;
}

const MANIFEST = {
  schema: 'x402-service-v1',
  service: 'compute-lotto',
  description:
    "PointCast Compute Lotto agent-entry facilitator. Pay via x402 to register an agent-class ticket in the current weekly epoch. Winners (drawn via Chainlink VRF at epoch end) receive compute credits.",
  chain: 'base',
  currency: 'usdc',
  price_per_ticket_usdc_units: 1_000_000,
  price_per_ticket_display: '1.00 USDC',
  status: 'scaffold-awaiting-deploy',
};

function cors(extra: HeadersInit = {}): HeadersInit {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Payment, X-Agent-Addr',
    ...extra,
  };
}

export async function onRequest(ctx: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = ctx;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (method === 'GET' || method === 'HEAD') {
    return new Response(JSON.stringify(MANIFEST, null, 2), {
      status: 200,
      headers: cors({ 'Cache-Control': 'public, max-age=300' }),
    });
  }

  if (method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method' }), {
      status: 405,
      headers: cors(),
    });
  }

  // Contract not yet deployed — return 402 with manifest + deploy-pending note.
  if (!env.COMPUTE_LOTTO_CONTRACT) {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: 'not-deployed',
          status: 'scaffold-awaiting-deploy',
          manifest: MANIFEST,
          note: 'ComputeLotto.sol is scaffolded at contracts/v2/compute_lotto.sol. Deploy + bind COMPUTE_LOTTO_CONTRACT + COMPUTE_LOTTO_RELAYER_KEY env vars in the Pages dashboard to activate.',
        },
        null,
        2,
      ),
      {
        status: 503,
        headers: cors(),
      },
    );
  }

  // Post-deploy flow:
  //   1. Parse the incoming x402 payment (X-Payment header or JSON body).
  //   2. Verify USDC payment has cleared to the facilitator address on Base.
  //   3. Pull the agent wallet address from X-Agent-Addr (or derive from payment payload).
  //   4. Call buyTicketForAgent(agentAddr, ticketCount, usdcAmount) on the contract
  //      from the relayer keypair (env.COMPUTE_LOTTO_RELAYER_KEY).
  //   5. Return the epoch + ticket count + tx hash.
  //
  // The write-path implementation lands with the deploy sprint. For v0
  // this POST returns 501 with a pointer to the brief.

  return new Response(
    JSON.stringify(
      {
        ok: false,
        error: 'not-implemented',
        status: 'facilitator-pending',
        note: 'POST handler lands in the follow-up sprint alongside the mainnet deploy. See docs/briefs/2026-04-21-compute-lotto-spec.md §x402 facilitator.',
        manifest: MANIFEST,
      },
      null,
      2,
    ),
    {
      status: 501,
      headers: cors(),
    },
  );
}
