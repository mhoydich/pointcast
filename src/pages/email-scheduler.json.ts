/**
 * /email-scheduler.json - machine-readable PointCast Daily email contract.
 */
import type { APIRoute } from 'astro';
import { buildDailyEmailPreview } from '../lib/daily-email-scheduler';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(buildDailyEmailPreview(), null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
