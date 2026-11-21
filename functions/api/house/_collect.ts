/**
 * The house collector: the PointCast claim wallet mints one Visit Noun when
 * an agent asks, so "an agent collected one of ours" needs no wallet, no
 * sign-in and no person at a keyboard.
 *
 * What it can spend. Visit Nouns mint for 0 ꜩ, so each call costs network
 * fees only (about 0.12 ꜩ in the April 2026 mints, almost all of it storage).
 * The wallet is the existing Kennel Club claim wallet. Three things bound the
 * blast radius, in this order:
 *
 *   1. a daily cap, counted per attempt and not per success, so a lost
 *      response can never be replayed into extra spend;
 *   2. the same balance floor the Kennel Club claims keep;
 *   3. the Kennel Club signer lock, because two operations from one wallet
 *      in the same block collide on its counter.
 *
 * The Noun stays in the house wallet. Delivery to a named recipient is a
 * separate, later change: the token id is only known after the mint lands.
 *
 * Env:
 *   AUTH_DB                       D1, for the shared signer lock
 *   PC_RATES_KV                   the day's count, the recent list, replays
 *   KENNEL_CLUB_CLAIM_SECRET_KEY  the claim wallet's key (already installed)
 *   HOUSE_COLLECT_DAILY_CAP       optional attempts per day (default 3, max 20)
 */

export const VISIT_NOUNS_CONTRACT = 'KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh';
export const HOUSE_COLLECT_MAX_NOUN_ID = 1199;
export const HOUSE_COLLECT_DEFAULT_DAILY_CAP = 3;
export const HOUSE_COLLECT_MAX_DAILY_CAP = 20;
export const HOUSE_COLLECT_BALANCE_FLOOR_MUTEZ = 3_000_000;

const RPC = 'https://mainnet.smartpy.io';
// Same wallet as functions/api/kennel-club/_claims.ts, so the same lock row.
const SIGNER_LOCK = 'kennel-claim-wallet';
const SIGNER_LOCK_TTL_MS = 15 * 60_000;
const OPERATION_HASH = /^o[1-9A-HJ-NP-Za-km-z]{50}$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_.:-]{8,120}$/;
const KV_PREFIX = 'house-collect:v1';
const RECENT_LIMIT = 20;
const REPLAY_TTL_SECONDS = 7 * 24 * 60 * 60;
const DAY_TTL_SECONDS = 3 * 24 * 60 * 60;

export interface HouseCollectEnv {
  AUTH_DB?: D1Database;
  PC_RATES_KV?: KVNamespace;
  KENNEL_CLUB_CLAIM_SECRET_KEY?: string;
  HOUSE_COLLECT_DAILY_CAP?: string;
}

export interface HouseChain {
  address: string;
  balanceMutez(): Promise<number>;
  mintNoun(nounId: number): Promise<{ opHash: string }>;
}

export type HouseChainFactory = (secretKey: string) => Promise<HouseChain>;

export interface HouseCollectRecord {
  at: string;
  day: string;
  agent: string;
  nounId: number;
  opHash: string;
  wallet: string;
}

export type HouseCollectResult =
  | { ok: true; status: 200; replayed: boolean; record: HouseCollectRecord; usedToday: number; cap: number }
  | { ok: false; status: number; reason: string; usedToday?: number; cap?: number; retryAfterSeconds?: number };

export function houseCollectDailyCap(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 0) return HOUSE_COLLECT_DEFAULT_DAILY_CAP;
  return Math.min(parsed, HOUSE_COLLECT_MAX_DAILY_CAP);
}

export function houseCollectConfigured(env: HouseCollectEnv): boolean {
  return Boolean(env.AUTH_DB && env.PC_RATES_KV && env.KENNEL_CLUB_CLAIM_SECRET_KEY?.trim());
}

