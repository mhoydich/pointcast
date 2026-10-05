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

import { Buffer } from 'node:buffer';
import { existsSync, readFileSync, statSync } from 'node:fs';

/**
 * Size of the verifier the yard actually serves
 * (public/chain/yard/verifier/pointcast_chain.wasm), read at build time so a
 * re-synced verifier can never disagree with the page (the README at da7bc09
 * still says "~560 KiB"; main's pinned wasm is larger). Falls back to the
 * 2026-10-03 file (632,135 bytes) if the wasm is unreadable.
 */
export const VERIFIER_KIB: number = (() => {
  try {
    return Math.round(statSync('public/chain/yard/verifier/pointcast_chain.wasm').size / 1024);
  } catch {
    return 617;
  }
})();

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
  'Built and tested locally. The launch chain has no public node; a public devnet for bots is open (no value, may reset). Mainnet anchoring waits on a funded key. First Mints and the art certificates are previews or rehearsals.';

/**
 * The public devnet: one Cloudflare Worker + Durable Object running
 * chain-core as wasm (pointcast-chain docs/DEVNET.md and docs/BOTS.md at
 * main bdc46e8). chain_id and genesis read from its /status on 2026-10-03.
 * If the devnet resets, the genesis changes: update it here and every link
 * that pins it follows.
 */
const DEVNET_URL = 'https://pointcast-devnet.mhoydich.workers.dev';
const DEVNET_GENESIS = '132faa1c08769a871c53547db3499b6c031459e6606b3c4999ffd0ead0a56f08';
export const DEVNET = {
  url: DEVNET_URL,
  mcp: `${DEVNET_URL}/mcp`,
  chainId: 'pointcast-devnet-1',
  genesis: DEVNET_GENESIS,
  label: 'devnet · bot · unmoderated',
  houseBots: ['grok', 'claude', 'chatgpt', 'frog', 'sparrow'],
  source: 'bdc46e8',
  readOn: '2026-10-03',
  /**
   * The Block Yard reading the devnet live, genesis pinned. `verifier=` points
   * VERIFY at the yard's own sha256-pinned copy rather than the devnet's
   * /verifier, so a later devnet verifier build can never make the yard refuse
   * to run. Re-pin both together (pointcast-chain scripts/pin-verifier.sh, then
   * re-copy town.html and verifier/ here); each re-pin is checked to replay the
   * snapshot to №421 and the devnet with no faults.
   */
  yardHref: `/chain/yard/?api=${DEVNET_URL}&genesis=${DEVNET_GENESIS}&verifier=/chain/yard/verifier`,
} as const;

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
  { name: 'chain-wasm', role: `The verifier compiled to wasm32 for browsers, about ${VERIFIER_KIB} KiB, with no wasm-bindgen.` },
  { name: 'chain-proof', role: 'Proof of Balance: an account balance or absence, checked against a sequencer-signed root without replay.' },
  { name: 'chain-sim', bin: 'pc-sim', role: 'A seeded town-economy simulator that drives the unmodified state machine.' },
  { name: 'town', bin: 'pc-town', role: 'Town Hall: a read-side sidecar that replays the chain itself and serves account, channel and room pages.' },
  { name: 'kernel', role: 'The same state machine as a Tezos smart-rollup kernel, proven on the SDK MockHost. Its own Cargo workspace.' },
];

export type NavItem = { href: string; label: string; key: string };
export const CHAIN_NAV: NavItem[] = [
  { key: 'home', href: '/chain', label: 'Home' },
  { key: 'yard', href: '/chain/yard/?snapshot=./snapshot.json', label: 'Block Yard' },
  { key: 'bots', href: '/chain/bots', label: 'Bots · devnet' },
  { key: 'dev', href: '/chain/dev', label: 'Dev tools' },
  { key: 'docs', href: '/chain/docs/', label: 'Docs' },
  { key: 'case-study', href: '/chain/case-study', label: 'Case study' },
  { key: 'interns', href: '/chain/interns', label: 'Interns' },
  { key: 'mints', href: '/chain/mints', label: 'First Mints' },
  { key: 'first-mints', href: '/chain/first-mints/', label: 'Mint preview' },
];

