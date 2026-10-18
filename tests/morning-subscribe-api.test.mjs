/**
 * Morning Edition email, Pages side: POST /api/morning/subscribe,
 * GET /api/morning/confirm and /api/morning/unsubscribe
 * (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §5).
 *
 * The three routes load through vite ssrLoadModule over node:sqlite (as in
 * tests/morning-api.test.mjs), with migrations 0001 + 0023 + 0031, a fake
 * PC_RATES_KV and a fake MORNING_DAILY service binding that records its calls.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

import { SIGNUP_COPY, TOKEN_RE, newToken, sha256Hex } from '../functions/_lib/edition-mail.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const ROUTES = {
  subscribe: 'functions/api/morning/subscribe.ts',
  confirm: 'functions/api/morning/confirm.ts',
  unsubscribe: 'functions/api/morning/unsubscribe.ts',
  store: 'functions/_lib/morning-mail-store.ts',
};
const src = Object.fromEntries(await Promise.all(Object.entries(ROUTES).map(async ([k, f]) => [k, await read(f)])));

const server = await createServer({ root: fileURLToPath(root), configFile: false, appType: 'custom', logLevel: 'error' });
const spy = { calls: [] };
const consoleOriginals = {};
for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
  consoleOriginals[level] = console[level];
  console[level] = (...args) => { spy.calls.push(args); };
}
after(async () => {
  for (const level of Object.keys(consoleOriginals)) console[level] = consoleOriginals[level];
  await server.close();
});
const [subscribe, confirm, unsubscribe] = await Promise.all([
  server.ssrLoadModule('/functions/api/morning/subscribe.ts'),
  server.ssrLoadModule('/functions/api/morning/confirm.ts'),
  server.ssrLoadModule('/functions/api/morning/unsubscribe.ts'),
]);

const sql = async (...files) => (await Promise.all(files.map((f) => read(`migrations/auth/${f}`)))).join('\n');
const WITH_0031 = await sql('0001_init.sql', '0023_air.sql', '0031_field_reports_paper.sql');
const WITHOUT_0031 = await sql('0001_init.sql', '0023_air.sql');

/** D1 over node:sqlite (as in tests/morning-api.test.mjs): reads hand back rows, a batch is one transaction. */
class SqliteD1 {
  constructor(migrations = WITH_0031) { this.db = new DatabaseSync(':memory:'); this.db.exec(migrations); }
  prepare(text) {
    const db = this.db;
    let args = [];
    const reads = /^\s*SELECT|\bRETURNING\b/i.test(text);
    const execute = () => {
      const s = db.prepare(text);
      if (!reads) return { results: [], meta: { changes: Number(s.run(...args).changes) } };
      const results = s.all(...args).map((row) => ({ ...row }));
      return { results, meta: { changes: /^\s*SELECT/i.test(text) ? 0 : results.length } };
    };
    const stmt = { bind(...v) { args = v; return stmt; }, async first() { return execute().results[0] ?? null; }, async all() { return execute(); }, async run() { return execute(); }, execute };
    return stmt;
  }
  async batch(stmts) {
    this.db.exec('BEGIN');
    try { const out = stmts.map((s) => s.execute()); this.db.exec('COMMIT'); return out; } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  rows(text, ...args) { return this.db.prepare(text).all(...args).map((row) => ({ ...row })); }
}
class Kv {
  data = new Map(); puts = 0;
  async get(key) { return this.data.get(key) ?? null; }
  async put(key, value) { this.puts++; this.data.set(key, value); }
}
/** A fake MORNING_DAILY: `answer` is a Response, a function returning one, or 'throw'. */
function worker(answer) {
  const calls = [];
  return {
    calls,
    async fetch(url, init) {
      calls.push({ url, init, body: JSON.parse(init.body) });
      if (answer === 'throw') throw new TypeError('network down');
      return typeof answer === 'function' ? answer() : answer.clone();
    },
  };
}
const sent = () => Response.json({ ok: true, sent: true }, { status: 202 });

const ORIGIN = 'https://pointcast.xyz';
const EMAIL = 'casey.fixture@example.org';
const KEY = 'k'.repeat(40);
const mkEnv = (extra = {}) => ({ AUTH_DB: new SqliteD1(), PC_RATES_KV: new Kv(), ...extra });
const post = (body, o = {}) => new Request(`${ORIGIN}/api/morning/subscribe`, {
  method: 'POST',
  headers: {
    ...(o.noOrigin ? {} : { Origin: o.origin ?? ORIGIN }),
    'Content-Type': o.type ?? 'application/json',
    'CF-Connecting-IP': o.ip ?? '203.0.113.7',
    ...(o.cookie ? { Cookie: o.cookie } : {}),
  },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});
const subscribeAs = (env, body, o) => subscribe.onRequestPost({ request: post(body, o), env });
const rowOf = (env, email = EMAIL) => env.AUTH_DB.rows('SELECT * FROM edition_subscribers WHERE email = ?', email)[0] ?? null;
const allRows = (env) => env.AUTH_DB.rows('SELECT * FROM edition_subscribers');
const seed = (env, o) => env.AUTH_DB.db.prepare(
  `INSERT INTO edition_subscribers (email, status, token, source, user_id, created_at, confirm_hash, confirm_expires_at, confirm_sent_at, confirmed_at, unsubscribed_at, last_sent_day)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
).run(o.email ?? EMAIL, o.status ?? 'pending', o.token ?? newToken(), o.source ?? 'morning', o.userId ?? null, o.createdAt ?? 1_000, o.hash ?? null, o.expires ?? null, o.sentAt ?? null, o.confirmedAt ?? null, o.unsubAt ?? null, o.lastDay ?? null);
const noEmail = (...parts) => {
  for (const part of parts) {
    const text = typeof part === 'string' ? part : JSON.stringify(part);
    assert.ok(!text.toLowerCase().includes('casey.fixture'), 'the subscriber email appeared in output');
    assert.ok(!text.includes('example.org'), 'the subscriber domain appeared in output');
  }
};
const headersText = (res) => JSON.stringify([...res.headers.entries()]);

/* ---------- source contract ---------- */

test('source: literal SQL with .bind(, no exec, only SELECT/INSERT/UPDATE statements', () => {
  for (const file of ['subscribe', 'confirm', 'unsubscribe', 'store']) {
    const text = src[file];
    const prepares = text.split('.prepare(').length - 1;
    const bound = [...text.matchAll(/\.prepare\(\s*(`[^`]*`|'[^']*'|"[^"]*")\s*\)\s*\.bind\(/g)];
    assert.equal(bound.length, prepares, `${ROUTES[file]}: every .prepare( takes a literal and is followed by .bind(`);
    for (const [, statement] of bound) {
      assert.ok(!statement.includes('${'), `${ROUTES[file]}: no interpolated SQL: ${statement.slice(0, 60)}`);
      assert.match(statement.slice(1), /^(SELECT|INSERT|UPDATE)\b/, `${ROUTES[file]}: statement starts with a verb`);
    }
    assert.doesNotMatch(text, /\.exec\(/, `${ROUTES[file]}: no exec`);
  }
  assert.ok(src.store.split('.prepare(').length - 1 >= 6, 'the SQL lives in the store');
  for (const file of ['subscribe', 'confirm', 'unsubscribe']) assert.doesNotMatch(src[file], /\.prepare\(/, `${ROUTES[file]} is a thin route`);
});

test('source: subscribe reads the post before it looks at the email, and never deletes', () => {
  const s = src.subscribe;
  assert.ok(s.indexOf('readPost(') > -1 && s.indexOf('readPost(') < s.indexOf('normalizeEmail('), 'readPost( comes before normalizeEmail(');
  assert.doesNotMatch(s, /\bDELETE\b/i, 'subscribe never deletes');
  assert.doesNotMatch(src.store, /\bDELETE\b/i, 'a signup never deletes a row because mail is off');
  assert.match(s, /enforceEmailRateLimit\(env, email, ip\)/);
  assert.match(s, /AUTH_DB/);
  assert.ok(s.indexOf('enforceEmailRateLimit(') > s.indexOf('const db = env.AUTH_DB'), '503 without D1 comes before the rate limit');
  assert.match(src.store, /https:\/\/morning-daily\.internal\/send-confirm/);
  assert.match(src.store, /'X-Morning-Key': key/);
});

test('source: no log line takes the address, and the confirm and unsubscribe routes log nothing', () => {
  assert.deepEqual([...src.store.matchAll(/console\.\w+\(([^;]*)\);/g)].map((m) => m[1]),
    ["JSON.stringify({ message: 'morning confirm handoff failed', status: res.status })", "JSON.stringify({ message: 'morning confirm handoff failed', status: 'error' })"]);
  for (const file of ['subscribe', 'confirm', 'unsubscribe']) assert.doesNotMatch(src[file], /console\./, ROUTES[file]);
});

/* ---------- POST /api/morning/subscribe ---------- */

test('subscribe: a new address is stored pending and answers on-list when there is no Worker binding', async () => {
  const env = mkEnv();
  const res = await subscribeAs(env, { email: `  ${EMAIL.toUpperCase()} `, source: 'receipt' });
  assert.equal(res.status, 202);
  const rawText = await res.text();
  assert.deepEqual(JSON.parse(rawText), { ok: true, status: 'on-list', message: SIGNUP_COPY['on-list'] });
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  const row = rowOf(env);
  assert.equal(row.status, 'pending');
  assert.equal(row.source, 'receipt');
  assert.match(row.token, TOKEN_RE);
  assert.equal(row.user_id, null);
  assert.equal(row.confirm_hash, null);
  assert.equal(row.confirm_sent_at, null, 'no mail went out: the Worker sends it on a later tick');
  assert.ok(row.created_at > Date.now() - 60_000);
  assert.equal(allRows(env).length, 1);
  noEmail(rawText, headersText(res));
});

test('subscribe: an unknown or missing source is stored as morning', async () => {
  const env = mkEnv();
  await subscribeAs(env, { email: EMAIL, source: 'newsletter-spam' });
  assert.equal(rowOf(env).source, 'morning');
  const env2 = mkEnv();
  await subscribeAs(env2, { email: EMAIL });
  assert.equal(rowOf(env2).source, 'morning');
  for (const source of ['morning', 'receipt', 'card', 'rss']) {
    const e = mkEnv();
    await subscribeAs(e, { email: EMAIL, source });
    assert.equal(rowOf(e).source, source);
  }
});

test('subscribe: a Worker that sent the mail makes it check-email, and the call carries the internal key', async () => {
  const MORNING_DAILY = worker(sent());
  const env = mkEnv({ MORNING_DAILY, MORNING_INTERNAL_KEY: KEY });
  const res = await subscribeAs(env, { email: EMAIL });
  assert.equal(res.status, 202);
  const rawText = await res.text();
  assert.deepEqual(JSON.parse(rawText), { ok: true, status: 'check-email', message: SIGNUP_COPY['check-email'] });
  assert.equal(MORNING_DAILY.calls.length, 1);
  const [call] = MORNING_DAILY.calls;
  assert.equal(call.url, 'https://morning-daily.internal/send-confirm');
  assert.equal(call.init.method, 'POST');
  assert.equal(call.init.headers['X-Morning-Key'], KEY);
  assert.equal(call.init.headers['Content-Type'], 'application/json');
  assert.deepEqual(call.body, { email: EMAIL });
  assert.equal(rowOf(env).status, 'pending');
  noEmail(rawText, headersText(res));
});

test('subscribe: a confirm mail sent under a minute ago still counts as mail on', async () => {
  const MORNING_DAILY = worker(Response.json({ ok: true, sent: false, reason: 'recent' }));
  const env = mkEnv({ MORNING_DAILY, MORNING_INTERNAL_KEY: KEY });
  const res = await subscribeAs(env, { email: EMAIL });
  assert.equal((await res.json()).status, 'check-email');
});

test('subscribe: a Worker that throws, answers 503 or 502, or says the mail is off leaves the row and answers on-list', async () => {
  const answers = {
    throws: 'throw',
    503: Response.json({ ok: false, reason: 'email-not-configured' }, { status: 503 }),
    502: Response.json({ ok: false, reason: 'send-failed' }, { status: 502 }),
    403: Response.json({ ok: false, reason: 'bad-key' }, { status: 403 }),
    'not json': new Response('<html>oops</html>', { status: 200 }),
    'not sent': Response.json({ ok: true, sent: false, reason: 'something-else' }),
  };
  for (const [name, answer] of Object.entries(answers)) {
    spy.calls.length = 0;
    const MORNING_DAILY = worker(answer);
    const env = mkEnv({ MORNING_DAILY, MORNING_INTERNAL_KEY: KEY });
    const res = await subscribeAs(env, { email: EMAIL });
    assert.equal(res.status, 202, name);
    assert.deepEqual(await res.json(), { ok: true, status: 'on-list', message: SIGNUP_COPY['on-list'] }, name);
    assert.equal(MORNING_DAILY.calls.length, 1, name);
    assert.equal(rowOf(env)?.status, 'pending', `${name}: the row is still there`);
    assert.equal(allRows(env).length, 1, name);
    for (const call of spy.calls) noEmail(call);
  }
  spy.calls.length = 0;
  const env = mkEnv({ MORNING_DAILY: worker(Response.json({ ok: false }, { status: 502 })), MORNING_INTERNAL_KEY: KEY });
  await subscribeAs(env, { email: EMAIL });
  assert.deepEqual(spy.calls.map((c) => JSON.parse(c[0])), [{ message: 'morning confirm handoff failed', status: 502 }], 'a failed handoff logs its status and nothing else');
  spy.calls.length = 0;
  await subscribeAs(mkEnv({ MORNING_DAILY: worker('throw'), MORNING_INTERNAL_KEY: KEY }), { email: EMAIL });
  assert.deepEqual(spy.calls.map((c) => JSON.parse(c[0])), [{ message: 'morning confirm handoff failed', status: 'error' }]);
  spy.calls.length = 0;
});

test('subscribe: the Worker is asked only when both the binding and the key exist', async () => {
  const noKey = worker(sent());
  const res1 = await subscribeAs(mkEnv({ MORNING_DAILY: noKey }), { email: EMAIL });
  assert.equal(noKey.calls.length, 0);
  assert.equal((await res1.json()).status, 'on-list');
  const emptyKey = worker(sent());
  await subscribeAs(mkEnv({ MORNING_DAILY: emptyKey, MORNING_INTERNAL_KEY: '' }), { email: EMAIL });
  assert.equal(emptyKey.calls.length, 0);
  const res3 = await subscribeAs(mkEnv({ MORNING_INTERNAL_KEY: KEY }), { email: EMAIL });
  assert.equal((await res3.json()).status, 'on-list', 'a key without a binding is mail off');
});

test('subscribe: a pending row with a live confirm link is left alone', async () => {
  const env = mkEnv();
  const token = newToken();
  seed(env, { status: 'pending', token, hash: 'a'.repeat(64), expires: Date.now() + 3_600_000, sentAt: Date.now() - 600_000, source: 'card' });
  const before = rowOf(env);
  const res = await subscribeAs(env, { email: EMAIL, source: 'rss' });
  assert.equal(res.status, 202);
  assert.deepEqual(rowOf(env), before, 'nothing changed, not even the source');
});

test('subscribe: a pending row whose confirm link lapsed is reset so a fresh link goes out', async () => {
  const env = mkEnv();
  const token = newToken();
  seed(env, { status: 'pending', token, hash: 'b'.repeat(64), expires: Date.now() - 1_000, sentAt: Date.now() - 49 * 3_600_000, source: 'card', createdAt: 5_000 });
  const res = await subscribeAs(env, { email: EMAIL });
  assert.equal(res.status, 202);
  const row = rowOf(env);
  assert.equal(row.status, 'pending');
  assert.equal(row.confirm_hash, null);
  assert.equal(row.confirm_expires_at, null);
  assert.equal(row.confirm_sent_at, null, 'back in the Worker\'s queue');
  assert.equal(row.token, token, 'the unsubscribe token is stable');
  assert.equal(row.created_at, 5_000);
  assert.equal(row.source, 'card');
});

test('subscribe: a pending row the Worker gave up on (5 refused sends) gets its tries back', async () => {
  const env = mkEnv();
  seed(env, { status: 'pending' });
  env.AUTH_DB.db.prepare('UPDATE edition_subscribers SET confirm_attempts = 5, confirm_last_attempt_at = 9').run();
  assert.equal((await subscribeAs(env, { email: EMAIL })).status, 202);
  assert.deepEqual([rowOf(env).confirm_attempts, rowOf(env).confirm_last_attempt_at], [0, null]);
  const fresh = mkEnv();
  seed(fresh, { status: 'pending' });
  fresh.AUTH_DB.db.prepare('UPDATE edition_subscribers SET confirm_attempts = 2, confirm_last_attempt_at = 9').run();
  await subscribeAs(fresh, { email: EMAIL });
  assert.equal(rowOf(fresh).confirm_attempts, 2, 'a row still being retried is left alone');
});

test('subscribe: a confirmed address writes nothing and answers the same shape as a new one, on the same mail state', async () => {
  // Mail off: no binding.
  const off = mkEnv();
  seed(off, { status: 'confirmed', confirmedAt: 2_000, lastDay: '2026-10-17' });
  const beforeOff = rowOf(off);
  const resOff = await subscribeAs(off, { email: EMAIL, source: 'rss' });
  assert.equal(resOff.status, 202);
  const bodyOff = await resOff.json();
  assert.deepEqual(rowOf(off), beforeOff, 'no write');
  const fresh = mkEnv();
  const resFresh = await subscribeAs(fresh, { email: EMAIL });
  assert.deepEqual(bodyOff, await resFresh.json());
  assert.deepEqual(Object.keys(bodyOff), ['ok', 'status', 'message']);

  // Mail on: the Worker answers "not pending" for a confirmed address (it checks its mail sender first and sends nothing).
  const onWorker = worker(Response.json({ ok: true, sent: false, reason: 'not-pending' }));
  const on = mkEnv({ MORNING_DAILY: onWorker, MORNING_INTERNAL_KEY: KEY });
  seed(on, { status: 'confirmed', confirmedAt: 2_000 });
  const beforeOn = rowOf(on);
  const bodyOn = await (await subscribeAs(on, { email: EMAIL })).json();
  assert.deepEqual(rowOf(on), beforeOn, 'no write');
  const freshOn = mkEnv({ MORNING_DAILY: worker(sent()), MORNING_INTERNAL_KEY: KEY });
  assert.deepEqual(bodyOn, await (await subscribeAs(freshOn, { email: EMAIL })).json());
  assert.equal(bodyOn.status, 'check-email');

  // Mail off at the Worker: its sender check fails before it looks at the row.
  const offWorker = mkEnv({ MORNING_DAILY: worker(Response.json({ ok: false, reason: 'email-not-configured' }, { status: 503 })), MORNING_INTERNAL_KEY: KEY });
  seed(offWorker, { status: 'confirmed', confirmedAt: 2_000 });
  assert.equal((await (await subscribeAs(offWorker, { email: EMAIL })).json()).status, 'on-list');
});

test('subscribe: an unsubscribed address comes back pending under its old token', async () => {
  const env = mkEnv();
  const oldToken = newToken();
  seed(env, { status: 'unsubscribed', token: oldToken, source: 'morning', confirmedAt: 3_000, unsubAt: 4_000, lastDay: '2026-10-10', hash: null });
  const res = await subscribeAs(env, { email: EMAIL, source: 'card' });
  assert.equal(res.status, 202);
  const row = rowOf(env);
  assert.equal(row.status, 'pending');
  assert.equal(row.token, oldToken, 'the same token, so one-click links in editions mailed before still work');
  assert.equal(row.source, 'card');
  assert.equal(row.unsubscribed_at, null);
  assert.equal(row.confirmed_at, null);
  assert.equal(row.last_sent_day, null);
  assert.equal(row.confirm_hash, null);
  assert.equal(row.confirm_expires_at, null);
  assert.equal(row.confirm_sent_at, null);
  assert.equal(allRows(env).length, 1);
});

test('subscribe: the address is matched without regard to case, so a second signup does not make a second row', async () => {
  const env = mkEnv();
  await subscribeAs(env, { email: EMAIL });
  await subscribeAs(env, { email: EMAIL.toUpperCase() }, { ip: '203.0.113.9' });
  assert.equal(allRows(env).length, 1);
});

test('subscribe: a signed-in account is linked, a broken session is nobody', async () => {
  const env = mkEnv();
  const db = env.AUTH_DB.db;
  const user = { userId: 'u-casey', createdAt: '2026-10-01T00:00:00.000Z', identities: [], preferredName: 'Casey' };
  db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)').run('u-casey', JSON.stringify(user), user.createdAt);
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run('tok-ok', 'u-casey', Date.now() + 86_400_000);
  await subscribeAs(env, { email: EMAIL }, { cookie: 'pc_session=tok-ok' });
  assert.equal(rowOf(env).user_id, 'u-casey');
  const other = mkEnv();
  await subscribeAs(other, { email: EMAIL }, { cookie: 'pc_session=no-such-session' });
  assert.equal(rowOf(other).user_id, null);
});

