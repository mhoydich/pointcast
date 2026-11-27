import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { blake2b } from '../public/chain/sdk/pointcast-chain.js';
import { scanSource } from '../src/lib/nouns-money/honest-copy.mjs';
import { handleClaim } from '../functions/api/claim.ts';
import { handleLoom } from '../src/lib/loom/service.mjs';
import {
  CLAIM_HONESTY,
  CLAIM_TTL_MS,
  HOLDER_NOTE_CONTRACTS,
  addressPrompt,
  createClaimCode,
  createSignChallenge,
  createSlidingLimiter,
  encodeEdpk,
  encodeEdsig,
  formatWalletBook,
  lookupTezName,
  memoryClaimStore,
  parseWalletBook,
  readHolderNotes,
  readWalletBooks,
  rejectSecrets,
  tz1FromPublicKeyBytes,
  verifySignChallenge,
} from '../src/lib/loom-claim.mjs';

const PROD = [
  'src/lib/loom-claim.mjs',
  'functions/api/claim.ts',
  'src/pages/claim.astro',
];

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function keypair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const raw = new Uint8Array(publicKey.export({ format: 'der', type: 'spki' }).subarray(-32));
  return { raw, privateKey, edpk: encodeEdpk(raw), address: tz1FromPublicKeyBytes(raw) };
}

function signPayload(privateKey, payloadHex) {
  const hash = blake2b(Buffer.from(payloadHex, 'hex'), 32);
  return encodeEdsig(new Uint8Array(sign(null, hash, privateKey)));
}

const NOW = new Date('2026-11-27T14:13:00.000Z');
const on = { LOOM_CLAIM_ENABLED: 'true' };
const post = (body, env = on, deps) => handleClaim(new Request('https://pointcast.xyz/api/claim', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
}), env, deps);

function memoryKv() {
  const map = new Map();
  return { get: async (key) => map.get(key) ?? null, put: async (key, value) => { map.set(key, value); } };
}

test('flag off answers 404, including every value other than true', async () => {
  for (const env of [undefined, {}, { LOOM_CLAIM_ENABLED: '' }, { LOOM_CLAIM_ENABLED: 'false' }, { LOOM_CLAIM_ENABLED: 'TRUE' }, { LOOM_CLAIM_ENABLED: '1' }]) {
    for (const method of ['GET', 'POST']) {
      const res = await handleClaim(new Request('https://pointcast.xyz/api/claim', { method }), env);
      assert.equal(res.status, 404);
      assert.deepEqual(await res.json(), { ok: false, error: 'not-found' });
    }
  }
});

test('an open desk is optional and does not require a session', async () => {
  const res = await handleClaim(new Request('https://pointcast.xyz/api/claim'), on);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.optional, true);
  assert.equal(body.required, false);
  assert.equal(body.readOnly, true);
  assert.equal(body.storesKeys, false);
  assert.equal(body.writes, false);
});

