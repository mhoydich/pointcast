import test from 'node:test';
import assert from 'node:assert/strict';
import { CODEX_LOGIN, eligible, codexVerdict, checksVerdict, decide } from '../scripts/ship-pr.mjs';

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

test('a "no major issues" comment counts only after the head commit', () => {
  const said = at => [{ user: CODEX_LOGIN, body: "Codex Review: Didn't find any major issues. Keep them coming!", created_at: at }];
  assert.equal(codexVerdict({ headSha: head, headDate: '2026-11-02T12:00:00Z', issueComments: said('2026-11-02T12:05:00Z') }), 'clean');
  assert.equal(codexVerdict({ headSha: head, headDate: '2026-11-02T12:00:00Z', issueComments: said('2026-11-02T11:55:00Z') }), 'missing');
  assert.equal(codexVerdict({ headSha: head, headDate: '2026-11-02T12:00:00Z', issueComments: [{ user: 'mhoydich', body: "Didn't find any major issues", created_at: '2026-11-02T12:05:00Z' }] }), 'missing', 'a person typing it is not Codex');
});

test('checks: running or red blocks, skipped and neutral pass, own job ignored', () => {
  assert.equal(checksVerdict({ checkRuns: [] }), 'success');
  assert.equal(checksVerdict({ checkRuns: [{ name: 'build', status: 'completed', conclusion: 'success' }, { name: 'x', status: 'completed', conclusion: 'skipped' }] }), 'success');
  assert.equal(checksVerdict({ checkRuns: [{ name: 'build', status: 'in_progress', conclusion: null }] }), 'pending');
  assert.equal(checksVerdict({ checkRuns: [{ name: 'build', status: 'completed', conclusion: 'failure' }] }), 'failure');
  assert.equal(checksVerdict({ checkRuns: [{ name: 'ship', status: 'in_progress', conclusion: null }], ignore: ['ship'] }), 'success');
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

test('a Codex thumbs-up on the PR after the head commit counts', () => {
  const headDate = '2026-11-02T12:00:00Z';
  assert.equal(codexVerdict({ headSha: head, headDate, reactions: [{ user: CODEX_LOGIN, content: '+1', created_at: '2026-11-02T12:03:00Z' }] }), 'clean');
  assert.equal(codexVerdict({ headSha: head, headDate, reactions: [{ user: CODEX_LOGIN, content: '+1', created_at: '2026-11-02T11:03:00Z' }] }), 'missing');
  assert.equal(codexVerdict({ headSha: head, headDate, reactions: [{ user: CODEX_LOGIN, content: 'eyes', created_at: '2026-11-02T12:03:00Z' }] }), 'missing', 'eyes means still reviewing');
});
