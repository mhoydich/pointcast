// /chain/plan: the six-month plan and the peer-to-peer wallets verdict
// (src/data/chain-plan.ts, src/pages/chain/plan.astro), its read-only live
// strip (public/chain/apps/plan-live.js), its block art, and the 2026-10-21
// drift fixes in src/data/chain-home.ts and the /chain home.
//
// What this suite holds: the copy never uses a fundraising word or a price;
// the plan carries its date, its honesty line and the judgment tags; the live
// strip only reads, writes devnet text only as text, pins the genesis, and
// calls a witness key the house does not run exactly that; the home's status
// numbers are dated and add up, while the 3 October snapshot the case study
// measures is left as it was.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import * as P from '../src/data/chain-plan.ts';
import { CHAIN_MAIN, CHAIN_NAV, CRATES, CRATES_SINCE, DEVNET, SOURCE, TESTS, TESTS_NOW } from '../src/data/chain-home.ts';
import { CHAIN_APPS, HONESTY } from '../src/data/chain-apps.ts';
import { assertNoSinks, assertReadOnly, bannedHits, currencyHits } from './helpers/chain-app-rules.mjs';
import { parseHouse, readDaily, readNet, start, summarize } from '../public/chain/apps/plan-live.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const GEN = DEVNET.genesis;

/** Every string reachable from a value. */
const strings = (v, out = []) => {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
};

test('the copy: no fundraising word and no price anywhere in the plan, its page or its live strip', () => {
  const all = strings(Object.fromEntries(Object.entries(P).filter(([, v]) => typeof v !== 'function')));
  assert.ok(all.length > 80, 'the plan has its words in the data file: ' + all.length);
  for (const s of all) {
    assert.deepEqual(bannedHits(s), [], s);
    assert.deepEqual(currencyHits(s), [], s);
  }
  for (const f of ['src/pages/chain/plan.astro', 'public/chain/apps/plan-live.js']) {
    assert.deepEqual(bannedHits(read(f)), [], f);
    assert.deepEqual(currencyHits(read(f)), [], f);
  }
});

test('the plan is dated, honest and in the shape it promises', () => {
  assert.equal(P.PLAN.written, '2026-10-21');
  assert.match(P.PLAN.readAt, /^2026-10-21 \d{2}:\d{2} UTC$/);
  assert.equal(P.PLAN.path, '/chain/plan');
  assert.match(P.PLAN_BLOCK, /^\d{4}$/);
  assert.equal(P.PLAN_HONESTY, HONESTY);
  assert.match(P.PLAN.description, /devnet · no value · may reset\.$/);
  // where it stands: the four numbers agree with the counts they come from
  assert.equal(P.STANDING.emptyBlocks <= P.STANDING.blocks, true);
  assert.equal(P.STATS[0].value, Math.round((100 * P.STANDING.emptyBlocks) / P.STANDING.blocks) + '%');
  assert.equal(P.STATS[1].value, String(P.STANDING.txs));
  assert.equal(P.STATS[2].value, String(P.STANDING.bids));
  assert.equal(P.STATS[3].value, String(P.STANDING.witnessKeysEver));
  assert.equal(Object.keys(P.HOUSE_WITNESSES).length, P.STANDING.witnessKeysEver, 'the keys that ever witnessed are the two house keys');
  assert.match(P.MILESTONE, /a key the house did not make/);
  // the shape: A and B now, C prepared, D parked, each with a never
  assert.deepEqual(P.DIRECTIONS.map((d) => [d.id, d.tag]), [['A', 'now'], ['B', 'now'], ['C', 'prepare'], ['D', 'parked']]);
  for (const d of P.DIRECTIONS) assert.ok(d.never.length > 20 && d.why.length > 40, d.id);
  assert.match(P.DIRECTIONS[2].never, /keys Claude made/);
  // three horizons, in order, with the 30-day review and the parked markets where the research put them
  assert.deepEqual(P.HORIZONS.map((h) => h.id), ['month', 'quarter', 'spring']);
  assert.ok(P.HORIZONS[0].items.some((i) => /30-day review/.test(i.text)));
  assert.ok(P.HORIZONS[2].items.some((i) => /Markets, only if/.test(i.text)));
  assert.ok(P.HORIZONS[2].items.some((i) => /QR wallets on top of passkeys/.test(i.text)));
  // seven calls, each a question with a recommendation; the passkey domain one says it is not decided
  assert.equal(P.CALLS.length, 7);
  for (const c of P.CALLS) {
    assert.match(c.q, /\?$/, c.q);
    assert.ok(c.rec.length > 2 && c.why.length > 30, c.q);
  }
  const where = P.CALLS.find((c) => /Where does the chain live/.test(c.q));
  assert.match(where.rec, /pointcast\.xyz/);
  assert.match(where.rec, /only https:\/\/chain\.pointcast\.xyz may ask/);
  assert.match(where.why, /Neither is your answer yet/);
  assert.ok(P.WONT.length >= 8);
  assert.ok(P.WONT.some((w) => /Never rename the devnet as mainnet/.test(w)));
});

