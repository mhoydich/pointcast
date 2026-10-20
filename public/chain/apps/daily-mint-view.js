// daily-mint-view.js: the DOM side of The Daily Mint (/chain/daily-mint). It
// draws what daily-mint.js returns into the skeleton the Astro page renders.
//
// Rules, held by tests/chain-app-daily-mint.test.mjs:
// - Everything the devnet sends (addresses, words, days) is written with
//   textContent or a text node. Never markup, an href or a style value. The one
//   image sink is a card: an <img> whose src is a data: URI built from an SVG
//   this page drew itself from a recipe and audited (first-mint.js auditSvg).
// - Lazy: importing this module touches no network and no DOM. start() waits for
//   the load event, an idle callback, the section within 400px of the viewport
//   and a visible tab, then reads the devnet.
// - Reads are GETs. The page writes only when the person presses "Send the
//   bid" (or "Ask for play ATTN") after reading what will be sent, with a key
//   made in this browser, to the devnet the page points at.
// - devnet: no value, may reset. Play ATTN is never promised any.

import * as D from './daily-mint.js';
import { mountKeyPanel } from './key-panel.js';
import { connectPinned, describeError, duration, groups, makeNet, plural, pinnedStatus, resolveApi, shortAddr, utcClock, whenReady } from './chain-kit.js';

const POLL_MS = 10000;

