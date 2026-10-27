import type { APIRoute } from 'astro';
import catalog from '../data/webhook-catalog.json';
export const GET: APIRoute = () => new Response(JSON.stringify(catalog, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
