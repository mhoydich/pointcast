import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { after, before, test } from 'node:test';
import { build } from 'esbuild';

const ORIGIN = 'https://pointcast.xyz';
const NOW = Date.parse('2026-10-19T12:10:00Z');
const DAY = 86_400_000;
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
let api, ownerRoute, directorRoute, authMigration, deskMigration;
const databases = [];
before(async () => {
  [api, ownerRoute, directorRoute] = await Promise.all([
    'functions/_lib/internship-desk.ts', 'functions/api/internship-desk.ts', 'functions/api/director/internship-desk.ts',
  ].map(async entry => {
    const result = await build({ entryPoints: [new URL(entry, root).pathname], bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'error' });
    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
  }));
  [authMigration, deskMigration] = await Promise.all(['0001_init.sql', '0032_internship_desk.sql'].map(name => read(`migrations/auth/${name}`)));
});
after(() => databases.forEach(db => db.db.close()));

// The real migration and conditional SQL run in SQLite; batches are atomic.
class SqliteD1 {
  constructor(includeDesk = true) {
    this.db = new DatabaseSync(':memory:');
    this.db.exec(authMigration + (includeDesk ? deskMigration : ''));
    databases.push(this);
  }
  prepare(sql) {
    let args = [];
    const execute = () => {
      if (this.fail && this.fail(sql)) throw new Error('internal database information must not leak');
      const statement = this.db.prepare(sql);
      if (/^\s*SELECT|\bRETURNING\b/iu.test(sql)) {
        const results = statement.all(...args).map(row => ({ ...row }));
        return { results, meta: { changes: /^\s*SELECT/iu.test(sql) ? 0 : results.length } };
      }
      return { results: [], meta: { changes: Number(statement.run(...args).changes) } };
    };
    const statement = { bind(...values) { args = values; return statement; }, async first() { return execute().results[0] ?? null; }, async all() { return execute(); }, async run() { return execute(); }, execute };
    return statement;
  }
  async batch(statements) {
    this.db.exec('BEGIN');
    try { const results = statements.map(statement => statement.execute()); this.db.exec('COMMIT'); return results; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  rows(sql, ...args) { return this.db.prepare(sql).all(...args).map(row => ({ ...row })); }
}
function signIn(db, id, { director = false } = {}) {
  const user = { userId: id, createdAt: '2026-10-01T00:00:00Z', identities: [], roles: director ? ['broadcaster'] : [] };
  db.db.prepare('INSERT INTO users(id,payload,created_at) VALUES(?,?,?)').run(id, JSON.stringify(user), user.createdAt);
  db.db.prepare('INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)').run(`pcs_${id}`, id, Date.parse('2100-01-01T00:00:00Z'));
  return id;
}
function town(includeDesk = true) {
  const db = new SqliteD1(includeDesk);
  return { db, env: { AUTH_DB: db }, owner: signIn(db, 'pcu_owner'), other: signIn(db, 'pcu_other'), director: signIn(db, 'pcu_director', { director: true }) };
}
function payload(overrides = {}) {
  return { label: 'Useful poster kit', goal: 'Learn to make a clear offer for a neighborhood event.', botName: '', onboarding: [false, false, false], tasks: { understand: 'todo', make: 'todo', test: 'todo' }, evidence: '', ...overrides };
}
function request(actor, body, { director = false, headers = {}, query = '', method = body === undefined ? 'GET' : 'POST', raw, stream } = {}) {
  const h = { ...(actor ? { Cookie: `pc_session=pcs_${actor}` } : {}), ...(method === 'POST' ? { Origin: ORIGIN, 'Content-Type': 'application/json', 'X-PointCast-User': actor ?? '' } : {}), ...headers };
  for (const key of Object.keys(h)) if (h[key] === null) delete h[key];
  return new Request(`${ORIGIN}/api/${director ? 'director/' : ''}internship-desk${query}`, { method, headers: h, ...(method === 'POST' ? { body: stream ?? raw ?? JSON.stringify(body), ...(stream ? { duplex: 'half' } : {}) } : {}) });
}
async function call(t, actor, body, options = {}) {
  const response = await api.handleInternshipDesk(request(actor, body, options), t.env, options.director ?? false, options.now ?? NOW);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  return { status: response.status, body: await response.json(), headers: response.headers };
}
const mutation = (row, action, extra = {}) => ({ action, kind: row.kind, recordId: row.recordId, version: row.version, ...extra });
async function saveNew(t, actor = t.owner, kind = 'human', value = payload(), options = {}) {
  const result = await call(t, actor, { action: 'save', kind, recordId: null, version: 0, payload: value }, options);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  return result.body.records.find(row => row.kind === kind);
}
async function ready(t, actor = t.owner, options = {}) {
  const value = payload({ onboarding: [true, true, true], tasks: { understand: 'ready', make: 'ready', test: 'ready' }, evidence: 'Original draft one. Keyboard, narrow layout and downloadable file checks passed.' });
  let row = await saveNew(t, actor, 'human', value, options);
  let result = await call(t, actor, mutation(row, 'interest'), options);
  assert.equal(result.status, 200); row = result.body.records[0];
  result = await call(t, actor, mutation(row, 'request_review'), options);
  assert.equal(result.status, 200); return result.body.records[0];
}
const review = (row, extra = {}) => ({ ownerId: row.ownerId, kind: row.kind, recordId: row.recordId, version: row.version, decision: 'reviewed', note: 'Reviewed the original draft and its evidence.', ...extra });

test('missing binding or migration fails closed; valid routes require a real session', async () => {
  assert.equal((await api.handleInternshipDesk(request(null), {})).status, 503);
  const t = town();
  assert.equal((await call(t, null)).status, 401);
  assert.equal((await call(t, 'not_registered')).status, 401);
  const missing = town(false);
  const unavailable = await call(missing, missing.owner);
  assert.equal(unavailable.status, 503);
  assert.doesNotMatch(JSON.stringify(unavailable.body), /SQL|no such table|internal database/);
  assert.equal((await ownerRoute.onRequest({ request: request(t.owner), env: t.env })).status, 200);
  assert.equal((await directorRoute.onRequest({ request: request(t.owner), env: t.env })).status, 403);
});

test('owner data is private; account pin, origin, strict keys and director access reject forged authority', async () => {
  const t = town();
  const row = await saveNew(t);
  assert.deepEqual((await call(t, t.other)).body.records, []);
  for (const headers of [{ Origin: null }, { Origin: 'https://evil.test' }, { 'X-PointCast-User': null }, { 'X-PointCast-User': t.other }]) {
    const denied = await call(t, t.owner, mutation(row, 'delete'), { headers });
    assert.equal(denied.status, 403);
  }
  assert.equal((await call(t, t.other, mutation(row, 'delete'))).status, 409);
  assert.equal((await call(t, t.other, { ...mutation(row, 'delete'), ownerId: t.owner })).status, 400);
  assert.equal((await call(t, t.owner, undefined, { director: true })).status, 403);
  assert.equal((await call(t, t.owner, review(row), { director: true })).status, 403);
  assert.equal(t.db.rows('SELECT COUNT(*) AS n FROM internship_desk_records')[0].n, 1);
  assert.equal((await call(t, t.owner, undefined, { method: 'OPTIONS' })).status, 405);
});

test('JSON is stream bounded and strictly validated; links and contact details are rejected', async () => {
  const t = town();
  const base = { action: 'save', kind: 'human', recordId: null, version: 0, payload: payload() };
  assert.equal((await call(t, t.owner, base, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await call(t, t.owner, base, { headers: { 'Content-Length': '8193' } })).status, 413);
  assert.equal((await call(t, t.owner, base, { raw: '{broken' })).status, 400);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(4096)); controller.enqueue(new Uint8Array(4097)); controller.close(); } });
  assert.equal((await call(t, t.owner, base, { stream })).status, 413);
  const invalid = [
    { ...base, ownerId: t.other }, { ...base, version: -1 }, { ...base, kind: 'admin' },
    { ...base, payload: payload({ onboarding: [true, true] }) },
    { ...base, payload: payload({ tasks: { understand: 'ready', make: 'approved', test: 'ready' } }) },
    { ...base, payload: payload({ botName: 'Someone else' }) },
    { ...base, kind: 'bot' },
    ...['https://example.test', 'hello@example.test', '+1 310 555 0123'].map(goal => ({ ...base, payload: payload({ goal }) })),
  ];
  for (const body of invalid) assert.equal((await call(t, t.owner, body)).status, 400, JSON.stringify(body));
  assert.equal(t.db.rows('SELECT COUNT(*) AS n FROM internship_desk_records')[0].n, 0);
  assert.equal(t.db.rows('SELECT COUNT(*) AS n FROM internship_desk_write_rates')[0].n, 0);
});

