import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { after, before, test } from 'node:test';
import utils from '@taquito/utils';
import { createServer } from 'vite';

const { encodeOpHash, b58Encode, PrefixV2 } = utils;
const KEY = Buffer.alloc(32, 7).toString('base64url');
const TOKEN = Buffer.alloc(32, 1).toString('base64url');
const TOKEN_HASH = createHash('sha256').update(TOKEN).digest('hex');
const CONTRACT = b58Encode(new Uint8Array(20).fill(12), PrefixV2.ContractHash);
let vite;
let wallets;
let ops;
let chainLib;
let detail;
let migration;

before(async () => {
  vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  [wallets, ops, chainLib, detail, migration] = await Promise.all([
    vite.ssrLoadModule('/functions/_lib/agent-wallets.ts'),
    vite.ssrLoadModule('/functions/_lib/agent-wallet-ops.ts'),
    vite.ssrLoadModule('/functions/_lib/agent-wallet-chain.ts'),
    vite.ssrLoadModule('/functions/api/agent-wallets/[id]/index.ts'),
    readFile(new URL('../migrations/auth/0035_agent_wallet_signing.sql', import.meta.url), 'utf8'),
  ]);
});
after(() => vite?.close());

function d1(sqlite) {
  const db = {
    prepare(sql) {
      let args = [];
      const statement = () => sqlite.prepare(sql);
      const bound = {
        bind(...values) { args = values; return bound; },
        async first(column) {
          db.beforeFirst?.(sql);
          const row = statement().get(...args);
          db.afterFirst?.(sql);
          return (column ? row?.[column] : row) ?? null;
        },
        async run() { return { meta: { changes: statement().run(...args).changes } }; },
        async all() { return { results: statement().all(...args) }; },
      };
      return bound;
    },
  };
  return db;
}

