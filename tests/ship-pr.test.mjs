import test from 'node:test';
import assert from 'node:assert/strict';
import { CODEX_LOGIN, eligible, codexVerdict, checksVerdict, labelVerdict, touchesWorkflows, decide } from '../scripts/ship-pr.mjs';

const head = 'a'.repeat(40);
const older = 'b'.repeat(40);

test('only open, same-repo PRs to main with the ship label are eligible', () => {
  assert.equal(eligible({ labels: ['ship'] }), 'ok');
  assert.equal(eligible({ labels: [] }), 'no-ship-label');
  assert.equal(eligible({ labels: ['ship'], draft: true }), 'not-open');
  assert.equal(eligible({ labels: ['ship', 'hold'] }), 'hold');
  assert.equal(eligible({ labels: ['ship'], body: 'Notes\nPublish: hold\n' }), 'hold');
  assert.equal(eligible({ labels: ['ship'], sameRepo: false }), 'fork');
  assert.equal(eligible({ labels: ['ship'], baseRef: 'blocks-rebuild' }), 'not-main');
});

test('Codex must review the exact head commit', () => {
  const reviews = [{ id: 1, user: CODEX_LOGIN, commit_id: older, body: 'Codex Review' }];
  assert.equal(codexVerdict({ headSha: head, reviews }), 'missing', 'a review of an older commit does not count');
  assert.equal(codexVerdict({ headSha: head, reviews: [{ id: 2, user: 'mhoydich', commit_id: head, body: 'lgtm' }] }), 'missing', 'only Codex counts');
  assert.equal(codexVerdict({ headSha: head, reviews: [{ id: 3, user: CODEX_LOGIN, commit_id: head, body: 'Codex Review: suggestions' }] }), 'clean');
});

test('a P0 or P1 finding blocks; P2 does not', () => {
  const reviews = [{ id: 7, user: CODEX_LOGIN, commit_id: head, body: 'Codex Review: here are some suggestions' }];
  const p1 = [{ pull_request_review_id: 7, user: CODEX_LOGIN, body: '**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  Guard the key' }];
  const p2 = [{ pull_request_review_id: 7, user: CODEX_LOGIN, body: '**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Nit' }];
  assert.equal(codexVerdict({ headSha: head, reviews, comments: p1 }), 'blocking');
  assert.equal(codexVerdict({ headSha: head, reviews, comments: p2 }), 'clean');
});

test('a "no major issues" comment counts only when it names the head commit', () => {
  const said = body => [{ user: CODEX_LOGIN, body, created_at: '2026-11-02T12:05:00Z' }];
  assert.equal(codexVerdict({ headSha: head, issueComments: said(`Codex Review: Didn't find any major issues.\nReviewed commit: \`${head.slice(0, 10)}\``) }), 'clean');
  assert.equal(codexVerdict({ headSha: head, issueComments: said(`Codex Review: Didn't find any major issues.\nReviewed commit: \`${older.slice(0, 10)}\``) }), 'missing', 'a clean review of an older commit does not carry over');
  assert.equal(codexVerdict({ headSha: head, issueComments: said("Codex Review: Didn't find any major issues.") }), 'missing', 'no commit named, no proof');
  assert.equal(codexVerdict({ headSha: head, issueComments: [{ user: 'mhoydich', body: `Didn't find any major issues ${head}`, created_at: '2026-11-02T12:05:00Z' }] }), 'missing', 'a person typing it is not Codex');
});

test('checks: running or red blocks, skipped and neutral pass, own job ignored', () => {
  assert.equal(checksVerdict({ checkRuns: [] }), 'success');
  assert.equal(checksVerdict({ checkRuns: [{ name: 'build', status: 'completed', conclusion: 'success' }, { name: 'x', status: 'completed', conclusion: 'skipped' }] }), 'success');
  assert.equal(checksVerdict({ checkRuns: [{ name: 'build', status: 'in_progress', conclusion: null }] }), 'pending');
  assert.equal(checksVerdict({ checkRuns: [{ name: 'build', status: 'completed', conclusion: 'failure' }] }), 'failure');
  assert.equal(checksVerdict({ checkRuns: [{ name: 'ship', status: 'in_progress', conclusion: null }], ignore: ['ship'] }), 'success');
  assert.equal(checksVerdict({ checkRuns: [], required: ['pr-check'] }), 'pending', 'no build yet is not a pass');
  assert.equal(checksVerdict({ checkRuns: [{ name: 'pr-check', status: 'completed', conclusion: 'success' }], required: ['pr-check'] }), 'success');
  assert.equal(checksVerdict({ statuses: [{ context: 'ci', state: 'pending' }] }), 'pending');
  assert.equal(checksVerdict({ statuses: [{ context: 'ci', state: 'error' }] }), 'failure');
});

test('merge only when every condition holds', () => {
  const ok = { eligibility: 'ok', codex: 'clean', checks: 'success', mergeable: true };
  assert.equal(decide(ok), 'merge');
  assert.equal(decide({ ...ok, eligibility: 'no-ship-label' }), 'no-ship-label');
  assert.equal(decide({ ...ok, codex: 'missing' }), 'waiting-on-codex');
  assert.equal(decide({ ...ok, codex: 'blocking' }), 'codex-flagged');
  assert.equal(decide({ ...ok, checks: 'pending' }), 'waiting-on-checks');
  assert.equal(decide({ ...ok, checks: 'failure' }), 'checks-failed');
  assert.equal(decide({ ...ok, mergeable: false }), 'conflict');
  assert.equal(decide({ ...ok, mergeable: null }), 'waiting-on-mergeable');
});

test('the ship label must come from Mike, and the newest labeling counts', () => {
  const ev = login => ({ event: 'labeled', label: { name: 'ship' }, actor: { login } });
  assert.equal(labelVerdict({ events: [ev('mhoydich')] }), 'ok');
  assert.equal(labelVerdict({ events: [ev('claude[bot]')] }), 'not-mike');
  assert.equal(labelVerdict({ events: [ev('mhoydich'), { event: 'unlabeled', label: { name: 'ship' }, actor: { login: 'mhoydich' } }, ev('github-actions[bot]')] }), 'not-mike');
  assert.equal(labelVerdict({ events: [] }), 'missing');
});

test('PRs that change workflow files are left for a person', () => {
  assert.equal(touchesWorkflows(['src/pages/a.astro', '.github/workflows/x.yml']), true);
  assert.equal(touchesWorkflows(['src/pages/a.astro']), false);
  const ok = { eligibility: 'ok', label: 'ok', codex: 'clean', checks: 'success', mergeable: true };
  assert.equal(decide({ ...ok, workflows: true }), 'needs-manual-merge-workflow-files');
  assert.equal(decide({ ...ok, label: 'not-mike' }), 'ship-label-not-from-mike');
});
