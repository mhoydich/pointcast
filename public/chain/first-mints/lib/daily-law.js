// daily-law.js: the Daily Mint's settle law. One pure function of the chain.
//
// The Daily Mint is a PLAY auction on the PointCast devnet: one lot per UTC
// day, bid in devnet play ATTN (no value, never promised; the devnet may
// reset). The winner's card is minted on chain as a serial of the
// `daily-mint` edition (launch record 8). This module decides every outcome
// from blocks alone, and the same code runs in three places:
//
//   - the house auctioneer inside the devnet Worker (deploy/devnet-worker/src/daily.js),
//   - any browser, over blocks it fetched (and, ideally, verified),
//   - scripts/audit-daily.mjs, which replays a chain and must agree with the Worker.
//
// So the house is checked rather than trusted: every bid, refund, payment and
// mint is a tx in a block, and a missing, late or wrong one is a violation
// anyone can name by height. What the law cannot see: a bid the house never
// let into a block (censorship), and the house choosing when to seal.
//
// Pure: no Date.now, no Math.random, no I/O. Blocks are the node's raw block
// JSON ({header: {height, prev_hash, timestamp, …}, txs: [{tx, public_key, signature}]}),
// in height order from 1. A block's txs all applied (the sequencer drops the
// rest), so "an included transfer" means "the funds moved".
//
// On chain (all from the auctioneer unless noted; channel DLY, titles only):
//
//   lot/v1 NNNN                    opens lot NNNN at that block's timestamp; it
//                                  closes at the next 00:00 UTC (one lot per UTC day)
//   transfer bidder → auctioneer   a bid, if valid (rules below); otherwise owed back
//   bid/v1 NNNN W1 W2 W3 [to=ADDR] (from a bidder) the words for the card, from the
//                                  lexicon, and an optional gift address; the latest
//                                  such post before a bid rides with that bid
//   transfer auctioneer → bidder   a refund of an owed inflow, same amount
//   transfer auctioneer → faucet   the winning amount (payment), after close
//   edition_mint daily-mint        the card, serial NNNN, to the winner (or gift
//                                  address), recipe derived below; the Town Shelf
//                                  (treasury) when nobody bid
//   sold/v1 NNNN PRICE|shelf       the result, after close
//
// Rules (DAILY_RULES):
//   - A valid bid is an included transfer to the auctioneer from a non-house
//     account, while a lot is open (in a block after the one holding its
//     lot/v1 post, at a block timestamp before its close), of at least max(reserve, ceil(high × 1.05),
//     high + 1), and at most the sender's 20th valid bid on that lot.
//     Ties cannot win: an equal amount is under the minimum, so the earliest
//     (height, index) keeps the lead.
//   - Anti-snipe: a valid bid in the last 5 minutes moves the close to its
//     timestamp + 5 minutes, never past closes_at + 2 hours.
//   - Close: the first block with timestamp ≥ close. A transfer in that block
//     or later is after close (owed back).
//   - Every inflow that is not the leading bid is owed back within 3 blocks of
//     becoming owed (when it arrived, or when it was outbid).
//   - Settlement (payment, mint, sold post) is due within 3 blocks of the close
//     block, never before it. The next lot opens only after the sold post.
//   - Violations: a refund late or missing, an outflow nobody was owed, a wrong
//     payment, winner, recipient, recipe or serial, a second mint for a lot, a
//     mint into the edition by anyone else, early or late settlement, a lot out
//     of order.

import { blake2b, bytesToHex, hexToBytes, addressKind, txHash } from "./pointcast-chain.js";
import { CONTRAST_PAIRS, RANGES, encodeRecipe, validate, renderCard } from "./first-mint.js";

export const LAW_VERSION = "pointcast/daily-law/v1";

/** The rules every lot obeys. Changing any of these changes outcomes: bump LAW_VERSION. */
export const DAILY_RULES = Object.freeze({
  channel: "DLY",
  edition: "daily-mint",
  reserve: 1,
  increment_bps: 500,
  snipe_ms: 300_000,
  snipe_cap_ms: 7_200_000,
  max_bids_per_sender: 20,
  refund_blocks: 3,
  settle_blocks: 3,
  max_words: 3,
  // The lot day. Only a local test run shortens it (DEVNET_DAILY_DAY_MS, with the snipe
  // window and cap scaled alike: testRules); every real lot closes at 00:00 UTC.
  day_ms: 86_400_000,
});

