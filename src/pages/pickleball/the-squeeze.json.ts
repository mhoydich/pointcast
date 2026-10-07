import type { APIRoute } from 'astro';
import league from '../../data/squeeze-league.json';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(league, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
