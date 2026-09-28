import assert from 'node:assert/strict';
import test from 'node:test';

// sky.ts is a leaf (no imports of its own), so it loads under plain node
// unlike burnoff.ts/marine-oracle.ts (extensionless relative imports — see
// tests/court-weather.test.mjs's note); El Segundo's coordinates are copied
// from burnoff.ts's EL_SEGUNDO rather than importing that file. Likewise
// src/lib/courts.ts imports its JSON without an import attribute (like
// air.ts), so node cannot load it either — this file reads the schedule
// straight from JSON, the way court-board.mjs and air-board-store.ts do.
import { sunTimes } from '../src/lib/sky.ts';
import schedule from '../src/data/courts-schedule.json' with { type: 'json' };
import { laParts } from '../functions/_lib/air-reading.mjs';
import {
  bestBet, blocksOn, boardSummary, groupEvidence, lastOnSite, nextSession, openState, publicReading, qualityVibe, sessionsNow, showable,
} from '../functions/_lib/court-board.mjs';

// The Pickleball Board, group A (build spec §6, §11): schedule math, court
// quality and the hero pick — pure, so no D1 and no Pages runtime.

const EL_SEGUNDO = { lat: 33.9192, lon: -118.4165 };

const courtById = (sched, id) => sched.courts.find((c) => c.id === id) ?? null;

/** Minute-of-day (LA) of `date`'s real astronomical sunset in El Segundo. */
function sunsetMinuteOf(date) {
  const sunset = sunTimes(date, EL_SEGUNDO.lat, EL_SEGUNDO.lon).sunset;
  return laParts(sunset.getTime()).minuteOfDay;
}

/* ---------- showable(): confidence and staleness ---------- */

test('showable: unverified is hidden, partial is tagged, a fact 45+ days old reads stale', () => {
  const now = Date.parse('2026-09-28T12:00:00-07:00');
  assert.deepEqual(showable({ confidence: 'unverified', checked: '2026-09-28' }, now), { show: false, tag: null });
  assert.deepEqual(showable({ confidence: 'partial', checked: '2026-09-28' }, now), { show: true, tag: 'unconfirmed' });
  assert.deepEqual(showable({ confidence: 'verified', checked: '2026-09-28' }, now), { show: true, tag: null });
  assert.deepEqual(showable({ confidence: 'verified', checked: '2026-08-15' }, now), { show: true, tag: null }, '44 days: still fresh');
  assert.deepEqual(showable({ confidence: 'verified', checked: '2026-08-14' }, now), { show: true, tag: 'may have changed' }, '45 days: stale');
  assert.deepEqual(showable(null, now), { show: false, tag: null });
});

/* ---------- blocksOn / sessionsNow: real schedule data ---------- */

test('blocksOn/sessionsNow: El Segundo\'s Monday advanced drop-in — 17:00 is in session, 19:00 is not', () => {
  const es = courtById(schedule, 'el-segundo');
  const at17 = Date.parse('2026-09-28T17:00:00-07:00'); // Mon, in season (block runs 2026-09-07..2026-10-26)
  const at19 = Date.parse('2026-09-28T19:00:00-07:00');
  assert.equal(blocksOn(es, at17).filter((b) => b.days.includes(1)).length, 1);
  const now = sessionsNow(es, at17, null);
  assert.equal(now.length, 1);
  assert.equal(now[0].block.label, 'Advanced drop-in');
  assert.equal(now[0].until, '7 PM');
  assert.deepEqual(sessionsNow(es, at19, null), [], '19:00 is the block\'s exclusive end');
});

test('blocksOn: a block\'s season ending truncates it — the Monday after Oct 26 shows nothing', () => {
  const es = courtById(schedule, 'el-segundo');
  const nov2 = Date.parse('2026-11-02T17:00:00-08:00'); // the Monday after the block's `until` (2026-10-26), PST
  assert.deepEqual(blocksOn(es, nov2).filter((b) => b.label === 'Advanced drop-in' && b.days.includes(1)), []);
  assert.deepEqual(sessionsNow(es, nov2, null), []);
});

