// daily-mint.js: the logic behind The Daily Mint (/chain/daily-mint), the
// PointCast devnet's play auction: one lot a UTC day, bids in devnet play ATTN
// (no value, never promised, may reset), the winner's card minted on chain.
//
// An ES module with no DOM access, so the page and node run the same code
// (tests/chain-app-daily-mint.test.mjs, scripts/e2e-chain-app-daily-mint.mjs).
// The page draws what this returns as text and audited SVG cards: nothing read
// from the devnet becomes markup, an href or a style value.
//
// Three jobs:
//   1. read the house: GET /daily (the open lot, the last seven lots, the
//      rules), validated and cleaned;
//   2. check the house: fold every sealed block through the same settle law the
//      Worker runs (first-mints/lib/daily-law.js, a pinned copy of the chain's
//      sdk/daily-law.js) and compare with the Worker's own GET /daily/law. A
//      missing, late or wrong refund, payment or mint is a violation anyone can
//      name by height. What it cannot see: a bid the house never let into a
//      block, and the house choosing when to seal;
//   3. bid: with a key made in the browser, take the faucet's 100 play ATTN once,
//      then sign an optional bid/v1 post (up to three words from the lexicon,
//      an optional gift address) and a transfer to the auctioneer. Sent only
//      when the person presses the button, to the devnet the page points at.
//
// devnet: no value, may reset. The house is also the sequencer: it can refuse a
// bid, and it can keep one out of every block.

import { pcc, cleanText, isObj, isWhole, isHex64, KitError, readStatus, signAndSend } from './chain-kit.js';
import { DAILY_LEXICON, DAILY_RULES, LAW_VERSION, bidTitle, fold, lotSeed, minBid, recipeHex, report } from '../first-mints/lib/daily-law.js';
import { auditSvg, renderCard } from '../first-mints/lib/first-mint.js';

export { DAILY_LEXICON, DAILY_RULES, LAW_VERSION, bidTitle, minBid };

export const FAUCET_DRIP = 100;
export const AUDIT_PAGE = 500;
export const AUDIT_MAX_BLOCKS = 40000;
export const NO_BODY = '0'.repeat(64);

const isAddress = (a) => typeof a === 'string' && pcc.addressKind(a) !== null;
const giftOk = (a) => ['tz1', 'tz2', 'pcp1'].includes(pcc.addressKind(a));

// ---------------------------------------------------------------- reading the house

const num = (v) => (Number.isFinite(v) ? v : null);

/** The nine numbers that make the house's rules. A devnet that changes any of them is not running the published law. */
export const RULE_FIELDS = Object.freeze(['reserve', 'increment_bps', 'snipe_ms', 'snipe_cap_ms', 'max_bids_per_sender', 'refund_blocks', 'settle_blocks', 'max_words', 'day_ms']);

/** Every rule field where the house's rules differ from the published ones this page runs: [{ field, house, published }]. */
export function ruleDifferences(rules) {
  if (!isObj(rules)) return [];
  return RULE_FIELDS.filter((k) => rules[k] !== DAILY_RULES[k]).map((k) => ({ field: k, house: rules[k], published: DAILY_RULES[k] }));
}

function readRules(r) {
  if (!isObj(r)) return null;
  const out = {};
  for (const k of ['reserve', 'increment_bps', 'snipe_ms', 'snipe_cap_ms', 'max_bids_per_sender', 'refund_blocks', 'settle_blocks', 'max_words', 'day_ms']) {
    if (!Number.isFinite(r[k])) return null;
    out[k] = r[k];
  }
  out.channel = typeof r.channel === 'string' ? cleanText(r.channel, 16) : 'DLY';
  out.edition = typeof r.edition === 'string' ? cleanText(r.edition, 64) : 'daily-mint';
  return out;
}

