// A no-slash HTML request must not fetch the public URL when the ASSETS
// binding is present. That public fetch re-enters the Pages Function.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('directory rewrite reads ASSETS instead of calling back into the worker', async () => {
  const server = await createServer({
    configFile: false,
    appType: 'custom',
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true, entries: [], include: [] },
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  const originalFetch = globalThis.fetch;
  const originalRewriter = globalThis.HTMLRewriter;
  class FakeRewriter {
    on() { return this; }
    transform(response) { return response; }
  }
  const html = () => new Response('<!doctype html><html><head><title>Door</title></head><body>Door</body></html>', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
  try {
    globalThis.HTMLRewriter = FakeRewriter;
    globalThis.fetch = async () => { throw new Error('public fetch re-enters the Pages Function'); };
    const { onRequest } = await server.ssrLoadModule('/functions/_middleware.ts');
    let assetCalls = 0;
    let nextCalls = 0;
    const response = await onRequest({
      request: new Request('https://pointcast.xyz/for-agents', { headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 Chrome/130.0' } }),
      env: {
        ASSETS: {
          fetch: async (input) => {
            assetCalls += 1;
            assert.equal(new URL(input.url).pathname, '/for-agents/');
            return html();
          },
        },
      },
      next: async () => { nextCalls += 1; return html(); },
      waitUntil() {},
    });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Door/);
    assert.equal(assetCalls, 1);
    assert.equal(nextCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalRewriter === undefined) delete globalThis.HTMLRewriter;
    else globalThis.HTMLRewriter = originalRewriter;
    await server.close();
  }
});