test('two record cap is owner/kind; bot workspace has only a human owner and no key or access grant', async () => {
  const t = town();
  await saveNew(t);
  await saveNew(t, t.owner, 'bot', payload({ botName: 'Practice helper' }));
  const own = await call(t, t.owner);
  assert.equal(own.body.records.length, 2);
  assert.ok(own.body.records.every(row => row.ownerId === t.owner));
  assert.ok(own.body.records.every(row => typeof row.recordId === 'string'));
  assert.equal((await call(t, t.owner, { action: 'save', kind: 'human', recordId: null, version: 0, payload: payload() })).status, 409);
  assert.equal((await call(t, t.owner, { action: 'save', kind: 'bot2', recordId: null, version: 0, payload: payload() })).status, 400);
  assert.doesNotMatch(JSON.stringify(own.body), /agentKeys|accessToken|credential|grant/);
});

test('interest is explicit and review requires stored onboarding, tasks and evidence', async () => {
  const t = town();
  let row = await saveNew(t);
  assert.deepEqual((await call(t, t.director, undefined, { director: true })).body.records, []);
  assert.equal((await call(t, t.owner, mutation(row, 'interest'))).body.error, 'incomplete-onboarding');
  let result = await call(t, t.owner, mutation(row, 'save', { payload: payload({ onboarding: [true, true, true] }) }));
  row = result.body.records[0];
  assert.equal((await call(t, t.owner, mutation(row, 'request_review'))).body.error, 'invalid-transition');
  result = await call(t, t.owner, mutation(row, 'interest')); row = result.body.records[0];
  assert.equal(row.status, 'interest_received');
  assert.equal((await call(t, t.director, undefined, { director: true })).body.records.length, 1);
  assert.equal((await call(t, t.owner, mutation(row, 'request_review'))).body.error, 'incomplete-submission');
  assert.equal((await call(t, t.director, review(row), { director: true })).body.error, 'invalid-transition');
});

