import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDraft, normalizeDraft, validateResource, addResource, removeResource, totals, exportDraft, parseDraft, STORAGE_KEY } from '../src/lib/collect-goals.mjs';

const entry = (overrides = {}) => ({ id: 'resource-1', title: 'Edition proceeds', stage: 'lead', amount: null, date: '2026-10-24', evidence: '', allocationConfirmed: false, ...overrides });

test('empty is unverified with no fabricated resources or progress percentage', () => {
  const draft = emptyDraft();
  assert.equal(STORAGE_KEY, 'pointcast:collect:001:v1');
  assert.deepEqual(draft.resources, []);
  assert.equal(draft.wishlist, false);
  assert.equal(Object.hasOwn(draft, 'fundedPercent'), false);
  assert.deepEqual(totals(draft), { leadCount: 0, realizedUnallocated: 0, ownerAttestedAllocated: 0, currency: 'USD' });
});

test('leads, realized resources and explicit allocations stay mutually exclusive', () => {
  let draft = addResource(emptyDraft(), entry({ amount: 1000000 }));
  draft = addResource(draft, entry({ id: 'resource-2', stage: 'realized', amount: '123.45', evidence: 'Owner reviewed receipt A' }));
  draft = addResource(draft, entry({ id: 'resource-3', stage: 'allocated', amount: 10.29, evidence: 'Owner reviewed receipt B', allocationConfirmed: true }));
  assert.deepEqual(totals(draft), { leadCount: 1, realizedUnallocated: 123.45, ownerAttestedAllocated: 10.29, currency: 'USD' });
  assert.equal(draft.resources[0].amount, 1000000);
  assert.equal(draft.resources[0].allocationConfirmed, false);
});

test('realized and allocated entries require evidence and positive amounts', () => {
  assert.throws(() => validateResource(entry({ stage: 'realized', amount: 50 })), /Evidence reference is required/);
  assert.throws(() => validateResource(entry({ stage: 'realized', evidence: 'Receipt' })), /positive USD amount is required/);
  assert.throws(() => validateResource(entry({ stage: 'allocated', amount: 50, evidence: 'Receipt' })), /explicitly allocated/);
  assert.throws(() => validateResource(entry({ stage: 'allocated', amount: 50, evidence: 'Receipt', allocationConfirmed: 'true' })), /true or false/);
  assert.throws(() => validateResource(entry({ stage: 'allocated', amount: 50, evidence: '   ', allocationConfirmed: true })), /Evidence reference is required/);
  assert.equal(validateResource(entry({ stage: 'lead', allocationConfirmed: true })).allocationConfirmed, false);
});

test('nonfinite, negative, zero, subcent and excessive amounts are rejected', () => {
  for (const amount of [-1, 0, NaN, Infinity, -Infinity, 'Infinity', '-20', '1e6', '0x10', '100,000', '12.345', 0.001, 0.00000001, 1.000000001, 1.0001, 1000000000.01, {}, true, []]) {
    assert.throws(() => validateResource(entry({ amount })), undefined, `Accepted ${String(amount)}`);
  }
  for (const amount of [0.29, 1.01, '0.01', '999.99', 1000000000]) assert.equal(typeof validateResource(entry({ amount })).amount, 'number');
  assert.equal(validateResource(entry({ amount: '' })).amount, null);
});

test('cent addition is exact and never merges the same resource into both stages', () => {
  let draft = emptyDraft();
  for (let index = 0; index < 10; index++) draft = addResource(draft, entry({ id: `r-${index}`, stage: 'realized', amount: 0.1, evidence: 'Owner receipt reference' }));
  assert.equal(totals(draft).realizedUnallocated, 1);
  assert.equal(totals(draft).ownerAttestedAllocated, 0);
});

test('dates must be actual calendar days; review date is optional', () => {
  for (const invalid of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-10-00', '2026-1-2', 'today', null]) {
    assert.throws(() => validateResource(entry({ date: invalid })));
  }
  assert.equal(validateResource(entry({ date: '2028-02-29' })).date, '2028-02-29');
  assert.equal(normalizeDraft({ ...emptyDraft(), nextReviewDate: '2026-11-01' }).nextReviewDate, '2026-11-01');
  assert.throws(() => normalizeDraft({ ...emptyDraft(), nextReviewDate: '2026-11-31' }));
});

