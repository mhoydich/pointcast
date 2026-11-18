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
    return { json: async () => result };
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
