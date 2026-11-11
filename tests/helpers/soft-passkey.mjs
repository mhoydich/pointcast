// A software passkey for tests/chain-app-start.test.mjs and
// scripts/e2e-chain-app-start.mjs: a stand-in for navigator.credentials that
// makes a real P-256 key with WebCrypto and answers get() with a real WebAuthn
// assertion (authenticatorData with SHA-256 of the RP ID and the UP and UV
// flags, a clientDataJSON naming `origin`, an ECDSA P-256 signature), the shape
// a phone's authenticator returns. Nothing about it is weaker than a real one
// for what the chain checks (webauthn.rs); it simply lives in memory.
//
// Not a test file: the suites import it.

const enc = new TextEncoder();
const b64url = (bytes) => Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sha256 = async (bytes) => new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));

/**
 * `origin` is what the authenticator's browser would put in clientDataJSON.
 * `log` collects every call ({ op, rpId, challenge }) so a test can see what
 * the page asked for and when.
 */
export function softPasskey({ origin = 'https://pointcast.xyz', log = [] } = {}) {
  const creds = new Map();
  let counter = 0;
  return {
    log,
    creds,
    async create({ publicKey }) {
      log.push({ op: 'create', rpId: publicKey.rp.id, alg: publicKey.pubKeyCredParams.map((p) => p.alg), uv: publicKey.authenticatorSelection.userVerification });
      const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
      const spki = await crypto.subtle.exportKey('spki', pair.publicKey);
      const rawId = crypto.getRandomValues(new Uint8Array(16));
      creds.set(b64url(rawId), { pair, rpId: publicKey.rp.id });
      return { rawId: rawId.buffer, type: 'public-key', response: { getPublicKey: () => spki } };
    },
    async get({ publicKey }) {
      const want = (publicKey.allowCredentials || []).map((c) => b64url(new Uint8Array(c.id)));
      const id = want.find((w) => creds.has(w));
      log.push({ op: 'get', rpId: publicKey.rpId, challenge: b64url(new Uint8Array(publicKey.challenge)), uv: publicKey.userVerification });
      if (!id) throw Object.assign(new Error('The operation either timed out or was not allowed.'), { name: 'NotAllowedError' });
      const c = creds.get(id);
      if (c.rpId !== publicKey.rpId) throw Object.assign(new Error('rp id mismatch'), { name: 'SecurityError' });
      counter += 1;
      const ad = new Uint8Array(37);
      ad.set(await sha256(enc.encode(publicKey.rpId)), 0);
      ad[32] = 0x05; // UP | UV
      new DataView(ad.buffer).setUint32(33, counter);
      const cdj = enc.encode(JSON.stringify({ type: 'webauthn.get', challenge: b64url(new Uint8Array(publicKey.challenge)), origin, crossOrigin: false }));
      const msg = new Uint8Array([...ad, ...(await sha256(cdj))]);
      const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, c.pair.privateKey, msg));
      return { rawId: Buffer.from(id, 'base64url'), type: 'public-key', response: { authenticatorData: ad.buffer, clientDataJSON: cdj.buffer, signature: sig.buffer } };
    },
  };
}
