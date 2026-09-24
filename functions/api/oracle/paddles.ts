/**
 * GET /api/oracle/paddles — The Paddle Oracle on Base (x402 v2, CDP facilitator,
 * listed in the CDP x402 Bazaar after its first settled payment).
 *
 *   GET /api/oracle/paddles?q=…&maxPrice=…&build=…&thicknessMm=…&usap=…&year=…&limit=…
 *   no payment → 402 with Base terms (0.01 USDC) + Bazaar discovery info
 *   Payment-Signature (EIP-3009 "exact") → verify, answer, settle, 200
 *
 * Order: verify with the facilitator, compute the answer, store it against the
 * payer + authorization nonce, settle, then return it. If the response is lost
 * after settlement, sending the same request with the same Payment-Signature
 * returns the stored answer without a second charge (EIP-3009 nonces are single
 * use, so a replay cannot settle twice anyway).
 *
 * The Etherlink rail for the same answers stays at POST /api/agent/oracle.
 */
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';
import {
  authorizationUsed,
  BASE_NETWORK,
  baseJson,
  baseRailConfig,
  baseRequestContext,
  baseServer,
  BASE_HEADERS,
  eip3009Identity,
  protocolResponse,
  termsOk,
  type BaseRailEnv,
  type FacilitatorLike,
} from '../../_lib/x402-base.ts';
import {
  answerOracle,
  ORACLE_LIMIT_MAX,
  ORACLE_Q_CAP,
  ORACLE_ROOM,
  oracleBodyFromParams,
  parseOracleQuery,
} from '../../../src/lib/paddle-oracle.ts';

export const ORACLE_BASE_ROUTE = 'GET /api/oracle/paddles';
export const ORACLE_BASE_URL = 'https://pointcast.xyz/api/oracle/paddles';
const ACTION = 'oracle-base';

type Env = BaseRailEnv & { AUTH_DB?: D1Database };
interface Options { facilitator?: FacilitatorLike; authorizationUsed?: typeof authorizationUsed }

const bazaar = declareDiscoveryExtension({
  input: { q: 'control paddle for a 4.0 player', maxPrice: '200', usap: 'true' },
  inputSchema: {
    type: 'object',
    properties: {
      q: { type: 'string', maxLength: ORACLE_Q_CAP, description: 'Free-text question: a paddle name, a pro, or words like control, power, spin, foam, elongated.' },
      maxPrice: { type: 'string', pattern: '^\\d+(\\.\\d+)?$', description: 'Highest list price in USD (1-2000).' },
      build: { type: 'string', enum: ['foam', 'hybrid', 'poly', 'rib'], description: 'Core build.' },
      thicknessMm: { type: 'string', pattern: '^\\d+(\\.\\d+)?$', description: 'Core thickness in mm (8-25), e.g. 16.' },
      usap: { type: 'string', enum: ['true', 'false'], description: 'true = only paddles on the USA Pickleball approved list.' },
      year: { type: 'string', pattern: '^20\\d\\d$', description: 'Launch year.' },
      limit: { type: 'string', pattern: '^[1-5]$', description: `Records to return (1-${ORACLE_LIMIT_MAX}, default 3).` },
    },
    additionalProperties: false,
  },
  output: {
    example: {
      ok: true,
      oracle: {
        answer: '23 paddles in the register match. Best 3: …',
        matched: 23,
        paddles: [{ id: 'franklin-c45-aurelius', brand: 'Franklin', model: 'C45 Aurelius', listPriceUsd: 229.99, sources: ['https://…'] }],
      },
    },
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        oracle: {
          type: 'object',
          properties: {
            answer: { type: 'string' },
            matched: { type: 'integer' },
            paddles: { type: 'array', items: { type: 'object', description: 'Paddle Register record: specs, legality, core, variants, timeline, lab links, changes, sources.' } },
          },
          required: ['answer', 'matched', 'paddles'],
        },
      },
      required: ['ok', 'oracle'],
    },
  },
});

const ROUTE = {
  route: ORACLE_BASE_ROUTE,
  config: {
    description: 'The Paddle Oracle: ask the PointCast Paddle Register (92 pickleball paddles, 2025-2026) one question and get up to 5 sourced records: specs, USAP/UPA-A legality, core, launch timeline, lab links, changes. Deterministic search, no LLM. Every fact carries its source URL.',
    mimeType: 'application/json',
    serviceName: 'PointCast Paddle Oracle',
    tags: ['pickleball', 'oracle', 'reference-data', 'sourced', 'sports'],
    extensions: bazaar,
    unpaidResponseBody: () => ({
      contentType: 'application/json',
      body: {
        ok: false, code: 'payment_required', price: '$0.01', network: BASE_NETWORK, asset: 'USDC',
        room: ORACLE_ROOM, freePreview: 'https://pointcast.xyz/api/agent/oracle?preview=1&q=…',
        note: 'Send the same GET with a Payment-Signature. Resending it after a lost response returns the stored answer without a second charge.',
      },
    }),
  },
};

