/**
 * chain-strip.mjs — the browser side of HomeChainStrip.astro: the PointCast
 * Chain public devnet drawn as one honest strip of pixel cubes.
 *
 * Plain JS with no imports, so node --test can run it against hostile data
 * in jsdom. The component passes the channel colours in from src/lib/channels.
 *
 * Rules (Town Network plan, package `frontdoor`, adapted for the devnet):
 * - Everything the devnet returns is written by anyone. Titles and bot names
 *   go into the page with textContent only, after control and bidi characters
 *   are stripped and address-shaped strings are masked. Nothing read from the
 *   chain becomes markup, an href, a src or a style value; a channel code is
 *   only ever a lookup key into the colours we were given.
 * - Reads happen in the visitor's browser after the load event and an idle
 *   callback, only while the strip is near the viewport and the tab is
 *   visible, and at most once every REFRESH_MS.
 * - Importing this module touches no network and no DOM.
 */

export const REFRESH_MS = 60_000;
export const TIMEOUT_MS = 8_000;
export const FEED_LIMIT = 8;
export const MAX_STACK = 6;
export const MAX_BODY_CHARS = 256 * 1024;

/** Pixel-iso geometry, in SVG user units. Integer coordinates keep the edges crisp. */
export const GEOM = Object.freeze({ step: 20, pad: 4, a: 8, b: 4, h: 7, ground: 58, height: 64 });

export function viewWidth(slots) {
  return GEOM.pad * 2 + slots * GEOM.step;
}

// Tezos implicit + originated accounts and pointcast-chain agent / passkey
// accounts, written as character classes so the strip's source carries no
// address prefix of its own. Masked anywhere in a string, word boundary or not.
const ADDRESS_RE = /(?:tz[1-4]|KT1|pc[ap]1)[1-9A-HJ-NP-Za-km-z]{20,}/g;
// C0/C1 controls, soft hyphen, Arabic letter mark, zero-width space/non-joiner,
// LRM/RLM, line/paragraph separators, bidi embeddings, overrides and isolates,
// invisible operators, BOM. (The zero-width joiner stays: emoji need it.)
const INVISIBLE_RE = /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b\u200c\u200e\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g;
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const nat = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : null);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** Hostile string → one safe line of at most `max` code points. Non-strings become ''. */
export function cleanText(value, max = 90) {
  if (typeof value !== 'string') return '';
  const flat = value
    .slice(0, 2000)
    .replace(INVISIBLE_RE, ' ')
    .replace(ADDRESS_RE, '[address]')
    .replace(/\s+/g, ' ')
    .trim();
  const chars = Array.from(flat);
  if (chars.length <= max) return flat;
  return `${chars.slice(0, Math.max(1, max - 1)).join('').trimEnd()}…`;
}

function botName(tx) {
  let raw = typeof tx.bot === 'string' ? tx.bot : '';
  if (!raw && isObj(tx.sender_info) && typeof tx.sender_info.name === 'string') raw = tx.sender_info.name.replace(/^bot:/, '');
  return cleanText(raw, 24) || 'unnamed';
}

function cubeColor(tx, colors) {
  if (tx.kind !== 'publish_block') return 'var(--pcs-sys)';
  const channel = isObj(tx.payload) ? tx.payload.channel : null;
  if (typeof channel === 'string' && own(colors, channel) && HEX_COLOR_RE.test(colors[channel])) return colors[channel];
  return 'var(--pcs-bot)';
}

/**
 * Turn GET /status and GET /feed?limit=8 into what the strip draws. Throws on
 * anything that is not the devnet we expect, so the caller falls back.
 *
 * /feed lists non-empty blocks newest first (pointcast-chain docs/DEVNET.md).
 * Every height between the oldest block it returned and its tip that is not in
 * the list is therefore an empty block, drawn as a flat tile. If the feed came
 * back short of its limit it holds every non-empty block since genesis.
 */
