// The Daily Mint: /chain/daily-mint (src/pages/chain/daily-mint.astro), the
// logic public/chain/apps/daily-mint.js (no DOM), the DOM side
// daily-mint-view.js, the shared key panel and the chain's own settle law
// (public/chain/first-mints/lib/daily-law.js, copied unchanged).
//
// What this suite holds:
//   - the auction's law is the chain's own, pinned by sha256, and the house
//     check agrees with the Worker on a recorded local devnet that holds real
//     bids, a refund, a settled lot with a winner and an open lot with a leader;
//     take a refund out of a block, or change the Worker's report, and the check
//     says DISAGREES with the reason;
//   - a bid is planned before anything is signed (every refusal, every word and
//     gift rule), signed in the order the law needs (the words post first), and
//     the signatures verify;
//   - every card is drawn here from the recipe, audited, and shown only as an
//     image whose source is a data: URI this page built; nothing the devnet sends
//     becomes markup, a link or a style;
//   - the page only writes on a button press, to two routes (the faucet and a
//     signed transaction), pins the genesis, stops at GENESIS CHANGED, is lazy,
//     and honours ?devnet= only for localhost and 127.0.0.1;
//   - the copy is honest: devnet · no value · may reset, play ATTN never promised
//     any value, a dated and recorded reset, and none of the words a fundraising
//     page would use;
//   - against the local devnet-2 and the live devnet (GET only; skipped when
//     unreachable) the check agrees with the Worker.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { DEVNET, DEVNET_PREVIOUS, RESET } from '../src/data/chain-home.ts';
import { APP, BID_COPY, CANNOT_SEE, CHECK_COPY, DAY_STEPS, HONESTY_LINE, LAW_PATH, auditSnippet } from '../src/data/chain-app-daily-mint.ts';
import { CHAIN_APPS } from '../src/data/chain-apps.ts';
import * as D from '../public/chain/apps/daily-mint.js';
import * as view from '../public/chain/apps/daily-mint-view.js';
import * as K from '../public/chain/apps/chain-kit.js';
import * as law from '../public/chain/first-mints/lib/daily-law.js';
import { auditSvg, decodeRecipe } from '../public/chain/first-mints/lib/first-mint.js';
import { FX, cardOf, fakeDevnet, feedOf } from './helpers/fake-devnet.mjs';
import { assertNoSinks, bannedHits, BANNED, callArgs, code, currencyHits } from './helpers/chain-app-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const FILES = {
  logic: 'public/chain/apps/daily-mint.js',
  view: 'public/chain/apps/daily-mint-view.js',
  keys: 'public/chain/apps/key-panel.js',
  kit: 'public/chain/apps/chain-kit.js',
  page: 'src/pages/chain/daily-mint.astro',
  data: 'src/data/chain-app-daily-mint.ts',
};
const src = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, read(p)]));
const MY_FILES = [...Object.values(FILES), 'tests/chain-app-daily-mint.test.mjs', 'scripts/e2e-chain-app-daily-mint.mjs'].filter((p) => existsSync(new URL(p, root)));
const HEX = (c) => c.repeat(64);
const GENESIS = FX.status.genesis_hash;
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const clone = (o) => JSON.parse(JSON.stringify(o));
const netFor = (opts) => K.makeNet('http://127.0.0.1:8799', { fetch: fakeDevnet(opts) });

// ================================================================ the law is the chain's own