test('review is version-bound, attributed to the server actor, and invalidated by changed work', async () => {
  const t = town();
  const submitted = await ready(t);
  const expiry = submitted.expiresAt;
  const dbRow = t.db.rows('SELECT * FROM internship_desk_records')[0];
  assert.equal(dbRow.submitted_version, submitted.version);
  assert.equal(dbRow.submitted_payload_json, dbRow.payload_json);
  let result = await call(t, t.director, review(submitted), { director: true, now: NOW + DAY });
  assert.equal(result.status, 200);
  const reviewed = result.body.records[0];
  assert.equal(reviewed.status, 'reviewed');
  assert.equal(reviewed.review.reviewerId, t.director);
  assert.equal(reviewed.review.submittedVersion, submitted.version);
  assert.equal(reviewed.expiresAt, expiry, 'director review does not renew retention');
  assert.equal((await call(t, t.director, review(submitted), { director: true })).status, 409, 'retry does not claim duplicate success');
  const same = payload({ label: reviewed.label, goal: reviewed.goal, botName: reviewed.botName, onboarding: reviewed.onboarding, tasks: reviewed.tasks, evidence: reviewed.evidence });
  result = await call(t, t.owner, mutation(reviewed, 'save', { payload: same }), { now: NOW + 2 * DAY });
  assert.equal(result.body.records[0].review.submittedVersion, submitted.version, 'identical content preserves review');
  assert.ok(Date.parse(result.body.records[0].expiresAt) > Date.parse(expiry));
  result = await call(t, t.owner, mutation(result.body.records[0], 'save', { payload: { ...same, evidence: 'Revised the whole draft. This version needs a new review of the work.' } }));
  const changed = result.body.records[0];
  assert.equal(changed.status, 'interest_received');
  assert.equal(changed.review, null);
  assert.equal(t.db.rows('SELECT submitted_payload_json FROM internship_desk_records')[0].submitted_payload_json, null);
  assert.equal((await call(t, t.director, review(changed), { director: true })).status, 409);
});

