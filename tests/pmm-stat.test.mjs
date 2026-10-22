import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequestGet, parseOutcome, summarize, keyFor, PREFIX } from '../functions/api/pmm/stat.ts';

// A KV fake with put metadata and prefix listing, like the real namespace.
function fakeKv() {
  const m = new Map();
  return {
    m,
    async put(k, v, o = {}) { m.set(k, { v, metadata: o.metadata }); },
    async list({ prefix = '', limit = 1000, cursor } = {}) {
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
  assert.deepEqual(s.failReasons, { timeout: 1, ice: 0 });
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
