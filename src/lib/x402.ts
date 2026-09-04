export const X402_SPEC = 'pointcast.agent-payments/v1';
export const X402_RECEIPT_SPEC = 'pointcast.x402-receipt/v2';
export const X402_SPLIT_POLICY_VERSION = 'pointcast.split-policy/v1';
export const X402_VERSION = 2;
export const X402_SCHEME = 'exact';
export const X402_NETWORK = 'eip155:42793';
export const X402_CHAIN_ID = 42793;
export const X402_ENDPOINT = 'https://pointcast.xyz/api/x402/receipt';
export const X402_RECEIPT_BY_TX = `${X402_ENDPOINT}/{txHash}`;
export const X402_VERIFY_ENDPOINT = 'https://pointcast.xyz/api/x402/verify';
export const X402_KEYS_ENDPOINT = 'https://pointcast.xyz/api/x402/keys';
export const X402_PAGE = 'https://pointcast.xyz/x402';
export const X402_JSON = 'https://pointcast.xyz/x402.json';
export const X402_CLIENT_EXAMPLE =
  'https://github.com/mhoydich/pointcast/blob/main/scripts/x402-client-example.mjs';

export const X402_PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
export const X402_PROXY = '0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E';
export const X402_DEFAULT_ASSET = '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9';
export const X402_DEFAULT_PAY_TO = '0x48e8479b4906d45fbe702a18ac2454f800238b37';
export const X402_DEFAULT_PRICE_UNITS = '10000';
export const X402_DEFAULT_FACILITATOR = 'https://exp-faci.bubbletez.com';

export const X402_TREASURY_AGENT_ID = 'pointcast-treasury-x402';
export const X402_TREASURY_PUBLIC_KEY = 'SLtbNyBQXwCgVr6L+qDemrRXmKJSWrZgECyW3RK2VkY=';
export const X402_TREASURY_SPKI = 'MCowBQYDK2VwAyEASLtbNyBQXwCgVr6L+qDemrRXmKJSWrZgECyW3RK2VkY=';
export const X402_TREASURY_CREATED = '2026-09-03';

const utf8 = new TextEncoder();
export type JsonRecord = Record<string, unknown>;

