import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server;
let lib;
let api;

before(async () => {
  server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  lib = await server.ssrLoadModule('/functions/_lib/agent-wallets.ts');
  api = await server.ssrLoadModule('/functions/api/agent-wallets.ts');
});
after(() => server?.close());

function d1(sqlite) {
  return {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      let args = [];
      const bound = {
        bind(...values) { args = values; return bound; },
        async run() { statement.run(...args); return { success: true }; },
        async all() { return { results: statement.all(...args) }; },
      };
      return bound;
    },
  };
}

const KEY = Buffer.alloc(32, 7).toString('base64url');

test('generateTezosKey returns an edsk seed and matching tz1 address', async () => {
  const { secretKey, address } = await lib.generateTezosKey();
  assert.match(secretKey, /^edsk[1-9A-HJ-NP-Za-km-z]{50}$/);
  assert.match(address, /^tz1[1-9A-HJ-NP-Za-km-z]{33}$/);
});

test('ensureAgentWallets creates one wallet per roster agent, is idempotent, never exposes secrets', async () => {
  const sqlite = new DatabaseSync(':memory:');
  const env = { AUTH_DB: d1(sqlite), POINTCAST_INTEGRATION_ENCRYPTION_KEY: KEY };
  const first = await lib.ensureAgentWallets(env);
  assert.equal(first.length, lib.AGENT_ROSTER.length);
  assert.equal(new Set(first.map((w) => w.address)).size, first.length);
  for (const wallet of first) assert.deepEqual(Object.keys(wallet).sort(), ['address', 'createdAt', 'id', 'name', 'role']);
  const second = await lib.ensureAgentWallets(env);
  assert.deepEqual(second.map((w) => w.address), first.map((w) => w.address));
  const stored = sqlite.prepare('SELECT secret_ciphertext FROM agent_wallets').all();
  for (const row of stored) assert.ok(!row.secret_ciphertext.startsWith('edsk'));
});

test('ensureAgentWallets refuses to run without a valid encryption key', async () => {
  const env = { AUTH_DB: d1(new DatabaseSync(':memory:')), POINTCAST_INTEGRATION_ENCRYPTION_KEY: 'short' };
  await assert.rejects(() => lib.ensureAgentWallets(env), /encryption-key-invalid/);
});

test('a full table still lists existing wallets and skips the one it cannot create', async () => {
  const sqlite = new DatabaseSync(':memory:');
  const env = { AUTH_DB: d1(sqlite), POINTCAST_INTEGRATION_ENCRYPTION_KEY: KEY };
  const full = Array.from({ length: 64 }, (_, i) => ({ id: `agent-${i}`, name: `Agent ${i}`, role: 'test' }));
  assert.equal((await lib.ensureAgentWallets(env, full)).length, 64);
  const withExtra = [...full.slice(0, 3), { id: 'newcomer', name: 'Newcomer', role: 'test' }];
  const listed = await lib.ensureAgentWallets(env, withExtra);
  assert.deepEqual(listed.map((w) => w.id), ['agent-0', 'agent-1', 'agent-2']);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM agent_wallets').get().n, 64);
});

test('the endpoint returns a fixed error code when a dependency throws', async () => {
  const env = {
    AUTH_DB: { prepare() { throw new Error('D1_ERROR: internal detail at shard 7'); } },
    POINTCAST_INTEGRATION_ENCRYPTION_KEY: KEY,
  };
  const response = await api.onRequestGet({ env });
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), { error: 'agent-wallets-unavailable' });
  assert.ok(!text.includes('shard'));
});
