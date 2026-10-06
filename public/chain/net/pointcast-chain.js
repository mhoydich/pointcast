// pointcast-chain.js: a zero-dependency ES module for galleries and desks
// that read drops (editions) from pointcast-chain, check ownership claims
// offline, and have a Tezos wallet (Kukai / Temple via Beacon) sign txs.
//
// Works in browsers and Node 20+. No build step: vendor this one file.
//
//   import * as pcc from "./pointcast-chain.js";
//   const chain = await pcc.connect("http://127.0.0.1:8545", { expect: { genesisHash } });
//   const drop = await chain.getDrop("coffee-mug-0");
//   const h = await chain.getHoldings("tz1...");          // h.verification.verifiedHolder
//   const tx = await chain.buildDropMint({ sender, dropId, recipient });
//   const prepared = await chain.digest(tx);               // node digest == local rebuild, or it throws
//   const signed = await chain.signWithBeacon(dAppClient, prepared);
//   const { txHash } = await chain.submit(signed);
//   await chain.waitForTx(txHash);
//
// Every hash and encoding here mirrors crates/chain-core byte for byte; the
// vectors in sdk/test/vectors.json are generated from Rust and checked by
// `node --test sdk/test` (and the Rust side refuses to drift from them).
// sdk/test/wasm-vectors.json (scripts/sdk-wasm-vectors.mjs) adds every live
// kind 1-12 and launch-tail params, cross-checked against the committed
// verifier wasm, including whole blocks it accepted.
//
// v0.2 adds: encoders for every live kind (1-12), KIND_REGISTRY, the wide
// mandate mask, params/v2 (launch records), describeTx (plain-words prompt
// cards), parseSse + liveStream (pointcast-wire/v1), exact JSON
// (parseJsonExact / stringifyJsonExact: u64 never goes through a double).
// Town Network `keys` adds rotate_sequencer (tag 13), launch record 2 in
// paramsHash, and wallet text v2 (walletText(tx, domain, 2): the amounts and
// targets a person must see, rebuilt from the tx). Town Network `stations`
// (batch 6) adds time capsules and stations (tags 14-17), launch record 13
// in paramsHash, and capsuleCommitment / capsuleId (what a seal commits to).
//
// Trust model: the SDK never signs or shows a payload it did not rebuild
// itself from the tx and the pinned chain domain (chain id + genesis hash).
// Ownership is "verified" only when a claim's Merkle path reaches a state
// root sealed by the sequencer key in params that hash to the genesis you
// pinned. Claims from a --dev chain are flagged: anyone can forge them.

const te = new TextEncoder();

// ---------------------------------------------------------------- bytes

export function bytesToHex(b) {
  let s = "";
  for (const x of b) s += x.toString(16).padStart(2, "0");
  return s;
}

export function hexToBytes(h) {
  if (typeof h !== "string" || h.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(h)) {
    throw new TypeError("expected an even-length hex string");
  }
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

function concat(...parts) {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function utf8(s) {
  return te.encode(s);
}

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

// ---------------------------------------------------------------- BLAKE2b (RFC 7693)

const B2B_IV32 = new Uint32Array([
  0xf3bcc908, 0x6a09e667, 0x84caa73b, 0xbb67ae85, 0xfe94f82b, 0x3c6ef372, 0x5f1d36f1, 0xa54ff53a,
  0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c, 0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19,
]);
const SIGMA = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
  11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4,
  7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8,
  9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13,
  2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9,
  12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11,
  13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10,
  6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5,
  10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
].map((x) => x * 2);

function b2bCompress(ctx, last) {
  const v = new Uint32Array(32);
  const m = new Uint32Array(32);
  for (let i = 0; i < 16; i++) {
    v[i] = ctx.h[i];
    v[i + 16] = B2B_IV32[i];
  }
  v[24] ^= ctx.t;
  v[25] ^= ctx.t / 0x100000000;
  if (last) {
    v[28] = ~v[28];
    v[29] = ~v[29];
  }
  for (let i = 0; i < 32; i++) {
    const j = 4 * i;
    m[i] = ctx.b[j] ^ (ctx.b[j + 1] << 8) ^ (ctx.b[j + 2] << 16) ^ (ctx.b[j + 3] << 24);
  }
  const add64aa = (a, b) => {
    const o0 = v[a] + v[b];
    let o1 = v[a + 1] + v[b + 1];
    if (o0 >= 0x100000000) o1++;
    v[a] = o0;
    v[a + 1] = o1;
  };
  const add64ac = (a, b0, b1) => {
    const o0 = v[a] + b0;
    let o1 = v[a + 1] + b1;
    if (o0 >= 0x100000000) o1++;
    v[a] = o0;
    v[a + 1] = o1;
  };
  const g = (a, b, c, d, ix, iy) => {
    const x0 = m[ix], x1 = m[ix + 1], y0 = m[iy], y1 = m[iy + 1];
    add64aa(a, b);
    add64ac(a, x0, x1);
    let xor0 = v[d] ^ v[a], xor1 = v[d + 1] ^ v[a + 1];
    v[d] = xor1;
    v[d + 1] = xor0;
    add64aa(c, d);
    xor0 = v[b] ^ v[c];
    xor1 = v[b + 1] ^ v[c + 1];
    v[b] = (xor0 >>> 24) ^ (xor1 << 8);
    v[b + 1] = (xor1 >>> 24) ^ (xor0 << 8);
    add64aa(a, b);
    add64ac(a, y0, y1);
    xor0 = v[d] ^ v[a];
    xor1 = v[d + 1] ^ v[a + 1];
    v[d] = (xor0 >>> 16) ^ (xor1 << 16);
    v[d + 1] = (xor1 >>> 16) ^ (xor0 << 16);
    add64aa(c, d);
    xor0 = v[b] ^ v[c];
    xor1 = v[b + 1] ^ v[c + 1];
    v[b] = (xor1 >>> 31) ^ (xor0 << 1);
    v[b + 1] = (xor0 >>> 31) ^ (xor1 << 1);
  };
  for (let r = 0; r < 12; r++) {
    const s = r * 16;
    g(0, 8, 16, 24, SIGMA[s], SIGMA[s + 1]);
    g(2, 10, 18, 26, SIGMA[s + 2], SIGMA[s + 3]);
    g(4, 12, 20, 28, SIGMA[s + 4], SIGMA[s + 5]);
    g(6, 14, 22, 30, SIGMA[s + 6], SIGMA[s + 7]);
    g(0, 10, 20, 30, SIGMA[s + 8], SIGMA[s + 9]);
    g(2, 12, 22, 24, SIGMA[s + 10], SIGMA[s + 11]);
    g(4, 14, 16, 26, SIGMA[s + 12], SIGMA[s + 13]);
    g(6, 8, 18, 28, SIGMA[s + 14], SIGMA[s + 15]);
  }
  for (let i = 0; i < 16; i++) ctx.h[i] = ctx.h[i] ^ v[i] ^ v[i + 16];
}

/** BLAKE2b (unkeyed) of the concatenated `parts`, `outlen` bytes (1..64). */
export function blake2b(parts, outlen = 32) {
  const ctx = { b: new Uint8Array(128), h: new Uint32Array(B2B_IV32), t: 0, c: 0 };
  ctx.h[0] ^= 0x01010000 ^ outlen;
  for (const p of Array.isArray(parts) ? parts : [parts]) {
    for (let i = 0; i < p.length; i++) {
      if (ctx.c === 128) {
        ctx.t += ctx.c;
        b2bCompress(ctx, false);
        ctx.c = 0;
      }
      ctx.b[ctx.c++] = p[i];
    }
  }
  ctx.t += ctx.c;
  while (ctx.c < 128) ctx.b[ctx.c++] = 0;
  b2bCompress(ctx, true);
  const out = new Uint8Array(outlen);
  for (let i = 0; i < outlen; i++) out[i] = ctx.h[i >> 2] >> (8 * (i & 3));
  return out;
}

const blake2b256 = (...parts) => blake2b(parts, 32);

// ---------------------------------------------------------------- SHA-256 (base58check only)

const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/** SHA-256 (synchronous; used for base58check). */
export function sha256(msg) {
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const len = msg.length;
  const padLen = Math.ceil((len + 9) / 64) * 64;
  const p = new Uint8Array(padLen);
  p.set(msg);
  p[len] = 0x80;
  const dv = new DataView(p.buffer);
  dv.setUint32(padLen - 8, Math.floor((len * 8) / 0x100000000));
  dv.setUint32(padLen - 4, (len * 8) >>> 0);
  const W = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padLen; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + 4 * i);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const mj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + mj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d;
    H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) odv.setUint32(4 * i, H[i]);
  return out;
}

// ---------------------------------------------------------------- base58check

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function b58encode(bytes) {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  let s = "";
  while (n > 0n) {
    s = B58[Number(n % 58n)] + s;
    n /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    s = "1" + s;
  }
  return s;
}

export function b58decode(str) {
  let n = 0n;
  for (const ch of str) {
    const i = B58.indexOf(ch);
    if (i < 0) return null;
    n = n * 58n + BigInt(i);
  }
  const out = [];
  while (n > 0n) {
    out.unshift(Number(n & 0xffn));
    n >>= 8n;
  }
  for (const ch of str) {
    if (ch !== "1") break;
    out.unshift(0);
  }
  return new Uint8Array(out);
}

export function b58checkEncode(payload) {
  return b58encode(concat(payload, sha256(sha256(payload)).subarray(0, 4)));
}

/** The payload of a base58check string, or null if malformed. */
export function b58checkDecode(str) {
  if (typeof str !== "string" || str.length === 0) return null;
  const raw = b58decode(str);
  if (!raw || raw.length < 4) return null;
  const payload = raw.subarray(0, raw.length - 4);
  const sum = sha256(sha256(payload)).subarray(0, 4);
  return equalBytes(sum, raw.subarray(raw.length - 4)) ? payload : null;
}

// ---------------------------------------------------------------- addresses and keys

const PREFIX = {
  tz1: [6, 161, 159],
  tz2: [6, 161, 161],
  tz3: [6, 161, 164],
  tz4: [6, 161, 166],
  KT1: [2, 90, 121],
  edpk: [13, 15, 37, 217],
  sppk: [3, 254, 226, 86],
  p2pk: [3, 178, 139, 127],
  edsig: [9, 245, 205, 134, 18],
  spsig1: [13, 115, 101, 19, 63],
  sig: [4, 130, 43],
};
const AGENT_PREFIX = "pca1";
/** A passkey account (launch record 7): "pcp1" ‖ b58check(blake2b-160(33-byte P-256 key)). */
export const PASSKEY_PREFIX = "pcp1";
const startsWith = (b, pre) => pre.every((x, i) => b[i] === x);

/**
 * `tz1` | `tz2` | `agent` | `passkey` for addresses pointcast-chain accepts,
 * else null. (A `passkey` pcp1 exists only on chains with launch record 7.)
 */
export function addressKind(a) {
  if (typeof a !== "string") return null;
  if (a.length > 64) return null; // crypto.rs MAX_ADDRESS_LEN: refused before base58
  if (a.startsWith(AGENT_PREFIX)) {
    const v = b58checkDecode(a.slice(AGENT_PREFIX.length));
    return v && v.length === 20 ? "agent" : null;
  }
  if (a.startsWith(PASSKEY_PREFIX)) {
    const v = b58checkDecode(a.slice(PASSKEY_PREFIX.length));
    return v && v.length === 20 ? "passkey" : null;
  }
  if (!(a.startsWith("tz1") || a.startsWith("tz2"))) return null;
  const v = b58checkDecode(a);
  if (!v || v.length !== 23) return null;
  if (startsWith(v, PREFIX.tz1)) return "tz1";
  if (startsWith(v, PREFIX.tz2)) return "tz2";
  return null;
}

export const isAddress = (a) => addressKind(a) !== null;

/**
 * Can a Tezos buyer at `addr` receive a pointcast-chain certificate?
 * `ok` (tz1/tz2: same key on both chains), `needs_tz1_tz2` (tz3/tz4),
 * `contract_no_certificate` (KT1, e.g. a multisig), `agent` (a pca1, not a
 * Tezos address) or `invalid`. Same answers as the Rust mirror.
 */
export function recipientStatus(addr) {
  const k = addressKind(addr);
  if (k === "tz1" || k === "tz2") return "ok";
  if (k === "agent") return "agent";
  if (typeof addr === "string" && addr.startsWith("KT1")) return "contract_no_certificate";
  if (typeof addr === "string" && (addr.startsWith("tz3") || addr.startsWith("tz4"))) return "needs_tz1_tz2";
  return "invalid";
}

/** Key scheme bytes (crypto.rs Scheme): ed25519 0, secp256k1 1, p256 2 (a passkey). */
const SCHEMES = Object.freeze({ ed25519: 0, secp256k1: 1, p256: 2 });

/** The canonical byte of a key scheme name. */
export function schemeByte(scheme) {
  if (typeof scheme !== "string" || !Object.hasOwn(SCHEMES, scheme)) throw new Error(`unknown key scheme ${JSON.stringify(scheme)}`);
  return SCHEMES[scheme];
}

/**
 * `{scheme, bytes}` from that object form or a base58 `edpk…` / `sppk…` /
 * `p2pk…` (a passkey's compressed P-256 key, scheme `p256`).
 */
export function parsePublicKey(pk) {
  if (pk && typeof pk === "object") {
    const scheme = pk.scheme;
    const bytes = String(pk.bytes || "").toLowerCase();
    const want = scheme === "ed25519" ? 64 : scheme === "secp256k1" || scheme === "p256" ? 66 : 0;
    if (!want || bytes.length !== want || !/^[0-9a-f]+$/.test(bytes)) throw new Error("bad public key object");
    if (scheme === "p256" && !isP256Key(bytes)) throw new Error("bad public key object: a p256 key is a 33-byte compressed SEC1 point on the curve");
    return { scheme, bytes };
  }
  const v = b58checkDecode(pk);
  if (v && v.length === 36 && startsWith(v, PREFIX.edpk)) return { scheme: "ed25519", bytes: bytesToHex(v.subarray(4)) };
  if (v && v.length === 37 && startsWith(v, PREFIX.sppk)) return { scheme: "secp256k1", bytes: bytesToHex(v.subarray(4)) };
  if (v && v.length === 37 && startsWith(v, PREFIX.p2pk) && isP256Key(v.subarray(4))) {
    return { scheme: "p256", bytes: bytesToHex(v.subarray(4)) };
  }
  throw new Error("public key: expected edpk, sppk or p2pk");
}

export function publicKeyToB58(pk) {
  const k = parsePublicKey(pk);
  const pre = { ed25519: PREFIX.edpk, secp256k1: PREFIX.sppk, p256: PREFIX.p2pk }[k.scheme];
  return b58checkEncode(concat(Uint8Array.from(pre), hexToBytes(k.bytes)));
}

/**
 * The human address a public key controls: tz1 (ed25519), tz2 (secp256k1),
 * or for a passkey's p256 key its pcp1 address (crypto.rs tezos_address).
 */
export function tezosAddress(pk) {
  const k = parsePublicKey(pk);
  if (k.scheme === "p256") return passkeyAddress(k);
  const pre = k.scheme === "ed25519" ? PREFIX.tz1 : PREFIX.tz2;
  return b58checkEncode(concat(Uint8Array.from(pre), blake2b(hexToBytes(k.bytes), 20)));
}

/** The pcp1 address of a passkey's 33-byte compressed P-256 key (webauthn.rs passkey_address). */
export function passkeyAddress(pk) {
  const k = parsePublicKey(pk);
  if (k.scheme !== "p256") throw new Error("passkeys are p256");
  return PASSKEY_PREFIX + b58checkEncode(blake2b(hexToBytes(k.bytes), 20));
}

/** The pca1 agent address of an ed25519 key. */
export function agentAddress(pk) {
  const k = parsePublicKey(pk);
  if (k.scheme !== "ed25519") throw new Error("agents are ed25519");
  return AGENT_PREFIX + b58checkEncode(blake2b(hexToBytes(k.bytes), 20));
}

/** `{bytes: hex, scheme|null}` from 128 hex chars or base58 edsig/spsig1/sig. */
export function parseSignature(s) {
  if (typeof s === "string" && s.length === 128 && /^[0-9a-fA-F]+$/.test(s)) return { bytes: s.toLowerCase(), scheme: null };
  const v = b58checkDecode(s);
  if (v && v.length === 69 && startsWith(v, PREFIX.edsig)) return { bytes: bytesToHex(v.subarray(5)), scheme: "ed25519" };
  if (v && v.length === 69 && startsWith(v, PREFIX.spsig1)) return { bytes: bytesToHex(v.subarray(5)), scheme: "secp256k1" };
  if (v && v.length === 67 && startsWith(v, PREFIX.sig)) return { bytes: bytesToHex(v.subarray(3)), scheme: null };
  throw new Error("signature: expected 128 hex chars, edsig, spsig1 or sig");
}

export function signatureToB58(sigHex, scheme) {
  return b58checkEncode(concat(Uint8Array.from(scheme === "ed25519" ? PREFIX.edsig : PREFIX.spsig1), hexToBytes(sigHex)));
}

// ---------------------------------------------------------------- canonical encoding (codec.rs)

class Enc {
  constructor() {
    this.parts = [];
  }
  u8(v) {
    if (!Number.isInteger(v) || v < 0 || v > 255) throw new RangeError("u8 out of range");
    this.parts.push(Uint8Array.of(v));
    return this;
  }
  u16(v) {
    if (!Number.isInteger(v) || v < 0 || v > 0xffff) throw new RangeError("u16 out of range");
    this.parts.push(Uint8Array.of(v >> 8, v & 0xff));
    return this;
  }
  u32(v) {
    if (!Number.isInteger(v) || v < 0 || v > 0xffffffff) throw new RangeError("u32 out of range");
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, v);
    this.parts.push(b);
    return this;
  }
  u64(v) {
    const n = toU64(v);
    const b = new Uint8Array(8);
    new DataView(b.buffer).setBigUint64(0, n);
    this.parts.push(b);
    return this;
  }
  fixed(b) {
    this.parts.push(b);
    return this;
  }
  bytes(b) {
    return this.u32(b.length).fixed(b);
  }
  str(s) {
    if (typeof s !== "string") throw new TypeError("expected a string");
    return this.bytes(utf8(s));
  }
  optStr(s) {
    return s === null || s === undefined ? this.u8(0) : this.u8(1).str(s);
  }
  finish() {
    return concat(...this.parts);
  }
}

function toU64(v) {
  let n;
  if (typeof v === "bigint") n = v;
  else if (typeof v === "number") {
    if (!Number.isSafeInteger(v)) throw new RangeError(`u64: ${v} is not a safe integer (pass a bigint or string)`);
    n = BigInt(v);
  } else if (typeof v === "string" && /^[0-9]+$/.test(v)) n = BigInt(v);
  else throw new TypeError("u64: expected a non-negative integer");
  if (n < 0n || n > 0xffffffffffffffffn) throw new RangeError("u64 out of range");
  return n;
}

function hash32(h) {
  const b = hexToBytes(h);
  if (b.length !== 32) throw new Error("expected a 32-byte hex hash");
  return b;
}

/** Bytewise order, like Rust's BTreeMap<String, _> (JS objects put "9" before "10"). */
function byteOrder(a, b) {
  const x = utf8(a), y = utf8(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i] - y[i];
  return x.length - y.length;
}

/** Live tx kinds → tag (the first byte of the canonical TxKind encoding, and bit `1 << tag` in a mandate mask). */
export const KIND_TAGS = Object.freeze({
  publish_block: 1, drum_session: 2, tap: 3, drop_mint: 4, transfer: 5, register_agent: 6,
  set_drum_attestors: 7, set_mandate: 8, clear_mandate: 9, spend_allowance: 10,
  presence_tap: 11, set_presence_issuers: 12,
  // Sequencer rotation (Town Network `keys`; a chain needs launch record 2).
  rotate_sequencer: 13,
  // Time capsules and stations (Town Network `stations`, batch 6; a chain needs launch record 13).
  seal_capsule: 14, open_capsule: 15, claim_station: 16, set_station: 17,
  // Device passes and controllers (Town Network `accounts`, batch 4; a chain needs launch record 6).
  set_session_key: 18, clear_session_key: 19, set_controllers: 20,
  // Editions (Town Network batch 3; a chain needs launch record 8).
  open_edition: 21, edition_mint: 22, edition_transfer: 23,
});

/**
 * Every tag the Town Network plan names (docs/TOWN_NETWORK.md tag registry,
 * docs/TAGS.md once `mask` lands): `{name, status: "live" | "reserved"}`.
 * Only live kinds encode here; reserved ones arrive with their packages.
 */
export const KIND_REGISTRY = Object.freeze(
  Object.fromEntries(
    [
      ...Object.entries(KIND_TAGS).map(([name, tag]) => [tag, name, "live"]),
      ...[
        "rotate_sequencer", "seal_capsule", "open_capsule", "claim_station", "set_station",
        "set_session_key", "clear_session_key", "set_controllers", "open_edition", "edition_mint",
        "edition_transfer", "fill_order", "cancel_orders", "pay", "register_feed", "oracle_report",
        "strike_reporter", "market_open", "market_stake", "market_resolve", "market_dispute",
        "market_claim", "bridge_withdraw",
      ]
        .map((name, i) => [13 + i, name, "reserved"])
        .filter(([, name]) => !Object.hasOwn(KIND_TAGS, name)),
    ].map(([tag, name, status]) => [tag, Object.freeze({ name, status })]),
  ),
);

/** The tag of a kind name (live or reserved), or undefined. */
export function kindTag(name) {
  for (const [tag, k] of Object.entries(KIND_REGISTRY)) if (k.name === name) return Number(tag);
  return undefined;
}

/**
 * A mandate kinds mask as an exact BigInt. Accepts a BigInt, a decimal
 * string, a safe integer, or a list of kind names / tags. Rejects bit 0
 * (the wide-form extension flag, never a stored bit) and any bit ≥ 64.
 */
export function kindsMask(v) {
  let k;
  if (Array.isArray(v)) {
    k = 0n;
    for (const x of v) {
      const tag = typeof x === "number" || /^[0-9]+$/.test(String(x)) ? Number(x) : kindTag(String(x).trim());
      if (!Number.isInteger(tag) || tag < 1 || tag > 63) throw new RangeError(`kinds: ${JSON.stringify(x)} is not a maskable kind (tags 1..63)`);
      k |= 1n << BigInt(tag);
    }
  } else if (typeof v === "bigint") k = v;
  else if (typeof v === "number") {
    if (!Number.isSafeInteger(v)) throw new RangeError("kinds: pass a BigInt or decimal string above 2^53");
    k = BigInt(v);
  } else if (typeof v === "string" && /^[0-9]+$/.test(v)) k = BigInt(v);
  else throw new TypeError("kinds: expected a BigInt, a decimal string, a safe integer or a list of kinds");
  if (k < 0n) throw new RangeError("kinds: negative");
  if (k & 1n) throw new RangeError("kinds: bit 0 is the wide-form flag, never a stored kind bit");
  if (k >> 64n) throw new RangeError("kinds: bits 64 and up are not maskable");
  return k;
}

/**
 * Canonical kinds-mask bytes (`mask` package rule, batch 2): u16 BE when the
 * mask is below 2^16 (byte-identical to v0.1), else
 * u16 BE ((kinds & 0xffff) | 1) ‖ u64 BE (kinds >> 16).
 * TODO(batch 3): replace the hand-computed wide-form test bytes with the
 * sdk_vectors extension once mask's Rust encoder is on main and the wasm is rebuilt.
 */
