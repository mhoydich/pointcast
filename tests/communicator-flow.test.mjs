import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import schedule from '../src/data/courts-schedule.json' with { type: 'json' };
import { DEMO_PROFILES, DEMO_NOW } from '../public/communicator/demo.mjs';
import * as E from '../public/communicator/engine.mjs';
import * as L from '../public/communicator/ledger.mjs';
import * as S from '../functions/_lib/communicator-store.ts';
import * as H from '../functions/_lib/communicator-http.ts';
import * as D from '../functions/_lib/communicator-deliver.ts';
import * as F from '../functions/_lib/communicator-flow.ts';
import * as P from '../functions/_lib/communicator-page.ts';

// Communicator v1-b (docs/prd/communicator-v1.md 4.2, 4.4, 4.5, 5): invite, reply tokens, score, reminders,
// the dark-launched email adapter, and the /c/r/ page. D1 is node:sqlite running migrations 0033 and 0034.

const root = new URL('../', import.meta.url);
const MIGRATIONS = (await Promise.all(['0033_communicator.sql', '0034_communicator_delivery.sql'].map((f) => readFile(new URL(`migrations/auth/${f}`, root), 'utf8')))).join('\n');
const NOW = Date.parse(DEMO_NOW); // Tue 2026-11-10 18:00 Pacific
const HOUR = 3600_000;
const VENUES = S.venuesFromSchedule(schedule);
const LADDER = L.DEFAULT_LADDER.id;
const PICKS = ['ada-r', 'bo-t', 'cy-l', 'dee-m', 'eli-p']; // first three are invited, the other two wait
const ASK = 'Get me a 4.0 doubles game Thursday evening at Rec Park';

