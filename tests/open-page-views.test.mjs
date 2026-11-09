import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestGet, getSummary, addBatch, cleanPath, READ_CAP } from '../functions/api/views.ts';

const NOW = Date.parse('2026-11-09T20:00:00.000Z');

function fakeKv(seed = {}) {
  const map = new Map(Object.entries(seed).map(([k, v]) => [k, JSON.stringify(v)]));
  const calls = { list: 0, get: 0, put: 0 };
  return {
    map, calls,
    async get(key, type) { calls.get += 1; const v = map.get(key); return v === undefined ? null : type === 'json' ? JSON.parse(v) : v; },
    async put(key, value) { calls.put += 1; map.set(key, value); },
    async list({ prefix }) { calls.list += 1; return { keys: [...map.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; },
  };
}

const batch = (path, sampled, ipHint = '203.x') => ({ event: 'pageview', meta: { path }, ts: '2026-11-09T12:00:00.000Z', ipHint, sampled });

test('sums weighted pageviews per path and leaves other events out', () => {
  const pages = {};
  const added = addBatch(pages, [batch('/drum', 1), batch('/drum', 10), batch('/', 1), { event: 'click', meta: { path: '/drum' } }]);
  assert.equal(added, 12);
  assert.deepEqual(pages, { '/drum': 11, '/': 1 });
});

test('open JSON gives a page estimate and never the ip hint', async () => {
  const kv = fakeKv({
    'analytics-batch:2026-11-09T12:00:00.000Z:aaaa': [batch('/drum', 1), batch('/drum', 10)],
    'analytics-batch:2026-11-08T12:00:00.000Z:bbbb': [batch('/drum', 1)],
    'analytics-batch:2026-10-01T12:00:00.000Z:cccc': [batch('/drum', 10)],
  });
  const realNow = Date.now;
  Date.now = () => NOW;
  try {
    const one = await (await onRequestGet({ request: new Request('https://pointcast.xyz/api/views?path=/drum/'), env: { PC_ANALYTICS_KV: kv } })).json();
    assert.equal(one.views, 12);
    assert.equal(one.estimated, true);
    const all = await (await onRequestGet({ request: new Request('https://pointcast.xyz/api/views'), env: { PC_ANALYTICS_KV: kv } })).json();
    assert.equal(all.total, 12);
    assert.ok(!JSON.stringify(all).includes('203.x'));
  } finally { Date.now = realNow; }
});

test('the summary is rebuilt at most every ten minutes', async () => {
  const kv = fakeKv({ 'analytics-batch:2026-11-09T12:00:00.000Z:aaaa': [batch('/', 1)] });
  await getSummary(kv, 7, NOW);
  const lists = kv.calls.list;
  await getSummary(kv, 7, NOW + 60_000);
  assert.equal(kv.calls.list, lists);
  await getSummary(kv, 7, NOW + 11 * 60_000);
  assert.ok(kv.calls.list > lists);
});

test('a rebuild with too many batches is marked partial', async () => {
  const seed = {};
  for (let i = 0; i < READ_CAP + 5; i += 1) seed[`analytics-batch:2026-11-09T12:00:00.000Z:${i}`] = [batch('/', 1)];
  const sum = await getSummary(fakeKv(seed), 1, NOW);
  assert.equal(sum.partial, true);
  assert.equal(sum.total, READ_CAP);
});

test('bad paths are refused and a missing store reads unavailable', async () => {
  assert.equal(cleanPath('/../x'), undefined);
  assert.equal(cleanPath('/drum/'), '/drum');
  const bad = await onRequestGet({ request: new Request('https://pointcast.xyz/api/views?path=nope'), env: {} });
  assert.equal(bad.status, 400);
  const none = await (await onRequestGet({ request: new Request('https://pointcast.xyz/api/views'), env: {} })).json();
  assert.equal(none.status, 'unavailable');
});
