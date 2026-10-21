// start.js: the logic behind "Start here" (/chain/start), one guided minute on
// the PointCast devnet for someone who has never touched it: make a key, take
// the faucet's play ATTN, do ONE thing (bid on today's Daily Mint lot, stamp a
// sentence with the Notary, or seal a 7-day time capsule), then see that
// transaction in a block.
//
// An ES module with no DOM access, so the page and node run the same code
// (tests/chain-app-start.test.mjs, scripts/e2e-chain-app-start.mjs).
//
// It does not do any of the three things itself. The bid is daily-mint.js
// sendBid, the stamp notary.js stampHash, the capsule capsules.js sealCapsule,
// each called exactly as their own pages call them. What this file adds:
//   - reviewedKey(): a key that, when one of those modules asks it to sign,
//     first hands the page the EXACT transaction the module built (every field,
//     the chain's own description of it, and the digest that will be signed)
//     and signs only if the person presses Sign. Cancel and nothing is signed
//     or sent. The modules reach it through chain-kit.js signAndSend, which asks
//     a key that has signTx() for the whole signed transaction;
//   - the passkey option, the same passkey account First Mints makes
//     (public/chain/first-mints/live.js): created with the chain's own RP ID and
//     used only on the sites the chain's launch record 7 names. On devnet-2 that
//     is https://pointcast.xyz alone, so anywhere else the page says so and asks
//     nothing;
//   - the small plans a stranger needs: the least bid, a sentence's fingerprint,
//     how many blocks are "about 7 days", and the links that check the block.
//
// devnet: no value, may reset. Play ATTN is never promised any.

import { pcc, cleanText, isHex64, isObj, isWhole, KitError } from './chain-kit.js';
import * as D from './daily-mint.js';
import * as N from './notary.js';
import * as C from './capsules.js';

export const STEPS = Object.freeze(['key', 'attn', 'act', 'see']);
export const CHOICES = Object.freeze(['bid', 'stamp', 'capsule']);

/** A capsule sealed here opens about this many days on, counted in blocks at the rate the devnet keeps. */
export const CAPSULE_DAYS = 7;
/** Where a capsule sealed here airs when it opens: the gardens (open to every key). */
export const CAPSULE_CHANNEL = 'GDN';
export const LIMITS = Object.freeze({ sentence: 280, closeMarginMs: 120000, fundWaitMs: 20000 });

/**
 * Where First Mints keeps which passkey this browser made (its public key and
 * credential id, never anything secret): public/chain/first-mints/live.js. The
 * start page reads and writes the same slot, so one passkey account serves both.
 */
export const PASSKEY_SLOT = 'pc-fm-live:devnet-2';

// ---------------------------------------------------------------- what will be signed

/** A field's value as one line of text: strings as they are, numbers as digits, anything else as JSON. */
function fieldText(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean') return String(v);
  try { return JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? String(x) : x)); } catch { return String(v); }
}

const pad4 = (n) => String(n).padStart(4, '0');

/**
 * The card the page shows before anything is signed, built from the transaction
 * itself: a headline in plain words, every field exactly as it will be signed,
 * the chain's own description (the SDK's describeTx, in chain words), and the
 * digest the key signs. `chain` is the SDK client (domain, params, chainId).
 * `context` adds what the transaction cannot say about itself (the lot a
 * transfer bids on, the sentence a stamp fingerprints). Text only: the page
 * writes every string with textContent.
 */
export function whatYouSign(tx, chain, context = {}) {
  if (!isObj(tx) || typeof tx.type !== 'string') throw new KitError('not a transaction', { code: 'bad_tx' });
  let digest = '';
  try { digest = pcc.signingHash(tx, chain.domain); } catch (e) { throw new KitError('this transaction cannot be signed: ' + cleanText(String(e && e.message), 160), { code: 'bad_tx' }); }
  let sdk = null;
  try { sdk = pcc.describeTx(tx, { words: 'chain', params: chain.params, domain: chain.domain }); } catch { sdk = null; }
  const fields = Object.keys(tx).map((k) => [k, fieldText(tx[k])]);
  let headline;
  if (tx.type === 'transfer') headline = 'A transfer of ' + fieldText(tx.amount) + ' play ATTN from ' + tx.sender + ' to ' + tx.to + (context.lot ? ', the auctioneer, as your bid on lot ' + pad4(context.lot) : '') + '.';
  else if (tx.type === 'publish_block' && isHex64(context.sha256)) headline = 'A Notary stamp of your sentence’s fingerprint, SHA-256 ' + context.sha256 + ': a post on channel ' + tx.channel + ' whose body is fixed by the hash ' + fieldText(tx.body_hash) + '. Your sentence is not in it.';
  else if (tx.type === 'publish_block') headline = 'A post on channel ' + tx.channel + ' titled “' + fieldText(tx.title) + '”. Its body is fixed by the hash ' + fieldText(tx.body_hash) + '.';
  else if (tx.type === 'seal_capsule') headline = 'A sealed time capsule on channel ' + tx.channel + ', wax seal “' + fieldText(tx.label) + '”, that anyone may open from block ' + fieldText(tx.open_at) + '. The chain gets only its commitment, not your message.';
  else headline = 'A ' + tx.type + ' transaction.';
  return {
    kind: tx.type,
    headline,
    sender: String(tx.sender || ''),
    nonce: fieldText(tx.nonce),
    fields,
    sdk: sdk ? { title: sdk.title, allowed: sdk.allowed || [], notAllowed: sdk.not_allowed || [], lasts: sdk.lasts, undo: sdk.undo } : null,
    digest,
    chainId: String(chain.chainId || ''),
    genesis: String(chain.genesisHash || ''),
    context,
  };
}

