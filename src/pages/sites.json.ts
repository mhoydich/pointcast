import type { APIRoute } from 'astro';
import sites from '../data/sites.json';
export const GET: APIRoute = () => new Response(JSON.stringify(sites, null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
});
