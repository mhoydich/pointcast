#!/usr/bin/env node
/**
 * Deploy DailyAuction (contracts/v2/daily_auction.py) to Shadownet via
 * direct Taquito + InMemorySigner. Mirrors the Visit Nouns shadownet
 * deploy pattern. Skips Beacon/Kukai entirely.
 *
 * Prereq — compile the contract on smartpy.io:
 *   1. Open contracts/v2/daily_auction.py in the SmartPy online IDE
 *      (https://smartpy.io/ide) and run the test. v0.24.1 required.
 *   2. Export the compilation outputs:
 *        - daily_auction.tz      (Michelson)
 *        - daily_auction_storage.tz  (initial storage)
 *      Or save the Michelson JSON directly from the online compiler.
 *   3. Save Michelson JSON to /tmp/pointcast-daily-auction-contract.json
 *      and storage JSON to /tmp/pointcast-daily-auction-storage.json.
 *
 * Constructor args to patch into storage before deploy:
 *   administrator         — this script's deploy signer tz1 (Mike rotates later)
 *   visit_nouns_fa2       — read from src/data/contracts.json → visit_nouns.shadownet
 *   treasury              — for v0 shadownet test: same as administrator (placeholder)
 *   first_noun_id         — 0
 *   starts_at             — next UTC midnight from now
 *   duration_sec          — 86400
 *   reserve_price_mutez   — 0
 *   min_increment_bps     — 500  (5%)
 *   extend_window_sec     — 600  (10min)
 *   extend_by_sec         — 900  (15min)
 *   keeper_tip_bps        — 50   (0.5%)
 *
 * Usage:
 *   node scripts/deploy-daily-auction-shadownet.mjs
 *
 * On success, copy the returned KT1 into src/data/contracts.json →
 * daily_auction.shadownet and redeploy Pages. The /auction page will
 * switch to live shadownet display.
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import taquitoPkg from '@taquito/taquito';
import signerPkg from '@taquito/signer';

const { TezosToolkit } = taquitoPkg;
const { InMemorySigner } = signerPkg;

const RPC = 'https://shadownet.smartpy.io';
const TZKT_BASE = 'https://shadownet.tzkt.io';

const CODE_PATH = '/tmp/pointcast-daily-auction-contract.json';
const STORAGE_PATH = '/tmp/pointcast-daily-auction-storage.json';
const SIGNER_PATH = '/tmp/pointcast-shadownet-signer.json';
const CONTRACTS_JSON = new URL('../src/data/contracts.json', import.meta.url).pathname;

function log(...args) {
  console.log('[deploy-daily-auction]', ...args);
}

function nextUtcMidnight() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return Math.floor(d.getTime() / 1000); // epoch seconds, matching Tezos timestamp
}

async function loadSigner() {
  if (!fs.existsSync(SIGNER_PATH)) {
    log('ERR: no signer at', SIGNER_PATH);
    log('    Run scripts/deploy-visit-nouns-shadownet.mjs first to mint one.');
    process.exit(1);
  }
  const { sk } = JSON.parse(fs.readFileSync(SIGNER_PATH, 'utf8'));
  return InMemorySigner.fromSecretKey(sk);
}

async function getBalanceTez(tezos, address) {
  const mutez = await tezos.rpc.getBalance(address);
  return Number(mutez) / 1_000_000;
}

async function main() {
  if (!fs.existsSync(CODE_PATH)) {
    log('ERR: no compiled Michelson at', CODE_PATH);
    log('    Compile contracts/v2/daily_auction.py on smartpy.io first.');
    log('    Save the Michelson JSON output to that path.');
    process.exit(1);
  }
  if (!fs.existsSync(STORAGE_PATH)) {
    log('ERR: no storage JSON at', STORAGE_PATH);
    log('    Save the initial storage Michelson JSON to that path.');
    process.exit(1);
  }

  const tezos = new TezosToolkit(RPC);
  const signer = await loadSigner();
  tezos.setProvider({ signer });
  const address = await signer.publicKeyHash();
  log('signer tz1:', address);

  const bal = await getBalanceTez(tezos, address);
  log('balance (tez):', bal);
  if (bal < 3) {
    log('LOW BALANCE. Fund at https://faucet.shadownet.teztnets.com and retry.');
    process.exit(1);
  }

  // Read Visit Nouns FA2 shadownet address from contracts.json.
  const cj = JSON.parse(fs.readFileSync(CONTRACTS_JSON, 'utf8'));
  const visitNounsShadownet = cj.visit_nouns?.shadownet ?? '';
  if (!visitNounsShadownet) {
    log('ERR: no visit_nouns.shadownet address in contracts.json');
    process.exit(1);
  }
  log('visit_nouns_fa2 (shadownet):', visitNounsShadownet);

  // Read + patch storage. The storage JSON is the raw Michelson; we just
  // replace the relevant fields. (If your compiler emits a SmartPy-style
  // "initial_storage" JSON, adjust the patching logic accordingly.)
  const rawStorage = fs.readFileSync(STORAGE_PATH, 'utf8');
  const startsAt = nextUtcMidnight();
  log('starts_at (epoch seconds):', startsAt, '→', new Date(startsAt * 1000).toISOString());

  // Patching strategy: assume the storage JSON contains placeholder strings
  // like "tz1ADMINISTRATOR", "KT1VISITNOUNS", "tz1TREASURY", "STARTS_AT".
  // If your emitted storage uses literal addresses, adjust this section.
  const patched = rawStorage
    .replace(/tz1ADMINISTRATOR/g, address)
    .replace(/KT1VISITNOUNS/g, visitNounsShadownet)
    .replace(/tz1TREASURY/g, address) // shadownet: treasury = admin for testing
    .replace(/"STARTS_AT"/g, `"${new Date(startsAt * 1000).toISOString()}"`);

  let storageJson;
  try {
    storageJson = JSON.parse(patched);
  } catch (err) {
    log('ERR: storage JSON did not parse after patching.', err.message);
    log('Open', STORAGE_PATH, 'and patch manually if placeholders differ.');
    process.exit(1);
  }

  const codeJson = JSON.parse(fs.readFileSync(CODE_PATH, 'utf8'));

  log('originating DailyAuction…');
  const op = await tezos.contract.originate({
    code: codeJson,
    init: storageJson,
  });
  await op.confirmation(1);
  const contract = await op.contract();
  const addr = contract.address;
  log('✅ DailyAuction at', addr);
  log('tzkt:', `${TZKT_BASE}/${addr}`);
  log('\nNext: paste', addr, 'into src/data/contracts.json → daily_auction.shadownet');
}

main().catch((err) => {
  log('FATAL:', err?.message || err);
  process.exit(1);
});
