import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ART_PRICE_MUTEZ, TEZOS_MAINNET, saleReadiness, prepareUnsignedPurchase, createPurchaseController, verifyPurchaseReceipt } from '../src/lib/art-commerce.mjs';

// All fixtures below are SIMULATED. Tests make no wallet or network requests.
const seller = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
const buyer = 'tz2UAHf3qB4PyBjBhZ3jEmtLYozVwXrFZdj9';
const collection = 'KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt';
const hash = 'ooovVC2fjshk2SvMFHMZiN9PJYhHqcZUr7GW9iVRHsqcrhVXaHs';
const artwork = { id: 'simulated-art', source: { rightsStatus: 'verified' }, v2: { asset: '/images/art-v2/simulated.webp' }, commerce: { priceMutez: ART_PRICE_MUTEZ, network: 'tezos-mainnet', tokenId: 0, contract: collection } };
const config = { status: 'reviewed', unsignedPreparationEnabled: true, releaseApproval: 'SIMULATED-test-approval', approvedNetwork: 'tezos-mainnet', seller, creator: seller, editionCap: 10, editionPolicy: 'fixed-issued-supply-reviewed', royaltyBps: 750, royaltyReceiver: seller, storagePolicy: 'ipfs-pinned', collectionContract: collection, collectionCodeSha256: 'c'.repeat(64), marketplace: TEZOS_MAINNET.marketplace, platformFeeBps: 250, platformFeeReceiver: seller, priceMutez: ART_PRICE_MUTEZ, assets: { 'simulated-art': { rightsApproval: 'SIMULATED-rights-review', tokenId: 0, askId: 1, asset: artwork.v2.asset, artifactSha256: 'a'.repeat(64), artifactUri: 'ipfs://bafySIMULATED/art.webp', metadataApproval: 'SIMULATED-pinned-file-review', metadataUri: 'ipfs://bafySIMULATED/metadata.json', metadataSha256: 'e'.repeat(64) } } };
const proof = () => ({ checkedAt: Date.now(), chainId: TEZOS_MAINNET.chainId, level: 100, indexerLevel: 100, paused: false, platformFeeBps: 250, platformFeeReceiver: seller, royaltyReceiver: seller, askActive: true, ask: { seller, fa2_contract: collection, token_id: '0', amount_mutez: '1000000', royalty_bps: '750' }, sellerBalance: 1, totalSupply: 10, operatorApproved: true, artifactUri: config.assets[artwork.id].artifactUri, artifactSha256: 'a'.repeat(64), collectionCodeSha256: 'c'.repeat(64), metadataUri: config.assets[artwork.id].metadataUri, metadataSha256: 'e'.repeat(64), onchainArtifactSha256: 'a'.repeat(64) });
const adapter = (p = proof()) => ({ getWallet: async () => ({ address: buyer, network: 'mainnet' }), readProof: async () => p });
const clone = v => structuredClone(v);

