/**
 * /meditate.json - machine-readable mirror of /meditate.
 */
import type { APIRoute } from 'astro';

const programs = [
  {
    id: 'calm',
    name: 'Calm Bay',
    pattern: [4, 2, 6, 2],
    tone: 'soft shoreline',
    purpose: 'Quick nervous-system reset between blocks, calls, and shipping.',
    prompts: [
      'Let the inhale rise like a small wave.',
      'Rest at the crest without gripping.',
      'Exhale as the tide rolls back out.',
    ],
  },
  {
    id: 'current',
    name: 'Deep Current',
    pattern: [5, 2, 7, 2],
    tone: 'long exhale',
    purpose: 'Longer exhale for clearing mental noise before focused work.',
    prompts: [
      'Breathe below the surface of the feed.',
      'Let each thought pass like sea glass in the current.',
      'Lengthen the exhale until the water goes still.',
    ],
  },
  {
    id: 'moon',
    name: 'Moon Tide',
    pattern: [4, 4, 4, 4],
    tone: 'box breath',
    purpose: 'Evening square breath for letting the day close.',
    prompts: [
      'Inhale to the horizon.',
      'Pause in the silver quiet.',
      'Exhale into the dark water.',
    ],
  },
];

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/meditate.json',
    name: 'PointCast Ocean Meditation',
    description:
      'Ocean-based breathing room with timed sessions, focus mode, local tide log, and optional generated ocean tone.',
    home: 'https://pointcast.xyz/meditate',
    generatedAt: new Date().toISOString(),
    archiveBlock: {
      id: '0337',
      url: 'https://pointcast.xyz/b/0337',
      jsonUrl: 'https://pointcast.xyz/b/0337.json',
    },
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
    artifact: {
      name: 'Breathe El Segundo',
      image: 'https://pointcast.xyz/images/tokens/breathe-el-segundo.webp',
    },
    related: [
      { label: 'PointCast home', url: 'https://pointcast.xyz/' },
      { label: 'Nature field guide', url: 'https://pointcast.xyz/nature' },
      { label: 'Blocks JSON', url: 'https://pointcast.xyz/blocks.json' },
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
