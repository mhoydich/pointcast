#!/usr/bin/env node
/** Read-only mainnet preparation. NEVER signs or injects an operation.
 * Reuses Mike's existing general-purpose FA2, leaving existing token 0 alone.
 * Prepares 9 new token registrations + one mint of 27 copies each to sponsor.
 * All network requests are read calls or unsigned operation simulations. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TezosToolkit, MichelsonMap } from '@taquito/taquito';
import { validateAddress, ValidationResult } from '@taquito/utils';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const options = {
  contract: 'KT1N1U6esJHuhLpUKiebpyW9MJUCoqJyREtb',
  administrator: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw',
  sponsor: 'tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY',
  rpc: 'https://rpc.tzkt.io/mainnet',
  out: path.join(ROOT, 'work/other-worlds-inventory.json'),
  estimate: false,
};
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--estimate') options.estimate = true;
  else if (['--contract', '--administrator', '--sponsor', '--rpc', '--out'].includes(arg)) {
    const value = process.argv[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing ${arg}`);
    options[arg.slice(2)] = value;
  } else throw new Error(`Unknown option ${arg}; this tool has no sign, send, or deploy mode.`);
}
for (const field of ['contract', 'administrator', 'sponsor']) {
  if (validateAddress(options[field]) !== ValidationResult.VALID) throw new Error(`Invalid ${field}`);
}
if (!options.contract.startsWith('KT1') || !options.sponsor.startsWith('tz')) throw new Error('Expected FA2 KT1 and implicit sponsor wallet.');
// Verify every canonical file and both metadata paths before any RPC work.
execFileSync(process.execPath, [path.join(ROOT, 'scripts/prepare-other-worlds.mjs'), '--verify'], { stdio: 'inherit' });
const manifest = JSON.parse(await readFile(path.join(ROOT, 'public/collectibles/other-worlds/manifest.json'), 'utf8'));
if (manifest.items?.length !== 9 || manifest.editionSupply !== 243) throw new Error('Generate and verify all nine artwork records first.');
const tezos = new TezosToolkit(options.rpc);
if (await tezos.rpc.getChainId() !== 'NetXdQprcVkpaWU') throw new Error('Unexpected chain; this is a mainnet preparation tool.');
// Explicitly read-only signer lets Taquito estimate manager operations. Its
// signing methods cannot authorize any transaction, even if accidentally called.
tezos.setSignerProvider({
  publicKeyHash: async () => options.administrator,
  publicKey: async () => {
    const key = await tezos.rpc.getManagerKey(options.administrator);
    if (typeof key !== 'string') throw new Error('Administrator must already be revealed to estimate without keys.');
    return key;
  },
  secretKey: async () => { throw new Error('Read-only preparation has no private key.'); },
  sign: async () => { throw new Error('Signing is forbidden in the preparation tool.'); },
});
const contract = await tezos.contract.at(options.contract);
const storage = await contract.storage();
if (storage.admin?.admin !== options.administrator) throw new Error('Selected wallet is not current contract administrator.');
for (const name of ['create_token', 'mint_tokens', 'transfer']) {
  if (typeof contract.methodsObject[name] !== 'function') throw new Error(`Existing FA2 lacks ${name}`);
}
const tokenMap = {};
const operations = [];
for (const art of manifest.items) {
  const tokenId = art.id;
  const existing = await storage.assets.token_metadata.get(String(tokenId));
  if (existing !== undefined && existing !== null) throw new Error(`Token ${tokenId} is already registered; replan explicitly, do not overwrite or mint again.`);
  const rawMetadata = await readFile(path.join(ROOT, 'public/collectibles/other-worlds/metadata', `${art.id}.json`));
  if (createHash('sha256').update(rawMetadata).digest('hex') !== art.metadataSha256) throw new Error('Metadata hash mismatch.');
  const info = MichelsonMap.fromLiteral({
    '': Buffer.from(art.metadataUri).toString('hex'),
    name: Buffer.from(`${art.title} — LOS ANGELES / OTHER WORLDS`).toString('hex'),
    decimals: Buffer.from('0').toString('hex'),
    artifactSha256: Buffer.from(art.artifactSha256).toString('hex'),
    metadataSha256: Buffer.from(art.metadataSha256).toString('hex'),
  });
  operations.push({ kind: 'transaction', ...contract.methodsObject.create_token({ token_id: tokenId, token_info: info }).toTransferParams({ amount: 0, mutez: true }) });
  tokenMap[String(art.id)] = String(tokenId);
}
operations.push({ kind: 'transaction', ...contract.methodsObject.mint_tokens(
  manifest.items.map((art) => ({ owner: options.sponsor, token_id: tokenMap[String(art.id)], amount: 27 }))
).toTransferParams({ amount: 0, mutez: true }) });
let estimates = null;
if (options.estimate) {
  const rows = await tezos.estimate.batch(operations);
  estimates = { operations: rows.map((e) => ({ suggestedFeeMutez: e.suggestedFeeMutez,
    gasLimit: e.gasLimit, storageLimit: e.storageLimit, burnFeeMutez: e.burnFeeMutez,
    totalCostMutez: e.suggestedFeeMutez + e.burnFeeMutez })), totalSuggestedCostMutez: rows.reduce((sum, e) => sum + e.suggestedFeeMutez + e.burnFeeMutez, 0),
    note: 'Unsigned RPC simulation only. Includes initial inventory preparation, excludes future sponsored transfer costs. Re-estimate immediately before any user-approved signature.' };
  // Separate unsigned simulation: mint to the administrator, then transfer one
  // to the project wallet. This exercises the same FA2 new-recipient storage
  // allocation without pretending nonexistent launch inventory is already live.
  // These alternate operations are NOT the prepared inventory operations.
  const simulatedDelivery = await tezos.estimate.batch([
    ...operations.slice(0, -1),
    { kind: 'transaction', ...contract.methodsObject.mint_tokens(manifest.items.map((art) => ({
      owner: options.administrator, token_id: tokenMap[String(art.id)], amount: 27,
    }))).toTransferParams({ amount: 0, mutez: true }) },
    { kind: 'transaction', ...contract.methodsObject.transfer([{ from_: options.administrator,
      txs: [{ to_: options.sponsor, token_id: tokenMap['1'], amount: 1 }],
    }]).toTransferParams({ amount: 0, mutez: true }) },
  ]);
  const transfer = simulatedDelivery.at(-1);
  estimates.illustrativeDelivery = { suggestedFeeMutez: transfer.suggestedFeeMutez,
    burnFeeMutez: transfer.burnFeeMutez, totalCostMutez: transfer.suggestedFeeMutez + transfer.burnFeeMutez,
    for243AtSameCostMutez: (transfer.suggestedFeeMutez + transfer.burnFeeMutez) * 243,
    note: 'Illustrative unsigned new-recipient FA2 transfer simulation, using temporary simulated administrator inventory. Actual sponsor transfers are individually re-estimated and capped after mint approval.' };
}
const plan = { schema: 'pointcast.other-worlds.unsigned-inventory/v1', status: 'prepared-only',
  preparedAt: new Date().toISOString(), network: 'mainnet', chainId: 'NetXdQprcVkpaWU',
  mainnetApproved: false, contract: options.contract, administrator: options.administrator,
  sponsor: options.sponsor, tokenMap, editionSupply: 243, editionsPerArtwork: 27,
  existingContractName: options.contract === 'KT1N1U6esJHuhLpUKiebpyW9MJUCoqJyREtb' ? 'El Segundo' : null, contractMetadataUnchanged: true,
  metadata: manifest.items.map(({id, metadataUri, metadataSha256, artifactSha256}) => ({id,metadataUri,metadataSha256,artifactSha256})),
  operations, estimates,
  approvalBoundary: 'Review the existing El Segundo contract, metadata hashes, 9 new token registrations, 243 copies to the specified sponsor, and the fresh network fee estimate. This file does not sign, mint, publish, or fund anything.',
  launchBoundary: 'Keep sponsored claims disabled until the inventory transaction is independently confirmed, every token has total supply 27 and sponsor balance 27, approved metadata hashes are verified, and the project signer is securely configured with an explicit total fee budget.' };
await mkdir(path.dirname(path.resolve(options.out)), { recursive: true });
await writeFile(options.out, JSON.stringify(plan, null, 2) + '\n');
console.log(`Prepared ${operations.length} unsigned operations on the existing FA2: 9 new artworks, 243 editions. No signature or chain write.`);
if (estimates) console.log(`Unsigned estimated setup cost: ${estimates.totalSuggestedCostMutez} mutez.`);
console.log(`Plan: ${path.resolve(options.out)}`);