function encodeKindsMask(e, kinds) {
  const k = kindsMask(kinds);
  if (k >> 16n === 0n) return e.u16(Number(k));
  return e.u16(Number((k & 0xffffn) | 1n)).u64(k >> 16n);
}

function encodeTerms(e, t) {
  encodeKindsMask(e, t.kinds);
  const list = (x) => x || [];
  e.u32(list(t.channels).length);
  for (const c of list(t.channels)) e.str(c);
  e.u32(list(t.rooms).length);
  for (const r of list(t.rooms)) e.str(r);
  e.u64(t.spend_per_period).u64(t.period_blocks).u64(t.spend_total);
  e.u32(list(t.payees).length);
  for (const p of list(t.payees)) e.str(p);
  e.u64(t.expires_at);
}

/** `bytes` of a hex string (any length), for keys and signatures. */
function hexField(name, h) {
  try {
    return hexToBytes(String(h));
  } catch {
    throw new TypeError(`${name}: expected hex`);
  }
}

/** A room attestor / presence issuer key: 64 hex chars or an edpk. */
function ed25519KeyBytes(name, k) {
  if (typeof k === "string" && k.startsWith("edpk")) {
    const pk = parsePublicKey(k);
    return hexToBytes(pk.bytes);
  }
  return hexField(name, k);
}

const P25519 = (1n << 255n) - 19n;
/** y of the order-8 points (the others are p − Y8_25519, 0, 1 and p − 1). */
const Y8_25519 = 0x7a03ac9277fdc74ec6cc392cfa53202a0f67100d760b3cba4fd84d3d706a17c7n;

/**
 * True for an ed25519 key on a small-order point, in any encoding
 * ed25519-dalek decodes (y is read mod p, either sign bit): y in {0, 1,
 * p − 1, ±y8}. No signature verifies under such a key, so the chain refuses
 * it as a `rotate_sequencer` new_key (crypto.rs `PublicKey::is_weak`; the
 * 14 encodings are in vectors.json keys_record.weak_ed25519_keys). Takes 64
 * hex chars or 32 bytes; anything else is not a key, so false.
 */
export function isWeakEd25519Key(k) {
  let b;
  try {
    b = k instanceof Uint8Array ? k : hexToBytes(String(k));
  } catch {
    return false;
  }
  if (b.length !== 32) return false;
  let y = 0n;
  for (let i = 31; i >= 0; i--) y = (y << 8n) | BigInt(i === 31 ? b[i] & 0x7f : b[i]);
  y %= P25519;
  return y === 0n || y === 1n || y === P25519 - 1n || y === Y8_25519 || y === P25519 - Y8_25519;
}

/**
 * A device-pass key (set_session_key, clear_session_key): 32 bytes, never a
 * small-order point (keys.rs check_session_key: no signature verifies under
 * one, so such a pass could never sign).
 */
function sessionKeyBytes(k) {
  const b = ed25519KeyBytes("key", k);
  if (b.length === 32 && isWeakEd25519Key(b)) {
    throw new Error("key is a small-order (weak) ed25519 point: no signature verifies under it");
  }
  return b;
}

/** `{scheme, bytes}` controller keys in the chain's order: ed25519, then secp256k1, then p256, then bytewise. */
function sortPublicKeys(keys) {
  const seen = new Map(keys.map((k) => [`${k.scheme}:${k.bytes}`, k]));
  return [...seen.values()].sort((x, y) =>
    x.scheme === y.scheme ? (x.bytes < y.bytes ? -1 : x.bytes > y.bytes ? 1 : 0) : schemeByte(x.scheme) - schemeByte(y.scheme),
  );
}

/** A rotate_sequencer new_key: 32 bytes, never a small-order point. */
function rotationKeyBytes(k) {
  const b = ed25519KeyBytes("new_key", k);
  if (b.length === 32 && isWeakEd25519Key(b)) {
    throw new Error("new_key is a small-order (weak) ed25519 point: no signature verifies under it, so nothing could seal");
  }
  return b;
}

const SIG_MODES = { raw: 0, tezos_message: 1, webauthn: 2 };

function sigModeByte(m) {
  const mode = m === undefined || m === null ? "raw" : m;
  if (typeof mode !== "string" || !Object.hasOwn(SIG_MODES, mode)) throw new Error(`unknown sig mode ${JSON.stringify(mode)}`);
  return SIG_MODES[mode];
}

function encodeKeyList(e, keys, name) {
  const list = keys || [];
  e.u32(list.length);
  for (const k of list) e.bytes(ed25519KeyBytes(name, k));
}

function boolByte(name, v) {
  if (typeof v !== "boolean") throw new TypeError(`${name}: expected true or false`);
  return v ? 1 : 0;
}

/**
 * edition.rs EditionTerms: str id ‖ str title ‖ str creator ‖ u32 supply ‖
 * u32 per_account ‖ u64 opens_at ‖ u64 closes_at ‖ (u8 0 | u8 1 ‖ bytes
 * attestor) ‖ u8 transferable ‖ u32 royalty_bps ‖ u8 recipe_schema ‖
 * u8 unique_key_len ‖ renderer_hash 32 ‖ opt_str l1_ref.
 */
function encodeEditionTerms(e, t) {
  if (!t || typeof t !== "object") throw new TypeError("open_edition: terms must be an object");
  e.str(t.id).str(t.title).str(t.creator).u32(t.supply).u32(t.per_account).u64(t.opens_at).u64(t.closes_at);
  if (t.attestor === undefined || t.attestor === null) e.u8(0);
  else e.u8(1).bytes(ed25519KeyBytes("terms.attestor", t.attestor));
  e.u8(boolByte("terms.transferable", t.transferable))
    .u32(t.royalty_bps)
    .u8(t.recipe_schema)
    .u8(t.unique_key_len)
    .fixed(hash32(t.renderer_hash))
    .optStr(t.l1_ref ?? null);
}

/** station.rs StationMode: open = 0, crew = 1. */
export const STATION_MODES = Object.freeze({ open: 0, crew: 1 });

function stationModeByte(m) {
  if (typeof m !== "string" || !Object.hasOwn(STATION_MODES, m)) throw new Error(`station mode must be "open" or "crew", got ${JSON.stringify(m)}`);
  return STATION_MODES[m];
}

/** `u8 0 | u8 1 ‖ 32 bytes` (an optional hash). */
function optHash32(e, h) {
  if (h === undefined || h === null) e.u8(0);
  else e.u8(1).fixed(hash32(h));
}

function encodeKind(e, tx) {
  switch (tx.type) {
    case "publish_block":
      e.u8(1).str(tx.channel).str(tx.title).fixed(hash32(tx.body_hash)).optStr(tx.media_uri ?? null);
      break;
    case "drum_session": {
      // types.rs order: room, players, beat_hash, duration, ended_at_ms, cosigs, room_sig.
      e.u8(2).str(tx.room).u32(tx.players.length);
      for (const p of tx.players) e.str(p);
      e.fixed(hash32(tx.beat_hash)).u32(tx.duration).u64(tx.ended_at_ms);
      const cosigs = tx.cosigs || [];
      e.u32(cosigs.length);
      for (const c of cosigs) {
        const pk = parsePublicKey(c.public_key);
        e.str(c.player)
          .u8(schemeByte(pk.scheme))
          .bytes(hexToBytes(pk.bytes))
          .u8(sigModeByte(c.mode))
          .bytes(hexToBytes(parseSignature(c.signature).bytes));
      }
      const r = tx.room_sig;
      if (r === undefined || r === null) e.u8(0);
      else e.u8(1).bytes(ed25519KeyBytes("room_sig.attestor", r.attestor)).bytes(hexToBytes(parseSignature(r.signature).bytes));
      break;
    }
    case "set_drum_attestors":
      e.u8(7);
      encodeKeyList(e, tx.attestors, "attestors");
      break;
    case "presence_tap": {
      const t = tx.ticket || {};
      e.u8(11)
        .str(tx.room)
        .bytes(ed25519KeyBytes("ticket.issuer", t.issuer))
        .fixed(hash32(t.pid))
        .u64(t.slot)
        .bytes(hexField("ticket.sig", t.sig));
      break;
    }
    case "set_presence_issuers":
      e.u8(12);
      encodeKeyList(e, tx.issuers, "issuers");
      break;
    case "tap":
      e.u8(3).str(tx.room);
      break;
    case "drop_mint":
      e.u8(4).str(tx.drop_id).str(tx.recipient);
      break;
    case "transfer":
      e.u8(5).str(tx.to).u64(tx.amount);
      break;
    case "register_agent":
      e.u8(6).bytes(hexToBytes(tx.public_key)).str(tx.name);
      break;
    case "set_mandate":
      e.u8(8).str(tx.agent);
      encodeTerms(e, tx.terms);
      break;
    case "clear_mandate":
      e.u8(9).str(tx.agent);
      break;
    case "spend_allowance":
      e.u8(10).str(tx.to).u64(tx.amount);
      break;
    case "open_edition":
      e.u8(21);
      encodeEditionTerms(e, tx.terms);
      break;
    case "edition_mint":
      e.u8(22)
        .str(tx.edition)
        .str(tx.recipient)
        .bytes(hexField("recipe", tx.recipe))
        .u64(tx.approval_expires)
        .bytes(hexField("approval", tx.approval ?? ""));
      break;
    case "edition_transfer":
      e.u8(23).str(tx.edition).u32(tx.serial).str(tx.to);
      break;
    case "rotate_sequencer":
      // types.rs: u8 13 ‖ bytes(new_key) ‖ u64 activate_at.
      e.u8(13).bytes(rotationKeyBytes(tx.new_key)).u64(tx.activate_at);
      break;
    case "seal_capsule":
      // types.rs: u8 14 ‖ str channel ‖ commitment 32 ‖ u64 open_at ‖ str label.
      e.u8(14).str(tx.channel).fixed(hash32(tx.commitment)).u64(tx.open_at).str(tx.label);
      break;
    case "open_capsule":
      // types.rs: u8 15 ‖ capsule 32 ‖ bytes salt ‖ str title ‖ body_hash 32 ‖ opt_str media_uri.
      e.u8(15)
        .fixed(hash32(tx.capsule))
        .bytes(hexField("salt", tx.salt))
        .str(tx.title)
        .fixed(hash32(tx.body_hash))
        .optStr(tx.media_uri ?? null);
      break;
    case "claim_station":
      // types.rs: u8 16 ‖ str code ‖ str name ‖ u8 mode ‖ (u8 0 | u8 1 ‖ pid 32).
      e.u8(16).str(tx.code).str(tx.name).u8(stationModeByte(tx.mode));
      optHash32(e, tx.pid);
      break;
    case "set_station": {
      // types.rs: u8 17 ‖ str code ‖ u32 n ‖ str crew × n ‖ (u8 0 | u8 1 ‖ pinned 32) ‖ opt_str owner_to,
      // the crew in the tx's order (the chain wants it sorted; buildTx sorts for you).
      const crew = tx.crew || [];
      e.u8(17).str(tx.code).u32(crew.length);
      for (const a of crew) e.str(a);
      optHash32(e, tx.pinned);
      e.optStr(tx.owner_to ?? null);
      break;
    }
    case "set_session_key":
      // types.rs: u8 18 ‖ bytes(key) ‖ str(label) ‖ terms (a mandate's terms
      // shape: spend fields 0 and no payees on any valid pass).
      e.u8(18).bytes(sessionKeyBytes(tx.key)).str(tx.label);
      encodeTerms(e, tx.terms || {});
      break;
    case "clear_session_key":
      e.u8(19).bytes(sessionKeyBytes(tx.key));
      break;
    case "set_controllers": {
      // types.rs: u8 20 ‖ u32 n ‖ (u8 scheme ‖ bytes key) × n, in the tx's order
      // (the chain wants them sorted; buildTx sorts for you).
      const list = tx.controllers || [];
      e.u8(20).u32(list.length);
      for (const c of list) {
        const pk = parsePublicKey(c);
        e.u8(schemeByte(pk.scheme)).bytes(hexToBytes(pk.bytes));
      }
      break;
    }
    default: {
      const k = Object.values(KIND_REGISTRY).find((x) => x.name === tx.type);
      throw new Error(
        k ? `tx kind ${tx.type} is reserved (not live on this chain yet); this SDK encodes live kinds 1-23`
          : `tx kind ${tx.type} is not supported by this SDK (use the node's /tx/digest + the wasm verifier)`,
      );
    }
  }
}

/** Canonical bytes of an unsigned tx `{sender, nonce, type, ...}`. */
export function encodeTx(tx) {
  const e = new Enc().str(tx.sender).u64(tx.nonce);
  encodeKind(e, tx);
  return e.finish();
}

/** `{chain_id, genesis}` (genesis = the params hash, hex). */
export function domainOf(chainId, genesisHash) {
  if (!isValidChainId(chainId)) throw new Error("chain id is not wallet-safe");
  hash32(genesisHash);
  return { chain_id: chainId, genesis: genesisHash.toLowerCase() };
}

/** What the sender signs: blake2b("pointcast-chain/tx/v2" ‖ str(chain) ‖ genesis ‖ tx). Hex. */
export function signingHash(tx, domain) {
  const e = new Enc().str(domain.chain_id).fixed(hash32(domain.genesis)).fixed(encodeTx(tx));
  return bytesToHex(blake2b256(utf8("pointcast-chain/tx/v2"), e.finish()));
}

export const MESSAGE_PREFIX = "Tezos Signed Message: pointcast-chain";

export function isValidChainId(s) {
  return typeof s === "string" && /^[a-z0-9][a-z0-9._-]{0,63}$/.test(s);
}

/** An address field of a v2 text: Rust can only hold a valid address there. */
function textAddress(name, a) {
  if (!isAddress(a)) throw new Error(`wallet text v2: ${name} is not an address`);
  return a;
}

/**
 * A mandate kinds mask as kind names, comma separated in tag order, or
 * "none" for 0 (wallet.rs kind_names). Throws on a bit with no live kind
 * name (bit 0, reserved tags), where Rust builds no text.
 */
export function kindNames(mask) {
  const m = BigInt(toU64(mask));
  if (m === 0n) return "none";
  const names = [];
  for (let tag = 0; tag < 64; tag++) {
    if (((m >> BigInt(tag)) & 1n) === 0n) continue;
    const k = KIND_REGISTRY[tag];
    if (!k || k.status !== "live") throw new Error(`wallet text v2: kinds bit ${tag} is not a live kind`);
    names.push(k.name);
  }
  return names.join(",");
}

/**
 * The fields wallet text v2 appends for `tx` (wallet.rs fields_v2), each
 * with its leading space; "" for kinds that add none. Throws where Rust
 * builds no text: a presence room that is not a [a-z0-9_-]{1,64} slug, a
 * rotation key that is not 32 bytes, a mandate kinds bit with no live kind,
 * or an address field that is not an address.
 *
 * set_mandate shows `payees any` for an empty allowlist (the agent may pay
 * anyone), else every payee comma separated (at most 16 on a valid
 * mandate), then `kinds <names>`.
 *
 * set_session_key names the device key (edpk), its expiry, kinds, rooms and
 * channels (`any` for an empty list); clear_session_key the device key;
 * set_controllers every key (edpk/sppk) and that each can take the account
 * over, or `none` when control goes back to the address key. The prompt's
 * `sender` is the account the signer acts for (a controller sees it there).
 */
export function walletFieldsV2(tx) {
  switch (tx.type) {
    case "transfer":
    case "spend_allowance":
      return ` to ${textAddress("to", tx.to)} amount ${toU64(tx.amount)}`;
    case "set_mandate": {
      const t = tx.terms || {};
      const payees = t.payees || [];
      const shown = payees.length ? payees.map((a) => textAddress("payee", a)).join(",") : "any";
      return ` agent ${textAddress("agent", tx.agent)} per ${toU64(t.spend_per_period)}/${toU64(t.period_blocks)} total ${toU64(t.spend_total)} expires ${toU64(t.expires_at)} payees ${shown} kinds ${kindNames(t.kinds)}`;
    }
    case "drop_mint":
    case "edition_mint":
      return ` recipient ${textAddress("recipient", tx.recipient)}`;
    case "edition_transfer":
      return ` to ${textAddress("to", tx.to)} serial ${toU64(tx.serial)}`;
    case "presence_tap":
      if (typeof tx.room !== "string" || !/^[a-z0-9_-]{1,64}$/.test(tx.room)) throw new Error("wallet text v2: the room is not a slug");
      return ` room ${tx.room}`;
    case "rotate_sequencer": {
      const k = ed25519KeyBytes("new_key", tx.new_key);
      if (k.length !== 32) throw new Error("wallet text v2: new_key is not 32 bytes");
      return ` new_key ${b58checkEncode(concat(Uint8Array.from(PREFIX.edpk), k))} activate_at ${toU64(tx.activate_at)}`;
    }
    case "set_session_key": {
      const t = tx.terms || {};
      const listOrAny = (xs, re, name) => {
        const list = xs || [];
        if (!list.every((x) => typeof x === "string" && re.test(x))) throw new Error(`wallet text v2: a ${name} can't be shown`);
        return list.length ? list.join(",") : "any";
      };
      const rooms = listOrAny(t.rooms, /^[a-z0-9_-]{1,64}$/, "room");
      const channels = listOrAny(t.channels, /^[A-Z0-9]{1,16}$/, "channel");
      return ` device_key ${deviceKeyB58(tx.key)} expires ${toU64(t.expires_at)} kinds ${kindNames(t.kinds)} rooms ${rooms} channels ${channels}`;
    }
    case "clear_session_key":
      return ` device_key ${deviceKeyB58(tx.key)}`;
    case "set_controllers": {
      const list = tx.controllers || [];
      if (!list.length) return " controllers none (only the address key controls this account; all device passes end)";
      return ` controllers ${list.map((k) => publicKeyToB58(k)).join(",")} (each can take over this account; all device passes end)`;
    }
    case "seal_capsule":
      return ` channel ${textChannel("channel", tx.channel)} open_at ${toU64(tx.open_at)}`;
    case "open_capsule":
      return ` capsule ${bytesToHex(hash32(tx.capsule))}`;
    case "claim_station":
      stationModeByte(tx.mode);
      return ` station ${textChannel("code", tx.code)} mode ${tx.mode}`;
    case "set_station": {
      const crew = tx.crew || [];
      const shown = crew.length ? crew.map((a) => textAddress("crew", a)).join(",") : "none";
      const to = tx.owner_to === undefined || tx.owner_to === null ? "none" : textAddress("owner_to", tx.owner_to);
      return ` station ${textChannel("code", tx.code)} crew ${shown} offer_to ${to}`;
    }
    default:
      return "";
  }
}

/** A channel or station code of a v2 text: `[A-Z0-9]{1,16}` (wallet.rs channel_text). */
function textChannel(name, c) {
  if (typeof c !== "string" || !/^[A-Z0-9]{1,16}$/.test(c)) throw new Error(`wallet text v2: the ${name} is not [A-Z0-9]{1,16}`);
  return c;
}

/** A 32-byte ed25519 device key as `edpk…` (wallet.rs edpk). */
function deviceKeyB58(k) {
  const b = ed25519KeyBytes("key", k);
  if (b.length !== 32) throw new Error("wallet text v2: the device key is not 32 bytes");
  return b58checkEncode(concat(Uint8Array.from(PREFIX.edpk), b));
}

/**
 * The wallet text version a chain signs (params.rs wallet_text_version): 2
 * on every chain with the accounts record (launch record 6), else
 * `params.launch.keys.wallet_text_version` (launch record 2), else 1.
 */
export function walletTextVersion(params) {
  const l = params && params.launch;
  if (l && l.accounts !== undefined && l.accounts !== null) return 2;
  const k = l && l.keys;
  if (k === undefined || k === null) return 1;
  return Number(k.wallet_text_version);
}

/**
 * The exact text a Tezos wallet shows and signs for `tx` (wallet.rs), in
 * text `version` (`walletTextVersion(params)`): 1 = the v0.1 text, 2 = the
 * v0.1 text plus `walletFieldsV2(tx)`.
 */
export function walletText(tx, domain, version = 1) {
  if (!isValidChainId(domain.chain_id)) throw new Error("chain id is not wallet-safe");
  if (version !== 1 && version !== 2) throw new Error(`unknown wallet text version ${version}`);
  let text = `${MESSAGE_PREFIX} ${domain.chain_id} ${tx.type} sender ${tx.sender} nonce ${toU64(tx.nonce)} digest ${signingHash(tx, domain)}`;
  if (version === 2) text += walletFieldsV2(tx);
  if (!/^[\x20-\x7e]+$/.test(text)) throw new Error("wallet text is not printable ASCII");
  return text;
}

/** Micheline PACK of a string: 05 01 ‖ u32be(len) ‖ text. */
export function packString(text) {
  const t = utf8(text);
  return new Enc().u8(0x05).u8(0x01).bytes(t).finish();
}

/** The 32 bytes a Tezos wallet signs for `text` (hex). */
export function walletSignedDigest(text) {
  return bytesToHex(blake2b256(packString(text)));
}

/** `blake2b("pointcast-chain/body/v1" ‖ text)`: what publish_block commits to. */
export function bodyHash(text) {
  return bytesToHex(blake2b256(utf8("pointcast-chain/body/v1"), utf8(text)));
}

/**
 * The tx hash the node reports for a signed tx (object or base58 wire
 * forms). A webauthn tx's `signature` is its envelope in hex
 * (`webauthnEnvelope`), normalized to low-S first as the node does
 * (`parseWebauthnEnvelope`), so a high-S body hashes to the txid the node
 * reports; its bytes end with the marker 2.
 */
export function txHash(stx) {
  const pk = parsePublicKey(stx.public_key);
  const mode = stx.sig_mode === undefined || stx.sig_mode === null ? "raw" : stx.sig_mode;
  sigModeByte(mode);
  const sig = mode === "webauthn" ? parseWebauthnEnvelope(stx.signature).hex : parseSignature(stx.signature).bytes;
  const e = new Enc()
    .fixed(encodeTx(stx.tx))
    .u8(schemeByte(pk.scheme))
    .bytes(hexToBytes(pk.bytes))
    .bytes(hexToBytes(sig));
  if (mode === "tezos_message") e.u8(1);
  if (mode === "webauthn") e.u8(2);
  return bytesToHex(blake2b256(utf8("pointcast-chain/txid/v1"), e.finish()));
}

// ---------------------------------------------------------------- passkeys (webauthn.rs, launch record 7)

const B64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** RFC 4648 §5 base64url without padding (how a clientDataJSON carries the challenge). */
export function base64url(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(3, bytes.length - i) + 1;
    for (let j = 0; j < chars; j++) out += B64URL[(n >> (18 - 6 * j)) & 63];
  }
  return out;
}

/** Strict base64url (padding only as a whole final group; unused bits zero). Throws on anything else. */
export function base64urlDecode(str) {
  if (typeof str !== "string") throw new TypeError("base64url: expected a string");
  const stripped = str.replace(/=+$/, "");
  const pads = str.length - stripped.length;
  if ((pads > 0 && (str.length % 4 !== 0 || pads > 2)) || stripped.length % 4 === 1) throw new Error("base64url: bad length");
  const out = [];
  for (let i = 0; i < stripped.length; i += 4) {
    const chunk = stripped.slice(i, i + 4);
    let n = 0;
    for (let j = 0; j < chunk.length; j++) {
      const v = B64URL.indexOf(chunk[j]);
      if (v < 0) throw new Error("base64url: bad character");
      n |= v << (18 - 6 * j);
    }
    const unused = chunk.length === 2 ? n & 0xffff : chunk.length === 3 ? n & 0xff : 0;
    if (unused) throw new Error("base64url: non-canonical trailing bits");
    const bytes = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
    out.push(...bytes.slice(0, chunk.length - 1));
  }
  return Uint8Array.from(out);
}

