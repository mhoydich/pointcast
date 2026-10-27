import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, applyEvent, publicExport, privateExport } from '../public/chain/agreement/model.mjs';
const at = '2026-10-27T12:00:00.000Z';
function act(room, id, type, actor, extra = {}) { return applyEvent(room, { id, type, actor, expectedStep: room.step, at, ...extra }); }
function working() { let r = createRoom(); r = act(r, 'i', 'invite', 'Ari'); return act(r, 'a', 'accept_invitation', 'Bo'); }

test('amendment invalidates approvals and both must approve exact revision', () => {
  let r = working(); r = act(r, 'b1', 'approve', 'Bo', { revision: 1 });
  r = act(r, 'c', 'request_change', 'Ari', { revision: 1 });
  assert.throws(() => act(r, 'premature', 'complete', 'Ari', { revision: 1 }));
  r = act(r, 'review', 'request_review', 'Ari', { revision: 1 });
  r = act(r, 'advice', 'review_suggest', 'Review desk', { revision: 1 });
  assert.equal(r.reviewSuggestion, true);
  assert.throws(() => act(r, 'override', 'approve', 'Review desk', { revision: 1 }));
  r = act(r, 'm', 'amend', 'Ari', { revision: 1 });
  assert.equal(r.revision, 2); assert.deepEqual(r.approvals, {});
  assert.throws(() => act(r, 'stale', 'approve', 'Bo', { revision: 1 }));
  r = act(r, 'b2', 'approve', 'Bo', { revision: 2 });
  assert.throws(() => act(r, 'repeat', 'approve', 'Bo', { revision: 2 }), /already approved/);
  assert.throws(() => act(r, 'one', 'complete', 'Bo', { revision: 2 }));
  r = act(r, 'a2', 'approve', 'Ari', { revision: 2 });
  assert.equal(act(r, 'done', 'complete', 'Ari', { revision: 2 }).status, 'completed');
});

test('bounded agent, closed rooms, expiry and ordering', () => {
  let r = working();
  assert.throws(() => act(r, 'bad', 'approve', 'Studio bot', { revision: 1 }));
  r = act(r, 'suggest', 'suggest', 'Studio bot'); assert.equal(r.agentSuggestion, true);
  assert.throws(() => applyEvent(r, { id: 'old', type: 'cancel', actor: 'Ari', at, expectedStep: 0 }));
  assert.throws(() => act(r, 'unknown', 'cancel', 'Unknown'));
  const closed = act(r, 'cancel', 'cancel', 'Bo');
  assert.throws(() => act(closed, 'again', 'approve', 'Ari', { revision: 1 }));
  assert.throws(() => act(r, 'early', 'expire', 'Ari'));
  assert.equal(act(r, 'expired', 'expire', 'Ari', { at: '2030-01-01T00:00:00.000Z' }).status, 'expired');
});

test('duplicate event is idempotent, conflicting reuse is rejected', () => {
  const e = { id: 'one', type: 'invite', actor: 'Ari', expectedStep: 0, at };
  const r = applyEvent(createRoom(), e); assert.strictEqual(applyEvent(r, e), r);
  assert.throws(() => applyEvent(r, { ...e, actor: 'Bo' }), /conflicts/);
});

test('public export is an allowlist and excludes private feedback and event payloads', () => {
  let r = working(); r = act(r, 'review', 'request_change', 'Bo', { revision: 1 });
  const pub = JSON.stringify(publicExport(r));
  assert.ok(!pub.includes(r.privateNote)); assert.ok(!pub.includes('fingerprint')); assert.ok(!pub.includes('history'));
  assert.equal(privateExport(r).privateExampleFeedback, r.privateNote);
});
