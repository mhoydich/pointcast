import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getChartOfTheDay } from '../lib/chart-of-the-day';

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const chart = getChartOfTheDay(blocks);

  return new Response(JSON.stringify({
    $schema: 'https://pointcast.xyz/for-agents',
    canonical: 'https://pointcast.xyz/chart',
    ...chart,
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
