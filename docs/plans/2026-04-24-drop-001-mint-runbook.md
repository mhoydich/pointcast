# Drop 001 · Four Fields — mint runbook

- **Filed:** 2026-04-24 ~02:30 PT
- **Staged by:** Claude Code (cc)
- **Blocker on staging:** none — blocks + page + placeholders are live
- **Blocker on mint:** image files + admin-key transfer + signoff (tomorrow with Mike)
- **Target contract:** Visit Nouns FA2, mainnet `KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`
- **Collection page:** `https://pointcast.xyz/drops/001`
- **Blocks:** `0340` · `0341` · `0342` · `0343`

## Pieces (final names)

| # | Slug | Title | Block | Medium | Edition |
|---|------|-------|-------|--------|---------|
| 01 | `el-segundo-print` | El Segundo Print | 0340 | two-color screen print | 20 |
| 02 | `jacaranda-post` | Jacaranda Post | 0341 | painted digital photograph | 20 |
| 03 | `sparrow-in-the-margin` | Sparrow in the Margin | 0342 | canvas-textured print | 15 |
| 04 | `garden-of-the-future` | Garden of the Future | 0343 | collage / retrofuturist poster | 12 |

Totals: **4 pieces · 67 editions · 0 tez (free mint, gas only)**.

## Prereqs before mint

1. **Image files.** Mike drops 4 files into `public/images/editions/drop-001/` with these exact names:
   ```
   drop-001-01-el-segundo-print.png
   drop-001-02-jacaranda-post.png
   drop-001-03-sparrow-in-the-margin.png
   drop-001-04-garden-of-the-future.png
   ```
   (`public/images/editions/drop-001/README.md` has the same list for reference.) Once those land, the `/drops/001` cards render with real imagery automatically.

2. **Admin key transfer.** The Visit Nouns FA2 admin is currently the throwaway signer at `/tmp/pointcast-mainnet-signer.json` (per `src/data/contracts.json._mainnet_notes`). Two paths forward:
   - **Option A (use the throwaway one last time):** keep admin on the throwaway for this mint, then transfer to Mike's wallet (`tz2FjJh…`) in a follow-up `set_administrator` call.
   - **Option B (transfer first):** run `set_administrator → Mike's wallet` now; from then on, all mints signed by Mike's Beacon wallet.
   
   Recommendation: **Option B** — cleaner audit trail, one fewer throwaway action.

3. **IPFS / metadata hosting.** Two choices for TZIP-21 JSON:
   - **Public IPFS pin** via a free pinning service (nft.storage, web3.storage, or a Cloudflare IPFS gateway) — preferred, standard
   - **PointCast HTTPS** via `/api/tezos-metadata/[tokenId]` — already implemented; we can serve the JSON from our own edge
   
   Recommendation: start with PointCast HTTPS for this drop (zero external deps), migrate to IPFS for subsequent drops.

## TZIP-21 metadata shape (per token)

```json
{
  "name": "El Segundo Print",
  "description": "A two-color screen print: royal blue skyline over green wall with potted plant and lemon water. Drop 001 · 01/04 · 'Four Fields.' El Segundo, CA.",
  "symbol": "PCVN",
  "decimals": 0,
  "isBooleanAmount": false,
  "artifactUri": "https://pointcast.xyz/images/editions/drop-001/drop-001-01-el-segundo-print.png",
  "displayUri": "https://pointcast.xyz/images/editions/drop-001/drop-001-01-el-segundo-print.png",
  "thumbnailUri": "https://pointcast.xyz/images/editions/drop-001/drop-001-01-el-segundo-print.png",
  "creators": ["tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw"],
  "rights": "CC BY 4.0",
  "rightsUri": "https://creativecommons.org/licenses/by/4.0/",
  "mimeType": "image/png",
  "formats": [{ "uri": "https://pointcast.xyz/images/editions/drop-001/drop-001-01-el-segundo-print.png", "mimeType": "image/png", "dimensions": { "value": "1024x1024", "unit": "px" } }],
  "tags": ["pointcast", "drop-001", "four-fields", "el-segundo", "screen-print"],
  "attributes": [
    { "name": "drop", "value": "001" },
    { "name": "series", "value": "Four Fields" },
    { "name": "piece", "value": "01 of 04" },
    { "name": "medium", "value": "two-color screen print" },
    { "name": "edition", "value": "20" }
  ]
}
```

Repeat the shape with piece-specific values for 02, 03, 04.

## Mint script sketch — `scripts/mint-drop-001.mjs`