/** One lot as the house reports it (the same fields in GET /daily's recent list and GET /daily/N). */
export function readLotRow(l) {
  if (!isObj(l) || !isWhole(l.n)) return null;
  return {
    n: l.n,
    day: cleanText(String(l.day || ''), 10),
    bids: isWhole(l.bids) ? l.bids : 0,
    close: num(l.close),
    openedHeight: isWhole(l.opened_height) ? l.opened_height : null,
    closedHeight: isWhole(l.closed_height) ? l.closed_height : null,
    winner: typeof l.winner === 'string' && isAddress(l.winner) ? l.winner : null,
    price: isWhole(l.price) ? l.price : null,
    mintTo: typeof l.mint_to === 'string' && isAddress(l.mint_to) ? l.mint_to : null,
    words: Array.isArray(l.words) ? l.words.filter((w) => typeof w === 'string' && DAILY_LEXICON.includes(w)).slice(0, 3) : [],
    recipe: typeof l.recipe === 'string' && /^(?:[0-9a-f]{2}){15,38}$/.test(l.recipe) ? l.recipe : null,
    mintedHeight: isWhole(l.minted_height) ? l.minted_height : null,
    settledHeight: isWhole(l.settled_height) ? l.settled_height : null,
  };
}

/** GET /daily -> the house's view, or null when it is not that shape. `status` is on, paused or off. */
export function readDaily(json) {
  if (!isObj(json)) return null;
  const status = ['on', 'paused', 'off'].includes(json.status) ? json.status : 'off';
  const a = isObj(json.addresses) ? json.addresses : null;
  const addresses = a && isAddress(a.auctioneer) && isAddress(a.faucet) && isAddress(a.shelf) ? { auctioneer: a.auctioneer, faucet: a.faucet, shelf: a.shelf } : null;
  const rules = readRules(json.rules);
  const raw = isObj(json.lot) ? json.lot : null;
  let lot = null;
  if (raw && isWhole(raw.n)) {
    const lead = isObj(raw.leader) && isAddress(raw.leader.sender) ? raw.leader : null;
    lot = {
      n: raw.n,
      day: cleanText(String(raw.day || ''), 10),
      opensAt: num(raw.opens_at),
      closeAt: num(raw.close),
      minBid: isWhole(raw.min_bid) && raw.min_bid >= 1 ? raw.min_bid : null,
      bids: isWhole(raw.bids) ? raw.bids : 0,
      closesInMs: num(raw.closes_in_ms) === null ? null : Math.max(0, raw.closes_in_ms),
      leader: lead
        ? {
          sender: lead.sender,
          amount: isWhole(lead.amount) ? lead.amount : null,
          words: Array.isArray(lead.words) ? lead.words.filter((w) => DAILY_LEXICON.includes(w)).slice(0, 3) : [],
          to: typeof lead.to === 'string' && isAddress(lead.to) ? lead.to : null,
          height: isWhole(lead.height) ? lead.height : null,
        }
        : null,
    };
  }
  const recent = (Array.isArray(json.recent) ? json.recent : []).map(readLotRow).filter(Boolean).slice(0, 7);
  return {
    status,
    reason: typeof json.reason === 'string' ? cleanText(json.reason, 240) : '',
    addresses,
    rules,
    standard: Boolean(rules) && ruleDifferences(rules).length === 0,
    ruleDifferences: ruleDifferences(rules),
    height: isWhole(json.height) ? json.height : null,
    lot,
    recent,
    owedRefunds: isWhole(json.owed_refunds) ? json.owed_refunds : null,
    held: isWhole(json.held) ? json.held : null,
    violations: isWhole(json.violations) ? json.violations : null,
  };
}

