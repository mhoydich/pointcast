import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import { codeHash, parseAirReport, parseConfirm } from '../functions/_lib/air-kinds.mjs';
import { AGENT_ROW_COLUMNS, agentIpHash, agentPidHash, agentRowOf } from '../functions/_lib/air-desk.mjs';
import { laDate } from '../functions/_lib/air-reading.mjs';
import { confirmReport, fileReport, spotPayload, targetOf } from '../functions/_lib/air-store.ts';
import { agentPayload, askCall, deskPayload, isResident, passCall } from '../functions/_lib/air-desk-store.ts';

// Early Shift + the Desk, group M (docs/plans/2026-09-28-early-shift-desk-spec.md
// §4-5): the resident gate, desk_ask/desk_pass's one-batch caps and expiry
// sweep, the no-open-call gate and answerCall's judge wired into fileReport,
// fact kinds refusing a person's confirm, and the two read payloads — against
// the real config (src/data/air-spots.json), like every other air-*-api
// test. functions/api/air/desk.ts and functions/api/mcp.ts's desk_* tools
// carry no logic of their own (a source-contract check below); they call the
// same askCall/passCall/deskPayload/agentPayload exercised here.

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const MIN = 60_000;
const HOUR = 60 * MIN;
const DEV = {
  a: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', b: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
};
const PEPPER = 'test-pepper';
const CRT = 'CRTFIXTURE9';
const BCH = 'BCHFIXTURE9';
const MHT = 'MHTFIXTURE9';
const SIGN_URL = 'https://www.citymb.info/departments/parks-and-recreation/tennis';
const T0 = Date.parse('2026-10-02T14:36:00Z'); // Fri 7:36 AM in El Segundo

const MIGRATIONS = (await Promise.all(['0001_init.sql', '0023_air.sql', '0024_air_assignments.sql', '0025_air_desk.sql'].map((f) => read(`migrations/auth/${f}`)))).join('\n');
// Fixture codes, precomputed once (codeHash is async; the D1 fake's constructor below is not).
const SEED = [['courts', await codeHash('courts', CRT, PEPPER)], ['beach', await codeHash('beach', BCH, PEPPER)], ['manhattan-heights', await codeHash('manhattan-heights', MHT, PEPPER)]];

