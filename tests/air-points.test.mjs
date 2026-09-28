import assert from 'node:assert/strict';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import {
  applyCap, badgeStamp, badgesFor, BADGES, bylineAwards, capUnits, confirmAwards, crewStamp, DAILY_CAP, dayStamp,
  firstLightOpen, firstLightRef, placeStamp, POINTS, RECEIPT_ORDER, receiptStamps, reportAwards, stampText, stampTraits,
  STILL_TRUE_AT, UNRATED_TRAITS,
} from '../functions/_lib/air-points.mjs';

const MIN = 60_000;
const T0 = Date.parse('2026-10-02T14:36:00Z'); // Fri 7:36 AM in El Segundo
const courts = (over = {}) => ({ spot: 'courts', kind: 'wait', value: '1-4', onsite: true, observedAt: T0, decayMin: 45, ...over });
const units = (awards) => awards.reduce((s, a) => s + a.units, 0);

test('points: the price list', () => {
  assert.deepEqual({ ...POINTS }, { report: 6, 'first-light': 4, confirm: 3, cant: 1, byline: 10 });
  assert.equal(DAILY_CAP, 30);
  assert.equal(STILL_TRUE_AT, 10);
  assert.deepEqual(reportAwards(courts()), [{ action: 'report', ref: 'courts:wait:2026-10-02:10', units: 6, day: '2026-10-02' }]);
  assert.deepEqual(confirmAwards({ reportId: 'ar_1', verdict: 'still', onsite: true, at: T0 }), [{ action: 'confirm', ref: 'ar_1', units: 3, day: '2026-10-02' }]);
  assert.equal(units(confirmAwards({ reportId: 'ar_1', verdict: 'changed', onsite: true, at: T0 })), 3);
  assert.deepEqual(confirmAwards({ reportId: 'ar_1', verdict: 'cant', onsite: true, at: T0 }), [{ action: 'cant', ref: 'ar_1', units: 1, day: '2026-10-02' }]);
});

test('points: first light pays once per spot per day', () => {
  const first = reportAwards(courts({ firstLight: true }));
  assert.deepEqual(first.map((a) => [a.action, a.ref, a.units]), [['report', 'courts:wait:2026-10-02:10', 6], ['first-light', 'courts:2026-10-02', 4]]);
  assert.equal(units(first), 10);
  const later = reportAwards(courts({ firstLight: true, observedAt: T0 + 3 * 60 * MIN }));
  assert.equal(later.find((a) => a.action === 'first-light').ref, firstLightRef('courts', '2026-10-02'), 'same ref all day, so UNIQUE(owner, action, ref) pays it once');
  assert.notEqual(later[0].ref, first[0].ref, 'a later window is a new report award');
  assert.equal(reportAwards(courts({ firstLight: false })).length, 1);
  assert.deepEqual(reportAwards(courts({ firstLight: true, onsite: false })), [], 'first light is on site only');
  assert.notEqual(firstLightRef('beach', '2026-10-02'), firstLightRef('courts', '2026-10-02'));
});

test('points: the cap stops at 30', () => {
  assert.equal(capUnits(6, 0), 6);
  assert.equal(capUnits(6, 26), 4);
  assert.equal(capUnits(6, 30), 0);
  assert.equal(capUnits(6, 34), 0, 'never negative');
  const { awards, total } = applyCap(reportAwards(courts({ firstLight: true })), 22);
  assert.deepEqual(awards.map((a) => a.units), [6, 2]);
  assert.equal(total, 8);
  let spent = 0;
  for (let i = 0; i < 9; i++) spent += applyCap(confirmAwards({ reportId: `ar_${i}`, verdict: 'still', onsite: true, at: T0 }), spent).total;
  assert.equal(spent, 27);
  spent += applyCap(reportAwards(courts()), spent).total;
  assert.equal(spent, 30);
  assert.equal(applyCap(bylineAwards('2026-10-02'), spent).total, 0);
});

test('points: remote pays 0 and "can\'t say" pays 1', () => {
  assert.deepEqual(reportAwards(courts({ onsite: false })), []);
  assert.deepEqual(reportAwards(courts({ onsite: 0 })), []);
  assert.deepEqual(confirmAwards({ reportId: 'ar_1', verdict: 'still', onsite: false, at: T0 }), []);
  const cant = reportAwards(courts({ value: 'cant' }));
  assert.deepEqual(cant, [{ action: 'cant', ref: 'courts:wait:2026-10-02:10', units: 1, day: '2026-10-02' }]);
});

