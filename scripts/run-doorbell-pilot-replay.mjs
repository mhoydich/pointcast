/**
 * Local replay of the staging doorbell pilot.
 * Prints the delivery, wake, read, and claim counts. It does not send a
 * webhook or write to live storage.
 */

import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  CANONICAL_FIELDS,
  OPTED_IN_DESK,
  PILOT_FLAGS,
  PILOT_ROOM,
  PILOT_SCOPE,
  canonicalTaskBytes,
  createDoorbellPilot,
  signCard,
  untrustedMentions,
  verifyCard,
} from '../src/lib/loom/doorbell-pilot.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = join(root, 'fixtures/loom-doorbell-pilot-card.json');
const EVENT_ID = 'evt-doorbell-pilot-001';
const OPERATOR_ID = 'staging-operator';

function loadFixture() {
  return JSON.parse(readFileSync(fixturePath, 'utf8'));
}

function envelope(fixture, card, signature, desk, eventId = EVENT_ID) {
  return {
    eventId,
    desk,
    card,
    publicKey: fixture.signature.publicKey,
    signature,
  };
}

function counts(result) {
  return {
    deliveries: result.deliveries,
    wakes: result.wakes,
    reads: result.reads,
    claims: result.claims,
  };
}

export function runDoorbellPilotReplay(fixture = loadFixture()) {
  const lines = [];
  const say = (line = '') => lines.push(line);
  const failures = [];
  const expect = (cond, message) => {
    if (!cond) failures.push(message);
  };

  const card = fixture.card;
  const signature = fixture.signature.value;
  const signedBytes = canonicalTaskBytes(card).toString('utf8');
  const verdict = verifyCard(card, { publicKey: fixture.signature.publicKey, signature });

  expect(PILOT_FLAGS.webhookDeliveryEnabled === false, 'webhook delivery must stay off');
  expect(PILOT_FLAGS.liveWritesEnabled === false, 'live writes must stay off');
  expect(verdict.ok === true && verdict.signatureOk === true && verdict.scopeOk === true, 'fixture must verify');
  expect(signedBytes.includes('assignee') === false, 'assignee is not a signed field');
  expect(signedBytes.includes('@') === false, 'mentions are not signed fields');
  expect(untrustedMentions(card.body).includes('@unopted-desk'), 'body must mention @unopted-desk');
  expect(card.assignee === '@unopted-desk', 'assignee is untrusted text');

  say('loom doorbell pilot replay');
  say('fixture: fixtures/loom-doorbell-pilot-card.json');
  say(`webhookDeliveryEnabled: ${PILOT_FLAGS.webhookDeliveryEnabled}`);
  say(`liveWritesEnabled: ${PILOT_FLAGS.liveWritesEnabled}`);
  say(`optedInDesk: ${OPTED_IN_DESK}`);
  say(`room: ${PILOT_ROOM}`);
  say(`scope: ${PILOT_SCOPE}`);
  say(`signedFields: ${CANONICAL_FIELDS.join(' ')}`);
  say('assigneeSigned: false');
  say('mentionSigned: false');

  const pilot = createDoorbellPilot();
  const unopted = pilot.deliver(envelope(fixture, card, signature, '@unopted-desk'));
  expect(unopted.ok === false && unopted.reason === 'desk_not_opted_in', 'unopted desk must be blocked');
  expect(unopted.wakes === 0 && unopted.deliveries === 0 && unopted.reads === 0 && unopted.claims === 0, 'unopted mention wakes nothing');
  expect(pilot.snapshot().wakes.every((wake) => wake.desk !== '@unopted-desk'), 'no unopted wake record');

  say('');
  say('unopted @unopted-desk');
  say('  blocked: true');
  say('  deliveries: 0');
  say('  wakes: 0');
  say('  reads: 0');
  say('  claims: 0');

  const delivery1 = pilot.deliver(envelope(fixture, card, signature, OPTED_IN_DESK));
  expect(delivery1.deliveries === 1 && delivery1.wakes === 1 && delivery1.reads === 1 && delivery1.claims === 0, 'delivery 1 counts');
  expect(delivery1.readCheck === 'ed25519+scope', 'delivery 1 reads with ed25519 and scope');
  expect(delivery1.wakesForUnopted === 0 && delivery1.mentionWakes === 0, 'body mention still wakes nobody');

  say('');
  say(`delivery 1 ${EVENT_ID}`);
  say('  deliveries: 1');
  say('  wakes: 1');
  say('  reads: 1');
  say('  readCheck: ed25519+scope');
  say('  claims: 0');

  const replay2 = pilot.deliver(envelope(fixture, card, signature, OPTED_IN_DESK));
  expect(replay2.deliveries === 2 && replay2.wakes === 1 && replay2.reads === 1 && replay2.claims === 0, 'replay 2 dedupes wake and read');
  expect(replay2.duplicate === true, 'replay 2 is the same event');

  say('');
  say(`replay 2 ${EVENT_ID}`);
  say('  deliveries: 2');
  say('  wakes: 1');
  say('  reads: 1');
  say('  claims: 0');

  const claim = pilot.operatorClaim({
    ...envelope(fixture, card, signature, OPTED_IN_DESK),
    operatorId: OPERATOR_ID,
  });
  expect(claim.ok === true && claim.idempotent === false && claim.claims === 1, 'explicit claim once');
  const afterClaim = pilot.snapshot();
  expect(afterClaim.deliveries.every((row) => row.state === 'delivered'), 'claim does not rewrite deliveries');
  expect(afterClaim.reads.every((row) => row.state === 'read'), 'claim does not rewrite reads');
  expect(afterClaim.claims.length === 1 && afterClaim.claims[0].state === 'claimed', 'claim is its own record');

  say('');
  say('operatorClaim');
  say('  claims: 1');
  say('  idempotent: false');

  const replay3 = pilot.deliver(envelope(fixture, card, signature, OPTED_IN_DESK));
  const claimAgain = pilot.operatorClaim({
    ...envelope(fixture, card, signature, OPTED_IN_DESK),
    operatorId: 'other-operator',
  });
  expect(replay3.deliveries === 3 && replay3.wakes === 1 && replay3.reads === 1 && replay3.claims === 1, 'replay 3 keeps one claim');
  expect(claimAgain.ok === true && claimAgain.idempotent === true && claimAgain.claims === 1, 'replay 3 claim is idempotent');
  expect(claimAgain.claim.operatorId === OPERATOR_ID, 'idempotent claim keeps the first operator');

  say('');
  say(`replay 3 ${EVENT_ID}`);
  say('  deliveries: 3');
  say('  wakes: 1');
  say('  reads: 1');
  say('  claims: 1');
  say('  operatorClaim: idempotent');
  say('  claims: 1');

  const tamperedCard = { ...card, title: `${card.title} tampered` };
  const tamperedPilot = createDoorbellPilot();
  const tamperedDelivery = tamperedPilot.deliver(envelope(fixture, tamperedCard, signature, OPTED_IN_DESK));
  const tamperedClaim = tamperedPilot.operatorClaim({
    ...envelope(fixture, tamperedCard, signature, OPTED_IN_DESK),
    operatorId: OPERATOR_ID,
  });
  expect(tamperedDelivery.ok === false && tamperedDelivery.reason === 'signature_invalid', 'tampered card is not delivered');
  expect(tamperedDelivery.wakes === 0 && tamperedDelivery.deliveries === 0, 'tampered card does not wake');
  expect(tamperedClaim.ok === false && tamperedClaim.reason === 'signature_invalid' && tamperedClaim.claims === 0, 'tampered card cannot claim');

  say('');
  say('tampered title');
  say('  claim: refused');
  say('  reason: signature_invalid');
  say('  claims: 0');

  const outside = { ...card, scope: 'loom-doorbell-pilot:execute' };
  const outsideSignature = signCard(outside, fixture.syntheticSigningKey.secretKey);
  const outsidePilot = createDoorbellPilot();
  const outsideDelivery = outsidePilot.deliver(envelope(fixture, outside, outsideSignature, OPTED_IN_DESK));
  const outsideClaim = outsidePilot.operatorClaim({
    ...envelope(fixture, outside, outsideSignature, OPTED_IN_DESK),
    operatorId: OPERATOR_ID,
  });
  expect(outsideDelivery.ok === false && outsideDelivery.reason === 'out_of_scope', 'out-of-scope card is not delivered');
  expect(outsideDelivery.wakes === 0, 'out-of-scope card does not wake');
  expect(outsideClaim.ok === false && outsideClaim.reason === 'out_of_scope' && outsideClaim.claims === 0, 'out-of-scope card cannot claim');

  say('');
  say('out-of-scope');
  say('  claim: refused');
  say('  reason: out_of_scope');
  say('  claims: 0');
  say('');
  say(failures.length === 0 ? 'result: ok' : 'result: failed');
  if (failures.length) say(failures.map((message) => `  ${message}`).join('\n'));

  return {
    ok: failures.length === 0,
    text: `${lines.join('\n')}\n`,
    failures,
    unopted: counts(unopted),
    delivery1: { ...counts(delivery1), readCheck: delivery1.readCheck },
    replay2: counts(replay2),
    claim: { claims: claim.claims, idempotent: claim.idempotent },
    replay3: { ...counts(replay3), claims: claimAgain.claims, idempotent: claimAgain.idempotent },
    tampered: { reason: tamperedClaim.reason, claims: tamperedClaim.claims, wakes: tamperedDelivery.wakes },
    outOfScope: { reason: outsideClaim.reason, claims: outsideClaim.claims, wakes: outsideDelivery.wakes },
  };
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
if (invoked) {
  const report = runDoorbellPilotReplay();
  process.stdout.write(report.text);
  process.exit(report.ok ? 0 : 1);
}