test('subscribe: a bad origin is 403 before anything else', async () => {
  const env = mkEnv({ AUTH_DB: undefined });
  for (const o of [{ origin: 'https://evil.example' }, { noOrigin: true }]) {
    const res = await subscribeAs(env, { email: 'not an email' }, o);
    assert.equal(res.status, 403);
    assert.equal((await res.json()).reason, 'bad-origin');
  }
  const live = mkEnv();
  const res = await subscribeAs(live, { email: EMAIL }, { origin: 'https://evil.example' });
  assert.equal(res.status, 403);
  assert.equal(allRows(live).length, 0);
  assert.equal(live.PC_RATES_KV.puts, 0, 'no rate-limit budget spent either');
});

test('subscribe: the body must be JSON, small, and parse', async () => {
  const env = mkEnv();
  assert.equal((await subscribeAs(env, { email: EMAIL }, { type: 'text/plain' })).status, 415);
  assert.equal((await subscribeAs(env, '{nope')).status, 400);
  const big = await subscribeAs(env, { email: EMAIL, pad: 'x'.repeat(5_000) });
  assert.equal(big.status, 413);
  assert.equal(allRows(env).length, 0);
});

test('subscribe: an address that does not look right is 400 invalid-email and spends nothing', async () => {
  const env = mkEnv();
  for (const email of ['', 'nope', 'a@b', 'a b@c.d', 'x@@y.z', 42, null, undefined, ['a@b.co'], `${'a'.repeat(250)}@b.co`]) {
    const res = await subscribeAs(env, { email });
    assert.equal(res.status, 400, JSON.stringify(email));
    assert.deepEqual(await res.json(), { ok: false, reason: 'invalid-email' });
  }
  const arr = await subscribeAs(env, [EMAIL]);
  assert.equal(arr.status, 400, 'a JSON array is not a body');
  assert.equal(allRows(env).length, 0);
  assert.equal(env.PC_RATES_KV.puts, 0);
});

