import type { APIRoute } from 'astro';
import { july20GalleryManifest, positiveIndexGalleryManifest, todaysGalleryManifest } from '../../lib/todays-gallery';

export const prerender = true;

const editions = {
  schema: 'pointcast.gallery.editions.v1',
  updatedAt: '2026-07-22T12:00:00-07:00',
  count: 3,
  current: todaysGalleryManifest.date,
  editions: [{
    date: todaysGalleryManifest.date,
    title: todaysGalleryManifest.title,
    artist: todaysGalleryManifest.artist,
    href: '/gallery/2026-07-22',
    manifest: '/gallery/2026-07-22.json',
    workCount: todaysGalleryManifest.workCount,
    tools: ['local user-provided batch; generation tool not asserted'],
    mintStatus: todaysGalleryManifest.mintStatus,
  }, {
    date: positiveIndexGalleryManifest.date,
    title: positiveIndexGalleryManifest.title,
    artist: positiveIndexGalleryManifest.artist,
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
