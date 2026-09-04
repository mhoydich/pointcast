import { KENNEL_CLUB_CONTRACT, KENNEL_CLUB_PRICE_MUTEZ } from '../../../src/lib/kennel-club-mint';
import { KENNEL_CLUB } from '../../../src/lib/kennel-club';
import type { PointCastUser } from '../../../src/lib/auth/types';
import type { AuthEnv } from '../auth/session';

const CLAIM_RPC = 'https://mainnet.smartpy.io';
const MINIMUM_CLAIM_WALLET_BALANCE_MUTEZ = 3_000_000;
const FAILED_RETRY_DELAY_MS = 60_000;
const SIGNER_LOCK_TTL_MS = 15 * 60_000;
const CLAIM_SIGNER_LOCK = 'kennel-claim-wallet';
const TZKT_API = 'https://api.tzkt.io/v1';
const TEZOS_ADDRESS = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
const OPERATION_HASH = /^o[1-9A-HJ-NP-Za-km-z]{50}$/;

export type KennelClaimStatus = 'held' | 'delivered' | 'failed';

export interface KennelClaimEnv extends AuthEnv {
  PC_RATES_KV?: KVNamespace;
  KENNEL_CLUB_CLAIM_SECRET_KEY?: string;
  KENNEL_CLUB_CLAIM_DAILY_CAP?: string;
}

export interface KennelClaimRow {
  id: string;
  user_id: string;
  token_id: number;
  status: KennelClaimStatus;
  op_hash: string | null;
  delivered_to: string | null;
  created_at: string;
  seal_status?: 'pending_wallet' | 'pending' | 'submitting' | 'submitted' | 'attested' | 'failed' | null;
  seal_op_hash?: string | null;
}

interface CountRow {
  cap_used: number;
  claimed: number;
  held: number;
  delivered: number;
  failed: number;
}

interface RecentClaimRow extends KennelClaimRow {
  preferred_name: string | null;
}

export interface PublicKennelClaims {
  configured: boolean;
  cap: number;
  capUsed: number;
  remaining: number;
  claimed: number;
  held: number;
  delivered: number;
  failed: number;
  recent: Array<{
    tokenId: number;
    sitting: string;
    firstName: string;
    status: 'held' | 'delivered';
    createdAt: string;
  }>;
}

export interface ClaimChain {
  address: string;
  balanceMutez(): Promise<number>;
  ensureRevealed(): Promise<void>;
  operationStatus(opHash: string): Promise<ChainOperationStatus>;
  mint(
    tokenId: number,
    deliveredTo: string | null,
    onInjected: (opHash: string) => Promise<void>,
  ): Promise<{ opHash: string }>;
  deliver(
    tokenIds: number[],
    deliveredTo: string,
    onInjected: (opHash: string) => Promise<void>,
  ): Promise<{ opHash: string }>;
}

export type ClaimChainFactory = (secretKey: string) => Promise<ClaimChain>;
export type ChainOperationStatus = 'applied' | 'pending' | 'failed' | 'unknown';

type ClaimJobRow = {
  claim_id: string;
  state: 'reserved' | 'submitting' | 'submitted' | 'confirmed' | 'failed';
  target_status: 'held' | 'delivered';
  delivered_to: string | null;
  operation_id: string | null;
  error: string | null;
  updated_at: string;
  op_hash?: string | null;
};

type DeliveryReservationRow = {
  claim_id: string;
  reservation_id: string;
  user_id: string;
  token_id: number;
  delivered_to: string;
  state: 'reserved' | 'submitting' | 'submitted' | 'confirmed' | 'failed';
  operation_id: string | null;
  op_hash: string | null;
  created_at: string;
  updated_at: string;
};

export function claimDailyCap(value: string | undefined): number {
  const parsed = Number(value ?? 50);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 500) : 50;
}

export function claimConfigured(env: Pick<KennelClaimEnv, 'KENNEL_CLUB_CLAIM_SECRET_KEY'>): boolean {
  return Boolean(env.KENNEL_CLUB_CLAIM_SECRET_KEY?.trim());
}

export function linkedTezosAddress(user: PointCastUser): string | null {
  for (const identity of [...user.identities].reverse()) {
    const provider = String(identity.provider);
    const isTezosProvider = provider === 'kukai'
      || provider === 'temple'
      || provider === 'umami'
      || provider === 'metamask-tezos'
      || (provider === 'metamask' && identity.id.startsWith('tz'));
    if (isTezosProvider && TEZOS_ADDRESS.test(identity.id)) return identity.id;
  }
  return null;
}

function dogName(tokenId: number): string {
  return KENNEL_CLUB.sittings[tokenId]?.name ?? `Sitting ${String(tokenId + 1).padStart(2, '0')}`;
}

