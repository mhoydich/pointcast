#!/usr/bin/env node
/**
 * set-metadata-base-cid.mjs — call set_metadata_base_cid on Visit Nouns FA2.
 *
 * IMPORTANT: this affects ONLY FUTURE MINTS. The contract bakes the per-token
 * URI into token_metadata[token_id].token_info[""] at first-mint time, and
 * never rewrites it. The 10 mints from the origination batch (#137, #205,
 * #420, #417, #1, #42, #99, #777, #808, #1111) have URIs frozen at
 * "/<tokenId>.json" (empty prefix + /id.json) because metadata_base_cid
 * was "" at their mint time. Those stay broken on objkt until a contract
 * re-origination. This script makes every mint after it ship with proper
 * metadata URIs.
 *
 * Default target: https://pointcast.xyz/api/tezos-metadata (no trailing
 * slash — the contract adds "/" then "<tokenId>.json").
 *
 * Admin-only. Must be called by the current administrator
 * (tz1PS4W…cKp1 until admin is transferred).
 *
 * Usage:
 *   node scripts/set-metadata-base-cid.mjs
 *   node scripts/set-metadata-base-cid.mjs "ipfs://bafyfoo"
 */

import fs from 'node:fs';
import path from 'node:path';
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';

const SIGNER_KEY_FILE = '/tmp/pointcast-mainnet-signer.json';
const CONTRACTS_JSON = path.resolve(process.cwd(), 'src/data/contracts.json');
const DEFAULT_BASE = 'https://pointcast.xyz/api/tezos-metadata';
const RPC = 'https://mainnet.api.tez.ie';

function log(...args) { console.log('[set-metadata-base-cid]', ...args); }

async function main() {
  const newBase = process.argv[2] || DEFAULT_BASE;
  log('target metadata_base_cid:', newBase);

  if (!fs.existsSync(SIGNER_KEY_FILE)) {
    log('ERROR: signer key file not found at', SIGNER_KEY_FILE);
    process.exit(1);
  }
  const contracts = JSON.parse(fs.readFileSync(CONTRACTS_JSON, 'utf8'));
  const contractAddress = contracts.visit_nouns?.mainnet;
  if (!contractAddress || !contractAddress.startsWith('KT1')) {
    log('ERROR: no mainnet KT1 in contracts.json');
    process.exit(1);
  }
  const keyData = JSON.parse(fs.readFileSync(SIGNER_KEY_FILE, 'utf8'));
  // Support both shapes: {sk: "edsk…"} (minimal — what the origination
  // script wrote) and {secretKey: "edsk…"} (earlier convention). Fall
  // back to the first string-typed value to be forgiving.
  const sk = keyData.sk || keyData.secretKey || Object.values(keyData).find((v) => typeof v === 'string' && v.startsWith('edsk'));
  if (!sk) throw new Error('no edsk key found in ' + SIGNER_KEY_FILE);
  const signer = await InMemorySigner.fromSecretKey(sk);
  const signerAddress = await signer.publicKeyHash();

  log('contract:', contractAddress);
  log('signer:  ', signerAddress);

  const tezos = new TezosToolkit(RPC);
  tezos.setSignerProvider(signer);
  const contract = await tezos.contract.at(contractAddress);

  log('broadcasting set_metadata_base_cid …');
  const op = await contract.methodsObject.set_metadata_base_cid(newBase).send();
  log('  op:', op.hash, `https://tzkt.io/${op.hash}`);

  log('waiting for confirmation (15-30s on mainnet)…');
  await op.confirmation(1);
  log('✓ confirmed.');
  log('');
  log('FUTURE MINTS from this contract will now carry a proper URI:');
  log(`  ${newBase}/<tokenId>.json`);
  log('');
  log('EXISTING 10 MINTS are NOT retroactively updated. Their URIs are');
  log('frozen per the SmartPy source (see contracts/v2/visit_nouns_fa2.py');
  log('line 175-182). To fix those, re-originate a v2 contract and re-mint.');
}

main().catch((err) => {
  console.error('[set-metadata-base-cid] FAILED:', err?.message || err);
  process.exit(1);
});
