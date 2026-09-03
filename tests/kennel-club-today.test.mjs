/**
 * Today is decided at request time, not at build time.
 *
 * The bug this guards: PointCast prerenders and deploys by hand, so every
 * surface that resolved "today's sitting" while Astro was building went stale
 * at midnight Pacific. On 2026-09-03 /api/kennel-club/mint said token 2
 * (Marguerite) while /collect and /collect.json still said Hartley.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));

async function viteServer() {
  const { createServer } = await import('vite');
  return createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
}

/** The smallest DOM that applyKennelToday needs. No jsdom in devDependencies. */
class FakeNode {
  constructor(attributes = {}) {
    this.attributes = { ...attributes };
    this.textContent = null;
    this.hidden = false;
    this.dataset = new Proxy(this, {
      get: (node, key) => node.attributes[FakeNode.attributeName(key)],
      set: (node, key, value) => {
        node.attributes[FakeNode.attributeName(key)] = value;
        return true;
      },
      has: (node, key) => FakeNode.attributeName(key) in node.attributes,
      deleteProperty: (node, key) => {
        delete node.attributes[FakeNode.attributeName(key)];
        return true;
      },
    });
  }
  static attributeName(key) {
    return `data-${String(key).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
  }
  getAttribute(name) {
    return name in this.attributes ? this.attributes[name] : null;
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
}

class FakeRoot {
  constructor(nodes) { this.nodes = nodes; }
  querySelectorAll(selector) {
    assert.equal(selector, '[data-kennel-today]');
    return this.nodes.filter((node) => 'data-kennel-today' in node.attributes);
  }
}

test('the shared today payload resolves the sitting from the Los Angeles clock', async () => {
  const server = await viteServer();
  try {
    const { kennelTodayPayload } = await server.ssrLoadModule('/src/lib/kennel-today.ts');

    // 2026-09-03 16:00 UTC is still 09-03 in Los Angeles.
    const third = kennelTodayPayload({ now: new Date('2026-09-03T16:00:00Z') });
    assert.equal(third.date, '2026-09-03');
    assert.equal(third.day, 3);
    assert.equal(third.tokenId, 2);
    assert.equal(third.slug, '03-marguerite');
    assert.equal(third.name, 'Marguerite');
    assert.equal(third.href, '/kennel-club/03-marguerite');
    assert.equal(third.inSeason, true);

    // 2026-09-04 06:00 UTC is 09-03 23:00 in Los Angeles — still Marguerite.
    assert.equal(kennelTodayPayload({ now: new Date('2026-09-04T06:00:00Z') }).slug, '03-marguerite');
    // One hour later the day has turned and the answer moves with no deploy.
    assert.equal(kennelTodayPayload({ now: new Date('2026-09-04T07:30:00Z') }).slug, '04-barnaby');
    assert.equal(kennelTodayPayload({ now: new Date('2026-09-02T18:00:00Z') }).name, 'Hartley');
  } finally {
    await server.close();
  }
});

test('/api/kennel-club/today returns the token for the requested date with a 60 s shared cache', async () => {
  const server = await viteServer();
  const originalFetch = globalThis.fetch;
  try {
    const { onRequestGet } = await server.ssrLoadModule('/functions/api/kennel-club/today.ts');
    const { losAngelesDate, sittingOfTheDay } = await server.ssrLoadModule('/src/lib/kennel-club.ts');
    const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
    globalThis.fetch = async (url) => {
      const text = String(url);
      if (text.endsWith('/storage')) return response({ paused: false, price_mutez: '1000000', edition_mode: 'open', supply: 91, windows: 92 });
      if (text.includes('/bigmaps/91/')) return response([{ key: 0, value: '3' }, { key: 2, value: '11' }]);
      if (text.includes('/bigmaps/92/')) return response([{ value: { open_at: '2026-09-01T07:00:00Z', close_at: '2026-10-01T07:00:00Z' } }]);
      throw new Error(`unexpected TzKT URL: ${text}`);
    };
    const result = await onRequestGet({ request: new Request('https://pointcast.xyz/api/kennel-club/today'), env: {} });
    const payload = await result.json();

    // The expectation is computed from the clock, exactly like the handler:
    // a build-time answer could never agree with this on a stale deploy.
    const expected = sittingOfTheDay(losAngelesDate());
    assert.equal(payload.spec, 'pointcast.kennel-club-today/v1');
    assert.equal(payload.tokenId, expected.tokenId);
    assert.equal(payload.slug, expected.slug);
    assert.equal(payload.day, expected.day);
    assert.equal(payload.name, expected.name);
    assert.equal(payload.live, true);
    assert.equal(payload.windowOpen, true);
    assert.equal(typeof payload.minted, 'number');
    assert.equal(result.headers.get('cache-control'), 'public, max-age=60, s-maxage=60');
    assert.equal(result.headers.get('access-control-allow-origin'), '*');
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }
});

test('a page built yesterday shows today’s sitting after hydration', async () => {
  const server = await viteServer();
  try {
    const { applyKennelToday } = await server.ssrLoadModule('/src/lib/kennel-today-client.ts');
    const { kennelTodayPayload } = await server.ssrLoadModule('/src/lib/kennel-today.ts');

    // Everything below is what the build emitted on 2026-09-02: Hartley,
    // token 1, day 2. Nothing has been deployed since.
    const plate = new FakeNode({ 'data-kennel-today': 'image', src: '/images/kennel-club/september-sitting/02-hartley.webp', alt: 'Hartley' });
    const caption = new FakeNode({ 'data-kennel-today': 'text', 'data-kennel-text': 'Sitting {day} · {date} · America/Los_Angeles' });
    const name = new FakeNode({ 'data-kennel-today': 'text', 'data-kennel-text': '{name}' });
    const kicker = new FakeNode({ 'data-kennel-today': 'text', 'data-kennel-text': 'Today · token {tokenId}' });
    const open = new FakeNode({ 'data-kennel-today': 'href text', 'data-kennel-href': '/kennel-club/{slug}', 'data-kennel-text': 'Open {name}’s full sitting →', href: '/kennel-club/02-hartley' });
    const claimDesk = new FakeNode({ 'data-kennel-today': 'token', 'data-token-id': '1', 'data-sitting': 'Hartley' });
    const plateButton = new FakeNode({ 'data-token-id': '1' }); // no hook: a per-plate mint, left alone
    const yesterdayCell = new FakeNode({ 'data-kennel-today': 'cell', 'data-kennel-day': '2', 'data-sitting-status': 'today' });
    const todayCell = new FakeNode({ 'data-kennel-today': 'cell', 'data-kennel-day': '3', 'data-sitting-status': 'future' });
    const tomorrowCell = new FakeNode({ 'data-kennel-today': 'cell', 'data-kennel-day': '4', 'data-sitting-status': 'future' });
    const ringOnHartley = new FakeNode({ 'data-kennel-today': 'badge', 'data-kennel-day': '2' });
    const ringOnMarguerite = new FakeNode({ 'data-kennel-today': 'badge', 'data-kennel-day': '3' });
    const desk = new FakeNode({ 'data-kennel-today': 'attr', 'data-kennel-attr': 'data-today-token', 'data-kennel-value': '{tokenId}', 'data-today-token': '1' });
    const nodes = [plate, caption, name, kicker, open, claimDesk, plateButton, yesterdayCell, todayCell, tomorrowCell, ringOnHartley, ringOnMarguerite, desk];

    const today = kennelTodayPayload({ now: new Date('2026-09-03T16:00:00Z'), minted: 11, claimsRemaining: 39, windowOpen: true, live: true });
    const touched = applyKennelToday(new FakeRoot(nodes), today);
    assert.equal(touched, nodes.length - 1, 'every hooked node, and only those');

    assert.equal(plate.getAttribute('src'), '/images/kennel-club/september-sitting/03-marguerite.webp');
    assert.match(plate.getAttribute('alt'), /Marguerite/);
    assert.equal(caption.textContent, 'Sitting 03 · 2026-09-03 · America/Los_Angeles');
    assert.equal(name.textContent, 'Marguerite');
    assert.equal(kicker.textContent, 'Today · token 2');
    assert.equal(open.getAttribute('href'), '/kennel-club/03-marguerite');
    assert.equal(open.textContent, 'Open Marguerite’s full sitting →');

    // The claim desk and the mint button reject a live payload whose token id
    // does not match their own, so this attribute is the whole fix for them.
    assert.equal(claimDesk.getAttribute('data-token-id'), '2');
    assert.equal(claimDesk.getAttribute('data-sitting'), 'Marguerite');
    assert.equal(plateButton.getAttribute('data-token-id'), '1', 'a per-plate mint keeps its own token');
    assert.equal(desk.getAttribute('data-today-token'), '2');

    assert.equal(yesterdayCell.getAttribute('data-sitting-status'), 'past');
    assert.equal(todayCell.getAttribute('data-sitting-status'), 'today');
    assert.equal(tomorrowCell.getAttribute('data-sitting-status'), 'future');
    assert.equal(ringOnHartley.hidden, true);
    assert.equal(ringOnMarguerite.hidden, false);

    for (const node of nodes.filter((candidate) => candidate !== plateButton)) {
      assert.equal(node.getAttribute('data-sitting-day'), '3');
    }
    assert.equal(plateButton.getAttribute('data-sitting-day'), null);
  } finally {
    await server.close();
  }
});

test('the JSON twins that carry today are Pages Functions, not prerendered files', async () => {
  assert.ok(exists('functions/kennel-club.json.ts'), '/kennel-club.json is a Function');
  assert.ok(exists('functions/collect.json.ts'), '/collect.json is a Function');
  // A built static file at the same path would shadow the Function in Pages.
  assert.ok(!exists('src/pages/kennel-club.json.ts'), 'no prerendered kennel-club.json twin');
  assert.ok(!exists('src/pages/collect.json.ts'), 'no prerendered collect.json twin');
  assert.ok(!exists('dist/kennel-club.json'), 'the build must not emit a shadowing kennel-club.json');
  assert.ok(!exists('dist/collect.json'), 'the build must not emit a shadowing collect.json');

  const [calendar, collect] = await Promise.all([
    read('functions/kennel-club.json.ts'),
    read('functions/collect.json.ts'),
  ]);
  for (const source of [calendar, collect]) {
    assert.match(source, /resolvedAt: 'request'/);
    assert.match(source, /public, max-age=60, s-maxage=60/);
  }
  assert.match(calendar, /losAngelesDate\(\)/);
  assert.match(collect, /collectSitting\(\)/);
});

test('Pages headers detach the today API and both live twins from the site-wide no-store', async () => {
  const headers = await read('public/_headers');
  for (const route of ['/api/kennel-club/today', '/kennel-club.json', '/collect.json']) {
    const block = headers.split(`\n${route}\n`)[1];
    assert.ok(block, `${route} has a _headers block`);
    const lines = block.split('\n').slice(0, 2).map((line) => line.trim());
    assert.equal(lines[0], '! Cache-Control', `${route} detaches the inherited rule first`);
    assert.equal(lines[1], 'Cache-Control: public, max-age=60, s-maxage=60', `${route} sets its own cache`);
  }
});

test('every prerendered Kennel Club surface ships the request-time hydration hooks', async () => {
  const surfaces = {
    'src/pages/kennel-club.astro': ['data-kennel-today="image"', 'data-kennel-text="Today · token {tokenId}"'],
    'src/pages/collect.astro': ['data-kennel-today="cell"', 'data-kennel-attr="data-today-token"'],
    'src/pages/kennel-club/[slug].astro': ['data-kennel-today="badge"'],
    'src/pages/send/kennel-club.astro': ['data-kennel-today="text href"'],
    'src/components/HomeRoomsShelf.astro': ['data-kennel-today="text"'],
  };
  for (const [path, hooks] of Object.entries(surfaces)) {
    const source = await read(path);
    assert.ok(source.includes('KennelTodayLive'), `${path} mounts the hydrator`);
    for (const hook of hooks) assert.ok(source.includes(hook), `${path} carries ${hook}`);
  }

  // The DOM contract: data hooks, no ids, and document-level listeners so the
  // page survives ClientRouter transitions.
  const client = await read('src/lib/kennel-today-client.ts');
  assert.match(client, /astro:page-load/);
  assert.match(client, /data-sitting-day/);
  assert.doesNotMatch(client, /getElementById/);

  // The front door only hydrates the room that asked for it.
  const shelf = await read('src/components/HomeRoomsShelf.astro');
  assert.match(shelf, /room\.live === 'kennel'/);
  const home = await read('src/pages/index.astro');
  assert.match(home, /tag: 'KENNEL'[^\n]*live: 'kennel'/);
});

test('a bare /k/today lands on the plate that is sitting right now', async () => {
  const server = await viteServer();
  try {
    const { onRequestGet } = await server.ssrLoadModule('/functions/k/today.ts');
    const { losAngelesDate, sittingOfTheDay } = await server.ssrLoadModule('/src/lib/kennel-club.ts');
    const response = await onRequestGet({
      request: new Request('https://pointcast.xyz/k/today'),
      env: {},
    });
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get('location'),
      `https://pointcast.xyz/kennel-club/${sittingOfTheDay(losAngelesDate()).slug}`,
    );
  } finally {
    await server.close();
  }
});
