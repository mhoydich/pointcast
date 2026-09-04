import contracts from '../../../src/data/contracts.json';
import manualQueue from '../../../src/data/director-queue.json';
import { collectSitting } from '../../../src/lib/collect-desk';
import { DIRECTOR_ADMIN_ADDRESS, hasDirectorDeskAccess } from '../../../src/lib/director-access';
import { deskValueSummary, type DeskRowValue } from '../../../src/lib/desk-rows';
import type { DirectorEntrypoint, DirectorOperation } from '../../../src/lib/director-operations';
import { readSessionFromRequest, authJson, type AuthEnv } from '../auth/session';
import { claimDailyCap } from '../kennel-club/_claims';

interface DirectorEnv extends AuthEnv {
  KENNEL_CLUB_CLAIM_DAILY_CAP?: string;
}

interface CacheLike {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

interface WalletSnapshot {
  address: string;
  balanceMutez: number | null;
  available: boolean;
}

export interface ChainSnapshot {
  kennel: { treasury: string | null; mintedToday: number | null; available: boolean };
  sealsV2: { paused: boolean | null; available: boolean; address: string };
  wallets: {
    safe: WalletSnapshot;
    claim: WalletSnapshot;
    cc: WalletSnapshot;
  };
  readAt: string;
  cached: boolean;
}

export interface DirectorQueueRow {
  id: string;
  source: 'chain' | 'registry' | 'manual';
  kind: 'signature' | 'setup' | 'manual' | 'check';
  what: string;
  why: string;
  href: string;
  done: boolean;
  state: 'open' | 'done' | 'unknown';
  /** The value the chain (or the town) holds today. */
  now: DeskRowValue;
  /** The value this row writes once it is signed or closed. */
  after: DeskRowValue;
  /** Flattened `now → after` mirror kept for the home front-door desk. */
  value?: string;
  buttonLabel: string;
  operation?: DirectorOperation;
  toggleable?: boolean;
}

/**
 * Every allowlisted chain call renders through one grammar: a plain
 * WHAT sentence, the NOW value read from storage, the AFTER value the
 * signature writes, and one `Sign with Kukai` button. set_treasury and
 * set_paused use it today; set_issuer, set_window and set_price get the
 * same row the moment a contract needs one.
 */
export function directorSignatureRow(input: {
  id: string;
  contract: string;
  entrypoint: DirectorEntrypoint;
  args?: unknown;
  what: string;
  why: string;
  href: string;
  now: DeskRowValue;
  after: DeskRowValue;
}): DirectorQueueRow {
  const { contract, entrypoint, args, ...copy } = input;
  return {
    ...copy,
    source: 'chain',
    kind: 'signature',
    done: false,
    state: 'open',
    value: deskValueSummary(copy),
    buttonLabel: 'Sign with Kukai',
    operation: { contract, entrypoint, ...(args === undefined ? {} : { args }) },
  };
}

export interface DirectorTillItem extends WalletSnapshot {
  id: string;
  label: string;
  detail: string;
  matchesSafe?: boolean | null;
}

export interface DirectorTodayMetric {
  id: 'claims' | 'mints' | 'subscribers' | 'aliases' | 'receipts';
  label: string;
  value: number | null;
  detail: string;
}

const TZKT = 'https://api.tzkt.io/v1';
const MAX_CHAIN_RESPONSE_BYTES = 65_536;
const MAX_WRITE_BODY_BYTES = 1_024;
const CHAIN_CACHE_SECONDS = 60;
const CLAIM_WALLET = 'tz1UvNjifVKhP6Hm3ytVfWtmTiCxKozcYsSG';
const CC_WALLET = 'tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY';
const MANUAL_IDS = new Set(manualQueue.map(({ id }) => id));

function mainnetAddress(key: string): string {
  const record = (contracts as Record<string, { mainnet?: unknown }>)[key];
  return typeof record?.mainnet === 'string' ? record.mainnet.trim() : '';
}

function betterCall(address: string): string {
  return `https://better-call.dev/mainnet/${address}`;
}

function cacheKey(kennel: string, sealsV2: string, tokenId: number): Request {
  return new Request(`https://pointcast.xyz/.edge-cache/director/chain-v2/${kennel}/${sealsV2 || 'unregistered'}/${tokenId}`);
}

async function boundedJson(response: Response): Promise<unknown> {
  if (!response.ok) throw new Error(`TzKT returned HTTP ${response.status}`);
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > MAX_CHAIN_RESPONSE_BYTES) throw new Error('TzKT response too large');
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_CHAIN_RESPONSE_BYTES) throw new Error('TzKT response too large');
  return JSON.parse(text) as unknown;
}

function recordValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid TzKT record');
  return value as Record<string, unknown>;
}

async function readTzkt(path: string, fetcher: typeof fetch): Promise<unknown> {
  return boundedJson(await fetcher(`${TZKT}${path}`, { headers: { Accept: 'application/json' } }));
}

async function readStorage(address: string, fetcher: typeof fetch): Promise<Record<string, unknown>> {
  return recordValue(await readTzkt(`/contracts/${address}/storage`, fetcher));
}

function bigMapValue(payload: unknown): unknown {
  if (Array.isArray(payload)) return (payload[0] as Record<string, unknown> | undefined)?.value;
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>).value : null;
}

async function readKennel(address: string, tokenId: number, fetcher: typeof fetch) {
  const storage = await readStorage(address, fetcher);
  const supply = Number(storage.supply);
  if (!Number.isSafeInteger(supply)) throw new Error('Kennel Club supply map unavailable');
  const supplyKey = await readTzkt(`/bigmaps/${supply}/keys?key=${tokenId}`, fetcher);
  const mintedToday = Number(bigMapValue(supplyKey) ?? 0);
  return { storage, mintedToday: Number.isSafeInteger(mintedToday) && mintedToday >= 0 ? mintedToday : 0 };
}

async function readWallet(address: string, fetcher: typeof fetch): Promise<WalletSnapshot> {
  const account = recordValue(await readTzkt(`/accounts/${address}`, fetcher));
  const balance = Number(account.balance);
  return {
    address,
    balanceMutez: Number.isSafeInteger(balance) && balance >= 0 ? balance : null,
    available: Number.isSafeInteger(balance) && balance >= 0,
  };
}

async function cachedSnapshot(cache: CacheLike | undefined, kennel: string, sealsV2: string, tokenId: number) {
  if (!cache) return null;
  const hit = await cache.match(cacheKey(kennel, sealsV2, tokenId));
  if (!hit) return null;
  try {
    const value = await hit.json() as ChainSnapshot;
    if (!value?.kennel || !value?.sealsV2 || !value?.wallets || typeof value.readAt !== 'string') return null;
    return { ...value, cached: true };
  } catch {
    return null;
  }
}

function settledWallet(result: PromiseSettledResult<WalletSnapshot>, address: string): WalletSnapshot {
  return result.status === 'fulfilled' ? result.value : { address, balanceMutez: null, available: false };
}

export async function getDirectorChainSnapshot(
  options: {
    fetcher?: typeof fetch;
    cache?: CacheLike;
    waitUntil?: (promise: Promise<unknown>) => void;
    tokenId?: number;
  } = {},
): Promise<ChainSnapshot> {
  const kennel = mainnetAddress('kennel_club');
  const sealsV2 = mainnetAddress('seal_soulbound_v2');
  const safe = mainnetAddress('project_multisig');
  const tokenId = options.tokenId ?? collectSitting().tokenId;
  const hit = await cachedSnapshot(options.cache, kennel, sealsV2, tokenId);
  if (hit) return hit;

  const fetcher = options.fetcher ?? fetch;
  const [kennelResult, sealsResult, safeResult, claimResult, ccResult] = await Promise.allSettled([
    kennel ? readKennel(kennel, tokenId, fetcher) : Promise.reject(new Error('kennel contract unregistered')),
    sealsV2 ? readStorage(sealsV2, fetcher) : Promise.reject(new Error('seals v2 contract unregistered')),
    readWallet(safe, fetcher),
    readWallet(CLAIM_WALLET, fetcher),
    readWallet(CC_WALLET, fetcher),
  ]);
  const kennelValue = kennelResult.status === 'fulfilled' ? kennelResult.value : null;
  const sealsStorage = sealsResult.status === 'fulfilled' ? sealsResult.value : null;
  const snapshot: ChainSnapshot = {
    kennel: {
      treasury: typeof kennelValue?.storage.treasury === 'string' ? kennelValue.storage.treasury : null,
      mintedToday: kennelValue?.mintedToday ?? null,
      available: Boolean(kennelValue),
    },
    sealsV2: {
      paused: typeof sealsStorage?.paused === 'boolean' ? sealsStorage.paused : null,
      available: Boolean(sealsStorage),
      address: sealsV2,
    },
    wallets: {
      safe: settledWallet(safeResult, safe),
      claim: settledWallet(claimResult, CLAIM_WALLET),
      cc: settledWallet(ccResult, CC_WALLET),
    },
    readAt: new Date().toISOString(),
    cached: false,
  };

  if (options.cache) {
    const write = options.cache.put(cacheKey(kennel, sealsV2, tokenId), Response.json(snapshot, {
      headers: { 'Cache-Control': `public, max-age=${CHAIN_CACHE_SECONDS}` },
    }));
    if (options.waitUntil) options.waitUntil(write);
    else await write;
  }
  return snapshot;
}

