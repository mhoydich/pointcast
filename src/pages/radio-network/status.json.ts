import type { APIRoute } from 'astro';
import { buildStatusManifest } from '../../data/radio-status';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildStatusManifest(), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
