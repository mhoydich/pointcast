// capsules-view.js: the DOM side of Time Capsules (/chain/capsules). It draws what
// capsules.js returns into the skeleton the Astro page renders.
//
// Rules, held by tests/chain-app-capsules.test.mjs:
// - Everything the devnet sends (labels, titles, messages, addresses) is written
//   with textContent or a text node. Never markup, an href or a style value. The
//   only download is a Blob this page builds from a capsule file it just made.
// - The message and the salt never leave the page until the person presses
//   "Open it" and has read the confirm box: sealing sends only the commitment, the
//   channel, the block and the label.
// - Lazy: importing this module touches no network and no DOM. start() waits for
//   the load event, an idle callback, the section within 400px of the viewport and
//   a visible tab, then reads the devnet.
// - Reads are GETs. Writes: "Send the seal" and "Open it", each after a confirm box,
//   with a key made in this browser, to the devnet the page points at.
// - An open is refused, nothing sent, unless the devnet lists the capsule and its
//   next block may open it: an early open would put the salt in the mempool in the clear.
// - devnet: no value, may reset. A reset erases every sealed capsule.

import * as C from './capsules.js';
import { mountKeyPanel } from './key-panel.js';
import { cleanText, connectPinned, describeError, groups, makeNet, pinnedStatus, plural, readFileText, resolveApi, sendFailureText, shortAddr, shortHex, utc, whenReady } from './chain-kit.js';

export const MY_SLOT = 'pointcast-chain-apps/capsules/v1';
const POLL_MS = 20000;

