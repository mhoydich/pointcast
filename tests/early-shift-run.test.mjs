import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createServer } from 'vite';

// The Early Shift Worker (docs/plans/2026-09-28-early-shift-desk-spec.md §4,
// group W): workers/early-shift/src/{index.ts,shift.ts} loaded through vite
// (they import extensionless TS siblings — src/lib/marine-oracle,
// src/lib/sky — that plain node can't resolve, same reason
// tests/marine-oracle.test.mjs and tests/daily-status.test.mjs use it) over
// the SqliteD1 fake tests/air-assign-api.test.mjs and tests/air-api.test.mjs
// share (migrations 0001 + 0023 + 0024 + 0025), with a fake fetch standing
// in for AWC, CO-OPS, NDBC and AirNow.

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const MIGRATIONS = (await Promise.all(
  ['0001_init.sql', '0023_air.sql', '0024_air_assignments.sql', '0025_air_desk.sql'].map((f) => read(`migrations/auth/${f}`)),
)).join('\n');

/** D1 over node:sqlite — the same fake tests/air-assign-api.test.mjs and tests/air-api.test.mjs use. */
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

/** index.ts's own fetch()/scheduled() handlers call the module-global `fetch` (the standard Workers contract has no deps parameter to inject one) — swap it in for the call, always restoring it, so these tests never reach the real network. runEarlyShift itself takes an explicit `deps.fetch`, tested directly above without this. */
async function withGlobalFetch(fetchFn, run) {
  const original = globalThis.fetch;
  globalThis.fetch = fetchFn;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

/** POST /run reads the clock itself (Date.now()): pin it for the call, always restoring it. */
async function withNow(ms, run) {
  const original = Date.now;
  Date.now = () => ms;
  try {
    return await run();
  } finally {
    Date.now = original;
  }
}

async function withWorker(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const shift = await server.ssrLoadModule('/workers/early-shift/src/shift.ts');
    const worker = await server.ssrLoadModule('/workers/early-shift/src/index.ts');
    return await run({ runEarlyShift: shift.runEarlyShift, worker: worker.default });
  } finally {
    await server.close();
  }
}

// 2026-09-28 is PDT (UTC-7): 13:00Z = 6:00 AM LA (the shift's hour), 14:00Z = 7:00 AM LA (not).
const SIX_AM_LA = Date.parse('2026-09-28T13:00:00Z');
const SEVEN_AM_LA = Date.parse('2026-09-28T14:00:00Z');

const AWC_URL_HOST = 'aviationweather.gov';
const TIDES_URL_HOST = 'api.tidesandcurrents.noaa.gov';
const NDBC_URL_HOST = 'www.ndbc.noaa.gov';
const AIRNOW_URL_HOST = 'airnowapi.org';

/** A METAR body, freshly observed relative to `atMs`: clear, 10 miles. */
function skyBody(atMs) {
  return JSON.stringify([{ metarType: 'METAR', obsTime: Math.floor((atMs - 5 * 60_000) / 1000), visib: '10+', wxString: null, clouds: [] }]);
}
function tidesBody(atMs) {
  const ahead = new Date(atMs + 90 * 60_000).toISOString().slice(0, 16).replace('T', ' ');
  return JSON.stringify({ predictions: [{ t: ahead, v: '5.1', type: 'H' }] });
}
const NDBC_BODY = [
  '#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE',
  '#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi    hPa    ft',
  '2026 09 28 12 55 999 99.0 99.0    0.6  13.0   6.8 160 9999.0  99.0  23.1  99.0 99.0 99.00 99.00',
].join('\n');
function airNowBody(atMs) {
  const d = new Date(atMs);
  const day = d.toISOString().slice(0, 10);
  const hour = d.getUTCHours() - 7; // PDT, matches this fixture's fixed September date
  return JSON.stringify([{ DateObserved: day, HourObserved: hour, ParameterName: 'PM2.5', AQI: 42, Category: { Number: 1, Name: 'Good' } }]);
}

