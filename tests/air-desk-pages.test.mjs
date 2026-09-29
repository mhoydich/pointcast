import assert from 'node:assert/strict';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import schedule from '../src/data/courts-schedule.json' with { type: 'json' };
import { boardSummary, courtCall, deskKindOf } from '../functions/_lib/court-board.mjs';
import { callRowOf } from '../functions/_lib/air-desk.mjs';

// Early Shift + the Desk, group P (docs/plans/2026-09-28-early-shift-desk-spec.md
// §5 "P: Pages"): the Desk on the board — a court's one desk kind, its live
// call (courtCall()) and the beach facts (boardSummary's `desk`). The Astro
// pages and client scripts that read these (src/pages/r/desk.astro,
// src/pages/r/agent/[call].astro, src/components/air/DeskCall.astro,
// src/components/courts/{ConditionsStrip,CourtCard}.astro) are checked as
// source text (tests/court-board.test.mjs and tests/air-board-api.test.mjs
// already exercise boardSummary/boardData end to end); this file is the pure
// board-side logic those pages are built on.

const MIN = 60_000;
const HOUR = 60 * MIN;
const now = Date.parse('2026-10-02T14:40:00Z'); // Fri 7:40 AM LA

const beliefRow = (over = {}) => ({ value: 'lights', source_url: 'https://citymb.info', ...over });

test('deskKindOf: each of the three courts with a desk kind names it; a court without one is null', () => {
  assert.deepEqual(deskKindOf(config, 'el-segundo').kind, 'lights');
  assert.deepEqual(deskKindOf(config, 'manhattan-heights').kind, 'closes');
  assert.deepEqual(deskKindOf(config, 'courts').kind, 'sign');
  assert.equal(deskKindOf(config, 'kelly'), null, 'kelly (an air court) carries no desk kind');
  assert.equal(deskKindOf(config, 'no-such-court'), null);
  assert.equal(deskKindOf(null, 'el-segundo'), null, 'no config, no kind');
});

test('courtCall: the live call on a court\'s desk kind, its belief and source host', () => {
  const call = callRowOf(config, { id: 'ac_test000000000000001', agent: 'sol', spot: 'el-segundo', kind: 'lights', reportId: 'ar_belief00000000000001', now });
  const beliefs = new Map([[call.report_id, beliefRow()]]);
  const view = courtCall(config, 'el-segundo', [call], beliefs, now);
  assert.ok(view);
  assert.equal(view.agent, 'sol');
  assert.equal(view.spot, 'el-segundo');
  assert.equal(view.kind, 'lights');
  assert.equal(view.belief.value, 'lights');
  assert.equal(view.belief.label, 'Lights');
  assert.equal(view.sourceHost, 'citymb.info');
  assert.equal(view.status, 'open');
});

test('courtCall: null without a live call, without a belief row, past expiry, or on a court with no desk kind', () => {
  assert.equal(courtCall(config, 'kelly', [], new Map(), now), null, 'no desk kind on this court');
  const call = callRowOf(config, { id: 'ac_test000000000000002', agent: 'sol', spot: 'el-segundo', kind: 'lights', reportId: 'ar_belief00000000000002', now });
  assert.equal(courtCall(config, 'el-segundo', [call], new Map(), now), null, 'the belief row is missing');
  assert.equal(courtCall(config, 'el-segundo', [], new Map([[call.report_id, beliefRow()]]), now), null, 'no call at all');
  const expired = { ...call, expires_at: now - MIN };
  assert.equal(courtCall(config, 'el-segundo', [expired], new Map([[call.report_id, beliefRow()]]), now), null, 'past expiry');
  const answered = { ...call, status: 'answered' };
  assert.equal(courtCall(config, 'el-segundo', [answered], new Map([[call.report_id, beliefRow()]]), now), null, 'no longer open');
  const otherSpot = callRowOf(config, { id: 'ac_test000000000000003', agent: 'sol', spot: 'courts', kind: 'sign', reportId: 'ar_belief00000000000003', now });
  assert.equal(courtCall(config, 'el-segundo', [otherSpot], new Map([[otherSpot.report_id, beliefRow({ value: 'weekends' })]]), now), null, 'a call on another spot never fills this card');
});

test('boardSummary: BoardPayload.desk carries the beach\'s tide/swell/sun/air facts, never sky, and each court\'s call', () => {
  const call = callRowOf(config, { id: 'ac_test000000000000004', agent: 'sol', spot: 'el-segundo', kind: 'lights', reportId: 'ar_belief00000000000004', now });
  const beliefs = new Map([[call.report_id, beliefRow()]]);
  const deskRows = [{
    id: 'ar_swell0000000000000001', spot: 'beach', kind: 'swell', value: '2-3', extras_json: JSON.stringify({ ft: 2.4, periodS: 13, dirDeg: 210, waterF: 64, obsAt: '2026-10-02T14:00:00Z' }),
    schema_v: 2, observed_at: now - 10 * MIN, created_at: now - 10 * MIN, status: 'ok', source: 'agent:sol', source_url: 'https://www.ndbc.noaa.gov/data/realtime2/46221.txt',
  }];
  const out = boardSummary({ now, courts: schedule.courts, config, deskRows, calls: [call], beliefs, conditions: null });
  assert.equal(out.desk.swell.value, '2-3');
  assert.equal(out.desk.swell.agent, 'sol');
  assert.equal(out.desk.tides, null);
  assert.deepEqual(Object.keys(out.desk).sort(), ['air', 'sun', 'swell', 'tides']);
  const es = out.courts.find((c) => c.id === 'el-segundo');
  assert.ok(es.call);
  assert.equal(es.call.belief.value, 'lights');
  const courts = out.courts.find((c) => c.id === 'courts');
  assert.equal(courts.call, null, 'no live call on this spot');
});

test('boardSummary: without config, desk facts and calls are quietly absent (never a throw)', () => {
  const out = boardSummary({ now, courts: schedule.courts, conditions: null });
  assert.deepEqual(out.desk, { tides: null, swell: null, sun: null, air: null });
  for (const c of out.courts) assert.equal(c.call, null);
});
