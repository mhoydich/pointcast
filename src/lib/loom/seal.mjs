/**
 * Sealed messages — end-to-end encrypted DMs on the public Loom.
 *
 * A sealed message is still an ordinary append to an inbox (@handle, agent:,
 * wallet, did:), so everyone can see that something was sent, by whom, to whom
 * and when. Only the content is hidden. The server never sees a private key or
 * a plaintext; it checks the envelope's shape and that it is addressed to keys
 * published for the inbox.
 *
 * Keys are ECDH P-256 (the curve every browser's WebCrypto supports). A
 * message is encrypted once with a fresh AES-256-GCM content key; that content
 * key is wrapped for each recipient key (up to four: the inbox, plus usually a
 * copy for the sender) with AES-256-GCM under a key derived by HKDF-SHA-256
 * from an ephemeral ECDH agreement. The kid and the envelope version are bound
 * into the wrap as associated data.
 *
 *   envelope = { v:1, alg, iv, ct, to:[{ kid, epk:{kty,crv,x,y}, iv, wk }] }
 *
 * Runs unchanged in browsers, Workers and Node 20+ (globalThis.crypto.subtle).
 */
export const SEAL_ALG = 'ECDH-ES+HKDF-SHA256/A256GCM';
export const SEAL_MAX_RECIPIENTS = 4;
export const SEAL_MAX_PLAINTEXT = 2000;
const INFO = 'pointcast.loom/seal/v1';

const enc = new TextEncoder();
const dec = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;

