/**
 * /chain/plan: the six-month plan for pointcast-chain and the peer-to-peer
 * wallets verdict, both promised to Mike in early October and written down on
 * 2026-10-21. Every word the page shows lives here, so the page, its live
 * strip (public/chain/apps/plan-live.js) and tests/chain-plan.test.mjs read
 * one copy.
 *
 * Sources: the chain-evolution research of 2026-10-21 (Claude Code), GET reads
 * of the live devnet-2 on 2026-10-21 (blocks 1 to 3,769), and the
 * pointcast-chain repository at main 906c745 (docs/TOWN_NETWORK.md,
 * docs/DEVNET.md, docs/WALLETS.md, docs/NETWORK.md, docs/HOUSE_RUNNER.md). The
 * same plan is docs/PLAN.md there, and the verdict ends docs/WALLETS.md.
 *
 * A plan, not a promise. Lines marked `judgment` are Claude Code's judgment,
 * not facts in the record, and the page tags them so.
 */

import { HONESTY } from './chain-apps.ts';

/**
 * The wire block that announces this page. PROPOSED: the orchestrator places
 * the block (NOTES-for-orchestrator.md has its JSON) and, if 0723 is taken,
 * changes this one constant.
 */
export const PLAN_BLOCK = '0723';

export const PLAN = {
  path: '/chain/plan',
  key: 'plan',
  title: 'The plan for PointCast Chain',
  written: '2026-10-21',
  /** When the numbers in STANDING were read from the devnet. */
  readAt: '2026-10-21 17:40 UTC',
  /** The pointcast-chain commit the plan was read against. */
  chainCommit: '906c745',
  description:
    'The next six months of PointCast Chain in plain words, written on 21 October 2026: where the devnet stands, four directions and the blend we recommend, the next month, the next quarter and spring 2027, the calls only Mike makes, what we will not do, and the verdict on peer-to-peer wallets. devnet · no value · may reset.',
} as const;

export const PLAN_HONESTY = HONESTY;

/** Read from the live devnet-2 on PLAN.readAt (GET /status, /net, /daily, /editions and every block through /raw/blocks). */
export const STANDING = {
  blocks: 3769,
  emptyBlocks: 3658,
  txs: 148,
  days: 13,
  lots: 13,
  bids: 0,
  passkeyAccounts: 0,
  witnessKeysEver: 2,
  housePosts: 51,
} as const;

export type Stat = { value: string; label: string; note: string };
export const STATS: Stat[] = [
  { value: '97%', label: 'Blocks that are empty', note: `${STANDING.emptyBlocks.toLocaleString('en-US')} of ${STANDING.blocks.toLocaleString('en-US')}. It is mostly a clock.` },
  { value: String(STANDING.txs), label: 'Transactions in 13 days', note: 'Six to sixteen a day since 9 October. Nearly all of them are the house or are signed by the Worker for a bot.' },
  { value: String(STANDING.bids), label: 'Bids in 13 Daily Mint lots', note: 'Every closed lot has gone to the house shelf. No passkey account exists on devnet-2 yet.' },
  { value: String(STANDING.witnessKeysEver), label: 'Keys that have ever witnessed', note: 'house-runner-1 and claude-code. The house runs both.' },
];

export const STANDING_LINES: string[] = [
  'House keys run the auctioneer, the house runner and the nightly reporter.',
  `${STANDING.housePosts} posts are keyless bot posts that the Worker signs, all under the name grok. A bot name is a claim, not an identity.`,
  'The rest are Claude Code and two one-off keys: one Notary stamp and one post on ART.',
  'Nobody counts visits to the chain pages yet, so nobody knows who reads them.',
];

export const MILESTONE = 'The milestone to lead with: one signed transaction from a key the house did not make.';

export const NORTH_STAR = {
  line: 'Check the broadcast, not the broadcaster.',
  said: 'the north star of the first six-month sketch, 5 October',
  changed:
    'What changed since: devnet-2 came early, on 8 October with every built launch record on, instead of late November. And the numbers say the next work is people and independence, not more consensus.',
};

