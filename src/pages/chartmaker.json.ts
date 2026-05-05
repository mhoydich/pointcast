import type { APIRoute } from 'astro';
import { getChartmakerPacket } from '../lib/chartmaker';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    $schema: 'https://pointcast.xyz/for-agents',
    ...getChartmakerPacket(),
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=120',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