async function countRow(db: D1Database | undefined, sql: string, values: unknown[] = []): Promise<number | null> {
  if (!db) return null;
  try {
    const row = await db.prepare(sql).bind(...values).first<{ count: number }>();
    const count = Number(row?.count);
    return Number.isSafeInteger(count) && count >= 0 ? count : 0;
  } catch {
    return null;
  }
}

async function readManualState(db: D1Database | undefined): Promise<Map<string, boolean>> {
  if (!db || MANUAL_IDS.size === 0) return new Map();
  try {
    const placeholders = Array.from(MANUAL_IDS, () => '?').join(', ');
    const result = await db.prepare(`SELECT id, done FROM director_state WHERE id IN (${placeholders})`)
      .bind(...MANUAL_IDS)
      .all<{ id: string; done: number }>();
    return new Map((result.results ?? []).map((row) => [row.id, Boolean(row.done)]));
  } catch {
    return new Map();
  }
}

function dayRange(day: string): [string, string] {
  const start = new Date(`${day}T07:00:00.000Z`);
  return [start.toISOString(), new Date(start.getTime() + 86_400_000).toISOString()];
}

function tillItem(id: string, label: string, wallet: WalletSnapshot, detail: string): DirectorTillItem {
  return { id, label, ...wallet, detail };
}

