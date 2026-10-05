import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import grok from '../src/content/standards/examples/grok.json' with { type: 'json' };
import {
  attestationPresent,
  canonicalPassport,
  classifyPassportLine,
  parsePassportLines,
  scorePassport,
  sha256Hex,
  validatePassport,
  verifyEd25519Signature,
} from '../src/lib/passport-check.mjs';

const GROK_LINE = 'passport: v=0.1 name=grok level=self-declared uri=https://pointcast.xyz/standards/agent-identity/examples/grok.json';

test('grok example is a valid self-declared passport', () => {
  const errors = validatePassport(grok);
  assert.deepEqual(errors, []);
  const score = scorePassport(grok, errors, { ok: false }, { present: false }, []);
  assert.equal(score.levels['self-declared'], true);
  assert.equal(score.levels['key-signed'], false);
  assert.equal(score.levels['registered-onchain'], false);
  assert.equal(score.reached, 'self-declared');
});

test('a passport line without a hash is a sighting, not registered-onchain', async () => {
  const hash = await sha256Hex(canonicalPassport(grok));
  const [fields] = parsePassportLines(`Intro\n\n${GROK_LINE}\n`);
  const classified = classifyPassportLine(grok, fields, hash);
  assert.equal(classified.cited, true);
  assert.equal(classified.hashMatches, false);
  const score = scorePassport(grok, [], { ok: false }, { present: false }, [{ ...classified, height: 552 }]);
  assert.equal(score.cited, true);
  assert.equal(score.registered, false);
  assert.equal(score.reached, 'self-declared');
});

test('a matching declaration hash lights registered-onchain', async () => {
  const hash = await sha256Hex(canonicalPassport(grok));
  const line = `${GROK_LINE} hash=${hash}`;
  const [fields] = parsePassportLines(line);
  const classified = classifyPassportLine(grok, fields, hash);
  assert.equal(classified.hashMatches, true);
  const score = scorePassport(grok, [], { ok: false }, { present: false }, [classified]);
  assert.equal(score.reached, 'registered-onchain');
});

test('a mismatched uri does not count as the same record', async () => {
  const hash = await sha256Hex(canonicalPassport(grok));
  const [fields] = parsePassportLines('passport: v=0.1 name=grok uri=https://example.invalid/grok.json hash=' + hash);
  const classified = classifyPassportLine(grok, fields, hash);
  assert.equal(classified.cited, false);
  assert.equal(classified.hashMatches, false);
});

test('ed25519 signature over the canonical passport verifies', async () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const der = publicKey.export({ format: 'der', type: 'spki' });
  const raw = der.subarray(der.length - 32);
  const message = canonicalPassport(grok);
  const sig = sign(null, Buffer.from(message), privateKey);
  const result = await verifyEd25519Signature(Buffer.from(raw).toString('hex'), sig.toString('hex'), message);
  assert.equal(result.ok, true);
  const wrong = await verifyEd25519Signature(Buffer.from(raw).toString('hex'), sig.toString('hex'), `${message} `);
  assert.equal(wrong.ok, false);
});

test('an eas UID or attestation object counts as present, not as verified', () => {
  assert.equal(attestationPresent(grok).present, false);
  assert.equal(attestationPresent({ ethereum: { easUID: '0xabc' } }).present, true);
  assert.equal(attestationPresent({ attestation: { by: 'Mike Hoydich', statement: 'I operate this agent.' } }).where, 'attestation.by');
});

test('missing required fields are named', () => {
  const errors = validatePassport({ schema: 'nope', name: 'x' });
  assert.ok(errors.some((error) => error.includes('schema')));
  assert.ok(errors.some((error) => error.includes('name')));
  assert.ok(errors.some((error) => error.includes('operator')));
});
