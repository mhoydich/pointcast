/**
 * MCP small_shrine (functions/api/mcp.ts): the Small Shrines meditations,
 * served from src/data/small-shrines.ts with no network call.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const BASE = 'https://pointcast.xyz';

async function loadMcp(t) {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  const mcp = await server.ssrLoadModule('/functions/api/mcp.ts');
  const data = await server.ssrLoadModule('/src/data/small-shrines.ts');
  const rpc = async (method, params) => (await mcp.onRequestPost({
    env: {},
    request: new Request(`${BASE}/api/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }),
  })).json();
  return { rpc, SHRINES: data.SHRINES };
}

const call = (rpc, args) => rpc('tools/call', { name: 'small_shrine', arguments: args });

test('small_shrine lists every shrine and offers each id in its schema', async (t) => {
  const { rpc, SHRINES } = await loadMcp(t);
  const tool = (await rpc('tools/list', {})).result.tools.find((x) => x.name === 'small_shrine');
  assert.deepEqual(tool.inputSchema.properties.shrine.enum, SHRINES.map((s) => s.id));
  const text = (await call(rpc, {})).result.content[0].text;
  for (const s of SHRINES) assert.ok(text.includes(`(${s.id})`), s.id);
});

test('small_shrine returns one meditation with every timed prompt, without fetching', async (t) => {
  const { rpc, SHRINES } = await loadMcp(t);
  const real = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('small_shrine must not fetch'); };
  try {
    const ocean = SHRINES.find((s) => s.id === 'ocean');
    const res = await call(rpc, { shrine: 'Ocean' });
    const text = res.result.content[0].text;
    for (const p of ocean.phases) assert.ok(text.includes(`${p.at}s · ${p.label}: ${p.text}`), p.label);
    const json = JSON.parse(res.result.content[1].text);
    assert.equal(json.url, `${BASE}/small-shrines/#ocean`);
    assert.equal(json.image, `${BASE}${ocean.image}`);

    const bad = await call(rpc, { shrine: 'volcano' });
    assert.equal(bad.result.isError, true);
  } finally {
    globalThis.fetch = real;
  }
});
