import type { APIRoute } from 'astro';
import { july20GalleryManifest, todaysGalleryManifest } from '../../lib/todays-gallery';

export const prerender = true;

const editions = {
  schema: 'pointcast.gallery.editions.v1',
  updatedAt: '2026-07-21T11:35:00-07:00',
  count: 2,
  current: todaysGalleryManifest.date,
  editions: [{
    date: todaysGalleryManifest.date,
    title: todaysGalleryManifest.title,
    artist: todaysGalleryManifest.artist,
    href: '/gallery/2026-07-21',
    manifest: '/gallery/2026-07-21.json',
    workCount: 14,
    tools: ['Midjourney', 'Ideogram', 'ImageApp'],
    adTools: ['Reve'],
    adCreativeCount: 3,
    mintStatus: 'not represented as minted',
  }, {
    date: july20GalleryManifest.date,
    title: july20GalleryManifest.title,
    artist: july20GalleryManifest.artist,
    href: '/gallery/2026-07-20',
    manifest: '/gallery/2026-07-20.json',
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
