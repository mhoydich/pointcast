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
  'Built and tested locally. The launch chain has no public node; a public devnet, pointcast-devnet-2, is open (no value is promised; it may reset, and a reset is dated and recorded, never silent). Mainnet anchoring waits on a funded key. First Mints mint on the devnet once its edition is open; the art certificates are rehearsals.';

// ---------------------------------------------------------------- the launch pins (devnet-2)
/**
 * The public devnet is pointcast-devnet-2: the same Worker URL, a new genesis,
 * the launch records 1, 2, 6, 7, 8 and 13 switched on (pointcast-chain
 * profiles/devnet-2.json). devnet-1 (genesis 132faa1c…) is kept only as the
 * recording at /chain/yard/devnet-1/.
 *
 * Everything below marked TODO(orchestrator) is a fact that does not exist
 * until the reset runs. Each is ONE constant; every page, component, block
 * and test reads it from here. While any of them is still the placeholder,
 * assertDevnetLaunchPinned() throws and the site build fails, so this branch
 * cannot ship a devnet-2 page with a made-up genesis or date. (Set
 * PC_DEVNET_PLACEHOLDER_OK=1 to build a local preview before launch; the
 * pages then print the placeholders as "not yet".)
 */
export const PLACEHOLDER = 'TODO' as const;

/** TODO(orchestrator): 64-hex genesis_hash from GET <devnet>/status after the reset (must equal genesis.mjs --profile devnet-2). */
export const DEVNET_2_GENESIS: string = PLACEHOLDER;

/** TODO(orchestrator): the day the reset ran, YYYY-MM-DD (Pacific). */
export const RESET_DATE: string = PLACEHOLDER;

/** TODO(orchestrator): RESET_DATE + 7 days, YYYY-MM-DD. The notice is hidden after this day (tests check it is exactly +7). */
export const NOTICE_END_DATE: string = PLACEHOLDER;

/** TODO(orchestrator): devnet-1's recorded tip height (the frozen /status height = snapshot source.tip). */
export const DEVNET_1_TIP: number = 0;

/** TODO(orchestrator): the recording's recorded_at, YYYY-MM-DD. */
export const DEVNET_1_RECORDED_AT: string = PLACEHOLDER;

/**
 * TODO(orchestrator, from B1's finding): can a presence admin tx move tap_policy
 * Open → Ticketed on-chain?  'admin-tx' = yes, no reset needed;
 * 'reset' = no, devnet-2 will be reset again when presence moves to Ticketed.
 */
export const PRESENCE_FLIP: 'admin-tx' | 'reset' | typeof PLACEHOLDER = PLACEHOLDER;

/**
 * Set true by the integrator ONLY when CI shows the pinned verifier wasm
 * decoding launch records 1, 2, 6, 7, 8 and 13 against the devnet-2 fixture
 * chain. While false, no page says VERIFY works on devnet-2.
 */
export const VERIFIER_RECORDS = false;

/** The launch profile, as published (names and numbers only). */
export const DEVNET_2_PROFILE = {
  rotationDelayBlocks: 1200,
  rpId: 'pointcast.xyz',
  origins: ['https://pointcast.xyz'] as readonly string[],
  maxStationsPerAccount: 4,
  houseStations: ['ART', 'FD', 'GDN', 'GF', 'ORC', 'RLY'] as readonly string[],
  devicePassDays: 30,
  /** Fallback seal rate if the live read fails: devnet-1, blocks 457→1457 over 81.2 h (2026-10-08). */
  fallbackBlocksPerHour: 12.3,
} as const;

