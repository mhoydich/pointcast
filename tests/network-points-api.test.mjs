import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestGet } from '../functions/api/points.ts';
import { onRequestPost as join } from '../functions/api/points/join.ts';
import { onRequestPost as leave } from '../functions/api/points/leave.ts';
import { awardCheckin, ledgerProfileId } from '../functions/_lib/network-points.ts';

// Runs the real migrations and the store's real SQL on SQLite.
class SQLiteD1 {
  constructor() {
    this.sqlite = new DatabaseSync(':memory:');
    for (const m of ['0001_init.sql', '0035_points_ledger.sql']) this.sqlite.exec(readFileSync(new URL(`../migrations/auth/${m}`, import.meta.url), 'utf8'));
    for (const id of ['alice', 'bob']) {
      this.sqlite.prepare('INSERT INTO users (id,payload,created_at) VALUES (?,?,?)').run(id, JSON.stringify({ userId: id, identities: [], preferredName: id, createdAt: '2026-11-01T00:00:00.000Z' }), '2026-11-01');
      this.sqlite.prepare('INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)').run(`pcs_${id}`, id, Date.now() + 60_000);
    }
  }
  prepare(sql) {
    const db = this;
    return {
      sql, args: [],
      bind(...args) { this.args = args; return this; },
      async first() { return db.sqlite.prepare(sql).get(...this.args) ?? null; },
      async all() { return { results: db.sqlite.prepare(sql).all(...this.args) }; },
      async run() { const r = db.sqlite.prepare(sql).run(...this.args); return { success: true, meta: { changes: Number(r.changes) } }; },
    };
  }
  async batch(statements) {
    this.sqlite.exec('BEGIN');
    try { for (const s of statements) await s.run(); this.sqlite.exec('COMMIT'); } catch (e) { this.sqlite.exec('ROLLBACK'); throw e; }
    return [];
  }
}

function env(t, enabled = '1') {
  const AUTH_DB = new SQLiteD1();
  t.after(() => AUTH_DB.sqlite.close());
  return { AUTH_DB, POINTS_LEDGER_ENABLED: enabled };
}
const post = (handler, e, body, user = 'alice') => handler({ env: e, request: new Request('https://pointcast.xyz/api/points/x', {
  method: 'POST', headers: { cookie: `pc_session=pcs_${user}`, origin: 'https://pointcast.xyz', 'content-type': 'application/json' }, body: JSON.stringify(body),
}) });
const get = async (e, qs) => (await onRequestGet({ env: e, request: new Request(`https://pointcast.xyz/api/points?${qs}`) })).json();

test('with the flag off, reads say so and join refuses', async (t) => {
  const e = env(t, '');
  assert.equal((await get(e, 'recent=1')).enabled, false);
  assert.equal((await post(join, e, {})).status, 503);
});

test('nobody earns lines until they join', async (t) => {
  const e = env(t);
  assert.deepEqual(await awardCheckin(e, { userId: 'alice', at: '2026-11-09T15:00:00Z', ref: 'c1' }), []);
});

test('join with a handle, earn, and read by handle or hash with a chain that holds', async (t) => {
  const e = env(t);
  const res = await (await post(join, e, { name: 'Alice', handle: 'alice-h' })).json();
  assert.equal(res.ok, true);
  assert.equal(res.profile, await ledgerProfileId('alice'));
  await awardCheckin(e, { userId: 'alice', at: '2026-11-09T15:00:00Z', place: 'Medway', ref: 'c1' });
  await awardCheckin(e, { userId: 'alice', at: '2026-11-09T15:00:00Z', place: 'Medway', ref: 'c1' }); // idempotent
  const byHandle = await get(e, 'profile=alice-h&lines=1');
  assert.equal(byHandle.profile, res.profile);
  assert.equal(byHandle.handle, 'alice-h');
  assert.equal(byHandle.name, 'Alice');
  assert.deepEqual(byHandle.held, { enjoy: 1, blue: 0, reserve: 1 });
  assert.equal(byHandle.chain.ok, true);
  assert.equal((await get(e, `profile=${res.profile}`)).points, byHandle.points);
});

test('a handle can only belong to one member', async (t) => {
  const e = env(t);
  await post(join, e, { handle: 'taken' });
  assert.equal((await post(join, e, { handle: 'taken' }, 'bob')).status, 409);
  assert.equal((await post(join, e, { handle: 'Bad Handle' }, 'bob')).status, 400);
});

test('leaving hides name and handle and stops new lines, but keeps the record', async (t) => {
  const e = env(t);
  const { profile } = await (await post(join, e, { name: 'Alice', handle: 'alice-h' })).json();
  await awardCheckin(e, { userId: 'alice', at: '2026-11-09T15:00:00Z', ref: 'c1' });
  assert.equal((await post(leave, e, {})).status, 200);
  assert.equal((await get(e, 'profile=alice-h')).reason, 'no-such-profile');
  const s = await get(e, `profile=${profile}`);
  assert.equal(s.member, false);
  assert.equal(s.name, null);
  assert.equal(s.lines, 1);
  assert.deepEqual(await awardCheckin(e, { userId: 'alice', at: '2026-11-10T15:00:00Z', ref: 'c2' }), []);
});
