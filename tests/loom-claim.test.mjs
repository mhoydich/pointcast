import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { blake2b } from '../public/chain/sdk/pointcast-chain.js';
import { scanSource } from '../src/lib/nouns-money/honest-copy.mjs';
import { handleClaim } from '../functions/api/claim.ts';
import {
  CLAIM_HONESTY,
  HOLDER_NOTE_CONTRACTS,
  addressPrompt,
  createClaimCode,
  createSignChallenge,
  encodeEdpk,
  encodeEdsig,
  formatWalletBook,
  lookupTezName,
  parseWalletBook,
  readHolderNotes,
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
const post = (body, env = on) => handleClaim(new Request('https://pointcast.xyz/api/claim', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
}), env);

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
  await assert.rejects(verifySignChallenge(challenge, proof, new Date('2026-11-27T14:24:00.000Z')), /expired/);
});

test('secret material is refused and never echoed or kept', async () => {
  const marker = ['ed', 'sk'].join('') + 'TestOnlyNotAKey';
  for (const path of PROD) {
    const src = read(path);
    assert.doesNotMatch(src, /edsk|spsk|p2sk|mnemonic|privateKey|secretKey|seed phrase/);
    assert.doesNotMatch(src, /localStorage|sessionStorage|writeFile|PC_LOOM_KV|VISITS|AUTH_DB|\.put\(/);
    assert.doesNotMatch(src, /@taquito\/signer|BeaconWallet|requestSignPayload|src\/lib\/loom\//);
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
  assert.equal(CLAIM_HONESTY, 'Art notes. No cash value. Never priced.');
  assert.doesNotMatch(page, /https?:\/\/|fonts\.googleapis|cdn\.|unpkg|jsdelivr/);
  assert.doesNotMatch(page, /innerHTML/);
});