/** A fetch fake: routes by hostname, records every call, and lets a test fail one host on demand. */
function fakeFetch({ fail = new Set(), atMs = SIX_AM_LA } = {}) {
  const calls = [];
  const fn = async (input) => {
    const url = String(input);
    calls.push(url);
    const host = new URL(url).hostname;
    if (fail.has(host)) return { ok: false, status: 503, async text() { return ''; } };
    if (host === AWC_URL_HOST) return { ok: true, async text() { return skyBody(atMs); } };
    if (host === TIDES_URL_HOST) return { ok: true, async text() { return tidesBody(atMs); } };
    if (host === NDBC_URL_HOST) return { ok: true, async text() { return NDBC_BODY; } };
    if (host === AIRNOW_URL_HOST) return { ok: true, async text() { return airNowBody(atMs); } };
    return { ok: false, status: 404, async text() { return ''; } };
  };
  fn.calls = calls;
  return fn;
}

const feedRow = (db, feed, day = '2026-09-28') => db.rows('SELECT * FROM air_shift_feeds WHERE day = ? AND feed = ?', day, feed)[0] ?? null;

test('runEarlyShift files sky/tides/swell/sun and gaps air with no key, all in one pass', () => withWorker(async ({ runEarlyShift }) => {
  const db = new SqliteD1(MIGRATIONS);
  const env = { AUTH_DB: db };
  const result = await runEarlyShift(env, { fetch: fakeFetch({ atMs: SIX_AM_LA }) }, SIX_AM_LA);
  assert.equal(result.ok, true);
  const byFeed = Object.fromEntries(result.feeds.map((f) => [f.feed, f]));
  assert.equal(byFeed.sky.outcome, 'filed');
  assert.equal(byFeed.tides.outcome, 'filed');
  assert.equal(byFeed.swell.outcome, 'filed');
  assert.equal(byFeed.sun.outcome, 'filed');
  assert.equal(byFeed.air.outcome, 'gap');
  assert.equal(byFeed.air.reason, 'blocked');
  assert.equal(result.airnowKey, false);

  const reports = db.rows('SELECT spot, kind, source FROM air_reports');
  assert.equal(reports.length, 4); // sky, tides, swell, sun — never air (blocked)
  assert.ok(reports.every((r) => r.spot === 'beach' && r.source.startsWith('agent:')));
}));

test('no key means air is blocked, and the AirNow host is never even called', () => withWorker(async ({ runEarlyShift }) => {
  const db = new SqliteD1(MIGRATIONS);
  const fetch = fakeFetch({ atMs: SIX_AM_LA });
  await runEarlyShift({ AUTH_DB: db }, { fetch }, SIX_AM_LA);
  assert.ok(!fetch.calls.some((u) => u.includes('airnowapi.org')));
  assert.equal(feedRow(db, 'air').reason, 'blocked');
}));

test('with a key, the air row files, and no stored source_url holds it', () => withWorker(async ({ runEarlyShift }) => {
  const db = new SqliteD1(MIGRATIONS);
  const env = { AUTH_DB: db, AIRNOW_API_KEY: 'super-secret-key-do-not-leak' };
  const result = await runEarlyShift(env, { fetch: fakeFetch({ atMs: SIX_AM_LA }) }, SIX_AM_LA);
  const air = result.feeds.find((f) => f.feed === 'air');
  assert.equal(air.outcome, 'filed');
  const row = db.rows('SELECT source_url FROM air_reports WHERE kind = ?', 'aqi')[0];
  assert.ok(row);
  assert.ok(!row.source_url.includes('super-secret-key-do-not-leak'));
  assert.ok(!row.source_url.includes('API_KEY'));
  assert.equal(row.source_url, 'https://www.airnow.gov/?city=El%20Segundo&state=CA&country=USA');

  // and every stored URL across every feed — sky/tides/swell/sun too.
  const all = db.rows("SELECT source_url FROM air_reports WHERE spot = 'beach'");
  assert.ok(all.every((r) => !r.source_url.includes('super-secret-key-do-not-leak')));
}));

