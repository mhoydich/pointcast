import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyBranches, parsePushPorcelain, planDeletions, summarize, toTsv } from '../scripts/lib/prune-branches.mjs';

const NOW = '2026-10-17T22:00:00Z';
const daysAgo = (d) => new Date(Date.parse(NOW) - d * 86_400_000).toISOString();
const hoursAgo = (h) => new Date(Date.parse(NOW) - h * 3_600_000).toISOString();

const pr = (over) => ({
  number: 1,
  state: 'closed',
  merged_at: null,
  closed_at: null,
  updated_at: daysAgo(40),
  head_ref: 'x',
  head_sha: 'aaaa',
  base_ref: 'main',
  ...over,
});

const branches = [
  { name: 'main', sha: 'm000' },
  { name: 'feat/open', sha: 'o111' },
  { name: 'feat/merged-exact', sha: 'e222' },
  { name: 'feat/merged-moved', sha: 'v333', committedAt: daysAgo(100) },
  { name: 'feat/merged-into-feature', sha: 'f444', committedAt: daysAgo(100) },
  { name: 'feat/closed-old', sha: 'c555', committedAt: daysAgo(120) },
  { name: 'feat/closed-young', sha: 'c666', committedAt: daysAgo(10) },
  { name: 'feat/orphan-old', sha: 'r777', committedAt: daysAgo(200) },
  { name: 'feat/orphan-undated', sha: 'r888', committedAt: null },
  { name: 'feat/merged-fresh', sha: 'g999' },
  { name: 'feat/merged-in-worktree', sha: 'w000' },
  { name: 'feat/merged-then-reopened', sha: 'q111' },
];

const pulls = [
  pr({ number: 10, state: 'open', head_ref: 'feat/open', head_sha: 'o111', updated_at: daysAgo(1) }),
  pr({ number: 11, head_ref: 'feat/merged-exact', head_sha: 'e222', merged_at: daysAgo(60), closed_at: daysAgo(60) }),
  pr({ number: 12, head_ref: 'feat/merged-moved', head_sha: 'old3', merged_at: daysAgo(110), closed_at: daysAgo(110) }),
  pr({ number: 13, head_ref: 'feat/merged-into-feature', head_sha: 'f444', base_ref: 'feat/parent', merged_at: daysAgo(90), closed_at: daysAgo(90) }),
  pr({ number: 14, head_ref: 'feat/closed-old', head_sha: 'c555', closed_at: daysAgo(100) }),
  pr({ number: 15, head_ref: 'feat/closed-young', head_sha: 'c666', closed_at: daysAgo(5) }),
  pr({ number: 16, head_ref: 'feat/merged-fresh', head_sha: 'g999', merged_at: hoursAgo(2), closed_at: hoursAgo(2) }),
  pr({ number: 17, head_ref: 'feat/merged-in-worktree', head_sha: 'w000', merged_at: daysAgo(50), closed_at: daysAgo(50) }),
  // merged once, then a second PR opened from the same branch and still open
  pr({ number: 18, head_ref: 'feat/merged-then-reopened', head_sha: 'q000', merged_at: daysAgo(30), closed_at: daysAgo(30) }),
  pr({ number: 19, state: 'open', head_ref: 'feat/merged-then-reopened', head_sha: 'q111', updated_at: daysAgo(2) }),
];

const rows = classifyBranches({
  branches,
  pulls,
  worktreeBranches: new Set(['feat/merged-in-worktree']),
  defaultBranch: 'main',
  now: NOW,
});
const byName = Object.fromEntries(rows.map((r) => [r.name, r]));

test('classifies every branch by its pull request record', () => {
  assert.equal(byName['main'].cls, 'protected');
  assert.equal(byName['feat/open'].cls, 'open-pr');
  assert.equal(byName['feat/merged-exact'].cls, 'merged');
  assert.equal(byName['feat/merged-exact'].pr, 11);
  assert.equal(byName['feat/merged-moved'].cls, 'merged-tip-moved');
  assert.equal(byName['feat/merged-into-feature'].cls, 'merged-elsewhere');
  assert.equal(byName['feat/merged-into-feature'].prBase, 'feat/parent');
  assert.equal(byName['feat/closed-old'].cls, 'closed-unmerged');
  assert.equal(byName['feat/orphan-old'].cls, 'orphan');
  assert.equal(byName['feat/orphan-undated'].cls, 'orphan');
  assert.equal(byName['feat/orphan-undated'].ageDays, null);
});

test('an open PR wins over an older merged PR from the same branch', () => {
  assert.equal(byName['feat/merged-then-reopened'].cls, 'open-pr');
  assert.equal(byName['feat/merged-then-reopened'].pr, 19);
});

test('merged branches date from the merge; closed ones from the later of close and last commit', () => {
  assert.equal(byName['feat/merged-exact'].ageDays, 60);
  assert.equal(byName['feat/closed-old'].ageDays, 100); // closed 100d ago, committed 120d ago
  assert.equal(byName['feat/closed-young'].ageDays, 5);
});

