/**
 * /api/agent/memo — seal a Pool Together parcel memo with one cent.
 *
 * Same body as the free desk at /api/pool-together/memo. Settles 0.01 USDC on
 * Etherlink through the shared x402 gate, records the 50/50 house/network
 * split, stores the memo with the receipt hash, payer, and tx, and returns the
 * countersigned receipt. Sealed memos sort first in the register.
 *
 * Canonical request body (what the intent hashes): the normalized memo with
 * sorted keys and nulls omitted — { agent, kind, lot, note, apn?, address?, source? }.
 */
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
  withX402,
  x402TransactionHash,
  X402PreSettlementError,
} from '../../_lib/x402-gate.ts';
import { countAllMemos, insertMemo, newMemoId, normalizeMemo, publicMemo, registerTotals, type Memo, type PoolTogetherEnv } from '../pool-together/_store';
import { LIMITS } from '../../../src/lib/pool-together.ts';

type AgentMemoEnv = Cloudflare.Env & PoolTogetherEnv & { AUTH_DB?: D1Database };

export async function handleAgentMemo(
  request: Request,
  env: AgentMemoEnv,
  options: { expectedPublicKey?: string } = {},
): Promise<Response> {
  let input: unknown;
  try {
    input = await readBoundedJson(request.clone());
  } catch (error) {
    return paidJson({ ok: false, error: error instanceof Error ? error.message : 'invalid request body' }, 400);
  }
  const normalized = normalizeMemo(input);
  if (!normalized.ok) return paidJson({ ok: false, error: normalized.error }, 400);
  if (!env.AUTH_DB) {
    return paidJson({ ok: false, error: 'The memo register and split ledger are unavailable; no payment was submitted.' }, 503);
  }
  if (await countAllMemos(env.AUTH_DB) >= LIMITS.memosKept) {
    return paidJson({ ok: false, error: `The register holds ${LIMITS.memosKept} memos; no payment was submitted.` }, 409);
  }

  const begun = await beginPaidIntent(request, env.AUTH_DB, 'memo', normalized.canonical);
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
      action: 'memo',
      priceUnits: PAID_TOWN_PRICE_UNITS,
      maker: 'town',
      expectedPublicKey: options.expectedPublicKey,
      resourceDescription: 'Seal one Pool Together parcel memo (assessor number or address, kind, source, 140-character note).',
      merchantUrl: 'https://pointcast.xyz/pool-together',
      context: 'Paid town action: an agent seals a parcel memo in the Pool Together survey register.',
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

  const memo: Memo = {
    id: newMemoId(),
    ...normalized.memo,
    agentId: begun.kind === 'quote' ? null : begun.intent.agent_id,
    t: Date.now(),
    sealed: { receiptHash: gate.receiptHash, payer: gate.payer, txHash: x402TransactionHash(gate.receipt) ?? null, actionId: intentId },
  };
  let stored: Memo | null = null;
  try {
    stored = await insertMemo(env.AUTH_DB, memo, null);
  } catch {
    stored = null;
  }
  if (!stored) {
    const actionResult = {
      ok: false,
      actionCompleted: false,
      actionId: intentId,
      error: 'Payment settled but the register could not store the memo.',
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

  const totals = await registerTotals(env.AUTH_DB).catch(() => null);
  const actionResult = { ok: true, action: 'memo', actionId: intentId, memo: publicMemo(stored), register: totals?.count ?? null, eligible: totals?.eligible ?? null };
  gate.receipt = await finalizeX402Receipt(env, gate.receipt, actionResult, intentId, options.expectedPublicKey);
  const result = { ...actionResult, receipt: gate.receipt, split: gate.split };
  await updatePaidIntent(env.AUTH_DB, intentId, 'succeeded', {
    settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
    result,
  });
  return paidIntentJson(intentId, result, 200, gate.response.headers);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });

export const onRequestPost: PagesFunction<AgentMemoEnv> = async ({ request, env }) =>
  handleAgentMemo(request, env);
