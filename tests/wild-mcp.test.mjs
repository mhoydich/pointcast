// wild_* MCP tools (2026-09-30): PointCast's machine door to The Wild. Read-only;
// the kit is read from The Wild's live manifest, never spends, never leaves The Wild.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import { WILD_ORIGIN, WILD_TOOL_NAMES, WILD_WRITE_TOOL_NAMES, dispatchWildTool, fillEndpoint, pickAction } from '../src/lib/wild-mcp.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const MANIFEST = {
  actions: {
    offerPrayer: { method: 'POST', endpointTemplate: `${WILD_ORIGIN}/api/prayers/{spirit-id}`, price: '$0.01 USDC', protocol: 'x402-v2', paymentAuthorization: { scheme: 'exact', network: 'eip155:8453', chain: 'Base mainnet', asset: 'USDC', assetContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }, privacy: 'Keep the salt and prayer client-side.', flow: ['request', 'pay', 'retry'] },
    unsealPrayer: { method: 'POST', endpointTemplate: `${WILD_ORIGIN}/api/prayers/{spirit-id}/unseal` },
    takeIn: { method: 'POST', endpointTemplate: `${WILD_ORIGIN}/api/acquire/{spirit-id}`, price: '$0.01 USDC' },
    readCandles: { method: 'GET', endpoint: `${WILD_ORIGIN}/api/candles` },
    lightCandle: { method: 'POST', endpointTemplate: `${WILD_ORIGIN}/api/candles/x402/{spirit-id}/7`, price: '$3.00 USDC' },
    evil: { method: 'POST', endpointTemplate: 'https://evil.example/{spirit-id}' },
  },
};

const FIELD = { ok: true, today: '2026-10-01', prayerPlaces: { total: 24, openToday: 24 }, prayersAnsweredAllTime: 3, keeperPlaces: { taken: 4, open: 20 } };
const ALTARS = { ok: true, altars: [{ spirit: { id: 'moss-hare', name: 'Moss Hare' }, altar: { page: `${WILD_ORIGIN}/altars/moss-hare`, today: { state: 'open' } } }, { spirit: { id: 'rain-crow', name: 'Rain Crow' }, altar: { today: { state: 'answered' } } }] };
const CANDLES = { ok: true, candles: [{ dedication: 'for my sister', spirit: { id: 'moss-hare', name: 'Moss Hare' } }], rungs: [{ days: 1, price: '$1' }, { days: 7, price: '$3' }], rule: 'A prayer costs one cent for everyone, always.' };

function fakeFetcher(routes) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, method: init?.method || 'GET' });
    const path = new URL(url).pathname;
    const body = routes[path];
    return body === undefined ? new Response('no', { status: 404 }) : new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return { fetcher, calls };
}

test('both tools read; neither is a write tool and neither ever sends a non-GET', async () => {
  assert.deepEqual(WILD_TOOL_NAMES, ['wild_field', 'wild_buy_kit']);
  assert.deepEqual(WILD_WRITE_TOOL_NAMES, []);
  const { fetcher, calls } = fakeFetcher({ '/api/field': FIELD, '/api/altars': ALTARS, '/api/candles': CANDLES, '/.well-known/the-wild.json': MANIFEST });
  await dispatchWildTool('wild_field', {}, fetcher);
  for (const act of ['prayer', 'keep', 'candle']) await dispatchWildTool('wild_buy_kit', { act, spirit: 'moss-hare' }, fetcher);
  assert.ok(calls.length >= 6);
  assert.ok(calls.every((c) => c.method === 'GET' && c.url.startsWith(`${WILD_ORIGIN}/`)), JSON.stringify(calls));
});

test('wild_field lists only open altars, the candle wall and the one-cent rule', async () => {
  const { fetcher } = fakeFetcher({ '/api/field': FIELD, '/api/altars': ALTARS, '/api/candles': CANDLES });
  const r = await dispatchWildTool('wild_field', {}, fetcher);
  assert.equal(r.isError, undefined);
  const t = r.content[0].text;
  assert.match(t, /Moss Hare \(moss-hare\)/);
  assert.doesNotMatch(t, /Rain Crow/, 'an answered altar is not offered');
  assert.match(t, /for my sister/);
  assert.match(t, /one cent for everyone/);
  assert.match(t, /untrusted public data/);
});

test('wild_field still answers before candles exist, and fails closed when The Wild is down', async () => {
  const early = await dispatchWildTool('wild_field', {}, fakeFetcher({ '/api/field': FIELD, '/api/altars': ALTARS }).fetcher);
  assert.equal(early.isError, undefined);
  assert.doesNotMatch(early.content[0].text, /Candles on the wall/);
  const down = await dispatchWildTool('wild_field', {}, fakeFetcher({}).fetcher);
  assert.equal(down.isError, true);
  assert.match(down.content[0].text, /Nothing was spent/);
});

