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
import { getPkhfromPk, stringToBytes, verifySignature } from '@taquito/utils';

// A public mainnet RPC. ecadinfra is run by the Taquito maintainers.
const RPC_URL = 'https://mainnet.api.tez.ie';

let _tezos: TezosToolkit | null = null;
let _wallet: BeaconWallet | null = null;
let _activeAccountSubscription: Promise<void> | null = null;

// Every PointCast Tezos surface shares this one permission contract. Asking
// for operation and signing independently created a split-brain session:
// legacy collect/mint buttons could report a connected wallet while the
// PointCast login flow was unable to request a message signature from the
// same active account. Permission does not submit an operation; every future
// signature or transaction still requires an explicit wallet approval.
const POINTCAST_SCOPES = ['operation_request', 'sign'] as any[];

function hasPointCastScopes(account: any): boolean {
  const scopes = Array.isArray(account?.scopes) ? account.scopes : [];
  return POINTCAST_SCOPES.every((scope) => scopes.includes(scope));
}

export const POINTCAST_SIGNING_DOMAIN = 'pointcast.xyz/beat-runner-v5';

/** Encode a human-readable string as a Micheline string expression. */
export function michelineStringPayload(value: string): string {
  const bytes = stringToBytes(value);
  const byteLength = (bytes.length / 2).toString(16).padStart(8, '0');
  return `0501${byteLength}${bytes}`;
}

export function tezosSignedMessage(
  message: string,
  issuedAt: string,
  domain = POINTCAST_SIGNING_DOMAIN,
): { formattedMessage: string; payload: string } {
  const formattedMessage = ['Tezos Signed Message:', domain, issuedAt, message].join(' ');
  return { formattedMessage, payload: michelineStringPayload(formattedMessage) };
}

function getToolkit(): { tezos: TezosToolkit; wallet: BeaconWallet } {
  if (_tezos && _wallet) return { tezos: _tezos, wallet: _wallet };
  _tezos = new TezosToolkit(RPC_URL);
  // Beacon SDK (as shipped inside @taquito/beacon-wallet 25.0) removed
  // the `network` argument from requestPermissions and now reads it
  // exclusively from DAppClient construction options. See
  //   node_modules/@ecadlabs/beacon-dapp/dist/esm/dapp-client/DAppClient.js:1100
  //   'the "network" property is no longer accepted in input. Please
  //    provide it when instantiating DAppClient.'
  _wallet = new BeaconWallet({
    name: 'PointCast',
    network: { type: 'mainnet' as any },
    preferredNetwork: 'mainnet' as any,
    enableMetrics: false,
  } as any);
  // Beacon can still attempt to write disabled metrics to an IndexedDB
  // object store in some browsers. No-op it so connect/sign flows do not fail
  // before the wallet UI opens.
  (_wallet.client as any).sendMetrics = () => {};
  // PointCast has one Beacon client for the whole origin. Subscribe as soon as
  // it is constructed (before getActiveAccount/requestPermissions) so restored
  // Kukai accounts are accepted by modern Beacon and mirrored to every legacy
  // PointCast wallet surface.
  _activeAccountSubscription = _wallet.client.subscribeToEvent(
    'ACTIVE_ACCOUNT_SET' as any,
    (account: any) => {
      if (typeof window === 'undefined') return;
      const activeWallet = account?.address
        ? { chain: 'tezos', address: account.address, provider: 'kukai', addedAt: Date.now() }
        : null;
      try {
        if (activeWallet) {
          let remembered: any[] = [];
          try {
            const parsed = JSON.parse(window.localStorage.getItem('pc:wallets') || '[]');
            if (Array.isArray(parsed)) remembered = parsed;
          } catch { /* replace malformed wallet memory */ }
          remembered = remembered.filter((item) => item?.address !== activeWallet.address);
          remembered.push(activeWallet);
          window.localStorage.setItem('pc:wallets', JSON.stringify(remembered));
          window.localStorage.setItem('pc:wallet', JSON.stringify(activeWallet));
          window.localStorage.setItem('pc:wallet-active', activeWallet.address);
        } else {
          window.localStorage.removeItem('pc:wallet');
          window.localStorage.removeItem('pc:wallet-active');
        }
      } catch { /* storage can be unavailable in privacy modes */ }
      window.dispatchEvent(new CustomEvent('pc:wallet-change', { detail: activeWallet }));
    },
  );
  _tezos.setWalletProvider(_wallet);
  return { tezos: _tezos, wallet: _wallet };
}

async function walletReady(): Promise<BeaconWallet> {
  const { wallet } = getToolkit();
  await _activeAccountSubscription;
  return wallet;
}

