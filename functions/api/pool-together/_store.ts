/**
 * Pool Together storage — pledges, nonces, and parcel memos in AUTH_DB (D1).
 *
 * Tables (migrations/auth/0019_pool_together.sql):
 *   pool_together_pledges  one row per wallet per lot, atomic upsert, newest issued_at wins
 *   pool_together_nonces   a signed pledge message is accepted once (primary-key insert)
 *   pool_together_memos    one row per memo; a sealed (paid) memo can never be lost to a list rewrite
 *
 * Nothing here moves money. A pledge is a signed statement of intent; a memo
 * is a filed parcel. Both are public by design. The client address hash on a
 * memo is kept for the daily cap and never published.
 */
import { LIMITS, LOTS, MEMO_KINDS, type MemoKind } from '../../../src/lib/pool-together.ts';

export interface PoolTogetherEnv {
  AUTH_DB?: D1Database;
  PC_RATES_KV?: KVNamespace;
}

export interface Pledge {
  lot: string;
  chain: 'tezos' | 'evm';
  address: string;
  amountUsd: number;
  via: string;
  issuedAt: string;
  t: number;
}

export interface MemoSeal {
  receiptHash: string;
  payer: string;
  txHash: string | null;
  actionId: string | null;
}

export interface Memo {
  id: string;
  lot: string;
  agent: string;
  agentId: string | null;
  apn: string | null;
  address: string | null;
  kind: MemoKind;
  source: string | null;
  note: string;
  t: number;
  sealed: MemoSeal | null;
}

export const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, PointCast-Agent-Id, PointCast-Agent-Timestamp, PointCast-Agent-Signature',
  'Cache-Control': 'no-store',
};

export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { ...JSON_HEADERS, ...extra } });

export const OPEN_LOT_IDS = new Set(LOTS.filter((lot) => lot.status === 'open').map((lot) => lot.id));

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export function publicPledge(pledge: Pledge) {
  return { lot: pledge.lot, chain: pledge.chain, wallet: shortAddress(pledge.address), amountUsd: pledge.amountUsd, via: pledge.via || null, t: pledge.t };
}

/** Goal-eligible: a parcel number and a public source. Address-only memos are kept but do not count. */
export function memoIsEligible(memo: Pick<Memo, 'apn' | 'source'>): boolean {
  return Boolean(memo.apn && memo.source);
}

export function publicMemo(memo: Memo) {
  return {
    id: memo.id,
    lot: memo.lot,
    agent: memo.agent,
    verifiedAgent: Boolean(memo.agentId),
    apn: memo.apn,
    address: memo.address,
    kind: memo.kind,
    source: memo.source,
    note: memo.note,
    eligible: memoIsEligible(memo),
    t: memo.t,
    sealed: memo.sealed,
  };
}

export async function hashClient(request: Request): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  if (!ip) return 'anon';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`pool-together:${ip}`));
  return Array.from(new Uint8Array(digest)).slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- pledges ---------- */

interface PledgeRow { lot: string; chain: 'tezos' | 'evm'; address: string; amount_usd: number; via: string; issued_at: string; updated_at: string }

function pledgeFromRow(row: PledgeRow): Pledge {
  return { lot: row.lot, chain: row.chain, address: row.address, amountUsd: row.amount_usd, via: row.via, issuedAt: row.issued_at, t: Date.parse(row.updated_at) };
}

/** Consume a nonce exactly once. Returns false when it was already used. */
export async function consumeNonce(db: D1Database, nonce: string): Promise<boolean> {
  const result = await db.prepare('INSERT OR IGNORE INTO pool_together_nonces (nonce, created_at) VALUES (?, ?)').bind(nonce, new Date().toISOString()).run();
  return (result.meta?.changes ?? 0) > 0;
}

/**
 * Insert or replace this wallet's pledge on a lot. A newer signed message wins;
 * an older one (replayed or delayed) is ignored. Returns the row now on file.
 */
export async function upsertPledge(db: D1Database, pledge: Pledge): Promise<{ pledge: Pledge; created: boolean; applied: boolean }> {
  const now = new Date().toISOString();
  const existing = await db.prepare('SELECT issued_at FROM pool_together_pledges WHERE lot = ? AND chain = ? AND address = ?').bind(pledge.lot, pledge.chain, pledge.address).first<{ issued_at: string }>();
  const result = await db.prepare(`
    INSERT INTO pool_together_pledges (lot, chain, address, amount_usd, via, issued_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(lot, chain, address) DO UPDATE SET
      amount_usd = excluded.amount_usd, via = excluded.via, issued_at = excluded.issued_at, updated_at = excluded.updated_at
    WHERE excluded.issued_at > pool_together_pledges.issued_at
  `).bind(pledge.lot, pledge.chain, pledge.address, pledge.amountUsd, pledge.via, pledge.issuedAt, now, now).run();
  const row = await db.prepare('SELECT lot, chain, address, amount_usd, via, issued_at, updated_at FROM pool_together_pledges WHERE lot = ? AND chain = ? AND address = ?').bind(pledge.lot, pledge.chain, pledge.address).first<PledgeRow>();
  return { pledge: row ? pledgeFromRow(row) : pledge, created: !existing, applied: (result.meta?.changes ?? 0) > 0 };
}

