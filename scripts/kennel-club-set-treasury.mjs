#!/usr/bin/env node

/**
 * Prepare or sign Kennel Club set_treasury(projectMultisig) on mainnet.
 *
 * Preparation is read-only. Execution opens a temporary local Beacon page and
 * requires Mike's exact Kukai account plus an explicit mainnet acknowledgement.
 */

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { validateContractAddress, ValidationResult } from '@taquito/utils';
import {
  CC_WALLET,
  MIKE_KUKAI,
  PROJECT_OWNERS,
  selectHealthyMainnetRpc,
  tzSafeUrl,
  TZSAFE_CODE_HASH,
  TZSAFE_TYPE_HASH,
} from './project-multisig-originate.mjs';

export const KENNEL_CLUB = 'KT1JWNAKyiWVsbfNrHBQuuBDaGRBYqfehwdq';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRACTS_PATH = path.join(ROOT, 'src/data/contracts.json');
const TZKT = 'https://api.tzkt.io';
const EXPLORER = 'https://tzkt.io';
const execFileAsync = promisify(execFile);

function usage() {
  console.log(`Usage: node scripts/kennel-club-set-treasury.mjs [options]\n\n` +
    `  --multisig KT1...                     defaults to contracts.json project_multisig.mainnet\n` +
    `  --rpc URL                             try this mainnet RPC first\n` +
    `  --execute                             open the Beacon/Kukai signing page\n` +
    `  --confirm-mainnet I_UNDERSTAND_MAINNET required with --execute\n\n` +
    `Preparation and verification are read-only. No operation is requested without --execute.`);
}

async function registryMultisig() {
  const contracts = JSON.parse(await readFile(CONTRACTS_PATH, 'utf8'));
  return contracts.project_multisig?.mainnet || '';
}

export function parseArgs(argv, defaultMultisig = '') {
  const options = { multisig: defaultMultisig, rpc: '', execute: false, confirmMainnet: '', help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--multisig') options.multisig = argv[++i];
    else if (arg === '--rpc') options.rpc = argv[++i];
    else if (arg === '--execute') options.execute = true;
    else if (arg === '--confirm-mainnet') options.confirmMainnet = argv[++i];
    else if (arg === '--help') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.help && validateContractAddress(options.multisig) !== ValidationResult.VALID) {
    throw new Error('Provide the originated project safe with --multisig KT1..., or populate project_multisig.mainnet in contracts.json.');
  }
  if (options.rpc && !/^https:\/\//.test(options.rpc)) throw new Error('--rpc must be an https URL.');
  if (options.execute && options.confirmMainnet !== 'I_UNDERSTAND_MAINNET') {
    throw new Error('Mainnet execution requires --confirm-mainnet I_UNDERSTAND_MAINNET.');
  }
  return options;
}

async function fetchJson(url, label) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${label} failed (${response.status})`);
  return response.json();
}

function sorted(values) {
  return [...values].sort();
}

async function verifyCutover({ rpc, multisig }) {
  const base = `${rpc}/chains/main/blocks/head/context/contracts/${KENNEL_CLUB}`;
  const [entrypoints, kennelStorage, safeInfo, safeStorage] = await Promise.all([
    fetchJson(`${base}/entrypoints`, 'Kennel Club entrypoints'),
    fetchJson(`${TZKT}/v1/contracts/${KENNEL_CLUB}/storage`, 'Kennel Club storage'),
    fetchJson(`${TZKT}/v1/contracts/${multisig}`, 'Project safe fingerprint'),
    fetchJson(`${TZKT}/v1/contracts/${multisig}/storage`, 'Project safe storage'),
  ]);
  if (JSON.stringify(entrypoints.entrypoints?.set_treasury) !== JSON.stringify({ prim: 'address' })) {
    throw new Error('Kennel Club does not expose the reviewed set_treasury(address) entrypoint.');
  }
  if (kennelStorage.administrator !== MIKE_KUKAI) {
    throw new Error(`Kennel Club administrator is ${kennelStorage.administrator}; expected Mike Kukai ${MIKE_KUKAI}.`);
  }
  if (Number(safeInfo.typeHash) !== TZSAFE_TYPE_HASH || Number(safeInfo.codeHash) !== TZSAFE_CODE_HASH) {
    throw new Error(`Destination ${multisig} is not the reviewed TzSafe v0.3.4 contract.`);
  }
  if (JSON.stringify(sorted(safeStorage.owners || [])) !== JSON.stringify(sorted(PROJECT_OWNERS))) {
    throw new Error(`Destination owners must be exactly ${MIKE_KUKAI} and ${CC_WALLET}.`);
  }
  if (!['1', '2'].includes(String(safeStorage.threshold))) throw new Error('Destination threshold must be 1 or 2.');
  return { currentTreasury: kennelStorage.treasury, threshold: String(safeStorage.threshold) };
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
      name: 'PointCast · Kennel Club Treasury Cutover',
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
    if (!account || account.address !== payload.admin) throw new Error('Connected wallet ' + (account?.address || 'unknown') + ' does not match required admin ' + payload.admin);
    status.textContent = 'Confirm set_treasury(' + payload.multisig + ') in Kukai…';
    const contract = await tezos.wallet.at(payload.contract);
    const operation = await contract.methodsObject.set_treasury(payload.multisig).send();
    status.textContent = 'Broadcast ' + operation.opHash + '. Waiting for confirmation…';
    await operation.confirmation(1);
    status.textContent = 'Confirmed: treasury is now ' + payload.multisig;
    await fetch('/__treasury_result', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ opHash: operation.opHash }) });
  } catch (error) {
    status.textContent = 'Stopped: ' + (error?.message || error);
    button.disabled = false;
  }
});`;
}

