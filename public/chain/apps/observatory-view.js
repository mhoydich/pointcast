// observatory-view.js: the DOM side of the Chain Observatory (/chain/observatory).
// It draws what observatory.js returns into the skeleton the Astro page renders.
//
// Rules, held by tests/chain-app-observatory.test.mjs:
// - Everything the devnet sends (kinds, channels, addresses, names) is written
//   with textContent or a text node. Never markup, an href, a src or a style
//   value. setAttribute is used only for fixed names with numbers this file
//   computes (SVG geometry, aria-label with cleaned text).
// - Lazy: importing this module touches no network and no DOM. start() waits
//   for the load event, an idle callback, the dashboard coming within 400px of
//   the viewport and a visible tab, then reads the devnet. After that it polls
//   GET /status every 15 seconds while the tab is visible and Live is on, and
//   re-reads the window only when the height moved or a minute has passed.
// - The devnet is only ever read (GET). Nothing here writes.
// - devnet: no value, may reset.

import * as O from './observatory.js';
import { makeNet, readStatus, resolveApi, utc, utcClock, duration, shortHex, shortAddr, groups, plural, describeError, whenReady } from './chain-kit.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const POLL_MS = 15000;
const WINDOW_MS = 60000;

function el(doc, tag, cls, text) {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

const num = (v) => String(Math.round(Number(v) * 100) / 100);

/** An SVG element. Attribute values are numbers or fixed words this file picks; never devnet text. */
function sv(doc, tag, attrs = {}, text) {
  const n = doc.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, typeof v === 'number' ? num(v) : String(v));
  if (text !== undefined) n.textContent = text;
  return n;
}

const HEALTH_WORD = { live: 'LIVE', late: 'LATE', stalled: 'STALLED', unknown: 'UNKNOWN' };
const HEALTH_MARK = { live: '✓', late: '!', stalled: '✗', unknown: '·' };

/** A bucket width in words: "10 min", "1 h", "1 day". */
export function bucketWord(ms) {
  if (ms >= 86400000) return plural(Math.round(ms / 86400000), 'day');
  if (ms >= 3600000) return Math.round(ms / 3600000) + ' h';
  return Math.round(ms / 60000) + ' min';
}

function bucketLabel(at, ms) {
  const t = utc(at);
  return ms >= 86400000 ? t.slice(5, 10) : t.slice(5, 16);
}

// ---------------------------------------------------------------- charts

/** The tooltip every chart shares: one element, filled with textContent, moved with the pointer or the focus. */
function makeTip(doc, host) {
  const tip = el(doc, 'div', 'ob-tip');
  tip.setAttribute('role', 'status');
  tip.hidden = true;
  host.append(tip);
  return {
    show(lines, x, y) {
      tip.replaceChildren(el(doc, 'strong', 'ob-tip__v', lines[0]), ...lines.slice(1).map((l) => el(doc, 'span', 'ob-tip__l', l)));
      tip.hidden = false;
      const w = host.clientWidth || 300;
      tip.style.left = Math.max(4, Math.min(w - 4 - (tip.offsetWidth || 140), x + 10)) + 'px';
      tip.style.top = Math.max(0, y - 8) + 'px';
    },
    hide() { tip.hidden = true; },
  };
}

function wireHit(rect, tip, lines, host) {
  const at = (ev) => {
    const r = host.getBoundingClientRect();
    return ev.clientX !== undefined && ev.type !== 'focus' ? [ev.clientX - r.left, ev.clientY - r.top] : (() => { const b = rect.getBoundingClientRect(); return [b.left - r.left + b.width / 2, b.top - r.top]; })();
  };
  const on = (ev) => { const [x, y] = at(ev); tip.show(lines, x, y); };
  rect.addEventListener('pointermove', on);
  rect.addEventListener('pointerenter', on);
  rect.addEventListener('focus', on);
  rect.addEventListener('pointerleave', () => tip.hide());
  rect.addEventListener('blur', () => tip.hide());
}

/**
 * One tab stop for a chart, not one per mark: the first mark is in the tab order, the rest are focusable but not tabbable, and
 * the arrow keys (and Home and End) move between marks. A 200-block window has 221 marks and a 500-block one 526: a keyboard
 * user used to tab through every one of them before reaching anything below the charts.
 */