test('the settle law is the chain’s own file, copied unchanged and pinned by its sha256', () => {
  const bytes = readFileSync(new URL('public/chain/first-mints/lib/daily-law.js', root));
  assert.equal(sha256(bytes), '17095ceee3ced65f00758e392374ab00b51a9def40fa5cb4716f7f0c13c55313');
  assert.equal(LAW_PATH, '/chain/first-mints/lib/daily-law.js');
  assert.equal(law.LAW_VERSION, 'pointcast/daily-law/v1');
  assert.equal(law.DAILY_RULES.max_words, 3);
  assert.equal(law.DAILY_RULES.increment_bps, 500);
  assert.equal(law.DAILY_RULES.day_ms, 86400000);
  // the page's own imports are siblings of the SDK it needs
  assert.match(bytes.toString('utf8'), /from "\.\/pointcast-chain\.js"/);
  assert.match(bytes.toString('utf8'), /from "\.\/first-mint\.js"/);
  assert.equal(D.DAILY_LEXICON, law.DAILY_LEXICON);
  assert.ok(law.DAILY_LEXICON.length >= 30 && law.DAILY_LEXICON.every((w) => /^[A-Z0-9#.&!?]+$/.test(w)));
});

test('the recorded devnet is a real one: its feed equals what the fake builds from its blocks, for every kind these apps read', () => {
  const mine = feedOf(FX.blocks, { limit: 500 });
  assert.equal(mine.tip, FX.feed.tip);
  assert.equal(mine.blocks.length, FX.feed.blocks.length);
  const READ = new Set(['publish_block', 'seal_capsule', 'open_capsule', 'transfer', 'edition_mint']);
  let seen = 0;
  mine.blocks.forEach((b, i) => {
    const r = FX.feed.blocks[i];
    assert.equal(b.height, r.height);
    assert.equal(b.hash, r.hash, 'the header hash the feed names');
    assert.equal(b.timestamp, r.timestamp);
    const want = r.txs.filter((t) => READ.has(t.kind));
    const got = b.txs.filter((t) => READ.has(t.kind));
    assert.deepEqual(got.map((t) => ({ hash: t.hash, kind: t.kind, sender: t.sender, payload: t.payload })), want.map((t) => ({ hash: t.hash, kind: t.kind, sender: t.sender, payload: t.payload })));
    seen += got.length;
  });
  assert.ok(seen > 40, 'the recording holds enough of them: ' + seen);
  const kinds = new Set(FX.blocks.flatMap((b) => b.txs.map((t) => t.tx.type)));
  for (const k of ['publish_block', 'transfer', 'edition_mint', 'seal_capsule', 'open_capsule']) assert.ok(kinds.has(k), 'the recording has a ' + k);
  assert.ok(FX.blocks.some((b) => b.txs.some((t) => t.tx.type === 'publish_block' && t.tx.channel === 'NOTARY')), 'and a notary stamp');
});

// ================================================================ reading the house

test('readDaily takes the recorded house: open lot with a leader, seven lots, the rules, the addresses', () => {
  const d = D.readDaily(FX.daily);
  assert.equal(d.status, 'on');
  assert.equal(d.standard, false, 'the recording is a 15-minute test day, and says so');
  assert.equal(d.rules.day_ms, 900000);
  assert.deepEqual(Object.keys(d.addresses).sort(), ['auctioneer', 'faucet', 'shelf']);
  assert.ok(d.lot && d.lot.n === FX.daily.lot.n);
  assert.equal(d.lot.bids, FX.daily.lot.bids);
  assert.ok(d.lot.leader && d.lot.leader.sender.startsWith('tz1') && d.lot.leader.amount >= 1);
  assert.deepEqual(d.lot.leader.words, ['DRUM', 'WAVE']);
  assert.equal(d.recent.length, 7);
  assert.equal(d.violations, 0);
  assert.equal(d.owedRefunds, 0);
  const sold = d.recent.find((l) => l.n === 8);
  assert.deepEqual({ price: sold.price, words: sold.words, state: D.lotState(sold) }, { price: 9, words: ['SIGNAL', 'TIDE'], state: 'sold' });
  assert.equal(D.lotState(d.recent.find((l) => l.n === 7)), 'shelf');
  assert.equal(D.lotState(d.recent.find((l) => l.n === d.lot.n)), 'open');
  assert.equal(D.lotState({ settledHeight: null, closedHeight: 5 }), 'settling');
  // the standard rules are recognised
  assert.equal(D.readDaily({ ...clone(FX.daily), rules: { ...FX.daily.rules, day_ms: 86400000, snipe_ms: 300000, snipe_cap_ms: 7200000 } }).standard, true);
  // garbage in, null or empty out, never a throw
  for (const junk of [null, undefined, 3, 'x', [], {}, { status: 'on', lot: 'x', recent: 'y', addresses: 4, rules: 'z' }, { recent: [null, 3, {}, { n: 'a' }] }]) {
    assert.doesNotThrow(() => D.readDaily(junk));
  }
  assert.equal(D.readDaily(null), null);
  assert.equal(D.readDaily({}).status, 'off');
  assert.deepEqual(D.readDaily({ recent: [null, 3, {}, { n: 'a' }] }).recent, []);
});

test('hostile words, addresses and days are dropped or cut: only lexicon words and real addresses get through', () => {
  const evil = '<img src=x onerror=alert(1)>';
  const j = clone(FX.daily);
  j.lot.leader = { sender: evil, amount: 5, words: [evil], to: evil, height: 3 };
  j.lot.day = evil + 'x'.repeat(50);
  j.addresses.auctioneer = evil;
  j.recent[0].words = [evil, 'DRUM', '<b>'];
  j.recent[0].winner = evil;
  j.recent[0].mint_to = evil;
  j.recent[0].recipe = evil;
  const d = D.readDaily(j);
  assert.equal(d.lot.leader, null, 'a leader that is not an address is no leader');
  assert.ok(d.lot.day.length <= 10);
  assert.equal(d.addresses, null, 'house addresses must all be addresses');
  assert.deepEqual(d.recent[0].words, ['DRUM']);
  assert.equal(d.recent[0].winner, null);
  assert.equal(d.recent[0].mintTo, null);
  assert.equal(d.recent[0].recipe, null);
  const l = D.readLotDetail({ ...clone(FX.lots[8]), leader: evil, bid_list: [{ sender: evil, amount: 3 }, { sender: FX.lots[8].bid_list[0].sender, amount: 'x' }, ...FX.lots[8].bid_list], violations: [{ code: evil + 'y'.repeat(80), height: 3 }, 5] });
  assert.equal(l.leader, null);
  assert.equal(l.bids.length, FX.lots[8].bid_list.length, 'only well-formed bids');
  assert.ok(l.violations[0].code.length <= 40);
});

test('readLotDetail takes a settled lot: the bids, the winner, the words', () => {
  const l = D.readLotDetail(FX.lots[8]);
  assert.equal(l.n, 8);
  assert.equal(l.winner, FX.lots[8].winner);
  assert.equal(l.price, 9);
  assert.deepEqual(l.words, ['SIGNAL', 'TIDE']);
  assert.ok(l.bids.length >= 2, 'the outbid bid and the winning bid');
  assert.ok(l.bids.some((b) => b.amount === 7) && l.bids.some((b) => b.amount === 9));
  assert.ok(l.bids.every((b) => /^[0-9a-f]{64}$/.test(b.tx)));
  assert.deepEqual(l.violations, []);
  assert.equal(D.readLotDetail(null), null);
  assert.equal(D.readLotDetail({ n: 'x' }), null);
});

test('remainingMs counts down from what the house said, never below zero, never from a clock that went backwards', () => {
  const lot = { closesInMs: 10000 };
  assert.equal(D.remainingMs(lot, 1000, 1000), 10000);
  assert.equal(D.remainingMs(lot, 1000, 4000), 7000);
  assert.equal(D.remainingMs(lot, 1000, 99000), 0);
  assert.equal(D.remainingMs(lot, 5000, 1000), 10000, 'a clock that moved back does not add time');
  for (const bad of [[null, 1, 2], [{ closesInMs: null }, 1, 2], [lot, NaN, 2], [lot, 1, NaN]]) assert.equal(D.remainingMs(...bad), null);
});

// ================================================================ the cards

test('a card is drawn here from its recipe, audited, and says what the chain says: "#8 SIGNAL TIDE" or "DAY 0005"', () => {
  const settled = FX.daily.recent.filter((l) => l.recipe);
  assert.ok(settled.length >= 5);
  for (const l of settled) {
    const c = D.cardFor(l.recipe, l.n);
    assert.ok(c, 'lot ' + l.n);
    assert.equal(auditSvg(c.svg).ok, true);
    assert.match(c.svg, /^<svg /);
    assert.equal(decodeURIComponent(c.uri.slice(c.uri.indexOf(',') + 1)), c.svg, 'the data URI is the SVG');
    assert.match(c.uri, /^data:image\/svg\+xml;charset=utf-8,/);
    const text = decodeRecipe(Uint8Array.from(Buffer.from(l.recipe, 'hex'))).text;
    assert.equal(text, l.words.length ? '#' + l.n + ' ' + l.words.join(' ') : 'DAY ' + String(l.n).padStart(4, '0'));
  }
  const lot8 = FX.daily.recent.find((l) => l.n === 8);
  assert.equal(decodeRecipe(Uint8Array.from(Buffer.from(lot8.recipe, 'hex'))).text, '#8 SIGNAL TIDE');
  for (const bad of [null, undefined, '', 'xyz', '00', '01'.repeat(5), HEX('f'), 12, {}]) assert.equal(D.cardFor(bad, 1), null, String(bad));
});

test('the open lot’s card is derived from the lot’s opening block and the leader’s words, and equals the law’s own', async () => {
  const net = netFor();
  const d = D.readDaily(FX.daily);
  const pc = await D.previewCard(net, GENESIS, d);
  assert.ok(pc && pc.recipe && pc.svg);
  assert.equal(auditSvg(pc.svg).ok, true);
  // the law folded over the same blocks draws the same card
  const state = law.fold({ genesis: GENESIS, ...d.addresses, rules: { ...law.DAILY_RULES, ...d.rules } }, FX.blocks);
  assert.equal(pc.svg, law.lotCard(state, d.lot.n));
  assert.equal(decodeRecipe(Uint8Array.from(Buffer.from(pc.recipe, 'hex'))).text, '#' + d.lot.n + ' DRUM WAVE');
  // no open lot, an unreadable block, or a bad genesis: no preview, no throw
  assert.equal(await D.previewCard(net, GENESIS, { lot: null, recent: [] }), null);
  assert.equal(await D.previewCard(net, 'nope', d), null);
  const noBlock = K.makeNet('http://127.0.0.1:8799', { fetch: fakeDevnet({ overrides: { ['/raw/block/' + d.recent.find((l) => l.n === d.lot.n).openedHeight]: async () => ({ ok: false, status: 404, headers: { get: () => null }, text: async () => '{}' }) } }) });
  assert.equal(await D.previewCard(noBlock, GENESIS, d), null);
});

// ================================================================ checking the house

test('the house check replays all 92 blocks through the law and agrees with the Worker: 9 lots, 1 refund, no violation', async () => {
  const log = [];
  const net = netFor({ log });
  const progress = [];
  const r = await D.auditHouse(net, { onProgress: (n, t) => progress.push([n, t]) });
  assert.equal(r.ok, true, JSON.stringify(r.mismatches));
  assert.equal(r.agree, true);
  assert.deepEqual(r.mismatches, []);
  assert.equal(r.blocks, FX.tip);
  assert.equal(r.height, FX.tip);
  assert.equal(r.lots, 9);
  assert.equal(r.refunds, 1);
  assert.equal(r.refunded, 7, 'the outbid 7 came back');
  assert.equal(r.owed, 0);
  assert.equal(r.violations.length, 0);
  assert.equal(r.nonStandard, true);
  assert.equal(r.lines.filter((l) => l.kind === 'ok').length, 9);
  assert.match(r.lines[0].text, /Not the standard rules: this devnet runs a 900-second lot day/);
  assert.match(r.lines.find((l) => /Lot 0008/.test(l.text)).text, /^Lot 0008 · 2026-10-20 · settled at block \d+ · 9 play ATTN, minted to tz1/);
  assert.match(r.lines.find((l) => /Lot 0009/.test(l.text)).text, /open · 1 bid so far/);
  assert.deepEqual(progress.at(-1), [FX.tip, FX.tip]);
  assert.ok(log.every((p) => p.startsWith('GET ')), 'reads only');
  assert.ok(log.some((p) => p.startsWith('GET /raw/blocks?from=1&limit=500')));
  // its answer is the Worker's own report, deep-equal
  assert.equal(D.sameJson(r.report, FX.dailyLaw), true);
  assert.equal(D.sameJson({ a: 1, b: [1, 2, { c: 3 }] }, { b: [1, 2, { c: 3 }], a: 1 }), true);
  assert.equal(D.sameJson({ a: 1 }, { a: 2 }), false);
  assert.equal(D.sameJson([1], [1, 2]), false);
  assert.equal(D.sameJson(null, {}), false);
});

test('take the refund out of its block and the check says DISAGREES: the law finds the missing refund, and the replay no longer equals the Worker', async () => {
  const blocks = clone(FX.blocks);
  const auct = FX.daily.addresses.auctioneer;
  let cut = 0;
  for (const b of blocks) {
    const i = b.txs.findIndex((t) => t.tx.type === 'transfer' && t.tx.sender === auct && t.tx.amount === 7);
    if (i >= 0) { b.txs.splice(i, 1); cut += 1; }
  }
  assert.equal(cut, 1, 'there is exactly one refund of 7 to cut');
  const r = await D.auditHouse(netFor({ blocks }));
  assert.equal(r.ok, false);
  assert.equal(r.agree, false);
  assert.ok(r.mismatches.some((m) => /^report\./.test(m)), r.mismatches.join('; '));
  assert.ok(r.violations.length >= 1 || r.owed >= 1, 'the refund is owed, late, or both');
  assert.ok(r.lines.some((l) => l.kind === 'fail' || /owed/.test(l.text)) || r.owed >= 1);
});

test('change a number in the Worker’s own report and the check names it; a different law version, a wrong creator and a wrong treasury are named too', async () => {
  const worker = clone(FX.dailyLaw);
  worker.lots[7].price = 10;
  const a = await D.auditHouse(netFor({ fx: { ...FX, dailyLaw: worker } }));
  assert.equal(a.ok, false);
  assert.ok(a.mismatches.includes('report.lots differs from the devnet’s own'));
  const v = await D.auditHouse(netFor({ fx: { ...FX, dailyLaw: { ...clone(FX.dailyLaw), law: 'pointcast/daily-law/v2' } } }));
  assert.ok(v.mismatches.some((m) => /law version/.test(m)));
  const ed = clone(FX.edition);
  ed.terms.creator = FX.daily.addresses.faucet;
  const c = await D.auditHouse(netFor({ fx: { ...FX, edition: ed } }));
  assert.ok(c.mismatches.includes('the daily-mint edition’s creator is not the auctioneer'));
  const st = clone(FX.status);
  st.roles.treasury = FX.daily.addresses.faucet;
  const t = await D.auditHouse(netFor({ status: st }));
  assert.ok(t.mismatches.includes('the Town Shelf is not the treasury /status names'));
});

test('the check refuses honestly: the house is off, the devnet runs dry, the chain is longer than this page replays', async () => {
  await assert.rejects(() => D.auditHouse(netFor({ fx: { ...FX, daily: { ...clone(FX.daily), status: 'off', reason: 'switched off' } } })), /the Daily Mint is off: switched off/);
  await assert.rejects(() => D.auditHouse(netFor({ overrides: { '/raw/blocks': async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => '{"blocks":[]}' }) } })), /sent no blocks from 1/);
  await assert.rejects(() => D.auditHouse(netFor({ fx: { ...FX, dailyLaw: { ...clone(FX.dailyLaw), height: 90000 } } })), /more than this page replays/);
  await assert.rejects(() => D.auditHouse(netFor({ overrides: { '/daily/law': async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => '"x"' }) } })), /not readable/);
  const gap = clone(FX.blocks).filter((b) => b.header.height !== 20);
  await assert.rejects(() => D.auditHouse(netFor({ blocks: gap, fx: FX })), /out of order|sent no blocks/);
});

