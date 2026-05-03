/**
 * Type definitions for @pointcast/agent-payments-protocol.
 * Spec: pointcast.agent-payments/v1.
 */

// ─── signing.mjs ───────────────────────────────────────────────────────────

export const SIGNING_ALG: 'ed25519';
export const SPEC_VERSION: 'pointcast.agent-payments/v1';
export const MANIFEST_FIELDS: readonly [
  'agent', 'agent_id', 'amount_usd', 'currency', 'link_session_id',
  'loop', 'merchant', 'merchant_url', 'mode', 'payee_agent',
  'payee_agent_id', 'status',
];

export type SpendStatus =
  | 'pending'
  | 'pending_approval'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'settled'
  | 'refunded'
  | 'unknown';

export type SpendMode = 'test' | 'live';

export interface Spend {
  agent: string;
  agent_id?: string;
  payee_agent?: string;
  payee_agent_id?: string;
  loop: string;
  amount_usd: number;
  currency?: string;
  merchant: string;
  merchant_url?: string;
  credential_type?: 'card' | 'shared_payment_token';
  status: SpendStatus;
  link_session_id?: string;
  approval_url?: string;
  receipt_url?: string;
  mode: SpendMode;
  context?: string;
  signature?: string;
  signing_alg?: 'ed25519';
  spec?: string;
  card_last4?: string;
  card_brand?: string;
  card_valid_until?: string;
  mcp_server_id?: string;
}

export interface Block {
  id: string;
  timestamp: string;
  spend?: Spend;
  edition?: unknown;
  payouts?: unknown[];
  [key: string]: unknown;
}

export interface IdentityInstance {
  agent_id: string;
  kind?: 'agent' | 'human' | 'treasury' | 'external';
  label?: string;
  vendor?: string;
  public_key?: string;
  public_key_alg?: 'ed25519';
  public_key_minted_at?: string;
  [key: string]: unknown;
}

export interface IdentityRegistry {
  version?: string;
  schema?: string;
  instances?: Record<string, IdentityInstance>;
}

export interface SignSpendResult {
  signature: string;
  signing_alg: 'ed25519';
  spec: string;
}

export interface VerifyResult {
  ok: boolean;
  reason: string;
}

/** Build the canonical manifest bytes for a Block's spend payload. */
export function buildManifest(spend: Spend, blockId: string, timestamp: string): Buffer;

/** Sign a manifest with a PKCS8 PEM private key. Returns base64 signature. */
export function signManifest(manifestBytes: Buffer | Uint8Array, privateKeyPem: string): string;

/** Verify a base64 signature over manifestBytes using a base64 raw 32-byte Ed25519 public key. */
export function verifyManifest(
  manifestBytes: Buffer | Uint8Array,
  signatureBase64: string,
  publicKeyBase64: string,
): boolean;

/** Sign a spend payload. Returns null if the resident has no key minted. */
export function signSpend(
  spend: Spend,
  blockId: string,
  timestamp: string,
  keysDir: string,
): SignSpendResult | null;

/** Verify a Block's spend signature against the identities registry. */
export function verifySpend(block: Block, identities: IdentityRegistry): VerifyResult;

// ─── discover.mjs ──────────────────────────────────────────────────────────

export interface DiscoveryEnvelope {
  spec: string;
  spec_url?: string;
  generated_at?: string;
  issuer?: { name?: string; url?: string; operator?: string; [k: string]: unknown };
  endpoints: {
    receipts?: string;
    treasury?: string;
    identities?: string;
    verifier_template?: string;
    block_template?: string;
    block_json_template?: string;
    spec_doc?: string;
    [k: string]: string | undefined;
  };
  signing?: { algorithm: string; manifest_fields: readonly string[]; [k: string]: unknown };
  identity?: { format?: string; kinds?: readonly string[]; [k: string]: unknown };
  supported_modes?: readonly string[];
  supported_currencies?: readonly string[];
  license?: string;
  [k: string]: unknown;
}

export interface ReceiptsEnvelope {
  schema?: string;
  total_count?: number;
  total_usd?: number;
  receipts?: unknown[];
  [k: string]: unknown;
}

export interface VerifyByUrlResult {
  ok: boolean;
  reason: string;
  block: Block;
  status: 'valid' | 'invalid' | 'unsigned';
}

/** Fetch the /.well-known/agent-payments.json envelope from a site. */
export function discover(siteUrl: string | URL): Promise<DiscoveryEnvelope>;

/** Fetch the receipts feed (uses discovery, falls back to /money.json). */
export function fetchReceipts(
  siteUrl: string | URL,
  opts?: { skipDiscovery?: boolean },
): Promise<ReceiptsEnvelope>;

/** End-to-end verify a single receipt by URL. */
export function verifyReceiptByUrl(
  siteUrl: string | URL,
  blockId: string,
  opts?: { skipDiscovery?: boolean },
): Promise<VerifyByUrlResult>;
