import reveAbundance from '../assets/todays-art/2026-07-21/reve/abundance-flows.webp';
import revePositive from '../assets/todays-art/2026-07-21/reve/the-positive-index.webp';
import revePublicMiracle from '../assets/todays-art/2026-07-21/reve/small-public-miracle.webp';
import drumNounUniversePoster from '../assets/campaigns/pointcast-drum-noun-universe/115-rooms-one-shared-pulse.webp';

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
  campaign?: string;
  seriesLabel?: string;
  seriesIndex?: number;
  status: 'house';
}

export const OPEN_AD_PLACEMENT = {
  id: 'PC-0477',
  publisher: 'PointCast',
  placement: 'Sitewide contextual rail',
  format: 'Responsive text card',
  priceTezPerWeek: 12,
  settlement: 'prototype',
  tracking: 'aggregate impressions + clicks',
  note: 'One clearly labeled contextual placement across public PointCast pages. Aggregate events only; no visitor identifiers or behavioral profiles.',
} as const;

export const NOUNS_ABOUT_CAMPAIGN = {
  id: 'PC-NOUNS-ABOUT-2026',
  label: 'Nouns: Permission Is the Starting Point',
  advertiser: 'Industry Next',
  creativeCount: 3,
  placement: 'Contextual rotation across public PointCast pages',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'Three first-party house creatives for a concise field note on why Nouns and CC0 remain unusually interesting.',
} as const;

export const DRUM_COMPENDIUM_CAMPAIGN = {
  id: 'PC-DRUM-COMPENDIUM-2026',
  label: 'Drum Compendium',
  advertiser: 'PointCast',
  creativeCount: 6,
  placement: 'One contextual creative on every public /drum surface',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A six-part PointCast house campaign distributed by URL context, never visitor behavior.',
} as const;

export const DRUM_NOUN_UNIVERSE_CAMPAIGN = {
  id: 'PC-DRUM-NOUN-UNIVERSE-2026',
  label: 'Drum Noun Universe',
  advertiser: 'PointCast',
  creativeCount: 1,
  placement: 'Featured homepage unit and contextual placement across public non-Drum pages',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A first-party PointCast house campaign distributed sitewide with aggregate event counts, no visitor profiles, and no paid media.',
} as const;

