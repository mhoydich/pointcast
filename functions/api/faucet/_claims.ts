/**
 * The faucet ledger and the spigot.
 *
 * Mirrors functions/api/kennel-club/_claims.ts, with one deliberate
 * difference: a claim never touches the chain. HELLO already exists on
 * Ethereum mainnet (2019); claiming writes a `held` row, and the only
 * on-chain action is delivery, when the account names an address and the
 * spigot wallet sends every held drip in one ERC-20 transfer.
 *
 * Env:
 *   AUTH_DB                     D1, the ledger (faucet_claims) — shared with auth
 *   PC_RATES_KV                 rate limits + the short send lock
 *   HELLO_FAUCET_SECRET_KEY     0x-prefixed private key of the spigot wallet.
 *                               A fresh wallet holding only faucet supply and a
 *                               little ETH for gas. Never the 2019 deployer key.
 *   FAUCET_ETH_RPC_URL          optional JSON-RPC URL (default cloudflare-eth.com)
 *   HELLO_FAUCET_DAILY_CAP      optional claims per day (default 50, max 500)
 */
import type { PointCastUser } from '../../../src/lib/auth/types';
import type { AuthEnv } from '../auth/session';
import {
  EVM_TX_HASH,
  faucetDailyCap,
  isEvmAddress,
  losAngelesDate,
  type FaucetToken,
} from '../../../src/lib/faucet';

const DEFAULT_RPC = 'https://cloudflare-eth.com';
/** Enough for a handful of ERC-20 transfers at ordinary 2026 gas. */
const MINIMUM_SPIGOT_ETH_WEI = 2_000_000_000_000_000n; // 0.002 ETH
const SEND_LOCK_TTL_SECONDS = 60;
const SUBMITTING_STALE_MS = 5 * 60_000;

export type FaucetClaimStatus = 'held' | 'submitting' | 'delivered';

export interface FaucetClaimEnv extends AuthEnv {
  PC_RATES_KV?: KVNamespace;
  HELLO_FAUCET_SECRET_KEY?: string;
  FAUCET_ETH_RPC_URL?: string;
  HELLO_FAUCET_DAILY_CAP?: string;
}

export interface FaucetClaimRow {
  id: string;
  user_id: string;
  faucet: string;
  day: string;
  amount: number;
  status: FaucetClaimStatus;
  tx_hash: string | null;
  delivered_to: string | null;
  created_at: string;
  delivered_at: string | null;
}

export interface SpigotSnapshot {
  address: `0x${string}`;
  /** Whole tokens, rounded down. */
  tokenBalance: number;
  ethBalance: string;
  decimals: number;
  lowGas: boolean;
}

export interface FaucetChain {
  address: `0x${string}`;
  snapshot(): Promise<SpigotSnapshot>;
  /** Send `amount` whole tokens; resolves once the transaction is broadcast. */
  send(to: `0x${string}`, amount: number): Promise<{ txHash: `0x${string}` }>;
}

export type FaucetChainFactory = (secretKey: string, rpcUrl: string, faucet: FaucetToken) => Promise<FaucetChain>;

export interface PublicFaucetClaims {
  configured: boolean;
  day: string;
  cap: number;
  claimedToday: number;
  remainingToday: number;
  heldTotal: number;
  deliveredTotal: number;
  recent: Array<{ firstName: string; status: 'held' | 'delivered'; createdAt: string }>;
}

export interface UserFaucetLedger {
  today: { claimed: boolean; status: FaucetClaimStatus | null };
  held: number;
  delivered: number;
  linkedAddress: `0x${string}` | null;
  claims: Array<{
    id: string;
    day: string;
    amount: number;
    status: FaucetClaimStatus;
    txHash: string | null;
    deliveredTo: string | null;
    createdAt: string;
  }>;
}

