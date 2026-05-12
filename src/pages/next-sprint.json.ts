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
      'Shrine crawl completion is local-only and must not be treated as authentication or authorization.',
      'Route exits should keep working as ordinary links even if localStorage is unavailable.',
      'Midjourney prompts are generation recipes; generated raster assets are a follow-up production pass.',
      'Any agent-readable crawl manifest should name its caveats beside the task data.',
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
