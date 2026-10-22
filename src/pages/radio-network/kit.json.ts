import type { APIRoute } from 'astro';
import { buildKitManifest } from '../../data/radio-kit';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ...buildKitManifest(), url: 'https://pointcast.xyz/radio-network/kit', generatedAt: new Date().toISOString() }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
