import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import { codeHash, parseAirReport, parseConfirm } from '../functions/_lib/air-kinds.mjs';
import { parseAssignPost } from '../functions/_lib/air-assign.mjs';
import {
  assignListPayload, claimDevice, confirmReport, createAssignment, fileReport, mePayload, spotPayload, targetOf, voidAssignment,
} from '../functions/_lib/air-store.ts';

// Field Report Assignments, phase 1 (docs/plans/2026-09-28-field-assignments.md
// §3): the store hooks (fill, witness, claim) wired into the real report,
// confirm and claim path, and the store side of /api/air/assign (GET open
// list public; POST create/void). Pure rules and the raw SQL are
// cross-checked in tests/air-assign.test.mjs; this file exercises the wiring
// in the style of tests/air-api.test.mjs (same in-memory D1 fake, reused
// below). functions/api/air/assign.ts itself imports AIR_CONFIG as a value
// from src/lib/air.ts, which (like every other air route) needs a bundler for
// its JSON import; every existing air-api test reaches routes the same way —
// through the store functions they call, plus a source-contract check on the
// route text — rather than importing a route file directly under node.

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const MIN = 60_000;
const DEV = {
  a: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', b: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', c: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  d: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', e: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
};
const PEPPER = 'test-pepper';
const CRT = 'CRTFIXTURE9';

const MIGRATIONS_0024 = (await Promise.all(['0001_init.sql', '0023_air.sql', '0024_air_assignments.sql'].map((f) => read(`migrations/auth/${f}`)))).join('\n');
const MIGRATIONS_NO_0024 = (await Promise.all(['0001_init.sql', '0023_air.sql'].map((f) => read(`migrations/auth/${f}`)))).join('\n');

/** D1 over node:sqlite: statements that read (SELECT or RETURNING) hand back rows, batches are one transaction. Same fake tests/air-api.test.mjs uses. */
class SqliteD1 {
  constructor(migrations) {
    this.db = new DatabaseSync(':memory:');
    this.db.exec(migrations);
  }
  prepare(sql) {
    const db = this.db;
    let args = [];
    const reads = /^\s*SELECT|\bRETURNING\b/i.test(sql);
    const execute = () => {
      const s = db.prepare(sql);
      if (!reads) return { results: [], meta: { changes: Number(s.run(...args).changes) } };
      const results = s.all(...args).map((row) => ({ ...row }));
      return { results, meta: { changes: /^\s*SELECT/i.test(sql) ? 0 : results.length } };
    };
    const stmt = { bind(...v) { args = v; return stmt; }, async first() { return execute().results[0] ?? null; }, async all() { return execute(); }, async run() { return execute(); }, execute };
    return stmt;
  }
  async batch(stmts) {
    this.db.exec('BEGIN');
    try { const out = stmts.map((s) => s.execute()); this.db.exec('COMMIT'); return out; } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  rows(sql, ...args) { return this.db.prepare(sql).all(...args).map((row) => ({ ...row })); }
}

/** A fresh env with AUTH_DB (0001+0023+0024 by default) and the courts spot code seeded. */
async function town(migrations = MIGRATIONS_0024) {
  const env = { AUTH_DB: new SqliteD1(migrations), AIR_CODE_PEPPER: PEPPER };
  const hash = await codeHash('courts', CRT, PEPPER);
  env.AUTH_DB.db.prepare("INSERT INTO air_codes (spot, code_hash, valid_from, valid_to) VALUES ('courts', ?, '2026-09-28', '2026-12-31')").run(hash);
  return env;
}

/** Seeds a users row and its session cookie (unused by the store-level tests below, kept for parity with tests/air-api.test.mjs's town()). */
function signIn(env, userId, handle) {
  env.AUTH_DB.db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)')
    .run(userId, JSON.stringify({ userId, createdAt: '2026-09-01T00:00:00Z', identities: [], preferredName: handle, roles: [] }), '2026-09-01T00:00:00Z');
  env.AUTH_DB.db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(`pcs_${handle}`, userId, Date.now() + 86_400_000);
  return `pc_session=pcs_${handle}`;
}

const defer = () => {};
const ipOf = (seed) => `192.0.2.${seed ? seed.charCodeAt(0) : 10}`;

