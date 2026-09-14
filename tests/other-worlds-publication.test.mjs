import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

let vite;
let publication;
const assets = new Map();
const manifest = JSON.parse(await readFile(new URL('../src/data/other-worlds-provenance.json', import.meta.url), 'utf8'));
before(async () => {
  vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  publication = await vite.ssrLoadModule('/src/lib/other-worlds-publication.ts');
  for (const art of manifest.items) {
    for (const uri of [art.artifactUri, art.metadataUri]) {
      assets.set(uri, new Uint8Array(await readFile(new URL(`../public${new URL(uri).pathname}`, import.meta.url))));
    }
  }
});
after(async () => { await vite?.close(); });

function harness(overrides = {}) {
  const requests = [];
  const reads = [];
  const adapter = {
    address: async () => publication.PUBLICATION.administrator,
    chainId: async () => publication.PUBLICATION.chainId,
    administrator: async () => publication.PUBLICATION.administrator,
    tokenExists: async () => false,
    bytes: async (uri) => { reads.push(uri); return assets.get(uri); },
    estimate: async (operations) => operations.map(() => ({ suggestedFeeMutez: 1000, gasLimit: 5000, storageLimit: 560 })),
    costPerByte: async () => 250,
    request: async (operations) => { requests.push(operations); return { opHash: 'operation-under-test', confirmation: async () => {} }; },
    ...overrides,
  };
  return { adapter, requests, reads };
}

test('publication preparation verifies all 18 published files without requesting a transaction', async () => {
  const { adapter, requests, reads } = harness();
  const plan = await publication.prepareInventoryPublication(adapter);
  assert.equal(requests.length, 0);
  assert.equal(reads.length, 18);
  assert.equal(new Set(reads).size, 18);
  assert.equal(plan.maximumCostMutez, 1_410_000);
  assert.equal(plan.operations.length, 10);
  for (const [index, operation] of plan.operations.entries()) {
    assert.equal(operation.kind, 'transaction');
    assert.equal(operation.to, publication.PUBLICATION.contract);
    assert.equal(operation.amount, 0);
    assert.equal(operation.mutez, true);
    assert.equal(operation.fee, 1000);
    assert.equal(operation.storageLimit, 560);
    if (index < 9) {
      assert.equal(operation.parameter.entrypoint, 'create_token');
      assert.equal(operation.parameter.value.args[0].int, String(index + 1));
    }
  }
  const mint = plan.operations[9];
  assert.equal(mint.parameter.entrypoint, 'mint_tokens');
  assert.equal(mint.parameter.value.length, 9);
  for (const [index, row] of mint.parameter.value.entries()) {
    assert.equal(row.args[0].string, publication.PUBLICATION.sponsor);
    assert.deepEqual(row.args[1].args, [{ int: String(index + 1) }, { int: '27' }]);
  }
});

test('only the explicit publication request submits the exact reviewed operations with fee and storage limits', async () => {
  const { adapter, requests } = harness();
  const plan = await publication.prepareInventoryPublication(adapter);
  const receipt = await publication.requestInventoryPublication(adapter, plan);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0], plan.operations);
  assert.equal(receipt.opHash, 'operation-under-test');
});

test('wrong wallet, wrong chain, changed administrator, and existing token refuse before downloading or requesting', async () => {
  for (const [overrides, error] of [
    [{ address: async () => publication.PUBLICATION.sponsor }, /administrator wallet/],
    [{ chainId: async () => 'test-chain' }, /mainnet/],
    [{ administrator: async () => publication.PUBLICATION.sponsor }, /administrator has changed/],
    [{ tokenExists: async (id) => id === 4 }, /Token 4 already exists/],
  ]) {
    const { adapter, reads, requests } = harness(overrides);
    await assert.rejects(publication.prepareInventoryPublication(adapter), error);
    assert.equal(reads.length, 0);
    assert.equal(requests.length, 0);
  }
});

test('a changed published original or metadata file prevents publication', async () => {
  for (const uri of [manifest.items[0].artifactUri, manifest.items[0].metadataUri]) {
    const { adapter, requests } = harness({ bytes: async (requested) => requested === uri ? new Uint8Array([1, 2, 3]) : assets.get(requested) });
    await assert.rejects(publication.prepareInventoryPublication(adapter), /hash mismatch/);
    assert.equal(requests.length, 0);
  }
});

test('setup estimates include maximum storage cost and fail closed on oversized or malformed values', async () => {
  for (const [overrides, error] of [
    [{ estimate: async (operations) => operations.map(() => ({ suggestedFeeMutez: 1000, gasLimit: 5000, storageLimit: 1000 })) }, /1.6/],
    [{ estimate: async () => [] }, /operation count/],
    [{ costPerByte: async () => Number.NaN }, /storage price/],
    [{ costPerByte: async () => 0 }, /storage price/],
  ]) {
    const { adapter, requests } = harness(overrides);
    await assert.rejects(publication.prepareInventoryPublication(adapter), error);
    assert.equal(requests.length, 0);
  }
});

test('expired reviews and modified quantities, recipients, destinations, or fee budgets cannot reach the wallet', async () => {
  const { adapter, requests } = harness();
  const original = await publication.prepareInventoryPublication(adapter);
  for (const edit of [
    plan => { plan.preparedAt = Date.now() - 120_001; },
    plan => { plan.operations[9].parameter.value[0].args[1].args[1].int = '28'; },
    plan => { plan.operations[9].parameter.value[0].args[0].string = publication.PUBLICATION.administrator; },
    plan => { plan.operations[0].to = publication.PUBLICATION.sponsor; },
    plan => { plan.operations[0].fee = 2_000_000; },
  ]) {
    const plan = structuredClone(original);
    edit(plan);
    await assert.rejects(publication.requestInventoryPublication(adapter, plan));
    assert.equal(requests.length, 0);
  }
});

test('publication in another tab or an account change after preparation prevents any wallet request', async () => {
  const { adapter, requests } = harness();
  const plan = await publication.prepareInventoryPublication(adapter);
  adapter.tokenExists = async (id) => id === 1;
  await assert.rejects(publication.requestInventoryPublication(adapter, plan), /already exists/);
  adapter.tokenExists = async () => false;
  adapter.address = async () => publication.PUBLICATION.sponsor;
  await assert.rejects(publication.requestInventoryPublication(adapter, plan), /administrator wallet/);
  assert.equal(requests.length, 0);
});
