import { todayPT } from './daily';
import {
  ZEN_CAT_GENESIS_COLLECTIBLES,
  ZEN_CAT_WORLD_COLLECTIBLES,
  ZEN_CAT_WORLD_STYLE_PROMPT,
} from '../data/zen-cat-collectibles';

export const ZEN_CATS_VERSION = '0.1.0';
export const ZEN_CATS_SYMBOL = 'PCCAT';
export const ZEN_CATS_STORAGE_KEYS = {
  collection: 'pc:zen-cats:collection',
  genesisCollection: 'pc:zen-cats:genesis',
  worldCollection: 'pc:zen-cats:world',
  ritualPrefix: 'pc:zen-cats:rituals:',
} as const;

export const ZEN_CAT_CAPITAL_STORAGE_KEYS = {
  profile: 'pc:zen-cats:capital-profile',
  referrals: 'pc:zen-cats:capital-referrals',
  inboundReferral: 'pc:zen-cats:capital-inbound-referral',
  journeyCollection: 'pc:zen-cats:journey',
} as const;

export interface ZenCatPalette {
  ground: string;
  paper: string;
  fur: string;
  furAlt: string;
  accent: string;
  ink: string;
}

export interface ZenCatArchetype {
  id: string;
  name: string;
  coat: string;
  posture: string;
  mood: string;
  charm: string;
  mantra: string;
  palette: ZenCatPalette;
}

export interface ZenCatRitual {
  id: string;
  label: string;
  detail: string;
  points: number;
}

export interface ZenCatCapitalStage {
  id: string;
  rung: string;
  label: string;
  trigger: string;
  unlock: string;
  capitalAction: string;
  bitcoinStep: string;
  points: number;
}

export interface ZenCatReferralMilestone {
  count: number;
  label: string;
  unlock: string;
}

export interface ZenCatJourneyCollectible {
  id: string;
  number: number;
  title: string;
  stageId: string;
  motif: string;
  lesson: string;
  medium: string;
  rarity: string;
  pointsRequired: number;
  palette: {
    ground: string;
    accent: string;
    secondary: string;
    ink: string;
  };
  prompt: string;
}

export interface DailyZenCat {
  date: string;
  tokenId: number;
  cat: ZenCatArchetype;
  room: string;
  weather: string;
  luckyRoute: string;
  rarity: string;
  seed: number;
  metadataUrl: string;
  imageUrl: string;
}

export const ZEN_CAT_RITUALS: readonly ZenCatRitual[] = [
  {
    id: 'breathe',
    label: 'Breathe',
    detail: 'Four slow breaths with the room open.',
    points: 1,
  },
  {
    id: 'brush',
    label: 'Brush',
    detail: 'Smooth the coat and clear one tiny bit of static.',
    points: 1,
  },
  {
    id: 'tea',
    label: 'Offer Tea',
    detail: 'Leave a cup beside the cushion before minting.',
    points: 1,
  },
] as const;

export const ZEN_CAT_CAPITAL_PATHWAY: readonly ZenCatCapitalStage[] = [
  {
    id: 'seed',
    rung: '01',
    label: 'Seed Signal',
    trigger: 'Complete the daily ritual and collect one cat.',
    unlock: 'Local referral code and capital map.',
    capitalAction: 'Turn attention into a trackable habit before money enters the loop.',
    bitcoinStep: 'Learn wallet basics and private-key risk. No allocation yet.',
    points: 1,
  },
  {
    id: 'circle',
    rung: '02',
    label: 'Trust Circle',
    trigger: 'Invite one real collector into the garden.',
    unlock: 'Single-level referral ledger and friend-pass drops.',
    capitalAction: 'Build audience value through real product use, not recruitment payments.',
    bitcoinStep: 'Study volatility, custody, taxes, and loss scenarios.',
    points: 8,
  },
  {
    id: 'studio',
    rung: '03',
    label: 'Mint Studio',
    trigger: 'Reach three direct collectors and one stamped passport.',
    unlock: 'Tezos mint priority, creator receipts, and edition planning.',
    capitalAction: 'Convert art, curation, and sales into earned surplus.',
    bitcoinStep: 'Draft a non-custodial treasury policy before buying anything.',
    points: 18,
  },
  {
    id: 'market',
    rung: '04',
    label: 'Capital Rail',
    trigger: 'Reach eight direct collectors or a verified marketplace sale.',
    unlock: 'Affiliate disclosure kit and creator split ledger.',
    capitalAction: 'Route real earnings into runway, production, reserves, and taxes.',
    bitcoinStep: 'Simulate a reserve split. No yield, leverage, pooling, or custody.',
    points: 38,
  },
  {
    id: 'bitcoin',
    rung: '05',
    label: 'Sats Reserve',
    trigger: 'Reach twenty-one direct collectors and pass the safety checklist.',
    unlock: 'Bitcoin readiness checklist and self-custody handoff.',
    capitalAction: 'Only earned surplus moves, only by the user, after independent review.',
    bitcoinStep: 'Move to a personal Bitcoin wallet or regulated product when ready.',
    points: 88,
  },
] as const;

