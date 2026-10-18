import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import { pidHash } from '../functions/_lib/air-kinds.mjs';
import { HOUSE_SELECT, squash } from '../functions/_lib/air-house.mjs';
import { KILL_TEST, killTestCount } from '../functions/_lib/air-killtest.mjs';

// The honest count (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §7.1-7.3, §7.11):
// GET /api/air/killtest and /api/air/house, run through vite's ssrLoadModule
// the way tests/air-desk-api.test.mjs reaches functions/api/mcp.ts, on a
// node:sqlite D1 with migrations 0001 + 0023 + 0031.

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const MIGRATIONS = (files) => Promise.all(files.map((f) => read(`migrations/auth/${f}`))).then((x) => x.join('\n'));
const WITH_0031 = await MIGRATIONS(['0001_init.sql', '0023_air.sql', '0031_field_reports_paper.sql']);
const WITHOUT_0031 = await MIGRATIONS(['0001_init.sql', '0023_air.sql']);

/** D1 over node:sqlite, as tests/air-assign-api.test.mjs: SELECT and RETURNING read, a batch is one transaction. */
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

const DEV = {
  a: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', b: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', c: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  d: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', e: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', f: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  g: '99999999-9999-4999-8999-999999999999', boss: '11111111-1111-4111-8111-111111111111',
};
const DAY = '2026-10-02';
const T0 = Date.parse('2026-10-02T14:36:00Z');
const SLOT = 1_800_000;
const NOW = Date.parse('2026-10-20T20:00:00Z'); // inside the window's last week, before the Oct 24 read

const { createServer } = await import('vite');
const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
test.after(() => server.close());
const killtest = await server.ssrLoadModule('/functions/api/air/killtest.ts');
const house = await server.ssrLoadModule('/functions/api/air/house.ts');

const town = (migrations = WITH_0031) => ({ AUTH_DB: new SqliteD1(migrations) });

function user(env, id, handle, roles = [], identities = []) {
  env.AUTH_DB.db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)')
    .run(id, JSON.stringify({ userId: id, createdAt: '2026-09-01T00:00:00Z', identities, preferredName: handle, roles }), '2026-09-01T00:00:00Z');
  env.AUTH_DB.db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(`pcs_${handle}`, id, Date.now() + 86_400_000);
  return `pc_session=pcs_${handle}`;
}

