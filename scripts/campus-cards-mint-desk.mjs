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

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERIES = JSON.parse(readFileSync(path.join(ROOT, 'src/data/campus-cards.json'), 'utf8'));
const OUT = path.join(ROOT, 'contracts/campus-cards');
const META = path.join(OUT, 'metadata');
const PINS = path.join(OUT, 'pins.json');
const BUILD = path.join(ROOT, 'contracts/build/campus_cards');
const MIKE_KUKAI = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
const RPC = 'https://mainnet.smartpy.io';
const CID = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/;

const hex = (s) => Buffer.from(s, 'utf8').toString('hex');
const sha = (v) => createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex');

export function cards() {
  const out = [];
  let tokenId = 0;
  for (const set of SERIES.sets) {
    const campus = SERIES.campuses.find((c) => c.slug === set.campus);
    for (const card of set.cards) {
      const base = `${String(card.n).padStart(2, '0')}-${card.slug}`;
      out.push({ ...card, tokenId: tokenId++, set, campus, base, svg: `public/images/campus-cards/${set.id}/${base}.svg`, png: `public/images/campus-cards/${set.id}/${base}.png` });
    }
  }
  return out;
}

function loadPins() {
  return existsSync(PINS) ? JSON.parse(readFileSync(PINS, 'utf8')) : { version: 1, series: SERIES.series, images: {}, tokens: {}, contract: null };
}

export function tokenMetadata(card, pins) {
  const rarity = SERIES.rarities[card.rarity];
  const img = pins.images?.[card.tokenId] ?? {};
  const svg = img.svg?.cid ? `ipfs://${img.svg.cid}` : `ipfs://PLACEHOLDER_${card.base}.svg`;
  const png = img.png?.cid ? `ipfs://${img.png.cid}` : `ipfs://PLACEHOLDER_${card.base}.png`;
  return {
    name: `Campus Cards · ${card.campus.name} · ${String(card.n).padStart(2, '0')} ${card.title}`,
    description: `${card.flavor} ${card.set.title}, card ${card.n} of ${card.set.cards.length}. ${SERIES.notice}`,
    symbol: SERIES.symbol,
    decimals: 0,
    artifactUri: svg,
    displayUri: png,
    thumbnailUri: png,
    rights: 'CC0-1.0',
    isBooleanAmount: false,
    shouldPreferSymbol: false,
    tags: ['campus-cards', card.set.campus, card.rarity, 'pixel-art', 'pointcast'],
    attributes: [
      { name: 'Set', value: card.set.title },
      { name: 'Campus', value: card.campus.name },
      { name: 'Place', value: card.campus.place },
      { name: 'Card', value: `${String(card.n).padStart(2, '0')}/${String(card.set.cards.length).padStart(2, '0')}` },
      { name: 'Rarity', value: rarity.label },
      { name: 'Edition', value: rarity.cap ? `${rarity.cap} max` : 'open' },
    ],
    formats: [
      { uri: svg, mimeType: 'image/svg+xml', fileName: `${card.base}.svg`, dimensions: { value: '400x560', unit: 'px' } },
      { uri: png, mimeType: 'image/png', fileName: `${card.base}.png`, dimensions: { value: '1200x1680', unit: 'px' } },
    ],
    creators: [SERIES.creator],
    minter: SERIES.creator,
  };
}

export function contractMetadata() {
  return {
    name: SERIES.name,
    description: `${SERIES.tagline} ${SERIES.notice}`,
    version: '1.0.0',
    license: { name: SERIES.license },
    homepage: 'https://pointcast.xyz/campus-cards',
    authors: ['PointCast <https://pointcast.xyz>'],
    interfaces: ['TZIP-012', 'TZIP-016', 'TZIP-021'],
  };
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

function annotated(type, value, fields = new Map()) {
  const name = type?.annots?.find((a) => a.startsWith('%'))?.slice(1);
  if (name) fields.set(name, { type, value });
  if (type?.prim === 'pair') {
    if (value?.prim !== 'Pair' || value.args?.length !== 2 || type.args?.length !== 2) throw new Error('Compiled storage shape does not match its type.');
    annotated(type.args[0], value.args[0], fields);
    annotated(type.args[1], value.args[1], fields);
  }
  return fields;
}

export function prepareStorage(code, template, pins, { admin, treasury }) {
  const storageType = code.find((i) => i?.prim === 'storage').args[0];
  const storage = structuredClone(template);
  const f = annotated(storageType, storage);
  const need = (name, prim) => {
    const field = f.get(name);
    if (!field || field.type.prim !== prim) throw new Error(`Compiled storage is missing %${name}:${prim}`);
    return field.value;
  };
  need('administrator', 'address').string = admin;
  need('treasury', 'address').string = treasury;
  need('paused', 'bool').prim = 'True';
  const all = cards();
  const complete = CID.test(pins.contract?.cid || '') && all.every((c) => CID.test(pins.tokens?.[c.tokenId]?.cid || ''));
  const meta = need('metadata', 'big_map');
  meta[0].args[1].bytes = hex(`ipfs://${pins.contract?.cid || '__CAMPUS_CARDS_CONTRACT_CID__'}`);
  const tokens = need('token_metadata', 'big_map');
  if (tokens.length !== all.length) throw new Error(`Compiled token_metadata has ${tokens.length} entries; series has ${all.length}. Recompile the contract.`);
  for (const entry of tokens) {
    const id = Number(entry.args[0].int);
    const cid = pins.tokens?.[id]?.cid || `__CAMPUS_CARDS_TOKEN_${id}_CID__`;
    entry.args[1].args[1] = [{ prim: 'Elt', args: [{ string: '' }, { bytes: hex(`ipfs://${cid}`) }] }];
  }
  return { storage, storageType, complete };
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
  const html = `<!doctype html><meta charset="utf-8"><title>Campus Cards origination</title><style>body{font:16px ui-monospace,monospace;max-width:760px;margin:64px auto;padding:24px;background:#f2efe9;color:#171717}button{font:inherit;padding:14px 18px;border:2px solid;background:#fff;box-shadow:4px 4px #171717}pre{white-space:pre-wrap}</style><h1>Campus Cards · mainnet origination</h1><p>Admin + treasury: ${payload.admin}</p><p>Cards: ${cards().length} (Set 01 · Santa Barbara). Originates PAUSED.</p><p>Code SHA-256: ${sha(payload.code)}</p><p>Storage SHA-256: ${sha(payload.storage)}</p><button id="sign">Connect Kukai and sign origination</button><pre id="status">Nothing has been sent.</pre><script type="module" src="/client.mjs"></script>`;
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
