/**
 * /new-ocean.json - machine-readable mirror of /new-ocean.
 */
import type { APIRoute } from 'astro';

const token = {
  name: 'Piet Mondrian',
  roomName: 'New Ocean',
  contract: 'KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP',
  tokenId: '5',
  objktUrl: 'https://objkt.com/tokens/KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP/5',
  image: 'https://pointcast.xyz/images/tokens/5.png',
  objktImage: 'https://assets.objkt.media/file/assets-003/KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP/5/thumb400',
  description: 'Clipper Ship Ocean El Segundo',
};

const programs = [
  {
    id: 'calm',
    name: 'Harbor Line',
    pattern: [4, 2, 6, 2],
    tone: 'soft shoreline',
    purpose: 'Fast return to center when the day gets jagged.',
    prompts: [
      'Let the inhale draw a clean blue line.',
      'Pause at the mast.',
      'Exhale until the harbor settles.',
    ],
  },
  {
    id: 'current',
    name: 'Blue Grid',
    pattern: [5, 2, 7, 2],
    tone: 'long exhale',
    purpose: 'Longer exhale for quieting the screen and widening the frame.',
    prompts: [
      'Breathe below the surface of the feed.',
      'Let each thought take its square and pass.',
      'Lengthen the exhale toward open water.',
    ],
  },
  {
    id: 'moon',
    name: 'Night Crossing',
    pattern: [4, 4, 4, 4],
    tone: 'box breath',
    purpose: 'Even cadence for closing a loop without carrying it forward.',
    prompts: [
      'Inhale to the horizon.',
      'Hold in the quiet between waves.',
      'Exhale into the dark water.',
    ],
  },
];

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/new-ocean.json',
    name: 'PointCast New Ocean',
    description:
      'A fresh Tezos token-backed ocean room with timed sessions, focus mode, local tide log, and optional generated ocean tone.',
    home: 'https://pointcast.xyz/new-ocean',
    sourceProfile: 'https://objkt.com/@mhoydich',
    generatedAt: new Date().toISOString(),
    token,
    durations: [
      { seconds: 120, label: '2 min', name: 'Morning tide' },
      { seconds: 300, label: '5 min', name: 'Deep reset' },
      { seconds: 600, label: '10 min', name: 'Full drift' },
    ],
    programs,
    storage: {
      localStorageKey: 'pc:ocean-meditation',
      stores: ['completed session count', 'completed minutes', 'recent tide log'],
      serverPersistence: false,
    },
    related: [
      { label: 'Breathe California', url: 'https://pointcast.xyz/breathe-california' },
      { label: 'Ocean Meditation', url: 'https://pointcast.xyz/meditate' },
      { label: 'objkt token', url: token.objktUrl },
    ],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
