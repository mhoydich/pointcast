// verify-view.js: the DOM side of /chain/verify-a-block. It draws what
// verify.js returns into the skeleton the Astro page renders.
//
// Rules, held by tests/chain-app-verify.test.mjs:
// - Everything the devnet sends (titles, names, addresses, hashes) is
//   written with textContent or a text node. Never markup, an href, a src
//   or a style value; no setAttribute at all.
// - Lazy: importing this module touches no network and no DOM. start() waits
//   for the load event, an idle callback, the lesson coming within 400px of
//   the viewport and a visible tab, then reads the devnet once. Every later
//   read is something the reader asked for.
// - The devnet is only ever read (GET). Tampering changes a copy in memory.
// - devnet: no value, may reset. A seal or a witness is an accountable
//   claim, not proof of truth.

import * as V from './verify.js';

const MARK = { pass: '✓', fail: '✗', skip: '–', idle: '·' };
const WORD = { pass: 'PASS', fail: 'FAIL', skip: 'NOT FULLY CHECKED', idle: 'WAITING' };
const CHECK_WORD = { pass: 'PASS', fail: 'FAIL', skip: 'NOT CHECKED' };

function el(doc, tag, cls, text) {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

const isHexText = (s) => typeof s === 'string' && s.length > 0 && !/[^0-9a-f]/.test(s);

/** One labelled row: label, value (hex runs marked where it differs from the expected value), notes. */
export function renderRow(doc, r) {
  const d = el(doc, 'div', 'vb-r' + (r.cmp === 'ok' || r.cmp === 'bad' ? ' vb-r--' + r.cmp : '') + (r.strong ? ' vb-r--strong' : '') + (r.changed ? ' vb-r--changed' : ''));
  d.append(el(doc, 'span', 'vb-r__k', r.k));
  const v = el(doc, 'span', 'vb-r__v');
  if (r.kind === 'hex' && r.want && isHexText(r.v) && isHexText(r.want) && r.v.length === r.want.length) {
    for (const [text, differs] of V.diffRuns(r.v, r.want)) v.append(differs ? el(doc, 'mark', 'vb-diff', text) : doc.createTextNode(text));
  } else {
    v.textContent = r.v;
  }
  d.append(v);
  if (r.want) d.append(el(doc, 'span', 'vb-r__w', 'expected ' + r.want));
  if (r.changed) d.append(el(doc, 'span', 'vb-r__n', 'changed by you'));
  if (r.note) d.append(el(doc, 'span', 'vb-r__n', r.note));
  return d;
}

export function renderGroup(doc, g) {
  const d = el(doc, 'details', 'vb-group');
  d.open = !g.collapsed;
  d.append(el(doc, 'summary', 'vb-group__t', g.title));
  const rows = el(doc, 'div', 'vb-rows');
  for (const r of g.rows) rows.append(renderRow(doc, r));
  d.append(rows);
  return d;
}

function renderCheck(doc, c) {
  const li = el(doc, 'li', 'vb-ck');
  li.dataset.state = c.state;
  const mark = el(doc, 'span', 'vb-ck__m', MARK[c.state]);
  mark.ariaHidden = 'true'; // the word beside it says the same
  li.append(mark, el(doc, 'span', 'vb-ck__s', CHECK_WORD[c.state]), el(doc, 'span', 'vb-ck__t', c.text));
  return li;
}

/**
 * Wire the lesson up. Nothing is fetched here. Returns a controller:
 * begin() reads the devnet and opens the first block; run(n), redraw(),
 * loadWasm() and walk() are what the buttons call.
 * env (for tests): window, fetch, search, hash, random, loadWasm, now.
 */
export function mount(root, env = {}) {
  const doc = root.ownerDocument;
  const win = env.window || doc.defaultView;
  const q = (sel) => root.querySelector(sel);
  const ds = root.dataset;
  const override = env.override !== undefined ? env.override : V.devnetOverride(env.search !== undefined ? env.search : win.location.search);
  const api = override ? override.api : String(ds.api || '');
  const pinned = override ? override.genesis : String(ds.genesis || '');
  if (!/^https?:\/\/[a-z0-9.:-]+/i.test(api) || /[^a-z0-9.:/-]/i.test(api)) return null;
  const netEnv = { fetch: env.fetch };
  const random = env.random || (() => Math.random());

  const S = { chain: null, set: null, n: null, tip: null, tamperOn: false, kind: 'prev_hash', verifier: null, run: 0, paint: 0, busy: false, report: null, begun: null, refocus: null };
  const input = q('[data-vb-input]');
  const goBtn = q('[data-vb-go]');
  const nearBtn = q('[data-vb-near]');
  const randBtn = q('[data-vb-random]');
  const txsBtn = q('[data-vb-txs]');
  const prevBtn = q('[data-vb-prev]');
  const nextBtn = q('[data-vb-next]');
  const tamperBox = q('[data-vb-tamper]');
  const kindSel = q('[data-vb-kind]');
  const wasmBtn = q('[data-vb-wasm]');
  const walkBtn = q('[data-vb-walk]');
  const buttons = [goBtn, nearBtn, randBtn, txsBtn, prevBtn, nextBtn].filter(Boolean);

  const set = (sel, text) => { const n = q(sel); if (n) n.textContent = text; };
  const say = (text) => set('[data-vb-status]', text);

  function setBusy(b) {
    // Disabling a control that has the focus drops the focus to <body>: remember which one it was and give it back when the run ends.
    if (b && !S.busy) S.refocus = [...buttons, input].find((x) => x && x === doc.activeElement) || null;
    S.busy = b;
    root.dataset.busy = b ? 'yes' : 'no';
    for (const x of buttons) x.disabled = b;
    if (input) input.disabled = b;
  }

  /** Put the keyboard focus back where it was (the control a run disabled), or, if that control stays off (Next at the tip), on the block line. */
  function restoreFocus() {
    const want = S.refocus;
    S.refocus = null;
    if (!want) return;
    if (!want.disabled) { want.focus(); return; }
    const heading = q('[data-vb-block]');
    if (heading) { heading.tabIndex = -1; heading.focus(); }
  }

  function genesisInfo() {
    if (pinned) return { genesis: pinned, source: 'pinned' };
    return { genesis: S.chain ? S.chain.status.genesis : '', source: 'node' };
  }

  function paintPin() {
    const g = genesisInfo();
    set('[data-vb-pin-hash]', g.genesis);
    set('[data-vb-pin-how]', g.source === 'pinned'
      ? (override ? 'pinned by the address of this page' : 'pinned in this page’s build, from the same constants as the Block Yard and the Daily Net')
      : 'taken from this local node for a local test: nothing outside it pins it');
    if (S.chain) {
      set('[data-vb-net]', api + ' · ' + S.chain.status.chainId + ' · tip ' + S.chain.status.height + (override ? ' · local override' : ''));
      const note = q('[data-vb-genesis-note]');
      if (note) {
        const changed = Boolean(pinned) && S.chain.status.genesis !== pinned;
        note.hidden = !changed;
        if (changed) note.textContent = 'GENESIS CHANGED. The devnet now reports genesis ' + S.chain.status.genesis + ', but this page pins ' + pinned + '. The devnet was probably reset, and a reset is dated and recorded. The steps below will fail at the pin, which is the pin doing its job.';
      }
    }
  }

  async function ensureChain() {
    if (S.chain) return S.chain;
    S.chain = await V.loadChain(api, netEnv);
    S.tip = S.chain.status.height;
    paintPin();
    return S.chain;
  }

  function updateKinds(block) {
    if (!kindSel) return;
    const avail = V.tamperAvailable(block);
    for (const o of kindSel.options) o.disabled = !avail[o.value];
    if (!avail[S.kind]) S.kind = 'prev_hash';
    kindSel.value = S.kind;
    set('[data-vb-tamper-note]', block.txs.length ? 'Only the copy in this browser tab changes. The devnet is never written to. Switch it on and the steps run again at once, so you can watch which check catches the change.' : 'This block holds no transactions, so the transaction choices are off. “A block with transactions” finds one.');
  }

  function paintStep(step) {
    const li = q('[data-step="' + step.id + '"]');
    if (!li) return;
    li.dataset.state = step.state;
    set('[data-step="' + step.id + '"] [data-vb-mark]', MARK[step.state]);
    set('[data-step="' + step.id + '"] [data-vb-state]', WORD[step.state]);
    set('[data-step="' + step.id + '"] [data-vb-tool]', step.tool ? 'Tool used here: ' + step.tool : '');
    const checks = li.querySelector('[data-vb-checks]');
    if (checks) {
      const { shown, hidden } = V.listChecks(step.checks);
      const items = shown.map((c) => renderCheck(doc, c));
      if (hidden) items.push(renderCheck(doc, { state: 'pass', text: '+ ' + hidden + ' more checks passed, not listed here.' }));
      checks.replaceChildren(...items);
    }
    const groups = li.querySelector('[data-vb-groups]');
    if (groups) groups.replaceChildren(...step.groups.map((g) => renderGroup(doc, g)));
  }

  function resetSteps() {
    for (const li of root.querySelectorAll('[data-step]')) {
      li.dataset.state = 'idle';
      const m = li.querySelector('[data-vb-mark]'); if (m) m.textContent = MARK.idle;
      const w = li.querySelector('[data-vb-state]'); if (w) w.textContent = WORD.idle;
      const c = li.querySelector('[data-vb-checks]'); if (c) c.replaceChildren();
      const g = li.querySelector('[data-vb-groups]'); if (g) g.replaceChildren();
    }
  }

  function paintSummary() {
    if (!S.set) return;
    const h = S.set.block.header;
    const when = V.formatTime(h.timestamp);
    set('[data-vb-block]', 'Block ' + S.n + ' · ' + when + ' · ' + S.set.block.txs.length + (S.set.block.txs.length === 1 ? ' transaction' : ' transactions') + ' · tip ' + S.tip);
    if (prevBtn) prevBtn.disabled = S.busy || S.n <= 1;
    if (nextBtn) nextBtn.disabled = S.busy || S.n >= S.tip;
    if (walkBtn) { walkBtn.disabled = false; walkBtn.textContent = 'Walk the headers from block 1 to block ' + S.n; }
  }

  async function redraw(announce) {
    if (!S.set || !S.chain) return null;
    const mine = ++S.paint;
    let copy = S.set;
    let note = null;
    if (S.tamperOn) {
      const avail = V.tamperAvailable(S.set.block);
      if (avail[S.kind]) { const t = V.tamperSet(S.set, S.kind); copy = t.set; note = t.note; }
    }
    const g = genesisInfo();
    const report = await V.runSteps({
      n: S.n, params: S.chain.params, genesis: g.genesis, pinSource: g.source, chain: S.chain,
      paths: S.set.paths, prev: copy.prev, block: copy.block, next: copy.next, verifier: S.verifier, tamper: note,
    });
    if (mine !== S.paint) return null;
    S.report = report;
    for (const step of report.steps) paintStep(step);
    root.dataset.state = 'live';
    root.dataset.verdict = report.verdict;
    const banner = q('[data-vb-banner]');
    if (banner) {
      banner.hidden = !note;
      set('[data-vb-banner-what]', note ? note.text : '');
      set('[data-vb-banner-caught]', note ? V.caughtBy(report) : '');
    }
    if (announce === 'run') say(report.summary + (copy.block.txs.length ? '' : ' It holds no transactions, so steps 4 and 5 have little to check: “A block with transactions” shows more.'));
    else if (announce === 'tamper') say(note ? note.text + ' ' + V.caughtBy(report) : 'Tamper is off. ' + report.summary);
    else if (announce === 'wasm') say('The chain’s own wasm is on. ' + report.summary);
    return report;
  }

  async function run(n) {
    const token = ++S.run;
    setBusy(true);
    root.dataset.state = S.set ? 'live' : 'loading';
    try {
      await ensureChain();
      const status = await V.loadStatus(api, netEnv);
      S.tip = status.height;
      if (status.genesis !== S.chain.status.genesis) {
        // the devnet was reset while this page was open: read its params again, and say so
        S.chain = await V.loadChain(api, netEnv);
        paintPin();
      }
      S.chain.status.height = status.height;
      let target = n === null || n === undefined ? V.defaultBlock(S.tip) : n;
      if (target > S.tip) { say('Block ' + target + ' is not on the devnet yet. The tip is block ' + S.tip + '.'); return; }
      say('Fetching block ' + target + ' and its neighbours…');
      const blocks = await V.fetchBlockSet(api, target, netEnv);
      if (token !== S.run) return;
      S.set = blocks;
      S.n = target;
      if (input) input.value = String(target);
      updateKinds(blocks.block);
      paintPin();
      paintSummary();
      set('[data-vb-walk-result]', '');
      await redraw('run');
      try { if (win.history && win.history.replaceState) win.history.replaceState(null, '', '#b=' + target); } catch { /* a sandboxed frame */ }
    } catch (e) {
      if (token === S.run) {
        root.dataset.state = S.set ? 'live' : 'down';
        say(S.chain
          ? 'Could not read that block: ' + V.cleanText(e && e.message, 140) + '. The devnet may be restarting, or paused; try again.'
          : 'The devnet is unreachable. It may be restarting or paused; press “Check this block” to try again.');
      }
    } finally {
      if (token === S.run) { setBusy(false); paintSummary(); restoreFocus(); }
    }
  }

  async function pickRandom() {
    try {
      const status = await V.loadStatus(api, netEnv);
      S.tip = status.height;
      return V.parseBlockNumber(String(1 + Math.floor(random() * Math.max(1, status.height - 1))), status.height);
    } catch { return null; }
  }

  async function pickWithTxs() {
    try {
      const heights = await V.recentTxBlocks(api, netEnv);
      const others = heights.filter((h) => h !== S.n);
      const pool = others.length ? others : heights;
      return pool.length ? pool[Math.floor(random() * pool.length)] : 1;
    } catch { return 1; }
  }

  async function loadWasm() {
    if (!wasmBtn || S.verifier) return;
    wasmBtn.disabled = true;
    say('Loading the pinned verifier wasm…');
    try {
      const w = env.loadWasm ? await env.loadWasm({ url: ds.wasm, sha256: ds.wasmSha256 }) : await V.loadWasmVerifier({ url: ds.wasm, sha256: ds.wasmSha256, fetch: env.fetch });
      S.verifier = w.verifier;
      wasmBtn.textContent = 'The chain’s own wasm is on';
      await redraw('wasm');
    } catch (e) {
      wasmBtn.disabled = false;
      say('The wasm did not load: ' + V.cleanText(e && e.message, 160));
    }
  }

  async function walk() {
    if (!S.set || !S.chain || !walkBtn) return;
    const g = genesisInfo();
    walkBtn.disabled = true;
    const out = q('[data-vb-walk-result]');
    if (out) out.dataset.state = 'busy';
    say('Walking the headers from block 1…');
    try {
      const w = await V.walkToGenesis({
        api, params: S.chain.params, genesis: g.genesis, upTo: S.n, expectHash: V.headerHashOf(S.set.block.header), env: netEnv,
        onProgress: (p) => say('Walking: block ' + p.done + ' of ' + p.of + '.'),
      });
      const line = V.walkSummary(w);
      set('[data-vb-walk-result]', line);
      if (out) out.dataset.state = w.fault || w.matchesBlock === false ? 'fail' : w.incomplete || w.rootsSkipped ? 'skip' : 'pass';
      say(line);
    } catch (e) {
      const line = 'The walk could not finish: ' + V.cleanText(e && e.message, 160) + '.';
      set('[data-vb-walk-result]', line);
      if (out) out.dataset.state = 'fail';
      say(line);
    } finally {
      walkBtn.disabled = false;
    }
  }

  // options for the tamper menu: constants from verify.js, never devnet text
  if (kindSel && !kindSel.options.length) {
    for (const k of V.TAMPERS) { const o = doc.createElement('option'); o.value = k.id; o.textContent = k.label; kindSel.append(o); }
    kindSel.value = S.kind;
  }

  const form = q('[data-vb-form]');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = V.parseBlockNumber(input ? input.value : '', S.tip === null ? undefined : S.tip);
    if (n === null) { say(S.tip === null ? 'Type a whole number from 1 up.' : 'Type a whole block number from 1 to ' + S.tip + '.'); return; }
    run(n);
  });
  if (nearBtn) nearBtn.addEventListener('click', () => run(null));
  if (randBtn) randBtn.addEventListener('click', async () => { const n = await pickRandom(); run(n); });
  if (txsBtn) txsBtn.addEventListener('click', async () => { const n = await pickWithTxs(); run(n); });
  if (prevBtn) prevBtn.addEventListener('click', () => { if (S.n > 1) run(S.n - 1); });
  if (nextBtn) nextBtn.addEventListener('click', () => { if (S.n < S.tip) run(S.n + 1); });
  if (tamperBox) tamperBox.addEventListener('change', () => { S.tamperOn = tamperBox.checked; if (kindSel) kindSel.disabled = !S.tamperOn; redraw('tamper'); });
  if (kindSel) {
    kindSel.disabled = true;
    kindSel.addEventListener('change', () => { S.kind = kindSel.value; if (S.tamperOn) redraw('tamper'); });
  }
  if (wasmBtn) wasmBtn.addEventListener('click', () => loadWasm());
  if (walkBtn) walkBtn.addEventListener('click', () => walk());
  win.addEventListener('hashchange', () => {
    const n = V.blockFromHash(win.location.hash);
    if (n !== null && n !== S.n && S.chain) run(n);
  });

  resetSteps();
  paintPin();

  return {
    api, state: S, run, redraw, loadWasm, walk, genesisInfo,
    /** Read the devnet and open the first block (the hash's, else a few behind the tip). Resolves when drawn. */
    begin() {
      if (!S.begun) {
        for (const x of buttons) x.disabled = false;
        if (input) input.disabled = false;
        S.begun = run(V.blockFromHash(env.hash !== undefined ? env.hash : win.location.hash));
      }
      return S.begun;
    },
  };
}

/** Lazy start: load event, idle callback, near the viewport, visible tab; then one read of the devnet. */
export function start(root, env = {}) {
  const c = mount(root, env);
  if (!c) return null;
  const doc = root.ownerDocument;
  const win = env.window || doc.defaultView;
  const visible = () => doc.visibilityState !== 'hidden';
  const idle = (fn) => (typeof win.requestIdleCallback === 'function' ? win.requestIdleCallback(fn, { timeout: 4000 }) : win.setTimeout(fn, 1200));
  let near = false;
  let began = false;
  const tryBegin = () => {
    if (began || !near || !visible()) return;
    began = true;
    idle(() => c.begin());
  };
  const arm = () => {
    if (typeof win.IntersectionObserver === 'function') {
      const io = new win.IntersectionObserver((entries) => { near = entries.some((e) => e.isIntersecting); tryBegin(); }, { rootMargin: '400px 0px' });
      io.observe(root);
    } else {
      near = true;
      tryBegin();
    }
    doc.addEventListener('visibilitychange', tryBegin);
  };
  if (doc.readyState === 'complete') arm(); else win.addEventListener('load', arm, { once: true });
  return c;
}