function rove(hits) {
  if (!hits.length) return;
  let cur = 0;
  hits.forEach((h, i) => h.setAttribute('tabindex', i === 0 ? '0' : '-1'));
  const move = (to) => {
    const next = Math.max(0, Math.min(hits.length - 1, to));
    hits[cur].setAttribute('tabindex', '-1');
    cur = next;
    hits[next].setAttribute('tabindex', '0');
    hits[next].focus();
  };
  hits.forEach((h, i) => {
    h.addEventListener('focus', () => { if (cur !== i) { hits[cur].setAttribute('tabindex', '-1'); cur = i; h.setAttribute('tabindex', '0'); } });
    h.addEventListener('keydown', (ev) => {
      const k = ev.key;
      const to = k === 'ArrowRight' || k === 'ArrowDown' ? i + 1 : k === 'ArrowLeft' || k === 'ArrowUp' ? i - 1 : k === 'Home' ? 0 : k === 'End' ? hits.length - 1 : null;
      if (to === null) return;
      ev.preventDefault();
      move(to);
    });
  });
}

function tableOf(doc, caption, head, rows) {
  const t = el(doc, 'table', 'ob-table');
  t.append(el(doc, 'caption', '', caption));
  const th = el(doc, 'tr');
  for (const h of head) { const c = el(doc, 'th', '', h); c.scope = 'col'; th.append(c); }
  const thead = el(doc, 'thead');
  thead.append(th);
  t.append(thead);
  const body = el(doc, 'tbody');
  for (const r of rows) {
    const tr = el(doc, 'tr');
    r.forEach((v, i) => tr.append(el(doc, i === 0 ? 'th' : 'td', i === 0 ? '' : 'num', v)));
    if (tr.firstChild) tr.firstChild.scope = 'row';
    body.append(tr);
  }
  t.append(body);
  return t;
}

/** The cadence chart: seconds between blocks on a log axis, with the two numbers the devnet keeps (3 s busy, 5 min idle). */
export function drawCadence(doc, host, tableHost, sum) {
  host.replaceChildren();
  tableHost.replaceChildren();
  const secs = sum.gaps.map((g) => g.ms / 1000);
  if (secs.length < 2) { host.append(el(doc, 'p', 'ob-empty', 'Not enough timed blocks in this window to draw the gaps between them.')); return; }
  const W = 640, H = 210;
  const g = O.logLineGeom(secs, { width: W, height: H, min: 1, max: 1000 });
  const svg = sv(doc, 'svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ob-svg', role: 'img', 'aria-label': 'Seconds between blocks over the window, on a log scale. The typical gap is ' + duration(sum.typicalGapMs) + ' and the longest ' + duration(sum.longestGapMs) + '.' });
  for (const t of g.ticks) {
    svg.append(sv(doc, 'line', { x1: g.plot.x, x2: g.plot.x + g.plot.w, y1: t.y, y2: t.y, class: 'ob-grid' }));
    svg.append(sv(doc, 'text', { x: g.plot.x - 6, y: t.y + 4, class: 'ob-tick', 'text-anchor': 'end' }, t.label + ' s'));
  }
  for (const [v, label] of [[3, 'busy: a block every 3 s'], [300, 'idle: a heartbeat every 5 min']]) {
    const y = g.y(v);
    svg.append(sv(doc, 'line', { x1: g.plot.x, x2: g.plot.x + g.plot.w, y1: y, y2: y, class: 'ob-ref' }));
    svg.append(sv(doc, 'text', { x: g.plot.x + 6, y: v < 10 ? y + 14 : y - 5, class: 'ob-refl' }, label));
  }
  svg.append(sv(doc, 'path', { d: g.d, class: 'ob-line' }));
  const last = g.points[g.points.length - 1];
  svg.append(sv(doc, 'circle', { cx: last.x, cy: last.y, r: 4, class: 'ob-dot' }));
  svg.append(sv(doc, 'text', { x: g.plot.x, y: H - 4, class: 'ob-tick' }, '#' + sum.gaps[0].height));
  svg.append(sv(doc, 'text', { x: g.plot.x + g.plot.w, y: H - 4, class: 'ob-tick', 'text-anchor': 'end' }, '#' + sum.gaps[sum.gaps.length - 1].height));
  const tip = makeTip(doc, host);
  const slot = g.plot.w / Math.max(1, g.points.length - 1);
  const hits = [];
  g.points.forEach((p, i) => {
    const hit = sv(doc, 'rect', { x: Math.max(g.plot.x, p.x - slot / 2), y: g.plot.y, width: Math.max(4, slot), height: g.plot.h, class: 'ob-hit', role: 'img', tabindex: 0, 'aria-label': 'block ' + sum.gaps[i].height + ', ' + duration(sum.gaps[i].ms) + ' after the one before' });
    wireHit(hit, tip, [duration(sum.gaps[i].ms), 'block #' + sum.gaps[i].height, 'after the block before it'], host);
    svg.append(hit);
    hits.push(hit);
  });
  rove(hits);
  host.prepend(svg);
  const rows = sum.gaps.slice(-12).map((x) => ['#' + x.height, duration(x.ms)]);
  tableHost.append(tableOf(doc, 'The twelve newest gaps between blocks', ['Block', 'Gap after the block before'], rows));
}

