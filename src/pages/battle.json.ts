/**
 * /battle.json — static battler rules dump for agents.
 *
 * The server does not know about client-side matches, so this endpoint only
 * exposes the stable inputs agents need: Card of the Day seed traits, stance
 * rules, type matchups, and canonical battler entrypoints.
 */
import type { APIRoute } from 'astro';
import { seedToStats } from '../lib/battler/stat-derivation';

const CARD_OF_THE_DAY = 137;

export const GET: APIRoute = async () => {
  const cardOfTheDay = seedToStats(CARD_OF_THE_DAY);

  const payload = {
    cardOfTheDay: {
      id: cardOfTheDay.id,
      seedTraits: cardOfTheDay.traits,
    },
    phase: 2,
    stanceRules: {
      format: 'best-of-3',
      stances: ['STRIKE', 'GUARD', 'FOCUS'],
      beats: {
        STRIKE: 'FOCUS',
        GUARD: 'STRIKE',
        FOCUS: 'GUARD',
      },
    },
    typeMatchups: {
      WATER: 'BEAM',
      BEAM: 'ARMOR',
      ARMOR: 'WILD',
      WILD: 'WATER',
      FEAST: null,
    },
    entrypoints: ['/battle', '/c/battler', '/c/battler.json'],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
