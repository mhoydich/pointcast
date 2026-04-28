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

export type Network = 'mainnet' | 'ghostnet';

export function visitNounsAddress(network: Network): string {
  return (contracts as any)?.visit_nouns?.[network] ?? '';
}

export function hasVisitNounsContract(network: Network = 'mainnet'): boolean {
  return visitNounsAddress(network).startsWith('KT1');
}

export function visitNounsMintPriceMutez(): number {
  return Number((contracts as any)?.visit_nouns?.mintPriceMutez ?? 0);
}

export function zenCatsAddress(network: Network): string {
  return (contracts as any)?.zen_cats?.[network] ?? '';
}

export function hasZenCatsContract(network: Network = 'mainnet'): boolean {
  return zenCatsAddress(network).startsWith('KT1');
}

export function zenCatsMintPriceMutez(): number {
  return Number((contracts as any)?.zen_cats?.mintPriceMutez ?? 0);
}

export function morningOceanAddress(network: Network): string {
  return (contracts as any)?.morning_ocean?.[network] ?? '';
}

export function hasMorningOceanContract(network: Network = 'mainnet'): boolean {
  return morningOceanAddress(network).startsWith('KT1');
}

export function morningOceanMintPriceMutez(): number {
  return Number((contracts as any)?.morning_ocean?.mintPriceMutez ?? 0);
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
  [key: string]: unknown;
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

  // Lazy-load Taquito + BeaconWallet — same split-bundle pattern as /collect.
  const { TezosToolkit } = await import('@taquito/taquito');
  const { BeaconWallet } = await import('@taquito/beacon-wallet');

  const rpcUrl = network === 'mainnet'
    ? 'https://mainnet.api.tez.ie'
    : 'https://ghostnet.tezos.ecadinfra.com';

  const tezos = new TezosToolkit(rpcUrl);
  const wallet = new BeaconWallet({
    name: 'PointCast',
    preferredNetwork: network as any,
  });
  tezos.setWalletProvider(wallet);

  // Ensure a session on the right network.
  const existing = await wallet.client.getActiveAccount();
  if (!existing || (existing as any).network?.type !== network) {
    try { await wallet.clearActiveAccount(); } catch {}
    await wallet.client.requestPermissions({ network: { type: network as any } });
  }

  const priceMutez = visitNounsMintPriceMutez();
  const contract = await tezos.wallet.at(address);

  try {
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
 * Call a dedicated Zen Cats FA2 mint entrypoint once the PCCAT KT1 exists.
 *
 * The frontend refuses to reuse Visit Nouns for this surface. A cat contract
 * should expose either mint_daily_cat(tokenId) or mint_cat(tokenId) and use
 * https://pointcast.xyz/api/zen-cat-metadata as its token metadata base.
 */
export async function mintZenCat(
  tokenId: number,
  network: Network = 'mainnet',
  _context: MintContext & { cat?: string; date?: string } = {},
): Promise<MintResult> {
  const address = zenCatsAddress(network);
  if (!address.startsWith('KT1')) {
    return { ok: false, reason: 'not-deployed' };
  }
  if (!Number.isFinite(tokenId) || tokenId < 20_000_000 || tokenId > 99_999_999) {
    return { ok: false, reason: 'invalid-zen-cat-token-id' };
  }

  const { TezosToolkit } = await import('@taquito/taquito');
  const { BeaconWallet } = await import('@taquito/beacon-wallet');

  const rpcUrl = network === 'mainnet'
    ? 'https://mainnet.api.tez.ie'
    : 'https://ghostnet.tezos.ecadinfra.com';

  const tezos = new TezosToolkit(rpcUrl);
  const wallet = new BeaconWallet({
    name: 'PointCast',
    preferredNetwork: network as any,
  });
  tezos.setWalletProvider(wallet);

  const existing = await wallet.client.getActiveAccount();
  if (!existing || (existing as any).network?.type !== network) {
    try { await wallet.clearActiveAccount(); } catch {}
    await wallet.client.requestPermissions({ network: { type: network as any } });
  }

  const priceMutez = zenCatsMintPriceMutez();
  const contract = await tezos.wallet.at(address);
  const methods = (contract as any).methodsObject ?? {};
  const call =
    typeof methods.mint_zen_cat === 'function'
      ? methods.mint_zen_cat(tokenId)
      : typeof methods.mint_daily_cat === 'function'
      ? methods.mint_daily_cat(tokenId)
      : typeof methods.mint_cat === 'function'
        ? methods.mint_cat(tokenId)
        : typeof methods.mint === 'function'
          ? methods.mint(tokenId)
          : null;

  if (!call) {
    return { ok: false, reason: 'missing-mint-entrypoint' };
  }

  try {
    const op = await call.send({
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
 * Call the dedicated Morning Ocean FA2 mint entrypoint once the PCOCEAN KT1 exists.
 *
 * The intended entrypoint is mint_ocean(tokenId). Fallbacks are included so the
 * frontend still works if the final contract source chooses a slightly more
 * generic mint name.
 */
export async function mintMorningOcean(
  tokenId: number,
  network: Network = 'mainnet',
  _context: MintContext = {},
): Promise<MintResult> {
  const address = morningOceanAddress(network);
  if (!address.startsWith('KT1')) {
    return { ok: false, reason: 'not-deployed' };
  }
  if (!Number.isFinite(tokenId) || tokenId < 1 || tokenId > 24) {
    return { ok: false, reason: 'invalid-morning-ocean-token-id' };
  }

  const { TezosToolkit } = await import('@taquito/taquito');
  const { BeaconWallet } = await import('@taquito/beacon-wallet');

  const rpcUrl = network === 'mainnet'
    ? 'https://mainnet.api.tez.ie'
    : 'https://ghostnet.tezos.ecadinfra.com';

  const tezos = new TezosToolkit(rpcUrl);
  const wallet = new BeaconWallet({
    name: 'PointCast',
    preferredNetwork: network as any,
  });
  tezos.setWalletProvider(wallet);

  const existing = await wallet.client.getActiveAccount();
  if (!existing || (existing as any).network?.type !== network) {
    try { await wallet.clearActiveAccount(); } catch {}
    await wallet.client.requestPermissions({ network: { type: network as any } });
  }

  const priceMutez = morningOceanMintPriceMutez();
  const contract = await tezos.wallet.at(address);
  const methods = (contract as any).methodsObject ?? {};
  const call =
    typeof methods.mint_ocean === 'function'
      ? methods.mint_ocean(tokenId)
      : typeof methods.mint_morning_ocean === 'function'
      ? methods.mint_morning_ocean(tokenId)
      : typeof methods.mint_print === 'function'
        ? methods.mint_print(tokenId)
        : typeof methods.mint === 'function'
          ? methods.mint(tokenId)
          : null;

  if (!call) {
    return { ok: false, reason: 'missing-mint-entrypoint' };
  }

  try {
    const op = await call.send({
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
