import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { after, before, test } from 'node:test';
import { build } from 'esbuild';

const ORIGIN = 'https://pointcast.xyz';
const AT = new Date('2026-09-30T12:00:00Z');
const day = (offset) => new Date(AT.getTime() + offset * 86400_000);
let api, identity, migration;
const databases = [];
before(async () => {
  [api, identity] = await Promise.all(['functions/_lib/lucky-cat.ts', 'functions/_lib/agent-identity.ts'].map(async (entry) => {
    const result = await build({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'error' });
    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
  }));
  migration = await readFile(new URL('../migrations/auth/0028_lucky_cat.sql', import.meta.url), 'utf8');
});
after(() => databases.forEach((db) => db.db.close()));

// Actual SQLite runs the migration, conditional statements, and triggers; D1 batches are transactions.
class SqliteD1 {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec(`PRAGMA foreign_keys=ON; ${migration}
      CREATE TABLE agent_keys (key_id TEXT PRIMARY KEY,agent_id TEXT NOT NULL,public_key TEXT NOT NULL,
        operator TEXT NOT NULL,scopes_json TEXT NOT NULL,expires_at TEXT NOT NULL,status TEXT NOT NULL,
        replaces_key_id TEXT,created_at TEXT NOT NULL,rotated_at TEXT,revoked_at TEXT);`);
    databases.push(this);
  }
  prepare(sql) {
    let values = [];
    const execute = (mode) => {
      if (this.failReads && /^SELECT \* FROM lucky_cat_receipts/u.test(sql)) { this.failReads -= 1; throw new Error('simulated-unavailable'); }
      const stmt = this.db.prepare(sql);
      if (mode === 'first') return stmt.get(...values) ?? null;
      if (mode === 'all' || stmt.columns().length) return { results: stmt.all(...values), meta: { changes: 0 } };
      return { results: [], meta: { changes: Number(stmt.run(...values).changes) } };
    };
    const prepared = { bind(...args) { values = args; return prepared; },
      async first() { return execute('first'); }, async all() { return execute('all'); }, async run() { return execute('run'); }, execute, sql };
    return prepared;
  }
  async batch(statements) {
    this.db.exec('BEGIN');
    let results;
    try { results = statements.map((stmt) => stmt.execute('run')); this.db.exec('COMMIT'); }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
    if (this.loseWriteResponse && statements.some((stmt) => stmt.sql.includes('INSERT INTO lucky_cat_receipts'))) {
      this.loseWriteResponse = false; this.failReads = 1;
    }
    return results;
  }
}
async function register(db, seed = 'ab', scopes = ['lucky-cat:play', 'lucky-cat:profile']) {
  const keys = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const agent = { id: `pci_${seed.repeat(16)}`, privateKey: keys.privateKey };
  const publicKey = Buffer.from(await crypto.subtle.exportKey('raw', keys.publicKey)).toString('base64');
  db.db.prepare(`INSERT INTO agent_keys VALUES (?,?,?,?,?,?,'active',NULL,?,NULL,NULL)`).run(
    `pck_${seed}`, agent.id, publicKey, 'Lucky Cat test', JSON.stringify(scopes), '2027-01-01T00:00:00Z', AT.toISOString());
  return agent;
}
async function signed(agent, action, body, now = AT) {
  const hash = await identity.hashAgentActionRequest(action, body);
  const timestamp = now.toISOString();
  const payload = identity.buildAgentRequestPayload(agent.id, timestamp, hash);
  return { 'PointCast-Agent-Id': agent.id, 'PointCast-Agent-Timestamp': timestamp,
    'PointCast-Agent-Signature': Buffer.from(await crypto.subtle.sign('Ed25519', agent.privateKey, new TextEncoder().encode(payload))).toString('base64') };
}
async function post(db, agent, body, now = AT, extra = {}) {
  const request = new Request(`${ORIGIN}/api/lucky-cat/actions`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await signed(agent, 'lucky-cat.actions', body, now), ...extra }, body: JSON.stringify(body) });
  const response = await api.handleLuckyCatActions(request, { AUTH_DB: db }, now);
  return { status: response.status, body: await response.json() };
}
async function profile(db, agent, now = AT, query = '') {
  const response = await api.handleLuckyCatProfile(new Request(`${ORIGIN}/api/lucky-cat/profile${query}`,
    { headers: await signed(agent, 'lucky-cat.profile', {}, now) }), { AUTH_DB: db }, now);
  return { status: response.status, body: await response.json() };
}
const plan = ['Inspect the current task and its constraints.', 'Deliver a focused change with explicit evidence.', 'Check the outcome and describe remaining uncertainty.'];
function bodies(taskId = 'practice-0001') {
  return [
    { type: 'task.start', idempotencyKey: `${taskId}-start`, taskId, goal: 'Improve a concrete task through careful planning and verification.', plan },
    { type: 'task.deliver', idempotencyKey: `${taskId}-deliver`, taskId, summary: 'Delivered the planned change and saved the relevant review artifact.', evidence: ['https://example.com/artifact/reviewable-change'] },
    { type: 'task.verify', idempotencyKey: `${taskId}-verify`, taskId, checks: [{ check: 'Run the focused acceptance check.', outcome: 'passed', evidence: 'The focused acceptance check passed for the delivered artifact.' }], limitation: 'The outcome is self-reported; no independent reviewer checked it.' },
    { type: 'task.reflect', idempotencyKey: `${taskId}-reflect`, taskId, lesson: 'Explicit acceptance checks made the intended outcome easier to assess.', nextStep: 'Use the same focused acceptance checks on the next task.' },
  ];
}
async function complete(db, agent, taskId, now = AT) {
  for (const body of bodies(taskId)) {
    const response = await post(db, agent, body, now);
    assert.equal(response.status, 200, JSON.stringify(response.body));
  }
}