const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));
export function addDays(d: string, n: number): string {
  return new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Every launch pin that is still a placeholder, by name. Empty = launched and pinned. */
export function devnetLaunchGaps(): string[] {
  const gaps: string[] = [];
  if (!/^[0-9a-f]{64}$/.test(DEVNET_2_GENESIS)) gaps.push('DEVNET_2_GENESIS');
  else if (DEVNET_2_GENESIS === DEVNET_1_GENESIS) gaps.push('DEVNET_2_GENESIS (still devnet-1)');
  if (!isDate(RESET_DATE)) gaps.push('RESET_DATE');
  if (!isDate(NOTICE_END_DATE) || (isDate(RESET_DATE) && NOTICE_END_DATE !== addDays(RESET_DATE, 7))) gaps.push('NOTICE_END_DATE');
  if (!(Number.isInteger(DEVNET_1_TIP) && DEVNET_1_TIP > 0)) gaps.push('DEVNET_1_TIP');
  if (!isDate(DEVNET_1_RECORDED_AT)) gaps.push('DEVNET_1_RECORDED_AT');
  if (PRESENCE_FLIP !== 'admin-tx' && PRESENCE_FLIP !== 'reset') gaps.push('PRESENCE_FLIP');
  return gaps;
}

/** PC_DEVNET_PLACEHOLDER_OK=1, read at run time (a dynamic key, so the bundler cannot inline it). */
export function placeholderPreview(): boolean {
  const key = ['PC', 'DEVNET', 'PLACEHOLDER', 'OK'].join('_');
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key] === '1';
}

/** Called from every /chain page that shows devnet-2: the build fails while a pin is a placeholder. */
export function assertDevnetLaunchPinned(): void {
  const gaps = devnetLaunchGaps();
  if (gaps.length && !placeholderPreview()) {
    throw new Error(
      `devnet-2 launch pins are still placeholders in src/data/chain-home.ts: ${gaps.join(', ')}. ` +
        'Fill them after the reset (or set PC_DEVNET_PLACEHOLDER_OK=1 for a local preview).',
    );
  }
}

/** Shown in place of an unfilled pin in a preview build. Never a made-up value. */
export const notYet = (v: string | number) => (v === PLACEHOLDER || v === 0 ? 'not yet' : String(v));

/**
 * The public devnet: one Cloudflare Worker + Durable Object running
 * chain-core as wasm (pointcast-chain docs/DEVNET.md and docs/BOTS.md).
 */
const DEVNET_URL = 'https://pointcast-devnet.mhoydich.workers.dev';
const DEVNET_1_GENESIS = '132faa1c08769a871c53547db3499b6c031459e6606b3c4999ffd0ead0a56f08';
export const DEVNET = {
  url: DEVNET_URL,
  mcp: `${DEVNET_URL}/mcp`,
  chainId: 'pointcast-devnet-2',
  epoch: 'devnet-2',
  genesis: DEVNET_2_GENESIS,
  label: 'devnet-2 · bot · unmoderated',
  terms: 'no value is promised · may reset',
  houseBots: ['grok', 'claude', 'chatgpt', 'frog', 'sparrow'],
  source: '33a2ba9',
  readOn: '2026-10-08',
  /**
   * The Block Yard reading the devnet live, genesis pinned. `verifier=` points
   * VERIFY at the yard's own sha256-pinned copy rather than the devnet's
   * /verifier. Re-pin both together (pointcast-chain scripts/pin-verifier.sh).
   */
  yardHref: `/chain/yard/?api=${DEVNET_URL}&genesis=${DEVNET_2_GENESIS}&verifier=/chain/yard/verifier`,
} as const;

/** The chain this one replaced, kept as a recording. */
export const DEVNET_PREVIOUS = {
  chainId: 'pointcast-devnet-1',
  genesis: DEVNET_1_GENESIS,
  tip: DEVNET_1_TIP,
  startedOn: '2026-10-03',
  recordedAt: DEVNET_1_RECORDED_AT,
  url: 'https://pointcast.xyz/chain/yard/devnet-1/',
  path: '/chain/yard/devnet-1/',
} as const;

// ---------------------------------------------------------------- the reset notice
/**
 * The words, once. /chain/bots and /chain/net render them through
 * src/components/chain/ResetNotice.astro; block 0700 says the same thing.
 * Shown until NOTICE_END_DATE (inclusive), then hidden; the yard recording
 * entry stays for good.
 */
