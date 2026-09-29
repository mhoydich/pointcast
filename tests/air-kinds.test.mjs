import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import {
  AIR_REASONS, codeHash, guestByline, kindOf, labelOf, newAirId, ownerOf, parseAirReport, parseCode,
  parseConfirm, pidHash, ipHash, REPORT_ID_RE, slotOf, spotOf,
} from '../functions/_lib/air-kinds.mjs';

const root = new URL('../', import.meta.url);
const NOW = Date.parse('2026-10-02T14:39:10Z');
const DEVICE = '3f2a9c1e-7b4d-4e8a-9f10-2c3d4e5f6a7b';
// A fixture code: real spot codes are never committed (see scripts/air-codes.mjs).
const CODE = 'TESTCODE7';
const good = (over = {}) => ({ kind: 'wait', value: '1-4', device: DEVICE, code: CODE, extras: [], asGuest: false, ...over });
const reason = (spot, body) => parseAirReport(config, spot, body, NOW).reason;

test('field reports: a good report parses to exact fields', () => {
  assert.deepEqual(parseAirReport(config, 'courts', good({ extras: ['wind', 'league'], observedAt: NOW - 60_000 }), NOW), {
    spot: 'courts', kind: 'wait', value: '1-4', extras: ['wind', 'league'], device: DEVICE, code: CODE, asGuest: false, observedAt: NOW - 60_000,
  });
  const beach = parseAirReport(config, 'beach', { kind: 'fog', value: 'none', device: DEVICE }, NOW);
  assert.equal(beach.code, null, 'no code is a remote report, not an error');
  assert.equal(beach.observedAt, NOW, 'no observedAt reads as now');
  assert.deepEqual(beach.extras, []);
  assert.equal(parseAirReport(config, 'courts', good({ observedAt: NOW + 30_000 }), NOW).observedAt, NOW, 'a fast clock reads as now');
  assert.equal(parseAirReport(config, 'courts', good({ code: 'testcode7' }), NOW).code, CODE, 'codes are case-insensitive');
});

test('field reports: every rejection reason, and nothing is repaired', () => {
  assert.equal(reason('courts', null), 'bad-json');
  assert.equal(reason('courts', []), 'bad-json');
  assert.equal(reason('courts', 'wait'), 'bad-json');
  assert.equal(reason('nope', good()), 'bad-spot');
  for (const r of config.reserved) assert.equal(reason(r, good()), 'bad-spot', `${r} is reserved`);
  assert.equal(reason('courts', good({ kind: 'fog' })), 'bad-kind');
  assert.equal(reason('courts', good({ kind: 'constructor' })), 'bad-kind', 'prototype keys are not kinds');
  for (const kind of ['tide', 'swell', 'sun', 'aqi']) {
    const value = kindOf(config, 'beach', kind).options[0].v;
    assert.equal(reason('beach', { kind, value, device: DEVICE }), 'bad-kind', `${kind} is the early shift's fact: no phone files one`);
  }
  assert.equal(parseAirReport(config, 'courts', good({ kind: 'sign', value: 'weekends' }), NOW).kind, 'sign', 'a desk kind parses; the store gates it on a live call');
  assert.equal(reason('courts', good({ value: '1–4' })), 'bad-value', 'an en dash is not the bucket');
  assert.equal(reason('courts', good({ value: ' 1-4' })), 'bad-value');
  assert.equal(reason('courts', good({ value: 'CANT' })), 'bad-value', 'case is exact');
  assert.equal(reason('courts', good({ value: 0 })), 'bad-value', 'a number is not the "0" bucket');
  assert.equal(reason('courts', good({ value: 'clear' })), 'bad-value', 'another spot\'s bucket');
  assert.equal(reason('courts', good({ extras: ['drizzle'] })), 'bad-extras', 'outside the allowlist');
  assert.equal(reason('courts', good({ extras: ['wind', 'wind'] })), 'bad-extras', 'duplicates');
  assert.equal(reason('courts', good({ extras: ['wind', 'damp', 'league', 'lights-on'] })), 'bad-extras', 'more than 3');
  assert.equal(reason('courts', good({ extras: 'wind' })), 'bad-extras');
  assert.equal(reason('courts', good({ device: DEVICE.toUpperCase() })), 'bad-device', 'lowercase only');
  assert.equal(reason('courts', good({ device: '3f2a9c1e-7b4d-1e8a-9f10-2c3d4e5f6a7b' })), 'bad-device', 'v4 only');
  assert.equal(reason('courts', good({ device: undefined })), 'bad-device');
  assert.equal(reason('courts', good({ code: 'F R I' })), 'bad-code');
  assert.equal(reason('courts', good({ code: 7 })), 'bad-code');
  assert.equal(reason('courts', good({ asGuest: 'yes' })), 'bad-json');
  assert.equal(reason('courts', good({ observedAt: String(NOW) })), 'bad-observed-at', 'strings are never numbers');
  assert.equal(reason('courts', good({ observedAt: NOW + 0.5 })), 'bad-observed-at');
  assert.equal(reason('courts', good({ observedAt: NOW + 61_000 })), 'bad-observed-at', 'from the future');
  assert.equal(reason('courts', good({ observedAt: NOW - 16 * 60_000 })), 'stale-observation');
  assert.equal(parseAirReport(config, 'courts', good({ observedAt: NOW - 15 * 60_000 }), NOW).observedAt, NOW - 15 * 60_000, '15 minutes is the edge');
});

