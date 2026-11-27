import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { canonicalTask, createPilot, DESK, ISSUER, OPERATOR } from '../src/lib/loom/doorbell-pilot.mjs';

export const fixture = JSON.parse(readFileSync(new URL('../fixtures/loom-doorbell-pilot-card.json', import.meta.url), 'utf8'));
export function diskStore(path) {
  return {
    load() {
      try { return JSON.parse(readFileSync(path, 'utf8')); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    save(journal) {
      writeFileSync(path + '.next', JSON.stringify(journal), { mode: 0o600 });
      renameSync(path + '.next', path);
    },
  };
}
export function syntheticSigner() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  return {
    publicKeyPem,
    card(changes) {
      const signedFields = { ...fixture.signedFields, ...changes };
      return { ...fixture, signedFields, publicKeyPem, signature: sign(null, canonicalTask(signedFields), privateKey).toString('base64') };
    },
  };
}
export function event(eventId = 'evt_pilot_001', cursor = 1, cardRef = fixture.signedFields.cardId) {
  return { desk: DESK, holderGeneration: 1, eventId, cardRef, cursor, createdAt: '2026-11-27T12:01:00.000Z' };
}
function report(label, result, expected, error = null) {
  const [delivered, wake, read, claimed] = expected;
  assert.deepEqual(result.counts, { delivered, wake, read, claimed });
  assert.equal(result.error ?? null, error);
  console.log(label + ': ' + expected.join('/') + (error ? ' (' + error + ')' : ''));
}
function run() {
  const dir = mkdtempSync(join(tmpdir(), 'loom-doorbell-replay-'));
  try {
    const journal = join(dir, 'journal.json');
    const source = new Map([[fixture.signedFields.cardId, fixture]]);
    const reopen = () => createPilot({ store: diskStore(journal), readCard: ref => source.get(ref) });
    let pilot = reopen();
    const e = event();
    const claim = { desk: DESK, eventId: e.eventId, operatorId: OPERATOR, reason: 'Synthetic replay proof' };
    console.log('Replay Log | deliveries/wakes/verified reads/claims | 0 webhooks / 0 live writes');
    report('1. Unopted desk', pilot.deliver({ ...e, desk: '@unopted-desk' }), [0, 0, 0, 0], 'desk_not_opted_in');
    assert(pilot.deliver(e).payload);
    report('2. First delivery and verified read', pilot.read(e), [1, 1, 1, 0]);
    pilot = reopen();
    report('3. Same event after journal reopen', pilot.deliver(e), [2, 1, 1, 0]);
    report('4. Explicit operator claim', pilot.operatorClaim(claim), [2, 1, 1, 1]);
    assert.equal(pilot.operatorClaim(claim).duplicate, true);
    pilot = reopen();
    report('5. Same event after claim and journal reopen', pilot.deliver(e), [3, 1, 1, 1]);
    const damaged = { ...fixture, signedFields: { ...fixture.signedFields, title: 'Changed after signing' } };
    const bad = event('evt_tampered');
    const tamper = createPilot({ store: diskStore(join(dir, 'tamper.json')), readCard: () => damaged });
    assert(tamper.deliver(bad).ok);
    report('6a. Tampered read', tamper.read(bad), [1, 1, 0, 0], 'signature_invalid');
    report('6b. Tampered claim', tamper.operatorClaim({ ...claim, eventId: bad.eventId }), [1, 1, 0, 0], 'signature_invalid');
    const signer = syntheticSigner();
    const blocked = signer.card({ scope: 'tezos:spend' });
    const out = event('evt_out_of_scope');
    const scoped = createPilot({ store: diskStore(join(dir, 'scope.json')), readCard: () => blocked,
      issuerPins: [[ISSUER, signer.publicKeyPem]] });
    assert(scoped.deliver(out).ok);
    report('7a. Out-of-scope signed read', scoped.read(out), [1, 1, 0, 0], 'scope_not_allowed');
    report('7b. Out-of-scope claim', scoped.operatorClaim({ ...claim, eventId: out.eventId }), [1, 1, 0, 0], 'scope_not_allowed');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run();