test('#wallet-book records round-trip with and without a name', () => {
  const { address } = keypair();
  const full = formatWalletBook({
    address,
    code: 'NM-AB2CD3',
    domain: 'Ada.tez',
    noteId: '17',
    issuedAt: '2026-11-27T14:13:00.000Z',
  });
  assert.equal(formatWalletBook(parseWalletBook(full)), full);
  assert.match(full, /^#wallet-book v1\n/);
  assert.match(full, /domain ada\.tez/);
  const bare = formatWalletBook({ address, code: 'NM-AB2CD3', issuedAt: '2026-11-27T14:13:00.000Z' });
  assert.equal(bare.includes('domain'), false);
  assert.equal(bare.includes('note '), false);
  assert.equal(formatWalletBook(parseWalletBook(bare)), bare);
  assert.throws(() => parseWalletBook(bare.replace('address', 'wallet')), /bad-record/);
});

test('claim codes match NM-XXXXXX and skip ambiguous characters', () => {
  const seen = new Set();
  for (let i = 0; i < 100; i += 1) {
    const code = createClaimCode();
    assert.match(code, /^NM-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    assert.equal(code.length, 9);
    seen.add(code);
  }
  assert.ok(seen.size > 90);
  const fixed = createClaimCode(Uint8Array.from([0, 1, 2, 3, 4, 5]));
  assert.equal(fixed, 'NM-ABCDEF');
  for (const bad of ['NM-OOOOOO', 'NM-IIIIII', 'NM-000000', 'NM-111111', 'nm-abcdef', 'NM-ABCDE', 'NM-ABCDEFG', 'NM-AB2CD']) {
    assert.throws(() => formatWalletBook({
      address: keypair().address,
      code: bad,
      issuedAt: '2026-11-27T14:13:00.000Z',
    }), /bad-code/);
  }
});

test('a Beacon challenge verifies a matching signature and refuses the others', async () => {
  const one = keypair();
  const two = keypair();
  const challenge = createSignChallenge({ address: one.address, noteId: 'note-4', now: NOW, bytes: Uint8Array.from([10, 11, 12, 13, 14, 15]) });
  assert.equal(challenge.readOnly, true);
  assert.equal(challenge.signingType, 'micheline');
  assert.match(challenge.payload, /^0501/);
  const proof = { publicKey: one.edpk, signature: signPayload(one.privateKey, challenge.payload) };
  const verified = await verifySignChallenge(challenge, proof, NOW);
  assert.equal(verified.ok, true);
  assert.equal(verified.reply, challenge.code);
  assert.equal(parseWalletBook(verified.walletBook).address, one.address);
  assert.equal(Object.hasOwn(verified, 'publicKey'), false);
  assert.equal(Object.hasOwn(verified, 'signature'), false);
  await assert.rejects(verifySignChallenge(challenge, { ...proof, signature: signPayload(two.privateKey, challenge.payload) }, NOW), /bad-signature/);
  await assert.rejects(verifySignChallenge(challenge, { publicKey: two.edpk, signature: proof.signature }, NOW), /address-mismatch/);
  await assert.rejects(verifySignChallenge({ ...challenge, message: `${challenge.message}\n` }, proof, NOW), /tampered/);
  await assert.rejects(verifySignChallenge(challenge, proof, new Date('2026-11-27T14:29:00.000Z')), /expired/);
});

test('secret material is refused and never echoed or kept', async () => {
  const marker = ['ed', 'sk'].join('') + 'TestOnlyNotAKey';
  for (const path of PROD) {
    const src = read(path);
    assert.doesNotMatch(src, /edsk|spsk|p2sk|mnemonic|privateKey|secretKey|seed phrase/);
    assert.doesNotMatch(src, /localStorage|sessionStorage|writeFile|AUTH_DB|loom:log:|kv\.get\(|kv\.put\(/);
    assert.doesNotMatch(src, /@taquito\/signer|BeaconWallet|requestSignPayload/);
  }
  assert.throws(() => rejectSecrets({ note: marker }), /secret-refused/);
  const closed = await post({ note: marker }, {});
  assert.equal(closed.status, 404);
  assert.equal((await closed.text()).includes(marker), false);
  const refused = await post({ action: 'challenge', address: marker });
  assert.equal(refused.status, 400);
  const text = await refused.text();
  assert.equal(text.includes(marker), false);
  assert.match(text, /secret-refused/);
  const { address } = keypair();
  const challenge = createSignChallenge({ address, now: NOW });
  assert.equal(JSON.stringify(challenge).includes(marker), false);
});

test('.tez lookup asks "is this you?" and holder notes stay read-only', async () => {
  const { address } = keypair();
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init?.method });
    if (String(url).includes('/domains?')) {
      return { ok: true, json: async () => [{ name: 'ada.tez', address: { address }, expiration: '2027-11-27T00:00:00.000Z' }] };
    }
    return {
      ok: true,
      json: async () => [{ token: { contract: { address: HOLDER_NOTE_CONTRACTS[0] }, tokenId: '4', metadata: { name: 'Park note' } } }],
    };
  };
  const found = await lookupTezName('Ada.tez', { fetchImpl });
  assert.equal(found.prompt, 'is this you?');
  assert.equal(found.address, address);
  assert.equal(found.readOnly, true);
  assert.equal(found.found, true);
  const notes = await readHolderNotes(address, { fetchImpl });
  assert.deepEqual(notes.notes, [{ contract: HOLDER_NOTE_CONTRACTS[0], tokenId: '4', name: 'Park note' }]);
  assert.equal(JSON.stringify(notes).includes(['bal', 'ance'].join('')), false);
  assert.deepEqual(calls.map((call) => call.method), ['GET', 'GET']);
  for (const call of calls) assert.equal(new URL(call.url).origin, 'https://api.tzkt.io');
  const missed = await lookupTezName('missing.tez', { fetchImpl: async () => ({ ok: true, json: async () => [] }) });
  assert.equal(missed.found, false);
  assert.equal(missed.prompt, 'is this you?');
  assert.equal(addressPrompt(address).prompt, 'is this you?');
});

test('the API formats a code and a lookup without signing or writing', async () => {
  const { address } = keypair();
  const made = await post({ action: 'challenge', address, noteId: '9' }, on);
  assert.equal(made.status, 200);
  const body = await made.json();
  assert.match(body.reply, /^NM-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  assert.equal(body.writes, false);
  assert.equal(body.readOnly, true);
  assert.equal(parseWalletBook(body.walletBook).address, address);
  assert.equal(body.challenge.signingType, 'micheline');
  const fetchImpl = async () => ({ ok: true, json: async () => [{ name: 'ada.tez', address: { address } }] });
  const looked = await handleClaim(new Request('https://pointcast.xyz/api/claim', {
    method: 'POST',
    body: JSON.stringify({ action: 'lookup', domain: 'ada.tez' }),
  }), on, { fetch: fetchImpl });
  const lookup = await looked.json();
  assert.equal(lookup.prompt, 'is this you?');
  assert.equal(lookup.address, address);
  assert.equal(lookup.writes, false);
  const formatted = await post({
    action: 'format',
    address,
    code: body.reply,
    issuedAt: '2026-11-27T14:13:00.000Z',
  });
  assert.equal((await formatted.json()).reply, body.reply);
});

test('an issued NM code is bound to its nonce, address and handle, then rejected on expiry or mismatch', async () => {
  const one = keypair();
  const store = memoryClaimStore();
  let writes = 0;
  const watching = {
    async get(code) { return store.get(code); },
    async set(code, record) { writes += 1; return store.set(code, record); },
  };
  const closed = await post({ action: 'challenge', address: one.address }, {}, { store: watching });
  assert.equal(closed.status, 404);
  assert.equal(writes, 0);
  const made = await post({ action: 'challenge', address: one.address, noteId: '9', handle: 'ada' }, on, {
    store: watching, now: () => NOW, bytes: Uint8Array.from([10, 11, 12, 13, 14, 15]),
  });
  assert.equal(made.status, 200);
  const body = await made.json();
  const saved = await store.get(body.reply);
  assert.equal(writes, 1);
  assert.equal(saved.nonce, body.challenge.nonce);
  assert.equal(saved.address, one.address);
  assert.equal(saved.handle, 'ada');
  assert.equal(Date.parse(saved.expiresAt) - Date.parse(saved.issuedAt), CLAIM_TTL_MS);
  assert.equal(JSON.stringify(saved).includes('publicKey'), false);
  const proof = { publicKey: one.edpk, signature: signPayload(one.privateKey, body.challenge.payload) };
  const ok = await post({ action: 'verify', challenge: body.challenge, ...proof }, on, { store: watching, now: () => NOW });
  assert.equal(ok.status, 200);
  const forged = { ...body.challenge, nonce: 'ab'.repeat(16) };
  const mismatch = await post({ action: 'verify', challenge: forged, publicKey: one.edpk, signature: 'sig' }, on, { store: watching, now: () => NOW });
  assert.equal(mismatch.status, 400);
  assert.equal((await mismatch.json()).error, 'mismatch');
  const unknown = await post({ action: 'verify', challenge: { ...body.challenge, code: 'NM-ZZZZZZ' }, publicKey: one.edpk, signature: 'sig' }, on, { store: watching, now: () => NOW });
  assert.equal((await unknown.json()).error, 'code-unknown');
  await store.set(body.reply, { ...saved, expiresAt: '2026-11-27T14:00:00.000Z' });
  const late = await post({ action: 'verify', challenge: body.challenge, ...proof }, on, { store: watching, now: () => NOW });
  assert.equal(late.status, 400);
  assert.equal((await late.json()).error, 'expired');
});

test('the claim desk rate limit answers 429 with Retry-After before a challenge is issued', async () => {
  const { address } = keypair();
  const limit = createSlidingLimiter({ windowMs: 60_000, max: 2, now: () => 1_700_000_000_000 });
  let fetches = 0;
  const fetchImpl = async () => { fetches += 1; return { ok: true, json: async () => [] }; };
  const readLoom = async () => new Response(JSON.stringify({ ok: true, messages: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
  const call = (ip) => handleClaim(new Request('https://pointcast.xyz/api/claim', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip },
    body: JSON.stringify({ action: 'lookup', address }),
  }), on, { limit, fetch: fetchImpl, readLoom });
  assert.equal((await call('203.0.113.10')).status, 200);
  assert.equal((await call('203.0.113.10')).status, 200);
  const blocked = await call('203.0.113.10');
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) >= 1);
  assert.equal((await blocked.json()).error, 'slow-down');
  assert.equal(fetches, 2);
  const byHandle = createSlidingLimiter({ windowMs: 60_000, max: 1, now: () => 1_800_000_000_000 });
  const other = (ip) => handleClaim(new Request('https://pointcast.xyz/api/claim', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip },
    body: JSON.stringify({ action: 'format', address, code: 'NM-AB2CD3', issuedAt: '2026-11-27T14:13:00.000Z' }),
  }), on, { limit: byHandle, readLoom });
  assert.equal((await other('203.0.113.20')).status, 200);
  const second = await other('203.0.113.21');
  assert.equal(second.status, 429);
  assert.ok(Number(second.headers.get('retry-after')) >= 1);
});

