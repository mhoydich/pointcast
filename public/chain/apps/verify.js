// verify.js: the logic behind "Verify a block by hand" (/chain/verify-a-block).
//
// An ES module with no DOM access, so the page and node can run the same
// steps (tests/chain-app-verify.test.mjs, scripts/e2e-chain-app-verify.mjs).
// The page draws what runSteps() returns, as text only: nothing read from
// the devnet ever becomes markup, an href, a src or a style value.
//
// Which tool does which step:
//   1 fetch              browser fetch(): GET /raw/block/N-1, N, N+1, /params, /status
//   2 header hash, links blockHeaderHash from the PointCast Chain SDK (v0.2,
//                        /chain/first-mints/lib/pointcast-chain.js), over the
//                        bytes this file lays out; blake2b is the SDK's
//   3 seal               paramsHash + sealDigest + verifyEd25519 (SDK, WebCrypto)
//   4 tx ids, tx_root    encodeTx + txHash + txRoot (SDK); the tree shown is
//                        built here with the SDK's blake2b and compared with txRoot
//   5 signatures, senders signingHash, walletText, verifyEd25519, tezosAddress,
//                        agentAddress (SDK); optional second opinion: the pinned
//                        wasm verifier's tx.wallet op, the chain's own Rust code,
//                        through /chain/yard/verifier/verify.js
//
// What it cannot do is said in the page and in the steps: the state root is
// not recomputed (that needs every block replayed), a passkey (P-256)
// signature is not checked, and a seal is checked against the key in the
// genesis params, not against a rotated key.
//
// The steps are an accountable claim about one copy of one block, not proof
// of anything about the rest of the chain. devnet: no value, may reset.

import * as pcc from '../first-mints/lib/pointcast-chain.js';
import { PointcastVerifier, sha256Hex } from '../yard/verifier/verify.js';

// ---------------------------------------------------------------- constants

export const DOMAIN = Object.freeze({
  header: 'pointcast-chain/header/v1',
  seal: 'pointcast-chain/seal/v2',
  txid: 'pointcast-chain/txid/v1',
  tx: 'pointcast-chain/tx/v2',
  merkleEmpty: 'pointcast-chain/merkle/empty',
});

export const LIMITS = Object.freeze({
  timeoutMs: 10000,
  maxBodyChars: 2000000,
  maxTxs: 1000,
  txsShown: 12,
  leavesShown: 8,
  bytesShown: 96,
  walkMaxBlocks: 20000,
  walkPage: 500,
  feedLimit: 12,
});

export const STEP_TITLES = Object.freeze({
  fetch: 'Fetch the block and its neighbours',
  link: 'Recompute the header hash and check the links',
  seal: 'Check the sequencer’s seal',
  txroot: 'Recompute every transaction id and the tx_root',
  sigs: 'Check each signature and where the sender comes from',
});

/** What the reader can flip in the in-memory copy. `needs: 'tx'` kinds are unavailable on an empty block. */
export const TAMPERS = Object.freeze([
  { id: 'title', label: 'a letter of a transaction’s text (a title, name, label or edition)', needs: 'tx' },
  { id: 'tx_signature', label: 'a byte of the first transaction’s signature', needs: 'tx' },
  { id: 'prev_hash', label: 'a byte of this block’s prev_hash', needs: null },
  { id: 'seal', label: 'a byte of the sequencer’s seal on this block', needs: null },
  { id: 'state_root', label: 'a byte of this block’s state_root', needs: null },
  { id: 'tx_drop', label: 'remove the first transaction (a deletion, not a byte flip)', needs: 'tx' },
]);

const te = new TextEncoder();
const hex = pcc.bytesToHex;
const unhex = pcc.hexToBytes;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isHex = (s, bytes) => typeof s === 'string' && s.length === bytes * 2 && !/[^0-9a-f]/.test(s);
// U+200C and U+200D (the zero-width non-joiner and joiner) are kept: they join emoji sequences and spell Persian, Urdu and Indic text, and they hide nothing a
// line of text could use that the other invisible characters do not. The zero-width space (200B), the direction marks (200E, 200F, 202A-202E, 2066-2069) and the rest are replaced by spaces.
const INVISIBLE = [[0, 31], [127, 159], [173, 173], [0x61c, 0x61c], [0x200b, 0x200b], [0x200e, 0x200f], [0x2028, 0x202e], [0x2060, 0x206f], [0xfeff, 0xfeff]];
const isInvisible = (cp) => INVISIBLE.some(([a, b]) => cp >= a && cp <= b);

/** Hostile text, one safe line of at most `max` characters. Non-strings give ''. */
export function cleanText(v, max = 120) {
  if (typeof v !== 'string') return '';
  const flat = Array.from(v.slice(0, 2000)).map((ch) => (isInvisible(ch.codePointAt(0)) ? ' ' : ch)).join('').replace(/\s+/g, ' ').trim();
  const chars = Array.from(flat);
  return chars.length <= max ? flat : chars.slice(0, Math.max(1, max - 1)).join('').trimEnd() + '…';
}

