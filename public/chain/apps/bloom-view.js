/**
 * bloom-view.js — the browser side of /chain/bloom: it reads the PointCast
 * devnet's checkpoints and draws a bloom for each (public/chain/apps/bloom.js).
 *
 * The page (src/pages/chain/bloom.astro) owns the markup; this module fills
 * it. Rules, held by tests/chain-app-bloom.test.mjs:
 * - Everything the devnet returns is untrusted. Block hashes must be 64
 *   lowercase hex, heights must be the number asked for, times must be real
 *   numbers in range, names and addresses must look like names and addresses
 *   (bloom.js readers), else they are not shown. Text reaches the page only
 *   as textContent. Nothing read from the devnet becomes markup, an href, a
 *   src, an attribute or a style: no innerHTML, no setAttribute, no DOM
 *   parser. The one src this file sets is a blob: URL for an SVG that
 *   bloom.js drew from a validated hash and auditSvg() passed, shown in an
 *   <img>, where a script could not run anyway. The one href is that same
 *   kind of blob: URL, for the download.
 * - Lazy: importing this module touches no network and no DOM. Reads start
 *   after the load event and an idle callback, only while the tab is visible;
 *   the grid reads a chunk of checkpoints only when it nears the viewport (or
 *   when "Load older" is pressed), six requests at a time; /status is read
 *   again at most once a minute.
 * - Honest failure: if the devnet does not answer, the page says "devnet
 *   unreachable" and keeps what it had. If the chain at the URL has a genesis
 *   this page did not pin, it says so and draws nothing (?devnet= on
 *   localhost / 127.0.0.1 is the one exception, for local end-to-end runs).
 * - Reduced motion: nothing moves unless the visitor turns the slow petal
 *   drift on; it is off by default, also when the system asks for motion.
 * - A witness is an accountable claim, not proof that anyone replayed the
 *   chain. Counts are keys, not people.
 */
import {
  CHECKPOINT_INTERVAL,
  GRID_COUNT,
  MAX_WITNESS_RINGS,
  assertCleanSvg,
  bloomSvg,
  checkpointHeights,
  fileName,
  latestCheckpoint,
  linkHolds,
  paletteOf,
  rangeWindows,
  readBlock,
  readCheckpointRange,
  readRawHeader,
  readStatus,
  readWitnesses,
  resolveApi,
  utcClock,
  utcDay,
  utcStamp,
  witnessSentence,
} from './bloom.js';

export const REFRESH_MS = 60_000;
export const TIMEOUT_MS = 8_000;
export const MAX_BODY_CHARS = 512 * 1024;
export const POOL = 6;
export const CHUNK = 24;

const API_RE = /^https:\/\/[a-z0-9.-]+$/i;
const LOCAL_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/;
const HASH_ROUTE = /^#cp-(\d{1,9})$/;

const RESULT_TEXT = {
  correct: 'agreed with this server’s hash',
  over_cap: 'counted past its daily cap',
  mismatch: 'did not match this server’s hash',
  conflict: 'made two different claims for one height',
  other: '',
};

class HttpError extends Error {
  constructor(status) {
    super(`devnet: HTTP ${status}`);
    this.status = status;
  }
}

const fmt = (n) => Number(n).toLocaleString('en-US');

/** How long to wait before the next /status read: a minute when all is well; after failures 8 s, 16 s, 32 s, then a minute again. */
export const retryDelay = (failures) => (failures > 0 ? Math.min(REFRESH_MS, 8_000 * 2 ** (failures - 1)) : REFRESH_MS);