function el(doc, tag, cls, text) {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

const STATE_WORD = { waiting: 'SEALED · WAITING', due: 'DUE · MAY BE OPENED NOW', lapsed: 'LAPSED', gone: 'NOT LISTED' };

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
  const S = { begun: false, halted: false, status: null, list: null, rate: 12, mine: [], plan: null, chain: null, openPlan: null, lastFile: null, timer: 0, busy: false };
  const set = (sel, text) => { const n = q(sel); if (n) n.textContent = text; };
  const say = (text, state) => { set('[data-cp-status]', text); if (state) root.dataset.state = state; };
  const panel = q('[data-key-panel]');
  const keys = panel ? mountKeyPanel(panel, { window: win, storage: env.storage, supported: env.supported }) : null;

  // ------------------------------------------------------------ my capsules (this page, and this device if asked)

  function loadMine() {
    try {
      const raw = storage && storage.getItem(MY_SLOT);
      const list = raw ? JSON.parse(raw) : [];
      return (Array.isArray(list) ? list : []).map((f) => { try { return C.readCapsuleFile(f); } catch { return null; } }).filter(Boolean);
    } catch { return []; }
  }
  const keepBox = () => q('[data-cp-keep]');
  function saveMine() {
    const box = keepBox();
    try {
      if (!storage) return false;
      if (box && box.checked) { storage.setItem(MY_SLOT, JSON.stringify(S.mine.map(toFile))); return true; }
      storage.removeItem(MY_SLOT);
    } catch { return false; }
    return false;
  }
  const toFile = (m) => C.makeCapsuleFile({ chainId: m.chainId, genesis: m.genesis, api: m.api, capsule: m.capsule, author: m.author, channel: m.channel, title: m.title, body: m.body, salt: m.salt, label: m.label, openAt: m.openAt, sealedAt: m.sealedAt, sealTx: m.sealTx });
  function addMine(m) {
    S.mine = [m, ...S.mine.filter((x) => x.capsule !== m.capsule)].slice(0, 32);
    saveMine();
    paintMine();
  }

  function download(m) {
    const blob = new win.Blob([JSON.stringify(toFile(m), null, 2) + '\n'], { type: 'application/json' });
    const a = doc.createElement('a');
    a.href = win.URL.createObjectURL(blob);
    a.download = 'capsule-' + m.capsule.slice(0, 12) + '.json';
    doc.body.append(a);
    a.click();
    a.remove();
    win.setTimeout(() => win.URL.revokeObjectURL(a.href), 4000);
  }

  // ------------------------------------------------------------ drawing

  function eta(blocks) { return C.etaWords(blocks, S.rate); }

  function paintList() {
    const host = q('[data-cp-list]');
    if (!host) return;
    host.replaceChildren();
    const l = S.list;
    if (!l) { host.append(rowMsg('Waiting for the first read.')); return; }
    if (!l.enabled) { host.append(rowMsg('This devnet has no capsules (launch record 13 is off).')); return; }
    set('[data-cp-count]', plural(l.rows.length, 'capsule') + ' sealed · ' + l.rows.filter((r) => r.due).length + ' may be opened now · newest block #' + groups(l.height || 0));
    if (!l.rows.length) { host.append(rowMsg('No capsules are sealed on this devnet right now. Seal the first one above.')); return; }
    for (const r of l.rows.slice(0, 50)) {
      const st = C.stateOf(r, l.height || 0);
      const tr = el(doc, 'tr');
      const c0 = el(doc, 'th', '', shortHex(r.id, 8, 4));
      c0.scope = 'row';
      tr.append(c0, el(doc, 'td', '', r.label || '–'), el(doc, 'td', '', r.channel), el(doc, 'td', '', shortAddr(r.author)), el(doc, 'td', 'num', '#' + groups(r.openAt)), el(doc, 'td', '', st === 'waiting' ? 'in ' + plural(Math.max(0, r.openAt - (l.height || 0) - 1), 'block') : STATE_WORD[st]));
      host.append(tr);
    }
  }
  function rowMsg(text) {
    const tr = el(doc, 'tr');
    const td = el(doc, 'td', '', text);
    td.colSpan = 6;
    tr.append(td);
    return tr;
  }

  function paintMine() {
    const host = q('[data-cp-mine]');
    if (!host) return;
    host.replaceChildren();
    set('[data-cp-mine-count]', S.mine.length ? plural(S.mine.length, 'capsule file') + ' on this page' : 'No capsule files on this page yet.');
    for (const m of S.mine) {
      const li = el(doc, 'li', 'cp-mine');
      const match = C.matchFile(m, S.list);
      const sameDevnet = !S.status || m.genesis === S.status.genesis;
      const state = sameDevnet ? match.state : 'gone';
      li.dataset.state = state;
      const head = el(doc, 'div', 'cp-mine__h');
      head.append(el(doc, 'strong', 'cp-mine__t', m.title), el(doc, 'span', 'ca-badge', STATE_WORD[state]));
      li.append(head);
      const left = S.list && S.list.height !== null ? Math.max(0, m.openAt - S.list.height - 1) : null;
      li.append(el(doc, 'p', 'cp-mine__m', 'Wax seal “' + m.label + '” · channel ' + m.channel + ' · opens at block ' + groups(m.openAt) + (state === 'waiting' && left !== null ? ' · in ' + plural(left, 'block') + ': ' + eta(left) : '') + (sameDevnet ? '' : ' · this file is for another devnet (genesis ' + shortHex(m.genesis, 10, 6) + ')')));
      if (state === 'gone') li.append(el(doc, 'p', 'fine', sameDevnet ? 'The devnet does not list it: already opened, lapsed and pruned, or the devnet was reset.' : 'Nothing to do here: this page reads a different devnet.'));
      const actions = el(doc, 'div', 'ca-actions');
      const open = el(doc, 'button', 'btn', 'Open it');
      open.type = 'button';
      open.disabled = state !== 'due' || !(keys && keys.key()) || S.halted;
      open.addEventListener('click', () => showOpenConfirm(m));
      const dl = el(doc, 'button', 'btn btn--ghost', 'Download the file again');
      dl.type = 'button';
      dl.addEventListener('click', () => download(m));
      const rm = el(doc, 'button', 'btn btn--ghost', 'Remove from this page');
      rm.type = 'button';
      rm.addEventListener('click', () => { S.mine = S.mine.filter((x) => x.capsule !== m.capsule); saveMine(); paintMine(); });
      actions.append(open, dl, rm);
      if (state === 'due' && !(keys && keys.key())) actions.append(el(doc, 'span', 'fine', 'Make a key above to open it.'));
      li.append(actions);
      host.append(li);
    }
  }

  async function paintWall() {
    const host = q('[data-cp-wall]');
    if (!host) return;
    try {
      const w = await C.readWall(net);
      host.replaceChildren();
      set('[data-cp-wall-note]', 'Scanned the newest ' + groups(w.scannedBlocks) + ' blocks that carry transactions' + (w.complete ? ' (all of them).' : '.'));
      if (!w.items.length) { host.append(el(doc, 'li', 'ca-empty', 'No capsule has been opened in those blocks yet.')); return; }
      for (const it of w.items) {
        const li = el(doc, 'li', 'cp-wall');
        li.append(el(doc, 'strong', 'cp-wall__t', it.title || '(untitled)'));
        li.append(el(doc, 'pre', 'cp-wall__b', it.bodyVerified ? it.body : 'The devnet no longer serves this message, or it does not match the hash that was sealed.'));
        const waited = it.seal && it.seal.height ? it.height - it.seal.height : null;
        li.append(el(doc, 'p', 'fine', 'Opened in block ' + groups(it.height) + (it.timeMs ? ' · ' + utc(it.timeMs) : '') + ' by ' + shortAddr(it.opener) + (it.seal ? ' · sealed by ' + shortAddr(it.seal.author) + ' in block ' + groups(it.seal.height) + (it.seal.label ? ' with the label “' + it.seal.label + '”' : '') + (waited !== null ? ' · waited ' + plural(waited, 'block') : '') : ' · its seal is older than this scan')));
        host.append(li);
      }
    } catch (e) {
      host.replaceChildren(el(doc, 'li', 'ca-empty', 'The wall could not be read just now: ' + describeError(e)));
    }
  }

  async function readAll() {
    const st = await pinnedStatus(net, where.genesis || null);
    S.status = st;
    S.list = C.readCapsules(await net.get('/capsules'));
    try { S.rate = await C.readRate(net, st.height); } catch { /* the heartbeat rate is the fallback */ }
    set('[data-cp-rate]', 'The devnet has been sealing about ' + (Math.round(S.rate * 10) / 10) + ' blocks an hour (a block every ' + (S.rate > 0 ? Math.round(3600 / S.rate) : '?') + ' s on average).');
    set('[data-cp-meta]', net.api + ' · ' + st.chainId + ' · newest block #' + groups(st.height) + (where.override ? ' · local override' : '') + ' · read ' + plural(net.count, 'request') + ' so far');
  }

  async function refresh({ wall = true } = {}) {
    if (S.busy || S.halted) return;
    S.busy = true;
    try {
      await readAll();
      const banner = q('[data-cp-genesis]');
      if (banner) banner.hidden = true;
      paintList();
      paintMine();
      paintSealHint();
      say('Updated.', 'ready');
      if (wall) await paintWall();
    } catch (e) {
      if (e && e.name === 'GenesisChanged') {
        S.halted = true;
        const banner = q('[data-cp-genesis]');
        if (banner) { banner.hidden = false; banner.textContent = describeError(e); }
        say('GENESIS CHANGED. Capsules sealed before the reset are gone, and nothing can be sent.', 'changed');
      } else say('The devnet did not answer: ' + describeError(e) + (S.list ? ' The list shown is from the last read.' : ''), 'down');
    } finally {
      S.busy = false;
    }
  }

  // ------------------------------------------------------------ sealing

  function paintSealHint() {
    const d = q('[data-cp-delay]');
    const hint = q('[data-cp-delay-hint]');
    if (!d || !hint || !S.status) return;
    const v = /^\d{1,8}$/.test(d.value.trim()) ? Number(d.value.trim()) : null;
    hint.textContent = v === null ? 'A whole number of blocks.' : 'Opens at block ' + groups(S.status.height + v) + ': ' + eta(v) + '.';
  }

  function readSeal() {
    const k = keys && keys.key();
    return C.planSeal({
      channel: (q('[data-cp-channel]') || {}).value || '',
      title: (q('[data-cp-title]') || {}).value || '',
      body: (q('[data-cp-body]') || {}).value || '',
      label: (q('[data-cp-label]') || {}).value || '',
      delay: (q('[data-cp-delay]') || {}).value || '',
      tip: S.status ? S.status.height : null,
      sender: k ? k.sender : '',
    });
  }

  function showSealConfirm() {
    const plan = readSeal();
    const box = q('[data-cp-confirm]');
    const errs = q('[data-cp-errors]');
    if (errs) errs.replaceChildren();
    if (!plan.ok) {
      if (box) box.hidden = true;
      if (errs) { for (const e of plan.errors) errs.append(el(doc, 'li', '', e)); errs.hidden = false; }
      return plan;
    }
    if (errs) errs.hidden = true;
    S.plan = plan;
    const f = plan.fields;
    const list = q('[data-cp-confirm-list]');
    list.replaceChildren();
    list.append(el(doc, 'li', '', 'One seal_capsule transaction signed by ' + keys.key().sender + ': a commitment (a hash), channel ' + f.channel + ', open at block ' + groups(f.openAt) + ', wax seal label “' + f.label + '”. That is all that goes on chain now.'));
    list.append(el(doc, 'li', '', 'Not sent: your title, your message and the salt. They go into a capsule file you must keep.'));
    set('[data-cp-confirm-eta]', 'It may be opened from block ' + groups(f.openAt) + ' (' + eta(f.delay) + '). Sent to ' + net.api + ' (' + S.status.chainId + ').');
    if (box) box.hidden = false;
    return plan;
  }

  /** Keep a capsule file the moment it exists: under "your capsules", with the download button and the id shown. */
  function keepFile(file) {
    S.lastFile = file;
    const m = C.readCapsuleFile(file);
    addMine(m);
    const dl = q('[data-cp-download]');
    if (dl) dl.hidden = false;
    set('[data-cp-seal-id]', m.capsule);
    return m;
  }
  function dropFile(capsule, previous) {
    S.mine = S.mine.filter((x) => x.capsule !== capsule);
    saveMine();
    paintMine();
    S.lastFile = previous;
    const dl = q('[data-cp-download]');
    if (dl && !previous) dl.hidden = true;
  }

  async function sendSeal() {
    const plan = S.plan;
    const k = keys && keys.key();
    const result = q('[data-cp-result]');
    const btn = q('[data-cp-send]');
    if (!plan || !plan.ok || !k || S.halted) return;
    btn.disabled = true;
    const say2 = (t, state) => { if (result) { result.hidden = false; result.dataset.state = state || ''; set('[data-cp-result-text]', t); } };
    const previous = S.lastFile;
    try {
      say2('Checking the devnet’s genesis…', '');
      if (!S.chain) S.chain = await (env.connect || connectPinned)(net.api, { pinned: where.genesis || null, env: { fetch: env.fetch, timeoutMs: env.timeoutMs } });
      await readAll();
      const fresh = C.planSeal({ ...plan.fields, delay: plan.fields.delay, tip: S.status.height, sender: k.sender });
      if (!fresh.ok) { say2(fresh.errors[0], 'bad'); return; }
      // The capsule file is kept the moment the seal is signed, before it is sent: the salt exists nowhere else.
      const r = await C.sealCapsule({ chain: S.chain, net, key: k, plan: fresh, wait: env.wait, onStage: (s) => say2('Sealing… (' + s + ')', ''), onFile: (file) => { keepFile(file); } });
      const m = C.readCapsuleFile(r.file);
      const box = q('[data-cp-confirm]');
      if (box) box.hidden = true;
      say2('Sealed in block ' + r.height + '. The capsule opens at block ' + groups(m.openAt) + '. DOWNLOAD THE CAPSULE FILE NOW: it holds your message and the salt, and without it the capsule never opens.', 'ok');
      await refresh({ wall: false });
    } catch (e) {
      if (e && e.file && (e.sendState === 'sent' || e.sendState === 'maybe')) {
        // The devnet may hold this capsule. Its file stays, and a second Send would seal a second capsule with a fresh salt: close the confirm.
        S.plan = null;
        const box = q('[data-cp-confirm]');
        if (box) box.hidden = true;
        await refresh({ wall: false });
        const listed = Boolean(S.list && S.list.rows.some((x) => x.id === e.capsule));
        say2((listed ? 'The devnet lists this capsule, so it is sealed, though this page did not see the block confirm (' + describeError(e) + ') ' : sendFailureText(e) + ' It is not in the devnet’s list yet. Press “Read the devnet again” to look, and do not seal another until it shows. ') + 'DOWNLOAD THE CAPSULE FILE NOW: it is kept below with your message and the salt, and without it the capsule never opens.', listed ? 'ok' : 'warn');
      } else {
        if (e && e.file) dropFile(e.capsule, previous);
        say2(sendFailureText(e), 'bad');
      }
    } finally {
      btn.disabled = false;
    }
  }

  // ------------------------------------------------------------ importing and opening

  async function importFile(text) {
    const note = q('[data-cp-import-note]');
    try {
      const m = C.readCapsuleFile(text);
      addMine(m);
      if (note) { note.textContent = 'Added “' + m.title + '”.'; note.dataset.bad = 'no'; }
    } catch (e) {
      if (note) { note.textContent = describeError(e); note.dataset.bad = 'yes'; }
    }
  }

  function showOpenConfirm(m) {
    const box = q('[data-cp-open-confirm]');
    const k = keys && keys.key();
    if (!box || !k) return;
    S.openPlan = m;
    const list = q('[data-cp-open-list]');
    list.replaceChildren();
    list.append(el(doc, 'li', '', 'Your message, stored on the devnet by its hash (POST /body). It becomes public.'));
    list.append(el(doc, 'li', '', 'One open_capsule transaction signed by YOUR key ' + k.sender + ', revealing the salt. It airs as a post by the capsule’s author ' + m.author + ' on channel ' + m.channel + ', titled “' + m.title + '”.'));
    set('[data-cp-open-where]', 'Sent to ' + net.api + ' (' + (S.status ? S.status.chainId : '') + '). The page checks first that the devnet lists the capsule and its next block may open it.');
    box.hidden = false;
  }

  async function sendOpen() {
    const m = S.openPlan;
    const k = keys && keys.key();
    const result = q('[data-cp-open-result]');
    const btn = q('[data-cp-open-send]');
    if (!m || !k || S.halted) return;
    btn.disabled = true;
    const say2 = (t, state) => { if (result) { result.hidden = false; result.dataset.state = state || ''; set('[data-cp-open-result-text]', t); } };
    try {
      say2('Checking the devnet’s genesis…', '');
      if (!S.chain) S.chain = await (env.connect || connectPinned)(net.api, { pinned: where.genesis || null, env: { fetch: env.fetch, timeoutMs: env.timeoutMs } });
      const r = await C.openCapsule({ chain: S.chain, net, key: k, file: m, wait: env.wait, onStage: (s) => say2('Opening… (' + s + ')', '') });
      const box = q('[data-cp-open-confirm]');
      if (box) box.hidden = true;
      S.openPlan = null;
      say2('Opened in block ' + r.height + '. Transaction ' + r.txHash + '. The message is now public on the wall below.', 'ok');
      await refresh({ wall: true });
    } catch (e) {
      if (e && (e.sendState === 'sent' || e.sendState === 'maybe')) {
        // The open may be on chain, and then the message is public. Close the confirm, read the devnet again, and say what it shows.
        S.openPlan = null;
        const box = q('[data-cp-open-confirm]');
        if (box) box.hidden = true;
        await refresh({ wall: true });
        const stillListed = Boolean(S.list && S.list.rows.some((x) => x.id === m.capsule));
        say2(stillListed ? sendFailureText(e, { unsent: 'Not opened: ' }) + ' The capsule is still listed, so it has not opened yet; if it does, its message becomes public.' : 'The devnet no longer lists this capsule, so the open landed and its message is public on the wall below, though this page did not see it confirm (' + describeError(e) + ').', stillListed ? 'warn' : 'ok');
      } else {
        say2(sendFailureText(e, { unsent: 'Not opened: ' }), 'bad');
      }
    } finally {
      btn.disabled = false;
    }
  }

  // ------------------------------------------------------------ wiring

  S.mine = loadMine();
  const keepEl = keepBox();
  if (keepEl) { keepEl.checked = S.mine.length > 0; keepEl.disabled = !storage; keepEl.addEventListener('change', () => { saveMine(); }); }
  const review = q('[data-cp-review]');
  if (review) review.addEventListener('click', showSealConfirm);
  const send = q('[data-cp-send]');
  if (send) send.addEventListener('click', sendSeal);
  const cancel = q('[data-cp-cancel]');
  if (cancel) cancel.addEventListener('click', () => { const b = q('[data-cp-confirm]'); if (b) b.hidden = true; S.plan = null; });
  const dlBtn = q('[data-cp-download]');
  if (dlBtn) dlBtn.addEventListener('click', () => { if (S.lastFile) download(C.readCapsuleFile(S.lastFile)); });
  const imp = q('[data-cp-import-file]');
  if (imp) {
    imp.disabled = false;
    imp.addEventListener('change', async () => {
      const f = imp.files && imp.files[0];
      if (!f) return;
      let text;
      try { text = await readFileText(f, C.LIMITS.fileChars, 'that is too large to be a capsule file'); } catch (e) {
        const note = q('[data-cp-import-note]');
        if (note) { note.textContent = describeError(e); note.dataset.bad = 'yes'; }
        return;
      }
      importFile(text);
    });
  }
  const impText = q('[data-cp-import-text]');
  const impBtn = q('[data-cp-import-go]');
  if (impText) impText.disabled = false;
  if (impBtn) { impBtn.disabled = false; impBtn.addEventListener('click', () => { if (impText && impText.value.trim()) importFile(impText.value.trim()); }); }
  const openSend = q('[data-cp-open-send]');
  if (openSend) openSend.addEventListener('click', sendOpen);
  const openCancel = q('[data-cp-open-cancel]');
  if (openCancel) openCancel.addEventListener('click', () => { const b = q('[data-cp-open-confirm]'); if (b) b.hidden = true; S.openPlan = null; });
  const refreshBtn = q('[data-cp-refresh]');
  if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.addEventListener('click', () => refresh({ wall: true })); }
  const delay = q('[data-cp-delay]');
  if (delay) delay.addEventListener('input', paintSealHint);
  if (keys) keys.onChange(() => { S.plan = null; const b = q('[data-cp-confirm]'); if (b) b.hidden = true; paintMine(); });

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
      S.timer = win.setInterval(() => { if (doc.visibilityState !== 'hidden' && !S.halted) refresh({ wall: false }); }, POLL_MS);
    },
    refresh,
    readSeal,
    showSealConfirm,
    sendSeal,
    importFile,
    showOpenConfirm,
    sendOpen,
    paintMine,
    stop() { win.clearInterval(S.timer); },
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
