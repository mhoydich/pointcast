/**
 * Facts and copy for /chain/witness ("Witness in your browser"), the page in
 * src/pages/chain/witness.astro. The logic is public/chain/apps/witness.js (no
 * DOM), the DOM side public/chain/apps/witness-view.js, the worker shim
 * public/chain/apps/witness-shim.js, the shared key panel key-panel.js; this
 * file holds the words and the few constants, so the page, the tests and the
 * e2e script read them from one place. The devnet pins (URL, genesis, chain id,
 * reset date) come from src/data/chain-home.ts, never typed here.
 *
 * What the page does: replays the devnet from genesis in a Web Worker with the
 * Block Yard's pinned verifier, refuses to sign on any fault, picks the
 * checkpoint exactly as pc-witness.mjs does (public/chain/net/pc-witness.mjs),
 * signs it with the shared play key (public/chain/net/witness.js) and posts it
 * on WIT, optionally a NET check-in, then reads the roll back. What a witness
 * claim means is the Daily Net's own wording (docs/DAILY_NET.md in
 * pointcast-chain, /chain/net): the strings below are word for word the ones in
 * witness.js, and tests/chain-app-witness.test.mjs keeps them equal.
 */

import { APPS_BLOCK, HONESTY } from './chain-apps.ts';

export const APP = {
  path: '/chain/witness',
  key: 'witness',
  title: 'Witness in your browser',
  block: APPS_BLOCK,
  description:
    'Replay the PointCast devnet from block 1 in your browser, with the Block Yard’s pinned verifier, then sign what you got at one checkpoint with a free key and post it as a witness. A witness is a claim, not proof of replay. devnet: no value, may reset.',
} as const;

export const HONESTY_LINE = HONESTY;

/**
 * The entry the integrator adds to src/data/chain-apps.ts (CHAIN_APPS). Kept
 * here so the blurb is written once and tested for honesty and length; the
 * registry file itself is shared and is not edited by this page's branch.
 */
export const REGISTRY_ENTRY = {
  key: 'witness',
  href: '/chain/witness',
  label: 'Witness in your browser',
  short: 'Witness',
  mode: 'write',
  blurb:
    'Replay the devnet from block 1 in a worker with the Block Yard’s pinned verifier, then sign what you got at one checkpoint with a free key. A witness is a claim tied to a key, not proof that you replayed.',
} as const;

/** The channels the page posts to: the attestation on WIT, the optional check-in on NET. */
export const CHANNEL = 'WIT';
export const NET_CHANNEL = 'NET';

/** The `tool` field of the attestation: what produced it. At most 64 characters. */
export const TOOL = 'chain-witness-page/1';

/**
 * The Block Yard's verifier, the three files the page runs and the sha256 it
 * pins for each. They are the same pins as the Block Yard's own page
 * (public/chain/yard/index.html, VERIFIER_PINS) and pc-witness.mjs
 * (VERIFIER_PINS); src/data/chain-home.ts holds no verifier hash, only the
 * wasm's size. Re-pinning the Yard means changing these three lines too:
 * tests/chain-app-witness.test.mjs compares them with the files, with the
 * Yard's pins and with pointcast_chain.wasm.sha256, and fails when they differ.
 */
export const VERIFIER = {
  dir: '/chain/yard/verifier/',
  files: ['verify.js', 'verify-worker.js', 'pointcast_chain.wasm'],
  sumsFile: 'pointcast_chain.wasm.sha256',
  pins: {
    'verify.js': '74255711f5b8988eb18c30d5138ef0dc5ff4612566f0d70ac5b9fea6f81dc3cc',
    'verify-worker.js': 'cf9c552a8b8498edfa51811cb9ca0421422fa4bc200b91816416ec6a297c9a00',
    'pointcast_chain.wasm': '7467bfd9afb34a9a37a177d1f9236e529b2b827bb5dfa07f7e6e12263af4acd4',
  },
} as const;

// ---------------------------------------------------------------- what a witness means (the Daily Net's words)

/** Word for word the same as WITNESS_MEANING in public/chain/net/witness.js. */
export const WITNESS_MEANING =
  'A witness is a public claim, tied to a free key: “I replayed this chain from genesis with the pinned verifier and got this block hash and state root at height h.” Wrong or double claims are public evidence against that key.';

/** Word for word the same as WITNESS_LIMITS in public/chain/net/witness.js. */
export const WITNESS_LIMITS =
  'It is not proof of replay: strikes only catch disagreement with this server, so a /status copier never gets one and a streak means “agreed with this server”. Everything passes through the server it checks, so a hostile sequencer can censor it; this catches bugs, not a hostile operator. Counts are keys, not people.';

/** Word for word the same as STRIKE_COPY in public/chain/net/witness.js. */
export const STRIKE_COPY = 'signed a checkpoint this chain does not have: a wrong replay, or it was shown a different chain.';

