/**
 * /api/pool-together/pledge
 *
 * GET  → totals for every lot plus the twelve most recent pledges (short wallets).
 * POST → one wallet-signed pledge of intent. Body:
 *        { chain: 'tezos' | 'evm', address, message, signature, publicKey? }
 *        The message is the exact text produced by buildPledgeMessage() in
 *        src/lib/pool-together.ts; the server re-parses it, checks the lot is
 *        open, the wallet matches, the amount is within bounds, the timestamp
 *        is fresh, and the nonce is unused, then verifies the signature
 *        (Tezos: Beacon micheline string payload; EVM: EIP-191 personal_sign).
 *
 * A pledge is a statement of intent. Nothing is collected here.
 */
import { getPkhfromPk, verifySignature } from '@taquito/utils';
import { verifyMessage } from 'viem';
import { rateLimit, rateLimitResponse } from '../../_rate-limit';
import { LIMITS, LOTS, PLEDGE_MESSAGE_PREFIX } from '../../../src/lib/pool-together.ts';
import {
  json,
  listPledges,
  markNonce,
  nonceSeen,
  OPEN_LOT_IDS,
  publicPledge,
  summarizeLot,
  upsertPledge,
  type Pledge,
  type PoolTogetherEnv,
} from './_store';

const TEZOS_ADDRESS = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const NONCE = /^[A-Za-z0-9-]{16,128}$/;
const VIA = /^[a-z0-9][a-z0-9._-]{0,39}$/i;

function michelineStringPayload(value: string): string {
  const bytes = Array.from(new TextEncoder().encode(value)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const byteLength = (bytes.length / 2).toString(16).padStart(8, '0');
  return `0501${byteLength}${bytes}`;
}

function parseMessage(message: string): Record<string, string> | null {
  const lines = message.split('\n');
  if (lines[0]?.trim() !== PLEDGE_MESSAGE_PREFIX) return null;
  const fields: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    const index = line.indexOf(':');
    if (index <= 0) continue;
    fields[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return fields;
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
  const lots = await Promise.all(LOTS.map((lot) => summarizeLot(env, lot.id)));
  const openLots = LOTS.filter((lot) => lot.status === 'open');
  const recent = (await Promise.all(openLots.map((lot) => listPledges(env, lot.id))))
    .flat()
    .sort((a, b) => b.t - a.t)
    .slice(0, 12)
    .map(publicPledge);
  return json({ ok: true, kvBound: Boolean(env.VISITS), lots: lots.filter(Boolean), recent, collects: false, generatedAt: new Date().toISOString() });
}

export async function handlePledgePost(request: Request, env: PoolTogetherEnv): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await readBody(request);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'invalid request body' }, 400);
  }
  if (!env.VISITS) return json({ ok: false, error: 'The pledge register is unavailable; nothing was recorded.' }, 503);

  const chain = body.chain === 'evm' ? 'evm' : body.chain === 'tezos' ? 'tezos' : null;
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const message = typeof body.message === 'string' ? body.message : '';
  const signature = typeof body.signature === 'string' ? body.signature.trim() : '';
  const publicKey = typeof body.publicKey === 'string' ? body.publicKey.trim() : '';
  if (!chain) return json({ ok: false, error: 'chain must be tezos or evm' }, 400);
  if (chain === 'tezos' ? !TEZOS_ADDRESS.test(address) : !EVM_ADDRESS.test(address)) return json({ ok: false, error: 'bad address' }, 400);
  if (!message || message.length > 2000 || !signature) return json({ ok: false, error: 'message and signature are required' }, 400);

  const fields = parseMessage(message);
  if (!fields) return json({ ok: false, error: 'unrecognized message' }, 400);
  const lot = fields.Lot ?? '';
  if (!OPEN_LOT_IDS.has(lot)) return json({ ok: false, error: `Lot ${lot || '?'} is not open for pledges.` }, 400);
  if ((fields.Wallet ?? '').toLowerCase() !== address.toLowerCase()) return json({ ok: false, error: 'wallet in message does not match address' }, 400);
  const amountUsd = Number(fields.Amount ?? '');
  if (!Number.isInteger(amountUsd) || amountUsd < 0 || amountUsd > LIMITS.pledgeMaxUsd) {
    return json({ ok: false, error: `Amount must be a whole number of dollars from 0 to ${LIMITS.pledgeMaxUsd}.` }, 400);
  }
  const viaRaw = fields.Via ?? '';
  const via = viaRaw === '-' || viaRaw === '' ? '' : viaRaw;
  if (via && !VIA.test(via)) return json({ ok: false, error: 'Via must be a handle of 40 characters or fewer.' }, 400);
  const issuedAt = Date.parse(fields['Issued At'] ?? '');
  if (!Number.isFinite(issuedAt) || Math.abs(Date.now() - issuedAt) > LIMITS.messageTtlMs) return json({ ok: false, error: 'stale message' }, 400);
  const nonce = fields.Nonce ?? '';
  if (!NONCE.test(nonce)) return json({ ok: false, error: 'bad nonce' }, 400);

  const limit = await rateLimit(request, env, { bucket: 'pool-together-pledge', windowSec: 3600, maxRequests: LIMITS.pledgesPerIpPerHour });
  if (!limit.allowed) return rateLimitResponse(limit, 'the pledge desk is busy. try again in a few minutes.');
  if (await nonceSeen(env, nonce)) return json({ ok: false, error: 'replayed message' }, 409);

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

  await markNonce(env, nonce);
  const pledge: Pledge = { lot, chain, address: chain === 'evm' ? address.toLowerCase() : address, amountUsd, via, t: Date.now() };
  try {
    const stored = await upsertPledge(env, pledge);
    const summary = await summarizeLot(env, lot);
    return json({ ok: true, created: stored.created, pledge: publicPledge(stored.pledge), summary, collects: false });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'could not store pledge' }, 409);
  }
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
export const onRequestGet: PagesFunction<PoolTogetherEnv> = async ({ env }) => handlePledgeGet(env);
export const onRequestPost: PagesFunction<PoolTogetherEnv> = async ({ request, env }) => handlePledgePost(request, env);
