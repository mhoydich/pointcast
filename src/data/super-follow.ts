export type SuperFollowTransport = 'rss' | 'html' | 'catalog' | 'support';
export type SuperFollowTrust = 'official' | 'official-contributor';

export interface SuperFollowSource {
  id: string;
  name: string;
  noun: string;
  url: string;
  feedUrl?: string;
  transport: SuperFollowTransport;
  trust: SuperFollowTrust;
  color: string;
  note: string;
}

export interface SuperFollowSignal {
  id: string;
  sourceId: string;
  noun: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  topics: string[];
  commerce: boolean;
}

export const SUPER_FOLLOW_SOURCES: SuperFollowSource[] = [
  {
    id: 'sony-group',
    name: 'Sony Group News',
    noun: 'Company',
    url: 'https://www.sony.com/en/SonyInfo/News/Press/',
    feedUrl: 'https://www.sony.com/en/SonyInfo/News/Press/data/pressrelease_for_top.xml',
    transport: 'rss',
    trust: 'official',
    color: '#1746ff',
    note: 'Group-level releases, research, governance, and corporate announcements.',
  },
  {
    id: 'playstation',
    name: 'PlayStation Blog',
    noun: 'Play',
    url: 'https://blog.playstation.com/',
    feedUrl: 'https://blog.playstation.com/feed/',
    transport: 'rss',
    trust: 'official-contributor',
    color: '#5ce1e6',
    note: 'Games, hardware, studio voices, release details, and community posts.',
  },
  {
    id: 'sony-music',
    name: 'Sony Music',
    noun: 'Sound',
    url: 'https://www.sonymusic.com/news/',
    transport: 'html',
    trust: 'official',
    color: '#ff3b30',
    note: 'Official label, artist, recording, podcast, and company releases.',
  },
  {
    id: 'sony-electronics',
    name: 'Sony Electronics',
    noun: 'Product',
    url: 'https://electronics.sony.com/',
    transport: 'catalog',
    trust: 'official',
    color: '#eaff57',
    note: 'Current consumer products, categories, availability, and direct-store context.',
  },
  {
    id: 'sony-imaging',
    name: 'Sony Imaging',
    noun: 'Camera',
    url: 'https://electronics.sony.com/imaging/c/interchangeable-lens-cameras',
    transport: 'catalog',
    trust: 'official',
    color: '#ff8cc6',
    note: 'Alpha cameras, lenses, imaging families, and current product pages.',
  },
  {
    id: 'sony-support',
    name: 'Sony Support',
    noun: 'Care',
    url: 'https://www.sony.com/electronics/support/',
    transport: 'support',
    trust: 'official',
    color: '#ffb347',
    note: 'Manuals, firmware, compatibility, service notices, and product support.',
  },
];

export const SUPER_FOLLOW_SIGNALS: SuperFollowSignal[] = [
  {
    id: 'sony-aibo-research-20260717',
    sourceId: 'sony-group',
    noun: 'Robot',
    title: 'aibo opens a research lane with two universities.',
    summary: 'A research-use prototype and development tools widen the official Sony signal into physical AI, learning, and social robotics.',
    url: 'https://www.sony.com/en/SonyInfo/News/Press/202607/26-018E/',
    publishedAt: '2026-07-17T00:00:00.000Z',
    topics: ['research', 'robotics', 'ai'],
    commerce: false,
  },
  {
    id: 'playstation-lous-lagoon-20260722',
    sourceId: 'playstation',
    noun: 'Game',
    title: 'Lou’s Lagoon gets a brighter PS5 arrival signal.',
    summary: 'A current PlayStation Blog post brings gameplay, customization, release timing, and product context into one attributable card.',
    url: 'https://blog.playstation.com/2026/07/22/fresh-look-at-lous-lagoon-coming-to-ps5-on-august-27/',
    publishedAt: '2026-07-22T00:00:00.000Z',
    topics: ['games', 'playstation', 'release'],
    commerce: true,
  },
  {
    id: 'sony-music-news-desk',
    sourceId: 'sony-music',
    noun: 'Music',
    title: 'The music desk stays separate from the corporate desk.',
    summary: 'Official releases can be tuned toward artists, recordings, podcasts, and label news without flooding the broader Sony broadcaster.',
    url: 'https://www.sonymusic.com/news/',
    publishedAt: '2026-07-24T00:00:00.000Z',
    topics: ['music', 'artists', 'releases'],
    commerce: true,
  },
  {
    id: 'sony-alpha-camera-catalog',
    sourceId: 'sony-imaging',
    noun: 'Camera',
    title: 'Alpha products become a product lane—not an ad lane.',
    summary: 'Camera families can surface when they match the lens or a declared Want, while prices and claims remain linked to the official catalog.',
    url: 'https://electronics.sony.com/imaging/c/interchangeable-lens-cameras',
    publishedAt: '2026-07-26T00:00:00.000Z',
    topics: ['cameras', 'imaging', 'products'],
    commerce: true,
  },
  {
    id: 'sony-support-receipt',
    sourceId: 'sony-support',
    noun: 'Support',
    title: 'Ownership changes the feed.',
    summary: 'A connected product relationship could elevate firmware, compatibility, repair, and service signals over launch-day promotion.',
    url: 'https://www.sony.com/electronics/support/',
    publishedAt: '2026-07-26T00:00:00.000Z',
    topics: ['support', 'ownership', 'products'],
    commerce: false,
  },
];

