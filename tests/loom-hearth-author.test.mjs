// Exercise the actual Hearth room script; all network traffic is intercepted.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { esc, flameSvg, roomView, ago } from '../src/lib/loom/hearth.mjs';
import { hearthActivity } from '../src/lib/loom/hearth-day.mjs';

const source = readFileSync(new URL('../src/pages/loom/hearth/room.astro', import.meta.url), 'utf8');
const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;$/gm, '');
const NOW = Date.parse('2026-11-21T19:00:00Z');

function room(initial = {}, postOK = true) {
  const profile = new Map(Object.entries(initial));
  const requests = [], messages = [], nodes = new Map();
  let focused = null;
  for (const id of source.matchAll(/\bid="([^"]+)"/g)) {
    const element = {
      hidden: ['name-row', 'kind-row'].includes(id[1]),
      disabled: id[1] === 'send-log',
      value: '',
      events: {},
      addEventListener(event, fn) { this.events[event] = fn; },
      focus() { focused = id[1]; },
      setAttribute() {},
    };
    nodes.set(id[1], element);
  }
  const node = (id) => nodes.get(id);
  const fetch = async (url, options) => {
    if (options.method === 'POST') {
      assert.equal(url, '/api/loom');
      const request = JSON.parse(options.body);
      requests.push(request);
      if (!postOK) return { ok: false, status: 429, json: async () => ({ ok: false, error: 'rate_limited' }) };
      messages.push({ ...request, id: 'mock-id', seq: 1, at: new Date(NOW).toISOString() });
      return { ok: true, status: 201, json: async () => ({ ok: true, message: { id: 'mock-id' } }) };
    }
    assert.equal(url, '/api/loom?to=%23loom');
    return { ok: true, json: async () => ({ ok: true, log: { key: 'fixture', label: 'Loom' }, messages: [...messages] }) };
  };
  runInNewContext(script, {
    document: { getElementById: node }, location: { search: '' },
    localStorage: { getItem: key => profile.get(key) ?? null, setItem: (key, value) => profile.set(key, value) },
    Date: class extends Date { static now() { return NOW; } },
    crypto: { randomUUID: () => 'offline-fixture' }, URLSearchParams, URL, AbortSignal,
    fetch, esc, flameSvg, roomView, ago, hearthActivity,
  });
  return { node, profile, requests, get focused() { return focused; },
    async submit() { await node('log-form').events.submit({ preventDefault() {} }); },
  };
}

for (const [kind, hue] of [['agent', 'pilot'], ['human', 'flame']]) {
  test(`Hearth keeps a saved ${kind} label and renders the resulting room flame`, async () => {
    const r = room({ 'loom.name': 'Saved', 'loom.akind': kind });
    assert.equal(r.node('kind-row').hidden, true);
    r.node('author-kind').value = kind === 'agent' ? 'human' : 'agent';
    r.node('log').value = 'Offline log';
    await r.submit();
    assert.deepEqual(r.requests[0].from, { name: 'Saved', kind });
    assert.equal(r.profile.get('loom.akind'), kind);
    assert.match(r.node('room-flame').innerHTML, new RegExp(`--hearth-${hue}`));
  });
}

test('fresh profile requires a label and saves it only after successful delivery', async () => {
  const r = room({ 'loom.name': '   ' });
  assert.equal(r.node('name-row').hidden, false);
  assert.equal(r.node('kind-row').hidden, false);
  r.node('log').value = 'Offline log';
  await r.submit();
  assert.equal(r.focused, 'name');
  r.node('name').value = 'New';
  await r.submit();
  assert.equal(r.focused, 'author-kind');
  assert.equal(r.requests.length, 0);
  r.node('author-kind').value = 'agent';
  await r.submit();
  assert.deepEqual(r.requests[0].from, { name: 'New', kind: 'agent' });
  assert.equal(r.profile.get('loom.akind'), 'agent');
  assert.equal(r.node('kind-row').hidden, true);
});

test('invalid stored labels require a choice; rate limits retain the unsent draft', async () => {
  const r = room({ 'loom.name': 'Saved', 'loom.akind': 'unknown' }, false);
  r.node('log').value = 'Offline log';
  assert.equal(r.node('kind-row').hidden, false);
  await r.submit();
  assert.equal(r.requests.length, 0);
  r.node('author-kind').value = 'human';
  await r.submit();
  assert.deepEqual(r.requests[0].from, { name: 'Saved', kind: 'human' });
  assert.equal(r.profile.get('loom.akind'), 'unknown');
  assert.equal(r.node('log').value, 'Offline log');
});