test('wallet-book records are read through handleLoom, not by opening log keys', async () => {
  const kv = memoryKv();
  const { address } = keypair();
  const text = formatWalletBook({ address, code: 'NM-AB2CD3', domain: 'ada.tez', issuedAt: '2026-11-27T14:13:00.000Z' });
  const posted = await handleLoom(new Request('https://pointcast.xyz/api/loom', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ to: '#wallet-book', from: { name: 'Ada', kind: 'human' }, kind: 'note', body: text.trim() }),
  }), { kv, firstHelloEnabled: false });
  assert.equal(posted.status, 201);
  const calls = [];
  const readLoom = (request, opts) => {
    calls.push(new URL(request.url).pathname + new URL(request.url).search);
    assert.equal(request.method, 'GET');
    return handleLoom(request, { kv: opts.kv });
  };
  const found = await readWalletBooks({ kv, readLoom, to: '#wallet-book' });
  assert.deepEqual(calls, ['/api/loom?to=%23wallet-book']);
  assert.equal(found.via, 'handleLoom');
  assert.equal(found.records.length, 1);
  assert.equal(found.records[0].code, 'NM-AB2CD3');
  assert.equal(found.records[0].address, address);
  const src = read('src/lib/loom-claim.mjs');
  assert.match(src, /handleLoom/);
  assert.doesNotMatch(src, /kv\.get\(|kv\.put\(|loom:log:/);
  let reads = 0;
  const closed = await handleClaim(new Request('https://pointcast.xyz/api/claim', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'books' }),
  }), {}, { readLoom: async () => { reads += 1; return new Response('{}'); } });
  assert.equal(closed.status, 404);
  assert.equal(reads, 0);
});

test('copy passes the honest-copy scan and the page is a 390px reduced-motion document', () => {
  for (const path of [...PROD, 'tests/loom-claim.test.mjs']) {
    const src = read(path);
    const hits = scanSource(src, path);
    assert.deepEqual(hits, [], `${path} ${hits.map((hit) => hit.match).join(', ')}`);
  }
  const page = read('src/pages/claim.astro');
  assert.match(page, /max-width: 390px|width: min\(100%, 390px\)/);
  assert.match(page, /prefers-reduced-motion:\s*reduce/);
  assert.match(page, /NM-XXXXXX/);
  assert.match(page, /is this you\?/);
  assert.match(page, /No cash value/);
  assert.match(page, /Never priced/);
  assert.match(page, /art notes/i);
  assert.match(page, /does not tie an X account to the wallet/);
  assert.equal(CLAIM_HONESTY, 'Art notes. No cash value. Never priced.');
  assert.doesNotMatch(page, /https?:\/\/|fonts\.googleapis|cdn\.|unpkg|jsdelivr/);
  assert.doesNotMatch(page, /innerHTML/);
});
