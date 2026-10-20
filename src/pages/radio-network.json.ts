import type { APIRoute } from 'astro';
import { buildRadioManifest } from '../data/radio-network';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ...buildRadioManifest(), generatedAt: new Date().toISOString() }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
