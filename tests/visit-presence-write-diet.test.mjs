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