/** The challenge a passkey signs for `tx`: its signing hash, base64url (webauthn.rs challenge_b64url). */
export function webauthnChallenge(tx, domain) {
  return base64url(hexToBytes(signingHash(tx, domain)));
}

/** The P-256 group order n and ⌊n/2⌋ (webauthn.rs N, HALF_N). */
export const P256_N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
export const P256_HALF_N = P256_N >> 1n;

const bigOf = (b) => BigInt("0x" + (bytesToHex(b) || "0"));
const bytes32 = (n) => hexToBytes(n.toString(16).padStart(64, "0"));

/** The P-256 field prime p and curve constant b (y² = x³ - 3x + b). */
const P256_P = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
const P256_B = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn;

function modPow(base, exp, m) {
  let r = 1n;
  let b = base % m;
  for (let e = exp; e > 0n; e >>= 1n) {
    if (e & 1n) r = (r * b) % m;
    b = (b * b) % m;
  }
  return r;
}

/**
 * Is `key` (hex or bytes) a canonical compressed P-256 point, as the chain
 * requires of a passkey key (webauthn.rs is_p256_key)? 33 bytes, tag 02/03,
 * x < p, and x³ - 3x + b a square mod p (so a y exists; the tag picks its
 * parity, and P-256 has no point with y = 0). p ≡ 3 (mod 4), so the square
 * root is a single power.
 */
export function isP256Key(key) {
  const b = typeof key === "string" ? (/^[0-9a-fA-F]{66}$/.test(key) ? hexToBytes(key.toLowerCase()) : null) : key;
  if (!(b instanceof Uint8Array) || b.length !== 33 || (b[0] !== 2 && b[0] !== 3)) return false;
  const x = bigOf(b.subarray(1));
  if (x >= P256_P) return false;
  const alpha = (((((x * x) % P256_P) * x - 3n * x + P256_B) % P256_P) + P256_P) % P256_P;
  const y = modPow(alpha, (P256_P + 1n) / 4n, P256_P);
  return (y * y) % P256_P === alpha;
}

/** One strict DER INTEGER (webauthn.rs der_int): value bytes without the sign byte, and the rest. */
function derInt(b) {
  if (b.length < 2 || b[0] !== 0x02 || b[1] === 0 || b[1] >= 0x80 || b.length < 2 + b[1]) throw new Error("signature: bad DER integer");
  let v = b.subarray(2, 2 + b[1]);
  if (v[0] & 0x80) throw new Error("signature: negative DER integer");
  if (v[0] === 0) {
    if (v.length === 1 || !(v[1] & 0x80)) throw new Error("signature: non-minimal DER integer");
    v = v.subarray(1);
  }
  if (v.length > 32) throw new Error("signature: DER integer over 32 bytes");
  return [v, b.subarray(2 + b[1])];
}

/**
 * `r ‖ s` (64 bytes) from a strict DER ECDSA signature (what
 * `navigator.credentials.get` returns), or the 64 raw bytes as given (what
 * WebCrypto returns), normalized to low-S (s → n - s when s > n/2), as the
 * node normalizes it (webauthn.rs signature_to_rs). Throws on anything else.
 */
export function p256SignatureToRs(sig) {
  let r;
  let s;
  if (sig.length === 64) {
    r = bigOf(sig.subarray(0, 32));
    s = bigOf(sig.subarray(32));
  } else {
    if (sig.length < 2 || sig[0] !== 0x30 || sig[1] >= 0x80 || sig.length !== 2 + sig[1]) throw new Error("signature: expected DER or 64 raw bytes");
    const [rb, rest] = derInt(sig.subarray(2));
    const [sb, tail] = derInt(rest);
    if (tail.length) throw new Error("signature: bytes after the DER sequence");
    r = bigOf(rb);
    s = bigOf(sb);
  }
  if (r < 1n || r >= P256_N || s < 1n || s >= P256_N) throw new Error("signature: r or s out of range");
  if (s > P256_HALF_N) s = P256_N - s;
  return concat(bytes32(r), bytes32(s));
}

const asBytes = (name, v) => {
  if (v instanceof Uint8Array) return v;
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (ArrayBuffer.isView(v)) return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
  if (typeof v === "string") return base64urlDecode(v);
  throw new TypeError(`${name}: expected bytes or base64url`);
};

/**
 * The canonical webauthn envelope (hex) for an assertion: `r ‖ s ‖
 * bytes(authenticatorData) ‖ bytes(clientDataJSON)` with a low-S `r ‖ s`.
 * Takes `credential.response` itself (ArrayBuffers) or its toJSON() form
 * (base64url strings); the signature may be DER or raw.
 */
export function webauthnEnvelope({ authenticatorData, clientDataJSON, signature }) {
  const ad = asBytes("authenticatorData", authenticatorData);
  const cdj = asBytes("clientDataJSON", clientDataJSON);
  if (ad.length < 37 || ad.length > 512) throw new Error("authenticatorData must be 37..=512 bytes");
  if (cdj.length < 1 || cdj.length > 1024) throw new Error("clientDataJSON must be 1..=1024 bytes");
  const rs = p256SignatureToRs(asBytes("signature", signature));
  return bytesToHex(new Enc().fixed(rs).bytes(ad).bytes(cdj).finish());
}

/**
 * An envelope's parts (webauthn.rs Envelope::parse), normalized as every
 * door of the node normalizes it (chain-core's SignedTx wire parse): `r`
 * and `s` must be in [1, n-1] (throws otherwise: such a signature can never
 * verify), and a high `s` is replaced by n - s, so `hex` is always the
 * canonical low-S envelope and `txHash` gives the txid the node reports
 * (`normalized` says whether S was flipped). Throws unless it parses
 * exactly.
 */
export function parseWebauthnEnvelope(hex) {
  if (typeof hex !== "string" || !/^([0-9a-fA-F]{2})*$/.test(hex) || hex.length > 2 * 1608) throw new Error("signature: expected the webauthn envelope as hex");
  const b = hexToBytes(hex.toLowerCase());
  const len = (o) => (b.length >= o + 4 ? new DataView(b.buffer, b.byteOffset + o, 4).getUint32(0) : -1);
  const adLen = len(64);
  if (adLen < 37 || adLen > 512) throw new Error("webauthn envelope: bad authenticatorData length");
  const cdjAt = 68 + adLen;
  const cdjLen = len(cdjAt);
  if (cdjLen < 1 || cdjLen > 1024 || b.length !== cdjAt + 4 + cdjLen) throw new Error("webauthn envelope: bad clientDataJSON length");
  const r = bigOf(b.subarray(0, 32));
  const s = bigOf(b.subarray(32, 64));
  if (r < 1n || r >= P256_N || s < 1n || s >= P256_N) throw new Error("webauthn envelope: r or s out of range");
  const normalized = s > P256_HALF_N;
  if (normalized) b.set(bytes32(P256_N - s), 32);
  return {
    hex: bytesToHex(b),
    rs: b.subarray(0, 64),
    authenticatorData: b.subarray(68, cdjAt),
    clientDataJSON: b.subarray(cdjAt + 4),
    normalized,
  };
}

/** A P-256 point `04 ‖ x ‖ y` (65 bytes) or an ES256 SPKI (91 bytes, `getPublicKey()`) as the 33-byte compressed key `{scheme: "p256", bytes}`. */
export function p256PublicKey(raw) {
  let b = asBytes("public key", raw);
  const SPKI_HEAD = "3059301306072a8648ce3d020106082a8648ce3d030107034200";
  if (b.length === 91 && bytesToHex(b.subarray(0, 26)) === SPKI_HEAD) b = b.subarray(26);
  if (b.length !== 65 || b[0] !== 4) throw new Error("p256 key: expected 04 ‖ x ‖ y or an ES256 SPKI");
  const prefix = b[64] & 1 ? 3 : 2;
  return { scheme: "p256", bytes: bytesToHex(concat(Uint8Array.of(prefix), b.subarray(1, 33))) };
}

/** `{tx, sig_mode: "webauthn", public_key, signature}` from a passkey assertion over `tx` (see webauthnEnvelope). */
export function webauthnSignedTx(tx, publicKey, assertion) {
  const pk = parsePublicKey(publicKey);
  if (pk.scheme !== "p256") throw new Error("webauthn signs with a p256 (passkey) key");
  return { tx, sig_mode: "webauthn", public_key: pk, signature: webauthnEnvelope(assertion) };
}

/**
 * Sign `tx` with a passkey in a browser: one `navigator.credentials.get`
 * (Face ID, Touch ID, a fingerprint) over the tx's signing hash, returned
 * as the canonical signed tx for `POST /tx`. `rpId` must be the chain's
 * record-7 RP ID.
 *
 * The passkey sheet itself only names the site, so the plain words come
 * first (passkeys fix pass P13): `confirm(words)` is required, and is
 * called with `describeTx(tx, { params })` (the prompt card built from the
 * tx itself) BEFORE the sheet is raised. Show it and resolve `true` only
 * when the person agrees; anything else, or a throw, and the passkey is
 * never asked. A tx with no words (describeTx throws) is refused.
 */
export async function signWithPasskey(tx, domain, { publicKey, credentialId, rpId, confirm, params, timeout = 60000, credentials = globalThis.navigator?.credentials } = {}) {
  if (typeof confirm !== "function") {
    throw new Error("signWithPasskey needs confirm(words): show the plain words first (the passkey sheet only names the site)");
  }
  if (!credentials || typeof credentials.get !== "function") throw new Error("no WebAuthn here (navigator.credentials)");
  const words = describeTx(tx, { params, domain });
  if ((await confirm(words)) !== true) throw new Error("not approved: the passkey was not asked");
  const allowCredentials = credentialId ? [{ type: "public-key", id: base64urlDecode(credentialId) }] : [];
  const cred = await credentials.get({
    publicKey: { challenge: hexToBytes(signingHash(tx, domain)), rpId, userVerification: "required", allowCredentials, timeout },
  });
  if (!cred || !cred.response) throw new Error("the passkey returned no assertion");
  return webauthnSignedTx(tx, publicKey, cred.response);
}

const POLICY = { open: 0, cosign: 1, room_only: 2 };
const TAP_POLICY = { open: 0, ticketed: 1 };

/** First byte of the params launch tail (params.rs LAUNCH_MARKER). */
export const LAUNCH_MARKER = 0xf0;

/**
 * Launch records this SDK can encode, by name → tag (docs/TAGS.md). The
 * others (state_root_version, ...) arrive with their packages; until then
 * paramsHash refuses them rather than hash params the chain would read
 * differently.
 */
export const LAUNCH_RECORDS = Object.freeze({ presence: 1, keys: 2, accounts: 6, webauthn: 7, editions: 8, stations: 13 });

function encodePresenceRecord(pp) {
  if (typeof pp.tap_policy !== "string" || !Object.hasOwn(TAP_POLICY, pp.tap_policy)) throw new Error("unknown presence.tap_policy");
  const e = new Enc()
    .u8(TAP_POLICY[pp.tap_policy])
    .u64(pp.presence_reward)
    .u64(pp.slot_blocks)
    .u8(pp.grace_slots)
    .u32(pp.issuer_slot_cap)
    .u64(pp.bind_epochs)
    .str(pp.admin);
  encodeKeyList(e, pp.issuers_genesis, "presence.issuers_genesis");
  return e.finish();
}

/** Record 8 (edition.rs EditionsParams): str admin ‖ u32 max_open ‖ u32 max_supply ‖ u32 max_recipe_len ‖ u32 royalty_bps_max. */
function encodeEditionsRecord(ep) {
  return new Enc().str(ep.admin).u32(ep.max_open).u32(ep.max_supply).u32(ep.max_recipe_len).u32(ep.royalty_bps_max).finish();
}

/** Record 2 (params.rs KeysParams): str sequencer_admin ‖ u64 rotation_delay_blocks ‖ u8 wallet_text_version. */
function encodeKeysRecord(kp) {
  return new Enc().str(kp.sequencer_admin).u64(kp.rotation_delay_blocks).u8(kp.wallet_text_version).finish();
}

/**
 * Record 6 (keys.rs AccountsParams): u64 session_max_blocks ‖ u32 max_session_keys ‖
 * u32 max_controllers ‖ u64 session_kinds.
 */
function encodeAccountsRecord(ap) {
  return new Enc().u64(ap.session_max_blocks).u32(ap.max_session_keys).u32(ap.max_controllers).u64(ap.session_kinds).finish();
}

/** Record 7's per-block cap on webauthn txs when a record leaves it out (webauthn.rs DEFAULT_MAX_WEBAUTHN_TXS_PER_BLOCK). */
export const DEFAULT_MAX_WEBAUTHN_TXS_PER_BLOCK = 64;

/**
 * Record 7 (webauthn.rs WebauthnParams): str rp_id ‖ u32 n ‖ str origin × n
 * ‖ u32 max_webauthn_txs_per_block (64 when absent, as serde defaults it).
 */
function encodeWebauthnRecord(wp) {
  const origins = wp.origins || [];
  const cap = wp.max_webauthn_txs_per_block ?? DEFAULT_MAX_WEBAUTHN_TXS_PER_BLOCK;
  if (!Number.isInteger(cap) || cap < 0 || cap > 0xffffffff) throw new Error("webauthn.max_webauthn_txs_per_block must be a u32");
  const e = new Enc().str(wp.rp_id).u32(origins.length);
  for (const o of origins) e.str(o);
  return e.u32(cap).finish();
}

/**
 * Record 13 (station.rs StationsParams): u32 n ‖ str code × n ‖ u32 max_unopened ‖
 * u64 max_delay_blocks ‖ u32 max_stations ‖ u32 max_capsules ‖ u32 max_account_stations.
 */
function encodeStationsRecord(sp) {
  const codes = sp.house_codes || [];
  const e = new Enc().u32(codes.length);
  for (const c of codes) e.str(c);
  return e.u32(sp.max_unopened).u64(sp.max_delay_blocks).u32(sp.max_stations).u32(sp.max_capsules).u32(sp.max_account_stations).finish();
}

const LAUNCH_ENCODERS = {
  presence: encodePresenceRecord,
  keys: encodeKeysRecord,
  accounts: encodeAccountsRecord,
  webauthn: encodeWebauthnRecord,
  editions: encodeEditionsRecord,
  stations: encodeStationsRecord,
};

