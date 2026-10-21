// start-view.js: the DOM side of "Start here" (/chain/start). It draws what
// start.js and the three app modules return into the skeleton the Astro page
// renders, one step at a time.
//
// Rules, held by tests/chain-app-start.test.mjs:
// - Everything the devnet sends, and every field of a transaction, is written
//   with textContent. Never markup or a style value. The links this page sets
//   are same-site paths start.js blockLinks builds from a block number (and,
//   under a local ?devnet=, that localhost origin); the one download is a Blob
//   this page builds from a receipt or capsule file it just made.
// - Lazy: importing this module touches no network and no DOM. start() waits for
//   the load event and an idle callback, then reads the devnet (GET only).
// - Writes happen only on a button: the faucet on "Ask the faucet", the bid, the
//   stamp or the capsule on "Sign and send", after the card has shown the exact
//   transaction. The stamp's three lines are stored (unsigned, as every post's
//   body is) when "Review" builds the post; the card says so.
// - devnet: no value, may reset. Play ATTN is never promised any.

import * as S0 from './start.js';
import { mountKeyPanel } from './key-panel.js';
import { MY_SLOT } from './capsules-view.js';
import { cleanText, connectPinned, describeError, duration, groups, makeNet, pinnedStatus, plural, resolveApi, sendFailureText, shortAddr, shortHex, utc, utcClock } from './chain-kit.js';

const { D, N, C } = S0;
const POLL_MS = 15000;
const ORDER = S0.STEPS;
const TITLES = { key: 'MAKE YOUR KEY', attn: 'TAKE 100 PLAY ATTN', act: 'DO ONE THING', see: 'SEE IT IN A BLOCK' };
const cleanOrigin = (o) => cleanText(String(o || 'this site'), 80);

