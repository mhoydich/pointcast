/**
 * Ethereum surface — config.
 *
 * The /mist room's substrate. Centralizes:
 *   - chain configs (Base mainnet for writes, Ethereum L1 for ENS reads)
 *   - public RPC endpoints
 *   - well-known contract addresses (Nouns DAO L1, Wire Attestations on Base — TBD)
 *   - the App Catalog data shape (mirrors the 2014 Mist mockup categories)
 *
 * Decision record: docs/decisions/2026-05-07-mist-room-decision.md
 *
 * Stack call: viem (framework-agnostic, edge-compatible) over wagmi/RainbowKit
 * because PointCast is Astro + vanilla TS, no React. Coinbase Smart Wallet SDK
 * is lazy-loaded from jsDelivr with SRI in src/components/WalletConnect.astro,
 * matching the existing Beacon SDK pattern.
 */

import type { Chain } from 'viem';
import { base, baseSepolia, mainnet, polygon } from 'viem/chains';

// ---------------------------------------------------------------------------
// Chains
// ---------------------------------------------------------------------------

/** Base mainnet — primary write surface. ~$0.001-0.05 per tx in May 2026. */
export const BASE_CHAIN: Chain = base;
export const BASE_CHAIN_ID = base.id; // 8453
export const BASE_CHAIN_HEX = `0x${base.id.toString(16)}`; // 0x2105

/** Base Sepolia — testnet for Wire Attestations contract dry-runs. */
export const BASE_SEPOLIA_CHAIN: Chain = baseSepolia;
export const BASE_SEPOLIA_CHAIN_ID = baseSepolia.id; // 84532

/** Ethereum L1 — read-only, used for ENS resolution + Nouns DAO live tile. */
export const ETH_MAINNET_CHAIN: Chain = mainnet;
export const ETH_MAINNET_CHAIN_ID = mainnet.id; // 1

/** Polygon PoS — first bell collectible target network. */
export const POLYGON_CHAIN: Chain = polygon;
export const POLYGON_CHAIN_ID = polygon.id; // 137
export const POLYGON_CHAIN_HEX = `0x${polygon.id.toString(16)}`; // 0x89

// ---------------------------------------------------------------------------
// Public RPC endpoints
// ---------------------------------------------------------------------------
//
// These are public, no-key endpoints. If we hit rate limits in production we
// can swap in an Alchemy/QuickNode key via PUBLIC_BASE_RPC_URL / PUBLIC_ETH_RPC_URL
// import.meta.env vars. v0 leans on the free tier — read traffic is light.

export const RPC_URLS = {
  base: import.meta.env.PUBLIC_BASE_RPC_URL ?? 'https://mainnet.base.org',
  baseSepolia: import.meta.env.PUBLIC_BASE_SEPOLIA_RPC_URL ?? 'https://sepolia.base.org',
  ethMainnet: import.meta.env.PUBLIC_ETH_RPC_URL ?? 'https://eth.llamarpc.com',
  polygon: import.meta.env.PUBLIC_POLYGON_RPC_URL ?? 'https://polygon-rpc.com',
} as const;

// ---------------------------------------------------------------------------
// Known contract addresses (read targets)
// ---------------------------------------------------------------------------
//
// Nouns DAO lives on Ethereum L1. We surface the live auction in /mist as the
// "Window onto Ethereum" tile — the philosophical bridge from a Tezos town to
// the Ethereum-native culture PointCast has always pointed at via Visit Nouns.

export const NOUNS_L1 = {
  /** Nouns ERC-721 token (one minted per day forever). */
  token: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03' as const,
  /** Daily English auction house. */
  auctionHouse: '0x830BD73E4184ceF73443C15111a1DF14e495C706' as const,
  /** DAO governor / treasury logic. */
  daoLogic: '0x6f3E6272A167e8AcCb32072d08E0957F9c79223d' as const,
} as const;

/** PointCast's own Tezos mirror of Nouns 0-1199 (already shipped, FA2). */
export const VISIT_NOUNS_TEZOS = 'KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh' as const;

/**
 * Wire Attestations — PointCast's own ERC-721 on Base. Each block becomes a
 * token: { block_id, content_hash, agent_address, signed_at }.
 *
 * NULL until Mike originates the contract. The contract source lives at
 * contracts/eth/wire_attestations.sol (PR #4). After origination, set the
 * address here and the per-block "Attest on Base" button goes live.
 */
export const WIRE_ATTESTATIONS_BASE: `0x${string}` | null = null;

// ---------------------------------------------------------------------------
// App Catalog — the 2014 Mist mockup, populated with real 2026 surfaces
// ---------------------------------------------------------------------------
//
// The four categories Alex Van de Sande showed in the original Mist video.
// Each catalog entry can be:
//   - kind: 'pointcast'  — links to a PointCast room/page (in-house surface)
//   - kind: 'dapp'       — links to an external dApp on Ethereum/L2
//   - kind: 'window'     — read-only live tile rendered in /mist itself
//
// Keep the card count low. The 2014 mockup's power was clarity, not density.

