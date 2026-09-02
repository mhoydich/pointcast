/**
 * /api/burst — the site-wide ephemeral presence bus.
 *
 * GET upgrades to the global PresenceRoom WebSocket (or returns its memory
 * tail without Upgrade). POST forwards typed events. Mint events are the one
 * privileged shape: the operation must exist as an applied Kennel Club mint
 * transaction in TzKT before the Durable Object is allowed to broadcast it.
 */
import { KENNEL_CLUB_CONTRACT } from '../../src/lib/kennel-club-mint';

interface Env {
  PRESENCE?: DurableObjectNamespace;
  AUTH_DB?: D1Database;
}

type BurstBody = {
  kind?: unknown;
  clientId?: unknown;
  by?: unknown;
  meta?: unknown;
};

type TzktTransaction = {
  status?: string;
  sender?: { address?: string } | string;
  target?: { address?: string } | string;
  parameter?: { entrypoint?: string };
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' },
  });
}

function addressOf(value: TzktTransaction['sender']): string {
  if (typeof value === 'string') return value;
  return typeof value?.address === 'string' ? value.address : '';
}

function publicFirstName(value: unknown): string {
  const candidate = typeof value === 'string' ? value.trim().split(/\s+/)[0] : '';
  if (!candidate || candidate.includes('@') || candidate.startsWith('tz')) return 'Member';
  return candidate.replace(/[^\p{L}\p{M}'’-]/gu, '').slice(0, 30) || 'Member';
}

async function verifiedClaimName(db: D1Database | undefined, opHash: string): Promise<string | null> {
  if (!db) return null;
  const row = await db.prepare(`
    SELECT json_extract(u.payload, '$.preferredName') AS preferred_name
    FROM claims c
    JOIN users u ON u.id = c.user_id
    WHERE c.op_hash = ? AND c.status IN ('held', 'delivered')
    LIMIT 1
  `).bind(opHash).first<{ preferred_name: string | null }>();
  return row ? publicFirstName(row.preferred_name) : null;
}

export async function verifyKennelMint(
  opHash: string,
  fetcher: typeof fetch = fetch,
): Promise<{ ok: boolean; sender?: string }> {
  if (!/^o[1-9A-HJ-NP-Za-km-z]{50}$/.test(opHash)) return { ok: false };
  const response = await fetcher(`https://api.tzkt.io/v1/operations/transactions/${encodeURIComponent(opHash)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return { ok: false };
  const payload = await response.json();
  if (!Array.isArray(payload)) return { ok: false };
  const transaction = (payload as TzktTransaction[]).find((item) =>
    item?.status === 'applied' &&
    addressOf(item.target) === KENNEL_CLUB_CONTRACT &&
    item.parameter?.entrypoint === 'mint',
  );
  return transaction ? { ok: true, sender: addressOf(transaction.sender) || undefined } : { ok: false };
}

async function forward(request: Request, env: Env): Promise<Response> {
  if (!env.PRESENCE) return json({ ok: false, reason: 'presence-unbound' }, 503);
  const id = env.PRESENCE.idFromName('global');
  const stub = env.PRESENCE.get(id);
  const url = new URL(request.url);
  url.pathname = '/burst';
  return stub.fetch(new Request(url.toString(), request));
}

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, { status: 204, headers: { ...CORS_HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    return await forward(request, env);
  } catch (error) {
    console.error('[api/burst] presence forward failed', error);
    return json({ ok: false, reason: 'presence-unavailable' }, 503);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: BurstBody;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, reason: 'invalid-json' }, 400);
  }

  if (body.kind === 'mint' || body.kind === 'claim') {
    const meta = body.meta && typeof body.meta === 'object' ? body.meta as Record<string, unknown> : {};
    const opHash = typeof meta.opHash === 'string' ? meta.opHash.trim() : '';
    let verified: { ok: boolean; sender?: string };
    try {
      verified = await verifyKennelMint(opHash);
    } catch (error) {
      console.error('[api/burst] TzKT verification failed', error);
      return json({ ok: false, reason: 'tzkt-unavailable' }, 503);
    }
    if (!verified.ok) return json({ ok: false, reason: 'mint-not-verified' }, 409);
    const claimName = body.kind === 'claim'
      ? await verifiedClaimName(env.AUTH_DB, opHash)
      : null;
    if (body.kind === 'claim' && !claimName) {
      return json({ ok: false, reason: 'claim-not-verified' }, 409);
    }
    body = {
      ...body,
      by: { handle: claimName || verified.sender || 'collector' },
      meta: { ...meta, opHash, contract: KENNEL_CLUB_CONTRACT, verifiedBy: 'TzKT' },
    };
  }

  try {
    return await forward(new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': request.headers.get('CF-Connecting-IP') || '' },
      body: JSON.stringify(body),
    }), env);
  } catch (error) {
    console.error('[api/burst] presence forward failed', error);
    return json({ ok: false, reason: 'presence-unavailable' }, 503);
  }
};