let rowN = 0;
/** One air_reports row. `device` is hashed with the real pidHash; ip_hash is a fixture string that must never leak. */
async function put(env, { device, spot = 'el-segundo', kind = 'wait', value = '1-4', day = DAY, at = T0, userId = null, onsite = 1, status = 'ok', source = 'page', sourceUrl = null, slotShift = 0 }) {
  rowN += 1;
  const slot = Math.floor(at / SLOT) + slotShift;
  env.AUTH_DB.db.prepare(`INSERT INTO air_reports (id, spot, kind, value, observed_at, day, slot, pid_hash, ip_hash, user_id, byline, onsite, status, source, source_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(`ar_fixture${String(rowN).padStart(10, '0')}`, spot, kind, value, at, day, slot, await pidHash(device), `ip-hash-fixture-${rowN}`, userId, 'Guest 0000', onsite, status, source, sourceUrl, at);
}

const getKill = async (env) => {
  const res = await killtest.onRequestGet({ env, request: new Request('https://pointcast.xyz/api/air/killtest') });
  return { res, body: await res.json() };
};
const houseGet = async (env, { device = DEV.a, cookie = '', headers = {} } = {}) => {
  const res = await house.onRequestGet({
    env,
    request: new Request('https://pointcast.xyz/api/air/house', { headers: { ...(device ? { 'X-PC-Device': device } : {}), ...(cookie ? { cookie } : {}), ...headers } }),
  });
  return { res, body: await res.json() };
};
const housePost = async (env, body, { cookie = '', origin = 'https://pointcast.xyz' } = {}) => {
  const res = await house.onRequestPost({
    env,
    request: new Request('https://pointcast.xyz/api/air/house', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}), ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    }),
  });
  return { res, body: await res.json() };
};

/** The same count straight from SQL, written independently of killTestRows: the live kinds, window, site, source and status, minus house. */
function sqlCount(env) {
  const live = config.spots.map((s) => [s.id, Object.keys(s.kinds)[0]]);
  const keep = live.map(([spot, kind]) => `(r.spot = '${spot}' AND r.kind = '${kind}')`).join(' OR ');
  const rows = env.AUTH_DB.rows(`SELECT COUNT(*) AS reports, COUNT(DISTINCT COALESCE(r.user_id, r.pid_hash)) AS people FROM (
      SELECT DISTINCT COALESCE(r.user_id, r.pid_hash) AS who, r.spot, r.kind, r.slot, r.user_id, r.pid_hash FROM air_reports r
      WHERE r.day >= ? AND r.day <= ? AND r.source = 'page' AND r.status = 'ok' AND r.onsite = 1 AND (${keep})
        AND NOT EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'pid' AND h.value = r.pid_hash)
        AND NOT EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'user' AND h.value = r.user_id)
        AND NOT EXISTS (SELECT 1 FROM users u, json_each(u.payload, '$.roles') j WHERE u.id = r.user_id AND j.value IN ('broadcaster', 'director'))
    ) r`, KILL_TEST.from, KILL_TEST.to);
  return rows[0];
}

/** Every string a response could leak: hashes, ip fixtures, device ids, user ids. */
async function secrets(env) {
  const out = [];
  for (const d of Object.values(DEV)) out.push(d, await pidHash(d));
  out.push('ip-hash-fixture', 'u_boss', 'u_fan', 'u_plain', 'who', 'pid_hash', 'ip_hash', 'user_id', 'user_payload');
  for (const r of env.AUTH_DB.rows('SELECT pid_hash, ip_hash, user_id FROM air_reports')) out.push(r.pid_hash, r.ip_hash);
  return out.filter(Boolean);
}
async function noLeak(env, ...bodies) {
  const text = bodies.map((b) => JSON.stringify(b)).join('\n');
  for (const s of await secrets(env)) assert.ok(!text.includes(s), `a response leaked ${s.slice(0, 12)}`);
}

/* ---------- GET /api/air/killtest ---------- */

test('killtest: a guest on site at el-segundo is 1 report from 1 person; marked house they are 0 from 0; unmarked they are back', async () => {
  const env = town();
  const boss = user(env, 'u_boss', 'boss', ['broadcaster']);
  await put(env, { device: DEV.a }); // the guest: counts
  await put(env, { device: DEV.boss, userId: 'u_boss', at: T0 + SLOT }); // a broadcaster's row: house
  await put(env, { device: DEV.c, source: 'agent:frog', onsite: 0, sourceUrl: 'https://example.com/sign', at: T0 + 2 * SLOT }); // an agent: never counts
  await put(env, { device: DEV.d, kind: 'parking', value: 'easy', at: T0 + 3 * SLOT }); // a side question: never counts

  const first = await getKill(env);
  assert.equal(first.res.status, 200);
  assert.deepEqual([first.body.ok, first.body.reports, first.body.people], [true, 1, 1]);
  assert.deepEqual(sqlCount(env), { reports: 1, people: 1 });

  const marked = await housePost(env, { action: 'mark', device: DEV.a }, { cookie: boss });
  assert.deepEqual([marked.res.status, marked.body], [200, { ok: true, marked: true }]);
  const after = await getKill(env);
  assert.deepEqual([after.body.reports, after.body.people, after.body.pass], [0, 0, false], 'marking also takes the phone\'s earlier report out');
  assert.deepEqual(sqlCount(env), { reports: 0, people: 0 });

  await housePost(env, { action: 'unmark', device: DEV.a }, { cookie: boss });
  assert.deepEqual([(await getKill(env)).body.reports, (await getKill(env)).body.people], [1, 1]);
});

test('killtest: the route\'s numbers equal a direct SQL count on a fixture with every kind of noise', async () => {
  const env = town();
  const boss = user(env, 'u_boss', 'boss', ['broadcaster']);
  user(env, 'u_dir', 'dir', ['director']);
  user(env, 'u_fan', 'fan', []);
  // Counts: three guests on site, one signed-in fan (counted once across two phones), same spot different half hours.
  await put(env, { device: DEV.a });
  await put(env, { device: DEV.a, at: T0 + SLOT });
  await put(env, { device: DEV.b, spot: 'courts', value: '0', at: T0 + 2 * SLOT });
  await put(env, { device: DEV.e, userId: 'u_fan', at: T0 + 3 * SLOT });
  await put(env, { device: DEV.f, userId: 'u_fan', at: T0 + 4 * SLOT }); // another phone, same account: one person
  // Noise: none of these count.
  await put(env, { device: DEV.boss, userId: 'u_boss', at: T0 + 5 * SLOT });
  await put(env, { device: DEV.g, userId: 'u_dir', at: T0 + 6 * SLOT });
  await put(env, { device: DEV.c, onsite: 0, at: T0 + 7 * SLOT }); // from away
  await put(env, { device: DEV.c, status: 'removed', at: T0 + 8 * SLOT }); // spam
  await put(env, { device: DEV.c, kind: 'parking', value: 'tight', at: T0 + 9 * SLOT });
  await put(env, { device: DEV.c, day: '2026-09-27', at: T0 - 6 * 86_400_000 }); // before the window
  await put(env, { device: DEV.c, day: '2026-10-24', at: T0 + 22 * 86_400_000 }); // after it
  await put(env, { device: DEV.c, source: 'agent:sol', onsite: 0, sourceUrl: 'https://example.com/x', at: T0 + 10 * SLOT });
  await put(env, { device: DEV.d, spot: 'beach', kind: 'fog', value: 'clear', at: T0 + 11 * SLOT }); // beach fog is the beach's live kind: counts
  env.AUTH_DB.db.prepare("INSERT INTO air_house (kind, value, note, added_at) VALUES ('pid', ?, 'fixture', 1)").run(await pidHash(DEV.d)); // ...but d is a house phone

  const { res, body } = await getKill(env);
  const direct = sqlCount(env);
  assert.deepEqual([body.reports, body.people], [direct.reports, direct.people], 'JS and SQL agree');
  assert.deepEqual([body.reports, body.people], [5, 3]);
  assert.equal(body.pass, false, '5 reports is under the bar of 10');
  assert.deepEqual(body.needs, { reports: 10, people: 3 });
  assert.deepEqual(body.window, { from: '2026-09-28', to: '2026-10-23' });
  const laToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  assert.equal(body.final, laToday >= KILL_TEST.readOn, 'final from the Sat Oct 24 read, by the LA date');
  assert.deepEqual(Object.keys(body).sort(), ['asOf', 'final', 'needs', 'ok', 'pass', 'people', 'reports', 'window']);
  assert.equal(res.headers.get('Cache-Control'), 'public, max-age=60');
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.match(res.headers.get('Content-Type'), /application\/json/);
  await noLeak(env, body);
  // The store rows agree with the pure counter fed the same rows.
  const { killTestRows } = await server.ssrLoadModule('/functions/_lib/air-count-store.ts');
  const rows = await killTestRows(env.AUTH_DB);
  assert.equal(killTestCount(config, rows, NOW).reports, body.reports);
});

test('killtest: passing needs 10 reports from 3 people, and the route flips pass', async () => {
  const env = town();
  for (let i = 0; i < 10; i += 1) await put(env, { device: [DEV.a, DEV.b, DEV.e][i % 3], at: T0 + i * SLOT });
  const { body } = await getKill(env);
  assert.deepEqual([body.reports, body.people, body.pass], [10, 3, true]);
});

test('killtest: without migration 0031 (no air_house) or without D1 the answer is 503 store-unavailable', async () => {
  const old = town(WITHOUT_0031);
  await put(old, { device: DEV.a });
  const res = await getKill(old);
  assert.equal(res.res.status, 503);
  assert.deepEqual(res.body, { ok: false, reason: 'store-unavailable' });
  const none = await getKill({});
  assert.equal(none.res.status, 503);
  const cors = await killtest.onRequestOptions();
  assert.equal(cors.status, 204);
  assert.equal(cors.headers.get('Access-Control-Allow-Origin'), '*');
});

/* ---------- /api/air/house ---------- */

test('house GET: a guest and a signed-in non-director learn nothing; the director sees canMark and marked', async () => {
  const env = town();
  const boss = user(env, 'u_boss', 'boss', ['broadcaster']);
  const plain = user(env, 'u_plain', 'plain', []);

  const guest = await houseGet(env, { cookie: '' });
  assert.deepEqual([guest.res.status, guest.body], [200, { ok: true, canMark: false }]);
  assert.ok(!('marked' in guest.body));
  assert.equal(guest.res.headers.get('Cache-Control'), 'no-store');
  const fan = await houseGet(env, { cookie: plain });
  assert.deepEqual(fan.body, { ok: true, canMark: false });

  const director = await houseGet(env, { cookie: boss });
  assert.deepEqual([director.res.status, director.body], [200, { ok: true, canMark: true, marked: false }]);
  assert.equal(director.res.headers.get('Cache-Control'), 'no-store');
  await noLeak(env, guest.body, fan.body, director.body);
});

test('house GET: a linked director wallet is a director; a bad or missing device is 400, and a query string never counts', async () => {
  const env = town();
  const wallet = user(env, 'u_wallet', 'wallet', [], [{ provider: 'kukai', id: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw' }]);
  assert.equal((await houseGet(env, { cookie: wallet })).body.canMark, true);
  assert.equal((await houseGet(env, { device: 'not-a-uuid' })).res.status, 400);
  const missing = await houseGet(env, { device: null });
  assert.deepEqual([missing.res.status, missing.body.reason], [400, 'bad-device']);
  const viaQuery = await house.onRequestGet({ env, request: new Request(`https://pointcast.xyz/api/air/house?device=${DEV.a}`) });
  assert.equal(viaQuery.status, 400, 'the device rides in the X-PC-Device header only');
});

