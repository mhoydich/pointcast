import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_FIELDS,
  OPTED_IN_DESK,
  PILOT_FLAGS,
  PILOT_SCOPE,
  PINNED_PUBLIC_KEY,
  bodySha256,
  canonicalTaskBytes,
  createDoorbellPilot,
  signCard,
  untrustedMentions,
  verifyCard,
} from '../src/lib/loom/doorbell-pilot.mjs';
import { runDoorbellPilotReplay } from '../scripts/run-doorbell-pilot-replay.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = JSON.parse(readFileSync(join(root, 'fixtures/loom-doorbell-pilot-card.json'), 'utf8'));
const EVENT_ID = 'evt-doorbell-pilot-001';

function signed(card, signature = fixture.signature.value, desk = OPTED_IN_DESK, eventId = EVENT_ID) {
  return {
    eventId,
    desk,
    card,
    publicKey: fixture.signature.publicKey,
    signature,
  };
}

test('webhook delivery and live writes stay hard off', () => {
  assert.equal(PILOT_FLAGS.webhookDeliveryEnabled, false);
  assert.equal(PILOT_FLAGS.liveWritesEnabled, false);
  assert.throws(() => { PILOT_FLAGS.webhookDeliveryEnabled = true; }, TypeError);
  assert.throws(() => createDoorbellPilot({ webhookDeliveryEnabled: true }), /doorbell_pilot_flags_locked/);
  assert.throws(() => createDoorbellPilot({ liveWritesEnabled: true }), /doorbell_pilot_flags_locked/);
  assert.throws(() => createDoorbellPilot({ kv: {} }), /live_writes_disabled/);
  assert.throws(() => createDoorbellPilot({ fetch: () => {} }), /live_writes_disabled/);
  const pilot = createDoorbellPilot();
  assert.throws(() => pilot.deliver({ webhookDeliveryEnabled: true }), /doorbell_pilot_flags_locked/);
  assert.throws(() => pilot.operatorClaim({ liveWritesEnabled: true }), /doorbell_pilot_flags_locked/);
  assert.equal(pilot.snapshot().counts.deliveries, 0);
  assert.equal(pilot.snapshot().counts.wakes, 0);
  assert.equal(pilot.snapshot().webhookDeliveryEnabled, false);
  assert.equal(pilot.snapshot().liveWritesEnabled, false);
});

test('the fixture signs only the canonical task fields', () => {
  assert.deepEqual(fixture.signedFields, [...CANONICAL_FIELDS]);
  assert.equal(fixture.signature.alg, 'Ed25519');
  assert.equal(fixture.signature.publicKey, PINNED_PUBLIC_KEY);
  assert.equal(fixture.card.bodySha256, bodySha256(fixture.card.body));
  const bytes = canonicalTaskBytes(fixture.card).toString('utf8');
  for (const field of CANONICAL_FIELDS) assert.match(bytes, new RegExp(`^${field}=`, 'm'));
  assert.equal(bytes.includes('assignee'), false);
  assert.equal(bytes.includes('@unopted-desk'), false);
  assert.equal(bytes.includes('body='), false);
  assert.deepEqual(untrustedMentions(fixture.card.body), ['@unopted-desk']);
  const verdict = verifyCard(fixture.card, { publicKey: fixture.signature.publicKey, signature: fixture.signature.value });
  assert.equal(verdict.ok, true);
  assert.equal(verdict.signatureOk, true);
  assert.equal(verdict.scopeOk, true);
  const reassigned = { ...fixture.card, assignee: '@someone-else' };
  const still = verifyCard(reassigned, { publicKey: fixture.signature.publicKey, signature: fixture.signature.value });
  assert.equal(still.ok, true, 'assignee is outside the signature');
});

test('@unopted-desk is blocked and wakes nobody', () => {
  const pilot = createDoorbellPilot();
  const byMention = pilot.deliver(signed(fixture.card, fixture.signature.value, '@unopted-desk'));
  const byAssignee = pilot.deliver(signed(fixture.card, fixture.signature.value, fixture.card.assignee, 'evt-assignee'));
  assert.equal(byMention.ok, false);
  assert.equal(byMention.reason, 'desk_not_opted_in');
  assert.equal(byAssignee.ok, false);
  assert.deepEqual(pilot.snapshot().counts, { deliveries: 0, wakes: 0, reads: 0, claims: 0 });
  assert.equal(pilot.snapshot().wakes.length, 0);
});

