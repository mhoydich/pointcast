// notary-view.js: the DOM side of the Notary (/chain/notary). It draws what
// notary.js returns into the skeleton the Astro page renders.
//
// Rules, held by tests/chain-app-notary.test.mjs:
// - Everything the devnet sends (senders, names, notes, hashes) is written with
//   textContent or a text node. Never markup, an href or a style value. The
//   only link this file makes is the number-only "open block N" link, and the
//   only download is a Blob this page builds from the receipt it just made.
// - The file is read here and goes nowhere: only its SHA-256, size and any name
//   or note the person ticks go into the post, and the page shows that post
//   word for word before anything is sent.
// - Lazy: importing this module touches no network and no DOM. start() waits
//   for the load event, an idle callback, the section within 400px of the
//   viewport and a visible tab, then reads GET /status once. Checking a stamp
//   reads the blocks it needs, only when asked.
// - Writes: only "Send the stamp", after the person has read the confirm box,
//   with a key made in this browser, to the devnet the page points at.
// - devnet: no value, may reset. A stamp is an accountable claim, not proof.

import * as N from './notary.js';
import { mountKeyPanel } from './key-panel.js';
import { cleanText, connectPinned, describeError, groups, makeNet, pinnedStatus, plural, resolveApi, shortAddr, shortHex, utc, whenReady } from './chain-kit.js';

