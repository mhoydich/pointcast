/**
 * mint — Taquito helpers for calling PointCast's FA2 entrypoints.
 *
 * Reads contract addresses from src/data/contracts.json. An empty address
 * means the contract isn't deployed yet, and every mint function returns
 * `{ ok: false, reason: 'not-deployed' }` so the UI can gracefully fall
 * back to "Mint soon" state instead of throwing.
 *
 * Reuses the same Taquito + BeaconWallet setup as src/lib/tezos.ts so
 * Kukai sessions carry across collect + mint. Lazy-loaded via dynamic
 * import at every call site — ~700KB of crypto libs only lands on pages
 * that actually initiate a Tezos action.
 */

import contracts from '../data/contracts.json';
import { connectKukai, tezosClient } from './tezos';

export type Network = 'mainnet' | 'ghostnet' | 'shadownet';

const PASSPORT_STAMP_MAX_ID = 23;

export function visitNounsAddress(network: Network): string {
  return (contracts as any)?.visit_nouns?.[network] ?? '';
}

export function hasVisitNounsContract(network: Network = 'mainnet'): boolean {
  return visitNounsAddress(network).startsWith('KT1');
}

export function passportStampsAddress(network: Network): string {
  return (contracts as any)?.passport_stamps?.[network] ?? '';
}

export function hasPassportStampsContract(network: Network = 'mainnet'): boolean {
  return passportStampsAddress(network).startsWith('KT1');
}

export function visitNounsMintPriceMutez(): number {
  return Number((contracts as any)?.visit_nouns?.mintPriceMutez ?? 0);
}

export function passportStampsMintPriceMutez(): number {
  return Number((contracts as any)?.passport_stamps?.mintPriceMutez ?? 0);
}

/**
 * Optional metadata bag we stash alongside a mint as an off-chain pointer.
 * Not part of the on-chain entrypoint — the contract derives its token URI
 * deterministically from the IPFS metadata directory — but we keep this
 * so the client can record "moment" context (weather, location, timestamp)
 * and, when the marketplace + receipt page lands, display it.
 */
export interface MintContext {
  weather?: Record<string, unknown>;
  location?: Record<string, unknown>;
  capturedAt?: string;
  source?: string; // e.g. 'weather-card', 'modal', 'top-noun', 'drum-room'
}

export interface MintResult {
  ok: boolean;
  reason?: string;
  opHash?: string;
  confirmation?: Promise<unknown>;
  tzktUrl?: string;
}

/**
 * Call mint_noun(nounId) on the Visit Nouns FA2 contract.
 *
 * @param nounId   0–1199
 * @param network  'mainnet' (default) or 'ghostnet'
 * @param context  Optional — stashed client-side only for now
 */
export async function mintVisitNoun(
  nounId: number,
  network: Network = 'mainnet',
  _context: MintContext = {},
): Promise<MintResult> {
  const address = visitNounsAddress(network);
  if (!address.startsWith('KT1')) {
    return { ok: false, reason: 'not-deployed' };
  }
  if (!Number.isFinite(nounId) || nounId < 0 || nounId > 1199) {
    return { ok: false, reason: 'invalid-noun-id' };
  }
  if (network !== 'mainnet') {
    return { ok: false, reason: 'unsupported-network' };
  }

  const priceMutez = visitNounsMintPriceMutez();

  try {
    const tezos = await tezosClient();
    await connectKukai();
    const contract = await tezos.wallet.at(address);
    const op = await contract.methodsObject
      .mint_noun(nounId)
      .send({
        amount: priceMutez,
        mutez: true,
      });

    const tzktBase = network === 'mainnet' ? 'https://tzkt.io' : 'https://ghostnet.tzkt.io';
    return {
      ok: true,
      opHash: (op as any).opHash,
      confirmation: op.confirmation(1),
      tzktUrl: `${tzktBase}/${(op as any).opHash}`,
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (/ABORTED|reject|cancel/i.test(msg)) {
      return { ok: false, reason: 'user-cancelled' };
    }
    if (/NotEnoughBalance|balance/i.test(msg)) {
      return { ok: false, reason: 'insufficient-balance' };
    }
    return { ok: false, reason: msg.slice(0, 200) };
  }
}

/**
 * Call mint_stamp(stampId) on the native Passport Stamps FA2 contract.
 *
 * @param stampId  0-23 (P00-P23)
 * @param network  'mainnet' only for browser Beacon flow
 * @param context  Optional — stashed client-side only for now
 */
export async function mintPassportStamp(
  stampId: number,
  network: Network = 'mainnet',
  _context: MintContext = {},
): Promise<MintResult> {
  const address = passportStampsAddress(network);
  if (!address.startsWith('KT1')) {
    return { ok: false, reason: 'not-deployed' };
  }
  if (!Number.isFinite(stampId) || stampId < 0 || stampId > PASSPORT_STAMP_MAX_ID) {
    return { ok: false, reason: 'invalid-stamp-id' };
  }
  if (network !== 'mainnet') {
    return { ok: false, reason: 'unsupported-network' };
  }

  const priceMutez = passportStampsMintPriceMutez();

  try {
    const tezos = await tezosClient();
    await connectKukai();
    const contract = await tezos.wallet.at(address);
    const op = await contract.methodsObject
      .mint_stamp(stampId)
      .send({
        amount: priceMutez,
        mutez: true,
      });

    return {
      ok: true,
      opHash: (op as any).opHash,
      confirmation: op.confirmation(1),
      tzktUrl: `https://tzkt.io/${(op as any).opHash}`,
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (/ABORTED|reject|cancel/i.test(msg)) {
      return { ok: false, reason: 'user-cancelled' };
    }
    if (/NotEnoughBalance|balance/i.test(msg)) {
      return { ok: false, reason: 'insufficient-balance' };
    }
    return { ok: false, reason: msg.slice(0, 200) };
  }
}
