import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { aggregate, parseReport } from '../functions/_lib/paddle-wear.mjs';

const root = new URL('../', import.meta.url);
const src = await readFile(new URL('functions/api/paddles/wear.ts', root), 'utf8');

test('wear reports: hard-range validation rejects, never repairs', () => {
  const ok = parseReport({ paddleId: 'six-zero-coral-pro', hours: 62.4, sessions: 41, months: 5.6, fadeAt: 38, deadAt: null, rating: 4 });
  assert.equal(ok.paddleId, 'six-zero-coral-pro');
  assert.deepEqual(ok.report, { hours: 62.5, sessions: 41, months: 6, fadeAt: 38, deadAt: null, rating: 4 });
  assert.equal(parseReport({ paddleId: 'Bad Id', hours: 10, sessions: 5, months: 1 }).reason, 'bad-paddle');
  assert.equal(parseReport({ paddleId: 'x', hours: 0, sessions: 5, months: 1 }).reason, 'bad-hours');
  assert.equal(parseReport({ paddleId: 'x', hours: 100, sessions: 2, months: 1 }).reason, 'bad-hours', 'fifty hours a session is not a session');
  assert.equal(parseReport({ paddleId: 'x', hours: 10, sessions: 5.5, months: 1 }).reason, 'bad-sessions');
  assert.equal(parseReport({ paddleId: 'x', hours: 10, sessions: 5, months: 1, fadeAt: 12 }).reason, 'bad-fade', 'fade after the last hour logged');
  assert.equal(parseReport({ paddleId: 'x', hours: 10, sessions: 5, months: 1, rating: 4.25 }).reason, 'bad-rating');
  assert.equal(parseReport({ paddleId: 'x', hours: '10', sessions: 5, months: 1 }).reason, 'bad-hours', 'strings are not numbers');
});

test('wear reports: aggregates only above the floor, never raw rows', () => {
  const r = (hours, fadeAt = null, deadAt = null, rating = null) => ({ t: 1, hours, sessions: 10, months: 3, fadeAt, deadAt, rating, pid: 'p' });
  assert.equal(aggregate([r(10), r(20)]), null);
  const a = aggregate([r(10, 5, null, 4), r(20, 12, 18, 4), r(30, 25, null, 3.5), r(40)]);
  assert.equal(a.n, 4);
  assert.equal(a.medianHours, 25);
  assert.deepEqual(a.fade, { n: 3, medianHours: 12 });
  assert.deepEqual(a.dead, { n: 1, medianHours: 18, share: 0.25 });
  assert.deepEqual(a.ratings, { '4.0': 2, '3.5': 1 });
  assert.ok(!('reports' in a) && !('pid' in a));
});

test('wear API source contract: KV pattern, IP budget, session replace, no raw rows in GET', () => {
  assert.match(src, /cf-connecting-ip/);
  assert.match(src, /IP_BUDGET_PER_WINDOW/);
  assert.match(src, /wall\.reports\.filter\(\(r\) => r\.pid !== pid\)/, 'a resend replaces the session\'s earlier report');
  assert.match(src, /Never returns raw reports/);
  assert.doesNotMatch(src.slice(src.indexOf('onRequestGet')), /reports: wall\.reports/);
});
