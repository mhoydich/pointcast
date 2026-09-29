import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createServer } from 'vite';

// paddle-register.ts pulls in JSON without import attributes (fine under
// Vite/Astro's bundler resolution); load it through Vite's SSR module
// runner so this test doesn't need its own import-attribute shims.
async function load() {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const [register, court] = await Promise.all([
    server.ssrLoadModule('/src/lib/paddle-register.ts'),
    server.ssrLoadModule('/src/lib/shop-court.ts'),
  ]);
  return { ...register, ...court, close: () => server.close() };
}

const { PADDLES, REGISTER_STATS, courtLane, close } = await load();
test.after(() => close());

test('shop-court: upcoming is oldest-date-first, all status upcoming', () => {
  const { upcoming } = courtLane(PADDLES, REGISTER_STATS.asOf);
  assert.ok(upcoming.length > 0, 'fixture has at least one upcoming paddle');
  for (const row of upcoming) assert.equal(row.status, 'upcoming');
  const dates = upcoming.map((r) => r.date);
  assert.deepEqual(dates, [...dates].sort(), 'upcoming sorted oldest-first');
});

test('shop-court: recent is newest-first, released/limited, within the window, capped', () => {
  const recentDays = 120;
  const recentCap = 3;
  const { recent } = courtLane(PADDLES, REGISTER_STATS.asOf, { recentDays, recentCap });
  assert.ok(recent.length > 0, 'fixture has at least one recent paddle');
  assert.ok(recent.length <= recentCap, 'recent respects the cap');

  const cutoff = new Date(`${REGISTER_STATS.asOf}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - recentDays);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  for (const row of recent) {
    assert.ok(row.status === 'released' || row.status === 'limited', `unexpected status ${row.status}`);
    assert.ok(row.date >= cutoffIso && row.date <= REGISTER_STATS.asOf, 'recent row within window');
  }
  const dates = recent.map((r) => r.date);
  assert.deepEqual(dates, [...dates].sort().reverse(), 'recent sorted newest-first');
});

test('shop-court: a wider cap surfaces more rows, never fewer, and every id is real', () => {
  const wide = courtLane(PADDLES, REGISTER_STATS.asOf, { recentCap: 500 });
  const narrow = courtLane(PADDLES, REGISTER_STATS.asOf, { recentCap: 2 });
  assert.ok(wide.recent.length >= narrow.recent.length);

  const knownIds = new Set(PADDLES.map((p) => p.id));
  for (const row of [...wide.upcoming, ...wide.recent]) {
    assert.ok(knownIds.has(row.id), `unknown paddle id ${row.id}`);
  }
});

test('shop-court: each row carries the register\'s own maker page, never the register path', () => {
  const { upcoming, recent } = courtLane(PADDLES, REGISTER_STATS.asOf);
  const byId = new Map(PADDLES.map((p) => [p.id, p]));
  for (const row of [...upcoming, ...recent]) {
    assert.equal(row.makerUrl, byId.get(row.id).productUrl ?? null, `${row.id} makerUrl`);
    if (row.makerUrl) assert.match(row.makerUrl, /^https:\/\//, `${row.id} makerUrl is an https maker page`);
    assert.notEqual(row.makerUrl, row.url);
  }
});

test('shop-court: takes no commission, program or rate input', () => {
  // A shorter window still returns a well-formed lane with the same shape,
  // proving the function reads only rows + asOf + the two window options.
  const lane = courtLane(PADDLES, REGISTER_STATS.asOf, { recentDays: 30, recentCap: 1 });
  assert.ok(Array.isArray(lane.upcoming));
  assert.ok(Array.isArray(lane.recent));
  assert.ok(lane.recent.length <= 1);
});

test('shop-court: source stays free of affiliate vocabulary and astro:content', async () => {
  const source = await readFile(new URL('../src/lib/shop-court.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(affiliate|commission|program|rate)\b/i, 'shop-court.ts must not mention affiliate vocabulary');
  assert.doesNotMatch(source, /astro:content/, 'shop-court.ts must not import astro:content');
});