/** Rules for a short local test day of `dayMs` (≥ 60 s): the snipe window and cap keep their share of the day. */
export function testRules(dayMs) {
  const d = Math.max(60_000, Math.floor(Number(dayMs)));
  return Object.freeze({
    ...DAILY_RULES,
    day_ms: d,
    snipe_ms: Math.max(1_000, Math.round((DAILY_RULES.snipe_ms * d) / DAILY_RULES.day_ms)),
    snipe_cap_ms: Math.max(2_000, Math.round((DAILY_RULES.snipe_cap_ms * d) / DAILY_RULES.day_ms)),
  });
}

/** What every Daily surface says above the fold. */
export const DAILY_COPY = "Daily Mint · play auction · devnet play ATTN · no value · may reset";
export const DAILY_NOTE =
  "Every bid, refund and mint is a block anyone can check. The house can refuse your bid; it can't keep it without " +
  "leaving evidence. Not detectable: a bid the house never let in.";

/** Card words: the First Mints lexicon (issuer/edition-attestor.js) minus place, brand and venue words. */
export const DAILY_LEXICON = Object.freeze([
  "FOREVER", "DRUM", "MARINE", "LAYER", "SIGNAL", "WIRE", "NIGHT", "SHIFT", "TIDE", "SURF",
  "SUN", "FOG", "RINGS", "TILES", "RADIO", "TAP", "IN", "HERE", "NOW", "FIRST",
  "MINT", "CARD", "HELLO", "PICKLE", "BALL", "COFFEE", "POUR", "SHORT", "WAVE", "NET",
  "7.200", "#1", "#100", "&", "!", "?", "ONE", "MORE", "BEAT", "OPEN", "AIR",
]);
const LEXICON_SET = new Set(DAILY_LEXICON);

/** Domain tag of a lot's seed. */
export const SEED_TAG = "pointcast/daily-mint/v1";
/** sha256 of sdk/first-mint.js, the renderer the edition pins (scripts/renderer-hash.sh). */
export const RENDERER_SHA256 = "43aa51b3f3fcb624a8bda644c9bd39a2f19a6f0b2aa0926800745d6963039f7a";

const DAY_MS = 86_400_000;
const enc = new TextEncoder();
const utf8 = (s) => enc.encode(s);

/** `YYYY-MM-DD` (UTC) of a unix-ms timestamp. */
export const utcDay = (ms) => new Date(Math.floor(ms / DAY_MS) * DAY_MS).toISOString().slice(0, 10);
/** The first 00:00 UTC strictly after `ms` (the first multiple of `dayMs` after it). */
export const nextMidnight = (ms, dayMs = DAY_MS) => Math.floor(ms / dayMs) * dayMs + dayMs;
/** Lot numbers in titles: at least 4 digits. */
export const lotTag = (n) => String(n).padStart(4, "0");

/** The least valid next bid over `high` (0 = no bid yet). Integer math only. */
export function minBid(high, rules = DAILY_RULES) {
  if (!high) return rules.reserve;
  const pct = Math.floor((high * (10_000 + rules.increment_bps) + 9_999) / 10_000);
  return Math.max(rules.reserve, pct, high + 1);
}

const isGiftAddress = (a) => ["tz1", "tz2", "pcp1"].includes(addressKind(a));

/**
 * Parse a bidder's `bid/v1 NNNN W… [to=ADDR]` title. Returns {n, words, to}
 * or null (anything off: the post is ignored, never half-applied).
 */
export function parseBidTitle(title, rules = DAILY_RULES) {
  const m = /^bid\/v1 (\d{4,9})((?: [^ ]+)*)$/.exec(String(title));
  if (!m) return null;
  const words = [];
  let to = null;
  for (const tok of m[2].split(" ").filter(Boolean)) {
    if (tok.startsWith("to=")) {
      if (to !== null || !isGiftAddress(tok.slice(3))) return null;
      to = tok.slice(3);
    } else {
      if (!LEXICON_SET.has(tok) || words.length >= rules.max_words) return null;
      words.push(tok);
    }
  }
  return { n: Number(m[1]), words, to };
}