function el(doc, tag, cls, text) {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

const STATE_WORD = { open: 'OPEN', settling: 'CLOSED · SETTLING', sold: 'SOLD', shelf: 'TOWN SHELF' };

/** An <img> showing a card from a data: URI this page built itself. */
function cardImg(doc, card, alt) {
  const img = el(doc, 'img', 'dm-card__img');
  img.src = card.uri;
  img.alt = alt;
  img.width = 360;
  img.height = 480;
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}

export function mount(root, env = {}) {
  const doc = root.ownerDocument;
  const win = env.window || doc.defaultView;
  const q = (sel) => root.querySelector(sel);
  const ds = root.dataset;
  const where = resolveApi(env.search !== undefined ? env.search : win.location.search, { api: String(ds.api || ''), genesis: String(ds.genesis || '') });
  if (!/^https?:\/\/[a-z0-9.:-]+$/i.test(where.api)) return null;
  const net = makeNet(where.api, { fetch: env.fetch });
  const now = env.now || (() => Date.now());
  const S = { daily: null, cardKey: '', readAt: 0, begun: false, halted: false, busy: false, chain: null, balance: null, plan: null, timer: 0, tick: 0, audit: null, words: new Set() };
  const set = (sel, text) => { const n = q(sel); if (n) n.textContent = text; };
  const say = (text, state) => { set('[data-dm-status]', text); if (state) root.dataset.state = state; };
  const panel = q('[data-key-panel]');
  const keys = panel ? mountKeyPanel(panel, { window: win, storage: env.storage, supported: env.supported }) : null;

  // ------------------------------------------------------------ the lot

  function paintLot() {
    const d = S.daily;
    if (!d) return;
    const lot = d.lot;
    root.dataset.lot = lot ? 'open' : d.status === 'on' ? 'between' : d.status;
    set('[data-dm-house]', d.status === 'on' ? 'The house is open.' : d.status === 'paused' ? 'The house is paused: no new lots; refunds and settlement continue. ' + d.reason : 'The Daily Mint is off. ' + d.reason);
    set('[data-dm-lot-n]', lot ? 'Lot ' + String(lot.n).padStart(4, '0') : 'No lot open');
    set('[data-dm-lot-day]', lot ? lot.day + ' · closes at the next 00:00 UTC unless a late bid moves it' : d.status === 'on' ? 'The next lot opens within a few blocks of the last one settling.' : '');
    set('[data-dm-minbid]', lot ? String(D.leastBid(d)) + ' play ATTN' : '–');
    set('[data-dm-bids]', lot ? plural(lot.bids, 'bid') : '–');
    set('[data-dm-leader]', lot ? (lot.leader ? shortAddr(lot.leader.sender) + ' at ' + (lot.leader.amount === null ? '?' : lot.leader.amount) + (lot.leader.words.length ? ' · ' + lot.leader.words.join(' ') : '') : 'no bids yet') : '–');
    set('[data-dm-auctioneer]', d.addresses ? d.addresses.auctioneer : '–');
    set('[data-dm-faucet-addr]', d.addresses ? d.addresses.faucet : '–');
    set('[data-dm-shelf]', d.addresses ? d.addresses.shelf : '–');
    set('[data-dm-height]', d.height === null ? '–' : '#' + groups(d.height));
    set('[data-dm-tally]', (d.owedRefunds === null ? '?' : d.owedRefunds) + ' refunds owed · held ' + (d.held === null ? '?' : d.held) + ' · ' + (d.violations === null ? '?' : d.violations) + ' violations found by the house’s own count');
    const rules = q('[data-dm-rules]');
    if (rules && d.rules) {
      rules.replaceChildren();
      const rows = [
        ['Reserve', d.rules.reserve + ' play ATTN'],
        ['Raise by at least', d.rules.increment_bps / 100 + '%, or 1'],
        ['Late-bid window', duration(d.rules.snipe_ms) + ' (moves the close, at most ' + duration(d.rules.snipe_cap_ms) + ' late)'],
        ['Bids per account', 'at most ' + d.rules.max_bids_per_sender + ' a lot'],
        ['Refund within', plural(d.rules.refund_blocks, 'block')],
        ['Settle within', plural(d.rules.settle_blocks, 'block') + ' of the close'],
        ['Words on a card', 'up to ' + d.rules.max_words],
        ['Length of a lot day', duration(d.rules.day_ms) + (d.standard ? '' : ' (a local test, not the standard day)')],
      ];
      for (const [k, v] of rows) { const row = el(doc, 'div'); row.append(el(doc, 'dt', '', k), el(doc, 'dd', '', v)); rules.append(row); }
    }
    paintCountdown();
  }

  function paintCountdown() {
    const left = S.daily ? D.remainingMs(S.daily.lot, S.readAt, now()) : null;
    set('[data-dm-closes]', left === null ? '–' : left > 0 ? duration(left) : 'closing now');
    const bar = q('[data-dm-closes-bar]');
    if (bar) bar.dataset.low = left !== null && left < 300000 ? 'yes' : 'no';
  }

  async function paintCards() {
    const d = S.daily;
    if (!d) return;
    const host = q('[data-dm-card]');
    if (host && d.lot) {
      let pc = null;
      try { pc = await D.previewCard(net, where.genesis || (S.status && S.status.genesis), d); } catch { pc = null; }
      host.replaceChildren();
      if (pc && pc.uri) {
        host.append(cardImg(doc, pc, 'The card for lot ' + d.lot.n + ', drawn from the chain: ' + (d.lot.leader && d.lot.leader.words.length ? d.lot.leader.words.join(' ') : 'no words yet') + '.'));
        set('[data-dm-card-note]', 'Drawn in your browser from the lot’s opening block, with the leader’s words. If someone outbids with other words, it changes.');
      } else {
        host.append(el(doc, 'p', 'ca-empty', 'The card could not be drawn from the chain just now.'));
        set('[data-dm-card-note]', '');
      }
    } else if (host) {
      host.replaceChildren(el(doc, 'p', 'ca-empty', 'No lot is open, so there is no card to show.'));
    }
  }

  function paintRecent() {
    const body = q('[data-dm-recent]');
    if (!body || !S.daily) return;
    body.replaceChildren();
    if (!S.daily.recent.length) { const tr = el(doc, 'tr'); const td = el(doc, 'td', '', 'No lots yet.'); td.colSpan = 6; tr.append(td); body.append(tr); return; }
    for (const l of S.daily.recent) {
      const tr = el(doc, 'tr');
      const state = D.lotState(l);
      const card = l.recipe ? D.cardFor(l.recipe, l.n) : null;
      const c0 = el(doc, 'th', 'dm-lot');
      c0.scope = 'row';
      c0.append(el(doc, 'span', '', String(l.n).padStart(4, '0')));
      tr.append(c0);
      tr.append(el(doc, 'td', '', l.day));
      tr.append(el(doc, 'td', '', STATE_WORD[state]));
      tr.append(el(doc, 'td', 'num', String(l.bids)));
      tr.append(el(doc, 'td', '', state === 'sold' ? shortAddr(l.mintTo || l.winner) + ' · ' + l.price + (l.words.length ? ' · ' + l.words.join(' ') : '') : state === 'shelf' ? 'Town Shelf, no bids' : state === 'settling' ? 'settling at the close' : 'open'));
      const c5 = el(doc, 'td', 'dm-thumb');
      if (card) { const img = cardImg(doc, card, 'Card of lot ' + l.n); img.className = 'dm-thumb__img'; c5.append(img); } else c5.textContent = '–';
      tr.append(c5);
      body.append(tr);
    }
  }

  async function readHouse() {
    const st = await pinnedStatus(net, where.genesis || null);
    S.status = st;
    const json = await net.get('/daily');
    const d = D.readDaily(json);
    if (!d) throw new Error('the devnet’s /daily is not the shape this page reads');
    S.daily = d;
    S.readAt = now();
    return d;
  }

  async function refresh({ cards = true } = {}) {
    if (S.busy || S.halted) return;
    S.busy = true;
    root.dataset.busy = 'yes';
    try {
      await readHouse();
      const banner = q('[data-dm-genesis]');
      if (banner) banner.hidden = true;
      paintLot();
      paintRecent();
      set('[data-dm-meta]', 'Read ' + plural(net.count, 'request') + ' so far · last read ' + utcClock(S.readAt) + ' · ' + net.api + ' · ' + S.status.chainId + (where.override ? ' · local override' : ''));
      say('Updated ' + utcClock(S.readAt) + '.', 'ready');
      // The open lot's card is spelled with the leader's words, so it is drawn again when the lot or its leader changes.
      const key = S.daily.lot ? S.daily.lot.n + ':' + (S.daily.lot.leader ? S.daily.lot.leader.sender + ':' + S.daily.lot.leader.words.join(' ') : '') : '';
      if (cards || key !== S.cardKey) { S.cardKey = key; await paintCards(); }
      paintBidState();
    } catch (e) {
      if (e && e.name === 'GenesisChanged') {
        S.halted = true;
        const banner = q('[data-dm-genesis]');
        if (banner) { banner.hidden = false; banner.textContent = describeError(e); }
        say('GENESIS CHANGED. Nothing below is read, and nothing can be sent.', 'changed');
      } else say('The devnet did not answer: ' + describeError(e) + (S.daily ? ' The lot shown is from the last read.' : ''), 'down');
    } finally {
      S.busy = false;
      root.dataset.busy = 'no';
    }
  }

  // ------------------------------------------------------------ the house check

  async function runAudit() {
    const btn = q('[data-dm-audit]');
    const out = q('[data-dm-audit-out]');
    const sum = q('[data-dm-audit-summary]');
    if (!btn || !out || S.halted) return;
    btn.disabled = true;
    out.replaceChildren();
    if (sum) { sum.textContent = 'Reading the blocks…'; sum.dataset.state = 'busy'; }
    try {
      const r = await D.auditHouse(net, { onProgress: (n, total) => { if (sum) sum.textContent = 'Read ' + groups(n) + ' of ' + groups(total) + ' blocks…'; } });
      S.audit = r;
      if (sum) {
        sum.dataset.state = r.ok ? 'ok' : 'bad';
        sum.textContent = (r.ok ? 'AGREES. ' : 'DISAGREES. ') + groups(r.blocks) + ' blocks replayed, ' + plural(r.lots, 'lot') + ', ' + plural(r.refunds, 'refund') + ' paid (' + r.refunded + ' play ATTN), ' + r.owed + ' owed, ' + plural(r.violations.length, 'violation') + '. ' + (r.agree ? 'The replay equals the devnet’s own report.' : 'The replay differs from the devnet’s own report.');
      }
      for (const l of r.lines) {
        const li = el(doc, 'li', 'ca-ck');
        li.dataset.state = l.kind === 'ok' ? 'pass' : l.kind === 'fail' ? 'fail' : 'skip';
        const m = el(doc, 'span', 'ca-ck__m', l.kind === 'ok' ? '✓' : l.kind === 'fail' ? '✗' : '·');
        m.setAttribute('aria-hidden', 'true');
        li.append(m, el(doc, 'span', 'ca-ck__s', l.kind === 'ok' ? 'OK' : l.kind === 'fail' ? 'FAIL' : 'NOTE'), el(doc, 'span', 'ca-ck__t', l.text));
        out.append(li);
      }
      for (const m of r.mismatches) {
        const li = el(doc, 'li', 'ca-ck');
        li.dataset.state = 'fail';
        li.append(el(doc, 'span', 'ca-ck__m', '✗'), el(doc, 'span', 'ca-ck__s', 'DISAGREES'), el(doc, 'span', 'ca-ck__t', m));
        out.append(li);
      }
    } catch (e) {
      if (sum) { sum.dataset.state = 'bad'; sum.textContent = 'The check could not run: ' + describeError(e); }
    } finally {
      btn.disabled = false;
    }
  }

  // ------------------------------------------------------------ bidding

  function paintBidState() {
    const k = keys && keys.key();
    const d = S.daily;
    const faucet = q('[data-dm-faucet]');
    const review = q('[data-dm-review]');
    const open = Boolean(d && d.status === 'on' && d.lot && !S.halted);
    if (faucet) faucet.disabled = !k || !open;
    if (review) review.disabled = !k || !open;
    set('[data-dm-balance]', k ? (S.balance === null ? 'reading…' : S.balance + ' play ATTN') : 'make a key first');
    const amount = q('[data-dm-amount]');
    if (amount) {
      amount.disabled = !k || !open;
      if (d && d.lot) { const least = D.leastBid(d); if (least !== null) amount.placeholder = 'at least ' + least; }
    }
    const gift = q('[data-dm-gift]');
    if (gift) gift.disabled = !k || !open;
    for (const cb of root.querySelectorAll('[data-dm-word]')) cb.disabled = !k || !open || (!cb.checked && S.words.size >= ((d && d.rules && d.rules.max_words) || D.DAILY_RULES.max_words));
  }

  async function loadBalance() {
    const k = keys && keys.key();
    if (!k) { S.balance = null; paintBidState(); return; }
    try { S.balance = (await D.readAccount(net, k.sender)).balance; } catch { S.balance = null; }
    paintBidState();
  }

  function buildWords() {
    const host = q('[data-dm-words]');
    if (!host) return;
    host.replaceChildren();
    for (const w of D.DAILY_LEXICON) {
      const lab = el(doc, 'label', 'dm-word');
      const cb = el(doc, 'input', 'ca-checkbox');
      cb.type = 'checkbox';
      cb.value = w;
      cb.disabled = true;
      cb.setAttribute('data-dm-word', '');
      cb.addEventListener('change', () => { if (cb.checked) S.words.add(w); else S.words.delete(w); paintBidState(); });
      lab.append(cb, el(doc, 'span', '', w));
      host.append(lab);
    }
  }

  function readPlan() {
    const k = keys && keys.key();
    return D.planBid({
      daily: S.daily,
      sender: k ? k.sender : '',
      amount: (q('[data-dm-amount]') || {}).value || '',
      words: [...S.words],
      gift: (q('[data-dm-gift]') || {}).value || '',
      balance: S.balance,
    });
  }

  function showConfirm(plan) {
    const box = q('[data-dm-confirm]');
    const list = q('[data-dm-confirm-list]');
    const errs = q('[data-dm-errors]');
    if (!box || !list) return;
    if (errs) { errs.replaceChildren(); }
    if (!plan.ok) {
      box.hidden = true;
      if (errs) { for (const e of plan.errors) errs.append(el(doc, 'li', '', e)); errs.hidden = false; }
      return;
    }
    if (errs) errs.hidden = true;
    const k = keys.key();
    list.replaceChildren();
    if (plan.words.length || plan.gift) list.append(el(doc, 'li', '', 'A post on channel DLY, titled “' + plan.title + '”. It is how your words and gift address reach the card.'));
    list.append(el(doc, 'li', '', 'A transfer of ' + plan.amount + ' play ATTN from ' + k.sender + ' to the auctioneer ' + S.daily.addresses.auctioneer + '.'));
    set('[data-dm-confirm-where]', 'Sent to ' + net.api + ' (' + S.status.chainId + ').');
    box.hidden = false;
    S.plan = plan;
  }

  async function send() {
    const k = keys && keys.key();
    const plan = S.plan;
    const result = q('[data-dm-result]');
    const sendBtn = q('[data-dm-send]');
    if (!k || !plan || !plan.ok || S.halted) return;
    sendBtn.disabled = true;
    const say2 = (t, state) => { if (result) { result.hidden = false; result.dataset.state = state || ''; set('[data-dm-result-text]', t); } };
    try {
      say2('Checking the devnet’s genesis…', '');
      if (!S.chain) S.chain = await (env.connect || connectPinned)(net.api, { pinned: where.genesis || null, env: { fetch: env.fetch } });
      await refresh({ cards: false });
      const fresh = D.planBid({ daily: S.daily, sender: k.sender, amount: plan.amount, words: plan.words, gift: plan.gift || '', balance: S.balance });
      if (!fresh.ok) { say2('The lot changed while you read: ' + fresh.errors[0], 'bad'); return; }
      const r = await D.sendBid({ chain: S.chain, net, key: k, daily: S.daily, plan: fresh, onStage: (s) => say2(s.startsWith('post') ? 'Sending the card words… (' + s.slice(5) + ')' : 'Sending the bid… (' + s.slice(4) + ')', '') });
      const box = q('[data-dm-confirm]');
      if (box) box.hidden = true;
      S.plan = null;
      say2('Your bid is in block ' + r.height + '. Bid transaction ' + r.bidTx + (r.postTx ? ' · words post ' + r.postTx : '') + '. If someone outbids you, the house sends your play ATTN back within three blocks.', 'ok');
      await refresh({ cards: true });
      await loadBalance();
    } catch (e) {
      say2('Not sent, or not confirmed: ' + describeError(e), 'bad');
    } finally {
      sendBtn.disabled = false;
    }
  }

  async function faucet() {
    const k = keys && keys.key();
    const out = q('[data-dm-faucet-out]');
    if (!k || !out || S.halted) return;
    const btn = q('[data-dm-faucet]');
    btn.disabled = true;
    try {
      const r = await D.claimFaucet(net, k.sender);
      out.textContent = 'The faucet sent ' + (r.amount === null ? 'play ATTN' : r.amount + ' play ATTN') + ' to ' + shortAddr(k.sender) + '. It lands in the next block.';
      out.dataset.state = 'ok';
      win.setTimeout(loadBalance, 4500);
    } catch (e) {
      out.textContent = describeError(e);
      out.dataset.state = 'bad';
    } finally {
      btn.disabled = false;
      paintBidState();
    }
  }

  // ------------------------------------------------------------ wiring

  buildWords();
  const auditBtn = q('[data-dm-audit]');
  if (auditBtn) { auditBtn.disabled = false; auditBtn.addEventListener('click', runAudit); }
  const faucetBtn = q('[data-dm-faucet]');
  if (faucetBtn) faucetBtn.addEventListener('click', faucet);
  const reviewBtn = q('[data-dm-review]');
  if (reviewBtn) reviewBtn.addEventListener('click', () => showConfirm(readPlan()));
  const sendBtn = q('[data-dm-send]');
  if (sendBtn) sendBtn.addEventListener('click', send);
  const cancel = q('[data-dm-cancel]');
  if (cancel) cancel.addEventListener('click', () => { const box = q('[data-dm-confirm]'); if (box) box.hidden = true; S.plan = null; });
  if (keys) keys.onChange(() => { S.balance = null; S.plan = null; const box = q('[data-dm-confirm]'); if (box) box.hidden = true; paintBidState(); loadBalance(); });

  return {
    state: S,
    net,
    where,
    keys,
    async begin() {
      if (S.begun) return;
      S.begun = true;
      root.dataset.state = 'reading';
      say('Reading the house…', 'reading');
      if (keys) await keys.ready;
      await refresh();
      S.timer = win.setInterval(() => { if (doc.visibilityState !== 'hidden' && !S.halted) refresh({ cards: false }); }, POLL_MS);
      S.tick = win.setInterval(() => { if (doc.visibilityState !== 'hidden') paintCountdown(); }, 1000);
    },
    refresh,
    runAudit,
    faucet,
    send,
    showConfirm,
    readPlan,
    loadBalance,
    stop() { win.clearInterval(S.timer); win.clearInterval(S.tick); },
  };
}

export function start(root, env = {}) {
  let c = null;
  try { c = mount(root, env); } catch { c = null; }
  if (!c) { root.dataset.state = 'down'; return null; }
  if (env.eager) { c.begin(); return c; }
  whenReady(root, () => c.begin(), env);
  return c;
}