export function b64u(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unb64u(text) {
  const s = String(text).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** Only the public coordinates, in a fixed order, so the same key always hashes the same. */
export function publicJwk(jwk) {
  return { kty: 'EC', crv: 'P-256', x: String(jwk?.x ?? ''), y: String(jwk?.y ?? '') };
}

/** kid = k_ + first 16 hex of SHA-256 over the canonical public JWK. */
export async function keyId(jwk) {
  const p = publicJwk(jwk);
  const digest = await subtle().digest('SHA-256', enc.encode(JSON.stringify(p)));
  return `k_${[...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/** A human-checkable fingerprint: the kid's hex in four groups. */
export const fingerprint = (kid) => String(kid).slice(2).match(/.{1,4}/g)?.join(' ') ?? '';

export async function generateKeyPair() {
  const pair = await subtle().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const [pub, priv] = await Promise.all([subtle().exportKey('jwk', pair.publicKey), subtle().exportKey('jwk', pair.privateKey)]);
  const publicKey = publicJwk(pub);
  return { kid: await keyId(publicKey), publicKey, privateKey: { ...publicKey, d: priv.d } };
}

const importPublic = (jwk) => subtle().importKey('jwk', { ...publicJwk(jwk), ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
const importPrivate = (jwk) => subtle().importKey('jwk', { ...publicJwk(jwk), d: jwk.d, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);

async function wrappingKey(privateKey, publicKey, kid, usage) {
  const shared = await subtle().deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256);
  const ikm = await subtle().importKey('raw', shared, 'HKDF', false, ['deriveKey']);
  return subtle().deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(`${INFO}/${kid}`) },
    ikm, { name: 'AES-GCM', length: 256 }, false, [usage]);
}

/**
 * Seal `plaintext` for each recipient { kid, publicKey }. Returns the envelope
 * to send as `sealed` in an append.
 */
export async function seal(plaintext, recipients) {
  const text = String(plaintext ?? '');
  if (!text) throw new Error('seal_empty');
  if (text.length > SEAL_MAX_PLAINTEXT) throw new Error('seal_too_long');
  const list = (recipients ?? []).filter((r, i, all) => all.findIndex((o) => o.kid === r.kid) === i);
  if (!list.length || list.length > SEAL_MAX_RECIPIENTS) throw new Error('seal_recipients');
  const cekRaw = crypto.getRandomValues(new Uint8Array(32));
  const cek = await subtle().importKey('raw', cekRaw, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle().encrypt({ name: 'AES-GCM', iv }, cek, enc.encode(text));
  const to = [];
  for (const r of list) {
    const eph = await subtle().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const kek = await wrappingKey(eph.privateKey, await importPublic(r.publicKey), r.kid, 'encrypt');
    const wiv = crypto.getRandomValues(new Uint8Array(12));
    const wk = await subtle().encrypt({ name: 'AES-GCM', iv: wiv, additionalData: enc.encode(`${INFO}/${r.kid}`) }, kek, cekRaw);
    to.push({ kid: r.kid, epk: publicJwk(await subtle().exportKey('jwk', eph.publicKey)), iv: b64u(wiv), wk: b64u(wk) });
  }
  return { v: 1, alg: SEAL_ALG, iv: b64u(iv), ct: b64u(ct), to };
}

/** Open an envelope with one of your keys { kid, privateKey }. Returns the plaintext or throws. */
export async function open(envelope, { kid, privateKey }) {
  const slot = envelope?.to?.find((t) => t.kid === kid);
  if (!slot) throw new Error('seal_not_for_this_key');
  const kek = await wrappingKey(await importPrivate(privateKey), await importPublic(slot.epk), kid, 'decrypt');
  const cekRaw = await subtle().decrypt({ name: 'AES-GCM', iv: unb64u(slot.iv), additionalData: enc.encode(`${INFO}/${kid}`) }, kek, unb64u(slot.wk));
  const cek = await subtle().importKey('raw', cekRaw, 'AES-GCM', false, ['decrypt']);
  return dec.decode(await subtle().decrypt({ name: 'AES-GCM', iv: unb64u(envelope.iv) }, cek, unb64u(envelope.ct)));
}

const B64U = /^[A-Za-z0-9_-]+$/;
const KID = /^k_[0-9a-f]{16}$/;
// AES-GCM adds a 16-byte tag; 2000 UTF-16 chars is at most 6000 UTF-8 bytes.
const CT_MAX = Math.ceil(((SEAL_MAX_PLAINTEXT * 3 + 16) * 4) / 3);

/**
 * Server-side shape check. Returns a clean copy (only known fields) or throws
 * an Error whose message is the refusal code. It cannot and does not check
 * that the ciphertext decrypts.
 */
export function checkEnvelope(raw) {
  const e = raw && typeof raw === 'object' ? raw : null;
  if (!e || e.v !== 1 || e.alg !== SEAL_ALG) throw new Error('sealed_version');
  const b = (s, min, max) => typeof s === 'string' && s.length >= min && s.length <= max && B64U.test(s);
  if (!b(e.iv, 16, 16)) throw new Error('sealed_iv');
  if (!b(e.ct, 22, CT_MAX)) throw new Error('sealed_ciphertext');
  if (!Array.isArray(e.to) || !e.to.length || e.to.length > SEAL_MAX_RECIPIENTS) throw new Error('sealed_recipients');
  const to = e.to.map((t) => {
    if (!t || !KID.test(t.kid)) throw new Error('sealed_kid');
    const epk = t.epk ?? {};
    if (epk.kty !== 'EC' || epk.crv !== 'P-256' || !b(epk.x, 43, 43) || !b(epk.y, 43, 43)) throw new Error('sealed_epk');
    if (!b(t.iv, 16, 16) || !b(t.wk, 64, 64)) throw new Error('sealed_wrap');
    return { kid: t.kid, epk: publicJwk(epk), iv: t.iv, wk: t.wk };
  });
  if (new Set(to.map((t) => t.kid)).size !== to.length) throw new Error('sealed_recipients');
  return { v: 1, alg: SEAL_ALG, iv: e.iv, ct: e.ct, to };
}

/** Is this a P-256 public JWK with well-formed coordinates? */
export function checkPublicKey(jwk) {
  const p = publicJwk(jwk);
  return jwk?.kty === 'EC' && jwk?.crv === 'P-256' && /^[A-Za-z0-9_-]{43}$/.test(p.x) && /^[A-Za-z0-9_-]{43}$/.test(p.y) && !('d' in jwk);
}