/** D1 over node:sqlite, exactly as tests/air-api.test.mjs's fake: reads (SELECT/RETURNING) hand back rows, a batch is one transaction. */
class SqliteD1 {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec(MIGRATIONS);
    const code = this.db.prepare("INSERT INTO air_codes (spot, code_hash, valid_from, valid_to) VALUES (?, ?, '2026-09-28', '2026-12-31')");
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

function deskTown() {
  return { env: { AUTH_DB: new SqliteD1(), AIR_CODE_PEPPER: PEPPER }, defer: (p) => Promise.resolve(p) };
}
const req = (path, ip = '192.0.2.10') => new Request(`https://pointcast.xyz/api/air/${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://pointcast.xyz', 'CF-Connecting-IP': ip },
});
async function report(t, spot, body, now) {
  const p = parseAirReport(config, spot, body, now);
  if (p.reason) return { status: 400, body: { ok: false, reason: p.reason } };
  const res = await fileReport(req(spot, `192.0.2.${body.device.charCodeAt(0)}`), t.env, t.env.AUTH_DB, config, p, now, t.defer);
  return { status: res.status, body: await res.json() };
}
async function confirm(t, body, now) {
  const c = parseConfirm(body);
  assert.ok(!c.reason, c.reason);
  const res = await confirmReport(req('confirm', `192.0.2.${body.device.charCodeAt(0)}`), t.env, t.env.AUTH_DB, config, c, now, t.defer);
  return { status: res.status, body: await res.json() };
}
const reqDesk = (key) => new Request('https://pointcast.xyz/api/air/desk', { method: 'POST', headers: key ? { 'X-Yard-Resident': key } : {} });
const okFetch = async () => new Response('ok', { status: 200 });
const deadFetch = async () => new Response('nope', { status: 500 });
/** Every ask/pass in these tests uses the same resident key, 'k'; the resident-gate test below is the one that varies it. */
const ask = (db, body, now, fetcher = okFetch) => askCall(reqDesk('k'), { AUTH_DB: db, YARD_RESIDENT_KEY: 'k' }, db, config, body, now, fetcher);
const pass = (db, body, now) => passCall(reqDesk('k'), { AUTH_DB: db, YARD_RESIDENT_KEY: 'k' }, db, config, body, now);
const noHashes = async (value) => {
  const text = JSON.stringify(value);
  assert.doesNotMatch(text, /pid_hash|ip_hash/);
  for (const call of ['sol', 'frog', 'cc', 'terra', 'luna', 'manus']) assert.ok(!text.includes(await agentPidHash(call)), `${call}'s pid hash leaked`);
  assert.ok(!text.includes(await agentIpHash()));
};

/* ---------- the resident gate ---------- */

test('isResident: false with no key set, false with the wrong key, true with the right one', async () => {
  const noKeyEnv = {};
  assert.equal(await isResident(new Request('https://pointcast.xyz/', { headers: { 'X-Yard-Resident': 'k' } }), noKeyEnv), false);
  const env = { YARD_RESIDENT_KEY: 'the-key' };
  assert.equal(await isResident(new Request('https://pointcast.xyz/'), env), false, 'no header');
  assert.equal(await isResident(new Request('https://pointcast.xyz/', { headers: { 'X-Yard-Resident': 'wrong' } }), env), false);
  assert.equal(await isResident(new Request('https://pointcast.xyz/', { headers: { 'X-Yard-Resident': 'the-key' } }), env), true);
});

test('desk_ask/desk_pass: 503 with the key unset, 403 with the wrong key, 201/200 with the right one', async () => {
  const db = new SqliteD1();
  const body = { action: 'ask', agent: 'sol', spot: 'manhattan-heights', kind: 'closes', belief: '20:00', sourceUrl: SIGN_URL };
  const noKey = await askCall(reqDesk(), { AUTH_DB: db }, db, config, body, T0, okFetch);
  assert.equal(noKey.status, 503);
  assert.equal((await noKey.json()).reason, 'resident-key-unset');

  const env = { AUTH_DB: db, YARD_RESIDENT_KEY: 'letmein' };
  const wrong = await askCall(reqDesk('nope'), env, db, config, body, T0, okFetch);
  assert.equal(wrong.status, 403);
  assert.equal((await wrong.json()).reason, 'not-a-resident');

  const ok = await askCall(reqDesk('letmein'), env, db, config, body, T0, okFetch);
  assert.equal(ok.status, 201);
  const okBody = await ok.json();
  assert.deepEqual([okBody.call.spot, okBody.call.kind, okBody.call.agent, okBody.call.belief.value, okBody.call.status],
    ['manhattan-heights', 'closes', 'sol', '20:00', 'open']);
  await noHashes(okBody);

  const passNoKey = await passCall(reqDesk(), { AUTH_DB: db }, db, config, { action: 'pass', agent: 'sol', callId: okBody.call.id, to: 'frog', reason: 'off-shift' }, T0 + MIN);
  assert.equal(passNoKey.status, 503);
  const passWrong = await passCall(reqDesk('nope'), env, db, config, { action: 'pass', agent: 'sol', callId: okBody.call.id, to: 'frog', reason: 'off-shift' }, T0 + MIN);
  assert.equal(passWrong.status, 403);
});

/* ---------- caps and the expiry sweep ---------- */

test('spot-busy refuses a second live ask on the same spot; the expiry sweep frees it once the window has passed', async () => {
  const db = new SqliteD1();
  const body = { action: 'ask', agent: 'sol', spot: 'courts', kind: 'sign', belief: 'weekends', sourceUrl: SIGN_URL };
  const first = await ask(db, body, T0);
  assert.equal(first.status, 201);
  const again = await ask(db, { ...body, agent: 'frog' }, T0 + MIN);
  assert.equal(again.status, 409);
  assert.equal((await again.json()).reason, 'spot-busy');
  // 49 hours later (past the 48-hour window) the very next ask's own sweep clears the slot.
  const later = await ask(db, { ...body, agent: 'frog' }, T0 + 49 * HOUR);
  assert.equal(later.status, 201);
  assert.equal(db.rows("SELECT status FROM air_calls WHERE asker = 'sol'")[0].status, 'expired');
});

test('daily-cap refuses a 6th ask by the same agent on the same LA day, before spot-busy or too-soon are even checked', async () => {
  const db = new SqliteD1();
  const day = laDate(T0);
  const seedReport = db.db.prepare(`INSERT INTO air_reports (id, spot, kind, value, extras_json, schema_v, observed_at, day, slot, pid_hash, ip_hash, byline, onsite, geo, status, source, source_url, created_at)
    VALUES (?, 'courts', 'sign', 'weekends', '[]', 1, ?, ?, 0, ?, 'y', 'Sol', 0, 0, 'ok', 'agent:sol', ?, ?)`);
  const seedCall = db.db.prepare(`INSERT INTO air_calls (id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at, answered_report_id, answered_at, relay_json)
    VALUES (?, 'courts', 'sign', 'sol', 'sol', ?, ?, 'answered', ?, ?, ?, ?, '[]')`);
  for (let i = 0; i < 5; i++) {
    const rid = `ar_seed${i}`;
    // Distinct pid_hash per row: air_reports_once (spot, kind, pid_hash, slot)
    // is unique, and every seed shares one 30-minute slot.
    seedReport.run(rid, T0 - i * MIN, day, `pid${i}`, SIGN_URL, T0 - i * MIN);
    seedCall.run(`ac_seed${i}`, rid, day, T0 - i * MIN, T0 + 47 * HOUR - i * MIN, rid, T0 - i * MIN);
  }
  // A fresh spot the agent has never touched today: only the daily count refuses it.
  const body = { action: 'ask', agent: 'sol', spot: 'el-segundo', kind: 'lights', belief: 'lights', sourceUrl: SIGN_URL };
  const res = await ask(db, body, T0);
  assert.equal(res.status, 429);
  assert.equal((await res.json()).reason, 'daily-cap');
  assert.equal(db.rows("SELECT COUNT(*) AS n FROM air_calls WHERE spot = 'el-segundo'")[0].n, 0, 'never inserted');
});

test('too-soon refuses an ask once an on-site person answered this spot+kind within its decay; "cant" never counts as an answer', async () => {
  const db = new SqliteD1();
  db.db.prepare(`INSERT INTO air_reports (id, spot, kind, value, observed_at, day, slot, pid_hash, ip_hash, byline, onsite, status, created_at)
    VALUES ('ar_person', 'manhattan-heights', 'closes', '20:00', ?, ?, 0, 'x', 'y', 'Guest', 1, 'ok', ?)`).run(T0 - HOUR, laDate(T0), T0 - HOUR);
  const body = { action: 'ask', agent: 'sol', spot: 'manhattan-heights', kind: 'closes', belief: '21:00', sourceUrl: SIGN_URL };
  const res = await ask(db, body, T0);
  assert.equal(res.status, 409);
  assert.equal((await res.json()).reason, 'too-soon');
  db.db.prepare("UPDATE air_reports SET value = 'cant' WHERE id = 'ar_person'").run();
  const stillOk = await ask(db, body, T0);
  assert.equal(stillOk.status, 201);
});

/* ---------- key-bearing and unresolved source URLs ---------- */

test('a source URL carrying a key-shaped parameter, or one that never resolves, is refused before any write', async () => {
  const db = new SqliteD1();
  const keyed = await ask(db, { action: 'ask', agent: 'sol', spot: 'courts', kind: 'sign', belief: 'weekends', sourceUrl: `${SIGN_URL}?api_key=abc123` }, T0);
  assert.equal(keyed.status, 400);
  assert.equal((await keyed.json()).reason, 'bad-source-url');
  const dead = await ask(db, { action: 'ask', agent: 'sol', spot: 'courts', kind: 'sign', belief: 'weekends', sourceUrl: SIGN_URL }, T0, deadFetch);
  assert.equal(dead.status, 400);
  assert.equal((await dead.json()).reason, 'source-unresolved');
  assert.equal(db.rows('SELECT COUNT(*) AS n FROM air_calls')[0].n, 0, 'neither wrote anything');
});

/* ---------- passing a call ---------- */

test('desk_pass: relays between agents, refuses a non-holder, and stops at the pass cap', async () => {
  const db = new SqliteD1();
  const asked = await ask(db, { action: 'ask', agent: 'sol', spot: 'courts', kind: 'sign', belief: 'weekends', sourceUrl: SIGN_URL }, T0);
  const callId = (await asked.json()).call.id;

  const notHolder = await pass(db, { action: 'pass', agent: 'frog', callId, to: 'terra', reason: 'keeper' }, T0 + MIN);
  assert.equal(notHolder.status, 403);
  assert.equal((await notHolder.json()).reason, 'not-holder');

  const pass1 = await pass(db, { action: 'pass', agent: 'sol', callId, to: 'frog', reason: 'off-shift' }, T0 + MIN);
  assert.equal(pass1.status, 200);
  assert.equal((await pass1.json()).call.agent, 'frog');
  await pass(db, { action: 'pass', agent: 'frog', callId, to: 'terra', reason: 'better-source' }, T0 + 2 * MIN);
  await pass(db, { action: 'pass', agent: 'terra', callId, to: 'luna', reason: 'keeper' }, T0 + 3 * MIN);
  const capped = await pass(db, { action: 'pass', agent: 'luna', callId, to: 'manus', reason: 'keeper' }, T0 + 4 * MIN);
  assert.equal(capped.status, 409);
  assert.equal((await capped.json()).reason, 'pass-cap');
});

/* ---------- the gate and the judge, wired into fileReport ---------- */

test('no-open-call refuses a desk-kind report until a call is live; the answer then judges the asker checked or overruled', async () => {
  const t = deskTown();
  const refused = await report(t, 'courts', { kind: 'sign', value: 'weekends', device: DEV.a, code: CRT }, T0);
  assert.equal(refused.status, 409);
  assert.equal(refused.body.reason, 'no-open-call');

  const asked = await ask(t.env.AUTH_DB, { action: 'ask', agent: 'sol', spot: 'courts', kind: 'sign', belief: 'weekends', sourceUrl: SIGN_URL }, T0);
  assert.equal(asked.status, 201);
  const askedId = (await asked.json()).call.id;

  const matched = await report(t, 'courts', { kind: 'sign', value: 'weekends', device: DEV.a, code: CRT }, T0 + MIN);
  assert.equal(matched.status, 201);
  assert.deepEqual(matched.body.call, { id: askedId, agent: 'sol', verdict: 'checked' });
  await noHashes(matched.body);

  // courts/sign is answered, not open — but a fresh ask on it is now too-soon (a
  // person just answered), for 30 days. A different desk kind is unaffected.
  const reAsk = await ask(t.env.AUTH_DB, { action: 'ask', agent: 'frog', spot: 'courts', kind: 'sign', belief: 'daily', sourceUrl: SIGN_URL }, T0 + 2 * MIN);
  assert.equal(reAsk.status, 409);
  assert.equal((await reAsk.json()).reason, 'too-soon');

  const asked2 = await ask(t.env.AUTH_DB, { action: 'ask', agent: 'frog', spot: 'manhattan-heights', kind: 'closes', belief: '20:00', sourceUrl: SIGN_URL }, T0 + 2 * MIN);
  assert.equal(asked2.status, 201);
  const differed = await report(t, 'manhattan-heights', { kind: 'closes', value: '21:00', device: DEV.b, code: MHT }, T0 + 3 * MIN);
  assert.equal(differed.body.call.agent, 'frog');
  assert.equal(differed.body.call.verdict, 'overruled');
});

test('an answer observed before the ask files but never closes the call (it could not judge it); the next one does', async () => {
  const t = deskTown();
  const asked = await ask(t.env.AUTH_DB, { action: 'ask', agent: 'sol', spot: 'courts', kind: 'sign', belief: 'weekends', sourceUrl: SIGN_URL }, T0);
  const askedId = (await asked.json()).call.id;
  const early = await report(t, 'courts', { kind: 'sign', value: 'weekends', device: DEV.a, code: CRT, observedAt: T0 - 2 * MIN }, T0 + MIN);
  assert.equal(early.status, 201);
  assert.equal(early.body.call, null);
  assert.equal(t.env.AUTH_DB.rows('SELECT status FROM air_calls WHERE id = ?', askedId)[0].status, 'open');
  const later = await report(t, 'courts', { kind: 'sign', value: 'weekends', device: DEV.b, code: CRT }, T0 + 2 * MIN);
  assert.deepEqual(later.body.call, { id: askedId, agent: 'sol', verdict: 'checked' });
});

test('the beach TODAY list: cc\'s Sky row carries the desk byline and its call sign, a person\'s row none', async () => {
  const t = deskTown();
  const db = t.env.AUTH_DB;
  const filedAt = Date.parse('2026-10-02T13:00:00Z'); // 6:00 AM LA
  const built = await agentRowOf(config, { agent: 'cc', feed: 'sky', detail: { obsAt: '2026-10-02T12:53:00Z', visMi: 10, ceilFt: null, wx: null }, observedAt: Date.parse('2026-10-02T12:53:00Z'), now: filedAt });
  assert.ok(built.row, built.reason);
  db.db.prepare(`INSERT INTO air_reports (${AGENT_ROW_COLUMNS.join(', ')}) VALUES (${AGENT_ROW_COLUMNS.map(() => '?').join(', ')})`).run(...AGENT_ROW_COLUMNS.map((c) => built.row[c]));
  const person = await report(t, 'beach', { kind: 'fog', value: 'hazy', device: DEV.a, code: BCH }, T0);
  const page = await spotPayload(t.env, db, targetOf(config, 'beach'), T0 + MIN);
  const agentToday = page.today.find((r) => r.id === built.row.id);
  assert.deepEqual([agentToday.agent, agentToday.desk], [true, { call: 'cc', byline: 'cc read KLAX at 6:00' }]);
  const personToday = page.today.find((r) => r.id === person.body.report.id);
  assert.deepEqual([personToday.agent, personToday.desk], [false, null]);
  await noHashes(page.today);
});

/* ---------- fact kinds: the early shift's alone ---------- */

test('fact kinds: a person cannot report one (bad-kind) or confirm one (not-confirmable), even when an agent row exists', async () => {
  const t = deskTown();
  const badReport = await report(t, 'beach', { kind: 'tide', value: 'rising', device: DEV.a, code: BCH }, T0);
  assert.equal(badReport.status, 400);
  assert.equal(badReport.body.reason, 'bad-kind');

  const tideId = 'ar_a1a1a1a1a1a1a1a1';
  t.env.AUTH_DB.db.prepare(`INSERT INTO air_reports (id, spot, kind, value, extras_json, schema_v, observed_at, day, slot, pid_hash, ip_hash, byline, onsite, status, source, source_url, created_at)
    VALUES (?, 'beach', 'tide', 'rising', '{"next":[]}', 2, ?, ?, 0, 'p', 'i', 'Sol', 0, 'ok', 'agent:sol', ?, ?)`).run(tideId, T0, laDate(T0), SIGN_URL, T0);
  const badConfirm = await confirm(t, { reportId: tideId, verdict: 'still', device: DEV.a, code: BCH }, T0 + MIN);
  assert.equal(badConfirm.status, 400);
  assert.equal(badConfirm.body.reason, 'not-confirmable');
});

/* ---------- the two read payloads ---------- */

test('deskPayload and agentPayload: shapes, no hash, an unknown agent is null', async () => {
  const db = new SqliteD1();
  await ask(db, { action: 'ask', agent: 'sol', spot: 'courts', kind: 'sign', belief: 'weekends', sourceUrl: SIGN_URL }, T0);
  const board = await deskPayload(db, config, T0 + MIN);
  assert.equal(board.calls.length, 1);
  assert.equal(board.calls[0].agent, 'sol');
  assert.equal(board.calls[0].belief.value, 'weekends');
  assert.equal(board.log.some((l) => l.kind === 'ask' && l.agent === 'sol'), true);
  assert.equal(board.nightEditor, null);
  await noHashes(board);

  const card = await agentPayload(db, config, 'sol', T0 + MIN);
  assert.equal(card.agent.call, 'sol');
  assert.equal(card.calls.asked, 1);
  assert.equal(card.calls.answered, 0);
  await noHashes(card);

  assert.equal(await agentPayload(db, config, 'nobody', T0), null);
});

test('agentPayload: a fixed number of statements however long the history; only in-window people and on-site confirms judge', async () => {
  const t = deskTown();
  const db = t.env.AUTH_DB;
  const DAY = 24 * HOUR;
  const agentRow = (id, kind, value, at, slot, source = 'agent:cc') => db.db.prepare(`INSERT INTO air_reports (id, spot, kind, value, extras_json, schema_v, observed_at, day, slot, pid_hash, ip_hash, byline, onsite, status, source, source_url, created_at)
    VALUES (?, 'beach', ?, ?, '[]', 2, ?, ?, ?, ?, 'i', 'x', 0, 'ok', ?, 'https://aviationweather.gov/api/data/metar?ids=KLAX', ?)`).run(id, kind, value, at, laDate(at), slot, source, source, at);
  // cc's Sky rows: this morning (a person checks it), two days ago (nobody did), a week ago (a person's on-site "changed").
  agentRow('ar_cc_today', 'fog', 'hazy', T0, 1);
  agentRow('ar_cc_2days', 'fog', 'clear', T0 - 2 * DAY, 2);
  agentRow('ar_cc_week', 'fog', 'clear', T0 - 7 * DAY, 3);
  // Sol's tide facts: a year of mornings, none of which anyone can check.
  for (let i = 0; i < 365; i++) agentRow(`ar_sol_tide_${i}`, 'tide', 'rising', T0 - i * DAY, 100 + i, 'agent:sol');
  // People: one on site inside this morning's window, one on site well outside any window, one from away.
  const inWindow = await report(t, 'beach', { kind: 'fog', value: 'hazy', device: DEV.a, code: BCH }, T0 + 30 * MIN);
  assert.equal(inWindow.body.report.onsite, true);
  db.db.prepare(`INSERT INTO air_reports (id, spot, kind, value, extras_json, observed_at, day, slot, pid_hash, ip_hash, byline, onsite, status, source, created_at)
    VALUES ('ar_person_old', 'beach', 'fog', 'none', '[]', ?, ?, 9, 'pp', 'ii', 'guest', 1, 'ok', 'page', ?)`).run(T0 - 4 * DAY, laDate(T0 - 4 * DAY), T0 - 4 * DAY);
  await report(t, 'beach', { kind: 'fog', value: 'none', device: DEV.b }, T0 + 40 * MIN);
  db.db.prepare(`INSERT INTO air_confirms (report_id, pid_hash, ip_hash, verdict, value, onsite, at) VALUES ('ar_cc_week', 'pc', 'ic', 'changed', 'clear', 1, ?)`).run(T0 - 7 * DAY + 10 * MIN);
  db.db.prepare(`INSERT INTO air_confirms (report_id, pid_hash, ip_hash, verdict, value, onsite, at) VALUES ('ar_cc_2days', 'pd', 'id', 'still', 'clear', 0, ?)`).run(T0 - 2 * DAY + 10 * MIN);

  const counted = (fn) => async (...args) => {
    let n = 0;
    const prepare = db.prepare.bind(db);
    db.prepare = (sql) => { n += 1; return prepare(sql); };
    try { return { out: await fn(...args), n }; } finally { db.prepare = prepare; }
  };
  const cc = await counted(agentPayload)(db, config, 'cc', T0 + HOUR);
  assert.deepEqual(cc.out.record, { checked: 1, overruled: 1, judged: 2, pending: 0, noHumanCheck: 0 }, 'the in-window person checks today; the on-site "changed" overrules last week; from-away and off-site confirms never judge');
  assert.equal(cc.n, 5, 'four reads plus one per judgeable spot+kind');
  const sol = await counted(agentPayload)(db, config, 'sol', T0 + HOUR);
  assert.equal(sol.out.record.noHumanCheck, 365);
  assert.equal(sol.n, 4, 'a year of facts is still four statements: no per-row confirm read, no human read for facts');
  await noHashes(cc.out);
  await noHashes(sol.out);
});

/* ---------- integration: the race and the MCP path ---------- */

test('an ask that loses the spot to a racing ask writes no belief row and no call (spot-busy)', async () => {
  const db = new SqliteD1();
  // Another agent's call lands between this ask's refusal probe (batch 1)
  // and its write batch (batch 2): the probe saw a free spot, the batch does not.
  const realBatch = db.batch.bind(db);
  let batches = 0;
  db.batch = async (stmts) => {
    batches += 1;
    if (batches === 2) {
      db.db.prepare(`INSERT INTO air_reports (id, spot, kind, value, extras_json, schema_v, observed_at, day, slot, pid_hash, ip_hash, byline, onsite, geo, status, source, source_url, created_at)
        VALUES ('ar_racer', 'courts', 'sign', 'daily', '[]', 1, ?, ?, 0, 'racer', 'y', 'Frog', 0, 0, 'ok', 'agent:frog', ?, ?)`).run(T0, laDate(T0), SIGN_URL, T0);
      db.db.prepare(`INSERT INTO air_calls (id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at, relay_json)
        VALUES ('ac_racer0000000000000', 'courts', 'sign', 'frog', 'frog', 'ar_racer', ?, 'open', ?, ?, '[]')`).run(laDate(T0), T0, T0 + 47 * HOUR);
    }
    return realBatch(stmts);
  };
  const res = await ask(db, { action: 'ask', agent: 'sol', spot: 'courts', kind: 'sign', belief: 'weekends', sourceUrl: SIGN_URL }, T0);
  assert.equal(res.status, 409);
  assert.equal((await res.json()).reason, 'spot-busy');
  assert.equal(db.rows("SELECT COUNT(*) AS n FROM air_reports WHERE source = 'agent:sol'")[0].n, 0, 'no orphan belief row');
  assert.equal(db.rows("SELECT COUNT(*) AS n FROM air_calls WHERE asker = 'sol'")[0].n, 0);
});

test('MCP desk_ask/desk_pass reach askCall/passCall with the caller\'s X-Yard-Resident header and their own action', async (t) => {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  const mcp = await server.ssrLoadModule('/functions/api/mcp.ts');
  const db = new SqliteD1();
  const env = { AUTH_DB: db, YARD_RESIDENT_KEY: 'k' };
  const rpc = async (name, args, key) => (await mcp.onRequestPost({
    env,
    request: new Request('https://pointcast.xyz/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(key ? { 'X-Yard-Resident': key } : {}) },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
    }),
  })).json();
  const realFetch = globalThis.fetch;
  const fetched = [];
  globalThis.fetch = async (url) => { fetched.push(String(url)); return new Response('ok', { status: 200 }); };
  t.after(() => { globalThis.fetch = realFetch; });

  const args = { agent: 'sol', spot: 'courts', kind: 'sign', belief: 'weekends', sourceUrl: SIGN_URL };
  const refused = await rpc('desk_ask', args, null);
  assert.equal(refused.result.isError, true);
  assert.match(refused.result.content[0].text, /not-a-resident/);
  assert.equal(db.rows('SELECT COUNT(*) AS n FROM air_calls')[0].n, 0);

  const asked = await rpc('desk_ask', args, 'k');
  assert.equal(asked.result.isError, undefined, asked.result.content[0].text);
  const call = JSON.parse(asked.result.content[1].text).call;
  assert.deepEqual([call.spot, call.kind, call.agent, call.belief.value], ['courts', 'sign', 'sol', 'weekends']);
  assert.deepEqual(fetched, [SIGN_URL], 'the source URL was resolved once, nothing else fetched');

  const passed = await rpc('desk_pass', { agent: 'sol', callId: call.id, to: 'frog', reason: 'off-shift' }, 'k');
  assert.equal(passed.result.isError, undefined, passed.result.content[0].text);
  assert.equal(JSON.parse(passed.result.content[1].text).call.agent, 'frog');
});