/** GET /daily/N -> the lot, its bids and the violations the law found for it. */
export function readLotDetail(json) {
  const row = readLotRow(json);
  if (!row) return null;
  const bids = (Array.isArray(json.bid_list) ? json.bid_list : [])
    .filter((b) => isObj(b) && isAddress(b.sender) && isWhole(b.amount))
    .slice(0, 100)
    .map((b) => ({
      sender: b.sender,
      amount: b.amount,
      height: isWhole(b.height) ? b.height : null,
      tx: isHex64(b.tx) ? b.tx : '',
      words: Array.isArray(b.words) ? b.words.filter((w) => DAILY_LEXICON.includes(w)).slice(0, 3) : [],
      to: typeof b.to === 'string' && isAddress(b.to) ? b.to : null,
    }));
  const violations = (Array.isArray(json.violations) ? json.violations : []).filter(isObj).slice(0, 20).map((v) => ({ code: cleanText(String(v.code || ''), 40), height: isWhole(v.height) ? v.height : null }));
  return { ...row, leader: typeof json.leader === 'string' && isAddress(json.leader) ? json.leader : null, bids, violations };
}

/** Milliseconds left in the open lot: what the house said at the read, less the time since. Never negative. */
export function remainingMs(lot, readAt, nowMs) {
  if (!lot || lot.closesInMs === null || !Number.isFinite(readAt) || !Number.isFinite(nowMs)) return null;
  return Math.max(0, lot.closesInMs - Math.max(0, nowMs - readAt));
}

/** A lot's state in words: open, closed, settled, or the shelf. */
export function lotState(l) {
  if (l.settledHeight !== null) return l.winner ? 'sold' : 'shelf';
  if (l.closedHeight !== null) return 'settling';
  return 'open';
}

// ---------------------------------------------------------------- the cards

/** An SVG string as a data URI an <img> can show (an image never runs script or loads anything). */
export function svgDataUri(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/** The card for a recipe (hex), drawn here and audited; null when the recipe or the drawing is not clean. */
export function cardFor(recipe, n) {
  try {
    if (typeof recipe !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(recipe)) return null;
    const svg = renderCard(pcc.hexToBytes(recipe), { serial: n });
    if (!auditSvg(svg).ok) return null;
    return { svg, uri: svgDataUri(svg) };
  } catch {
    return null;
  }
}

/**
 * The open lot's card, which has no recipe on chain until it settles: the law
 * derives it from the genesis, the lot number and the prev_hash of the block
 * that holds the lot's opening post, and spells it with the leader's words.
 * One GET /raw/block/N. Null when the opening block cannot be read.
 */
export async function previewCard(net, genesis, daily) {
  const lot = daily && daily.lot;
  const opened = daily && daily.recent.find((l) => lot && l.n === lot.n);
  if (!lot || !opened || opened.openedHeight === null || !isHex64(genesis)) return null;
  const b = await net.get('/raw/block/' + opened.openedHeight);
  const prev = b && b.header && b.header.prev_hash;
  if (!isHex64(prev)) return null;
  const words = lot.leader ? lot.leader.words : [];
  const recipe = recipeHex(genesis, lot.n, prev, words);
  return { recipe, ...(cardFor(recipe, lot.n) || {}) };
}

// ---------------------------------------------------------------- checking the house

/** Deep equality of two JSON values, key order ignored. */
export function sameJson(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => sameJson(x, b[i]));
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && sameJson(a[k], b[k]));
}

/** Every sealed block from 1 to `upTo`, in pages of 500. Throws if the devnet runs dry or the chain is too long to replay here. */
export async function readAllBlocks(net, upTo, onProgress = () => {}) {
  if (!isWhole(upTo) || upTo > AUDIT_MAX_BLOCKS) throw new KitError('this chain has ' + upTo + ' blocks: more than this page replays (' + AUDIT_MAX_BLOCKS + ')', { code: 'too_long' });
  const out = [];
  let from = 1;
  while (from <= upTo) {
    const page = await net.get('/raw/blocks?from=' + from + '&limit=' + AUDIT_PAGE);
    if (!isObj(page) || !Array.isArray(page.blocks) || !page.blocks.length) throw new KitError('the devnet sent no blocks from ' + from, { code: 'short' });
    for (const b of page.blocks) if (isObj(b) && isObj(b.header) && b.header.height === out.length + 1 && b.header.height <= upTo) out.push(b);
    if (out.length < from) throw new KitError('the devnet’s blocks from ' + from + ' are out of order', { code: 'order' });
    from = out.length + 1;
    onProgress(out.length, upTo);
  }
  return out;
}

