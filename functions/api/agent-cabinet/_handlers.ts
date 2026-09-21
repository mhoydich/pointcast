import { encodeOpHash } from '@taquito/utils';
import { hashAgentActionRequest, verifyAgentRequest } from '../../_lib/agent-identity';
import {
  X402PreSettlementError,
  hashReceipt,
  withX402,
  x402AuthorizationHash,
  x402AuthorizationSummary,
  x402PaymentWasNotSubmitted,
  x402TransactionHash,
  type X402GateResult,
  type X402SettlementObservation,
} from '../../_lib/x402-gate';
import { cabinetIntentStatus, createCabinetTezosChain, type CabinetChain, type CabinetChainFactory } from './_chain';
import { otherWorldsClaimStatus } from '../other-worlds/_chain';
import type { ClaimRow as OtherWorldsClaimRow } from '../other-worlds/_shared';
import {
  CabinetError,
  challengeMessage,
  challengeTerms,
  configuration,
  currentOfferSlug,
  fail,
  getIntent,
  getIntentByChallenge,
  idempotencyKey,
  json,
  michelinePayload,
  offerSlug,
  paymentTermsStillPinned,
  publicIntent,
  readBody,
  recipient,
  settledDeliveryConfiguration,
  verifyWalletProof,
  type AgentCabinetEnv,
  type CabinetConfig,
  type CabinetIntentRow,
} from './_shared';

type PaymentGate = typeof withX402;
export interface CabinetHandlerOptions {
  now?: () => number;
  chainFactory?: CabinetChainFactory;
  statusChain?: Pick<CabinetChain, 'status'>;
  otherWorldsStatus?: (row: OtherWorldsClaimRow) => Promise<'pending' | 'confirmed' | 'failed'>;
  paymentGate?: PaymentGate;
  /** Tests may model a future committed overlay; production uses the checked-in record. */
  publicationRecord?: unknown;
}

const now = (options: CabinetHandlerOptions) => (options.now || Date.now)();
const intentId = () => `aci_${crypto.randomUUID().replaceAll('-', '')}`;
const challengeId = () => `acc_${crypto.randomUUID().replaceAll('-', '')}`;
const nonce = () => crypto.randomUUID().replaceAll('-', '');
const CHALLENGE_WINDOW_MS = 60_000;
const CHALLENGE_RECIPIENT_LIMIT = 10;
const CHALLENGE_GLOBAL_LIMIT = 300;
const EXPIRED_CHALLENGE_RETENTION_MS = 24 * 60 * 60_000;

interface CabinetSettlementProof {
  receipt: Record<string, unknown>;
  receiptHash: string;
  payer: string;
}

async function configured(env: AgentCabinetEnv, options: CabinetHandlerOptions): Promise<CabinetConfig> {
  const value = await configuration(env, options.publicationRecord);
  if (!value) throw new CabinetError('collection-not-enabled', 503);
  return value;
}

async function adapter(env: AgentCabinetEnv, config: CabinetConfig, options: CabinetHandlerOptions): Promise<CabinetChain> {
  return (options.chainFactory || createCabinetTezosChain)(env, config);
}

function inputKeys(input: Record<string, unknown>, expected: string[]) {
  const actual = Object.keys(input).sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== [...expected].sort()[index])) {
    throw new CabinetError('unexpected-request-fields');
  }
}

async function readiness(env: AgentCabinetEnv, config: CabinetConfig, options: CabinetHandlerOptions, force = false) {
  const db = env.AUTH_DB!;
  const cached = await db.prepare('SELECT verified_at FROM agent_cabinet_readiness WHERE config_hash = ?')
    .bind(config.hash).first<{ verified_at: number }>();
  if (!force && cached && cached.verified_at > now(options) - 30_000) return;
  const rows = await db.prepare(`
    SELECT offer_slug, COUNT(*) AS reserved
    FROM agent_cabinet_intents
    WHERE config_hash = ? AND delivery_status <> 'blocked'
    GROUP BY offer_slug
  `).bind(config.hash).all<{ offer_slug: string; reserved: number }>();
  const counts = Object.fromEntries(rows.results.map((row) => [row.offer_slug, Number(row.reserved)]));
  await (await adapter(env, config, options)).ready(counts);
  await db.prepare(`
    INSERT INTO agent_cabinet_readiness(config_hash, verified_at) VALUES (?, ?)
    ON CONFLICT(config_hash) DO UPDATE SET verified_at = excluded.verified_at
  `).bind(config.hash, now(options)).run();
}

async function deliveryPreflight(env: AgentCabinetEnv, config: CabinetConfig, row: CabinetIntentRow, options: CabinetHandlerOptions) {
  const spent = await env.AUTH_DB!.prepare('SELECT COALESCE(SUM(maximum_cost_mutez),0) AS used FROM agent_cabinet_intents')
    .first<{ used: number }>();
  const remaining = config.totalBudgetMutez - Number(spent?.used || 0);
  if (!Number.isSafeInteger(remaining) || remaining <= 0) throw new CabinetError('sponsor-budget-limit', 503);
  const estimate = await (await adapter(env, config, options)).preflight(row, remaining);
  if (!Number.isSafeInteger(estimate) || estimate <= 0
    || estimate > Math.min(config.maxOperationMutez, remaining)) {
    throw new CabinetError('sponsor-budget-limit', 503);
  }
}

function challengeResponse(row: CabinetIntentRow, status: number) {
  return json({
    ok: true,
    challengeId: row.challenge_id,
    intentId: row.id,
    message: row.challenge_message,
    payload: row.challenge_payload,
    expiresAt: new Date(row.challenge_expires_at).toISOString(),
    statusUrl: `/api/agent-cabinet/status?id=${row.id}`,
  }, status, row.id);
}

