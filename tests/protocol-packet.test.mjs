import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

if (!globalThis.btoa) {
  Object.defineProperty(globalThis, 'btoa', {
    value: (value) => Buffer.from(value, 'binary').toString('base64'),
  });
}

if (!globalThis.atob) {
  Object.defineProperty(globalThis, 'atob', {
    value: (value) => Buffer.from(value, 'base64').toString('binary'),
  });
}

const protocol = await import('../src/lib/protocol-packet.js');

test('canonicalJson sorts nested object keys', () => {
  const a = protocol.canonicalJson({ z: 1, a: { b: 2, a: 1 }, m: [ { z: 1, a: 2 } ] });
  const b = protocol.canonicalJson({ m: [ { a: 2, z: 1 } ], a: { a: 1, b: 2 }, z: 1 });
  assert.equal(a, b);
  assert.equal(a, '{"a":{"a":1,"b":2},"m":[{"a":2,"z":1}],"z":1}');
});

test('signed packet validates, verifies, and derives a stable id', async (t) => {
  let identity;
  try {
    identity = await protocol.generatePeerIdentity({ displayName: 'test peer', kind: 'agent' });
  } catch (err) {
    t.skip(`WebCrypto Ed25519 unavailable: ${err?.message || err}`);
    return;
  }

  const draft = protocol.buildPacketDraft({
    from: identity.peerId,
    to: [],
    body: 'signed test packet',
    topic: 'pcp/test',
    createdAt: '2026-04-27T12:00:00.000Z',
  });

  const signed = await protocol.signPacket(draft, identity.privateKey);
  assert.match(signed.id, /^pc1:[a-z2-7]{52}$/);
  assert.equal(protocol.validatePacket(signed, { requireSignature: true }).ok, true);
  assert.deepEqual(await protocol.verifyPacketSignature(signed), { ok: true, errors: [] });

  const changedSignature = {
    ...signed,
    signature: {
      alg: 'Ed25519',
      value: `${signed.signature.value.slice(0, -1)}${signed.signature.value.endsWith('a') ? 'b' : 'a'}`,
    },
  };
  const bad = await protocol.verifyPacketSignature(changedSignature);
  assert.equal(bad.ok, false);
});

test('packet id ignores id and signature material', async (t) => {
  let identity;
  try {
    identity = await protocol.generatePeerIdentity({ displayName: 'stable id', kind: 'human' });
  } catch (err) {
    t.skip(`WebCrypto Ed25519 unavailable: ${err?.message || err}`);
    return;
  }

  const draft = protocol.buildPacketDraft({
    from: identity.peerId,
    body: 'same material',
    createdAt: '2026-04-27T12:00:00.000Z',
  });

  const first = await protocol.derivePacketId(draft);
  const second = await protocol.derivePacketId({
    ...draft,
    id: 'pc1:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    signature: { alg: 'Ed25519', value: 'ignored' },
  });

  assert.equal(first, second);
});

test('JSONL export/import round-trips packets', async (t) => {
  let identity;
  try {
    identity = await protocol.generatePeerIdentity({ displayName: 'jsonl peer', kind: 'human' });
  } catch (err) {
    t.skip(`WebCrypto Ed25519 unavailable: ${err?.message || err}`);
    return;
  }

  const packet = await protocol.signPacket(
    protocol.buildPacketDraft({
      from: identity.peerId,
      body: 'jsonl packet',
      createdAt: '2026-04-27T12:00:00.000Z',
    }),
    identity.privateKey,
  );

  const jsonl = protocol.serializePacketsJsonl([packet]);
  const parsed = protocol.parsePacketsJsonl(jsonl);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, packet.id);
});

test('friend cards encode, parse, and validate', async (t) => {
  let identity;
  try {
    identity = await protocol.generatePeerIdentity({ displayName: 'friend peer', kind: 'human' });
  } catch (err) {
    t.skip(`WebCrypto Ed25519 unavailable: ${err?.message || err}`);
    return;
  }

  const card = protocol.buildFriendCard(identity, {
    relay: 'https://pointcast.xyz/api/pcp/relay',
    topic: 'pcp/test/friends',
    createdAt: '2026-04-28T12:00:00.000Z',
  });
  const encoded = protocol.encodeFriendCard(card);
  assert.match(encoded, /^pcp-friend:/);
  assert.deepEqual(protocol.parseFriendCard(encoded), card);
  assert.deepEqual(protocol.parseFriendCard(JSON.stringify(card)), card);
  assert.equal(protocol.validateFriendCard({ ...card, peerId: 'peer:nope' }).ok, false);
});

test('chain registrations and envelopes hash signed packets without plaintext by default', async (t) => {
  let identity;
  try {
    identity = await protocol.generatePeerIdentity({ displayName: 'chain peer', kind: 'human' });
  } catch (err) {
    t.skip(`WebCrypto Ed25519 unavailable: ${err?.message || err}`);
    return;
  }

  const registration = await protocol.buildChainRegistration(identity, {
    walletAddress: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw',
    createdAt: '2026-04-28T12:00:00.000Z',
  });
  assert.match(registration.id, /^pcr:[a-f0-9]{64}$/);
  assert.equal(protocol.validateChainRegistration(registration).ok, true);

  const packet = await protocol.signPacket(
    protocol.buildPacketDraft({
      from: identity.peerId,
      to: [identity.peerId],
      body: 'private chain message',
      visibility: 'private',
      createdAt: '2026-04-28T12:01:00.000Z',
    }),
    identity.privateKey,
  );

  const envelope = await protocol.buildChainEnvelope(packet, {
    registrationId: registration.id,
    mode: 'private-hash',
    createdAt: '2026-04-28T12:02:00.000Z',
  });
  assert.match(envelope.id, /^pce:[a-f0-9]{64}$/);
  assert.equal(envelope.body, undefined);
  assert.equal(envelope.packetSignature.alg, 'Ed25519');
  assert.equal(protocol.validateChainEnvelope(envelope).ok, true);
  assert.equal(protocol.validateChainEnvelope({ ...envelope, body: 'leak' }).ok, false);
  assert.equal(protocol.validateChainEnvelope({ ...envelope, packetSignature: null }).ok, false);

  const handoff = await protocol.buildChainHandoff({
    packet,
    envelope,
    registration,
    createdAt: '2026-04-28T12:03:00.000Z',
  });
  assert.match(handoff.id, /^pch:[a-f0-9]{64}$/);
  assert.equal(protocol.validateChainHandoff(handoff).ok, true);
  assert.deepEqual(await protocol.verifyChainHandoff(handoff), { ok: true, errors: [] });

  const encoded = protocol.encodeChainHandoff(handoff);
  assert.match(encoded, /^pcp-chain:/);
  assert.deepEqual(protocol.parseChainHandoff(encoded), handoff);
  assert.deepEqual(protocol.parseChainHandoffsJsonl(protocol.serializeChainHandoffsJsonl([handoff])), [handoff]);

  const tampered = await protocol.verifyChainHandoff({
    ...handoff,
    packet: { ...packet, body: 'tampered private chain message' },
  });
  assert.equal(tampered.ok, false);
});

test('invalid packets are rejected with useful errors', () => {
  const result = protocol.validatePacket({
    version: 'nope',
    id: 'bad',
    from: 'person',
    to: ['peer:unknown'],
    createdAt: 'not-a-date',
    channel: 'NO',
    type: 'NO',
    body: '',
    permissions: { visibility: 'secret', agentReadable: 'yes' },
    transport: {},
    refs: 'no',
  }, { requireSignature: true });

  assert.equal(result.ok, false);
  assert.ok(result.errors.length >= 8);
});
