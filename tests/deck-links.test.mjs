import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

// /deck and /links read src/data/deck.json. Every internal href must be a
// route in this repo: an Astro page or endpoint in src/pages, or a file in public.
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));
const isFile = (path) => exists(path) && statSync(new URL(path, root)).isFile();
const data = JSON.parse(read('src/data/deck.json'));

export function routeExists(href) {
  const path = href.split(/[?#]/)[0];
  if (!/^\/[A-Za-z0-9._/-]*$/.test(path)) return false;
  const clean = path.replace(/^\/+/, '').replace(/\/$/, '');
  if (!clean) return exists('src/pages/index.astro');
  return [
    `src/pages/${clean}.astro`,
    `src/pages/${clean}/index.astro`,
    `src/pages/${clean}.ts`,
    `src/pages/${clean}/index.ts`,
    `public/${clean}/index.html`,
  ].some(isFile) || (!path.endsWith('/') && isFile(`public/${clean}`));
}

function problems(d) {
  const out = [];
  const outside = new Set(d.outside || []);
  const check = (where, href) => {
    if (!href) out.push(`${where}: missing href`);
    else if (href.startsWith('https://')) { if (!outside.has(href)) out.push(`${where}: ${href} is not on the outside allow list`); }
    else if (!routeExists(href)) out.push(`${where}: ${href} is not a route in this repo`);
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.updated || '')) out.push('updated must be YYYY-MM-DD');
  const ids = new Set();
  if (d.cards.length < 5 || d.cards.length > 7) out.push('the deck needs 5 to 7 cards');
  for (const c of d.cards) {
    if (!/^[a-z][a-z0-9-]*$/.test(c.id) || ids.has(c.id)) out.push(`bad or repeated card id ${c.id}`);
    ids.add(c.id);
    for (const k of ['tag', 'title', 'blurb']) if (!c[k]) out.push(`${c.id}: missing ${k}`);
    if (!c.items?.length || c.items.length > 6) out.push(`${c.id}: 1 to 6 items`);
    for (const it of c.items || []) { if (!it.text) out.push(`${c.id}: item without text`); check(`card ${c.id}`, it.href); }
  }
  if (d.groups.length < 4 || d.groups.length > 6) out.push('/links needs 4 to 6 groups');
  for (const g of d.groups) {
    if (!g.title || !g.links?.length) out.push(`group ${g.title}: needs a title and links`);
    for (const l of g.links || []) { if (!l.text) out.push(`${g.title}: link without text`); check(`group ${g.title}`, l.href); }
  }
  return out;
}

test('every deck card and link points to a route that exists in the repo', () => {
  assert.deepEqual(problems(data), []);
});

test('the checker catches a dead internal link and an unlisted outside link', () => {
  const bad = structuredClone(data);
  bad.cards[0].items[0].href = '/no-such-page-anywhere';
  bad.groups[0].links[0].href = 'https://example.com/';
  assert.equal(problems(bad).length, 2);
  assert.equal(routeExists('/'), true);
  assert.equal(routeExists('/agents.json'), true);
  assert.equal(routeExists('/llms.txt'), true);
  assert.equal(routeExists('/definitely-not-here/'), false);
});

test('/links carries the elsegundo.xyz link and the long /linktree directory', () => {
  const hrefs = data.groups.flatMap((g) => g.links.map((l) => l.href));
  assert.ok(hrefs.includes('https://elsegundo.xyz/'));
  assert.ok(hrefs.includes('/linktree/'));
  assert.ok(hrefs.includes('/deck'));
  assert.equal(exists('public/links/index.html'), false, 'public/links/index.html would collide with src/pages/links.astro');
});

test('the copy has no em dashes', () => {
  const text = JSON.stringify({ cards: data.cards, groups: data.groups });
  assert.ok(!text.includes('—'));
});

test('the deck works without script and the script stays small and quiet', () => {
  const page = read('src/pages/deck.astro');
  assert.match(page, /scroll-snap-type: x mandatory/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /id="deck-prev" class="deck-btn" hidden/);
  assert.match(page, /id="deck-next" class="deck-btn" hidden/);
  assert.match(page, /min-height: 44px/);
  const js = read('public/js/deck.js');
  assert.ok(!/innerHTML|localStorage|sessionStorage|fetch\(|cookie|XMLHttpRequest/.test(js));
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /ArrowRight/);
});
