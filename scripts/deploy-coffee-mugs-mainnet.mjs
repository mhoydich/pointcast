#!/usr/bin/env node
/**
 * Deploy Coffee Mugs FA2 to Tezos MAINNET via direct Taquito + InMemorySigner.
 * Mirror of scripts/deploy-visit-nouns-mainnet.mjs — only paths + log labels
 * differ. Uses a fresh keypair for origination; admin transfers to Mike's
 * real mainnet wallet via set_administrator as a second step.
 *
 * CRITICAL: this script originates on mainnet with REAL ꜩ. Read the runbook
 * at docs/plans/2026-04-25-coffee-mugs-deploy-runbook.md before running.
 * Signer keypair is saved to /tmp — anyone with that file can drain the
 * wallet until funds are transferred out.
 *
 * Pre-flight (Mike runs):
 *   1. Compile contracts/v2/coffee_mugs_fa2.py via smartpy.io IDE OR local CLI
 *   2. Save the two emitted JSONs to:
 *        /tmp/pointcast-coffee-mugs-contract.json
 *        /tmp/pointcast-coffee-mugs-storage.json
 *   3. Run:  node scripts/deploy-coffee-mugs-mainnet.mjs
 *   4. Send ≥3 ꜩ to the script's MAINNET signer address when prompted
 *      (origination + register_tokens + buffer; whole flow burns ~1 ꜩ)
 *   5. After KT1 prints, run:  node scripts/register-coffee-mugs-tokens.mjs
 *   6. Then transfer admin to Mike's main wallet:
 *        node scripts/mainnet-transfer-admin.mjs --contract coffee-mugs <tz2 Mike>
 *   7. Paste KT1 into src/data/contracts.json under coffee_mugs.mainnet
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

const CODE_PATH = '/tmp/pointcast-coffee-mugs-contract.json';
const STORAGE_PATH = '/tmp/pointcast-coffee-mugs-storage.json';
const SIGNER_PATH = '/tmp/pointcast-coffee-mugs-signer.json';
const KT1_OUT_PATH = '/tmp/pointcast-coffee-mugs-mainnet-kt1.txt';

// Lower min balance than Visit Nouns — Coffee Mugs storage is much smaller
// (5 fixed tokens, no metadata baked at origination). Origination + the
// register_tokens follow-up burn ~1 ꜩ total. 3 ꜩ buffer for safety.
const MIN_FUNDING_TEZ = 3;

function log(...args) { console.log('[coffee-mugs]', ...args); }

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

async function waitForBalance(address, minTez) {
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
  if (!fs.existsSync(CODE_PATH)) {
    throw new Error(
      `missing ${CODE_PATH}\n\n` +
      `Compile contracts/v2/coffee_mugs_fa2.py first:\n` +
      `  Path A · smartpy.io IDE → Run → Deploy → download contract.json + storage.json → save to /tmp\n` +
      `  Path B · local SmartPy CLI → smartpy compile contracts/v2/coffee_mugs_fa2.py /tmp/coffee-mugs-build/\n`
    );
  }
  if (!fs.existsSync(STORAGE_PATH)) throw new Error(`missing ${STORAGE_PATH}`);

  const { signer } = await loadOrCreateSigner();
  const address = await signer.publicKeyHash();
  log('MAINNET signer address:', address);
  log(`send ≥${MIN_FUNDING_TEZ} ꜩ to`, address, '(origination + register_tokens, ~1 ꜩ burn + buffer)');

  // Patch storage.administrator to the signer so origination succeeds.
  // We transfer admin to Mike's main mainnet wallet in a second op after.
  const storageJson = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
  const originalAdmin = storageJson.args?.[0]?.string;
  log('storage admin (pre-patch):', originalAdmin);
  if (originalAdmin && originalAdmin !== address) {
    storageJson.args[0].string = address;
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(storageJson, null, 2));
    log('patched storage admin →', address);
  }

  await waitForBalance(address, MIN_FUNDING_TEZ);

  const tezos = new TezosToolkit(RPC);
  tezos.setProvider({ signer });

  const code = JSON.parse(fs.readFileSync(CODE_PATH, 'utf8'));
  const init = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));

  // Use protocol caps. Coffee Mugs is small but origination needs headroom.
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
  log('  objkt (after register + first mint):', `https://objkt.com/collection/${contract.address}`);

  fs.writeFileSync(KT1_OUT_PATH, contract.address + '\n');
  log('saved to', KT1_OUT_PATH);
  log('');
  log('NEXT STEPS:');
  log('  1. node scripts/register-coffee-mugs-tokens.mjs   # registers the 5 mug names + URIs');
  log('  2. paste KT1 into src/data/contracts.json under coffee_mugs.mainnet:', contract.address);
  log('  3. node scripts/mainnet-transfer-admin.mjs --contract coffee-mugs <tz2 Mike\'s wallet>');
  log('  4. commit + push + manual wrangler deploy → /coffee mintables flip from BANKED → MINT TO TZ');
}

main().catch((err) => {
  console.error('[coffee-mugs] FAILED:', err?.message || err);
  if (err?.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
