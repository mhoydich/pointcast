import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import schedule from '../src/data/courts-schedule.json' with { type: 'json' };
import { kindOf, kindRole, ROLES, spotOf } from '../functions/_lib/air-kinds.mjs';

// The Pickleball Board, group F (build spec §3, §4, §11): the sourced schedule
// and the spots it reports on. Nothing here renders a fact; it keeps the data
// honest enough that showable() and the page can trust its shape.
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const CONFIDENCE = ['verified', 'partial', 'unverified'];
const minutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const isDays = (days) => Array.isArray(days) && days.length > 0 && new Set(days).size === days.length && days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);

/** Every provenance-carrying thing in the file, with where it sits. */
function sourced() {
  const out = [];
  for (const c of [...schedule.courts, ...schedule.private]) {
    for (const f of c.facts) out.push([`${c.id} fact ${f.key}`, f]);
    if (c.hours) out.push([`${c.id} hours`, c.hours]);
    if (c.walkOn) out.push([`${c.id} walkOn`, c.walkOn]);
    for (const b of c.blocks ?? []) out.push([`${c.id} block ${b.label}`, b]);
    if (c.reserve) out.push([`${c.id} reserve`, c.reserve]);
  }
  return out;
}

test('courts.wait is unchanged and still the first kind; parking and vibe sit behind it', () => {
  const courts = spotOf(config, 'courts');
  assert.deepEqual(Object.keys(courts.kinds), ['wait', 'parking', 'vibe'], 'primaryKind() reads key order');
  const wait = kindOf(config, 'courts', 'wait');
  assert.equal(wait.question, 'Paddles in the rack?');
  assert.equal(wait.decayMin, 45);
  assert.deepEqual(wait.options.map((o) => o.v), ['locked', '0', '1-4', '5-8', '9+', 'cant']);
  assert.deepEqual(wait.extras, ['wind', 'damp', 'nets-down', 'lights-on', 'league']);
  assert.equal(kindRole(wait), 'live');
  assert.equal(wait.role, undefined, 'the Friday kind keeps its config as it was');
  assert.deepEqual(courts.hours, { open: '06:00', close: '22:00' });
  assert.deepEqual(courts.courtCall, { weekday: 5, time: '07:30' });
  assert.equal(courts.shape, 'paddle-rack');
  for (const s of config.spots) assert.equal(Object.keys(s.kinds)[0], s.channel === 'CRT' ? 'wait' : 'fog', `${s.id} asks its main question first`);
});

test('every spot has a unique frequency, none inside the Net ±4 steps or on COURT', async () => {
  const { NET, COURT_CALL, mhzToStep } = await import('../src/lib/band.ts');
  const steps = config.spots.map((s) => mhzToStep(s.mhz));
  assert.equal(new Set(steps).size, steps.length, 'one station per step');
  assert.equal(new Set(config.spots.map((s) => s.mhz)).size, config.spots.length);
  for (const s of config.spots) {
    assert.ok(Math.abs(mhzToStep(s.mhz) - NET.step) > 4, `${s.id} at ${s.mhz} is clear of the Net`);
    if (s.id !== 'courts') assert.notEqual(mhzToStep(s.mhz), COURT_CALL.step, `${s.id} is off COURT`);
  }
  // The new courts run 7.600–8.400 in 0.100 steps, in schedule order.
  const board = schedule.courts.filter((c) => c.air && c.id !== 'courts').sort((a, b) => a.order - b.order);
  assert.deepEqual(board.map((c) => spotOf(config, c.id).mhz), [7.6, 7.7, 7.8, 7.9, 8.0, 8.1, 8.2, 8.3, 8.4]);
});