test('field reports: confirms parse or reject', () => {
  const id = 'ar_0123456789abcdef0123';
  assert.deepEqual(parseConfirm({ reportId: id, verdict: 'still', device: DEVICE, code: CODE }), { reportId: id, verdict: 'still', device: DEVICE, code: CODE });
  assert.equal(parseConfirm({ reportId: id, verdict: 'cant', device: DEVICE }).code, null);
  assert.equal(parseConfirm(null).reason, 'bad-json');
  assert.equal(parseConfirm({ reportId: 'x', verdict: 'still', device: DEVICE }).reason, 'bad-report');
  assert.equal(parseConfirm({ reportId: id, verdict: 'Still', device: DEVICE }).reason, 'bad-verdict');
  assert.equal(parseConfirm({ reportId: id, verdict: 'still', device: 'nope' }).reason, 'bad-device');
  assert.equal(parseConfirm({ reportId: id, verdict: 'still', device: DEVICE, code: '!' }).reason, 'bad-code');
  assert.equal(parseCode('').code, null);
});

test('field reports: every reason the parsers return is a documented reason', () => {
  const seen = new Set();
  const bodies = [null, good({ kind: 'x' }), good({ value: 'x' }), good({ extras: ['x'] }), good({ device: 'x' }), good({ code: '!' }), good({ observedAt: 'x' }), good({ observedAt: 1 })];
  for (const b of bodies) seen.add(reason('courts', b));
  seen.add(reason('x', good()));
  for (const b of [{}, { reportId: 'ar_0123456789abcdef', verdict: 'x' }]) seen.add(parseConfirm(b).reason);
  for (const r of seen) assert.ok(AIR_REASONS.includes(r), r);
});

test('field reports: v1 buckets are frozen and every bucket has a reading label', () => {
  assert.equal(config.version, 1);
  assert.deepEqual(kindOf(config, 'courts', 'wait').options.map((o) => o.v), ['locked', '0', '1-4', '5-8', '9+', 'cant']);
  assert.deepEqual(kindOf(config, 'beach', 'fog').options.map((o) => o.v), ['clear', 'hazy', 'none', 'cant']);
  assert.deepEqual(Object.keys(spotOf(config, 'beach').kinds), ['fog', 'tide', 'swell', 'sun', 'aqi'], 'fog stays first: primaryKind() reads key order');
  assert.equal(kindOf(config, 'courts', 'wait').decayMin, 45);
  assert.equal(kindOf(config, 'beach', 'fog').decayMin, 120);
  for (const spot of config.spots) {
    for (const cfg of Object.values(spot.kinds)) {
      for (const o of cfg.options) assert.ok(cfg.readingLabels[o.v], `${spot.id} ${o.v} has a reading label`);
      assert.deepEqual(Object.keys(cfg.readingLabels).sort(), cfg.options.map((o) => o.v).sort(), 'no label for a bucket that does not exist');
    }
  }
  assert.equal(labelOf(kindOf(config, 'courts', 'wait'), '1-4'), '1–4 in the rack');
  assert.equal(labelOf(kindOf(config, 'courts', 'wait'), null), null);
});

