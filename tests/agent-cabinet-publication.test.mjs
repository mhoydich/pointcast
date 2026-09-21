import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { promisify } from 'node:util';
import test, { after, before } from 'node:test';
import { createServer } from 'vite';

const run = promisify(execFile);
const root = new URL('../', import.meta.url);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const provenance = JSON.parse(await readFile(new URL('../src/data/agent-cabinet-provenance.json', import.meta.url), 'utf8'));
const prepared = JSON.parse(await readFile(new URL('../src/data/agent-cabinet-publication.json', import.meta.url), 'utf8'));

let vite;
let publication;
const assets = new Map();

before(async () => {
  vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  publication = await vite.ssrLoadModule('/src/lib/agent-cabinet-publication.ts');
  for (const item of provenance.items) {
    for (const uri of [item.artifactUri, item.metadataUri]) {
      assets.set(uri, new Uint8Array(await readFile(new URL(`../public${new URL(uri).pathname}`, import.meta.url))));
    }
  }
});

after(async () => { await vite?.close(); });

function harness(overrides = {}) {
  const requests = [];
  const reads = [];
  const adapter = {
    address: async () => publication.AGENT_CABINET_PUBLICATION.administrator,
    chainId: async () => publication.AGENT_CABINET_PUBLICATION.chainId,
    administrator: async () => publication.AGENT_CABINET_PUBLICATION.administrator,
    tokenExists: async () => false,
    bytes: async (uri) => { reads.push(uri); return assets.get(uri); },
    estimate: async (operations) => operations.map(() => ({ suggestedFeeMutez: 1_000, gasLimit: 5_000, storageLimit: 500 })),
    costPerByte: async () => 250,
    request: async (operations) => {
      requests.push(operations);
      return { opHash: `o${'1'.repeat(50)}`, confirmation: async () => undefined };
    },
    ...overrides,
  };
  return { adapter, requests, reads };
}