export function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToBytes(value: string) {
  const compact = value.trim().replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) throw new Error('invalid base64');
  const padded = compact.padEnd(Math.ceil(compact.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function bytesToBase64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function encodeBase64Json(value: unknown) {
  return bytesToBase64(utf8.encode(JSON.stringify(value)));
}

export function decodeBase64Json(value: string) {
  return JSON.parse(new TextDecoder().decode(base64ToBytes(value)));
}

/**
 * Deterministic JSON with object keys sorted recursively. Arrays retain order;
 * unsupported JSON values are rejected instead of being silently rewritten.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('canonical JSON requires finite numbers');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const entries = Object.keys(object)
      .filter((key) => object[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`);
    return `{${entries.join(',')}}`;
  }
  throw new TypeError(`unsupported canonical JSON value: ${typeof value}`);
}

const SPEND_FIELDS = [
  'agent',
  'agent_id',
  'amount_usd',
  'currency',
  'link_session_id',
  'loop',
  'merchant',
  'merchant_url',
  'mode',
  'payee_agent',
  'payee_agent_id',
  'status',
] as const;

const RECEIPT_SPEND_FIELDS = [...SPEND_FIELDS, 'credential_type'] as const;
const SETTLEMENT_FIELDS = [
  'rail',
  'x402_version',
  'scheme',
  'network',
  'chain_id',
  'asset',
  'asset_symbol',
  'amount_units',
  'payer',
  'pay_to',
  'tx',
  'explorer',
  'facilitator',
  'gas_payer',
] as const;

function pick(object: JsonRecord, fields: readonly string[]) {
  const selected: Record<string, unknown> = {};
  for (const field of fields) {
    if (object[field] !== undefined && object[field] !== null) selected[field] = object[field];
  }
  return selected;
}

/** The existing agent-payments/v1 spend manifest, kept for generic verifiers. */
export function buildSpendManifest(
  spend: JsonRecord,
  blockId: string,
  timestamp: string,
) {
  return `${canonicalJson({
    ...pick(spend, SPEND_FIELDS),
    block_id: blockId,
    block_timestamp: timestamp,
    spec: X402_SPEC,
  })}\n`;
}

/** The complete economic and on-chain claim countersigned by PointCast. */
export function buildReceiptPayload(receipt: JsonRecord) {
  const spend = isJsonRecord(receipt.spend) ? receipt.spend : {};
  const settlement = isJsonRecord(receipt.settlement) ? receipt.settlement : {};
  const base = {
    id: receipt.id,
    settlement: pick(settlement, SETTLEMENT_FIELDS),
    spend: pick(spend, RECEIPT_SPEND_FIELDS),
    spec: X402_SPEC,
    timestamp: receipt.timestamp,
    type: receipt.type,
  };
  if (receipt.receipt_schema !== X402_RECEIPT_SPEC) return base;
  return {
    ...base,
    receipt_schema: X402_RECEIPT_SPEC,
    request_hash: receipt.request_hash ?? null,
    action_result: receipt.action_result ?? null,
    resource_id: receipt.resource_id ?? null,
    split_policy_version: receipt.split_policy_version ?? null,
    agent_id: receipt.agent_id ?? null,
  };
}

export function buildCanonicalReceiptPayload(receipt: JsonRecord) {
  return `${canonicalJson(buildReceiptPayload(receipt))}\n`;
}

export async function importReceiptPrivateKey(pkcs8Base64: string) {
  if (!pkcs8Base64) throw new Error('X402_RECEIPT_SK is not configured');
  return crypto.subtle.importKey(
    'pkcs8',
    base64ToBytes(pkcs8Base64),
    { name: 'Ed25519' },
    false,
    ['sign'],
  );
}

export async function signCanonicalPayload(payload: string, key: CryptoKey) {
  const signature = await crypto.subtle.sign('Ed25519', key, utf8.encode(payload));
  return bytesToBase64(new Uint8Array(signature));
}

export async function verifyCanonicalPayload(
  payload: string,
  signatureBase64: string,
  rawPublicKeyBase64: string,
) {
  try {
    const rawKey = base64ToBytes(rawPublicKeyBase64);
    if (rawKey.byteLength !== 32) return false;
    const key = await crypto.subtle.importKey('raw', rawKey, { name: 'Ed25519' }, false, ['verify']);
    return crypto.subtle.verify(
      'Ed25519',
      key,
      base64ToBytes(signatureBase64),
      utf8.encode(payload),
    );
  } catch {
    return false;
  }
}

export async function verifyX402Receipt(
  receipt: JsonRecord,
  publicKeyBase64 = X402_TREASURY_PUBLIC_KEY,
) {
  const receiptSignature = isJsonRecord(receipt.receipt_signature) ? receipt.receipt_signature : {};
  const signature = receiptSignature.value;
  if (receiptSignature.kid !== X402_TREASURY_AGENT_ID) {
    return { valid: false, reason: 'unknown receipt signer' };
  }
  if (receiptSignature.alg !== 'EdDSA' || typeof signature !== 'string') {
    return { valid: false, reason: 'missing or unsupported receipt signature' };
  }
  const canonicalPayload = buildCanonicalReceiptPayload(receipt);
  if (receipt.receipt_payload !== canonicalPayload) {
    return { valid: false, reason: 'receipt payload is not canonical or does not match receipt fields' };
  }
  const valid = await verifyCanonicalPayload(canonicalPayload, signature, publicKeyBase64);
  return { valid, reason: valid ? 'signature valid' : 'signature does not validate', canonicalPayload };
}

export const X402_TREASURY_JWK = {
  kty: 'OKP',
  crv: 'Ed25519',
  use: 'sig',
  alg: 'EdDSA',
  kid: X402_TREASURY_AGENT_ID,
  x: bytesToBase64Url(base64ToBytes(X402_TREASURY_PUBLIC_KEY)),
  public_key_base64: X402_TREASURY_PUBLIC_KEY,
  created: X402_TREASURY_CREATED,
} as const;

export const X402_DISCOVERY = {
  endpoint: X402_ENDPOINT,
  price: { amount: '0.01', currency: 'USDC', amountUnits: X402_DEFAULT_PRICE_UNITS, decimals: 6 },
  network: X402_NETWORK,
  scheme: X402_SCHEME,
  paymentMethod: 'Permit2',
  verify: X402_VERIFY_ENDPOINT,
  keys: X402_KEYS_ENDPOINT,
  receiptByTransaction: X402_RECEIPT_BY_TX,
  receiptSchema: X402_RECEIPT_SPEC,
  human: X402_PAGE,
  json: X402_JSON,
  clientExample: X402_CLIENT_EXAMPLE,
} as const;
