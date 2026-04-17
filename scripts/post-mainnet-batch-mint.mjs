#!/usr/bin/env node
/**
 * Batch-mint starter Nouns on the fresh mainnet Visit Nouns FA2 so
 * objkt.com/collection/<KT1> has visible inventory within minutes of
 * origination.
 *
 * Signs with the throwaway mainnet key (same one that originated the
 * contract). Each mint = 1 op = 1 block on Tezos mainnet, so the batch
 * takes ~5-8 minutes for 10 tokens.
 *
 * Pick the noun ids deliberately — these are the first tokens on the
 * contract and show up at the top of objkt's collection page forever.
 */

import fs from 'node:fs';
import taquitoPkg from '@taquito/taquito';
import signerPkg from '@taquito/signer';

const { TezosToolkit } = taquitoPkg;
const { InMemorySigner } = signerPkg;

const RPC = 'https://mainnet.api.tez.ie';
const TZKT = 'https://tzkt.io';
const SIGNER_PATH = '/tmp/pointcast-mainnet-signer.json';
const KT1_PATH = '/tmp/pointcast-visit-nouns-mainnet-kt1.txt';

// Starter set — these noun ids become token ids #0..#9 on the contract.
// 137 is the PointCast identity noun (Mike's avatar). Others are
// hand-picked for visual range + resonance.
const STARTER_NOUNS = [137, 205, 420, 417, 1, 42, 99, 777, 808, 1111];

function log(...args) { console.log('[batch-mint]', ...args); }

async function main() {
  if (!fs.existsSync(SIGNER_PATH)) throw new Error(`missing ${SIGNER_PATH}`);
  if (!fs.existsSync(KT1_PATH)) throw new Error(`missing ${KT1_PATH} — originate first`);
  const { sk } = JSON.parse(fs.readFileSync(SIGNER_PATH, 'utf8'));
  const KT1 = fs.readFileSync(KT1_PATH, 'utf8').trim();

  const signer = await InMemorySigner.fromSecretKey(sk);
  const address = await signer.publicKeyHash();
  log('signer:', address);
  log('contract:', KT1);

  const tezos = new TezosToolkit(RPC);
  tezos.setProvider({ signer });
  const contract = await tezos.contract.at(KT1);

  for (let i = 0; i < STARTER_NOUNS.length; i++) {
    const nounId = STARTER_NOUNS[i];
    log(`minting noun #${nounId} (${i + 1}/${STARTER_NOUNS.length})…`);
    try {
      const op = await contract.methodsObject.mint_noun(nounId).send({
        gasLimit: 900_000,
        storageLimit: 5_000,
        fee: 500_000,
      });
      log('  op:', op.hash, `${TZKT}/${op.hash}`);
      await op.confirmation();
      log('  ✓ confirmed');
    } catch (err) {
      log('  ✗ FAILED:', err?.message || err);
      // Don't abort the batch on one failure — common cause is temporary
      // RPC hiccup, retry by running the script again (which will try
      // the same noun twice, but the contract's idempotency via
      // noun_supply check handles that).
    }
  }

  log('');
  log('batch complete. confirm on objkt:');
  log(`  https://objkt.com/collection/${KT1}`);
  log('and on tzkt:');
  log(`  https://tzkt.io/${KT1}/operations`);
}

main().catch((err) => {
  console.error('[batch-mint] FAILED:', err?.message || err);
  process.exit(1);
});