export type YardStats = { href: string; blocks: number; txs: number; anchors: number; accounts: number; recordedAt: string; verifierKiB: number };

/**
 * Counts from the yard's static recording (public/chain/yard/snapshot.json),
 * read at build time so a re-synced recording can never disagree with the
 * page. Falls back to the 2026-10-03 recording (re-recorded 19:31 UTC with
 * ticketed taps) if the file is unreadable.
 */
export function yardStats(): YardStats {
  const base = { href: '/chain/yard/?snapshot=./snapshot.json', verifierKiB: VERIFIER_KIB };
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
    return { ...base, blocks: 421, txs: 359, anchors: 4, accounts: 11, recordedAt: '2026-10-03' };
  }
}

/**
 * First Mints, minted on a recorded rehearsal chain: public/chain/yard/first-mints/
 * holds the snapshot the Block Yard replays, mints.json (one row per edition_mint,
 * extracted from that snapshot's blocks) and one SVG per First Mint, rendered from
 * its recipe by pointcast-chain sdk/first-mint.js and checked with validate() and
 * auditSvg(). Recorded 2026-10-05 with pointcast-chain 14188e2 (main 1a13850 plus
 * the demo's mint fix): PC_EDITIONS=on, PC_EDITIONS_DEMO_MINTS=24, ticketed taps,
 * public dev keys. Everything here is read at build time, so the page, the block
 * and the yard link can never disagree with the files the yard verifies.
 */
export type FirstMint = {
  serial: number;
  /** The words on the card (the recipe text). */
  words: string;
  /** The human code without its words, e.g. "FM1 14.132.94.18 warm scanlines syne". */
  code: string;
  height: number;
  recipeBytes: number;
  tx: string;
  card: string;
};
export type FirstMintsRehearsal = {
  mints: FirstMint[];
  /** Other mints in the recording (no card here), read from the snapshot's blocks:
   *  every *_mint tx that is not a first-mints edition_mint. The yard's Mints lens
   *  lights these too, so the page names them. */
  others: { kind: 'edition' | 'drop' | 'other'; collection: string; height: number }[];
  supply: number;
  rendererSha256: string;
  genesis: string;
  tip: number;
  tipHash: string;
  stateRoot: string;
  recordedAt: string;
  blocks: number;
  snapshotHref: string;
  mintsHref: string;
  /** The Block Yard on this snapshot, Mints lens on, genesis pinned. */
  yardHref: string;
};

