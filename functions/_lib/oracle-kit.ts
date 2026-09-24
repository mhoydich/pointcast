/**
 * The oracle kit: one spec per PointCast oracle, two payment rails, one ledger.
 *
 *   Etherlink — POST /api/agent/<id>   Permit2 via TZ APAC (x402-gate.ts), paid-intent
 *                                      recovery by Idempotency-Key. Open today.
 *   Base      — GET  /api/oracle/<id>  EIP-3009 via Coinbase CDP (x402-base.ts), listed
 *                                      in the x402 Bazaar after the first settled call.
 *
 * Every settled cent writes one `splits` row, 50/50. The spec's `contributor` is
 * recorded as the row's maker / maker_address: that is the data-dividend ledger,
 * the record of whose facts earned the network half. Payouts are a separate,
 * human step; the ledger only says who is owed.
 *
 * An answer is computed BEFORE settlement on both rails. If the answer cannot be
 * produced (an upstream source is down, rate-limited, or returned junk), the spec
 * throws OracleUnavailable and nobody is charged.
 */
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';
import {
  attachPaidIntent,
  acquirePaidSettlement,
  beginPaidIntent,
  PAID_ACTION_HEADERS,
  PAID_TOWN_PRICE_UNITS,
  paidIntentJson,
  paidJson,
  readBoundedJson,
  settlementWasAmbiguous,
  updatePaidIntent,
} from './paid-town-actions.ts';
import { finalizeX402Receipt, withX402, x402TransactionHash, X402PreSettlementError } from './x402-gate.ts';
import {
  authorizationUsed,
  BASE_HEADERS,
  BASE_NETWORK,
  baseJson,
  baseRailConfig,
  baseRequestContext,
  baseServer,
  eip3009Identity,
  protocolResponse,
  termsOk,
  type BaseRailEnv,
  type FacilitatorLike,
} from './x402-base.ts';
import { canonicalJson, importReceiptPrivateKey, signCanonicalPayload, X402_TREASURY_AGENT_ID, X402_TREASURY_PUBLIC_KEY } from '../../src/lib/x402.ts';

import { OracleUnavailable } from './oracle-errors.ts';

export { OracleUnavailable };

export interface OracleContributor {
  /** Recorded as splits.maker: who supplied the facts. */
  name: string;
  /** Recorded as splits.maker_address when the contributor has a payout address. */
  address?: string | null;
  /** Human note on how the network half is handled for this source. */
  terms: string;
}

export interface OracleSpec<Q> {
  id: string;
  /** splits.action for this oracle. The Base rail's intents use `${action}-base`. */
  action: string;
  name: string;
  room: string;
  /** 500 characters or fewer; the CDP facilitator rejects longer. */
  description: string;
  tags: string[];
  contributor: OracleContributor;
  /** Parse a JSON body (Etherlink) or the object built from query params (Base). */
  parse(input: unknown): Q | string;
  fromParams(params: URLSearchParams): Record<string, unknown>;
  answer(query: Q, env: OracleEnv): Promise<Record<string, unknown>>;
  /** Bazaar discovery for the GET route: example query params, schema, output. */
  discovery: {
    input: Record<string, string>;
    inputSchema: Record<string, unknown>;
    output: { example: unknown; schema: Record<string, unknown> };
  };
  /** Free preview, if the oracle offers one (never the paid records). */
  preview?(query: Q, env: OracleEnv): Promise<Record<string, unknown>> | Record<string, unknown>;
}

export type OracleEnv = Cloudflare.Env & BaseRailEnv & { AUTH_DB?: D1Database; X402_RECEIPT_SK?: string };

export interface OracleOptions {
  expectedPublicKey?: string;
  facilitator?: FacilitatorLike;
  authorizationUsed?: typeof authorizationUsed;
}

export const etherlinkEndpoint = (spec: OracleSpec<unknown>) => `https://pointcast.xyz/api/agent/${spec.id}`;
export const baseEndpoint = (spec: OracleSpec<unknown>) => `https://pointcast.xyz/api/oracle/${spec.id}`;
export const baseRoute = (spec: OracleSpec<unknown>) => `GET /api/oracle/${spec.id}`;