export const SUPER_FOLLOW_LENSES = [
  { id: 'camera', label: 'Cameras', color: '#ff8cc6', topics: ['cameras', 'imaging', 'products', 'support'] },
  { id: 'music', label: 'Music', color: '#ff3b30', topics: ['music', 'artists', 'releases'] },
  { id: 'play', label: 'PlayStation', color: '#5ce1e6', topics: ['games', 'playstation', 'release'] },
  { id: 'research', label: 'Research', color: '#1746ff', topics: ['research', 'robotics', 'ai'] },
] as const;

export const SUPER_FOLLOW_RELATIONSHIPS = [
  {
    id: 'observing',
    noun: 'Observe',
    status: 'available',
    note: 'Read public sources with receipts. No account and no relationship claim.',
  },
  {
    id: 'following',
    noun: 'Follow',
    status: 'local',
    note: 'Save one lens on this device or subscribe to a standards feed.',
  },
  {
    id: 'connected',
    noun: 'Connect',
    status: 'future',
    note: 'A verified provider connection can add owned products, support, or member context.',
  },
  {
    id: 'agreed',
    noun: 'Agree',
    status: 'future',
    note: 'Both sides accept a narrow purpose, data boundary, duration, and revocation path.',
  },
  {
    id: 'signed',
    noun: 'Sign',
    status: 'future',
    note: 'A signed grant or receipt proves the exact relationship without making it permanent.',
  },
  {
    id: 'transacting',
    noun: 'Trade',
    status: 'future',
    note: 'A Want may receive structured offers; checkout and payment remain separate approvals.',
  },
] as const;

export const SUPER_FOLLOW_OUTPUTS = [
  {
    noun: 'Dashboard',
    href: '/super-follow',
    type: 'text/html',
    note: 'Readable studio, lens, relationship, and Want Desk.',
  },
  {
    noun: 'Contract',
    href: '/super-follow.json',
    type: 'application/json',
    note: 'Sources, boundaries, outputs, relationship states, and schema.',
  },
  {
    noun: 'Feed',
    href: '/super-follow.feed.json',
    type: 'application/feed+json',
    note: 'JSON Feed 1.1 snapshot for clients and agents.',
  },
  {
    noun: 'Subscribe',
    href: '/super-follow.xml',
    type: 'application/rss+xml',
    note: 'RSS 2.0 snapshot for ordinary feed readers.',
  },
] as const;

export const SUPER_FOLLOW_BOUNDARIES = [
  'This first Sony broadcaster is an independent PointCast prototype, not a Sony product or endorsement.',
  'Source links are official; assembled summaries are PointCast editorial and preserve their source receipts.',
  'The prototype does not continuously crawl, impersonate, or republish full source articles.',
  'A local follow stores lens choices on this device only.',
  'The Want Desk does not send a request, contact a merchant, create an order, or move money.',
  'DPoP, signed webhooks, provider grants, offers, checkout, and payment are directional—not active claims.',
];
