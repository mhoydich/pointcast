import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { codeHash, parseAirReport, parseConfirm, pidHash } from '../functions/_lib/air-kinds.mjs';
import { fileReport, confirmReport } from '../functions/_lib/air-store.ts';
import { boardData } from '../functions/_lib/air-board-store.ts';
import config from '../src/data/air-spots.json' with { type: 'json' };
import schedule from '../src/data/courts-schedule.json' with { type: 'json' };

const COURTS = schedule.courts;

// The Pickleball Board's API, group A (build spec §7, §11): GET /api/air/board.
// air-board-store.ts is executed directly (like air-store.ts elsewhere);
// functions/api/air/board.ts and functions/courts.json.ts are Pages
// Functions that pull in group C's court-conditions.ts, which — like
// src/lib/burnoff.ts and marine-oracle.ts underneath it — uses extensionless
// relative imports plain node cannot resolve (see tests/court-weather.test.mjs's
// note), so those two routes are checked as source text, the same way
// tests/air-api.test.mjs checks functions/api/air/[spot].ts.
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const MIN = 60_000;
const HOUR = 60 * MIN;
const PEPPER = 'test-pepper';
const CRT = 'CRTFIXTURE9';
const ES = 'ESFIXTURE9';
const SEED = await Promise.all([['courts', CRT], ['el-segundo', ES]].map(async ([spot, code]) => [spot, await codeHash(spot, code, PEPPER)]));
const MIGRATIONS = (await Promise.all(['0001_init.sql', '0023_air.sql', '0024_air_assignments.sql', '0025_air_desk.sql'].map((f) => read(`migrations/auth/${f}`)))).join('\n');