export async function handleCabinetChallenge(request: Request, env: AgentCabinetEnv, options: CabinetHandlerOptions = {}): Promise<Response> {
  try {
    if (!env.AUTH_DB) throw new CabinetError('collection-storage-unavailable', 503);
    const input = await readBody(request);
    inputKeys(input, ['offer', 'recipient']);
    const slug = currentOfferSlug(input.offer);
    const address = recipient(input.recipient);
    const key = idempotencyKey(request);
    const config = await configured(env, options);
    const item = config.items.find((candidate) => candidate.slug === slug);
    if (!item) throw new CabinetError('offer-not-published', 404);
    const requestHash = await hashAgentActionRequest('agent-cabinet:challenge', { offer: slug, recipient: address });
    const identity = await verifyAgentRequest(env.AUTH_DB, request, requestHash, 'cabinet:collect', new Date(now(options)));
    if (identity.response) return new Response(identity.response.body, { status: identity.response.status, headers: identity.response.headers });
    const requestStartedAt = now(options);
    await env.AUTH_DB.prepare(`
      DELETE FROM agent_cabinet_intents
      WHERE delivery_status='blocked' AND payment_status IN ('required','refused')
        AND challenge_expires_at < ?
    `).bind(requestStartedAt - EXPIRED_CHALLENGE_RETENTION_MS).run();
    const existing = await env.AUTH_DB.prepare('SELECT * FROM agent_cabinet_intents WHERE idempotency_key = ?')
      .bind(key).first<CabinetIntentRow>();
    if (existing) {
      if (existing.request_hash !== requestHash || existing.config_hash !== config.hash
        || existing.offer_slug !== slug || existing.recipient !== address
        || existing.agent_id !== identity.agentId) {
        throw new CabinetError('idempotency-key-conflict', 409);
      }
      return challengeResponse(existing, 200);
    }
    const recent = await env.AUTH_DB.prepare(`
      SELECT COUNT(*) AS total,
             COALESCE(SUM(CASE WHEN recipient=? THEN 1 ELSE 0 END),0) AS recipient_total
      FROM agent_cabinet_intents WHERE created_at>?
    `).bind(address, requestStartedAt - CHALLENGE_WINDOW_MS).first<{ total: number; recipient_total: number }>();
    if (Number(recent?.recipient_total || 0) >= CHALLENGE_RECIPIENT_LIMIT
      || Number(recent?.total || 0) >= CHALLENGE_GLOBAL_LIMIT) {
      throw new CabinetError('too-many-challenges', 429);
    }
    await readiness(env, config, options);
    const createdAt = now(options);
    const id = intentId();
    const challenge = challengeId();
    const challengeNonce = nonce();
    const expiresAt = createdAt + 5 * 60_000;
    const terms = challengeTerms(id, challenge, challengeNonce, item, config, address, createdAt, expiresAt);
    const message = await challengeMessage(terms);
    const payload = michelinePayload(message);
    await env.AUTH_DB.prepare(`
      INSERT OR IGNORE INTO agent_cabinet_intents (
        id, challenge_id, idempotency_key, request_hash, agent_id,
        offer_slug, offer_revision, config_hash, recipient, contract, token_id, sponsor,
        quantity, supply_cap, artifact_uri, artifact_sha256, metadata_uri, metadata_sha256,
        price_units, payment_network, payment_asset, payment_pay_to,
        challenge_nonce, challenge_message, challenge_payload, challenge_expires_at,
        created_at, updated_at
      )
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      WHERE (SELECT COUNT(*) FROM agent_cabinet_intents WHERE recipient=? AND created_at>?) < ?
        AND (SELECT COUNT(*) FROM agent_cabinet_intents WHERE created_at>?) < ?
    `).bind(
      id, challenge, key, requestHash, identity.agentId,
      slug, item.revision, config.hash, address, config.contract, item.tokenId, config.sponsor,
      item.supplyCap, item.artifactUri, item.artifactSha256, item.metadataUri, item.metadataSha256,
      Number(config.priceUnits), config.paymentNetwork, config.paymentAsset, config.paymentPayTo,
      challengeNonce, message, payload, expiresAt, createdAt, createdAt,
      address, createdAt - CHALLENGE_WINDOW_MS, CHALLENGE_RECIPIENT_LIMIT,
      createdAt - CHALLENGE_WINDOW_MS, CHALLENGE_GLOBAL_LIMIT,
    ).run();
    const inserted = await env.AUTH_DB.prepare('SELECT * FROM agent_cabinet_intents WHERE idempotency_key = ?')
      .bind(key).first<CabinetIntentRow>();
    if (!inserted) throw new CabinetError('too-many-challenges', 429);
    if (inserted.request_hash !== requestHash || inserted.config_hash !== config.hash || inserted.agent_id !== identity.agentId) {
      throw new CabinetError('idempotency-key-conflict', 409);
    }
    return challengeResponse(inserted, inserted.id === id ? 201 : 200);
  } catch (error) {
    return fail(error);
  }
}

