import { createHash, timingSafeEqual } from 'node:crypto';
import { validateAddress, validateContractAddress, validateOperation, ValidationResult } from '@taquito/utils';
import { readBoundedJson } from './read-bounded-json';
import { AGENT_ROSTER, getAgentWallet, type AgentWalletEnv, type AgentWalletKeyRow } from './agent-wallets';
import {
  createWalletChain, TZKT, WalletError,
  type PendingWalletOp, type WalletAction, type WalletChain, type WalletSigningEnv,
} from './agent-wallet-chain';

const LOCK_TTL_MS = 15 * 60_000;
const BUDGET_DATE = "strftime('%Y-%m-%dT00:00:00.000Z', 'now')";
const DAILY_SPEND = `SELECT COALESCE(SUM(max_cost_mutez), 0) AS spent FROM agent_wallet_ops
  WHERE agent_id = ? AND created_at >= ${BUDGET_DATE}`;
const WRITE_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'Authorization, Content-Type, Idempotency-Key',
};

type SigningRow = AgentWalletKeyRow & { bearer_token_hash: string | null; daily_cap_mutez: number };

function json(body: unknown, status: number, headers: Record<string, string> = WRITE_HEADERS, cache = 'no-store') {
  return Response.json(body, { status, headers: { ...headers, 'cache-control': cache } });
}

export function walletWriteOptions(): Response {
  return new Response(null, { status: 204, headers: WRITE_HEADERS });
}

