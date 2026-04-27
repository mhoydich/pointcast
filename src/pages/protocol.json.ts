import type { APIRoute } from 'astro';
import { buildProtocolManifest } from '../lib/protocol';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(buildProtocolManifest(), null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
