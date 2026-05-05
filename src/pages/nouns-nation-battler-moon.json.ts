/**
 * /nouns-nation-battler-moon.json — agent-readable snapshot of the next
 * Moon Tournament. Reads from src/lib/battler-moon-tournament.ts so the
 * page and the JSON cannot drift.
 */
import type { APIRoute } from 'astro';
import { moonTournamentSnapshot } from '../lib/battler-moon-tournament';

export const GET: APIRoute = () => {
  const snapshot = moonTournamentSnapshot();
  return new Response(
    JSON.stringify(
      {
        $schema: 'https://pointcast.xyz/for-agents',
        generatedAt: new Date().toISOString(),
        kind: 'pointcast.battler-moon-tournament',
        url: 'https://pointcast.xyz/nouns-nation-battler-moon/',
        intent:
          'Once-per-full-moon single-elimination knockout for the 8 founding gangs of Nouns Nation Battler. One night, one boss field (Lunar Tide), real seeding from championship history. Lunar timing computed from the mean synodic month — may drift by ±12h vs. real astronomical full moons.',
        ...snapshot,
        related: {
          page: 'https://pointcast.xyz/nouns-nation-battler-moon/',
          bowlPath: 'https://pointcast.xyz/nouns-nation-battler-bowl/',
          bowlJson: 'https://pointcast.xyz/nouns-nation-battler-bowl.json',
          battleDesk: 'https://pointcast.xyz/nouns-nation-battler/',
          battleDeskV3: 'https://pointcast.xyz/nouns-nation-battler-v3/',
          channelArchive: 'https://pointcast.xyz/c/battler/',
        },
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    },
  );
};