test('subscribe: the fourth try for one address in the window is 429 with Retry-After, and writes nothing more', async () => {
  const env = mkEnv();
  for (let i = 0; i < 3; i += 1) assert.equal((await subscribeAs(env, { email: EMAIL }, { ip: `203.0.113.${20 + i}` })).status, 202);
  const res = await subscribeAs(env, { email: EMAIL }, { ip: '203.0.113.99' });
  assert.equal(res.status, 429);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.reason, 'email-rate-limited');
  assert.ok(Number(res.headers.get('Retry-After')) > 0);
  noEmail(JSON.stringify(body), headersText(res));
});

test('subscribe: one network is 429 ip-rate-limited after ten tries', async () => {
  const env = mkEnv();
  for (let i = 0; i < 10; i += 1) assert.equal((await subscribeAs(env, { email: `p${i}@example.org` })).status, 202);
  const res = await subscribeAs(env, { email: 'p11@example.org' });
  assert.equal(res.status, 429);
  assert.equal((await res.json()).reason, 'ip-rate-limited');
});

test('subscribe: with no rate-limit store the answer is 503, not an open door', async () => {
  const env = { AUTH_DB: new SqliteD1() };
  const res = await subscribeAs(env, { email: EMAIL });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).reason, 'rate-limit-not-configured');
  assert.equal(allRows(env).length, 0);
});

