import contracts from '../../../src/data/contracts.json';
import manualQueue from '../../../src/data/director-queue.json';
import { collectSitting } from '../../../src/lib/collect-desk';
import { readSessionFromRequest, authJson, type AuthEnv } from '../auth/session';
import { claimDailyCap } from '../kennel-club/_claims';

interface DirectorEnv extends AuthEnv {
  KENNEL_CLUB_CLAIM_DAILY_CAP?: string;
}

interface CacheLike {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

interface ChainSnapshot {
  kennel: { treasury: string | null; available: boolean };
  sealsV2: { paused: boolean | null; available: boolean; address: string };
  readAt: string;
  cached: boolean;
}

export interface DirectorQueueRow {
  id: string;
  source: 'chain' | 'registry' | 'd1' | 'manual';
  what: string;
  why: string;
  href: string;
  done: boolean;
  state: 'open' | 'done' | 'unknown' | 'info';
  value?: string;
}

const TzKT = 'https://api.tzkt.io/v1/contracts';
const MAX_CHAIN_RESPONSE_BYTES = 65_536;
const CHAIN_CACHE_SECONDS = 60;

function mainnetAddress(key: string): string {
  const record = (contracts as Record<string, { mainnet?: unknown }>)[key];
  return typeof record?.mainnet === 'string' ? record.mainnet.trim() : '';
}

function betterCall(address: string): string {
  return `https://better-call.dev/mainnet/${address}`;
}

function cacheKey(kennel: string, sealsV2: string): Request {
  return new Request(`https://pointcast.xyz/.edge-cache/director/chain-v1/${kennel}/${sealsV2 || 'unregistered'}`);
}

async function boundedJson(response: Response): Promise<Record<string, unknown>> {
  if (!response.ok) throw new Error(`TzKT returned HTTP ${response.status}`);
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > MAX_CHAIN_RESPONSE_BYTES) throw new Error('TzKT response too large');
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_CHAIN_RESPONSE_BYTES) {
    throw new Error('TzKT response too large');
  }
  const parsed = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid TzKT storage');
  return parsed as Record<string, unknown>;
}

async function readStorage(address: string, fetcher: typeof fetch): Promise<Record<string, unknown>> {
  return boundedJson(await fetcher(`${TzKT}/${address}/storage`, {
    headers: { Accept: 'application/json' },
  }));
}

async function cachedSnapshot(cache: CacheLike | undefined, kennel: string, sealsV2: string): Promise<ChainSnapshot | null> {
  if (!cache) return null;
  const hit = await cache.match(cacheKey(kennel, sealsV2));
  if (!hit) return null;
  try {
    const value = await hit.json() as ChainSnapshot;
    if (!value?.kennel || !value?.sealsV2 || typeof value.readAt !== 'string') return null;
    return { ...value, cached: true };
  } catch {
    return null;
  }
}

export async function getDirectorChainSnapshot(
  options: {
    fetcher?: typeof fetch;
    cache?: CacheLike;
    waitUntil?: (promise: Promise<unknown>) => void;
  } = {},
): Promise<ChainSnapshot> {
  const kennel = mainnetAddress('kennel_club');
  const sealsV2 = mainnetAddress('seal_soulbound_v2');
  const hit = await cachedSnapshot(options.cache, kennel, sealsV2);
  if (hit) return hit;

  const fetcher = options.fetcher ?? fetch;
  const [kennelResult, sealsResult] = await Promise.allSettled([
    kennel ? readStorage(kennel, fetcher) : Promise.reject(new Error('kennel contract unregistered')),
    sealsV2 ? readStorage(sealsV2, fetcher) : Promise.resolve(null),
  ]);
  const kennelStorage = kennelResult.status === 'fulfilled' ? kennelResult.value : null;
  const sealsStorage = sealsResult.status === 'fulfilled' ? sealsResult.value : null;
  const snapshot: ChainSnapshot = {
    kennel: {
      treasury: typeof kennelStorage?.treasury === 'string' ? kennelStorage.treasury : null,
      available: Boolean(kennelStorage),
    },
    sealsV2: {
      paused: typeof sealsStorage?.paused === 'boolean' ? sealsStorage.paused : null,
      available: sealsV2 ? Boolean(sealsStorage) : true,
      address: sealsV2,
    },
    readAt: new Date().toISOString(),
    cached: false,
  };

  if (options.cache) {
    const write = options.cache.put(cacheKey(kennel, sealsV2), Response.json(snapshot, {
      headers: { 'Cache-Control': `public, max-age=${CHAIN_CACHE_SECONDS}` },
    }));
    if (options.waitUntil) options.waitUntil(write);
    else await write;
  }
  return snapshot;
}

async function countRow(db: D1Database | undefined, sql: string, value?: unknown): Promise<number | null> {
  if (!db) return null;
  try {
    const statement = value === undefined ? db.prepare(sql) : db.prepare(sql).bind(value);
    const row = await statement.first<{ count: number }>();
    const count = Number(row?.count);
    return Number.isSafeInteger(count) && count >= 0 ? count : 0;
  } catch {
    return null;
  }
}

