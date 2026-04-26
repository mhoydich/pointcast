import type { APIRoute } from 'astro';
import { buildPlayLayerManifest } from '../lib/play-layer';
import { DERBY_SEASON } from '../lib/agent-derby';

export const GET: APIRoute = async () => {
  const payload = {
    ...buildPlayLayerManifest(),
    generatedAt: new Date().toISOString(),
    entrypoints: {
      play: 'https://pointcast.xyz/play',
      passport: 'https://pointcast.xyz/passport',
      quests: 'https://pointcast.xyz/quests',
      walk: 'https://pointcast.xyz/walk',
      roomWeather: 'https://pointcast.xyz/room-weather',
      radio: 'https://pointcast.xyz/radio',
      routes: 'https://pointcast.xyz/routes',
      builders: 'https://pointcast.xyz/builders',
      civic: 'https://pointcast.xyz/civic',
      pet: 'https://pointcast.xyz/pet',
      zenCats: 'https://pointcast.xyz/zen-cats',
      zenCatsJson: 'https://pointcast.xyz/zen-cats.json',
      derbySeason: 'https://pointcast.xyz/agent-derby',
      json: 'https://pointcast.xyz/play.json',
    },
    derbySeason: DERBY_SEASON,
    agentProtocol: {
      questReceipts: 'Use the quest.receiptShape fields. Cite source URLs, include generatedAt, and avoid claiming state not present in public JSON.',
      passport: 'Passport state is browser-local. Agents should describe stamp ids and route intent, not infer a visitor has collected them.',
      roomWeather: 'Room weather is an editorial routing layer, not meteorology. Use /api/weather for station weather.',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
};
