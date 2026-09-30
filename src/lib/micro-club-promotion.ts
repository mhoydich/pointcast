import type { PointCastAd } from './open-ad-network';

const MICRO_CLUB_ORIGIN = 'https://pointcast-micro-club.mhoydich.workers.dev';

export const MICRO_CLUB_CAMPAIGN = {
  id: 'PC-MICRO-CLUB-2026',
  label: 'PointCast Micro Club - Small keys. Big detour.',
  advertiser: 'PointCast Micro Club',
  creativeCount: 3,
  placement: 'Second native rail slot after A Little More Light on keyboard, games, play, studio, connectors, and agents routes; preferred portable rotation on PointCast and Industry Next',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A first-party invitation to six browser games and private invite-only Signal Rooms. Browser play supports ordinary keys and touch. Hardware lights require a separately configured local bridge; sound starts only after a visitor enables it.',
} as const;

export const MICRO_CLUB_PROMO_DISPATCHES: PointCastAd[] = [
  {
    id: 'PC-MICRO-CLUB-001',
    advertiser: MICRO_CLUB_CAMPAIGN.advertiser,
    headline: 'Small keys. Big detour.',
    copy: 'Six little games. One good reason to stop working.',
    href: `${MICRO_CLUB_ORIGIN}/v2/`,
    cta: 'Take a little detour',
    tone: 'play',
    contexts: ['micro', 'keyboard', 'games', 'play', 'break', 'controller'],
    image: `${MICRO_CLUB_ORIGIN}/ads/art/small-keys.png`,
    sourceTool: 'OpenAI ImageGen',
    campaign: MICRO_CLUB_CAMPAIGN.id,
    seriesLabel: MICRO_CLUB_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-MICRO-CLUB-002',
    advertiser: MICRO_CLUB_CAMPAIGN.advertiser,
    headline: 'Say it in color.',
    copy: 'A private room for people, agents, and a little good signal.',
    href: `${MICRO_CLUB_ORIGIN}/signals/`,
    cta: 'Send a little signal',
    tone: 'signal',
    contexts: ['micro', 'agents', 'connectors', 'signal', 'signals', 'message', 'color'],
    image: `${MICRO_CLUB_ORIGIN}/ads/art/say-it.png`,
    sourceTool: 'OpenAI ImageGen',
    campaign: MICRO_CLUB_CAMPAIGN.id,
    seriesLabel: MICRO_CLUB_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-MICRO-CLUB-003',
    advertiser: MICRO_CLUB_CAMPAIGN.advertiser,
    headline: 'Your desk has a nightlife.',
    copy: 'Turn a dial. Catch a beat. Make a little time for play.',
    href: `${MICRO_CLUB_ORIGIN}/v2/?game=pulse`,
    cta: 'Catch the pulse',
    tone: 'ritual',
    contexts: ['micro', 'studio', 'desk', 'dial', 'beat', 'pulse', 'rhythm'],
    image: `${MICRO_CLUB_ORIGIN}/ads/art/after-hours.png`,
    sourceTool: 'OpenAI ImageGen',
    campaign: MICRO_CLUB_CAMPAIGN.id,
    seriesLabel: MICRO_CLUB_CAMPAIGN.label,
    status: 'house',
  },
];
