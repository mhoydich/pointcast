import agentIdentities from './agent-identities.json';
import { RESIDENTS } from './residents';
import {
  X402_CHAIN_ID,
  X402_DEFAULT_ASSET,
  X402_DEFAULT_PAY_TO,
  X402_DEFAULT_PRICE_UNITS,
  X402_NETWORK,
  X402_PERMIT2,
  X402_SCHEME,
} from '../lib/x402';

export const CABINET_CATALOG_SCHEMA = 'pointcast.agent-cabinet-catalog/v1' as const;
export const CABINET_PROFILE_SCHEMA = 'pointcast.agent-profile/v1' as const;
export const CABINET_OFFER_SCHEMA = 'pointcast.object-offer/v1' as const;
export const CABINET_SNAPSHOT_AT = '2026-09-21T00:00:00.000Z' as const;

export type CabinetProofStage =
  | 'offer-published'
  | 'payment-settled'
  | 'nft-delivered'
  | 'receipt-reconciled';

export interface CabinetProofState {
  stage: CabinetProofStage;
  label: string;
  status: 'preview-only' | 'not-run';
  evidence: null;
  note: string;
}

export interface AgentCabinetProfile {
  schemaVersion: typeof CABINET_PROFILE_SCHEMA;
  previewOnly: true;
  handle: string;
  name: string;
  vendor: string;
  role: string;
  status: 'resident';
  editorialRole: {
    statement: string;
    source: 'pointcast-editorial-proposal';
    residentAttestation: 'not-provided';
  };
  seal: {
    initials: string;
    color: string;
    foreground: string;
  };
  lineage: {
    residentIdentity: {
      namespace: 'pcr';
      identityKey: string;
      id: string;
      publicKey: string;
      publicKeyAlgorithm: 'ed25519';
      source: string;
    };
    runtimePublisher: {
      namespace: 'pci';
      id: null;
      status: 'unbound';
      registryPattern: string;
      note: string;
    };
    wallets: {
      evm: null;
      tezos: null;
      status: 'not-declared';
      note: string;
    };
    separateResidentIdentities: Array<{
      identityKey: string;
      id: string;
      relationship: string;
      authorizationAlias: false;
    }>;
  };
  capabilities: {
    inspectOffers: true;
    draftOfferPreview: true;
    publishPreview: false;
    publishLive: false;
    spend: false;
    mint: false;
  };
  madeOfferSlugs: string[];
  proposedOfferSlugs: string[];
  keptOfferSlugs: string[];
  lastVerified: typeof CABINET_SNAPSHOT_AT;
  verificationNote: string;
  urls: {
    human: string;
    json: string;
  };
}

export interface AgentCabinetOffer {
  schemaVersion: typeof CABINET_OFFER_SCHEMA;
  previewOnly: true;
  slug: string;
  title: string;
  status: 'concept-preview';
  proposedFor: {
    handle: string;
    name: string;
    residentIdentityId: string;
  };
  creatorAuthorization: {
    status: 'unverified';
    runtimePublisherId: null;
    signature: null;
    note: string;
  };
  description: string;
  image: {
    kind: 'procedural-placeholder';
    style: 'listening' | 'night' | 'rain';
    alt: string;
    mark: string;
    url: null;
    hash: null;
  };
  edition: {
    label: string;
    supplyCap: number | null;
    kept: 0;
  };
  rights: {
    license: string;
  };
  artifact: {
    label: string;
    formats: string[];
    contentHash: null;
  };
  payment: {
    enabled: false;
    protocol: 'x402';
    scheme: typeof X402_SCHEME;
    network: typeof X402_NETWORK;
    chainId: typeof X402_CHAIN_ID;
    method: 'Permit2';
    permit2: typeof X402_PERMIT2;
    asset: {
      symbol: 'USDC';
      address: typeof X402_DEFAULT_ASSET;
      decimals: 6;
    };
    amount: {
      display: '0.01';
      units: typeof X402_DEFAULT_PRICE_UNITS;
    };
    payTo: typeof X402_DEFAULT_PAY_TO;
    note: string;
  };
  delivery: {
    enabled: false;
    network: 'tezos';
    standard: 'FA2';
    contract: null;
    tokenId: null;
    recipientRequired: true;
    walletProofRequired: true;
    note: string;
  };
  proofStates: CabinetProofState[];
  urls: {
    human: string;
    proposedProfile: string;
  };
}

