/**
 * /api/agent/oracle — The Paddle Oracle. One cent, one sourced answer.
 *
 * POST {q?, maxPrice?, build?, thicknessMm?, usap?, year?, limit?}
 *   no Payment-Signature → 402 with x402 v2 terms (0.01 USDC)
 *   with Payment-Signature + Idempotency-Key → settle, answer, signed receipt
 * A bare GET or a bodyless POST also returns the 402 quote, so a crawler
 * that probes without a body still sees the price.
 * GET ?preview=1&q=… is free and only says how many paddles would match.
 *
 * Built on the same paid-intent path as /api/agent/bench: retries with the
 * same Idempotency-Key return the stored answer and never settle twice.
 */
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
} from '../../_lib/paid-town-actions.ts';
import {
  finalizeX402Receipt,
  withX402,
  x402TransactionHash,
  X402PreSettlementError,
} from '../../_lib/x402-gate.ts';
import {
  answerOracle,
  ORACLE_ACTION,
  ORACLE_ROOM,
  parseOracleQuery,
  previewOracle,
  type OracleQuery,
} from '../../../src/lib/paddle-oracle.ts';

type OracleEnv = Cloudflare.Env & { AUTH_DB?: D1Database };
interface OracleOptions { expectedPublicKey?: string }

const GATE_COPY = {
  action: ORACLE_ACTION,
  priceUnits: PAID_TOWN_PRICE_UNITS,
  maker: 'paddle-register',
  resourceDescription: 'The Paddle Oracle: one sourced answer from the PointCast Paddle Register (up to 5 paddle records, every fact with its source URL).',
  merchantUrl: ORACLE_ROOM,
  context: 'Paid town action: an agent asks the Paddle Register one question and receives sourced records.',
};

async function quote(request: Request, env: OracleEnv, options: OracleOptions): Promise<Response> {
  return (await withX402(request, env, { ...GATE_COPY, expectedPublicKey: options.expectedPublicKey })).response;
}

export async function handleAgentOracle(
  request: Request,
  env: OracleEnv,
  options: OracleOptions = {},
): Promise<Response> {
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
    return quote(request, env, options);
  }
  const parsed = parseOracleQuery(input);
  if (typeof parsed === 'string') return paidJson({ ok: false, error: parsed }, 400);
  const query: OracleQuery = parsed;
  if (!env.AUTH_DB) {
    return paidJson({ ok: false, error: 'The split ledger is unavailable; no payment was submitted.' }, 503);
  }

  const begun = await beginPaidIntent(request, env.AUTH_DB, ORACLE_ACTION, { ...query });
  if (begun.kind === 'response') return begun.response;
  const intentId = begun.kind === 'quote' ? null : begun.intent.id;
  let gate;
  if (begun.kind === 'resume') {
    gate = {
      settled: true as const,
      response: new Response(null, { headers: PAID_ACTION_HEADERS }),
      ...begun.settlement,
    };
  } else {
    gate = await withX402(request, env, {
      ...GATE_COPY,
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
      await updatePaidIntent(
        env.AUTH_DB,
        intentId,
        settlementWasAmbiguous(gate.response) ? 'settlement_ambiguous' : 'settlement_failed',
        { error: `settlement-response-${gate.response.status}` },
      );
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

  // The answer is a pure read of committed data, so it cannot fail after payment
  // except by a bug; the receipt binds whatever we return.
  const oracle = answerOracle(query);
  const actionResult = { ok: true, action: ORACLE_ACTION, actionId: intentId, oracle };
  gate.receipt = await finalizeX402Receipt(env, gate.receipt, { ok: true, action: ORACLE_ACTION, actionId: intentId, answer: oracle.answer, matched: oracle.matched, ids: oracle.paddles.map((p) => p.id) }, intentId, options.expectedPublicKey);
  const result = { ...actionResult, receipt: gate.receipt, split: gate.split };
  await updatePaidIntent(env.AUTH_DB, intentId, 'succeeded', {
    settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
    result,
  });
  return paidIntentJson(intentId, result, 200, gate.response.headers);
}

export function handleOracleGet(request: Request, env: OracleEnv, options: OracleOptions = {}): Promise<Response> | Response {
  const url = new URL(request.url);
  if (url.searchParams.get('preview') !== '1') {
    if (!env.AUTH_DB) return paidJson({ ok: false, error: 'The split ledger is unavailable; no payment was submitted.' }, 503);
    return quote(request, env, options);
  }
  const p = url.searchParams;
  const body: Record<string, unknown> = {};
  for (const key of ['q', 'build']) if (p.has(key)) body[key] = p.get(key);
  for (const key of ['maxPrice', 'thicknessMm', 'year']) if (p.has(key)) body[key] = Number(p.get(key));
  if (p.has('usap')) body.usap = p.get('usap') === 'true';
  const parsed = parseOracleQuery(body);
  if (typeof parsed === 'string') return paidJson({ ok: false, error: parsed }, 400);
  return paidJson({
    ok: true,
    preview: true,
    ...previewOracle(parsed),
    note: 'Free preview: the count only. POST the same question to /api/agent/oracle with x402 payment (0.01 USDC) for the sourced records.',
  });
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });

export const onRequestPost: PagesFunction<OracleEnv> = async ({ request, env }) =>
  handleAgentOracle(request, env);

export const onRequestGet: PagesFunction<OracleEnv> = async ({ request, env }) =>
  handleOracleGet(request, env);
