#!/usr/bin/env node
/**
 * Pull every token minted on the Visit Nouns FA2 and write one Block
 * per token. Runs from the TzKT indexer, so it self-updates as new
 * mints land — rerun anytime to pick up new Nouns on the collection
 * and refresh the grid.
 *
 * Block IDs: 0230-series (reserved for on-chain Visit Nouns mints,
 * parallel to the 0300-series which holds Mike's broader Tezos
 * collection via import-tezos-collection.mjs).
 *
 * Channel: FCT (Faucet) — these Nouns originated from the faucet
 * pipeline and live on the PointCast FA2. If/when a different
 * channel fits future mints better, wire that in here.
 *
 * Type: LINK pointing at objkt.com/tokens/{contract}/{tokenId}.
 * MINT type was considered but the current contract is admin-only
 * minting — users collect via objkt secondary, not by calling mint
 * here. LINK reflects the actual user action honestly.
 *
 * Usage: node scripts/import-visit-nouns.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const CONTRACTS_JSON = path.resolve(process.cwd(), 'src/data/contracts.json');
const OUT_DIR = path.resolve(process.cwd(), 'src/content/blocks');
const TZKT = 'https://api.tzkt.io/v1';
const BLOCK_ID_START = 230;
const BLOCK_ID_END = 279; // up to 50 Visit Nouns before we need a new range

function log(...args) { console.log('[visit-nouns-import]', ...args); }

async function main() {
  const contracts = JSON.parse(fs.readFileSync(CONTRACTS_JSON, 'utf8'));
  const KT1 = contracts.visit_nouns?.mainnet;
  if (!KT1 || !KT1.startsWith('KT1')) {
    log('ERROR: no mainnet KT1 in contracts.json.visit_nouns.mainnet');
    log('  (origination must have run first via post-mainnet-auto.sh)');
    process.exit(1);
  }
  log('contract:', KT1);

  // TzKT returns tokens ordered by tokenId asc by default. We sort by
  // firstTime (when the token was minted) ascending so Block IDs follow
  // the mint chronology.
  const r = await fetch(`${TZKT}/tokens?contract=${KT1}&limit=50&sort=firstTime`);
  if (!r.ok) {
    log('TzKT fetch failed:', r.status, await r.text());
    process.exit(1);
  }
  const tokens = await r.json();
  log('tokens on chain:', tokens.length);

  if (tokens.length > BLOCK_ID_END - BLOCK_ID_START + 1) {
    log('WARN: more tokens than reserved Block IDs. truncating to',
        BLOCK_ID_END - BLOCK_ID_START + 1);
  }

  // Purge any existing blocks in the 0230-0279 range so we never leave
  // a stale Block for a delisted token.
  for (let i = BLOCK_ID_START; i <= BLOCK_ID_END; i++) {
    const p = path.join(OUT_DIR, `${String(i).padStart(4, '0')}.json`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  let written = 0;
  for (let i = 0; i < tokens.length && i <= BLOCK_ID_END - BLOCK_ID_START; i++) {
    const t = tokens[i];
    const tokenId = t.tokenId;
    const nounSeed = Number(tokenId); // tokenId === noun seed for Visit Nouns
    const blockId = String(BLOCK_ID_START + i).padStart(4, '0');

    // Image: noun.pics is the definitive rendering for every Nouns seed.
    // No IPFS fallback needed — noun.pics has been rock-solid, unlike
    // cloudflare-ipfs which was sunset.
    const image = `https://noun.pics/${nounSeed}.svg`;

    const block = {
      id: blockId,
      channel: 'FCT',
      type: 'LINK',
      title: `Visit Noun #${tokenId}`,
      dek: `One of ${tokens.length} minted on the PointCast Visit Nouns FA2. Admin-minted, 1/1 per Noun seed.`,
      body: `Minted on Tezos mainnet at ${t.firstTime}. Collectible via objkt secondary as the current holder lists.`,
      timestamp: t.firstTime,
      size: '1x1',
      noun: nounSeed,
      media: { kind: 'image', src: image },
      external: {
        label: 'View on objkt',
        url: `https://objkt.com/tokens/${KT1}/${tokenId}`,
      },
      meta: {
        source: 'visit-nouns-fa2',
        contract: KT1,
        tokenId: String(tokenId),
        supply: String(t.totalSupply ?? '1'),
        mintedAt: t.firstTime,
        nounSeed: String(nounSeed),
        chain: 'tezos-mainnet',
      },
    };

    fs.writeFileSync(
      path.join(OUT_DIR, `${blockId}.json`),
      JSON.stringify(block, null, 2) + '\n'
    );
    written++;
    log(`  wrote /b/${blockId} — Noun #${tokenId}`);
  }

  log('done.', written, 'Block JSON(s) written to', OUT_DIR);
  log('NEXT: npm run build && wrangler pages deploy dist --project-name pointcast');
}

main().catch((err) => {
  console.error('[visit-nouns-import] FAILED:', err?.message || err);
  process.exit(1);
});