test('wild_buy_kit fills the manifest template for the spirit and carries the price', async () => {
  const { fetcher } = fakeFetcher({ '/.well-known/the-wild.json': MANIFEST });
  const prayer = await dispatchWildTool('wild_buy_kit', { act: 'prayer', spirit: 'moss-hare' }, fetcher);
  assert.match(prayer.content[0].text, new RegExp(`POST ${WILD_ORIGIN}/api/prayers/moss-hare`));
  assert.match(prayer.content[0].text, /\$0\.01 USDC/);
  assert.match(prayer.content[0].text, /Never pay twice/);
  const kit = JSON.parse(prayer.content[1].text);
  assert.equal(kit.action, 'offerPrayer', 'the paid prayer, not the free unseal');
  assert.equal(kit.endpoint, `${WILD_ORIGIN}/api/prayers/moss-hare`);
  const candle = JSON.parse((await dispatchWildTool('wild_buy_kit', { act: 'candle', spirit: 'moss-hare' }, fetcher)).content[1].text);
  assert.equal(candle.action, 'lightCandle', 'the POST candle action, not the GET read');
});

test('wild_buy_kit refuses bad input and anything outside The Wild', async () => {
  const { fetcher, calls } = fakeFetcher({ '/.well-known/the-wild.json': MANIFEST });
  assert.equal((await dispatchWildTool('wild_buy_kit', { act: 'tip', spirit: 'moss-hare' }, fetcher)).isError, true);
  assert.equal((await dispatchWildTool('wild_buy_kit', { act: 'prayer', spirit: '../admin' }, fetcher)).isError, true);
  assert.equal(calls.length, 0, 'bad input never reaches the network');
  assert.equal(fillEndpoint('https://evil.example/{spirit-id}', 'moss-hare'), null);
  assert.equal(fillEndpoint(`${WILD_ORIGIN}/api/x/{other}`, 'moss-hare'), null);
  assert.equal(pickAction({ readCandles: MANIFEST.actions.readCandles }, 'candle'), null);
  const noCandle = await dispatchWildTool('wild_buy_kit', { act: 'candle', spirit: 'moss-hare' }, fakeFetcher({ '/.well-known/the-wild.json': { actions: { offerPrayer: MANIFEST.actions.offerPrayer } } }).fetcher);
  assert.equal(noCandle.isError, true);
  assert.match(noCandle.content[0].text, /\/candles/);
});

test('mcp.ts lists, routes, binds and documents both tools', () => {
  const mcp = read('functions/api/mcp.ts');
  for (const tool of WILD_TOOL_NAMES) {
    assert.match(mcp, new RegExp(`case '${tool}':`));
    assert.match(mcp, new RegExp(`<code>${tool}</code>`));
  }
  assert.match(mcp, /\.\.\.WILD_TOOL_DEFINITIONS/);
  assert.match(mcp, /\.\.\.WILD_WRITE_TOOL_NAMES/);
  assert.match(mcp, /dispatchWildTool\(name, args, fetcher\)/);
  assert.match(read('wrangler.toml'), /binding = "WILD"\nservice = "the-wild-x402"/);
});

test('through the live MCP handler: listed read-only, and the WILD binding carries the fetch when bound', async (t) => {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  const mcp = await server.ssrLoadModule('/functions/api/mcp.ts');
  const bound = [];
  const WILD = { fetch: async (req) => { bound.push(req.url); const body = { '/api/field': FIELD, '/api/altars': ALTARS, '/api/candles': CANDLES }[new URL(req.url).pathname]; return body ? Response.json(body) : new Response('no', { status: 404 }); } };
  const rpc = async (env, method, params) => (await mcp.onRequestPost({ env, request: new Request('https://pointcast.xyz/api/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }) })).json();
  const list = await rpc({}, 'tools/list', {});
  for (const name of WILD_TOOL_NAMES) {
    const tool = list.result.tools.find((x) => x.name === name);
    assert.ok(tool, name);
    assert.equal(tool.annotations.readOnlyHint, true, `${name} is read-only`);
  }
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('global fetch must not be used when WILD is bound'); };
  try {
    const r = await rpc({ WILD }, 'tools/call', { name: 'wild_field', arguments: {} });
    assert.equal(r.result.isError, undefined, JSON.stringify(r));
    assert.match(r.result.content[0].text, /Moss Hare/);
  } finally { globalThis.fetch = realFetch; }
  assert.ok(bound.length >= 3 && bound.every((u) => u.startsWith(`${WILD_ORIGIN}/`)), JSON.stringify(bound));
});