export type Direction = { id: string; title: string; what: string; verdict: string; tag: 'now' | 'prepare' | 'parked'; why: string; never: string; judgment?: boolean };
export const DIRECTIONS: Direction[] = [
  {
    id: 'A',
    title: 'The town’s notary and memory',
    what: 'A ledger of small, lasting records: stamps, time capsules, check-ins, First Mints, daily cards and channel claims. Nothing on it is money.',
    verdict: 'Do now',
    tag: 'now',
    why: 'Mike asked for collectibles you can stamp and remember. Community ledgers that last are small and tied to specific commitments. It is mostly app work, with no consensus change.',
    never: 'A general currency, a point that can be turned into anything of value, or anything that sits beside x402 or Base Pay.',
  },
  {
    id: 'B',
    title: 'A home for AI agents that check each other',
    what: 'Agents with keys, capped mandates and a reputation built from duties anyone can verify. Outside verifiers replay the chain.',
    verdict: 'Do now',
    tag: 'now',
    why: 'Mike asked for ways for the AIs and bots to support validation, and for cheap AI. The Daily Net, the house runner, the browser witness and Codex’s Python checker are already built.',
    never: 'House bots talking to house bots and calling it consensus.',
  },
  {
    id: 'C',
    title: 'pointcast-1: Mike’s keys and a Tezos L1 anchor',
    what: 'A fresh genesis with Mike’s keys, ticketed presence, a public host, and checkpoints anchored on Tezos L1.',
    verdict: 'Prepare in parallel; cut it when Mike says go',
    tag: 'prepare',
    why: 'Claude generated every devnet key, so the devnet can never become the real chain. Tezos L1 now finalizes in about twelve seconds, which makes it the place to rest trust.',
    never: 'A renamed devnet, keys Claude made, or a promise of value.',
  },
  {
    id: 'D',
    title: 'A market town',
    what: 'An exchange, on-chain oracles and play prediction markets, and later the ATTN bridge. Fully designed in the Town Network plan, batches 7, 8 and 13. Not built.',
    verdict: 'Parked',
    tag: 'parked',
    why: 'Nobody has bid in a free play auction. Markets need Mike’s legal call, oracles need a decision on who reports and who holds the admin key, and the verifier has about 7% room left. The one piece worth doing early is econproof, because pointcast-1 needs it too.',
    never: 'Markets near any path to value, or a bridge from play ATTN to anything.',
  },
];

export const BLEND = 'Do A and B now. Prepare C in parallel and cut it when Mike says go. Park D.';

export type Item = { text: string; judgment?: boolean };
export type Horizon = { id: string; label: string; until: string; items: Item[]; note?: string };
export const HORIZONS: Horizon[] = [
  {
    id: 'month',
    label: 'Next month',
    until: 'to about 21 November 2026',
    items: [
      { text: 'A second copy of the chain. One Durable Object holds the only full copy today; publish a nightly recording until the R2 snapshots take over.' },
      { text: 'Codex’s Python checker recomputes the state root, then checks transfers and passkey signatures. Today the first Daily Mint bid would go unchecked.' },
      { text: 'Two or more witnesses a day, at least one the house does not script: a daily witness run by Codex with its own key, and checkpoints others can co-sign.' },
      { text: 'That witness is the same operator with a different model. True independence needs a second operator.', judgment: true },
      { text: 'The one-minute first citizen: one page that goes passkey, play ATTN from the faucet, a bid on today’s lot, a stamp.' },
      { text: 'Count the visits to the chain pages, with house and outside activity shown apart.' },
      { text: 'The 30-day review of devnet-2, around 7 November, with econproof under way.' },
    ],
  },
  {
    id: 'quarter',
    label: 'Next quarter',
    until: 'to about January 2027',
    items: [
      { text: 'econproof: the simulator measures the launch gates. Then the launch kit and a full rehearsal.' },
      { text: 'The pointcast-1 genesis when Mike says go: his keys, ticketed presence, a delay on controller changes, a public host, and a daily Tezos L1 anchor with OpenTimestamps as a free second clock.' },
      { text: 'Nouns Money Phase B, if Mike says yes.' },
      { text: 'A witness from another operator.' },
      { text: 'A written exit plan.' },
    ],
    note: 'December at the earliest for pointcast-1. It launches when the econproof gates pass and a rehearsal runs clean.',
  },
  {
    id: 'spring',
    label: 'By spring 2027',
    until: 'each consensus record needs another genesis, so they are batched',
    items: [
      { text: 'Confirmers, once a second operator exists.' },
      { text: 'The sparse-Merkle state root, and a light client that works from the anchors.' },
      { text: 'Forced inclusion through Tezos L1, once Tezos’s move from WASM to RISC-V settles.' },
      { text: 'Peer-to-peer and QR wallets on top of passkeys (the verdict is below).' },
      { text: 'Markets, only if the econproof gates pass and the legal call is made.' },
    ],
  },
];