async function setup(t, migratedFirst = false, provision = true) {
  const sqlite = new DatabaseSync(':memory:');
  t.after(() => sqlite.close());
  const env = {
    AUTH_DB: d1(sqlite),
    POINTCAST_INTEGRATION_ENCRYPTION_KEY: KEY,
    AGENT_WALLETS_MINT_CONTRACT: CONTRACT,
  };
  const id = 'codex';
  if (migratedFirst) sqlite.exec(migration);
  const provisionWallet = async (agentId) => (await wallets.ensureAgentWallets(env,
    wallets.AGENT_ROSTER.filter((agent) => agent.id === agentId)))[0];
  const wallet = provision ? await provisionWallet(id) : null;
  if (!migratedFirst) sqlite.exec(migration);
  if (provision) sqlite.prepare('UPDATE agent_wallets SET bearer_token_hash = ? WHERE agent_id = ?').run(TOKEN_HASH, id);

  const rows = () => sqlite.prepare('SELECT * FROM agent_wallet_ops ORDER BY id').all();
  const chain = {
    prepares: [], broadcasts: [],
    async prepare(row, action, budget, previous) {
      this.prepares.push({ action, budget, previous });
      assert.equal(await (await wallets.agentWalletSigner(env, row)).publicKeyHash(), wallet.address);
      const bytes = this.prepares.length.toString(16).padStart(2, '0').repeat(160);
      return {
        bytes, hash: encodeOpHash(bytes), lastCounter: this.prepares.length, expiresLevel: 400,
        maxCostMutez: (action.kind === 'send' ? action.amountMutez : 0) + 1200,
      };
    },
    async broadcast(op) {
      assert.ok(rows().some((row) => row.op_hash === op.hash), 'audit row exists before injection');
      this.broadcasts.push(op.hash);
      if (this.broadcastError) throw this.broadcastError;
    },
  };

  const send = { to: wallet?.address, amountMutez: 1000 };
  const mint = { contract: CONTRACT, recipient: wallet?.address, tokenId: 0, metadataUri: 'ipfs://bafyexample/token.json' };
  function post(kind, { body = kind === 'send' ? send : mint, as = id, token = TOKEN, key } = {}) {
    const headers = { 'content-type': 'application/json' };
    if (token !== null) headers.authorization = `Bearer ${token}`;
    if (key !== undefined) headers['idempotency-key'] = key;
    const request = new Request(`https://pointcast.xyz/api/agent-wallets/${as}/${kind}`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    return ops.handleWalletOperation(request, env, as, kind, async () => chain);
  }
  const assertUnlocked = () => assert.deepEqual(sqlite.prepare('SELECT holder FROM agent_wallet_signer_locks').all(), []);
  return { sqlite, env, id, wallet, rows, chain, send, mint, post, provisionWallet, assertUnlocked };
}

test('v1 ciphertext authenticates the agent id and address, and signing cannot export the key', async (t) => {
  const s = await setup(t);
  const row = s.sqlite.prepare('SELECT * FROM agent_wallets WHERE agent_id = ?').get(s.id);
  assert.equal(row.daily_cap_mutez, 5_000_000);
  assert.equal(row.bearer_token_hash, TOKEN_HASH);
  assert.ok(!JSON.stringify(row).includes(TOKEN));

  const signer = await wallets.agentWalletSigner(s.env, row);
  assert.match((await signer.sign('a0', new Uint8Array([3]))).prefixSig, /^edsig/);
  await assert.rejects(signer.secretKey(), /key-export-disabled/);
  for (const altered of [
    { ...row, agent_id: 'x-desk' },
    { ...row, address: (await wallets.generateTezosKey()).address },
    { ...row, key_version: 2 },
    { ...row, secret_ciphertext: row.secret_ciphertext.slice(2) },
  ]) {
    await assert.rejects(wallets.agentWalletSigner(s.env, altered), /^Error: agent-wallet-signer-unavailable$/);
  }
});

test('bearer authorization, input and mint target are checked before signing', async (t) => {
  const s = await setup(t, true);
  await s.provisionWallet('x-desk');
  const otherHash = createHash('sha256').update(Buffer.alloc(32, 2).toString('base64url')).digest('hex');
  s.sqlite.prepare('UPDATE agent_wallets SET bearer_token_hash = ? WHERE agent_id = ?').run(otherHash, 'x-desk');
  for (const options of [{ token: null }, { token: 'a'.repeat(43) }, { as: 'x-desk' }]) {
    assert.equal((await s.post('send', options)).status, 401);
    assert.equal((await s.post('mint', options)).status, 401);
    s.assertUnlocked();
  }
  assert.equal((await s.post('send', { body: { ...s.send, amountMutez: 0.5 } })).status, 400);
  assert.equal((await s.post('mint', { body: { ...s.mint, metadataUri: 'file:///private.json' } })).status, 400);
  assert.equal((await s.post('send', { key: 'invalid key' })).status, 400);
  s.assertUnlocked();
  assert.equal((await s.post('mint', { body: {
    ...s.mint, contract: b58Encode(new Uint8Array(20).fill(13), PrefixV2.ContractHash),
  } })).status, 403);
  s.assertUnlocked();
  delete s.env.AGENT_WALLETS_MINT_CONTRACT;
  assert.equal((await s.post('mint')).status, 503);
  s.assertUnlocked();
  assert.equal(s.chain.prepares.length, 0);
});

test('a malformed stored digest returns 401 and never acquires a signer lock', async (t) => {
  const s = await setup(t);
  // Simulate a legacy or corrupt row that bypassed the current schema check.
  s.sqlite.exec('PRAGMA ignore_check_constraints = ON');
  const setHash = s.sqlite.prepare('UPDATE agent_wallets SET bearer_token_hash = ? WHERE agent_id = ?');
  for (const badHash of [TOKEN_HASH.slice(2), TOKEN_HASH + '0', TOKEN_HASH.slice(0, -1) + 'x']) {
    setHash.run(badHash, s.id);
    const response = await s.post('send');
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'wallet-unauthorized' });
    s.assertUnlocked();
  }
  assert.equal(s.chain.prepares.length, 0);
});

