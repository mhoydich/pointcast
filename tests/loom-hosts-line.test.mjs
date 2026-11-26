// The Loom host line (OFF-48), driven in jsdom against the real Loom service (src/lib/loom/service.mjs)
// over an in-memory KV. Checks the live paths the prototype only ran against mocks:
// read, append, reply as answer, +1, vote, edit, withdraw, ?to= links, and that
// untrusted message text never becomes HTML.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { handleLoom } from '../src/lib/loom/service.mjs';

const SOURCE = readFileSync(new URL('../src/pages/loom/index.astro', import.meta.url), 'utf8');
const between = (s, a, b) => { const i = s.indexOf(a) + a.length; return s.slice(i, s.indexOf(b, i)); };
const CSS = between(SOURCE, '<style is:inline>', '</style>');
const BODY = between(SOURCE, '<body>', '<script is:inline>');
const JS = between(SOURCE, '<script is:inline>', '</script>');

function memoryKv() {
  const map = new Map();
  return { map, get: async (k) => map.get(k) ?? null, put: async (k, v) => { map.set(k, v); } };
}
const ORIGIN = 'https://pointcast.xyz';
const api = (kv, path, init) => handleLoom(new Request(new URL(path, ORIGIN), init), { kv });
const apiAt = (kv, ms, path, init) => handleLoom(new Request(new URL(path, ORIGIN), init), { kv, clock: () => new Date(Date.now() - ms) });
const post = async (kv, body) => (await api(kv, '/api/loom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
const read = async (kv, to) => (await api(kv, `/api/loom?to=${encodeURIComponent(to)}`)).json();

const open = [];
test.afterEach(() => { while (open.length) open.pop().close(); });

async function page(kv, { path = '/loom', name = 'tester', small = false } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head><style>${CSS}</style></head><body>${BODY}</body></html>`, {
    url: ORIGIN + path, runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const w = dom.window;
  open.push(w);
  if (name) w.localStorage.setItem('loom.name', name);
  w.fetch = async (url, init = {}) => {
    const { signal, cache, ...rest } = init;
    return api(kv, new URL(url, ORIGIN).href, rest);
  };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  if (small) w.matchMedia = (q) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} });
  w.eval(JS);
  await settle(w);
  return w;
}
const settle = async (w, ms = 60) => { for (let i = 0; i < 6; i += 1) await new Promise((r) => w.setTimeout(r, ms / 6)); };
const texts = (w, sel) => [...w.document.querySelectorAll(sel)].map((n) => n.textContent);
const msgEl = (w, id) => w.document.getElementById(`msg-${id}`);
async function send(w, text) {
  w.document.getElementById('bodyInput').value = text;
  w.document.getElementById('composer').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await settle(w, 120);
}


const MIN = 60000;
const hostPost = (kv, name, line, agoMin) => apiAt(kv, agoMin * MIN, '/api/loom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: '#hosts', from: { name, kind: 'human' }, body: line }) });
const on = (kv, name, ago) => hostPost(kv, name, 'HOST ON · ' + name + ' · 11:04am ET Fri Nov 13, 2026 · about half an hour', ago);
const off = (kv, name, ago) => hostPost(kv, name, 'HOST OFF · ' + name + ' · 11:04am ET Fri Nov 13, 2026', ago);
const line = (w) => w.document.getElementById('hostLine');

test('(a) a 5 minute old HOST ON shows who is on', async () => {
  const kv = memoryKv(); await on(kv, 'loom desk', 5);
  const w = await page(kv);
  assert.equal(line(w).hidden, false);
  assert.match(line(w).textContent, /^On now: loom desk · since /);
  assert.equal(line(w).querySelector('button').title, 'Names are typed, not proven');
  assert.equal(w.document.getElementById('threadTitle').textContent.includes('#hosts'), false);
});

test('(b) HOST ON then HOST OFF by the same sender shows nobody', async () => {
  const kv = memoryKv(); await on(kv, 'loom desk', 10); await off(kv, 'Loom Desk ', 2);
  const w = await page(kv);
  assert.match(line(w).textContent, /^Nobody is on\. Leave a note/);
});

test('(c) a HOST ON over an hour old with no OFF shows nobody', async () => {
  const kv = memoryKv(); await on(kv, 'loom desk', 75);
  const w = await page(kv);
  assert.match(line(w).textContent, /^Nobody is on/);
});

test('(d) newest open host wins and another sender\'s OFF does not close it', async () => {
  const kv = memoryKv(); await on(kv, 'alpha', 30); await on(kv, 'beta', 10); await off(kv, 'gamma', 5);
  let w = await page(kv);
  assert.match(line(w).textContent, /^On now: beta/);
  await off(kv, 'beta', 3);
  w = await page(kv);
  assert.match(line(w).textContent, /^On now: alpha/);
});

test('(e) a name with html renders as text', async () => {
  const kv = memoryKv(); await on(kv, '<b>html</b> desk', 5);
  const w = await page(kv);
  assert.equal(line(w).querySelector('b'), null);
  assert.match(line(w).textContent, /On now: <b>html<\/b> desk/);
});

test('(f) Leave a note opens #hosts', async () => {
  const kv = memoryKv();
  const w = await page(kv);
  const btn = [...line(w).querySelectorAll('button')].find((b) => b.textContent === 'Leave a note');
  assert.ok(btn);
  btn.click(); await settle(w, 120);
  assert.match(w.document.getElementById('threadTitle').textContent, /#hosts/);
});