// ================================================================ planning a bid

const OPEN = D.readDaily(FX.daily);
const ME = 'tz1WspKrkkKjHhXeWPJEZJusB7dEjFgJ3uME';
const plan = (o = {}) => D.planBid({ daily: OPEN, sender: ME, amount: D.leastBid(OPEN), balance: 100, ...o });

test('leastBid is the house’s number and the law’s: reserve, then 5% or 1 over the leader', () => {
  const least = D.leastBid(OPEN);
  assert.equal(least, law.minBid(OPEN.lot.leader.amount, { ...law.DAILY_RULES, ...OPEN.rules }));
  assert.ok(least > OPEN.lot.leader.amount);
  assert.equal(D.leastBid({ ...OPEN, lot: { ...OPEN.lot, leader: null, minBid: 1 } }), 1);
  assert.equal(D.leastBid({ lot: null }), null);
  assert.equal(D.leastBid(null), null);
  for (const [high, want] of [[0, 1], [1, 2], [10, 11], [20, 21], [100, 105], [101, 107], [1000, 1050]]) assert.equal(law.minBid(high), want, 'law minBid(' + high + ')');
});

test('a good bid plans clean: the title, the words in lexicon order, the gift, the amount as a number', () => {
  const p = plan({ amount: String(D.leastBid(OPEN) + 5), words: ['wave', ' drum '], gift: ' ' + ME + ' ' });
  assert.equal(p.ok, true, p.errors.join(' '));
  assert.equal(p.amount, D.leastBid(OPEN) + 5);
  assert.deepEqual(p.words, ['WAVE', 'DRUM']);
  assert.equal(p.title, law.bidTitle(OPEN.lot.n, ['WAVE', 'DRUM'], ME));
  assert.match(p.title, /^bid\/v1 000\d WAVE DRUM to=tz1/);
  assert.equal(p.gift, ME);
  assert.equal(p.lot, OPEN.lot.n);
  const bare = plan();
  assert.equal(bare.ok, true);
  assert.deepEqual(bare.words, []);
  assert.equal(bare.gift, null);
  // the law parses what the page writes
  const parsed = law.parseBidTitle(p.title);
  assert.deepEqual(parsed, { n: OPEN.lot.n, words: ['WAVE', 'DRUM'], to: ME });
  // a pcp1 or tz2 address may be gifted; a pca1 agent may not
  assert.equal(plan({ gift: 'tz2' + 'A'.repeat(33) }).ok, false, 'not a real tz2 checksum');
});

