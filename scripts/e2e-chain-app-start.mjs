// End-to-end run of "Start here" (/chain/start) against a devnet over HTTP:
//
//   node scripts/e2e-chain-app-start.mjs [http://127.0.0.1:8799] [--live]
//
// With no address it uses the throwaway local devnet-2 at 127.0.0.1:8799 (a
// 15-minute lot day). WRITES GO ONLY TO A LOCAL DEVNET: faucet claims, bids,
// stamps and capsules are made there, with throwaway keys and a software
// passkey. The public devnet is only ever read (GET), and --live repeats the
// read checks on it. What it does, in order, printing one line per result:
//   1. reads the devnet: the house is on, and the passkey rule of launch record 7
//      admits https://pointcast.xyz and refuses any other site;
//   2. for each of the three choices, a fresh key: the faucet's 100, then the
//      choice through its own app module with the reviewed key. The card it is
//      shown names the exact transaction, and its digest is the one signed; the
//      transaction lands, GET /tx agrees, and the block passes every
//      "Verify a block" check that can run (plus the Notary's own check for the
//      stamp, and the capsule list for the capsule);
//   3. Cancel signs and sends nothing: the account's nonce does not move;
//   4. a passkey account (a software authenticator answering as pointcast.xyz):
//      made, funded, and its stamp lands as a webauthn transaction whose block
//      verifies;
//   5. the page's view over the built page (dist/), driven through its buttons,
//      once per choice: key, faucet (or skip), choice, Review, the card, Sign,
//      step 4 with its links; then once with the passkey;
//   6. --live: the read checks on the public devnet.
// Exit status 1 on any mismatch.
import { DEVNET } from '../src/data/chain-home.ts';
import * as K from '../public/chain/apps/chain-kit.js';
import * as S0 from '../public/chain/apps/start.js';
import * as V from '../public/chain/apps/verify.js';
import * as view from '../public/chain/apps/start-view.js';
import { builtSection, harness, ipFetch, reach, sleep, sturdyFetch, until } from './lib/e2e-chain-apps.mjs';
import { softPasskey } from '../tests/helpers/soft-passkey.mjs';

const { D, N, C } = S0;
const h = harness('Start here', 'e2e-chain-app-start');
const { say, check } = h;
const api = h.api;
const isLocal = api.startsWith('http://127.0.0.1');

const status = await reach(api);
if (!status) { say('FAIL no devnet answers at ' + api); process.exit(1); }
say('node ' + api + ' · ' + status.chain_id + ' · tip ' + status.height + ' · genesis ' + status.genesis_hash.slice(0, 12) + '…');
const net = K.makeNet(api, { fetch: ipFetch });
const pinned = isLocal ? status.genesis_hash : DEVNET.genesis;

/** Run "Verify a block" on block n, as the page's link does. Returns the report's failed and skipped steps. */
async function verifyBlock(n) {
  const env = { fetch: sturdyFetch };
  const set = await V.fetchBlockSet(api, n, env);
  const chain = await V.loadChain(api, env);
  const r = await V.runSteps({ n, params: chain.params, genesis: pinned, pinSource: isLocal ? 'node' : 'pinned', prev: set.prev, block: set.block, next: set.next, chain, paths: set.paths });
  return { failed: r.failed, skipped: r.skipped };
}
const verifyOk = (v) => v.failed.length === 0 && v.skipped.every((s) => s === 'link_forward');

// 1. the devnet
const chain = await K.connectPinned(api, { pinned });
const daily0 = D.readDaily(await net.get('/daily'));
check(daily0 && daily0.status === 'on' && Boolean(daily0.lot), 'the house is on: lot ' + (daily0 && daily0.lot && daily0.lot.n) + ', least bid ' + D.leastBid(daily0));
const here = S0.passkeyPlace({ params: chain.params, origin: 'https://pointcast.xyz', webauthn: true });
const elsewhere = S0.passkeyPlace({ params: chain.params, origin: 'http://localhost:4321', webauthn: true });
check(here.ok && here.rpId === 'pointcast.xyz' && !elsewhere.ok && /only on https:\/\/pointcast\.xyz/.test(elsewhere.reason), 'launch record 7: passkeys at https://pointcast.xyz (RP ID ' + here.rpId + '), refused elsewhere: “' + elsewhere.reason.slice(0, 70) + '…”');