test('the wallets verdict: what exists, the verdict, why not first, and when', () => {
  assert.equal(P.WALLET_VERDICT, 'Not as the first wallet. Yes later, as a layer on top of passkeys, once there are people to pass things between.');
  const names = P.WALLET_PIECES.map((p) => p.piece);
  assert.deepEqual(names, ['Passkeys', 'Device passes', 'Backup keys', 'Gossip', 'Offline sync', 'QR codes', 'WebRTC']);
  // live on devnet-2: exactly the three the devnet-2 profile switches on (launch records 6 and 7)
  assert.deepEqual(P.WALLET_PIECES.filter((p) => p.live).map((p) => p.piece), ['Passkeys', 'Device passes', 'Backup keys']);
  assert.match(P.WALLET_PIECES[0].where, /No passkey account exists yet/);
  assert.match(P.WALLET_PIECES[2].where, /no delay/);
  assert.match(P.WALLET_PIECES[6].where, /not built/);
  assert.equal(P.WALLET_WHY_NOT.length, 4);
  assert.match(P.WALLET_QUESTION.outcome, /never reached Mike/);
  assert.ok(P.WALLET_WHEN.findIndex((w) => /QR first/.test(w.text)) < P.WALLET_WHEN.findIndex((w) => /WebRTC second/.test(w.text)));
  assert.match(P.WALLET_NEVER, /no value and none is promised/);
});

test('backup keys: a set of up to four keys that includes the one making the change, never “four more”', () => {
  // pointcast-chain crates/chain-core/src/state.rs SetControllers: the signer must be in the new set
  // (SignerNotInControllerSet), and keys.rs caps the set at accounts.max_controllers, 4 on devnet-2.
  const piece = P.WALLET_PIECES.find((p) => p.piece === 'Backup keys');
  assert.match(piece.what, /^Up to four keys with full power over one account, counting the key that makes the change/);
  const hub = read('src/pages/chain.astro');
  assert.match(hub, /up to four keys with full power, counting the one that makes the change/);
  for (const text of [piece.what, hub]) {
    assert.doesNotMatch(text, /four more keys|Up to four backup keys|up to 4 more/i);
  }
});

