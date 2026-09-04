import {
  X402_TREASURY_PUBLIC_KEY,
  canonicalJson,
  decodeBase64Json,
  isJsonRecord,
  type JsonRecord,
} from '../../../src/lib/x402.ts';
import {
  POST_OFFICE_PAGE,
  POST_OFFICE_PRICE_UNITS_DEFAULT,
  POST_OFFICE_TERM_DAYS,
  aliasAddress,
  aliasIsActive,
  parseAliasInput,
  validateOwner,
  type PostOfficeAliasRow,
} from '../../../src/lib/post-office.ts';
import { handleReceiptRequest } from '../x402/receipt.ts';
import { finalizeX402Receipt } from '../../_lib/x402-gate.ts';
import { hashAgentActionRequest, verifyAgentRequest } from '../../_lib/agent-identity.ts';

const MAX_BODY_BYTES = 16_384;
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Payment-Signature, PointCast-Agent-Id, PointCast-Agent-Timestamp, PointCast-Agent-Signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'Payment-Required, X-Payment-Response, X-Facilitator-Url',
  'Cache-Control': 'no-store',
};

type AliasEnv = Cloudflare.Env & {
  AUTH_DB?: D1Database;
  POST_OFFICE_PRICE_UNITS?: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: JSON_HEADERS });
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_BODY_BYTES) throw new Error('request body is too large');
  if (!request.body) throw new Error('request body is required');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error('request body is too large');
    }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode()) as unknown;
}

function payerFromHeader(header: string): string {
  if (header.length > 16_384) throw new Error('Payment-Signature too large');
  const payment = decodeBase64Json(header);
  if (!isJsonRecord(payment) || !isJsonRecord(payment.payload)) throw new Error('invalid Payment-Signature');
  const permit = isJsonRecord(payment.payload.permit2Authorization)
    ? payment.payload.permit2Authorization
    : null;
  return validateOwner(permit?.from);
}

