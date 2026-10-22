import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequestGet, parseOutcome, summarize, keyFor, limiterId, expandV6, monthsBack, PREFIX } from '../functions/api/pmm/stat.ts';

// A KV fake with put metadata and prefix listing, like the real namespace.
function fakeKv() {
  const m = new Map();
  return {
    m, lists: 0,
    async get(k) { return m.has(k) ? m.get(k).v : null; },
    async put(k, v, o = {}) { m.set(k, { v, metadata: o.metadata }); },
    async list({ prefix = '', limit = 1000, cursor } = {}) {
      this.lists++;
      const all = [...m.keys()].filter((k) => k.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0; const page = all.slice(start, start + limit);
      const done = start + limit >= all.length;
      return { keys: page.map((name) => ({ name, metadata: m.get(name).metadata })), list_complete: done, ...(done ? {} : { cursor: String(start + limit) }) };
    },
  };
}
const id = () => crypto.randomUUID();
const run = (extra = {}) => ({ v: 1, outcome: 'run', flow: 'code', via: 'store', path: 'direct', reason: '-', ms: 1200, id: id(), ...extra });
const post = (env, body, headers = {}) => onRequestPost({ env, params: {}, request: new Request('https://pointcast.xyz/api/pmm/stat', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }) });
const get = (env, q = '') => onRequestGet({ env, params: {}, request: new Request('https://pointcast.xyz/api/pmm/stat' + q) });

test('parseOutcome takes only allowlisted values and a v4 uuid', () => {
  assert.ok(parseOutcome(run()));
  assert.ok(parseOutcome(run({ outcome: 'fail', path: 'none', reason: 'timeout', flow: 'paste', via: 'scan' })));
  for (const reason of ['ice', 'abandoned', 'hello']) assert.ok(parseOutcome(run({ outcome: 'fail', path: 'none', reason })), reason);
  for (const bad of [run({ v: 2 }), run({ flow: 'carrier-pigeon' }), run({ via: 'x' }), run({ id: 'not-a-uuid' }), run({ reason: 'ice' }), run({ path: 'none' }),
    run({ outcome: 'fail', path: 'direct', reason: 'ice' }), run({ outcome: 'fail', path: 'none', reason: '-' }), null, 'run', run({ id: 'a:b' })]) {
    assert.equal(parseOutcome(bad), null, JSON.stringify(bad));
  }
  assert.equal(parseOutcome(run({ ms: 9e9 })).ms, 600000, 'ms is clamped');
  assert.equal(parseOutcome(run({ ms: 'slow' })).ms, 0);
});

test('a run from the site is one immutable key with ms in metadata and nothing identifying', async () => {
  const kv = fakeKv(); const body = run();
  const r = await post({ PC_ANALYTICS_KV: kv }, body);
  assert.equal(r.status, 201);
  assert.equal(kv.m.size, 1);
  const [[k, v]] = kv.m;
  assert.match(k, new RegExp(`^${PREFIX}\\d{4}-\\d{2}-\\d{2}:run:code:store:direct:-:${body.id}$`));
  assert.deepEqual(v.metadata, { ms: 1200 });
  assert.equal(v.v, '');
  await post({ PC_ANALYTICS_KV: kv }, body);
  assert.equal(kv.m.size, 1, 'a retry with the same id writes the same key');
});

