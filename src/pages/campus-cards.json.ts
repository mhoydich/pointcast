import type { APIRoute } from 'astro';
import { seriesPayload } from '../lib/campus-cards';

export const GET: APIRoute = () => new Response(JSON.stringify(seriesPayload(), null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600', 'Access-Control-Allow-Origin': '*' },
});
