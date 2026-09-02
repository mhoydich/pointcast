import contracts from '../../../src/data/contracts.json';
import type { AuthIdentity, PointCastUser } from '../../../src/lib/auth/types';
import {
  authJson,
  hasAuthStorage,
  readSessionFromRequest,
  type AuthEnv,
} from '../auth/session';

const TZKT_API = 'https://api.tzkt.io/v1';
const CACHE_TTL_SECONDS = 60;
const TEZOS_ADDRESS = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;

type ContractRecord = {
  mainnet?: string;
  symbol?: string;
};

type CollectionDescriptor = {
  slug: string;
  name: string;
  href: string;
  contract: string;
  symbol: string;
};

type TzktTokenBalance = {
  balance?: string;
  token?: {
    tokenId?: string;
    contract?: { address?: string; alias?: string };
    metadata?: {
      name?: string;
      description?: string;
      artifactUri?: string;
      displayUri?: string;
      thumbnailUri?: string;
      symbol?: string;
    };
  };
};

export type MeHoldingToken = {
  tokenId: string;
  balance: string;
  name: string;
  description: string | null;
  thumbnailUrl: string;
  displayUrl: string | null;
  objktUrl: string;
  tzktUrl: string;
};

export type MeCollectionHoldings = CollectionDescriptor & {
  tokenBalanceCount: number;
  unitBalance: string;
  tokens: MeHoldingToken[];
};

export type MeWalletHoldings = {
  address: string;
  tzktUrl: string;
  totalTokenBalanceCount: number;
  everythingElseCount: number;
  collections: MeCollectionHoldings[];
  cache: 'hit' | 'miss' | 'unavailable';
  error?: string;
};

export type MeHoldingsPayload = {
  ok: true;
  user: PointCastUser;
  wallets: MeWalletHoldings[];
  collections: CollectionDescriptor[];
  generatedAt: string;
  cacheTtlSeconds: number;
};

type CacheLike = Pick<Cache, 'match' | 'put'>;
type Fetcher = typeof fetch;

const COLLECTION_LABELS: Record<string, { name: string; href: string }> = {
  visit_nouns: { name: 'Visit Nouns', href: '/visit-nouns' },
  coffee_mugs: { name: 'Coffee Mugs', href: '/coffee' },
  kennel_club: { name: 'Kennel Club', href: '/kennel-club' },
  passport_stamps: { name: 'Passport Stamps', href: '/passport' },
  seals: { name: 'Passport Seals', href: '/townsfolk' },
  signal_stamps: { name: 'Signal Stamps', href: '/25/collect/signal-stamps' },
  window_snapshots: { name: 'Window Snapshots', href: '/snapshots' },
  birthdays: { name: 'Birthday Cards', href: '/cake' },
  postcards: { name: 'Postcards', href: '/postcards' },
  zen_cats: { name: 'Zen Cats', href: '/zen-cats' },
  morning_ocean: { name: 'Morning Ocean', href: '/morning-ocean' },
  drum_token: { name: 'Drum Token', href: '/drum' },
  agent_derby_receipts: { name: 'Agent Derby Receipts', href: '/agent-derby' },
  derby_picks: { name: 'Derby Picks', href: '/roses' },
};

const NON_COLLECTION_CONTRACTS = new Set(['marketplace']);

function titleCase(value: string): string {
  return value
    .split('_')
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ');
}

export function pointCastCollections(): CollectionDescriptor[] {
  return Object.entries(contracts as Record<string, unknown>)
    .flatMap(([slug, raw]) => {
      if (NON_COLLECTION_CONTRACTS.has(slug) || !raw || typeof raw !== 'object') return [];
      const record = raw as ContractRecord;
      const contract = record.mainnet?.trim() ?? '';
      if (!contract.startsWith('KT1')) return [];
      const label = COLLECTION_LABELS[slug];
      return [{
        slug,
        name: label?.name ?? titleCase(slug),
        href: label?.href ?? '/',
        contract,
        symbol: record.symbol ?? '',
      }];
    });
}

export function tezosIdentities(identities: AuthIdentity[]): string[] {
  const addresses = identities
    .filter((identity) => identity.provider === 'kukai' || identity.id.startsWith('tz'))
    .map((identity) => identity.id.trim())
    .filter((address) => TEZOS_ADDRESS.test(address));
  return [...new Set(addresses)];
}

