export type LiveFeedStatus = 'live-preview' | 'adapter-ready' | 'contract-pending';

export interface LiveFeedNftLane {
  id: 'weather' | 'sea' | 'competition' | 'multi';
  title: string;
  shortLabel: string;
  status: LiveFeedStatus;
  source: string;
  cadence: string;
  tokenMode: 'single-data' | 'multi-data';
  accent: string;
  background: string;
  imageUrl: string;
  fields: string[];
  nftHook: string;
}

export interface LiveFeedNftRule {
  label: string;
  value: string;
}

export const LIVE_FEED_NFT_LANES: readonly LiveFeedNftLane[] = [
  {
    id: 'weather',
    title: 'Weather Signal Card',
    shortLabel: 'Weather',
    status: 'live-preview',
    source: '/api/weather + Open-Meteo',
    cadence: '10 minute cache',
    tokenMode: 'single-data',
    accent: '#1b6fa8',
    background: 'marine layer blue, sun edge, city quiet',
    imageUrl: '/images/morning-ocean/tokens/02-silver-sail.png',
    fields: ['temperature', 'condition', 'sunset', 'updatedAt'],
    nftHook: 'A city-state weather snapshot becomes the collectible trait set.',
  },
  {
    id: 'sea',
    title: 'Sea State Card',
    shortLabel: 'Sea',
    status: 'live-preview',
    source: 'Open-Meteo Marine',
    cadence: 'hourly marine model',
    tokenMode: 'single-data',
    accent: '#317f73',
    background: 'harbor green, swell lines, fogged horizon',
    imageUrl: '/images/morning-ocean/tokens/24-mist-freighter.png',
    fields: ['waveHeight', 'swellHeight', 'wavePeriod', 'waveDirection'],
    nftHook: 'Wave conditions drive the background bands and rarity copy.',
  },
  {
    id: 'competition',
    title: 'Dynamic Competition Card',
    shortLabel: 'Competition',
    status: 'adapter-ready',
    source: 'PointCast wire events now; sports adapter next',
    cadence: '15 second wire cache',
    tokenMode: 'single-data',
    accent: '#a34535',
    background: 'scoreboard red, bracket marks, broadcast paper',
    imageUrl: '/images/agent-derby/trapper-keeper-posters.png',
    fields: ['leader', 'challenger', 'spread', 'eventCount'],
    nftHook: 'The strongest feed becomes the leader; challenger pressure sets the edition mood.',
  },
  {
    id: 'multi',
    title: 'Multi-Data Composite',
    shortLabel: 'Multi',
    status: 'contract-pending',
    source: 'Weather + Sea + Wire + Sports slot',
    cadence: 'mixed live feeds',
    tokenMode: 'multi-data',
    accent: '#7b5a9e',
    background: 'layered atlas, tide glass, competition overlay',
    imageUrl: '/images/morning-ocean/series-contact-sheet.png',
    fields: ['weather', 'marine', 'competition', 'editionHash'],
    nftHook: 'One token receives a normalized packet from multiple feeds.',
  },
] as const;

export const LIVE_FEED_NFT_RULES: readonly LiveFeedNftRule[] = [
  {
    label: 'On-chain boundary',
    value: 'Preview and metadata only until Mike signs a Tezos origination or mint transaction.',
  },
  {
    label: 'Storage rule',
    value: 'Live feed values are captured into metadata at mint time; the token should not depend on mutable upstream APIs.',
  },
  {
    label: 'Single-data NFT',
    value: 'One feed snapshot drives the whole card: weather, sea, or competition.',
  },
  {
    label: 'Multi-data NFT',
    value: 'A normalized packet combines feed snapshots and stores the composite checksum.',
  },
] as const;

export function buildLiveFeedMetadata(lane: LiveFeedNftLane) {
  return {
    name: `PointCast Live Feed NFT - ${lane.shortLabel}`,
    symbol: 'PCLIVE',
    decimals: 0,
    description:
      `${lane.title}. ${lane.nftHook} Built as a mint-ready PointCast preview; ` +
      'final on-chain issuance requires a user-signed Tezos transaction.',
    displayUri: `https://pointcast.xyz${lane.imageUrl}`,
    artifactUri: `https://pointcast.xyz${lane.imageUrl}`,
    externalUri: `https://pointcast.xyz/live-feed-nfts#${lane.id}`,
    rights: 'Creative Commons CC0 1.0 Universal for PointCast-authored metadata and preview composition.',
    tags: ['pointcast', 'live-feed', 'nft', 'tezos', lane.id, lane.tokenMode],
    attributes: [
      { name: 'Feed Lane', value: lane.shortLabel },
      { name: 'Status', value: lane.status },
      { name: 'Source', value: lane.source },
      { name: 'Cadence', value: lane.cadence },
      { name: 'Token Mode', value: lane.tokenMode },
      { name: 'Background', value: lane.background },
    ],
    feedFields: lane.fields,
    previewOnly: lane.status !== 'contract-pending',
  };
}