function firstName(value: string | null): string {
  const candidate = value?.trim().split(/\s+/)[0] ?? '';
  if (!candidate || candidate.includes('@') || candidate.startsWith('tz')) return 'Member';
  const cleaned = candidate.replace(/[^\p{L}\p{M}'’-]/gu, '').slice(0, 30);
  return cleaned || 'Member';
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function emptyPublicKennelClaims(
  cap = 50,
  configured = false,
): PublicKennelClaims {
  return {
    configured,
    cap,
    capUsed: 0,
    remaining: cap,
    claimed: 0,
    held: 0,
    delivered: 0,
    failed: 0,
    recent: [],
  };
}

export async function getPublicKennelClaims(
  db: D1Database | undefined,
  tokenId: number,
  options: { cap?: number; configured?: boolean } = {},
): Promise<PublicKennelClaims> {
  const cap = options.cap ?? 50;
  const configured = options.configured ?? false;
  if (!db) return emptyPublicKennelClaims(cap, configured);

  const [counts, recent] = await Promise.all([
    db.prepare(`
      SELECT
        COUNT(*) AS cap_used,
        SUM(CASE WHEN status != 'failed' THEN 1 ELSE 0 END) AS claimed,
        SUM(CASE WHEN status = 'held' THEN 1 ELSE 0 END) AS held,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
      FROM claims
      WHERE token_id = ?
    `).bind(tokenId).first<CountRow>(),
    db.prepare(`
      SELECT c.id, c.user_id, c.token_id, c.status, c.op_hash,
             c.delivered_to, c.created_at,
             json_extract(u.payload, '$.preferredName') AS preferred_name
      FROM claims c
      JOIN users u ON u.id = c.user_id
      WHERE c.status IN ('held', 'delivered')
      ORDER BY c.created_at DESC
      LIMIT 10
    `).all<RecentClaimRow>(),
  ]);
  const capUsed = numberValue(counts?.cap_used);
  const rows = Array.isArray(recent.results) ? recent.results : [];
  return {
    configured,
    cap,
    capUsed,
    remaining: Math.max(0, cap - capUsed),
    claimed: numberValue(counts?.claimed),
    held: numberValue(counts?.held),
    delivered: numberValue(counts?.delivered),
    failed: numberValue(counts?.failed),
    recent: rows.map((row) => ({
      tokenId: Number(row.token_id),
      sitting: dogName(Number(row.token_id)),
      firstName: firstName(row.preferred_name),
      status: row.status === 'delivered' ? 'delivered' : 'held',
      createdAt: row.created_at,
    })),
  };
}

export async function getUserKennelClaims(
  db: D1Database | undefined,
  userId: string,
): Promise<Array<{
  id: string;
  tokenId: number;
  sitting: string;
  status: KennelClaimStatus;
  opHash: string | null;
  deliveredTo: string | null;
  createdAt: string;
  seal: {
    kind: 'showed-up';
    status: 'pending_wallet' | 'pending' | 'submitting' | 'submitted' | 'attested' | 'failed' | null;
    opHash: string | null;
  };
}>> {
  if (!db) return [];
  const result = await db.prepare(`
    SELECT c.id, c.user_id, c.token_id, c.status, c.op_hash, c.delivered_to, c.created_at,
           r.status AS seal_status, r.op_hash AS seal_op_hash
    FROM claims c
    LEFT JOIN seal_receipts r ON r.claim_id = c.id AND r.kind = 'showed-up'
    WHERE c.user_id = ?
    ORDER BY c.token_id ASC
  `).bind(userId).all<KennelClaimRow>();
  return result.results.map((row) => ({
    id: row.id,
    tokenId: Number(row.token_id),
    sitting: dogName(Number(row.token_id)),
    status: row.status,
    opHash: row.op_hash,
    deliveredTo: row.delivered_to,
    createdAt: row.created_at,
    seal: {
      kind: 'showed-up',
      status: row.seal_status ?? null,
      opHash: row.seal_op_hash ?? null,
    },
  }));
}

async function existingClaim(
  db: D1Database,
  userId: string,
  tokenId: number,
): Promise<KennelClaimRow | null> {
  return db.prepare(`
    SELECT id, user_id, token_id, status, op_hash, delivered_to, created_at
    FROM claims
    WHERE user_id = ? AND token_id = ?
  `).bind(userId, tokenId).first<KennelClaimRow>();
}

async function reserveClaim(
  db: D1Database,
  userId: string,
  tokenId: number,
  cap: number,
): Promise<{ row: KennelClaimRow | null; reason?: 'already-claimed' | 'claim-in-progress' | 'daily-cap-reached' }> {
  const existing = await existingClaim(db, userId, tokenId);
  if (existing && existing.status !== 'failed') return { row: existing, reason: 'already-claimed' };
  if (existing) {
    const job = await readClaimJob(db, existing.id);
    if (job?.state === 'submitted' || job?.state === 'submitting') {
      return { row: existing };
    }
    const reservedAt = Date.parse(job?.updated_at ?? existing.created_at);
    if (job?.state === 'reserved' && Number.isFinite(reservedAt) && Date.now() - reservedAt < FAILED_RETRY_DELAY_MS) {
      return { row: existing, reason: 'claim-in-progress' };
    }
    await writeClaimJob(db, existing.id, deliveredTarget(existing.delivered_to), existing.delivered_to, 'reserved');
    return { row: existing };
  }

  const id = `kcc_${crypto.randomUUID().replaceAll('-', '')}`;
  const createdAt = new Date().toISOString();
  const inserted = await db.prepare(`
    INSERT INTO claims (id, user_id, token_id, status, op_hash, delivered_to, created_at)
    SELECT ?, ?, ?, 'failed', NULL, NULL, ?
    WHERE (SELECT COUNT(*) FROM claims WHERE token_id = ?) < ?
      AND NOT EXISTS (
        SELECT 1 FROM claims WHERE user_id = ? AND token_id = ?
      )
    RETURNING id, user_id, token_id, status, op_hash, delivered_to, created_at
  `).bind(id, userId, tokenId, createdAt, tokenId, cap, userId, tokenId).first<KennelClaimRow>();
  if (inserted) {
    await writeClaimJob(db, inserted.id, 'held', null, 'reserved');
    return { row: inserted };
  }
  const raced = await existingClaim(db, userId, tokenId);
  return raced
    ? { row: raced, reason: 'already-claimed' }
    : { row: null, reason: 'daily-cap-reached' };
}

export async function reserveKennelClubClaimCapacity(options: {
  db: D1Database;
  userId: string;
  tokenId: number;
  cap: number;
}): Promise<{ ok: true; claimId: string } | { ok: false; reason: string }> {
  const reservation = await reserveClaim(options.db, options.userId, options.tokenId, options.cap);
  if (!reservation.row || reservation.reason) {
    return { ok: false, reason: reservation.reason ?? 'claim-unavailable' };
  }
  return { ok: true, claimId: reservation.row.id };
}

export async function releaseKennelClubClaimCapacity(
  db: D1Database,
  claimId: string,
): Promise<boolean> {
  const released = await db.prepare(`
    DELETE FROM claims
    WHERE id = ? AND status = 'failed'
      AND EXISTS (
        SELECT 1 FROM kennel_claim_jobs
        WHERE claim_id = claims.id AND state = 'reserved' AND operation_id IS NULL
      )
    RETURNING id
  `).bind(claimId).first<{ id: string }>();
  return released?.id === claimId;
}

function deliveredTarget(address: string | null): 'held' | 'delivered' {
  return address ? 'delivered' : 'held';
}

async function readClaimJob(db: D1Database, claimId: string): Promise<ClaimJobRow | null> {
  return db.prepare(`
    SELECT j.claim_id, j.state, j.target_status, j.delivered_to, j.operation_id,
           j.error, j.updated_at, o.op_hash
    FROM kennel_claim_jobs j
    LEFT JOIN kennel_chain_operations o ON o.id = j.operation_id
    WHERE j.claim_id = ?
  `).bind(claimId).first<ClaimJobRow>();
}

async function writeClaimJob(
  db: D1Database,
  claimId: string,
  targetStatus: 'held' | 'delivered',
  deliveredTo: string | null,
  state: ClaimJobRow['state'],
  error: string | null = null,
): Promise<void> {
  await db.prepare(`
    INSERT INTO kennel_claim_jobs
      (claim_id, state, target_status, delivered_to, operation_id, error, updated_at)
    VALUES (?, ?, ?, ?, NULL, ?, ?)
    ON CONFLICT(claim_id) DO UPDATE SET
      state = excluded.state,
      target_status = excluded.target_status,
      delivered_to = excluded.delivered_to,
      error = excluded.error,
      updated_at = excluded.updated_at
  `).bind(claimId, state, targetStatus, deliveredTo, error, new Date().toISOString()).run();
}

async function acquireSignerLock(db: D1Database, lockName: string, holder: string): Promise<boolean> {
  const now = Date.now();
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
  `).bind(lockName, holder, now + SIGNER_LOCK_TTL_MS, now).first<{ holder: string }>();
  return row?.holder === holder;
}

async function releaseSignerLock(db: D1Database, lockName: string, holder: string): Promise<void> {
  await db.prepare(`
    UPDATE kennel_signer_locks SET holder = NULL, expires_at = NULL
    WHERE lock_name = ? AND holder = ?
  `).bind(lockName, holder).run();
}

async function persistOperation(
  db: D1Database,
  input: { id: string; action: 'mint' | 'deliver'; subjectId: string; opHash: string },
): Promise<void> {
  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO kennel_chain_operations
      (id, action, subject_id, op_hash, status, error, submitted_at, updated_at)
    VALUES (?, ?, ?, ?, 'submitted', NULL, ?, ?)
    ON CONFLICT(op_hash) DO UPDATE SET updated_at = excluded.updated_at
  `).bind(input.id, input.action, input.subjectId, input.opHash, now, now).run();
}

async function markOperation(
  db: D1Database,
  operationId: string,
  status: 'applied' | 'failed' | 'unknown',
  error: string | null = null,
): Promise<void> {
  await db.prepare(`
    UPDATE kennel_chain_operations SET status = ?, error = ?, updated_at = ? WHERE id = ?
  `).bind(status, error, new Date().toISOString(), operationId).run();
}

async function readTzktOperationStatus(opHash: string): Promise<ChainOperationStatus> {
  try {
    const response = await fetch(`${TZKT_API}/operations/${encodeURIComponent(opHash)}`, {
      headers: { Accept: 'application/json' },
    });
    if (response.status === 404 || response.status === 204) return 'pending';
    if (!response.ok) return 'unknown';
    const payload: unknown = await response.json();
    const operations = Array.isArray(payload) ? payload : [payload];
    const statuses = operations.flatMap((entry) => (
      entry && typeof entry === 'object' && typeof (entry as { status?: unknown }).status === 'string'
        ? [(entry as { status: string }).status]
        : []
    ));
    if (!statuses.length) return 'unknown';
    if (statuses.every((status) => status === 'applied')) return 'applied';
    if (statuses.some((status) => ['failed', 'backtracked', 'skipped'].includes(status))) return 'failed';
    return 'pending';
  } catch {
    return 'unknown';
  }
}

async function markClaim(
  db: D1Database,
  id: string,
  status: KennelClaimStatus,
  opHash: string | null,
  deliveredTo: string | null,
): Promise<void> {
  await db.prepare(`
    UPDATE claims
    SET status = ?, op_hash = ?, delivered_to = ?
    WHERE id = ?
  `).bind(status, opHash, deliveredTo, id).run();
}

function operationHash(operation: { hash?: string; opHash?: string }): string {
  const hash = operation.hash ?? operation.opHash ?? '';
  if (!OPERATION_HASH.test(hash)) throw new Error('invalid-operation-hash');
  return hash;
}

export async function createTaquitoClaimChain(secretKey: string): Promise<ClaimChain> {
  const [{ InMemorySigner }, { TezosToolkit }] = await Promise.all([
    import('@taquito/signer'),
    import('@taquito/taquito'),
  ]);
  const signer = await InMemorySigner.fromSecretKey(secretKey);
  const address = await signer.publicKeyHash();
  const tezos = new TezosToolkit(CLAIM_RPC);
  tezos.setProvider({ signer });

  return {
    address,
    async balanceMutez() {
      return (await tezos.tz.getBalance(address)).toNumber();
    },
    async ensureRevealed() {
      if (await tezos.rpc.getManagerKey(address)) return;
      const reveal = await tezos.contract.reveal({ fee: 4_000 });
      await reveal.confirmation(1);
    },
    operationStatus: readTzktOperationStatus,
    async mint(tokenId, deliveredTo, onInjected) {
      const contract = await tezos.contract.at(KENNEL_CLUB_CONTRACT);
      const batch = tezos.contract.batch().withContractCall(
        contract.methodsObject.mint(tokenId),
        { amount: KENNEL_CLUB_PRICE_MUTEZ, mutez: true },
      );
      if (deliveredTo) {
        batch.withContractCall(contract.methodsObject.transfer([{
          from_: address,
          txs: [{ to_: deliveredTo, token_id: tokenId, amount: 1 }],
        }]));
      }
      const operation = await batch.send();
      const opHash = operationHash(operation);
      await onInjected(opHash);
      await operation.confirmation(1);
      return { opHash };
    },
    async deliver(tokenIds, deliveredTo, onInjected) {
      const contract = await tezos.contract.at(KENNEL_CLUB_CONTRACT);
      const operation = await tezos.contract.batch().withContractCall(
        contract.methodsObject.transfer([{
          from_: address,
          txs: tokenIds.map((tokenId) => ({ to_: deliveredTo, token_id: tokenId, amount: 1 })),
        }]),
      ).send();
      const opHash = operationHash(operation);
      await onInjected(opHash);
      await operation.confirmation(1);
      return { opHash };
    },
  };
}

async function readyChain(
  env: KennelClaimEnv,
  chainFactory: ClaimChainFactory,
): Promise<ClaimChain> {
  const secretKey = env.KENNEL_CLUB_CLAIM_SECRET_KEY?.trim();
  if (!secretKey) throw new Error('claim-wallet-not-configured');
  const chain = await chainFactory(secretKey);
  const balance = await chain.balanceMutez();
  if (!Number.isFinite(balance) || balance < MINIMUM_CLAIM_WALLET_BALANCE_MUTEZ) {
    throw new Error('claim-wallet-low-balance');
  }
  await chain.ensureRevealed();
  return chain;
}

export async function claimKennelClubDog(options: {
  env: KennelClaimEnv;
  user: PointCastUser;
  tokenId: number;
  chainFactory?: ClaimChainFactory;
  reservedClaimId?: string;
}): Promise<{
  ok: boolean;
  configured: boolean;
  reason?: string;
  claim?: {
    id: string;
    tokenId: number;
    sitting: string;
    status: 'held' | 'delivered';
    opHash: string;
    deliveredTo: string | null;
  };
}> {
  const { env, user, tokenId } = options;
  if (!env.AUTH_DB) return { ok: false, configured: claimConfigured(env), reason: 'claim-database-not-bound' };
  if (!claimConfigured(env)) return { ok: false, configured: false, reason: 'claim-wallet-not-configured' };
  const cap = claimDailyCap(env.KENNEL_CLUB_CLAIM_DAILY_CAP);
  const preReserved = options.reservedClaimId
    ? await existingClaim(env.AUTH_DB, user.userId, tokenId)
    : null;
  if (options.reservedClaimId && (!preReserved || preReserved.id !== options.reservedClaimId)) {
    return { ok: false, configured: true, reason: 'claim-reservation-invalid' };
  }
  if (preReserved && (preReserved.status === 'held' || preReserved.status === 'delivered')) {
    return {
      ok: true,
      configured: true,
      claim: {
        id: preReserved.id,
        tokenId,
        sitting: dogName(tokenId),
        status: preReserved.status,
        opHash: preReserved.op_hash ?? '',
        deliveredTo: preReserved.delivered_to,
      },
    };
  }
  const reservation = preReserved
    ? { row: preReserved }
    : await reserveClaim(env.AUTH_DB, user.userId, tokenId, cap);
  if (!reservation.row) return { ok: false, configured: true, reason: reservation.reason ?? 'claim-unavailable' };
  if (reservation.reason) {
    return { ok: false, configured: true, reason: reservation.reason };
  }

  let chain: ClaimChain;
  try {
    chain = await readyChain(env, options.chainFactory ?? createTaquitoClaimChain);
  } catch (error) {
    return {
      ok: false,
      configured: true,
      reason: error instanceof Error ? error.message : 'claim-wallet-unavailable',
    };
  }

  const deliveredTo = linkedTezosAddress(user);
  const status = deliveredTo ? 'delivered' : 'held';
  const currentJob = await readClaimJob(env.AUTH_DB, reservation.row.id);
  if (currentJob?.state === 'submitted' && currentJob.op_hash && currentJob.operation_id) {
    const reconciled = await chain.operationStatus(currentJob.op_hash);
    if (reconciled === 'applied') {
      await env.AUTH_DB.batch([
        env.AUTH_DB.prepare(`UPDATE claims SET status = ?, op_hash = ?, delivered_to = ? WHERE id = ?`)
          .bind(currentJob.target_status, currentJob.op_hash, currentJob.delivered_to, reservation.row.id),
        env.AUTH_DB.prepare(`UPDATE kennel_claim_jobs SET state = 'confirmed', error = NULL, updated_at = ? WHERE claim_id = ?`)
          .bind(new Date().toISOString(), reservation.row.id),
        env.AUTH_DB.prepare(`UPDATE kennel_chain_operations SET status = 'applied', error = NULL, updated_at = ? WHERE id = ?`)
          .bind(new Date().toISOString(), currentJob.operation_id),
      ]);
      return {
        ok: true,
        configured: true,
        claim: {
          id: reservation.row.id,
          tokenId,
          sitting: dogName(tokenId),
          status: currentJob.target_status,
          opHash: currentJob.op_hash,
          deliveredTo: currentJob.delivered_to,
        },
      };
    }
    if (reconciled !== 'failed') {
      if (reconciled === 'unknown') await markOperation(env.AUTH_DB, currentJob.operation_id, 'unknown', 'reconciliation-unavailable');
      return { ok: false, configured: true, reason: 'claim-in-progress' };
    }
    await markOperation(env.AUTH_DB, currentJob.operation_id, 'failed', 'chain-operation-failed');
    await writeClaimJob(env.AUTH_DB, reservation.row.id, status, deliveredTo, 'reserved');
  } else if (currentJob?.state === 'submitting') {
    return { ok: false, configured: true, reason: 'claim-in-progress' };
  }

  const lockHolder = `claim:${reservation.row.id}:${crypto.randomUUID()}`;
  if (!await acquireSignerLock(env.AUTH_DB, CLAIM_SIGNER_LOCK, lockHolder)) {
    return { ok: false, configured: true, reason: 'claim-in-progress' };
  }
  const operationId = `kop_${crypto.randomUUID().replaceAll('-', '')}`;
  let injectedHash: string | null = null;
  try {
    await env.AUTH_DB.prepare(`
      UPDATE kennel_claim_jobs
      SET state = 'submitting', target_status = ?, delivered_to = ?, error = NULL, updated_at = ?
      WHERE claim_id = ? AND state IN ('reserved', 'failed')
    `).bind(status, deliveredTo, new Date().toISOString(), reservation.row.id).run();
    const onInjected = async (opHash: string) => {
      injectedHash = opHash;
      await persistOperation(env.AUTH_DB!, {
        id: operationId,
        action: 'mint',
        subjectId: reservation.row!.id,
        opHash,
      });
      await env.AUTH_DB!.batch([
        env.AUTH_DB!.prepare(`
          UPDATE kennel_claim_jobs
          SET state = 'submitted', operation_id = ?, error = NULL, updated_at = ?
          WHERE claim_id = ? AND state = 'submitting'
        `).bind(operationId, new Date().toISOString(), reservation.row!.id),
        env.AUTH_DB!.prepare(`UPDATE claims SET op_hash = ?, delivered_to = ? WHERE id = ?`)
          .bind(opHash, deliveredTo, reservation.row!.id),
      ]);
    };
    const { opHash } = await chain.mint(tokenId, deliveredTo, onInjected);
    if (!injectedHash) await onInjected(opHash);
    await env.AUTH_DB.batch([
      env.AUTH_DB.prepare(`UPDATE claims SET status = ?, op_hash = ?, delivered_to = ? WHERE id = ?`)
        .bind(status, opHash, deliveredTo, reservation.row.id),
      env.AUTH_DB.prepare(`UPDATE kennel_claim_jobs SET state = 'confirmed', error = NULL, updated_at = ? WHERE claim_id = ?`)
        .bind(new Date().toISOString(), reservation.row.id),
      env.AUTH_DB.prepare(`UPDATE kennel_chain_operations SET status = 'applied', error = NULL, updated_at = ? WHERE id = ?`)
        .bind(new Date().toISOString(), operationId),
    ]);
    return {
      ok: true,
      configured: true,
      claim: {
        id: reservation.row.id,
        tokenId,
        sitting: dogName(tokenId),
        status,
        opHash,
        deliveredTo,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (injectedHash) {
      try {
        await persistOperation(env.AUTH_DB, {
          id: operationId,
          action: 'mint',
          subjectId: reservation.row.id,
          opHash: injectedHash,
        });
        await env.AUTH_DB.batch([
          env.AUTH_DB.prepare(`
            UPDATE kennel_claim_jobs
            SET state = 'submitted', operation_id = ?, error = ?, updated_at = ? WHERE claim_id = ?
          `).bind(operationId, message.slice(0, 240), new Date().toISOString(), reservation.row.id),
          env.AUTH_DB.prepare(`UPDATE claims SET op_hash = ?, delivered_to = ? WHERE id = ?`)
            .bind(injectedHash, deliveredTo, reservation.row.id),
        ]);
        await markOperation(env.AUTH_DB, operationId, 'unknown', message.slice(0, 240));
      } catch (persistError) {
        console.error(JSON.stringify({
          message: 'kennel-club-injected-operation-unrecorded',
          claimId: reservation.row.id,
          opHash: injectedHash,
          error: persistError instanceof Error ? persistError.message : String(persistError),
        }));
      }
    } else {
      await writeClaimJob(env.AUTH_DB, reservation.row.id, status, deliveredTo, 'failed', message.slice(0, 240));
      await markClaim(env.AUTH_DB, reservation.row.id, 'failed', reservation.row.op_hash, reservation.row.delivered_to);
    }
    console.error(JSON.stringify({
      message: 'kennel-club-claim-failed',
      userId: user.userId,
      tokenId,
      opHash: injectedHash,
      error: message,
    }));
    return { ok: false, configured: true, reason: injectedHash ? 'claim-confirmation-pending' : 'mint-failed' };
  } finally {
    await releaseSignerLock(env.AUTH_DB, CLAIM_SIGNER_LOCK, lockHolder).catch(() => undefined);
  }
}

export async function deliverHeldKennelClubDogs(options: {
  env: KennelClaimEnv;
  userId: string;
  deliveredTo: string;
  chainFactory?: ClaimChainFactory;
}): Promise<{
  ok: boolean;
  configured: boolean;
  reason?: string;
  delivered: number;
  tokenIds: number[];
  opHash?: string;
}> {
  const { env, userId, deliveredTo } = options;
  if (!env.AUTH_DB) return { ok: false, configured: claimConfigured(env), reason: 'claim-database-not-bound', delivered: 0, tokenIds: [] };
  if (!claimConfigured(env)) return { ok: false, configured: false, reason: 'claim-wallet-not-configured', delivered: 0, tokenIds: [] };
  if (!TEZOS_ADDRESS.test(deliveredTo)) return { ok: false, configured: true, reason: 'tezos-wallet-required', delivered: 0, tokenIds: [] };

  let chain: ClaimChain;
  try {
    chain = await readyChain(env, options.chainFactory ?? createTaquitoClaimChain);
  } catch (error) {
    return {
      ok: false,
      configured: true,
      reason: error instanceof Error ? error.message : 'claim-wallet-unavailable',
      delivered: 0,
      tokenIds: [],
    };
  }

  const outstanding = await env.AUTH_DB.prepare(`
    SELECT r.claim_id, r.reservation_id, r.user_id, c.token_id, r.delivered_to,
           r.state, r.operation_id, o.op_hash, r.created_at, r.updated_at
    FROM kennel_delivery_reservations r
    JOIN claims c ON c.id = r.claim_id
    LEFT JOIN kennel_chain_operations o ON o.id = r.operation_id
    WHERE r.user_id = ? AND r.state IN ('submitting', 'submitted')
    ORDER BY r.created_at, c.token_id
  `).bind(userId).all<DeliveryReservationRow>();
  const groups = new Map<string, DeliveryReservationRow[]>();
  for (const row of outstanding.results ?? []) {
    const rows = groups.get(row.reservation_id) ?? [];
    rows.push(row);
    groups.set(row.reservation_id, rows);
  }
  for (const rows of groups.values()) {
    const opHash = rows[0]?.op_hash;
    const operationId = rows[0]?.operation_id;
    if (!opHash || !operationId) {
      return { ok: false, configured: true, reason: 'delivery-in-progress', delivered: 0, tokenIds: [] };
    }
    const status = await chain.operationStatus(opHash);
    if (status === 'applied') {
      const now = new Date().toISOString();
      await env.AUTH_DB.batch([
        ...rows.map((row) => env.AUTH_DB!.prepare(`
          UPDATE claims SET status = 'delivered', op_hash = ?, delivered_to = ? WHERE id = ? AND status = 'held'
        `).bind(opHash, row.delivered_to, row.claim_id)),
        ...rows.map((row) => env.AUTH_DB!.prepare(`
          UPDATE kennel_delivery_reservations SET state = 'confirmed', error = NULL, updated_at = ? WHERE claim_id = ?
        `).bind(now, row.claim_id)),
        env.AUTH_DB.prepare(`UPDATE kennel_chain_operations SET status = 'applied', error = NULL, updated_at = ? WHERE id = ?`)
          .bind(now, operationId),
      ]);
      return {
        ok: true,
        configured: true,
        delivered: rows.length,
        tokenIds: rows.map((row) => Number(row.token_id)),
        opHash,
      };
    }
    if (status !== 'failed') {
      if (status === 'unknown') await markOperation(env.AUTH_DB, operationId, 'unknown', 'reconciliation-unavailable');
      return { ok: false, configured: true, reason: 'delivery-in-progress', delivered: 0, tokenIds: [] };
    }
    const now = new Date().toISOString();
    await env.AUTH_DB.batch([
      ...rows.map((row) => env.AUTH_DB!.prepare(`
        UPDATE kennel_delivery_reservations SET state = 'failed', error = 'chain-operation-failed', updated_at = ? WHERE claim_id = ?
      `).bind(now, row.claim_id)),
      env.AUTH_DB.prepare(`UPDATE kennel_chain_operations SET status = 'failed', error = 'chain-operation-failed', updated_at = ? WHERE id = ?`)
        .bind(now, operationId),
    ]);
  }

  const held = await env.AUTH_DB.prepare(`
    SELECT id, user_id, token_id, status, op_hash, delivered_to, created_at
    FROM claims WHERE user_id = ? AND status = 'held' ORDER BY token_id ASC
  `).bind(userId).all<KennelClaimRow>();
  if (!held.results.length) return { ok: true, configured: true, delivered: 0, tokenIds: [] };

  const reservationId = `kdr_${crypto.randomUUID().replaceAll('-', '')}`;
  const reservedAt = new Date().toISOString();
  await env.AUTH_DB.batch(held.results.map((claim) => env.AUTH_DB!.prepare(`
    INSERT INTO kennel_delivery_reservations
      (claim_id, reservation_id, user_id, delivered_to, state, operation_id, error, created_at, updated_at)
    SELECT ?, ?, ?, ?, 'reserved', NULL, NULL, ?, ?
    FROM claims WHERE id = ? AND user_id = ? AND status = 'held'
    ON CONFLICT(claim_id) DO UPDATE SET
      reservation_id = excluded.reservation_id,
      delivered_to = excluded.delivered_to,
      state = 'reserved',
      operation_id = NULL,
      error = NULL,
      updated_at = excluded.updated_at
    WHERE kennel_delivery_reservations.state = 'failed'
  `).bind(
    claim.id, reservationId, userId, deliveredTo, reservedAt, reservedAt,
    claim.id, userId,
  )));
  const reserved = await env.AUTH_DB.prepare(`
    SELECT r.claim_id, r.reservation_id, r.user_id, c.token_id, r.delivered_to,
           r.state, r.operation_id, NULL AS op_hash, r.created_at, r.updated_at
    FROM kennel_delivery_reservations r
    JOIN claims c ON c.id = r.claim_id
    WHERE r.reservation_id = ? AND r.state = 'reserved'
    ORDER BY c.token_id
  `).bind(reservationId).all<DeliveryReservationRow>();
  if (!reserved.results.length) {
    return { ok: false, configured: true, reason: 'delivery-in-progress', delivered: 0, tokenIds: [] };
  }
  const tokenIds = reserved.results.map((claim) => Number(claim.token_id));
  const lockHolder = `delivery:${reservationId}`;
  if (!await acquireSignerLock(env.AUTH_DB, CLAIM_SIGNER_LOCK, lockHolder)) {
    return { ok: false, configured: true, reason: 'delivery-in-progress', delivered: 0, tokenIds: [] };
  }
  const operationId = `kop_${crypto.randomUUID().replaceAll('-', '')}`;
  let injectedHash: string | null = null;
  try {
    await env.AUTH_DB.prepare(`
      UPDATE kennel_delivery_reservations SET state = 'submitting', updated_at = ?
      WHERE reservation_id = ? AND state = 'reserved'
    `).bind(new Date().toISOString(), reservationId).run();
    const onInjected = async (opHash: string) => {
      injectedHash = opHash;
      await persistOperation(env.AUTH_DB!, { id: operationId, action: 'deliver', subjectId: reservationId, opHash });
      const now = new Date().toISOString();
      await env.AUTH_DB!.batch([
        ...reserved.results.map((row) => env.AUTH_DB!.prepare(`
          UPDATE kennel_delivery_reservations
          SET state = 'submitted', operation_id = ?, error = NULL, updated_at = ?
          WHERE claim_id = ? AND reservation_id = ? AND state = 'submitting'
        `).bind(operationId, now, row.claim_id, reservationId)),
        ...reserved.results.map((row) => env.AUTH_DB!.prepare(`UPDATE claims SET op_hash = ?, delivered_to = ? WHERE id = ?`)
          .bind(opHash, deliveredTo, row.claim_id)),
      ]);
    };
    const { opHash } = await chain.deliver(tokenIds, deliveredTo, onInjected);
    if (!injectedHash) await onInjected(opHash);
    const now = new Date().toISOString();
    await env.AUTH_DB.batch([
      ...reserved.results.map((row) => env.AUTH_DB!.prepare(`
        UPDATE claims SET status = 'delivered', op_hash = ?, delivered_to = ?
        WHERE id = ? AND status = 'held'
      `).bind(opHash, deliveredTo, row.claim_id)),
      ...reserved.results.map((row) => env.AUTH_DB!.prepare(`
        UPDATE kennel_delivery_reservations SET state = 'confirmed', error = NULL, updated_at = ? WHERE claim_id = ?
      `).bind(now, row.claim_id)),
      env.AUTH_DB.prepare(`UPDATE kennel_chain_operations SET status = 'applied', error = NULL, updated_at = ? WHERE id = ?`)
        .bind(now, operationId),
    ]);
    return { ok: true, configured: true, delivered: tokenIds.length, tokenIds, opHash };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (injectedHash) {
      try {
        await persistOperation(env.AUTH_DB, { id: operationId, action: 'deliver', subjectId: reservationId, opHash: injectedHash });
        const now = new Date().toISOString();
        await env.AUTH_DB.batch([
          ...reserved.results.map((row) => env.AUTH_DB!.prepare(`
            UPDATE kennel_delivery_reservations
            SET state = 'submitted', operation_id = ?, error = ?, updated_at = ? WHERE claim_id = ?
          `).bind(operationId, message.slice(0, 240), now, row.claim_id)),
          ...reserved.results.map((row) => env.AUTH_DB!.prepare(`UPDATE claims SET op_hash = ?, delivered_to = ? WHERE id = ?`)
            .bind(injectedHash, deliveredTo, row.claim_id)),
        ]);
        await markOperation(env.AUTH_DB, operationId, 'unknown', message.slice(0, 240));
      } catch (persistError) {
        console.error(JSON.stringify({
          message: 'kennel-club-injected-delivery-unrecorded',
          reservationId,
          opHash: injectedHash,
          error: persistError instanceof Error ? persistError.message : String(persistError),
        }));
      }
    } else {
      await env.AUTH_DB.prepare(`
        UPDATE kennel_delivery_reservations SET state = 'failed', error = ?, updated_at = ?
        WHERE reservation_id = ? AND state = 'submitting'
      `).bind(message.slice(0, 240), new Date().toISOString(), reservationId).run();
    }
    console.error(JSON.stringify({
      message: 'kennel-club-delivery-failed',
      userId,
      deliveredTo,
      tokenIds,
      opHash: injectedHash,
      error: message,
    }));
    return {
      ok: false,
      configured: true,
      reason: injectedHash ? 'delivery-in-progress' : 'delivery-failed',
      delivered: 0,
      tokenIds: [],
      ...(injectedHash ? { opHash: injectedHash } : {}),
    };
  } finally {
    await releaseSignerLock(env.AUTH_DB, CLAIM_SIGNER_LOCK, lockHolder).catch(() => undefined);
  }
}
