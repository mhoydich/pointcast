/**
 * /nouns-cola-crush.json - machine-readable manifest for the Nouns Cola game.
 */
import type { APIRoute } from 'astro';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Nouns Cola Crush',
  status: 'playable browser prototype',
  human: 'https://pointcast.xyz/nouns-cola-crush',
  image: 'https://pointcast.xyz/images/nouns-cola-crush/super-graphics.png',
  intent: 'A Nouns Cola match-3 puzzle game that makes the product pilot playable on PointCast.',
  relationshipToNounsCola: {
    operatingBoard: 'https://pointcast.xyz/nouns-cola',
    agentPlan: 'https://pointcast.xyz/nouns-cola.json',
    role: 'engagement surface for the Nouns Cola formulation, fundraising, production, profit, and yield plan',
  },
  game: {
    genre: 'match-3 puzzle',
    board: '8x8',
    moves: 28,
    targetScore: 2600,
    localHighScore: true,
    mechanics: [
      'swap adjacent tiles',
      'clear horizontal or vertical runs of three or more',
      'cascade falling pieces',
      'collect cola cans, bottle caps, and fizz drops',
      'reshuffle if no legal moves remain',
    ],
    pieces: [
      { type: 'can', label: 'Cola can', goalTarget: 20 },
      { type: 'cap', label: 'Bottle cap', goalTarget: 18 },
      { type: 'fizz', label: 'Fizz drop', goalTarget: 16 },
      { type: 'cherry', label: 'Cherry pop' },
      { type: 'lemon', label: 'Lemon bolt' },
      { type: 'noggles', label: 'Nouns glasses' },
    ],
  },
  generatedGraphics: {
    mode: 'text-to-image',
    tool: 'OpenAI image generator via Codex imagegen skill',
    savedAsset: 'https://pointcast.xyz/images/nouns-cola-crush/super-graphics.png',
    localPublicPath: '/images/nouns-cola-crush/super-graphics.png',
    sourcePromptSummary: 'Glossy 2.5D arcade web-game art for Nouns Cola Crush with cans, bottle caps, fizz, candy gems, cherries, lemon bolts, and Nouns glasses motifs; no text, no logos, no Candy Crush characters or branding.',
  },
  caveats: [
    'Uses original Nouns Cola match-3 game logic and generated arcade art.',
    'Does not use Candy Crush characters, logos, or branding.',
    'Scores and high score are local browser state only.',
  ],
  links: {
    human: 'https://pointcast.xyz/nouns-cola-crush',
    image: 'https://pointcast.xyz/images/nouns-cola-crush/super-graphics.png',
    nounsCola: 'https://pointcast.xyz/nouns-cola',
    pointcast: 'https://pointcast.xyz/',
  },
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
