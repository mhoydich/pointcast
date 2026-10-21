import type { APIRoute } from 'astro';
import { officeBotsManifest } from '../lib/office-bots.mjs';
export const GET: APIRoute = () => new Response(JSON.stringify(officeBotsManifest(), null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
});
