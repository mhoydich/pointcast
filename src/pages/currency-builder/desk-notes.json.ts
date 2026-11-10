/** /currency-builder/desk-notes.json — the machine edition of the Desk Notes. */
import type { APIRoute } from 'astro';
import { machineEdition } from '../../lib/currency-builder/desk-notes.mjs';

export const GET: APIRoute = () => new Response(JSON.stringify(machineEdition(), null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
});