export const lotTitle = (n) => `lot/v1 ${lotTag(n)}`;
export const soldTitle = (n, price) => `sold/v1 ${lotTag(n)} ${price > 0 ? price : "shelf"}`;
export const bidTitle = (n, words = [], to = null) => [`bid/v1 ${lotTag(n)}`, ...words, ...(to ? [`to=${to}`] : [])].join(" ");

// ---------------------------------------------------------------- the card

const u32be = (n) => {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n);
  return b;
};

/** blake2b-256(SEED_TAG ‖ genesis ‖ u32be(n) ‖ prev_hash of the block holding lot n's lot/v1 post). */
export function lotSeed(genesis, n, prevHash) {
  return blake2b([utf8(SEED_TAG), hexToBytes(genesis), u32be(n), hexToBytes(prevHash)], 32);
}

/** The card's text: "#N W1 W2 W3", dropping words from the end until it fits 24 bytes; "DAY NNNN" with no words. */
export function cardText(n, words = []) {
  const w = [...words];
  for (;;) {
    const t = w.length ? `#${n} ${w.join(" ")}` : `DAY ${lotTag(n)}`;
    if (utf8(t).length <= 24 && validate({ ...ZERO_FIELDS, text: t }, { contrast: false }).ok) return t;
    w.pop();
  }
}
const ZERO_FIELDS = { body: 0, accessory: 0, head: 0, glasses: 0, background: 0, pattern: 0, font: 0, ink: 0, layout: 0 };

/** recipe_v1 fields for lot n: shapes and colours from the seed (contrast pairs only), text from the words. */
export function cardFields(seed, n, words = []) {
  const pick = (i, field) => seed[i] % (RANGES[field][1] + 1);
  const pair = CONTRAST_PAIRS[((seed[4] << 8) | seed[5]) % CONTRAST_PAIRS.length];
  return {
    body: pick(0, "body"),
    accessory: pick(1, "accessory"),
    head: pick(2, "head"),
    glasses: pick(3, "glasses"),
    background: pair[0],
    pattern: pick(6, "pattern"),
    font: pick(7, "font"),
    ink: pair[1],
    layout: pick(8, "layout"),
    text: cardText(n, words),
  };
}

/** The recipe hex lot n mints with. */
export function recipeHex(genesis, n, prevHash, words = []) {
  return bytesToHex(encodeRecipe(cardFields(lotSeed(genesis, n, prevHash), n, words)));
}

/** The card SVG for a lot view (open lots re-spell with the leader's words). */
export function lotCard(state, n) {
  const lot = state.lots[n - 1];
  if (!lot) return null;
  const words = lot.outcome ? lot.outcome.words : lot.leader !== null ? lot.bids[lot.leader].words : [];
  const fields = cardFields(lotSeed(state.genesis, n, lot.opened.prev), n, words);
  return renderCard(fields, { serial: n });
}

// ---------------------------------------------------------------- the fold

/**
 * A fresh law state. `cfg`: {genesis, auctioneer, faucet, shelf, rules?}.
 * The state is plain JSON (the Worker snapshots it); never mutate it by hand.
 */
export function createLaw({ genesis, auctioneer, faucet, shelf, rules = DAILY_RULES }) {
  for (const [k, v] of Object.entries({ auctioneer, faucet, shelf })) {
    if (!addressKind(v)) throw new Error(`daily law: ${k} must be an address`);
  }
  if (!/^[0-9a-f]{64}$/.test(String(genesis))) throw new Error("daily law: genesis must be 64 hex");
  return {
    law: LAW_VERSION,
    rules: { ...rules },
    genesis,
    auctioneer,
    faucet,
    shelf,
    height: 0,
    ts: 0,
    lots: [],
    owed: [], // unpaid: {to, amount, tx, height, index, due, why, lot, late?}
    refunds: 0, // paid refunds
    refunded: 0, // ATTN refunded
    mints: 0, // serials minted into the edition (by anyone)
    violations: [],
  };
}

