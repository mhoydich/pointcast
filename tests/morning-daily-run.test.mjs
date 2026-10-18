import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createServer } from 'vite';

import { toJsonFeed } from '../functions/_lib/morning.mjs';
import {
  CONFIRM_TTL_MS,
  EDITION_FROM,
  EDITION_SLOTS,
  FIRST_EDITION,
  MAIL_OFF_NOTE,
  sha256Hex,
} from '../functions/_lib/edition-mail.mjs';

// The morning-daily Worker (docs/plans/2026-10-18-field-reports-v2-paper-spec.md
// §6): workers/morning-daily/src/{run.ts,index.ts} loaded through vite (they
// import extensionless TS siblings plain node can't resolve) over the SqliteD1
// fake tests/early-shift-run.test.mjs uses, with migrations 0001 + 0023 +
// 0031, a fake fetch serving JSON Feed bodies, a fake SEND_EMAIL that records
// messages, and an injected sleep that resolves at once and records its waits.

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const MIGRATIONS = (await Promise.all(
  ['0001_init.sql', '0023_air.sql', '0031_field_reports_paper.sql'].map((f) => read(`migrations/auth/${f}`)),
)).join('\n');

/** D1 over node:sqlite — the same fake tests/early-shift-run.test.mjs uses. */
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

/** The Worker's own console output, captured so a test can prove no address reached a log line. */
async function withWorker(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const logs = [];
  const original = { log: console.log, error: console.error, warn: console.warn };
  const capture = (...args) => { logs.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')); };
  console.log = capture; console.error = capture; console.warn = capture;
  try {
    const runMod = await server.ssrLoadModule('/workers/morning-daily/src/run.ts');
    const worker = (await server.ssrLoadModule('/workers/morning-daily/src/index.ts')).default;
    return await run({ ...runMod, worker, logs });
  } finally {
    Object.assign(console, original);
    await server.close();
  }
}

/** index.ts calls the module-global fetch (the Workers contract has no deps parameter): swap it for the call. */
async function withGlobalFetch(fetchFn, run) {
  const original = globalThis.fetch;
  globalThis.fetch = fetchFn;
  try { return await run(); } finally { globalThis.fetch = original; }
}

/** POST /run and /send-confirm read the clock (Date.now()): pin it for the call. */
async function withNow(ms, run) {
  const original = Date.now;
  Date.now = () => ms;
  try { return await run(); } finally { Date.now = original; }
}

const DAY = '2026-10-18';
const THIRTEEN_45Z = Date.parse('2026-10-18T13:45:00Z'); // 6:45 AM PDT
const FOURTEEN_45Z = Date.parse('2026-10-18T14:45:00Z'); // 7:45 AM PDT
const NOV1_13_45Z = Date.parse('2026-11-01T13:45:00Z'); // 5:45 AM PST
const NOV1_14_45Z = Date.parse('2026-11-01T14:45:00Z'); // 6:45 AM PST
const OCT2_13_45Z = Date.parse('2026-10-02T13:45:00Z'); // before No. 1

const ADA = 'ada@example.com';
const BOB = 'bob@example.com';
const CAL = 'cal@example.com';
const DEE = 'dee@example.com';
const ALL_EMAILS = [ADA, BOB, CAL, DEE, 'eve@example.com', 'fay@example.com', 'gus@example.com'];
const tok = (c) => c.repeat(43);

/** One subscriber row; every column the tests care about, the rest defaulted. */
function seed(db, rows) {
  for (const r of rows) {
    db.db.prepare(
      'INSERT INTO edition_subscribers (email, status, token, created_at, confirm_hash, confirm_expires_at, confirm_sent_at, confirmed_at, last_sent_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(r.email, r.status, r.token, r.created_at ?? 1, r.confirm_hash ?? null, r.confirm_hash ? (r.confirm_expires_at ?? 1) : null, r.confirm_sent_at ?? null, r.confirmed_at ?? (r.status === 'confirmed' ? 1 : null), r.last_sent_day ?? null);
  }
}

function standardList(db) {
  seed(db, [
    { email: ADA, status: 'confirmed', token: tok('a'), confirmed_at: 10 },
    { email: BOB, status: 'confirmed', token: tok('b'), confirmed_at: 20 },
    { email: CAL, status: 'pending', token: tok('c'), confirm_sent_at: 5 },
    { email: DEE, status: 'unsubscribed', token: tok('d') },
  ]);
}

const LABELS = ['Sky · 6.100', 'Courts · 7.500', 'Beach · 6.200', 'Town · 7.100', 'Almanac', 'Shop', 'Station'];
function slots(n = EDITION_SLOTS) {
  return Array.from({ length: n }, (_, i) => ({ id: `s${i}`, label: LABELS[i % LABELS.length], line: `Line ${i + 1} for the paper.` }));
}
/** A /morning.json?d=<day> body built by the real toJsonFeed. */
function feedBody({ date = DAY, frozen = true, provisional = false, slotCount = EDITION_SLOTS } = {}) {
  return toJsonFeed([{ date, frozen, provisional, frozenAt: frozen ? Date.parse(`${date}T13:45:10Z`) : undefined, reporterLine: 'On the air yesterday: Guest 3348', slots: slots(slotCount) }]);
}

/** Answers per call in order (the last one repeats). Each answer is a body, a status number, or an Error to throw. */
function feedFetch(answers) {
  const calls = [];
  const fn = async (input, init) => {
    calls.push({ url: String(input), headers: init?.headers ?? {} });
    const a = answers[Math.min(calls.length - 1, answers.length - 1)];
    if (a instanceof Error) throw a;
    if (typeof a === 'number') return { ok: a >= 200 && a < 300, status: a, async json() { return { ok: false }; } };
    return { ok: true, status: 200, async json() { return a; } };
  };
  fn.calls = calls;
  return fn;
}

function recorder() {
  const waits = [];
  return { waits, sleep: async (ms) => { waits.push(ms); } };
}

/** A fake SEND_EMAIL binding: records every message; `failFor` throws for those recipients. */
function fakeSendEmail({ failFor = [] } = {}) {
  const sent = [];
  return {
    sent,
    async send(message) {
      if (failFor.includes(message.to)) throw new Error('E_SEND_REFUSED');
      sent.push(message);
      return { messageId: `m${sent.length}` };
    },
  };
}

const mailEnv = (db, sender = fakeSendEmail(), extra = {}) => ({ AUTH_DB: db, SEND_EMAIL: sender, MORNING_SEND_EMAIL_READY: 'true', ...extra });

const runRows = (db) => db.rows('SELECT * FROM morning_daily_runs ORDER BY day');
const subRow = (db, email) => db.rows('SELECT * FROM edition_subscribers WHERE email = ?', email)[0] ?? null;
const fromOf = (m) => `${m.from.name} <${m.from.email}>`;

function assertNoAddress(logs, text = '') {
  for (const email of ALL_EMAILS) {
    for (const line of logs) assert.ok(!line.includes(email), `a log line carries ${email}`);
    assert.ok(!text.includes(email), `the response carries ${email}`);
  }
}

test('13:45Z on 2026-10-18 sends once to each confirmed row, none to pending or unsubscribed', () => withWorker(async ({ runMorningDaily, logs }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const feed = feedFetch([feedBody()]);
  const { sleep, waits } = recorder();
  const result = await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, fetch: feed, sleep });

  assert.equal(result.ok, true);
  assert.equal(result.day, DAY);
  assert.equal(result.skipped, undefined);
  assert.equal(result.frozen, true);
  assert.equal(result.editionNumber, 16);
  assert.equal(result.reason, null);
  assert.equal(result.configured, true);
  assert.equal(result.dryRun, false);
  assert.deepEqual([result.attempted, result.sent, result.failed], [2, 2, 0]);
  assert.deepEqual(waits, []);
  assert.deepEqual(sender.sent.map((m) => m.to).sort(), [ADA, BOB]);
  assert.equal(subRow(db, ADA).last_sent_day, DAY);
  assert.equal(subRow(db, BOB).last_sent_day, DAY);
  assert.equal(subRow(db, CAL).last_sent_day, null);
  assert.equal(subRow(db, DEE).last_sent_day, null);

  // It read the edition for the day, with the declared agent and accept header.
  assert.equal(feed.calls.length, 1);
  assert.equal(feed.calls[0].url, `https://pointcast.xyz/morning.json?d=${DAY}`);
  assert.equal(feed.calls[0].headers['User-Agent'], 'PointCast Morning Daily (+https://pointcast.xyz/morning)');
  assert.equal(feed.calls[0].headers.Accept, 'application/feed+json');

  const [run] = runRows(db);
  assert.equal(runRows(db).length, 1);
  assert.deepEqual(
    { day: run.day, edition_number: run.edition_number, frozen: run.frozen, reason: run.reason, attempted: run.attempted, sent: run.sent, failed: run.failed, dry_run: run.dry_run, configured: run.configured },
    { day: DAY, edition_number: 16, frozen: 1, reason: null, attempted: 2, sent: 2, failed: 0, dry_run: 0, configured: 1 },
  );
  assert.ok(run.started_at > 0 && run.finished_at >= run.started_at);
  assertNoAddress(logs);
}));

