/** /nouns-money/rails.json — the open spec for the four Nouns Money layers. */
import type { APIRoute } from 'astro';
import { railsDocument } from '../../lib/nouns-money-rails.mjs';

export const GET: APIRoute = () => new Response(JSON.stringify(railsDocument(), null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
});
