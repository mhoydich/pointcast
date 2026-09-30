/**
 * Shared plumbing for the shop's agents: the Clerk (/api/clerk), the Want Ads
 * board (/api/wants) and the Haggle Counter (/api/haggle).
 *
 * Shop data comes from the prerendered /shop/front.json (the guides stay the
 * source of truth), read through the Pages ASSETS binding when it exists.
 * Answers are signed with the same treasury Ed25519 key and canonical form as
 * the oracles, so an agent can cite a Clerk answer and anyone can verify it.
 */
import { canonicalJson, importReceiptPrivateKey, signCanonicalPayload, X402_TREASURY_AGENT_ID, X402_TREASURY_PUBLIC_KEY } from '../../src/lib/x402.ts';
import type { ShopFront } from '../../src/lib/shop-clerk.ts';

export type ShopEnv = Cloudflare.Env & {
  AUTH_DB?: D1Database;
  PC_RATES_KV?: KVNamespace;
  X402_RECEIPT_SK?: string;
  ASSETS?: { fetch: (request: Request | string) => Promise<Response> };
};

export const SHOP_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

export const shopJson = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { ...SHOP_HEADERS, ...extra } });

export const shopOptions = () => new Response(null, { status: 204, headers: SHOP_HEADERS });

let frontCache: { at: number; front: ShopFront } | null = null;

/** The shop front, from the static build. Cached per isolate for five minutes. */
export async function loadFront(request: Request, env: ShopEnv): Promise<ShopFront> {
  if (frontCache && Date.now() - frontCache.at < 300_000) return frontCache.front;
  const url = new URL('/shop/front.json', request.url).toString();
  const res = env.ASSETS ? await env.ASSETS.fetch(new Request(url)) : await fetch(url);
  if (!res.ok) throw new Error(`shop front unavailable (${res.status})`);
  const data = await res.json() as ShopFront;
  if (!Array.isArray(data?.picks) || !Array.isArray(data?.guides)) throw new Error('shop front has no picks');
  frontCache = { at: Date.now(), front: data };
  return data;
}

/** Sign a statement the way the oracle kit does. Unsigned, and saying so, when the key isn't set. */
export async function attestShop(env: ShopEnv, kind: string, body: Record<string, unknown>) {
  const statement = { kind, issuedAt: new Date().toISOString(), body };
  if (!env.X402_RECEIPT_SK) return { ...statement, attestation: { signed: false, reason: 'treasury signing key not configured on this deployment' } };
  try {
    const key = await importReceiptPrivateKey(env.X402_RECEIPT_SK);
    const signature = await signCanonicalPayload(canonicalJson(statement), key);
    return {
      ...statement,
      attestation: {
        signed: true, alg: 'Ed25519', signer: X402_TREASURY_AGENT_ID, publicKey: X402_TREASURY_PUBLIC_KEY, signature,
        canonicalization: 'pointcast canonicalJson of {kind, issuedAt, body}', verify: 'https://pointcast.xyz/api/x402/keys',
      },
    };
  } catch {
    return { ...statement, attestation: { signed: false, reason: 'signing failed on this deployment' } };
  }
}

export async function ipHash(request: Request): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const day = new Date().toISOString().slice(0, 10);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`pointcast-shop:v1:${day}:${ip}`));
  return [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

/** Plain text in, plain text out: trimmed, single-spaced, capped. Never rendered as HTML. */
export const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';

export async function readBody(request: Request, maxBytes = 8_192): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('request body too large');
  if (!text.trim()) return {};
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('body must be a JSON object');
  return parsed as Record<string, unknown>;
}

/** The storage tables exist? (0026_shop_agents.sql). Cached per isolate once true. */
let tablesReady = false;
export async function tablesExist(db: D1Database): Promise<boolean> {
  if (tablesReady) return true;
  try {
    const row = await db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name IN ('shop_wants','shop_offers','haggle_sessions')").first<{ n: number }>();
    tablesReady = Number(row?.n) === 3;
  } catch { tablesReady = false; }
  return tablesReady;
}
