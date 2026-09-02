#!/usr/bin/env node

/**
 * Prepare and, only with --execute, originate the Kennel Club FA2.
 *
 * Mainnet uses Taquito's wallet operation API with Beacon/Kukai. Origination
 * is an operation request; Beacon's requestSignPayload is deliberately not
 * used (that method is only the raw-payload workaround for attestations).
 * Shadownet automation uses an env-only InMemorySigner and reveals it in a
 * separate operation before origination when necessary.
 */

import { createHash } from 'node:crypto';
import { execFile, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import { assertContractValid, assertDataValid } from '@taquito/michel-codec';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PINS_PATH = path.join(ROOT, 'contracts/kennel-club/pins.json');
const BUILD_DIR = 'contracts/build/kennel_club';
const CODE_FILE = `${BUILD_DIR}/step_003_cont_0_contract.json`;
const STORAGE_FILE = `${BUILD_DIR}/step_003_cont_0_storage.json`;
const CONTRACT_PR = 1008;
const CONTRACT_COMMIT = '5c6701d758127606cc19e6d1a562d1c31882d92c';
const MIKE_KUKAI = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
const NETWORKS = {
  shadownet: {
    rpc: 'https://shadownet.smartpy.io',
    fallbacks: ['https://rpc.tzkt.io/shadownet'],
    indexer: 'https://api.shadownet.tzkt.io',
    explorer: 'https://shadownet.tzkt.io',
  },
  mainnet: {
    rpc: 'https://mainnet.smartpy.io',
    fallbacks: ['https://tezos-rpc.mhoydich.workers.dev'],
    indexer: 'https://api.tzkt.io',
    explorer: 'https://tzkt.io',
  },
};

function parseArgs(argv) {
  const options = {
    network: 'shadownet',
    signer: null,
    edition: 'open',
    cap: 30,
    priceMutez: 1_000_000,
    treasury: MIKE_KUKAI,
    admin: MIKE_KUKAI,
    paused: true,
    execute: false,
    confirmMainnet: '',
    rpc: '',
    windowOverrides: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--network') options.network = argv[++i];
    else if (arg === '--signer') options.signer = argv[++i];
    else if (arg === '--edition') options.edition = argv[++i];
    else if (arg === '--cap') options.cap = Number(argv[++i]);
    else if (arg === '--price-mutez') options.priceMutez = Number(argv[++i]);
    else if (arg === '--treasury') options.treasury = argv[++i];
    else if (arg === '--admin') options.admin = argv[++i];
    else if (arg === '--rpc') options.rpc = argv[++i];
    else if (arg === '--window') options.windowOverrides.push(argv[++i]);
    else if (arg === '--unpaused') options.paused = false;
    else if (arg === '--execute') options.execute = true;
    else if (arg === '--confirm-mainnet') options.confirmMainnet = argv[++i];
    else if (arg === '--help') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['ghostnet', 'shadownet', 'mainnet'].includes(options.network)) {
    throw new Error('--network must be ghostnet, shadownet, or mainnet');
  }
  if (options.network === 'ghostnet') {
    throw new Error('Ghostnet is retired and must not receive new originations. Use --network shadownet.');
  }
  options.signer ||= options.network === 'mainnet' ? 'kukai' : 'inmemory';
  if (!['kukai', 'inmemory'].includes(options.signer)) throw new Error('--signer must be kukai or inmemory');
  if (options.signer === 'kukai' && options.network !== 'mainnet') {
    throw new Error('Kukai is mainnet-only. Use --network shadownet --signer inmemory for the smoke origination.');
  }
  if (options.signer === 'inmemory' && options.network !== 'shadownet') {
    throw new Error('InMemorySigner is restricted to Shadownet by this script. Mainnet must use Kukai.');
  }
  if (!['open', 'capped'].includes(options.edition)) throw new Error('--edition must be open or capped');
  if (!Number.isSafeInteger(options.cap) || options.cap < 1) throw new Error('--cap must be a positive integer');
  if (!Number.isSafeInteger(options.priceMutez) || options.priceMutez < 0) throw new Error('--price-mutez must be a nonnegative integer');
  for (const [label, address] of [['treasury', options.treasury], ['admin', options.admin]]) {
    if (!/^tz[123][1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) throw new Error(`Invalid --${label} address: ${address}`);
  }
  return options;
}

function usage() {
  console.log(`Usage: node scripts/kennel-club-originate.mjs [options]\n\n` +
    `  --network ghostnet|shadownet|mainnet  (ghostnet fails closed)\n` +
    `  --signer inmemory|kukai               (defaults by network)\n` +
    `  --edition open|capped                 (default: open)\n` +
    `  --cap N                               (default: 30; required by storage even in open mode)\n` +
    `  --price-mutez N                       (default: 1000000)\n` +
    `  --treasury tz...                      (default: Mike's active Kukai)\n` +
    `  --admin tz...                         (default: Mike's active Kukai)\n` +
    `  --window ID=OPEN,CLOSE                repeatable ISO override after LA calendar computation\n` +
    `  --unpaused                            originate open for minting (default is paused)\n` +
    `  --rpc URL                             override the network RPC\n` +
    `  --execute                             broadcast; omitted means preparation-only\n` +
    `  --confirm-mainnet I_UNDERSTAND_MAINNET required with mainnet --execute\n\n` +
    `Shadownet execution requires KENNEL_CLUB_TESTNET_SECRET_KEY in env.\n` +
    `Mainnet execution opens a local Beacon page; Mike confirms the Kukai operation there.`);
}

function readArtifact(relativePath) {
  const localPath = path.join(ROOT, relativePath);
  try {
    return { text: readFileSync(localPath, 'utf8'), source: relativePath };
  } catch {
    try {
      return {
        text: execFileSync('git', ['show', `${CONTRACT_COMMIT}:${relativePath}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 25 * 1024 * 1024 }),
        source: `PR #${CONTRACT_PR} @ ${CONTRACT_COMMIT.slice(0, 12)}`,
      };
    } catch {
      throw new Error(`Missing ${relativePath}. Fetch PR #${CONTRACT_PR} first: git fetch origin pull/${CONTRACT_PR}/head`);
    }
  }
}

function hex(value) {
  return Buffer.from(value, 'utf8').toString('hex');
}

function hashJson(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function isIpfsCid(value) {
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/.test(value || '');
}

function localMidnightUtc(year, month, day, timeZone = 'America/Los_Angeles') {
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
  const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const offset = representedAsUtc - guess;
  return new Date(guess - offset).toISOString().replace('.000Z', 'Z');
}

export function septemberWindows(overrides = []) {
  const windows = Array.from({ length: 30 }, (_, tokenId) => {
    const day = tokenId + 1;
    const closeYear = 2026;
    const closeMonth = day === 30 ? 10 : 9;
    const closeDay = day === 30 ? 1 : day + 1;
    return {
      tokenId,
      open: localMidnightUtc(2026, 9, day),
      close: localMidnightUtc(closeYear, closeMonth, closeDay),
    };
  });
  for (const raw of overrides) {
    const match = /^(\d+)=(.+),(.+)$/.exec(raw);
    if (!match) throw new Error(`Invalid --window ${raw}; expected ID=OPEN,CLOSE`);
    const tokenId = Number(match[1]);
    if (!Number.isInteger(tokenId) || tokenId < 0 || tokenId > 29) throw new Error(`Window token ID out of range: ${tokenId}`);
    const open = new Date(match[2]);
    const close = new Date(match[3]);
    if (!Number.isFinite(open.valueOf()) || !Number.isFinite(close.valueOf()) || open >= close) {
      throw new Error(`Invalid window timestamps: ${raw}`);
    }
    windows[tokenId] = { tokenId, open: open.toISOString().replace('.000Z', 'Z'), close: close.toISOString().replace('.000Z', 'Z') };
  }
  return windows;
}

export function storageTypeFromCode(code) {
  const storageDeclaration = code.find((instruction) => instruction?.prim === 'storage');
  if (!storageDeclaration?.args?.[0]) {
    throw new Error('Compiled Michelson has no storage declaration.');
  }
  return storageDeclaration.args[0];
}

function annotatedStorageFields(storageType, storage) {
  const fields = new Map();
  function walk(type, value, path = 'storage') {
    const annotation = type?.annots?.find((item) => item.startsWith('%'))?.slice(1);
    if (annotation) {
      if (fields.has(annotation)) throw new Error(`Duplicate compiled storage annotation %${annotation}.`);
      fields.set(annotation, { type, value, path });
    }
    if (type?.prim !== 'pair') return;
    if (value?.prim !== 'Pair' || type.args?.length !== 2 || value.args?.length !== 2) {
      throw new Error(`Compiled storage does not match its Michelson pair type at ${path}.`);
    }
    walk(type.args[0], value.args[0], `${path}.0`);
    walk(type.args[1], value.args[1], `${path}.1`);
  }
  walk(storageType, storage);
  return fields;
}

function requireField(fields, name, expectedPrim) {
  const field = fields.get(name);
  if (!field) throw new Error(`Compiled storage is missing annotated field %${name}.`);
  if (field.type.prim !== expectedPrim) {
    throw new Error(`Compiled storage field %${name} is ${field.type.prim}, expected ${expectedPrim}.`);
  }
  return field;
}

function sortedBigMapEntries(field, expectedCount) {
  if (!Array.isArray(field.value)) throw new Error(`Compiled %${field.type.annots?.[0]?.slice(1)} is not an inline big_map.`);
  const entries = [...field.value].sort((a, b) => Number(a?.args?.[0]?.int) - Number(b?.args?.[0]?.int));
  const ids = entries.map((entry) => Number(entry?.args?.[0]?.int));
  const expected = Array.from({ length: expectedCount }, (_, id) => id);
  if (JSON.stringify(ids) !== JSON.stringify(expected)) {
    throw new Error(`Compiled %${field.type.annots?.[0]?.slice(1)} token IDs are ${JSON.stringify(ids)}, expected 0-${expectedCount - 1}.`);
  }
  return entries;
}

export function prepareStorage(template, storageType, pins, options) {
  const storage = structuredClone(template);
  const fields = annotatedStorageFields(storageType, storage);
  requireField(fields, 'administrator', 'address').value.string = options.admin;
  requireField(fields, 'edition_cap', 'nat').value.int = String(options.cap);
  requireField(fields, 'edition_mode', 'string').value.string = options.edition;
  requireField(fields, 'paused', 'bool').value.prim = options.paused ? 'True' : 'False';
  requireField(fields, 'price_mutez', 'mutez').value.int = String(options.priceMutez);
  requireField(fields, 'treasury', 'address').value.string = options.treasury;

  const completePins = Boolean(
    pins?.treasury === options.treasury &&
    isIpfsCid(pins?.contract?.cid) &&
    Array.from({ length: 30 }, (_, id) => {
      const key = String(id);
      return isIpfsCid(pins.images?.[key]?.png?.cid) &&
        isIpfsCid(pins.images?.[key]?.webp?.cid) &&
        isIpfsCid(pins.tokens?.[key]?.cid);
    }).every(Boolean),
  );
  const contractCid = pins?.contract?.cid || '__KENNEL_CLUB_CONTRACT_METADATA_CID__';
  const contractMetadata = requireField(fields, 'metadata', 'big_map').value;
  if (contractMetadata?.length !== 1 || contractMetadata[0]?.prim !== 'Elt' || contractMetadata[0]?.args?.[0]?.string !== '') {
    throw new Error('Compiled %metadata must contain exactly the TZIP-16 empty-key pointer.');
  }
  contractMetadata[0].args[1].bytes = hex(`ipfs://${contractCid}`);

  const tokenMetadataField = requireField(fields, 'token_metadata', 'big_map');
  const tokenMetadata = sortedBigMapEntries(tokenMetadataField, 30);
  for (const entry of tokenMetadata) {
    const tokenId = Number(entry.args[0].int);
    const cid = pins?.tokens?.[String(tokenId)]?.cid || `__KENNEL_CLUB_${String(tokenId).padStart(2, '0')}_TOKEN_METADATA_CID__`;
    if (entry?.args?.[1]?.prim !== 'Pair' || !Array.isArray(entry.args[1]?.args?.[1])) {
      throw new Error(`Compiled %token_metadata record ${tokenId} has an unexpected shape.`);
    }
    entry.args[1].args[1] = [{ prim: 'Elt', args: [{ string: '' }, { bytes: hex(`ipfs://${cid}`) }] }];
  }

  const windows = septemberWindows(options.windowOverrides);
  const windowsField = requireField(fields, 'windows', 'big_map');
  const windowStorage = sortedBigMapEntries(windowsField, 30);
  const windowValueType = windowsField.type.args?.[1];
  for (const entry of windowStorage) {
    const window = windows[Number(entry.args[0].int)];
    const windowFields = annotatedStorageFields(windowValueType, entry.args[1]);
    requireField(windowFields, 'close_at', 'timestamp').value.string = window.close;
    requireField(windowFields, 'open_at', 'timestamp').value.string = window.open;
  }

  return { storage, windows, completePins };
}

async function loadPins() {
  try { return JSON.parse(await readFile(PINS_PATH, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function rpcLevel(rpc) {
  const response = await fetch(`${rpc.replace(/\/$/, '')}/chains/main/blocks/head/header`);
  if (!response.ok) throw new Error(`RPC head failed (${response.status})`);
  return Number((await response.json()).level);
}

async function indexerLevel(indexer) {
  const response = await fetch(`${indexer}/v1/head`);
  if (!response.ok) throw new Error(`TzKT head failed (${response.status})`);
  return Number((await response.json()).level);
}

async function selectHealthyRpc(network, requested) {
  const config = NETWORKS[network];
  const indexLevel = await indexerLevel(config.indexer);
  const candidates = [requested || config.rpc, ...config.fallbacks].filter((value, index, all) => value && all.indexOf(value) === index);
  const failures = [];
  for (const rpc of candidates) {
    try {
      const level = await rpcLevel(rpc);
      const lag = indexLevel - level;
      console.log(`[rpc] ${rpc} level ${level}; TzKT ${indexLevel}; lag ${lag}`);
      if (Math.abs(lag) <= 5) return rpc;
      failures.push(`${rpc} is ${lag} levels behind TzKT`);
    } catch (error) { failures.push(`${rpc}: ${error.message}`); }
  }
  throw new Error(`No synchronized ${network} RPC found: ${failures.join('; ')}`);
}

async function originateWithSigner({ code, storage, options }) {
  const secretKey = process.env.KENNEL_CLUB_TESTNET_SECRET_KEY;
  if (!secretKey) throw new Error('KENNEL_CLUB_TESTNET_SECRET_KEY is required for Shadownet execution; keys are read from env only.');
  const rpc = await selectHealthyRpc('shadownet', options.rpc);
  const signer = await InMemorySigner.fromSecretKey(secretKey);
  const address = await signer.publicKeyHash();
  const tezos = new TezosToolkit(rpc);
  tezos.setProvider({ signer });
  const balance = await tezos.tz.getBalance(address);
  if (balance.toNumber() < 2_000_000) {
    throw new Error(`Testnet signer ${address} has less than 2 tez. Fund it with: npx @tacoinfra/get-tez ${address} --amount 100 --network shadownet`);
  }
  const managerKey = await tezos.rpc.getManagerKey(address);
  if (!managerKey) {
    console.log('[reveal] sending the key reveal as its own operation');
    const reveal = await tezos.contract.reveal({ fee: 4_000 });
    await reveal.confirmation(1);
    console.log(`[reveal] confirmed ${reveal.hash}`);
  }
  const operation = await tezos.contract.originate({ code, init: storage });
  console.log(`[originate] broadcast ${operation.hash}`);
  console.log(`[originate] ${NETWORKS.shadownet.explorer}/${operation.hash}`);
  const contract = await operation.contract();
  console.log(`[originate] confirmed ${contract.address}`);
  return contract.address;
}

export function browserClientSource(payload) {
  return `
import { TezosToolkit } from '@taquito/taquito';
import { BeaconWallet } from '@taquito/beacon-wallet';
const payload = ${JSON.stringify(payload).replaceAll('<', '\\u003c')};
const status = document.querySelector('#status');
const button = document.querySelector('#sign');
button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    status.textContent = 'Connecting to Beacon. Choose Kukai; the wallet list can take 2–4 seconds to appear…';
    const wallet = new BeaconWallet({
      name: 'PointCast · Kennel Club Origination',
      network: { type: 'mainnet', rpcUrl: payload.rpc },
      preferredNetwork: 'mainnet',
      enableMetrics: false,
    });
    wallet.client.sendMetrics = () => {};
    const tezos = new TezosToolkit(payload.rpc);
    tezos.setWalletProvider(wallet);
    const active = await wallet.client.getActiveAccount();
    if (!active || active.network?.type !== 'mainnet' || active.address !== payload.admin) {
      if (active) await wallet.clearActiveAccount();
      await wallet.requestPermissions();
    }
    const account = await wallet.client.getActiveAccount();
    if (!account || account.address !== payload.admin) throw new Error('Connected wallet ' + (account?.address || 'unknown') + ' does not match configured admin ' + payload.admin);
    status.textContent = 'Confirm the ORIGINATION operation in Kukai…';
    // Do not use requestSignPayload here: origination is a wallet operation.
    const operation = await tezos.wallet.originate({ code: payload.code, init: payload.storage }).send();
    status.textContent = 'Broadcast ' + operation.opHash + '. Waiting for confirmation…';
    const contract = await operation.contract();
    status.textContent = 'Confirmed: ' + contract.address;
    await fetch('/__kennel_result', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: contract.address, opHash: operation.opHash }) });
  } catch (error) {
    status.textContent = 'Stopped: ' + (error?.message || error);
    button.disabled = false;
  }
});`;
}

async function originateWithKukai({ code, storage, options, rpc }) {
  const { createServer } = await import('vite');
  const { nodePolyfills } = await import('vite-plugin-node-polyfills');
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'kennel-club-originate-'));
  const payload = { code, storage, rpc, admin: options.admin };
  await writeFile(path.join(tempDir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Kennel Club origination</title><style>body{font:16px ui-monospace,monospace;max-width:760px;margin:64px auto;padding:24px;background:#f2efe9;color:#171717}button{font:inherit;padding:14px 18px;border:2px solid;background:#fff;box-shadow:4px 4px #171717}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>Kennel Club · mainnet origination</h1><p>Admin: ${options.admin}</p><p>Treasury: ${options.treasury}</p><p>Edition: ${options.edition}; price: ${options.priceMutez} mutez; paused: ${options.paused}</p><p>Contract SHA-256: ${hashJson(code)}</p><p>Storage SHA-256: ${hashJson(storage)}</p><button id="sign">Connect Kukai and sign origination</button><pre id="status">Nothing has been sent.</pre><script type="module" src="/client.mjs"></script>`);
  await writeFile(path.join(tempDir, 'client.mjs'), browserClientSource(payload));
  await symlink(path.join(ROOT, 'node_modules'), path.join(tempDir, 'node_modules'), 'dir');
  let settle;
  const result = new Promise((resolve) => { settle = resolve; });
  const server = await createServer({
    root: tempDir,
    server: { host: '127.0.0.1', port: 0, strictPort: false },
    resolve: { preserveSymlinks: true },
    optimizeDeps: { include: ['@taquito/taquito', '@taquito/beacon-wallet'] },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.browser': 'true',
      'process.version': JSON.stringify('v22.0.0'),
    },
    plugins: [nodePolyfills({
      include: ['buffer', 'process', 'util', 'stream', 'events'],
      globals: { Buffer: true, global: true, process: true },
      protocolImports: false,
    }), {
      name: 'kennel-club-result',
      configureServer(viteServer) {
        viteServer.middlewares.use('/__kennel_result', (request, response) => {
          let body = '';
          request.on('data', (chunk) => { body += chunk; });
          request.on('end', () => { response.statusCode = 204; response.end(); settle(JSON.parse(body)); });
        });
      },
    }],
  });
  try {
    await server.listen();
    const address = server.resolvedUrls.local[0];
    console.log(`[kukai] local signing page: ${address}`);
    await execFileAsync('open', [address]);
    const signed = await result;
    console.log(`[originate] broadcast ${signed.opHash}`);
    console.log(`[originate] confirmed ${signed.address}`);
    console.log(`[originate] ${NETWORKS.mainnet.explorer}/${signed.address}`);
    return signed.address;
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();
  const codeArtifact = readArtifact(CODE_FILE);
  const storageArtifact = readArtifact(STORAGE_FILE);
  const code = JSON.parse(codeArtifact.text);
  const template = JSON.parse(storageArtifact.text);
  const pins = await loadPins();
  const storageType = storageTypeFromCode(code);
  const prepared = prepareStorage(template, storageType, pins, options);
  assertContractValid(code);
  assertDataValid(prepared.storage, storageType);
  console.log(`Contract source: ${codeArtifact.source}`);
  console.log(`Storage source: ${storageArtifact.source}`);
  console.log(`Contract SHA-256: ${hashJson(code)}`);
  console.log(`Prepared storage SHA-256: ${hashJson(prepared.storage)}`);
  console.log(`Network: ${options.network}; signer: ${options.signer}; edition: ${options.edition}; cap: ${options.cap}; price: ${options.priceMutez} mutez; paused: ${options.paused}`);
  console.log(`Admin: ${options.admin}; treasury: ${options.treasury}`);
  console.log(`Windows: ${prepared.windows[0].open} through ${prepared.windows[29].close} (America/Los_Angeles calendar)`);
  if (!prepared.completePins) console.log('Metadata pins: incomplete or creator/treasury mismatch; preparation uses visible placeholders. Execution is blocked.');
  if (!options.execute) return console.log('Preparation complete. Nothing was originated; add --execute only during the signing session.');
  if (!prepared.completePins) throw new Error('Pinning is incomplete. Run scripts/kennel-club-pin.mjs and verify all 91 CIDs before origination.');
  if (options.network === 'mainnet' && options.confirmMainnet !== 'I_UNDERSTAND_MAINNET') {
    throw new Error('Mainnet execution requires --confirm-mainnet I_UNDERSTAND_MAINNET.');
  }
  if (options.signer === 'inmemory') return originateWithSigner({ code, storage: prepared.storage, options });
  const rpc = await selectHealthyRpc('mainnet', options.rpc);
  return originateWithKukai({ code, storage: prepared.storage, options, rpc });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (fileURLToPath(import.meta.url) === invokedPath) {
  main().catch((error) => {
    console.error(`[kennel-club-originate] ${error.message}`);
    process.exitCode = 1;
  });
}
