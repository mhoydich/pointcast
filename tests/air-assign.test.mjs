import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import {
  ASSIGN_COPY, ASSIGN_ID_RE, ASSIGN_REASONS, ASSIGN_REWARD, CREATES_PER_DAY, FILLS_PER_DAY, MAX_AHEAD_DAYS, MAX_SEATS, MAX_WINDOW_MS,
  OPEN_PER_SPOT, VOID_REASON_MAX, assignAward, assignLabel, assignReceiptStamp, assignStampText, assignmentView, canFill, canWitness,
  daysAhead, fillNet, fillView, isLive, laDayStart, laWallToMs, parseAssign, parseAssignPost, parseVoid, pickAssignment, recentView,
  seatsLeft, templateOf,
} from '../functions/_lib/air-assign.mjs';
import { kindOf, newAirId, spotOf } from '../functions/_lib/air-kinds.mjs';
import { inHours, laDate, laParts } from '../functions/_lib/air-reading.mjs';

// Field Report Assignments, phase 1 (docs/plans/2026-09-28-field-assignments.md §3):
// the pure rules, migration 0024, and the store's assignment SQL run literally
// on node:sqlite against 0001 + 0023 + 0024. The fill, witness, claim, create
// and void statements below are the ones air-store.ts and /api/air/assign
// prepare; each fill is cross-checked against pickAssignment().

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const T0 = Date.parse('2026-10-02T14:36:00Z'); // Fri 7:36 AM in El Segundo
const THU = Date.parse('2026-10-01T12:00:00Z'); // Thu 5:00 AM, the night before
const la = (day, hhmm) => laWallToMs(day, hhmm);

/* ---------- config ---------- */

test('assignments: three templates on the two question kinds that exist, and "assign" is reserved', () => {
  assert.deepEqual(config.assignTemplates, [
    { id: 'rack-at-open', spot: 'courts', kind: 'wait', label: 'Rack at open', start: '06:00', min: 60, seats: 2 },
    { id: 'rack-after-work', spot: 'courts', kind: 'wait', label: 'Rack after work', start: '17:00', min: 60, seats: 2 },
    { id: 'pier-early', spot: 'beach', kind: 'fog', label: 'Pier, early', start: '05:30', min: 120, seats: 2 },
  ]);
  const ids = config.assignTemplates.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const t of config.assignTemplates) {
    assert.match(t.id, /^[a-z0-9-]+$/);
    assert.ok(kindOf(config, t.spot, t.kind), `${t.id}: ${t.spot} asks ${t.kind}`);
    assert.ok(t.seats >= 1 && t.seats <= MAX_SEATS, `${t.id} seats`);
    assert.ok(t.min > 0 && t.min * MIN <= MAX_WINDOW_MS, `${t.id} window`);
    assert.ok(inHours(spotOf(config, t.spot).hours, la('2026-10-02', t.start)), `${t.id} starts inside ${t.spot} hours`);
    assert.deepEqual(Object.keys(t).sort(), ['id', 'kind', 'label', 'min', 'seats', 'spot', 'start'], `${t.id}: no free-text field`);
    assert.equal(templateOf(config, t.id), t);
  }
  assert.ok(config.reserved.includes('assign'));
  assert.equal(spotOf(config, 'assign'), null, '/api/air/assign is never a spot');
  for (const id of ['agent', 'desk']) {
    assert.ok(config.reserved.includes(id), `${id} is reserved for the Desk (/r/${id})`);
    assert.equal(spotOf(config, id), null, `/r/${id} is never a spot`);
  }
  assert.equal(templateOf(config, 'nope'), null);
  assert.equal(templateOf(config, 'constructor'), null);
  assert.equal(templateOf({ spots: [], reserved: [] }, 'rack-at-open'), null, 'a config without templates has none');
  assert.equal(assignLabel(config, 'retired-template'), 'retired-template');
  assert.deepEqual(
    { ASSIGN_REWARD, FILLS_PER_DAY, OPEN_PER_SPOT, CREATES_PER_DAY, MAX_AHEAD_DAYS, MAX_SEATS, MAX_WINDOW_MS, VOID_REASON_MAX },
    { ASSIGN_REWARD: 10, FILLS_PER_DAY: 2, OPEN_PER_SPOT: 3, CREATES_PER_DAY: 20, MAX_AHEAD_DAYS: 7, MAX_SEATS: 3, MAX_WINDOW_MS: 14_400_000, VOID_REASON_MAX: 80 },
  );
  assert.equal(ASSIGN_COPY, 'Assignments pay points and a stamp for being there. Never cash, never for what you answer.');
});

/* ---------- window math ---------- */

