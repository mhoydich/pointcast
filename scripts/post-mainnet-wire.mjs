#!/usr/bin/env node
/**
 * Post-mainnet wiring — runs as soon as the mainnet origination watcher
 * succeeds. Reads /tmp/pointcast-visit-nouns-mainnet-kt1.txt, updates
 * src/data/contracts.json + every Block with an `edition.contract` that
 * currently references the Shadownet KT1, then writes the diff. Does NOT
 * deploy — commit + deploy is the caller's choice.
 *
 * Idempotent: re-running with the same KT1 is a no-op.
 */

import fs from 'node:fs';
import path from 'node:path';

const KT1_PATH = '/tmp/pointcast-visit-nouns-mainnet-kt1.txt';
const SHADOWNET_KT1 = 'KT1S8BbKPzWjTRQgnc986Az8A187V886UtK5';
const CONTRACTS_JSON = path.resolve(process.cwd(), 'src/data/contracts.json');
const BLOCKS_DIR = path.resolve(process.cwd(), 'src/content/blocks');

function log(...args) { console.log('[wire]', ...args); }

async function main() {
  if (!fs.existsSync(KT1_PATH)) {
    log('no mainnet KT1 yet at', KT1_PATH, '— origination watcher must complete first');
    process.exit(1);
  }
  const MAINNET_KT1 = fs.readFileSync(KT1_PATH, 'utf8').trim();
  if (!MAINNET_KT1.startsWith('KT1')) {
    log('bad KT1 in', KT1_PATH, ':', MAINNET_KT1);
    process.exit(1);
  }
  log('mainnet KT1:', MAINNET_KT1);

  // 1. Update contracts.json
  const contracts = JSON.parse(fs.readFileSync(CONTRACTS_JSON, 'utf8'));
  if (contracts.visit_nouns.mainnet === MAINNET_KT1) {
    log('contracts.json already points at', MAINNET_KT1, '— skipping');
  } else {
    contracts.visit_nouns.mainnet = MAINNET_KT1;
    contracts.visit_nouns._mainnet_notes = {
      originatedAt: new Date().toISOString(),
      originator: 'tz1PS4WgbYCKcKnfbfMNSH44JfrnFVhkcKp1',
      signerKeyFile: '/tmp/pointcast-mainnet-signer.json',
      note: 'Originated via scripts/deploy-visit-nouns-mainnet.mjs. Admin is the throwaway signer — transfer to Mike\'s mainnet wallet via set_administrator as a second step.',
    };
    fs.writeFileSync(CONTRACTS_JSON, JSON.stringify(contracts, null, 2) + '\n');
    log('✓ contracts.json updated');
  }

  // 2. Rewrite any Block JSONs that reference the Shadownet KT1 → mainnet KT1.
  //    Only Block 0209 (now LINK, no edition) and 0210 (FAUCET w/ Shadownet KT1)
  //    and 0220 (Battler teaser, no edition) exist — so in practice this is 0210.
  let blocksChanged = 0;
  for (const file of fs.readdirSync(BLOCKS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const p = path.join(BLOCKS_DIR, file);
    const raw = fs.readFileSync(p, 'utf8');
    if (!raw.includes(SHADOWNET_KT1)) continue;
    const updated = raw.replaceAll(SHADOWNET_KT1, MAINNET_KT1);
    fs.writeFileSync(p, updated);
    blocksChanged++;
    log('✓ block', file, 'switched to mainnet KT1');
  }
  log('blocks updated:', blocksChanged);

  log('');
  log('NEXT: review diff → git commit → npm run build → wrangler pages deploy');
  log('  git diff src/data/contracts.json src/content/blocks/');
}

main().catch((err) => {
  console.error('[wire] FAILED:', err?.message || err);
  process.exit(1);
});