/** D1 over node:sqlite, same shape as tests/air-api.test.mjs's harness. */
class SqliteD1 {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec(MIGRATIONS);
    const code = this.db.prepare("INSERT INTO air_codes (spot, code_hash, valid_from, valid_to) VALUES (?, ?, '2026-09-01', '2026-12-31')");
    for (const [spot, hash] of SEED) code.run(spot, hash);
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
class Store {
  data = new Map(); writes = [];
  async get(key, type) { const v = this.data.get(key); return v === undefined ? null : type === 'json' ? JSON.parse(v) : v; }
  async put(key, value) { this.data.set(key, value); this.writes.push(key); }
  async list({ prefix, limit }) { const names = [...this.data.keys()].filter((k) => k.startsWith(prefix)).sort().slice(0, limit); return { keys: names.map((name) => ({ name })), list_complete: true }; }
}
function town() {
  const env = {
    AUTH_DB: new SqliteD1(),
    VISITS: new Store(),
    AIR_CODE_PEPPER: PEPPER,
    PRESENCE: { idFromName: (n) => n, get: () => ({ fetch: async (r) => { await r.json(); return new Response('{}'); } }) },
  };
  const later = [];
  return { env, defer: (p) => later.push(p), settle: () => Promise.all(later.splice(0)) };
}
const ipOf = (device) => `192.0.2.${device.charCodeAt(0)}`;
const req = (path, ip) => new Request(`https://pointcast.xyz/api/air/${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://pointcast.xyz', 'CF-Connecting-IP': ip }, body: '{}',
});
async function report(t, spot, body, now) {
  const p = parseAirReport(config, spot, body, now);
  assert.ok(!p.reason, p.reason);
  const res = await fileReport(req(spot, ipOf(body.device)), t.env, t.env.AUTH_DB, config, p, now, t.defer);
  return { status: res.status, body: await res.json() };
}
async function confirm(t, body, now) {
  const c = parseConfirm(body);
  assert.ok(!c.reason, c.reason);
  const res = await confirmReport(req('confirm', ipOf(body.device)), t.env, t.env.AUTH_DB, config, c, now, t.defer);
  return { status: res.status, body: await res.json() };
}
const DEV = {
  a: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', b: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', c: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  d: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
};
/** A remote row written straight to D1 — what a phone with no code (or anyone at home) files through the board's TapRow. */
function remoteRow(t, { id, spot, kind, value, at, day, pid }) {
  t.env.AUTH_DB.db.prepare(`INSERT INTO air_reports (id, spot, kind, value, observed_at, day, slot, pid_hash, ip_hash, byline, onsite, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ip-remote', 'Guest 1234', 0, ?)`).run(id, spot, kind, value, at, day, Math.floor(at / 1_800_000), pid, at);
}

test('boardData: readings, validatorsToday and vibe come off real Field Reports rows, and no hash leaves it', async () => {
  const t = town();
  const now = Date.parse('2026-10-02T14:40:00Z'); // Fri 7:40 AM LA
  await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, now - 5 * MIN);
  await confirm(t, { reportId: (await t.env.AUTH_DB.rows("SELECT id FROM air_reports WHERE spot = 'courts'"))[0].id, verdict: 'still', device: DEV.b, code: CRT }, now - 2 * MIN);
  await report(t, 'courts', { kind: 'parking', value: 'tight', device: DEV.c, code: CRT }, now - 3 * MIN);
  await t.settle();

  const payload = await boardData(t.env, t.env.AUTH_DB, now, COURTS, config);
  assert.ok(Array.isArray(payload.courts));
  assert.equal(payload.courts.length, 11, 'every listed court, air or not');
  const courts = payload.courts.find((c) => c.id === 'courts');
  assert.equal(courts.readings.wait.value, '1-4');
  assert.equal(courts.readings.wait.status, 'agree');
  assert.equal(courts.readings.wait.support, 2);
  assert.equal(courts.readings.parking.value, 'tight');
  assert.equal(courts.readings.parking.crew, null, 'parking never carries a crew, even with a live one forming on wait');
  assert.equal(payload.validatorsToday.phones, 3, 'a, b and c all reported or confirmed on site today');
  assert.equal(payload.validatorsToday.courts, 1);
  assert.deepEqual(payload.conditions, { observedAt: null, wind: null, tempF: null, heat: null, wet: null, marine: null, sunset: null, next3h: null }, 'no readConditions passed: EMPTY_CONDITIONS');
  assert.ok(payload.best);
  assert.equal(payload.best.court, 'courts', 'the live 1-4 reading is the bet');

  const kelly = payload.courts.find((c) => c.id === 'kelly');
  assert.equal(kelly.status, 'closed');
  assert.deepEqual(kelly.readings, { wait: null, parking: null }, 'a listing with no air spot has no readings');

  const text = JSON.stringify(payload);
  assert.doesNotMatch(text, /pid_hash|ip_hash/);
  for (const d of Object.values(DEV)) assert.ok(!text.includes(await pidHash(d)), 'a phone hash leaked');
});

/** A beach agent fact row, written straight to D1 (what agentRowOf()'s row would INSERT as). */
function agentFactRow(t, { id, kind, value, extras, at, day }) {
  t.env.AUTH_DB.db.prepare(`INSERT INTO air_reports
      (id, spot, kind, value, extras_json, schema_v, observed_at, day, slot, pid_hash, ip_hash, byline, onsite, status, source, source_url, created_at)
    VALUES (?, 'beach', ?, ?, ?, 2, ?, ?, ?, 'agentpid00000000', 'agentip00000000', 'Sol', 0, 'ok', 'agent:sol', 'https://www.ndbc.noaa.gov/data/realtime2/46221.txt', ?)`)
    .run(id, kind, value, JSON.stringify(extras), at, day, Math.floor(at / 1_800_000), at);
}

/** An agent's desk-kind belief row plus its open air_calls row, as an ask would leave them. */
function callFixture(t, { id, spot, kind, value, at, day, expiresAt }) {
  t.env.AUTH_DB.db.prepare(`INSERT INTO air_reports
      (id, spot, kind, value, extras_json, schema_v, observed_at, day, slot, pid_hash, ip_hash, byline, onsite, status, source, source_url, created_at)
    VALUES (?, ?, ?, ?, '[]', 1, ?, ?, ?, 'agentpid00000001', 'agentip00000001', 'Sol', 0, 'ok', 'agent:sol', 'https://citymb.info', ?)`)
    .run(`${id}_r`, spot, kind, value, at, day, Math.floor(at / 1_800_000), at);
  t.env.AUTH_DB.db.prepare(`INSERT INTO air_calls (id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at)
    VALUES (?, ?, ?, 'sol', 'sol', ?, ?, 'open', ?, ?)`).run(id, spot, kind, `${id}_r`, day, at, expiresAt);
}

test('boardData: the Desk — a beach agent fact fills BoardPayload.desk (sky stays out) and a court\'s live call fills its card', async () => {
  const t = town();
  const now = Date.parse('2026-10-02T14:40:00Z'); // Fri 7:40 AM LA
  const today = '2026-10-02';
  agentFactRow(t, { id: 'ar_swell00000000000001', kind: 'swell', value: '2-3', extras: { ft: 2.4, periodS: 13, dirDeg: 210, waterF: 64, obsAt: '2026-10-02T14:00:00Z' }, at: now - 10 * MIN, day: today });
  callFixture(t, { id: 'ac_lights0000000000001', spot: 'el-segundo', kind: 'lights', value: 'lights', at: now - MIN, day: today, expiresAt: now + 47 * 60 * MIN });

  const payload = await boardData(t.env, t.env.AUTH_DB, now, COURTS, config);
  assert.equal(payload.desk.swell.value, '2-3');
  assert.equal(payload.desk.swell.agent, 'sol');
  assert.equal(payload.desk.tides, null, 'no tides row filed');
  assert.ok(!('sky' in payload.desk), 'sky/fog is not on the board — Conditions is the live-KLAX line');

  const es = payload.courts.find((c) => c.id === 'el-segundo');
  assert.ok(es.call);
  assert.equal(es.call.agent, 'sol');
  assert.equal(es.call.belief.value, 'lights');
  assert.equal(es.call.sourceHost, 'citymb.info');
  const courts = payload.courts.find((c) => c.id === 'courts');
  assert.equal(courts.call, null, 'no call on a spot with none open');

  const text = JSON.stringify(payload);
  assert.doesNotMatch(text, /pid_hash|ip_hash|agentpid|agentip/, 'no hash leaves the Desk view either');
});

test('boardData: an expired call never fills a court\'s card', async () => {
  const t = town();
  const now = Date.parse('2026-10-02T14:40:00Z');
  const today = '2026-10-02';
  callFixture(t, { id: 'ac_signs0000000000001', spot: 'courts', kind: 'sign', value: 'weekends', at: now - 50 * HOUR, day: today, expiresAt: now - 2 * HOUR });
  const payload = await boardData(t.env, t.env.AUTH_DB, now, COURTS, config);
  assert.equal(payload.courts.find((c) => c.id === 'courts').call, null);
});

test('boardData: the injected readConditions is called with a Date and folds straight into the payload', async () => {
  const t = town();
  const now = Date.parse('2026-10-02T14:40:00Z');
  const conditions = { observedAt: '2026-10-02T14:00:00Z', wind: { mph: 6, gustMph: null, dir: 220, words: null }, tempF: 68, heat: null, wet: null, marine: null, sunset: null, next3h: null };
  let calledWith = null;
  const payload = await boardData(t.env, t.env.AUTH_DB, now, COURTS, config, async (arg) => { calledWith = arg; return conditions; });
  assert.ok(calledWith instanceof Date, 'readConditions takes a Date, matching court-conditions.ts');
  assert.equal(calledWith.getTime(), now);
  assert.deepEqual(payload.conditions, conditions);
});

test('boardData: throws on a DB failure, the way every other /api/air store call does — the route answers 503', async () => {
  const brokenDb = { batch: async () => { throw new Error('D1 is down'); } };
  await assert.rejects(() => boardData({ AUTH_DB: brokenDb }, brokenDb, Date.now(), COURTS, config));
});

/* ---------- routes as source text: functions/api/air/board.ts, functions/courts.json.ts ---------- */

test('boardData: validatorsToday counts the board\'s courts only — an on-site fog report at the beach is not a pickleball validator', async () => {
  const t = town();
  const now = Date.parse('2026-10-02T14:40:00Z'); // Fri 7:40 AM LA, inside the beach's hours
  const BEACH = 'BEACHFIX9';
  t.env.AUTH_DB.db.prepare("INSERT INTO air_codes (spot, code_hash, valid_from, valid_to) VALUES (?, ?, '2026-09-01', '2026-12-31')").run('beach', await codeHash('beach', BEACH, PEPPER));
  const filed = await report(t, 'beach', { kind: 'fog', value: 'hazy', device: DEV.a, code: BEACH }, now - 5 * MIN);
  assert.equal(filed.body.report.onsite, true, 'the fixture really is an on-site beach report');
  await t.settle();
  const payload = await boardData(t.env, t.env.AUTH_DB, now, COURTS, config);
  assert.deepEqual(payload.validatorsToday, { phones: 0, courts: 0 });
  assert.ok(payload.courts.every((c) => !c.readings.wait && !c.readings.parking));
});

test('boardData: remote taps never push today\'s on-site last report out ("Last report 4:10 PM: tight" survives five taps from home)', async () => {
  const t = town();
  const now = Date.parse('2026-10-02T23:30:00Z'); // Fri 4:30 PM LA
  await report(t, 'el-segundo', { kind: 'parking', value: 'tight', device: DEV.a, code: ES }, now - 75 * MIN); // on site, since expired (60 min decay)
  for (let i = 0; i < 5; i++) remoteRow(t, { id: `ar_remote${String(i).padStart(12, '0')}`, spot: 'el-segundo', kind: 'parking', value: 'full', at: now - (70 - i) * MIN, day: '2026-10-02', pid: `remote${i}` });
  await t.settle();
  const es = (await boardData(t.env, t.env.AUTH_DB, now, COURTS, config)).courts.find((c) => c.id === 'el-segundo');
  assert.equal(es.readings.parking, null, 'the on-site reading has decayed and the remote rows are never a reading');
  assert.equal(es.last.parking?.value, 'tight');
});

test('boardData: a flood of 500 remote vibe rows cannot freeze the vibe line — the newest on-site ratings still count', async () => {
  const t = town();
  const now = Date.parse('2026-10-02T23:30:00Z');
  for (let i = 0; i < 500; i++) remoteRow(t, { id: `ar_flood${String(i).padStart(12, '0')}`, spot: 'el-segundo', kind: 'vibe', value: 'condemned', at: now - 3 * 60 * MIN + i * 10_000, day: '2026-10-02', pid: `flood${i}` });
  for (const [i, d] of ['a', 'b', 'c', 'd'].entries()) {
    const filed = await report(t, 'el-segundo', { kind: 'vibe', value: 'solid', device: DEV[d], code: ES }, now - (10 - i) * MIN);
    assert.equal(filed.body.report.onsite, true);
  }
  await t.settle();
  const es = (await boardData(t.env, t.env.AUTH_DB, now, COURTS, config)).courts.find((c) => c.id === 'el-segundo');
  assert.ok(es.vibe, 'the on-site ratings make a line');
  assert.equal(es.vibe.mode, 'solid');
  assert.equal(es.vibe.n, 4, 'remote ratings never count');
});

test('GET /api/air/board: caches at the edge, 30s public, and fails closed to 503 without D1', async () => {
  const src = await read('functions/api/air/board.ts');
  assert.match(src, /if \(!env\.AUTH_DB\) return unavailable\(\);/);
  assert.match(src, /caches\.default/);
  assert.match(src, /cache\.match\(cacheKey\)/);
  assert.match(src, /'Cache-Control': 'public, max-age=30'/);
  assert.match(src, /catch \{\s*return unavailable\(\);/);
  assert.doesNotMatch(src, /pid_hash|ip_hash/);
});

test('GET /courts.json: open CORS, cached, sourced facts only, and never a hash', async () => {
  const src = await read('functions/courts.json.ts');
  assert.match(src, /'Access-Control-Allow-Origin': '\*'/);
  assert.match(src, /'Cache-Control': 'public, max-age=30'/);
  assert.match(src, /caches\.default/);
  assert.match(src, /showable\(/, 'unverified facts are filtered before they leave');
  assert.match(src, /function shapeReserve\(r: Reserve \| null, now: number\) \{\s*if \(!r\) return null;\s*const \{ show, tag \} = showable\(r, now\)/, 'a reserve link is sourced like a fact: unverified never leaves');
  assert.match(src, /boardData\(env, env\.AUTH_DB, now, COURTS, AIR_CONFIG, sunsetOnly\)/, 'status resolves dusk the way /api/air/board does, without a weather fetch');
  assert.match(src, /export const onRequestHead/);
  assert.doesNotMatch(src, /pid_hash|ip_hash/);
  // No names in the open feed: readings go through publicReading() (tested in court-board.test.mjs), never passed through.
  assert.doesNotMatch(src, /readings: c\.readings\b/);
  assert.match(src, /publicReading\(c\.readings\.wait\)/);
  assert.match(src, /publicReading\(c\.readings\.parking\)/);
  // functions/courts.json.ts, not src/pages/courts.json.ts.
  await assert.rejects(read('src/pages/courts.json.ts'));
});

test('source contract: air-board-store.ts uses only literal prepared statements with bound values, one db.batch', async () => {
  const src = await read('functions/_lib/air-board-store.ts');
  const prepares = src.split('.prepare(').length - 1;
  const bound = [...src.matchAll(/\.prepare\(\s*(`[^`]*`|'[^']*'|"[^"]*")\s*\)\s*\.bind\(/g)];
  assert.equal(bound.length, prepares, 'every .prepare( takes a literal and is followed by .bind(');
  for (const [, sql] of bound) assert.ok(!sql.includes('${'), `no interpolated SQL: ${sql.slice(0, 60)}`);
  assert.doesNotMatch(src, /\.exec\(/);
  assert.match(src, /await db\.batch\(stmts\)/, 'one batch call');
  assert.equal(src.match(/await db\.batch\(/g)?.length, 1, 'only one db.batch in the whole file');
});
