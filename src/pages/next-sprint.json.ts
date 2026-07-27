/**
 * /next-sprint.json - machine-readable current sprint command board.
 */
import type { APIRoute } from 'astro';
import { NEXT_SPRINT } from '../lib/next-sprint';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    ...NEXT_SPRINT,
    representations: {
      html: NEXT_SPRINT.human,
      json: NEXT_SPRINT.json,
      markdown: 'https://pointcast.xyz/next-sprint.md',
    },
    caveats: [
      'Planning and sprint coordination only.',
      'Generated images must be copied into public project assets before any page references them.',
      'Validator status is only trustworthy when reproduced from the live URL.',
    ],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