const house = (s, a) => a === s.auctioneer || a === s.faucet || a === s.shelf;
const lastLot = (s) => (s.lots.length ? s.lots[s.lots.length - 1] : null);
const isOpen = (lot) => !!lot && lot.closed_height === null;

function violation(s, code, h, detail = {}) {
  s.violations.push({ code, height: h, ...detail });
}

function owe(s, entry) {
  s.owed.push(entry);
}

/** What closing `lot` gives, from its leader (or the Town Shelf with no bids). */
export function outcomeOf(s, lot) {
  const lead = lot.leader === null ? null : lot.bids[lot.leader];
  const words = lead ? lead.words : [];
  return {
    winner: lead ? lead.sender : null,
    price: lead ? lead.amount : 0,
    mint_to: lead ? lead.to || lead.sender : s.shelf,
    words,
    recipe: recipeHex(s.genesis, lot.n, lot.opened.prev, words),
  };
}

function closeLot(s, lot, h) {
  lot.closed_height = h;
  lot.outcome = outcomeOf(s, lot);
}

function settledCheck(s, lot, h) {
  if (lot.settled_height === null && lot.sold && lot.minted && (lot.paid || lot.outcome.price === 0)) {
    lot.settled_height = h;
    // Settled lots keep their bids (history) but drop the per-sender working sets.
    lot.posts = {};
    lot.counts = {};
  }
}

function inflow(s, t, pos) {
  const { h, index, ts, tx } = pos;
  const amount = Number(t.amount);
  const lot = lastLot(s);
  let why = null;
  if (house(s, t.sender)) why = "house_sender";
  else if (!isOpen(lot)) why = lot && lot.closed_height === h ? "after_close" : "no_open_lot";
  // A lot takes bids from the block after its lot/v1 post: a transfer sealed next to the
  // post (often a late bid on the lot before) is never a bid on the new lot.
  else if (h <= lot.opened.height) why = "before_open";
  else if ((lot.counts[t.sender] ?? 0) >= s.rules.max_bids_per_sender) why = "bid_limit";
  else if (amount < minBid(lot.leader === null ? 0 : lot.bids[lot.leader].amount, s.rules)) why = "under_minimum";
  if (why) {
    owe(s, { to: t.sender, amount, tx, height: h, index, due: h + s.rules.refund_blocks, why, lot: lot ? lot.n : null });
    return;
  }
  const post = lot.posts[t.sender] || { words: [], to: null };
  if (lot.leader !== null) {
    const prev = lot.bids[lot.leader];
    owe(s, { to: prev.sender, amount: prev.amount, tx: prev.tx, height: h, index, due: h + s.rules.refund_blocks, why: "outbid", lot: lot.n });
  }
  lot.bids.push({ sender: t.sender, amount, height: h, index, ts, tx, words: post.words, to: post.to });
  lot.leader = lot.bids.length - 1;
  lot.counts[t.sender] = (lot.counts[t.sender] ?? 0) + 1;
  if (ts >= lot.close - s.rules.snipe_ms) {
    lot.close = Math.max(lot.close, Math.min(ts + s.rules.snipe_ms, lot.closes_at + s.rules.snipe_cap_ms));
  }
}

function outflow(s, t, pos) {
  const { h, tx } = pos;
  const amount = Number(t.amount);
  if (t.to === s.faucet) {
    const lot = s.lots.find((l) => l.closed_height !== null && l.outcome.price > 0 && !l.paid);
    if (lot) {
      if (amount !== lot.outcome.price) {
        violation(s, "wrong_payment", h, { lot: lot.n, tx, amount, want: lot.outcome.price });
      }
      lot.paid = { height: h, tx, amount };
      settledCheck(s, lot, h);
      return;
    }
  }
  const i = s.owed.findIndex((o) => o.to === t.to && o.amount === amount);
  if (i < 0) {
    violation(s, "unowed_outflow", h, { tx, to: t.to, amount });
    return;
  }
  const [o] = s.owed.splice(i, 1);
  s.refunds += 1;
  s.refunded += amount;
  if (h > o.due && !o.late) violation(s, "refund_late", h, { tx, of: o.tx, due: o.due, to: o.to, amount });
}