/** `[tag, record bytes]` for every present launch record, ascending; throws on unknown records. */
function launchRecords(launch) {
  const out = [];
  for (const [name, rec] of Object.entries(launch)) {
    if (rec === undefined || rec === null) continue; // serde: null = absent
    // Own keys only: "constructor", "__proto__" and friends are unknown records too.
    if (!Object.hasOwn(LAUNCH_RECORDS, name)) throw new ChainError(`unknown launch record: ${name}`);
    out.push([LAUNCH_RECORDS[name], LAUNCH_ENCODERS[name](rec)]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}

/**
 * The genesis hash. Legacy params (no `launch`) hash exactly as before:
 * blake2b("pointcast-chain/params/v1" ‖ params). Params with a launch tail
 * (u8 0xF0 ‖ u32 n ‖ (u8 tag ‖ bytes(record)) × n, tags ascending) hash under
 * "pointcast-chain/params/v2". Hex.
 */
export function paramsHash(p) {
  const seq = parsePublicKey(p.sequencer);
  const e = new Enc()
    .str(p.chain_id)
    .u8(schemeByte(seq.scheme))
    .bytes(hexToBytes(seq.bytes))
    .str(p.genesis_treasury)
    .u64(p.genesis_treasury_amount)
    .u64(p.tap_reward)
    .u64(p.tap_window_blocks)
    .u32(p.taps_per_window)
    .u64(p.drum_reward_per_10s)
    .u64(p.drum_session_cap_per_player)
    .u32(p.drum_max_duration_secs)
    .u32(p.drum_max_players)
    .u64(p.epoch_blocks)
    .u64(p.account_epoch_cap)
    .u64(p.block_issuance_cap)
    .u64(p.max_supply)
    .u32(p.max_drop_supply)
    .u32(p.max_agents_per_owner)
    .u32(p.max_txs_per_block)
    .u64(p.anchor_interval);
  if (!(p.drum_attest_policy in POLICY)) throw new Error("unknown drum_attest_policy");
  e.u8(POLICY[p.drum_attest_policy])
    .u64(p.drum_attest_max_age_ms)
    .u64(p.drum_clock_skew_ms)
    .str(p.drum_attestor_admin)
    .u32(p.drum_attestors_genesis.length);
  for (const k of p.drum_attestors_genesis) e.bytes(hexToBytes(k));
  if (p.launch === undefined || p.launch === null) {
    return bytesToHex(blake2b256(utf8("pointcast-chain/params/v1"), e.finish()));
  }
  if (typeof p.launch !== "object" || Array.isArray(p.launch)) throw new ChainError("params.launch must be an object");
  const records = launchRecords(p.launch);
  e.u8(LAUNCH_MARKER).u32(records.length);
  for (const [tag, bytes] of records) e.u8(tag).bytes(bytes);
  return bytesToHex(blake2b256(utf8("pointcast-chain/params/v2"), e.finish()));
}

/**
 * True when a well-known public dev key is anywhere in the chain's sequencer
 * schedule: the genesis key (`params.sequencer`) and, with a node `/status`
 * from a keys-record chain, the active key, the pending rotation and every
 * past one (`sequencer_active`, `sequencer_rotation`, `sequencer_history`).
 * Anyone can forge a chain such a key sealed or will seal.
 */
export function isDevChain(params, status) {
  const keys = [params && params.sequencer];
  if (status) {
    keys.push(status.sequencer_active, status.sequencer_rotation && status.sequencer_rotation.key);
    for (const r of Array.isArray(status.sequencer_history) ? status.sequencer_history : []) keys.push(r && r.key);
  }
  return keys.some((k) => {
    try {
      return k !== undefined && k !== null && DEV_KEY_SET.has(parsePublicKey(k).bytes);
    } catch {
      return false;
    }
  });
}

// ---------------------------------------------------------------- attestations (attest.rs, presence.rs)

function sessionClaimBytes(domain, s) {
  const e = new Enc().str(domain.chain_id).fixed(hash32(domain.genesis)).str(s.sender).u64(s.nonce).str(s.room).u32(s.players.length);
  for (const p of s.players) e.str(p);
  return e.fixed(hash32(s.beat_hash)).u32(s.duration).u64(s.ended_at_ms).finish();
}

/**
 * The drum-session digest both attestation roles build on (attest.rs
 * SessionClaim::digest). `s` = `{sender, nonce, room, players, beat_hash,
 * duration, ended_at_ms}`, players strictly ascending. Hex.
 */
export function drumSessionDigest(domain, s) {
  return bytesToHex(blake2b256(utf8("pointcast-chain/drum-attest/v2"), sessionClaimBytes(domain, s)));
}

/** What a room server signs for a session (raw ed25519 over these 32 bytes). Hex. */
export function drumRoomDigest(domain, s) {
  return bytesToHex(blake2b256(utf8("pointcast-chain/drum-room/v1"), hexToBytes(drumSessionDigest(domain, s))));
}

/** "I, `player`, played in this session": what a raw co-signature signs. Hex. */
export function drumCosignCore(domain, s, player) {
  const e = new Enc().fixed(hexToBytes(drumSessionDigest(domain, s))).str(player);
  return bytesToHex(blake2b256(utf8("pointcast-chain/drum-cosign/v1"), e.finish()));
}

/**
 * The co-sign text version a chain verifies (params.rs cosign_text_version):
 * 2 on every chain with the accounts record (launch record 6, where one key
 * may control several accounts), else 1.
 */
export function cosignTextVersion(params) {
  const l = params && params.launch;
  return l && l.accounts !== undefined && l.accounts !== null ? 2 : 1;
}

/**
 * The wallet text a co-signer sees (purpose `drum_cosign`, tezos_message
 * mode; attest.rs cosign_text_v), in co-sign text `version`
 * (`cosignTextVersion(params)`): v2 appends ` player <addr>`, the account the
 * signature vouches for.
 */
export function drumCosignText(domain, s, player, version = 1) {
  if (!isValidChainId(domain.chain_id)) throw new Error("chain id is not wallet-safe");
  if (version !== 1 && version !== 2) throw new Error(`unknown co-sign text version ${version}`);
  if (version === 2 && !isAddress(player)) throw new Error(`co-sign text v2: not a pointcast-chain address: ${player}`);
  const text = `${MESSAGE_PREFIX} ${domain.chain_id} drum_cosign sender ${s.sender} nonce ${toU64(s.nonce)} digest ${drumCosignCore(domain, s, player)}`;
  return version === 2 ? `${text} player ${player}` : text;
}

/** The session fields of a drum_session tx, as `drumSessionDigest` takes them. */
export function drumSessionOf(tx) {
  return { sender: tx.sender, nonce: tx.nonce, room: tx.room, players: tx.players, beat_hash: tx.beat_hash, duration: tx.duration, ended_at_ms: tx.ended_at_ms };
}

/**
 * What a presence issuer signs (presence.rs ticket_digest): binds the chain,
 * the holder, the room, the issuer key, the pid and the slot. Hex.
 */
export function presenceTicketDigest(domain, { holder, room, issuer, pid, slot }) {
  const e = new Enc()
    .str(domain.chain_id)
    .fixed(hash32(domain.genesis))
    .str(holder)
    .str(room)
    .bytes(ed25519KeyBytes("issuer", issuer))
    .fixed(hash32(pid))
    .u64(slot);
  return bytesToHex(blake2b256(utf8("pointcast-chain/presence/v1"), e.finish()));
}

// ---------------------------------------------------------------- editions (edition.rs, recipe.rs)

/** Domain tag of the digest an edition attestor signs. */
export const EDITION_APPROVAL_TAG = "pointcast-chain/edition-approval/v1";
/** Domain tag of every edition's recipe hash (recipe.rs). */
export const RECIPE_HASH_TAG = "pointcast/first-mints/recipe/v1";

/** blake2b-256("pointcast/first-mints/recipe/v1" ‖ recipe bytes): what editions record and approvals bind. Hex in, hex out. */
export function editionRecipeHash(recipeHex) {
  return bytesToHex(blake2b256(utf8(RECIPE_HASH_TAG), hexField("recipe", recipeHex)));
}

/**
 * What an edition attestor signs for one edition_mint (edition.rs
 * approval_digest): blake2b("pointcast-chain/edition-approval/v1" ‖
 * str chain_id ‖ genesis ‖ str edition ‖ str sender ‖ str recipient ‖
 * recipe_hash ‖ u64 approval_expires). Hex.
 */
export function editionApprovalDigest(domain, { edition, sender, recipient, recipe_hash, approval_expires }) {
  const e = new Enc()
    .str(domain.chain_id)
    .fixed(hash32(domain.genesis))
    .str(edition)
    .str(sender)
    .str(recipient)
    .fixed(hash32(recipe_hash))
    .u64(approval_expires);
  return bytesToHex(blake2b256(utf8(EDITION_APPROVAL_TAG), e.finish()));
}

/** Domain tag of the request a sender signs to ask an edition attestor for an approval (edition.rs approve_request_digest). */
export const EDITION_APPROVE_REQUEST_TAG = "pointcast-chain/edition-approve-request/v1";
/** The purpose word of that request's wallet prompt. */
export const EDITION_APPROVE_REQUEST_PURPOSE = "edition_approve_request";

/**
 * What a sender signs to ask an attestor (issuer/edition-attestor.js) for
 * one approval: blake2b("pointcast-chain/edition-approve-request/v1" ‖
 * str chain_id ‖ genesis ‖ str edition ‖ str sender ‖ str recipient ‖
 * recipe_hash ‖ pid ‖ u64 request_expires). `pid` is the presence ticket's.
 * Hex.
 */
export function editionApproveRequestDigest(domain, { edition, sender, recipient, recipe_hash, pid, request_expires }) {
  const e = new Enc()
    .str(domain.chain_id)
    .fixed(hash32(domain.genesis))
    .str(edition)
    .str(sender)
    .str(recipient)
    .fixed(hash32(recipe_hash))
    .fixed(hash32(pid))
    .u64(request_expires);
  return bytesToHex(blake2b256(utf8(EDITION_APPROVE_REQUEST_TAG), e.finish()));
}

/** The wallet prompt for that request (tezos_message mode; wallet.rs message_text). */
export function editionApproveRequestText(domain, req) {
  if (!isValidChainId(domain.chain_id)) throw new Error("chain id is not wallet-safe");
  const text = `${MESSAGE_PREFIX} ${domain.chain_id} ${EDITION_APPROVE_REQUEST_PURPOSE} sender ${req.sender} nonce ${toU64(req.request_expires)} digest ${editionApproveRequestDigest(domain, req)}`;
  if (!/^[\x20-\x7e]+$/.test(text)) throw new Error("request text is not printable ASCII");
  return text;
}

/**
 * Sign an edition approve request: the `request` object an attestor's
 * POST /approve takes, `{expires, sig_mode, public_key, signature}`.
 * Default mode "tezos_message": a Beacon-shaped wallet (`getActiveAccount`,
 * `requestSignPayload`, e.g. devWallet) signs the prompt from
 * `editionApproveRequestText`. Mode "raw": `wallet.signDigest` signs the
 * digest itself (agents and other native ed25519 signers; needs
 * `wallet.publicKeyHex`).
 */
export async function signEditionApproveRequest(domain, req, wallet, { mode = "tezos_message", actingFor } = {}) {
  const expires = req.request_expires;
  if (mode === "raw") {
    if (!wallet || typeof wallet.signDigest !== "function" || !wallet.publicKeyHex) throw new Error("raw mode needs a signer with signDigest and publicKeyHex");
    const signature = await wallet.signDigest(editionApproveRequestDigest(domain, req));
    return { expires, sig_mode: "raw", public_key: { scheme: "ed25519", bytes: wallet.publicKeyHex }, signature };
  }
  if (mode !== "tezos_message") throw new Error('mode is "tezos_message" or "raw"');
  const client = wallet && wallet.client && wallet.client.requestSignPayload ? wallet.client : wallet;
  const account = await client.getActiveAccount();
  if (!account) throw new Error("no wallet connected");
  // A controller (launch record 6) signs for the account it controls: say
  // so with `actingFor` (the attestor checks the node's controller list).
  if (account.address !== req.sender && actingFor !== req.sender) {
    throw new Error(`wallet is ${account.address}, the request's sender is ${req.sender} (a controller passes actingFor)`);
  }
  const payload = bytesToHex(packString(editionApproveRequestText(domain, req)));
  const res = await client.requestSignPayload({ signingType: "micheline", payload, sourceAddress: account.address });
  return { expires, sig_mode: "tezos_message", public_key: account.publicKey, signature: res.signature };
}

// ---------------------------------------------------------------- blocks (merkle.rs, types.rs)

/** merkle::root over already-hashed 32-byte leaves (hex); odd nodes are promoted. Hex. */
// ---------------------------------------------------------------- time capsules (stations, batch 6)

export const CAPSULE_COMMIT_TAG = "pointcast-chain/capsule/v1";
export const CAPSULE_CONTENT_TAG = "pointcast-chain/capsule-content/v1";
export const CAPSULE_ID_TAG = "pointcast-chain/capsule-id/v1";
/** A capsule salt is 16..=64 bytes (capsule.rs MIN_SALT_LEN, MAX_SALT_LEN). */
export const CAPSULE_SALT_LEN = Object.freeze({ min: 16, max: 64 });

/**
 * What a capsule's post is (capsule.rs content_hash):
 * blake2b("pointcast-chain/capsule-content/v1" ‖ str title ‖ body_hash ‖ opt_str media_uri). Hex.
 */
export function capsuleContentHash({ title, body_hash, media_uri = null }) {
  const e = new Enc().str(title).fixed(hash32(body_hash)).optStr(media_uri ?? null);
  return bytesToHex(blake2b256(utf8(CAPSULE_CONTENT_TAG), e.finish()));
}

/** The post rules open_capsule (and publish_block) apply (state.rs check_post, MAX_TITLE_LEN, MAX_URI_LEN). */
export const POST_LIMITS = Object.freeze({ title: 200, media_uri: 512 });

function postText(field, v, max) {
  if (typeof v !== "string" || v.length === 0) throw new RangeError(`${field}: empty (a capsule with it could never open)`);
  if (utf8(v).length > max) throw new RangeError(`${field}: too long, over ${max} bytes (a capsule with it could never open)`);
  if (/\p{Cc}/u.test(v)) throw new RangeError(`${field}: control characters (a capsule with it could never open)`);
}

/**
 * Refuse a capsule that could never open (state.rs check_channel / check_post,
 * the rules seal_capsule and open_capsule apply): a channel that is not
 * [A-Z0-9]{1,16}; a title that is empty, over 200 bytes or has control
 * characters; a media URI that is empty, over 512 bytes, has control
 * characters or no scheme. `post` may be absent when a content hash is given.
 */
export function checkCapsulePost(channel, post) {
  if (typeof channel !== "string" || !/^[A-Z0-9]{1,16}$/.test(channel)) throw new RangeError("channel: must be [A-Z0-9]{1,16} (no seal can use any other)");
  if (!post) return;
  postText("title", post.title, POST_LIMITS.title);
  const uri = post.media_uri ?? null;
  if (uri !== null) {
    postText("media_uri", uri, POST_LIMITS.media_uri);
    if (!uri.includes(":")) throw new RangeError("media_uri: must be a URI with a scheme (a capsule with it could never open)");
  }
}

/**
 * A fresh capsule salt: 32 random bytes from `crypto.getRandomValues`, hex.
 * Store it: without it the capsule never opens, and anyone who has it before
 * `open_at` can check a guess at what the capsule holds.
 */
export function newCapsuleSalt() {
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== "function") throw new ChainError("newCapsuleSalt: no crypto.getRandomValues here; refusing to make a guessable salt");
  return bytesToHex(c.getRandomValues(new Uint8Array(32)));
}

/**
 * The commitment a seal_capsule carries (capsule.rs commitment):
 * blake2b("pointcast-chain/capsule/v1" ‖ str chain_id ‖ genesis ‖ str author ‖
 * str channel ‖ content_hash ‖ bytes salt). `post` is `{title, body_hash,
 * media_uri}` (or give `content_hash`). The salt defaults to
 * {@link newCapsuleSalt} (32 random bytes); a given one is 16..=64 bytes of
 * hex, never all one byte (a constant salt lets anyone test guesses at a
 * guessable post before it opens). A channel or post the chain would refuse
 * is refused here ({@link checkCapsulePost}): such a capsule could never
 * open.
 *
 * Returns `{commitment, salt, capsule}` (hex; `capsule` is the id
 * open_capsule names). **Store the salt: without it the capsule never
 * opens.** Keep it secret until `open_at`.
 */
export function capsuleCommitment(domain, { author, channel, salt, content_hash, ...post }) {
  checkCapsulePost(channel, content_hash === undefined || content_hash === null ? post : null);
  const saltHex = salt === undefined || salt === null ? newCapsuleSalt() : salt;
  const s = hexField("salt", saltHex);
  if (s.length < CAPSULE_SALT_LEN.min || s.length > CAPSULE_SALT_LEN.max) throw new RangeError("salt: must be 16..=64 bytes");
  if (s.every((b) => b === s[0])) throw new RangeError("salt: every byte is the same, so anyone can test guesses at the post before it opens; use newCapsuleSalt()");
  const content = content_hash ?? capsuleContentHash(post);
  const e = new Enc().str(domain.chain_id).fixed(hash32(domain.genesis)).str(author).str(channel).fixed(hash32(content)).bytes(s);
  const commitment = bytesToHex(blake2b256(utf8(CAPSULE_COMMIT_TAG), e.finish()));
  return { commitment, salt: bytesToHex(s), capsule: capsuleId(author, commitment) };
}

/** A capsule's id, what open_capsule names (capsule.rs capsule_id): blake2b("pointcast-chain/capsule-id/v1" ‖ str author ‖ commitment). Hex. */
export function capsuleId(author, commitment) {
  return bytesToHex(blake2b256(utf8(CAPSULE_ID_TAG), new Enc().str(author).fixed(hash32(commitment)).finish()));
}

export function merkleRoot(leavesHex) {
  if (leavesHex.length === 0) return bytesToHex(blake2b256(utf8("pointcast-chain/merkle/empty")));
  let level = leavesHex.map(hash32);
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) next.push(i + 1 < level.length ? merkleNode(level[i], level[i + 1]) : level[i]);
    level = next;
  }
  return bytesToHex(level[0]);
}

/** A block's tx_root: merkle root of leaf(txid) per signed tx, in block order. Hex. */
export function txRoot(signedTxs) {
  return merkleRoot(signedTxs.map((s) => bytesToHex(merkleLeaf(hexToBytes(txHash(s))))));
}

/** Header::hash (everything except the seal). Hex. */
export function blockHeaderHash(h) {
  return bytesToHex(headerHash(h));
}

/** Header::seal_digest: what the sequencer signs, bound to the genesis. Hex. */
export function sealDigest(h, genesis) {
  return bytesToHex(blake2b256(utf8("pointcast-chain/seal/v2"), hash32(genesis), headerHash(h)));
}

// ---------------------------------------------------------------- drops

/** drop ids: 1..64 bytes of [a-z0-9_-] (chain-core check_slug). */
export const DROP_ID_RE = /^[a-z0-9_-]{1,64}$/;

/** null if `id` is a valid drop id, else the reason (same words as the chain). */
export function checkDropId(id) {
  if (typeof id !== "string" || id.length === 0) return "empty";
  if (utf8(id).length > 64) return "too long";
  if (/[\u0000-\u001f\u007f-\u009f]/.test(id)) return "control characters";
  if (!DROP_ID_RE.test(id)) return "must be [a-z0-9_-]";
  return null;
}

/** A gallery drop id from a collection and artwork id, e.g. `pc-art-v2-07`. */
export function artDropId(collection, artworkId) {
  const slug = `${collection}-${artworkId}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const why = checkDropId(slug);
  if (why) throw new Error(`drop id ${JSON.stringify(slug)}: ${why}`);
  return slug;
}

// ---------------------------------------------------------------- Merkle proofs and claims

const merkleLeaf = (data) => blake2b256(Uint8Array.of(0), data);
const merkleNode = (l, r) => blake2b256(Uint8Array.of(1), l, r);

/** chain-proof path::root_from_path: the root, or null for a malformed path. */
function rootFromPath(leaf, index, leafCount, siblings) {
  if (!Number.isSafeInteger(index) || !Number.isSafeInteger(leafCount)) return null;
  if (leafCount === 0 || index >= leafCount || index < 0) return null;
  let i = 0;
  while (leafCount > 1) {
    if (index % 2 === 1) {
      if (i >= siblings.length) return null;
      leaf = merkleNode(hash32(siblings[i++]), leaf);
    } else if (index < leafCount - 1) {
      if (i >= siblings.length) return null;
      leaf = merkleNode(leaf, hash32(siblings[i++]));
    }
    index = Math.floor(index / 2);
    leafCount = Math.ceil(leafCount / 2);
  }
  return i === siblings.length ? leaf : null;
}

/** Canonical bytes of an account (state.rs `impl Encode for Account`). */
export function encodeAccount(a) {
  const e = new Enc().str(a.address);
  if (a.kind.type === "human") e.u8(0);
  else if (a.kind.type === "agent") e.u8(1).str(a.kind.owner).str(a.kind.name).bytes(hexToBytes(a.kind.public_key));
  else throw new Error("unknown account kind");
  e.u64(a.balance).u64(a.nonce).u64(a.posts).u64(a.drum_sessions).u64(a.taps).u32(a.agents)
    .u64(a.tap_window).u32(a.taps_in_window).u64(a.epoch).u64(a.issued_in_epoch).u64(a.drum_until_ms);
  const ids = Object.keys(a.drops || {}).sort(byteOrder);
  e.u32(ids.length);
  for (const id of ids) e.str(id).u32(a.drops[id]);
  return e.finish();
}

export function accountLeaf(a) {
  return bytesToHex(merkleLeaf(encodeAccount(a)));
}

function verifyAccountProof(p, stateRoot) {
  const accounts = rootFromPath(merkleLeaf(encodeAccount(p.account)), p.index, p.leaf_count, p.siblings || []);
  if (!accounts) throw new Error("invalid Merkle path");
  const supply = new Enc().u64(p.total_supply).finish();
  const root =
    p.ext === null || p.ext === undefined
      ? blake2b256(utf8("pointcast-chain/state/v2"), accounts, hash32(p.drops_root), hash32(p.attestors_root), supply)
      : blake2b256(utf8("pointcast-chain/state/v3"), accounts, hash32(p.drops_root), hash32(p.attestors_root), hash32(p.ext), supply);
  if (bytesToHex(root) !== stateRoot.toLowerCase()) throw new Error("state root mismatch");
  return p.account;
}

function verifyBalanceProof(proof, stateRoot) {
  if (proof.type === "present") {
    const a = verifyAccountProof(proof.value, stateRoot);
    return { address: a.address, exists: true, account: a };
  }
  if (proof.type === "absent") {
    const { target, left, right } = proof.value;
    if (left && byteOrder(verifyAccountProof(left, stateRoot).address, target) >= 0) throw new Error("invalid absence neighbours");
    if (right && byteOrder(verifyAccountProof(right, stateRoot).address, target) <= 0) throw new Error("invalid absence neighbours");
    let ok;
    if (left && right) ok = left.leaf_count === right.leaf_count && left.index + 1 === right.index;
    else if (right) ok = right.index === 0;
    else if (left) ok = left.index + 1 === left.leaf_count;
    else throw new Error("empty-tree absence has no state commitment witness");
    if (!ok) throw new Error("invalid absence neighbours");
    return { address: target, exists: false, account: null };
  }
  throw new Error("unknown proof type");
}

function headerHash(h) {
  const e = new Enc().u64(h.height).fixed(hash32(h.prev_hash)).u64(h.timestamp).fixed(hash32(h.tx_root)).fixed(hash32(h.state_root));
  return blake2b256(utf8("pointcast-chain/header/v1"), e.finish());
}

function anchorDigest(a, genesis) {
  const body = new Enc().str(a.chain_id).u64(a.height).fixed(hash32(a.block_hash)).fixed(hash32(a.state_root)).finish();
  return blake2b256(utf8("pointcast-chain/anchor/v2"), hash32(genesis), body);
}

/** Ed25519 verify through WebCrypto: true/false, or null where unsupported. */
export async function verifyEd25519(pkHex, msg, sigHex) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) return null;
  try {
    const key = await subtle.importKey("raw", hexToBytes(pkHex), { name: "Ed25519" }, false, ["verify"]);
    return await subtle.verify({ name: "Ed25519" }, key, hexToBytes(sigHex), msg);
  } catch (e) {
    if (e && (e.name === "NotSupportedError" || /Unrecognized|not supported|Algorithm/i.test(String(e.message)))) return null;
    return false;
  }
}

/** The public `--dev` sequencer key: claims sealed by it prove nothing. */
export const DEV_SEQUENCER_KEY = "4558cc0a17d679a9a57057ff93b4efa80fcfb11c0f941cce923baed60c7625a9";

/**
 * Every well-known public dev key (ed25519, hex), the same list as the
 * node's `api_art::KNOWN_DEV_KEY_NAMES` (pinned by the vectors): a chain
 * sealed by any of them is a dev chain, forgeable by anyone.
 */
export const DEV_PUBLIC_KEYS = Object.freeze([
  "186f78d5c8ced1f06aa842917be72a89339cf1fa5aa5791e3f75ff9b88efddf4", // art-house
  DEV_SEQUENCER_KEY, // sequencer
  "054d5d21edb860a193c4b40ed362cb45a3c8816bce327dd93f45ce4f4c4eb31f", // treasury
  "6d522992e29915d1ce8fe55c319f3b1598dc360b882e811c639525c7faf4e616", // alice
  "ae232faf213300fa08827aaae0b4d0587fd08a9afba3cfc3fd25c19408da457a", // bob
  "f990bfbc36355a8e361b77e8fd19a29d3a1cb934831590fd796795671f87064f", // carol
  "633faba9867ffa0562b27632e7de828e280071bd24f932f20f8b31d6773cf675", // frog
  "0e3f9ee71f53b9b173b3e840b26cffe1106a6f1255a6b9e277e3d09e2fd87c35", // sparrow
  "b720d06647dfc2bb70c7a3228704603800f0602b1d7519eff91934976494e01f", // drum-attestor
  "b9553b05383d8710dbc1de79d4991a6c1a9baa339f0ade4b3f3a08ed51095424", // wire-desk
  "380de5f63d5be25121c36b3720a1f382cf2b4d7f079e6ec6262dc6a590ace026", // impostor
  "d23835bf3ffb7109c98948193d3b776ee548ce3a163f65a7baacf0fc64d57913", // gallery-dev
  "48d7867392cd7b986c063402695c685ee6f348670aa435801dc40a42f9ae050e", // mike-kukai
  "ec4de4e7f354b87088e85ee383ee35837b635e62a057005c7a3001178df39fe9", // mallory
  "b960b8e2ec7da201a9f3c18ee207efd477d852958ad36f1cd3e748dbe99d6c42", // presence-issuer
  "0e9d673c00035e73ae743da7e5f72a3b0ae26e61336f21798e6c4c52331d8767", // presence-admin
  // reserved for later Town Network lanes (docs/TAGS.md)
  "76e9cfd6eba85b0b85e5c364376af58a1bb377f88254824f7625e904f49f469b", // sequencer-admin
  "fbb7ffb601b3ac0986e8304315c9be5352376076d44c4c0f52514799a56b5463", // sequencer-next
  "77aac91478553b0041e749de12db5b4e2a9f1736072c10f4a62b7e3317d29f4a", // edition-admin
  "7871cd4990ae944b8fea3d42646fca9faff753405e27ffb4f0553702f67e225c", // edition-attestor
  "577aaf28a1192a79fabee129d5859586f12dd0c8c38b005b4243e911aea75973", // alice-laptop
  "1243700aa9a6e25efe44171af010b4b0032417db5687a2dc7de2d44c03a29b99", // oracle-a
  "103d4ad86e0f5b245ea4be67a5d055f722e5ed46ae95e71471c004be6b186a4c", // oracle-b
  "5674558805701bdad189d5bfa364c78a131d316a163c3965ad0aa4cd36b9311f", // oracle-c
  "bea75a68884d26c9a0d184430ad295c32337655a97b5c91683e6bdcfefa0a689", // oracle-house
  "4c45e92fa4592a3b5a52595f601cd346bceeed7b45b2cdf3a8a0a277a1a8643b", // oracle-admin
  "cc56a3dfa1b0880b2e97477d2fbf1e75b999f3f818d46b7296981de902d67aed", // market-admin
  "0f1c753d097ec74018c0e2c91b42fd25d31149aed00f125912a2d30fa34d4f7f", // witness-1
  "04e588e99e990f4ef6dc4c3100efa31b606cba3db2229d07f8f8ad6cbd9dc3d4", // witness-2
  "f8c00ff8498061cf72a4e34dc635d207442edeae92e18c60c5d7ffb0da2b1224", // witness-3
]);
const DEV_KEY_SET = new Set(DEV_PUBLIC_KEYS);

/** Why a key-proof claim is conditional: chain-proof's KEY_PROOF_CONDITION, word for word. */
export const KEY_PROOF_CONDITION =
  "the sealing key at this height comes from the claim's key_proof, which cannot show that it omits no rotation: compare the anchor with your own node or replica (or an anchored state from one) before relying on it";

const ED25519_D = 37095705934669439343138083508754565189542113879843219016388785533085940283555n;
// modPow is shared with the P-256 helpers above (one definition; both packages added one).
/** crypto.rs is_well_formed (ed25519): 32 bytes that decompress to a curve point (y read mod p, either sign bit). */
function isEd25519Point(b) {
  if (!(b instanceof Uint8Array) || b.length !== 32) return false;
  let y = 0n;
  for (let i = 31; i >= 0; i--) y = (y << 8n) | BigInt(i === 31 ? b[i] & 0x7f : b[i]);
  y %= P25519;
  const yy = (y * y) % P25519;
  const u = (yy - 1n + P25519) % P25519;
  const v = (ED25519_D * yy + 1n) % P25519;
  const x2 = (u * modPow(v, P25519 - 2n, P25519)) % P25519;
  return x2 === 0n || modPow(x2, (P25519 - 1n) / 2n, P25519) === 1n;
}

// sequencer.rs SequencerState over hex ed25519 keys: {history: [{key, at}], pending}.
const seqKeyAt = (seq, genesisKey, h) => {
  if (seq.pending && seq.pending.at <= h) return seq.pending.key;
  for (let i = seq.history.length - 1; i >= 0; i--) if (seq.history[i].at <= h) return seq.history[i].key;
  return genesisKey;
};
const seqCancels = (seq, genesisKey, h, key) => !!seq.pending && seq.pending.at > h && key === seqKeyAt(seq, genesisKey, h);

/**
 * chain-core `KeyProof::schedule` plus chain-proof's height rule: replay the
 * key proof's rotations against the genesis params (each block sealed by the
 * key the schedule gives at its height, its body the sealed one, each
 * rotate_sequencer sent and signed by the sequencer admin and valid by
 * check_rotation). Throws on anything chain-core refuses. `unchecked` names a
 * signature this runtime could not check (no WebCrypto Ed25519, a secp256k1
 * admin, another sig mode): the result then cannot count as verified.
 */
async function keyProofSchedule(params, keyProof, genesis, height) {
  const keys = params.launch.keys;
  const domain = { chain_id: params.chain_id, genesis };
  const genesisKey = parsePublicKey(params.sequencer).bytes;
  const admin = keys.sequencer_admin;
  const adminHuman = addressKind(admin) === "tz1" || addressKind(admin) === "tz2";
  const roles = [admin, params.launch.presence && params.launch.presence.admin, params.launch.editions && params.launch.editions.admin].filter(Boolean);
  const seq = { history: [], pending: null };
  const blocks = keyProof && Array.isArray(keyProof.blocks) ? keyProof.blocks : null;
  if (!blocks) throw new Error("key_proof has no blocks");
  if (blocks.some((b) => toU64(b.header.height) > height)) throw new Error("a key_proof block lies above the claim height");
  let rotations = 0, last = 0n, unchecked = null;
  for (const b of blocks) {
    const h = toU64(b.header.height);
    if (h === 0n || h <= last) throw new Error(`key proof block #${h} is not above the one before it`);
    last = h;
    const seal = await verifyEd25519(seqKeyAt(seq, genesisKey, h), blake2b256(utf8("pointcast-chain/seal/v2"), hash32(genesis), headerHash(b.header)), b.header.sequencer_sig);
    if (seal === false) throw new Error(`key proof block #${h} is not sealed by the key active at its height`);
    if (seal === null) unchecked = "this runtime has no WebCrypto Ed25519, so the key proof's seals were not checked";
    if (!Array.isArray(b.txs)) throw new Error(`key proof block #${h} has no txs list`);
    // Every tx must be one this SDK can encode exactly (its kind and its sig
    // mode), or the tx_root below would be computed over the wrong bytes:
    // a block it cannot encode is refused, never read as best it can.
    for (const stx of b.txs) {
      try { sigModeByte(stx && stx.sig_mode); } catch (e) { throw new Error(`key proof block #${h}: ${e.message}, which this SDK cannot encode`); }
    }
    if (txRoot(b.txs) !== String(b.header.tx_root).toLowerCase()) throw new Error(`key proof block #${h}: its txs do not match its sealed tx_root`);
    for (const stx of b.txs) {
      if (!stx || !stx.tx || stx.tx.type !== "rotate_sequencer") continue;
      if (stx.tx.sender !== admin) throw new Error("not sent by the sequencer admin");
      const mode = stx.sig_mode ?? "raw";
      if (mode !== "raw" && mode !== "tezos_message") {
        // Another sig mode (a passkey, say): this SDK can neither tie its key
        // to the admin nor check its signature, so the rotation, and with it
        // the sealing key, stays unchecked (never verified, never guessed).
        unchecked = `a rotation in the key proof is signed in sig_mode ${String(mode)}, which this SDK cannot check`;
      } else {
        const pk = parsePublicKey(stx.public_key);
        if (!adminHuman || tezosAddress(pk) !== admin) throw new Error("the signing key does not control the admin");
        const digest = mode === "raw" ? signingHash(stx.tx, domain)
          : walletSignedDigest(walletText(stx.tx, domain, Number(keys.wallet_text_version)));
        if (pk.scheme !== "ed25519") unchecked = "a rotation in the key proof is signed by a secp256k1 admin key, which this SDK cannot check";
        else {
          const ok = await verifyEd25519(pk.bytes, hexToBytes(digest), parseSignature(stx.signature).bytes);
          if (ok === false) throw new Error("the admin's signature does not verify");
          if (ok === null) unchecked = "this runtime has no WebCrypto Ed25519, so the key proof's rotations were not checked";
        }
      }
      // check_rotation
      const nk = ed25519KeyBytes("new_key", stx.tx.new_key);
      if (!isEd25519Point(nk)) throw new Error("invalid new_key: not an ed25519 key");
      if (isWeakEd25519Key(nk)) throw new Error("invalid new_key: a small-order (weak) ed25519 point");
      if (roles.includes(tezosAddress({ scheme: "ed25519", bytes: bytesToHex(nk) }))) {
        throw new Error("invalid new_key: is the key of the sequencer admin, presence admin or editions admin");
      }
      const earliest = h + toU64(keys.rotation_delay_blocks);
      if (earliest > 0xffffffffffffffffn) throw new Error("invalid activate_at: the rotation notice overflows");
      const at = toU64(stx.tx.activate_at);
      if (at < earliest) throw new Error(`rotation too soon: earliest ${earliest}`);
      const key = bytesToHex(nk);
      const cancels = seqCancels(seq, genesisKey, h, key);
      if (key === seqKeyAt(seq, genesisKey, h) && !cancels) throw new Error("invalid new_key: is already the active sequencer key, and no rotation is pending to cancel");
      if (cancels) seq.pending = null;
      else {
        if (seq.pending && seq.pending.at <= h) seq.history.push(seq.pending);
        seq.pending = { key, at };
      }
      rotations++;
    }
  }
  return { keyAt: (x) => seqKeyAt(seq, genesisKey, x), rotations, unchecked };
}