test('nextSession: the soonest start later today, else the next matching weekday, never past its season', () => {
  const es = courtById(schedule, 'el-segundo');
  // Before the Monday 17:00 block starts: "today".
  const before = Date.parse('2026-09-28T09:00:00-07:00');
  const next = nextSession(es, before, null);
  assert.equal(next.block.label, 'Advanced drop-in');
  assert.equal(next.when, 'today 5 PM');
  // After it: the next candidate is a later day, never today's own start again.
  const after = Date.parse('2026-09-28T20:00:00-07:00');
  const later = nextSession(es, after, null);
  assert.notEqual(later.when, 'today 5 PM');
  // Past every block's season: null.
  assert.equal(nextSession(es, Date.parse('2026-12-01T09:00:00-08:00'), null, 7), null);
});

/* ---------- openState: dusk resolves to real sunset, DST included ---------- */

test('openState: "dusk" resolves to the real sunset, and the 2026-11-01 DST change is handled', () => {
  const courts = courtById(schedule, 'courts'); // Sat–Sun 08:00–dusk, else unknown
  // A Saturday before the DST change (PDT, UTC-7) and one after (PST, UTC-8).
  // The wall-clock sunset minute jumps by about an hour at the transition
  // (clocks fall back; the sun does not) — that jump is the whole point of
  // DST, so openState needs no DST logic of its own: it just trusts
  // whichever real, already-local `sunsetMin` the caller hands it for that
  // calendar day (computed here the same way boardSummary does, from an
  // actual astronomical sunset read through laParts).
  const beforeSunset = sunsetMinuteOf(new Date('2026-10-31T00:00:00Z'));
  const afterSunset = sunsetMinuteOf(new Date('2026-11-07T00:00:00Z'));
  assert.notEqual(beforeSunset, afterSunset);

  // A specific LA wall-clock minute-of-day on a given calendar day, at an explicit UTC offset.
  const laClockMs = (day, offsetHours, minuteOfDay) => {
    const h = String(Math.floor(minuteOfDay / 60)).padStart(2, '0');
    const m = String(minuteOfDay % 60).padStart(2, '0');
    const oh = String(Math.abs(offsetHours)).padStart(2, '0');
    return Date.parse(`${day}T${h}:${m}:00${offsetHours < 0 ? '-' : '+'}${oh}:00`);
  };
  // Before sunset "open", from sunset on "closed", using each Saturday's own real minute.
  assert.equal(openState(courts, laClockMs('2026-10-31', -7, beforeSunset - 10), beforeSunset), 'open', 'PDT: 10 minutes before sunset');
  assert.equal(openState(courts, laClockMs('2026-10-31', -7, beforeSunset), beforeSunset), 'closed', 'PDT: close is exclusive, at sunset itself');
  assert.equal(openState(courts, laClockMs('2026-11-07', -8, afterSunset - 10), afterSunset), 'open', 'PST: 10 minutes before sunset');
  assert.equal(openState(courts, laClockMs('2026-11-07', -8, afterSunset), afterSunset), 'closed', 'PST: close is exclusive, at sunset itself');
  // Before opening (08:00) is still closed, on both sides of the change.
  assert.equal(openState(courts, laClockMs('2026-10-31', -7, 7 * 60), beforeSunset), 'closed');
  assert.equal(openState(courts, laClockMs('2026-11-07', -8, 7 * 60), afterSunset), 'closed');
  // A weekday: hours.else is 'unknown' for MBMS (weekday access is a question, not a computed rule).
  assert.equal(openState(courts, Date.parse('2026-09-28T09:00:00-07:00'), beforeSunset), 'unknown');
});

test('openState: a standing closure always reads closed; no hours reads unknown', () => {
  const kelly = courtById(schedule, 'kelly');
  assert.equal(kelly.status, 'closed');
  assert.equal(openState(kelly, Date.now(), 1000), 'closed');
  const anderson = courtById(schedule, 'anderson');
  if (!anderson.hours) assert.equal(openState(anderson, Date.now(), 1000), 'unknown');
});

/* ---------- groupEvidence / lastOnSite ---------- */

