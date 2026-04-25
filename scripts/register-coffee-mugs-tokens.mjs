#!/usr/bin/env node
/**
 * Register the 5 Coffee Mugs token names + URIs + royalties on the
 * freshly-originated FA2 contract. One admin op, idempotent (the
 * contract refuses if next_token_id != 0).
 *
 * Pre-flight (Mike runs after deploy-coffee-mugs-mainnet.mjs):
 *   - /tmp/pointcast-coffee-mugs-mainnet-kt1.txt    contains the KT1
 *   - /tmp/pointcast-coffee-mugs-signer.json        contains the throwaway sk
 *   - The contract is freshly originated and admin = the throwaway
 *
 * Run:  node scripts/register-coffee-mugs-tokens.mjs
 *
 * Sends a sp.map[sp.nat, sp.string] of:
 *   0 → "Ceramic Mug"
 *   1 → "Espresso Cup"
 *   2 → "Latte Glass"
 *   3 → "Paper Cup"
 *   4 → "Bistro Cup"
 *
 * After this lands, the contract is ready to accept mint_mug() from
 * any caller.
 */

import fs from 'node:fs';
import taquitoPkg from '@taquito/taquito';
import signerPkg from '@taquito/signer';
import michelsonEncoderPkg from '@taquito/michelson-encoder';

const { TezosToolkit, MichelsonMap } = taquitoPkg;
const { InMemorySigner } = signerPkg;

const RPC = 'https://mainnet.api.tez.ie';
const TZKT_BASE = 'https://tzkt.io';

const KT1_PATH = '/tmp/pointcast-coffee-mugs-mainnet-kt1.txt';
const SIGNER_PATH = '/tmp/pointcast-coffee-mugs-signer.json';

const MUG_NAMES = {
  0: 'Ceramic Mug',
  1: 'Espresso Cup',
  2: 'Latte Glass',
  3: 'Paper Cup',
  4: 'Bistro Cup',
};

function log(...args) { console.log('[register]', ...args); }

async function main() {
  if (!fs.existsSync(KT1_PATH)) throw new Error(`missing ${KT1_PATH} — originate first`);
  if (!fs.existsSync(SIGNER_PATH)) throw new Error(`missing ${SIGNER_PATH}`);

  const KT1 = fs.readFileSync(KT1_PATH, 'utf8').trim();
  const { sk } = JSON.parse(fs.readFileSync(SIGNER_PATH, 'utf8'));

  const signer = await InMemorySigner.fromSecretKey(sk);
  const adminAddr = await signer.publicKeyHash();
  log('admin signer:', adminAddr);
  log('contract:', KT1);

  const tezos = new TezosToolkit(RPC);
  tezos.setProvider({ signer });

  const contract = await tezos.contract.at(KT1);

  // Build the Michelson map for register_tokens. Token_ids are nats
  // (small ints), names are strings. SmartPy's sp.map[sp.nat, sp.string]
  // serializes as a MichelsonMap in Taquito.
  const namesMap = new MichelsonMap();
  for (const [tokenId, name] of Object.entries(MUG_NAMES)) {
    namesMap.set(parseInt(tokenId, 10), name);
  }

  log('sending register_tokens with 5 entries…');
  const op = await contract.methodsObject.register_tokens(namesMap).send();
  log('broadcast:', op.hash, `${TZKT_BASE}/${op.hash}`);

  const receipt = await op.confirmation(1);
  log('✓ included in block', receipt?.block?.hash || '(unknown)');
  log('');
  log('Tokens now live on contract:', KT1);
  log('  tzkt:    ', `${TZKT_BASE}/${KT1}/storage`);
  log('  objkt:   ', `https://objkt.com/collection/${KT1}`);
  log('');
  log('NEXT: any caller can now mint_mug(<token_id 0..4>).');
  log('Paste KT1 into src/data/contracts.json under coffee_mugs.mainnet, ship the deploy.');
}

main().catch((err) => {
  console.error('[register] FAILED:', err?.message || err);
  if (err?.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
