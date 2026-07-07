import type { APIRoute } from 'astro';
import { daySeed, todayPT } from '../lib/daily-core';

// Machine-readable sibling of /nounle. Documents the game and today's puzzle
// number/rules. Deliberately does NOT publish the answer seed — it's a
// deterministic public value (answer = daySeed() % 1200) any client can
// compute, but the JSON shouldn't spoil the day for a human who opens it.
const NOUN_COUNT = 1200;
const MAX_GUESSES = 6;
const LAUNCH = '2026-07-06';

export const GET: APIRoute = () => {
  const day = todayPT();
  const puzzleNo = Math.max(1, Math.round((Date.parse(day) - Date.parse(LAUNCH)) / 86_400_000) + 1);
  return new Response(
    JSON.stringify(
      {
        $schema: 'https://pointcast.xyz/BLOCKS.md',
        name: 'Nounle',
        url: 'https://pointcast.xyz/nounle',
        description:
          'Guess the Noun of the day in six tries. One shared mystery Noun for the whole town, seeded by the PT calendar day; the art reveals band by band and a higher/lower range narrows with each guess.',
        puzzle: puzzleNo,
        day,
        rules: {
          maxGuesses: MAX_GUESSES,
          seedRange: [0, NOUN_COUNT - 1],
          feedback: ['higher-or-lower on the seed', 'one art band revealed per guess'],
          determinism: 'answer = daySeed() % 1200, identical for every visitor on the same PT day',
          art: 'https://noun.pics/{seed}.svg — Visit Nouns FA2 seeds 0-1199',
        },
        genre: ['puzzle', 'daily'],
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    },
  );
};