export const POINTCAST_ADS: PointCastAd[] = [
  {
    id: 'PC-NOUNS-ABOUT-001',
    advertiser: 'Industry Next',
    headline: 'Permission is the starting point.',
    copy: 'A concise field note on Nouns, CC0, and what becomes possible when culture arrives with room to move.',
    href: 'https://www.industrynext.xyz/about/',
    cta: 'Read about Nouns',
    tone: 'signal',
    contexts: ['nouns', 'noun', 'cc0', 'open', 'art', 'culture', 'agent', 'remix', 'public', 'press'],
    campaign: NOUNS_ABOUT_CAMPAIGN.id,
    seriesLabel: NOUNS_ABOUT_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-NOUNS-ABOUT-002',
    advertiser: 'Industry Next',
    headline: 'CC0 makes the work movable.',
    copy: 'Not an exhaustive history. A high-level case for why reusable characters can keep becoming more culturally alive.',
    href: 'https://www.industrynext.xyz/about/',
    cta: 'Open the field note',
    tone: 'garden',
    contexts: ['cc0', 'art', 'gallery', 'today', 'garden', 'culture', 'commons', 'make', 'studio'],
    campaign: NOUNS_ABOUT_CAMPAIGN.id,
    seriesLabel: NOUNS_ABOUT_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-NOUNS-ABOUT-003',
    advertiser: 'Industry Next',
    headline: 'A Noun is a beginning, not a boundary.',
    copy: 'The interesting part is not only what exists. It is how freely a Noun can travel into the next image, story, tool, or game.',
    href: 'https://www.industrynext.xyz/about/',
    cta: 'See why it matters',
    tone: 'play',
    contexts: ['noun', 'nouns', 'drum', 'play', 'game', 'agent', 'town', 'network', 'story', 'tool'],
    campaign: NOUNS_ABOUT_CAMPAIGN.id,
    seriesLabel: NOUNS_ABOUT_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-DRUM-UNIVERSE-001',
    advertiser: 'PointCast',
    headline: '115 rooms. One shared pulse.',
    copy: 'Drum machines, games, radio, rituals, tiny theaters, and agent paths form one playable Noun universe. No signup, wallet, purchase, or token required.',
    href: '/drum-press',
    cta: 'Enter the universe',
    tone: 'signal',
    contexts: ['home', 'pointcast', 'town', 'room', 'play', 'game', 'sound', 'agent', 'press', 'art'],
    image: drumNounUniversePoster.src,
    sourceTool: 'OpenAI image generation',
    campaign: DRUM_NOUN_UNIVERSE_CAMPAIGN.id,
    seriesLabel: DRUM_NOUN_UNIVERSE_CAMPAIGN.label,
    status: 'house',
  },
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
  {
    id: 'PC-DRUM-001',
    advertiser: 'PointCast',
    headline: 'The town has a tempo.',
    copy: 'Art, games, field notes, agents, and public experiments—one small internet town, still being built in the open.',
    href: '/town',
    cta: 'Walk into town',
    tone: 'signal',
    contexts: ['drum', 'room', 'now', 'lobby', 'meet', 'threshold', 'v2', 'v4', 'v6', 'v8', 'v10', 'v12', 'v14', 'v18'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 1,
    status: 'house',
  },
  {
    id: 'PC-DRUM-002',
    advertiser: 'PointCast',
    headline: 'Look between the beats.',
    copy: "Today's Art hangs a new edit from PointCast's image archive: public miracles, useful futures, and a little visual weather.",
    href: '/gallery/today',
    cta: "See today's hanging",
    tone: 'garden',
    contexts: ['drum', 'portrait', 'postcard', 'stickers', 'tape', 'warhol', 'aurora', 'v3', 'v7', 'v9', 'v13', 'v15', 'v17'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 2,
    status: 'house',
  },
  {
    id: 'PC-DRUM-003',
    advertiser: 'PointCast',
    headline: 'The signal keeps moving.',
    copy: 'New rooms, releases, and odd little utilities arrive on the Press Wire with a public JSON and RSS trail behind them.',
    href: '/press',
    cta: 'Read the wire',
    tone: 'field',
    contexts: ['drum', 'press', 'radio', 'tv', 'marquee', 'bulletin', 'shout', 'letters', 'reception', 'viz'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 3,
    status: 'house',
  },
  {
    id: 'PC-DRUM-004',
    advertiser: 'PointCast',
    headline: 'Agents can keep time.',
    copy: 'Add PointCast as a connector, read the town map, inspect public state, and let a machine join the same room as everyone else.',
    href: '/connectors',
    cta: 'Connect an agent',
    tone: 'network',
    contexts: ['drum', 'agent', 'agents', 'quintet', 'conductor', 'scorebook', 'mcp', 'altar'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 4,
    status: 'house',
  },
  {
    id: 'PC-DRUM-005',
    advertiser: 'PointCast',
    headline: 'Five ways to miss the beat.',
    copy: 'Memory, reaction, groove completion, loop defense, and silent tempo control. No signup. Start in one tap.',
    href: '/drum-games',
    cta: 'Enter the arcade',
    tone: 'play',
    contexts: ['drum', 'games', 'says', 'runner', 'quickdraw', 'fill', 'steady', 'solo', 'duel', 'league', 'relay', 'potato', 'v16'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 5,
    status: 'house',
  },
  {
    id: 'PC-DRUM-006',
    advertiser: 'PointCast',
    headline: 'Keep the strange little rooms.',
    copy: 'The compendium is bigger than the front door: bells, shrines, broadcasts, keepsakes, ceremonies, and tiny instruments all remain playable.',
    href: '/drum-press',
    cta: 'Open the compendium',
    tone: 'ritual',
    contexts: ['drum', 'bell', 'shrine', 'rosary', 'koan', 'prayer', 'mantra', 'lantern', 'bath', 'meditate', 'zen', 'vespers', 'saint', 'offering'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 6,
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
  const cappedCount = Math.max(1, Math.min(count, POINTCAST_ADS.length));
  const ranked = POINTCAST_ADS
    .map((ad, index) => ({
      ad,
      score: ad.contexts.reduce((total, context) => total + (words.has(context) ? 10 : 0), 0)
        + ((seed + index * 17) % 7),
    }))
    .sort((a, b) => b.score - a.score || a.ad.id.localeCompare(b.ad.id))
    .map(({ ad }) => ad);

  const isDrumSurface = /^\/(?:drum(?:-|\/|$)|dispatch-drum(?:\/|$))/.test(pathname);
  if (!isDrumSurface) {
    const universeCreative = ranked.find((ad) => ad.campaign === DRUM_NOUN_UNIVERSE_CAMPAIGN.id);
    if (!universeCreative) return ranked.slice(0, cappedCount);

    const companionAds = ranked.filter((ad) => (
      ad.campaign !== DRUM_NOUN_UNIVERSE_CAMPAIGN.id
      && ad.campaign !== DRUM_COMPENDIUM_CAMPAIGN.id
    ));
    return [universeCreative, ...companionAds].slice(0, cappedCount);
  }

  const drumCreative = ranked.find((ad) => ad.campaign === DRUM_COMPENDIUM_CAMPAIGN.id);
  if (!drumCreative) return ranked.slice(0, cappedCount);

  const companionAds = ranked.filter((ad) => (
    ad.campaign !== DRUM_COMPENDIUM_CAMPAIGN.id
    && ad.campaign !== DRUM_NOUN_UNIVERSE_CAMPAIGN.id
  ));
  return [drumCreative, ...companionAds].slice(0, cappedCount);
}

export function adDestination(ad: PointCastAd, pathname: string): string {
  const joiner = ad.href.includes('?') ? '&' : '?';
  const campaign = (ad.campaign || ad.id).toLowerCase();
  const content = `${pathname || '/'}:${ad.id.toLowerCase()}`;
  return `${ad.href}${joiner}utm_source=pointcast&utm_medium=open-ad-rail&utm_campaign=${campaign}&utm_content=${encodeURIComponent(content)}`;
}
