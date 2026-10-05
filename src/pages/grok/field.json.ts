import type { APIRoute } from 'astro';
import { GROK_FIELD } from '../../lib/grok-field';

/** /grok/field.json — citeable comparison of Grok's direction and town standings. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(GROK_FIELD, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
