import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { onRequest } from '../functions/api/loom/root.ts';
import {
  DELIMITER_NOTE,
  LEAF_DELIMITER,
  LEAF_FIELDS,
  RECIPE,
  SPEC,
  buildMerkle,
  bytesToBase64,
  canonicalLeafFields,
  deskPayload,
  emptyRoot,
  formatLoomRootNote,
  generateDeskKeyPair,
  hashLeaf,
  inclusionProof,
  keysFromAgentsManifest,
  leafPreimage,
  loomRootNote,
  merkleNode,
  merkleRoot,
  officenounStatusLeaf,
  parseOfficenounStatusId,
  rootKvKey,
  serveLoomRoot,
  signDeskMessage,
  verifyDeskMessage,
  verifyInclusion,
} from '../src/lib/loom/loom-root.mjs';

const DAY = '2026-11-27';
const A = { id: 'm_alpha', at: '2026-11-27T15:00:00.000Z', kind: 'timestamp', address: '#loom' };
const B = { id: 'm_bravo', at: '2026-11-27T16:04:05.000Z', kind: 'timestamp', address: '#officenoun' };
const C = { id: 'm_charlie', at: '2026-11-27T18:30:00.000Z', address: 'https://pointcast.xyz/loom' };

function memoryKv(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    puts: 0,
    async get(key, type) {
      const value = map.get(key);
      if (value === undefined) return null;
      if (type === 'json') return JSON.parse(value);
      return value;
    },
    async put() { this.puts += 1; },
  };
}