test('every edition mail: both List-Unsubscribe headers, the edition sender, src=em links, the right unsubscribe token', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.equal(sender.sent.length, 2);
  for (const m of sender.sent) {
    const token = m.to === ADA ? tok('a') : tok('b');
    const unsub = `https://pointcast.xyz/api/morning/unsubscribe?t=${token}`;
    assert.equal(fromOf(m), EDITION_FROM);
    assert.equal(m.headers['List-Unsubscribe'], `<${unsub}>`);
    assert.equal(m.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
    for (const body of [m.text, m.html]) {
      assert.ok(body.includes(`https://pointcast.xyz/morning?d=${DAY}&src=em`) || body.includes(`https://pointcast.xyz/morning?d=${DAY}&amp;src=em`), 'edition link has src=em');
      assert.ok(body.includes('https://pointcast.xyz/r?src=em'), 'report link has src=em');
      assert.ok(body.includes(unsub), 'unsubscribe link');
    }
    assert.ok(m.subject.length > 0);
    assert.ok(!/<img\b/iu.test(m.html), 'no pixel');
  }
}));

test('a second run the same day sends nothing: dedupe on last_sent_day', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const deps = { fetch: feedFetch([feedBody()]), sleep: recorder().sleep };
  await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, ...deps });
  const second = await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z + 5_000, ...deps });
  assert.equal(sender.sent.length, 2);
  assert.deepEqual([second.attempted, second.sent, second.failed], [0, 0, 0]);
  assert.equal(second.reason, 'no-subscribers');
  assert.equal(runRows(db).length, 1, 'one row per day, upserted');
}));

test('14:45Z that day skips (not-6am) and writes no run row', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const feed = feedFetch([feedBody()]);
  const result = await runMorningDaily(mailEnv(db, sender), { now: FOURTEEN_45Z, fetch: feed, sleep: recorder().sleep });
  assert.equal(result.skipped, 'not-6am');
  assert.equal(result.sent, 0);
  assert.equal(feed.calls.length, 0, 'it did not even read the edition');
  assert.equal(sender.sent.length, 0);
  assert.equal(runRows(db).length, 0);
}));

test('Sun 2026-11-01: 14:45Z sends (6:45 PST), 13:45Z skips (5:45 PST)', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const feed = feedFetch([feedBody({ date: '2026-11-01' })]);
  const early = await runMorningDaily(mailEnv(db, sender), { now: NOV1_13_45Z, fetch: feed, sleep: recorder().sleep });
  assert.equal(early.skipped, 'not-6am');
  assert.equal(sender.sent.length, 0);
  assert.equal(runRows(db).length, 0);
  const late = await runMorningDaily(mailEnv(db, sender), { now: NOV1_14_45Z, fetch: feed, sleep: recorder().sleep });
  assert.equal(late.skipped, undefined);
  assert.equal(late.day, '2026-11-01');
  assert.equal(late.sent, 2);
  assert.equal(sender.sent.length, 2);
  assert.equal(feed.calls[0].url, 'https://pointcast.xyz/morning.json?d=2026-11-01');
}));

test('2026-10-02 skips with before-first-edition', () => withWorker(async ({ runMorningDaily }) => {
  assert.equal(FIRST_EDITION, '2026-10-03');
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const feed = feedFetch([feedBody()]);
  const result = await runMorningDaily(mailEnv(db, sender), { now: OCT2_13_45Z, fetch: feed, sleep: recorder().sleep });
  assert.equal(result.skipped, 'before-first-edition');
  assert.equal(feed.calls.length, 0);
  assert.equal(sender.sent.length, 0);
  assert.equal(runRows(db).length, 0);
  // force does not lift it
  const forced = await runMorningDaily(mailEnv(db, sender), { now: OCT2_13_45Z, force: true, fetch: feed, sleep: recorder().sleep });
  assert.equal(forced.skipped, 'before-first-edition');
  assert.equal(feed.calls.length, 0);
}));

