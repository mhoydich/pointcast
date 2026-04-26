/**
 * /breathe-california.json - machine-readable mirror of /breathe-california.
 */
import type { APIRoute } from 'astro';

const token = {
  name: 'Breathe California',
  contract: 'KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP',
  tokenId: '10',
  objktUrl: 'https://objkt.com/tokens/KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP/10',
  image: 'https://pointcast.xyz/images/tokens/10.png',
  objktImage: 'https://assets.objkt.media/file/assets-003/KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP/10/thumb400',
  description: 'southern california usa',
};

const programs = [
  {
    id: 'calm',
    name: 'Coast Light',
    pattern: [4, 2, 6, 2],
    tone: 'soft shoreline',
    purpose: 'Short reset for stepping out of the feed and back into the body.',
    prompts: [
      'Let the inhale rise like a small wave.',
      'Rest at the crest without gripping.',
      'Exhale as the tide rolls back out.',
    ],
  },
  {
    id: 'current',
    name: 'Highway Hum',
    pattern: [5, 2, 7, 2],
    tone: 'long exhale',
    purpose: 'Longer exhale for clearing motion, noise, and task residue.',
    prompts: [
      'Breathe below the surface of the feed.',
      'Let each thought pass like heat off pavement.',
      'Lengthen the exhale until the coastline goes quiet.',
    ],
  },
  {
    id: 'moon',
    name: 'Pacific Square',
    pattern: [4, 4, 4, 4],
    tone: 'box breath',
    purpose: 'Even rhythm for closing the loop before the next block.',
    prompts: [
      'Inhale to the horizon.',
      'Pause in the late light.',
      'Exhale into the Pacific dark.',
    ],
  },
];

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/breathe-california.json',
    name: 'PointCast Breathe California',
    description:
      'Tezos token-backed breathing room with timed sessions, focus mode, local tide log, and optional generated ocean tone.',
    home: 'https://pointcast.xyz/breathe-california',
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
      { label: 'Ocean Meditation', url: 'https://pointcast.xyz/meditate' },
      { label: 'objkt profile', url: 'https://objkt.com/@mhoydich' },
      { label: 'PointCast home', url: 'https://pointcast.xyz/' },
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