export async function recentPledges(db: D1Database, lots: string[], limit = 12): Promise<Pledge[]> {
  if (!lots.length) return [];
  const placeholders = lots.map(() => '?').join(', ');
  const result = await db.prepare(`SELECT lot, chain, address, amount_usd, via, issued_at, updated_at FROM pool_together_pledges WHERE lot IN (${placeholders}) ORDER BY updated_at DESC LIMIT ?`).bind(...lots, limit).all<PledgeRow>();
  return (result.results ?? []).map(pledgeFromRow);
}

/* ---------- memos ---------- */

interface MemoRow {
  id: string; lot: string; agent: string; agent_id: string | null; apn: string | null; address: string | null; kind: MemoKind; source: string | null; note: string;
  sealed_receipt_hash: string | null; sealed_payer: string | null; sealed_tx_hash: string | null; sealed_action_id: string | null; created_at: string;
}

function memoFromRow(row: MemoRow): Memo {
  return {
    id: row.id, lot: row.lot, agent: row.agent, agentId: row.agent_id, apn: row.apn, address: row.address, kind: row.kind, source: row.source, note: row.note,
    t: Date.parse(row.created_at),
    sealed: row.sealed_receipt_hash && row.sealed_payer ? { receiptHash: row.sealed_receipt_hash, payer: row.sealed_payer, txHash: row.sealed_tx_hash, actionId: row.sealed_action_id } : null,
  };
}

export async function insertMemo(db: D1Database, memo: Memo, ipHash: string | null): Promise<Memo> {
  await db.prepare(`
    INSERT INTO pool_together_memos (id, lot, agent, agent_id, apn, address, kind, source, note, ip_hash, sealed_receipt_hash, sealed_payer, sealed_tx_hash, sealed_action_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    memo.id, memo.lot, memo.agent, memo.agentId, memo.apn, memo.address, memo.kind, memo.source, memo.note, ipHash,
    memo.sealed?.receiptHash ?? null, memo.sealed?.payer ?? null, memo.sealed?.txHash ?? null, memo.sealed?.actionId ?? null, new Date(memo.t).toISOString(),
  ).run();
  return memo;
}

export async function listMemos(db: D1Database, limit = 200): Promise<Memo[]> {
  const result = await db.prepare(`
    SELECT id, lot, agent, agent_id, apn, address, kind, source, note, sealed_receipt_hash, sealed_payer, sealed_tx_hash, sealed_action_id, created_at
    FROM pool_together_memos ORDER BY (sealed_receipt_hash IS NOT NULL) DESC, created_at DESC LIMIT ?
  `).bind(limit).all<MemoRow>();
  return (result.results ?? []).map(memoFromRow);
}

export async function countMemosSince(db: D1Database, column: 'ip_hash' | 'agent', value: string, sinceIso: string): Promise<number> {
  const row = await db.prepare(`SELECT COUNT(*) AS count FROM pool_together_memos WHERE ${column} = ? AND created_at >= ?`).bind(value, sinceIso).first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export interface RegisterTotals { count: number; sealed: number; eligible: number; agents: number; verifiedAgents: number }

export async function registerTotals(db: D1Database, lot?: string): Promise<RegisterTotals> {
  const row = await db.prepare(`
    SELECT COUNT(*) AS count,
           SUM(CASE WHEN sealed_receipt_hash IS NOT NULL THEN 1 ELSE 0 END) AS sealed,
           SUM(CASE WHEN apn IS NOT NULL AND source IS NOT NULL THEN 1 ELSE 0 END) AS eligible,
           COUNT(DISTINCT lower(agent)) AS agents,
           COUNT(DISTINCT agent_id) AS verified_agents
    FROM pool_together_memos ${lot ? 'WHERE lot = ?' : ''}
  `).bind(...(lot ? [lot] : [])).first<{ count: number; sealed: number | null; eligible: number | null; agents: number; verified_agents: number }>();
  return { count: Number(row?.count ?? 0), sealed: Number(row?.sealed ?? 0), eligible: Number(row?.eligible ?? 0), agents: Number(row?.agents ?? 0), verifiedAgents: Number(row?.verified_agents ?? 0) };
}

export interface LotSummary {
  lot: string;
  status: string;
  deadline: string | null;
  goal: { hands: number; memos: number } | null;
  pledgedWallets: number;
  pledgedUsd: number;
  recruited: number;
  memos: number;
  memosEligible: number;
  sealedMemos: number;
  agents: number;
  verifiedAgents: number;
}

export async function summarizeLot(db: D1Database, lotId: string): Promise<LotSummary | null> {
  const lot = LOTS.find((row) => row.id === lotId);
  if (!lot) return null;
  const [pledges, memos] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS wallets, COALESCE(SUM(amount_usd), 0) AS usd, SUM(CASE WHEN via <> '' THEN 1 ELSE 0 END) AS recruited FROM pool_together_pledges WHERE lot = ?`).bind(lotId).first<{ wallets: number; usd: number; recruited: number | null }>(),
    registerTotals(db, lotId),
  ]);
  return {
    lot: lotId,
    status: lot.status,
    deadline: lot.deadline,
    goal: lot.goal ? { hands: lot.goal.hands, memos: lot.goal.memos } : null,
    pledgedWallets: Number(pledges?.wallets ?? 0),
    pledgedUsd: Number(pledges?.usd ?? 0),
    recruited: Number(pledges?.recruited ?? 0),
    memos: memos.count,
    memosEligible: memos.eligible,
    sealedMemos: memos.sealed,
    agents: memos.agents,
    verifiedAgents: memos.verifiedAgents,
  };
}

