// notary.js: the logic behind the Notary (/chain/notary): stamp a file's
// SHA-256 on the PointCast devnet and check a stamp later.
//
// An ES module with no DOM access, so the page and node run the same code
// (tests/chain-app-notary.test.mjs, scripts/e2e-chain-app-notary.mjs).
//
// What a stamp is. A signed publish_block on channel NOTARY whose body is five
// plain lines, exactly:
//
//     notary/v1
//     sha256:<64 lowercase hex>
//     bytes:<the file's size>
//     name:<optional, up to 60 characters>
//     note:<optional, up to 140 characters>
//
// The file never leaves the browser: only its hash goes on chain, inside a
// transaction signed by a key the person holds, sealed into a block with a
// timestamp. What that shows: this key's signed transaction naming this hash was
// sealed by this devnet's sequencer in this block, at this time by its clock.
// What it does not show: who holds the key, who wrote the file, or that the file
// is genuine. The devnet has no value, one server runs it and it may reset; a
// reset erases every stamp, so a receipt is the person's to keep. Nothing is
// anchored anywhere outside it.
//
// Checking reuses the "Verify a block by hand" steps (verify.js): the hash
// links, the sequencer's seal, the tx_root and every signature of the stamp's
// block, then adds the Notary's own: the transaction is a publish_block on
// NOTARY, its body hashes to the body_hash it commits to, and the body names
// the file's SHA-256.

import { pcc, cleanText, isHex64, isObj, isWhole, KitError, makeNet, readStatus, sha256Hex, signAndSend } from './chain-kit.js';
import * as V from './verify.js';

export const CHANNEL = 'NOTARY';
export const FORMAT = 'notary/v1';
export const RECEIPT_FORMAT = 'pointcast-notary-receipt/v1';
export const LIMITS = Object.freeze({ name: 60, note: 140, fileBytes: 64 * 1024 * 1024, feedPages: 20, feedLimit: 100 });

const BIDI = new RegExp('[\\u061c\\u200e\\u200f\\u202a-\\u202e\\u2066-\\u2069]');
const CONTROL = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f\\u2028\\u2029]');

// ---------------------------------------------------------------- the stamp text

/** A name or note as the stamp may carry it: one printable line, bounded; '' when empty. Throws on what a stamp must not hold. */
export function cleanLabel(v, max, what) {
  const s = String(v === undefined || v === null ? '' : v).replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (CONTROL.test(s) || BIDI.test(s)) throw new KitError(what + ': no control or direction characters', { code: 'bad_label' });
  if (Array.from(s).length > max) throw new KitError(what + ': at most ' + max + ' characters', { code: 'bad_label' });
  return s;
}

/** The title of a stamp's post: the format and the whole hash, so a card says what it is without its body. */
export const stampTitle = (sha256) => FORMAT + ' sha256:' + sha256;

/** The body of a stamp. `sha256` is 64 lowercase hex, `bytes` a whole number; name and note are optional. */
export function stampBody({ sha256, bytes, name = '', note = '' }) {
  if (!isHex64(sha256)) throw new KitError('a SHA-256 is 64 lowercase hex characters', { code: 'bad_hash' });
  if (!Number.isSafeInteger(bytes) || bytes < 0) throw new KitError('the size is a whole number of bytes', { code: 'bad_size' });
  const n = cleanLabel(name, LIMITS.name, 'name');
  const t = cleanLabel(note, LIMITS.note, 'note');
  return [FORMAT, 'sha256:' + sha256, 'bytes:' + bytes, ...(n ? ['name:' + n] : []), ...(t ? ['note:' + t] : [])].join('\n');
}

/**
 * Read a stamp body strictly: the lines in this order, nothing else, nothing
 * extra. Returns { sha256, bytes, name, note } or null. Hostile text is cut to
 * the lengths a stamp allows and never trusted beyond that.
 */
