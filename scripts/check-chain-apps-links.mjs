// Dead-link crawl for the seven chain apps, the /chain hub and block 0721, over a built site (dist/):
//
//   node scripts/check-chain-apps-links.mjs [--dist dist] [--devnet-get]
//
// For each page it collects every a[href], img[src], script[src] and source[src] in the page's own content
// (the .chn column, or the block's main), plus the link[href] and script[src] it loads from <head>, and
// checks them without leaving the build:
//   - a link to this site (a path, or https://pointcast.xyz/...) must resolve to a file in dist/
//     (a path with an extension is a file; any other is a folder with index.html), or be a route
//     that public/_redirects or functions/ serves; a #fragment must be an id in the target page;
//   - the JavaScript the apps load (/chain/apps/*.js and what they import) must exist in dist/;
//   - a link to the devnet is a GET read when --devnet-get is given (POST-only routes are listed
//     as such and not fetched: /mcp, /bot/post, /bot/duty, /tx, /tx/digest, /tx/simulate, /body,
//     /daily/faucet, /daily/ring, /nm/claim, /admin);
//   - any other site is listed and not fetched.
// Prints one line per problem and a summary; exit status 1 if anything is dead.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const dist = new URL('../' + opt('--dist', 'dist') + '/', import.meta.url);
const root = new URL('../', import.meta.url);
const DEVNET = 'https://pointcast-devnet.mhoydich.workers.dev';
const POST_ONLY = /^\/(mcp|bot\/post|bot\/duty|tx|tx\/digest|tx\/simulate|body|daily\/faucet|daily\/ring|nm\/claim|admin)(\/|$)/;
const PAGES = ['chain/index.html', 'chain/observatory/index.html', 'chain/daily-mint/index.html', 'chain/notary/index.html', 'chain/capsules/index.html', 'chain/verify-a-block/index.html', 'chain/playground/index.html', 'chain/bloom/index.html', 'b/0721/index.html'];

const redirects = existsSync(new URL('public/_redirects', root)) ? readFileSync(new URL('public/_redirects', root), 'utf8').split('\n').map((l) => l.trim().split(/\s+/)[0]).filter((p) => p.startsWith('/')) : [];
const redirected = (path) => redirects.some((r) => r === path || r === path.replace(/\/$/, '') || (r.endsWith('*') && path.startsWith(r.slice(0, -1))) || (r.includes(':') && new RegExp('^' + r.replace(/:[a-z]+/g, '[^/]+').replace(/\*/g, '.*') + '$').test(path)));
const fnRoutes = (() => { try { return readFileSync(new URL('functions/_middleware.ts', root), 'utf8'); } catch { return ''; } })();

let dead = 0;
let checked = 0;
const notFetched = new Set();
const post = new Set();
const say = (s) => console.log(s);
const bad = (page, what, why) => { dead += 1; say('DEAD ' + page + ' → ' + what + ' (' + why + ')'); };

