import { handleBenchPost, type BenchEnv } from '../bench.ts';
import {
  attachPaidIntent,
  acquirePaidSettlement,
  beginPaidIntent,
  PAID_ACTION_HEADERS,
  PAID_TOWN_PRICE_UNITS,
  paidJson,
  paidIntentJson,
  readBoundedJson,
  settlementWasAmbiguous,
  updatePaidIntent,
} from '../../_lib/paid-town-actions.ts';
import {
  finalizeX402Receipt,
  shortEvmAddress,
  withX402,
  x402TransactionHash,
  X402PreSettlementError,
} from '../../_lib/x402-gate.ts';

const QUESTION_CAP = 280;

type AgentBenchEnv = Cloudflare.Env & BenchEnv & { AUTH_DB?: D1Database };

export async function handleAgentBench(
  request: Request,
  env: AgentBenchEnv,
  options: { expectedPublicKey?: string } = {},
): Promise<Response> {
  let input: unknown;
  try {
    input = await readBoundedJson(request.clone());
  } catch (error) {
    return paidJson({ ok: false, error: error instanceof Error ? error.message : 'invalid request body' }, 400);
  }
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) return paidJson({ ok: false, error: 'question is required' }, 400);
  if (question.length > QUESTION_CAP) {
    return paidJson({ ok: false, error: `question must be ${QUESTION_CAP} characters or fewer` }, 400);
  }
  if (!env.VISITS) {
    return paidJson({ ok: false, error: 'The bench store is unavailable; no payment was submitted.' }, 503);
  }
  if (!env.AUTH_DB) {
    return paidJson({ ok: false, error: 'The split ledger is unavailable; no payment was submitted.' }, 503);
  }

  const begun = await beginPaidIntent(request, env.AUTH_DB, 'bench', { question });
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
      action: 'bench',
      priceUnits: PAID_TOWN_PRICE_UNITS,
      maker: 'town',
      expectedPublicKey: options.expectedPublicKey,
      resourceDescription: 'Ask the PointCast bench one question (280 characters maximum).',
      merchantUrl: 'https://pointcast.xyz/bench',
      context: 'Paid town action: an agent asks one question on the shared PointCast bench.',
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
        settlement: {
          receipt: gate.receipt,
          receiptHash: gate.receiptHash,
          payer: gate.payer,
          split: gate.split,
        },
      });
    }
  }

  if (!intentId) return gate.response;
  await updatePaidIntent(env.AUTH_DB, intentId, 'acting');

  const benchRequest = new Request('https://pointcast.xyz/api/bench', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: shortEvmAddress(gate.payer),
      answer: question,
      sessionId: `paid:${gate.receiptHash}`,
    }),
  });
  const stored = await handleBenchPost(benchRequest, env, { skipRateLimit: true });
  const bench = await stored.json().catch(() => ({ ok: false, error: 'unreadable bench response' }));
  if (!stored.ok) {
    const actionResult = {
      ok: false,
      actionCompleted: false,
      actionId: intentId,
      error: 'Payment settled but the bench could not store the question.',
      bench,
    };
    gate.receipt = await finalizeX402Receipt(env, gate.receipt, actionResult, intentId, options.expectedPublicKey);
    const result = { ...actionResult, receipt: gate.receipt, split: gate.split };
    await updatePaidIntent(env.AUTH_DB, intentId, 'action_failed', {
      settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
      result,
      error: result.error,
    });
    return paidIntentJson(intentId, result, 502, gate.response.headers);
  }

  const actionResult = { ok: true, action: 'bench', actionId: intentId, bench };
  gate.receipt = await finalizeX402Receipt(env, gate.receipt, actionResult, intentId, options.expectedPublicKey);
  const result = { ...actionResult, receipt: gate.receipt, split: gate.split };
  await updatePaidIntent(env.AUTH_DB, intentId, 'succeeded', {
    settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
    result,
  });
  return paidIntentJson(intentId, result, 200, gate.response.headers);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });

export const onRequestPost: PagesFunction<AgentBenchEnv> = async ({ request, env }) =>
  handleAgentBench(request, env);