export function ipfsGatewayUrl(uri: string | null | undefined): string | null {
  const value = uri?.trim();
  if (!value) return null;
  if (!value.startsWith('ipfs://')) return value;
  const path = value.slice('ipfs://'.length).replace(/^ipfs\//, '');
  return path ? `https://ipfs.io/ipfs/${path}` : null;
}

function fallbackThumbnail(collection: CollectionDescriptor, tokenId: string): string {
  if (collection.slug === 'visit_nouns' && /^\d+$/.test(tokenId)) {
    return `https://noun.pics/${tokenId}.svg`;
  }
  if (collection.slug === 'coffee_mugs') {
    const slug = ['ceramic', 'espresso', 'latte', 'paper', 'bistro'][Number(tokenId)];
    if (slug) return `/images/coffee-mugs/${slug}.svg`;
  }
  return `https://assets.objkt.media/file/assets-003/${collection.contract}/${encodeURIComponent(tokenId)}/thumb400`;
}

function normalizeToken(
  collection: CollectionDescriptor,
  row: TzktTokenBalance,
): MeHoldingToken | null {
  const tokenId = row.token?.tokenId;
  const balance = row.balance;
  if (typeof tokenId !== 'string' || typeof balance !== 'string' || BigInt(balance) <= 0n) return null;
  const metadata = row.token?.metadata ?? {};
  const displayUrl = ipfsGatewayUrl(
    metadata.displayUri ?? metadata.thumbnailUri ?? metadata.artifactUri,
  );
  return {
    tokenId,
    balance,
    name: metadata.name?.trim() || `${collection.name} #${tokenId}`,
    description: metadata.description?.trim() || null,
    thumbnailUrl: ipfsGatewayUrl(metadata.thumbnailUri) ?? displayUrl ?? fallbackThumbnail(collection, tokenId),
    displayUrl,
    objktUrl: `https://objkt.com/tokens/${collection.contract}/${encodeURIComponent(tokenId)}`,
    tzktUrl: `https://tzkt.io/${collection.contract}/tokens/${encodeURIComponent(tokenId)}`,
  };
}

async function readJson<T>(url: string, fetcher: Fetcher): Promise<T> {
  const response = await fetcher(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`tzkt-${response.status}`);
  return response.json() as Promise<T>;
}

function addressCacheKey(address: string, collections: CollectionDescriptor[]): Request {
  const contractVersion = collections.map((collection) => collection.contract).sort().join('.');
  return new Request(`https://pointcast.internal/me/holdings/${address}?contracts=${encodeURIComponent(contractVersion)}`);
}

async function fetchFreshWalletHoldings(
  address: string,
  collections: CollectionDescriptor[],
  fetcher: Fetcher,
): Promise<Omit<MeWalletHoldings, 'cache'>> {
  const totalUrl = new URL(`${TZKT_API}/tokens/balances/count`);
  totalUrl.searchParams.set('account', address);
  totalUrl.searchParams.set('balance.gt', '0');

  const collectionReads = collections.map(async (collection) => {
    const url = new URL(`${TZKT_API}/tokens/balances`);
    url.searchParams.set('account', address);
    url.searchParams.set('token.contract', collection.contract);
    url.searchParams.set('balance.gt', '0');
    url.searchParams.set('limit', '10000');
    const rows = await readJson<TzktTokenBalance[]>(url.toString(), fetcher);
    const tokens = rows
      .map((row) => normalizeToken(collection, row))
      .filter((token): token is MeHoldingToken => token !== null)
      .sort((a, b) => Number(a.tokenId) - Number(b.tokenId));
    const unitBalance = tokens.reduce((sum, token) => sum + BigInt(token.balance), 0n).toString();
    return {
      ...collection,
      tokenBalanceCount: tokens.length,
      unitBalance,
      tokens,
    } satisfies MeCollectionHoldings;
  });

  const [totalTokenBalanceCount, collectionHoldings] = await Promise.all([
    readJson<number>(totalUrl.toString(), fetcher),
    Promise.all(collectionReads),
  ]);
  const pointCastTokenBalanceCount = collectionHoldings.reduce(
    (sum, collection) => sum + collection.tokenBalanceCount,
    0,
  );

  return {
    address,
    tzktUrl: `https://tzkt.io/${address}/tokens`,
    totalTokenBalanceCount,
    everythingElseCount: Math.max(0, totalTokenBalanceCount - pointCastTokenBalanceCount),
    collections: collectionHoldings,
  };
}

export async function getWalletHoldings(
  address: string,
  options: {
    collections?: CollectionDescriptor[];
    fetcher?: Fetcher;
    cache?: CacheLike | null;
  } = {},
): Promise<MeWalletHoldings> {
  const collectionList = options.collections ?? pointCastCollections();
  const fetcher = options.fetcher ?? fetch;
  const cache = options.cache ?? null;
  const cacheKey = addressCacheKey(address, collectionList);

  if (cache) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return { ...(await cached.json() as Omit<MeWalletHoldings, 'cache'>), cache: 'hit' };
      }
    } catch {
      // The Cache API is an optimization. A cache outage must not block live holdings.
    }
  }

  try {
    const fresh = await fetchFreshWalletHoldings(address, collectionList, fetcher);
    if (cache) {
      try {
        await cache.put(cacheKey, Response.json(fresh, {
          headers: { 'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}` },
        }));
      } catch {
        // Serve the fresh payload even when the edge cache cannot persist it.
      }
    }
    return { ...fresh, cache: 'miss' };
  } catch (error) {
    return {
      address,
      tzktUrl: `https://tzkt.io/${address}/tokens`,
      totalTokenBalanceCount: 0,
      everythingElseCount: 0,
      collections: collectionList.map((collection) => ({
        ...collection,
        tokenBalanceCount: 0,
        unitBalance: '0',
        tokens: [],
      })),
      cache: 'unavailable',
      error: error instanceof Error ? error.message : 'tzkt-unavailable',
    };
  }
}

export async function getMeHoldingsPayload(
  user: PointCastUser,
  options: { fetcher?: Fetcher; cache?: CacheLike | null } = {},
): Promise<MeHoldingsPayload> {
  const collections = pointCastCollections();
  const addresses = tezosIdentities(user.identities);
  const wallets = await Promise.all(addresses.map((address) => getWalletHoldings(address, {
    collections,
    fetcher: options.fetcher,
    cache: options.cache,
  })));
  return {
    ok: true,
    user,
    wallets,
    collections,
    generatedAt: new Date().toISOString(),
    cacheTtlSeconds: CACHE_TTL_SECONDS,
  };
}

export async function meHoldingsResponse(
  request: Request,
  env: AuthEnv,
): Promise<Response> {
  if (!hasAuthStorage(env)) {
    return authJson({ ok: false, reason: 'auth-storage-not-bound' }, { status: 500 });
  }
  const current = await readSessionFromRequest(request, env);
  if (!current) {
    return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  const cache = typeof caches === 'undefined' ? null : caches.default;
  const payload = await getMeHoldingsPayload(current.user, { cache });
  return authJson(payload, {
    headers: {
      'Cache-Control': 'private, no-store',
      Vary: 'Cookie',
    },
  });
}
