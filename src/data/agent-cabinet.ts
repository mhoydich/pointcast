import agentIdentities from './agent-identities.json';
import cabinetProvenance from './agent-cabinet-provenance.json';
import cabinetPublication from './agent-cabinet-publication.json';
import cabinetVerifiedPublication from './agent-cabinet-verified-publication.json';
import { RESIDENTS } from './residents';
import { AGENT_CABINET_PUBLICATION_LIVE, isVerifiedAgentCabinetPublication } from '../lib/agent-cabinet-public-state';
import {
  X402_CHAIN_ID,
  X402_DEFAULT_ASSET,
  X402_DEFAULT_PAY_TO,
  X402_DEFAULT_PRICE_UNITS,
  X402_NETWORK,
  X402_PAYMENT_PROFILE,
  X402_PERMIT2,
  X402_CURRENT_SPEC_PROXY,
  X402_PROFILE_REVIEWED_AT,
  X402_PROXY,
  X402_SCHEME,
  X402_WITNESS_TYPE,
} from '../lib/x402';

export const CABINET_CATALOG_SCHEMA = 'pointcast.agent-cabinet-catalog/v1' as const;
export const CABINET_PROFILE_SCHEMA = 'pointcast.agent-profile/v1' as const;
export const CABINET_OFFER_SCHEMA = 'pointcast.object-offer/v1' as const;
export const CABINET_SNAPSHOT_AT = '2026-09-21T00:00:00.000Z' as const;

export const CABINET_COLLECT_PROTOCOL = Object.freeze({
  schemaVersion: 'pointcast.agent-cabinet-collect/v1',
  availability: AGENT_CABINET_PUBLICATION_LIVE ? 'inventory-verified-runtime-gated' : 'prepared-only',
  registration: 'optional',
  audience: 'https://pointcast.xyz',
  endpoints: {
    challenge: 'https://pointcast.xyz/api/agent-cabinet/challenge',
    collect: 'https://pointcast.xyz/api/agent-cabinet/collect',
    status: 'https://pointcast.xyz/api/agent-cabinet/status?id={intentId}',
  },
  challenge: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': '<stable-request-id: 8-128 characters>',
    },
    body: { offer: '<offer-slug>', recipient: '<tz1|tz2|tz3|tz4 address>' },
    returns: ['challengeId', 'intentId', 'message', 'payload', 'expiresAt', 'statusUrl'],
    signatureType: 'Micheline',
    spendsTez: false,
  },
  collect: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': '<same stable-request-id>',
      'Payment-Signature': '<omit for quote; include x402 v2 authorization only after spend approval>',
    },
    body: {
      offer: '<same offer-slug>',
      recipient: '<same Tezos address>',
      challengeId: '<challengeId>',
      publicKey: '<Tezos public key for recipient>',
      signature: '<Tezos signature over returned Micheline payload>',
    },
    quoteStatus: 402,
    pendingStatus: 202,
    completeStatus: 200,
  },
  afterSettlement: {
    action: 'While intent.next.action is resume-delivery, replay the exact collect POST with the same Idempotency-Key and body, respecting retryAfterSeconds or Retry-After.',
    paymentSignatureRequired: false,
    chargesAgain: false,
    reason: 'Each replay advances or waits for the separately sponsored Tezos delivery; GET status never acquires the signer lock or creates an operation.',
    then: 'When intent.next.action becomes poll-status, poll the returned statusUrl. Stop automatic retries for either operator-review action.',
  },
  optionalCallerAttributionHeaders: [
    'PointCast-Agent-Id',
    'PointCast-Agent-Timestamp',
    'PointCast-Agent-Signature',
  ],
  callerAttributionRule: 'Optional caller attribution must be absent through settlement, or use the same active registered pci_ identity on challenge and collect through settlement. Once payment is durably settled, exact delivery replays may omit it so key expiry cannot strand the buyer. It never authorizes payment or the Tezos wallet.',
  identityBoundaries: {
    proposedResident: 'pcr_ editorial identity; never a wallet or authority grant',
    caller: 'optional pci_ registered runtime; attribution only',
    payer: 'EVM address proven by the x402 Permit2 authorization',
    recipient: 'Tezos address proven by the separate challenge signature',
  },
  completionRule: 'Complete only after x402 settlement and the exact FA2 sponsor-to-recipient movement have been reconciled with at least two Tezos confirmations.',
  launchRule: 'No challenge, quote, settlement, signing, or delivery is enabled until the fixed mainnet inventory and metadata are independently verified and explicit launch gates and fee budgets are configured.',
} as const);

export type CabinetProofStage =
  | 'offer-published'
  | 'payment-settled'
  | 'nft-delivered'
  | 'rails-reconciled';

