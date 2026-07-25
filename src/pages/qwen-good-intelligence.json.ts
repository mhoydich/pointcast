import type { APIRoute } from 'astro';

const record = {
  schema: 'pointcast.model-study/v1',
  id: 'PC-QWEN-GOOD-INTELLIGENCE-2026',
  series: 'PointCast Qwen Model Studies',
  study: '003',
  title: '善智调度局',
  subtitle: 'The Good Intelligence Dispatch',
  status: 'public-local-instrument',
  publishedAt: '2026-07-25T20:50:12.000Z',
  canonical: 'https://pointcast.xyz/qwen-good-intelligence',
  description:
    'A device-local care-routing instrument rooted in Kaiping and Jiangmen, Guangdong.',
  principle: 'Intelligence for good does not score people. It routes care.',
  regionalFrame: {
    place: 'Kaiping, Jiangmen, Guangdong',
    premise:
      'Pair one bounded community need with one bounded capacity to produce a small, accountable action brief.',
    disclaimer:
      'A contemporary civic artwork, not a public-service allocator or a representation of every local experience.',
  },
  needs: [
    { id: 'meals', label: 'Warm meals', labelZh: '热饭' },
    { id: 'elders', label: 'Elder check-ins', labelZh: '探访长者' },
    { id: 'learning', label: 'Learning kits', labelZh: '学习物资' },
    { id: 'repairs', label: 'Small repairs', labelZh: '小修小补' },
  ],
  capacities: [
    { id: 'time', label: 'Time', labelZh: '时间' },
    { id: 'transport', label: 'Transport', labelZh: '车程' },
    { id: 'translation', label: 'Translation', labelZh: '翻译' },
    { id: 'materials', label: 'Materials', labelZh: '物资' },
  ],
  qwenRelay: {
    language: {
      role: 'Draft a bilingual action brief from one need and one capacity.',
      status: 'staged_pending_current_plan_entitlement',
    },
    audio: {
      role: 'Read the brief in a locally directed voice after community review.',
      status: 'staged_pending_current_plan_entitlement',
    },
    boundary:
      'Qwen may help translate and clarify a community-authored pairing. It may not decide who deserves help.',
  },
  prohibitedRoles: [
    'resident scoring',
    'eligibility decisions',
    'allocation of money or services',
    'identity or location profiling',
  ],
  interaction: {
    pointcastEdition: 'device-local; no submission leaves the page',
    storedIdentity: false,
    storedLocation: false,
    storedFreeText: false,
    automatedDecision: false,
  },
  artifacts: {
    poster: 'https://pointcast.xyz/images/qwen-good-intelligence/og.png',
    workspaceInstrument:
      'https://qwen-weather-memory.mhoydich.chatgpt.site/good-intelligence',
    workspaceAccess: 'owner-only',
  },
  related: [
    'https://pointcast.xyz/qwen-weather',
    'https://pointcast.xyz/qwen-silver-letter',
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
