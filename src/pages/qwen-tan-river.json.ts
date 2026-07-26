import type { APIRoute } from 'astro';

const record = {
  schema: 'pointcast.model-study/v1',
  id: 'PC-QWEN-TAN-RIVER-2026',
  series: 'PointCast Qwen Model Studies',
  study: '004',
  title: '潭江记忆潮汐',
  subtitle: 'Tan River Memory Tides',
  status: 'public-local-instrument',
  publishedAt: '2026-07-26T15:46:56.000Z',
  canonical: 'https://pointcast.xyz/qwen-tan-river',
  description:
    'Rain, travel, kitchens, migration, and river crossings become a device-local spatial sound map of cultural memory along the Tan River.',
  principle: 'This map remembers. It does not predict.',
  regionalFrame: {
    place: 'Tan River; Kaiping and Jiangmen, Guangdong',
    premise:
      'Five bounded memory categories make a contemporary listening map rooted in regional histories of river movement, ports, kitchens, migration, and crossings.',
    disclaimer:
      'A cultural-memory artwork, not collected testimony, an archive, live hydrology, or a flood-warning system.',
  },
  qwenRelay: {
    modelRole: 'Generate five concise bilingual poetic memory seeds.',
    status: 'completed_via_qwen_token_plan_2026_07_26',
    seedsAre:
      'Qwen-authored poetic prompts; not testimony, oral history, quotations, or evidence from residents.',
    audio:
      'Procedural browser Web Audio, composed locally and silent until an explicit listener gesture; not Qwen Audio.',
  },
  tides: [
    { id: 'rain', label: 'Rain', labelZh: '雨' },
    { id: 'travel', label: 'Travel', labelZh: '行' },
    { id: 'kitchen', label: 'Kitchen', labelZh: '灶' },
    { id: 'migration', label: 'Migration', labelZh: '迁' },
    { id: 'crossing', label: 'Crossing', labelZh: '渡' },
  ],
  prohibitedRoles: [
    'flood warning',
    'hydrology or water-level reporting',
    'forecasting or emergency guidance',
    'representing generated language as resident testimony',
    'voice, identity, account, or location surveillance',
  ],
  interaction: {
    pointcastEdition: 'device-local; no submission leaves the page',
    localStorage: 'five numeric category counts only',
    storedIdentity: false,
    storedVoice: false,
    storedLocation: false,
    storedFreeText: false,
    automatedSafetyDecision: false,
  },
  sources: [
    'https://www.jiangmen.gov.cn/bmpd/jmsslj/qmtxhczzt/hhgk/content/post_902816.html',
    'https://www.jiangmen.gov.cn/gkmlpt/content/1/1040/post_1040012.html',
    'https://www.kaiping.gov.cn/kpszfw/kpfc/lswh/kpgs/content/post_3487461.html',
    'https://www.unesco.org/en/memory-world/qiaopi-and-yinxin-correspondence-and-remittance-documents-overseas-chinese',
  ],
  artifacts: {
    poster: 'https://pointcast.xyz/images/qwen-tan-river/og.png',
    workspaceInstrument:
      'https://qwen-weather-memory.mhoydich.chatgpt.site/tan-river',
    workspaceAccess: 'owner-only',
    workspaceParticipation:
      'anonymous shared D1 count storing one bounded category per mark',
  },
  related: [
    'https://pointcast.xyz/qwen-weather',
    'https://pointcast.xyz/qwen-silver-letter',
    'https://pointcast.xyz/qwen-good-intelligence',
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