function housePost(s, t, pos) {
  const { h, index, ts, tx, prev } = pos;
  let m;
  if ((m = /^lot\/v1 (\d{4,9})$/.exec(t.title))) {
    const n = Number(m[1]);
    const last = lastLot(s);
    if (n !== s.lots.length + 1 || (last && !last.sold)) {
      violation(s, "lot_out_of_order", h, { tx, n, want: s.lots.length + 1, previous_sold: last ? !!last.sold : null });
      return;
    }
    const closesAt = nextMidnight(ts, s.rules.day_ms);
    s.lots.push({
      n,
      day: utcDay(ts),
      opened: { height: h, index, ts, tx, prev },
      closes_at: closesAt,
      close: closesAt,
      bids: [],
      leader: null,
      counts: {},
      posts: {},
      closed_height: null,
      outcome: null,
      paid: null,
      minted: null,
      sold: null,
      settled_height: null,
      late: false,
    });
    return;
  }
  if ((m = /^sold\/v1 (\d{4,9}) (\S+)$/.exec(t.title))) {
    const lot = s.lots[Number(m[1]) - 1];
    if (!lot || lot.closed_height === null) {
      violation(s, "early_settle", h, { tx, n: Number(m[1]) });
      return;
    }
    if (lot.sold) {
      violation(s, "second_sold", h, { tx, lot: lot.n });
      return;
    }
    const want = soldTitle(lot.n, lot.outcome.price);
    if (t.title !== want) violation(s, "wrong_sold", h, { tx, lot: lot.n, title: t.title, want });
    lot.sold = { height: h, tx };
    settledCheck(s, lot, h);
  }
}

function bidPost(s, t) {
  const lot = lastLot(s);
  if (!isOpen(lot)) return;
  const b = parseBidTitle(t.title, s.rules);
  if (!b || b.n !== lot.n || (b.to && house(s, b.to))) return;
  lot.posts[t.sender] = { words: b.words, to: b.to };
}

function mint(s, t, pos) {
  const { h, tx } = pos;
  s.mints += 1;
  const serial = s.mints;
  if (t.sender !== s.auctioneer) {
    violation(s, "foreign_mint", h, { tx, sender: t.sender, serial });
    return;
  }
  const lot = s.lots.find((l) => l.closed_height !== null && !l.minted);
  if (!lot) {
    violation(s, "unexpected_mint", h, { tx, serial });
    return;
  }
  lot.minted = { height: h, tx, serial, recipient: t.recipient };
  if (serial !== lot.n) violation(s, "wrong_serial", h, { tx, lot: lot.n, serial });
  if (t.recipient !== lot.outcome.mint_to) violation(s, "wrong_recipient", h, { tx, lot: lot.n, recipient: t.recipient, want: lot.outcome.mint_to });
  if (String(t.recipe).toLowerCase() !== lot.outcome.recipe) violation(s, "wrong_recipe", h, { tx, lot: lot.n });
  settledCheck(s, lot, h);
}

/** Fold one block into the state (in place). Heights must arrive in order from 1. */
export function step(s, block) {
  const hd = block && block.header;
  if (!hd || hd.height !== s.height + 1) {
    throw new Error(`daily law: expected block ${s.height + 1}, got ${hd ? hd.height : "none"}`);
  }
  const h = hd.height;
  const ts = Number(hd.timestamp);
  const prev = String(hd.prev_hash);
  // 1. The close: the first block at or past the lot's close (bids in it are late).
  const cur = lastLot(s);
  if (isOpen(cur) && ts >= cur.close) closeLot(s, cur, h);
  // 2. The txs, in block order.
  (block.txs || []).forEach((stx, index) => {
    const t = stx && stx.tx;
    if (!t || typeof t !== "object") return;
    const relevant =
      (t.type === "transfer" && (t.sender === s.auctioneer || t.to === s.auctioneer)) ||
      (t.type === "publish_block" && t.channel === s.rules.channel) ||
      (t.type === "edition_mint" && t.edition === s.rules.edition);
    if (!relevant) return;
    const pos = { h, index, ts, prev, tx: txHash(stx) };
    if (t.type === "transfer") {
      if (t.sender === s.auctioneer) outflow(s, t, pos);
      else inflow(s, t, pos);
    } else if (t.type === "publish_block") {
      if (t.sender === s.auctioneer) housePost(s, t, pos);
      else bidPost(s, t);
    } else {
      mint(s, t, pos);
    }
  });
  // 3. Deadlines, once each.
  for (const o of s.owed) {
    if (!o.late && h > o.due) {
      o.late = true;
      violation(s, "refund_late", h, { of: o.tx, due: o.due, to: o.to, amount: o.amount });
    }
  }
  for (const lot of s.lots) {
    if (lot.closed_height !== null && lot.settled_height === null && !lot.late && h > lot.closed_height + s.rules.settle_blocks) {
      lot.late = true;
      violation(s, "settle_late", h, { lot: lot.n, closed_height: lot.closed_height });
    }
  }
  s.height = h;
  s.ts = ts;
  return s;
}

