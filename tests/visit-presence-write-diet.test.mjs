import assert from 'node:assert/strict';
import test from 'node:test';

import { pingPresence } from '../functions/api/visit.ts';

function fakeKv() {
  const data = new Map();
  const writes = [];
  return {
    data, writes,
    async get(key) { return data.get(key) ?? null; },
    async put(key, value, options) { writes.push([key, value, options]); data.set(key, value); },
    async list() { return { keys: [] }; },
  };
}

test('unchanged presence heartbeat skips a KV overwrite', async () => {
  const kv = fakeKv();
  const env = { VISITS: kv };
  await pingPresence({ env, ip: '203.0.113.8', ua: 'Mozilla/5.0', nounId: 23 });
  await pingPresence({ env, ip: '203.0.113.8', ua: 'Mozilla/5.0', nounId: 23 });
  assert.equal(kv.writes.length, 1);
});

test('a changed noun refreshes the visible presence entry', async () => {
  const kv = fakeKv();
  const env = { VISITS: kv };
  await pingPresence({ env, ip: '203.0.113.8', ua: 'Mozilla/5.0', nounId: 23 });
  await pingPresence({ env, ip: '203.0.113.8', ua: 'Mozilla/5.0', nounId: 24 });
  assert.equal(kv.writes.length, 2);
});

test('an unchanged heartbeat refreshes the TTL at the half-life', async () => {
  const kv = fakeKv();
  const env = { VISITS: kv };
  const originalNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  try {
    await pingPresence({ env, ip: '203.0.113.8', ua: 'Mozilla/5.0', nounId: 23 });
    now += 300_001;
    await pingPresence({ env, ip: '203.0.113.8', ua: 'Mozilla/5.0', nounId: 23 });
  } finally {
    Date.now = originalNow;
  }
  assert.equal(kv.writes.length, 2);
  assert.equal(kv.writes[1][2].expirationTtl, 600);
  assert.equal(JSON.parse(kv.writes[1][1]).t, 1_300_001);
});