test('laWallToMs: LA wall clock to epoch ms across the 2026-11-01 fall-back and the 2027-03-14 spring-forward', () => {
  assert.equal(la('2026-10-02', '06:00'), Date.parse('2026-10-02T13:00:00Z'), 'PDT');
  assert.equal(la('2026-10-31', '06:00'), Date.parse('2026-10-31T13:00:00Z'), 'the last PDT morning');
  assert.equal(la('2026-11-01', '00:30'), Date.parse('2026-11-01T07:30:00Z'), 'still PDT before 2 AM');
  assert.equal(la('2026-11-01', '01:30'), Date.parse('2026-11-01T09:30:00Z'), 'the hour that happens twice reads as the PST one');
  assert.equal(la('2026-11-01', '03:00'), Date.parse('2026-11-01T11:00:00Z'), 'PST');
  assert.equal(la('2026-11-01', '05:30'), Date.parse('2026-11-01T13:30:00Z'));
  assert.equal(la('2026-11-01', '06:00'), Date.parse('2026-11-01T14:00:00Z'), 'the first PST morning');
  assert.equal(la('2026-11-02', '06:00'), Date.parse('2026-11-02T14:00:00Z'));
  assert.equal(la('2026-12-25', '17:00'), Date.parse('2026-12-26T01:00:00Z'), 'evening lands on the next UTC day');
  assert.equal(la('2027-03-14', '06:00'), Date.parse('2027-03-14T13:00:00Z'), 'PDT again');
  assert.equal(la('2027-03-14', '02:30'), Date.parse('2027-03-14T10:30:00Z'), 'a time that never happens lands an hour later (3:30 PDT)');
  assert.equal(laDayStart(T0), Date.parse('2026-10-02T07:00:00Z'));
  assert.equal(laDayStart(Date.parse('2026-11-01T20:00:00Z')), Date.parse('2026-11-01T07:00:00Z'), 'the fall-back day starts in PDT');
  // Every quarter hour of every spot's hours round-trips through laParts for a year of days.
  for (let d = 0; d < 366; d++) {
    const day = new Date(Date.UTC(2026, 8, 28 + d, 12)).toISOString().slice(0, 10);
    for (let m = 5 * 60; m < 22 * 60; m += 15) {
      const hhmm = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const p = laParts(la(day, hhmm));
      assert.equal(`${p.day} ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`, `${day} ${hhmm}`);
    }
  }
  assert.equal(daysAhead('2026-10-02', '2026-10-09'), 7);
  assert.equal(daysAhead('2026-10-31', '2026-11-02'), 2, 'a 25-hour day is still one day');
  assert.equal(daysAhead('2026-10-02', '2026-10-01'), -1);
});

/* ---------- parseAssign ---------- */

test('parseAssign: a template, a day and seats become one window; defaults come from the template', () => {
  assert.deepEqual(parseAssign(config, { template: 'rack-after-work', day: '2026-10-02' }, T0), {
    template: 'rack-after-work', spot: 'courts', kind: 'wait',
    startsAt: Date.parse('2026-10-03T00:00:00Z'), endsAt: Date.parse('2026-10-03T01:00:00Z'), seats: 2, reward: 10,
  });
  const pier = parseAssign(config, { template: 'pier-early', day: '2026-11-01', seats: 1 }, Date.parse('2026-10-30T19:00:00Z'));
  assert.equal(pier.startsAt, Date.parse('2026-11-01T13:30:00Z'), '5:30 AM PST on the fall-back day');
  assert.equal(pier.endsAt - pier.startsAt, 120 * MIN);
  assert.equal(pier.seats, 1);
  const moved = parseAssign(config, { template: 'rack-at-open', day: '2026-10-03', start: '08:15', seats: 3 }, T0);
  assert.equal(moved.startsAt, la('2026-10-03', '08:15'), 'start overrides the template default');
  assert.equal(moved.seats, 3);
  assert.equal(parseAssign(config, { template: 'rack-at-open', day: '2026-10-02', reward: 999 }, la('2026-10-02', '06:30')).reward, ASSIGN_REWARD,
    'the reward is never the body\'s, and a window already open can still be posted');
  assert.equal(parseAssign(config, { template: 'rack-at-open', day: '2026-10-09' }, T0).startsAt, la('2026-10-09', '06:00'), '7 days ahead is the edge');
});

