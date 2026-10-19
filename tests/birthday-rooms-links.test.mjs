import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Birthday wing link guard.
//
// On 2026-05-02 four birthday rooms (/wish, /decades, /year, /parties) were
// drafted and then lost in a branch rebase before they were ever committed
// (block 0424 records this). /sing kept linking to them for five months.
// This test keeps every internal link in the birthday wing pointed at a
// route that exists in src/pages, and keeps the /cake rooms register in
// step with the rooms that are actually live.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relPath) => readFileSync(join(ROOT, relPath), 'utf8');

const WING = [
  'src/pages/cake.astro',
  'src/pages/cake/register.astro',
  'src/pages/sing.astro',
  'src/pages/blow.astro',
  'src/pages/card.astro',
  'src/pages/wrapped.astro',
];

// The rooms /cake#rooms must list, one entry each. /cake itself is the
// register, so it is not in its own list.
const ROOMS = [
  '/cake/register',
  '/sing',
  '/blow',
  '/card',
  '/wrapped',
  '/drum-birthday',
  '/drum-cake',
  '/drum-card',
  '/drum-party',
];

const LOST_ROUTES = ['/parties', '/wish', '/decades', '/year'];

const HREF_RE = /href="(\/[^"#?]*)(?:[#?][^"]*)?"/g;

function internalHrefs(source) {
  const out = new Set();
  for (const m of source.matchAll(HREF_RE)) {
    // Skip client-side template hrefs (dynamic routes such as /cake/${handle}).
    if (m[1].includes('${') || m[1].includes('{')) continue;
    out.add(m[1]);
  }
  return [...out];
}

// A static href resolves when some file in src/pages (or public/) would
// serve it. /api/* is served by functions/ and is out of scope here.
function routeExists(path) {
  if (path === '/') return existsSync(join(ROOT, 'src/pages/index.astro'));
  if (path.startsWith('/api/')) return true;
  const bare = path.replace(/\/$/, '');
  const candidates = [
    `src/pages${bare}.astro`,
    `src/pages${bare}/index.astro`,
    `src/pages${bare}.ts`,
    `src/pages${bare}.md`,
    `src/pages${bare}.mdx`,
    `public${bare}`,
    `public${bare}/index.html`,
  ];
  return candidates.some((rel) => existsSync(join(ROOT, rel)));
}

test('birthday wing: every internal href resolves to a route in src/pages', () => {
  for (const rel of WING) {
    const source = read(rel);
    for (const href of internalHrefs(source)) {
      assert.ok(routeExists(href), `${rel} links to ${href}, which has no route in src/pages or public/`);
    }
  }
});

test('/sing no longer links to the four rooms lost in the 2026-05-02 rebase', () => {
  const source = read('src/pages/sing.astro');
  for (const route of LOST_ROUTES) {
    assert.doesNotMatch(source, new RegExp(`href="${route}["#?/]`), `/sing still links to ${route}`);
  }
});

test('/sing points at the /cake rooms register and names its live siblings', () => {
  const source = read('src/pages/sing.astro');
  assert.match(source, /href="\/cake#rooms"/, '/sing should send "all birthday rooms" to /cake#rooms');
  for (const route of ['/blow', '/card', '/wrapped']) {
    assert.match(source, new RegExp(`href="${route}"`), `/sing should link its live sibling ${route}`);
  }
});

test('/cake rooms register lists every live birthday room exactly once', () => {
  const source = read('src/pages/cake.astro');
  assert.match(source, /<section class="section section--rooms" id="rooms">/, '/cake must carry the #rooms section');
  const start = source.indexOf('<ul class="rooms-list">');
  const end = source.indexOf('</ul>', start);
  const section = source.slice(start, end);
  for (const route of ROOMS) {
    const hits = section.match(new RegExp(`href="${route}"`, 'g')) ?? [];
    assert.equal(hits.length, 1, `/cake#rooms should list ${route} exactly once (found ${hits.length})`);
    assert.ok(routeExists(route), `/cake#rooms lists ${route}, which has no route in src/pages`);
  }
  for (const route of LOST_ROUTES) {
    assert.doesNotMatch(section, new RegExp(`href="${route}["#?/]`), `/cake#rooms must not advertise the unbuilt ${route}`);
  }
});

test('/cake rooms register copy is honest about the count', () => {
  const source = read('src/pages/cake.astro');
  // Nine rooms besides /cake itself: five web (register, sing, blow, card,
  // wrapped), four drum. The lede says so in words; keep it in step.
  assert.match(source, /Five on the web side, four in the\s+drum house/, 'rooms lede should state the real 5 + 4 split');
  assert.equal(ROOMS.length, 9);
});
