import type { APIRoute } from 'astro';
import { buildCabinetCatalog } from '../../data/agent-cabinet';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify(buildCabinetCatalog(), null, 2), {
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=86400',
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
  },
});
