import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';

import contracts from '../../../src/data/contracts.json';
import KENNEL_CLUB from '../../../src/data/kennel-club-september-sitting.json';

const SHOWED_UP_KIND = 'showed-up';
const OPERATION_HASH = /^o[1-9A-HJ-NP-Za-km-z]{50}$/;
const TEZOS_ADDRESS = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;

type SealEnv = Env & { SEAL_ISSUER_SECRET_KEY?: string };
type ReceiptStatus = 'pending_wallet' | 'pending' | 'submitting' | 'submitted' | 'attested' | 'failed';

type ClaimReceiptRow = {
  claim_id: string;
  user_id: string;
  token_id: number;
  claim_status: 'held' | 'delivered';
  identity_provider: string | null;
  identity_id: string | null;
  receipt_id: string | null;
  receipt_status: ReceiptStatus | null;
  receipt_holder: string | null;
  receipt_op_hash: string | null;
};

type CollapsedClaim = {
  claimId: string;
  userId: string;
  tokenId: number;
  holder: string | null;
  receiptId: string | null;
  receiptStatus: ReceiptStatus | null;
  receiptHolder: string | null;
  receiptOpHash: string | null;
};

type ReservedReceipt = {
  id: string;
  claim_id: string;
  user_id: string;
  token_id: number;
  kind: typeof SHOWED_UP_KIND;
  evidence: string;
  holder: string;
};

export type SealAttestation = {
  receiptId: string;
  claimId: string;
  userId: string;
  tokenId: number;
  holder: string;
  kind: typeof SHOWED_UP_KIND;
  evidence: string;
};

export interface SealChain {
  issuerAddress: string;
  attestBatch(
    attestations: SealAttestation[],
    onInjected: (opHash: string) => Promise<void>,
  ): Promise<{ opHash: string }>;
}

export type SealChainFactory = (secretKey: string, rpc: string) => Promise<SealChain>;

export type SealRunResult = {
  ok: boolean;
  day: string;
  sitting: number | null;
  configured: boolean;
  dryRun: boolean;
  claims: number;
  pendingWallet: number;
  attempted: number;
  attested: number;
  submitted: number;
  failed: number;
  opHash?: string;
  reason?: string;
};

function log(event: Record<string, unknown>): void {
  console.log(JSON.stringify(event));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 240) : String(error).slice(0, 240);
}