test('groupEvidence: rows and their confirms land under their own report\'s spot:kind', () => {
  const rows = [
    { id: 'ar_1', spot: 'courts', kind: 'wait', value: '0', observed_at: 1, day: '2026-09-28', pid_hash: 'a', ip_hash: 'x', user_id: null, byline: 'Guest', onsite: 1, status: 'ok', source: 'page' },
    { id: 'ar_2', spot: 'courts', kind: 'parking', value: 'tight', observed_at: 2, day: '2026-09-28', pid_hash: 'b', ip_hash: 'y', user_id: null, byline: 'Guest', onsite: 1, status: 'ok', source: 'page' },
  ];
  const confirms = [{ report_id: 'ar_1', pid_hash: 'c', ip_hash: 'z', user_id: null, verdict: 'still', value: '0', onsite: 1, at: 3 }];
  const grouped = groupEvidence(rows, confirms);
  assert.equal(grouped.get('courts:wait').rows.length, 1);
  assert.equal(grouped.get('courts:wait').confirms.length, 1);
  assert.equal(grouped.get('courts:parking').rows.length, 1);
  assert.equal(grouped.get('courts:parking').confirms.length, 0);
});

test('lastOnSite: the newest on-site human row today, remote and agent rows never counted', () => {
  const cfg = { readingLabels: { tight: 'Parking tight' }, options: [{ v: 'tight', label: 'Tight' }] };
  const rows = [
    { spot: 'courts', kind: 'parking', value: 'tight', observed_at: 1000, day: '2026-09-28', pid_hash: 'a', byline: 'Guest 1', onsite: 1, status: 'ok', source: 'page' },
    { spot: 'courts', kind: 'parking', value: 'easy', observed_at: 2000, day: '2026-09-28', pid_hash: 'b', byline: 'Guest 2', onsite: 0, status: 'ok', source: 'page' }, // remote: never the last
    { spot: 'courts', kind: 'parking', value: 'full', observed_at: 3000, day: '2026-09-28', pid_hash: 'c', byline: 'Guest 3', onsite: 1, status: 'ok', source: 'agent:scout' }, // agent: never the last
  ];
  const last = lastOnSite(rows, cfg, Date.parse('2026-09-28T12:00:00-07:00'));
  assert.deepEqual(last, { value: 'tight', label: 'Parking tight', observedAt: '1970-01-01T00:00:01Z', byline: 'Guest 1' });
});

/* ---------- qualityVibe ---------- */

function vibeRow(value, { pid = 'p', userId = null, at, onsite = 1, source = 'page', status = 'ok', extras = [] } = {}) {
  return { spot: 'el-segundo', kind: 'vibe', value, extras_json: JSON.stringify(extras), observed_at: at, day: '2026-09-28', pid_hash: pid, user_id: userId, byline: 'Guest', onsite, status, source };
}

test('qualityVibe: under 3 raters is null; one rating per phone (latest wins); remote and agent rows never count', () => {
  const now = Date.parse('2026-09-28T12:00:00-07:00');
  assert.equal(qualityVibe([vibeRow('solid', { at: now - 1000 }), vibeRow('character', { pid: 'q', at: now - 2000 })], now), null);
  const rows = [
    vibeRow('solid', { pid: 'a', at: now - 5000 }),
    vibeRow('character', { pid: 'a', at: now - 1000 }), // same phone, later: replaces its own vote
    vibeRow('solid', { pid: 'b', at: now - 4000 }),
    vibeRow('solid', { pid: 'c', at: now - 3000, extras: ['lights-out'] }),
    vibeRow('solid', { pid: 'd', at: now - 6000, onsite: 0 }), // remote: never counted
    vibeRow('solid', { pid: 'e', at: now - 6000, source: 'agent:scout' }), // agent: never counted
  ];
  const v = qualityVibe(rows, now);
  assert.equal(v.n, 3, 'phone a counts once, at its latest answer (character, not its earlier solid)');
  assert.equal(v.mode, 'solid', 'solid still has 2 of 3 votes');
  assert.equal(v.label, 'Solid');
  assert.equal(v.runnerUp, 'Character', 'character is 1 of 3: 33%, at or above the 30% floor');
  assert.deepEqual(v.chips, [{ v: 'lights-out', n: 1 }]);
});

