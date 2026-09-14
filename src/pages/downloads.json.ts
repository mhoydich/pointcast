import type { APIRoute } from 'astro';
import { ART_DOWNLOAD_COLLECTIONS, ART_DOWNLOAD_COUNT, ART_DOWNLOAD_URL } from '../lib/art-downloads';

export const GET: APIRoute = () => new Response(JSON.stringify({
  title: 'PointCast art downloads',
  canonical: ART_DOWNLOAD_URL,
  imageCount: ART_DOWNLOAD_COUNT,
  collectionCount: ART_DOWNLOAD_COLLECTIONS.length,
  order: 'newest-first',
  collections: ART_DOWNLOAD_COLLECTIONS.map((set) => ({
    ...set,
    runningPage: `${ART_DOWNLOAD_URL}#set-${set.blockId}`,
    ...('archive' in set && set.archive ? { archive: { ...set.archive, url: `https://pointcast.xyz${set.archive.url}` } } : {}),
    archives: set.archives.map((archive) => ({ ...archive, url: `https://pointcast.xyz${archive.url}` })),
    images: set.images.map((art) => ({
      ...art,
      preview: `https://pointcast.xyz${art.preview}`,
      download: `https://pointcast.xyz${art.download}`,
    })),
  })),
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  },
});