async function report(env, spot, body, now, { cookie = '', ip = ipOf(body.device) } = {}) {
  const p = parseAirReport(config, spot, body, now);
  assert.ok(!p.reason, p.reason);
  const req = new Request(`https://pointcast.xyz/api/air/${spot}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://pointcast.xyz', 'CF-Connecting-IP': ip, ...(cookie ? { cookie } : {}) }, body: '{}',
  });
  const res = await fileReport(req, env, env.AUTH_DB, config, p, now, defer);
  return { status: res.status, body: await res.json() };
}
async function confirm(env, body, now, { cookie = '', ip = ipOf(body.device) } = {}) {
  const c = parseConfirm(body);
  assert.ok(!c.reason, c.reason);
  const req = new Request('https://pointcast.xyz/api/air/confirm', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://pointcast.xyz', 'CF-Connecting-IP': ip, ...(cookie ? { cookie } : {}) }, body: '{}',
  });
  const res = await confirmReport(req, env, env.AUTH_DB, config, c, now, defer);
  return { status: res.status, body: await res.json() };
}
const me = (env, device, now, cookie = '') => mePayload(new Request('https://pointcast.xyz/api/air/me', { headers: cookie ? { cookie } : {} }), env, env.AUTH_DB, config, device, now).then((r) => r.json());
const noHashes = (value) => assert.doesNotMatch(JSON.stringify(value), /pid_hash|ip_hash/);

/**
 * The route's own dispatch (functions/api/air/assign.ts), reconstructed here
 * so its store-facing half runs under plain node: `director` stands in for
 * `hasDirectorDeskAccess(session)`, which tests/director-desk.test.mjs already
 * covers, and which the source-contract test below confirms the route calls.
 */
async function assignGet(env, { spot = null, director = false, now = Date.now() } = {}) {
  return (await assignListPayload(env.AUTH_DB, config, spot, director, now)).json();
}
async function assignPost(env, body, { director = false, now = Date.now(), createdBy = 'user:mike' } = {}) {
  if (!director) return { status: 403, body: { ok: false, reason: 'forbidden' } };
  const parsed = parseAssignPost(config, body, now);
  if ('reason' in parsed) return { status: 400, body: { ok: false, reason: parsed.reason } };
  const res = parsed.action === 'create' ? await createAssignment(env.AUTH_DB, config, parsed, createdBy, now) : await voidAssignment(env.AUTH_DB, parsed.id, parsed.voidReason, now);
  return { status: res.status, body: await res.json() };
}

const RACK_DAY = '2026-10-02'; // a Friday
const IN_MORNING = Date.parse('2026-10-02T13:10:00Z'); // 6:10 AM LA: inside rack-at-open (6:00-7:00)
const IN_EVENING = Date.parse('2026-10-03T00:10:00Z'); // 5:10 PM LA: inside rack-after-work (17:00-18:00)

test('migrations: 0001 + 0023 + 0024 apply cleanly for this harness', () => {
  assert.doesNotThrow(() => new DatabaseSync(':memory:').exec(MIGRATIONS_0024));
});

/* ---------- source contract: the route's auth order and dispatch (functions/api/air/assign.ts) ---------- */

test('route source: readPost, then AUTH_DB, then the director session, then create/void; GET is public', async () => {
  const src = await read('functions/api/air/assign.ts');
  const post = src.slice(src.indexOf('export const onRequestPost'));
  assert.match(post, /^export const onRequestPost[^\n]*\n\s+const read = await readPost\(request\);\n\s+if \('refused' in read\) return read\.refused;/, 'readPost first, like every other air POST');
  assert.match(post, /if \(!env\.AUTH_DB\) return unavailable\(\);/);
  assert.match(post, /hasDirectorDeskAccess\(session\)/, 'gated the same way director/queue.ts is');
  assert.match(post, /return fail\('forbidden', 403\)/);
  assert.match(post, /parseAssignPost\(/);
  assert.match(post, /createAssignment\(/);
  assert.match(post, /voidAssignment\(/);
  const get = src.slice(src.indexOf('export const onRequestGet'), src.indexOf('export const onRequestPost'));
  assert.doesNotMatch(get, /return fail\('forbidden'/, 'the list is public: no director gate blocks it');
  assert.match(get, /assignListPayload\(/);
});

/* ---------- the store hooks: fill, witness, claim ---------- */

test('fill: an on-site report inside an open assignment pays the assignment line, outside the report\'s own points', async () => {
  const env = await town();
  const created = await createAssignment(env.AUTH_DB, config, parseAssignPost(config, { action: 'create', template: 'rack-at-open', day: RACK_DAY }, IN_MORNING - 20 * MIN), 'user:mike', IN_MORNING - 20 * MIN);
  const createdBody = await created.json();
  assert.equal(created.status, 201, JSON.stringify(createdBody));
  assert.equal(createdBody.assignment.seatsLeft, 2);
  const id = createdBody.assignment.id;

  const filed = await report(env, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, IN_MORNING);
  assert.equal(filed.status, 201);
  assert.equal(filed.body.report.onsite, true);
  assert.equal(filed.body.award.points, 10, 'report 6 + first light 4: the assignment reward is separate');
  assert.deepEqual(filed.body.award.assignment, {
    id, label: 'Rack at open', reward: 10, text: 'ASSIGNMENT · RACK AT OPEN · MANHATTAN MIDDLE · FRI 02 OCT 2026',
  });
  // The receipt (spec §3.4 viewAward): the place stamp plus ASSIGNMENT, which outranks the new
  // FIRST LIGHT badge (RECEIPT_ORDER), so the badge is counted in `more`, still earned.
  assert.deepEqual(filed.body.award.stamps.map((s) => [s.kind, s.text]), [
    ['place', 'MANHATTAN MIDDLE · FRI 02 OCT 2026'],
    ['assignment', 'ASSIGNMENT · RACK AT OPEN · MANHATTAN MIDDLE · FRI 02 OCT 2026'],
  ]);
  assert.equal(filed.body.award.more, 1);
  assert.deepEqual(filed.body.award.badges, ['first-light']);
  noHashes(filed.body);

  // "Can't say" never fills, even inside the window.
  const cant = await report(env, 'courts', { kind: 'wait', value: 'cant', device: DEV.b, code: CRT }, IN_MORNING + MIN);
  assert.equal(cant.body.award.assignment, null);
  // Remote never fills.
  const remote = await report(env, 'courts', { kind: 'wait', value: '1-4', device: DEV.c }, IN_MORNING + 2 * MIN);
  assert.equal(remote.body.award.assignment, null);

  // The spot page shows the open seat.
  const page = await spotPayload(env, env.AUTH_DB, targetOf(config, 'courts'), IN_MORNING + 3 * MIN);
  assert.equal(page.assignment.id, id);
  assert.equal(page.assignment.seatsLeft, 1);
  noHashes(page);

  // A second, different phone and network still fills the second seat; a third does not.
  const second = await report(env, 'courts', { kind: 'wait', value: '1-4', device: DEV.d, code: CRT }, IN_MORNING + 4 * MIN, { ip: '198.51.100.9' });
  assert.equal(second.body.award.assignment.id, id);
  const full = await report(env, 'courts', { kind: 'wait', value: '1-4', device: DEV.e, code: CRT }, IN_MORNING + 5 * MIN, { ip: '198.51.100.11' });
  assert.equal(full.body.award.assignment, null, 'both seats are already taken');

  // /me: points.assigned and the fill, never a hash.
  const card = await me(env, DEV.a, IN_MORNING + 6 * MIN);
  assert.equal(card.points.assigned, 10);
  assert.deepEqual(card.assignments, [{ id, label: 'Rack at open', spot: 'courts', day: RACK_DAY, reward: 10, witnessed: false, text: 'ASSIGNMENT · RACK AT OPEN · MANHATTAN MIDDLE · FRI 02 OCT 2026' }]);
  noHashes(card);
});

test('witness: an on-site "still" from another network marks the fill WITNESSED and never pays twice; same-network and "changed" never witness', async () => {
  const env = await town();
  const createNow = IN_MORNING - 20 * MIN;
  const created = await (await createAssignment(env.AUTH_DB, config, parseAssignPost(config, { action: 'create', template: 'rack-at-open', day: RACK_DAY }, createNow), 'user:mike', createNow)).json();
  const id = created.assignment.id;

  const filed = await report(env, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, IN_MORNING, { ip: '203.0.113.9' });
  const witness = await confirm(env, { reportId: filed.body.report.id, verdict: 'still', device: DEV.b, code: CRT }, IN_MORNING + MIN, { ip: '203.0.113.20' });
  assert.equal(witness.status, 200);
  assert.equal(witness.body.award.points, 3, 'a normal confirm reward; the mark itself never pays');

  const list = await assignGet(env, { director: true, now: IN_MORNING + 2 * MIN });
  const row = list.recent.find((r) => r.id === id);
  assert.equal(row.witnessed, 1);
  assert.equal(row.filled, 1);
  assert.deepEqual(row.fillers, [filed.body.report.byline]);

  const created2 = await (await createAssignment(env.AUTH_DB, config, parseAssignPost(config, { action: 'create', template: 'rack-after-work', day: RACK_DAY }, createNow), 'user:mike', createNow)).json();
  const id2 = created2.assignment.id;
  const filed2 = await report(env, 'courts', { kind: 'wait', value: '1-4', device: DEV.c, code: CRT }, IN_EVENING, { ip: '198.51.100.30' });
  assert.equal(filed2.body.award.assignment.id, id2);
  const sameNet = await confirm(env, { reportId: filed2.body.report.id, verdict: 'still', device: DEV.d, code: CRT }, IN_EVENING + MIN, { ip: '198.51.100.30' });
  assert.equal(sameNet.body.onsite, false);
  const changed = await confirm(env, { reportId: filed2.body.report.id, verdict: 'changed', device: DEV.e, code: CRT }, IN_EVENING + 2 * MIN, { ip: '198.51.100.31' });
  assert.equal(changed.status, 200);

  const list2 = await assignGet(env, { director: true, now: IN_EVENING + 3 * MIN });
  const row2 = list2.recent.find((r) => r.id === id2);
  assert.equal(row2.witnessed, 0, 'same-network and "changed" confirms never witness');
});

test('claim: a signed-in account inherits its phone\'s fill', async () => {
  const env = await town();
  const createNow = IN_MORNING - 20 * MIN;
  const created = await (await createAssignment(env.AUTH_DB, config, parseAssignPost(config, { action: 'create', template: 'rack-at-open', day: RACK_DAY }, createNow), 'user:mike', createNow)).json();
  const id = created.assignment.id;
  await report(env, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, IN_MORNING, { ip: '203.0.113.40' });

  const jen = signIn(env, 'u_jen', 'jen');
  const moved = await (await claimDevice(env.AUTH_DB, { userId: 'u_jen', handle: 'jen' }, DEV.a, IN_MORNING + MIN)).json();
  assert.equal(moved.ok, true);

  const card = await me(env, null, IN_MORNING + 2 * MIN, jen);
  assert.equal(card.points.assigned, 10);
  assert.equal(card.assignments[0].id, id);
});

/* ---------- the store side of the routes: GET open list, POST create/void, house-only ---------- */

test('GET /api/air/assign: open is public; canCreate and recent are director-only; spot filters', async () => {
  const env = await town();
  const createNow = IN_MORNING - 20 * MIN;
  await createAssignment(env.AUTH_DB, config, parseAssignPost(config, { action: 'create', template: 'rack-at-open', day: RACK_DAY }, createNow), 'user:mike', createNow);

  const guest = await assignGet(env, { now: createNow });
  assert.equal(guest.open.length, 1);
  assert.equal(guest.canCreate, false);
  assert.equal(guest.recent, undefined);
  noHashes(guest);

  const director = await assignGet(env, { director: true, now: createNow });
  assert.equal(director.canCreate, true);
  assert.equal(director.recent.length, 1);

  const beachOnly = await assignGet(env, { spot: 'beach', now: createNow });
  assert.equal(beachOnly.open.length, 0);
  const courtsOnly = await assignGet(env, { spot: 'courts', now: createNow });
  assert.equal(courtsOnly.open.length, 1);
});

test('POST /api/air/assign: house-only create, a non-director 403, a fourth open 409', async () => {
  const env = await town();
  const createNow = IN_MORNING - 20 * MIN;

  const notDirector = await assignPost(env, { action: 'create', template: 'rack-at-open', day: RACK_DAY }, { director: false, now: createNow });
  assert.equal(notDirector.status, 403); assert.equal(notDirector.body.reason, 'forbidden');
  const badTemplate = await assignPost(env, { action: 'create', template: 'nope', day: RACK_DAY }, { director: true, now: createNow });
  assert.equal(badTemplate.status, 400); assert.equal(badTemplate.body.reason, 'bad-template');

  const days = ['2026-10-02', '2026-10-03', '2026-10-04'];
  for (const day of days) {
    const made = await assignPost(env, { action: 'create', template: 'rack-at-open', day }, { director: true, now: createNow });
    assert.equal(made.status, 201, day);
  }
  const fourth = await assignPost(env, { action: 'create', template: 'rack-after-work', day: '2026-10-05' }, { director: true, now: createNow });
  assert.equal(fourth.status, 409);
  assert.equal(fourth.body.reason, 'too-many-open');
  // The beach counts on its own.
  const beach = await assignPost(env, { action: 'create', template: 'pier-early', day: '2026-10-05' }, { director: true, now: createNow });
  assert.equal(beach.status, 201);
});

test('POST /api/air/assign void: 200 then 404, house-only, filled seats keep their points', async () => {
  const env = await town();
  const createNow = IN_MORNING - 20 * MIN;
  const created = await assignPost(env, { action: 'create', template: 'rack-at-open', day: RACK_DAY }, { director: true, now: createNow });
  const id = created.body.assignment.id;
  const filed = await report(env, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, IN_MORNING);
  assert.ok(filed.body.award.assignment);

  const forbidden = await assignPost(env, { action: 'void', id, reason: 'rained out' }, { director: false, now: IN_MORNING + MIN });
  assert.equal(forbidden.status, 403);
  const voided = await assignPost(env, { action: 'void', id, reason: 'rained out' }, { director: true, now: IN_MORNING + MIN });
  assert.deepEqual(voided.body, { ok: true });
  const again = await assignPost(env, { action: 'void', id }, { director: true, now: IN_MORNING + 2 * MIN });
  assert.equal(again.status, 404);
  assert.equal(again.body.reason, 'not-found');

  const card = await me(env, DEV.a, IN_MORNING + 3 * MIN);
  assert.equal(card.points.assigned, 10, 'a voided assignment never takes back a paid fill');
  const list = await assignGet(env, { director: true, now: IN_MORNING + 3 * MIN });
  assert.equal(list.open.length, 0, 'a voided assignment leaves the open list');
  assert.equal(list.recent.find((r) => r.id === id).voidedAt != null, true);
});

/* ---------- resilience: no air_assignments table ---------- */

test('with no air_assignments table, reports still file, confirms still work, and /me still works', async () => {
  const env = await town(MIGRATIONS_NO_0024);
  const filed = await report(env, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, IN_MORNING);
  assert.equal(filed.status, 201);
  assert.equal(filed.body.award.points, 10);
  assert.equal(filed.body.award.assignment, null);

  const confirmed = await confirm(env, { reportId: filed.body.report.id, verdict: 'still', device: DEV.b, code: CRT }, IN_MORNING + MIN, { ip: '203.0.113.99' });
  assert.equal(confirmed.status, 200);

  const page = await spotPayload(env, env.AUTH_DB, targetOf(config, 'courts'), IN_MORNING + 2 * MIN);
  assert.equal(page.assignment, null);

  const card = await me(env, DEV.a, IN_MORNING + 3 * MIN);
  assert.equal(card.points.assigned, 0);
  assert.deepEqual(card.assignments, []);

  const moved = await (await claimDevice(env.AUTH_DB, { userId: 'u_x', handle: 'x' }, DEV.a, IN_MORNING + 4 * MIN)).json();
  assert.equal(moved.ok, true);

  await assert.rejects(assignListPayload(env.AUTH_DB, config, null, false, IN_MORNING + 5 * MIN), 'the assignments feature itself throws (the route catches it into 503); nothing else broke');
});
