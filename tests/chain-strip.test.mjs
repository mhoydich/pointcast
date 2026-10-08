// The PointCast Chain devnet strip (Town Network plan, package `frontdoor`):
// src/components/HomeChainStrip.astro + src/lib/chain-strip.mjs, on the front
// door and as the Town digest on /chain.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { DEVNET as DEVNET_LIVE, DEVNET_PREVIOUS } from '../src/data/chain-home.ts';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const component = read('src/components/HomeChainStrip.astro');
const lib = read('src/lib/chain-strip.mjs');
const chainHome = read('src/data/chain-home.ts');
const home = read('src/pages/index.astro');
const chainPage = read('src/pages/chain.astro');
const stripSources = { component, lib };

const DEVNET_URL = chainHome.match(/const DEVNET_URL = '([^']+)'/)[1];
// The live pin (devnet-2), read from the module: never a hash typed into a test.
const GENESIS = DEVNET_LIVE.genesis;
const PREVIOUS_GENESIS = DEVNET_PREVIOUS.genesis;
const CHAIN_ID = chainHome.match(/chainId: '([^']+)'/)[1];
// Built from parts so this file carries no address-shaped literal either.
const ADDRESS = new RegExp(`(?:${['tz[1-4]', 'KT1', 'pc[ap]1'].join('|')})[1-9A-HJ-NP-Za-km-z]{20,}`);
const fakeAddress = (prefix) => `${prefix}Vt8JkUShtxihYQUBQfnDfvVm3RvDCicp`;

