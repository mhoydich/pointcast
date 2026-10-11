/**
 * Nouns Money on the PointCast chain (pointcast-devnet-2), Phase A.
 *
 * Everything chain-side on pointcast.xyz sits behind NM_CHAIN_ENABLED. While
 * it is false the site renders exactly as before this module existed:
 *   - /nouns-money/ and /nouns-money/collect/ render no shelf, no script;
 *   - /nouns-money/note/[serial] builds no pages;
 *   - /nouns-money/catalog.json keeps its live "No mint, token ownership…" line
 *     (src/lib/nouns-money/catalog.ts is untouched: the client bundle imports it).
 * tests/nouns-money-chain-flag-off.test.mjs compares the flag-off build with
 * origin/main's.
 *
 * Turning it on is Phase C (plan §3), after the edition is open on devnet-2
 * (Phase B). assertNmChainReady() fails the build if the flag is on while a
 * gap remains (renderer hash unpinned, banned words on a chain surface).
 *
 * Source: the Nouns Money chain plan (2026-10-10), sections 2, 3 and 6.
 */
import {
  NM_COPIES_PER_DESIGN,
  NM_DESIGNS,
  NM_EDITION_ID,
  NM_RECIPE_LEN,
  NM_RECIPE_VERSION,
  NM_SERIES,
  NM_SUPPLY,
  NM_UNIQUE_KEY_LEN,
} from '../../public/nouns-money/chain/nm-recipe.js';
import { DEVNET } from './chain-home.ts';
import { NM_COPY, allCopyStrings } from '../lib/nouns-money/chain-copy.mjs';
import { scanSource, scanText } from '../lib/nouns-money/honest-copy.mjs';

/** THE FLAG. Off until Phase C (edition open on devnet-2, copy signed off). */
export const NM_CHAIN_ENABLED: boolean = false;

/**
 * The edition terms, frozen at open (plan §3). The devnet's POST /admin/edition
 * takes them in Phase B; they are here so pages, tests and the checklist read
 * one copy.
 */
export const NM_EDITION_TERMS = Object.freeze({
  id: NM_EDITION_ID,
  /** Printable ASCII ≤ 64 (edition.rs). The plan names none; this matches pointcast-chain sdk/nm-law.js NM_TERMS. */
  title: 'Nouns Money 27',
  supply: NM_SUPPLY, // 1,100 = 100 specimens + 10 copies × 100 designs
  /** 0 = no chain cap; the Worker allows one claim per passkey per UTC day. */
  per_account: 0,
  closes_at: 0,
  /** The devnet forces the house as attestor; the key is the devnet's, not ours to type. */
  attestor: 'house' as const,
  transferable: false,
  royalty_bps: 0,
  recipe_schema: 0,
  unique_key_len: NM_UNIQUE_KEY_LEN, // series ‖ design ‖ copy
  /**
   * sha256 of pointcast-chain sdk/nm-note.js. INTEGRATION: null until that file
   * lands on the chain side; the flag cannot turn on while it is null.
   */
  renderer_hash: null as string | null,
  l1_ref: null,
});

export const NM_RECIPE = Object.freeze({
  version: NM_RECIPE_VERSION,
  series: NM_SERIES,
  bytes: NM_RECIPE_LEN,
  designs: NM_DESIGNS,
  copiesPerDesign: NM_COPIES_PER_DESIGN,
});

/** What the Worker enforces (pointcast-chain deploy/devnet-worker nm.js, plan §3 step 3). */
export const NM_CLAIM_POLICY = Object.freeze({
  claimsPerPasskeyPerUtcDay: 1,
  passkeyOnly: true,
  holdBlocks: 24,
});

/** Where the shelf and the note page read and write. */
export const NM_DEVNET = Object.freeze({
  api: DEVNET.url,
  chainId: DEVNET.chainId,
  genesis: DEVNET.genesis,
  rpId: 'pointcast.xyz',
  origins: ['https://pointcast.xyz'],
  edition: NM_EDITION_ID,
  /** POST {sender, design} → an approval for a server-built recipe (plan §3 step 3). */
  claimPath: '/nm/claim',
  /** Same key as /chain/first-mints/live.js: one passkey wallet for both. */
  walletKey: 'pc-fm-live:devnet-2',
  chainJson: '/nouns-money/chain.json',
  yardHref: `${DEVNET.yardHref}&lens=mints`,
});

/** The JSON the client scripts read: config + every string they show. */
export function nmClientConfig() {
  return { devnet: NM_DEVNET, copies: NM_COPIES_PER_DESIGN, designs: NM_DESIGNS, copy: NM_COPY };
}

/** Escape for <script type="application/json">. */
export const jsonIsland = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c');

/** Pages that render a chain surface when the flag is on: their copy must scan clean before it turns on. */
export const NM_CHAIN_SURFACE_SOURCES = Object.freeze([
  '/src/pages/nouns-money.astro',
  '/src/pages/nouns-money/collect.astro',
  '/src/pages/nouns-money/note/[serial].astro',
  '/src/components/NounsMoneyChainShelf.astro',
  '/src/components/NounsMoneyCollection.astro',
  '/src/pages/nouns-money/catalog.json.ts',
]);

/**
 * Why the flag cannot be on yet. `sources` maps a surface path to its raw text
 * (the build passes import.meta.glob ?raw; tests pass readFileSync).
 */
export function nmChainGaps(sources: Record<string, string> = {}): string[] {
  const gaps: string[] = [];
  const copyHits = scanText(allCopyStrings().join('\n'));
  if (copyHits.length) gaps.push(`chain-copy.mjs uses banned words: ${[...new Set(copyHits.map((h) => h.match))].join(', ')}`);
  if (!/^[0-9a-f]{64}$/.test(NM_EDITION_TERMS.renderer_hash ?? '')) gaps.push('renderer_hash is not pinned (sha256 of pointcast-chain sdk/nm-note.js)');
  if (!/^[0-9a-f]{64}$/.test(NM_DEVNET.genesis)) gaps.push('devnet-2 genesis is not pinned');
  for (const path of NM_CHAIN_SURFACE_SOURCES) {
    const src = sources[path];
    if (src === undefined) continue;
    const hits = scanSource(src, path);
    if (hits.length) gaps.push(`${path} uses banned words: ${[...new Set(hits.map((h) => h.match.toLowerCase()))].join(', ')}`);
  }
  return gaps;
}

/**
 * Called at build time. Always: the chain copy must scan clean (a banned word
 * fails the build). With the flag on: no gap may remain.
 */
export function assertNmChainReady(sources: Record<string, string> = {}, enabled: boolean = NM_CHAIN_ENABLED) {
  const copyHits = scanText(allCopyStrings().join('\n'));
  if (copyHits.length) {
    throw new Error(`Nouns Money chain copy uses banned words (plan §6): ${copyHits.map((h) => h.match).join(', ')}`);
  }
  if (!enabled) return;
  const gaps = nmChainGaps(sources);
  if (gaps.length) throw new Error(`NM_CHAIN_ENABLED is on but Nouns Money is not ready:\n- ${gaps.join('\n- ')}`);
}

/**
 * /nouns-money/catalog.json: the live catalog while off; while on, its meaning
 * line (the live "No mint, token ownership…") becomes the plan's replacement
 * line. Key order is kept, so the flag-off output is byte-identical.
 */
export function catalogForFlag<T extends { meaning: string }>(catalog: T, enabled: boolean = NM_CHAIN_ENABLED): T {
  return enabled ? { ...catalog, meaning: NM_COPY.replacementLine } : catalog;
}
