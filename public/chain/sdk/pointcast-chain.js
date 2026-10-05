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
  edsig: [9, 245, 205, 134, 18],
  spsig1: [13, 115, 101, 19, 63],
  sig: [4, 130, 43],
};
const AGENT_PREFIX = "pca1";
const startsWith = (b, pre) => pre.every((x, i) => b[i] === x);

/** `tz1` | `tz2` | `agent` for addresses pointcast-chain accepts, else null. */
export function addressKind(a) {
  if (typeof a !== "string") return null;
  if (a.startsWith(AGENT_PREFIX)) {
    const v = b58checkDecode(a.slice(AGENT_PREFIX.length));
    return v && v.length === 20 ? "agent" : null;
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

/** `{scheme, bytes}` from that object form or a base58 `edpk…` / `sppk…`. */
export function parsePublicKey(pk) {
  if (pk && typeof pk === "object") {
    const scheme = pk.scheme;
    const bytes = String(pk.bytes || "").toLowerCase();
    const want = scheme === "ed25519" ? 64 : scheme === "secp256k1" ? 66 : 0;
    if (!want || bytes.length !== want || !/^[0-9a-f]+$/.test(bytes)) throw new Error("bad public key object");
    return { scheme, bytes };
  }
  const v = b58checkDecode(pk);
  if (v && v.length === 36 && startsWith(v, PREFIX.edpk)) return { scheme: "ed25519", bytes: bytesToHex(v.subarray(4)) };
  if (v && v.length === 37 && startsWith(v, PREFIX.sppk)) return { scheme: "secp256k1", bytes: bytesToHex(v.subarray(4)) };
  throw new Error("public key: expected edpk or sppk");
}

export function publicKeyToB58(pk) {
  const k = parsePublicKey(pk);
  return b58checkEncode(concat(Uint8Array.from(k.scheme === "ed25519" ? PREFIX.edpk : PREFIX.sppk), hexToBytes(k.bytes)));
}

/** The tz1/tz2 address a public key controls. */
export function tezosAddress(pk) {
  const k = parsePublicKey(pk);
  const pre = k.scheme === "ed25519" ? PREFIX.tz1 : PREFIX.tz2;
  return b58checkEncode(concat(Uint8Array.from(pre), blake2b(hexToBytes(k.bytes), 20)));
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

export const KIND_TAGS = Object.freeze({
  publish_block: 1, drum_session: 2, tap: 3, drop_mint: 4, transfer: 5, register_agent: 6,
  set_drum_attestors: 7, set_mandate: 8, clear_mandate: 9, spend_allowance: 10,
});

function encodeTerms(e, t) {
  e.u16(t.kinds);
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

function encodeKind(e, tx) {
  switch (tx.type) {
    case "publish_block":
      e.u8(1).str(tx.channel).str(tx.title).fixed(hash32(tx.body_hash)).optStr(tx.media_uri ?? null);
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
    default:
      throw new Error(`tx kind ${tx.type} is not supported by this SDK (use the node's /tx/digest + the wasm verifier)`);
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

/** The exact text a Tezos wallet shows and signs for `tx` (wallet.rs). */
export function walletText(tx, domain) {
  if (!isValidChainId(domain.chain_id)) throw new Error("chain id is not wallet-safe");
  const text = `${MESSAGE_PREFIX} ${domain.chain_id} ${tx.type} sender ${tx.sender} nonce ${toU64(tx.nonce)} digest ${signingHash(tx, domain)}`;
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

/** The tx hash the node reports for a signed tx (object or base58 wire forms). */
export function txHash(stx) {
  const pk = parsePublicKey(stx.public_key);
  const sig = parseSignature(stx.signature);
  const e = new Enc()
    .fixed(encodeTx(stx.tx))
    .u8(pk.scheme === "ed25519" ? 0 : 1)
    .bytes(hexToBytes(pk.bytes))
    .bytes(hexToBytes(sig.bytes));
  if (stx.sig_mode === "tezos_message") e.u8(1);
  return bytesToHex(blake2b256(utf8("pointcast-chain/txid/v1"), e.finish()));
}

const POLICY = { open: 0, cosign: 1, room_only: 2 };

/** The genesis hash: blake2b("pointcast-chain/params/v1" ‖ params). Hex. */
export function paramsHash(p) {
  const seq = parsePublicKey(p.sequencer);
  const e = new Enc()
    .str(p.chain_id)
    .u8(seq.scheme === "ed25519" ? 0 : 1)
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
  return bytesToHex(blake2b256(utf8("pointcast-chain/params/v1"), e.finish()));
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
]);
const DEV_KEY_SET = new Set(DEV_PUBLIC_KEYS);

/**
 * Verify a portable claim (`/account/{a}/drops` → `claim`, `/proof/claim/{a}`,
 * or `pointcast-node prove`) against genesis `params`. Async (WebCrypto).
 *
 * Returns `{ok, verified, signature, devKeys, kind, chainId, genesisHash,
 * height, stateRoot, address, exists, balance, drops, account, reason?}`.
 * `ok` = every structural and Merkle check passed; `verified` = ok AND the
 * sequencer seal checked out (false when WebCrypto lacks Ed25519).
 */
export async function verifyClaim(claim, params, { genesisHash } = {}) {
  const out = { ok: false, verified: false, signature: "unchecked", devKeys: false };
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
    const good = await verifyEd25519(seq.bytes, digest, sig);
    if (good === false) throw new Error("invalid genesis-bound sequencer signature");
    out.signature = good ? "valid" : "unchecked";
    out.ok = true;
    out.verified = good === true;
    if (!good) out.reason = "this runtime has no WebCrypto Ed25519; the Merkle proof checked out but the sequencer seal was not checked";
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
    async getActiveAccount() {
      return { address, publicKey };
    },
    async requestSignPayload({ payload }) {
      const sig = new Uint8Array(await subtle.sign({ name: "Ed25519" }, key, blake2b256(hexToBytes(payload))));
      return { signature: signatureToB58(bytesToHex(sig), "ed25519"), signingType: "micheline" };
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
    const j = await r.json().catch(() => null);
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
    this.devKeys = DEV_KEY_SET.has(parsePublicKey(params.sequencer).bytes);
    this.lastStatus = status;
  }

  async _req(path, body) {
    const init = body === undefined ? {} : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
    const r = await this._fetch(this.node + path, init);
    const text = await r.text();
    let j = null;
    try {
      j = JSON.parse(text);
    } catch {
      j = null;
    }
    if (!r.ok) throw new ChainError((j && j.error) || `${r.status} ${path}`, j);
    return j === null ? text : j;
  }

  async status() {
    this.lastStatus = await this._req("/status");
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
    const text = walletText(tx, this.domain);
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
   * Have a Beacon wallet sign `prepared` (from `digest`). Accepts a Beacon
   * DAppClient, a Taquito BeaconWallet (uses `.client`), or `devWallet()`.
   * The payload handed to the wallet is the locally rebuilt one.
   */
  async signWithBeacon(wallet, prepared) {
    const client = wallet && wallet.client && wallet.client.requestSignPayload ? wallet.client : wallet;
    if (client.isDevWallet && !this.devKeys) throw new ChainError("devWallet only signs on a --dev chain");
    const local = this._local(prepared.tx);
    if (local.payload !== prepared.wallet.payload) throw new ChainError("prepared payload ≠ local rebuild — refusing to sign");
    const account = await client.getActiveAccount();
    if (!account) throw new ChainError("no wallet connected");
    if (account.address !== prepared.tx.sender) throw new ChainError(`wallet is ${account.address}, tx sender is ${prepared.tx.sender}`);
    if (tezosAddress(account.publicKey) !== account.address) throw new ChainError("wallet public key does not match its address");
    const res = await client.requestSignPayload({ signingType: "micheline", payload: local.payload, sourceAddress: account.address });
    const signed = { tx: prepared.tx, sig_mode: "tezos_message", public_key: account.publicKey, signature: res.signature };
    const pk = parsePublicKey(account.publicKey);
    if (pk.scheme === "ed25519") {
      const ok = await verifyEd25519(pk.bytes, hexToBytes(walletSignedDigest(local.text)), parseSignature(res.signature).bytes);
      if (ok === false) throw new ChainError("wallet signature does not verify over the payload");
    }
    return signed;
  }

  /** Run a signed tx through the node's real state machine on a copy of the tip. */
  simulate(signedTx) {
    return this._req("/tx/simulate", signedTx);
  }

  /** POST /tx; checks the node reports the locally computed tx hash. */
  async submit(signedTx) {
    const local = txHash(signedTx);
    const r = await this._req("/tx", signedTx);
    if (r.tx_hash !== local) throw new ChainError(`node reported tx ${r.tx_hash}, expected ${local}`);
    return { txHash: local, status: r.status };
  }

  /** Poll `/tx/{hash}` until included (resolves) or rejected / timeout (throws). */
  async waitForTx(hash, { timeoutMs = 60_000, intervalMs = 1_500 } = {}) {
    if (typeof hash !== "string" || !/^[0-9a-fA-F]{64}$/.test(hash)) throw new ChainError(`not a tx hash: ${hash}`);
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
