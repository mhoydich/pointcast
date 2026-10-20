// End-to-end run of The Daily Mint against a devnet over HTTP:
//
//   node scripts/e2e-chain-app-daily-mint.mjs [http://127.0.0.1:8799] [--live]
//
// With no address it uses the throwaway local devnet-2 at 127.0.0.1:8799 (a
// 15-minute lot day). WRITES GO ONLY TO A LOCAL DEVNET: faucet claims and bids
// are made there, with throwaway keys. The public devnet is only ever read (GET),
// and --live repeats the read checks on it. What it does, in order, printing one
// line per result:
//   1. reads the house and replays every block through the settle law: it must
//      agree with the Worker's own report before anything is written;
//   2. makes a key, takes the faucet's 100, bids with card words, and sees the lot's
//      leader change; a second key outbids it and the first bid is refunded;
//   3. the door refuses a bid below the minimum and a second faucet claim;
//   4. the replay again: it must still agree, now with the refund in it, no violation;
//   5. the open lot's card is drawn from the chain and audited;
//   6. the page's view over the built page (dist/) does the same through its buttons:
//      key, faucet, review, send, then "Check the house";
//   7. --live: the replay and the card on the public devnet, read only.
// Exit status 1 on any mismatch.
import { DEVNET } from '../src/data/chain-home.ts';
import * as K from '../public/chain/apps/chain-kit.js';
import * as D from '../public/chain/apps/daily-mint.js';
import * as view from '../public/chain/apps/daily-mint-view.js';
import { auditSvg } from '../public/chain/first-mints/lib/first-mint.js';
import { builtSection, harness, ipFetch, reach, sleep, sturdyFetch, until } from './lib/e2e-chain-apps.mjs';

const h = harness('The Daily Mint', 'e2e-chain-app-daily-mint');
const { say, check } = h;
const api = h.api;
const isLocal = api.startsWith('http://127.0.0.1');

const status = isLocal ? await reach(api) : await reach(api);
if (!status) { say('FAIL no devnet answers at ' + api); process.exit(1); }
say('node ' + api + ' · ' + status.chain_id + ' · tip ' + status.height + ' · genesis ' + status.genesis_hash.slice(0, 12) + '…');
const net = K.makeNet(api, { fetch: ipFetch });
const pinned = isLocal ? status.genesis_hash : DEVNET.genesis;

async function house() { return D.readDaily(await net.get('/daily')); }

// 1. the house, and the replay before anything is written
let d = await house();
check(d.status === 'on' && Boolean(d.lot) && Boolean(d.addresses), 'the house is on: lot ' + (d.lot && d.lot.n) + ', ' + d.recent.length + ' recent lots, rules ' + (d.standard ? 'standard' : 'a ' + d.rules.day_ms / 1000 + ' s test day'));
const a0 = await D.auditHouse(net);
check(a0.ok && a0.agree, 'replay before: ' + a0.blocks + ' blocks, ' + a0.lots + ' lots, ' + a0.refunds + ' refunds, ' + a0.violations.length + ' violations, agrees with the Worker');

