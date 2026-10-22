/**
 * Family Room: the family's Grok bots talk at /family-room/, the family watches.
 * functions/_lib/family-room.mjs, functions/api/family-room.ts, and the two
 * MCP tools in functions/api/mcp.ts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  BURST_MAX,
  IDLE_MS,
  MEMBERS,
  ONLINE_MS,
  TEXT_MAX,
  canRead,
  hideMessage,
  memberForToken,
  parsePost,
  postToRoom,
  presence,
  readRoom,
} from '../functions/_lib/family-room.mjs';
import { onRequestGet, onRequestPost } from '../functions/api/family-room.ts';

function d1() {
  const db = new DatabaseSync(':memory:');
  const statement = (sql, args = []) => ({
    bind: (...next) => statement(sql, next),
    async first() { return db.prepare(sql).get(...args) ?? null; },
    async all() { return { results: db.prepare(sql).all(...args) }; },
    async run() {
      const r = db.prepare(sql).run(...args);
      return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
    },
  });
  return { raw: db, prepare: (sql) => statement(sql) };
}

const KEYS = {
  FAMILY_ROOM_KEY_MIKE: 'mike-key-0123456789',
  FAMILY_ROOM_KEY_MORGAN: 'morgan-key-0123456789',
  FAMILY_ROOM_KEY_KANA: 'kana-key-0123456789',
  FAMILY_ROOM_KEY_KENZO: 'kenzo-key-0123456789',
};
const member = (id) => MEMBERS.find((m) => m.id === id);
const T0 = Date.parse('2026-10-22T18:00:00Z');

test('the key decides who is talking; short and shared keys match nobody', () => {
  assert.equal(memberForToken(KEYS, KEYS.FAMILY_ROOM_KEY_KANA).member.id, 'kana');
  assert.equal(memberForToken(KEYS, 'nope-nope-nope-nope').member, null);
  assert.equal(memberForToken(KEYS, '').member, null);
  assert.equal(memberForToken({ FAMILY_ROOM_KEY_KENZO: 'short' }, 'short').member, null, 'keys under 16 characters count as unset');
  const shared = memberForToken({ ...KEYS, FAMILY_ROOM_KEY_KENZO: KEYS.FAMILY_ROOM_KEY_KANA }, KEYS.FAMILY_ROOM_KEY_KANA);
  assert.equal(shared.member, null);
  assert.equal(shared.shared, true);
});

test('the room is open to read until a read key is set, then the read key or a bot key opens it', () => {
  assert.equal(canRead(KEYS, {}), true);
  const gated = { ...KEYS, FAMILY_ROOM_READ_KEY: 'family-password-123' };
  assert.equal(canRead(gated, {}), false);
  assert.equal(canRead(gated, { familyKey: 'family-password-123' }), true);
  assert.equal(canRead(gated, { bearer: KEYS.FAMILY_ROOM_KEY_MIKE }), true);
  assert.equal(canRead(gated, { familyKey: 'wrong-password-1234' }), false);
});

test('presence reads like a buddy list: online, idle, away, offline', () => {
  assert.equal(presence(null, T0), 'offline');
  assert.equal(presence({ last_seen: T0 - 1000 }, T0), 'online');
  assert.equal(presence({ last_seen: T0 - ONLINE_MS - 1 }, T0), 'idle');
  assert.equal(presence({ last_seen: T0 - 1000, away: 'at practice' }, T0), 'away');
  assert.equal(presence({ last_seen: T0 - IDLE_MS }, T0), 'offline');
  assert.equal(presence({ last_seen: T0 - 1000, left_at: T0 - 500 }, T0), 'offline');
});

test('coming in writes an entered line once, then lines, and after= returns only newer ones', async () => {
  const db = d1();
  const first = await postToRoom(db, member('kana'), parsePost({ text: 'hi everyone' }), T0);
  assert.equal(first.status, 201);
  assert.deepEqual(first.lines.map((l) => l.kind), ['enter', 'say']);
  assert.equal(first.lines[0].text, 'KanaGrok has entered the room.');
  const second = await postToRoom(db, member('kana'), parsePost({ text: 'anyone up?' }), T0 + 1000);
  assert.deepEqual(second.lines.map((l) => l.kind), ['say']);
  await postToRoom(db, member('mike'), parsePost({ text: 'gm kana' }), T0 + 2000);

  const room = await readRoom(db, KEYS, { now: T0 + 3000 });
  assert.equal(room.schema, 'pointcast.family-room/v1');
  assert.deepEqual(room.messages.map((m) => `${m.screenName}:${m.kind}`), [
    'KanaGrok:enter', 'KanaGrok:say', 'KanaGrok:say', 'DadGrok:enter', 'DadGrok:say',
  ]);
  const byId = Object.fromEntries(room.members.map((m) => [m.id, m]));
  assert.equal(byId.kana.status, 'online');
  assert.equal(byId.morgan.status, 'offline');
  assert.equal(byId.kenzo.ready, true);
  assert.equal(room.cursor, room.messages.at(-1).seq);

  const newer = await readRoom(db, KEYS, { after: room.messages[2].seq, now: T0 + 3000 });
  assert.deepEqual(newer.messages.map((m) => m.text), ['DadGrok has entered the room.', 'gm kana']);
  const none = await readRoom(db, KEYS, { after: room.cursor, now: T0 + 3000 });
  assert.equal(none.messages.length, 0);
  assert.equal(none.cursor, room.cursor);
});

test('away sticks until the bot talks; leaving writes a line; an offline leave writes nothing', async () => {
  const db = d1();
  await postToRoom(db, member('kenzo'), parsePost({ text: 'yo' }), T0);
  const away = await postToRoom(db, member('kenzo'), parsePost({ away: 'at soccer' }), T0 + 1000);
  assert.deepEqual(away.lines, []);
  assert.equal(away.you.status, 'away');
  let room = await readRoom(db, KEYS, { now: T0 + 2000 });
  assert.equal(room.members.find((m) => m.id === 'kenzo').away, 'at soccer');

  const back = await postToRoom(db, member('kenzo'), parsePost({ text: 'back' }), T0 + 3000);
  assert.equal(back.you.status, 'online');
  assert.equal(back.you.away, null);

  const left = await postToRoom(db, member('kenzo'), parsePost({ leave: true }), T0 + 4000);
  assert.deepEqual(left.lines.map((l) => l.text), ['KenzoGrok has left the room.']);
  room = await readRoom(db, KEYS, { now: T0 + 5000 });
  assert.equal(room.members.find((m) => m.id === 'kenzo').status, 'offline');

  const again = await postToRoom(db, member('kenzo'), parsePost({ leave: true }), T0 + 6000);
  assert.deepEqual(again.lines, [], 'leaving when already gone is quiet');
  const rejoin = await postToRoom(db, member('kenzo'), parsePost({ text: 'here again' }), T0 + 7000);
  assert.deepEqual(rejoin.lines.map((l) => l.kind), ['enter', 'say']);
});

test('input is checked: strings only, a length cap, control characters gone', () => {
  assert.equal(parsePost(null).ok, false);
  assert.equal(parsePost([]).ok, false);
  assert.equal(parsePost({ text: 42 }).ok, false);
  assert.equal(parsePost({ away: true }).ok, false);
  assert.equal(parsePost({ text: 'x'.repeat(TEXT_MAX + 1) }).ok, false);
  assert.equal(parsePost({ text: 'a\u0007b   c' }).text, 'ab c');
  assert.equal(parsePost({ leave: 'yes' }).leave, false, 'only true leaves');
  assert.equal(parsePost({}).ok, true, 'an empty post is a heartbeat');
});

test('one bot gets twenty lines every ten minutes', async () => {
  const db = d1();
  for (let i = 0; i < BURST_MAX; i += 1) {
    const r = await postToRoom(db, member('morgan'), parsePost({ text: `line ${i}` }), T0 + i);
    assert.equal(r.ok, true);
  }
  const blocked = await postToRoom(db, member('morgan'), parsePost({ text: 'one more' }), T0 + 100);
  assert.equal(blocked.status, 429);
  const other = await postToRoom(db, member('mike'), parsePost({ text: 'my turn' }), T0 + 100);
  assert.equal(other.ok, true, 'the limit is per bot');
  const later = await postToRoom(db, member('morgan'), parsePost({ text: 'later' }), T0 + 11 * 60 * 1000);
  assert.equal(later.ok, true);
});

test('a hidden line leaves the room and is listed so open pages drop it', async () => {
  const db = d1();
  const r = await postToRoom(db, member('mike'), parsePost({ text: 'oops' }), T0);
  const seq = r.lines.find((l) => l.kind === 'say').seq;
  assert.equal((await hideMessage(db, seq)).ok, true);
  assert.equal((await hideMessage(db, 9999)).status, 404);
  assert.equal((await hideMessage(db, 'x')).status, 400);
  const room = await readRoom(db, KEYS, { now: T0 + 1000 });
  assert.equal(room.messages.some((m) => m.seq === seq), false);
  assert.deepEqual(room.hidden, [seq]);
});

const BASE = 'https://pointcast.xyz/api/family-room';
const get = (env, { qs = '', headers = {} } = {}) => onRequestGet({ request: new Request(BASE + qs, { headers }), env, params: {} });
const post = (env, body, headers = {}) => onRequestPost({
  request: new Request(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }),
  env,
  params: {},
});

test('HTTP: closed without storage, refuses posts until keys are set, then the key speaks', async () => {
  assert.equal((await get({})).status, 503);
  const db = d1();
  const noKeys = await post({ AUTH_DB: db }, { text: 'hi' }, { Authorization: 'Bearer whatever-whatever' });
  assert.equal(noKeys.status, 503);
  assert.equal((await noKeys.json()).reason, 'keys-not-set');

  const env = { AUTH_DB: db, ...KEYS };
  assert.equal((await post(env, { text: 'hi' })).status, 401);
  assert.equal((await post(env, { text: 'hi' }, { Authorization: 'Bearer wrong-wrong-wrong-wrong' })).status, 401);
  assert.equal((await post(env, '{nope', { Authorization: `Bearer ${KEYS.FAMILY_ROOM_KEY_KANA}` })).status, 400);
  assert.equal((await post(env, { text: 'x'.repeat(9000) }, { Authorization: `Bearer ${KEYS.FAMILY_ROOM_KEY_KANA}` })).status, 413);

  const ok = await post(env, { text: 'hello room', member: 'mike' }, { Authorization: `Bearer ${KEYS.FAMILY_ROOM_KEY_KANA}` });
  assert.equal(ok.status, 201);
  const body = await ok.json();
  assert.equal(body.you.id, 'kana', 'the body cannot pick who is talking');

  const read = await get(env);
  assert.equal(read.status, 200);
  assert.equal(read.headers.get('x-robots-tag'), 'noindex, nofollow');
  const room = await read.json();
  assert.equal(room.messages.at(-1).text, 'hello room');
  assert.equal(room.setup.keys.every((k) => k.set), true);
  assert.equal(JSON.stringify(room).includes(KEYS.FAMILY_ROOM_KEY_KANA), false, 'no key value is ever echoed');
});

test('HTTP: a family read key gates reading, and only the admin key hides', async () => {
  const db = d1();
  const env = { AUTH_DB: db, ...KEYS, FAMILY_ROOM_READ_KEY: 'family-password-123', FAMILY_ROOM_ADMIN_KEY: 'admin-key-0123456789' };
  const gated = await get(env);
  assert.equal(gated.status, 401);
  assert.equal((await gated.json()).reason, 'family-key-required');
  assert.equal((await get(env, { headers: { 'X-Family-Key': 'family-password-123' } })).status, 200);
  assert.equal((await get(env, { headers: { Authorization: `Bearer ${KEYS.FAMILY_ROOM_KEY_MIKE}` } })).status, 200);

  const said = await (await post(env, { text: 'take me down' }, { Authorization: `Bearer ${KEYS.FAMILY_ROOM_KEY_MIKE}` })).json();
  const seq = said.lines.at(-1).seq;
  assert.equal((await post(env, { hide: seq }, { Authorization: `Bearer ${KEYS.FAMILY_ROOM_KEY_MIKE}` })).status, 401, 'a bot key cannot hide');
  const hidden = await post(env, { hide: seq }, { Authorization: 'Bearer admin-key-0123456789' });
  assert.equal(hidden.status, 200);
  const room = await (await get(env, { qs: '?after=0', headers: { 'X-Family-Key': 'family-password-123' } })).json();
  assert.equal(room.messages.some((m) => m.seq === seq), false);
});

test('MCP: family_room_read is read-only, family_room_post speaks as the key holder', async (t) => {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  const mcp = await server.ssrLoadModule('/functions/api/mcp.ts');
  const env = { AUTH_DB: d1(), ...KEYS };
  const rpc = async (method, params, headers = {}) => (await mcp.onRequestPost({
    env,
    request: new Request('https://pointcast.xyz/api/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }),
  })).json();

  const { result } = await rpc('tools/list', {});
  const read = result.tools.find((tool) => tool.name === 'family_room_read');
  const write = result.tools.find((tool) => tool.name === 'family_room_post');
  assert.equal(read.annotations.readOnlyHint, true);
  assert.equal(write.annotations.readOnlyHint, false);

  const denied = await rpc('tools/call', { name: 'family_room_post', arguments: { text: 'hi', token: 'not-a-key-at-all' } });
  assert.equal(denied.result.isError, true);
  const byArg = await rpc('tools/call', { name: 'family_room_post', arguments: { text: 'hi from mcp', token: KEYS.FAMILY_ROOM_KEY_KENZO } });
  assert.equal(JSON.parse(byArg.result.content[0].text).you.id, 'kenzo');
  const byHeader = await rpc('tools/call', { name: 'family_room_post', arguments: { text: 'and from a header' } }, { Authorization: `Bearer ${KEYS.FAMILY_ROOM_KEY_MORGAN}` });
  assert.equal(JSON.parse(byHeader.result.content[0].text).you.id, 'morgan');

  const room = JSON.parse((await rpc('tools/call', { name: 'family_room_read', arguments: {} })).result.content[0].text);
  assert.deepEqual(room.messages.filter((m) => m.kind === 'say').map((m) => `${m.screenName}: ${m.text}`), [
    'KenzoGrok: hi from mcp',
    'MomGrok: and from a header',
  ]);
});

test('one topic a day in El Segundo time, the same for every reader', async () => {
  const { TOPICS, roomDate, topicFor } = await import('../functions/_lib/family-room.mjs');
  // 06:30 UTC on Oct 23 is still Oct 22 in El Segundo.
  assert.equal(roomDate(Date.parse('2026-10-23T06:30:00Z')), '2026-10-22');
  const a = topicFor(Date.parse('2026-10-22T08:00:00Z'));
  const b = topicFor(Date.parse('2026-10-23T06:30:00Z'));
  const c = topicFor(Date.parse('2026-10-23T08:00:00Z'));
  assert.equal(a.text, b.text);
  assert.notEqual(a.text, c.text);
  assert.ok(TOPICS.includes(c.text));
  const room = await readRoom(d1(), KEYS, { now: T0 });
  assert.deepEqual(room.topic, topicFor(T0));
});

test('each buddy carries its lines from the last 24 hours', async () => {
  const db = d1();
  await postToRoom(db, member('kana'), parsePost({ text: 'old' }), T0 - 25 * 3600 * 1000);
  await postToRoom(db, member('kana'), parsePost({ text: 'one' }), T0 - 1000);
  await postToRoom(db, member('kana'), parsePost({ text: 'two' }), T0 - 500);
  const room = await readRoom(db, KEYS, { now: T0 });
  const byId = Object.fromEntries(room.members.map((m) => [m.id, m.linesToday]));
  assert.deepEqual(byId, { mike: 0, morgan: 0, kana: 2, kenzo: 0 });
});

test('the invite names the bot, the others and its own key, and nobody else\'s', async () => {
  const { invitePrompt } = await import('../functions/_lib/family-room.mjs');
  const text = invitePrompt(member('kenzo'), 'kenzo-secret-key-123');
  assert.match(text, /^You are Kenzo Montana's Grok\. Your screen name is KenzoGrok\./);
  assert.match(text, /DadGrok \(Mike's\), MomGrok \(Morgan's\), KanaGrok \(Kana Jane's\)/);
  assert.match(text, /Authorization: Bearer kenzo-secret-key-123/);
  assert.doesNotMatch(text, /KenzoGrok \(Kenzo/);
  assert.match(text, /family_room_post/);
});

test('the invites script writes private files outside the repo and never prints a key', async () => {
  const { spawnSync } = await import('node:child_process');
  const { mkdtempSync, readdirSync, readFileSync, statSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const out = join(mkdtempSync(join(tmpdir(), 'family-room-')), 'invites');
  const run = spawnSync(process.execPath, ['scripts/family-room-invites.mjs', '--out', out, '--family-only'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const files = readdirSync(out).sort();
  assert.deepEqual(files, ['admin.txt', 'family-password.txt', 'kana-KanaGrok.txt', 'kenzo-KenzoGrok.txt', 'mike-DadGrok.txt', 'morgan-MomGrok.txt']);
  const keys = new Set();
  for (const name of files) {
    assert.equal(statSync(join(out, name)).mode & 0o077, 0, `${name} is owner-only`);
    const text = readFileSync(join(out, name), 'utf8');
    const key = (text.match(/Bearer ([0-9a-f]{48})/) || [])[1];
    if (key) {
      keys.add(key);
      assert.equal(run.stdout.includes(key), false, 'no key on stdout');
    }
  }
  assert.equal(keys.size, 5, 'four bots and the admin, each with its own key');
  const inside = spawnSync(process.execPath, ['scripts/family-room-invites.mjs', '--out', 'tmp/family-room-invites-test'], { encoding: 'utf8' });
  assert.equal(inside.status, 1);
  assert.match(inside.stderr, /Refusing to write keys inside the repo/);
});
