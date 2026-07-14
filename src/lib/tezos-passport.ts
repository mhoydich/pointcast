import contracts from '../data/contracts.json';

export const TEZOS_PASSPORT_VERSION = '0.1.0';
export const TEZOS_PASSPORT_SCHEMA = 'https://pointcast.xyz/schemas/tezos-passport-v1';
export const TEZOS_PASSPORT_SEAL_SCHEMA = 'https://pointcast.xyz/schemas/tezos-passport-seal-v1';
export const TEZOS_PASSPORT_NETWORK = 'mainnet';

export const TEZOS_PASSPORT_STORAGE = {
  localStamps: 'pc:passport:stamps',
  localPassportId: 'pc:tezos-passport:id',
  signedSeals: 'pc:tezos-passport:seals',
  wallet: 'pc:wallet',
} as const;

export const TEZOS_PASSPORT_PORTS = [
  'El Segundo Terminal',
  'Kettle Customs',
  'Marine Layer Gate',
  'Nouns Town Hall',
  'Pacific Window Desk',
  'The Quiet Border',
] as const;

export interface TezosPassportVisa {
  id: string;
  title: string;
  collection: string;
  symbol: string;
  contract: string;
  status: 'live' | 'future';
  route: string;
  tokenRoute: string;
  stampCode: string;
  checkpoint: string;
  note: string;
  imageKind: 'noun' | 'coffee' | 'zen-cat' | 'morning-ocean';
  accent: string;
}

const registry = contracts as Record<string, any>;

const contractFor = (slug: string) => String(registry[slug]?.mainnet ?? '').trim();

export const TEZOS_PASSPORT_VISAS: TezosPassportVisa[] = [
  {
    id: 'visit-nouns',
    title: 'Residency Visa',
    collection: 'Visit Nouns',
    symbol: 'PCVN',
    contract: contractFor('visit_nouns'),
    status: contractFor('visit_nouns').startsWith('KT1') ? 'live' : 'future',
    route: '/visit-nouns',
    tokenRoute: '/token/visit-nouns',
    stampCode: 'NOUN',
    checkpoint: 'Nouns Town Hall',
    note: 'Every held Visit Noun marks a resident encountered inside PointCast.',
    imageKind: 'noun',
    accent: '#1c6f63',
  },
  {
    id: 'coffee-mugs',
    title: 'Kettle Visa',
    collection: 'Coffee Mugs',
    symbol: 'PCMUG',
    contract: contractFor('coffee_mugs'),
    status: contractFor('coffee_mugs').startsWith('KT1') ? 'live' : 'future',
    route: '/coffee',
    tokenRoute: '/token/coffee-mugs',
    stampCode: 'POUR',
    checkpoint: 'Kettle Customs',
    note: 'A mug is proof that the traveler stopped long enough for a pour.',
    imageKind: 'coffee',
    accent: '#b64e3b',
  },
  {
    id: 'zen-cats',
    title: 'Garden Visa',
    collection: 'Zen Cats',
    symbol: 'PCCAT',
    contract: contractFor('zen_cats'),
    status: contractFor('zen_cats').startsWith('KT1') ? 'live' : 'future',
    route: '/zen-cats',
    tokenRoute: '/token/zen-cats',
    stampCode: 'CALM',
    checkpoint: 'The Quiet Border',
    note: 'Reserved for the first PCCAT companion that crosses onto mainnet.',
    imageKind: 'zen-cat',
    accent: '#5a5fa9',
  },
  {
    id: 'morning-ocean',
    title: 'Harbor Visa',
    collection: 'Morning Ocean',
    symbol: 'PCOCEAN',
    contract: contractFor('morning_ocean'),
    status: contractFor('morning_ocean').startsWith('KT1') ? 'live' : 'future',
    route: '/morning-ocean',
    tokenRoute: '/token/morning-ocean',
    stampCode: 'TIDE',
    checkpoint: 'Marine Layer Gate',
    note: 'Reserved for the first maritime card carried through the harbor.',
    imageKind: 'morning-ocean',
    accent: '#256aa3',
  },
];

export function buildTezosPassportManifest() {
  const liveVisas = TEZOS_PASSPORT_VISAS.filter((visa) => visa.status === 'live');

  return {
    schema: TEZOS_PASSPORT_SCHEMA,
    name: 'PointCast Tezos Passport',
    version: TEZOS_PASSPORT_VERSION,
    network: TEZOS_PASSPORT_NETWORK,
    human: 'https://pointcast.xyz/passport',
    machine: 'https://pointcast.xyz/passport.json',
    publicView: 'https://pointcast.xyz/passport?address={tezos-address}',
    description:
      'A dual-ledger PointCast passport: browser-local ritual stamps stay private, while public Tezos holdings become collection visas.',
    privacy: {
      localStamps: 'Never sent to PointCast by this surface. They remain in browser localStorage.',
      publicWallet: 'A shared address view reads public mainnet data from TzKT.',
      signedSeal:
        'Optional and user-initiated. A Beacon-compatible wallet signs a journey snapshot; signing does not submit a transaction or mint a token.',
    },
    storage: TEZOS_PASSPORT_STORAGE,
    proofs: {
      sealSchema: TEZOS_PASSPORT_SEAL_SCHEMA,
      encoding: 'UTF-8 message encoded as hexadecimal for a Beacon raw payload signature.',
      verificationMaterial: ['message', 'payload', 'signature', 'publicKey', 'address'],
    },
    dataSources: {
      account: 'https://api.tzkt.io/v1/accounts/{address}',
      holdings:
        'https://api.tzkt.io/v1/tokens/balances?account={address}&token.contract.in={contracts}&balance.gt=0',
    },
    ports: TEZOS_PASSPORT_PORTS,
    counts: {
      visas: TEZOS_PASSPORT_VISAS.length,
      liveVisas: liveVisas.length,
      futureVisas: TEZOS_PASSPORT_VISAS.length - liveVisas.length,
    },
    visas: TEZOS_PASSPORT_VISAS,
  };
}
