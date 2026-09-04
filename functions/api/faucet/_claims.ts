/**
 * The faucet ledger and the spigot.
 *
 * Mirrors functions/api/kennel-club/_claims.ts, with one deliberate
 * difference: a claim never touches the chain. HELLO already exists on
 * Ethereum mainnet (2019); claiming writes a `held` row, and the only
 * on-chain action is delivery, when the account names an address and the
 * spigot wallet sends every held drip in one ERC-20 transfer.
 *
 * Delivery signs first, writes the transaction's identity down, and only then
 * broadcasts. A thrown broadcast is not proof that nothing was sent — a public
 * RPC can accept a signed transaction and lose the answer — so the ledger never
 * guesses. Rows that have been signed for carry their nonce, hash and raw
 * transaction, and `reconcileFaucetSubmissions` settles them against the chain
 * itself: mined means delivered, a nonce spent by someone else means the
 * transaction is dead and the drips go back, and anything still unknown is
 * re-broadcast (same signature, same hash) until Ethereum answers. Nothing is
 * ever signed twice, so no click and no clock can pay the same drip again.
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
 *   FISHCLUB_FAUCET_SECRET_KEY  the FISHCLUB spigot key, when one is installed.
 *                               Claims work with none: the line is held, and
 *                               sending is closed for every faucet regardless.
 *   FISHCLUB_FAUCET_DAILY_CAP   optional claims per day (default 50, max 500)
 *   REWARDS_TONEBLOOM_SECRET    shared HMAC secret with the Tone Bloom satellite
 *   REWARDS_INDUSTRYNEXT_SECRET shared HMAC secret with the Industry Next satellite
 */
import type { PointCastUser } from '../../../src/lib/auth/types';
import type { AuthEnv } from '../auth/session';
import {
  EVM_TX_HASH,
  faucetDailyCap,
  isEvmAddress,
  losAngelesDate,
  FAUCETS,
  type FaucetToken,
} from '../../../src/lib/faucet';
import {
  REWARD_PROGRAMS,
  getRewardProgram,
  isRewardReceiptPayload,
  verifyRewardToken,
  type RewardReceiptPayload,
} from '../../../src/lib/rewards';

const DEFAULT_RPC = 'https://cloudflare-eth.com';
/** A public RPC that hangs must not hang the desk with it. */
const RPC_TIMEOUT_MS = 3_000;
const RPC_RETRY_COUNT = 1;
/** Below this the spigot stops sending: a few ERC-20 transfers at ordinary 2026 gas. */
const MINIMUM_SPIGOT_ETH_WEI = 1_000_000_000_000_000n; // 0.001 ETH
/** Below this the desk says so out loud, while sending carries on. */
const LOW_GAS_WARNING_WEI = 5_000_000_000_000_000n; // 0.005 ETH
const SEND_LOCK_TTL_MS = 60_000;
/**
 * A `submitting` row with no transaction on it this old means an isolate died
 * before anything was signed. That is the one case where nothing can be in
 * flight, so it is the one case a clock is allowed to reclaim.
 */
const SUBMITTING_STALE_MS = 30 * 60_000;
/**
 * A transaction the node still has not heard of after this long has probably
 * been dropped from the mempool. Re-broadcasting the same signed bytes is free
 * and idempotent: same nonce, same hash, so at most one of them can ever mine.
 */
const REBROADCAST_AFTER_MS = 10 * 60_000;
const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;

export type FaucetClaimStatus = 'held' | 'submitting' | 'delivered';

export interface FaucetClaimEnv extends AuthEnv {
  PC_RATES_KV?: KVNamespace;
  HELLO_FAUCET_SECRET_KEY?: string;
  FAUCET_ETH_RPC_URL?: string;
  HELLO_FAUCET_DAILY_CAP?: string;
  FISHCLUB_FAUCET_SECRET_KEY?: string;
  FISHCLUB_FAUCET_DAILY_CAP?: string;
  REWARDS_TONEBLOOM_SECRET?: string;
  REWARDS_INDUSTRYNEXT_SECRET?: string;
}

/**
 * Each faucet names its own secrets. Renaming HELLO's bindings to something
 * generic would silently unconfigure the live spigot on the next deploy, so a
 * new token gets new variable names and the old ones never move.
 */
const FAUCET_ENV: Record<string, { secretKey: keyof FaucetClaimEnv; dailyCap: keyof FaucetClaimEnv }> = {
  hello: { secretKey: 'HELLO_FAUCET_SECRET_KEY', dailyCap: 'HELLO_FAUCET_DAILY_CAP' },
  fishclub: { secretKey: 'FISHCLUB_FAUCET_SECRET_KEY', dailyCap: 'FISHCLUB_FAUCET_DAILY_CAP' },
};

function envString(env: Partial<FaucetClaimEnv>, key: keyof FaucetClaimEnv | undefined): string | undefined {
  if (!key) return undefined;
  const value = env[key];
  return typeof value === 'string' ? value : undefined;
}

