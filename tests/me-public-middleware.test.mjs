import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('dynamic public Me pages retain request-time withdrawal and security headers through middleware', async (t) => {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  t.after(() => server.close());
  const { onRequest } = await server.ssrLoadModule('/functions/_middleware.ts');
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Public Me routes must not fetch a static directory or remote unfurl'); });
  for (const prefix of ['collections/col_', 'people/page_']) {
    for (const ending of ['', '/', '.json']) {
      for (const method of ['GET', 'HEAD']) {
        for (const ua of ['Mozilla/5.0', 'GPTBot', 'ClaudeBot', 'Twitterbot']) {
          for (const status of [200, 404]) {
            const response = new Response(method === 'HEAD' ? null : 'Exact public projection', { status, headers: {
              'Content-Type': ending === '.json' ? 'application/json' : 'text/html',
              'Cache-Control': 'no-store',
              'Content-Security-Policy': "default-src 'none'",
              'X-Content-Type-Options': 'nosniff',
            } });
            const actual = await onRequest({ request: new Request(`https://pointcast.xyz/${prefix}${'a'.repeat(32)}${ending}`, { method, headers: { 'User-Agent': ua } }), env: {}, next: async () => response, waitUntil: () => { throw new Error('Public projection must not trigger background processing'); } });
            assert.equal(actual, response, `${prefix}${ending} ${method} ${ua} ${status}`);
            assert.equal(actual.headers.get('Cache-Control'), 'no-store');
            assert.equal(actual.headers.get('Content-Security-Policy'), "default-src 'none'");
          }
        }
      }
    }
  }
});
