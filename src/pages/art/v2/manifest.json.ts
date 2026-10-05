import type { APIRoute } from 'astro';
import gallery from '../../../data/art-v2.json';
import { toPublicManifest } from '../../../lib/art-v2.mjs';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify(toPublicManifest(gallery), null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'X-Content-Type-Options': 'nosniff',
  },
});
