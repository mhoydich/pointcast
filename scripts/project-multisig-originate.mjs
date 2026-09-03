#!/usr/bin/env node

/**
 * Prepare or originate PointCast's project treasury from the audited TzSafe
 * v0.3.4 code already running as the Standard Time safe.
 *
 * The contract code is always fetched from Tezos mainnet RPC. Execution is
 * deliberately env-only and requires both --execute and the exact mainnet
 * acknowledgement. PROJECT_MULTISIG_SECRET_KEY is never printed or written.
 */

import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MichelsonMap, Schema } from '@taquito/michelson-encoder';
import { assertContractValid, assertDataValid } from '@taquito/michel-codec';
import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';
import { validateAddress, ValidationResult } from '@taquito/utils';

export const STANDARD_TIME_TZSAFE = 'KT1UCkcX1kXDiM4ML22Ck2LJdGeo3sT1F4eD';
export const MIKE_KUKAI = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
export const CC_WALLET = 'tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY';
export const PROJECT_OWNERS = [MIKE_KUKAI, CC_WALLET];
export const SECRET_KEY_ENV = 'PROJECT_MULTISIG_SECRET_KEY';
export const TZSAFE_TYPE_HASH = 1138255963;
export const TZSAFE_CODE_HASH = -521664810;
export const TZSAFE_CODE_SHA256 = '4a1a44f1d0e215efbb28a5a460ade1283d5acc2d0f4fa546bcb9a9d4e951ea3a';
export const TZSAFE_STORAGE_TYPE_SHA256 = '3f2c88e3f02d5dc3d8df78839febbd457ea287a607dff33da09d82f3933d7be0';
export const TZSAFE_IMPORT_URL = 'https://tzsafe.org/import-wallet?address=';

export function tzSafeUrl(address) {
  return `${TZSAFE_IMPORT_URL}${encodeURIComponent(address)}`;
}

const MAINNET = {
  rpc: 'https://mainnet.smartpy.io',
  fallbacks: ['https://rpc.tzkt.io/mainnet', 'https://tezos-rpc.mhoydich.workers.dev'],
  indexer: 'https://api.tzkt.io',
  explorer: 'https://tzkt.io',
};
const EXPECTED_STORAGE_FIELDS = [
  ['proposal_counter', 'nat'],
  ['proposals', 'big_map'],
  ['archives', 'big_map'],
  ['owners', 'set'],
  ['threshold', 'nat'],
  ['effective_period', 'int'],
  ['metadata', 'big_map'],
];
const MIN_BALANCE_MUTEZ = 3_000_000;

function usage() {
  console.log(`Usage: node scripts/project-multisig-originate.mjs [options]\n\n` +
    `  --threshold 1|2                       owner approvals required (default: 1)\n` +
    `  --rpc URL                             try this mainnet RPC first\n` +
    `  --execute                             broadcast; omitted means preparation-only\n` +
    `  --confirm-mainnet I_UNDERSTAND_MAINNET required with --execute\n\n` +
    `Execution also requires ${SECRET_KEY_ENV} in env. Its signer must be ${CC_WALLET}.\n` +
    `The script fetches TzSafe code from ${STANDARD_TIME_TZSAFE}; it never uses a checked-in contract artifact.`);
}