test('parseAssign: every bound, each with its reason, and nothing is repaired', () => {
  const r = (body, now = T0) => parseAssign(config, body, now).reason;
  const ok = { template: 'rack-at-open', day: '2026-10-03' };
  assert.equal(r(null), 'bad-json');
  assert.equal(r([]), 'bad-json');
  assert.equal(r({ ...ok, template: 'nope' }), 'bad-template');
  assert.equal(r({ ...ok, template: undefined }), 'bad-template');
  assert.equal(r({ ...ok, template: '__proto__' }), 'bad-template');
  assert.equal(r({ ...ok, template: 'Rack at open' }), 'bad-template', 'the id, not the label');
  const broken = { ...config, assignTemplates: [{ id: 'x', spot: 'courts', kind: 'fog', label: 'X', start: '06:00', min: 60, seats: 2 }, { id: 'y', spot: 'courts', kind: 'wait', label: 'Y', start: '06:00', min: 241, seats: 2 }] };
  assert.equal(parseAssign(broken, { template: 'x', day: '2026-10-03' }, T0).reason, 'bad-template', 'a kind the spot does not ask');
  assert.equal(parseAssign(broken, { template: 'y', day: '2026-10-03' }, T0).reason, 'bad-template', 'a window longer than 4 hours');
  assert.equal(r({ ...ok, day: undefined }), 'bad-day');
  assert.equal(r({ ...ok, day: '2026-10-01' }), 'bad-day', 'yesterday');
  assert.equal(r({ ...ok, day: '2026-10-10' }), 'bad-day', '8 days ahead');
  assert.equal(r({ ...ok, day: '2026-10-32' }), 'bad-day');
  assert.equal(r({ ...ok, day: '2026-02-29' }), 'bad-day', 'not a leap year');
  assert.equal(r({ ...ok, day: '2026-10-3' }), 'bad-day');
  assert.equal(r({ ...ok, day: 20261003 }), 'bad-day');
  assert.equal(r({ ...ok, day: '2026-10-03T06:00' }), 'bad-day');
  const friEvening = Date.parse('2026-10-03T02:00:00Z'); // Fri 7 PM in El Segundo, already Saturday in UTC
  assert.equal(r({ ...ok, day: '2026-10-02', start: '21:00' }, friEvening), undefined, 'LA today, not UTC today');
  assert.equal(r({ ...ok, day: '2026-10-10' }, friEvening), 'bad-day', '8 LA days ahead, though only 7 in UTC');
  assert.equal(r({ ...ok, start: '05:59' }), 'bad-start', 'before the courts open');
  assert.equal(r({ ...ok, start: '22:00' }), 'bad-start', 'close is exclusive');
  assert.equal(r({ ...ok, start: '21:59' }), undefined);
  assert.equal(r({ template: 'pier-early', day: '2026-10-03', start: '05:29' }), 'bad-start', 'before the beach opens');
  assert.equal(r({ ...ok, start: '6:00' }), 'bad-start');
  assert.equal(r({ ...ok, start: '24:00' }), 'bad-start');
  assert.equal(r({ ...ok, start: '06:60' }), 'bad-start');
  assert.equal(r({ ...ok, start: 600 }), 'bad-start');
  assert.equal(r({ template: 'rack-at-open', day: '2026-10-02' }), 'bad-start', 'today 6:00-7:00 is over at 7:36');
  assert.equal(r({ template: 'rack-at-open', day: '2026-10-02' }, la('2026-10-02', '07:00')), 'bad-start', 'a window that ends now is over');
  assert.equal(r({ template: 'rack-at-open', day: '2026-10-02' }, la('2026-10-02', '06:59')), undefined);
  for (const seats of [0, 4, -1, 1.5, '2', false, true, NaN]) assert.equal(r({ ...ok, seats }), 'bad-seats', `seats ${String(seats)}`);
  assert.equal(parseAssign(config, { ...ok, seats: null }, T0).seats, 2, 'null seats is the template default');
  const seen = new Set([r(null), r({ ...ok, template: 'x' }), r({ ...ok, day: 'x' }), r({ ...ok, start: 'x' }), r({ ...ok, seats: 9 })]);
  for (const reason of seen) assert.ok(ASSIGN_REASONS.includes(reason), reason);
});

test('parseVoid and parseAssignPost: void notes are capped, actions dispatch, reasons are documented', () => {
  const id = newAirId('aa');
  assert.match(id, ASSIGN_ID_RE);
  assert.deepEqual(parseVoid({ id, reason: '  rained out  ' }), { id, voidReason: 'rained out' });
  assert.deepEqual(parseVoid({ id }), { id, voidReason: null }, 'no note is null');
  assert.deepEqual(parseVoid({ id, reason: ' \n\t ' }), { id, voidReason: null });
  assert.equal(parseVoid({ id, reason: 'gate\nlocked\u0000all\u2028day' }).voidReason, 'gate locked all day', 'control characters are spaces');
  const long = parseVoid({ id, reason: '🌧'.repeat(100) }).voidReason;
  assert.equal([...long].length, VOID_REASON_MAX, '80 characters, never half an emoji');
  assert.equal(parseVoid({ id: 'ar_0123456789abcdef0123' }).reason, 'not-found', 'a report id is not an assignment id');
  assert.equal(parseVoid({ id: 'aa_XYZ' }).reason, 'not-found');
  assert.equal(parseVoid({ id, reason: 7 }).reason, 'bad-json');
  assert.equal(parseVoid(null).reason, 'bad-json');

  const create = parseAssignPost(config, { action: 'create', template: 'pier-early', day: '2026-10-03' }, T0);
  assert.equal(create.action, 'create');
  assert.equal(create.spot, 'beach');
  assert.deepEqual(parseAssignPost(config, { action: 'void', id, reason: 'dup' }, T0), { action: 'void', id, voidReason: 'dup' });
  assert.equal(parseAssignPost(config, { action: 'create', template: 'x', day: '2026-10-03' }, T0).reason, 'bad-template');
  assert.equal(parseAssignPost(config, { action: 'void', id: 'x' }, T0).reason, 'not-found');
  assert.equal(parseAssignPost(config, { action: 'delete', id }, T0).reason, 'bad-action');
  assert.equal(parseAssignPost(config, { template: 'pier-early', day: '2026-10-03' }, T0).reason, 'bad-action', 'the action is never guessed');
  assert.equal(parseAssignPost(config, 'create', T0).reason, 'bad-json');
  for (const reason of ['bad-json', 'bad-action', 'not-found', 'too-many-open', 'forbidden']) assert.ok(ASSIGN_REASONS.includes(reason));
});