test('house POST: mark then GET says marked, unmark clears it, and the account row stays', async () => {
  const env = town();
  const boss = user(env, 'u_boss', 'boss', ['broadcaster']);
  const mark = await housePost(env, { action: 'mark', device: DEV.a }, { cookie: boss });
  assert.deepEqual([mark.res.status, mark.body], [200, { ok: true, marked: true }]);
  assert.equal(mark.res.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(env.AUTH_DB.rows('SELECT kind, note FROM air_house ORDER BY kind'), [
    { kind: 'pid', note: 'marked from /r/me' }, { kind: 'user', note: 'marked from /r/me' },
  ]);
  assert.deepEqual((await houseGet(env, { cookie: boss })).body, { ok: true, canMark: true, marked: true });
  const again = await housePost(env, { action: 'mark', device: DEV.a }, { cookie: boss });
  assert.equal(again.body.marked, true, 'a second mark is a no-op');
  assert.equal(env.AUTH_DB.rows('SELECT COUNT(*) AS n FROM air_house')[0].n, 2);

  const unmark = await housePost(env, { action: 'unmark', device: DEV.a }, { cookie: boss });
  assert.deepEqual([unmark.res.status, unmark.body], [200, { ok: true, marked: false }]);
  assert.deepEqual(env.AUTH_DB.rows('SELECT kind FROM air_house'), [{ kind: 'user' }], 'unmark removes the phone; the account stays');
  assert.equal((await houseGet(env, { cookie: boss })).body.marked, false);
  // A different phone is not marked.
  assert.equal((await houseGet(env, { cookie: boss, device: DEV.b })).body.marked, false);
  await noLeak(env, mark.body, unmark.body);
});

test('house POST: a guest or a non-director is 403 forbidden and nothing is written; a bad origin is 403 first', async () => {
  const env = town();
  const boss = user(env, 'u_boss', 'boss', ['broadcaster']);
  const plain = user(env, 'u_plain', 'plain', []);
  for (const cookie of ['', plain]) {
    const res = await housePost(env, { action: 'mark', device: DEV.a }, { cookie });
    assert.deepEqual([res.res.status, res.body], [403, { ok: false, reason: 'forbidden' }]);
  }
  assert.equal(env.AUTH_DB.rows('SELECT COUNT(*) AS n FROM air_house')[0].n, 0);

  const origin = await housePost(env, { action: 'mark', device: DEV.a }, { cookie: boss, origin: 'https://evil.example' });
  assert.deepEqual([origin.res.status, origin.body.reason], [403, 'bad-origin']);
  const noOrigin = await housePost(env, { action: 'mark', device: DEV.a }, { cookie: boss, origin: '' });
  assert.deepEqual([noOrigin.res.status, noOrigin.body.reason], [403, 'bad-origin']);
  assert.equal(env.AUTH_DB.rows('SELECT COUNT(*) AS n FROM air_house')[0].n, 0);

  assert.equal((await housePost(env, { action: 'mark', device: 'nope' }, { cookie: boss })).body.reason, 'bad-device');
  assert.equal((await housePost(env, { action: 'mark' }, { cookie: boss })).res.status, 400);
  const bad = await housePost(env, { action: 'bless', device: DEV.a }, { cookie: boss });
  assert.deepEqual([bad.res.status, bad.body.reason], [400, 'bad-action']);
  const notJson = await house.onRequestPost({
    env, request: new Request('https://pointcast.xyz/api/air/house', { method: 'POST', headers: { 'Content-Type': 'text/plain', Origin: 'https://pointcast.xyz', cookie: boss }, body: '{}' }),
  });
  assert.equal(notJson.status, 415);
});

test('house: before migration 0031 the table is missing and the director gets 503, never a 500 or a leak', async () => {
  const env = town(WITHOUT_0031);
  const boss = user(env, 'u_boss', 'boss', ['broadcaster']);
  const get = await houseGet(env, { cookie: boss });
  assert.deepEqual([get.res.status, get.body], [503, { ok: false, reason: 'store-unavailable' }]);
  const post = await housePost(env, { action: 'mark', device: DEV.a }, { cookie: boss });
  assert.deepEqual([post.res.status, post.body.reason], [503, 'store-unavailable']);
  const guest = await houseGet(env, { cookie: '' });
  assert.deepEqual(guest.body, { ok: true, canMark: false }, 'a guest never reaches the table');
  assert.equal((await houseGet({}, { cookie: '' })).res.status, 503);
  assert.equal((await housePost({}, { action: 'mark', device: DEV.a })).res.status, 503);
});

/* ---------- source contract ---------- */

/** Every `.prepare(<one string literal>)` in a source text, with what follows it. */
function statements(src) {
  const out = [];
  for (const m of src.matchAll(/\.prepare\(\s*([`"'])([\s\S]*?)\1\s*\)\s*(\.bind\()?/g)) out.push({ sql: m[2], bound: Boolean(m[3]) });
  return out;
}

test('source: air-count-store.ts is literal prepared statements with bound values, and the kill-test SQL embeds HOUSE_SELECT', async () => {
  const src = await read('functions/_lib/air-count-store.ts');
  assert.equal((src.match(/\.prepare\(/g) ?? []).length, 5, 'killTestRows, houseState, two inserts, one delete');
  const list = statements(src);
  assert.equal(list.length, 5, 'every .prepare( takes one string literal');
  for (const s of list) {
    assert.ok(s.bound, `${squash(s.sql).slice(0, 40)}: followed by .bind(`);
    assert.doesNotMatch(s.sql, /\$\{/, 'no interpolation inside SQL');
    assert.match(s.sql, /^\s*(SELECT|INSERT|DELETE)\b/);
  }
  assert.doesNotMatch(src, /\.exec\(/);
  const kill = squash(list[0].sql);
  assert.ok(kill.includes(HOUSE_SELECT), 'the kill-test SQL contains the three house columns verbatim');
  assert.ok(kill.includes("COALESCE(r.user_id, r.pid_hash) AS who"));
  assert.ok(kill.includes("WHERE r.day >= ? AND r.day <= ? AND r.source = 'page' AND r.status = 'ok' AND r.onsite = 1 ORDER BY r.observed_at LIMIT 5000"));
  assert.match(src, /\.bind\(KILL_TEST\.from, KILL_TEST\.to\)/);
  assert.equal(squash(list[1].sql), "SELECT 1 AS ok FROM air_house WHERE kind = 'pid' AND value = ?");
  assert.equal(squash(list[2].sql), "INSERT OR IGNORE INTO air_house (kind, value, note, added_at) VALUES ('pid', ?, 'marked from /r/me', ?)");
  assert.equal(squash(list[3].sql), "INSERT OR IGNORE INTO air_house (kind, value, note, added_at) VALUES ('user', ?, 'marked from /r/me', ?)");
  assert.equal(squash(list[4].sql), "DELETE FROM air_house WHERE kind = 'pid' AND value = ?");
  assert.match(src, /db\.batch\(\[/, 'mark is one batch');
});

test('source: the routes check D1 first, read the post before anything else, gate on the director, and carry no hash', async () => {
  const k = await read('functions/api/air/killtest.ts');
  const h = await read('functions/api/air/house.ts');
  for (const src of [k, h]) {
    assert.match(src, /if \(!env\.AUTH_DB\) return unavailable\(\);/);
    assert.doesNotMatch(src, /\.prepare\(|\.exec\(/, 'the routes carry no SQL of their own');
  }
  assert.doesNotMatch(k + h, /pid_hash|ip_hash|user_id|user_payload|\.who\b/);
  assert.match(k, /'Cache-Control': 'public, max-age=60'/);
  assert.match(k, /'Access-Control-Allow-Origin': '\*'/);
  assert.match(k, /killTestCount\(AIR_CONFIG, await killTestRows\(env\.AUTH_DB\), Date\.now\(\)\)/);
  const post = h.slice(h.indexOf('export const onRequestPost'));
  assert.match(post, /^export const onRequestPost[^\n]*\n\s+const read = await readPost\(request\);\n\s+if \('refused' in read\) return read\.refused;/, 'readPost first');
  assert.match(post, /hasDirectorDeskAccess\(session\)/);
  assert.match(post, /fail\('forbidden', 403\)/);
  assert.match(post, /fail\('bad-action'\)/);
  const get = h.slice(h.indexOf('export const onRequestGet'), h.indexOf('export const onRequestPost'));
  assert.match(get, /request\.headers\.get\('X-PC-Device'\)/);
  assert.doesNotMatch(get, /searchParams|new URL\(/, 'no query string');
  assert.match(get, /canMark: false/);
});

test('source: nothing here is a code field: no session codes, no code_via, no typed code', async () => {
  for (const f of ['functions/_lib/air-count-store.ts', 'functions/api/air/killtest.ts', 'functions/api/air/house.ts', 'src/scripts/air-house.ts', 'src/scripts/air-how.ts', 'src/pages/r/how.astro']) {
    assert.doesNotMatch(await read(f), /code_via|codeVia|session code|typed code|name="code"/i, f);
  }
});