export async function buildDirectorQueue(
  env: DirectorEnv,
  options: {
    fetcher?: typeof fetch;
    cache?: CacheLike;
    waitUntil?: (promise: Promise<unknown>) => void;
  } = {},
): Promise<{ rows: DirectorQueueRow[]; chain: ChainSnapshot; till: DirectorTillItem[]; today: DirectorTodayMetric[] }> {
  const sitting = collectSitting();
  const cap = claimDailyCap(env.KENNEL_CLUB_CLAIM_DAILY_CAP);
  const [dayStart, dayEnd] = dayRange(sitting.mintDate);
  const [chain, todayClaims, subscribers, aliases, receipts, manualState] = await Promise.all([
    getDirectorChainSnapshot({ ...options, tokenId: sitting.tokenId }),
    countRow(env.AUTH_DB, "SELECT COUNT(*) AS count FROM claims WHERE token_id = ? AND status != 'failed'", [sitting.tokenId]),
    countRow(env.AUTH_DB, "SELECT COUNT(*) AS count FROM subscribers WHERE status = 'confirmed'"),
    countRow(env.AUTH_DB, "SELECT COUNT(*) AS count FROM aliases WHERE status = 'active' AND expires_at > ?", [new Date().toISOString()]),
    countRow(env.AUTH_DB, 'SELECT COUNT(*) AS count FROM seal_receipts WHERE created_at >= ? AND created_at < ?', [dayStart, dayEnd]),
    readManualState(env.AUTH_DB),
  ]);

  const safe = mainnetAddress('project_multisig');
  const kennel = mainnetAddress('kennel_club');
  const rows: DirectorQueueRow[] = [];
  const treasuryKnown = chain.kennel.available && Boolean(chain.kennel.treasury);
  const treasuryDone = treasuryKnown && chain.kennel.treasury === safe;
  if (!treasuryKnown) {
    rows.push({
      id: 'kennel-treasury-safe', source: 'chain', kind: 'check', what: 'Check the Kennel Club treasury by hand',
      why: 'The chain read is unavailable, so PointCast will not offer a blind signature.',
      href: betterCall(kennel), done: false, state: 'unknown', buttonLabel: 'Inspect',
      now: { label: 'treasury', value: 'chain read unavailable' },
      after: { label: 'treasury', value: safe, note: 'project safe' },
      value: 'chain read unavailable',
    });
  } else if (!treasuryDone) {
    rows.push(directorSignatureRow({
      id: 'kennel-treasury-safe',
      contract: kennel,
      entrypoint: 'set_treasury',
      args: [safe],
      what: 'Send Kennel Club mint proceeds to the project safe',
      why: 'Every 1 ꜩ sitting after this signature pays the 1-of-2 safe instead of a personal wallet.',
      href: betterCall(kennel),
      now: {
        label: 'treasury',
        value: chain.kennel.treasury as string,
        note: chain.kennel.treasury === DIRECTOR_ADMIN_ADDRESS ? 'your Kukai' : 'current treasury',
      },
      after: { label: 'treasury', value: safe, note: 'project safe' },
    }));
  }

  const sealsV2 = mainnetAddress('seal_soulbound_v2');
  if (sealsV2 && !chain.sealsV2.available) {
    rows.push({
      id: 'seals-v2-unpause', source: 'chain', kind: 'check', what: 'Check the Seals v2 pause state by hand',
      why: 'The chain read is unavailable, so PointCast will not offer a blind signature.',
      href: betterCall(sealsV2), done: false, state: 'unknown', buttonLabel: 'Inspect',
      now: { label: 'paused', value: 'chain read unavailable' },
      after: { label: 'paused', value: 'false', note: 'issuing open' },
      value: 'chain read unavailable',
    });
  } else if (sealsV2 && chain.sealsV2.paused === true) {
    rows.push(directorSignatureRow({
      id: 'seals-v2-unpause',
      contract: sealsV2,
      entrypoint: 'set_paused',
      args: [false],
      what: 'Unpause Seals v2 so the configured issuer can seal again',
      why: 'The contract is paused, so every issuer call fails until the administrator opens it.',
      href: betterCall(sealsV2),
      now: { label: 'paused', value: 'true', note: 'issuing blocked' },
      after: { label: 'paused', value: 'false', note: 'issuing open' },
    }));
  }

  rows.push(...manualQueue.map((item) => {
    const done = manualState.get(item.id) ?? false;
    const now: DeskRowValue = { label: 'town', value: item.now };
    const after: DeskRowValue = { label: 'town', value: item.after };
    return {
      ...item, source: 'manual' as const, kind: 'manual' as const, done, now, after,
      state: done ? 'done' as const : 'open' as const,
      value: deskValueSummary({ now, after }),
      buttonLabel: done ? 'Undo' : 'Done', toggleable: true,
    };
  }));

  for (const [key, record] of Object.entries(contracts)) {
    if (key.startsWith('_') || !record || typeof record !== 'object' || !('mainnet' in record)) continue;
    if (typeof record.mainnet === 'string' && record.mainnet.trim() === '') {
      rows.push({
        id: `contract-${key}`, source: 'registry', kind: 'setup',
        what: `Originate ${key.replaceAll('_', ' ')} so it has a mainnet address`,
        why: 'This contract is registered in contracts.json but has never been originated on mainnet.',
        href: `/admin/deploy/new?prefill=${encodeURIComponent(key)}`,
        done: false, state: 'open', buttonLabel: 'Open publisher',
        now: { label: 'mainnet', value: 'unset', note: 'registered, never originated' },
        after: { label: 'mainnet', value: 'KT1…', note: 'written back to contracts.json' },
        value: 'mainnet: unset → mainnet: KT1…',
      });
    }
  }

  const treasury = chain.kennel.treasury;
  const till: DirectorTillItem[] = [
    tillItem('safe', 'Project safe', chain.wallets.safe, 'TzSafe v0.3.4 · 1-of-2'),
    tillItem('claim-wallet', 'Claim wallet', chain.wallets.claim, 'Sponsors free Kennel Club claims'),
    tillItem('cc-wallet', 'cc wallet', chain.wallets.cc, 'Project operations and seal issuance'),
    {
      id: 'kennel-treasury', label: 'Kennel Club treasury', address: treasury ?? '', balanceMutez: null,
      available: treasuryKnown,
      detail: treasuryDone ? 'Matches the project safe' : treasuryKnown ? 'Does not match the project safe' : 'Chain read unavailable',
      matchesSafe: treasuryKnown ? treasuryDone : null,
    },
  ];
  const today: DirectorTodayMetric[] = [
    { id: 'claims', label: 'Claims', value: todayClaims, detail: todayClaims === null ? `unavailable / ${cap}` : `${todayClaims} of ${cap} free claims` },
    { id: 'mints', label: 'Mints', value: chain.kennel.mintedToday, detail: `${sitting.name} · token ${sitting.tokenId}` },
    { id: 'subscribers', label: 'Subscribers', value: subscribers, detail: 'confirmed dog-a-day list' },
    { id: 'aliases', label: 'Aliases', value: aliases, detail: 'active town post-office aliases' },
    { id: 'receipts', label: 'Receipts', value: receipts, detail: 'seal receipts created today' },
  ];
  return { rows, chain, till, today };
}

