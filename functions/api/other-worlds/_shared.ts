import { getPkhfromPk, validateAddress, validateContractAddress, ValidationResult, verifySignature } from '@taquito/utils';
import provenance from '../../../src/data/other-worlds-provenance.json';
import exhibition from '../../../src/data/other-worlds.json';

export const COLLECTION = 'los-angeles-other-worlds-2026';
export const CLOSES_AT = exhibition.closesAt;
export const CLOSES_MS = Date.parse(CLOSES_AT);
export const EDITIONS = 27;
export const CHAIN_ID = 'NetXdQprcVkpaWU';
export interface OtherWorldsEnv {
  AUTH_DB?: D1Database;
  OTHER_WORLDS_ENABLED?: string;
  OTHER_WORLDS_MAINNET_APPROVED?: string;
  OTHER_WORLDS_FA2_CONTRACT?: string;
  OTHER_WORLDS_SPONSOR_ADDRESS?: string;
  OTHER_WORLDS_SPONSOR_SECRET_KEY?: string;
  OTHER_WORLDS_RPC_URL?: string;
  OTHER_WORLDS_TOKEN_MAP?: string;
  OTHER_WORLDS_MAX_OPERATION_MUTEZ?: string;
  OTHER_WORLDS_TOTAL_BUDGET_MUTEZ?: string;
}
export interface ArtworkProvenance {
  id: number; slug: string; artifactUri: string; artifactSha256: string; metadataUri: string; metadataSha256: string;
}
export interface Config {
  contract: string; sponsor: string; rpcUrl: string; tokens: Record<string, string>;
  items: ArtworkProvenance[]; maxOperationMutez: number; totalBudgetMutez: number; hash: string;
}
export interface ClaimRow {
  id: string; address: string; artwork_id: number; nonce: string; config_hash: string;
  contract: string; token_id: string; sponsor: string; metadata_sha256: string;
  status: 'reserved'|'preparing'|'signed'|'submitted'|'confirmed'|'failed';
  operation_hash: string|null; signed_bytes: string|null; maximum_cost_mutez: number;
  created_at: number; updated_at: number; confirmed_at: number|null; last_error: string|null;
}
export interface ChallengeRow {
  nonce: string; address: string; artwork_id: number; origin: string; message: string;
  config_hash: string; expires_at: number; proof_hash: string|null; created_at: number;
}
export class ClaimError extends Error {
  constructor(public reason: string, public status = 400) { super(reason); }
}
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});
export function fail(error: unknown) {
  return error instanceof ClaimError
    ? json({ ok: false, reason: error.reason, message: error.reason.replaceAll('-', ' ') }, error.status)
    : json({ ok: false, reason: 'temporarily-unavailable', message: 'Please try again. Your existing claim is retained.' }, 503);
}
export async function sha256(value: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}
export function payload(message: string): string {
  const hex = Array.from(new TextEncoder().encode(message)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `0501${(hex.length / 2).toString(16).padStart(8, '0')}${hex}`;
}
export function wallet(value: unknown): string {
  if (typeof value !== 'string' || !/^tz[1234]/.test(value) || validateAddress(value) !== ValidationResult.VALID) throw new ClaimError('invalid-wallet');
  return value;
}
export function artwork(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 9) throw new ClaimError('invalid-artwork');
  return Number(value);
}
export function sameOrigin(request: Request): string {
  const origin = new URL(request.url).origin;
  if (request.headers.get('origin') !== origin) throw new ClaimError('origin-mismatch', 403);
  return origin;
}
export async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new ClaimError('json-required', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ClaimError('invalid-body');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new ClaimError('body-too-large', 413); }
    chunks.push(value);
  }
  try {
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch { throw new ClaimError('invalid-body'); }
}
export async function configuration(env: OtherWorldsEnv, items = provenance.items as ArtworkProvenance[]): Promise<Config|null> {
  if (env.OTHER_WORLDS_ENABLED !== 'true' || env.OTHER_WORLDS_MAINNET_APPROVED !== 'true' || !env.AUTH_DB || !env.OTHER_WORLDS_SPONSOR_SECRET_KEY) return null;
  try {
    const contract = env.OTHER_WORLDS_FA2_CONTRACT || '';
    if (validateContractAddress(contract) !== ValidationResult.VALID) return null;
    const sponsor = wallet(env.OTHER_WORLDS_SPONSOR_ADDRESS);
    const rpcUrl = new URL(env.OTHER_WORLDS_RPC_URL || '');
    if (rpcUrl.protocol !== 'https:' || rpcUrl.username || rpcUrl.password) return null;
    const raw: unknown = JSON.parse(env.OTHER_WORLDS_TOKEN_MAP || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const tokens: Record<string, string> = {};
    for (let id = 1; id <= 9; id++) {
      const value = (raw as Record<string, unknown>)[String(id)];
      if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,18})$/.test(value)) return null;
      tokens[String(id)] = value;
    }
    if (Object.keys(raw).length !== 9 || new Set(Object.values(tokens)).size !== 9) return null;
    if (items.length !== 9 || new Set(items.map(item => item.id)).size !== 9) return null;
    for (let id = 1; id <= 9; id++) {
      const item = items.find(item => item.id === id);
      if (!item || !/^[a-f0-9]{64}$/.test(item.artifactSha256) || !/^[a-f0-9]{64}$/.test(item.metadataSha256) || !/^(https:\/\/|ipfs:\/\/)/.test(item.artifactUri) || !/^https:\/\//.test(item.metadataUri)) return null;
    }
    const maxOperationMutez = Number(env.OTHER_WORLDS_MAX_OPERATION_MUTEZ);
    const totalBudgetMutez = Number(env.OTHER_WORLDS_TOTAL_BUDGET_MUTEZ);
    if (!Number.isSafeInteger(maxOperationMutez) || maxOperationMutez <= 0 || maxOperationMutez > 100_000 || !Number.isSafeInteger(totalBudgetMutez) || totalBudgetMutez < maxOperationMutez || totalBudgetMutez > 25_000_000) return null;
    const config = { contract, sponsor, rpcUrl: rpcUrl.href, tokens, items, maxOperationMutez, totalBudgetMutez };
    return { ...config, hash: await sha256(JSON.stringify({ collection: COLLECTION, chainId: CHAIN_ID, ...config })) };
  } catch { return null; }
}
export function receipt(row: ClaimRow) {
  return { id: row.id, artworkId: row.artwork_id, address: row.address,
    status: row.status === 'preparing' ? 'reserved' : row.status,
    operationHash: row.operation_hash, contract: row.contract, tokenId: row.token_id,
    metadataSha256: row.metadata_sha256, collectorCostMutez: 0,
    createdAt: new Date(row.created_at).toISOString(), confirmedAt: row.confirmed_at ? new Date(row.confirmed_at).toISOString() : null,
    receiptUrl: `/api/other-worlds/receipt?id=${row.id}`,
    explorerUrl: row.operation_hash ? `https://tzkt.io/${row.operation_hash}` : null,
    message: row.status === 'preparing' ? 'Your edition is reserved. Sponsor processing is in progress.' : row.last_error ? 'Your edition is retained while delivery is reviewed.' : null,
  };
}
export const getClaim = (db: D1Database, id: string) => db.prepare('SELECT * FROM other_worlds_claims WHERE id = ?').bind(id).first<ClaimRow>();
export const walletClaim = (db: D1Database, address: string) => db.prepare('SELECT * FROM other_worlds_claims WHERE address = ?').bind(address).first<ClaimRow>();
export async function verifyProof(proof: Record<string, unknown>, challenge: ChallengeRow): Promise<string> {
  const publicKey = typeof proof.publicKey === 'string' ? proof.publicKey : '';
  const signature = typeof proof.signature === 'string' ? proof.signature : '';
  try {
    if (getPkhfromPk(publicKey) !== challenge.address || !verifySignature(payload(challenge.message), publicKey, signature)) throw new Error();
  } catch { throw new ClaimError('invalid-wallet-signature', 401); }
  return sha256(`${publicKey}\n${signature}`);
}
