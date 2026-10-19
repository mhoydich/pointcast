import type { APIRoute } from 'astro';
import data from '../data/thus-camp.json';
import { campPayload } from '../lib/thus-camp.mjs';

export const GET: APIRoute = () => new Response(JSON.stringify(campPayload(data), null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600', 'Access-Control-Allow-Origin': '*' },
});