/** The per-satellite receipt keys this deploy holds, keyed by `kid`. */
export function rewardSecretsByKid(env: Partial<FaucetClaimEnv>): Record<string, string | undefined> {
  const secrets: Record<string, string | undefined> = {};
  for (const program of REWARD_PROGRAMS) {
    const secret = envString(env, program.secretEnv)?.trim();
    if (secret) secrets[program.kid] = secret;
  }
  return secrets;
}

export interface FaucetClaimRow {
  id: string;
  user_id: string;
  faucet: string;
  day: string;
  amount: number;
  status: FaucetClaimStatus;
  tx_hash: string | null;
  /** The spigot nonce this row's transaction was signed for; null until signed. */
  nonce: number | null;
  /** The raw signed transaction, kept so a stalled send can be re-broadcast verbatim. */
  signed_tx: string | null;
  delivered_to: string | null;
  created_at: string;
  delivered_at: string | null;
  /** Which satellite sent the person here, when a receipt earned this line. */
  via: string | null;
  /** The reward program id, for the person's own ledger. */
  program: string | null;
  reward_run_id: string | null;
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

/** A signed, un-broadcast ERC-20 transfer: everything needed to settle it later. */
export interface FaucetPreparedTx {
  nonce: number;
  txHash: `0x${string}`;
  signedTx: `0x${string}`;
}

/** What the chain says about one transaction we signed. */
export interface FaucetTxProbe {
  /** It has a receipt: the transfer happened. */
  mined: boolean;
  /** The node has it — mempool or block. Unknown means dropped, or never arrived. */
  known: boolean;
  /** The spigot has moved past this nonce, so this transaction can never mine now. */
  nonceConsumed: boolean;
}

export interface FaucetChain {
  address: `0x${string}`;
  snapshot(): Promise<SpigotSnapshot>;
  /** Build and sign the transfer of `amount` whole tokens. Nothing is broadcast. */
  prepare(to: `0x${string}`, amount: number): Promise<FaucetPreparedTx>;
  /** Put signed bytes on the wire. Idempotent: the same bytes are the same transaction. */
  broadcast(signedTx: `0x${string}`): Promise<`0x${string}`>;
  /** Ask the chain what became of one transaction we signed. */
  probe(txHash: `0x${string}`, nonce: number): Promise<FaucetTxProbe>;
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
    via: string | null;
    program: string | null;
  }>;
}

/** One line per faucet, so a desk can show both balances without a second fetch. */
export interface FaucetBalance {
  slug: string;
  ticker: string;
  held: number;
  delivered: number;
}

export function spigotSecretKey(env: Partial<FaucetClaimEnv>, faucet: FaucetToken): string | null {
  const key = envString(env, FAUCET_ENV[faucet.slug]?.secretKey)?.trim();
  return key && /^0x[0-9a-fA-F]{64}$/.test(key) ? key : null;
}

export function spigotConfigured(env: Partial<FaucetClaimEnv>, faucet: FaucetToken): boolean {
  return spigotSecretKey(env, faucet) !== null;
}