// ─────────────────────────── attestation ───────────────────────────

/**
 * Sign an answer with the town treasury key (the same Ed25519 key that signs
 * x402 receipts), so an agent can cite or settle on it later. Unsigned, and
 * saying so, when the key is not configured.
 */
export async function attest(env: OracleEnv, spec: OracleSpec<unknown>, answer: Record<string, unknown>) {
  const statement = { oracle: spec.id, issuedAt: new Date().toISOString(), answer };
  const payload = canonicalJson(statement);
  if (!env.X402_RECEIPT_SK) {
    return { ...statement, attestation: { signed: false, reason: 'treasury signing key not configured on this deployment' } };
  }
  try {
    const key = await importReceiptPrivateKey(env.X402_RECEIPT_SK);
    const signature = await signCanonicalPayload(payload, key);
    return {
      ...statement,
      attestation: {
        signed: true, alg: 'Ed25519', signer: X402_TREASURY_AGENT_ID, publicKey: X402_TREASURY_PUBLIC_KEY,
        signature, canonicalization: 'pointcast canonicalJson of {oracle, issuedAt, answer}', verify: 'https://pointcast.xyz/api/x402/keys',
      },
    };
  } catch {
    return { ...statement, attestation: { signed: false, reason: 'signing failed on this deployment' } };
  }
}

async function computeAnswer<Q>(spec: OracleSpec<Q>, query: Q, env: OracleEnv) {
  const answer = await spec.answer(query, env);
  return attest(env, spec as OracleSpec<unknown>, answer);
}

function unavailable(error: unknown, json: (body: unknown, status: number, extra?: Record<string, string>) => Response) {
  const retry = error instanceof OracleUnavailable ? error.retryAfterSeconds : 60;
  const message = error instanceof Error ? error.message : 'the oracle could not answer';
  return json({ ok: false, code: 'oracle_unavailable', error: message, transactionSent: false, retryAfterSeconds: retry }, 503, { 'Retry-After': String(retry) });
}

// ─────────────────────────── Etherlink rail ───────────────────────────

function gateCopy(spec: OracleSpec<unknown>) {
  return {
    action: spec.action,
    priceUnits: PAID_TOWN_PRICE_UNITS,
    maker: spec.contributor.name,
    makerAddress: spec.contributor.address ?? null,
    resourceDescription: spec.description,
    merchantUrl: spec.room,
    context: `Paid town oracle: ${spec.name}.`,
  };
}

