import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import { codeHash, kindOf, kindRole, parseAirReport, parseConfirm, pidHash } from '../functions/_lib/air-kinds.mjs';
import { POINTS, reportAwards, weeklyRef } from '../functions/_lib/air-points.mjs';
import { weekOf } from '../functions/_lib/air-reading.mjs';
import { confirmReport, fileReport, withBylines } from '../functions/_lib/air-store.ts';

// The Pickleball Board, group F (build spec §5, §11): role gates only. A
// 'side' kind (parking) files, pays and takes confirms but never goes on the
// air; a 'rating' (vibe) pays once a week and refuses confirms. The Friday
// flow itself is covered, unchanged, by tests/air-api.test.mjs.
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const MIN = 60_000;
const DEV = {
  a: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', b: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', c: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  d: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
};
const PEPPER = 'test-pepper';
// Fixture codes, seeded only in this test DB under a test pepper.
const CODES = { courts: 'CRTFIXTURE9', 'el-segundo': 'ESFIXTURE9' };
const MIGRATIONS = (await Promise.all(['0001_init.sql', '0023_air.sql'].map((f) => read(`migrations/auth/${f}`)))).join('\n');
const SEED = await Promise.all(Object.entries(CODES).map(async ([spot, code]) => [spot, await codeHash(spot, code, PEPPER)]));

/* ---------- pure ---------- */

test('kindRole: absent is live, the three roles pass through, anything else fails closed to side', () => {
  assert.equal(kindRole({}), 'live');
  assert.equal(kindRole(null), 'live');
  assert.equal(kindRole({ role: 'live' }), 'live');
  assert.equal(kindRole({ role: 'side' }), 'side');
  assert.equal(kindRole({ role: 'rating' }), 'rating');
  assert.equal(kindRole({ role: 'LIVE' }), 'side');
  assert.equal(kindRole(kindOf(config, 'courts', 'parking')), 'side');
  assert.equal(kindRole(kindOf(config, 'courts', 'vibe')), 'rating');
});

test('reportAwards: units from the kind, "cant" still pays 1, payEvery week keys the ref by LA Monday-week', () => {
  const T = Date.parse('2026-09-28T17:00:00Z'); // Mon 10:00 AM
  const base = { spot: 'courts', kind: 'parking', value: 'tight', onsite: true, observedAt: T, decayMin: 60 };
  assert.deepEqual(reportAwards({ ...base, units: 3 }), [{ action: 'report', ref: 'courts:parking:2026-09-28:10', units: 3, day: '2026-09-28' }]);
  assert.deepEqual(reportAwards({ ...base, value: 'cant', units: 3 }), [{ action: 'cant', ref: 'courts:parking:2026-09-28:10', units: POINTS.cant, day: '2026-09-28' }]);
  assert.equal(reportAwards(base)[0].units, 6, 'no units: the report price');
  assert.equal(reportAwards({ ...base, units: 2.5 })[0].units, 6, 'a bad units value never pays a fraction');
  const vibe = (iso) => reportAwards({ spot: 'courts', kind: 'vibe', value: 'solid', onsite: true, observedAt: Date.parse(iso), decayMin: 43200, units: 2, payEvery: 'week' });
  const mon = vibe('2026-09-28T17:00:00Z');
  assert.deepEqual(mon, [{ action: 'report', ref: `courts:vibe:w${weekOf('2026-09-28')}`, units: 2, day: '2026-09-28' }]);
  assert.equal(vibe('2026-10-04T23:00:00Z')[0].ref, mon[0].ref, 'Sun 4 PM is the same week');
  assert.equal(vibe('2026-10-05T06:59:00Z')[0].ref, mon[0].ref, 'Sun 11:59 PM LA is still the same week');
  assert.notEqual(vibe('2026-10-05T07:00:00Z')[0].ref, mon[0].ref, 'Mon 12:00 AM LA starts the next');
  assert.equal(weeklyRef('courts', 'vibe', '2026-09-28'), mon[0].ref);
  assert.deepEqual(reportAwards({ spot: 'courts', kind: 'vibe', value: 'solid', onsite: false, observedAt: Date.parse('2026-09-28T17:00:00Z'), decayMin: 43200, units: 2, payEvery: 'week' }), [], 'remote pays nothing');
});

/* ---------- the store on node:sqlite ---------- */

