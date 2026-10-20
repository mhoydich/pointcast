// witness-view.js: the DOM side of "Witness in your browser" (/chain/witness). It
// draws what witness.js returns into the skeleton the Astro page renders.
//
// Rules, held by tests/chain-app-witness.test.mjs:
// - Everything the devnet sends (names, addresses, titles, reasons, hashes) is
//   written with textContent or a text node. Never markup, an href or a style
//   value. The only link this file makes is the Blob link for the claim file the
//   page itself just made; the only style it sets is the progress bar's width,
//   from numbers it counted.
// - Lazy: importing this module touches no network and no DOM. start() waits for
//   the load event, an idle callback, the section within 400px of the viewport
//   and a visible tab, then reads GET /status once. The verifier's files and the
//   worker are fetched and started only when "Replay" is pressed.
// - Replaying writes nothing. A post is sent only after the replay was clean, a
//   key exists and the person has read the post word for word and pressed Send,
//   with a key made in this browser, to the devnet the page points at.
// - Refuse, never guess: a pin that does not match, a genesis that changed, any
//   fault, a stall, the midnight guard, an old replay, a changed UTC day: the page
//   signs nothing and says which.
// - devnet: no value, may reset. A witness attestation is a claim, not proof.

import * as X from './witness.js';
import { mountKeyPanel } from './key-panel.js';
import { asSentence, cleanBlock, cleanText, connectPinned, describeError, groups, makeNet, pinnedStatus, plural, resolveApi, sendFailureText, shortAddr, shortHex, whenReady } from './chain-kit.js';

