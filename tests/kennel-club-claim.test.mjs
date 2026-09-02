import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);
const WALLET = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
const OP_HASH = `o${'1'.repeat(50)}`;

async function withModules(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const [claims, endpoint, kennel] = await Promise.all([
      server.ssrLoadModule('/functions/api/kennel-club/_claims.ts'),
      server.ssrLoadModule('/functions/api/kennel-club/claim.ts'),
      server.ssrLoadModule('/src/lib/kennel-club.ts'),
    ]);
    return await run({ claims, endpoint, kennel });
  } finally {
    await server.close();
  }
}

class FakeKV {
  constructor() {
    this.values = new Map();
    this.puts = [];
  }

  async get(key) {
    return this.values.get(key) ?? null;
  }

  async put(key, value, options) {
    this.values.set(key, value);
    this.puts.push({ key, value, options });
  }
}

class FakeD1Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async first() {
    const { db, sql, args } = this;
    if (sql.startsWith('SELECT token, user_id, expires_at FROM sessions')) {
      return db.sessions.get(args[0]) ?? null;
    }
    if (sql.startsWith('SELECT payload FROM users WHERE id')) {
      const user = db.users.get(args[0]);
      return user ? { payload: JSON.stringify(user) } : null;
    }
    if (sql.startsWith('SELECT id, user_id, token_id, status') && sql.includes('user_id = ? AND token_id = ?')) {
      return db.claimFor(args[0], Number(args[1]));
    }
    if (sql.startsWith('UPDATE claims SET op_hash = NULL')) {
      const row = db.claims.get(args[1]);
      if (!row || row.status !== 'failed' || row.created_at !== args[2]) return null;
      Object.assign(row, { op_hash: null, delivered_to: null, created_at: args[0] });
      return { ...row };
    }
    if (sql.startsWith('INSERT INTO claims') && sql.includes('RETURNING')) {
      const [id, userId, tokenId, createdAt, capTokenId, cap, duplicateUser, duplicateToken] = args;
      if (db.claimFor(duplicateUser, Number(duplicateToken))) return null;
      if ([...db.claims.values()].filter((row) => row.token_id === Number(capTokenId)).length >= Number(cap)) return null;
      const row = {
        id,
        user_id: userId,
        token_id: Number(tokenId),
        status: 'failed',
        op_hash: null,
        delivered_to: null,
        created_at: createdAt,
      };
      db.claims.set(id, row);
      return { ...row };
    }
    if (sql.startsWith('SELECT COUNT(*) AS cap_used')) {
      const rows = [...db.claims.values()].filter((row) => row.token_id === Number(args[0]));
      return {
        cap_used: rows.length,
        claimed: rows.filter((row) => row.status !== 'failed').length,
        held: rows.filter((row) => row.status === 'held').length,
        delivered: rows.filter((row) => row.status === 'delivered').length,
        failed: rows.filter((row) => row.status === 'failed').length,
      };
    }
    if (sql.startsWith("SELECT json_extract(u.payload, '$.preferredName')")) {
      const row = [...db.claims.values()].find((claim) => claim.op_hash === args[0] && claim.status !== 'failed');
      return row ? { preferred_name: db.users.get(row.user_id)?.preferredName ?? null } : null;
    }
    throw new Error(`Unsupported fake D1 first(): ${sql}`);
  }

  async all() {
    const { db, sql, args } = this;
    if (sql.startsWith('SELECT id, user_id, token_id, status') && sql.includes("status = 'held'")) {
      return { results: [...db.claims.values()]
        .filter((row) => row.user_id === args[0] && row.status === 'held')
        .sort((a, b) => a.token_id - b.token_id)
        .map((row) => ({ ...row })) };
    }
    if (sql.startsWith('SELECT id, user_id, token_id, status') && sql.includes('WHERE user_id = ?')) {
      return { results: [...db.claims.values()]
        .filter((row) => row.user_id === args[0])
        .sort((a, b) => a.token_id - b.token_id)
        .map((row) => ({ ...row })) };
    }
    if (sql.startsWith('SELECT c.id, c.user_id')) {
      return { results: [...db.claims.values()]
        .filter((row) => row.status === 'held' || row.status === 'delivered')
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 10)
        .map((row) => ({ ...row, preferred_name: db.users.get(row.user_id)?.preferredName ?? null })) };
    }
    throw new Error(`Unsupported fake D1 all(): ${sql}`);
  }

  async run() {
    const { db, sql, args } = this;
    if (sql.startsWith('UPDATE claims SET status = ?, op_hash = ?, delivered_to = ?')) {
      const row = db.claims.get(args[3]);
      if (row) Object.assign(row, { status: args[0], op_hash: args[1], delivered_to: args[2] });
      return { success: true };
    }
    if (sql.startsWith("UPDATE claims SET status = 'delivered'")) {
      const row = db.claims.get(args[2]);
      if (row?.status === 'held') Object.assign(row, { status: 'delivered', op_hash: args[0], delivered_to: args[1] });
      return { success: true };
    }
    throw new Error(`Unsupported fake D1 run(): ${sql}`);
  }
}