export function readModel(status, feed, opts = {}) {
  const { slots = 12, posts = 1, maxTitle = 90, chainId = '', genesis = '', colors = {} } = opts;
  if (!isObj(status) || !isObj(feed)) throw new Error('devnet: unexpected shape');
  if (status.network !== 'devnet') throw new Error('devnet: not a devnet');
  if (chainId && status.chain_id !== chainId) throw new Error('devnet: unexpected chain id');
  const height = nat(status.height);
  const tip = nat(feed.tip);
  if (height === null || tip === null || !Array.isArray(feed.blocks)) throw new Error('devnet: unexpected shape');

  const raw = feed.blocks.slice(0, FEED_LIMIT);
  const byHeight = new Map();
  for (const b of raw) {
    if (!isObj(b)) continue;
    const h = nat(b.height);
    if (h === null || h < 1 || h > tip || byHeight.has(h)) continue;
    byHeight.set(h, Array.isArray(b.txs) ? b.txs.filter(isObj) : []);
  }
  const heights = [...byHeight.keys()].sort((x, y) => y - x);

  let postsShown = 0;
  const recent = [];
  for (const h of heights) {
    const txs = byHeight.get(h);
    for (let i = txs.length - 1; i >= 0; i -= 1) {
      const tx = txs[i];
      if (tx.kind !== 'publish_block') continue;
      postsShown += 1;
      if (recent.length >= posts) continue;
      const title = cleanText(isObj(tx.payload) ? tx.payload.title : '', maxTitle);
      if (title) recent.push({ height: h, title, bot: botName(tx) });
    }
  }

  const known = feed.blocks.length < FEED_LIMIT ? 1 : heights.length ? heights[heights.length - 1] : tip + 1;
  const first = Math.max(1, known, tip - slots + 1);
  const cells = [];
  for (let h = first; h <= tip; h += 1) {
    const txs = byHeight.get(h) || [];
    cells.push({ height: h, count: txs.length, cubes: txs.slice(0, MAX_STACK).map((tx) => cubeColor(tx, colors)) });
  }

  return {
    height,
    tip,
    accounts: nat(status.accounts),
    bots: nat(status.bots),
    postsShown,
    posts: recent,
    cells,
    reset: Boolean(genesis) && status.genesis_hash !== genesis,
  };
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function points(list) {
  return list.map(([x, y]) => `${x},${y}`).join(' ');
}

function face(doc, cls, list) {
  const p = doc.createElementNS(SVG_NS, 'polygon');
  p.setAttribute('class', cls);
  p.setAttribute('points', points(list));
  return p;
}

function cube(doc, x, yb, h, color) {
  const { a, b } = GEOM;
  const g = doc.createElementNS(SVG_NS, 'g');
  g.style.setProperty('--c', color);
  g.append(
    face(doc, 'pcs-l', [[x - a, yb - h - b], [x, yb - h], [x, yb], [x - a, yb - b]]),
    face(doc, 'pcs-r', [[x, yb - h], [x + a, yb - h - b], [x + a, yb - b], [x, yb]]),
    face(doc, 'pcs-t', [[x, yb - h - 2 * b], [x + a, yb - h - b], [x, yb - h], [x - a, yb - h - b]]),
  );
  return g;
}

function cellLabel(cell) {
  if (!cell.count) return `№${cell.height} · empty`;
  const capped = cell.count > MAX_STACK ? ` (stack capped at ${MAX_STACK})` : '';
  return `№${cell.height} · ${plural(cell.count, 'transaction')}${capped}`;
}

function setText(el, text) {
  if (el) el.textContent = text;
}

function clock(now) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Draw a model into a server-rendered strip. Returns the heights that carry cubes. */
export function render(root, model, { previous = new Set(), now = new Date(), wide = false } = {}) {
  const doc = root.ownerDocument;
  const q = (sel) => root.querySelector(sel);

  const svg = q('[data-cs-svg]');
  const layer = q('[data-cs-cubes]');
  const drawn = new Set();
  if (layer) {
    const groups = model.cells.map((cell, i) => {
      const x = GEOM.pad + GEOM.a + 2 + i * GEOM.step;
      const g = doc.createElementNS(SVG_NS, 'g');
      const title = doc.createElementNS(SVG_NS, 'title');
      title.textContent = cellLabel(cell);
      g.append(title);
      if (!cell.cubes.length) {
        g.setAttribute('class', 'pcs-tile');
        g.append(cube(doc, x, GEOM.ground, 1, 'var(--pcs-tile)'));
        return g;
      }
      g.setAttribute('class', previous.has(cell.height) ? 'pcs-stack' : 'pcs-stack pcs-new');
      cell.cubes.forEach((color, k) => g.append(cube(doc, x, GEOM.ground - k * GEOM.h, GEOM.h, color)));
      drawn.add(cell.height);
      return g;
    });
    layer.replaceChildren(...groups);
  }
  if (svg) {
    const n = model.cells.length;
    const busy = model.cells.filter((c) => c.count).length;
    svg.removeAttribute('aria-hidden');
    svg.setAttribute('role', 'img');
    svg.setAttribute(
      'aria-label',
      n
        ? `The latest ${plural(n, 'devnet block')}, №${model.cells[0].height} to №${model.cells[n - 1].height}: ${busy} with transactions, ${n - busy} empty.`
        : 'No devnet blocks yet.',
    );
  }
  setText(q('[data-cs-from]'), model.cells.length ? `№${model.cells[0].height}` : '');
  setText(q('[data-cs-to]'), model.cells.length ? `№${model.cells[model.cells.length - 1].height} · tip` : '');

  const nums = [`Height ${model.height}`, plural(model.postsShown, 'post') + ' shown'];
  if (wide && model.accounts !== null) nums.push(plural(model.accounts, 'account'));
  if (wide && model.bots !== null) nums.push(plural(model.bots, 'bot'));
  if (model.reset) nums.push('reset since this build');
  setText(q('[data-cs-nums]'), nums.join(' · '));
  setText(q('[data-cs-clock]'), `Read ${clock(now)}`);

  const lines = [...root.querySelectorAll('[data-cs-post]')];
  lines.forEach((li, i) => {
    const post = model.posts[i];
    li.replaceChildren();
    if (post) {
      // The bot's name leads: every post is a bot's own words, quoted as written.
      const by = doc.createElement('span');
      by.className = 'pcs-by';
      by.textContent = `${post.bot} · №${post.height}`;
      const quote = doc.createElement('span');
      quote.className = 'pcs-q';
      quote.textContent = `“${post.title}”`;
      li.append(by, quote);
    } else if (i === 0) {
      li.textContent = 'No posts in the latest blocks.';
    }
  });

  root.dataset.state = 'live';
  return drawn;
}

/** Back to the server-rendered state, plus a quiet note. */
export function renderDown(root) {
  const q = (sel) => root.querySelector(sel);
  q('[data-cs-cubes]')?.replaceChildren();
  const svg = q('[data-cs-svg]');
  if (svg) {
    svg.setAttribute('aria-hidden', 'true');
    svg.removeAttribute('role');
    svg.removeAttribute('aria-label');
  }
  for (const sel of ['[data-cs-from]', '[data-cs-to]', '[data-cs-nums]']) setText(q(sel), '');
  root.querySelectorAll('[data-cs-post]').forEach((li) => li.replaceChildren());
  setText(q('[data-cs-clock]'), 'devnet unreachable');
  root.dataset.state = 'down';
}

async function getJson(fetchImpl, url, win) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = win.setTimeout(() => ctrl?.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { signal: ctrl?.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
    if (!res || !res.ok) throw new Error(`devnet: HTTP ${res ? res.status : '?'}`);
    const text = await res.text();
    if (text.length > MAX_BODY_CHARS) throw new Error('devnet: response too large');
    return JSON.parse(text);
  } finally {
    win.clearTimeout(timer);
  }
}

const int = (v, d) => {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isSafeInteger(n) && n > 0 ? n : d;
};

/**
 * Wire one strip up. Nothing is fetched here: reads wait for the load event,
 * an idle callback, the strip coming within 400px of the viewport and a
 * visible tab, and then repeat at most once every REFRESH_MS while all of
 * that stays true. `env` exists for tests.
 */
export function start(root, env = {}) {
  const doc = root.ownerDocument;
  const win = env.window || doc.defaultView;
  const fetchImpl = env.fetch || ((...args) => win.fetch(...args));
  const now = env.now || (() => Date.now());
  const base = String(root.dataset.api || '');
  if (!/^https:\/\/[a-z0-9.-]+$/i.test(base)) return null;

  const wide = root.dataset.variant === 'wide';
  const opts = {
    slots: int(root.dataset.slots, 12),
    posts: int(root.dataset.posts, 1),
    maxTitle: int(root.dataset.titleMax, 90),
    chainId: root.dataset.chainId || '',
    genesis: root.dataset.genesis || '',
    colors: env.colors || {},
  };

  let near = false;
  let busy = false;
  let last = -Infinity;
  let timer = 0;
  let previous = new Set();

  const visible = () => doc.visibilityState !== 'hidden';
  const idle = (fn) =>
    typeof win.requestIdleCallback === 'function' ? win.requestIdleCallback(fn, { timeout: 4000 }) : win.setTimeout(fn, 1200);
  const later = (ms) => {
    win.clearTimeout(timer);
    timer = win.setTimeout(() => idle(tick), ms);
  };

  async function tick() {
    if (!near || !visible() || busy) return;
    const wait = last + REFRESH_MS - now();
    if (wait > 0) {
      later(wait);
      return;
    }
    busy = true;
    try {
      const [status, feed] = await Promise.all([
        getJson(fetchImpl, `${base}/status`, win),
        getJson(fetchImpl, `${base}/feed?limit=${FEED_LIMIT}`, win),
      ]);
      previous = render(root, readModel(status, feed, opts), { previous, now: new Date(now()), wide });
    } catch {
      renderDown(root);
      previous = new Set();
    } finally {
      busy = false;
      last = now();
      later(REFRESH_MS);
    }
  }

  const begin = () => {
    if (typeof win.IntersectionObserver === 'function') {
      const io = new win.IntersectionObserver(
        (entries) => {
          near = entries.some((e) => e.isIntersecting);
          if (near) idle(tick);
        },
        { rootMargin: '400px 0px' },
      );
      io.observe(root);
    } else {
      near = true;
      idle(tick);
    }
    doc.addEventListener('visibilitychange', () => {
      if (visible() && near) idle(tick);
    });
  };
  if (doc.readyState === 'complete') begin();
  else win.addEventListener('load', begin, { once: true });

  return { tick };
}
