import type { APIRoute } from 'astro';
import { getSnapshot } from '../lib/business-feels.mjs';

export const prerender = true;
export const GET: APIRoute = () => new Response(JSON.stringify(getSnapshot(), null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
    'X-Content-Type-Options': 'nosniff',
  },
});
