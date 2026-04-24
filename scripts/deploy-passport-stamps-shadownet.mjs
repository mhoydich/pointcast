#!/usr/bin/env node
/**
 * Deploy Passport Stamps FA2 to Shadownet via Taquito + InMemorySigner.
 *
 * Compile contracts/v2/passport_stamps_fa2.py first and place artifacts at:
 *   /tmp/pointcast-passport-stamps-contract.json
 *   /tmp/pointcast-passport-stamps-storage.json
 *
 * This mirrors deploy-visit-nouns-shadownet.mjs and intentionally does not
 * touch mainnet. After deploy, paste the KT1 into src/data/contracts.json at
 * passport_stamps.shadownet and run check-passport-stamps-native-readiness.
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import taquitoPkg from '@taquito/taquito';
import signerPkg from '@taquito/signer';

const { TezosToolkit } = taquitoPkg;
const { InMemorySigner } = signerPkg;

const RPC = 'https://shadownet.smartpy.io';
const TZKT_BASE = 'https://shadownet.tzkt.io';
const TZKT_API = 'https://api.shadownet.tzkt.io/v1';

const CODE_PATH = '/tmp/pointcast-passport-stamps-contract.json';
const STORAGE_PATH = '/tmp/pointcast-passport-stamps-storage.json';
const SIGNER_PATH = '/tmp/pointcast-passport-stamps-shadownet-signer.json';

function log(...args) { console.log('[passport-stamps deploy]', ...args); }

async function loadOrCreateSigner() {
  if (fs.existsSync(SIGNER_PATH)) {
    const { sk } = JSON.parse(fs.readFileSync(SIGNER_PATH, 'utf8'));
    return InMemorySigner.fromSecretKey(sk);
  }

  const { b58Encode, PrefixV2 } = await import('@taquito/utils');
  const seed = crypto.randomBytes(32);
  const edskSeed = b58Encode(seed, PrefixV2.Ed25519Seed);
  const signer = await InMemorySigner.fromSecretKey(edskSeed);
  const sk = await signer.secretKey();
  fs.writeFileSync(SIGNER_PATH, JSON.stringify({ sk }, null, 2), { mode: 0o600 });
  log('saved fresh signer to', SIGNER_PATH);
  return signer;
}

async function getBalanceTez(address) {
  const response = await fetch(`${TZKT_API}/accounts/${address}`);
  if (!response.ok) return 0;
  const account = await response.json();
  return (account.balance || 0) / 1_000_000;
}

async function waitForBalance(address, minTez = 20) {
  while (true) {
    const balance = await getBalanceTez(address);
    if (balance >= minTez) {
      log(`balance ok: ${balance} ꜩ`);
      return;
    }
    log(`balance ${balance} ꜩ — need ${minTez}. fund ${address} at https://faucet.shadownet.teztnets.com; retrying in 8s...`);
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }
}

async function main() {
  if (!fs.existsSync(CODE_PATH)) throw new Error(`missing ${CODE_PATH}`);
  if (!fs.existsSync(STORAGE_PATH)) throw new Error(`missing ${STORAGE_PATH}`);

  const signer = await loadOrCreateSigner();
  const address = await signer.publicKeyHash();
  log('signer address:', address);

  const storageJson = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
  const originalAdmin = storageJson.args?.[0]?.string;
  if (originalAdmin && originalAdmin !== address) {
    storageJson.args[0].string = address;
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(storageJson, null, 2));
    log('patched storage admin:', originalAdmin, '->', address);
  } else {
    log('storage admin:', originalAdmin || '(not patched; verify compiled storage layout)');
  }

  await waitForBalance(address, 20);

  const tezos = new TezosToolkit(RPC);
  tezos.setProvider({ signer });

  const code = JSON.parse(fs.readFileSync(CODE_PATH, 'utf8'));
  const init = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));

  let gasCap = 900_000;
  let storageCap = 60_000;
  try {
    const constants = await tezos.rpc.getConstants();
    gasCap = Math.min(Number(constants?.hard_gas_limit_per_operation?.toString?.() ?? gasCap) - 1000, gasCap);
    storageCap = Number(constants?.hard_storage_limit_per_operation?.toString?.() ?? storageCap);
    log('shadownet caps:', { gasCap, storageCap });
  } catch {}

  log('originating...');
  const op = await tezos.contract.originate({
    code,
    init,
    gasLimit: gasCap,
    storageLimit: storageCap,
    fee: 1_500_000,
  });
  log('broadcast:', op.hash, `${TZKT_BASE}/${op.hash}`);

  const contract = await op.contract();
  log('✓ KT1:', contract.address);
  log('tzkt:', `${TZKT_BASE}/${contract.address}/operations`);

  const outPath = '/tmp/pointcast-passport-stamps-shadownet-kt1.txt';
  fs.writeFileSync(outPath, `${contract.address}\n`);
  log('saved to', outPath);
}

main().catch((error) => {
  console.error('[passport-stamps deploy] FAILED:', error?.message || error);
  if (error?.errors) console.error(JSON.stringify(error.errors, null, 2));
  process.exit(1);
});