export async function handleEtherlinkOracle<Q>(spec: OracleSpec<Q>, request: Request, env: OracleEnv, options: OracleOptions = {}): Promise<Response> {
  const copy = gateCopy(spec as OracleSpec<unknown>);
  const paying = Boolean(request.headers.get('Payment-Signature'));
  let input: unknown;
  try {
    input = request.body ? await readBoundedJson(request.clone()) : undefined;
  } catch (error) {
    // readBoundedJson ends in JSON.parse, so an empty body surfaces as a SyntaxError;
    // tell it apart from malformed JSON by checking for any non-whitespace byte.
    const empty = error instanceof SyntaxError && !(await request.clone().text().catch(() => 'x')).trim();
    if (!empty) return paidJson({ ok: false, error: error instanceof Error ? error.message : 'invalid request body' }, 400);
  }
  if (input === undefined) {
    // A bodyless probe gets the price, so crawlers and catalogs can see the terms.
    if (paying) return paidJson({ ok: false, error: 'send the question body with the payment' }, 400);
    if (!env.AUTH_DB) return paidJson({ ok: false, error: 'The split ledger is unavailable; no payment was submitted.' }, 503);
    return (await withX402(request, env, { ...copy, expectedPublicKey: options.expectedPublicKey })).response;
  }
  const query = spec.parse(input);
  if (typeof query === 'string') return paidJson({ ok: false, error: query }, 400);
  if (!env.AUTH_DB) return paidJson({ ok: false, error: 'The split ledger is unavailable; no payment was submitted.' }, 503);

  const begun = await beginPaidIntent(request, env.AUTH_DB, spec.action, { ...(query as object) });
  if (begun.kind === 'response') return begun.response;
  const intentId = begun.kind === 'quote' ? null : begun.intent.id;

  // Answer first: if the sources are down, refuse before any payment is submitted.
  let answer: Record<string, unknown> | null = null;
  if (begun.kind === 'settle') {
    try { answer = await computeAnswer(spec, query, env); }
    catch (error) { return unavailable(error, (b, s, e) => paidJson(b, s, new Headers(e))); }
  }

  let gate;
  if (begun.kind === 'resume') {
    gate = { settled: true as const, response: new Response(null, { headers: PAID_ACTION_HEADERS }), ...begun.settlement };
  } else {
    gate = await withX402(request, env, {
      ...copy,
      expectedPublicKey: options.expectedPublicKey,
      requestHash: begun.kind === 'quote' ? null : begun.intent.request_hash,
      resourceId: intentId,
      agentId: begun.kind === 'quote' ? null : begun.intent.agent_id,
      ...(intentId ? {
        beforeSettlement: async () => {
          if (!await acquirePaidSettlement(env.AUTH_DB!, intentId)) {
            throw new X402PreSettlementError(202, { ok: false, error: 'action-already-in-progress' });
          }
        },
      } : {}),
    });
    if (!gate.settled) {
      if (!intentId) return gate.response;
      if (gate.response.status === 202) return attachPaidIntent(gate.response, intentId);
      await updatePaidIntent(env.AUTH_DB, intentId,
        settlementWasAmbiguous(gate.response) ? 'settlement_ambiguous' : 'settlement_failed',
        { error: `settlement-response-${gate.response.status}` });
      return attachPaidIntent(gate.response, intentId);
    }
    if (intentId) {
      await updatePaidIntent(env.AUTH_DB, intentId, 'settled', {
        txHash: x402TransactionHash(gate.receipt),
        agentId: begun.kind === 'quote' ? null : begun.intent.agent_id,
        settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
      });
    }
  }

  if (!intentId) return gate.response;
  await updatePaidIntent(env.AUTH_DB, intentId, 'acting');
  // A resumed intent (settled earlier, answer lost) recomputes; a fresh one reuses the pre-settlement answer.
  if (!answer) {
    try { answer = await computeAnswer(spec, query, env); }
    catch (error) {
      await updatePaidIntent(env.AUTH_DB, intentId, 'action_failed', { error: 'answer-unavailable-after-settlement' });
      return unavailable(error, (b, s, e) => paidIntentJson(intentId, b, s, new Headers(e)));
    }
  }
  const actionResult = { ok: true, action: spec.action, oracle: spec.id, actionId: intentId, rail: 'etherlink', result: answer };
  gate.receipt = await finalizeX402Receipt(env, gate.receipt,
    { ok: true, action: spec.action, actionId: intentId, answerHash: await sha256Hex(canonicalJson(answer)) },
    intentId, options.expectedPublicKey);
  const result = { ...actionResult, receipt: gate.receipt, split: gate.split };
  await updatePaidIntent(env.AUTH_DB, intentId, 'succeeded', {
    settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
    result,
  });
  return paidIntentJson(intentId, result, 200, gate.response.headers);
}