/** Transactions per time bucket as columns. */
export function drawActivity(doc, host, tableHost, sum) {
  host.replaceChildren();
  tableHost.replaceChildren();
  const items = sum.buckets.items;
  if (!items.length) { host.append(el(doc, 'p', 'ob-empty', 'No timed blocks in this window.')); return; }
  const W = 640, H = 210;
  const g = O.columnsGeom(items.map((b) => b.tx), { width: W, height: H });
  const svg = sv(doc, 'svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ob-svg', role: 'img', 'aria-label': 'Transactions per ' + bucketWord(sum.buckets.ms) + ' across the window: ' + sum.txTotal + ' in all.' });
  for (const t of g.ticks) {
    svg.append(sv(doc, 'line', { x1: g.plot.x, x2: g.plot.x + g.plot.w, y1: t.y, y2: t.y, class: 'ob-grid' }));
    svg.append(sv(doc, 'text', { x: g.plot.x - 6, y: t.y + 4, class: 'ob-tick', 'text-anchor': 'end' }, t.label));
  }
  const tip = makeTip(doc, host);
  const hits = [];
  g.bars.forEach((b, i) => {
    if (b.h > 0) svg.append(sv(doc, 'rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 2, class: 'ob-bar' }));
    const words = [plural(b.v, 'transaction'), bucketLabel(items[i].at, sum.buckets.ms) + ' UTC', plural(items[i].blocks, 'block') + ' sealed'];
    const hit = sv(doc, 'rect', { x: b.hit.x, y: g.plot.y, width: b.hit.w, height: g.plot.h, class: 'ob-hit', role: 'img', tabindex: 0, 'aria-label': words.join(', ') });
    wireHit(hit, tip, words, host);
    svg.append(hit);
    hits.push(hit);
  });
  rove(hits);
  svg.append(sv(doc, 'line', { x1: g.plot.x, x2: g.plot.x + g.plot.w, y1: g.plot.y + g.plot.h, y2: g.plot.y + g.plot.h, class: 'ob-axis' }));
  svg.append(sv(doc, 'text', { x: g.plot.x, y: H - 4, class: 'ob-tick' }, bucketLabel(items[0].at, sum.buckets.ms)));
  svg.append(sv(doc, 'text', { x: g.plot.x + g.plot.w, y: H - 4, class: 'ob-tick', 'text-anchor': 'end' }, bucketLabel(items[items.length - 1].at, sum.buckets.ms)));
  host.prepend(svg);
  tableHost.append(tableOf(doc, 'Transactions per ' + bucketWord(sum.buckets.ms) + ' (UTC)', ['From', 'Transactions', 'Blocks'], items.slice(-12).map((b) => [bucketLabel(b.at, sum.buckets.ms), String(b.tx), String(b.blocks)])));
}

/** Ranked horizontal bars (kinds, channels): the label on the left, the count at the tip. */
export function drawBars(doc, host, tableHost, rows, { name, word, caption }) {
  host.replaceChildren();
  tableHost.replaceChildren();
  if (!rows.length) { host.append(el(doc, 'p', 'ob-empty', 'Nothing in this window.')); return; }
  const W = 360, labelW = 112, valueW = 40;
  const g = O.hbarsGeom(rows.map((r) => ({ n: r.n })), { width: W - labelW, valueW });
  const svg = sv(doc, 'svg', { viewBox: '0 0 ' + W + ' ' + g.height, class: 'ob-svg ob-svg--bars', role: 'img', 'aria-label': caption + ': ' + rows.map((r) => r[name] + ' ' + r.n).join(', ') });
  const tip = makeTip(doc, host);
  const hits = [];
  rows.forEach((r, i) => {
    const b = g.bars[i];
    const label = r[name] === 'other' && r.folded ? 'other (' + r.folded + ')' : r[name];
    svg.append(sv(doc, 'text', { x: labelW - 8, y: b.textY + 4, class: 'ob-lab', 'text-anchor': 'end' }, label.length > 15 ? label.slice(0, 14) + '…' : label));
    svg.append(sv(doc, 'rect', { x: labelW, y: b.y, width: b.w, height: b.h, rx: 2, class: 'ob-bar' }));
    svg.append(sv(doc, 'text', { x: labelW + b.w + 6, y: b.textY + 4, class: 'ob-val' }, String(r.n)));
    const words = [plural(r.n, word), label];
    const hit = sv(doc, 'rect', { x: 0, y: i * 28, width: W, height: 28, class: 'ob-hit', role: 'img', tabindex: 0, 'aria-label': words.join(', ') });
    wireHit(hit, tip, words, host);
    svg.append(hit);
    hits.push(hit);
  });
  rove(hits);
  host.prepend(svg);
  tableHost.append(tableOf(doc, caption, [name === 'kind' ? 'Kind' : 'Channel', 'Count'], rows.map((r) => [r[name], String(r.n)])));
}

function drawSenders(doc, host, rows) {
  host.replaceChildren();
  if (!rows.length) { host.append(el(doc, 'p', 'ob-empty', 'No transactions in this window.')); return; }
  const WHO = { agent: 'agent (pca1)', key: 'key (tz)', passkey: 'passkey (pcp1)', other: 'the rest', '': '' };
  host.append(tableOf(doc, 'Who sent the most transactions in this window', ['Sender', 'What it is', 'Transactions'], rows.map((r) => [r.sender === 'other' ? 'other (' + r.folded + ' senders)' : shortAddr(r.sender), WHO[r.who] || r.who, String(r.n)])));
}

// ---------------------------------------------------------------- the view

export function mount(root, env = {}) {
  const doc = root.ownerDocument;
  const win = env.window || doc.defaultView;
  const q = (sel) => root.querySelector(sel);
  const qa = (sel) => [...root.querySelectorAll(sel)];
  const ds = root.dataset;
  const where = resolveApi(env.search !== undefined ? env.search : win.location.search, { api: String(ds.api || ''), genesis: String(ds.genesis || '') });
  if (!/^https?:\/\/[a-z0-9.:-]+$/i.test(where.api)) return null;
  const net = makeNet(where.api, { fetch: env.fetch, timeoutMs: env.timeoutMs });
  const now = env.now || (() => Date.now());
  const S = { windowSize: O.DEFAULT_WINDOW, live: true, data: null, skew: 0, timer: 0, tick: 0, busy: false, lastWindowAt: 0, lastHeight: -1, halted: false, begun: false, requests: 0, drawn: {} };
  const set = (sel, text) => { const n = q(sel); if (n) n.textContent = text; };
  const say = (text, state) => { set('[data-ob-status]', text); root.dataset.state = state || root.dataset.state; };

  function paintStatic(st) {
    set('[data-ob-v="height"]', '#' + groups(st.height));
    set('[data-ob-s="height"]', 'tip ' + shortHex(st.tipHash, 10, 6));
    set('[data-ob-v="mempool"]', String(st.mempool));
    set('[data-ob-s="mempool"]', st.mempool === 0 ? 'nothing waiting for the next block' : 'transactions waiting for the next block');
    set('[data-ob-v="accounts"]', st.accounts === null ? '–' : groups(st.accounts));
    set('[data-ob-s="accounts"]', st.agents === null ? 'accounts on the devnet' : plural(st.agents, 'agent') + ' · ' + plural(st.bots || 0, 'keyless bot'));
    set('[data-ob-v="supply"]', st.supply === null ? '–' : groups(st.supply));
    set('[data-ob-s="supply"]', st.maxSupply === null ? 'play ATTN in existence' : 'play ATTN, of at most ' + groups(st.maxSupply));
  }

  function paintHealth() {
    const st = S.data && S.data.status;
    if (!st) return;
    const h = O.healthOf(st.tipTimestamp, now() + S.skew);
    root.dataset.health = h.state;
    set('[data-ob-v="age"]', h.ageMs === null ? '–' : duration(h.ageMs) + ' ago');
    set('[data-ob-health-mark]', HEALTH_MARK[h.state]);
    set('[data-ob-health-word]', HEALTH_WORD[h.state]);
    set('[data-ob-s="age"]', h.words);
    const lot = S.data.daily && S.data.daily.lot;
    if (lot && lot.closesInMs !== null) {
      const left = Math.max(0, lot.closesInMs - (now() - S.data.readAt));
      set('[data-ob-v="lot-close"]', left > 0 ? 'closes in ' + duration(left) : 'closing now');
    }
  }

  function paintWindow(sum) {
    if (!sum || !sum.count) return;
    set('[data-ob-v="rate"]', num(Math.round(sum.perHour * 10) / 10) + ' / h');
    set('[data-ob-s="rate"]', 'blocks sealed per hour, over blocks #' + sum.from + ' to #' + sum.to + ' · ' + O.paceWords(sum.perHour));
    set('[data-ob-v="tx"]', groups(sum.txTotal));
    set('[data-ob-s="tx"]', 'transactions in those ' + plural(sum.count, 'block') + ' · ' + plural(sum.busyBlocks, 'block') + ' carried any');
    set('[data-ob-window-note]', 'Window: the newest ' + plural(sum.count, 'block') + ', #' + sum.from + ' to #' + sum.to + (sum.spanMs > 0 ? ', ' + duration(sum.spanMs) + ' of chain time' : '') + '. Block #1 has no timestamp and is left out of every time axis.');
    // A chart is rebuilt only when what it shows changed, and a rebuild puts the keyboard focus back on the same mark: a periodic
    // re-read of an unchanged window used to throw a keyboard or screen-reader user out of the chart to <body> every minute.
    redraw('cadence', JSON.stringify(sum.gaps), () => drawCadence(doc, q('[data-ob-chart="cadence"]'), q('[data-ob-table="cadence"]'), sum));
    redraw('activity', JSON.stringify([sum.buckets, sum.txTotal]), () => drawActivity(doc, q('[data-ob-chart="activity"]'), q('[data-ob-table="activity"]'), sum));
    redraw('kinds', JSON.stringify(sum.kinds), () => drawBars(doc, q('[data-ob-chart="kinds"]'), q('[data-ob-table="kinds"]'), sum.kinds, { name: 'kind', word: 'transaction', caption: 'Transactions by kind in this window' }));
    redraw('channels', JSON.stringify(sum.channels), () => drawBars(doc, q('[data-ob-chart="channels"]'), q('[data-ob-table="channels"]'), sum.channels, { name: 'channel', word: 'post', caption: 'Posts by channel in this window' }));
    redraw('senders', JSON.stringify(sum.senders), () => drawSenders(doc, q('[data-ob-chart="senders"]'), sum.senders));
  }

  /** Run `draw` for chart `id` unless it already shows `sig`; if the focus was on one of its marks, return it to the mark at the same place. */
  function redraw(id, sig, draw) {
    const host = q('[data-ob-chart="' + id + '"]');
    if (host && S.drawn[id] === sig && host.firstChild) return;
    const active = doc.activeElement;
    const was = host && active && host.contains(active) ? [...host.querySelectorAll('.ob-hit')].indexOf(active) : -1;
    draw();
    S.drawn[id] = sig;
    if (was >= 0) {
      const marks = host.querySelectorAll('.ob-hit');
      if (marks.length) marks[Math.min(was, marks.length - 1)].focus();
    }
  }

  function paintToday(d) {
    const n = d.net;
    set('[data-ob-v="net"]', n ? plural(n.checkins, 'check-in') + ' · ' + plural(n.witnesses, 'witness', 'witnesses') : 'not readable now');
    set('[data-ob-s="net"]', n ? 'UTC day ' + n.day + ' · resets 00:00 UTC · ' + plural(n.participants, 'participant') + ', ' + plural(n.strikes, 'strike') + (n.latestCheckpoint ? ' · newest checkpoint #' + n.latestCheckpoint : '') : '');
    const lot = d.daily && d.daily.lot;
    set('[data-ob-v="lot"]', lot ? 'Lot ' + String(lot.n).padStart(4, '0') + ' · ' + plural(lot.bids, 'bid') : d.daily ? 'no lot open' : 'not readable now');
    set('[data-ob-s="lot"]', lot ? 'min bid ' + (lot.minBid === null ? '?' : lot.minBid) + ' play ATTN · ' + (lot.leader ? 'leader ' + shortAddr(lot.leader) + (lot.leaderAmount !== null ? ' at ' + lot.leaderAmount : '') : 'no leader yet') + ' · ' + plural(d.daily.settled, 'lot') + ' settled lately, ' + (d.daily.violations === null ? '?' : d.daily.violations) + ' violations' : d.daily ? 'the house is ' + (d.daily.status || 'off') : '');
    const c = d.capsules;
    set('[data-ob-v="capsules"]', c ? plural(c.stored, 'capsule') + ' sealed' : 'not readable now');
    set('[data-ob-s="capsules"]', c ? (c.due ? plural(c.due, 'capsule') + ' may be opened now' : c.waiting ? 'next opens in ' + plural(c.nextInBlocks, 'block') : 'none waiting to open') : '');
    const e = d.editions;
    set('[data-ob-v="editions"]', e.length ? e.map((x) => x.id + ' ' + groups(x.minted) + (x.supply ? ' of ' + groups(x.supply) : '')).join(' · ') : 'no editions read');
    const s = d.stations;
    set('[data-ob-s="editions"]', s ? plural(s.total, 'station') + ' (' + s.house + ' house, ' + s.claimed + ' claimed)' : '');
    const b = d.bots;
    set('[data-ob-v="bots"]', b ? plural(b.total, 'keyless bot') : 'not readable now');
    set('[data-ob-s="bots"]', b && b.busiest.length ? 'busiest: ' + b.busiest.map((x) => x.bot + ' ' + x.posts).join(', ') : '');
    const cps = qa('[data-ob-cp]');
    const list = d.checkpoints.slice(-cps.length);
    cps.forEach((n2, i) => {
      const c2 = list[i];
      n2.hidden = !c2;
      if (c2) n2.textContent = '#' + c2.height + ': ' + plural(c2.distinct, 'key') + (c2.strikes ? ', ' + plural(c2.strikes, 'strike') : '');
    });
    set('[data-ob-cp-empty]', list.length ? '' : 'No witnessed checkpoints in the last 1,000 blocks.');
  }

  function paintMeta() {
    const d = S.data;
    if (!d) return;
    set('[data-ob-meta]', 'Read ' + plural(net.count, 'request') + ' so far · last read ' + utcClock(d.readAt + S.skew) + (d.missing.length ? ' · not readable: ' + d.missing.join(', ') : '') + ' · ' + net.api + ' · ' + d.status.chainId + (where.override ? ' · local override' : ''));
  }

  function genesisNote(on, e) {
    const n = q('[data-ob-genesis]');
    if (!n) return;
    n.hidden = !on;
    if (on && e) n.textContent = describeError(e);
  }

  async function read(parts) {
    if (S.busy || S.halted) return;
    S.busy = true;
    root.dataset.busy = 'yes';
    try {
      const prev = S.data;
      const d = await O.refresh(net, { pinned: where.genesis || null, windowSize: S.windowSize, now, parts });
      if (prev && parts) {
        // A partial read keeps what it did not re-read.
        d.window = d.window || prev.window;
        d.summary = d.summary || prev.summary;
        for (const k of ['daily', 'net', 'capsules', 'stations', 'bots']) d[k] = d[k] || prev[k];
        if (!d.editions.length) d.editions = prev.editions;
        if (!d.checkpoints.length) d.checkpoints = prev.checkpoints;
      }
      S.data = d;
      S.skew = d.daily ? O.clockSkew(d.daily, d.readAt) || S.skew : S.skew;
      S.lastHeight = d.status.height;
      if (d.window) S.lastWindowAt = now();
      genesisNote(false);
      paintStatic(d.status);
      paintWindow(d.summary);
      paintToday(d);
      paintHealth();
      paintMeta();
      say('Updated ' + utcClock(d.readAt + S.skew) + '. ' + (S.live ? 'Live: reading again when a new block lands.' : 'Live is off: press Read now to update.'), 'ready');
    } catch (e) {
      if (e && e.name === 'GenesisChanged') { genesisNote(true, e); say('GENESIS CHANGED. Nothing below is read.', 'changed'); S.halted = true; }
      else say('The devnet did not answer: ' + describeError(e) + (S.data ? ' The numbers shown are from the last read.' : ''), 'down');
    } finally {
      S.busy = false;
      root.dataset.busy = 'no';
    }
  }

  async function poll() {
    if (S.halted || !S.live || doc.visibilityState === 'hidden' || S.busy) return;
    try {
      const st = readStatus(await net.get('/status'));
      if (where.genesis && st.genesis !== where.genesis) return read(null);
      if (st.height !== S.lastHeight || now() - S.lastWindowAt > WINDOW_MS) return read(['window', 'daily', 'net', 'capsules', 'editions', 'stations', 'bots']);
      if (S.data) { S.data.status = st; paintStatic(st); paintHealth(); paintMeta(); }
    } catch { /* the next poll tries again; the page keeps its last numbers */ }
  }

  function startTimers() {
    S.timer = win.setInterval(poll, POLL_MS);
    S.tick = win.setInterval(() => { if (doc.visibilityState !== 'hidden') paintHealth(); }, 1000);
  }

  const sel = q('[data-ob-window]');
  const live = q('[data-ob-live]');
  const go = q('[data-ob-go]');
  if (sel) {
    sel.replaceChildren(...O.WINDOWS.map((n) => { const o = el(doc, 'option', '', 'newest ' + n + ' blocks'); o.value = String(n); o.selected = n === S.windowSize; return o; }));
    sel.disabled = false;
    sel.addEventListener('change', () => { const n = Number(sel.value); if (O.WINDOWS.includes(n)) { S.windowSize = n; read(null); } });
  }
  if (live) { live.disabled = false; live.checked = true; live.addEventListener('change', () => { S.live = live.checked; say(S.live ? 'Live is on.' : 'Live is off: press Read now to update.', root.dataset.state); }); }
  if (go) { go.disabled = false; go.addEventListener('click', () => read(null)); }

  return {
    state: S,
    net,
    where,
    async begin() {
      if (S.begun) return;
      S.begun = true;
      root.dataset.state = 'reading';
      say('Reading the devnet…', 'reading');
      await read(null);
      startTimers();
    },
    read,
    poll,
    /** Clear the timers (tests, and a page that is going away). A halted page (GENESIS CHANGED) stays halted. */
    stop() { win.clearInterval(S.timer); win.clearInterval(S.tick); },
  };
}

/** Called by the page: mount, then begin when the lazy conditions hold. Returns the controller (or null if the page is unusable). */
export function start(root, env = {}) {
  let c = null;
  try { c = mount(root, env); } catch { c = null; }
  if (!c) { root.dataset.state = 'down'; return null; }
  if (env.eager) { c.begin(); return c; }
  whenReady(root, () => c.begin(), env);
  return c;
}
