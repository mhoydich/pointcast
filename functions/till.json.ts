import { PROJECT_SAFE_ADDRESS, PROJECT_SAFE_TZKT } from '../src/lib/till.ts';
import { getPaidTotals, getPaidTotalsByAction } from './_lib/x402-gate.ts';

type TillEnv = { AUTH_DB?: D1Database };

interface CacheLike {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

interface TzktAccount {
  balance?: unknown;
}

interface SafeBalance {
  available: boolean;
  balanceMutez: number | null;
  balanceTez: number | null;
  cachedAt: string | null;
  cached: boolean;
}

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

function balanceCacheKey(): Request {
  return new Request(`https://pointcast.xyz/.edge-cache/till/${PROJECT_SAFE_ADDRESS}`);
}

function parseBalance(value: unknown): number | null {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

async function cachedBalance(cache: CacheLike | undefined): Promise<SafeBalance | null> {
  if (!cache) return null;
  const response = await cache.match(balanceCacheKey());
  if (!response) return null;
  try {
    const payload = await response.json() as SafeBalance;
    const balanceMutez = parseBalance(payload.balanceMutez);
    if (balanceMutez === null || typeof payload.cachedAt !== 'string') return null;
    return { ...payload, balanceMutez, balanceTez: balanceMutez / 1_000_000, cached: true };
  } catch {
    return null;
  }
}

export async function getProjectSafeBalance(
  fetcher: typeof fetch = fetch,
  cache?: CacheLike,
): Promise<SafeBalance> {
  const hit = await cachedBalance(cache);
  if (hit) return hit;

  const response = await fetcher(`https://api.tzkt.io/v1/accounts/${PROJECT_SAFE_ADDRESS}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`TzKT returned HTTP ${response.status}`);
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > 65_536) throw new Error('TzKT account response too large');
  const account = await response.json() as TzktAccount;
  const balanceMutez = parseBalance(account.balance);
  if (balanceMutez === null) throw new Error('TzKT account response has no valid balance');
  const value: SafeBalance = {
    available: true,
    balanceMutez,
    balanceTez: balanceMutez / 1_000_000,
    cachedAt: new Date().toISOString(),
    cached: false,
  };
  if (cache) {
    await cache.put(balanceCacheKey(), Response.json(value, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    }));
  }
  return value;
}

export async function handleTillJson(
  env: TillEnv,
  options: { fetcher?: typeof fetch; cache?: CacheLike } = {},
): Promise<Response> {
  const runtimeCaches = typeof caches === 'undefined'
    ? undefined
    : caches as CacheStorage & { default?: CacheLike };
  const defaultCache = runtimeCaches?.default;
  const [balance, totals, byAction] = await Promise.all([
    getProjectSafeBalance(options.fetcher, options.cache ?? defaultCache).catch((error) => ({
      available: false,
      balanceMutez: null,
      balanceTez: null,
      cachedAt: null,
      cached: false,
      error: error instanceof Error ? error.message : String(error),
    })),
    getPaidTotals(env.AUTH_DB).catch(() => ({ count: 0, houseUnits: 0, networkUnits: 0 })),
    getPaidTotalsByAction(env.AUTH_DB).catch(() => []),
  ]);

  return new Response(JSON.stringify({
    spec: 'pointcast.till/v1',
    canonical: 'https://pointcast.xyz/till',
    json: 'https://pointcast.xyz/till.json',
    safe: {
      address: PROJECT_SAFE_ADDRESS,
      chain: 'Tezos',
      network: 'mainnet',
      tzkt: PROJECT_SAFE_TZKT,
      balance,
      balanceCacheSeconds: 300,
    },
    ledger: {
      chain: 'Etherlink',
      network: 'eip155:42793',
      asset: 'USDC',
      configured: Boolean(env.AUTH_DB),
      totals,
      byAction,
      note: 'The 50/50 split is recorded here; USDC is not moved cross-chain to the Tezos safe.',
    },
  }, null, 2), { headers: HEADERS });
}

export const onRequestOptions: PagesFunction<TillEnv> = () =>
  new Response(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestGet: PagesFunction<TillEnv> = async ({ env }) => handleTillJson(env);