function el(doc, tag, cls, text) {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

const MARK = { pass: '✓', fail: '✗', skip: '–' };
const WORD = { pass: 'PASS', fail: 'FAIL', skip: 'NOT CHECKED' };

export function mount(root, env = {}) {
  const doc = root.ownerDocument;
  const win = env.window || doc.defaultView;
  const q = (sel) => root.querySelector(sel);
  const ds = root.dataset;
  const where = resolveApi(env.search !== undefined ? env.search : win.location.search, { api: String(ds.api || ''), genesis: String(ds.genesis || '') });
  if (!/^https?:\/\/[a-z0-9.:-]+$/i.test(where.api)) return null;
  const net = makeNet(where.api, { fetch: env.fetch });
  const now = env.now || (() => Date.now());
  const S = { begun: false, halted: false, status: null, file: null, plan: null, chain: null, receipt: null, busy: false, check: 0 };
  const set = (sel, text) => { const n = q(sel); if (n) n.textContent = text; };
  const say = (text, state) => { set('[data-nt-status]', text); if (state) root.dataset.state = state; };
  const panel = q('[data-key-panel]');
  const keys = panel ? mountKeyPanel(panel, { window: win, storage: env.storage, supported: env.supported }) : null;

  // ------------------------------------------------------------ what is being stamped

  function paintHash() {
    const f = S.file;
    set('[data-nt-hash]', f ? f.sha256 : 'no file or hash yet');
    set('[data-nt-size]', f ? groups(f.bytes) + ' bytes' + (f.name ? ' · ' + f.name : '') : '');
    const review = q('[data-nt-review]');
    if (review) review.disabled = !f || !keys || !keys.key() || S.halted;
    const nameBox = q('[data-nt-name-box]');
    if (nameBox) nameBox.disabled = !f || !f.name;
  }

  function setFile(f) {
    S.file = f;
    S.plan = null;
    const box = q('[data-nt-confirm]');
    if (box) box.hidden = true;
    paintHash();
  }

  async function takeFile(file) {
    const out = q('[data-nt-hash-note]');
    try {
      const h = await N.hashFile(file);
      setFile({ ...h, name: cleanText(String(file.name || ''), N.LIMITS.name) });
      if (out) { out.textContent = 'Hashed in your browser. The file went nowhere.'; out.dataset.bad = 'no'; }
    } catch (e) {
      setFile(null);
      if (out) { out.textContent = describeError(e); out.dataset.bad = 'yes'; }
    }
  }

  async function takeText() {
    const t = q('[data-nt-text]');
    const out = q('[data-nt-hash-note]');
    if (!t || !t.value) { if (out) { out.textContent = 'Type or paste some text first.'; out.dataset.bad = 'yes'; } return; }
    const h = await N.hashText(t.value);
    setFile({ ...h, name: '' });
    if (out) { out.textContent = 'Hashed as UTF-8 text exactly as typed, with no trimming. The text went nowhere.'; out.dataset.bad = 'no'; }
  }

  function takePasted() {
    const t = q('[data-nt-paste]');
    const out = q('[data-nt-hash-note]');
    const h = N.parsePastedHash(t ? t.value : '');
    if (!h) { if (out) { out.textContent = 'A SHA-256 is 64 hex characters (from sha256sum or shasum -a 256).'; out.dataset.bad = 'yes'; } return; }
    const size = q('[data-nt-paste-size]');
    const bytes = size && /^\d{1,15}$/.test(size.value.trim()) ? Number(size.value.trim()) : 0;
    setFile({ sha256: h, bytes, name: '' });
    if (out) { out.textContent = 'Using that hash.' + (bytes ? '' : ' The size is left at 0; type the file’s size in bytes to include it.'); out.dataset.bad = 'no'; }
  }

  // ------------------------------------------------------------ the stamp

  function planStamp() {
    const f = S.file;
    const k = keys && keys.key();
    const errs = [];
    if (!f) errs.push('Choose a file, type some text or paste a hash first.');
    if (!k) errs.push('Make a key first: the stamp is signed by it.');
    if (S.halted) errs.push('The devnet was reset; nothing can be sent.');
    const withName = Boolean((q('[data-nt-name-box]') || {}).checked) && f && f.name;
    const note = ((q('[data-nt-note]') || {}).value || '');
    let body = '';
    if (f) {
      try { body = N.stampBody({ sha256: f.sha256, bytes: f.bytes, name: withName ? f.name : '', note }); } catch (e) { errs.push(e.message); }
    }
    return { ok: errs.length === 0, errors: errs, body, title: f ? N.stampTitle(f.sha256) : '', sender: k ? k.sender : '' };
  }

  function showConfirm() {
    const plan = planStamp();
    const box = q('[data-nt-confirm]');
    const errs = q('[data-nt-errors]');
    if (errs) errs.replaceChildren();
    if (!plan.ok) {
      if (box) box.hidden = true;
      if (errs) { for (const e of plan.errors) errs.append(el(doc, 'li', '', e)); errs.hidden = false; }
      return plan;
    }
    if (errs) errs.hidden = true;
    S.plan = plan;
    set('[data-nt-confirm-title]', plan.title);
    set('[data-nt-confirm-body]', plan.body);
    set('[data-nt-confirm-from]', 'Signed by ' + plan.sender + ' and sent to ' + net.api + ' (' + (S.status ? S.status.chainId : '') + ').');
    if (box) box.hidden = false;
    return plan;
  }

  function downloadReceipt() {
    if (!S.receipt) return;
    const blob = new win.Blob([JSON.stringify(S.receipt, null, 2) + '\n'], { type: 'application/json' });
    const a = doc.createElement('a');
    a.href = win.URL.createObjectURL(blob);
    a.download = 'notary-receipt-' + S.receipt.stamp.tx.slice(0, 12) + '.json';
    doc.body.append(a);
    a.click();
    a.remove();
    win.setTimeout(() => win.URL.revokeObjectURL(a.href), 4000);
  }

  async function send() {
    const plan = S.plan;
    const k = keys && keys.key();
    const result = q('[data-nt-result]');
    const btn = q('[data-nt-send]');
    if (!plan || !plan.ok || !k || S.halted) return;
    btn.disabled = true;
    const say2 = (t, state) => { if (result) { result.hidden = false; result.dataset.state = state || ''; set('[data-nt-result-text]', t); } };
    try {
      say2('Checking the devnet’s genesis…', '');
      if (!S.chain) S.chain = await (env.connect || connectPinned)(net.api, { pinned: where.genesis || null, env: { fetch: env.fetch } });
      const f = S.file;
      const withName = Boolean((q('[data-nt-name-box]') || {}).checked) && f.name;
      const r = await N.stampHash({ chain: S.chain, net, key: k, sha256: f.sha256, bytes: f.bytes, name: withName ? f.name : '', note: ((q('[data-nt-note]') || {}).value || ''), onStage: (s) => say2('Sending the stamp… (' + s + ')', ''), now });
      S.receipt = r.receipt;
      const box = q('[data-nt-confirm]');
      if (box) box.hidden = true;
      say2('Stamped in block ' + r.height + '. Transaction ' + r.txHash + '. Keep the receipt: it is how you find and check the stamp later, and the devnet may reset.', 'ok');
      const rc = q('[data-nt-receipt]');
      if (rc) rc.hidden = false;
      set('[data-nt-receipt-json]', JSON.stringify(r.receipt, null, 2));
    } catch (e) {
      say2('Not sent, or not confirmed: ' + describeError(e), 'bad');
    } finally {
      btn.disabled = false;
    }
  }

  // ------------------------------------------------------------ checking a stamp

  const checkHashes = { file: null };

  async function checkInput() {
    const fileEl = q('[data-nt-c-file]');
    const pasted = q('[data-nt-c-hash]');
    const f = fileEl && fileEl.files && fileEl.files[0];
    if (f) { const h = await N.hashFile(f); return { sha256: h.sha256, bytes: h.bytes, from: 'the file ' + cleanText(String(f.name || ''), 60) }; }
    const p = N.parsePastedHash(pasted ? pasted.value : '');
    if (p) return { sha256: p, bytes: null, from: 'the pasted hash' };
    return null;
  }

  async function receiptInput() {
    const rf = q('[data-nt-c-receipt-file]');
    const rt = q('[data-nt-c-receipt-text]');
    const f = rf && rf.files && rf.files[0];
    if (f) return N.readReceipt(await f.text());
    if (rt && rt.value.trim()) return N.readReceipt(rt.value.trim());
    return null;
  }

  function paintChecks(list) {
    const host = q('[data-nt-c-checks]');
    host.replaceChildren();
    for (const c of list) {
      const li = el(doc, 'li', 'ca-ck');
      li.dataset.state = c.state;
      const m = el(doc, 'span', 'ca-ck__m', MARK[c.state]);
      m.setAttribute('aria-hidden', 'true');
      li.append(m, el(doc, 'span', 'ca-ck__s', WORD[c.state]), el(doc, 'span', 'ca-ck__t', c.text));
      host.append(li);
    }
  }

  async function runCheck() {
    const out = q('[data-nt-c-out]');
    const verdict = q('[data-nt-c-verdict]');
    const btn = q('[data-nt-c-run]');
    if (!out || !btn || S.halted) return;
    const run = ++S.check;
    btn.disabled = true;
    out.hidden = false;
    const finish = (text, state, checks = [], detail = '') => {
      if (run !== S.check) return;
      verdict.textContent = text;
      out.dataset.state = state;
      paintChecks(checks);
      set('[data-nt-c-detail]', detail);
      const link = q('[data-nt-c-link]');
      if (link) link.hidden = true;
    };
    try {
      verdict.textContent = 'Checking…';
      out.dataset.state = 'busy';
      const input = await checkInput();
      if (!input) return finish('NOTHING TO CHECK', 'bad', [], 'Choose the file or paste its SHA-256 first.');
      let receipt = null;
      try { receipt = await receiptInput(); } catch (e) { return finish('THAT IS NOT A RECEIPT', 'bad', [], describeError(e)); }
      const st = await pinnedStatus(net, where.genesis || null);
      S.status = st;
      let ref = null;
      let notes = '';
      if (receipt) {
        if (receipt.genesis !== st.genesis) return finish('NOT THIS DEVNET', 'bad', [{ id: 'genesis', state: 'fail', text: 'The receipt is for a devnet whose genesis is ' + shortHex(receipt.genesis, 12, 8) + '; this page reads ' + shortHex(st.genesis, 12, 8) + '. If the devnet was reset, the stamp is gone from it.' }]);
        ref = { height: receipt.height, txHash: receipt.txHash };
        if (receipt.sha256 !== input.sha256) notes = 'The receipt is for a different file (its hash starts ' + receipt.sha256.slice(0, 12) + '…); your file’s starts ' + input.sha256.slice(0, 12) + '….';
      } else {
        const found = await N.findStamps(net, input.sha256);
        if (!found.stamps.length) {
          return finish('NOT FOUND', 'bad', [], 'No stamp of this hash in the newest ' + groups(found.scannedBlocks) + ' blocks that carry transactions' + (found.complete ? ' (that is every block the devnet has).' : '.') + ' Not found is not proof it was never stamped: a stamp could be older than the scan, on another devnet, or lost in a reset. A receipt skips the search.');
        }
        const first = found.stamps[0];
        ref = { height: first.height, txHash: first.txHash };
        notes = found.stamps.length > 1 ? plural(found.stamps.length, 'stamp') + ' of this hash; the earliest is checked. Later ones: blocks ' + found.stamps.slice(1, 6).map((s) => s.height).join(', ') + (found.stamps.length > 6 ? ' and more' : '') + '.' : '';
      }
      const r = await N.checkStamp({ api: net.api, genesis: where.genesis || null, pinSource: where.genesis ? 'pinned' : 'node', ref, sha256: input.sha256, env: { fetch: env.fetch } });
      if (run !== S.check) return;
      const detail = r.stamp ? 'Block ' + ref.height + ' · ' + utc(r.stamp.timeMs) + ' · sent by ' + shortAddr(r.stamp.sender) + (r.stamp.name ? ' · name “' + r.stamp.name + '”' : '') + (r.stamp.note ? ' · note “' + r.stamp.note + '”' : '') + (r.stamp.bytes ? ' · ' + groups(r.stamp.bytes) + ' bytes' : '') + (notes ? ' · ' + notes : '') : notes;
      finish(r.verdict, r.verdict === 'STAMPED' ? 'ok' : r.verdict === 'PARTLY' ? 'warn' : 'bad', r.checks, detail);
      const link = q('[data-nt-c-link]');
      if (link && r.stamp) { link.hidden = false; link.href = '/chain/verify-a-block#b=' + Number(ref.height); }
    } catch (e) {
      if (e && e.name === 'GenesisChanged') finish('GENESIS CHANGED', 'bad', [], describeError(e));
      else finish('COULD NOT CHECK', 'bad', [], describeError(e));
    } finally {
      btn.disabled = false;
    }
  }

  // ------------------------------------------------------------ wiring

  const fileEl = q('[data-nt-file]');
  if (fileEl) { fileEl.disabled = false; fileEl.addEventListener('change', () => { const f = fileEl.files && fileEl.files[0]; if (f) takeFile(f); }); }
  const drop = q('[data-nt-drop]');
  if (drop) {
    drop.addEventListener('dragover', (ev) => { ev.preventDefault(); drop.dataset.over = 'yes'; });
    drop.addEventListener('dragleave', () => { drop.dataset.over = 'no'; });
    drop.addEventListener('drop', (ev) => { ev.preventDefault(); drop.dataset.over = 'no'; const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0]; if (f) takeFile(f); });
  }
  const textBtn = q('[data-nt-text-go]');
  if (textBtn) { textBtn.disabled = false; textBtn.addEventListener('click', takeText); }
  const pasteBtn = q('[data-nt-paste-go]');
  if (pasteBtn) { pasteBtn.disabled = false; pasteBtn.addEventListener('click', takePasted); }
  const review = q('[data-nt-review]');
  if (review) review.addEventListener('click', showConfirm);
  const sendBtn = q('[data-nt-send]');
  if (sendBtn) sendBtn.addEventListener('click', send);
  const cancel = q('[data-nt-cancel]');
  if (cancel) cancel.addEventListener('click', () => { const b = q('[data-nt-confirm]'); if (b) b.hidden = true; S.plan = null; });
  const rc = q('[data-nt-receipt]');
  if (rc) rc.addEventListener('click', downloadReceipt);
  const run = q('[data-nt-c-run]');
  if (run) { run.disabled = false; run.addEventListener('click', runCheck); }
  if (keys) keys.onChange(() => { S.plan = null; const b = q('[data-nt-confirm]'); if (b) b.hidden = true; paintHash(); });
  for (const c of root.querySelectorAll('[data-nt-c-file],[data-nt-c-hash],[data-nt-c-receipt-file],[data-nt-c-receipt-text]')) c.disabled = false;

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
        const banner = q('[data-nt-genesis]');
        if (banner) banner.hidden = true;
        set('[data-nt-meta]', net.api + ' · ' + S.status.chainId + ' · newest block #' + groups(S.status.height) + (where.override ? ' · local override' : ''));
        say('Ready. Stamping sends one post to the devnet, and only when you press Send.', 'ready');
      } catch (e) {
        if (e && e.name === 'GenesisChanged') {
          S.halted = true;
          const banner = q('[data-nt-genesis]');
          if (banner) { banner.hidden = false; banner.textContent = describeError(e); }
          say('GENESIS CHANGED. Nothing can be sent, and stamps from before the reset are gone.', 'changed');
        } else say('The devnet did not answer: ' + describeError(e) + ' You can still hash a file here; stamping needs the devnet.', 'down');
      }
      paintHash();
    },
    takeFile,
    takeText,
    takePasted,
    showConfirm,
    planStamp,
    send,
    runCheck,
    downloadReceipt,
    paintHash,
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
