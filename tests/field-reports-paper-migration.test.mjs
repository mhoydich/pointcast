import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const dir = new URL('migrations/auth/', root);
const read = (f) => readFile(new URL(f, dir), 'utf8');
const FILE = '0031_field_reports_paper.sql';

const stripComments = (sql) => sql.replace(/--[^\n]*/g, '');
const statements = (sql) => stripComments(sql).split(';').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);

async function freshDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(await read('0001_init.sql'));
  db.exec(await read('0023_air.sql'));
  return db;
}

test('paper migration: exactly one 0031 file', async () => {
  const files = (await readdir(dir)).filter((f) => f.startsWith('0031_'));
  assert.deepEqual(files, [FILE]);
});

test('paper migration: CREATE ... IF NOT EXISTS only, nothing that changes old data', async () => {
  const sql = await read(FILE);
  const stmts = statements(sql);
  assert.equal(stmts.length, 7, 'four tables and three indexes');
  for (const s of stmts) {
    assert.match(s, /^CREATE (TABLE IF NOT EXISTS|(UNIQUE )?INDEX IF NOT EXISTS) /, s);
  }
  const body = stripComments(sql);
  for (const word of ['ALTER', 'DROP', 'INSERT', 'UPDATE', 'DELETE', 'REPLACE']) {
    assert.ok(!new RegExp(`\\b${word}\\b`, 'i').test(body), word);
  }
});

test('paper migration: applies after 0001 + 0023, twice, with the columns of §1', async () => {
  const db = await freshDb();
  const sql = await read(FILE);
  db.exec(sql);
  db.exec(sql);
  const names = (stmt) => stmt.all().map((c) => c.name);
  assert.deepEqual(names(db.prepare('PRAGMA table_info(air_house)')), ['kind', 'value', 'note', 'added_at']);
  assert.deepEqual(names(db.prepare('PRAGMA table_info(edition_subscribers)')), [
    'email', 'status', 'token', 'source', 'user_id', 'created_at', 'confirm_hash', 'confirm_expires_at',
    'confirm_sent_at', 'confirmed_at', 'unsubscribed_at', 'last_sent_day', 'confirm_attempts', 'confirm_last_attempt_at',
  ]);
  assert.deepEqual(names(db.prepare('PRAGMA table_info(morning_daily_runs)')), [
    'day', 'edition_number', 'frozen', 'reason', 'started_at', 'finished_at', 'attempted', 'sent', 'failed', 'dry_run', 'configured',
  ]);
  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'edition_subscribers' AND sql IS NOT NULL ORDER BY name").all().map((r) => r.name);
  assert.deepEqual(indexes, ['edition_subscribers_confirm', 'edition_subscribers_send', 'edition_subscribers_unsent']);
});

test('paper migration: the constraints hold', async () => {
  const db = await freshDb();
  db.exec(await read(FILE));
  const sub = db.prepare('INSERT INTO edition_subscribers (email, status, token, source, created_at, confirm_hash, confirm_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  sub.run('A@x.co', 'pending', 'tok-1', 'morning', 1, null, null);
  assert.throws(() => sub.run('a@x.co', 'pending', 'tok-2', 'morning', 1, null, null), /UNIQUE/, 'email is case-insensitive');
  assert.throws(() => sub.run('b@x.co', 'pending', 'tok-1', 'morning', 1, null, null), /UNIQUE/, 'token is unique');
  assert.throws(() => sub.run('c@x.co', 'maybe', 'tok-3', 'morning', 1, null, null), /CHECK/, 'bad status');
  assert.throws(() => sub.run('d@x.co', 'pending', 'tok-4', 'twitter', 1, null, null), /CHECK/, 'bad source');
  assert.throws(() => sub.run('e@x.co', 'pending', 'tok-5', 'morning', 1, 'abc', null), /CHECK/, 'a hash without an expiry');
  assert.throws(() => sub.run('f@x.co', 'pending', 'tok-6', 'morning', 1, null, 5), /CHECK/, 'an expiry without a hash');
  sub.run('g@x.co', 'pending', 'tok-7', 'receipt', 1, 'h1', 5);
  assert.throws(() => sub.run('h@x.co', 'pending', 'tok-8', 'card', 1, 'h1', 5), /UNIQUE/, 'confirm hash is unique');
  sub.run('i@x.co', 'confirmed', 'tok-9', 'rss', 1, null, null);
  assert.equal(db.prepare("SELECT source FROM edition_subscribers WHERE email = 'A@X.CO'").get().source, 'morning');
  const dflt = db.prepare("INSERT INTO edition_subscribers (email, status, token, created_at) VALUES ('j@x.co', 'pending', 'tok-10', 1)");
  dflt.run();
  assert.equal(db.prepare("SELECT source FROM edition_subscribers WHERE email = 'j@x.co'").get().source, 'morning', 'source defaults to morning');

  const house = db.prepare('INSERT INTO air_house (kind, value, note, added_at) VALUES (?, ?, ?, ?)');
  house.run('pid', 'p1', null, 1);
  house.run('user', 'p1', null, 1);
  assert.throws(() => house.run('pid', 'p1', null, 2), /UNIQUE|PRIMARY/, 'one row per kind+value');
  assert.throws(() => house.run('ip', 'p2', null, 2), /CHECK/, 'bad kind');

  const run = db.prepare('INSERT INTO morning_daily_runs (day, reason, started_at, frozen, dry_run, configured) VALUES (?, ?, ?, ?, ?, ?)');
  run.run('2026-10-18', null, 1, 1, 0, 0);
  run.run('2026-10-19', 'not-frozen', 1, 0, 0, 0);
  run.run('2026-10-20', 'email-not-configured', 1, 1, 0, 0);
  run.run('2026-10-21', 'no-subscribers', 1, 1, 1, 1);
  run.run('2026-10-24', 'started', 1, 0, 0, 1);
  run.run('2026-10-25', 'out-of-time', 1, 1, 0, 1);
  assert.throws(() => run.run('2026-10-22', 'because', 1, 0, 0, 0), /CHECK/, 'bad reason');
  assert.throws(() => run.run('2026-10-23', null, 1, 2, 0, 0), /CHECK/, 'frozen is 0/1');
  assert.throws(() => run.run('2026-10-18', null, 1, 0, 0, 0), /UNIQUE|PRIMARY/, 'one row per day');
});

test('paper migration: the house columns read on 0001 + 0023 + 0031', async () => {
  const { HOUSE_SELECT, squash } = await import('../functions/_lib/air-house.mjs');
  const db = await freshDb();
  db.exec(await read(FILE));
  // The §2.1 columns, written out as the lanes write them, prepare against the real tables.
  const sql = 'SELECT r.id, EXISTS (SELECT 1 FROM air_house h WHERE h.kind = \'pid\' AND h.value = r.pid_hash) AS house_pid, EXISTS (SELECT 1 FROM air_house h WHERE h.kind = \'user\' AND h.value = r.user_id) AS house_user, (SELECT u.payload FROM users u WHERE u.id = r.user_id) AS user_payload FROM air_reports r LIMIT 1';
  assert.ok(squash(sql).includes(HOUSE_SELECT));
  assert.doesNotThrow(() => db.prepare(sql));
  const before = await freshDb();
  assert.throws(() => before.prepare(sql), /air_house/, 'fails before 0031 is applied, so callers fall back');
});
