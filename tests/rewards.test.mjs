import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);
const TONEBLOOM_SECRET = 'test-secret-tonebloom';
const INDUSTRYNEXT_SECRET = 'test-secret-industrynext';

async function withModules(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const [rewards, claims, lib, claim, runs] = await Promise.all([
      server.ssrLoadModule('/src/lib/rewards.ts'),
      server.ssrLoadModule('/functions/api/faucet/_claims.ts'),
      server.ssrLoadModule('/src/lib/faucet.ts'),
      server.ssrLoadModule('/functions/api/faucet/[slug]/claim.ts'),
      server.ssrLoadModule('/functions/api/reward-runs.ts'),
    ]);
    return await run({ rewards, claims, lib, claim, runs });
  } finally {
    await server.close();
  }
}

/**
 * A D1-shaped shim over real SQLite. `batch` is a real transaction here,
 * because that is the only property the reward path leans on: consuming a
 * receipt and writing its ledger line either both happen or neither does.
 * The statements inside a batch run without awaiting anything, so two
 * concurrent batches cannot interleave, which is what D1 gives us too.
 */
class FakeD1 {
  constructor(sqlFiles) {
    this.db = new DatabaseSync(':memory:');
    for (const sql of sqlFiles) this.db.exec(sql);
    this.failOn = null;
  }

  prepare(sql) {
    const db = this.db;
    const failing = () => this.failOn && this.failOn(sql);
    let args = [];
    const statement = {
      sql,
      bind(...values) { args = values; return statement; },
      runSync() { if (failing()) throw new Error('d1-unavailable'); return db.prepare(sql).run(...args); },
      async first() { if (failing()) throw new Error('d1-unavailable'); return db.prepare(sql).get(...args) ?? null; },
      async all() { if (failing()) throw new Error('d1-unavailable'); return { results: db.prepare(sql).all(...args) }; },
      async run() { return statement.runSync(); },
    };
    return statement;
  }

  async batch(statements) {
    this.db.exec('BEGIN');
    try {
      const out = statements.map((statement) => statement.runSync());
      this.db.exec('COMMIT');
      return out;
    } catch (error) {
      try { this.db.exec('ROLLBACK'); } catch { /* already unwound */ }
      throw error;
    }
  }
}

class FakeKV {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
}

async function freshDb() {
  const files = await Promise.all([
    readFile(new URL('migrations/auth/0001_init.sql', root), 'utf8'),
    readFile(new URL('migrations/auth/0009_faucet_claims.sql', root), 'utf8'),
    readFile(new URL('migrations/auth/0010_faucet_signed_tx.sql', root), 'utf8'),
    readFile(new URL('migrations/auth/0011_reward_runs.sql', root), 'utf8'),
  ]);
  const db = new FakeD1(files);
  for (const [id, name] of [['u1', 'Mike'], ['u2', 'Ada'], ['u3', 'Sam']]) {
    db.db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)')
      .run(id, JSON.stringify({ userId: id, preferredName: name, identities: [] }), '2026-09-04T00:00:00Z');
  }
  db.db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run('tok1', 'u1', Date.now() + 86_400_000);
  db.db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run('tok2', 'u2', Date.now() + 86_400_000);
  return db;
}

const envFor = (db) => ({
  AUTH_DB: db,
  USERS: new FakeKV(),
  REWARDS_TONEBLOOM_SECRET: TONEBLOOM_SECRET,
  REWARDS_INDUSTRYNEXT_SECRET: INDUSTRYNEXT_SECRET,
});

const user = (userId) => ({ userId, createdAt: '2026-09-04T00:00:00Z', identities: [], preferredName: 'Mike' });

const signedIn = (url, init = {}, token = 'tok1') => new Request(url, {
  ...init,
  headers: { cookie: `pc_session=${token}`, 'Sec-Fetch-Site': 'same-origin', ...(init.headers ?? {}) },
});

