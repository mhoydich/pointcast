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
 *   AUTH_DB                     D1, the ledger (faucet_claims) + the send lock
 *   PC_RATES_KV                 rate limits + the 60 s spigot snapshot cache
 *   HELLO_FAUCET_SECRET_KEY     0x-prefixed private key of the spigot wallet.
 *                               Mike chose the 2019 HELLO deployer itself as the
 *                               spigot and accepts the blast radius: the key on
 *                               this server is the one that minted the supply.
 *                               Keep the ETH float small and topped up by hand.
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
/** A public RPC that hangs must not hang the desk with it. */
const RPC_TIMEOUT_MS = 3_000;
const RPC_RETRY_COUNT = 1;
/** Below this the spigot stops sending: ~20 ERC-20 transfers at ordinary 2026 gas. */
const MINIMUM_SPIGOT_ETH_WEI = 10_000_000_000_000_000n; // 0.01 ETH
/** Below this the desk says so out loud, while sending carries on. */
const LOW_GAS_WARNING_WEI = 30_000_000_000_000_000n; // 0.03 ETH
const SEND_LOCK_TTL_MS = 60_000;
/**
 * A healthy broadcast-to-ledger gap is milliseconds, so a `submitting` row this
 * old means an isolate died mid-send — on one side or the other of the
 * broadcast. Reclaiming is a guess, so make it a rare, loud one.
 */
