import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPilot, DESK, ISSUER, OPERATOR } from '../src/lib/loom/doorbell-pilot.mjs';
import { diskStore, event, fixture, syntheticSigner } from '../scripts/run-doorbell-pilot-replay.mjs';

const claim = (e, overrides) => ({ desk: e.desk, eventId: e.eventId, operatorId: OPERATOR,
  reason: 'Review the synthetic postcard', ...overrides });
function setup(t, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'loom-doorbell-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'journal.json');
  let card = structuredClone(fixture);
  const open = () => createPilot({ store: diskStore(file), readCard: () => card, ...options });
  return { p: open(), open, file, setCard: value => { card = value; } };
}
const count = ({ counts }) => [counts.delivered, counts.wake, counts.read, counts.claimed];

test('rejects live flags and requires local adapters', () => {
  for (const flag of ['liveWritesEnabled', 'webhookDeliveryEnabled']) {
    assert.throws(() => createPilot({ [flag]: true }), /offline_flags_required/);
  }
  assert.throws(() => createPilot(), /offline_adapters_required/);
});
test('unopted mention does not route; wake exposes only the documented pointer', t => {
  const { p } = setup(t);
  const e = event();
  const denied = p.deliver({ ...e, desk: '@unopted-desk' });
  assert.equal(denied.error, 'desk_not_opted_in');
  assert.deepEqual(count(denied), [0, 0, 0, 0]);
  const delivered = p.deliver({ ...e, body: fixture.body, secret: 'must-not-copy' });
  assert.deepEqual(Object.keys(delivered.payload), ['version', 'subscriptionId', 'eventId', 'wakeId',
    'holderGeneration', 'inbox', 'cursor', 'cardRef', 'createdAt']);
  assert.equal(delivered.payload.inbox, DESK);
  assert.match(fixture.body, /@unopted-desk/);
  assert.equal(JSON.stringify(delivered.payload).includes('@unopted-desk'), false);
  assert.deepEqual(count(delivered), [1, 1, 0, 0]);
  assert.equal(p.operatorClaim(claim(e)).error, 'verified_read_required');
  assert.deepEqual(count(p.read(e)), [1, 1, 1, 0]);
});
test('deduplicates over a process restart, before and after explicit claim', t => {
  const { p, open, file } = setup(t);
  const e = event();
  p.deliver(e);
  p.read(e);
  const script = new URL('../scripts/run-doorbell-pilot-replay.mjs', import.meta.url).href;
  const lib = new URL('../src/lib/loom/doorbell-pilot.mjs', import.meta.url).href;
  const childReplay = () => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
    `import {diskStore, event, fixture} from ${JSON.stringify(script)};
     import {createPilot} from ${JSON.stringify(lib)};
     console.log(JSON.stringify(createPilot({store:diskStore(process.argv[1]),readCard:()=>fixture}).deliver(event())));`,
    file], { encoding: 'utf8' }));
  assert.deepEqual(count(childReplay()), [2, 1, 1, 0]);
  assert.equal(open().operatorClaim(claim(e, { operatorId: 'unverified' })).error, 'operator_required');
  assert.equal(open().operatorClaim(claim(e, { reason: '' })).error, 'operator_required');
  assert.deepEqual(count(open().operatorClaim(claim(e))), [2, 1, 1, 1]);
  assert.equal(open().operatorClaim(claim(e)).duplicate, true);
  assert.deepEqual(count(childReplay()), [3, 1, 1, 1]);
  assert.equal(open().deliver({ ...e, cursor: 2 }).error, 'event_id_conflict');
});
test('refuses modified canonical fields, modified body, embedded foreign key, and extra fields', t => {
  const cases = [
    [{ ...fixture, signedFields: { ...fixture.signedFields, title: 'changed' } }, 'signature_invalid'],
    [{ ...fixture, body: 'changed' }, 'body_hash_invalid'],
    [syntheticSigner().card({}), 'issuer_untrusted'],
    [{ ...fixture, signedFields: { ...fixture.signedFields, assignee: DESK } }, 'signed_fields_invalid'],
    [{ ...fixture, signedFields: { ...fixture.signedFields, '@mention': DESK } }, 'signed_fields_invalid'],
  ];
  for (const [card, error] of cases) {
    const { p, setCard } = setup(t);
    setCard(card);
    const e = event();
    p.deliver(e);
    assert.equal(p.read(e).error, error);
    assert.equal(p.operatorClaim(claim(e)).error, error);
    assert.deepEqual(count(p.operatorClaim(claim(e))), [1, 1, 0, 0]);
  }
});
test('re-verifies source at claim time and refuses even a valid replacement under the same ID', t => {
  const signer = syntheticSigner();
  const { p, setCard } = setup(t, { issuerPins: [[ISSUER, signer.publicKeyPem]] });
  const original = signer.card({});
  setCard(original);
  const e = event();
  p.deliver(e);
  assert(p.read(e).ok);
  setCard({ ...original, signedFields: { ...original.signedFields, room: '#elsewhere' } });
  assert.equal(p.operatorClaim(claim(e)).error, 'signature_invalid');
  setCard(signer.card({ title: 'Resigned after read' }));
  assert.equal(p.operatorClaim(claim(e)).error, 'card_changed_since_read');
  setCard(original);
  assert.deepEqual(count(p.operatorClaim(claim(e))), [1, 1, 1, 1]);
});
test('a valid signed spend card fails the desk scope charter', t => {
  const signer = syntheticSigner();
  const { p, setCard } = setup(t, { issuerPins: [[ISSUER, signer.publicKeyPem]] });
  setCard(signer.card({ scope: 'tezos:spend' }));
  const e = event();
  p.deliver(e);
  assert.equal(p.read(e).error, 'scope_not_allowed');
  assert.equal(p.operatorClaim(claim(e)).error, 'scope_not_allowed');
});
test('stale holder generation cannot deliver, read, acknowledge, resume or claim an old event', t => {
  const { p, file } = setup(t);
  const e = event();
  const stale = { ...e, holderGeneration: 0 };
  assert.equal(p.deliver(stale).error, 'holder_generation_stale');
  const { payload } = p.deliver(e);
  assert.equal(p.read(stale).error, 'holder_generation_stale');
  assert.equal(p.acknowledge({ ...stale, wakeId: payload.wakeId, outcome: 'empty' }).error, 'holder_generation_stale');
  assert.equal(p.operatorResume({ ...stale, operatorId: OPERATOR }).error, 'holder_generation_stale');
  const nextHolder = createPilot({ store: diskStore(file), readCard: () => fixture,
    desks: [{ desk: DESK, holderGeneration: 2, scopes: ['loom:staging-pilot-read'], operators: [OPERATOR] }] });
  assert.equal(nextHolder.operatorClaim(claim(e)).error, 'holder_generation_stale');
});
test('only completed distinct reads count as empty; work resets and third empty sleeps', t => {
  const { p, setCard, open } = setup(t);
  function scan(n, outcome) {
    const e = event('evt_' + n, n);
    const { payload } = p.deliver(e);
    const ack = { ...e, wakeId: payload.wakeId, outcome };
    assert.equal(p.acknowledge(ack).error, 'scan_incomplete_or_outcome_mismatch');
    setCard(null);
    assert.equal(p.read(e).error, 'card_unavailable');
    assert.equal(p.acknowledge(ack).error, 'scan_incomplete_or_outcome_mismatch');
    setCard(outcome === 'work' ? fixture : { ...fixture, body: 'invalid' });
    p.read(e);
    const result = p.acknowledge(ack);
    assert.equal(p.acknowledge(ack).duplicate, true);
    return result;
  }
  assert.equal(scan(1, 'empty').empty, 1);
  assert.equal(scan(2, 'work').empty, 0);
  assert.equal(scan(3, 'empty').empty, 1);
  assert.equal(scan(4, 'empty').empty, 2);
  assert.equal(scan(5, 'empty').status, 'SLEEPING');
  const after = open();
  assert.equal(after.deliver(event('evt_6', 6)).error, 'subscription_sleeping');
  assert.equal(after.operatorResume({ desk: DESK, holderGeneration: 1, operatorId: 'wrong' }).error, 'operator_required');
  assert.equal(after.operatorResume({ desk: DESK, holderGeneration: 1, operatorId: OPERATOR }).status, 'ACTIVE');
  assert.deepEqual(count(after.deliver(event('evt_6', 6))), [1, 1, 0, 0]);
});
test('replay script reports the expected proof and no network activity', () => {
  const output = execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/run-doorbell-pilot-replay.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.match(output, /0 webhooks \/ 0 live writes/);
  assert.match(output, /First delivery and verified read: 1\/1\/1\/0/);
  assert.match(output, /Same event after journal reopen: 2\/1\/1\/0/);
  assert.match(output, /Explicit operator claim: 2\/1\/1\/1/);
  assert.match(output, /Same event after claim and journal reopen: 3\/1\/1\/1/);
  assert.match(output, /scope_not_allowed/);
});