test('Agent Cabinet artifacts and TZIP-21 records are deterministic, content-addressed PointCast proposals', async () => {
  assert.equal(prepared.status, 'prepared-only');
  assert.equal(prepared.mainnetApproved, false);
  assert.equal(prepared.requestable, false);
  assert.equal(prepared.operationHash, null);
  assert.equal(prepared.editionSupply, 81);
  assert.deepEqual(prepared.tokenMap, {
    'listening-tile-001': '10',
    'night-shift-field-note': '11',
    'rain-crow-receipt': '12',
  });
  assert.equal(provenance.publisher, 'PointCast');
  assert.equal(provenance.creatorAuthorization.status, 'unverified');
  assert.equal(provenance.items.length, 3);

  const sourceManifest = await readFile(new URL('../src/data/agent-cabinet-provenance.json', import.meta.url));
  const publicManifest = await readFile(new URL('../public/collectibles/agent-cabinet/manifest.json', import.meta.url));
  assert.deepEqual(publicManifest, sourceManifest);
  const sourcePublication = await readFile(new URL('../src/data/agent-cabinet-publication.json', import.meta.url));
  const publicPublication = await readFile(new URL('../public/collectibles/agent-cabinet/publication.json', import.meta.url));
  assert.deepEqual(publicPublication, sourcePublication);
  assert.equal(provenance.preparedPublication.sha256, sha256(publicPublication));
  assert.equal(provenance.preparedPublication.bytes, publicPublication.byteLength);

  const artifactFiles = await readdir(new URL('../public/collectibles/agent-cabinet/artifacts/', import.meta.url));
  assert.deepEqual(
    artifactFiles.sort(),
    provenance.items.map((item) => `${item.artifactSha256}.svg`).sort(),
  );
  assert.ok(artifactFiles.every((name) => /^[a-f0-9]{64}\.svg$/u.test(name)));
  const metadataFiles = await readdir(new URL('../public/collectibles/agent-cabinet/metadata/', import.meta.url));
  assert.deepEqual(
    metadataFiles.sort(),
    [
      ...provenance.items.map((item) => `${item.id}.json`),
      ...provenance.items.map((item) => `${item.metadataSha256}.json`),
    ].sort(),
  );

  for (const [index, item] of provenance.items.entries()) {
    assert.equal(item.id, 10 + index);
    assert.equal(item.editions, 27);
    const artifact = await readFile(new URL(`../public${new URL(item.artifactUri).pathname}`, import.meta.url));
    const metadata = await readFile(new URL(`../public${new URL(item.metadataUri).pathname}`, import.meta.url));
    const alias = await readFile(new URL(`../public/collectibles/agent-cabinet/metadata/${item.id}.json`, import.meta.url));
    assert.equal(artifact.byteLength, item.artifactBytes);
    assert.equal(metadata.byteLength, item.metadataBytes);
    assert.equal(sha256(artifact), item.artifactSha256);
    assert.equal(sha256(metadata), item.metadataSha256);
    assert.equal(new URL(item.artifactUri).pathname, `/collectibles/agent-cabinet/artifacts/${item.artifactSha256}.svg`);
    assert.match(item.metadataUri, new RegExp(`${item.metadataSha256}\\.json$`, 'u'));
    assert.deepEqual(alias, metadata);
    assert.match(artifact.toString('utf8'), /^<svg\b/u);
    assert.doesNotMatch(artifact.toString('utf8'), /<script\b|\bon\w+\s*=|(?:href|src)\s*=\s*["']https?:/iu);

    const record = JSON.parse(metadata.toString('utf8'));
    assert.equal(record.publisher, 'PointCast');
    assert.equal(record.artist, 'PointCast');
    assert.equal(record.credit, 'PUBLISHED BY POINTCAST');
    assert.deepEqual(record.creators, [prepared.administrator]);
    assert.equal(record.creatorAuthorization.status, 'unverified');
    assert.equal(record.creatorAuthorization.runtimePublisherId, null);
    assert.equal(record.creatorAuthorization.signature, null);
    assert.equal(record.proposedFor.residentIdentityId, item.proposedFor.residentIdentityId);
    assert.equal(record.editionSupply, 27);
    assert.equal(record.artifactSha256, item.artifactSha256);
    assert.equal(record.artifactUri, item.artifactUri);
    assert.equal(record.displayUri, item.artifactUri);
    assert.equal(record.thumbnailUri, item.artifactUri);
    assert.equal(record.formats[0].uri, item.artifactUri);
    assert.equal(record.formats[0].fileName, `${item.artifactSha256}.svg`);
    assert.equal(record.formats[0].mimeType, 'image/svg+xml');
  }

  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  assert.match(headers, /\/collectibles\/agent-cabinet\/artifacts\/\*\n\s+! Cache-Control\n\s+Cache-Control: public, max-age=31536000, immutable\n\s+Access-Control-Allow-Origin: \*/u);
  for (const item of provenance.items) {
    const path = `/collectibles/agent-cabinet/metadata/${item.metadataSha256}.json`;
    assert.match(headers, new RegExp(`${path.replaceAll('/', '\\/')}\\n\\s+! Cache-Control\\n\\s+Cache-Control: public, max-age=31536000, immutable\\n\\s+Access-Control-Allow-Origin: \\*`, 'u'));
  }
  assert.doesNotMatch(headers, /\/collectibles\/agent-cabinet\/metadata\/(?:10|11|12)\.json\n\s+! Cache-Control/u);

  const sums = await readFile(new URL('../public/collectibles/agent-cabinet/SHA256SUMS', import.meta.url), 'utf8');
  const expectedSums = [
    ...provenance.items.map((item) => `${item.artifactSha256}  artifacts/${item.artifactSha256}.svg`),
    ...provenance.items.map((item) => `${item.metadataSha256}  metadata/${item.metadataSha256}.json`),
    `${sha256(publicManifest)}  manifest.json`,
    `${sha256(publicPublication)}  publication.json`,
  ].join('\n') + '\n';
  assert.equal(sums, expectedSums);
});

test('the exact unsigned inventory is three registrations and one 81-edition mint', () => {
  const operations = publication.agentCabinetInventoryOperations();
  assert.equal(operations.length, 4);
  for (const [index, operation] of operations.entries()) {
    assert.equal(operation.kind, 'transaction');
    assert.equal(operation.to, prepared.contract);
    assert.equal(operation.amount, 0);
    assert.equal(operation.mutez, true);
    if (index < 3) {
      assert.equal(operation.parameter.entrypoint, 'create_token');
      assert.equal(operation.parameter.value.args[0].int, String(10 + index));
    }
  }
  const mint = operations[3];
  assert.equal(mint.parameter.entrypoint, 'mint_tokens');
  assert.equal(mint.parameter.value.length, 3);
  for (const [index, row] of mint.parameter.value.entries()) {
    assert.equal(row.args[0].string, prepared.inventoryRecipient);
    assert.deepEqual(row.args[1].args, [{ int: String(10 + index) }, { int: '27' }]);
  }
});

test('read-only preparation verifies six published files and estimates without requesting the wallet', async () => {
  const { adapter, reads, requests } = harness();
  const plan = await publication.prepareAgentCabinetPublication(adapter);
  assert.equal(reads.length, 6);
  assert.equal(new Set(reads).size, 6);
  assert.equal(requests.length, 0);
  assert.equal(plan.operations.length, 4);
  assert.equal(plan.maximumCostMutez, 504_000);
  assert.match(plan.reviewDigest, /^[a-f0-9]{64}$/u);
  assert.equal(plan.requestable, false);
});

test('chain changes, occupied token IDs, changed bytes, and oversized estimates fail before a wallet request', async () => {
  for (const [overrides, error] of [
    [{ address: async () => prepared.inventoryRecipient }, /administrator/iu],
    [{ chainId: async () => 'NetXnHfVqm9iesp' }, /mainnet/iu],
    [{ administrator: async () => prepared.inventoryRecipient }, /administrator has changed/iu],
    [{ tokenExists: async (id) => id === 11 }, /Token 11 already exists/iu],
    [{ bytes: async (uri) => uri === provenance.items[0].artifactUri ? new Uint8Array([1, 2, 3]) : assets.get(uri) }, /artifact hash mismatch/iu],
    [{ estimate: async (operations) => operations.map(() => ({ suggestedFeeMutez: 1_000, gasLimit: 5_000, storageLimit: 1_000 })) }, /1 ꜩ/iu],
  ]) {
    const { adapter, requests } = harness(overrides);
    await assert.rejects(publication.prepareAgentCabinetPublication(adapter), error);
    assert.equal(requests.length, 0);
  }
});

test('one short-lived typed human approval opens one exact wallet request, never an automatic request', async () => {
  const { adapter, requests } = harness();
  const plan = await publication.prepareAgentCabinetPublication(adapter);
  await assert.rejects(
    publication.approveAgentCabinetPublication(plan, 'publish it'),
    /exact token, quantity, and inventory-recipient/iu,
  );
  assert.equal(requests.length, 0);
  const approval = await publication.approveAgentCabinetPublication(
    plan,
    publication.AGENT_CABINET_APPROVAL_PHRASE,
  );
  assert.equal(approval.reviewDigest, plan.reviewDigest);
  assert.ok(approval.expiresAt > approval.issuedAt);
  assert.ok(approval.expiresAt - approval.issuedAt <= 60_000);
  await assert.rejects(
    publication.requestAgentCabinetPublication(adapter, plan, null),
    /approval is missing/iu,
  );
  await assert.rejects(
    publication.requestAgentCabinetPublication(adapter, plan, { ...approval, token: '0'.repeat(64) }),
    /does not match this review/iu,
  );
  assert.equal(requests.length, 0);
  const receipt = await publication.requestAgentCabinetPublication(adapter, plan, approval);
  assert.equal(receipt.opHash, `o${'1'.repeat(50)}`);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0], plan.operations);
  await assert.rejects(
    publication.requestAgentCabinetPublication(adapter, plan, approval),
    /already used/iu,
  );
  assert.equal(requests.length, 1);
});

