// One Tezos wallet per agent, held by PointCast instead of any chat thread.
// Keys are generated here, encrypted with AES-GCM (POINTCAST_INTEGRATION_ENCRYPTION_KEY)
// and stored in AUTH_DB. No endpoint ever returns a secret key; this module only
// exposes public addresses. Signing (mint/send) is a later, separately gated step.
import roster from '../../src/data/agent-wallet-roster.json';

export type AgentWalletEnv = {
  AUTH_DB?: D1Database;
  POINTCAST_INTEGRATION_ENCRYPTION_KEY?: string;
};

export type AgentWallet = { id: string; name: string; role: string; address: string; createdAt: string };
type RosterEntry = { id: string; name: string; role: string };

const AGENT_ID = /^[a-z0-9][a-z0-9-]{1,40}$/;
const MAX_WALLETS = 64;

export const AGENT_ROSTER: RosterEntry[] = (roster.agents as RosterEntry[])
  .filter((agent) => AGENT_ID.test(agent.id))
  .slice(0, MAX_WALLETS);

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS agent_wallets (
  agent_id TEXT PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  secret_iv TEXT NOT NULL,
  secret_ciphertext TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
)`;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function encryptionKey(env: AgentWalletEnv): Promise<CryptoKey> {
  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(env.POINTCAST_INTEGRATION_ENCRYPTION_KEY ?? '');
  } catch {
    throw new Error('agent-wallet-encryption-key-invalid');
  }
  if (bytes.byteLength !== 32) throw new Error('agent-wallet-encryption-key-invalid');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/** Generate a fresh ed25519 key. Returns the edsk seed and its tz1 address. */
export async function generateTezosKey(): Promise<{ secretKey: string; address: string }> {
  const [{ b58Encode, PrefixV2 }, { InMemorySigner }] = await Promise.all([
    import('@taquito/utils'),
    import('@taquito/signer'),
  ]);
  const seed = new Uint8Array(32);
  crypto.getRandomValues(seed);
  const secretKey = b58Encode(seed, PrefixV2.Ed25519Seed);
  const signer = await InMemorySigner.fromSecretKey(secretKey);
  return { secretKey, address: await signer.publicKeyHash() };
}

async function insertWallet(env: AgentWalletEnv, db: D1Database, agentId: string): Promise<void> {
  const { secretKey, address } = await generateTezosKey();
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(`agent-wallet:${agentId}`) },
    await encryptionKey(env),
    new TextEncoder().encode(secretKey),
  );
  // INSERT OR IGNORE: a concurrent request that created the row first wins; ours is discarded.
  await db.prepare(
    'INSERT OR IGNORE INTO agent_wallets (agent_id, address, secret_iv, secret_ciphertext, key_version, created_at) VALUES (?, ?, ?, ?, 1, ?)',
  ).bind(agentId, address, bytesToBase64Url(iv), bytesToBase64Url(new Uint8Array(ciphertext)), new Date().toISOString()).run();
}

/** Make sure every roster agent has a wallet, then list the public side of each. */
export async function ensureAgentWallets(
  env: AgentWalletEnv,
  rosterOverride?: RosterEntry[],
): Promise<AgentWallet[]> {
  const agents = rosterOverride ?? AGENT_ROSTER;
  const db = env.AUTH_DB;
  if (!db) throw new Error('agent-wallet-db-unbound');
  await db.prepare(CREATE_TABLE).run();
  const existing = await db.prepare('SELECT agent_id, address, created_at FROM agent_wallets').all<{
    agent_id: string; address: string; created_at: string;
  }>();
  const have = new Map((existing.results ?? []).map((row) => [row.agent_id, row]));
  const missing = agents.filter((agent) => !have.has(agent.id));
  // Lifetime cap applies to inserts only: wallets that already exist are always listed,
  // even when the table is full and a new roster entry cannot be provisioned.
  const room = Math.max(0, MAX_WALLETS - have.size);
  const toCreate = missing.slice(0, room);
  if (toCreate.length) {
    for (const agent of toCreate) await insertWallet(env, db, agent.id);
    const refreshed = await db.prepare('SELECT agent_id, address, created_at FROM agent_wallets').all<{
      agent_id: string; address: string; created_at: string;
    }>();
    have.clear();
    for (const row of refreshed.results ?? []) have.set(row.agent_id, row);
  }
  return agents.flatMap((agent) => {
    const row = have.get(agent.id);
    return row ? [{ id: agent.id, name: agent.name, role: agent.role, address: row.address, createdAt: row.created_at }] : [];
  });
}