/** Runs `worker` over `items`, at most `limit` at a time. Results keep the items' order: { ok, v } or { ok: false, e }. */
export async function pool(items, worker, limit = POOL) {
  const out = new Array(items.length);
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const k = next;
      next += 1;
      try {
        out[k] = { ok: true, v: await worker(items[k]) };
      } catch (e) {
        out[k] = { ok: false, e };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return out;
}

/** The reader's own clock for a time, or '' when it cannot be formatted. */
export function localStamp(ms, locale, timeZone) {
  try {
    return new Date(ms).toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', ...(timeZone ? { timeZone } : {}) });
  } catch {
    return '';
  }
}

/**
 * Wire the page up. Nothing is fetched here: reads wait for the load event
 * and an idle callback. `env` exists for tests and local runs: window, fetch,
 * now, idle, createObjectURL.
 */
export function start(root, env = {}) {
  const doc = root.ownerDocument;
  const win = env.window || doc.defaultView;
  const fetchImpl = env.fetch || ((...args) => win.fetch(...args));
  const now = env.now || (() => Date.now());
  const makeUrl = env.createObjectURL || ((blob) => win.URL.createObjectURL(blob));
  const api = resolveApi(win.location ? win.location.search : '', root.dataset.api);
  if (!(api.local ? LOCAL_RE.test(api.base) : API_RE.test(api.base))) return null;
  const pinned = api.local ? '' : String(root.dataset.genesis || '');
  const siteChain = String(root.dataset.chain || '');

  const hook = (name) => root.querySelector(`[data-bl="${name}"]`);
  const hooks = (name) => Array.from(root.querySelectorAll(`[data-bl="${name}"]`));
  const acts = (group) => Array.from(root.querySelectorAll(`[data-bl-act="${group}"]`));
  // Written only when the words change: the status line is a polite live region, and the same sentence every refresh would be read out again each time.
  const say = (name, msg) => {
    const n = hook(name);
    if (n && n.textContent !== msg) n.textContent = msg;
  };
  const el = (tag, cls, text) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const visible = () => doc.visibilityState !== 'hidden';
  const idle = env.idle || ((fn) => (typeof win.requestIdleCallback === 'function' ? win.requestIdleCallback(fn, { timeout: 4000 }) : win.setTimeout(fn, 1200)));

  const S = {
    status: null,
    latest: null,
    entries: new Map(),
    blocks: new Map(),
    wits: new Map(),
    urls: new Map(),
    range: null,
    rangeTried: false,
    drift: false,
    heights: [],
    next: 0,
    loadingChunk: false,
    groups: [],
    tiles: new Map(),
    current: null,
    opener: null,
    refreshing: false,
    failures: 0,
    lastRead: -Infinity,
    stop: false,
    noObserver: false,
  };

  const dialog = hook('dialog');
  const grid = hook('grid');
  const moreBtn = hook('more');
  const retryBtn = hook('retry');
  const sentinel = hook('sentinel');
  const heroImg = hook('hero-img');
  const heroOpen = hook('hero-open');
  const detailImg = hook('d-img');

  // ------------------------------------------------------------ reading the devnet

  async function getJson(path) {
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = win.setTimeout(() => ctrl?.abort(), TIMEOUT_MS);
    try {
      const res = await fetchImpl(`${api.base}${path}`, { signal: ctrl?.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
      if (!res || !res.ok) throw new HttpError(res ? res.status : 0);
      const text = await res.text();
      if (text.length > MAX_BODY_CHARS) throw new Error('devnet: response too large');
      return JSON.parse(text);
    } finally {
      win.clearTimeout(timer);
    }
  }

  /** One in-flight or finished read per key; a failed read is forgotten so it can be tried again. */
  const memo = (map, key, make) => {
    if (!map.has(key)) {
      const p = make();
      map.set(key, p);
      p.catch(() => map.delete(key));
    }
    return map.get(key);
  };
  const getBlock = (h) => memo(S.blocks, h, async () => readBlock(await getJson(`/block/${h}`), h));
  const getWit = (h) => memo(S.wits, h, async () => readWitnesses(await getJson(`/checkpoints/${h}/witnesses`), h));

  /** Witness counts for a checkpoint from the range read: null while unread, zeros when the range read says nobody signed it. */
  const rangeCounts = (h) => (S.range ? S.range.get(h) ?? { distinct: 0, correct: 0, strikes: 0 } : null);

  async function loadRange() {
    S.rangeTried = true;
    try {
      const wins = rangeWindows(S.heights);
      const parts = await Promise.all(wins.map(async (w) => readCheckpointRange(await getJson(`/checkpoints?from=${w.from}&to=${w.to}`))));
      S.range = new Map();
      for (const m of parts) for (const [h, c] of m) S.range.set(h, c);
    } catch {
      S.range = null;
    }
  }

  /** The block and, with `detail`, its witness list; refuses a witness reply that names another hash. */
  async function loadEntry(h, { detail = false } = {}) {
    const block = await getBlock(h);
    let wit = S.entries.get(h)?.wit ?? null;
    let unreadable = false;
    if (detail && !wit) {
      try {
        wit = await getWit(h);
      } catch {
        wit = null;
        unreadable = true;
      }
    }
    if (wit && wit.blockHash && wit.blockHash !== block.hash) throw new Error('bloom: the devnet gave two different hashes for one height');
    const entry = { height: h, block, wit, counts: wit ? { distinct: wit.distinct, correct: wit.correct, strikes: wit.strikes } : rangeCounts(h), witnessUnreadable: unreadable };
    S.entries.set(h, entry);
    return entry;
  }

  // ------------------------------------------------------------ drawing a bloom into an <img>

  function svgText(entry, { drift = false, bare = false } = {}) {
    const witnesses = bare ? 0 : entry.counts ? entry.counts.distinct : 0;
    return assertCleanSvg(bloomSvg(entry.block.hash, { witnesses, drift }));
  }

  function svgUrl(entry, opts = {}) {
    const key = `${entry.block.hash}:${opts.bare ? 0 : entry.counts ? entry.counts.distinct : 0}:${opts.drift ? 1 : 0}`;
    if (!S.urls.has(key)) S.urls.set(key, makeUrl(new win.Blob([svgText(entry, opts)], { type: 'image/svg+xml' })));
    return S.urls.get(key);
  }

  function paint(img, entry, opts = {}) {
    const blobUrl = svgUrl(entry, opts);
    img.src = blobUrl;
    img.alt = `Abstract bloom drawn from the hash of block ${fmt(entry.height)}`;
  }

  // ------------------------------------------------------------ the hero

  function showHero(entry) {
    const b = entry.block;
    root.dataset.hero = 'live';
    say('hero-kicker', `LATEST CHECKPOINT · BLOCK ${fmt(entry.height)}`);
    say('hero-height', `№${fmt(entry.height)}`);
    say('hero-hash', b.hash);
    say('hero-time', utcStamp(b.timestamp));
    say('hero-local', b.timestamp !== null ? localStamp(b.timestamp) : '');
    say('hero-witness', witnessSentence(entry.counts));
    say('hero-caption', `Today’s bloom: drawn from the hash of block ${fmt(entry.height)}, the latest checkpoint the devnet has sealed.`);
    paint(heroImg, entry, { drift: S.drift });
    if (heroOpen) heroOpen.disabled = false;
    for (const n of acts('hero')) n.disabled = false;
  }

  async function loadHero(h) {
    const entry = await loadEntry(h, { detail: true });
    showHero(entry);
    return entry;
  }

  // ------------------------------------------------------------ the grid

  function groupFor(day) {
    const last = S.groups[S.groups.length - 1];
    if (last && last.day === day) return last;
    const section = el('section', 'bl-day');
    const head = el('h3', 'h3 bl-day__h', day === 'unknown' ? 'Time unknown' : `${day} UTC`);
    const count = el('span', 'bl-day__n', '');
    head.append(' ', count);
    const list = el('ol', 'bl-tiles');
    section.append(head, list);
    grid.append(section);
    const g = { day, section, list, count, n: 0 };
    S.groups.push(g);
    return g;
  }

  /** One grid cell: a button that opens the large view, or a "not read" cell that retries. */
  function buildTile(h, block) {
    // A checkpoint already read in detail (the hero's) keeps its own witness counts: they are newer than the range read's.
    const prev = S.entries.get(h);
    const entry = block ? { height: h, block, wit: prev?.wit ?? null, counts: prev?.wit ? prev.counts : rangeCounts(h) } : null;
    if (entry) S.entries.set(h, entry);
    const li = el('li', 'bl-tile-li');
    const btn = el('button', block ? 'bl-tile' : 'bl-tile is-missing');
    btn.type = 'button';
    btn.dataset.h = String(h);
    if (block) {
      const img = el('img');
      img.width = 200;
      img.height = 200;
      img.loading = 'lazy';
      img.decoding = 'async';
      paint(img, entry);
      btn.append(img);
    } else {
      btn.append(el('span', 'bl-tile__miss', 'not read'));
    }
    const cap = el('span', 'bl-tile__cap');
    cap.append(el('span', 'bl-tile__h', `№${fmt(h)}`));
    cap.append(el('span', 'bl-tile__t', block ? utcClock(block.timestamp) || '—' : 'unavailable'));
    if (entry && entry.counts && entry.counts.distinct) cap.append(el('span', 'bl-tile__w', `${fmt(entry.counts.distinct)} ${entry.counts.distinct === 1 ? 'key' : 'keys'}`));
    btn.append(cap, el('span', 'bl-sr', block ? ' Open the large view.' : ' Not read. Press Retry to try again.'));
    btn.addEventListener('click', () => (block ? openLarge(h, btn) : retryMissing()));
    li.append(btn);
    return { li, btn, ok: Boolean(block) };
  }

  function addTile(h, block) {
    const last = S.groups[S.groups.length - 1];
    const g = groupFor(block ? utcDay(block.timestamp) || 'unknown' : last ? last.day : 'unknown');
    const t = buildTile(h, block);
    g.list.append(t.li);
    g.n += 1;
    g.count.textContent = `· ${fmt(g.n)} ${g.n === 1 ? 'checkpoint' : 'checkpoints'}`;
    S.tiles.set(h, t);
  }

  function gridStatus() {
    const total = S.heights.length;
    const shown = S.next;
    const missing = [...S.tiles.values()].filter((t) => !t.ok).length;
    say('grid-status', `${fmt(shown)} of ${fmt(total)} checkpoints read, newest first. Each is every tenth block; press one for the large view.${missing ? ` ${fmt(missing)} could not be read.` : ''}`);
    if (moreBtn) moreBtn.hidden = shown >= total;
    if (retryBtn) retryBtn.hidden = missing === 0;
  }

  async function loadChunk() {
    if (S.loadingChunk || S.stop || S.latest === null || S.next >= S.heights.length) return;
    S.loadingChunk = true;
    say('grid-status', 'Reading checkpoints from the devnet…');
    try {
      const hs = S.heights.slice(S.next, S.next + CHUNK);
      if (!S.rangeTried) await loadRange();
      const res = await pool(hs, (h) => getBlock(h));
      res.forEach((r, k) => addTile(hs[k], r.ok ? r.v : null));
      S.next += hs.length;
      gridStatus();
    } catch {
      say('grid-status', 'Checkpoints could not be read just now. Press “Load older checkpoints” to try again.');
      if (moreBtn) moreBtn.hidden = false;
    } finally {
      S.loadingChunk = false;
    }
    if (sentinelNear()) idle(loadChunk);
  }

  async function retryMissing() {
    const missing = [...S.tiles.entries()].filter(([, t]) => !t.ok).map(([h]) => h);
    const res = await pool(missing, (h) => getBlock(h));
    res.forEach((r, k) => {
      if (!r.ok) return;
      const h = missing[k];
      const t = buildTile(h, r.v);
      S.tiles.get(h).li.replaceWith(t.li);
      S.tiles.set(h, t);
    });
    gridStatus();
  }

  function sentinelNear() {
    if (!sentinel || !win.innerHeight || typeof sentinel.getBoundingClientRect !== 'function') return false;
    return sentinel.getBoundingClientRect().top < win.innerHeight + 600;
  }

  // ------------------------------------------------------------ the large view

  const setHash = (h) => {
    try {
      win.history.replaceState(null, '', `${win.location.pathname}${win.location.search}${h === null ? '' : `#cp-${h}`}`);
    } catch {
      // a sandboxed frame: the large view still works without a link
    }
  };

  function resetDetail(h) {
    say('d-title', `Checkpoint №${fmt(h)}`);
    say('d-height', fmt(h));
    for (const k of ['d-hash', 'd-time', 'd-local', 'd-chain', 'd-link', 'd-witness', 'd-palette', 'd-ring-note', 'd-call', 'd-get']) say(k, '…');
    const keys = hook('d-keys');
    if (keys) keys.replaceChildren();
    for (const n of acts('d')) n.disabled = true;
    const older = hook('d-older');
    const newer = hook('d-newer');
    if (older) older.disabled = h - CHECKPOINT_INTERVAL < CHECKPOINT_INTERVAL;
    if (newer) newer.disabled = S.latest === null || h + CHECKPOINT_INTERVAL > S.latest;
  }

  async function openLarge(h, opener) {
    if (!dialog || !Number.isSafeInteger(h) || h < CHECKPOINT_INTERVAL || h % CHECKPOINT_INTERVAL !== 0) return;
    if (opener) S.opener = opener;
    S.current = h;
    resetDetail(h);
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.open = true;
    }
    setHash(h);
    say('d-status', `Reading block ${fmt(h)}…`);
    let entry;
    try {
      entry = await loadEntry(h, { detail: true });
    } catch {
      if (S.current === h) say('d-status', `Block ${fmt(h)} could not be read from the devnet. It may be restarting; close this and try again.`);
      return;
    }
    if (S.current !== h) return;
    fillDetail(entry);
    const next = h + 1;
    if (S.status && next <= S.status.height) {
      try {
        const head = readRawHeader(await getJson(`/raw/block/${next}`), next);
        if (S.current === h) say('d-link', linkHolds(entry.block, head)
          ? `The next block (№${fmt(next)}) names this hash as its parent: the devnet’s own chain agrees with itself.`
          : `The next block (№${fmt(next)}) names a different parent hash. Do not trust this bloom until the devnet explains it.`);
      } catch {
        if (S.current === h) say('d-link', `The next block (№${fmt(next)}) could not be read, so the parent link was not checked.`);
      }
    } else if (S.current === h) {
      say('d-link', 'No next block yet, so there is no parent link to check.');
    }
  }

  function fillDetail(entry) {
    const b = entry.block;
    const w = entry.wit;
    say('d-status', '');
    say('d-hash', b.hash);
    say('d-time', utcStamp(b.timestamp));
    say('d-local', b.timestamp !== null ? localStamp(b.timestamp) : '');
    say('d-chain', `${S.status ? S.status.chainId : siteChain} · genesis ${S.status ? S.status.genesis.slice(0, 8) : ''}…${api.local ? ' · a local devnet, not the public one' : ''}`);
    say('d-witness', witnessSentence(entry.counts));
    const keys = hook('d-keys');
    if (keys) {
      const items = (w ? w.keys : []).map((k) => {
        const li = el('li', 'bl-key');
        li.append(el('span', 'bl-key__n', k.name || 'unnamed key'));
        if (k.addr) li.append(el('span', 'bl-key__a', k.addr));
        if (RESULT_TEXT[k.result]) li.append(el('span', 'bl-key__r', RESULT_TEXT[k.result]));
        return li;
      });
      if (w && w.more) items.push(el('li', 'bl-key', `+${fmt(w.more)} more keys not listed here`));
      keys.replaceChildren(...items);
    }
    const drawn = entry.counts ? Math.min(entry.counts.distinct, MAX_WITNESS_RINGS) : 0;
    say('d-ring-note', drawn
      ? `The SVG you can download draws ${fmt(drawn)} extra ${drawn === 1 ? 'circle' : 'circles'} for the witness keys, at radius 390 + 7 × k. “Bare bloom” leaves them out: that file is byte for byte what the recipe prints.`
      : 'This checkpoint has no witness rings, so the downloaded SVG is byte for byte what the recipe prints.');
    const bare = hook('d-bare');
    if (bare) bare.hidden = drawn === 0;
    say('d-palette', paletteOf(svgText(entry, { bare: true })).join('  '));
    say('d-call', `bloom('${b.hash}')`);
    say('d-get', `GET ${api.base}/block/${entry.height}`);
    paint(detailImg, entry, { drift: S.drift });
    for (const n of acts('d')) n.disabled = false;
  }

  function closeLarge() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      // No <dialog> methods (an old browser, a test DOM): close it by hand, and do what the close event would.
      dialog.open = false;
      onClosed();
    }
  }

  function onClosed() {
    S.current = null;
    setHash(null);
    const o = S.opener;
    S.opener = null;
    if (o && typeof o.focus === 'function') o.focus();
  }

  function step(delta) {
    if (S.current === null) return;
    const to = S.current + delta * CHECKPOINT_INTERVAL;
    if (to < CHECKPOINT_INTERVAL || (S.latest !== null && to > S.latest)) return;
    openLarge(to, null);
  }

  // ------------------------------------------------------------ buttons

  /** A short confirmation in whichever live region the visitor is looking at: the large view's, or the hero's. */
  const notify = (msg) => say(dialog && dialog.open ? 'd-status' : 'hero-status', msg);

  async function copyText(text, what) {
    try {
      await win.navigator.clipboard.writeText(text);
      notify(`Copied ${what}.`);
      return;
    } catch {
      // fall through to the old way
    }
    try {
      const ta = el('textarea', 'bl-offscreen');
      ta.value = text;
      ta.readOnly = true;
      doc.body.append(ta);
      ta.select();
      const ok = doc.execCommand('copy');
      ta.remove();
      notify(ok ? `Copied ${what}.` : `Could not copy ${what}: select the text and copy it yourself.`);
    } catch {
      notify(`Could not copy ${what}: select the text and copy it yourself.`);
    }
  }

  function saveSvg(height, bare) {
    const entry = S.entries.get(height);
    if (!entry) return;
    const blobUrl = svgUrl(entry, { bare });
    const a = el('a');
    a.href = blobUrl;
    a.download = fileName(S.status ? S.status.chainId : siteChain, entry.height);
    doc.body.append(a);
    a.click();
    a.remove();
    notify(`${bare ? 'Bare bloom' : 'SVG'} for block ${fmt(entry.height)} saved. It is a drawing of a devnet checkpoint: free, no price, not a token.`);
  }

  function setDrift(on) {
    S.drift = Boolean(on);
    for (const cb of hooks('drift')) cb.checked = S.drift;
    const hero = S.entries.get(S.latest);
    if (hero && heroImg) paint(heroImg, hero, { drift: S.drift });
    const cur = S.current !== null ? S.entries.get(S.current) : null;
    if (cur && detailImg && dialog && dialog.open) paint(detailImg, cur, { drift: S.drift });
  }

  const recipeText = () => (hook('recipe-code') ? hook('recipe-code').textContent : '');

  function wireButtons() {
    heroOpen?.addEventListener('click', () => S.latest !== null && openLarge(S.latest, heroOpen));
    hook('hero-large')?.addEventListener('click', (e) => S.latest !== null && openLarge(S.latest, e.currentTarget));
    hook('hero-save')?.addEventListener('click', () => S.latest !== null && saveSvg(S.latest, false));
    hook('hero-copy')?.addEventListener('click', () => {
      const h = S.entries.get(S.latest);
      if (h) copyText(h.block.hash, 'the block hash');
    });
    hook('d-close')?.addEventListener('click', closeLarge);
    hook('d-older')?.addEventListener('click', () => step(-1));
    hook('d-newer')?.addEventListener('click', () => step(1));
    hook('d-save')?.addEventListener('click', () => S.current !== null && saveSvg(S.current, false));
    hook('d-bare')?.addEventListener('click', () => S.current !== null && saveSvg(S.current, true));
    hook('d-copy-hash')?.addEventListener('click', () => {
      const e = S.entries.get(S.current);
      if (e) copyText(e.block.hash, 'the block hash');
    });
    hook('d-copy-recipe')?.addEventListener('click', () => copyText(recipeText(), 'the recipe'));
    hook('d-copy-call')?.addEventListener('click', () => {
      const e = S.entries.get(S.current);
      if (e) copyText(`bloom('${e.block.hash}')`, 'the call');
    });
    moreBtn?.addEventListener('click', () => loadChunk());
    retryBtn?.addEventListener('click', () => retryMissing());
    for (const cb of hooks('drift')) cb.addEventListener('change', () => setDrift(cb.checked));
    const yard = hook('d-yard');
    if (yard) yard.hidden = api.local;
    if (dialog) {
      dialog.addEventListener('close', onClosed);
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) closeLarge();
      });
      dialog.addEventListener('keydown', (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        const tag = e.target && e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          step(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          step(1);
        }
      });
    }
    win.addEventListener('hashchange', routeHash);
    const rm = typeof win.matchMedia === 'function' ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
    for (const n of hooks('rm-note')) n.hidden = !(rm && rm.matches);
  }

  function routeHash() {
    const m = HASH_ROUTE.exec(win.location ? win.location.hash : '');
    if (!m) {
      if (dialog && dialog.open && !win.location.hash) closeLarge();
      return;
    }
    const h = Number(m[1]);
    if (S.latest !== null && h >= CHECKPOINT_INTERVAL && h % CHECKPOINT_INTERVAL === 0 && h <= S.latest && h !== S.current) openLarge(h, null);
  }

  // ------------------------------------------------------------ the refresh loop

  const down = (hadData, why) => {
    const odd = why instanceof Error && why.message.startsWith('bloom:');
    root.dataset.state = odd ? 'odd' : 'down';
    say('status', odd
      ? `The devnet answered, but not with what a checkpoint looks like (${why.message.slice(7, 120)}). Nothing is drawn from it; this tries again soon.`
      : hadData ? 'devnet unreachable · showing the last read' : 'devnet unreachable. It may be restarting or paused; this tries again soon.');
    say('clock', odd ? 'unexpected reply' : 'devnet unreachable');
    say('grid-status', S.next ? `devnet unreachable · showing the ${fmt(S.next)} checkpoints read so far.` : 'devnet unreachable. Checkpoints load when it answers.');
  };

  function pinMismatch(st) {
    S.stop = true;
    root.dataset.state = 'pin';
    say('status', `GENESIS CHANGED. This page pins genesis ${pinned.slice(0, 8)}… and the chain at the devnet URL answers with ${st.genesis.slice(0, 8)}…. A reset is dated and recorded, never silent: no bloom is drawn from a chain this page has not pinned. The devnet-1 recording stays at /chain/yard/devnet-1/.`);
    say('clock', 'genesis changed');
    say('grid-status', 'Nothing is read while the genesis does not match.');
  }

  /** Attestations arrive after a checkpoint seals: read the latest one's witness list again and redraw the rings if it grew. */
  async function refreshWitnesses(h) {
    const before = S.entries.get(h);
    S.wits.delete(h);
    if (before) S.entries.set(h, { ...before, wit: null });
    const entry = await loadEntry(h, { detail: true });
    // A witness list that cannot be read now is not an empty one: keep the last list that was read (its count, its rings, the key list in the
    // large view) and say the read failed, instead of falling back to the older range read's zero and printing "No witness key has signed".
    if (entry.witnessUnreadable && before && before.wit) {
      S.entries.set(h, before);
      say('hero-status', 'The witness list could not be read just now, so the count and the rings are from the last read.');
      return;
    }
    if (!before || !before.counts || !entry.counts || before.counts.distinct !== entry.counts.distinct) {
      showHero(entry);
      if (entry.counts && entry.counts.distinct) say('hero-status', `${witnessSentence(entry.counts)} Today’s bloom now draws the rings.`);
    }
  }

  async function refresh() {
    if (S.refreshing || S.stop || !visible()) return;
    S.refreshing = true;
    const hadData = S.latest !== null;
    try {
      const st = readStatus(await getJson('/status'));
      if (pinned && st.genesis !== pinned) {
        pinMismatch(st);
        return;
      }
      S.status = st;
      const latest = latestCheckpoint(st.height);
      if (latest === null) {
        root.dataset.state = 'none';
        say('status', `The devnet is at height ${fmt(st.height)}. The first checkpoint is block ${CHECKPOINT_INTERVAL}, so there is nothing to draw yet. This looks again in a minute.`);
        say('clock', `read ${new Date(now()).toISOString().slice(11, 16)} UTC`);
        say('grid-status', 'No checkpoint yet.');
        return;
      }
      const prev = S.latest;
      if (prev !== latest) {
        S.latest = latest;
        if (prev === null) S.heights = checkpointHeights(latest, GRID_COUNT);
        await loadHero(latest);
        if (prev === null) {
          routeHash();
          // Without an IntersectionObserver there is no scroll trigger: read the first chunk once the hero is up.
          if (sentinelNear() || S.noObserver) idle(loadChunk);
        } else {
          say('hero-status', `A new checkpoint sealed: block ${fmt(latest)}. Today’s bloom now shows it. Reload the page to add it to the grid.`);
        }
      } else {
        await refreshWitnesses(latest);
      }
      S.failures = 0;
      root.dataset.state = 'live';
      say('status', `${api.local ? `LOCAL devnet at ${api.base}, not the public chain. ` : ''}Live from ${S.status.chainId}: the latest checkpoint is block ${fmt(latest)}.`);
      say('clock', `height ${fmt(st.height)} · read ${new Date(now()).toISOString().slice(11, 16)} UTC · refreshes once a minute while this page is open`);
    } catch (e) {
      S.failures += 1;
      down(hadData, e);
    } finally {
      S.refreshing = false;
      S.lastRead = now();
      // After a failed read, look again sooner so a hiccup does not cost a minute.
      if (!S.stop) win.setTimeout(() => idle(refresh), retryDelay(S.failures));
    }
  }

  // ------------------------------------------------------------ start

  function begin() {
    wireButtons();
    if (api.rejected) say('status', 'A ?devnet= address was ignored: this page only reads another devnet when it is on localhost or 127.0.0.1.');
    root.dataset.state = 'loading';
    if (typeof win.IntersectionObserver === 'function' && sentinel) {
      const io = new win.IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) idle(loadChunk);
      }, { rootMargin: '600px 0px' });
      io.observe(sentinel);
    } else {
      S.noObserver = true;
    }
    doc.addEventListener('visibilitychange', () => {
      if (visible() && now() - S.lastRead > REFRESH_MS) idle(refresh);
    });
    idle(refresh);
  }

  if (doc.readyState === 'complete') begin();
  else win.addEventListener('load', begin, { once: true });

  return { refresh, loadChunk, openLarge, state: S };
}