test('subscribe: no AUTH_DB, or a database without migration 0031, is 503 store-unavailable', async () => {
  const none = await subscribeAs({ PC_RATES_KV: new Kv() }, { email: EMAIL });
  assert.equal(none.status, 503);
  assert.deepEqual(await none.json(), { ok: false, reason: 'store-unavailable' });
  const stale = { AUTH_DB: new SqliteD1(WITHOUT_0031), PC_RATES_KV: new Kv() };
  const res = await subscribeAs(stale, { email: EMAIL });
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { ok: false, reason: 'store-unavailable' });
});

test('subscribe: a database error never reaches the Worker', async () => {
  const MORNING_DAILY = worker(sent());
  const stale = { AUTH_DB: new SqliteD1(WITHOUT_0031), PC_RATES_KV: new Kv(), MORNING_DAILY, MORNING_INTERNAL_KEY: KEY };
  assert.equal((await subscribeAs(stale, { email: EMAIL })).status, 503);
  assert.equal(MORNING_DAILY.calls.length, 0);
});

/* ---------- /api/morning/confirm ---------- */

const confirmUrl = (t) => `${ORIGIN}/api/morning/confirm${t === undefined ? '' : `?t=${t}`}`;
const getConfirm = (env, t) => confirm.onRequestGet({ request: new Request(confirmUrl(t)), env });
const postConfirm = (env, t) => confirm.onRequestPost({ request: new Request(confirmUrl(t), { method: 'POST' }), env });
const where = (res) => res.headers.get('Location');