export function houseCollectDay(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function cleanAgentLabel(value: unknown): string {
  if (typeof value !== 'string') return 'agent';
  const cleaned = value.replace(/[^\w .@-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  return cleaned || 'agent';
}

function parseNounId(value: unknown): number | null | 'invalid' {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) return 'invalid';
  if (value < 0 || value > HOUSE_COLLECT_MAX_NOUN_ID) return 'invalid';
  return value;
}

async function readJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

async function acquireSignerLock(db: D1Database, holder: string, now: number): Promise<boolean> {
  const row = await db.prepare(`
    INSERT INTO kennel_signer_locks (lock_name, holder, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(lock_name) DO UPDATE SET
      holder = excluded.holder,
      expires_at = excluded.expires_at
    WHERE kennel_signer_locks.holder IS NULL
       OR kennel_signer_locks.expires_at <= ?
       OR kennel_signer_locks.holder = excluded.holder
    RETURNING holder
  `).bind(SIGNER_LOCK, holder, now + SIGNER_LOCK_TTL_MS, now).first<{ holder: string }>();
  return row?.holder === holder;
}

async function releaseSignerLock(db: D1Database, holder: string): Promise<void> {
  await db.prepare(`
    UPDATE kennel_signer_locks SET holder = NULL, expires_at = NULL
    WHERE lock_name = ? AND holder = ?
  `).bind(SIGNER_LOCK, holder).run();
}

export async function createTaquitoHouseChain(secretKey: string): Promise<HouseChain> {
  const [{ InMemorySigner }, { TezosToolkit }] = await Promise.all([
    import('@taquito/signer'),
    import('@taquito/taquito'),
  ]);
  const signer = await InMemorySigner.fromSecretKey(secretKey);
  const address = await signer.publicKeyHash();
  const tezos = new TezosToolkit(RPC);
  tezos.setProvider({ signer });
  return {
    address,
    async balanceMutez() {
      return (await tezos.tz.getBalance(address)).toNumber();
    },
    async mintNoun(nounId) {
      const contract = await tezos.contract.at(VISIT_NOUNS_CONTRACT);
      const operation = await contract.methodsObject.mint_noun(nounId).send({ amount: 0 });
      const opHash = (operation as { hash?: string; opHash?: string }).hash
        ?? (operation as { opHash?: string }).opHash ?? '';
      if (!OPERATION_HASH.test(opHash)) throw new Error('invalid-operation-hash');
      return { opHash };
    },
  };
}

export async function houseCollectStatus(env: HouseCollectEnv, now = new Date()) {
  const day = houseCollectDay(now);
  const cap = houseCollectDailyCap(env.HOUSE_COLLECT_DAILY_CAP);
  if (!env.PC_RATES_KV) return { configured: houseCollectConfigured(env), day, cap, usedToday: 0, recent: [] as HouseCollectRecord[] };
  const [used, recent] = await Promise.all([
    readJson<{ count: number }>(env.PC_RATES_KV, `${KV_PREFIX}:day:${day}`),
    readJson<HouseCollectRecord[]>(env.PC_RATES_KV, `${KV_PREFIX}:recent`),
  ]);
  return { configured: houseCollectConfigured(env), day, cap, usedToday: used?.count ?? 0, recent: recent ?? [] };
}

export async function houseCollect(options: {
  env: HouseCollectEnv;
  agent?: unknown;
  nounId?: unknown;
  idempotencyKey?: string | null;
  chainFactory?: HouseChainFactory;
  now?: Date;
}): Promise<HouseCollectResult> {
  const { env } = options;
  const now = options.now ?? new Date();
  const cap = houseCollectDailyCap(env.HOUSE_COLLECT_DAILY_CAP);
  const secretKey = env.KENNEL_CLUB_CLAIM_SECRET_KEY?.trim();
  if (!env.AUTH_DB || !env.PC_RATES_KV || !secretKey) {
    return { ok: false, status: 503, reason: 'house-wallet-not-configured' };
  }
  const requested = parseNounId(options.nounId);
  if (requested === 'invalid') return { ok: false, status: 400, reason: 'invalid-noun-id' };
  const key = options.idempotencyKey?.trim() ?? '';
  if (!IDEMPOTENCY_KEY.test(key)) return { ok: false, status: 400, reason: 'idempotency-key-required' };

  const kv = env.PC_RATES_KV;
  const replayKey = `${KV_PREFIX}:replay:${key}`;
  const day = houseCollectDay(now);
  const dayKey = `${KV_PREFIX}:day:${day}`;

  const earlier = await readJson<HouseCollectRecord>(kv, replayKey);
  if (earlier) {
    const used = await readJson<{ count: number }>(kv, dayKey);
    return { ok: true, status: 200, replayed: true, record: earlier, usedToday: used?.count ?? 0, cap };
  }

  const holder = `house-collect:${key}`;
  if (!await acquireSignerLock(env.AUTH_DB, holder, now.getTime())) {
    return { ok: false, status: 409, reason: 'signer-busy', retryAfterSeconds: 30 };
  }
  try {
    // Re-read inside the lock: the lock is what makes this count a ledger.
    const again = await readJson<HouseCollectRecord>(kv, replayKey);
    if (again) {
      const used = await readJson<{ count: number }>(kv, dayKey);
      return { ok: true, status: 200, replayed: true, record: again, usedToday: used?.count ?? 0, cap };
    }
    const used = (await readJson<{ count: number }>(kv, dayKey))?.count ?? 0;
    if (used >= cap) return { ok: false, status: 429, reason: 'daily-cap-reached', usedToday: used, cap };

    const chain = await (options.chainFactory ?? createTaquitoHouseChain)(secretKey);
    const balance = await chain.balanceMutez();
    if (!Number.isFinite(balance) || balance < HOUSE_COLLECT_BALANCE_FLOOR_MUTEZ) {
      return { ok: false, status: 503, reason: 'house-wallet-low-balance', usedToday: used, cap };
    }

    // Count the attempt before anything is signed.
    const usedToday = used + 1;
    await kv.put(dayKey, JSON.stringify({ count: usedToday }), { expirationTtl: DAY_TTL_SECONDS });

    const nounId = requested ?? ((Math.floor(now.getTime() / 86_400_000) * 7 + used) % (HOUSE_COLLECT_MAX_NOUN_ID + 1));
    let opHash: string;
    try {
      ({ opHash } = await chain.mintNoun(nounId));
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error', message: 'house-collect-mint-failed', day, nounId,
        error: error instanceof Error ? error.name : 'unknown',
      }));
      return { ok: false, status: 502, reason: 'mint-failed', usedToday, cap };
    }

    const record: HouseCollectRecord = {
      at: now.toISOString(), day, agent: cleanAgentLabel(options.agent), nounId, opHash, wallet: chain.address,
    };
    const recent = (await readJson<HouseCollectRecord[]>(kv, `${KV_PREFIX}:recent`)) ?? [];
    await Promise.all([
      kv.put(replayKey, JSON.stringify(record), { expirationTtl: REPLAY_TTL_SECONDS }),
      kv.put(`${KV_PREFIX}:recent`, JSON.stringify([record, ...recent].slice(0, RECENT_LIMIT))),
    ]);
    return { ok: true, status: 200, replayed: false, record, usedToday, cap };
  } finally {
    await releaseSignerLock(env.AUTH_DB, holder).catch(() => undefined);
  }
}