// Strip comments so the rules read code and copy, not the notes about them.
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('chain data never becomes markup, an href or a src', () => {
  for (const [name, src] of Object.entries(stripSources)) {
    const body = code(src);
    assert.doesNotMatch(body, /\binnerHTML\b|\bouterHTML\b|insertAdjacentHTML|document\.write|set:html|createContextualFragment|DOMParser/, name);
    assert.doesNotMatch(body, /\.(href|src|srcset|action)\s*=|setAttribute\(\s*['"](href|src|srcset|action|style|on\w+)['"]/i, name);
  }
  // The only href in the component is a server-rendered constant from the link list.
  assert.equal((component.match(/href=\{/g) || []).length, 1);
  assert.match(component, /<a href=\{link\.href\}>/);
  // Text goes in with textContent; the one style write is a colour looked up in our own map.
  assert.match(lib, /\.textContent = /);
  assert.equal((code(lib).match(/style\.setProperty/g) || []).length, 1);
  assert.match(lib, /own\(colors, channel\) && HEX_COLOR_RE\.test\(colors\[channel\]\)/);
});

test('honesty copy: devnet, no value, the restart is dated; no network, mainnet, mint or value claims', () => {
  for (const [name, src] of Object.entries(stripSources)) {
    for (const phrase of [/live network/i, /main\s*net/i, /minted on pointcast chain/i, /\bminted\b/i, /\bworth\b/i, /\binvest/i, /\bprofit/i, /\byield\b/i, /\bpublic network\b/i])
      assert.doesNotMatch(src, phrase, `${name}: ${phrase}`);
  }
  assert.match(component, /\{DEVNET\.label\} · \{DEVNET\.terms\}/);
  assert.match(chainHome, /label: 'devnet-2 · bot · unmoderated'/);
  assert.match(chainHome, /terms: 'no value is promised · may reset'/);
  assert.match(component, /'PointCast Chain · devnet'/);
  assert.match(component, /devnet/);
  assert.match(lib, /'devnet unreachable'/);
});

test('no address anywhere in the strip', () => {
  for (const [name, src] of Object.entries(stripSources)) {
    assert.doesNotMatch(src, /tz1|tz2|tz3|pca1|pcp1/, name);
    assert.doesNotMatch(src, ADDRESS, name);
  }
});

test('links: /chain, /chain/bots and the Block Yard on the devnet with genesis pinned', () => {
  assert.match(component, /href: '\/chain', label:/);
  assert.match(component, /href: '\/chain\/bots', label:/);
  assert.match(component, /href: DEVNET\.yardHref/);
  assert.match(chainHome, /yardHref: `\/chain\/yard\/\?api=\$\{DEVNET_URL\}&genesis=\$\{DEVNET_2_GENESIS\}&verifier=\/chain\/yard\/verifier`/);
  assert.match(component, /import \{ DEVNET \} from '\.\.\/data\/chain-home'/);
  assert.doesNotMatch(component, /workers\.dev|[0-9a-f]{64}/, 'reuses DEVNET instead of duplicating its constants');
});

test('placement: under HomeLatestProjects on the front door, under the devnet aside on /chain', () => {
  assert.match(home, /import HomeChainStrip from '\.\.\/components\/HomeChainStrip\.astro';/);
  const projects = home.indexOf('<HomeLatestProjects />');
  const strip = home.indexOf('<HomeChainStrip />');
  assert.ok(projects > 0 && strip > projects && strip < home.indexOf('<HomeLatestShelf'));
  assert.match(chainPage, /import HomeChainStrip from '\.\.\/components\/HomeChainStrip\.astro';/);
  const aside = chainPage.indexOf('<aside class="live"');
  const digest = chainPage.indexOf('<HomeChainStrip variant="wide" />');
  assert.ok(aside > 0 && digest > aside && digest < chainPage.indexOf('<section class="stats"'));
});

test('the fetch is lazy: nothing at module eval, and only after load, idle, near-viewport and a visible tab', async () => {
  // Source: the component script never fetches; every fetch in the lib sits inside a function.
  const script = component.slice(component.indexOf('<script>'), component.indexOf('</script>'));
  assert.doesNotMatch(script, /fetch\s*\(/);
  const body = code(lib);
  const calls = [...body.matchAll(/\bfetch(?:Impl)?\s*\(/g)];
  assert.ok(calls.length >= 2);
  for (const { index } of calls) {
    const before = body.slice(0, index);
    const depth = (before.match(/\{/g) || []).length - (before.match(/\}/g) || []).length;
    assert.ok(depth > 0, `a fetch call at ${index} sits at top level`);
  }
  for (const needle of ['requestIdleCallback', 'IntersectionObserver', "visibilityState !== 'hidden'", "addEventListener('load'", 'REFRESH_MS = 60_000'])
    assert.ok(lib.includes(needle), needle);

  // Behaviour: importing the module does not fetch.
  const realFetch = globalThis.fetch;
  let fetched = 0;
  globalThis.fetch = () => { fetched += 1; throw new Error('no fetch at import'); };
  try {
    await import(`../src/lib/chain-strip.mjs?lazy=${Date.now()}`);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(fetched, 0);
});

// ---------------------------------------------------------------- jsdom harness

const HOOKS = ['data-cs-svg', 'data-cs-cubes', 'data-cs-from', 'data-cs-to', 'data-cs-nums', 'data-cs-clock', 'data-cs-post'];
const fixture = (variant = 'home', posts = 1) => `<!doctype html><body>
  <section class="pcs" data-chain-strip data-state="static" data-variant="${variant}" data-api="${DEVNET_URL}"
    data-chain-id="${CHAIN_ID}" data-genesis="${GENESIS}" data-slots="16" data-posts="${posts}" data-title-max="90">
    <p><span data-cs-clock></span></p>
    <svg data-cs-svg aria-hidden="true"><g data-cs-cubes></g></svg>
    <p><span data-cs-from></span><span data-cs-to></span></p>
    <p class="pcs__static">static</p>
    <p data-cs-nums></p>
    <ol>${'<li data-cs-post></li>'.repeat(posts)}</ol>
    <nav><a href="/chain">PointCast Chain</a></nav>
  </section></body>`;

const status = (over = {}) => ({
  network: 'devnet', chain_id: CHAIN_ID, genesis_hash: GENESIS, height: 14, accounts: 6, bots: 5,
  label: 'devnet · bot · unmoderated', value: 'none', may_reset: true, ...over,
});
const setupTx = (n) => Array.from({ length: n }, (_, i) => ({ kind: i % 2 ? 'set_mandate' : 'register_agent', payload: {} }));
const post = (title, extra = {}) => ({ kind: 'publish_block', bot: 'claude', payload: { channel: 'BOT', title }, ...extra });
// The shape the devnet returned on 2026-10-03: two non-empty blocks under a tip of 14.
const feed = (over = {}) => ({
  tip: 14,
  next_before: 1,
  blocks: [
    { height: 2, txs: [post('The PointCast devnet is live. Bots can publish here: MCP at /mcp, signed HTTP, or keyless posts.')] },
    { height: 1, txs: setupTx(10) },
  ],
  ...over,
});

function harness({ variant = 'home', posts = 1, respond, readyState = 'complete' } = {}) {
  const dom = new JSDOM(fixture(variant, posts), { pretendToBeVisual: true });
  const { document } = dom.window;
  const el = document.querySelector('[data-chain-strip]');
  let clock = 1_000_000;
  let visibility = 'visible';
  let ready = readyState;
  Object.defineProperty(document, 'visibilityState', { get: () => visibility, configurable: true });
  Object.defineProperty(document, 'readyState', { get: () => ready, configurable: true });
  const idles = [];
  const timers = [];
  const loads = [];
  const urls = [];
  let observer = null;
  const win = {
    setTimeout: (fn, ms) => timers.push({ fn, ms, live: true }),
    clearTimeout: (id) => { if (timers[id - 1]) timers[id - 1].live = false; },
    requestIdleCallback: (fn) => idles.push(fn),
    IntersectionObserver: class {
      constructor(cb, opts) { this.cb = cb; this.opts = opts; observer = this; }
      observe(target) { this.target = target; }
    },
    addEventListener: (type, fn) => { if (type === 'load') loads.push(fn); },
  };
  const fetch = async (url) => {
    urls.push(url);
    const body = respond(url);
    if (body instanceof Error) throw body;
    return { ok: true, status: 200, text: async () => JSON.stringify(body) };
  };
  return {
    dom, document, el, idles, timers, urls,
    get observer() { return observer; },
    load: () => { ready = 'complete'; loads.splice(0).forEach((fn) => fn()); },
    intersect: (on = true) => observer.cb([{ isIntersecting: on, target: el }]),
    runIdle: async () => { for (const fn of idles.splice(0)) await fn(); },
    hide: () => { visibility = 'hidden'; document.dispatchEvent(new dom.window.Event('visibilitychange')); },
    show: () => { visibility = 'visible'; document.dispatchEvent(new dom.window.Event('visibilitychange')); },
    advance: (ms) => { clock += ms; },
    env: { window: win, fetch, now: () => clock, colors: { FD: '#185FA5', GDN: '#0F6E56' } },
  };
}

const devnet = (s = status(), f = feed()) => (url) => (url.endsWith('/status') ? s : url.includes('/feed?') ? f : new Error(url));

test('the component carries every hook the renderer fills, with reserved space and a static first state', () => {
  for (const hook of HOOKS) assert.ok(component.includes(hook), hook);
  assert.match(component, /data-state="static"/);
  assert.match(component, /data-api=\{DEVNET\.url\}/);
  assert.match(component, /data-genesis=\{DEVNET\.genesis\}/);
  assert.match(component, /width=\{width\} height=\{GEOM\.height\}/, 'the cube row reserves its box before any data');
  assert.match(component, /min-height: 42px/);
  assert.match(component, /visibility: hidden/, 'live and static copy share one reserved box');
  assert.match(component, /prefers-reduced-motion: reduce\)[\s\S]*?animation: none/);
  assert.match(component, /prefers-color-scheme: dark/);
  assert.match(component, /var\(--pc-font-mono\)/);
  assert.match(component, /var\(--pc-font-sans\)/);
});

test('reads /status and /feed?limit=8 only after load, idle and intersection, then at most once a minute while visible', async () => {
  const { start, REFRESH_MS } = await import('../src/lib/chain-strip.mjs');
  const h = harness({ respond: devnet(), readyState: 'loading' });
  start(h.el, h.env);
  assert.equal(h.observer, null, 'nothing observed before the load event');
  h.load();
  assert.equal(h.observer.opts.rootMargin, '400px 0px');
  assert.equal(h.urls.length, 0);
  h.intersect(true);
  assert.equal(h.urls.length, 0, 'waits for idle');
  await h.runIdle();
  assert.deepEqual(h.urls, [`${DEVNET_URL}/status`, `${DEVNET_URL}/feed?limit=8`]);
  assert.equal(h.el.dataset.state, 'live');

  // An early nudge (scroll back into view) does not refetch inside the minute.
  h.advance(10_000);
  h.intersect(true);
  await h.runIdle();
  assert.equal(h.urls.length, 2);

  // Hidden tab: the scheduled refresh does nothing.
  h.hide();
  h.advance(REFRESH_MS);
  const due = h.timers.filter((t) => t.live).pop();
  due.fn();
  await h.runIdle();
  assert.equal(h.urls.length, 2);

  // Visible again after the minute: one more read.
  h.show();
  await h.runIdle();
  assert.equal(h.urls.length, 4);

  // Scrolled far away: the next tick stops instead of reading.
  h.intersect(false);
  h.advance(REFRESH_MS);
  h.timers.filter((t) => t.live).pop().fn();
  await h.runIdle();
  assert.equal(h.urls.length, 4);
});

test('renders the devnet as cubes, height, posts shown and the newest title', async () => {
  const { start, MAX_STACK } = await import('../src/lib/chain-strip.mjs');
  const h = harness({ respond: devnet() });
  start(h.el, h.env);
  h.intersect(true);
  await h.runIdle();
  const groups = [...h.el.querySelectorAll('[data-cs-cubes] > g')];
  assert.equal(groups.length, 14, 'one cell per block from №1 to the tip');
  assert.equal(groups[0].querySelectorAll(':scope > g').length, MAX_STACK, '10 setup txs, capped');
  assert.match(groups[0].querySelector('title').textContent, /10 transactions \(stack capped at 6\)/);
  assert.equal(groups[1].querySelectorAll(':scope > g').length, 1);
  assert.ok(groups.slice(2).every((g) => g.getAttribute('class') === 'pcs-tile'), 'empty blocks are flat tiles');
  assert.equal(h.el.querySelector('[data-cs-nums]').textContent, 'Height 14 · 1 post shown');
  assert.equal(h.el.querySelector('[data-cs-from]').textContent, '№1');
  assert.equal(h.el.querySelector('[data-cs-to]').textContent, '№14 · tip');
  const line = h.el.querySelector('[data-cs-post]');
  assert.equal(line.querySelector('.pcs-by').textContent, 'claude · №2');
  assert.match(line.querySelector('.pcs-q').textContent, /^“The PointCast devnet is live\. Bots can publish here: MCP at \/mcp, signed HTTP, or keyless…”$/);
  assert.equal(Array.from(line.querySelector('.pcs-q').textContent).length, 92, '90 code points plus the quote marks');
  const svg = h.el.querySelector('[data-cs-svg]');
  assert.equal(svg.getAttribute('role'), 'img');
  assert.match(svg.getAttribute('aria-label'), /14 devnet blocks, №1 to №14: 2 with transactions, 12 empty/);
  assert.match(h.el.querySelector('[data-cs-clock]').textContent, /^Read \d\d:\d\d$/);
});

test('hostile titles, bot names and channels stay text: no elements, no addresses, no injected colours', async () => {
  const { start } = await import('../src/lib/chain-strip.mjs');
  const evil = '<img src=x onerror="alert(1)"><script>alert(2)</script>\u202Egnp.exe\u0000 send to ' + fakeAddress('tz' + '1');
  const f = feed({
    blocks: [
      { height: 9, txs: [post(evil, { bot: '<b>x</b> ' + fakeAddress('pc' + 'a1') }), { kind: 'publish_block', payload: { channel: '__proto__', title: 'proto' } }] },
      { height: 8, txs: [{ kind: 'publish_block', payload: { channel: 'javascript:alert(1)', title: { toString: () => 'object' } } }] },
      { height: 7, txs: [post('garden', { payload: { channel: 'GDN', title: 'garden' } })] },
    ],
  });
  const h = harness({ variant: 'wide', posts: 3, respond: devnet(status(), f) });
  start(h.el, h.env);
  h.intersect(true);
  await h.runIdle();
  assert.equal(h.el.dataset.state, 'live');
  assert.equal(h.el.querySelectorAll('img, script, b, iframe, object').length, 0);
  assert.deepEqual([...h.el.querySelectorAll('[href]')].map((a) => a.getAttribute('href')), ['/chain'], 'only the server link carries an href');
  assert.equal(h.el.querySelectorAll('[src], [onerror]').length, 0);
  const text = h.el.textContent;
  assert.doesNotMatch(text, ADDRESS);
  assert.match(text, /\[address\]/);
  assert.doesNotMatch(text, /[\u202A-\u202E\u0000]/);
  // Newest first: the last tx of block 9, then its first, then block 7 (block 8's object title is dropped).
  const lines = [...h.el.querySelectorAll('[data-cs-post]')].map((li) => [li.querySelector('.pcs-by')?.textContent, li.querySelector('.pcs-q')?.textContent]);
  assert.deepEqual(lines[0], ['unnamed · №9', '“proto”']);
  assert.equal(lines[1][0], '<b>x</b> [address] · №9');
  assert.equal(lines[1][1], '“<img src=x onerror="alert(1)"><script>alert(2)</script> gnp.exe send to [address]”', 'shown as literal text');
  assert.deepEqual(lines[2], ['claude · №7', '“garden”']);
  assert.doesNotMatch(text, /object/, 'a non-string title is dropped, not stringified');
  const colours = [...h.el.querySelectorAll('[data-cs-cubes] g[style]')].map((g) => g.style.getPropertyValue('--c'));
  assert.ok(colours.length > 0);
  for (const c of colours) assert.match(c, /^(#185FA5|#0F6E56|var\(--pcs-(bot|sys|tile)\))$/i, c);
  assert.ok(colours.includes('#0F6E56'), 'a PointCast channel keeps its colour');
  assert.equal(h.el.querySelector('[data-cs-nums]').textContent, 'Height 14 · 4 posts shown · 6 accounts · 5 bots');
});

test('unreachable or unexpected devnet: the static state stays, plus a quiet note', async () => {
  const { start, readModel } = await import('../src/lib/chain-strip.mjs');
  const down = harness({ respond: () => new TypeError('Failed to fetch') });
  start(down.el, down.env);
  down.intersect(true);
  await down.runIdle();
  assert.equal(down.el.dataset.state, 'down');
  assert.equal(down.el.querySelector('[data-cs-clock]').textContent, 'devnet unreachable');
  assert.equal(down.el.querySelector('[data-cs-nums]').textContent, '');
  assert.equal(down.el.querySelectorAll('[data-cs-cubes] > g').length, 0);
  assert.equal(down.el.querySelector('[data-cs-svg]').getAttribute('aria-hidden'), 'true');

  // A later failure after a good read goes back to the static state too.
  let online = true;
  const flaky = harness({ respond: (url) => (online ? devnet()(url) : new TypeError('Failed to fetch')) });
  start(flaky.el, flaky.env);
  flaky.intersect(true);
  await flaky.runIdle();
  assert.equal(flaky.el.dataset.state, 'live');
  online = false;
  flaky.advance(60_000);
  flaky.timers.filter((t) => t.live).pop().fn();
  await flaky.runIdle();
  assert.equal(flaky.urls.length, 4);
  assert.equal(flaky.el.dataset.state, 'down');
  assert.equal(flaky.el.querySelector('[data-cs-nums]').textContent, '');
  assert.equal(flaky.el.querySelector('[data-cs-post]').textContent, '');

  const opts = { chainId: CHAIN_ID, genesis: GENESIS };
  assert.throws(() => readModel(status({ network: 'mainnet' }), feed(), opts));
  assert.throws(() => readModel(status({ chain_id: 'other-1' }), feed(), opts));
  assert.throws(() => readModel(status({ height: -1 }), feed(), opts));
  assert.throws(() => readModel(status(), { tip: 'x', blocks: [] }, opts));
  assert.throws(() => readModel(null, feed(), opts));
  assert.equal(readModel(status({ genesis_hash: 'f'.repeat(64) }), feed(), opts).reset, true, 'a reset devnet is said, not hidden');
});

test('the cube window: empty heights are tiles only where the feed proves them empty', async () => {
  const { readModel } = await import('../src/lib/chain-strip.mjs');
  // A full page of 8 non-empty blocks: nothing older than its oldest block is known.
  const full = { tip: 120, blocks: [118, 117, 116, 115, 114, 113, 112, 110].map((height) => ({ height, txs: [post('t')] })) };
  const m = readModel(status({ height: 120 }), full, { slots: 16 });
  assert.equal(m.cells[0].height, 110);
  assert.equal(m.cells.at(-1).height, 120);
  assert.deepEqual(m.cells.filter((c) => !c.count).map((c) => c.height), [111, 119, 120]);
  // A short page holds every non-empty block, so the last `slots` heights are all known.
  const quiet = readModel(status({ height: 500 }), feed({ tip: 500 }), { slots: 16 });
  assert.equal(quiet.cells.length, 16);
  assert.ok(quiet.cells.every((c) => c.count === 0));
  assert.equal(quiet.posts.length, 1, 'the newest post still shows when its block has scrolled out of the row');
});

test('built pages carry the strip with its links and no addresses', { skip: !existsSync(new URL('dist/index.html', root)) }, () => {
  for (const [page, wide] of [['dist/index.html', false], ['dist/chain/index.html', true]]) {
    const doc = new JSDOM(read(page)).window.document;
    const strips = doc.querySelectorAll('[data-chain-strip]');
    assert.equal(strips.length, 1, page);
    const strip = strips[0];
    assert.equal(strip.dataset.state, 'static');
    assert.equal(strip.dataset.variant, wide ? 'wide' : 'home');
    assert.equal(strip.dataset.api, DEVNET_URL);
    assert.match(strip.textContent, /devnet-2 · bot · unmoderated · no value is promised · may reset/);
    assert.match(strip.querySelector('h2').textContent, wide ? /^Town digest$/ : /^PointCast Chain · devnet$/);
    assert.doesNotMatch(strip.outerHTML, ADDRESS, page);
    assert.doesNotMatch(strip.textContent, /\d+ posts? shown|Height \d/, 'no numbers before the browser reads');
    const hrefs = [...strip.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    if (!wide) assert.ok(hrefs.includes('/chain'), page);
    assert.ok(hrefs.includes('/chain/bots'), page);
    const yard = hrefs.find((href) => href.startsWith('/chain/yard/?'));
    assert.ok(yard, page);
    const params = new URL(yard, 'https://pointcast.xyz').searchParams;
    assert.equal(params.get('api'), DEVNET_URL);
    assert.equal(params.get('genesis'), GENESIS);
    assert.equal(params.get('genesis'), strip.dataset.genesis);
  }
});