interface Row { status: string; request_hash: string; result_json: string | null; tx_hash: string | null; updated_at: string }

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function readRow(db: D1Database, key: string): Promise<Row | null> {
  return db.prepare(`SELECT status, request_hash, result_json, tx_hash, updated_at FROM paid_action_intents WHERE action = ? AND idempotency_key = ?`)
    .bind(ACTION, key).first<Row>();
}

async function setRow(db: D1Database, key: string, status: string, fields: { result?: unknown; tx?: string | null; error?: string | null } = {}, onlyFrom?: string[]) {
  const now = new Date().toISOString();
  const guard = onlyFrom?.length ? ` AND status IN (${onlyFrom.map(() => '?').join(', ')})` : '';
  return db.prepare(`
    UPDATE paid_action_intents
    SET status = ?, result_json = COALESCE(?, result_json), tx_hash = COALESCE(?, tx_hash), error = ?, updated_at = ?
    WHERE action = ? AND idempotency_key = ?${guard}
  `).bind(status, fields.result === undefined ? null : JSON.stringify(fields.result), fields.tx ?? null, fields.error ?? null, now, ACTION, key, ...(onlyFrom ?? [])).run();
}

const stored = (row: Row, replay: boolean) => {
  const body = JSON.parse(row.result_json ?? '{}');
  return baseJson({ ...body, replay }, 200);
};