test('strings are bounded, required, trimmed and left as text rather than interpreted HTML', () => {
  assert.equal(validateResource(entry({ title: '  Studio edition  ' })).title, 'Studio edition');
  assert.equal(validateResource(entry({ title: '<img src=x onerror=alert(1)>' })).title, '<img src=x onerror=alert(1)>');
  for (const title of ['', ' ', 'a'.repeat(121), 123]) assert.throws(() => validateResource(entry({ title })));
  assert.throws(() => validateResource(entry({ evidence: 'a'.repeat(601) })));
  assert.throws(() => normalizeDraft({ ...emptyDraft(), notes: 'x'.repeat(2001) }));
  assert.throws(() => normalizeDraft({ ...emptyDraft(), notes: null }));
});

test('imports reject corrupt, foreign, ambiguous and future-version data', () => {
  for (const input of ['', '{', 'null', '[]', '{}', 'a'.repeat(300001)]) assert.throws(() => parseDraft(input));
  for (const override of [{ version: 2 }, { version: '1' }, { itemId: '002' }, { wishlist: 'yes' }, { resources: {} }, { sharedBalance: 500 }]) {
    assert.throws(() => parseDraft(JSON.stringify({ ...emptyDraft(), ...override })));
  }
  assert.throws(() => parseDraft(JSON.stringify({ ...emptyDraft(), resources: [entry({ id: undefined })] })), /must have an ID/);
  assert.throws(() => parseDraft(JSON.stringify({ ...emptyDraft(), resources: [entry(), entry()] })), /Duplicate resource IDs/);
});

test('prototype keys, custom prototypes and accessors are rejected without execution', () => {
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    const malicious = JSON.parse(exportDraft(emptyDraft()));
    Object.defineProperty(malicious, key, { value: { polluted: true }, enumerable: true });
    assert.throws(() => normalizeDraft(malicious), /unsupported fields/);
    assert.throws(() => parseDraft(JSON.stringify(malicious)), /unsupported fields/);
    const resource = JSON.parse(JSON.stringify(entry()));
    Object.defineProperty(resource, key, { value: 'junk', enumerable: true });
    assert.throws(() => validateResource(resource), /unsupported fields/);
  }
  assert.equal({}.polluted, undefined);
  assert.throws(() => normalizeDraft(Object.assign(Object.create({ wishlist: true }), emptyDraft())), /plain object/);
  let getterRan = false;
  const malicious = { ...emptyDraft() };
  Object.defineProperty(malicious, 'notes', { enumerable: true, get() { getterRan = true; return ''; } });
  assert.throws(() => normalizeDraft(malicious), /accessors/);
  assert.equal(getterRan, false);
});

test('100-entry boundary, duplicate prevention and immutable removal', () => {
  const draft = { ...emptyDraft(), resources: Array.from({ length: 100 }, (_, i) => entry({ id: `r-${i}` })) };
  assert.equal(normalizeDraft(draft).resources.length, 100);
  assert.throws(() => addResource(draft, entry({ id: 'new' })), /draft is full/);
  assert.throws(() => normalizeDraft({ ...draft, resources: [...draft.resources, entry({ id: 'new' })] }), /at most 100/);
  const one = addResource(emptyDraft(), entry());
  assert.throws(() => addResource(one, entry()), /already recorded/);
  const removed = removeResource(one, 'resource-1');
  assert.equal(removed.resources.length, 0);
  assert.equal(one.resources.length, 1);
});

test('export roundtrips every field, uses item scope and returns a separate object', () => {
  const input = { ...addResource(emptyDraft(), entry({ stage: 'allocated', amount: 50.25, evidence: 'Receipt reference', allocationConfirmed: true })), wishlist: true, notes: 'Check the next official update.', nextReviewDate: '2026-11-24' };
  const restored = parseDraft(exportDraft(input));
  assert.deepEqual(restored, input);
  restored.resources[0].title = 'Changed copy';
  assert.equal(input.resources[0].title, 'Edition proceeds');
  const created = validateResource(entry({ id: undefined }));
  assert.match(created.id, /^[a-f0-9-]{36}$/);
});
