import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import { privateKeyToAccount } from 'viem/accounts';
import {
  buildBuyerTypedData, connectBuyerWallet, createWalletDiscovery, hashBuyerRequest,
  signBuyerPayment, validateBuyerQuote, verifyBuyerReceipt, watchBuyerWallet,
} from '../src/lib/x402-buyer.ts';
import {
  X402_CHAIN_ID, X402_DEFAULT_ASSET, X402_DEFAULT_PAY_TO, X402_NETWORK, X402_PERMIT2,
  X402_PROXY, X402_RECEIPT_SPEC, X402_TREASURY_AGENT_ID,
  buildCanonicalReceiptPayload, decodeBase64Json, encodeBase64Json, importReceiptPrivateKey, signCanonicalPayload,
} from '../src/lib/x402.ts';

// Offline, deterministic fixture signer. Never connected to a wallet or chain.
const account = privateKeyToAccount('0x' + '11'.repeat(32));
const otherAccount = privateKeyToAccount('0x' + '22'.repeat(32));
const NOW = 1_789_000_000_000;
const ENDPOINT = 'https://pointcast.xyz/api/agent/bench';
const ACTION_ID = 'pai_' + 'a'.repeat(32);
const TX = '0x' + 'ab'.repeat(32);
const ID = '12345678-1234-4123-8123-123456789abc';
const ID2 = '12345678-1234-4123-8123-123456789def';
function rawQuote() {
  return { x402Version: 2, accepts: [{ scheme: 'exact', network: X402_NETWORK, amount: '10000',
    asset: X402_DEFAULT_ASSET, payTo: X402_DEFAULT_PAY_TO, maxTimeoutSeconds: 60,
    extra: { name: 'USDC', version: '2', assetTransferMethod: 'permit2' } }],
  resource: { url: ENDPOINT, description: 'One bench question.', mimeType: 'application/json' }, error: null };
}
function quote(options = {}, raw = rawQuote()) {
  return validateBuyerQuote(raw, { endpoint: ENDPOINT, nowMs: NOW, ...options });
}
class Provider extends EventEmitter {
  constructor() { super(); this.calls = []; this.accounts = [account.address]; this.chain = '0x' + X402_CHAIN_ID.toString(16); }
  async request(args) {
    this.calls.push(args);
    if (args.method === 'eth_chainId') return this.chain;
    if (['eth_accounts', 'eth_requestAccounts'].includes(args.method)) return [...this.accounts];
    if (args.method === 'eth_signTypedData_v4') {
      if (this.onSign) return this.onSign(args);
      return account.signTypedData(JSON.parse(args.params[1]));
    }
    throw new Error('Unexpected wallet method: ' + args.method);
  }
}
function wallet(provider = new Provider(), uuid = ID) { return { uuid, name: 'Fixture wallet', rdns: 'test.fixture', provider }; }
function signOptions(w, q = quote(), extra = {}) {
  return { wallet: w, quote: q, expectedAccount: account.address, now: () => NOW, randomBytes: () => new Uint8Array(32).fill(7), ...extra };
}
function announce(target, w) {
  target.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: {
    info: { uuid: w.uuid, name: w.name, rdns: w.rdns, icon: 'data:image/svg+xml,<svg onload="bad()"/>' }, provider: w.provider,
  } }));
}

test('EIP-6963 discovery is passive, preserves explicit wallet selection, and never reads window.ethereum', () => {
  const target = new EventTarget();
  Object.defineProperty(target, 'ethereum', { get() { throw new Error('legacy provider must not be read'); } });
  const first = wallet(), second = wallet(new Provider(), ID2);
  let requests = 0;
  target.addEventListener('eip6963:requestProvider', () => { requests++; announce(target, first); announce(target, second); });
  const discovery = createWalletDiscovery(target);
  assert.equal(requests, 1);
  assert.equal(discovery.wallets().length, 2);
  assert.throws(() => discovery.select(''), /select-a-wallet/);
  assert.equal(discovery.select(ID2).provider, second.provider);
  assert.equal('icon' in discovery.wallets()[0], false);
  assert.equal(first.provider.calls.length + second.provider.calls.length, 0);
  announce(target, first);
  assert.equal(discovery.wallets().length, 2, 're-announcements do not add duplicate wallets');
  discovery.stop();
  announce(target, first);
  assert.equal(discovery.wallets().length, 0);
  assert.throws(() => discovery.select(ID), /select-a-wallet/);
});

test('conflicting UUID announcements cannot replace the wallet a user selected', () => {
  const target = new EventTarget(), discovery = createWalletDiscovery(target);
  announce(target, wallet());
  announce(target, wallet(new Provider()));
  assert.equal(discovery.wallets().length, 0);
  assert.throws(() => discovery.select(ID), /select-a-wallet/);
  announce(target, wallet());
  assert.equal(discovery.wallets().length, 0);
  announce(target, { ...wallet(), uuid: 'not-a-uuid' });
  assert.equal(discovery.wallets().length, 0);
  discovery.stop();
});

