import type { APIRoute } from 'astro';
import bookmarks from '../data/bookmarks/bookmarks.json';
import { buildFeed, utcDay } from '../lib/bookmarks.mjs';

export const GET: APIRoute = () => {
  const payload = buildFeed(bookmarks, utcDay());
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