test('qualityVibe: a runner-up shows only at 30% or more, and there is never a star average', () => {
  const now = Date.parse('2026-09-28T12:00:00-07:00');
  const rows = [
    vibeRow('solid', { pid: 'a', at: now - 1000 }),
    vibeRow('solid', { pid: 'b', at: now - 2000 }),
    vibeRow('solid', { pid: 'c', at: now - 3000 }),
    vibeRow('character', { pid: 'd', at: now - 4000 }),
    vibeRow('character', { pid: 'e', at: now - 5000 }),
  ];
  const v = qualityVibe(rows, now);
  assert.equal(v.n, 5);
  assert.equal(v.mode, 'solid');
  assert.equal(v.runnerUp, 'Character', '2 of 5 is 40%');
  assert.ok(!('stars' in v) && !('average' in v));
});

/* ---------- bestBet: rule order ---------- */

const card = (id, patch = {}) => ({ id, order: 1, status: 'open', walkOn: null, now: [], next: null, readings: { wait: null }, ...patch });

test('bestBet: a locked gate loses to a drop-in; a live 0 beats a drop-in', () => {
  const dropin = card('el-segundo', { order: 2, now: [{ block: { kind: 'dropin', label: 'Advanced drop-in', fee: '$5' }, until: '7 PM' }] });
  const locked = card('courts', { order: 1, readings: { wait: { value: 'locked', label: "Gate's locked", status: 'single', support: 1, ageMin: 1 } } });
  const withLive = bestBet([locked, dropin]);
  assert.equal(withLive.court, 'el-segundo', 'a locked gate is never a bet; the drop-in wins');
  assert.equal(withLive.reason, 'dropin');

  const zero = card('courts', { order: 1, readings: { wait: { value: '0', label: '0 · walk on', status: 'single', support: 1, ageMin: 2 } } });
  const winner = bestBet([zero, dropin]);
  assert.equal(winner.court, 'courts', 'a live 0 outranks a scheduled drop-in');
  assert.equal(winner.reason, 'live');
});

test('bestBet: rule order falls through to an open walk-on, then the soonest next session, then null', () => {
  const openWalk = card('anderson', { order: 3, walkOn: { key: 'walk-on', text: 'Free open play', confidence: 'verified', checked: '2026-09-28', src: 'HW1' } });
  assert.deepEqual(bestBet([openWalk], Date.parse('2026-09-28T12:00:00-07:00')), {
    court: 'anderson', reason: 'open', line: 'Open · Free open play', prov: { src: 'HW1', checked: '2026-09-28', confidence: 'verified' },
  });

  const soonToday = card('a', { order: 1, status: 'closed', next: { block: { label: '3.0 drop-in' }, when: 'today 5 PM', dayOffset: 0, startMin: 17 * 60 } });
  const laterSat = card('b', { order: 2, status: 'closed', next: { block: { label: 'Advanced drop-in' }, when: 'Sat 9 AM', dayOffset: 2, startMin: 9 * 60 } });
  const soonest = bestBet([laterSat, soonToday]);
  assert.equal(soonest.court, 'a');
  assert.equal(soonest.reason, 'next');

  assert.equal(bestBet([card('nothing', { status: 'closed' })]), null);
});

/* ---------- boardSummary: the full shape, no hashes ---------- */

