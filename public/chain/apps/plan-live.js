// plan-live.js: the live strip on /chain/plan. It reads three public routes
// of the PointCast devnet (GET /status, /net, /daily) and says, in words, what
// has changed since the plan was written: the height, today's witness keys and
// how many of them the house runs, and today's Daily Mint lot.
//
// Rules, held by tests/chain-plan.test.mjs:
// - It only reads (GET). Nothing here signs or posts.
// - Everything the devnet sends is hostile text: it is cut down with
//   cleanText() and written with textContent. Never markup, an href, a src or
//   a style value.
// - The devnet is pinned by the genesis the page was built with; a reset reads
//   GENESIS CHANGED, never a number from another chain.
// - Lazy: importing this module touches no network and no DOM. start() waits
//   for load, idle, the strip near the viewport and a visible tab.
// - A witness key is a claim tied to a key, and a key is not a person. A key
//   this page does not know as the house's is called exactly that.
// - devnet: no value, may reset.

import { makeNet, pinnedStatus, resolveApi, cleanText, isObj, isWhole, plural, describeError, whenReady, GenesisChanged } from './chain-kit.js';

/** "addr:name,addr:name" (the page's data-house) -> { addr: name }. Malformed pairs are dropped. */
export function parseHouse(s) {
  const out = {};
  for (const pair of String(s || '').split(',')) {
    const [addr, name] = pair.split(':');
    if (/^(tz[123]|pca1|pcp1)[1-9A-HJ-NP-Za-km-z]{20,60}$/.test(String(addr || '').trim()) && /^[a-z0-9-]{1,40}$/.test(String(name || '').trim())) out[addr.trim()] = name.trim();
  }
  return out;
}

/** GET /net -> today's day and witness keys, each { addr, name, house }. */
export function readNet(json, house = {}) {
  if (!isObj(json)) return { day: '', witnesses: [] };
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(json.day)) ? String(json.day) : '';
  const list = Array.isArray(json.witnesses) ? json.witnesses.slice(0, 200) : [];
  const witnesses = [];
  const seen = new Set();
  for (const w of list) {
    if (!isObj(w) || typeof w.addr !== 'string') continue;
    const addr = cleanText(w.addr, 64);
    if (!addr || seen.has(addr)) continue;
    seen.add(addr);
    const name = cleanText(typeof w.name === 'string' ? w.name : '', 40);
    witnesses.push({ addr, name, house: Object.prototype.hasOwnProperty.call(house, addr) });
  }
  return { day, witnesses };
}

/** GET /daily -> { on, n, bids } for today's lot, or { on: false }. */
export function readDaily(json) {
  if (!isObj(json) || json.status !== 'on' || !isObj(json.lot)) return { on: false, n: 0, bids: 0 };
  const n = isWhole(json.lot.n) ? json.lot.n : 0;
  const bids = isWhole(json.lot.bids) ? json.lot.bids : 0;
  return { on: n > 0, n, bids };
}

/** The strip's lines, in words, from what was read. `written` is the plan's own count at writing. */
export function summarize({ height, net, daily }, written = {}) {
  const lines = {};
  const grew = isWhole(written.blocks) && height > written.blocks ? ' (' + (height - written.blocks).toLocaleString('en-US') + ' since the plan was written)' : '';
  lines.height = 'Block ' + height.toLocaleString('en-US') + grew + '.';
  const ws = net.witnesses;
  const outside = ws.filter((w) => !w.house);
  if (!ws.length) {
    lines.witnesses = 'No witness key has signed today' + (net.day ? ' (' + net.day + ', UTC)' : '') + ' yet.';
  } else {
    const names = ws.map((w) => (w.name || w.addr) + (w.house ? ' (house)' : '')).join(', ');
    lines.witnesses =
      plural(ws.length, 'witness key') + ' today' + (net.day ? ' (' + net.day + ', UTC)' : '') + ': ' + names + '. ' +
      (outside.length
        ? plural(outside.length, 'key') + ' this page does not know as the house’s. A key is not a person, and the house could make a new one too.'
        : 'The house runs all of them.');
  }
  lines.lot = daily.on
    ? 'Today’s Daily Mint lot, #' + daily.n + ': ' + plural(daily.bids, 'bid') + ' so far.'
    : 'The Daily Mint has no open lot right now.';
  // The milestone is any signed transaction from a key the house did not make. This strip reads only
  // today's witnesses and today's bid count, so it never says the milestone is still open: it says
  // what it saw, and that it does not read every transaction or check who bid.
  lines.milestone = outside.length
    ? 'A witness key the house does not run has signed today. Whether a person stands behind it, this page cannot tell.'
    : daily.bids > 0
      ? 'No witness key from outside the house today. Today’s lot has ' + plural(daily.bids, 'bid') + ': one from a key the house did not make would meet the milestone, and this strip does not check who bid.'
      : 'No witness key from outside the house today, and no bid on today’s lot. Those are the only two signs this strip reads, not every transaction.';
  return lines;
}

const FIELDS = ['height', 'witnesses', 'lot', 'milestone'];

function mount(root, env = {}) {
  const doc = root.ownerDocument;
  const win = env.window || (doc && doc.defaultView);
  const search = env.search !== undefined ? env.search : (win && win.location ? win.location.search : '');
  const where = resolveApi(search, { api: root.dataset.api, genesis: root.dataset.genesis });
  const house = parseHouse(root.dataset.house);
  const written = { blocks: Number(root.dataset.writtenBlocks) || 0 };
  const out = Object.fromEntries(FIELDS.map((f) => [f, root.querySelector('[data-live-' + f + ']')]));
  const state = root.querySelector('[data-live-state]');
  const again = root.querySelector('[data-live-again]');
  if (!state || FIELDS.some((f) => !out[f])) return null;
  const say = (t) => { state.textContent = t; };
  let busy = false;

  async function read() {
    if (busy) return;
    busy = true;
    if (again) again.disabled = true;
    root.dataset.state = 'reading';
    say('Reading the devnet…');
    const net = makeNet(where.api, env);
    try {
      const st = await pinnedStatus(net, where.genesis || null);
      const [n, d] = await Promise.all([net.get('/net').catch(() => null), net.get('/daily').catch(() => null)]);
      const lines = summarize({ height: st.height, net: readNet(n, house), daily: readDaily(d) }, written);
      for (const f of FIELDS) out[f].textContent = lines[f];
      root.dataset.state = 'live';
      say('Read just now from ' + (where.override ? 'the local devnet you named' : 'the devnet') + ', in your browser. ' + plural(net.count, 'request') + ', all GET.');
    } catch (e) {
      root.dataset.state = e instanceof GenesisChanged ? 'genesis-changed' : 'down';
      say(e instanceof GenesisChanged
        ? 'GENESIS CHANGED: the devnet was reset after this plan was written. The numbers on this page describe devnet-2 as it was on the day it was written.'
        : 'Could not read the devnet: ' + describeError(e) + '. The numbers on this page are as written.');
    } finally {
      busy = false;
      if (again) again.disabled = false;
    }
  }

  if (where.ignored) say('The ?devnet= in the address was ignored: only localhost and 127.0.0.1 are honoured.');
  if (again) again.addEventListener('click', () => { read(); });
  return { read };
}

/** Wire the strip. Returns the controller, or null when the page has no strip. */
export function start(root, env = {}) {
  let c = null;
  try { c = mount(root, env); } catch { c = null; }
  if (!c) { if (root && root.dataset) root.dataset.state = 'down'; return null; }
  if (env.eager) { c.read(); return c; }
  whenReady(root, () => c.read(), env);
  return c;
}
