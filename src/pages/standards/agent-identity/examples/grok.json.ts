import type { APIRoute } from 'astro';
import example from '../../../../content/standards/examples/grok.json';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(example, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