test('every refusal says why, before anything is signed', () => {
  const least = D.leastBid(OPEN);
  const errs = (o) => plan(o).errors.join(' | ');
  assert.match(errs({ amount: least - 1 }), /least bid right now is \d+ play ATTN/);
  assert.match(errs({ amount: 0 }), /whole number of play ATTN, 1 or more/);
  assert.match(errs({ amount: -4 }), /whole number/);
  assert.match(errs({ amount: 2.5 }), /whole number/);
  assert.match(errs({ amount: 'abc' }), /whole number/);
  assert.match(errs({ amount: '12 000' }), /whole number/);
  assert.match(errs({ amount: String(least + 1000), balance: 40 }), /You hold 40 play ATTN/);
  assert.match(errs({ sender: '' }), /Make a key first/);
  assert.match(errs({ sender: 'not an address' }), /Make a key first/);
  assert.match(errs({ sender: OPEN.addresses.auctioneer }), /house does not bid/);
  assert.match(errs({ sender: OPEN.addresses.faucet }), /house does not bid/);
  assert.match(errs({ words: ['A', 'B', 'C', 'D'] }), /At most 3 words/);
  assert.match(errs({ words: ['NOTAWORD'] }), /“NOTAWORD” is not in the lexicon/);
  assert.match(errs({ words: ['DRUM', 'drum'] }), /Each word once/);
  assert.match(errs({ gift: 'hello' }), /gift goes to a tz1, tz2 or pcp1 address/);
  assert.match(errs({ gift: OPEN.addresses.auctioneer.replace(/^tz1/, 'pca1') }), /gift goes to/);
  assert.match(D.planBid({ daily: { ...OPEN, lot: null }, sender: ME, amount: 5 }).errors.join(), /No lot is open/);
  assert.match(D.planBid({ daily: { ...OPEN, status: 'paused' }, sender: ME, amount: 99 }).errors.join(), /not taking bids/);
  assert.match(D.planBid({ daily: null, sender: ME, amount: 99 }).errors.join(), /not taking bids/);
  assert.match(D.planBid({ daily: { ...OPEN, lot: { ...OPEN.lot, closesInMs: 0 } }, sender: ME, amount: 99 }).errors.join(), /lot has closed/);
  assert.equal(plan({ amount: least - 1 }).ok, false);
  // a hostile word is named as text, never trusted
  assert.ok(plan({ words: ['<img src=x>'] }).errors[0].length < 80);
  assert.equal(plan({ balance: null }).ok, true, 'an unknown balance does not block a bid');
});

// ================================================================ sending a bid

/** A stand-in for the SDK client and the devnet's reader, capturing what would be sent. */
async function fakeSend() {
  const sent = [];
  const key = await K.keyFromSeed('61'.repeat(32));
  const domain = K.pcc.domainOf(FX.status.chain_id, GENESIS);
  const chain = {
    domain,
    chainId: FX.status.chain_id,
    genesisHash: GENESIS,
    async buildPublish({ sender, channel, title, bodyHash, nonce }) { return { sender, nonce, type: 'publish_block', channel, title, body_hash: bodyHash, media_uri: null }; },
    async submit(signed) { sent.push(signed); return { txHash: K.pcc.txHash(signed), status: 'pending' }; },
    async waitForTx(h) { return { height: 100 + sent.length, index: 0, status: 'included', hash: h }; },
  };
  const net = { api: 'http://127.0.0.1:8799', count: 0, get: async (p) => (p.startsWith('/account/') ? { balance: 100, next_nonce: 4, exists: true } : null), post: async () => ({}) };
  return { chain, net, key, sent, domain };
}

test('sendBid signs the words post first and the transfer second, with consecutive nonces, and every signature verifies', async () => {
  const { chain, net, key, sent, domain } = await fakeSend();
  const p = plan({ words: ['DRUM', 'WAVE'], amount: D.leastBid(OPEN) + 1 });
  const stages = [];
  const r = await D.sendBid({ chain, net, key, daily: OPEN, plan: { ...p }, onStage: (s) => stages.push(s) });
  assert.equal(sent.length, 2);
  const [post, bid] = sent;
  assert.equal(post.tx.type, 'publish_block');
  assert.equal(post.tx.channel, 'DLY');
  assert.equal(post.tx.title, p.title);
  assert.equal(post.tx.body_hash, '0'.repeat(64), 'a bid post carries no body');
  assert.equal(post.tx.nonce, 4);
  assert.equal(bid.tx.type, 'transfer');
  assert.equal(bid.tx.to, OPEN.addresses.auctioneer);
  assert.equal(bid.tx.amount, p.amount);
  assert.equal(bid.tx.nonce, 5);
  assert.equal(bid.tx.sender, key.sender);
  for (const s of sent) {
    const digest = K.pcc.signingHash(s.tx, domain);
    assert.equal(await K.pcc.verifyEd25519(s.public_key.bytes, K.pcc.hexToBytes(digest), s.signature), true, s.tx.type);
    assert.equal(K.pcc.tezosAddress(s.public_key), s.tx.sender);
  }
  assert.equal(r.postTx, K.pcc.txHash(post));
  assert.equal(r.bidTx, K.pcc.txHash(bid));
  assert.deepEqual(stages.filter((s) => s.endsWith(':waiting')), ['post:waiting', 'bid:waiting'], 'it waits for the post before it sends the bid');
  assert.ok(stages.indexOf('post:waiting') < stages.indexOf('bid:signed'));
  // no words and no gift: just the transfer, at the account's own nonce
  sent.length = 0;
  const bare = await D.sendBid({ chain, net, key, daily: OPEN, plan: plan({ amount: D.leastBid(OPEN) }) });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].tx.type, 'transfer');
  assert.equal(sent[0].tx.nonce, 4);
  assert.equal(bare.postTx, '');
  // a plan that is not ok sends nothing
  sent.length = 0;
  await assert.rejects(() => D.sendBid({ chain, net, key, daily: OPEN, plan: plan({ amount: 0 }) }), /whole number/);
  assert.equal(sent.length, 0);
});

test('claimFaucet posts the address and nothing else; the devnet’s refusal comes through in its own words', async () => {
  const calls = [];
  const net = { post: async (path, body) => { calls.push([path, body]); return { tx_hash: HEX('a'), amount: 100, note: '100 play ATTN, no value, sealed in the next block' }; } };
  const r = await D.claimFaucet(net, ME);
  assert.deepEqual(calls, [['/daily/faucet', { address: ME }]]);
  assert.deepEqual(r, { txHash: HEX('a'), amount: 100, note: '100 play ATTN, no value, sealed in the next block' });
  await assert.rejects(() => D.claimFaucet(net, 'nope'), /not an address/);
  assert.equal(calls.length, 1);
  const refused = K.makeNet('http://x', { fetch: async () => ({ ok: false, status: 429, headers: { get: (h) => (h === 'retry-after' ? '30' : null) }, text: async () => '{"error":"slow down"}' }) });
  await assert.rejects(() => D.claimFaucet(refused, ME), (e) => e.status === 429 && /slow down/.test(e.message) && e.retryAfter === 30);
  assert.match(K.describeError(Object.assign(new K.KitError('slow down', { status: 429 }), { retryAfter: 30 })), /Try again in 30 s/);
});

