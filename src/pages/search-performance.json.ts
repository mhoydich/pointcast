import type { APIRoute } from 'astro';
import snapshot from '../data/search-performance.json';
import { rankPages } from '../lib/search-performance.mjs';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...snapshot,
  pages: rankPages(snapshot),
  rankingAvailable: rankPages(snapshot).length > 0,
  sourcePage: 'https://pointcast.xyz/search-performance/',
}, null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
});
