import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import { codeHash, guestByline, parseAirReport, parseConfirm, pidHash, spotOf } from '../functions/_lib/air-kinds.mjs';
import { ogAssetExists } from '../src/lib/seo-paths.mjs';
import { claimDevice, confirmReport, fileReport, mePayload, spotPayload, stationsPayload, targetOf, whoIs } from '../functions/_lib/air-store.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const ROUTES = ['functions/api/air/index.ts', 'functions/api/air/[spot].ts', 'functions/api/air/confirm.ts', 'functions/api/air/me.ts', 'functions/api/air/claim.ts', 'functions/api/air/assign.ts'];
const STORE = 'functions/_lib/air-store.ts';
// [spot].ts, like og/live/[room].ts: the build's SEO pass only keeps an og:image
// a function serves, and it reads `[param].ts` files. The route strips the .png.
const OG = 'functions/og/r/[spot].ts';
const src = Object.fromEntries(await Promise.all([...ROUTES, STORE, OG, 'functions/api/shortwave.ts'].map(async (p) => [p, await read(p)])));
const air = [...ROUTES, STORE, OG];
const DEV = {
  a: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', b: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', c: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  d: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', e: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', f: 'ffffffff-ffff-4fff-bfff-ffffffffffff',
};

/* ---------- source contract (spec §10) ---------- */

