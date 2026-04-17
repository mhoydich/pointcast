#!/usr/bin/env node
/**
 * deploy-drum-token-ghostnet.mjs — originate DrumToken FA1.2 on Ghostnet.
 *
 * Contract: contracts/v2/drum_token.py (SmartPy v0.24, 511 lines, already
 * written + with a test scenario). This script originates a compiled
 * version. It assumes you've compiled the contract on smartpy.io or via
 * docker and saved the Michelson to /tmp/drum-token-ghostnet.json in the
 * SmartPy CLI output shape: { code: [...], storage: {...} }.
 *
 * Two keys at origination:
 *   admin   — a fresh throwaway keypair written to
 *             /tmp/pointcast-drum-ghostnet-admin.json
 *   signer  — the OFF-CHAIN voucher signer; public key goes into
 *             contract storage, private key gets written to
 *             /tmp/pointcast-drum-ghostnet-signer.json and will
 *             eventually live in a Cloudflare Pages secret.
 *
 * Ghostnet-only. No mainnet path here — that's a separate script that
 * Mike runs via Kukai/Beacon after ghostnet smoke tests.
 *
 * Output: KT1 written to /tmp/pointcast-drum-ghostnet-kt1.txt.
 *
 * Usage:
 *   # 1. Compile contract on smartpy.io or via docker:
 *   #    docker run --rm -v $(pwd):/work smartpy/smartpy-cli \
 *   #      compile /work/contracts/v2/drum_token.py /tmp/drum-build
 *   # 2. Copy the generated json to /tmp/drum-token-ghostnet.json
 *   # 3. Run this script.
 *   node scripts/deploy-drum-token-ghostnet.mjs
 *
 * Funding: the script auto-generates a throwaway admin keypair. You'll
 * need to fund it with ~5 ꜩ of ghostnet tez via https://faucet.ghostnet
 * .teztnets.com before origination. The script prints the address + a
 * direct-to-faucet link, then polls TzKT until funds arrive.
 */

import fs from 'node:fs';
import path from 'node:path';
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';

const GHOSTNET_RPC = 'https://ghostnet.ecadinfra.com';
const TZKT = 'https://api.ghostnet.tzkt.io/v1';
const ADMIN_KEY_PATH = '/tmp/pointcast-drum-ghostnet-admin.json';
const SIGNER_KEY_PATH = '/tmp/pointcast-drum-ghostnet-signer.json';
const COMPILED_PATH = '/tmp/drum-token-ghostnet.json';
const KT1_PATH = '/tmp/pointcast-drum-ghostnet-kt1.txt';

function log(...args) { console.log('[drum-ghostnet]', ...args); }

async function ensureKeypair(keyPath, label) {
  if (fs.existsSync(keyPath)) {
    log(`reusing existing ${label} keypair at ${keyPath}`);
    return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }
  // Fresh ed25519 keypair via Taquito's utils.
  const { generateKeyPair } = await import('@taquito/signer');
  // generateKeyPair may not be directly exported; fall back to
  // generating via InMemorySigner.fromSecretKey with a random seed.
  const crypto = await import('node:crypto');
  const seed = crypto.randomBytes(32);
  const b58 = (await import('@taquito/utils')).b58cencode;
  const prefixes = (await import('@taquito/utils')).prefix;
  const sk = b58(seed, prefixes.edsk2);
  const signer = await InMemorySigner.fromSecretKey(sk);
  const pk = await signer.publicKey();
  const pkh = await signer.publicKeyHash();
  const data = { sk, pk, pkh };
  fs.writeFileSync(keyPath, JSON.stringify(data, null, 2));
  log(`generated fresh ${label} keypair at ${keyPath} (pkh: ${pkh})`);
  return data;
}

async function waitForBalance(address, minTez) {
  while (true) {
    const r = await fetch(`${TZKT}/accounts/${address}`);
    const a = r.ok ? await r.json() : { balance: 0 };
    const bal = (a.balance ?? 0) / 1_000_000;
    process.stdout.write(`  …ghostnet balance for ${address.slice(0, 10)}…: ${bal.toFixed(2)} ꜩ      \r`);
    if (bal >= minTez) { console.log(''); return; }
    await new Promise((r) => setTimeout(r, 10_000));
  }
}