const claimRows = (db, faucet = 'fishclub') => db.db
  .prepare('SELECT * FROM faucet_claims WHERE faucet = ? ORDER BY created_at ASC').all(faucet);
const receiptRows = (db) => db.db.prepare('SELECT * FROM reward_receipts').all();
const runRow = (db, id) => db.db.prepare('SELECT * FROM reward_runs WHERE id = ?').get(id);

function seedRun(db, overrides = {}) {
  const run = {
    id: `run_${Math.random().toString(16).slice(2)}`,
    userId: 'u1',
    issuer: 'tonebloom',
    program: 'fishclub-tonebloom',
    faucet: 'fishclub',
    status: 'open',
    expiresAt: new Date(Date.now() + 7_200_000).toISOString(),
    ...overrides,
  };
  db.db.prepare(`
    INSERT INTO reward_runs (id, user_id, issuer, program, faucet, status, created_at, expires_at, launch_nonce)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(run.id, run.userId, run.issuer, run.program, run.faucet, run.status, new Date().toISOString(), run.expiresAt, 'launch-nonce');
  return run;
}

let nonceCounter = 0;
async function signReceipt(rewards, overrides = {}) {
  const iat = overrides.iat ?? Math.floor(Date.now() / 1000);
  nonceCounter += 1;
  const payload = {
    v: 1,
    kid: 'tonebloom-1',
    iss: 'tonebloom',
    aud: 'pointcast-rewards',
    program: 'fishclub-tonebloom',
    run: overrides.run,
    startedAt: overrides.startedAt ?? iat - 320,
    finishedAt: overrides.finishedAt ?? iat - 5,
    creditedSeconds: overrides.creditedSeconds ?? 312,
    nonce: overrides.nonce ?? `nonce${nonceCounter}`,
    iat,
    exp: overrides.exp ?? iat + 1800,
  };
  for (const key of ['kid', 'iss', 'aud', 'program']) {
    if (overrides[key] !== undefined) payload[key] = overrides[key];
  }
  return rewards.signRewardToken('receipt', payload, overrides.secret ?? TONEBLOOM_SECRET);
}

// ---------------------------------------------------------------------------
// The token format
// ---------------------------------------------------------------------------

test('the published test vectors are what the code produces', async () => {
  await withModules(async ({ rewards }) => {
    const launch = {
      v: 1,
      kid: 'tonebloom-1',
      iss: 'pointcast',
      aud: 'tonebloom',
      program: 'fishclub-tonebloom',
      run: 'run_0000000000000000000000000000002a',
      iat: 1788480000,
      exp: 1788480300,
      nonce: '5f2c1a0e6b7d4c8fa9013e2b4c6d8e00',
    };
    const receipt = {
      v: 1,
      kid: 'tonebloom-1',
      iss: 'tonebloom',
      aud: 'pointcast-rewards',
      program: 'fishclub-tonebloom',
      run: 'run_0000000000000000000000000000002a',
      startedAt: 1788480060,
      finishedAt: 1788480375,
      creditedSeconds: 312,
      nonce: '9a8b7c6d5e4f30211203040506070809',
      iat: 1788480380,
      exp: 1788482180,
    };
    // These strings are printed in docs/plans/2026-09-05-rewards-protocol.md.
    // A satellite checks its implementation against them byte for byte, so a
    // change here is a change to the published protocol.
    assert.equal(
      await rewards.signRewardToken('launch', launch, TONEBLOOM_SECRET),
      'v1.eyJ2IjoxLCJraWQiOiJ0b25lYmxvb20tMSIsImlzcyI6InBvaW50Y2FzdCIsImF1ZCI6InRvbmVibG9vbSIsInByb2dyYW0iOiJmaXNoY2x1Yi10b25lYmxvb20iLCJydW4iOiJydW5fMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMmEiLCJpYXQiOjE3ODg0ODAwMDAsImV4cCI6MTc4ODQ4MDMwMCwibm9uY2UiOiI1ZjJjMWEwZTZiN2Q0YzhmYTkwMTNlMmI0YzZkOGUwMCJ9.NccQFSH5B7MTg_-ohF4lWdnLhLBf2rd3m1SO6kDRTyg',
    );
    assert.equal(
      await rewards.signRewardToken('receipt', receipt, TONEBLOOM_SECRET),
      'v1.eyJ2IjoxLCJraWQiOiJ0b25lYmxvb20tMSIsImlzcyI6InRvbmVibG9vbSIsImF1ZCI6InBvaW50Y2FzdC1yZXdhcmRzIiwicHJvZ3JhbSI6ImZpc2hjbHViLXRvbmVibG9vbSIsInJ1biI6InJ1bl8wMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAyYSIsInN0YXJ0ZWRBdCI6MTc4ODQ4MDA2MCwiZmluaXNoZWRBdCI6MTc4ODQ4MDM3NSwiY3JlZGl0ZWRTZWNvbmRzIjozMTIsIm5vbmNlIjoiOWE4YjdjNmQ1ZTRmMzAyMTEyMDMwNDA1MDYwNzA4MDkiLCJpYXQiOjE3ODg0ODAzODAsImV4cCI6MTc4ODQ4MjE4MH0.rjEUxr3eQpO5BTe4G6fOguTcRCOxVK9dvfr6hmiYiZc',
    );
    assert.equal(
      rewards.launchUrlFor(rewards.getRewardProgram('fishclub-tonebloom'), 'TICKET'),
      'https://tonebloom.xyz/fishclub#launch=TICKET',
    );
  });
});

test('a token round trips, and every wrong one is refused', async () => {
  await withModules(async ({ rewards }) => {
    const secrets = { 'tonebloom-1': TONEBLOOM_SECRET };
    const iat = 1788480000;
    const payload = {
      v: 1, kid: 'tonebloom-1', iss: 'pointcast', aud: 'tonebloom',
      program: 'fishclub-tonebloom', run: 'run_a', iat, exp: iat + 300, nonce: 'n1',
    };
    const token = await rewards.signRewardToken('launch', payload, TONEBLOOM_SECRET);

    const good = await rewards.verifyRewardToken('launch', token, secrets, iat + 10);
    assert.equal(good.ok, true);
    assert.deepEqual(good.payload, payload);

    // Domain separation: the same bytes signed for one purpose never verify
    // for the other, which is what stops a launch ticket being spent as a receipt.
    assert.equal((await rewards.verifyRewardToken('receipt', token, secrets, iat + 10)).reason, 'bad-signature');

    const [v, body, sig] = token.split('.');
    const tamperedBody = rewards.base64urlFromString(JSON.stringify({ ...payload, run: 'run_b' }));
    assert.equal((await rewards.verifyRewardToken('launch', `${v}.${tamperedBody}.${sig}`, secrets, iat + 10)).reason, 'bad-signature');
    assert.equal((await rewards.verifyRewardToken('launch', `${v}.${body}.${'A'.repeat(43)}`, secrets, iat + 10)).reason, 'bad-signature');

    assert.equal((await rewards.verifyRewardToken('launch', token, secrets, iat + 301)).reason, 'expired');
    assert.equal((await rewards.verifyRewardToken('launch', token, {}, iat + 10)).reason, 'unknown-kid');
    assert.equal((await rewards.verifyRewardToken('launch', token, { 'tonebloom-2': TONEBLOOM_SECRET }, iat + 10)).reason, 'unknown-kid');

    for (const malformed of ['', 'nope', `v2.${body}.${sig}`, `${v}.${body}`, `${v}.${body}+.${sig}`, `${v}.!!.${sig}`]) {
      assert.equal((await rewards.verifyRewardToken('launch', malformed, secrets, iat + 10)).reason, 'malformed', malformed);
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/reward-runs
// ---------------------------------------------------------------------------

test('starting a run needs a session, a same-site request and an unclaimed day', async () => {
  await withModules(async ({ runs, claims, lib }) => {
    const db = await freshDb();
    const env = envFor(db);
    const url = 'https://pointcast.xyz/api/reward-runs';
    const body = JSON.stringify({ program: 'fishclub-tonebloom' });

    const crossSite = await runs.handleRewardRunPost(new Request(url, {
      method: 'POST', body, headers: { cookie: 'pc_session=tok1', 'Sec-Fetch-Site': 'cross-site' },
    }), env);
    assert.equal(crossSite.status, 403);
    assert.equal((await crossSite.json()).reason, 'cross-site');

    // No Sec-Fetch-Site and no Origin is not a browser on this page either.
    const bare = await runs.handleRewardRunPost(new Request(url, { method: 'POST', body, headers: { cookie: 'pc_session=tok1' } }), env);
    assert.equal(bare.status, 403);

    const anon = await runs.handleRewardRunPost(new Request(url, { method: 'POST', body, headers: { 'Sec-Fetch-Site': 'same-origin' } }), env);
    assert.equal(anon.status, 401);

    const unknown = await runs.handleRewardRunPost(signedIn(url, { method: 'POST', body: JSON.stringify({ program: 'nope' }) }), env);
    assert.equal(unknown.status, 404);

    // An Origin that matches is the other accepted shape.
    const byOrigin = await runs.handleRewardRunPost(new Request(url, {
      method: 'POST', body, headers: { cookie: 'pc_session=tok1', Origin: 'https://pointcast.xyz' },
    }), env);
    assert.equal(byOrigin.status, 200);

    // Already holding today's FISHCLUB: no run is created and the answer says so.
    db.db.prepare('DELETE FROM reward_runs').run();
    await claims.claimFaucetDrip({
      env, user: user('u1'), faucet: lib.getFaucet('hello'), day: lib.losAngelesDate(),
    });
    const claimed = await runs.handleRewardRunPost(signedIn(url, { method: 'POST', body: JSON.stringify({ program: 'industrynext-hello' }) }), env);
    assert.equal(claimed.status, 409);
    assert.equal((await claimed.json()).reason, 'already-claimed-today');
    assert.equal(db.db.prepare("SELECT COUNT(*) AS n FROM reward_runs WHERE program = 'industrynext-hello'").get().n, 0);
  });
});

test('a second start resumes the same open run, and a missing secret creates nothing', async () => {
  await withModules(async ({ runs }) => {
    const db = await freshDb();
    const env = envFor(db);
    const url = 'https://pointcast.xyz/api/reward-runs';
    const post = (environment) => runs.handleRewardRunPost(
      signedIn(url, { method: 'POST', body: JSON.stringify({ program: 'fishclub-tonebloom' }) }),
      environment,
    );

    const first = await (await post(env)).json();
    assert.equal(first.ok, true);
    assert.ok(first.run.id.startsWith('run_'));
    assert.equal(first.run.faucet, 'fishclub');
    assert.ok(first.launchUrl.startsWith('https://tonebloom.xyz/fishclub#launch=v1.'));
    assert.ok(Date.parse(first.expiresAt) > Date.now());

    const second = await (await post(env)).json();
    assert.equal(second.run.id, first.run.id, 'one active run per account per program');
    assert.equal(db.db.prepare('SELECT COUNT(*) AS n FROM reward_runs').get().n, 1);

    // An expired run is closed out rather than resumed.
    db.db.prepare('UPDATE reward_runs SET expires_at = ? WHERE id = ?').run('2020-01-01T00:00:00Z', first.run.id);
    const third = await (await post(env)).json();
    assert.notEqual(third.run.id, first.run.id);
    assert.equal(runRowStatus(db, first.run.id), 'expired');

    const unconfigured = await post({ ...env, REWARDS_TONEBLOOM_SECRET: undefined });
    assert.equal(unconfigured.status, 503);
    assert.equal((await unconfigured.json()).reason, 'rewards-not-configured');
    assert.equal(db.db.prepare('SELECT COUNT(*) AS n FROM reward_runs').get().n, 2, 'nothing new when the ticket cannot be signed');
  });
});

const runRowStatus = (db, id) => db.db.prepare('SELECT status FROM reward_runs WHERE id = ?').get(id)?.status;

// ---------------------------------------------------------------------------
// Redeeming a receipt
// ---------------------------------------------------------------------------

test('a good receipt writes exactly one held line and redeems the run', async () => {
  await withModules(async ({ claims, lib, rewards }) => {
    const db = await freshDb();
    const env = envFor(db);
    const faucet = lib.getFaucet('fishclub');
    const day = lib.losAngelesDate();
    const run = seedRun(db);
    const receipt = await signReceipt(rewards, { run: run.id });

    const result = await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day, receipt });
    assert.equal(result.ok, true);
    assert.equal(result.claim.program, 'fishclub-tonebloom');
    assert.equal(result.claim.rewardRunId, run.id);
    assert.equal(result.claim.via, null, 'Tone Bloom is the token’s own room, not an elsewhere');

    const rows = claimRows(db);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, 'held');
    assert.equal(rows[0].reward_run_id, run.id);
    assert.equal(rows[0].program, 'fishclub-tonebloom');

    const consumed = receiptRows(db);
    assert.equal(consumed.length, 1);
    assert.equal(consumed[0].claim_id, rows[0].id);
    assert.equal(consumed[0].issuer, 'tonebloom');

    const after = runRow(db, run.id);
    assert.equal(after.status, 'redeemed');
    assert.equal(after.redeemed_claim_id, rows[0].id);

    // The same receipt again inside its window returns the same line.
    const replay = await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day, receipt });
    assert.equal(replay.ok, true);
    assert.equal(replay.replay, true);
    assert.equal(replay.claim.id, rows[0].id);
    assert.equal(claimRows(db).length, 1, 'no second line');

    // And tomorrow, with the receipt now stale, it awards nothing at all.
    const stale = await signReceipt(rewards, {
      run: run.id, nonce: consumed[0].nonce, iat: Math.floor(Date.now() / 1000) - 4000, exp: Math.floor(Date.now() / 1000) - 100,
    });
    const nextDay = await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day: '2026-09-06', receipt: stale });
    assert.deepEqual([nextDay.ok, nextDay.reason], [false, 'receipt-expired']);
    assert.equal(claimRows(db).length, 1);
  });
});

test('two claims racing the same receipt produce exactly one line', async () => {
  await withModules(async ({ claims, lib, rewards }) => {
    const db = await freshDb();
    const env = envFor(db);
    const faucet = lib.getFaucet('fishclub');
    const day = lib.losAngelesDate();
    const run = seedRun(db);
    const receipt = await signReceipt(rewards, { run: run.id });

    const [a, b] = await Promise.all([
      claims.claimFaucetDrip({ env, user: user('u1'), faucet, day, receipt }),
      claims.claimFaucetDrip({ env, user: user('u1'), faucet, day, receipt }),
    ]);
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    assert.equal(a.claim.id, b.claim.id, 'both browsers are shown the same line');
    assert.equal(claimRows(db).length, 1);
    assert.equal(receiptRows(db).length, 1);
  });
});

test('a receipt for someone else’s run awards nothing and consumes nothing', async () => {
  await withModules(async ({ claims, lib, rewards }) => {
    const db = await freshDb();
    const env = envFor(db);
    const faucet = lib.getFaucet('fishclub');
    const day = lib.losAngelesDate();
    const run = seedRun(db, { userId: 'u2' });
    const receipt = await signReceipt(rewards, { run: run.id });

    const result = await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day, receipt });
    assert.deepEqual([result.ok, result.reason], [false, 'account-mismatch']);
    assert.equal(claimRows(db).length, 0);
    assert.equal(receiptRows(db).length, 0);
    assert.equal(runRowStatus(db, run.id), 'open', 'the run still belongs to whoever started it');

    // The account that started it can still finish it.
    const owner = await claims.claimFaucetDrip({ env, user: user('u2'), faucet, day, receipt });
    assert.equal(owner.ok, true);
  });
});

test('wrong issuer, wrong program, expired and under-duration receipts award nothing', async () => {
  await withModules(async ({ claims, lib, rewards }) => {
    const db = await freshDb();
    const env = envFor(db);
    const faucet = lib.getFaucet('fishclub');
    const day = lib.losAngelesDate();
    const run = seedRun(db);
    const now = Math.floor(Date.now() / 1000);
    const attempt = (receipt) => claims.claimFaucetDrip({ env, user: user('u1'), faucet, day, receipt });

    const cases = [
      ['receipt-invalid', await signReceipt(rewards, { run: run.id, secret: 'not-the-secret' })],
      ['receipt-invalid', await signReceipt(rewards, { run: run.id, aud: 'somebody-else' })],
      ['receipt-program-mismatch', await signReceipt(rewards, { run: run.id, iss: 'industrynext' })],
      ['receipt-program-mismatch', await signReceipt(rewards, {
        run: run.id, program: 'industrynext-hello', kid: 'industrynext-1', iss: 'industrynext', secret: INDUSTRYNEXT_SECRET,
      })],
      ['receipt-expired', await signReceipt(rewards, { run: run.id, iat: now - 4000, exp: now - 60 })],
      ['receipt-too-short', await signReceipt(rewards, { run: run.id, creditedSeconds: 120 })],
      ['receipt-too-short', await signReceipt(rewards, { run: run.id, startedAt: now - 100, finishedAt: now - 5 })],
      ['receipt-too-short', await signReceipt(rewards, { run: run.id, startedAt: now, finishedAt: now - 400 })],
      ['run-not-found', await signReceipt(rewards, { run: 'run_nothing' })],
    ];
    for (const [reason, receipt] of cases) {
      const result = await attempt(receipt);
      assert.deepEqual([result.ok, result.reason], [false, reason]);
    }
    assert.equal(claimRows(db).length, 0, 'nothing was awarded');
    assert.equal(receiptRows(db).length, 0, 'nothing was consumed');
    assert.equal(runRowStatus(db, run.id), 'open');

    // An unknown kid on a deploy holding no secret at all is refused before anything else.
    const bare = await claims.claimFaucetDrip({
      env: { AUTH_DB: db }, user: user('u1'), faucet, day, receipt: await signReceipt(rewards, { run: run.id }),
    });
    assert.deepEqual([bare.ok, bare.reason], [false, 'rewards-not-configured']);

    // A resolved run cannot be finished again with a fresh receipt.
    db.db.prepare("UPDATE reward_runs SET status = 'resolved' WHERE id = ?").run(run.id);
    const closed = await attempt(await signReceipt(rewards, { run: run.id }));
    assert.deepEqual([closed.ok, closed.reason], [false, 'run-expired']);
    assert.equal(receiptRows(db).length, 0);
  });
});

test('a full daily cap consumes nothing and resolves the run', async () => {
  await withModules(async ({ claims, lib, rewards }) => {
    const db = await freshDb();
    const env = { ...envFor(db), FISHCLUB_FAUCET_DAILY_CAP: '1' };
    const faucet = lib.getFaucet('fishclub');
    const day = lib.losAngelesDate();
    // Somebody else took the only fish today.
    db.db.prepare(`
      INSERT INTO faucet_claims (id, user_id, faucet, day, amount, status, created_at)
      VALUES ('fct_taken', 'u3', 'fishclub', ?, 1, 'held', ?)
    `).run(day, new Date().toISOString());

    const run = seedRun(db);
    const result = await claims.claimFaucetDrip({
      env, user: user('u1'), faucet, day, receipt: await signReceipt(rewards, { run: run.id }),
    });
    assert.deepEqual([result.ok, result.reason], [false, 'daily-cap-reached']);
    assert.equal(claimRows(db).length, 1, 'only the line that was already there');
    assert.equal(receiptRows(db).length, 0, 'the receipt was not burned');
    const after = runRow(db, run.id);
    assert.equal(after.status, 'resolved');
    assert.equal(after.resolved_reason, 'daily-cap-reached');
  });
});

test('a ledger write that fails leaves the receipt unspent', async () => {
  await withModules(async ({ claims, lib, rewards }) => {
    const db = await freshDb();
    const env = envFor(db);
    const faucet = lib.getFaucet('fishclub');
    const day = lib.losAngelesDate();
    const run = seedRun(db);
    const receipt = await signReceipt(rewards, { run: run.id });

    db.failOn = (sql) => sql.includes('INSERT INTO faucet_claims');
    await assert.rejects(() => claims.claimFaucetDrip({ env, user: user('u1'), faucet, day, receipt }));
    db.failOn = null;

    assert.equal(claimRows(db).length, 0);
    assert.equal(receiptRows(db).length, 0, 'the whole batch rolled back');
    assert.equal(runRowStatus(db, run.id), 'open');

    // Which is the point: the retry still works.
    const retry = await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day, receipt });
    assert.equal(retry.ok, true);
    assert.equal(claimRows(db).length, 1);
    assert.equal(receiptRows(db).length, 1);
  });
});

test('an Industry Next receipt marks a HELLO line, and a second one the same day changes nothing', async () => {
  await withModules(async ({ claims, lib, rewards }) => {
    const db = await freshDb();
    const env = envFor(db);
    const faucet = lib.getFaucet('hello');
    const day = lib.losAngelesDate();
    const greeting = (run, nonce) => signReceipt(rewards, {
      run, nonce, program: 'industrynext-hello', issuer: 'industrynext', iss: 'industrynext',
      kid: 'industrynext-1', secret: INDUSTRYNEXT_SECRET, creditedSeconds: 0,
      startedAt: Math.floor(Date.now() / 1000) - 2, finishedAt: Math.floor(Date.now() / 1000) - 1,
    });
    const runOptions = { issuer: 'industrynext', program: 'industrynext-hello', faucet: 'hello' };

    const first = seedRun(db, runOptions);
    const claimed = await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day, receipt: await greeting(first.id) });
    assert.equal(claimed.ok, true);
    assert.equal(claimed.claim.via, 'industrynext');

    const rows = claimRows(db, 'hello');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].via, 'industrynext');
    assert.equal(rows[0].program, 'industrynext-hello');

    // A second greeting the same day: truthful, and it never rewrites the first
    // line's provenance or hands out a second HELLO.
    const second = seedRun(db, runOptions);
    const again = await claims.claimFaucetDrip({ env, user: user('u1'), faucet, day, receipt: await greeting(second.id) });
    assert.deepEqual([again.ok, again.reason], [false, 'already-claimed']);
    const still = claimRows(db, 'hello');
    assert.equal(still.length, 1);
    assert.deepEqual([still[0].id, still[0].via, still[0].reward_run_id], [rows[0].id, 'industrynext', first.id]);
    assert.equal(receiptRows(db).length, 1, 'the second greeting was not consumed');
    assert.equal(runRow(db, second.id).resolved_reason, 'already-claimed');

    // The plain HELLO button still works on a fresh day, with no provenance.
    const plain = await claims.claimFaucetDrip({ env, user: user('u2'), faucet, day });
    assert.equal(plain.ok, true);
    assert.equal(plain.claim.via, null);
  });
});

// ---------------------------------------------------------------------------
// The claim endpoint
// ---------------------------------------------------------------------------

test('the claim endpoint refuses a FISHCLUB claim with no receipt and carries one that has it', async () => {
  await withModules(async ({ claim, lib, rewards }) => {
    const db = await freshDb();
    const env = envFor(db);
    const url = 'https://pointcast.xyz/api/faucet/fishclub/claim';

    const bare = await claim.handleFaucetClaim(signedIn(url, { method: 'POST' }), env, 'fishclub');
    assert.equal(bare.status, 400);
    const bareBody = await bare.json();
    assert.equal(bareBody.reason, 'receipt-required');
    assert.equal(bareBody.claimMode, 'receipt');
    assert.equal(claimRows(db).length, 0);

    const anon = await claim.handleFaucetClaim(new Request(url, { method: 'POST' }), env, 'fishclub');
    assert.equal(anon.status, 401);

    const run = seedRun(db);
    const receipt = await signReceipt(rewards, { run: run.id });
    const kept = await claim.handleFaucetClaim(signedIn(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receipt }),
    }), env, 'fishclub');
    assert.equal(kept.status, 200);
    const keptBody = await kept.json();
    assert.equal(keptBody.ok, true);
    assert.equal(keptBody.claim.program, 'fishclub-tonebloom');
    assert.equal(keptBody.configured, false, 'no FISHCLUB spigot key is installed, and the desk says so');

    // Someone else's run, through the endpoint, is a 403 with neutral copy.
    const theirs = seedRun(db, { userId: 'u2' });
    const mismatched = await claim.handleFaucetClaim(signedIn(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt: await signReceipt(rewards, { run: theirs.id }) }),
    }), env, 'fishclub');
    assert.equal(mismatched.status, 403);
    assert.equal((await mismatched.json()).reason, 'account-mismatch');

    // The HELLO button is untouched: no receipt, no complaint.
    const hello = await claim.handleFaucetClaim(signedIn('https://pointcast.xyz/api/faucet/hello/claim', { method: 'POST' }), env, 'hello');
    assert.equal(hello.status, 200);
    assert.equal((await hello.json()).claimMode, 'button');
    assert.equal(lib.getFaucet('fishclub').claim, 'receipt');
  });
});

test('the desk payload carries both balances and the claim mode', async () => {
  await withModules(async ({ claims, lib }) => {
    const db = await freshDb();
    const env = envFor(db);
    const day = lib.losAngelesDate();
    await claims.claimFaucetDrip({ env, user: user('u1'), faucet: lib.getFaucet('hello'), day });
    const balances = await claims.getFaucetBalances(db, 'u1');
    assert.deepEqual(balances, [
      { slug: 'hello', ticker: 'HELLO', held: 1, delivered: 0 },
      { slug: 'fishclub', ticker: 'FISHCLUB', held: 0, delivered: 0 },
    ]);
    const ledger = await claims.getUserFaucetLedger(db, lib.getFaucet('hello'), user('u1'), day);
    assert.equal(ledger.claims[0].via, null);
    assert.equal(ledger.claims[0].program, null);
  });
});

test('the reward tables provision themselves when the migration has not been applied', async () => {
  await withModules(async ({ claims }) => {
    const init = await readFile(new URL('migrations/auth/0001_init.sql', root), 'utf8');
    const faucet = await readFile(new URL('migrations/auth/0009_faucet_claims.sql', root), 'utf8');
    const db = new FakeD1([init, faucet]);
    const columns = () => db.db.prepare('PRAGMA table_info(faucet_claims)').all().map((c) => c.name);
    assert.equal(columns().includes('via'), false, 'not there before');

    await claims.ensureFaucetSchema(db);
    for (const column of ['via', 'program', 'reward_run_id']) assert.ok(columns().includes(column), column);
    const tables = db.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'reward_%' ORDER BY name").all().map((r) => r.name);
    assert.deepEqual(tables, ['reward_receipts', 'reward_runs']);
  });
});