test('director cannot review own work and concurrent owner updates cannot bypass review CAS', async () => {
  const t = town();
  const own = await ready(t, t.director);
  assert.equal((await call(t, t.director, review(own), { director: true })).body.error, 'cannot-review-own-record');
  const row = await saveNew(t);
  const changes = await Promise.all([
    call(t, t.owner, mutation(row, 'save', { payload: payload({ label: 'First revision' }) })),
    call(t, t.owner, mutation(row, 'save', { payload: payload({ label: 'Second revision' }) })),
  ]);
  assert.deepEqual(changes.map(result => result.status).sort(), [200, 409]);
});

test('an unchanged pending save exposes the original submission version separately from current record version', async () => {
  const t = town();
  const submitted = await ready(t);
  const unchanged = payload({ label: submitted.label, goal: submitted.goal, botName: submitted.botName, onboarding: submitted.onboarding, tasks: submitted.tasks, evidence: submitted.evidence });
  const saved = await call(t, t.owner, mutation(submitted, 'save', { payload: unchanged }));
  const current = saved.body.records[0];
  assert.equal(current.status, 'review_requested');
  assert.equal(current.version, submitted.version + 1);
  assert.equal(current.submittedVersion, submitted.version);
  assert.equal((await call(t, t.director, review(submitted), { director: true })).status, 409);
  const decision = await call(t, t.director, review(current), { director: true });
  assert.equal(decision.status, 200);
  assert.equal(decision.body.records[0].review.submittedVersion, current.submittedVersion);
  assert.notEqual(decision.body.records[0].review.submittedVersion, current.version);
});

test('delete/recreate ABA cannot authorize a stale owner mutation or director review', async () => {
  const t = town();
  const old = await ready(t);
  assert.equal((await call(t, t.owner, mutation(old, 'delete'))).status, 200);
  assert.deepEqual((await call(t, t.owner)).body.records, []);
  const replacement = await ready(t);
  assert.equal(old.version, replacement.version);
  assert.notEqual(old.recordId, replacement.recordId);
  for (const action of ['delete', 'interest', 'request_review']) assert.equal((await call(t, t.owner, mutation(old, action))).status, 409);
  assert.equal((await call(t, t.owner, mutation(old, 'save', { payload: payload() }))).status, 409);
  assert.equal((await call(t, t.director, review(old), { director: true })).status, 409);
  assert.equal((await call(t, t.owner)).body.records[0].recordId, replacement.recordId);
});