export const ZEN_CAT_REFERRAL_MILESTONES: readonly ZenCatReferralMilestone[] = [
  {
    count: 1,
    label: 'First Signal',
    unlock: 'Invite link becomes part of the passport story.',
  },
  {
    count: 3,
    label: 'Studio Circle',
    unlock: 'Mint-priority candidate once PCCAT is live.',
  },
  {
    count: 8,
    label: 'Market Lane',
    unlock: 'Eligible for one-level affiliate disclosure review.',
  },
  {
    count: 21,
    label: 'Treasury Circle',
    unlock: 'Bitcoin readiness checklist opens for earned surplus planning.',
  },
] as const;

const journeyPrompt = (
  title: string,
  motif: string,
  lesson: string,
  palette: string,
) =>
  `Zen Cats Journey Print collectible, sophisticated textile and gouache art-card style, quiet luxury, engraved cat fur lines, subtle Bitcoin and Tezos geometry as abstract motifs only, no logo, no text, no financial promise. Title concept: ${title}. Motif: ${motif}. Lesson: ${lesson}. Palette: ${palette}.`;

export const ZEN_CAT_JOURNEY_SERIES: readonly ZenCatJourneyCollectible[] = [
  {
    id: 'journey-001',
    number: 1,
    title: 'Seed Signal',
    stageId: 'seed',
    motif: 'one cream cat beside a small sprouting coin-shaped moon',
    lesson: 'attention becomes the first asset',
    medium: 'linen-gouache print',
    rarity: 'pathway',
    pointsRequired: 1,
    palette: { ground: '#f3efe2', accent: '#2d8a59', secondary: '#d6b14a', ink: '#17251d' },
    prompt: journeyPrompt('Seed Signal', 'one cream cat beside a small sprouting coin-shaped moon', 'attention becomes the first asset', 'warm ivory, garden green, muted gold, ink'),
  },
  {
    id: 'journey-002',
    number: 2,
    title: 'Invite Lantern',
    stageId: 'circle',
    motif: 'two cats sharing a lantern across a tiled garden path',
    lesson: 'trust grows by direct invitation',
    medium: 'woven travel card',
    rarity: 'pathway',
    pointsRequired: 8,
    palette: { ground: '#203f4b', accent: '#e08b76', secondary: '#9fd1c2', ink: '#071116' },
    prompt: journeyPrompt('Invite Lantern', 'two cats sharing a lantern across a tiled garden path', 'trust grows by direct invitation', 'deep blue, coral lantern, sea-glass mint, ink'),
  },
  {
    id: 'journey-003',
    number: 3,
    title: 'Passport Atelier',
    stageId: 'studio',
    motif: 'cat passport stamps drifting around a calm studio table',
    lesson: 'collectible culture needs provenance',
    medium: 'passport etching',
    rarity: 'studio',
    pointsRequired: 14,
    palette: { ground: '#6f8492', accent: '#d8a09b', secondary: '#fff1c6', ink: '#17202b' },
    prompt: journeyPrompt('Passport Atelier', 'cat passport stamps drifting around a calm studio table', 'collectible culture needs provenance', 'silver blue, blush coral, pale parchment, ink'),
  },
  {
    id: 'journey-004',
    number: 4,
    title: 'Tezos Receipt Garden',
    stageId: 'studio',
    motif: 'a cat guarding clean receipt ribbons and abstract chain links',
    lesson: 'mint only what can be explained clearly',
    medium: 'receipt-print gouache',
    rarity: 'studio',
    pointsRequired: 18,
    palette: { ground: '#244d45', accent: '#b9d8a2', secondary: '#d87b63', ink: '#0e1714' },
    prompt: journeyPrompt('Tezos Receipt Garden', 'a cat guarding clean receipt ribbons and abstract chain links', 'mint only what can be explained clearly', 'moss teal, pale green, coral seal, ink'),
  },
  {
    id: 'journey-005',
    number: 5,
    title: 'Market Tide',
    stageId: 'market',
    motif: 'cats on a quiet harbor ledge with small ledger waves',
    lesson: 'sales create surplus, not certainty',
    medium: 'harbor ledger print',
    rarity: 'market',
    pointsRequired: 28,
    palette: { ground: '#26485c', accent: '#e4b15f', secondary: '#a6c8d8', ink: '#0d1820' },
    prompt: journeyPrompt('Market Tide', 'cats on a quiet harbor ledge with small ledger waves', 'sales create surplus, not certainty', 'harbor blue, amber, pale tide, ink'),
  },
  {
    id: 'journey-006',
    number: 6,
    title: 'Runway Reserve',
    stageId: 'market',
    motif: 'a cat arranging three bowls for studio, tax, and reserve',
    lesson: 'capital gets calmer when named',
    medium: 'allocation still life',
    rarity: 'market',
    pointsRequired: 38,
    palette: { ground: '#f2eadb', accent: '#185fa5', secondary: '#c45b4a', ink: '#1b1710' },
    prompt: journeyPrompt('Runway Reserve', 'a cat arranging three bowls for studio, tax, and reserve', 'capital gets calmer when named', 'parchment, pointcast blue, coral red, ink'),
  },
  {
    id: 'journey-007',
    number: 7,
    title: 'Cold Key Window',
    stageId: 'bitcoin',
    motif: 'a white cat at a night window with a key-shaped constellation',
    lesson: 'self-custody starts with humility',
    medium: 'night-window textile',
    rarity: 'reserve',
    pointsRequired: 64,
    palette: { ground: '#16283a', accent: '#d6b14a', secondary: '#9cc6d4', ink: '#05090d' },
    prompt: journeyPrompt('Cold Key Window', 'a white cat at a night window with a key-shaped constellation', 'self-custody starts with humility', 'night blue, muted gold, glacier blue, black ink'),
  },
  {
    id: 'journey-008',
    number: 8,
    title: 'Sats Dawn',
    stageId: 'bitcoin',
    motif: 'a calm cat watching sunrise over abstract circular reserve marks',
    lesson: 'Bitcoin is an endpoint for earned surplus, never a promise',
    medium: 'dawn reserve print',
    rarity: 'reserve',
    pointsRequired: 88,
    palette: { ground: '#f4d7bd', accent: '#f7931a', secondary: '#496f7e', ink: '#24170d' },
    prompt: journeyPrompt('Sats Dawn', 'a calm cat watching sunrise over abstract circular reserve marks', 'Bitcoin is an endpoint for earned surplus, never a promise', 'dawn peach, bitcoin orange as color, slate blue, ink'),
  },
] as const;

