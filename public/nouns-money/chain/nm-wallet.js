// The passkey wallet Nouns Money shares with /chain/first-mints/.
//
// Same storage key ("pc-fm-live:devnet-2"), same WebAuthn parameters and the
// same pcp1 address derivation as public/chain/first-mints/live.js, so a
// visitor who made a First Mints wallet collects with it, and a wallet made
// here works there (tests/nouns-money-chain-client.test.mjs holds the two
// files to the same parameters). The browser stores only the public key and
// credential id; the private key never leaves the passkey.
import { bytesToHex, passkeyAddress } from '../../chain/first-mints/lib/pointcast-chain.js';

export const WALLET_KEY = 'pc-fm-live:devnet-2';

export function loadWallet(storage = globalThis.localStorage, key = WALLET_KEY) {
  try {
    const w = JSON.parse(storage.getItem(key) || 'null');
    if (w && typeof w.address === 'string' && w.publicKey && typeof w.credentialId === 'string') return w;
  } catch {
    /* private window or blocked storage: no remembered wallet */
  }
  return null;
}

export function saveWallet(wallet, storage = globalThis.localStorage, key = WALLET_KEY) {
  try {
    storage.setItem(key, JSON.stringify(wallet));
  } catch {
    /* private window: the passkey still exists, only this browser forgets its id */
  }
}

/** The WebAuthn create() options: identical to First Mints. */
export function createOptions(rpId) {
  return {
    publicKey: {
      rp: { id: rpId, name: 'PointCast' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'devnet-2 wallet', displayName: 'PointCast devnet-2' },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
      timeout: 60000,
    },
  };
}

/** A wallet from a created credential: compressed P-256 key, base64url id, pcp1 address. */
export function walletFromCredential(cred) {
  const spki = new Uint8Array(cred.response.getPublicKey());
  const point = spki.slice(spki.length - 65); // 04 ‖ X ‖ Y
  if (point[0] !== 4) throw new Error('unexpected public key format');
  const compressed = new Uint8Array(33);
  compressed[0] = point[64] & 1 ? 3 : 2;
  compressed.set(point.slice(1, 33), 1);
  const publicKey = { scheme: 'p256', bytes: bytesToHex(compressed) };
  const rawId = new Uint8Array(cred.rawId);
  const credentialId = btoa(String.fromCharCode(...rawId)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { publicKey, credentialId, address: passkeyAddress(publicKey) };
}

export async function createWallet(rpId, credentials = navigator.credentials) {
  const cred = await credentials.create(createOptions(rpId));
  return walletFromCredential(cred);
}
