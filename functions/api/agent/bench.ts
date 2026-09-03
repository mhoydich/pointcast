import { handleBenchPost, type BenchEnv } from '../bench.ts';
import {
  PAID_ACTION_HEADERS,
  PAID_TOWN_PRICE_UNITS,
  paidJson,
  readBoundedJson,
} from '../../_lib/paid-town-actions.ts';
import { shortEvmAddress, withX402 } from '../../_lib/x402-gate.ts';

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

  const gate = await withX402(request, env, {
    action: 'bench',
    priceUnits: PAID_TOWN_PRICE_UNITS,
    maker: 'town',
    expectedPublicKey: options.expectedPublicKey,
    resourceDescription: 'Ask the PointCast bench one question (280 characters maximum).',
    merchantUrl: 'https://pointcast.xyz/bench',
    context: 'Paid town action: an agent asks one question on the shared PointCast bench.',
  });
  if (!gate.settled) return gate.response;

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
    return paidJson({
      ok: false,
      actionCompleted: false,
      error: 'Payment settled but the bench could not store the question.',
      bench,
      receipt: gate.receipt,
      split: gate.split,
    }, 502, gate.response.headers);
  }

  return paidJson({ ok: true, action: 'bench', bench, receipt: gate.receipt, split: gate.split }, 200, gate.response.headers);
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: PAID_ACTION_HEADERS });

export const onRequestPost: PagesFunction<AgentBenchEnv> = async ({ request, env }) =>
  handleAgentBench(request, env);