export type AppCategory = 'money-together' | 'new-societies' | 'information-is-power' | 'make-together';

export type AppCard = {
  id: string;
  category: AppCategory;
  title: string;
  blurb: string;
  kind: 'pointcast' | 'dapp' | 'window';
  href: string;
  chain?: 'tezos' | 'ethereum' | 'base' | 'polygon' | 'farcaster' | 'multi';
  status?: 'live' | 'soon';
};

export const APP_CATALOG: AppCard[] = [
  // ---- Money Together ----
  {
    id: 'visit-nouns',
    category: 'money-together',
    title: 'Visit Nouns',
    blurb: 'Open-supply mirror of Nouns 0-1199 on Tezos. PointCast-native.',
    kind: 'pointcast',
    href: '/visit-nouns',
    chain: 'tezos',
    status: 'live',
  },
  {
    id: 'coffee-mugs',
    category: 'money-together',
    title: 'Coffee Mugs',
    blurb: 'Five rarity-tiered mugs from /coffee. FA2 contract pending origination.',
    kind: 'pointcast',
    href: '/coffee',
    chain: 'tezos',
    status: 'soon',
  },
  {
    id: 'zora-base',
    category: 'money-together',
    title: 'Zora',
    blurb: 'Mint, collect, and trade media as ERC-1155 coins on Base.',
    kind: 'dapp',
    href: 'https://zora.co',
    chain: 'base',
    status: 'live',
  },
  {
    id: 'polygon-bell',
    category: 'money-together',
    title: 'Polygon Bell',
    blurb: 'A five-rung lobby collectible with ERC-1155-ready metadata on Polygon.',
    kind: 'pointcast',
    href: '/polygon-bell',
    chain: 'polygon',
    status: 'soon',
  },
  {
    id: 'splits-base',
    category: 'money-together',
    title: 'Splits',
    blurb: 'Split incoming revenue across many addresses, on-chain.',
    kind: 'dapp',
    href: 'https://splits.org',
    chain: 'base',
    status: 'live',
  },

  // ---- New Societies ----
  {
    id: 'nouns-window',
    category: 'new-societies',
    title: 'Nouns DAO — live auction',
    blurb: 'Today\'s noun, current bid, time remaining. Read-only window onto L1.',
    kind: 'window',
    href: '/mist#nouns-window',
    chain: 'ethereum',
    status: 'live',
  },
  {
    id: 'hats-protocol',
    category: 'new-societies',
    title: 'Hats',
    blurb: 'Roles + permissions for DAOs as composable hats.',
    kind: 'dapp',
    href: 'https://www.hatsprotocol.xyz',
    chain: 'multi',
    status: 'live',
  },
  {
    id: 'gitcoin-passport',
    category: 'new-societies',
    title: 'Gitcoin Passport',
    blurb: 'Aggregate identity proofs into a portable on-chain humanity score.',
    kind: 'dapp',
    href: 'https://passport.gitcoin.co',
    chain: 'multi',
    status: 'live',
  },

  // ---- Information is Power ----
  {
    id: 'farcaster',
    category: 'information-is-power',
    title: 'Farcaster',
    blurb: 'Decentralized social. PointCast blocks cast as frames v2.',
    kind: 'dapp',
    href: 'https://warpcast.com',
    chain: 'farcaster',
    status: 'live',
  },
  {
    id: 'polymarket',
    category: 'information-is-power',
    title: 'Polymarket',
    blurb: 'Information markets. The 2014 Mist mockup had this as a default app.',
    kind: 'dapp',
    href: 'https://polymarket.com',
    chain: 'multi',
    status: 'live',
  },

  // ---- Make Together ----
  {
    id: 'juicebox',
    category: 'make-together',
    title: 'Juicebox',
    blurb: 'Programmable funding cycles for projects, DAOs, communities.',
    kind: 'dapp',
    href: 'https://juicebox.money',
    chain: 'multi',
    status: 'live',
  },
  {
    id: 'party-protocol',
    category: 'make-together',
    title: 'Party',
    blurb: 'Group coordination + collective action as smart contracts.',
    kind: 'dapp',
    href: 'https://party.app',
    chain: 'base',
    status: 'live',
  },
  {
    id: 'wire-attestations',
    category: 'make-together',
    title: 'Wire Attestations',
    blurb: 'Each PointCast block as an on-chain attestation on Base. Coming soon.',
    kind: 'pointcast',
    href: '/mist#attestations',
    chain: 'base',
    status: 'soon',
  },
];

export const CATEGORY_META: Record<AppCategory, { title: string; tagline: string; order: number }> = {
  'money-together': {
    title: 'Money Together',
    tagline: 'pooled funds, exchanges, mints',
    order: 0,
  },
  'new-societies': {
    title: 'New Societies',
    tagline: 'governance, identity, coordination',
    order: 1,
  },
  'information-is-power': {
    title: 'Information is Power',
    tagline: 'social, signal, prediction',
    order: 2,
  },
  'make-together': {
    title: 'Make Together',
    tagline: 'agreements, splits, attestations',
    order: 3,
  },
};
