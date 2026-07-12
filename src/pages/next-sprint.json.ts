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
      Link: [
        '<https://pointcast.xyz/next-sprint>; rel="canonical"; type="text/html"',
        '<https://pointcast.xyz/sprint.json>; rel="related"; type="application/json"; title="Live sprint backlog"',
        '<https://pointcast.xyz/sprints.json>; rel="related"; type="application/json"; title="Shipped sprint log"',
      ].join(', '),
    },
  });
};
