import { SPELLS } from '../../../src/data/spells.ts';
import { forwardBurst, type BurstEnv } from '../burst.ts';
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
import { shortEvmAddress, withX402, X402PreSettlementError } from '../../_lib/x402-gate.ts';

type AgentCastEnv = Cloudflare.Env & BurstEnv & { AUTH_DB?: D1Database };

const spellById = new Map(SPELLS.map((spell) => [spell.id, spell]));

export async function handleAgentCast(
  request: Request,
  env: AgentCastEnv,
  options: { expectedPublicKey?: string } = {},
): Promise<Response> {
  let input: unknown;
  try {
    input = await readBoundedJson(request.clone());
  } catch (error) {
    return paidJson({ ok: false, error: error instanceof Error ? error.message : 'invalid request body' }, 400);
  }
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const rawWord = typeof body.word === 'string'
    ? body.word
    : typeof body.spell === 'string'
      ? body.spell
      : '';
  const word = rawWord.trim().replace(/^\+/, '').toLowerCase();
  const spell = spellById.get(word);
  if (!spell) {
    return paidJson({
      ok: false,
      error: 'unknown magic word',
      words: SPELLS.map((entry) => entry.id),
    }, 400);
  }
  if (!env.PRESENCE) {
    return paidJson({ ok: false, error: 'The presence room is unavailable; no payment was submitted.' }, 503);
  }
  if (!env.AUTH_DB) {
    return paidJson({ ok: false, error: 'The split ledger is unavailable; no payment was submitted.' }, 503);
  }

  const begun = await beginPaidIntent(request, env.AUTH_DB, 'cast', { word });
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
      action: 'cast',
      priceUnits: PAID_TOWN_PRICE_UNITS,
      maker: 'town',
      expectedPublicKey: options.expectedPublicKey,
      resourceDescription: `Cast +${word} into PointCast's live presence room.`,
      merchantUrl: 'https://pointcast.xyz/spells',
      context: `Paid town action: an agent casts the +${word} magic word into the live room.`,
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

  const burstRequest = new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'cast',
      clientId: `paid:${gate.receiptHash}`,
      by: { handle: shortEvmAddress(gate.payer) },
      meta: { spell: word, label: spell.label, color: spell.accent, paid: true },
    }),
  });
  let burstResponse: Response;
  try {
    burstResponse = await forwardBurst(burstRequest, env);
  } catch (error) {
    console.error('[api/agent/cast] presence forward failed', error);
    const result = {
      ok: false,
      actionCompleted: false,
      actionId: intentId,
      error: 'Payment settled but the room was unavailable.',
      receipt: gate.receipt,
      split: gate.split,
    };
    await updatePaidIntent(env.AUTH_DB, intentId, 'action_failed', { result, error: result.error });
    return paidIntentJson(intentId, result, 502, gate.response.headers);
  }
  const burst = await burstResponse.json().catch(() => ({ ok: false, reason: 'unreadable presence response' }));
  if (!burstResponse.ok) {
    const result = {
      ok: false,
      actionCompleted: false,
      actionId: intentId,
      error: 'Payment settled but the room refused the cast.',
      burst,
      receipt: gate.receipt,
      split: gate.split,
    };
    await updatePaidIntent(env.AUTH_DB, intentId, 'action_failed', { result, error: result.error });
    return paidIntentJson(intentId, result, 502, gate.response.headers);
  }

  const result = { ok: true, action: 'cast', actionId: intentId, word, burst, receipt: gate.receipt, split: gate.split };
  await updatePaidIntent(env.AUTH_DB, intentId, 'succeeded', { result });
  return paidIntentJson(intentId, result, 200, gate.response.headers);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });

export const onRequestPost: PagesFunction<AgentCastEnv> = async ({ request, env }) =>
  handleAgentCast(request, env);
