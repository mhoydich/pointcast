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

// Communicator v1-c (docs/prd/communicator-v1.md 4.3): the effect label, the okay route, the seven MCP tools.

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

test('toolAnnotations labels read, write and consent', () => {
  assert.equal(toolAnnotations('communicator_ledger')['pointcast/effect'], 'read');
  assert.equal(toolAnnotations('communicator_request')['pointcast/effect'], 'write');
  assert.equal(toolAnnotations('communicator_invite')['pointcast/effect'], 'consent');
  assert.equal(toolAnnotations('communicator_invite').readOnlyHint, false);
  assert.equal(toolAnnotations('communicator_ledger').readOnlyHint, true);
  assert.equal(toolEffect('loom_append'), 'write');
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

test('communicator_invite needs a fresh okay row of its kind', async () => {
  const t = await town();
  const args = { gameId: 'g_1', actor: HOST, okay: { by: HOST, at: DEMO_NOW } };
  assert.equal((await call(t, 'communicator_invite', args)).reason, 'okay-required');
  assert.equal((await call(t, 'communicator_invite', { ...args, okay: { by: 'someoneelse', at: DEMO_NOW } })).reason, 'okay-required');
  // wrong kind does not count
  await S.recordOkay(t.db, { actor: HOST, kind: 'remind', targetGame: 'g_1', at: NOW - 60_000 });
  assert.equal((await call(t, 'communicator_invite', args)).reason, 'okay-required');
  // stale (11 minutes) does not count
  await S.recordOkay(t.db, { actor: HOST, kind: 'invite', targetGame: 'g_1', at: NOW - 11 * 60_000 });
  assert.equal((await call(t, 'communicator_invite', args)).reason, 'okay-required');
  // fresh does
  await S.recordOkay(t.db, { actor: HOST, kind: 'invite', targetGame: 'g_1', at: NOW - 60_000 });
  const out = await call(t, 'communicator_invite', args);
  assert.notEqual(out.reason, 'okay-required');
  if (typeof H.inviteGame !== 'function') assert.equal(out.reason, 'not-yet-wired');
});

test('communicator_request runs the proposal for an actor with a fresh okay', async () => {
  const t = await town();
  const handle = DEMO_PROFILES.find((p) => p.identity.tier >= 2).handle;
  const args = { text: 'Get me a 4.0 doubles game Thursday evening at Rec Park', actor: handle };
  assert.equal((await call(t, 'communicator_request', args)).reason, 'okay-required');
  await S.recordOkay(t.db, { actor: handle, kind: 'request', targetGame: '', at: NOW - 1000 });
  const out = await call(t, 'communicator_request', args);
  if (out.ok) assert.doesNotMatch(JSON.stringify(out), /@|\d{7}/);
  else assert.notEqual(out.reason, 'okay-required');
});
