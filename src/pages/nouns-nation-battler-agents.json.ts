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
