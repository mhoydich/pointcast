import type { APIRoute } from 'astro';
import catalog from '../../data/home-latest-projects.json';
import { publishedCatalog } from '../../lib/home-published-projects.mjs';

export const prerender = true;

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(publishedCatalog(catalog), null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