if (isLocal) {
  h.localOnly(api);
  // keep clear of the close: a bid in the last minutes moves it, and a lot that closes mid-run settles
  if (d.lot.closesInMs !== null && d.lot.closesInMs < 150000) {
    say('note the lot closes in ' + Math.round(d.lot.closesInMs / 1000) + ' s: waiting for the next lot');
    d = await until(async () => { const x = await house(); return x.lot && x.lot.n !== d.lot.n && x.lot.closesInMs > 200000 ? x : null; }, 240000, 2000);
    check(Boolean(d), 'the next lot opened');
  }
  const chain = await K.connectPinned(api, { pinned });
  const a = await K.keyFromSeed(K.newSeedHex());
  const b = await K.keyFromSeed(K.newSeedHex());
  // 2. faucet, bid, outbid, refund
  const claim = await D.claimFaucet(net, a.sender);
  check(claim.amount === D.FAUCET_DRIP, 'the faucet gave ' + claim.amount + ' play ATTN to ' + K.shortAddr(a.sender));
  const funded = await until(async () => (await D.readAccount(net, a.sender)).balance === 100, 20000, 500);
  check(Boolean(funded), 'it landed: balance 100');
  d = await house();
  const lotN = d.lot.n;
  const amountA = D.leastBid(d) + 1;
  const planA = D.planBid({ daily: d, sender: a.sender, amount: amountA, words: ['SIGNAL', 'TIDE'], balance: 100 });
  check(planA.ok && /^bid\/v1 \d{4} SIGNAL TIDE$/.test(planA.title), 'the plan is clean: “' + planA.title + '” and a transfer of ' + amountA);
  const sentA = await D.sendBid({ chain, net, key: a, daily: d, plan: planA });
  check(Number.isInteger(sentA.height) && Boolean(sentA.postTx) && Boolean(sentA.bidTx), 'bid A is in block ' + sentA.height + ' (words post ' + sentA.postTx.slice(0, 10) + '…, transfer ' + sentA.bidTx.slice(0, 10) + '…)');
  d = await until(async () => { const x = await house(); return x.lot && x.lot.leader && x.lot.leader.sender === a.sender ? x : null; }, 15000, 500);
  check(Boolean(d) && d.lot.leader.amount === amountA && d.lot.leader.words.join(' ') === 'SIGNAL TIDE', 'the lot’s leader is A at ' + amountA + ' with SIGNAL TIDE');
  const balA = (await D.readAccount(net, a.sender)).balance;
  check(balA === 100 - amountA, 'A holds ' + balA + ' (100 less the bid)');
  await D.claimFaucet(net, b.sender);
  await until(async () => (await D.readAccount(net, b.sender)).balance === 100, 20000, 500);
  const amountB = D.leastBid(d) + 2;
  const planB = D.planBid({ daily: d, sender: b.sender, amount: amountB, words: ['DRUM', 'WAVE'], gift: a.sender, balance: 100 });
  check(planB.ok && planB.title.endsWith(' to=' + a.sender), 'B’s plan gifts the card to A: “' + planB.title.slice(0, 40) + '…”');
  await D.sendBid({ chain, net, key: b, daily: d, plan: planB });
  d = await until(async () => { const x = await house(); return x.lot && x.lot.leader && x.lot.leader.sender === b.sender ? x : null; }, 15000, 500);
  check(Boolean(d) && d.lot.leader.to === a.sender, 'B outbids at ' + amountB + ' and the lot records the gift to A');
  const refunded = await until(async () => (await D.readAccount(net, a.sender)).balance === 100, 20000, 500);
  check(Boolean(refunded), 'A’s ' + amountA + ' came back within a few blocks: balance 100 again');
  // 3. the door
  const low = D.planBid({ daily: d, sender: b.sender, amount: 1, balance: 90 });
  check(!low.ok && /least bid right now/.test(low.errors[0]), 'the page refuses a bid of 1 before signing: ' + low.errors[0]);
  const raw = pccTransfer(chain, b, d, 1);
  const refusedBid = await raw;
  check(refusedBid.status === 400 && refusedBid.code === 'daily_bid_refused', 'the devnet’s door refuses a transfer below the minimum (' + refusedBid.status + ' ' + refusedBid.code + ')');
  let second = null;
  try { await D.claimFaucet(net, a.sender); } catch (e) { second = e; } // a second claim for one address, from a fresh client address
  check(Boolean(second) && second.status >= 400, 'a second faucet claim for one address is refused (' + (second && second.status) + ': ' + (second && second.message) + ')');
  // 4. the replay again
  await sleep(1500);
  const a1 = await D.auditHouse(net);
  check(a1.ok && a1.agree, 'replay after: ' + a1.blocks + ' blocks, ' + a1.lots + ' lots, ' + a1.refunds + ' refunds (' + a1.refunded + ' play ATTN), ' + a1.violations.length + ' violations, still agrees');
  check(a1.refunds >= a0.refunds + 1 && a1.refunded >= a0.refunded + amountA, 'the refund of A’s bid is in the replay');
  // 5. the card
  d = await house();
  const pc = await D.previewCard(net, pinned, d);
  check(Boolean(pc && pc.uri) && auditSvg(pc.svg).ok, 'the open lot’s card is drawn from the chain (recipe ' + (pc && pc.recipe.slice(0, 14)) + '…) and audited');
  // 6. the page's view over the built page
  const sec = builtSection('dist/chain/daily-mint/index.html', '[data-daily-mint-app]', 'http://localhost/chain/daily-mint/?devnet=' + api);
  if (!sec) say('note dist/chain/daily-mint is absent: build the site to run the page checks (npm run build:bare)');
  else {
    const c = view.mount(sec.section, { window: sec.dom.window, fetch: ipFetch, storage: null, now: () => Date.now() });
    await c.begin();
    c.stop();
    const $ = (s) => sec.section.querySelector(s);
    check(sec.section.dataset.state === 'ready' && /^Lot \d{4}$/.test($('[data-dm-lot-n]').textContent), 'the built page reads the house: ' + $('[data-dm-lot-n]').textContent + ', ' + $('[data-dm-bids]').textContent);
    check(sec.section.querySelectorAll('[data-dm-recent] tr').length === Math.min(7, d.recent.length) && Boolean($('[data-dm-card] img')), 'it draws the open lot’s card and the last ' + sec.section.querySelectorAll('[data-dm-recent] tr').length + ' lots');
    await c.keys.setSeed(K.newSeedHex());
    await sleep(100);
    $('[data-dm-faucet]').click();
    const funded2 = await until(async () => { await c.loadBalance(); return c.state.balance === 100; }, 20000, 600);
    check(Boolean(funded2), 'the page’s faucet button gave its key 100 play ATTN');
    await c.refresh({ cards: false });
    const least = D.leastBid(c.state.daily);
    $('[data-dm-amount]').value = String(least + 1);
    for (const w of ['MINT', 'BEAT']) sec.section.querySelector('[data-dm-word][value="' + w + '"]').click();
    $('[data-dm-review]').click();
    check($('[data-dm-confirm]').hidden === false && sec.section.querySelectorAll('[data-dm-confirm-list] li').length === 2, 'Review lists the two messages that will be sent, and sends nothing');
    const lotBefore = c.state.daily.lot.bids;
    $('[data-dm-send]').click();
    const sent = await until(() => $('[data-dm-result]').dataset.state === 'ok' || $('[data-dm-result]').dataset.state === 'bad', 30000, 400);
    check(Boolean(sent) && $('[data-dm-result]').dataset.state === 'ok', 'Send: ' + $('[data-dm-result-text]').textContent.slice(0, 90) + '…');
    await c.refresh({ cards: false });
    check(c.state.daily.lot.bids === lotBefore + 1 && c.state.daily.lot.leader.sender === c.keys.key().sender, 'the page’s bid leads the lot (' + c.state.daily.lot.bids + ' bids)');
    await c.runAudit();
    check($('[data-dm-audit-summary]').dataset.state === 'ok', 'Check the house in the page: ' + $('[data-dm-audit-summary]').textContent.slice(0, 120));
  }
}

