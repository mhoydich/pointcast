import type { APIRoute } from 'astro';
import { GROK_METHOD } from '../../lib/grok-method';

/** /grok/method.json — the same canon the HTML page renders. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(GROK_METHOD, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
