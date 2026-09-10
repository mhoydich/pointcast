/**
 * /api/pool-together/pledge
 *
 * GET  → totals for every lot plus the twelve most recent pledges (short wallets).
 * POST → one wallet-signed pledge of intent. Body:
 *        { chain: 'tezos' | 'evm', address, message, signature, publicKey? }
 *        The message must be byte-for-byte what buildPledgeMessage() in
 *        src/lib/pool-together.ts produces: the server parses the seven lines,
 *        rebuilds the canonical message from them, and rejects anything else.
 *        Then: the lot must be open, the wallet must match, the amount must be
 *        a whole number within bounds, the timestamp fresh, the nonce unused
 *        (consumed atomically in D1), and the signature valid (Tezos: Beacon
 *        micheline string payload; EVM: EIP-191 personal_sign).
 *
 * A pledge is a statement of intent. Nothing is collected here. One row per
 * wallet per lot; a newer signed message replaces an older one.
 */
import { getPkhfromPk, verifySignature } from '@taquito/utils';
import { verifyMessage } from 'viem';
import { rateLimit, rateLimitResponse } from '../../_rate-limit';
import { buildPledgeMessage, LIMITS, LOTS, PLEDGE_MESSAGE_PREFIX } from '../../../src/lib/pool-together.ts';
import {
  consumeNonce,
  json,
  OPEN_LOT_IDS,
  publicPledge,
  recentPledges,
  summarizeLot,
  upsertPledge,
  type Pledge,
  type PoolTogetherEnv,
} from './_store';

const TEZOS_ADDRESS = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
const EVM_ADDRESS = /^0x[0-9a-f]{40}$/;
const NONCE = /^[A-Za-z0-9-]{16,128}$/;
const VIA = /^[a-z0-9][a-z0-9._-]{0,39}$/i;
const AMOUNT = /^(0|[1-9]\d{0,3})$/;

function michelineStringPayload(value: string): string {
  const bytes = Array.from(new TextEncoder().encode(value)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const byteLength = (bytes.length / 2).toString(16).padStart(8, '0');
  return `0501${byteLength}${bytes}`;
}

interface ParsedPledge { lot: string; wallet: string; amountUsd: number; via: string; issuedAt: string; nonce: string }

/** Strict parse: exactly the seven lines buildPledgeMessage() writes, and the rebuilt message must equal the signed one. */
function parseMessage(message: string): { ok: true; fields: ParsedPledge } | { ok: false; error: string } {
  const lines = message.split('\n');
  if (lines.length !== 8 || lines[0] !== PLEDGE_MESSAGE_PREFIX) return { ok: false, error: 'unrecognized message' };
  const take = (index: number, label: string) => (lines[index].startsWith(`${label}: `) ? lines[index].slice(label.length + 2) : null);
  const lot = take(1, 'Lot'); const wallet = take(2, 'Wallet'); const amount = take(3, 'Amount'); const viaRaw = take(4, 'Via'); const issuedAt = take(5, 'Issued At'); const nonce = take(6, 'Nonce');
  if (lot === null || wallet === null || amount === null || viaRaw === null || issuedAt === null || nonce === null) return { ok: false, error: 'unrecognized message' };
  if (!AMOUNT.test(amount)) return { ok: false, error: `Amount must be a whole number of dollars from 0 to ${LIMITS.pledgeMaxUsd}.` };
  const amountUsd = Number(amount);
  if (amountUsd > LIMITS.pledgeMaxUsd) return { ok: false, error: `Amount must be a whole number of dollars from 0 to ${LIMITS.pledgeMaxUsd}.` };
  const via = viaRaw === '-' ? '' : viaRaw;
  if (via && !VIA.test(via)) return { ok: false, error: 'Via must be a handle of 40 characters or fewer.' };
  const issued = Date.parse(issuedAt);
  if (!Number.isFinite(issued) || new Date(issued).toISOString() !== issuedAt) return { ok: false, error: 'Issued At must be a canonical ISO timestamp.' };
  if (!NONCE.test(nonce)) return { ok: false, error: 'bad nonce' };
  const fields: ParsedPledge = { lot, wallet, amountUsd, via, issuedAt, nonce };
  if (buildPledgeMessage({ lot, wallet, amountUsd, via, issuedAt, nonce }) !== message) return { ok: false, error: 'message is not canonical' };
  return { ok: true, fields };
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > 8192) throw new Error('request body is too large');
  const text = await request.text();
  if (text.length > 8192) throw new Error('request body is too large');
  const parsed = JSON.parse(text) as unknown;
  return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
}

