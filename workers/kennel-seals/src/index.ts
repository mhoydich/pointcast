import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';

import contracts from '../../../src/data/contracts.json';
import KENNEL_CLUB from '../../../src/data/kennel-club-september-sitting.json';

const SHOWED_UP_KIND = 'showed-up';
const STREAK_7_KIND = 'streak-7';
const COMPLETE_30_KIND = 'complete-30';
const MILESTONE_KINDS = [STREAK_7_KIND, COMPLETE_30_KIND] as const;
const OPERATION_HASH = /^o[1-9A-HJ-NP-Za-km-z]{50}$/;
const TEZOS_ADDRESS = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
const TEZOS_CONTRACT = /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/;
const TZKT_API = 'https://api.tzkt.io/v1';
const SIGNER_LOCK_TTL_MS = 15 * 60_000;
const SEAL_SIGNER_LOCK = 'kennel-seal-wallet';

type SealEnv = Env & {
  SEAL_ISSUER_SECRET_KEY?: string;
  SEAL_CONTRACT_V2?: string;
  SEAL_V1_FROZEN?: string;
};
type SealKind = typeof SHOWED_UP_KIND | typeof STREAK_7_KIND | typeof COMPLETE_30_KIND;
type SealContractVersion = 'v1' | 'v2';
type ReceiptStatus = 'pending_wallet' | 'pending' | 'submitting' | 'submitted' | 'attested' | 'failed';

type ClaimReceiptRow = {
  claim_id: string;
  user_id: string;
  token_id: number;
  claim_status: 'held' | 'delivered';
  identity_provider: string | null;
  identity_id: string | null;
  receipt_id: string | null;
  receipt_kind: SealKind | null;
  receipt_status: ReceiptStatus | null;
  receipt_holder: string | null;
  receipt_op_hash: string | null;
};

type CollapsedClaim = {
  claimId: string;
  userId: string;
  tokenId: number;
  holder: string | null;
  receipts: Partial<Record<SealKind, {
    id: string;
    status: ReceiptStatus;
    holder: string | null;
    opHash: string | null;
  }>>;
};

type PlannedReceipt = {
  claimId: string;
  userId: string;
  tokenId: number;
  kind: SealKind;
  evidence: string;
  holder: string | null;
  receiptStatus: ReceiptStatus | null;
};

type ReservedReceipt = {
  id: string;
  claim_id: string;
  user_id: string;
  token_id: number;
  kind: SealKind;
  evidence: string;
  holder: string;
};

type SubmittedReceipt = ReservedReceipt & {
  op_hash: string;
  contract_version: SealContractVersion;
  contract_address: string;
};

type ChainOperationStatus = 'applied' | 'pending' | 'failed' | 'unknown';

export type SealAttestation = {
  receiptId: string;
  claimId: string;
  userId: string;
  tokenId: number;
  holder: string;
  kind: SealKind;
  evidence: string;
  evidenceUri: string | null;
};

export interface SealChain {
  issuerAddress: string;
  contractAddress: string;
  version: SealContractVersion;
  operationStatus(opHash: string): Promise<ChainOperationStatus>;
  attestBatch(
    attestations: SealAttestation[],
    onInjected: (opHash: string) => Promise<void>,
  ): Promise<{ opHash: string }>;
}

export type SealChainFactory = (
  secretKey: string,
  rpc: string,
  contractAddress: string,
  version: SealContractVersion,
) => Promise<SealChain>;

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
  opHashes?: Partial<Record<SealContractVersion, string>>;
  reason?: string;
  contracts: {
    v1: { address: string; enabled: boolean; frozen: boolean; attempted: number; attested: number };
    v2: { address: string | null; enabled: boolean; attempted: number; attested: number };
  };
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
      receipts: {},
    };
    if (!existing.holder && isTezosIdentity(row.identity_provider, row.identity_id)) {
      existing.holder = row.identity_id;
    }
    if (row.receipt_id && row.receipt_kind && row.receipt_status) {
      existing.receipts[row.receipt_kind] = {
        id: row.receipt_id,
        status: row.receipt_status,
        holder: row.receipt_holder,
        opHash: row.receipt_op_hash,
      };
    }
    claims.set(row.claim_id, existing);
  }
  return [...claims.values()].sort((a, b) => a.tokenId - b.tokenId || a.claimId.localeCompare(b.claimId));
}