test('new spots: CRT, one question set per shape, parking is side, vibe is a weekly rating', () => {
  const crt = config.spots.filter((s) => s.channel === 'CRT');
  assert.equal(crt.length, 10);
  for (const s of crt) {
    assert.equal(s.color, '#3B6D11');
    assert.equal(s.noun, 0);
    assert.ok(['paddle-rack', 'reservation+drop-in', 'first-come'].includes(s.shape), `${s.id} shape`);
    for (const [kind, cfg] of Object.entries(s.kinds)) assert.ok(cfg.role == null || ROLES.includes(cfg.role), `${s.id}.${kind} role`);
    const wait = s.kinds.wait.options.map((o) => o.v);
    if (s.shape === 'reservation+drop-in') {
      assert.deepEqual(wait, ['booked', '0', '1-4', '5-8', '9+', 'cant'], s.id);
      assert.equal(s.kinds.wait.options[0].label, 'No open court');
    }
    if (s.shape === 'first-come') {
      assert.deepEqual(wait, ['taken', '0', '1-4', '5-8', '9+', 'cant'], s.id);
      assert.equal(s.kinds.wait.options[0].label, 'Another sport on it');
      assert.deepEqual(s.kinds.wait.extras, ['wind', 'damp', 'no-net']);
    }
    if (s.id !== 'courts') assert.equal(s.kinds.wait.question, 'Paddles in the rack?');
    const parking = s.kinds.parking;
    assert.equal(kindRole(parking), 'side');
    assert.deepEqual([parking.decayMin, parking.points, parking.payEvery], [60, 3, undefined]);
    assert.deepEqual(parking.options.map((o) => o.v), ['easy', 'tight', 'full', 'paid', 'cant']);
    const vibe = s.kinds.vibe;
    assert.equal(vibe.question, "How's the court?");
    assert.equal(kindRole(vibe), 'rating');
    assert.deepEqual([vibe.decayMin, vibe.points, vibe.payEvery], [43200, 2, 'week']);
    assert.deepEqual(vibe.options.map((o) => o.label), [
      'Pancake · glass smooth', 'Solid · no complaints', 'Character · cracks, sad net', 'Survival Mode · sand, puddles, prayer', "Condemned · don't",
    ]);
    assert.deepEqual(vibe.extras, ['no-windscreen', 'no-shade', 'lights-out', 'net-loose', 'restrooms-locked']);
  }
  assert.equal(kindRole(kindOf(config, 'beach', 'fog')), 'live', 'no role is live');
  assert.equal(kindRole({ role: 'broadcast' }), 'side', 'an unknown role fails closed: never on the air');
});

test('hours only where verified: El Segundo 08:00–22:00; the rest never count First Light', () => {
  const withHours = config.spots.filter((s) => s.hours).map((s) => s.id).sort();
  assert.deepEqual(withHours, ['beach', 'courts', 'el-segundo']);
  assert.deepEqual(spotOf(config, 'el-segundo').hours, { open: '08:00', close: '22:00' });
  const es = schedule.courts.find((c) => c.id === 'el-segundo').hours;
  assert.equal(es.confidence, 'verified');
  assert.deepEqual(es.rules, [{ days: [0, 1, 2, 3, 4, 5, 6], open: '08:00', close: '22:00' }]);
});