export async function handlePledgeGet(env: PoolTogetherEnv): Promise<Response> {
  if (!env.AUTH_DB) return json({ ok: true, dbBound: false, lots: [], recent: [], collects: false, generatedAt: new Date().toISOString() });
  const db = env.AUTH_DB;
  const lots = await Promise.all(LOTS.map((lot) => summarizeLot(db, lot.id)));
  const recent = (await recentPledges(db, [...OPEN_LOT_IDS])).map(publicPledge);
  return json({ ok: true, dbBound: true, lots: lots.filter(Boolean), recent, collects: false, generatedAt: new Date().toISOString() });
}

export async function handlePledgePost(request: Request, env: PoolTogetherEnv): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await readBody(request);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'invalid request body' }, 400);
  }
  if (!env.AUTH_DB) return json({ ok: false, error: 'The pledge register is unavailable; nothing was recorded.' }, 503);
  const db = env.AUTH_DB;

  const chain = body.chain === 'evm' ? 'evm' : body.chain === 'tezos' ? 'tezos' : null;
  const rawAddress = typeof body.address === 'string' ? body.address.trim() : '';
  const address = chain === 'evm' ? rawAddress.toLowerCase() : rawAddress;
  const message = typeof body.message === 'string' ? body.message : '';
  const signature = typeof body.signature === 'string' ? body.signature.trim() : '';
  const publicKey = typeof body.publicKey === 'string' ? body.publicKey.trim() : '';
  if (!chain) return json({ ok: false, error: 'chain must be tezos or evm' }, 400);
  if (chain === 'tezos' ? !TEZOS_ADDRESS.test(address) : !EVM_ADDRESS.test(address)) return json({ ok: false, error: 'bad address' }, 400);
  if (!message || message.length > 2000 || !signature) return json({ ok: false, error: 'message and signature are required' }, 400);

  const parsed = parseMessage(message);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);
  const { lot, wallet, amountUsd, via, issuedAt, nonce } = parsed.fields;
  if (!OPEN_LOT_IDS.has(lot)) return json({ ok: false, error: `Lot ${lot} is not open for pledges.` }, 400);
  if (wallet !== address) return json({ ok: false, error: 'wallet in message does not match address' }, 400);
  if (Math.abs(Date.now() - Date.parse(issuedAt)) > LIMITS.messageTtlMs) return json({ ok: false, error: 'stale message' }, 400);

  const limit = await rateLimit(request, env, { bucket: 'pool-together-pledge', windowSec: 3600, maxRequests: LIMITS.pledgesPerIpPerHour });
  if (!limit.allowed) return rateLimitResponse(limit, 'the pledge desk is busy. try again in a few minutes.');

  if (chain === 'tezos') {
    if (!publicKey) return json({ ok: false, error: 'publicKey is required for a Tezos pledge' }, 400);
    let derived = '';
    try {
      derived = getPkhfromPk(publicKey);
    } catch {
      return json({ ok: false, error: 'bad public key' }, 400);
    }
    if (derived !== address) return json({ ok: false, error: 'public key does not match address' }, 401);
    let valid = false;
    try {
      valid = verifySignature(michelineStringPayload(message), publicKey, signature);
    } catch {
      valid = false;
    }
    if (!valid) return json({ ok: false, error: 'invalid signature' }, 401);
  } else {
    let valid = false;
    try {
      valid = await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
    } catch {
      valid = false;
    }
    if (!valid) return json({ ok: false, error: 'invalid signature' }, 401);
  }

  if (!await consumeNonce(db, nonce)) return json({ ok: false, error: 'replayed message' }, 409);
  const pledge: Pledge = { lot, chain, address, amountUsd, via, issuedAt, t: Date.now() };
  const stored = await upsertPledge(db, pledge);
  const summary = await summarizeLot(db, lot);
  return json({ ok: true, created: stored.created, applied: stored.applied, pledge: publicPledge(stored.pledge), summary, collects: false });
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
export const onRequestGet: PagesFunction<PoolTogetherEnv> = async ({ env }) => handlePledgeGet(env);
export const onRequestPost: PagesFunction<PoolTogetherEnv> = async ({ request, env }) => handlePledgePost(request, env);
