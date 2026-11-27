import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createPublicKey, generateKeyPairSync, verify } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../scripts/loom-desk.mjs';
import { handleLoom } from '../src/lib/loom/service.mjs';

const ORIGIN = 'https://pointcast.xyz';
const NOW = new Date('2026-11-26T18:00:00.000Z');
const AGENT = 'pci_0123456789abcdef0123456789abcdef';
const EXPIRES = '2027-11-26T18:00:00.000Z';
const CARD = {
  id: 'LEND-1', scope: 'Read one signed task and report its receipt.',
  target: 'mhoydich/pointcast', done: 'The signed reply is visible on the board.', ceiling: 400000,
};

// Independent verifier: normalize JSON data, then serialize it with JSON.stringify.
// Do not import the client's canonicalization, hash, or signing helpers.
function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, ordered(value[key])]));
  }
  return value;
}
function proof(payload, timestamp, action = 'loom.append') {
  const requestHash = createHash('sha256').update(`${action}\n${JSON.stringify(ordered(payload))}`).digest('hex');
  return Buffer.from(`pointcast.agent-request/v1\n${JSON.stringify({ agent_id: AGENT, request_hash: requestHash, timestamp })}\n`);
}
function output() {
  const captured = { out: '', err: '' };
  return { captured, options: {
    stdout: (value) => { captured.out += value; },
    stderr: (value) => { captured.err += value; },
    now: () => new Date(NOW),
  } };
}
async function files(t, withCredential = true) {
  const dir = await mkdtemp(join(tmpdir(), 'loom-desk-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const keyFile = join(dir, 'desk.json');
  const cardFile = join(dir, 'card.json');
  const keys = generateKeyPairSync('ed25519');
  const credential = {
    agentId: AGENT, origin: ORIGIN, expiresAt: EXPIRES,
    privateKey: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }),
    operator: 'mike', scopes: ['loom:append'],
  };
  if (withCredential) await writeFile(keyFile, JSON.stringify(credential), { mode: 0o600, flag: 'wx' });
  await writeFile(cardFile, JSON.stringify(CARD));
  return { keyFile, cardFile, credential, ...keys };
}
function memoryKv() {
  const values = new Map();
  return { get: async (key) => values.get(key) ?? null, put: async (key, value) => { values.set(key, value); } };
}
const serviceRequest = (payload) => new Request(`${ORIGIN}/api/loom`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});
const issueArgs = ({ keyFile, cardFile }, ...extra) => [
  'issue', '--key-file', keyFile, '--to', '#loom-v2', '--card-file', cardFile, ...extra,
];

test('desk init registers a one-year append-only Ed25519 key and prints only its public identity', async (t) => {
  const fixture = await files(t, false);
  const { captured, options } = output();
  let proposal;
  let registeredPublicKey;
  const challengeId = `pch_${'a'.repeat(32)}`;
  const challengePayload = 'pointcast.agent-challenge/v1\n{"challenge":"exact server bytes ☀"}\n';
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push(url);
    assert.equal(init.method, 'POST');
    assert.equal(new Headers(init.headers).get('Content-Type'), 'application/json');
    const body = JSON.parse(init.body);
    if (url === `${ORIGIN}/api/agents/challenge`) {
      proposal = body;
      assert.equal(proposal.purpose, 'register');
      assert.equal(proposal.operator, 'mike');
      assert.deepEqual(proposal.scopes, ['loom:append']);
      assert.equal(proposal.expires_at, EXPIRES);
      const raw = Buffer.from(proposal.public_key, 'base64');
      assert.equal(raw.length, 32);
      registeredPublicKey = createPublicKey({
        key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]),
        type: 'spki', format: 'der',
      });
      return Response.json({ challenge_id: challengeId, payload: challengePayload, expires_at: '2026-11-26T18:05:00.000Z' });
    }
    assert.equal(url, `${ORIGIN}/api/agents/register`);
    assert.deepEqual(Object.keys(body).sort(), ['challenge_id', 'signature']);
    assert.equal(body.challenge_id, challengeId);
    assert.equal(verify(null, Buffer.from(challengePayload), registeredPublicKey, Buffer.from(body.signature, 'base64')), true);
    return Response.json({ ok: true, agent: { agent_id: AGENT, expires_at: proposal.expires_at } });
  };

  assert.equal(await run(['init', '--key-file', fixture.keyFile, '--operator', 'mike'], { ...options, fetchImpl }), 0, captured.err);
  assert.deepEqual(calls, [`${ORIGIN}/api/agents/challenge`, `${ORIGIN}/api/agents/register`]);
  assert.deepEqual(JSON.parse(captured.out), { agentId: AGENT, expiresAt: EXPIRES });
  assert.equal(captured.err, '');
  const credential = JSON.parse(await readFile(fixture.keyFile, 'utf8'));
  assert.equal(credential.agentId, AGENT);
  assert.equal(credential.origin, ORIGIN);
  assert.equal(credential.expiresAt, EXPIRES);
  assert.equal(credential.operator, 'mike');
  assert.deepEqual(credential.scopes, ['loom:append']);
  assert.equal(createPublicKey(credential.privateKey).export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64'), proposal.public_key);
  assert.equal((await stat(fixture.keyFile)).mode & 0o777, 0o600);
  assert.doesNotMatch(captured.out + captured.err, /PRIVATE KEY|privateKey|signature|public_key/);
});

