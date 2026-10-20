import type { APIRoute } from 'astro';
import { buildGuidesManifest } from '../data/guides';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ...buildGuidesManifest(), generatedAt: new Date().toISOString() }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