const FM_DIR = 'public/chain/yard/first-mints';
const HEX64 = /^[0-9a-f]{64}$/;
/** sdk/first-mint.js TEXT_CHARSET, 1 to 24 characters: the only text a recipe can carry. */
const FM_WORDS = /^[A-Z0-9 !?&'.,#-]{1,24}$/;
/** sdk/first-mint.js humanCode() without its words, e.g. "FM1 1.2.3.4 cobalt scanlines syne ink:white". */
const FM_CODE = /^FM1 \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?: [A-Za-z0-9:-]{1,24}){1,6}$/;
const MINT_TX = /^[a-z][a-z0-9_]*_mint$/;
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function firstMints(): FirstMintsRehearsal {
  const snap = JSON.parse(readFileSync(`${FM_DIR}/snapshot.json`, 'utf8'));
  const rows: unknown = JSON.parse(readFileSync(`${FM_DIR}/mints.json`, 'utf8'));
  const status = snap?.status ?? {};
  const genesis = String(status.genesis_hash ?? '');
  if (!HEX64.test(genesis)) throw new Error('first-mints snapshot has no genesis hash');
  const blocks: { header?: { height?: number }; txs?: { tx?: Record<string, unknown> }[] }[] = Array.isArray(snap.blocks) ? snap.blocks : [];
  const txs = blocks.flatMap((b) => (b.txs ?? []).map((t) => ({ height: Number(b.header?.height), tx: t.tx ?? {} })));
  const terms = txs
    .map((t) => t.tx)
    .find((tx) => tx.type === 'open_edition' && (tx.terms as { id?: string } | undefined)?.id === 'first-mints')?.terms as
    | { supply?: number; renderer_hash?: string }
    | undefined;
  // First Mint serials are assigned in landing order, so serial n is the n-th
  // first-mints edition_mint in the recording. Each row must match it exactly.
  const fmTxs = txs.filter((t) => t.tx.type === 'edition_mint' && t.tx.edition === 'first-mints');
  const others: FirstMintsRehearsal['others'] = [];
  for (const t of txs) {
    const type = String(t.tx.type ?? '');
    if (!MINT_TX.test(type) || (type === 'edition_mint' && t.tx.edition === 'first-mints')) continue;
    const id = String(t.tx.edition ?? t.tx.drop_id ?? t.tx.collection ?? '');
    if (!SLUG.test(id) || !Number.isInteger(t.height)) continue;
    others.push({ kind: type === 'edition_mint' ? 'edition' : type === 'drop_mint' ? 'drop' : 'other', collection: id, height: t.height });
  }
  const mints: FirstMint[] = [];
  for (const r of Array.isArray(rows) ? rows : []) {
    const m = r as Record<string, unknown>;
    if (m.collection !== 'first-mints') continue;
    const serial = Number(m.serial);
    const height = Number(m.height);
    if (!Number.isInteger(serial) || serial < 1 || !Number.isInteger(height) || height < 1) continue;
    const human = typeof m.words === 'string' ? m.words : '';
    const cut = human.lastIndexOf(' / ');
    const hex = typeof m.recipe_hex === 'string' ? m.recipe_hex : '';
    const card = `/chain/yard/first-mints/cards/first-mints-${serial}.svg`;
    if (cut < 0 || !/^(?:[0-9a-f]{2})+$/.test(hex) || !existsSync(`public${card}`)) continue;
    const words = human.slice(cut + 3);
    const code = human.slice(0, cut);
    const tx = fmTxs[serial - 1];
    // Words and code reach the page and its JSON-LD, so they must be what a
    // recipe can hold, the words must be the recipe's own text, and the row must
    // be the recorded edition_mint at that height with those exact bytes.
    const recipe = Buffer.from(hex, 'hex');
    if (!FM_WORDS.test(words) || !FM_CODE.test(code) || recipe.length < 15 || recipe.subarray(14).toString('latin1') !== words) continue;
    if (!tx || tx.height !== height || tx.tx.recipe !== hex) continue;
    mints.push({
      serial,
      words,
      code,
      height,
      recipeBytes: recipe.length,
      tx: typeof m.tx === 'string' && HEX64.test(m.tx) ? m.tx : '',
      card,
    });
  }
  mints.sort((a, b) => a.serial - b.serial);
  return {
    mints,
    others,
    supply: Number(terms?.supply) || 0,
    rendererSha256: HEX64.test(String(terms?.renderer_hash)) ? String(terms?.renderer_hash) : '',
    genesis,
    tip: Number(status.height) || 0,
    tipHash: String(status.tip_hash ?? ''),
    stateRoot: String(status.state_root ?? ''),
    recordedAt: String(snap.recorded_at ?? ''),
    blocks: blocks.length,
    snapshotHref: '/chain/yard/first-mints/snapshot.json',
    mintsHref: '/chain/yard/first-mints/mints.json',
    // Relative on purpose, like CHAIN_NAV's yard link: the yard resolves ?snapshot= against its own URL.
    yardHref: `/chain/yard/?snapshot=./first-mints/snapshot.json&lens=mints&genesis=${genesis}`,
  };
}
