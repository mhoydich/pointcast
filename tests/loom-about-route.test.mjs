import assert from 'node:assert/strict';
import test from 'node:test';
import * as route from '../functions/loom/about.ts';

test('the missing About page redirects readers to the first-visit guide', async () => {
  for (const handle of [route.onRequestGet, route.onRequestHead]) {
    const response = await handle({ next: async () => new Response(null, { status: 404 }) });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/loom/hello');
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.equal(route.onRequestPost, undefined);
});

test('a cover page and other asset responses pass through', async () => {
  for (const status of [200, 308, 503]) {
    const upstream = new Response('asset response', { status });
    assert.equal(await route.onRequestGet({ next: async () => upstream }), upstream);
  }
});
