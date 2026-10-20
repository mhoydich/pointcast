// capsules.js: the logic behind Time Capsules (/chain/capsules): seal a message
// now, open it at a block you pick, on the PointCast devnet.
//
// An ES module with no DOM access, so the page and node run the same code
// (tests/chain-app-capsules.test.mjs, scripts/e2e-chain-app-capsules.mjs).
//
// How a capsule works (launch record 13, chain-core capsule.rs). It is a
// commit and reveal:
//   seal_capsule   stores only a COMMITMENT: blake2b over this chain, the author,
//                  the channel, the post (title, body hash, media) and a random
//                  salt. It names a block height, open_at, and a label for the
//                  wax seal. The message itself is not on chain, and not on the
//                  devnet's body store either, until it is opened.
//   open_capsule   anyone, at or after open_at and before it lapses, reveals the
//                  salt and the post. The chain checks they hash to the
//                  commitment, and the post airs as its author's. A capsule opens
//                  once.
// The author keeps the capsule FILE: the message and the salt. Lose it and the
// capsule never opens. Anyone who holds it can read the message early, and
// anyone can open the capsule with it.
//
// A capsule waits in BLOCKS, not minutes. The devnet seals within seconds when
// something is posted and otherwise once every five minutes, so "100 blocks" is
// anywhere from five minutes to eight hours. devnet: no value, may reset; a reset
// erases every sealed capsule.

import { pcc, cleanBlock, cleanText, isHex64, isObj, isWhole, KitError, blocksPerHour, signAndSend, tagSendFailure, waitIncluded } from './chain-kit.js';

export const FORMAT = 'pointcast-capsule/v1';
export const CHANNELS = Object.freeze(['BOT', 'GDN']);
export const LIMITS = Object.freeze({ title: 120, bodyBytes: 4000, label: 64, minDelay: 3, maxDelay: 1000000, fileChars: 40000, feedPages: 20, feedLimit: 100, wall: 12 });

const BIDI = new RegExp('[\\u061c\\u200e\\u200f\\u202a-\\u202e\\u2066-\\u2069]');
const FORMAT_CHARS = new RegExp('\\p{Cf}', 'u');
const CONTROL = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f\\u2028\\u2029]');
const utf8 = (s) => new TextEncoder().encode(s);

// ---------------------------------------------------------------- planning a seal

/** One plain line (a title or a wax-seal label): no control, direction or format characters. Returns the text or throws. */
function plainLine(v, max, what) {
  const s = String(v === undefined || v === null ? '' : v).replace(/\s+/g, ' ').trim();
  if (!s) throw new KitError(what + ' cannot be empty', { code: 'bad_field' });
  if (CONTROL.test(s) || BIDI.test(s) || FORMAT_CHARS.test(s)) throw new KitError(what + ': no control, direction or invisible formatting characters', { code: 'bad_field' });
  if (Array.from(s).length > max) throw new KitError(what + ': at most ' + max + ' characters', { code: 'bad_field' });
  return s;
}

/** The message: free text, line breaks kept, bounded in bytes, no control characters other than newline. */
function messageBody(v) {
  const s = String(v === undefined || v === null ? '' : v).replace(/\r\n?/g, '\n').trim();
  if (!s) throw new KitError('the message cannot be empty', { code: 'bad_field' });
  if (new RegExp('[\\u0000-\\u0008\\u000b-\\u001f\\u007f-\\u009f\\u2028\\u2029]').test(s) || BIDI.test(s)) throw new KitError('the message: no control or direction characters', { code: 'bad_field' });
  if (utf8(s).length > LIMITS.bodyBytes) throw new KitError('the message: at most ' + LIMITS.bodyBytes + ' bytes', { code: 'bad_field' });
  return s;
}

/**
 * Check a seal before anything is signed. Returns { ok, errors, fields } where
 * fields = { channel, title, body, label, openAt, delay }. `tip` is the devnet's
 * newest block; the capsule opens at `tip + delay` (at least a few blocks on, so
 * the seal always lands before it).
 */