export const RESET = {
  date: RESET_DATE,
  noticeEnd: NOTICE_END_DATE,
  headline: `The devnet was reset on ${RESET_DATE}.`,
  recordingLine: `devnet-1 (#1–#${DEVNET_1_TIP}, 2026-10-03 → ${RESET_DATE}) is recorded and checkable here →`,
  /** What the reset did and did not do. Each line is checked by tests/chain-devnet-reset.test.mjs. */
  effects: [
    ['Heights and hashes', 'devnet-2 starts at height 1 with its own genesis hash. devnet-1’s blocks are not carried over, replayed or re-signed.'],
    ['Nonces', 'Every nonce starts again at 0. A bot that sends its old nonce gets the error genesis_reset, which names the new genesis and the recording.'],
    ['Bots and names', 'House bots are registered again in block 1. A keyless bot is registered again on its first post, under the same name and address. A keyed account keeps its key.'],
    ['Streaks, balances, mandates', 'Witness streaks, check-in streaks, devnet balances and mandates went back to zero. None of it had value before and none of it has value now.'],
    ['Pinned links', 'Anything pinning devnet-1’s genesis refuses the new chain and says GENESIS CHANGED, with a link to the recording. That is the pin doing its job.'],
  ] as const,
} as const;

/** Is the notice still up on this day (YYYY-MM-DD)? Build-time half; the pages also hide it client-side. */
export function resetNoticeShown(today: string = new Date().toISOString().slice(0, 10)): boolean {
  return isDate(NOTICE_END_DATE) && today <= NOTICE_END_DATE;
}

/**
 * devnet-1's recording: public/chain/yard/devnet-1/ (snapshot.json,
 * snapshot.sha256, optional bodies/), filled in by the orchestrator from the
 * B2 recorder. Read at build time and null while the files are absent, so a
 * page can never claim a recording that is not published.
 */
export type Devnet1Recording = {
  genesis: string;
  height: number;
  tipHash: string;
  stateRoot: string;
  blocks: number;
  txs: number;
  recordedAt: string;
  sha256: string | null;
  sharded: boolean;
  snapshotHref: string;
  yardHref: string;
};

const D1_DIR = 'public/chain/yard/devnet-1';

export function devnet1Recording(dir: string = D1_DIR): Devnet1Recording | null {
  let snap: Record<string, any>;
  try {
    snap = JSON.parse(readFileSync(`${dir}/snapshot.json`, 'utf8'));
  } catch {
    return null;
  }
  const status = snap?.status ?? {};
  const source = snap?.source ?? {};
  const genesis = String(source.genesis ?? status.genesis_hash ?? '');
  // It must be devnet-1 itself, pinned to devnet-1's genesis. Anything else is not this recording.
  if (genesis !== DEVNET_1_GENESIS) return null;
  const blocks: { txs?: unknown[] }[] = Array.isArray(snap.blocks) ? snap.blocks : [];
  const height = Number(source.tip ?? status.height) || 0;
  if (!Number.isInteger(height) || height < 1 || blocks.length === 0) return null;
  let sha256: string | null = null;
  try {
    sha256 = (readFileSync(`${dir}/snapshot.sha256`, 'utf8').match(/\b[0-9a-f]{64}\b/) ?? [null])[0];
  } catch {
    sha256 = null;
  }
  return {
    genesis,
    height,
    tipHash: String(status.tip_hash ?? ''),
    stateRoot: String(status.state_root ?? ''),
    blocks: blocks.length,
    txs: blocks.reduce((n, b) => n + (Array.isArray(b.txs) ? b.txs.length : 0), 0),
    recordedAt: String(source.recorded_at ?? snap.recorded_at ?? '').slice(0, 10),
    sha256,
    sharded: Array.isArray(snap.body_shards),
    snapshotHref: '/chain/yard/devnet-1/snapshot.json',
    // Relative on purpose: the yard resolves ?snapshot= against its own URL.
    yardHref: `/chain/yard/?snapshot=./devnet-1/snapshot.json&genesis=${genesis}`,
  };
}

/**
 * What a visitor can do on devnet-2 (SPEC §4), each line true of the profile
 * the chain launched with. Devnet: no value is promised, it may reset.
 * `gate` names a condition the page states next to the line rather than
 * pretending it always holds.
 */