export async function handleOracleBase(request: Request, env: Env, options: Options = {}): Promise<Response> {
  const cfg = baseRailConfig(env);
  if (!cfg.ready) {
    return baseJson({
      ok: false, code: 'base_rail_not_configured', state: cfg.state, transactionSent: false,
      etherlink: 'POST https://pointcast.xyz/api/agent/oracle answers the same questions on Etherlink today.',
    }, 503);
  }
  if (!env.AUTH_DB) return baseJson({ ok: false, code: 'ledger_unavailable', transactionSent: false }, 503);
  const db = env.AUTH_DB;
  const url = new URL(request.url);
  const context = baseRequestContext(request);
  const identity = eip3009Identity(context.paymentHeader);
  const key = identity ? `${identity.from.toLowerCase()}:${identity.nonce.toLowerCase()}` : null;

  // A resent payment: hand back what it already bought. The payer and nonce are public
  // on Base once settled, so the resend must carry the byte-identical payment header.
  const headerHash = context.paymentHeader ? await sha256Hex(context.paymentHeader) : null;
  if (key) {
    const found = await readRow(db, key);
    const row = found && found.request_hash === headerHash ? found : null;
    if (found && !row) return baseJson({ ok: false, code: 'authorization_already_bound', transactionSent: false }, 409);
    if (row?.status === 'succeeded') return stored(row, true);
    if (row?.status === 'settling') {
      const used = await (options.authorizationUsed ?? authorizationUsed)(identity!.from, identity!.nonce);
      if (used === true) {
        await setRow(db, key, 'succeeded', {}, ['settling']);
        return stored(row, true);
      }
      if (used === null || Date.now() - Date.parse(row.updated_at) < 60_000) {
        return baseJson({ ok: false, code: 'settlement_pending', retry: 'Resend the same request in a minute; you will not be charged twice.' }, 202);
      }
      await setRow(db, key, 'settlement_failed', { error: 'authorization-unused-after-timeout' }, ['settling']);
    }
  }

  let server;
  let payment;
  try {
    server = await baseServer(cfg, ROUTE, options.facilitator);
    payment = await server.processHTTPRequest(context);
  } catch {
    return baseJson({ ok: false, code: 'facilitator_unavailable', transactionSent: false }, 502);
  }
  if (payment.type === 'payment-error') return protocolResponse(payment.response);
  if (payment.type !== 'payment-verified') return baseJson({ ok: false, code: 'payment_gate_misconfigured', transactionSent: false }, 503);

  const cancel = async (status: number) => {
    try { await payment.cancellationDispatcher.cancel({ reason: 'handler_failed', responseStatus: status }); } catch { /* unsettled either way */ }
  };
  let resourceOk = false;
  try { resourceOk = new URL(String(payment.paymentPayload.resource?.url)).pathname === url.pathname; } catch { /* fail closed */ }
  if (!key || !resourceOk || !termsOk(cfg, payment.paymentRequirements, identity)) {
    await cancel(400);
    return baseJson({ ok: false, code: 'payment_terms_or_resource_mismatch', transactionSent: false }, 400);
  }
  const query = parseOracleQuery(oracleBodyFromParams(url.searchParams));
  if (typeof query === 'string') {
    await cancel(400);
    return baseJson({ ok: false, code: 'invalid_question', error: query, transactionSent: false }, 400);
  }

  const result = { ok: true, action: 'oracle', rail: 'base', oracle: answerOracle(query) };
  const now = new Date().toISOString();
  try {
    await db.prepare(`
      INSERT INTO paid_action_intents
        (id, action, idempotency_key, request_hash, request_json, status, capacity_key,
         settlement_json, result_json, tx_hash, agent_id, error, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'created', NULL, NULL, ?, NULL, NULL, NULL, ?, ?)
      ON CONFLICT(action, idempotency_key) DO NOTHING
    `).bind(`pai_${crypto.randomUUID().replaceAll('-', '')}`, ACTION, key, headerHash, JSON.stringify(query), JSON.stringify(result), now, now).run();
    const won = await db.prepare(`
      UPDATE paid_action_intents SET status = 'settling', result_json = ?, error = NULL, updated_at = ?
      WHERE action = ? AND idempotency_key = ? AND status IN ('created', 'settlement_failed')
      RETURNING id
    `).bind(JSON.stringify(result), now, ACTION, key).first<{ id: string }>();
    if (!won) {
      await cancel(409);
      return baseJson({ ok: false, code: 'settlement_pending', retry: 'This payment is already being settled. Resend the same request in a minute.' }, 202);
    }
  } catch {
    await cancel(503);
    return baseJson({ ok: false, code: 'ledger_unavailable', transactionSent: false }, 503);
  }

  let settled;
  try {
    settled = await server.processSettlement(
      payment.paymentPayload, payment.paymentRequirements, payment.declaredExtensions,
      { request: context, responseBody: new TextEncoder().encode(JSON.stringify(result)) as never, responseHeaders: { 'content-type': 'application/json' } },
      undefined, payment.beforeHandlerSettlement,
    );
  } catch {
    // A timeout is not proof of non-payment. The row stays 'settling'; a resend checks the chain.
    return baseJson({ ok: false, code: 'settlement_pending', retry: 'Resend the same request in a minute; you will not be charged twice.' }, 202);
  }
  let tx = /^0x[0-9a-fA-F]{64}$/.test(settled.transaction ?? '') ? settled.transaction! : null;
  if (!settled.success) {
    // The SDK reports timeouts and real rejections the same way, so ask the chain.
    // If the authorization was used, the payer paid: answer. Otherwise keep the row
    // 'settling' so a resend re-checks the chain before anything settles again.
    const used = await (options.authorizationUsed ?? authorizationUsed)(identity!.from, identity!.nonce);
    if (used !== true) {
      await db.prepare(`UPDATE paid_action_intents SET error = ?, updated_at = ? WHERE action = ? AND idempotency_key = ? AND status = 'settling'`)
        .bind(String(settled.errorReason).slice(0, 200), new Date().toISOString(), ACTION, key).run().catch(() => undefined);
      return protocolResponse(settled.response);
    }
    tx = null;
  }

  const final = { ...result, payment: { network: BASE_NETWORK, transaction: tx, payer: settled.payer || identity!.from, amount: '0.01 USDC' } };
  await setRow(db, key, 'succeeded', { result: final, tx }, ['settling']).catch(() => undefined);
  {
    // Same 50/50 split ledger as every paid town action. The tx hash is the unique key,
    // or the payer + nonce when the chain confirmed the payment but the facilitator lost the hash.
    const amount = 10_000;
    await db.prepare(`
      INSERT INTO splits (receipt_hash, action, amount_units, house_units, network_units, maker, maker_address, settled_at)
      VALUES (?, 'oracle', ?, ?, ?, 'paddle-register', NULL, ?)
      ON CONFLICT(receipt_hash) DO NOTHING
    `).bind(tx ? `base:${tx.toLowerCase()}` : `base:${key}`, amount, amount / 2, amount / 2, new Date().toISOString()).run().catch(() => undefined);
  }
  return baseJson(final, 200, settled.success ? settled.headers : {});
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: BASE_HEADERS });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => handleOracleBase(request, env);