async function reconcile(db: D1Database, row: CabinetIntentRow, chain: Pick<CabinetChain, 'status'>, options: CabinetHandlerOptions): Promise<CabinetIntentRow> {
  if (!row.operation_hash || row.delivery_status === 'confirmed' || row.delivery_status === 'failed') return row;
  let status: 'pending' | 'confirmed' | 'failed';
  try {
    status = await chain.status(row);
  } catch {
    return row;
  }
  if (status === 'pending') return row;
  const timestamp = now(options);
  await db.batch([
    db.prepare(`
      UPDATE agent_cabinet_intents
      SET delivery_status = ?, confirmed_at = ?, last_error = ?, updated_at = ?, version = version + 1
      WHERE id = ? AND operation_hash = ? AND delivery_status IN ('signed','submitted')
    `).bind(status, status === 'confirmed' ? timestamp : null, status === 'failed' ? 'on-chain-operation-failed' : null, timestamp, row.id, row.operation_hash),
    db.prepare(`
      DELETE FROM tezos_sponsor_locks
      WHERE sponsor = ? AND owner_kind = 'agent-cabinet' AND owner_id = ?
        AND EXISTS (SELECT 1 FROM agent_cabinet_intents WHERE id = ? AND delivery_status IN ('confirmed','failed'))
    `).bind(row.sponsor, row.id, row.id),
  ]);
  return (await getIntent(db, row.id))!;
}

async function acquireSponsor(db: D1Database, row: CabinetIntentRow, chain: CabinetChain, options: CabinetHandlerOptions): Promise<boolean> {
  const acquire = () => db.prepare(`
    INSERT OR IGNORE INTO tezos_sponsor_locks(sponsor, owner_kind, owner_id, acquired_at)
    VALUES (?, 'agent-cabinet', ?, ?) RETURNING owner_id
  `).bind(row.sponsor, row.id, now(options)).first<{ owner_id: string }>();
  let lock = await acquire();
  if (lock) return true;
  const holder = await db.prepare('SELECT owner_kind, owner_id FROM tezos_sponsor_locks WHERE sponsor = ?')
    .bind(row.sponsor).first<{ owner_kind: string; owner_id: string }>();
  if (holder?.owner_kind === 'agent-cabinet' && holder.owner_id === row.id) return true;
  if (holder?.owner_kind === 'agent-cabinet') {
    const held = await getIntent(db, holder.owner_id);
    if (held?.operation_hash) await reconcile(db, held, chain, options);
  } else if (holder?.owner_kind === 'other-worlds') {
    const held = await db.prepare('SELECT * FROM other_worlds_claims WHERE id=?')
      .bind(holder.owner_id).first<OtherWorldsClaimRow>();
    if (held?.operation_hash && (held.status === 'signed' || held.status === 'submitted')) {
      let state: 'pending' | 'confirmed' | 'failed' = 'pending';
      try { state = await (options.otherWorldsStatus || otherWorldsClaimStatus)(held); } catch { state = 'pending'; }
      if (state !== 'pending') {
        await db.batch([
          db.prepare(`
            UPDATE other_worlds_claims SET status=?,confirmed_at=?,updated_at=?,last_error=?
            WHERE id=? AND operation_hash=? AND status IN ('signed','submitted')
          `).bind(state, state === 'confirmed' ? now(options) : null, now(options),
            state === 'failed' ? 'on-chain-operation-failed' : null, held.id, held.operation_hash),
          db.prepare(`
            DELETE FROM tezos_sponsor_locks
            WHERE sponsor=? AND owner_kind='other-worlds' AND owner_id=?
              AND EXISTS(SELECT 1 FROM other_worlds_claims WHERE id=? AND status IN ('confirmed','failed'))
          `).bind(row.sponsor, held.id, held.id),
        ]);
      }
    }
  }
  lock = await acquire();
  return Boolean(lock);
}

