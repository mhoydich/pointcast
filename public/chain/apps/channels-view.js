// channels-view.js: the DOM side of Channels (/chain/channels). It draws what
// channels.js returns into the skeleton the Astro page renders.
//
// Rules, held by tests/chain-app-channels.test.mjs:
// - Everything the devnet sends (codes, names, titles, bodies, addresses) is
//   written with textContent or a text node. Never markup, an href or a style
//   value. This page makes no download and builds no link from data.
// - Lazy: importing this module touches no network and no DOM. start() waits for
//   the load event, an idle callback, the section within 400px of the viewport and
//   a visible tab, then reads the devnet.
// - Reads are GETs. Writes, each behind a Review and a confirm box, with a key made
//   in this browser, to the devnet the page points at: claim_station,
//   set_station, publish_block (and the body, stored by its hash, before it).
// - The page broadcasts only to a channel the key owns or crews, never to a house
//   code or a code the house holds, and offers no claim on a reserved code.
// - A write is checked again against a fresh read of the devnet right before it is
//   signed. devnet: no value, may reset. A reset takes every claim.

import * as C from './channels.js';
import { mountKeyPanel } from './key-panel.js';
import { cleanText, connectPinned, describeError, groups, makeNet, pinnedStatus, plural, resolveApi, sendFailureText, shortAddr, shortHex, utc, whenReady } from './chain-kit.js';

const POLL_MS = 20000;

