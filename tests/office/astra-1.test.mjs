import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDeclaration } from '../../src/lib/office/declarations.mjs';

// Synthetic fixtures only: these records identify no real worker.
const now = Date.parse('2026-11-17T18:00:00Z');
const fixture = () => ({ schema: 'pointcast.office-declaration/v1', handle: '@fixture-child', name: 'Synthetic fixture', parentSeat: '@ada', model: 'fixture-model', runtimeId: '/fixture/child', job: 'Test only', ownedFiles: ['tests/fixture.mjs'], never: ['deploy'], approver: { name: 'Mike', via: ['Shwa', 'Loom desk'], boardIdentityIsApproval: false }, maxCycles: 3, cycle: 1, expiresAt: '2026-11-18T17:00:00Z' });
const trusted = (d = fixture()) => ({ ...Object.fromEntries(['handle', 'parentSeat', 'model', 'runtimeId', 'job', 'ownedFiles'].map(k => [k, structuredClone(d[k])])), verifiedAt: '2026-11-17T17:30:00Z', declarationReceipt: { messageId: 'm_fixture', sourceUrl: 'https://pointcast.xyz/loom?to=loom%3A000000000000000000000000%23m_fixture' } });
const run = (d = fixture(), attestation = null, time = now) => validateDeclaration(d, { now: time, attestation });

test('valid public declaration remains unverified without trusted caller evidence', () => {
  const r = run(); assert.equal(r.valid, true); assert.equal(r.verified, false); assert.deepEqual(r.errors, ['missing_attestation']);
});
test('fresh matching trusted evidence verifies, without any running or approval claim', () => {
  const r = run(fixture(), trusted()); assert.equal(r.verified, true); assert.deepEqual(r.errors, []); assert.equal(r.declaration.approver.boardIdentityIsApproval, false);
});
test('durable attestation stays valid past two minutes until expiry', () => {
  assert.equal(run(fixture(), trusted(), now + 22 * 3600000).verified, true);
  assert.equal(run(fixture(), trusted(), Date.parse(fixture().expiresAt)).valid, false);
});
test('stale, invalid and future attestation times fail closed', () => {
  for (const verifiedAt of ['bad', '2026-11-17T18:00:00.001Z', '2026-11-16T18:00:00Z', '2026-02-30T18:00:00Z']) assert.equal(run(fixture(), { ...trusted(), verifiedAt }).verified, false);
});
test('every identity and scope mismatch rejects verification', () => {
  for (const key of ['handle', 'parentSeat', 'model', 'runtimeId', 'job', 'ownedFiles']) {
    const a = trusted(); a[key] = key === 'ownedFiles' ? ['other.mjs'] : 'other'; assert.equal(run(fixture(), a).verified, false, key);
  }
});
test('public verified flags and embedded attestations cannot establish trust', () => {
  for (const extra of [{ verified: true }, { attestation: trusted() }]) { const r = run({ ...fixture(), ...extra }); assert.equal(r.valid, false); assert.equal(r.verified, false); }
});
test('receipt must link matching real-shaped message on fixed Loom origin', () => {
  for (const sourceUrl of ['javascript:alert(1)', 'https://evil.test/loom?to=x', trusted().declarationReceipt.sourceUrl.replace('m_fixture', 'm_other'), 'https://pointcast.xyz/loom?to=%40fixture-child']) {
    assert.equal(run(fixture(), { ...trusted(), declarationReceipt: { messageId: 'm_fixture', sourceUrl } }).verified, false);
  }
});
test('declaration timestamps require a real UTC calendar instant and future expiry', () => {
  for (const expiresAt of ['bad', '2026-02-30T18:00:00Z', '2026-11-18T17:00:00+00:00', '2026-11-17T18:00:00Z']) assert.equal(run({ ...fixture(), expiresAt }).valid, false);
});
test('identity, paths, cycles and approval constraints fail closed', () => {
  for (const patch of [{ handle: '@Mixed' }, { parentSeat: '@other' }, { ownedFiles: ['../secret'] }, { ownedFiles: ['a', 'a'] }, { ownedFiles: [] }, { never: [] }, { cycle: 4 }, { maxCycles: 4 }, { cycle: 2, maxCycles: 1 }, { approver: { ...fixture().approver, boardIdentityIsApproval: true } }, { job: 'x'.repeat(1001) }]) assert.equal(run({ ...fixture(), ...patch }).valid, false);
});
test('malformed inputs and invalid clock return bounded non-payload errors', () => {
  for (const value of [null, [], true, 'PRIVATE_PAYLOAD', {}]) { const r = run(value); assert.equal(r.valid, false); assert.equal(r.declaration, null); assert.ok(!JSON.stringify(r).includes('PRIVATE_PAYLOAD')); }
  for (const time of [NaN, Infinity, 'now']) assert.equal(run(fixture(), trusted(), time).valid, false);
});
test('result is detached from caller-owned nested arrays and approval record', () => {
  const d = fixture(); const r = run(d, trusted(d)); d.ownedFiles[0] = 'changed'; d.never[0] = 'changed'; d.approver.via[0] = 'changed'; assert.deepEqual(r.declaration, fixture());
});
