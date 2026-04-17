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
const MAINNET_PLACEHOLDER = 'KT1_MAINNET_PLACEHOLDER'; // swapped out of Block 0229 when origination lands
const CONTRACTS_JSON = path.resolve(process.cwd(), 'src/data/contracts.json');
const BLOCKS_DIR = path.resolve(process.cwd(), 'src/content/blocks');
const COMMEMORATIVE_BLOCK = path.resolve(process.cwd(), 'src/content/blocks/0229.json');

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

  // 2. Rewrite any Block JSONs that reference the Shadownet KT1 → mainnet KT1,
  //    and swap the KT1_MAINNET_PLACEHOLDER token in Block 0229 (the
  //    commemorative "FA2 live on mainnet" NOTE that was pre-staged as a draft).
  let blocksChanged = 0;
  for (const file of fs.readdirSync(BLOCKS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const p = path.join(BLOCKS_DIR, file);
    const raw = fs.readFileSync(p, 'utf8');
    if (!raw.includes(SHADOWNET_KT1) && !raw.includes(MAINNET_PLACEHOLDER)) continue;
    const updated = raw
      .replaceAll(SHADOWNET_KT1, MAINNET_KT1)
      .replaceAll(MAINNET_PLACEHOLDER, MAINNET_KT1);
    fs.writeFileSync(p, updated);
    blocksChanged++;
    log('✓ block', file, 'switched to mainnet KT1');
  }
  log('blocks updated:', blocksChanged);

  // 3. Flip the commemorative origination block (0229) from draft → live.
  //    It was pre-staged as draft:true so the Blocks grid stays honest before
  //    the contract exists. Now that it does, publish it.
  if (fs.existsSync(COMMEMORATIVE_BLOCK)) {
    const data = JSON.parse(fs.readFileSync(COMMEMORATIVE_BLOCK, 'utf8'));
    if (data.draft === true) {
      data.draft = false;
      data.timestamp = new Date().toISOString(); // anchor to the actual origination moment
      fs.writeFileSync(COMMEMORATIVE_BLOCK, JSON.stringify(data, null, 2) + '\n');
      log('✓ block 0229 flipped draft:true → draft:false (origination commemorative)');
    } else {
      log('block 0229 already live — skipping');
    }
  }

  log('');
  log('NEXT: review diff → git commit → npm run build → wrangler pages deploy');
  log('  git diff src/data/contracts.json src/content/blocks/');
}

main().catch((err) => {
  console.error('[wire] FAILED:', err?.message || err);
  process.exit(1);
});