class FakeD1 {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.claims = new Map();
  }

  prepare(sql) {
    return new FakeD1Statement(this, sql);
  }

  async batch(statements) {
    return Promise.all(statements.map((statement) => statement.run()));
  }

  claimFor(userId, tokenId) {
    const row = [...this.claims.values()].find((claim) => claim.user_id === userId && claim.token_id === tokenId);
    return row ? { ...row } : null;
  }

  addUser(user, token = `pcs_${user.userId}`) {
    this.users.set(user.userId, user);
    this.sessions.set(token, {
      token,
      user_id: user.userId,
      expires_at: Date.now() + 60_000,
    });
    return token;
  }
}

class FakeTaquitoChain {
  constructor({ balance = 4_000_000 } = {}) {
    this.address = 'tz1Rugft6gx3ZtSj8BUQSUnHEPbbUqVy7qXf';
    this.balance = balance;
    this.reveals = 0;
    this.mints = [];
    this.deliveries = [];
  }

  async balanceMutez() { return this.balance; }
  async ensureRevealed() { this.reveals += 1; }
  async mint(tokenId, deliveredTo) {
    this.mints.push({ tokenId, deliveredTo });
    return { opHash: OP_HASH };
  }
  async deliver(tokenIds, deliveredTo) {
    this.deliveries.push({ tokenIds, deliveredTo });
    return { opHash: OP_HASH };
  }
}

function user(userId, identities = [{ provider: 'google', id: `${userId}@example.com` }], preferredName = 'Mina Example') {
  return {
    userId,
    createdAt: '2026-09-02T00:00:00.000Z',
    identities: identities.map((identity) => ({
      ...identity,
      name: identity.id,
      verifiedAt: '2026-09-02T00:00:00.000Z',
    })),
    preferredName,
    roles: [],
  };
}

function claimRequest(token, ip = '203.0.113.9') {
  return new Request('https://pointcast.xyz/api/kennel-club/claim', {
    method: 'POST',
    headers: { cookie: `pc_session=${token}`, 'CF-Connecting-IP': ip },
  });
}

test('claim migration enforces the one-user-per-sitting ledger and approved states', async () => {
  const migration = await readFile(new URL('migrations/auth/0004_kennel_club_claims.sql', root), 'utf8');
  assert.match(migration, /UNIQUE \(user_id, token_id\)/);
  assert.match(migration, /status IN \('held', 'delivered', 'failed'\)/);
  assert.match(migration, /FOREIGN KEY \(user_id\) REFERENCES users\(id\) ON DELETE CASCADE/);
});

test('session claim uses both KV buckets and holds a dog for a Google-only user', async () => {
  await withModules(async ({ claims, endpoint, kennel }) => {
    const db = new FakeD1();
    const kv = new FakeKV();
    const member = user('pcu_google');
    const token = db.addUser(member);
    const chain = new FakeTaquitoChain();
    const response = await endpoint.handleKennelClubClaim(claimRequest(token), {
      AUTH_DB: db,
      PC_RATES_KV: kv,
      KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake',
    }, { chainFactory: async () => chain });
    const payload = await response.json();
    const tokenId = kennel.sittingOfTheDay(kennel.losAngelesDate()).tokenId;

    assert.equal(response.status, 200);
    assert.equal(payload.claim.status, 'held');
    assert.deepEqual(chain.mints, [{ tokenId, deliveredTo: null }]);
    assert.equal(db.claimFor(member.userId, tokenId).status, 'held');
    assert.ok(kv.puts.some(({ key }) => key.includes('rl:kennel-claim-ip:ip:203.0.113.9:')));
    assert.ok(kv.puts.some(({ key }) => key.includes('rl:kennel-claim-user:user:pcu_google:')));

    const duplicate = await endpoint.handleKennelClubClaim(claimRequest(token), {
      AUTH_DB: db,
      PC_RATES_KV: kv,
      KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake',
    }, { chainFactory: async () => chain });
    assert.equal(duplicate.status, 409);
    assert.equal((await duplicate.json()).reason, 'already-claimed');
    assert.equal(chain.mints.length, 1);
  });
});