function evidenceFor(claim: Pick<CollapsedClaim, 'tokenId' | 'claimId'>): string {
  return `sitting:${String(claim.tokenId + 1).padStart(2, '0')} claim:${claim.claimId}`;
}

export function planReceipts(
  claims: CollapsedClaim[],
  options: { includeShowedUp: boolean; includeMilestones: boolean },
): PlannedReceipt[] {
  const planned: PlannedReceipt[] = [];
  if (options.includeShowedUp) {
    for (const claim of claims) {
      planned.push({
        claimId: claim.claimId,
        userId: claim.userId,
        tokenId: claim.tokenId,
        holder: claim.holder,
        kind: SHOWED_UP_KIND,
        evidence: evidenceFor(claim),
        receiptStatus: claim.receipts[SHOWED_UP_KIND]?.status ?? null,
      });
    }
  }
  if (!options.includeMilestones) return planned;

  const byUser = new Map<string, CollapsedClaim[]>();
  for (const claim of claims) {
    const userClaims = byUser.get(claim.userId) ?? [];
    userClaims.push(claim);
    byUser.set(claim.userId, userClaims);
  }
  for (const userClaims of byUser.values()) {
    const byTokenId = new Map<number, CollapsedClaim>();
    for (const claim of userClaims) {
      if (!byTokenId.has(claim.tokenId)) byTokenId.set(claim.tokenId, claim);
    }
    const ordered = [...byTokenId.values()].sort((a, b) => a.tokenId - b.tokenId);
    let run = 0;
    let previous = -2;
    let streakClaim: CollapsedClaim | null = null;
    for (const claim of ordered) {
      run = claim.tokenId === previous + 1 ? run + 1 : 1;
      previous = claim.tokenId;
      if (run >= 7) {
        streakClaim = claim;
        break;
      }
    }
    if (streakClaim) {
      planned.push({
        claimId: streakClaim.claimId,
        userId: streakClaim.userId,
        tokenId: streakClaim.tokenId,
        holder: streakClaim.holder,
        kind: STREAK_7_KIND,
        evidence: `kennel-club streak:7 through-sitting:${String(streakClaim.tokenId + 1).padStart(2, '0')}`,
        receiptStatus: streakClaim.receipts[STREAK_7_KIND]?.status ?? null,
      });
    }
    if (ordered.length === 30 && ordered.every((claim, index) => claim.tokenId === index)) {
      const completeClaim = ordered[29]!;
      planned.push({
        claimId: completeClaim.claimId,
        userId: completeClaim.userId,
        tokenId: completeClaim.tokenId,
        holder: completeClaim.holder,
        kind: COMPLETE_30_KIND,
        evidence: 'kennel-club complete:30',
        receiptStatus: completeClaim.receipts[COMPLETE_30_KIND]?.status ?? null,
      });
    }
  }
  return planned;
}

async function readClaims(db: D1Database, throughTokenId: number): Promise<CollapsedClaim[]> {
  const result = await db.prepare(`
    SELECT c.id AS claim_id, c.user_id, c.token_id, c.status AS claim_status,
           i.provider AS identity_provider, i.id AS identity_id,
           r.id AS receipt_id, r.kind AS receipt_kind, r.status AS receipt_status,
           r.holder AS receipt_holder, r.op_hash AS receipt_op_hash
    FROM claims c
    LEFT JOIN identities i ON i.user_id = c.user_id
    LEFT JOIN seal_receipts r ON r.claim_id = c.id
    WHERE c.status IN ('held', 'delivered') AND c.token_id <= ?
    ORDER BY c.token_id, c.id, json_extract(i.payload, '$.verifiedAt') DESC, i.rowid DESC
  `).bind(throughTokenId).all<ClaimReceiptRow>();
  return collapseClaims(result.results ?? []);
}