export const ZEN_CAT_ARCHETYPES: readonly ZenCatArchetype[] = [
  {
    id: 'soba',
    name: 'Soba',
    coat: 'black sesame',
    posture: 'loaf on a cedar mat',
    mood: 'deep focus',
    charm: 'brass bell',
    mantra: 'Small paws, clean signal.',
    palette: {
      ground: '#eef4fa',
      paper: '#fffef7',
      fur: '#2c2b28',
      furAlt: '#59534c',
      accent: '#d6b14a',
      ink: '#14120f',
    },
  },
  {
    id: 'miso',
    name: 'Miso',
    coat: 'ginger cloud',
    posture: 'tail over toes',
    mood: 'warm attention',
    charm: 'paper crane',
    mantra: 'Notice the one bright thing.',
    palette: {
      ground: '#f6efe4',
      paper: '#ffffff',
      fur: '#c76b32',
      furAlt: '#efb36b',
      accent: '#24746b',
      ink: '#191513',
    },
  },
  {
    id: 'nori',
    name: 'Nori',
    coat: 'salt gray',
    posture: 'moon stretch',
    mood: 'quiet reach',
    charm: 'sea glass',
    mantra: 'Long spine, light mind.',
    palette: {
      ground: '#e8f0ef',
      paper: '#fffdf7',
      fur: '#7b8589',
      furAlt: '#b4bec0',
      accent: '#2f6f95',
      ink: '#101517',
    },
  },
  {
    id: 'yuzu',
    name: 'Yuzu',
    coat: 'cream tabby',
    posture: 'sun patch sit',
    mood: 'kind brightness',
    charm: 'citrus leaf',
    mantra: 'Let the day be easy to enter.',
    palette: {
      ground: '#f8f6de',
      paper: '#ffffff',
      fur: '#ead3a0',
      furAlt: '#b98643',
      accent: '#2d8a59',
      ink: '#1b1710',
    },
  },
  {
    id: 'plum',
    name: 'Plum',
    coat: 'calico ink',
    posture: 'paw over paw',
    mood: 'patient curiosity',
    charm: 'red thread',
    mantra: 'The next door opens softly.',
    palette: {
      ground: '#f3edf2',
      paper: '#fffefa',
      fur: '#f4e5cf',
      furAlt: '#7a3f34',
      accent: '#b52f45',
      ink: '#161111',
    },
  },
  {
    id: 'mochi',
    name: 'Mochi',
    coat: 'snow puff',
    posture: 'round cushion loaf',
    mood: 'settled joy',
    charm: 'blue ribbon',
    mantra: 'Enough is already arriving.',
    palette: {
      ground: '#edf3fb',
      paper: '#ffffff',
      fur: '#f7f4eb',
      furAlt: '#ccd4dd',
      accent: '#315cbe',
      ink: '#11151e',
    },
  },
  {
    id: 'sesame',
    name: 'Sesame',
    coat: 'tortoise smoke',
    posture: 'listening curl',
    mood: 'soft vigilance',
    charm: 'tiny drum',
    mantra: 'Hear what is already here.',
    palette: {
      ground: '#f1eee7',
      paper: '#fffdf8',
      fur: '#4f3f35',
      furAlt: '#ba8554',
      accent: '#8b4ec7',
      ink: '#18120f',
    },
  },
  {
    id: 'taro',
    name: 'Taro',
    coat: 'lilac point',
    posture: 'upright watcher',
    mood: 'crisp calm',
    charm: 'silver coin',
    mantra: 'Choose the cleanest path.',
    palette: {
      ground: '#eef0f7',
      paper: '#ffffff',
      fur: '#d9d4e6',
      furAlt: '#746982',
      accent: '#1d6f72',
      ink: '#12131b',
    },
  },
] as const;

