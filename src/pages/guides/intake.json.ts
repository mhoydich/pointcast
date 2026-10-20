import type { APIRoute } from 'astro';
import { buildIntakeFeed } from '../../data/guides/intake';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ...buildIntakeFeed(), generatedAt: new Date().toISOString() }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