async function advanceDelivery(env: AgentCabinetEnv, config: CabinetConfig, initial: CabinetIntentRow, options: CabinetHandlerOptions): Promise<CabinetIntentRow> {
  const db = env.AUTH_DB!;
  if (initial.payment_status !== 'settled') return initial;
  const chain = await adapter(env, config, options);
  let row = await reconcile(db, initial, chain, options);
  if (row.delivery_status === 'confirmed' || row.delivery_status === 'failed') return row;

  // prepare() is contractually non-broadcasting.  Only a stale preparation
  // with no durable bytes/hash may be safely retried under the same lock.
  if (row.delivery_status === 'preparing' && !row.signed_bytes && !row.operation_hash && row.updated_at < now(options) - 120_000) {
    await db.prepare(`
      UPDATE agent_cabinet_intents SET delivery_status='reserved', last_error='stale-preparation-recovered', updated_at=?, version=version+1
      WHERE id=? AND delivery_status='preparing' AND signed_bytes IS NULL AND operation_hash IS NULL AND updated_at=?
    `).bind(now(options), row.id, row.updated_at).run();
    row = (await getIntent(db, row.id))!;
  }
  if (row.delivery_status === 'preparing') return row;

  if (row.delivery_status === 'reserved') {
    if (!await acquireSponsor(db, row, chain, options)) return row;
    const preparing = await db.prepare(`
      UPDATE agent_cabinet_intents SET delivery_status='preparing', last_error=NULL, updated_at=?, version=version+1
      WHERE id=? AND delivery_status='reserved' AND payment_status='settled' AND config_hash=? RETURNING id
    `).bind(now(options), row.id, config.hash).first();
    if (!preparing) return (await getIntent(db, row.id))!;
    row = (await getIntent(db, row.id))!;
    try {
      const spent = await db.prepare('SELECT COALESCE(SUM(maximum_cost_mutez),0) AS used FROM agent_cabinet_intents')
        .first<{ used: number }>();
      const used = Number(spent?.used || 0);
      const otherReserved = Math.max(0, used - row.maximum_cost_mutez);
      const signed = await chain.prepare(row, config.totalBudgetMutez - otherReserved);
      if (!/^[a-f0-9]+$/u.test(signed.bytes) || encodeOpHash(signed.bytes) !== signed.hash
        || !/^o[1-9A-HJ-NP-Za-km-z]{50}$/u.test(signed.hash)
        || !Number.isSafeInteger(signed.maximumCostMutez) || signed.maximumCostMutez <= 0
        || signed.maximumCostMutez > config.maxOperationMutez
        || otherReserved + signed.maximumCostMutez > config.totalBudgetMutez) {
        throw new CabinetError('sponsor-budget-limit', 503);
      }
      const persisted = await db.prepare(`
        UPDATE agent_cabinet_intents
        SET delivery_status='signed', signed_bytes=?, operation_hash=?, maximum_cost_mutez=?, last_error=NULL, updated_at=?, version=version+1
        WHERE id=? AND delivery_status='preparing' AND version=?
          AND ? + (SELECT COALESCE(SUM(maximum_cost_mutez),0) FROM agent_cabinet_intents WHERE id<>?) <= ?
        RETURNING id
      `).bind(signed.bytes, signed.hash, signed.maximumCostMutez, now(options), row.id, row.version,
        signed.maximumCostMutez, row.id, config.totalBudgetMutez).first();
      // A persistence failure retains the signer lock and never broadcasts.
      if (!persisted) throw new CabinetError('signed-operation-not-persisted', 503);
      row = (await getIntent(db, row.id))!;
    } catch (error) {
      if (error instanceof CabinetError && error.reason === 'signed-operation-not-persisted') throw error;
      // A D1 response can fail after the signed-row write committed. Roll back
      // only a row that still proves no signed bytes/hash were persisted, and
      // release the counter lock only after that exact rollback is visible.
      await db.batch([
        db.prepare(`
          UPDATE agent_cabinet_intents SET delivery_status='reserved', last_error=?, updated_at=?, version=version+1
          WHERE id=? AND delivery_status='preparing' AND signed_bytes IS NULL AND operation_hash IS NULL
        `).bind(error instanceof CabinetError ? error.reason : 'sponsor-preparation-unavailable', now(options), row.id),
        db.prepare(`
          DELETE FROM tezos_sponsor_locks
          WHERE sponsor=? AND owner_kind='agent-cabinet' AND owner_id=?
            AND EXISTS (
              SELECT 1 FROM agent_cabinet_intents
              WHERE id=? AND delivery_status='reserved' AND signed_bytes IS NULL AND operation_hash IS NULL
            )
        `).bind(row.sponsor, row.id, row.id),
      ]);
      return (await getIntent(db, row.id))!;
    }
  }

  if (row.delivery_status === 'signed' && row.signed_bytes && row.operation_hash && row.last_error !== 'broadcast-uncertain') {
    try {
      const hash = await chain.broadcast(row.signed_bytes);
      if (hash !== row.operation_hash) throw new Error('broadcast-hash-mismatch');
      await db.prepare(`
        UPDATE agent_cabinet_intents SET delivery_status='submitted', last_error=NULL, updated_at=?, version=version+1
        WHERE id=? AND delivery_status='signed' AND signed_bytes=? AND operation_hash=?
      `).bind(now(options), row.id, row.signed_bytes, row.operation_hash).run();
    } catch {
      // Never automatically re-sign or repeatedly inject after an uncertain
      // outcome. Status reconciliation is the only next automatic action.
      await db.prepare(`
        UPDATE agent_cabinet_intents SET last_error='broadcast-uncertain', updated_at=?, version=version+1
        WHERE id=? AND delivery_status='signed'
      `).bind(now(options), row.id).run();
    }
    row = (await getIntent(db, row.id))!;
  }
  return reconcile(db, row, chain, options);
}