export const ZEN_CAT_ROOMS = [
  'Window Seat',
  'Tea Rail',
  'Cedar Mat',
  'Quiet Console',
  'Moon Shelf',
  'Server Garden',
  'Paper Lantern',
  'Ocean Corner',
] as const;

export const ZEN_CAT_WEATHER = [
  'clear whiskers',
  'soft static',
  'bell air',
  'low tide',
  'warm logs',
  'slow rain',
  'paper moon',
  'kind packets',
] as const;

export const ZEN_CAT_ROUTES = [
  '/play',
  '/walk',
  '/room-weather',
  '/radio',
  '/routes',
  '/agent-derby',
  '/today',
  '/for-agents',
] as const;

export function dateToZenCatTokenId(date: string): number {
  return Number(date.replaceAll('-', ''));
}

function dateSeed(date: string): number {
  const [year, month, day] = date.split('-').map((part) => Number(part));
  return year * 1000 + month * 37 + day * 17;
}

function pick<T>(items: readonly T[], seed: number, offset = 0): T {
  return items[Math.abs(seed + offset) % items.length];
}

export function zenCatForDate(date: string): DailyZenCat {
  const seed = dateSeed(date);
  const tokenId = dateToZenCatTokenId(date);
  const cat = pick(ZEN_CAT_ARCHETYPES, seed);
  const room = pick(ZEN_CAT_ROOMS, seed, 3);
  const weather = pick(ZEN_CAT_WEATHER, seed, 7);
  const luckyRoute = pick(ZEN_CAT_ROUTES, seed, 11);
  const rarity = seed % 29 === 0 ? 'moon-rare' : seed % 11 === 0 ? 'tea-rare' : 'daily';

  return {
    date,
    tokenId,
    cat,
    room,
    weather,
    luckyRoute,
    rarity,
    seed,
    metadataUrl: `https://pointcast.xyz/api/zen-cat-metadata/${tokenId}.json`,
    imageUrl: `https://pointcast.xyz/api/zen-cat-svg/${tokenId}.svg`,
  };
}