test('offline preparation and admin review stay prepared-only and expose no scripted signer', async () => {
  const script = await readFile(new URL('../scripts/prepare-agent-cabinet-inventory.mjs', import.meta.url), 'utf8');
  const page = await readFile(new URL('../src/pages/admin/agent-cabinet.astro', import.meta.url), 'utf8');
  assert.match(script, /--offline/u);
  assert.match(script, /api\.tzkt\.io\/v1\/tokens/u);
  assert.match(script, /tokenIdsAbsentFromRpcStorage/u);
  assert.match(script, /tokenIdsAbsentFromTzkt/u);
  assert.match(script, /Signing is forbidden in the preparation tool/u);
  assert.doesNotMatch(script, /\.send\s*\(|sendRawTransaction|injection\/operation|fromSecretKey/u);
  assert.match(page, /noindex,nofollow/u);
  assert.match(page, /creator authorization.*Unverified/isu);
  assert.match(page, /id="understood"/u);
  assert.match(page, /id="acknowledgement"/u);
  assert.match(page, /id="publish"/u);
  assert.match(page, /No automatic publication/u);

  const result = await run(process.execPath, [
    new URL('../scripts/prepare-agent-cabinet-inventory.mjs', import.meta.url).pathname,
    '--offline',
  ], { cwd: new URL('..', import.meta.url).pathname });
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, 'prepared-only');
  assert.equal(output.mainnetApproved, false);
  assert.equal(output.requestable, false);
  assert.equal(output.operationHash, null);
  assert.equal(output.editionSupply, 81);
  assert.equal(output.localVerification.artifacts, 3);
  assert.equal(output.localVerification.metadataRecords, 3);
  assert.equal(output.liveChecks, null);
  assert.match(result.stderr, /No signature, wallet request, chain write, mint, transfer, injection, or deployment was performed/u);
});
