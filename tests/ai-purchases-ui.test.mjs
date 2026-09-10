import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { mountAiPurchases, purchaseStatus, readPurchaseResponse, safeBenchUrl } from '../src/lib/auth/ai-purchases-ui.ts';
import { X402_DEFAULT_ASSET, X402_DEFAULT_PAY_TO } from '../src/lib/x402.ts';

const component = readFileSync(new URL('../src/components/AiPurchases.astro', import.meta.url), 'utf8').split('<script>')[0];
const sessionUser = userId => ({ userId, createdAt: '2026-09-09T00:00:00.000Z', identities: [{ provider: 'kukai', id: 'tz1-verified-wallet', name: 'Wallet', verifiedAt: '2026-09-09T00:00:00.000Z' }], preferredName: 'PointCast member' });
const bridgeSession = (dom, userId) => dom.window.dispatchEvent(new dom.window.CustomEvent('pc:auth-change', { detail: { user: userId ? sessionUser(userId) : null, source: 'tezos-session-bridge' } }));
const tick = () => new Promise(resolve => setImmediate(resolve));
const settle = async () => { await tick(); await tick(); await tick(); };
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const account = '0x1111111111111111111111111111111111111111';
const runtime = { id: 'runtime-a', label: 'My computer', provider: 'codex', model: 'native-model' };
function purchase(extra = {}) {
  return { id: 'purchase-a', runtimeId: runtime.id, status: 'quoted', question: 'A public question?', amount: '10000', symbol: 'USDC', displayAmount: '0.01', network: 'eip155:42793', payTo: X402_DEFAULT_PAY_TO, asset: X402_DEFAULT_ASSET,
    endpoint: 'https://pointcast.xyz/api/agent/bench', quote: { test: true }, quoteHash: 'pinned-quote-hash', expiresAt: Date.now() + 60000, payer: null, actionId: null, transactionHash: null,
    receiptVerified: false, chainVerified: false, deliveryVerified: false, result: null, error: null, createdAt: Date.now(), updatedAt: Date.now(), ...extra };
}
function delivered(extra = {}) {
  return purchase({ status: 'delivered', payer: account, actionId: 'action-a', receiptVerified: true, chainVerified: false, deliveryVerified: true,
    transactionHash: '0x' + 'a'.repeat(64), result: { sit: { id: 'sit-a', day: '2026-09-09', answer: 'A public question?', name: '0x1111…1111' }, url: 'https://pointcast.xyz/api/bench?day=2026-09-09' }, ...extra });
}
function fixture(t, initial = {}, overrides = {}) {
  const dom = new JSDOM(component, { url: 'https://pointcast.test/me', pretendToBeVisual: true });
  const root = dom.window.document.querySelector('[data-ai-purchases]');
  const state = { snapshot: { ok: true, available: true, runtimes: [runtime], purchases: [], ...initial }, writes: [], connects: 0, signatures: 0, watches: new Set(), reads: 0 };
  const wallet = { uuid: 'wallet-a', name: 'Test wallet', rdns: 'test.wallet', provider: { request: async ({ method }) => method === 'eth_accounts' ? [account] : '0xa729' } };
  const api = {
    createWalletDiscovery: () => ({ wallets: () => [wallet], select: id => { assert.equal(id, wallet.uuid); return wallet; }, stop() {} }),
    watchBuyerWallet: (_wallet, change) => { state.watches.add(change); return () => state.watches.delete(change); },
    connectBuyerWallet: async () => { state.connects += 1; return { payer: account, chainId: 42793 }; },
    validateBuyerQuote: (_quote, options) => ({ amountUnits: '10000', endpoint: options.endpoint, expiresAt: options.expiresAt, accepted: { network: 'eip155:42793', payTo: X402_DEFAULT_PAY_TO, asset: X402_DEFAULT_ASSET } }),
    signBuyerPayment: async args => { state.signatures += 1; return { paymentSignature: 'reviewed-signature', payer: args.expectedAccount, deadline: Date.now() / 1000 + 60 }; },
    ...overrides.walletApi,
  };
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, '/api/me/ai-purchases'); assert.equal(init.credentials, 'include');
    if (init.method === 'GET') { state.reads += 1; return overrides.read ? overrides.read(state, init) : Response.json(state.snapshot); }
    const body = JSON.parse(init.body); state.writes.push(body);
    if (overrides.write) return overrides.write(body, state);
    let result = body.operation === 'quote' ? purchase({ question: body.question.replace(/[<>]/g, '') })
      : body.operation === 'submit' ? delivered() : body.operation === 'cancel' ? purchase({ status: 'expired' }) : state.snapshot.purchases[0];
    state.snapshot.purchases = [result]; return Response.json({ ok: true, purchase: result });
  });
  const cleanup = mountAiPurchases(root, { walletApi: api, pollMs: overrides.pollMs ?? 100000 });
  t.after(() => { cleanup(); dom.window.close(); });
  const q = selector => root.querySelector(selector);
  const chooseAndConnect = async () => { q('[data-purchase-wallet]').value = wallet.uuid; q('[data-purchase-wallet]').dispatchEvent(new dom.window.Event('change')); q('[data-purchase-connect]').click(); await settle(); };
  const consentAndApprove = () => { q('[data-purchase-public-consent]').checked = true; q('[data-purchase-public-consent]').dispatchEvent(new dom.window.Event('change')); q('[data-purchase-approve]').click(); };
  return { dom, root, state, q, chooseAndConnect, consentAndApprove };
}

