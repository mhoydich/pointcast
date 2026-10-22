import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test, { after, mock } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

import config from '../src/data/air-spots.json' with { type: 'json' };
import { guestByline, pidHash } from '../functions/_lib/air-kinds.mjs';
import { HOUSE_SELECT, squash } from '../functions/_lib/air-house.mjs';
import { FOOTER_LINE, SHOP_DISCLOSURE, cutoffMs, todaysCourtsLine, todaysSessions } from '../functions/_lib/morning.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const SOURCES = 'functions/_lib/morning-sources.ts';
const ROUTE = 'functions/morning.json.ts';
const XML_ROUTE = 'functions/morning.xml.ts';
const src = { [SOURCES]: await read(SOURCES), [ROUTE]: await read(ROUTE), [XML_ROUTE]: await read(XML_ROUTE) };

/* ---------- source contract ---------- */

test('morning source: D1 through prepared statements with bound values only, never SQL built from strings', () => {
  for (const file of [SOURCES, ROUTE, XML_ROUTE]) {
    const text = src[file];
    const prepares = text.split('.prepare(').length - 1;
    const bound = [...text.matchAll(/\.prepare\(\s*(`[^`]*`|'[^']*'|"[^"]*")\s*\)\s*\.bind\(/g)];
    assert.equal(bound.length, prepares, `${file}: every .prepare( takes a literal and is followed by .bind(`);
    for (const [, sql] of bound) assert.ok(!sql.includes('${'), `${file}: no interpolated SQL: ${sql.slice(0, 60)}`);
    assert.doesNotMatch(text, /\.exec\(/, `${file}: no exec`);
  }
  assert.doesNotMatch(src[ROUTE], /\.prepare\(/, 'the route has no SQL of its own');
  assert.doesNotMatch(src[XML_ROUTE], /\.prepare\(/, 'nor has the RSS route');
});

test('morning source: no device or network hash outside SQL, and none in the route', () => {
  assert.doesNotMatch(src[ROUTE], /pid_hash|ip_hash|pidHash|ipHash/);
  const outsideSql = src[SOURCES].replace(/\.prepare\(\s*(`[^`]*`|'[^']*')\s*\)/g, '.prepare(SQL)');
  assert.doesNotMatch(outsideSql, /pid_hash|ip_hash|pidHash|ipHash|guestByline/, 'rows are handed to momentOf, never read for their hashes');
  // Report rows only ever reach momentOf (and the card lookup for confirmers' bylines).
  const moments = src[SOURCES].slice(src[SOURCES].indexOf('export async function reportMoments'), src[SOURCES].indexOf('/* ---------- town'));
  const calls = [...moments.matchAll(/[\w.]+\([^()]*rows\(\w\)/g)].map((m) => m[0]);
  assert.ok(calls.length >= 4, 'three moments and the confirmers\' bylines');
  for (const call of calls) assert.match(call, /^(momentOf\(\{[^()]*|withCardBylines\(env, )rows\(\w\)$/, call);
});

test('morning source: the freeze is one batch of INSERT OR IGNORE, and pays only for the edition that was stored', () => {
  const s = src[SOURCES];
  const save = s.slice(s.indexOf('export async function saveFrozen'), s.indexOf('export async function editionFor'));
  assert.equal(save.split('db.batch(').length - 1, 1, 'one D1 batch');
  assert.match(save, /INSERT OR IGNORE INTO morning_editions \(date, number, json, frozen_at\) VALUES \(\?, \?, \?, \?\)/);
  assert.match(save, /INSERT OR IGNORE INTO air_points/);
  assert.match(save, /INSERT OR IGNORE INTO air_stamps/);
  assert.equal(save.split("json_each((SELECT json_extract(m.json, '$.reportIds') FROM morning_editions m WHERE m.date = ?))").length - 1, 2, 'both awards pay the reports the STORED edition cites, not this request\'s copy');
  assert.doesNotMatch(save, /json_each\(\?\)/, 'no award reads the caller\'s list of report ids');
  assert.equal(save.split("r.status = 'ok' AND r.onsite = 1 AND r.source = 'page'").length - 1, 2, 'only on-site human reports earn a byline');
  assert.match(save, /bylineAwards\(frozen\.date\)/);
  assert.match(save, /badgeStamp\('byline'\)/);
  for (const file of [SOURCES, ROUTE, XML_ROUTE]) {
    assert.doesNotMatch(src[file], /INSERT (OR REPLACE )?INTO morning_editions|REPLACE INTO|UPDATE morning_editions|DELETE FROM|ON CONFLICT/, `${file}: a frozen edition is never rewritten`);
  }
  const editionFor = s.slice(s.indexOf('export async function editionFor'));
  assert.match(editionFor, /const frozen = freezeEdition\(edition, o\.now\)/, 'canFreeze (inside freezeEdition) gates every save');
  assert.match(editionFor, /if \(!frozen \|\| !env\.AUTH_DB\) return edition;/);
});

test('morning source: no KV writes; the route writes only its edge cache', () => {
  assert.doesNotMatch(src[SOURCES], /\.put\(|\.delete\(/);
  assert.deepEqual([...src[ROUTE].matchAll(/(\w+)\.put\(/g)].map((m) => m[1]), ['cache']);
});

test('morning source: slot 2\'s court is one bound SELECT that carries the house columns, placed before the moments', () => {
  const s = src[SOURCES];
  const from = s.indexOf('/* ---------- slot 2: the busiest court ---------- */');
  assert.ok(from > 0 && from < s.indexOf('export async function reportMoments'), 'its own section, before reportMoments');
  const fn = s.slice(s.indexOf('export async function busiestCourtSpot'), s.indexOf('/* ---------- reports ---------- */'));
  const stmts = [...fn.matchAll(/\.prepare\(\s*(`[^`]*`|'[^']*')\s*\)\s*\.bind\((.+?)\)\.all</g)];
  assert.equal(stmts.length, 1, 'one statement, a literal, followed by .bind(');
  const sql = stmts[0][1].slice(1, -1);
  assert.ok(!sql.includes('${'));
  assert.ok(squash(sql).includes(HOUSE_SELECT), 'the three house columns, verbatim');
  assert.match(squash(sql), /^SELECT r\.spot, r\.kind, COALESCE\(r\.user_id, r\.pid_hash\) AS who, /);
  assert.match(squash(sql), /FROM air_reports r WHERE r\.day = \? AND r\.onsite = 1 AND r\.source = 'page' AND r\.status = 'ok' LIMIT 2000$/);
  assert.equal(stmts[0][2].trim(), 'addDays(date, -1)', 'LA yesterday');
  assert.match(fn, /return pickCourtsSpot\(config, res\.results \?\? \[\]\)/, 'the rows go straight into the pure picker');
  assert.match(fn, /catch \{\s*return 'courts';/, 'any failure is the courts spot, never a provisional edition');
  assert.doesNotMatch(fn.replace(/\.prepare\(\s*`[^`]*`\s*\)/, '.prepare(SQL)'), /pid_hash|ip_hash|pidHash|ipHash|guestByline/, 'nothing outside the SQL reads a hash');
  assert.match(s, /busiestCourtSpot\(env, config, date\)\.then\(\(spot\) => reportMoments\(env, config, date, spot\)\)/, 'gatherSources asks first, then reads that court\'s moments');
  assert.match(s, /\.\.\.\(moments \? \{ courts: \{ \.\.\.moments\.courts, today \} \} : \{\}\)/, 'the schedules ride on the courts source only when the store answered');
  const recent = s.slice(s.indexOf('export async function readRecentFrozen'), s.indexOf('export async function saveFrozen'));
  assert.match(recent, /\.prepare\('SELECT date, json FROM morning_editions ORDER BY date DESC LIMIT \?'\)\s*\.bind\(n\)/);
  assert.match(s, /laDate\(now\)/, 'the forecast is read only on the edition\'s own day');
  assert.match(s, /nws\?: Nws/, 'the forecast is injectable beside klax');
  assert.match(s, /NWS_GRIDPOINT_URL, 600, async/, 'through the 600 s edge cache');
  assert.match(s, /Accept: 'application\/geo\+json'/);
  assert.match(s, /NWS_BUDGET_MS = 2500/);
});

test('morning route: JSON Feed content type, caches.default TTLs, ?d= through parseEditionParam, no static twin', async () => {
  const r = src[ROUTE];
  assert.match(r, /'application\/feed\+json; charset=utf-8'/);
  assert.match(r, /caches\?\.default/);
  assert.match(r, /edition\.frozen === true \? EDITION_TTL\.frozen : EDITION_TTL\.provisional/);
  assert.match(r, /parseEditionParam\(d, now\)/);
  assert.match(r, /export const onRequestGet/);
  await assert.rejects(access(new URL('src/pages/morning.json.ts', root)), 'src/pages/morning.json.ts would collide with the function');
});

/* ---------- Saturday 3 Oct 2026, No. 1, end to end on node:sqlite ---------- */

// The town slot reads src/data/front-door-news.json, and a note under 7 days old outranks Shortwave.
// These editions sit on fixed dates from No. 1 (Sat 3 Oct 2026) on, so serve only notes filed more
// than a week before No. 1: a launch note filed later must not rewrite what these dates expect.
const NEWS_BEFORE_NO1 = JSON.parse(await read('src/data/front-door-news.json')).filter((n) => n.date < '2026-09-26');
const newsFixture = {
  name: 'front-door-news-before-no1',
  enforce: 'pre',
  load(id) { if (id.split('?')[0].endsWith('/src/data/front-door-news.json')) return JSON.stringify(NEWS_BEFORE_NO1); },
};
const server = await createServer({ root: fileURLToPath(root), configFile: false, appType: 'custom', logLevel: 'error', plugins: [newsFixture] });
after(() => server.close());
const [lib, route] = await Promise.all([server.ssrLoadModule('/functions/_lib/morning-sources.ts'), server.ssrLoadModule('/functions/morning.json.ts')]);

const { COURTS } = await server.ssrLoadModule('/src/lib/courts.ts');
const MIGRATIONS = (await Promise.all(['0001_init.sql', '0023_air.sql'].map((f) => read(`migrations/auth/${f}`)))).join('\n');
/** v2's tables (air_house among them). Not in MIGRATIONS on purpose: the base store proves the fallback to the courts spot. */
const MIGRATION_0031 = await read('migrations/auth/0031_field_reports_paper.sql');
const COURT_CALL = 'Next Court Call Fri 7:30 AM on 7.500.';
/** Today's courts as the paper prints them for `date` with no forecast: the real schedule and the real sunset. */
const todaysLine = (date) => todaysCourtsLine({ sessions: todaysSessions(COURTS, date), nws: null, sunset: lib.sunsetLabel(date) }, date);

/** D1 over node:sqlite (as in tests/air-api.test.mjs): reads hand back rows, a batch is one transaction. */
class SqliteD1 {
  constructor() { this.db = new DatabaseSync(':memory:'); this.db.exec(MIGRATIONS); }
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
  data = new Map(); puts = 0;
  async get(key, type) { const v = this.data.get(key); return v === undefined ? null : type === 'json' ? JSON.parse(v) : v; }
  async put(key, value) { this.puts++; this.data.set(key, value); }
  async list({ prefix, limit }) { const names = [...this.data.keys()].filter((k) => k.startsWith(prefix)).sort().slice(0, limit); return { keys: names.map((name) => ({ name })), list_complete: true }; }
}

const MIN = 60_000;
const SAT = '2026-10-03';
const FRI = '2026-10-02';
const AT = (iso) => Date.parse(iso);
const SAT_0700 = AT('2026-10-03T14:00:00Z');
const DEV = Object.fromEntries(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map((k) => [k, `${k.repeat(8)}-${k.repeat(4)}-4${k.repeat(3)}-8${k.repeat(3)}-${k.repeat(12)}`]));
const PID = Object.fromEntries(await Promise.all(Object.entries(DEV).map(async ([k, d]) => [k, await pidHash(d)])));
let serial = 0;
const rid = () => `ar_${String(++serial).padStart(20, '0')}`;
const postId = (ms) => `${String(9999999999999 - ms).padStart(13, '0')}-00000000-0000-4000-8000-${String(ms).slice(-12).padStart(12, '0')}`;

function town() {
  const db = new SqliteD1();
  const VISITS = new Store();
  const today = { date: SAT, blockId: '0612', title: 'Drum Party: five phones, one kit' };
  const ASSETS = { fetch: async (u) => (new URL(u).pathname === '/today.json' ? Response.json({ today, tomorrow: { ...today, date: '2026-10-04', blockId: '0613' }, past: [] }) : new Response('nope', { status: 404 })) };
  const env = { AUTH_DB: db, VISITS, ASSETS };
  const report = (o) => {
    const id = rid();
    const pid = PID[o.dev];
    db.db.prepare(`INSERT INTO air_reports (id, spot, kind, value, observed_at, day, slot, pid_hash, ip_hash, user_id, byline, onsite, status, source, source_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ok', ?, ?, ?)`).run(
      id, o.spot, o.kind ?? (o.spot === 'beach' ? 'fog' : 'wait'), o.value, o.at, o.day, Math.floor(o.at / 1_800_000), pid, `${pid.slice(0, 8)}ffffffff`,
      o.user ?? null, o.byline ?? guestByline(pid), o.onsite ?? 1, o.source ?? 'page', o.source ? 'https://example.org/agent' : null, o.at);
    return id;
  };
  const confirm = (o) => db.db.prepare(`INSERT INTO air_confirms (report_id, pid_hash, ip_hash, user_id, verdict, value, onsite, at) VALUES (?, ?, ?, ?, 'still', ?, 1, ?)`)
    .run(o.report, PID[o.dev], `${PID[o.dev].slice(0, 8)}eeeeeeee`, o.user ?? null, o.value, o.at);
  const card = (userId, handle) => VISITS.data.set(`card:v1:user:${userId}`, JSON.stringify({ handle, name: handle, noun: 7 }));
  const post = (at, p) => VISITS.data.set(`shortwave:post:v1:${postId(at)}`, JSON.stringify({ id: postId(at), at: new Date(at).toISOString(), noun: 0, ...p }));
  return { env, db, VISITS, report, confirm, card, post };
}

/** Friday at the courts, last Friday, Saturday at the beach, and a Shortwave evening. */
function saturday() {
  const t = town();
  const ids = {
    mike: t.report({ spot: 'courts', value: '1-4', at: AT('2026-10-02T14:36:00Z'), day: FRI, dev: 'a', user: 'u-mike', byline: '@mike' }),
    guest: t.report({ spot: 'courts', value: '1-4', at: AT('2026-10-02T14:38:00Z'), day: FRI, dev: 'b' }),
    sam: t.report({ spot: 'courts', value: '1-4', at: AT('2026-10-02T14:39:00Z'), day: FRI, dev: 'c', user: 'u-sam', byline: '@sam' }),
    remote: t.report({ spot: 'courts', value: '5-8', at: AT('2026-10-02T14:40:00Z'), day: FRI, dev: 'd', onsite: 0 }),
    agent: t.report({ spot: 'courts', value: '0', at: AT('2026-10-02T14:40:30Z'), day: FRI, dev: 'e', onsite: 0, source: 'agent:cc', byline: 'cc' }),
    lastFri: t.report({ spot: 'courts', value: '5-8', at: AT('2026-09-25T14:38:00Z'), day: '2026-09-25', dev: 'g' }),
    beach: t.report({ spot: 'beach', value: 'none', at: AT('2026-10-03T13:31:00Z'), day: SAT, dev: 'h' }),
    late: t.report({ spot: 'beach', value: 'clear', at: AT('2026-10-03T13:50:00Z'), day: SAT, dev: 'i' }),
  };
  t.confirm({ report: ids.mike, dev: 'f', user: 'u-jen', value: '1-4', at: AT('2026-10-02T14:41:00Z') });
  t.card('u-jen', 'jen');
  // @sam already has 25 of the day's 30 points on Saturday.
  t.db.db.prepare(`INSERT INTO air_points (id, owner, action, ref, units, day, report_id, created_at) VALUES ('ap_seed', 'user:u-sam', 'report', 'beach:fog:2026-10-03:3', 25, ?, NULL, ?)`).run(SAT, SAT_0700 - 10 * MIN);
  t.post(AT('2026-10-03T03:12:00Z'), { who: 'jen', text: 'Lights out on court 4. https://spam.example/x', via: 'page', attribution: 'card', handle: 'jen', verified: true });
  t.post(AT('2026-10-03T04:00:00Z'), { who: 'Mike', text: 'house note', via: 'page', attribution: 'card', handle: 'mike', verified: true });
  t.post(AT('2026-10-03T05:00:00Z'), { who: 'The courts', text: 'On the air from The courts', via: 'air', attribution: 'station', mhz: 7.5 });
  t.post(AT('2026-10-03T05:30:00Z'), { who: 'Mayor', text: 'self-reported', via: 'bar', attribution: 'self-reported' });
  return { ...t, ids };
}

/** KLAX at 5:53 AM on the edition's morning, under the layer. */
const klaxUnder = async (date) => ({ underTheLayerNow: true, observedAt: new Date(cutoffMs(date) - 52 * MIN).toISOString() });
const klaxDown = async () => null;
/** The forecast stub: no test reaches api.weather.gov. */
const noNws = async () => null;
const noHashes = (value) => {
  const text = JSON.stringify(value);
  for (const pid of Object.values(PID)) assert.ok(!text.includes(pid) && !text.includes(pid.slice(0, 8)), 'a phone or network hash leaked');
  assert.doesNotMatch(text, /pid_hash|ip_hash|dev:|user:/);
};
const slot = (e, id) => e.slots.find((s) => s.id === id);
const points = (db) => db.rows("SELECT owner, action, ref, units, day, report_id FROM air_points WHERE action = 'byline' ORDER BY owner");
const badges = (db) => db.rows("SELECT owner, kind, ref, day, report_id, meta_json FROM air_stamps WHERE ref = 'byline' ORDER BY owner");

test('No. 1: the first read after 6:45 freezes the edition and pays one byline per reporter, once', async () => {
  const t = saturday();
  const e = await lib.editionFor(t.env, { config, date: SAT, now: SAT_0700, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxUnder });
  assert.equal(e.frozen, true);
  assert.equal(e.number, 1);
  assert.equal(e.provisional, false);
  assert.equal(e.slots.length, 7);
  noHashes(e);

  assert.equal(slot(e, 'sky').line, `Under the marine layer at KLAX, 5:53 AM. At Grand Ave beach 6:31 AM: can't see the pier, 1 reporter — ${guestByline(PID.h)}.`, 'the 6:50 beach report is after the cutoff');
  assert.equal(slot(e, 'sky').source, 'klax-asos+air');
  assert.deepEqual(slot(e, 'sky').reportIds, [t.ids.beach]);
  assert.equal(slot(e, 'courts').line,
    `Yesterday 7:41 AM: 1–4 in the rack, 4 agree — @mike, ${guestByline(PID.b)}, @sam +1. A week before, Fri 25 Sep 7:38 AM: 5–8 in the rack, 1 reporter. Next Court Call Fri 7:30 AM on 7.500.`);
  assert.deepEqual(slot(e, 'courts').reportIds, [t.ids.mike, t.ids.guest, t.ids.sam], 'reports only: no remote, agent or last-week rows; the confirmer is named, not cited');
  assert.deepEqual(slot(e, 'courts').bylines, ['@mike', guestByline(PID.b), '@sam', '@jen'], 'a signed-in confirmer reads as their card');
  assert.equal(slot(e, 'town').line, 'On Shortwave at 8:12 PM: "Lights out on court 4." — @jen', 'the newest card post not by the house; its link is dropped');
  assert.equal(slot(e, 'town').fallback, true);
  assert.equal(slot(e, 'pick').line, 'Block 0612: Drum Party: five phones, one kit.');
  assert.equal(slot(e, 'price').line, 'Gearbox Pressure X shipped Oct 1 at $279.99 MSRP. From the register, no link.');
  assert.equal(slot(e, 'shop').line, `Coming in October: RPM Jade, $269.99 MSRP. ${SHOP_DISCLOSURE}`);
  assert.doesNotMatch(slot(e, 'shop').line, /https?:|www\./);
  assert.match(slot(e, 'ritual').line, /^The Nightly Net, 9:00 PM on 7\.200/);
  assert.equal(e.footer, FOOTER_LINE);

  const stored = t.db.rows('SELECT date, number, json, frozen_at FROM morning_editions');
  assert.equal(stored.length, 1);
  assert.equal(stored[0].number, 1);
  assert.equal(stored[0].frozen_at, SAT_0700);
  assert.deepEqual(JSON.parse(stored[0].json), e);

  const want = [
    { owner: `dev:${PID.b}`, units: 10, report_id: t.ids.guest },
    { owner: `dev:${PID.h}`, units: 10, report_id: t.ids.beach },
    { owner: 'user:u-mike', units: 10, report_id: t.ids.mike },
    { owner: 'user:u-sam', units: 5, report_id: t.ids.sam },
  ].sort((a, b) => (a.owner < b.owner ? -1 : 1));
  assert.deepEqual(points(t.db), want.map((w) => ({ owner: w.owner, action: 'byline', ref: 'morning:2026-10-03', units: w.units, day: SAT, report_id: w.report_id })), '@sam is capped at 30 for the day');
  assert.deepEqual(badges(t.db).map((b) => [b.owner, b.kind, b.day]), want.map((w) => [w.owner, 'badge', '-']));
  assert.deepEqual(JSON.parse(badges(t.db)[0].meta_json), { edition: SAT, number: 1 });

  // A second read serves the stored copy and pays nothing more.
  const again = await lib.editionFor(t.env, { config, date: SAT, now: SAT_0700 + 30 * MIN, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxDown });
  assert.deepEqual(again, e, 'frozen: KLAX going down later changes nothing');
  assert.equal(points(t.db).length, 4);
  assert.equal(badges(t.db).length, 4);
  assert.equal(t.VISITS.puts, 0, 'no KV writes');
});

test('the Desk: a Sky agent fact stands in for a missing KLAX and the edition still freezes', async () => {
  const t = saturday();
  const skyAt = AT('2026-10-03T13:02:00Z'); // Sat 6:02 AM LA, well inside the 6:45 cutoff
  t.db.db.prepare(`INSERT INTO air_reports
      (id, spot, kind, value, extras_json, schema_v, observed_at, day, slot, pid_hash, ip_hash, byline, onsite, status, source, source_url, created_at)
    VALUES (?, 'beach', 'fog', 'hazy', ?, 2, ?, ?, ?, 'agentpid0000000a', 'agentip00000000', 'cc', 0, 'ok', 'agent:cc', 'https://aviationweather.gov/api/data/metar', ?)`)
    .run('ar_deskcc00000000000001', JSON.stringify({ obsAt: new Date(skyAt).toISOString().replace(/\.\d{3}Z$/, 'Z'), visMi: 3, ceilFt: null, wx: 'HZ' }), skyAt, SAT, Math.floor(skyAt / 1_800_000), skyAt);

  const e = await lib.editionFor(t.env, { config, date: SAT, now: SAT_0700, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxDown });
  assert.equal(e.provisional, false, 'the Desk\'s own read of the field fills in for KLAX');
  assert.deepEqual(e.missing, []);
  assert.equal(slot(e, 'sky').line, `cc read KLAX at 6:02: hazy. At Grand Ave beach 6:31 AM: can't see the pier, 1 reporter — ${guestByline(PID.h)}.`);
  assert.equal(slot(e, 'sky').source, 'desk+air');
  assert.equal(slot(e, 'sky').fallback, false, 'an agent read the field — not a template');
  assert.equal(e.frozen, true);
  noHashes(e);
});

test('provisional: KLAX down or the report store down is served, never frozen, never paid', async () => {
  const t = saturday();
  const sky = await lib.editionFor(t.env, { config, date: SAT, now: SAT_0700, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxDown });
  assert.equal(sky.provisional, true);
  assert.deepEqual(sky.missing, ['klax']);
  assert.equal(sky.frozen, false);
  assert.equal(slot(sky, 'courts').reportIds.length, 3, 'the reports still run');
  assert.equal(t.db.rows('SELECT * FROM morning_editions').length, 0);
  assert.equal(points(t.db).length, 0);
  assert.equal(badges(t.db).length, 0);

  const noStore = await lib.editionFor({ ...t.env, AUTH_DB: undefined }, { config, date: SAT, now: SAT_0700, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxUnder });
  assert.equal(noStore.provisional, true);
  assert.deepEqual(noStore.missing, ['reports']);
  assert.equal(noStore.slots.length, 7);
  assert.ok(noStore.slots.every((s) => s.line.trim()), 'never ships empty');

  // KLAX comes back: the next read freezes it.
  const later = await lib.editionFor(t.env, { config, date: SAT, now: SAT_0700 + 5 * MIN, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxUnder });
  assert.equal(later.frozen, true);
  assert.equal(points(t.db).length, 4);
});

test('a day with zero reports still freezes, with no bylines to pay', async () => {
  const t = town();
  const date = '2026-10-10';
  const e = await lib.editionFor(t.env, { config, date, now: cutoffMs(date) + MIN, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxUnder });
  assert.equal(e.frozen, true);
  assert.equal(e.provisional, false);
  assert.deepEqual(e.reportIds, []);
  assert.equal(e.reporterLine, '');
  assert.match(slot(e, 'town').line, /^In El Segundo today: sunrise \d{1,2}:\d{2} AM, sunset \d{1,2}:\d{2} PM, a [a-z ]+moon\.$/, 'no fresh news and no Shortwave: the almanac');
  assert.equal(slot(e, 'pick').fallback, true, '/today.json has no entry for that day');
  assert.equal(points(t.db).length, 0);
  // No reading anywhere (and no air_house table on this store): the day's posted schedules, then the Court Call.
  assert.equal(slot(e, 'courts').line, `${todaysLine(date)} ${COURT_CALL}`, 'Sat Oct 10 reads the real schedule');
  assert.match(slot(e, 'courts').line, /^Today's courts: .* From the posted schedules, checked [A-Z][a-z]{2} \d{1,2}\. Sunset \d{1,2}:\d{2} PM\. /);
  assert.equal(slot(e, 'courts').source, 'schedule');
  assert.equal(slot(e, 'courts').fallback, true);
  assert.equal(slot(e, 'courts').spot, 'courts');
  assert.equal(slot(e, 'courts').label, 'Courts · 7.500');
  assert.deepEqual(slot(e, 'courts').reportIds, []);
});

test('preview: before No. 1 the edition is labeled PREVIEW and never stored', async () => {
  const t = saturday();
  const date = '2026-09-30';
  const e = await lib.editionFor(t.env, { config, date, now: cutoffMs(date) + 60 * MIN, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxUnder });
  assert.equal(e.preview, true);
  assert.equal(e.number, 0);
  assert.match(e.masthead, /^MORNING EDITION · PREVIEW · WED 30 SEP 2026/);
  assert.equal(e.frozen, false);
  assert.equal(t.db.rows('SELECT * FROM morning_editions').length, 0);
});

test('saveFrozen: the first freeze wins; a racing second pays nothing, and remote or agent ids never pay', async () => {
  const t = saturday();
  const first = await lib.editionFor(t.env, { config, date: SAT, now: SAT_0700, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxUnder });
  const rival = { ...first, reportIds: [t.ids.lastFri], frozenAt: '2026-10-03T14:00:01Z' };
  const kept = await lib.saveFrozen(t.env.AUTH_DB, rival, SAT_0700 + 1000);
  assert.deepEqual(kept, first, 'the stored edition comes back');
  assert.ok(!points(t.db).some((p) => p.owner === `dev:${PID.g}`), 'the rival cited a report the stored edition does not');
  // Same millisecond as the stored row: still pays only what was stored.
  const twin = await lib.saveFrozen(t.env.AUTH_DB, { ...rival, frozenAt: first.frozenAt }, SAT_0700);
  assert.deepEqual(twin, first);
  assert.ok(!points(t.db).some((p) => p.owner === `dev:${PID.g}`), 'a racer in the same ms never pays for its own composition');
  assert.ok(!badges(t.db).some((b) => b.owner === `dev:${PID.g}`));
  assert.equal(points(t.db).length, 4, 'the stored edition\'s bylines, paid once');

  const sunday = { ...first, date: '2026-10-04', number: 2, reportIds: [t.ids.remote, t.ids.agent, 'ar_ffffffffffffffffffff'] };
  const stored = await lib.saveFrozen(t.env.AUTH_DB, sunday, AT('2026-10-04T14:00:00Z'));
  assert.equal(stored.date, '2026-10-04');
  assert.equal(points(t.db).filter((p) => p.ref === 'morning:2026-10-04').length, 0, 'remote, agent and unknown ids earn nothing');
});

/** Swap global fetch for one block. */
async function withFetch(respond, run) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => respond(String(url));
  try { return await run(); } finally { globalThis.fetch = realFetch; }
}
/** An AWC METAR list for `date`: [minute past LA midnight, ceiling ft or null (open)]. */
function awcDay(date, reports) {
  return JSON.stringify(reports.map(([minute, base]) => ({
    icaoId: 'KLAX', metarType: 'METAR', obsTime: Math.floor((cutoffMs(date) + (minute - (6 * 60 + 45)) * MIN) / 1000),
    rawOb: `METAR KLAX ${base ? `OVC${String(base / 100).padStart(3, '0')}` : 'CLR'}`, clouds: base ? [{ cover: 'OVC', base }] : [{ cover: 'CLR' }],
  })));
}

test('KLAX through the oracle: a first read at 2:10 PM freezes the 5:53 AM report, never the 1:53 PM one', async () => {
  const t = town();
  const MON = '2026-10-05';
  const day = awcDay(MON, [[4 * 60 + 53, 700], [5 * 60 + 53, 800], [6 * 60 + 53, 900], [11 * 60 + 53, null], [13 * 60 + 53, null]]);
  const NOW = Date.parse('2026-10-05T21:10:00Z');
  const e = await atClock(NOW, () => withFetch((url) => (url.startsWith('https://aviationweather.gov/') ? new Response(day) : new Response('offline', { status: 503 })),
    () => lib.editionFor(t.env, { config, date: MON, now: NOW, origin: 'https://pointcast.xyz' })));
  assert.equal(e.frozen, true);
  assert.equal(slot(e, 'sky').line, 'Under the marine layer at KLAX, 5:53 AM (800 ft).');
  assert.equal(slot(e, 'sky').source, 'klax-asos');
});

test('KLAX through the oracle: a hung upstream becomes "KLAX missing" within the budget, not a page that never loads', async () => {
  const t = town();
  assert.ok(lib.KLAX_BUDGET_MS < 8000, 'well inside the page\'s 8 s fetch');
  const started = Date.now();
  const klax = await withFetch(() => new Promise(() => {}), () => lib.klaxFor('2026-10-05', Date.now(), t.env, 50));
  assert.equal(klax, null);
  assert.ok(Date.now() - started < 2000);
  const down = await withFetch(() => new Response('offline', { status: 503 }), () => lib.klaxFor('2026-10-05', Date.now(), t.env, 50));
  assert.equal(down, null, 'an outage is null too');
});

test('a final no-record KLAX day freezes with a standing sky line and pays its bylines', async () => {
  const t = saturday();
  const noRecord = async (date) => ({ date, verdict: { state: 'no-record', final: true }, now: null, observations: [] });
  const e = await lib.editionFor(t.env, { config, date: SAT, now: AT('2026-10-05T16:00:00Z'), origin: 'https://pointcast.xyz', nws: noNws, klax: noRecord });
  assert.equal(e.frozen, true);
  assert.deepEqual(e.missing, []);
  assert.match(slot(e, 'sky').line, /^KLAX filed no report before 6:45 AM\. At Grand Ave beach 6:31 AM/);
  assert.equal(points(t.db).length, 4, 'every reporter the edition cites is paid');
  assert.equal(badges(t.db).length, 4);
});

test('the daily pick reads /morning-picks.json, so an edition days past the last deploy still gets its block', async () => {
  const t = town();
  const date = '2026-10-11';
  const assets = (picks) => ({ fetch: async (u) => {
    const path = new URL(u).pathname;
    if (path === '/morning-picks.json' && picks) return Response.json({ v: 1, from: '2026-09-26', to: '2026-11-27', picks });
    if (path === '/today.json') return Response.json({ today: { date: '2026-10-09', blockId: '0600', title: 'Built Friday' }, tomorrow: null, past: [] });
    return new Response('nope', { status: 404 });
  } });
  const pick = await lib.dailyPick({ ...t.env, ASSETS: assets({ [date]: { blockId: '0611', title: 'The pond' } }) }, date, 'https://pointcast.xyz');
  assert.deepEqual(pick, { blockId: '0611', title: 'The pond' });
  const e = await lib.editionFor({ ...t.env, ASSETS: assets({ [date]: { blockId: '0611', title: 'The pond' } }) }, { config, date, now: cutoffMs(date) + 5 * MIN, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxUnder });
  assert.equal(slot(e, 'pick').line, 'Block 0611: The pond.');
  assert.equal(slot(e, 'pick').fallback, false);
  // An older deploy without the file still reads /today.json; a date in neither runs the template.
  assert.deepEqual(await lib.dailyPick({ ...t.env, ASSETS: assets(null) }, '2026-10-09', 'https://pointcast.xyz'), { blockId: '0600', title: 'Built Friday' });
  assert.equal(await lib.dailyPick({ ...t.env, ASSETS: assets({}) }, date, 'https://pointcast.xyz'), null);
});

test('/morning-picks.json: built from the /today pick for every edition date through 60 days past the build', async () => {
  const page = await read('src/pages/morning-picks.json.ts');
  assert.match(page, /pickDailyBlock\(blocks, new Date\(`\$\{date\}T20:00:00Z`\)\)/, 'the same deterministic pick as /today');
  assert.match(page, /PICKS_AHEAD_DAYS = 60/);
  assert.match(page, /FIRST_EDITION/);
});

/* ---------- the route ---------- */

function awc(date, cover = 'OVC') {
  const obsTime = Math.floor((cutoffMs(date) - 52 * MIN) / 1000);
  return JSON.stringify([{ icaoId: 'KLAX', metarType: 'METAR', obsTime, rawOb: `METAR KLAX ${cover}011`, clouds: [{ cover, base: 1100 }] }]);
}
/**
 * Freeze the whole clock, `new Date()` included: the Marine Layer oracle picks
 * AWC (last 6 days) or the Iowa State archive from `new Date()`, so a fixed
 * October date must not be read against the real calendar.
 */
async function atClock(now, run) {
  mock.timers.enable({ apis: ['Date'], now });
  try { return await run(); } finally { mock.timers.reset(); }
}

async function get(env, path, now, awcDate) {
  return atClock(now, () => getAt(env, path, awcDate));
}

async function getAt(env, path, awcDate) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => (String(url).startsWith('https://aviationweather.gov/') ? new Response(awc(awcDate)) : new Response('offline', { status: 503 }));
  try {
    const waits = [];
    const res = await route.onRequestGet({ request: new Request(`https://pointcast.xyz${path}`), env, waitUntil: (p) => waits.push(p), params: {} });
    await Promise.all(waits);
    return { status: res.status, type: res.headers.get('Content-Type'), cache: res.headers.get('Cache-Control'), body: await res.json() };
  } finally {
    globalThis.fetch = realFetch;
  }
}

test('GET /morning.json: ?d= runs from No. 1 to the current edition; anything else is 400', async () => {
  const t = saturday();
  for (const d of ['2026-09-30', '2026-10-04', '2026-02-30', '10/03/2026', 'today']) {
    const res = await get(t.env, `/morning.json?d=${encodeURIComponent(d)}`, SAT_0700, SAT);
    assert.equal(res.status, 400, d);
    assert.deepEqual(res.body, { ok: false, reason: 'bad-date', first: '2026-10-03', current: SAT });
  }
  assert.equal(t.db.rows('SELECT * FROM morning_editions').length, 0);
});

test('GET /morning.json: a JSON Feed that freezes No. 1 on the first read after 6:45, and holds it', async () => {
  const t = saturday();
  const before = await get(t.env, '/morning.json', AT('2026-10-03T13:44:00Z'), '2026-10-02');
  assert.equal(before.body.items[0].id, 'morning:2026-10-02', '6:44 AM still shows yesterday');
  assert.equal(before.body.items[0]._pointcast.frozen, false, 'yesterday was a preview');
  assert.match(before.body.items[0].title, /^Morning Edition Preview · Fri 2 Oct 2026$/);
  assert.equal(before.cache, 'public, max-age=60');

  const res = await get(t.env, '/morning.json', SAT_0700, SAT);
  assert.equal(res.status, 200);
  assert.equal(res.type, 'application/feed+json; charset=utf-8');
  assert.equal(res.cache, 'public, max-age=300');
  const feed = res.body;
  assert.equal(feed.version, 'https://jsonfeed.org/version/1.1');
  assert.equal(feed.feed_url, 'https://pointcast.xyz/morning.json');
  assert.equal(feed.items.length, 1);
  const [item] = feed.items;
  assert.equal(item.id, 'morning:2026-10-03');
  assert.equal(item.title, 'Morning Edition No. 1 · Sat 3 Oct 2026');
  assert.equal(item.date_published, '2026-10-03T13:45:00Z');
  assert.equal(item._pointcast.frozen, true);
  assert.equal(item._pointcast.slots.length, 7);
  assert.match(item._pointcast.slots[0].line, /^Under the marine layer at KLAX, 5:53 AM \(1100 ft\)\./, 'KLAX\'s report at or before 6:45, from the oracle\'s answer');
  assert.equal(item.content_text.split('\n').length, 7);
  noHashes(feed);
  assert.equal(points(t.db).length, 4);

  // ?d= serves the stored copy, and so does 6:30 AM the next morning.
  const dated = await get(t.env, `/morning.json?d=${SAT}`, SAT_0700 + 3 * 60 * MIN, SAT);
  assert.deepEqual(dated.body.items, feed.items);
  const sunEarly = await get(t.env, '/morning.json', AT('2026-10-04T13:30:00Z'), '2026-10-04');
  assert.deepEqual(sunEarly.body.items, feed.items);
  assert.equal(sunEarly.cache, 'public, max-age=300');
  const closeToCutoff = await get(t.env, '/morning.json', AT('2026-10-04T13:44:00Z'), '2026-10-04');
  assert.equal(closeToCutoff.cache, 'public, max-age=60', 'the undated feed never outlives the next 6:45');

  // Monday: Sunday was never read, so the feed carries Monday and the frozen Saturday.
  const mon = await get(t.env, '/morning.json', AT('2026-10-05T14:00:00Z'), '2026-10-05');
  assert.deepEqual(mon.body.items.map((i) => [i.id, i._pointcast.frozen]), [['morning:2026-10-05', true], ['morning:2026-10-03', true]]);
  assert.equal(points(t.db).length, 4, 'Monday cites no reports');

});

/* ---------- slot 2: the busiest court, end to end ---------- */

/** A store with v2's tables (air_house) and one Friday of reports at two courts, house rows among them. */
function busyFriday() {
  const t = town();
  t.db.db.exec(MIGRATION_0031);
  const user = (id, payload) => t.db.db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)').run(id, JSON.stringify(payload), '2026-09-01T00:00:00Z');
  user('u-dir', { roles: ['director'] });
  user('u-wallet', { identities: [{ provider: 'kukai', id: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw' }] });
  user('u-reg', { roles: ['member'] });
  const house = (kind, value) => t.db.db.prepare('INSERT INTO air_house (kind, value, note, added_at) VALUES (?, ?, NULL, ?)').run(kind, value, SAT_0700);
  const at = (min) => AT('2026-10-02T14:30:00Z') + min * MIN;
  const ids = {
    // Manhattan Middle: one regular, plus three house rows (a listed phone, a director role, the director wallet).
    reg: t.report({ spot: 'courts', value: '0', at: at(1), day: FRI, dev: 'a', user: 'u-reg', byline: '@reg' }),
    housePhone: t.report({ spot: 'courts', value: '0', at: at(2), day: FRI, dev: 'e' }),
    walletHouse: t.report({ spot: 'courts', value: '0', at: at(3), day: FRI, dev: 'f', user: 'u-wallet', byline: '@wallet' }),
    roleHouse: t.report({ spot: 'courts', value: '0', at: at(4), day: FRI, dev: 'g', user: 'u-dir', byline: '@dir' }),
    // El Segundo: two guests, so the town's two beat the town's one.
    g1: t.report({ spot: 'el-segundo', value: '1-4', at: at(5), day: FRI, dev: 'b' }),
    g2: t.report({ spot: 'el-segundo', value: '1-4', at: at(6), day: FRI, dev: 'c' }),
    // Not a vote: parking, a remote report, an agent row, and the beach.
    parking: t.report({ spot: 'el-segundo', kind: 'parking', value: 'easy', at: at(7), day: FRI, dev: 'd' }),
    remote: t.report({ spot: 'el-segundo', value: '5-8', at: at(8), day: FRI, dev: 'h', onsite: 0 }),
    beach: t.report({ spot: 'beach', value: 'none', at: at(9), day: FRI, dev: 'i' }),
  };
  house('pid', PID.e);
  return { ...t, ids };
}

test('busiestCourtSpot: house rows (a listed phone, the director role, the director wallet) do not make a court busy', async () => {
  const t = busyFriday();
  assert.equal(await lib.busiestCourtSpot(t.env, config, SAT), 'el-segundo', 'two town people at El Segundo beat one at the Middle School');
  // The same Friday with no house list is a 4-2 win for the Middle School: the house rows are what kept it down.
  const open = busyFriday();
  open.db.db.exec('DELETE FROM air_house');
  open.db.db.prepare("UPDATE users SET payload = '{}' WHERE id IN ('u-dir', 'u-wallet')").run();
  assert.equal(await lib.busiestCourtSpot(open.env, config, SAT), 'courts');
  // Each flag alone: a house phone, then an account.
  const lone = (which) => {
    const x = town();
    x.db.db.exec(MIGRATION_0031);
    x.db.db.prepare("INSERT INTO users (id, payload, created_at) VALUES ('u-x', ?, '2026-09-01T00:00:00Z')").run(JSON.stringify(which.payload ?? {}));
    x.report({ spot: 'el-segundo', value: '1-4', at: AT('2026-10-02T14:31:00Z'), day: FRI, dev: 'b', user: 'u-x' });
    x.report({ spot: 'el-segundo', value: '1-4', at: AT('2026-10-02T14:32:00Z'), day: FRI, dev: 'c' });
    if (which.pid) x.db.db.prepare("INSERT INTO air_house (kind, value, note, added_at) VALUES ('pid', ?, NULL, 1)").run(PID.c);
    if (which.user) x.db.db.prepare("INSERT INTO air_house (kind, value, note, added_at) VALUES ('user', 'u-x', NULL, 1)").run();
    x.report({ spot: 'courts', value: '0', at: AT('2026-10-02T14:33:00Z'), day: FRI, dev: 'a' });
    return lib.busiestCourtSpot(x.env, config, SAT);
  };
  assert.equal(await lone({}), 'el-segundo', 'baseline: two people at El Segundo, one at the Middle School');
  assert.equal(await lone({ pid: true }), 'courts', 'a house phone');
  assert.equal(await lone({ user: true }), 'courts', 'a house account');
  assert.equal(await lone({ payload: { roles: ['broadcaster'] } }), 'courts', 'a broadcaster account');
  assert.equal(await lone({ payload: { roles: ['member'] } }), 'el-segundo');
});

test('busiestCourtSpot: only yesterday counts, and no rows, no store or no air_house is the courts spot', async () => {
  const t = busyFriday();
  assert.equal(await lib.busiestCourtSpot(t.env, config, '2026-10-02'), 'courts', 'the day before that had no reports');
  assert.equal(await lib.busiestCourtSpot(t.env, config, '2026-10-04'), 'courts', 'two days on, still nothing');
  assert.equal(await lib.busiestCourtSpot({ ...t.env, AUTH_DB: undefined }, config, SAT), 'courts');
  assert.equal(await lib.busiestCourtSpot(t.env, config, 'nope'), 'courts');
  // The base store (0001 + 0023) has no air_house: the query fails soft, even with El Segundo clearly busier.
  const base = town();
  for (const dev of ['b', 'c', 'd']) base.report({ spot: 'el-segundo', value: '1-4', at: AT('2026-10-02T14:31:00Z') + MIN * Number(dev.charCodeAt(0)), day: FRI, dev });
  assert.equal(await lib.busiestCourtSpot(base.env, config, SAT), 'courts');
  const e = await lib.editionFor(base.env, { config, date: SAT, now: SAT_0700, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxUnder });
  assert.equal(e.provisional, false, 'a failed pick never makes the edition provisional');
  assert.equal(slot(e, 'courts').spot, 'courts');
  assert.equal(slot(e, 'courts').label, 'Courts · 7.500');
  assert.match(slot(e, 'courts').line, /^Today's courts: /, 'El Segundo\'s reports are not the Middle School\'s: no reading at the courts spot');
});

test('slot 2 end to end: the edition reports El Segundo, names it, cites its reports and freezes with its spot', async () => {
  const t = busyFriday();
  const e = await lib.editionFor(t.env, { config, date: SAT, now: SAT_0700, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxUnder });
  assert.equal(e.frozen, true);
  assert.equal(e.provisional, false);
  const c = slot(e, 'courts');
  assert.equal(c.label, 'Courts · 7.600');
  assert.equal(c.spot, 'el-segundo');
  assert.equal(c.source, 'air');
  assert.equal(c.fallback, false);
  assert.match(c.line, /^Yesterday 7:36 AM at El Segundo Recreation Park courts: 1–4 in the rack, 2 agree — Guest \d{4}, Guest \d{4}\. Next Court Call Fri 7:30 AM on 7\.500\.$/, 'the Court Call is the station\'s, always spot courts');
  assert.deepEqual(c.reportIds, [t.ids.g1, t.ids.g2], 'El Segundo\'s on-site human reports, nothing from parking, remote or the Middle School');
  assert.deepEqual(c.bylines.sort(), [guestByline(PID.b), guestByline(PID.c)].sort());
  noHashes(e);
  const stored = t.db.rows('SELECT json FROM morning_editions');
  assert.equal(JSON.parse(stored[0].json).slots[1].spot, 'el-segundo', 'the frozen copy keeps it');
  // Frozen means frozen: tomorrow's busier court does not rewrite it.
  const again = await lib.editionFor(t.env, { config, date: SAT, now: SAT_0700 + 60 * MIN, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxDown });
  assert.deepEqual(again, e);
});

test('slot 2 end to end: house bylines still print once their court is picked by someone else', async () => {
  const t = busyFriday();
  // @dir (a director account) reports at El Segundo too, as a third voice: the pick is the same, the byline is real.
  t.report({ spot: 'el-segundo', value: '1-4', at: AT('2026-10-02T14:40:00Z'), day: FRI, dev: 'a', user: 'u-dir', byline: '@dir' });
  assert.equal(await lib.busiestCourtSpot(t.env, config, SAT), 'el-segundo');
  const e = await lib.editionFor(t.env, { config, date: SAT, now: SAT_0700, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxUnder });
  assert.match(slot(e, 'courts').line, /— .*@dir/);
  assert.equal(slot(e, 'courts').spot, 'el-segundo');
});

test('today\'s courts: the forecast is read on the edition\'s own day only, through the injectable `nws`', async () => {
  const t = town();
  const date = '2026-10-24'; // a Saturday in El Segundo's season
  const now = cutoffMs(date) + 30 * MIN;
  const HOUR = 3_600_000;
  const first = COURTS.find((c) => c.id === 'courts').hours.rules[0].open; // the first session of the day: Manhattan Middle's window
  const [h] = first.split(':').map(Number);
  const periods = [8, 9, 10].map((hr) => {
    const start = Date.parse(`2026-10-24T${String(hr + 7).padStart(2, '0')}:00:00Z`);
    return { startTime: new Date(start).toISOString(), endTime: new Date(start + HOUR).toISOString(), temperature: 60 + hr, temperatureUnit: 'F', windSpeed: `${hr - 2} to ${hr} mph` };
  });
  const calls = [];
  const nws = async (d, n) => { calls.push([d, n]); return periods; };
  const e = await lib.editionFor(t.env, { config, date, now, origin: 'https://pointcast.xyz', nws, klax: klaxUnder });
  const c = slot(e, 'courts');
  assert.deepEqual(calls, [[date, now]]);
  assert.equal(h, 8);
  assert.match(c.line, / NWS for 8 AM: wind 8 mph, 68°F\. Sunset \d{1,2}:\d{2} PM\. /, 'the period that covers the first session, its top wind');
  assert.equal(c.source, 'schedule+nws');
  assert.equal(e.frozen, true);

  // A first read on a later day never asks: the forecast cannot cover a morning that has passed.
  const late = town();
  const asked = [];
  const later = await lib.editionFor(late.env, { config, date, now: now + 26 * 60 * MIN, origin: 'https://pointcast.xyz', nws: async (...a) => { asked.push(a); return periods; }, klax: klaxUnder });
  assert.deepEqual(asked, []);
  assert.equal(slot(later, 'courts').source, 'schedule');
  assert.doesNotMatch(slot(later, 'courts').line, /NWS/);

  // NWS down, throwing, hanging or answering nonsense: no sentence, and the edition still freezes.
  for (const bad of [async () => null, async () => { throw new Error('503'); }, () => { throw new Error('sync'); }, async () => 'nope', async () => [{ startTime: 'x' }], () => new Promise(() => {})]) {
    const x = town();
    const started = Date.now();
    const out = await lib.editionFor(x.env, { config, date, now, origin: 'https://pointcast.xyz', nws: bad, klax: klaxUnder });
    assert.ok(Date.now() - started < lib.NWS_BUDGET_MS + 1500, 'a hung forecast is cut off at its budget');
    assert.equal(slot(out, 'courts').source, 'schedule');
    assert.equal(out.frozen, true);
  }
});

test('today\'s courts: the default forecast reads the NWS gridpoint with a short fuse, and any failure is no forecast', async () => {
  const fetched = [];
  const periods = [{ startTime: '2026-10-24T15:00:00Z', endTime: '2026-10-24T16:00:00Z', temperature: 64, temperatureUnit: 'F', windSpeed: '6 mph' }];
  const ok = await withFetch((url) => { fetched.push(url); return new Response(JSON.stringify({ properties: { periods } })); }, () => lib.nwsPeriods('2026-10-24', Date.now(), {}));
  assert.deepEqual(ok, periods);
  assert.deepEqual(fetched, ['https://api.weather.gov/gridpoints/LOX/148,40/forecast/hourly']);
  assert.equal(await withFetch(() => new Response('down', { status: 503 }), () => lib.nwsPeriods('2026-10-24', Date.now(), {})), null);
  assert.equal(await withFetch(() => new Response('{"properties":{}}'), () => lib.nwsPeriods('2026-10-24', Date.now(), {})), null);
  assert.equal(await withFetch(() => new Response('not json'), () => lib.nwsPeriods('2026-10-24', Date.now(), {})), null);
  assert.equal(await withFetch(() => { throw new Error('offline'); }, () => lib.nwsPeriods('2026-10-24', Date.now(), {})), null);
  // Sunset is the almanac's own math, for any real date.
  assert.match(lib.sunsetLabel('2026-10-24'), /^\d{1,2}:\d{2} PM$/);
  assert.match(lib.sunsetLabel('2026-06-21'), /^\d{1,2}:\d{2} PM$/);
});

test('GET /morning.json: a morning with no reading serves the posted schedules, frozen with the edition', async () => {
  const t = town();
  const date = '2026-10-05'; // a Monday; Sunday had no reports
  const frozen = await lib.editionFor(t.env, { config, date, now: cutoffMs(date) + MIN, origin: 'https://pointcast.xyz', nws: noNws, klax: klaxUnder });
  assert.equal(frozen.frozen, true);
  const res = await get(t.env, `/morning.json?d=${date}`, cutoffMs(date) + 180 * MIN, date);
  assert.equal(res.status, 200);
  const courts = res.body.items[0]._pointcast.slots.find((x) => x.id === 'courts');
  assert.equal(courts.line, `${todaysLine(date)} ${COURT_CALL}`);
  assert.match(courts.line, /^Today's courts: /);
  assert.equal(courts.source, 'schedule');
  assert.equal(courts.fallback, true);
  assert.equal(courts.spot, 'courts');
  assert.deepEqual(courts.reportIds, []);
  assert.match(res.body.items[0].content_text, /^Sky · 6\.100: .*\nCourts · 7\.500: Today's courts: /, 'and the plain-text copy carries it');
  noHashes(res.body);
});