export async function buildDirectorQueue(
  env: DirectorEnv,
  options: {
    fetcher?: typeof fetch;
    cache?: CacheLike;
    waitUntil?: (promise: Promise<unknown>) => void;
  } = {},
): Promise<{ rows: DirectorQueueRow[]; chain: ChainSnapshot }> {
  const sitting = collectSitting();
  const cap = claimDailyCap(env.KENNEL_CLUB_CLAIM_DAILY_CAP);
  const [chain, todayClaims, subscribers, aliases] = await Promise.all([
    getDirectorChainSnapshot(options),
    countRow(env.AUTH_DB, 'SELECT COUNT(*) AS count FROM claims WHERE token_id = ? AND status != \'failed\'', sitting.tokenId),
    countRow(env.AUTH_DB, "SELECT COUNT(*) AS count FROM subscribers WHERE status = 'confirmed'"),
    countRow(env.AUTH_DB, "SELECT COUNT(*) AS count FROM aliases WHERE status = 'active' AND expires_at > ?", new Date().toISOString()),
  ]);

  const safe = mainnetAddress('project_multisig');
  const kennel = mainnetAddress('kennel_club');
  const treasuryKnown = chain.kennel.available && Boolean(chain.kennel.treasury);
  const treasuryDone = treasuryKnown && chain.kennel.treasury === safe;
  const rows: DirectorQueueRow[] = [{
    id: 'kennel-treasury-safe',
    source: 'chain',
    what: treasuryDone ? 'Kennel Club treasury points to the safe' : 'set_treasury → safe',
    why: treasuryDone
      ? 'Kennel Club mint proceeds now land at the project multisig.'
      : 'Kennel Club mint proceeds still point somewhere other than the project multisig.',
    href: betterCall(kennel),
    done: treasuryDone,
    state: treasuryKnown ? (treasuryDone ? 'done' : 'open') : 'unknown',
    value: treasuryKnown ? `${chain.kennel.treasury} → ${safe}` : 'chain read unavailable',
  }];

  const sealsV2 = mainnetAddress('seal_soulbound_v2');
  if (sealsV2) {
    const pausedKnown = chain.sealsV2.available && chain.sealsV2.paused !== null;
    const unpaused = pausedKnown && chain.sealsV2.paused === false;
    rows.push({
      id: 'seals-v2-unpause',
      source: 'chain',
      what: unpaused ? 'Seals v2 is unpaused' : 'unpause seals v2',
      why: unpaused ? 'The v2 issuer path is open.' : 'The originated v2 contract is still paused.',
      href: betterCall(sealsV2),
      done: unpaused,
      state: pausedKnown ? (unpaused ? 'done' : 'open') : 'unknown',
      value: pausedKnown ? `paused = ${String(chain.sealsV2.paused)}` : 'chain read unavailable',
    });
  }

  for (const [key, record] of Object.entries(contracts)) {
    if (key.startsWith('_') || !record || typeof record !== 'object' || !('mainnet' in record)) continue;
    if (typeof record.mainnet === 'string' && record.mainnet.trim() === '') {
      rows.push({
        id: `contract-${key}`,
        source: 'registry',
        what: `Register ${key.replaceAll('_', ' ')} on mainnet`,
        why: 'This registered contract still has an empty mainnet address.',
        href: `/admin/deploy/new?prefill=${encodeURIComponent(key)}`,
        done: false,
        state: 'open',
      });
    }
  }

  rows.push(
    {
      id: 'today-claims',
      source: 'd1',
      what: `${sitting.name}: today’s free claims`,
      why: 'Daily free-claim capacity at the Kennel Club claim desk.',
      href: '/kennel-club',
      done: todayClaims !== null && todayClaims >= cap,
      state: todayClaims === null ? 'unknown' : 'info',
      value: todayClaims === null ? `unavailable / ${cap}` : `${todayClaims} / ${cap}`,
    },
    {
      id: 'confirmed-subscribers',
      source: 'd1',
      what: 'Confirmed dog-a-day subscribers',
      why: 'People with a confirmed email subscription to the September sitting.',
      href: '/collect',
      done: true,
      state: subscribers === null ? 'unknown' : 'info',
      value: subscribers === null ? 'unavailable' : String(subscribers),
    },
    {
      id: 'post-office-aliases',
      source: 'd1',
      what: 'Active post-office aliases',
      why: 'Paid agent mailboxes currently registered in the town post office.',
      href: '/post-office',
      done: true,
      state: aliases === null ? 'unknown' : 'info',
      value: aliases === null ? 'unavailable' : String(aliases),
    },
  );

  rows.push(...manualQueue.map((item) => ({
    ...item,
    source: 'manual' as const,
    done: false,
    state: 'open' as const,
  })));
  return { rows, chain };
}

export async function handleDirectorQueue(
  request: Request,
  env: DirectorEnv,
  options: {
    fetcher?: typeof fetch;
    cache?: CacheLike;
    waitUntil?: (promise: Promise<unknown>) => void;
  } = {},
): Promise<Response> {
  const current = await readSessionFromRequest(request, env);
  if (!current?.user.roles?.includes('broadcaster')) {
    return authJson({ ok: false, reason: 'forbidden' }, { status: 403 });
  }
  const result = await buildDirectorQueue(env, options);
  return authJson({
    ok: true,
    spec: 'pointcast.director-queue/v1',
    cacheSeconds: CHAIN_CACHE_SECONDS,
    generatedAt: new Date().toISOString(),
    ...result,
  }, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}

export const onRequestGet: PagesFunction<DirectorEnv> = async (context) => {
  const runtimeCaches = typeof caches === 'undefined'
    ? undefined
    : caches as CacheStorage & { default?: CacheLike };
  return handleDirectorQueue(context.request, context.env, {
    cache: runtimeCaches?.default,
    waitUntil: (promise) => context.waitUntil(promise),
  });
};