function attached(response: Response, row: CabinetIntentRow): Response {
  const headers = new Headers(response.headers);
  headers.set('x-cabinet-intent-id', row.id);
  headers.set('location', `/api/agent-cabinet/status?id=${row.id}`);
  headers.set('access-control-allow-origin', '*');
  const expose = new Set([...(headers.get('access-control-expose-headers')?.split(/,\s*/u) || []), 'X-Cabinet-Intent-Id', 'Location']);
  headers.set('access-control-expose-headers', [...expose].join(', '));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function progressHeaders(intent: ReturnType<typeof publicIntent>, source?: Headers): Headers {
  const headers = new Headers(source);
  if (intent.next?.action === 'resume-delivery' || intent.next?.action === 'poll-status') {
    headers.set('retry-after', String(intent.next.retryAfterSeconds));
  }
  return headers;
}

function sameEvmAddress(a: unknown, b: unknown): boolean {
  return typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();
}

async function persistSettlementObservation(
  db: D1Database,
  row: CabinetIntentRow,
  authorizationHash: string,
  authorizationPayer: string,
  observation: X402SettlementObservation,
  options: CabinetHandlerOptions,
): Promise<void> {
  if (observation.schema !== 'pointcast.x402-settlement-observation/v1'
    || (observation.outcome !== 'settled' && observation.outcome !== 'pending')
    || observation.network !== row.payment_network
    || observation.amount !== String(row.price_units)
    || !/^0x[0-9a-f]{64}$/u.test(observation.transaction)
    || !/^0x[0-9a-f]{40}$/u.test(observation.payer)
    || observation.payer !== authorizationPayer
    || !Number.isSafeInteger(observation.facilitatorStatus)
    || observation.facilitatorStatus < 100 || observation.facilitatorStatus > 599
    || (observation.outcome === 'pending'
      ? observation.errorReason !== 'settlement_pending'
      : observation.errorReason !== null)) {
    throw new CabinetError('settlement-observation-invalid', 503);
  }
  // Pick only the bounded protocol fields. A caller-controlled/custom gate can
  // never smuggle an unbounded object into the reconciliation journal.
  const canonicalObservation: X402SettlementObservation = {
    schema: 'pointcast.x402-settlement-observation/v1',
    outcome: observation.outcome,
    transaction: observation.transaction,
    network: observation.network,
    payer: observation.payer,
    amount: observation.amount,
    errorReason: observation.errorReason,
    facilitatorStatus: observation.facilitatorStatus,
  };
  const evidence = JSON.stringify({
    schema: 'pointcast.agent-cabinet-settlement-observation/v1',
    authorizationHash,
    requestHash: row.collect_request_hash,
    resourceId: row.id,
    observation: canonicalObservation,
    recordedAt: new Date(now(options)).toISOString(),
  });
  if (evidence.length > 4096) throw new CabinetError('settlement-observation-invalid', 503);
  try {
    const persisted = await db.prepare(`
      UPDATE agent_cabinet_intents
      SET payment_evidence_json=?, last_error='settlement-observed', updated_at=?, version=version+1
      WHERE id=? AND payment_status='settling' AND delivery_status='reserved' AND payment_authorization_hash=?
      RETURNING id
    `).bind(evidence, now(options), row.id, authorizationHash).first();
    if (!persisted) {
      const concurrent = await getIntent(db, row.id);
      if (!concurrent || (concurrent.payment_status !== 'settled'
        && concurrent.payment_evidence_json !== evidence)) {
        throw new CabinetError('settlement-observation-not-persisted', 503);
      }
    }
  } catch (error) {
    const concurrent = await getIntent(db, row.id);
    if (!concurrent || (concurrent.payment_status !== 'settled'
      && concurrent.payment_evidence_json !== evidence)) {
      if (error instanceof CabinetError) throw error;
      throw new CabinetError('settlement-observation-not-persisted', 503, {
        transactionHash: observation.transaction,
        network: observation.network,
        statusUrl: `/api/agent-cabinet/status?id=${row.id}`,
      });
    }
  }
}

async function recoveryProof(row: CabinetIntentRow): Promise<CabinetSettlementProof | null> {
  if (!row.payment_evidence_json || !row.payment_authorization_hash) return null;
  try {
    const evidence = JSON.parse(row.payment_evidence_json) as Record<string, unknown>;
    const receipt = evidence.receipt as Record<string, unknown>;
    if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)
      || evidence.schema !== 'pointcast.agent-cabinet-settlement-evidence/v1'
      || evidence.authorizationHash !== row.payment_authorization_hash
      || receipt.action !== 'cabinet_collect'
      || receipt.resource_id !== row.id
      || receipt.request_hash !== row.collect_request_hash) return null;
    const settlement = receipt.settlement as Record<string, unknown>;
    if (!settlement || typeof settlement !== 'object' || Array.isArray(settlement)
      || settlement.network !== row.payment_network
      || !sameEvmAddress(settlement.asset, row.payment_asset)
      || !sameEvmAddress(settlement.pay_to, row.payment_pay_to)
      || String(settlement.amount_units ?? '') !== String(row.price_units)
      || !sameEvmAddress(settlement.payer, evidence.payer)) return null;
    const transactionHash = x402TransactionHash(receipt);
    const receiptHash = await hashReceipt(receipt);
    if (!transactionHash || transactionHash !== evidence.transactionHash
      || receiptHash !== evidence.receiptHash
      || typeof evidence.payer !== 'string' || !/^0x[0-9a-fA-F]{40}$/u.test(evidence.payer)) return null;
    return { receipt, receiptHash, payer: evidence.payer };
  } catch {
    return null;
  }
}

async function persistSettlement(
  db: D1Database,
  row: CabinetIntentRow,
  authorizationHash: string,
  proof: CabinetSettlementProof,
  options: CabinetHandlerOptions,
): Promise<CabinetIntentRow> {
  const transactionHash = x402TransactionHash(proof.receipt);
  if (!transactionHash || !/^0x[0-9a-fA-F]{40}$/u.test(proof.payer)
    || await hashReceipt(proof.receipt) !== proof.receiptHash) {
    throw new CabinetError('settlement-receipt-invalid', 503);
  }
  const evidence = JSON.stringify({
    schema: 'pointcast.agent-cabinet-settlement-evidence/v1',
    authorizationHash,
    transactionHash,
    receiptHash: proof.receiptHash,
    payer: proof.payer,
    receipt: proof.receipt,
    recordedAt: new Date(now(options)).toISOString(),
  });
  try {
    const staged = await db.prepare(`
      UPDATE agent_cabinet_intents
      SET payment_evidence_json=?, last_error='settlement-proof-staged', updated_at=?, version=version+1
      WHERE id=? AND payment_status='settling' AND delivery_status='reserved' AND payment_authorization_hash=?
      RETURNING id
    `).bind(evidence, now(options), row.id, authorizationHash).first();
    if (!staged) {
      const concurrent = await getIntent(db, row.id);
      if (!concurrent || (concurrent.payment_status !== 'settled'
        && concurrent.payment_evidence_json !== evidence)) throw new CabinetError('settlement-proof-not-persisted', 503);
    }
  } catch (error) {
    const concurrent = await getIntent(db, row.id);
    if (!concurrent || (concurrent.payment_status !== 'settled'
      && concurrent.payment_evidence_json !== evidence)) {
      if (error instanceof CabinetError) throw error;
      throw new CabinetError('settlement-proof-not-persisted', 503, {
        transactionHash,
        receipt: proof.receipt,
        statusUrl: `/api/agent-cabinet/status?id=${row.id}`,
      });
    }
  }
  try {
    await db.prepare(`
      UPDATE agent_cabinet_intents
      SET payment_status='settled', payment_tx_hash=?, payment_receipt_hash=?, payment_receipt_json=?,
          payment_reconciled_at=?, payer=?, last_error=NULL, updated_at=?, version=version+1
      WHERE id=? AND payment_status='settling' AND delivery_status='reserved' AND payment_authorization_hash=?
    `).bind(transactionHash, proof.receiptHash, JSON.stringify(proof.receipt), now(options), proof.payer,
      now(options), row.id, authorizationHash).run();
  } catch {
    // Reload below. A response can be lost after this exact write commits.
  }
  const settled = await getIntent(db, row.id);
  if (!settled || settled.payment_status !== 'settled' || settled.payment_tx_hash !== transactionHash
    || settled.payment_receipt_hash !== proof.receiptHash) {
    throw new CabinetError('settlement-persistence-uncertain', 503, {
      transactionHash,
      receipt: proof.receipt,
      statusUrl: `/api/agent-cabinet/status?id=${row.id}`,
    });
  }
  return settled;
}

