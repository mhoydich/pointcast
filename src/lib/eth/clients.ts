/**
 * Ethereum surface — viem clients.
 *
 * Public read clients for Base mainnet, Base Sepolia, and Ethereum L1. Used by:
 *   - /mist read panels (balance, ENS, NFT view)
 *   - The Nouns DAO live-auction "Window onto Ethereum" tile
 *   - The Cloudflare Worker that verifies SIWE signatures (PR #2)
 *   - The per-block "Attest on Base" mint flow once the contract ships (PR #4)
 *
 * These are read-only clients. Wallet clients (signing) are constructed on the
 * fly inside the connect flow in WalletConnect.astro from window.ethereum or
 * the Coinbase Smart Wallet provider — they aren't exported from this file.
 */

import { createPublicClient, http, type PublicClient } from 'viem';
import { base, baseSepolia, mainnet, polygon } from 'viem/chains';
import { RPC_URLS } from './config';

let _baseClient: PublicClient | null = null;
let _baseSepoliaClient: PublicClient | null = null;
let _ethMainnetClient: PublicClient | null = null;
let _polygonClient: PublicClient | null = null;

export function getBaseClient(): PublicClient {
  if (!_baseClient) {
    _baseClient = createPublicClient({
      chain: base,
      transport: http(RPC_URLS.base),
    });
  }
  return _baseClient;
}

export function getBaseSepoliaClient(): PublicClient {
  if (!_baseSepoliaClient) {
    _baseSepoliaClient = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URLS.baseSepolia),
    });
  }
  return _baseSepoliaClient;
}

/** Ethereum L1 — used only for ENS resolution. ENS resolvers don't bridge. */
export function getEthMainnetClient(): PublicClient {
  if (!_ethMainnetClient) {
    _ethMainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(RPC_URLS.ethMainnet),
    });
  }
  return _ethMainnetClient;
}

/** Polygon mainnet — home of HelloPolygon. Used by /hello to read faucet state. */
export function getPolygonClient(): PublicClient {
  if (!_polygonClient) {
    _polygonClient = createPublicClient({
      chain: polygon,
      transport: http(RPC_URLS.polygon),
    });
  }
  return _polygonClient;
}

/**
 * Resolve an ENS name for an address. Returns null if no primary name set,
 * or on RPC error (always non-throwing — ENS lookups are best-effort UI).
 */
export async function resolveEnsName(address: `0x${string}`): Promise<string | null> {
  try {
    const client = getEthMainnetClient();
    const name = await client.getEnsName({ address });
    return name ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve an ENS avatar URL for a name. Returns null if no avatar set.
 * The result may be an http/https URL, an ipfs:// URL, or a data: URI —
 * caller is responsible for resolving non-http schemes.
 */
export async function resolveEnsAvatar(name: string): Promise<string | null> {
  try {
    const client = getEthMainnetClient();
    const avatar = await client.getEnsAvatar({ name });
    return avatar ?? null;
  } catch {
    return null;
  }
}

/**
 * Format a 0x address for display. 6-on-the-left, 4-on-the-right with an
 * ellipsis. Matches the existing pattern in WalletConnect.astro.
 */
export function shortAddress(addr: string): string {
  if (!addr) return '';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
