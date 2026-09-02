import assert from 'node:assert/strict';
import test from 'node:test';

import { flushAnalyticsBatch, onRequestPost, resetAnalyticsBatchForTest } from '../functions/api/analytics.ts';

function analyticsRequest(event, meta = { path: '/test' }) {
  return new Request('https://pointcast.xyz/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, meta, ts: '2026-08-21T12:00:00.000Z' }),
  });
}

function context(request, kv) {
  const work = [];
  return {
    request,
    env: { PC_ANALYTICS_KV: kv },
    functionPath: '/api/analytics',
    params: {},
    data: {},
    waitUntil(promise) { work.push(promise); },
    work,
    next: async () => new Response('next'),
  };
}

test('pageviews sample 1-in-10 and batch retained events with a weight', async () => {
  resetAnalyticsBatchForTest();
  const writes = [];
  const kv = {
    async put(...args) {
      writes.push(args);
    },
  };

  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    for (const event of ['pageview', 'page_view']) {
      const ctx = context(analyticsRequest(event), kv);
      const response = await onRequestPost(ctx);
      assert.equal(response.status, 204);
      assert.equal(ctx.work.length, 1);
    }
    await flushAnalyticsBatch();
  } finally { Math.random = originalRandom; }

  assert.equal(writes.length, 1);
  assert.match(writes[0][0], /^analytics-batch:/);
  const records = JSON.parse(writes[0][1]);
  assert.deepEqual(records.map((record) => record.sampled), [10, 10]);
});

test('sampled-out pageviews do not enter the batch', async () => {
  resetAnalyticsBatchForTest();
  const writes = [];
  const kv = { async put(...args) { writes.push(args); } };
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const response = await onRequestPost(context(analyticsRequest('pageview'), kv));
    assert.equal(response.headers.get('x-pc-analytics'), 'sampled-out');
    await flushAnalyticsBatch();
  } finally { Math.random = originalRandom; }
  assert.equal(writes.length, 0);
});

test('other valid analytics events join the isolate batch', async () => {
  resetAnalyticsBatchForTest();
  const writes = [];
  const kv = {
    async put(...args) {
      writes.push(args);
    },
  };

  const response = await onRequestPost(context(analyticsRequest('poll_vote'), kv));
  await flushAnalyticsBatch();

  assert.equal(response.status, 204);
  assert.equal(writes.length, 1);
  assert.equal(JSON.parse(writes[0][1])[0].event, 'poll_vote');
});
