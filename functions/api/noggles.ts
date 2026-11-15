/**
 * /api/noggles — rent an Office Noun that talks. Logic lives in src/lib/noggles/service.mjs
 * (tested in tests/noggles.test.mjs); this wrapper supplies the Claude call and the rate limit.
 *
 * Needs the ANTHROPIC_API_KEY Pages secret. Without it, GET reports open:false and POST answers
 * 503 not_configured, so officenoun.xyz/rent/ falls back to its offline noun.
 */
import Anthropic from '@anthropic-ai/sdk';
import { handleNoggles } from '../../src/lib/noggles/service.mjs';
import { rateLimit } from '../_rate-limit';

type Env = {
  ANTHROPIC_API_KEY?: string;
  PC_RATES_KV?: KVNamespace;
};

type Plan = { name: string; model: string; maxTokens: number; fallbacks: boolean };
type Turn = { role: 'user' | 'assistant'; content: string };

function modelCaller(apiKey: string) {
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 45_000 });
  return async ({ plan, system, messages }: { plan: Plan; system: string; messages: Turn[] }) => {
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

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleNoggles(request, {
    callModel: env.ANTHROPIC_API_KEY ? modelCaller(env.ANTHROPIC_API_KEY) : null,
    // 20 messages per 10 minutes per visitor IP.
    limit: async (bucket: string) => rateLimit(request, env, { bucket, windowSec: 600, maxRequests: 20 }),
  });