test('a re-run upgrades a gap to filed, and never files an already-filed feed twice', () => withWorker(async ({ runEarlyShift }) => {
  const db = new SqliteD1(MIGRATIONS);
  const env = { AUTH_DB: db };
  // Run 1: sky's upstream fails.
  const first = await runEarlyShift(env, { fetch: fakeFetch({ atMs: SIX_AM_LA, fail: new Set([AWC_URL_HOST]) }) }, SIX_AM_LA);
  assert.equal(first.feeds.find((f) => f.feed === 'sky').outcome, 'gap');
  assert.equal(first.feeds.find((f) => f.feed === 'sky').reason, 'upstream');
  assert.equal(feedRow(db, 'tides').outcome, 'filed');
  const tidesAtFirst = feedRow(db, 'tides').at;
  const reportsAfterFirst = db.rows('SELECT id FROM air_reports').length;

  // Run 2, a minute later: sky's upstream now answers, tides' upstream still would (differently) — but tides already filed.
  const laterMs = SIX_AM_LA + 60_000;
  const second = await runEarlyShift(env, { fetch: fakeFetch({ atMs: laterMs }) }, laterMs);
  const sky2 = second.feeds.find((f) => f.feed === 'sky');
  assert.equal(sky2.outcome, 'filed');
  assert.equal(feedRow(db, 'sky').reason, null);
  assert.equal(feedRow(db, 'sky').report_id, sky2.reportId);

  // tides was already filed: the second run's upsert must not touch it, and no second report was inserted for it.
  assert.equal(feedRow(db, 'tides').at, tidesAtFirst);
  const reportsAfterSecond = db.rows('SELECT id FROM air_reports').length;
  assert.equal(reportsAfterSecond, reportsAfterFirst + 1); // only sky's new row
  assert.equal(db.rows("SELECT COUNT(*) AS n FROM air_reports WHERE kind = 'tide'")[0].n, 1);
  // The result reads the stored row back: the morning's own tides report and time, not a report id this run never wrote.
  const tides2 = second.feeds.find((f) => f.feed === 'tides');
  assert.deepEqual([tides2.outcome, tides2.reportId, tides2.at, tides2.fresh], ['filed', feedRow(db, 'tides').report_id, tidesAtFirst, false]);
  assert.equal(sky2.fresh, true);
  for (const f of second.feeds) if (f.reportId) assert.equal(db.rows('SELECT COUNT(*) AS n FROM air_reports WHERE id = ?', f.reportId)[0].n, 1, `${f.feed} names a real report`);
}));

test('EARLY_SHIFT_DRY_RUN "true" reads every feed but writes nothing: no report, no shift row, no sweep', () => withWorker(async ({ runEarlyShift }) => {
  const db = new SqliteD1(MIGRATIONS);
  db.db.prepare(`INSERT INTO air_calls (id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at, relay_json)
    VALUES ('ac_stale000000000000000', 'courts', 'sign', 'sol', 'sol', 'ar_x', '2026-09-26', 'open', ?, ?, '[]')`).run(SIX_AM_LA - 49 * 3_600_000, SIX_AM_LA - 3_600_000);
  const fetch = fakeFetch({ atMs: SIX_AM_LA });
  const result = await runEarlyShift({ AUTH_DB: db, EARLY_SHIFT_DRY_RUN: 'true' }, { fetch }, SIX_AM_LA);
  assert.equal(result.dryRun, true);
  assert.deepEqual(result.feeds.map((f) => [f.feed, f.outcome]), [['sky', 'filed'], ['tides', 'filed'], ['swell', 'filed'], ['sun', 'filed'], ['air', 'gap']]);
  assert.ok(result.feeds.every((f) => f.reportId === null), 'a dry run names no report');
  assert.equal(fetch.calls.length, 3, 'sky, tides and swell were still read');
  assert.equal(db.rows('SELECT COUNT(*) AS n FROM air_reports')[0].n, 0);
  assert.equal(db.rows('SELECT COUNT(*) AS n FROM air_shift_feeds')[0].n, 0);
  assert.equal(db.rows('SELECT status FROM air_calls')[0].status, 'open', 'the sweep is a write too');
}));

