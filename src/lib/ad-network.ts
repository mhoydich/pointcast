export const AD_NETWORK_VERSION = '0.2.0';

export const AD_SLOTS = {
  'medium-rectangle': {
    id: 'medium-rectangle',
    label: 'Medium rectangle',
    width: 300,
    height: 250,
    maxInitialKilobytes: 150,
    flexibleRatio: '6:5',
  },
  leaderboard: {
    id: 'leaderboard',
    label: 'Leaderboard',
    width: 728,
    height: 90,
    maxInitialKilobytes: 100,
    flexibleRatio: '8:1',
  },
  'mobile-banner': {
    id: 'mobile-banner',
    label: 'Mobile banner',
    width: 320,
    height: 50,
    maxInitialKilobytes: 50,
    flexibleRatio: '6:1',
  },
  'half-page': {
    id: 'half-page',
    label: 'Half page',
    width: 300,
    height: 600,
    maxInitialKilobytes: 250,
    flexibleRatio: '1:2',
  },
} as const;

export type AdSlotId = keyof typeof AD_SLOTS;

export type AdTheme = {
  background: string;
  foreground: string;
  accent: string;
  muted: string;
};

export type AdCampaign = {
  id: string;
  creativeId: string;
  name: string;
  sponsor: string;
  kind: 'house';
  status: 'active' | 'paused';
  startsAt: string;
  weight: number;
  destination: string;
  destinationSurface: 'pointcast' | 'external';
  slots: AdSlotId[];
  mark: string;
  kicker: string;
  headline: string;
  body: string;
  cta: string;
  boundary?: string;
  theme: AdTheme;
};

export const AD_CAMPAIGNS: readonly AdCampaign[] = [
  {
    id: 'bell-and-signal-001',
    creativeId: 'bell-and-signal-castings-a',
    name: 'Bell & Signal house campaign',
    sponsor: 'PointCast',
    kind: 'house',
    status: 'active',
    startsAt: '2026-07-20',
    weight: 3,
    destination: 'https://pointcast.xyz/bell-and-signal',
    destinationSurface: 'pointcast',
    slots: ['medium-rectangle', 'leaderboard', 'mobile-banner', 'half-page'],
    mark: '◉',
    kicker: 'A SMALL SOUND FOUNDRY',
    headline: 'Seventeen castings. No samples.',
    body: 'Bells voiced like real towers and polite signals for honest machines. All CC0.',
    cta: 'Visit the foundry',
    theme: { background: '#14121f', foreground: '#f2ead9', accent: '#ffd76a', muted: '#c4a35a' },
  },
  {
    id: 'last-tag-001',
    creativeId: 'last-tag-yard-a',
    name: 'Last Tag house campaign',
    sponsor: 'PointCast',
    kind: 'house',
    status: 'active',
    startsAt: '2026-07-20',
    weight: 3,
    destination: 'https://pointcast.xyz/last-tag',
    destinationSurface: 'pointcast',
    slots: ['medium-rectangle', 'leaderboard', 'mobile-banner', 'half-page'],
    mark: 'IT',
    kicker: 'SIX RUNNERS · ONE CLOCK',
    headline: "Don't be it at zero.",
    body: 'Pass the tag. Spend your dash wisely. The yard is shrinking.',
    cta: 'Play Last Tag',
    theme: { background: '#ffdd33', foreground: '#14110a', accent: '#c4351c', muted: '#a33409' },
  },
  {
    id: 'sound-garden-001',
    creativeId: 'sound-garden-grow-a',
    name: 'Sound Garden 001 house campaign',
    sponsor: 'PointCast',
    kind: 'house',
    status: 'active',
    startsAt: '2026-07-20',
    weight: 2,
    destination: 'https://pointcast.xyz/sound-garden',
    destinationSurface: 'pointcast',
    slots: ['medium-rectangle', 'leaderboard', 'mobile-banner', 'half-page'],
    mark: '✿',
    kicker: 'GENERATIVE BROWSER INSTRUMENT',
    headline: 'Grow a sound.',
    body: 'Shape warmth, roughness, motion, and surprise. Record the result locally.',
    cta: 'Open Sound Garden',
    theme: { background: '#d8f07a', foreground: '#17362d', accent: '#ee5d3a', muted: '#47725e' },
  },
  {
    id: 'common-hours-001',
    creativeId: 'common-hours-ritual-a',
    name: 'Common Hours house campaign',
    sponsor: 'PointCast',
    kind: 'house',
    status: 'active',
    startsAt: '2026-07-20',
    weight: 2,
    destination: 'https://pointcast.xyz/common-hours',
    destinationSurface: 'pointcast',
    slots: ['medium-rectangle', 'leaderboard', 'mobile-banner', 'half-page'],
    mark: '⌁',
    kicker: 'BELLS · ALTARS · SMALL RITUALS',
    headline: 'Begin the hour again.',
    body: 'A field guide to the small rituals and shared hours around PointCast.',
    cta: 'Enter Common Hours',
    theme: { background: '#f2ead9', foreground: '#182b32', accent: '#d85d26', muted: '#60777a' },
  },
  {
    id: 'adventure-networks-001',
    creativeId: 'adventure-networks-route-a',
    name: 'Adventure Networks house campaign',
    sponsor: 'PointCast',
    kind: 'house',
    status: 'active',
    startsAt: '2026-07-20',
    weight: 2,
    destination: 'https://pointcast.xyz/adventure-networks',
    destinationSurface: 'pointcast',
    slots: ['medium-rectangle', 'leaderboard', 'mobile-banner', 'half-page'],
    mark: '↟',
    kicker: 'ROUTES · PACKS · RETURN DISPATCHES',
    headline: 'Take the strange way home.',
    body: 'Compose a route, check the pack, stamp the field notes, and bring back a dispatch.',
    cta: 'Plan an adventure',
    theme: { background: '#123b35', foreground: '#f4efd8', accent: '#f4b83f', muted: '#8fc6a7' },
  },
  {
    id: 'nine-lives-001',
    creativeId: 'nine-lives-doors-a',
    name: 'Allworthy Nine Lives house campaign',
    sponsor: 'Allworthy',
    kind: 'house',
    status: 'active',
    startsAt: '2026-07-20',
    weight: 1,
    destination: 'https://allworthy.xyz/nine-lives',
    destinationSurface: 'external',
    slots: ['medium-rectangle', 'leaderboard', 'mobile-banner', 'half-page'],
    mark: '9',
    kicker: 'ALLWORTHY · TEZOS FIELD EXPERIMENT',
    headline: 'One tez. Nine doors. One giant kitty.',
    body: 'A public, view-only simulation of a Tezos distribution experiment.',
    cta: 'Enter Nine Lives',
    boundary: 'VIEW ONLY · NO WALLET · NO FUNDS MOVE',
    theme: { background: '#1647cf', foreground: '#f4eedf', accent: '#bfd500', muted: '#ff9472' },
  },
  {
    id: 'el-segundo-2026-001',
    creativeId: 'el-segundo-2026-life-first-a',
    name: 'El Segundo 2026 civic atlas house campaign',
    sponsor: 'Michael Hoydich',
    kind: 'house',
    status: 'active',
    startsAt: '2026-07-20',
    weight: 3,
    destination: 'https://el-segundo-2026-atlas.mhoydich.chatgpt.site',
    destinationSurface: 'external',
    slots: ['medium-rectangle', 'leaderboard', 'mobile-banner', 'half-page'],
    mark: '100',
    kicker: 'A FIRST-PRINCIPLES CIVIC ATLAS',
    headline: 'Design the town for being alive.',
    body: 'One hundred propositions for water, leisure, knowledge, care, nature, and every human state.',
    cta: 'Open El Segundo 2026',
    boundary: 'PUBLIC CIVIC SPECULATION · NO OFFICIAL STATUS',
    theme: { background: '#0b456f', foreground: '#f1f0e8', accent: '#ff8a52', muted: '#99c9df' },
  },
] as const;

