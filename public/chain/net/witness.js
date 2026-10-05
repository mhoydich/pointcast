// witness.js: the Daily Net (docs/DAILY_NET.md) on the PointCast devnet.
// Zero dependencies beyond its sibling pointcast-chain.js; ES module; runs in
// Node 22+, browsers and Cloudflare Workers (WebCrypto Ed25519).
//
//   import * as w from "./witness.js";
//   const s = await w.signWitness(seedHex, { chain_id, genesis, epoch, height, block_hash, state_root, tool: "my-bot/1" });
//   // post s.line (plus anything after a newline) on channel WIT, titled w.witnessTitle(...)
//   const v = await w.verifyWitness({ line: body, chain_id, genesis, epoch, signerPublicKey: stx.public_key });
//
// What a witness attestation means, and nothing more: a public claim, tied to
// a free key, "I replayed this chain from genesis with the pinned verifier and
// got this block hash and state root at height h". It is NOT proof of replay:
// someone who copies /status signs the same bytes. It never feeds a verifier,
// never makes a trust tier and is never a checkpoint start. Devnet: no value,
// may reset.
//
// Digest (vectors: sdk/test/witness-vectors.json, written by chain-core's own
// BLAKE2b and ed25519-dalek in crates/chain-core/tests/witness_vectors.rs):
//
//   blake2b-256("pointcast-devnet/witness/v1" ‖ u32be(len chain_id) ‖ chain_id
//               ‖ genesis[32] ‖ epoch[32] ‖ u64be(height) ‖ block_hash[32] ‖ state_root[32])
//
// Signature: raw ed25519 over the 32 digest bytes. Only signWitness signs, and
// it computes the digest itself: there is no raw-digest signer here.

import {
  addressKind, blake2b, bytesToHex, hexToBytes, isValidChainId, isWeakEd25519Key,
  parsePublicKey, tezosAddress, verifyEd25519,
} from "./pointcast-chain.js";

const te = new TextEncoder();

// ---------------------------------------------------------------- constants

/** The witness digest domain tag (unprefixed, like `pointcast-chain/tx/v2`). */
export const WITNESS_DOMAIN = "pointcast-devnet/witness/v1";

/** Body schemas. Each is line one of a body: one compact JSON object. */
export const SCHEMAS = Object.freeze({
  witness: "pointcast-devnet/witness/v1",
  net: "pointcast-devnet/net/v1",
  obs: "pointcast-devnet/obs/v1",
  netReport: "pointcast-devnet/net-report/v1",
  duties: "pointcast-devnet/duties/v1",
  netApi: "pointcast-devnet/net-api/v1",
});

/** Channels a signed Daily Net post goes to (keyless duties land in BOT). */
export const CHANNELS = Object.freeze({ witness: "WIT", net: "NET", obs: "OBS" });

/** A checkpoint is a height h ≥ 10 with h % 10 = 0. */
export const CHECKPOINT_INTERVAL = 10;

/** Every net, witness and obs body fits 2,048 bytes (UTF-8). */
export const BODY_MAX_BYTES = 2048;

/** `name` (a claim, first-come): 2 to 24 of [a-z0-9-]. */
export const NAME_RE = /^[a-z0-9-]{2,24}$/;

/** Names reserved for the house; never a bot's or a witness's. */
export const RESERVED_NAMES = Object.freeze(["house", "net", "witness", "sequencer", "pointcast", "admin", "reporter"]);

/** Duty kinds of `pointcast-devnet/net/v1`, in the order duties list them. */
export const NET_KINDS = Object.freeze(["checkin", "observe", "crosscheck", "review", "digest"]);

/** verifyWitness reasons, in the order the checks run. */
export const WITNESS_REASONS = Object.freeze([
  "malformed", "unsupported_key", "bad_key", "bad_sig", "not_checkpoint", "other_epoch", "premature", "mismatch",
]);

/** What a witness means. Use these words everywhere a witness is shown. */
export const WITNESS_MEANING =
  "A witness is a public claim, tied to a free key: \u201cI replayed this chain from genesis with the pinned verifier and got this block hash and state root at height h.\u201d Wrong or double claims are public evidence against that key.";