async function signWithKukai({ options, rpc, currentTreasury, threshold }) {
  const { createServer } = await import('vite');
  const { nodePolyfills } = await import('vite-plugin-node-polyfills');
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'kennel-club-treasury-'));
  const payload = { rpc, contract: KENNEL_CLUB, admin: MIKE_KUKAI, multisig: options.multisig };
  await writeFile(path.join(tempDir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Kennel Club treasury cutover</title><style>body{font:16px ui-monospace,monospace;max-width:760px;margin:64px auto;padding:24px;background:#f2efe9;color:#171717}button{font:inherit;padding:14px 18px;border:2px solid;background:#fff;box-shadow:4px 4px #171717}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>Kennel Club · mainnet treasury cutover</h1><p>Contract: ${KENNEL_CLUB}</p><p>Current treasury: ${currentTreasury}</p><p>New treasury: ${options.multisig}</p><p>Verified TzSafe: ${threshold}-of-2 · Mike + cc</p><p>Signer required: ${MIKE_KUKAI}</p><button id="sign">Connect Kukai and sign set_treasury</button><pre id="status">Nothing has been sent.</pre><script type="module" src="/client.mjs"></script>`);
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
      name: 'kennel-club-treasury-result',
      configureServer(viteServer) {
        viteServer.middlewares.use('/__treasury_result', (request, response) => {
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
    console.log(`[set_treasury] confirmed ${signed.opHash}`);
    console.log(`[set_treasury] ${EXPLORER}/${signed.opHash}`);
    return signed.opHash;
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help')) return usage();
  const options = parseArgs(argv, await registryMultisig());
  const rpc = await selectHealthyMainnetRpc(options.rpc);
  const verified = await verifyCutover({ rpc, multisig: options.multisig });
  console.log(`Contract: ${KENNEL_CLUB}`);
  console.log('Entrypoint: set_treasury(address)');
  console.log(`Required signer: ${MIKE_KUKAI} (administrator)`);
  console.log(`Current treasury: ${verified.currentTreasury}`);
  console.log(`New treasury: ${options.multisig}`);
  console.log(`Destination: TzSafe v0.3.4 · ${verified.threshold}-of-2 · ${tzSafeUrl(options.multisig)}`);
  if (verified.currentTreasury === options.multisig) return console.log('No operation needed: Kennel Club already points at this project safe.');
  if (!options.execute) return console.log('Preparation complete. Nothing was sent. Add --execute --confirm-mainnet I_UNDERSTAND_MAINNET only for Mike\'s approved Kukai signing session.');
  return signWithKukai({ options, rpc, ...verified });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (fileURLToPath(import.meta.url) === invokedPath) {
  main().catch((error) => {
    console.error(`[kennel-club-set-treasury] ${error.message}`);
    process.exitCode = 1;
  });
}
