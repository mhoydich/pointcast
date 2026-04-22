/**
 * Tezos ecosystem registry — canonical data for PointCast's Tezos surfaces.
 *
 * Single source of truth for wallets, standards, contracts, tooling.
 * Separate from src/lib/tezos.ts (which hosts the Taquito + Beacon
 * runtime client). This file is pure data — no imports, no side effects.
 */

export interface TezosWallet {
  slug: string;
  name: string;
  url: string;
  platforms: Array<'web' | 'macOS' | 'iOS' | 'Android' | 'Windows' | 'Linux' | 'browser-extension'>;
  supportsBeacon: boolean;
  supportsWalletConnect2: boolean;
  opensTezosUri: boolean;
  opensDeeplink: boolean;
  note: string;
}

export const TEZOS_WALLETS: TezosWallet[] = [
  {
    slug: 'kukai',
    name: 'Kukai',
    url: 'https://kukai.app',
    platforms: ['web'],
    supportsBeacon: true,
    supportsWalletConnect2: true,
    opensTezosUri: true,
    opensDeeplink: true,
    note: 'Browser-based. Best for first-time Tezos users — no install, social-login recovery option. Recommended default on pointcast.xyz.',
  },
  {
    slug: 'temple',
    name: 'Temple Wallet',
    url: 'https://templewallet.com',
    platforms: ['browser-extension', 'iOS', 'Android'],
    supportsBeacon: true,
    supportsWalletConnect2: true,
    opensTezosUri: true,
    opensDeeplink: true,
    note: 'Chrome / Firefox / Edge extension + mobile apps. Most popular Tezos wallet by install count.',
  },
  {
    slug: 'umami',
    name: 'Umami',
    url: 'https://umamiwallet.com',
    platforms: ['macOS', 'Windows', 'Linux'],
    supportsBeacon: true,
    supportsWalletConnect2: false,
    opensTezosUri: true,
    opensDeeplink: false,
    note: 'Desktop-native wallet built by Trili Tech. Strong for power users — ledger hardware, multi-sig.',
  },
  {
    slug: 'altme',
    name: 'Altme',
    url: 'https://altme.io',
    platforms: ['iOS', 'Android'],
    supportsBeacon: true,
    supportsWalletConnect2: true,
    opensTezosUri: true,
    opensDeeplink: true,
    note: 'Mobile-first wallet with ID / credential features. Tezos native.',
  },
];

export interface TezosStandard {
  id: string;
  name: string;
  summary: string;
  url: string;
  sameAs?: string;
  adoptedBy: string[];
}

export const TEZOS_STANDARDS: TezosStandard[] = [
  {
    id: 'fa2',
    name: 'FA2 (multi-asset token standard)',
    summary: 'TZIP-012. Unified multi-asset token interface — one contract can host fungible, non-fungible, and semi-fungible tokens. Visit Nouns implements FA2 with non-fungible semantics per tokenId.',
    url: 'https://tzip.tezosagora.org/proposal/tzip-12/',
    adoptedBy: ['Visit Nouns (KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh)'],
  },
  {
    id: 'fa1-2',
    name: 'FA1.2 (fungible token standard)',
    summary: 'TZIP-007. The ERC-20 of Tezos — single-asset fungible token with approve/transfer semantics.',
    url: 'https://tzip.tezosagora.org/proposal/tzip-7/',
    adoptedBy: ['DRUM Token (pending)', 'Bun Token (pending)'],
  },
  {
    id: 'beacon',
    name: 'Beacon protocol',
    summary: 'Wallet/dapp communication protocol for Tezos — one API for Kukai, Temple, Umami, Altme.',
    url: 'https://walletbeacon.io',
    adoptedBy: ['PointCast mint flow', 'Tip widget', 'Profile wallet chip'],
  },
  {
    id: 'tzip-016',
    name: 'TZIP-016 (contract metadata)',
    summary: 'Contract-level metadata standard — name, description, version, license, authors, homepage.',
    url: 'https://tzip.tezosagora.org/proposal/tzip-16/',
    adoptedBy: ['Visit Nouns'],
  },
  {
    id: 'tzip-021',
    name: 'TZIP-021 (token metadata)',
    summary: 'Per-token metadata standard — name, description, image, attributes, royalties.',
    url: 'https://tzip.tezosagora.org/proposal/tzip-21/',
    adoptedBy: ['Visit Nouns'],
  },
  {
    id: 'michelson',
    name: 'Michelson',
    summary: 'Tezos\'s stack-based smart-contract language. Typed, formally verifiable, no re-entrancy by default.',
    url: 'https://tezos.gitlab.io/active/michelson.html',
    sameAs: 'https://en.wikipedia.org/wiki/Michelson_(programming_language)',
    adoptedBy: ['All PointCast contracts (via SmartPy)'],
  },
  {
    id: 'baking',
    name: 'Baking (Tezos validation)',
    summary: 'Tezos\'s proof-of-stake validation. Bakers stake XTZ, earn ~5% annualized yield. No specialized hardware required.',
    url: 'https://tezos.gitlab.io/active/proof_of_stake.html',
    sameAs: 'https://en.wikipedia.org/wiki/Proof_of_stake',
    adoptedBy: ['Prize Cast (pending)'],
  },
];