if (isLocal) {
  h.localOnly(api);
  // keep clear of a lot's close: a bid in the last minutes moves it, and a lot that closes mid-run settles
  let d = daily0;
  if (d.lot.closesInMs !== null && d.lot.closesInMs < 240000) {
    say('note the lot closes in ' + Math.round(d.lot.closesInMs / 1000) + ' s: waiting for the next lot');
    d = await until(async () => { const x = D.readDaily(await net.get('/daily')); return x.lot && x.lot.n !== d.lot.n && x.lot.closesInMs > 300000 ? x : null; }, 300000, 2000);
    check(Boolean(d), 'the next lot opened');
  }

  // 2. the three choices, module by module
  const cards = [];
  const approve = (card) => { cards.push(card); return Promise.resolve(true); };
  for (const choice of S0.CHOICES) {
    const k = await K.keyFromSeed(K.newSeedHex());
    const got = await S0.takeAttn(net, k.sender);
    check(got.balance === 100 && got.amount === 100, choice + ': the faucet gave ' + K.shortAddr(k.sender) + ' ' + got.amount + ' play ATTN; balance ' + got.balance);
    cards.length = 0;
    const signed = [];
    const key = S0.reviewedKey(k, approve, { context: () => ({}), onSign: (c) => signed.push(c) });
    let r;
    if (choice === 'bid') {
      d = D.readDaily(await net.get('/daily'));
      const plan = S0.bidPlan(d, k.sender, got.balance);
      check(plan.ok && plan.amount === D.leastBid(d), 'bid: the plan is the least bid, ' + plan.amount + ' play ATTN, no words, no gift');
      const s = await D.sendBid({ chain, net, key, daily: d, plan });
      r = { txHash: s.bidTx, height: s.height };
      const after = D.readDaily(await net.get('/daily'));
      check(after.lot && after.lot.leader && after.lot.leader.sender === k.sender, 'bid: the key leads lot ' + after.lot.n + ' at ' + after.lot.leader.amount);
    } else if (choice === 'stamp') {
      const sentence = 'The first citizen was here at ' + new Date().toISOString() + '.';
      const st = await S0.stampOf(sentence);
      const s = await N.stampHash({ chain, net, key, sha256: st.sha256, bytes: st.bytes });
      r = { txHash: s.txHash, height: s.height };
      const c = await N.checkStamp({ api, genesis: pinned, pinSource: 'node', ref: { height: s.height, txHash: s.txHash }, sha256: st.sha256, env: { fetch: sturdyFetch } });
      check(c.verdict !== 'NOT STAMPED' && c.checks.every((x) => x.state !== 'fail'), 'stamp: the Notary’s own check of the stamp says ' + c.verdict + ' (PARTLY only because a local genesis is not pinned in a page)');
    } else {
      const tip = (await K.pinnedStatus(net, pinned)).height;
      const rate = await S0.dayRate(net, tip);
      const plan = S0.capsulePlan({ message: 'Hello from the first minute.', title: 'A note from my first minute on the chain', label: 'first minute', tip, perHour: rate, sender: k.sender });
      check(plan.ok && plan.fields.channel === 'GDN' && plan.fields.delay === S0.capsuleDelay(rate), 'capsule: about 7 days is ' + plan.fields.delay + ' blocks at ' + rate.toFixed(1) + ' blocks an hour; opens at ' + plan.fields.openAt);
      let file = null;
      const s = await C.sealCapsule({ chain, net, key, plan, onFile: (f) => { file = f; } });
      r = { txHash: s.txHash, height: s.height };
      const list = C.readCapsules(await net.get(C.CAPSULES_PATH));
      const row = list.rows.find((x) => x.id === s.file.capsule);
      check(Boolean(row) && row.openAt === plan.fields.openAt && row.author === k.sender && file && C.readCapsuleFile(file).capsule === row.id, 'capsule: the devnet lists it, opening at ' + (row && row.openAt) + ', and the file the page keeps reads back to the same capsule id');
    }
    check(cards.length === 1 && signed.length === 1 && cards[0].digest === signed[0].digest, choice + ': one card was shown and the key signed exactly it (digest ' + cards[0].digest.slice(0, 12) + '…, ' + cards[0].fields.length + ' fields)');
    const t = await D.txStatus(net, r.txHash);
    const blockTx = (await net.get('/raw/block/' + r.height)).txs.find((x) => K.pcc.txHash(x) === r.txHash);
    check(t.status === 'included' && t.height === r.height && Boolean(blockTx) && K.pcc.signingHash(blockTx.tx, chain.domain) === cards[0].digest, choice + ': transaction ' + r.txHash.slice(0, 12) + '… is in block ' + r.height + ', and the signed tx in that block is the one the card showed');
    const seen = await S0.landed(net, r.txHash, r.height);
    check(seen.included && /^[0-9a-f]{64}$/.test(seen.hash), choice + ': landed() reads block ' + r.height + ' (hash ' + seen.hash.slice(0, 12) + '…)');
    const v = await verifyBlock(r.height);
    check(verifyOk(v), choice + ': block ' + r.height + ' passes every Verify a block check that can run' + (v.skipped.length ? ' (skipped: ' + v.skipped.join(', ') + ')' : ''));
  }

  // 3. Cancel
  const kc = await K.keyFromSeed(K.newSeedHex());
  const before = await D.readAccount(net, kc.sender);
  let declined = null;
  try { await N.stampHash({ chain, net, key: S0.reviewedKey(kc, () => Promise.resolve(false)), sha256: (await S0.stampOf('never sent')).sha256, bytes: 10 }); } catch (e) { declined = e; }
  const afterC = await D.readAccount(net, kc.sender);
  check(Boolean(declined) && declined.code === 'declined' && !declined.sendState && afterC.nonce === before.nonce, 'Cancel: “' + (declined && declined.message) + '”; the nonce stays ' + afterC.nonce);

  // 4. a passkey account (a software authenticator answering as https://pointcast.xyz)
  const soft = softPasskey({ origin: 'https://pointcast.xyz' });
  const w = await S0.makePasskey({ rpId: here.rpId, credentials: soft });
  check(/^pcp1/.test(w.address) && soft.log[0].rpId === 'pointcast.xyz' && soft.log[0].alg.includes(-7), 'passkey: made ' + w.address + ' with RP ID ' + soft.log[0].rpId);
  const pg = await S0.takeAttn(net, w.address);
  check(pg.balance === 100, 'passkey: the faucet funded the pcp1 account: ' + pg.balance);
  const pcards = [];
  const pkey = S0.reviewedKey(S0.passkeyKey(w, { rpId: here.rpId, credentials: soft }), (c) => { pcards.push(c); return Promise.resolve(true); });
  const pst = await S0.stampOf('Signed with a passkey on the first minute.');
  const ps = await N.stampHash({ chain, net, key: pkey, sha256: pst.sha256, bytes: pst.bytes });
  const praw = (await net.get('/raw/block/' + ps.height)).txs.find((x) => K.pcc.txHash(x) === ps.txHash);
  check(Boolean(praw) && praw.sig_mode === 'webauthn' && praw.tx.sender === w.address && soft.log.at(-1).op === 'get' && soft.log.at(-1).challenge === Buffer.from(pcards[0].digest, 'hex').toString('base64url'), 'passkey: the stamp is a webauthn transaction in block ' + ps.height + ', and the passkey signed exactly the reviewed digest');
  const pv = await verifyBlock(ps.height);
  // Verify a block does not check a passkey's P-256 signature (it says so, as a skip); the devnet checked it when it took the tx.
  check(pv.failed.length === 0 && pv.skipped.every((s) => s === 'link_forward' || /^sig:\d+$/.test(s)), 'passkey: block ' + ps.height + ' passes every Verify a block check that runs; it skips ' + pv.skipped.join(', ') + ' (it does not check P-256 passkey signatures, and says so)');
  let refused = null;
  try { await S0.passkeyKey(w, { rpId: here.rpId, credentials: soft }).signTx(K.pcc.buildTx('transfer', { sender: w.address, nonce: 1, to: w.address, amount: 1 }), chain); } catch (e) { refused = e; }
  check(Boolean(refused) && refused.code === 'unreviewed' && soft.log.filter((x) => x.op === 'get').length === 1, 'passkey: asked to sign without a reviewed card, it refuses and the authenticator is never asked');

  // 5. the page's view over the built page
  const runView = async (choice, { passkey = false } = {}) => {
    const sec = builtSection('dist/chain/start/index.html', '[data-start-app]', 'http://localhost/chain/start/?devnet=' + api);
    if (!sec) { say('note dist/chain/start is absent: build the site to run the page checks (npm run build:bare)'); return; }
    const store = new Map();
    const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
    const sp = passkey ? softPasskey({ origin: 'https://pointcast.xyz' }) : null;
    const c = view.mount(sec.section, { window: sec.dom.window, fetch: ipFetch, storage, supported: true, now: () => Date.now(), credentials: sp, origin: passkey ? 'https://pointcast.xyz' : 'http://localhost:4321' });
    await c.begin();
    c.stop();
    const $ = (s) => sec.section.querySelector(s);
    const step = (k) => $('[data-st-step="' + k + '"]').dataset.state;
    const label = (passkey ? 'page+passkey ' : 'page ') + choice;
    check(sec.section.dataset.state === 'ready' && step('key') === 'now' && $('[data-kp-make]').disabled === false, label + ': the built page reads the devnet and asks for a key first');
    if (passkey) {
      check($('[data-st-pk-make]').disabled === false && /Passkeys work here/.test($('[data-st-pk-why]').textContent), label + ': the passkey button is on, the chain names this site');
      $('[data-st-pk-make]').click();
      await until(() => c.state.passkey && c.state.mode === 'passkey', 5000, 50);
      check(/^pcp1/.test(c.activeKey().sender) && store.get(S0.PASSKEY_SLOT) && JSON.parse(store.get(S0.PASSKEY_SLOT)).address === c.activeKey().sender, label + ': made ' + c.activeKey().sender + ', kept (public part only) in the First Mints slot');
    } else {
      check($('[data-st-pk-make]').disabled === true && /^Not on this copy of the page \(http:\/\/localhost:4321\)/.test($('[data-st-pk-why]').textContent) && /only on https:\/\/pointcast\.xyz/.test(sec.section.textContent), label + ': on another site the passkey button is off and says why');
      $('[data-kp-make]').click();
      await until(() => c.keys.key(), 5000, 50);
    }
    await until(() => step('attn') === 'now', 5000, 50);
    check(step('key') === 'done' && step('attn') === 'now', label + ': step 1 done, step 2 now: ' + $('[data-st-who]').textContent.slice(0, 60) + '…');
    if (choice === 'bid' || passkey) {
      $('[data-st-faucet]').click();
      await until(() => step('act') === 'now', 25000, 200);
      check(c.state.balance === 100 && /landed/.test($('[data-st-faucet-out]').textContent), label + ': the faucet button: ' + $('[data-st-faucet-out]').textContent);
    } else {
      $('[data-st-skip]').click();
      check(step('attn') === 'done' && $('[data-st-badge="attn"]').textContent === 'SKIPPED' && step('act') === 'now', label + ': Skip moves on (the stamp and the capsule cost nothing)');
    }
    const radio = sec.section.querySelector('[data-st-choice][value="' + choice + '"]');
    radio.checked = true;
    radio.dispatchEvent(new sec.dom.window.Event('change'));
    check($('[data-st-panel="' + choice + '"]').hidden === false && $('[data-st-review]').disabled === false, label + ': the choice opens its panel and Review');
    if (choice === 'stamp') $('[data-st-sentence]').value = 'Typed into the page at ' + new Date().toISOString() + '.';
    if (choice === 'capsule') { $('[data-st-message]').value = 'See you in a week.'; $('[data-st-capsule-keep]').checked = true; }
    const nonceBefore = (await D.readAccount(net, c.activeKey().sender)).nonce;
    $('[data-st-review]').click();
    await until(() => $('[data-st-card]').hidden === false, 15000, 100);
    const fields = [...sec.section.querySelectorAll('[data-st-card-fields] dt')].map((n) => n.textContent);
    const kind = { bid: 'transfer', stamp: 'publish_block', capsule: 'seal_capsule' }[choice];
    check($('[data-st-card]').hidden === false && fields.includes('type') && [...sec.section.querySelectorAll('[data-st-card-fields] dd')].some((n) => n.textContent === kind) && /^[0-9a-f]{64}$/.test($('[data-st-card-digest]').textContent), label + ': the card shows the ' + kind + ' (' + fields.join(', ') + ') and its digest, before anything is signed');
    check((await D.readAccount(net, c.activeKey().sender)).nonce === nonceBefore, label + ': nothing signed yet: the nonce is still ' + nonceBefore);
    $('[data-st-sign]').click();
    await until(() => step('see') === 'done' || ['bad', 'warn'].includes($('[data-st-progress]').dataset.state), 45000, 200);
    check(step('see') === 'done' && $('[data-st-done]').hidden === false, label + ': Sign: ' + $('[data-st-done-line]').textContent.slice(0, 100) + (step('see') === 'done' ? '' : ' / ' + $('[data-st-progress-text]').textContent));
    const height = c.state.done && c.state.done.height;
    const vh = $('[data-st-link-verify]').getAttribute('href');
    check(vh === '/chain/verify-a-block?devnet=' + encodeURIComponent(api) + '#b=' + height && $('[data-st-link-yard]').getAttribute('href').startsWith('/chain/yard/?api=' + encodeURIComponent(api)) && $('[data-st-link-obs]').getAttribute('href') === '/chain/observatory?devnet=' + encodeURIComponent(api), label + ': step 4 links verify block ' + height + ' on this same devnet: ' + vh);
    check(/^included/.test($('[data-st-done-status]').textContent) && /SETUP COMPLETE/.test(sec.dom.window.document.querySelector('[data-st-bar-text]').textContent), label + ': ' + $('[data-st-done-status]').textContent + ' · ' + sec.dom.window.document.querySelector('[data-st-bar-text]').textContent);
    // open_at is the tip the plan read plus the delay; the seal lands a block or two after that tip
    if (choice === 'capsule') check(c.state.done.openAt - height >= S0.capsuleDelay(c.state.rate) - 5 && S0.capsuleDelay(c.state.rate) >= 7 * 24 * 12, label + ': it opens at block ' + c.state.done.openAt + ', ' + (c.state.done.openAt - height) + ' blocks on (at least 7 days of idle heartbeats; ' + c.state.rate.toFixed(1) + ' blocks an hour over the last day)');
    if (choice === 'capsule') check($('[data-st-keep]').hidden === false && JSON.parse(store.get('pointcast-chain-apps/capsules/v1'))[0].capsule === c.state.file.capsule && /DOWNLOAD THE CAPSULE FILE NOW/.test($('[data-st-keep-text]').textContent), label + ': the capsule file is offered for download and kept where Time Capsules finds it');
    if (choice === 'stamp') check($('[data-st-keep]').hidden === false && N.readReceipt($('[data-st-keep-pre]').textContent).height === height, label + ': the Notary receipt is shown and offered for download');
    const v = await verifyBlock(height);
    check(passkey ? v.failed.length === 0 && v.skipped.every((s) => s === 'link_forward' || /^sig:\d+$/.test(s)) : verifyOk(v), label + ': block ' + height + ' passes every Verify a block check that runs' + (v.skipped.length ? ' (skipped: ' + v.skipped.join(', ') + ')' : ''));
    if (passkey) check(/does not check a passkey’s P-256 signature/.test($('[data-st-done-line]').textContent + ' ' + $('[data-st-next]').textContent), label + ': step 4 says Verify a block does not check the passkey’s signature');
  };
  for (const ch of S0.CHOICES) await runView(ch);
  await runView('stamp', { passkey: true });
}