/* ---------- fill eligibility, witness, views ---------- */

test('canFill and canWitness: on site with a real answer fills; only an on-site "still" witnesses', () => {
  for (const value of ['locked', '0', '1-4', '5-8', '9+', 'clear', 'hazy', 'none']) {
    assert.equal(canFill({ onsite: 1, value }), true, `${value} fills: the answer never matters`);
    assert.equal(canFill({ onsite: true, value }), true);
  }
  assert.equal(canFill({ onsite: 1, value: 'cant' }), false, '"Can\'t say" never fills a seat');
  assert.equal(canFill({ onsite: 0, value: '1-4' }), false, 'remote never fills');
  assert.equal(canFill({ onsite: false, value: '1-4' }), false);
  assert.equal(canFill({ onsite: '1', value: '1-4' }), false, 'only a real on-site flag');
  assert.equal(canFill({ onsite: 1, value: null }), false);
  assert.equal(canWitness({ onsite: 1, verdict: 'still' }), true);
  assert.equal(canWitness({ onsite: true, verdict: 'still' }), true);
  assert.equal(canWitness({ onsite: 1, verdict: 'changed' }), false);
  assert.equal(canWitness({ onsite: 1, verdict: 'cant' }), false);
  assert.equal(canWitness({ onsite: 0, verdict: 'still' }), false, 'remote (and same-network, which confirmReport sends as onsite 0) never witnesses');
  assert.equal(fillNet({ user_id: 'u1', ip_hash: 'ip', pid_hash: 'p' }), 'user:u1', 'a signed-in phone is its own network');
  assert.equal(fillNet({ user_id: null, ip_hash: 'ip', pid_hash: 'p' }), 'ip');
  assert.equal(fillNet({ user_id: null, ip_hash: '', pid_hash: 'p' }), 'p');
  assert.equal(seatsLeft(2, 1), 1);
  assert.equal(seatsLeft(2, 3), 0);
  assert.equal(seatsLeft(3, undefined), 3);
  const a = { starts_at: 100, ends_at: 200, voided_at: null };
  assert.deepEqual([99, 100, 199, 200].map((t) => isLive(a, t)), [false, true, true, false], 'start inclusive, end exclusive');
  assert.equal(isLive({ ...a, voided_at: 150 }, 150), false);
});

test('views: stamp text, list items, the receipt line and /me rows carry no owner, net or creator', () => {
  assert.equal(assignStampText('Rack at open', 'MANHATTAN MIDDLE', '2026-10-02'), 'ASSIGNMENT · RACK AT OPEN · MANHATTAN MIDDLE · FRI 02 OCT 2026');
  const row = {
    id: 'aa_0123456789abcdef0123', spot: 'courts', kind: 'wait', template: 'rack-at-open', starts_at: la('2026-10-02', '06:00'), ends_at: la('2026-10-02', '07:00'),
    seats: 2, reward: 10, created_by: 'user:mike', created_at: THU, voided_at: null, void_reason: null, filled: 1, witnessed: 1, fillers: ['@jen'],
  };
  assert.deepEqual(assignmentView(config, row, la('2026-10-02', '06:10')), {
    id: row.id, spot: 'courts', label: 'Rack at open', question: 'Paddles in the rack?', startsAt: '2026-10-02T13:00:00Z', endsAt: '2026-10-02T14:00:00Z',
    seats: 2, seatsLeft: 1, reward: 10, live: true,
  });
  assert.equal(assignmentView(config, row, T0).live, false, 'over at 7:36');
  const recent = recentView(config, { ...row, voided_at: T0, void_reason: 'rain' }, T0);
  assert.deepEqual([recent.filled, recent.witnessed, recent.fillers, recent.voidedAt, recent.voidReason, recent.createdAt], [1, 1, ['@jen'], '2026-10-02T14:36:00Z', 'rain', '2026-10-01T12:00:00Z']);
  const fill = { assignment_id: row.id, template: 'pier-early', spot: 'beach', day: '2026-10-02', reward: 10, witnessed_at: null, owner: 'dev:p', net: 'ip' };
  assert.deepEqual(assignAward(config, fill), { id: row.id, label: 'Pier, early', reward: 10, text: 'ASSIGNMENT · PIER, EARLY · GRAND AVE · FRI 02 OCT 2026' });
  assert.deepEqual(assignReceiptStamp(config, fill), { kind: 'assignment', ref: row.id, day: '2026-10-02', text: 'ASSIGNMENT · PIER, EARLY · GRAND AVE · FRI 02 OCT 2026', fresh: true });
  assert.deepEqual(fillView(config, fill), { id: row.id, label: 'Pier, early', spot: 'beach', day: '2026-10-02', reward: 10, witnessed: false, text: 'ASSIGNMENT · PIER, EARLY · GRAND AVE · FRI 02 OCT 2026' });
  assert.equal(fillView(config, { ...fill, witnessed_at: T0 }).witnessed, true);
  const out = JSON.stringify([assignmentView(config, row, T0), recent, assignAward(config, fill), fillView(config, fill)]);
  for (const leak of ['user:mike', 'dev:p', '"ip"', 'owner', 'net', 'created_by', 'pid_hash', 'ip_hash']) assert.ok(!out.includes(leak), `a view leaked ${leak}`);
});