/**
 * Verify a portable claim (`/account/{a}/drops` → `claim`, `/proof/claim/{a}`,
 * or `pointcast-node prove`) against genesis `params`. Async (WebCrypto).
 *
 * Returns `{ok, verified, signature, devKeys, conclusive, kind, chainId,
 * genesisHash, height, stateRoot, address, exists, balance, drops, account,
 * keyProofRotations?, conditionalOn?, reason?}`.
 * `ok` = every structural and Merkle check passed; `verified` = ok AND the
 * sequencer seal checked out (false when WebCrypto lacks Ed25519) AND the
 * result is conclusive.
 *
 * On params with a keys record (launch record 2) the sequencer key can
 * rotate, so the claim must carry `key_proof` (the sealed blocks at or below
 * its height that carry rotations), exactly as chain-proof requires: the
 * seal is checked with the key that proof's schedule names. Such a result is
 * CONDITIONAL: `ok: true` and `signature: "valid"` (chain-proof's Ok), but
 * `conclusive: false` and `verified: false`, with `conditionalOn` saying why
 * (a key proof cannot show that it omits no rotation), as `pointcast-node
 * verify-claim` says CONDITIONAL and exits 2. A key_proof on params without a
 * keys record is refused. Every decision and reason matches chain-proof on
 * sdk/test/key-proof-vectors.json.
 */
export async function verifyClaim(claim, params, { genesisHash } = {}) {
  const out = { ok: false, verified: false, signature: "unchecked", devKeys: false, conclusive: true };
  try {
    const seq = parsePublicKey(params.sequencer);
    if (seq.scheme !== "ed25519" || !isValidChainId(params.chain_id)) throw new Error("invalid genesis params");
    const genesis = paramsHash(params);
    if (genesisHash && genesis !== genesisHash.toLowerCase()) throw new Error("params do not hash to the pinned genesis");
    out.devKeys = DEV_KEY_SET.has(seq.bytes);
    out.genesisHash = genesis;
    out.chainId = params.chain_id;
    if (claim.chain_id !== params.chain_id) throw new Error("chain id mismatch");
    let root, digest, sig;
    if (claim.anchor) {
      out.kind = "anchor";
      const interval = toU64(params.anchor_interval);
      const h = toU64(claim.height);
      if (claim.anchor.chain_id !== params.chain_id) throw new Error("chain id mismatch");
      if (toU64(claim.anchor.height) !== h || interval === 0n || h === 0n || h % interval !== 0n) {
        throw new Error("height mismatch or invalid anchor height");
      }
      root = claim.anchor.state_root;
      digest = anchorDigest(claim.anchor, genesis);
      sig = claim.seq_sig;
    } else if (claim.header) {
      out.kind = "header";
      if (toU64(claim.height) === 0n || toU64(claim.height) !== toU64(claim.header.height)) throw new Error("height mismatch");
      root = claim.header.state_root;
      digest = blake2b256(utf8("pointcast-chain/seal/v2"), hash32(genesis), headerHash(claim.header));
      sig = claim.header.sequencer_sig;
    } else {
      throw new Error("not a claim (no anchor or header)");
    }
    // The key that sealed this height (chain-proof sealing_key): the genesis
    // sequencer, or on a keys-record chain the claim's key proof's schedule.
    const keysRecord = !!params.launch && params.launch.keys !== undefined && params.launch.keys !== null;
    const keyProof = claim.key_proof ?? null;
    let sealer = seq.bytes, schedule = null;
    if (!keysRecord && keyProof !== null) throw new Error("a claim on params without a keys record carries no key_proof");
    if (keysRecord) {
      if (keyProof === null) throw new Error("claims on rotating-key chains need key_proof (the sealed blocks that carry rotations)");
      try {
        schedule = await keyProofSchedule(params, keyProof, genesis, toU64(claim.height));
      } catch (e) {
        out.keyProofError = e.message || String(e);
        throw new Error("key_proof does not establish the sealing key at the claim height");
      }
      sealer = schedule.keyAt(toU64(claim.height));
    }
    const r = verifyBalanceProof(claim.proof, root);
    Object.assign(out, {
      height: Number(claim.height),
      stateRoot: root,
      address: r.address,
      exists: r.exists,
      account: r.account,
      balance: r.account ? r.account.balance : 0,
      drops: r.account ? { ...(r.account.drops || {}) } : {},
    });
    const good = await verifyEd25519(sealer, digest, sig);
    if (good === false) throw new Error("invalid genesis-bound sequencer signature");
    out.signature = good ? "valid" : "unchecked";
    out.ok = true;
    out.verified = good === true;
    if (!good) out.reason = "this runtime has no WebCrypto Ed25519; the Merkle proof checked out but the sequencer seal was not checked";
    if (schedule) {
      // chain-proof's Ok, conditional: `ok` and the seal stand, but it is not
      // `verified` (what pages go green on), as `pointcast-node verify-claim`
      // says CONDITIONAL and exits 2.
      out.keyProofRotations = schedule.rotations;
      out.conclusive = false;
      out.conditionalOn = KEY_PROOF_CONDITION;
      out.verified = false;
      // A seal or rotation signature in the key proof that this runtime could
      // not check leaves the sealing key unproven: the seal's "valid" would
      // rest on it, so the signature reads unchecked.
      if (schedule.unchecked) out.signature = "unchecked";
      out.reason = schedule.unchecked || `CONDITIONAL: ${KEY_PROOF_CONDITION}`;
    }
    if (out.devKeys) out.warning = "DEV CHAIN: sealed by the public dev sequencer key; anyone can forge this, it proves nothing";
  } catch (e) {
    out.ok = false;
    out.verified = false;
    out.reason = e.message || String(e);
  }
  return out;
}

/**
 * Does the claim prove `address` holds at least `min` editions of `dropId`?
 * `verifiedHolder` is what a gallery may badge, and only when all hold:
 * a `dropId` was named (anyone can create a drop and mint to anyone, so
 * "holds some edition" means nothing), `genesisHash` was pinned by the
 * caller (params fetched from the same node prove nothing), the seal
 * verified, it is not a dev chain, right address, enough editions.
 * `holderReason` says why not. The claim proves editions under the drop id;
 * it does not prove who created the drop (pin the creator in your config).
 */
export async function verifyOwnership(claim, params, { genesisHash, address, dropId, min = 1 } = {}) {
  const r = await verifyClaim(claim, params, { genesisHash });
  const editions = dropId ? (r.drops && r.drops[dropId]) || 0 : Object.values(r.drops || {}).reduce((a, b) => a + b, 0);
  const rightAddress = !address || r.address === address;
  if (r.ok && !rightAddress) r.reason = `claim is about ${r.address}, not ${address}`;
  const holderReason = !dropId ? "no dropId: holding some edition of some drop is not a holder badge"
    : !genesisHash ? "genesis not pinned: pass the genesisHash from your config (connect with expect.genesisHash)"
    : !r.verified ? r.reason || "claim not verified"
    : r.conclusive === false ? `conditional: ${r.conditionalOn}`
    : r.devKeys ? "dev chain: proves nothing"
    : !rightAddress ? r.reason
    : editions < min ? `holds ${editions} of ${dropId}, fewer than ${min}`
    : undefined;
  return {
    ...r,
    editions,
    holds: r.ok && rightAddress && editions >= min,
    verifiedHolder: holderReason === undefined,
    ...(holderReason ? { holderReason } : {}),
  };
}

/** Decode a claim's account without checking anything (label it unverified). */
export function holdingsFromClaim(claim) {
  const p = claim && claim.proof;
  const a = p && p.type === "present" ? p.value.account : null;
  return { verified: false, address: a ? a.address : p && p.value && p.value.target, drops: a ? { ...a.drops } : {} };
}

// ---------------------------------------------------------------- dev wallet (local --dev chains only)

const PKCS8_ED25519 = hexToBytes("302e020100300506032b657004220420");

function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/**
 * A Beacon-shaped wallet backed by a PUBLIC dev key (seed =
 * blake2b("pointcast-dev/<name>"), the node's `dev_key`). For local `--dev`
 * chains and tests only: `signWithBeacon` refuses it on any other chain.
 */
export async function devWallet(name) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) throw new Error("devWallet needs WebCrypto");
  const seed = blake2b256(utf8("pointcast-dev/"), utf8(name));
  const key = await subtle.importKey("pkcs8", concat(PKCS8_ED25519, seed), { name: "Ed25519" }, true, ["sign"]);
  const jwk = await subtle.exportKey("jwk", key);
  const pkHex = bytesToHex(b64urlToBytes(jwk.x));
  const publicKey = publicKeyToB58({ scheme: "ed25519", bytes: pkHex });
  const address = tezosAddress({ scheme: "ed25519", bytes: pkHex });
  return {
    isDevWallet: true,
    name,
    /** The raw ed25519 public key (hex) and the pca1 address it would have as an agent. */
    publicKeyHex: pkHex,
    agentAddress: agentAddress({ scheme: "ed25519", bytes: pkHex }),
    /** True when this name's key is one of the well-known DEV_PUBLIC_KEYS. */
    wellKnown: DEV_KEY_SET.has(pkHex),
    async getActiveAccount() {
      return { address, publicKey };
    },
    async requestSignPayload({ payload }) {
      const sig = new Uint8Array(await subtle.sign({ name: "Ed25519" }, key, blake2b256(hexToBytes(payload))));
      return { signature: signatureToB58(bytesToHex(sig), "ed25519"), signingType: "micheline" };
    },
    /** Raw mode: sign a 32-byte digest (hex) directly; agents, co-signers, room servers, issuers. Hex signature. */
    async signDigest(digestHex) {
      const d = hash32(digestHex);
      return bytesToHex(new Uint8Array(await subtle.sign({ name: "Ed25519" }, key, d)));
    },
  };
}

// ---------------------------------------------------------------- device passes (launch record 6)

/**
 * A `{get, put, delete}` store over IndexedDB (database `dbName`, one
 * object store), or null where there is none (Node, some private modes).
 * IndexedDB keeps a CryptoKey by structured clone, so a non-extractable
 * private key survives a reload without its bytes ever being readable.
 */
export function indexedDbStore(dbName = "pointcast-device-passes") {
  const idb = globalThis.indexedDB;
  if (!idb || typeof idb.open !== "function") return null;
  const open = () =>
    new Promise((resolve, reject) => {
      const req = idb.open(dbName, 1);
      req.onupgradeneeded = () => req.result.createObjectStore("passes");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  const run = async (mode, fn) => {
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const req = fn(db.transaction("passes", mode).objectStore("passes"));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  };
  return {
    get: (k) => run("readonly", (s) => s.get(k)).then((v) => v ?? null),
    put: (k, v) => run("readwrite", (s) => s.put(v, k)),
    delete: (k) => run("readwrite", (s) => s.delete(k)),
  };
}

/** Pass keys kept for this process only, where there is no IndexedDB and no `store`. */
const PASS_MEMORY = new Map();

/**
 * This device's pass key (launch record 6, `set_session_key`): a raw
 * Ed25519 key generated **non-extractable** with WebCrypto, so script on
 * the page can sign with it while the page is open, but no one (an XSS
 * included) can read the private key out and keep signing elsewhere until
 * expiry. Kept in IndexedDB where available (`indexedDbStore`), under
 * `name`; otherwise only for this process, unless you pass a `store`
 * (`{get, put, delete}`, async or not) that can hold a CryptoKey.
 *
 * Returns `{ isDevicePass, name, publicKeyHex, publicKey, publicKeyB58,
 * extractable, signDigest(hex), forget() }`: list `publicKeyHex` with a
 * `set_session_key` from the account (approved once in its wallet), then
 * sign that account's taps, drums and posts with
 * `client.signWithDevicePass(pass, prepared)`.
 */
export async function devicePass({ name = "default", store } = {}) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) throw new Error("devicePass needs WebCrypto");
  const kv = store || indexedDbStore() || {
    get: (k) => PASS_MEMORY.get(k) ?? null,
    put: (k, v) => void PASS_MEMORY.set(k, v),
    delete: (k) => void PASS_MEMORY.delete(k),
  };
  let rec = await kv.get(name);
  if (!rec || !rec.privateKey || !/^[0-9a-f]{64}$/.test(String(rec.publicKeyHex))) {
    const kp = await subtle.generateKey({ name: "Ed25519" }, false, ["sign", "verify"]);
    const raw = new Uint8Array(await subtle.exportKey("raw", kp.publicKey));
    rec = { privateKey: kp.privateKey, publicKeyHex: bytesToHex(raw) };
    await kv.put(name, rec);
  }
  const { privateKey, publicKeyHex } = rec;
  if (privateKey.extractable) throw new Error("devicePass: the stored private key is extractable; forget() it and make a new pass");
  return {
    isDevicePass: true,
    name,
    publicKeyHex,
    publicKey: { scheme: "ed25519", bytes: publicKeyHex },
    publicKeyB58: publicKeyToB58({ scheme: "ed25519", bytes: publicKeyHex }),
    extractable: false,
    /** Sign a 32-byte digest (hex) raw; a hex signature. */
    async signDigest(digestHex) {
      return bytesToHex(new Uint8Array(await subtle.sign({ name: "Ed25519" }, privateKey, hash32(digestHex))));
    },
    /** Drop the key from its store (revoke it on chain with clear_session_key too). */
    async forget() {
      await kv.delete(name);
    },
  };
}

// ---------------------------------------------------------------- client

class ChainError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "PointcastChainError";
    this.details = details;
  }
}
export { ChainError };

const NO_NODE = Object.freeze({ status: "no_node" });

/**
 * Connect to a pointcast-chain node. Checks that `/params` hashes to the
 * node's genesis and, if given, that both match `expect.chainId` /
 * `expect.genesisHash` (pin these in your gallery config). With `api` null,
 * returns a client whose calls resolve `{status: "no_node"}` (no public
 * node yet).
 */
export async function connect(api, { expect = {}, fetch: f } = {}) {
  if (!api) return new NoNode();
  const doFetch = f || globalThis.fetch.bind(globalThis);
  const base = String(api).replace(/\/+$/, "");
  const get = async (path) => {
    const r = await doFetch(base + path);
    let j = null;
    try {
      j = parseJsonExact(await r.text());
    } catch {
      j = null;
    }
    if (!r.ok) throw new ChainError((j && j.error) || `${r.status} ${path}`, j);
    return j;
  };
  const status = await get("/status");
  const params = await get("/params");
  const genesis = paramsHash(params);
  if (genesis !== status.genesis_hash) throw new ChainError("node params do not hash to its genesis_hash");
  if (expect.chainId && status.chain_id !== expect.chainId) {
    throw new ChainError(`chain id ${status.chain_id}, expected ${expect.chainId}`);
  }
  if (expect.genesisHash && genesis !== expect.genesisHash.toLowerCase()) {
    throw new ChainError(`genesis ${genesis}, expected ${expect.genesisHash}`);
  }
  return new PointcastChain(base, doFetch, status, params, expect.genesisHash ? genesis : null);
}

class NoNode {
  constructor() {
    this.node = null;
  }
  async status() { return NO_NODE; }
  async listDrops() { return NO_NODE; }
  async getDrop() { return NO_NODE; }
  async getMints() { return NO_NODE; }
  async getHoldings() { return NO_NODE; }
}

export class PointcastChain {
  constructor(base, fetch, status, params, pinnedGenesis = null) {
    this.node = base;
    /** The genesis the caller pinned at connect, or null (then nothing badges). */
    this.pinnedGenesis = pinnedGenesis;
    this.pinned = pinnedGenesis !== null;
    this._fetch = fetch;
    this.params = params;
    this.domain = domainOf(status.chain_id, status.genesis_hash);
    this.chainId = status.chain_id;
    this.genesisHash = status.genesis_hash;
    /** A public dev key is in the sequencer schedule (genesis or any rotation `/status` names). */
    this.devKeys = isDevChain(params, status);
    this.lastStatus = status;
  }

  async _req(path, body) {
    // Exact both ways: a u64 above 2^53 is written as its digits and read
    // back as a BigInt, never rounded through a double (AS-05).
    const init = body === undefined ? {} : { method: "POST", headers: { "content-type": "application/json" }, body: stringifyJsonExact(body) };
    const r = await this._fetch(this.node + path, init);
    const text = await r.text();
    let j = null;
    try {
      j = parseJsonExact(text);
    } catch {
      j = null;
    }
    if (!r.ok) throw new ChainError((j && j.error) || `${r.status} ${path}`, j);
    return j === null ? text : j;
  }

  async status() {
    this.lastStatus = await this._req("/status");
    // Sticky: once a dev key is in the schedule it stays a dev chain.
    this.devKeys = this.devKeys || isDevChain(this.params, this.lastStatus);
    return this.lastStatus;
  }

  /** `{drops:[{id, creator, minted, remaining}], next_after, ...}` */
  listDrops({ prefix, creator, after, limit } = {}) {
    const q = new URLSearchParams();
    if (prefix) q.set("prefix", prefix);
    if (creator) q.set("creator", creator);
    if (after) q.set("after", after);
    if (limit) q.set("limit", String(limit));
    const s = q.toString();
    return this._req(`/drops${s ? `?${s}` : ""}`);
  }

  getDrop(id) {
    const why = checkDropId(id);
    if (why) return Promise.reject(new ChainError(`invalid drop id: ${why}`));
    return this._req(`/drop/${id}`);
  }

  getMints(id, { fromSeq, limit } = {}) {
    const why = checkDropId(id);
    if (why) return Promise.reject(new ChainError(`invalid drop id: ${why}`));
    const q = new URLSearchParams();
    if (fromSeq !== undefined) q.set("from_seq", String(fromSeq));
    if (limit) q.set("limit", String(limit));
    const s = q.toString();
    return this._req(`/drop/${id}/mints${s ? `?${s}` : ""}`);
  }

  /**
   * Editions an address holds, with the node's claim checked locally
   * (`verification.verifiedHolder` for a badge: needs `drop` and a genesis
   * pinned at connect). `at`: "tip" | "anchor". `editions` is the node's
   * word; `verification.drops` is what the claim proves.
   */
  async getHoldings(address, { at, height, drop, verify = true } = {}) {
    if (!isAddress(address)) throw new ChainError(`not a pointcast-chain address: ${address}`);
    const q = new URLSearchParams();
    if (at) q.set("at", at);
    if (height !== undefined) q.set("height", String(height));
    if (drop) q.set("drop", drop);
    const s = q.toString();
    const h = await this._req(`/account/${address}/drops${s ? `?${s}` : ""}`);
    if (verify && h.claim) {
      h.verification = await verifyOwnership(h.claim, this.params, {
        genesisHash: this.pinnedGenesis || undefined,
        address,
        dropId: drop,
      });
    }
    return h;
  }

  verifyOwnership(claim, opts = {}) {
    return verifyOwnership(claim, this.params, { genesisHash: this.pinnedGenesis || undefined, ...opts });
  }

  async nextNonce(address) {
    if (!isAddress(address)) throw new ChainError(`not a pointcast-chain address: ${address}`);
    const a = await this._req(`/account/${address}`);
    return a.next_nonce;
  }

  /**
   * An unsigned drop_mint. Refuses to create a drop unless `allowCreate`
   * (the signer would become its creator for good), refuses a drop the
   * sender didn't create, and refuses recipients the chain can't credit.
   */
  async buildDropMint({ sender, dropId, recipient, nonce, allowCreate = false }) {
    const why = checkDropId(dropId);
    if (why) throw new ChainError(`invalid drop id: ${why}`);
    if (!isAddress(sender)) throw new ChainError(`bad sender ${sender}`);
    const rs = recipientStatus(recipient);
    if (rs !== "ok" && rs !== "agent") throw new ChainError(`recipient ${recipient}: ${rs}`);
    const d = await this.getDrop(dropId);
    if (!d.exists && !allowCreate) {
      throw new ChainError(`drop ${dropId} does not exist; minting would create it and make ${sender} its creator (pass allowCreate)`);
    }
    if (d.exists && d.creator !== sender) throw new ChainError(`only the drop creator (${d.creator}) may mint ${dropId}`);
    if (d.exists && d.remaining === 0) throw new ChainError(`drop ${dropId} is sold out`);
    return { sender, nonce: nonce ?? (await this.nextNonce(sender)), type: "drop_mint", drop_id: dropId, recipient };
  }