/** The signed transaction for a key that signs a digest (an ed25519 key made in the browser). */
async function signDigest(key, tx, chain) {
  return { tx, public_key: key.publicKey, signature: await key.sign(pcc.signingHash(tx, chain.domain)) };
}

/**
 * A key that shows the page what it is about to sign. When a module asks it to
 * sign (chain-kit signAndSend calls signTx), it builds whatYouSign(tx) and awaits
 * `review(card)`: true signs, anything else refuses with code 'declined' and
 * nothing is signed or sent. `base` is a key from keyFromSeed or passkeyKey;
 * `context(tx)` may add what the page knows about the transaction. `onSign` is
 * told each card that was signed.
 */
export function reviewedKey(base, review, { context = () => ({}), onSign = () => {} } = {}) {
  if (!base || typeof base.sender !== 'string') throw new KitError('make a key first', { code: 'no_key' });
  return {
    sender: base.sender,
    publicKey: base.publicKey,
    kind: base.kind || 'play',
    async signTx(tx, chain) {
      const card = whatYouSign(tx, chain, context(tx) || {});
      const ok = await review(card);
      if (ok !== true) throw new KitError('Not signed: you pressed Cancel. Nothing was signed or sent.', { code: 'declined' });
      const signed = typeof base.signTx === 'function' ? await base.signTx(tx, chain, card) : await signDigest(base, tx, chain);
      onSign(card);
      return signed;
    },
  };
}

// ---------------------------------------------------------------- passkeys

/**
 * Can this page make or use a passkey account on this chain? The chain's launch
 * record 7 (GET /params, launch.webauthn) fixes the RP ID and the only sites a
 * passkey may sign from, at genesis. Returns { ok, rpId, origins, reason }.
 */
export function passkeyPlace({ params, origin, webauthn }) {
  const w = isObj(params) && isObj(params.launch) && isObj(params.launch.webauthn) ? params.launch.webauthn : null;
  if (!w || typeof w.rp_id !== 'string' || !Array.isArray(w.origins)) return { ok: false, rpId: '', origins: [], reason: 'This devnet has no passkey accounts: its launch record 7 is off.' };
  const origins = w.origins.filter((o) => typeof o === 'string').map((o) => cleanText(o, 120));
  const rpId = cleanText(w.rp_id, 120);
  if (!origins.includes(String(origin || ''))) return { ok: false, rpId, origins, reason: 'Passkeys on this devnet work only on ' + origins.join(' and ') + ': the chain fixed that list at genesis, so this copy of the page cannot make or use one. The play key works anywhere.' };
  if (!webauthn) return { ok: false, rpId, origins, reason: 'This browser has no passkeys (WebAuthn). The play key works here.' };
  return { ok: true, rpId, origins, reason: '' };
}

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * The account a new passkey credential makes, as First Mints reads it (live.js):
 * the ES256 public key compressed to 33 bytes (the SDK's p256PublicKey), the
 * pcp1 address it derives, and the credential id, base64url. Throws on anything else.
 */
export function passkeyFromCredential(cred) {
  if (!cred || !cred.response || typeof cred.response.getPublicKey !== 'function' || !cred.rawId) throw new KitError('the passkey gave no public key', { code: 'passkey' });
  let publicKey;
  try { publicKey = pcc.p256PublicKey(new Uint8Array(cred.response.getPublicKey())); } catch { throw new KitError('unexpected public key format: a passkey here is ES256 (P-256)', { code: 'passkey' }); }
  if (!pcc.isP256Key(publicKey.bytes)) throw new KitError('the passkey’s key is not a P-256 point the chain takes', { code: 'passkey' });
  return { publicKey, credentialId: b64url(new Uint8Array(cred.rawId)), address: pcc.passkeyAddress(publicKey) };
}

/** Make a passkey account: one navigator.credentials.create with First Mints' own options. Returns { publicKey, credentialId, address }. */
export async function makePasskey({ rpId, credentials, random = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n)) }) {
  if (!credentials || typeof credentials.create !== 'function') throw new KitError('this browser has no passkeys (WebAuthn)', { code: 'passkey' });
  const cred = await credentials.create({
    publicKey: {
      rp: { id: rpId, name: 'PointCast' },
      user: { id: random(16), name: 'devnet-2 wallet', displayName: 'PointCast devnet-2' },
      challenge: random(32),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
      timeout: 60000,
    },
  });
  return passkeyFromCredential(cred);
}