async function directorSession(request: Request, env: DirectorEnv) {
  const current = await readSessionFromRequest(request, env);
  return current && hasDirectorDeskAccess(current) ? current : null;
}

export async function handleDirectorQueue(
  request: Request,
  env: DirectorEnv,
  options: { fetcher?: typeof fetch; cache?: CacheLike; waitUntil?: (promise: Promise<unknown>) => void } = {},
): Promise<Response> {
  if (!await directorSession(request, env)) return authJson({ ok: false, reason: 'forbidden' }, { status: 403 });
  const result = await buildDirectorQueue(env, options);
  return authJson({
    ok: true, spec: 'pointcast.director-queue/v2', cacheSeconds: CHAIN_CACHE_SECONDS,
    generatedAt: new Date().toISOString(), ...result,
  }, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}

export async function handleDirectorQueueWrite(request: Request, env: DirectorEnv): Promise<Response> {
  const current = await directorSession(request, env);
  if (!current) return authJson({ ok: false, reason: 'forbidden' }, { status: 403 });
  if (!env.AUTH_DB) return authJson({ ok: false, reason: 'd1-unbound' }, { status: 503 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return authJson({ ok: false, reason: 'origin-mismatch' }, { status: 403 });
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_WRITE_BODY_BYTES) return authJson({ ok: false, reason: 'body-too-large' }, { status: 413 });

  let body: { id?: unknown; done?: unknown };
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_WRITE_BODY_BYTES) throw new Error('too large');
    body = JSON.parse(text) as typeof body;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  if (typeof body.id !== 'string' || !MANUAL_IDS.has(body.id) || typeof body.done !== 'boolean') {
    return authJson({ ok: false, reason: 'invalid-director-state' }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  await env.AUTH_DB.prepare(`
    INSERT INTO director_state (id, done, updated_at, updated_by)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET done = excluded.done, updated_at = excluded.updated_at, updated_by = excluded.updated_by
  `).bind(body.id, body.done ? 1 : 0, updatedAt, current.user.userId).run();
  return authJson({ ok: true, id: body.id, done: body.done, updatedAt });
}

function runtimeCache(): CacheLike | undefined {
  if (typeof caches === 'undefined') return undefined;
  return (caches as CacheStorage & { default?: CacheLike }).default;
}

export const onRequestGet: PagesFunction<DirectorEnv> = async (context) => handleDirectorQueue(
  context.request,
  context.env,
  { cache: runtimeCache(), waitUntil: (promise) => context.waitUntil(promise) },
);

export const onRequestPost: PagesFunction<DirectorEnv> = async ({ request, env }) => handleDirectorQueueWrite(request, env);