// 6. the public devnet, read only
if (h.flag('--live')) {
  const live = await reach(DEVNET.url);
  if (!live) say('note the public devnet is not reachable');
  else if (live.genesis_hash !== DEVNET.genesis) say('note the public devnet reports another genesis (' + live.genesis_hash.slice(0, 12) + '…): it was reset, and this page pins ' + DEVNET.genesis.slice(0, 12) + '…');
  else {
    const lc = await K.connectPinned(DEVNET.url, { pinned: DEVNET.genesis, env: { fetch: sturdyFetch } });
    const lp = S0.passkeyPlace({ params: lc.params, origin: 'https://pointcast.xyz', webauthn: true });
    check(lp.ok && lp.rpId === 'pointcast.xyz' && lp.origins.length === 1, 'live: launch record 7 names https://pointcast.xyz alone, RP ID ' + lp.rpId);
    const ln = K.makeNet(DEVNET.url, { fetch: sturdyFetch });
    const ld = D.readDaily(await ln.get('/daily'));
    check(ld && ld.status === 'on' && Boolean(ld.lot), 'live: the house is on: lot ' + (ld && ld.lot && ld.lot.n) + ', least bid ' + D.leastBid(ld) + ', ' + (ld && ld.lot && ld.lot.bids) + ' bids');
    const rate = await S0.dayRate(ln, live.height);
    const delay = S0.capsuleDelay(rate);
    check(rate >= 12 && delay >= 2016, 'live: the last day sealed ' + rate.toFixed(1) + ' blocks an hour, so a capsule sealed now opens ' + delay + ' blocks on: ' + S0.C.etaWords(delay, rate));
  }
}
h.finish();
