import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDeskRegistry } from '../../src/lib/office/desk-registry.mjs';

// Synthetic adapter inputs only: this fixture is not a worker or a live attestation.
const now = Date.parse('2026-11-17T18:00:00Z');
const sourceUrl = 'https://pointcast.xyz/loom?to=loom%3A0123456789abcdef01234567%23m_fixture';
const portrait = { src: '/images/ufogp/ada.svg', whole: true,
  provenance: 'official-nouns-traits', sourceUrl: 'https://pointcast.xyz/images/ufogp/provenance.json' };
const fixture = () => ({ validation: { valid: true, verified: true, errors: [], declaration: {
  handle: '@fixture-only', name: 'Synthetic fixture, borrowed Ada art', runtimeId: '/fixture/only',
  model: 'fixture-model', job: 'fixture job', ownedFiles: ['fixture/file'], expiresAt: '2026-11-18T17:24:00Z',
} }, receipt: { messageId: 'm_fixture', sourceUrl } });
const run = (record = fixture(), art = portrait, clock = now) => buildDeskRegistry({
  declarations: [record], portraits: { '@fixture-only': art }, now: clock,
});

test('empty input is idle and invents no desk', () => {
  const result = buildDeskRegistry({ now });
  assert.equal(result.state, 'idle');
  assert.deepEqual(result.data, { desks: [], unresolved: [] });
  assert.equal(result.sourceUrl, null);
});

test('verified eligible fixture stays idle, never running', () => {
  const result = run();
  assert.equal(result.schema, 'pointcast.office-data/v1');
  assert.equal(result.state, 'ok');
  assert.equal(result.observedAt, new Date(now).toISOString());
  assert.equal(result.data.desks[0].eligible, true);
  assert.equal(result.data.desks[0].state, 'idle');
  assert.equal(result.data.desks[0].name, 'Synthetic fixture, borrowed Ada art');
  assert.equal(result.data.desks[0].sourceUrl, sourceUrl);
});

test('boolean spoofing and unverified declarations remain ineligible', () => {
  for (const value of [false, undefined, 'true', 1]) {
    const record = fixture(); record.validation.verified = value;
    assert.equal(run(record).data.desks[0].eligible, false);
  }
  const record = fixture(); record.validation.valid = false;
  assert.equal(run(record).data.desks[0].state, 'unverified');
});

test('missing cards and orphan portraits never invent workers', () => {
  const result = run({ validation: { valid: false, verified: false, declaration: null } });
  assert.equal(result.data.desks.length, 0);
  assert.ok(result.data.unresolved.every(item => item.state === 'unverified'));
});

test('cached validation expires at the boundary without a short identity TTL', () => {
  assert.equal(run(fixture(), portrait, now + 12 * 3600000).data.desks[0].eligible, true);
  const result = run(fixture(), portrait, Date.parse('2026-11-18T17:24:00Z'));
  assert.equal(result.state, 'stale');
  assert.equal(result.data.desks[0].eligible, false);
});

test('invalid timestamps and clocks fail closed', () => {
  for (const value of [null, 'tomorrow', '2026-02-30T00:00:00Z', '2026-11-18T17:24:00+00:00']) {
    const record = fixture(); record.validation.declaration.expiresAt = value;
    assert.equal(run(record).data.desks[0].state, 'error');
  }
  for (const clock of [NaN, Infinity, '2026-11-17', 9e15]) assert.equal(run(fixture(), portrait, clock).state, 'error');
});

test('requires exact existing whole art and its documented provenance', () => {
  const bad = [null, { ...portrait, whole: false }, { ...portrait, provenance: 'generated' },
    { ...portrait, sourceUrl: 'https://example.com/provenance' }, ...[
      '/images/ufogp/ada-card.svg', '/images/ufogp/flag.svg', '/images/ufogp/invented.svg',
      '//example.com/ada.svg', 'data:image/svg+xml,secret', '/images/ufogp/../ada.svg',
      '/images/ufogp/ada.svg?crop=head', '/loom/noun?b=cool',
    ].map(src => ({ ...portrait, src }))];
  for (const art of bad) {
    const desk = run(fixture(), art).data.desks[0];
    assert.equal(desk.eligible, false); assert.equal(desk.portrait, null);
  }
});

test('receipt must identify the exact message on the fixed Loom origin', () => {
  for (const receipt of [null, { messageId: 'm_wrong', sourceUrl },
    { messageId: 'm_fixture', sourceUrl: sourceUrl.replace('pointcast.xyz', 'evil.test') },
    { messageId: 'm_fixture', sourceUrl: 'javascript:alert(1)' }]) {
    const record = fixture(); record.receipt = receipt;
    assert.equal(run(record).data.desks[0].eligible, false);
  }
});

test('conflicting duplicate handles cannot win by input order', () => {
  const a = fixture(), b = fixture(); b.validation.verified = false;
  for (const declarations of [[a, b], [b, a]]) {
    const result = buildDeskRegistry({ declarations, portraits: { '@fixture-only': portrait }, now });
    assert.equal(result.state, 'error'); assert.equal(result.data.desks.length, 1);
    assert.equal(result.data.desks[0].eligible, false);
  }
});

test('invalid input is bounded and upstream error payloads are not reflected', () => {
  for (const declarations of [null, {}, Array(257).fill(fixture())]) {
    assert.deepEqual(buildDeskRegistry({ declarations, now }).errors, ['invalid_input']);
  }
  const record = fixture(); record.validation.verified = false;
  record.validation.errors = ['PRIVATE payload'];
  assert.ok(!JSON.stringify(run(record)).includes('PRIVATE'));
});

test('output detaches arrays and portraits from caller input', () => {
  const record = fixture(); const result = run(record);
  result.data.desks[0].ownedFiles.push('mutated');
  result.data.desks[0].portrait.src = 'mutated';
  assert.deepEqual(record.validation.declaration.ownedFiles, ['fixture/file']);
  assert.equal(portrait.src, '/images/ufogp/ada.svg');
});

test('validator expiry and stale attestation codes remain visibly stale', () => {
  const expired = run({ validation: { valid: false, verified: false, declaration: null, errors: ['expired_declaration'] } });
  assert.equal(expired.state, 'stale'); assert.equal(expired.data.desks.length, 0);
  const record = fixture(); record.validation.verified = false; record.validation.errors = ['stale_attestation'];
  assert.equal(run(record).data.desks[0].state, 'stale');
  assert.equal(run(record).data.desks[0].eligible, false);
});