test('send and mint share a per-wallet spend cap including fees, and the audit log is append-only', async (t) => {
  const s = await setup(t);
  s.sqlite.prepare('UPDATE agent_wallets SET daily_cap_mutez = 3400 WHERE agent_id = ?').run(s.id);
  const yesterday = encodeOpHash('aa'.repeat(160));
  s.sqlite.prepare(`
    INSERT INTO agent_wallet_ops (agent_id, kind, op_hash, max_cost_mutez, last_counter, expires_level, request_hash, created_at)
    VALUES (?, 'send', ?, 3400, 1, 100, 'old-request', '2000-01-01T00:00:00.000Z')
  `).run(s.id, yesterday);
  const sent = await s.post('send');
  assert.equal(sent.status, 202);
  const { operationHash } = await sent.json();
  assert.equal(s.chain.prepares[0].previous.op_hash, yesterday);
  assert.equal(s.chain.prepares[0].budget, 3400);

  const minted = await s.post('mint');
  assert.equal(minted.status, 202);
  assert.equal(s.chain.prepares[1].budget, 1200);
  assert.deepEqual(s.chain.prepares[1].action, { ...s.mint, kind: 'mint', quantity: 1 });
  assert.deepEqual(s.rows().map((row) => [row.kind, row.max_cost_mutez]), [['send', 3400], ['send', 2200], ['mint', 1200]]);
  assert.equal(s.rows()[1].op_hash, operationHash);
  assert.ok(!JSON.stringify(s.rows()).includes(s.mint.metadataUri));
  assert.equal((await s.post('send')).status, 429);
  s.assertUnlocked();
  assert.equal((await s.post('mint')).status, 429);
  s.assertUnlocked();
  assert.throws(() => s.sqlite.exec('UPDATE agent_wallet_ops SET max_cost_mutez = 1'), /append-only/);
  assert.throws(() => s.sqlite.exec('DELETE FROM agent_wallet_ops'), /append-only/);
});

test('estimated fees can reject a send before broadcast even when the transfer amount fits', async (t) => {
  const s = await setup(t);
  s.sqlite.prepare('UPDATE agent_wallets SET daily_cap_mutez = 2000 WHERE agent_id = ?').run(s.id);
  assert.equal((await s.post('send')).status, 429);
  s.assertUnlocked();
  assert.equal(s.chain.broadcasts.length, 0);
  assert.deepEqual(s.rows(), []);
});

test('concurrent requests share the signer lock and a lost lease prevents broadcast', async (t) => {
  const s = await setup(t);
  const prepare = s.chain.prepare.bind(s.chain);
  const entered = Promise.withResolvers();
  const resume = Promise.withResolvers();
  s.chain.prepare = async (...args) => {
    entered.resolve();
    await resume.promise;
    return prepare(...args);
  };
  const startedAt = Date.now();
  const first = s.post('send');
  await entered.promise;
  const lease = s.sqlite.prepare('SELECT holder, expires_at FROM agent_wallet_signer_locks').get();
  assert.ok(lease.expires_at >= startedAt + 120_000 && lease.expires_at <= Date.now() + 120_000);
  assert.equal((await s.post('mint')).status, 409);
  assert.equal(s.sqlite.prepare('SELECT holder FROM agent_wallet_signer_locks').get().holder, lease.holder);
  s.sqlite.prepare('UPDATE agent_wallet_signer_locks SET holder = ? WHERE agent_id = ?').run('replacement', s.id);
  resume.resolve();

  const rejected = await first;
  assert.equal(rejected.status, 409);
  assert.equal((await rejected.json()).error, 'wallet-admission-changed');
  assert.equal(s.chain.broadcasts.length, 0);
  assert.equal(s.sqlite.prepare('SELECT holder FROM agent_wallet_signer_locks').get().holder, 'replacement');
});

test('revoking a bearer token during preparation prevents injection', async (t) => {
  const s = await setup(t);
  const prepare = s.chain.prepare.bind(s.chain);
  s.chain.prepare = async (...args) => {
    const signed = await prepare(...args);
    s.sqlite.prepare('UPDATE agent_wallets SET bearer_token_hash = NULL WHERE agent_id = ?').run(s.id);
    return signed;
  };
  assert.deepEqual(await (await s.post('send')).json(), { error: 'wallet-admission-changed' });
  s.assertUnlocked();
  assert.equal((await s.post('send')).status, 401);
  assert.equal(s.chain.broadcasts.length, 0);
  assert.deepEqual(s.rows(), []);
});