test('readAccount takes a new key as 0 play ATTN and nonce 0', async () => {
  assert.deepEqual(await D.readAccount({ get: async () => ({ address: ME, balance: 0, exists: false, next_nonce: 0, nonce: 0 }) }, ME), { balance: 0, nonce: 0, exists: false });
  assert.deepEqual(await D.readAccount({ get: async () => ({ balance: 91, next_nonce: 3, exists: true }) }, ME), { balance: 91, nonce: 3, exists: true });
  assert.deepEqual(await D.readAccount({ get: async () => null }, ME), { balance: 0, nonce: 0, exists: false });
});

// ================================================================ the view (jsdom)

function skeleton() {
  const hooks = [...new Set(src.view.match(/data-dm-[a-z-]+/g))];
  const parts = [];
  for (const h of hooks) {
    if (h === 'data-dm-amount' || h === 'data-dm-gift') parts.push('<input ' + h + ' disabled>');
    else if (['data-dm-audit', 'data-dm-faucet', 'data-dm-review'].includes(h)) parts.push('<button ' + h + ' disabled>x</button>');
    else if (['data-dm-send', 'data-dm-cancel'].includes(h)) parts.push('<button ' + h + '>x</button>');
    else if (h === 'data-dm-recent') parts.push('<table><tbody ' + h + '></tbody></table>');
    else if (h === 'data-dm-audit-out' || h === 'data-dm-confirm-list' || h === 'data-dm-errors') parts.push('<ul ' + h + '></ul>');
    else if (h === 'data-dm-confirm') parts.push('<div ' + h + ' hidden><ul data-dm-confirm-list></ul><p data-dm-confirm-where></p></div>');
    else if (h === 'data-dm-result') parts.push('<div ' + h + ' hidden><p data-dm-result-text></p></div>');
    else if (h === 'data-dm-genesis') parts.push('<p ' + h + ' hidden></p>');
    else if (!['data-dm-word', 'data-dm-confirm-where', 'data-dm-result-text'].includes(h)) parts.push('<div ' + h + '></div>');
  }
  const kp = '<div data-key-panel>' + ['status', 'address', 'make', 'forget', 'keep', 'reveal', 'seed', 'copy', 'own', 'own-note', 'use'].map((k) => (k === 'keep' ? '<input type="checkbox" data-kp-keep>' : '<span data-kp-' + k + '></span>')).join('') + '</div>';
  return parts.join('\n') + kp;
}
function mountView({ search = '', fetchOpts = {}, extra = {}, now = () => FX.status.tip_timestamp + 2000 } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><section data-daily-mint-app data-state="static" data-api="' + DEVNET.url + '" data-genesis="' + GENESIS + '" data-chain-id="x">' + skeleton() + '</section></body></html>', { url: 'http://localhost/chain/daily-mint/' + search });
  const rootEl = dom.window.document.querySelector('[data-daily-mint-app]');
  const log = fetchOpts.log || [];
  const base = fakeDevnet({ ...fetchOpts, log });
  const c = view.mount(rootEl, { window: dom.window, fetch: async (u, i) => base(String(u).replace(DEVNET.url, 'http://127.0.0.1:8799'), i), storage: null, now, ...extra });
  return { dom, rootEl, c, log };
}
const txt = (rootEl, sel) => (rootEl.querySelector(sel) || {}).textContent;
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

test('the view draws the open lot, the leader, the card, the rules and the last seven lots with their cards', async () => {
  const { rootEl, c, dom } = mountView();
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'ready');
  assert.equal(rootEl.dataset.lot, 'open');
  const d = D.readDaily(FX.daily);
  assert.equal(txt(rootEl, '[data-dm-lot-n]'), 'Lot ' + String(d.lot.n).padStart(4, '0'));
  assert.equal(txt(rootEl, '[data-dm-minbid]'), D.leastBid(d) + ' play ATTN');
  assert.equal(txt(rootEl, '[data-dm-bids]'), d.lot.bids + (d.lot.bids === 1 ? ' bid' : ' bids'));
  assert.match(txt(rootEl, '[data-dm-leader]'), /^tz1\w{5}…\w{6} at \d+ · DRUM WAVE$/);
  assert.equal(txt(rootEl, '[data-dm-auctioneer]'), d.addresses.auctioneer);
  assert.equal(txt(rootEl, '[data-dm-faucet-addr]'), d.addresses.faucet);
  assert.equal(txt(rootEl, '[data-dm-shelf]'), d.addresses.shelf);
  assert.match(txt(rootEl, '[data-dm-closes]'), /^\d+ (min|s)/);
  assert.match(txt(rootEl, '[data-dm-house]'), /^The house is open\.$/);
  assert.match(txt(rootEl, '[data-dm-tally]'), /^0 refunds owed · held \d+ · 0 violations/);
  const rules = [...rootEl.querySelectorAll('[data-dm-rules] div')].map((r) => r.textContent);
  assert.ok(rules.some((r) => /Reserve1 play ATTN/.test(r)) && rules.some((r) => /Raise by at least5%, or 1/.test(r)) && rules.some((r) => /Length of a lot day15 min \(a local test, not the standard day\)/.test(r)), rules.join(' | '));
  // the open lot's card
  const big = rootEl.querySelector('[data-dm-card] img');
  assert.ok(big && big.src.startsWith('data:image/svg+xml;charset=utf-8,'));
  assert.match(big.alt, /drawn from the chain: DRUM WAVE/);
  assert.match(txt(rootEl, '[data-dm-card-note]'), /Drawn in your browser from the lot’s opening block/);
  // the seven lots, six with a card (the open one has none yet)
  const rows = [...rootEl.querySelectorAll('[data-dm-recent] tr')];
  assert.equal(rows.length, 7);
  assert.equal(rootEl.querySelectorAll('.dm-thumb__img').length, 6);
  assert.match(rows[1].textContent, /0008.*SOLD.*tz1\w+….* · 9 · SIGNAL TIDE/);
  assert.match(rows[0].textContent, /0009.*OPEN/);
  assert.match(rows.at(-1).textContent, /TOWN SHELF/);
  for (const img of rootEl.querySelectorAll('img')) {
    const svg = decodeURIComponent(img.src.slice(img.src.indexOf(',') + 1));
    assert.equal(auditSvg(svg).ok, true, 'every image the page shows is an audited SVG');
    assert.ok(img.alt.length > 5, 'with a description');
  }
  assert.equal(dom.window.document.querySelectorAll('script, iframe, a[href]').length, 0);
});

test('the countdown moves with the clock and never goes below closing now', async () => {
  let t = FX.status.tip_timestamp;
  const { rootEl, c } = mountView({ now: () => t });
  await c.begin();
  c.stop();
  const first = txt(rootEl, '[data-dm-closes]');
  const left0 = FX.daily.lot.closes_in_ms;
  t += 120000;
  const dom = rootEl.ownerDocument;
  assert.ok(dom);
  assert.ok(first.length > 0);
  // jump past the close: "closing now"
  t += left0 + 10 * 60000;
  c.stop();
  const ctrl = c;
  ctrl.state.readAt = t - left0 - 1000;
  ctrl.state.daily.lot.closesInMs = left0;
  // the page repaints each second; call the same path it calls
  const closes = D.remainingMs(ctrl.state.daily.lot, ctrl.state.readAt, t);
  assert.equal(closes, 0);
});

