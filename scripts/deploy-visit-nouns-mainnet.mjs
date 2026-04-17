#!/usr/bin/env node
/**
 * Deploy Visit Nouns FA2 to Tezos MAINNET via direct Taquito + InMemorySigner.
 * Mirror of deploy-visit-nouns-shadownet.mjs, swapped RPC + signer path +
 * tzkt base. Uses a fresh keypair for origination; admin transfers to
 * Mike's real mainnet wallet via set_administrator as a second step.
 *
 * CRITICAL: this script mints on mainnet with REAL ꜩ. Read DEPLOY_NOTES
 * before running. Signer keypair is saved to /tmp — anyone with that file
 * can drain the wallet until funds are transferred out.
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import taquitoPkg from '@taquito/taquito';
import signerPkg from '@taquito/signer';

const { TezosToolkit } = taquitoPkg;
const { InMemorySigner } = signerPkg;

const RPC = 'https://mainnet.api.tez.ie';
const TZKT_BASE = 'https://tzkt.io';
const TZKT_API = 'https://api.tzkt.io/v1';

const CODE_PATH = '/tmp/pointcast-visit-nouns-contract.json';
const STORAGE_PATH = '/tmp/pointcast-visit-nouns-storage.json';
const SIGNER_PATH = '/tmp/pointcast-mainnet-signer.json';

function log(...args) { console.log('[mainnet]', ...args); }

async function loadOrCreateSigner() {
  if (fs.existsSync(SIGNER_PATH)) {
    const { sk } = JSON.parse(fs.readFileSync(SIGNER_PATH, 'utf8'));
    const signer = await InMemorySigner.fromSecretKey(sk);
    return { signer, sk };
  }
  const { b58Encode, PrefixV2 } = await import('@taquito/utils');
  const seed = crypto.randomBytes(32);
  const edskSeed = b58Encode(seed, PrefixV2.Ed25519Seed);
  const signer = await InMemorySigner.fromSecretKey(edskSeed);
  const sk = await signer.secretKey();
  fs.writeFileSync(SIGNER_PATH, JSON.stringify({ sk }, null, 2), { mode: 0o600 });
  log('saved fresh MAINNET signer to', SIGNER_PATH);
  return { signer, sk };
}

async function getBalanceTez(address) {
  const r = await fetch(`${TZKT_API}/accounts/${address}`);
  if (!r.ok) return 0;
  const j = await r.json();
  return (j.balance || 0) / 1_000_000;
}

async function waitForBalance(address, minTez = 25) {
  while (true) {
    const bal = await getBalanceTez(address);
    if (bal >= minTez) {
      log(`balance ok: ${bal} ꜩ`);
      return;
    }
    log(`balance ${bal} ꜩ — need ≥${minTez} on MAINNET. send real ꜩ to ${address}. retrying in 10s…`);
    await new Promise((r) => setTimeout(r, 10_000));
  }
}

async function main() {
  if (!fs.existsSync(CODE_PATH)) throw new Error(`missing ${CODE_PATH}`);
  if (!fs.existsSync(STORAGE_PATH)) throw new Error(`missing ${STORAGE_PATH}`);

  const { signer } = await loadOrCreateSigner();
  const address = await signer.publicKeyHash();
  log('MAINNET signer address:', address);
  log('send ≥25 ꜩ to', address, 'to fund origination (~8–15 ꜩ storage burn + 1 ꜩ fee + buffer)');

  // Patch storage.administrator to the signer so origination succeeds.
  // We transfer admin to Mike's real mainnet wallet in a second op after.
  const storageJson = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
  const originalAdmin = storageJson.args?.[0]?.string;
  log('storage admin (pre-patch):', originalAdmin);
  if (originalAdmin !== address) {
    storageJson.args[0].string = address;
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(storageJson, null, 2));
    log('patched storage admin →', address);
  }

  await waitForBalance(address, 25);

  const tezos = new TezosToolkit(RPC);
  tezos.setProvider({ signer });

  const code = JSON.parse(fs.readFileSync(CODE_PATH, 'utf8'));
  const init = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));

  // Use protocol caps — mainnet has the same 60KB storage cap as Shadownet,
  // so this matches what worked there. Gas cap at 1.04M per op.
  let gasCap = 1_000_000, storageCap = 60_000;
  try {
    const cons = await tezos.rpc.getConstants();
    gasCap = Number(cons?.hard_gas_limit_per_operation?.toString?.() ?? gasCap);
    storageCap = Number(cons?.hard_storage_limit_per_operation?.toString?.() ?? storageCap);
    log('mainnet caps: gas_per_op =', gasCap, 'storage_per_op =', storageCap);
  } catch {}

  log('originating on MAINNET — takes ~30–60s…');
  const op = await tezos.contract.originate({
    code,
    init,
    gasLimit: gasCap - 1000,
    storageLimit: storageCap,
    fee: 1_500_000,
  });
  log('broadcast:', op.hash, `${TZKT_BASE}/${op.hash}`);

  const contract = await op.contract();
  log('✓ MAINNET KT1:', contract.address);
  log('  tzkt:', `${TZKT_BASE}/${contract.address}/operations`);
  log('  objkt (after first mint):', `https://objkt.com/collection/${contract.address}`);

  const outPath = '/tmp/pointcast-visit-nouns-mainnet-kt1.txt';
  fs.writeFileSync(outPath, contract.address + '\n');
  log('saved to', outPath);
  log('');
  log('NEXT STEP: transfer admin to Mike\'s mainnet wallet via `set_administrator`.');
  log('Run:  node scripts/mainnet-transfer-admin.mjs <tz1 Mike\'s wallet>');
}

main().catch((err) => {
  console.error('[mainnet] FAILED:', err?.message || err);
  if (err?.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
