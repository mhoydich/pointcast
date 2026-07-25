import type { APIRoute } from 'astro';
import content from '../../../public/showcast/bells-bloom.json?raw';

export const GET: APIRoute = () => new Response(content, {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  },
});
