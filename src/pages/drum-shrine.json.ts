import type { APIRoute } from 'astro';
import { SHRINE_NOUN_COUNT, shrineState } from '../lib/drum-shrine';

export const GET: APIRoute = () => {
  const state = shrineState();
  const payload = {
    type: 'pointcast.drum-shrine/v1',
    name: 'Drum Shrine',
    description: 'One deterministic Noun shared by every visitor until UTC midnight.',
    url: 'https://pointcast.xyz/drum-shrine',
    ...state,
    rotation: {
      timezone: 'UTC',
      cadence: 'daily',
      nounCount: SHRINE_NOUN_COUNT,
      formula: '(utcYear * 7 + utcDayOfYear * 13) % 1200',
    },
    interactions: {
      rings: 'local-only; stored per UTC date in pc:shrine:rings:{YYYY-MM-DD}',
      kneels: 'local-only; stored per UTC date in pc:shrine:kneels:{YYYY-MM-DD}',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=60',
    },
  });
};
