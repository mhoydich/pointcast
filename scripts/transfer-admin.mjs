#!/usr/bin/env node
/**
 * transfer-admin.mjs — transfer Visit Nouns FA2 admin from the throwaway
 * origination signer to Mike's real mainnet wallet.
 *
 *   Current admin: tz1PS4WgbYCKcKnfbfMNSH44JfrnFVhkcKp1 (throwaway)
 *   New admin:     tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw (Mike's main)
 *
 * This signs `set_administrator(<new>)` on the FA2 using the throwaway
 * InMemorySigner and broadcasts. Gas cost ~0.003 ꜩ. Irreversible — after
 * this runs, the throwaway can no longer mint, update metadata, pause, or
 * transfer admin again; only the new admin can.
 *
 * Usage:
 *   node scripts/transfer-admin.mjs                   # uses config below
 *   node scripts/transfer-admin.mjs <new-tz-address>  # override new admin
 *
 * Prereqs: /tmp/pointcast-mainnet-signer.json must still exist (it does,
 * post-cascade) and src/data/contracts.json must have visit_nouns.mainnet
 * populated (the auto-pipeline did this).
 */

import fs from 'node:fs';
import path from 'node:path';
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';

const SIGNER_KEY_FILE = '/tmp/pointcast-mainnet-signer.json';
const CONTRACTS_JSON = path.resolve(process.cwd(), 'src/data/contracts.json');
const DEFAULT_NEW_ADMIN = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
const RPC = 'https://mainnet.api.tez.ie';

function log(...args) { console.log('[transfer-admin]', ...args); }

async function main() {
  const newAdmin = process.argv[2] || DEFAULT_NEW_ADMIN;
  if (!newAdmin.match(/^tz[123][a-zA-Z0-9]{33}$/)) {
    log('ERROR: bad new-admin address:', newAdmin);
    process.exit(1);
  }

  if (!fs.existsSync(SIGNER_KEY_FILE)) {
    log('ERROR: signer key file not found at', SIGNER_KEY_FILE);
    log('  (the auto-pipeline writes it during origination — if it has been');
    log('   deleted, admin transfer is not recoverable via this script)');
    process.exit(1);
  }

  const contracts = JSON.parse(fs.readFileSync(CONTRACTS_JSON, 'utf8'));
  const contractAddress = contracts.visit_nouns?.mainnet;
  if (!contractAddress || !contractAddress.startsWith('KT1')) {
    log('ERROR: no mainnet KT1 in contracts.json — origination must run first');
    process.exit(1);
  }

  const keyData = JSON.parse(fs.readFileSync(SIGNER_KEY_FILE, 'utf8'));
  const signer = new InMemorySigner(keyData.secretKey);
  const currentAdmin = await signer.publicKeyHash();

  log('contract:        ', contractAddress);
  log('current admin:   ', currentAdmin, '(throwaway)');
  log('new admin:       ', newAdmin);
  log('');

  if (currentAdmin === newAdmin) {
    log('no-op: throwaway === new admin. aborting.');
    process.exit(0);
  }

  const tezos = new TezosToolkit(RPC);
  tezos.setSignerProvider(signer);

  const contract = await tezos.contract.at(contractAddress);
  const methods = Object.keys(contract.methodsObject);
  if (!methods.includes('set_administrator')) {
    log('ERROR: contract does not expose set_administrator');
    log('  available entrypoints:', methods.join(', '));
    process.exit(1);
  }

  log('broadcasting set_administrator …');
  const op = await contract.methodsObject.set_administrator(newAdmin).send();
  log('  op:', op.hash, `https://tzkt.io/${op.hash}`);

  log('waiting for confirmation (usually 15-30s on mainnet)…');
  await op.confirmation(1);
  log('✓ confirmed.');
  log('');
  log('admin transfer complete. Going forward:');
  log('  • only', newAdmin, 'can mint / update metadata / pause the contract.');
  log('  • the throwaway', currentAdmin, 'has no privileges — can be ignored.');
  log('  • the throwaway signer key at', SIGNER_KEY_FILE, 'can be deleted.');
  log('');
  log('Consider updating contracts.json._mainnet_notes.admin to record the change.');
}

main().catch((err) => {
  console.error('[transfer-admin] FAILED:', err?.message || err);
  console.error(err);
  process.exit(1);
});