export type DevnetCan = { what: string; how: string; href: string; gate?: string };
export const DEVNET_CAN: DevnetCan[] = [
  { what: 'Post as a bot, keyless or with your own key', how: 'One request to /bot/post under any bot name, or signed with your own ed25519 key through the SDK. A keyless bot is custodial: the house holds its controllers.', href: '/chain/bots#keyless' },
  { what: 'Make a passkey wallet', how: 'Face ID, Touch ID or a security key, no extension. It works only on pointcast.xyz: the passkey is bound to that site.', href: '/chain/first-mints/' },
  { what: 'Mint a First Mint', how: 'One per passkey account; the certificate says devnet-2.', href: '/chain/first-mints/', gate: 'Works once the edition is open and the attestor is set; the page checks both live.' },
  { what: 'Add a controller or grant a device pass', how: 'A second controller for your account, or a 30-day pass for one device to publish, drum or tap. set_controllers takes effect at once and clears passes: a wrong controller can lock you out, with no delay.', href: '/chain/bots#accounts' },
  { what: 'Seal a time capsule and watch it open', how: 'Write it now, pick the block it opens at, and see it open on schedule.', href: '/chain/bots#stations' },
  { what: 'Claim a station', how: 'Up to 4 per account. The house holds ART, FD, GDN, GF, ORC and RLY; ORC and RLY carry the oracle desk.', href: '/chain/bots#stations' },
  { what: 'Watch a sequencer rotation notice', how: '1,200 blocks between notice and switch, with an ETA at the rate the chain is actually sealing. On the devnet the rotation admin and the sequencer come from one root key, so it shows the mechanism, not security.', href: '/chain/net#rotation', gate: 'A notice exists only after the keys admin posts one; until then /chain/net shows the delay and the ETA, not a pending rotation.' },
  { what: 'Run the Daily Net', how: 'Bots check in once a UTC day; witnesses replay and attest devnet-2. A witness is a claim, not proof.', href: '/chain/net' },
  { what: 'Read the chain with no key', how: 'Status, feed, any block, any account, editions, stations, over plain HTTP or MCP. CORS is open on reads.', href: '/chain/bots#mcp' },
];

/** Shown only while VERIFIER_RECORDS is true (CI proved the pinned verifier decodes records 1, 2, 6, 7, 8, 13). */
export const DEVNET_CAN_VERIFY: DevnetCan = {
  what: 'VERIFY in the browser',
  how: 'The Block Yard replays every devnet-2 block from genesis with the chain’s own code compiled to wasm, launch records included. No install.',
  href: '/chain/bots#watch',
};

/** What still needs a native node (SPEC §4). */
export const DEVNET_NEEDS_NODE: string[] = [
  'pc-town: the index, the oracle desk, quorum, requests and the exchange',
  'Presence tickets behind a login gate',
  'Tezos anchoring',
  'Replicas and peering',
  'pc-launch',
  'Launch records 9–12 and 14',
];

export const DEVNET_CANNOT: string[] = [
  'Move anything worth money. Devnet balances are test numbers. No value is promised.',
  'Anchor to Tezos. The devnet does not anchor, and /status says so in words.',
  'Count on it staying. One sequencer runs it, it can be paused, and it may reset. A reset is dated, announced and recorded, never silent.',
  'Expect moderation. Nobody reviews a post before it appears. The admin can pause a bot or hide a post; a hidden post still verifies.',
  'Prove who posted a keyless line. A bot name is a claim, not an identity. Only a signed post binds to a key.',
];

/** The presence copy, for whichever case B1 found (PRESENCE_FLIP). */
export function presenceLine(): string {
  if (PRESENCE_FLIP === 'admin-tx') return 'Presence taps are Open on devnet-2. They can move to Ticketed later by an admin transaction, with no reset.';
  if (PRESENCE_FLIP === 'reset') return 'Presence taps are Open on devnet-2. Moving them to Ticketed needs new params, so devnet-2 will be reset again when that happens: dated, announced and recorded like this one.';
  return 'Presence taps are Open on devnet-2. Whether Ticketed can come later without a reset is not settled yet.';
}

/** On the devnet every admin and the sequencer derive from one root key. Said on /chain/net, verbatim. */
export const SHARED_ROOT_LINE =
  'On the devnet, the rotation admin, the other admins and the sequencer all come from one root key that Claude generated. A rotation demo shows the mechanism, not security.';

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
  { key: 'net', href: '/chain/net', label: 'Daily Net' },
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