test('points: "0" and "5+" award identical units', () => {
  for (const firstLight of [false, true]) {
    const zero = reportAwards(courts({ value: '0', firstLight }));
    const many = reportAwards(courts({ value: '5+', firstLight }));
    assert.deepEqual(zero, many);
  }
  const beach = (value) => reportAwards({ spot: 'beach', kind: 'fog', value, onsite: true, observedAt: T0, decayMin: 120 });
  assert.deepEqual(beach('clear'), beach('none'));
});

test('points: the byline pays 10', () => {
  assert.deepEqual(bylineAwards('2026-10-03'), [{ action: 'byline', ref: 'morning:2026-10-03', units: 10, day: '2026-10-03' }]);
});

test('badges: first light, morning crew, still true, byline', () => {
  assert.deepEqual(badgesFor({}), []);
  assert.deepEqual(badgesFor({ firstLight: true }), ['first-light']);
  assert.deepEqual(badgesFor({ crewMember: true }), ['morning-crew']);
  assert.deepEqual(badgesFor({ onsiteConfirmsGiven: 9 }), []);
  assert.deepEqual(badgesFor({ onsiteConfirmsGiven: 10 }), ['still-true']);
  assert.deepEqual(badgesFor({ byline: true }), ['byline']);
  for (const id of ['first-light', 'morning-crew', 'still-true', 'byline']) assert.ok(BADGES[id].label, id);
});

test('stamps: rows and printed text', () => {
  assert.deepEqual(placeStamp('courts', '2026-10-02'), { kind: 'place', ref: 'courts', day: '2026-10-02' });
  assert.deepEqual(crewStamp('courts', '2026-10-02'), { kind: 'crew', ref: 'courts', day: '2026-10-02' });
  assert.deepEqual(badgeStamp('first-light'), { kind: 'badge', ref: 'first-light', day: '-' });
  assert.equal(dayStamp('2026-10-02'), 'FRI 02 OCT 2026');
  assert.equal(stampText(placeStamp('courts', '2026-10-02'), 'COURTS'), 'COURTS · FRI 02 OCT 2026');
  assert.equal(stampText(crewStamp('courts', '2026-10-02'), 'COURTS'), 'MORNING CREW · COURTS · FRI 02 OCT 2026');
  assert.equal(stampText(badgeStamp('first-light'), 'COURTS'), 'FIRST LIGHT');
});

test('stamps: every stamp records its traits for a future rarity rating', () => {
  const traits = stampTraits({ spot: 'courts', kind: 'wait', answer: '1-4', observedAt: T0, firstLight: true, prevOnsiteAt: T0 - 50 * 60 * MIN });
  assert.deepEqual(traits, { spot: 'courts', kind: 'wait', weekday: 5, hour: 7, crewSize: null, firstLight: true, deadAirHours: 50, geo: false, answer: '1-4' });
  assert.deepEqual(Object.keys(traits), ['spot', 'kind', 'weekday', 'hour', 'crewSize', 'firstLight', 'deadAirHours', 'geo', 'answer']);
  const crew = stampTraits({ spot: 'courts', kind: 'wait', answer: '1-4', observedAt: T0 + 3 * MIN, crewSize: 3 });
  assert.equal(crew.crewSize, 3);
  assert.equal(crew.firstLight, false);
  assert.equal(crew.deadAirHours, null, 'no earlier on-site report at the spot');
  const lateNight = stampTraits({ spot: 'beach', kind: 'fog', answer: 'none', observedAt: Date.parse('2026-10-05T06:30:00Z'), prevOnsiteAt: Date.parse('2026-10-05T06:00:00Z') });
  assert.equal(lateNight.weekday, 0, 'Sunday night in El Segundo, Monday in UTC');
  assert.equal(lateNight.hour, 23);
  assert.equal(lateNight.deadAirHours, 0);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(traits)), 'meta_json is valid JSON');
});

/* ---------- critic revision, PR 1: open hours, the two-stamp receipt, the rarity guard ---------- */

const spot = (id) => config.spots.find((s) => s.id === id);
const la = (iso) => Date.parse(iso); // El Segundo is UTC-7 in October