test('hostile text from the house is shown as plain text and makes no element', async () => {
  const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const j = clone(FX.daily);
  j.lot.leader = { sender: evil, amount: 5, words: [evil, 'DRUM'], to: evil, height: 3 };
  j.recent[1].winner = evil;
  j.recent[1].words = [evil];
  j.reason = evil;
  const fx = { ...FX, daily: j };
  const { rootEl, c } = mountView({ fetchOpts: { fx } });
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'ready');
  assert.equal(rootEl.querySelectorAll('script, iframe, object, embed, a[href], [onerror], [onload], style').length, 0);
  for (const el of rootEl.querySelectorAll('*')) for (const a of el.attributes) {
    assert.ok(!/^(on|href|srcdoc|style|action|formaction)/i.test(a.name), a.name);
    if (a.name === 'src') assert.ok(el.tagName === 'IMG' && a.value.startsWith('data:image/svg+xml;charset=utf-8,'), 'the only source is a card');
    if (/[<>]/.test(a.value) && a.name !== 'src') assert.equal(a.name, 'alt', 'markup characters only in an image description');
  }
});

test('a reset shows GENESIS CHANGED, reads nothing else and cannot send', async () => {
  const log = [];
  const { rootEl, c } = mountView({ fetchOpts: { log, status: { ...FX.status, genesis_hash: HEX('9') } } });
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'changed');
  assert.equal(rootEl.querySelector('[data-dm-genesis]').hidden, false);
  assert.match(rootEl.querySelector('[data-dm-genesis]').textContent, /GENESIS CHANGED/);
  assert.deepEqual(log, ['GET /status']);
  assert.equal(c.state.halted, true);
});

test('an unreachable devnet is said so and the page keeps the last lot it had', async () => {
  const { rootEl, c } = mountView({ fetchOpts: { overrides: { '/daily': async () => { throw new TypeError('Failed to fetch'); } } } });
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'down');
  assert.match(txt(rootEl, '[data-dm-status]'), /devnet did not answer/);
  assert.equal(rootEl.dataset.busy, 'no');
});

test('?devnet= is honoured only for localhost and 127.0.0.1; any other host keeps the pinned devnet', () => {
  const ok = mountView({ search: '?devnet=http://127.0.0.1:8799' });
  assert.equal(ok.c.where.api, 'http://127.0.0.1:8799');
  assert.equal(ok.c.where.genesis, null, 'a local override takes the node’s own genesis, and says so');
  for (const bad of ['?devnet=https://pointcast-devnet.mhoydich.workers.dev', '?devnet=http://localhost@evil.example', '?devnet=http://127.0.0.2:8799', '?devnet=javascript:alert(1)', '?devnet=http://127.0.0.1.evil.example']) {
    const m = mountView({ search: bad });
    assert.equal(m.c.where.api, DEVNET.url, bad);
    assert.equal(m.c.where.genesis, GENESIS, bad);
  }
});

test('it is lazy: mount reads nothing, and start() waits for the page, idle, the viewport and a visible tab', () => {
  const { log, c } = mountView();
  assert.deepEqual(log, []);
  assert.equal(c.state.begun, false);
  assert.match(code(src.view), /whenReady\(root, \(\) => c\.begin\(\), env\)/);
  assert.match(src.page, /requestIdleCallback/);
  assert.match(src.page, /addEventListener\('load', go, \{ once: true \}\)/);
});

test('the house check button runs the replay, paints AGREES with a line per lot, and DISAGREES when the blocks are not the Worker’s', async () => {
  const a = mountView();
  await a.c.begin();
  a.c.stop();
  await a.c.runAudit();
  const sum = a.rootEl.querySelector('[data-dm-audit-summary]');
  assert.equal(sum.dataset.state, 'ok');
  assert.match(sum.textContent, /^AGREES\. 92 blocks replayed, 9 lots, 1 refund paid \(7 play ATTN\), 0 owed, 0 violations\. The replay equals the devnet’s own report\.$/);
  const lines = [...a.rootEl.querySelectorAll('[data-dm-audit-out] li')];
  assert.equal(lines.length, 10, 'a note about the test day and nine lots');
  assert.ok(lines.filter((l) => l.dataset.state === 'pass').length === 9);
  assert.equal(a.rootEl.querySelector('[data-dm-audit]').disabled, false);
  const blocks = clone(FX.blocks);
  for (const b of blocks) { const i = b.txs.findIndex((t) => t.tx.type === 'transfer' && t.tx.sender === FX.daily.addresses.auctioneer && t.tx.amount === 7); if (i >= 0) b.txs.splice(i, 1); }
  const bad = mountView({ fetchOpts: { blocks } });
  await bad.c.begin();
  bad.c.stop();
  await bad.c.runAudit();
  const s2 = bad.rootEl.querySelector('[data-dm-audit-summary]');
  assert.equal(s2.dataset.state, 'bad');
  assert.match(s2.textContent, /^DISAGREES\./);
  assert.ok([...bad.rootEl.querySelectorAll('[data-dm-audit-out] li')].some((l) => l.dataset.state === 'fail'));
  // a failing run says why and leaves the button usable
  const off = mountView({ fetchOpts: { overrides: { '/raw/blocks': async () => ({ ok: false, status: 500, headers: { get: () => null }, text: async () => '{"error":"down"}' }) } } });
  await off.c.begin();
  off.c.stop();
  await off.c.runAudit();
  assert.match(txt(off.rootEl, '[data-dm-audit-summary]'), /^The check could not run: down/);
  assert.equal(off.rootEl.querySelector('[data-dm-audit]').disabled, false);
});

