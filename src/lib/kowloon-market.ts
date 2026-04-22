/**
 * kowloon-market — list / fulfill / cancel on the PointCast marketplace
 * contract for Kowloon Pastry NFTs, Achievement Receipts, Visit Nouns,
 * and any other FA2 token registered with the marketplace.
 *
 * The marketplace (contracts/marketplace.py) is FA2-generic — same
 * contract handles any of our collections. Sellers pre-approve the
 * marketplace as operator on their FA2, then call list_ask with the
 * asking price (mutez). Buyers call fulfill_ask, paying the total.
 * The marketplace splits: platform fee (2.5%), creator royalty (per
 * the listing's declared royalty_bps), seller proceeds.
 *
 * This helper resolves the correct royalty for Kowloon collections
 * automatically (10% for pastry, 0% for achievements, 20% for visit
 * nouns) so sellers can't under-declare.
 */

import contracts from '../data/contracts.json';
import { connectKukai, tezosClient } from './tezos';

export type Network = 'mainnet' | 'ghostnet' | 'shadownet';

export function marketplaceAddress(n: Network = 'mainnet'): string {
  return (contracts as any)?.marketplace?.[n] ?? '';
}
export function hasMarketplace(n: Network = 'mainnet'): boolean {
  return marketplaceAddress(n).startsWith('KT1');
}

/** Known-collection royalty defaults. The marketplace accepts any
 *  royalty up to 25% in the listing payload; we pre-fill sensible
 *  values for our own contracts so the UI doesn't let a seller
 *  under-cut the creator. */
export function royaltyDefaultsFor(fa2: string, n: Network = 'mainnet') {
  const mainnet = (contracts as any);
  const pastryKt = mainnet?.kowloon_pastry?.[n] ?? '';
  const achvKt   = mainnet?.kowloon_achievements?.[n] ?? '';
  const nounsKt  = mainnet?.visit_nouns?.[n] ?? '';
  // Admin / treasury (royalty receiver) — Mike's admin wallet. Eventually
  // this lookups the actual on-chain `admin` from each contract's storage.
  const admin = 'tz1PS4WgbYCKcKnfbfMNSH44JfrnFVhkcKp1';
  if (fa2 === pastryKt) return { royalty_bps: 1000, royalty_receiver: admin };
  if (fa2 === achvKt)   return { royalty_bps: 0,    royalty_receiver: admin };
  if (fa2 === nounsKt)  return { royalty_bps: 2000, royalty_receiver: admin };
  return { royalty_bps: 0, royalty_receiver: admin };
}

export interface ListArgs {
  fa2: string;
  tokenId: number;
  amount: number;       // units of the FA2 token (1 for single-edition NFTs)
  priceMutez: number;   // in mutez (1 tez = 1_000_000 mutez)
}

export interface TxResult {
  ok: boolean;
  reason?: 'not-deployed' | 'not-connected' | 'user-cancelled' | 'unknown';
  opHash?: string;
  tzktUrl?: string;
}

/**
 * Step 1 of listing: grant the marketplace operator rights on a FA2 token.
 * Must be done once per (token_contract, seller, token_id) before listing.
 * If the seller has already added the marketplace as a global operator on
 * their account (not per-token), this is a no-op — but safer to call.
 */
export async function approveMarketplace(
  fa2: string,
  tokenId: number,
  network: Network = 'mainnet',
): Promise<TxResult> {
  const market = marketplaceAddress(network);
  if (!market.startsWith('KT1')) return { ok: false, reason: 'not-deployed' };
  const owner = await connectKukai().catch(() => null);
  if (!owner) return { ok: false, reason: 'not-connected' };
  try {
    const tezos = await tezosClient();
    const contract = await tezos.wallet.at(fa2);
    const op = await contract.methodsObject
      .update_operators([
        {
          add_operator: {
            owner,
            operator: market,
            token_id: tokenId,
          },
        },
      ])
      .send();
    return { ok: true, opHash: op.opHash, tzktUrl: `https://tzkt.io/${op.opHash}` };
  } catch (e: any) {
    if (e?.name === 'UserRejectedError') return { ok: false, reason: 'user-cancelled' };
    return { ok: false, reason: 'unknown' };
  }
}

/**
 * Step 2: create the listing. Marketplace contract records the Ask in
 * storage; no token movement happens until fulfill_ask.
 */
export async function listItem(
  args: ListArgs,
  network: Network = 'mainnet',
): Promise<TxResult> {
  const market = marketplaceAddress(network);
  if (!market.startsWith('KT1')) return { ok: false, reason: 'not-deployed' };
  const seller = await connectKukai().catch(() => null);
  if (!seller) return { ok: false, reason: 'not-connected' };
  const { royalty_bps, royalty_receiver } = royaltyDefaultsFor(args.fa2, network);
  try {
    const tezos = await tezosClient();
    const contract = await tezos.wallet.at(market);
    const op = await contract.methodsObject
      .list_ask({
        token_contract: args.fa2,
        token_id: args.tokenId,
        amount: args.amount,
        price_mutez: args.priceMutez,
        royalty_bps,
        royalty_receiver,
      })
      .send();
    return { ok: true, opHash: op.opHash, tzktUrl: `https://tzkt.io/${op.opHash}` };
  } catch (e: any) {
    if (e?.name === 'UserRejectedError') return { ok: false, reason: 'user-cancelled' };
    return { ok: false, reason: 'unknown' };
  }
}

