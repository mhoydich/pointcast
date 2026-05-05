/**
 * /nouns-nation-battler-bowl.json — agent-readable snapshot of the
 * Bowl-path state. Reads from src/lib/battler-bowl-state.ts so the page
 * and the JSON cannot drift.
 *
 * Per CLAUDE.md: agent-readable endpoints are part of how PointCast lets
 * other agents reason about the league. The Bowl page is the human view;
 * this endpoint is the agent view of the same source.
 */
import type { APIRoute } from 'astro';
import { bowlStateSnapshot } from '../lib/battler-bowl-state';

export const GET: APIRoute = () => {
  const snapshot = bowlStateSnapshot();
  return new Response(
    JSON.stringify(
      {
        $schema: 'https://pointcast.xyz/for-agents',
        generatedAt: new Date().toISOString(),
        kind: 'pointcast.battler-bowl',
        url: 'https://pointcast.xyz/nouns-nation-battler-bowl/',
        intent:
          'Structural surface for the Nouns Nation Battler S6 Bowl path: per-gang lock status, championship history, the 14-day Sprint Room calendar with the current day marked, and the days-to-Bowl countdown.',
        ...snapshot,
        related: {
          page: 'https://pointcast.xyz/nouns-nation-battler-bowl/',
          battleDesk: 'https://pointcast.xyz/nouns-nation-battler/',
          battleDeskV3: 'https://pointcast.xyz/nouns-nation-battler-v3/',
          gameJson: 'https://pointcast.xyz/nouns-nation-battler.json',
          channelArchive: 'https://pointcast.xyz/c/battler/',
          beats: [
            'https://pointcast.xyz/b/0411',
            'https://pointcast.xyz/b/0422',
            'https://pointcast.xyz/b/0434',
          ],
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
