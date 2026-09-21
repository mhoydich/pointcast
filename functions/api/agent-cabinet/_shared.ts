import { getPkhfromPk, validateAddress, validateContractAddress, ValidationResult, verifySignature } from '@taquito/utils';
import provenanceDocument from '../../../src/data/agent-cabinet-provenance.json';
import preparedPublication from '../../../src/data/agent-cabinet-publication.json';
import { getCabinetOffer } from '../../../src/data/agent-cabinet';
import {
  AGENT_CABINET_COMMITTED_PUBLICATION,
  publicationMatchesCommitted,
} from '../../../src/lib/agent-cabinet-public-state';
import {
  X402_DEFAULT_ASSET,
  X402_DEFAULT_PAY_TO,
  X402_DEFAULT_PRICE_UNITS,
  X402_NETWORK,
  X402_PAYMENT_PROFILE,
  canonicalJson,
} from '../../../src/lib/x402';

export const CABINET_COLLECTION = 'the-agent-cabinet-2026';
export const CABINET_CHAIN_ID = 'NetXdQprcVkpaWU';
export const CABINET_AUDIENCE = 'https://pointcast.xyz/api/agent-cabinet/collect';
export const CABINET_CHALLENGE_TTL_MS = 5 * 60_000;

export interface AgentCabinetEnv extends Cloudflare.Env {
  AUTH_DB?: D1Database;
  VISITS?: KVNamespace;
  X402_PRICE_UNITS?: string;
  X402_ASSET?: string;
  X402_PAY_TO?: string;
  X402_FACILITATOR_URL?: string;
  X402_RECEIPT_SK?: string;
  X402_RECEIPT_AGENT_ID?: string;
  X402_MODE?: string;
  AGENT_CABINET_ENABLED?: string;
  AGENT_CABINET_MAINNET_APPROVED?: string;
  AGENT_CABINET_PUBLICATION_JSON?: string;
  AGENT_CABINET_SPONSOR_ADDRESS?: string;
  AGENT_CABINET_SPONSOR_SECRET_KEY?: string;
  AGENT_CABINET_RPC_URL?: string;
  AGENT_CABINET_MAX_OPERATION_MUTEZ?: string;
  AGENT_CABINET_TOTAL_BUDGET_MUTEZ?: string;
  AGENT_CABINET_PRICE_UNITS?: string;
  AGENT_CABINET_X402_PROFILE_APPROVED?: string;
}

export interface CabinetItem {
  slug: string;
  title: string;
  tokenId: string;
  supplyCap: number;
  artifactUri: string;
  artifactSha256: string;
  metadataUri: string;
  metadataSha256: string;
  revision: string;
}

export interface CabinetConfig {
  contract: string;
  sponsor: string;
  rpcUrl: string;
  publicationOperationHash: string;
  publicationLevel: number;
  priceUnits: string;
  paymentNetwork: string;
  paymentAsset: string;
  paymentPayTo: string;
  maxOperationMutez: number;
  totalBudgetMutez: number;
  items: CabinetItem[];
  hash: string;
}

export type ApprovalStatus = 'pending' | 'verified' | 'expired';
export type PaymentStatus = 'required' | 'settling' | 'ambiguous' | 'refused' | 'settled';
export type DeliveryStatus = 'blocked' | 'reserved' | 'preparing' | 'signed' | 'submitted' | 'confirmed' | 'failed';

export interface CabinetIntentRow {
  id: string;
  challenge_id: string;
  idempotency_key: string;
  request_hash: string;
  agent_id: string | null;
  offer_slug: string;
  offer_revision: string;
  config_hash: string;
  recipient: string;
  contract: string;
  token_id: string;
  sponsor: string;
  quantity: number;
  supply_cap: number;
  artifact_uri: string;
  artifact_sha256: string;
  metadata_uri: string;
  metadata_sha256: string;
  price_units: number;
  payment_network: string;
  payment_asset: string;
  payment_pay_to: string;
  challenge_nonce: string;
  challenge_message: string;
  challenge_payload: string;
  challenge_expires_at: number;
  approval_status: ApprovalStatus;
  collect_request_hash: string | null;
  proof_hash: string | null;
  proof_public_key: string | null;
  payment_status: PaymentStatus;
  payment_authorization_hash: string | null;
  payment_attempt_id: string | null;
  payment_attempt_json: string | null;
  payment_evidence_json: string | null;
  payment_reconciled_at: number | null;
  payment_tx_hash: string | null;
  payment_receipt_hash: string | null;
  payment_receipt_json: string | null;
  payer: string | null;
  delivery_status: DeliveryStatus;
  signed_bytes: string | null;
  operation_hash: string | null;
  maximum_cost_mutez: number;
  confirmed_at: number | null;
  last_error: string | null;
  version: number;
  created_at: number;
  updated_at: number;
}