/** Fulfill (buy) an existing ask. `amount` can be <= ask.amount.
 *  Caller sends `priceMutez * amount` in the op. */
export async function fulfillAsk(
  askId: number,
  amount: number,
  totalMutez: number,
  network: Network = 'mainnet',
): Promise<TxResult> {
  const market = marketplaceAddress(network);
  if (!market.startsWith('KT1')) return { ok: false, reason: 'not-deployed' };
  const buyer = await connectKukai().catch(() => null);
  if (!buyer) return { ok: false, reason: 'not-connected' };
  try {
    const tezos = await tezosClient();
    const contract = await tezos.wallet.at(market);
    const op = await contract.methodsObject
      .fulfill_ask({ ask_id: askId, amount })
      .send({ amount: totalMutez, mutez: true });
    return { ok: true, opHash: op.opHash, tzktUrl: `https://tzkt.io/${op.opHash}` };
  } catch (e: any) {
    if (e?.name === 'UserRejectedError') return { ok: false, reason: 'user-cancelled' };
    return { ok: false, reason: 'unknown' };
  }
}

/** Cancel your own listing. Marketplace removes the ask; the token
 *  was never transferred so nothing to return. */
export async function cancelAsk(
  askId: number,
  network: Network = 'mainnet',
): Promise<TxResult> {
  const market = marketplaceAddress(network);
  if (!market.startsWith('KT1')) return { ok: false, reason: 'not-deployed' };
  const seller = await connectKukai().catch(() => null);
  if (!seller) return { ok: false, reason: 'not-connected' };
  try {
    const tezos = await tezosClient();
    const contract = await tezos.wallet.at(market);
    const op = await contract.methodsObject.cancel_ask(askId).send();
    return { ok: true, opHash: op.opHash, tzktUrl: `https://tzkt.io/${op.opHash}` };
  } catch (e: any) {
    if (e?.name === 'UserRejectedError') return { ok: false, reason: 'user-cancelled' };
    return { ok: false, reason: 'unknown' };
  }
}

export async function updateAsk(
  askId: number,
  newPriceMutez: number,
  network: Network = 'mainnet',
): Promise<TxResult> {
  const market = marketplaceAddress(network);
  if (!market.startsWith('KT1')) return { ok: false, reason: 'not-deployed' };
  const seller = await connectKukai().catch(() => null);
  if (!seller) return { ok: false, reason: 'not-connected' };
  try {
    const tezos = await tezosClient();
    const contract = await tezos.wallet.at(market);
    const op = await contract.methodsObject
      .update_ask({ ask_id: askId, price_mutez: newPriceMutez })
      .send();
    return { ok: true, opHash: op.opHash, tzktUrl: `https://tzkt.io/${op.opHash}` };
  } catch (e: any) {
    if (e?.name === 'UserRejectedError') return { ok: false, reason: 'user-cancelled' };
    return { ok: false, reason: 'unknown' };
  }
}

// ----------------------------------------------------------------------
// Read-side: enumerate open asks via tzkt.
// ----------------------------------------------------------------------

export interface MarketListing {
  askId: number;
  seller: string;
  tokenContract: string;
  tokenId: number;
  amount: number;
  priceMutez: number;
  royaltyBps: number;
  royaltyReceiver: string;
}

/**
 * Fetch open asks from tzkt (read-only). Filters to Kowloon collections
 * by default; pass null to see ALL asks on this marketplace.
 */
export async function fetchListings(
  opts: { collections?: string[] | null; network?: Network } = {},
): Promise<MarketListing[]> {
  const { network = 'mainnet' } = opts;
  const market = marketplaceAddress(network);
  if (!market.startsWith('KT1')) return [];
  const base = network === 'mainnet' ? 'https://api.tzkt.io' : 'https://api.ghostnet.tzkt.io';
  const url = `${base}/v1/contracts/${market}/bigmaps/asks/keys?active=true&limit=200`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const keys = await resp.json();
  const rows: MarketListing[] = keys.map((k: any) => ({
    askId: Number(k.key),
    seller: k.value.seller,
    tokenContract: k.value.token_contract,
    tokenId: Number(k.value.token_id),
    amount: Number(k.value.amount),
    priceMutez: Number(k.value.price_mutez),
    royaltyBps: Number(k.value.royalty_bps),
    royaltyReceiver: k.value.royalty_receiver,
  }));
  if (opts.collections === null) return rows;
  const filter = opts.collections ?? collectionAllowlist(network);
  return rows.filter((r) => filter.includes(r.tokenContract));
}

export function collectionAllowlist(network: Network = 'mainnet'): string[] {
  const c = contracts as any;
  return [
    c?.kowloon_pastry?.[network],
    c?.kowloon_achievements?.[network],
    c?.visit_nouns?.[network],
  ].filter((a): a is string => !!a && a.startsWith('KT1'));
}