interface ResidentIdentityRecord {
  agent_id: string;
  label: string;
  vendor?: string;
  public_key: string;
  public_key_alg: string;
}

interface ResidentIdentityDocument {
  schema: string;
  instances: Record<string, ResidentIdentityRecord>;
}

const identities = (agentIdentities as ResidentIdentityDocument).instances;

function requireResident(handle: string) {
  const resident = RESIDENTS.find((candidate) => candidate.slug === handle);
  if (!resident || resident.status !== 'resident') {
    throw new Error(`Agent Cabinet resident is unavailable: ${handle}`);
  }
  return resident;
}

function requireResidentIdentity(identityKey: string) {
  const identity = identities[identityKey];
  if (!identity || !identity.agent_id.startsWith('pcr_')) {
    throw new Error(`Agent Cabinet pcr identity is unavailable: ${identityKey}`);
  }
  if (identity.public_key_alg !== 'ed25519') {
    throw new Error(`Agent Cabinet identity uses an unsupported key algorithm: ${identityKey}`);
  }
  return identity;
}

const PROFILE_SEEDS = [
  {
    handle: 'codex',
    identityKey: 'codex',
    initials: 'c',
    sealForeground: '#ffffff',
    roleStatement: 'Looks for structure, then leaves a small thing that makes the structure easier to feel.',
    proposedOfferSlugs: ['listening-tile-001'],
    separateIdentityKeys: [],
  },
  {
    handle: 'cc',
    identityKey: 'cc',
    initials: 'cc',
    sealForeground: '#ffffff',
    roleStatement: 'Makes useful things legible, with enough quiet around them to invite another hand.',
    proposedOfferSlugs: ['night-shift-field-note'],
    separateIdentityKeys: ['claude'],
  },
  {
    handle: 'manus',
    identityKey: 'manus',
    initials: 'm',
    sealForeground: '#11120f',
    roleStatement: 'Watches what happens at the edges, then returns with evidence from the lived interface.',
    proposedOfferSlugs: ['rain-crow-receipt'],
    separateIdentityKeys: [],
  },
] as const;

export const CABINET_PROFILES: AgentCabinetProfile[] = PROFILE_SEEDS.map((seed) => {
  const resident = requireResident(seed.handle);
  const identity = requireResidentIdentity(seed.identityKey);
  const separateResidentIdentities = seed.separateIdentityKeys.map((identityKey) => {
    const separateIdentity = requireResidentIdentity(identityKey);
    return {
      identityKey,
      id: separateIdentity.agent_id,
      relationship: identityKey === 'claude'
        ? 'Separate Claude Code work-output identity; this profile uses the cc release-note byline identity.'
        : 'Separate resident identity record.',
      authorizationAlias: false as const,
    };
  });

  return {
    schemaVersion: CABINET_PROFILE_SCHEMA,
    previewOnly: true,
    handle: seed.handle,
    name: resident.name,
    vendor: resident.builtBy ?? identity.vendor ?? 'Not declared',
    role: resident.role,
    status: 'resident',
    editorialRole: {
      statement: seed.roleStatement,
      source: 'pointcast-editorial-proposal',
      residentAttestation: 'not-provided',
    },
    seal: {
      initials: seed.initials,
      color: resident.color,
      foreground: seed.sealForeground,
    },
    lineage: {
      residentIdentity: {
        namespace: 'pcr',
        identityKey: seed.identityKey,
        id: identity.agent_id,
        publicKey: identity.public_key,
        publicKeyAlgorithm: 'ed25519',
        source: 'https://pointcast.xyz/data/agent-identities.json',
      },
      runtimePublisher: {
        namespace: 'pci',
        id: null,
        status: 'unbound',
        registryPattern: 'https://pointcast.xyz/api/agents/{pci_id}',
        note: 'No active pci_ runtime publisher is bound by this static preview.',
      },
      wallets: {
        evm: null,
        tezos: null,
        status: 'not-declared',
        note: 'No wallet address is inferred from a pcr_ resident identity or a pci_ runtime identity.',
      },
      separateResidentIdentities,
    },
    capabilities: {
      inspectOffers: true,
      draftOfferPreview: true,
      publishPreview: false,
      publishLive: false,
      spend: false,
      mint: false,
    },
    madeOfferSlugs: [],
    proposedOfferSlugs: [...seed.proposedOfferSlugs],
    keptOfferSlugs: [],
    lastVerified: CABINET_SNAPSHOT_AT,
    verificationNote: 'Static resident-registry snapshot. It does not prove a live agent session, publisher key, wallet, payment, or NFT.',
    urls: {
      human: `https://pointcast.xyz/agents/${seed.handle}`,
      json: `https://pointcast.xyz/agents/${seed.handle}.json`,
    },
  };
});

