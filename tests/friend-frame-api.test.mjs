import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { handleFrameCreate, handleFrameGet, handleSeat, handleImagePost, handleImageGet, handleOwner } from '../functions/api/friend-frame/_store.ts';
import { laToday, nextDateForDay, weekOf, cleanPost, nounSeed, dayOf } from '../src/lib/friend-frame.ts';

const SQL = await readFile(new URL('../migrations/auth/0022_friend_frame.sql', import.meta.url), 'utf8');
class SqliteD1 {
  constructor() { this.db = new DatabaseSync(':memory:'); this.db.exec(SQL); }
  prepare(sql) {
    let args = []; const db = this.db;
    const execute = (mode) => { const s = db.prepare(sql); return mode === 'first' ? s.get(...args) ?? null : mode === 'all' ? { results: s.all(...args) } : { meta: { changes: Number(s.run(...args).changes) } }; };
    const r = { bind(...v) { args = v; return r; }, async first() { return execute('first'); }, async all() { return execute('all'); }, async run() { return execute('run'); }, execute };
    return r;
  }
  async batch(stmts) { this.db.exec('BEGIN'); try { const out = stmts.map((s) => s.execute('run')); this.db.exec('COMMIT'); return out; } catch (e) { this.db.exec('ROLLBACK'); throw e; } }
}
const BASE = 'https://pointcast.xyz/api/friend-frame';
const post = (path, body, ip = '192.0.2.4') => new Request(`${BASE}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body) });
// Thursday 2026-09-24, 8am in El Segundo.
const THU = { now: () => new Date('2026-09-24T15:00:00Z') };
const MON_NEXT = { now: () => new Date('2026-09-28T19:00:00Z') };

test('LA calendar math: today, next seat date, week', () => {
  assert.deepEqual(laToday(new Date('2026-09-25T06:30:00Z')), { date: '2026-09-24', day: 3 }); // 11:30pm Thu in LA
  assert.equal(nextDateForDay('2026-09-24', 3), '2026-09-24');
  assert.equal(nextDateForDay('2026-09-24', 0), '2026-09-28');
  assert.equal(nextDateForDay('2026-09-24', 2), '2026-09-30');
  assert.deepEqual(weekOf('2026-09-24'), ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']);
  assert.equal(dayOf('2026-11-01'), 6);
  assert.equal(nounSeed('Ada', 0), nounSeed(' ada ', 0));
  assert.ok(nounSeed('Ada', 0) < 1200);
});

test('post rules: plain text, bounded, https pictures only, something to hang', () => {
  const seat = { friend: 'Dev', color: '#4b3621' };
  assert.equal(cleanPost({ poem: 'a\r\nb   \n\n\n\nc' }, seat).poem, 'a\nb\n\nc');
  assert.equal(cleanPost({ note: 'hi', friend: '  Ro‮se  ' }, seat).friend, 'Rose');
  for (const bad of [{}, { picture: 'http://x.test/a.jpg' }, { picture: 'javascript:alert(1)' }, { picture: 'https://u:p@x.test/a.png' }, { poem: 'x'.repeat(601) }, { poem: 'x\n'.repeat(15) }, { note: 'n'.repeat(141) }, { note: 'ok', color: 'red' }, { poem: 5 }]) {
    assert.throws(() => cleanPost(bad, seat), undefined, JSON.stringify(bad));
  }
  assert.equal(cleanPost({ picture: 'https://x.test/a b.jpg' }, seat).picture, 'https://x.test/a%20b.jpg');
});

test('a frame is made with seven private seats; a friend hangs their day; the town reads it', async () => {
  const env = { AUTH_DB: new SqliteD1() };
  const made = await (await handleFrameCreate(post('frame', { title: '  The   Porch ', friends: ['Ada', '', 'Cleo', 'Dev'] }), env, THU)).json();
  assert.equal(made.frame.title, 'The Porch');
  assert.equal(made.seats.length, 7);
  assert.equal(new Set(made.seats.map((s) => s.key)).size, 7);
  // Nothing secret is stored in the clear.
  const dump = JSON.stringify(env.AUTH_DB.db.prepare('SELECT * FROM friend_frames').all()) + JSON.stringify(env.AUTH_DB.db.prepare('SELECT * FROM friend_frame_seats').all());
  assert.ok(!dump.includes(made.ownerKey));
  for (const s of made.seats) assert.ok(!dump.includes(s.key));

  const dev = made.seats[3];
  const opened = await (await handleSeat(post('seat', { id: made.frame.id, key: dev.key, action: 'open' }), env, THU)).json();
  assert.equal(opened.date, '2026-09-24'); assert.equal(opened.isToday, true); assert.equal(opened.post, null);

  const hung = await handleSeat(post('seat', { id: made.frame.id, key: dev.key, action: 'save', post: { poem: 'a drum\nin the hall', note: 'court 3', color: '#254de5', picture: 'https://example.com/p.jpg' } }), env, THU);
  assert.equal(hung.status, 201);
  const again = await handleSeat(post('seat', { id: made.frame.id, key: dev.key, action: 'save', post: { poem: 'rehung', friend: 'Devon' } }), env, THU);
  assert.equal(again.status, 200);

  const ada = made.seats[0];
  const programmed = await (await handleSeat(post('seat', { id: made.frame.id, key: ada.key, action: 'save', post: { note: 'see you monday' } }), env, THU)).json();
  assert.equal(programmed.date, '2026-09-28'); assert.equal(programmed.isToday, false);

  const view = await handleFrameGet(new Request(`${BASE}/frame?id=${made.frame.id}`), env, THU);
  assert.match(view.headers.get('Cache-Control'), /s-maxage/);
  const v = await view.json();
  assert.equal(v.todayPost.poem, 'rehung'); assert.equal(v.todayPost.friend, 'Devon'); assert.equal(v.todayPost.picture, null);
  assert.equal(v.seats[3].friend, 'Devon');
  assert.equal(v.week[3].post.date, '2026-09-24');
  assert.equal(v.record.length, 1, 'next Monday is programmed, not yet in the record');
  assert.equal(v.kept, 1);
  assert.ok(!JSON.stringify(v).includes(dev.key));

  // Monday arrives: Ada's frame is up, Thursday is in the record.
  const monday = await (await handleFrameGet(new Request(`${BASE}/frame?id=${made.frame.id}`), env, MON_NEXT)).json();
  assert.equal(monday.todayPost.friend, 'Ada');
  assert.deepEqual(monday.record.map((p) => p.date), ['2026-09-28', '2026-09-24']);
  // Past days are locked: Dev's next save goes to next Thursday.
  const later = await (await handleSeat(post('seat', { id: made.frame.id, key: dev.key, action: 'open' }), env, MON_NEXT)).json();
  assert.equal(later.date, '2026-10-01');
  // A permalink reads one day.
  const focus = await (await handleFrameGet(new Request(`${BASE}/frame?id=${made.frame.id}&date=2026-09-24`), env, MON_NEXT)).json();
  assert.equal(focus.focus.poem, 'rehung');
});

test('seat and owner links are checked; a re-keyed seat link stops working', async () => {
  const env = { AUTH_DB: new SqliteD1() };
  const made = await (await handleFrameCreate(post('frame', { title: 'Keys' }), env, THU)).json();
  const id = made.frame.id;
  assert.equal((await handleSeat(post('seat', { id, key: 's_' + 'x'.repeat(26), action: 'open' }), env, THU)).status, 400);
  assert.equal((await handleSeat(post('seat', { id, key: made.ownerKey, action: 'open' }), env, THU)).status, 400);
  assert.equal((await handleSeat(post('seat', { id: 'nope123456', key: made.seats[0].key, action: 'open' }), env, THU)).status, 404);
  assert.equal((await handleOwner(post('owner', { id, ownerKey: 'o_' + 'y'.repeat(32), action: 'view' }), env, THU)).status, 400);

  const view = await (await handleOwner(post('owner', { id, ownerKey: made.ownerKey, action: 'view' }), env, THU)).json();
  assert.deepEqual(view.seats.map((s) => s.key), made.seats.map((s) => s.key), 'owner console re-derives the same seat links');

  const rekeyed = await (await handleOwner(post('owner', { id, ownerKey: made.ownerKey, action: 'rekey', day: 2 }), env, THU)).json();
  assert.notEqual(rekeyed.seats[2].key, made.seats[2].key);
  assert.equal((await handleSeat(post('seat', { id, key: made.seats[2].key, action: 'open' }), env, THU)).status, 400);
  assert.equal((await handleSeat(post('seat', { id, key: rekeyed.seats[2].key, action: 'open' }), env, THU)).status, 200);

  await handleOwner(post('owner', { id, ownerKey: made.ownerKey, action: 'seat', day: 3, friend: 'Mo', color: '#b0432e' }), env, THU);
  await handleOwner(post('owner', { id, ownerKey: made.ownerKey, action: 'title', title: 'Keys & Co' }), env, THU);
  await handleSeat(post('seat', { id, key: made.seats[3].key, action: 'save', post: { note: 'spam', friend: 'Zed' } }), env, THU);
  const hidden = await (await handleOwner(post('owner', { id, ownerKey: made.ownerKey, action: 'hide', date: '2026-09-24' }), env, THU)).json();
  assert.equal(hidden.hidden.length, 1); assert.equal(hidden.frame.title, 'Keys & Co');
  const pub = await (await handleFrameGet(new Request(`${BASE}/frame?id=${id}`), env, THU)).json();
  assert.equal(pub.todayPost, null); assert.equal(pub.seats[3].friend, 'Zed', 'the friend signing their frame wins over the owner label'); assert.equal(pub.kept, 0);
});

test('uploads: real image bytes only, owned by the seat, served immutable', async () => {
  const env = { AUTH_DB: new SqliteD1() };
  const made = await (await handleFrameCreate(post('frame', { title: 'Pics' }), env, THU)).json();
  const id = made.frame.id, key = made.seats[3].key;
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a5e1f7e70000000049454e44ae426082', 'hex').toString('base64');
  const up = await handleImagePost(post('image', { id, key, data: png }), env, THU);
  assert.equal(up.status, 201);
  const { picture, url } = await up.json();
  const got = await handleImageGet(new Request(`https://pointcast.xyz${url}`), env);
  assert.equal(got.headers.get('Content-Type'), 'image/png'); assert.match(got.headers.get('Cache-Control'), /immutable/);
  assert.equal(Buffer.from(await got.arrayBuffer()).toString('base64'), png);
  assert.equal((await handleImagePost(post('image', { id, key, data: Buffer.from('<svg onload=alert(1)>').toString('base64') }), env, THU)).status, 400);
  // Another seat cannot hang this upload.
  assert.equal((await handleSeat(post('seat', { id, key: made.seats[0].key, action: 'save', post: { picture, friend: 'Ada' } }), env, THU)).status, 400);
  const hung = await (await handleSeat(post('seat', { id, key, action: 'save', post: { picture, friend: 'Dev' } }), env, THU)).json();
  assert.equal(hung.post.picture, url);
  assert.equal((await handleImageGet(new Request(`${BASE}/image?id=../../etc`), env)).status, 404);
});