export function spigotSecretKey(env: Pick<FaucetClaimEnv, 'HELLO_FAUCET_SECRET_KEY'>, faucet: FaucetToken): string | null {
  if (faucet.slug !== 'hello') return null;
  const key = env.HELLO_FAUCET_SECRET_KEY?.trim();
  return key && /^0x[0-9a-fA-F]{64}$/.test(key) ? key : null;
}

export function spigotConfigured(env: FaucetClaimEnv, faucet: FaucetToken): boolean {
  return spigotSecretKey(env, faucet) !== null;
}

export function faucetCap(env: FaucetClaimEnv, faucet: FaucetToken): number {
  return faucetDailyCap(faucet.slug === 'hello' ? env.HELLO_FAUCET_DAILY_CAP : undefined);
}

/** The most recently verified EVM identity on the account, if any. */
export function linkedEvmAddress(user: PointCastUser): `0x${string}` | null {
  for (const identity of [...user.identities].reverse()) {
    if (identity.provider === 'metamask' && isEvmAddress(identity.id)) return identity.id;
  }
  return null;
}

function firstName(value: string | null): string {
  const candidate = value?.trim().split(/\s+/)[0] ?? '';
  if (!candidate || candidate.includes('@') || candidate.startsWith('tz') || candidate.startsWith('0x')) return 'Someone';
  const cleaned = candidate.replace(/[^\p{L}\p{M}'’-]/gu, '').slice(0, 30);
  return cleaned || 'Someone';
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function emptyPublicFaucetClaims(day: string, cap: number, configured: boolean): PublicFaucetClaims {
  return { configured, day, cap, claimedToday: 0, remainingToday: cap, heldTotal: 0, deliveredTotal: 0, recent: [] };
}

export async function getPublicFaucetClaims(
  db: D1Database | undefined,
  faucet: FaucetToken,
  options: { day?: string; cap: number; configured: boolean },
): Promise<PublicFaucetClaims> {
  const day = options.day ?? losAngelesDate();
  if (!db) return emptyPublicFaucetClaims(day, options.cap, options.configured);
  const [counts, recent] = await Promise.all([
    db.prepare(`
      SELECT
        SUM(CASE WHEN day = ? THEN 1 ELSE 0 END) AS claimed_today,
        SUM(CASE WHEN status IN ('held', 'submitting') THEN amount ELSE 0 END) AS held_total,
        SUM(CASE WHEN status = 'delivered' THEN amount ELSE 0 END) AS delivered_total
      FROM faucet_claims
      WHERE faucet = ?
    `).bind(day, faucet.slug).first<{ claimed_today: number; held_total: number; delivered_total: number }>(),
    db.prepare(`
      SELECT c.status, c.created_at, json_extract(u.payload, '$.preferredName') AS preferred_name
      FROM faucet_claims c
      JOIN users u ON u.id = c.user_id
      WHERE c.faucet = ?
      ORDER BY c.created_at DESC
      LIMIT 12
    `).bind(faucet.slug).all<{ status: FaucetClaimStatus; created_at: string; preferred_name: string | null }>(),
  ]);
  const claimedToday = numberValue(counts?.claimed_today);
  const rows = Array.isArray(recent.results) ? recent.results : [];
  return {
    configured: options.configured,
    day,
    cap: options.cap,
    claimedToday,
    remainingToday: Math.max(0, options.cap - claimedToday),
    heldTotal: numberValue(counts?.held_total),
    deliveredTotal: numberValue(counts?.delivered_total),
    recent: rows.map((row) => ({
      firstName: firstName(row.preferred_name),
      status: row.status === 'delivered' ? 'delivered' : 'held',
      createdAt: row.created_at,
    })),
  };
}

export async function getUserFaucetLedger(
  db: D1Database | undefined,
  faucet: FaucetToken,
  user: PointCastUser,
  day: string = losAngelesDate(),
): Promise<UserFaucetLedger> {
  const linkedAddress = linkedEvmAddress(user);
  if (!db) return { today: { claimed: false, status: null }, held: 0, delivered: 0, linkedAddress, claims: [] };
  const result = await db.prepare(`
    SELECT id, user_id, faucet, day, amount, status, tx_hash, delivered_to, created_at, delivered_at
    FROM faucet_claims
    WHERE user_id = ? AND faucet = ?
    ORDER BY day DESC
  `).bind(user.userId, faucet.slug).all<FaucetClaimRow>();
  const rows = Array.isArray(result.results) ? result.results : [];
  const todayRow = rows.find((row) => row.day === day) ?? null;
  return {
    today: { claimed: Boolean(todayRow), status: todayRow?.status ?? null },
    held: rows.filter((row) => row.status !== 'delivered').reduce((sum, row) => sum + numberValue(row.amount), 0),
    delivered: rows.filter((row) => row.status === 'delivered').reduce((sum, row) => sum + numberValue(row.amount), 0),
    linkedAddress,
    claims: rows.map((row) => ({
      id: row.id,
      day: row.day,
      amount: numberValue(row.amount),
      status: row.status,
      txHash: row.tx_hash,
      deliveredTo: row.delivered_to,
      createdAt: row.created_at,
    })),
  };
}

export type ClaimReason = 'already-claimed' | 'daily-cap-reached' | 'claim-database-not-bound';

/** Write today's `held` row. Pure ledger; nothing is sent. */
export async function claimFaucetDrip(options: {
  env: FaucetClaimEnv;
  user: PointCastUser;
  faucet: FaucetToken;
  day?: string;
}): Promise<{ ok: boolean; reason?: ClaimReason; claim?: { id: string; day: string; amount: number; status: 'held'; createdAt: string } }> {
  const { env, user, faucet } = options;
  if (!env.AUTH_DB) return { ok: false, reason: 'claim-database-not-bound' };
  const day = options.day ?? losAngelesDate();
  const cap = faucetCap(env, faucet);
  const id = `fct_${crypto.randomUUID().replaceAll('-', '')}`;
  const createdAt = new Date().toISOString();
  const inserted = await env.AUTH_DB.prepare(`
    INSERT INTO faucet_claims (id, user_id, faucet, day, amount, status, tx_hash, delivered_to, created_at, delivered_at)
    SELECT ?, ?, ?, ?, ?, 'held', NULL, NULL, ?, NULL
    WHERE (SELECT COUNT(*) FROM faucet_claims WHERE faucet = ? AND day = ?) < ?
      AND NOT EXISTS (
        SELECT 1 FROM faucet_claims WHERE user_id = ? AND faucet = ? AND day = ?
      )
    RETURNING id, day, amount, status, created_at
  `).bind(
    id, user.userId, faucet.slug, day, faucet.dailyAmount, createdAt,
    faucet.slug, day, cap,
    user.userId, faucet.slug, day,
  ).first<{ id: string; day: string; amount: number; status: 'held'; created_at: string }>();
  if (inserted) {
    return { ok: true, claim: { id: inserted.id, day: inserted.day, amount: numberValue(inserted.amount), status: 'held', createdAt: inserted.created_at } };
  }
  const existing = await env.AUTH_DB.prepare(`
    SELECT id FROM faucet_claims WHERE user_id = ? AND faucet = ? AND day = ?
  `).bind(user.userId, faucet.slug, day).first<{ id: string }>();
  return { ok: false, reason: existing ? 'already-claimed' : 'daily-cap-reached' };
}

// ---------------------------------------------------------------------------
// The spigot: viem against Ethereum mainnet, from a Pages Function.
// ---------------------------------------------------------------------------

export async function createViemFaucetChain(secretKey: string, rpcUrl: string, faucet: FaucetToken): Promise<FaucetChain> {
  const [{ createPublicClient, createWalletClient, http, erc20Abi, parseUnits, formatEther }, { privateKeyToAccount }, { mainnet }] = await Promise.all([
    import('viem'),
    import('viem/accounts'),
    import('viem/chains'),
  ]);
  const account = privateKeyToAccount(secretKey as `0x${string}`);
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({ chain: mainnet, transport });
  const walletClient = createWalletClient({ account, chain: mainnet, transport });
  let decimalsCache: number | null = null;

  async function decimals(): Promise<number> {
    if (decimalsCache !== null) return decimalsCache;
    const value = await publicClient.readContract({ address: faucet.contract, abi: erc20Abi, functionName: 'decimals' });
    decimalsCache = Number(value);
    return decimalsCache;
  }

  return {
    address: account.address,
    async snapshot() {
      const [dec, tokenRaw, ethWei] = await Promise.all([
        decimals(),
        publicClient.readContract({ address: faucet.contract, abi: erc20Abi, functionName: 'balanceOf', args: [account.address] }),
        publicClient.getBalance({ address: account.address }),
      ]);
      const unit = 10n ** BigInt(dec);
      return {
        address: account.address,
        tokenBalance: Number(tokenRaw / unit),
        ethBalance: formatEther(ethWei),
        decimals: dec,
        lowGas: ethWei < MINIMUM_SPIGOT_ETH_WEI,
      };
    },
    async send(to, amount) {
      const dec = await decimals();
      const txHash = await walletClient.writeContract({
        address: faucet.contract,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [to, parseUnits(String(amount), dec)],
      });
      return { txHash };
    },
  };
}

async function readyChain(
  env: FaucetClaimEnv,
  faucet: FaucetToken,
  chainFactory: FaucetChainFactory,
): Promise<{ chain: FaucetChain; snapshot: SpigotSnapshot }> {
  const secretKey = spigotSecretKey(env, faucet);
  if (!secretKey) throw new Error('spigot-not-configured');
  const chain = await chainFactory(secretKey, env.FAUCET_ETH_RPC_URL?.trim() || DEFAULT_RPC, faucet);
  const snapshot = await chain.snapshot();
  if (snapshot.lowGas) throw new Error('spigot-low-gas');
  return { chain, snapshot };
}

/** Public, cached-by-caller read of the spigot wallet for the desk. */
export async function readSpigot(
  env: FaucetClaimEnv,
  faucet: FaucetToken,
  chainFactory: FaucetChainFactory = createViemFaucetChain,
): Promise<SpigotSnapshot | null> {
  const secretKey = spigotSecretKey(env, faucet);
  if (!secretKey) return null;
  try {
    const chain = await chainFactory(secretKey, env.FAUCET_ETH_RPC_URL?.trim() || DEFAULT_RPC, faucet);
    return await chain.snapshot();
  } catch {
    return null;
  }
}

/**
 * One send per faucet at a time. Pages Functions run concurrently and a
 * hot wallet has one nonce sequence, so two simultaneous deliveries would
 * race. KV is eventually consistent, so this is a courtesy lock, not a
 * mutex; the `submitting` status on the rows is the real guard against
 * double-paying one account.
 */
async function acquireSendLock(env: FaucetClaimEnv, faucet: FaucetToken): Promise<(() => Promise<void>) | null> {
  const kv = env.PC_RATES_KV;
  if (!kv) return async () => {};
  const key = `faucet:${faucet.slug}:send-lock`;
  if (await kv.get(key)) return null;
  await kv.put(key, String(Date.now()), { expirationTtl: SEND_LOCK_TTL_SECONDS });
  return async () => {
    try { await kv.delete(key); } catch { /* the TTL will clear it */ }
  };
}

export type DeliverReason =
  | 'claim-database-not-bound'
  | 'spigot-not-configured'
  | 'spigot-low-gas'
  | 'spigot-empty'
  | 'address-required'
  | 'nothing-held'
  | 'delivery-busy'
  | 'delivery-failed';

export async function deliverHeldFaucetDrips(options: {
  env: FaucetClaimEnv;
  userId: string;
  faucet: FaucetToken;
  deliveredTo: string;
  chainFactory?: FaucetChainFactory;
}): Promise<{ ok: boolean; reason?: DeliverReason; delivered: number; txHash?: string; deliveredTo?: string }> {
  const { env, userId, faucet } = options;
  if (!env.AUTH_DB) return { ok: false, reason: 'claim-database-not-bound', delivered: 0 };
  if (!spigotConfigured(env, faucet)) return { ok: false, reason: 'spigot-not-configured', delivered: 0 };
  if (!isEvmAddress(options.deliveredTo)) return { ok: false, reason: 'address-required', delivered: 0 };
  const deliveredTo = options.deliveredTo.toLowerCase() as `0x${string}`;
  const db = env.AUTH_DB;

  // Reclaim rows a crashed send left mid-flight, then take ours.
  const staleBefore = new Date(Date.now() - SUBMITTING_STALE_MS).toISOString();
  await db.prepare(`
    UPDATE faucet_claims SET status = 'held', delivered_to = NULL, delivered_at = NULL
    WHERE user_id = ? AND faucet = ? AND status = 'submitting' AND delivered_at < ?
  `).bind(userId, faucet.slug, staleBefore).run();
  const startedAt = new Date().toISOString();
  const taken = await db.prepare(`
    UPDATE faucet_claims SET status = 'submitting', delivered_to = ?, delivered_at = ?
    WHERE user_id = ? AND faucet = ? AND status = 'held'
    RETURNING id, amount
  `).bind(deliveredTo, startedAt, userId, faucet.slug).all<{ id: string; amount: number }>();
  const rows = Array.isArray(taken.results) ? taken.results : [];
  if (!rows.length) {
    const inFlight = await db.prepare(`
      SELECT COUNT(*) AS n FROM faucet_claims WHERE user_id = ? AND faucet = ? AND status = 'submitting'
    `).bind(userId, faucet.slug).first<{ n: number }>();
    return { ok: false, reason: numberValue(inFlight?.n) > 0 ? 'delivery-busy' : 'nothing-held', delivered: 0 };
  }
  const amount = rows.reduce((sum, row) => sum + numberValue(row.amount), 0);
  const ids = rows.map((row) => row.id);

  const release = async (): Promise<void> => {
    await db.batch(ids.map((id) => db.prepare(`
      UPDATE faucet_claims SET status = 'held', delivered_to = NULL, delivered_at = NULL WHERE id = ? AND status = 'submitting'
    `).bind(id)));
  };

  const unlock = await acquireSendLock(env, faucet);
  if (!unlock) {
    await release();
    return { ok: false, reason: 'delivery-busy', delivered: 0 };
  }
  try {
    let chain: FaucetChain;
    let snapshot: SpigotSnapshot;
    try {
      ({ chain, snapshot } = await readyChain(env, faucet, options.chainFactory ?? createViemFaucetChain));
    } catch (error) {
      await release();
      const message = error instanceof Error ? error.message : '';
      return { ok: false, reason: message === 'spigot-low-gas' ? 'spigot-low-gas' : 'spigot-not-configured', delivered: 0 };
    }
    if (snapshot.tokenBalance < amount) {
      await release();
      return { ok: false, reason: 'spigot-empty', delivered: 0 };
    }
    try {
      const { txHash } = await chain.send(deliveredTo, amount);
      if (!EVM_TX_HASH.test(txHash)) throw new Error('invalid-tx-hash');
      const deliveredAt = new Date().toISOString();
      await db.batch(ids.map((id) => db.prepare(`
        UPDATE faucet_claims SET status = 'delivered', tx_hash = ?, delivered_to = ?, delivered_at = ? WHERE id = ? AND status = 'submitting'
      `).bind(txHash, deliveredTo, deliveredAt, id)));
      return { ok: true, delivered: amount, txHash, deliveredTo };
    } catch (error) {
      await release();
      console.error(JSON.stringify({
        message: 'faucet-delivery-failed',
        faucet: faucet.slug,
        userId,
        deliveredTo,
        amount,
        error: error instanceof Error ? error.message : String(error),
      }));
      return { ok: false, reason: 'delivery-failed', delivered: 0 };
    }
  } finally {
    await unlock();
  }
}