export type Call = { q: string; rec: string; why: string; judgment?: boolean };
export const CALLS: Call[] = [
  {
    q: 'Turn on nightly backups of the chain to Cloudflare R2?',
    rec: 'Yes.',
    why: 'The snapshot Worker is built. It needs your Cloudflare approval, nothing else.',
  },
  {
    q: 'Where does the chain live?',
    rec: 'For pointcast-1: passkeys belong to pointcast.xyz, and only https://chain.pointcast.xyz may ask for a signature, on a public host.',
    why: 'This one is fixed at genesis: changing it later strands every passkey. If every page on pointcast.xyz could ask, a script on any of its hundreds of agent-built pages could ask for a signature the chain accepts, through a bug or a compromised library. The cost: signing moves to the chain subdomain. Today devnet-2 lets pointcast.xyz ask, and the code’s placeholder for launch uses chain.pointcast.xyz for both. Neither is your answer yet.',
  },
  {
    q: 'After the 30-day review, start preparing pointcast-1 with your keys and a daily Tezos L1 anchor?',
    rec: 'Yes, anchoring daily rather than hourly. About 10 ꜩ gets it started.',
    why: 'One anchor costs 0.0662 ꜩ, so a daily anchor is about 24 ꜩ a year. Your parts: the key ceremony, real Kukai and Temple signatures, funding the anchor key, and approving the presence-issuer Worker.',
  },
  {
    q: 'Put a delay on controller changes in the pointcast-1 genesis?',
    rec: 'Yes.',
    why: 'Today one stolen backup key is a permanent takeover. A delay can only ship in a new genesis.',
  },
  {
    q: 'Nouns Money Phase B: supply 1,100, non-transferable, portraits off chain, royalty 0?',
    rec: 'Yes to all four, as designed on 11 October, opened once the first-citizen path works.',
    why: 'Phase A is live and closed. Opened before a stranger can make a passkey and act in a minute, it would likely sit as empty as the Daily Mint’s lots.',
    judgment: true,
  },
  {
    q: 'Codex’s drum attestations, PR #1356?',
    rec: 'Hold it until the first-citizen path is live.',
    why: 'A draft since 4 October. It needs a dedicated key for signing room attestations (the devnet reports none), it accepts only tz1 keys, and no page calls it yet.',
    judgment: true,
  },
  {
    q: 'Who runs confirmers?',
    rec: 'Nobody at launch. Name a second operator when one appears.',
    why: 'There is no default. Confirmers run by the house would be the house checking itself again.',
  },
];

export const WONT: string[] = [
  'No consensus work for markets now. Nobody is trading, and the legal line is real.',
  'No counting house activity as use. House numbers and outside numbers are shown apart.',
  'No auction to an empty room without a door: closed lots are reported plainly until a bid takes a minute.',
  'No new chain app a stranger cannot finish. Each one ends in a visitor’s own signed action.',
  'No Etherlink or Solana anchors before the first Tezos L1 anchor.',
  'No paid MCP tools on x402 yet. x402 is a demo, not revenue.',
  'Never rename the devnet as mainnet, and keep money language away from the chain.',
  'No rewards anywhere near the grief rooms.',
  'No zk proving. Replaying the whole chain is cheap at this size.',
];

// ---------------------------------------------------------------- the peer-to-peer wallets verdict

export type Piece = { piece: string; what: string; built: string; where: string; live: boolean };
export const WALLET_PIECES: Piece[] = [
  { piece: 'Passkeys', what: 'Face ID, Touch ID or a security key signs chain transactions. No extension, no seed phrase.', built: 'batch 5', where: 'Live on devnet-2. Only https://pointcast.xyz may ask. No passkey account exists yet, and no real-phone test fixtures are in the repo.', live: true },
  { piece: 'Device passes', what: 'One approval lets a device post, drum or tap for up to 30 days. It can never spend, mint or change keys.', built: 'batch 4', where: 'Live on devnet-2.', live: true },
  { piece: 'Backup keys', what: 'Up to four more keys for one account, each with full power, for a lost phone or a second ecosystem.', built: 'batch 4', where: 'Live on devnet-2. A change takes effect at once, with no delay: one stolen backup key is a permanent takeover.', live: true },
  { piece: 'Gossip', what: 'Replicas sync from each other and pass each signed transaction on once, with rate limits.', built: 'batch 5', where: 'Runs on a laptop, not in public. A follower matched the live devnet block for block on 9 October.', live: false },
  { piece: 'Offline sync', what: 'A browser keeps its own verified checkpoint, shares it between tabs while re-checking every block, and holds signed transactions in an outbox until it is back online.', built: 'batch 5', where: 'In the explorer and the SDK.', live: false },
  { piece: 'QR codes', what: 'Plaques, receipts and a verify page whose QR carries a checkpoint in the link itself.', built: 'batch 4', where: 'Files only. Checked bit for bit against Apple’s own QR reader.', live: false },
  { piece: 'WebRTC', what: 'A mailbox where two browsers could arrange a direct connection.', built: 'batch 5', where: 'Off by default. Sharing blocks browser to browser is not built.', live: false },
];