test('preview config prevents all wallet and network reads', async () => {
  const preview = JSON.parse(await readFile(new URL('../src/data/art-v2-commerce.json', import.meta.url)));
  assert.equal(preview.purchaseEnabled, false); assert.equal(preview.unsignedPreparationEnabled, false);
  assert.equal(saleReadiness(preview, artwork).ready, false);
  let reads = 0;
  await assert.rejects(prepareUnsignedPurchase(preview, artwork, { getWallet: async () => { reads++; }, readProof: async () => { reads++; } }), e => e.code === 'unavailable');
  assert.equal(reads, 0); assert.equal(preview.networks.pointcast.status, 'public_network_not_configured');
});
test('1 tez preparation has exact PointCast nat ABI, no signature, fee or total claim', async () => {
  const plan = await prepareUnsignedPurchase(config, artwork, adapter());
  assert.deepEqual(plan.transaction, { kind: 'transaction', destination: TEZOS_MAINNET.marketplace, amount: '1000000', parameters: { entrypoint: 'fulfill_ask', value: { int: '1' } } });
  assert.equal(plan.status, 'unsigned'); assert.equal(plan.networkFeesMutez, null); assert.equal(plan.totalMutez, null); assert.equal(plan.signature, undefined); assert.equal(plan.operationHash, undefined);
});
for (const [name, change] of [
  ['rights', c => { c.assets[artwork.id].rightsApproval = null; }], ['seller', c => { c.seller = null; }], ['edition decision', c => { c.editionCap = null; }], ['issuance policy', c => { c.editionPolicy = null; }], ['royalty decision', c => { c.royaltyBps = null; }], ['network decision', c => { c.approvedNetwork = 'pointcast'; }], ['wrong marketplace', c => { c.marketplace = collection; }], ['changed planned price', c => { c.priceMutez = 2_000_000; }], ['collection review', c => { c.collectionCodeSha256 = null; }],
]) test(`unapproved ${name} stays unavailable`, async () => {
  const c = clone(config); change(c);
  await assert.rejects(prepareUnsignedPurchase(c, artwork, adapter()), e => e.code === 'unavailable');
});
for (const [name, change, code] of [
  ['wrong RPC chain', p => { p.chainId = 'wrong'; }, 'wrong-chain'], ['paused marketplace', p => { p.paused = true; }, 'paused'], ['price race', p => { p.ask.amount_mutez = '2000000'; }, 'listing-changed'], ['different seller', p => { p.ask.seller = buyer; }, 'listing-changed'], ['different token', p => { p.ask.token_id = '1'; }, 'listing-changed'], ['different FA2', p => { p.ask.fa2_contract = TEZOS_MAINNET.marketplace; }, 'listing-changed'], ['missing listing', p => { p.askActive = false; }, 'listing-changed'], ['changed royalty', p => { p.ask.royalty_bps = '800'; }, 'listing-changed'], ['changed receiver', p => { p.royaltyReceiver = buyer; }, 'terms-changed'], ['changed platform fee', p => { p.platformFeeBps = 300; }, 'terms-changed'], ['missing inventory', p => { p.sellerBalance = 0; }, 'inventory-unverified'], ['malformed balance', p => { p.sellerBalance = Infinity; }, 'inventory-unverified'], ['missing operator', p => { p.operatorApproved = false; }, 'inventory-unverified'], ['unminted token', p => { p.totalSupply = 0; }, 'inventory-unverified'], ['over limit', p => { p.totalSupply = 11; }, 'inventory-unverified'], ['wrong metadata', p => { p.artifactUri = 'javascript:alert(1)'; }, 'artwork-mismatch'], ['wrong art bytes', p => { p.artifactSha256 = 'b'.repeat(64); }, 'artwork-mismatch'], ['changed code', p => { p.collectionCodeSha256 = 'd'.repeat(64); }, 'contract-mismatch'], ['indexer lag', p => { p.indexerLevel = 90; }, 'stale-proof'], ['missing indexer level', p => { delete p.indexerLevel; }, 'stale-proof'], ['old proof', p => { p.checkedAt -= 31_000; }, 'stale-proof'],
]) test(`${name} fails closed`, async () => { const p = proof(); change(p); await assert.rejects(prepareUnsignedPurchase(config, artwork, adapter(p)), e => e.code === code); });
test('disconnected or wrong wallet network cannot prepare', async () => {
  for (const wallet of [null, { address: buyer, network: 'ghostnet' }]) await assert.rejects(prepareUnsignedPurchase(config, artwork, { ...adapter(), getWallet: async () => wallet }), e => ['disconnected', 'wrong-chain'].includes(e.code));
});
test('account change during proof and self purchase fail', async () => {
  let reads = 0;
  await assert.rejects(prepareUnsignedPurchase(config, artwork, { ...adapter(), getWallet: async () => ({ address: reads++ ? seller : buyer, network: 'mainnet' }) }), e => e.code === 'wallet-changed');
  await assert.rejects(prepareUnsignedPurchase(config, artwork, { ...adapter(), getWallet: async () => ({ address: seller, network: 'mainnet' }) }), e => e.code === 'self-purchase');
});
test('duplicate clicks use one request; disconnect invalidates it', async () => {
  let resolveProof; let calls = 0;
  const controller = createPurchaseController(config, { ...adapter(), readProof: async () => { calls++; return new Promise(resolve => { resolveProof = resolve; }); } });
  const first = controller.prepare(artwork), second = controller.prepare(artwork);
  assert.equal(first, second); await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 1);
  controller.invalidate(); resolveProof(proof()); await assert.rejects(first, e => e.code === 'wallet-changed');
});
test('rejection and RPC failure allow an explicit new preparation, never a receipt', async () => {
  let attempt = 0;
  const controller = createPurchaseController(config, { ...adapter(), readProof: async () => { if (!attempt++) throw new Error('SIMULATED rejection'); return proof(); } });
  await assert.rejects(controller.prepare(artwork), /SIMULATED rejection/);
  assert.equal((await controller.prepare(artwork)).status, 'unsigned');
});
test('malicious asset path and unverified source are blocked', async () => {
  for (const change of [a => { a.v2.asset = 'https://attacker.example/art.webp'; }, a => { a.source.rightsStatus = 'unverified'; }, a => { a.v2.asset = '/images/../../secret.png'; }]) { const a = clone(artwork); change(a); await assert.rejects(prepareUnsignedPurchase(config, a, adapter()), e => e.code === 'unavailable'); }
});
function receipt() {
  const tx = { type: 'transaction', id: 12, hash, status: 'applied', sender: { address: buyer }, target: { address: TEZOS_MAINNET.marketplace }, amount: 1000000, parameter: { entrypoint: 'fulfill_ask', value: '1' }, level: 100, counter: 23, block: 'B' + '1'.repeat(50) };
  const internal = { type: 'transaction', hash, status: 'applied', level: 100, counter: 23, block: tx.block, initiator: { address: buyer }, sender: { address: TEZOS_MAINNET.marketplace } };
  return { chainId: TEZOS_MAINNET.chainId, hash, headLevel: 102, canonicalInclusionHash: tx.block, headHashBefore: 'B' + '2'.repeat(50), headHashAfter: 'B' + '2'.repeat(50), balanceAtLevel: 102, buyerBalance: 1, askActive: false, operations: [tx, { ...internal, id: 13, nonce: 0, target: { address: seller }, amount: 1000000 }, { ...internal, id: 14, nonce: 1, target: { address: collection }, amount: 0, parameter: { entrypoint: 'transfer', value: [{ from_: seller, txs: [{ to_: buyer, token_id: '0', amount: '1' }] }] } }] };
}
test('exact applied transfer and payouts at canonical finalized inclusion verify', async () => {
  const plan = await prepareUnsignedPurchase(config, artwork, adapter()); assert.equal(verifyPurchaseReceipt(plan, receipt()).status, 'verified');
});
for (const [name, change] of [
  ['hash alone', p => { p.operations = []; }], ['wrong buyer', p => { p.operations[0].sender.address = seller; }], ['wrong amount', p => { p.operations[0].amount = 900000; }], ['wrong ask', p => { p.operations[0].parameter.value = '2'; }], ['failed internal', p => { p.operations[2].status = 'backtracked'; }], ['wrong FA2', p => { p.operations[2].target.address = TEZOS_MAINNET.marketplace; }], ['wrong transfer recipient', p => { p.operations[2].parameter.value[0].txs[0].to_ = seller; }], ['wrong token', p => { p.operations[2].parameter.value[0].txs[0].token_id = '1'; }], ['wrong quantity', p => { p.operations[2].parameter.value[0].txs[0].amount = '2'; }], ['different counter', p => { p.operations[2].counter++; }], ['noncanonical block', p => { p.canonicalInclusionHash = 'fork'; }], ['missing successors', p => { p.headLevel = 101; }], ['inconsistent balance read', p => { p.headHashAfter = 'next'; }], ['no buyer balance', p => { p.buyerBalance = 0; }], ['listing still active', p => { p.askActive = true; }], ['wrong payouts', p => { p.operations[1].amount--; }], ['extra external transaction', p => { p.operations.push(clone(p.operations[0])); }],
]) test(`receipt ${name} stays unverified`, async () => { const plan = await prepareUnsignedPurchase(config, artwork, adapter()); const p = receipt(); change(p); assert.equal(verifyPurchaseReceipt(plan, p).status, 'unverified'); });
test('browser path contains no send/sign/connect or raw metadata HTML', async () => {
  const client = await readFile(new URL('../src/lib/art-commerce-client.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(client, /\.send\(|requestSignPayload\(|requestPermissions\(|connectKukai\(|innerHTML\s*=/);
  assert.match(client, /textContent/); assert.match(client, /redirect: 'error'/);
});
test('absent canonical evidence and malformed operation groups never verify or throw', async () => {
  const plan = await prepareUnsignedPurchase(config, artwork, adapter());
  const missing = receipt(); delete missing.canonicalInclusionHash; delete missing.headHashBefore; delete missing.headHashAfter;
  for (const op of missing.operations) delete op.block;
  assert.equal(verifyPurchaseReceipt(plan, missing).status, 'unverified');
  for (const operations of [[null], [null, undefined], [{ type: 'transaction' }], null]) assert.equal(verifyPurchaseReceipt(plan, { ...receipt(), operations }).status, 'unverified');
  const malformed = receipt(); malformed.operations[2].parameter.value = [null];
  assert.equal(verifyPurchaseReceipt(plan, malformed).status, 'unverified');
});
test('unknown operations, duplicate nonces and unrelated zero-tez calls fail closed', async () => {
  const plan = await prepareUnsignedPurchase(config, artwork, adapter());
  const origination = receipt(); origination.operations.push({ type: 'origination', hash, status: 'applied' });
  assert.equal(verifyPurchaseReceipt(plan, origination).status, 'unverified');
  const duplicate = receipt(); duplicate.operations[2].nonce = 0;
  assert.equal(verifyPurchaseReceipt(plan, duplicate).status, 'unverified');
  const extra = receipt(); extra.operations.push({ ...extra.operations[2], id: 15, nonce: 2, target: { address: TEZOS_MAINNET.marketplace }, parameter: { entrypoint: 'set_administrator', value: seller } });
  assert.equal(verifyPurchaseReceipt(plan, extra).status, 'unverified');
});
test('malformed review plans remain unverified', async () => {
  const plan = await prepareUnsignedPurchase(config, artwork, adapter());
  for (const change of [p => { delete p.schema; }, p => { delete p.buyer; }, p => { delete p.seller; }, p => { delete p.tokenId; }, p => { p.askId = -1; }, p => { p.transaction.amount = '2'; }, p => { p.transaction.kind = 'origination'; }, p => { p.payoutTerms.royaltyReceiver = null; }]) {
    const altered = clone(plan); change(altered); assert.equal(verifyPurchaseReceipt(altered, receipt()).status, 'unverified');
  }
});
test('raw onchain metadata pointer and declared file hashes must match', async () => {
  for (const field of ['metadataUri', 'metadataSha256', 'onchainArtifactSha256']) { const p = proof(); p[field] = 'wrong'; await assert.rejects(prepareUnsignedPurchase(config, artwork, adapter(p)), e => e.code === 'metadata-mismatch'); }
  const c = clone(config); c.assets[artwork.id].metadataApproval = null;
  await assert.rejects(prepareUnsignedPurchase(c, artwork, adapter()), e => e.code === 'unavailable');
});