test('connect is an account request only, refuses a wrong chain, and detects a changing account', async () => {
  const w = wallet();
  assert.deepEqual(await connectBuyerWallet(w), { payer: account.address.toLowerCase(), chainId: X402_CHAIN_ID });
  assert.deepEqual(w.provider.calls.map(c => c.method), ['eth_chainId', 'eth_requestAccounts', 'eth_chainId', 'eth_accounts']);
  const wrong = wallet(); wrong.provider.chain = '0x1';
  await assert.rejects(connectBuyerWallet(wrong), /switch-wallet-to-etherlink/);
  assert.deepEqual(wrong.provider.calls.map(c => c.method), ['eth_chainId']);
  const changing = wallet();
  const original = changing.provider.request.bind(changing.provider);
  changing.provider.request = async args => args.method === 'eth_accounts' ? [otherAccount.address] : original(args);
  await assert.rejects(connectBuyerWallet(changing), /wallet-changed/);
});

test('wallet observation reports changes without making requests and unsubscribes', () => {
  const w = wallet(); let changes = 0;
  const stop = watchBuyerWallet(w, () => changes++);
  for (const event of ['accountsChanged', 'chainChanged', 'disconnect']) w.provider.emit(event, []);
  assert.equal(changes, 3); assert.equal(w.provider.calls.length, 0);
  stop(); w.provider.emit('accountsChanged', []);
  assert.equal(changes, 3);
});

test('quote accepts object or encoded header, pins all economics, freezes nested values and honors server expiry', () => {
  const q = quote({ expiresAt: NOW + 20_000 });
  assert.equal(q.expiresAt, NOW + 20_000);
  assert.equal(q.permit2, X402_PERMIT2); assert.equal(q.proxy, X402_PROXY);
  assert.equal(q.accepted.amount, '10000'); assert.equal(q.accepted.payTo, X402_DEFAULT_PAY_TO);
  assert.throws(() => { q.accepted.asset = otherAccount.address; }, TypeError);
  assert.throws(() => { q.accepted.extra.assetTransferMethod = 'eip3009'; }, TypeError);
  assert.equal(quote({ expiresAt: new Date(NOW + 20_000).toISOString() }).expiresAt, NOW + 20_000);
  assert.equal(quote({ expiresAt: NOW + 600_000 }).expiresAt, NOW + 60_000);
  assert.deepEqual(quote({}, encodeBase64Json(rawQuote())), quote());
});

test('quote rejects changed economic terms, unknown proxy fields, unsafe URLs and unreasonable deadlines', () => {
  const changes = [
    q => { q.x402Version = 1; }, q => { q.accepts.push(q.accepts[0]); },
    q => { q.accepts[0].scheme = 'upto'; }, q => { q.accepts[0].network = 'eip155:1'; },
    q => { q.accepts[0].asset = otherAccount.address; }, q => { q.accepts[0].payTo = otherAccount.address; },
    q => { q.accepts[0].amount = '10001'; }, q => { q.accepts[0].amount = 10000; },
    q => { q.accepts[0].maxTimeoutSeconds = 61; }, q => { q.accepts[0].maxTimeoutSeconds = 0; },
    q => { q.accepts[0].maxTimeoutSeconds = '60'; }, q => { q.accepts[0].extra.assetTransferMethod = 'eip3009'; },
    q => { q.accepts[0].extra.proxy = otherAccount.address; }, q => { q.accepts[0].spender = otherAccount.address; },
    q => { q.resource.url = 'https://attacker.example/api/agent/bench'; }, q => { q.resource.mimeType = 'text/html'; },
  ];
  for (const change of changes) { const raw = rawQuote(); change(raw); assert.throws(() => quote({}, raw)); }
  for (const endpoint of ['http://pointcast.xyz/api/agent/bench', ENDPOINT + '?token=x', ENDPOINT + '#x',
    'https://name:password@pointcast.xyz/api/agent/bench', 'https://pointcast.xyz/api/x402/receipt']) {
    assert.throws(() => quote({ endpoint }));
  }
  const alien = rawQuote(); alien.resource.url = 'https://attacker.example/api/agent/bench';
  assert.throws(() => quote({ endpoint: alien.resource.url }, alien), /invalid-purchase-endpoint/);
  assert.throws(() => quote({ amountUnits: '20000' }), /unsupported-purchase-amount/);
  assert.throws(() => quote({ expiresAt: 'invalid' }), /invalid-clock/);
  assert.throws(() => quote({}, 'x'.repeat(16_385)), /invalid-payment-quote/);
});

