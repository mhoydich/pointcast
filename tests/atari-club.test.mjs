import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { handleClubGet, handleClubPost } from '../functions/api/atari-club/_store.ts';
import { clubBody, clubDay, clubHandle } from '../src/lib/atari-club.ts';
const schema = await readFile(new URL('../migrations/auth/0026_atari_club.sql', import.meta.url), 'utf8');
const auth = await readFile(new URL('../migrations/auth/0001_init.sql', import.meta.url), 'utf8');
class SqliteD1 {
  constructor() { this.db = new DatabaseSync(':memory:'); this.db.exec(auth + schema); }
  prepare(sql) {
    let args = []; const db = this.db;
    const execute = (mode) => {
      const s = db.prepare(sql);
      return mode === 'first' ? s.get(...args) ?? null : mode === 'all' ? { results: s.all(...args) } : { meta: { changes: Number(s.run(...args).changes) } };
    };
    const p = { bind(...values) { args = values; return p; }, async first() { return execute('first'); }, async all() { return execute('all'); }, async run() { return execute('run'); }, execute };
    return p;
  }
  async batch(statements) {
    this.db.exec('BEGIN');
    try { const results = statements.map((s) => s.execute('run')); this.db.exec('COMMIT'); return results; }
    catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  user(id, director = false) {
    this.db.prepare('INSERT INTO users VALUES (?, ?, ?)').run(id, JSON.stringify({ userId: id, createdAt: '2026-09-29', preferredName: 'Private Name', identities: [{ provider: 'email', id: 'private@example.com' }], roles: director ? ['broadcaster'] : [] }), '2026-09-29');
    this.db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(`token-${id}`, id, Date.now() + 86400000);
  }
}
const BASE = 'https://pointcast.xyz/api/atari-club';
const T0 = Date.parse('2026-09-29T17:00:00Z');
const at = (offset = 0) => ({ now: () => new Date(T0 + offset) });
const get = (env, user, query = '', offset = 0) => handleClubGet(new Request(BASE + query, { headers: user ? { cookie: `pc_session=token-${user}` } : {} }), env, at(offset));
const request = (body, user, extra = {}) => new Request(BASE, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://pointcast.xyz', ...(user ? { cookie: `pc_session=token-${user}` } : {}), ...extra }, body: JSON.stringify(body) });
const post = (env, user, body, offset = 0) => handleClubPost(request(body, user), env, at(offset));
const setup = () => { const env = { AUTH_DB: new SqliteD1() }; for (const id of ['a', 'b', 'c']) env.AUTH_DB.user(id); env.AUTH_DB.user('director', true); return env; };
const join = (env, user = 'a', handle = 'PixelPilot', offset = 0) => post(env, user, { action: 'join', handle, consent: true }, offset);
const send = (env, user = 'a', channel = 'general', offset = 0) => post(env, user, { action: 'post', channel, body: 'Hello from a real visitor.' }, offset);
const json = async (response) => (await response).json();

test('public board has an actual zero state and never enrolls a visitor', async () => {
  const env = setup();
  const res = await get(env, 'a');
  assert.equal(res.status, 200); assert.equal(res.headers.get('cache-control'), 'private, no-store');
  const data = await res.json();
  assert.equal(data.memberCount, 0); assert.equal(data.postCount, 0); assert.deepEqual(data.posts, []);
  assert.equal(data.self.signedIn, true); assert.equal(data.self.isMember, false); assert.deepEqual(data.self.badges, []);
  assert.equal((await json(get(env))).self.signedIn, false);
  assert.equal((await send(env)).status, 403);
  assert.equal((await post(env, null, { action: 'join', handle: 'Anon', consent: true })).status, 401);
});

test('explicit join has unique case-insensitive handles and protected historical names', async () => {
  const env = setup();
  assert.equal((await post(env, 'a', { action: 'join', handle: 'Pilot' })).status, 400);
  for (const handle of ['Overlord', 'over_lord', 'Freddie', 'fre-ddie', 'Admin']) assert.equal((await join(env, 'a', handle)).status, 409);
  const joined = await join(env);
  assert.equal(joined.status, 201);
  const self = (await joined.json()).self;
  assert.equal(self.handle, 'PixelPilot'); assert.equal(self.checkinDays, 1); assert.equal(self.checkedInToday, true);
  assert.deepEqual(self.badges.map((b) => b.id), ['first-carrier']);
  assert.equal((await join(env, 'b', 'pixelpilot')).status, 409);
  assert.equal((await join(env, 'a', 'OtherName')).status, 409);
  assert.equal((await join(env)).status, 200);
  // A retry tomorrow is not an earned visit.
  assert.equal((await json(join(env, 'a', 'PixelPilot', 86400000))).self.checkinDays, 1);
  assert.equal((await join(env, 'director', 'Overlord')).status, 201);
  assert.equal((await join(env, 'director', 'Freddie')).status, 409);
  assert.equal((await json(get(env))).memberCount, 2);
});

test('real posts earn only their server-derived badges; public output hides account identities', async () => {
  const env = setup(); await join(env);
  const sent = await json(send(env));
  assert.deepEqual(sent.self.badges.map((b) => b.id), ['first-carrier', 'first-transmission']);
  const built = await json(send(env, 'a', 'workshop', 31000));
  assert.deepEqual(built.self.badges.map((b) => b.id), ['first-carrier', 'first-transmission', 'pixel-builder']);
  const board = await json(get(env, undefined, '?channel=workshop'));
  assert.equal(board.memberCount, 1); assert.equal(board.postCount, 2); assert.equal(board.posts.length, 1);
  assert.equal(board.posts[0].handle, 'PixelPilot'); assert.equal(board.posts[0].canDelete, false);
  const dump = JSON.stringify(board);
  for (const privateField of ['user_id', 'userId', 'reporter', 'Private Name', 'private@example', 'token-', 'pc_session']) assert.ok(!dump.includes(privateField), privateField);
  assert.equal((await json(get(env, 'a'))).posts[0].canDelete, true);
  assert.equal((await post(env, 'a', { action: 'claim', badge: 'night-shift' })).status, 400);
});

test('three distinct LA check-in days earn Night Shift once; GET never counts', async () => {
  const env = setup(); await join(env);
  for (let i = 0; i < 4; i++) await post(env, 'a', { action: 'checkin' });
  let self = (await json(get(env, 'a', '', 86400000))).self;
  assert.equal(self.checkinDays, 1); assert.equal(self.checkedInToday, false);
  await post(env, 'a', { action: 'checkin', day: '2040-01-01' }, 86400000);
  self = (await json(post(env, 'a', { action: 'checkin' }, 172800000))).self;
  assert.equal(self.checkinDays, 3); assert.ok(self.badges.some((b) => b.id === 'night-shift'));
  const earned = self.badges.find((b) => b.id === 'night-shift').earnedAt;
  self = (await json(post(env, 'a', { action: 'checkin' }, 259200000))).self;
  assert.equal(self.badges.find((b) => b.id === 'night-shift').earnedAt, earned);
  assert.equal(clubDay(new Date('2026-09-30T06:59:00Z')), '2026-09-29');
  assert.equal(clubDay(new Date('2026-09-30T07:01:00Z')), '2026-09-30');
});

test('atomic post cooldown and hourly quota include removed posts', async () => {
  const env = setup(); await join(env);
  const parallel = await Promise.all([send(env), send(env)]);
  assert.deepEqual(parallel.map((r) => r.status).sort(), [201, 429]);
  assert.equal(parallel.find((r) => r.status === 429).headers.get('retry-after'), '30');
  const id = (await json(get(env, 'a'))).posts[0].id;
  await post(env, 'a', { action: 'delete', postId: id });
  assert.equal((await send(env, 'a', 'general', 1000)).status, 429);
  for (let i = 1; i <= 9; i++) assert.equal((await send(env, 'a', 'general', i * 31000)).status, 201);
  const limited = await send(env, 'a', 'workshop', 310000);
  assert.equal(limited.status, 429); assert.ok(Number(limited.headers.get('retry-after')) > 3000);
  assert.ok(!(await json(get(env, 'a'))).self.badges.some((b) => b.id === 'pixel-builder'));
  assert.equal((await send(env, 'a', 'general', 3600001)).status, 201);
});

test('reports stay private, owners remove their posts, and only director can moderate', async () => {
  const env = setup(); await join(env); await join(env, 'b', 'ByteBard'); await send(env);
  const id = (await json(get(env))).posts[0].id;
  assert.equal((await post(env, 'b', { action: 'delete', postId: id })).status, 404);
  assert.equal((await post(env, 'b', { action: 'report', postId: id, reason: 'privacy' })).status, 200);
  assert.equal((await post(env, 'b', { action: 'report', postId: id, reason: 'privacy' })).status, 200);
  assert.equal((await get(env, 'b', '?moderation=1')).status, 403);
  assert.equal((await get(env, undefined, '?moderation=1')).status, 403);
  let reports = (await json(get(env, 'director', '?moderation=1'))).reports;
  assert.equal(reports.length, 1); assert.equal(reports[0].reason, 'privacy'); assert.ok(!JSON.stringify(reports).includes('reporter'));
  assert.equal((await post(env, 'b', { action: 'suspend', handle: 'PixelPilot' })).status, 403);
  await post(env, 'director', { action: 'suspend', handle: 'PixelPilot' });
  assert.equal((await json(get(env))).memberCount, 1); assert.equal((await json(get(env))).posts.length, 0);
  assert.equal((await send(env, 'a', 'general', 60000)).status, 403);
  assert.equal((await post(env, 'a', { action: 'checkin' }, 86400000)).status, 403);
  await post(env, 'director', { action: 'restore', handle: 'PixelPilot' });
  assert.equal((await json(get(env))).posts.length, 1);
  await post(env, 'director', { action: 'resolve', postId: id });
  assert.equal((await json(get(env, 'director', '?moderation=1'))).reports.length, 0);
  await post(env, 'a', { action: 'delete', postId: id });
  assert.equal((await json(get(env))).postCount, 0);
  assert.equal(env.AUTH_DB.db.prepare('SELECT body FROM atari_club_posts WHERE id = ?').get(id).body, '');
  assert.ok((await json(get(env, 'a'))).self.badges.some((b) => b.id === 'first-transmission'), 'earned badge survives deletion');
});

test('validation, cross-origin checks, bounded bodies, and outages fail explicitly', async () => {
  const env = setup(); await join(env);
  for (const text of ['', 'x'.repeat(1001), '<script>alert(1)</script>', '\u202Ehidden', 'x\n'.repeat(17)]) assert.throws(() => clubBody(text));
  for (const handle of ['aa', 'x'.repeat(21), 'Name With Spaces', 'ｏverlord', '1handle', 'a\u0000b']) assert.throws(() => clubHandle(handle));
  assert.equal(clubBody('  good\r\ntext  '), 'good\ntext');
  assert.equal((await handleClubPost(request({ action: 'checkin' }, 'a', { origin: 'https://evil.test' }), env)).status, 403);
  assert.equal((await handleClubPost(request({ action: 'checkin' }, 'a', { 'sec-fetch-site': 'cross-site' }), env)).status, 403);
  assert.equal((await handleClubPost(request({ action: 'post', body: 'x'.repeat(9000) }, 'a'), env)).status, 413);
  assert.equal((await post(env, 'a', { action: 'post', body: 'hello', channel: "general' OR 1=1" })).status, 400);
  assert.equal((await get(env, 'a', '?channel=bogus')).status, 400);
  assert.equal((await get({})).status, 503);
  env.AUTH_DB.db.exec('DROP TABLE atari_club_reports; DROP TABLE atari_club_checkins; DROP TABLE atari_club_posts; DROP TABLE atari_club_members;');
  const unavailable = await get(env);
  assert.equal(unavailable.status, 503); const failed = await unavailable.json();
  assert.equal(failed.ready, false); assert.equal(failed.memberCount, undefined); assert.ok(failed.message);
});

test('join races preserve one handle and posting batches roll back failed awards', async () => {
  const env = setup();
  const joins = await Promise.all([join(env, 'a', 'OneHandle'), join(env, 'a', 'OtherHandle')]);
  assert.deepEqual(joins.map((r) => r.status).sort(), [201, 409]);
  assert.equal((await json(get(env))).memberCount, 1);
  env.AUTH_DB.db.exec("CREATE TRIGGER fail_award BEFORE UPDATE OF first_post_at ON atari_club_members BEGIN SELECT RAISE(ABORT, 'simulated storage outage'); END;");
  assert.equal((await send(env)).status, 503);
  const state = await json(get(env, 'a'));
  assert.equal(state.postCount, 0);
  assert.deepEqual(state.self.badges.map((b) => b.id), ['first-carrier']);
});

test('report quota and expired sessions cannot bypass membership authorization', async () => {
  const env = setup(); await join(env); await join(env, 'b', 'ByteBard');
  for (let i = 0; i < 11; i++) await send(env, 'a', 'general', i * 3700000);
  const messages = (await json(get(env))).posts;
  for (const message of messages.slice(0, 10)) assert.equal((await post(env, 'b', { action: 'report', postId: message.id, reason: 'spam' })).status, 200);
  assert.equal((await post(env, 'b', { action: 'report', postId: messages[10].id, reason: 'spam' })).status, 429);
  const before = await json(get(env));
  assert.equal(before.posts.length, 11, 'reports do not silently hide other people');
  await post(env, 'director', { action: 'delete', postId: messages[0].id });
  assert.equal((await json(get(env))).posts.length, 10);
  env.AUTH_DB.db.prepare('UPDATE sessions SET expires_at = ? WHERE user_id = ?').run(Date.now() - 1, 'b');
  assert.equal((await post(env, 'b', { action: 'post', channel: 'general', body: 'forged', userId: 'a', canModerate: true })).status, 401);
});
