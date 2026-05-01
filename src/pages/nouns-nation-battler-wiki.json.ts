/**
 * /nouns-nation-battler-wiki.json - machine-readable Battler wiki map.
 */
import type { APIRoute } from 'astro';
import { NOUNS_BATTLER_WIKI } from '../lib/nouns-battler-agent-bench';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify(
      {
        $schema: 'https://pointcast.xyz/for-agents',
        generatedAt: new Date().toISOString(),
        name: 'Nouns Nation Battler Wiki',
        ...NOUNS_BATTLER_WIKI,
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
