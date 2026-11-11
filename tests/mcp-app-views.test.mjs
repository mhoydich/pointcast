/**
 * MCP App views (functions/_lib/mcp-app-views.ts): the open_* tools that
 * Claude can list on its Artifacts page as global entry points.
 * Conditions from https://claude.com/docs/connectors/building/mcp-apps/entry-points
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const BASE = 'https://pointcast.xyz';
const OPEN_TOOLS = ['open_drum', 'open_nouns_battler', 'open_keyboard_bloom'];

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

test('each open tool is a global entry point linked to a ui:// view', async (t) => {
  const rpc = await loadMcp(t);
  const tools = (await rpc('tools/list', {})).result.tools;
  const resources = (await rpc('resources/list', {})).result.resources;
  for (const name of OPEN_TOOLS) {
    const tool = tools.find((x) => x.name === name);
    assert.ok(tool, name);
    assert.doesNotMatch(tool.name, /__|\.\.|\._|_\./, `${name}: name Claude can open`);
    assert.ok(tool.title && tool.title.length <= 60, `${name}: title`);
    assert.deepEqual(tool._meta['openai/ui'], { entrypoints: [{ type: 'global' }] }, `${name}: entry point`);
    assert.match(tool._meta.ui.resourceUri, /^ui:\/\//, `${name}: view`);
    assert.equal(tool._meta.ui.visibility, undefined, `${name}: visible to Claude`);
    assert.deepEqual(tool.inputSchema.required ?? [], [], `${name}: every input optional`);
    assert.equal(tool.annotations.readOnlyHint, true, `${name}: opening reads only`);
    assert.ok(resources.some((r) => r.uri === tool._meta.ui.resourceUri && r.mimeType === 'text/html;profile=mcp-app'), `${name}: listed resource`);
  }
});

test('each view reads back as an MCP App page that loads only the SDK', async (t) => {
  const rpc = await loadMcp(t);
  const tools = (await rpc('tools/list', {})).result.tools.filter((x) => OPEN_TOOLS.includes(x.name));
  for (const tool of tools) {
    const [item] = (await rpc('resources/read', { uri: tool._meta.ui.resourceUri })).result.contents;
    assert.equal(item.mimeType, 'text/html;profile=mcp-app');
    assert.match(item.text, /^<!DOCTYPE html>/);
    assert.match(item.text, /await app\.connect\(\)/);
    assert.deepEqual(item._meta.ui.csp.resourceDomains, ['https://unpkg.com']);
    const hosts = new Set([...item.text.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]));
    hosts.delete('unpkg.com'); hosts.delete('pointcast.xyz');
    assert.deepEqual([...hosts], [], `${tool.name}: no other origins`);
  }
});

test('open_nouns_battler opens with {} and replays a seeded match', async (t) => {
  const rpc = await loadMcp(t);
  const fresh = (await rpc('tools/call', { name: 'open_nouns_battler', arguments: {} })).result;
  assert.ok(!fresh.isError, fresh.content?.[0]?.text);
  assert.ok(fresh.structuredContent.match.frames.length > 0);
  const a = (await rpc('tools/call', { name: 'open_nouns_battler', arguments: { seed: 42 } })).result;
  const b = (await rpc('tools/call', { name: 'open_nouns_battler', arguments: { seed: 42 } })).result;
  assert.equal(a.structuredContent.matchHash, b.structuredContent.matchHash);
  assert.equal(a.structuredContent.match.input.seed, 42);
  assert.ok(a.structuredContent.match.units.length === 24);
});

test('open_drum and open_keyboard_bloom open with {} and survive a quiet upstream', async (t) => {
  const rpc = await loadMcp(t);
  const real = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith('/api/drum/track')) return Response.json({ track: { id: '4uLU6hMCjMI75M1A2tKUQC', setAt: 1, setBy: 'x' } });
    if (u.includes('/api/drum?')) return Response.json({ globalTotal: 1234 });
    if (u.endsWith('/api/keyboard/signal')) return Response.json({ globalTotal: 77, key: { today: { name: 'C major' } } });
    return new Response('no', { status: 503 });
  };
  try {
    const drum = (await rpc('tools/call', { name: 'open_drum', arguments: {} })).result;
    assert.deepEqual(drum.structuredContent, { app: 'drum', globalTotal: 1234, track: { id: '4uLU6hMCjMI75M1A2tKUQC' }, url: `${BASE}/drum` });
    const kb = (await rpc('tools/call', { name: 'open_keyboard_bloom', arguments: {} })).result;
    assert.deepEqual(kb.structuredContent, { app: 'keyboard-bloom', globalTotal: 77, key: 'C major', url: `${BASE}/keyboard` });
    globalThis.fetch = async () => new Response('down', { status: 503 });
    const quiet = (await rpc('tools/call', { name: 'open_drum', arguments: {} })).result;
    assert.ok(!quiet.isError);
    assert.equal(quiet.structuredContent.globalTotal, null);
  } finally {
    globalThis.fetch = real;
  }
});