class SqliteD1 {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec(MIGRATIONS);
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

function town(envExtra = {}) {
  const db = new SqliteD1();
  const mails = [];
  const bodies = [];
  const t = { db, env: { AUTH_DB: db, ...envExtra }, mails, bodies, tokens: {} };
  t.sendMail = async (m) => { mails.push(m); return { configured: true }; };
  t.capture = (r) => {
    bodies.push(r);
    for (const mm of r.text.matchAll(/\/c\/r\/([A-Za-z0-9_-]+)\?a=(\w+)/g)) (t.tokens[r.to_handle] ||= {})[`${r.id}:${mm[2]}`] = mm[1];
  };
  return t;
}
function addUser(t, userId, preferredName, identities) {
  const user = { userId, createdAt: '2026-01-01T00:00:00Z', preferredName, identities: identities.map((i) => ({ name: i.id, verifiedAt: '2026-01-01T00:00:00Z', ...i })), roles: [] };
  t.db.db.prepare('INSERT OR IGNORE INTO users (id, payload) VALUES (?, ?)').run(userId, JSON.stringify(user));
  t.db.db.prepare('INSERT OR IGNORE INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(`tok-${userId}`, userId, Date.now() + 86_400_000);
  return `pc_session=tok-${userId}`;
}
const hostCookie = (t) => addUser(t, 'u-host', 'Mike Hall', [{ provider: 'google', id: 'g-123' }, { provider: 'email', id: 'mike@example.invalid' }]);
const run = async (t, handler, method, path, cookie, body, { now = NOW, env = {}, args = [], headers = {} } = {}) => {
  const request = new Request(`https://pointcast.xyz/api/communicator/${path}`, {
    method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const res = await handler({ request, env: { ...t.env, ...env }, venues: VENUES, now, sendMail: t.sendMail, capture: t.capture }, ...args);
  return { status: res.status, body: await res.json() };
};
const rows = (t, sql, ...a) => t.db.db.prepare(sql).all(...a);
const tokenFor = (t, handle, kind, chip) => {
  const id = rows(t, 'SELECT id FROM communicator_messages WHERE to_handle = ? AND kind = ? ORDER BY created_at, rowid', handle, kind).at(-1).id;
  return t.tokens[handle][`${id}:${chip}`];
};
const reply = (t, token, answer, opts) => run(t, F.postReply, 'POST', 'reply', null, { token, answer }, opts);
const noLeak = (s) => { s = s.replace(/<style>[\s\S]*?<\/style>/g, ''); assert.ok(!/@/.test(s), 'no @'); assert.ok(!/\d{7}/.test(s), 'no 7-digit run'); };

/** Host with a profile, the demo roster, a game with PICKS stored as candidates. */
async function setup(envExtra = {}) {
  const t = town(envExtra);
  for (const p of DEMO_PROFILES) await S.upsertProfile(t.db, p, { at: NOW });
  const cookie = hostCookie(t);
  assert.equal((await run(t, H.putMe, 'PUT', 'me', cookie, { display: 'Mike H.', consent: { communicator: true } })).status, 200);
  const ask = (await run(t, H.postRequest, 'POST', 'request', cookie, { text: ASK })).body;
  const made = await run(t, H.postGame, 'POST', 'games', cookie, { request: ask.request, slot: ask.slots[0], candidates: PICKS });
  assert.equal(made.status, 200);
  return { t, cookie, game: made.body.game, host: 'mikeh' };
}
const invite = (s, opts) => run(s.t, F.postInvite, 'POST', 'invite', s.cookie, undefined, { ...opts, args: [s.game.id] });
const gameOf = (s) => S.getGame(s.t.db, s.game.id);

test('full flow: invite (dry run) -> replies -> backfill -> filled -> score -> confirm -> recorded', async () => {
  const s = await setup(); // COMMUNICATOR_SEND unset: dry run
  const inv = await invite(s);
  assert.equal(inv.status, 200);
  assert.deepEqual([inv.body.sent, inv.body.held, inv.body.refused], [3, 0, 0]);
  assert.equal(inv.body.game.status, 'inviting');
  const msgs = rows(s.t, 'SELECT * FROM communicator_messages');
  assert.equal(msgs.length, 3);
  assert.ok(msgs.every((m) => m.status === 'sent' && m.note === 'dry-run' && m.sent_at && m.token_hash && m.expires_at));
  assert.equal(s.t.mails.length, 0, 'dry run never calls sendMail');
  assert.equal(rows(s.t, 'SELECT COUNT(*) AS n FROM communicator_okays WHERE actor = ? AND kind = ?', s.host, 'invite')[0].n, 1);

  const [a, b, c] = ['ada-r', 'bo-t', 'cy-l'];
  assert.equal((await reply(s.t, tokenFor(s.t, a, 'invite', 'in'), 'in')).body.ok, true);
  const r2 = await reply(s.t, tokenFor(s.t, b, 'invite', 'in'), 'in');
  assert.equal(r2.body.status, 'inviting');
  const r3 = await reply(s.t, tokenFor(s.t, c, 'invite', 'out'), 'out');
  assert.equal(r3.status, 200);
  assert.equal(r3.body.sent, 1, 'a backfill invite went out');
  const back = rows(s.t, "SELECT * FROM communicator_messages WHERE to_handle = 'dee-m'");
  assert.equal(back.length, 1);
  assert.deepEqual([back[0].kind, back[0].status, back[0].note], ['invite', 'sent', 'dry-run']);
  const r4 = await reply(s.t, tokenFor(s.t, 'dee-m', 'invite', 'in'), 'in');
  assert.equal(r4.body.status, 'filled');
  assert.deepEqual(r4.body.next, []);
  assert.equal(rows(s.t, "SELECT COUNT(*) AS n FROM communicator_messages WHERE kind = 'filled'")[0].n, 4);
  assert.equal(s.t.mails.length, 0);

  // The host confirms and the slot passes (those two steps have no v1-b route), then scores 11-9.
  let g = await gameOf(s);
  g = E.markPlayed(E.confirm(g, { now: NOW }).game, { now: NOW, force: true }).game;
  await S.putGame(s.t.db, g, { at: NOW });
  assert.deepEqual([...g.roster.in].sort(), ['ada-r', 'bo-t', 'dee-m', 'mikeh']);
  const stranger = addUser(s.t, 'u-x', 'Pat Lee', [{ provider: 'passkey', id: 'pk-x' }]);
  assert.equal((await run(s.t, F.postScore, 'POST', 'score', stranger, { sides: [[], []] }, { args: [g.id] })).body.reason, 'profile-required');
  const sides = [['mikeh', 'ada-r'], ['bo-t', 'dee-m']];
  const bad = await run(s.t, F.postScore, 'POST', 'score', s.cookie, { sides, scoreA: 11, scoreB: 11 }, { args: [g.id] });
  assert.equal(bad.status, 409);
  const sc = await run(s.t, F.postScore, 'POST', 'score', s.cookie, { sides, scoreA: 11, scoreB: 9 }, { args: [g.id] });
  assert.equal(sc.status, 200);
  assert.equal(sc.body.game.status, 'scoring');
  assert.deepEqual(sc.body.ledger.map((l) => l.status), ['pending']);
  assert.equal(sc.body.sent, 2);
  assert.equal((await S.confirmedLedger(s.t.db, LADDER)).length, 0);

  const done = await reply(s.t, tokenFor(s.t, 'bo-t', 'score-confirm', 'confirm'), 'confirm');
  assert.equal(done.status, 200);
  assert.equal(done.body.status, 'recorded');
  assert.equal((await gameOf(s)).status, 'recorded');
  const led = await S.confirmedLedger(s.t.db, LADDER);
  assert.equal(led.length, 1);
  assert.equal(led[0].status, 'confirmed');
  assert.deepEqual(led[0].sides.map((x) => x.score), [11, 9]);
  assert.equal(rows(s.t, "SELECT COUNT(*) AS n FROM communicator_messages WHERE kind = 'recorded'")[0].n, 4);
  assert.equal(s.t.mails.length, 0);
  for (const r of s.t.bodies) noLeak(r.text + r.subject);
  assert.ok(s.t.bodies.length >= 10);
  // the other side's second token is a different link; the used one is spent
  assert.equal((await reply(s.t, tokenFor(s.t, 'bo-t', 'score-confirm', 'confirm'), 'confirm')).status, 409);
});

test('a dispute reopens nothing silently: score-confirm "dispute" marks the game disputed and tells the host', async () => {
  const s = await setup();
  await invite(s);
  for (const h of ['ada-r', 'bo-t', 'cy-l']) await reply(s.t, tokenFor(s.t, h, 'invite', 'in'), 'in');
  let g = await gameOf(s);
  assert.equal(g.status, 'filled');
  g = E.markPlayed(E.confirm(g, { now: NOW }).game, { now: NOW, force: true }).game;
  await S.putGame(s.t.db, g, { at: NOW });
  await run(s.t, F.postScore, 'POST', 'score', s.cookie, { sides: [['mikeh', 'ada-r'], ['bo-t', 'cy-l']], scoreA: 11, scoreB: 4 }, { args: [g.id] });
  const d = await reply(s.t, tokenFor(s.t, 'cy-l', 'score-confirm', 'dispute'), 'dispute');
  assert.equal(d.body.status, 'disputed');
  assert.equal(rows(s.t, "SELECT COUNT(*) AS n FROM communicator_messages WHERE kind = 'disputed' AND to_handle = 'mikeh'")[0].n, 1);
  assert.equal((await S.latestLedger(s.t.db, LADDER))[0].status, 'disputed');
});

test('tokens: used -> 409, expired -> 410, unknown -> 404, wrong answer 400 and not consumed; only the hash is stored', async () => {
  const s = await setup();
  await invite(s);
  const tk = tokenFor(s.t, 'ada-r', 'invite', 'in');
  assert.match(tk, /^[A-Za-z0-9_-]{43}$/);
  const stored = rows(s.t, 'SELECT token_hash, expires_at, sent_at FROM communicator_messages');
  assert.ok(stored.every((m) => /^[0-9a-f]{64}$/.test(m.token_hash) && m.token_hash !== tk));
  assert.ok(!JSON.stringify(rows(s.t, 'SELECT * FROM communicator_messages')).includes(tk), 'the token itself is never stored');
  assert.equal(Date.parse(stored[0].expires_at) - Date.parse(stored[0].sent_at), 72 * HOUR);
  assert.equal((await reply(s.t, tk, 'confirm')).body.reason, 'bad-answer');
  assert.equal((await reply(s.t, tk, 'in')).status, 200, 'a bad answer did not spend the token');
  const again = await reply(s.t, tk, 'out');
  assert.deepEqual([again.status, again.body.reason], [409, 'already-used']);
  assert.equal((await gameOf(s)).roster.in.includes('ada-r'), true, 'the second answer changed nothing');
  const late = await reply(s.t, tokenFor(s.t, 'bo-t', 'invite', 'in'), 'in', { now: NOW + 73 * HOUR });
  assert.deepEqual([late.status, late.body.reason], [410, 'expired']);
  assert.equal((await reply(s.t, 'x'.repeat(43), 'in')).status, 404);
  assert.equal((await reply(s.t, 'short', 'in')).status, 404);
});

test('consent turned off: the invite is refused and logged, no row is ever sent; the adapter refuses too', async () => {
  const s = await setup({ COMMUNICATOR_SEND: 'on' });
  const ada = await S.getProfile(s.t.db, 'ada-r', { asSelf: true });
  await S.upsertProfile(s.t.db, { ...ada, consent: { communicator: false, contactableBy: [], listed: true } }, { at: NOW });
  const inv = await invite(s);
  assert.equal(inv.status, 200);
  assert.deepEqual([inv.body.sent, inv.body.refused], [3, 1]);
  assert.equal(rows(s.t, "SELECT COUNT(*) AS n FROM communicator_messages WHERE to_handle = 'ada-r'")[0].n, 0);
  assert.ok(inv.body.game.history.some((h) => h.op === 'invite-refused' && h.detail === 'ada-r:consent-required'));
  assert.ok(!inv.body.game.roster.invited.includes('ada-r'));
  assert.equal(s.t.mails.length, 3);
  // everyone off -> 409 consent-required, nothing queued
  const s2 = await setup({ COMMUNICATOR_SEND: 'on' });
  for (const h of PICKS) await S.upsertProfile(s2.t.db, { ...(await S.getProfile(s2.t.db, h, { asSelf: true })), consent: { communicator: false, contactableBy: [], listed: true } }, { at: NOW });
  const none = await invite(s2);
  assert.deepEqual([none.status, none.body.reason], [409, 'consent-required']);
  assert.equal(rows(s2.t, 'SELECT COUNT(*) AS n FROM communicator_messages')[0].n, 0);
  // defense in depth: a pending row that slipped past the engine is refused by the adapter, even when sending is on
  const t = town({ COMMUNICATOR_SEND: 'on' });
  await S.upsertProfile(t.db, { ...DEMO_PROFILES[7] }, { at: NOW }); // gus-o: consent false
  await S.upsertProfile(t.db, { ...DEMO_PROFILES[1], contact: {} }, { at: NOW }); // ada-r: no email
  for (const h of ['gus-o', 'ada-r']) t.db.db.prepare("INSERT INTO communicator_messages (id, game_id, to_handle, kind, text, replies_json, status, created_at, updated_at) VALUES (?, 'g', ?, 'invite', 'hi', '[\"in\"]', 'pending', 'c', 'c')").run(`m-${h}`, h);
  const out = await D.deliver(t.db, t.env, [{ id: 'm-gus-o' }, { id: 'm-ada-r' }], { now: NOW, sendMail: t.sendMail });
  assert.equal(out.refused, 2);
  assert.equal(t.mails.length, 0);
  assert.deepEqual(rows(t, 'SELECT id, status, note FROM communicator_messages ORDER BY id').map((r) => [r.status, r.note]), [['expired', 'no-channel'], ['expired', 'no-consent']]);
});

test('quiet hours hold a message (it stays pending) until the window ends', async () => {
  const s = await setup();
  const late = NOW + 4.5 * HOUR; // 22:30 Pacific
  const inv = await invite(s, { now: late });
  assert.deepEqual([inv.body.sent, inv.body.held, inv.body.refused], [0, 3, 0]);
  assert.deepEqual(rows(s.t, 'SELECT DISTINCT status FROM communicator_messages').map((r) => r.status), ['pending']);
  assert.ok(rows(s.t, 'SELECT token_hash, sent_at FROM communicator_messages').every((r) => r.token_hash === null && r.sent_at === null));
  const ids = rows(s.t, 'SELECT id FROM communicator_messages');
  assert.equal((await D.deliver(s.t.db, s.t.env, ids, { now: NOW + 14.5 * HOUR, sendMail: s.t.sendMail })).sent, 3, 'at 08:30 the window has ended');
  assert.equal((await D.deliver(s.t.db, s.t.env, ids, { now: NOW + 15 * HOUR, sendMail: s.t.sendMail })).sent, 0, 'already sent rows are not sent again');
});

test('caps: 6 per recipient and 20 per host per rolling day', async () => {
  const s = await setup();
  const ins = s.t.db.db.prepare("INSERT INTO communicator_messages (id, game_id, to_handle, kind, text, replies_json, status, created_at, sent_at, updated_at) VALUES (?, ?, ?, 'invite', 'x', '[]', 'sent', 'c', ?, 'c')");
  const recent = new Date(NOW - HOUR).toISOString();
  for (let i = 0; i < 6; i++) ins.run(`old-${i}`, 'g_other', 'ada-r', recent);
  const inv = await invite(s);
  assert.deepEqual([inv.body.sent, inv.body.refused], [2, 1]);
  assert.equal(rows(s.t, "SELECT note FROM communicator_messages WHERE to_handle = 'ada-r' AND id NOT LIKE 'old-%'")[0].note, 'cap-recipient');
  const h = await setup();
  const s2 = h;
  const ins2 = s2.t.db.db.prepare("INSERT INTO communicator_messages (id, game_id, to_handle, kind, text, replies_json, status, created_at, sent_at, updated_at) VALUES (?, ?, ?, 'invite', 'x', '[]', 'sent', 'c', ?, 'c')");
  for (let i = 0; i < 20; i++) ins2.run(`hc2-${i}`, s2.game.id, `p${i}`, recent);
  const capped = await invite(s2);
  assert.deepEqual([capped.body.sent, capped.body.refused], [0, 3]);
  assert.equal(rows(s2.t, "SELECT DISTINCT note FROM communicator_messages WHERE id NOT LIKE 'hc%'").map((r) => r.note).join(), 'cap-host');
  const yesterday = await setup();
  const ins3 = yesterday.t.db.db.prepare("INSERT INTO communicator_messages (id, game_id, to_handle, kind, text, replies_json, status, created_at, sent_at, updated_at) VALUES (?, ?, 'ada-r', 'invite', 'x', '[]', 'sent', 'c', ?, 'c')");
  for (let i = 0; i < 6; i++) ins3.run(`y-${i}`, 'g_other', new Date(NOW - 25 * HOUR).toISOString());
  assert.equal((await invite(yesterday)).body.sent, 3, 'sends older than a day do not count');
});

test('COMMUNICATOR_SEND=on: sendMail once per message, bodies carry links and no contact details', async () => {
  const s = await setup({ COMMUNICATOR_SEND: 'on' });
  const inv = await invite(s);
  assert.deepEqual([inv.body.sent, inv.body.refused], [3, 0]);
  assert.equal(s.t.mails.length, 3);
  assert.deepEqual(rows(s.t, 'SELECT DISTINCT note FROM communicator_messages').map((r) => r.note), ['sent']);
  const addrs = DEMO_PROFILES.map((p) => p.contact.email);
  for (const m of s.t.mails) {
    assert.deepEqual(Object.keys(m).sort(), ['subject', 'text', 'to']);
    assert.ok(addrs.includes(m.to), 'delivered to the profile address');
    assert.equal(/@/.test(m.text), false);
    assert.equal(/\d{7}/.test(m.text), false);
    assert.equal(/@/.test(m.subject), false);
    assert.ok(m.subject.length <= 60);
    assert.ok(m.text.startsWith(m.subject));
    assert.deepEqual([...m.text.matchAll(/https:\/\/pointcast\.xyz\/c\/r\/[A-Za-z0-9_-]{43}\?a=(\w+)/g)].map((x) => x[1]), ['in', 'out', 'maybe', 'newtime']);
  }
  assert.equal(new Set(s.t.mails.map((m) => m.text.match(/\/c\/r\/([A-Za-z0-9_-]+)/)[1])).size, 3, 'a fresh token per message');
  assert.equal(await reply(s.t, tokenFor(s.t, 'ada-r', 'invite', 'in'), 'in').then((r) => r.status), 200);
  for (const m of s.t.mails) noLeak(m.text);
  // a failing mailer leaves the row pending and holds it
  const f = await setup({ COMMUNICATOR_SEND: 'on' });
  f.t.sendMail = async () => { throw new Error('boom'); };
  const fi = await invite(f);
  assert.deepEqual([fi.body.sent, fi.body.held], [0, 3]);
  assert.deepEqual(rows(f.t, 'SELECT DISTINCT status FROM communicator_messages').map((r) => r.status), ['pending']);
});

test('GET /c/r/<token> renders the chips; POST applies; a second visit says the link was used', async () => {
  const s = await setup();
  await invite(s);
  const tk = tokenFor(s.t, 'bo-t', 'invite', 'out');
  const page = (method, init = {}, now = NOW) => P.replyPage({ request: new Request(`https://pointcast.xyz/c/r/${tk}${init.q ?? ''}`, { method, ...init.req }), env: s.t.env, now, sendMail: s.t.sendMail, capture: s.t.capture }, tk);
  const got = await page('GET', { q: '?a=out' });
  const gh = await got.text();
  assert.equal(got.status, 200);
  assert.match(got.headers.get('content-type'), /text\/html/);
  assert.match(gh, /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(gh, /<script/i);
  for (const chip of ['in', 'out', 'maybe', 'newtime']) assert.match(gh, new RegExp(`<button[^>]*name="a" value="${chip}"`));
  assert.match(gh, /class="pick">Out</);
  assert.match(gh, /min-height:44px/);
  assert.match(gh, /padding:24px 16px/);
  noLeak(gh);
  assert.equal(rows(s.t, "SELECT status FROM communicator_messages WHERE to_handle = 'bo-t'")[0].status, 'sent', 'GET changed nothing');
  const posted = await page('POST', { req: { headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'a=in' } });
  const ph = await posted.text();
  assert.equal(posted.status, 200);
  assert.match(ph, /Got it: In/);
  assert.match(ph, /href="\/communicator\/"/);
  noLeak(ph);
  assert.ok((await gameOf(s)).roster.in.includes('bo-t'));
  const used = await page('GET');
  assert.equal(used.status, 409);
  const uh = await used.text();
  assert.match(uh, /This link was already used/);
  assert.match(uh, /href="\/communicator\/"/);
  const old = await P.replyPage({ request: new Request('https://pointcast.xyz/c/r/' + tokenFor(s.t, 'cy-l', 'invite', 'in')), env: s.t.env, now: NOW + 80 * HOUR }, tokenFor(s.t, 'cy-l', 'invite', 'in'));
  assert.equal(old.status, 410);
  assert.equal((await P.replyPage({ request: new Request('https://pointcast.xyz/c/r/nope'), env: s.t.env, now: NOW }, 'nope')).status, 404);
  const cross = await P.replyPage({ request: new Request(`https://pointcast.xyz/c/r/${tk}`, { method: 'POST', headers: { origin: 'https://evil.example' }, body: 'a=in' }), env: s.t.env, now: NOW }, tk);
  assert.equal(cross.status, 403);
});

test('POST /reminders: resident-only; builds due reminders once, marks them sent', async () => {
  const s = await setup({ YARD_RESIDENT_KEY: 'k-resident' });
  await invite(s);
  for (const h of ['ada-r', 'bo-t', 'cy-l']) await reply(s.t, tokenFor(s.t, h, 'invite', 'in'), 'in');
  let g = E.confirm(await gameOf(s), { now: NOW }).game;
  await S.putGame(s.t.db, g, { at: NOW });
  const t24 = Date.parse(g.slot.start) - 23 * HOUR;
  assert.equal((await run(s.t, F.postReminders, 'POST', 'reminders', null, undefined, { now: t24 })).body.reason, 'not-a-resident');
  assert.equal((await run(s.t, F.postReminders, 'POST', 'reminders', null, undefined, { now: t24, headers: { 'X-Yard-Resident': 'wrong' } })).status, 403);
  assert.equal((await run(town(), F.postReminders, 'POST', 'reminders', null, undefined, { now: t24 })).status, 503);
  const ok = await run(s.t, F.postReminders, 'POST', 'reminders', null, undefined, { now: t24, headers: { 'X-Yard-Resident': 'k-resident' } });
  assert.equal(ok.status, 200);
  assert.deepEqual([ok.body.games, ok.body.queued, ok.body.sent], [1, 4, 4]);
  assert.equal(rows(s.t, "SELECT COUNT(*) AS n FROM communicator_messages WHERE kind = 'reminder-24h' AND status = 'sent'")[0].n, 4);
  const twice = await run(s.t, F.postReminders, 'POST', 'reminders', null, undefined, { now: t24 + 60_000, headers: { 'X-Yard-Resident': 'k-resident' } });
  assert.deepEqual([twice.body.games, twice.body.queued], [0, 0]);
  const soon = await run(s.t, F.postReminders, 'POST', 'reminders', null, undefined, { now: Date.parse(g.slot.start) - HOUR, headers: { 'X-Yard-Resident': 'k-resident' } });
  assert.equal(soon.body.queued, 4, 'the 2-hour reminder is its own message');
  for (const r of s.t.bodies) noLeak(r.text);
});

test('invite and score gates: host only, tier 2, signed in, game state', async () => {
  const s = await setup();
  assert.equal((await run(s.t, F.postInvite, 'POST', 'invite', null, undefined, { args: [s.game.id] })).status, 401);
  const one = addUser(s.t, 'u-one', 'Pat Lee', [{ provider: 'passkey', id: 'pk-1' }]);
  assert.equal((await run(s.t, F.postInvite, 'POST', 'invite', one, undefined, { args: [s.game.id] })).body.reason, 'tier-2-required');
  const other = addUser(s.t, 'u-two', 'Sam Roe', [{ provider: 'google', id: 'g-2' }]);
  assert.equal((await run(s.t, F.postInvite, 'POST', 'invite', other, undefined, { args: [s.game.id] })).body.reason, 'profile-required');
  assert.equal((await run(s.t, F.postInvite, 'POST', 'invite', s.cookie, undefined, { args: ['g_nope'] })).status, 404);
  assert.equal((await run(s.t, F.postInvite, 'POST', 'invite', s.cookie, undefined, { args: [s.game.id], headers: { origin: 'https://evil.example' } })).body.reason, 'bad-origin');
  assert.equal((await run(town(), F.postInvite, 'POST', 'invite', s.cookie, undefined, { args: [s.game.id], env: { AUTH_DB: undefined } })).status, 503);
  assert.equal((await run(s.t, F.postScore, 'POST', 'score', s.cookie, { sides: [['mikeh', 'a'], ['b', 'c']], scoreA: 11, scoreB: 3 }, { args: [s.game.id] })).body.reason, 'bad-state');
  assert.equal(rows(s.t, 'SELECT COUNT(*) AS n FROM communicator_okays')[0].n, 0, 'refused calls recorded no okay');
});

test('the four shared exports on communicator-http.ts return the JSON body', async () => {
  const s = await setup();
  const out = await H.inviteGame(s.t.db, s.t.env, { actor: s.host, gameId: s.game.id, now: NOW });
  assert.deepEqual([out.ok, out.sent], [true, 3]);
  assert.equal((await H.inviteGame(s.t.db, s.t.env, { actor: 'ada-r', gameId: s.game.id, now: NOW })).reason, 'not-your-game');
  assert.equal((await H.sendDueReminders(s.t.db, s.t.env, { now: NOW })).ok, true);
  assert.equal((await H.confirmScoreGame(s.t.db, s.t.env, { actor: s.host, gameId: s.game.id, answer: 'confirm', now: NOW })).reason, 'bad-state');
  assert.equal((await H.scoreGame(s.t.db, s.t.env, { actor: s.host, gameId: s.game.id, sides: [['mikeh', 'a'], ['b', 'c']], scores: [11, 3], now: NOW })).reason, 'bad-state');
});

test('route files stay thin and the page route is wired', async () => {
  for (const f of ['games/[id]/invite.ts', 'games/[id]/score.ts', 'reply.ts', 'reminders.ts']) {
    const src = await readFile(new URL(`functions/api/communicator/${f}`, root), 'utf8');
    assert.match(src, /communicator-flow\.ts/, f);
    assert.ok(!/AUTH_DB/.test(src.replace(/\/\*[\s\S]*?\*\//, '')), `${f} leaves the db to the flow module`);
  }
  const page = await readFile(new URL('functions/c/r/[token].ts', root), 'utf8');
  assert.match(page, /onRequestGet/);
  assert.match(page, /onRequestPost/);
  // only the adapter reads the private contact
  for (const f of ['communicator-flow.ts', 'communicator-page.ts', 'communicator-http.ts']) {
    assert.ok(!/contact\.(email|phone)|\$\.contact/.test(await readFile(new URL(`functions/_lib/${f}`, root), 'utf8').then((x) => x.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))), f);
  }
});