const SUBMITTING_STALE_MS = 30 * 60_000;
const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;

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
  /** Too low to send at all. */
  lowGas: boolean;
  /** Still sending, but the float wants a top-up. */
  lowGasWarning: boolean;
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
  // Totals come from an aggregate so the displayed lines can stay bounded.
  const [totals, result] = await Promise.all([
    db.prepare(`
      SELECT
        SUM(CASE WHEN status != 'delivered' THEN amount ELSE 0 END) AS held,
        SUM(CASE WHEN status = 'delivered' THEN amount ELSE 0 END) AS delivered
      FROM faucet_claims
      WHERE user_id = ? AND faucet = ?
    `).bind(user.userId, faucet.slug).first<{ held: number; delivered: number }>(),
    db.prepare(`
      SELECT id, user_id, faucet, day, amount, status, tx_hash, delivered_to, created_at, delivered_at
      FROM faucet_claims
      WHERE user_id = ? AND faucet = ?
      ORDER BY day DESC
      LIMIT 60
    `).bind(user.userId, faucet.slug).all<FaucetClaimRow>(),
  ]);
  const rows = Array.isArray(result.results) ? result.results : [];
  // One row per day, newest first, so today is always inside the window above.
  const todayRow = rows.find((row) => row.day === day) ?? null;
  return {
    today: { claimed: Boolean(todayRow), status: todayRow?.status ?? null },
    held: numberValue(totals?.held),
    delivered: numberValue(totals?.delivered),
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

/** Did this account claim today? The one question /api/today needs. */
export async function hasClaimedFaucetToday(
  db: D1Database | undefined,
  faucet: FaucetToken,
  userId: string,
  day: string = losAngelesDate(),
): Promise<boolean> {
  if (!db) return false;
  const row = await db.prepare(`
    SELECT 1 AS hit FROM faucet_claims WHERE user_id = ? AND faucet = ? AND day = ?
  `).bind(userId, faucet.slug, day).first<{ hit: number }>();
  return Boolean(row);
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
  const transport = http(rpcUrl, { timeout: RPC_TIMEOUT_MS, retryCount: RPC_RETRY_COUNT });
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
        lowGasWarning: ethWei < LOW_GAS_WARNING_WEI,
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
 * One send per faucet at a time. Pages Functions run concurrently and a hot
 * wallet has one nonce sequence, so two simultaneous deliveries would collide:
 * the loser bounces, or worse, replaces the winner's transaction after we have
 * already written its hash down as delivered.
 *
 * D1 serialises writes, so a conditional `UPDATE … RETURNING` on a lock row is
 * an actual mutex — unlike KV, which is eventually consistent and has no CAS.
 * The lock lives beside the ledger it protects; nothing new to provision.
 */
async function acquireSendLock(db: D1Database, faucet: FaucetToken): Promise<(() => Promise<void>) | null> {
  const holder = `snd_${crypto.randomUUID().replaceAll('-', '')}`;
  const now = Date.now();
  await db.prepare(`
    INSERT OR IGNORE INTO faucet_locks (faucet, holder, acquired_at) VALUES (?, NULL, NULL)
  `).bind(faucet.slug).run();
  const taken = await db.prepare(`
    UPDATE faucet_locks SET holder = ?, acquired_at = ?
    WHERE faucet = ?
      AND (holder IS NULL OR acquired_at IS NULL OR acquired_at < ?)
    RETURNING holder
  `).bind(
    holder,
    new Date(now).toISOString(),
    faucet.slug,
    new Date(now - SEND_LOCK_TTL_MS).toISOString(),
  ).first<{ holder: string }>();
  if (!taken) return null;
  return async () => {
    try {
      await db.prepare(`
        UPDATE faucet_locks SET holder = NULL, acquired_at = NULL WHERE faucet = ? AND holder = ?
      `).bind(faucet.slug, holder).run();
    } catch { /* the 60 s expiry will clear it */ }
  };
}

/**
 * The destination, lowercased, or null when the paste is not one we will send
 * to. Mixed case carries an EIP-55 checksum, so a single typo is detectable for
 * free; an all-one-case paste carries no checksum and is taken at its word.
 */
async function checkedDestination(value: string, faucet: FaucetToken): Promise<`0x${string}` | null> {
  if (!isEvmAddress(value)) return null;
  const body = value.slice(2);
  // viem reads all-lowercase as unchecksummed already; all-uppercase it does not.
  const candidate = body === body.toUpperCase() ? value.toLowerCase() : value;
  try {
    const { isAddress } = await import('viem');
    if (!isAddress(candidate, { strict: true })) return null;
  } catch { return null; }
  const lower = value.toLowerCase() as `0x${string}`;
  // Burning drips into the void or into the token's own contract is one paste away.
  if (lower === ZERO_ADDRESS || lower === faucet.contract.toLowerCase()) return null;
  return lower;
}

export type DeliverReason =
  | 'claim-database-not-bound'
  | 'spigot-not-configured'
  | 'spigot-low-gas'
  | 'spigot-empty'
  | 'spigot-unavailable'
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
  const deliveredTo = await checkedDestination(options.deliveredTo, faucet);
  if (!deliveredTo) return { ok: false, reason: 'address-required', delivered: 0 };
  const db = env.AUTH_DB;

  // Reclaim rows a crashed send left mid-flight, then take ours. This is a
  // guess about a send we cannot see, so say so where Mike can read it.
  const staleBefore = new Date(Date.now() - SUBMITTING_STALE_MS).toISOString();
  const reclaimed = await db.prepare(`
    UPDATE faucet_claims SET status = 'held', delivered_to = NULL, delivered_at = NULL
    WHERE user_id = ? AND faucet = ? AND status = 'submitting' AND delivered_at < ?
    RETURNING id
  `).bind(userId, faucet.slug, staleBefore).all<{ id: string }>();
  const reclaimedIds = (Array.isArray(reclaimed.results) ? reclaimed.results : []).map((row) => row.id);
  if (reclaimedIds.length) {
    console.warn(JSON.stringify({
      message: 'faucet-reclaimed-submitting',
      faucet: faucet.slug,
      userId,
      ids: reclaimedIds,
    }));
  }
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

  // `delivered_at = startedAt` is the take marker: one statement moves exactly
  // the rows this call claimed, with no room for a half-applied batch.
  const release = async (): Promise<void> => {
    await db.prepare(`
      UPDATE faucet_claims SET status = 'held', delivered_to = NULL, delivered_at = NULL
      WHERE user_id = ? AND faucet = ? AND status = 'submitting' AND delivered_at = ?
    `).bind(userId, faucet.slug, startedAt).run();
  };

  const unlock = await acquireSendLock(db, faucet);
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
      const message = error instanceof Error ? error.message : String(error);
      const reason: DeliverReason = message === 'spigot-low-gas'
        ? 'spigot-low-gas'
        : message === 'spigot-not-configured'
          ? 'spigot-not-configured'
          : 'spigot-unavailable';
      if (reason === 'spigot-unavailable') {
        console.error(JSON.stringify({ message: 'faucet-spigot-unavailable', faucet: faucet.slug, userId, error: message }));
      }
      return { ok: false, reason, delivered: 0 };
    }
    if (deliveredTo === chain.address.toLowerCase()) {
      await release();
      return { ok: false, reason: 'address-required', delivered: 0 };
    }
    if (snapshot.tokenBalance < amount) {
      await release();
      return { ok: false, reason: 'spigot-empty', delivered: 0 };
    }

    let txHash: `0x${string}`;
    try {
      ({ txHash } = await chain.send(deliveredTo, amount));
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

    // The broadcast happened. Those tokens are gone whatever the ledger does
    // next, so these rows never go back to `held`: returning them would invite
    // a second send of drips that have already left the wallet. If the write
    // fails the rows stay `submitting` and the hash goes to the log, where it
    // can be reconciled against the chain by hand.
    const deliveredAt = new Date().toISOString();
    try {
      if (!EVM_TX_HASH.test(txHash)) throw new Error('invalid-tx-hash');
      await db.prepare(`
        UPDATE faucet_claims SET status = 'delivered', tx_hash = ?, delivered_to = ?, delivered_at = ?
        WHERE user_id = ? AND faucet = ? AND status = 'submitting' AND delivered_at = ?
      `).bind(txHash, deliveredTo, deliveredAt, userId, faucet.slug, startedAt).run();
    } catch (error) {
      console.error(JSON.stringify({
        message: 'faucet-delivery-unrecorded',
        faucet: faucet.slug,
        userId,
        deliveredTo,
        amount,
        txHash,
        ids,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
    return { ok: true, delivered: amount, txHash, deliveredTo };
  } finally {
    await unlock();
  }
}
