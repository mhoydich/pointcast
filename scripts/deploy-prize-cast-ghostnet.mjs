#!/usr/bin/env node
/**
 * Deploy Prize Cast to Tezos Ghostnet via Taquito + InMemorySigner.
 *
 * Notes:
 * - Ghostnet is deprecated on teztnets.com as of April 17, 2026, but it still
 *   exposes public RPC endpoints and a TzKT explorer/API. This script stays on
 *   Ghostnet because the request explicitly asked for Ghostnet only.
 * - Compile the SmartPy contract first and place the Michelson JSON artifacts at
 *   the paths below before running this script.
 * - The signer is intentionally throwaway and written to /tmp. Anyone with that
 *   file can drain the wallet until its funds are moved out.
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import taquitoPkg from '@taquito/taquito';
import signerPkg from '@taquito/signer';

const { TezosToolkit } = taquitoPkg;
const { InMemorySigner } = signerPkg;

const RPC = 'https://rpc.ghostnet.teztnets.com';
const TZKT_BASE = 'https://ghostnet.tzkt.io';
const TZKT_API = 'https://api.ghostnet.tzkt.io/v1';

const CODE_PATH = '/tmp/prize-cast-contract.json';
const STORAGE_PATH = '/tmp/prize-cast-storage.json';
const SIGNER_PATH = '/tmp/prize-cast-ghostnet-signer.json';
const OUT_PATH = '/tmp/prize-cast-ghostnet-kt1.txt';

function log(...args) {
  console.log('[ghostnet]', ...args);
}

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
  log('saved fresh Ghostnet signer to', SIGNER_PATH);
  return { signer, sk };
}

async function getBalanceTez(address) {
  const response = await fetch(`${TZKT_API}/accounts/${address}`);
  if (!response.ok) return 0;
  const json = await response.json();
  return (json.balance || 0) / 1_000_000;
}

async function waitForBalance(address, minTez = 20) {
  while (true) {
    const balance = await getBalanceTez(address);
    if (balance >= minTez) {
      log(`balance ok: ${balance} ꜩ`);
      return;
    }

    log(
      `balance ${balance} ꜩ — need ≥${minTez}. fund ${address} on Ghostnet, retrying in 10s…`,
    );
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
}

async function main() {
  if (!fs.existsSync(CODE_PATH)) throw new Error(`missing ${CODE_PATH}`);
  if (!fs.existsSync(STORAGE_PATH)) throw new Error(`missing ${STORAGE_PATH}`);

  const { signer } = await loadOrCreateSigner();
  const signerAddress = await signer.publicKeyHash();
  log('Ghostnet signer address:', signerAddress);
  log('fund this address on Ghostnet before origination.');

  const storageJson = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
  const originalAdmin = storageJson.args?.[0]?.string;
  log('storage admin (pre-patch):', originalAdmin);

  if (originalAdmin !== signerAddress) {
    storageJson.args[0].string = signerAddress;
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(storageJson, null, 2));
    log('patched storage admin →', signerAddress);
  }

  await waitForBalance(signerAddress, 20);

  const tezos = new TezosToolkit(RPC);
  tezos.setProvider({ signer });

  const code = JSON.parse(fs.readFileSync(CODE_PATH, 'utf8'));
  const init = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));

  let gasCap = 1_000_000;
  let storageCap = 60_000;
  try {
    const constants = await tezos.rpc.getConstants();
    gasCap = Number(constants?.hard_gas_limit_per_operation?.toString?.() ?? gasCap);
    storageCap = Number(
      constants?.hard_storage_limit_per_operation?.toString?.() ?? storageCap,
    );
    log('ghostnet caps: gas_per_op =', gasCap, 'storage_per_op =', storageCap);
  } catch {
    log('could not fetch protocol caps; using conservative defaults');
  }

  log('originating on Ghostnet — takes ~30–60s…');
  const op = await tezos.contract.originate({
    code,
    init,
    gasLimit: gasCap - 1000,
    storageLimit: storageCap,
    fee: 1_500_000,
  });

  log('broadcast:', op.hash, `${TZKT_BASE}/${op.hash}`);

  const contract = await op.contract();
  log('✓ Ghostnet KT1:', contract.address);
  log('  tzkt:', `${TZKT_BASE}/${contract.address}/operations`);

  fs.writeFileSync(OUT_PATH, contract.address + '\n');
  log('saved to', OUT_PATH);
}

main().catch((err) => {
  console.error('[ghostnet] FAILED:', err?.message || err);
  if (err?.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});

