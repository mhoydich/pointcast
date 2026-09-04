import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createServer } from 'vite';

const ADMIN = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
const KENNEL = 'KT1JWNAKyiWVsbfNrHBQuuBDaGRBYqfehwdq';
const SEALS_V2 = 'KT1UVn9CDToAbyoxARLPfNtVkvKgzCwuroy3';
const SAFE = 'KT19Xcb8UuUUUaYTJ2Z7cdqYAhRaFi7UThwG';
const OP_HASH = `o${'1'.repeat(50)}`;

async function withModules(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const [queue, operations, access] = await Promise.all([
      server.ssrLoadModule('/functions/api/director/queue.ts'),
      server.ssrLoadModule('/src/lib/director-operations.ts'),
      server.ssrLoadModule('/src/lib/director-access.ts'),
    ]);
    return await run({ queue, operations, access });
  } finally {
    await server.close();
  }
}

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.args = [];
  }
  bind(...args) { this.args = args; return this; }
  async first() {
    if (this.sql.startsWith('SELECT token, user_id, expires_at FROM sessions')) {
      return this.db.session;
    }
    if (this.sql.startsWith('SELECT payload FROM users')) {
      return { payload: JSON.stringify(this.db.user) };
    }
    if (this.sql.includes('FROM claims')) return { count: 4 };
    if (this.sql.includes('FROM subscribers')) return { count: 12 };
    if (this.sql.includes('FROM aliases')) return { count: 3 };
    if (this.sql.includes('FROM seal_receipts')) return { count: 8 };
    throw new Error(`Unsupported fake first(): ${this.sql}`);
  }
  async all() {
    if (this.sql.startsWith('SELECT id, done FROM director_state')) {
      return { results: [...this.db.directorState].map(([id, done]) => ({ id, done: done ? 1 : 0 })) };
    }
    throw new Error(`Unsupported fake all(): ${this.sql}`);
  }
  async run() {
    if (this.sql.startsWith('INSERT INTO director_state')) {
      this.db.directorState.set(this.args[0], Boolean(this.args[1]));
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.startsWith('DELETE FROM sessions')) return { success: true, meta: { changes: 0 } };
    throw new Error(`Unsupported fake run(): ${this.sql}`);
  }
}

class FakeD1 {
  constructor(user) {
    this.user = user;
    this.session = { token: 'session-test', user_id: user.userId, expires_at: Date.now() + 60_000 };
    this.directorState = new Map([['mailbox-purchase', true]]);
  }
  prepare(sql) { return new FakeStatement(this, sql); }
}

function fakeUser({ roles = [], identities = [] } = {}) {
  return {
    userId: 'pcu_director_test',
    createdAt: '2026-09-04T00:00:00.000Z',
    preferredName: 'Director',
    roles,
    identities,
  };
}

function tzktFetch(input) {
  const url = String(input);
  if (url.includes(`/contracts/${KENNEL}/storage`)) {
    return Promise.resolve(Response.json({ treasury: ADMIN, supply: 4321 }));
  }
  if (url.includes('/bigmaps/4321/keys')) return Promise.resolve(Response.json({ value: '6' }));
  if (url.includes(`/contracts/${SEALS_V2}/storage`)) return Promise.resolve(Response.json({ paused: true }));
  if (url.includes('/accounts/')) return Promise.resolve(Response.json({ balance: 2_500_000 }));
  return Promise.resolve(Response.json({ error: 'not found' }, { status: 404 }));
}

test('director access accepts the role or the linked admin Tezos identity', async () => {
  await withModules(({ access }) => {
    assert.equal(access.hasDirectorDeskAccess({ user: fakeUser({ roles: ['broadcaster'] }) }), true);
    assert.equal(access.hasDirectorDeskAccess({ user: fakeUser({ identities: [{ provider: 'kukai', id: ADMIN }] }) }), true);
    assert.equal(access.hasDirectorDeskAccess({ user: fakeUser({ identities: [{ provider: 'google', id: ADMIN }] }) }), false);
    assert.equal(access.hasDirectorDeskAccess({ user: fakeUser() }), false);
  });
});

