import type { APIRoute } from 'astro';
import { POINTCAST_25 } from '../../lib/pointcast-25';
import { POINTCAST_25_RECEIPTS } from '../../lib/pointcast-25-audience';

export const GET: APIRoute = () => new Response(JSON.stringify({
  spec: 'pointcast.25-receipt-book/v1',
  season: POINTCAST_25.season,
  board: POINTCAST_25.board,
  publishedAt: POINTCAST_25.publishedAt,
  canonical: 'https://pointcast.xyz/25/receipts',
  machineEdition: 'https://pointcast.xyz/25/receipts.json',
  statusVocabulary: {
    OPEN: 'The claim is waiting for relevant evidence.',
    ALIVE: 'Evidence arrived and the claim still holds.',
    COMPLICATED: 'The claim needs a public revision, not deletion.',
    PROVEN: 'The required proof arrived.',
    DEAD: 'The evidence broke the claim.',
  },
  policy: 'Revision is allowed. Disappearance is not. Every status change remains attached to its originating board.',
  receipts: POINTCAST_25_RECEIPTS,
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  },
});