export function parseStamp(body) {
  if (typeof body !== 'string' || body.length > 2048) return null;
  const lines = body.split('\n');
  if (lines.length < 3 || lines.length > 5 || lines[0] !== FORMAT) return null;
  const m1 = /^sha256:([0-9a-f]{64})$/.exec(lines[1]);
  const m2 = /^bytes:(0|[1-9][0-9]{0,15})$/.exec(lines[2]);
  if (!m1 || !m2) return null;
  const bytes = Number(m2[1]);
  if (!Number.isSafeInteger(bytes)) return null;
  let name = '';
  let note = '';
  let i = 3;
  if (lines[i] !== undefined && lines[i].startsWith('name:')) { name = lines[i].slice(5); i += 1; if (!name) return null; }
  if (lines[i] !== undefined && lines[i].startsWith('note:')) { note = lines[i].slice(5); i += 1; if (!note) return null; }
  if (i !== lines.length) return null;
  try {
    if (name !== cleanLabel(name, LIMITS.name, 'name') || note !== cleanLabel(note, LIMITS.note, 'note')) return null;
  } catch { return null; }
  return { sha256: m1[1], bytes, name, note };
}

// ---------------------------------------------------------------- hashing a file

/** SHA-256 of the exact bytes (a File, Blob, ArrayBuffer or Uint8Array) and their count. The file is read here and goes nowhere. */
export async function hashFile(input) {
  let bytes;
  if (input instanceof Uint8Array) bytes = input;
  else if (input instanceof ArrayBuffer) bytes = new Uint8Array(input);
  else if (input && typeof input.arrayBuffer === 'function') {
    if (Number.isFinite(input.size) && input.size > LIMITS.fileBytes) throw new KitError('this page hashes files up to ' + (LIMITS.fileBytes / 1048576) + ' MiB; hash a larger one with sha256sum and paste the hash', { code: 'too_big' });
    bytes = new Uint8Array(await input.arrayBuffer());
  } else throw new KitError('not a file', { code: 'bad_file' });
  if (bytes.length > LIMITS.fileBytes) throw new KitError('this page hashes files up to ' + (LIMITS.fileBytes / 1048576) + ' MiB; hash a larger one with sha256sum and paste the hash', { code: 'too_big' });
  return { sha256: await sha256Hex(bytes), bytes: bytes.length };
}

/** SHA-256 of text, as UTF-8 bytes exactly as given (no trimming, no normalising). A browser text box gives its value with CR LF already turned into LF: the page says so (notary-view.js takeText). */
export async function hashText(text) {
  const bytes = new TextEncoder().encode(String(text));
  return { sha256: await sha256Hex(bytes), bytes: bytes.length };
}

/** A pasted hash: 64 hex in any case, with an optional "sha256:" prefix; else null. */
export function parsePastedHash(raw) {
  const s = String(raw || '').trim().toLowerCase().replace(/^sha-?256[:= ]\s*/, '');
  return isHex64(s) ? s : null;
}

// ---------------------------------------------------------------- receipts

/** The receipt a person keeps. Plain JSON: where the stamp is, whose key, which file. */
export function makeReceipt({ chainId, genesis, api, txHash, height, blockHash = '', timeMs = 0, sender, bodyHash, sha256, bytes, name = '', note = '', createdMs }) {
  return {
    format: RECEIPT_FORMAT,
    meaning: 'A signed transaction from this key, naming this file’s SHA-256, was sealed into this block by this devnet. It shows the hash existed by then, not who wrote the file. devnet: no value, may reset.',
    devnet: { chain_id: chainId, genesis, api },
    stamp: { tx: txHash, height, block_hash: blockHash, time_ms: timeMs, sender, body_hash: bodyHash },
    file: { sha256, bytes, ...(name ? { name } : {}), ...(note ? { note } : {}) },
    created: new Date(createdMs === undefined ? Date.now() : createdMs).toISOString(),
  };
}