test('boardSummary: shapes the BoardPayload, forces parking\'s crew to null, and never carries a hash', () => {
  const now = Date.parse('2026-09-28T17:00:00-07:00'); // Mon
  const waitCfg = { decayMin: 45, options: [{ v: '1-4', label: '1–4' }], readingLabels: { '1-4': '1–4 in the rack' } };
  const parkingCfg = { decayMin: 60, options: [{ v: 'tight', label: 'Tight' }], readingLabels: { tight: 'Parking tight' } };
  const rows = [
    { id: 'ar_1', spot: 'courts', kind: 'wait', value: '1-4', observed_at: now - 60_000, day: '2026-09-28', pid_hash: 'a', ip_hash: 'x', user_id: null, byline: 'Guest 1', onsite: 1, status: 'ok', source: 'page' },
    { id: 'ar_2', spot: 'courts', kind: 'parking', value: 'tight', observed_at: now - 60_000, day: '2026-09-28', pid_hash: 'b', ip_hash: 'y', user_id: null, byline: 'Guest 2', onsite: 1, status: 'ok', source: 'page' },
  ];
  const out = boardSummary({
    now,
    courts: schedule.courts,
    kindCfg: { courts: { wait: waitCfg, parking: parkingCfg } },
    rows, confirms: [], lastRows: rows, vibeRows: [],
    validatorsToday: { phones: 2, courts: 1 },
    conditions: { observedAt: null, wind: null, tempF: null, heat: null, wet: null, marine: null, sunset: null, next3h: null },
  });
  assert.equal(out.courts.length, schedule.courts.length);
  const courts = out.courts.find((c) => c.id === 'courts');
  assert.equal(courts.readings.wait.value, '1-4');
  assert.equal(courts.readings.parking.value, 'tight');
  assert.equal(courts.readings.parking.crew, null, 'parking never carries a crew');
  assert.equal(out.validatorsToday.phones, 2);
  assert.ok(out.best, 'a live wait reading of 1-4 is a bet');
  assert.equal(out.best.court, 'courts');
  const text = JSON.stringify(out);
  assert.doesNotMatch(text, /pid_hash|ip_hash/);
});

/* ---------- integration: reconciled contracts (hero line, rule 4, conflicts, unverified) ---------- */

test('openState: where Manhattan Heights\' two readings of its hours disagree (Mon 20:30), the board says unknown', () => {
  const mh = courtById(schedule, 'manhattan-heights');
  assert.ok(mh.hours.conflict, 'the schedule records the 8–8 reading as a conflict');
  assert.equal(openState(mh, Date.parse('2026-09-28T19:30:00-07:00'), null), 'open', 'both readings say open at 7:30 PM');
  assert.equal(openState(mh, Date.parse('2026-09-28T20:30:00-07:00'), null), 'unknown', '8–9 PM: one reading says open, the other closed');
  assert.equal(openState(mh, Date.parse('2026-09-28T21:30:00-07:00'), null), 'closed', 'both readings say closed');
});

test('unverified hours and blocks never drive now/next/open', () => {
  const now = Date.parse('2026-09-28T17:30:00-07:00'); // Mon
  const es = courtById(schedule, 'el-segundo');
  const hidden = {
    ...es,
    hours: { ...es.hours, confidence: 'unverified' },
    blocks: es.blocks.map((b) => ({ ...b, confidence: 'unverified' })),
  };
  assert.equal(openState(hidden, now, null), 'unknown');
  assert.deepEqual(blocksOn(hidden, now), []);
  assert.deepEqual(sessionsNow(hidden, now, null), []);
  assert.equal(nextSession(hidden, now, null), null);
});

test('bestBet: rule 4 never names a priority block for another sport; lines lead with the court short', () => {
  const basketball = card('perry', { order: 1, short: 'PERRY PARK', status: 'closed', next: { block: { kind: 'priority', label: 'Basketball priority' }, when: 'today 2 PM', dayOffset: 0, startMin: 14 * 60 } });
  const src = { src: 'ES1', checked: '2026-09-28', confidence: 'verified' };
  const dropin = card('el-segundo', { order: 2, short: 'EL SEGUNDO REC', status: 'closed', next: { block: { kind: 'dropin', label: '3.0 drop-in', ...src }, when: 'Sat 9 AM', dayOffset: 2, startMin: 9 * 60 } });
  assert.deepEqual(bestBet([basketball, dropin]), { court: 'el-segundo', reason: 'next', line: 'EL SEGUNDO REC · Next: 3.0 drop-in Sat 9 AM', prov: src });
  assert.equal(bestBet([basketball]), null, 'a basketball priority window is not a place to play');
});

test('boardSummary: at a quiet Monday 5:30 PM the hero names the court and the running drop-in', () => {
  const now = Date.parse('2026-09-28T17:30:00-07:00');
  const out = boardSummary({ now, courts: schedule.courts, conditions: { observedAt: null, wind: null, tempF: null, heat: null, wet: null, marine: null, sunset: null, next3h: null } });
  assert.equal(out.best.reason, 'dropin');
  assert.equal(out.best.court, 'el-segundo');
  assert.equal(out.best.line, 'EL SEGUNDO REC · Advanced drop-in now until 7 PM · $5 · no reports yet');
  const perry = out.courts.find((c) => c.id === 'perry');
  assert.ok(perry.now.some((s) => s.block.label === 'Basketball priority'), 'the card still shows who has the court now');
});