/** The guard against a post that could land on either UTC day, in the words pc-witness.mjs uses. */
export const MIDNIGHT_LINE =
  'The page never sends between 23:59 and 00:01 UTC: a post sent then could land on either day. In that minute it signs nothing, sends nothing and says so.';

export const MEANS: string[] = [
  'A public claim, tied to one free key: “I replayed this chain from genesis with the pinned verifier and got this block hash and state root at height h.” The block hash and the state root in it come from the replay your browser just ran, not from /status.',
  '“Correct” means the devnet’s roll found your block hash and state root equal to this server’s at that height. It agreed with this server, and that is all it says.',
  'The signature inside the post is over the witness digest, not only over the transaction, so anyone can check it offline against any copy of the chain. Keep the claim file the page offers: it is that evidence.',
  'A strike means the key “signed a checkpoint this chain does not have”: a wrong replay, or it was shown a different chain. Wrong or double claims are public evidence against that key.',
];

export const NOT_MEANS: string[] = [
  'It is not proof of replay. A page, or a person, that copied /status signs the same bytes and never gets a strike, so a streak means “agreed with this server”, not “replayed”. This page cannot prove to anyone that it ran the replay.',
  'It cannot catch a hostile operator. Everything passes through the server it checks, so a hostile sequencer can censor an attestation. The roll catches bugs: a wrong replay, a stale verifier, a server that shows different chains to different people.',
  'Counts are keys, not people. A key is free and one person can make many; a name is a claim, bound to the first key that used it.',
  'The chain never trusts it. An attestation feeds no verifier, makes no trust tier and is never a checkpoint to start a replay from. The devnet has no value and may reset; a reset starts the roll again, dated and recorded.',
];

/** What the page shows for each result the devnet gives a claim. */
export const RESULT_ROWS: { result: string; page: string; effect: string }[] = [
  { result: 'correct', page: 'CORRECT', effect: 'The claim matches this server’s block hash and state root and was sealed before the post. Counted for the UTC day of the block that holds it.' },
  { result: 'mismatch · conflict', page: 'STRIKE', effect: 'A block hash or state root this server does not have, or a second, different claim at one height from the same key. A strike is public.' },
  { result: 'duplicate', page: 'DUPLICATE', effect: 'The same claim again. Not counted, no strike.' },
  { result: 'over cap · premature · other epoch · not a checkpoint · bad key or signature · malformed', page: 'NOT COUNTED', effect: 'Refused as a claim about this chain, with the devnet’s own reason shown.' },
  { result: 'not on the roll yet', page: 'PENDING', effect: 'The post is not in a block, or the roll has not read that far. Read it again in a moment.' },
];

export type StepCopy = { n: number; title: string; what: string };

/** What happens, in order, when you press the button. Every step before the last two writes nothing. */
export const STEPS: StepCopy[] = [
  { n: 1, title: 'Pin the chain', what: 'The devnet’s genesis hash must be the one this page was built with. If the devnet was reset, the page stops and says GENESIS CHANGED.' },
  { n: 2, title: 'Check the verifier', what: 'The page fetches the Block Yard’s verifier (the wasm, verify.js and the worker) and works out each file’s SHA-256 here. They must match the pins printed above, and the wasm must match the Block Yard’s own fingerprint file. Nothing runs until they do.' },
  { n: 3, title: 'Replay from block 1', what: 'A worker pulls the blocks 500 at a time and runs every one through the chain’s own rules, state root included. Any fault stops it, and nothing is signed.' },
  { n: 4, title: 'Pick the checkpoint', what: 'From the replay itself: today’s day checkpoint (the first multiple of 10 at or after the UTC day’s first block, once sealed), else the latest sealed one. The epoch is the hash of block 1.' },
  { n: 5, title: 'Review', what: 'The page shows the post word for word. Your browser has signed the claim; nothing has left the page.' },
  { n: 6, title: 'Send, then read the roll', what: 'You press Send: one post on WIT, then (if you ticked it) a check-in on NET. The page reads the roll back and says CORRECT, STRIKE or PENDING.' },
];

/**
 * The same thing from a terminal: pc-witness.mjs, the four files it needs and
 * its dry run. The page prints exactly this text. Plain strings, no template
 * literals, so a test can check each flag against pc-witness.mjs --help.
 */
export function terminalSnippet(site: string): string {
  return [
    '# Node 22 or newer · replays, picks the checkpoint and signs exactly as this page does',
    'mkdir pc-witness && cd pc-witness && curl -fsS --fail-early --remote-name-all \\',
    '  ' + site + '/chain/net/pc-witness.mjs \\',
    '  ' + site + '/chain/net/witness.js \\',
    '  ' + site + '/chain/net/pointcast-chain.js \\',
    '  ' + site + '/chain/net/package.json \\',
    '  && node pc-witness.mjs --name <you> --dry-run',
    '',
    '# happy with it? post it, and check in on the Daily Net',
    'node pc-witness.mjs --name <you> --checkin',
  ].join('\n');
}
