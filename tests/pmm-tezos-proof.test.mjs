// public/pmm/tezos-proof.js checks, with no wallet library, that a PMM identity holds a tz1 address.
// Every function is cross-checked here against @taquito/utils and @taquito/signer on real keys.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { InMemorySigner } from '@taquito/signer';
import U from '@taquito/utils';
import { blake2b, tz1OfPk, verifyEd25519, signedMessagePayload, proofMessage, verifyAddressProof, PROOF_DOMAIN } from '../public/pmm/tezos-proof.js';

const { getPkhfromPk, verifySignature, b58Encode, PrefixV2 } = U;
const newSigner = () => InMemorySigner.fromSecretKey(b58Encode(randomBytes(32), PrefixV2.Ed25519Seed));
const ID = 'ab'.repeat(32);

test('BLAKE2b matches the RFC 7693 vector and the lengths Tezos uses', () => {
  assert.equal(Buffer.from(blake2b(new TextEncoder().encode('abc'), 64)).toString('hex'), 'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923');
  assert.equal(blake2b(new Uint8Array(0), 32).length, 32);
  assert.equal(blake2b(new Uint8Array(300), 20).length, 20, 'multi-block input');
});

test('the payload is the Micheline string a wallet signs for a Tezos signed message', () => {
  const payload = signedMessagePayload('PMM xtz v1 x y', '2026-10-23T00:00:00.000Z');
  const text = `Tezos Signed Message: ${PROOF_DOMAIN} 2026-10-23T00:00:00.000Z PMM xtz v1 x y`;
  assert.equal(payload, '0501' + Buffer.byteLength(text).toString(16).padStart(8, '0') + Buffer.from(text).toString('hex'));
});

test('addresses and signatures agree with Taquito on 20 random keys', async () => {
  for (let i = 0; i < 20; i++) {
    const s = await newSigner(); const pk = await s.publicKey(), pkh = await s.publicKeyHash();
    assert.equal(await tz1OfPk(pk), pkh); assert.equal(getPkhfromPk(pk), pkh);
    const payload = signedMessagePayload(proofMessage(ID, pkh), new Date(1_700_000_000_000 + i).toISOString());
    const { prefixSig } = await s.sign(payload);
    assert.equal(verifySignature(payload, pk, prefixSig), true);
    assert.equal(await verifyEd25519(payload, pk, prefixSig), true);
    assert.equal(await verifyEd25519(payload.replace(/.$/, (c) => (c === '0' ? '1' : '0')), pk, prefixSig), false, 'a changed payload');
  }
});

test('an address proof binds one PMM id to one tz1, and nothing else passes', async () => {
  const s = await newSigner(); const pk = await s.publicKey(), addr = await s.publicKeyHash();
  const at = '2026-10-23T01:02:03.456Z';
  const { prefixSig: sig } = await s.sign(signedMessagePayload(proofMessage(ID, addr), at));
  const proof = { addr, pk, sig, at };
  assert.equal(await verifyAddressProof(ID, proof), true);
  const other = await newSigner();
  assert.equal(await verifyAddressProof('cd'.repeat(32), proof), false, 'another PMM id');
  assert.equal(await verifyAddressProof(ID, { ...proof, at: '2026-10-23T01:02:03.457Z' }), false, 'another time');
  assert.equal(await verifyAddressProof(ID, { ...proof, addr: await other.publicKeyHash() }), false, 'naming someone else\'s address');
  assert.equal(await verifyAddressProof(ID, { ...proof, pk: await other.publicKey() }), false, 'someone else\'s key');
  const { prefixSig: wrongMsg } = await s.sign(signedMessagePayload(proofMessage(ID, await other.publicKeyHash()), at));
  assert.equal(await verifyAddressProof(ID, { ...proof, sig: wrongMsg }), false, 'a signature over another line');
  for (const bad of [null, {}, { ...proof, addr: 'tz2' + addr.slice(3) }, { ...proof, pk: 'edpk' }, { ...proof, sig: 'nope' }, { ...proof, at: 'yesterday' }]) assert.equal(await verifyAddressProof(ID, bad), false);
  assert.equal(await verifyAddressProof('not-hex', proof), false);
});
