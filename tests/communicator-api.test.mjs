import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import schedule from '../src/data/courts-schedule.json' with { type: 'json' };
import { DEMO_PROFILES, DEMO_LADDER, DEMO_NOW } from '../public/communicator/demo.mjs';
import * as L from '../public/communicator/ledger.mjs';
import * as S from '../functions/_lib/communicator-store.ts';
import * as H from '../functions/_lib/communicator-http.ts';

// Communicator v1-a (docs/prd/communicator-v1.md 4.1, 4.2, 5): the migration, the store, and the
// request handlers behind functions/api/communicator/*. D1 is node:sqlite running the real migration
// (as tests/air-desk-api.test.mjs does), plus the two auth tables readSessionFromRequest reads.

const root = new URL('../', import.meta.url);
const MIGRATION = await readFile(new URL('migrations/auth/0033_communicator.sql', root), 'utf8');
const NOW = Date.parse(DEMO_NOW); // Tue 2026-11-10 18:00 Pacific
const VENUES = S.venuesFromSchedule(schedule);
const LADDER = L.DEFAULT_LADDER.id;

class SqliteD1 {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec(MIGRATION);
    this.db.exec('CREATE TABLE sessions (token TEXT PRIMARY KEY, user_id TEXT, expires_at INTEGER); CREATE TABLE users (id TEXT PRIMARY KEY, payload TEXT)');
  }
  prepare(sql) {
    const db = this.db;
    let args = [];
    const reads = /^\s*SELECT|\bRETURNING\b/i.test(sql);
    const execute = () => {
      const s = db.prepare(sql);
      if (!reads) return { results: [], meta: { changes: Number(s.run(...args).changes) } };
      return { results: s.all(...args).map((row) => ({ ...row })), meta: { changes: 0 } };
    };
    const stmt = { bind(...v) { args = v; return stmt; }, async first() { return execute().results[0] ?? null; }, async all() { return execute(); }, async run() { return execute(); } };
    return stmt;
  }
}

