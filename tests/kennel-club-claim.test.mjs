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
    if (sql.startsWith('SELECT j.claim_id, j.state')) {
      const job = db.jobs.get(args[0]);
      return job ? { ...job, op_hash: db.operations.get(job.operation_id)?.op_hash ?? null } : null;
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
    if (sql.startsWith('INSERT INTO kennel_signer_locks')) {
      const [name, holder, expiresAt, now] = args;
      const current = db.locks.get(name);
      if (!current || current.holder === null || current.expires_at <= now || current.holder === holder) {
        db.locks.set(name, { holder, expires_at: expiresAt });
        return { holder };
      }
      return null;
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
    if (sql.startsWith('SELECT r.claim_id, r.reservation_id') && sql.includes("state IN ('submitting', 'submitted')")) {
      return { results: [...db.reservations.values()]
        .filter((row) => row.user_id === args[0] && ['submitting', 'submitted'].includes(row.state))
        .map((row) => ({ ...row, token_id: db.claims.get(row.claim_id).token_id, op_hash: db.operations.get(row.operation_id)?.op_hash ?? null })) };
    }
    if (sql.startsWith('SELECT r.claim_id, r.reservation_id') && sql.includes("r.reservation_id = ?")) {
      return { results: [...db.reservations.values()]
        .filter((row) => row.reservation_id === args[0] && row.state === 'reserved')
        .map((row) => ({ ...row, token_id: db.claims.get(row.claim_id).token_id, op_hash: null })) };
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
    if (sql.startsWith('INSERT INTO kennel_claim_jobs')) {
      const [claimId, state, targetStatus, deliveredTo, error, updatedAt] = args;
      const prior = db.jobs.get(claimId);
      db.jobs.set(claimId, {
        claim_id: claimId, state, target_status: targetStatus, delivered_to: deliveredTo,
        operation_id: prior?.operation_id ?? null, error, updated_at: updatedAt,
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (sql.startsWith('INSERT INTO kennel_chain_operations')) {
      const [id, action, subjectId, opHash, submittedAt, updatedAt] = args;
      if (![...db.operations.values()].some((row) => row.op_hash === opHash)) {
        db.operations.set(id, { id, action, subject_id: subjectId, op_hash: opHash, status: 'submitted', submitted_at: submittedAt, updated_at: updatedAt });
      }
      return { success: true, meta: { changes: 1 } };
    }
    if (sql.startsWith('UPDATE kennel_claim_jobs SET state =')) {
      const job = db.jobs.get(args.at(-1));
      if (job) {
        if (sql.includes("state = 'submitting'")) Object.assign(job, { state: 'submitting', target_status: args[0], delivered_to: args[1], error: null, updated_at: args[2] });
        if (sql.includes("state = 'submitted'")) Object.assign(job, { state: 'submitted', operation_id: args[0], error: sql.includes('error = ?') ? args[1] : null, updated_at: sql.includes('error = ?') ? args[2] : args[1] });
        if (sql.includes("state = 'confirmed'")) Object.assign(job, { state: 'confirmed', error: null, updated_at: args[0] });
      }
      return { success: true, meta: { changes: job ? 1 : 0 } };
    }
    if (sql.startsWith('UPDATE kennel_chain_operations SET status =')) {
      const operation = sql.includes('WHERE id = ?') ? db.operations.get(args.at(-1)) : [...db.operations.values()].find((row) => row.op_hash === args.at(-1));
      if (operation) Object.assign(operation, { status: args[0] ?? (sql.includes("'applied'") ? 'applied' : operation.status), error: args[1] ?? null });
      return { success: true, meta: { changes: operation ? 1 : 0 } };
    }
    if (sql.startsWith('UPDATE claims SET op_hash = ?, delivered_to = ?')) {
      const row = db.claims.get(args[2]);
      if (row) Object.assign(row, { op_hash: args[0], delivered_to: args[1] });
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }
    if (sql.startsWith('UPDATE kennel_signer_locks SET holder = NULL')) {
      const lock = db.locks.get(args[0]);
      if (lock?.holder === args[1]) Object.assign(lock, { holder: null, expires_at: null });
      return { success: true, meta: { changes: lock ? 1 : 0 } };
    }
    if (sql.startsWith('INSERT INTO kennel_delivery_reservations')) {
      const [claimId, reservationId, userId, target, createdAt, updatedAt] = args;
      const claim = db.claims.get(claimId);
      const prior = db.reservations.get(claimId);
      if (claim?.status === 'held' && (!prior || prior.state === 'failed')) {
        db.reservations.set(claimId, { claim_id: claimId, reservation_id: reservationId, user_id: userId, delivered_to: target, state: 'reserved', operation_id: null, error: null, created_at: prior?.created_at ?? createdAt, updated_at: updatedAt });
        return { success: true, meta: { changes: 1 } };
      }
      return { success: true, meta: { changes: 0 } };
    }
    if (sql.startsWith('UPDATE kennel_delivery_reservations SET state =')) {
      const isBatch = sql.includes('WHERE reservation_id = ?');
      const rows = [...db.reservations.values()].filter((row) => isBatch ? row.reservation_id === args.at(-1) : row.claim_id === args.at(-1));
      for (const row of rows) {
        if (sql.includes("state = 'submitting'")) Object.assign(row, { state: 'submitting', updated_at: args[0] });
        if (sql.includes("state = 'submitted'")) Object.assign(row, { state: 'submitted', operation_id: args[0], error: args[1] ?? null, updated_at: args[2] ?? args[1] });
        if (sql.includes("state = 'confirmed'")) Object.assign(row, { state: 'confirmed', error: null, updated_at: args[0] });
        if (sql.includes("state = 'failed'")) Object.assign(row, { state: 'failed', error: args[0], updated_at: args[1] });
      }
      return { success: true, meta: { changes: rows.length } };
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
    this.jobs = new Map();
    this.operations = new Map();
    this.reservations = new Map();
    this.locks = new Map();
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
  constructor({ balance = 4_000_000, failAfterMintInjection = false, failAfterDeliveryInjection = false } = {}) {
    this.address = 'tz1Rugft6gx3ZtSj8BUQSUnHEPbbUqVy7qXf';
    this.balance = balance;
    this.reveals = 0;
    this.mints = [];
    this.deliveries = [];
    this.statuses = new Map();
    this.failAfterMintInjection = failAfterMintInjection;
    this.failAfterDeliveryInjection = failAfterDeliveryInjection;
  }

  async balanceMutez() { return this.balance; }
  async ensureRevealed() { this.reveals += 1; }
  async operationStatus(opHash) { return this.statuses.get(opHash) ?? 'pending'; }
  async mint(tokenId, deliveredTo, onInjected) {
    this.mints.push({ tokenId, deliveredTo });
    await onInjected(OP_HASH);
    if (this.failAfterMintInjection) throw new Error('confirmation-timeout');
    return { opHash: OP_HASH };
  }
  async deliver(tokenIds, deliveredTo, onInjected) {
    this.deliveries.push({ tokenIds, deliveredTo });
    await onInjected(OP_HASH);
    if (this.failAfterDeliveryInjection) throw new Error('confirmation-timeout');
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
  const [migration, safety] = await Promise.all([
    readFile(new URL('migrations/auth/0004_kennel_club_claims.sql', root), 'utf8'),
    readFile(new URL('migrations/auth/0010_kennel_operation_safety.sql', root), 'utf8'),
  ]);
  assert.match(migration, /UNIQUE \(user_id, token_id\)/);
  assert.match(migration, /status IN \('held', 'delivered', 'failed'\)/);
  assert.match(migration, /FOREIGN KEY \(user_id\) REFERENCES users\(id\) ON DELETE CASCADE/);
  assert.match(safety, /CREATE TABLE kennel_signer_locks/);
  assert.match(safety, /CREATE TABLE kennel_chain_operations/);
  assert.match(safety, /op_hash TEXT NOT NULL UNIQUE/);
  assert.match(safety, /CREATE TABLE kennel_delivery_reservations/);
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

test('an injected mint hash survives confirmation failure and retry reconciles without spending again', async () => {
  await withModules(async ({ claims }) => {
    const db = new FakeD1();
    const member = user('pcu_reconcile');
    db.users.set(member.userId, member);
    const firstChain = new FakeTaquitoChain({ failAfterMintInjection: true });
    const first = await claims.claimKennelClubDog({
      env: { AUTH_DB: db, KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake' },
      user: member,
      tokenId: 4,
      chainFactory: async () => firstChain,
    });
    assert.equal(first.reason, 'claim-confirmation-pending');
    const row = db.claimFor(member.userId, 4);
    assert.equal(row.op_hash, OP_HASH, 'hash is persisted before confirmation');
    assert.equal(db.jobs.get(row.id).state, 'submitted');
    assert.equal([...db.operations.values()][0].op_hash, OP_HASH);

    const retryChain = new FakeTaquitoChain();
    retryChain.statuses.set(OP_HASH, 'applied');
    const retry = await claims.claimKennelClubDog({
      env: { AUTH_DB: db, KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake' },
      user: member,
      tokenId: 4,
      chainFactory: async () => retryChain,
    });
    assert.equal(retry.ok, true);
    assert.equal(retry.claim.opHash, OP_HASH);
    assert.equal(retryChain.mints.length, 0, 'reconciliation never mints twice');
  });
});

test('an injected delivery is reserved once and a pending retry never transfers twice', async () => {
  await withModules(async ({ claims }) => {
    const db = new FakeD1();
    const member = user('pcu_delivery_reconcile');
    db.users.set(member.userId, member);
    db.claims.set('held_once', {
      id: 'held_once', user_id: member.userId, token_id: 1, status: 'held',
      op_hash: `o${'2'.repeat(50)}`, delivered_to: null, created_at: '2026-09-02T12:00:00.000Z',
    });
    const firstChain = new FakeTaquitoChain({ failAfterDeliveryInjection: true });
    const first = await claims.deliverHeldKennelClubDogs({
      env: { AUTH_DB: db, KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake' },
      userId: member.userId,
      deliveredTo: WALLET,
      chainFactory: async () => firstChain,
    });
    assert.equal(first.reason, 'delivery-in-progress');
    assert.equal(db.reservations.get('held_once').state, 'submitted');
    assert.equal(db.claims.get('held_once').op_hash, OP_HASH);

    const retryChain = new FakeTaquitoChain();
    const retry = await claims.deliverHeldKennelClubDogs({
      env: { AUTH_DB: db, KENNEL_CLUB_CLAIM_SECRET_KEY: 'unencrypted:fake' },
      userId: member.userId,
      deliveredTo: WALLET,
      chainFactory: async () => retryChain,
    });
    assert.equal(retry.reason, 'delivery-in-progress');
    assert.equal(retryChain.deliveries.length, 0, 'reserved pending inventory is not transferred twice');
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
  assert.match(claimsSource, /kennel_signer_locks/);
  assert.match(claimsSource, /kennel_chain_operations/);
  assert.match(claimsSource, /kennel_delivery_reservations/);
  assert.match(authSource, /waitUntil\(deliverHeldKennelClubDogs/);
  assert.match(burstSource, /body\.kind === 'mint' \|\| body\.kind === 'claim'/);
  assert.match(burstSource, /claim-not-verified/);
  assert.match(redirectSource, /route === 'today'/);
  assert.match(redirectSource, /\^\\d\{2\}\$/);
});