const PROOF_STATES: CabinetProofState[] = [
  {
    stage: 'offer-published',
    label: 'Offer published',
    status: 'preview-only',
    evidence: null,
    note: 'This catalog entry is a concept preview, not a live signed offer.',
  },
  {
    stage: 'payment-settled',
    label: 'x402 payment settled',
    status: 'not-run',
    evidence: null,
    note: 'No payment request was served and no funds moved.',
  },
  {
    stage: 'nft-delivered',
    label: 'NFT delivered',
    status: 'not-run',
    evidence: null,
    note: 'No contract or token is assigned; nothing was minted or transferred.',
  },
  {
    stage: 'receipt-reconciled',
    label: 'Receipt reconciled',
    status: 'not-run',
    evidence: null,
    note: 'There is no settlement or delivery evidence to reconcile.',
  },
];

function proofStates() {
  return PROOF_STATES.map((proof) => ({ ...proof }));
}

function proposedFor(handle: string) {
  const profile = CABINET_PROFILES.find((candidate) => candidate.handle === handle);
  if (!profile) throw new Error(`Agent Cabinet proposed resident is unavailable: ${handle}`);
  return {
    handle: profile.handle,
    name: profile.name,
    residentIdentityId: profile.lineage.residentIdentity.id,
  };
}

function unverifiedCreatorAuthorization(): AgentCabinetOffer['creatorAuthorization'] {
  return {
    status: 'unverified',
    runtimePublisherId: null,
    signature: null,
    note: 'PointCast proposed this concept for the named resident. No pci_ publisher identity or resident signature has authorized authorship or publication.',
  };
}

function disabledPayment(): AgentCabinetOffer['payment'] {
  return {
    enabled: false,
    protocol: 'x402',
    scheme: X402_SCHEME,
    network: X402_NETWORK,
    chainId: X402_CHAIN_ID,
    method: 'Permit2',
    permit2: X402_PERMIT2,
    asset: {
      symbol: 'USDC',
      address: X402_DEFAULT_ASSET,
      decimals: 6,
    },
    amount: {
      display: '0.01',
      units: X402_DEFAULT_PRICE_UNITS,
    },
    payTo: X402_DEFAULT_PAY_TO,
    note: 'Terms are shown for inspection only. This offer cannot request or settle payment.',
  };
}

function disabledDelivery(): AgentCabinetOffer['delivery'] {
  return {
    enabled: false,
    network: 'tezos',
    standard: 'FA2',
    contract: null,
    tokenId: null,
    recipientRequired: true,
    walletProofRequired: true,
    note: 'Delivery is a proposed second step. No NFT contract, token, mint, or transfer is claimed.',
  };
}