async function receiptHash(receipt: JsonRecord): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(receipt)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function plusDays(base: Date, days: number): string {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function handleAliasRequest(
  request: Request,
  env: AliasEnv,
  expectedPublicKey = X402_TREASURY_PUBLIC_KEY,
  now = new Date(),
): Promise<Response> {
  if (!env.AUTH_DB) return json({ error: 'Post Office registry is not configured; no payment was submitted.' }, 503);

  let input;
  try {
    input = parseAliasInput(await readBoundedJson(request));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'invalid request body' }, 400);
  }

  const priceUnits = env.POST_OFFICE_PRICE_UNITS || POST_OFFICE_PRICE_UNITS_DEFAULT;
  if (!/^\d+$/u.test(priceUnits) || BigInt(priceUnits) < 1n) {
    return json({ error: 'Post Office price is not configured; no payment was submitted.' }, 503);
  }

  const existing = await env.AUTH_DB.prepare(`
    SELECT name, forward_kind, forward_target, owner, receipt_hash, agent_id,
           created_at, renewed_at, expires_at, forwarded_count, status
    FROM aliases WHERE name = ? LIMIT 1
  `).bind(input.name).first<PostOfficeAliasRow>();
  const paymentHeader = request.headers.get('Payment-Signature') || request.headers.get('payment-signature');
  const requestHash = await hashAgentActionRequest('post-office-alias', input);
  const identity = await verifyAgentRequest(env.AUTH_DB, request, requestHash, 'post-office:alias', now);
  if (identity.response) return identity.response;

  let payer: string | null = null;
  if (paymentHeader) {
    try {
      payer = payerFromHeader(paymentHeader);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'invalid Payment-Signature' }, 400);
    }
    if (input.owner && input.owner !== payer) {
      return json({ error: 'owner must match the x402 payer address; no payment was submitted.' }, 403);
    }
    if (existing && aliasIsActive(existing, now) && existing.owner.toLowerCase() !== payer) {
      return json({ error: 'active alias is owned by another payer; no payment was submitted.' }, 409);
    }
  }

  const product = {
    priceUnits,
    resourceDescription: `Create or renew ${aliasAddress(input.name)} for ${POST_OFFICE_TERM_DAYS} days. PointCast stores forwarding configuration and counters, never mail.`,
    merchantUrl: POST_OFFICE_PAGE,
    loop: 'post-office-alias',
    context: `x402 v2 payment for the ${aliasAddress(input.name)} forwarding-registry alias; no mailbox or stored mail is included.`,
    requestHash,
    resourceId: aliasAddress(input.name),
    agentId: identity.agentId,
  };
  const settlement = await handleReceiptRequest(request, env, expectedPublicKey, product);
  if (settlement.status !== 200) return settlement;

  let receipt: JsonRecord;
  try {
    const decoded: unknown = await settlement.json();
    if (!isJsonRecord(decoded) || !isJsonRecord(decoded.settlement)) throw new Error('invalid receipt');
    receipt = decoded;
    payer = validateOwner(decoded.settlement.payer);
  } catch {
    return json({ error: 'Payment settled but the signed receipt could not be read; contact abuse@pointcast.xyz.' }, 502);
  }
  if (input.owner && input.owner !== payer) {
    return json({ error: 'Payment settled for a different owner; contact abuse@pointcast.xyz.' }, 502);
  }

  const owner = payer;
  const activeRenewal = Boolean(existing && aliasIsActive(existing, now) && existing.owner.toLowerCase() === owner);
  const sameOwnerRenewal = Boolean(existing && existing.owner.toLowerCase() === owner);
  const action = !existing ? 'created' : sameOwnerRenewal ? 'renewed' : 'reclaimed';
  const base = activeRenewal ? new Date(existing!.expires_at) : now;
  const expiresAt = plusDays(base, POST_OFFICE_TERM_DAYS);
  const timestamp = now.toISOString();
  const hash = await receiptHash(receipt);

  try {
    const results = await env.AUTH_DB.batch([
      env.AUTH_DB.prepare(`
        INSERT INTO aliases
          (name, forward_kind, forward_target, owner, receipt_hash, agent_id, created_at,
           renewed_at, expires_at, forwarded_count, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active')
        ON CONFLICT(name) DO UPDATE SET
          forward_kind = excluded.forward_kind,
          forward_target = excluded.forward_target,
          owner = excluded.owner,
          receipt_hash = excluded.receipt_hash,
          agent_id = excluded.agent_id,
          created_at = CASE
            WHEN lower(aliases.owner) = lower(excluded.owner) THEN aliases.created_at
            ELSE excluded.created_at
          END,
          renewed_at = excluded.renewed_at,
          expires_at = excluded.expires_at,
          forwarded_count = CASE
            WHEN lower(aliases.owner) = lower(excluded.owner) THEN aliases.forwarded_count
            ELSE 0
          END,
          status = 'active'
        WHERE aliases.status <> 'active'
           OR aliases.expires_at <= ?
           OR lower(aliases.owner) = lower(excluded.owner)
      `).bind(
        input.name,
        input.forward.kind,
        input.forward.target,
        owner,
        hash,
        identity.agentId,
        timestamp,
        timestamp,
        expiresAt,
        timestamp,
      ),
      env.AUTH_DB.prepare(`
        INSERT INTO alias_receipts (receipt_hash, alias_name, action, event_at)
        SELECT ?, ?, ?, ?
        WHERE EXISTS (
          SELECT 1 FROM aliases WHERE name = ? AND receipt_hash = ?
        )
      `).bind(hash, input.name, action, timestamp, input.name, hash),
    ]);
    if ((results[0]?.meta.changes ?? 0) !== 1 || (results[1]?.meta.changes ?? 0) !== 1) {
      return json({ error: 'Payment settled but the alias changed concurrently; contact abuse@pointcast.xyz.' }, 409);
    }
  } catch (error) {
    console.error(JSON.stringify({
      message: 'post office registry write failed after settlement',
      alias: input.name,
      receiptHash: hash,
      error: error instanceof Error ? error.message : String(error),
    }));
    return json({ error: 'Payment settled but the registry write failed; contact abuse@pointcast.xyz.', receipt }, 502);
  }

  receipt = await finalizeX402Receipt(
    env,
    receipt,
    { ok: true, action, alias: aliasAddress(input.name), expiresAt },
    aliasAddress(input.name),
    expectedPublicKey,
  );

  return new Response(JSON.stringify({ alias: aliasAddress(input.name), expiresAt, agentId: identity.agentId, receipt }, null, 2), {
    status: 200,
    headers: settlement.headers,
  });
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: JSON_HEADERS });
export const onRequestPost: PagesFunction<AliasEnv> = async ({ request, env }) => handleAliasRequest(request, env);
