/**
 * The atlas "mcp-tools" layer must hold one pc:tool record for every tool the MCP server exposes.
 * Reads the committed public/atlas.json and compares it with MCP_TOOL_NAMES from functions/api/mcp.ts.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function loadMcp(t) {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  return server.ssrLoadModule('/functions/api/mcp.ts');
}

test('atlas tool records match the MCP server tool list', async (t) => {
  const file = new URL('public/atlas.json', root);
  if (!existsSync(file)) return t.skip('public/atlas.json has not been built yet');
  const atlas = JSON.parse(readFileSync(file, 'utf8'));
  const ids = atlas.records.filter((r) => r.id.startsWith('pc:tool:')).map((r) => r.id);
  if (!ids.length) return t.skip('public/atlas.json has no tool records yet');
  const mcp = await loadMcp(t);
  const expected = mcp.MCP_TOOL_NAMES.map((n) => `pc:tool:${n.replace(/_/g, '-')}`).sort();
  assert.equal(new Set(ids).size, ids.length, 'tool ids are unique');
  assert.deepEqual([...ids].sort(), expected);
  for (const r of atlas.records.filter((x) => x.type === 'tool')) {
    assert.ok(r.tags.includes('read-only') || r.tags.includes('write'), `${r.id} is tagged read-only or write`);
  }
});
