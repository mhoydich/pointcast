import type { APIRoute } from 'astro';

const record = {
  schema: 'pointcast.model-study/v1',
  id: 'PC-QWEN-SILVER-LETTER-2026',
  series: 'PointCast Qwen Model Studies',
  study: '002',
  title: '银信气象台',
  subtitle: 'The Silver Letter Weather Office',
  status: 'public-local-instrument',
  publishedAt: '2026-07-25T20:16:31.000Z',
  canonical: 'https://pointcast.xyz/qwen-silver-letter',
  description:
    'A community weather-letter instrument rooted in Kaiping, Jiangmen, western Guangdong.',
  regionalFrame: {
    place: 'Kaiping, Jiangmen, Guangdong',
    sourceForm: 'Qiaopi or silver letters: family news and remittances carried between Wuyi home villages and overseas communities.',
    disclaimer:
      'A contemporary artwork inspired by regional histories; not an archive or a representation of every local experience.',
    reference: 'https://whc.unesco.org/en/list/1112/',
  },
  signals: [
    { id: 'river', label: 'Tan River level', labelZh: '潭江水位' },
    { id: 'kitchen', label: 'Kitchen warmth', labelZh: '厨房温度' },
    { id: 'distance', label: 'Distance from home', labelZh: '离家距离' },
    { id: 'neighbors', label: 'Neighbors helping', labelZh: '邻里照应' },
  ],
  qwenRelay: {
    language: {
      role: 'Turn the anonymous community average into one bilingual weather letter.',
      status: 'staged_pending_current_plan_entitlement',
    },
    audio: {
      modelFamily: 'Qwen Audio 3.0 TTS',
      role: 'Voice the dusk broadcast with Cantonese instruction control.',
      status: 'staged_pending_current_plan_entitlement',
      documentation:
        'https://docs.qwencloud.com/developer-guides/speech/realtime-streaming',
    },
    claim:
      'Qwen is designed to interpret the pressure between community signals, not speak for the community.',
  },
  interaction: {
    pointcastEdition: 'device-local; no submission leaves the page',
    storedIdentity: false,
    storedLocation: false,
    storedFreeText: false,
  },
  artifacts: {
    poster: 'https://pointcast.xyz/images/qwen-silver-letter/og.png',
    workspaceInstrument:
      'https://qwen-weather-memory.mhoydich.chatgpt.site/silver-letter',
    workspaceAccess: 'owner-only',
  },
  related: [
    'https://pointcast.xyz/qwen-weather',
    'https://pointcast.xyz/qwen-weather.json',
  ],
} as const;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(record, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
