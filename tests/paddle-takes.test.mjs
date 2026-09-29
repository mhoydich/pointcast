import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_HOURS,
  MIN_HOURS,
  orderTakes,
  publishableTakes,
  RELATIONSHIP_PRECEDENCE,
  RELATIONSHIP_WORDS,
  RESERVED_TAKE_IDS,
  TAKE_FIELDS,
  validateTake,
  VERDICT_WORDS,
} from '../src/lib/paddle-takes.ts';
import { PADDLE_REVIEWS } from '../src/data/paddle-reviews.ts';

const KNOWN_IDS = ['method-fixture-paddle', 'other-fixture-paddle'];
const KNOWN_PROGRAMS = ['maker', 'other-maker'];

function fixtureTake(overrides = {}) {
  return {
    id: 'fixture-take-one',
    paddleId: 'method-fixture-paddle',
    status: 'published',
    publishedAt: '2026-09-28T12:00:00-07:00',
    reviewer: { handle: '@fixture', relationship: 'bought' },
    thesis: 'This paddle has enough pop for drives without losing touch on resets at the kitchen line.',
    wouldChange: 'A crack in the face inside three months of regular play.',
    hoursPlayed: 40,
    testedFrom: '2026-07-01',
    testedTo: '2026-09-20',
    verdict: 'bag',
    record: [{ date: '2026-07-01', note: 'Started using it for league night.', source: 'reviewer' }],
    affiliate: null,
    disclosure: 'No affiliate link on this take.',
    ...overrides,
  };
}

test('paddle-takes: a well-formed @fixture take is valid', () => {
  assert.deepEqual(validateTake(fixtureTake(), KNOWN_IDS), []);
});

test('paddle-takes: id must be a slug', () => {
  assert.notEqual(validateTake(fixtureTake({ id: 'Not A Slug' }), KNOWN_IDS).length, 0);
});

test('paddle-takes: paddleId must be known and never "method"', () => {
  assert.notEqual(validateTake(fixtureTake({ paddleId: 'unknown-paddle' }), KNOWN_IDS).length, 0);
  assert.notEqual(validateTake(fixtureTake({ paddleId: 'method' }), KNOWN_IDS).length, 0);
});

test('paddle-takes: a take id can never be a reserved page name under /reviews/paddles/', () => {
  assert.deepEqual(RESERVED_TAKE_IDS, ['method', 'index']);
  for (const id of RESERVED_TAKE_IDS) {
    assert.notEqual(validateTake(fixtureTake({ id }), KNOWN_IDS).length, 0, `id "${id}" must be rejected`);
    assert.throws(() => publishableTakes([fixtureTake({ id })], KNOWN_IDS), /invalid published paddle take/);
  }
  // A dot can't reach a page path either: "x.json" is not a slug.
  assert.notEqual(validateTake(fixtureTake({ id: 'fixture.json' }), KNOWN_IDS).length, 0);
});

test('paddle-takes: status must be published or draft', () => {
  assert.notEqual(validateTake(fixtureTake({ status: 'live' }), KNOWN_IDS).length, 0);
});

test('paddle-takes: handle must match @lowercase-ish pattern', () => {
  assert.notEqual(validateTake(fixtureTake({ reviewer: { handle: 'fixture', relationship: 'bought' } }), KNOWN_IDS).length, 0);
  assert.notEqual(validateTake(fixtureTake({ reviewer: { handle: '@x', relationship: 'bought' } }), KNOWN_IDS).length, 0);
});

test('paddle-takes: relationship must be a known enum', () => {
  assert.notEqual(validateTake(fixtureTake({ reviewer: { handle: '@fixture', relationship: 'fan' } }), KNOWN_IDS).length, 0);
  assert.deepEqual(Object.keys(RELATIONSHIP_WORDS).sort(), ['bought', 'insider', 'owner', 'sample'].sort());
});