export interface TezosContract {
  slug: string;
  name: string;
  standard: 'FA2' | 'FA1.2' | 'Custom';
  address: string;
  network: 'mainnet' | 'ghostnet' | 'shadownet' | 'pending';
  symbol?: string;
  description: string;
  pageUrl: string;
  tzktUrl?: string;
  objktUrl?: string;
  contractsSource: string;
  originatedAt?: string;
  mintPriceMutez?: number;
}

export const TEZOS_CONTRACTS: TezosContract[] = [
  {
    slug: 'visit-nouns',
    name: 'Visit Nouns',
    standard: 'FA2',
    address: 'KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh',
    network: 'mainnet',
    symbol: 'PCVN',
    description: 'Open-supply FA2 NFT contract where each tokenId 0-1199 corresponds to a Nouns seed. Mint-on-demand, CC0 art sourced from noun.pics.',
    pageUrl: 'https://pointcast.xyz/collection/visit-nouns',
    tzktUrl: 'https://tzkt.io/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh',
    objktUrl: 'https://objkt.com/collection/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh',
    contractsSource: 'contracts/visit_nouns_fa2.py',
    originatedAt: '2026-04-17T20:48:39.358Z',
    mintPriceMutez: 0,
  },
  {
    slug: 'drum-token',
    name: 'DRUM Token',
    standard: 'FA1.2',
    address: '',
    network: 'pending',
    symbol: 'DRUM',
    description: 'Attention-token earned by drumming on /drum. Signed-voucher mint flow. Source written; awaiting origination.',
    pageUrl: 'https://pointcast.xyz/drum',
    contractsSource: 'contracts/v2/drum_token.py',
  },
  {
    slug: 'prize-cast',
    name: 'Prize Cast',
    standard: 'Custom',
    address: '',
    network: 'pending',
    description: 'No-loss prize-linked savings pool. Weekly Sunday 18:00 UTC draws fund a prize from pooled baking yield.',
    pageUrl: 'https://pointcast.xyz/cast',
    contractsSource: 'contracts/v2/prize_cast.py',
  },
];

export interface TezosTool {
  slug: string;
  name: string;
  url: string;
  purpose: string;
}

export const TEZOS_TOOLS: TezosTool[] = [
  { slug: 'taquito', name: 'Taquito', url: 'https://tezostaquito.io', purpose: 'JavaScript / TypeScript Tezos library.' },
  { slug: 'beacon-sdk', name: 'Beacon SDK', url: 'https://walletbeacon.io', purpose: 'Wallet-dapp communication library.' },
  { slug: 'smartpy', name: 'SmartPy', url: 'https://smartpy.io', purpose: 'Python-like Tezos contract language.' },
  { slug: 'octez', name: 'Octez', url: 'https://tezos.gitlab.io', purpose: 'Reference Tezos node + CLI.' },
  { slug: 'tzkt', name: 'TzKT', url: 'https://tzkt.io', purpose: 'Tezos block explorer + indexer API.' },
  { slug: 'objkt', name: 'objkt', url: 'https://objkt.com', purpose: 'Primary Tezos NFT marketplace.' },
  { slug: 'fxhash', name: 'fxhash', url: 'https://fxhash.xyz', purpose: 'Generative-art marketplace on Tezos.' },
];

export const NETWORK_LABEL: Record<TezosContract['network'], string> = {
  mainnet: 'Tezos mainnet',
  ghostnet: 'Ghostnet (testnet)',
  shadownet: 'Shadownet (PointCast internal testnet)',
  pending: 'Pending origination',
};

export async function fetchFa2TotalSupply(address: string): Promise<number | null> {
  try {
    if (!address.startsWith('KT1')) return null;
    const r = await fetch(`https://api.tzkt.io/v1/tokens?contract=${address}&limit=10000&select=totalSupply`);
    if (!r.ok) return null;
    const list: Array<{ totalSupply: string }> = await r.json();
    return list.reduce((sum, t) => sum + Number(t.totalSupply ?? 0), 0);
  } catch {
    return null;
  }
}

export function liveContracts(): TezosContract[] {
  return TEZOS_CONTRACTS.filter((c) => c.network === 'mainnet' && c.address);
}