/* ---------- source contract ---------- */

test('source contract: desk.ts carries no SQL of its own; every D1 call in air-desk-store.ts is a literal followed by .bind(', async () => {
  const route = await read('functions/api/air/desk.ts');
  assert.doesNotMatch(route, /\.prepare\(/, 'the route delegates every query to air-desk-store.ts');
  assert.doesNotMatch(route, /pid_hash|ip_hash/);
  const store = await read('functions/_lib/air-desk-store.ts');
  const prepares = store.split('.prepare(').length - 1;
  const bound = [...store.matchAll(/\.prepare\(\s*(`[^`]*`|'[^']*'|"[^"]*")\s*\)\s*\.bind\(/g)];
  assert.equal(bound.length, prepares, 'every .prepare( takes a literal and is followed by .bind(');
  for (const [, sql] of bound) assert.ok(!sql.includes('${'), `no interpolated SQL: ${sql.slice(0, 60)}`);
  // pid_hash/ip_hash appear once, as literal column names on the belief row's
  // own INSERT (an agent's fixed hash, from agentRowOf() — never a phone's);
  // no SELECT here ever names either column, and the runtime tests above
  // (noHashes) are the real proof no view ever carries one out.
  for (const line of store.split('\n')) if (/SELECT/i.test(line)) assert.doesNotMatch(line, /pid_hash|ip_hash/, line.trim());
  assert.doesNotMatch(store, /rateLimit\(|_rate-limit|PC_RATES_KV/, 'caps come from D1 counts, never the KV limiter');
  assert.match(store, /function timingSafeEqual\(/, 'isResident compares in constant time');
});