export function planSeal({ channel, title, body, label, delay, tip, sender = '' }) {
  const errors = [];
  const fields = { channel, title: '', body: '', label: '', openAt: 0, delay: 0 };
  if (!CHANNELS.includes(channel)) errors.push('The channel is ' + CHANNELS.join(' or ') + '.');
  for (const [k, f, max, what] of [['title', title, LIMITS.title, 'The title'], ['label', label, LIMITS.label, 'The wax seal label']]) {
    try { fields[k] = plainLine(f, max, what); } catch (e) { errors.push(e.message); }
  }
  try { fields.body = messageBody(body); } catch (e) { errors.push(e.message); }
  const d = typeof delay === 'string' ? (/^\d{1,8}$/.test(delay.trim()) ? Number(delay.trim()) : NaN) : delay;
  if (!Number.isSafeInteger(d) || d < LIMITS.minDelay || d > LIMITS.maxDelay) errors.push('Wait ' + LIMITS.minDelay + ' to ' + LIMITS.maxDelay.toLocaleString('en-US') + ' blocks.');
  else fields.delay = d;
  if (!isWhole(tip)) errors.push('The devnet’s newest block is not known yet.');
  else if (fields.delay) fields.openAt = tip + fields.delay;
  if (sender !== undefined && !sender) errors.push('Make a key first: it seals the capsule and is its author.');
  if (errors.length === 0) {
    try { pcc.checkCapsulePost(fields.channel, { title: fields.title, media_uri: null }); } catch (e) { errors.push(cleanText(e.message, 200)); }
  }
  return { ok: errors.length === 0, errors, fields };
}

// ---------------------------------------------------------------- the capsule file

/**
 * The commitment, the capsule id and the salt for a seal, drawn fresh. Returns
 * { commitment, capsule, salt, bodyHash }. The salt is 32 random bytes from the
 * browser; the SDK refuses a post that could never open.
 */
export function commit(domain, { author, channel, title, body }) {
  const bodyHash = pcc.bodyHash(body);
  const c = pcc.capsuleCommitment(domain, { author, channel, title, body_hash: bodyHash, media_uri: null });
  return { commitment: c.commitment, capsule: c.capsule, salt: c.salt, bodyHash };
}

/** The file the author keeps: everything needed to open the capsule, and nothing the chain does not already hold except the message and the salt. */
export function makeCapsuleFile({ chainId, genesis, api, capsule, author, channel, title, body, salt, label, openAt, sealedAt, sealTx }) {
  return {
    format: FORMAT,
    secret: 'This file holds the message and the salt. Anyone who has it can read the capsule before it opens, and anyone can open the capsule with it. Lose it and the capsule never opens.',
    devnet: { chain_id: chainId, genesis, api },
    capsule,
    author,
    channel,
    label,
    open_at: openAt,
    sealed_at: sealedAt,
    seal_tx: sealTx,
    title,
    body,
    salt,
  };
}

/**
 * Read a capsule file strictly, and check it against itself: the capsule id must
 * be the one its own author, channel, title, message and salt hash to, on the
 * devnet the file names. A file edited after sealing does not pass. Returns the
 * file's fields or throws a KitError naming the first thing wrong.
 */
export function readCapsuleFile(input) {
  let f = input;
  if (typeof input === 'string') {
    if (input.length > LIMITS.fileChars) throw new KitError('that is too large to be a capsule file', { code: 'bad_file' });
    try { f = JSON.parse(input); } catch { throw new KitError('that is not JSON', { code: 'bad_file' }); }
  }
  const bad = (why) => new KitError('not a capsule file: ' + why, { code: 'bad_file' });
  if (!isObj(f) || f.format !== FORMAT) throw bad('its format is not ' + FORMAT);
  if (!isObj(f.devnet) || typeof f.devnet.chain_id !== 'string' || !isHex64(f.devnet.genesis)) throw bad('no devnet and genesis');
  if (!isHex64(f.capsule)) throw bad('no capsule id');
  if (typeof f.author !== 'string' || pcc.addressKind(f.author) === null) throw bad('no author');
  if (!CHANNELS.includes(f.channel)) throw bad('channel');
  if (!(typeof f.salt === 'string' && /^(?:[0-9a-f]{2}){16,64}$/.test(f.salt))) throw bad('no salt');
  if (!Number.isSafeInteger(f.open_at) || f.open_at < 2) throw bad('no open_at');
  let title; let body; let label;
  try { title = plainLine(f.title, LIMITS.title, 'title'); body = messageBody(f.body); label = plainLine(f.label, LIMITS.label, 'label'); } catch (e) { throw bad(e.message); }
  if (title !== f.title || body !== f.body || label !== f.label) throw bad('its text is not in the plain form a capsule holds');
  const domain = pcc.domainOf(f.devnet.chain_id, f.devnet.genesis);
  let c;
  try { c = pcc.capsuleCommitment(domain, { author: f.author, channel: f.channel, salt: f.salt, title, body_hash: pcc.bodyHash(body), media_uri: null }); } catch (e) { throw bad(cleanText(e.message, 160)); }
  if (c.capsule !== f.capsule) throw bad('what it holds does not hash to the capsule id it names, so it was changed after sealing');
  return {
    chainId: cleanText(f.devnet.chain_id, 64),
    genesis: f.devnet.genesis,
    api: typeof f.devnet.api === 'string' ? cleanText(f.devnet.api, 120) : '',
    capsule: f.capsule,
    author: f.author,
    channel: f.channel,
    label,
    openAt: f.open_at,
    sealedAt: Number.isSafeInteger(f.sealed_at) ? f.sealed_at : 0,
    sealTx: isHex64(f.seal_tx) ? f.seal_tx : '',
    title,
    body,
    salt: f.salt,
  };
}

