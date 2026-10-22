/**
 * Facts and copy for /chain/daily-mint ("The Daily Mint"), the page in
 * src/pages/chain/daily-mint.astro. The logic is public/chain/apps/daily-mint.js
 * (no DOM), the DOM side public/chain/apps/daily-mint-view.js, the key panel
 * public/chain/apps/key-panel.js; this file holds the words and the few
 * constants, so the page, the tests and the e2e script read them from one
 * place. The devnet pins come from src/data/chain-home.ts.
 *
 * The auction itself is the devnet Worker's (pointcast-chain
 * deploy/devnet-worker/src/daily.js) and its law is sdk/daily-law.js, copied
 * unchanged to public/chain/first-mints/lib/daily-law.js (sha256 pinned in
 * tests/chain-app-daily-mint.test.mjs). Play ATTN has no value and is never
 * promised any; the devnet may reset and take every card with it.
 */

import { APPS_BLOCK, HONESTY } from './chain-apps.ts';

export const APP = {
  path: '/chain/daily-mint',
  key: 'daily-mint',
  title: 'The Daily Mint',
  block: APPS_BLOCK,
  description:
    'The PointCast devnet’s play auction, one lot a UTC day: see the open lot and the last seven, replay every sealed block through the auction’s own law to check the house, or bid with a key made in your browser. Play ATTN: no value, may reset.',
} as const;

export const HONESTY_LINE = HONESTY;

/** The sentence the Worker and the docs lead with, verbatim. */
export const DAILY_COPY = 'Daily Mint · play auction · devnet play ATTN · no value · may reset';

export const LAW_PATH = '/chain/first-mints/lib/daily-law.js';

export const DAY_STEPS: { title: string; text: string }[] = [
  {
    title: 'A lot opens',
    text: 'The house auctioneer posts lot/v1 NNNN on channel DLY. That block’s timestamp opens the lot, and it closes at the next 00:00 UTC. One lot a day.',
  },
  {
    title: 'Anyone bids',
    text: 'A bid is a transfer of play ATTN to the auctioneer. It must be at least 5% more than the leading bid, or 1 more, or the reserve of 1. A bid before it can carry up to three words for the card and an address to give the card to.',
  },
  {
    title: 'Outbid money comes back',
    text: 'Every inflow that is not the leading bid is owed back, the same amount, within three blocks. The Worker queues the refunds right after each block.',
  },
  {
    title: 'The close, and the card',
    text: 'A bid in the last five minutes moves the close to five minutes after it, never past two hours late. At the close the winning amount goes to the faucet and one card is minted to the winner (or to the address they gave) as that lot’s serial of the daily-mint edition. With no bids the Town Shelf gets it.',
  },
];

export const CANNOT_SEE: string[] = [
  'A bid the house never let into a block. The house is also the sequencer: it can refuse a transfer and it can keep one out of every block, and the law sees only the blocks. The door says why it refuses one it can see.',
  'When the house chose to seal. The close block, and so the next card’s seed, depend on it.',
  'Whether the blocks are the real chain. The check reads them as the devnet serves them. Verify a block checks hashes and seals; the Block Yard replays everything.',
  'Anyone’s identity. A bid is a key, and keys are free. One person can hold a hundred.',
];

export const CHECK_COPY = {
  button: 'Check the house against the chain',
  what: 'Your browser reads every sealed block, folds them through the auction’s settle law, and compares the result with the devnet’s own report at GET /daily/law. A refund that is late or missing, a payment or mint that is wrong, a second mint, a lot out of order: each is a violation with a block number.',
  agree: 'The replay agrees with the devnet’s own report, and the law found no violation.',
  disagree: 'The replay does not agree with the devnet’s own report, or the law found a violation. The lines below say where.',
} as const;

/** What the confirm step says, in plain words, before anything is signed. */
export const BID_COPY = {
  warn: 'Both messages are public and stay on this devnet until it resets. Play ATTN has no value.',
  none: 'No words and no gift address: just the transfer.',
} as const;

/** Run the same check from a terminal. */
export function auditSnippet(devnet: string): string {
  return [
    '# In a copy of pointcast-chain (the repository is local for now)',
    'node scripts/audit-daily.mjs ' + devnet,
    '# prints one line per lot, every violation with its block number,',
    '# and exits 1 on a violation or any disagreement with GET /daily/law',
  ].join('\n');
}
