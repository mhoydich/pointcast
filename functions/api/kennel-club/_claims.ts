import { KENNEL_CLUB_CONTRACT, KENNEL_CLUB_PRICE_MUTEZ } from '../../../src/lib/kennel-club-mint';
import { KENNEL_CLUB } from '../../../src/lib/kennel-club';
import type { PointCastUser } from '../../../src/lib/auth/types';
import type { AuthEnv } from '../auth/session';

const CLAIM_RPC = 'https://mainnet.smartpy.io';
const MINIMUM_CLAIM_WALLET_BALANCE_MUTEZ = 3_000_000;
const FAILED_RETRY_DELAY_MS = 60_000;
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
  mint(tokenId: number, deliveredTo: string | null): Promise<{ opHash: string }>;
  deliver(tokenIds: number[], deliveredTo: string): Promise<{ opHash: string }>;
}

export type ClaimChainFactory = (secretKey: string) => Promise<ClaimChain>;

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
}>> {
  if (!db) return [];
  const result = await db.prepare(`
    SELECT id, user_id, token_id, status, op_hash, delivered_to, created_at
    FROM claims
    WHERE user_id = ?
    ORDER BY token_id ASC
  `).bind(userId).all<KennelClaimRow>();
  return result.results.map((row) => ({
    id: row.id,
    tokenId: Number(row.token_id),
    sitting: dogName(Number(row.token_id)),
    status: row.status,
    opHash: row.op_hash,
    deliveredTo: row.delivered_to,
    createdAt: row.created_at,
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
    const reservedAt = Date.parse(existing.created_at);
    if (Number.isFinite(reservedAt) && Date.now() - reservedAt < FAILED_RETRY_DELAY_MS) {
      return { row: existing, reason: 'claim-in-progress' };
    }
    const retriedAt = new Date().toISOString();
    const retried = await db.prepare(`
      UPDATE claims
      SET op_hash = NULL, delivered_to = NULL, created_at = ?
      WHERE id = ? AND status = 'failed' AND created_at = ?
      RETURNING id, user_id, token_id, status, op_hash, delivered_to, created_at
    `).bind(retriedAt, existing.id, existing.created_at).first<KennelClaimRow>();
    return retried ? { row: retried } : { row: existing, reason: 'claim-in-progress' };
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
  if (inserted) return { row: inserted };
  const raced = await existingClaim(db, userId, tokenId);
  return raced
    ? { row: raced, reason: 'already-claimed' }
    : { row: null, reason: 'daily-cap-reached' };
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
    async mint(tokenId, deliveredTo) {
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
      await operation.confirmation(1);
      return { opHash: operationHash(operation) };
    },
    async deliver(tokenIds, deliveredTo) {
      const contract = await tezos.contract.at(KENNEL_CLUB_CONTRACT);
      const operation = await tezos.contract.batch().withContractCall(
        contract.methodsObject.transfer([{
          from_: address,
          txs: tokenIds.map((tokenId) => ({ to_: deliveredTo, token_id: tokenId, amount: 1 })),
        }]),
      ).send();
      await operation.confirmation(1);
      return { opHash: operationHash(operation) };
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
  const reservation = await reserveClaim(env.AUTH_DB, user.userId, tokenId, cap);
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
  try {
    const { opHash } = await chain.mint(tokenId, deliveredTo);
    await markClaim(env.AUTH_DB, reservation.row.id, status, opHash, deliveredTo);
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
    await markClaim(env.AUTH_DB, reservation.row.id, 'failed', null, null);
    console.error(JSON.stringify({
      message: 'kennel-club-claim-failed',
      userId: user.userId,
      tokenId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return { ok: false, configured: true, reason: 'mint-failed' };
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
  const held = await env.AUTH_DB.prepare(`
    SELECT id, user_id, token_id, status, op_hash, delivered_to, created_at
    FROM claims
    WHERE user_id = ? AND status = 'held'
    ORDER BY token_id ASC
  `).bind(userId).all<KennelClaimRow>();
  if (!held.results.length) return { ok: true, configured: true, delivered: 0, tokenIds: [] };

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
  const tokenIds = held.results.map((claim) => Number(claim.token_id));
  try {
    const { opHash } = await chain.deliver(tokenIds, deliveredTo);
    const statements = held.results.map((claim) => env.AUTH_DB!.prepare(`
      UPDATE claims
      SET status = 'delivered', op_hash = ?, delivered_to = ?
      WHERE id = ? AND status = 'held'
    `).bind(opHash, deliveredTo, claim.id));
    await env.AUTH_DB.batch(statements);
    return { ok: true, configured: true, delivered: tokenIds.length, tokenIds, opHash };
  } catch (error) {
    console.error(JSON.stringify({
      message: 'kennel-club-delivery-failed',
      userId,
      deliveredTo,
      tokenIds,
      error: error instanceof Error ? error.message : String(error),
    }));
    return { ok: false, configured: true, reason: 'delivery-failed', delivered: 0, tokenIds: [] };
  }
}
