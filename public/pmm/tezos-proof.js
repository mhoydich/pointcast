// PMM: prove that a PMM identity controls a Tezos tz1 address, and check that proof on the other
// phone, with no wallet library and no network. The payer's wallet signs one line,
// "PMM xtz v1 <pmm id> <tz1…>", as a Tezos signed message; the payee's phone checks that the
// public key hashes to that address and that the signature is valid. A friend can then only
// name an address as theirs if they hold its key.
//
// tz1 (ed25519) only: WebCrypto verifies Ed25519, and that is what Kukai and Temple create by
// default. tz2 / tz3 / tz4 are refused rather than half-supported.
// Pieces: base58check (SHA-256, WebCrypto), BLAKE2b (RFC 7693, below), Ed25519 (WebCrypto).
// tests/pmm-settle.test.mjs cross-checks every function here against @taquito/utils.

export const PROOF_DOMAIN = 'pointcast.xyz/pmm';
export const proofMessage = (pmmId, addr) => `PMM xtz v1 ${pmmId} ${addr}`;

const P = { tz1: [6, 161, 159], edpk: [13, 15, 37, 217], edsig: [9, 245, 205, 134, 18], sig: [4, 130, 43] };
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const enc = new TextEncoder();
const subtle = () => globalThis.crypto.subtle;

async function sha256d(bytes) { return new Uint8Array(await subtle().digest('SHA-256', await subtle().digest('SHA-256', bytes))); }
function b58decode(s) {
  if (typeof s !== 'string' || !s.length || s.length > 120) return null;
  let n = 0n;
  for (const ch of s) { const v = ALPHABET.indexOf(ch); if (v < 0) return null; n = n * 58n + BigInt(v); }
  const out = []; while (n > 0n) { out.unshift(Number(n & 255n)); n >>= 8n; }
  for (const ch of s) { if (ch !== '1') break; out.unshift(0); }
  return new Uint8Array(out);
}
function b58encode(bytes) {
  let n = 0n; for (const b of bytes) n = (n << 8n) | BigInt(b);
  let s = ''; while (n > 0n) { s = ALPHABET[Number(n % 58n)] + s; n /= 58n; }
  for (const b of bytes) { if (b !== 0) break; s = '1' + s; }
  return s;
}
/** Decode base58check and strip an expected prefix; null on any mismatch. */
async function unprefix(s, prefix, len) {
  const raw = b58decode(s); if (!raw || raw.length !== prefix.length + len + 4) return null;
  const body = raw.slice(0, -4), sum = (await sha256d(body)).slice(0, 4);
  if (!sum.every((b, i) => b === raw[raw.length - 4 + i])) return null;
  if (!prefix.every((b, i) => b === body[i])) return null;
  return body.slice(prefix.length);
}
async function withPrefix(prefix, bytes) {
  const body = new Uint8Array([...prefix, ...bytes]);
  return b58encode(new Uint8Array([...body, ...(await sha256d(body)).slice(0, 4)]));
}