/** D1 over node:sqlite (as in tests/air-api.test.mjs): reads hand back rows, a batch is one transaction. */
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
  const bursts = [];
  const env = {
    AUTH_DB: new SqliteD1(),
    VISITS: new Store(),
    AIR_CODE_PEPPER: PEPPER,
    PRESENCE: { idFromName: (n) => n, get: () => ({ fetch: async (r) => { bursts.push(await r.json()); return new Response('{}'); } }) },
  };
  const later = [];
  return { env, bursts, defer: (p) => later.push(p), settle: () => Promise.all(later.splice(0)) };
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
const count = (db, sql, ...args) => db.rows(sql, ...args)[0].n;

test('parking at 06:05: files and pays 3, but no First Light, no broadcast, no VISITS write and no crew', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  const at = (hhmm) => Date.parse(`2026-10-02T${String(Number(hhmm.slice(0, 2)) + 7).padStart(2, '0')}:${hhmm.slice(3)}:00Z`); // PDT
  const code = CODES.courts;
  const first = await report(t, 'courts', { kind: 'parking', value: 'tight', device: DEV.a, code }, at('06:05'));
  assert.equal(first.status, 201);
  assert.equal(first.body.report.onsite, true);
  assert.equal(first.body.report.label, 'Parking tight');
  assert.equal(first.body.award.points, 3, 'parking pays its own 3');
  assert.equal(first.body.award.firstLight, false, 'inside the courts\' hours, still no First Light');
  assert.deepEqual(first.body.award.badges, []);
  assert.deepEqual(first.body.award.stamps.map((s) => s.kind), ['place']);
  // Three phones on three networks inside 30 minutes: a crew for a live kind, nothing for parking.
  await report(t, 'courts', { kind: 'parking', value: 'tight', device: DEV.b, code }, at('06:08'));
  const third = await report(t, 'courts', { kind: 'parking', value: 'tight', device: DEV.c, code }, at('06:10'));
  assert.equal(third.body.award.crew, null);
  assert.equal(third.body.reading.support, 3, 'parking still has a reading');
  assert.equal(third.body.reading.crew, null);
  const cant = await report(t, 'courts', { kind: 'parking', value: 'cant', device: DEV.d, code }, at('06:12'));
  assert.equal(cant.body.award.points, 1, '"can\'t say" still pays 1');
  await t.settle();
  assert.equal(count(db, 'SELECT COUNT(*) AS n FROM air_firsts'), 0);
  assert.equal(count(db, 'SELECT COUNT(*) AS n FROM air_broadcasts'), 0);
  assert.equal(count(db, 'SELECT COUNT(*) AS n FROM air_crews'), 0);
  assert.equal(count(db, "SELECT COUNT(*) AS n FROM air_stamps WHERE kind = 'crew' OR ref IN ('first-light', 'morning-crew')"), 0);
  assert.equal(t.env.VISITS.writes.length, 0, 'no station post');
  assert.equal(t.bursts.length, 0, 'nothing on the bus');

  // A confirm on a side kind pays on site, but still never goes on the air.
  const yes = await confirm(t, { reportId: first.body.report.id, verdict: 'still', device: DEV.d, code }, at('06:14'));
  assert.equal(yes.status, 200);
  assert.equal(yes.body.onsite, true);
  assert.equal(yes.body.award.points, 3);
  assert.equal(yes.body.award.crew, null);
  await t.settle();
  assert.equal(t.env.VISITS.writes.length, 0);
  assert.equal(count(db, 'SELECT COUNT(*) AS n FROM air_crews'), 0);

  // First Light is still there for the first real wait answer.
  const wait = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code }, at('06:20'));
  assert.equal(wait.body.award.firstLight, true, 'parking never took the day');
  assert.equal(wait.body.award.points, 10);
  await t.settle();
  assert.equal(t.env.VISITS.writes.length, 1, 'the wait report goes on the air as before');
});

