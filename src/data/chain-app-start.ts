/**
 * Facts and copy for /chain/start ("Start here"), the page in
 * src/pages/chain/start.astro: one guided minute on the PointCast devnet for a
 * stranger on a phone. The logic is public/chain/apps/start.js (no DOM), the DOM
 * side public/chain/apps/start-view.js; the three things a visitor can do are the
 * Daily Mint's, the Notary's and Time Capsules' own modules, called as their
 * pages call them. This file holds the words and the few constants, so the page,
 * the tests and the e2e script read them from one place. The devnet pins (URL,
 * genesis, chain id, reset date) come from src/data/chain-home.ts, never typed
 * here.
 */

import { HONESTY } from './chain-apps.ts';

/**
 * The wire block the crumb names: 0724 (FD), filed 2026-10-21, which announces
 * /chain/start with /chain/plan, house and outside counted apart, and pcv.py's
 * state-root replay.
 */
export const START_BLOCK: string = '0724';

export const APP = {
  path: '/chain/start',
  key: 'start',
  title: 'Start here',
  block: START_BLOCK,
  description:
    'Your first minute on the PointCast devnet, on a phone: make a free key, take 100 play ATTN, then bid on today’s lot, stamp a sentence or seal a 7-day time capsule, and check your transaction in a block. You read every field before you sign. devnet: no value, may reset.',
} as const;

export const HONESTY_LINE = HONESTY;

/**
 * This page's entry for src/data/chain-apps.ts (CHAIN_APPS), first in the list.
 * The registry cannot import this file (this file imports the registry for its
 * block and honesty line), so the orchestrator writes the entry there as it is
 * here, and tests/chain-app-start.test.mjs keeps the two equal once it is in.
 */
export const REGISTRY_ENTRY = {
  key: 'start',
  href: '/chain/start',
  label: 'Start here: your first minute',
  short: 'Start here',
  mode: 'write',
  blurb:
    'One guided minute: make a free devnet key, take 100 play ATTN, then bid on today’s lot, stamp a sentence or seal a 7-day capsule, and check it in a block. You read every field before you sign. No value; may reset.',
} as const;

/** The four steps, in order: the page's headings and the line under each. */
export const STEP_COPY: { key: 'key' | 'attn' | 'act' | 'see'; title: string; text: string }[] = [
  {
    key: 'key',
    title: 'Make your devnet key',
    text: 'One press. Your browser makes 32 random bytes and uses them as a key: that is a new account on the devnet, free, and it signs here. Only signatures leave this page.',
  },
  {
    key: 'attn',
    title: 'Take 100 play ATTN',
    text: 'The faucet sends 100 play ATTN to your new account, once. Play ATTN is a counter on a test chain: no value, never promised any, and it cannot be bought or sold.',
  },
  {
    key: 'act',
    title: 'Do one thing that is yours',
    text: 'Pick one. Before anything is signed, the page shows you the exact transaction: every field, and the digest your key signs. Nothing is signed, and no transaction is sent, until you press Sign. Reviewing a stamp first stores its three Notary lines (the format, the fingerprint, the length) on the devnet, unsigned, so the post can name them.',
  },
  {
    key: 'see',
    title: 'See it in a block',
    text: 'Your transaction, in the block that holds it. Check that block yourself, by hand or with the Block Yard’s replay of the whole chain.',
  },
];

/** The three things a first visitor can do. */
export const CHOICE_COPY: { key: 'bid' | 'stamp' | 'capsule'; title: string; line: string; costs: string; app: string; appLabel: string }[] = [
  {
    key: 'bid',
    title: 'Bid on today’s card',
    line: 'Bid the least the open lot takes (1 play ATTN while nobody has bid) on today’s Daily Mint card. Outbid, and the house sends it back within 3 blocks; the highest bid at the close (00:00 UTC, later if someone bids in its last five minutes) gets the card, minted on chain.',
    costs: 'Uses play ATTN from step 2.',
    app: '/chain/daily-mint',
    appLabel: 'The Daily Mint',
  },
  {
    key: 'stamp',
    title: 'Stamp a sentence',
    line: 'Type one sentence. Only its fingerprint (its SHA-256) and its length go on chain, in a post on NOTARY signed by your key; the sentence stays in your browser. Later, the same sentence matches the stamp.',
    costs: 'Costs nothing.',
    app: '/chain/notary',
    appLabel: 'The Notary',
  },
  {
    key: 'capsule',
    title: 'Seal a 7-day time capsule',
    line: 'Write a message. The chain holds only a commitment to it, and the capsule can be opened from a block about 7 days on; opening airs the title and the message in public, as your post on GDN. You keep the capsule file: it holds the message and the salt, and without it the capsule never opens.',
    costs: 'Costs nothing.',
    app: '/chain/capsules',
    appLabel: 'Time Capsules',
  },
];

/** Under the passkey button, always: what a passkey is here and where it works. */
export const PASSKEY_NOTE =
  'A passkey is a key your phone or laptop keeps, unlocked with Face ID, Touch ID or a PIN; it is the same passkey account First Mints makes. On devnet-2 passkeys work only on https://pointcast.xyz: the chain’s launch record 7 names that one site, fixed at genesis. A passkey account is a devnet account too: no value, may reset.';

/** What the page is not. Each line is a claim the page keeps. */
export const NOT_LIST: string[] = [
  'Not money. Play ATTN has no value, is never promised any, and cannot be bought, sold or taken off the devnet.',
  'Not permanent. The devnet may reset; a reset is dated and recorded, never silent, and it takes every bid, stamp and capsule with it.',
  'Not proof of who you are. A key is free and anonymous: what it signs is a claim by that key, not by a person.',
  'Not independent. One server runs this devnet and seals every block; it can refuse what it is sent. The Block Yard and Verify a block let you check what it did seal.',
  'Not sent behind your back. The page only reads the devnet until you press a button, and the key lives in this tab unless you tick “Keep it on this device”.',
];

/** The wax seal and title a capsule sealed here carries unless the visitor changes them. */
export const CAPSULE_DEFAULTS = { title: 'A note from my first minute on the chain', label: 'first minute' } as const;