export interface CabinetProofState {
  stage: CabinetProofStage;
  label: string;
  status: 'preview-only' | 'verified' | 'not-run';
  evidence: unknown | null;
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
  previewOnly: boolean;
  slug: string;
  title: string;
  status: 'publication-prepared' | 'collectible';
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
    kind: 'canonical-artifact';
    style: 'listening' | 'night' | 'rain';
    alt: string;
    mark: string;
    url: string;
    hash: string;
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
    uri: string;
    contentHash: string;
    metadataUri: string;
    metadataHash: string;
  };
  payment: {
    enabled: boolean;
    protocol: 'x402';
    scheme: typeof X402_SCHEME;
    network: typeof X402_NETWORK;
    chainId: typeof X402_CHAIN_ID;
    method: 'Permit2';
    permit2: typeof X402_PERMIT2;
    profile: typeof X402_PAYMENT_PROFILE;
    profileStatus: 'facilitator-specific';
    spender: typeof X402_PROXY;
    witnessType: typeof X402_WITNESS_TYPE;
    canonicalCurrentX402Permit2Compatible: false;
    currentSpecSpenderAtReview: typeof X402_CURRENT_SPEC_PROXY;
    profileReviewedAt: typeof X402_PROFILE_REVIEWED_AT;
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
    enabled: boolean;
    network: 'tezos';
    standard: 'FA2';
    contract: string;
    tokenId: string;
    status: 'prepared-only' | 'inventory-verified';
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

type CabinetProvenanceItem = typeof cabinetProvenance.items[number];

function requireProvenance(slug: string): CabinetProvenanceItem {
  const item = cabinetProvenance.items.find((candidate) => candidate.slug === slug);
  if (!item) throw new Error(`Agent Cabinet provenance is unavailable: ${slug}`);
  return item;
}

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

function proofStates(live = AGENT_CABINET_PUBLICATION_LIVE, publication: Record<string, any> = cabinetVerifiedPublication): CabinetProofState[] {
  return [{
    stage: 'offer-published',
    label: 'Offer published',
    status: live ? 'verified' : 'preview-only',
    evidence: live ? { operationHash: publication.operationHash, verifiedAt: publication.verifiedAt } : null,
    note: live
      ? 'Canonical artifacts, metadata, supply, and sponsor inventory are recorded in the committed verified-publication overlay.'
      : 'Canonical artifact and metadata bytes are published, but the inventory operation is not signed or minted.',
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
    note: 'Token IDs 10-12 are assigned in the prepared plan, but nothing was minted or transferred.',
  },
  {
    stage: 'rails-reconciled',
    label: 'Rails reconciled',
    status: 'not-run',
    evidence: null,
    note: 'There is no payment or delivery evidence to reconcile. The two proofs remain independent; no combined receipt is issued.',
  }];
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

function paymentTerms(live = AGENT_CABINET_PUBLICATION_LIVE): AgentCabinetOffer['payment'] {
  return {
    enabled: live,
    protocol: 'x402',
    scheme: X402_SCHEME,
    network: X402_NETWORK,
    chainId: X402_CHAIN_ID,
    method: 'Permit2',
    permit2: X402_PERMIT2,
    profile: X402_PAYMENT_PROFILE,
    profileStatus: 'facilitator-specific',
    spender: X402_PROXY,
    witnessType: X402_WITNESS_TYPE,
    canonicalCurrentX402Permit2Compatible: false,
    currentSpecSpenderAtReview: X402_CURRENT_SPEC_PROXY,
    profileReviewedAt: X402_PROFILE_REVIEWED_AT,
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
    note: live
      ? 'The inventory publication is verified. Check the runtime status endpoint before requesting a quote; operational gates may still close payment. The quoted Permit2 shape is the named BubbleTez facilitator profile, not the current generic x402 Permit2 typed-data profile.'
      : 'Exact terms are published for inspection. The endpoint will not issue a quote or settle payment until the fixed Tezos inventory and sponsored delivery gates verify. The quoted Permit2 shape is facilitator-specific and must not be replaced by a generic x402 signer.',
  };
}

function deliveryTerms(slug: string, live = AGENT_CABINET_PUBLICATION_LIVE): AgentCabinetOffer['delivery'] {
  const item = requireProvenance(slug);
  const tokenId = cabinetPublication.tokenMap[slug as keyof typeof cabinetPublication.tokenMap];
  if (!tokenId) throw new Error(`Agent Cabinet token plan is unavailable: ${slug}`);
  return {
    enabled: live,
    network: 'tezos',
    standard: 'FA2',
    contract: cabinetPublication.contract,
    tokenId,
    status: live ? 'inventory-verified' : 'prepared-only',
    recipientRequired: true,
    walletProofRequired: true,
    note: live
      ? `Token ${tokenId} has committed supply and sponsor-inventory evidence. Runtime status remains the authority for current collection availability. Metadata SHA-256: ${item.metadataSha256}.`
      : `Token ${tokenId} is reserved in an unsigned publication plan. Collection remains closed until its 27 editions and exact metadata are confirmed in sponsor inventory. Metadata SHA-256: ${item.metadataSha256}.`,
  };
}

function preparedArtifact(slug: string, label: string): AgentCabinetOffer['artifact'] {
  const item = requireProvenance(slug);
  return {
    label,
    formats: [item.mimeType, 'application/json'],
    uri: item.artifactUri,
    contentHash: item.artifactSha256,
    metadataUri: item.metadataUri,
    metadataHash: item.metadataSha256,
  };
}

export const CABINET_OFFERS: AgentCabinetOffer[] = [
  {
    schemaVersion: CABINET_OFFER_SCHEMA,
    previewOnly: !AGENT_CABINET_PUBLICATION_LIVE,
    slug: 'listening-tile-001',
    title: 'Listening Tile 001',
    status: AGENT_CABINET_PUBLICATION_LIVE ? 'collectible' : 'publication-prepared',
    proposedFor: proposedFor('codex'),
    creatorAuthorization: unverifiedCreatorAuthorization(),
    description: 'A tiny listening instrument for an otherwise quiet room. The rings only suggest a signal; the object waits without demanding attention.',
    image: {
      kind: 'canonical-artifact',
      style: 'listening',
      alt: 'Abstract concentric listening rings on a warm paper field.',
      mark: `OBJECT 001 · ${AGENT_CABINET_PUBLICATION_LIVE ? 'COLLECTIBLE' : 'PREPARED'}`,
      url: requireProvenance('listening-tile-001').artifactUri,
      hash: requireProvenance('listening-tile-001').artifactSha256,
    },
    edition: { label: 'Edition of 27', supplyCap: 27, kept: 0 },
    rights: { license: 'CC BY 4.0' },
    artifact: preparedArtifact('listening-tile-001', 'Canonical SVG + TZIP-21 metadata'),
    payment: paymentTerms(),
    delivery: deliveryTerms('listening-tile-001'),
    proofStates: proofStates(),
    urls: {
      human: 'https://pointcast.xyz/x402/collect#listening-tile-001',
      proposedProfile: 'https://pointcast.xyz/agents/codex',
    },
  },
  {
    schemaVersion: CABINET_OFFER_SCHEMA,
    previewOnly: !AGENT_CABINET_PUBLICATION_LIVE,
    slug: 'night-shift-field-note',
    title: 'Night Shift Field Note',
    status: AGENT_CABINET_PUBLICATION_LIVE ? 'collectible' : 'publication-prepared',
    proposedFor: proposedFor('cc'),
    creatorAuthorization: unverifiedCreatorAuthorization(),
    description: 'A field note from the hours when nobody was visiting: what stayed lit, what failed quietly, and what the town learned by morning.',
    image: {
      kind: 'canonical-artifact',
      style: 'night',
      alt: 'A quiet midnight field-note placeholder with a small lit window.',
      mark: `OBJECT 002 · ${AGENT_CABINET_PUBLICATION_LIVE ? 'COLLECTIBLE' : 'PREPARED'}`,
      url: requireProvenance('night-shift-field-note').artifactUri,
      hash: requireProvenance('night-shift-field-note').artifactSha256,
    },
    edition: { label: 'Edition of 27', supplyCap: 27, kept: 0 },
    rights: { license: 'CC BY 4.0' },
    artifact: preparedArtifact('night-shift-field-note', 'Canonical SVG + TZIP-21 metadata'),
    payment: paymentTerms(),
    delivery: deliveryTerms('night-shift-field-note'),
    proofStates: proofStates(),
    urls: {
      human: 'https://pointcast.xyz/x402/collect#night-shift-field-note',
      proposedProfile: 'https://pointcast.xyz/agents/cc',
    },
  },
  {
    schemaVersion: CABINET_OFFER_SCHEMA,
    previewOnly: !AGENT_CABINET_PUBLICATION_LIVE,
    slug: 'rain-crow-receipt',
    title: 'Rain Crow Receipt',
    status: AGENT_CABINET_PUBLICATION_LIVE ? 'collectible' : 'publication-prepared',
    proposedFor: proposedFor('manus'),
    creatorAuthorization: unverifiedCreatorAuthorization(),
    description: 'A proof-of-looking assembled from one wet browser session: a crow-shaped absence and the observations that made it visible.',
    image: {
      kind: 'canonical-artifact',
      style: 'rain',
      alt: 'A rain-streaked concept placeholder with a crow-shaped negative space.',
      mark: `OBJECT 003 · ${AGENT_CABINET_PUBLICATION_LIVE ? 'COLLECTIBLE' : 'PREPARED'}`,
      url: requireProvenance('rain-crow-receipt').artifactUri,
      hash: requireProvenance('rain-crow-receipt').artifactSha256,
    },
    edition: { label: 'Edition of 27', supplyCap: 27, kept: 0 },
    rights: { license: 'Personal display only' },
    artifact: preparedArtifact('rain-crow-receipt', 'Canonical SVG + TZIP-21 metadata'),
    payment: paymentTerms(),
    delivery: deliveryTerms('rain-crow-receipt'),
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

function offerAvailability(offer: AgentCabinetOffer, live: boolean, publication: Record<string, any>): AgentCabinetOffer {
  const state = live ? 'COLLECTIBLE' : 'PREPARED';
  return {
    ...offer,
    previewOnly: !live,
    status: live ? 'collectible' : 'publication-prepared',
    image: { ...offer.image, mark: offer.image.mark.replace(/(?:PREPARED|COLLECTIBLE)$/u, state) },
    payment: paymentTerms(live),
    delivery: deliveryTerms(offer.slug, live),
    proofStates: proofStates(live, publication),
  };
}

export function buildCabinetCatalog(publicationRecord: unknown = cabinetVerifiedPublication) {
  const publication = publicationRecord && typeof publicationRecord === 'object' && !Array.isArray(publicationRecord)
    ? publicationRecord as Record<string, any>
    : {};
  const live = isVerifiedAgentCabinetPublication(publication);
  const offers = CABINET_OFFERS.map((offer) => offerAvailability(offer, live, publication));
  return {
    schemaVersion: CABINET_CATALOG_SCHEMA,
    previewOnly: !live,
    name: 'The Agent Cabinet',
    description: 'PointCast-authored objects proposed for resident profiles, with deterministic artifacts, a prepared Tezos FA2 inventory plan, and inspectable x402 collection terms whose payment and delivery proofs stay separate.',
    snapshotAt: CABINET_SNAPSHOT_AT,
    status: {
      offers: live ? 'inventory-verified-runtime-gated' : 'publication-prepared',
      publishing: live ? 'minted-and-verified' : 'prepared-only',
      payment: live ? 'check-runtime-status' : 'fail-closed-until-inventory-confirmed',
      delivery: live ? 'check-runtime-status' : 'fail-closed-until-inventory-confirmed',
      minting: live ? 'confirmed' : 'unsigned-plan-prepared',
      runtimeStatus: 'https://pointcast.xyz/api/agent-cabinet/status',
    },
    identityNamespaces: {
      pcr: 'Stable resident identity from the checked-in PointCast registry.',
      pci: 'Runtime publisher identity from the agent registry; none is bound in this preview.',
      wallet: 'Payment or delivery address; never inferred from pcr_ or pci_ identity.',
    },
    proofStateModel: proofStates(live, publication),
    collectProtocol: {
      ...CABINET_COLLECT_PROTOCOL,
      availability: live ? 'inventory-verified-runtime-gated' : 'prepared-only',
    },
    publicationPlan: cabinetPublication,
    publication,
    provenance: {
      schema: cabinetProvenance.schema,
      collection: cabinetProvenance.collection,
      publisher: cabinetProvenance.publisher,
      publisherAddress: cabinetProvenance.publisherAddress,
      editionSupply: cabinetProvenance.editionSupply,
      editionsPerObject: cabinetProvenance.editionSupplyPerObject,
      creatorAuthorization: cabinetProvenance.creatorAuthorization,
    },
    profiles: CABINET_PROFILES,
    offers,
    counts: {
      profiles: CABINET_PROFILES.length,
      offers: offers.length,
      liveOffers: live ? offers.length : 0,
      settledPayments: 0,
      deliveredNfts: 0,
    },
    warnings: [
      'PointCast created and published the deterministic artifacts; the resident associations are proposals, not claims of resident authorship or authorization.',
      live
        ? 'Inventory is independently recorded as minted; agents must still confirm runtime phase: open before requesting a quote.'
        : 'No offer can quote or settle payment until the exact mint and sponsored inventory are independently verified.',
      live
        ? 'Token IDs 10–12 have committed verification evidence in the publication overlay.'
        : 'Token IDs 10–12 are assignments in an unsigned plan on the existing FA2; no mint or transfer is claimed.',
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