test('boardSummary: overnight, the hero\'s next pick is a drop-in even when a priority window starts sooner', () => {
  const now = Date.parse('2026-10-03T22:30:00-07:00'); // Sat night; Sunday has Perry's 8 AM pickleball priority and El Segundo's 9 AM 3.0 drop-in
  const out = boardSummary({ now, courts: schedule.courts, conditions: null });
  assert.equal(out.best.reason, 'next');
  assert.equal(out.best.court, 'el-segundo');
  assert.equal(out.best.line, 'EL SEGUNDO REC · Next: 3.0 drop-in Sun 9 AM');
  assert.equal(out.courts.find((c) => c.id === 'perry').next.block.kind, 'priority', 'the Perry card still shows its own next window');
});

/* ---------- fixer pass: shut courts, what the phones say, the vibe network guard, the open feed ---------- */

const CONDITIONS = { observedAt: null, wind: null, tempF: null, heat: null, wet: null, marine: null, sunset: null, next3h: null };
const WAIT_CFG = {
  decayMin: 45,
  options: [{ v: 'locked', label: "Gate's locked" }, { v: 'booked', label: 'No open court' }, { v: 'taken', label: 'Another sport on it' }, { v: '0', label: '0 · walk on' }, { v: 'cant', label: "Can't say" }],
  readingLabels: { locked: 'Gate locked', booked: 'No open court', taken: 'Another sport on it', cant: "Can't say" },
};
const onSite = (id, spot, value, at, pid) => ({ id, spot, kind: 'wait', value, observed_at: at, day: '2026-10-03', pid_hash: pid, ip_hash: `ip-${pid}`, user_id: null, byline: 'Guest', onsite: 1, status: 'ok', source: 'page' });

test('bestBet: a live locked gate is never the bet, not even as an "open" court (Sat 1 PM, MBMS on-site "locked")', () => {
  const now = Date.parse('2026-10-03T13:00:00-07:00'); // Sat: MBMS is open 8–dusk by its hours, El Segundo has no drop-in running
  const rows = [onSite('ar_l', 'courts', 'locked', now - 5 * 60_000, 'p1')];
  const out = boardSummary({ now, courts: schedule.courts, kindCfg: { courts: { wait: WAIT_CFG } }, rows, conditions: { ...CONDITIONS, sunset: '2026-10-04T01:30:00Z' } });
  assert.equal(out.courts.find((c) => c.id === 'courts').readings.wait.value, 'locked');
  assert.notEqual(out.best?.court, 'courts', 'a phone at the fence says the gate is locked');
  assert.doesNotMatch(out.best?.line ?? '', /MANHATTAN MIDDLE/);
});

test('bestBet: a live "No open court" skips the running drop-in there, and a report is never called "no reports yet"', () => {
  const now = Date.parse('2026-10-05T17:30:00-07:00'); // Mon, El Segundo's advanced drop-in 5–7 PM
  const booked = boardSummary({ now, courts: schedule.courts, kindCfg: { 'el-segundo': { wait: WAIT_CFG } }, rows: [onSite('ar_b', 'el-segundo', 'booked', now - 5 * 60_000, 'p1')], conditions: CONDITIONS });
  assert.notEqual(booked.best?.court, 'el-segundo', '"No open court" from a phone on site outranks the schedule');
  assert.doesNotMatch(booked.best?.line ?? '', /EL SEGUNDO REC/);

  const cant = boardSummary({ now, courts: schedule.courts, kindCfg: { 'el-segundo': { wait: WAIT_CFG } }, rows: [onSite('ar_c', 'el-segundo', 'cant', now - 5 * 60_000, 'p1')], conditions: CONDITIONS });
  assert.equal(cant.best.court, 'el-segundo');
  assert.equal(cant.best.line, "EL SEGUNDO REC · Advanced drop-in now until 7 PM · $5 · Can't say · 1 reporter", 'the line says what the phone said');

  const quiet = boardSummary({ now, courts: schedule.courts, conditions: CONDITIONS });
  assert.equal(quiet.best.line, 'EL SEGUNDO REC · Advanced drop-in now until 7 PM · $5 · no reports yet', 'only an empty board is "no reports yet"');
  assert.deepEqual(quiet.best.prov, { src: 'ES1', checked: '2026-09-28', confidence: 'verified' }, 'the hero can say where the drop-in came from');
});

