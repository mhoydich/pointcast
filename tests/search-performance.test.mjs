import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { measuredPages, rankPages } from '../src/lib/search-performance.mjs';

const snapshot = JSON.parse(readFileSync(new URL('../src/data/search-performance.json', import.meta.url), 'utf8'));
const period = { start: '2026-09-10', end: '2026-10-07' };
const page = (path, clicks, impressions, position) => ({ url: `https://pointcast.xyz/${path}/`, title: path, clicks, impressions, position });

test('public observation sample cannot masquerade as a ranking', () => {
  assert.equal(snapshot.status, 'awaiting-page-data');
  assert.deepEqual(snapshot.pages, []);
  assert.deepEqual(measuredPages(snapshot), []);
  assert.equal(snapshot.period, null);
  assert.equal(snapshot.milestone.reachedOn, '2026-10-07');
  assert.equal(snapshot.milestone.value, 5);
  for (const row of snapshot.observedPages) {
    assert.equal(new URL(row.url).origin, 'https://pointcast.xyz');
    assert.equal('position' in row || 'clicks' in row || 'impressions' in row, false);
  }
  assert.doesNotMatch(JSON.stringify(snapshot), /mail\.google|authuser|mhoydich@gmail|c\.gle|1a1254e7/);
});

test('a measured zero-click page is valid; missing metrics and missing period are not', () => {
  const rows = [page('zero', 0, 20, 8.2), page('missing', null, 20, 8), page('empty', 0, 0, 0), page('impossible', 30, 20, 8)];
  assert.equal(measuredPages({ period, pages: rows }).length, 1);
  assert.equal(measuredPages({ pages: rows }).length, 0);
  assert.equal(measuredPages({ period: { start: '2026-10-07', end: '2026-09-10' }, pages: rows }).length, 0);
});

test('traffic leaders and best average positions are distinct and deterministically sorted', () => {
  const report = { period, pages: [page('busy', 7, 100, 9.2), page('high', 2, 10, 1.5), page('wide', 4, 200, 20)] };
  assert.deepEqual(rankPages(report).map(r => r.title), ['busy', 'wide', 'high']);
  assert.deepEqual(rankPages(report, 'position').map(r => r.title), ['high', 'busy', 'wide']);
  assert.deepEqual(rankPages(report, 'impressions').map(r => r.title), ['wide', 'busy', 'high']);
  assert.equal(measuredPages({ period, pages: [{ ...page('unsafe', 1, 10, 2), url: 'javascript:alert(1)' }] }).length, 0);
});
