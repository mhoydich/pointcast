/**
 * /api/agent/catan-lantern — x402 paid town action: light a lantern on a table.
 *
 * Anyone with an x402 client (an agent, a game café, a club sponsor) pays
 * 0.01 USDC on Etherlink to light a lantern on an upcoming hosted table. A lit
 * table is pinned to the top of the board with a glow and "lit by 0xab…cd"
 * for 7 days or until the game starts. Lanterns stack: a second payment
 * extends the light by another 7 days. The fee splits 50/50 house/network
 * like every paid town action.
 *
 * Body: { table: "<id>", note?: string (80) } — note is a short dedication.
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
  shortEvmAddress,
  withX402,
  x402TransactionHash,
  X402PreSettlementError,
} from '../../_lib/x402-gate.ts';
import { lightTable, loadTables } from '../../_lib/catan-store.ts';

type AgentLanternEnv = Cloudflare.Env & { VISITS?: KVNamespace; AUTH_DB?: D1Database };

export async function handleAgentCatanLantern(
  request: Request,
  env: AgentLanternEnv,
  options: { expectedPublicKey?: string } = {},
): Promise<Response> {
  let input: unknown;
  try {
    input = await readBoundedJson(request.clone());
  } catch (error) {
    return paidJson({ ok: false, error: error instanceof Error ? error.message : 'invalid request body' }, 400);
  }
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const table = typeof body.table === 'string' ? body.table.trim() : '';
  const note = typeof body.note === 'string' ? body.note.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 80) : '';
  if (/(https?:\/\/|www\.)/i.test(note)) return paidJson({ ok: false, error: 'note cannot contain a link' }, 400);
  if (!env.VISITS) return paidJson({ ok: false, error: 'The table store is unavailable; no payment was submitted.' }, 503);
  if (!env.AUTH_DB) return paidJson({ ok: false, error: 'The split ledger is unavailable; no payment was submitted.' }, 503);
  // Refuse before quoting or settling if the table cannot be lit: nobody should pay for a dark room.
  const tables = await loadTables(env.VISITS);
  const target = tables.find((t) => t.id === table);
  if (!target) return paidJson({ ok: false, error: 'table must be the id of an upcoming hosted table (GET /api/catan/tables)' }, 404);
  if (Date.parse(target.when) < Date.now()) return paidJson({ ok: false, error: 'that table has already started' }, 409);

  const payload = { table, note };
  const begun = await beginPaidIntent(request, env.AUTH_DB, 'catan-lantern', payload);
  if (begun.kind === 'response') return begun.response;
  const intentId = begun.kind === 'quote' ? null : begun.intent.id;
  let gate;
  if (begun.kind === 'resume') {
    gate = { settled: true as const, response: new Response(null, { headers: PAID_ACTION_HEADERS }), ...begun.settlement };
  } else {
    gate = await withX402(request, env, {
      action: 'catan-lantern',
      priceUnits: PAID_TOWN_PRICE_UNITS,
      maker: 'town',
      expectedPublicKey: options.expectedPublicKey,
      resourceDescription: `Light a lantern on the Catan table "${target.title}" (${target.city}) for 7 days.`,
      merchantUrl: 'https://pointcast.xyz/catan/',
      context: 'Paid town action: feature a local Catan night on Hex & Harbor.',
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
  const lit = await lightTable(env.VISITS, table, shortEvmAddress(gate.payer), note, gate.receiptHash);
  if (!lit) {
    const actionResult = { ok: false, actionCompleted: false, actionId: intentId, error: 'Payment settled but the table was gone before the lantern could be lit.' };
    gate.receipt = await finalizeX402Receipt(env, gate.receipt, actionResult, intentId, options.expectedPublicKey);
    const result = { ...actionResult, receipt: gate.receipt, split: gate.split };
    await updatePaidIntent(env.AUTH_DB, intentId, 'action_failed', {
      settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
      result,
      error: result.error,
    });
    return paidIntentJson(intentId, result, 502, gate.response.headers);
  }
  const actionResult = { ok: true, action: 'catan-lantern', actionId: intentId, table: lit };
  gate.receipt = await finalizeX402Receipt(env, gate.receipt, { ok: true, action: 'catan-lantern', actionId: intentId, table: lit.id, until: lit.lantern?.until }, intentId, options.expectedPublicKey);
  const result = { ...actionResult, receipt: gate.receipt, split: gate.split };
  await updatePaidIntent(env.AUTH_DB, intentId, 'succeeded', {
    settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
    result,
  });
  return paidIntentJson(intentId, result, 200, gate.response.headers);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });

export const onRequestPost: PagesFunction<AgentLanternEnv> = async ({ request, env }) =>
  handleAgentCatanLantern(request, env);