// 1
test('public manifest exposes shared transparent collectibles and bounded self-reported practice rules', async () => {
  const response = api.handleLuckyCatManifest(), body = await response.json();
  assert.equal(body.schema, 'pointcast.lucky-cat/v1');
  assert.equal(body.catalog.cats.length, 60);
  assert.equal(new Set(body.catalog.cats.map((cat) => cat.id)).size, 60);
  assert.equal(body.rules.dailyRewardCap, 60);
  assert.equal(body.rules.maxActiveTasks, 12);
  assert.match(body.rules.evidence, /self-reported/);
  assert.match(body.rules.usefulness, /do not change model abilities/);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
});
// 2
test('missing binding and unavailable schema return retryable 503 without exposing SQL', async () => {
  const body = bodies()[0];
  const response = await api.handleLuckyCatActions(new Request(`${ORIGIN}/api/lucky-cat/actions`, { method: 'POST', body: JSON.stringify(body) }), {});
  assert.equal(response.status, 503);
  const broken = { prepare() { throw new Error('sensitive internal SQL'); } };
  const read = await api.handleLuckyCatProfile(new Request(`${ORIGIN}/api/lucky-cat/profile`), { AUTH_DB: broken }, AT);
  assert.equal(read.status, 401);
  const db = new SqliteD1(), agent = await register(db);
  db.db.exec('DROP TRIGGER lucky_cat_receipt_apply; DROP TRIGGER lucky_cat_receipt_guard; DROP TABLE lucky_cat_collection; DROP TABLE lucky_cat_receipts;');
  const unavailable = await post(db, agent, body);
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.body.error, 'lucky-cat-unavailable');
});
// 3
test('unsigned, incomplete, tampered, stale, revoked and insufficient-scope signatures cannot write', async () => {
  const db = new SqliteD1(), agent = await register(db), body = bodies()[0];
  for (const headers of [{}, { 'PointCast-Agent-Id': agent.id }]) {
    const response = await api.handleLuckyCatActions(new Request(`${ORIGIN}/api/lucky-cat/actions`, { method: 'POST', headers, body: JSON.stringify(body) }), { AUTH_DB: db }, AT);
    assert.equal(response.status, 401);
  }
  assert.equal((await post(db, agent, body, AT, await signed(agent, 'lucky-cat.actions', { ...body, goal: 'An entirely different signed task goal.' }))).status, 401);
  assert.equal((await post(db, agent, body, AT, await signed(agent, 'lucky-cat.actions', body, new Date(AT.getTime() - 6 * 60_000)))).status, 401);
  const scoped = await register(db, 'bc', ['lucky-cat:profile']);
  assert.equal((await post(db, scoped, body)).status, 403);
  db.db.prepare("UPDATE agent_keys SET status='revoked' WHERE agent_id=?").run(agent.id);
  assert.equal((await post(db, agent, body)).status, 401);
  assert.equal(db.db.prepare('SELECT COUNT(*) AS n FROM lucky_cat_receipts').get().n, 0);
});
// 4
test('malformed JSON, oversized bodies, unknown fields and unsubstantive claims are rejected', async () => {
  const db = new SqliteD1(), agent = await register(db);
  for (const body of ['{', 'x'.repeat(9000), 'null']) {
    const response = await api.handleLuckyCatActions(new Request(`${ORIGIN}/api/lucky-cat/actions`, { method: 'POST', body }), { AUTH_DB: db }, AT);
    assert.equal(response.status, 400);
  }
  for (const body of [{ ...bodies()[0], goal: 'done' }, { ...bodies()[0], plan: ['a', 'b', 'c'] }, { ...bodies()[0], agentId: agent.id },
    { ...bodies()[2], checks: [{ check: 'Checking the result', outcome: 'maybe', evidence: 'A concrete check outcome' }] }]) assert.equal((await post(db, agent, body)).status, 400);
  assert.equal(db.db.prepare('SELECT COUNT(*) AS n FROM lucky_cat_receipts').get().n, 0);
});
// 5
test('signed new profile is read-only with Classic; ordered phases award 3+5+8+4 and persist receipts', async () => {
  const db = new SqliteD1(), agent = await register(db), empty = await profile(db, agent);
  assert.equal(empty.status, 200);
  assert.equal(empty.body.profile.balance, 0);
  assert.deepEqual(empty.body.profile.cats, ['classic']);
  assert.equal(db.db.prepare('SELECT COUNT(*) AS n FROM lucky_cat_profiles').get().n, 0);
  let balance = 0;
  for (const [i, body] of bodies().entries()) {
    const response = await post(db, agent, body);
    assert.equal(response.status, 200, JSON.stringify(response.body));
    balance += [3, 5, 8, 4][i];
    assert.equal(response.body.receipt.delta, [3, 5, 8, 4][i]);
    assert.equal(response.body.profile.balance, balance);
    assert.equal(response.body.profile.tasks[0].phase, ['planned', 'delivered', 'verified', 'reflected'][i]);
    assert.equal(response.body.receipt.evidenceStatus, 'self-reported');
  }
  const p = (await profile(db, agent)).body.profile;
  assert.equal(p.lifetimePoints, 20); assert.equal(p.completedTasks, 1); assert.equal(p.receipts.length, 4);
  assert.deepEqual(p.tasks[0].plan, plan);
  assert.equal(p.tasks[0].verification.checks[0].outcome, 'passed');
});
// 6
test('honest failed verification earns practice points without false success certification', async () => {
  const db = new SqliteD1(), agent = await register(db), phases = bodies();
  await post(db, agent, phases[0]); await post(db, agent, phases[1]);
  phases[2].checks[0].outcome = 'failed';
  phases[2].checks[0].evidence = 'The focused check failed; the defect remains visible in the artifact.';
  const response = await post(db, agent, phases[2]);
  assert.equal(response.status, 200); assert.equal(response.body.receipt.delta, 8);
  assert.equal(response.body.profile.tasks[0].verification.checks[0].outcome, 'failed');
  assert.equal(response.body.profile.evidenceStatus, 'self-reported');
});
// 7
test('phase skips, duplicate claims and cross-agent task IDs cannot earn points or disclose records', async () => {
  const db = new SqliteD1(), a = await register(db), b = await register(db, 'bc'), phases = bodies();
  assert.equal((await post(db, a, phases[2])).status, 409);
  await post(db, a, phases[0]);
  assert.equal((await post(db, a, { ...phases[0], idempotencyKey: 'duplicate-start' })).status, 409);
  assert.equal((await post(db, b, phases[1])).status, 409);
  const own = (await profile(db, b)).body.profile;
  assert.equal(own.balance, 0); assert.equal(own.tasks.length, 0);
  assert.equal((await profile(db, a)).body.profile.balance, 3);
  assert.equal((await profile(db, b, AT, `?agentId=${a.id}`)).status, 400);
});
// 8
test('same-key retries return immutable receipt while conflicting bodies get 409', async () => {
  const db = new SqliteD1(), agent = await register(db), body = bodies()[0];
  const first = await post(db, agent, body), second = await post(db, agent, body);
  assert.equal(second.status, 200); assert.equal(second.body.replayed, true);
  assert.deepEqual(second.body.receipt, first.body.receipt);
  const conflict = await post(db, agent, { ...body, goal: 'A separate goal for which the existing key must not be reused.' });
  assert.equal(conflict.status, 409); assert.equal(conflict.body.error, 'idempotency-key-conflict');
  assert.equal((await profile(db, agent)).body.profile.balance, 3);
});
// 9
test('concurrent identical retries make one receipt and distinct phase claims award only once', async () => {
  const db = new SqliteD1(), agent = await register(db), body = bodies()[0];
  const retries = await Promise.all(Array.from({ length: 8 }, () => post(db, agent, body)));
  assert.ok(retries.every((r) => r.status === 200), JSON.stringify(retries));
  assert.equal(new Set(retries.map((r) => r.body.receipt.id)).size, 1);
  const deliver = bodies()[1];
  const claims = await Promise.all([post(db, agent, deliver), post(db, agent, { ...deliver, idempotencyKey: 'parallel-deliver' })]);
  assert.deepEqual(claims.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await profile(db, agent)).body.profile.balance, 8);
  assert.equal(db.db.prepare('SELECT COUNT(*) AS n FROM lucky_cat_receipts').get().n, 2);
});
// 10
test('response loss after COMMIT recovers on retry without duplicate points or task effects', async () => {
  const db = new SqliteD1(), agent = await register(db), body = bodies()[0];
  db.loseWriteResponse = true;
  assert.equal((await post(db, agent, body)).status, 503);
  const retry = await post(db, agent, body);
  assert.equal(retry.status, 200); assert.equal(retry.body.replayed, true);
  assert.equal(retry.body.profile.balance, 3); assert.equal(retry.body.profile.tasks.length, 1);
});
// 11
test('three tasks earn at most 60 per UTC day; fourth start rate-limits and next day resets', async () => {
  const db = new SqliteD1(), agent = await register(db);
  for (let i = 0; i < 3; i++) await complete(db, agent, `daily-task-${i}`);
  const capped = (await profile(db, agent)).body.profile;
  assert.equal(capped.balance, 60); assert.equal(capped.daily.remaining, 0);
  assert.equal((await post(db, agent, bodies('daily-task-3')[0])).status, 429);
  const next = await post(db, agent, bodies('daily-task-3')[0], day(1));
  assert.equal(next.status, 200); assert.equal(next.body.profile.daily.earned, 3); assert.equal(next.body.profile.balance, 63);
});
// 12
test('continuing earlier tasks respects current cap, and spending does not restore daily rewards', async () => {
  const db = new SqliteD1(), agent = await register(db);
  for (let i = 0; i < 3; i++) await post(db, agent, bodies(`earlier-task-${i}`)[0], day(-1));
  for (let i = 0; i < 3; i++) await post(db, agent, bodies(`current-task-${i}`)[0]);
  for (let i = 0; i < 3; i++) for (const body of bodies(`earlier-task-${i}`).slice(1)) await post(db, agent, body);
  assert.equal((await profile(db, agent)).body.profile.daily.earned, 60);
  assert.equal((await post(db, agent, { type: 'charm.use', idempotencyKey: 'cap-spend-charm', charmId: 'focus-charm' })).status, 200);
  const deliver = await post(db, agent, bodies('current-task-0')[1]);
  assert.equal(deliver.status, 200); assert.equal(deliver.body.receipt.delta, 0); assert.equal(deliver.body.profile.daily.earned, 60);
  assert.equal(deliver.body.profile.tasks.find((t) => t.id === 'current-task-0').phase, 'delivered');
});
// 13
test('cat and charm spends are atomic, cannot overdraw, and preserve lifetime achievements', async () => {
  const db = new SqliteD1(), agent = await register(db);
  await complete(db, agent, 'spend-task-1');
  const race = await Promise.all([
    post(db, agent, { type: 'cat.collect', catId: 'ocean', idempotencyKey: 'collect-ocean-1' }),
    post(db, agent, { type: 'charm.use', charmId: 'second-look', idempotencyKey: 'use-second-look' }),
  ]);
  assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
  const p = (await profile(db, agent)).body.profile;
  assert.ok(p.balance >= 0); assert.equal(p.lifetimePoints, 20);
  const insufficient = await post(db, agent, { type: 'charm.use', charmId: 'recovery-charm', idempotencyKey: 'spend-too-much' });
  assert.equal(insufficient.status, 409); assert.equal(insufficient.body.error, 'insufficient-luck');
  assert.equal((await profile(db, agent)).body.profile.balance, p.balance);
});
// 14
test('cats stay owned; charms return structured guidance and use counts with idempotent effects', async () => {
  const db = new SqliteD1(), agent = await register(db);
  await complete(db, agent, 'charm-task-1'); await complete(db, agent, 'charm-task-2');
  const collect = { type: 'cat.collect', catId: 'ocean', idempotencyKey: 'cat-ocean-owned' };
  const owned = await post(db, agent, collect);
  assert.equal(owned.status, 200); assert.ok(owned.body.profile.cats.includes('ocean'));
  assert.equal((await post(db, agent, { ...collect, idempotencyKey: 'cat-ocean-again' })).body.error, 'cat-already-owned');
  const body = { type: 'charm.use', charmId: 'focus-charm', idempotencyKey: 'charm-focus-1' }, charm = await post(db, agent, body);
  assert.equal(charm.status, 200); assert.ok(charm.body.receipt.guidance.steps.length >= 3); assert.match(charm.body.receipt.guidance.purpose, /\w/);
  assert.equal((await post(db, agent, body)).body.receipt.id, charm.body.receipt.id);
  assert.equal((await profile(db, agent)).body.profile.charms.find((c) => c.id === 'focus-charm').uses, 1);
});
// 15
test('masterwork requires both lifetime points and completed tasks then preserves achievements', async () => {
  const db = new SqliteD1(), agent = await register(db), claim = { type: 'cat.collect', catId: 'master-eclipse', idempotencyKey: 'masterwork-eclipse' };
  const locked = await post(db, agent, claim);
  assert.equal(locked.status, 409); assert.equal(locked.body.error, 'milestone-not-reached');
  for (let i = 0; i < 5; i++) await complete(db, agent, `master-task-${i}`, day(Math.floor(i / 3)));
  const unlocked = await post(db, agent, claim, day(1));
  assert.equal(unlocked.status, 200); assert.equal(unlocked.body.receipt.delta, 0);
  assert.equal(unlocked.body.profile.lifetimePoints, 100); assert.equal(unlocked.body.profile.completedTasks, 5);
  assert.ok(unlocked.body.profile.cats.includes('master-eclipse'));
});
// 16
test('database trigger rejects a direct overdraft atomically', async () => {
  const db = new SqliteD1(), agent = await register(db);
  await complete(db, agent, 'database-task-1');
  const before = db.db.prepare('SELECT * FROM lucky_cat_profiles WHERE agent_id=?').get(agent.id);
  const original = db.db.prepare('SELECT * FROM lucky_cat_receipts LIMIT 1').get(), columns = Object.keys(original);
  const insert = db.db.prepare(`INSERT INTO lucky_cat_receipts (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
  const invalid = { ...original, id: 'lcr_direct', idempotency_key: 'direct-spend', type: 'charm.use', task_id: null, charm_id: 'recovery-charm', delta: -30, balance_after: 0 };
  assert.throws(() => insert.run(...columns.map((c) => invalid[c])), /lucky-cat-insufficient-luck/);
  assert.deepEqual(db.db.prepare('SELECT * FROM lucky_cat_profiles WHERE agent_id=?').get(agent.id), before);
});
// 17
test('database daily cap rejects a direct otherwise-valid phase reward atomically', async () => {
  const db = new SqliteD1(), agent = await register(db);
  await post(db, agent, bodies('direct-earlier')[0], day(-1));
  for (let i = 0; i < 3; i++) await complete(db, agent, `direct-today-${i}`);
  const before = db.db.prepare('SELECT * FROM lucky_cat_profiles WHERE agent_id=?').get(agent.id);
  const original = db.db.prepare('SELECT * FROM lucky_cat_receipts WHERE task_id=?').get('direct-earlier'), columns = Object.keys(original);
  const insert = db.db.prepare(`INSERT INTO lucky_cat_receipts (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
  const invalid = { ...original, id: 'lcr_overcap', idempotency_key: 'direct-over-cap', type: 'task.deliver', delta: 5,
    day: AT.toISOString().slice(0, 10), created_at: AT.toISOString(), balance_after: before.balance + 5,
    lifetime_after: before.lifetime_points + 5, payload_json: JSON.stringify(bodies('direct-earlier')[1]) };
  assert.throws(() => insert.run(...columns.map((c) => invalid[c])), /lucky-cat-daily-cap/);
  assert.deepEqual(db.db.prepare('SELECT * FROM lucky_cat_profiles WHERE agent_id=?').get(agent.id), before);
  assert.equal(db.db.prepare('SELECT phase FROM lucky_cat_tasks WHERE task_id=?').get('direct-earlier').phase, 'planned');
});
// 18
test('unfinished task remains resumable after more than twelve newer completed tasks', async () => {
  const db = new SqliteD1(), agent = await register(db), unfinishedId = 'preserve-unfinished';
  await post(db, agent, bodies(unfinishedId)[0]);
  for (let i = 0; i < 13; i++) await complete(db, agent, `newer-completed-${i}`, day(1 + Math.floor(i / 3)));
  const tasks = (await profile(db, agent, day(6))).body.profile.tasks;
  assert.equal(tasks.filter((t) => t.phase === 'reflected').length, 12);
  assert.equal(tasks[0].id, unfinishedId); assert.equal(tasks[0].phase, 'planned'); assert.deepEqual(tasks[0].plan, plan);
  assert.equal((await post(db, agent, bodies(unfinishedId)[1], day(6))).status, 200);
  assert.equal((await profile(db, agent, day(6))).body.profile.tasks[0].phase, 'delivered');
});
// 19
test('concurrent starts cannot exceed twelve active tasks and completion frees capacity', async () => {
  const db = new SqliteD1(), agent = await register(db);
  for (let i = 0; i < 11; i++) assert.equal((await post(db, agent, bodies(`bounded-active-${i}`)[0], day(Math.floor(i / 3)))).status, 200);
  const competing = await Promise.all([post(db, agent, bodies('bounded-active-a')[0], day(4)), post(db, agent, bodies('bounded-active-b')[0], day(4))]);
  assert.deepEqual(competing.map((r) => r.status).sort(), [200, 409]);
  const limited = competing.find((r) => r.status === 409);
  assert.equal(limited.body.error, 'active-task-limit'); assert.equal(limited.body.maxActiveTasks, 12);
  assert.equal((await profile(db, agent, day(4))).body.profile.tasks.filter((t) => t.phase !== 'reflected').length, 12);
  for (const phase of bodies('bounded-active-0').slice(1)) assert.equal((await post(db, agent, phase, day(4))).status, 200);
  const resumed = await post(db, agent, bodies('bounded-after-reflect')[0], day(4));
  assert.equal(resumed.status, 200); assert.equal(resumed.body.profile.tasks.filter((t) => t.phase !== 'reflected').length, 12);
});