test('delivery, replay, and an explicit claim stay separate', () => {
  const pilot = createDoorbellPilot();
  const first = pilot.deliver(signed(fixture.card));
  assert.deepEqual(
    { deliveries: first.deliveries, wakes: first.wakes, reads: first.reads, claims: first.claims, readCheck: first.readCheck },
    { deliveries: 1, wakes: 1, reads: 1, claims: 0, readCheck: 'ed25519+scope' },
  );

  const second = pilot.deliver(signed(fixture.card));
  assert.equal(second.duplicate, true);
  assert.deepEqual(
    { deliveries: second.deliveries, wakes: second.wakes, reads: second.reads, claims: second.claims },
    { deliveries: 2, wakes: 1, reads: 1, claims: 0 },
  );

  const claim = pilot.operatorClaim({ ...signed(fixture.card), operatorId: 'staging-operator' });
  assert.equal(claim.ok, true);
  assert.equal(claim.idempotent, false);
  assert.equal(claim.claims, 1);

  const third = pilot.deliver(signed(fixture.card));
  const again = pilot.operatorClaim({ ...signed(fixture.card), operatorId: 'other-operator' });
  assert.deepEqual(
    { deliveries: third.deliveries, wakes: third.wakes, reads: third.reads, claims: third.claims },
    { deliveries: 3, wakes: 1, reads: 1, claims: 1 },
  );
  assert.equal(again.idempotent, true);
  assert.equal(again.claims, 1);
  assert.equal(again.claim.operatorId, 'staging-operator');

  const snap = pilot.snapshot();
  assert.deepEqual(snap.deliveries.map((row) => row.state), ['delivered', 'delivered', 'delivered']);
  assert.equal(snap.wakes.length, 1);
  assert.equal(Object.hasOwn(snap.wakes[0], 'state'), false);
  assert.deepEqual(snap.reads.map((row) => row.state), ['read']);
  assert.equal(snap.reads[0].alg, 'Ed25519');
  assert.equal(snap.reads[0].scopeVerified, true);
  assert.equal(snap.reads[0].scope, PILOT_SCOPE);
  assert.deepEqual(snap.claims.map((row) => row.state), ['claimed']);
  assert.equal(snap.wakes[0].desk, OPTED_IN_DESK);
  assert.equal(snap.blocked.some((row) => row.desk === '@unopted-desk'), false);
});

test('a tampered field or an out-of-scope card cannot claim', () => {
  const tampered = { ...fixture.card, title: 'Staging doorbell read tampered' };
  const tamperedPilot = createDoorbellPilot();
  const tamperedDelivery = tamperedPilot.deliver(signed(tampered));
  const tamperedClaim = tamperedPilot.operatorClaim({ ...signed(tampered), operatorId: 'staging-operator' });
  assert.equal(tamperedDelivery.reason, 'signature_invalid');
  assert.equal(tamperedDelivery.wakes, 0);
  assert.equal(tamperedClaim.ok, false);
  assert.equal(tamperedClaim.reason, 'signature_invalid');
  assert.equal(tamperedClaim.claims, 0);

  const brokenBody = { ...fixture.card, body: `${fixture.card.body} @unopted-desk again` };
  const bodyClaim = createDoorbellPilot().operatorClaim({ ...signed(brokenBody), operatorId: 'staging-operator' });
  assert.equal(bodyClaim.reason, 'signature_invalid');
  assert.equal(bodyClaim.claims, 0);

  const outside = { ...fixture.card, scope: 'loom-doorbell-pilot:execute' };
  const outsideSignature = signCard(outside, fixture.syntheticSigningKey.secretKey);
  const outsideVerified = verifyCard(outside, { publicKey: PINNED_PUBLIC_KEY, signature: outsideSignature });
  assert.equal(outsideVerified.signatureOk, true);
  assert.equal(outsideVerified.scopeOk, false);
  const outsidePilot = createDoorbellPilot();
  const outsideDelivery = outsidePilot.deliver(signed(outside, outsideSignature));
  const outsideClaim = outsidePilot.operatorClaim({ ...signed(outside, outsideSignature), operatorId: 'staging-operator' });
  assert.equal(outsideDelivery.reason, 'out_of_scope');
  assert.equal(outsideDelivery.wakes, 0);
  assert.equal(outsideDelivery.reads, 0);
  assert.equal(outsideClaim.ok, false);
  assert.equal(outsideClaim.reason, 'out_of_scope');
  assert.equal(outsideClaim.claims, 0);
});

test('a verified read is not a claim', () => {
  const pilot = createDoorbellPilot();
  pilot.deliver(signed(fixture.card));
  const early = pilot.operatorClaim({ ...signed(fixture.card), operatorId: '' });
  assert.equal(early.reason, 'operator_required');
  assert.equal(early.claims, 0);
  const unread = createDoorbellPilot().operatorClaim({ ...signed(fixture.card), operatorId: 'staging-operator' });
  assert.equal(unread.reason, 'not_read');
  assert.equal(unread.claims, 0);
});

test('the pilot module does not reach storage, webhooks, or the atomic rehearsal', () => {
  const src = readFileSync(join(root, 'src/lib/loom/doorbell-pilot.mjs'), 'utf8');
  assert.match(src, /webhookDeliveryEnabled: false/);
  assert.match(src, /liveWritesEnabled: false/);
  assert.equal(src.includes('service.mjs'), false);
  assert.equal(src.includes('atomic.mjs'), false);
  assert.equal(src.includes('fetch('), false);
  assert.equal(src.includes("from 'node:fs'"), false);
});

test('the replay script reports the same counts', () => {
  const report = runDoorbellPilotReplay(fixture);
  assert.equal(report.ok, true, report.failures.join('\n'));
  assert.deepEqual(report.unopted, { deliveries: 0, wakes: 0, reads: 0, claims: 0 });
  assert.deepEqual(report.delivery1, { deliveries: 1, wakes: 1, reads: 1, claims: 0, readCheck: 'ed25519+scope' });
  assert.deepEqual(report.replay2, { deliveries: 2, wakes: 1, reads: 1, claims: 0 });
  assert.deepEqual(report.claim, { claims: 1, idempotent: false });
  assert.deepEqual(report.replay3, { deliveries: 3, wakes: 1, reads: 1, claims: 1, idempotent: true });
  assert.deepEqual(report.tampered, { reason: 'signature_invalid', claims: 0, wakes: 0 });
  assert.deepEqual(report.outOfScope, { reason: 'out_of_scope', claims: 0, wakes: 0 });
  assert.match(report.text, /result: ok\n$/);

  const run = spawnSync(process.execPath, [join(root, 'scripts/run-doorbell-pilot-replay.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, report.text);
});
