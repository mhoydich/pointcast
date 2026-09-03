import { SPELLS } from '../../../src/data/spells.ts';
import { forwardBurst, type BurstEnv } from '../burst.ts';
import {
  PAID_ACTION_HEADERS,
  PAID_TOWN_PRICE_UNITS,
  paidJson,
  readBoundedJson,
} from '../../_lib/paid-town-actions.ts';
import { shortEvmAddress, withX402 } from '../../_lib/x402-gate.ts';

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

  const gate = await withX402(request, env, {
    action: 'cast',
    priceUnits: PAID_TOWN_PRICE_UNITS,
    maker: 'town',
    expectedPublicKey: options.expectedPublicKey,
    resourceDescription: `Cast +${word} into PointCast's live presence room.`,
    merchantUrl: 'https://pointcast.xyz/spells',
    context: `Paid town action: an agent casts the +${word} magic word into the live room.`,
  });
  if (!gate.settled) return gate.response;

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
    return paidJson({
      ok: false,
      actionCompleted: false,
      error: 'Payment settled but the room was unavailable.',
      receipt: gate.receipt,
      split: gate.split,
    }, 502, gate.response.headers);
  }
  const burst = await burstResponse.json().catch(() => ({ ok: false, reason: 'unreadable presence response' }));
  if (!burstResponse.ok) {
    return paidJson({
      ok: false,
      actionCompleted: false,
      error: 'Payment settled but the room refused the cast.',
      burst,
      receipt: gate.receipt,
      split: gate.split,
    }, 502, gate.response.headers);
  }

  return paidJson({ ok: true, action: 'cast', word, burst, receipt: gate.receipt, split: gate.split }, 200, gate.response.headers);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });

export const onRequestPost: PagesFunction<AgentCastEnv> = async ({ request, env }) =>
  handleAgentCast(request, env);
