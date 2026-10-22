/**
 * Where the SDK this site serves came from. Written by scripts/sync-chain-sdk.mjs: run it
 * (`node scripts/sync-chain-sdk.mjs`) to move to a newer SDK; do not edit by hand.
 * `node scripts/sync-chain-sdk.mjs --check` and tests/chain-app-sdksync.test.mjs fail when a
 * served copy is not exactly this file.
 *
 * The file is the pointcast-chain repo's sdk/pointcast-chain.js, copied byte for byte (it is
 * not edited and carries no note about the copy; this module is where the provenance lives).
 * `commit` is the repo's HEAD when it was copied; `lastChangedIn` is the last commit that
 * touched the file.
 */
export const SDK_SOURCE = {
  repo: 'pointcast-chain',
  path: 'sdk/pointcast-chain.js',
  commit: '0795f26',
  commitFull: '0795f26f838f7ab7ddbefd71de6e6cdb4d957975',
  commitDate: '2026-10-20',
  lastChangedIn: 'ce8b9f9',
  sha256: '33bef6b76c98e5e2090fb7b7d87a4b8324807503c4ea9d2fc65052ac6eb2bde9',
  bytes: 180161,
  lines: 3883,
  copies: ['public/chain/sdk/pointcast-chain.js', 'public/chain/net/pointcast-chain.js', 'public/chain/first-mints/lib/pointcast-chain.js'],
} as const;

/** The size the pages print, in KB (1 KB = 1,000 bytes, as the file listing shows it). */
export const SDK_KB: number = Math.round(SDK_SOURCE.bytes / 1000);
