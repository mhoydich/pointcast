import { resolveNowPlaying, type SpotifyBroadcastEnv } from './api/spotify/_broadcast';

export const onRequestGet: PagesFunction<SpotifyBroadcastEnv> = async ({ env }) => {
  const nowPlaying = await resolveNowPlaying(env);
  return new Response(JSON.stringify({
    name: 'PointCast Now Playing',
    canonical: 'https://pointcast.xyz/now-playing.json',
    block: `https://pointcast.xyz/b/${nowPlaying.blockId}`,
    channel: 'https://pointcast.xyz/c/spinning',
    networkReceipt: 'https://pointcast.xyz/ads.json',
    ...nowPlaying,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const onRequestOptions: PagesFunction<SpotifyBroadcastEnv> = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