/** GET on the Etherlink path: `?preview=1` is the free preview, anything else is the 402 quote. */
export async function handleEtherlinkGet<Q>(spec: OracleSpec<Q>, request: Request, env: OracleEnv, options: OracleOptions = {}): Promise<Response> {
  const url = new URL(request.url);
  if (url.searchParams.get('preview') !== '1' || !spec.preview) {
    if (!env.AUTH_DB) return paidJson({ ok: false, error: 'The split ledger is unavailable; no payment was submitted.' }, 503);
    return (await withX402(request, env, { ...gateCopy(spec as OracleSpec<unknown>), expectedPublicKey: options.expectedPublicKey })).response;
  }
  const query = spec.parse(spec.fromParams(url.searchParams));
  if (typeof query === 'string') return paidJson({ ok: false, error: query }, 400);
  try {
    return paidJson({
      ok: true, preview: true, ...(await spec.preview(query, env)),
      note: `Free preview only. Pay 0.01 USDC at ${etherlinkEndpoint(spec as OracleSpec<unknown>)} (Etherlink) or ${baseEndpoint(spec as OracleSpec<unknown>)} (Base) for the full signed answer.`,
    });
  } catch (error) {
    return unavailable(error, (b, s, e) => paidJson(b, s, new Headers(e)));
  }
}

// ─────────────────────────── Base rail ───────────────────────────

interface Row { status: string; request_hash: string; result_json: string | null; tx_hash: string | null; updated_at: string }

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function baseRouteConfig(spec: OracleSpec<unknown>) {
  return {
    route: baseRoute(spec),
    config: {
      description: spec.description,
      mimeType: 'application/json',
      serviceName: `PointCast ${spec.name}`,
      tags: spec.tags,
      extensions: declareDiscoveryExtension({ input: spec.discovery.input, inputSchema: spec.discovery.inputSchema, output: spec.discovery.output }),
      unpaidResponseBody: () => ({
        contentType: 'application/json',
        body: {
          ok: false, code: 'payment_required', oracle: spec.id, price: '$0.01', network: BASE_NETWORK, asset: 'USDC', room: spec.room,
          note: 'Send the same GET with a Payment-Signature. Resending it after a lost response returns the stored answer without a second charge.',
        },
      }),
    },
  };
}

