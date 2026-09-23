// Builds a reviewable wallet payload. No key access, signing, or broadcasting.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { assertContractValid, assertDataValid } from '@taquito/michel-codec';
import { localForger } from '@taquito/local-forging';
import { TezosToolkit } from '@taquito/taquito';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2];
if (!dir) throw new Error('Usage: node scripts/nouns-bandmates-launch-package.mjs <SmartPy compile directory> [--estimate]');
const code = JSON.parse(await readFile(path.join(dir, 'step_003_cont_0_contract.json'), 'utf8'));
const storage = JSON.parse(await readFile(path.join(dir, 'step_003_cont_0_storage.json'), 'utf8'));
assertContractValid(code);
assertDataValid(storage, code.find((node) => node.prim === 'storage').args[0]);
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const hash = (value) => createHash('sha256').update(value).digest('hex');
const administrator = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
const TOKEN_COUNT = 12;
const SIGNATURE_BYTES = 64;
const MAX_OPERATION_BYTES = 32768;

const pair = (value, label) => {
  if (value?.prim !== 'Pair' || !Array.isArray(value.args) || value.args.length !== 2) {
    throw new Error(`Malformed ${label}: expected a Michelson Pair`);
  }
  return value.args;
};

const initialLedger = (value) => {
  if (!Array.isArray(value) || value.length !== TOKEN_COUNT) {
    throw new Error(`Initial ledger must contain exactly ${TOKEN_COUNT} editions`);
  }
  const tokenIds = new Set();
  for (const entry of value) {
    if (entry?.prim !== 'Elt' || !Array.isArray(entry.args) || entry.args.length !== 2) {
      throw new Error('Malformed initial ledger entry');
    }
    const [ownerAndToken, balance] = entry.args;
    const [owner, tokenId] = pair(ownerAndToken, 'initial ledger key');
    if (owner?.string !== administrator || balance?.int !== '1' || !/^\d+$/.test(tokenId?.int ?? '')) {
      throw new Error('Initial ledger must assign one edition of each token to the administrator');
    }
    tokenIds.add(Number(tokenId.int));
  }
  if (tokenIds.size !== TOKEN_COUNT || [...tokenIds].some((id) => id < 0 || id >= TOKEN_COUNT)) {
    throw new Error('Initial ledger token IDs must be exactly 0 through 11');
  }
};

const assertLaunchStorage = (value) => {
  const [storedAdministrator, rest1] = pair(value, 'storage');
  if (storedAdministrator?.string !== administrator) {
    throw new Error('Storage administrator does not match the configured creator');
  }
  const [ledger, rest2] = pair(rest1, 'storage tail');
  initialLedger(ledger);
  const [, rest3] = pair(rest2, 'metadata tail');
  const [nextTokenId, rest4] = pair(rest3, 'token counter tail');
  if (nextTokenId?.int !== String(TOKEN_COUNT)) {
    throw new Error(`next_token_id must be ${TOKEN_COUNT}`);
  }
  const [, rest5] = pair(rest4, 'operators tail');
  const [paused] = pair(rest5, 'pause tail');
  if (paused?.prim !== 'False') {
    throw new Error('Launch storage must begin with collecting open (paused=false)');
  }
};

assertLaunchStorage(storage);
const payload = { schema: 'pointcast.nouns-bandmates-origination/v1', administrator, network: 'mainnet', chainId: 'NetXdQprcVkpaWU', code, storage };
const serialized = JSON.stringify(payload);
const payloadSha256 = hash(serialized);
// This exact local forge uses a valid placeholder branch and manager fields.
// A wallet supplies the live branch/counter/fee before signing; the generous
// preflight margin makes the variable integer encodings immaterial here.
const forged = await localForger.forge({
  branch: 'BLockGenesisGenesisGenesisGenesisGenesisb83baZgbyZe',
  contents: [{
    kind: 'origination', source: administrator, fee: '1000000', counter: '1',
    gas_limit: '1040000', storage_limit: '60000', balance: '0',
    script: { code, storage },
  }],
});
const operationBytes = forged.length / 2;
const signedOperationBytes = operationBytes + SIGNATURE_BYTES;
if (operationBytes > MAX_OPERATION_BYTES || signedOperationBytes > MAX_OPERATION_BYTES) {
  throw new Error(`Origination payload is too large: ${signedOperationBytes}/${MAX_OPERATION_BYTES} bytes signed`);
}
const manifest = {
  schema: 'pointcast.nouns-bandmates-launch/v1', status: 'awaiting-user-signature',
  administrator, network: 'mainnet', chainId: payload.chainId,
  payload: `/collectibles/nouns-bandmates/launch/${payloadSha256}.json`, payloadSha256,
  codeSha256: hash(canonical(code)), storageSha256: hash(canonical(storage)),
  operationBytes, signedOperationBytes, maxOperationBytes: MAX_OPERATION_BYTES,
  terms: { priceMutez: 0, edition: 'open', tokenCount: 12, initialEditionsEach: 1, initialRecipient: administrator, paused: false, royaltyPercent: 0 },
  estimate: null,
};
if (process.argv.includes('--estimate')) {
  const tezos = new TezosToolkit('https://rpc.tzkt.io/mainnet');
  if (await tezos.rpc.getChainId() !== payload.chainId) throw new Error('Wrong network');
  const publicKey = await tezos.rpc.getManagerKey(administrator);
  if (!publicKey || typeof publicKey !== 'string') throw new Error('Creator public key is not revealed');
  tezos.setSignerProvider({
    publicKeyHash: async () => administrator, publicKey: async () => publicKey,
    secretKey: async () => { throw new Error('No private key: read-only estimate'); },
    sign: async () => { throw new Error('Signing is unavailable in this preparation script'); },
  });
  const estimate = await tezos.estimate.originate({ code, init: storage, balance: '0' });
  manifest.estimate = { at: new Date().toISOString(), gasLimit: estimate.gasLimit, storageLimit: estimate.storageLimit, suggestedFeeMutez: estimate.suggestedFeeMutez, burnFeeMutez: estimate.burnFeeMutez, totalCostMutez: estimate.totalCost, note: 'Read-only mainnet simulation. The wallet shows the final network charge.' };
}
await mkdir(path.join(root, 'public/collectibles/nouns-bandmates/launch'), { recursive: true });
await writeFile(path.join(root, 'public', manifest.payload), serialized);
await writeFile(path.join(root, 'src/data/nouns-bandmates-launch.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ payloadSha256, payloadBytes: Buffer.byteLength(serialized), estimate: manifest.estimate }, null, 2));