test('confirm: GET shows one POST button and changes nothing, so a link scanner confirms nobody', async () => {
  const env = mkEnv();
  const raw = newToken();
  seed(env, { status: 'pending', hash: await sha256Hex(raw), expires: Date.now() + 3_600_000, sentAt: Date.now() - 1_000 });
  const before = rowOf(env);
  const res = await getConfirm(env, raw);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type'), /^text\/html/);
  assert.equal(res.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(res.headers.get('Referrer-Policy'), 'no-referrer');
  const html = await res.text();
  assert.equal(html.split('<form').length - 1, 1);
  assert.match(html, new RegExp(`<form method="post" action="/api/morning/confirm\\?t=${raw}">`));
  assert.deepEqual(rowOf(env), before, 'GET wrote nothing');
  noEmail(html, headersText(res));
  const bad = await getConfirm(env, 'short');
  assert.equal(bad.status, 302);
  assert.equal(where(bad), '/morning?paper=invalid#paper');
});

test('confirm: POST on a live link confirms the row and goes to /morning?paper=confirmed#paper', async () => {
  const env = mkEnv();
  const raw = newToken();
  seed(env, { status: 'pending', hash: await sha256Hex(raw), expires: Date.now() + 3_600_000, sentAt: Date.now() - 1_000 });
  const res = await postConfirm(env, raw);
  assert.equal(res.status, 303);
  assert.equal(where(res), '/morning?paper=confirmed#paper');
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.equal(res.headers.get('Referrer-Policy'), 'no-referrer');
  const row = rowOf(env);
  assert.equal(row.status, 'confirmed');
  assert.ok(row.confirmed_at > Date.now() - 60_000);
  noEmail(await res.text(), headersText(res));
});

test('confirm: a second use of a link still says confirmed; a link past its 48 hours is expired', async () => {
  const env = mkEnv();
  const raw = newToken();
  seed(env, { status: 'pending', hash: await sha256Hex(raw), expires: Date.now() + 3_600_000, sentAt: Date.now() });
  assert.equal(where(await postConfirm(env, raw)), '/morning?paper=confirmed#paper');
  const firstAt = rowOf(env).confirmed_at;
  assert.equal(where(await postConfirm(env, raw)), '/morning?paper=confirmed#paper', 'a used link is not "expired"');
  assert.equal(rowOf(env).status, 'confirmed');
  assert.equal(rowOf(env).confirmed_at, firstAt, 'the second use writes nothing');

  const late = mkEnv();
  const old = newToken();
  seed(late, { status: 'pending', hash: await sha256Hex(old), expires: Date.now() - 1, sentAt: Date.now() - 49 * 3_600_000 });
  assert.equal(where(await postConfirm(late, old)), '/morning?paper=expired#paper');
  assert.equal(rowOf(late).status, 'pending', 'an expired link confirms nothing');
});

test('confirm: a link that matches no row is expired; one that is not a token is invalid', async () => {
  const env = mkEnv();
  assert.equal(where(await postConfirm(env, newToken())), '/morning?paper=expired#paper');
  for (const bad of [undefined, '', 'short', 'x'.repeat(42), 'x'.repeat(44), `${'x'.repeat(42)}!`, '%00']) {
    const res = await postConfirm(env, bad);
    assert.equal(res.status, 303, String(bad));
    assert.equal(where(res), '/morning?paper=invalid#paper', String(bad));
    assert.equal(res.headers.get('Referrer-Policy'), 'no-referrer');
  }
});

test('confirm: an unsubscribed row cannot be confirmed by an old link, and unsubscribing clears a used one', async () => {
  const env = mkEnv();
  const raw = newToken();
  seed(env, { status: 'unsubscribed', hash: null, unsubAt: 1 });
  env.AUTH_DB.db.prepare('UPDATE edition_subscribers SET confirm_hash = ?, confirm_expires_at = ?').run(await sha256Hex(raw), Date.now() + 10_000);
  assert.equal(where(await postConfirm(env, raw)), '/morning?paper=expired#paper');
  assert.equal(rowOf(env).status, 'unsubscribed');

  const used = mkEnv();
  const link = newToken();
  const token = newToken();
  seed(used, { status: 'pending', token, hash: await sha256Hex(link), expires: Date.now() + 3_600_000, sentAt: Date.now() });
  assert.equal(where(await postConfirm(used, link)), '/morning?paper=confirmed#paper');
  await unsubscribe.onRequestPost({ request: new Request(`${ORIGIN}/api/morning/unsubscribe?t=${token}`, { method: 'POST' }), env: used });
  assert.equal(rowOf(used).confirm_hash, null);
  assert.equal(where(await postConfirm(used, link)), '/morning?paper=expired#paper', 'after unsubscribing the old link confirms nothing');
  assert.equal(rowOf(used).status, 'unsubscribed');
});

test('confirm: no database, or a database without 0031, is paper=unavailable', async () => {
  assert.equal(where(await postConfirm({}, newToken())), '/morning?paper=unavailable#paper');
  assert.equal(where(await postConfirm({ AUTH_DB: new SqliteD1(WITHOUT_0031) }, newToken())), '/morning?paper=unavailable#paper');
});

/* ---------- /api/morning/unsubscribe ---------- */

const unsubUrl = (t) => `${ORIGIN}/api/morning/unsubscribe${t === undefined ? '' : `?t=${t}`}`;
const getUnsub = (env, t) => unsubscribe.onRequestGet({ request: new Request(unsubUrl(t)), env });
const oneClick = (env, t, o = {}) => unsubscribe.onRequestPost({
  request: new Request(unsubUrl(t), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(o.headers ?? {}) }, body: o.body ?? 'List-Unsubscribe=One-Click' }),
  env,
});