/** Read a receipt strictly (JSON text or an object). Throws a KitError naming the first thing wrong. */
export function readReceipt(input) {
  let r = input;
  if (typeof input === 'string') {
    if (input.length > 20000) throw new KitError('that is too large to be a receipt', { code: 'bad_receipt' });
    try { r = JSON.parse(input); } catch { throw new KitError('that is not JSON', { code: 'bad_receipt' }); }
  }
  const bad = (why) => new KitError('not a Notary receipt: ' + why, { code: 'bad_receipt' });
  if (!isObj(r) || r.format !== RECEIPT_FORMAT) throw bad('its format is not ' + RECEIPT_FORMAT);
  if (!isObj(r.devnet) || typeof r.devnet.chain_id !== 'string' || !isHex64(r.devnet.genesis)) throw bad('no devnet and genesis');
  if (!isObj(r.stamp) || !isHex64(r.stamp.tx) || !Number.isSafeInteger(r.stamp.height) || r.stamp.height < 1) throw bad('no transaction and block');
  if (!isObj(r.file) || !isHex64(r.file.sha256) || !isWhole(r.file.bytes)) throw bad('no file hash');
  return {
    chainId: cleanText(r.devnet.chain_id, 64),
    genesis: r.devnet.genesis,
    api: typeof r.devnet.api === 'string' ? cleanText(r.devnet.api, 120) : '',
    txHash: r.stamp.tx,
    height: r.stamp.height,
    blockHash: isHex64(r.stamp.block_hash) ? r.stamp.block_hash : '',
    timeMs: isWhole(r.stamp.time_ms) ? r.stamp.time_ms : 0,
    sender: typeof r.stamp.sender === 'string' ? cleanText(r.stamp.sender, 80) : '',
    bodyHash: isHex64(r.stamp.body_hash) ? r.stamp.body_hash : '',
    sha256: r.file.sha256,
    bytes: r.file.bytes,
    name: typeof r.file.name === 'string' ? cleanText(r.file.name, LIMITS.name) : '',
    note: typeof r.file.note === 'string' ? cleanText(r.file.note, LIMITS.note) : '',
  };
}

// ---------------------------------------------------------------- stamping

/**
 * Stamp a hash. `chain` is the SDK client pinned to the genesis, `net` a reader,
 * `key` from keyFromSeed. buildPublish stores the body (POST /body) and picks the
 * nonce; the post is signed here and sent to POST /tx; this waits for the block.
 * Returns { txHash, height, bodyHash, receipt }.
 */
export async function stampHash({ chain, net, key, sha256, bytes, name = '', note = '', onStage = () => {}, now = () => Date.now() }) {
  const body = stampBody({ sha256, bytes, name, note });
  const tx = await chain.buildPublish({ sender: key.sender, channel: CHANNEL, title: stampTitle(sha256), body });
  const done = await signAndSend(chain, key, tx, { onStage });
  let blockHash = '';
  let timeMs = 0;
  try {
    const b = await net.get('/block/' + done.height);
    if (isObj(b) && isHex64(b.hash)) blockHash = b.hash;
    if (isObj(b) && isWhole(b.timestamp)) timeMs = b.timestamp;
  } catch { /* the receipt still names the block height and the transaction */ }
  const receipt = makeReceipt({ chainId: chain.chainId, genesis: chain.genesisHash, api: net.api, txHash: done.txHash, height: done.height, blockHash, timeMs, sender: key.sender, bodyHash: tx.body_hash, sha256, bytes, name: cleanLabel(name, LIMITS.name, 'name'), note: cleanLabel(note, LIMITS.note, 'note'), createdMs: now() });
  return { txHash: done.txHash, height: done.height, bodyHash: tx.body_hash, receipt };
}

// ---------------------------------------------------------------- finding stamps

/** One tx card of GET /feed, if it is a stamp: { height, txHash, sender, timeMs, stamp, bodyHash }; else null. */
export function stampFromCard(card, block) {
  if (!isObj(card) || card.kind !== 'publish_block' || !isObj(card.payload) || card.payload.channel !== CHANNEL) return null;
  const stamp = parseStamp(card.payload.body);
  if (!stamp || !isHex64(card.hash) || typeof card.sender !== 'string') return null;
  if (!isObj(block) || !isWhole(block.height)) return null;
  return {
    height: block.height,
    txHash: card.hash,
    sender: cleanText(card.sender, 80),
    timeMs: isWhole(block.timestamp) ? block.timestamp : 0,
    bodyHash: isHex64(card.payload.body_hash) ? card.payload.body_hash : '',
    body: card.payload.body,
    stamp,
  };
}

