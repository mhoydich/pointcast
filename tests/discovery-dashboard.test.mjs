import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, filteredCsv, matchesFilters, snapshotAge, sortFindings, isBotRequest, botHttpLabel, isActionable } from '../src/lib/discovery-dashboard.mjs';

test('combined filters match status, category, route evidence, and actionability', () => {
  const finding = { category: 'agents', status: 'warn', evidence: [{ url: 'https://pointcast.xyz/for-agents' }] };
  assert.equal(matchesFilters(finding, { category: 'agents', status: 'warn', query: ' FOR-AGENTS ', actionable: true }), true);
  assert.equal(matchesFilters(finding, { category: 'seo' }), false);
  assert.equal(matchesFilters({ ...finding, status: 'expected' }, { actionable: true }), false);
});

test('CSV exports only filtered records and preserves evidence text safely', () => {
  const audit = { completedAt: '2026-10-03T10:00:00Z', findings: [
    { id: 'needs-reading', category: 'agents', status: 'warn', severity: 'high', title: '=formula', evidence: [{ url: 'https://pointcast.xyz/for-agents', observed: 'Line one\n"Line two"' }], recommendation: 'Read it.' },
    { id: 'seo-pass', category: 'seo', status: 'pass', severity: 'info', title: 'Title present', evidence: [] },
  ], routes: [{ path: '/for-agents', category: 'agents', status: 'pass', httpStatus: 200 }], botChecks: [] };
  const csv = filteredCsv(audit, { category: 'agents', actionable: true });
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('needs-reading'));
  assert.ok(csv.includes('"\'=formula"'));
  assert.ok(csv.includes('Line one\n""Line two""'));
  assert.equal(csv.includes('seo-pass'), false);
  assert.equal(csv.includes('"route"'), false);
  assert.equal(csvCell(' \t@SUM(A1)'), '"\' \t@SUM(A1)"');
});

test('snapshot age is deterministic, marks seven-day stale snapshots, and clamps future clocks', () => {
  const date = '2026-10-03T10:00:00Z';
  assert.deepEqual(snapshotAge(date, Date.parse('2026-10-03T20:00:00Z')), { label: 'Checked today', stale: false });
  assert.deepEqual(snapshotAge(date, Date.parse('2026-10-10T10:00:00Z')), { label: '7 days since check', stale: true });
  assert.equal(snapshotAge(date, Date.parse('2026-10-02T10:00:00Z')).label, 'Checked today');
  assert.equal(snapshotAge('bad timestamp').stale, true);
});

test('priority ordering does not mutate evidence snapshot or scramble equal priorities', () => {
  const findings = [{ id: 'low', severity: 'low' }, { id: 'a', severity: 'high' }, { id: 'b', severity: 'high' }];
  assert.deepEqual(sortFindings(findings).map((finding) => finding.id), ['a', 'b', 'low']);
  assert.equal(findings[0].id, 'low');
});

test('failed synthetic requests stay distinct from policy-only tokens in counts and CSV', () => {
  const failed = { userAgent: 'Googlebot/1.0', httpStatus: 0, path: '/', status: 'fail', name: 'Googlebot' };
  const policy = { userAgent: null, httpStatus: null, path: '/', status: 'pass', name: 'Google-Extended' };
  assert.equal(isBotRequest(failed), true);
  assert.equal(isBotRequest(policy), false);
  assert.equal(botHttpLabel(failed), 'No response');
  assert.equal(botHttpLabel(policy), 'Not sent');
  const csv = filteredCsv({ site: 'https://example.com/', findings: [], routes: [], botChecks: [failed, policy] });
  assert.ok(csv.includes('"bot probe","/","bots","fail","No response"'));
  assert.ok(csv.includes('"bot policy","/","bots","pass","Not sent"'));
  assert.ok(csv.includes('"https://example.com/"'));
});

test('actionable filters exclude aggregate observations and preserve route/bot issues without severity', () => {
  const aggregate = { id: 'aggregate', category: 'agents', status: 'warn', severity: 'info', title: 'Discovery overview', evidence: [] };
  const specific = { id: 'plugin-defect', category: 'agents', status: 'fail', severity: 'medium', title: 'Plugin contract defect', evidence: [] };
  const route = { path: '/plugin', category: 'agents', status: 'warn', httpStatus: 200 };
  const bot = { name: 'Googlebot', path: '/', userAgent: 'Googlebot/1.0', status: 'fail', httpStatus: 0 };
  assert.equal(isActionable(aggregate), false);
  assert.equal(matchesFilters(aggregate, { actionable: true }), false);
  assert.equal(matchesFilters(aggregate, { status: 'warn' }), true);
  assert.equal(isActionable(specific), true);
  assert.equal(isActionable(route), true);
  assert.equal(isActionable(bot), true);
  const csv = filteredCsv({ findings: [aggregate, specific], routes: [route], botChecks: [bot] }, { actionable: true });
  assert.equal(csv.includes('aggregate'), false);
  assert.ok(csv.includes('plugin-defect'));
  assert.ok(csv.includes('"route","/plugin"'));
  assert.ok(csv.includes('"bot probe"'));
});