test('air API source: D1 through prepared statements with bound values only, never SQL built from strings', () => {
  for (const file of air) {
    const text = src[file];
    const prepares = text.split('.prepare(').length - 1;
    const bound = [...text.matchAll(/\.prepare\(\s*(`[^`]*`|'[^']*'|"[^"]*")\s*\)\s*\.bind\(/g)];
    assert.equal(bound.length, prepares, `${file}: every .prepare( takes a literal and is followed by .bind(`);
    for (const [, sql] of bound) assert.ok(!sql.includes('${'), `${file}: no interpolated SQL: ${sql.slice(0, 60)}`);
    assert.doesNotMatch(text, /\.exec\(/, `${file}: no exec`);
  }
});

test('air API source: the only KV write is the station post, through writeStationPost', () => {
  for (const file of air) assert.doesNotMatch(src[file], /\.put\(/, `${file} writes KV directly`);
  assert.match(src[STORE], /writeStationPost\(env, /);
  const sw = src['functions/api/shortwave.ts'];
  const station = sw.slice(sw.indexOf('export async function writeStationPost'));
  assert.match(station.slice(0, station.indexOf('\n}\n')), /env\.VISITS\.put\(PREFIX \+ id/);
  assert.match(src[STORE], /INSERT OR IGNORE INTO air_broadcasts/, 'the first post claims its window before writing');
  assert.match(src[STORE], /WHERE air_broadcasts\.crew_at IS NULL/, 'the crew update fires once per window');
});

test('air API source: every POST checks Origin, JSON and size before anything else', () => {
  assert.match(src[STORE], /request\.headers\.get\('Origin'\) !== new URL\(request\.url\)\.origin\) return \{ refused: fail\('bad-origin', 403\) \}/);
  assert.match(src[STORE], /AIR_LIMITS\.bodyBytes/);
  for (const file of ['functions/api/air/[spot].ts', 'functions/api/air/confirm.ts', 'functions/api/air/claim.ts', 'functions/api/air/assign.ts']) {
    const post = src[file].slice(src[file].indexOf('export const onRequestPost'));
    assert.match(post, /^export const onRequestPost[^\n]*\n\s+const read = await readPost\(request\);\n\s+if \('refused' in read\) return read\.refused;/, `${file} reads through readPost first`);
  }
  for (const file of ROUTES) assert.match(src[file], /if \(!env\.AUTH_DB\) return unavailable\(\);/, `${file} fails closed without D1`);
});

test('air API source: pid_hash and ip_hash never reach a response builder', () => {
  for (const file of [...ROUTES, OG]) assert.doesNotMatch(src[file], /pid_hash|ip_hash/, `${file} touches a hash`);
  const store = src[STORE];
  const marker = store.indexOf('/* ---------- views:');
  assert.ok(marker > 0, 'the views section is marked');
  assert.doesNotMatch(store.slice(marker), /pid_hash|ip_hash|\bpid\b|\bip\b/, 'the views section never reads a hash');
  // Above the views, every body goes out through a view (or the claim tally).
  for (const [call] of store.slice(0, marker).matchAll(/\bjson\([^\n]{0,40}/g)) {
    if (/^json\(\{ ok: false, reason(, \.\.\.extra \}|: 'rate-limited')/.test(call)) continue; // fail() and limited() themselves
    assert.match(call, /^json\((view\w+\(|\{ ok: true, moved:)/, `unshaped response: ${call}`);
  }
  assert.match(store, /return viewPayload\(t, data, now, you\);/);
  assert.match(store, /return viewStation\(spot, kind, r, lastAt\);/);
  assert.match(store, /fail\('already-confirmed', 409, \{ reading: viewReading\(/);
});

test('air API source: rateLimit (KV) only guards claim; everything else counts D1 rows', () => {
  for (const file of air) {
    if (file.endsWith('claim.ts')) continue;
    assert.doesNotMatch(src[file], /rateLimit\(|_rate-limit|PC_RATES_KV\.(get|put)/, `${file} uses the KV limiter`);
  }
  assert.match(src['functions/api/air/claim.ts'], /rateLimit\(request, env, \{ bucket: 'air:claim', windowSec: 3600, maxRequests: 5, clientId: `user:\$\{who\.userId\}` \}\)/);
});

test('air routes: reserved ids are their own files or refused, never a spot', async () => {
  for (const id of config.reserved) assert.equal(spotOf(config, id), null, id);
  for (const id of config.reserved) assert.equal(targetOf(config, id), null, id);
  for (const name of ['confirm', 'me', 'claim', 'index', 'assign']) assert.ok(src[`functions/api/air/${name}.ts`], `${name}.ts routes before [spot].ts`);
  assert.equal(parseAirReport(config, 'board', { kind: 'wait', value: '0', device: DEV.a }).reason, 'bad-spot');
  assert.match(src[OG], /pngResponse\(await renderPng\(svg\), 60,/, 'the unfurl card caches for a minute');
  assert.match(src[OG], /onRequestHead/);
  assert.match(src[OG], /raw\.replace\(\/\\\.png\$\/, ''\)/, '/og/r/courts.png reaches the route as courts.png');
});

test('the per-spot unfurl card survives the build: the SEO pass sees a function serving /og/r/<spot>.png', () => {
  const roots = { distDir: new URL('dist', root).pathname, publicDir: new URL('public', root).pathname, functionsDir: new URL('functions', root).pathname };
  for (const s of config.spots) assert.ok(ogAssetExists(`https://pointcast.xyz/og/r/${s.id}.png`, roots), s.id);
});

/* ---------- the Friday court moment, end to end on node:sqlite ---------- */

const MIGRATIONS = (await Promise.all(['0001_init.sql', '0023_air.sql', '0024_air_assignments.sql'].map((f) => read(`migrations/auth/${f}`)))).join('\n');
// Fixture codes, seeded only in this test DB under a test pepper. Real codes live in an untracked seed.
const PEPPER = 'test-pepper';
const CRT = 'CRTFIXTURE9';
const BCH = 'BCHFIXTURE9';
const SEED = [['courts', await codeHash('courts', CRT, PEPPER)], ['beach', await codeHash('beach', BCH, PEPPER)]];

/** D1 over node:sqlite: statements that read (SELECT or RETURNING) hand back rows, batches are one transaction. */
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
class Store {
  data = new Map(); writes = []; last = new Map(); oncePerSecond = false;
  async get(key, type) { const v = this.data.get(key); return v === undefined ? null : type === 'json' ? JSON.parse(v) : v; }
  async put(key, value, options) {
    // Like Workers KV: a second write to one key inside a second is refused (429).
    if (this.oncePerSecond && Date.now() - (this.last.get(key) ?? -Infinity) < 1000) throw new Error('KV PUT failed: 429 Too Many Requests');
    this.last.set(key, Date.now());
    this.data.set(key, value); this.writes.push({ key, options });
  }
  async list({ prefix, limit }) { const names = [...this.data.keys()].filter((k) => k.startsWith(prefix)).sort().slice(0, limit); return { keys: names.map((name) => ({ name })), list_complete: true }; }
}

const MIN = 60_000;
const HOUR_MS = 60 * MIN;
const T0 = Date.parse('2026-10-02T14:36:00Z'); // Fri 7:36 AM in El Segundo

function town() {
  const bursts = [];
  const env = {
    AUTH_DB: new SqliteD1(),
    VISITS: new Store(),
    AIR_CODE_PEPPER: PEPPER,
    PRESENCE: { idFromName: (n) => n, get: () => ({ fetch: async (req) => { bursts.push(await req.json()); return new Response('{}'); } }) },
  };
  const later = [];
  const defer = (p) => later.push(p);
  const settle = () => Promise.all(later.splice(0));
  const signIn = async (userId, handle) => {
    env.AUTH_DB.db.prepare('INSERT INTO users (id, payload, created_at) VALUES (?, ?, ?)').run(userId, JSON.stringify({ userId, createdAt: '2026-09-01T00:00:00Z', identities: [], preferredName: handle }), '2026-09-01T00:00:00Z');
    env.AUTH_DB.db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(`pcs_${handle}`, userId, Date.now() + 86_400_000);
    await env.VISITS.put(`card:v1:user:${userId}`, JSON.stringify({ handle, name: handle, noun: 7 }));
    return `pc_session=pcs_${handle}`;
  };
  return { env, bursts, defer, settle, signIn };
}
const req = (path, cookie = '', ip = '192.0.2.10') => new Request(`https://pointcast.xyz/api/air/${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://pointcast.xyz', 'CF-Connecting-IP': ip, ...(cookie ? { cookie } : {}) }, body: '{}',
});
/** Each phone on its own connection unless a test says otherwise. */
const ipOf = (device) => `192.0.2.${device ? device.charCodeAt(0) : 10}`;
async function report(t, spot, body, now, cookie = '', ip = ipOf(body.device)) {
  const p = parseAirReport(config, spot, body, now);
  assert.ok(!p.reason, p.reason);
  const res = await fileReport(req(spot, cookie, ip), t.env, t.env.AUTH_DB, config, p, now, t.defer);
  return { status: res.status, body: await res.json() };
}
async function confirm(t, body, now, cookie = '', ip = ipOf(body.device)) {
  const c = parseConfirm(body);
  assert.ok(!c.reason, c.reason);
  const res = await confirmReport(req('confirm', cookie, ip), t.env, t.env.AUTH_DB, config, c, now, t.defer);
  return { status: res.status, body: await res.json() };
}
const noHashes = async (value) => {
  const text = JSON.stringify(value);
  assert.doesNotMatch(text, /pid_hash|ip_hash/);
  for (const d of Object.values(DEV)) assert.ok(!text.includes(await pidHash(d)), 'a phone hash leaked');
};

test('Friday: first light, a confirm, the third phone makes a crew, one station post updated in place', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  const courts = targetOf(config, 'courts');

  // 7:36 Mike opens the day.
  const mike = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT.toLowerCase() }, T0);
  assert.equal(mike.status, 201);
  assert.equal(mike.body.replaced, false);
  assert.deepEqual(mike.body.report.onsite, true);
  assert.equal(mike.body.report.code, 'ok');
  assert.equal(mike.body.report.byline, guestByline(await pidHash(DEV.a)));
  assert.equal(mike.body.report.label, '1–4 in the rack');
  assert.equal(mike.body.award.points, 10, 'report 6 + first light 4');
  assert.equal(mike.body.award.pointsToday, 10);
  assert.equal(mike.body.award.firstLight, true);
  assert.deepEqual(mike.body.award.badges, ['first-light']);
  assert.deepEqual(mike.body.award.stamps, [
    { kind: 'place', ref: 'courts', day: '2026-10-02', text: 'MANHATTAN MIDDLE · FRI 02 OCT 2026', new: true },
    { kind: 'badge', ref: 'first-light', day: '-', text: 'FIRST LIGHT', new: true },
  ]);
  assert.equal(mike.body.award.more, 0);
  assert.equal(mike.body.award.streakWeeks, 1);
  assert.equal(mike.body.reading.status, 'single');
  assert.ok(mike.body.claim.until);
  await noHashes(mike.body);
  await t.settle();
  const keys = () => [...t.env.VISITS.data.keys()].filter((k) => k.startsWith('shortwave:post:v1:'));
  const postWrites = () => t.env.VISITS.writes.filter((w) => w.key.startsWith('shortwave:post:v1:')).length;
  assert.equal(keys().length, 1);
  const first = JSON.parse(t.env.VISITS.data.get(keys()[0]));
  assert.equal(first.via, 'air'); assert.equal(first.attribution, 'station'); assert.equal(first.mhz, 7.5); assert.equal(first.spot, 'courts');
  assert.equal(first.text, 'On the air from Manhattan Middle School courts: 1–4 in the rack · 1 reporter · 7:36');
  assert.equal(t.bursts.length, 1);
  assert.deepEqual([t.bursts[0].meta.air, t.bursts[0].meta.spot, t.bursts[0].meta.mhz], [true, 'courts', 7.5]);

  // Every stamp row carries its rarity traits.
  const traits = db.rows("SELECT meta_json FROM air_stamps WHERE kind = 'place'").map((r) => JSON.parse(r.meta_json));
  assert.deepEqual(traits, [{ spot: 'courts', kind: 'wait', weekday: 5, hour: 7, crewSize: null, firstLight: true, deadAirHours: null, geo: false, answer: '1-4' }]);

  // A second tap in the same slot replaces the answer and earns nothing.
  const again = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT, extras: ['wind'] }, T0 + 30_000);
  assert.equal(again.status, 200);
  assert.equal(again.body.replaced, true);
  assert.equal(again.body.award.points, 0);
  assert.equal(again.body.report.id, mike.body.report.id);
  // An older queued tap for that slot changes nothing.
  const stale = await report(t, 'courts', { kind: 'wait', value: '5-8', device: DEV.a, code: CRT, observedAt: T0 + 10_000 }, T0 + 40_000);
  assert.equal(stale.body.replaced, true);
  assert.equal(stale.body.report.value, '1-4');
  await t.settle();
  assert.equal(postWrites(), 1, 'no new post for a replacement');

  // 7:38 Jen: "Still 1–4 waiting?" Yes.
  const jen = await confirm(t, { reportId: mike.body.report.id, verdict: 'still', device: DEV.b, code: CRT }, T0 + 2 * MIN);
  assert.equal(jen.status, 200);
  assert.equal(jen.body.award.points, 3);
  assert.equal(jen.body.reading.status, 'agree');
  assert.equal(jen.body.reading.support, 2);
  assert.equal(jen.body.next, null);
  assert.deepEqual(jen.body.award.stamps.map((s) => s.text), ['MANHATTAN MIDDLE · FRI 02 OCT 2026']);
  assert.equal((await confirm(t, { reportId: mike.body.report.id, verdict: 'still', device: DEV.b, code: CRT }, T0 + 3 * MIN)).status, 409);
  const own = await confirm(t, { reportId: mike.body.report.id, verdict: 'still', device: DEV.a, code: CRT }, T0 + 3 * MIN);
  assert.equal(own.status, 400); assert.equal(own.body.reason, 'own-report');

  // 7:39 Sam, signed in, is the third phone.
  const cookie = await t.signIn('u_sam', 'sam');
  const sam = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.c, code: CRT }, T0 + 3 * MIN, cookie);
  assert.equal(sam.status, 201);
  assert.equal(sam.body.report.byline, '@sam');
  assert.equal(sam.body.award.firstLight, false);
  assert.equal(sam.body.award.points, 6);
  assert.deepEqual(sam.body.award.crew, { id: 'courts:2026-10-02:10', n: 3, at: '2026-10-02T14:39:00Z' });
  assert.deepEqual(sam.body.award.badges, ['morning-crew']);
  assert.deepEqual(sam.body.award.stamps.map((s) => s.text), ['MANHATTAN MIDDLE · FRI 02 OCT 2026', 'MORNING CREW · MANHATTAN MIDDLE · FRI 02 OCT 2026']);
  assert.equal(sam.body.award.more, 1, 'the MORNING CREW badge goes in the book, counted, not slammed');
  assert.equal(sam.body.claim, null, 'a signed-in reporter has nothing to claim');
  assert.equal(sam.body.reading.support, 3);
  assert.deepEqual(sam.body.reading.bylines, [guestByline(await pidHash(DEV.a)), guestByline(await pidHash(DEV.b)), '@sam']);
  await noHashes(sam.body);
  await t.settle();
  assert.equal(keys().length, 1, 'the crew updates the window\'s post in place');
  const crewPost = JSON.parse(t.env.VISITS.data.get(keys()[0]));
  assert.equal(crewPost.text, 'On the air from Manhattan Middle School courts: 1–4 in the rack · 3 agree · 7:39');
  assert.equal(crewPost.at, first.at);
  assert.equal(t.bursts.length, 2);
  assert.equal(db.rows("SELECT COUNT(*) AS n FROM air_stamps WHERE kind = 'crew'")[0].n, 3, 'every member gets the crew stamp');
  assert.equal(db.rows("SELECT COUNT(*) AS n FROM air_stamps WHERE kind = 'badge' AND ref = 'morning-crew'")[0].n, 3);
  assert.equal(JSON.parse(db.rows("SELECT meta_json FROM air_stamps WHERE kind = 'crew' LIMIT 1")[0].meta_json).crewSize, 3);

  // A fourth phone joins the crew but the post does not change again.
  const dee = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.d, code: CRT }, T0 + 5 * MIN);
  assert.ok(dee.body.award.stamps.some((s) => s.kind === 'crew'));
  await t.settle();
  assert.equal(postWrites(), 2, 'at most two KV writes per window');

  // Remote: no code, or a code that isn't valid, is shown but never counts.
  const remote = await report(t, 'courts', { kind: 'wait', value: '5-8', device: DEV.e }, T0 + 6 * MIN);
  assert.equal(remote.body.report.onsite, false); assert.equal(remote.body.report.code, 'none');
  assert.equal(remote.body.award.points, 0); assert.deepEqual(remote.body.award.stamps, []);
  assert.equal(remote.body.reading.value, '1-4');
  const wrong = await report(t, 'courts', { kind: 'wait', value: '5-8', device: DEV.f, code: BCH }, T0 + 6 * MIN);
  assert.equal(wrong.body.report.code, 'unknown');

  // The poll: a phone that confirmed sees it is in the crew.
  const page = await spotPayload(t.env, db, courts, T0 + 7 * MIN, DEV.b);
  assert.equal(page.you.crewMember, true);
  assert.deepEqual(page.you.confirmed, [mike.body.report.id]);
  assert.equal(page.today.length, 5);
  assert.equal(page.today.find((r) => r.id === mike.body.report.id).confirms, 1);
  assert.equal(page.today.find((r) => r.id === remote.body.report.id).onsite, false);
  assert.equal(page.reading.crew.id, 'courts:2026-10-02:10');
  assert.equal(page.spot.question, 'Paddles in the rack?');
  await noHashes(page);

  const all = await stationsPayload(db, config, T0 + 7 * MIN);
  assert.deepEqual(all.spots[0].reading, { label: '1–4 in the rack', status: 'agree', ageMin: 2, bars: 5 });
  assert.equal(all.spots[1].reading, null);
  assert.equal(all.courtCall.live, true);

  // Past the 45-minute decay a confirm is refused (Jen's 7:38 "still" kept Mike's report live until 8:23); an unknown report is not found.
  assert.equal((await confirm(t, { reportId: mike.body.report.id, verdict: 'still', device: DEV.e, code: CRT }, T0 + 48 * MIN)).status, 410);
  assert.equal((await confirm(t, { reportId: 'ar_00000000000000000000', verdict: 'still', device: DEV.e }, T0 + 7 * MIN)).status, 404);
  const changed = await confirm(t, { reportId: sam.body.report.id, verdict: 'changed', device: DEV.e, code: CRT }, T0 + 8 * MIN);
  assert.equal(changed.body.next, 'report');

  // Saturday: yesterday's last reading, with bylines.
  const sat = await spotPayload(t.env, db, courts, Date.parse('2026-10-03T15:00:00Z'));
  assert.equal(sat.reading.status, 'none');
  assert.equal(sat.yesterday.label, '1–4 in the rack');
  assert.equal(sat.yesterday.support, 4);
  assert.equal(sat.yesterday.more, 1);
  assert.deepEqual(sat.today, []);
});

test('the beach: "can\'t say" pays 1, never takes first light and never goes on the air', async () => {
  const t = town();
  const cant = await report(t, 'beach', { kind: 'fog', value: 'cant', device: DEV.a, code: BCH }, T0);
  assert.equal(cant.body.award.points, 1);
  assert.equal(cant.body.award.firstLight, false);
  await t.settle();
  assert.equal(t.env.VISITS.writes.length, 0);
  const hazy = await report(t, 'beach', { kind: 'fog', value: 'hazy', device: DEV.b, code: BCH.toLowerCase() }, T0 + MIN);
  assert.equal(hazy.body.award.firstLight, true);
  assert.equal(hazy.body.award.points, 10);
  await t.settle();
  const post = JSON.parse([...t.env.VISITS.data.values()][0]);
  assert.equal(post.mhz, 6.1);
  assert.equal(post.text, 'On the air from Grand Ave beach: Pier hazy · 1 reporter · 7:37');
  const traits = JSON.parse(t.env.AUTH_DB.rows("SELECT meta_json FROM air_stamps WHERE owner LIKE 'dev:%' AND kind = 'place' ORDER BY created_at DESC LIMIT 1")[0].meta_json);
  assert.equal(traits.deadAirHours, 0, 'dead air counts from the earlier on-site report');
});

test('limits count D1 rows: a busy phone gets 429 with retryAfter', async () => {
  const t = town();
  const pid = await pidHash(DEV.a);
  const insert = t.env.AUTH_DB.db.prepare(`INSERT INTO air_reports (id, spot, kind, value, observed_at, day, slot, pid_hash, ip_hash, byline, onsite, created_at)
    VALUES (?, 'courts', 'wait', '0', ?, '2026-10-02', ?, ?, 'x', 'Guest', 0, ?)`);
  for (let i = 0; i < 12; i++) insert.run(`ar_${String(i).padStart(20, '0')}`, T0 - 50 * MIN + i, -i, pid, T0 - 50 * MIN + i);
  const busy = await report(t, 'courts', { kind: 'wait', value: '0', device: DEV.a, code: CRT }, T0);
  assert.equal(busy.status, 429);
  assert.equal(busy.body.reason, 'rate-limited');
  assert.equal(busy.body.retryAfter, 600, 'the oldest counted row ages out in ten minutes');
});

test('claim moves a phone\'s day to the account and its card handle; /me only shows your own', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  const filed = await report(t, 'courts', { kind: 'wait', value: '0', device: DEV.a, code: CRT }, T0);
  await confirm(t, { reportId: filed.body.report.id, verdict: 'still', device: DEV.b, code: CRT }, T0 + MIN);
  const guest = await (await mePayload(req('me'), t.env, db, config, DEV.a, T0 + 2 * MIN)).json();
  assert.equal(guest.owner, 'device');
  assert.deepEqual(guest.points, { today: 10, total: 10, assigned: 0 });
  assert.deepEqual(guest.badges, ['first-light']);
  assert.equal(guest.stamps[0].text, 'MANHATTAN MIDDLE · FRI 02 OCT 2026');
  assert.equal(guest.stamps[0].traits.answer, '0');
  assert.equal(guest.stamps[0].traits.value, undefined, 'the answer is namespaced, never a bare value');
  assert.equal(guest.stamps[0].traits.geo, false);
  assert.equal(guest.reports.length, 1);
  assert.equal(guest.streakWeeks, 1);
  await noHashes(guest);

  const cookie = await t.signIn('u_mike', 'mike');
  const who = await whoIs(req('claim', cookie), t.env);
  assert.deepEqual(who, { userId: 'u_mike', handle: 'mike' });
  const before = await (await mePayload(req('me', cookie), t.env, db, config, DEV.a, Date.now())).json();
  assert.equal(before.owner, 'user');
  assert.ok(before.claimable, 'signed in with an unclaimed phone');
  const moved = await (await claimDevice(db, who, DEV.a, T0 + 3 * MIN)).json();
  assert.deepEqual(moved, { ok: true, moved: { reports: 1, confirms: 0, points: 2, stamps: 2 }, byline: '@mike' });
  assert.equal(db.rows('SELECT byline FROM air_reports')[0].byline, '@mike');
  const card = await (await mePayload(req('me', cookie), t.env, db, config, null, T0 + 4 * MIN)).json();
  assert.equal(card.byline, '@mike');
  assert.deepEqual(card.points, { today: 10, total: 10, assigned: 0 });
  assert.equal(card.reports[0].byline, '@mike');
  const jen = await (await mePayload(req('me'), t.env, db, config, DEV.b, T0 + 4 * MIN)).json();
  assert.equal(jen.points.total, 3, 'another phone sees only its own');
});

/* ---------- review fixes, 2026-09-28 ---------- */

const uuid = () => crypto.randomUUID();

test('limits count server time: a backdated flood from one IP still stops at 40 in ten minutes', async () => {
  const t = town();
  let limitedN = 0;
  for (let i = 0; i < 60; i++) {
    const r = await report(t, 'courts', { kind: 'wait', value: '5-8', device: uuid(), code: CRT, observedAt: T0 - 11 * MIN }, T0, '', '198.51.100.7');
    if (r.status === 429) limitedN++;
  }
  assert.equal(limitedN, 20);
  const page = await spotPayload(t.env, t.env.AUTH_DB, targetOf(config, 'courts'), T0);
  assert.equal(page.reading.support, 40);
  assert.equal(page.reading.crew, null, 'one network is never a crew');
});

test('station post: a crew a moment after the first post still ends on the crew line, a second later', async () => {
  const t = town();
  t.env.VISITS.oncePerSecond = true;
  const mike = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, T0);
  await confirm(t, { reportId: mike.body.report.id, verdict: 'still', device: DEV.b, code: CRT }, T0 + 100);
  const sam = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.c, code: CRT }, T0 + 300);
  assert.ok(sam.body.award.crew);
  await t.settle();
  const keys = [...t.env.VISITS.data.keys()].filter((k) => k.startsWith('shortwave:post:v1:'));
  assert.equal(keys.length, 1);
  assert.equal(JSON.parse(t.env.VISITS.data.get(keys[0])).text, 'On the air from Manhattan Middle School courts: 1–4 in the rack · 3 agree · 7:36');
});

test('a "still" keeps its report confirmable and on the air past the report\'s own decay', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  const courts = targetOf(config, 'courts');
  const R0 = Date.parse('2026-10-02T14:00:00Z'); // 7:00 AM
  const mike = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, R0);
  assert.equal((await confirm(t, { reportId: mike.body.report.id, verdict: 'still', device: DEV.b, code: CRT }, R0 + 40 * MIN)).status, 200);
  const at750 = await spotPayload(t.env, db, courts, R0 + 50 * MIN);
  assert.equal(at750.reading.status, 'single');
  assert.equal(at750.reading.ageMin, 10);
  assert.equal(at750.reading.reportId, mike.body.report.id);
  const sam = await confirm(t, { reportId: at750.reading.reportId, verdict: 'still', device: DEV.c, code: CRT }, R0 + 50 * MIN);
  assert.equal(sam.status, 200, 'the report the strip offers is the report the server takes');
  assert.equal(sam.body.reading.support, 2);
  // 8:20: the report is 80 minutes old, the confirms keep it live on /r and the unfurl card.
  const all = await stationsPayload(db, config, R0 + 80 * MIN);
  assert.equal(all.spots[0].reading?.label, '1–4 in the rack');
  const page = await spotPayload(t.env, db, courts, R0 + 80 * MIN);
  assert.equal(page.reading.support, 2);
  // Once the last "still" ages out, the report expires.
  assert.equal((await confirm(t, { reportId: mike.body.report.id, verdict: 'still', device: DEV.d, code: CRT }, R0 + 96 * MIN)).status, 410);
});

test('awards: a retry after a failed write pays; a row that turns on-site or moves off "can\'t say" pays what it has not', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  // The points batch fails once, after first light was claimed.
  const batch = db.batch.bind(db);
  let failOnce = true;
  db.batch = async (stmts) => {
    if (failOnce && stmts.length && /INTO air_points/.test(String(stmts[0].sql ?? ''))) { failOnce = false; throw new Error('D1_ERROR: network'); }
    return batch(stmts);
  };
  const orig = db.prepare.bind(db);
  db.prepare = (sql) => Object.assign(orig(sql), { sql });
  const body = { kind: 'wait', value: '1-4', device: DEV.a, code: CRT, observedAt: T0 };
  await assert.rejects(report(t, 'courts', body, T0));
  assert.equal(db.rows('SELECT COUNT(*) AS n FROM air_firsts')[0].n, 1);
  const retry = await report(t, 'courts', body, T0 + 1000);
  assert.equal(retry.body.replaced, true);
  assert.equal(retry.body.award.points, 10, 'report 6 + first light 4, paid on the retry');
  assert.equal(retry.body.award.firstLight, true);
  assert.deepEqual(retry.body.award.stamps.map((s) => s.text), ['MANHATTAN MIDDLE · FRI 02 OCT 2026', 'FIRST LIGHT']);
  const again = await report(t, 'courts', { ...body, observedAt: T0 + 2000 }, T0 + 2000);
  assert.equal(again.body.award.points, 0, 'paid once');
  assert.equal(again.body.award.firstLight, false);

  // Remote first, then the group link in the same slot: the on-site answer pays.
  const away = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.b }, T0 + 2 * MIN);
  assert.equal(away.body.award.points, 0);
  const there = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.b, code: CRT }, T0 + 10 * MIN);
  assert.equal(there.body.replaced, true);
  assert.equal(there.body.report.onsite, true);
  assert.equal(there.body.award.points, 6);
  assert.deepEqual(there.body.award.stamps.map((s) => s.kind), ['place']);

  // "Can't say" first at the beach, then a real answer: first light follows the answer.
  const cant = await report(t, 'beach', { kind: 'fog', value: 'cant', device: DEV.c, code: BCH }, T0);
  assert.equal(cant.body.award.points, 1);
  assert.equal(cant.body.award.firstLight, false);
  const hazy = await report(t, 'beach', { kind: 'fog', value: 'hazy', device: DEV.c, code: BCH }, T0 + MIN);
  assert.equal(hazy.body.replaced, true);
  assert.equal(hazy.body.award.firstLight, true);
  assert.equal(hazy.body.award.points, 4, 'first light only; the report already paid');
  assert.deepEqual(hazy.body.award.badges, ['first-light']);
});

test('a confirm stands for the value it saw; a changed answer does not take its supporters', async () => {
  const t = town();
  const p1 = await report(t, 'courts', { kind: 'wait', value: '0', device: DEV.a, code: CRT }, T0 + MIN);
  await confirm(t, { reportId: p1.body.report.id, verdict: 'still', device: DEV.b, code: CRT }, T0 + 3 * MIN);
  const changed = await report(t, 'courts', { kind: 'wait', value: '5-8', device: DEV.a, code: CRT }, T0 + 5 * MIN);
  assert.equal(changed.body.report.id, p1.body.report.id);
  assert.equal(changed.body.reading.value, '5-8');
  assert.equal(changed.body.reading.support, 1);
  assert.deepEqual(changed.body.reading.bylines, [guestByline(await pidHash(DEV.a))]);
});

test('the crew is the day\'s first one: a sliding window of the same people never re-forms it', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  const courts = targetOf(config, 'courts');
  const at = (hhmm) => Date.parse(`2026-10-02T${String(Number(hhmm.slice(0, 1)) + 7).padStart(2, '0')}:${hhmm.slice(2)}:00Z`);
  const a = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, at('7:40'));
  await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.b, code: CRT }, at('7:50'));
  const c = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.c, code: CRT }, at('8:10'));
  assert.equal(c.body.award.crew.id, 'courts:2026-10-02:10');
  const d = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.d, code: CRT }, at('8:20'));
  assert.equal(d.body.award.crew.id, 'courts:2026-10-02:10', 'D joins the crew; it keeps its id');
  assert.equal(d.body.award.crew.n, 4, 'n is everyone stamped into the crew today');
  assert.ok(d.body.award.stamps.some((s) => s.kind === 'crew'));
  await t.settle();
  const crewPosts = [...t.env.VISITS.data.values()].map((v) => JSON.parse(v).text).filter((x) => x.includes(' agree '));
  assert.deepEqual(crewPosts.filter((x) => x.endsWith('8:10')), ['On the air from Manhattan Middle School courts: 1–4 in the rack · 3 agree · 8:10']);
  assert.equal(db.rows('SELECT COUNT(*) AS n FROM air_broadcasts WHERE crew_at IS NOT NULL')[0].n, 1, 'one crew update all day');
  // 8:52: the sliding window is empty, the crew is still the day's, and B slept through it.
  const b = await spotPayload(t.env, db, courts, at('8:52'), DEV.b);
  assert.deepEqual(b.reading.crew, { id: 'courts:2026-10-02:10', n: 4, at: '2026-10-02T15:10:00Z' });
  assert.equal(b.you.crewMember, true);
  const e = await spotPayload(t.env, db, courts, at('8:52'), DEV.e);
  assert.equal(e.you.crewMember, false);
  assert.ok(a.body.report.id);
});

test('one network cannot agree with itself: a same-IP confirm counts nothing unless it is another account', async () => {
  const t = town();
  const home = '203.0.113.50';
  const mike = await report(t, 'courts', { kind: 'wait', value: '5-8', device: DEV.a, code: CRT }, T0, '', home);
  const sock = await confirm(t, { reportId: mike.body.report.id, verdict: 'still', device: uuid(), code: CRT }, T0 + MIN, '', home);
  assert.equal(sock.status, 200);
  assert.equal(sock.body.onsite, false);
  assert.equal(sock.body.award.points, 0);
  assert.equal(sock.body.reading.support, 1);
  const cookie = await t.signIn('u_jen', 'jen');
  const jen = await confirm(t, { reportId: mike.body.report.id, verdict: 'still', device: DEV.b, code: CRT }, T0 + 2 * MIN, cookie, home);
  assert.equal(jen.body.onsite, true, 'a different signed-in account on the same wifi counts');
  assert.equal(jen.body.reading.support, 2);
  // Three phones on one address: Jen is signed in, so her phone is its own network
  // (friends on one carrier share a CGNAT address) and the third phone completes the crew.
  const third = await report(t, 'courts', { kind: 'wait', value: '5-8', device: uuid(), code: CRT }, T0 + 3 * MIN, '', home);
  assert.ok(third.body.award.crew, 'two guests and one signed-in phone on one address make a crew');
});

test('claim re-pays a phone\'s points under the account\'s daily cap', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, T0);
  db.db.prepare("INSERT INTO air_points (id, owner, action, ref, units, day, report_id, created_at) VALUES ('ap_seed', 'user:u1', 'report', 'beach:fog:2026-10-02:3', 25, '2026-10-02', NULL, ?)").run(T0 - HOUR_MS);
  const moved = await (await claimDevice(db, { userId: 'u1', handle: 'mike' }, DEV.a, T0 + MIN)).json();
  assert.equal(moved.moved.points, 2);
  assert.equal(db.rows("SELECT SUM(units) AS n FROM air_points WHERE owner = 'user:u1' AND day = '2026-10-02'")[0].n, 30, 'capped at 30');
  assert.equal(db.rows("SELECT COUNT(*) AS n FROM air_points WHERE owner LIKE 'dev:%'")[0].n, 0, 'nothing left on the phone to claim twice');
});

/* ---------- critic revision, PR 1: open hours, the two-stamp receipt, the geo column ---------- */

test('first light keeps open hours: a 00:01 report files and pays but never opens the day; 06:05 does', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  const at = (iso) => Date.parse(iso); // PDT: 00:01 is 07:01Z, 06:05 is 13:05Z
  const bed = await report(t, 'courts', { kind: 'wait', value: '0', device: DEV.a, code: CRT }, at('2026-10-02T07:01:00Z'));
  assert.equal(bed.status, 201, 'it files');
  assert.equal(bed.body.report.onsite, true);
  assert.equal(bed.body.award.points, 6, 'the report pays; no +4');
  assert.equal(bed.body.award.firstLight, false);
  assert.deepEqual(bed.body.award.badges, []);
  assert.deepEqual(bed.body.award.stamps.map((s) => s.kind), ['place']);
  // Changing the answer in the same slot still does not take it.
  const again = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, at('2026-10-02T07:03:00Z'));
  assert.equal(again.body.award.firstLight, false);
  assert.equal(db.rows('SELECT COUNT(*) AS n FROM air_firsts')[0].n, 0, 'nothing claimed outside hours');
  assert.equal(db.rows("SELECT COUNT(*) AS n FROM air_points WHERE action = 'first-light'")[0].n, 0);
  assert.equal(JSON.parse(db.rows("SELECT meta_json FROM air_stamps WHERE kind = 'place'")[0].meta_json).firstLight, false);

  const open = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.b, code: CRT }, at('2026-10-02T13:05:00Z'));
  assert.equal(open.body.award.firstLight, true, '06:05 opens the day');
  assert.equal(open.body.award.points, 10);
  assert.deepEqual(open.body.award.badges, ['first-light']);
  assert.equal(db.rows('SELECT report_id FROM air_firsts')[0].report_id, open.body.report.id);
  // The 00:01 phone reporting again in hours finds first light taken.
  const later = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, at('2026-10-02T13:10:00Z'));
  assert.equal(later.body.award.firstLight, false);
});

test('receipt: a Friday report that opens the day and completes a crew writes four stamps and slams two', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  const at = (iso) => Date.parse(iso);
  // 05:50, before the courts open: files, no first light.
  const early = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.a, code: CRT }, at('2026-10-02T12:50:00Z'));
  assert.equal(early.body.award.firstLight, false);
  await confirm(t, { reportId: early.body.report.id, verdict: 'still', device: DEV.b, code: CRT }, at('2026-10-02T12:55:00Z'));
  // 06:02: the third phone takes first light and completes the crew.
  const c = await report(t, 'courts', { kind: 'wait', value: '1-4', device: DEV.c, code: CRT }, at('2026-10-02T13:02:00Z'));
  assert.equal(c.body.award.firstLight, true);
  assert.equal(c.body.award.points, 10);
  assert.ok(c.body.award.crew);
  assert.deepEqual(c.body.award.stamps.map((s) => s.text), ['MANHATTAN MIDDLE · FRI 02 OCT 2026', 'MORNING CREW · MANHATTAN MIDDLE · FRI 02 OCT 2026'], 'the place and morning crew, which outranks first light');
  assert.equal(c.body.award.more, 2, '+2 more in your book: FIRST LIGHT and the MORNING CREW badge');
  assert.deepEqual([...c.body.award.badges].sort(), ['first-light', 'morning-crew']);
  const owner = `dev:${await pidHash(DEV.c)}`;
  const book = db.rows('SELECT kind, ref FROM air_stamps WHERE owner = ? ORDER BY kind, ref', owner).map((s) => `${s.kind}:${s.ref}`);
  assert.deepEqual(book, ['badge:first-light', 'badge:morning-crew', 'crew:courts', 'place:courts'], 'every stamp is written; only the receipt is capped');
  await noHashes(c.body);
});

test('0023: geo is on reports and confirms, 0 or 1, and 0 on every PR 1 write', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  const filed = await report(t, 'courts', { kind: 'wait', value: '0', device: DEV.a, code: CRT }, T0);
  await confirm(t, { reportId: filed.body.report.id, verdict: 'still', device: DEV.b, code: CRT }, T0 + MIN);
  assert.deepEqual(db.rows('SELECT geo FROM air_reports'), [{ geo: 0 }]);
  assert.deepEqual(db.rows('SELECT geo FROM air_confirms'), [{ geo: 0 }]);
  assert.throws(() => db.db.prepare('UPDATE air_reports SET geo = 2').run(), /CHECK/);
  assert.throws(() => db.db.prepare('UPDATE air_confirms SET geo = -1').run(), /CHECK/);
  for (const s of db.rows('SELECT meta_json FROM air_stamps')) assert.equal(JSON.parse(s.meta_json).geo, false);
});

/* ---------- the spot page header, 2026-09-28: today, prior, the week's leaderboard ---------- */

test('header: today, prior and the access override come off the rows; the week counts days on air by @handle only', async () => {
  const t = town();
  const db = t.env.AUTH_DB;
  const courts = targetOf(config, 'courts');
  const at = (day, h, m) => Date.parse(`${day}T00:00:00Z`) + (h + 7) * HOUR_MS + m * MIN; // PDT wall time
  const phone = { claire: uuid(), sam: uuid(), nocard: uuid() };
  const mike = await t.signIn('u_hdr_mike', 'mike');
  db.db.prepare("UPDATE users SET payload = json_set(payload, '$.roles', json_array('broadcaster')) WHERE id = 'u_hdr_mike'").run();
  const claire = await t.signIn('u_hdr_claire', 'claire');
  const sam = await t.signIn('u_hdr_sam', 'sam');
  const nocard = await t.signIn('u_hdr_nocard', 'nocard');
  t.env.VISITS.data.delete('card:v1:user:u_hdr_nocard');
  const wait = (value, device, extra = {}) => ({ kind: 'wait', value, device, code: CRT, ...extra });

  // Last week: not this week's, but Friday's same-weekday line.
  const pidOf = async (d) => pidHash(d);
  const insert = db.db.prepare(`INSERT INTO air_reports (id, spot, kind, value, observed_at, day, slot, pid_hash, ip_hash, user_id, byline, onsite, source, source_url, created_at)
    VALUES (?, 'courts', ?, ?, ?, ?, ?, ?, 'x', ?, ?, ?, ?, ?, ?)`);
  const lastFri = at('2026-09-25', 17, 30);
  insert.run('ar_00000000000000000a01', 'wait', '5-8', lastFri, '2026-09-25', -1, await pidOf(DEV.e), null, 'Guest 1234', 1, 'page', null, lastFri);
  const lastSun = at('2026-09-27', 9, 0);
  insert.run('ar_00000000000000000a02', 'wait', '1-4', lastSun, '2026-09-27', -2, await pidOf(phone.claire), 'u_hdr_claire', '@claire', 1, 'page', null, lastSun);

  // Mon–Wed: Mike three days; Claire Tuesday, and Wednesday with a parking report (any question at the spot is a day there).
  for (const day of ['2026-09-28', '2026-09-29', '2026-09-30']) assert.equal((await report(t, 'courts', wait('1-4', DEV.c), at(day, 8, 0), mike)).body.report.byline, '@mike');
  await report(t, 'courts', wait('0', DEV.a), at('2026-09-28', 8, 5));
  await report(t, 'courts', wait('0', phone.claire), at('2026-09-29', 8, 10), claire);
  await report(t, 'courts', { kind: 'parking', value: 'easy', device: phone.claire, code: CRT }, at('2026-09-30', 9, 10), claire);
  const removed = await report(t, 'courts', wait('9+', phone.claire), at('2026-09-28', 12, 0), claire); // the house flags it: no day on air
  db.db.prepare("UPDATE air_reports SET status = 'flagged' WHERE id = ?").run(removed.body.report.id);
  // Thursday evening: a guest, Mike filing as a guest, a signed-in account with no card, and Sam, who later loses @sam.
  await report(t, 'courts', wait('1-4', DEV.b), at('2026-10-01', 18, 0));
  assert.match((await report(t, 'courts', wait('1-4', DEV.c, { asGuest: true }), at('2026-10-01', 18, 5), mike)).body.report.byline, /^Guest /);
  assert.match((await report(t, 'courts', wait('1-4', phone.nocard), at('2026-10-01', 18, 10), nocard)).body.report.byline, /^Guest /);
  assert.equal((await report(t, 'courts', wait('1-4', phone.sam), at('2026-10-01', 18, 12), sam)).body.report.byline, '@sam');
  await report(t, 'courts', { kind: 'wait', value: '9+', device: phone.claire }, at('2026-10-01', 19, 0), claire); // from home: never a day on air
  await t.env.VISITS.put('card:v1:user:u_hdr_sam', JSON.stringify({ handle: 'sam', name: 'sam', noun: 7, released: true }));

  // Friday: the gate is locked at 7:41 and a second phone says still; an agent, a remote tap and a flagged row.
  const locked = await report(t, 'courts', wait('locked', DEV.d), at('2026-10-02', 7, 41));
  await confirm(t, { reportId: locked.body.report.id, verdict: 'still', device: DEV.e, code: CRT }, at('2026-10-02', 7, 43));
  const agentAt = at('2026-10-02', 7, 44);
  insert.run('ar_00000000000000000a03', 'wait', '0', agentAt, '2026-10-02', -3, 'agent-pid', 'u_hdr_claire', '@claire', 0, 'agent:codex', 'https://example.com/cam', agentAt);
  await report(t, 'courts', { kind: 'wait', value: '0', device: DEV.f }, at('2026-10-02', 7, 45));
  const flagged = await report(t, 'courts', { kind: 'wait', value: '9+', device: uuid() }, at('2026-10-02', 7, 46));
  db.db.prepare("UPDATE air_reports SET status = 'flagged' WHERE id = ?").run(flagged.body.report.id);
  for (const [d, v] of [[DEV.a, 'solid'], [DEV.b, 'solid'], [DEV.d, 'character']]) {
    await report(t, 'courts', { kind: 'vibe', value: v, device: d, code: CRT, extras: ['no-shade'] }, at('2026-10-02', 7, 47));
  }

  const page = await spotPayload(t.env, db, courts, at('2026-10-02', 7, 50), DEV.d);
  const h = page.header;
  assert.deepEqual(h.today, { reports: 3, validators: 2, crew: false, lastAt: '2026-10-02T14:41:00Z', lastAgeMin: 9 },
    'Friday\'s ok wait rows (the locked gate, the agent, the remote tap; not the flagged one); two phones on site');
  assert.deepEqual(h.override, { value: 'locked', label: 'Gate locked', at: '7:43 AM', support: 2, live: true });
  assert.deepEqual(h.prior, {
    last: { day: '2026-10-01', daysAgo: 1, at: '6:12 PM', value: '1-4', label: '1–4 in the rack', support: 4 },
    sameWeekday: { day: '2026-09-25', daysAgo: 7, at: '5:30 PM', value: '5-8', label: '5–8 in the rack', support: 1 },
    typical: null,
  });
  assert.deepEqual(h.week, {
    from: '2026-09-28', to: '2026-10-04',
    leaders: [{ handle: 'mike', days: 3, house: true }, { handle: 'claire', days: 2, house: false }],
    guests: 6,
  }, 'Mike: Mon–Wed (not Thursday as a guest); Claire: Tue + Wed parking (not last Sunday, the flagged Monday, from home or the agent row); guests: five on-site guest phones (Mike\'s Thursday one among them, unlinked) + @sam, released');
  assert.deepEqual(h.parking, { value: 'easy', label: 'Parking easy', day: '2026-09-30', at: 'Wed 9:10 AM' });
  assert.deepEqual(h.vibe, { label: 'Solid', n: 3, runnerUp: 'Character', chips: ['no-shade'] });

  // Privacy: no hash, no account id, no time of day on the leaderboard.
  await noHashes(page);
  const text = JSON.stringify(page);
  for (const d of Object.values(phone)) assert.ok(!text.includes(await pidHash(d)), 'a phone hash leaked');
  assert.doesNotMatch(text, /u_hdr_|agent-pid|"user_id"|"roles"|"first"/);
  assert.doesNotMatch(JSON.stringify(h.week), /\d{1,2}:\d{2}|T\d{2}:|AM|PM/, 'the leaderboard never carries a time');
  for (const l of h.week.leaders) assert.deepEqual(Object.keys(l), ['handle', 'days', 'house']);

  // 9:00: the locked reading decayed; the header still says so, time-stamped, as the last word, not live.
  const later = await spotPayload(t.env, db, courts, at('2026-10-02', 9, 0));
  assert.equal(later.reading.status, 'none');
  assert.deepEqual(later.header.override, { value: 'locked', label: 'Gate locked', at: '7:43 AM', support: 2, live: false });
  assert.equal(later.header.today.lastAgeMin, 79);
  // 9:05: a phone at the fence says 1–4: no override.
  await report(t, 'courts', wait('1-4', DEV.a), at('2026-10-02', 9, 5));
  assert.equal((await spotPayload(t.env, db, courts, at('2026-10-02', 9, 6))).header.override, null);
  // The next Monday is a new week, and Friday is the newest prior day.
  const monday = await spotPayload(t.env, db, courts, at('2026-10-05', 8, 0));
  assert.deepEqual(monday.header.week, { from: '2026-10-05', to: '2026-10-11', leaders: [], guests: 0 });
  assert.equal(monday.header.prior.last.day, '2026-10-02');
  assert.equal(monday.header.prior.last.daysAgo, 3);
  assert.deepEqual([monday.header.prior.sameWeekday.day, monday.header.prior.sameWeekday.daysAgo, monday.header.prior.sameWeekday.at], ['2026-09-28', 7, '8:05 AM']);
});

test('header source: the leaderboard SQL counts days on site by page rows under an @handle, and guests leave only as a count', () => {
  const store = src[STORE];
  const members = store.slice(store.indexOf('SELECT r.user_id, COUNT(DISTINCT r.day) AS days'));
  const memberSql = members.slice(0, members.indexOf('.bind('));
  for (const clause of ["r.status = 'ok'", "r.source = 'page'", 'r.onsite = 1', 'r.user_id IS NOT NULL', "r.byline LIKE '@%'", 'r.day BETWEEN ? AND ?', 'ORDER BY days DESC, first ASC']) {
    assert.ok(memberSql.includes(clause), `members SQL keeps ${clause}`);
  }
  assert.match(store, /SELECT COUNT\(DISTINCT pid_hash\) AS n FROM air_reports\s+WHERE spot = \? AND status = 'ok' AND source = 'page' AND onsite = 1 AND \(user_id IS NULL OR byline NOT LIKE '@%'\)/, 'guests are one number');
  // The user id stops at weekMembers; the view reads handles, days and the house mark only.
  const marker = store.indexOf('/* ---------- views:');
  assert.doesNotMatch(store.slice(marker), /user_id|memberRows|\.roles\b/, 'no account id or roles in the views');
  assert.match(store, /data\.header\.memberRows = \[\];/);
});