export function faucetCap(env: Partial<FaucetClaimEnv>, faucet: FaucetToken): number {
  return faucetDailyCap(envString(env, FAUCET_ENV[faucet.slug]?.dailyCap));
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

// ---------------------------------------------------------------------------
// Self-provisioning schema. The tables mirror migrations/auth/0009 exactly;
// this exists so a deploy needs no `wrangler d1 migrations apply` step. The
// first request creates what is missing and every later request is a no-op.
// `CREATE TABLE IF NOT EXISTS` is idempotent and D1 serialises writes, so
// concurrent first requests cannot race each other into an error.
// ---------------------------------------------------------------------------

const FAUCET_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS faucet_claims (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    faucet TEXT NOT NULL,
    day TEXT NOT NULL CHECK (length(day) = 10),
    amount INTEGER NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL CHECK (status IN ('held', 'submitting', 'delivered')),
    tx_hash TEXT,
    nonce INTEGER,
    signed_tx TEXT,
    delivered_to TEXT,
    created_at TEXT NOT NULL,
    delivered_at TEXT,
    UNIQUE (user_id, faucet, day),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS faucet_claims_faucet_day_idx ON faucet_claims(faucet, day)`,
  `CREATE INDEX IF NOT EXISTS faucet_claims_user_status_idx ON faucet_claims(user_id, faucet, status)`,
  `CREATE INDEX IF NOT EXISTS faucet_claims_created_at_idx ON faucet_claims(created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS faucet_locks (
    faucet TEXT PRIMARY KEY,
    holder TEXT,
    acquired_at TEXT
  )`,
  // One row per rewarded trip to a satellite. PointCast keeps the account here
  // and never tells the satellite whose run it is; the satellite knows only the
  // run id. `status` is the whole life of it: open (launched), completed
  // (receipt seen), redeemed (a line was written), resolved (finished but
  // awarded nothing, truthfully), expired.
  `CREATE TABLE IF NOT EXISTS reward_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issuer TEXT NOT NULL,
    program TEXT NOT NULL,
    faucet TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'completed', 'redeemed', 'resolved', 'expired')),
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    launch_nonce TEXT NOT NULL,
    receipt_nonce TEXT,
    redeemed_claim_id TEXT,
    resolved_reason TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS reward_runs_user_program_idx ON reward_runs(user_id, program, status)`,
  // The single-use record. The primary key is the whole mechanism: a second
  // presentation of the same receipt loses on it inside a transaction, so it
  // can never write a second ledger line, and `claim_id` hands the retry the
  // line the first one wrote.
  `CREATE TABLE IF NOT EXISTS reward_receipts (
    issuer TEXT NOT NULL,
    nonce TEXT NOT NULL,
    run_id TEXT NOT NULL,
    consumed_at TEXT NOT NULL,
    claim_id TEXT,
    PRIMARY KEY (issuer, nonce)
  )`,
];

/**
 * Columns added after the table shipped. Production already has a
 * `faucet_claims` that `CREATE TABLE IF NOT EXISTS` will not touch, so the
 * sign-first columns arrive by guarded ALTER instead — mirroring
 * migrations/auth/0010_faucet_signed_tx.sql, which does the same for local
 * work and tests.
 */
const FAUCET_CLAIM_COLUMNS: Array<[string, string]> = [
  ['nonce', 'INTEGER'],
  ['signed_tx', 'TEXT'],
  // Server-written provenance for a reward claim. Null on every ordinary drip
  // and on every row that predates migrations/auth/0011_reward_runs.sql. A
  // `via` query parameter grants nothing; only a verified receipt writes these.
  ['via', 'TEXT'],
  ['program', 'TEXT'],
  ['reward_run_id', 'TEXT'],
];

const provisioned = new WeakMap<D1Database, Promise<void>>();

/** Make sure the ledger tables exist; cached per binding so it runs once per isolate. */
export function ensureFaucetSchema(db: D1Database): Promise<void> {
  let pending = provisioned.get(db);
  if (!pending) {
    pending = (async () => {
      for (const statement of FAUCET_SCHEMA) await db.prepare(statement).run();
      const info = await db.prepare(`PRAGMA table_info(faucet_claims)`).all<{ name: string }>();
      const present = new Set((Array.isArray(info.results) ? info.results : []).map((column) => column.name));
      for (const [name, type] of FAUCET_CLAIM_COLUMNS) {
        // ADD COLUMN has no IF NOT EXISTS in SQLite, so ask first.
        if (!present.has(name)) await db.prepare(`ALTER TABLE faucet_claims ADD COLUMN ${name} ${type}`).run();
      }
    })().catch((error) => {
      provisioned.delete(db);
      throw error;
    });
    provisioned.set(db, pending);
  }
  return pending;
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
  await ensureFaucetSchema(db);
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
  await ensureFaucetSchema(db);
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
      SELECT id, user_id, faucet, day, amount, status, tx_hash, delivered_to, created_at, delivered_at,
             via, program, reward_run_id
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
      via: row.via ?? null,
      program: row.program ?? null,
    })),
  };
}

/**
 * Held and delivered across every faucet, in one grouped query. The desk shows
 * both tokens together; the scope asked for them discoverable in one place
 * rather than behind a second page.
 */
export async function getFaucetBalances(
  db: D1Database | undefined,
  userId: string,
): Promise<FaucetBalance[]> {
  const empty = FAUCETS.map((faucet) => ({ slug: faucet.slug, ticker: faucet.ticker, held: 0, delivered: 0 }));
  if (!db) return empty;
  await ensureFaucetSchema(db);
  const result = await db.prepare(`
    SELECT faucet,
      SUM(CASE WHEN status != 'delivered' THEN amount ELSE 0 END) AS held,
      SUM(CASE WHEN status = 'delivered' THEN amount ELSE 0 END) AS delivered
    FROM faucet_claims
    WHERE user_id = ?
    GROUP BY faucet
  `).bind(userId).all<{ faucet: string; held: number; delivered: number }>();
  const rows = Array.isArray(result.results) ? result.results : [];
  return empty.map((balance) => {
    const row = rows.find((candidate) => candidate.faucet === balance.slug);
    return row
      ? { ...balance, held: numberValue(row.held), delivered: numberValue(row.delivered) }
      : balance;
  });
}

/** Did this account claim today? The one question /api/today needs. */
export async function hasClaimedFaucetToday(
  db: D1Database | undefined,
  faucet: FaucetToken,
  userId: string,
  day: string = losAngelesDate(),
): Promise<boolean> {
  if (!db) return false;
  await ensureFaucetSchema(db);
  const row = await db.prepare(`
    SELECT 1 AS hit FROM faucet_claims WHERE user_id = ? AND faucet = ? AND day = ?
  `).bind(userId, faucet.slug, day).first<{ hit: number }>();
  return Boolean(row);
}

export type ClaimReason =
  | 'already-claimed'
  | 'daily-cap-reached'
  | 'claim-database-not-bound'
  /** This faucet only pays against a completion receipt. */
  | 'receipt-required'
  | 'receipt-invalid'
  | 'receipt-expired'
  | 'receipt-program-mismatch'
  /** The satellite's own numbers do not meet the program's duration rule. */
  | 'receipt-too-short'
  | 'run-not-found'
  | 'run-expired'
  | 'account-mismatch'
  | 'rewards-not-configured';

export interface FaucetClaimLine {
  id: string;
  day: string;
  amount: number;
  status: 'held';
  createdAt: string;
  via?: string | null;
  program?: string | null;
  rewardRunId?: string | null;
}

export interface FaucetClaimOutcome {
  ok: boolean;
  reason?: ClaimReason;
  claim?: FaucetClaimLine;
  /** True when this receipt had already been redeemed and this is its original line. */
  replay?: boolean;
}

interface ClaimRowShape {
  id: string;
  day: string;
  amount: number;
  status: 'held';
  created_at: string;
  via: string | null;
  program: string | null;
  reward_run_id: string | null;
}

const CLAIM_COLUMNS = 'id, day, amount, status, created_at, via, program, reward_run_id';

function claimLine(row: ClaimRowShape): FaucetClaimLine {
  return {
    id: row.id,
    day: row.day,
    amount: numberValue(row.amount),
    status: 'held',
    createdAt: row.created_at,
    via: row.via ?? null,
    program: row.program ?? null,
    rewardRunId: row.reward_run_id ?? null,
  };
}

/**
 * The one insert that can write a ledger line, cap and one-per-day baked into
 * the statement itself so the check and the write cannot drift apart. It is
 * conditional rather than throwing: a blocked claim inserts nothing and leaves
 * the transaction around it intact, which is what lets the reward path consume
 * a receipt only when a line actually landed.
 */
function claimInsert(db: D1Database, values: {
  id: string;
  userId: string;
  faucet: string;
  day: string;
  amount: number;
  createdAt: string;
  cap: number;
  via: string | null;
  program: string | null;
  rewardRunId: string | null;
}): D1PreparedStatement {
  return db.prepare(`
    INSERT INTO faucet_claims (id, user_id, faucet, day, amount, status, tx_hash, delivered_to, created_at, delivered_at, via, program, reward_run_id)
    SELECT ?, ?, ?, ?, ?, 'held', NULL, NULL, ?, NULL, ?, ?, ?
    WHERE (SELECT COUNT(*) FROM faucet_claims WHERE faucet = ? AND day = ?) < ?
      AND NOT EXISTS (
        SELECT 1 FROM faucet_claims WHERE user_id = ? AND faucet = ? AND day = ?
      )
  `).bind(
    values.id, values.userId, values.faucet, values.day, values.amount, values.createdAt,
    values.via, values.program, values.rewardRunId,
    values.faucet, values.day, values.cap,
    values.userId, values.faucet, values.day,
  );
}

/**
 * Write today's `held` row. Pure ledger; nothing is sent.
 *
 * With a `receipt` this is the reward path instead: verify, consume the
 * receipt and write the line in one transaction, or write nothing at all.
 */
export async function claimFaucetDrip(options: {
  env: FaucetClaimEnv;
  user: PointCastUser;
  faucet: FaucetToken;
  day?: string;
  /** A satellite's signed completion receipt, when the person carried one back. */
  receipt?: string | null;
}): Promise<FaucetClaimOutcome> {
  const { env, user, faucet } = options;
  if (!env.AUTH_DB) return { ok: false, reason: 'claim-database-not-bound' };
  const db = env.AUTH_DB;
  await ensureFaucetSchema(db);
  const day = options.day ?? losAngelesDate();
  const receipt = typeof options.receipt === 'string' ? options.receipt.trim() : '';
  if (receipt) return redeemRewardReceipt({ env, db, user, faucet, day, receipt });
  // FISHCLUB is the ending of five quiet minutes, not a daily allowance.
  if (faucet.claim === 'receipt') return { ok: false, reason: 'receipt-required' };

  const cap = faucetCap(env, faucet);
  const id = `fct_${crypto.randomUUID().replaceAll('-', '')}`;
  const createdAt = new Date().toISOString();
  await claimInsert(db, {
    id, userId: user.userId, faucet: faucet.slug, day, amount: faucet.dailyAmount, createdAt, cap,
    via: null, program: null, rewardRunId: null,
  }).run();
  const inserted = await db.prepare(`SELECT ${CLAIM_COLUMNS} FROM faucet_claims WHERE id = ?`)
    .bind(id).first<ClaimRowShape>();
  if (inserted) return { ok: true, claim: claimLine(inserted) };
  const existing = await db.prepare(`
    SELECT id FROM faucet_claims WHERE user_id = ? AND faucet = ? AND day = ?
  `).bind(user.userId, faucet.slug, day).first<{ id: string }>();
  return { ok: false, reason: existing ? 'already-claimed' : 'daily-cap-reached' };
}

interface RewardRunRow {
  id: string;
  user_id: string;
  issuer: string;
  program: string;
  faucet: string;
  status: string;
  expires_at: string;
}

/** Hand back the line a receipt already produced, or say why it is not this account's. */
async function replayRedeemedClaim(
  db: D1Database,
  userId: string,
  claimId: string | null,
): Promise<FaucetClaimOutcome> {
  // A consumed record with no claim id cannot happen through the batch below;
  // if it ever did, the honest answer is that this receipt is spent.
  if (!claimId) return { ok: false, reason: 'already-claimed' };
  const row = await db.prepare(`SELECT ${CLAIM_COLUMNS}, user_id FROM faucet_claims WHERE id = ?`)
    .bind(claimId).first<ClaimRowShape & { user_id: string }>();
  if (!row) return { ok: false, reason: 'already-claimed' };
  if (row.user_id !== userId) return { ok: false, reason: 'account-mismatch' };
  return { ok: true, claim: claimLine(row), replay: true };
}

/**
 * The only award step for a rewarded run.
 *
 * Order matters. Everything cheap and stateless happens first — signature,
 * audience, program, the satellite's own duration numbers — so a forged or
 * stale receipt never reaches the database. Then the single-use record is
 * checked, because a retry of a redeemed receipt has to return the original
 * line rather than fail against its own now-redeemed run. Then the run, the
 * account binding and the clock. Only then does anything get written.
 *
 * The write is one `db.batch`, which D1 runs in a single transaction:
 *   1. insert the ledger line, conditional on cap and one-per-day;
 *   2. insert the single-use record, conditional on that line existing;
 *   3. mark the run redeemed, conditional on that line existing.
 * A lost race on `(issuer, nonce)` throws at step 2 and rolls all three back,
 * so exactly one of two concurrent claims can ever write a line. A ledger
 * failure at step 1 rolls back too, which is what keeps the receipt good for a
 * retry. And a claim blocked by policy writes nothing anywhere: the receipt is
 * not consumed, and the run is resolved with the true reason so tomorrow cannot
 * turn an old completion into a fresh entitlement.
 */
async function redeemRewardReceipt(options: {
  env: FaucetClaimEnv;
  db: D1Database;
  user: PointCastUser;
  faucet: FaucetToken;
  day: string;
  receipt: string;
}): Promise<FaucetClaimOutcome> {
  const { env, db, user, faucet, day, receipt } = options;
  const secrets = rewardSecretsByKid(env);
  if (Object.keys(secrets).length === 0) return { ok: false, reason: 'rewards-not-configured' };

  const verified = await verifyRewardToken<RewardReceiptPayload>('receipt', receipt, secrets);
  if (!verified.ok) {
    return { ok: false, reason: verified.reason === 'expired' ? 'receipt-expired' : 'receipt-invalid' };
  }
  const payload = verified.payload;
  if (!isRewardReceiptPayload(payload)) return { ok: false, reason: 'receipt-invalid' };

  const program = getRewardProgram(payload.program);
  if (
    !program
    || program.faucet !== faucet.slug
    || program.issuer !== payload.iss
    || program.kid !== payload.kid
  ) {
    return { ok: false, reason: 'receipt-program-mismatch' };
  }
  if (payload.finishedAt < payload.startedAt) return { ok: false, reason: 'receipt-too-short' };
  if (payload.creditedSeconds < program.minCreditedSeconds) return { ok: false, reason: 'receipt-too-short' };
  if (payload.finishedAt - payload.startedAt < program.minElapsedSeconds) {
    return { ok: false, reason: 'receipt-too-short' };
  }

  const consumed = await db.prepare(`
    SELECT claim_id FROM reward_receipts WHERE issuer = ? AND nonce = ?
  `).bind(payload.iss, payload.nonce).first<{ claim_id: string | null }>();
  if (consumed) return replayRedeemedClaim(db, user.userId, consumed.claim_id);

  const run = await db.prepare(`
    SELECT id, user_id, issuer, program, faucet, status, expires_at FROM reward_runs WHERE id = ?
  `).bind(payload.run).first<RewardRunRow>();
  if (!run) return { ok: false, reason: 'run-not-found' };
  // Neutral, and never an automatic reassignment: the run belongs to whoever
  // started it, and only they can finish it.
  if (run.user_id !== user.userId) return { ok: false, reason: 'account-mismatch' };
  if (run.program !== payload.program || run.faucet !== faucet.slug || run.issuer !== payload.iss) {
    return { ok: false, reason: 'receipt-program-mismatch' };
  }
  if (run.status !== 'open' && run.status !== 'completed') return { ok: false, reason: 'run-expired' };
  if (Date.parse(run.expires_at) <= Date.now()) return { ok: false, reason: 'run-expired' };

  const id = `fct_${crypto.randomUUID().replaceAll('-', '')}`;
  const createdAt = new Date().toISOString();
  try {
    await db.batch([
      claimInsert(db, {
        id,
        userId: user.userId,
        faucet: faucet.slug,
        day,
        amount: faucet.dailyAmount,
        createdAt,
        cap: faucetCap(env, faucet),
        via: program.via,
        program: program.id,
        rewardRunId: run.id,
      }),
      db.prepare(`
        INSERT INTO reward_receipts (issuer, nonce, run_id, consumed_at, claim_id)
        SELECT ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM faucet_claims WHERE id = ?)
      `).bind(payload.iss, payload.nonce, run.id, createdAt, id, id),
      db.prepare(`
        UPDATE reward_runs SET status = 'redeemed', receipt_nonce = ?, redeemed_claim_id = ?
        WHERE id = ? AND status IN ('open', 'completed')
          AND EXISTS (SELECT 1 FROM faucet_claims WHERE id = ?)
      `).bind(payload.nonce, id, run.id, id),
    ]);
  } catch (error) {
    // Either someone else took this receipt while we were checking it, or the
    // ledger write failed. The first has a winner to point at; the second left
    // nothing behind and is the caller's 503, with the receipt still good.
    const winner = await db.prepare(`
      SELECT claim_id FROM reward_receipts WHERE issuer = ? AND nonce = ?
    `).bind(payload.iss, payload.nonce).first<{ claim_id: string | null }>().catch(() => null);
    if (winner) return replayRedeemedClaim(db, user.userId, winner.claim_id);
    throw error;
  }

  const written = await db.prepare(`SELECT ${CLAIM_COLUMNS} FROM faucet_claims WHERE id = ?`)
    .bind(id).first<ClaimRowShape>();
  if (written) return { ok: true, claim: claimLine(written) };

  // Nothing landed, so nothing was consumed. Say which wall it hit, and close
  // the run so the same completion cannot be presented again tomorrow.
  const existing = await db.prepare(`
    SELECT id FROM faucet_claims WHERE user_id = ? AND faucet = ? AND day = ?
  `).bind(user.userId, faucet.slug, day).first<{ id: string }>();
  const reason: ClaimReason = existing ? 'already-claimed' : 'daily-cap-reached';
  await db.prepare(`
    UPDATE reward_runs SET status = 'resolved', resolved_reason = ?
    WHERE id = ? AND status IN ('open', 'completed')
  `).bind(reason, run.id).run().catch(() => { /* the answer above is still true */ });
  return { ok: false, reason };
}

// ---------------------------------------------------------------------------
// The spigot: viem against Ethereum mainnet, from a Pages Function.
// ---------------------------------------------------------------------------

export async function createViemFaucetChain(secretKey: string, rpcUrl: string, faucet: FaucetToken): Promise<FaucetChain> {
  const [
    { createPublicClient, http, erc20Abi, encodeFunctionData, keccak256, parseUnits, formatEther },
    { privateKeyToAccount },
    { mainnet },
  ] = await Promise.all([
    import('viem'),
    import('viem/accounts'),
    import('viem/chains'),
  ]);
  const account = privateKeyToAccount(secretKey as `0x${string}`);
  const transport = http(rpcUrl, { timeout: RPC_TIMEOUT_MS, retryCount: RPC_RETRY_COUNT });
  const publicClient = createPublicClient({ chain: mainnet, transport });
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
    async prepare(to, amount) {
      const dec = await decimals();
      const data = encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [to, parseUnits(String(amount), dec)] });
      // `pending` so a transaction we sent seconds ago still counts: two
      // deliveries in one minute must not be handed the same nonce.
      const [nonce, fees] = await Promise.all([
        publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' }),
        publicClient.estimateFeesPerGas(),
      ]);
      const gas = await publicClient.estimateGas({ account: account.address, to: faucet.contract, data });
      // Signed with an explicit nonce and chain id, so the bytes below are the
      // whole transaction: nothing is decided later, at broadcast time.
      const signedTx = await account.signTransaction({
        type: 'eip1559',
        chainId: mainnet.id,
        to: faucet.contract,
        data,
        nonce,
        gas,
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });
      // A transaction's hash is the hash of its signed bytes, so we know the
      // receipt to look for before anyone has heard of the transaction.
      return { nonce, txHash: keccak256(signedTx), signedTx };
    },
    async broadcast(signedTx) {
      return await publicClient.sendRawTransaction({ serializedTransaction: signedTx });
    },
    async probe(txHash, nonce) {
      const [receipt, known, latestNonce] = await Promise.all([
        publicClient.getTransactionReceipt({ hash: txHash }).catch(() => null),
        publicClient.getTransaction({ hash: txHash }).then(() => true).catch(() => false),
        publicClient.getTransactionCount({ address: account.address, blockTag: 'latest' }),
      ]);
      // A reverted transfer moved no tokens but did spend the nonce, so report
      // it the way a replaced transaction is reported: dead, and safe to re-owe.
      if (receipt && receipt.status !== 'success') return { mined: false, known: false, nonceConsumed: true };
      return { mined: Boolean(receipt), known: Boolean(receipt) || known, nonceConsumed: latestNonce > nonce };
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

// ---------------------------------------------------------------------------
// Settlement. A `submitting` row is a question — did this transaction land? —
// and the only thing entitled to answer it is Ethereum.
// ---------------------------------------------------------------------------

interface SubmissionGroup {
  txHash: string | null;
  nonce: number | null;
  signedTx: string | null;
  startedAt: string | null;
  ids: string[];
}

const placeholders = (ids: string[]): string => ids.map(() => '?').join(', ');

/**
 * Settle every in-flight row this account has against the chain.
 *
 * Rows carrying a transaction are decided by that transaction: mined is
 * delivered; a nonce spent by something else means ours can never mine, so the
 * drips are owed again; anything still unknown after ten minutes is
 * re-broadcast from the signed bytes we kept, which cannot double-spend because
 * it is the same signature and the same hash. Rows carrying nothing were never
 * signed for, so after half an hour they are safe to hand straight back.
 *
 * With no chain (spigot unconfigured, or the RPC unreachable) only that last,
 * provably safe case is applied. Silence is better than a guess here.
 */
export async function reconcileFaucetSubmissions(
  db: D1Database,
  faucet: FaucetToken,
  userId: string,
  chain: FaucetChain | null,
): Promise<void> {
  const result = await db.prepare(`
    SELECT id, tx_hash, nonce, signed_tx, delivered_at
    FROM faucet_claims
    WHERE user_id = ? AND faucet = ? AND status = 'submitting'
  `).bind(userId, faucet.slug).all<{
    id: string;
    tx_hash: string | null;
    nonce: number | null;
    signed_tx: string | null;
    delivered_at: string | null;
  }>();
  const rows = Array.isArray(result.results) ? result.results : [];
  if (!rows.length) return;

  // One delivery signs one transaction for every drip it took, so settle by
  // attempt rather than by row: one probe, not one probe per drip.
  const groups = new Map<string, SubmissionGroup>();
  for (const row of rows) {
    const key = `${row.delivered_at ?? ''}|${row.tx_hash ?? ''}`;
    const group = groups.get(key) ?? {
      txHash: row.tx_hash,
      nonce: row.nonce,
      signedTx: row.signed_tx,
      startedAt: row.delivered_at,
      ids: [],
    };
    group.ids.push(row.id);
    groups.set(key, group);
  }

  const now = Date.now();
  for (const group of groups.values()) {
    const startedAt = group.startedAt ? Date.parse(group.startedAt) : Number.NaN;
    const age = Number.isFinite(startedAt) ? now - startedAt : Number.POSITIVE_INFINITY;
    const ids = group.ids;
    const toHeld = async (message: string): Promise<void> => {
      await db.prepare(`
        UPDATE faucet_claims
        SET status = 'held', tx_hash = NULL, nonce = NULL, signed_tx = NULL, delivered_to = NULL, delivered_at = NULL
        WHERE status = 'submitting' AND id IN (${placeholders(ids)})
      `).bind(...ids).run();
      console.warn(JSON.stringify({ message, faucet: faucet.slug, userId, ids, txHash: group.txHash }));
    };

    if (!group.txHash) {
      // Nothing was ever signed for these, so nothing can be in flight.
      if (age > SUBMITTING_STALE_MS) await toHeld('faucet-reclaimed-unsigned').catch(() => {});
      continue;
    }
    if (!chain || !EVM_TX_HASH.test(group.txHash)) continue;

    let probe: FaucetTxProbe;
    try {
      probe = await chain.probe(group.txHash as `0x${string}`, group.nonce ?? 0);
    } catch {
      continue; // An unanswered question stays a question.
    }
    if (probe.mined) {
      try {
        await db.prepare(`
          UPDATE faucet_claims SET status = 'delivered', delivered_at = ?
          WHERE status = 'submitting' AND id IN (${placeholders(ids)})
        `).bind(new Date().toISOString(), ...ids).run();
        console.warn(JSON.stringify({ message: 'faucet-submission-settled', faucet: faucet.slug, userId, ids, txHash: group.txHash }));
      } catch { /* still `submitting`; the next pass asks again */ }
      continue;
    }
    if (probe.nonceConsumed && !probe.known) {
      await toHeld('faucet-submission-dead').catch(() => {});
      continue;
    }
    if (age > REBROADCAST_AFTER_MS && group.signedTx) {
      // Same bytes, same hash. "already known" and "nonce too low" both mean
      // the network has it, which is exactly what we were asking for.
      try { await chain.broadcast(group.signedTx as `0x${string}`); } catch { /* asked, that is all */ }
    }
  }
}

/**
 * Reconcile this account's in-flight rows, building a chain only when there is
 * something in flight — the common path is a single indexed count, no RPC.
 */
export async function settleFaucetSubmissions(
  env: FaucetClaimEnv,
  faucet: FaucetToken,
  userId: string,
  chainFactory: FaucetChainFactory = createViemFaucetChain,
): Promise<void> {
  const db = env.AUTH_DB;
  if (!db) return;
  await ensureFaucetSchema(db);
  const inFlight = await db.prepare(`
    SELECT COUNT(*) AS n FROM faucet_claims WHERE user_id = ? AND faucet = ? AND status = 'submitting'
  `).bind(userId, faucet.slug).first<{ n: number }>();
  if (numberValue(inFlight?.n) === 0) return;
  const secretKey = spigotSecretKey(env, faucet);
  let chain: FaucetChain | null = null;
  if (secretKey) {
    try {
      chain = await chainFactory(secretKey, env.FAUCET_ETH_RPC_URL?.trim() || DEFAULT_RPC, faucet);
    } catch { chain = null; }
  }
  await reconcileFaucetSubmissions(db, faucet, userId, chain);
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
  | 'delivery-failed'
  /** Signed and probably broadcast, but the chain has not answered yet. Settles itself. */
  | 'delivery-uncertain';

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
  await ensureFaucetSchema(db);

  // Settle before we take. Rows still in flight from a previous attempt have to
  // be decided by the chain first, or a drip that is already on its way would
  // read as owed. This is the only ordering that works: after the take there is
  // nothing left to settle, because a `submitting` row is never `held`.
  await settleFaucetSubmissions(env, faucet, userId, options.chainFactory ?? createViemFaucetChain)
    .catch((error) => {
      // A reconcile that fails leaves rows `submitting`, which is the cautious
      // side: the take below simply will not see them.
      console.error(JSON.stringify({
        message: 'faucet-reconcile-failed',
        faucet: faucet.slug,
        userId,
        error: error instanceof Error ? error.message : String(error),
      }));
    });

  // A taken row carries this attempt's transaction or none at all, so a
  // reconcile running beside us can never read a stale hash off it.
  const startedAt = new Date().toISOString();
  const taken = await db.prepare(`
    UPDATE faucet_claims
    SET status = 'submitting', tx_hash = NULL, nonce = NULL, signed_tx = NULL, delivered_to = ?, delivered_at = ?
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
      UPDATE faucet_claims
      SET status = 'held', tx_hash = NULL, nonce = NULL, signed_tx = NULL, delivered_to = NULL, delivered_at = NULL
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

    // Sign, but do not send. Everything up to here can be released freely,
    // because there is nothing on the wire to contradict us.
    let prepared: FaucetPreparedTx;
    try {
      prepared = await chain.prepare(deliveredTo, amount);
      if (!EVM_TX_HASH.test(prepared.txHash)) throw new Error('invalid-tx-hash');
    } catch (error) {
      await release();
      console.error(JSON.stringify({
        message: 'faucet-prepare-failed',
        faucet: faucet.slug,
        userId,
        deliveredTo,
        amount,
        error: error instanceof Error ? error.message : String(error),
      }));
      return { ok: false, reason: 'delivery-failed', delivered: 0 };
    }

    // Write down what we are about to send before we send it. A row whose
    // transaction we cannot name is a row nothing can ever settle, so this is
    // the last moment the drips can safely go back to `held`.
    try {
      await db.prepare(`
        UPDATE faucet_claims SET tx_hash = ?, nonce = ?, signed_tx = ?
        WHERE user_id = ? AND faucet = ? AND status = 'submitting' AND delivered_at = ?
      `).bind(prepared.txHash, prepared.nonce, prepared.signedTx, userId, faucet.slug, startedAt).run();
    } catch (error) {
      await release();
      console.error(JSON.stringify({
        message: 'faucet-signature-unrecorded',
        faucet: faucet.slug,
        userId,
        deliveredTo,
        amount,
        txHash: prepared.txHash,
        error: error instanceof Error ? error.message : String(error),
      }));
      return { ok: false, reason: 'delivery-failed', delivered: 0 };
    }

    // The rows carry their transaction now. If the ledger write below fails the
    // rows stay `submitting` with that hash on them, where the next reconcile
    // picks them up — they never go back to `held`, because returning them
    // would invite a second send of drips that may already have left.
    const settle = async (): Promise<void> => {
      try {
        await db.prepare(`
          UPDATE faucet_claims SET status = 'delivered', delivered_to = ?, delivered_at = ?
          WHERE user_id = ? AND faucet = ? AND status = 'submitting' AND delivered_at = ?
        `).bind(deliveredTo, new Date().toISOString(), userId, faucet.slug, startedAt).run();
      } catch (error) {
        console.error(JSON.stringify({
          message: 'faucet-delivery-unrecorded',
          faucet: faucet.slug,
          userId,
          deliveredTo,
          amount,
          txHash: prepared.txHash,
          ids,
          error: error instanceof Error ? error.message : String(error),
        }));
      }
    };

    try {
      await chain.broadcast(prepared.signedTx);
    } catch (error) {
      console.error(JSON.stringify({
        message: 'faucet-broadcast-failed',
        faucet: faucet.slug,
        userId,
        deliveredTo,
        amount,
        txHash: prepared.txHash,
        nonce: prepared.nonce,
        error: error instanceof Error ? error.message : String(error),
      }));
      // A thrown broadcast is not proof of no broadcast: a timeout or a lost
      // response can hide an accepted transaction. Ask the chain about this
      // exact transaction instead of assuming either way.
      let probe: FaucetTxProbe | null = null;
      try { probe = await chain.probe(prepared.txHash, prepared.nonce); } catch { probe = null; }
      if (probe?.mined) {
        await settle();
        return { ok: true, delivered: amount, txHash: prepared.txHash, deliveredTo };
      }
      if (probe && probe.nonceConsumed && !probe.known) {
        // Some other transaction owns that nonce now, so ours is dead and
        // nothing left the wallet. Only here are the drips owed again.
        await release();
        return { ok: false, reason: 'delivery-failed', delivered: 0 };
      }
      // Unknown. The rows keep their hash and stay `submitting`; reconcile will
      // either see it mined or re-broadcast the very same signature.
      return { ok: false, reason: 'delivery-uncertain', delivered: 0, txHash: prepared.txHash, deliveredTo };
    }

    await settle();
    return { ok: true, delivered: amount, txHash: prepared.txHash, deliveredTo };
  } finally {
    await unlock();
  }
}
