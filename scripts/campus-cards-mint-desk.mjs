#!/usr/bin/env node
/**
 * Campus Cards mint desk: metadata → pins → origination, in three verbs.
 *
 *   node scripts/campus-cards-mint-desk.mjs metadata
 *       Write TZIP-16 contract metadata + TZIP-21 token metadata to
 *       contracts/campus-cards/metadata/ (image URIs come from pins.json
 *       when present, placeholders otherwise). No network.
 *
 *   PINATA_JWT=... node scripts/campus-cards-mint-desk.mjs pin
 *       Pin every card SVG + PNG, then each token JSON and the contract
 *       JSON, recording CIDs in contracts/campus-cards/pins.json. Resumable:
 *       entries already in pins.json are skipped.
 *
 *   node scripts/campus-cards-mint-desk.mjs originate [--execute --confirm-mainnet I_UNDERSTAND_MAINNET]
 *       Prepare storage from the compiled artifact (admin/treasury = Mike's
 *       Kukai, paused, token_metadata pointed at the pinned JSON). Without
 *       --execute it only validates and prints hashes. With --execute it
 *       opens a local Beacon page; Mike connects Kukai and signs there.
 *       Agents never sign this.
 *
 * Series data: src/data/campus-cards.json. Contract: contracts/v2/campus_cards_fa2.py.
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import * as mint from '../src/lib/campus-cards-mint.mjs';

const execFileAsync = promisify(execFile);
const { CID } = mint;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERIES = JSON.parse(readFileSync(path.join(ROOT, 'src/data/campus-cards.json'), 'utf8'));
const OUT = path.join(ROOT, 'contracts/campus-cards');
const META = path.join(OUT, 'metadata');
const PINS = path.join(OUT, 'pins.json');
const BUILD = path.join(ROOT, 'contracts/build/campus_cards');
const MIKE_KUKAI = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
const RPC = 'https://mainnet.smartpy.io';

export const cards = () => mint.cards(SERIES);
export const tokenMetadata = (card, pins) => mint.tokenMetadata(SERIES, card, pins);
export const contractMetadata = () => mint.contractMetadata(SERIES);
export const prepareStorage = (code, template, pins, opts) => mint.prepareStorage(SERIES, code, template, pins, opts);
const sha = (v) => createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex');

function loadPins() {
  return existsSync(PINS) ? JSON.parse(readFileSync(PINS, 'utf8')) : { version: 1, series: SERIES.series, images: {}, tokens: {}, contract: null };
}

function writeMetadata() {
  mkdirSync(META, { recursive: true });
  const pins = loadPins();
  writeFileSync(path.join(META, 'contract.json'), `${JSON.stringify(contractMetadata(), null, 2)}\n`);
  for (const card of cards()) writeFileSync(path.join(META, `${card.tokenId}.json`), `${JSON.stringify(tokenMetadata(card, pins), null, 2)}\n`);
  console.log(`[metadata] wrote contract.json + ${cards().length} token files to ${path.relative(ROOT, META)}`);
}

async function pinFile(file, mimeType, name) {
  if (!process.env.PINATA_JWT) throw new Error('PINATA_JWT is required to pin. It is read from env only and never logged.');
  const bytes = readFileSync(path.join(ROOT, file));
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mimeType }), path.basename(file));
  form.append('pinataMetadata', JSON.stringify({ name }));
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', { method: 'POST', headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` }, body: form });
  const body = await res.text();
  if (!res.ok) throw new Error(`Pinata rejected ${name} (${res.status}): ${body.slice(0, 300)}`);
  const cid = JSON.parse(body).IpfsHash;
  if (!CID.test(cid || '')) throw new Error(`Pinata returned an invalid CID for ${name}`);
  return { cid, path: file, mimeType, bytes: bytes.length, pinnedAt: new Date().toISOString() };
}

async function pin() {
  const pins = loadPins();
  const save = () => writeFileSync(PINS, `${JSON.stringify(pins, null, 2)}\n`);
  mkdirSync(OUT, { recursive: true });
  for (const card of cards()) {
    pins.images[card.tokenId] ??= {};
    for (const [kind, mime] of [['svg', 'image/svg+xml'], ['png', 'image/png']]) {
      if (pins.images[card.tokenId][kind]?.cid) continue;
      pins.images[card.tokenId][kind] = await pinFile(card[kind], mime, `campus-cards-${card.base}.${kind}`);
      save();
      console.log(`[pin] ${card.base}.${kind} -> ${pins.images[card.tokenId][kind].cid}`);
    }
  }
  writeMetadata();
  for (const card of cards()) {
    if (pins.tokens[card.tokenId]?.cid) continue;
    pins.tokens[card.tokenId] = await pinFile(`contracts/campus-cards/metadata/${card.tokenId}.json`, 'application/json', `campus-cards-token-${card.tokenId}.json`);
    save();
    console.log(`[pin] token ${card.tokenId} -> ${pins.tokens[card.tokenId].cid}`);
  }
  if (!pins.contract?.cid) {
    pins.contract = await pinFile('contracts/campus-cards/metadata/contract.json', 'application/json', 'campus-cards-contract.json');
    save();
  }
  console.log(`[pin] done: ${cards().length * 3 + 1} files recorded in ${path.relative(ROOT, PINS)}`);
}

function signingPage(payload) {
  const client = `
import { TezosToolkit } from '@taquito/taquito';
import { BeaconWallet } from '@taquito/beacon-wallet';
const payload = ${JSON.stringify(payload).replaceAll('<', '\\u003c')};
const status = document.querySelector('#status');
const button = document.querySelector('#sign');
button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    status.textContent = 'Connecting to Beacon. Choose Kukai; the list can take a few seconds…';
    const wallet = new BeaconWallet({ name: 'PointCast · Campus Cards Origination', network: { type: 'mainnet', rpcUrl: payload.rpc }, enableMetrics: false });
    const tezos = new TezosToolkit(payload.rpc);
    tezos.setWalletProvider(wallet);
    const active = await wallet.client.getActiveAccount();
    if (!active || active.address !== payload.admin) { if (active) await wallet.clearActiveAccount(); await wallet.requestPermissions(); }
    const account = await wallet.client.getActiveAccount();
    if (!account || account.address !== payload.admin) throw new Error('Connected wallet ' + (account?.address || 'unknown') + ' is not the configured admin ' + payload.admin);
    status.textContent = 'Confirm the ORIGINATION in Kukai…';
    const op = await tezos.wallet.originate({ code: payload.code, init: payload.storage }).send();
    status.textContent = 'Broadcast ' + op.opHash + '. Waiting for a block…';
    const contract = await op.contract();
    status.textContent = 'Originated: ' + contract.address;
    await fetch('/__result', { method: 'POST', body: JSON.stringify({ address: contract.address, opHash: op.opHash }) });
  } catch (error) { status.textContent = 'Stopped: ' + (error?.message || error); button.disabled = false; }
});`;
  const html = `<!doctype html><meta charset="utf-8"><title>Campus Cards origination</title><style>body{font:16px ui-monospace,monospace;max-width:760px;margin:64px auto;padding:24px;background:#f2efe9;color:#171717}button{font:inherit;padding:14px 18px;border:2px solid;background:#fff;box-shadow:4px 4px #171717}pre{white-space:pre-wrap}</style><h1>Campus Cards · mainnet origination</h1><p>Admin + treasury: ${payload.admin}</p><p>Cards: ${cards().length} (${SERIES.sets.map((x) => x.title).join(', ')}). Originates PAUSED.</p><p>Code SHA-256: ${sha(payload.code)}</p><p>Storage SHA-256: ${sha(payload.storage)}</p><button id="sign">Connect Kukai and sign origination</button><pre id="status">Nothing has been sent.</pre><script type="module" src="/client.mjs"></script>`;
  return { html, client };
}

async function originate(argv) {
  const execute = argv.includes('--execute');
  const confirm = argv[argv.indexOf('--confirm-mainnet') + 1];
  const { assertContractValid, assertDataValid } = await import('@taquito/michel-codec');
  const code = JSON.parse(readFileSync(path.join(BUILD, 'step_003_cont_0_contract.json'), 'utf8'));
  const template = JSON.parse(readFileSync(path.join(BUILD, 'step_003_cont_0_storage.json'), 'utf8'));
  const pins = loadPins();
  const { storage, storageType, complete } = prepareStorage(code, template, pins, { admin: MIKE_KUKAI, treasury: MIKE_KUKAI });
  assertContractValid(code);
  assertDataValid(storage, storageType);
  console.log(`[originate] code sha256 ${sha(code)}`);
  console.log(`[originate] storage sha256 ${sha(storage)}`);
  console.log(`[originate] admin/treasury ${MIKE_KUKAI}; paused; ${cards().length} cards`);
  console.log(`[originate] pins ${complete ? 'complete' : 'INCOMPLETE (placeholders in storage)'}`);
  if (!execute) return console.log('[originate] prepared only. Nothing sent.');
  if (!complete) throw new Error('Pin first: PINATA_JWT=... node scripts/campus-cards-mint-desk.mjs pin');
  if (confirm !== 'I_UNDERSTAND_MAINNET') throw new Error('Mainnet needs --confirm-mainnet I_UNDERSTAND_MAINNET');

  const { createServer } = await import('vite');
  const { nodePolyfills } = await import('vite-plugin-node-polyfills');
  const dir = await mkdtemp(path.join(os.tmpdir(), 'campus-cards-originate-'));
  const page = signingPage({ code, storage, rpc: RPC, admin: MIKE_KUKAI });
  await writeFile(path.join(dir, 'index.html'), page.html);
  await writeFile(path.join(dir, 'client.mjs'), page.client);
  await symlink(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  let settle;
  const result = new Promise((resolve) => { settle = resolve; });
  const server = await createServer({
    root: dir,
    server: { host: '127.0.0.1', port: 0 },
    resolve: { preserveSymlinks: true },
    optimizeDeps: { include: ['@taquito/taquito', '@taquito/beacon-wallet'] },
    define: { 'process.env.NODE_ENV': '"production"', 'process.browser': 'true', 'process.version': '"v22.0.0"' },
    plugins: [
      nodePolyfills({ include: ['buffer', 'process', 'util', 'stream', 'events'], globals: { Buffer: true, global: true, process: true }, protocolImports: false }),
      { name: 'result', configureServer(s) { s.middlewares.use('/__result', (req, res) => { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => { res.statusCode = 204; res.end(); settle(JSON.parse(b)); }); }); } },
    ],
  });
  try {
    await server.listen();
    const url = server.resolvedUrls.local[0];
    console.log(`[kukai] signing page: ${url}`);
    await execFileAsync('open', [url]);
    const signed = await result;
    console.log(`[originate] ${signed.address} (op ${signed.opHash})`);
    console.log('[originate] next: set src/data/contracts.json campus_cards.mainnet, add a registry entry, then set_paused false when ready.');
  } finally {
    await server.close();
    await rm(dir, { recursive: true, force: true });
  }
}

const [verb, ...rest] = process.argv.slice(2);
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  const run = { metadata: async () => writeMetadata(), pin, originate: () => originate(rest) }[verb];
  if (!run) {
    console.log('Usage: node scripts/campus-cards-mint-desk.mjs metadata | pin | originate [--execute --confirm-mainnet I_UNDERSTAND_MAINNET]');
    process.exitCode = verb ? 1 : 0;
  } else {
    run().catch((error) => { console.error(`[campus-cards] ${error.message}`); process.exitCode = 1; });
  }
}