function fileFor(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0]);
  const direct = new URL('.' + clean, dist);
  if (/\.[a-z0-9]+$/i.test(clean)) return existsSync(direct) && statSync(direct).isFile() ? direct : null;
  const index = new URL('.' + clean.replace(/\/?$/, '/') + 'index.html', dist);
  if (existsSync(index)) return index;
  const html = new URL('.' + clean + '.html', dist);
  return existsSync(html) ? html : null;
}
const htmlCache = new Map();
const ids = (file) => {
  const k = file.href;
  if (!htmlCache.has(k)) htmlCache.set(k, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return htmlCache.get(k);
};

function checkInternal(page, raw, pathname, hash) {
  checked += 1;
  const f = fileFor(pathname);
  if (!f) { if (!redirected(pathname) && !fnRoutes.includes(pathname.replace(/\/$/, ''))) bad(page, raw, 'no file in dist for ' + pathname); return; }
  if (hash && f.pathname.endsWith('.html') && hash.length > 1) {
    const id = decodeURIComponent(hash.slice(1));
    // client-side fragments (#b=3318, #cp-12, #x=1) are state, not anchors
    if (/^[a-z]+[=-]/i.test(id) && !ids(f).has(id)) return;
    if (!ids(f).has(id)) bad(page, raw, 'no #' + id + ' in ' + pathname);
  }
}

async function crawl(page) {
  const file = new URL(page, dist);
  if (!existsSync(file)) { bad(page, '(the page itself)', 'not in dist: run npm run build:bare'); return; }
  const doc = new JSDOM(readFileSync(file, 'utf8')).window.document;
  const base = 'https://pointcast.xyz/' + page.replace(/index\.html$/, '');
  // The page's own content (the .chn column, or the block's main) and what it loads from <head>. The site-wide
  // dock and footer are the same on every page of the site and are not this change's to crawl.
  const scope = doc.querySelector('.chn') || doc.querySelector('main') || doc.body;
  const refs = [...scope.querySelectorAll('a[href], img[src], source[src], source[srcset], script[src]'), ...doc.head.querySelectorAll('link[href], script[src]')].map((el) => el.getAttribute('href') || el.getAttribute('src') || (el.getAttribute('srcset') || '').split(' ')[0]).filter(Boolean);
  for (const raw of refs) {
    if (/^(mailto:|tel:|data:|blob:|#)/.test(raw)) { if (raw === '#') bad(page, raw, 'an empty fragment link'); else if (raw.startsWith('#')) { checked += 1; if (!ids(file).has(raw.slice(1)) && !/^[a-z]+[=-]/i.test(raw.slice(1))) bad(page, raw, 'no such id on this page'); } continue; }
    if (/^javascript:/i.test(raw)) { bad(page, raw, 'a javascript: link'); continue; }
    let u;
    try { u = new URL(raw, base); } catch { bad(page, raw, 'not a URL'); continue; }
    if (u.origin === 'https://pointcast.xyz') { checkInternal(page, raw, u.pathname, u.hash); continue; }
    if (u.origin === DEVNET) {
      if (POST_ONLY.test(u.pathname)) { post.add(u.pathname); continue; }
      if (args.includes('--devnet-get')) {
        checked += 1;
        try { const r = await fetch(u, { signal: AbortSignal.timeout(8000) }); if (r.status >= 400 && r.status !== 429) bad(page, raw, 'the devnet answers ' + r.status); } catch (e) { bad(page, raw, 'the devnet did not answer: ' + e.message); }
      } else notFetched.add(u.origin + u.pathname);
      continue;
    }
    notFetched.add(u.origin);
  }
}

/** The JS the apps load: every static import of a file under public/chain/apps resolves to a file in dist. */
function checkImports() {
  const seen = new Set();
  const queue = ['chain/apps/observatory-view.js', 'chain/apps/daily-mint-view.js', 'chain/apps/notary-view.js', 'chain/apps/capsules-view.js', 'chain/apps/verify-view.js', 'chain/apps/playground.js', 'chain/apps/bloom-view.js'];
  while (queue.length) {
    const rel = queue.pop();
    if (seen.has(rel)) continue;
    seen.add(rel);
    const f = new URL(rel, dist);
    checked += 1;
    if (!existsSync(f)) { bad('(imports)', '/' + rel, 'not in dist'); continue; }
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(/(?:^|\n)\s*(?:import|export)[^'"\n]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const spec = m[1] || m[2];
      if (!spec || !spec.startsWith('.')) continue;
      const target = join('/', rel, '..', spec).replace(/^\//, '');
      queue.push(target);
    }
  }
  say('imports: ' + seen.size + ' files under dist/ reached from the seven apps, all present');
}

for (const p of PAGES) { say('page ' + p); await crawl(p); }
checkImports();
say('');
say('checked ' + checked + ' links and files · dead: ' + dead);
if (post.size) say('POST-only routes linked, not fetched: ' + [...post].join(', '));
if (notFetched.size) say('other sites linked, not fetched: ' + [...notFetched].slice(0, 12).join(', ') + (notFetched.size > 12 ? ' … (' + notFetched.size + ')' : ''));
process.exit(dead ? 1 : 0);