async function stageReceipts(db: D1Database, receipts: PlannedReceipt[], now: string): Promise<void> {
  if (!receipts.length) return;
  const statements = receipts.map((receipt) => db.prepare(`
    INSERT INTO seal_receipts
      (id, claim_id, user_id, token_id, kind, evidence, status, holder, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    `seal:${receipt.claimId}:${receipt.kind}`,
    receipt.claimId,
    receipt.userId,
    receipt.tokenId,
    receipt.kind,
    receipt.evidence,
    receipt.holder ? 'pending' : 'pending_wallet',
    receipt.holder,
    now,
    now,
  ));
  await db.batch(statements);
}

async function reserveReceipts(
  db: D1Database,
  receipts: PlannedReceipt[],
  runId: string,
  now: string,
): Promise<ReservedReceipt[]> {
  const reserved: ReservedReceipt[] = [];
  for (const receipt of receipts) {
    if (!receipt.holder) continue;
    const row = await db.prepare(`
      UPDATE seal_receipts
      SET status = 'submitting', holder = ?, run_id = ?, error = NULL, updated_at = ?
      WHERE claim_id = ? AND kind = ?
        AND status IN ('pending', 'pending_wallet', 'failed')
      RETURNING id, claim_id, user_id, token_id, kind, evidence, holder
    `).bind(receipt.holder, runId, now, receipt.claimId, receipt.kind).first<ReservedReceipt>();
    if (row) reserved.push(row);
  }
  return reserved;
}

async function acquireSignerLock(db: D1Database, holder: string): Promise<boolean> {
  const now = Date.now();
  const row = await db.prepare(`
    INSERT INTO kennel_signer_locks (lock_name, holder, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(lock_name) DO UPDATE SET holder = excluded.holder, expires_at = excluded.expires_at
    WHERE kennel_signer_locks.holder IS NULL
       OR kennel_signer_locks.expires_at <= ?
       OR kennel_signer_locks.holder = excluded.holder
    RETURNING holder
  `).bind(SEAL_SIGNER_LOCK, holder, now + SIGNER_LOCK_TTL_MS, now).first<{ holder: string }>();
  return row?.holder === holder;
}

async function releaseSignerLock(db: D1Database, holder: string): Promise<void> {
  await db.prepare(`
    UPDATE kennel_signer_locks SET holder = NULL, expires_at = NULL
    WHERE lock_name = ? AND holder = ?
  `).bind(SEAL_SIGNER_LOCK, holder).run();
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

async function markSubmitted(
  db: D1Database,
  receipts: ReservedReceipt[],
  runId: string,
  opHash: string,
  version: SealContractVersion,
  contractAddress: string,
  now: string,
): Promise<void> {
  const operationId = `seal:${opHash}`;
  await db.batch([
    db.prepare(`
      INSERT INTO kennel_chain_operations
        (id, action, subject_id, op_hash, status, error, submitted_at, updated_at)
      VALUES (?, ?, ?, ?, 'submitted', NULL, ?, ?)
      ON CONFLICT(op_hash) DO UPDATE SET updated_at = excluded.updated_at
    `).bind(operationId, `seal-${version}`, runId, opHash, now, now),
    ...receipts.map((receipt) => db.prepare(`
      UPDATE seal_receipts
      SET status = 'submitted', op_hash = ?, contract_version = ?, contract_address = ?, updated_at = ?
      WHERE id = ? AND run_id = ? AND status = 'submitting'
    `).bind(opHash, version, contractAddress, now, receipt.id, runId)),
  ]);
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
  await db.prepare(`
    UPDATE kennel_chain_operations SET status = 'applied', error = NULL, updated_at = ?
    WHERE op_hash = ?
  `).bind(now, opHash).run();
}

async function reconcileSubmittedReceipts(
  env: SealEnv,
  secretKey: string,
  chainFactory: SealChainFactory,
): Promise<{ applied: number; failed: number; pending: number }> {
  const db = env.AUTH_DB;
  if (!db) return { applied: 0, failed: 0, pending: 0 };
  const rows = await db.prepare(`
    SELECT id, claim_id, user_id, token_id, kind, evidence, holder, op_hash,
           contract_version, contract_address
    FROM seal_receipts
    WHERE status = 'submitted' AND op_hash IS NOT NULL
      AND contract_version IN ('v1', 'v2') AND contract_address IS NOT NULL
    ORDER BY op_hash, id
  `).all<SubmittedReceipt>();
  const groups = new Map<string, SubmittedReceipt[]>();
  for (const row of rows.results ?? []) {
    const list = groups.get(row.op_hash) ?? [];
    list.push(row);
    groups.set(row.op_hash, list);
  }
  const result = { applied: 0, failed: 0, pending: 0 };
  for (const [opHash, receipts] of groups) {
    const first = receipts[0]!;
    let status: ChainOperationStatus = 'unknown';
    try {
      const chain = await chainFactory(secretKey, env.SEAL_RPC, first.contract_address, first.contract_version);
      status = await chain.operationStatus(opHash);
    } catch {
      status = 'unknown';
    }
    const now = new Date().toISOString();
    if (status === 'applied') {
      await db.batch([
        ...receipts.map((receipt) => db.prepare(`
          UPDATE seal_receipts
          SET status = 'attested', error = NULL, updated_at = ?, attested_at = ?
          WHERE id = ? AND status = 'submitted' AND op_hash = ?
        `).bind(now, now, receipt.id, opHash)),
        db.prepare(`
          UPDATE kennel_chain_operations SET status = 'applied', error = NULL, updated_at = ? WHERE op_hash = ?
        `).bind(now, opHash),
      ]);
      result.applied += receipts.length;
    } else if (status === 'failed') {
      await db.batch([
        ...receipts.map((receipt) => db.prepare(`
          UPDATE seal_receipts SET status = 'failed', error = 'chain-operation-failed', updated_at = ?
          WHERE id = ? AND status = 'submitted' AND op_hash = ?
        `).bind(now, receipt.id, opHash)),
        db.prepare(`
          UPDATE kennel_chain_operations SET status = 'failed', error = 'chain-operation-failed', updated_at = ? WHERE op_hash = ?
        `).bind(now, opHash),
      ]);
      result.failed += receipts.length;
    } else {
      result.pending += receipts.length;
      if (status === 'unknown') {
        await db.prepare(`
          UPDATE kennel_chain_operations SET status = 'unknown', error = 'reconciliation-unavailable', updated_at = ? WHERE op_hash = ?
        `).bind(now, opHash).run();
      }
    }
  }
  return result;
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

export async function createTaquitoSealChain(
  secretKey: string,
  rpc: string,
  contractAddress: string,
  version: SealContractVersion,
): Promise<SealChain> {
  if (!TEZOS_CONTRACT.test(contractAddress)) throw new Error('invalid-seal-contract');
  const signer = await InMemorySigner.fromSecretKey(secretKey);
  const issuerAddress = await signer.publicKeyHash();
  const tezos = new TezosToolkit(rpc);
  tezos.setProvider({ signer });
  const contract = await tezos.contract.at(contractAddress);
  const methodsObject = contract.methodsObject;
  if (version === 'v1' && typeof methodsObject.attest !== 'function') {
    throw new Error('attest-entrypoint-missing');
  }
  if (version === 'v2' && typeof methodsObject.attest_batch !== 'function') {
    throw new Error('attest-batch-entrypoint-missing');
  }
  return {
    issuerAddress,
    contractAddress,
    version,
    operationStatus: readTzktOperationStatus,
    async attestBatch(attestations, onInjected) {
      const operation = version === 'v1'
        ? await (() => {
          const batch = tezos.contract.batch();
          for (const attestation of attestations) {
            batch.withContractCall(methodsObject.attest!({
              evidence: utf8Hex(attestation.evidence),
              kind: utf8Hex(attestation.kind),
              to_: attestation.holder,
            }));
          }
          return batch.send();
        })()
        : await methodsObject.attest_batch!(attestations.map((attestation) => ({
          evidence: utf8Hex(attestation.evidence),
          evidence_uri: attestation.evidenceUri ? utf8Hex(attestation.evidenceUri) : null,
          kind: utf8Hex(attestation.kind),
          to_: attestation.holder,
        }))).send();
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
  const v1Address = contracts.seal_soulbound.mainnet;
  const v1Frozen = String(env.SEAL_V1_FROZEN) === '1';
  const v2Address = env.SEAL_CONTRACT_V2?.trim() ?? '';
  const v2Enabled = TEZOS_CONTRACT.test(v2Address);
  const configured = Boolean(env.AUTH_DB && secretKey && (!v1Frozen || v2Enabled));
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
    contracts: {
      v1: { address: v1Address, enabled: !v1Frozen, frozen: v1Frozen, attempted: 0, attested: 0 },
      v2: { address: v2Enabled ? v2Address : null, enabled: v2Enabled, attempted: 0, attested: 0 },
    },
  };

  if (!env.AUTH_DB) return { ...result, ok: false, reason: 'auth-db-not-configured' };
  if (target.throughTokenId === null) return result;

  const claims = await readClaims(env.AUTH_DB, target.throughTokenId);
  result.claims = claims.length;
  const planned = planReceipts(claims, {
    includeShowedUp: !v1Frozen || v2Enabled,
    includeMilestones: v2Enabled,
  });
  result.pendingWallet = planned.filter((receipt) => (
    !receipt.holder && !['submitted', 'attested'].includes(receipt.receiptStatus ?? '')
  )).length;
  const candidates = planned.filter((receipt) => (
    receipt.holder && !['submitting', 'submitted', 'attested'].includes(receipt.receiptStatus ?? '')
  ));
  result.attempted = candidates.length;
  if (dryRun) {
    log({ message: 'kennel seals dry run complete', ...result });
    return result;
  }

  const stagedAt = new Date().toISOString();
  await stageReceipts(env.AUTH_DB, planned, stagedAt);
  if (!secretKey) return { ...result, ok: false, reason: 'seal-issuer-not-configured' };
  const reconciliation = await reconcileSubmittedReceipts(
    env,
    secretKey,
    options.chainFactory ?? createTaquitoSealChain,
  );
  result.attested += reconciliation.applied;
  result.failed += reconciliation.failed;
  result.submitted += reconciliation.pending;
  if (!candidates.length) return result;

  result.attempted = 0;
  const failures: string[] = [];
  const routes: Array<{
    version: SealContractVersion;
    address: string;
    receipts: PlannedReceipt[];
  }> = [
    {
      version: 'v1',
      address: v1Address,
      receipts: candidates.filter((receipt) => !v1Frozen && receipt.kind === SHOWED_UP_KIND),
    },
    {
      version: 'v2',
      address: v2Address,
      receipts: candidates.filter((receipt) => (
        receipt.kind !== SHOWED_UP_KIND || v1Frozen
      )),
    },
  ];

  for (const route of routes) {
    if (!route.receipts.length) continue;
    let chain: SealChain;
    try {
      chain = await (options.chainFactory ?? createTaquitoSealChain)(
        secretKey,
        env.SEAL_RPC,
        route.address,
        route.version,
      );
    } catch (error) {
      const reason = `seal-${route.version}-signer-unavailable`;
      result.ok = false;
      result.failed += route.receipts.length;
      failures.push(reason);
      console.error(JSON.stringify({ message: reason, error: errorMessage(error) }));
      continue;
    }

    const runId = `seals_${route.version}_${crypto.randomUUID().replaceAll('-', '')}`;
    const reserved = await reserveReceipts(
      env.AUTH_DB,
      route.receipts,
      runId,
      new Date().toISOString(),
    );
    result.attempted += reserved.length;
    result.contracts[route.version].attempted += reserved.length;
    if (!reserved.length) continue;
    if (!await acquireSignerLock(env.AUTH_DB, runId)) {
      const reason = `seal-${route.version}-signer-busy`;
      await markFailed(env.AUTH_DB, reserved, runId, reason, new Date().toISOString());
      result.ok = false;
      result.failed += reserved.length;
      failures.push(reason);
      continue;
    }
    const attestations = reserved.map((receipt) => ({
      receiptId: receipt.id,
      claimId: receipt.claim_id,
      userId: receipt.user_id,
      tokenId: Number(receipt.token_id),
      holder: receipt.holder,
      kind: receipt.kind,
      evidence: receipt.evidence,
      evidenceUri: null,
    } satisfies SealAttestation));

    let injectedHash = '';
    try {
      const operation = await chain.attestBatch(attestations, async (opHash) => {
        injectedHash = opHash;
        await markSubmitted(
          env.AUTH_DB,
          reserved,
          runId,
          opHash,
          route.version,
          route.address,
          new Date().toISOString(),
        );
        result.submitted += reserved.length;
      });
      await markAttested(env.AUTH_DB, reserved, runId, operation.opHash, new Date().toISOString());
      result.opHash ??= operation.opHash;
      result.opHashes = { ...result.opHashes, [route.version]: operation.opHash };
      result.attested += reserved.length;
      result.contracts[route.version].attested += reserved.length;
      result.submitted -= reserved.length;
      log({
        message: 'kennel seals contract complete',
        issuer: chain.issuerAddress,
        contract: chain.contractAddress,
        version: chain.version,
        count: reserved.length,
        opHash: operation.opHash,
      });
    } catch (error) {
      const reason = injectedHash
        ? `seal-${route.version}-confirmation-pending`
        : `seal-${route.version}-batch-failed`;
      result.ok = false;
      failures.push(reason);
      if (!injectedHash) {
        await markFailed(env.AUTH_DB, reserved, runId, reason, new Date().toISOString());
        result.failed += reserved.length;
      } else {
        result.opHash ??= injectedHash;
        result.opHashes = { ...result.opHashes, [route.version]: injectedHash };
      }
      console.error(JSON.stringify({
        message: reason,
        issuer: chain.issuerAddress,
        contract: chain.contractAddress,
        opHash: injectedHash || undefined,
        error: errorMessage(error),
      }));
    } finally {
      await releaseSignerLock(env.AUTH_DB, runId).catch(() => undefined);
    }
  }

  if (result.attested > 0) await publishSealBurst(env, result);
  if (failures.length) result.reason = failures.join(',');
  log({ message: 'kennel seals complete', ...result });
  return result;
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
  const v1Frozen = String(env.SEAL_V1_FROZEN) === '1';
  const v2Address = env.SEAL_CONTRACT_V2?.trim() ?? '';
  const v2Enabled = TEZOS_CONTRACT.test(v2Address);
  return Response.json({
    ok: true,
    configured: Boolean(
      env.AUTH_DB
      && env.SEAL_ISSUER_SECRET_KEY?.trim()
      && (!v1Frozen || v2Enabled)
    ),
    migrationApplied,
    bindings: {
      authDb: Boolean(env.AUTH_DB),
      issuerSecret: Boolean(env.SEAL_ISSUER_SECRET_KEY?.trim()),
      presence: Boolean(env.PRESENCE_BUS),
      sealContractV2: v2Enabled,
    },
    contracts: {
      v1: {
        address: contracts.seal_soulbound.mainnet,
        enabled: !v1Frozen,
        frozen: v1Frozen,
        kinds: [SHOWED_UP_KIND],
      },
      v2: {
        address: v2Enabled ? v2Address : null,
        enabled: v2Enabled,
        kinds: [...(v1Frozen ? [SHOWED_UP_KIND] : []), ...MILESTONE_KINDS],
      },
    },
    supportedKinds: [
      ...(!v1Frozen ? [SHOWED_UP_KIND] : []),
      ...(v2Enabled ? MILESTONE_KINDS : []),
    ],
    deferredKinds: v2Enabled
      ? []
      : [...(v1Frozen ? [SHOWED_UP_KIND] : []), ...MILESTONE_KINDS],
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
