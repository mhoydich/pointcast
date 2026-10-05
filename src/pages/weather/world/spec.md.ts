import type { APIRoute } from 'astro';
import body from '../../../content/weather/world-spec.md?raw';

/** /weather/world/spec.md — World Weather Wire post format, for agents. */

export const GET: APIRoute = () =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