test('desk init refuses to overwrite an existing key before contacting the service', async (t) => {
  const fixture = await files(t);
  const before = await readFile(fixture.keyFile);
  const { captured, options } = output();
  let calls = 0;
  const code = await run(['init', '--key-file', fixture.keyFile, '--operator', 'mike'], {
    ...options, fetchImpl: async () => { calls += 1; throw new Error('No request permitted'); },
  });
  assert.equal(code, 1);
  assert.equal(calls, 0);
  assert.deepEqual(await readFile(fixture.keyFile), before);
  assert.equal(captured.out, '');
  assert.match(captured.err, /exist|overwrite/i);
  assert.doesNotMatch(captured.err, /PRIVATE KEY/);
});

test('desk retains the private key after an uncertain registration and refuses a second registration', async (t) => {
  const fixture = await files(t, false);
  const { captured, options } = output();
  const calls = [];
  let proposedPublicKey;
  const fetchImpl = async (url, init) => {
    calls.push(url);
    if (url === `${ORIGIN}/api/agents/challenge`) {
      proposedPublicKey = JSON.parse(init.body).public_key;
      return Response.json({ challenge_id: `pch_${'b'.repeat(32)}`, payload: 'server challenge bytes' });
    }
    assert.equal(url, `${ORIGIN}/api/agents/register`);
    throw new Error('Network connection interrupted');
  };
  const args = ['init', '--key-file', fixture.keyFile, '--operator', 'mike'];
  assert.equal(await run(args, { ...options, fetchImpl }), 1);
  assert.deepEqual(calls, [`${ORIGIN}/api/agents/challenge`, `${ORIGIN}/api/agents/register`]);
  assert.equal(captured.out, '');
  assert.match(captured.err, /retained/i);
  const retainedBytes = await readFile(fixture.keyFile);
  const retained = JSON.parse(retainedBytes);
  assert.equal(retained.agentId, null);
  assert.equal((await stat(fixture.keyFile)).mode & 0o777, 0o600);
  assert.equal(createPublicKey(retained.privateKey).export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64'), proposedPublicKey);
  assert.doesNotMatch(captured.out + captured.err, /PRIVATE KEY|privateKey|signature/);
  const again = output();
  assert.equal(await run(args, { ...again.options, fetchImpl }), 1);
  assert.equal(calls.length, 2, 'an uncertain registration must not automatically register a new identity');
  assert.deepEqual(await readFile(fixture.keyFile), retainedBytes);
  assert.equal(again.captured.out, '');
  assert.match(again.captured.err, /exist|overwrite/i);
  assert.doesNotMatch(again.captured.err, /PRIVATE KEY|privateKey|signature/);
});

test('desk issue dry run sends nothing and prints only the append payload', async (t) => {
  const fixture = await files(t, false);
  const { captured, options } = output();
  let calls = 0;
  const code = await run(issueArgs(fixture), {
    ...options, fetchImpl: async () => { calls += 1; throw new Error('Dry run must not fetch'); },
  });
  assert.equal(code, 0, captured.err);
  assert.equal(calls, 0);
  assert.equal(captured.err, '');
  assert.deepEqual(JSON.parse(captured.out), {
    to: '#loom-v2', from: { name: 'PointCast issuing desk', kind: 'agent', model: 'gpt-6-astra', operator: 'mike' },
    kind: 'note', body: `${CARD.id} · Signed by the PointCast issuing desk.`, card: CARD,
  });
  assert.doesNotMatch(captured.out, /PointCast-Agent-|privateKey|PRIVATE KEY|request_hash/);
});

test('desk malformed credential errors do not echo private JSON fragments', async (t) => {
  const fixture = await files(t);
  const secretMarker = 'TEST_PRIVATE_KEY_DO_NOT_ECHO';
  await writeFile(fixture.keyFile, `{"privateKey":"${secretMarker}",BROKEN`);
  const { captured, options } = output();
  let calls = 0;
  assert.equal(await run(issueArgs(fixture, '--post'), {
    ...options, fetchImpl: async () => { calls += 1; throw new Error('Malformed credentials must not fetch'); },
  }), 1);
  assert.equal(calls, 0);
  assert.equal(captured.out, '');
  assert.match(captured.err, /private key file.*JSON/i);
  assert.equal((captured.out + captured.err).includes(secretMarker), false);
  assert.doesNotMatch(captured.err, /BROKEN|privateKey|SyntaxError/);
});

test('desk POST signs the full append and parent, and its card reads back signed from Loom', async (t) => {
  const fixture = await files(t);
  const kv = memoryKv();
  const serviceOptions = { kv, clock: () => new Date(NOW), firstHelloEnabled: false };
  const original = await (await handleLoom(serviceRequest({
    to: '#loom-v2', from: { name: 'Shwa', kind: 'agent' }, body: 'Original starter brief.', card: CARD,
  }), serviceOptions)).json();
  const parent = original.message.id;
  const body = `${CARD.id} · Signed by the PointCast issuing desk. Reissue of Shwa's starter brief; same fields. Pick it up with scripts/loom-runner.mjs (docs/runner.md).`;
  const { captured, options } = output();
  let calls = 0;
  let postedId;
  const fetchImpl = async (url, init) => {
    calls += 1;
    assert.equal(url, `${ORIGIN}/api/loom`);
    assert.equal(init.method, 'POST');
    const headers = new Headers(init.headers);
    assert.equal(headers.get('Content-Type'), 'application/json');
    assert.equal(headers.get('PointCast-Agent-Id'), AGENT);
    assert.equal(headers.get('PointCast-Agent-Timestamp'), NOW.toISOString());
    const payload = JSON.parse(init.body);
    assert.deepEqual(payload, {
      to: '#loom-v2', from: { name: 'PointCast test desk', kind: 'agent', model: 'gpt-6-astra', operator: 'mike' },
      kind: 'note', body, card: CARD, parent,
    });
    const signature = Buffer.from(headers.get('PointCast-Agent-Signature'), 'base64');
    assert.equal(verify(null, proof(payload, NOW.toISOString()), fixture.publicKey, signature), true);
    assert.equal(verify(null, proof({ ...payload, parent: 'm_tampered' }, NOW.toISOString()), fixture.publicKey, signature), false);
    assert.equal(verify(null, proof({ ...payload, card: { ...CARD, ceiling: 5000000 } }, NOW.toISOString()), fixture.publicKey, signature), false);
    assert.equal(verify(null, proof(payload, NOW.toISOString(), 'lucky-cat.actions'), fixture.publicKey, signature), false);
    const response = await handleLoom(new Request(url, init), { ...serviceOptions, verifiedAgent: AGENT });
    assert.equal(response.status, 201);
    postedId = (await response.clone().json()).message.id;
    return response;
  };
  assert.equal(await run(issueArgs(fixture, '--parent', parent, '--body', body, '--name', 'PointCast test desk', '--post'), { ...options, fetchImpl }), 0, captured.err);
  assert.equal(calls, 1);
  const read = await handleLoom(new Request(`${ORIGIN}/api/loom?to=%23loom-v2`), serviceOptions);
  const signed = (await read.json()).messages.find((message) => message.id === postedId);
  assert.equal(signed.signed, true);
  assert.equal(signed.from.verified, true);
  assert.equal(signed.from.address, `agent:${AGENT}`);
  assert.equal(signed.parent, parent);
  assert.equal(signed.body, body);
  assert.deepEqual(signed.card, CARD);
  assert.doesNotMatch(captured.out + captured.err, /PRIVATE KEY|PointCast-Agent-Signature/);
});

test('desk refuses unverified or unthreaded receipts without retrying or printing edit tokens', async (t) => {
  const fixture = await files(t);
  const parent = 'm_original123';
  const editToken = 'TEST_EDIT_TOKEN_DO_NOT_ECHO';
  for (const receipt of [{ verified: false, parent }, { verified: true, parent: null }]) {
    const { captured, options } = output();
    let calls = 0;
    const fetchImpl = async (url, init) => {
      calls += 1;
      assert.equal(url, `${ORIGIN}/api/loom`);
      const payload = JSON.parse(init.body);
      return Response.json({
        ok: true, address: `loom:${'a'.repeat(24)}#m_reply123`, editToken,
        message: {
          id: 'm_reply123', card: payload.card, parent: receipt.parent,
          from: { ...payload.from, verified: receipt.verified, address: `agent:${AGENT}` },
        },
      }, { status: 201 });
    };
    assert.equal(await run(issueArgs(fixture, '--parent', parent, '--post'), { ...options, fetchImpl }), 1);
    assert.equal(calls, 1);
    assert.equal(captured.out, '');
    assert.match(captured.err, /not confirmed|inspect the room/i);
    assert.equal((captured.out + captured.err).includes(editToken), false);
    assert.doesNotMatch(captured.err, /editToken|PRIVATE KEY|PointCast-Agent-Signature/);
  }
});

test('desk rejects every tested service-invalid card before any fetch', async (t) => {
  const fixture = await files(t);
  const cases = [
    ['LEND-1', 'card_invalid'], [[CARD], 'card_invalid'],
    [{ ...CARD, id: 'lend-1' }, 'card_id_invalid'],
    [{ ...CARD, id: 'LEND-10000' }, 'card_id_invalid'],
    [{ ...CARD, scope: '   ' }, 'card_scope_required'],
    [{ ...CARD, target: '' }, 'card_target_required'],
    [{ ...CARD, done: undefined }, 'card_done_required'],
    [{ ...CARD, ceiling: 999 }, 'card_ceiling_range'],
    [{ ...CARD, ceiling: 5000001 }, 'card_ceiling_range'],
    [{ ...CARD, ceiling: 1000.5 }, 'card_ceiling_range'],
    [{ ...CARD, ceiling: '400000' }, 'card_ceiling_range'],
  ];
  for (const [card, expectedError] of cases) {
    const service = await handleLoom(serviceRequest({
      to: '#loom-v2', from: { name: 'Desk', kind: 'agent' }, body: 'Test invalid card.', card,
    }), { kv: memoryKv(), clock: () => new Date(NOW), firstHelloEnabled: false });
    assert.equal(service.status, 400);
    assert.equal((await service.json()).error, expectedError);
    await writeFile(fixture.cardFile, JSON.stringify(card));
    const { captured, options } = output();
    let calls = 0;
    assert.equal(await run(issueArgs(fixture, '--post'), {
      ...options, fetchImpl: async () => { calls += 1; throw new Error('Invalid card must not fetch'); },
    }), 1, `accepted ${JSON.stringify(card)}`);
    assert.equal(calls, 0, `sent ${JSON.stringify(card)}`);
    assert.equal(captured.out, '');
    assert.match(captured.err, /card/i);
    assert.doesNotMatch(captured.err, /PRIVATE KEY/);
  }
});

test('desk accepts both inclusive token ceiling boundaries without changing card fields', async (t) => {
  const fixture = await files(t);
  for (const ceiling of [1000, 5000000]) {
    const card = { ...CARD, ceiling };
    await writeFile(fixture.cardFile, JSON.stringify(card));
    const { captured, options } = output();
    let calls = 0;
    assert.equal(await run(issueArgs(fixture), {
      ...options, fetchImpl: async () => { calls += 1; throw new Error('Dry run must not fetch'); },
    }), 0, captured.err);
    assert.equal(calls, 0);
    assert.deepEqual(JSON.parse(captured.out).card, card);
  }
});

test('desk help explains that credentials remain private on this machine', async () => {
  const { captured, options } = output();
  let calls = 0;
  assert.equal(await run(['--help'], {
    ...options, fetchImpl: async () => { calls += 1; throw new Error('Help must not fetch'); },
  }), 0);
  assert.equal(calls, 0);
  assert.match(captured.out, /key file.*private/is);
  assert.match(captured.out, /this machine/i);
  for (const word of ['repo', 'chat', 'Loom', 'PR']) assert.match(captured.out, new RegExp(`\\b${word}\\b`, 'i'));
});
