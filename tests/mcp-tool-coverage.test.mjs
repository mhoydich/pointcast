/**
 * Every tool /api/mcp advertises in tools/list has a dispatcher. A tool that
 * is listed but falls through to "unknown tool" is a broken promise to every
 * connected client, so this catches a definition added without its case.
 * Upstream fetches are stubbed to fail, so nothing leaves the machine; a
 * tool may error on missing arguments or the stub, just not as unknown.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const BASE = 'https://pointcast.xyz';

test('every advertised MCP tool has a dispatcher, on both endpoints', async (t) => {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
  t.after(() => { globalThis.fetch = realFetch; });

  for (const path of ['/api/mcp', '/api/mcp-v2']) {
    const mcp = await server.ssrLoadModule(`/functions${path}.ts`);
    const rpc = async (method, params) => (await mcp.onRequestPost({
      env: {},
      request: new Request(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }),
    })).json();
    const tools = (await rpc('tools/list', {})).result.tools;
    assert.ok(tools.length > 50, `${path} lists its tools`);
    assert.equal(new Set(tools.map((x) => x.name)).size, tools.length, `${path}: tool names are unique`);
    const control = await rpc('tools/call', { name: 'no_such_tool_for_coverage_check', arguments: {} });
    assert.match(JSON.stringify(control), /unknown tool/i, `${path}: the unknown-tool response this test looks for still exists`);
    const unknown = [];
    for (const tool of tools) {
      const res = await rpc('tools/call', { name: tool.name, arguments: {} });
      if (/unknown tool/i.test(JSON.stringify(res))) unknown.push(tool.name);
    }
    assert.deepEqual(unknown, [], `${path}: listed but not dispatched`);
  }
});