test('default plan deletes only exact merged branches that are not fresh or checked out', () => {
  const planned = planDeletions(rows, { now: NOW });
  const actions = Object.fromEntries(planned.map((r) => [r.name, r.action]));
  assert.equal(actions['feat/merged-exact'], 'delete');
  assert.equal(actions['main'], 'keep');
  assert.equal(actions['feat/open'], 'keep');
  assert.equal(actions['feat/merged-moved'], 'keep');
  assert.equal(actions['feat/merged-into-feature'], 'keep');
  assert.equal(actions['feat/closed-old'], 'keep');
  assert.equal(actions['feat/orphan-old'], 'keep');
  assert.equal(actions['feat/merged-then-reopened'], 'keep');

  const fresh = planned.find((r) => r.name === 'feat/merged-fresh');
  assert.equal(fresh.action, 'skip');
  assert.match(fresh.blockers.join(), /active within the last 24h/);

  const wt = planned.find((r) => r.name === 'feat/merged-in-worktree');
  assert.equal(wt.action, 'skip');
  assert.match(wt.blockers.join(), /local worktree/);

  assert.deepEqual(summarize(planned).byAction, { delete: 1, skip: 2, keep: 9 });
});

test('--include-closed and --older-than gate closed branches by idle time', () => {
  const planned = planDeletions(rows, { now: NOW, includeClosed: true, olderThanDays: 30 });
  const old = planned.find((r) => r.name === 'feat/closed-old');
  const young = planned.find((r) => r.name === 'feat/closed-young');
  assert.equal(old.action, 'delete');
  assert.equal(young.action, 'skip');
  assert.match(young.blockers.join(), /younger than --older-than=30/);
});

test('--include-orphans never deletes a branch whose last activity is unknown', () => {
  const planned = planDeletions(rows, { now: NOW, includeOrphans: true, olderThanDays: 90 });
  assert.equal(planned.find((r) => r.name === 'feat/orphan-old').action, 'delete');
  const undated = planned.find((r) => r.name === 'feat/orphan-undated');
  assert.equal(undated.action, 'skip');
  assert.match(undated.blockers.join(), /unknown/);
});

test('--include-elsewhere is the only way a PR merged into a feature branch is deleted', () => {
  assert.equal(planDeletions(rows, { now: NOW }).find((r) => r.name === 'feat/merged-into-feature').action, 'keep');
  assert.equal(planDeletions(rows, { now: NOW, includeElsewhere: true }).find((r) => r.name === 'feat/merged-into-feature').action, 'delete');
});

test('--limit caps deletions per run and marks the rest as skipped', () => {
  const planned = planDeletions(rows, { now: NOW, includeClosed: true, includeOrphans: true, olderThanDays: 30, limit: 1 });
  const deletes = planned.filter((r) => r.action === 'delete');
  assert.equal(deletes.length, 1);
  const over = planned.filter((r) => r.blockers.includes('over --limit'));
  assert.ok(over.length >= 1);
  assert.ok(over.every((r) => r.action === 'skip'));
});

test('a longer grace window holds a merge that is only days old', () => {
  const planned = planDeletions(rows, { now: NOW, graceHours: 24 * 90 });
  assert.equal(planned.find((r) => r.name === 'feat/merged-exact').action, 'skip');
});

test('tsv report has one row per branch with the action first', () => {
  const tsv = toTsv(planDeletions(rows, { now: NOW }));
  const lines = tsv.trim().split('\n');
  assert.equal(lines.length, branches.length + 1);
  assert.equal(lines[0].split('\t')[0], 'action');
  const exact = lines.find((l) => l.includes('feat/merged-exact'));
  assert.ok(exact.startsWith('delete\tmerged\tfeat/merged-exact\te222\t11\t'));
});

test('classifyBranches refuses to run without a clock', () => {
  assert.throws(() => classifyBranches({ branches: [], pulls: [] }), /now is required/);
  assert.throws(() => planDeletions([], {}), /now is required/);
});

test('push porcelain is read per ref, so a half-failed batch logs only what is gone', () => {
  const out = [
    'To github.com:mhoydich/pointcast',
    '-\t:refs/heads/feat/a\t[deleted]',
    '!\t:refs/heads/feat/b\t[rejected] (protected branch hook declined)',
    '-\t:refs/heads/feat/c\t[deleted]',
    '!\t:refs/heads/feat/d\t[remote rejected] (cannot lock ref)',
    'Done',
  ].join('\n');
  const { ok, failed } = parsePushPorcelain(out);
  assert.deepEqual(ok, ['feat/a', 'feat/c']);
  assert.deepEqual(failed.map((f) => f.name), ['feat/b', 'feat/d']);
  assert.match(failed[0].summary, /protected branch hook/);
  assert.deepEqual(parsePushPorcelain(''), { ok: [], failed: [] });
});