export function utf8Hex(value: string): string {
  return Array.from(new TextEncoder().encode(value))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function previousCalendarDay(day: string): string {
  const date = new Date(`${day}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function losAngelesDate(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function sealDay(now = new Date()): {
  day: string;
  sitting: number | null;
  throughTokenId: number | null;
} {
  const day = previousCalendarDay(losAngelesDate(now));
  const exact = KENNEL_CLUB.sittings.find((sitting) => sitting.mintDate === day);
  const through = KENNEL_CLUB.sittings.filter((sitting) => sitting.mintDate <= day).at(-1);
  return {
    day,
    sitting: exact?.day ?? null,
    throughTokenId: through?.tokenId ?? null,
  };
}

function isTezosIdentity(provider: string | null, address: string | null): address is string {
  if (!provider || !address || !TEZOS_ADDRESS.test(address)) return false;
  return provider === 'kukai'
    || provider === 'temple'
    || provider === 'umami'
    || provider === 'metamask-tezos'
    || (provider === 'metamask' && address.startsWith('tz'));
}

export function collapseClaims(rows: ClaimReceiptRow[]): CollapsedClaim[] {
  const claims = new Map<string, CollapsedClaim>();
  for (const row of rows) {
    const existing = claims.get(row.claim_id) ?? {
      claimId: row.claim_id,
      userId: row.user_id,
      tokenId: Number(row.token_id),
      holder: null,
      receiptId: row.receipt_id,
      receiptStatus: row.receipt_status,
      receiptHolder: row.receipt_holder,
      receiptOpHash: row.receipt_op_hash,
    };
    if (!existing.holder && isTezosIdentity(row.identity_provider, row.identity_id)) {
      existing.holder = row.identity_id;
    }
    claims.set(row.claim_id, existing);
  }
  return [...claims.values()].sort((a, b) => a.tokenId - b.tokenId || a.claimId.localeCompare(b.claimId));
}

function evidenceFor(claim: Pick<CollapsedClaim, 'tokenId' | 'claimId'>): string {
  return `sitting:${String(claim.tokenId + 1).padStart(2, '0')} claim:${claim.claimId}`;
}

async function readClaims(db: D1Database, throughTokenId: number): Promise<CollapsedClaim[]> {
  const result = await db.prepare(`
    SELECT c.id AS claim_id, c.user_id, c.token_id, c.status AS claim_status,
           i.provider AS identity_provider, i.id AS identity_id,
           r.id AS receipt_id, r.status AS receipt_status,
           r.holder AS receipt_holder, r.op_hash AS receipt_op_hash
    FROM claims c
    LEFT JOIN identities i ON i.user_id = c.user_id
    LEFT JOIN seal_receipts r ON r.claim_id = c.id AND r.kind = 'showed-up'
    WHERE c.status IN ('held', 'delivered') AND c.token_id <= ?
    ORDER BY c.token_id, c.id, json_extract(i.payload, '$.verifiedAt') DESC, i.rowid DESC
  `).bind(throughTokenId).all<ClaimReceiptRow>();
  return collapseClaims(result.results ?? []);
}

async function stageReceipts(db: D1Database, claims: CollapsedClaim[], now: string): Promise<void> {
  if (!claims.length) return;
  const statements = claims.map((claim) => db.prepare(`
    INSERT INTO seal_receipts
      (id, claim_id, user_id, token_id, kind, evidence, status, holder, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'showed-up', ?, ?, ?, ?, ?)
    ON CONFLICT(claim_id, kind) DO UPDATE SET
      holder = COALESCE(excluded.holder, seal_receipts.holder),
      evidence = excluded.evidence,
      status = CASE
        WHEN seal_receipts.status IN ('submitting', 'submitted', 'attested') THEN seal_receipts.status
        WHEN excluded.holder IS NULL THEN 'pending_wallet'
        ELSE 'pending'
      END,
      updated_at = excluded.updated_at
  `).bind(
    `seal:${claim.claimId}:${SHOWED_UP_KIND}`,
    claim.claimId,
    claim.userId,
    claim.tokenId,
    evidenceFor(claim),
    claim.holder ? 'pending' : 'pending_wallet',
    claim.holder,
    now,
    now,
  ));
  await db.batch(statements);
}

async function reserveReceipts(
  db: D1Database,
  claims: CollapsedClaim[],
  runId: string,
  now: string,
): Promise<ReservedReceipt[]> {
  const reserved: ReservedReceipt[] = [];
  for (const claim of claims) {
    if (!claim.holder) continue;
    const row = await db.prepare(`
      UPDATE seal_receipts
      SET status = 'submitting', holder = ?, run_id = ?, error = NULL, updated_at = ?
      WHERE claim_id = ? AND kind = 'showed-up'
        AND status IN ('pending', 'pending_wallet', 'failed')
      RETURNING id, claim_id, user_id, token_id, kind, evidence, holder
    `).bind(claim.holder, runId, now, claim.claimId).first<ReservedReceipt>();
    if (row) reserved.push(row);
  }
  return reserved;
}

async function markSubmitted(
  db: D1Database,
  receipts: ReservedReceipt[],
  runId: string,
  opHash: string,
  now: string,
): Promise<void> {
  await db.batch(receipts.map((receipt) => db.prepare(`
    UPDATE seal_receipts
    SET status = 'submitted', op_hash = ?, updated_at = ?
    WHERE id = ? AND run_id = ? AND status = 'submitting'
  `).bind(opHash, now, receipt.id, runId)));
}

async function markAttested(
  db: D1Database,
  receipts: ReservedReceipt[],
  runId: string,
  opHash: string,
  now: string,
): Promise<void> {
  await db.batch(receipts.map((receipt) => db.prepare(`
    UPDATE seal_receipts
    SET status = 'attested', op_hash = ?, error = NULL, updated_at = ?, attested_at = ?
    WHERE id = ? AND run_id = ? AND status IN ('submitting', 'submitted')
  `).bind(opHash, now, now, receipt.id, runId)));
}

async function markFailed(
  db: D1Database,
  receipts: ReservedReceipt[],
  runId: string,
  error: string,
  now: string,
): Promise<void> {
  if (!receipts.length) return;
  await db.batch(receipts.map((receipt) => db.prepare(`
    UPDATE seal_receipts
    SET status = 'failed', error = ?, updated_at = ?
    WHERE id = ? AND run_id = ? AND status = 'submitting'
  `).bind(error, now, receipt.id, runId)));
}

function operationHash(operation: { hash?: string; opHash?: string }): string {
  const hash = operation.hash ?? operation.opHash ?? '';
  if (!OPERATION_HASH.test(hash)) throw new Error('invalid-operation-hash');
  return hash;
}

export async function createTaquitoSealChain(secretKey: string, rpc: string): Promise<SealChain> {
  const signer = await InMemorySigner.fromSecretKey(secretKey);
  const issuerAddress = await signer.publicKeyHash();
  const tezos = new TezosToolkit(rpc);
  tezos.setProvider({ signer });
  const contract = await tezos.contract.at(contracts.seal_soulbound.mainnet);
  const methodsObject = contract.methodsObject;
  if (typeof methodsObject.attest !== 'function') throw new Error('attest-entrypoint-missing');
  return {
    issuerAddress,
    async attestBatch(attestations, onInjected) {
      const batch = tezos.contract.batch();
      for (const attestation of attestations) {
        batch.withContractCall(methodsObject.attest!({
          evidence: utf8Hex(attestation.evidence),
          kind: utf8Hex(attestation.kind),
          to_: attestation.holder,
        }));
      }
      const operation = await batch.send();
      const opHash = operationHash(operation);
      await onInjected(opHash);
      await operation.confirmation(1);
      return { opHash };
    },
  };
}

async function publishSealBurst(env: SealEnv, result: SealRunResult): Promise<void> {
  if (!env.PRESENCE_BUS || result.dryRun || result.attested === 0) return;
  try {
    const response = await env.PRESENCE_BUS.fetch('https://presence.internal/burst', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'seal',
        clientId: `kennel-seals:${result.day}`,
        by: { handle: 'kennel-club' },
        meta: {
          sitting: result.sitting ?? 0,
          count: result.attested,
          label: SHOWED_UP_KIND,
          href: '/collect',
          opHash: result.opHash ?? '',
        },
      }),
    });
    if (!response.ok) log({ message: 'kennel seals burst rejected', day: result.day, status: response.status });
  } catch (error) {
    console.error(JSON.stringify({
      message: 'kennel seals burst failed',
      day: result.day,
      error: errorMessage(error),
    }));
  }
}

export async function runKennelSeals(
  env: SealEnv,
  options: { now?: Date; dryRun?: boolean; chainFactory?: SealChainFactory } = {},
): Promise<SealRunResult> {
  const clock = options.now ?? new Date();
  const target = sealDay(clock);
  const dryRun = options.dryRun ?? String(env.SEAL_DRY_RUN) === 'true';
  const secretKey = env.SEAL_ISSUER_SECRET_KEY?.trim() ?? '';
  const configured = Boolean(env.AUTH_DB && secretKey);
  const result: SealRunResult = {
    ok: true,
    day: target.day,
    sitting: target.sitting,
    configured,
    dryRun,
    claims: 0,
    pendingWallet: 0,
    attempted: 0,
    attested: 0,
    submitted: 0,
    failed: 0,
  };

  if (!env.AUTH_DB) return { ...result, ok: false, reason: 'auth-db-not-configured' };
  if (target.throughTokenId === null) return result;

  const claims = await readClaims(env.AUTH_DB, target.throughTokenId);
  result.claims = claims.length;
  result.pendingWallet = claims.filter((claim) => !claim.holder && !['submitted', 'attested'].includes(claim.receiptStatus ?? '')).length;
  const candidates = claims.filter((claim) => claim.holder && !['submitting', 'submitted', 'attested'].includes(claim.receiptStatus ?? ''));
  result.attempted = candidates.length;
  if (dryRun) {
    log({ message: 'kennel seals dry run complete', ...result });
    return result;
  }

  const stagedAt = new Date().toISOString();
  await stageReceipts(env.AUTH_DB, claims, stagedAt);
  if (!secretKey) return { ...result, ok: false, reason: 'seal-issuer-not-configured' };
  if (!candidates.length) return result;

  let chain: SealChain;
  try {
    chain = await (options.chainFactory ?? createTaquitoSealChain)(secretKey, env.SEAL_RPC);
  } catch (error) {
    console.error(JSON.stringify({ message: 'kennel seals signer unavailable', error: errorMessage(error) }));
    return { ...result, ok: false, failed: candidates.length, reason: 'seal-signer-unavailable' };
  }

  const runId = `seals_${crypto.randomUUID().replaceAll('-', '')}`;
  const reserved = await reserveReceipts(env.AUTH_DB, candidates, runId, new Date().toISOString());
  result.attempted = reserved.length;
  if (!reserved.length) return result;
  const attestations = reserved.map((receipt) => ({
    receiptId: receipt.id,
    claimId: receipt.claim_id,
    userId: receipt.user_id,
    tokenId: Number(receipt.token_id),
    holder: receipt.holder,
    kind: SHOWED_UP_KIND,
    evidence: receipt.evidence,
  } satisfies SealAttestation));

  let injectedHash = '';
  try {
    const operation = await chain.attestBatch(attestations, async (opHash) => {
      injectedHash = opHash;
      await markSubmitted(env.AUTH_DB, reserved, runId, opHash, new Date().toISOString());
      result.submitted = reserved.length;
    });
    await markAttested(env.AUTH_DB, reserved, runId, operation.opHash, new Date().toISOString());
    result.opHash = operation.opHash;
    result.attested = reserved.length;
    result.submitted = 0;
    await publishSealBurst(env, result);
    log({
      message: 'kennel seals complete',
      issuer: chain.issuerAddress,
      ...result,
    });
    return result;
  } catch (error) {
    const reason = injectedHash ? 'seal-confirmation-pending' : 'seal-batch-failed';
    if (!injectedHash) {
      await markFailed(env.AUTH_DB, reserved, runId, reason, new Date().toISOString());
      result.failed = reserved.length;
    } else {
      result.opHash = injectedHash;
      result.submitted = reserved.length;
    }
    console.error(JSON.stringify({
      message: reason,
      issuer: chain.issuerAddress,
      opHash: injectedHash || undefined,
      error: errorMessage(error),
    }));
    return { ...result, ok: false, reason };
  }
}

async function status(env: SealEnv): Promise<Response> {
  let receipts: Record<string, number> = {};
  let migrationApplied = false;
  if (env.AUTH_DB) {
    try {
      const rows = await env.AUTH_DB.prepare(`
        SELECT status, COUNT(*) AS count FROM seal_receipts GROUP BY status
      `).all<{ status: string; count: number }>();
      receipts = Object.fromEntries((rows.results ?? []).map((row) => [row.status, Number(row.count)]));
      migrationApplied = true;
    } catch {
      // Status stays useful before migration 0005 is applied.
    }
  }
  return Response.json({
    ok: true,
    configured: Boolean(env.AUTH_DB && env.SEAL_ISSUER_SECRET_KEY?.trim()),
    migrationApplied,
    bindings: {
      authDb: Boolean(env.AUTH_DB),
      issuerSecret: Boolean(env.SEAL_ISSUER_SECRET_KEY?.trim()),
      presence: Boolean(env.PRESENCE_BUS),
    },
    contract: contracts.seal_soulbound.mainnet,
    supportedKinds: [SHOWED_UP_KIND],
    deferredKinds: ['streak-7', 'complete-30'],
    cron: '15 7 * * *',
    timeZone: 'America/Los_Angeles',
    dryRun: String(env.SEAL_DRY_RUN) === 'true',
    receipts,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/status')) {
      return status(env);
    }
    return new Response('Not found', { status: 404 });
  },
  async scheduled(controller, env): Promise<void> {
    const result = await runKennelSeals(env, { now: new Date(controller.scheduledTime) });
    if (!result.ok) throw new Error(result.reason ?? 'kennel-seals-run-failed');
  },
} satisfies ExportedHandler<SealEnv>;