test('schedule lint: every fact, hours, walk-on, block and reserve link carries src, checked and confidence', () => {
  assert.equal(schedule.version, 1);
  for (const [id, s] of Object.entries(schedule.sources)) {
    assert.match(id, /^[A-Z]+\d*$/, id);
    assert.equal(typeof s.label, 'string');
    assert.ok(s.url === null || /^https:\/\//.test(s.url), `${id} url`);
  }
  assert.equal(schedule.sources.MIKE.url, null, '"Mike said" is a label, not a source');
  const all = sourced();
  assert.ok(all.length > 50);
  for (const [where, p] of all) {
    assert.ok(Object.prototype.hasOwnProperty.call(schedule.sources, p.src), `${where}: src ${p.src} is a listed source`);
    assert.match(p.checked, DAY_RE, `${where}: checked`);
    assert.ok(p.checked <= '2026-09-28', `${where}: checked in the future`);
    assert.ok(CONFIDENCE.includes(p.confidence), `${where}: confidence`);
    if (p.src === 'MIKE') assert.notEqual(p.confidence, 'verified', `${where}: Mike said is never verified`);
  }
  for (const c of [...schedule.courts, ...schedule.private]) {
    for (const f of c.facts) {
      assert.match(f.key, /^[a-z-]+$/, `${c.id} fact key`);
      assert.ok(f.text && !/UNVERIFIED/i.test(f.text), `${c.id}: no unverified text dressed as a fact`);
    }
    if (c.walkOn) assert.equal(c.walkOn.key, 'walk-on', c.id);
    if (c.reserve) assert.match(c.reserve.url, /^(https:\/\/|mailto:)/, `${c.id} reserve url`);
    if (c.hours) {
      assert.ok(['closed', 'unknown'].includes(c.hours.else), `${c.id} hours.else`);
      for (const r of [...c.hours.rules, ...(c.hours.conflict?.rules ?? [])]) {
        assert.ok(isDays(r.days), `${c.id} hours days`);
        assert.match(r.open, HHMM_RE, `${c.id} open`);
        assert.ok(r.close === 'dusk' || (HHMM_RE.test(r.close) && minutes(r.close) > minutes(r.open)), `${c.id} close`);
      }
      if (c.hours.conflict) assert.ok(c.hours.conflict.text && c.hours.confidence !== 'verified', `${c.id}: a conflict is never shown as settled`);
    }
  }
});

test('schedule lint: blocks read as days and times, and until >= from', () => {
  for (const c of schedule.courts) {
    for (const b of c.blocks) {
      const where = `${c.id} ${b.label}`;
      assert.ok(['dropin', 'priority', 'closed'].includes(b.kind), `${where} kind`);
      assert.ok(isDays(b.days), `${where} days`);
      assert.match(b.start, HHMM_RE, `${where} start`);
      assert.match(b.end, HHMM_RE, `${where} end`);
      assert.ok(minutes(b.end) > minutes(b.start), `${where} ends after it starts`);
      for (const d of [b.from, b.until]) assert.ok(d === null || DAY_RE.test(d), `${where} from/until`);
      if (b.from && b.until) assert.ok(b.until >= b.from, `${where}: until >= from`);
      assert.ok(b.fee === null || typeof b.fee === 'string', `${where} fee`);
    }
  }
  const es = schedule.courts.find((c) => c.id === 'el-segundo').blocks;
  assert.deepEqual(es.map((b) => [b.label, b.days, b.start, b.end, b.fee, b.from, b.until]), [
    ['Advanced drop-in', [1], '17:00', '19:00', '$5', '2026-09-07', '2026-10-26'],
    ['Advanced drop-in', [5], '09:00', '12:00', '$7', '2026-09-04', '2026-10-30'],
    ['3.0 drop-in', [0, 6], '09:00', '12:00', '$7', '2026-09-05', '2026-10-31'],
    ['3.5 drop-in', [0, 6], '15:00', '17:00', '$5', '2026-09-05', '2026-10-31'],
  ], 'the rec.us sections as re-checked 2026-09-28');
});

test('schedule lint: every air id resolves to a spot, and every court spot is listed', () => {
  const ids = schedule.courts.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(schedule.courts.map((c) => c.order), ids.map((_, i) => i + 1), 'order runs 1..n in file order');
  for (const c of schedule.courts) {
    const spot = spotOf(config, c.id);
    if (c.air) {
      assert.ok(spot, `${c.id} is an air spot`);
      assert.equal(spot.name, c.name, `${c.id} name matches the spot`);
      assert.equal(spot.short, c.short, `${c.id} short matches the spot`);
      assert.equal(spot.shape, c.shape, `${c.id} shape matches the spot`);
      assert.equal(c.status, 'open', `${c.id}: only open public courts get an air spot`);
    } else {
      assert.equal(spot, null, `${c.id} is a listing, not a spot`);
    }
    assert.ok(['open', 'closed'].includes(c.status));
  }
  for (const s of config.spots.filter((x) => x.channel === 'CRT')) assert.ok(schedule.courts.some((c) => c.id === s.id && c.air), `${s.id} is on the board`);
  assert.deepEqual(schedule.courts.filter((c) => c.status === 'closed').map((c) => c.id), ['kelly']);
  const listed = new Set(ids);
  for (const q of schedule.confirm) {
    assert.match(q.id, /^[a-z-]+$/);
    assert.ok(q.asks.length > 0, q.id);
    for (const id of q.courts) assert.ok(listed.has(id), `confirm ${q.id}: ${id} resolves`);
  }
  for (const p of schedule.private) assert.equal(spotOf(config, p.id), null, `${p.id}: private courts are never asked about`);
});

test('the honest bits: partial and conflicting facts stay tagged, "Mike said" stays a label', () => {
  const by = Object.fromEntries(schedule.courts.map((c) => [c.id, c]));
  assert.deepEqual(by.courts.hours.rules, [{ days: [0, 6], open: '08:00', close: 'dusk' }]);
  assert.equal(by.courts.hours.else, 'unknown', 'weekdays at MBMS are a question, not "closed"');
  assert.equal(by.courts.facts.find((f) => f.key === 'queue').src, 'MIKE');
  assert.equal(by['manhattan-heights'].hours.confidence, 'partial');
  assert.match(by['manhattan-heights'].hours.conflict.text, /8 AM–8 PM/);
  assert.equal(by.kelly.air, false);
  assert.ok(schedule.confirm.some((q) => q.id === 'el-segundo' && q.asks.includes('the November schedule')));
  for (const p of schedule.private.filter((x) => ['love-life', 'westdrift'].includes(x.id))) {
    for (const f of p.facts) assert.equal(f.confidence, 'partial', `${p.id}: not re-opened today`);
  }
});

test('src/lib/courts.ts: the loader and the BoardPayload contract other groups build against', async () => {
  const src = await read('src/lib/courts.ts');
  for (const name of ['Court', 'Block', 'Fact', 'Hours', 'Conditions', 'BoardPayload', 'BoardCourt', 'BoardReading', 'BoardVibe', 'CourtsSchedule']) {
    assert.match(src, new RegExp(`export type ${name} = `), name);
  }
  for (const name of ['COURTS_SCHEDULE', 'COURTS', 'PRIVATE_COURTS', 'CONFIRM_ITEMS', 'COURT_SOURCES', 'EMPTY_CONDITIONS']) assert.match(src, new RegExp(`export const ${name}\\b`), name);
  for (const name of ['courtById', 'sourceOf', 'checkedLabel', 'provenanceLine']) assert.match(src, new RegExp(`export function ${name}\\(`), name);
  assert.match(src, /import data from '\.\.\/data\/courts-schedule\.json';/);
  assert.doesNotMatch(src, /pid_hash|ip_hash/);
});

test('spec §3 confidence pins: the Perry grid and the Alta Vista address stay "unconfirmed" and stay in Help us confirm', () => {
  const by = Object.fromEntries(schedule.courts.map((c) => [c.id, c]));
  // Perry: "Pickleball 08–14 (partial: the flyer's day grid is an image)". Every block read off that grid is partial;
  // only the youth-basketball line, printed as text on the flyer, is verified.
  const grid = by.perry.blocks.filter((b) => b.label !== 'Youth basketball priority');
  assert.ok(grid.some((b) => b.label === 'Pickleball priority' && b.start === '08:00' && b.end === '14:00'));
  for (const b of grid) assert.equal(b.confidence, 'partial', `Perry ${b.label} ${b.start}–${b.end}`);
  assert.equal(by.perry.blocks.find((b) => b.label === 'Youth basketball priority').confidence, 'verified');
  // Alta Vista: "address and hours" are open questions.
  const address = by['alta-vista'].facts.find((f) => f.key === 'address');
  assert.notEqual(address?.confidence, 'verified', 'the Alta Vista address never renders (or publishes in JSON-LD) as settled');
  assert.equal(by['alta-vista'].hours, null);
  const asks = (id) => schedule.confirm.find((q) => q.id === id)?.asks ?? [];
  assert.deepEqual(asks('perry'), ['the priority grid']);
  assert.deepEqual(asks('alta-vista'), ['address', 'hours']);
  assert.deepEqual(schedule.confirm.map((q) => q.id), ['courts', 'el-segundo', 'manhattan-heights', 'alta-vista', 'perry', 'anderson', 'hawthorne', 'not-covered', 'parking'], 'spec §3 order');
});
