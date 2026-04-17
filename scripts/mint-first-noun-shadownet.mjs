#!/usr/bin/env node
/**
 * End-to-end mint smoke test for the Visit Nouns FA2 on Shadownet.
 * Calls `mint_noun(<noun_id>)` on the freshly-originated KT1 to verify
 * the entrypoint + storage are wired correctly.
 *
 * Uses the same InMemorySigner the origination used.
 */

import fs from 'node:fs';
import taquitoPkg from '@taquito/taquito';
import signerPkg from '@taquito/signer';

const { TezosToolkit } = taquitoPkg;
const { InMemorySigner } = signerPkg;

const RPC = 'https://shadownet.smartpy.io';
const TZKT_BASE = 'https://shadownet.tzkt.io';
const SIGNER_PATH = '/tmp/pointcast-shadownet-signer.json';
const KT1 = 'KT1S8BbKPzWjTRQgnc986Az8A187V886UtK5';

const NOUN_ID = Number(process.argv[2] ?? 137); // default: PointCast's identity noun

async function main() {
  const { sk } = JSON.parse(fs.readFileSync(SIGNER_PATH, 'utf8'));
  const signer = await InMemorySigner.fromSecretKey(sk);
  const address = await signer.publicKeyHash();
  console.log('[mint] signer:', address);
  console.log('[mint] minting noun', NOUN_ID, 'on', KT1);

  const tezos = new TezosToolkit(RPC);
  tezos.setProvider({ signer });

  const contract = await tezos.contract.at(KT1);
  // free mint (mint_price_mutez=0 in storage) — caller gets token #0 for this noun
  const op = await contract.methodsObject.mint_noun(NOUN_ID).send({
    gasLimit: 900_000,
    storageLimit: 5_000,
    fee: 1_000_000,
  });
  console.log('[mint] broadcast:', op.hash, `${TZKT_BASE}/${op.hash}`);

  await op.confirmation();
  console.log('[mint] ✓ confirmed');

  // Read back: token_id, owner, balance
  const storage = await contract.storage();
  console.log('[mint] storage.next_token_id:', storage.next_token_id?.toString?.());
  console.log('[mint] storage.noun_supply[' + NOUN_ID + ']:',
    (await storage.noun_supply.get(NOUN_ID))?.toString?.());
}

main().catch(err => {
  console.error('[mint] FAILED:', err?.message || err);
  if (err?.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