/** Fold `blocks` (heights 1.. in order) from a fresh state. */
export function fold(cfg, blocks) {
  const s = createLaw(cfg);
  for (const b of blocks) step(s, b);
  return s;
}

/** ATTN the auctioneer should hold now: every unpaid owed inflow plus every unpaid leading bid. */
export function held(s) {
  let n = s.owed.reduce((a, o) => a + o.amount, 0);
  for (const lot of s.lots) {
    if (lot.leader !== null && !lot.paid) n += lot.bids[lot.leader].amount;
  }
  return n;
}

/**
 * The comparable summary: what the Worker serves at GET /daily/law and what
 * audit-daily.mjs computes. Two honest replays of the same blocks give equal
 * reports (deepEqual).
 */
export function report(s) {
  return {
    law: s.law,
    rules: s.rules,
    height: s.height,
    genesis: s.genesis,
    auctioneer: s.auctioneer,
    faucet: s.faucet,
    shelf: s.shelf,
    lots: s.lots.map((l) => ({
      n: l.n,
      day: l.day,
      opened_height: l.opened.height,
      close: l.close,
      bids: l.bids.length,
      closed_height: l.closed_height,
      winner: l.outcome ? l.outcome.winner : null,
      price: l.outcome ? l.outcome.price : null,
      mint_to: l.outcome ? l.outcome.mint_to : null,
      words: l.outcome ? l.outcome.words : null,
      recipe: l.outcome ? l.outcome.recipe : null,
      paid_height: l.paid ? l.paid.height : null,
      minted_height: l.minted ? l.minted.height : null,
      sold_height: l.sold ? l.sold.height : null,
      settled_height: l.settled_height,
    })),
    owed: s.owed.map((o) => ({ to: o.to, amount: o.amount, tx: o.tx, due: o.due, why: o.why })),
    refunds: s.refunds,
    refunded: s.refunded,
    mints: s.mints,
    held: held(s),
    violations: s.violations,
  };
}

/** The open lot's live view, at chain time `now` (unix ms; pass the tip's timestamp for a pure answer). */
export function openLot(s) {
  const lot = lastLot(s);
  if (!isOpen(lot)) return null;
  const lead = lot.leader === null ? null : lot.bids[lot.leader];
  return {
    n: lot.n,
    day: lot.day,
    opens_at: lot.opened.ts,
    closes_at: lot.closes_at,
    close: lot.close,
    leader: lead ? { sender: lead.sender, amount: lead.amount, words: lead.words, to: lead.to, height: lead.height } : null,
    min_bid: minBid(lead ? lead.amount : 0, s.rules),
    bids: lot.bids.length,
  };
}

/** Why a transfer of `amount` from `sender` would not be a valid bid if sealed at `ts` now, or null. */
export function bidRefusal(s, sender, amount, ts) {
  const lot = lastLot(s);
  if (house(s, sender)) return "house accounts do not bid";
  if (!isOpen(lot)) return "no lot is open right now";
  if (ts >= lot.close) return "this lot has closed";
  if ((lot.counts[sender] ?? 0) >= s.rules.max_bids_per_sender) return `at most ${s.rules.max_bids_per_sender} bids per account per lot`;
  const min = minBid(lot.leader === null ? 0 : lot.bids[lot.leader].amount, s.rules);
  if (!Number.isSafeInteger(amount) || amount < min) return `the least valid bid is ${min} play ATTN`;
  return null;
}