test('provisional on every attempt: not-frozen, nothing sent, waits 65/130/240 s (435 s, well under the 15-minute limit)', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const feed = feedFetch([feedBody({ frozen: false, provisional: true })]);
  const { sleep, waits } = recorder();
  const result = await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, fetch: feed, sleep });
  assert.equal(feed.calls.length, 4);
  assert.deepEqual(waits, [65_000, 130_000, 240_000]);
  assert.ok(waits.reduce((a, b) => a + b, 0) <= 450_000, 'the reads leave the send loop most of the invocation');
  assert.equal(result.frozen, false);
  assert.equal(result.reason, 'not-frozen');
  assert.equal(result.sent, 0);
  assert.equal(sender.sent.length, 0);
  const [run] = runRows(db);
  assert.equal(run.frozen, 0);
  assert.equal(run.reason, 'not-frozen');
  assert.equal(run.edition_number, null);
  assert.equal(subRow(db, ADA).last_sent_day, null);
}));

test('a 400, a 5xx, a network error and bad JSON all mean wait and read again; frozen on attempt 3 sends', () => withWorker(async ({ runMorningDaily, logs }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const feed = feedFetch([400, new Error('network down'), feedBody()]);
  const { sleep, waits } = recorder();
  const result = await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, fetch: feed, sleep });
  assert.equal(feed.calls.length, 3);
  assert.deepEqual(waits, [65_000, 130_000]);
  assert.equal(result.frozen, true);
  assert.equal(result.sent, 2);
  assert.equal(sender.sent.length, 2);

  const db2 = new SqliteD1(MIGRATIONS);
  standardList(db2);
  const sender2 = fakeSendEmail();
  const bad = { ok: true, status: 200, async json() { throw new SyntaxError('Unexpected token'); } };
  const feed2 = async () => bad;
  const r2 = await runMorningDaily(mailEnv(db2, sender2), { now: THIRTEEN_45Z, fetch: feed2, sleep: recorder().sleep });
  assert.equal(r2.reason, 'not-frozen');
  assert.equal(sender2.sent.length, 0);
  assertNoAddress(logs);
}));

test('a 6-slot edition never sends', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const feed = feedFetch([feedBody({ slotCount: 6 })]);
  const result = await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, fetch: feed, sleep: recorder().sleep });
  assert.equal(feed.calls.length, 4);
  assert.equal(result.reason, 'not-frozen');
  assert.equal(sender.sent.length, 0);
  assert.equal(subRow(db, ADA).last_sent_day, null);
}));

test('a dry run sends nothing, leaves last_sent_day alone, and writes dry_run = 1', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const result = await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, dryRun: true, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.equal(result.dryRun, true);
  assert.deepEqual([result.attempted, result.sent, result.failed], [2, 0, 0]);
  assert.equal(sender.sent.length, 0);
  assert.equal(subRow(db, ADA).last_sent_day, null);
  const [run] = runRows(db);
  assert.equal(run.dry_run, 1);
  assert.equal(run.frozen, 1);
  assert.equal(run.sent, 0);
  assert.equal(run.attempted, 2);

  // MORNING_DAILY_DRY_RUN = 'true' in the env is the same switch.
  const db2 = new SqliteD1(MIGRATIONS);
  standardList(db2);
  const sender2 = fakeSendEmail();
  const r2 = await runMorningDaily(mailEnv(db2, sender2, { MORNING_DAILY_DRY_RUN: 'true' }), { now: THIRTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.equal(r2.dryRun, true);
  assert.equal(sender2.sent.length, 0);
}));

test('a dry run after the real send keeps the real run row', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const deps = { fetch: feedFetch([feedBody()]), sleep: recorder().sleep };
  await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, ...deps });
  await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z + 60_000, dryRun: true, ...deps });
  const [run] = runRows(db);
  assert.equal(runRows(db).length, 1);
  assert.equal(run.dry_run, 0, 'the dry run did not replace the real row');
  assert.equal(run.sent, 2);
}));