const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};
const u32be = (n) => Uint8Array.of((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
const u64hex = (v) => BigInt(v).toString(16).padStart(16, '0');
const blake = (...parts) => pcc.blake2b(parts, 32);

// ---------------------------------------------------------------- the ?devnet= override

/**
 * `?devnet=http://127.0.0.1:8799` for local end-to-end runs. Honoured only
 * for http(s) at the host `localhost` or `127.0.0.1`, no credentials; the
 * result is the bare origin. `&genesis=<64 hex>` may pin that node's genesis.
 * Anything else (another host, another scheme, a lookalike) is null and the
 * page uses the live devnet.
 */
export function devnetOverride(search) {
  let q;
  try { q = new URLSearchParams(String(search || '')); } catch { return null; }
  const raw = q.get('devnet');
  if (!raw) return null;
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return null;
  if (u.username || u.password) return null;
  const g = String(q.get('genesis') || '').toLowerCase();
  return { api: u.origin, genesis: isHex(g, 32) ? g : null };
}

/** A block number from reader input: a whole number from 1 up to `tip` (or just 1 up when tip is unknown), else null. */
export function parseBlockNumber(raw, tip) {
  const s = String(raw === undefined || raw === null ? '' : raw).trim().replace(/^#/, '');
  if (!s || /[^0-9]/.test(s) || s.length > 15) return null;
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n < 1) return null;
  if (Number.isSafeInteger(tip) && n > tip) return null;
  return n;
}

/** The block the page opens on: a few behind the tip, so both neighbours exist. */
export function defaultBlock(tip) {
  if (!Number.isSafeInteger(tip) || tip < 1) return 1;
  if (tip <= 4) return Math.max(1, tip - 1);
  return tip - 3;
}

/** A block number from a URL fragment like `#b=3318`, else null. */
export function blockFromHash(hash) {
  const m = /^#b=([0-9]{1,15})/.exec(String(hash || ''));
  return m ? parseBlockNumber(m[1]) : null;
}

// ---------------------------------------------------------------- reading the devnet

class HttpError extends Error {
  constructor(status, path) {
    super('devnet answered ' + status + ' for ' + path);
    this.status = status;
  }
}

async function getText(api, path, env = {}) {
  const f = env.fetch || ((...a) => globalThis.fetch(...a));
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => ctrl && ctrl.abort(), env.timeoutMs || LIMITS.timeoutMs);
  try {
    const res = await f(api + path, { signal: ctrl ? ctrl.signal : undefined, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
    if (!res) throw new HttpError(0, path);
    if (res.status === 404) return null;
    if (!res.ok) throw new HttpError(res.status, path);
    const text = await res.text();
    if (text.length > LIMITS.maxBodyChars) throw new Error('response too large: ' + path);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function getExact(api, path, env) {
  const text = await getText(api, path, env);
  return text === null ? null : { text, json: pcc.parseJsonExact(text) };
}

/** A raw block, checked for the shape this page relies on. Throws with the reason. */
export function readBlock(json, label = 'block') {
  const bad = (why) => new Error(label + ' is malformed: ' + why);
  if (!isObj(json) || !isObj(json.header) || !Array.isArray(json.txs)) throw bad('no header or txs');
  const h = json.header;
  const whole = (v) => (typeof v === 'bigint' ? v >= 0n : Number.isSafeInteger(v) && v >= 0);
  if (!whole(h.height) || BigInt(h.height) < 1n || BigInt(h.height) > BigInt(Number.MAX_SAFE_INTEGER)) throw bad('height');
  if (!whole(h.timestamp)) throw bad('timestamp');
  for (const k of ['prev_hash', 'tx_root', 'state_root']) if (!isHex(h[k], 32)) throw bad(k + ' is not 32 bytes of hex');
  if (!isHex(h.sequencer_sig, 64)) throw bad('sequencer_sig is not 64 bytes of hex');
  if (json.txs.length > LIMITS.maxTxs) throw bad('too many transactions');
  json.txs.forEach((t, i) => {
    const ok = isObj(t) && isObj(t.tx) && typeof t.tx.type === 'string' && typeof t.tx.sender === 'string' && isObj(t.public_key) && typeof t.signature === 'string';
    if (!ok) throw bad('transaction ' + i);
  });
  return json;
}

function readStatus(json) {
  if (!isObj(json) || typeof json.chain_id !== 'string' || !isHex(json.genesis_hash, 32) || !Number.isSafeInteger(json.height) || json.height < 0) throw new Error('the devnet’s /status is not the shape this page reads');
  return { chainId: cleanText(json.chain_id, 64), genesis: json.genesis_hash, height: json.height, tipHash: isHex(json.tip_hash, 32) ? json.tip_hash : '' };
}

/** GET /status: { chainId, genesis, height, tipHash }. */
export async function loadStatus(api, env) {
  const st = await getExact(api, '/status', env);
  if (!st) throw new Error('the devnet has no /status');
  return readStatus(st.json);
}

/** /status and /params, read and checked. `paramsHash` is null when the params cannot be hashed. */
export async function loadChain(api, env) {
  const [status, pr] = await Promise.all([loadStatus(api, env), getExact(api, '/params', env)]);
  if (!pr || !isObj(pr.json)) throw new Error('the devnet has no /params');
  let paramsHash = null;
  let paramsError = '';
  try { paramsHash = pcc.paramsHash(pr.json); } catch (e) { paramsError = cleanText(e && e.message, 120); }
  return { api, status, params: pr.json, paramsHash, paramsError };
}

/** Blocks N-1, N and N+1. N-1 is null at block 1; N+1 is null at the tip. Throws when N (or N-1) is missing. */
export async function fetchBlockSet(api, n, env) {
  const want = [n > 1 ? n - 1 : null, n, n + 1];
  const got = await Promise.all(want.map((h) => (h === null ? null : getExact(api, '/raw/block/' + h, env))));
  if (!got[1]) throw new Error('block ' + n + ' is not on the devnet (yet)');
  if (n > 1 && !got[0]) throw new Error('block ' + (n - 1) + ' is not on the devnet');
  return {
    n,
    paths: want.filter((h) => h !== null).map((h) => '/raw/block/' + h),
    prev: got[0] ? readBlock(got[0].json, 'block ' + (n - 1)) : null,
    block: readBlock(got[1].json, 'block ' + n),
    next: got[2] ? readBlock(got[2].json, 'block ' + (n + 1)) : null,
    chars: got.reduce((a, g) => a + (g ? g.text.length : 0), 0),
  };
}

/** Heights of recent blocks that carry transactions (GET /feed skips empty blocks). Numbers only. */
export async function recentTxBlocks(api, env) {
  const r = await getExact(api, '/feed?limit=' + LIMITS.feedLimit, env);
  if (!r || !isObj(r.json) || !Array.isArray(r.json.blocks)) return [];
  const out = [];
  for (const b of r.json.blocks) {
    const h = isObj(b) ? b.height : null;
    if (typeof h === 'number' && Number.isSafeInteger(h) && h >= 1 && !out.includes(h)) out.push(h);
  }
  return out;
}

// ---------------------------------------------------------------- the bytes, laid out

/** The header's hash preimage as labelled parts: the exact bytes blockHeaderHash hashes. */
export function headerParts(h) {
  return [
    ['height · 8 bytes', u64hex(h.height)],
    ['prev_hash · 32 bytes', h.prev_hash],
    ['timestamp ms · 8 bytes', u64hex(h.timestamp)],
    ['tx_root · 32 bytes', h.tx_root],
    ['state_root · 32 bytes', h.state_root],
  ];
}

/** blake2b-256(domain ‖ parts), from the displayed parts; hex. */
export function hashHeaderParts(parts) {
  return hex(blake(te.encode(DOMAIN.header), unhex(parts.map((p) => p[1]).join(''))));
}

/** The header hash, computed from the laid-out bytes and checked against the SDK's blockHeaderHash. */
export function headerHashOf(h) {
  const mine = hashHeaderParts(headerParts(h));
  const sdk = pcc.blockHeaderHash(h);
  if (mine !== sdk) throw new Error('internal: the laid-out header bytes and the SDK disagree');
  return mine;
}

/** The seal digest: blake2b-256(seal domain ‖ genesis ‖ header hash); hex. Checked against the SDK's sealDigest. */
export function sealDigestOf(h, genesis) {
  const mine = hex(blake(te.encode(DOMAIN.seal), unhex(genesis), unhex(headerHashOf(h))));
  if (mine !== pcc.sealDigest(h, genesis)) throw new Error('internal: the laid-out seal digest and the SDK disagree');
  return mine;
}

/** A signed tx's canonical bytes for raw and wallet signatures: { unsigned, signed } hex, or null for a passkey envelope. */
export function signedTxBytes(stx) {
  const mode = stx.sig_mode === undefined || stx.sig_mode === null ? 'raw' : stx.sig_mode;
  if (mode !== 'raw' && mode !== 'tezos_message') return null;
  const pk = pcc.parsePublicKey(stx.public_key);
  const sig = unhex(pcc.parseSignature(stx.signature).bytes);
  const keyBytes = unhex(pk.bytes);
  const unsigned = pcc.encodeTx(stx.tx);
  const tail = concat(Uint8Array.of(pcc.schemeByte(pk.scheme)), u32be(keyBytes.length), keyBytes, u32be(sig.length), sig, mode === 'tezos_message' ? Uint8Array.of(1) : new Uint8Array(0));
  return { unsigned: hex(unsigned), signed: hex(concat(unsigned, tail)) };
}

/** The tx id: blake2b-256(txid domain ‖ signed bytes). Laid-out bytes checked against the SDK's txHash. */
export function txIdOf(stx) {
  const sdk = pcc.txHash(stx);
  const b = signedTxBytes(stx);
  if (!b) return sdk;
  const mine = hex(blake(te.encode(DOMAIN.txid), unhex(b.signed)));
  if (mine !== sdk) throw new Error('internal: the laid-out tx bytes and the SDK disagree');
  return mine;
}

/** Merkle levels over tx ids: [leaves, …, [root]]; leaves are blake2b(0x00 ‖ id), nodes blake2b(0x01 ‖ l ‖ r), an odd node moves up unchanged. Hex. */
export function merkleLevels(txids) {
  if (!txids.length) return [[hex(blake(te.encode(DOMAIN.merkleEmpty)))]];
  let level = txids.map((id) => blake(Uint8Array.of(0), unhex(id)));
  const levels = [level.map(hex)];
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) next.push(i + 1 < level.length ? blake(Uint8Array.of(1), level[i], level[i + 1]) : level[i]);
    level = next;
    levels.push(level.map(hex));
  }
  return levels;
}

/** Split two hex strings into runs, marking where `got` differs from `want`: [[text, differs], …]. */
export function diffRuns(got, want) {
  const runs = [];
  for (let i = 0; i < got.length; i++) {
    const d = got[i] !== want[i];
    if (runs.length && runs[runs.length - 1][1] === d) runs[runs.length - 1][0] += got[i];
    else runs.push([got[i], d]);
  }
  return runs;
}

const clip = (h, max = LIMITS.bytesShown) => (h.length > max * 2 ? h.slice(0, max * 2) + '…' : h);
/** A block time as "2026-10-20 06:25:00 UTC" (the genesis block's timestamp 0 is said as such). */
export function formatTime(ts) {
  try { return Number(ts) > 0 ? new Date(Number(ts)).toISOString().slice(0, 19).replace('T', ' ') + ' UTC' : 'timestamp 0'; } catch { return ''; }
}
const isoOf = formatTime;

// ---------------------------------------------------------------- tampering (in memory only)

function flipHexByte(h, index) {
  const b = unhex(h);
  const from = b[index];
  b[index] = from ^ 1;
  return { hex: hex(b), index, from: from.toString(16).padStart(2, '0'), to: b[index].toString(16).padStart(2, '0') };
}

const TEXT_FIELDS = ['title', 'name', 'label', 'note', 'channel', 'code', 'edition', 'room', 'drop_id'];

function textFieldOf(stx) {
  for (const f of TEXT_FIELDS) if (typeof stx.tx[f] === 'string' && /[A-Za-z]/.test(stx.tx[f])) return f;
  return null;
}

/** Which tamper kinds this block can take. */
export function tamperAvailable(block) {
  const hasTx = block.txs.length > 0;
  const text = hasTx && block.txs.some((t) => textFieldOf(t));
  return Object.fromEntries(TAMPERS.map((k) => [k.id, k.id === 'title' ? text : k.needs === 'tx' ? hasTx : true]));
}

/**
 * A copy of the set with one byte of block N changed, in memory. The devnet is
 * never written. Returns { set, note }; note.text says exactly what changed.
 * Throws when the block has nothing of that kind to change.
 */
export function tamperSet(set, kind) {
  const out = structuredClone(set);
  const b = out.block;
  let note;
  if (kind === 'title') {
    const at = b.txs.findIndex((t) => textFieldOf(t));
    if (at < 0) throw new Error('this block has no transaction text to change');
    const f = textFieldOf(b.txs[at]);
    const s = b.txs[at].tx[f];
    const ci = Array.from(s).findIndex((c) => /[A-Za-z]/.test(c));
    const chars = Array.from(s);
    const before = chars[ci];
    chars[ci] = String.fromCharCode(before.charCodeAt(0) ^ 0x20);
    b.txs[at].tx[f] = chars.join('');
    const byteIndex = te.encode(chars.slice(0, ci).join('')).length;
    note = { kind, field: f, txIndex: at, where: 'transaction ' + at + ' · ' + b.txs[at].tx.type + ' · ' + f, index: byteIndex, from: before.charCodeAt(0).toString(16), to: chars[ci].charCodeAt(0).toString(16), text: 'Flipped the case bit of one letter (byte ' + byteIndex + ') in the ' + f + ' of transaction ' + at + ': “' + cleanText(s, 36) + '” became “' + cleanText(chars.join(''), 36) + '”.' };
  } else if (kind === 'tx_signature') {
    if (!b.txs.length) throw new Error('this block has no transactions');
    const raw = String(b.txs[0].signature);
    const f = flipHexByte(raw.length % 2 === 0 && !/[^0-9a-fA-F]/.test(raw) ? raw.toLowerCase() : pcc.parseSignature(raw).bytes, 0);
    b.txs[0].signature = f.hex;
    note = { kind, field: 'signature', txIndex: 0, where: 'transaction 0 · signature', index: f.index, from: f.from, to: f.to, text: 'Flipped the lowest bit of byte 0 of transaction 0’s signature: 0x' + f.from + ' became 0x' + f.to + '.' };
  } else if (kind === 'tx_drop') {
    if (!b.txs.length) throw new Error('this block has no transactions');
    const gone = b.txs.shift();
    note = { kind, field: 'txs', txIndex: 0, where: 'transactions', index: 0, from: String(b.txs.length + 1) + ' transactions', to: String(b.txs.length) + ' transactions', text: 'Removed transaction 0 (' + cleanText(gone.tx.type, 40) + '). The block now holds ' + b.txs.length + ' instead of ' + (b.txs.length + 1) + '.' };
  } else if (kind === 'seal' || kind === 'prev_hash' || kind === 'state_root') {
    const field = kind === 'seal' ? 'sequencer_sig' : kind;
    const f = flipHexByte(b.header[field], 0);
    b.header[field] = f.hex;
    note = { kind, field, txIndex: -1, where: 'header · ' + field, index: f.index, from: f.from, to: f.to, text: 'Flipped the lowest bit of byte 0 of this block’s ' + field + ': 0x' + f.from + ' became 0x' + f.to + '.' };
  } else {
    throw new Error('unknown tamper kind');
  }
  return { set: out, note };
}

// ---------------------------------------------------------------- the wasm second opinion

/**
 * The pinned wasm verifier (the Block Yard's own file), loaded only when the
 * bytes hash to the sha256 the page pins. Throws otherwise.
 */
export async function loadWasmVerifier({ url, sha256, fetch: f }) {
  const doFetch = f || ((...a) => globalThis.fetch(...a));
  const res = await doFetch(url, { credentials: 'omit', cache: 'force-cache', referrerPolicy: 'no-referrer' });
  if (!res || !res.ok) throw new Error('the verifier wasm did not load (HTTP ' + (res ? res.status : 0) + ')');
  const bytes = new Uint8Array(await res.arrayBuffer());
  const got = (await sha256Hex(bytes)) || hex(pcc.sha256(bytes));
  if (got !== String(sha256).toLowerCase()) throw new Error('that is not the verifier wasm this page pins (sha256 ' + got.slice(0, 12) + '…); refusing to run it');
  const v = await PointcastVerifier.load(bytes);
  return { verifier: v, sha256: got, bytes: bytes.length };
}

// ---------------------------------------------------------------- the steps

const row = (k, v, o = {}) => ({ k, v, kind: 'hex', ...o });
const textRow = (k, v, o = {}) => ({ k, v: String(v), kind: 'text', ...o });
const pass = (c) => ({ state: 'pass', ...c });
const fail = (c) => ({ state: 'fail', ...c });
const skip = (c) => ({ state: 'skip', ...c });
const verdictOf = (checks) => (checks.some((c) => c.state === 'fail') ? 'fail' : checks.some((c) => c.state === 'skip' && c.weight !== 'extra') ? 'skip' : 'pass');

function cmpRow(k, got, want, o = {}) {
  const same = got === want;
  return row(k, got, { cmp: same ? 'ok' : 'bad', want: same ? undefined : want, ...o });
}

function headerGroup(title, h, collapsed) {
  const parts = headerParts(h);
  const hash = headerHashOf(h);
  return {
    title,
    collapsed,
    rows: [textRow('domain', DOMAIN.header), ...parts.map(([k, v]) => row(k, v)), row('blake2b-256 of all of it', hash, { strong: true })],
    hash,
  };
}

function sdkErr(e) {
  return cleanText(e && e.message ? e.message : String(e), 140);
}

function senderDerivation(stx) {
  try {
    const pk = pcc.parsePublicKey(stx.public_key);
    const sender = stx.tx.sender;
    if (sender.startsWith('pca1') && pk.scheme === 'ed25519') return { from: pcc.agentAddress(pk), kind: 'an agent address (pca1…)' };
    if (sender.startsWith('pcp1') && pk.scheme === 'p256') return { from: pcc.passkeyAddress(pk), kind: 'a passkey address (pcp1…)' };
    if (pk.scheme === 'ed25519' || pk.scheme === 'secp256k1') return { from: pcc.tezosAddress(pk), kind: pk.scheme === 'ed25519' ? 'a tz1 address' : 'a tz2 address' };
    return { from: pcc.tezosAddress(pk), kind: 'an address' };
  } catch (e) {
    return { error: sdkErr(e) };
  }
}

/**
 * Run the lesson on one set of blocks.
 *
 * input: { n, params, genesis, pinSource: 'pinned'|'node', prev, block, next, chain?, verifier?, set?, tamper? }
 *   genesis   the 64-hex genesis hash the reader trusts (pinned, or taken from the node under ?devnet=)
 *   verifier  a loaded PointcastVerifier, for the wasm second opinion in step 5 (optional)
 * Returns { n, steps[5], checks[], failed[], skipped[], verdict, summary }.
 */
export async function runSteps(input) {
  const { n, params, genesis, pinSource = 'pinned', prev, block, next, verifier = null, tamper = null, chain = null } = input;
  const H = block.header;
  const steps = [];
  const checks = [];
  const finish = (step, list) => {
    step.checks = list;
    step.state = verdictOf(list);
    checks.push(...list.map((c) => ({ ...c, step: step.id })));
    steps.push(step);
  };

  // 1 ---- fetch
  {
    const chg = (field) => Boolean(tamper && tamper.field === field);
    const rows = [
      textRow('asked for', (input.paths || ['/raw/block/' + n]).join(' · ') + (chain ? ' · /params · /status' : '')),
      textRow('height', String(H.height)),
      textRow('time', isoOf(H.timestamp)),
      row('prev_hash', H.prev_hash, { changed: chg('prev_hash') }),
      row('tx_root', H.tx_root),
      row('state_root', H.state_root, { changed: chg('state_root') }),
      row('sequencer_sig', H.sequencer_sig, { changed: chg('sequencer_sig') }),
      textRow('transactions', String(block.txs.length) + (block.txs.length ? ' · ' + [...new Set(block.txs.map((t) => cleanText(t.tx.type, 32)))].join(', ') : ''), { changed: Boolean(tamper && tamper.kind === 'tx_drop') }),
    ];
    const asked = Number(H.height) === n && (!prev || Number(prev.header.height) === n - 1) && (!next || Number(next.header.height) === n + 1);
    finish(
      { id: 'fetch', n: 1, title: STEP_TITLES.fetch, tool: 'browser fetch · GET /raw/block/N-1, N, N+1', groups: [{ title: 'Block ' + n + ' as the devnet served it', rows }] },
      [asked
        ? pass({ id: 'fetch_heights', label: 'the devnet answered with the heights asked for', text: 'Block ' + n + (prev ? ', ' + (n - 1) : '') + (next ? ' and ' + (n + 1) : '') + ' came back under the heights asked for.' })
        : fail({ id: 'fetch_heights', label: 'the devnet answered with the heights asked for', text: 'The devnet answered with a different block than the one asked for.' })],
    );
  }

  // 2 ---- header hash and the links
  {
    const groups = [];
    const list = [];
    const mine = headerGroup('Block ' + n + ': header bytes → hash', H, false);
    let prevHash = '';
    if (prev) {
      const g = headerGroup('Block ' + (n - 1) + ': the same recomputation', prev.header, true);
      prevHash = g.hash;
      groups.push(g);
    }
    groups.push(mine);
    const linkRows = [];
    if (prev) {
      const ok = H.prev_hash === prevHash;
      linkRows.push(cmpRow('block ' + n + ' prev_hash', H.prev_hash, prevHash, { note: 'must equal the hash of block ' + (n - 1) }));
      list.push((ok ? pass : fail)({ id: 'link_back', label: 'block ' + n + ' names block ' + (n - 1) + '’s hash as its prev_hash', text: ok ? 'Block ' + n + ' commits to the hash of block ' + (n - 1) + '.' : 'Block ' + n + ' does not name the hash of block ' + (n - 1) + '. The chain is broken here.' }));
    } else {
      const ok = H.prev_hash === genesis;
      linkRows.push(cmpRow('block 1 prev_hash', H.prev_hash, genesis, { note: 'block 1 follows the genesis hash' }));
      list.push((ok ? pass : fail)({ id: 'link_back', label: 'block 1 names the pinned genesis hash as its prev_hash', text: ok ? 'Block 1 follows the pinned genesis.' : 'Block 1 does not follow the pinned genesis.' }));
    }
    if (next) {
      const ok = next.header.prev_hash === mine.hash;
      linkRows.push(cmpRow('block ' + (n + 1) + ' prev_hash', next.header.prev_hash, mine.hash, { note: 'must equal the hash of block ' + n }));
      list.push((ok ? pass : fail)({ id: 'link_forward', label: 'block ' + (n + 1) + ' names block ' + n + '’s hash as its prev_hash', text: ok ? 'Block ' + (n + 1) + ' commits back to the hash of block ' + n + '.' : 'Block ' + (n + 1) + ' does not name this block’s hash: either block ' + n + ' or its header was changed.' }));
    } else {
      linkRows.push(textRow('block ' + (n + 1), 'not sealed yet'));
      list.push(skip({ id: 'link_forward', label: 'block ' + (n + 1) + ' names block ' + n + '’s hash', text: 'This is the newest block, so there is no block ' + (n + 1) + ' to link back to it yet. The seal in step 3 still binds it.' }));
    }
    groups.push({ title: 'The links', rows: linkRows });
    finish({ id: 'link', n: 2, title: STEP_TITLES.link, tool: 'SDK blockHeaderHash (blake2b-256) over the bytes shown', groups }, list);
  }

  // 3 ---- the seal
  {
    const list = [];
    const rows = [];
    const sourceNote = pinSource === 'pinned' ? 'pinned by this page' : 'taken from this node for a local test: nothing outside it pins it';
    rows.push(row('genesis hash you trust', genesis, { note: sourceNote }));
    const mineParams = chain ? chain.paramsHash : (() => { try { return pcc.paramsHash(params); } catch { return null; } })();
    if (mineParams === null) {
      rows.push(textRow('/params', 'could not be hashed' + (chain && chain.paramsError ? ': ' + chain.paramsError : '')));
      list.push(fail({ id: 'params_pin', label: '/params hash to the genesis hash', text: 'The /params the devnet served cannot be hashed, so its sequencer key cannot be trusted.' }));
    } else {
      rows.push(cmpRow('/params hashed (SDK paramsHash)', mineParams, genesis, { note: 'must equal the genesis hash above' }));
      list.push((mineParams === genesis ? pass : fail)({ id: 'params_pin', label: '/params hash to the genesis hash', text: mineParams === genesis ? 'The /params hash to the genesis hash you trust, so the sequencer key in them is the one this chain was born with.' : 'The /params do not hash to the genesis hash you trust. Their sequencer key means nothing.' }));
    }
    const key = isObj(params.sequencer) ? params.sequencer : {};
    const keyOk = key.scheme === 'ed25519' && isHex(key.bytes, 32);
    rows.push(textRow('sequencer key scheme', cleanText(String(key.scheme), 24)));
    if (keyOk) rows.push(row('sequencer public key (from /params)', key.bytes));
    let digest = '';
    try { digest = sealDigestOf(H, genesis); } catch (e) { digest = ''; rows.push(textRow('digest', sdkErr(e))); }
    if (digest) {
      rows.push(textRow('seal domain', DOMAIN.seal));
      rows.push(row('genesis hash', genesis));
      rows.push(row('header hash (step 2)', headerHashOf(H)));
      rows.push(row('digest = blake2b-256 of those', digest, { strong: true }));
    }
    rows.push(row('sequencer_sig · 64 bytes', H.sequencer_sig));
    const paramsGood = mineParams === genesis;
    if (!keyOk) {
      list.push(skip({ id: 'seal', label: 'ed25519 seal over the digest', text: 'The sequencer key in /params is not an ed25519 key this page can check.' }));
    } else if (!digest) {
      list.push(fail({ id: 'seal', label: 'ed25519 seal over the digest', text: 'The seal digest could not be built from this header.' }));
    } else if (!paramsGood) {
      list.push(skip({ id: 'seal', label: 'ed25519 seal over the digest', text: 'Not run: the key came from /params that do not hash to the genesis you trust.' }));
    } else {
      const ok = await pcc.verifyEd25519(key.bytes, unhex(digest), H.sequencer_sig);
      rows.push(textRow('ed25519 verify', ok === null ? 'this browser has no ed25519 in WebCrypto' : ok ? 'valid' : 'invalid', { cmp: ok === true ? 'ok' : ok === false ? 'bad' : undefined }));
      if (ok === null) list.push(skip({ id: 'seal', label: 'ed25519 seal over the digest', text: 'This browser’s WebCrypto has no ed25519, so the seal was not checked.' }));
      else list.push((ok ? pass : fail)({ id: 'seal', label: 'ed25519 seal over the digest', text: ok ? 'The sequencer key in the pinned genesis signed exactly this header, for this chain.' : 'The signature does not fit this header under the sequencer key. This copy is not what the sequencer sealed.' }));
    }
    finish({ id: 'seal', n: 3, title: STEP_TITLES.seal, tool: 'SDK paramsHash · sealDigest · verifyEd25519 (WebCrypto)', groups: [{ title: 'Pin, key, digest, signature', rows }] }, list);
  }

  // 4 ---- tx ids and the tx_root
  const txInfo = [];
  {
    const groups = [];
    const list = [];
    const ids = [];
    let encodable = true;
    block.txs.forEach((stx, i) => {
      const info = { i, kind: cleanText(stx.tx.type, 40) };
      try {
        info.bytes = signedTxBytes(stx);
        info.id = txIdOf(stx);
        ids.push(info.id);
      } catch (e) {
        info.error = sdkErr(e);
        encodable = false;
      }
      txInfo.push(info);
    });
    block.txs.forEach((stx, i) => {
      const info = txInfo[i];
      if (i >= LIMITS.txsShown) return;
      const rows = [];
      const tf = textFieldOf(stx);
      if (tf) rows.push(textRow(tf + ' (text in the tx)', cleanText(stx.tx[tf], 100), { changed: Boolean(tamper && tamper.kind === 'title' && tamper.txIndex === i) }));
      if (info.error) rows.push(textRow('cannot be encoded here', info.error, { cmp: 'bad' }));
      else {
        if (info.bytes) {
          rows.push(row('canonical bytes of the unsigned tx', clip(info.bytes.unsigned), { note: String(info.bytes.unsigned.length / 2) + ' bytes' }));
          rows.push(row('+ key scheme, key, signature', clip(info.bytes.signed.slice(info.bytes.unsigned.length)), { note: 'appended, then hashed under ' + DOMAIN.txid, changed: Boolean(tamper && tamper.kind === 'tx_signature' && tamper.txIndex === i) }));
        } else rows.push(textRow('signature mode', 'passkey envelope: the id is the SDK’s txHash; its bytes are not laid out here'));
        rows.push(row('tx id', info.id, { strong: true }));
        rows.push(row('leaf = blake2b-256(0x00 ‖ id)', merkleLevels([info.id])[0][0]));
      }
      groups.push({ title: 'tx ' + i + ' · ' + info.kind + ' · nonce ' + cleanText(String(stx.tx.nonce), 20) + ' · from ' + cleanText(stx.tx.sender, 64), rows, collapsed: i > 1 });
    });
    if (block.txs.length > LIMITS.txsShown) groups.push({ title: '+ ' + (block.txs.length - LIMITS.txsShown) + ' more transactions: ids and leaves computed, not drawn', rows: [] });

    const claimed = H.tx_root;
    if (!encodable) {
      const bad = txInfo.filter((t) => t.error).map((t) => 'tx ' + t.i + ' (' + t.kind + ')').join(', ');
      groups.push({ title: 'The tree', rows: [textRow('not recomputed', 'the page cannot encode ' + bad), row('header tx_root', claimed)] });
      list.push(skip({ id: 'tx_root', label: 'the txs rebuild the header’s tx_root', text: 'The page cannot encode ' + bad + ', so the tx_root was not recomputed and these transactions are not authenticated here.' }));
    } else {
      const levels = merkleLevels(ids);
      const root = levels[levels.length - 1][0];
      let sdkRoot = '';
      try { sdkRoot = pcc.txRoot(block.txs); } catch { sdkRoot = ''; }
      const treeRows = [];
      if (!ids.length) treeRows.push(textRow('no transactions', 'the empty tree has one fixed root: blake2b-256 of “' + DOMAIN.merkleEmpty + '”'));
      levels.forEach((lvl, d) => {
        if (d === levels.length - 1 && levels.length > 1) return;
        const shown = lvl.slice(0, LIMITS.leavesShown);
        shown.forEach((h, j) => treeRows.push(row(d === 0 ? (ids.length ? 'leaf ' + j : 'root') : 'level ' + d + ' · node ' + j, h)));
        if (lvl.length > shown.length) treeRows.push(textRow(d === 0 ? 'leaves' : 'level ' + d, '+ ' + (lvl.length - shown.length) + ' more, computed, not drawn'));
      });
      if (ids.length) treeRows.push(cmpRow('tx_root recomputed', root, claimed, { strong: true, note: 'must equal the tx_root in the header' }));
      else treeRows.push(cmpRow('tx_root of the empty tree', root, claimed, { strong: true, note: 'must equal the tx_root in the header' }));
      treeRows.push(row('header tx_root', claimed));
      groups.push({ title: 'The tree', rows: treeRows });
      const ok = root === claimed;
      const consistent = sdkRoot === root;
      list.push((ok ? pass : fail)({ id: 'tx_root', label: ids.length ? 'the txs rebuild the header’s tx_root' : 'the empty tx_root is the header’s tx_root', text: ok ? (ids.length ? 'These ' + ids.length + ' transactions, in this order, rebuild the tx_root the sequencer sealed.' : 'No transactions, and the header carries the empty-tree root.') : 'The transactions here do not rebuild the tx_root in the header: one was changed, removed, added or reordered.' }));
      if (!consistent) list.push(fail({ id: 'tx_root_sdk', label: 'the page’s tree and the SDK’s txRoot agree', text: 'Internal: the tree drawn here and the SDK’s txRoot give different roots.', weight: 'extra' }));
    }
    finish({ id: 'txroot', n: 4, title: STEP_TITLES.txroot, tool: 'SDK encodeTx · txHash · txRoot, tree drawn with the SDK’s blake2b', groups }, list);
  }

  // 5 ---- signatures and senders
  {
    const groups = [];
    const list = [];
    const domain = (() => { try { return pcc.domainOf(params.chain_id, genesis); } catch { return null; } })();
    const walletVersion = (() => { try { return pcc.walletTextVersion(params); } catch { return 1; } })();
    if (!block.txs.length) {
      groups.push({ title: 'No transactions in this block', rows: [textRow('nothing to check', 'a block with no transactions has no signatures. Pick a block with transactions to see them.')] });
      list.push(pass({ id: 'sig_none', label: 'no transactions, no signatures', text: 'This block holds no transactions, so there are no signatures to check.', weight: 'extra' }));
    }
    for (let i = 0; i < block.txs.length; i++) {
      const stx = block.txs[i];
      const kind = cleanText(stx.tx.type, 40);
      const rows = [];
      const mode = stx.sig_mode === undefined || stx.sig_mode === null ? 'raw' : String(stx.sig_mode);
      let pk = null;
      try { pk = pcc.parsePublicKey(stx.public_key); } catch (e) { rows.push(textRow('public key', sdkErr(e), { cmp: 'bad' })); }
      rows.push(textRow('signature mode', mode === 'raw' ? 'raw: the key signs the digest itself' : mode === 'tezos_message' ? 'tezos_message: a wallet signed a packed message' : cleanText(mode, 24)));
      let digestHex = '';
      let checked = null;
      let why = '';
      if (!pk || !domain) {
        why = 'the key or the chain id could not be read';
      } else if (mode === 'webauthn' || pk.scheme === 'p256') {
        why = 'a passkey signs with P-256 inside a WebAuthn envelope; this page does not check that';
      } else if (pk.scheme !== 'ed25519') {
        why = 'a ' + cleanText(pk.scheme, 16) + ' key; this page checks ed25519';
      } else {
        try {
          if (mode === 'raw') digestHex = pcc.signingHash(stx.tx, domain);
          else if (mode === 'tezos_message') digestHex = pcc.walletSignedDigest(pcc.walletText(stx.tx, domain, walletVersion));
          else why = 'an unknown signature mode';
        } catch (e) { why = sdkErr(e); }
      }
      if (pk) rows.push(row('public key · ' + cleanText(pk.scheme, 16), pk.bytes));
      if (digestHex) {
        rows.push(textRow('digest', mode === 'raw' ? DOMAIN.tx + ' ‖ chain id ‖ genesis ‖ tx bytes' : 'blake2b-256 of the packed wallet text'));
        rows.push(row('digest = blake2b-256', digestHex, { strong: true }));
        let sigHex = '';
        try { sigHex = pcc.parseSignature(stx.signature).bytes; } catch { sigHex = ''; }
        rows.push(row('signature · 64 bytes', sigHex || cleanText(stx.signature, 64)));
        if (sigHex) {
          const ok = await pcc.verifyEd25519(pk.bytes, unhex(digestHex), sigHex);
          rows.push(textRow('ed25519 verify', ok === null ? 'this browser has no ed25519 in WebCrypto' : ok ? 'valid' : 'invalid', { cmp: ok === true ? 'ok' : ok === false ? 'bad' : undefined }));
          checked = ok;
        } else why = 'the signature is not 64 bytes of hex';
      }
      const sigCheck = { id: 'sig:' + i, label: 'tx ' + i + ' · ' + kind + ' · signature' };
      if (checked === true) list.push(pass({ ...sigCheck, text: 'The key signed exactly these bytes.' }));
      else if (checked === false) list.push(fail({ ...sigCheck, text: 'The signature does not fit this transaction under its key.' }));
      else list.push(skip({ ...sigCheck, text: 'Not checked: ' + (why || 'this browser has no ed25519 in WebCrypto') + '.' }));

      const sd = senderDerivation(stx);
      const senderCheck = { id: 'sender:' + i, label: 'tx ' + i + ' · ' + kind + ' · sender derives from the key' };
      rows.push(textRow('sender in the tx', cleanText(stx.tx.sender, 80)));
      if (sd.error) {
        list.push(skip({ ...senderCheck, text: 'Not derived: ' + sd.error + '.' }));
      } else {
        rows.push(cmpRow('address derived from the key', sd.from, stx.tx.sender, { note: sd.kind, kind: 'text' }));
        if (sd.from === stx.tx.sender) list.push(pass({ ...senderCheck, text: 'The sender address is the one this key derives.' }));
        else list.push(skip({ ...senderCheck, text: 'This key does not derive the sender address. That is allowed when the account has set other controllers or a device pass; telling needs account state, which the Block Yard replays.' }));
      }

      if (verifier && domain) {
        const wasmCheck = { id: 'wasm:' + i, label: 'tx ' + i + ' · the chain’s own wasm agrees on the signing digest', weight: 'extra' };
        try {
          const w = verifier.call('tx.wallet', { tx: stx.tx, params });
          const mine = pcc.signingHash(stx.tx, domain);
          rows.push(cmpRow('same digest from the chain’s own wasm', String(w.digest), mine, { note: 'tx.wallet in the pinned verifier' }));
          list.push((w.digest === mine ? pass : fail)({ ...wasmCheck, text: w.digest === mine ? 'The chain’s own Rust code, compiled to wasm, computes the same signing digest.' : 'The wasm and this page compute different signing digests.' }));
          try {
            const d = verifier.call('tx.describe', { tx: stx.tx });
            rows.push(textRow('the chain’s own words', cleanText(String(d.describe), 160)));
          } catch { /* some kinds have no plain words */ }
        } catch (e) {
          list.push(skip({ ...wasmCheck, text: 'The wasm could not read this transaction: ' + sdkErr(e) }));
        }
      }
      txInfo[i].sigState = list.find((c) => c.id === 'sig:' + i).state;
      if (i < LIMITS.txsShown) groups.push({ title: 'tx ' + i + ' · ' + kind + ' · nonce ' + cleanText(String(stx.tx.nonce), 20), rows, collapsed: i > 1 });
    }
    if (block.txs.length > LIMITS.txsShown) groups.push({ title: '+ ' + (block.txs.length - LIMITS.txsShown) + ' more transactions: checked, not drawn', rows: [] });
    finish({ id: 'sigs', n: 5, title: STEP_TITLES.sigs, tool: verifier ? 'SDK signingHash · verifyEd25519 · tezosAddress, plus the pinned wasm’s tx.wallet' : 'SDK signingHash · verifyEd25519 · tezosAddress', groups }, list);
  }

  const failed = checks.filter((c) => c.state === 'fail');
  const skipped = checks.filter((c) => c.state === 'skip' && c.weight !== 'extra');
  const verdict = failed.length ? 'fail' : skipped.length ? 'partial' : 'pass';
  const passedCount = checks.filter((c) => c.state === 'pass').length;
  const stepWord = (s) => 'step ' + s.n;
  const failedSteps = steps.filter((s) => s.state === 'fail');
  const summary = verdict === 'pass'
    ? 'Block ' + n + ': all ' + passedCount + ' checks passed.'
    : verdict === 'partial'
      ? 'Block ' + n + ': nothing failed, but ' + skipped.length + ' check' + (skipped.length === 1 ? '' : 's') + ' could not run (' + skipped.map((c) => c.label).join('; ') + ').'
      : 'Block ' + n + ': ' + failed.length + ' check' + (failed.length === 1 ? '' : 's') + ' failed, in ' + failedSteps.map(stepWord).join(' and ') + ': ' + failed.map((c) => c.label).join('; ') + '.';
  return {
    n,
    tamper,
    steps,
    checks,
    failed: failed.map((c) => c.id),
    skipped: skipped.map((c) => c.id),
    failedSteps: failedSteps.map((s) => s.id),
    verdict,
    summary,
    height: Number(H.height),
  };
}

/** The checks to list for one step: every one that is not a pass, and the passes up to `max`; `hidden` counts the passes left out. */
export function listChecks(checks, max = 24) {
  const shown = [];
  let passes = 0;
  let hidden = 0;
  for (const c of checks) {
    if (c.state !== 'pass') shown.push(c);
    else if (passes < max) { shown.push(c); passes += 1; } else hidden += 1;
  }
  return { shown, hidden };
}

/** One sentence on which steps caught a tampered copy and which still passed. '' when nothing was changed. */
export function caughtBy(report) {
  if (!report || !report.tamper) return '';
  const name = { fetch: 'step 1 (the fetch)', link: 'step 2 (the links)', seal: 'step 3 (the seal)', txroot: 'step 4 (the tx_root)', sigs: 'step 5 (the signatures)' };
  const list = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  const red = report.steps.filter((s) => s.state === 'fail').map((s) => name[s.id]);
  const green = report.steps.filter((s) => s.state === 'pass').map((s) => name[s.id]);
  const grey = report.steps.filter((s) => s.state === 'skip').map((s) => name[s.id]);
  if (!red.length) return 'Nothing caught it' + (grey.length ? ': ' + list(grey) + ' could not run on this block.' : '.');
  return 'Caught by ' + list(red) + (green.length ? '. Still passing: ' + list(green) : '') + (grey.length ? '. Could not run: ' + list(grey) : '') + '.';
}

// ---------------------------------------------------------------- walking back to genesis

/**
 * Headers only, from block 1 to `upTo`: each prev_hash is the hash of the block
 * before it (block 1 follows the genesis), each seal checks under the genesis
 * key, and each tx_root is rebuilt where the page can encode the txs. No
 * state is replayed: that is the Block Yard's VERIFY. Reads /raw/blocks in
 * pages of 500. Returns a summary; `fault` is set at the first problem.
 */
export async function walkToGenesis({ api, params, genesis, upTo, expectHash = '', env = {}, onProgress = null }) {
  const out = { upTo, checked: 0, links: 0, seals: 0, roots: 0, rootsSkipped: 0, txs: 0, rotations: [], fault: null, incomplete: null, endHash: '', matchesBlock: null };
  if (!Number.isSafeInteger(upTo) || upTo < 1) throw new Error('nothing to walk');
  if (upTo > LIMITS.walkMaxBlocks) throw new Error('that is more than ' + LIMITS.walkMaxBlocks + ' blocks: use pcv.py or verify.mjs for a walk that long');
  const key = isObj(params.sequencer) ? params.sequencer : {};
  const keyOk = key.scheme === 'ed25519' && isHex(key.bytes, 32);
  let mineParams = null;
  try { mineParams = pcc.paramsHash(params); } catch { mineParams = null; }
  if (mineParams !== genesis) { out.fault = { height: 0, why: '/params do not hash to the genesis hash you trust' }; return out; }
  let expected = 1;
  let prevHash = genesis;
  while (expected <= upTo) {
    const page = await getExact(api, '/raw/blocks?from=' + expected + '&limit=' + Math.min(LIMITS.walkPage, upTo - expected + 1), env);
    const list = page && isObj(page.json) && Array.isArray(page.json.blocks) ? page.json.blocks : [];
    if (!list.length) { out.fault = { height: expected, why: 'the devnet stopped serving blocks at ' + expected }; return out; }
    for (const raw of list) {
      if (expected > upTo) break;
      let b;
      try { b = readBlock(raw, 'block ' + expected); } catch (e) { out.fault = { height: expected, why: sdkErr(e) }; return out; }
      if (Number(b.header.height) !== expected) { out.fault = { height: expected, why: 'the devnet served block ' + b.header.height + ' where ' + expected + ' belongs' }; return out; }
      if (b.header.prev_hash !== prevHash) { out.fault = { height: expected, why: 'prev_hash does not match the hash of the block before it' }; return out; }
      out.links += 1;
      const h = headerHashOf(b.header);
      if (keyOk && !out.rotations.length) {
        const ok = await pcc.verifyEd25519(key.bytes, unhex(sealDigestOf(b.header, genesis)), b.header.sequencer_sig);
        if (ok === false) { out.fault = { height: expected, why: 'the sequencer seal does not check under the genesis key' }; return out; }
        if (ok === true) out.seals += 1;
      }
      try {
        if (pcc.txRoot(b.txs) !== b.header.tx_root) { out.fault = { height: expected, why: 'the transactions do not rebuild the tx_root' }; return out; }
        out.roots += 1;
      } catch { out.rootsSkipped += 1; }
      for (const t of b.txs) if (t.tx.type === 'rotate_sequencer') { out.rotations.push(expected); out.incomplete = 'a sequencer rotation was posted at block ' + expected + '; later seals use a key this walk does not track'; }
      out.txs += b.txs.length;
      prevHash = h;
      out.checked = expected;
      expected += 1;
    }
    if (onProgress) onProgress({ done: out.checked, of: upTo });
  }
  out.endHash = prevHash;
  if (expectHash) out.matchesBlock = prevHash === expectHash;
  return out;
}

/** Plain-language lines for a finished walk. */
export function walkSummary(w) {
  if (w.fault) return 'The walk stopped at block ' + w.fault.height + ': ' + w.fault.why + '.';
  const bits = ['Walked blocks 1 to ' + w.checked + ': ' + w.links + ' prev_hash links, ' + w.seals + ' seals checked under the genesis key, ' + w.roots + ' tx_roots rebuilt from ' + w.txs + ' transactions.'];
  if (w.rootsSkipped) bits.push(w.rootsSkipped + ' blocks hold a transaction kind this page cannot encode, so their tx_root was not rebuilt.');
  if (w.incomplete) bits.push('Incomplete: ' + w.incomplete + '.');
  if (w.matchesBlock === true) bits.push('The walk ends at the block you examined.');
  if (w.matchesBlock === false) bits.push('The walk does not end at the block you examined: the devnet served two different versions.');
  bits.push('No state was replayed.');
  return bits.join(' ');
}