// 7. the public devnet, read only
if (h.flag('--live')) {
  const live = await reach(DEVNET.url);
  if (!live) say('note the public devnet is not reachable');
  else if (live.genesis_hash !== DEVNET.genesis) say('note the public devnet reports another genesis (' + live.genesis_hash.slice(0, 12) + '…): it was reset, and this page pins ' + DEVNET.genesis.slice(0, 12) + '…');
  else {
    const ln = K.makeNet(DEVNET.url, { fetch: sturdyFetch });
    const ld = D.readDaily(await ln.get('/daily'));
    check(ld.status === 'on' && ld.standard, 'live: the house is on with the standard rules: lot ' + ld.lot.n + ', ' + ld.recent.length + ' recent lots');
    const la = await D.auditHouse(ln);
    check(la.ok && la.agree, 'live: replay of ' + la.blocks + ' blocks, ' + la.lots + ' lots, ' + la.violations.length + ' violations, agrees with the Worker');
    const lp = await D.previewCard(ln, DEVNET.genesis, ld);
    check(Boolean(lp && lp.uri), 'live: the open lot’s card is drawn from the chain');
  }
}
h.finish();

/** A signed transfer to the auctioneer sent straight to POST /tx (local only), to see the door's own refusal. */
async function pccTransfer(chain, key, daily, amount) {
  h.localOnly(api);
  const acct = await D.readAccount(net, key.sender);
  const tx = K.pcc.buildTx('transfer', { sender: key.sender, nonce: acct.nonce, to: daily.addresses.auctioneer, amount });
  const signed = { tx, public_key: key.publicKey, signature: await key.sign(K.pcc.signingHash(tx, chain.domain)) };
  const r = await sturdyFetch(api + '/tx', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(signed) });
  let j = {};
  try { j = JSON.parse(await r.text()); } catch { /* not JSON */ }
  return { status: r.status, code: j.code || '' };
}