/* ---------- memo validation, shared by the free and the paid route ---------- */

export interface MemoInput {
  lot: string;
  agent: string;
  apn: string | null;
  address: string | null;
  kind: MemoKind;
  source: string | null;
  note: string;
}

const APN = /^(\d{4})-?(\d{3})-?(\d{3})$/;
const AGENT = /^[a-z0-9][a-z0-9._-]{0,39}$/i;
const CONTROL = /[\u0000-\u001f\u007f]/g;

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

/**
 * Normalize a memo body. The canonical shape (sorted keys, omitted nulls) is
 * what the paid route hashes into its x402 intent, so buyers can reproduce it:
 * { agent, kind, lot, note, apn?, address?, source? } — strings trimmed,
 * whitespace collapsed, APN as 4-3-3 with dashes.
 */
export function normalizeMemo(input: unknown): { ok: true; memo: MemoInput; canonical: Record<string, unknown> } | { ok: false; error: string } {
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const lot = cleanText(body.lot, 8) || '000';
  if (!OPEN_LOT_IDS.has(lot)) return { ok: false, error: `Lot ${lot} is not open for memos.` };
  const agent = cleanText(body.agent, LIMITS.agentHandleChars);
  if (!AGENT.test(agent)) return { ok: false, error: 'agent is required: 1-40 characters, letters, digits, dot, underscore, or dash.' };
  const rawApn = cleanText(body.apn, 16);
  let apn: string | null = null;
  if (rawApn) {
    const match = APN.exec(rawApn);
    if (!match) return { ok: false, error: 'apn must be a Los Angeles County assessor parcel number, 4-3-3 digits.' };
    apn = `${match[1]}-${match[2]}-${match[3]}`;
  }
  const address = cleanText(body.address, LIMITS.memoAddressChars) || null;
  if (!apn && !address) return { ok: false, error: 'Give an apn or an address.' };
  const kind = cleanText(body.kind, 20) as MemoKind;
  if (!MEMO_KINDS.includes(kind)) return { ok: false, error: `kind must be one of ${MEMO_KINDS.join(', ')}.` };
  const rawSource = cleanText(body.source, LIMITS.sourceUrlChars);
  let source: string | null = null;
  if (rawSource) {
    try {
      const url = new URL(rawSource);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('scheme');
      source = url.href;
    } catch {
      return { ok: false, error: 'source must be an http(s) URL to a public record.' };
    }
  }
  const note = cleanText(body.note, LIMITS.memoNoteChars);
  const memo: MemoInput = { lot, agent, apn, address, kind, source, note };
  const canonical: Record<string, unknown> = { agent, kind, lot, note };
  if (apn) canonical.apn = apn;
  if (address) canonical.address = address;
  if (source) canonical.source = source;
  return { ok: true, memo, canonical };
}

export function newMemoId(): string {
  return `ptm_${crypto.randomUUID().replaceAll('-', '')}`;
}
