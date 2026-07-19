import assert from 'node:assert/strict';
import test from 'node:test';

import {
  UES_PROGRESS_MAX,
  createCompletionReceipt,
  createProgress,
  isComplete,
  nextIncompleteModule,
  normalizeProgress,
  parseProgress,
  progressSummary,
  serializeProgress,
  setFinalOutcome,
  setWeekComplete,
  startProgress,
  toggleWeek,
} from '../src/lib/ues-progress.mjs';

const CODE = 'UES-201';
const STARTED = '2026-07-18T16:00:00.000Z';
const FINISHED = '2026-07-18T17:00:00.000Z';
const persistedKeys = ['v', 'courseCode', 'startedAt', 'completedWeeks', 'finalOutcome', 'completedAt'];

test('malformed, stale, and cross-course input resets safely', () => {
  const empty = createProgress(CODE);

  assert.deepEqual(parseProgress('{bad json', CODE), empty);
  assert.deepEqual(normalizeProgress(null, CODE), empty);
  assert.deepEqual(normalizeProgress({ v: 0, courseCode: CODE, completedWeeks: [1] }, CODE), empty);
  assert.deepEqual(normalizeProgress({ v: 1, courseCode: 'UES-202', completedWeeks: [1] }, CODE), empty);
  assert.throws(() => createProgress('person@example.com'), /course code/i);
});

test('normalization bounds and deduplicates modules and drops unknown private fields', () => {
  const normalized = normalizeProgress({
    v: 1,
    courseCode: CODE,
    startedAt: STARTED,
    completedWeeks: [6, 1, 1, 0, 7, 2.5, '2', 3],
    finalOutcome: true,
    completedAt: FINISHED,
    name: 'Private Learner',
    email: 'person@example.com',
    artifact: 'secret draft',
    wallet: 'tz1-private-context',
  }, CODE);

  assert.deepEqual(normalized.completedWeeks, [1, 3, 6]);
  assert.equal(normalized.completedAt, null, 'fewer than four modules cannot retain completion');
  assert.deepEqual(Object.keys(normalized), persistedKeys);
  assert.doesNotMatch(JSON.stringify(normalized), /Private Learner|person@example|secret draft|tz1/);
});

test('updates are immutable, bounded, toggleable, and stamp a start time', () => {
  const empty = createProgress(CODE);
  const invalid = setWeekComplete(empty, 0, true, STARTED);
  const weekOne = setWeekComplete(empty, 1, true, STARTED);
  const duplicate = setWeekComplete(weekOne, 1, true, FINISHED);
  const toggledOff = toggleWeek(duplicate, 1, FINISHED);

  assert.deepEqual(empty.completedWeeks, []);
  assert.deepEqual(invalid, empty);
  assert.deepEqual(weekOne.completedWeeks, [1]);
  assert.equal(weekOne.startedAt, STARTED);
  assert.deepEqual(duplicate.completedWeeks, [1]);
  assert.deepEqual(toggledOff.completedWeeks, []);
  assert.equal(toggledOff.startedAt, STARTED);
  assert.equal(startProgress(empty, STARTED).startedAt, STARTED);
});

test('completion requires exactly the four-module threshold plus the final outcome', () => {
  let progress = createProgress(CODE);
  for (const week of [1, 2, 3, 4]) progress = setWeekComplete(progress, week, true, STARTED);

  assert.equal(isComplete(progress), false);
  assert.deepEqual(progressSummary(progress), {
    value: 4,
    max: UES_PROGRESS_MAX,
    complete: false,
    nextModule: 5,
  });

  progress = setFinalOutcome(progress, true, FINISHED);
  assert.equal(isComplete(progress), true);
  assert.equal(progress.completedAt, FINISHED);
  assert.equal(progressSummary(progress).value, 5);

  const belowThreshold = setWeekComplete(progress, 4, false, FINISHED);
  assert.equal(isComplete(belowThreshold), false);
  assert.equal(belowThreshold.completedAt, null);
  assert.equal(progressSummary(belowThreshold).value, 4);
});

test('next incomplete module walks all six modules independently of completion threshold', () => {
  let progress = createProgress(CODE);
  progress = setWeekComplete(progress, 1, true, STARTED);
  progress = setWeekComplete(progress, 3, true, STARTED);
  assert.equal(nextIncompleteModule(progress), 2);

  for (const week of [2, 4, 5, 6]) progress = setWeekComplete(progress, week, true, STARTED);
  assert.equal(nextIncompleteModule(progress), null);
  assert.equal(progressSummary(progress).value, 4, 'module credit is capped at the four-module threshold');
});

test('serialization emits only the six approved persistable fields', () => {
  const encoded = serializeProgress({
    ...setWeekComplete(createProgress(CODE), 2, true, STARTED),
    learnerName: 'Do not store',
  });
  const decoded = JSON.parse(encoded);

  assert.deepEqual(Object.keys(decoded), persistedKeys);
  assert.doesNotMatch(encoded, /learnerName|Do not store/);
});

test('receipt is completion-gated, self-attested, and contains no PII or credential claim', () => {
  assert.equal(createCompletionReceipt(createProgress(CODE), FINISHED), null);

  let progress = createProgress(CODE);
  for (const week of [1, 2, 4, 6]) progress = setWeekComplete(progress, week, true, STARTED);
  progress = setFinalOutcome(progress, true, FINISHED);
  const receipt = createCompletionReceipt({
    ...progress,
    name: 'Private Learner',
    email: 'person@example.com',
    wallet: 'tz1-private-context',
  }, FINISHED);
  const encoded = JSON.stringify(receipt);

  assert.equal(receipt.kind, 'self-attested-course-completion');
  assert.equal(receipt.courseCode, CODE);
  assert.deepEqual(receipt.completedModules, [1, 2, 4, 6]);
  assert.equal(receipt.completedModuleCount, 4);
  assert.match(receipt.disclaimer, /Not academic credit, accreditation, verified identity, an on-chain record, or a financial credential/);
  assert.doesNotMatch(encoded, /Private Learner|person@example|tz1-private/);
  assert.doesNotMatch(encoded, /learnerName|email|wallet/);
});