test('first light: only inside the spot\'s open hours, and never for "can\'t say"', () => {
  const at = (iso, value = '1-4') => firstLightOpen({ spot: spot('courts'), value, observedAt: la(iso) });
  assert.equal(at('2026-10-02T07:01:00Z'), false, '00:01 from bed never opens the day');
  assert.equal(at('2026-10-02T12:59:00Z'), false, '05:59, a minute before the courts open');
  assert.equal(at('2026-10-02T13:05:00Z'), true, '06:05 does');
  assert.equal(at('2026-10-02T13:05:00Z', 'cant'), false);
  assert.equal(at('2026-10-03T04:59:00Z'), true, '21:59');
  assert.equal(at('2026-10-03T05:00:00Z'), false, '22:00 is closed');
  const beach = (iso) => firstLightOpen({ spot: spot('beach'), value: 'hazy', observedAt: la(iso) });
  assert.equal(beach('2026-10-02T12:30:00Z'), true, 'the beach opens at 05:30');
  assert.equal(beach('2026-10-03T03:30:00Z'), false, 'and closes at 20:30');
  assert.equal(firstLightOpen({ spot: { id: 'nowhere' }, value: '0', observedAt: T0 }), false, 'no hours, no first light');
  // Outside hours the report still pays its 6; only the +4 depends on first light.
  assert.deepEqual(reportAwards(courts({ observedAt: la('2026-10-02T07:01:00Z'), firstLight: false })).map((a) => [a.action, a.units]), [['report', 6]]);
  assert.match(BADGES['first-light'].rule, /open hours/);
});

test('receipt: two stamps at most, the place and the highest new badge; the rest are counted', () => {
  const place = (fresh = true) => ({ ...placeStamp('courts', '2026-10-02'), fresh });
  const crew = (fresh = true) => ({ ...crewStamp('courts', '2026-10-02'), fresh });
  const badge = (id, fresh = true) => ({ ...badgeStamp(id), fresh });
  const pick = (held) => { const r = receiptStamps(held); return { slam: r.slam.map((s) => `${s.kind}:${s.ref}`), more: r.more }; };
  assert.deepEqual([...RECEIPT_ORDER], ['morning-crew', 'first-light', 'still-true', 'place']);

  assert.deepEqual(pick([place(), badge('first-light')]), { slam: ['place:courts', 'badge:first-light'], more: 0 });
  // A Friday report that opens the day and completes the first crew ever writes four stamps and slams two.
  assert.deepEqual(pick([place(), badge('first-light'), crew(), badge('morning-crew')]), { slam: ['place:courts', 'crew:courts'], more: 2 });
  assert.deepEqual(pick([place(), badge('morning-crew'), badge('first-light')]), { slam: ['place:courts', 'badge:morning-crew'], more: 1 }, 'morning crew outranks first light');
  assert.deepEqual(pick([place(), badge('still-true'), badge('first-light')]), { slam: ['place:courts', 'badge:first-light'], more: 1 }, 'first light outranks still true');
  // A tenth confirm that joins a crew: the place was already held today, the crew badge long ago.
  assert.deepEqual(pick([place(false), badge('still-true'), crew(), badge('morning-crew', false)]), { slam: ['place:courts', 'crew:courts'], more: 1 });
  assert.deepEqual(pick([place(false), badge('still-true')]), { slam: ['place:courts', 'badge:still-true'], more: 0 });
  assert.deepEqual(pick([place(false), crew(false)]), { slam: ['place:courts'], more: 0 }, 'nothing new: the place stamp alone');
  assert.deepEqual(pick([badge('first-light')]), { slam: ['badge:first-light'], more: 0 }, 'a first light taken by a paid row');
  assert.deepEqual(pick([]), { slam: [], more: 0 });
  // Every stamp is still there to write: the cap is display only.
  const held = [place(), badge('first-light'), crew(), badge('morning-crew')];
  receiptStamps(held);
  assert.equal(held.length, 4);
});

test('rarity guard: the reporter\'s answer is namespaced and never a rated trait', () => {
  assert.deepEqual([...UNRATED_TRAITS], ['answer']);
  assert.ok(Object.isFrozen(UNRATED_TRAITS));
  const t = stampTraits({ spot: 'courts', kind: 'wait', answer: '5+', observedAt: T0, crewSize: 3 });
  assert.equal(t.answer, '5+');
  assert.equal('value' in t, false, 'no bare value key a rating could pick up');
  assert.equal(t.geo, false, 'no geo tick until PR 3');
  const rated = Object.keys(t).filter((k) => !UNRATED_TRAITS.includes(k));
  assert.deepEqual(rated, ['spot', 'kind', 'weekday', 'hour', 'crewSize', 'firstLight', 'deadAirHours', 'geo']);
  // Two stamps that differ only in what was said carry identical rated traits.
  const zero = stampTraits({ spot: 'courts', kind: 'wait', answer: '0', observedAt: T0 });
  const many = stampTraits({ spot: 'courts', kind: 'wait', answer: '5+', observedAt: T0 });
  assert.deepEqual(rated.map((k) => zero[k]), rated.map((k) => many[k]));
});