test('unexpected signing and D1 failures log only the error class and release the owned lock', async (t) => {
  const s = await setup(t);
  const log = t.mock.method(console, 'error', () => {});
  const prepare = s.chain.prepare.bind(s.chain);
  const fail = () => { throw new TypeError('private diagnostic'); };

  s.env.AUTH_DB.afterFirst = (sql) => { if (sql.includes('INSERT INTO agent_wallet_signer_locks')) fail(); };
  assert.equal((await s.post('send')).status, 503);
  s.assertUnlocked();
  delete s.env.AUTH_DB.afterFirst;

  s.chain.prepare = fail;
  const response = await s.post('send');
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'agent-wallet-unavailable' });
  s.assertUnlocked();

  s.chain.prepare = prepare;
  s.env.AUTH_DB.beforeFirst = (sql) => { if (sql.includes('INSERT INTO agent_wallet_ops')) fail(); };
  assert.equal((await s.post('send')).status, 503);
  s.assertUnlocked();
  assert.equal(s.chain.broadcasts.length, 0);
  assert.deepEqual(log.mock.calls.map((call) => call.arguments), Array.from({ length: 3 },
    () => ['agent-wallet-unavailable', 'TypeError']));
});

test('an ambiguous injection retains its hash and retries with the same key never inject again', async (t) => {
  const s = await setup(t);
  s.chain.broadcastError = new Error('private diagnostic');
  const first = await s.post('send', { key: 'transfer-1' });
  const { status, operationHash } = await first.json();
  assert.equal(first.status, 202);
  assert.equal(status, 'submission-unknown');
  assert.equal(s.rows()[0].op_hash, operationHash);
  s.assertUnlocked();
  const replay = await s.post('send', { key: 'transfer-1' });
  assert.deepEqual(await replay.json(), { status: 'recorded', operationHash });
  assert.equal((await s.post('send', { key: 'transfer-1', body: { ...s.send, amountMutez: 1001 } })).status, 409);
  s.assertUnlocked();
  assert.deepEqual(s.chain.broadcasts, [operationHash]);

  s.chain.prepare = async (_row, _action, _budget, previous) => {
    assert.equal(previous.op_hash, operationHash);
    throw new chainLib.WalletError('wallet-operation-pending', 409, previous.op_hash);
  };
  const pending = await s.post('send', { key: 'transfer-2' });
  assert.deepEqual(await pending.json(), { error: 'wallet-operation-pending', operationHash });
  s.assertUnlocked();
});

