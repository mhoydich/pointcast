import type { APIRoute } from 'astro';
import content from '../../public/llms.txt?raw';

export const GET: APIRoute = () => new Response(content, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  },
});
