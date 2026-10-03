/**
 * Shared facts for the /chain section of pointcast.xyz.
 *
 * Every number here comes from the pointcast-chain repository (local only,
 * no public remote) at main da7bc09, read on 2026-10-03:
 *   - commits:  `git log --oneline main | wc -l` (c56ff65 → da7bc09)
 *   - crates:   Cargo.toml workspace members + crates/kernel (own workspace)
 *   - tests:    `cargo test --workspace --offline`, `cd crates/kernel && cargo test --offline`
 *               and the five `node --test` suites, run by Claude Code on a clean
 *               `git archive da7bc09` export on 2026-10-03
 *   - routes:   the `.route(` declarations in crates/node/src/{api,api_raw,api_mandate,
 *               api_art,proofs,ops}.rs and crates/town/src/api.rs
 * If the chain moves on, update the numbers and the SOURCE commit together.
 */

import { readFileSync } from 'node:fs';

export const SOURCE = {
  repo: 'pointcast-chain',
  commit: 'da7bc09',
  date: '2026-10-03',
  firstCommit: 'c56ff65',
  firstAt: '2026-10-01 21:02 PT',
  lastAt: '2026-10-03 11:45 PT',
  commits: 111,
  rustLines: 50834,
} as const;

export const STATUS_LINE =
  'Built and tested locally. Not a public network. No public node. Mainnet anchoring waits on a funded key. First Mints and the art certificates are previews or rehearsals.';

export const TESTS = {
  ranOn: '2026-10-03',
  workspace: { passed: 352, failed: 0, ignored: 4 },
  kernel: { passed: 48, failed: 0, ignored: 1 },
  js: { passed: 49, failed: 0, suites: 'SDK 25, chain-wasm 15, presence issuer 7, explorer 2' },
  total: 449,
  // Test counts at the v1 tip (1b6e819, end of round 3), from the same kind of export.
  v1: { commit: '1b6e819', workspace: 198, kernel: 39, js: 13, total: 250 },
} as const;

export type Crate = { name: string; bin?: string; role: string };
export const CRATES: Crate[] = [
  { name: 'chain-core', role: 'The whole protocol: a pure, deterministic state machine. no_std, no I/O, no clocks, no randomness, no floats.' },
  { name: 'node', bin: 'pointcast-node', role: 'The sequencer: 3-second blocks, sqlite, the HTTP API, the MCP server, the Tezos anchor job and the CLI.' },
  { name: 'explorer', role: 'One static page that renders the chain as a PointCast-style feed, with VERIFY and the Transmit wallet panel.' },
  { name: 'verifier', role: 'Replays blocks with chain-core and turns a sequencer lie into portable evidence anyone can check offline.' },
  { name: 'chain-wasm', role: 'The verifier compiled to wasm32 for browsers, about 560 KiB, with no wasm-bindgen.' },
  { name: 'chain-proof', role: 'Proof of Balance: an account balance or absence, checked against a sequencer-signed root without replay.' },
  { name: 'chain-sim', bin: 'pc-sim', role: 'A seeded town-economy simulator that drives the unmodified state machine.' },
  { name: 'town', bin: 'pc-town', role: 'Town Hall: a read-side sidecar that replays the chain itself and serves account, channel and room pages.' },
  { name: 'kernel', role: 'The same state machine as a Tezos smart-rollup kernel, proven on the SDK MockHost. Its own Cargo workspace.' },
];

export type NavItem = { href: string; label: string; key: string };
export const CHAIN_NAV: NavItem[] = [
  { key: 'home', href: '/chain', label: 'Home' },
  { key: 'yard', href: '/chain/yard/?snapshot=./snapshot.json', label: 'Block Yard' },
  { key: 'dev', href: '/chain/dev', label: 'Dev tools' },
  { key: 'docs', href: '/chain/docs/', label: 'Docs' },
  { key: 'case-study', href: '/chain/case-study', label: 'Case study' },
  { key: 'interns', href: '/chain/interns', label: 'Interns' },
  { key: 'first-mints', href: '/chain/first-mints/', label: 'First Mints' },
];

export type YardStats = { href: string; blocks: number; txs: number; anchors: number; accounts: number; recordedAt: string; verifierKiB: number };

/**
 * Counts from the yard's static recording (public/chain/yard/snapshot.json),
 * read at build time so a re-synced recording can never disagree with the
 * page. Falls back to the 2026-10-03 recording if the file is unreadable.
 */
export function yardStats(): YardStats {
  const base = { href: '/chain/yard/?snapshot=./snapshot.json', verifierKiB: 560 };
  try {
    const snap = JSON.parse(readFileSync('public/chain/yard/snapshot.json', 'utf8'));
    const blocks = Array.isArray(snap.blocks) ? snap.blocks : [];
    return {
      ...base,
      blocks: Number(snap.status?.height) || blocks.length,
      txs: blocks.reduce((n: number, b: { txs?: unknown[] }) => n + (Array.isArray(b.txs) ? b.txs.length : 0), 0),
      anchors: Array.isArray(snap.anchors) ? snap.anchors.length : 0,
      accounts: Array.isArray(snap.accounts) ? snap.accounts.length : Number(snap.status?.accounts) || 0,
      recordedAt: String(snap.recorded_at || '').slice(0, 10),
    };
  } catch {
    return { ...base, blocks: 422, txs: 67, anchors: 4, accounts: 7, recordedAt: '2026-10-03' };
  }
}