test('paddle-takes: how a paddle was obtained outranks who holds it', () => {
  assert.deepEqual(RELATIONSHIP_PRECEDENCE, ['owner', 'sample', 'insider', 'bought']);
  assert.deepEqual([...RELATIONSHIP_PRECEDENCE].sort(), Object.keys(RELATIONSHIP_WORDS).sort());
  assert.match(RELATIONSHIP_WORDS.insider, /bought at retail/, 'insider is only ever a retail purchase');
});

test('paddle-takes: verdict must be a known enum', () => {
  assert.notEqual(validateTake(fixtureTake({ verdict: 'love-it' }), KNOWN_IDS).length, 0);
  assert.deepEqual(Object.keys(VERDICT_WORDS).sort(), ['bag', 'depends', 'pass'].sort());
});

test('paddle-takes: thesis and wouldChange enforce length bounds', () => {
  assert.notEqual(validateTake(fixtureTake({ thesis: 'too short' }), KNOWN_IDS).length, 0);
  assert.notEqual(validateTake(fixtureTake({ thesis: 'x'.repeat(281) }), KNOWN_IDS).length, 0);
  assert.notEqual(validateTake(fixtureTake({ wouldChange: 'short' }), KNOWN_IDS).length, 0);
  assert.notEqual(validateTake(fixtureTake({ wouldChange: 'x'.repeat(281) }), KNOWN_IDS).length, 0);
});

test('paddle-takes: hoursPlayed enforces the floor and ceiling', () => {
  assert.equal(MIN_HOURS, 10);
  assert.equal(MAX_HOURS, 2000);
  assert.notEqual(validateTake(fixtureTake({ hoursPlayed: 9 }), KNOWN_IDS).length, 0);
  assert.notEqual(validateTake(fixtureTake({ hoursPlayed: 2001 }), KNOWN_IDS).length, 0);
  assert.deepEqual(validateTake(fixtureTake({ hoursPlayed: MIN_HOURS }), KNOWN_IDS), []);
});

test('paddle-takes: dates must be ISO and ordered testedFrom <= testedTo <= publishedAt', () => {
  assert.notEqual(validateTake(fixtureTake({ testedFrom: '07/01/2026' }), KNOWN_IDS).length, 0);
  assert.notEqual(validateTake(fixtureTake({ testedFrom: '2026-09-25', testedTo: '2026-09-01' }), KNOWN_IDS).length, 0);
  assert.notEqual(validateTake(fixtureTake({ testedTo: '2026-10-01' }), KNOWN_IDS).length, 0, 'testedTo after publishedAt');
});

test('paddle-takes: record must be non-empty with a reviewer or https source', () => {
  assert.notEqual(validateTake(fixtureTake({ record: [] }), KNOWN_IDS).length, 0);
  assert.notEqual(
    validateTake(fixtureTake({ record: [{ date: '2026-07-01', note: 'ok', source: 'http://insecure.example' }] }), KNOWN_IDS).length,
    0,
  );
  assert.deepEqual(
    validateTake(fixtureTake({ record: [{ date: '2026-07-01', note: 'ok', source: 'https://example.com/proof' }] }), KNOWN_IDS),
    [],
  );
});

test('paddle-takes: disclosure must be non-empty', () => {
  assert.notEqual(validateTake(fixtureTake({ disclosure: '' }), KNOWN_IDS).length, 0);
});

test('paddle-takes: affiliate is null, or a known program with an https off-site link', () => {
  assert.deepEqual(validateTake(fixtureTake({ affiliate: null }), KNOWN_IDS, KNOWN_PROGRAMS), []);
  assert.notEqual(
    validateTake(fixtureTake({ affiliate: { program: 'Not A Slug', url: 'https://maker.example/x' } }), KNOWN_IDS, KNOWN_PROGRAMS).length,
    0,
  );
  assert.notEqual(
    validateTake(fixtureTake({ affiliate: { program: 'maker', url: 'http://maker.example/x' } }), KNOWN_IDS, KNOWN_PROGRAMS).length,
    0,
  );
  assert.notEqual(
    validateTake(fixtureTake({ affiliate: { program: 'maker', url: 'https://pointcast.xyz/x' } }), KNOWN_IDS, KNOWN_PROGRAMS).length,
    0,
    'affiliate url must be off-site',
  );
  assert.deepEqual(
    validateTake(fixtureTake({ affiliate: { program: 'maker', url: 'https://maker.example/x' } }), KNOWN_IDS, KNOWN_PROGRAMS),
    [],
  );
});