/**
 * Scan GET /feed (newest first, blocks that carry transactions) for stamps of
 * this hash. Returns { stamps (earliest first), scannedBlocks, pages, complete }.
 * `complete` is true when the scan reached the oldest block; when it stops at the
 * page limit, "not found" means only "not in the newest N blocks that carry
 * transactions", never "never stamped".
 */
export async function findStamps(net, sha256, { maxPages = LIMITS.feedPages, limit = LIMITS.feedLimit } = {}) {
  if (!isHex64(sha256)) throw new KitError('a SHA-256 is 64 lowercase hex characters', { code: 'bad_hash' });
  const stamps = [];
  let before = null;
  let pages = 0;
  let scanned = 0;
  let complete = false;
  while (pages < maxPages) {
    const page = await net.get('/feed?limit=' + limit + (before === null ? '' : '&before=' + before));
    pages += 1;
    if (!isObj(page) || !Array.isArray(page.blocks)) throw new KitError('the devnet’s /feed is not the shape this page reads', { code: 'shape' });
    for (const b of page.blocks) {
      if (!isObj(b)) continue;
      scanned += 1;
      for (const card of Array.isArray(b.txs) ? b.txs : []) {
        const s = stampFromCard(card, b);
        if (s && s.stamp.sha256 === sha256) stamps.push(s);
      }
    }
    const next = page.next_before;
    if (!isWhole(next) || next < 1 || !page.blocks.length) { complete = true; break; }
    if (before !== null && next >= before) { complete = true; break; }
    before = next;
  }
  stamps.sort((a, b) => a.height - b.height || (a.txHash < b.txHash ? -1 : 1));
  return { stamps, scannedBlocks: scanned, pages, complete };
}

// ---------------------------------------------------------------- checking a stamp

const pass = (id, text) => ({ id, state: 'pass', text });
const fail = (id, text) => ({ id, state: 'fail', text });
const skip = (id, text) => ({ id, state: 'skip', text });

/**
 * Check one stamp from the blocks themselves. `ref` is { height, txHash }; `sha256`
 * is the file's hash the person holds. Reads blocks N-1, N and N+1, /params and
 * /status, runs the five "Verify a block" steps on them, then the Notary's own checks.
 * Returns { verdict: 'STAMPED' | 'PARTLY' | 'NOT STAMPED', checks, steps, report, stamp }.
 */