/* ---------- migration 0024 ---------- */

const M0024 = 'migrations/auth/0024_air_assignments.sql';
const [init, air, assign] = await Promise.all(['migrations/auth/0001_init.sql', 'migrations/auth/0023_air.sql', M0024].map(read));
const statements = (sql) => sql.replace(/--[^\n]*/g, '').split(';').map((s) => s.trim()).filter(Boolean);

test('migration 0024: the only 0024, additive only, and it applies after 0023 (twice, harmlessly)', async () => {
  const files = await readdir(new URL('migrations/auth/', root));
  assert.deepEqual(files.filter((f) => f.startsWith('0024')), ['0024_air_assignments.sql']);
  for (const s of statements(assign)) assert.match(s, /^CREATE (TABLE|INDEX) IF NOT EXISTS air_assignment/, `additive only: ${s.slice(0, 50)}`);
  assert.doesNotMatch(assign.replace(/--[^\n]*/g, ''), /\b(DROP|ALTER|DELETE|UPDATE|INSERT|REPLACE|PRAGMA)\b/i);
  assert.doesNotMatch(assign, /air_stamps|air_points|air_reports/, 'nothing in 0023 is touched');
  const db = new DatabaseSync(':memory:');
  db.exec(init);
  db.exec(air);
  db.exec(assign);
  db.exec(assign);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','index') AND name LIKE 'air_assignment%' ORDER BY name").all().map((r) => r.name);
  assert.deepEqual(tables, ['air_assignment_fills', 'air_assignment_fills_owner', 'air_assignments', 'air_assignments_live']);
  const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
  assert.deepEqual(cols('air_assignments'), ['id', 'spot', 'kind', 'template', 'starts_at', 'ends_at', 'seats', 'reward', 'created_by', 'created_at', 'voided_at', 'void_reason']);
  assert.deepEqual(cols('air_assignment_fills'), ['assignment_id', 'report_id', 'owner', 'net', 'day', 'reward', 'witnessed_at', 'created_at']);
});

/** 0001 + 0023 + 0024 on node:sqlite, as the air-api harness builds AUTH_DB. */
function authDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(init);
  db.exec(air);
  db.exec(assign);
  return db;
}