export function todayZenCat(now: Date = new Date()): DailyZenCat {
  return zenCatForDate(todayPT(now));
}

export function recentZenCats(count = 9, now: Date = new Date()): DailyZenCat[] {
  const [year, month, day] = todayPT(now).split('-').map((part) => Number(part));
  const current = new Date(Date.UTC(year, month - 1, day));

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(current.getTime() - index * 86_400_000);
    const iso = date.toISOString().slice(0, 10);
    return zenCatForDate(iso);
  });
}

export function buildZenCatsManifest(now: Date = new Date()) {
  const today = todayZenCat(now);
  return {
    version: ZEN_CATS_VERSION,
    title: 'Zen Cat Garden',
    description:
      'A daily PointCast collection game: care for one deterministic zen cat, collect it locally, and mint it on Tezos when the dedicated PCCAT contract is deployed.',
    symbol: ZEN_CATS_SYMBOL,
    today,
    rituals: ZEN_CAT_RITUALS,
    storageKeys: ZEN_CATS_STORAGE_KEYS,
    recent: recentZenCats(9, now),
    genesis: {
      title: 'Genesis Garden',
      count: ZEN_CAT_GENESIS_COLLECTIBLES.length,
      storageKey: ZEN_CATS_STORAGE_KEYS.genesisCollection,
      collectibles: ZEN_CAT_GENESIS_COLLECTIBLES,
    },
    worldAtelier: {
      title: 'World Atelier',
      count: ZEN_CAT_WORLD_COLLECTIBLES.length,
      storageKey: ZEN_CATS_STORAGE_KEYS.worldCollection,
      stylePrompt: ZEN_CAT_WORLD_STYLE_PROMPT,
      collectibles: ZEN_CAT_WORLD_COLLECTIBLES,
    },
    capitalPathway: {
      title: 'Garden to Bitcoin',
      storageKeys: ZEN_CAT_CAPITAL_STORAGE_KEYS,
      stages: ZEN_CAT_CAPITAL_PATHWAY,
      referralMilestones: ZEN_CAT_REFERRAL_MILESTONES,
      journeySeries: {
        title: 'Journey Prints',
        count: ZEN_CAT_JOURNEY_SERIES.length,
        storageKey: ZEN_CAT_CAPITAL_STORAGE_KEYS.journeyCollection,
        collectibles: ZEN_CAT_JOURNEY_SERIES,
      },
      guardrails: [
        'No guaranteed returns or investment advice.',
        'No pay-to-join rewards, pooling, custody, leverage, or multi-level payout tree.',
        'Referral rewards stay tied to disclosed, genuine product activity.',
        'Bitcoin is an optional self-custody endpoint for earned surplus after independent review.',
      ],
    },
    tezos: {
      standard: 'FA2 / TZIP-21',
      metadataBase: 'https://pointcast.xyz/api/zen-cat-metadata',
      imageBase: 'https://pointcast.xyz/api/zen-cat-svg',
      tokenIdScheme: 'YYYYMMDD in Pacific time',
    },
  };
}