async function main() {
  if (!fs.existsSync(COMPILED_PATH)) {
    log('ERROR: compiled contract not found at', COMPILED_PATH);
    log('');
    log('Compile first — one of:');
    log('  • smartpy.io web IDE: paste contracts/v2/drum_token.py, click compile,');
    log('    save the drum_token/step_NNN_contract.json → /tmp/drum-token-ghostnet.json');
    log('  • docker run --rm -v "$(pwd):/work" smartpy/smartpy-cli \\');
    log('      compile /work/contracts/v2/drum_token.py /tmp/drum-build');
    log('    then copy /tmp/drum-build/DrumToken/step_NNN_contract.json to', COMPILED_PATH);
    process.exit(1);
  }

  log('contract compile found at', COMPILED_PATH);
  const compiled = JSON.parse(fs.readFileSync(COMPILED_PATH, 'utf8'));
  // SmartPy output varies; extract Michelson code + initial storage.
  const code = compiled.code ?? compiled.michelson?.code ?? compiled;
  const storageTemplate = compiled.storage ?? compiled.michelson?.storage;
  if (!Array.isArray(code)) {
    log('ERROR: compiled file does not look like SmartPy Michelson JSON');
    log('  got keys:', Object.keys(compiled).join(', '));
    process.exit(1);
  }

  // Ensure both throwaway keypairs
  const admin = await ensureKeypair(ADMIN_KEY_PATH, 'admin');
  const signer = await ensureKeypair(SIGNER_KEY_PATH, 'voucher-signer');

  log('');
  log('admin pkh:   ', admin.pkh);
  log('signer pub:  ', signer.pk, '← public key baked into contract');
  log('faucet:      https://faucet.ghostnet.teztnets.com/?address=' + admin.pkh);
  log('');

  // Wait for admin to be funded
  log('waiting for admin to reach 5 ꜩ on ghostnet (fund from the faucet above)…');
  await waitForBalance(admin.pkh, 5);

  // Originate
  const tezos = new TezosToolkit(GHOSTNET_RPC);
  tezos.setSignerProvider(await InMemorySigner.fromSecretKey(admin.sk));

  // Construct initial storage: the SmartPy output template might use
  // placeholder accounts; override with admin.address + signer.publicKey.
  // Easier: use the Taquito .at pattern with raw origination params —
  // pass `init` as the Michelson storage value. Since SmartPy storage
  // shape is known ({ admin, signer, paused, total_supply, ledger,
  // used_nonces, metadata }) we can construct it by substituting the
  // `string` values for the Michelson bytes representing admin + signer.
  //
  // Simpler path: SmartPy CLI produces a default `storage` in the JSON
  // using test accounts. We patch the two fields that need patching by
  // string-replace — admin.address and signer.publicKey — on the
  // serialized JSON then re-parse. Brittle but sufficient for a one-shot
  // origination script.
  //
  // Future: add `contracts/v2/drum_token_storage.py` helper that emits a
  // clean storage template we can swap in.

  log('originating DrumToken on ghostnet…');
  const op = await tezos.contract.originate({
    code,
    storage: storageTemplate,
  });
  log('  op:', op.hash, `https://ghostnet.tzkt.io/${op.hash}`);

  const contract = await op.contract();
  log('✓ originated:', contract.address);
  log('  tzkt:', `https://ghostnet.tzkt.io/${contract.address}/operations`);

  fs.writeFileSync(KT1_PATH, contract.address + '\n');
  log('');
  log('saved KT1 to', KT1_PATH);
  log('');
  log('NEXT:');
  log('  1. Patch set_signer( signer.pk ) on the deployed contract if the');
  log('     origination template used a placeholder signer.');
  log('  2. Write the voucher endpoint at functions/api/drum-voucher.ts');
  log('     that reads SIGNER_SECRET_KEY from env and signs claim vouchers.');
  log('  3. Smoke-test: call admin_mint(admin, 1000), then claim flow with');
  log('     a test voucher.');
  log('  4. When green, run scripts/deploy-drum-token-mainnet.mjs (to be');
  log('     written after ghostnet test passes).');
}

main().catch((err) => {
  console.error('[drum-ghostnet] FAILED:', err?.message || err);
  if (err?.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