test('no mail sender: email-not-configured, nothing sent; /status says why, with and without the binding', () => withWorker(async ({ runMorningDaily, worker, logs }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  // SEND_EMAIL bound but MORNING_SEND_EMAIL_READY 'false': never used.
  const bound = { AUTH_DB: db, SEND_EMAIL: sender, MORNING_SEND_EMAIL_READY: 'false', MORNING_INTERNAL_KEY: 'k-internal-secret-value' };
  const result = await runMorningDaily(bound, { now: THIRTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.equal(result.reason, 'email-not-configured');
  assert.equal(result.frozen, true);
  assert.equal(result.configured, false);
  assert.equal(result.sent, 0);
  assert.equal(sender.sent.length, 0);
  const [run] = runRows(db);
  assert.deepEqual({ frozen: run.frozen, reason: run.reason, edition_number: run.edition_number, configured: run.configured, sent: run.sent }, { frozen: 1, reason: 'email-not-configured', edition_number: 16, configured: 0, sent: 0 });
  assert.equal(subRow(db, ADA).last_sent_day, null, 'the day is not claimed');

  const withBinding = await worker.fetch(new Request('https://x.test/status'), bound);
  const text1 = await withBinding.text();
  const body1 = JSON.parse(text1);
  assert.equal(withBinding.headers.get('Cache-Control'), 'no-store');
  assert.equal(body1.ok, true);
  assert.equal(body1.configured, false);
  assert.equal(body1.reason, 'send-email-not-onboarded');
  assert.equal(body1.note, MAIL_OFF_NOTE);
  assert.deepEqual(body1.bindings, { authDb: true, sendEmail: true, sendEmailReady: false, resend: false, internalKey: true });

  const unbound = { AUTH_DB: db };
  const without = await worker.fetch(new Request('https://x.test/'), unbound);
  const body2 = await without.json();
  assert.equal(body2.configured, false);
  assert.equal(body2.reason, 'no-mail-sender');
  assert.equal(body2.note, MAIL_OFF_NOTE);
  assert.deepEqual(body2.bindings, { authDb: true, sendEmail: false, sendEmailReady: false, resend: false, internalKey: false });

  // Shape, counts, and nothing private.
  assert.deepEqual(body1.crons, ['45 13 * * *', '45 14 * * *']);
  assert.equal(body1.timeZone, 'America/Los_Angeles');
  assert.equal(body1.firstEdition, FIRST_EDITION);
  assert.equal(body1.dryRun, false);
  assert.deepEqual(body1.subscribers, { confirmed: 2, pending: 1, waiting: 0 });
  assert.equal(body1.lastRun.day, DAY);
  assert.equal(body1.lastRun.reason, 'email-not-configured');
  assert.ok(!text1.includes('k-internal-secret-value'));
  assertNoAddress(logs, text1);
}));

test('/status when mail is ready: configured true, no reason; missing tables give null fields', () => withWorker(async ({ worker }) => {
  const db = new SqliteD1(MIGRATIONS);
  const ready = await (await worker.fetch(new Request('https://x.test/status'), mailEnv(db, fakeSendEmail(), { RESEND_API_KEY: 're_test_key_value' }))).text();
  const body = JSON.parse(ready);
  assert.equal(body.configured, true);
  assert.equal(body.reason, null);
  assert.equal(body.note, null);
  assert.equal(body.bindings.resend, true);
  assert.ok(!ready.includes('re_test_key_value'));
  assert.equal(body.lastRun, null);
  assert.deepEqual(body.subscribers, { confirmed: 0, pending: 0, waiting: 0 });

  const bare = new SqliteD1('CREATE TABLE unrelated (x INTEGER);');
  const missing = await (await worker.fetch(new Request('https://x.test/status'), { AUTH_DB: bare })).json();
  assert.equal(missing.lastRun, null);
  assert.equal(missing.subscribers, null);
  assert.equal(missing.ok, true);
}));

test('a send that throws restores last_sent_day; the others still go', () => withWorker(async ({ runMorningDaily, logs }) => {
  const db = new SqliteD1(MIGRATIONS);
  seed(db, [
    { email: ADA, status: 'confirmed', token: tok('a'), confirmed_at: 10, last_sent_day: '2026-10-17' },
    { email: BOB, status: 'confirmed', token: tok('b'), confirmed_at: 20 },
  ]);
  const sender = fakeSendEmail({ failFor: [ADA] });
  const result = await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.deepEqual([result.attempted, result.sent, result.failed], [2, 1, 1]);
  assert.equal(subRow(db, ADA).last_sent_day, '2026-10-17', 'restored to what it was');
  assert.equal(subRow(db, BOB).last_sent_day, DAY);
  assert.deepEqual(sender.sent.map((m) => m.to), [BOB]);
  assert.equal(runRows(db)[0].failed, 1);
  assertNoAddress(logs);

  // A later run (same day) retries the one that failed.
  const retry = await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z + 1000, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.equal(retry.attempted, 1);
  assert.equal(retry.failed, 1, 'still refused');
}));

/** An env whose SEND_EMAIL answers for the first `okReads` reads (the mailReadiness checks) and is gone for sendMail: sendMail then returns {configured: false}. */
function vanishingSender(db, okReads = 1) {
  const env = { AUTH_DB: db, MORNING_SEND_EMAIL_READY: 'true' };
  let reads = 0;
  Object.defineProperty(env, 'SEND_EMAIL', { enumerable: true, get() { reads += 1; return reads <= okReads ? fakeSendEmail() : undefined; } });
  return env;
}

test('sendMail answering {configured: false} counts as failed and restores last_sent_day', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  seed(db, [
    { email: ADA, status: 'confirmed', token: tok('a'), confirmed_at: 10 },
    { email: BOB, status: 'confirmed', token: tok('b'), confirmed_at: 20 },
  ]);
  // runMorningDaily checks readiness once; every send after that sees no sender.
  const env = vanishingSender(db);
  const result = await runMorningDaily(env, { now: THIRTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.equal(result.configured, true);
  assert.deepEqual([result.attempted, result.sent, result.failed], [2, 0, 2]);
  assert.equal(subRow(db, ADA).last_sent_day, null);
  assert.equal(subRow(db, BOB).last_sent_day, null);
}));

test('the Resend path is preferred and carries the headers', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const posted = [];
  const resend = async (url, init) => {
    posted.push({ url: String(url), auth: init.headers.Authorization, body: JSON.parse(init.body) });
    return { ok: true, status: 200, async json() { return { id: 'r1' }; } };
  };
  await withGlobalFetch(resend, async () => {
    const result = await runMorningDaily({ AUTH_DB: db, SEND_EMAIL: sender, RESEND_API_KEY: 're_k_test' }, { now: THIRTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
    assert.equal(result.sent, 2);
  });
  assert.equal(sender.sent.length, 0);
  assert.equal(posted.length, 2);
  for (const p of posted) {
    assert.equal(p.url, 'https://api.resend.com/emails');
    assert.equal(p.body.from, EDITION_FROM);
    assert.equal(p.body.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
  }
}));

test('sweepConfirms: one confirm per waiting pending row, confirm_sent_at set, the link token hashes to confirm_hash, a second sweep sends nothing', () => withWorker(async ({ sweepConfirms, logs }) => {
  const db = new SqliteD1(MIGRATIONS);
  const now = THIRTEEN_45Z;
  seed(db, [
    { email: ADA, status: 'pending', token: tok('a'), created_at: 1 },
    { email: BOB, status: 'pending', token: tok('b'), created_at: 2 },
    { email: CAL, status: 'confirmed', token: tok('c') },
    { email: DEE, status: 'unsubscribed', token: tok('d') },
  ]);
  const sender = fakeSendEmail();
  const first = await sweepConfirms(mailEnv(db, sender), { now });
  assert.deepEqual(first, { sent: 2, failed: 0, pruned: 0 });
  assert.deepEqual(sender.sent.map((m) => m.to), [ADA, BOB], 'oldest signup first');
  for (const m of sender.sent) {
    assert.equal(fromOf(m), EDITION_FROM);
    assert.equal(m.subject, 'Confirm the PointCast Morning Edition');
    const link = m.text.match(/https:\/\/pointcast\.xyz\/api\/morning\/confirm\?t=([A-Za-z0-9_-]{43})/u);
    assert.ok(link, 'the confirm link is in the text');
    const row = subRow(db, m.to);
    assert.equal(row.confirm_hash, await sha256Hex(link[1]));
    assert.equal(row.confirm_sent_at, now);
    assert.equal(row.confirm_expires_at, now + CONFIRM_TTL_MS);
    assert.equal(row.status, 'pending');
    assert.ok(m.html.includes(link[1]));
  }
  assert.notEqual(subRow(db, ADA).confirm_hash, subRow(db, BOB).confirm_hash);
  assert.equal(subRow(db, CAL).confirm_sent_at, null);
  assert.equal(subRow(db, DEE).confirm_sent_at, null);

  const second = await sweepConfirms(mailEnv(db, sender), { now: now + 60_000 });
  assert.deepEqual(second, { sent: 0, failed: 0, pruned: 0 });
  assert.equal(sender.sent.length, 2);
  assertNoAddress(logs);
}));

test('sweepConfirms: a refused confirm reverts the row so the next tick retries it', () => withWorker(async ({ sweepConfirms }) => {
  const db = new SqliteD1(MIGRATIONS);
  seed(db, [{ email: ADA, status: 'pending', token: tok('a') }, { email: BOB, status: 'pending', token: tok('b'), created_at: 2 }]);
  const sender = fakeSendEmail({ failFor: [ADA] });
  const out = await sweepConfirms(mailEnv(db, sender), { now: THIRTEEN_45Z });
  assert.deepEqual(out, { sent: 1, failed: 1, pruned: 0 });
  const ada = subRow(db, ADA);
  assert.deepEqual([ada.confirm_hash, ada.confirm_expires_at, ada.confirm_sent_at], [null, null, null]);
  assert.notEqual(subRow(db, BOB).confirm_sent_at, null);
  // The next tick picks ADA up again.
  const healthy = fakeSendEmail();
  const next = await sweepConfirms(mailEnv(db, healthy), { now: THIRTEEN_45Z + 86_400_000 });
  assert.equal(next.sent, 1);
  assert.deepEqual(healthy.sent.map((m) => m.to), [ADA]);
}));

test('sweepConfirms: {configured: false} from sendMail is a failed confirm and reverts', () => withWorker(async ({ sweepConfirms }) => {
  const db = new SqliteD1(MIGRATIONS);
  seed(db, [{ email: ADA, status: 'pending', token: tok('a') }]);
  const out = await sweepConfirms(vanishingSender(db, 2), { now: THIRTEEN_45Z }); // the sweep and sendConfirm each check readiness
  assert.deepEqual(out, { sent: 0, failed: 1, pruned: 0 });
  const row = subRow(db, ADA);
  assert.deepEqual([row.confirm_hash, row.confirm_expires_at, row.confirm_sent_at], [null, null, null]);
}));

test('prune: a pending row whose confirm went out 31 days ago goes; one that never got a mail stays, mail on or off', () => withWorker(async ({ sweepConfirms }) => {
  const now = THIRTEEN_45Z;
  const day = 86_400_000;
  const build = () => {
    const db = new SqliteD1(MIGRATIONS);
    seed(db, [
      { email: ADA, status: 'pending', token: tok('a'), confirm_hash: 'h'.repeat(64), confirm_sent_at: now - 31 * day },
      { email: BOB, status: 'pending', token: tok('b'), confirm_hash: 'i'.repeat(64), confirm_sent_at: now - 29 * day },
      { email: CAL, status: 'pending', token: tok('c'), created_at: 3 },
      { email: DEE, status: 'confirmed', token: tok('d') },
    ]);
    return db;
  };

  // Mail off: prune still runs, the never-mailed row waits.
  const off = build();
  const quiet = await sweepConfirms({ AUTH_DB: off }, { now });
  assert.deepEqual(quiet, { sent: 0, failed: 0, pruned: 1 });
  assert.equal(subRow(off, ADA), null);
  assert.ok(subRow(off, BOB));
  assert.equal(subRow(off, CAL).confirm_sent_at, null);
  assert.ok(subRow(off, DEE));

  // Mail on: the same prune, and the never-mailed row now gets its mail.
  const on = build();
  const sender = fakeSendEmail();
  const loud = await sweepConfirms(mailEnv(on, sender), { now });
  assert.deepEqual(loud, { sent: 1, failed: 0, pruned: 1 });
  assert.equal(subRow(on, ADA), null);
  assert.deepEqual(sender.sent.map((m) => m.to), [CAL]);

  // No database at all: zeros.
  assert.deepEqual(await sweepConfirms({}, { now }), { sent: 0, failed: 0, pruned: 0 });
}));

test('sweepConfirms sends to at most 50 waiting rows a tick', () => withWorker(async ({ sweepConfirms }) => {
  const db = new SqliteD1(MIGRATIONS);
  seed(db, Array.from({ length: 53 }, (_, i) => ({ email: `p${i}@example.com`, status: 'pending', token: String(i).padStart(2, '0').repeat(22).slice(0, 43), created_at: i + 1 })));
  const sender = fakeSendEmail();
  const out = await sweepConfirms(mailEnv(db, sender), { now: THIRTEEN_45Z });
  assert.equal(out.sent, 50);
  const next = await sweepConfirms(mailEnv(db, sender), { now: THIRTEEN_45Z + 1000 });
  assert.equal(next.sent, 3);
}));

const post = (path, body, key) => new Request(`https://x.test${path}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(key === undefined ? {} : { 'X-Morning-Key': key }) },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

test('/send-confirm: 503 key unset, 403 wrong or missing key, 400 bad body, 503 no sender, 202 sent, 200 recent / not-pending, 502 refused', () => withWorker(async ({ worker, logs }) => {
  const KEY = 'morning-internal-key-for-tests';
  const db = new SqliteD1(MIGRATIONS);
  seed(db, [
    { email: ADA, status: 'pending', token: tok('a') },
    { email: BOB, status: 'confirmed', token: tok('b') },
    { email: CAL, status: 'pending', token: tok('c') },
  ]);
  const sender = fakeSendEmail({ failFor: [CAL] });
  const env = mailEnv(db, sender, { MORNING_INTERNAL_KEY: KEY });
  const texts = [];
  const call = async (req, e = env) => { const res = await worker.fetch(req, e); const text = await res.text(); texts.push(text); return { status: res.status, body: JSON.parse(text), headers: res.headers }; };

  assert.deepEqual(await call(post('/send-confirm', { email: ADA }, KEY), mailEnv(db, sender)).then((r) => [r.status, r.body.reason]), [503, 'internal-key-unset']);
  assert.deepEqual(await call(post('/send-confirm', { email: ADA }, 'nope')).then((r) => [r.status, r.body.reason]), [403, 'bad-key']);
  assert.deepEqual(await call(post('/send-confirm', { email: ADA })).then((r) => [r.status, r.body.reason]), [403, 'bad-key']);
  assert.equal(sender.sent.length, 0);

  assert.deepEqual(await call(post('/send-confirm', 'not json', KEY)).then((r) => [r.status, r.body.reason]), [400, 'bad-json']);
  assert.deepEqual(await call(post('/send-confirm', { email: 'nope' }, KEY)).then((r) => [r.status, r.body.reason]), [400, 'invalid-email']);
  assert.deepEqual(await call(post('/send-confirm', { nothing: 1 }, KEY)).then((r) => [r.status, r.body.reason]), [400, 'invalid-email']);
  assert.equal((await call(post('/send-confirm', { email: `${'a'.repeat(2100)}@example.com` }, KEY))).status, 413);

  // Not configured: 503.
  const off = await call(post('/send-confirm', { email: ADA }, KEY), { AUTH_DB: db, MORNING_INTERNAL_KEY: KEY });
  assert.deepEqual([off.status, off.body], [503, { ok: false, reason: 'email-not-configured' }]);
  assert.equal(subRow(db, ADA).confirm_sent_at, null);

  const sentRes = await call(post('/send-confirm', { email: ADA.toUpperCase() }, KEY));
  assert.deepEqual([sentRes.status, sentRes.body], [202, { ok: true, sent: true }]);
  assert.equal(sentRes.headers.get('Cache-Control'), 'no-store');
  assert.equal(sender.sent.length, 1);
  assert.notEqual(subRow(db, ADA).confirm_sent_at, null);

  const recent = await call(post('/send-confirm', { email: ADA }, KEY));
  assert.deepEqual([recent.status, recent.body], [200, { ok: true, sent: false, reason: 'recent' }]);
  assert.equal(sender.sent.length, 1);

  const confirmed = await call(post('/send-confirm', { email: BOB }, KEY));
  assert.deepEqual([confirmed.status, confirmed.body], [200, { ok: true, sent: false, reason: 'not-pending' }]);
  const stranger = await call(post('/send-confirm', { email: 'eve@example.com' }, KEY));
  assert.deepEqual([stranger.status, stranger.body], [200, { ok: true, sent: false, reason: 'not-pending' }]);

  const refused = await call(post('/send-confirm', { email: CAL }, KEY));
  assert.deepEqual([refused.status, refused.body], [502, { ok: false, reason: 'send-failed' }]);
  assert.equal(subRow(db, CAL).confirm_sent_at, null, 'reverted');

  assert.equal((await worker.fetch(new Request('https://x.test/send-confirm'), env)).status, 404, 'GET is not a route');
  assertNoAddress(logs, texts.join('\n'));
}));

test('/run needs the key, defaults to a dry run, and is forced past the 6 AM gate (not past the first edition)', () => withWorker(async ({ worker, logs }) => {
  const KEY = 'morning-internal-key-for-tests';
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const env = mailEnv(db, sender, { MORNING_INTERNAL_KEY: KEY });
  const feed = feedFetch([feedBody()]);

  assert.equal((await worker.fetch(post('/run', {}), mailEnv(db, sender))).status, 503);
  assert.equal((await worker.fetch(post('/run', {}), env)).status, 403);
  assert.equal((await worker.fetch(post('/run', {}, 'wrong'), env)).status, 403);
  assert.equal(feed.calls.length, 0);
  assert.equal(sender.sent.length, 0);

  // 7:45 AM (the cron would skip): forced, and a dry run unless told otherwise.
  const dry = await withGlobalFetch(feed, () => withNow(FOURTEEN_45Z, async () => {
    const res = await worker.fetch(post('/run', {}, KEY), env);
    return { status: res.status, body: await res.json() };
  }));
  assert.equal(dry.status, 200);
  assert.equal(dry.body.dryRun, true);
  assert.equal(dry.body.frozen, true);
  assert.deepEqual([dry.body.attempted, dry.body.sent], [2, 0]);
  assert.equal(sender.sent.length, 0);

  const live = await withGlobalFetch(feed, () => withNow(FOURTEEN_45Z, async () => {
    const res = await worker.fetch(post('/run', { dryRun: false }, KEY), env);
    return { status: res.status, body: await res.json() };
  }));
  assert.equal(live.body.dryRun, false);
  assert.equal(live.body.sent, 2);
  assert.equal(sender.sent.length, 2);

  const early = await withGlobalFetch(feed, () => withNow(OCT2_13_45Z, async () => {
    const res = await worker.fetch(post('/run', { dryRun: false }, KEY), env);
    return { status: res.status, body: await res.json() };
  }));
  assert.equal(early.body.skipped, 'before-first-edition');
  assertNoAddress(logs);
}));

test('scheduled: sends the edition, then sweeps the confirms; a failing step does not stop the other', () => withWorker(async ({ worker, logs }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  seed(db, [{ email: 'eve@example.com', status: 'pending', token: tok('e'), created_at: 9 }]);
  const sender = fakeSendEmail();
  await withGlobalFetch(feedFetch([feedBody()]), () => worker.scheduled({ scheduledTime: THIRTEEN_45Z, cron: '45 13 * * *' }, mailEnv(db, sender), {}));
  const kinds = sender.sent.map((m) => m.subject);
  assert.equal(kinds.filter((s) => s === 'Confirm the PointCast Morning Edition').length, 1);
  assert.equal(sender.sent.filter((m) => m.to === ADA || m.to === BOB).length, 2);
  assert.equal(sender.sent.findIndex((m) => m.subject === 'Confirm the PointCast Morning Edition'), 2, 'the edition goes first, the sweep after');
  assert.equal(runRows(db).length, 1);

  // 14:45Z: the sweep runs, the edition step skips.
  const db2 = new SqliteD1(MIGRATIONS);
  seed(db2, [{ email: 'eve@example.com', status: 'pending', token: tok('e') }]);
  const sender2 = fakeSendEmail();
  await withGlobalFetch(feedFetch([feedBody()]), () => worker.scheduled({ scheduledTime: FOURTEEN_45Z, cron: '45 14 * * *' }, mailEnv(db2, sender2), {}));
  assert.equal(sender2.sent.length, 1);
  assert.equal(runRows(db2).length, 0);

  // A database that throws: neither step rejects, and the log has no address.
  const broken = { prepare() { throw new Error('D1_ERROR: no such table for ada@example.com'); } };
  await withGlobalFetch(feedFetch([feedBody()]), () => worker.scheduled({ scheduledTime: THIRTEEN_45Z, cron: '45 13 * * *' }, mailEnv(broken, fakeSendEmail()), {}));
  assert.ok(logs.some((l) => l.includes('morning confirm sweep failed')));
  assert.ok(logs.some((l) => l.includes('morning daily failed')));
  assertNoAddress(logs);
}));

/** A SqliteD1 whose statements throw when `when(sql, args)` says so. */
function flakyD1(migrations, when) {
  const db = new SqliteD1(migrations);
  const prepare = db.prepare.bind(db);
  db.prepare = (sql) => {
    const stmt = prepare(sql);
    let bound = [];
    const bind = stmt.bind;
    stmt.bind = (...v) => { bound = v; bind(...v); return stmt; };
    for (const k of ['run', 'all', 'first']) {
      const fn = stmt[k];
      stmt[k] = async () => { if (when(sql, bound)) throw new Error('D1_ERROR: network connection lost for ' + (bound.find((b) => typeof b === 'string' && b.includes('@')) ?? '')); return fn(); };
    }
    return stmt;
  };
  return db;
}

test('a D1 error on one subscriber counts as failed and the loop goes on, and the run row is still written', () => withWorker(async ({ runMorningDaily, logs }) => {
  const db = flakyD1(MIGRATIONS, (sql, args) => /SET last_sent_day = \?/.test(sql) && args.includes(ADA));
  seed(db, [
    { email: ADA, status: 'confirmed', token: tok('a'), confirmed_at: 10 },
    { email: BOB, status: 'confirmed', token: tok('b'), confirmed_at: 20 },
    { email: CAL, status: 'confirmed', token: tok('c'), confirmed_at: 30 },
  ]);
  const sender = fakeSendEmail();
  const result = await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.deepEqual([result.attempted, result.sent, result.failed], [3, 2, 1]);
  assert.deepEqual(sender.sent.map((m) => m.to), [BOB, CAL], 'the subscribers after the failure still get the paper');
  const [run] = runRows(db);
  assert.deepEqual([run.reason, run.sent, run.failed, run.frozen], [null, 2, 1, 1]);
  assert.ok(logs.some((l) => l.includes('morning daily claim failed')));
  assertNoAddress(logs);
}));

test('a restore that throws is logged and the loop goes on', () => withWorker(async ({ runMorningDaily, logs }) => {
  const db = flakyD1(MIGRATIONS, (sql) => /WHERE email = \? AND last_sent_day = \?/.test(sql));
  seed(db, [
    { email: ADA, status: 'confirmed', token: tok('a'), confirmed_at: 10 },
    { email: BOB, status: 'confirmed', token: tok('b'), confirmed_at: 20 },
  ]);
  const sender = fakeSendEmail({ failFor: [ADA] });
  const result = await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.deepEqual([result.sent, result.failed], [1, 1]);
  assert.deepEqual(sender.sent.map((m) => m.to), [BOB]);
  assert.ok(logs.some((l) => l.includes('morning daily restore failed')));
  assertNoAddress(logs);
}));

test('a run leaves a started row before it reads, so a run that dies is on record', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const dying = async () => { throw new Error('killed'); };
  await assert.rejects(runMorningDaily(mailEnv(db), { now: THIRTEEN_45Z, fetch: feedFetch([503]), sleep: dying }));
  const [run] = runRows(db);
  assert.deepEqual([run.reason, run.finished_at, run.frozen, run.sent], ['started', null, 0, 0]);
}));

test('the send loop stops at the deadline (out-of-time), and the 14:45Z tick the same day finishes it once', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const sender = fakeSendEmail();
  const first = await runMorningDaily(mailEnv(db, sender), { now: THIRTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep, deadline: Date.now() - 1 });
  assert.equal(first.reason, 'out-of-time');
  assert.equal(sender.sent.length, 0);
  assert.equal(subRow(db, ADA).last_sent_day, null, 'nobody is claimed past the deadline');
  assert.equal(runRows(db)[0].reason, 'out-of-time');

  const later = await runMorningDaily(mailEnv(db, sender), { now: FOURTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.equal(later.skipped, undefined, 'a cut-short day is finished at 7:45 AM');
  assert.deepEqual(sender.sent.map((m) => m.to).sort(), [ADA, BOB]);
  const [run] = runRows(db);
  assert.deepEqual([run.reason, run.sent, run.frozen], [null, 2, 1]);

  const again = await runMorningDaily(mailEnv(db, sender), { now: FOURTEEN_45Z + 1000, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.equal(again.skipped, 'not-6am', 'a finished day is left alone');
  assert.equal(sender.sent.length, 2);
}));

test('the 14:45Z tick retries sends that failed at 6:45 and leaves a good morning alone', () => withWorker(async ({ runMorningDaily }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  await runMorningDaily(mailEnv(db, fakeSendEmail({ failFor: [ADA] })), { now: THIRTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  const healthy = fakeSendEmail();
  const retry = await runMorningDaily(mailEnv(db, healthy), { now: FOURTEEN_45Z, fetch: feedFetch([feedBody()]), sleep: recorder().sleep });
  assert.deepEqual(healthy.sent.map((m) => m.to), [ADA]);
  assert.equal(retry.sent, 1);
  const [run] = runRows(db);
  assert.deepEqual([run.attempted, run.sent, run.failed, run.reason], [3, 2, 0, null]);
}));

test('a forced real /run after a good morning keeps the day\'s counts and reason', () => withWorker(async ({ runMorningDaily, mergeRun }) => {
  const db = new SqliteD1(MIGRATIONS);
  standardList(db);
  const deps = { fetch: feedFetch([feedBody()]), sleep: recorder().sleep };
  await runMorningDaily(mailEnv(db), { now: THIRTEEN_45Z, ...deps });
  const forced = await runMorningDaily(mailEnv(db), { now: THIRTEEN_45Z + 3_600_000, dryRun: false, force: true, ...deps });
  assert.equal(forced.reason, 'no-subscribers', 'the run itself reached nobody');
  let [run] = runRows(db);
  assert.deepEqual([run.sent, run.attempted, run.reason, run.frozen], [2, 2, null, 1], 'the day still says 2 sent');
  // A forced run whose read fails does not unfreeze the day.
  await runMorningDaily(mailEnv(db), { now: THIRTEEN_45Z + 3_600_000, dryRun: false, force: true, fetch: feedFetch([503]), sleep: recorder().sleep });
  [run] = runRows(db);
  assert.deepEqual([run.sent, run.reason, run.frozen], [2, null, 1]);
  // The merge rule on its own.
  const base = { day: DAY, edition_number: 16, frozen: 1, reason: null, started_at: 5, finished_at: 6, attempted: 10, sent: 8, failed: 2, dry_run: 0, configured: 1 };
  const retry = { ...base, started_at: 9, finished_at: 10, attempted: 2, sent: 2, failed: 0 };
  assert.deepEqual(mergeRun(base, retry), { ...base, finished_at: 10, attempted: 12, sent: 10, failed: 0 });
  assert.equal(mergeRun(base, { ...retry, dry_run: 1 }), null, 'a dry run never touches a real row');
  assert.deepEqual(mergeRun({ ...base, dry_run: 1 }, retry), retry, 'a real run replaces a dry one');
}));

test('sweepConfirms: a refused row goes behind newer signups, stops after 5 tries, and is pruned 30 days after its last try', () => withWorker(async ({ sweepConfirms }) => {
  const db = new SqliteD1(MIGRATIONS);
  const bad = 'bad@example.com';
  seed(db, [{ email: bad, status: 'pending', token: tok('x'), created_at: 1 }]);
  const refusing = fakeSendEmail({ failFor: [bad] });
  const day = 86_400_000;
  await sweepConfirms(mailEnv(db, refusing), { now: THIRTEEN_45Z });
  assert.deepEqual([subRow(db, bad).confirm_attempts, subRow(db, bad).confirm_last_attempt_at], [1, THIRTEEN_45Z]);
  // A newer signup is mailed before the refused row is tried again.
  seed(db, [{ email: ADA, status: 'pending', token: tok('a'), created_at: 50 }]);
  const order = [];
  const watching = { async send(m) { order.push(m.to); if (m.to === bad) throw new Error('E_SEND_REFUSED'); return { messageId: 'm' }; } };
  await sweepConfirms(mailEnv(db, watching), { now: THIRTEEN_45Z + day });
  assert.deepEqual(order, [ADA, bad], 'never-tried rows first');
  for (let i = 2; i <= 6; i += 1) await sweepConfirms(mailEnv(db, refusing), { now: THIRTEEN_45Z + i * day });
  assert.equal(subRow(db, bad).confirm_attempts, 5, 'given up after 5');
  const lastTry = subRow(db, bad).confirm_last_attempt_at;
  assert.equal((await sweepConfirms(mailEnv(db, refusing), { now: lastTry + day })).failed, 0, 'no sixth try');
  assert.ok(subRow(db, bad), 'kept for 30 days after the last try');
  const pruned = await sweepConfirms({ AUTH_DB: db }, { now: lastTry + 31 * day });
  assert.equal(pruned.pruned, 2, 'the given-up row, and ADA, whose mail went out 30+ days before');
  assert.equal(subRow(db, bad), null);
}));

test('sweepConfirms stops at the deadline', () => withWorker(async ({ sweepConfirms }) => {
  const db = new SqliteD1(MIGRATIONS);
  seed(db, [{ email: ADA, status: 'pending', token: tok('a') }]);
  const sender = fakeSendEmail();
  const out = await sweepConfirms(mailEnv(db, sender), { now: THIRTEEN_45Z, deadline: Date.now() - 1 });
  assert.equal(out.sent, 0);
  assert.equal(sender.sent.length, 0);
  assert.equal(subRow(db, ADA).confirm_sent_at, null);
}));

test('anything else is a 404', () => withWorker(async ({ worker }) => {
  const env = { AUTH_DB: new SqliteD1(MIGRATIONS) };
  assert.equal((await worker.fetch(new Request('https://x.test/nope'), env)).status, 404);
  assert.equal((await worker.fetch(new Request('https://x.test/status', { method: 'POST' }), env)).status, 404);
  assert.equal((await worker.fetch(new Request('https://x.test/run'), env)).status, 404);
}));

test('the wrangler config matches the spec', async () => {
  const toml = await read('workers/morning-daily/wrangler.toml');
  assert.match(toml, /^name = "pointcast-morning-daily"$/mu);
  assert.match(toml, /^crons = \["45 13 \* \* \*", "45 14 \* \* \*"\]$/mu);
  assert.match(toml, /^MORNING_DAILY_DRY_RUN = "false"$/mu);
  assert.match(toml, /^MORNING_SEND_EMAIL_READY = "false"$/mu);
  assert.match(toml, /^MORNING_EDITION_URL = "https:\/\/pointcast\.xyz\/morning\.json"$/mu);
  assert.match(toml, /database_id = "15de417a-2167-45e6-a7aa-340a7a99331c"/u);
  assert.match(toml, /allowed_sender_addresses = \["morning@pointcast\.xyz"\]/u);
  assert.ok(!/^\s*(MORNING_INTERNAL_KEY|RESEND_API_KEY)\s*=/mu.test(toml), 'secrets are comments only');
  const pkg = JSON.parse(await read('workers/morning-daily/package.json'));
  assert.equal(pkg.name, 'pointcast-morning-daily');
});

test('every SQL statement in the Worker is one string literal bound with .bind(', async () => {
  for (const file of ['run.ts', 'index.ts']) {
    const src = await read(`workers/morning-daily/src/${file}`);
    assert.ok(!/\.exec\(/u.test(src), `${file}: no .exec(`);
    assert.ok(!/prepare\(\s*`/u.test(src), `${file}: no template-literal SQL`);
  }
  const run = await read('workers/morning-daily/src/run.ts');
  const prepares = [...run.matchAll(/\.prepare\(\s*(['"])/gu)];
  const binds = [...run.matchAll(/\)\.bind\(/gu)];
  assert.ok(prepares.length > 0);
  assert.ok(binds.length >= prepares.length, 'a bind per prepare');
});