test('availability and task eligibility keep wallet access optional and blocked before a verified AI task', async t => {
  const f = fixture(t, { available: false, runtimes: [] }); await settle();
  assert.equal(f.q('[data-purchase-quote]').disabled, true);
  assert.equal(f.q('[data-purchase-review]').hidden, true);
  assert.equal(f.state.connects, 0); assert.equal(f.state.signatures, 0); assert.deepEqual(f.state.writes, []);
  assert.match(f.root.textContent, /Free participation/);
});

test('review shows canonical public text, full pinned recipient and asset without opening a wallet', async t => {
  const f = fixture(t); await settle();
  f.q('[data-purchase-question]').value = '<A public question?>'; f.q('[data-purchase-quote]').click(); await settle();
  assert.equal(f.state.writes[0].operation, 'quote'); assert.match(f.state.writes[0].requestId, /^[0-9a-f-]{36}$/);
  assert.equal(f.q('[data-purchase-public-text]').textContent, 'A public question?');
  assert.equal(f.q('[data-purchase-question]').value, 'A public question?');
  assert.equal(f.q('[data-purchase-recipient]').textContent, X402_DEFAULT_PAY_TO);
  assert.equal(f.q('[data-purchase-asset]').textContent, X402_DEFAULT_ASSET);
  assert.match(f.q('[data-purchase-price]').textContent, /0.01 USDC/);
  assert.match(f.q('[data-purchase-network]').textContent, /eip155:42793/);
  assert.equal(f.q('[data-purchase-approve]').disabled, true);
  assert.equal(f.state.connects, 0); assert.equal(f.state.signatures, 0);
});

test('explicit wallet connection and publication consent precede one signature; delivery and transfer proof remain separate', async t => {
  const f = fixture(t, { purchases: [purchase()] }); await settle();
  await f.chooseAndConnect();
  assert.equal(f.state.connects, 1); assert.equal(f.state.signatures, 0); assert.equal(f.q('[data-purchase-approve]').disabled, true);
  assert.match(f.q('[data-purchase-payer]').textContent, /public Bench name: 0x1111…1111/);
  f.consentAndApprove(); await settle();
  assert.equal(f.state.signatures, 1);
  assert.deepEqual(f.state.writes, [{ operation: 'submit', purchaseId: 'purchase-a', quoteHash: 'pinned-quote-hash', paymentSignature: 'reviewed-signature', confirmPublic: true }]);
  assert.match(f.q('[data-purchase-badge]').textContent, /Question delivered/);
  assert.match(f.q('[data-purchase-receipt-proof]').textContent, /verified the receipt signature/);
  assert.match(f.q('[data-purchase-chain-proof]').textContent, /transfer check pending/);
  assert.equal(f.q('[data-purchase-reconcile]').hidden, false);
  assert.equal(f.q('[data-purchase-approval]').hidden, true);
  assert.equal(f.q('[data-purchase-result-link]').getAttribute('href'), 'https://pointcast.xyz/api/bench?day=2026-09-09');
});

