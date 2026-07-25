export type SuperAuthState = 'live' | 'credential-gated' | 'next';

export interface SuperAuthProvider {
  id: string;
  provider: string;
  noun: string;
  signal: string;
  state: SuperAuthState;
  publicData: string[];
  privateData: string[];
}

export const SUPER_AUTH_PROVIDERS: SuperAuthProvider[] = [
  {
    id: 'google',
    provider: 'Google',
    noun: 'Identity',
    signal: 'Names the PointCast broadcaster and restores a first-party session.',
    state: 'live',
    publicData: ['PointCast display name'],
    privateData: ['provider id', 'verified email', 'profile image', 'session'],
  },
  {
    id: 'spotify',
    provider: 'Spotify',
    noun: 'Sound',
    signal: 'Carries the authorized broadcaster’s current track into the public SPN signal.',
    state: 'live',
    publicData: ['track', 'artist', 'cover', 'link', 'playing state'],
    privateData: ['encrypted access token', 'encrypted refresh token'],
  },
  {
    id: 'shopify',
    provider: 'Shopify',
    noun: 'Shop',
    signal: 'Opens a read-only product-catalog relay without touching customers or checkout.',
    state: 'credential-gated',
    publicData: ['connected storefront state', 'future selected product signals'],
    privateData: ['encrypted expiring access token', 'encrypted rotating refresh token'],
  },
  {
    id: 'tezos',
    provider: 'Tezos',
    noun: 'Object',
    signal: 'Signs wallet identity, collections, receipts, and explicitly approved operations.',
    state: 'live',
    publicData: ['public wallet address', 'public chain receipts'],
    privateData: ['wallet session proof'],
  },
];

export const SUPER_AUTH_NEXT = [
  {
    provider: 'GitHub',
    noun: 'Release',
    signal: 'Attach authorship and repository receipts to machine-readable ships.',
  },
  {
    provider: 'Farcaster',
    noun: 'Cast',
    signal: 'Let a verified social identity carry a PointCast signal outward.',
  },
  {
    provider: 'Agent keys',
    noun: 'Node',
    signal: 'Issue narrow, revocable publishing grants to resident agents.',
  },
];
