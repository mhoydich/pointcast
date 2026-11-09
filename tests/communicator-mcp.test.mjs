import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import schedule from '../src/data/courts-schedule.json' with { type: 'json' };
import { DEMO_PROFILES, DEMO_NOW } from '../public/communicator/demo.mjs';
import { createServer } from 'vite';

// mcp.ts and agent-capabilities.ts import extension-less modules, so they load through vite like the other MCP tests.
const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
test.after(() => server.close());
const S = await server.ssrLoadModule('/functions/_lib/communicator-store.ts');
const H = await server.ssrLoadModule('/functions/_lib/communicator-http.ts');
const M = await server.ssrLoadModule('/functions/_lib/communicator-mcp.ts');
const { toolAnnotations, toolEffect, MCP_TOOL_NAMES } = await server.ssrLoadModule('/functions/api/mcp.ts');
const { AGENT_CAPABILITIES } = await server.ssrLoadModule('/src/lib/agent-capabilities.ts');

// Communicator v1-c (docs/prd/communicator-v1.md 4.3): the effect label, the okay route, the two read MCP tools.

const root = new URL('../', import.meta.url);
const MIGRATION = await readFile(new URL('migrations/auth/0033_communicator.sql', root), 'utf8');
const NOW = Date.parse(DEMO_NOW);
const VENUES = S.venuesFromSchedule(schedule);

class SqliteD1 {
  constructor() { this.db = new DatabaseSync(':memory:'); this.db.exec(MIGRATION); this.db.exec('CREATE TABLE sessions (token TEXT PRIMARY KEY, user_id TEXT, expires_at INTEGER); CREATE TABLE users (id TEXT PRIMARY KEY, payload TEXT)'); }
  prepare(sql) {
    const db = this.db; let args = [];
    const reads = /^\s*SELECT|\bRETURNING\b/i.test(sql);
    const execute = () => { const s = db.prepare(sql); return reads ? { results: s.all(...args).map((r) => ({ ...r })), meta: { changes: 0 } } : { results: [], meta: { changes: Number(s.run(...args).changes) } }; };
    const stmt = { bind(...v) { args = v; return stmt; }, async first() { return execute().results[0] ?? null; }, async all() { return execute(); }, async run() { return execute(); } };
    return stmt;
  }
}
// Handles in the demo roster carry a dash; the tool's actor pattern allows it.
const HOST = DEMO_PROFILES[0].handle;
const REQ = () => new Request('https://pointcast.xyz/api/mcp', { method: 'POST' });
async function town() {
  const db = new SqliteD1();
  for (const p of DEMO_PROFILES) await S.upsertProfile(db, p, { at: NOW });
  return { db, env: { AUTH_DB: db } };
}
const call = (t, name, args) => M.callCommunicatorTool(name, args, REQ(), t.env, VENUES, NOW);

test('toolAnnotations labels read and write', () => {
  assert.equal(toolAnnotations('communicator_ledger')['pointcast/effect'], 'read');
  assert.equal(toolAnnotations('communicator_ledger').readOnlyHint, true);
  assert.equal(toolEffect('loom_append'), 'write');
});

test('the communicator MCP surface is exactly the two read tools', () => {
  assert.deepEqual([...M.COMMUNICATOR_TOOL_NAMES], ['communicator_ledger', 'communicator_game']);
  assert.deepEqual(M.COMMUNICATOR_TOOL_DEFINITIONS.map((d) => d.name), ['communicator_ledger', 'communicator_game']);
  for (const n of M.COMMUNICATOR_TOOL_NAMES) assert.ok(MCP_TOOL_NAMES.includes(n), n);
  assert.equal(MCP_TOOL_NAMES.some((n) => /^communicator_(request|invite|remind|score|confirm_score)$/.test(n)), false);
});

test('every communicator tool served is read-only, and no consent tool is served', () => {
  for (const n of M.COMMUNICATOR_TOOL_NAMES) {
    assert.equal(toolEffect(n), 'read', n);
    assert.equal(toolAnnotations(n).readOnlyHint, true, `${n} readOnlyHint`);
  }
  // PointCast's other tools (drum, loom, ...) keep their existing write labels; none is consent.
  assert.deepEqual(MCP_TOOL_NAMES.filter((n) => toolEffect(n) === 'consent'), []);
});

test('every served tool has an effect and every capability definition carries one', () => {
  assert.ok(MCP_TOOL_NAMES.length > 0);
  for (const n of MCP_TOOL_NAMES) assert.ok(['read', 'write', 'consent'].includes(toolEffect(n)), n);
  for (const n of M.COMMUNICATOR_TOOL_NAMES) assert.ok(MCP_TOOL_NAMES.includes(n), n);
  for (const c of AGENT_CAPABILITIES) assert.ok(['read', 'write', 'consent'].includes(c.effect), c.id);
  for (const d of M.COMMUNICATOR_TOOL_DEFINITIONS) assert.equal(d.inputSchema.additionalProperties, false, d.name);
});

test('communicator_ledger returns public ratings and no contact', async () => {
  const t = await town();
  const out = await call(t, 'communicator_ledger', {});
  assert.equal(out.ok, true);
  assert.ok(Array.isArray(out.ratings));
  assert.doesNotMatch(JSON.stringify(out), /@|\d{7}/);
  assert.deepEqual(await M.callCommunicatorTool('communicator_ledger', {}, REQ(), {}, VENUES, NOW), { ok: false, reason: 'db-not-bound' });
});

test('communicator_game refuses unknown ids', async () => {
  const t = await town();
  assert.equal((await call(t, 'communicator_game', { id: 'nope' })).reason, 'not-found');
});