test('a linked Tezos identity receives the mint in the same fake Taquito batch', async () => {
  await withModules(async ({ claims, kennel }) => {
    const db = new FakeD1();
    const member = user('pcu_wallet', [{ provider: 'kukai', id: WALLET }], 'Kai Person');
    db.users.set(member.userId, member);
    const chain = new FakeTaquitoChain();
    const tokenId = kennel.sittingOfTheDay(kennel.losAngelesDate()).tokenId;
    const result = await claims.claimKennelClubDog({
      env: { AUTH_DB: db, KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake' },
      user: member,
      tokenId,
      chainFactory: async () => chain,
    });

    assert.equal(result.ok, true);
    assert.equal(result.claim.status, 'delivered');
    assert.deepEqual(chain.mints, [{ tokenId, deliveredTo: WALLET }]);
    assert.equal(db.claimFor(member.userId, tokenId).delivered_to, WALLET);
  });
});

test('unset secret stays closed and a low-balance wallet leaves a failed reservation', async () => {
  await withModules(async ({ claims }) => {
    const db = new FakeD1();
    const member = user('pcu_closed');
    db.users.set(member.userId, member);
    const closed = await claims.claimKennelClubDog({ env: { AUTH_DB: db }, user: member, tokenId: 1 });
    assert.deepEqual(closed, { ok: false, configured: false, reason: 'claim-wallet-not-configured' });

    const low = await claims.claimKennelClubDog({
      env: { AUTH_DB: db, KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake' },
      user: member,
      tokenId: 1,
      chainFactory: async () => new FakeTaquitoChain({ balance: 2_999_999 }),
    });
    assert.equal(low.reason, 'claim-wallet-low-balance');
    assert.equal(db.claims.size, 1);
    assert.equal([...db.claims.values()][0].status, 'failed');

    const raced = await claims.claimKennelClubDog({
      env: { AUTH_DB: db, KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake' },
      user: member,
      tokenId: 1,
      chainFactory: async () => { throw new Error('concurrent request reached the signer'); },
    });
    assert.equal(raced.reason, 'claim-in-progress');
  });
});

test('the global cap blocks another reservation and held delivery updates every dog after confirmation', async () => {
  await withModules(async ({ claims }) => {
    const db = new FakeD1();
    const member = user('pcu_delivery');
    db.users.set(member.userId, member);
    for (let index = 0; index < 2; index += 1) {
      db.claims.set(`claim_${index}`, {
        id: `claim_${index}`,
        user_id: member.userId,
        token_id: index,
        status: 'held',
        op_hash: `o${String(index + 2).repeat(50)}`,
        delivered_to: null,
        created_at: `2026-09-0${index + 1}T12:00:00.000Z`,
      });
    }
    const chain = new FakeTaquitoChain();
    const delivered = await claims.deliverHeldKennelClubDogs({
      env: { AUTH_DB: db, KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake' },
      userId: member.userId,
      deliveredTo: WALLET,
      chainFactory: async () => chain,
    });
    assert.equal(delivered.delivered, 2);
    assert.deepEqual(chain.deliveries, [{ tokenIds: [0, 1], deliveredTo: WALLET }]);
    assert.ok([...db.claims.values()].every((row) => row.status === 'delivered' && row.delivered_to === WALLET));

    db.claims.set('cap_1', {
      id: 'cap_1', user_id: 'someone_else', token_id: 5, status: 'failed',
      op_hash: null, delivered_to: null, created_at: '2026-09-02T00:00:00.000Z',
    });
    const capped = await claims.claimKennelClubDog({
      env: {
        AUTH_DB: db,
        KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake',
        KENNEL_CLUB_CLAIM_DAILY_CAP: '1',
      },
      user: member,
      tokenId: 5,
      chainFactory: async () => chain,
    });
    assert.equal(capped.reason, 'daily-cap-reached');
  });
});

test('public claim state counts rows and emits only a sanitized first name', async () => {
  await withModules(async ({ claims }) => {
    const db = new FakeD1();
    const member = user('pcu_public', [], 'Mina Fullname');
    db.users.set(member.userId, member);
    db.claims.set('public_held', {
      id: 'public_held', user_id: member.userId, token_id: 1, status: 'held',
      op_hash: OP_HASH, delivered_to: null, created_at: '2026-09-02T12:00:00.000Z',
    });
    db.claims.set('public_failed', {
      id: 'public_failed', user_id: member.userId, token_id: 1, status: 'failed',
      op_hash: null, delivered_to: null, created_at: '2026-09-02T11:00:00.000Z',
    });
    const result = await claims.getPublicKennelClaims(db, 1, { cap: 50, configured: true });
    assert.deepEqual({ capUsed: result.capUsed, claimed: result.claimed, held: result.held, failed: result.failed }, {
      capUsed: 2, claimed: 1, held: 1, failed: 1,
    });
    assert.deepEqual(result.recent.map(({ firstName, status }) => ({ firstName, status })), [
      { firstName: 'Mina', status: 'held' },
    ]);
  });
});

test('claim source batches mint plus transfer and links delivery from the Tezos auth flow', async () => {
  const [claimsSource, authSource, burstSource, redirectSource] = await Promise.all([
    readFile(new URL('functions/api/kennel-club/_claims.ts', root), 'utf8'),
    readFile(new URL('functions/api/auth/tezos.ts', root), 'utf8'),
    readFile(new URL('functions/api/burst.ts', root), 'utf8'),
    readFile(new URL('functions/k/[slug].ts', root), 'utf8'),
  ]);
  assert.match(claimsSource, /contract\.batch\(\)\.withContractCall/);
  assert.match(claimsSource, /methodsObject\.mint\(tokenId\)/);
  assert.match(claimsSource, /methodsObject\.transfer/);
  assert.match(claimsSource, /status = 'failed' AND created_at = \?/);
  assert.match(authSource, /waitUntil\(deliverHeldKennelClubDogs/);
  assert.match(burstSource, /body\.kind === 'mint' \|\| body\.kind === 'claim'/);
  assert.match(burstSource, /claim-not-verified/);
  assert.match(redirectSource, /route === 'today'/);
  assert.match(redirectSource, /\^\\d\{2\}\$/);
});