  /** An unsigned publish_block. With `body` text, stores it (POST /body) and checks the hash. */
  async buildPublish({ sender, channel, title, body, bodyHash: given, mediaUri = null, nonce }) {
    let h = given;
    if (body !== undefined) {
      h = bodyHash(body);
      const r = await this._req("/body", { body });
      if (r.body_hash !== h) throw new ChainError(`node stored the body under ${r.body_hash}, expected ${h}`);
    }
    if (!h) throw new ChainError("pass body or bodyHash");
    return { sender, nonce: nonce ?? (await this.nextNonce(sender)), type: "publish_block", channel, title, body_hash: h, media_uri: mediaUri };
  }

  _local(tx) {
    const text = walletText(tx, this.domain, walletTextVersion(this.params));
    return { digest: signingHash(tx, this.domain), text, payload: bytesToHex(packString(text)) };
  }

  _check(tx, node) {
    const l = this._local(tx);
    const w = node.wallet || {};
    if (node.chain_id !== this.domain.chain_id || node.genesis_hash !== this.domain.genesis
        || node.digest !== l.digest || w.text !== l.text || w.payload !== l.payload) {
      throw new ChainError("node digest ≠ local rebuild — refusing to sign", { node, local: l });
    }
    return {
      tx,
      chainId: this.domain.chain_id,
      genesisHash: this.domain.genesis,
      digest: l.digest,
      wallet: { signing_type: "micheline", text: l.text, payload: l.payload },
    };
  }

  /** POST /tx/digest, then rebuild digest, wallet text and payload locally; throws on any mismatch. */
  async digest(tx) {
    return this._check(tx, await this._req("/tx/digest", tx));
  }

  /** POST /drops/prepare-mint (advisory checks on the node) + the same local rebuild. */
  async prepareDropMint({ sender, dropId, recipient, nonce, create = false }) {
    const r = await this._req("/drops/prepare-mint", { sender, drop_id: dropId, recipient, nonce, create });
    if (!r.ok) throw new ChainError((r.error && r.error.message) || "prepare-mint refused", r);
    if (!r.wallet) throw new ChainError("agent senders sign the raw digest, not in a wallet", r);
    const prepared = this._check(r.tx, { chain_id: r.chain_id, genesis_hash: r.genesis_hash, digest: r.digest, wallet: r.wallet });
    prepared.advisory = r.advisory;
    prepared.wouldCreate = r.would_create;
    return prepared;
  }

  /**
   * How the node says `key` may sign for the tz1/tz2 `sender` on a chain
   * with launch record 6 (`GET /account`): "controller" (listed in its
   * controller set), "pass" (a live device pass, raw only) or null. The
   * node's `/account` has `controllers` only on a record-6 chain.
   */
  async keyRole(sender, key) {
    const pk = parsePublicKey(key);
    const a = await this._req(`/account/${sender}`);
    if (!a || typeof a !== "object" || !Array.isArray(a.controllers)) return null;
    const same = (k) => {
      try {
        const x = parsePublicKey(k && typeof k === "object" && k.key !== undefined ? k.key : k);
        return x.scheme === pk.scheme && x.bytes.toLowerCase() === pk.bytes.toLowerCase();
      } catch {
        return false;
      }
    };
    if (a.controllers.some(same)) return "controller";
    const live = (a.device_passes || []).some((p) => p && p.expired === false && pk.scheme === "ed25519" && String(p.key).toLowerCase() === pk.bytes.toLowerCase());
    return live ? "pass" : null;
  }

  /**
   * Have a Beacon wallet sign `prepared` (from `digest`). Accepts a Beacon
   * DAppClient, a Taquito BeaconWallet (uses `.client`), or `devWallet()`.
   * The payload handed to the wallet is the locally rebuilt one.
   *
   * The wallet is normally the sender itself. On a chain with launch record
   * 6 it may also be one of the sender's controllers (a backup key, a Kukai
   * tz2 acting for a tz1): accepted when the node's `/account` lists its key
   * (`keyRole`), or when you pass `{ actingFor: sender }` (then the node
   * alone decides at submit). The prompt names the account it acts for.
   */
  async signWithBeacon(wallet, prepared, { actingFor } = {}) {
    const client = wallet && wallet.client && wallet.client.requestSignPayload ? wallet.client : wallet;
    if (client.isDevWallet && !this.devKeys) throw new ChainError("devWallet only signs on a --dev chain");
    const local = this._local(prepared.tx);
    if (local.payload !== prepared.wallet.payload) throw new ChainError("prepared payload ≠ local rebuild — refusing to sign");
    const account = await client.getActiveAccount();
    if (!account) throw new ChainError("no wallet connected");
    if (tezosAddress(account.publicKey) !== account.address) throw new ChainError("wallet public key does not match its address");
    const sender = prepared.tx.sender;
    if (account.address !== sender) {
      const human = addressKind(sender) === "tz1" || addressKind(sender) === "tz2";
      const asController = human && (actingFor === sender || (await this.keyRole(sender, account.publicKey)) === "controller");
      if (!asController) throw new ChainError(`wallet is ${account.address}, tx sender is ${sender} (and not one of its controllers)`);
    }
    const res = await client.requestSignPayload({ signingType: "micheline", payload: local.payload, sourceAddress: account.address });
    const signed = { tx: prepared.tx, sig_mode: "tezos_message", public_key: account.publicKey, signature: res.signature };
    const pk = parsePublicKey(account.publicKey);
    if (pk.scheme === "ed25519") {
      const ok = await verifyEd25519(pk.bytes, hexToBytes(walletSignedDigest(local.text)), parseSignature(res.signature).bytes);
      if (ok === false) throw new ChainError("wallet signature does not verify over the payload");
    }
    return signed;
  }

  /**
   * Sign `prepared` (from `digest`) with a `devWallet`, on a dev chain only.
   * Agent (pca1) senders sign the raw digest; tz1 senders sign the wallet
   * payload (tezos_message) unless `mode: "raw"`. The signature is checked
   * locally before it is returned.
   */
  async signWithDevWallet(wallet, prepared, { mode, actingFor } = {}) {
    if (!wallet || !wallet.isDevWallet) throw new ChainError("signWithDevWallet takes a devWallet()");
    if (!this.devKeys) throw new ChainError("devWallet only signs on a --dev chain");
    const local = this._local(prepared.tx);
    if (local.digest !== prepared.digest || local.payload !== prepared.wallet.payload) {
      throw new ChainError("prepared digest ≠ local rebuild — refusing to sign");
    }
    const sender = prepared.tx.sender;
    const kind = addressKind(sender);
    const human = kind === "tz1" || kind === "tz2";
    if (human && mode !== "raw") return this.signWithBeacon(wallet, prepared, { actingFor });
    if (kind === "agent" && wallet.agentAddress !== sender) throw new ChainError(`dev key ${wallet.name} is agent ${wallet.agentAddress}, tx sender is ${sender}`);
    if (!human && kind !== "agent") throw new ChainError(`not a pointcast-chain sender: ${sender}`);
    // Raw for a tz1/tz2: its own key, or (launch record 6) one of its
    // controllers or live device passes, as the node's /account lists them
    // (or `actingFor`, and the node decides).
    if (human && (await wallet.getActiveAccount()).address !== sender) {
      const ok = actingFor === sender || (await this.keyRole(sender, { scheme: "ed25519", bytes: wallet.publicKeyHex })) !== null;
      if (!ok) throw new ChainError(`dev key ${wallet.name} is not ${sender}, nor one of its controllers or device passes`);
    }
    const signature = await wallet.signDigest(local.digest);
    const ok = await verifyEd25519(wallet.publicKeyHex, hexToBytes(local.digest), signature);
    if (ok === false) throw new ChainError("raw signature does not verify over the digest");
    return { tx: prepared.tx, public_key: { scheme: "ed25519", bytes: wallet.publicKeyHex }, signature };
  }

  /**
   * Sign `prepared` (from `digest`) with this device's pass (`devicePass()`,
   * launch record 6): raw, over the tx digest, for the tz1/tz2 account that
   * listed it. Refused unless the node's `/account` lists the pass live for
   * the sender (or you pass `{ actingFor: sender }`; the node then decides).
   * A pass signs only its terms' kinds (tap, drum, post, presence) until it
   * expires: the node refuses anything else. The signature is checked
   * locally before it is returned.
   */
  async signWithDevicePass(pass, prepared, { actingFor } = {}) {
    if (!pass || typeof pass.signDigest !== "function" || !/^[0-9a-f]{64}$/.test(String(pass.publicKeyHex))) {
      throw new ChainError("signWithDevicePass takes a devicePass() (or any {publicKeyHex, signDigest} ed25519 signer)");
    }
    const local = this._local(prepared.tx);
    if (local.digest !== prepared.digest) throw new ChainError("prepared digest ≠ local rebuild — refusing to sign");
    const sender = prepared.tx.sender;
    const kind = addressKind(sender);
    if (kind !== "tz1" && kind !== "tz2") throw new ChainError(`a device pass signs for a tz1/tz2 account, not ${sender}`);
    const pk = { scheme: "ed25519", bytes: pass.publicKeyHex };
    if (actingFor !== sender && (await this.keyRole(sender, pk)) !== "pass") {
      throw new ChainError(`this device's pass is not a live device pass of ${sender} (approve it with set_session_key first)`);
    }
    const signature = await pass.signDigest(local.digest);
    const ok = await verifyEd25519(pass.publicKeyHex, hexToBytes(local.digest), signature);
    if (ok === false) throw new ChainError("raw signature does not verify over the digest");
    return { tx: prepared.tx, public_key: pk, signature };
  }

  /** Run a signed tx through the node's real state machine on a copy of the tip. */
  simulate(signedTx) {
    return this._req("/tx/simulate", signedTx);
  }

  /**
   * When may an open_capsule for capsule `id` be sent? The node's
   * `GET /capsule/{id}` (launch record 13). Resolves the capsule view when
   * the next block may open it; throws a ChainError, sending nothing, when
   * it opens later, has lapsed, or isn't stored at this node (not sealed
   * yet, opened, or pruned). An open is the reveal: sent early, to the
   * mempool, relays and replicas, its salt is burned (stations fix S6).
   */
  async capsuleReady(id) {
    const short = String(id).slice(0, 8);
    let c;
    try {
      c = await this._req(`/capsule/${encodeURIComponent(String(id))}`);
    } catch {
      throw new ChainError(`capsule ${short}… is not on chain at this node (not sealed yet, already opened, or pruned): the open is not sent, its salt stays with you`);
    }
    const next = BigInt(String(c.height)) + 1n;
    if (next < BigInt(String(c.open_at))) throw new ChainError(`capsule ${short}… opens at block ${c.open_at} (the next block is ${next}): the open is not sent, so its salt stays secret until then`, c);
    if (next >= BigInt(String(c.lapses_at))) throw new ChainError(`capsule ${short}… lapsed at block ${c.lapses_at}: it can no longer open`, c);
    return c;
  }

  /**
   * POST /tx; checks the node reports the locally computed tx hash. An
   * open_capsule is sent only once its capsule may open in the next block
   * ({@link PointcastChain#capsuleReady}): never early.
   */
  async submit(signedTx) {
    const local = txHash(signedTx);
    if (signedTx && signedTx.tx && signedTx.tx.type === "open_capsule") await this.capsuleReady(signedTx.tx.capsule);
    const r = await this._req("/tx", signedTx);
    if (r.tx_hash !== local) throw new ChainError(`node reported tx ${r.tx_hash}, expected ${local}`);
    return { txHash: local, status: r.status };
  }