test('field reports: no spot id collides with a reserved id, and names stay neutral', () => {
  assert.deepEqual([...config.reserved].sort(), ['agent', 'assign', 'board', 'claim', 'confirm', 'desk', 'index', 'me'], '/r/agent/[call] and /r/desk are never spots');
  const ids = config.spots.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.ok(!config.reserved.includes(id), id);
    assert.match(id, /^[a-z0-9-]+$/);
    assert.equal(spotOf(config, id).id, id);
  }
  const courts = spotOf(config, 'courts');
  assert.equal(courts.name, 'Manhattan Middle School courts');
  assert.equal(courts.short, 'MANHATTAN MIDDLE');
  assert.equal(courts.mhz, 7.5);
  assert.equal(spotOf(config, 'beach').mhz, 6.1);
});

test('field reports: hashing, ids and bylines follow the spec formulas', async () => {
  assert.match(await pidHash(DEVICE), /^[0-9a-f]{16}$/);
  assert.notEqual(await ipHash('203.0.113.9', '2026-10-02'), await ipHash('203.0.113.9', '2026-10-03'), 'IPs are salted by day');
  assert.equal(await ipHash('203.0.113.9', '2026-10-02'), await ipHash('203.0.113.9', '2026-10-02', 'pointcast-air-v1'));
  assert.match(newAirId(), REPORT_ID_RE);
  assert.match(newAirId('as'), /^as_[0-9a-f]{20}$/);
  assert.equal(guestByline('0000aaaaaaaaaaaa'), 'Guest 1000');
  assert.equal(guestByline('ffff000000000000'), `Guest ${1000 + (0xffff % 9000)}`);
  assert.equal(ownerOf({ user_id: 'u1', pid_hash: 'p' }), 'user:u1');
  assert.equal(ownerOf({ user_id: null, pid_hash: 'p' }), 'dev:p');
  assert.equal(slotOf(NOW), Math.floor(NOW / 1_800_000));
});

test('field reports: spot codes are keyed hashes, and no code or code hash is committed', async () => {
  assert.equal(await codeHash('courts', CODE), null, 'no pepper, no hash: nothing verifies');
  assert.equal(await codeHash('courts', CODE, ''), null);
  const h = await codeHash('courts', CODE, 'pepper-a');
  assert.match(h, /^[0-9a-f]{32}$/);
  assert.equal(await codeHash('courts', CODE, 'pepper-a'), h);
  assert.notEqual(await codeHash('courts', CODE, 'pepper-b'), h, 'the pepper keys the hash');
  assert.notEqual(await codeHash('beach', CODE, 'pepper-a'), h, 'a code is per spot');
  const migrations = await readdir(new URL('migrations/auth/', root));
  for (const f of migrations) {
    const text = await readFile(new URL(`migrations/auth/${f}`, root), 'utf8');
    assert.doesNotMatch(text, /INSERT[^;]*INTO air_codes/i, `${f} seeds air_codes; seed from an untracked file`);
  }
  const sql = await readFile(new URL('migrations/auth/0023_air.sql', root), 'utf8');
  for (const t of ['air_reports', 'air_confirms', 'air_points', 'air_stamps', 'air_firsts', 'air_broadcasts', 'air_codes', 'morning_editions']) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${t} \\(`), t);
  }
  assert.match(sql, /source_url TEXT/);
  assert.match(sql, /source = 'page' OR source LIKE 'agent:_%'/);
});