// ---------------------------------------------------------------- reading capsules

/** One stored capsule from GET /capsules (the devnet never sends the commitment, the salt or the message). */
export function readCapsuleRow(c) {
  if (!isObj(c) || !isHex64(c.id) || typeof c.author !== 'string' || pcc.addressKind(c.author) === null) return null;
  if (!isWhole(c.open_at) || !isWhole(c.sealed_at)) return null;
  return {
    id: c.id,
    author: c.author,
    channel: typeof c.channel === 'string' ? cleanText(c.channel, 16) : '',
    label: typeof c.label === 'string' ? cleanText(c.label, LIMITS.label) : '',
    sealedAt: c.sealed_at,
    openAt: c.open_at,
    lapsesAt: isWhole(c.lapses_at) ? c.lapses_at : null,
    due: c.due === true,
    blocksUntilOpen: isWhole(c.blocks_until_open) ? c.blocks_until_open : 0,
  };
}

/** GET /capsules -> { enabled, height, rows } (soonest to lapse first, as the devnet sends them). */
export function readCapsules(json) {
  if (!isObj(json) || !Array.isArray(json.capsules)) return null;
  return {
    enabled: json.enabled === true,
    height: isWhole(json.height) ? json.height : null,
    rows: json.capsules.map(readCapsuleRow).filter(Boolean).slice(0, 500),
  };
}

/** Where a capsule stands now: 'waiting' (before open_at), 'due' (the next block may open it), 'lapsed', or 'gone' (not stored: opened, pruned, or the devnet was reset). */
export function stateOf(row, tip) {
  if (!row) return 'gone';
  const next = tip + 1;
  if (row.lapsesAt !== null && next >= row.lapsesAt) return 'lapsed';
  return next >= row.openAt ? 'due' : 'waiting';
}

/** How long `blocks` take, in words, at the rate the devnet has been keeping and at its two extremes. */
export function etaWords(blocks, perHour) {
  if (!Number.isFinite(blocks) || blocks <= 0) return 'now';
  const dur = (ms) => {
    const s = Math.round(ms / 1000);
    if (s < 90) return s + ' seconds';
    const m = Math.round(s / 60);
    if (m < 90) return m + ' minutes';
    const h = Math.round((m / 60) * 10) / 10;
    if (h < 48) return h + ' hours';
    return Math.round(h / 24) + ' days';
  };
  const fast = dur(blocks * 3000);
  const slow = dur(blocks * 300000);
  const here = dur((blocks * 3600000) / (perHour > 0 ? perHour : 12));
  return 'about ' + here + ' at the current rate, as soon as ' + fast + ' if the devnet is busy and as late as ' + slow + ' if it goes quiet';
}

/** The seal rate the devnet is keeping, from the newest `count` blocks' timestamps: one GET /raw/blocks. */
export async function readRate(net, tip, count = 50) {
  if (!isWhole(tip) || tip < 3) return 12;
  const from = Math.max(1, tip - count + 1);
  const page = await net.get('/raw/blocks?from=' + from + '&limit=' + count);
  const ts = (isObj(page) && Array.isArray(page.blocks) ? page.blocks : []).map((b) => (isObj(b) && isObj(b.header) && isWhole(b.header.timestamp) ? b.header.timestamp : 0)).filter((t) => t > 0);
  return blocksPerHour(ts, 12);
}

