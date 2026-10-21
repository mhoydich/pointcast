#!/usr/bin/env node

/**
 * Enjoy. Money — Phase 1 chain operations for the enjoy-money FA2.
 *
 *   node scripts/enjoy-money.mjs originate --network shadownet [--execute]
 *   node scripts/enjoy-money.mjs gate1     --network shadownet [--execute]
 *   node scripts/enjoy-money.mjs status    --network shadownet
 *
 * originate  Originates contracts/build/enjoy_money with the configured admin,
 *            Treasury and metadata base, then records the KT1 in config.json.
 * gate1      Mints each configured print run to Treasury, seals those notes, and
 *            tops the Bot Note up to its test balance. Skips work already done.
 * status     Reads TzKT and checks the Gate 1 conditions. Exits 1 if any fail.
 *
 * Everything is preparation-only until --execute. The admin key (the stampz
 * deploy key) is read from env only and never logged: ENJOY_MONEY_TESTNET_SECRET_KEY
 * on shadownet, ENJOY_MONEY_MAINNET_SECRET_KEY on mainnet, where --confirm-mainnet
 * I_UNDERSTAND_MAINNET is also required. The signer must be the configured admin.
 * Closed loop: nothing here sells, swaps or redeems.
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import { assertContractValid, assertDataValid } from '@taquito/michel-codec';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONFIG_PATH = path.join(ROOT, 'contracts/enjoy-money/config.json');
const BUILD_DIR = path.join(ROOT, 'contracts/build/enjoy_money');
export const PLACEHOLDER_ADDRESS = 'tz1burnburnburnburnburnburnburjAYjjX';
export const TOKEN_IDS = [0, 1, 2, 3];
export const BOT_NOTE = 3;
const ADDRESS = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
const KT1 = /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/;
export const SECRET_KEY_ENV = { shadownet: 'ENJOY_MONEY_TESTNET_SECRET_KEY', mainnet: 'ENJOY_MONEY_MAINNET_SECRET_KEY' };
export const NETWORKS = {
  shadownet: { rpc: 'https://shadownet.smartpy.io', indexer: 'https://api.shadownet.tzkt.io', explorer: 'https://shadownet.tzkt.io', minBalance: 2_000_000 },
  mainnet: { rpc: 'https://mainnet.smartpy.io', indexer: 'https://api.tzkt.io', explorer: 'https://tzkt.io', minBalance: 3_000_000 },
};

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { command, network: 'shadownet', execute: false, confirmMainnet: '', rpc: '', help: false };
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--network') options.network = rest[++i];
    else if (arg === '--execute') options.execute = true;
    else if (arg === '--confirm-mainnet') options.confirmMainnet = rest[++i];
    else if (arg === '--rpc') options.rpc = rest[++i];
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!command || command === '--help' || command === '-h') options.help = true;
  else if (!['originate', 'gate1', 'status'].includes(command)) throw new Error(`Unknown command: ${command}`);
  if (options.network === 'ghostnet') throw new Error('Ghostnet is retired. Use --network shadownet.');
  if (!NETWORKS[options.network]) throw new Error('--network must be shadownet or mainnet');
  if (options.execute && options.network === 'mainnet' && options.confirmMainnet !== 'I_UNDERSTAND_MAINNET') {
    throw new Error('Mainnet --execute requires --confirm-mainnet I_UNDERSTAND_MAINNET.');
  }
  return options;
}

/** Problems that block --execute for this environment. Empty means ready. */
export function configProblems(env, network, { needContract = false } = {}) {
  const problems = [];
  for (const key of ['admin', 'treasury']) {
    if (!ADDRESS.test(env?.[key] || '')) problems.push(`${key} is not set to a tz address`);
    else if (env[key] === PLACEHOLDER_ADDRESS) problems.push(`${key} is still the burn placeholder`);
  }
  if (env?.admin && env.admin === env.treasury) problems.push('admin and treasury must be separate keys');
  const base = env?.metadataBase || '';
  if (!/^(https|ipfs):\/\//.test(base)) problems.push('metadataBase must be an https:// or ipfs:// URL');
  if (network === 'mainnet' && !base.startsWith('ipfs://')) problems.push('mainnet metadataBase must be ipfs:// (pin the final art and metadata first)');
  for (const [id, amount] of Object.entries(env?.printRuns || {})) {
    if (!['0', '1', '2'].includes(id)) problems.push(`printRuns may only cover notes 0-2, not ${id}`);
    if (!Number.isSafeInteger(amount) || amount < 1) problems.push(`printRuns.${id} must be a positive integer`);
  }
  for (const id of env?.seal || []) {
    if (![0, 1, 2].includes(id)) problems.push(`seal may only list notes 0-2, not ${id}`);
    if (!env.printRuns?.[String(id)]) problems.push(`note ${id} is listed to seal but has no print run`);
  }
  if (!Number.isSafeInteger(env?.botTestMint) || env.botTestMint < 0) problems.push('botTestMint must be a nonnegative integer');
  if (needContract && !KT1.test(env?.contract || '')) problems.push('contract is not set; originate first');
  return problems;
}

const hex = (value) => Buffer.from(value, 'utf8').toString('hex');
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function storageTypeFromCode(code) {
  const declaration = code.find((instruction) => instruction?.prim === 'storage');
  if (!declaration?.args?.[0]) throw new Error('Compiled Michelson has no storage declaration.');
  return declaration.args[0];
}

function annotatedFields(storageType, storage) {
  const fields = new Map();
  (function walk(type, value, where) {
    const annotation = type?.annots?.find((item) => item.startsWith('%'))?.slice(1);
    if (annotation) fields.set(annotation, { type, value });
    if (type?.prim !== 'pair') return;
    if (value?.prim !== 'Pair' || type.args?.length !== 2 || value.args?.length !== 2) {
      throw new Error(`Compiled storage does not match its type at ${where}.`);
    }
    walk(type.args[0], value.args[0], `${where}.0`);
    walk(type.args[1], value.args[1], `${where}.1`);
  })(storageType, storage, 'storage');
  return fields;
}

function field(fields, name, prim) {
  const found = fields.get(name);
  if (!found) throw new Error(`Compiled storage is missing %${name}.`);
  if (found.type.prim !== prim) throw new Error(`Compiled %${name} is ${found.type.prim}, expected ${prim}.`);
  return found.value;
}

function setEmptyKey(entries, uri, where) {
  const empty = entries.find((entry) => entry?.prim === 'Elt' && entry.args?.[0]?.string === '');
  if (!empty) throw new Error(`${where} has no TZIP-16 "" entry.`);
  empty.args[1] = { bytes: hex(uri) };
}

/** Fill the placeholder build storage with an environment's admin, Treasury and metadata URIs. */
export function prepareStorage(template, storageType, env) {
  const storage = structuredClone(template);
  const fields = annotatedFields(storageType, storage);
  const base = (env.metadataBase || '').replace(/\/$/, '');
  field(fields, 'administrator', 'address').string = env.admin || PLACEHOLDER_ADDRESS;
  field(fields, 'treasury', 'address').string = env.treasury || PLACEHOLDER_ADDRESS;
  if (field(fields, 'pending_administrator', 'option').prim !== 'None') throw new Error('Compiled storage must originate with no pending admin.');
  if (!Array.isArray(field(fields, 'sealed', 'big_map')) || field(fields, 'sealed', 'big_map').length) throw new Error('Compiled storage must originate with nothing sealed.');
  const uncapped = field(fields, 'uncapped', 'set');
  if (uncapped.length !== 1 || uncapped[0].int !== String(BOT_NOTE)) throw new Error('Only the Bot Note may be uncapped.');
  setEmptyKey(field(fields, 'metadata', 'big_map'), `${base}/contract.json`, '%metadata');
  const tokens = field(fields, 'token_metadata', 'big_map');
  const ids = tokens.map((entry) => Number(entry.args[0].int)).sort();
  if (JSON.stringify(ids) !== JSON.stringify(TOKEN_IDS)) throw new Error(`Compiled token IDs are ${ids}, expected ${TOKEN_IDS}.`);
  for (const entry of tokens) setEmptyKey(entry.args[1].args[1], `${base}/${entry.args[0].int}.json`, `token ${entry.args[0].int}`);
  return storage;
}

/**
 * Work left for Gate 1, given on-chain state { supply: {id: n}, sealed: {id: n} }.
 * Returns the mint batch and the seal list; both empty once Gate 1 is done.
 */
export function planGate1(state, env) {
  const mints = [];
  const seals = [];
  for (const [key, amount] of Object.entries(env.printRuns || {})) {
    const id = Number(key);
    const supply = state.supply[id] ?? 0;
    if (id in state.sealed) {
      if (state.sealed[id] !== amount) throw new Error(`Note ${id} is sealed at ${state.sealed[id]}, but its print run is ${amount}.`);
      continue;
    }
    if (supply > amount) throw new Error(`Note ${id} supply ${supply} already exceeds its print run ${amount}.`);
    if (supply < amount) mints.push({ to_: env.treasury, token_id: id, amount: amount - supply });
  }
  for (const id of env.seal || []) if (!(id in state.sealed)) seals.push(id);
  const bot = state.supply[BOT_NOTE] ?? 0;
  if (bot < env.botTestMint) mints.push({ to_: env.treasury, token_id: BOT_NOTE, amount: env.botTestMint - bot });
  return { mints, seals };
}

/** Gate 1 checks against TzKT-shaped state; returns failures (empty = pass). */
export function evaluateGate1(state, env) {
  const failures = [];
  for (const [key, amount] of Object.entries(env.printRuns || {})) {
    const id = Number(key);
    if ((state.supply[id] ?? 0) !== amount) failures.push(`note ${id}: supply ${state.supply[id] ?? 0}, expected ${amount}`);
    if ((state.treasury[id] ?? 0) + (state.claimed?.[id] ?? 0) !== amount) failures.push(`note ${id}: Treasury plus claimed is not the print run`);
  }
  for (const id of env.seal || []) if (!(id in state.sealed)) failures.push(`note ${id}: not sealed`);
  if ((state.supply[BOT_NOTE] ?? 0) < env.botTestMint) failures.push(`Bot Note: supply ${state.supply[BOT_NOTE] ?? 0}, expected at least ${env.botTestMint}`);
  return failures;
}

async function loadConfig() {
  return JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
}

async function loadBuild() {
  const [code, template] = await Promise.all([
    readFile(path.join(BUILD_DIR, 'step_001_cont_0_contract.json'), 'utf8').then(JSON.parse),
    readFile(path.join(BUILD_DIR, 'step_001_cont_0_storage.json'), 'utf8').then(JSON.parse),
  ]);
  return { code, template };
}

async function tzkt(network, route) {
  const response = await fetch(`${NETWORKS[network].indexer}/v1/${route}`);
  if (!response.ok) throw new Error(`TzKT ${route} failed (${response.status})`);
  return response.json();
}

/** On-chain state from TzKT: supply, sealed and Treasury balances per token. */
export async function readState(network, env) {
  const kt = env.contract;
  const [supplyKeys, sealedKeys, treasuryBalances] = await Promise.all([
    tzkt(network, `contracts/${kt}/bigmaps/supply/keys?active=true&limit=100`),
    tzkt(network, `contracts/${kt}/bigmaps/sealed/keys?active=true&limit=100`),
    tzkt(network, `tokens/balances?token.contract=${kt}&account=${env.treasury}&limit=100`),
  ]);
  const byKey = (rows) => Object.fromEntries(rows.map((row) => [Number(row.key), Number(row.value)]));
  return {
    supply: byKey(supplyKeys),
    sealed: byKey(sealedKeys),
    treasury: Object.fromEntries(treasuryBalances.map((row) => [Number(row.token.tokenId), Number(row.balance)])),
  };
}

async function adminToolkit(options, env) {
  const envName = SECRET_KEY_ENV[options.network];
  // Read from env only. Never log the key or the env value.
  const secretKey = process.env[envName];
  if (!secretKey) throw new Error(`${envName} is required for ${options.network} --execute; keys are read from env only.`);
  const signer = await InMemorySigner.fromSecretKey(secretKey);
  const address = await signer.publicKeyHash();
  if (address !== env.admin) throw new Error(`Signer ${address} is not the configured admin ${env.admin}.`);
  const tezos = new TezosToolkit(options.rpc || NETWORKS[options.network].rpc);
  tezos.setProvider({ signer });
  const balance = (await tezos.tz.getBalance(address)).toNumber();
  const { minBalance } = NETWORKS[options.network];
  if (balance < minBalance) throw new Error(`Admin ${address} holds ${(balance / 1e6).toFixed(6)} tez; needs at least ${minBalance / 1e6}.`);
  if (!(await tezos.rpc.getManagerKey(address))) {
    const reveal = await tezos.contract.reveal({ fee: 4_000 });
    await reveal.confirmation(1);
    console.log(`[reveal] confirmed ${reveal.hash}`);
  }
  return tezos;
}

async function originate(options, config) {
  const env = config[options.network];
  const { code, template } = await loadBuild();
  const storageType = storageTypeFromCode(code);
  const storage = prepareStorage(template, storageType, env);
  assertContractValid(code);
  assertDataValid(storage, storageType);
  const problems = configProblems(env, options.network);
  console.log(`Enjoy. Money origination · ${options.network}`);
  console.log(`Admin: ${env.admin ?? '(unset)'} · Treasury: ${env.treasury ?? '(unset)'}`);
  console.log(`Metadata: ${env.metadataBase ?? '(unset)'}/contract.json`);
  console.log(`Contract SHA-256: ${digest(code)}`);
  console.log(`Storage SHA-256: ${digest(storage)}`);
  if (env.contract) console.log(`Already recorded: ${env.contract}. Clear it in config.json to originate again.`);
  for (const problem of problems) console.log(`Blocked: ${problem}`);
  if (!options.execute) return console.log('Preparation complete. Nothing was originated.');
  if (problems.length) throw new Error('Fix the blocked items in contracts/enjoy-money/config.json first.');
  if (env.contract) throw new Error(`config.json already records ${env.contract} for ${options.network}.`);
  const tezos = await adminToolkit(options, env);
  const operation = await tezos.contract.originate({ code, init: storage });
  console.log(`[originate] broadcast ${operation.hash} · ${NETWORKS[options.network].explorer}/${operation.hash}`);
  const contract = await operation.contract();
  console.log(`[originate] confirmed ${contract.address} · ${NETWORKS[options.network].explorer}/${contract.address}`);
  config[options.network].contract = contract.address;
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Recorded ${contract.address} in contracts/enjoy-money/config.json. Commit it.`);
}

async function gate1(options, config) {
  const env = config[options.network];
  const problems = configProblems(env, options.network, { needContract: true });
  if (problems.length) {
    for (const problem of problems) console.log(`Blocked: ${problem}`);
    throw new Error('Gate 1 needs a complete config and an originated contract.');
  }
  const state = await readState(options.network, env);
  const { mints, seals } = planGate1(state, env);
  console.log(`Gate 1 plan · ${options.network} · ${env.contract}`);
  for (const mint of mints) console.log(`  mint ${mint.amount} of token ${mint.token_id} to Treasury`);
  for (const id of seals) console.log(`  seal token ${id}`);
  if (!mints.length && !seals.length) return console.log('Nothing left to do. Run status to check the gate.');
  if (!options.execute) return console.log('Preparation complete. Nothing was sent.');
  const tezos = await adminToolkit(options, env);
  const contract = await tezos.contract.at(env.contract);
  // Mint first, then seal, in one operation group, so a note is never sealed short of its run.
  let batch = tezos.contract.batch();
  if (mints.length) batch = batch.withContractCall(contract.methodsObject.mint(mints));
  for (const id of seals) batch = batch.withContractCall(contract.methodsObject.seal(id));
  const operation = await batch.send();
  console.log(`[gate1] broadcast ${operation.hash} · ${NETWORKS[options.network].explorer}/${operation.hash}`);
  await operation.confirmation(1);
  console.log('[gate1] confirmed. Run status once TzKT catches up.');
}

async function status(options, config) {
  const env = config[options.network];
  if (!KT1.test(env?.contract || '')) throw new Error(`No ${options.network} contract recorded in config.json.`);
  const state = await readState(options.network, env);
  console.log(`Enjoy. Money · ${options.network} · ${NETWORKS[options.network].explorer}/${env.contract}`);
  for (const id of TOKEN_IDS) {
    console.log(`  token ${id}: supply ${state.supply[id] ?? 0} · Treasury ${state.treasury[id] ?? 0} · ${id in state.sealed ? `sealed at ${state.sealed[id]}` : id === BOT_NOTE ? 'uncapped' : 'open'}`);
  }
  const failures = evaluateGate1(state, env);
  for (const failure of failures) console.log(`  FAIL ${failure}`);
  console.log(failures.length ? 'Gate 1 on-chain checks: not yet.' : 'Gate 1 on-chain checks: pass. Next, confirm the art on TzKT, Kukai and objkt.');
  if (failures.length) process.exitCode = 1;
}

function usage() {
  console.log(`Usage: node scripts/enjoy-money.mjs <originate|gate1|status> [options]\n\n` +
    `  --network shadownet|mainnet            default: shadownet (ghostnet is retired)\n` +
    `  --execute                              broadcast; omitted means preparation-only\n` +
    `  --confirm-mainnet I_UNDERSTAND_MAINNET  required with mainnet --execute\n` +
    `  --rpc URL                              override the network RPC\n\n` +
    `Config: contracts/enjoy-money/config.json. Keys: ${SECRET_KEY_ENV.shadownet} / ${SECRET_KEY_ENV.mainnet} (env only, never logged).`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();
  const config = await loadConfig();
  if (options.command === 'originate') return originate(options, config);
  if (options.command === 'gate1') return gate1(options, config);
  return status(options, config);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  main().catch((error) => {
    console.error(`[enjoy-money] ${error.message}`);
    process.exitCode = 1;
  });
}
