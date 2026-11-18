import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { JSDOM } from 'jsdom';

const source = readFileSync(new URL('../src/pages/loom/classic.astro', import.meta.url), 'utf8');
const state = source.match(/  let kindFilter[\s\S]*?(?=  let pollTimer)/)[0];
const directory = source.match(/  async function loadDirectory\(\) \{[\s\S]*?\n  \}/)[0];
const load = new Function('$', 'fetch', 'el', 'loomHref', 'GLYPH', 'API', stripTypeScriptTypes(`
  const address = '#loom';
  ${state}
  ${directory}
`) + '\nreturn (kind) => { kindFilter = kind; return loadDirectory(); };');

function fixture(t) {
  const dom = new JSDOM('<ul data-logs></ul><div data-netgrid></div><p data-net></p>');
  t.after(() => dom.window.close());
  const { document } = dom.window;
  const $ = (selector) => document.querySelector(selector);
  const requests = new Map();
  const fetch = (url) => {
    const request = Promise.withResolvers();
    requests.set(url, request);
    return request.promise;
  };
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const select = load($, fetch, el, (address) => '/loom/classic?to=' + encodeURIComponent(address), {}, '/api/loom');
  return { select, requests, $ };
}

const response = (address, kind, logs) => ({
  json: async () => ({
    logs: [{ address, kind, count: 1 }],
    network: { logs, kinds: {}, hosts: [] },
    kvBound: true,
  }),
});

test('Classic ignores a stale directory success, including network counts', async (t) => {
  const { select, requests, $ } = fixture(t);
  const topics = select('topic');
  const places = select('geo');
  requests.get('/api/loom?kind=geo').resolve(response('geo:34,-118', 'geo', 2));
  await places;
  requests.get('/api/loom?kind=topic').resolve(response('#older', 'topic', 4));
  await topics;
  assert.match($('[data-logs] a').href, /geo%3A34%2C-118$/);
  assert.match($('[data-netgrid]').textContent, /^2threads/);
  assert.match($('[data-net]').textContent, /^2 threads/);
});

test('Classic ignores stale directory failures and still shows a current one', async (t) => {
  const { select, requests, $ } = fixture(t);
  const topics = select('topic');
  const places = select('geo');
  requests.get('/api/loom?kind=geo').resolve(response('geo:34,-118', 'geo', 2));
  await places;
  requests.get('/api/loom?kind=topic').reject(new Error('offline'));
  await topics;
  assert.match($('[data-logs] a').href, /geo%3A34%2C-118$/);

  const latest = select('topic');
  requests.get('/api/loom?kind=topic').reject(new Error('offline'));
  await latest;
  assert.match($('[data-logs]').textContent, /The directory is out of reach/);
});
