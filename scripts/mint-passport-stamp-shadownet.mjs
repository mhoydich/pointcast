#!/usr/bin/env node
/**
 * End-to-end mint smoke test for Passport Stamps FA2 on Shadownet.
 *
 * Requires:
 * - src/data/contracts.json passport_stamps.shadownet populated, or pass KT1
 *   as the second CLI argument.
 * - /tmp/pointcast-passport-stamps-shadownet-signer.json from deploy script.
 *
 * Usage:
 *   node scripts/mint-passport-stamp-shadownet.mjs 0
 *   node scripts/mint-passport-stamp-shadownet.mjs 0 KT1...
 */

import fs from 'node:fs';
import taquitoPkg from '@taquito/taquito';
import signerPkg from '@taquito/signer';

const { TezosToolkit } = taquitoPkg;
const { InMemorySigner } = signerPkg;

const RPC = 'https://shadownet.smartpy.io';
const TZKT_BASE = 'https://shadownet.tzkt.io';
const SIGNER_PATH = '/tmp/pointcast-passport-stamps-shadownet-signer.json';
const contracts = JSON.parse(fs.readFileSync('src/data/contracts.json', 'utf8'));
const STAMP_ID = Number(process.argv[2] ?? 0);
const KT1 = String(process.argv[3] || contracts.passport_stamps?.shadownet || '').trim();
const MAX_STAMP_ID = Number(process.env.PASSPORT_MAX_STAMP_ID || 23);

async function main() {
  if (!Number.isFinite(STAMP_ID) || STAMP_ID < 0 || STAMP_ID > MAX_STAMP_ID) {
    throw new Error(`stamp id must be 0-${MAX_STAMP_ID}`);
  }
  if (!KT1.startsWith('KT1')) {
    throw new Error('missing Passport Stamps shadownet KT1');
  }
  if (!fs.existsSync(SIGNER_PATH)) {
    throw new Error(`missing signer at ${SIGNER_PATH}; run deploy-passport-stamps-shadownet first`);
  }

  const { sk } = JSON.parse(fs.readFileSync(SIGNER_PATH, 'utf8'));
  const signer = await InMemorySigner.fromSecretKey(sk);
  const address = await signer.publicKeyHash();

  console.log('[passport-stamps mint] signer:', address);
  console.log('[passport-stamps mint] minting stamp', STAMP_ID, 'on', KT1);

  const tezos = new TezosToolkit(RPC);
  tezos.setProvider({ signer });

  const contract = await tezos.contract.at(KT1);
  const op = await contract.methodsObject.mint_stamp(STAMP_ID).send({
    gasLimit: 900_000,
    storageLimit: 5_000,
    fee: 1_000_000,
  });
  console.log('[passport-stamps mint] broadcast:', op.hash, `${TZKT_BASE}/${op.hash}`);
  await op.confirmation();
  console.log('[passport-stamps mint] ✓ confirmed');

  const storage = await contract.storage();
  const supply = await storage.stamp_supply.get(STAMP_ID);
  console.log(`[passport-stamps mint] stamp_supply[${STAMP_ID}]:`, supply?.toString?.());
}

main().catch((error) => {
  console.error('[passport-stamps mint] FAILED:', error?.message || error);
  if (error?.errors) console.error(JSON.stringify(error.errors, null, 2));
  process.exit(1);
});