/** The passkey account First Mints or this page kept on this device, if it reads cleanly; else null. */
export function loadPasskey(storage) {
  try {
    const raw = storage && storage.getItem(PASSKEY_SLOT);
    const w = raw ? JSON.parse(raw) : null;
    if (!isObj(w) || !isObj(w.publicKey) || w.publicKey.scheme !== 'p256' || typeof w.credentialId !== 'string' || !/^[A-Za-z0-9_-]{16,1400}$/.test(w.credentialId)) return null;
    if (!pcc.isP256Key(w.publicKey.bytes)) return null;
    const address = pcc.passkeyAddress(w.publicKey);
    return address === w.address ? { publicKey: { scheme: 'p256', bytes: w.publicKey.bytes }, credentialId: w.credentialId, address } : null;
  } catch { return null; }
}
export function storePasskey(storage, w) {
  try { storage.setItem(PASSKEY_SLOT, JSON.stringify(w)); return true; } catch { return false; }
}

/**
 * A key that is a passkey: signs with one navigator.credentials.get over the
 * tx's signing hash (the SDK's signWithPasskey, sig_mode webauthn). The SDK
 * raises the passkey sheet only after `confirm(words)`: here that is true only
 * when the words are for the very digest the person reviewed (`card`), so a
 * passkey never signs anything the page did not show first.
 */
export function passkeyKey(w, { rpId, credentials }) {
  return {
    sender: w.address,
    publicKey: w.publicKey,
    kind: 'passkey',
    async signTx(tx, chain, card) {
      if (!card || !isHex64(card.digest)) throw new KitError('a passkey signs only what the page showed first', { code: 'unreviewed' });
      return pcc.signWithPasskey(tx, chain.domain, {
        publicKey: w.publicKey,
        credentialId: w.credentialId,
        rpId,
        params: chain.params,
        credentials,
        confirm: async (words) => Boolean(words && words.details && words.details.digest === card.digest),
      });
    },
  };
}

// ---------------------------------------------------------------- step 2: play ATTN

/**
 * Take the faucet's play ATTN and wait for it to land. Returns { amount, balance, already }.
 * A key that already took its share (409) is not an error here when it holds play ATTN.
 */
