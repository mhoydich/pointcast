// Visits to /chain/* are counted and show on the register, and the MCP apps shelf lists the chain
// truthfully. What this suite holds:
//   - every Astro page under /chain mounts the shared beacon, through BlockLayout or directly;
//   - every static page under public/chain/ loads /js/pc-pageview.js, the same path-only beacon,
//     which reports `/chain/yard` (no trailing slash) to this site's /api/analytics and nothing else;
//   - no third-party tracker anywhere in those pages;
//   - scripts/score-projects.mjs scores every /chain page, and /register and /register.json show them;
//   - /apps.json (what MCP apps_list reads) lists the nine apps from the one registry, honestly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { CHAIN_APPS } from '../src/data/chain-apps.ts';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const walk = (dir) => readdirSync(new URL(dir, root)).flatMap((f) => {
  const p = join(dir, f);
  return statSync(new URL(p, root)).isDirectory() ? walk(p) : [p];
});

const ASTRO_PAGES = ['src/pages/chain.astro', ...walk('src/pages/chain').filter((f) => f.endsWith('.astro'))];
const STATIC_PAGES = walk('public/chain').filter((f) => f.endsWith('.html'));
const BEACON = 'public/js/pc-pageview.js';
const TAG = '<script src="/js/pc-pageview.js" defer></script>';
const TRACKERS = /google-analytics|googletagmanager|gtag\(|plausible|segment\.(io|com)|mixpanel|hotjar|clarity\.ms|fullstory|amplitude|posthog|matomo|umami|facebook\.net|connect\.facebook|doubleclick|cloudflareinsights/i;

test('every Astro page under /chain mounts exactly one shared beacon: layout or standalone', () => {
  assert.ok(ASTRO_PAGES.length >= 18, ASTRO_PAGES.length + ' pages');
  for (const f of ASTRO_PAGES) {
    const s = read(f);
    const layouts = [...s.matchAll(/<BlockLayout\b[^>]*>/g)];
    const beacons = [...s.matchAll(/<PageviewBeacon\s*\/>/g)];
    assert.equal(layouts.length + beacons.length, 1, f + ': one shared beacon owner');
    if (layouts.length) {
      assert.match(s, /import BlockLayout from '[./]+layouts\/BlockLayout\.astro';/, f);
      assert.doesNotMatch(layouts[0][0], /\bisolated\b/, f + ' would drop the beacon');
    } else {
      assert.match(s, /import PageviewBeacon from '[./]+components\/PageviewBeacon\.astro';/, f);
    }
  }
  const layout = read('src/layouts/BlockLayout.astro');
  assert.match(layout, /\{!isolated && <PageviewBeacon \/>\}/);
});

test('every static page under public/chain loads the same beacon, once, at the end of the body', () => {
  assert.deepEqual(STATIC_PAGES.sort(), ['public/chain/first-mints/index.html', 'public/chain/mixtape/index.html', 'public/chain/sanctuary/index.html', 'public/chain/yard/index.html']);
  for (const f of STATIC_PAGES) {
    const s = read(f);
    assert.equal(s.split(TAG).length - 1, 1, f);
    assert.ok(s.lastIndexOf(TAG) > s.lastIndexOf('</script>', s.lastIndexOf(TAG) - 1), f + ': after the page’s own scripts');
    assert.ok(s.indexOf(TAG) < s.lastIndexOf('</body>'), f);
    assert.doesNotMatch(s, TRACKERS, f + ': no third-party tracker');
  }
});

test('pc-pageview.js is PageviewBeacon.astro’s code, word for word: path only, first party, no storage', () => {
  const inline = read('src/components/PageviewBeacon.astro').match(/<script is:inline data-astro-rerun>([\s\S]*?)<\/script>/)[1];
  const body = (s) => s.replace(/\/\/[^\n]*\n/g, '\n').replace(/\s+/g, ' ').trim();
  assert.equal(body(read(BEACON)), body(inline));
  const b = read(BEACON);
  assert.deepEqual([...b.matchAll(/['"](\/[a-z/]+|https?:[^'"]+)['"]/g)].map((m) => m[1]), ['/api/analytics', '/api/analytics'], 'one endpoint, on this site');
  assert.doesNotMatch(b.replace(/\/\/[^\n]*\n/g, ''), /document\.referrer|localStorage|sessionStorage|indexedDB|document\.cookie|userAgent\s*:/);
  assert.doesNotMatch(b, TRACKERS);
});

test('the beacon reports /chain/yard from the Block Yard on pointcast.xyz, and nothing from anywhere else', () => {
  const run = (url, ua = 'Mozilla/5.0 (Macintosh)') => {
    const dom = new JSDOM('<!doctype html><body></body>', { url, runScripts: 'outside-only' });
    const sent = [];
    Object.defineProperty(dom.window.navigator, 'userAgent', { value: ua, configurable: true });
    dom.window.navigator.sendBeacon = (to, blob) => { sent.push({ to, blob }); return true; };
    dom.window.Blob = globalThis.Blob; // jsdom's Blob has no text()
    dom.window.eval(read(BEACON));
    return Promise.all(sent.map(async (s) => ({ to: s.to, body: JSON.parse(await s.blob.text()) })));
  };
  return (async () => {
    assert.deepEqual(await run('https://pointcast.xyz/chain/yard/?api=x#lens'), [{ to: '/api/analytics', body: { event: 'pageview', meta: { path: '/chain/yard' } } }]);
    assert.deepEqual(await run('https://pointcast.xyz/chain/first-mints/'), [{ to: '/api/analytics', body: { event: 'pageview', meta: { path: '/chain/first-mints' } } }]);
    assert.deepEqual(await run('http://localhost:4321/chain/yard/'), [], 'never off the site');
    assert.deepEqual(await run('https://pointcast-preview.pages.dev/chain/yard/'), [], 'never on a preview');
    assert.deepEqual(await run('https://pointcast.xyz/chain/yard/', 'Googlebot/2.1'), [], 'never for a bot');
  })();
});

test('the chain’s pages are on the register: every /chain page is scored, and /register shows them with what was not pulled', () => {
  const board = JSON.parse(read('src/data/scoreboard-chain.json'));
  assert.equal(board.kind, 'chain');
  assert.equal(typeof board.useSource.pageviews, 'boolean');
  const paths = new Set(board.rows.map((r) => r.path));
  for (const a of CHAIN_APPS) assert.ok(paths.has(a.href), a.href);
  const leaves = [
    ...ASTRO_PAGES.map((f) => f.replace(/^src\/pages\//, '/').replace(/(\/index)?\.astro$/, '')).filter((p) => !/\[|\/yard\/devnet-1$/.test(p)),
    ...STATIC_PAGES.map((f) => f.replace(/^public/, '/').replace(/\/index\.html$/, '').replace(/^\/\//, '/')),
  ];
  for (const p of leaves) assert.ok(paths.has(p), p + ' is scored');
  for (const r of board.rows) {
    assert.ok(r.path === '/chain' || r.path.startsWith('/chain/'), r.path);
    assert.ok(r.files > 0 && r.loc > 0, r.path + ' found its own source');
    if (!board.useSource.pageviews) assert.equal(r.use, null, r.path + ': no use invented when pageviews were not pulled');
  }
  const reg = read('src/pages/register.astro');
  assert.match(reg, /import chainBoard from '\.\.\/data\/scoreboard-chain\.json';/);
  assert.match(reg, /id="chain"/);
  assert.match(reg, /house activity is the chain checking itself, not/);
  assert.match(reg, /This snapshot was scored from the repo alone, so use is blank until the next pageview pull\./);
  const json = read('src/pages/register.json.ts');
  assert.match(json, /chain: \{\n\s+generatedAt: chainBoard\.generatedAt/);
  assert.match(json, /pageviewsPulled: chainBoard\.useSource\.pageviews/);
  // score-projects knows the chain, and score-live can refresh counters without a token
  const sp = read('scripts/score-projects.mjs');
  assert.match(sp, /--kind chain/);
  assert.match(sp, /src\/data\/chain-apps\.ts/);
  const sl = read('scripts/score-live.mjs');
  assert.match(sl, /const tokenFile = COUNTERS_ONLY \? null :/);
  assert.match(sl, /const TOKEN = COUNTERS_ONLY \? null :/);
  assert.match(sl, /live\.chainPageviews = /);
});

test('apps_list reads /apps.json: the chain entry is the public devnet, and the nine apps come from the one registry', async () => {
  const compiled = await build({
    entryPoints: [new URL('src/lib/pointcast-apps.ts', root).pathname],
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
  });
  const { POINTCAST_APPS } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
  const chain = POINTCAST_APPS.find((a) => a.slug === 'chain');
  assert.match(chain.kicker, /PUBLIC DEVNET-2 · NO VALUE · MAY RESET/);
  assert.doesNotMatch(chain.description, /422 recorded blocks|Local build|not a public network/);
  assert.match(chain.description, /house activity is the chain checking itself, not use/);
  for (const a of CHAIN_APPS) {
    const e = POINTCAST_APPS.filter((x) => x.slug === `chain-${a.key}`);
    assert.equal(e.length, 1, a.key);
    assert.equal(e[0].name, a.label);
    assert.equal(e[0].description, a.blurb);
    assert.equal(e[0].path, a.href + '/');
    assert.match(e[0].kicker, a.mode === 'read' ? /READS ONLY/ : /POSTS ONLY ON YOUR CLICK, WITH YOUR KEY/);
    assert.match(e[0].kicker, /DEVNET · NO VALUE · MAY RESET$/);
  }
  assert.equal(new Set(POINTCAST_APPS.map((a) => a.slug)).size, POINTCAST_APPS.length, 'slugs stay unique');
  const banned = /\$\d|\bUSD\b|\binvest|\bprofit|\bearn\b|airdrop|real money|\byield|\bstake\b|\bredeem|\bbacked\b/i;
  for (const a of POINTCAST_APPS.filter((x) => x.slug === 'chain' || x.slug.startsWith('chain-'))) assert.doesNotMatch(a.kicker + ' ' + a.description, banned, a.slug);
  assert.match(read('functions/api/mcp.ts'), /case 'apps_list': \{\n\s+const data = await callJson\(`\$\{base\}\/apps\.json`\);/, 'apps_list still reads /apps.json');
});

const built = new URL('dist/register/index.html', root);
const receiptBuilt = new URL('dist/chain/receipt/index.html', root);
test('built Receipt Desk sets an early referrer policy and its one shared beacon sends a path-only JSON body', { skip: !existsSync(receiptBuilt) && 'no dist/ build' }, async () => {
  const doc = new JSDOM(readFileSync(receiptBuilt, 'utf8')).window.document;
  const policy = doc.querySelectorAll('meta[name="referrer"]');
  assert.equal(policy.length, 1);
  assert.equal(policy[0].getAttribute('content'), 'no-referrer');
  const firstResourceOrPolicy = doc.querySelector('meta[name="referrer"], script, link[href], img[src], iframe[src]');
  assert.equal(firstResourceOrPolicy, policy[0], 'document policy precedes resources and scripts');
  const beacons = [...doc.querySelectorAll('script')].filter((s) => s.textContent.includes('/api/analytics'));
  assert.equal(beacons.length, 1, 'one analytics sender in the compiled page');
  assert.equal(doc.querySelectorAll('script[src="/js/pc-pageview.js"]').length, 0, 'no duplicate external beacon');
  assert.ok(beacons[0].hasAttribute('data-astro-rerun'));
  const shared = read('src/components/PageviewBeacon.astro').match(/<script is:inline data-astro-rerun>([\s\S]*?)<\/script>/)[1];
  assert.equal(beacons[0].textContent.trim(), shared.trim(), 'uses the unchanged shared component');
  const run = async (url, { bot = false, webdriver = false, fallback = false } = {}) => {
    const dom = new JSDOM('<!doctype html><body></body>', { url, runScripts: 'outside-only' });
    const sent = [];
    const { window } = dom;
    window.Blob = globalThis.Blob;
    Object.defineProperty(window.navigator, 'userAgent', { value: bot ? 'Googlebot/2.1' : 'Mozilla/5.0', configurable: true });
    Object.defineProperty(window.navigator, 'webdriver', { value: webdriver, configurable: true });
    window.navigator.sendBeacon = fallback ? undefined : (to, body) => { sent.push({ to, body }); return true; };
    window.fetch = async (to, options) => { sent.push({ to, body: options.body }); return {}; };
    window.eval(beacons[0].textContent);
    const result = await Promise.all(sent.map(async ({ to, body }) => ({ to, body: JSON.parse(typeof body === 'string' ? body : await body.text()) })));
    dom.window.close();
    return result;
  };
  const url = 'https://pointcast.xyz/chain/receipt/?hash=' + 'a'.repeat(64) + '#private-fragment';
  const expected = [{ to: '/api/analytics', body: { event: 'pageview', meta: { path: '/chain/receipt' } } }];
  assert.deepEqual(await run(url), expected, 'JSON body contains one first-party path, without query/hash or identity');
  assert.deepEqual(await run(url, { fallback: true }), expected, 'same payload without sendBeacon');
  assert.deepEqual(await run('http://localhost:4321/chain/receipt/?hash=private'), []);
  assert.deepEqual(await run('https://pointcast-preview.pages.dev/chain/receipt/'), []);
  assert.deepEqual(await run(url, { bot: true }), []);
  assert.deepEqual(await run(url, { webdriver: true }), []);
});

test('built /register: the chain table is there, one row per chain page the main board does not have', { skip: !existsSync(built) && 'no dist/ build' }, () => {
  const doc = new JSDOM(readFileSync(built, 'utf8')).window.document;
  const sec = doc.querySelector('#chain');
  assert.ok(sec);
  const board = JSON.parse(read('src/data/scoreboard-chain.json'));
  const main = JSON.parse(read('src/data/scoreboard.json'));
  const want = board.rows.filter((r) => !main.rows.some((m) => m.path === r.path)).map((r) => r.path);
  assert.deepEqual([...sec.querySelectorAll('tbody td.name small')].map((n) => n.textContent), want);
  const reg = JSON.parse(readFileSync(new URL('dist/register.json', root), 'utf8'));
  assert.deepEqual(reg.chain.rows.map((r) => r.path), want);
  assert.equal(reg.rows.length, main.rows.length, 'the main board is untouched');
});