test('the chain-derived queue emits exact one-click operations plus till and today data', async () => {
  await withModules(async ({ queue }) => {
    const db = new FakeD1(fakeUser({ roles: ['broadcaster'] }));
    const result = await queue.buildDirectorQueue({ AUTH_DB: db, KENNEL_CLUB_CLAIM_DAILY_CAP: '50' }, { fetcher: tzktFetch });
    const treasury = result.rows.find(({ id }) => id === 'kennel-treasury-safe');
    const seals = result.rows.find(({ id }) => id === 'seals-v2-unpause');
    assert.deepEqual(treasury.operation, { contract: KENNEL, entrypoint: 'set_treasury', args: [SAFE] });
    assert.deepEqual(seals.operation, { contract: SEALS_V2, entrypoint: 'set_paused', args: [false] });
    assert.equal(result.rows.find(({ id }) => id === 'mailbox-purchase').done, true);
    assert.deepEqual(result.today.map(({ id, value }) => [id, value]), [
      ['claims', 4], ['mints', 6], ['subscribers', 12], ['aliases', 3], ['receipts', 8],
    ]);
    assert.deepEqual(result.till.map(({ id }) => id), ['safe', 'claim-wallet', 'cc-wallet', 'kennel-treasury']);
    assert.equal(result.till[3].matchesSafe, false);
  });
});

test('a mocked Beacon operation uses methodsObject, broadcasts, and asks for one confirmation', async () => {
  await withModules(async ({ operations }) => {
    const calls = [];
    const confirmations = [];
    const result = await operations.sendDirectorOperationWith(
      { contract: SEALS_V2, entrypoint: 'set_issuer', args: { issuer: ADMIN, allowed: true } },
      {
        connect: async () => ADMIN,
        at: async (address) => ({
          methodsObject: {
            set_issuer: (...args) => ({
              send: async () => ({
                opHash: OP_HASH,
                confirmation: async (count) => { confirmations.push(count); },
              }),
            }),
          },
          address,
        }),
      },
    );
    calls.push(result.address, result.opHash);
    await result.confirmation;
    assert.deepEqual(calls, [ADMIN, OP_HASH]);
    assert.deepEqual(confirmations, [1]);
  });
});

test('manual Done writes are director-only and persist only allowlisted queue ids', async () => {
  await withModules(async ({ queue }) => {
    const unauthorized = new FakeD1(fakeUser());
    const denied = await queue.handleDirectorQueueWrite(new Request('https://pointcast.xyz/api/director/queue', {
      method: 'POST', headers: { cookie: 'pc_session=session-test', origin: 'https://pointcast.xyz' },
      body: JSON.stringify({ id: 'resend-dns', done: true }),
    }), { AUTH_DB: unauthorized });
    assert.equal(denied.status, 403);

    const authorized = new FakeD1(fakeUser({ identities: [{ provider: 'kukai', id: ADMIN }] }));
    const saved = await queue.handleDirectorQueueWrite(new Request('https://pointcast.xyz/api/director/queue', {
      method: 'POST', headers: { cookie: 'pc_session=session-test', origin: 'https://pointcast.xyz' },
      body: JSON.stringify({ id: 'resend-dns', done: true }),
    }), { AUTH_DB: authorized });
    assert.equal(saved.status, 200);
    assert.equal(authorized.directorState.get('resend-dns'), true);

    const rejected = await queue.handleDirectorQueueWrite(new Request('https://pointcast.xyz/api/director/queue', {
      method: 'POST', headers: { cookie: 'pc_session=session-test', origin: 'https://pointcast.xyz' },
      body: JSON.stringify({ id: 'not-in-the-queue', done: true }),
    }), { AUTH_DB: authorized });
    assert.equal(rejected.status, 400);
  });
});

test('director_state migration is bounded and tied to authenticated users', async () => {
  const migration = await readFile(new URL('../migrations/auth/0009_director_state.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE TABLE director_state/);
  assert.match(migration, /CHECK \(done IN \(0, 1\)\)/);
  assert.match(migration, /FOREIGN KEY \(updated_by\) REFERENCES users\(id\)/);
});