function el(doc, tag, cls, text) {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

export function mount(root, env = {}) {
  const doc = root.ownerDocument;
  const win = env.window || doc.defaultView;
  const q = (sel) => root.querySelector(sel);
  const ds = root.dataset;
  const where = resolveApi(env.search !== undefined ? env.search : win.location.search, { api: String(ds.api || ''), genesis: String(ds.genesis || '') });
  if (!/^https?:\/\/[a-z0-9.:-]+$/i.test(where.api)) return null;
  const net = makeNet(where.api, { fetch: env.fetch, timeoutMs: env.timeoutMs });
  const now = env.now || (() => Date.now());
  const storage = env.storage !== undefined ? env.storage : (() => { try { return win.localStorage; } catch { return null; } })();
  const credentials = env.credentials !== undefined ? env.credentials : (win.navigator && win.navigator.credentials) || null;
  const origin = env.origin !== undefined ? env.origin : win.location.origin;
  const S = {
    begun: false, halted: false, status: null, chain: null, daily: null, readAt: 0, rate: 12, balance: null, skipped: false,
    choice: '', mode: 'play', passkey: null, place: null, pending: null, acting: false, done: null, file: null, receipt: null,
    sentence: '', undownloaded: false, kept: false, timer: 0, lastStep: '',
  };
  const set = (sel, text) => { const n = q(sel); if (n) n.textContent = text; };
  const say = (text, state) => { set('[data-st-status]', text); if (state) root.dataset.state = state; };
  const panel = q('[data-key-panel]');
  const keys = panel ? mountKeyPanel(panel, { window: win, storage: env.storage, supported: env.supported }) : null;

  // ------------------------------------------------------------ which key signs

  function passkeyActive() { return S.mode === 'passkey' && Boolean(S.passkey) && Boolean(S.place && S.place.ok); }
  /** The key that signs: the passkey account when the person chose it, else the play key. Null when there is none. */
  function activeKey() {
    if (passkeyActive()) return S0.passkeyKey(S.passkey, { rpId: S.place.rpId, credentials });
    return keys ? keys.key() : null;
  }

  // ------------------------------------------------------------ the steps

  function stepNow() {
    if (S.done) return 'see';
    if (!activeKey()) return 'key';
    if (!S.skipped && !(S.balance > 0)) return 'attn';
    return 'act';
  }

  function paintSteps() {
    const cur = stepNow();
    const at = ORDER.indexOf(cur);
    for (const k of ORDER) {
      const li = q('[data-st-step="' + k + '"]');
      const i = ORDER.indexOf(k);
      const state = (k === 'see' && S.done) || i < at ? 'done' : i === at ? 'now' : 'todo';
      if (li) li.dataset.state = state;
      const b = q('[data-st-badge="' + k + '"]');
      if (b) {
        const word = state === 'done' ? (k === 'attn' && S.skipped && !(S.balance > 0) ? 'SKIPPED' : 'DONE') : state === 'now' ? 'NOW' : 'NEXT';
        if (b.textContent !== word) b.textContent = word;
        b.dataset.state = state === 'done' ? 'ok' : state === 'now' ? 'now' : '';
      }
      const seg = root.ownerDocument.querySelector('[data-st-bar] [data-seg="' + k + '"]');
      if (seg) seg.dataset.on = state === 'done' ? 'yes' : state === 'now' ? 'now' : 'no';
    }
    const bar = root.ownerDocument.querySelector('[data-st-bar-text]');
    if (bar) bar.textContent = S.done ? 'SETUP COMPLETE · 4 OF 4 · YOUR TRANSACTION IS IN BLOCK ' + S.done.height : 'SETUP · STEP ' + (at + 1) + ' OF 4 · ' + TITLES[cur];
    paintControls();
    // A step that just became the current one takes the focus, so a keyboard or screen reader follows the path.
    if (S.lastStep && S.lastStep !== cur && S.begun) {
      const li = q('[data-st-step="' + cur + '"]');
      const reduce = typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (li && typeof li.scrollIntoView === 'function') li.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      const h = q('[data-st-h="' + cur + '"]');
      if (h && typeof h.focus === 'function') h.focus({ preventScroll: true });
    }
    S.lastStep = cur;
  }

  function paintWho() {
    const k = activeKey();
    set('[data-st-who]', k ? 'Signing as ' + k.sender + (passkeyActive() ? ' · a passkey account' : ' · the play key') + '.' : 'No key yet.');
    const pkUse = q('[data-st-pk-use]');
    const pkOff = q('[data-st-pk-off]');
    const pkMake = q('[data-st-pk-make]');
    const ok = Boolean(S.place && S.place.ok);
    if (pkMake) { pkMake.disabled = !ok || S.acting; pkMake.hidden = Boolean(S.passkey) && ok; }
    if (pkUse) { pkUse.hidden = !(ok && S.passkey && S.mode !== 'passkey'); pkUse.disabled = S.acting; }
    if (pkOff) { pkOff.hidden = S.mode !== 'passkey'; pkOff.disabled = S.acting; }
  }

  function paintControls() {
    const k = activeKey();
    const open = !S.halted && Boolean(S.status);
    const faucet = q('[data-st-faucet]');
    if (faucet) faucet.disabled = !k || !open || S.acting || S.balance > 0 || !(S.daily && S.daily.status === 'on');
    const skip = q('[data-st-skip]');
    if (skip) skip.disabled = !k || !open || S.acting || S.balance > 0 || S.skipped;
    set('[data-st-balance]', k ? (S.balance === null ? 'reading…' : S.balance + ' play ATTN') : 'make a key first');
    const ready = Boolean(k) && open && (S.skipped || S.balance > 0) && !S.done;
    for (const r of root.querySelectorAll('[data-st-choice]')) r.disabled = !ready || S.acting;
    const review = q('[data-st-review]');
    if (review) review.disabled = !ready || !S.choice || S.acting;
    paintWho();
  }

  function paintChoice() {
    for (const p of root.querySelectorAll('[data-st-panel]')) p.hidden = p.dataset.stPanel !== S.choice;
    paintLot();
    paintCapsuleWhen();
    paintControls();
  }

  function paintLot() {
    const d = S.daily;
    const lot = d && d.lot;
    set('[data-st-lot]', lot ? 'Lot ' + String(lot.n).padStart(4, '0') + ' · ' + lot.day : d && d.status !== 'on' ? 'The Daily Mint is not taking bids right now. ' + d.reason : 'No lot is open right now.');
    const least = lot ? D.leastBid(d) : null;
    set('[data-st-least]', least === null ? '–' : least + ' play ATTN, the least the lot takes now' + (S.balance !== null && least > S.balance ? ' (you hold ' + S.balance + ')' : ''));
    const left = lot ? D.remainingMs(lot, S.readAt, now()) : null;
    set('[data-st-closes]', left === null ? '–' : left > 0 ? duration(left) + (lot.closeAt ? ' (at ' + utc(lot.closeAt) + ', unless a late bid moves it)' : '') : 'closing now');
    set('[data-st-leader]', lot ? (lot.leader ? shortAddr(lot.leader.sender) + ' at ' + (lot.leader.amount === null ? '?' : lot.leader.amount) + ' play ATTN' : 'nobody yet: yours would be the first bid') : '–');
  }

  function paintCapsuleWhen() {
    if (!S.status) return;
    const delay = S0.capsuleDelay(S.rate);
    set('[data-st-capsule-when]', 'It opens at block ' + groups(S.status.height + delay) + ', ' + groups(delay) + ' blocks on: ' + C.etaWords(delay, S.rate) + '. A capsule waits in blocks, not minutes.');
  }

  // ------------------------------------------------------------ reading the devnet

  function halt(e) {
    S.halted = true;
    const banner = q('[data-st-genesis]');
    if (banner) { banner.hidden = false; banner.textContent = describeError(e); }
    say('GENESIS CHANGED. Nothing below is read, and nothing can be sent.', 'changed');
    paintControls();
  }

  async function readHouse() {
    S.status = await pinnedStatus(net, where.genesis || null);
    const d = D.readDaily(await net.get('/daily'));
    S.daily = d;
    S.readAt = now();
  }

  async function loadBalance() {
    const k = activeKey();
    if (!k) { S.balance = null; return; }
    try { S.balance = (await D.readAccount(net, k.sender)).balance; } catch { /* the last number read stands */ }
  }

  async function refresh() {
    if (S.halted) return;
    try {
      await readHouse();
      const banner = q('[data-st-genesis]');
      if (banner) banner.hidden = true;
      await loadBalance();
      set('[data-st-meta]', 'Read ' + plural(net.count, 'request') + ' so far · last read ' + utcClock(S.readAt) + ' · ' + net.api + ' · ' + S.status.chainId + ' · newest block #' + groups(S.status.height) + (where.override ? ' · local override' : ''));
      if (root.dataset.state !== 'ready') say(where.override ? 'Ready. A local devnet: the page reads its own genesis, not a pinned one.' : 'Ready. The devnet answered, and its genesis is the one this page pins.', 'ready');
      paintChoice();
      paintSteps();
    } catch (e) {
      if (e && e.name === 'GenesisChanged') halt(e);
      else say('The devnet did not answer: ' + describeError(e), 'down');
    }
  }

  async function connect() {
    if (!S.chain) S.chain = await (env.connect || connectPinned)(net.api, { pinned: where.genesis || null, env: { fetch: env.fetch, timeoutMs: env.timeoutMs } });
    return S.chain;
  }

  // ------------------------------------------------------------ step 1: passkeys

  async function checkPasskeys() {
    const why = q('[data-st-pk-why]');
    try {
      const chain = await connect();
      S.place = S0.passkeyPlace({ params: chain.params, origin, webauthn: Boolean(credentials && typeof credentials.create === 'function' && (env.credentials || win.PublicKeyCredential)) });
    } catch (e) {
      S.place = { ok: false, rpId: '', origins: [], reason: e && e.name === 'GenesisChanged' ? 'The devnet was reset: nothing can be signed.' : 'The devnet’s passkey rules could not be read: ' + describeError(e) };
    }
    if (S.place.ok) S.passkey = S0.loadPasskey(storage);
    // Off because of the site: the note above already says where passkeys work, so say only what that means here.
    const offSite = !S.place.ok && S.place.origins.length && !S.place.origins.includes(origin);
    if (why) why.textContent = S.place.ok ? (S.passkey ? 'This browser remembers a passkey account, ' + S.passkey.address + '. You can sign with it instead.' : 'Passkeys work here: the chain names ' + S.place.origins.join(' and ') + '. Making one asks your device; nothing is signed or sent to the devnet.') : offSite ? 'Not on this copy of the page (' + cleanOrigin(origin) + '), so the passkey button is off. The play key works anywhere.' : S.place.reason;
    paintWho();
  }

  async function makePasskey() {
    const why = q('[data-st-pk-why]');
    if (!S.place || !S.place.ok || S.acting) return;
    try {
      if (why) why.textContent = 'Waiting for your passkey…';
      const w = await S0.makePasskey({ rpId: S.place.rpId, credentials });
      S.passkey = w;
      const kept = storage ? S0.storePasskey(storage, w) : false;
      S.mode = 'passkey';
      S.balance = null;
      if (why) why.textContent = 'Passkey account made: ' + w.address + '. It lives in your passkey; this browser ' + (kept ? 'remembers which one (its public key, nothing secret).' : 'could not remember which one, so keep this tab open.');
      await loadBalance();
      paintSteps();
    } catch (e) {
      if (why) why.textContent = 'No passkey made: ' + describeError(e);
    }
  }

  // ------------------------------------------------------------ step 2: play ATTN

  async function faucet() {
    const k = activeKey();
    const out = q('[data-st-faucet-out]');
    if (!k || S.halted || S.acting) return;
    S.acting = true;
    paintControls();
    try {
      if (out) { out.textContent = 'Asking the faucet…'; out.dataset.state = ''; }
      const r = await S0.takeAttn(net, k.sender, { waitMs: env.fundWaitMs || S0.LIMITS.fundWaitMs });
      S.balance = r.balance;
      if (out) {
        out.textContent = r.balance > 0
          ? (r.already ? 'This account already took its play ATTN from the faucet. ' : 'The faucet sent ' + (r.amount === null ? 'play ATTN' : r.amount + ' play ATTN') + ' and it landed. ') + 'You hold ' + r.balance + ' play ATTN.'
          : 'The faucet took the request, but the play ATTN has not landed yet. Wait a few seconds; the page reads it again.';
        out.dataset.state = r.balance > 0 ? 'ok' : '';
      }
    } catch (e) {
      if (out) { out.textContent = describeError(e) + ' You can still stamp a sentence or seal a capsule: press Skip.'; out.dataset.state = 'down'; }
    } finally {
      S.acting = false;
      paintSteps();
    }
  }

  // ------------------------------------------------------------ step 3: review, sign, send

  const progress = (t, state) => { const p = q('[data-st-progress]'); if (p) { p.hidden = false; p.dataset.state = state || ''; } set('[data-st-progress-text]', t); };
  function errors(list) {
    const ul = q('[data-st-errors]');
    if (!ul) return;
    ul.replaceChildren();
    for (const e of list) ul.append(el(doc, 'li', '', e));
    ul.hidden = list.length === 0;
  }

  /** Show the card for a transaction a module is about to sign, and wait for Sign (true) or Cancel (false). */
  function showCard(card) {
    const box = q('[data-st-card]');
    set('[data-st-card-head]', card.headline);
    const fields = q('[data-st-card-fields]');
    if (fields) {
      fields.replaceChildren();
      for (const [k, v] of card.fields) { const row = el(doc, 'div'); row.append(el(doc, 'dt', '', k), el(doc, 'dd', '', v)); fields.append(row); }
    }
    set('[data-st-card-digest]', card.digest);
    const sdk = q('[data-st-card-sdk]');
    if (sdk) sdk.hidden = !card.sdk;
    if (card.sdk) {
      set('[data-st-card-sdk-title]', card.sdk.title);
      const list = q('[data-st-card-sdk-list]');
      if (list) {
        list.replaceChildren();
        for (const t of card.sdk.allowed) list.append(el(doc, 'li', '', t));
        for (const t of card.sdk.notAllowed) list.append(el(doc, 'li', '', 'Not: ' + t));
        list.append(el(doc, 'li', '', 'Lasts: ' + card.sdk.lasts), el(doc, 'li', '', 'Undo: ' + card.sdk.undo));
      }
    }
    set('[data-st-card-note]', cardNote(card));
    set('[data-st-card-where]', 'Signed ' + (passkeyActive() ? 'by your passkey (your device asks next)' : 'in this browser by the play key') + ' and sent to ' + net.api + ' (' + card.chainId + ', genesis ' + shortHex(card.genesis, 10, 6) + ').');
    if (box) box.hidden = false;
    progress('Nothing is signed yet. Read the card, then press Sign and send, or Cancel.', '');
    const h = q('[data-st-card-h]');
    if (box && typeof box.scrollIntoView === 'function') box.scrollIntoView({ block: 'start' });
    if (h && typeof h.focus === 'function') h.focus({ preventScroll: true });
    return new Promise((resolve) => { S.pending = { card, resolve }; });
  }

  function cardNote(card) {
    if (card.kind === 'transfer') return 'If someone outbids you, the house sends your ' + card.fields.find((f) => f[0] === 'amount')[1] + ' play ATTN back within 3 blocks. A transfer cannot be taken back.';
    if (card.kind === 'publish_block' && card.context.sentence !== undefined) return 'The body is the three Notary lines: the format, your sentence’s SHA-256 (' + card.context.sha256 + '), its length in bytes, nothing else. They were stored in the devnet’s body store when you pressed Review, unsigned, as every post’s body is; your sentence itself was not sent.';
    if (card.kind === 'seal_capsule') return 'The commitment is a fingerprint of your title, your message and a fresh random salt. Your message and the salt go in the capsule file you keep, not to the devnet, until it opens.';
    return '';
  }

  function closeCard() {
    const box = q('[data-st-card]');
    if (box) box.hidden = true;
  }

  function sign(yes) {
    const p = S.pending;
    if (!p) return;
    S.pending = null;
    closeCard();
    // A bid read before the close must not land after it: refuse here, before the key signs, if the lot is about to close.
    if (yes && p.card.kind === 'transfer' && S.daily && !S0.lotStillOpen(S.daily.lot, S.readAt, now())) {
      p.resolve(false);
      return;
    }
    p.resolve(yes === true);
  }

  async function review() {
    const k = activeKey();
    if (!k || S.halted || S.acting || !S.choice || S.done) return;
    errors([]);
    const choice = S.choice;
    S.acting = true;
    paintControls();
    const p = q('[data-st-progress]');
    if (p) p.hidden = true;
    let context = () => ({});
    try {
      progress('Reading the devnet…', '');
      const chain = await connect();
      await readHouse();
      await loadBalance();
      paintLot();
      const reviewed = S0.reviewedKey(k, showCard, { context: (tx) => context(tx) });
      // The modules name their stages 'signed', 'sent' and 'waiting' (the bid prefixes them with 'bid:').
      const STAGE = { signed: 'Signed. Sending…', sent: 'Sent. Waiting for a block…', waiting: 'Sent. Waiting for a block…' };
      const onStage = (s) => progress(STAGE[String(s).split(':').pop()] || 'Working…', '');
      let r;
      if (choice === 'bid') {
        const plan = S0.bidPlan(S.daily, k.sender, S.balance);
        if (!plan.ok) { errors(plan.errors); progress('Nothing was signed or sent.', 'bad'); return; }
        if (!S0.lotStillOpen(S.daily.lot, S.readAt, now())) { errors(['Lot ' + String(plan.lot).padStart(4, '0') + ' closes in under two minutes. Wait for the next lot, or stamp or seal instead.']); progress('Nothing was signed or sent.', 'bad'); return; }
        // A bid goes only to the address the daily-mint edition’s own terms name as its creator, as on the Daily Mint’s page.
        let creator = null;
        try { creator = await D.readEditionCreator(net); } catch { creator = null; }
        if (creator !== plan.auctioneer) { errors(['The house names ' + plan.auctioneer + ' as the auctioneer, but the daily-mint edition’s own terms name ' + (creator || 'no creator that could be read') + '. Nothing was sent: a bid goes only to the address the edition names.']); progress('Nothing was signed or sent.', 'bad'); return; }
        context = () => ({ lot: plan.lot });
        progress('Building the bid…', '');
        const sent = await D.sendBid({ chain, net, key: reviewed, daily: S.daily, plan, onStage, wait: env.wait });
        r = { kind: 'bid', txHash: sent.bidTx, height: sent.height, lot: plan.lot, amount: plan.amount };
      } else if (choice === 'stamp') {
        const c = S0.checkSentence((q('[data-st-sentence]') || {}).value);
        if (!c.ok) { errors([c.error]); progress('Nothing was signed or sent.', 'bad'); return; }
        const st = await S0.stampOf(c.text);
        context = () => ({ sentence: c.text, sha256: st.sha256 });
        progress('Building the stamp…', '');
        const sent = await N.stampHash({ chain, net, key: reviewed, sha256: st.sha256, bytes: st.bytes, onStage, now, wait: env.wait });
        S.receipt = sent.receipt;
        S.sentence = c.text;
        r = { kind: 'stamp', txHash: sent.txHash, height: sent.height, sha256: st.sha256 };
      } else {
        const plan = S0.capsulePlan({ message: (q('[data-st-message]') || {}).value, title: (q('[data-st-ctitle]') || {}).value, label: (q('[data-st-clabel]') || {}).value, tip: S.status.height, perHour: S.rate, sender: k.sender });
        if (!plan.ok) { errors(plan.errors); progress('Nothing was signed or sent.', 'bad'); return; }
        progress('Building the capsule…', '');
        const sent = await C.sealCapsule({ chain, net, key: reviewed, plan, onStage, wait: env.wait, onFile: keepFile });
        r = { kind: 'capsule', txHash: sent.txHash, height: sent.height, openAt: plan.fields.openAt };
      }
      progress('In block ' + r.height + '.', 'ok');
      await finish(r, k);
    } catch (e) {
      closeCard();
      if (S.pending) { S.pending.resolve(false); S.pending = null; }
      if (e && e.code === 'declined') progress(choice === 'stamp' ? 'Not signed: you pressed Cancel. Nothing was signed or sent. (The stamp’s three lines sit unsigned in the devnet’s body store, tied to no key.)' : 'Not signed: you pressed Cancel' + (choice === 'bid' ? ', or the lot was about to close' : '') + '. Nothing was signed or sent.', 'bad');
      else if (e && e.name === 'GenesisChanged') { halt(e); progress('GENESIS CHANGED: nothing was sent.', 'bad'); }
      else if (e && (e.sendState === 'sent' || e.sendState === 'maybe')) progress(sendFailureText(e) + (S.file ? ' The capsule file is below: download it now.' : ''), 'warn');
      else progress(sendFailureText(e), 'bad');
      if (S.file) paintKeep();
    } finally {
      S.acting = false;
      paintSteps();
    }
  }

  /** The capsule file exists the moment the seal is signed (before it is sent): keep it at once. */
  function keepFile(file) {
    S.file = file;
    S.undownloaded = true;
    const box = q('[data-st-capsule-keep]');
    S.kept = Boolean(box && box.checked && storage) && S0.keepCapsuleFile(storage, MY_SLOT, file);
  }

  // ------------------------------------------------------------ step 4: the block

  /** Point a link at a same-site path start.js built. Anything else is refused and the link keeps its default. */
  function setLink(node, path) {
    if (!node || typeof path !== 'string' || !path.startsWith('/chain/')) return;
    node.href = path;
  }

  async function finish(r, k) {
    const seen = await S0.landed(net, r.txHash, r.height);
    S.done = { ...r, ...seen, sender: k.sender, passkey: k.kind === 'passkey' };
    const links = S0.blockLinks(where, r.height, String(ds.yard || ''));
    setLink(q('[data-st-link-verify]'), links.verify);
    setLink(q('[data-st-link-yard]'), links.yard);
    setLink(q('[data-st-link-obs]'), links.observatory);
    set('[data-st-link-verify]', 'Verify block ' + r.height + ' by hand →');
    set('[data-st-done-height]', '#' + groups(r.height));
    set('[data-st-done-time]', seen.timeMs ? utc(seen.timeMs) : 'not read');
    set('[data-st-done-who]', shortAddr(k.sender));
    set('[data-st-done-tx]', r.txHash);
    set('[data-st-done-hash]', seen.hash || 'not read');
    set('[data-st-done-status]', seen.included ? 'included: the devnet’s GET /tx says block ' + r.height : 'the devnet did not confirm it on a second read; check the block');
    set('[data-st-done-line]', doneLine(r));
    set('[data-st-next]', nextLine(r));
    const wait = q('[data-st-see-wait]');
    if (wait) wait.hidden = true;
    const box = q('[data-st-done]');
    if (box) box.hidden = false;
    paintKeep();
    await loadBalance();
  }

  function doneLine(r) {
    if (r.kind === 'bid') return 'Your bid of ' + r.amount + ' play ATTN on lot ' + String(r.lot).padStart(4, '0') + ' is in block ' + r.height + '. If someone outbids you, the house sends it back within 3 blocks; the highest bid at the close gets the card, minted on chain.';
    if (r.kind === 'stamp') return 'Your sentence’s fingerprint is stamped in block ' + r.height + '. The stamp shows this key signed that SHA-256 by then; it does not show who wrote the sentence. Keep the sentence word for word and the receipt.';
    return 'Your capsule is sealed in block ' + r.height + ' and opens at block ' + groups(r.openAt) + '. Download the capsule file now: without it, it never opens.';
  }

  function nextLine(r) {
    const app = r.kind === 'bid' ? 'The Daily Mint shows the lot and lets you check the house against the chain' : r.kind === 'stamp' ? 'The Notary checks a stamp from its receipt and your sentence' : 'Time Capsules opens it once its block comes, with the file';
    if (S.done && S.done.passkey) return app + '; it signs with the play key, while your passkey account signs here and on First Mints. Verify a block does not check a passkey’s P-256 signature (it says so); the devnet checked it when it took the transaction.';
    return app + '. The same key works there if you ticked “Keep it on this device”.';
  }

  function paintKeep() {
    const box = q('[data-st-keep]');
    const pre = q('[data-st-keep-pre]');
    if (!box) return;
    if (S.file) {
      box.hidden = false;
      set('[data-st-keep-text]', (S.undownloaded ? 'DOWNLOAD THE CAPSULE FILE NOW. ' : 'Capsule file downloaded. ') + 'It holds your message and the salt: anyone with it can read the message early, and without it the capsule never opens.' + (S.kept ? ' It is also kept on this device, where Time Capsules finds it.' : ''));
      set('[data-st-download]', 'Download the capsule file');
      if (pre) { pre.hidden = true; pre.textContent = ''; }
    } else if (S.receipt) {
      box.hidden = false;
      set('[data-st-keep-text]', 'Your sentence, exactly as stamped: “' + S.sentence + '” Keep it word for word with the receipt: the Notary checks the stamp from both.');
      set('[data-st-download]', 'Download the receipt');
      if (pre) { pre.hidden = false; pre.textContent = JSON.stringify(S.receipt, null, 2); }
    } else box.hidden = true;
  }

  function download() {
    const obj = S.file || S.receipt;
    if (!obj) return;
    const name = S.file ? 'capsule-' + String(S.file.capsule).slice(0, 12) + '.json' : 'notary-receipt-' + String(S.receipt.stamp.tx).slice(0, 12) + '.json';
    const blob = new win.Blob([JSON.stringify(obj, null, 2) + '\n'], { type: 'application/json' });
    const a = doc.createElement('a');
    a.href = win.URL.createObjectURL(blob);
    a.download = name;
    doc.body.append(a);
    a.click();
    a.remove();
    win.setTimeout(() => win.URL.revokeObjectURL(a.href), 4000);
    if (S.file) S.undownloaded = false;
    paintKeep();
  }

  // A capsule file that was made here and is neither downloaded nor kept on this device exists only in this tab.
  win.addEventListener('beforeunload', (ev) => {
    if (!(S.file && S.undownloaded && !S.kept)) return undefined;
    ev.preventDefault();
    ev.returnValue = 'Your capsule file has not been downloaded. It holds the message and the salt; leave and the capsule can never open.';
    return ev.returnValue;
  });

  // ------------------------------------------------------------ wiring

  const on = (sel, ev, fn) => { const n = q(sel); if (n) n.addEventListener(ev, fn); };
  on('[data-st-pk-make]', 'click', makePasskey);
  on('[data-st-pk-use]', 'click', async () => { if (S.acting) return; S.mode = 'passkey'; S.balance = null; await loadBalance(); paintSteps(); });
  on('[data-st-pk-off]', 'click', async () => { if (S.acting) return; S.mode = 'play'; S.balance = null; await loadBalance(); paintSteps(); });
  on('[data-st-faucet]', 'click', faucet);
  on('[data-st-skip]', 'click', () => { S.skipped = true; const out = q('[data-st-faucet-out]'); if (out) out.textContent = 'Skipped. The stamp and the capsule cost nothing; the bid needs play ATTN.'; paintSteps(); });
  on('[data-st-review]', 'click', review);
  on('[data-st-sign]', 'click', () => sign(true));
  on('[data-st-cancel]', 'click', () => sign(false));
  on('[data-st-download]', 'click', download);
  // Keyboard: Enter in the sentence reviews it; Escape on the card is Cancel.
  on('[data-st-sentence]', 'keydown', (ev) => { if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); review(); } });
  on('[data-st-card]', 'keydown', (ev) => { if (ev.key === 'Escape' && S.pending) { ev.preventDefault(); sign(false); } });
  for (const r of root.querySelectorAll('[data-st-choice]')) r.addEventListener('change', () => { if (r.checked) { S.choice = r.value; errors([]); paintChoice(); } });
  if (keys) keys.onChange(() => { if (S.mode === 'play' || !passkeyActive()) { S.balance = null; S.skipped = false; } if (S.begun) loadBalance().then(paintSteps); else paintSteps(); });

  return {
    state: S,
    net,
    where,
    keys,
    async begin() {
      if (S.begun) return;
      S.begun = true;
      root.dataset.state = 'reading';
      say('Reading the devnet…', 'reading');
      if (keys) await keys.ready;
      await refresh();
      if (!S.halted && S.status) {
        S.rate = await S0.dayRate(net, S.status.height);
        paintCapsuleWhen();
        await checkPasskeys();
      }
      S.timer = win.setInterval(() => { if (doc.visibilityState !== 'hidden' && !S.halted && !S.acting && !S.done) refresh(); }, POLL_MS);
    },
    refresh,
    faucet,
    review,
    sign,
    download,
    makePasskey,
    activeKey,
    stop() { win.clearInterval(S.timer); },
  };
}

export function start(root, env = {}) {
  let c = null;
  try { c = mount(root, env); } catch { c = null; }
  if (!c) { root.dataset.state = 'down'; return null; }
  c.begin();
  return c;
}
