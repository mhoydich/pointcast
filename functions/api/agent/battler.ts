import {
  beginPaidIntent, acquirePaidSettlement, updatePaidIntent, attachPaidIntent, loadPaidIntent, publicPaidIntent,
  paidJson, paidIntentJson, readBoundedJson, settlementWasAmbiguous, PAID_ACTION_HEADERS,
} from '../../_lib/paid-town-actions.ts';
import { withX402, finalizeX402Receipt, x402TransactionHash } from '../../_lib/x402-gate.ts';
import { isJsonRecord } from '../../../src/lib/x402.ts';
import { BATTLE_TABLE, BATTLE_PRICE_UNITS, rulesVersion, parseMatchInput, simulateMatch, matchHash } from '../../_lib/nouns-battler-arena.ts';

type BattleEnv = Cloudflare.Env & { AUTH_DB?: D1Database; VISITS?: KVNamespace };
export async function handleAgentBattler(request: Request, env: BattleEnv, options: { expectedPublicKey?: string } = {}): Promise<Response> {
  let payload: Record<string, unknown>;
  let input;
  try {
    const body = await readBoundedJson(request, 8192);
    if (!isJsonRecord(body) || Object.keys(body).some(k => !['match','rulesVersion','maxSpendUnits'].includes(k))) throw new Error('Expected match, rulesVersion and maxSpendUnits only.');
    if (body.rulesVersion !== rulesVersion) throw new Error('rules-version-mismatch');
    if (typeof body.maxSpendUnits !== 'string' || !/^\d{1,12}$/.test(body.maxSpendUnits)) throw new Error('maxSpendUnits must be an explicit USDC base-unit limit.');
    if (BigInt(body.maxSpendUnits) < BigInt(BATTLE_PRICE_UNITS)) throw new Error('spending-cap-too-low');
    if (!isJsonRecord(body.match)) throw new Error('match is required');
    input = parseMatchInput(body.match);
    // Bind the signed agent request to the exact submitted JSON; defaults only affect simulation.
    payload = body;
  } catch (e) { return paidJson({ ok: false, error: e instanceof Error ? e.message : 'invalid-request', settlement: 'not-submitted' }, 400); }
  if (!env.AUTH_DB || !env.VISITS) return paidJson({ ok: false, error: 'match-ledger-unavailable', settlement: 'not-submitted' }, 503);
  try { await env.AUTH_DB.prepare('SELECT id FROM nouns_battler_records LIMIT 1').first(); }
  catch { return paidJson({ ok: false, error: 'match-ledger-not-ready', settlement: 'not-submitted' }, 503); }

  const begun = await beginPaidIntent(request, env.AUTH_DB, 'battler', payload, BATTLE_TABLE);
  if (begun.kind === 'response') return begun.response;
  const id = begun.kind === 'quote' ? null : begun.intent.id;
  let gate;
  if (begun.kind === 'resume') {
    gate = { settled: true as const, response: new Response(null, { headers: PAID_ACTION_HEADERS }), ...begun.settlement };
  } else {
    // Acquire before validating the payment header: a malformed concurrent request
    // must never overwrite a valid request's in-flight settlement state.
    if (id && !await acquirePaidSettlement(env.AUTH_DB, id, BATTLE_TABLE)) {
      return paidIntentJson(id, { ok: false, actionId: id, error: 'match-payment-in-progress' }, 202);
    }
    gate = await withX402(request, env, {
      action: 'battler', maker: 'nouns-nation', priceUnits: BATTLE_PRICE_UNITS,
      expectedPublicKey: options.expectedPublicKey,
      resourceDescription: 'One Nouns Nation 12v12 seeded exhibition with a persistent signed match record. No prizes.',
      merchantUrl: 'https://pointcast.xyz/nouns-nation-battler-arena',
      context: 'Commissioned exhibition record. Payment is not a wager and does not buy a prize or a competitive advantage.',
      requestHash: begun.kind === 'quote' ? null : begun.intent.request_hash,
      resourceId: id, agentId: begun.kind === 'quote' ? null : begun.intent.agent_id,
    });
    if (!gate.settled) {
      if (!id) return gate.response;
      if (gate.response.status !== 202) await updatePaidIntent(env.AUTH_DB, id,
        settlementWasAmbiguous(gate.response) ? 'settlement_ambiguous' : 'settlement_failed',
        { error: `settlement-response-${gate.response.status}` }, BATTLE_TABLE);
      return attachPaidIntent(gate.response, id);
    }
    if (id) await updatePaidIntent(env.AUTH_DB, id, 'settled', {
      txHash: x402TransactionHash(gate.receipt),
      settlement: { receipt: gate.receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split },
    }, BATTLE_TABLE);
  }
  if (!id) return gate.response;
  const lease = crypto.randomUUID();
  const current = async () => {
    const row = await loadPaidIntent(env.AUTH_DB!, id, BATTLE_TABLE);
    if (row?.status === 'succeeded' && row.result_json) return paidIntentJson(id, JSON.parse(row.result_json), 200, gate.response.headers);
    return paidIntentJson(id, { ok: false, ...(row ? publicPaidIntent(row) : { actionId: id }), error: 'match-record-in-progress' }, 202, gate.response.headers);
  };
  try {
    // The lease fences late workers as well as concurrent recovery requests.
    const now = new Date().toISOString();
    const acquired = await env.AUTH_DB.prepare(`UPDATE nouns_battler_records SET
      status = 'acting', action_lease = ?, error = NULL, updated_at = ?
      WHERE id = ? AND (status IN ('settled', 'action_failed') OR (status = 'acting' AND updated_at < ?))
      RETURNING id`).bind(lease, now, id, new Date(Date.now() - 60_000).toISOString()).first<{ id: string }>();
    if (!acquired) return current();
    const match = simulateMatch(input);
    const hash = await matchHash(match);
    const actionResult = { ok: true, action: 'battler', actionId: id, rulesVersion, matchHash: hash,
      winner: match.winner, survivors: match.survivors,
      watchUrl: `https://pointcast.xyz/nouns-nation-battler-arena?record=${id}`,
      recordUrl: `https://pointcast.xyz/api/actions/${id}`, saved: true };
    // Sign in memory, then expose proof and replay together in one durable write.
    // Pending KV receipts are not rewritten (KV limits same-key write frequency).
    const receipt = await finalizeX402Receipt(env, gate.receipt, actionResult, id, options.expectedPublicKey, { retain: false });
    const result = { ...actionResult, match, receipt, split: gate.split, verifiedBy: 'pointcast-server' };
    const stored = await env.AUTH_DB.prepare(`UPDATE nouns_battler_records SET
      status = ?, result_json = ?, settlement_json = ?, error = NULL, action_lease = NULL, updated_at = ?
      WHERE id = ? AND status = 'acting' AND action_lease = ?`).bind('succeeded', JSON.stringify(result),
      JSON.stringify({ receipt, receiptHash: gate.receiptHash, payer: gate.payer, split: gate.split }),
      new Date().toISOString(), id, lease).run();
    if (stored.meta.changes !== 1) return current();
    return paidIntentJson(id, result, 200, gate.response.headers);
  } catch {
    // Payment may be final even when storing the artifact fails. Preserve settlement for same-key recovery.
    const failed = await env.AUTH_DB.prepare(`UPDATE nouns_battler_records SET
      status = 'action_failed', error = 'match-record-storage-failed', action_lease = NULL, updated_at = ?
      WHERE id = ? AND status = 'acting' AND action_lease = ?`).bind(new Date().toISOString(), id, lease).run();
    if (failed.meta.changes !== 1) return current();
    return paidIntentJson(id, { ok: false, actionId: id, charged: true, resumable: true,
      error: 'Payment settled; retry this same request and Idempotency-Key to finish the record.' }, 503, gate.response.headers);
  }
}
export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });
export const onRequestPost: PagesFunction<BattleEnv> = ({ request, env }) => handleAgentBattler(request, env);