async function ensurePointCastPermissions(wallet: BeaconWallet): Promise<string> {
  const existing = await wallet.client.getActiveAccount();
  if (existing && hasPointCastScopes(existing)) return existing.address;
  // Beacon cannot reliably upgrade an already-active partial permission set
  // in place (the old PointCast clients created operation-only and sign-only
  // accounts). Clear only the active selection, keep the pairing, and request
  // the canonical contract once.
  if (existing) await wallet.clearActiveAccount();
  const permissions = await wallet.client.requestPermissions({ scopes: POINTCAST_SCOPES } as any);
  return permissions.address;
}

/** The single PointCast Beacon wallet. Do not construct page-local clients. */
export async function pointCastWallet(): Promise<BeaconWallet> {
  return walletReady();
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
  const wallet = await walletReady();
  const account = await wallet.client.getActiveAccount();
  return account?.address ?? null;
}

/** Prompt the user to connect Kukai (or any Beacon-compatible wallet). */
export async function connectKukai(): Promise<string> {
  const wallet = await walletReady();
  const address = await ensurePointCastPermissions(wallet);
  // A connect action is also the single PointCast sign-in action. Existing
  // 30-day sessions return without another wallet prompt; first-time or newly
  // switched accounts approve one free message signature before this resolves.
  if (typeof window !== 'undefined') {
    const { ensurePointCastTezosLogin } = await import('./auth/client');
    await ensurePointCastTezosLogin(address);
  }
  return address;
}

/** Connect a Tezos wallet for gasless message signing only. */
export async function connectKukaiForSigning(): Promise<string> {
  const wallet = await walletReady();
  return ensurePointCastPermissions(wallet);
}

export async function disconnectKukai(): Promise<void> {
  const wallet = await walletReady();
  try {
    await wallet.clearActiveAccount();
  } catch { /* ignore */ }
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' });
    } catch { /* the local Beacon disconnect still succeeds offline */ }
  }
}

export async function signTezosPayload(message: string): Promise<{
  address: string;
  payload: string;
  signature: string;
  publicKey: string;
}> {
  const { wallet } = getToolkit();
  const address = await connectKukaiForSigning();
  const payload = michelineStringPayload(message);
  const { signature } = await wallet.client.requestSignPayload({
    signingType: 'micheline' as any,
    payload,
    sourceAddress: address,
  });
  const account = await wallet.client.getActiveAccount();
  if (!account?.publicKey) throw new Error('The connected wallet did not provide a public key.');
  if (getPkhfromPk(account.publicKey) !== address) {
    throw new Error('Wallet public key does not match the active address.');
  }
  if (!verifySignature(payload, account.publicKey, signature)) {
    throw new Error('Wallet returned a signature that could not be verified locally.');
  }
  return { address, payload, signature, publicKey: account.publicKey };
}

/**
 * Sign a portable PointCast message using Beacon's wallet-compatible
 * Micheline format. This is gasless and broadcasts no Tezos operation.
 */
export async function signTezosMichelineMessage(
  message: string,
  issuedAt = new Date().toISOString(),
  domain = POINTCAST_SIGNING_DOMAIN,
): Promise<{
  address: string;
  publicKey: string;
  issuedAt: string;
  domain: string;
  formattedMessage: string;
  payload: string;
  signature: string;
  verified: true;
}> {
  const { wallet } = getToolkit();
  const address = await connectKukaiForSigning();
  const account = await wallet.client.getActiveAccount();
  if (!account || account.address !== address) throw new Error('Beacon active account changed before signing.');
  if (!account.publicKey) throw new Error('The connected wallet did not provide a public key.');
  const derivedAddress = getPkhfromPk(account.publicKey);
  if (derivedAddress !== address) throw new Error('Wallet public key does not match the active address.');
  const { formattedMessage, payload } = tezosSignedMessage(message, issuedAt, domain);
  const { signature } = await wallet.client.requestSignPayload({
    signingType: 'micheline' as any,
    payload,
    sourceAddress: address,
  });
  if (!verifySignature(payload, account.publicKey, signature)) {
    throw new Error('Wallet returned a signature that could not be verified locally.');
  }
  return {
    address,
    publicKey: account.publicKey,
    issuedAt,
    domain,
    formattedMessage,
    payload,
    signature,
    verified: true,
  };
}

export function verifyTezosMichelineMessage(input: {
  message: string;
  issuedAt: string;
  domain?: string;
  address: string;
  publicKey: string;
  signature: string;
}): boolean {
  try {
    if (getPkhfromPk(input.publicKey) !== input.address) return false;
    const { payload } = tezosSignedMessage(input.message, input.issuedAt, input.domain);
    return verifySignature(payload, input.publicKey, input.signature);
  } catch {
    return false;
  }
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