export function parseArgs(argv, env = process.env) {
  const options = { threshold: 1, rpc: '', execute: false, confirmMainnet: '', help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--threshold') options.threshold = Number(argv[++i]);
    else if (arg === '--rpc') options.rpc = argv[++i];
    else if (arg === '--execute') options.execute = true;
    else if (arg === '--confirm-mainnet') options.confirmMainnet = argv[++i];
    else if (arg === '--help') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (![1, 2].includes(options.threshold)) throw new Error('--threshold must be 1 or 2 for the two project owners.');
  if (options.rpc && !/^https:\/\//.test(options.rpc)) throw new Error('--rpc must be an https URL.');
  if (options.execute && (options.confirmMainnet !== 'I_UNDERSTAND_MAINNET' || !env[SECRET_KEY_ENV])) {
    throw new Error(`Mainnet execution requires both --confirm-mainnet I_UNDERSTAND_MAINNET and ${SECRET_KEY_ENV} in env.`);
  }
  return options;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function hashMichelson(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

async function fetchJson(url, label) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${label} failed (${response.status})`);
  return response.json();
}

async function rpcLevel(rpc) {
  const header = await fetchJson(`${rpc.replace(/\/$/, '')}/chains/main/blocks/head/header`, 'RPC head');
  return Number(header.level);
}

async function indexerLevel() {
  const head = await fetchJson(`${MAINNET.indexer}/v1/head`, 'TzKT head');
  return Number(head.level);
}

export async function selectHealthyMainnetRpc(requested = '') {
  const tzktLevel = await indexerLevel();
  const candidates = [requested || MAINNET.rpc, ...MAINNET.fallbacks]
    .filter((value, index, all) => value && all.indexOf(value) === index);
  const failures = [];
  for (const rpc of candidates) {
    try {
      const level = await rpcLevel(rpc);
      const lag = tzktLevel - level;
      console.log(`[rpc] ${rpc} level ${level}; TzKT ${tzktLevel}; lag ${lag}`);
      if (Math.abs(lag) <= 5) return rpc.replace(/\/$/, '');
      failures.push(`${rpc} is ${lag} levels behind TzKT`);
    } catch (error) {
      failures.push(`${rpc}: ${error.message}`);
    }
  }
  throw new Error(`No synchronized mainnet RPC found: ${failures.join('; ')}`);
}

export function storageTypeFromCode(code) {
  const declaration = code.find((instruction) => instruction?.prim === 'storage');
  if (!declaration?.args?.[0]) throw new Error('Fetched Michelson has no storage declaration.');
  return declaration.args[0];
}

export function describeStorageShape(storageType) {
  if (storageType?.prim !== 'pair' || !Array.isArray(storageType.args)) {
    throw new Error('TzSafe storage must be a top-level pair.');
  }
  return storageType.args.map((field) => ({
    name: field.annots?.find((annotation) => annotation.startsWith('%'))?.slice(1) || '',
    prim: field.prim,
  }));
}

export function verifyTzSafeScript(script, contractInfo) {
  if (!script || !Array.isArray(script.code) || script.storage == null) throw new Error('RPC returned an incomplete contract script.');
  assertContractValid(script.code);
  const storageType = storageTypeFromCode(script.code);
  const shape = describeStorageShape(storageType);
  if (JSON.stringify(shape.map(({ name, prim }) => [name, prim])) !== JSON.stringify(EXPECTED_STORAGE_FIELDS)) {
    throw new Error(`Unexpected TzSafe storage shape: ${shape.map(({ name, prim }) => `%${name}:${prim}`).join(', ')}`);
  }
  if (hashMichelson(script.code) !== TZSAFE_CODE_SHA256 || hashMichelson(storageType) !== TZSAFE_STORAGE_TYPE_SHA256) {
    throw new Error('Fetched Michelson does not match the reviewed Standard Time TzSafe v0.3.4 code.');
  }
  if (Number(contractInfo?.typeHash) !== TZSAFE_TYPE_HASH || Number(contractInfo?.codeHash) !== TZSAFE_CODE_HASH) {
    throw new Error(`TzKT fingerprint mismatch; expected typeHash ${TZSAFE_TYPE_HASH} and codeHash ${TZSAFE_CODE_HASH}.`);
  }
  return { storageType, shape };
}

function assertOwner(address) {
  if (validateAddress(address) !== ValidationResult.VALID) throw new Error(`Invalid owner address: ${address}`);
}

export function buildFreshStorage(storageType, {
  owners = PROJECT_OWNERS,
  threshold = 1,
  effectivePeriod = 604_800,
  metadataEntries = [],
} = {}) {
  describeStorageShape(storageType);
  owners.forEach(assertOwner);
  if (new Set(owners).size !== owners.length || owners.length === 0) throw new Error('Owners must be a non-empty set of unique addresses.');
  if (!Number.isSafeInteger(threshold) || threshold < 1 || threshold > owners.length) {
    throw new Error(`Threshold must be between 1 and ${owners.length}.`);
  }
  if (!Number.isSafeInteger(effectivePeriod) || effectivePeriod <= 0) throw new Error('Effective period must be a positive integer.');
  const metadata = new MichelsonMap();
  for (const { key, value } of metadataEntries) {
    if (typeof key !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(value)) throw new Error('Metadata entries must contain a string key and hex bytes value.');
    metadata.set(key, value);
  }
  const storage = new Schema(storageType).Encode({
    proposal_counter: 0,
    proposals: new MichelsonMap(),
    archives: new MichelsonMap(),
    owners: [...owners],
    threshold,
    effective_period: effectivePeriod,
    metadata,
  });
  assertDataValid(storage, storageType);
  return storage;
}

async function fetchSource(rpc) {
  const base = `${rpc}/chains/main/blocks/head/context/contracts/${STANDARD_TIME_TZSAFE}`;
  const [script, contractInfo] = await Promise.all([
    fetchJson(`${base}/script`, 'Standard Time TzSafe script'),
    fetchJson(`${MAINNET.indexer}/v1/contracts/${STANDARD_TIME_TZSAFE}`, 'TzKT contract fingerprint'),
  ]);
  const verified = verifyTzSafeScript(script, contractInfo);
  const decoded = new Schema(verified.storageType).Execute(script.storage);
  const effectivePeriod = Number(decoded.effective_period.toString());
  if (effectivePeriod !== 604_800) throw new Error(`Standard Time TzSafe effective period changed from 604800 to ${effectivePeriod}.`);
  if (decoded.threshold.toString() !== '1' || JSON.stringify(decoded.owners) !== JSON.stringify([MIKE_KUKAI])) {
    throw new Error('Standard Time source safe no longer has the reviewed 1-of-1 Mike owner storage.');
  }
  const metadataId = String(decoded.metadata);
  if (!/^\d+$/.test(metadataId)) throw new Error('Source TzSafe metadata is not an originated big-map id.');
  const metadataKeys = await fetchJson(`${MAINNET.indexer}/v1/bigmaps/${metadataId}/keys`, 'TzSafe metadata big-map');
  const metadataEntries = metadataKeys.filter((entry) => entry.active).map((entry) => ({ key: entry.key, value: entry.value }));
  return { code: script.code, storageType: verified.storageType, effectivePeriod, metadataEntries, shape: verified.shape };
}

async function originate({ code, storage, rpc }) {
  const secretKey = process.env[SECRET_KEY_ENV];
  const signer = await InMemorySigner.fromSecretKey(secretKey);
  const address = await signer.publicKeyHash();
  if (address !== CC_WALLET) throw new Error(`${SECRET_KEY_ENV} resolves to ${address}; expected the cc wallet ${CC_WALLET}.`);
  const tezos = new TezosToolkit(rpc);
  tezos.setProvider({ signer });
  const balance = await tezos.tz.getBalance(address);
  if (balance.toNumber() < MIN_BALANCE_MUTEZ) {
    throw new Error(`Mainnet signer ${address} holds ${(balance.toNumber() / 1_000_000).toFixed(6)} tez; require at least 3 tez before origination.`);
  }
  if (!await tezos.rpc.getManagerKey(address)) {
    console.log('[reveal] sending the key reveal as its own operation');
    const reveal = await tezos.contract.reveal({ fee: 4_000 });
    await reveal.confirmation(1);
    console.log(`[reveal] confirmed ${reveal.hash}`);
  }
  const operation = await tezos.contract.originate({ code, init: storage });
  console.log(`[originate] broadcast ${operation.hash}`);
  console.log(`[originate] ${MAINNET.explorer}/${operation.hash}`);
  const contract = await operation.contract();
  console.log(`[originate] confirmed ${contract.address}`);
  console.log(`[tzsafe] ${tzSafeUrl(contract.address)}`);
  return contract.address;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();
  const rpc = await selectHealthyMainnetRpc(options.rpc);
  const source = await fetchSource(rpc);
  const storage = buildFreshStorage(source.storageType, {
    owners: PROJECT_OWNERS,
    threshold: options.threshold,
    effectivePeriod: source.effectivePeriod,
    metadataEntries: source.metadataEntries,
  });
  console.log(`Source: ${STANDARD_TIME_TZSAFE} (TzSafe v0.3.4)`);
  console.log(`Fingerprint: typeHash ${TZSAFE_TYPE_HASH}; codeHash ${TZSAFE_CODE_HASH}`);
  console.log(`Storage: ${source.shape.map(({ name, prim }) => `%${name}:${prim}`).join(' · ')}`);
  console.log(`Fresh values: proposal_counter 0; proposals empty; archives empty; effective_period ${source.effectivePeriod}; metadata copied from source`);
  console.log(`Owners: ${PROJECT_OWNERS.join(', ')}`);
  console.log(`Threshold: ${options.threshold}-of-${PROJECT_OWNERS.length}`);
  console.log(`Code SHA-256: ${hashMichelson(source.code)}`);
  console.log(`Storage SHA-256: ${hashMichelson(storage)}`);
  if (!options.execute) {
    return console.log('Preparation complete. Nothing was originated. Add --execute --confirm-mainnet I_UNDERSTAND_MAINNET only for an approved mainnet signing session.');
  }
  return originate({ code: source.code, storage, rpc });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (fileURLToPath(import.meta.url) === invokedPath) {
  main().catch((error) => {
    console.error(`[project-multisig-originate] ${error.message}`);
    process.exitCode = 1;
  });
}
