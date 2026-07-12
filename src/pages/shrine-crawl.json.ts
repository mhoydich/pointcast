/**
 * /shrine-crawl.json - machine-readable 24 shrine bell crawl manifest.
 */
import type { APIRoute } from 'astro';
import { BELL_MODE_COPY, SHRINE_CRAWL, SHRINE_CRAWL_META } from '../lib/shrine-bell-crawl';
import { absoluteImage, absoluteUrl } from '../lib/unfurl-shrines';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    ...SHRINE_CRAWL_META,
    bellModeCopy: BELL_MODE_COPY,
    visits: SHRINE_CRAWL.map((visit, index) => ({
      ...visit,
      url: absoluteUrl(`/shrine-crawl#${visit.id}`),
      background: absoluteImage(visit.background),
      routeUrl: absoluteUrl(visit.route),
      nextShrineId: SHRINE_CRAWL[(index + 1) % SHRINE_CRAWL.length].id,
      nextShrineUrl: absoluteUrl(`/shrine-crawl#${SHRINE_CRAWL[(index + 1) % SHRINE_CRAWL.length].id}`),
    })),
    caveats: [
      'Completion, visited, and rung state are local browser state only.',
      'Route links remain ordinary PointCast links and do not require crawl completion.',
      'Midjourney prompts are prompt recipes for the next background generation pass; this endpoint does not claim the images have already been generated.',
      'Bell sounds reuse PointCast shared chime helpers and are triggered only from user gestures.',
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