function isAddress(value: unknown): value is string {
  return typeof value === 'string' && /^(tz[1-4]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/u.test(value)
    && validateAddress(value) === ValidationResult.VALID;
}

function integer(value: unknown, minimum: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum;
}

function mintMetadataUri(value: unknown): value is string {
  if (typeof value !== 'string' || !/^(ipfs|https):\/\//u.test(value) || value.length > 1024
    || /[\s\u0000-\u001f\u007f\\]/u.test(value)) return false;
  try {
    const url = new URL(value);
    return !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

async function parseAction(request: Request, kind: WalletAction['kind']): Promise<WalletAction> {
  const value = await readBoundedJson(request, 4096).catch(() => null);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new WalletError('invalid-request', 400);
  const body = value as Record<string, unknown>;
  if (kind === 'send') {
    if (!isAddress(body.to) || !integer(body.amountMutez, 1)) throw new WalletError('invalid-transfer', 400);
    return { kind, to: body.to, amountMutez: body.amountMutez };
  }

  const { contract, recipient, tokenId, quantity = 1, metadataUri } = body;
  if (typeof contract !== 'string' || validateContractAddress(contract) !== ValidationResult.VALID
    || !isAddress(recipient) || !integer(tokenId, 0) || !integer(quantity, 1) || !mintMetadataUri(metadataUri)) {
    throw new WalletError('invalid-mint', 400);
  }
  return { kind, contract, recipient, tokenId, quantity, metadataUri };
}

async function acquireLock(db: D1Database, id: string, holder: string): Promise<boolean> {
  const now = Date.now();
  const acquired = await db.prepare(`
    INSERT INTO agent_wallet_signer_locks (agent_id, holder, expires_at) VALUES (?, ?, ?)
    ON CONFLICT(agent_id) DO UPDATE SET holder = excluded.holder, expires_at = excluded.expires_at
    WHERE agent_wallet_signer_locks.expires_at <= ?
    RETURNING holder
  `).bind(id, holder, now + LOCK_TTL_MS, now).first<{ holder: string }>();
  return acquired?.holder === holder;
}

export async function handleWalletOperation(
  request: Request,
  env: WalletSigningEnv,
  id: string | string[] | undefined,
  kind: WalletAction['kind'],
  chainFactory: (env: WalletSigningEnv) => Promise<WalletChain> = createWalletChain,
): Promise<Response> {
  const token = /^Bearer ([A-Za-z0-9_-]{43})$/iu.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!token || typeof id !== 'string' || !AGENT_ROSTER.some((agent) => agent.id === id)) {
    return json({ error: 'wallet-unauthorized' }, 401);
  }

  const db = env.AUTH_DB;
  if (!db) return json({ error: 'agent-wallet-unavailable' }, 503);
  let holder: string | undefined;
  try {
    const wallet = await db.prepare(`
      SELECT agent_id, address, secret_iv, secret_ciphertext, key_version, bearer_token_hash, daily_cap_mutez
      FROM agent_wallets WHERE agent_id = ?
    `).bind(id).first<SigningRow>();
    const tokenHash = createHash('sha256').update(token).digest();
    if (!wallet?.bearer_token_hash || !timingSafeEqual(tokenHash, Buffer.from(wallet.bearer_token_hash, 'hex'))) {
      return json({ error: 'wallet-unauthorized' }, 401);
    }
    const action = await parseAction(request, kind);
    const idempotencyKey = request.headers.get('idempotency-key');
    if (idempotencyKey !== null && !/^[A-Za-z0-9._-]{1,128}$/u.test(idempotencyKey)) {
      throw new WalletError('invalid-idempotency-key', 400);
    }
    const idempotencyHash = idempotencyKey === null ? null : createHash('sha256').update(`agent-wallet-idempotency:${idempotencyKey}`).digest('hex');
    const requestHash = createHash('sha256').update(JSON.stringify(action)).digest('hex');
    const candidate = crypto.randomUUID();
    if (!await acquireLock(db, id, candidate)) throw new WalletError('wallet-busy', 409);
    holder = candidate;

    if (idempotencyHash !== null) {
      const recorded = await db.prepare(
        'SELECT request_hash, op_hash FROM agent_wallet_ops WHERE agent_id = ? AND idempotency_hash = ?',
      ).bind(id, idempotencyHash).first<{ request_hash: string; op_hash: string }>();
      if (recorded) {
        if (recorded.request_hash !== requestHash) throw new WalletError('idempotency-conflict', 409);
        return json({ status: 'recorded', operationHash: recorded.op_hash }, 202);
      }
    }

    if (action.kind === 'mint') {
      if (!env.AGENT_WALLETS_MINT_CONTRACT) throw new WalletError('mint-contract-unconfigured', 503);
      if (env.AGENT_WALLETS_MINT_CONTRACT !== action.contract) throw new WalletError('mint-contract-not-allowed', 403);
    }
    const spent = await db.prepare(DAILY_SPEND).bind(id).first<number>('spent');
    const budget = wallet.daily_cap_mutez - (spent ?? 0);
    if (budget <= 0 || (action.kind === 'send' && action.amountMutez >= budget)) {
      throw new WalletError('daily-spend-cap', 429);
    }
    const previous = await db.prepare(`
      SELECT op_hash, last_counter, expires_level FROM agent_wallet_ops WHERE agent_id = ? ORDER BY id DESC LIMIT 1
    `).bind(id).first<PendingWalletOp>();
    const chain = await chainFactory(env);
    const signed = await chain.prepare(wallet, action, budget, previous);
    if (signed.maxCostMutez > budget) throw new WalletError('daily-spend-cap', 429);

    // Journal the hash before sending bytes to the RPC. The same statement enforces
    // the lease, current credential and cap even if any changed during preparation.
    const recorded = await db.prepare(`
      INSERT INTO agent_wallet_ops
        (agent_id, kind, op_hash, max_cost_mutez, last_counter, expires_level, idempotency_hash, request_hash, created_at)
      SELECT w.agent_id, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      FROM agent_wallets w JOIN agent_wallet_signer_locks l ON l.agent_id = w.agent_id
      WHERE w.agent_id = ? AND w.bearer_token_hash = ? AND l.holder = ? AND l.expires_at > ?
        AND w.daily_cap_mutez - (${DAILY_SPEND}) >= ?
      RETURNING op_hash
    `).bind(kind, signed.hash, signed.maxCostMutez, signed.lastCounter, signed.expiresLevel, idempotencyHash, requestHash,
      id, wallet.bearer_token_hash, holder, Date.now(), id, signed.maxCostMutez).first<{ op_hash: string }>();
    if (!recorded) throw new WalletError('wallet-admission-changed', 409);

    try {
      await chain.broadcast(signed);
      return json({ status: 'submitted', operationHash: recorded.op_hash }, 202);
    } catch {
      return json({ status: 'submission-unknown', operationHash: recorded.op_hash }, 202);
    }
  } catch (error) {
    if (error instanceof WalletError) {
      return json({ error: error.code, ...(error.operationHash ? { operationHash: error.operationHash } : {}) }, error.status);
    }
    return json({ error: 'agent-wallet-unavailable' }, 503);
  } finally {
    if (holder) {
      await db.prepare('DELETE FROM agent_wallet_signer_locks WHERE agent_id = ? AND holder = ?')
        .bind(id, holder).run().catch(() => undefined);
    }
  }
}

const READ_HEADERS = { 'access-control-allow-origin': '*' };

export async function handleWalletDetail(
  env: AgentWalletEnv, id: string | string[] | undefined, fetchIndex = fetch,
): Promise<Response> {
  try {
    const wallet = typeof id === 'string' ? await getAgentWallet(env, id) : null;
    if (!wallet) return json({ error: 'wallet-not-found' }, 404, READ_HEADERS);

    const read = async (path: string): Promise<unknown> => {
      const response = await fetchIndex(`${TZKT}/accounts/${wallet.address}/${path}`, {
        redirect: 'error', signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error('tzkt-unavailable');
      return response.json();
    };
    const [balance, operations] = await Promise.all([read('balance'), read('operations?limit=10')]);
    if (!integer(balance, 0) || !Array.isArray(operations)) throw new Error('invalid-tzkt-data');
    const recentOps = operations.slice(0, 10).flatMap((op) => {
      if (!op || typeof op.hash !== 'string' || validateOperation(op.hash) !== ValidationResult.VALID) return [];
      return [{
        hash: op.hash, type: op.type, timestamp: op.timestamp, status: op.status,
        level: op.level, ...(integer(op.amount, 0) ? { amountMutez: op.amount } : {}),
      }];
    });
    return json({ ...wallet, network: 'mainnet', balanceMutez: balance, recentOps }, 200, READ_HEADERS, 'public, max-age=30');
  } catch {
    return json({ error: 'wallet-detail-unavailable' }, 503, READ_HEADERS);
  }
}