test('wallet detail never provisions a wallet, including before the wallet table exists', async (t) => {
  const s = await setup(t, true, false);
  const sqlite = new DatabaseSync(':memory:');
  t.after(() => sqlite.close());
  const fetchMock = t.mock.method(globalThis, 'fetch', () => assert.fail('unprovisioned wallet reached TzKT'));
  for (const db of [sqlite, s.sqlite]) {
    db.exec('PRAGMA query_only = ON');
    const response = await detail.onRequestGet({
      request: new Request(`https://pointcast.xyz/api/agent-wallets/${s.id}`),
      params: { id: s.id },
      env: { ...s.env, AUTH_DB: d1(db) },
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'wallet-not-found' });
  }
  assert.equal(sqlite.prepare("SELECT name FROM sqlite_schema WHERE name = 'agent_wallets'").get(), undefined);
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) AS count FROM agent_wallets').get().count, 0);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('wallet detail caches the public TzKT snapshot for 30 seconds per address', async (t) => {
  const s = await setup(t, true);
  const other = await s.provisionWallet('x-desk');
  s.sqlite.exec('PRAGMA query_only = ON');
  const operationHash = encodeOpHash('ff'.repeat(160));
  const calls = [];
  const entries = new Map();
  let now = 0;
  const cache = {
    async match(key) {
      const entry = entries.get(key.url);
      return entry?.expires > now ? entry.response.clone() : undefined;
    },
    async put(key, response) {
      assert.equal(response.headers.get('cache-control'), 'public, max-age=30');
      entries.set(key.url, { expires: now + 30_000, response: response.clone() });
    },
  };
  const fetchTzkt = async (url, options) => {
    assert.equal(options.redirect, 'manual');
    calls.push(url);
    if (url.endsWith('/balance')) return Response.json(246);
    return Response.json([
      { hash: operationHash, type: 'transaction', timestamp: '2026-11-21T12:00:00Z', level: 32, status: 'applied', amount: 246, private: 'excluded' },
    ]);
  };
  const get = (id, fetchIndex = fetchTzkt, query = '') => ops.handleWalletDetail(
    new Request(`https://pointcast.xyz/api/agent-wallets/${id}${query}`), s.env, id, fetchIndex, cache,
  );
  const response = await get(s.id);
  assert.equal(response.status, 200);
  const body = await response.json();
  const base = `https://api.tzkt.io/v1/accounts/${body.address}`;
  assert.deepEqual(calls, [`${base}/balance`, `${base}/operations?limit=10`]);
  assert.equal(body.balanceMutez, 246);
  assert.equal(body.network, 'mainnet');
  assert.deepEqual(body.recentOps, [{
    hash: operationHash, type: 'transaction', timestamp: '2026-11-21T12:00:00Z', level: 32, status: 'applied', amountMutez: 246,
  }]);
  assert.deepEqual(Object.keys(body).sort(), ['address', 'balanceMutez', 'createdAt', 'id', 'name', 'network', 'recentOps', 'role']);
  now = 29_999;
  assert.deepEqual(await (await get(s.id, fetchTzkt, '?v=2')).json(), body);
  assert.equal(calls.length, 2, 'the same address reuses both TzKT results');
  const empty = await get('x-desk', async (url) => {
    assert.ok(url.includes(other.address));
    return Response.json(url.endsWith('/balance') ? 0 : []);
  });
  assert.equal((await empty.json()).balanceMutez, 0);
  assert.deepEqual([...entries.keys()].sort(), [s.wallet.address, other.address]
    .map((address) => `https://pointcast.xyz/__cache/agent-wallet-tzkt/v1/${address}`).sort());
  assert.equal((await get('missing')).status, 404);
  now = 30_001;
  const unavailable = await get(s.id, async () => { throw new Error('private diagnostic'); });
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), { error: 'wallet-detail-unavailable' });
  assert.deepEqual(await (await get(s.id)).json(), body);
  assert.equal(calls.length, 4, 'an expired snapshot is fetched again after a failure');
});

test('overlapping roster updates cannot create more than 64 wallets', async (t) => {
  const s = await setup(t);
  const insert = s.sqlite.prepare(`
    INSERT INTO agent_wallets (agent_id, address, secret_iv, secret_ciphertext, created_at) VALUES (?, ?, 'iv', 'ciphertext', 'old')
  `);
  for (let index = 0; index < 62; index += 1) insert.run(`retired-${index}`, `old-address-${index}`);
  await Promise.all([s.provisionWallet('x-desk'), s.provisionWallet('nouns-money')]);
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) AS wallets FROM agent_wallets').get().wallets, 64);
  assert.deepEqual(await wallets.getAgentWallet(s.env, s.id), s.wallet);
});

