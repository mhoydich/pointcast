import type { APIRoute } from 'astro';
import { buildCivilServiceManifest } from '../data/civil-service';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildCivilServiceManifest(), null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
