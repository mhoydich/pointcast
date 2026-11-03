import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { DOORS, DOOR_SLUGS, doorJsonLd, doorManifest } from '../src/lib/ten-doors.mjs';
import { DETAILS } from '../src/lib/ten-doors/details.mjs';
import {
  FORTUNES, meterFortune, meterWindow, sunsetFor, townDay, addDays,
  routeDay, shortestTour, blockedFor, tidePool, SPECIES, ROUTE_SIZE, POOL_SPACING,
} from '../src/lib/ten-doors/daily.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');

test('ten doors, unique slugs, each with a page and a JSON twin', () => {
  assert.equal(DOORS.length, 10);
  assert.equal(new Set(DOOR_SLUGS).size, 10);
  for (const slug of [...DOOR_SLUGS, 'ten-doors']) {
    assert.ok(existsSync(new URL(`src/pages/${slug}.astro`, root)), `${slug}.astro`);
    assert.ok(existsSync(new URL(`src/pages/${slug}.json.ts`, root)), `${slug}.json.ts`);
  }
  for (const door of DOORS) {
    assert.ok(door.pitch.length > 40 && door.how.length >= 3, door.slug);
    assert.match(door.color, /^#[0-9a-f]{6}$/i);
    const ld = doorJsonLd(door.slug);
    assert.equal(ld['@graph'][0].url, `https://pointcast.xyz/${door.slug}`);
    const m = doorManifest(door.slug, DETAILS[door.slug]);
    assert.equal(m.links.siblings.length, 9);
  }
});

test('every door is wired into the agent manifest, sitemap, llms files and for-agents', async () => {
  const [agents, sitemap, llms, llmsFull, forAgents] = await Promise.all([
    read('src/pages/agents.json.ts'), read('src/pages/sitemap-discovery.xml.ts'), read('public/llms.txt'), read('public/llms-full.txt'), read('src/pages/for-agents.astro'),
  ]);
  for (const slug of [...DOOR_SLUGS, 'ten-doors']) {
    assert.ok(agents.includes(`'https://pointcast.xyz/${slug}'`), `agents human ${slug}`);
    assert.ok(agents.includes(`'https://pointcast.xyz/${slug}.json'`), `agents json ${slug}`);
    assert.ok(sitemap.includes(`['https://pointcast.xyz/${slug}', `), `sitemap ${slug}`);
    assert.ok(llms.includes(`https://pointcast.xyz/${slug}`), `llms ${slug}`);
    assert.ok(llmsFull.includes(`https://pointcast.xyz/${slug}`), `llms-full ${slug}`);
  }
  assert.match(forAgents, /<code>\/ten-doors<\/code>/);
  assert.equal(llms.split('\n').filter((l) => l.includes('pointcast.xyz/ten-doors)')).length, 1, 'one line in llms.txt');
});

test('the front door strip names the hub', async () => {
  const items = JSON.parse(await read('src/data/new-today.json'));
  assert.ok(items.some((i) => i.link === '/ten-doors'));
});

test('meter oracle: one fortune per 15-minute window, same input same answer, no repeat back to back', () => {
  const at = new Date('2026-11-02T18:07:00Z');
  const a = meterFortune(at);
  assert.deepEqual(a, meterFortune(new Date('2026-11-02T18:14:59Z')));
  assert.equal(meterWindow(at).start.toISOString(), '2026-11-02T18:00:00.000Z');
  assert.ok(FORTUNES.includes(a.fortune));
  // A full year of windows, one after another.
  let prev = meterFortune(new Date(Date.UTC(2026, 10, 2)));
  for (let i = 1; i < 96 * 366; i += 1) {
    const next = meterFortune(new Date(Date.UTC(2026, 10, 2) + i * 900000));
    assert.notEqual(next.fortune, prev.fortune, `repeat at window ${next.window}`);
    prev = next;
  }
});

test('green flash: computed sunsets land where El Segundo sunsets are', () => {
  const pacificMinutes = (d) => {
    const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hour12: false }).format(d).split(':').map(Number);
    return h * 60 + m;
  };
  // Known Los Angeles sunsets: Jun 21 about 8:08 PM PDT, Dec 21 about 4:47 PM PST, Nov 2 about 5:00 PM PST.
  assert.ok(Math.abs(pacificMinutes(sunsetFor('2026-06-21')) - (20 * 60 + 8)) <= 4);
  assert.ok(Math.abs(pacificMinutes(sunsetFor('2026-12-21')) - (16 * 60 + 47)) <= 4);
  assert.ok(Math.abs(pacificMinutes(sunsetFor('2026-11-02')) - (17 * 60)) <= 4);
  assert.equal(townDay(new Date('2026-11-03T06:30:00Z')), '2026-11-02');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('ice cream route: every round of 30 days is solvable inside the jingle, with every corner reachable', () => {
  for (let i = 0; i < 30; i += 1) {
    const plan = routeDay(addDays('2026-11-02', i));
    assert.equal(plan.rounds.length, 3);
    for (const round of plan.rounds) {
      const best = shortestTour(round.start, round.kids, blockedFor(round));
      assert.equal(best, round.best);
      assert.ok(Number.isFinite(best) && round.jingle > best);
      assert.ok(round.kids.every((k) => k >= 0 && k < ROUTE_SIZE * ROUTE_SIZE && k !== round.start));
    }
  }
  assert.deepEqual(routeDay('2026-11-02'), routeDay('2026-11-02'), 'same day, same map');
});

test('tide pool census: counts match the creatures and stay in range', () => {
  for (let i = 0; i < 366; i += 1) {
    const pool = tidePool(addDays('2026-11-02', i));
    for (const sp of SPECIES) {
      const n = pool.creatures.filter((c) => c.species === sp.id).length;
      assert.equal(n, pool.counts[sp.id]);
      assert.ok(n >= sp.min && n <= sp.max);
    }
    assert.ok(pool.creatures.every((c) => c.x > 0 && c.x < 1 && c.y > 0 && c.y < 1));
    pool.creatures.forEach((a, j) => pool.creatures.slice(j + 1).forEach((b) => {
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= POOL_SPACING, `${pool.day}: two creatures overlap`);
    }));
  }
});

test('pelican post never sends or stores the words', async () => {
  const page = await read('src/pages/pelican-post.astro') + await read('src/lib/ten-doors/pelican-post.mjs');
  assert.doesNotMatch(page, /fetch\(|sendBeacon|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(page, /save\([^)]*text\.value/);
});

test('no door touches wallets, tokens or payments', async () => {
  for (const slug of DOOR_SLUGS) {
    const page = await read(`src/pages/${slug}.astro`);
    assert.doesNotMatch(page, /taquito|beacon-sdk|wallet|x402|mint\(/i, slug);
  }
});
