import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('receipt response policy covers aliases and early returns without changing neighboring responses', async () => {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, entries: [], include: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
  const previousFetch = globalThis.fetch;
  const previousRewriter = globalThis.HTMLRewriter;
  // This test checks the real middleware's response headers, not browser Referer behavior.
  class PassThroughRewriter {
    on() { return this; }
    transform(response) { return response; }
  }
  const fixture = (status = 200) => new Response('receipt fixture', {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Referrer-Policy': 'strict-origin-when-cross-origin, origin',
      'Cache-Control': 'no-store',
      'Set-Cookie': 'fixture=true; SameSite=Strict',
    },
  });
  const initialQueries = [];
  try {
    globalThis.HTMLRewriter = PassThroughRewriter;
    globalThis.fetch = async (input) => {
      initialQueries.push(new URL(String(input)).search);
      return fixture();
    };
    const { onRequest } = await server.ssrLoadModule('/functions/_middleware.ts');
    const route = (path, method = 'GET', status = 200, origin = 'https://pointcast.xyz') => onRequest({
      request: new Request(origin + path, { method, headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 Chrome/140.0' } }),
      env: {},
      next: async () => fixture(status),
      waitUntil: () => assert.fail('No visit binding in this fixture'),
    });
    for (const path of ['/chain/receipt', '/chain/receipt/', '/chain/receipt/index.html']) {
      for (const method of ['GET', 'HEAD']) {
        const response = await route(path + '?hash=public-transaction', method);
        assert.equal(response.status, 200, `${method} ${path}`);
        assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer', `${method} ${path}: replace, do not append`);
        assert.equal(response.headers.get('Cache-Control'), 'no-store');
        assert.equal(response.headers.get('Set-Cookie'), 'fixture=true; SameSite=Strict');
        assert.equal(await response.text(), 'receipt fixture');
      }
    }
    assert.ok(initialQueries.includes('?hash=public-transaction'), 'initial GET and internal rewrite still carry the query; this is not access-log protection');
    const redirected = await route('/chain/receipt/?hash=public-transaction', 'GET', 200, 'https://www.pointcast.xyz');
    assert.equal(redirected.status, 301);
    assert.equal(redirected.headers.get('Referrer-Policy'), 'no-referrer');
    assert.equal(redirected.headers.get('Location'), 'https://pointcast.xyz/chain/receipt/?hash=public-transaction');
    const unavailable = await route('/chain/receipt/', 'GET', 503);
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.headers.get('Referrer-Policy'), 'no-referrer');
    assert.equal(await unavailable.text(), 'receipt fixture');
    for (const path of ['/chain/mist/', '/chain/receipt-extra', '/chain/receipt/desk.js', '/chain/receipt//', '/chain/receipt/index.html/extra', '/api/analytics']) {
      const response = await route(path);
      assert.equal(response.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin, origin', path);
    }
    assert.equal((await route('/chain/receipt/', 'POST')).headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin, origin');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousRewriter === undefined) delete globalThis.HTMLRewriter;
    else globalThis.HTMLRewriter = previousRewriter;
    await server.close();
  }
});