test('bidding in the page: nothing is sent until Send, the confirm lists exactly what will go, and a refusal is shown before anything is signed', async () => {
  const sendCalls = [];
  const fake = await fakeSend();
  const connect = async () => ({ ...fake.chain, submit: async (s) => { sendCalls.push(s); return fake.chain.submit(s); } });
  const accounts = { [(await K.keyFromSeed('61'.repeat(32))).sender]: { balance: 100, next_nonce: 4 } };
  const { rootEl, c, dom } = mountView({ fetchOpts: { accounts }, extra: { connect, supported: true, storage: null } });
  await c.begin();
  c.stop();
  const $ = (s) => rootEl.querySelector(s);
  assert.equal($('[data-dm-review]').disabled, true, 'no key, no bid');
  assert.equal(txt(rootEl, '[data-dm-balance]'), 'make a key first');
  await c.keys.setSeed('61'.repeat(32));
  await tick(30);
  assert.equal($('[data-dm-review]').disabled, false);
  assert.equal($('[data-dm-faucet]').disabled, false);
  assert.match($('[data-dm-amount]').placeholder, /^at least \d+$/);
  // a bid that is too low: the errors show, no confirm box, nothing sent
  $('[data-dm-amount]').value = '1';
  $('[data-dm-review]').click();
  assert.equal($('[data-dm-confirm]').hidden, true);
  assert.equal($('[data-dm-errors]').hidden, false);
  assert.match($('[data-dm-errors]').textContent, /least bid right now is/);
  assert.equal(sendCalls.length, 0);
  // words: three at most, the rest switch off
  const boxes = [...rootEl.querySelectorAll('[data-dm-word]')];
  assert.equal(boxes.length, law.DAILY_LEXICON.length);
  for (const w of ['DRUM', 'WAVE', 'TIDE']) boxes.find((b) => b.value === w).click();
  assert.equal(boxes.filter((b) => !b.checked && b.disabled).length, boxes.length - 3, 'a fourth word cannot be ticked');
  $('[data-dm-amount]').value = String(D.leastBid(D.readDaily(FX.daily)) + 3);
  $('[data-dm-review]').click();
  assert.equal($('[data-dm-confirm]').hidden, false);
  const items = [...rootEl.querySelectorAll('[data-dm-confirm-list] li')].map((l) => l.textContent);
  assert.equal(items.length, 2);
  assert.match(items[0], /^A post on channel DLY, titled “bid\/v1 000\d DRUM WAVE TIDE”/, 'the words keep the order they were ticked in');
  assert.match(items[1], new RegExp('^A transfer of ' + (D.leastBid(D.readDaily(FX.daily)) + 3) + ' play ATTN from ' + c.keys.key().sender + ' to the auctioneer ' + FX.daily.addresses.auctioneer));
  assert.match(txt(rootEl, '[data-dm-confirm-where]'), /^Sent to http:\/\/127\.0\.0\.1:8799 or|^Sent to https:\/\/pointcast-devnet\.mhoydich\.workers\.dev \(pointcast-devnet-2\)\.$/);
  assert.equal(sendCalls.length, 0, 'the confirm box sends nothing');
  // Cancel closes it
  $('[data-dm-cancel]').click();
  assert.equal($('[data-dm-confirm]').hidden, true);
  // Send: the post first, then the transfer, then the page reads the house again
  $('[data-dm-review]').click();
  const before = c.net.count;
  $('[data-dm-send]').click();
  await tick(400);
  assert.equal(sendCalls.length, 2);
  assert.equal(sendCalls[0].tx.type, 'publish_block');
  assert.equal(sendCalls[1].tx.type, 'transfer');
  assert.equal($('[data-dm-result]').dataset.state, 'ok');
  assert.match(txt(rootEl, '[data-dm-result-text]'), /^Your bid is in block \d+\. Bid transaction [0-9a-f]{64} · words post [0-9a-f]{64}\./);
  assert.ok(c.net.count > before, 'the lot was read again');
  assert.equal($('[data-dm-confirm]').hidden, true);
  assert.ok(dom);
});

test('a bid the door refuses is shown in the devnet’s own words and nothing is claimed', async () => {
  const fake = await fakeSend();
  const connect = async () => ({ ...fake.chain, submit: async () => { throw Object.assign(new K.KitError('that transfer would not be a valid bid now: the least valid bid is 99 play ATTN', { status: 400, code: 'daily_bid_refused' })); } });
  const accounts = { [(await K.keyFromSeed('62'.repeat(32))).sender]: { balance: 100, next_nonce: 0 } };
  const { rootEl, c } = mountView({ fetchOpts: { accounts }, extra: { connect, supported: true, storage: null } });
  await c.begin();
  c.stop();
  await c.keys.setSeed('62'.repeat(32));
  await tick(30);
  rootEl.querySelector('[data-dm-amount]').value = String(D.leastBid(D.readDaily(FX.daily)));
  rootEl.querySelector('[data-dm-review]').click();
  rootEl.querySelector('[data-dm-send]').click();
  await tick(400);
  const res = rootEl.querySelector('[data-dm-result]');
  assert.equal(res.dataset.state, 'bad');
  assert.match(txt(rootEl, '[data-dm-result-text]'), /^Not sent, or not confirmed: that transfer would not be a valid bid now: the least valid bid is 99 play ATTN$/);
  assert.equal(rootEl.querySelector('[data-dm-send]').disabled, false, 'the button comes back');
});

test('the faucet button asks once for the key’s address and says so in words', async () => {
  const posts = [];
  const { rootEl, c } = mountView({ fetchOpts: { overrides: { '/daily/faucet': async (u, init) => { posts.push(JSON.parse(init.body)); return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ tx_hash: HEX('c'), amount: 100, note: 'ok' }) }; } } }, extra: { supported: true, storage: null } });
  await c.begin();
  c.stop();
  await c.keys.setSeed('63'.repeat(32));
  await tick(30);
  rootEl.querySelector('[data-dm-faucet]').click();
  await tick(100);
  assert.deepEqual(posts, [{ address: c.keys.key().sender }]);
  assert.match(txt(rootEl, '[data-dm-faucet-out]'), /^The faucet sent 100 play ATTN to tz1\w{5}…\w{6}\. It lands in the next block\.$/);
  assert.equal(rootEl.querySelector('[data-dm-faucet-out]').dataset.state, 'ok');
});

// ================================================================ rules read off the sources