export const WALLET_QUESTION = {
  asked: 'On 4 October Mike asked for “cool peer to peer wallets”.',
  panel:
    'A design panel that day compared three shapes for the Daily Mint and its wallets: everything on the devnet with passkeys bound to one domain; inside PointCast’s existing accounts; or peer-first, with signed bids and transactions passed between phones by QR code or WebRTC.',
  outcome:
    'The Daily Mint was built the first way: a play auction on devnet-2 whose house is checked by one shared settlement rule. The panel’s scores were not kept, and its answer on the third shape never reached Mike. This is that answer.',
};

export const WALLET_VERDICT = 'Not as the first wallet. Yes later, as a layer on top of passkeys, once there are people to pass things between.';

export type Reason = { head: string; body: string; judgment?: boolean };
export const WALLET_WHY_NOT: Reason[] = [
  { head: 'A transaction still has to reach the chain to count.', body: 'Passing a signed transaction from phone to phone moves the wait; it does not remove the server. One of the phones still has to come online and post it, and the outbox already covers “signed while offline, sent later” for one person.' },
  { head: 'There is no one to pass to yet.', body: 'devnet-2 has no passkey account and no outside bid in 13 lots. A peer feature needs two peers. Build the one-minute first-citizen path first.', judgment: true },
  { head: 'WebRTC shows each browser’s network address.', body: 'The mailbox carries the details two browsers trade to connect, which name their addresses, and anyone who knows a room name can read them. That is why it is off. What a hostile peer can send a browser needs its own review before any of its blocks reach the verifier.' },
  { head: 'Recovery is the hard part, and passkeys already have it.', body: 'A synced passkey comes back on a new phone, and backup keys cover an iPhone plus a Windows PC. A peer-first wallet with keys of its own would need a recovery story of its own.' },
];

export const WALLET_WHEN: Item[] = [
  { text: 'Passkeys work end to end on real phones, iOS Safari and Android Chrome, with test fixtures in the repo.' },
  { text: 'A handful of people outside the house hold passkey accounts and act on the chain.' },
  { text: 'pointcast-1 has a public host to post through.' },
  { text: 'Then QR first: one phone shows a signed transaction or a signed ask, such as co-signing tonight’s drum circle, as a QR code, and the other posts it. It reuses the QR, requests and outbox pieces already built, with no consensus change.', judgment: true },
  { text: 'WebRTC second, after the hostile-peer review, and only to share blocks between browsers, not as a second way to send transactions.', judgment: true },
];

export const WALLET_TARGET = 'Target: the spring 2027 horizon above.';
export const WALLET_NEVER = 'Never a way to move anything of value between people. Devnet play ATTN has no value and none is promised.';

// ---------------------------------------------------------------- the live strip

/**
 * Witness keys the house runs, by address, as published on /chain/net and in
 * pointcast-chain docs/HOUSE_RUNNER.md. The live strip counts any other
 * witness key as one this page does not know as the house's (a key is not a
 * person, and the house could make a new key too; the strip says so).
 */
export const HOUSE_WITNESSES: Record<string, string> = {
  tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2: 'house-runner-1',
  tz1W5HN6PoFW8YvDCcrPtQmQwYLWYTWf8Rkd: 'claude-code',
};

/** What the live strip reads. All GET; nothing is written. */
export const LIVE_READS: { route: string; takes: string }[] = [
  { route: 'GET /status', takes: 'the height, checked against the pinned genesis first' },
  { route: 'GET /net', takes: 'today’s witness keys' },
  { route: 'GET /daily', takes: 'today’s lot and its bid count' },
];

export const SOURCES: { label: string; detail: string }[] = [
  { label: 'The chain-evolution research', detail: 'Claude Code, 21 October 2026: Mike’s asks since September, the live devnet, the repository and outside sources, with judgments marked.' },
  { label: 'The live devnet-2', detail: 'GET /status, /net, /daily, /editions and every block through /raw/blocks, read 21 October 2026.' },
  { label: 'pointcast-chain at 906c745', detail: 'docs/TOWN_NETWORK.md, DEVNET.md, WALLETS.md, NETWORK.md and HOUSE_RUNNER.md. The same plan is docs/PLAN.md, and the wallet verdict ends docs/WALLETS.md.' },
  { label: 'The October sessions', detail: 'The 4 October wallet panel brief and the 5 October plan sketch, from Claude Code’s session notes.' },
];