function el(doc, tag, cls, text) {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

const MARK = { pass: '✓', fail: '✗', skip: '–', busy: '…' };
const WORD = { pass: 'PASS', fail: 'FAIL', skip: 'NOT CHECKED', busy: 'WORKING' };

export function mount(root, env = {}) {
  const doc = root.ownerDocument;
  const win = env.window || doc.defaultView;
  const q = (sel) => root.querySelector(sel);
  const ds = root.dataset;
  const where = resolveApi(env.search !== undefined ? env.search : win.location.search, { api: String(ds.api || ''), genesis: String(ds.genesis || '') });
  if (!/^https?:\/\/[a-z0-9.:-]+$/i.test(where.api)) return null;
  const net = makeNet(where.api, { fetch: env.fetch, timeoutMs: env.timeoutMs });
  const now = env.now || (() => Date.now());
  const sleep = env.sleep || ((ms) => new Promise((r) => win.setTimeout(r, ms)));
  const storage = env.storage !== undefined ? env.storage : (() => { try { return win.localStorage; } catch { return null; } })();
  const pins = { 'verify.js': String(ds.pinJs || ''), 'verify-worker.js': String(ds.pinWorker || ''), 'pointcast_chain.wasm': String(ds.pinWasm || '') };
  const verifierBase = String(ds.verifierBase || '/chain/yard/verifier/');
  // The SDK's errors carry the devnet's words but not its status: a send that was answered 429 is noticed here, on the way through.
  const limited = { n: 0, retryAfter: 0 };
  const watched = (f) => async (u, i) => {
    const r = await f(u, i);
    if (r && r.status === 429) {
      limited.n += 1;
      limited.retryAfter = Number(r.headers && typeof r.headers.get === 'function' ? r.headers.get('retry-after') : 0) || 0;
    }
    return r;
  };
  const limitHint = () => ' The devnet is rate-limiting this browser: ' + (limited.retryAfter ? 'try again in ' + limited.retryAfter + ' s.' : 'wait a minute and try again.');
  const S = {
    begun: false, halted: false, status: null, pin: null, token: 0, running: false, handle: null,
    replay: null, replayedAt: 0, choice: null, plan: null, planning: 0, chain: null, sending: false,
    sent: null, shas: null, checks: [], reviewTimer: null, lastRoll: null, carried: false,
  };
  const set = (sel, text) => { const n = q(sel); if (n) n.textContent = text; };
  const say = (text, state) => { set('[data-wt-status]', text); if (state) root.dataset.state = state; };
  const panel = q('[data-key-panel]');
  const keys = panel ? mountKeyPanel(panel, { window: win, storage: env.storage, supported: env.supported }) : null;
  const key = () => (keys ? keys.key() : null);
  const box = (sel, show) => { const n = q(sel); if (n) n.hidden = !show; };
  /** Keyboard use: a button that goes disabled under the finger would drop focus on the page, so focus is carried to the next thing that can take it. */
  const focusOn = (sel) => { const n = q(sel); if (n && !n.disabled && !n.hidden && typeof n.focus === 'function') n.focus(); };

  // ------------------------------------------------------------ small painters

  function paintChecks() {
    const host = q('[data-wt-checks]');
    if (!host) return;
    host.replaceChildren();
    for (const c of S.checks) {
      const li = el(doc, 'li', 'ca-ck');
      li.dataset.state = c.state === 'busy' ? 'skip' : c.state;
      const m = el(doc, 'span', 'ca-ck__m', MARK[c.state]);
      m.setAttribute('aria-hidden', 'true');
      li.append(m, el(doc, 'span', 'ca-ck__s', WORD[c.state]), el(doc, 'span', 'ca-ck__t', c.text));
      host.append(li);
    }
  }

  /** Set (or add) one line of the log of what the replay did. */
  function check(id, state, text) {
    const i = S.checks.findIndex((c) => c.id === id);
    if (i >= 0) S.checks[i] = { id, state, text };
    else S.checks.push({ id, state, text });
    paintChecks();
  }

  function paintProgress(height, tip) {
    const bar = q('[data-wt-bar]');
    const fill = q('[data-wt-fill]');
    const total = Math.max(0, Number(tip) || 0);
    const done = Math.min(Math.max(0, Number(height) || 0), total || Number(height) || 0);
    if (bar) {
      bar.setAttribute('aria-valuemax', String(total));
      bar.setAttribute('aria-valuenow', String(done));
      bar.setAttribute('aria-valuetext', groups(done) + ' of ' + groups(total) + ' blocks replayed');
    }
    if (fill) fill.style.width = (total > 0 ? Math.min(100, Math.floor((done / total) * 100)) : 0) + '%';
    set('[data-wt-progress-text]', total > 0 ? groups(done) + ' of ' + groups(total) + ' blocks replayed' : 'waiting for the first block');
  }

  function clearOutputs() {
    S.checks = [];
    S.replay = null;
    S.choice = null;
    S.plan = null;
    S.sent = null;
    S.lastRoll = null;
    paintChecks();
    box('[data-wt-progress]', false);
    box('[data-wt-fault]', false);
    box('[data-wt-summary]', false);
    box('[data-wt-confirm]', false);
    box('[data-wt-errors]', false);
    box('[data-wt-result]', false);
    box('[data-wt-roll]', false);
    for (const n of root.querySelectorAll('[data-wt-sum]')) n.textContent = '';
    set('[data-wt-roll-list]', '');
  }

  function buttons() {
    const replay = q('[data-wt-replay]');
    const cancel = q('[data-wt-cancel]');
    if (replay) replay.disabled = !S.begun || S.halted || S.running || S.sending;
    if (cancel) cancel.disabled = !S.running;
  }

  const pinState = (name, text) => { const n = q('[data-wt-pin-state="' + name + '"]'); if (n) n.textContent = text; };

  /** Under a local ?devnet= the table says what is really pinned (the link's genesis, or the node's own), not the build's. */
  function paintPins() {
    if (!where.override) return;
    set('[data-wt-pin-hash]', where.genesis || (S.status ? S.status.genesis : ''));
    set('[data-wt-pin-how]', where.genesis
      ? 'a local test: this page was opened with ?devnet= and &genesis=, so it pins the genesis in the link, not the one in its build.'
      : 'a local test: this page was opened with ?devnet=, so it uses that node’s own genesis, and nothing outside it vouches for it.');
    set('[data-wt-net]', net.api + ' · ' + (S.status ? S.status.chainId : '') + ' · local override');
  }

  // ------------------------------------------------------------ the replay

  /** What a failed replay looks like to a person: the fault box for a fault, a failed line and the status for the rest. */
  function failReplay(e) {
    S.running = false;
    S.handle = null;
    box('[data-wt-progress]', false);
    if (e && e.name === 'Cancelled') {
      S.checks = S.checks.filter((c) => c.state !== 'busy');
      paintChecks();
      say('Cancelled. Nothing was signed or sent.', 'ready');
    } else if (e && e.name === 'GenesisChanged') {
      S.halted = true;
      const banner = q('[data-wt-genesis]');
      if (banner) { banner.hidden = false; banner.textContent = describeError(e); }
      check('genesis', 'fail', 'The devnet’s genesis is not the one this page pins: it was probably reset. Nothing was replayed.');
      say('GENESIS CHANGED. Nothing can be replayed or sent, and attestations from before the reset are gone.', 'changed');
    } else if (e && e.name === 'ReplayFault') {
      check('replay', 'fail', e.message);
      box('[data-wt-fault]', true);
      set('[data-wt-fault-text]', e.message + '. Keep this: a fault is what the net is for. Nothing was signed.');
      set('[data-wt-fault-json]', e.evidenceJson ? cleanBlock(e.evidenceJson, 6000) : 'The worker made no evidence file for this fault.');
      const det = q('[data-wt-fault-details]');
      if (det) det.hidden = !e.evidenceJson;
      say('FAULT at height ' + e.at + '. Refusing to sign.', 'fault');
    } else if (e && e.name === 'PinError') {
      check('verifier', 'fail', e.message);
      say(e.message + '. Nothing was signed.', 'fault');
    } else if (e instanceof X.Refusal) {
      check('replay', 'fail', e.message);
      say(e.message + (/\b429\b/.test(e.message) ? ' The devnet is rate-limiting this browser: wait a minute and replay again.' : ''), 'fault');
    } else {
      const words = describeError(e);
      check('replay', 'fail', words);
      say('The replay did not finish: ' + asSentence(words) + (e && e.status === 429 ? ' The devnet is rate-limiting this browser: wait a minute and replay again.' : '') + ' Nothing was signed.', 'down');
    }
    buttons();
    if (S.carried) { S.carried = false; focusOn('[data-wt-replay]'); }
  }

  function paintSummary() {
    const r = S.replay;
    const c = S.choice;
    if (!r || !c) return;
    const sum = (k, t) => { const n = q('[data-wt-sum="' + k + '"]'); if (n) n.textContent = t; };
    sum('height', groups(r.tip.height) + ' blocks, from block 1');
    sum('root', r.tip.state_root);
    sum('epoch', c.epoch);
    sum('day', c.day + ' (UTC; resets at 00:00 UTC)');
    sum('daycp', c.dayCp === null ? 'not sealed yet' : '№' + c.dayCp);
    sum('target', c.empty ? 'none yet: the first checkpoint is height 10' : '№' + c.target + (c.dayCp === null ? ' (the latest sealed)' : ' (today’s day checkpoint)'));
    sum('hash', c.claim ? c.claim.block_hash : '');
    sum('claimroot', c.claim ? c.claim.state_root : '');
    box('[data-wt-summary]', true);
  }

  async function replay() {
    if (S.running || S.halted || !S.begun || S.sending) return;
    const token = ++S.token;
    S.running = true;
    const hadFocus = doc.activeElement === q('[data-wt-replay]');
    clearOutputs();
    buttons();
    if (hadFocus) { S.carried = true; focusOn('[data-wt-cancel]'); }
    root.dataset.state = 'busy';
    box('[data-wt-progress]', true);
    paintProgress(0, 0);
    try {
      say('Reading the devnet…', 'busy');
      check('genesis', 'busy', 'Reading the devnet’s genesis…');
      const st = await pinnedStatus(net, where.genesis || null);
      if (token !== S.token) return;
      S.status = st;
      S.pin = where.genesis || st.genesis;
      paintProgress(0, st.height);
      check('genesis', 'pass', where.genesis
        ? 'The devnet’s genesis ' + shortHex(st.genesis, 12, 8) + ' is the one this page pins.'
        : 'The genesis ' + shortHex(st.genesis, 12, 8) + ' was taken from the devnet itself (a local test): nothing outside it vouches for it.');
      say('Checking the verifier…', 'busy');
      check('verifier', 'busy', 'Fetching the Block Yard’s verifier and checking its fingerprint…');
      const fetched = await (env.fetchVerifier || X.fetchVerifier)({ fetch: env.verifierFetch || env.fetch || ((...a) => win.fetch(...a)), base: verifierBase, pins });
      if (token !== S.token) return;
      S.shas = fetched.sha;
      for (const n of X.VERIFIER_FILES) pinState(n, 'checked: the SHA-256 matches the pin');
      check('verifier', 'pass', 'The verifier’s three files match the pins above (wasm ' + fetched.sha['pointcast_chain.wasm'].slice(0, 12) + '…, verify.js ' + fetched.sha['verify.js'].slice(0, 12) + '…, worker ' + fetched.sha['verify-worker.js'].slice(0, 12) + '…), and the wasm matches the Block Yard’s own fingerprint file.');
      say('Replaying from block 1…', 'busy');
      check('replay', 'busy', 'Replaying every block from genesis through the chain’s own rules…');
      let lastNote = '';
      const start = env.startReplay || ((a) => {
        const assets = X.blobAssets(a.fetched.bytes, { URL: win.URL, Blob: win.Blob });
        const WorkerCtor = env.Worker || win.Worker;
        if (typeof WorkerCtor !== 'function') { assets.revoke(); return { promise: Promise.reject(new X.Refusal('this browser has no Web Workers, so it cannot replay the chain here. Nothing was signed.', 'worker')), cancel() {} }; }
        const h = X.workerReplay({ spawn: () => new WorkerCtor(X.SHIM_URL, { type: 'module' }), assets, api: a.api, genesis: a.genesis, shas: a.fetched.sha, minHeight: a.minHeight, onProgress: a.onProgress, onNote: a.onNote, stallMs: env.stallMs, timers: env.timers });
        h.promise.then(() => assets.revoke(), () => assets.revoke());
        return h;
      });
      S.handle = start({
        fetched, api: net.api, genesis: S.pin, minHeight: st.height,
        onProgress: ({ height, tip }) => { if (token === S.token) paintProgress(height, tip); },
        onNote: (n) => { if (token === S.token && n.text && n.text !== lastNote) { lastNote = n.text; set('[data-wt-progress-note]', n.text); } },
      });
      const result = await S.handle.promise;
      if (token !== S.token) return;
      S.handle = null;
      S.replay = result;
      S.replayedAt = now();
      paintProgress(result.tip.height, Math.max(result.tip.height, st.height));
      set('[data-wt-progress-note]', '');
      check('replay', 'pass', 'Replayed ' + groups(result.tip.height) + ' blocks from genesis: no fault. State root at the tip ' + shortHex(result.tip.state_root, 12, 8) + '.');
      check('bind', 'pass', 'Every block’s timestamp was read from a header that hashes to the block the verifier accepted.');
      S.choice = X.chooseCheckpoint({ replay: result, nowMs: now() });
      check('checkpoint', S.choice.empty ? 'skip' : 'pass', S.choice.empty
        ? 'No checkpoint is sealed yet (the first is height 10).'
        : 'The checkpoint to attest is №' + S.choice.target + ', ' + (S.choice.dayCp === null ? 'the latest sealed one (today’s day checkpoint is not sealed yet)' : 'today’s day checkpoint') + ', chosen from the replay alone.');
      paintSummary();
      S.running = false;
      say(S.choice.empty ? 'Replay done: no faults, but no checkpoint is sealed yet. Nothing to attest.' : 'Replay done: no faults. Read the post below; nothing has been sent.', 'replayed');
      buttons();
      await readRoll();
      await review();
      if (token === S.token && S.carried) {
        S.carried = false;
        const up = q('[data-wt-confirm]');
        if (up && !up.hidden) up.focus();
        else focusOn('[data-wt-replay]');
      }
    } catch (e) {
      if (token !== S.token) return;
      failReplay(e);
    }
  }

  function cancel() {
    if (!S.running) return;
    const h = S.handle;
    S.token += 1;
    S.handle = null;
    if (h) { try { h.cancel(); } catch { /* it ends anyway */ } }
    failReplay({ name: 'Cancelled' });
  }

  // ------------------------------------------------------------ the review

  const optionValues = () => ({
    name: (q('[data-wt-name]') || {}).value || '',
    checkin: Boolean((q('[data-wt-checkin]') || {}).checked),
    note: (q('[data-wt-note]') || {}).value || '',
  });

  function paintNameNote() {
    const o = optionValues();
    const n = q('[data-wt-name-note]');
    const nm = X.checkName(o.name);
    if (n) {
      n.textContent = nm.ok ? (nm.name ? 'Your name would be “' + nm.name + '”: a claim, bound to the first key that uses it.' : 'No name: the attestation goes out as a key only.') : nm.reason;
      n.dataset.bad = nm.ok ? 'no' : 'yes';
    }
    const noteEl = q('[data-wt-note]');
    if (noteEl) noteEl.disabled = !o.checkin;
  }

  async function lookupEarlier(address) {
    if (!S.choice || S.choice.empty) return null;
    const entry = X.journalFor(X.readJournal(storage), { genesis: S.pin, epoch: S.choice.epoch, address }).find((e) => e.height === S.choice.target && e.tx);
    if (!entry) return null;
    try {
      const r = await net.get('/tx/' + entry.tx);
      const status = r && typeof r.status === 'string' ? cleanText(r.status, 20) : '';
      return { status, height: r && Number.isSafeInteger(r.height) ? r.height : null, tx: entry.tx };
    } catch {
      return null;
    }
  }

  function paintReview(plan) {
    const errs = q('[data-wt-errors]');
    if (errs) errs.replaceChildren();
    const send = q('[data-wt-send]');
    if (!plan.ok) {
      box('[data-wt-confirm]', false);
      if (errs) { for (const e of plan.errors) errs.append(el(doc, 'li', '', e)); errs.hidden = plan.errors.length === 0; }
      return;
    }
    if (errs) errs.hidden = true;
    set('[data-wt-skip]', [plan.witSkip ? plan.witSkip.why : '', plan.netSkip].filter(Boolean).join(' '));
    box('[data-wt-wit-box]', Boolean(plan.wit));
    box('[data-wt-net-box]', Boolean(plan.net));
    if (plan.wit) { set('[data-wt-wit-title]', plan.wit.title); set('[data-wt-wit-body]', plan.wit.body); }
    if (plan.net) { set('[data-wt-net-title]', plan.net.title); set('[data-wt-net-body]', plan.net.body); }
    set('[data-wt-notes]', plan.notes.join(' '));
    set('[data-wt-confirm-from]', plan.sendable
      ? 'Signed by ' + plan.sender + ' and sent to ' + net.api + ' (' + (S.status ? S.status.chainId : '') + '). Your browser has signed the claim; nothing has been sent. It is public, and stays on this devnet until it resets.'
      : 'Nothing to send.');
    if (send) { send.hidden = !plan.sendable; send.disabled = Boolean(plan.blocked) || S.sending; }
    box('[data-wt-confirm]', true);
  }

  async function review() {
    if (!S.replay || !S.choice || S.running) return null;
    const mine = ++S.planning;
    const k = key();
    const o = optionValues();
    paintNameNote();
    if (!k && keys && keys.supported() === false) {
      S.plan = null;
      paintReview({ ok: false, errors: ['This browser cannot make an ed25519 key (WebCrypto Ed25519), so it cannot sign. The replay above still ran and the roll can be read; to witness, use a current Chrome, Edge, Safari or Firefox, or the terminal version below.'], notes: [] });
      return null;
    }
    let earlier = null;
    try {
      if (k) earlier = await lookupEarlier(k.sender);
      if (mine !== S.planning) return null;
      const plan = await X.planWitness({
        replay: S.replay, choice: S.choice, chainId: S.status.chainId, genesis: S.pin, key: k, opts: o, nowMs: now(),
        wasmSha: (S.shas || {})['pointcast_chain.wasm'] || '', journal: X.readJournal(storage), earlier,
      });
      if (mine !== S.planning) return null;
      S.plan = plan;
      paintReview(plan);
      return plan;
    } catch (e) {
      if (mine !== S.planning) return null;
      S.plan = null;
      paintReview({ ok: false, errors: [describeError(e)], notes: [] });
      return null;
    }
  }

  /** The options or the key changed: what was shown is withdrawn, and the review is made again a moment later. */
  function withdraw() {
    if (S.sending) return;
    S.plan = null;
    S.planning += 1;
    box('[data-wt-confirm]', false);
    paintNameNote();
    renderRoll();
    if (S.reviewTimer) win.clearTimeout(S.reviewTimer);
    if (S.replay && !S.running) S.reviewTimer = win.setTimeout(() => { S.reviewTimer = null; review(); }, 250);
  }

  // ------------------------------------------------------------ sending

  function saveClaim(plan, info) {
    const entry = { genesis: S.pin, epoch: plan.epoch, address: plan.sender, height: plan.target, block_hash: plan.claim.block_hash, state_root: plan.claim.state_root, digest: plan.wit.digest, signature: plan.wit.signature, tx: info.txHash, signed_at: new Date(now()).toISOString(), name: plan.name || null, tool: X.TOOL, wasm: (S.shas || {})['pointcast_chain.wasm'] || '' };
    return storage ? X.writeJournal(storage, entry) : false;
  }

  function downloadClaim() {
    if (!S.sent || !S.sent.claim) return;
    const blob = new win.Blob([JSON.stringify(S.sent.claim, null, 2) + '\n'], { type: 'application/json' });
    const a = doc.createElement('a');
    a.href = win.URL.createObjectURL(blob);
    a.download = 'witness-claim-' + S.sent.claim.claim.height + '-' + String(S.sent.claim.tx || 'unsent').slice(0, 12) + '.json';
    doc.body.append(a);
    a.click();
    a.remove();
    win.setTimeout(() => win.URL.revokeObjectURL(a.href), 4000);
  }

  async function send() {
    const plan = S.plan;
    const k = key();
    const result = q('[data-wt-result]');
    const btn = q('[data-wt-send]');
    if (!plan || !plan.ok || !plan.sendable || plan.blocked || !k || S.halted || S.sending || S.running) return;
    if (plan.sender !== k.sender) return;
    S.sending = true;
    if (btn) btn.disabled = true;
    buttons();
    const limitedBefore = limited.n;
    const say2 = (t, state) => { if (result) { result.hidden = false; result.dataset.state = state || ''; set('[data-wt-result-text]', t); } };
    try {
      say2('Checking the devnet’s genesis…', '');
      if (!S.chain) S.chain = await (env.connect || connectPinned)(net.api, { pinned: S.pin || null, env: { fetch: watched(env.fetch || ((...a) => win.fetch(...a))), timeoutMs: env.timeoutMs } });
      const r = await X.sendWitness({
        chain: S.chain, net, key: k, plan, now, replayedAt: S.replayedAt,
        onStage: (which, s) => say2('Sending the ' + (which === 'wit' ? 'attestation' : 'check-in') + '… (' + s + ')', ''),
        onSigned: (which, info) => { if (which === 'wit' && plan.wit) saveClaim(plan, info); },
        wait: env.wait,
      });
      S.sent = { plan, r, claim: plan.wit ? X.makeClaimFile({ chainId: S.status.chainId, genesis: S.pin, api: net.api, plan, txHash: r.wit ? r.wit.txHash : '', height: r.wit ? r.wit.height : null, timeMs: r.wit ? r.wit.timeMs : null, createdMs: now() }) : null };
      S.plan = null;
      box('[data-wt-confirm]', false);
      const bits = [];
      if (r.wit) bits.push('Attestation in block ' + r.wit.height + ' (tx ' + r.wit.txHash + ')' + (r.wit.counted ? ', counted for ' + r.wit.counted + ' by the day rule (an attestation counts on its block’s UTC day; the devnet decides whether it matches)' : '') + '.');
      if (r.net) bits.push('Check-in in block ' + r.net.height + ' (tx ' + r.net.txHash + ')' + (r.net.counted ? (r.net.counted === 'wrong_day' ? ': it counts for no day, because its day is not its block’s UTC day (wrong_day)' : ', counts for ' + r.net.counted) : '') + '.');
      say2(bits.join(' ') + ' Keep the claim file: the signature inside it is portable evidence.', 'ok');
      box('[data-wt-claim-box]', Boolean(S.sent.claim));
      if (S.sent.claim) set('[data-wt-claim-json]', JSON.stringify(S.sent.claim, null, 2));
      say('Sent. Reading the roll…', 'sent');
      await readRoll({ poll: true });
    } catch (e) {
      if (e instanceof X.Refusal) say2(e.message, 'bad');
      else if (e && (e.sendState === 'sent' || e.sendState === 'maybe')) {
        S.plan = null;
        box('[data-wt-confirm]', false);
        say2(sendFailureText(e) + (limited.n > limitedBefore ? limitHint() : '') + ' Your claim is kept (it is in this browser’s journal when storage works), so the next replay will not send a second copy while this one may still land.', 'warn');
      } else say2(asSentence(sendFailureText(e)) + (limited.n > limitedBefore ? limitHint() : ''), 'bad');
    } finally {
      S.sending = false;
      if (btn) btn.disabled = false;
      buttons();
    }
  }

  // ------------------------------------------------------------ the roll

  /** What the roll says about the key the page holds now (the key can change after the roll was read, so this is worked out again each time it is drawn). */
  function standingFor(roll) {
    const k = key();
    const address = k ? k.sender : '';
    const sent = S.sent && S.sent.r && S.sent.r.wit ? S.sent.r.wit : null;
    if (sent) return X.standingOnRoll({ checkpoint: roll.checkpoint, address, txHash: sent.txHash, includedAt: sent.height });
    const row = roll.checkpoint && address ? roll.checkpoint.keys.find((x) => x.addr === address) : null;
    return row ? X.standingOnRoll({ checkpoint: roll.checkpoint, address, includedAt: row.includedAt }) : null;
  }

  function paintRoll(roll, standing) {
    const cp = roll.checkpoint;
    box('[data-wt-roll]', true);
    set('[data-wt-roll-title]', 'Checkpoint №' + (S.choice ? S.choice.target : ''));
    const badge = q('[data-wt-roll-state]');
    if (badge) {
      badge.textContent = standing ? standing.label : '';
      badge.dataset.state = standing ? ({ correct: 'ok', strike: 'bad', duplicate: 'warn', notcounted: 'warn', notlisted: 'warn', pending: 'warn' }[standing.state] || '') : '';
      badge.hidden = !standing;
    }
    set('[data-wt-roll-text]', standing ? standing.text : key() ? 'Your key has not attested this checkpoint yet: it is not on this list.' : 'Make a key to see your own row on this list.');
    const list = q('[data-wt-roll-list]');
    if (list) {
      list.replaceChildren();
      const me = key();
      for (const k of (cp ? cp.keys : [])) {
        const li = el(doc, 'li', 'wt-key');
        const mineRow = Boolean(me && k.addr && k.addr === me.sender);
        li.dataset.mine = mineRow ? 'yes' : 'no';
        li.append(el(doc, 'span', 'wt-key__n', (k.name || 'unnamed key') + (k.name && !k.nameBound ? ' (name not bound to this key)' : '') + (mineRow ? ' · you' : '')));
        li.append(el(doc, 'span', 'wt-key__a', k.addr ? shortAddr(k.addr) : 'address not shown'));
        li.append(el(doc, 'span', 'wt-key__r', k.result === 'correct' ? 'agreed with this server' : k.result === 'mismatch' || k.result === 'conflict' ? 'strike · ' + k.result : String(k.result).replace(/_/g, ' ')));
        list.append(li);
      }
      if (!cp || !cp.keys.length) list.append(el(doc, 'li', 'wt-key wt-key--none', 'No key has signed this checkpoint yet.'));
    }
    const foot = [];
    if (cp) foot.push(plural(cp.distinct, 'key') + ' signed this checkpoint: ' + cp.correct + ' agreed with this server’s hash' + (cp.strikes ? ', ' + plural(cp.strikes, 'strike') : '') + (cp.more ? ' · ' + cp.more + ' more not listed' : '') + '.');
    foot.push(roll.complete ? plural(roll.keys.length, 'witness key') + ' on the roll in all (counts are keys, not people).' : 'At least ' + plural(roll.keys.length, 'witness key') + ' on the roll (the first pages were read).');
    if (roll.mine) foot.push('Your key: ' + plural(roll.mine.attestations, 'attestation') + ', ' + roll.mine.correct + ' correct, ' + plural(roll.mine.strikes, 'strike') + ', streak ' + roll.mine.streak + (roll.mine.established ? ', established' : '') + '.');
    if (cp && cp.indexedHeight !== null) foot.push('Read at block №' + groups(cp.indexedHeight) + (cp.day ? ' · UTC day ' + cp.day : '') + '.');
    set('[data-wt-roll-foot]', foot.join(' '));
  }

  /** Draw the last roll read, for the key the page holds now. */
  function renderRoll() {
    if (!S.lastRoll) return null;
    const standing = standingFor(S.lastRoll.roll);
    paintRoll(S.lastRoll.roll, standing);
    return standing;
  }

  /** Read the roll for the checkpoint, and say what it makes of this key's attestation. `poll` waits for the row a moment (after a send). */
  async function readRoll({ poll = false } = {}) {
    const c = S.choice;
    const k = key();
    if (!c || c.empty) return null;
    const tok = S.token;
    const btn = q('[data-wt-roll-read]');
    if (btn) btn.disabled = true;
    try {
      const sent = S.sent && S.sent.r && S.sent.r.wit ? S.sent.r.wit : null;
      const address = k ? k.sender : '';
      if (poll && sent) {
        await X.pollRoll({ net, target: c.target, address, txHash: sent.txHash, includedAt: sent.height, sleep, onRead: (r) => { if (tok === S.token) { S.lastRoll = r; renderRoll(); } } });
        if (tok !== S.token) return null;
        const standing = renderRoll();
        say(standing.state === 'correct' ? 'Sent, and the roll counts it: CORRECT.' : standing.state === 'strike' ? 'Sent, and the roll gives it a strike.' : standing.state === 'pending' ? 'Sent. The roll has not listed it yet: press “Read the roll again” in a moment.' : 'Sent. The roll says: ' + standing.label + '.', 'sent');
        return S.lastRoll;
      }
      const roll = await X.fetchRoll(net, { target: c.target, address });
      if (tok !== S.token) return null;
      S.lastRoll = { roll };
      renderRoll();
      return S.lastRoll;
    } catch (e) {
      if (tok !== S.token) return null;
      box('[data-wt-roll]', true);
      set('[data-wt-roll-text]', 'The roll could not be read: ' + asSentence(describeError(e)) + (S.sent ? ' Your post is sent; read the roll again in a moment.' : ''));
      const badge = q('[data-wt-roll-state]');
      if (badge) badge.hidden = true;
      return null;
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ------------------------------------------------------------ wiring

  const replayBtn = q('[data-wt-replay]');
  if (replayBtn) replayBtn.addEventListener('click', replay);
  const cancelBtn = q('[data-wt-cancel]');
  if (cancelBtn) cancelBtn.addEventListener('click', cancel);
  const sendBtn = q('[data-wt-send]');
  if (sendBtn) sendBtn.addEventListener('click', send);
  const dismiss = q('[data-wt-dismiss]');
  if (dismiss) dismiss.addEventListener('click', () => { S.plan = null; S.planning += 1; box('[data-wt-confirm]', false); });
  const readBtn = q('[data-wt-roll-read]');
  if (readBtn) readBtn.addEventListener('click', () => readRoll({ poll: Boolean(S.sent) }));
  const claimBtn = q('[data-wt-claim-btn]');
  if (claimBtn) claimBtn.addEventListener('click', downloadClaim);
  for (const sel of ['[data-wt-name]', '[data-wt-note]']) { const n = q(sel); if (n) n.addEventListener('input', withdraw); }
  const checkinEl = q('[data-wt-checkin]');
  if (checkinEl) checkinEl.addEventListener('change', withdraw);
  if (keys) keys.onChange(() => { withdraw(); });
  paintNameNote();

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
      try {
        S.status = await pinnedStatus(net, where.genesis || null);
        S.pin = where.genesis || S.status.genesis;
        const banner = q('[data-wt-genesis]');
        if (banner) banner.hidden = true;
        set('[data-wt-meta]', net.api + ' · ' + S.status.chainId + ' · newest block #' + groups(S.status.height) + (where.override ? ' · local override' : '') + (where.ignored ? ' · a ?devnet= address was ignored: this page only reads another devnet on localhost or 127.0.0.1' : ''));
        paintPins();
        say('Ready. Replaying reads the devnet and the verifier’s files and writes nothing. Sending is a separate step, after you have read the post.', 'ready');
      } catch (e) {
        if (e && e.name === 'GenesisChanged') {
          S.halted = true;
          const banner = q('[data-wt-genesis]');
          if (banner) { banner.hidden = false; banner.textContent = describeError(e); }
          say('GENESIS CHANGED. Nothing can be replayed or sent, and attestations from before the reset are gone.', 'changed');
        } else {
          say('The devnet did not answer: ' + asSentence(describeError(e)) + ' Replaying needs the devnet; try “Replay” again in a moment.', 'down');
        }
      }
      buttons();
    },
    replay,
    cancel,
    review,
    send,
    readRoll,
    downloadClaim,
    stop() { if (S.reviewTimer) win.clearTimeout(S.reviewTimer); S.reviewTimer = null; },
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