export function isAdSlotId(value: string | null): value is AdSlotId {
  return Boolean(value && Object.prototype.hasOwnProperty.call(AD_SLOTS, value));
}

export function normalizePlacement(value: string | null): string | null {
  const placement = value?.trim().toLowerCase() ?? '';
  return /^[a-z0-9][a-z0-9._:-]{0,63}$/.test(placement) ? placement : null;
}

export function getAdCampaign(id: string | null): AdCampaign | undefined {
  return AD_CAMPAIGNS.find((campaign) => campaign.id === id);
}

export function campaignsForSlot(slot: AdSlotId, excluded: readonly string[] = []): AdCampaign[] {
  const exclusions = new Set(excluded.slice(0, 12));
  const active = AD_CAMPAIGNS.filter(
    (campaign) => campaign.status === 'active' && campaign.slots.includes(slot),
  );
  const fresh = active.filter((campaign) => !exclusions.has(campaign.id));
  return fresh.length > 0 ? fresh : active;
}

export function selectAdCampaign(
  slot: AdSlotId,
  entropy: string,
  excluded: readonly string[] = [],
): AdCampaign | undefined {
  const eligible = campaignsForSlot(slot, excluded);
  const totalWeight = eligible.reduce((sum, campaign) => sum + campaign.weight, 0);
  if (totalWeight <= 0) return undefined;

  let choice = stableHash(entropy) % totalWeight;
  for (const campaign of eligible) {
    if (choice < campaign.weight) return campaign;
    choice -= campaign.weight;
  }
  return eligible[0];
}

export function destinationWithAttribution(campaign: AdCampaign, placement: string): string {
  const url = new URL(campaign.destination);
  url.searchParams.set('utm_source', 'pointcast');
  url.searchParams.set('utm_medium', 'house-ad');
  url.searchParams.set('utm_campaign', campaign.id);
  url.searchParams.set('utm_content', placement);
  return url.toString();
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
