import assert from 'node:assert/strict';
import test from 'node:test';

import schedule from '../src/data/courts-schedule.json' with { type: 'json' };
import { HOURS_CONFIDENCE, dropinOccurrences, hoursSourceOf, laOffset } from '../functions/_lib/courts-feed.mjs';

// /courts.json's hours confidence (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §7.8):
// hoursSourceOf is pure, so every branch is exercised here with literals,
// then once against the real schedule.

const SOURCES = {
  S1: { label: 'a city page', url: 'https://example.gov/hours' },
  LBL: { label: 'Mike said', url: null },
};
const hours = (over = {}) => ({ rules: [], else: 'closed', src: 'S1', checked: '2026-10-18', confidence: 'verified', ...over });

test('HOURS_CONFIDENCE is the four words an agent can branch on, frozen', () => {
  assert.deepEqual([...HOURS_CONFIDENCE], ['verified', 'posted-sign', 'reported', 'unknown']);
  assert.ok(Object.isFrozen(HOURS_CONFIDENCE));
});

test('no hours: no url, no date, unknown', () => {
  assert.deepEqual(hoursSourceOf({ hours: null }, SOURCES), { url: null, checked: null, confidence: 'unknown' });
  assert.deepEqual(hoursSourceOf({}, SOURCES), { url: null, checked: null, confidence: 'unknown' });
  assert.deepEqual(hoursSourceOf(null, SOURCES), { url: null, checked: null, confidence: 'unknown' });
});

test('verified hours: verified, with the source url and the checked date', () => {
  assert.deepEqual(hoursSourceOf({ hours: hours() }, SOURCES), { url: 'https://example.gov/hours', checked: '2026-10-18', confidence: 'verified' });
});

test('partial hours read as reported', () => {
  assert.deepEqual(hoursSourceOf({ hours: hours({ confidence: 'partial' }) }, SOURCES), { url: 'https://example.gov/hours', checked: '2026-10-18', confidence: 'reported' });
});

test('unverified hours keep their url and date but read unknown, even with evidence set', () => {
  assert.deepEqual(hoursSourceOf({ hours: hours({ confidence: 'unverified' }) }, SOURCES), { url: 'https://example.gov/hours', checked: '2026-10-18', confidence: 'unknown' });
  assert.equal(hoursSourceOf({ hours: hours({ confidence: 'unverified', evidence: 'posted-sign' }) }, SOURCES).confidence, 'unknown');
});

test('hours.evidence wins over the confidence when it is posted-sign or reported', () => {
  assert.equal(hoursSourceOf({ hours: hours({ evidence: 'posted-sign' }) }, SOURCES).confidence, 'posted-sign');
  assert.equal(hoursSourceOf({ hours: hours({ evidence: 'reported' }) }, SOURCES).confidence, 'reported');
  assert.equal(hoursSourceOf({ hours: hours({ confidence: 'partial', evidence: 'posted-sign' }) }, SOURCES).confidence, 'posted-sign');
  assert.equal(hoursSourceOf({ hours: hours({ evidence: 'rumor' }) }, SOURCES).confidence, 'verified', 'an unknown evidence word is ignored');
});

test('a label source or a missing source has no url', () => {
  assert.equal(hoursSourceOf({ hours: hours({ src: 'LBL' }) }, SOURCES).url, null);
  assert.equal(hoursSourceOf({ hours: hours({ src: 'NOPE' }) }, SOURCES).url, null);
  assert.equal(hoursSourceOf({ hours: hours({ src: 'toString' }) }, SOURCES).url, null, 'prototype keys are not sources');
  assert.equal(hoursSourceOf({ hours: hours() }, undefined).url, null);
});

test('the real schedule: every court and private entry gets one of the four words', () => {
  const by = Object.fromEntries([...schedule.courts, ...schedule.private].map((c) => [c.id, hoursSourceOf(c, schedule.sources)]));
  for (const [id, h] of Object.entries(by)) assert.ok(HOURS_CONFIDENCE.includes(h.confidence), id);
  assert.deepEqual(by.kelly, { url: schedule.sources.HB1.url, checked: '2026-10-18', confidence: 'verified' });
  assert.deepEqual(by['el-segundo'], { url: schedule.sources.ES2.url, checked: '2026-10-18', confidence: 'verified' });
  assert.equal(by['manhattan-heights'].confidence, 'reported', 'the city page contradicts itself');
  assert.equal(by['alta-vista'].confidence, 'reported', "the center's hours, with the fee sheet's later slot");
  assert.deepEqual(by.perry, { url: null, checked: null, confidence: 'unknown' }, 'blocks are verified; no hours object');
  assert.equal(by['california-smash'].confidence, 'verified');
  assert.equal(by['love-life'].confidence, 'unknown');
  assert.equal(by.westdrift.confidence, 'unknown');
});

