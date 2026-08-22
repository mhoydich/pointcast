import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestPost } from '../functions/api/analytics.ts';

function analyticsRequest(event, meta = { path: '/test' }) {
  return new Request('https://pointcast.xyz/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, meta, ts: '2026-08-21T12:00:00.000Z' }),
  });
}

function context(request, kv) {
  return {
    request,
    env: { PC_ANALYTICS_KV: kv },
    functionPath: '/api/analytics',
    params: {},
    data: {},
    waitUntil() {},
    next: async () => new Response('next'),
  };
}

test('pageview events return success without writing to KV', async () => {
  const writes = [];
  const kv = {
    async put(...args) {
      writes.push(args);
    },
  };

  for (const event of ['pageview', 'page_view']) {
    const response = await onRequestPost(context(analyticsRequest(event), kv));
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('x-pc-analytics'), 'pageview-suppressed');
  }

  assert.equal(writes.length, 0);
});

test('other valid analytics events still write once', async () => {
  const writes = [];
  const kv = {
    async put(...args) {
      writes.push(args);
    },
  };

  const response = await onRequestPost(context(analyticsRequest('poll_vote'), kv));

  assert.equal(response.status, 204);
  assert.equal(writes.length, 1);
  assert.match(writes[0][0], /^event:poll_vote:2026-08-21T12:00:00\.000Z:/);
});