test('paddle-takes: an unknown affiliate program is rejected, and publishableTakes throws on it', () => {
  const unknown = fixtureTake({ affiliate: { program: 'not-a-program', url: 'https://maker.example/?ref=pointcast' } });
  assert.notEqual(validateTake(unknown, KNOWN_IDS, KNOWN_PROGRAMS).length, 0, 'slug-shaped but not on file');
  assert.throws(() => publishableTakes([unknown], KNOWN_IDS, KNOWN_PROGRAMS), /invalid published paddle take/);

  // A near-miss typo of a real program id is still unknown.
  const typo = fixtureTake({ affiliate: { program: 'other-makr', url: 'https://maker.example/x' } });
  assert.notEqual(validateTake(typo, KNOWN_IDS, KNOWN_PROGRAMS).length, 0);

  // Fail closed: a caller that forgets the program list accepts no affiliate at all.
  const known = fixtureTake({ affiliate: { program: 'maker', url: 'https://maker.example/x' } });
  assert.notEqual(validateTake(known, KNOWN_IDS).length, 0);
});

test('publishableTakes: drops drafts, keeps published', () => {
  const draft = fixtureTake({ id: 'fixture-draft', status: 'draft' });
  const published = fixtureTake({ id: 'fixture-published' });
  const out = publishableTakes([draft, published], KNOWN_IDS);
  assert.deepEqual(out.map((t) => t.id), ['fixture-published']);
});

test('publishableTakes: throws on an invalid published take instead of dropping it', () => {
  const bad = fixtureTake({ id: 'fixture-bad', hoursPlayed: 1 });
  assert.throws(() => publishableTakes([bad], KNOWN_IDS), /invalid published paddle take/);
});

test('publishableTakes: throws on a duplicate id', () => {
  const a = fixtureTake({ id: 'fixture-dup' });
  const b = fixtureTake({ id: 'fixture-dup' });
  assert.throws(() => publishableTakes([a, b], KNOWN_IDS), /duplicate paddle take id/);
});

test('orderTakes: sorts by latest record date, then publishedAt, then id — never by verdict, relationship or affiliate', () => {
  const older = fixtureTake({ id: 'a-older', record: [{ date: '2026-01-01', note: 'n', source: 'reviewer' }] });
  const newer = fixtureTake({ id: 'b-newer', record: [{ date: '2026-08-01', note: 'n', source: 'reviewer' }] });
  const ordered = orderTakes([older, newer]).map((t) => t.id);
  assert.deepEqual(ordered, ['b-newer', 'a-older']);

  // Swap verdict, affiliate and relationship on both — order must not move.
  const olderSwapped = { ...older, verdict: 'pass', reviewer: { handle: '@fixture', relationship: 'owner' }, affiliate: { program: 'maker', url: 'https://maker.example/x' } };
  const newerSwapped = { ...newer, verdict: 'depends', reviewer: { handle: '@fixture', relationship: 'insider' }, affiliate: null };
  const orderedSwapped = orderTakes([olderSwapped, newerSwapped]).map((t) => t.id);
  assert.deepEqual(orderedSwapped, ordered);
});

test('TAKE_FIELDS documents the take shape', () => {
  for (const key of ['reviewer', 'thesis', 'wouldChange', 'hoursPlayed', 'tested', 'verdict', 'record']) {
    assert.ok(TAKE_FIELDS[key]?.label, `TAKE_FIELDS.${key}.label`);
    assert.ok(TAKE_FIELDS[key]?.meaning, `TAKE_FIELDS.${key}.meaning`);
  }
});

test('PADDLE_REVIEWS is empty in stage 1 — the first real review removes this guard', () => {
  assert.equal(PADDLE_REVIEWS.length, 0);
});