test('functions/courts.json.ts adds hours_source to every court and every private entry, and keeps what v1 returned', async () => {
  const { readFile } = await import('node:fs/promises');
  const src = await readFile(new URL('../functions/courts.json.ts', import.meta.url), 'utf8');
  assert.match(src, /import \{ hoursSourceOf \} from '\.\/_lib\/courts-feed\.mjs'/);
  assert.equal((src.match(/hours_source: hoursSourceOf\((c|p), COURT_SOURCES, now\)/g) ?? []).length, 2);
  assert.match(src, /hours_source: hoursSourceOf\(c, COURT_SOURCES, now\),\s+walkOn:/, 'on courts[]');
  assert.match(src, /hours_source: hoursSourceOf\(p, COURT_SOURCES, now\),\s+reserve:/, 'on private[]');
  for (const kept of ['hours: shapeHours(c.hours, now)', 'walkOn: shapeFact(c.walkOn, now)', 'live: live.get(c.id) ?? null', 'sources: COURT_SOURCES', 'hours: shapeHours(p.hours, now)']) assert.ok(src.includes(kept), kept);
  assert.doesNotMatch(src, /pid_hash|ip_hash/);
});

/* ---------- the dated occurrences the /pickleball JSON-LD publishes (§7.9) ---------- */

test('laOffset: -07:00 through Oct 31, -08:00 from Nov 1, and back to -07:00 on Mar 14 2027', () => {
  assert.equal(laOffset('2026-10-31'), '-07:00');
  assert.equal(laOffset('2026-11-01'), '-08:00');
  assert.equal(laOffset('2026-12-25'), '-08:00');
  assert.equal(laOffset('2027-03-13'), '-08:00');
  assert.equal(laOffset('2027-03-14'), '-07:00');
  assert.equal(laOffset('2026-03-08'), '-07:00');
  assert.equal(laOffset('2026-07-04'), '-07:00');
  assert.throws(() => laOffset('Oct 31'));
});

test('dropinOccurrences: matching weekdays inside the season, with that date\'s offset on both sides of Nov 1', () => {
  const block = { days: [0, 6], start: '09:00', end: '12:00', from: null, until: null };
  const out = dropinOccurrences(block, '2026-10-28', 14);
  assert.deepEqual(out.map((o) => o.start), [
    '2026-10-31T09:00:00-07:00', '2026-11-01T09:00:00-08:00', '2026-11-07T09:00:00-08:00', '2026-11-08T09:00:00-08:00',
  ]);
  assert.deepEqual(out[1], { date: '2026-11-01', start: '2026-11-01T09:00:00-08:00', end: '2026-11-01T12:00:00-08:00' });
});

test('dropinOccurrences: never a date outside from..until, and none once the block is over', () => {
  const block = { days: [0, 6], start: '09:00', end: '12:00', from: '2026-09-05', until: '2026-10-31' };
  assert.deepEqual(dropinOccurrences(block, '2026-10-18', 14).map((o) => o.date), ['2026-10-18', '2026-10-24', '2026-10-25', '2026-10-31']);
  assert.deepEqual(dropinOccurrences(block, '2026-11-01', 14), [], 'the build day is past until');
  assert.deepEqual(dropinOccurrences({ ...block, from: '2026-11-07', until: null }, '2026-10-28', 14).map((o) => o.date), ['2026-11-07', '2026-11-08']);
  assert.deepEqual(dropinOccurrences({ ...block, from: '2026-12-01', until: '2027-03-31' }, '2026-10-18', 14), [], 'a season that has not started');
});

test('dropinOccurrences: 14 days counts the build day; bad input gives nothing', () => {
  const daily = { days: [0, 1, 2, 3, 4, 5, 6], start: '08:00', end: '09:00', from: null, until: null };
  const out = dropinOccurrences(daily, '2026-10-18');
  assert.equal(out.length, 14);
  assert.equal(out[0].date, '2026-10-18');
  assert.equal(out[13].date, '2026-10-31');
  assert.deepEqual(dropinOccurrences(null, '2026-10-18'), []);
  assert.deepEqual(dropinOccurrences(daily, 'soon'), []);
  assert.deepEqual(dropinOccurrences({ ...daily, start: '8am' }, '2026-10-18'), []);
});

test('hoursSourceOf: with a clock, hours checked 45+ LA days ago carry stale: true, the board\'s "may have changed" line', () => {
  const h = { hours: hours({ checked: '2026-09-28' }) };
  assert.equal(hoursSourceOf(h, SOURCES, Date.parse('2026-11-11T12:00:00-08:00')).stale, undefined, 'day 44');
  assert.deepEqual(hoursSourceOf(h, SOURCES, Date.parse('2026-11-12T12:00:00-08:00')), { url: 'https://example.gov/hours', checked: '2026-09-28', confidence: 'verified', stale: true }, 'day 45');
  assert.equal(hoursSourceOf({ hours: hours({ checked: '2026-09-28', confidence: 'unverified' }) }, SOURCES, Date.parse('2027-01-01T12:00:00Z')).stale, undefined, 'unknown is never stale');
  assert.equal(hoursSourceOf(h, SOURCES).stale, undefined, 'without a clock, as before');
});
