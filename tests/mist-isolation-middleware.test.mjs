import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';

test('Pages middleware excludes the local simulations on both HTML paths and their aliases', async () => {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, entries: [], include: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
  const oldFetch = globalThis.fetch;
  const oldRewriter = globalThis.HTMLRewriter;
  let injections = 0;
  class Rewriter {
    handlers = [];
    on(selector, handler) { this.handlers.push({ selector, handler }); return this; }
    transform(response) {
      for (const { selector, handler } of this.handlers) if (selector === 'body') handler.element({ append(html) { if (html.includes('data-pointcast-tezos-session-bridge')) injections++; } });
      return response;
    }
  }
  const html = () => new Response('<!doctype html><html data-pc-isolated="true"><head></head><body>Fixture</body></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  try {
    globalThis.HTMLRewriter = Rewriter;
    globalThis.fetch = async (url) => { assert.ok(new URL(String(url)).pathname.endsWith('/')); return html(); };
    const { onRequest } = await server.ssrLoadModule('/functions/_middleware.ts');
    async function route(path) {
      injections = 0;
      const response = await onRequest({ request: new Request('https://pointcast.xyz' + path, { headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 Chrome/140' } }), env: {}, next: async () => html(), waitUntil() { assert.fail('unexpected visit write'); } });
      return { response, injections };
    }
    for (const base of ['/dao', '/chain/agreement']) for (const suffix of ['', '/', '.html', '/index.html']) {
      const { response, injections } = await route(base + suffix + '?example=1');
      assert.equal(response.status, 200, base + suffix);
      assert.equal(response.headers.get('x-pointcast-tezos-session-bridge'), null, base + suffix);
      assert.equal(injections, 0, base + suffix);
    }
    for (const path of ['/dao-other', '/chain/agreement-more/', '/chain/mist/']) {
      const { response, injections } = await route(path);
      assert.equal(response.headers.get('x-pointcast-tezos-session-bridge'), '1', path);
      assert.equal(injections, 1, path);
    }
  } finally {
    globalThis.fetch = oldFetch;
    if (oldRewriter === undefined) delete globalThis.HTMLRewriter; else globalThis.HTMLRewriter = oldRewriter;
    await server.close();
  }
});

test('session bridge performs no reconciliation or wallet writes on an isolated document', async () => {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, entries: [], include: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
  try {
    const { POINTCAST_TEZOS_SESSION_BRIDGE_SCRIPT } = await server.ssrLoadModule('/src/lib/auth/session-bridge-script.ts');
    const dom = new JSDOM('<!doctype html><html data-pc-isolated="true"><body></body></html>', { url: 'https://pointcast.xyz/dao/', runScripts: 'outside-only' });
    let calls = 0;
    dom.window.fetch = async () => { calls++; throw new Error('should not fetch'); };
    dom.window.eval(POINTCAST_TEZOS_SESSION_BRIDGE_SCRIPT);
    dom.window.dispatchEvent(new dom.window.Event('online'));
    assert.equal(calls, 0);
    assert.equal(dom.window.localStorage.length, 0);
    assert.equal(dom.window.__pointCastTezosBridgeInstalled, undefined);
    dom.window.close();

    const transition = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://pointcast.xyz/', runScripts: 'outside-only' });
    let resolveResponse;
    let requests = 0;
    transition.window.fetch = () => { requests++; return new Promise(resolve => { resolveResponse = resolve; }); };
    transition.window.eval(POINTCAST_TEZOS_SESSION_BRIDGE_SCRIPT);
    assert.equal(requests, 1);
    transition.window.document.documentElement.dataset.pcIsolated = 'true';
    resolveResponse({ ok: true, json: async () => ({ user: { identities: [{ provider: 'kukai', id: 'example-address' }] } }) });
    await new Promise(resolve => setTimeout(resolve, 0));
    transition.window.dispatchEvent(new transition.window.Event('online'));
    assert.equal(requests, 1);
    assert.equal(transition.window.localStorage.length, 0);
    transition.window.close();
  } finally { await server.close(); }
});