test('typed Permit2 data binds the fixed proxy, recipient, amount, chain, nonce and current deadline', () => {
  const built = buildBuyerTypedData({ quote: quote(), payer: account.address, nonce: '123', nowMs: NOW + 10_000 });
  assert.deepEqual(built.typedData.domain, { name: 'Permit2', chainId: X402_CHAIN_ID, verifyingContract: X402_PERMIT2 });
  assert.equal(built.typedData.primaryType, 'PermitWitnessTransferFrom');
  assert.deepEqual(built.permit2Authorization, { from: account.address.toLowerCase(),
    permitted: { token: X402_DEFAULT_ASSET, amount: '10000' }, spender: X402_PROXY, nonce: '123',
    deadline: String(NOW / 1000 + 60), witness: { to: X402_DEFAULT_PAY_TO, validAfter: String(NOW / 1000 + 10), extra: '0x' } });
  assert.equal('from' in built.typedData.message, false, 'owner is the signing account, not an extra EIP-712 field');
  assert.throws(() => { built.typedData.types.Witness[0].type = 'bytes32'; }, TypeError);
  for (const nonce of ['-1', '01', '1.2', (2n ** 256n).toString()]) {
    assert.throws(() => buildBuyerTypedData({ quote: quote(), payer: account.address, nonce, nowMs: NOW }), /invalid-payment-nonce/);
  }
});

test('a click signs exactly once, verifies the recovered EOA and only returns an in-memory payload', async () => {
  const w = wallet();
  const signed = await signBuyerPayment(signOptions(w));
  assert.deepEqual(w.provider.calls.map(c => c.method), ['eth_chainId', 'eth_accounts', 'eth_signTypedData_v4', 'eth_chainId', 'eth_accounts']);
  assert.deepEqual(decodeBase64Json(signed.paymentSignature), signed.paymentPayload);
  assert.equal(signed.paymentPayload.accepted.asset, X402_DEFAULT_ASSET);
  assert.equal(signed.paymentPayload.payload.permit2Authorization.spender, X402_PROXY);
  assert.equal(signed.payer, account.address.toLowerCase());
  assert.equal(signed.deadline, NOW / 1000 + 60);
  for (const event of ['accountsChanged', 'chainChanged', 'disconnect']) assert.equal(w.provider.listenerCount(event), 0);
});

test('signing refuses unreviewed, stale, cancelled or wrong-account requests before any signature', async () => {
  const cases = [
    { quote: { ...quote() }, error: /review-payment-quote-first/ },
    { now: () => NOW + 60_000, error: /payment-quote-expired/ },
    { now: () => NOW + 46_000, error: /payment-window-too-short/ },
    { now: () => NOW - 1, error: /payment-quote-expired/ },
    { expectedAccount: otherAccount.address, error: /wallet-changed/ },
    { signal: AbortSignal.abort(), error: /purchase-cancelled/ },
    { randomBytes: () => new Uint8Array(1), error: /invalid-payment-randomness/ },
  ];
  for (const { error, ...options } of cases) {
    const w = wallet();
    await assert.rejects(signBuyerPayment(signOptions(w, quote(), options)), error);
    assert.equal(w.provider.calls.filter(c => c.method === 'eth_signTypedData_v4').length, 0);
  }
});

test('wallet rejection is not retried and a malformed or other-account signature is never returned', async () => {
  for (const outcome of ['reject', 'malformed', 'wrong-account']) {
    const w = wallet();
    w.provider.onSign = async args => {
      if (outcome === 'reject') throw Object.assign(new Error('User rejected'), { code: 4001 });
      if (outcome === 'malformed') return '0x1234';
      return otherAccount.signTypedData(JSON.parse(args.params[1]));
    };
    await assert.rejects(signBuyerPayment(signOptions(w)));
    assert.equal(w.provider.calls.filter(c => c.method === 'eth_signTypedData_v4').length, 1);
    assert.equal(w.provider.listenerCount('accountsChanged'), 0);
  }
});

test('account, chain, disconnect, cancellation and expiry during a wallet prompt discard the late signature', async () => {
  for (const change of ['accountsChanged', 'chainChanged', 'disconnect', 'abort', 'expiry', 'silent-chain', 'silent-account']) {
    const w = wallet(), controller = new AbortController(); let now = NOW;
    w.provider.onSign = async args => {
      if (change === 'abort') controller.abort();
      else if (change === 'expiry') now += 60_000;
      else if (change === 'silent-chain') w.provider.chain = '0x1';
      else if (change === 'silent-account') w.provider.accounts = [otherAccount.address];
      else w.provider.emit(change, []);
      return account.signTypedData(JSON.parse(args.params[1]));
    };
    await assert.rejects(signBuyerPayment(signOptions(w, quote(), { now: () => now, signal: controller.signal })));
    assert.equal(w.provider.calls.filter(c => c.method === 'eth_signTypedData_v4').length, 1);
    assert.equal(w.provider.listenerCount('accountsChanged'), 0);
  }
});

