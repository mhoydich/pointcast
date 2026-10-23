import type { APIRoute } from 'astro';
import bookmarks from '../data/bookmarks/bookmarks.json';
import { buildRss, utcDay } from '../lib/bookmarks.mjs';

export const GET: APIRoute = () => {
  return new Response(buildRss(bookmarks, utcDay()), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
