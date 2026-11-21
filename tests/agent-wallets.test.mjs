import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server;
let lib;

before(async () => {
  server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  lib = await server.ssrLoadModule('/functions/_lib/agent-wallets.ts');
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
