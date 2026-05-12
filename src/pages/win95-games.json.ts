import type { APIRoute } from 'astro';
import { ARCADE_ACHIEVEMENTS, ARCADE_ASSETS, ARCADE_STORAGE_PREFIX, RETRO_ARCADE_GAMES } from '../lib/retro-arcade';

export const GET: APIRoute = async () => {
  const daySeed = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const payload = {
    name: 'PointCast Retro Arcade',
    canonical: 'https://pointcast.xyz/win95-games',
    generatedAt: new Date().toISOString(),
    storagePrefix: ARCADE_STORAGE_PREFIX,
    assets: ARCADE_ASSETS,
    dailyChallenge: {
      date: daySeed,
      seed: `pc-arcade-${daySeed}`,
      games: RETRO_ARCADE_GAMES.map((game, index) => ({
        slug: game.slug,
        path: game.path,
        target: index === 0 ? 'best-time' : index === 1 ? 'fewest-moves' : index === 2 ? 'clear-pyramid' : 'safe-clear',
      })),
    },
    localProgress: {
      profileKey: `${ARCADE_STORAGE_PREFIX}profile`,
      gameKeys: RETRO_ARCADE_GAMES.map((game) => ({
        slug: game.slug,
        storageKey: game.storageKey,
      })),
      fields: ['plays', 'clears', 'bestTime', 'bestMoves', 'lastPlayed', 'achievements'],
    },
    games: RETRO_ARCADE_GAMES.map((game) => ({
      ...game,
      url: `https://pointcast.xyz${game.path}`,
    })),
    achievements: ARCADE_ACHIEVEMENTS,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
};