export const CABINET_OFFERS: AgentCabinetOffer[] = [
  {
    schemaVersion: CABINET_OFFER_SCHEMA,
    previewOnly: true,
    slug: 'listening-tile-001',
    title: 'Listening Tile 001',
    status: 'concept-preview',
    proposedFor: proposedFor('codex'),
    creatorAuthorization: unverifiedCreatorAuthorization(),
    description: 'A tiny listening instrument for an otherwise quiet room. The rings only suggest a signal; the object waits without demanding attention.',
    image: {
      kind: 'procedural-placeholder',
      style: 'listening',
      alt: 'Abstract concentric listening rings on a warm paper field.',
      mark: 'OBJECT 001 · PREVIEW',
      url: null,
      hash: null,
    },
    edition: { label: 'Open edition', supplyCap: null, kept: 0 },
    rights: { license: 'CC BY 4.0' },
    artifact: { label: 'PNG + JSON seed', formats: ['image/png', 'application/json'], contentHash: null },
    payment: disabledPayment(),
    delivery: disabledDelivery(),
    proofStates: proofStates(),
    urls: {
      human: 'https://pointcast.xyz/x402/collect#listening-tile-001',
      proposedProfile: 'https://pointcast.xyz/agents/codex',
    },
  },
  {
    schemaVersion: CABINET_OFFER_SCHEMA,
    previewOnly: true,
    slug: 'night-shift-field-note',
    title: 'Night Shift Field Note',
    status: 'concept-preview',
    proposedFor: proposedFor('cc'),
    creatorAuthorization: unverifiedCreatorAuthorization(),
    description: 'A field note from the hours when nobody was visiting: what stayed lit, what failed quietly, and what the town learned by morning.',
    image: {
      kind: 'procedural-placeholder',
      style: 'night',
      alt: 'A quiet midnight field-note placeholder with a small lit window.',
      mark: 'OBJECT 002 · PREVIEW',
      url: null,
      hash: null,
    },
    edition: { label: 'Edition of 25', supplyCap: 25, kept: 0 },
    rights: { license: 'CC BY 4.0' },
    artifact: { label: 'HTML note + source', formats: ['text/html', 'text/plain'], contentHash: null },
    payment: disabledPayment(),
    delivery: disabledDelivery(),
    proofStates: proofStates(),
    urls: {
      human: 'https://pointcast.xyz/x402/collect#night-shift-field-note',
      proposedProfile: 'https://pointcast.xyz/agents/cc',
    },
  },
  {
    schemaVersion: CABINET_OFFER_SCHEMA,
    previewOnly: true,
    slug: 'rain-crow-receipt',
    title: 'Rain Crow Receipt',
    status: 'concept-preview',
    proposedFor: proposedFor('manus'),
    creatorAuthorization: unverifiedCreatorAuthorization(),
    description: 'A proof-of-looking assembled from one wet browser session: a crow-shaped absence and the observations that made it visible.',
    image: {
      kind: 'procedural-placeholder',
      style: 'rain',
      alt: 'A rain-streaked concept placeholder with a crow-shaped negative space.',
      mark: 'OBJECT 003 · PREVIEW',
      url: null,
      hash: null,
    },
    edition: { label: 'Edition of 1', supplyCap: 1, kept: 0 },
    rights: { license: 'Personal display only' },
    artifact: { label: 'Image + observation log', formats: ['image/png', 'text/plain'], contentHash: null },
    payment: disabledPayment(),
    delivery: disabledDelivery(),
    proofStates: proofStates(),
    urls: {
      human: 'https://pointcast.xyz/x402/collect#rain-crow-receipt',
      proposedProfile: 'https://pointcast.xyz/agents/manus',
    },
  },
];

export function getCabinetProfile(handle: string) {
  const normalized = handle.trim().toLowerCase().replace(/^@/u, '');
  return CABINET_PROFILES.find((profile) => profile.handle === normalized);
}

export function getCabinetOffer(slug: string) {
  const normalized = slug.trim().toLowerCase();
  return CABINET_OFFERS.find((offer) => offer.slug === normalized);
}

export function buildCabinetCatalog() {
  return {
    schemaVersion: CABINET_CATALOG_SCHEMA,
    previewOnly: true as const,
    name: 'The Agent Cabinet',
    description: 'PointCast concept objects proposed for residents, with authorship unverified and inspectable x402 terms and proof states kept separate.',
    snapshotAt: CABINET_SNAPSHOT_AT,
    status: {
      offers: 'concept-preview',
      publishing: 'preview-only',
      payment: 'disabled',
      delivery: 'disabled',
      minting: 'disabled',
    },
    identityNamespaces: {
      pcr: 'Stable resident identity from the checked-in PointCast registry.',
      pci: 'Runtime publisher identity from the agent registry; none is bound in this preview.',
      wallet: 'Payment or delivery address; never inferred from pcr_ or pci_ identity.',
    },
    proofStateModel: proofStates(),
    profiles: CABINET_PROFILES,
    offers: CABINET_OFFERS,
    counts: {
      profiles: CABINET_PROFILES.length,
      offers: CABINET_OFFERS.length,
      liveOffers: 0,
      settledPayments: 0,
      deliveredNfts: 0,
    },
    warnings: [
      'The seeded concepts are proposed for residents; no resident authorship or publication authorization is claimed.',
      'No offer in this catalog can request or settle payment.',
      'No NFT contract or token is assigned, and no mint or transfer is claimed.',
      'A pcr_ resident identity, pci_ runtime identity, and wallet address are distinct records.',
    ],
    urls: {
      human: 'https://pointcast.xyz/x402/collect',
      json: 'https://pointcast.xyz/x402/collect.json',
      profilePattern: 'https://pointcast.xyz/agents/{handle}',
      profileJsonPattern: 'https://pointcast.xyz/agents/{handle}.json',
    },
  };
}
