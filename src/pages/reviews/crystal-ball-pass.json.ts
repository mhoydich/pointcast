import type { APIRoute } from 'astro';
import { CRYSTAL_BALL_PASS_REVIEW } from '../../lib/crystal-ball-pass';

const review = {
  schema: 'pointcast.review/v1',
  ...CRYSTAL_BALL_PASS_REVIEW,
  url: 'https://pointcast.xyz/reviews/crystal-ball-pass',
  product: {
    name: 'Crystal Ball Pass',
    version: '1.0',
    url: 'https://pointcast.xyz/crystal-ball-pass',
    platform: 'responsive web',
    credits: 'Michael Hoydich × Codex / OpenAI for PointCast',
  },
  rating: { value: 4.6, outOf: 5 },
  scores: {
    atmosphere: 9.6,
    writing: 9.3,
    choicePlay: 8.6,
    sound: 8.2,
    restraint: 9.7,
  },
  facts: {
    scenes: 7,
    decisions: 7,
    estimatedMinutes: 5,
    generatedAudioVoices: 2,
    accountsRequired: 0,
    networkWrites: 0,
  },
  pros: [
    'Exceptional atmosphere built without a heavy game engine',
    'Funny, specific trail writing and an unusually charming pocket guide',
    'Clear five-minute arc with meaningful survival pressure',
    'Fully playable without accounts, permissions, or downloads',
  ],
  cons: [
    'The route rejoins the same seven scenes after each choice',
    'No durable save or long campaign mode',
    'Spotify and Hue are honest outbound handoffs, not live synchronized integrations',
  ],
  links: {
    game: 'https://pointcast.xyz/crystal-ball-pass',
    gameJson: 'https://pointcast.xyz/crystal-ball-pass.json',
    reviewsDesk: 'https://pointcast.xyz/reviews',
    playDesk: 'https://pointcast.xyz/play',
    pointcastBlock: 'https://pointcast.xyz/b/0550',
  },
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify(review, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