test('atomic per-actor budget allows sixty attempts per UTC hour, shared across both roles', async () => {
  const t = town();
  const row = await saveNew(t, t.director);
  for (let i = 1; i < 60; i++) {
    const attempt = i % 2
      ? await call(t, t.director, mutation(row, 'save', { payload: payload() }))
      : await call(t, t.director, review(row), { director: true });
    assert.notEqual(attempt.status, 429);
  }
  assert.equal(t.db.rows('SELECT count FROM internship_desk_write_rates WHERE actor_id = ?', t.director)[0].count, 60);
  const over = await call(t, t.director, mutation(row, 'delete'));
  assert.equal(over.status, 429);
  assert.equal(over.headers.get('Retry-After'), '3000');
  assert.equal((await call(t, t.director, mutation(row, 'delete'), { now: NOW + 3_600_000 })).status, 409, 'new hour resets budget but still checks stale version');
  assert.equal((await call(t, t.director)).status, 200, 'reads remain available at cap');
});

test('expiry filters every read, purges bounded batches, and deletion removes payload/review/snapshot', async () => {
  const t = town();
  const row = await ready(t);
  assert.equal((await call(t, t.owner, undefined, { now: NOW + 90 * DAY + 1 })).body.records.length, 0);
  assert.equal(t.db.rows('SELECT COUNT(*) AS n FROM internship_desk_records')[0].n, 0);
  assert.equal((await call(t, t.director, review(row), { director: true, now: NOW + 90 * DAY + 1 })).status, 409);
  for (let i = 0; i < 70; i++) {
    const actor = signIn(t.db, `pcu_expired_${i}`);
    t.db.db.prepare("INSERT INTO internship_desk_records(record_id,owner_id,kind,payload_json,version,status,interest_at,updated_at,expires_at) VALUES(?,?,'human',?,1,'interest_received',?,?,?)").run(crypto.randomUUID(), actor, JSON.stringify(payload()), NOW - DAY, NOW - DAY, NOW - 1);
  }
  const queue = await call(t, t.director, undefined, { director: true });
  assert.deepEqual(queue.body.records, []);
  assert.equal(t.db.rows('SELECT COUNT(*) AS n FROM internship_desk_records')[0].n, 20, 'only fifty global expired rows purged');
});

test('director pagination is bounded and deterministic for equal timestamps; drafts never enter the queue', async () => {
  const t = town();
  await saveNew(t);
  for (let i = 0; i < 55; i++) {
    const actor = signIn(t.db, `pcu_queue_${String(i).padStart(2, '0')}`);
    t.db.db.prepare("INSERT INTO internship_desk_records(record_id,owner_id,kind,payload_json,version,status,interest_at,updated_at,expires_at) VALUES(?,?,'human',?,1,'interest_received',?,?,?)").run(crypto.randomUUID(), actor, JSON.stringify(payload()), NOW, NOW, NOW + 90 * DAY);
  }
  const first = await call(t, t.director, undefined, { director: true });
  assert.equal(first.body.records.length, 50); assert.ok(first.body.nextCursor);
  const second = await call(t, t.director, undefined, { director: true, query: `?cursor=${first.body.nextCursor}` });
  assert.equal(second.body.records.length, 5); assert.equal(second.body.nextCursor, null);
  assert.equal(new Set([...first.body.records, ...second.body.records].map(row => row.ownerId)).size, 55);
  for (const query of ['?cursor=bad!', '?limit=1000', '?cursor=a&cursor=b']) assert.equal((await call(t, t.director, undefined, { director: true, query })).status, 400);
});

test('storage failures fail closed and handlers never perform external communication or execution', async () => {
  const t = town();
  const originalFetch = globalThis.fetch;
  let fetches = 0;
  globalThis.fetch = async () => { fetches++; throw new Error('network forbidden in this test'); };
  try {
    const row = await ready(t);
    await call(t, t.director, review(row), { director: true });
    assert.equal(fetches, 0);
    t.db.fail = sql => /INSERT INTO internship_desk_write_rates/u.test(sql);
    const failed = await call(t, t.owner, mutation(row, 'delete'));
    assert.equal(failed.status, 503);
    assert.equal(t.db.rows('SELECT COUNT(*) AS n FROM internship_desk_records')[0].n, 1);
    assert.doesNotMatch(JSON.stringify(failed.body), /internal database|SQL/);
  } finally { globalThis.fetch = originalFetch; }
});
