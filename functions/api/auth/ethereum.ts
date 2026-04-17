/**
 * SIWE auth stub.
 *
 * TODO:
 *  - Add a nonce endpoint and persist nonce consumption server-side.
 *  - Parse a proper EIP-4361 SIWE message.
 *  - Verify the recovered Ethereum address from the signature.
 *  - Upsert an identity with provider `metamask` (or wallet-specific EVM
 *    providers) and issue a PointCast session through `session.ts`.
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

interface EthereumAuthBody {
  provider?: unknown;
  address?: unknown;
  chainId?: unknown;
  message?: unknown;
  signature?: unknown;
}

interface Env {
  USERS?: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  let body: EthereumAuthBody;
  try {
    body = (await request.json()) as EthereumAuthBody;
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const provider = typeof body.provider === 'string' ? body.provider : 'metamask';
  const address = typeof body.address === 'string' ? body.address : '';

  return json({
    ok: false,
    provider,
    address,
    status: 'coming-soon',
    reason: 'siwe-not-implemented',
  }, { status: 501 });
};
