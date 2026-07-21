import type { APIRoute } from 'astro';
import { todaysGalleryManifest } from '../../lib/todays-gallery';

export const prerender = true;

const editions = {
  schema: 'pointcast.gallery.editions.v1',
  updatedAt: '2026-07-20T23:00:00-07:00',
  count: 1,
  current: todaysGalleryManifest.date,
  editions: [{
    date: todaysGalleryManifest.date,
    title: todaysGalleryManifest.title,
    artist: todaysGalleryManifest.artist,
    href: '/gallery/today',
    manifest: '/gallery/today.json',
    workCount: 28,
    tools: ['Midjourney', 'Ideogram', 'ImageApp'],
    mintStatus: 'not represented as minted',
  }],
};

export const GET: APIRoute = () => new Response(JSON.stringify(editions, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  },
});
