/**
 * Facts and copy for /chain/observatory ("Chain Observatory"), the live
 * dashboard in src/pages/chain/observatory.astro. The logic is
 * public/chain/apps/observatory.js (no DOM), the DOM side is
 * public/chain/apps/observatory-view.js; this file holds the words and the few
 * constants of this app, so the page, the tests and the e2e script read them
 * from one place. The devnet pins come from src/data/chain-home.ts.
 */

import { APPS_BLOCK, HONESTY } from './chain-apps.ts';

export const APP = {
  path: '/chain/observatory',
  key: 'observatory',
  title: 'Chain Observatory',
  block: APPS_BLOCK,
  description:
    'A live dashboard of the PointCast devnet: how fast it is sealing, what kinds of transactions and which channels fill the recent blocks, who is posting, and today’s Daily Net, Daily Mint and time capsules. It only reads. devnet: no value, may reset.',
} as const;

/** The honesty line the page carries verbatim (and a test looks for). */
export const HONESTY_LINE = HONESTY;

/** Every route the dashboard reads, and what it takes from it. All GET; nothing is written. */
export const READS: { route: string; takes: string }[] = [
  { route: 'GET /status', takes: 'height, tip hash and time, mempool, accounts, agents, bots, supply; checked against the pinned genesis first' },
  { route: 'GET /raw/blocks', takes: 'the newest blocks in pages of 500: their times, their transaction kinds, channels and senders' },
  { route: 'GET /daily', takes: 'the open lot, the house’s own tally, and the devnet’s clock (from when the lot closes)' },
  { route: 'GET /net and /checkpoints', takes: 'today’s Daily Net counts, who signed today’s txs (house, keyless or outside) and the witnessed checkpoints' },
  { route: 'GET /capsules', takes: 'time capsules still sealed, and how many may be opened now' },
  { route: 'GET /editions, /stations and /bots', takes: 'edition supply, station counts and the busiest keyless bots' },
];

export const NOT_LIST: string[] = [
  'It is a window, not the chain. Every chart says which blocks it drew; the dashboard never adds up the whole history.',
  'It does not check anything. Use Verify a block to recompute hashes and seals, or the Block Yard to replay every block. A number here is what one server says.',
  'The seal rate is measured, not promised. The Worker seals when there is traffic and otherwise once every five minutes, so a quiet devnet shows about 12 blocks an hour.',
  'Keys are not people. A sender is an address; a busy sender may be one script. Keyless bots post through house keys under a name that is a claim, not an identity.',
  'House activity is the chain checking itself, not use. Most txs are the house on its own schedule (the auction, the net report, the house runner): the Transactions tile counts them all, and Who signed splits today’s into house, keyless and outside.',
  'The devnet’s clock reaches this page by one route only, the open lot’s close time. While a lot is open the “age” of the newest block is worked out against that and may be a second or two off. When no lot is open (the Daily Mint is off, or between lots) the badge uses your own clock, which cannot be checked: it then says so, and says LATE or STALLED only if this page has itself watched the newest block stand still that long.',
  'devnet: no value, may reset. A reset starts every count at zero and is dated and recorded, never silent.',
];

export const CHART_NOTES = {
  cadence:
    'Seconds between one block and the one before it, on a log scale because the two numbers the devnet keeps are 3 s (it seals as soon as something is posted) and 300 s (an empty heartbeat block every five minutes).',
  activity: 'Transactions per time bucket. The bucket widens with the window so the chart stays near twenty-four columns.',
  kinds: 'What the transactions are: a post is publish_block; the setup kinds are the house registering agents and opening editions.',
  channels: 'Where posts go. BOT is the bots’ lane, DLY the Daily Mint, WIT the Daily Net’s witnesses.',
  senders: 'Addresses by transaction count: pca1 are agents, tz1 are keys.',
  classes:
    'Every transaction today, by who signed it, as the devnet counts them for the UTC day. Counts are keys, not people; a faucet drip is house-signed even when a visitor asked for it.',
} as const;

/** What each tile of “Who signed today’s txs” means (the page lists the tiles in the order the devnet does). */
export const CLASS_GLOSS = {
  house: 'Keys the house made or runs: the treasury, the net reporter, the auction’s keys, the house runner. The chain checking itself.',
  keyless: 'Bot posts the devnet signs under a name with a key it holds for that bot. A name is a claim, not an identity.',
  outside: 'Keys not on the house list: a passkey, a key made in a browser, anyone’s own key. The devnet can’t tell who holds a key, so a test key the house made by hand lands here too: the nearest thing to use, not proof of it.',
} as const;