test('no points or stamps are ever written for an agent row', () => withWorker(async ({ runEarlyShift }) => {
  const db = new SqliteD1(MIGRATIONS);
  await runEarlyShift({ AUTH_DB: db, AIRNOW_API_KEY: 'k' }, { fetch: fakeFetch({ atMs: SIX_AM_LA }) }, SIX_AM_LA);
  assert.equal(db.rows('SELECT * FROM air_points').length, 0);
  assert.equal(db.rows('SELECT * FROM air_stamps').length, 0);
  assert.ok(db.rows('SELECT awarded_at FROM air_reports').every((r) => r.awarded_at === null));
}));

test('the Worker scheduled() handler: two crons on one morning file the shift exactly once', () => withWorker(async ({ worker }) => {
  const db = new SqliteD1(MIGRATIONS);
  const fetch = fakeFetch({ atMs: SIX_AM_LA });
  const env = { AUTH_DB: db, EARLY_SHIFT_DRY_RUN: 'false' };
  await withGlobalFetch(fetch, async () => {
    await worker.scheduled({ scheduledTime: SIX_AM_LA, cron: '0 13 * * *' }, env, {});
    await worker.scheduled({ scheduledTime: SEVEN_AM_LA, cron: '0 14 * * *' }, env, {});
  });
  const skyRows = db.rows("SELECT * FROM air_shift_feeds WHERE feed = 'sky'");
  assert.equal(skyRows.length, 1); // one day, one row — the 7 AM trigger touched nothing
  assert.equal(skyRows[0].outcome, 'filed');
  assert.equal(fetch.calls.filter((u) => u.includes('aviationweather.gov')).length, 1);
}));

test('a scheduled trigger outside the 6 AM LA hour skips and calls no upstream at all', () => withWorker(async ({ worker }) => {
  const db = new SqliteD1(MIGRATIONS);
  const fetch = fakeFetch({ atMs: SEVEN_AM_LA });
  await withGlobalFetch(fetch, () => worker.scheduled({ scheduledTime: SEVEN_AM_LA, cron: '0 14 * * *' }, { AUTH_DB: db, EARLY_SHIFT_DRY_RUN: 'false' }, {}));
  assert.equal(fetch.calls.length, 0);
  assert.equal(db.rows('SELECT * FROM air_shift_feeds').length, 0);
}));

test('POST /run is resident-only: 503 unset, 403 wrong, and a forced run works at any hour after the cut', () => withWorker(async ({ worker }) => {
  const db = new SqliteD1(MIGRATIONS);
  const req = (headers, body) => new Request('https://early-shift.internal/run', { method: 'POST', headers, body: JSON.stringify(body) });
  const TWO_PM_LA = Date.parse('2026-09-28T21:00:00Z');
  const fetch = fakeFetch({ atMs: TWO_PM_LA });

  const unset = await worker.fetch(req({}, { force: true }), { AUTH_DB: db, EARLY_SHIFT_DRY_RUN: 'false' });
  assert.equal(unset.status, 503);
  assert.equal((await unset.json()).reason, 'resident-key-unset');

  const wrong = await worker.fetch(req({ 'X-Yard-Resident': 'nope' }, { force: true }), { AUTH_DB: db, EARLY_SHIFT_DRY_RUN: 'false', YARD_RESIDENT_KEY: 'dev' });
  assert.equal(wrong.status, 403);
  assert.equal((await wrong.json()).reason, 'not-a-resident');

  const ok = await withNow(TWO_PM_LA, () => withGlobalFetch(fetch, () => worker.fetch(req({ 'X-Yard-Resident': 'dev' }, { force: true }), { AUTH_DB: db, EARLY_SHIFT_DRY_RUN: 'false', YARD_RESIDENT_KEY: 'dev' })));
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.equal(body.ran, true);
  assert.equal(db.rows('SELECT * FROM air_shift_feeds').length, 5);
}));

