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
    tezos: {
      standard: 'FA2 / TZIP-21',
      metadataBase: 'https://pointcast.xyz/api/zen-cat-metadata',
      imageBase: 'https://pointcast.xyz/api/zen-cat-svg',
      tokenIdScheme: 'YYYYMMDD in Pacific time',
    },
  };
}
