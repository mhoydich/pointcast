/**
 * MCP sunset_downs_card (functions/api/mcp.ts): a read-only view of the
 * public /api/sunset-downs feed. It never calls the signed actions route.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const BASE = 'https://pointcast.xyz';

async function loadMcp(t) {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  const mcp = await server.ssrLoadModule('/functions/api/mcp.ts');
  return async (method, params) => (await mcp.onRequestPost({
    env: {},
    request: new Request(`${BASE}/api/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }),
  })).json();
}

const FEED = {
  ok: true,
  schema: 'pointcast.sunset-downs/v1',
  now: '2026-10-20T21:00:00.000Z',
  currency: 'free nontransferable play credits; no cash value',
  rules: { entryFee: 50 },
  api: { actions: { method: 'POST', url: '/api/sunset-downs/actions' } },
  races: [
    { id: 'sd-2026-10-20-noon', name: 'The Matinée', subtitle: 'New faces. Old debts.', postAt: '2026-10-20T19:00:00.000Z', status: 'settled',
      entrants: [{ id: 'house:golden-hour', house: true }, { id: 'pci_a', house: false }],
      result: { headline: 'Golden Hour owns the final frame.', finish: [
        { position: 1, name: 'Golden Hour', house: true }, { position: 2, name: 'Comet', stableName: 'Stable A', house: false }, { position: 3, name: 'Final Cut', house: true }] } },
    { id: 'sd-2026-10-20-premiere', name: 'The Premiere', subtitle: 'One last shot at the marquee.', postAt: '2026-10-21T03:00:00.000Z', status: 'open',
      entrants: [{ id: 'house:final-cut', house: true }], result: null },
  ],
  leaderboard: [{ name: 'Stable A', horseName: 'Comet', wins: 0, starts: 1, earned: 150 }],
};

async function withFetch(respond, run) {
  const real = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), method: init?.method ?? 'GET' }); return respond(String(url)); };
  try { return await run(calls); } finally { globalThis.fetch = real; }
}

test('sunset_downs_card is listed as a read-only tool', async (t) => {
  const rpc = await loadMcp(t);
  const list = await rpc('tools/list', {});
  const tool = list.result.tools.find((x) => x.name === 'sunset_downs_card');
  assert.ok(tool, 'tool is listed');
  assert.match(tool.description, /no cash value/);
});

test('sunset_downs_card summarises the feed and reads only GET /api/sunset-downs', async (t) => {
  const rpc = await loadMcp(t);
  await withFetch(() => new Response(JSON.stringify(FEED), { headers: { 'Content-Type': 'application/json' } }), async (calls) => {
    const all = await rpc('tools/call', { name: 'sunset_downs_card', arguments: {} });
    const text = all.result.content[0].text;
    assert.match(text, /sd-2026-10-20-noon .* settled · 1 owned entry/);
    assert.match(text, /Golden Hour owns the final frame\. 1\. Golden Hour, 2\. Comet \(Stable A\), 3\. Final Cut/);
    assert.match(text, /Leaderboard: Comet \(Stable A\) 0W\/1 · 150/);

    const one = await rpc('tools/call', { name: 'sunset_downs_card', arguments: { race: 'sd-2026-10-20-premiere' } });
    const payload = JSON.parse(one.result.content[1].text);
    assert.equal(payload.race.id, 'sd-2026-10-20-premiere');
    assert.equal(payload.api.actions.url, '/api/sunset-downs/actions');

    const missing = await rpc('tools/call', { name: 'sunset_downs_card', arguments: { race: 'sd-1999-01-01-noon' } });
    assert.equal(missing.result.isError, true);
    assert.match(missing.result.content[0].text, /Open races: sd-2026-10-20-premiere/);

    assert.deepEqual([...new Set(calls.map((c) => `${c.method} ${c.url}`))], [`GET ${BASE}/api/sunset-downs`]);
  });
});

test('sunset_downs_card reports an outage instead of throwing', async (t) => {
  const rpc = await loadMcp(t);
  await withFetch(() => new Response('{}', { status: 503 }), async () => {
    const res = await rpc('tools/call', { name: 'sunset_downs_card', arguments: {} });
    assert.equal(res.result.isError, true);
    assert.match(res.result.content[0].text, /not answering/);
  });
});