export class CabinetError extends Error {
  constructor(public reason: string, public status = 400, public details?: Record<string, unknown>) {
    super(reason);
  }
}

export const CABINET_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type, Idempotency-Key, Payment-Signature, PointCast-Agent-Id, PointCast-Agent-Timestamp, PointCast-Agent-Signature',
  'access-control-expose-headers': 'Payment-Required, Payment-Response, X-Payment-Response, X-Facilitator-Url, X-Cabinet-Intent-Id, Location, Retry-After',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

export function cabinetHeaders(intentId?: string, source?: Headers): Headers {
  const headers = new Headers(CABINET_HEADERS);
  source?.forEach((value, key) => headers.set(key, value));
  const exposed = new Set([
    ...CABINET_HEADERS['access-control-expose-headers'].split(', '),
    ...(source?.get('access-control-expose-headers')?.split(/,\s*/u) || []),
  ]);
  headers.set('access-control-expose-headers', [...exposed].join(', '));
  if (intentId) {
    headers.set('x-cabinet-intent-id', intentId);
    headers.set('location', `/api/agent-cabinet/status?id=${encodeURIComponent(intentId)}`);
  }
  return headers;
}

export function json(value: unknown, status = 200, intentId?: string, source?: Headers): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: cabinetHeaders(intentId, source) });
}

export function fail(error: unknown, intentId?: string): Response {
  if (error instanceof CabinetError) {
    return json({ ok: false, error: error.reason, ...(error.details || {}) }, error.status, intentId);
  }
  console.error('[agent-cabinet]', error);
  return json({ ok: false, error: 'temporarily-unavailable' }, 503, intentId);
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new CabinetError('json-required', 415);
  if (!request.body) throw new CabinetError('body-required');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let value = '';
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    size += chunk.byteLength;
    if (size > 8192) {
      await reader.cancel();
      throw new CabinetError('body-too-large', 413);
    }
    value += decoder.decode(chunk, { stream: true });
  }
  try {
    const parsed: unknown = JSON.parse(value + decoder.decode());
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    throw new CabinetError('invalid-json');
  }
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function michelinePayload(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `0501${bytes.byteLength.toString(16).padStart(8, '0')}${hex}`;
}

export function recipient(value: unknown): string {
  if (typeof value !== 'string' || validateAddress(value) !== ValidationResult.VALID || !/^tz[1-4]/u.test(value)) {
    throw new CabinetError('invalid-recipient');
  }
  return value;
}

export function offerSlug(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value) || value.length > 80) {
    throw new CabinetError('invalid-offer');
  }
  return value;
}

/** Current-sale validation. Never use this to reconstruct an owed delivery. */
export function currentOfferSlug(value: unknown): string {
  const slug = offerSlug(value);
  if (!getCabinetOffer(slug)) throw new CabinetError('offer-not-found', 404);
  return slug;
}

export function idempotencyKey(request: Request): string {
  const value = request.headers.get('idempotency-key')?.trim() || '';
  if (!/^[A-Za-z0-9._:-]{8,128}$/u.test(value)) throw new CabinetError('idempotency-key-required');
  return value;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object-required');
  return value as Record<string, unknown>;
}

function positiveInteger(value: unknown, maximum: number): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1 || result > maximum) throw new Error('invalid-positive-integer');
  return result;
}

function hash64(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/u.test(value)) throw new Error('invalid-hash');
  return value;
}

