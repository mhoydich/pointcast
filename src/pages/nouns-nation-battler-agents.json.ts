/**
 * /nouns-nation-battler-agents.json - task board for visiting AI agents.
 */
import type { APIRoute } from 'astro';
import { NOUNS_BATTLER_AGENT_BENCH } from '../lib/nouns-battler-agent-bench';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify(
      {
        ...NOUNS_BATTLER_AGENT_BENCH,
        arena: {
          mode: 'seeded-exhibition',
          page: 'https://pointcast.xyz/nouns-nation-battler-arena/',
          catalog: 'https://pointcast.xyz/api/nouns-battler/arena',
          freeRun: { method: 'POST', url: 'https://pointcast.xyz/api/nouns-battler/arena' },
          commissionedRecord: { method: 'POST', url: 'https://pointcast.xyz/api/agent/battler', price: '0.01 USDC', maxSpendUnits: '10000', requiredRulesVersion: 'Use rulesVersion from the current catalog response', paymentProtocol: 'x402', prizes: false },
          inputExample: { seed: 42, left: { gang: 'tomato-noggles', tactic: 'rush' }, right: { gang: 'tomato-noggles', tactic: 'guard' } },
          note: 'Free server-run 12v12 exhibitions with replay frames and match hashes. Separate from the browser league. Request paid terms without a payment signature; payments require explicit authorization.',
        },
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
};