test('device passes are bounded in blocks, and the copy does not promise 30 days on devnet-2', () => {
  // pointcast-chain keys.rs: a pass expires at most session_max_blocks after it is granted; devnet-2's profile
  // sets 864,000, and its Worker seals a block only for traffic or a five-minute heartbeat (GET /status).
  const piece = P.WALLET_PIECES.find((p) => p.piece === 'Device passes');
  assert.ok(piece.live, 'listed as live on devnet-2');
  const hub = read('src/pages/chain.astro');
  const card = /A device pass lets one device[^']*/.exec(hub)[0];
  for (const text of [piece.what, card]) {
    assert.match(text, /864,000 blocks/);
    assert.match(text, /30 days at three-second blocks/);
    assert.match(text, /devnet-2[^.]*every five minutes/);
    assert.doesNotMatch(text, /for up to 30 days/);
  }
});

test('the October record is told as it is: the panel’s scores and the roadmap were kept; what never happened is delivery', () => {
  // The 4 October panel (workflow run wf_19db1db6-bad) finished with three judges' scores and a decision, and the
  // six-month roadmap (wf_70622de2-c61) was drafted the same day; Mike saw a one-line summary of each on 5 October.
  const o = P.WALLET_QUESTION.outcome;
  assert.doesNotMatch(o, /scores were not kept|not kept|never saved/);
  assert.match(o, /its record was kept: the judges scored the three shapes 8, 6 and 7 out of 10 for wow, 8, 6 and 7 for trust, and 5, 8 and 6/);
  assert.match(o, /never built/, 'the panel’s own wallet plan was not built, and the page says so');
  assert.match(o, /never reached Mike/);
  assert.match(P.NORTH_STAR.said, /roadmap drafted on 4 October/);
  assert.doesNotMatch(P.NORTH_STAR.said, /sketch/);
  const page = read('src/pages/chain/plan.astro');
  assert.doesNotMatch(page, /never written down/, 'the verdict was promised and never delivered; the panel did write its decision down');
  assert.match(page, /promised on 4 October and never delivered\./);
  const october = P.SOURCES.find((s) => s.label === 'The October sessions');
  assert.match(october.detail, /judges’ scores/);
});

test('the page: its nav key, its sections, the live strip wired read-only, every app linked', () => {
  const page = read('src/pages/chain/plan.astro');
  assert.match(page, /<ChainHeader current="plan"/);
  const nav = CHAIN_NAV.find((n) => n.key === 'plan');
  assert.deepEqual(nav, { key: 'plan', href: '/chain/plan', label: 'Plan' });
  for (const id of ['now', 'shape', 'horizons', 'calls', 'wont', 'wallets', 'apps']) assert.match(page, new RegExp('<section id="' + id + '"'), id);
  assert.match(page, /assertDevnetLaunchPinned\(\);/);
  assert.match(page, /data-plan-live/);
  assert.match(page, /data-genesis=\{DEVNET\.genesis\}/);
  assert.match(page, /<dl class="pl-live__list" aria-live="polite">/);
  assert.match(page, /<button type="button" class="btn btn--ghost" data-live-again>Read again<\/button>/);
  assert.match(page, /import\('\/chain\/apps\/plan-live\.js'\)/);
  assert.match(page, /\{CHAIN_APPS\.map\(/);
  assert.match(page, /role="note">\s*<b>\{PLAN_HONESTY\}\.<\/b>/);
  assert.match(page, /pl-j">judgment</);
  // the built page, when dist/ is there
  const built = new URL('dist/chain/plan/index.html', root);
  if (existsSync(built)) {
    const html = readFileSync(built, 'utf8');
    for (const a of CHAIN_APPS) assert.ok(html.includes('href="' + a.href + '"'), a.href);
    assert.ok(html.includes('aria-current="page">Plan<'), 'the Plan item is the current page');
    assert.ok(html.includes(GEN), 'the genesis is pinned in the strip');
    assert.ok(html.includes(P.WALLET_VERDICT), 'the verdict is on the page');
  }
});

test('the live strip only reads, and never writes devnet text as markup', () => {
  const src = read('public/chain/apps/plan-live.js');
  assertNoSinks(src, 'plan-live.js');
  assertReadOnly(src, 'plan-live.js');
  assert.doesNotMatch(src, /\.post\(|signAndSend|keyFromSeed|newSeedHex/);
});

test('parseHouse keeps well-formed pairs only', () => {
  const h = parseHouse('tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2:house-runner-1,junk,tz1W5HN6PoFW8YvDCcrPtQmQwYLWYTWf8Rkd:claude-code,x:<b>');
  assert.deepEqual(h, P.HOUSE_WITNESSES);
  assert.deepEqual(parseHouse(''), {});
});

test('readNet, readDaily and summarize: house keys, outside keys, hostile text, no lot', () => {
  const house = P.HOUSE_WITNESSES;
  const net = readNet({ day: '2026-10-21', witnesses: [
    { addr: 'tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2', name: 'house-runner-1' },
    { addr: 'tz1W5HN6PoFW8YvDCcrPtQmQwYLWYTWf8Rkd', name: 'claude-code' },
    { addr: 'tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2', name: 'dup' },
    'nope', { name: 'no addr' },
  ] }, house);
  assert.equal(net.witnesses.length, 2);
  assert.ok(net.witnesses.every((w) => w.house));
  const lines = summarize({ height: 3800, net, daily: readDaily({ status: 'on', lot: { n: 13, bids: 0 } }) }, { blocks: 3769 });
  assert.equal(lines.height, 'Block 3,800 (31 since the plan was written).');
  assert.equal(lines.witnesses, '2 witness keys today (2026-10-21, UTC): house-runner-1 (house), claude-code (house). The house runs all of them.');
  assert.equal(lines.lot, 'Today’s Daily Mint lot, #13: 0 bids so far.');
  assert.match(lines.milestone, /^No witness key from outside the house today/);

  const hostile = '<img src=x onerror=alert(1)>‮gnp.exe​';
  const net2 = readNet({ day: '2026-10-22', witnesses: [{ addr: 'tz1Outside000000000000000000000000000', name: hostile }] }, house);
  assert.equal(net2.witnesses[0].house, false);
  assert.doesNotMatch(net2.witnesses[0].name, /[‮​]/, 'direction and zero-width characters are gone');
  const l2 = summarize({ height: 10, net: net2, daily: readDaily({ status: 'off' }) });
  assert.match(l2.witnesses, /^1 witness key today \(2026-10-22, UTC\): <img src=x onerror=alert\(1\)> gnp\.exe\. 1 key this page does not know as the house’s\. A key is not a person/);
  assert.equal(l2.lot, 'The Daily Mint has no open lot right now.');
  assert.match(l2.milestone, /^A witness key the house does not run has signed today\. Whether a person stands behind it, this page cannot tell\.$/);
  assert.equal(summarize({ height: 5, net: readNet(null), daily: readDaily(null) }).witnesses, 'No witness key has signed today yet.');
});

test('the milestone line never claims more than the strip read: a bid is not called “still open”', () => {
  const house = P.HOUSE_WITNESSES;
  const onlyHouse = readNet({ day: '2026-10-21', witnesses: [{ addr: 'tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2', name: 'house-runner-1' }] }, house);
  // a bid on today's lot, from a key this strip does not check: it may be the milestone, so the line must not say it is still open
  const bid = summarize({ height: 3800, net: onlyHouse, daily: readDaily({ status: 'on', lot: { n: 13, bids: 2 } }) });
  assert.equal(bid.lot, 'Today’s Daily Mint lot, #13: 2 bids so far.');
  assert.equal(bid.milestone, 'No witness key from outside the house today. Today’s lot has 2 bids: one from a key the house did not make would meet the milestone, and this strip does not check who bid.');
  // nothing seen: it says what it read, and that it does not read every transaction
  const quiet = summarize({ height: 3800, net: onlyHouse, daily: readDaily({ status: 'on', lot: { n: 13, bids: 0 } }) });
  assert.equal(quiet.milestone, 'No witness key from outside the house today, and no bid on today’s lot. Those are the only two signs this strip reads, not every transaction.');
  const closed = summarize({ height: 3800, net: readNet(null), daily: readDaily({ status: 'off' }) });
  assert.match(closed.milestone, /not every transaction\.$/);
  for (const l of [bid, quiet, closed]) assert.doesNotMatch(l.milestone, /still open/, 'the strip cannot know the milestone is still open');
});

// ---------------------------------------------------------------- the strip end to end, on a fake page and a fake devnet

function fakePage(dataset) {
  const els = {};
  const node = (name) => (els[name] = { textContent: '', disabled: false, listeners: {}, addEventListener(t, f) { this.listeners[t] = f; } });
  for (const f of ['height', 'witnesses', 'lot', 'milestone', 'state', 'again']) node(f);
  const root = {
    dataset: { ...dataset },
    ownerDocument: { defaultView: null },
    querySelector(sel) {
      const m = /^\[data-live-([a-z]+)\]$/.exec(sel);
      return m ? els[m[1]] || null : null;
    },
  };
  return { root, els };
}

function fakeDevnet({ genesis = GEN, height = 3790, witnesses = [], lot = { n: 13, bids: 1 }, down = false } = {}) {
  const calls = [];
  const reply = (obj) => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(obj) });
  const f = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET' });
    if (down) throw new TypeError('fetch failed');
    const path = new URL(url).pathname;
    if (path === '/status') return reply({ chain_id: 'pointcast-devnet-2', genesis_hash: genesis, height });
    if (path === '/net') return reply({ day: '2026-10-21', witnesses });
    if (path === '/daily') return reply({ status: 'on', lot });
    return { ok: false, status: 404, headers: { get: () => null }, text: async () => '{}' };
  };
  return { f, calls };
}

const DATA = { api: DEVNET.url, genesis: GEN, house: Object.entries(P.HOUSE_WITNESSES).map(([a, n]) => a + ':' + n).join(','), writtenBlocks: String(P.STANDING.blocks) };

test('the strip reads three routes with GET, fills four lines as text and says so', async () => {
  const { root, els } = fakePage(DATA);
  const dev = fakeDevnet({ witnesses: [{ addr: 'tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2', name: 'house-runner-1' }] });
  const c = start(root, { fetch: dev.f, search: '' });
  assert.ok(c, 'mounted');
  assert.equal(dev.calls.length, 0, 'nothing is read before the page is ready');
  await c.read();
  assert.equal(root.dataset.state, 'live');
  assert.deepEqual(dev.calls.map((x) => [new URL(x.url).pathname, x.method]).sort(), [['/daily', 'GET'], ['/net', 'GET'], ['/status', 'GET']]);
  assert.ok(dev.calls.every((x) => x.url.startsWith(DEVNET.url)));
  assert.equal(els.height.textContent, 'Block 3,790 (21 since the plan was written).');
  assert.match(els.witnesses.textContent, /^1 witness key today .*house-runner-1 \(house\)\. The house runs all of them\.$/);
  assert.equal(els.lot.textContent, 'Today’s Daily Mint lot, #13: 1 bid so far.');
  assert.match(els.state.textContent, /^Read just now from the devnet, in your browser\. 3 requests, all GET\.$/);
  assert.equal(els.again.disabled, false);
  // Read again is a button that reads again
  els.again.listeners.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(dev.calls.length, 6);
});

test('a reset reads GENESIS CHANGED, and a dead devnet says it could not read; neither shows a number', async () => {
  const a = fakePage(DATA);
  const c1 = start(a.root, { fetch: fakeDevnet({ genesis: 'ab'.repeat(32) }).f, search: '' });
  await c1.read();
  assert.equal(a.root.dataset.state, 'genesis-changed');
  assert.match(a.els.state.textContent, /^GENESIS CHANGED: the devnet was reset after this plan was written\./);
  assert.equal(a.els.height.textContent, '');
  const b = fakePage(DATA);
  const c2 = start(b.root, { fetch: fakeDevnet({ down: true }).f, search: '' });
  await c2.read();
  assert.equal(b.root.dataset.state, 'down');
  assert.match(b.els.state.textContent, /^Could not read the devnet: .*\. The numbers on this page are as written\.$/);
});

test('?devnet= is honoured for 127.0.0.1 only; another host is ignored and said to be', async () => {
  const a = fakePage(DATA);
  const dev = fakeDevnet({ genesis: 'cd'.repeat(32) });
  const c = start(a.root, { fetch: dev.f, search: '?devnet=http://127.0.0.1:8817' });
  await c.read();
  assert.ok(dev.calls.every((x) => x.url.startsWith('http://127.0.0.1:8817/')), 'the local devnet, and its own genesis');
  assert.equal(a.root.dataset.state, 'live');
  assert.match(a.els.state.textContent, /the local devnet you named/);
  const b = fakePage(DATA);
  const pub = fakeDevnet();
  const cb = start(b.root, { fetch: pub.f, search: '?devnet=https://evil.example' });
  assert.match(b.els.state.textContent, /was ignored: only localhost and 127\.0\.0\.1 are honoured/);
  // after the read the notice is still there: the numbers are the public devnet's, not the typed address's
  await cb.read();
  assert.equal(b.root.dataset.state, 'live');
  assert.ok(pub.calls.every((x) => x.url.startsWith(DEVNET.url)), 'the ignored address is never read');
  assert.match(b.els.state.textContent, /^Read just now from the devnet, in your browser\. 3 requests, all GET\. The \?devnet= in the address was ignored: only localhost and 127\.0\.0\.1 are honoured\.$/);
  // and when the read fails
  const d = fakePage(DATA);
  const cd = start(d.root, { fetch: fakeDevnet({ down: true }).f, search: '?devnet=https://evil.example' });
  await cd.read();
  assert.match(d.els.state.textContent, /^Could not read the devnet: .* The \?devnet= in the address was ignored/);
  // a honoured or absent override adds nothing
  const e = fakePage(DATA);
  const ce = start(e.root, { fetch: fakeDevnet().f, search: '' });
  await ce.read();
  assert.doesNotMatch(e.els.state.textContent, /ignored/);
});

test('the block art is abstract: shapes only, no text, no images, no links, and it respects reduced motion', () => {
  const svg = read('public/images/chain/plan.svg');
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1200 630"/);
  assert.doesNotMatch(svg, /<text|<tspan|<image|<script|foreignObject|href|\son\w+=|<use|<filter|url\(/i);
  assert.match(svg, /prefers-reduced-motion:reduce/);
  const tags = new Set([...svg.matchAll(/<([a-z]+)[\s>\/]/g)].map((m) => m[1]));
  for (const t of tags) assert.ok(['svg', 'style', 'rect', 'g', 'line', 'circle', 'path'].includes(t), t);
  assert.ok(svg.length < 20000);
  assert.ok(existsSync(new URL('scripts/generate-chain-plan-art.py', root)), 'the art has its generator');
});

test('the drift fix: the home’s numbers are main’s, dated, and add up; the 3 October snapshot is unchanged', () => {
  assert.equal(CHAIN_MAIN.commit, '906c745');
  assert.match(CHAIN_MAIN.readOn, /^2026-10-21$/);
  assert.ok(CHAIN_MAIN.commits > SOURCE.commits && CHAIN_MAIN.rustLines > SOURCE.rustLines);
  const t = TESTS_NOW;
  assert.equal(t.total, t.workspace.passed + t.kernel.passed + t.js.passed + t.python.passed);
  assert.equal(t.workspace.failed + t.kernel.failed + t.js.failed, 0);
  assert.equal(t.js.passed, t.js.suites.match(/\d+/g).map(Number).reduce((a, b) => a + b, 0), 'the six suites add up (their passed counts)');
  // the snapshot the case study and the dev tools measure
  assert.equal(SOURCE.commit, 'da7bc09');
  assert.equal(SOURCE.commits, 111);
  assert.equal(TESTS.total, 449);
  assert.equal(CRATES.length, 9);
  assert.deepEqual(CRATES_SINCE.map((c) => c.name), ['replica', 'relay', 'oracle', 'devnet-wasm']);
  const hub = read('src/pages/chain.astro');
  assert.match(hub, /AS OF \{CHAIN_MAIN\.readOn\} · MAIN \{CHAIN_MAIN\.commit\}/);
  assert.doesNotMatch(hub, /Nothing in the Town Network is built/);
  assert.doesNotMatch(hub, /Face ID would be your pass/);
  assert.doesNotMatch(hub, /LOCAL BUILD · NOT YET PUBLIC/);
  assert.match(hub, /href="\/chain\/plan"/);
  const dev = read('src/pages/chain/dev.astro');
  assert.match(dev, /SOURCE \{SOURCE\.commit\} · \{SOURCE\.date\} · LOCAL TODAY/);
});
