import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
test.after(() => server.close());
const prayer = await server.ssrLoadModule('/functions/api/prayer.ts');
const overview = await server.ssrLoadModule('/functions/api/prayer-overview.ts');
const mcp = await server.ssrLoadModule('/src/lib/prayer-mcp.ts');
const store = new Map();
const env = { VISITS: { get: async key => store.get(key) ?? null, put: async (key, value) => { store.set(key, value); } } };
const get = async () => overview.onRequestGet({ env });

test('new stations work and existing prayer GET remains compatible', async () => {
  const response = await prayer.onRequestPost({ env, request: new Request('https://pointcast.xyz/api/prayer', { method: 'POST', body: JSON.stringify({ station: 'still-light', sessionId: 'anonymous-session' }) }) });
  assert.equal(response.status, 200);
  const data = await (await prayer.onRequestGet({ env })).json();
  assert.equal(data.storageAvailable, true);
  assert.equal(data.counts['still-light'], 1);
  assert.ok(data.stations.includes('remembering'));
  assert.ok(Array.isArray(data.recent));
  assert.equal(data.total, 1);
});

test('overview keeps periods separate and excludes identifiers', async () => {
  const state = JSON.parse(store.get('prayer:state'));
  state.recent[0].pid = 'private-fixture';
  store.set('prayer:state', JSON.stringify(state));
  const response = await get();
  const text = await response.text();
  const data = JSON.parse(text);
  assert.equal(response.status, 200);
  assert.equal(data.prayer.stationCounts['still-light'], 1);
  assert.equal(data.prayer.total, 1);
  assert.equal(data.drumAltar.period, 'current ISO week');
  assert.equal(data.drumAltar.total, 0);
  assert.equal(data.total, undefined);
  assert.doesNotMatch(text, /private-fixture|recent|pid/);
  assert.match(data.accuracy, /Approximate/);
  assert.match(data.coverage, /not a count across all sites/);
});

test('missing or failing storage is unavailable, never a zero count', async () => {
  const missing = await overview.onRequestGet({ env: {} });
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).storageAvailable, false);
  const legacy = await prayer.onRequestGet({ env: {} });
  const oldBody = await legacy.json();
  assert.equal(oldBody.ok, true);
  assert.equal(oldBody.storageAvailable, false);
  const failure = await overview.onRequestGet({ env: { VISITS: { get: async () => { throw new Error('down'); } } } });
  assert.equal(failure.status, 503);
  assert.equal((await failure.json()).reason, 'ledger-read-failed');
});

test('MCP reads the fixed endpoint and handles unavailable responses', async () => {
  const oldFetch = globalThis.fetch;
  const result = await (await get()).json();
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url.href, 'https://pointcast.xyz/api/prayer-overview');
      assert.equal(init.method, 'GET');
      assert.equal(init.redirect, 'error');
      assert.ok(init.signal);
      return Response.json(result);
    };
    const output = await mcp.dispatchPrayerOverview('https://pointcast.xyz');
    assert.equal(output.isError, undefined);
    assert.equal(JSON.parse(output.content[0].text).prayer.total, 1);
    globalThis.fetch = async () => new Response('', { status: 503 });
    assert.equal((await mcp.dispatchPrayerOverview('https://pointcast.xyz')).isError, true);
  } finally { globalThis.fetch = oldFetch; }
});

test('MCP catalog and JSON-RPC call expose the read-only tool', async () => {
  const api = await server.ssrLoadModule('/functions/api/mcp.ts');
  const request = (method, params = {}) => new Request('https://pointcast.xyz/api/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const catalog = await (await api.onRequestPost({ request: request('tools/list'), env: {} })).json();
  const tool = catalog.result.tools.find(item => item.name === 'prayer_overview');
  assert.equal(tool.annotations.readOnlyHint, true);
  assert.equal(tool.inputSchema.additionalProperties, false);
  const oldFetch = globalThis.fetch;
  try {
    const payload = await (await get()).json();
    globalThis.fetch = async () => Response.json(payload);
    const call = await (await api.onRequestPost({ request: request('tools/call', { name: 'prayer_overview', arguments: {} }), env: {} })).json();
    assert.equal(JSON.parse(call.result.content[0].text).prayer.total, 1);
  } finally { globalThis.fetch = oldFetch; }
});