  /** Poll `/tx/{hash}` until included (resolves) or rejected / timeout (throws). */
  async waitForTx(hash, { timeoutMs = 60_000, intervalMs = 1_500 } = {}) {
    if (typeof hash !== "string" || !/^[0-9a-fA-F]{64}$/.test(hash)) throw new ChainError(`not a tx hash: ${hash}`);
    // A NaN deadline would never pass: poll forever.
    if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs) || timeoutMs < 0) throw new ChainError(`timeoutMs must be a finite number ≥ 0, got ${timeoutMs}`);
    if (typeof intervalMs !== "number" || !Number.isFinite(intervalMs) || intervalMs < 0) throw new ChainError(`intervalMs must be a finite number ≥ 0, got ${intervalMs}`);
    const end = Date.now() + timeoutMs;
    let last = null;
    for (;;) {
      last = await this._req(`/tx/${hash}`);
      if (last.status === "included") return last;
      if (last.status === "rejected") throw new ChainError(`rejected: ${last.reason}`, last);
      if (Date.now() >= end) throw new ChainError(`still ${last.status} after ${timeoutMs} ms`, last);
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

/** Canonical, honest strings for a certificate's state (gallery copy). */
export function certificateCopy(status) {
  switch (status) {
    case "no_node":
      return "PointCast chain: local rehearsal only. No certificates are issued or promised.";
    case "minted":
    case "receipted":
      return "First-collector certificate on PointCast chain (free, non-transferable; it does not follow a Tezos resale).";
    case "pending":
      return "Certificate pending on PointCast chain. Your Tezos purchase is complete either way.";
    case "parked_recipient":
      return "Your Tezos wallet type can't hold a PointCast chain certificate (tz1/tz2 only). Your Tezos purchase is complete.";
    case "dev":
      return "DEV CHAIN: this certificate is a local test and proves nothing.";
    default:
      return "The Tezos token is the only thing sold. The PointCast chain certificate is a free extra.";
  }
}

// ---------------------------------------------------------------- exact JSON (AS-05)

/**
 * JSON.parse, except an integer literal that is not a safe integer becomes
 * an exact BigInt instead of a rounded double. Strings, other numbers,
 * nesting and errors behave like JSON.parse. Read node JSON with this.
 */
export function parseJsonExact(text) {
  if (typeof text !== "string") throw new TypeError("parseJsonExact: expected a string");
  const NUM = /-?(?:0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/y;
  let i = 0;
  const fail = (what) => {
    throw new SyntaxError(`JSON: ${what} at position ${i}`);
  };
  const ws = () => {
    for (let c = text.charCodeAt(i); c === 32 || c === 10 || c === 13 || c === 9; c = text.charCodeAt(++i));
  };
  const str = () => {
    const start = i;
    let plain = true;
    for (i++; ; i++) {
      const c = text.charCodeAt(i);
      if (c === 34) break;
      if (c === 92) {
        plain = false;
        i++;
      } else if (c < 32 || Number.isNaN(c)) fail("bad or unterminated string");
    }
    i++;
    return plain ? text.slice(start + 1, i - 1) : JSON.parse(text.slice(start, i));
  };
  const val = () => {
    ws();
    const c = text.charCodeAt(i);
    if (c === 34) return str();
    if (c === 123) {
      const o = {};
      i++;
      ws();
      if (text.charCodeAt(i) === 125) {
        i++;
        return o;
      }
      for (;;) {
        ws();
        if (text.charCodeAt(i) !== 34) fail("expected a key");
        const k = str();
        ws();
        if (text.charCodeAt(i) !== 58) fail("expected ':'");
        i++;
        const v = val();
        if (k === "__proto__") Object.defineProperty(o, k, { value: v, writable: true, enumerable: true, configurable: true });
        else o[k] = v;
        ws();
        const d = text.charCodeAt(i);
        if (d === 44) {
          i++;
          continue;
        }
        if (d === 125) {
          i++;
          return o;
        }
        fail("expected ',' or '}'");
      }
    }
    if (c === 91) {
      const a = [];
      i++;
      ws();
      if (text.charCodeAt(i) === 93) {
        i++;
        return a;
      }
      for (;;) {
        a.push(val());
        ws();
        const d = text.charCodeAt(i);
        if (d === 44) {
          i++;
          continue;
        }
        if (d === 93) {
          i++;
          return a;
        }
        fail("expected ',' or ']'");
      }
    }
    if (text.startsWith("true", i)) {
      i += 4;
      return true;
    }
    if (text.startsWith("false", i)) {
      i += 5;
      return false;
    }
    if (text.startsWith("null", i)) {
      i += 4;
      return null;
    }
    NUM.lastIndex = i;
    const m = NUM.exec(text);
    if (!m) fail("unexpected character");
    i = NUM.lastIndex;
    const x = Number(m[0]);
    return m[1] || m[2] || Number.isSafeInteger(x) ? x : BigInt(m[0]);
  };
  const v = val();
  ws();
  if (i !== text.length) fail("unexpected trailing characters");
  return v;
}

/** JSON.stringify for plain data, except a BigInt is written as its exact digits. `indent` = JSON.stringify's space. */
export function stringifyJsonExact(value, indent) {
  const gap = typeof indent === "number" ? " ".repeat(Math.max(0, Math.min(10, Math.floor(indent)))) : typeof indent === "string" ? indent.slice(0, 10) : "";
  const go = (v, key, pad) => {
    if (v !== null && typeof v === "object" && typeof v.toJSON === "function") v = v.toJSON(key);
    switch (typeof v) {
      case "bigint":
        return v.toString();
      case "number":
      case "string":
        return JSON.stringify(v);
      case "boolean":
        return v ? "true" : "false";
      case "object": {
        if (v === null) return "null";
        const inner = pad + gap;
        const [open, sep, close] = gap ? [`\n${inner}`, `,\n${inner}`, `\n${pad}`] : ["", ",", ""];
        if (Array.isArray(v)) {
          if (!v.length) return "[]";
          return `[${open}${v.map((x, k) => go(x, String(k), inner) ?? "null").join(sep)}${close}]`;
        }
        if (v instanceof Uint8Array) return JSON.stringify(bytesToHex(v));
        const parts = [];
        for (const k of Object.keys(v)) {
          const s = go(v[k], k, inner);
          if (s !== undefined) parts.push(`${JSON.stringify(k)}:${gap ? " " : ""}${s}`);
        }
        if (!parts.length) return "{}";
        return `{${open}${parts.join(sep)}${close}}`;
      }
      default:
        return undefined;
    }
  };
  return go(value, "", "");
}

/** An exact integer from a decimal string / number / BigInt: a Number when safe, else a BigInt. */
export function exactInt(v) {
  const n = toU64(typeof v === "string" ? v.trim() : v);
  return n <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : n;
}

// ---------------------------------------------------------------- tx forms (CLI + playground)

const field = (name, type, hint, extra = {}) => Object.freeze({ name, type, hint, ...extra });

/**
 * The form fields of every live kind, in canonical order. Types: str, slug,
 * channel, address, addresses, hash32, opt_hash32, key, opt_key, keys,
 * pubkeys, hex, bool, u8, u32, u64, opt_str, opt_address, mode, list, kinds,
 * json. `buildTx` coerces string input from these.
 */
export const KIND_FIELDS = Object.freeze({
  publish_block: [
    field("channel", "channel", "[A-Z0-9]{1,16}, e.g. GDN"),
    field("title", "str", "1..200 chars"),
    field("body_hash", "hash32", "bodyHash(text): POST /body stores the text"),
    field("media_uri", "opt_str", "optional; must have a scheme (ipfs:, https:)", { optional: true }),
  ],
  drum_session: [
    field("room", "slug", "[a-z0-9_-]"),
    field("players", "addresses", "comma separated; sorted for you; the sender is added"),
    field("beat_hash", "hash32", "32-byte hex"),
    field("duration", "u32", "seconds"),
    field("ended_at_ms", "u64", "unix ms the session ended"),
    field("cosigs", "json", "[] or PlayerSig list (sorted by player)", { optional: true, default: "[]" }),
    field("room_sig", "json", "null or {attestor, signature}", { optional: true, default: "null" }),
  ],
  tap: [field("room", "slug", "[a-z0-9_-]")],
  drop_mint: [field("drop_id", "slug", "[a-z0-9_-]{1,64}"), field("recipient", "address", "tz1/tz2 or a registered pca1")],
  transfer: [field("to", "address", "tz1/tz2 or a registered pca1"), field("amount", "u64", "ATTN, > 0")],
  register_agent: [field("public_key", "key", "ed25519: 64 hex or edpk"), field("name", "str", "1..32 chars")],
  set_drum_attestors: [field("attestors", "keys", "ed25519 keys, comma separated (sorted for you); empty = none")],
  set_mandate: [
    field("agent", "address", "the pca1 agent you own"),
    field("kinds", "kinds", "kind names or tags, comma separated (\"10,\" for one tag), or mask:N; 0 pauses"),
    field("channels", "list", "publish_block channels; empty = any", { optional: true }),
    field("rooms", "list", "tap / drum rooms; empty = any", { optional: true }),
    field("spend_per_period", "u64", "ATTN per period"),
    field("period_blocks", "u64", "≥ 1"),
    field("spend_total", "u64", "lifetime ATTN cap"),
    field("payees", "list", "spend_allowance payees; empty = any", { optional: true }),
    field("expires_at", "u64", "block height (exclusive)"),
  ],
  clear_mandate: [field("agent", "address", "the pca1 agent you own")],
  spend_allowance: [field("to", "address", "recipient"), field("amount", "u64", "ATTN, > 0")],
  presence_tap: [
    field("room", "slug", "[a-z0-9_-]"),
    field("issuer", "key", "issuer ed25519 key (hex)"),
    field("pid", "hash32", "pairwise id from the issuer"),
    field("slot", "u64", "height / slot_blocks"),
    field("sig", "hex", "issuer's ed25519 signature over presenceTicketDigest"),
  ],
  set_presence_issuers: [field("issuers", "keys", "ed25519 keys, comma separated (sorted for you); empty pauses")],
  rotate_sequencer: [
    field("new_key", "key", "the next sequencer's ed25519 key: 64 hex or edpk"),
    field("activate_at", "u64", "first block height it seals; ≥ this height + rotation_delay_blocks (launch record 2)"),
  ],
  open_edition: [
    field("id", "slug", "edition id, [a-z0-9_-]{1,64}"),
    field("title", "str", "printable ASCII, 1..64"),
    field("creator", "address", "mints without an attestor come from here; royalties would go here (recorded; not paid yet)"),
    field("supply", "u32", "1..max_supply (launch record 8)"),
    field("per_account", "u32", "mints one recipient may receive; 0 = unlimited"),
    field("opens_at", "u64", "first block height a mint may land at"),
    field("closes_at", "u64", "height mints stop (exclusive); 0 = open-ended"),
    field("attestor", "opt_key", "ed25519 key whose approval every mint needs; empty = creator mints only", { optional: true }),
    field("transferable", "bool", "true or false; false → true later is the only one-way unlock"),
    field("royalty_bps", "u32", "creator royalty in bps, ≤ royalty_bps_max (recorded; not paid yet)"),
    field("recipe_schema", "u8", "0 = opaque bytes, 1 = recipe_v1 (First Mints)"),
    field("unique_key_len", "u8", "0..8: recipe bytes 1..1+n mint once (First Mints: 4, the Nouns seed)"),
    field("renderer_hash", "hash32", "sha256 of the renderer (scripts/renderer-hash.sh)"),
    field("l1_ref", "opt_str", "optional, e.g. tezos:mainnet:KT1…#12", { optional: true }),
  ],
  edition_mint: [
    field("edition", "slug", "the edition id"),
    field("recipient", "address", "tz1/tz2 or a registered pca1"),
    field("recipe", "hex", "recipe bytes (First Mints: recipe_v1 from first-mint.js encodeRecipe)"),
    field("approval_expires", "u64", "the approval is valid below this height; 0 without an attestor"),
    field("approval", "hex", "the attestor's ed25519 signature over editionApprovalDigest; empty without one", { optional: true, default: "" }),
  ],
  edition_transfer: [
    field("edition", "slug", "the edition id"),
    field("serial", "u32", "the token's serial (from 1)"),
    field("to", "address", "tz1/tz2 or a registered pca1"),
  ],
  set_session_key: [
    field("key", "key", "the device's ed25519 key: 64 hex or edpk (never the account's own key)"),
    field("label", "str", "what you call the device, 1..32 chars (shown by explorers, never in a prompt)"),
    field("kinds", "kinds", "what the pass may sign: publish_block, drum_session, tap, presence_tap (launch record 6)"),
    field("channels", "list", "publish_block channels; empty = any", { optional: true }),
    field("rooms", "list", "tap / drum / presence rooms; empty = any", { optional: true }),
    field("expires_at", "u64", "block height (exclusive), at most this height + session_max_blocks"),
  ],
  clear_session_key: [field("key", "key", "the device pass's ed25519 key: 64 hex or edpk")],
  set_controllers: [
    field("controllers", "pubkeys", "backup keys, edpk/sppk, comma separated (sorted for you); must include the key that signs; empty = the address key alone"),
  ],
  seal_capsule: [
    field("channel", "channel", "[A-Z0-9]{1,16}; a crew station takes seals from its owner and crew only"),
    field("commitment", "hash32", "capsuleCommitment(domain, {author, channel, title, body_hash, media_uri}).commitment; store its salt: without it the capsule never opens"),
    field("open_at", "u64", "first block height anyone may open it; above this height, at most max_delay_blocks later (launch record 13)"),
    field("label", "str", "the wax seal's text, 1..64 chars (shown by explorers, never in a prompt)"),
  ],
  open_capsule: [
    field("capsule", "hash32", "capsuleId(author, commitment)"),
    field("salt", "hex", "the salt it was sealed with, 16..64 bytes"),
    field("title", "str", "the sealed post's title, 1..200 chars"),
    field("body_hash", "hash32", "bodyHash(text) of the sealed post"),
    field("media_uri", "opt_str", "optional; exactly as sealed", { optional: true }),
  ],
  claim_station: [
    field("code", "channel", "the channel code, [A-Z0-9]{1,16}; house codes are the genesis treasury's"),
    field("name", "str", "what you call the station, 1..32 chars"),
    field("mode", "mode", "open (anyone posts) or crew (only you and your crew post and seal)"),
    field("pid", "opt_hash32", "a ticketed chain: your bound presence pid; empty elsewhere and for house codes", { optional: true }),
  ],
  set_station: [
    field("code", "channel", "a station you own"),
    field("crew", "list", "crew addresses, comma separated (sorted for you; never yourself); empty = nobody else", { optional: true }),
    field("pinned", "opt_hash32", "the post on air (its tx hash); empty = no pin", { optional: true }),
    field("owner_to", "opt_address", "offer the station to this person (they take it with claim_station); empty = no offer", { optional: true }),
  ],
});

const NESTED_FIELDS = {
  set_mandate: ["terms", ["kinds", "channels", "rooms", "spend_per_period", "period_blocks", "spend_total", "payees", "expires_at"]],
  set_session_key: ["terms", ["kinds", "channels", "rooms", "expires_at"]],
  presence_tap: ["ticket", ["issuer", "pid", "slot", "sig"]],
  open_edition: ["terms", ["id", "title", "creator", "supply", "per_account", "opens_at", "closes_at", "attestor", "transferable", "royalty_bps", "recipe_schema", "unique_key_len", "renderer_hash", "l1_ref"]],
};

const splitList = (v) =>
  (Array.isArray(v) ? v : String(v ?? "").split(/[\s,]+/)).map((x) => String(x).trim()).filter(Boolean);
const sortedUnique = (xs) => [...new Set(xs)].sort(byteOrder);

function keyHex(name, k) {
  const b = ed25519KeyBytes(name, String(k).trim());
  if (b.length !== 32) throw new Error(`${name}: expected a 32-byte ed25519 key`);
  return bytesToHex(b);
}

function coerceField(f, raw, sender) {
  const empty = raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "");
  if (empty && f.optional) {
    if (f.type === "opt_str" || f.type === "opt_key" || f.type === "opt_hash32" || f.type === "opt_address") return null;
    if (f.type === "list") return [];
    if (f.type === "json") return parseJsonExact(f.default);
    if (f.type === "hex") return f.default ?? "";
  }
  if (empty && !["keys", "list", "addresses", "pubkeys"].includes(f.type)) throw new Error(`${f.name}: required`);
  switch (f.type) {
    case "str":
    case "slug":
    case "channel":
      return String(raw);
    case "opt_str":
      return empty ? null : String(raw);
    case "opt_address":
      return empty ? null : String(raw).trim();
    case "opt_hash32":
      return empty ? null : bytesToHex(hash32(String(raw).trim().toLowerCase()));
    case "mode": {
      const m = String(raw).trim().toLowerCase();
      if (!Object.hasOwn(STATION_MODES, m)) throw new TypeError(`${f.name}: expected open or crew`);
      return m;
    }
    case "address":
      return String(raw).trim();
    case "addresses": {
      const xs = splitList(raw);
      if (sender && !xs.includes(sender)) xs.push(sender);
      return sortedUnique(xs);
    }
    case "list":
      return sortedUnique(splitList(raw));
    case "hash32":
      return bytesToHex(hash32(String(raw).trim().toLowerCase()));
    case "key":
    case "opt_key":
      return keyHex(f.name, raw);
    case "bool": {
      if (typeof raw === "boolean") return raw;
      const b = String(raw).trim().toLowerCase();
      if (["true", "yes", "1"].includes(b)) return true;
      if (["false", "no", "0"].includes(b)) return false;
      throw new TypeError(`${f.name}: expected true or false`);
    }
    case "u8": {
      const n = typeof raw === "number" ? raw : Number(String(raw).trim());
      if (!Number.isInteger(n) || n < 0 || n > 255 || !/^[0-9]+$/.test(String(raw).trim())) throw new RangeError(`${f.name}: expected a u8`);
      return n;
    }
    case "keys":
      return sortedUnique(splitList(raw).map((k) => keyHex(f.name, k)));
    case "pubkeys":
      // ed25519 or secp256k1, as edpk/sppk or {scheme, bytes}; sorted and
      // deduplicated the way the chain wants a controller set.
      return sortPublicKeys((Array.isArray(raw) ? raw : splitList(raw)).map((k) => parsePublicKey(typeof k === "string" ? k.trim() : k)));
    case "hex":
      return bytesToHex(hexField(f.name, String(raw).trim()));
    case "u32": {
      const n = typeof raw === "number" ? raw : Number(String(raw).trim());
      if (!Number.isInteger(n) || n < 0 || n > 0xffffffff || !/^[0-9]+$/.test(String(raw).trim())) throw new RangeError(`${f.name}: expected a u32`);
      return n;
    }
    case "u64":
      return exactInt(raw);
    case "kinds": {
      // Typed input: names / tags (a list), or an explicit "mask:N". A bare
      // even number ≤ 62 could be either a tag or a mask ("10": spend_allowance,
      // or publish_block + tap), so it is refused rather than guessed. Odd
      // ≤ 63 can only be a tag (a mask never has bit 0); 0 and > 63 only a mask.
      const s = typeof raw === "string" ? raw.trim() : raw;
      let k;
      if (typeof s !== "string") k = kindsMask(s);
      else if (/^mask:\s*[0-9]+$/.test(s)) k = kindsMask(s.replace(/^mask:\s*/, ""));
      else if (/^[0-9]+$/.test(s)) {
        const n = BigInt(s);
        if (n !== 0n && n <= 63n && (n & 1n) === 0n) {
          throw new RangeError(`kinds: "${s}" is ambiguous (tag ${s} or mask ${s}?): write a tag list ("${s},"), kind names, or "mask:${s}"`);
        }
        k = n === 0n || n > 63n ? kindsMask(s) : kindsMask([s]);
      } else k = kindsMask(splitList(s));
      return k <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(k) : k;
    }
    case "json":
      return typeof raw === "string" ? parseJsonExact(raw) : raw;
    default:
      throw new Error(`unknown field type ${f.type}`);
  }
}

/**
 * The most a device pass may ever be scoped to (mandate.rs
 * SESSION_KINDS_MAX): publish_block, drum_session, tap, presence_tap.
 */
export const SESSION_KINDS_MAX = (1 << 1) | (1 << 2) | (1 << 3) | (1 << 11);

/**
 * The set_session_key form's own checks, before the chain sees it (review
 * B12; keys.rs validate_session_scope and check_label): kinds a non-empty
 * subset of SESSION_KINDS_MAX, a label of 1..32 bytes with no control or
 * format (Unicode Cf) characters, at most 8 rooms (`[a-z0-9_-]{1,64}`) and 8
 * channels (`[A-Z0-9]{1,16}`), `expires_at` above `now_height` (when
 * given, else above 0), and a key that is not the sender's own address key.
 * The chain's lifetime cap (accounts.session_max_blocks) and a chain with
 * narrower `session_kinds` are still the node's to refuse.
 */
function checkSessionKeyForm(tx, nowHeight) {
  const k = kindsMask(tx.terms.kinds ?? 0);
  if (k === 0n) throw new Error("kinds: a device pass must allow at least one kind (publish_block, drum_session, tap, presence_tap)");
  if (k & ~BigInt(SESSION_KINDS_MAX)) {
    throw new Error("kinds: a device pass may only sign publish_block, drum_session, tap and presence_tap (never value moves, mints, mandates or keys)");
  }
  const label = String(tx.label ?? "");
  const n = utf8(label).length;
  if (n < 1 || n > 32) throw new Error(`label: 1..32 bytes, got ${n}`);
  if (/[\p{Cc}\p{Cf}]/u.test(label)) throw new Error("label: no control or format characters (bidi, zero-width, tags)");
  const { rooms = [], channels = [] } = tx.terms;
  if (rooms.length > 8) throw new Error("rooms: at most 8");
  if (channels.length > 8) throw new Error("channels: at most 8");
  for (const r of rooms) if (!/^[a-z0-9_-]{1,64}$/.test(r)) throw new Error(`rooms: ${JSON.stringify(r)} is not a [a-z0-9_-] slug of at most 64`);
  for (const c of channels) if (!/^[A-Z0-9]{1,16}$/.test(c)) throw new Error(`channels: ${JSON.stringify(c)} is not [A-Z0-9], at most 16`);
  const exp = toU64(tx.terms.expires_at);
  const floor = nowHeight === undefined || nowHeight === null ? 0n : toU64(nowHeight);
  if (exp <= floor) throw new Error(`expires_at: must be above ${nowHeight === undefined || nowHeight === null ? "0" : `the current height ${floor}`}`);
  if (tezosAddress({ scheme: "ed25519", bytes: tx.key }) === tx.sender) throw new Error("key: that is this account's own address key, not a device's");
}

/**
 * An unsigned tx from form / CLI input: `buildTx("transfer", {sender, nonce,
 * to, amount: "18446744073709551615"})`. Strings are coerced per
 * KIND_FIELDS (u64 stays exact; lists are sorted the way the chain wants);
 * set_mandate and open_edition terms and presence_tap tickets are nested
 * for you. `now_height` (optional) lets a set_session_key form refuse an
 * expiry at or below the chain's current height.
 */
export function buildTx(type, input = {}, { now_height } = {}) {
  const fields = typeof type === "string" && Object.hasOwn(KIND_FIELDS, type) ? KIND_FIELDS[type] : null;
  if (!fields) {
    const k = Object.values(KIND_REGISTRY).find((x) => x.name === type);
    throw new Error(k ? `${type} is reserved, not live yet` : `unknown tx kind ${type}`);
  }
  const sender = String(input.sender ?? "").trim();
  if (!isAddress(sender)) throw new Error(`sender: not a pointcast-chain address: ${JSON.stringify(input.sender)}`);
  const tx = { sender, nonce: exactInt(input.nonce ?? 0), type };
  const [nestKey, nested] = Object.hasOwn(NESTED_FIELDS, type) ? NESTED_FIELDS[type] : [null, []];
  const inner = {};
  for (const f of fields) {
    const v = coerceField(f, input[f.name], type === "drum_session" && f.name === "players" ? sender : null);
    if (nested.includes(f.name)) inner[f.name] = v;
    else tx[f.name] = v;
  }
  if (nestKey) tx[nestKey] = inner;
  // A device pass never spends: its terms carry zero spend fields and no payees.
  if (type === "set_session_key") {
    const { kinds, channels, rooms, expires_at } = inner;
    tx.terms = { kinds, channels, rooms, spend_per_period: 0, period_blocks: 0, spend_total: 0, payees: [], expires_at };
    checkSessionKeyForm(tx, now_height);
  }
  encodeTx(tx); // throws on anything the canonical encoder refuses
  return tx;
}

// ---------------------------------------------------------------- describeTx (WALLETS.md §Easy mode 4)

/** Words plain mode never uses (WALLETS.md vocabulary). */
export const PLAIN_BANNED_WORDS = Object.freeze(["wallet", "gas", "signature", "address", "mandate", "transaction"]);

const VOCAB = {
  plain: { attn: "attention", pass: "pass", helper: "helper", allowance: "allowance", action: "action", checker: "drum room checker", issuer: "presence ticket issuer", approve: "approve" },
  chain: { attn: "ATTN", pass: "address", helper: "agent", allowance: "mandate", action: "tx", checker: "drum attestor", issuer: "presence issuer", approve: "sign" },
};

// Bidi overrides/isolates, zero-width and line-separator characters and C0/C1
// controls in quoted text could reorder or hide parts of a prompt card; show
// them as \u{..} escapes. Joiners (emoji ZWJ sequences) are left alone.
const CARD_INVISIBLE = /[\u0000-\u001f\u007f-\u009f\u061c\u200b\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/g;
const visible = (s) => String(s).replace(CARD_INVISIBLE, (c) => `\\u{${c.codePointAt(0).toString(16)}}`);

function groupDigits(v) {
  return toU64(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function blocksToWords(blocks, blockMs) {
  const ms = toU64(blocks) * BigInt(blockMs);
  const round = (n, d) => (n + d / 2n) / d;
  const unit = (n, w) => `about ${n} ${w}${n === 1n ? "" : "s"}`;
  if (ms < 90_000n) return unit(round(ms, 1000n), "second");
  if (ms < 5_400_000n) return unit(round(ms, 60_000n), "minute");
  if (ms < 86_400_000n) return unit(round(ms, 3_600_000n), "hour");
  return unit(round(ms, 86_400_000n), "day");
}

/** mandate.rs DELEGABLE_KINDS: tags 1..=7 and 10 (bits a chain's launch records add, like 22 and 23 with editions, are listed only when granted). */
const DELEGABLE_TAGS = new Set([1, 2, 3, 4, 5, 6, 7, 10]);

const PLAIN_KIND_LABEL = {
  publish_block: "post",
  drum_session: "record drum sessions",
  tap: "tap in",
  drop_mint: "mint editions",
  transfer: "send attention from its own pass",
  register_agent: "add helpers of its own",
  set_drum_attestors: "replace the drum room checkers (admin only)",
  set_mandate: "change helper allowances",
  clear_mandate: "remove helper allowances",
  spend_allowance: "spend from your allowance",
  presence_tap: "check in with presence tickets",
  set_presence_issuers: "replace presence ticket issuers",
  rotate_sequencer: "hand the block signing key to a new key (admin only)",
  open_edition: "open editions (admin only)",
  edition_mint: "mint edition cards",
  edition_transfer: "move edition cards",
  set_session_key: "approve a device to act for your pass",
  clear_session_key: "turn off a device",
  set_controllers: "change your backup keys",
  seal_capsule: "seal time capsules",
  open_capsule: "open time capsules",
  claim_station: "claim stations",
  set_station: "change a station's crew, pin or owner",
};

/**
 * A prompt card for `tx`, built from the tx itself, never from free text
 * (WALLETS.md §Easy mode 4): start with the verb, name the exact thing, say
 * what it allows and does not, how long it lasts, how to undo it, the cost.
 * `words: "plain"` (default) never uses PLAIN_BANNED_WORDS (quoted user text
 * aside); `"chain"` uses chain vocabulary. `details` is the collapsed fold:
 * exact chain data (kind, tag, nonce, every field; the digest when `domain`
 * is given), not plain words. Quoted text is verbatim except that invisible
 * and bidi control characters are shown as \u{..} escapes. Pass the chain's
 * `params` so rule-dependent cards (drum sessions) say what that chain does;
 * without them a drum card assumes the default cosign rule.
 */
export function describeTx(tx, { words = "plain", now_height, block_ms = 3000, domain, params } = {}) {
  const plain = words !== "chain";
  const V = plain ? VOCAB.plain : VOCAB.chain;
  const short = (a) => visible(plain && typeof a === "string" && a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);
  const who = (a) => `${V.pass} ${short(a)}`;
  const helper = (a) => `${V.helper} ${short(a)}`;
  const q = (s) => `"${visible(s)}"`;
  // A key someone must tell apart from a look-alike: at least 8 + 8
  // characters of its base58, or all of it (review B8).
  const b58Short = (b58) => (b58.length > 17 ? `${b58.slice(0, 8)}…${b58.slice(-8)}` : b58);
  const keyShort = (k) => {
    try {
      return visible(b58Short(b58checkEncode(concat(Uint8Array.from(PREFIX.edpk), ed25519KeyBytes("key", k)))));
    } catch {
      return visible(String(k ?? "").slice(0, 17));
    }
  };
  const list = (xs) => xs.map(visible).join(", ");
  const amt = (v) => `${groupDigits(v)} ${V.attn}`;
  const until = (h) => {
    const at = `block ${groupDigits(h)}`;
    if (now_height === undefined || now_height === null) return at;
    const now = toU64(now_height), end = toU64(h);
    return end > now ? `${at} (${blocksToWords(end - now, block_ms)} from now)` : `${at} (already passed)`;
  };
  let d;
  switch (tx.type) {
    case "publish_block":
      d = {
        title: `Post ${q(tx.title)} to channel ${visible(tx.channel)}.`,
        allowed: [`Adds this post to the public record of channel ${visible(tx.channel)}; its exact words are fixed by a fingerprint.`]
          .concat(tx.media_uri ? [`Links media ${q(tx.media_uri)}.`] : []),
        not_allowed: [`Spending ${V.attn}.`, "Editing the post later."],
        lasts: "Permanent.",
        undo: "Can't be undone.",
      };
      break;
    case "drum_session": {
      const n = (tx.players || []).length;
      const cos = (tx.cosigs || []).length;
      const vouch = tx.room_sig ? `everyone listed (a ${V.checker} vouched)` : `you${cos ? ` and ${cos} co-${plain ? "approved" : "signed"} player${cos === 1 ? "" : "s"}` : ""}`;
      // state.rs: open pays every listed player with an account; room_only
      // pays only room-checked sessions; cosign (default) pays who agreed.
      const policy = params && params.drum_attest_policy;
      let allowed = [`Credits ${V.attn} to players who agreed: ${vouch}.`];
      let notAllowed = ["Paying anyone who didn't agree.", `Spending your ${V.attn}.`];
      if (policy === "open") {
        allowed = [`Credits ${V.attn} to every listed player with an account, whether or not they agreed (this chain's drum rule is open).`];
        notAllowed = [`Spending your ${V.attn}.`];
      } else if (policy === "room_only") {
        allowed = tx.room_sig
          ? [`Credits ${V.attn} to everyone listed (a ${V.checker} vouched).`]
          : [`Nobody is credited: this chain only pays sessions a ${V.checker} vouched for.`];
      }
      d = {
        title: `Record a drum session in room ${q(tx.room)}: ${n} player${n === 1 ? "" : "s"}, ${visible(tx.duration)} second${tx.duration === 1 ? "" : "s"}.`,
        allowed,
        not_allowed: notAllowed,
        lasts: "One time.",
        undo: "Can't be undone.",
      };
      break;
    }
    case "tap":
      d = {
        title: `Tap in to room ${q(tx.room)}.`,
        allowed: [`Counts you present in ${q(tx.room)} once; may earn ${V.attn}.`],
        not_allowed: [`Sending ${V.attn}, minting, changing your keys.`],
        lasts: "One time, right now.",
        undo: "Nothing to undo.",
      };
      break;
    case "drop_mint":
      d = {
        title: `Mint one edition of ${q(tx.drop_id)} to ${who(tx.recipient)}.`,
        allowed: [`Adds one ${q(tx.drop_id)} edition to that ${V.pass}.`, `If ${q(tx.drop_id)} is new, you become its creator for good.`],
        not_allowed: ["Moving the edition later: editions can't be transferred.", "Minting a drop someone else created."],
        lasts: "Permanent.",
        undo: "Can't be undone.",
      };
      break;
    case "transfer":
      d = {
        title: `Send ${amt(tx.amount)} to ${who(tx.to)}.`,
        allowed: [`Moves ${amt(tx.amount)} from your ${V.pass} to that ${V.pass}.`],
        not_allowed: ["Taking it back.", `Buying or selling: ${V.attn} can't be bought or sold.`],
        lasts: "Immediate.",
        undo: "This can't be undone.",
      };
      break;
    case "register_agent": {
      const pk = String(tx.public_key || "");
      const agent = (() => {
        try {
          return agentAddress({ scheme: "ed25519", bytes: pk });
        } catch {
          return null;
        }
      })();
      d = {
        title: `Add ${V.helper} ${q(tx.name)} (key ${visible(pk.slice(0, 4))}…${visible(pk.slice(-4))}) to your ${V.pass}.`,
        allowed: [`${q(tx.name)} gets its own ${plain ? "pass number" : V.pass}${agent ? ` ${plain ? `${agent.slice(0, 6)}…${agent.slice(-4)}` : agent}` : ""}, linked to you.`,
          `It can act from its own ${V.pass} with no limits until you give it an ${V.allowance}.`],
        not_allowed: [`Spending your ${V.attn} unless an ${V.allowance} says so.`, "Changing your keys."],
        lasts: `Permanent: a ${V.helper} can't be removed.`,
        undo: `Can't be undone. Pause it with an ${V.allowance} that allows nothing.`,
      };
      break;
    }
    case "set_drum_attestors": {
      const n = (tx.attestors || []).length;
      d = {
        title: n ? `Replace the ${V.checker}s: ${n} key${n === 1 ? "" : "s"}.` : `Remove every ${V.checker}.`,
        allowed: n ? ["Those keys can vouch for whole drum sessions."] : ["Only player co-approvals count for drum sessions."],
        not_allowed: ["Any key not listed vouching.", "Works only if you are the drum admin."],
        lasts: "Until replaced.",
        undo: "Send a new list anytime (admin only).",
      };
      break;
    }
    case "set_mandate": {
      const t = tx.terms || {};
      const k = kindsMask(t.kinds);
      const rooms = (t.rooms || []).length ? ` in room ${list(t.rooms)}` : " in any room";
      const can = [];
      const cannot = [];
      for (const [name, tag] of Object.entries(KIND_TAGS)) {
        const has = (k >> BigInt(tag)) & 1n;
        // Owner-only and non-delegable kinds (8, 9, 11, 12) are summed up below.
        if (!has && !DELEGABLE_TAGS.has(tag)) continue;
        let label = plain ? PLAIN_KIND_LABEL[name] : name;
        if (has && (name === "publish_block" || name === "seal_capsule")) label += (t.channels || []).length ? ` ${name === "publish_block" ? "to" : "on"} channel ${list(t.channels)}` : ` ${name === "publish_block" ? "to" : "on"} any channel`;
        if (has && name === "tap") label = (plain ? "tap" : name) + rooms;
        if (has && name === "drum_session") label += rooms;
        if (has && name === "spend_allowance") {
          label = `spend up to ${amt(t.spend_per_period)} every ${groupDigits(t.period_blocks)} blocks (${blocksToWords(t.period_blocks, block_ms)}), ${groupDigits(t.spend_total)} total`;
          if ((t.payees || []).length) label += `, only to ${t.payees.map(who).join(", ")}`;
        }
        (has ? can : cannot).push(label);
      }
      const named = new Set(Object.values(KIND_TAGS).map(BigInt));
      for (let tag = 13n; tag < 64n; tag++) if (!named.has(tag) && (k >> tag) & 1n) can.push(`${plain ? `${V.action} #` : "tag "}${tag}${KIND_REGISTRY[tag] ? ` (${KIND_REGISTRY[tag].name})` : ""}`);
      const paused = k === 0n;
      d = {
        title: paused
          ? `Pause ${helper(tx.agent)}: it can't act until you change this.`
          : `Let ${helper(tx.agent)} act for you: ${can.join("; ")}.`,
        allowed: paused ? ["Nothing."] : can.map((c) => c[0].toUpperCase() + c.slice(1) + "."),
        not_allowed: cannot.map((c) => c[0].toUpperCase() + c.slice(1) + ".").concat([`Change its own ${V.allowance} or your keys.`, `Go over the ${V.allowance}.`]),
        lasts: `Stops at ${until(t.expires_at)}.`,
        undo: `Pause it anytime with a new ${V.allowance} that allows nothing.`,
      };
      break;
    }
    case "clear_mandate":
      d = {
        title: `Remove the ${V.allowance} of ${helper(tx.agent)}.`,
        allowed: [`It goes back to acting from its own ${V.pass} with no limits, as ${V.helper}s did before ${V.allowance}s.`],
        not_allowed: [`Spending your ${V.attn}: that needs an ${V.allowance}.`],
        lasts: "From the next block on.",
        undo: `Give it a new ${V.allowance} anytime.`,
      };
      break;
    case "spend_allowance":
      d = {
        title: `Pay ${amt(tx.amount)} to ${who(tx.to)} from your owner's ${V.allowance}.`,
        allowed: [`Moves ${amt(tx.amount)} from your owner's ${V.pass} to that ${V.pass}, inside the ${V.allowance}.`],
        not_allowed: [`Going over the ${V.allowance}.`, "Taking it back."],
        lasts: "Immediate.",
        undo: "This can't be undone.",
      };
      break;
    case "presence_tap": {
      const t = tx.ticket || {};
      d = {
        title: `Check in to room ${q(tx.room)} with a presence ticket (slot ${groupDigits(t.slot ?? 0)}).`,
        allowed: [`Earns ${V.attn} once for this time slot if the ticket is valid.`],
        not_allowed: ["Using the same ticket twice.", `Checking in for someone else: the ticket is bound to your ${V.pass}.`],
        lasts: "One time, this slot.",
        undo: "Nothing to undo.",
      };
      break;
    }
    case "set_presence_issuers": {
      const n = (tx.issuers || []).length;
      d = {
        title: n ? `Replace the ${V.issuer}s: ${n} key${n === 1 ? "" : "s"}.` : `Pause ticketed check-ins: remove every ${V.issuer}.`,
        allowed: n ? ["Tickets from those keys earn check-in income."] : ["Nothing earns check-in income until a new list is sent."],
        not_allowed: ["Tickets from any other key.", "Works only if you are the presence admin."],
        lasts: "Until replaced.",
        undo: "Send a new list anytime (admin only).",
      };
      break;
    }
    case "rotate_sequencer": {
      const key = String(tx.new_key ?? "");
      const shown = key.startsWith("edpk") ? key : (() => {
        try {
          return publicKeyToB58({ scheme: "ed25519", bytes: key });
        } catch {
          return key;
        }
      })();
      d = {
        title: `Hand block signing to key ${visible(shown.slice(0, 8))}…${visible(shown.slice(-4))} from ${until(tx.activate_at ?? 0)}.`,
        allowed: [
          `From then on only that key can seal new blocks; the current key seals until then.`,
          `Everyone gets the chain's notice: the switch can't take effect sooner.`,
        ],
        not_allowed: [`Spending or moving ${V.attn}.`, "Changing any history: past blocks keep the key that sealed them.", "Works only if you are the sequencer admin."],
        lasts: "Until another handover.",
        undo: "Before it takes effect, send another handover to replace it, or a handover to the key signing now to cancel it (admin only).",
      };
      break;
    }
    case "open_edition": {
      const t = tx.terms || {};
      const per = Number(t.per_account) === 0 ? "no limit per person" : `at most ${groupDigits(t.per_account ?? 0)} per person`;
      const window = Number(t.closes_at) === 0 || t.closes_at === undefined
        ? `from block ${groupDigits(t.opens_at ?? 0)}, with no end`
        : `from block ${groupDigits(t.opens_at ?? 0)} until ${until(t.closes_at)}`;
      d = {
        title: `Open edition ${q(t.id)} (${q(t.title)}): ${groupDigits(t.supply ?? 0)} cards, ${per}.`,
        allowed: [
          t.attestor ? `Cards mint only with approval from key ${visible(String(t.attestor).slice(0, 4))}…${visible(String(t.attestor).slice(-4))}.` : `Only ${who(t.creator)} can mint cards.`,
          `Mints ${window}.`,
          t.transferable ? "Cards can be moved to someone else." : "Cards can't be moved (an admin can unlock that later, once).",
        ],
        not_allowed: [`Spending ${V.attn}.`, "Tightening these terms once the edition opens: they can only be relaxed.", "Works only if you are the editions admin."],
        lasts: "Permanent.",
        undo: "Can't be undone; the terms can only be relaxed later.",
      };
      break;
    }
    case "edition_mint":
      d = {
        title: `Mint the next card of edition ${q(tx.edition)} to ${who(tx.recipient)}.`,
        allowed: [`Adds one numbered card of ${q(tx.edition)} to that ${V.pass}, with the exact recipe you chose.`],
        not_allowed: ["Changing the card later: the recipe is permanent.", `Spending ${V.attn}.`, "Minting the same recipe twice."],
        lasts: "Permanent.",
        undo: "Can't be undone.",
      };
      break;
    case "edition_transfer":
      d = {
        title: `Give card #${groupDigits(tx.serial ?? 0)} of edition ${q(tx.edition)} to ${who(tx.to)}.`,
        allowed: [`Moves that one card from your ${V.pass} to that ${V.pass}.`],
        not_allowed: ["Taking it back.", "Moving a card you don't hold.", `Spending ${V.attn}.`],
        lasts: "Immediate.",
        undo: "This can't be undone.",
      };
      break;
    case "set_session_key": {
      // WALLETS.md template (a): what the device may do, what it may not,
      // how long, how to turn it off.
      const t = tx.terms || {};
      const k = kindsMask(t.kinds ?? 0);
      const rooms = (t.rooms || []).length ? ` in room ${list(t.rooms)}` : " in any room";
      const can = [];
      for (const [name, tag] of Object.entries(KIND_TAGS)) {
        if (!((k >> BigInt(tag)) & 1n)) continue;
        let label = plain ? PLAIN_KIND_LABEL[name] : name;
        if (name === "publish_block") label += (t.channels || []).length ? ` to channel ${list(t.channels)}` : " to any channel";
        if (name === "tap") label = (plain ? "tap" : name) + rooms;
        if (name === "drum_session" || name === "presence_tap") label += rooms;
        can.push(label);
      }
      const dev = plain ? "device" : "session key";
      // The key first, then the label (quotes stripped): a label can't
      // dress itself up as another key in front of the real one (review B8).
      const label = q(String(tx.label ?? "").replace(/"/g, ""));
      d = {
        title: `Let the ${dev} with key ${keyShort(tx.key)} (named ${label}) act for your ${V.pass}: ${can.join("; ") || "nothing"}.`,
        allowed: can.map((c) => c[0].toUpperCase() + c.slice(1) + ".").concat([`No prompt each time: the ${dev} ${plain ? "approves" : "signs"} these by itself.`]),
        not_allowed: [`Sending ${V.attn}, minting, trading or changing your keys.`, "Anything after it ends."],
        lasts: `Until ${until(t.expires_at ?? 0)}.`,
        undo: `Turn it off anytime with one ${V.action}; changing your backup keys turns off every ${dev}.`,
      };
      break;
    }
    case "clear_session_key": {
      const dev = plain ? "device" : "session key";
      d = {
        title: `Turn off the ${dev} with key ${keyShort(tx.key)}.`,
        allowed: [`That ${dev} can no longer act for your ${V.pass}.`],
        not_allowed: ["Touching anything else on your " + V.pass + "."],
        lasts: "From the next block on.",
        undo: `${plain ? "Approve" : "Grant"} the ${dev} again anytime.`,
      };
      break;
    }
    case "set_controllers": {
      const keys = (tx.controllers || []).map((c) => {
        try {
          const b58 = publicKeyToB58(c);
          return plain ? b58Short(b58) : b58;
        } catch {
          return "(not a key)";
        }
      });
      const backup = plain ? "backup key" : "controller";
      d = keys.length
        ? {
            title: `Set ${keys.length} ${backup}${keys.length === 1 ? "" : "s"} for your ${V.pass}: ${visible(keys.join(", "))}.`,
            allowed: [
              `Each of them can do everything your ${V.pass} can, including taking it over.`,
              `Your ${plain ? "pass number" : "address"} stays the same.`,
            ],
            not_allowed: [`Any key not listed acting for your ${V.pass} (your original key too, unless it is listed).`],
            lasts: "Until a listed key replaces the list.",
            undo: `A listed key can send a new list; an empty list gives control back to your original key. Every device ${plain ? "approval" : "pass"} ends now, and leaving out a key that acts for your ${V.pass} now also pauses every ${V.helper}'s ${V.allowance} until you renew it.`,
          }
        : {
            title: `Give control of your ${V.pass} back to its original key alone.`,
            allowed: [`Only your original key acts for your ${V.pass} again.`],
            not_allowed: [`Any ${backup} acting for your ${V.pass}.`],
            lasts: "Until you set new backup keys.",
            undo: `Set ${backup}s again anytime. Every device ${plain ? "approval" : "pass"} ends now, and dropping a ${backup} also pauses every ${V.helper}'s ${V.allowance} until you renew it.`,
          };
      break;
    }
    case "seal_capsule": {
      // The chain's max delay (launch record 13), when the params are given:
      // the block it lapses at, as the Rust words say (stations fix S14).
      const delay = params && params.launch && params.launch.stations ? params.launch.stations.max_delay_blocks : null;
      const lapse = delay === null || delay === undefined ? "the chain's max delay after that" : until(toU64(tx.open_at ?? 0) + toU64(delay));
      d = {
        title: `Seal a time capsule on channel ${visible(tx.channel)} that anyone may open from ${until(tx.open_at ?? 0)}.`,
        allowed: [
          "Fixes exactly one post now: when it opens, the chain checks it is what you sealed.",
          `Keeps what it holds hidden until then; label ${q(tx.label ?? "")} is public.`,
        ],
        not_allowed: ["Changing what it holds later.", `Spending ${V.attn}.`, "Opening it before its block."],
        lasts: `Permanent: sealing can't be undone. If nobody opens it, it lapses at ${lapse} and can never open.`,
        undo: "Can't be undone.",
      };
      break;
    }
    case "open_capsule":
      d = {
        title: `Open time capsule ${visible(String(tx.capsule ?? "").slice(0, 8))}… and air ${q(tx.title ?? "")}.`,
        allowed: ["Airs the sealed post, if it is exactly what was sealed (the chain checks)."],
        not_allowed: ["Airing anything else: a different post or salt is refused.", "Opening it twice.", `Spending ${V.attn}.`],
        lasts: "Permanent.",
        undo: "Can't be undone.",
      };
      break;
    case "claim_station": {
      const crew = tx.mode === "crew";
      d = {
        title: `Claim station ${visible(tx.code)} (${q(tx.name ?? "")}) in ${crew ? "crew" : "open"} mode.`,
        allowed: [
          crew ? `Only you and the crew you name may post or seal capsules on channel ${visible(tx.code)}.` : `Anyone may still post on channel ${visible(tx.code)}; it carries your name and pin.`,
          "If it is already yours, this renames it or changes its mode; if it was offered to you, you take it.",
        ],
        not_allowed: [`Spending ${V.attn}.`, "Taking a station someone else holds (the house codes included) unless they offered it to you.", "Holding more stations than the chain allows."],
        lasts: "Yours until you offer it to someone and they claim it.",
        undo: "A claim itself can't be undone; you can only offer the station on.",
      };
      break;
    }
    case "set_station": {
      const crew = tx.crew || [];
      d = {
        title: `Set station ${visible(tx.code)}: crew ${crew.length ? crew.map(who).join(", ") : "nobody else"}${tx.owner_to ? `; offer it to ${who(tx.owner_to)}` : ""}.`,
        allowed: [
          crew.length ? "The crew may post and seal capsules there (in crew mode)." : "Only you post and seal there (in crew mode).",
          tx.pinned ? `Pins ${visible(String(tx.pinned).slice(0, 8))}… on air.` : "Clears the pin.",
        ].concat(tx.owner_to ? ["The station moves only if they claim it; until then it is yours."] : []),
        not_allowed: [`Spending ${V.attn}.`, "Changing a station you don't own."],
        lasts: "Until you change it again.",
        undo: "Send a new crew, pin or offer anytime.",
      };
      break;
    }
    default:
      d = {
        title: `${plain ? "Approve" : "Sign"} ${V.action} ${q(tx.type)}.`,
        allowed: [`This app can't describe this ${V.action} yet: read the Details before you ${V.approve}.`],
        not_allowed: [`Unknown: don't ${V.approve} if you're unsure.`],
        lasts: "Unknown.",
        undo: "Unknown.",
      };
  }
  const fields = {};
  for (const [key, v] of Object.entries(tx)) if (!["sender", "nonce", "type"].includes(key)) fields[key] = v;
  const tag = typeof tx.type === "string" && Object.hasOwn(KIND_TAGS, tx.type) ? KIND_TAGS[tx.type] : kindTag(tx.type) ?? null;
  const details = { kind: tx.type, tag, sender: tx.sender, nonce: String(toU64(tx.nonce ?? 0)), fields };
  if (domain) {
    try {
      details.digest = signingHash(tx, domain);
    } catch (e) {
      details.digest_error = e.message;
    }
  }
  return { ...d, cost: "free", details };
}

/** Every plain-words string of a describeTx card (title, allowed, not_allowed, lasts, undo, cost). */
export function describeTexts(card) {
  return [card.title, ...card.allowed, ...card.not_allowed, card.lasts, card.undo, card.cost];
}

// ---------------------------------------------------------------- pointcast-wire/v1 (SSE)

/** Default cap on one buffered line or one event's data (chars): far above any block event. */
export const SSE_MAX_EVENT_CHARS = 8 * 1024 * 1024;
const SSE_MAX_COMMENTS = 64;

/**
 * An incremental text/event-stream parser (WHATWG rules): LF, CRLF and CR
 * line ends, multi-line data, comments, id and retry. `push(chunk)` returns
 * the events completed by that chunk: `{event, data, id, lastEventId}`.
 * Bounded against a hostile stream: a line or an event's data longer than
 * `maxEventChars` throws a ChainError (drop the connection), and only the
 * last 64 comments are kept.
 */
export function createSseParser({ maxEventChars = SSE_MAX_EVENT_CHARS } = {}) {
  let buf = "";
  let data = null;
  let type = "";
  let idInEvent;
  const st = { lastEventId: "", retry: undefined, comments: [] };
  const tooBig = () => new ChainError(`live stream: a line or event over ${maxEventChars} chars; dropping the connection`);
  const line = (l, out) => {
    if (l === "") {
      const ev = { event: type || "message", data: data === null ? null : data.replace(/\n$/, ""), id: idInEvent, lastEventId: st.lastEventId };
      if (data !== null) out.push(ev);
      data = null;
      type = "";
      idInEvent = undefined;
      return;
    }
    if (l[0] === ":") {
      if (st.comments.length >= SSE_MAX_COMMENTS) st.comments.shift();
      st.comments.push(l.slice(1).replace(/^ /, ""));
      return;
    }
    const c = l.indexOf(":");
    const name = c < 0 ? l : l.slice(0, c);
    const value = c < 0 ? "" : l.slice(c + 1).replace(/^ /, "");
    if (name === "data") {
      data = (data ?? "") + value + "\n";
      if (data.length > maxEventChars) throw tooBig();
    } else if (name === "event") type = value;
    else if (name === "id") {
      if (!value.includes("\0")) {
        st.lastEventId = value;
        idInEvent = value;
      }
    } else if (name === "retry") {
      if (/^[0-9]+$/.test(value)) st.retry = Number(value);
    }
  };
  const drain = (final) => {
    const out = [];
    for (;;) {
      const m = /\r\n|\n|\r/.exec(buf);
      if (!m) break;
      // A trailing CR may be the first half of a CRLF split across chunks.
      if (m[0] === "\r" && m.index === buf.length - 1 && !final) break;
      line(buf.slice(0, m.index), out);
      buf = buf.slice(m.index + m[0].length);
    }
    return out;
  };
  return {
    state: st,
    push(chunk) {
      buf += chunk;
      const out = drain(false);
      if (buf.length > maxEventChars) throw tooBig();
      return out;
    },
    end() {
      return drain(true);
    },
    get rest() {
      return buf;
    },
  };
}

/** Parse a whole text/event-stream body: `{events, comments, lastEventId, retry, rest}`. */
export function parseSse(text) {
  const p = createSseParser();
  const events = p.push(text).concat(p.end());
  return { events, comments: p.state.comments.slice(), lastEventId: p.state.lastEventId, retry: p.state.retry, rest: p.rest };
}

function liveUrl(townUrl, q) {
  const u = new URL(townUrl);
  if (!/\/(live|stream)\/?$/.test(u.pathname)) u.pathname = u.pathname.replace(/\/+$/, "") + "/api/town/live";
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  return u.toString();
}

/**
 * A pointcast-wire/v1 client (pc-town /api/town/live) over fetch streaming,
 * for Node 24 and browsers. Handlers: onHello, onBlock, onTip, onGap,
 * onFault, onError, onEvent (anything else), onReconnect. Resumes with the
 * Last-Event-ID of the last fully delivered block, backing off 1 s → 30 s.
 * Options: {lastEventId, from, channels (array or "FD,GDN"), empty, signal,
 * fetch, minBackoffMs, maxBackoffMs, maxEventChars}. JSON is parsed exactly
 * (u64 → BigInt above 2^53; amounts arrive as decimal strings). Only
 * decimal event ids (block heights) are kept for resuming.
 * Returns {close(), done, lastEventId}.
 */
export function liveStream(townUrl, handlers = {}, opts = {}) {
  liveUrl(townUrl, {}); // a malformed URL throws here, not in an endless reconnect loop
  const f = opts.fetch || globalThis.fetch.bind(globalThis);
  const ctl = new AbortController();
  const onOuterAbort = () => ctl.abort();
  if (opts.signal) {
    if (opts.signal.aborted) ctl.abort();
    else opts.signal.addEventListener("abort", onOuterAbort, { once: true });
  }
  let lastEventId = opts.lastEventId !== undefined && opts.lastEventId !== null ? String(opts.lastEventId) : null;
  const minMs = opts.minBackoffMs ?? 1000;
  const maxMs = opts.maxBackoffMs ?? 30_000;
  const channels = Array.isArray(opts.channels) ? opts.channels.join(",") : opts.channels;
  let serverRetry = null;
  // One abort listener per sleep, removed when the sleep ends either way
  // (a long-lived stream reconnects many times).
  const sleep = (ms) =>
    new Promise((resolve) => {
      if (ctl.signal.aborted) return resolve();
      const wake = () => {
        clearTimeout(t);
        ctl.signal.removeEventListener("abort", wake);
        resolve();
      };
      const t = setTimeout(wake, ms);
      ctl.signal.addEventListener("abort", wake, { once: true });
    });
  const call = (name, arg) => {
    const h = handlers[name];
    if (typeof h === "function") {
      try {
        h(arg);
      } catch (e) {
        if (name !== "onError" && typeof handlers.onError === "function") handlers.onError(e);
      }
    }
  };
  const ROUTE = { hello: "onHello", block: "onBlock", tip: "onTip", gap: "onGap", fault: "onFault" };
  const handle = (ev) => {
    // pointcast-wire/v1 ids are block heights; anything else (or a value a
    // fetch header can't carry) never becomes the resume point.
    if (typeof ev.lastEventId === "string" && /^[0-9]{1,20}$/.test(ev.lastEventId)) lastEventId = ev.lastEventId;
    const name = ROUTE[ev.event];
    if (!name) return call("onEvent", ev);
    let payload;
    try {
      payload = parseJsonExact(ev.data ?? "");
    } catch {
      return call("onError", new ChainError(`live stream: bad JSON in a ${ev.event} event`, ev));
    }
    if (ev.event === "hello" && payload && payload.schema !== "pointcast-wire/v1") {
      call("onError", new ChainError(`live stream: unknown schema ${JSON.stringify(payload.schema)}`, payload));
    }
    call(name, payload);
  };
  const run = async () => {
    let attempt = 0;
    let first = true;
    while (!ctl.signal.aborted) {
      let delivered = false;
      try {
        const headers = { accept: "text/event-stream" };
        if (lastEventId !== null) headers["last-event-id"] = lastEventId;
        const from = lastEventId !== null ? lastEventId : first ? opts.from : undefined;
        first = false;
        const r = await f(liveUrl(townUrl, { channels, empty: opts.empty ? 1 : undefined, from }), { headers, signal: ctl.signal });
        if (!r.ok) {
          // Release the connection now rather than whenever GC finds it.
          if (r.body && typeof r.body.cancel === "function") r.body.cancel().catch(() => {});
          throw new ChainError(`live stream: HTTP ${r.status}`);
        }
        if (!r.body || typeof r.body.getReader !== "function") throw new ChainError("live stream: this runtime has no streaming fetch body");
        const parser = createSseParser({ maxEventChars: opts.maxEventChars ?? SSE_MAX_EVENT_CHARS });
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            const evs = parser.push(typeof value === "string" ? value : dec.decode(value, { stream: true }));
            if (parser.state.retry !== undefined) serverRetry = parser.state.retry;
            parser.state.comments.length = 0; // heartbeats: nothing to keep
            for (const ev of evs) {
              delivered = true;
              handle(ev);
            }
          }
          for (const ev of parser.end()) {
            delivered = true;
            handle(ev);
          }
        } finally {
          // Oversized line, abort or a clean end: never leave the body open.
          reader.cancel().catch(() => {});
        }
      } catch (e) {
        if (ctl.signal.aborted) break;
        call("onError", e);
      }
      if (ctl.signal.aborted) break;
      if (delivered) attempt = 0;
      const base = Math.min(maxMs, Math.max(minMs, serverRetry ?? minMs));
      const delayMs = Math.min(maxMs, base * 2 ** attempt);
      attempt = Math.min(attempt + 1, 16);
      call("onReconnect", { delayMs, lastEventId, attempt });
      await sleep(delayMs);
    }
    if (opts.signal) opts.signal.removeEventListener("abort", onOuterAbort);
  };
  const done = run();
  return {
    close: () => ctl.abort(),
    done,
    get lastEventId() {
      return lastEventId;
    },
  };
}
