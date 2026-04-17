#!/usr/bin/env node
/**
 * Deploy Visit Nouns FA2 to Shadownet via direct Taquito + InMemorySigner.
 * Skips Beacon/Kukai entirely — fewer moving parts.
 *
 * Flow:
 *   1. Generate or load a fresh ed25519 signing keypair (saved to
 *      /tmp/pointcast-shadownet-signer.json so we can re-use it).
 *   2. Print its tz1 address. If balance is 0, wait for the user to fund
 *      it via https://faucet.shadownet.teztnets.com.
 *   3. Patch the storage JSON so `administrator` = this keypair's tz1.
 *   4. Originate via `tezos.contract.originate({ code, init }).send()`.
 *   5. Wait one block confirmation. Print the KT1 address + tzkt link.
 *
 * Usage:
 *   node scripts/deploy-visit-nouns-shadownet.mjs
 *
 * Inputs expected at:
 *   /tmp/pointcast-visit-nouns-contract.json   (Michelson JSON array)
 *   /tmp/pointcast-visit-nouns-storage.json    (initial storage JSON)
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

const CODE_PATH = '/tmp/pointcast-visit-nouns-contract.json';
const STORAGE_PATH = '/tmp/pointcast-visit-nouns-storage.json';
const SIGNER_PATH = '/tmp/pointcast-shadownet-signer.json';

function log(...args) { console.log('[deploy]', ...args); }

async function loadOrCreateSigner() {
  if (fs.existsSync(SIGNER_PATH)) {
    const { sk } = JSON.parse(fs.readFileSync(SIGNER_PATH, 'utf8'));
    const signer = await InMemorySigner.fromSecretKey(sk);
    return { signer, sk };
  }
  // Generate a fresh ed25519 keypair. Encode the 32-byte seed with the
  // Ed25519Seed prefix (the "edsk…" short form InMemorySigner accepts).
  const utils = await import('@taquito/utils');
  const { b58Encode, PrefixV2 } = utils;
  const seed = crypto.randomBytes(32);
  const edskSeed = b58Encode(seed, PrefixV2.Ed25519Seed);
  const signer = await InMemorySigner.fromSecretKey(edskSeed);
  const sk = await signer.secretKey();
  fs.writeFileSync(SIGNER_PATH, JSON.stringify({ sk }, null, 2), { mode: 0o600 });
  log('saved fresh signer to', SIGNER_PATH);
  return { signer, sk };
}

async function getBalanceTez(address) {
  const r = await fetch(`${TZKT_API}/accounts/${address}`);
  if (!r.ok) return 0;
  const j = await r.json();
  return (j.balance || 0) / 1_000_000;
}

async function waitForBalance(address, minTez = 20) {
  while (true) {
    const bal = await getBalanceTez(address);
    if (bal >= minTez) {
      log(`balance ok: ${bal} ꜩ`);
      return;
    }
    log(`balance ${bal} ꜩ — need ${minTez}. fund at https://faucet.shadownet.teztnets.com (paste the tz1 above). retrying in 8s…`);
    await new Promise(r => setTimeout(r, 8000));
  }
}

async function main() {
  if (!fs.existsSync(CODE_PATH)) throw new Error(`missing ${CODE_PATH}`);
  if (!fs.existsSync(STORAGE_PATH)) throw new Error(`missing ${STORAGE_PATH}`);

  const { signer } = await loadOrCreateSigner();
  const address = await signer.publicKeyHash();
  log('signer address:', address);

  // Patch storage.administrator → this signer's address
  const storageJson = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
  const originalAdmin = storageJson.args?.[0]?.string;
  log('original storage admin:', originalAdmin);
  if (originalAdmin !== address) {
    storageJson.args[0].string = address;
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(storageJson, null, 2));
    log('patched storage admin →', address);
  }

  // Make sure the signer is funded
  await waitForBalance(address, 20);

  // Wire up Taquito
  const tezos = new TezosToolkit(RPC);
  tezos.setProvider({ signer });

  const code = JSON.parse(fs.readFileSync(CODE_PATH, 'utf8'));
  const init = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));

  // Fetch Shadownet's actual block gas limit so we can stay under it.
  // On mainnet this is 5.2M per block / 1.04M per op. Shadownet may be
  // tighter. We estimate Taquito's RPC constants to set safe bounds.
  let gasCap = 900_000;
  try {
    const cons = await tezos.rpc.getConstants();
    gasCap = Math.min((cons?.hard_gas_limit_per_operation || gasCap) - 1000, gasCap);
    log('shadownet gas-per-op cap:', gasCap);
  } catch {}

  // Use the exact Shadownet caps — hard_gas_limit_per_operation and
  // hard_storage_limit_per_operation. Anything above these gets rejected
  // before simulation.
  let storageCap = 60_000;
  try {
    const cons = await tezos.rpc.getConstants();
    storageCap = cons?.hard_storage_limit_per_operation || storageCap;
    if (typeof storageCap === 'object' && storageCap?.toString) storageCap = Number(storageCap.toString());
    log('shadownet storage-per-op cap:', storageCap);
  } catch {}

  log('originating — this takes ~30–60s…');
  const op = await tezos.contract.originate({
    code,
    init,
    gasLimit: gasCap,
    storageLimit: storageCap,
    fee: 1_500_000,
  });
  log('broadcast:', op.hash);
  log('  tzkt:', `${TZKT_BASE}/${op.hash}`);

  const contract = await op.contract();
  log('✓ KT1:', contract.address);
  log('  tzkt:', `${TZKT_BASE}/${contract.address}/operations`);

  // Persist the address
  const outPath = '/tmp/pointcast-visit-nouns-kt1.txt';
  fs.writeFileSync(outPath, contract.address + '\n');
  log('saved to', outPath);
}

main().catch(err => {
  console.error('[deploy] FAILED:', err?.message || err);
  if (err?.errors) console.error('[deploy] errors[]:', JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