test('POST /run before the on-time cut answers 409 too-early, forced or not, and the 6 AM cron still files fresh', () => withWorker(async ({ worker }) => {
  const db = new SqliteD1(MIGRATIONS);
  const env = { AUTH_DB: db, EARLY_SHIFT_DRY_RUN: 'false', YARD_RESIDENT_KEY: 'dev' };
  const post = (body) => new Request('https://early-shift.internal/run', { method: 'POST', headers: { 'X-Yard-Resident': 'dev' }, body: JSON.stringify(body) });
  const HALF_PAST_MIDNIGHT_LA = Date.parse('2026-09-28T07:30:00Z');
  const TEN_PAST_SIX_LA = Date.parse('2026-09-28T13:10:00Z');
  const fetch = fakeFetch({ atMs: HALF_PAST_MIDNIGHT_LA });
  for (const [at, body] of [[HALF_PAST_MIDNIGHT_LA, { force: true }], [TEN_PAST_SIX_LA, { force: true }], [TEN_PAST_SIX_LA, {}]]) {
    const res = await withNow(at, () => withGlobalFetch(fetch, () => worker.fetch(post(body), env)));
    assert.equal(res.status, 409);
    const json = await res.json();
    assert.deepEqual([json.ok, json.ran, json.reason, json.after], [false, false, 'too-early', '2026-09-28T13:15:00Z']);
  }
  assert.equal(fetch.calls.length, 0, 'a refused re-run reads no upstream');
  assert.equal(db.rows('SELECT COUNT(*) AS n FROM air_shift_feeds')[0].n, 0);
  assert.equal(db.rows('SELECT COUNT(*) AS n FROM air_reports')[0].n, 0);

  // The 6 AM cron then files the morning itself, fresh, on time.
  await withGlobalFetch(fakeFetch({ atMs: SIX_AM_LA }), () => worker.scheduled({ scheduledTime: SIX_AM_LA, cron: '0 13 * * *' }, env, {}));
  assert.equal(feedRow(db, 'sky').outcome, 'filed');
  assert.equal(feedRow(db, 'sky').at, SIX_AM_LA);
}));

test('a late re-run over a blocked Air gap files the reading once but leaves the morning blocked (never the keeper\'s late morning)', () => withWorker(async ({ runEarlyShift }) => {
  const db = new SqliteD1(MIGRATIONS);
  await runEarlyShift({ AUTH_DB: db }, { fetch: fakeFetch({ atMs: SIX_AM_LA }) }, SIX_AM_LA);
  assert.equal(feedRow(db, 'air').reason, 'blocked');

  // The key lands at 2 PM; a resident re-run checks it.
  const TWO_PM_LA = Date.parse('2026-09-28T21:00:00Z');
  const env = { AUTH_DB: db, AIRNOW_API_KEY: 'k' };
  const later = await runEarlyShift(env, { fetch: fakeFetch({ atMs: TWO_PM_LA }) }, TWO_PM_LA);
  const air = later.feeds.find((f) => f.feed === 'air');
  assert.deepEqual([air.outcome, air.reason, air.fresh], ['gap', 'blocked', false]);
  assert.ok(air.lateReportId, 'the late reading is named');
  assert.equal(feedRow(db, 'air').outcome, 'gap');
  assert.equal(feedRow(db, 'air').reason, 'blocked');
  const aqi = db.rows("SELECT id, source FROM air_reports WHERE kind = 'aqi'");
  assert.deepEqual(aqi.map((r) => [r.id, r.source]), [[air.lateReportId, 'agent:frog']], 'the reading files and shows on the board');

  // Another re-run that afternoon files nothing new.
  const THREE_PM_LA = TWO_PM_LA + 3_600_000;
  const again = await runEarlyShift(env, { fetch: fakeFetch({ atMs: THREE_PM_LA }) }, THREE_PM_LA);
  assert.equal(again.feeds.find((f) => f.feed === 'air').lateReportId, undefined);
  assert.equal(db.rows("SELECT COUNT(*) AS n FROM air_reports WHERE kind = 'aqi'")[0].n, 1);
  assert.equal(db.rows('SELECT COUNT(*) AS n FROM air_reports')[0].n, 5, 'sky/tides/swell/sun from 6 AM, air once');
}));

