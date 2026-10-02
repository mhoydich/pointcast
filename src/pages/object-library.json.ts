import type { APIRoute } from 'astro';
import library from '../data/object-library.json';

export const GET: APIRoute = () => new Response(JSON.stringify(library, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  },
});