// ---------------------------------------------------------------- sealing and opening

/**
 * Seal a capsule. `chain` is the SDK client pinned to the genesis, `net` a reader,
 * `key` from keyFromSeed, `plan` from planSeal. Returns { file, txHash, height }:
 * the capsule file the author must keep, and where the seal landed. Nothing but the
 * commitment, the channel, open_at and the label goes on chain.
 *
 * The salt exists only here, so the capsule file is handed to `onFile` the moment
 * the seal is signed and BEFORE it is sent (sealed_at is 0 in that first copy;
 * it is replaced, same capsule id, once a block holds the seal). If the send or the
 * wait then fails, the error carries `file` and `capsule` as well as signAndSend's
 * `txHash` and `sendState`: a capsule the devnet may hold is never left without its file.
 */
export async function sealCapsule({ chain, net, key, plan, onStage = () => {}, onFile = () => {}, wait = {} }) {
  if (!plan.ok) throw new KitError(plan.errors[0] || 'this seal is not valid', { code: 'plan' });
  const f = plan.fields;
  const c = commit(chain.domain, { author: key.sender, channel: f.channel, title: f.title, body: f.body });
  const acct = await net.get('/account/' + encodeURIComponent(key.sender));
  const nonce = isObj(acct) && isWhole(acct.next_nonce) ? acct.next_nonce : 0;
  const tx = pcc.buildTx('seal_capsule', { sender: key.sender, nonce, channel: f.channel, commitment: c.commitment, open_at: f.openAt, label: f.label });
  const fileFor = (sealedAt, sealTx) => makeCapsuleFile({ chainId: chain.chainId, genesis: chain.genesisHash, api: net.api, capsule: c.capsule, author: key.sender, channel: f.channel, title: f.title, body: f.body, salt: c.salt, label: f.label, openAt: f.openAt, sealedAt, sealTx });
  let done;
  try {
    done = await signAndSend(chain, key, tx, { onStage, ...wait, onSigned: ({ txHash }) => onFile(fileFor(0, txHash)) });
  } catch (e) {
    if (e && typeof e === 'object') { e.capsule = c.capsule; e.file = fileFor(0, e.txHash || ''); }
    throw e;
  }
  const file = fileFor(done.height, done.txHash);
  onFile(file);
  return { file, txHash: done.txHash, height: done.height };
}

/**
 * Open a capsule from its file. Refuses, sending nothing, unless the devnet lists
 * the capsule and its next block may open it (an open sent early burns the salt:
 * it sits in the mempool in the clear). Stores the message (POST /body, content
 * addressed), signs open_capsule with `key` (anyone's key will do) and sends it.
 * Returns { txHash, height }.
 */
export async function openCapsule({ chain, net, key, file, onStage = () => {}, wait = {} }) {
  const list = readCapsules(await net.get('/capsules'));
  const row = list && list.rows.find((r) => r.id === file.capsule);
  const tip = list ? list.height : null;
  const st = row && tip !== null ? stateOf(row, tip) : 'gone';
  if (st === 'gone') throw new KitError('The devnet does not list this capsule: it was never sealed here, has been opened, has lapsed and been pruned, or the devnet was reset. Nothing was sent, and the salt stays secret.', { code: 'gone' });
  if (st === 'waiting') throw new KitError('It opens at block ' + row.openAt + ' and the devnet is at ' + tip + '. Nothing was sent, so the message stays secret until then.', { code: 'early' });
  if (st === 'lapsed') throw new KitError('This capsule lapsed at block ' + row.lapsesAt + ' and can no longer open.', { code: 'lapsed' });
  const bodyHash = pcc.bodyHash(file.body);
  const stored = await net.post('/body', { body: file.body });
  if (!isObj(stored) || stored.body_hash !== bodyHash) throw new KitError('the devnet stored the message under a different hash from the one sealed', { code: 'body' });
  onStage('stored');
  const acct = await net.get('/account/' + encodeURIComponent(key.sender));
  const nonce = isObj(acct) && isWhole(acct.next_nonce) ? acct.next_nonce : 0;
  const tx = pcc.buildTx('open_capsule', { sender: key.sender, nonce, capsule: file.capsule, salt: file.salt, title: file.title, body_hash: bodyHash, media_uri: '' });
  const signature = await key.sign(pcc.signingHash(tx, chain.domain));
  const signed = { tx, public_key: key.publicKey, signature };
  onStage('signed');
  const local = pcc.txHash(signed);
  // From here the salt is in a request: a failure carries txHash and sendState (see signAndSend), so a page does not say "not
  // opened" about an open the devnet may hold, whose message is then public.
  let state = 'maybe';
  try {
    const r = await net.post('/tx', signed);
    if (!isObj(r) || r.tx_hash !== local) throw new KitError('the devnet reported a different transaction from the one signed', { code: 'hash' });
    state = 'sent';
    onStage('sent');
    const done = await waitIncluded(chain, local, { timeoutMs: 45000, intervalMs: 800, ...wait });
    return { txHash: local, height: done.height };
  } catch (e) {
    throw tagSendFailure(e, local, state);
  }
}