/** What a witness does not mean. */
export const WITNESS_LIMITS =
  "It is not proof of replay: strikes only catch disagreement with this server, so a /status copier never gets one and a streak means \u201cagreed with this server\u201d. Everything passes through the server it checks, so a hostile sequencer can censor it; this catches bugs, not a hostile operator. Counts are keys, not people.";

/** The words for a strike. */
export const STRIKE_COPY = "signed a checkpoint this chain does not have: a wrong replay, or it was shown a different chain.";

/** Thrown by the build and parse functions for anything that is not a valid body. */
export class WitnessFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = "WitnessFormatError";
    this.code = "malformed";
  }
}

const fail = (m) => {
  throw new WitnessFormatError(m);
};

// ---------------------------------------------------------------- small checks

const HEX = /^[0-9a-f]+$/;
// Controls, bidi, line/paragraph separators, zero-width and BOM: text that
// displays differently from what it says (the SDK's describeTx set).
const INVISIBLE = /[\u0000-\u001f\u007f-\u009f\u061c\u200b\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/;
const LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/;
const ISO_UTC = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?Z$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const utf8Len = (s) => te.encode(s).length;
const chars = (s) => Array.from(s).length;

/** 64 hex characters (any case in, lowercase out). */
function hash64(name, v) {
  if (typeof v !== "string" || v.length !== 64 || !HEX.test(v.toLowerCase())) fail(`${name}: 64 hex characters`);
  return v.toLowerCase();
}

/** `min`..`max` hex characters (lowercase out); for 12-hex prefixes and full hashes. */
function hexRange(name, v, min, max) {
  if (typeof v !== "string" || v.length < min || v.length > max || !HEX.test(v.toLowerCase())) fail(`${name}: ${min} to ${max} hex characters`);
  return v.toLowerCase();
}

/** A block height in a body: a JSON-safe integer ≥ 1 (Number out). */
function height(name, v) {
  let n = v;
  if (typeof v === "bigint") n = v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : NaN;
  else if (typeof v === "string" && /^[0-9]{1,16}$/.test(v)) n = Number(v);
  if (typeof n !== "number" || !Number.isSafeInteger(n) || n < 1) fail(`${name}: a whole number from 1 to 2^53 - 1`);
  return n;
}

function plain(name, v, max, min = 1) {
  if (typeof v !== "string") fail(`${name}: text`);
  if (INVISIBLE.test(v) || LONE_SURROGATE.test(v)) fail(`${name}: no control, bidi or invisible characters`);
  const n = chars(v);
  if (n < min || n > max) fail(min > 0 ? `${name}: ${min} to ${max} characters` : `${name}: at most ${max} characters`);
  return v;
}

function botName(name, v) {
  if (typeof v !== "string" || !NAME_RE.test(v)) fail(`${name}: 2 to 24 of a-z, 0-9 and -`);
  return v;
}

function oneOf(name, v, list) {
  if (!list.includes(v)) fail(`${name}: one of ${list.join(", ")}`);
  return v;
}

function isoUtc(name, v) {
  const m = typeof v === "string" ? ISO_UTC.exec(v) : null;
  if (!m || !validDay(m[1]) || Number(m[2]) > 23 || Number(m[3]) > 59 || Number(m[4]) > 59) {
    fail(`${name}: an ISO 8601 UTC time like 2026-10-05T17:03:00Z`);
  }
  return v;
}

function validDay(d) {
  if (typeof d !== "string" || !DAY_RE.test(d)) return false;
  const t = Date.parse(`${d}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === d;
}

function day(name, v) {
  if (!validDay(v)) fail(`${name}: a UTC day, YYYY-MM-DD`);
  return v;
}

function onlyKeys(what, o, allowed) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail(`${what}: expected an object`);
  for (const k of Object.keys(o)) if (!allowed.includes(k)) fail(`${what}: unknown field ${JSON.stringify(k).slice(0, 40)}`);
}

function fits(line) {
  if (utf8Len(line) > BODY_MAX_BYTES) fail(`body: over ${BODY_MAX_BYTES} bytes`);
  return line;
}

/** Line one of a body (text after the first newline is ignored), with the whole body ≤ 2,048 bytes. */
function lineOne(text) {
  if (typeof text !== "string") fail("body: expected text");
  if (utf8Len(text) > BODY_MAX_BYTES) fail(`body: over ${BODY_MAX_BYTES} bytes`);
  const i = text.indexOf("\n");
  return i < 0 ? text : text.slice(0, i);
}

function parseLine(line) {
  let o;
  try {
    o = JSON.parse(line);
  } catch {
    fail("line one is not one JSON object"); // never echo the input
  }
  if (!o || typeof o !== "object" || Array.isArray(o)) fail("line one is not one JSON object");
  return o;
}

function u64be(v) {
  let n;
  if (typeof v === "bigint") n = v;
  else if (typeof v === "number" && Number.isSafeInteger(v)) n = BigInt(v);
  else if (typeof v === "string" && /^[0-9]{1,20}$/.test(v)) n = BigInt(v);
  else throw new TypeError("height: a non-negative integer (number, bigint or decimal string)");
  if (n < 0n || n > 0xffffffffffffffffn) throw new RangeError("height: out of u64 range");
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, n);
  return b;
}

function u32be(n) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n);
  return b;
}

function toNumber(name, v) {
  const n = typeof v === "bigint" ? Number(v) : typeof v === "string" && /^[0-9]+$/.test(v) ? Number(v) : v;
  if (typeof n !== "number" || !Number.isSafeInteger(n) || n < 0) throw new TypeError(`${name}: a non-negative safe integer`);
  return n;
}

// ---------------------------------------------------------------- days and checkpoints

/** The UTC day (`YYYY-MM-DD`) of a unix-millisecond time (number, bigint or decimal string). */
export function utcDay(ms) {
  return new Date(toNumber("timestamp", ms)).toISOString().slice(0, 10);
}

/** True for a checkpoint height: h ≥ 10 and h % 10 = 0. */
export function isCheckpoint(h) {
  try {
    const n = toNumber("height", h);
    return n >= CHECKPOINT_INTERVAL && n % CHECKPOINT_INTERVAL === 0;
  } catch {
    return false;
  }
}

/** The latest checkpoint sealed at `tip` (a height): floor(tip / 10) × 10, or null below 10. */
export function checkpointAt(tip) {
  const h = toNumber("tip", tip);
  return h < CHECKPOINT_INTERVAL ? null : h - (h % CHECKPOINT_INTERVAL);
}

/**
 * The day checkpoint: ceil(first height of the UTC day / 10) × 10, once
 * sealed, else null (an idle chain seals it within the heartbeat, ~50 min).
 *
 * `headers`: block headers (`{height, timestamp}`, unix ms), any order, that
 * cover the day from the block before its first one (or from height 1) up to
 * the tip; a replay from genesis has them all. `day` defaults to the UTC day
 * of the highest header. Throws if the headers start inside the day, because
 * then its first height is unknown.
 */
export function dayCheckpoint(headers, { day: want } = {}) {
  const hs = Array.from(headers || [], (h) => ({ height: toNumber("height", h.height), timestamp: toNumber("timestamp", h.timestamp) }))
    .sort((a, b) => a.height - b.height);
  if (!hs.length) return null;
  const tip = hs[hs.length - 1];
  const d = want === undefined ? utcDay(tip.timestamp) : want;
  if (!validDay(d)) throw new TypeError("day: YYYY-MM-DD");
  const i = hs.findIndex((h) => utcDay(h.timestamp) === d);
  if (i < 0) return null;
  const first = hs[i];
  if (first.height > 1 && (i === 0 || hs[i - 1].height !== first.height - 1)) {
    throw new RangeError("dayCheckpoint: the headers start inside the day; include the block before its first one");
  }
  const cp = Math.max(CHECKPOINT_INTERVAL, Math.ceil(first.height / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL);
  return tip.height >= cp ? cp : null;
}

/**
 * The day a post counts on (docs/DAILY_NET.md, Day counting), or "wrong_day".
 * - witness attestations count on the UTC day of the block that includes them;
 * - custodial (Worker-written) net posts count on their body `day`;
 * - signed net and obs posts count on their body `day` if it is the block's UTC
 *   day, or the previous day for blocks before 00:10 UTC; anything else is
 *   "wrong_day".
 */
export function countedDay({ kind = "net", bodyDay, blockTimestamp, custodial = false } = {}) {
  const ts = toNumber("blockTimestamp", blockTimestamp);
  const blockDay = utcDay(ts);
  if (kind === "witness") return blockDay;
  if (custodial) return validDay(bodyDay) ? bodyDay : "wrong_day";
  if (bodyDay === blockDay) return blockDay;
  const startOfDay = Date.parse(`${blockDay}T00:00:00Z`);
  const previous = utcDay(startOfDay - 1);
  return ts - startOfDay < 10 * 60_000 && bodyDay === previous ? previous : "wrong_day";
}

// ---------------------------------------------------------------- witness bodies

/**
 * The witness digest (hex) of `{chain_id, genesis, epoch, height, block_hash,
 * state_root}`: blake2b-256(domain ‖ str(chain_id) ‖ genesis ‖ epoch ‖
 * u64be(height) ‖ block_hash ‖ state_root). `epoch` is the Header::hash of
 * block 1 (a storage wipe keeps the genesis but not the epoch).
 */
export function witnessDigest(f) {
  if (!f || typeof f !== "object") throw new TypeError("witnessDigest: expected an object");
  if (!isValidChainId(f.chain_id)) throw new TypeError("chain_id: [a-z0-9][a-z0-9._-]{0,63}");
  const cid = te.encode(f.chain_id);
  const parts = [
    te.encode(WITNESS_DOMAIN), u32be(cid.length), cid,
    hexToBytes(hash64("genesis", f.genesis)), hexToBytes(hash64("epoch", f.epoch)), u64be(f.height),
    hexToBytes(hash64("block_hash", f.block_hash)), hexToBytes(hash64("state_root", f.state_root)),
  ];
  return bytesToHex(blake2b(parts, 32));
}

const WITNESS_KEYS = ["schema", "epoch", "height", "block_hash", "state_root", "replayed_from", "tool", "name", "public_key", "signature"];

/**
 * Line one of a witness body: compact JSON, this key order, lowercase hex.
 * `{epoch, height, block_hash, state_root, replayed_from = 1, tool, name?,
 * public_key, signature}`; `schema` may be passed (it must be the witness
 * schema). Hex comes out lowercase.
 */
export function buildWitnessBody(f) {
  onlyKeys("witness body", f, WITNESS_KEYS);
  if (f.schema !== undefined && f.schema !== SCHEMAS.witness) fail(`schema: ${SCHEMAS.witness}`);
  if (f.replayed_from !== undefined && f.replayed_from !== 1) fail("replayed_from: 1 (a witness replays from genesis)");
  const o = {
    schema: SCHEMAS.witness,
    epoch: hash64("epoch", f.epoch),
    height: height("height", f.height),
    block_hash: hash64("block_hash", f.block_hash),
    state_root: hash64("state_root", f.state_root),
    replayed_from: 1,
    tool: plain("tool", f.tool, 64),
  };
  if (f.name !== undefined && f.name !== null) o.name = botName("name", f.name);
  o.public_key = hash64("public_key", f.public_key);
  if (typeof f.signature !== "string" || f.signature.length !== 128 || !HEX.test(f.signature.toLowerCase())) fail("signature: 128 hex characters");
  o.signature = f.signature.toLowerCase();
  return fits(JSON.stringify(o));
}

/**
 * The fields of a witness body (`text`: the whole body or line one). Throws
 * WitnessFormatError unless line one is exactly `buildWitnessBody` of its own
 * fields (canonical: compact JSON, the key order, lowercase hex, no unknown
 * keys) and the body fits 2,048 bytes.
 */
export function parseWitnessBody(text) {
  const line = lineOne(text);
  const o = parseLine(line);
  onlyKeys("witness body", o, WITNESS_KEYS);
  for (const k of WITNESS_KEYS) if (k !== "name" && !Object.hasOwn(o, k)) fail(`witness body: missing ${k}`);
  if (o.schema !== SCHEMAS.witness) fail(`schema: ${SCHEMAS.witness}`);
  if (typeof o.height !== "number") fail("height: a JSON number");
  if (buildWitnessBody(o) !== line) fail("witness body: not canonical (compact JSON, key order, lowercase hex)");
  const out = {
    schema: o.schema, epoch: o.epoch, height: o.height, block_hash: o.block_hash, state_root: o.state_root,
    replayed_from: o.replayed_from, tool: o.tool,
  };
  if (o.name !== undefined) out.name = o.name;
  out.public_key = o.public_key;
  out.signature = o.signature;
  return out;
}

/** `witness · h570 · root 41b57c3d08ab[ · name]` */
export function witnessTitle(f) {
  const h = height("height", f && f.height);
  const root = hash64("state_root", f.state_root).slice(0, 12);
  const name = f.name === undefined || f.name === null ? "" : ` · ${botName("name", f.name)}`;
  return `witness · h${h} · root ${root}${name}`;
}

// ---------------------------------------------------------------- keys and signatures

const PKCS8_ED25519 = hexToBytes("302e020100300506032b657004220420");
const SEED_RE = /^[0-9a-fA-F]{64}$/;

function subtle() {
  const s = globalThis.crypto && globalThis.crypto.subtle;
  if (!s) throw new Error("witness.js needs WebCrypto (Node 22+, a browser or a Worker)");
  return s;
}

function b64urlToHex(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return bytesToHex(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
}

/** A signing key from a 32-byte seed (hex). Errors never repeat the seed. */
async function keyFromSeed(seedHex) {
  if (typeof seedHex !== "string" || !SEED_RE.test(seedHex)) throw new TypeError("seed: 64 hex characters (the seed itself is never printed)");
  const pkcs8 = new Uint8Array(PKCS8_ED25519.length + 32);
  pkcs8.set(PKCS8_ED25519);
  pkcs8.set(hexToBytes(seedHex), PKCS8_ED25519.length);
  try {
    const key = await subtle().importKey("pkcs8", pkcs8, { name: "Ed25519" }, true, ["sign"]);
    const { x } = await subtle().exportKey("jwk", key);
    return { key, publicKeyHex: b64urlToHex(x) };
  } finally {
    pkcs8.fill(0);
  }
}

/** `{publicKeyHex, address}` (a tz1) of an ed25519 seed. Any ed25519 key is a tz1 account: no faucet, no registration. */
export async function ed25519FromSeed(seedHex) {
  const { publicKeyHex } = await keyFromSeed(seedHex);
  return { publicKeyHex, address: tezosAddress({ scheme: "ed25519", bytes: publicKeyHex }) };
}

const P25519 = (1n << 255n) - 19n;
const ED25519_D = 37095705934669439343138083508754565189542113879843219016388785533085940283555n;
/** The ed25519 group order ℓ. */
const ELL = (1n << 252n) + 27742317777372353535851937790883648493n;

function modPow(b, e, m) {
  let r = 1n;
  b %= m;
  for (; e > 0n; e >>= 1n) {
    if (e & 1n) r = (r * b) % m;
    b = (b * b) % m;
  }
  return r;
}

/** 32 bytes that decompress to a curve point (y read mod p, either sign bit), as ed25519-dalek reads them. */
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

/** S < ℓ (S is the signature's last 32 bytes, little-endian): the strict form verify_strict wants. */
function canonicalS(sigHex) {
  const b = hexToBytes(sigHex);
  let s = 0n;
  for (let i = 63; i >= 32; i--) s = (s << 8n) | BigInt(b[i]);
  return s < ELL;
}

/**
 * Sign a witness attestation. `f`: `{chain_id, genesis, epoch, height,
 * block_hash, state_root, tool, name?}` from YOUR OWN replay (never from a
 * server's /status or /duties: copying them makes the claim worthless).
 * Returns `{line, digest, public_key, signature, address, title}`; `line` is
 * line one of the WIT body. The digest is computed here; the signature is
 * checked before it is returned.
 */
export async function signWitness(seedHex, f) {
  if (!f || typeof f !== "object") throw new TypeError("signWitness: expected the checkpoint fields");
  const claim = {
    chain_id: f.chain_id,
    genesis: hash64("genesis", f.genesis),
    epoch: hash64("epoch", f.epoch),
    height: height("height", f.height),
    block_hash: hash64("block_hash", f.block_hash),
    state_root: hash64("state_root", f.state_root),
  };
  if (!isCheckpoint(claim.height)) throw new RangeError(`height ${claim.height} is not a checkpoint (h ≥ 10, h % 10 = 0)`);
  plain("tool", f.tool, 64);
  if (f.name !== undefined && f.name !== null) botName("name", f.name);
  const { key, publicKeyHex } = await keyFromSeed(seedHex);
  const digest = witnessDigest(claim);
  const signature = bytesToHex(new Uint8Array(await subtle().sign({ name: "Ed25519" }, key, hexToBytes(digest))));
  const line = buildWitnessBody({
    epoch: claim.epoch, height: claim.height, block_hash: claim.block_hash, state_root: claim.state_root,
    replayed_from: 1, tool: f.tool, name: f.name ?? undefined, public_key: publicKeyHex, signature,
  });
  const check = await verifyWitness({
    line, chain_id: claim.chain_id, genesis: claim.genesis, epoch: claim.epoch,
    signerPublicKey: { scheme: "ed25519", bytes: publicKeyHex },
  });
  if (!check.ok) throw new Error(`signWitness: the new signature does not verify (${check.reason})`);
  return {
    line,
    digest,
    public_key: publicKeyHex,
    signature,
    address: tezosAddress({ scheme: "ed25519", bytes: publicKeyHex }),
    title: witnessTitle({ height: claim.height, state_root: claim.state_root, name: f.name }),
  };
}

/**
 * Check a witness body. Steps (docs/DAILY_NET.md, Witness attestation):
 *  1. line one is canonical (`malformed`);
 *  2. a tz2 or pcp1 `sender`, or a non-ed25519 `signerPublicKey`, is
 *     `unsupported_key`; the tx's key (edpk or `{scheme, bytes}`) must be the
 *     body's `public_key`, and that key a real, non-weak point (`bad_key`);
 *  3. the signature verifies over the recomputed digest with S < ℓ (`bad_sig`);
 *  then the height is a checkpoint (`not_checkpoint`), `epoch` is this
 *  chain's (`other_epoch`), and if given, the attested height was sealed
 *  before `includedAt` (`premature`) and `chain` (`{block_hash, state_root}`
 *  at that height, from your replay or the server's blocks) agrees
 *  (`mismatch`).
 *
 * Returns `{ok, reason, digest, claim}`: `reason` is null when ok, `claim` is
 * `{epoch, height, block_hash, state_root}` once the body parses. `ok` without
 * `chain` means the signature and form are good, not that the claim is true.
 */
export async function verifyWitness({ line, chain_id, genesis, epoch, signerPublicKey, sender, chain, includedAt } = {}) {
  if (!isValidChainId(chain_id)) throw new TypeError("verifyWitness: chain_id");
  const g = hash64("genesis", genesis);
  const ep = hash64("epoch", epoch);
  const res = (ok, reason, digest = null, claim = null) => ({ ok, reason, digest, claim });
  let f;
  try {
    f = parseWitnessBody(line);
  } catch {
    return res(false, "malformed");
  }
  const claim = { epoch: f.epoch, height: f.height, block_hash: f.block_hash, state_root: f.state_root };
  const digest = witnessDigest({ chain_id, genesis: g, ...claim });
  const no = (reason) => res(false, reason, digest, claim);
  if (sender !== undefined && sender !== null) {
    const k = addressKind(sender);
    if (k === "tz2" || k === "passkey") return no("unsupported_key");
  }
  if (signerPublicKey !== undefined && signerPublicKey !== null) {
    let pk;
    try {
      pk = parsePublicKey(signerPublicKey);
    } catch {
      return no("bad_key");
    }
    if (pk.scheme !== "ed25519") return no("unsupported_key");
    if (pk.bytes.toLowerCase() !== f.public_key) return no("bad_key");
  }
  if (isWeakEd25519Key(f.public_key) || !isEd25519Point(hexToBytes(f.public_key))) return no("bad_key");
  if (!canonicalS(f.signature)) return no("bad_sig");
  const ok = await verifyEd25519(f.public_key, hexToBytes(digest), f.signature);
  if (ok === null) throw new Error("verifyWitness needs WebCrypto Ed25519 (Node 22+, a browser or a Worker)");
  if (!ok) return no("bad_sig");
  if (!isCheckpoint(f.height)) return no("not_checkpoint");
  if (f.epoch !== ep) return no("other_epoch");
  if (includedAt !== undefined && includedAt !== null && f.height >= toNumber("includedAt", includedAt)) return no("premature");
  if (chain !== undefined && chain !== null) {
    if (hash64("chain.block_hash", chain.block_hash) !== f.block_hash || hash64("chain.state_root", chain.state_root) !== f.state_root) {
      return no("mismatch");
    }
  }
  return res(true, null, digest, claim);
}

// ---------------------------------------------------------------- net duty bodies

const NET_FIELDS = Object.freeze({
  checkin: ["note", "name"],
  observe: ["height", "state_root", "tip_hash", "seen_at"],
  crosscheck: ["of_tx", "height", "claimed_root", "chain_root", "links_checked", "result"],
  review: ["items"],
  digest: ["text", "cites"],
});

/**
 * Line one of a `pointcast-devnet/net/v1` duty body: `{schema, day, kind, …}`
 * with the kind's fields in this order:
 *
 *   checkin    {note? ≤140, name?}            (name: own-key authors only)
 *   observe    {height, state_root, tip_hash, seen_at}   hashes 12–64 hex, seen_at ISO UTC
 *   crosscheck {of_tx, height, claimed_root, chain_root, links_checked 0..64, result: match|mismatch}
 *   review     {items: [{tx, rating: good|unclear|flag, reason ≤48}] 1..5}
 *   digest     {text ≤1200, cites: [tx] ≤20}
 *
 * `day` is the UTC day (`YYYY-MM-DD`) the post is for. Unknown fields throw.
 */
export function buildNetBody(kind, fields = {}, dayStr) {
  oneOf("kind", kind, NET_KINDS);
  onlyKeys(`${kind} fields`, fields, NET_FIELDS[kind]);
  const o = { schema: SCHEMAS.net, day: day("day", dayStr), kind };
  const has = (k) => fields[k] !== undefined && fields[k] !== null;
  switch (kind) {
    case "checkin":
      if (has("note")) o.note = plain("note", fields.note, 140);
      if (has("name")) o.name = botName("name", fields.name);
      break;
    case "observe":
      o.height = height("height", fields.height);
      o.state_root = hexRange("state_root", fields.state_root, 12, 64);
      o.tip_hash = hexRange("tip_hash", fields.tip_hash, 12, 64);
      o.seen_at = isoUtc("seen_at", fields.seen_at);
      break;
    case "crosscheck": {
      o.of_tx = hash64("of_tx", fields.of_tx);
      o.height = height("height", fields.height);
      o.claimed_root = hexRange("claimed_root", fields.claimed_root, 12, 64);
      o.chain_root = hexRange("chain_root", fields.chain_root, 12, 64);
      const n = fields.links_checked;
      if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 64) fail("links_checked: a whole number from 0 to 64");
      o.links_checked = n;
      o.result = oneOf("result", fields.result, ["match", "mismatch"]);
      break;
    }
    case "review": {
      const items = fields.items;
      if (!Array.isArray(items) || items.length < 1 || items.length > 5) fail("items: 1 to 5 reviews");
      const seen = new Set();
      o.items = items.map((it, i) => {
        onlyKeys(`items[${i}]`, it, ["tx", "rating", "reason"]);
        const tx = hash64(`items[${i}].tx`, it.tx);
        if (seen.has(tx)) fail(`items[${i}].tx: reviewed twice`);
        seen.add(tx);
        return { tx, rating: oneOf(`items[${i}].rating`, it.rating, ["good", "unclear", "flag"]), reason: plain(`items[${i}].reason`, it.reason, 48) };
      });
      break;
    }
    case "digest": {
      o.text = plain("text", fields.text, 1200);
      const cites = fields.cites ?? [];
      if (!Array.isArray(cites) || cites.length > 20) fail("cites: at most 20 tx hashes");
      o.cites = cites.map((t, i) => hash64(`cites[${i}]`, t));
      if (new Set(o.cites).size !== o.cites.length) fail("cites: a tx cited twice");
      break;
    }
  }
  return fits(JSON.stringify(o));
}

/** `{schema, day, kind, …fields}` of a net body; throws unless line one is exactly `buildNetBody` of its fields. */
export function parseNetBody(text) {
  const line = lineOne(text);
  const o = parseLine(line);
  if (o.schema !== SCHEMAS.net) fail(`schema: ${SCHEMAS.net}`);
  oneOf("kind", o.kind, NET_KINDS);
  const { schema, day: d, kind, ...fields } = o;
  if (buildNetBody(kind, fields, d) !== line) fail("net body: not canonical (compact JSON, key order, lowercase hex)");
  return { schema, day: d, kind, ...fields };
}

// ---------------------------------------------------------------- obs signals

const OBS_KEYS = ["schema", "label", "text", "sources", "observed_at"];

function httpsSource(name, s) {
  if (typeof s !== "string" || utf8Len(s) > 512 || /\s/.test(s) || INVISIBLE.test(s)) fail(`${name}: an https:// link of at most 512 bytes`);
  let u;
  try {
    u = new URL(s);
  } catch {
    fail(`${name}: an https:// link`);
  }
  if (u.protocol !== "https:" || !u.hostname || u.username || u.password) fail(`${name}: an https:// link`);
  return s;
}

/**
 * Line one of a `pointcast-devnet/obs/v1` signal: `{schema, label:
 * fact|reported|speculation, text ≤600, sources: [https] 1..3, observed_at}`.
 * Cite primary sources (aviationweather.gov for a METAR, not a mirror).
 */
export function buildObsBody(f) {
  onlyKeys("obs body", f, OBS_KEYS);
  if (f.schema !== undefined && f.schema !== SCHEMAS.obs) fail(`schema: ${SCHEMAS.obs}`);
  const sources = f.sources;
  if (!Array.isArray(sources) || sources.length < 1 || sources.length > 3) fail("sources: 1 to 3 https:// links");
  const o = {
    schema: SCHEMAS.obs,
    label: oneOf("label", f.label, ["fact", "reported", "speculation"]),
    text: plain("text", f.text, 600),
    sources: sources.map((s, i) => httpsSource(`sources[${i}]`, s)),
    observed_at: isoUtc("observed_at", f.observed_at),
  };
  if (new Set(o.sources).size !== o.sources.length) fail("sources: a link listed twice");
  return fits(JSON.stringify(o));
}

/** The fields of an obs body; throws unless line one is exactly `buildObsBody` of them. */
export function parseObsBody(text) {
  const line = lineOne(text);
  const o = parseLine(line);
  if (o.schema !== SCHEMAS.obs) fail(`schema: ${SCHEMAS.obs}`);
  for (const k of OBS_KEYS) if (!Object.hasOwn(o, k)) fail(`obs body: missing ${k}`);
  if (buildObsBody(o) !== line) fail("obs body: not canonical (compact JSON, key order)");
  return { schema: o.schema, label: o.label, text: o.text, sources: o.sources, observed_at: o.observed_at };
}

/** True when a body's first line claims a Daily Net schema (what /bot/post and chain_post refuse). */
export function claimsNetSchema(body) {
  return typeof body === "string" && body.startsWith('{"schema":"pointcast-devnet/');
}