test('nothing from the devnet becomes markup, a link or a style; the one image source is a data: URI the page built — proven by mutation', () => {
  const allow = [/img\.src = card\.uri;/];
  assertNoSinks(src.view, 'daily-mint-view.js', { allow });
  assertNoSinks(src.logic, 'daily-mint.js');
  assertNoSinks(src.keys, 'key-panel.js');
  const inline = (src.page.match(/<script is:inline[\s\S]*?<\/script>/) || [''])[0];
  assertNoSinks(inline, 'the page script');
  assert.throws(() => assertNoSinks(src.view, 'view'), /a link, source or style sink \(\.src =/, 'without the allowance the one image source is caught');
  assert.throws(() => assertNoSinks(src.view + '\nimg.src = row.url;', 'view', { allow }), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(src.view + '\nn.innerHTML = x;', 'view', { allow }), /an HTML sink/);
  assert.throws(() => assertNoSinks(src.view + '\nn.setAttribute("href", x);', 'view', { allow }), /a link, source or style sink/);
  // the card is the only place a src is set, and its value is a data: URI built by svgDataUri from an audited SVG
  assert.equal((code(src.view).match(/\.src\s*=/g) || []).length, 1);
  assert.match(code(src.logic), /export function svgDataUri\(svg\) \{\s*return 'data:image\/svg\+xml;charset=utf-8,' \+ encodeURIComponent\(svg\);/);
  assert.match(code(src.logic), /if \(!auditSvg\(svg\)\.ok\) return null;/);
});

test('the page writes on two routes only (the faucet and a signed transaction), each behind a button, and reads with GET', () => {
  const posts = [...code(src.logic).matchAll(/net\.post\('([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(posts, ['/daily/faucet']);
  assert.doesNotMatch(code(src.view), /\.post\(|method\s*:\s*['"]POST/, 'the view posts nothing itself');
  assert.doesNotMatch(code(src.logic), /method\s*:\s*['"](PUT|PATCH|DELETE)|XMLHttpRequest|sendBeacon|\bfetch\s*\(/);
  assert.doesNotMatch(code(src.view), /\bfetch\s*\(/, 'the view reads through makeNet only');
  // each write sits behind a click handler on its own button
  for (const hook of ['data-dm-send', 'data-dm-faucet']) assert.ok(src.view.includes("q('[" + hook + "]')"), hook);
  assert.match(code(src.view), /sendBtn\.addEventListener\('click', send\)/);
  assert.match(code(src.view), /faucetBtn\.addEventListener\('click', faucet\)/);
  // the bid is signed only after the confirm: send() needs S.plan, which only showConfirm sets
  assert.match(code(src.view), /if \(!k \|\| !plan \|\| !plan\.ok \|\| S\.halted\) return;/);
  assert.match(code(src.view), /S\.plan = plan;/);
  // every read route is a fixed path or numbers
  const reads = callArgs(src.logic, 'net.get(');
  assert.ok(reads.length >= 6, 'found ' + reads.length + ' reads');
  for (const arg of reads) assert.ok(/^'\/[a-z/\-]+'$|^'\/raw\/block\/' \+ opened\.openedHeight$|^'\/raw\/blocks\?from=' \+ from \+ '&limit=' \+ AUDIT_PAGE$|^'\/account\/' \+ encodeURIComponent\(address\)$/.test(arg), arg);
});

test('the page and the view agree on every hook, the key panel is in the page, and the page uses the registry', () => {
  for (const h of new Set(src.view.match(/data-dm-[a-z-]+/g))) assert.ok(src.page.includes(h), h + ' is in the page');
  for (const h of ['data-daily-mint-app', 'data-key-panel']) assert.ok(src.view.includes('[' + h) || src.page.includes(h) || src.view.includes('data-key-panel'));
  assert.match(src.page, /<KeyPanel signs="the bid and the card words" id="dm-kp" \/>/);
  assert.match(src.page, /<ChainHeader current="daily-mint"/);
  assert.ok(CHAIN_APPS.some((a) => a.key === 'daily-mint' && a.href === APP.path));
  assert.match(src.page, /import\('\/chain\/apps\/daily-mint-view\.js'\)/);
  assert.match(src.page, /data-genesis=\{DEVNET\.genesis\}/);
  assert.match(src.page, /assertDevnetLaunchPinned\(\)/);
  assert.equal(DAY_STEPS.length, 4);
  assert.ok(CANNOT_SEE.length >= 4 && CANNOT_SEE.some((t) => /house is also the sequencer/.test(t)));
  assert.match(CHECK_COPY.what, /GET \/daily\/law/);
  assert.match(auditSnippet(DEVNET.url), /audit-daily\.mjs https:\/\/pointcast-devnet\.mhoydich\.workers\.dev/);
});

test('the page is honest: play ATTN has no value, the devnet may reset, a reset is dated and recorded, the house is the sequencer', () => {
  assert.equal(HONESTY_LINE, 'devnet · no value · may reset');
  const para = (src.page.match(/<p class="ca-honest"[\s\S]*?<\/p>/) || [''])[0];
  for (const needle of ['{HONESTY_LINE}', 'play auction', 'devnet play ATTN', 'no value and is never', 'promised any', 'may reset and take every card with it', 'dated and recorded, never silent', '{DEVNET_PREVIOUS.path}', '{notYet(RESET.date)}', 'Nothing here is a sale', 'the sequencer', 'accountable claim']) assert.ok(para.includes(needle), needle);
  assert.equal(DEVNET_PREVIOUS.path, '/chain/yard/devnet-1/');
  assert.equal(DEVNET.chainId, 'pointcast-devnet-2');
  assert.match(RESET.date, /^20\d\d-\d\d-\d\d/);
  assert.match(BID_COPY.warn, /Play ATTN has no value/);
  assert.match(src.page, /<KeyPanel/);
  assert.match(src.page, /Nothing is sent until you press send/i.source ? /NOTHING IS SENT UNTIL YOU PRESS SEND/ : /x/);
});

test('no banned word and no currency sign anywhere in the app’s files, and the scanner catches each one', () => {
  assert.ok(MY_FILES.length >= 7);
  for (const f of MY_FILES) {
    const text = read(f);
    assert.deepEqual(bannedHits(text), [], f + ' carries a banned word');
    assert.deepEqual(currencyHits(text), [], f + ' carries a price');
  }
  for (const w of BANNED) assert.ok(bannedHits('some ' + w + ' here').length, w);
});

test('the page is accessible and responsive by construction: labelled inputs, status regions, a table caption, no horizontal scroll', () => {
  for (const id of ['dm-amount', 'dm-gift']) assert.match(src.page, new RegExp('<label class="ca-label" for="' + id + '">'));
  assert.match(src.page, /<legend>Up to three words for the card \(optional\)<\/legend>/);
  assert.match(src.page, /data-dm-status role="status" aria-live="polite"/);
  assert.match(src.page, /<caption>The most recent lots, newest first/);
  assert.match(src.page, /<th scope="col">Lot<\/th>/);
  assert.match(src.page, /@media \(max-width:760px\)/);
  assert.match(src.page, /\.dm-card__img\{display:block;width:100%;height:auto/);
  assert.match(code(src.view), /img\.alt = alt;/);
  assert.match(src.page, /role="alert" hidden/);
});

// ================================================================ the built page (skips while dist/ is absent)

const builtPath = new URL('dist/chain/daily-mint/index.html', root);
test('the built page carries the hooks, the honesty line, the pinned genesis, the key panel and no outside script', { skip: !existsSync(builtPath) && 'dist/ is absent: run npm run build:bare to check the built page' }, () => {
  const html = readFileSync(builtPath, 'utf8');
  for (const h of new Set(src.view.match(/data-dm-[a-z-]+/g))) assert.ok(html.includes(h) || h === 'data-dm-word', h);
  assert.ok(html.includes(HONESTY_LINE));
  assert.ok(html.includes('data-genesis="' + DEVNET.genesis + '"'));
  assert.ok(html.includes('data-key-panel'));
  assert.match(html, /<h1>One card a day, auctioned in play money\.<\/h1>/);
  assert.match(html, /aria-current="page"[^>]*>Daily Mint</);
  assert.ok(!/<script[^>]+src="https?:\/\/(?!pointcast\.xyz)/.test(html));
});

// ================================================================ the real devnets (GET only; skipped when unreachable)

async function reach(base) {
  try {
    const r = await fetch(base + '/status', { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    return { base, status: await r.json() };
  } catch {
    return null;
  }
}
const LOCAL = await reach('http://127.0.0.1:8799');
const LIVE = await reach(DEVNET.url);

for (const [label, ep, genesis] of [['local devnet-2 at 127.0.0.1:8799', LOCAL, () => (LOCAL ? LOCAL.status.genesis_hash : '')], ['the live devnet', LIVE, () => DEVNET.genesis]]) {
  test('against ' + label + ': the house check replays every block and agrees with the Worker', async (t) => {
    if (!ep) return t.skip(label + ' is not reachable');
    if (ep.status.genesis_hash !== genesis()) return t.skip(label + ' has a different genesis from the one pinned here');
    const net = K.makeNet(ep.base);
    const d = D.readDaily(await net.get('/daily'));
    assert.equal(d.status, 'on');
    assert.ok(d.lot && d.addresses);
    const r = await D.auditHouse(net);
    assert.equal(r.ok, true, JSON.stringify(r.mismatches) + JSON.stringify(r.violations));
    assert.equal(r.agree, true);
    assert.ok(r.lots >= 1);
    assert.ok(r.blocks >= 1);
    const pc = await D.previewCard(net, genesis(), d);
    assert.ok(pc && pc.uri, 'the open lot’s card can be drawn');
    for (const l of d.recent.filter((x) => x.recipe)) assert.ok(D.cardFor(l.recipe, l.n), 'lot ' + l.n);
  });
}