test('limits and outages never report success', async () => {
  const env = { AUTH_DB: new SqliteD1() };
  for (let i = 0; i < 6; i++) assert.equal((await handleFrameCreate(post('frame', { title: `F${i}` }), env, THU)).status, 201);
  assert.equal((await handleFrameCreate(post('frame', { title: 'F7' }), env, THU)).status, 429);
  assert.equal((await handleFrameCreate(post('frame', { title: 'other ip' }, '198.51.100.7'), env, THU)).status, 201);
  assert.equal((await handleFrameCreate(post('frame', { title: '' }), env, THU)).status, 400);
  assert.equal((await handleFrameCreate(post('frame', { title: 'x' }), {}, THU)).status, 503);
  assert.equal((await handleFrameGet(new Request(`${BASE}/frame?id=town`), env, THU)).status, 404);
  const made = await (await handleFrameCreate(post('frame', { title: 'Edits' }, '203.0.113.1'), env, THU)).json();
  const key = made.seats[3].key;
  for (let i = 0; i < 40; i++) await handleSeat(post('seat', { id: made.frame.id, key, action: 'save', post: { note: `n${i}`, friend: 'Eve' } }), env, THU);
  assert.equal((await handleSeat(post('seat', { id: made.frame.id, key, action: 'save', post: { note: 'too many', friend: 'Eve' } }), env, THU)).status, 429);
  const broken = { AUTH_DB: { prepare() { throw new Error('d1 down'); } } };
  assert.equal((await handleFrameGet(new Request(`${BASE}/frame?id=${made.frame.id}`), broken, THU)).status, 503);
});