test('a blocked gap is still upgraded when the key is there before the cut', () => withWorker(async ({ runEarlyShift }) => {
  const db = new SqliteD1(MIGRATIONS);
  db.db.prepare(`INSERT INTO air_shift_feeds (day, feed, agent, outcome, reason, report_id, at) VALUES ('2026-09-28', 'air', 'frog', 'gap', 'blocked', NULL, ?)`).run(SIX_AM_LA - 60_000);
  const res = await runEarlyShift({ AUTH_DB: db, AIRNOW_API_KEY: 'k' }, { fetch: fakeFetch({ atMs: SIX_AM_LA }) }, SIX_AM_LA);
  const air = res.feeds.find((f) => f.feed === 'air');
  assert.deepEqual([air.outcome, air.fresh], ['filed', true]);
  assert.equal(feedRow(db, 'air').outcome, 'filed');
}));

test('one D1 failure costs only its own feed: the sweep and the other feeds still run, and the failed one is flagged', () => withWorker(async ({ runEarlyShift }) => {
  const db = new SqliteD1(MIGRATIONS);
  // Fail the sweep and the tides write (the only batch whose insert binds feed 'tides').
  const flaky = {
    prepare(sql) {
      if (/UPDATE air_calls/.test(sql)) return { bind() { return this; }, async run() { throw new Error('D1_ERROR: sweep'); } };
      return db.prepare(sql);
    },
    async batch(stmts) {
      if (stmts.some((st) => st.args?.includes?.('tides'))) throw new Error('D1_ERROR: tides');
      return db.batch(stmts);
    },
  };
  // SqliteD1's statements keep their binds private: expose them for the fake's check above.
  const origPrepare = db.prepare.bind(db);
  db.prepare = (sql) => { const st = origPrepare(sql); const bind = st.bind; st.bind = (...v) => { st.args = v; return bind(...v); }; return st; };
  const errors = [];
  const origError = console.error;
  console.error = (line) => errors.push(String(line));
  let res;
  try {
    res = await runEarlyShift({ AUTH_DB: flaky }, { fetch: fakeFetch({ atMs: SIX_AM_LA }) }, SIX_AM_LA);
  } finally {
    console.error = origError;
  }
  const byFeed = Object.fromEntries(res.feeds.map((f) => [f.feed, f]));
  assert.equal(byFeed.tides.error, true);
  assert.equal(byFeed.tides.reportId, null);
  for (const feed of ['sky', 'swell', 'sun']) assert.equal(feedRow(db, feed).outcome, 'filed', `${feed} still filed`);
  assert.equal(feedRow(db, 'air').reason, 'blocked');
  assert.equal(feedRow(db, 'tides'), null, 'nothing recorded for the failed feed');
  assert.ok(errors.some((e) => e.includes('"feed":"tides"')), 'logged with the feed id');
  assert.ok(errors.some((e) => e.includes('sweep')), 'the sweep failure is logged, not thrown');
}));

test('/status reports today\'s feeds and whether the AirNow key is set, never the key itself', () => withWorker(async ({ worker }) => {
  const db = new SqliteD1(MIGRATIONS);
  const res = await worker.fetch(new Request('https://early-shift.internal/status'), { AUTH_DB: db, EARLY_SHIFT_DRY_RUN: 'false', AIRNOW_API_KEY: 'super-secret-key' });
  const body = await res.json();
  assert.equal(body.airnowKey, true);
  assert.equal(JSON.stringify(body).includes('super-secret-key'), false);
  assert.deepEqual(body.cron, ['0 13 * * *', '0 14 * * *']);
}));