test('vibe: 2 points once per spot per LA week, however often you rate; a vibe confirm is 400', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  const code = CODES['el-segundo'];
  const mon = Date.parse('2026-09-28T16:00:00Z'); // Mon 9:00 AM
  const rate = (value, now, extras = []) => report(t, 'el-segundo', { kind: 'vibe', value, device: DEV.a, code, extras }, now);
  const first = await rate('solid', mon, ['lights-out', 'no-shade']);
  assert.equal(first.status, 201);
  assert.equal(first.body.award.points, 2);
  assert.equal(first.body.award.firstLight, false, 'El Segundo is open from 08:00; a rating still never opens the day');
  const wed = await rate('character', mon + 2 * 24 * 60 * MIN);
  assert.equal(wed.status, 201, 'a new rating files');
  assert.equal(wed.body.award.points, 0, 'the week already paid');
  const nextMon = await rate('pancake', mon + 7 * 24 * 60 * MIN);
  assert.equal(nextMon.body.award.points, 2, 'a new week pays again');
  const refs = db.rows("SELECT ref, units FROM air_points WHERE action = 'report' ORDER BY created_at");
  assert.deepEqual(refs, [
    { ref: `el-segundo:vibe:w${weekOf('2026-09-28')}`, units: 2 },
    { ref: `el-segundo:vibe:w${weekOf('2026-10-05')}`, units: 2 },
  ]);
  const beforeConfirms = count(db, 'SELECT COUNT(*) AS n FROM air_confirms');
  const no = await confirm(t, { reportId: first.body.report.id, verdict: 'still', device: DEV.b, code }, mon + 5 * MIN);
  assert.equal(no.status, 400);
  assert.deepEqual(no.body, { ok: false, reason: 'not-confirmable' });
  assert.equal(count(db, 'SELECT COUNT(*) AS n FROM air_confirms'), beforeConfirms, 'nothing written');
  await t.settle();
  assert.equal(count(db, 'SELECT COUNT(*) AS n FROM air_firsts'), 0);
  assert.equal(count(db, 'SELECT COUNT(*) AS n FROM air_broadcasts'), 0);
  assert.equal(t.env.VISITS.writes.length, 0);
  // Parking and vibe share the daily cap of 30 with everything else.
  assert.equal(count(db, "SELECT SUM(units) AS n FROM air_points WHERE day = '2026-09-28'"), 2);
});

test('a new spot without verified hours never counts First Light for its wait question', async () => {
  const t = town();
  // Perry Park: no code seeded, so every report files from away; seed one here.
  t.env.AUTH_DB.db.prepare("INSERT INTO air_codes (spot, code_hash, valid_from, valid_to) VALUES ('perry', ?, '2026-09-01', '2026-12-31')").run(await codeHash('perry', 'PERRYFIX9', PEPPER));
  const r = await report(t, 'perry', { kind: 'wait', value: 'taken', device: DEV.a, code: 'PERRYFIX9' }, Date.parse('2026-10-02T17:00:00Z'));
  assert.equal(r.body.report.onsite, true);
  assert.equal(r.body.report.label, 'Another sport on it');
  assert.equal(r.body.award.firstLight, false);
  assert.equal(r.body.award.points, 6);
  await t.settle();
  assert.equal(t.env.VISITS.writes.length, 1, 'a live kind still posts; only First Light needs hours');
});

test('withBylines is exported for the board and fills a signed-in confirmer\'s card byline', async () => {
  const t = town();
  await t.env.VISITS.put('card:v1:user:u_jen', JSON.stringify({ handle: 'jen', name: 'jen', noun: 7 }));
  const rows = [{ report_id: 'ar_1', pid_hash: await pidHash(DEV.b), ip_hash: 'x', user_id: 'u_jen', verdict: 'still', value: '0', onsite: 1, at: 1 }, { report_id: 'ar_1', pid_hash: 'p', ip_hash: 'x', user_id: null, verdict: 'still', value: '0', onsite: 1, at: 2 }];
  const out = await withBylines(t.env, rows);
  assert.equal(out[0].byline, '@jen');
  assert.equal(out[1].byline, undefined, 'a guest keeps the guest byline reading() gives it');
});

test('source contract: the store gates First Light and the dial on the role; the client reads a stored code without ?c=', async () => {
  const store = await read('functions/_lib/air-store.ts');
  assert.match(store, /if \(live && firstLightOpen\(/);
  assert.match(store, /const air = live && isOnsite && upsert \? await onAir\(/);
  assert.match(store, /if \(role === 'rating'\) return fail\('not-confirmable'\);/);
  assert.match(store, /const air = role === 'live' && onsite && c\.verdict === 'still' \? await onAir\(/);
  assert.match(store, /units: cfg\.points \?\? 6, payEvery: cfg\.payEvery \?\? null/);
  assert.match(store, /export async function withBylines\(/);
  const client = await read('src/scripts/air-client.ts');
  const start = client.indexOf('export function storedCode(spot: string): string | null {');
  assert.ok(start > 0, 'storedCode is exported');
  const body = client.slice(start, client.indexOf('\n}\n', start));
  assert.match(body, /lsGet\(KEYS\.code \+ spot\)/);
  assert.match(body, /CODE_TTL_MS/);
  assert.doesNotMatch(body, /location|URLSearchParams|lsSet|lsDel|codeFor/, 'never reads ?c=, never writes');
});
