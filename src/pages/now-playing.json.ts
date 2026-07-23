import type { APIRoute } from 'astro';
import { NOW_PLAYING } from '../data/now-playing';

export const GET: APIRoute = () => {
  const payload = {
    name: 'PointCast Now Playing',
    canonical: 'https://pointcast.xyz/now-playing.json',
    block: `https://pointcast.xyz/b/${NOW_PLAYING.blockId}`,
    channel: 'https://pointcast.xyz/c/spinning',
    networkReceipt: 'https://pointcast.xyz/ads.json',
    ...NOW_PLAYING,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
