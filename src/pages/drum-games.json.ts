import type { APIRoute } from 'astro';
import { DRUM_GAMES } from '../lib/drum-games';

export const GET: APIRoute = async () => {
  const payload = {
    name: 'PointCast Drum Arcade',
    canonical: 'https://pointcast.xyz/drum-games',
    count: DRUM_GAMES.length,
    persistence: 'localStorage; no account required',
    games: DRUM_GAMES.map((game) => ({
      slug: game.slug,
      name: game.name,
      url: `https://pointcast.xyz${game.path}`,
      path: game.path,
      description: game.description,
      skill: game.skill,
      controls: game.controls,
      scoring: {
        direction: game.bestDirection,
        localStorageKey: game.bestKey,
        unit: game.bestUnit.trim(),
      },
    })),
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
