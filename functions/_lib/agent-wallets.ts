// One Tezos wallet per agent, held by PointCast instead of any chat thread.
// Keys are generated here, encrypted with AES-GCM (POINTCAST_INTEGRATION_ENCRYPTION_KEY)
// and stored in AUTH_DB. No endpoint ever returns a secret key; this module only
// exposes public addresses to the directory. Signing uses the same key envelope.
import roster from '../../src/data/agent-wallet-roster.json';

export type AgentWalletEnv = {
  AUTH_DB?: D1Database;
  POINTCAST_INTEGRATION_ENCRYPTION_KEY?: string;
};

export type AgentWallet = { id: string; name: string; role: string; address: string; createdAt: string };
type RosterEntry = { id: string; name: string; role: string };
type PublicWalletRow = { agent_id: string; address: string; created_at: string };
export type AgentWalletKeyRow = {
  agent_id: string; address: string; secret_iv: string; secret_ciphertext: string; key_version: number;
};

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

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function encryptionKey(env: AgentWalletEnv): Promise<CryptoKey> {
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = base64UrlToBytes(env.POINTCAST_INTEGRATION_ENCRYPTION_KEY ?? '');
  } catch {
    throw new Error('agent-wallet-encryption-key-invalid');
  }
  if (bytes.byteLength !== 32) throw new Error('agent-wallet-encryption-key-invalid');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function walletAad(agentId: string) {
  return new TextEncoder().encode(`agent-wallet:${agentId}`);
}

/** Build a signer for one wallet without exporting the decrypted key. */
export async function agentWalletSigner(env: AgentWalletEnv, wallet: AgentWalletKeyRow) {
  try {
    const iv = base64UrlToBytes(wallet.secret_iv);
    if (wallet.key_version !== 1 || iv.length !== 12) throw new Error('invalid-wallet-envelope');
    const { InMemorySigner } = await import('@taquito/signer');
    const plaintext = new Uint8Array(await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: walletAad(wallet.agent_id) },
      await encryptionKey(env),
      base64UrlToBytes(wallet.secret_ciphertext),
    ));
    try {
      const signer = await InMemorySigner.fromSecretKey(new TextDecoder().decode(plaintext));
      if (await signer.publicKeyHash() !== wallet.address) throw new Error('wallet-address-mismatch');
      return {
        publicKeyHash: () => signer.publicKeyHash(),
        publicKey: () => signer.publicKey(),
        sign: (bytes: string, watermark?: Uint8Array) => signer.sign(bytes, watermark),
        secretKey: async (): Promise<never> => { throw new Error('agent-wallet-key-export-disabled'); },
      };
    } finally {
      plaintext.fill(0);
    }
  } catch {
    throw new Error('agent-wallet-signer-unavailable');
  }
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
    { name: 'AES-GCM', iv, additionalData: walletAad(agentId) },
    await encryptionKey(env),
    new TextEncoder().encode(secretKey),
  );
  // Bound the lifetime count in the same statement that inserts, including across deployments.
  await db.prepare(`
    INSERT INTO agent_wallets (agent_id, address, secret_iv, secret_ciphertext, key_version, created_at)
    SELECT ?, ?, ?, ?, 1, ? WHERE (SELECT COUNT(*) FROM agent_wallets) < ?
    ON CONFLICT(agent_id) DO NOTHING
  `).bind(agentId, address, bytesToBase64Url(iv), bytesToBase64Url(new Uint8Array(ciphertext)), new Date().toISOString(), MAX_WALLETS).run();
}

function publicWallet(agent: RosterEntry, row: PublicWalletRow): AgentWallet {
  return { id: agent.id, name: agent.name, role: agent.role, address: row.address, createdAt: row.created_at };
}

export async function getAgentWallet(env: AgentWalletEnv, id: string): Promise<AgentWallet | null> {
  const agent = AGENT_ROSTER.find((entry) => entry.id === id);
  if (!agent) return null;
  const db = env.AUTH_DB;
  if (!db) throw new Error('agent-wallet-db-unbound');
  try {
    const row = await db.prepare('SELECT agent_id, address, created_at FROM agent_wallets WHERE agent_id = ?')
      .bind(id).first<PublicWalletRow>();
    return row ? publicWallet(agent, row) : null;
  } catch (error) {
    // Before either the directory or the migration creates the table, no wallet is provisioned.
    if (error instanceof Error && /\bno such table: (?:main\.)?agent_wallets\b/u.test(error.message)) return null;
    throw error;
  }
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
  const list = () => db.prepare('SELECT agent_id, address, created_at FROM agent_wallets').all<PublicWalletRow>();
  const existing = await list();
  const have = new Map((existing.results ?? []).map((row) => [row.agent_id, row]));
  const missing = agents.filter((agent) => !have.has(agent.id));
  const provisionable = missing.slice(0, Math.max(0, MAX_WALLETS - have.size));
  if (provisionable.length) {
    for (const agent of provisionable) await insertWallet(env, db, agent.id);
    const refreshed = await list();
    for (const row of refreshed.results ?? []) have.set(row.agent_id, row);
  }
  return agents.flatMap((agent) => {
    const row = have.get(agent.id);
    return row ? [publicWallet(agent, row)] : [];
  });
}