async function recoverStagedSettlement(
  db: D1Database,
  row: CabinetIntentRow,
  options: CabinetHandlerOptions,
): Promise<CabinetIntentRow> {
  const proof = await recoveryProof(row);
  if (!proof || !row.payment_authorization_hash) return row;
  return persistSettlement(db, row, row.payment_authorization_hash, proof, options);
}

export async function handleCabinetCollect(request: Request, env: AgentCabinetEnv, options: CabinetHandlerOptions = {}): Promise<Response> {
  let currentId: string | undefined;
  try {
    if (!env.AUTH_DB) throw new CabinetError('collection-storage-unavailable', 503);
    const input = await readBody(request);
    inputKeys(input, ['offer', 'recipient', 'challengeId', 'publicKey', 'signature']);
    const slug = offerSlug(input.offer);
    const address = recipient(input.recipient);
    if (typeof input.challengeId !== 'string' || !/^acc_[0-9a-f]{32}$/u.test(input.challengeId)) throw new CabinetError('invalid-challenge');
    const key = idempotencyKey(request);
    const row = await getIntentByChallenge(env.AUTH_DB, input.challengeId);
    if (!row) throw new CabinetError('challenge-not-found', 404);
    currentId = row.id;
    if (row.idempotency_key !== key || row.offer_slug !== slug || row.recipient !== address) throw new CabinetError('challenge-mismatch', 401);
    const collectHash = await hashAgentActionRequest('agent-cabinet:collect', {
      offer: slug, recipient: address, challengeId: input.challengeId, publicKey: input.publicKey, signature: input.signature,
    });
    // pci_ is attribution, not delivery authority. Require the same active
    // caller through payment settlement, but do not strand an already-paid,
    // wallet-approved transfer if that optional key later expires or revokes.
    if (row.payment_status !== 'settled') {
      const identity = await verifyAgentRequest(env.AUTH_DB, request, collectHash, 'cabinet:collect', new Date(now(options)));
      if (identity.response) return attached(identity.response, row);
      if (identity.agentId !== row.agent_id) throw new CabinetError('agent-identity-conflict', 403);
    }
    const proofHash = await verifyWalletProof(input.publicKey, input.signature, row);
    if (row.proof_hash && (row.proof_hash !== proofHash || row.proof_public_key !== input.publicKey
      || row.collect_request_hash !== collectHash)) {
      throw new CabinetError('wallet-proof-conflict', 409);
    }
    if (!row.proof_hash) {
      if (now(options) >= row.challenge_expires_at) {
        await env.AUTH_DB.prepare(`UPDATE agent_cabinet_intents SET approval_status='expired',updated_at=?,version=version+1 WHERE id=? AND approval_status='pending'`)
          .bind(now(options), row.id).run();
        throw new CabinetError('challenge-expired', 401);
      }
      const approved = await env.AUTH_DB.prepare(`
        UPDATE agent_cabinet_intents
        SET approval_status='verified', collect_request_hash=?, proof_hash=?, proof_public_key=?, updated_at=?, version=version+1
        WHERE id=? AND approval_status='pending' AND proof_hash IS NULL AND challenge_expires_at>?
        RETURNING id
      `).bind(collectHash, proofHash, input.publicKey, now(options), row.id, now(options)).first();
      if (!approved) {
        const concurrent = await getIntent(env.AUTH_DB, row.id);
        if (!concurrent || concurrent.collect_request_hash !== collectHash
          || concurrent.proof_hash !== proofHash || concurrent.proof_public_key !== input.publicKey) {
          throw new CabinetError('approval-conflict', 409);
        }
      }
    }
    let live = (await getIntent(env.AUTH_DB, row.id))!;
    if (live.payment_status === 'settling' || live.payment_status === 'ambiguous') {
      live = await recoverStagedSettlement(env.AUTH_DB, live, options);
    }
    if (live.payment_status === 'settled'
      && (live.delivery_status === 'confirmed' || live.delivery_status === 'failed')) {
      const intent = publicIntent(live, now(options));
      return json({ ok: true, intent }, live.delivery_status === 'confirmed' ? 200 : 202, live.id, progressHeaders(intent));
    }
    if (live.payment_status === 'settling' || live.payment_status === 'ambiguous') {
      return json({ ok: false, error: 'payment-outcome-ambiguous', intent: publicIntent(live, now(options)) }, 202, live.id);
    }
    const config = live.payment_status === 'settled'
      ? await settledDeliveryConfiguration(env, live)
      : await configured(env, options);
    if (live.payment_status !== 'settled') {
      if (live.config_hash !== config.hash
        || !config.items.some((item) => item.slug === live.offer_slug && item.revision === live.offer_revision)) {
        throw new CabinetError('publication-configuration-changed', 503);
      }
      if (!paymentTermsStillPinned(env, live)) throw new CabinetError('payment-configuration-changed', 503);
    }
    if ((live.payment_status === 'required' || live.payment_status === 'refused')
      && now(options) >= live.challenge_expires_at) {
      await env.AUTH_DB.prepare(`
        UPDATE agent_cabinet_intents
        SET approval_status='expired', updated_at=?, version=version+1
        WHERE id=? AND payment_status IN ('required','refused') AND delivery_status='blocked'
      `).bind(now(options), live.id).run();
      throw new CabinetError('challenge-expired', 401);
    }
    if (live.payment_status === 'required' || live.payment_status === 'refused') {
      // A five-minute wallet challenge outlives the short readiness cache. Do a
      // fresh chain/inventory/artifact audit and a recipient-specific unsigned
      // transfer estimate before both quoting and settling.
      await readiness(env, config, options, true);
      await deliveryPreflight(env, config, live, options);
    }
    if (live.payment_status === 'settled') {
      live = await advanceDelivery(env, config, live, options);
      const intent = publicIntent(live, now(options));
      return json({ ok: true, intent }, live.delivery_status === 'confirmed' ? 200 : 202, live.id, progressHeaders(intent));
    }

    const gate = options.paymentGate || withX402;
    const paymentHeader = request.headers.get('payment-signature');
    const authorizationHash = paymentHeader ? await x402AuthorizationHash(paymentHeader) : null;
    const authorizationSummary = paymentHeader ? x402AuthorizationSummary(paymentHeader) : null;
    // This identifies the current server invocation, not the payer's reusable
    // Permit2 authorization. Concurrent retries can carry the same signature;
    // only the invocation which acquired this exact reservation may undo it.
    const paymentAttemptId = paymentHeader ? crypto.randomUUID() : null;
    const gateResult: X402GateResult = await gate(request, env, {
      action: 'cabinet_collect',
      priceUnits: String(live.price_units),
      maker: 'PointCast',
      resourceDescription: `Collect ${live.offer_slug} from the PointCast Agent Cabinet; Tezos delivery is a separately reconciled step.`,
      merchantUrl: `https://pointcast.xyz/x402/collect#${live.offer_slug}`,
      context: `Payment for immutable Agent Cabinet intent ${live.id}. Tezos wallet approval and FA2 delivery are separate proofs.`,
      requestHash: live.collect_request_hash || collectHash,
      resourceId: live.id,
      agentId: live.agent_id,
      beforeSettlement: paymentHeader ? async () => {
        if (!authorizationHash || !authorizationSummary) {
          throw new X402PreSettlementError(400, { error: 'invalid-payment-authorization' });
        }
        const settlementStartedAt = now(options);
        if (settlementStartedAt >= live.challenge_expires_at) {
          throw new X402PreSettlementError(401, { error: 'challenge-expired' });
        }
        let result: { id: string } | null;
        try {
          result = await env.AUTH_DB!.prepare(`
            UPDATE agent_cabinet_intents
            SET payment_status='settling', delivery_status='reserved', payment_authorization_hash=?, payment_attempt_id=?, payment_attempt_json=?,
                maximum_cost_mutez=?, last_error=NULL, updated_at=?, version=version+1
            WHERE id=? AND approval_status='verified' AND proof_hash=?
              AND payment_status IN ('required','refused') AND delivery_status='blocked'
              AND challenge_expires_at>?
              AND config_hash=?
              AND ? + (SELECT COALESCE(SUM(maximum_cost_mutez),0)
                       FROM agent_cabinet_intents WHERE id<>?) <= ?
              AND (SELECT COUNT(*) FROM agent_cabinet_intents
                   WHERE offer_slug=? AND config_hash=? AND delivery_status<>'blocked') < supply_cap
              AND NOT EXISTS (SELECT 1 FROM agent_cabinet_intents
                              WHERE offer_slug=? AND recipient=? AND delivery_status<>'blocked')
              AND NOT EXISTS (SELECT 1 FROM agent_cabinet_intents
                              WHERE payment_authorization_hash=? AND id<>?)
            RETURNING id
          `).bind(authorizationHash, paymentAttemptId, JSON.stringify({ ...authorizationSummary, authorizationHash, paymentAttemptId,
            observedAt: new Date(settlementStartedAt).toISOString() }),
            config.maxOperationMutez, settlementStartedAt, live.id, proofHash, settlementStartedAt, config.hash,
            config.maxOperationMutez, live.id, config.totalBudgetMutez,
            live.offer_slug, config.hash, live.offer_slug, live.recipient,
            authorizationHash, live.id).first<{ id: string }>();
        } catch (error) {
          const duplicate = await env.AUTH_DB!.prepare(`
            SELECT id FROM agent_cabinet_intents WHERE payment_authorization_hash=? AND id<>? LIMIT 1
          `).bind(authorizationHash, live.id).first<{ id: string }>();
          if (duplicate) throw new X402PreSettlementError(409, { error: 'payment-authorization-already-used' });
          throw error;
        }
        if (!result) {
          const duplicate = await env.AUTH_DB!.prepare(`
            SELECT id FROM agent_cabinet_intents WHERE payment_authorization_hash=? AND id<>? LIMIT 1
          `).bind(authorizationHash, live.id).first<{ id: string }>();
          if (duplicate) throw new X402PreSettlementError(409, { error: 'payment-authorization-already-used' });
          const budget = await env.AUTH_DB!.prepare(`
            SELECT COALESCE(SUM(maximum_cost_mutez),0) AS used
            FROM agent_cabinet_intents WHERE id<>?
          `).bind(live.id).first<{ used: number }>();
          if (Number(budget?.used || 0) + config.maxOperationMutez > config.totalBudgetMutez) {
            throw new X402PreSettlementError(503, { error: 'sponsor-budget-limit' });
          }
          throw new X402PreSettlementError(409, { error: 'edition-unavailable-or-already-collected' });
        }
      } : undefined,
      afterSettlementObserved: paymentHeader ? async (observation) => {
        const authorizationPayer = authorizationSummary?.owner;
        if (!authorizationHash || typeof authorizationPayer !== 'string'
          || !/^0x[0-9a-f]{40}$/u.test(authorizationPayer)) {
          throw new CabinetError('settlement-observation-invalid', 503);
        }
        await persistSettlementObservation(
          env.AUTH_DB!, live, authorizationHash, authorizationPayer, observation, options,
        );
      } : undefined,
    });
    if (!gateResult.settled && !gateResult.settlementProof) {
      // Do not rely on a local flag here: D1 can commit the reservation and
      // lose its response. Reloading makes the no-submission rollback
      // response-loss safe without ever relaxing an unknown facilitator call.
      const persisted = await getIntent(env.AUTH_DB, live.id);
      const ownsReservation = Boolean(authorizationHash
        && paymentAttemptId
        && persisted?.payment_status === 'settling'
        && persisted.delivery_status === 'reserved'
        && persisted.payment_authorization_hash === authorizationHash
        && persisted.payment_attempt_id === paymentAttemptId);
      if (ownsReservation) {
        if (x402PaymentWasNotSubmitted(gateResult.response)) {
          await env.AUTH_DB.prepare(`
            UPDATE agent_cabinet_intents
            SET payment_status='required', delivery_status='blocked', payment_authorization_hash=NULL, payment_attempt_id=NULL,
                maximum_cost_mutez=0, updated_at=?, version=version+1
            WHERE id=? AND payment_status='settling' AND delivery_status='reserved'
              AND payment_authorization_hash=? AND payment_attempt_id=?
          `).bind(now(options), live.id, authorizationHash, paymentAttemptId).run();
        } else {
          await env.AUTH_DB.prepare(`
            UPDATE agent_cabinet_intents SET payment_status='ambiguous', last_error='payment-outcome-ambiguous', updated_at=?, version=version+1
            WHERE id=? AND payment_status='settling' AND payment_authorization_hash=? AND payment_attempt_id=?
          `).bind(now(options), live.id, authorizationHash, paymentAttemptId).run();
          live = (await getIntent(env.AUTH_DB, live.id))!;
          return json({
            ok: false,
            error: 'payment-outcome-ambiguous',
            intent: publicIntent(live, now(options)),
            ...(gateResult.settlementObservation ? { settlementObservation: gateResult.settlementObservation } : {}),
          }, 202, live.id, gateResult.response.headers);
        }
      }
      return attached(gateResult.response, (await getIntent(env.AUTH_DB, live.id))!);
    }
    if (!authorizationHash) throw new CabinetError('settlement-receipt-invalid', 503);
    const proof = gateResult.settled ? gateResult : gateResult.settlementProof!;
    live = await persistSettlement(env.AUTH_DB, live, authorizationHash, proof, options);
    // Stop after durable payment settlement.  A replay of this exact collect
    // request advances Tezos delivery without asking for or submitting payment.
    const intent = publicIntent(live, now(options));
    return json({ ok: true, intent, receipt: proof.receipt }, 202, live.id, progressHeaders(intent, gateResult.response.headers));
  } catch (error) {
    return fail(error, currentId);
  }
}

