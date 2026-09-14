import type { APIRoute } from 'astro';
import collection from '../../data/coastal-camps.json';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...collection,
  archive: { ...collection.archive, url: `https://pointcast.xyz${collection.archive.url}` },
  images: collection.images.map((art) => ({
    ...art,
    preview: `https://pointcast.xyz${art.preview}`,
    download: `https://pointcast.xyz${art.download}`,
  })),
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  },
});
