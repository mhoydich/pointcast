import type { APIRoute } from 'astro';
import { machineEdition } from '../../lib/currency-builder/almanac.mjs';

export const GET: APIRoute = () => new Response(JSON.stringify(machineEdition(), null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
});
