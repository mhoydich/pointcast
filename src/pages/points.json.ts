/** /points.json — the open Network Points rulebook (CC0). */
import type { APIRoute } from 'astro';
import { rulebook } from '../lib/network-points.mjs';

export const GET: APIRoute = () => new Response(JSON.stringify(rulebook(), null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
});