export async function handleCabinetStatus(request: Request, env: AgentCabinetEnv, options: CabinetHandlerOptions = {}): Promise<Response> {
  try {
    if (!env.AUTH_DB) throw new CabinetError('collection-storage-unavailable', 503);
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || url.searchParams.get('challengeId');
    const config = await configuration(env, options.publicationRecord);
    if (!id) {
      if (!config) return json({ ok: true, enabled: false, phase: 'preview', reason: 'collection-not-enabled' }, 503);
      try {
        await readiness(env, config, options);
      } catch {
        return json({ ok: true, enabled: false, phase: 'unavailable', reason: 'readiness-check-failed' }, 503);
      }
      const counts = await env.AUTH_DB.prepare(`
        SELECT offer_slug, COUNT(*) AS collected FROM agent_cabinet_intents
        WHERE config_hash=? AND delivery_status<>'blocked' GROUP BY offer_slug
      `).bind(config.hash).all<{ offer_slug: string; collected: number }>();
      return json({
        ok: true,
        enabled: true,
        phase: 'open',
        offers: config.items.map((item) => ({
          offer: item.slug,
          supply: item.supplyCap,
          remaining: Math.max(0, item.supplyCap - Number(counts.results.find((row) => row.offer_slug === item.slug)?.collected || 0)),
        })),
      });
    }
    if (!/^(?:aci|acc)_[0-9a-f]{32}$/u.test(id)) throw new CabinetError('invalid-intent-id');
    let row = id.startsWith('acc_') ? await getIntentByChallenge(env.AUTH_DB, id) : await getIntent(env.AUTH_DB, id);
    if (!row) throw new CabinetError('intent-not-found', 404);
    if (row.payment_status === 'settling' || row.payment_status === 'ambiguous') {
      row = await recoverStagedSettlement(env.AUTH_DB, row, options);
    }
    // GET may independently verify an existing hash, but never prepares,
    // signs, injects, or submits a payment.
    if (row.operation_hash && row.delivery_status !== 'confirmed' && row.delivery_status !== 'failed') {
      row = await reconcile(env.AUTH_DB, row, options.statusChain || { status: cabinetIntentStatus }, options);
    }
    const intent = publicIntent(row, now(options));
    return json({ ok: true, intent }, 200, row.id, progressHeaders(intent));
  } catch (error) {
    return fail(error);
  }
}