test('wallet rejection does not submit a payment', async t => {
  const f = fixture(t, { purchases: [purchase()] }, { walletApi: { signBuyerPayment: async () => { throw Object.assign(new Error('rejected'), { code: 4001 }); } } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  assert.deepEqual(f.state.writes, []); assert.match(f.q('[data-purchase-notice]').textContent, /declined/);
});

test('wrong network asks the person to switch and never signs', async t => {
  const f = fixture(t, { purchases: [purchase()] }, { walletApi: { connectBuyerWallet: async () => { throw new Error('switch-wallet-to-etherlink'); } } });
  await settle(); await f.chooseAndConnect();
  assert.match(f.q('[data-purchase-notice]').textContent, /Switch your selected wallet to Etherlink/);
  assert.equal(f.q('[data-purchase-approve]').disabled, true); assert.equal(f.state.signatures, 0); assert.deepEqual(f.state.writes, []);
});

test('a changed wallet discards a late signature', async t => {
  const signed = deferred();
  const f = fixture(t, { purchases: [purchase()] }, { walletApi: { signBuyerPayment: () => signed.promise } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  for (const change of [...f.state.watches]) change();
  signed.resolve({ paymentSignature: 'late-signature' }); await settle();
  assert.deepEqual(f.state.writes, []); assert.equal(f.q('[data-purchase-approve]').disabled, true);
});

test('runtime removal during wallet approval blocks submission and preserves previous receipts', async t => {
  const signed = deferred(); const f = fixture(t, { purchases: [purchase()] }, { walletApi: { signBuyerPayment: () => signed.promise } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  f.state.snapshot.runtimes = []; signed.resolve({ paymentSignature: 'late-signature' }); await settle();
  assert.deepEqual(f.state.writes, []); assert.equal(f.q('[data-purchase-approve]').disabled, true);
  assert.match(f.q('[data-purchase-notice]').textContent, /online, signed-in AI/);
});

test('quote expiry during wallet approval cannot submit a late signature', async t => {
  let clock = Date.now(); t.mock.method(Date, 'now', () => clock);
  const signed = deferred(); const f = fixture(t, { purchases: [purchase()] }, { walletApi: { signBuyerPayment: () => signed.promise } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  clock += 61000; signed.resolve({ paymentSignature: 'expired-signature' }); await settle();
  assert.deepEqual(f.state.writes, []); assert.equal(f.q('[data-purchase-approval]').hidden, true);
});

test('stop approval invalidates the wallet result without submitting or cancelling an unrelated purchase', async t => {
  const signed = deferred(); const f = fixture(t, { purchases: [purchase()] }, { walletApi: { signBuyerPayment: () => signed.promise } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  f.q('[data-purchase-stop]').click(); signed.resolve({ paymentSignature: 'stopped-signature' }); await settle();
  assert.deepEqual(f.state.writes, []); assert.match(f.q('[data-purchase-notice]').textContent, /Approval stopped/);
});

test('network ambiguity locks new approvals and reconciliation never requests another signature', async t => {
  const f = fixture(t, { purchases: [purchase()] }, { write: (body, state) => {
    if (body.operation === 'submit') throw new TypeError('lost response');
    assert.equal(body.operation, 'reconcile'); state.snapshot.purchases = [delivered()]; return Response.json({ ok: true, purchase: state.snapshot.purchases[0] });
  } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  assert.equal(f.state.signatures, 1); assert.equal(f.q('[data-purchase-approval]').hidden, true); assert.equal(f.q('[data-purchase-quote]').disabled, true);
  assert.match(f.q('[data-purchase-notice]').textContent, /do not sign or pay again/);
  f.q('[data-purchase-reconcile]').click(); await settle();
  assert.equal(f.state.signatures, 1); assert.deepEqual(f.state.writes[1], { operation: 'reconcile', purchaseId: 'purchase-a' });
  assert.match(f.q('[data-purchase-badge]').textContent, /Question delivered/);
});

test('skip closes a quote on the server without contacting the wallet', async t => {
  const f = fixture(t, { purchases: [purchase()] }); await settle(); f.q('[data-purchase-skip]').click(); await settle();
  assert.deepEqual(f.state.writes, [{ operation: 'cancel', purchaseId: 'purchase-a' }]); assert.equal(f.state.connects, 0); assert.equal(f.state.signatures, 0);
  assert.equal(f.q('[data-purchase-approval]').hidden, true);
});

test('receipt history remains readable without any runtime, while delivery links require the reviewed host', async t => {
  const f = fixture(t, { available: false, runtimes: [], purchases: [delivered({ result: { sit: { answer: 'Stored question' }, url: 'https://attacker.example/bench' } })] }); await settle();
  assert.match(f.q('[data-purchase-result-text]').textContent, /Stored question/);
  assert.equal(f.q('[data-purchase-result-link]').hasAttribute('href'), false);
  assert.equal(f.q('[data-purchase-quote]').disabled, true);
  assert.match(f.q('[data-purchase-chain-proof]').textContent, /pending/);
  assert.equal(safeBenchUrl('javascript:alert(1)'), null);
  assert.equal(safeBenchUrl('https://pointcast.xyz/bench?day=2026-09-09'), 'https://pointcast.xyz/bench?day=2026-09-09');
});

test('sign-out clears private drafts, payer and receipt data and rejects late approval results', async t => {
  const signed = deferred(); const f = fixture(t, { purchases: [purchase()] }, { walletApi: { signBuyerPayment: () => signed.promise } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  f.q('[data-purchase-question]').value = 'Private unfinished draft';
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', { detail: { user: null } }));
  signed.resolve({ paymentSignature: 'old-owner-signature' }); await settle();
  assert.deepEqual(f.state.writes, []); assert.equal(f.q('[data-purchase-public-text]').textContent, ''); assert.equal(f.q('[data-purchase-payer]').textContent, '');
  assert.notEqual(f.q('[data-purchase-question]').value, 'Private unfinished draft'); assert.equal(f.q('[data-purchase-history]').children.length, 0);
});

test('a server quote change invalidates the previous publication consent and late signature', async t => {
  const signed = deferred(); const f = fixture(t, { purchases: [purchase()] }, { walletApi: { signBuyerPayment: () => signed.promise } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  f.state.snapshot.purchases = [purchase({ quoteHash: 'changed-terms' })]; signed.resolve({ paymentSignature: 'old-terms-signature' }); await settle();
  assert.deepEqual(f.state.writes, []); assert.equal(f.q('[data-purchase-public-consent]').checked, false);
});

test('failed quote submission retries the same identifier until the request changes', async t => {
  const f = fixture(t, {}, { write: () => { throw new TypeError('response lost'); } }); await settle();
  f.q('[data-purchase-quote]').click(); await settle(); f.q('[data-purchase-quote]').click(); await settle();
  assert.equal(f.state.writes[0].requestId, f.state.writes[1].requestId);
  f.q('[data-purchase-question]').value = 'A new public question?'; f.q('[data-purchase-question]').dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
  f.q('[data-purchase-quote]').click(); await settle();
  assert.notEqual(f.state.writes[0].requestId, f.state.writes[2].requestId);
});

test('HTML errors are readable and incomplete proofs never claim a verified delivery', async t => {
  await assert.rejects(readPurchaseResponse(new Response('<html>bad gateway</html>', { status: 502 })), error => error.status === 502 && !error.message.includes('<html>'));
  assert.match(purchaseStatus(delivered({ deliveryVerified: false })), /verification incomplete/);
  const f = fixture(t, {}, { read: () => new Response('<html>bad gateway</html>', { status: 503 }) }); await settle();
  assert.equal(f.q('[data-purchase-quote]').disabled, true); assert.doesNotMatch(f.q('[data-purchase-notice]').textContent, /SyntaxError|<html>/);
});


test('edited public text remains unapproved across polling and explicitly replaces the old quote in order', async t => {
  const f = fixture(t, { purchases: [purchase()] }, { write: (body, state) => {
    const result = body.operation === 'cancel' ? purchase({ status: 'expired' }) : purchase({ id: 'purchase-b', question: body.question, quoteHash: 'new-review' });
    state.snapshot.purchases = [result]; return Response.json({ ok: true, purchase: result });
  } });
  await settle(); await f.chooseAndConnect();
  f.q('[data-purchase-public-consent]').checked = true;
  f.q('[data-purchase-question]').value = 'A different public question?';
  f.q('[data-purchase-question]').dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
  assert.equal(f.q('[data-purchase-public-consent]').checked, false);
  assert.equal(f.q('[data-purchase-approve]').disabled, true);
  f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange')); await settle();
  assert.equal(f.q('[data-purchase-question]').value, 'A different public question?');
  assert.match(f.q('[data-purchase-quote]').textContent, /Replace existing quote/);
  f.q('[data-purchase-quote]').click(); await settle();
  assert.deepEqual(f.state.writes.map(body => body.operation), ['cancel', 'quote']);
  assert.equal(f.state.writes[0].purchaseId, 'purchase-a');
  assert.equal(f.state.writes[1].question, 'A different public question?');
  assert.equal(f.q('[data-purchase-public-text]').textContent, 'A different public question?');
  assert.equal(f.q('[data-purchase-public-consent]').checked, false); assert.equal(f.state.signatures, 0);
});

test('an unchanged existing quote is reopened without creating another purchase', async t => {
  const f = fixture(t, { purchases: [purchase()] }); await settle();
  f.q('[data-purchase-quote]').click(); await settle();
  assert.deepEqual(f.state.writes, []); assert.match(f.q('[data-purchase-notice]').textContent, /existing quote/);
});

test('auth refresh during wallet signing discards the signature even when the same profile remains signed in', async t => {
  const signed = deferred(); const f = fixture(t, { purchases: [purchase()] }, { walletApi: { signBuyerPayment: () => signed.promise } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  f.dom.window.dispatchEvent(new f.dom.window.Event('pc:auth-refresh')); await settle();
  signed.resolve({ paymentSignature: 'pre-refresh-signature' }); await settle();
  assert.deepEqual(f.state.writes, []); assert.equal(f.q('[data-purchase-payer]').textContent, '');
  assert.equal(f.q('[data-purchase-public-consent]').checked, false);
});

test('wallet disappearance at approval renders a recoverable error without an unhandled promise', async t => {
  let vanished = false;
  const wallet = { uuid: 'wallet-a', name: 'Test wallet', provider: { request: async ({ method }) => method === 'eth_accounts' ? [account] : '0xa729' } };
  const f = fixture(t, { purchases: [purchase()] }, { walletApi: { createWalletDiscovery: () => ({ wallets: () => [wallet], select: () => { if (vanished) throw new Error('select-a-wallet'); return wallet; }, stop() {} }) } });
  await settle(); await f.chooseAndConnect(); vanished = true; f.consentAndApprove(); await settle();
  assert.deepEqual(f.state.writes, []); assert.match(f.q('[data-purchase-notice]').textContent, /Choose a browser wallet/);
});

test('late status reads cannot restore the previous owner after sign-out', async t => {
  const previous = deferred(); let reads = 0;
  const f = fixture(t, { purchases: [delivered()] }, { read: state => ++reads === 1 ? Response.json(state.snapshot) : previous.promise });
  await settle(); f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange')); await tick();
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', { detail: { user: null } }));
  previous.resolve(Response.json({ ok: true, available: true, runtimes: [runtime], purchases: [delivered()] })); await settle();
  assert.equal(f.q('[data-purchase-result-text]').textContent, ''); assert.equal(f.q('[data-purchase-history]').children.length, 0);
  assert.equal(f.q('[data-purchase-badge]').textContent, 'Sign-in required');
});


test('first-time wallet account grant is accepted before post-connect changes are watched', async t => {
  const f = fixture(t, { purchases: [purchase()] }, { walletApi: { connectBuyerWallet: async () => {
    for (const change of [...f.state.watches]) change([account]);
    return { payer: account, chainId: 42793 };
  } } });
  await settle(); await f.chooseAndConnect();
  assert.match(f.q('[data-purchase-payer]').textContent, new RegExp(account));
  assert.match(f.q('[data-purchase-notice]').textContent, /Wallet connected/);
  assert.equal(f.state.watches.size, 1);
  assert.equal(f.state.signatures, 0); assert.deepEqual(f.state.writes, []);
  for (const change of [...f.state.watches]) change(['0x2222222222222222222222222222222222222222']);
  assert.equal(f.q('[data-purchase-payer]').textContent, '');
  assert.equal(f.q('[data-purchase-approve]').disabled, true);
});

test('a visibility refresh superseding the pre-signing read reports interruption without requesting a signature', async t => {
  const superseded = deferred();
  const f = fixture(t, { purchases: [purchase()] }, { read: state => state.reads === 2 ? superseded.promise : Response.json(state.snapshot) });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange')); await settle();
  superseded.resolve(Response.json(f.state.snapshot)); await settle();
  assert.equal(f.state.signatures, 0); assert.deepEqual(f.state.writes, []);
  assert.match(f.q('[data-purchase-notice]').textContent, /Approval interrupted.*No payment was submitted/);
  assert.doesNotMatch(f.q('[data-purchase-notice]').textContent, /Review the exact USDC authorization/);
});

test('a visibility refresh superseding the post-signing read discards the signature and reports no submission', async t => {
  const superseded = deferred();
  const f = fixture(t, { purchases: [purchase()] }, { read: state => state.reads === 3 ? superseded.promise : Response.json(state.snapshot) });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  assert.equal(f.state.signatures, 1);
  f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange')); await settle();
  superseded.resolve(Response.json(f.state.snapshot)); await settle();
  assert.deepEqual(f.state.writes, []);
  assert.match(f.q('[data-purchase-notice]').textContent, /Approval interrupted.*No payment was submitted/);
});

test('a changed server quote interrupts approval with a clear no-submission result', async t => {
  const signed = deferred(); const f = fixture(t, { purchases: [purchase()] }, { walletApi: { signBuyerPayment: () => signed.promise } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  f.state.snapshot.purchases = [purchase({ quoteHash: 'replaced-during-approval' })];
  signed.resolve({ paymentSignature: 'stale-signature' }); await settle();
  assert.deepEqual(f.state.writes, []); assert.equal(f.q('[data-purchase-public-consent]').checked, false);
  assert.match(f.q('[data-purchase-notice]').textContent, /Approval interrupted.*No payment was submitted/);
});

test('submitted purchase explicitly asks for a manual outcome check and polling never reconciles', async t => {
  const f = fixture(t, { purchases: [purchase({ status: 'submitting' })] }); await settle();
  assert.equal(f.q('[data-purchase-badge]').textContent, 'Submission recorded · check outcome');
  assert.equal(f.q('[data-purchase-reconcile]').hidden, false);
  f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange')); await settle();
  assert.deepEqual(f.state.writes, []); assert.equal(f.state.signatures, 0);
});


test('post-subscription account recheck rejects a changed grant even without a wallet notification', async t => {
  const wallet = { uuid: 'wallet-a', name: 'Test wallet', provider: { request: async ({ method }) => method === 'eth_accounts' ? ['0x2222222222222222222222222222222222222222'] : '0xa729' } };
  const f = fixture(t, { purchases: [purchase()] }, { walletApi: { createWalletDiscovery: () => ({ wallets: () => [wallet], select: () => wallet, stop() {} }) } });
  await settle(); await f.chooseAndConnect();
  assert.equal(f.q('[data-purchase-payer]').textContent, ''); assert.equal(f.q('[data-purchase-approve]').disabled, true);
  assert.match(f.q('[data-purchase-notice]').textContent, /wallet account or network changed/);
  assert.equal(f.state.watches.size, 0); assert.deepEqual(f.state.writes, []);
});

test('post-subscription network recheck rejects a changed chain without silently switching it', async t => {
  const calls = [];
  const wallet = { uuid: 'wallet-a', name: 'Test wallet', provider: { request: async ({ method }) => { calls.push(method); return method === 'eth_accounts' ? [account] : '0x1'; } } };
  const f = fixture(t, { purchases: [purchase()] }, { walletApi: { createWalletDiscovery: () => ({ wallets: () => [wallet], select: () => wallet, stop() {} }) } });
  await settle(); await f.chooseAndConnect();
  assert.equal(f.q('[data-purchase-payer]').textContent, ''); assert.equal(f.q('[data-purchase-approve]').disabled, true);
  assert.match(f.q('[data-purchase-notice]').textContent, /Switch your selected wallet to Etherlink/);
  assert.deepEqual(calls.sort(), ['eth_accounts', 'eth_chainId']); assert.equal(f.state.watches.size, 0);
});

test('a near-expiry quote refresh closes its pending row before requesting fresh terms', async t => {
  let clock = Date.now(); t.mock.method(Date, 'now', () => clock);
  const oldQuote = purchase();
  const f = fixture(t, { purchases: [oldQuote] }, { write: (body, state) => {
    const result = body.operation === 'cancel' ? { ...oldQuote, status: 'expired' } : purchase({ id: 'purchase-fresh', question: body.question, quoteHash: 'fresh-quote-hash' });
    state.snapshot.purchases = [result]; return Response.json({ ok: true, purchase: result });
  } });
  await settle(); clock += 50000;
  f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange')); await settle();
  assert.match(f.q('[data-purchase-badge]').textContent, /needs refreshing/);
  assert.equal(f.q('[data-purchase-approval]').hidden, true);
  assert.match(f.q('[data-purchase-quote]').textContent, /Refresh this quote/);
  f.q('[data-purchase-quote]').click(); await settle();
  assert.deepEqual(f.state.writes.map(body => body.operation), ['cancel', 'quote']);
  assert.equal(f.state.writes[0].purchaseId, oldQuote.id);
  assert.equal(f.state.writes[1].question, oldQuote.question);
  assert.equal(f.q('[data-purchase-id]').textContent, 'purchase-fresh');
  assert.equal(f.q('[data-purchase-public-consent]').checked, false); assert.equal(f.state.signatures, 0);
});

test('a signature returned inside the final fifteen seconds is not submitted', async t => {
  let clock = Date.now(); t.mock.method(Date, 'now', () => clock);
  const signed = deferred(); const f = fixture(t, { purchases: [purchase()] }, { walletApi: { signBuyerPayment: () => signed.promise } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  clock += 50000; signed.resolve({ paymentSignature: 'too-late-signature' }); await settle();
  assert.deepEqual(f.state.writes, []);
  assert.match(f.q('[data-purchase-notice]').textContent, /too close to expiry/);
  assert.match(f.q('[data-purchase-quote]').textContent, /Refresh this quote/);
});


test('an explicit pre-reservation rejection releases the uncertain hold and refreshes the old quote immediately', async t => {
  const f = fixture(t, { purchases: [purchase()] }, { write: (body, state) => {
    if (body.operation === 'submit') return Response.json({ ok: false, reason: 'payment-window-too-short' }, { status: 409 });
    const result = body.operation === 'cancel' ? purchase({ status: 'expired' }) : purchase({ id: 'purchase-refreshed', question: body.question, quoteHash: 'refreshed-hash' });
    state.snapshot.purchases = [result]; return Response.json({ ok: true, purchase: result });
  } });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  assert.match(f.q('[data-purchase-notice]').textContent, /too close to expiry/);
  assert.doesNotMatch(f.q('[data-purchase-notice]').textContent, /outcome could not be confirmed/);
  assert.equal(f.q('[data-purchase-quote]').disabled, false);
  assert.match(f.q('[data-purchase-quote]').textContent, /Refresh this quote/);
  assert.equal(f.q('[data-purchase-approve]').disabled, true);
  f.q('[data-purchase-quote]').click(); await settle();
  assert.deepEqual(f.state.writes.map(body => body.operation), ['submit', 'cancel', 'quote']);
  assert.equal(f.q('[data-purchase-id]').textContent, 'purchase-refreshed');
  assert.equal(f.state.signatures, 1);
});

test('generic server failure after submission keeps the original purchase held for reconciliation', async t => {
  const f = fixture(t, { purchases: [purchase()] }, { write: () => Response.json({ ok: false, reason: 'purchase-status-unavailable-check-existing-attempt' }, { status: 503 }) });
  await settle(); await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  assert.equal(f.q('[data-purchase-quote]').disabled, true);
  assert.equal(f.q('[data-purchase-reconcile]').hidden, false);
  assert.equal(f.q('[data-purchase-approval]').hidden, true);
  assert.match(f.q('[data-purchase-notice]').textContent, /outcome could not be confirmed/);
  assert.equal(f.state.signatures, 1); assert.equal(f.state.writes.length, 1);
});


test('repeated same-owner wallet bridge notifications do not starve purchase reads or clear a draft', async t => {
  const reads = [];
  const f = fixture(t, {}, { read: (_state, init) => new Promise(resolve => reads.push({ resolve, signal: init.signal })) });
  const notify = () => f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', {
    detail: { user: sessionUser('owner-a'), source: 'tezos-session-bridge' },
  }));
  notify();
  const currentRead = reads.at(-1);
  for (let i = 0; i < 12; i += 1) { notify(); await tick(); }
  assert.equal(currentRead.signal.aborted, false);
  assert.equal(reads.length, 2);
  currentRead.resolve(Response.json(f.state.snapshot)); await settle();
  assert.equal(f.q('[data-purchase-badge]').textContent, 'Optional paid participation');
  f.q('[data-purchase-question]').value = 'Keep my draft question';
  notify();
  assert.equal(f.q('[data-purchase-question]').value, 'Keep my draft question');
  assert.equal(reads.length, 2);
  assert.equal(f.state.signatures, 0); assert.deepEqual(f.state.writes, []);
});

test('purchase bridge dedup still resets changed owners, explicit refresh, and sign-out', async t => {
  const reads = [];
  const f = fixture(t, {}, { read: (_state, init) => new Promise(resolve => reads.push({ resolve, signal: init.signal })) });
  const notify = (id, source = 'tezos-session-bridge') => f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', {
    detail: { user: id ? sessionUser(id) : null, source },
  }));
  notify('owner-a');
  const previousOwner = reads.at(-1);
  f.q('[data-purchase-question]').value = 'Owner A private draft';
  notify('owner-b');
  assert.equal(previousOwner.signal.aborted, true);
  assert.notEqual(f.q('[data-purchase-question]').value, 'Owner A private draft');
  const ownerB = reads.at(-1);
  f.dom.window.dispatchEvent(new f.dom.window.Event('pc:auth-refresh'));
  assert.equal(ownerB.signal.aborted, true);
  const refreshed = reads.at(-1);
  notify('owner-b', 'explicit-sign-in');
  assert.equal(refreshed.signal.aborted, true);
  const latest = reads.at(-1);
  notify(null);
  assert.equal(latest.signal.aborted, true);
  for (const read of reads) read.resolve(Response.json(f.state.snapshot));
  await settle();
  assert.equal(f.q('[data-purchase-badge]').textContent, 'Sign-in required');
  assert.equal(f.q('[data-purchase-quote]').disabled, true);
  assert.equal(f.state.signatures, 0); assert.deepEqual(f.state.writes, []);
});


for (const failure of ['read-401', 'mutate-401', 'submit-401', 'initial-network']) {
  test(`same-owner purchase session recovers after ${failure}`, async t => {
    let failRead = failure === 'initial-network';
    const f = fixture(t, { purchases: failure === 'submit-401' ? [purchase()] : [] }, {
      read: state => {
        if (failRead && failure === 'initial-network') throw new TypeError('Offline');
        if (failRead) return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
        return Response.json(state.snapshot);
      },
      write: () => Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 }),
    });
    bridgeSession(f.dom, 'pcu_owner_a'); await settle();
    if (failure === 'read-401') { failRead = true; f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange')); }
    if (failure === 'mutate-401') { f.q('[data-purchase-question]').value = 'Public question'; f.q('[data-purchase-quote]').click(); }
    if (failure === 'submit-401') { await f.chooseAndConnect(); f.consentAndApprove(); }
    await settle();
    assert.equal(f.q('[data-purchase-badge]').textContent, failure === 'initial-network' ? 'Status unavailable' : 'Sign-in required');
    assert.equal(f.q('[data-purchase-quote]').disabled, true);
    assert.equal(f.q('[data-purchase-payer]').textContent, '');
    const beforeRecovery = f.state.reads;
    failRead = false; bridgeSession(f.dom, 'pcu_owner_a'); await settle();
    assert.equal(f.state.reads, beforeRecovery + 1);
    assert.notEqual(f.q('[data-purchase-badge]').textContent, 'Sign-in required');
    assert.notEqual(f.q('[data-purchase-badge]').textContent, 'Status unavailable');
    assert.equal(f.q('[data-purchase-public-consent]').checked, false);
    assert.equal(f.q('[data-purchase-approve]').disabled, true);
    assert.equal(f.state.writes.length, ['mutate-401', 'submit-401'].includes(failure) ? 1 : 0);
    assert.equal(f.state.signatures, failure === 'submit-401' ? 1 : 0);
  });
}

test('a real-shaped owner change discards an earlier owner wallet signature', async t => {
  const signed = deferred();
  const f = fixture(t, { purchases: [purchase()] }, { walletApi: { signBuyerPayment: () => signed.promise } });
  bridgeSession(f.dom, 'pcu_owner_a'); await settle();
  await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  f.state.snapshot = { ok: true, available: true, runtimes: [], purchases: [] };
  bridgeSession(f.dom, 'pcu_owner_b'); await settle();
  signed.resolve({ paymentSignature: 'earlier-owner-signature' }); await settle();
  assert.deepEqual(f.state.writes, []);
  assert.equal(f.q('[data-purchase-payer]').textContent, '');
  assert.equal(f.q('[data-purchase-public-consent]').checked, false);
  assert.equal(f.q('[data-purchase-review]').hidden, true);
});


test('an authoritative purchase 401 discards a late quote from the invalidated session', async t => {
  const quoted = deferred(); let failRead = false;
  const f = fixture(t, {}, {
    read: state => failRead ? Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 }) : Response.json(state.snapshot),
    write: () => quoted.promise,
  });
  bridgeSession(f.dom, 'pcu_owner_a'); await settle();
  f.q('[data-purchase-question]').value = 'Private draft before session loss';
  f.q('[data-purchase-quote]').click(); await settle();
  failRead = true; f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange')); await settle();
  assert.equal(f.q('[data-purchase-badge]').textContent, 'Sign-in required');
  quoted.resolve(Response.json({ ok: true, purchase: purchase({ question: 'Private draft before session loss' }) }, { status: 201 }));
  await settle();
  assert.equal(f.q('[data-purchase-badge]').textContent, 'Sign-in required');
  assert.equal(f.q('[data-purchase-review]').hidden, true);
  assert.equal(f.q('[data-purchase-public-text]').textContent, '');
  assert.equal(f.q('[data-purchase-history]').children.length, 0);
  assert.equal(f.q('[data-purchase-question]').value.includes('Private draft before session loss'), false);
  assert.equal(f.q('[data-purchase-approve]').disabled, true);
});

test('an authoritative purchase 401 aborts wallet approval and discards its late signature', async t => {
  const signed = deferred(); let failRead = false, signingSignal;
  const f = fixture(t, { purchases: [purchase()] }, {
    read: state => failRead ? Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 }) : Response.json(state.snapshot),
    walletApi: { signBuyerPayment: ({ signal }) => { signingSignal = signal; return signed.promise; } },
  });
  bridgeSession(f.dom, 'pcu_owner_a'); await settle();
  await f.chooseAndConnect(); f.consentAndApprove(); await settle();
  failRead = true; f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange')); await settle();
  assert.equal(signingSignal.aborted, true);
  assert.equal(f.q('[data-purchase-badge]').textContent, 'Sign-in required');
  signed.resolve({ paymentSignature: 'previous-session-signature' }); await settle();
  assert.deepEqual(f.state.writes, []);
  assert.equal(f.q('[data-purchase-review]').hidden, true);
  assert.equal(f.q('[data-purchase-payer]').textContent, '');
  assert.equal(f.q('[data-purchase-public-consent]').checked, false);
  assert.equal(f.root.getAttribute('aria-busy'), 'false');
});