async function signedReceipt(change = () => {}) {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const publicDer = publicKey.export({ format: 'der', type: 'spki' });
  const key = await importReceiptPrivateKey(privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'));
  const requestBody = { question: 'One small question.' };
  const receipt = { id: 'x402-' + TX.slice(2, 14), timestamp: new Date(NOW).toISOString(), type: 'RECEIPT',
    receipt_schema: X402_RECEIPT_SPEC, resource_id: ACTION_ID, request_hash: await hashBuyerRequest('bench', requestBody),
    action: 'bench', action_result: { ok: true, action: 'bench', actionId: ACTION_ID, bench: { ok: true } },
    spend: { status: 'settled', payee_agent_id: X402_TREASURY_AGENT_ID },
    settlement: { rail: 'x402', x402_version: 2, scheme: 'exact', chain_id: X402_CHAIN_ID, network: X402_NETWORK,
      asset: X402_DEFAULT_ASSET, asset_symbol: 'USDC', amount_units: '10000', payer: account.address,
      pay_to: X402_DEFAULT_PAY_TO, tx: TX, gas_payer: 'facilitator' },
  };
  change(receipt);
  receipt.receipt_payload = buildCanonicalReceiptPayload(receipt);
  receipt.receipt_signature = { alg: 'EdDSA', kid: X402_TREASURY_AGENT_ID, value: await signCanonicalPayload(receipt.receipt_payload, key) };
  return { receipt, expected: { quote: quote(), payer: account.address, action: 'bench', requestBody,
    actionId: ACTION_ID, transactionHash: TX, publicKey: publicDer.subarray(-32).toString('base64') } };
}

test('receipt verification independently checks the signature, exact economics and signed action binding without claiming chain proof', async () => {
  const { receipt, expected } = await signedReceipt();
  const verified = await verifyBuyerReceipt(receipt, expected);
  assert.equal(verified.valid, true); assert.equal(verified.signatureVerified, true);
  assert.equal(verified.termsVerified, true); assert.equal(verified.actionVerified, true);
  assert.equal(verified.chainVerified, false); assert.equal(verified.transactionHash, TX);
  receipt.action = 'unsigned-top-level-tampering';
  assert.equal((await verifyBuyerReceipt(receipt, expected)).valid, true, 'binding uses signed request hash and action_result, not the unsigned label');
  receipt.action_result.action = 'cast';
  assert.equal((await verifyBuyerReceipt(receipt, expected)).signatureVerified, false);
});

test('validly signed receipts for another amount, payer, payee, chain, request or action cannot verify this purchase', async () => {
  const changes = [
    r => { r.settlement.amount_units = '20000'; }, r => { r.settlement.asset = otherAccount.address; },
    r => { r.settlement.payer = otherAccount.address; }, r => { r.settlement.pay_to = otherAccount.address; },
    r => { r.settlement.network = 'eip155:1'; }, r => { r.settlement.chain_id = 1; },
    r => { r.settlement.tx = '0x' + 'cd'.repeat(32); }, r => { r.request_hash = '0'.repeat(64); },
    r => { r.resource_id = 'pai_' + 'b'.repeat(32); }, r => { r.action_result.actionId = 'pai_' + 'b'.repeat(32); },
    r => { r.action_result.action = 'cast'; }, r => { r.action_result.ok = false; },
    r => { r.action_result.actionCompleted = false; }, r => { r.receipt_schema = 'legacy'; },
  ];
  for (const change of changes) {
    const { receipt, expected } = await signedReceipt(change);
    assert.equal((await verifyBuyerReceipt(receipt, expected)).valid, false);
  }
  const { receipt, expected } = await signedReceipt();
  assert.equal((await verifyBuyerReceipt(receipt, { ...expected, requestBody: { question: 'Changed question.' } })).valid, false);
  assert.equal((await verifyBuyerReceipt(receipt, { ...expected, publicKey: undefined })).valid, false, 'test signer is not the production treasury key');
});

test('buyer request hashing matches the server canonical action hash, not JSON insertion order', async () => {
  const { hashAgentActionRequest } = await import('../functions/_lib/agent-identity.ts');
  const body = { question: 'Trimmed text.' };
  assert.equal(await hashBuyerRequest('bench', body), await hashAgentActionRequest('bench', body));
  assert.notEqual(await hashBuyerRequest('cast', body), await hashBuyerRequest('bench', body));
});