```js
#!/usr/bin/env node
/**
 * Drop 001 · Four Fields — mint script.
 *
 * Runs against Visit Nouns FA2 (mainnet). Requires admin key.
 * Per piece: mint N tokens (edition count) to holding address
 * (Mike's wallet or a dedicated distribution wallet).
 *
 * Shadownet rehearsal first. Then mainnet.
 */
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import fs from 'node:fs';

const NETWORK = process.env.NETWORK || 'shadownet'; // 'shadownet' | 'mainnet'
const RPC = NETWORK === 'mainnet'
  ? 'https://mainnet.ecadinfra.com'
  : 'https://shadownet.ecadinfra.com';
const CONTRACTS = JSON.parse(fs.readFileSync('src/data/contracts.json', 'utf8'));
const KT1 = CONTRACTS.visit_nouns[NETWORK];
const RECIPIENT = process.env.MINT_TO || 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';

const PIECES = [
  { idx: 1, edition: 20, metaUrl: 'https://pointcast.xyz/api/tezos-metadata/drop-001-01' },
  { idx: 2, edition: 20, metaUrl: 'https://pointcast.xyz/api/tezos-metadata/drop-001-02' },
  { idx: 3, edition: 15, metaUrl: 'https://pointcast.xyz/api/tezos-metadata/drop-001-03' },
  { idx: 4, edition: 12, metaUrl: 'https://pointcast.xyz/api/tezos-metadata/drop-001-04' },
];

async function main() {
  const tezos = new TezosToolkit(RPC);
  const keyFile = NETWORK === 'mainnet'
    ? '/tmp/pointcast-mainnet-signer.json'
    : '/tmp/pointcast-shadownet-signer.json';
  const { sk } = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  tezos.setSignerProvider(new InMemorySigner(sk));

  const contract = await tezos.contract.at(KT1);

  // Allocate token IDs sequentially starting from current supply.
  let nextTokenId = await getNextTokenId(contract); // implement via TzKT or contract view

  for (const p of PIECES) {
    const tokenId = nextTokenId++;
    console.log(`→ minting piece 0${p.idx} at tokenId=${tokenId}, edition=${p.edition}`);
    // Mint all N editions in one batch (contract supports bytes metadata URI).
    const op = await contract.methodsObject.mint({
      recipient: RECIPIENT,
      token_id: tokenId,
      amount: p.edition,
      metadata_uri: stringToHex(p.metaUrl),
    }).send();
    await op.confirmation(1);
    console.log(`  opHash: ${op.hash}`);
  }
}

function stringToHex(s) {
  return Buffer.from(s, 'utf8').toString('hex');
}

async function getNextTokenId(contract) {
  // Query TzKT or the contract's bigmap count. Placeholder:
  return 1; // adjust after first mint
}

main().catch((e) => { console.error(e); process.exit(1); });
```

**Do not run** this script until Mike reviews + signs off.

## Post-mint site updates (tomorrow)

After mainnet mint lands:

1. **Convert 4 blocks LINK → MINT.** For each block 0340–0343, replace the `type: "LINK"` with `type: "MINT"` and add the `edition` object:
   ```json
   "type": "MINT",
   "edition": {
     "supply": 20,
     "minted": 20,
     "price": "free",
     "chain": "tezos",
     "contract": "KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh",
     "tokenId": <assigned>,
     "marketplace": "objkt"
   }
   ```

2. **Drop `external.url` in favor of `edition`** — BlockCard's MINT renderer takes over.

3. **`/drops/001`** — swap the placeholder "IMAGE COMING" cards for actual `<img>` (already in place if Mike dropped files), update `status: "staged"` → `status: "live"`, add "COLLECT ON OBJKT" link on each piece.

4. **`/editions`** auto-picks up new tokens via the TzKT fetch at build time.

5. **Write announcement block 0344** — "Drop 001 · Four Fields is live" — CH.FD, READ type, 2-min read, mood: "sprint-pulse", body covering the pieces + mint mechanics + link to `/drops/001`.

6. **Deploy** via `npm run build && npx wrangler pages deploy dist --project-name pointcast --branch main --commit-message "drop 001 live"`.

## Safety

- **Rehearse on shadownet first** (same contract schema, `KT1S8BbKPzWjTRQgnc986Az8A187V886UtK5`) before mainnet
- **Mike signs all mainnet ops** via Beacon once admin is transferred — no more throwaway key for production mints
- **Image hashes** recorded in a sidecar file (`docs/plans/drop-001-hashes.txt`) so the exact bytes minted are auditable

## Change log

- 2026-04-24 02:30 PT · cc · staged (this doc, 4 blocks, /drops/001 page, image placeholders)
- (next) 2026-04-24 TBD · Mike × cc · image upload + admin transfer + metadata pin
- (next) 2026-04-24 TBD · cc · shadownet rehearsal
- (next) 2026-04-24 TBD · Mike × cc · mainnet mint + post-mint site updates + announcement 0344
