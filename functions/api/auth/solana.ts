/**
 * SIWS auth stub.
 *
 * TODO:
 *  - Add nonce issuance and replay protection.
 *  - Standardize the message format for Solana wallet sign-in.
 *  - Verify the Ed25519 signature against the submitted public key/address.
 *  - Upsert a `phantom` identity and issue a PointCast session.
 */

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      ...(init?.headers ?? {}),
    },
  });
}

interface SolanaAuthBody {
  provider?: unknown;
  address?: unknown;
  message?: unknown;
  signature?: unknown;
}

interface Env {
  USERS?: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  let body: SolanaAuthBody;
  try {
    body = (await request.json()) as SolanaAuthBody;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const provider = typeof body.provider === 'string' ? body.provider : 'phantom';
  const address = typeof body.address === 'string' ? body.address : '';

  return json({
    ok: false,
    provider,
    address,
    status: 'coming-soon',
    reason: 'siws-not-implemented',
  }, { status: 501 });
};
