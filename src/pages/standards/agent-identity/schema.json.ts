import type { APIRoute } from 'astro';
import schema from '../../../content/standards/agent-passport.schema.json';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(schema, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