export async function handleBaseOracle<Q>(spec: OracleSpec<Q>, request: Request, env: OracleEnv, options: OracleOptions = {}): Promise<Response> {
  const s = spec as OracleSpec<unknown>;
  const intentAction = `${spec.action}-base`;
  const cfg = baseRailConfig(env);
  if (!cfg.ready) {
    return baseJson({
      ok: false, code: 'base_rail_not_configured', state: cfg.state, transactionSent: false,
      etherlink: `POST ${etherlinkEndpoint(s)} answers the same questions on Etherlink today.`,
    }, 503);
  }
  if (!env.AUTH_DB) return baseJson({ ok: false, code: 'ledger_unavailable', transactionSent: false }, 503);
  const db = env.AUTH_DB;
  const url = new URL(request.url);
  const context = baseRequestContext(request);
  const identity = eip3009Identity(context.paymentHeader);
  const key = identity ? `${identity.from.toLowerCase()}:${identity.nonce.toLowerCase()}` : null;
  const checkUsed = options.authorizationUsed ?? authorizationUsed;

  const readRow = () => db.prepare(`SELECT status, request_hash, result_json, tx_hash, updated_at FROM paid_action_intents WHERE action = ? AND idempotency_key = ?`)
    .bind(intentAction, key).first<Row>();
  const setRow = (status: string, fields: { result?: unknown; tx?: string | null; error?: string | null } = {}, onlyFrom?: string[]) => {
    const guard = onlyFrom?.length ? ` AND status IN (${onlyFrom.map(() => '?').join(', ')})` : '';
    return db.prepare(`
      UPDATE paid_action_intents
      SET status = ?, result_json = COALESCE(?, result_json), tx_hash = COALESCE(?, tx_hash), error = ?, updated_at = ?
      WHERE action = ? AND idempotency_key = ?${guard}
    `).bind(status, fields.result === undefined ? null : JSON.stringify(fields.result), fields.tx ?? null, fields.error ?? null,
      new Date().toISOString(), intentAction, key, ...(onlyFrom ?? [])).run();
  };
  const stored = (row: Row) => baseJson({ ...JSON.parse(row.result_json ?? '{}'), replay: true }, 200);

  // A resent payment: hand back what it already bought. The payer and nonce are public
  // on Base once settled, so the resend must carry the byte-identical payment header.
  const headerHash = context.paymentHeader ? await sha256Hex(context.paymentHeader) : null;
  if (key) {
    const found = await readRow();
    const row = found && found.request_hash === headerHash ? found : null;
    if (found && !row) return baseJson({ ok: false, code: 'authorization_already_bound', transactionSent: false }, 409);
    if (row?.status === 'succeeded') return stored(row);
    if (row?.status === 'settling') {
      const used = await checkUsed(identity!.from, identity!.nonce);
      if (used === true) {
        await setRow('succeeded', {}, ['settling']);
        return stored(row);
      }
      if (used === null || Date.now() - Date.parse(row.updated_at) < 60_000) {
        return baseJson({ ok: false, code: 'settlement_pending', retry: 'Resend the same request in a minute; you will not be charged twice.' }, 202);
      }
      await setRow('settlement_failed', { error: 'authorization-unused-after-timeout' }, ['settling']);
    }
  }

  let server;
  let payment;
  try {
    server = await baseServer(cfg, baseRouteConfig(s), options.facilitator);
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
  const query = spec.parse(spec.fromParams(url.searchParams));
  if (typeof query === 'string') {
    await cancel(400);
    return baseJson({ ok: false, code: 'invalid_question', error: query, transactionSent: false }, 400);
  }
  let answer: Record<string, unknown>;
  try { answer = await computeAnswer(spec, query, env); }
  catch (error) {
    await cancel(503);
    return unavailable(error, baseJson);
  }

  const result = { ok: true, action: spec.action, oracle: spec.id, rail: 'base', result: answer };
  const now = new Date().toISOString();
  try {
    await db.prepare(`
      INSERT INTO paid_action_intents
        (id, action, idempotency_key, request_hash, request_json, status, capacity_key,
         settlement_json, result_json, tx_hash, agent_id, error, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'created', NULL, NULL, ?, NULL, NULL, NULL, ?, ?)
      ON CONFLICT(action, idempotency_key) DO NOTHING
    `).bind(`pai_${crypto.randomUUID().replaceAll('-', '')}`, intentAction, key, headerHash, JSON.stringify(query), JSON.stringify(result), now, now).run();
    const won = await db.prepare(`
      UPDATE paid_action_intents SET status = 'settling', result_json = ?, error = NULL, updated_at = ?
      WHERE action = ? AND idempotency_key = ? AND status IN ('created', 'settlement_failed')
      RETURNING id
    `).bind(JSON.stringify(result), now, intentAction, key).first<{ id: string }>();
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
    const used = await checkUsed(identity!.from, identity!.nonce);
    if (used !== true) {
      await db.prepare(`UPDATE paid_action_intents SET error = ?, updated_at = ? WHERE action = ? AND idempotency_key = ? AND status = 'settling'`)
        .bind(String(settled.errorReason).slice(0, 200), new Date().toISOString(), intentAction, key).run().catch(() => undefined);
      return protocolResponse(settled.response);
    }
    tx = null;
  }

  const final = { ...result, payment: { network: BASE_NETWORK, transaction: tx, payer: settled.payer || identity!.from, amount: '0.01 USDC' } };
  await setRow('succeeded', { result: final, tx }, ['settling']).catch(() => undefined);
  // The split ledger (and data-dividend record): tx hash is the unique key, or payer + nonce
  // when the chain confirmed the payment but the facilitator lost the hash.
  const amount = 10_000;
  await db.prepare(`
    INSERT INTO splits (receipt_hash, action, amount_units, house_units, network_units, maker, maker_address, settled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(receipt_hash) DO NOTHING
  `).bind(tx ? `base:${tx.toLowerCase()}` : `base:${key}`, spec.action, amount, amount / 2, amount / 2,
    spec.contributor.name, spec.contributor.address ?? null, new Date().toISOString()).run().catch(() => undefined);
  return baseJson(final, 200, settled.success ? settled.headers : {});
}

export { BASE_HEADERS, PAID_ACTION_HEADERS };