/**
 * Replay the Daily Mint from the chain and compare it with the house. `net` is
 * a makeNet reader. Returns { ok, lines, lots, violations, mismatches, blocks,
 * report, worker, nonStandard }. It takes blocks as served: check them with
 * Verify a block or the Block Yard when the server itself is in doubt.
 */
export async function auditHouse(net, { onProgress = () => {} } = {}) {
  const rawStatus = await net.get('/status');
  const status = readStatus(rawStatus);
  const daily = readDaily(await net.get('/daily'));
  if (!daily || !daily.addresses || daily.status === 'off') throw new KitError('the Daily Mint is off: ' + ((daily && daily.reason) || 'no reason given'), { code: 'off' });
  const worker = await net.get('/daily/law');
  if (!isObj(worker) || !isWhole(worker.height)) throw new KitError('the devnet’s own report (GET /daily/law) is not readable', { code: 'law' });
  const mismatches = [];
  if (worker.law !== LAW_VERSION) mismatches.push('law version: the devnet says ' + cleanText(String(worker.law), 40) + ', this page runs ' + LAW_VERSION);
  const rules = readRules(worker.rules) || DAILY_RULES;
  const differences = ruleDifferences(rules);
  const nonStandard = differences.length > 0;
  const cfg = { genesis: status.genesis, ...daily.addresses, rules: { ...DAILY_RULES, ...rules } };
  const edition = await net.get('/edition/daily-mint');
  const creator = isObj(edition) && isObj(edition.terms) ? edition.terms.creator : null;
  if (creator !== cfg.auctioneer) mismatches.push('the daily-mint edition’s creator is not the auctioneer');
  const treasury = isObj(rawStatus) && isObj(rawStatus.roles) && typeof rawStatus.roles.treasury === 'string' ? rawStatus.roles.treasury : null;
  if (treasury !== cfg.shelf) mismatches.push('the Town Shelf is not the treasury /status names');
  for (const k of ['genesis', 'auctioneer', 'faucet', 'shelf']) if (worker[k] !== cfg[k]) mismatches.push(k + ': the devnet reports one thing and the chain says another');
  const blocks = await readAllBlocks(net, worker.height, onProgress);
  const mine = JSON.parse(JSON.stringify(report(fold(cfg, blocks))));
  const lines = [];
  if (nonStandard) {
    const bits = [...differences].sort((a, b) => (a.field === 'day_ms' ? -1 : b.field === 'day_ms' ? 1 : 0)).map((d) => (d.field === 'day_ms' ? 'a ' + Math.round(d.house / 1000) + '-second lot day, a local test' : d.field + ' ' + d.house + ' (published: ' + d.published + ')'));
    lines.push({ kind: 'note', text: 'Not the standard rules: this devnet runs ' + bits.join(', ') + '. The replay uses the house’s own rules, so it can agree with them without agreeing with the published ones.' });
  }
  for (const l of mine.lots) {
    const bad = mine.violations.filter((v) => v.lot === l.n || v.n === l.n);
    const state = l.settled_height !== null ? 'settled at block ' + l.settled_height : l.closed_height !== null ? 'closed at block ' + l.closed_height : 'open';
    const who = l.winner ? l.price + ' play ATTN, minted to ' + pcc_short(l.mint_to) : l.closed_height !== null ? 'no bids: the Town Shelf' : l.bids + (l.bids === 1 ? ' bid' : ' bids') + ' so far';
    lines.push({ kind: bad.length ? 'fail' : 'ok', text: 'Lot ' + String(l.n).padStart(4, '0') + ' · ' + l.day + ' · ' + state + ' · ' + who });
  }
  for (const v of mine.violations) lines.push({ kind: 'fail', text: 'Violation: ' + cleanText(String(v.code), 40) + (isWhole(v.height) ? ' at block ' + v.height : '') });
  const agree = sameJson(mine, worker);
  if (!agree) for (const k of Object.keys(mine)) if (!sameJson(mine[k], worker[k])) mismatches.push('report.' + k + ' differs from the devnet’s own');
  return {
    ok: mismatches.length === 0 && mine.violations.length === 0,
    lines,
    lots: mine.lots.length,
    refunds: mine.refunds,
    refunded: mine.refunded,
    owed: mine.owed.length,
    held: mine.held,
    violations: mine.violations,
    mismatches,
    agree,
    blocks: blocks.length,
    height: mine.height,
    nonStandard,
    ruleDifferences: differences,
    report: mine,
    worker,
  };
}