test('bestBet: a taken court is skipped by the walk-on and next-session rules too; a partial block carries its tag', () => {
  const taken = { value: 'taken', label: 'Another sport on it', status: 'single', support: 1, ageMin: 3 };
  const walk = card('perry', { order: 1, short: 'PERRY PARK', walkOn: { key: 'walk-on', text: 'Free, first come', confidence: 'verified', checked: '2026-09-28', src: 'RB3' }, readings: { wait: taken } });
  const nextShut = card('alta-vista', { order: 2, short: 'ALTA VISTA', status: 'closed', readings: { wait: { ...taken, value: 'booked', label: 'No open court' } }, next: { block: { kind: 'dropin', label: 'Drop-in' }, when: 'today 5 PM', dayOffset: 0, startMin: 17 * 60 } });
  assert.equal(bestBet([walk, nextShut], Date.parse('2026-09-28T12:00:00-07:00')), null, 'nothing left once both shut courts are skipped');

  const partial = card('x', { order: 1, short: 'X', now: [{ block: { kind: 'dropin', label: 'Drop-in', fee: null, src: 'RB2', checked: '2026-09-28', confidence: 'partial' }, until: '2 PM' }] });
  assert.equal(bestBet([partial]).line, 'X · Drop-in now until 2 PM · unconfirmed · no reports yet');
});

test('qualityVibe: three phones on one network are one person, not a consensus (the crew\'s two-network guard)', () => {
  const now = Date.parse('2026-09-28T12:00:00-07:00');
  const oneNet = ['a', 'b', 'c'].map((pid, i) => ({ ...vibeRow('condemned', { pid, at: now - (i + 1) * 1000 }), ip_hash: 'same-wifi' }));
  assert.equal(qualityVibe(oneNet, now), null, 'three fresh device ids on one connection');
  const twoNets = oneNet.map((r, i) => (i === 2 ? { ...r, ip_hash: 'cellular' } : r));
  assert.equal(qualityVibe(twoNets, now).n, 3, 'a second network makes it a line');
  const signedIn = oneNet.map((r, i) => (i === 2 ? { ...r, user_id: 'u_1' } : r));
  assert.equal(qualityVibe(signedIn, now).n, 3, 'a signed-in phone is its own network, as for the crew');
});

test('publicReading: the open feed keeps the value and its strength, never who (no bylines, crew or reportId)', () => {
  const r = { value: '1-4', label: '1–4 in the rack', status: 'agree', support: 2, reportId: 'ar_1234567890abcdef', ageMin: 3, bars: 5, liveUntil: '2026-10-02T15:20:00Z', bylines: ['@alice', 'Guest 5028'], crew: { id: 'x', n: 3, at: 'y' } };
  assert.deepEqual(publicReading(r), { value: '1-4', label: '1–4 in the rack', status: 'agree', support: 2, ageMin: 3, bars: 5, liveUntil: '2026-10-02T15:20:00Z' });
  assert.equal(publicReading(null), null);
  assert.doesNotMatch(JSON.stringify(publicReading(r)), /alice|Guest|ar_/);
});

test('the Perry grid is partial now: its live lines carry the "unconfirmed" confidence through the payload', () => {
  const out = boardSummary({ now: Date.parse('2026-09-28T17:30:00-07:00'), courts: schedule.courts, conditions: CONDITIONS });
  const perry = out.courts.find((c) => c.id === 'perry');
  assert.ok(perry.now.length > 0);
  for (const s of perry.now) assert.equal(s.block.confidence, 'partial', `${s.block.label} is read off the flyer's image grid`);
});
