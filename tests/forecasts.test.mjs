import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  accuracyBoard, auditQuestions, brier, cleanP, emptyBook, normalizeBook, placeForecast, publicBoard, statusOf,
} from '../functions/_lib/forecasts.mjs';

const T0 = Date.parse('2026-11-09T12:00:00Z');
const KEY_A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const KEY_B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const q = (id, closesAt, resolution = null) => ({
  id, category: 'weather', question: `${id}?`, yesMeans: 'yes rule', noMeans: 'no rule',
  opensAt: '2026-11-08T00:00:00Z', closesAt, resolveDate: closesAt.slice(0, 10),
  source: { name: 'NWS', url: 'https://example.gov' }, resolution,
});

test('brier and probability cleaning', () => {
  assert.equal(brier(70, 1), 0.09);
  assert.equal(brier(70, 0), 0.49);
  assert.equal(brier(50, 1), 0.25);
  assert.equal(brier(50, null), null);
  assert.equal(cleanP(0.62), 62);
  assert.equal(cleanP('40'), 40);
  assert.equal(cleanP(0), null);
  assert.equal(cleanP(100), null);
  assert.equal(cleanP('x'), null);
});

test('a key holds a handle; the same key can change its forecast before the close', async () => {
  const qs = [q('rain-by-friday', '2026-11-12T08:00:00Z')];
  const book = emptyBook();
  const first = await placeForecast(book, qs, { handle: '@Ada', key: KEY_A, id: 'rain-by-friday', p: 30 }, T0);
  assert.equal(first.ok, true);
  assert.equal(first.entry.handle, 'ada');
  const thief = await placeForecast(book, qs, { handle: 'ada', key: KEY_B, id: 'rain-by-friday', p: 90 }, T0 + 1000);
  assert.equal(thief.ok, false);
  assert.equal(thief.status, 409);
  const change = await placeForecast(book, qs, { handle: 'ada', key: KEY_A, id: 'rain-by-friday', p: 45 }, T0 + 2000);
  assert.equal(change.ok, true);
  assert.equal(change.updated, true);
  assert.equal(book.forecasts['rain-by-friday'].length, 1);
  assert.equal(book.forecasts['rain-by-friday'][0].p, 45);
  const late = await placeForecast(book, qs, { handle: 'ada', key: KEY_A, id: 'rain-by-friday', p: 10 }, Date.parse('2026-11-12T09:00:00Z'));
  assert.equal(late.ok, false);
  assert.match(late.error, /closed/);
  const noKey = await placeForecast(book, qs, { handle: 'bo', id: 'rain-by-friday', p: 10 }, T0);
  assert.equal(noKey.status, 400);
});

test('open questions hide individual forecasts; resolved ones score them', async () => {
  const qs = [
    q('open-one', '2026-11-20T08:00:00Z'),
    q('done-one', '2026-11-10T08:00:00Z'),
    q('void-one', '2026-11-10T08:00:00Z', { outcome: null, void: true, resolvedAt: '2026-11-10T18:00:00Z', sourceUrl: 'https://example.gov/r' }),
  ];
  const book = emptyBook();
  await placeForecast(book, qs, { handle: 'ada', key: KEY_A, id: 'open-one', p: 80 }, T0);
  await placeForecast(book, qs, { handle: 'ada', key: KEY_A, id: 'done-one', p: 80 }, T0);
  await placeForecast(book, qs, { handle: 'bot', key: KEY_B, id: 'done-one', p: 40, kind: 'agent' }, T0);
  qs[1].resolution = { outcome: true, resolvedAt: '2026-11-10T18:00:00Z', sourceUrl: 'https://example.gov/r', note: 'it rained' };
  const after = Date.parse('2026-11-11T00:00:00Z');
  assert.equal(statusOf(qs[2], after), 'void');
  const view = publicBoard({ questions: qs }, normalizeBook(JSON.parse(JSON.stringify(book))), after);
  assert.equal(view.money, 'none: forecasts only, no points, no prizes');
  assert.equal(view.open[0].forecasts, undefined);
  assert.equal(view.open[0].crowd.mean, 80);
  const done = view.archive.find((x) => x.id === 'done-one');
  assert.deepEqual(done.forecasts.map((f) => [f.handle, f.brier]), [['ada', 0.04], ['bot', 0.36]]);
  assert.equal(done.crowd.mean, 60);
  assert.equal(done.crowd.brier, 0.16);
  const acc = accuracyBoard(qs, book, after);
  assert.equal(acc.resolvedQuestions, 1);
  assert.equal(acc.human[0].handle, 'ada');
  assert.equal(acc.agent[0].brier, 0.36);
  assert.ok(!JSON.stringify(view).includes(KEY_A));
});

test('nothing on the board is money, points or prizes', () => {
  const view = publicBoard({ questions: [] }, emptyBook(), T0);
  const text = JSON.stringify(view).toLowerCase();
  assert.ok(!/"points"\s*:/.test(text));
  assert.match(view.rules.noMoney, /No money/);
});

test('the seeded question file passes the audit', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/forecasts.json', import.meta.url), 'utf8'));
  assert.deepEqual(auditQuestions(data), []);
  assert.ok(data.questions.length >= 15);
});

async function loadHandler(t, path) {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  return server.ssrLoadModule(path);
}

class FakeKV {
  constructor() { this.m = new Map(); }
  async get(key, type) {
    const value = this.m.get(key);
    if (value === undefined) return null;
    return type === 'json' ? JSON.parse(value) : value;
  }
  async put(key, value) { this.m.set(key, value); }
}

test('the API takes a forecast and never echoes the key', async (t) => {
  const api = await loadHandler(t, '/functions/api/forecasts.ts');
  const env = { VISITS: new FakeKV() };
  const data = JSON.parse(readFileSync(new URL('../src/data/forecasts.json', import.meta.url), 'utf8'));
  const id = data.questions.at(-1).id;
  const res = await api.onRequestPost({ env, request: new Request('https://pointcast.xyz/api/forecasts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '9.9.9.9' }, body: JSON.stringify({ handle: 'ada', key: KEY_A, id, p: 64 }) }) });
  const body = await res.json();
  if (Date.now() < Date.parse(data.questions.at(-1).closesAt)) {
    assert.equal(res.status, 201, JSON.stringify(body));
    assert.equal(body.forecast.p, 64);
  }
  const get = await api.onRequestGet({ env, request: new Request('https://pointcast.xyz/api/forecasts') });
  const text = await get.text();
  assert.ok(!text.includes(KEY_A));
  const offline = await api.onRequestPost({ env: {}, request: new Request('https://pointcast.xyz/api/forecasts', { method: 'POST', body: '{}' }) });
  assert.equal(offline.status, 503);
});

test('MCP lists forecast_list and forecast_get as read-only', async (t) => {
  const { onRequestPost } = await loadHandler(t, '/functions/api/mcp.ts');
  const res = await onRequestPost({
    env: {},
    request: new Request('https://pointcast.xyz/api/mcp-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
    }),
  });
  const tools = (await res.json()).result.tools;
  const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
  for (const name of ['forecast_list', 'forecast_get']) {
    assert.ok(byName[name], name);
    assert.equal(byName[name].annotations.readOnlyHint, true, name);
  }
});
