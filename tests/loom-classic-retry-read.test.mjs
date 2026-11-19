import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
import { fold } from '../src/lib/loom/fold.mjs';
import { parseAddress } from '../src/lib/loom/address.mjs';

const page = readFileSync(new URL('../src/pages/loom/classic.astro', import.meta.url), 'utf8');
const markup = page.slice(page.indexOf('<main'), page.indexOf('</main>') + '</main>'.length);
const client = page.match(/<script>([\s\S]+?)<\/script>/)[1].replace(/^  import .*;$/gm, '');
const { outputText } = ts.transpileModule(client, { compilerOptions: { target: ts.ScriptTarget.ES2022 } });
const settle = () => new Promise(resolve => setImmediate(resolve));
const room = (address, title) => ({
  ok: true, log: { address, title, kind: 'topic' }, ops: [], seq: 2,
});

function openClassic(t, readThread) {
  const { window } = new JSDOM(markup, {
    url: 'https://example.test/loom/classic/?to=%23a', runScripts: 'outside-only', pretendToBeVisual: true,
  });
  t.after(() => window.close());
  const { document } = window;
  const requests = [];
  let tick;
  window.setTimeout = (callback, delay) => {
    if (delay === 4000) tick = callback;
    return 1;
  };
  window.matchMedia = () => ({ matches: false });
  window.fetch = async input => {
    const query = new URL(input, window.location.href).searchParams;
    if (!query.has('to')) return { json: async () => ({ ok: true, logs: [] }) };
    requests.push([query.get('to'), query.get('since')]);
    const result = await readThread(query.get('to'), requests.length);
    return result instanceof Response ? result : Response.json(result);
  };
  window.Function('fold', 'parseAddress', outputText)(fold, parseAddress);
  return {
    document, requests, poll: () => tick(),
    navigate(address) {
      document.querySelector('[data-to-input]').value = address;
      document.querySelector('[data-goto]').dispatchEvent(new window.Event('submit', { cancelable: true }));
    },
  };
}

test('a visible poll retries a failed first read in full, then resumes incremental reads', async t => {
  const retry = Promise.withResolvers();
  const { document, requests, poll } = openClassic(t, (address, attempt) => {
    if (attempt === 1) throw new Error('offline');
    if (attempt === 2) return retry.promise;
    return room(address, 'Recovered');
  });
  await settle();
  assert.match(document.querySelector('[data-live]').textContent, /offline/);
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
  await poll();
  assert.deepEqual(requests, [['#a', null]]);
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  const pending = poll();
  await poll();
  assert.deepEqual(requests, [['#a', null], ['#a', null]]);
  retry.resolve(room('#a', 'Recovered'));
  await pending;
  assert.equal(document.querySelector('[data-log-title]').textContent, 'Recovered');
  await poll();
  assert.deepEqual(requests.at(-1), ['#a', '2']);
});

test('late results from earlier visits cannot retry or replace the current room', async t => {
  const firstA = Promise.withResolvers();
  const firstB = Promise.withResolvers();
  const { document, requests, navigate, poll } = openClassic(t, (address, attempt) => {
    if (attempt === 1) return firstA.promise;
    if (attempt === 2) return firstB.promise;
    return room(address, 'Current A');
  });
  navigate('#b');
  await poll();
  assert.deepEqual(requests, [['#a', null], ['#b', null]]);
  navigate('#a');
  await settle();
  firstA.resolve(room('#a', 'Obsolete A'));
  firstB.reject(new Error('late B failure'));
  await settle();
  assert.equal(document.querySelector('[data-log-title]').textContent, 'Current A');
  assert.equal(document.querySelector('[data-live]').textContent, 'live · seq 2');
  await poll();
  assert.deepEqual(requests, [['#a', null], ['#b', null], ['#a', null], ['#a', '2']]);
});

test('server errors retry a full read and preserve an already loaded thread', async t => {
  const unavailable = status => Response.json({ ok: false, error: 'loom_unavailable' }, { status });
  const { document, requests, poll } = openClassic(t, (address, attempt) => {
    if (attempt === 1) return unavailable(500);
    if (attempt === 3) return unavailable(503);
    const log = room(address, 'Restored');
    if (attempt === 2) log.ops.push({
      op: 'append', id: 'm_first', seq: 2, kind: 'note', body: 'The pool opens Monday.',
      from: { name: 'Reader', kind: 'human' }, at: '2026-11-18T18:00:00Z',
    });
    return log;
  });
  await settle();
  const live = document.querySelector('[data-live]');
  const thread = document.querySelector('[data-thread]');
  assert.match(live.textContent, /retrying/);
  await poll();
  assert.equal(live.textContent, 'live · seq 2');
  assert.match(thread.textContent, /The pool opens Monday\./);
  await poll();
  assert.match(live.textContent, /retrying/);
  assert.match(thread.textContent, /The pool opens Monday\./);
  await poll();
  assert.equal(live.textContent, 'live · seq 2');
  assert.deepEqual(requests, [['#a', null], ['#a', null], ['#a', '2'], ['#a', '2']]);
});

test('a missing log reports the failure and does not retry the first read', async t => {
  const { document, requests, poll } = openClassic(t, () =>
    Response.json({ ok: false, error: 'log_not_found' }, { status: 404 }));
  await settle();
  assert.match(document.querySelector('[data-thread]').textContent, /log_not_found/);
  assert.doesNotMatch(document.querySelector('[data-live]').textContent, /connecting|retrying/);
  await poll();
  assert.deepEqual(requests, [['#a', null]]);
});