test('unsubscribe: GET shows a form with one button and leaves the row exactly as it was', async () => {
  const env = mkEnv();
  const token = newToken();
  seed(env, { status: 'confirmed', token, confirmedAt: 2_000 });
  const before = rowOf(env);
  const res = await getUnsub(env, token);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type'), /^text\/html/);
  assert.equal(res.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(res.headers.get('Referrer-Policy'), 'no-referrer');
  const html = await res.text();
  assert.equal(html.split('<form').length - 1, 1);
  assert.match(html, new RegExp(`<form method="post" action="/api/morning/unsubscribe\\?t=${token}">`));
  assert.equal(html.split('<button').length - 1, 1);
  assert.match(html, />Unsubscribe from the Morning Edition<\/button>/);
  assert.match(html, /PointCast · Morning Edition/);
  assert.match(html, /href="\/morning"/);
  assert.deepEqual(rowOf(env), before, 'a GET never changes a row');
  noEmail(html, headersText(res));
});

test('unsubscribe: GET with a token that fails the shape is 400, one that matches no row is 404, same words', async () => {
  const env = mkEnv();
  for (const t of [undefined, '', 'nope', 'x'.repeat(44)]) {
    const res = await getUnsub(env, t);
    assert.equal(res.status, 400);
    assert.match(await res.text(), /That link is not valid\./);
  }
  const miss = await getUnsub(env, newToken());
  assert.equal(miss.status, 404);
  assert.match(await miss.text(), /That link is not valid\./);
});

test('unsubscribe: a one-click POST with no Origin and the RFC 8058 body unsubscribes, and clears any confirm link', async () => {
  const env = mkEnv();
  const token = newToken();
  seed(env, { status: 'confirmed', token, confirmedAt: 2_000 });
  const res = await oneClick(env, token);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /You(&#39;|')re unsubscribed from the Morning Edition\./);
  assert.equal(res.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(res.headers.get('Referrer-Policy'), 'no-referrer');
  const row = rowOf(env);
  assert.equal(row.status, 'unsubscribed');
  assert.ok(row.unsubscribed_at > Date.now() - 60_000);
  assert.equal(row.confirm_hash, null);
  noEmail(html, headersText(res));

  const pending = mkEnv();
  const t2 = newToken();
  seed(pending, { status: 'pending', token: t2, hash: 'c'.repeat(64), expires: Date.now() + 1_000, sentAt: 1 });
  assert.equal((await oneClick(pending, t2)).status, 200);
  const r2 = rowOf(pending);
  assert.equal(r2.status, 'unsubscribed');
  assert.equal(r2.confirm_hash, null);
  assert.equal(r2.confirm_expires_at, null);
});

test('unsubscribe: the form post (any body) works too, and a second post or an unknown token answers the same page', async () => {
  const env = mkEnv();
  const token = newToken();
  seed(env, { status: 'confirmed', token });
  const first = await oneClick(env, token, { body: '' });
  const again = await oneClick(env, token);
  const unknown = await oneClick(env, newToken());
  assert.equal(first.status, 200);
  assert.equal(again.status, 200);
  assert.equal(unknown.status, 200);
  const [a, b, c] = await Promise.all([first.text(), again.text(), unknown.text()]);
  assert.equal(a, b);
  assert.equal(a, c, 'it never reveals whether a token matched a row');
  assert.equal(allRows(env).length, 1);
});

test('unsubscribe: POST with a token that fails the shape is 400', async () => {
  const env = mkEnv();
  seed(env, { status: 'confirmed' });
  const res = await oneClick(env, 'nope');
  assert.equal(res.status, 400);
  assert.equal((await oneClick(env, undefined)).status, 400);
  assert.equal(rowOf(env).status, 'confirmed');
});

test('unsubscribe: with no database the page says so instead of claiming success', async () => {
  const token = newToken();
  assert.equal((await getUnsub({}, token)).status, 503);
  assert.equal((await oneClick({}, token)).status, 503);
  const stale = { AUTH_DB: new SqliteD1(WITHOUT_0031) };
  assert.equal((await getUnsub(stale, token)).status, 503);
  assert.equal((await oneClick(stale, token)).status, 503);
});

/* ---------- the address never leaves ---------- */

test('privacy: through a full signup, confirm and unsubscribe, no console call and no response carries the address', async () => {
  spy.calls.length = 0;
  const MORNING_DAILY = worker(Response.json({ ok: false }, { status: 502 }));
  const env = mkEnv({ MORNING_DAILY, MORNING_INTERNAL_KEY: KEY });
  const signup = await subscribeAs(env, { email: EMAIL });
  noEmail(await signup.text(), headersText(signup));
  const row = rowOf(env);
  const raw = newToken();
  env.AUTH_DB.db.prepare('UPDATE edition_subscribers SET confirm_hash = ?, confirm_expires_at = ? WHERE email = ?').run(await sha256Hex(raw), Date.now() + 10_000, EMAIL);
  const done = await getConfirm(env, raw);
  noEmail(where(done), headersText(done));
  const page = await getUnsub(env, row.token);
  noEmail(await page.text(), headersText(page));
  const gone = await oneClick(env, row.token);
  noEmail(await gone.text(), headersText(gone));
  const rejected = await subscribeAs(env, { email: EMAIL }, { origin: 'https://evil.example' });
  noEmail(await rejected.text(), headersText(rejected));
  for (const call of spy.calls) noEmail(call);
  spy.calls.length = 0;
});