test('the leaf preimage is the documented field order and provisional delimiter', () => {
  const bytes = leafPreimage(A);
  assert.equal(bytes[0], 0x00);
  assert.equal(LEAF_DELIMITER, 0x1f);
  assert.deepEqual(LEAF_FIELDS, ['version', 'day', 'at', 'kind', 'id', 'address']);
  const text = new TextDecoder().decode(bytes.subarray(1));
  assert.equal(text, ['1', DAY, '2026-11-27T15:00:00.000Z', 'timestamp', 'm_alpha', '#loom'].join('\u001f'));
  assert.match(DELIMITER_NOTE, /0x1f/);
  assert.match(DELIMITER_NOTE, /root #1/);
  assert.equal(RECIPE.delimiterStatus, 'provisional');
  assert.equal(RECIPE.oddNode, 'promoted unchanged');
});

test('a different delimiter changes the leaf hash and the default stays 0x1f', async () => {
  const standard = Buffer.from(await hashLeaf(A)).toString('hex');
  const shifted = Buffer.from(await hashLeaf(A, 0x7c)).toString('hex');
  assert.notEqual(standard, shifted);
  assert.equal(leafPreimage(A, 0x7c)[0], 0x00);
  assert.ok(leafPreimage(A, 0x7c).includes(0x7c));
  assert.equal(canonicalLeafFields({ ...A, sig: 'ignored', handle: '@someone' }).id, 'm_alpha');
});

test('merkle roots are deterministic, deduped, and promote an odd node unchanged', async () => {
  const forward = await merkleRoot([A, B, C]);
  const backward = await merkleRoot([C, B, A, { ...A }]);
  assert.equal(forward.root, backward.root);
  assert.equal(forward.leafCount, 3);
  assert.equal(backward.leafCount, 3);
  assert.equal(forward.empty, false);
  assert.deepEqual(forward.leaves.map((leaf) => leaf.leafHash), [...forward.leaves].sort((a, b) => a.leafHash < b.leafHash ? -1 : 1).map((leaf) => leaf.leafHash));

  const empty = await merkleRoot([]);
  assert.equal(empty.root, await emptyRoot());
  assert.equal(empty.root, '37cc7bd8796d8ea087a27d0bc720632e8be408037e01ab013345e6a8d7463761');
  assert.equal(empty.leafCount, 0);
  const one = await merkleRoot([A]);
  assert.equal(one.root, '5cc06b64ca2a640b5495a0a12fe8440e94d418aad393f14602e53bbc5e2921c5');
  assert.notEqual(empty.root, one.root);

  const single = await buildMerkle([B]);
  assert.equal(single.root, single.leaves[0].leafHash);

  const three = await buildMerkle([A, B, C]);
  const [first, second, third] = three.leaves;
  const paired = await merkleNode(first.leafHash, second.leafHash);
  assert.equal(three.root, await merkleNode(paired, third.leafHash));
  const duplicated = await merkleNode(paired, await merkleNode(third.leafHash, third.leafHash));
  assert.notEqual(three.root, duplicated);
});

test('inclusion proofs verify and reject a tampered sibling, leaf, or root', async () => {
  const leaves = [A, B, C];
  const tree = await merkleRoot(leaves);
  for (const leaf of tree.leaves) {
    const proof = await inclusionProof(leaves, leaf.id);
    assert.equal(proof.found, true);
    assert.equal(proof.valid, true);
    assert.equal(await verifyInclusion(proof), true);
    assert.equal(proof.root, tree.root);
    assert.equal(proof.leafCount, 3);
  }

  const proof = await inclusionProof(leaves, 'm_bravo');
  const flipped = proof.siblings[0].hash.slice(0, -1) + (proof.siblings[0].hash.endsWith('0') ? '1' : '0');
  assert.equal(await verifyInclusion({ ...proof, siblings: [{ ...proof.siblings[0], hash: flipped }, ...proof.siblings.slice(1)] }), false);
  assert.equal(await verifyInclusion({ ...proof, leafHash: tree.leaves.find((leaf) => leaf.id !== 'm_bravo').leafHash }), false);
  assert.equal(await verifyInclusion(proof, `${'ab'.repeat(32)}`), false);
  assert.equal(await verifyInclusion({ ...proof, siblings: [...proof.siblings, { hash: proof.leafHash, position: 'right' }] }), false);
  assert.equal((await inclusionProof(leaves, 'm_missing')).found, false);
  assert.equal(await verifyInclusion({ leafHash: 'zz', siblings: [] }), false);
});

test('desk signatures verify against an agents.json sig key and reject tamper and unknown keys', async () => {
  const desk = await generateDeskKeyPair();
  const other = await generateDeskKeyPair();
  const tree = await merkleRoot([A, B]);
  const signed = await signDeskMessage(desk.privateKey, { day: DAY, root: tree.root, leafCount: tree.leafCount });
  assert.equal(signed.payload, deskPayload({ day: DAY, root: tree.root, leafCount: tree.leafCount }));
  assert.match(signed.payload, /^pointcast\.loom-root\.desk\/v1\nday:2026-11-27\nroot:[0-9a-f]{64}\nleaves:2\n$/);

  const manifest = {
    name: 'PointCast',
    keys: [
      { id: 'nouns-money-desk', alg: 'ed25519', use: 'sig', publicKey: desk.publicKey },
      { id: 'archive', alg: 'ed25519', use: 'enc', publicKey: other.publicKey },
    ],
  };
  const ok = await verifyDeskMessage({ ...signed, keyId: 'nouns-money-desk' }, manifest);
  assert.equal(ok.verified, true);
  assert.equal(ok.sig, signed.sig);
  assert.equal(ok.keyId, 'nouns-money-desk');
  assert.equal(ok.alg, 'ed25519');

  const tampered = await verifyDeskMessage({ payload: `${signed.payload} `, sig: signed.sig, keyId: 'nouns-money-desk' }, manifest);
  assert.equal(tampered.verified, false);
  assert.equal(tampered.reason, 'signature mismatch');
  assert.equal(tampered.sig, signed.sig);

  const brokenSig = `${signed.sig.slice(0, -2)}aa`;
  const badSig = await verifyDeskMessage({ payload: signed.payload, sig: brokenSig, keyId: 'nouns-money-desk' }, manifest);
  assert.equal(badSig.verified, false);
  assert.equal(badSig.reason, 'signature mismatch');

  const unknown = await verifyDeskMessage({ ...signed, keyId: 'not-a-desk' }, manifest);
  assert.equal(unknown.verified, false);
  assert.equal(unknown.reason, 'unknown key');

  const encryptionOnly = await verifyDeskMessage({ ...signed, keyId: 'archive' }, manifest);
  assert.equal(encryptionOnly.verified, false);
  assert.equal(encryptionOnly.reason, 'unknown key');

  const raw = Uint8Array.from(atob(desk.publicKey), (char) => char.charCodeAt(0));
  const jwk = {
    kty: 'OKP',
    crv: 'Ed25519',
    use: 'sig',
    alg: 'EdDSA',
    kid: 'jwk-desk',
    x: bytesToBase64(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''),
  };
  const fromJwk = await verifyDeskMessage({ ...signed, keyId: 'jwk-desk' }, { keys: [jwk] });
  assert.equal(fromJwk.verified, true);
  assert.equal(keysFromAgentsManifest({ residents: { public_key: desk.publicKey, public_key_alg: 'ed25519' } }).size, 0);
});

test('@officenoun status ids share one canonical leaf and root with the day', async () => {
  const at = '2026-11-27T02:48:00.000Z';
  const id = '2121795205557051582';
  assert.equal(parseOfficenounStatusId(id), id);
  assert.equal(parseOfficenounStatusId(`https://x.com/officenoun/status/${id}`), id);
  assert.equal(parseOfficenounStatusId(`https://twitter.com/officenoun/status/${id}/`), id);
  assert.equal(parseOfficenounStatusId(`@officenoun/${id}`), id);
  assert.throws(() => parseOfficenounStatusId('https://x.com/other/status/1'), /x_status_id/);

  const fromId = officenounStatusLeaf(id, { at });
  const fromUrl = officenounStatusLeaf(`https://twitter.com/officenoun/status/${id}`, { at: '2026-11-27T02:48:00Z' });
  assert.equal(fromId.kind, 'x-status');
  assert.equal(fromId.address, `https://x.com/officenoun/status/${id}`);
  assert.equal(fromId.handle, '@officenoun');
  assert.equal(Buffer.from(await hashLeaf(fromId)).toString('hex'), Buffer.from(await hashLeaf(fromUrl)).toString('hex'));
  assert.equal(leafPreimage(fromId).includes(0x1f), true);

  const proof = await inclusionProof([A, fromId], id, { kind: 'x-status' });
  assert.equal(proof.found, true);
  assert.equal(proof.valid, true);
  assert.equal(proof.leaf.address, fromId.address);
  assert.equal((await inclusionProof([A, fromId], id, { kind: 'timestamp' })).found, false);
});

test('the #loom-root note is a summary and does not write', () => {
  const note = formatLoomRootNote({
    day: DAY,
    root: 'ab'.repeat(32),
    leafCount: 2,
    verification: { sig: 'c2ln', verified: true },
  });
  assert.match(note, /^#loom-root\n2026-11-27\nroot: ab/);
  assert.match(note, /leaves: 2/);
  assert.match(note, /verified: yes/);
  assert.match(note, /sig: c2ln/);
  assert.match(note, /not appended/);
  const card = loomRootNote({ day: DAY, root: 'aa'.repeat(32), leafCount: 0, verification: { verified: false } });
  assert.equal(card.to, '#loom-root');
  assert.equal(card.writes, false);
  assert.equal(card.kind, 'note');
  const source = readFileSync(new URL('../src/lib/loom/loom-root.mjs', import.meta.url), 'utf8');
  assert.equal(source.includes('.put('), false);
  assert.equal(/export\s+(async\s+)?function\s+scheduled\b/.test(source), false);
  const route = readFileSync(new URL('../functions/api/loom/root.ts', import.meta.url), 'utf8');
  assert.equal(route.includes('.put('), false);
  assert.match(route, /serveLoomRoot/);
});

test('GET /api/loom/root reports the empty root when KV is missing, empty, or corrupt', async () => {
  const now = '2026-11-27T23:40:00.000Z';
  const unbound = await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root'), null, { now });
  const unboundBody = await unbound.json();
  assert.equal(unbound.status, 200);
  assert.equal(unboundBody.ok, true);
  assert.equal(unboundBody.spec, SPEC);
  assert.equal(unboundBody.readOnly, true);
  assert.equal(unboundBody.day, DAY);
  assert.equal(unboundBody.leafCount, 0);
  assert.equal(unboundBody.empty, true);
  assert.equal(unboundBody.kv, 'unbound');
  assert.equal(unboundBody.root, await emptyRoot());
  assert.equal(unboundBody.verification.verified, false);
  assert.equal(unboundBody.verification.reason, 'no desk signature');
  assert.equal(unboundBody.proof, null);
  assert.equal(unbound.headers.get('cache-control'), 'no-store');

  const missingKv = memoryKv();
  const missing = await (await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root'), missingKv, { now })).json();
  assert.equal(missing.kv, 'missing');
  assert.equal(missing.leafCount, 0);
  assert.equal(missingKv.puts, 0);

  const emptyKv = memoryKv({ [rootKvKey(DAY)]: JSON.stringify({ v: 1, day: DAY, leaves: [] }) });
  const empty = await (await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root'), emptyKv, { now })).json();
  assert.equal(empty.kv, 'empty');
  assert.equal(empty.root, unboundBody.root);

  const corrupt = {
    async get() { throw new SyntaxError('bad json'); },
    async put() { throw new Error('must not write'); },
  };
  const broken = await (await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root'), corrupt, { now })).json();
  assert.equal(broken.kv, 'unavailable');
  assert.equal(broken.leafCount, 0);
  assert.equal(broken.root, unboundBody.root);

  const stringKv = memoryKv();
  stringKv.get = async (key) => (key === rootKvKey(DAY) ? '{' : null);
  const malformed = await (await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root'), stringKv, { now })).json();
  assert.equal(malformed.kv, 'empty');
  assert.equal(malformed.leafCount, 0);
});

test('GET /api/loom/root returns the network root, a proof, and desk verification', async () => {
  const desk = await generateDeskKeyPair();
  const status = officenounStatusLeaf('2121795205557051582', { at: '2026-11-27T21:00:00.000Z' });
  const leaves = [A, B, status, { ...C, day: '2026-11-26', at: '2026-11-26T23:00:00.000Z' }];
  const tree = await merkleRoot([A, B, status]);
  const signed = await signDeskMessage(desk.privateKey, { day: DAY, root: tree.root, leafCount: tree.leafCount });
  const keys = { keys: [{ id: 'nouns-money-desk', use: 'sig', alg: 'ed25519', publicKey: desk.publicKey }] };
  const kv = memoryKv({
    [rootKvKey(DAY)]: JSON.stringify({
      v: 1,
      day: DAY,
      leaves,
      desk: { sig: signed.sig, keyId: 'nouns-money-desk' },
    }),
  });
  const response = await serveLoomRoot(new Request(`https://pointcast.xyz/api/loom/root?day=${DAY}&status=https://x.com/officenoun/status/${status.id}`), kv, {
    now: '2026-11-28T01:00:00.000Z',
    keys,
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.day, DAY);
  assert.equal(body.root, tree.root);
  assert.equal(body.leafCount, 3);
  assert.equal(body.skipped, 1);
  assert.equal(body.kv, 'ok');
  assert.equal(body.verification.verified, true);
  assert.equal(body.verification.sig, signed.sig);
  assert.equal(body.proof.found, true);
  assert.equal(body.proof.valid, true);
  assert.equal(await verifyInclusion(body.proof), true);
  assert.match(body.note, new RegExp(`root: ${tree.root}`));
  assert.equal(response.headers.get('cache-control'), 'public, max-age=15');
  assert.equal(kv.puts, 0);

  const tampered = memoryKv({
    [rootKvKey(DAY)]: JSON.stringify({
      v: 1,
      leaves: [A, B, status],
      desk: { sig: signed.sig, keyId: 'nouns-money-desk' },
    }),
  });
  tampered.map.set(rootKvKey(DAY), JSON.stringify({
    v: 1,
    leaves: [{ ...A, id: 'm_tampered' }, B, status],
    desk: { sig: signed.sig, keyId: 'nouns-money-desk' },
  }));
  const rejected = await (await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root'), tampered, { now: `${DAY}T12:00:00.000Z`, keys })).json();
  assert.equal(rejected.verification.verified, false);
  assert.equal(rejected.verification.reason, 'signature mismatch');
  assert.notEqual(rejected.root, tree.root);

  const unknown = await (await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root'), kv, {
    now: `${DAY}T12:00:00.000Z`,
    keys: { keys: [{ id: 'someone-else', use: 'sig', alg: 'ed25519', publicKey: desk.publicKey }] },
  })).json();
  assert.equal(unknown.verification.reason, 'unknown key');
  assert.equal(unknown.root, tree.root);

  const unsigned = memoryKv({ [rootKvKey(DAY)]: JSON.stringify({ leaves: [A, B, status], desk: { sig: signed.sig } }) });
  const noDirectory = await (await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root'), unsigned, { now: `${DAY}T12:00:00.000Z` })).json();
  assert.equal(noDirectory.verification.verified, false);
  assert.equal(noDirectory.verification.reason, 'no published keys');
});

test('GET /api/loom/root refuses writes and bad queries, and the pages handler reads the Loom KV', async () => {
  const now = `${DAY}T12:00:00.000Z`;
  const kv = memoryKv();
  assert.equal((await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root', { method: 'POST' }), kv, { now })).status, 405);
  assert.equal((await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root?day=27-11-2026'), kv, { now })).status, 400);
  assert.equal((await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root?leaf=&status=1'), kv, { now })).status, 400);
  assert.equal((await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root?status=https://x.com/other/status/1'), kv, { now })).status, 400);
  assert.equal((await serveLoomRoot(new Request('https://pointcast.xyz/api/loom/root', { method: 'OPTIONS' }), kv, { now })).status, 204);
  assert.equal(kv.puts, 0);

  const stored = await merkleRoot([A]);
  const bound = memoryKv({ [rootKvKey(DAY)]: JSON.stringify({ leaves: [A] }) });
  const viaPages = await onRequest({
    request: new Request(`https://pointcast.xyz/api/loom/root?day=${DAY}&leaf=${A.id}`),
    env: { VISITS: bound },
  });
  const body = await viaPages.json();
  assert.equal(body.root, stored.root);
  assert.equal(body.leafCount, 1);
  assert.equal(body.proof.valid, true);
  assert.equal(body.kv, 'ok');

  const preferred = memoryKv({ [rootKvKey(DAY)]: JSON.stringify({ leaves: [B] }) });
  const other = memoryKv({ [rootKvKey(DAY)]: JSON.stringify({ leaves: [A] }) });
  const fromLoom = await (await onRequest({
    request: new Request(`https://pointcast.xyz/api/loom/root?day=${DAY}`),
    env: { PC_LOOM_KV: preferred, VISITS: other },
  })).json();
  assert.equal(fromLoom.root, (await merkleRoot([B])).root);
  const bare = await (await onRequest({ request: new Request(`https://pointcast.xyz/api/loom/root?day=${DAY}`), env: {} })).json();
  assert.equal(bare.kv, 'unbound');
  assert.equal(bare.leafCount, 0);
});
