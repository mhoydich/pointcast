/**
 * /api/agent/catan-seal — x402 paid town action: open a sealed Catan table.
 *
 * An agent (or anyone with an x402 client) pays 0.01 USDC on Etherlink and
 * gets a sealed table: a balanced forged board plus a 240-roll dice stream
 * whose sha256 commitment is published before the first roll. The payer gets
 * a rollKey to reveal rolls one at a time (POST /api/catan/seal); when the
 * table ends the secret is published and anyone can recompute every roll.
 * Built for remote games, bot tournaments and agent referees where nobody at
 * the table should control the dice.
 *
 * Body: { title?: string (60), players?: 2-6, seed?: board seed words }
 * Same quote → Payment-Signature → intent → receipt flow as /api/agent/bench.
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
import { createSeal, publicSeal } from '../../_lib/catan-store.ts';

type AgentCatanEnv = Cloudflare.Env & { VISITS?: KVNamespace; AUTH_DB?: D1Database };

export async function handleAgentCatanSeal(
  request: Request,
  env: AgentCatanEnv,
  options: { expectedPublicKey?: string } = {},
): Promise<Response> {
  let input: unknown;
  try {
    input = await readBoundedJson(request.clone());
  } catch (error) {
    return paidJson({ ok: false, error: error instanceof Error ? error.message : 'invalid request body' }, 400);
  }
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 60) : '';
  const players = body.players === undefined ? 4 : Number(body.players);
  if (!Number.isInteger(players) || players < 2 || players > 6) return paidJson({ ok: false, error: 'players must be 2-6' }, 400);
  const seed = typeof body.seed === 'string' ? body.seed.trim().slice(0, 32) : '';
  if (!env.VISITS) return paidJson({ ok: false, error: 'The seal store is unavailable; no payment was submitted.' }, 503);
  if (!env.AUTH_DB) return paidJson({ ok: false, error: 'The split ledger is unavailable; no payment was submitted.' }, 503);

  const payload = { title, players, seed };
  const begun = await beginPaidIntent(request, env.AUTH_DB, 'catan-seal', payload);
  if (begun.kind === 'response') return begun.response;
  const intentId = begun.kind === 'quote' ? null : begun.intent.id;
  let gate;
  if (begun.kind === 'resume') {
    gate = { settled: true as const, response: new Response(null, { headers: PAID_ACTION_HEADERS }), ...begun.settlement };
  } else {
    gate = await withX402(request, env, {
      action: 'catan-seal',
      priceUnits: PAID_TOWN_PRICE_UNITS,
      maker: 'town',
      expectedPublicKey: options.expectedPublicKey,
      resourceDescription: 'Open a sealed Catan table: a forged balanced board and a committed 240-roll dice stream.',
      merchantUrl: 'https://catan.pointcast.xyz/',
      context: 'Paid town action: an agent opens a sealed-dice table at Hex & Harbor.',
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
      await updatePaidIntent(env.AUTH_DB, intentId, settlementWasAmbiguous(gate.response) ? 'settlement_ambiguous' : 'settlement_failed', { error: `settlement-response-${gate.response.status}` });
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

  let opened;
  try {
    opened = await createSeal(env.VISITS, payload, { payer: gate.payer, receiptHash: gate.receiptHash });
  } catch {
    const actionResult = { ok: false, actionCompleted: false, actionId: intentId, error: 'Payment settled but the sealed table could not be stored.' };
    gate.receipt = await finalizeX402Receipt(env, gate.receipt, actionResult, intentId, options.expectedPublicKey);
    const result = { ...actionResult, receipt: gate.receipt, split: gate.split };
    await updatePaidIntent(env.AUTH_DB, intentId, 'action_failed', {
      settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
      result,
      error: result.error,
    });
    return paidIntentJson(intentId, result, 502, gate.response.headers);
  }

  const seal = publicSeal(opened.seal);
  // The rollKey is part of the stored intent result so an Idempotency-Key
  // replay returns it again; it is never in the public seal.
  const actionResult = {
    ok: true,
    action: 'catan-seal',
    actionId: intentId,
    seal,
    rollKey: opened.rollKey,
    next: {
      roll: { method: 'POST', url: 'https://pointcast.xyz/api/catan/seal', body: { id: seal.id, rollKey: '<rollKey>', action: 'roll' } },
      reveal: { method: 'POST', url: 'https://pointcast.xyz/api/catan/seal', body: { id: seal.id, rollKey: '<rollKey>', action: 'reveal' } },
      watch: seal.url,
    },
  };
  gate.receipt = await finalizeX402Receipt(env, gate.receipt, { ok: true, action: 'catan-seal', actionId: intentId, seal: seal.id, commitment: seal.commitment }, intentId, options.expectedPublicKey);
  const result = { ...actionResult, receipt: gate.receipt, split: gate.split };
  await updatePaidIntent(env.AUTH_DB, intentId, 'succeeded', {
    settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
    result,
  });
  return paidIntentJson(intentId, result, 200, gate.response.headers);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });

export const onRequestPost: PagesFunction<AgentCatanEnv> = async ({ request, env }) =>
  handleAgentCatanSeal(request, env);
