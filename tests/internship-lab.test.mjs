import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDraft, progress, invalidateReview, exportDraft, exportMarkdown, validArtifactUrl } from '../src/lib/internship-lab.mjs';

function completedDraft() {
  const draft = createDraft();
  draft.goal = 'Learn to make an accessible offer page.';
  draft.offer = 'Book swap poster';
  draft.onboarding.fill(true);
  draft.tasks.forEach(task => { task.status = 'ready'; });
  draft.evidence = 'Version 1: original SVG, readable text, keyboard checked, download inspected.';
  draft.review.fill(true);
  draft.reviewNote = 'Reviewed the v1 page and compared every deliverable with its record.';
  draft.deploy.fill(true);
  draft.approvalReference = 'v1 / owner role / review A';
  draft.practiceApproval = true;
  return draft;
}

test('a new draft cannot be submitted, reviewed or approved', () => {
  const draft = createDraft();
  draft.practiceApproval = true;
  assert.deepEqual(Object.values(progress(draft)), Array(7).fill(false));
  assert.equal(exportDraft(draft).deployment_rehearsal.practice_approval_recorded, false);
});

test('every stage gates the release rehearsal, including evidence and review notes', () => {
  const complete = completedDraft();
  assert.equal(progress(complete).approved, true);
  for (const breakStage of [
    d => { d.goal = ''; },
    d => { d.role = 'Unrecognized'; },
    d => { d.onboarding[0] = false; },
    d => { d.tasks[0].status = 'doing'; },
    d => { d.evidence = 'done'; },
    d => { d.artifactUrl = 'javascript:alert(1)'; },
    d => { d.review[0] = false; },
    d => { d.reviewNote = ''; },
    d => { d.deploy[0] = false; },
    d => { d.approvalReference = ''; },
  ]) {
    const draft = structuredClone(complete);
    breakStage(draft);
    assert.equal(progress(draft).approved, false);
    assert.equal(exportDraft(draft).deployment_rehearsal.practice_approval_recorded, false);
  }
});

test('changed work invalidates review and release checks while preserving useful notes', () => {
  const draft = completedDraft();
  invalidateReview(draft);
  assert.ok(draft.review.every(value => !value));
  assert.ok(draft.deploy.every(value => !value));
  assert.equal(draft.practiceApproval, false);
  assert.equal(progress(draft).reviewed, false);
  assert.ok(draft.reviewNote.length > 10);
});

test('artifact URLs are optional HTTPS text without embedded credentials', () => {
  for (const url of ['', '  ', 'https://example.com/draft?v=1']) assert.equal(validArtifactUrl(url), true);
  for (const url of ['http://example.com', 'javascript:alert(1)', 'data:text/html,hi', 'https://name:secret@example.com', 'not a url']) assert.equal(validArtifactUrl(url), false);
});

test('exports remain explicitly unpublished and unauthenticated even at completion', () => {
  const draft = completedDraft();
  const packet = JSON.parse(JSON.stringify(exportDraft(draft)));
  assert.equal(packet.status, 'practice_approval_recorded');
  assert.equal(packet.submitted_to_pointcast, false);
  assert.equal(packet.deployment_enabled, false);
  assert.equal(packet.review.authenticated, false);
  assert.equal(packet.deployment_rehearsal.grants_publish_authority, false);
  assert.equal(packet.tasks.length, 3);
  const markdown = exportMarkdown(draft);
  assert.match(markdown, /Not submitted to PointCast/);
  assert.match(markdown, /grants no publish authority/);
  assert.match(markdown, /No work has been deployed/);
});

test('draft instances do not share state and the controller has no remote or storage path', () => {
  const a = createDraft();
  a.tasks[0].status = 'ready';
  a.onboarding[0] = true;
  const b = createDraft();
  assert.equal(b.tasks[0].status, 'todo');
  assert.equal(b.onboarding[0], false);
  const client = readFileSync(new URL('../src/scripts/internship-lab.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(client, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB/);
});
