import type { APIRoute } from 'astro';
import {
  LIVE_FEED_NFT_LANES,
  LIVE_FEED_NFT_RULES,
  buildLiveFeedMetadata,
} from '../data/live-feed-nfts';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/live-feed-nfts.schema.json',
    name: 'PointCast Live Feed NFTs',
    description:
      'Mint-ready preview surface for dynamic PointCast NFTs driven by weather, sea state, competition, and multi-feed snapshots.',
    generatedAt: new Date().toISOString(),
    canonical: 'https://pointcast.xyz/live-feed-nfts',
    boardSource: {
      title: 'Whimsical To Do List',
      itemsRead: [
        'LIVE FEED NFTs',
        'Dynamic Competition',
        'Dynamic Backgrounds',
        'Sports/Sea/Weather Data',
        'Single and Multi Data NFTs',
      ],
    },
    currentStatus: {
      previewSurface: 'built',
      liveAdapters: ['weather', 'sea', 'wire-competition'],
      sportsAdapter: 'slot-ready',
      contract: 'pending',
      signingPolicy: 'user signs only; no agent-originated Tezos transactions',
    },
    rules: LIVE_FEED_NFT_RULES,
    lanes: LIVE_FEED_NFT_LANES.map((lane) => ({
      ...lane,
      canonicalUrl: `https://pointcast.xyz/live-feed-nfts#${lane.id}`,
      metadataTemplate: buildLiveFeedMetadata(lane),
    })),
    runtimeSources: {
      weather: 'https://pointcast.xyz/api/weather?lat=33.9192&lng=-118.4165&label=El%20Segundo',
      sea: 'https://marine-api.open-meteo.com/v1/marine?latitude=33.92&longitude=-118.42&current=wave_height,swell_wave_height,wave_period,wave_direction&timezone=America%2FLos_Angeles',
      wire: 'https://pointcast.xyz/api/wire-events?limit=8',
      wireFallback: 'https://pointcast.xyz/wire.json',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
