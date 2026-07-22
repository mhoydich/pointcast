import type { APIRoute } from 'astro';
import { todaysGalleryManifest } from '../../lib/todays-gallery';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify(todaysGalleryManifest, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  },
});