test('Taquito forges and signs a reveal plus send and encodes a TZIP-21 URI in the FA2 mint call', async (t) => {
  const s = await setup(t);
  const { LocalForger } = await import('@taquito/local-forging');
  const forger = new LocalForger();
  const base = 'https://tezos-rpc.invalid';
  const branch = 'BMLKyHeBTy9wr9eew5pQahiv6k8DPciMrPtaDEyhuMMwCiV11u4';
  const protocol = 'PsUshuai9QapM5TGj1JpuVGkdxz5GykdnEvS6Rh8SUVrARvZLCY';
  const row = s.sqlite.prepare('SELECT * FROM agent_wallets WHERE agent_id = ?').get(s.id);
  const signer = await wallets.agentWalletSigner(s.env, row);
  const publicKey = await signer.publicKey();
  const mintType = { prim: 'pair', annots: ['%mint'], args: [
    { prim: 'address', annots: ['%to_'] },
    { prim: 'nat', annots: ['%token_id'] },
    { prim: 'nat', annots: ['%amount'] },
    { prim: 'map', annots: ['%token_info'], args: [{ prim: 'string' }, { prim: 'bytes' }] },
  ] };
  const defaultType = { prim: 'unit', annots: ['%default'] };
  const contract = { balance: '0', script: {
    code: [
      { prim: 'parameter', args: [{ prim: 'or', args: [defaultType, mintType] }] },
      { prim: 'storage', args: [{ prim: 'unit' }] },
      { prim: 'code', args: [[]] },
    ],
    storage: { prim: 'Unit' },
  } };
  const constants = {
    hard_gas_limit_per_operation: '1040000', hard_gas_limit_per_block: '1040000',
    hard_storage_limit_per_operation: '60000', cost_per_byte: '250', max_operations_time_to_live: 600,
  };
  let counter = 25;
  let reveal = true;
  let blockLevel = 200;
  let injected = 0;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const { origin, pathname } = new URL(url);
    assert.equal(origin, base);
    if (pathname.endsWith('/chain_id')) return Response.json('NetXdQprcVkpaWU');
    if (pathname.endsWith('/context/constants')) return Response.json(constants);
    if (pathname.endsWith('/protocols')) return Response.json({ protocol, next_protocol: protocol });
    if (pathname.endsWith('/header')) return Response.json({ hash: branch, level: blockLevel });
    if (pathname.endsWith('/manager_key')) return Response.json(reveal ? null : publicKey);
    if (pathname.endsWith(`/contracts/${s.wallet.address}`)) return Response.json({ balance: '10000000', counter: String(counter) });
    if (pathname.endsWith('/balance') || pathname.endsWith('/spendable')) return Response.json('10000000');
    if (pathname.endsWith('/mempool/filter')) return Response.json({});
    if (pathname.endsWith(`/contracts/${CONTRACT}`)) return Response.json(contract);
    if (pathname.endsWith('/entrypoints')) return Response.json({ entrypoints: { default: defaultType, mint: mintType } });
    if (pathname.endsWith('/simulate_operation')) {
      const { operation } = JSON.parse(init.body);
      return Response.json({ contents: operation.contents.map((op) => ({
        ...op,
        metadata: { operation_result: {
          status: 'applied', consumed_milligas: '500000',
          ...(op.kind === 'transaction' ? { paid_storage_size_diff: '5' } : {}),
        } },
      })) });
    }
    if (pathname === '/injection/operation') {
      assert.equal(init.redirect, 'manual');
      injected += 1;
      return Response.json(encodeOpHash(JSON.parse(init.body)));
    }
    assert.fail(`Unexpected mock RPC request ${pathname}`);
  });
  const chain = await chainLib.createWalletChain({ ...s.env, AGENT_WALLETS_RPC_URL: base });
  const transfer = { ...s.send, kind: 'send' };
  const sent = await chain.prepare(row, transfer, 5_000_000, null);
  assert.equal(sent.hash, encodeOpHash(sent.bytes));
  assert.equal(sent.expiresLevel, 800);
  const sentContents = (await forger.parse(sent.bytes.slice(0, -128))).contents;
  assert.deepEqual(sentContents.map((op) => op.kind), ['reveal', 'transaction']);
  assert.equal(sent.lastCounter, 27);
  assert.equal(sentContents[0].public_key, publicKey);
  assert.equal(sentContents[1].amount, String(transfer.amountMutez));
  assert.equal(sent.maxCostMutez, transfer.amountMutez + sentContents.reduce(
    (total, op) => total + Number(op.fee) + (Number(op.storage_limit) * 250), 0,
  ));

  const previous = { op_hash: sent.hash, last_counter: sent.lastCounter, expires_level: sent.expiresLevel };
  await assert.rejects(chain.prepare(row, transfer, 5_000_000, previous), { code: 'wallet-operation-pending' });
  await chain.broadcast(sent);
  assert.equal(injected, 1);

  counter = sent.lastCounter;
  reveal = false;
  const mint = { ...s.mint, kind: 'mint', quantity: 2 };
  const minted = await chain.prepare(row, mint, 5_000_000, previous);
  const [call] = (await forger.parse(minted.bytes.slice(0, -128))).contents;
  assert.equal(call.destination, CONTRACT);
  assert.equal(call.amount, '0');
  assert.equal(call.parameters.entrypoint, 'mint');
  assert.match(JSON.stringify(call.parameters.value), new RegExp(Buffer.from(mint.metadataUri).toString('hex')));
  assert.equal(minted.lastCounter, 28);

  blockLevel = 801;
  counter = 25;
  assert.ok(await chain.prepare(row, transfer, 5_000_000, previous), 'expired branch releases the counter gate');
});