function pcc_short(a) {
  const s = String(a || '');
  return s.length <= 15 ? s : s.slice(0, 8) + '…' + s.slice(-6);
}

// ---------------------------------------------------------------- bidding

/** The least bid the lot takes now, from the house's own number (never lower than the law's reserve). */
export function leastBid(daily) {
  const lot = daily && daily.lot;
  if (!lot) return null;
  const reserve = daily.rules ? daily.rules.reserve : DAILY_RULES.reserve;
  const fromLeader = lot.leader && lot.leader.amount !== null ? minBid(lot.leader.amount, daily.rules ? { ...DAILY_RULES, ...daily.rules } : DAILY_RULES) : reserve;
  return Math.max(lot.minBid === null ? 0 : lot.minBid, fromLeader);
}

/**
 * Check a bid before anything is signed. Returns { ok, errors, title, words, amount, gift }.
 * `balance` is the sender's play ATTN, or null when not known yet.
 */
export function planBid({ daily, sender, amount, words = [], gift = '', balance = null }) {
  const errors = [];
  const lot = daily && daily.lot;
  if (!daily || daily.status !== 'on' || !daily.addresses) errors.push('The Daily Mint is not taking bids right now.');
  else if (!lot) errors.push('No lot is open right now.');
  else if (lot.closesInMs === 0) errors.push('This lot has closed.');
  if (!isAddress(sender)) errors.push('Make a key first: a bid is signed by it.');
  else if (daily && daily.addresses && Object.values(daily.addresses).includes(sender)) errors.push('The house does not bid.');
  const n = typeof amount === 'string' ? (/^\d{1,12}$/.test(amount.trim()) ? Number(amount.trim()) : NaN) : amount;
  if (!Number.isSafeInteger(n) || n < 1) errors.push('The bid is a whole number of play ATTN, 1 or more.');
  else {
    const least = leastBid(daily);
    if (least !== null && n < least) errors.push('The least bid right now is ' + least + ' play ATTN.');
    if (balance !== null && n > balance) errors.push('You hold ' + balance + ' play ATTN; this bid is ' + n + '.');
  }
  const ws = (Array.isArray(words) ? words : []).map((w) => String(w).trim().toUpperCase()).filter(Boolean);
  const maxWords = daily && daily.rules ? daily.rules.max_words : DAILY_RULES.max_words;
  if (ws.length > maxWords) errors.push('At most ' + maxWords + ' words on the card.');
  for (const w of ws) if (!DAILY_LEXICON.includes(w)) errors.push('“' + cleanText(w, 20) + '” is not in the lexicon.');
  if (new Set(ws).size !== ws.length) errors.push('Each word once.');
  const g = String(gift || '').trim();
  if (g && !(isAddress(g) && giftOk(g))) errors.push('A gift goes to a tz1, tz2 or pcp1 address.');
  const title = lot ? bidTitle(lot.n, ws, g || null) : '';
  // `auctioneer` and `lot` are what the confirm names: send() holds the transfer to exactly these.
  return { ok: errors.length === 0, errors, title, words: ws, amount: n, gift: g || null, lot: lot ? lot.n : null, auctioneer: daily && daily.addresses ? daily.addresses.auctioneer : null, sender: isAddress(sender) ? sender : '' };
}

