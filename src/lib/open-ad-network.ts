export type PointCastAdTone = 'signal' | 'garden' | 'play' | 'ritual' | 'network' | 'field';

export interface PointCastAd {
  id: string;
  advertiser: string;
  headline: string;
  copy: string;
  href: string;
  cta: string;
  tone: PointCastAdTone;
  contexts: string[];
  image?: string;
  sourceTool?: string;
  status: 'house';
}

export const OPEN_AD_PLACEMENT = {
  id: 'PC-0477',
  publisher: 'PointCast',
  placement: 'Sitewide contextual rail',
  format: 'Responsive text card',
  priceTezPerWeek: 12,
  settlement: 'prototype',
  tracking: 'none',
  note: 'One clearly labeled contextual placement across public PointCast pages. No behavioral profiles.',
} as const;

export const POINTCAST_ADS: PointCastAd[] = [
  {
    id: 'PC-HOUSE-001',
    advertiser: 'Bell & Signal',
    headline: 'Seventeen castings. No samples.',
    copy: 'Bells voiced like real towers, plus polite signals for honest machines. All CC0.',
    href: '/bell-and-signal',
    cta: 'Visit the foundry',
    tone: 'signal',
    contexts: ['drum', 'sound', 'radio', 'wire', 'press'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-002',
    advertiser: 'Sound Garden 001',
    headline: 'Grow a sound organism.',
    copy: 'Warmth, roughness, motion, and surprise in a browser-native instrument built for good accidents.',
    href: '/sound-garden',
    cta: 'Open the garden',
    tone: 'garden',
    contexts: ['sound', 'radio', 'garden', 'nature', 'art'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-003',
    advertiser: 'Last Tag',
    headline: "Don't be it at zero.",
    copy: 'Six runners, one shrinking yard, and a clock that does not care. Pass the tag.',
    href: '/last-tag',
    cta: 'Enter the yard',
    tone: 'play',
    contexts: ['play', 'game', 'drum', 'arcade', 'sport'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-004',
    advertiser: 'Common Hours',
    headline: 'Nine doors for the shape of a day.',
    copy: 'Bells, walks, candles, and small rituals gathered without flattening them into one thing.',
    href: '/common-hours',
    cta: 'Keep an hour',
    tone: 'ritual',
    contexts: ['prayer', 'ritual', 'meditate', 'quiet', 'hour'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-005',
    advertiser: 'Adventure Networks',
    headline: 'Infrastructure for improbable expeditions.',
    copy: 'A public field guide to resilient routes, shared equipment, and useful adventure systems.',
    href: '/adventure-networks',
    cta: 'Read the field guide',
    tone: 'network',
    contexts: ['network', 'agent', 'wire', 'press', 'field'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-006',
    advertiser: 'Prayer Labyrinth',
    headline: 'Walk the line. Return differently.',
    copy: 'A traced labyrinth meditation with no account, no score, and no need to hurry.',
    href: '/prayer-labyrinth',
    cta: 'Begin the walk',
    tone: 'field',
    contexts: ['prayer', 'walk', 'meditate', 'quiet', 'ritual'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-007',
    advertiser: "PointCast Today's Art",
    headline: 'The Positive Index.',
    copy: 'Fourteen works treat small public things as evidence that a generous future is already trying to arrive.',
    href: '/gallery/today',
    cta: 'Enter edit 002',
    tone: 'garden',
    contexts: ['gallery', 'today', 'art', 'garden'],
    image: revePositive.src,
    sourceTool: 'Reve',
    status: 'house',
  },
  {
    id: 'PC-HOUSE-008',
    advertiser: "PointCast Today's Art",
    headline: 'A small public miracle.',
    copy: 'A bus shelter becomes a garden. Fresh Midjourney work meets a deeper Ideogram archive and preserved ImageApp exports.',
    href: '/gallery/2026-07-21',
    cta: 'See the whole hanging',
    tone: 'field',
    contexts: ['gallery', 'today', 'art', 'field'],
    image: revePublicMiracle.src,
    sourceTool: 'Reve',
    status: 'house',
  },
  {
    id: 'PC-HOUSE-009',
    advertiser: "PointCast Today's Art",
    headline: 'Abundance flows.',
    copy: 'Four Ideogram posters surfaced below the familiar profile hits. The earnestness is part of the wager.',
    href: '/gallery/2026-07-21#abundance-title',
    cta: 'Open the deep cut',
    tone: 'signal',
    contexts: ['gallery', 'today', 'art', 'signal'],
    image: reveAbundance.src,
    sourceTool: 'Reve',
    status: 'house',
  },
];

function pathWords(pathname: string): string[] {
  return pathname.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function stablePathSeed(pathname: string): number {
  let seed = 0;
  for (const char of pathname) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  return seed;
}

export function selectAdsForPath(pathname: string, count = 2): PointCastAd[] {
  const words = new Set(pathWords(pathname));
  const seed = stablePathSeed(pathname || '/');
  return POINTCAST_ADS
    .map((ad, index) => ({
      ad,
      score: ad.contexts.reduce((total, context) => total + (words.has(context) ? 10 : 0), 0)
        + ((seed + index * 17) % 7),
    }))
    .sort((a, b) => b.score - a.score || a.ad.id.localeCompare(b.ad.id))
    .slice(0, Math.max(1, Math.min(count, POINTCAST_ADS.length)))
    .map(({ ad }) => ad);
}

export function adDestination(ad: PointCastAd, pathname: string): string {
  const joiner = ad.href.includes('?') ? '&' : '?';
  return `${ad.href}${joiner}utm_source=pointcast&utm_medium=open-ad-rail&utm_campaign=${ad.id.toLowerCase()}&utm_content=${encodeURIComponent(pathname || '/')}`;
}
import reveAbundance from '../assets/todays-art/2026-07-21/reve/abundance-flows.webp';
import revePositive from '../assets/todays-art/2026-07-21/reve/the-positive-index.webp';
import revePublicMiracle from '../assets/todays-art/2026-07-21/reve/small-public-miracle.webp';
