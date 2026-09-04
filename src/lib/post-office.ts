export const POST_OFFICE_DOMAIN = 'agents.pointcast.xyz';
export const POST_OFFICE_PAGE = 'https://pointcast.xyz/post-office';
export const POST_OFFICE_JSON = 'https://pointcast.xyz/post-office.json';
export const POST_OFFICE_ALIAS_ENDPOINT = 'https://pointcast.xyz/api/post-office/alias';
export const POST_OFFICE_ALIAS_STATUS_PATTERN = `${POST_OFFICE_ALIAS_ENDPOINT}/{name}`;
export const POST_OFFICE_PRICE_UNITS_DEFAULT = '10000';
export const POST_OFFICE_TERM_DAYS = 30;
export const POST_OFFICE_ENVELOPE_SPEC = 'pointcast.post-office-envelope/v1';

export const POST_OFFICE_RESERVED_NAMES = [
  'hello',
  'kennel',
  'wallet',
  'fable',
  'mike',
  'admin',
  'postmaster',
  'abuse',
] as const;

const RESERVED = new Set<string>(POST_OFFICE_RESERVED_NAMES);
const NAME_PATTERN = /^[a-z0-9-]{3,24}$/u;
const OWNER_PATTERN = /^0x[0-9a-fA-F]{40}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export type PostOfficeForwardKind = 'email' | 'webhook';

export type PostOfficeAliasInput = {
  name: string;
  forward: {
    kind: PostOfficeForwardKind;
    target: string;
  };
  owner?: string;
};

export type PostOfficeAliasRow = {
  name: string;
  forward_kind: PostOfficeForwardKind;
  forward_target: string;
  owner: string;
  receipt_hash: string;
  agent_id?: string | null;
  created_at: string;
  renewed_at: string;
  expires_at: string;
  forwarded_count: number;
  status: string;
};

export function validateAliasName(value: unknown): string {
  if (typeof value !== 'string' || !NAME_PATTERN.test(value)) {
    throw new Error('name must be 3-24 lowercase a-z, 0-9, or hyphen characters');
  }
  if (value.startsWith('-') || value.endsWith('-') || value.includes('--')) {
    throw new Error('name cannot start or end with a hyphen or contain consecutive hyphens');
  }
  if (RESERVED.has(value)) throw new Error('name is reserved');
  return value;
}

export function validateOwner(value: unknown): string {
  if (typeof value !== 'string' || !OWNER_PATTERN.test(value)) {
    throw new Error('owner must be an EVM 0x address');
  }
  return value.toLowerCase();
}

function validateEmailTarget(value: unknown): string {
  if (typeof value !== 'string' || value.length > 320 || !EMAIL_PATTERN.test(value)) {
    throw new Error('email forward target must be a valid address');
  }
  if (value.toLowerCase().endsWith(`@${POST_OFFICE_DOMAIN}`)) {
    throw new Error('email forward target cannot point back into the Post Office');
  }
  return value;
}

function privateIpv4(hostname: string): boolean {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return octets[0] === 10
    || octets[0] === 127
    || octets[0] === 0
    || octets[0] >= 224
    || (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127)
    || (octets[0] === 169 && octets[1] === 254)
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && ((octets[1] === 0 && (octets[2] === 0 || octets[2] === 2)) || octets[1] === 168))
    || (octets[0] === 198 && (octets[1] === 18 || octets[1] === 19 || (octets[1] === 51 && octets[2] === 100)))
    || (octets[0] === 203 && octets[1] === 0 && octets[2] === 113);
}

function validateWebhookTarget(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('webhook forward target must be an HTTPS URL');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('webhook forward target must be an HTTPS URL');
  }
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:'
    || url.username
    || url.password
    || url.hash
    || hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || hostname.includes(':')
    || privateIpv4(hostname)
  ) {
    throw new Error('webhook forward target must be a public HTTPS URL without credentials or a fragment');
  }
  return url.toString();
}

export function parseAliasInput(value: unknown): PostOfficeAliasInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('body must be a JSON object');
  const record = value as Record<string, unknown>;
  if (!record.forward || typeof record.forward !== 'object' || Array.isArray(record.forward)) {
    throw new Error('forward must be an object');
  }
  const forward = record.forward as Record<string, unknown>;
  if (forward.kind !== 'email' && forward.kind !== 'webhook') throw new Error('forward.kind must be email or webhook');
  const target = forward.kind === 'email'
    ? validateEmailTarget(forward.target)
    : validateWebhookTarget(forward.target);
  return {
    name: validateAliasName(record.name),
    forward: { kind: forward.kind, target },
    ...(record.owner === undefined ? {} : { owner: validateOwner(record.owner) }),
  };
}

export function aliasAddress(name: string): string {
  return `${name}@${POST_OFFICE_DOMAIN}`;
}

export function aliasIsActive(row: Pick<PostOfficeAliasRow, 'status' | 'expires_at'>, now = new Date()): boolean {
  return row.status === 'active' && Date.parse(row.expires_at) > now.getTime();
}

export function publicAlias(row: PostOfficeAliasRow, now = new Date()) {
  return {
    name: row.name,
    alias: aliasAddress(row.name),
    status: aliasIsActive(row, now) ? 'active' : 'expired',
    since: row.created_at,
    expiresAt: row.expires_at,
    forwardedCount: Number(row.forwarded_count) || 0,
    receiptHash: row.receipt_hash,
    receiptHashShort: row.receipt_hash.slice(0, 12),
    agentId: row.agent_id ?? null,
  };
}

export const POST_OFFICE_DISCOVERY = {
  kind: 'paid-forwarding-registry',
  domain: POST_OFFICE_DOMAIN,
  storesMail: false,
  page: POST_OFFICE_PAGE,
  json: POST_OFFICE_JSON,
  createOrRenew: POST_OFFICE_ALIAS_ENDPOINT,
  status: POST_OFFICE_ALIAS_STATUS_PATTERN,
  price: { amount: '0.01', amountUnits: POST_OFFICE_PRICE_UNITS_DEFAULT, currency: 'USDC', decimals: 6 },
  network: 'eip155:42793',
  termDays: POST_OFFICE_TERM_DAYS,
  forwardKinds: ['email', 'webhook'],
} as const;