export async function checkStamp({ api, genesis, pinSource = 'pinned', ref, sha256, env = {}, body = null }) {
  const checks = [];
  const set = await V.fetchBlockSet(api, ref.height, env);
  const chain = await V.loadChain(api, env);
  if (genesis && chain.status.genesis !== genesis) {
    checks.push(fail('pin', 'The devnet’s genesis is not the one this page trusts: it was probably reset, and the stamp is gone from it.'));
    return { verdict: 'NOT STAMPED', checks, steps: null, report: null, stamp: null };
  }
  const trusted = genesis || chain.status.genesis;
  const report = await V.runSteps({ n: ref.height, params: chain.params, genesis: trusted, pinSource, prev: set.prev, block: set.block, next: set.next, chain, paths: set.paths });
  const at = set.block.txs.find((t) => {
    try { return pcc.txHash(t) === ref.txHash; } catch { return false; }
  });
  if (!at) {
    checks.push(fail('present', 'Block ' + ref.height + ' does not hold a transaction with the id ' + ref.txHash.slice(0, 12) + '…'));
    return { verdict: 'NOT STAMPED', checks, steps: report, report, stamp: null };
  }
  let rootOk = false;
  try { rootOk = pcc.txRoot(set.block.txs) === set.block.header.tx_root; } catch { rootOk = false; }
  checks.push(rootOk
    ? pass('present', 'Block ' + ref.height + ' holds the transaction ' + ref.txHash.slice(0, 12) + '…, and the block’s tx_root rebuilds from its transactions, this one included.')
    : fail('present', 'Block ' + ref.height + ' holds the transaction ' + ref.txHash.slice(0, 12) + '…, but its tx_root does not rebuild from the transactions it carries, so the header does not commit to them.'));
  const tx = at.tx;
  const isPost = tx.type === 'publish_block' && tx.channel === CHANNEL;
  checks.push(isPost ? pass('kind', 'It is a post on channel ' + CHANNEL + ', sent by ' + cleanText(tx.sender, 80) + '.') : fail('kind', 'It is not a post on channel ' + CHANNEL + '.'));
  let text = body;
  if (text === null && isPost && isHex64(tx.body_hash)) {
    try { text = await makeNet(api, env).getText('/body/' + tx.body_hash); } catch { text = null; }
  }
  let parsed = null;
  if (typeof text !== 'string') checks.push(skip('body', 'The devnet no longer serves the stamp’s body, so what it said cannot be read here.'));
  else {
    const same = isPost && pcc.bodyHash(text) === tx.body_hash;
    checks.push(same ? pass('body', 'The body hashes to the body_hash the signed transaction commits to.') : fail('body', 'The body does not hash to the body_hash in the signed transaction.'));
    parsed = same ? parseStamp(text) : null;
    if (same && !parsed) checks.push(fail('format', 'The body is not a ' + FORMAT + ' stamp.'));
  }
  if (parsed) {
    const ok = parsed.sha256 === sha256;
    checks.push(ok ? pass('file', 'The stamp names the SHA-256 of your file: ' + sha256.slice(0, 16) + '…') : fail('file', 'The stamp names a different SHA-256 (' + parsed.sha256.slice(0, 16) + '…) from your file’s (' + sha256.slice(0, 16) + '…).'));
  }
  const stepBad = report.failed.length > 0;
  // The newest block has no next block yet, so its forward link cannot be checked: that alone is not a doubt about the stamp.
  const onlyForward = report.skipped.length === 1 && report.skipped[0] === 'link_forward';
  const stepSkip = report.skipped.length > 0 && !onlyForward;
  checks.push(stepBad ? fail('steps', 'The block fails ' + report.failed.length + ' of the Verify a block checks (' + report.failed.slice(0, 4).join(', ') + ').') : stepSkip ? skip('steps', 'The block passes every check that could run; ' + report.skipped.length + ' could not (' + report.skipped.slice(0, 4).join(', ') + ').') : pass('steps', onlyForward ? 'The block passes every Verify a block check that can run now: its link back, the sequencer’s seal, the tx_root and each signature. It is the newest block, so the next block has not yet named its hash.' : 'The block passes every Verify a block check: the links, the sequencer’s seal, the tx_root and each signature.'));
  if (pinSource !== 'pinned') checks.push(skip('pin', 'The genesis hash was taken from the devnet itself, not pinned in this page (a local test), so nothing outside it vouches for it.'));
  const anyFail = checks.some((c) => c.state === 'fail');
  const anySkip = checks.some((c) => c.state === 'skip');
  return {
    verdict: anyFail ? 'NOT STAMPED' : anySkip || pinSource !== 'pinned' ? 'PARTLY' : 'STAMPED',
    newest: onlyForward,
    checks,
    steps: report,
    report,
    stamp: parsed ? { ...parsed, height: ref.height, txHash: ref.txHash, sender: cleanText(tx.sender, 80), timeMs: set.block.header.timestamp, bodyHash: tx.body_hash } : null,
  };
}

/** The status of a stamp's transaction: GET /tx/HASH -> { status, height }. */
export async function lookupTx(net, txHash) {
  if (!isHex64(txHash)) throw new KitError('a transaction id is 64 hex characters', { code: 'bad_tx' });
  const r = await net.get('/tx/' + txHash);
  if (!isObj(r)) return { status: 'unknown', height: null };
  return { status: cleanText(String(r.status || ''), 20), height: isWhole(r.height) ? r.height : null };
}

export { readStatus };
