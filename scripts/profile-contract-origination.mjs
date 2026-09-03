import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';
import { assertContractValid, assertDataValid } from '@taquito/michel-codec';

export const DEFAULT_PROFILE_ADMIN = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
export const PROFILE_MAINNET_RPC = 'https://mainnet.smartpy.io';
export const PROFILE_MAINNET_SECRET_ENV = 'PROFILE_MAINNET_SECRET_KEY';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function parseOriginationArgs(argv) {
  const options = {
    admin: DEFAULT_PROFILE_ADMIN,
    rpc: PROFILE_MAINNET_RPC,
    execute: false,
    confirmMainnet: '',
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--execute') options.execute = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--admin') options.admin = argv[++index];
    else if (arg === '--rpc') options.rpc = argv[++index];
    else if (arg === '--confirm-mainnet') options.confirmMainnet = argv[++index];
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!/^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/.test(options.admin || '')) {
    throw new Error(`Invalid --admin address: ${options.admin || '(missing)'}`);
  }
  return options;
}

function storageTypeFromCode(code) {
  const declaration = code.find((instruction) => instruction?.prim === 'storage');
  if (!declaration?.args?.[0]) throw new Error('Compiled Michelson has no storage declaration.');
  return declaration.args[0];
}

function annotatedStorageFields(storageType, storage) {
  const fields = new Map();
  function walk(type, value, location = 'storage') {
    const annotation = type?.annots?.find((item) => item.startsWith('%'))?.slice(1);
    if (annotation) fields.set(annotation, { type, value, location });
    if (type?.prim !== 'pair') return;
    if (value?.prim !== 'Pair' || type.args?.length !== 2 || value.args?.length !== 2) {
      throw new Error(`Compiled storage does not match its Michelson type at ${location}.`);
    }
    walk(type.args[0], value.args[0], `${location}.0`);
    walk(type.args[1], value.args[1], `${location}.1`);
  }
  walk(storageType, storage);
  return fields;
}

function requireField(fields, name, prim) {
  const field = fields.get(name);
  if (!field) throw new Error(`Compiled storage is missing %${name}.`);
  if (field.type.prim !== prim) throw new Error(`Compiled %${name} is ${field.type.prim}, expected ${prim}.`);
  return field;
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export async function prepareProfileOrigination({ label, buildDirectory, argv = process.argv.slice(2), environment = process.env, validateStorage }) {
  const options = parseOriginationArgs(argv);
  if (options.help) return { help: true, options };

  const codePath = path.join(ROOT, 'contracts', 'build', buildDirectory, 'step_003_cont_0_contract.json');
  const storagePath = path.join(ROOT, 'contracts', 'build', buildDirectory, 'step_003_cont_0_storage.json');
  const [code, storage] = await Promise.all([
    readFile(codePath, 'utf8').then(JSON.parse),
    readFile(storagePath, 'utf8').then(JSON.parse),
  ]);
  const storageType = storageTypeFromCode(code);
  const fields = annotatedStorageFields(storageType, storage);
  requireField(fields, 'administrator', 'address').value.string = options.admin;
  if (requireField(fields, 'paused', 'bool').value.prim !== 'True') {
    throw new Error(`${label} compiled storage must originate paused.`);
  }
  assertContractValid(code);
  assertDataValid(storage, storageType);
  // Run caller-supplied storage validation (e.g. seeded-issuer checks) before any
  // preparation output or mainnet broadcast, so a failure here always precedes
  // origination — it must never fire only after the contract is already live.
  if (typeof validateStorage === 'function') validateStorage(storage);

  const prepared = {
    label,
    network: 'mainnet',
    signer: 'inmemory',
    admin: options.admin,
    rpc: options.rpc,
    paused: true,
    codeSha256: digest(code),
    storageSha256: digest(storage),
  };
  if (!options.execute) return { prepared, code, storage, options, executed: false };
  if (options.confirmMainnet !== 'I_UNDERSTAND_MAINNET') {
    throw new Error('Mainnet execution requires --confirm-mainnet I_UNDERSTAND_MAINNET.');
  }
  const secretKey = environment[PROFILE_MAINNET_SECRET_ENV];
  if (!secretKey) {
    throw new Error(`${PROFILE_MAINNET_SECRET_ENV} is required for mainnet execution; the key is read from env only.`);
  }

  const signer = await InMemorySigner.fromSecretKey(secretKey);
  const signerAddress = await signer.publicKeyHash();
  const tezos = new TezosToolkit(options.rpc);
  tezos.setProvider({ signer });
  const balance = await tezos.tz.getBalance(signerAddress);
  if (balance.toNumber() < 3_000_000) {
    throw new Error(`Mainnet signer ${signerAddress} needs at least 3 tez before origination.`);
  }
  const managerKey = await tezos.rpc.getManagerKey(signerAddress);
  if (!managerKey) {
    const reveal = await tezos.contract.reveal({ fee: 4_000 });
    await reveal.confirmation(1);
  }
  const operation = await tezos.contract.originate({ code, init: storage });
  const contract = await operation.contract();
  return {
    prepared,
    executed: true,
    operationHash: operation.hash,
    contractAddress: contract.address,
  };
}

export function printOriginationUsage(scriptName, label) {
  console.log(`Usage: node scripts/${scriptName} [options]\n\n` +
    `Prepare ${label} mainnet origination from the checked-in paused artifacts.\n\n` +
    `  --admin tz...                         default: ${DEFAULT_PROFILE_ADMIN}\n` +
    `  --rpc URL                             default: ${PROFILE_MAINNET_RPC}\n` +
    `  --execute                             broadcast; omitted is preparation-only\n` +
    `  --confirm-mainnet I_UNDERSTAND_MAINNET required with --execute\n\n` +
    `Execution uses an in-memory signer from ${PROFILE_MAINNET_SECRET_ENV}. The key is never logged.`);
}

export function printPreparation(result) {
  if (result.help) return;
  const { prepared } = result;
  console.log(`${prepared.label} origination preparation`);
  console.log(`Network: ${prepared.network}; signer: ${prepared.signer}; paused: ${prepared.paused}`);
  console.log(`Admin: ${prepared.admin}`);
  console.log(`RPC: ${prepared.rpc}`);
  console.log(`Contract SHA-256: ${prepared.codeSha256}`);
  console.log(`Storage SHA-256: ${prepared.storageSha256}`);
  if (!result.executed) console.log('Preparation complete. Nothing was originated.');
  else {
    console.log(`Broadcast: ${result.operationHash}`);
    console.log(`Confirmed: ${result.contractAddress}`);
    console.log(`Explorer: https://tzkt.io/${result.contractAddress}`);
  }
}