test('cross-site, DNT, GPC, junk and an unbound store write nothing', async () => {
  const kv = fakeKv(); const env = { PC_ANALYTICS_KV: kv };
  assert.equal((await post(env, run(), { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await post(env, run(), { DNT: '1' })).status, 204);
  assert.equal((await post(env, run(), { 'Sec-GPC': '1' })).status, 204);
  assert.equal((await post(env, run(), { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await post(env, '{nope')).status, 400);
  assert.equal((await post(env, run({ flow: 'x' }))).status, 400);
  assert.equal((await post(env, JSON.stringify({ ...run(), pad: 'x'.repeat(600) }))).status, 413);
  assert.equal(kv.m.size, 0);
  assert.equal((await post({}, run())).status, 503);
});

test('summarize rolls up success rate, goal, flows, paths, reasons and timing', () => {
  const day = '2026-10-22';
  const keys = [
    ...[800, 1200, 2000, 9000].map((ms, i) => ({ name: keyFor(parseOutcome(run({ ms, path: i === 3 ? 'relay' : 'direct', via: i === 2 ? 'scan' : 'store', flow: i === 2 ? 'paste' : 'code' })), day), metadata: { ms } })),
    { name: keyFor(parseOutcome(run({ outcome: 'fail', path: 'none', reason: 'timeout' })), day), metadata: { ms: 30000 } },
    { name: keyFor(parseOutcome(run()), '2026-10-01'), metadata: { ms: 1 } },
  ];
  const s = summarize(keys, '2026-10-16');
  assert.equal(s.attempts, 5); assert.equal(s.run, 4); assert.equal(s.fail, 1);
  assert.equal(s.successRate, 0.8);
  assert.deepEqual(s.goal, { target: 0.9, met: false });
  assert.deepEqual(s.byFlow.paste, { run: 1, fail: 0 });
  assert.deepEqual(s.byVia.scan, { run: 1, fail: 0 });
  assert.deepEqual(s.byPath, { direct: 3, relay: 1, unknown: 0 });
  assert.deepEqual(s.failReasons, { timeout: 1, ice: 0, abandoned: 0, hello: 0 });
  assert.equal(s.medianMs, 2000); assert.equal(s.p90Ms, 9000);
  assert.deepEqual(s.days, [{ day, run: 4, fail: 1 }]);
  assert.equal(summarize([], '2026-10-16').successRate, null);
});

test('GET reports today from posted events and answers 503 when unbound', async () => {
  const kv = fakeKv(); const env = { PC_ANALYTICS_KV: kv };
  for (let i = 0; i < 9; i++) await post(env, run());
  await post(env, run({ outcome: 'fail', path: 'none', reason: 'ice' }));
  const r = await get(env, '?days=1');
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.status, 'available'); assert.equal(j.windowDays, 1);
  assert.equal(j.attempts, 10); assert.equal(j.successRate, 0.9); assert.equal(j.goal.met, true);
  assert.equal(j.truncated, false);
  assert.equal((await get({})).status, 503);
  assert.equal((await (await get(env, '?days=500')).json()).windowDays, 7, 'an out-of-range window falls back to 7');
});

test('the rate limit keys on a salted hash of the address, one bucket per IPv6 /64, never the raw address', async () => {
  const at = (ip, day = '2026-10-22') => limiterId(new Request('https://pointcast.xyz/api/pmm/stat', { headers: { 'CF-Connecting-IP': ip } }), day);
  const a = await at('2001:db8:1:2:aaaa::1'), b = await at('2001:db8:1:2:bbbb::9'), c = await at('2001:db8:1:3::1');
  assert.equal(a, b, 'the same /64 shares a bucket');
  assert.equal(await at('2001:db8::1'), await at('2001:db8::9:2:3:4'), 'a compressed /64 shares a bucket too');
  assert.equal(await at('2001:db8::1'), await at('2001:DB8:0:0:1:2:3:4'));
  assert.notEqual(await at('2001:db8::1'), await at('2001:db8:0:1::1'));
  assert.notEqual(a, c);
  assert.match(a, /^h:[0-9a-f]{16}$/);
  assert.notEqual(await at('203.0.113.7'), await at('203.0.113.8'));
  assert.notEqual(await at('203.0.113.7'), await at('203.0.113.7', '2026-10-23'), 'the salt changes daily');
  const rates = fakeKv(); const kv = fakeKv();
  await onRequestPost({ env: { PC_ANALYTICS_KV: kv, PC_RATES_KV: rates }, params: {}, request: new Request('https://pointcast.xyz/api/pmm/stat', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin', 'CF-Connecting-IP': '203.0.113.7' }, body: JSON.stringify(run()) }) });
  assert.equal(kv.m.size, 1);
  assert.equal(rates.m.size, 1, 'the limiter wrote its counter');
  assert.match([...rates.m.keys()][0], /^rl:pmm:stat:h:[0-9a-f]{16}:\d+$/, 'the limiter key is the hash, not the address');
});

test('GET lists the whole prefix once while it is small, and day by day newest first only past the cap', async () => {
  const kv = fakeKv(); const env = { PC_ANALYTICS_KV: kv };
  for (let i = 0; i < 5; i++) await post(env, run());
  kv.lists = 0;
  const j = await (await get(env, '?days=90')).json();
  assert.equal(j.attempts, 5);
  assert.equal(kv.lists, 1, 'one list operation for a small store, whatever the window');
});

test('expandV6 and monthsBack', () => {
  assert.deepEqual(expandV6('2001:db8::1'), ['2001', 'db8', '0', '0', '0', '0', '0', '1']);
  assert.deepEqual(expandV6('::1'), ['0', '0', '0', '0', '0', '0', '0', '1']);
  assert.deepEqual(expandV6('fe80::1%eth0'), ['fe80', '0', '0', '0', '0', '0', '0', '1']);
  assert.deepEqual(expandV6('2001:0DB8:0000:0001:0:0:0:1'), ['2001', 'db8', '0', '1', '0', '0', '0', '1']);
  const at = Date.parse('2026-10-22T12:00:00Z');
  assert.deepEqual(monthsBack(1, at), ['2026-10']);
  assert.deepEqual(monthsBack(90, at), ['2026-10', '2026-09', '2026-08', '2026-07']);
});

test('one edge-cached snapshot serves every window; the response is cacheable for a minute', async () => {
  const store = new Map();
  globalThis.caches = { default: { async match(r) { const v = store.get(r.url); return v ? v.clone() : undefined; }, async put(r, res) { store.set(r.url, res); } } };
  try {
    const kv = fakeKv(); const env = { PC_ANALYTICS_KV: kv };
    for (let i = 0; i < 4; i++) await post(env, run());
    kv.lists = 0;
    const r1 = await get(env, '?days=1');
    assert.equal(r1.headers.get('Cache-Control'), 'public, max-age=60');
    await new Promise((r) => setTimeout(r, 0));
    for (const d of [7, 30, 90, 2, 3]) assert.equal((await (await get(env, '?days=' + d)).json()).attempts, 4);
    assert.equal(kv.lists, 1, 'six windows, one listing');
    assert.equal(store.size, 1);
  } finally { delete globalThis.caches; }
});

test('past the cap, listing goes month by month newest first and says it was truncated', async () => {
  const kv = fakeKv(); const env = { PC_ANALYTICS_KV: kv };
  const old = new Date(Date.now() - 60 * 86400_000).toISOString().slice(0, 10);
  for (let i = 0; i < 10_001; i++) kv.m.set(keyFor(parseOutcome(run()), old), { v: '', metadata: { ms: 5 } });
  for (let i = 0; i < 3; i++) await post(env, run());
  const j = await (await get(env, '?days=7')).json();
  assert.equal(j.attempts, 3, 'today survives the cap');
  assert.equal(j.truncated, true, 'the old month did not fit');
});
