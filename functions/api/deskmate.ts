/**
 * /api/deskmate — the model behind the Office Noun Temp Pool (officenoun.xyz/rent/). Logic lives in
 * src/lib/deskmate/service.mjs (tested in tests/deskmate.test.mjs); this wrapper picks the backend
 * and supplies the rate limit.
 *
 * Backend: Claude (via @anthropic-ai/sdk) when the ANTHROPIC_API_KEY Pages secret is set; otherwise an
 * open Llama model through the Workers AI binding `AI` (wrangler.toml [ai]), which needs no secret.
 * With neither, GET reports open:false and POST answers 503, and the rent page's offline intern covers.
 */
import Anthropic from '@anthropic-ai/sdk';
import { handleDeskmate, BACKENDS } from '../../src/lib/deskmate/service.mjs';
import { rateLimit } from '../_rate-limit';

type WorkersAI = { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };

type Env = {
  ANTHROPIC_API_KEY?: string;
  AI?: WorkersAI;
  PC_RATES_KV?: KVNamespace;
};

type Plan = { name: string; model: string; maxTokens: number; fallbacks: boolean };
type Turn = { role: 'user' | 'assistant'; content: string };
type CallArgs = { plan: Plan; system: string; messages: Turn[] };

/** Workers AI models per shift: the big Llama for full-time, the small one for temp. */
const WORKERS_MODELS: Record<string, string> = {
  'claude-opus-5-5': '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  'claude-haiku-5-5': '@cf/meta/llama-3.1-8b-instruct-fast',
};

function claudeCaller(apiKey: string) {
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 45_000 });
  return async ({ plan, system, messages }: CallArgs) => {
    // Chat: low effort keeps replies quick. Opus also gets server-side refusal fallbacks.
    const response = plan.fallbacks
      ? await client.beta.messages.create({
          model: plan.model,
          max_tokens: plan.maxTokens,
          system,
          messages,
          output_config: { effort: 'low' },
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
        })
      : await client.messages.create({
          model: plan.model,
          max_tokens: plan.maxTokens,
          system,
          messages,
          output_config: { effort: 'low' },
        });
    let text = '';
    for (const block of response.content) {
      if (block.type === 'text') text += block.text;
    }
    return { text, stop: String(response.stop_reason ?? ''), model: response.model };
  };
}

function workersCaller(ai: WorkersAI) {
  return async ({ plan, system, messages }: CallArgs) => {
    const model = WORKERS_MODELS[plan.model] ?? WORKERS_MODELS['claude-opus-5-5'];
    const out = (await ai.run(model, {
      messages: [{ role: 'system', content: system }, ...messages],
      max_tokens: Math.min(plan.maxTokens, 700),
    })) as { response?: unknown };
    return { text: typeof out?.response === 'string' ? out.response : '', stop: 'end_turn', model };
  };
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const callModel = env.ANTHROPIC_API_KEY ? claudeCaller(env.ANTHROPIC_API_KEY) : env.AI ? workersCaller(env.AI) : null;
  return handleDeskmate(request, {
    callModel,
    backend: env.ANTHROPIC_API_KEY ? BACKENDS.claude : BACKENDS.workers,
    // 20 messages per 10 minutes per visitor IP.
    limit: async (bucket: string) => rateLimit(request, env, { bucket, windowSec: 600, maxRequests: 20 }),
  });
};