function town() {
  const db = new SqliteD1();
  return { db, env: { AUTH_DB: db } };
}
function addUser(t, userId, preferredName, identities) {
  const user = { userId, createdAt: '2026-01-01T00:00:00Z', preferredName, identities: identities.map((i) => ({ name: i.id, verifiedAt: '2026-01-01T00:00:00Z', ...i })), roles: [] };
  t.db.db.prepare('INSERT OR IGNORE INTO users (id, payload) VALUES (?, ?)').run(userId, JSON.stringify(user));
  t.db.db.prepare('INSERT OR IGNORE INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(`tok-${userId}`, userId, Date.now() + 86_400_000);
  return `pc_session=tok-${userId}`;
}
const call = (t, handler, method, path, cookie, body, ...rest) => {
  const headers = { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) };
  const request = new Request(`https://pointcast.xyz/api/communicator/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return handler({ request, env: t.env, venues: VENUES, now: NOW }, ...rest).then(async (res) => ({ status: res.status, headers: res.headers, body: await res.json() }));
};
const seedRoster = async (t) => { for (const p of DEMO_PROFILES) await S.upsertProfile(t.db, p, { at: NOW }); };
const ASK = 'Get me a 4.0 doubles game Thursday evening at Rec Park';
const hostCookie = (t) => addUser(t, 'u-host', 'Mike Hall', [{ provider: 'google', id: 'g-123' }, { provider: 'email', id: 'mike@example.invalid' }]);
const noLeak = (value) => {
  const s = JSON.stringify(value);
  assert.ok(!s.includes('@'), 'no @ in output');
  assert.ok(!/\d{7}/.test(s), 'no 7-digit run in output');
  assert.ok(!s.includes('"contact"'), 'no contact key');
};

test('migration: five communicator tables, JSON checks, status checks, and it runs', () => {
  assert.equal((MIGRATION.match(/CREATE TABLE communicator_(profiles|games|messages|ledger|okays) \(/g) || []).length, 5);
  assert.ok(MIGRATION.includes('CREATE INDEX communicator_games_status_slot ON communicator_games(status,slot_start)'));
  assert.ok((MIGRATION.match(/CHECK\(json_valid\(/g) || []).length === 5);
  const t = town();
  assert.throws(() => t.db.db.prepare("INSERT INTO communicator_games VALUES ('g','l','h','bogus','{}','a','b','c','d')").run(), /CHECK/);
  assert.throws(() => t.db.db.prepare("INSERT INTO communicator_profiles VALUES ('h',NULL,'not json','{}','c','d')").run(), /CHECK/);
});

test('store: upsert then getPublicProfile has no contact; getProfile without asSelf never reads the payload', async () => {
  const t = town();
  await S.upsertProfile(t.db, DEMO_PROFILES[1], { at: NOW });
  const pub = await S.getPublicProfile(t.db, 'ada-r');
  assert.deepEqual(Object.keys(pub).sort(), ['display', 'handle', 'listed', 'town', 'tier', 'venues'].sort());
  noLeak(pub);
  assert.equal((await S.getProfile(t.db, 'ada-r', { asSelf: false })).contact, undefined);
  assert.equal((await S.getProfile(t.db, 'ada-r', { asSelf: true })).contact.email, 'ada@example.invalid');
  await S.upsertProfile(t.db, { ...DEMO_PROFILES[1], display: 'Ada Q.' }, { at: NOW + 1 });
  assert.equal((await S.getPublicProfile(t.db, 'ada-r')).display, 'Ada Q.');
});

test('store: listCandidateProfiles rows have no contact key and skip non-consenting profiles', async () => {
  const t = town();
  await seedRoster(t);
  const rows = await S.listCandidateProfiles(t.db, LADDER);
  assert.ok(rows.length >= 8);
  for (const r of rows) {
    assert.ok(!('contact' in r), 'row has no contact key');
    assert.deepEqual(Object.keys(r).sort(), ['availability', 'consent', 'display', 'handle', 'ladders', 'listed', 'recent', 'tier', 'town', 'venues']);
    assert.deepEqual(Object.keys(r.ladders[LADDER]), ['declared']);
  }
  noLeak(rows);
  assert.ok(!rows.some((r) => r.handle === 'gus-o' || r.handle === 'kit-b'));
  assert.deepEqual(await S.listCandidateProfiles(t.db, 'pickleball:nowhere:open'), []);
});

test('store: appendLedger + latestLedger keeps the latest status per entry', async () => {
  const t = town();
  const e = { id: 'le_x', ladder: LADDER, kind: 'game', at: '2026-11-01T00:00:00Z', status: 'pending', sides: [{ players: ['a', 'b'], score: 11 }, { players: ['c', 'd'], score: 5 }], confirmations: [] };
  await S.appendLedger(t.db, e, { at: NOW });
  assert.equal((await S.latestLedger(t.db, LADDER))[0].status, 'pending');
  await S.appendLedger(t.db, { ...e, status: 'confirmed' }, { at: NOW + 1000 });
  await S.appendLedger(t.db, { ...e, id: 'le_y', status: 'pending' }, { at: NOW + 500 });
  const latest = await S.latestLedger(t.db, LADDER);
  assert.equal(latest.length, 2);
  assert.equal(latest.find((x) => x.id === 'le_x').status, 'confirmed');
  assert.deepEqual((await S.confirmedLedger(t.db, LADDER)).map((x) => x.id), ['le_x']);
  await S.appendLedger(t.db, { ...e, status: 'disputed' }, { at: NOW + 2000 });
  assert.equal((await S.confirmedLedger(t.db, LADDER)).length, 0);
  assert.equal(t.db.db.prepare('SELECT COUNT(*) AS n FROM communicator_ledger').get().n, 4, 'append-only');
});

test('store: games round-trip, listGamesFor finds host and roster, okays expire', async () => {
  const t = town();
  const g = { id: 'g_1', ladder: LADDER, host: 'mike', status: 'proposed', slot: { start: '2026-11-12T17:00:00-08:00', end: '2026-11-12T18:30:00-08:00' },
    roster: { in: ['mike'], maybe: [], out: [], invited: ['ada-r'], waitlist: ['bo-t'] }, history: [], createdAt: '2026-11-10T00:00:00Z' };
  await S.putGame(t.db, g, { at: NOW });
  await S.putGame(t.db, { ...g, status: 'inviting' }, { at: NOW + 1 });
  assert.equal((await S.getGame(t.db, 'g_1')).status, 'inviting');
  for (const h of ['mike', 'ada-r', 'bo-t']) assert.equal((await S.listGamesFor(t.db, h)).length, 1, h);
  assert.equal((await S.listGamesFor(t.db, 'zed')).length, 0);
  await S.recordOkay(t.db, { actor: 'mike', kind: 'invite', targetGame: 'g_1', at: NOW });
  assert.equal(await S.hasRecentOkay(t.db, { actor: 'mike', targetGame: 'g_1', withinMs: 600_000, now: NOW + 5 * 60_000 }), true);
  assert.equal(await S.hasRecentOkay(t.db, { actor: 'mike', targetGame: 'g_1', withinMs: 600_000, now: NOW + 11 * 60_000 }), false);
  assert.equal(await S.hasRecentOkay(t.db, { actor: 'ada-r', targetGame: 'g_1', withinMs: 600_000, now: NOW }), false);
});

test('venues map from courts-schedule.json with the engine shape', () => {
  assert.deepEqual(VENUES.map((v) => v.id), ['el-segundo', 'manhattan-heights']);
  const es = VENUES[0];
  assert.equal(es.address, '401 Sheldon St, El Segundo');
  assert.deepEqual(es.hours, { open: '08:00', close: '22:00' });
  assert.ok(es.aliases.includes('rec park') && es.aliases.includes('recreation park'));
  assert.ok(VENUES[1].aliases.includes('heights'));
  assert.equal(S.laNowIso(NOW), '2026-11-10T18:00:00-08:00');
  assert.equal(S.laNowIso(Date.parse('2026-07-01T12:00:00Z')), '2026-07-01T05:00:00-07:00');
});

test('POST /request: 503 without a db, 401 without a session, 403 for tier 1, 200 for tier 2', async () => {
  const t = town();
  const none = await H.postRequest({ request: new Request('https://pointcast.xyz/api/communicator/request', { method: 'POST', body: '{}' }), env: {}, venues: VENUES, now: NOW });
  assert.equal(none.status, 503);
  assert.equal((await none.json()).reason, 'db-not-bound');
  const anon = await call(t, H.postRequest, 'POST', 'request', null, { text: ASK });
  assert.equal(anon.status, 401);
  const tier1 = addUser(t, 'u-one', 'Pat Lee', [{ provider: 'passkey', id: 'pk-1' }]);
  const r1 = await call(t, H.postRequest, 'POST', 'request', tier1, { text: ASK });
  assert.equal(r1.status, 403);
  assert.equal(r1.body.reason, 'tier-2-required');
  await seedRoster(t);
  const r2 = await call(t, H.postRequest, 'POST', 'request', hostCookie(t), { text: ASK });
  assert.equal(r2.status, 200);
  assert.equal(r2.body.complete, true);
  assert.ok(r2.body.slots.length >= 1 && r2.body.candidates.length >= 4);
  assert.ok(r2.body.candidates.every((c) => ['handle', 'display', 'fit', 'reasons', 'rating'].every((k) => k in c)));
  noLeak(r2.body.candidates);
  noLeak(r2.body);
  assert.ok(!r2.body.candidates.some((c) => ['gus-o', 'kit-b', 'ivy-s', 'jo-w', 'lou-f'].includes(c.handle)));
  const missing = await call(t, H.postRequest, 'POST', 'request', hostCookie(t), { text: 'pickup game tomorrow' });
  assert.equal(missing.body.complete, false);
  assert.ok(missing.body.missing.includes('level'));
  assert.equal((await call(t, H.postRequest, 'POST', 'request', hostCookie(t), { nope: 1 })).status, 400);
});

test('POST /games then GET /games/:id round-trips; only the host and roster can read it', async () => {
  const t = town();
  await seedRoster(t);
  const cookie = hostCookie(t);
  assert.equal((await call(t, H.postGame, 'POST', 'games', cookie, {})).status, 409, 'profile required');
  assert.equal((await call(t, H.putMe, 'PUT', 'me', cookie, { display: 'Mike H.' })).status, 200);
  const ask = (await call(t, H.postRequest, 'POST', 'request', cookie, { text: ASK })).body;
  const picks = ask.candidates.slice(0, 3).map((c) => c.handle);
  const forged = await call(t, H.postGame, 'POST', 'games', cookie, { request: ask.request, slot: { start: '2026-11-12T03:00:00-08:00', end: '2026-11-12T04:30:00-08:00' }, candidates: picks });
  assert.equal(forged.body.reason, 'bad-slot');
  const stranger = await call(t, H.postGame, 'POST', 'games', cookie, { request: ask.request, slot: ask.slots[0], candidates: ['gus-o'] });
  assert.equal(stranger.body.reason, 'bad-candidates');
  const made = await call(t, H.postGame, 'POST', 'games', cookie, { request: ask.request, slot: ask.slots[0], candidates: picks });
  assert.equal(made.status, 200);
  assert.equal(made.body.game.host, 'mikeh');
  assert.equal(made.body.game.status, 'proposed');
  assert.deepEqual(made.body.game.candidates, picks);
  const got = await call(t, H.getGameRoute, 'GET', `games/${made.body.game.id}`, cookie, undefined, made.body.game.id);
  assert.equal(got.status, 200);
  assert.deepEqual(got.body.game, made.body.game);
  noLeak(got.body);
  const other = addUser(t, 'u-two', 'Pat Lee', [{ provider: 'passkey', id: 'pk-2' }]);
  await call(t, H.putMe, 'PUT', 'me', other, { display: 'Pat L.' });
  assert.equal((await call(t, H.getGameRoute, 'GET', 'x', other, undefined, made.body.game.id)).body.reason, 'not-your-game');
  assert.equal((await call(t, H.getGameRoute, 'GET', 'x', cookie, undefined, 'g_nope')).status, 404);
  assert.equal((await call(t, H.getGameRoute, 'GET', 'x', null, undefined, made.body.game.id)).status, 401);
});

test('/me: null before, PUT creates a profile, contact fields refused, email from the identity', async () => {
  const t = town();
  const cookie = hostCookie(t);
  const first = await call(t, H.getMe, 'GET', 'me', cookie);
  assert.deepEqual([first.status, first.body.ok, first.body.profile], [200, true, null]);
  for (const bad of [{ contact: { email: 'evil@example.com' } }, { email: 'evil@example.com' }, { phone: '3105550100' }]) {
    const r = await call(t, H.putMe, 'PUT', 'me', cookie, { display: 'X', ...bad });
    assert.equal(r.status, 400);
    assert.equal(r.body.reason, 'contact-not-editable');
  }
  assert.equal((await call(t, H.putMe, 'PUT', 'me', cookie, { identity: { tier: 3 } })).body.reason, 'unknown-field');
  assert.equal((await call(t, H.putMe, 'PUT', 'me', cookie, { venues: ['mars'] })).body.reason, 'bad-field');
  assert.equal((await call(t, H.getMe, 'GET', 'me', cookie)).body.profile, null, 'refusals created nothing');
  const put = await call(t, H.putMe, 'PUT', 'me', cookie, {
    display: 'Mike H.', venues: ['el-segundo'], availability: [{ days: [4], start: '17:00', end: '21:00' }],
    consent: { communicator: true, listed: true }, ladders: { [LADDER]: { declared: 4.0 } },
  });
  assert.equal(put.status, 200);
  assert.equal(put.body.profile.handle, 'mikeh');
  assert.equal(put.body.profile.contact.email, 'mike@example.invalid');
  assert.deepEqual(put.body.profile.consent, { communicator: true, contactableBy: ['ladder-peers'], listed: true });
  assert.equal(put.body.profile.identity.tier, 2);
  const again = await call(t, H.getMe, 'GET', 'me', cookie);
  assert.equal(again.body.profile.handle, 'mikeh');
  assert.equal(again.body.tier, 2);
  assert.equal((await S.getPublicProfile(t.db, 'mikeh')).tier, 2);
  noLeak(await S.getPublicProfile(t.db, 'mikeh'));
  // A second Mike Hall gets a digit suffix.
  const twin = addUser(t, 'u-twin', 'Mike Hall', [{ provider: 'passkey', id: 'pk-t' }]);
  assert.equal((await call(t, H.putMe, 'PUT', 'me', twin, { display: 'Mike H.' })).body.profile.handle, 'mikeh2');
  // Opting out clears contactableBy and expires pending messages.
  t.db.db.prepare("INSERT INTO communicator_messages (id, game_id, to_handle, kind, text, replies_json, status, created_at, updated_at) VALUES ('m1','g','mikeh','invite','hi','[]','sent','c','c')").run();
  const off = await call(t, H.putMe, 'PUT', 'me', cookie, { consent: { communicator: false } });
  assert.deepEqual(off.body.profile.consent.contactableBy, []);
  assert.equal(t.db.db.prepare("SELECT status FROM communicator_messages WHERE id = 'm1'").get().status, 'expired');
});

test('GET /ledger/:ladder.json: confirmed entries and publicRating per handle, cached 60s, no session needed', async () => {
  const t = town();
  await seedRoster(t);
  for (const e of DEMO_LADDER) await S.appendLedger(t.db, e, { at: NOW });
  await S.appendLedger(t.db, { id: 'le_pending', ladder: LADDER, kind: 'game', at: '2026-11-01T00:00:00Z', status: 'pending', sides: [{ players: ['zed', 'zoe'], score: 11 }, { players: ['yan', 'xia'], score: 3 }], confirmations: [] }, { at: NOW });
  const r = await call(t, H.getLedger, 'GET', `ledger/${LADDER}.json`, null, undefined, `${LADDER}.json`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('cache-control'), 'public, max-age=60');
  assert.equal(r.body.entries.length, DEMO_LADDER.length);
  assert.ok(r.body.entries.every((e) => e.status === 'confirmed'));
  assert.ok(!r.body.entries.some((e) => e.id === 'le_pending'));
  const ada = r.body.ratings.find((x) => x.handle === 'ada-r');
  assert.deepEqual(Object.keys(ada), L.PUBLIC_RATING_FIELDS);
  assert.equal(ada.tag, 'Settled');
  assert.ok(!r.body.ratings.some((x) => ['zed', 'yan'].includes(x.handle)));
  noLeak(r.body);
  assert.equal((await call(t, H.getLedger, 'GET', 'ledger/nope.json', null, undefined, 'nope')).status, 404);
});

test('route files stay thin: every route imports the shared handlers and venuesFromSchedule', async () => {
  for (const f of ['request.ts', 'games/index.ts', 'games/[id].ts', 'me.ts', 'ledger/[ladder].json.ts']) {
    const src = await readFile(new URL(`functions/api/communicator/${f}`, root), 'utf8');
    assert.match(src, /communicator-http\.ts/, f);
    assert.ok(!/AUTH_DB/.test(src.replace(/\/\*[\s\S]*?\*\//, '')), `${f} leaves the db to the store`);
  }
});