export async function takeAttn(net, address, { waitMs = LIMITS.fundWaitMs, every = 700, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  let amount = null;
  let already = false;
  try {
    amount = (await D.claimFaucet(net, address)).amount;
  } catch (e) {
    if (!(e && e.status === 409)) throw e;
    already = true;
  }
  const end = Date.now() + waitMs;
  for (;;) {
    const a = await D.readAccount(net, address);
    if (a.balance > 0 || Date.now() > end) return { amount, balance: a.balance, already };
    await sleep(every);
  }
}

// ---------------------------------------------------------------- step 3: the three choices

/** The bid this page makes: the least the open lot takes now (1 play ATTN while nobody has bid), no card words, no gift. */
export function bidPlan(daily, sender, balance) {
  const least = D.leastBid(daily);
  return D.planBid({ daily, sender, amount: least === null ? 1 : least, words: [], gift: '', balance });
}

/**
 * A lot read at `readAt` that will close within `margin` ms of `nowMs` (or has
 * closed) is not bid on from this page: a transfer that lands after the close
 * would bid on the next lot, not the one the person read.
 */
export function lotStillOpen(lot, readAt, nowMs, margin = LIMITS.closeMarginMs) {
  const left = D.remainingMs(lot, readAt, nowMs);
  return left === null ? true : left > margin;
}

/** A sentence to stamp: one line as typed, not empty, at most 280 characters. Returns { ok, error, text }. */
export function checkSentence(raw) {
  const text = String(raw === undefined || raw === null ? '' : raw);
  if (!text.trim()) return { ok: false, error: 'Type a sentence first.', text: '' };
  if (/[\r\n]/.test(text)) return { ok: false, error: 'One line: a sentence has no line breaks.', text: '' };
  if (Array.from(text).length > LIMITS.sentence) return { ok: false, error: 'At most ' + LIMITS.sentence + ' characters.', text: '' };
  return { ok: true, error: '', text };
}

/** What a stamp of `sentence` puts on chain: its SHA-256 and byte count, and the five-line body (name and note left out). */
export async function stampOf(sentence) {
  const h = await N.hashText(sentence);
  return { sha256: h.sha256, bytes: h.bytes, body: N.stampBody({ sha256: h.sha256, bytes: h.bytes }), title: N.stampTitle(h.sha256) };
}

/**
 * The seal rate over the last day or so, in blocks an hour, from two block
 * headers: the tip and the block `span` before it (GET /block/N twice, a few
 * hundred bytes). A capsule's 7 days are projected from this, not from the last
 * few minutes, which a burst of posts can make look ten times busier. Never
 * below the idle heartbeat (one block every five minutes, 12 an hour), which is
 * also the answer when the times cannot be read. Block 1 is skipped: its time can
 * be 0.
 */
export async function dayRate(net, tip, span = 288) {
  if (!isWhole(tip) || tip < 4) return 12;
  const from = Math.max(2, tip - span);
  try {
    const [a, b] = await Promise.all([net.get('/block/' + from), net.get('/block/' + tip)]);
    const t0 = isObj(a) && isWhole(a.timestamp) ? a.timestamp : 0;
    const t1 = isObj(b) && isWhole(b.timestamp) ? b.timestamp : 0;
    const dt = t0 > 1e12 && t1 > t0 ? t1 - t0 : 0;
    return dt >= 60000 ? Math.max(12, ((tip - from) * 3600000) / dt) : 12;
  } catch { return 12; }
}

/**
 * How many blocks make about `days` days at `perHour` blocks an hour, inside the
 * capsule limits. Never fewer than `days` of idle heartbeats (12 an hour): the
 * devnet seals at least that often, so fewer blocks could open it early.
 */
export function capsuleDelay(perHour, days = CAPSULE_DAYS) {
  const rate = Number.isFinite(perHour) && perHour > 12 ? perHour : 12;
  return Math.min(C.LIMITS.maxDelay, Math.max(C.LIMITS.minDelay, Math.round(days * 24 * rate)));
}

/** The capsule plan: capsules.js planSeal with the gardens channel and a delay of about 7 days. */
export function capsulePlan({ message, title, label, tip, perHour, sender }) {
  return C.planSeal({ channel: CAPSULE_CHANNEL, title, body: message, label, delay: capsuleDelay(perHour), tip, sender });
}

/**
 * Keep a capsule file where Time Capsules (/chain/capsules) finds it: the list in
 * `slot` (capsules-view.js MY_SLOT), newest first, one per capsule, at most 32,
 * entries this page cannot read left as they are. Returns true when it is there.
 */
export function keepCapsuleFile(storage, slot, file) {
  try {
    const raw = storage.getItem(slot);
    const list = raw ? JSON.parse(raw) : [];
    const rest = (Array.isArray(list) ? list : []).filter((f) => !(isObj(f) && f.capsule === file.capsule));
    storage.setItem(slot, JSON.stringify([file, ...rest].slice(0, 32)));
    return true;
  } catch { return false; }
}

// ---------------------------------------------------------------- step 4: see it in a block

/**
 * The links that check a block, as same-site paths only: Verify a block by hand
 * at #b=N, the Block Yard (which replays every block) and the Observatory. Under
 * a local ?devnet= override they point at that same local devnet. `yard` is the
 * page's own Block Yard link for the public devnet.
 */
export function blockLinks(where, height, yard) {
  const n = isWhole(height) && height >= 1 ? height : null;
  const local = Boolean(where && where.override && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(where.api));
  const dq = local ? '?devnet=' + encodeURIComponent(where.api) : '';
  const yardLocal = local ? '/chain/yard/?api=' + encodeURIComponent(where.api) + (isHex64(where.genesis) ? '&genesis=' + where.genesis : '') + '&verifier=/chain/yard/verifier' : null;
  const safeYard = typeof yard === 'string' && yard.startsWith('/chain/yard/') ? yard : '/chain/yard/';
  return {
    verify: n === null ? null : '/chain/verify-a-block' + dq + '#b=' + n,
    yard: yardLocal || safeYard,
    observatory: '/chain/observatory' + dq,
  };
}

/** Read back the block a transaction landed in: GET /block/N and GET /tx/HASH. Returns { height, hash, timeMs, included }. */
export async function landed(net, txHash, height) {
  let hash = '';
  let timeMs = 0;
  let included = false;
  try {
    const b = await net.get('/block/' + height);
    if (isObj(b) && isHex64(b.hash)) hash = b.hash;
    if (isObj(b) && isWhole(b.timestamp)) timeMs = b.timestamp;
  } catch { /* the block height and the transaction still stand */ }
  try {
    const t = await D.txStatus(net, txHash);
    included = t.status === 'included' && t.height === height;
  } catch { included = false; }
  return { height, hash, timeMs, included };
}

export { D, N, C };
