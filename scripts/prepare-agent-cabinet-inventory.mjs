#!/usr/bin/env node
/**
 * Read-only Agent Cabinet inventory preparation.
 *
 * Verifies deterministic SVG + TZIP-21 bytes locally, then (unless --offline)
 * reads Tezos mainnet, the existing FA2 storage, and TzKT. --estimate performs
 * unsigned simulation with a signer that cannot sign. There is deliberately no
 * sign, send, inject, mint, transfer, approve, or deploy mode.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PROVENANCE_PATH = path.join(ROOT, 'src/data/agent-cabinet-provenance.json');
const PUBLICATION_PATH = path.join(ROOT, 'src/data/agent-cabinet-publication.json');
const PUBLIC_MANIFEST_PATH = path.join(ROOT, 'public/collectibles/agent-cabinet/manifest.json');
const PUBLIC_PUBLICATION_PATH = path.join(ROOT, 'public/collectibles/agent-cabinet/publication.json');
const PUBLIC_PACKAGE_PATH = path.join(ROOT, 'public/collectibles/agent-cabinet');
const CHECKSUM_PATH = path.join(PUBLIC_PACKAGE_PATH, 'SHA256SUMS');
const DEFAULT_RPC = 'https://rpc.tzkt.io/mainnet';
const TZKT_TOKENS = 'https://api.tzkt.io/v1/tokens';
const MAINNET_CHAIN_ID = 'NetXdQprcVkpaWU';

const options = { offline: false, estimate: false, rpc: DEFAULT_RPC, out: null };
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === '--offline') options.offline = true;
  else if (argument === '--estimate') options.estimate = true;
  else if (argument === '--rpc' || argument === '--out') {
    const value = process.argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing ${argument} value.`);
    options[argument.slice(2)] = value;
    index += 1;
  } else {
    throw new Error(`Unknown option ${argument}; this tool has no sign, send, inject, mint, transfer, approve, or deploy mode.`);
  }
}
if (options.offline && options.estimate) throw new Error('--estimate requires read-only network checks; remove --offline.');
if (!options.offline) {
  const rpc = new URL(options.rpc);
  if (rpc.protocol !== 'https:' || rpc.username || rpc.password) throw new Error('RPC must be an HTTPS URL without credentials.');
}

const bytes = (value) => new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fail = (message) => { throw new Error(message); };
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const publicFile = (url) => {
  const parsed = new URL(url);
  if (parsed.origin !== 'https://pointcast.xyz') fail(`Unexpected publication origin: ${url}`);
  const relative = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
  const resolved = path.resolve(ROOT, 'public', relative);
  const publicRoot = `${path.resolve(ROOT, 'public')}${path.sep}`;
  if (!resolved.startsWith(publicRoot)) fail(`Published path escapes the public directory: ${url}`);
  return resolved;
};

const provenance = await readJson(PROVENANCE_PATH);
const publication = await readJson(PUBLICATION_PATH);
const publicManifestBytes = await readFile(PUBLIC_MANIFEST_PATH);
const sourceManifestBytes = await readFile(PROVENANCE_PATH);
const publicPublicationBytes = await readFile(PUBLIC_PUBLICATION_PATH);
const sourcePublicationBytes = await readFile(PUBLICATION_PATH);

if (!bytes(publicManifestBytes).every((value, index) => value === sourceManifestBytes[index])
  || publicManifestBytes.byteLength !== sourceManifestBytes.byteLength) {
  fail('The public provenance manifest differs from the reviewed source manifest.');
}
if (!bytes(publicPublicationBytes).every((value, index) => value === sourcePublicationBytes[index])
  || publicPublicationBytes.byteLength !== sourcePublicationBytes.byteLength
  || provenance.preparedPublication?.uri !== 'https://pointcast.xyz/collectibles/agent-cabinet/publication.json'
  || provenance.preparedPublication?.bytes !== sourcePublicationBytes.byteLength
  || provenance.preparedPublication?.sha256 !== sha256(sourcePublicationBytes)) {
  fail('The public prepared-publication record or its provenance hash differs from reviewed source.');
}
if (provenance.schema !== 'pointcast.agent-cabinet.provenance/v1'
  || provenance.publisher !== 'PointCast'
  || provenance.creatorAuthorization?.status !== 'unverified'
  || provenance.creatorAuthorization?.runtimePublisherId !== null
  || provenance.creatorAuthorization?.signature !== null
  || provenance.publicationStatus !== 'prepared-only') {
  fail('The publisher, creator-authorization, or prepared-only boundary changed.');
}
if (publication.status !== 'prepared-only'
  || publication.mainnetApproved !== false
  || publication.requestable !== false
  || publication.operationHash !== null
  || publication.chainId !== MAINNET_CHAIN_ID
  || publication.editionsPerObject !== 27
  || publication.editionSupply !== 81) {
  fail('The checked-in publication must remain an unsigned, unapproved 81-edition plan.');
}
if (!Array.isArray(provenance.items)
  || provenance.items.length !== 3
  || provenance.items.some((item, index) => item.id !== index + 10 || item.editions !== 27)) {
  fail('Expected token IDs 10-12 with exactly 27 editions each.');
}

for (const item of provenance.items) {
  const expectedArtifactUri = `https://pointcast.xyz/collectibles/agent-cabinet/artifacts/${item.artifactSha256}.svg`;
  const expectedMetadataUri = `https://pointcast.xyz/collectibles/agent-cabinet/metadata/${item.metadataSha256}.json`;
  if (item.artifactUri !== expectedArtifactUri || item.metadataUri !== expectedMetadataUri) {
    fail(`Published URLs are not content-addressed for ${item.slug}.`);
  }
  const artifactPath = publicFile(item.artifactUri);
  const metadataPath = publicFile(item.metadataUri);
  const artifact = await readFile(artifactPath);
  const metadataBytes = await readFile(metadataPath);
  const metadataAlias = await readFile(path.join(path.dirname(metadataPath), `${item.id}.json`));
  if ((await stat(artifactPath)).size !== item.artifactBytes || sha256(artifact) !== item.artifactSha256) {
    fail(`Artifact hash or size mismatch for ${item.slug}.`);
  }
  if ((await stat(metadataPath)).size !== item.metadataBytes || sha256(metadataBytes) !== item.metadataSha256) {
    fail(`Metadata hash or size mismatch for ${item.slug}.`);
  }
  if (metadataAlias.byteLength !== metadataBytes.byteLength
    || !bytes(metadataAlias).every((value, index) => value === metadataBytes[index])) {
    fail(`Token metadata alias differs from its content-addressed record for ${item.slug}.`);
  }
  const svg = artifact.toString('utf8');
  if (!/^<svg\b/u.test(svg) || /<script\b|\bon\w+\s*=|(?:href|src)\s*=\s*["']https?:/iu.test(svg)) {
    fail(`Artifact is not a self-contained deterministic SVG for ${item.slug}.`);
  }
  const metadata = JSON.parse(metadataBytes.toString('utf8'));
  if (metadata.publisher !== 'PointCast'
    || metadata.artist !== 'PointCast'
    || metadata.credit !== 'PUBLISHED BY POINTCAST'
    || metadata.publisherAddress !== publication.administrator
    || metadata.creators?.length !== 1
    || metadata.creators[0] !== publication.administrator
    || metadata.creatorAuthorization?.status !== 'unverified'
    || metadata.creatorAuthorization?.runtimePublisherId !== null
    || metadata.creatorAuthorization?.signature !== null
    || metadata.proposedFor?.residentIdentityId !== item.proposedFor.residentIdentityId
    || metadata.artifactUri !== item.artifactUri
    || metadata.displayUri !== item.artifactUri
    || metadata.thumbnailUri !== item.artifactUri
    || metadata.artifactSha256 !== item.artifactSha256
    || metadata.formats?.[0]?.uri !== item.artifactUri
    || metadata.formats?.[0]?.fileName !== `${item.artifactSha256}.svg`
    || metadata.formats?.[0]?.sha256 !== item.artifactSha256
    || metadata.formats?.[0]?.mimeType !== 'image/svg+xml'
    || metadata.editionSupply !== 27) {
    fail(`TZIP-21 metadata boundary mismatch for ${item.slug}.`);
  }
}
const artifactFiles = (await readdir(path.join(PUBLIC_PACKAGE_PATH, 'artifacts'))).sort();
const expectedArtifactFiles = provenance.items.map((item) => `${item.artifactSha256}.svg`).sort();
if (JSON.stringify(artifactFiles) !== JSON.stringify(expectedArtifactFiles)) {
  fail('The canonical artifact directory must contain only SHA-256-named SVGs.');
}
const checksumText = [
  ...provenance.items.map((item) => `${item.artifactSha256}  artifacts/${item.artifactSha256}.svg`),
  ...provenance.items.map((item) => `${item.metadataSha256}  metadata/${item.metadataSha256}.json`),
  `${sha256(publicManifestBytes)}  manifest.json`,
  `${sha256(publicPublicationBytes)}  publication.json`,
].join('\n') + '\n';
if (await readFile(CHECKSUM_PATH, 'utf8') !== checksumText) fail('The deterministic SHA256SUMS listing changed.');

const operationSummary = [
  ...provenance.items.map((item, index) => ({
    order: index + 1,
    entrypoint: 'create_token',
    tokenId: String(item.id),
    metadataUri: item.metadataUri,
    metadataSha256: item.metadataSha256,
  })),
  {
    order: 4,
    entrypoint: 'mint_tokens',
    recipient: publication.inventoryRecipient,
    mints: provenance.items.map((item) => ({ tokenId: String(item.id), amount: 27 })),
  },
];
if (JSON.stringify(operationSummary) !== JSON.stringify(publication.operations)) {
  fail('The checked-in operation summary differs from the exact provenance package.');
}

let liveChecks = null;
let estimates = null;
if (!options.offline) {
  const [{ TezosToolkit, MichelsonMap }, { validateAddress, ValidationResult }] = await Promise.all([
    import('@taquito/taquito'),
    import('@taquito/utils'),
  ]);
  for (const [label, address] of [
    ['contract', publication.contract],
    ['administrator', publication.administrator],
    ['inventory recipient', publication.inventoryRecipient],
  ]) {
    if (validateAddress(address) !== ValidationResult.VALID) fail(`Invalid ${label}.`);
  }
  if (!publication.contract.startsWith('KT1')) fail('Expected an FA2 KT1 contract.');
  const tezos = new TezosToolkit(options.rpc);
  const chainId = await tezos.rpc.getChainId();
  if (chainId !== MAINNET_CHAIN_ID) fail('Unexpected chain; this tool prepares Tezos mainnet only.');
  const contract = await tezos.contract.at(publication.contract);
  const storage = await contract.storage();
  if (storage.admin?.admin !== publication.administrator) fail('The configured address is not the current FA2 administrator.');
  for (const name of ['create_token', 'mint_tokens', 'transfer']) {
    if (typeof contract.methodsObject[name] !== 'function') fail(`Existing FA2 lacks ${name}.`);
  }
  const tokenMap = {};
  const operations = [];
  const rpcAbsent = [];
  const tzktAbsent = [];
  for (const item of provenance.items) {
    const tokenId = String(item.id);
    const existing = await storage.assets.token_metadata.get(tokenId);
    if (existing !== undefined && existing !== null) {
      fail(`Token ${tokenId} already exists in FA2 storage; do not publish or mint it again.`);
    }
    rpcAbsent.push(tokenId);
    const response = await fetch(`${TZKT_TOKENS}?contract=${encodeURIComponent(publication.contract)}&tokenId=${tokenId}&limit=1`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) fail(`TzKT token check failed for ${tokenId} (${response.status}).`);
    const indexed = await response.json();
    if (!Array.isArray(indexed) || indexed.length !== 0) fail(`TzKT already indexes token ${tokenId}; stop and reconcile.`);
    tzktAbsent.push(tokenId);
    const tokenInfo = MichelsonMap.fromLiteral({
      '': Buffer.from(item.metadataUri).toString('hex'),
      artifactSha256: Buffer.from(item.artifactSha256).toString('hex'),
      decimals: Buffer.from('0').toString('hex'),
      metadataSha256: Buffer.from(item.metadataSha256).toString('hex'),
      name: Buffer.from(`${item.title} — The Agent Cabinet`).toString('hex'),
      publisher: Buffer.from('PointCast').toString('hex'),
    });
    operations.push({
      kind: 'transaction',
      ...contract.methodsObject.create_token({ token_id: item.id, token_info: tokenInfo })
        .toTransferParams({ amount: 0, mutez: true }),
    });
    tokenMap[item.slug] = tokenId;
  }
  operations.push({
    kind: 'transaction',
    ...contract.methodsObject.mint_tokens(provenance.items.map((item) => ({
      owner: publication.inventoryRecipient,
      token_id: tokenMap[item.slug],
      amount: 27,
    }))).toTransferParams({ amount: 0, mutez: true }),
  });
  liveChecks = {
    observedAt: new Date().toISOString(),
    chainId,
    contract: publication.contract,
    administrator: publication.administrator,
    tokenIdsAbsentFromRpcStorage: rpcAbsent,
    tokenIdsAbsentFromTzkt: tzktAbsent,
  };
  if (options.estimate) {
    tezos.setSignerProvider({
      publicKeyHash: async () => publication.administrator,
      publicKey: async () => {
        const key = await tezos.rpc.getManagerKey(publication.administrator);
        if (typeof key !== 'string') fail('Administrator must already be revealed for unsigned estimation.');
        return key;
      },
      secretKey: async () => fail('Read-only preparation has no private key.'),
      sign: async () => fail('Signing is forbidden in the preparation tool.'),
    });
    const rows = await tezos.estimate.batch(operations);
    const constants = await tezos.rpc.getConstants();
    const costPerByte = Number(constants.cost_per_byte);
    if (!Number.isSafeInteger(costPerByte) || costPerByte <= 0) fail('Invalid storage price.');
    const preparedRows = rows.map((row) => ({
      suggestedFeeMutez: row.suggestedFeeMutez,
      gasLimit: row.gasLimit,
      storageLimit: row.storageLimit,
      maximumCostMutez: row.suggestedFeeMutez + row.storageLimit * costPerByte,
    }));
    const maximumCostMutez = preparedRows.reduce((sum, row) => sum + row.maximumCostMutez, 0);
    if (maximumCostMutez > publication.setupCapMutez) fail('Unsigned estimate exceeds the checked-in 1 tez setup cap.');
    estimates = {
      operations: preparedRows,
      costPerByte,
      maximumCostMutez,
      note: 'Unsigned RPC simulation only. Re-estimate immediately before a separately approved wallet request.',
    };
  }
}

const plan = {
  schema: publication.schema,
  status: 'prepared-only',
  preparedAt: new Date().toISOString(),
  mainnetApproved: false,
  requestable: false,
  operationHash: null,
  publisher: 'PointCast',
  residentCreatorAuthorization: 'unverified',
  network: publication.network,
  chainId: publication.chainId,
  contract: publication.contract,
  administrator: publication.administrator,
  inventoryRecipient: publication.inventoryRecipient,
  tokenMap: publication.tokenMap,
  editionsPerObject: 27,
  editionSupply: 81,
  operations: operationSummary,
  localVerification: {
    artifacts: 3,
    metadataRecords: 3,
    publicManifestSha256: sha256(publicManifestBytes),
    publicPublicationSha256: sha256(publicPublicationBytes),
  },
  liveChecks,
  estimates,
  approvalBoundary: publication.approvalBoundary,
  launchBoundary: publication.launchBoundary,
};

const output = `${JSON.stringify(plan, null, 2)}\n`;
if (options.out) {
  const destination = path.resolve(options.out);
  await writeFile(destination, output, { flag: 'wx' });
  console.error(`Prepared read-only Agent Cabinet review: ${destination}`);
} else {
  process.stdout.write(output);
}
console.error('No signature, wallet request, chain write, mint, transfer, injection, or deployment was performed.');