/** GET /edition/daily-mint -> the creator its own terms name (the address the house must be bidding as), or null when it cannot be read. */
export async function readEditionCreator(net) {
  const edition = await net.get('/edition/daily-mint');
  return isObj(edition) && isObj(edition.terms) && typeof edition.terms.creator === 'string' ? edition.terms.creator : null;
}

/** POST /daily/faucet {address}: 100 play ATTN once per address (CORS open). Returns the devnet's answer. */
export async function claimFaucet(net, address) {
  if (!isAddress(address)) throw new KitError('not an address', { code: 'bad_address' });
  const r = await net.post('/daily/faucet', { address });
  return { txHash: isHex64(r && r.tx_hash) ? r.tx_hash : '', amount: isWhole(r && r.amount) ? r.amount : null, note: cleanText(String((r && r.note) || ''), 200) };
}

/** The status of a transaction: GET /tx/HASH -> { status ('included', 'pending', 'rejected' or 'unknown'), height }. */
export async function txStatus(net, txHash) {
  if (!isHex64(txHash)) throw new KitError('a transaction id is 64 hex characters', { code: 'bad_tx' });
  const r = await net.get('/tx/' + txHash);
  if (!isObj(r)) return { status: 'unknown', height: null };
  return { status: cleanText(String(r.status || ''), 20), height: isWhole(r.height) ? r.height : null };
}

/** An account's play ATTN and next nonce, from GET /account/ADDR (a new key has 0 and nonce 0). */
export async function readAccount(net, address) {
  const a = await net.get('/account/' + encodeURIComponent(address));
  if (!isObj(a)) return { balance: 0, nonce: 0, exists: false };
  return { balance: isWhole(a.balance) ? a.balance : 0, nonce: isWhole(a.next_nonce) ? a.next_nonce : 0, exists: a.exists === true };
}

/**
 * Send a bid: the bid/v1 post when there are words or a gift (it must land first),
 * then the transfer to the auctioneer. `chain` is the SDK client pinned to the
 * genesis, `net` a reader, `key` from keyFromSeed. Returns { postTx, bidTx, height }.
 * Throws the devnet's own words, e.g. { code: 'daily_bid_refused' } when the door refuses.
 */
export async function sendBid({ chain, net, key, daily, plan, onStage = () => {}, wait = {} }) {
  if (!plan.ok) throw new KitError(plan.errors[0] || 'this bid is not valid', { code: 'plan' });
  const acct = await readAccount(net, key.sender);
  let nonce = acct.nonce;
  let postTx = '';
  // A failure says which of the two transactions it was, so a page can word it by what is known about each.
  const at = (stage, e) => { if (e && typeof e === 'object') e.stage = stage; return e; };
  let postHeight = null;
  if (plan.words.length || plan.gift) {
    const post = await chain.buildPublish({ sender: key.sender, channel: 'DLY', title: plan.title, bodyHash: NO_BODY, nonce });
    let a;
    try { a = await signAndSend(chain, key, post, { ...wait, onStage: (s) => onStage('post:' + s) }); } catch (e) { throw at('post', e); }
    postTx = a.txHash;
    postHeight = a.height;
    nonce += 1;
  }
  const tx = pcc.buildTx('transfer', { sender: key.sender, nonce, to: daily.addresses.auctioneer, amount: plan.amount });
  let b;
  try { b = await signAndSend(chain, key, tx, { ...wait, onStage: (s) => onStage('bid:' + s) }); } catch (e) {
    at('bid', e);
    if (postTx) e.partial = { postTx, postHeight };
    throw e;
  }
  return { postTx, bidTx: b.txHash, height: b.height };
}

export { lotSeed };