test('migration 0024: CHECKs refuse more than 3 seats, more than 10 points, and a window that is empty or over 4 hours', () => {
  const db = authDb();
  const put = db.prepare('INSERT INTO air_assignments (id, spot, kind, template, starts_at, ends_at, seats, reward, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const row = (over = {}) => {
    const r = { id: newAirId('aa'), spot: 'courts', kind: 'wait', template: 'rack-at-open', starts_at: 1_000_000, ends_at: 1_000_000 + HOUR, seats: 2, reward: 10, created_by: 'user:mike', created_at: 1, ...over };
    return put.run(r.id, r.spot, r.kind, r.template, r.starts_at, r.ends_at, r.seats, r.reward, r.created_by, r.created_at);
  };
  row();
  row({ seats: 1, reward: 0, ends_at: 1_000_000 + MAX_WINDOW_MS });
  for (const bad of [{ seats: 0 }, { seats: 4 }, { reward: 11 }, { reward: -1 }, { ends_at: 1_000_000 }, { ends_at: 999_999 }, { ends_at: 1_000_001 + MAX_WINDOW_MS }]) {
    assert.throws(() => row(bad), /CHECK constraint failed/, JSON.stringify(bad));
  }
  const fill = db.prepare('INSERT INTO air_assignment_fills (assignment_id, report_id, owner, net, day, reward, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  fill.run('aa_1', 'ar_1', 'dev:p1', 'ip1', '2026-10-02', 10, 1);
  assert.throws(() => fill.run('aa_1', 'ar_2', 'dev:p1', 'ip9', '2026-10-02', 10, 1), /UNIQUE|PRIMARY/, 'one seat per owner');
  assert.throws(() => fill.run('aa_1', 'ar_3', 'dev:p2', 'ip1', '2026-10-02', 10, 1), /UNIQUE/, 'one seat per network');
  assert.throws(() => fill.run('aa_2', 'ar_1', 'dev:p3', 'ip3', '2026-10-02', 10, 1), /UNIQUE/, 'one fill per report');
  assert.throws(() => fill.run('aa_3', 'ar_4', 'dev:p4', 'ip4', '2026-10-02', -1, 1), /CHECK/);
});

/* ---------- the store's SQL, literally ---------- */

// POST /api/air/assign create: INSERT … SELECT … WHERE open-at-spot < 3 AND created-today < 20 RETURNING id. No row → 409 too-many-open.
const CREATE_SQL = `INSERT INTO air_assignments (id, spot, kind, template, starts_at, ends_at, seats, reward, created_by, created_at)
  SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10
  WHERE (SELECT COUNT(*) FROM air_assignments WHERE spot = ?2 AND voided_at IS NULL AND ends_at > ?10) < 3
    AND (SELECT COUNT(*) FROM air_assignments WHERE created_at >= ?11) < 20
  RETURNING id`;
// POST void: 1 change → 200, 0 → 404 not-found. Fills keep their points.
const VOID_SQL = 'UPDATE air_assignments SET voided_at = ?, void_reason = ? WHERE id = ? AND voided_at IS NULL';
// fileReport, inside `if (isOnsite)` after points, only when canFill(): spec §3.4, with an id tiebreak, the
// daily cap counted by owner or network (as the seat rule is), and witnessed_at seeded from an on-site
// "still" already on file (a report that turned on-site after its witness confirmed it).
// Binds: saved.id, owner, net, laDate(observed_at), now, spot, kind, observed_at.
const FILL_SQL = `INSERT OR IGNORE INTO air_assignment_fills (assignment_id, report_id, owner, net, day, reward, witnessed_at, created_at)
  SELECT a.id, ?1, ?2, ?3, ?4, a.reward,
    (SELECT MIN(c.at) FROM air_confirms c JOIN air_reports r ON r.id = c.report_id
      WHERE c.report_id = ?1 AND c.verdict = 'still' AND c.onsite = 1 AND c.value = r.value), ?5
  FROM air_assignments a
  WHERE a.spot = ?6 AND a.kind = ?7 AND a.voided_at IS NULL
    AND a.starts_at <= ?8 AND a.ends_at > ?8 AND a.created_by != ?2
    AND (SELECT COUNT(*) FROM air_assignment_fills f WHERE f.assignment_id = a.id) < a.seats
    AND NOT EXISTS (SELECT 1 FROM air_assignment_fills f WHERE f.assignment_id = a.id AND (f.owner = ?2 OR f.net = ?3))
    AND NOT EXISTS (SELECT 1 FROM air_assignment_fills f WHERE f.report_id = ?1)
    AND (SELECT COUNT(*) FROM air_assignment_fills f WHERE (f.owner = ?2 OR f.net = ?3) AND f.day = ?4) < 2
  ORDER BY a.ends_at, a.id LIMIT 1
  RETURNING assignment_id, reward`;
// confirmReport, after the insert, only when canWitness().
const WITNESS_SQL = 'UPDATE air_assignment_fills SET witnessed_at = ? WHERE report_id = ? AND witnessed_at IS NULL';
// claimDevice's batch.
const CLAIM_SQL = 'UPDATE OR IGNORE air_assignment_fills SET owner = ? WHERE owner = ? AND created_at >= ?';
// GET /api/air/assign `open`, and spotPayload.assignment with the spot bound and LIMIT 1.
const OPEN_SQL = `SELECT a.id, a.spot, a.kind, a.template, a.starts_at, a.ends_at, a.seats, a.reward, a.voided_at,
    (SELECT COUNT(*) FROM air_assignment_fills f WHERE f.assignment_id = a.id) AS filled
  FROM air_assignments a WHERE a.voided_at IS NULL AND a.ends_at > ? AND a.starts_at < ? ORDER BY a.starts_at, a.id LIMIT 20`;
// mePayload: points.assigned and assignments (50 at most). Never selects net.
const ME_SQL = `SELECT f.assignment_id, a.template, a.spot, f.day, f.reward, f.witnessed_at FROM air_assignment_fills f
  JOIN air_assignments a ON a.id = f.assignment_id WHERE f.owner = ? ORDER BY f.created_at DESC LIMIT 50`;
const ASSIGNED_SQL = 'SELECT COALESCE(SUM(reward), 0) AS n FROM air_assignment_fills WHERE owner = ?';

const MIKE = 'user:mike';

function desk() {
  const db = authDb();
  const create = (body, now = THU, by = MIKE) => {
    const p = parseAssign(config, body, now);
    assert.ok(!p.reason, p.reason);
    const id = newAirId('aa');
    const rows = db.prepare(CREATE_SQL).all(id, p.spot, p.kind, p.template, p.startsAt, p.endsAt, p.seats, p.reward, by, now, laDayStart(now));
    return rows[0]?.id ?? null;
  };
  /** A saved report reaching the fill step: canFill first, then the INSERT; the result must match pickAssignment. */
  const fill = ({ reportId = newAirId('ar'), owner, net, observedAt, spot = 'courts', kind = 'wait', value = '1-4', onsite = 1 }) => {
    const r = { reportId, owner, net, day: laDate(observedAt), spot, kind, observedAt, onsite, value };
    const expected = pickAssignment(db.prepare('SELECT * FROM air_assignments').all(), db.prepare('SELECT * FROM air_assignment_fills').all(), r);
    const got = canFill(r) ? db.prepare(FILL_SQL).all(reportId, owner, net, r.day, observedAt + 2_000, spot, kind, observedAt)[0] ?? null : null;
    assert.equal(got?.assignment_id ?? null, expected?.id ?? null, 'the SQL and pickAssignment agree');
    return got ? { ...got } : null;
  };
  const fills = (id) => db.prepare('SELECT * FROM air_assignment_fills WHERE assignment_id = ? ORDER BY created_at').all(id).map((r) => ({ ...r }));
  return { db, create, fill, fills };
}
const at = (hhmm, day = '2026-10-02') => la(day, hhmm);

test('fill: an on-site report in the window fills and pays +10; remote, cant, out-of-window, voided, creator and other-spot reports do not', () => {
  const { db, create, fill } = desk();
  const open = create({ template: 'rack-at-open', day: '2026-10-02' }); // 6:00-7:00
  const pier = create({ template: 'pier-early', day: '2026-10-02' }); // 5:30-7:30
  assert.ok(open && pier);
  assert.equal(db.prepare(VOID_SQL).run(T0, 'fog day', pier).changes, 1);
  const p = (n) => ({ owner: `dev:p${n}`, net: `ip${n}` });
  assert.equal(fill({ ...p(1), observedAt: at('06:10'), onsite: 0 }), null, 'remote: no code, no seat');
  assert.equal(fill({ ...p(1), observedAt: at('06:10'), value: 'cant' }), null, '"Can\'t say" never fills');
  assert.equal(fill({ ...p(1), observedAt: at('05:59') }), null, 'before the window');
  assert.equal(fill({ ...p(1), observedAt: at('07:00') }), null, 'the end is exclusive');
  assert.equal(fill({ owner: MIKE, net: MIKE, observedAt: at('06:10') }), null, 'the creator never fills their own');
  assert.equal(fill({ ...p(1), observedAt: at('06:10'), spot: 'beach', kind: 'fog', value: 'clear' }), null, 'voided');
  assert.equal(fill({ ...p(1), observedAt: at('06:10', '2026-10-03') }), null, 'the window is a date, not a time of day');
  assert.deepEqual(fill({ ...p(1), observedAt: at('06:00'), value: 'locked' }), { assignment_id: open, reward: ASSIGN_REWARD }, 'the start is inclusive, and a locked gate is a real answer');
  const [row] = db.prepare('SELECT * FROM air_assignment_fills').all();
  assert.deepEqual({ ...row, report_id: undefined }, { assignment_id: open, report_id: undefined, owner: 'dev:p1', net: 'ip1', day: '2026-10-02', reward: 10, witnessed_at: null, created_at: at('06:00') + 2_000 });
});

test('fill: the third phone on 2 seats does not fill; a guest\'s second phone on the same IP does not; a second signed-in account does', () => {
  const { create, fill, fills } = desk();
  const open = create({ template: 'rack-at-open', day: '2026-10-02' });
  assert.equal(fill({ owner: 'dev:p1', net: 'ip-home', observedAt: at('06:05') })?.assignment_id, open);
  assert.equal(fill({ owner: 'dev:p2', net: 'ip-home', observedAt: at('06:06') }), null, 'same network as a guest');
  assert.equal(fill({ owner: 'user:jen', net: fillNet({ user_id: 'jen', ip_hash: 'ip-home' }), observedAt: at('06:07') })?.assignment_id, open, 'a signed-in phone is its own network');
  assert.equal(fill({ owner: 'dev:p3', net: 'ip-3', observedAt: at('06:08') }), null, 'two seats, both taken: the count is inside the INSERT');
  assert.deepEqual(fills(open).map((f) => f.owner), ['dev:p1', 'user:jen']);
});

test('fill: a replacement never fills twice, cant → real fills once, overlapping windows fill one, and the third fill of a day is refused', () => {
  const { create, fill, fills, db } = desk();
  const open = create({ template: 'rack-at-open', day: '2026-10-02' }); // 6:00-7:00
  const late = create({ template: 'rack-at-open', day: '2026-10-02', start: '06:30' }); // 6:30-7:30
  const after = create({ template: 'rack-after-work', day: '2026-10-02' }); // 17:00-18:00
  const jen = { owner: 'user:jen', net: 'user:jen' };
  const reportId = newAirId('ar');
  assert.equal(fill({ ...jen, reportId, observedAt: at('06:40'), value: 'cant' }), null, 'cant first: no seat');
  assert.equal(fill({ ...jen, reportId, observedAt: at('06:41') })?.assignment_id, open, 'the same slot moved to a real answer: fills, the earlier-ending window');
  assert.equal(fill({ ...jen, reportId, observedAt: at('06:42') }), null, 'a retry or same-slot replacement never fills twice');
  assert.equal(fills(late).length, 0, 'one report fills one assignment even when windows overlap');
  assert.equal(fill({ ...jen, observedAt: at('07:05') })?.assignment_id, late, 'a new slot can take the other window');
  assert.equal(fill({ ...jen, observedAt: at('17:10') }), null, `the ${FILLS_PER_DAY + 1}rd fill of the day is refused`);
  assert.equal(fill({ owner: 'dev:p9', net: 'ip9', observedAt: at('17:10') })?.assignment_id, after, 'the seat stays for someone else');
  assert.equal(db.prepare(ASSIGNED_SQL).get('user:jen').n, 2 * ASSIGN_REWARD);
});

test('witness, claim, void and /me: the mark sets once, claims move fills, voids keep points, /me never selects net', () => {
  const { db, create, fill, fills } = desk();
  const open = create({ template: 'rack-at-open', day: '2026-10-02' });
  const reportId = newAirId('ar');
  fill({ owner: 'dev:p1', net: 'ip1', reportId, observedAt: at('06:10') });
  // Witness: only canWitness() confirms run the UPDATE; the first sets it and later ones never move it.
  for (const c of [{ onsite: 0, verdict: 'still' }, { onsite: 1, verdict: 'changed' }]) {
    if (canWitness(c)) db.prepare(WITNESS_SQL).run(at('06:20'), reportId);
  }
  assert.equal(fills(open)[0].witnessed_at, null, 'remote and "changed" confirms leave no mark');
  assert.equal(db.prepare(WITNESS_SQL).run(at('06:20'), reportId).changes, 1);
  assert.equal(db.prepare(WITNESS_SQL).run(at('06:25'), reportId).changes, 0);
  assert.equal(fills(open)[0].witnessed_at, at('06:20'));
  assert.equal(fills(open)[0].reward, 10, 'witnessing never changes the reward');

  // Claim: this phone's fills move to the account, unless the account already holds that seat.
  const second = create({ template: 'rack-after-work', day: '2026-10-02' });
  fill({ owner: 'user:u1', net: 'user:u1', observedAt: at('17:05') });
  fill({ owner: 'dev:p1', net: 'ip1', observedAt: at('17:06') });
  assert.equal(db.prepare(CLAIM_SQL).run('user:u1', 'dev:p1', at('06:00') - DAY).changes, 1, 'one moved, one kept (the account already sits in the evening seat)');
  assert.deepEqual(fills(open).map((f) => f.owner), ['user:u1']);
  assert.deepEqual(fills(second).map((f) => f.owner).sort(), ['dev:p1', 'user:u1']);

  // Void: one change, then none (404); the filled seat keeps its points.
  assert.equal(db.prepare(VOID_SQL).run(at('06:30'), 'wrong day', open).changes, 1);
  assert.equal(db.prepare(VOID_SQL).run(at('06:31'), 'again', open).changes, 0);
  assert.equal(fills(open).length, 1);
  assert.equal(db.prepare(ASSIGNED_SQL).get('user:u1').n, 20);

  const mine = db.prepare(ME_SQL).all('user:u1').map((r) => fillView(config, r));
  assert.deepEqual(mine.map((f) => [f.label, f.witnessed]).sort(), [['Rack after work', false], ['Rack at open', true]]);
  assert.doesNotMatch(ME_SQL.slice(0, ME_SQL.indexOf('FROM')), /\bnet\b|\bowner\b/, '/me selects neither net nor owner');
});

test('create: three open per spot, voided and ended ones free a slot, twenty a day across the town', () => {
  const { db, create } = desk();
  const ids = ['2026-10-02', '2026-10-03', '2026-10-04'].map((day) => create({ template: 'rack-at-open', day }));
  assert.ok(ids.every(Boolean));
  assert.equal(create({ template: 'rack-after-work', day: '2026-10-05' }), null, 'a fourth open at the courts → 409 too-many-open');
  assert.ok(create({ template: 'pier-early', day: '2026-10-05' }), 'the beach counts on its own');
  db.prepare(VOID_SQL).run(THU, 'dup', ids[2]);
  assert.ok(create({ template: 'rack-after-work', day: '2026-10-05' }), 'a voided one frees its slot');
  const sat = Date.parse('2026-10-03T12:00:00Z'); // Sat 5 AM: Friday's window has ended
  assert.ok(create({ template: 'rack-at-open', day: '2026-10-06' }, sat), 'an ended window no longer counts as open');
  assert.equal(create({ template: 'rack-at-open', day: '2026-10-07' }, sat), null, 'Sat morning, Mon evening and Tue make three');
  db.prepare(VOID_SQL).run(sat, 'x', ids[1]);
  assert.ok(create({ template: 'rack-at-open', day: '2026-10-07' }, sat), 'voiding one frees its slot again');

  const { db: db2, create: create2 } = desk();
  let made = 0;
  for (let i = 0; i < CREATES_PER_DAY; i++) {
    const id = create2({ template: 'pier-early', day: '2026-10-03' });
    assert.ok(id, `create ${i + 1}`);
    db2.prepare(VOID_SQL).run(THU, 'churn', id);
    made++;
  }
  assert.equal(made, CREATES_PER_DAY);
  assert.equal(create2({ template: 'rack-at-open', day: '2026-10-03' }), null, `the ${CREATES_PER_DAY + 1}st create today → 409`);
  assert.ok(create2({ template: 'rack-at-open', day: '2026-10-03' }, THU + DAY), 'a new LA day starts a new count');

  const listed = db.prepare(OPEN_SQL).all(THU, THU + (MAX_AHEAD_DAYS + 1) * DAY).map((r) => assignmentView(config, r, THU));
  assert.ok(listed.length >= 1 && listed.every((a) => a.seatsLeft === 2 && a.reward === 10 && !a.live));
  assert.ok(listed.every((a, i) => i === 0 || listed[i - 1].startsAt <= a.startsAt), 'soonest first');
});