// ---------------------------------------------------------------- the wall of opened capsules

/**
 * Scan GET /feed (newest first) for capsules that have opened, joined to their
 * seals: the open_capsule card names the capsule; the seal_capsule card, found by
 * computing capsuleId(author, commitment), names who sealed it, when and with what
 * label. The message is fetched by its hash (GET /body/HASH), cut and shown as text.
 * Returns { items (newest open first), scannedBlocks, complete }.
 */
export async function readWall(net, { maxPages = LIMITS.feedPages, limit = LIMITS.feedLimit, show = LIMITS.wall } = {}) {
  const seals = new Map();
  const opens = [];
  let before = null;
  let pages = 0;
  let scanned = 0;
  let complete = false;
  while (pages < maxPages) {
    const page = await net.get('/feed?limit=' + limit + (before === null ? '' : '&before=' + before));
    pages += 1;
    if (!isObj(page) || !Array.isArray(page.blocks)) throw new KitError('the devnet’s /feed is not the shape this page reads', { code: 'shape' });
    for (const b of page.blocks) {
      if (!isObj(b) || !isWhole(b.height)) continue;
      scanned += 1;
      for (const card of Array.isArray(b.txs) ? b.txs : []) {
        if (!isObj(card) || !isObj(card.payload) || typeof card.sender !== 'string') continue;
        const p = card.payload;
        if (card.kind === 'seal_capsule' && isHex64(p.commitment)) {
          let id = '';
          try { id = pcc.capsuleId(card.sender, p.commitment); } catch { id = ''; }
          if (isHex64(id)) seals.set(id, { author: card.sender, height: b.height, timeMs: isWhole(b.timestamp) ? b.timestamp : 0, label: typeof p.label === 'string' ? cleanText(p.label, LIMITS.label) : '', channel: typeof p.channel === 'string' ? cleanText(p.channel, 16) : '', openAt: isWhole(p.open_at) ? p.open_at : null });
        } else if (card.kind === 'open_capsule' && isHex64(p.capsule) && isHex64(p.body_hash)) {
          opens.push({ capsule: p.capsule, bodyHash: p.body_hash, title: typeof p.title === 'string' ? cleanText(p.title, LIMITS.title) : '', opener: card.sender, height: b.height, timeMs: isWhole(b.timestamp) ? b.timestamp : 0, tx: isHex64(card.hash) ? card.hash : '' });
        }
      }
    }
    const next = page.next_before;
    if (!isWhole(next) || next < 1 || !page.blocks.length) { complete = true; break; }
    if (before !== null && next >= before) { complete = true; break; }
    before = next;
  }
  const items = [];
  for (const o of opens.slice(0, show)) {
    let text = null;
    try { text = await net.getText('/body/' + o.bodyHash); } catch { text = null; }
    const verified = typeof text === 'string' && pcc.bodyHash(text) === o.bodyHash;
    items.push({ ...o, body: verified ? cleanBlock(text, LIMITS.bodyBytes) : '', bodyVerified: verified, seal: seals.get(o.capsule) || null });
  }
  return { items, scannedBlocks: scanned, complete };
}

/** The capsule the devnet lists for this file, with its state. `tip` is the devnet's newest block. */
export function matchFile(file, list) {
  const row = list ? list.rows.find((r) => r.id === file.capsule) || null : null;
  return { row, state: row && list.height !== null ? stateOf(row, list.height) : 'gone', agrees: Boolean(row) && row.author === file.author && row.openAt === file.openAt && row.channel === file.channel && row.label === file.label };
}