// ---- BLAKE2b (RFC 7693), unkeyed, 64-bit words as BigInt for clarity over speed ----
const M64 = (1n << 64n) - 1n;
const IV = [0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n, 0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n];
const SIGMA = [[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],[14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3],[11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4],[7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8],[9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13],[2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9],[12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11],[13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10],[6,15,14,9,11,3,0,8,12,2,13,7,1,4,10,5],[10,2,8,4,7,6,1,5,15,11,9,14,3,12,13,0]];
const rotr = (x, n) => ((x >> n) | (x << (64n - n))) & M64;
function compress(h, block, t, last) {
  const m = []; for (let i = 0; i < 16; i++) { let w = 0n; for (let b = 7; b >= 0; b--) w = (w << 8n) | BigInt(block[i * 8 + b]); m.push(w); }
  const v = [...h, ...IV]; v[12] ^= t & M64; v[13] ^= (t >> 64n) & M64; if (last) v[14] ^= M64;
  const G = (a, b, c, d, x, y) => {
    v[a] = (v[a] + v[b] + x) & M64; v[d] = rotr(v[d] ^ v[a], 32n); v[c] = (v[c] + v[d]) & M64; v[b] = rotr(v[b] ^ v[c], 24n);
    v[a] = (v[a] + v[b] + y) & M64; v[d] = rotr(v[d] ^ v[a], 16n); v[c] = (v[c] + v[d]) & M64; v[b] = rotr(v[b] ^ v[c], 63n);
  };
  for (let r = 0; r < 12; r++) {
    const s = SIGMA[r % 10];
    G(0, 4, 8, 12, m[s[0]], m[s[1]]); G(1, 5, 9, 13, m[s[2]], m[s[3]]); G(2, 6, 10, 14, m[s[4]], m[s[5]]); G(3, 7, 11, 15, m[s[6]], m[s[7]]);
    G(0, 5, 10, 15, m[s[8]], m[s[9]]); G(1, 6, 11, 12, m[s[10]], m[s[11]]); G(2, 7, 8, 13, m[s[12]], m[s[13]]); G(3, 4, 9, 14, m[s[14]], m[s[15]]);
  }
  for (let i = 0; i < 8; i++) h[i] ^= v[i] ^ v[i + 8];
}
export function blake2b(input, outLen) {
  const h = [...IV]; h[0] ^= 0x01010000n ^ BigInt(outLen);
  const blocks = Math.max(1, Math.ceil(input.length / 128));
  for (let i = 0; i < blocks; i++) {
    const block = new Uint8Array(128); block.set(input.subarray(i * 128, i * 128 + 128));
    const last = i === blocks - 1; compress(h, block, BigInt(last ? input.length : (i + 1) * 128), last);
  }
  const out = new Uint8Array(outLen);
  for (let i = 0; i < outLen; i++) out[i] = Number((h[i >> 3] >> BigInt(8 * (i & 7))) & 255n);
  return out;
}

const hexOf = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
const bytesOf = (hex) => new Uint8Array((hex.match(/../g) || []).map((x) => parseInt(x, 16)));

/** The Micheline payload a Tezos wallet signs for "Tezos Signed Message: <domain> <at> <message>". */
export function signedMessagePayload(message, at, domain = PROOF_DOMAIN) {
  const text = enc.encode(['Tezos Signed Message:', domain, at, message].join(' '));
  return '0501' + text.length.toString(16).padStart(8, '0') + hexOf(text);
}
/** tz1 address of an edpk public key, or null. */
export async function tz1OfPk(pk) {
  const raw = await unprefix(pk, P.edpk, 32); if (!raw) return null;
  return withPrefix(P.tz1, blake2b(raw, 20));
}
/** Verify an ed25519 Tezos signature (edsig… or sig…) over a hex payload with an edpk key. */
export async function verifyEd25519(payloadHex, pk, sig) {
  try {
    const key = await unprefix(pk, P.edpk, 32); if (!key) return false;
    const s = (await unprefix(sig, P.edsig, 64)) || (await unprefix(sig, P.sig, 64)); if (!s) return false;
    const ck = await subtle().importKey('raw', key, { name: 'Ed25519' }, false, ['verify']);
    return await subtle().verify({ name: 'Ed25519' }, ck, s, blake2b(bytesOf(payloadHex), 32));
  } catch (_) { return false; }
}
/**
 * The proof that `pmmId` holds `addr`: { addr, pk, sig, at }. True only when addr is a tz1 that the
 * key hashes to and the signature over "PMM xtz v1 <pmmId> <addr>" (at time `at`) verifies.
 */
export async function verifyAddressProof(pmmId, proof) {
  if (!proof || typeof proof !== 'object') return false;
  const { addr, pk, sig, at } = proof;
  if (typeof addr !== 'string' || !/^tz1[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr)) return false;
  if (typeof at !== 'string' || !/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(at) || typeof pmmId !== 'string' || !/^[0-9a-f]{16,128}$/.test(pmmId)) return false;
  if ((await tz1OfPk(pk)) !== addr) return false;
  return verifyEd25519(signedMessagePayload(proofMessage(pmmId, addr), at), pk, sig);
}