function safeUri(value: unknown, artifact = false): string {
  if (typeof value !== 'string' || !(artifact ? /^(?:https|ipfs):\/\//u : /^https:\/\//u).test(value)) throw new Error('invalid-uri');
  return value;
}

/**
 * Runtime enablement requires two explicit environment gates and a publication
 * record independently changed from the checked-in prepared-only manifest to a
 * confirmed mint.  The sponsor secret is never read by readiness or status.
 */
export async function configuration(
  env: AgentCabinetEnv,
  committedPublication: unknown = AGENT_CABINET_COMMITTED_PUBLICATION,
): Promise<CabinetConfig | null> {
  if (env.AGENT_CABINET_ENABLED !== 'true' || env.AGENT_CABINET_MAINNET_APPROVED !== 'true'
    || env.AGENT_CABINET_X402_PROFILE_APPROVED !== X402_PAYMENT_PROFILE || !env.AUTH_DB) return null;
  try {
    const publication = record(JSON.parse(env.AGENT_CABINET_PUBLICATION_JSON || JSON.stringify(committedPublication)));
    if (!publicationMatchesCommitted(publication, committedPublication)) return null;
    const prepared = record(preparedPublication);
    if (publication.status !== 'minted' || publication.network !== 'mainnet' || publication.chainId !== CABINET_CHAIN_ID
      || publication.mainnetApproved !== true || publication.requestable !== true
      || typeof publication.operationHash !== 'string' || !/^o[1-9A-HJ-NP-Za-km-z]{50}$/u.test(publication.operationHash)) return null;
    const publicationLevel = positiveInteger(publication.level, Number.MAX_SAFE_INTEGER);
    // The residents are associations, not asserted authors.  Authority comes
    // from the administrator's separately approved mint publication.
    const publisherAuthorization = record(publication.publisherAuthorization);
    if (publisherAuthorization.status !== 'approved'
      || publisherAuthorization.administrator !== prepared.administrator
      || publisherAuthorization.operationHash !== publication.operationHash) return null;
    if (canonicalJson(publication.creatorAuthorization) !== canonicalJson(prepared.creatorAuthorization)) return null;
    const contract = String(publication.contract || '');
    if (validateContractAddress(contract) !== ValidationResult.VALID || contract !== prepared.contract
      || publication.administrator !== prepared.administrator
      || publication.inventoryRecipient !== prepared.inventoryRecipient
      || publication.editionSupply !== prepared.editionSupply
      || publication.editionsPerObject !== prepared.editionsPerObject) return null;
    const sponsor = recipient(env.AGENT_CABINET_SPONSOR_ADDRESS || publication.inventoryRecipient);
    if (sponsor !== publication.inventoryRecipient || !env.AGENT_CABINET_SPONSOR_SECRET_KEY) return null;
    const rpc = new URL(env.AGENT_CABINET_RPC_URL || '');
    if (rpc.protocol !== 'https:' || rpc.username || rpc.password) return null;
    const maxOperationMutez = positiveInteger(env.AGENT_CABINET_MAX_OPERATION_MUTEZ, 100_000);
    const totalBudgetMutez = positiveInteger(env.AGENT_CABINET_TOTAL_BUDGET_MUTEZ, 25_000_000);
    if (totalBudgetMutez < maxOperationMutez) return null;
    const priceUnits = env.AGENT_CABINET_PRICE_UNITS || env.X402_PRICE_UNITS || X402_DEFAULT_PRICE_UNITS;
    if (priceUnits !== X402_DEFAULT_PRICE_UNITS) return null;
    const paymentAsset = env.X402_ASSET || X402_DEFAULT_ASSET;
    const paymentPayTo = env.X402_PAY_TO || X402_DEFAULT_PAY_TO;
    if (paymentAsset.toLowerCase() !== X402_DEFAULT_ASSET.toLowerCase()
      || paymentPayTo.toLowerCase() !== X402_DEFAULT_PAY_TO.toLowerCase()) return null;
    const tokenMap = record(publication.tokenMap);
    if (canonicalJson(tokenMap) !== canonicalJson(prepared.tokenMap)) return null;
    const provenance = record(provenanceDocument);
    const rawItems = provenance.items;
    if (!Array.isArray(rawItems) || rawItems.length < 1) return null;
    const items: CabinetItem[] = [];
    for (const raw of rawItems) {
      const item = record(raw);
      const slug = currentOfferSlug(item.slug);
      const catalogOffer = getCabinetOffer(slug);
      if (!catalogOffer || catalogOffer.payment.network !== X402_NETWORK
        || catalogOffer.payment.amount.units !== X402_DEFAULT_PRICE_UNITS
        || catalogOffer.payment.asset.address.toLowerCase() !== X402_DEFAULT_ASSET.toLowerCase()
        || catalogOffer.payment.payTo.toLowerCase() !== X402_DEFAULT_PAY_TO.toLowerCase()) return null;
      const tokenId = String(tokenMap[slug] ?? '');
      if (!/^(?:0|[1-9][0-9]{0,18})$/u.test(tokenId)) return null;
      const base = {
        slug,
        title: String(item.title || ''),
        tokenId,
        supplyCap: positiveInteger(item.editions, 10_000),
        artifactUri: safeUri(item.artifactUri, true),
        artifactSha256: hash64(item.artifactSha256),
        metadataUri: safeUri(item.metadataUri),
        metadataSha256: hash64(item.metadataSha256),
      };
      items.push({ ...base, revision: await sha256(canonicalJson(base)) });
    }
    if (new Set(items.map((item) => item.slug)).size !== items.length || new Set(items.map((item) => item.tokenId)).size !== items.length) return null;
    const base = {
      collection: CABINET_COLLECTION,
      chainId: CABINET_CHAIN_ID,
      contract,
      sponsor,
      rpcUrl: rpc.href,
      publicationOperationHash: publication.operationHash,
      publicationLevel,
      priceUnits,
      paymentNetwork: X402_NETWORK,
      paymentAsset,
      paymentPayTo,
      maxOperationMutez,
      totalBudgetMutez,
      items,
    };
    return { ...base, hash: await sha256(canonicalJson(base)) };
  } catch {
    return null;
  }
}

/**
 * Rebuild only the operational pieces needed to honor an already-settled
 * delivery. Economic, publication and item terms come exclusively from the
 * immutable intent row, so later catalog/payment rotations cannot strand a
 * buyer or silently change what is delivered.
 */
export async function settledDeliveryConfiguration(
  env: AgentCabinetEnv,
  row: CabinetIntentRow,
): Promise<CabinetConfig> {
  if (!env.AUTH_DB || row.payment_status !== 'settled') throw new CabinetError('settled-delivery-unavailable', 503);
  try {
    if (validateContractAddress(row.contract) !== ValidationResult.VALID
      || validateAddress(row.sponsor) !== ValidationResult.VALID
      || !/^tz[1-4]/u.test(row.sponsor)
      || !/^(?:0|[1-9][0-9]{0,18})$/u.test(row.token_id)
      || row.quantity !== 1
      || !Number.isSafeInteger(row.supply_cap) || row.supply_cap < 1
      || !Number.isSafeInteger(row.maximum_cost_mutez) || row.maximum_cost_mutez < 1) {
      throw new Error('invalid-pinned-delivery');
    }
    const rpc = new URL(env.AGENT_CABINET_RPC_URL || '');
    if (rpc.protocol !== 'https:' || rpc.username || rpc.password) throw new Error('invalid-rpc');
    const item: CabinetItem = {
      slug: offerSlug(row.offer_slug),
      // Catalog copy is intentionally not consulted here. A later release may
      // retire an offer, but the immutable paid row must remain deliverable.
      title: row.offer_slug,
      tokenId: row.token_id,
      supplyCap: row.supply_cap,
      artifactUri: safeUri(row.artifact_uri, true),
      artifactSha256: hash64(row.artifact_sha256),
      metadataUri: safeUri(row.metadata_uri),
      metadataSha256: hash64(row.metadata_sha256),
      revision: hash64(row.offer_revision),
    };
    const spent = await env.AUTH_DB.prepare(`
      SELECT COALESCE(SUM(maximum_cost_mutez),0) AS used FROM agent_cabinet_intents
    `).first<{ used: number }>();
    const used = Number(spent?.used || 0);
    if (!Number.isSafeInteger(used) || used < row.maximum_cost_mutez) throw new Error('invalid-reserved-budget');
    const configuredBudget = Number(env.AGENT_CABINET_TOTAL_BUDGET_MUTEZ || 0);
    const totalBudgetMutez = Math.max(
      used,
      Number.isSafeInteger(configuredBudget) && configuredBudget > 0 ? configuredBudget : 0,
    );
    return {
      contract: row.contract,
      sponsor: row.sponsor,
      rpcUrl: rpc.href,
      publicationOperationHash: '',
      publicationLevel: 0,
      priceUnits: String(row.price_units),
      paymentNetwork: row.payment_network,
      paymentAsset: row.payment_asset,
      paymentPayTo: row.payment_pay_to,
      maxOperationMutez: row.maximum_cost_mutez,
      totalBudgetMutez,
      items: [item],
      hash: row.config_hash,
    };
  } catch (error) {
    if (error instanceof CabinetError) throw error;
    throw new CabinetError('settled-delivery-unavailable', 503);
  }
}

export function paymentTermsStillPinned(env: AgentCabinetEnv, row: CabinetIntentRow): boolean {
  return row.payment_network === X402_NETWORK
    && row.payment_asset.toLowerCase() === (env.X402_ASSET || X402_DEFAULT_ASSET).toLowerCase()
    && row.payment_pay_to.toLowerCase() === (env.X402_PAY_TO || X402_DEFAULT_PAY_TO).toLowerCase()
    && String(row.price_units) === (env.AGENT_CABINET_PRICE_UNITS || env.X402_PRICE_UNITS || X402_DEFAULT_PRICE_UNITS);
}

export function challengeTerms(id: string, challengeId: string, nonce: string, item: CabinetItem, config: CabinetConfig, address: string, issuedAt: number, expiresAt: number) {
  return {
    schema: 'pointcast.agent-cabinet-approval/v1',
    audience: CABINET_AUDIENCE,
    intentId: id,
    challengeId,
    collection: CABINET_COLLECTION,
    offer: item.slug,
    offerRevision: item.revision,
    configHash: config.hash,
    tezos: {
      chainId: CABINET_CHAIN_ID,
      recipient: address,
      contract: config.contract,
      tokenId: item.tokenId,
      quantity: 1,
      sponsor: config.sponsor,
    },
    artifact: { uri: item.artifactUri, sha256: item.artifactSha256 },
    metadata: { uri: item.metadataUri, sha256: item.metadataSha256 },
    payment: {
      protocol: 'x402',
      network: config.paymentNetwork,
      asset: config.paymentAsset,
      amountUnits: config.priceUnits,
      payTo: config.paymentPayTo,
    },
    nonce,
    issuedAt: new Date(issuedAt).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

export async function challengeMessage(terms: ReturnType<typeof challengeTerms>): Promise<string> {
  const termsHash = await sha256(canonicalJson(terms));
  return [
    'PointCast Agent Cabinet — Collection Approval',
    'Schema: pointcast.agent-cabinet-approval/v1',
    `Audience: ${terms.audience}`,
    `Intent: ${terms.intentId}`,
    `Challenge: ${terms.challengeId}`,
    `Offer: ${terms.offer}`,
    `Offer revision: ${terms.offerRevision}`,
    `Configuration: ${terms.configHash}`,
    `Tezos chain: ${terms.tezos.chainId}`,
    `Recipient: ${terms.tezos.recipient}`,
    `FA2 contract: ${terms.tezos.contract}`,
    `Token: ${terms.tezos.tokenId}`,
    `Quantity: ${terms.tezos.quantity}`,
    `Artifact SHA-256: ${terms.artifact.sha256}`,
    `Metadata SHA-256: ${terms.metadata.sha256}`,
    `Payment: ${terms.payment.amountUnits} units of ${terms.payment.asset} on ${terms.payment.network}`,
    `Pay to: ${terms.payment.payTo}`,
    `Nonce: ${terms.nonce}`,
    `Issued at: ${terms.issuedAt}`,
    `Expires at: ${terms.expiresAt}`,
    `Terms SHA-256: ${termsHash}`,
    'This Tezos signature proves control of the recipient wallet and approves only these delivery terms.',
    'It does not authorize payment, signing by PointCast, or any other transfer.',
  ].join('\n');
}

export async function verifyWalletProof(publicKey: unknown, signature: unknown, row: CabinetIntentRow): Promise<string> {
  if (typeof publicKey !== 'string' || typeof signature !== 'string') throw new CabinetError('wallet-proof-required', 401);
  try {
    if (getPkhfromPk(publicKey) !== row.recipient || !verifySignature(row.challenge_payload, publicKey, signature)) throw new Error();
  } catch {
    throw new CabinetError('invalid-wallet-signature', 401);
  }
  return sha256(`${row.challenge_id}\n${row.challenge_payload}\n${publicKey}\n${signature}`);
}

export const getIntent = (db: D1Database, id: string) => db.prepare('SELECT * FROM agent_cabinet_intents WHERE id = ?').bind(id).first<CabinetIntentRow>();
export const getIntentByChallenge = (db: D1Database, id: string) => db.prepare('SELECT * FROM agent_cabinet_intents WHERE challenge_id = ?').bind(id).first<CabinetIntentRow>();

function overallStatus(row: CabinetIntentRow, now: number): string {
  if (row.delivery_status === 'confirmed') return 'complete';
  if (row.payment_status === 'settled' && row.delivery_status === 'failed') return 'paid-undelivered';
  if (row.payment_status === 'settled' && row.last_error === 'broadcast-uncertain') return 'delivery-uncertain';
  if (row.payment_status === 'settled' && row.last_error && row.delivery_status === 'reserved') return 'paid-undelivered';
  if (row.payment_status === 'settled') return row.delivery_status === 'blocked' || row.delivery_status === 'reserved' ? 'payment-settled' : 'delivery-pending';
  if (row.payment_status === 'ambiguous' || row.payment_status === 'settling') return 'payment-ambiguous';
  if (row.approval_status === 'verified') return row.payment_status === 'refused' ? 'payment-not-settled' : 'awaiting-payment';
  if (now >= row.challenge_expires_at) return 'approval-expired';
  return 'awaiting-wallet-approval';
}

function storedSettlementObservation(row: CabinetIntentRow) {
  if (!row.payment_evidence_json || row.payment_evidence_json.length > 4096
    || !row.payment_authorization_hash) return null;
  try {
    const evidence = JSON.parse(row.payment_evidence_json) as Record<string, unknown>;
    const observation = evidence.observation as Record<string, unknown>;
    if (!observation || typeof observation !== 'object' || Array.isArray(observation)
      || evidence.schema !== 'pointcast.agent-cabinet-settlement-observation/v1'
      || evidence.authorizationHash !== row.payment_authorization_hash
      || evidence.requestHash !== row.collect_request_hash
      || evidence.resourceId !== row.id
      || typeof evidence.recordedAt !== 'string'
      || observation.schema !== 'pointcast.x402-settlement-observation/v1'
      || (observation.outcome !== 'settled' && observation.outcome !== 'pending')
      || typeof observation.transaction !== 'string' || !/^0x[0-9a-f]{64}$/u.test(observation.transaction)
      || observation.network !== row.payment_network
      || typeof observation.payer !== 'string' || !/^0x[0-9a-f]{40}$/u.test(observation.payer)
      || observation.amount !== String(row.price_units)
      || !Number.isSafeInteger(observation.facilitatorStatus)
      || Number(observation.facilitatorStatus) < 100 || Number(observation.facilitatorStatus) > 599
      || (observation.outcome === 'pending'
        ? observation.errorReason !== 'settlement_pending'
        : observation.errorReason !== null)) return null;
    return {
      schema: observation.schema,
      outcome: observation.outcome,
      transaction: observation.transaction,
      network: observation.network,
      payer: observation.payer,
      amount: observation.amount,
      errorReason: observation.errorReason,
      facilitatorStatus: observation.facilitatorStatus,
      recordedAt: evidence.recordedAt,
    };
  } catch {
    return null;
  }
}

export function publicIntent(row: CabinetIntentRow, now = Date.now()) {
  const status = overallStatus(row, now);
  const settlementObservation = storedSettlementObservation(row);
  const approval = row.approval_status === 'pending' && now >= row.challenge_expires_at ? 'expired' : row.approval_status;
  const deliveryCanResume = row.payment_status === 'settled'
    && ['reserved', 'preparing', 'signed'].includes(row.delivery_status)
    && row.last_error !== 'broadcast-uncertain';
  const deliveryCanPoll = row.payment_status === 'settled'
    && row.delivery_status === 'submitted'
    && Boolean(row.operation_hash);
  const next = status === 'awaiting-wallet-approval'
    ? { action: 'sign', payload: row.challenge_payload }
    : status === 'awaiting-payment' || status === 'payment-not-settled'
      ? { action: 'pay', method: 'POST', url: '/api/agent-cabinet/collect' }
      : deliveryCanResume
        ? { action: 'resume-delivery', method: 'POST', url: '/api/agent-cabinet/collect', paymentRequired: false, retryAfterSeconds: 2 }
        : deliveryCanPoll
          ? { action: 'poll-status', method: 'GET', url: `/api/agent-cabinet/status?id=${row.id}`, retryAfterSeconds: 4 }
        : status === 'payment-ambiguous'
          ? {
              action: 'operator-payment-reconciliation',
              automaticRetry: false,
              transactionHash: settlementObservation?.transaction || null,
              network: settlementObservation?.network || row.payment_network,
              note: settlementObservation?.outcome === 'pending'
                ? 'Settlement was broadcast but remains pending. Only an operator may reconcile this transaction on the named network; clients must not resubmit payment.'
                : 'Payment outcome requires operator reconciliation; clients must not resubmit payment.',
            }
          : status === 'delivery-uncertain' || status === 'paid-undelivered'
            ? { action: 'operator-review', automaticRetry: false, automaticSigning: false }
          : null;
  return {
    schema: 'pointcast.agent-cabinet-intent/v1',
    id: row.id,
    challengeId: row.challenge_id,
    offer: row.offer_slug,
    offerRevision: row.offer_revision,
    recipient: row.recipient,
    status,
    lanes: {
      approval: { status: approval, proofHash: row.proof_hash },
      payment: {
        status: row.payment_status,
        transactionHash: row.payment_tx_hash || settlementObservation?.transaction || null,
        network: settlementObservation?.network || row.payment_network,
        receiptHash: row.payment_receipt_hash,
        payer: row.payer || settlementObservation?.payer || null,
        settlementObservation,
      },
      delivery: { status: row.delivery_status, operationHash: row.operation_hash, confirmationsRequired: 2 },
      reconciliation: { status: row.delivery_status === 'confirmed' ? 'verified' : row.delivery_status === 'failed' ? 'failed' : 'pending' },
    },
    proofs: {
      x402Receipt: {
        status: row.payment_status,
        transactionHash: row.payment_tx_hash || settlementObservation?.transaction || null,
        network: settlementObservation?.network || row.payment_network,
        receiptHash: row.payment_receipt_hash,
        settlementObservation,
      },
      tezosOperation: { status: row.delivery_status, operationHash: row.operation_hash, confirmationsRequired: 2 },
      combinedReceipt: null,
      note: 'The x402 receipt and Tezos operation are independently verifiable; PointCast does not issue a combined countersigned completion receipt.',
    },
    terms: {
      tezos: { chainId: CABINET_CHAIN_ID, contract: row.contract, tokenId: row.token_id, quantity: row.quantity, sponsor: row.sponsor },
      artifact: { uri: row.artifact_uri, sha256: row.artifact_sha256 },
      metadata: { uri: row.metadata_uri, sha256: row.metadata_sha256 },
      payment: { protocol: 'x402', network: row.payment_network, asset: row.payment_asset, amountUnits: String(row.price_units), payTo: row.payment_pay_to },
    },
    challenge: { payload: row.challenge_payload, expiresAt: new Date(row.challenge_expires_at).toISOString() },
    next,
    statusUrl: `/api/agent-cabinet/status?id=${row.id}`,
    explorerUrl: row.operation_hash ? `https://tzkt.io/${row.operation_hash}` : null,
    error: row.last_error,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at).toISOString() : null,
  };
}
