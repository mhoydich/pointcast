import type { APIRoute } from 'astro';
import { ART_DOWNLOAD_COLLECTIONS, ART_DOWNLOAD_COUNT, ART_DOWNLOAD_URL } from '../lib/art-downloads';
import { DOWNLOAD_SHELVES, DOWNLOAD_SOURCE_COUNT, DOWNLOAD_SOURCES_REVIEWED, DOWNLOAD_SOURCES_RULE, FINDER_SOURCES, POINTCAST_TO_GO } from '../lib/download-sources';

export const GET: APIRoute = () => new Response(JSON.stringify({
  title: 'PointCast downloads',
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
  // Everything below points away from PointCast. Rights are each source's to
  // state; `rights` is a pointer, not a license grant.
  finder: {
    page: `${ART_DOWNLOAD_URL}#finder`,
    deepLink: `${ART_DOWNLOAD_URL}?q={query}`,
    note: 'Client-side search of keyless, CORS-open collections. PointCast proxies and stores nothing.',
    sources: FINDER_SOURCES,
  },
  sources: {
    reviewed: DOWNLOAD_SOURCES_REVIEWED,
    rule: DOWNLOAD_SOURCES_RULE,
    count: DOWNLOAD_SOURCE_COUNT,
    shelves: DOWNLOAD_SHELVES,
  },
  pointcastToGo: {
    print: POINTCAST_TO_GO.print.map((file) => ({ ...file, url: `https://pointcast.xyz${file.url}` })),
    feeds: POINTCAST_TO_GO.feeds.map((file) => ({ ...file, url: `https://pointcast.xyz${file.url}` })),
  },
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  },
});
