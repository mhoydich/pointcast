import type { APIRoute } from 'astro';
import body from '../../../content/standards/human-in-the-loop-v0.1.md?raw';

export const GET: APIRoute = () =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