function el(doc, tag, cls, text) {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

const MODE_WORD = { open: 'OPEN', crew: 'CREW', unclaimed: 'NO STATION' };

/** The receipt of a write, as label and value pairs: what the chain sealed, and what it says now. Pure. */
export function receiptRows({ kind, txHash, height, index, sender, api, chainId, station = null, code = '' }) {
  const rows = [
    ['Write', kind],
    ['Transaction', txHash || ''],
    ['In block', height === null || height === undefined ? 'not seen yet' : '#' + groups(height) + (Number.isFinite(index) ? ' · position ' + index : '')],
    ['Signed by', sender],
    ['Sent to', api + ' (' + chainId + ')'],
  ];
  if (station) {
    rows.push(['The chain now says', station.code + ' · ' + station.mode + ' mode · owner ' + station.owner + ' · name “' + station.name + '” · ' + plural(station.crew.length, 'crew member') + (station.pinned ? ' · pin ' + shortHex(station.pinned, 8, 6) : '') + (station.offer ? ' · offered to ' + station.offer : '')]);
  }
  rows.push(['Check it yourself', 'GET /tx/' + (txHash || '<hash>') + (code ? ' and GET /station/' + code : '')]);
  return rows;
}

export function mount(root, env = {}) {
  const doc = root.ownerDocument;
  const win = env.window || doc.defaultView;
  const q = (sel) => root.querySelector(sel);
  const qa = (sel) => [...root.querySelectorAll(sel)];
  const ds = root.dataset;
  const search = env.search !== undefined ? env.search : win.location.search;
  const where = resolveApi(search, { api: String(ds.api || ''), genesis: String(ds.genesis || '') });
  if (!/^https?:\/\/[a-z0-9.:-]+$/i.test(where.api)) return null;
  const net = makeNet(where.api, { fetch: env.fetch, timeoutMs: env.timeoutMs });
  const S = {
    begun: false, halted: false, status: null, list: null, launch: null, world: null, scan: C.newScan(), rows: [], selected: '', filter: 'all', chain: null, timer: 0, busy: false,
    claim: { plan: null }, mode: { code: '', name: '', modeValue: 'open', crew: [], base: '', plan: null }, post: { plan: null }, more: false, dirSig: '', detailSig: '', feedSig: '', crewSig: '', feedCode: '', feedTop: '',
  };
  // A line that has not changed is left alone, so a live region does not announce the same words again on every poll.
  const set = (sel, text) => { const n = q(sel); if (n && n.textContent !== text) n.textContent = text; };
  const say = (text, state) => { set('[data-cc-status]', text); if (state) root.dataset.state = state; };
  const panel = q('[data-key-panel]');
  const keys = panel ? mountKeyPanel(panel, { window: win, storage: env.storage, supported: env.supported }) : null;
  const me = () => { const k = keys && keys.key(); return k ? k.sender : ''; };
  const wantChannel = (() => {
    try { const v = new win.URLSearchParams(search).get('channel'); const c = v ? C.checkCode(v) : null; return c && c.ok ? c.code : ''; } catch { return ''; }
  })();

  // ------------------------------------------------------------ helpers

  const radioValue = (name) => { const r = qa('[' + name + ']').find((x) => x.checked); return r ? r.value : ''; };
  const setRadio = (name, value) => { for (const r of qa('[' + name + ']')) r.checked = r.value === value; };
  const show = (sel, on) => { const n = q(sel); if (n) n.hidden = !on; };
  const station = (code) => (S.world ? S.world.byCode.get(code) || null : null);
  const myStations = () => (S.world && S.world.list && me() ? S.world.list.rows.filter((s) => s.owner === me()) : []);

  /** Fill a select with `options` ([value, text]), keeping the chosen value when it is still there. */
  function fillSelect(sel, options, keep) {
    const n = q(sel);
    if (!n) return;
    // The same options are not rebuilt: a poll must not close a list a keyboard user has open.
    const sig = JSON.stringify(options);
    if (n.dataset.sig === sig) { if (keep !== undefined && options.some(([v]) => v === keep)) n.value = keep; return; }
    n.dataset.sig = sig;
    const was = keep !== undefined ? keep : n.value;
    n.replaceChildren();
    for (const [v, t] of options) { const o = el(doc, 'option', '', t); o.value = v; n.append(o); }
    n.value = options.some(([v]) => v === was) ? was : options.length ? options[0][0] : '';
  }

  function paintAs() {
    const text = me() ? 'Signing as ' + me() + '.' : 'No key yet: make one under “Claim a code”.';
    for (const n of qa('[data-cc-as]')) n.textContent = text;
  }

  // ------------------------------------------------------------ the directory

  function paintDirectory() {
    const host = q('[data-cc-list]');
    if (!host) return;
    if (!S.world || !S.world.list) { host.replaceChildren(rowMsg('Waiting for the first read.')); S.dirSig = ''; return; }
    S.rows = C.directory({ world: S.world, scan: S.scan, me: me() });
    const shown = C.filterRows(S.rows, S.filter);
    const claimed = S.rows.filter((r) => r.station).length;
    set('[data-cc-count]', [plural(S.rows.length, 'channel'), claimed + ' with a station', S.world.max ? 'one account may hold ' + S.world.max : '', shown.length !== S.rows.length ? 'showing ' + shown.length : ''].filter(Boolean).join(' · '));
    set('[data-cc-scan-note]', 'Read the newest ' + groups(S.scan.blocks) + ' blocks that carry transactions' + (S.scan.complete ? ' (all of them).' : ' (older ones are not read yet).') + ' A channel with posts and no station is open to everyone, until someone claims it.');
    // A poll that finds nothing new leaves the table alone: a keyboard user's place in it is not thrown away every twenty seconds.
    const sig = JSON.stringify([S.filter, S.selected, me(), S.world.enabled, shown.map((r) => [r.code, r.held, r.mode, r.crew.length, r.last ? r.last.height : 0, r.seen, r.station ? r.station.name : ''])]);
    if (sig === S.dirSig && host.childElementCount) return;
    S.dirSig = sig;
    host.replaceChildren();
    if (!S.world.enabled) host.append(rowMsg('This devnet has no stations (launch record 13 is off). Posts are still listed by channel when it has any.'));
    if (!shown.length) { host.append(rowMsg(S.filter === 'all' ? 'No channel has a station or a post yet.' : 'No channel matches that filter.')); return; }
    for (const r of shown.slice(0, C.LIMITS.rows)) {
      const tr = el(doc, 'tr');
      if (r.code === S.selected) tr.dataset.selected = 'yes';
      const th = el(doc, 'th');
      th.scope = 'row';
      const b = el(doc, 'button', 'btn btn--ghost cc-open', r.code);
      b.type = 'button';
      b.setAttribute('aria-label', 'Open channel ' + r.code);
      if (r.code === S.selected) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => select(r.code, { focus: true }));
      th.append(b);
      const held = r.station ? C.holderWords(r.station, S.world, me()) : 'nobody';
      const lastCell = r.last ? '#' + groups(r.last.height) + (r.last.timeMs ? ' · ' + utc(r.last.timeMs) : '') : 'none in what was read';
      tr.append(th, el(doc, 'td', '', held), el(doc, 'td', '', MODE_WORD[r.mode] + (r.station && r.station.name && r.station.name !== r.code ? ' · ' + r.station.name : '')), el(doc, 'td', 'num', r.station ? String(r.crew.length) : '–'), el(doc, 'td', '', lastCell), el(doc, 'td', 'num', String(r.seen)));
      host.append(tr);
    }
    if (shown.length > C.LIMITS.rows) host.append(rowMsg('Showing the first ' + C.LIMITS.rows + ' of ' + shown.length + '.'));
  }
  function rowMsg(text) {
    const tr = el(doc, 'tr');
    const td = el(doc, 'td', '', text);
    td.colSpan = 6;
    tr.append(td);
    return tr;
  }

  function select(code, { focus = false } = {}) {
    S.selected = code;
    paintDirectory();
    paintDetail();
    if (focus) { const h = q('[data-cc-detail-title]'); if (h && typeof h.focus === 'function') h.focus(); }
  }

  function dl(items) {
    const d = el(doc, 'dl', 'ca-kv');
    for (const [k, v] of items) {
      const row = el(doc, 'div');
      row.append(el(doc, 'dt', '', k), el(doc, 'dd', '', v));
      d.append(row);
    }
    return d;
  }

  function paintDetail() {
    const box = q('[data-cc-detail]');
    if (!box) return;
    const code = S.selected;
    if (!code) { box.hidden = true; S.detailSig = ''; return; }
    box.hidden = false;
    const st = station(code);
    set('[data-cc-detail-title]', code);
    const sig = JSON.stringify([code, st, me(), S.world ? S.world.house : '', S.world ? C.isHouse(st, S.world) : false]);
    if (sig === S.detailSig) { paintFeed(); return; }
    S.detailSig = sig;
    const facts = q('[data-cc-detail-facts]');
    facts.replaceChildren();
    if (st) {
      const role = C.roleOf(st, me());
      facts.append(dl([
        ['Held by', C.holderWords(st, S.world, me()) + (st.owner && !(me() && st.owner === me()) ? ' · ' + st.owner : '')],
        ['Name', st.name],
        ['Mode', MODE_WORD[st.mode] + ' · ' + (st.mode === 'crew' ? 'only the owner and the crew post' : 'anyone may post')],
        ['Crew', st.crew.length ? st.crew.join(' · ') : 'none'],
        ['Pin', st.pinned || 'none'],
        ['Standing offer', st.offer ? 'offered to ' + st.offer : 'none'],
        ['Claimed in block', '#' + groups(st.claimedAt)],
        ['This key', role === 'owner' ? 'owns it' : role === 'crew' ? 'is on its crew' : me() ? 'is neither the owner nor on the crew' : 'none yet'],
      ]));
      set('[data-cc-detail-words]', C.modeWords(st.mode, code, st.crew.length) + (C.isHouse(st, S.world) ? ' This is a house channel: this page never posts to it.' : ''));
    } else {
      facts.append(dl([['Held by', 'nobody'], ['Mode', 'NO STATION · anyone may post (the chain gates a channel only once it is claimed)']]));
      set('[data-cc-detail-words]', 'Nobody has claimed ' + code + '. The chain lets anyone post on an unclaimed code; this page broadcasts only to a channel you own or crew.');
    }
    const acts = q('[data-cc-detail-actions]');
    acts.replaceChildren();
    const mk = (label, fn, cls = 'btn btn--ghost') => { const b = el(doc, 'button', cls, label); b.type = 'button'; b.addEventListener('click', fn); acts.append(b); return b; };
    if (!st) {
      const c = C.checkClaimable(code, me(), S.world);
      if (c.ok) mk('Use this code in Claim', () => useInClaim(code));
    } else {
      if (me() && st.owner === me()) mk('Manage it', () => manage(code));
      if (C.roleOf(st, me()) && !C.isHouse(st, S.world)) mk('Broadcast on it', () => broadcastOn(code));
      if (st.offer === me() && me()) mk('Use this code in Claim', () => useInClaim(code));
    }
    set('[data-cc-feed-title]', 'On air now on ' + code);
    paintFeed();
  }

  function paintFeed() {
    const host = q('[data-cc-feed]');
    if (!host) return;
    const code = S.selected;
    const posts = code ? C.postsOf(S.scan, code) : [];
    // The list is a live region: it is rebuilt only when what it shows has changed.
    const sig = JSON.stringify([code, me(), S.scan.complete, S.scan.blocks, posts.map((p) => [p.hash, p.hidden, p.bodyState])]);
    const more0 = q('[data-cc-older]');
    if (more0) { more0.disabled = S.scan.complete || S.more || S.halted; more0.textContent = S.scan.complete ? 'All blocks read' : S.more ? 'Reading…' : 'Read older blocks'; }
    if (sig === S.feedSig && host.childElementCount) return;
    S.feedSig = sig;
    // A screen reader hears one short line about a new post, not the whole list again.
    const top = posts.length ? posts[0].hash : '';
    set('[data-cc-feed-note]', S.feedCode === code && S.feedTop && top && top !== S.feedTop ? 'A new post on ' + code + ': ' + posts[0].title : '');
    S.feedCode = code;
    S.feedTop = top;
    host.replaceChildren();
    if (!posts.length) {
      host.append(el(doc, 'li', 'ca-empty', code ? 'No post on ' + code + ' in the ' + groups(S.scan.blocks) + ' blocks read' + (S.scan.complete ? ' (all of them).' : ' so far.') : ''));
    }
    for (const p of posts) {
      const li = el(doc, 'li', 'cc-post');
      if (p.hidden) li.dataset.state = 'hidden';
      li.append(el(doc, 'strong', 'cc-post__t', p.title || '(untitled)'));
      if (p.bodyState === 'ok') li.append(el(doc, 'pre', 'cc-post__b', p.body.length > C.LIMITS.preview ? p.body.slice(0, C.LIMITS.preview - 1) + '…' : p.body));
      else if (p.bodyState === 'hidden') li.append(el(doc, 'p', 'fine', 'The devnet’s keeper hid this post. The block is unchanged and still verifies; the body and any media link are withheld here.'));
      else if (p.bodyState === 'unverified') li.append(el(doc, 'p', 'fine', 'The body the devnet sent does not hash to what the post commits to, so it is not shown.'));
      else if (p.bodyState === 'missing') li.append(el(doc, 'p', 'fine', 'The devnet did not send this post’s body.'));
      const who = p.sender === me() && me() ? 'you' : shortAddr(p.sender);
      li.append(el(doc, 'p', 'fine', 'Block #' + groups(p.height) + (p.timeMs ? ' · ' + utc(p.timeMs) : '') + ' · by ' + who + (p.bot ? ' · bot ' + p.bot : '') + (p.hidden ? ' · hidden by the devnet admin' : '')));
      host.append(li);
    }
  }

  async function readOlder() {
    if (S.more || S.scan.complete || S.halted) return;
    S.more = true;
    paintFeed();
    try {
      await C.scanFeed(net, S.scan, { pages: C.LIMITS.morePages });
      paintDirectory();
      paintDetail();
    } catch (e) {
      say('The older blocks could not be read just now: ' + describeError(e), 'down');
    } finally {
      S.more = false;
      paintFeed();
    }
  }

  // ------------------------------------------------------------ claiming

  function useInClaim(code) {
    const c = q('[data-cc-claim-code]');
    if (c) { c.value = code; paintClaimHint(); try { c.focus(); } catch { /* a detached node cannot take focus */ } }
  }

  function paintClaimHint() {
    const hint = q('[data-cc-claim-hint]');
    const input = q('[data-cc-claim-code]');
    if (!hint || !input) return;
    if (!input.value.trim()) { hint.textContent = 'Type a code. Lower case is made upper case for you.'; hint.dataset.bad = 'no'; return; }
    if (!S.world || !S.world.list) { hint.textContent = 'Reading the devnet…'; hint.dataset.bad = 'no'; return; }
    const c = C.checkClaimable(input.value, me(), S.world);
    hint.textContent = c.message;
    hint.dataset.bad = c.ok ? 'no' : 'yes';
    const held = me() ? C.heldBy(S.world, me()) : 0;
    set('[data-cc-held]', me() && S.world.max ? 'This key holds ' + held + ' of the ' + S.world.max + ' stations one account may hold.' : S.world.max ? 'One account may hold ' + S.world.max + ' stations; the house’s own codes count against nobody.' : '');
  }

  function readClaim() {
    return C.planClaim({ code: (q('[data-cc-claim-code]') || {}).value || '', name: (q('[data-cc-claim-name]') || {}).value || '', mode: radioValue('data-cc-claim-mode'), sender: me(), world: S.world || C.makeWorld() });
  }

  function showClaimConfirm() {
    const plan = readClaim();
    const box = q('[data-cc-claim-confirm]');
    const errs = q('[data-cc-claim-errors]');
    if (errs) errs.replaceChildren();
    if (!plan.ok) {
      if (box) box.hidden = true;
      if (errs) { for (const e of plan.errors) errs.append(el(doc, 'li', '', e)); errs.hidden = false; }
      return plan;
    }
    if (errs) errs.hidden = true;
    S.claim.plan = plan;
    const f = plan.fields;
    const list = q('[data-cc-claim-list]');
    list.replaceChildren();
    list.append(el(doc, 'li', '', 'One claim_station transaction signed by ' + me() + ': code ' + f.code + ', name “' + f.name + '”, mode ' + f.mode + '.' + (f.kind === 'take_offer' ? ' It takes the station its owner offered you, and clears its crew and pin.' : '')));
    list.append(el(doc, 'li', '', C.modeWords(f.mode, f.code, 0)));
    list.append(el(doc, 'li', '', 'First come, first served: if another claim on ' + f.code + ' is sealed first, yours is refused and nothing changes. Nobody can take the code back from you, and a reset removes it.'));
    set('[data-cc-claim-where]', 'Sent to ' + net.api + ' (' + (S.status ? S.status.chainId : '') + '). The page reads the devnet again right before it signs.');
    if (box) box.hidden = false;
    return plan;
  }

  function paintResult(prefix, text, state, rows) {
    const box = q('[data-cc-' + prefix + '-result]');
    if (!box) return;
    box.hidden = false;
    box.dataset.state = state || '';
    set('[data-cc-' + prefix + '-result-text]', text);
    const host = q('[data-cc-' + prefix + '-receipt]');
    if (host) {
      host.replaceChildren();
      if (rows && rows.length) host.append(dl(rows));
    }
  }

  async function connect() {
    if (!S.chain) S.chain = await (env.connect || connectPinned)(net.api, { pinned: where.genesis || null, env: { fetch: env.fetch, timeoutMs: env.timeoutMs } });
    return S.chain;
  }

  async function sendClaim() {
    const plan = S.claim.plan;
    const k = keys && keys.key();
    const btn = q('[data-cc-claim-send]');
    if (!plan || !plan.ok || !k || S.halted) return;
    btn.disabled = true;
    try {
      paintResult('claim', 'Checking the devnet’s genesis…', '');
      const chain = await connect();
      const r = await C.sendClaim({ chain, net, key: k, plan, launch: S.launch, wait: env.wait, onStage: (s) => paintResult('claim', 'Claiming… (' + s + ')', '') });
      show('[data-cc-claim-confirm]', false);
      S.claim.plan = null;
      paintResult('claim', 'Claimed in block ' + groups(r.height) + '. ' + plan.fields.code + ' is yours, in ' + plan.fields.mode + ' mode. The chain’s own copy is below.', 'ok', receiptRows({ kind: 'claim_station', txHash: r.txHash, height: r.height, index: r.index, sender: k.sender, api: net.api, chainId: S.status ? S.status.chainId : '', station: r.station, code: plan.fields.code }));
      await refresh({ feed: true });
      select(plan.fields.code);
      loadMine(plan.fields.code);
    } catch (e) {
      show('[data-cc-claim-confirm]', false);
      S.claim.plan = null;
      await afterFailure('claim', e, 'Not claimed: ');
    } finally {
      btn.disabled = false;
    }
  }

  /** A failed write: say it as the devnet did, and read the devnet again when it may have landed. */
  async function afterFailure(prefix, e, unsent) {
    if (e && e.name === 'GenesisChanged') {
      paintResult(prefix, describeError(e), 'bad');
      await refresh({ feed: false });
      return;
    }
    const maybe = e && (e.sendState === 'sent' || e.sendState === 'maybe');
    if (maybe) await refresh({ feed: true });
    const text = e && e.code === 'gate' ? 'Not sent: ' + e.message : sendFailureText(e, { unsent });
    const partial = e && Array.isArray(e.results) && e.results.length ? ' Already sealed before this failed: ' + e.results.map((x) => x.type + ' in block ' + x.height).join(', ') + '.' : '';
    // a post that got as far as signing had its body stored by its hash first. "No post names it" is true only when the devnet
    // refused the send; after a send that may have landed (sent, maybe) the post may still appear.
    const stored = prefix === 'post' && e && e.sendState === 'refused' ? ' Its body was already stored by its hash; no post names it.'
      : prefix === 'post' && e && (e.sendState === 'sent' || e.sendState === 'maybe') ? ' Its body was already stored by its hash; the post may still appear.' : '';
    paintResult(prefix, text + partial + stored + (maybe ? ' The devnet’s stations were read again: check the directory before you send again.' : ''), maybe ? 'warn' : 'bad');
  }

  // ------------------------------------------------------------ mode and crew

  const EMPTY_MODE = () => ({ code: '', name: '', modeValue: 'open', crew: [], base: '', plan: null });
  /** Back to no channel chosen: the draft, the name box and the confirm go. */
  function clearMode() {
    S.mode = EMPTY_MODE();
    const nm = q('[data-cc-set-name]');
    if (nm) nm.value = '';
    show('[data-cc-set-confirm]', false);
  }

  function loadMine(code) {
    const st = station(code);
    const sel = q('[data-cc-mine-select]');
    if (!st || !sel) return;
    fillSelect('[data-cc-mine-select]', mineOptions(), code);
    S.mode = { code, name: st.nameRaw, modeValue: st.mode, crew: [...st.crew], base: JSON.stringify(st), plan: null };
    const nm = q('[data-cc-set-name]');
    if (nm) nm.value = st.nameRaw;
    setRadio('data-cc-set-mode', st.mode);
    show('[data-cc-set-confirm]', false);
    paintMode();
  }

  const mineOptions = () => [['', 'Choose one of your channels'], ...myStations().map((s) => [s.code, s.code + (s.name && s.name !== s.code ? ' · ' + s.name : '') + ' · ' + MODE_WORD[s.mode]])];

  function manage(code) {
    loadMine(code);
    const sel = q('[data-cc-mine-select]');
    if (sel) { try { sel.focus(); } catch { /* ignore */ } }
  }

  function paintMineSelect() {
    const sel = q('[data-cc-mine-select]');
    if (!sel) return;
    const was = S.mode.code;
    fillSelect('[data-cc-mine-select]', mineOptions(), was);
    if (was && !myStations().some((s) => s.code === was)) clearMode();
    set('[data-cc-mine-note]', !me() ? 'Make a key to see the channels it owns.' : myStations().length ? plural(myStations().length, 'channel') + ' owned by this key.' : 'This key owns no station yet. Claim one above.');
  }

  function paintMode() {
    const st = station(S.mode.code);
    const has = Boolean(st);
    for (const sel of ['[data-cc-set-name]', '[data-cc-crew-add]', '[data-cc-crew-add-go]', '[data-cc-set-review]', '[data-cc-set-reset]']) { const n = q(sel); if (n) n.disabled = !has; }
    for (const r of qa('[data-cc-set-mode]')) r.disabled = !has;
    const host = q('[data-cc-crew]');
    const crewSig = JSON.stringify([has, S.mode.crew]);
    if (host && (crewSig !== S.crewSig || !host.childElementCount)) {
      S.crewSig = crewSig;
      host.replaceChildren();
      if (!has) host.append(el(doc, 'li', 'ca-empty', 'Choose a channel to see its crew.'));
      else if (!S.mode.crew.length) host.append(el(doc, 'li', 'ca-empty', 'No crew: only the owner would post in crew mode.'));
      for (const a of S.mode.crew) {
        const li = el(doc, 'li', 'cc-crew');
        const rm = el(doc, 'button', 'btn btn--ghost', 'Remove');
        rm.type = 'button';
        rm.setAttribute('aria-label', 'Remove ' + a + ' from the crew');
        rm.addEventListener('click', () => { S.mode.crew = S.mode.crew.filter((x) => x !== a); S.mode.plan = null; show('[data-cc-set-confirm]', false); paintMode(); });
        li.append(el(doc, 'code', 'ca-hash', a), rm);
        host.append(li);
      }
    }
    const md = radioValue('data-cc-set-mode') || S.mode.modeValue;
    S.mode.modeValue = md;
    set('[data-cc-set-explain]', has ? 'After this: ' + C.modeWords(md, st.code, S.mode.crew.length) : 'Choose one of your channels to see what each mode means for it.');
    const drift = has && JSON.stringify(st) !== S.mode.base;
    set('[data-cc-set-note]', drift ? 'The chain’s copy of ' + st.code + ' changed since you opened it. “Back to what the chain has” loads the current one.' : '');
  }

  function readMode() {
    const st = station(S.mode.code);
    return C.planMode({ station: st, sender: me(), name: (q('[data-cc-set-name]') || {}).value || '', mode: radioValue('data-cc-set-mode') || S.mode.modeValue, crew: S.mode.crew, world: S.world || C.makeWorld() });
  }

  function addCrew() {
    const input = q('[data-cc-crew-add]');
    const note = q('[data-cc-crew-note]');
    const st = station(S.mode.code);
    if (!input || !st) return;
    const r = C.parseCrew(input.value, st.owner);
    if (!input.value.trim()) { if (note) { note.textContent = 'Paste an address: tz1…, tz2…, pca1… or pcp1….'; note.dataset.bad = 'yes'; } return; }
    if (!r.ok) { if (note) { note.textContent = r.errors[0]; note.dataset.bad = 'yes'; } return; }
    const next = [...new Set([...S.mode.crew, ...r.list])];
    if (next.length > C.LIMITS.crew) { if (note) { note.textContent = 'A station lists at most ' + C.LIMITS.crew + ' crew.'; note.dataset.bad = 'yes'; } return; }
    S.mode.crew = next.sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    S.mode.plan = null;
    show('[data-cc-set-confirm]', false);
    input.value = '';
    if (note) { note.textContent = 'Added to the list below. Nothing is sent until you review and send.'; note.dataset.bad = 'no'; }
    paintMode();
  }

  function showModeConfirm() {
    const plan = readMode();
    const box = q('[data-cc-set-confirm]');
    const errs = q('[data-cc-set-errors]');
    if (errs) errs.replaceChildren();
    if (!plan.ok) {
      if (box) box.hidden = true;
      if (errs) { for (const e of plan.errors) errs.append(el(doc, 'li', '', e)); errs.hidden = false; }
      return plan;
    }
    if (errs) errs.hidden = true;
    S.mode.plan = plan;
    const list = q('[data-cc-set-list]');
    list.replaceChildren();
    const f = plan.fields;
    for (const s of plan.steps) {
      if (s.type === 'set_station') {
        list.append(el(doc, 'li', '', 'One set_station transaction signed by ' + me() + ' on ' + f.code + ': the crew becomes ' + (f.crew.length ? plural(f.crew.length, 'address', 'addresses') : 'empty') + (plan.diff.added.length ? ', adding ' + plan.diff.added.join(', ') : '') + (plan.diff.removed.length ? ', removing ' + plan.diff.removed.join(', ') : '') + '. The pin (' + (f.pinned ? shortHex(f.pinned, 8, 6) : 'none') + ') and the standing offer (' + (f.offer ? f.offer : 'none') + ') are sent back exactly as they are, because set_station replaces all three.'));
      } else {
        list.append(el(doc, 'li', '', 'One claim_station transaction signed by ' + me() + ' on ' + f.code + ' (the owner’s re-claim): ' + (plan.diff.renamed ? 'name “' + f.name + '”' : 'name unchanged') + ', mode ' + f.mode + (plan.diff.modeChanged ? ' (it is ' + station(f.code).mode + ' now)' : '') + '.'));
      }
    }
    list.append(el(doc, 'li', '', 'Who can post after this: ' + C.modeWords(f.mode, f.code, f.crew.length)));
    set('[data-cc-set-where]', 'Sent to ' + net.api + ' (' + (S.status ? S.status.chainId : '') + '). With two steps, the crew goes first, and each is sealed before the next is signed. The page reads the devnet again right before it signs.');
    if (box) box.hidden = false;
    return plan;
  }

  async function sendMode() {
    const plan = S.mode.plan;
    const k = keys && keys.key();
    const btn = q('[data-cc-set-send]');
    if (!plan || !plan.ok || !k || S.halted) return;
    btn.disabled = true;
    const code = plan.fields.code;
    try {
      paintResult('set', 'Checking the devnet’s genesis…', '');
      const chain = await connect();
      const r = await C.sendMode({ chain, net, key: k, plan, launch: S.launch, wait: env.wait, onStage: (s) => paintResult('set', 'Sending… (' + s + ')', '') });
      show('[data-cc-set-confirm]', false);
      S.mode.plan = null;
      const rows = [];
      for (const x of r.results) rows.push(...receiptRows({ kind: x.type, txHash: x.txHash, height: x.height, index: x.index, sender: k.sender, api: net.api, chainId: S.status ? S.status.chainId : '', station: x === r.results[r.results.length - 1] ? r.station : null, code }));
      paintResult('set', 'Sealed in ' + r.results.map((x) => 'block ' + groups(x.height)).join(' and ') + '. The chain’s own copy is below.', 'ok', rows);
      await refresh({ feed: true });
      loadMine(code);
      select(code);
    } catch (e) {
      show('[data-cc-set-confirm]', false);
      S.mode.plan = null;
      await afterFailure('set', e, 'Not changed: ');
    } finally {
      btn.disabled = false;
    }
  }

  // ------------------------------------------------------------ broadcasting

  function paintTargets() {
    const sel = q('[data-cc-post-channel]');
    if (!sel) return;
    const list = S.world ? C.broadcastTargets(S.world, me()) : [];
    fillSelect('[data-cc-post-channel]', [['', 'Choose a channel you own or crew'], ...list.map((s) => [s.code, s.code + ' · ' + MODE_WORD[s.mode] + (s.owner === me() ? ' · you own it' : ' · you are crew')])]);
    set('[data-cc-post-note]', !me() ? 'Make a key to see the channels it may broadcast to.' : list.length ? plural(list.length, 'channel') + ' this key may broadcast to.' : 'This key owns or crews no channel yet. Claim one above, or ask an owner to add this address to a crew.');
  }

  function broadcastOn(code) {
    paintTargets();
    fillSelect('[data-cc-post-channel]', [...q('[data-cc-post-channel]').options].map((o) => [o.value, o.textContent]), code);
    paintPreview();
    const t = q('[data-cc-post-title]');
    if (t) { try { t.focus(); } catch { /* ignore */ } }
  }

  function readPost() {
    const code = (q('[data-cc-post-channel]') || {}).value || '';
    return C.planBroadcast({ station: code ? station(code) : null, sender: me(), title: (q('[data-cc-post-title]') || {}).value || '', body: (q('[data-cc-post-body]') || {}).value || '', world: S.world || C.makeWorld() });
  }

  function paintPreview() {
    const p = readPost();
    const host = q('[data-cc-preview]');
    if (!host) return;
    const code = (q('[data-cc-post-channel]') || {}).value || '';
    const t = (q('[data-cc-post-title]') || {}).value || '';
    const b = (q('[data-cc-post-body]') || {}).value || '';
    set('[data-cc-preview-channel]', code || 'no channel yet');
    set('[data-cc-preview-title]', t.trim() || '(a title)');
    set('[data-cc-preview-body]', b.trim() || '(a body)');
    set('[data-cc-preview-meta]', 'Not sent · signed by ' + (me() || 'no key yet') + ' · ' + (S.status ? S.status.chainId : 'devnet') + ' · no value · may reset');
    const tb = new TextEncoder().encode(b.replace(/\r\n?/g, '\n').trim()).length;
    set('[data-cc-post-count]', Array.from(t.trim()).length + ' of ' + C.LIMITS.title + ' characters in the title · ' + groups(tb) + ' of ' + groups(C.LIMITS.bodyBytes) + ' bytes in the body');
    host.dataset.ok = p.ok ? 'yes' : 'no';
  }

  function showPostConfirm() {
    const plan = readPost();
    const box = q('[data-cc-post-confirm]');
    const errs = q('[data-cc-post-errors]');
    if (errs) errs.replaceChildren();
    if (!plan.ok) {
      if (box) box.hidden = true;
      if (errs) { for (const e of plan.errors) errs.append(el(doc, 'li', '', e)); errs.hidden = false; }
      return plan;
    }
    if (errs) errs.hidden = true;
    S.post.plan = plan;
    const f = plan.fields;
    const st = station(f.code);
    const list = q('[data-cc-post-list]');
    list.replaceChildren();
    list.append(el(doc, 'li', '', 'The body (' + groups(new TextEncoder().encode(f.body).length) + ' bytes) is stored on the devnet by its hash, POST /body. The devnet’s word filter reads it there; if it refuses, the refusal is shown here word for word and nothing else is sent.'));
    list.append(el(doc, 'li', '', 'Then one publish_block transaction signed by ' + me() + ' on channel ' + f.code + ' (' + (C.roleOf(st, me()) === 'owner' ? 'you own it' : 'you are on its crew') + '), titled “' + f.title + '”. The title goes on chain as written: the word filter does not read it.'));
    list.append(el(doc, 'li', '', 'It is public and stays on the chain until a reset. The devnet’s keeper can hide a post from the devnet’s own views; nobody can take it back.'));
    set('[data-cc-post-where]', 'Sent to ' + net.api + ' (' + (S.status ? S.status.chainId : '') + '). The page reads the station again right before it stores or signs anything.');
    if (box) box.hidden = false;
    return plan;
  }

  async function sendPost() {
    const plan = S.post.plan;
    const k = keys && keys.key();
    const btn = q('[data-cc-post-send]');
    if (!plan || !plan.ok || !k || S.halted) return;
    btn.disabled = true;
    try {
      paintResult('post', 'Checking the devnet’s genesis…', '');
      const chain = await connect();
      const r = await C.sendBroadcast({ chain, net, key: k, plan, launch: S.launch, wait: env.wait, onStage: (s) => paintResult('post', 'Broadcasting… (' + s + ')', '') });
      show('[data-cc-post-confirm]', false);
      S.post.plan = null;
      paintResult('post', 'On air in block ' + groups(r.height) + ' on ' + r.post.channel + '. It shows in the channel’s feed above.', 'ok', receiptRows({ kind: 'publish_block', txHash: r.txHash, height: r.height, index: r.index, sender: k.sender, api: net.api, chainId: S.status ? S.status.chainId : '', code: r.post.channel }));
      const t = q('[data-cc-post-title]');
      const b = q('[data-cc-post-body]');
      if (t) t.value = '';
      if (b) b.value = '';
      paintPreview();
      await refresh({ feed: true });
      select(r.post.channel);
    } catch (e) {
      show('[data-cc-post-confirm]', false);
      S.post.plan = null;
      // the devnet's own words, verbatim: its word filter refuses at the body store, the chain at the send
      await afterFailure('post', e, 'Not sent: ');
    } finally {
      btn.disabled = false;
    }
  }

  // ------------------------------------------------------------ reading

  async function readAll({ feed = true } = {}) {
    const st = await pinnedStatus(net, where.genesis || null);
    S.status = st;
    const list = C.readStations(await net.get('/stations'));
    if (!list) throw new Error('the devnet’s /stations is not the shape this page reads');
    S.list = list;
    if (!S.launch) { try { S.launch = C.readLaunch(await net.get('/params')); } catch { S.launch = null; } }
    S.world = C.makeWorld({ status: st, list, launch: S.launch });
    if (feed) {
      if (!S.scan.started) await C.scanFeed(net, S.scan);
      else await C.refreshNewest(net, S.scan);
    }
    set('[data-cc-meta]', net.api + ' · ' + st.chainId + ' · newest block #' + groups(st.height) + ' · ' + st.label + (where.override ? ' · local override' : '') + ' · read ' + plural(net.count, 'request') + ' so far');
  }

  function repaint() {
    paintAs();
    paintDirectory();
    paintDetail();
    paintClaimHint();
    paintMineSelect();
    paintMode();
    paintTargets();
    paintPreview();
  }

  let inflight = null;
  async function refresh({ feed = true } = {}) {
    if (S.halted) return;
    // A read in flight finishes first: a caller that wants fresh data (after a write) must not get the old read back.
    if (inflight) { try { await inflight; } catch { /* its own caller said so */ } }
    if (S.halted) return;
    const run = (async () => {
      try {
        await readAll({ feed });
        const banner = q('[data-cc-genesis]');
        if (banner) banner.hidden = true;
        repaint();
        say('Updated.', 'ready');
      } catch (e) {
        if (e && e.name === 'GenesisChanged') {
          S.halted = true;
          const banner = q('[data-cc-genesis]');
          if (banner) { banner.hidden = false; banner.textContent = describeError(e); }
          say('GENESIS CHANGED. Every claim and crew list from before the reset is gone, and nothing can be sent.', 'changed');
        } else say('The devnet did not answer: ' + describeError(e) + (S.world ? ' The list shown is from the last read.' : ''), 'down');
      }
    })();
    inflight = run;
    S.busy = true;
    await run;
    if (inflight === run) { inflight = null; S.busy = false; }
  }

  // ------------------------------------------------------------ wiring

  const on = (sel, ev, fn) => { for (const n of qa(sel)) n.addEventListener(ev, fn); };
  on('[data-cc-filter]', 'change', (ev) => { S.filter = ev.target.value || 'all'; paintDirectory(); });
  on('[data-cc-lookup-go]', 'click', () => {
    const input = q('[data-cc-lookup]');
    const note = q('[data-cc-lookup-note]');
    const c = C.checkCode(input ? input.value : '');
    if (!c.ok) { if (note) { note.textContent = c.error; note.dataset.bad = 'yes'; } return; }
    if (note) { note.textContent = ''; note.dataset.bad = 'no'; }
    select(c.code, { focus: true });
  });
  on('[data-cc-lookup]', 'keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); const b = q('[data-cc-lookup-go]'); if (b) b.click(); } });
  on('[data-cc-refresh]', 'click', () => refresh({ feed: true }));
  on('[data-cc-older]', 'click', readOlder);
  on('[data-cc-claim-code]', 'input', paintClaimHint);
  on('[data-cc-claim-review]', 'click', showClaimConfirm);
  on('[data-cc-claim-send]', 'click', sendClaim);
  on('[data-cc-claim-cancel]', 'click', () => { show('[data-cc-claim-confirm]', false); S.claim.plan = null; });
  on('[data-cc-mine-select]', 'change', (ev) => { if (ev.target.value) loadMine(ev.target.value); else { clearMode(); paintMode(); } show('[data-cc-set-confirm]', false); });
  on('[data-cc-set-mode]', 'change', () => { S.mode.plan = null; show('[data-cc-set-confirm]', false); paintMode(); });
  on('[data-cc-set-name]', 'input', () => { S.mode.plan = null; show('[data-cc-set-confirm]', false); });
  on('[data-cc-crew-add-go]', 'click', addCrew);
  on('[data-cc-crew-add]', 'keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); addCrew(); } });
  on('[data-cc-set-reset]', 'click', () => { if (S.mode.code) loadMine(S.mode.code); });
  on('[data-cc-set-review]', 'click', showModeConfirm);
  on('[data-cc-set-send]', 'click', sendMode);
  on('[data-cc-set-cancel]', 'click', () => { show('[data-cc-set-confirm]', false); S.mode.plan = null; });
  on('[data-cc-post-channel]', 'change', () => { show('[data-cc-post-confirm]', false); S.post.plan = null; paintPreview(); });
  on('[data-cc-post-title]', 'input', () => { show('[data-cc-post-confirm]', false); S.post.plan = null; paintPreview(); });
  on('[data-cc-post-body]', 'input', () => { show('[data-cc-post-confirm]', false); S.post.plan = null; paintPreview(); });
  on('[data-cc-post-review]', 'click', showPostConfirm);
  on('[data-cc-post-send]', 'click', sendPost);
  on('[data-cc-post-cancel]', 'click', () => { show('[data-cc-post-confirm]', false); S.post.plan = null; });
  for (const n of qa('[data-cc-refresh], [data-cc-older]')) n.disabled = false;
  if (keys) {
    keys.onChange(() => {
      S.claim.plan = null; S.mode.plan = null; S.post.plan = null;
      for (const s of ['[data-cc-claim-confirm]', '[data-cc-set-confirm]', '[data-cc-post-confirm]']) show(s, false);
      clearMode();
      if (S.world) repaint(); else paintAs();
    });
  }

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
      await refresh({ feed: true });
      if (wantChannel && S.world) select(wantChannel);
      S.timer = win.setInterval(() => { if (doc.visibilityState !== 'hidden' && !S.halted && !S.busy) refresh({ feed: true }); }, POLL_MS);
    },
    refresh,
    select,
    readOlder,
    readClaim,
    showClaimConfirm,
    sendClaim,
    readMode,
    showModeConfirm,
    sendMode,
    readPost,
    showPostConfirm,
    sendPost,
    loadMine,
    paintPreview,
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
