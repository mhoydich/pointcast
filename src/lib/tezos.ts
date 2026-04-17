/**
 * Tezos client — real on-chain operations via Taquito + Beacon.
 *
 * Used by:
 *   - WalletConnect.astro    connect / disconnect Kukai via Beacon
 *   - /collect/[tokenId]      sign fulfill_ask on the objkt marketplace
 *
 * Lazy-loaded — Taquito is ~500KB, BeaconWallet ~200KB. Only fetched
 * when the user actually initiates a Tezos action. Astro/Vite handles
 * the code-split via dynamic import() from the call site.
 */

import { TezosToolkit, MichelsonMap } from '@taquito/taquito';
import { BeaconWallet } from '@taquito/beacon-wallet';

// A public mainnet RPC. ecadinfra is run by the Taquito maintainers.
const RPC_URL = 'https://mainnet.api.tez.ie';

let _tezos: TezosToolkit | null = null;
let _wallet: BeaconWallet | null = null;

function getToolkit(): { tezos: TezosToolkit; wallet: BeaconWallet } {
  if (_tezos && _wallet) return { tezos: _tezos, wallet: _wallet };
  _tezos = new TezosToolkit(RPC_URL);
  // Beacon SDK (as shipped inside @taquito/beacon-wallet 24.2) removed
  // the `network` argument from requestPermissions and now reads it
  // exclusively from DAppClient construction options. See
  //   node_modules/@ecadlabs/beacon-dapp/dist/esm/dapp-client/DAppClient.js:1100
  //   'the "network" property is no longer accepted in input. Please
  //    provide it when instantiating DAppClient.'
  _wallet = new BeaconWallet({
    name: 'PointCast',
    network: { type: 'mainnet' as any },
    preferredNetwork: 'mainnet' as any,
  } as any);
  _tezos.setWalletProvider(_wallet);
  return { tezos: _tezos, wallet: _wallet };
}

/**
 * Lazily-initialized Tezos toolkit shared across all call sites. Mint,
 * collect, and any future on-chain op all go through this one instance
 * so Beacon pair state stays consistent.
 */
export async function tezosClient(): Promise<TezosToolkit> {
  return getToolkit().tezos;
}

/** Returns the currently-connected Tezos address, or null if disconnected. */
export async function getActiveAddress(): Promise<string | null> {
  const { wallet } = getToolkit();
  const account = await wallet.client.getActiveAccount();
  return account?.address ?? null;
}

/** Prompt the user to connect Kukai (or any Beacon-compatible wallet). */
export async function connectKukai(): Promise<string> {
  const { wallet } = getToolkit();
  const existing = await wallet.client.getActiveAccount();
  if (existing) return existing.address;
  // `network` used to live here; the current Beacon SDK requires it
  // to be set at DAppClient construction and throws if passed here.
  const perms = await wallet.client.requestPermissions();
  return perms.address;
}

export async function disconnectKukai(): Promise<void> {
  const { wallet } = getToolkit();
  try {
    await wallet.clearActiveAccount();
  } catch { /* ignore */ }
}

/**
 * Sign `fulfill_ask` on the objkt marketplace contract to collect a token.
 *
 * Returns the operation hash — the caller can link to tzkt.io/{hash} to let
 * the user watch confirmation. The operation is considered "pending" when
 * this returns; confirmation takes ~15-30s on Tezos.
 */
export async function collectToken(params: {
  marketplaceAddress: string;
  askId: number;
  priceMutez: number;
  amount?: number;
}): Promise<{ opHash: string; confirmation: Promise<unknown> }> {
  const { tezos } = getToolkit();
  await connectKukai(); // ensures active account

  const contract = await tezos.wallet.at(params.marketplaceAddress);
  const amt = params.amount ?? 1;
  const totalMutez = params.priceMutez * amt;

  // fulfill_ask signature:
  //   ask_id : nat
  //   amount : nat
  //   proxy_for : option(address)
  //   condition_extra : option(bytes)
  //   referrers : map(address, nat)
  const op = await contract.methodsObject
    .fulfill_ask({
      ask_id: params.askId,
      amount: amt,
      proxy_for: null,
      condition_extra: null,
      referrers: new MichelsonMap(),
    })
    .send({
      amount: totalMutez,
      mutez: true,
    });

  return {
    opHash: op.opHash,
    confirmation: op.confirmation(1),
  };
}
