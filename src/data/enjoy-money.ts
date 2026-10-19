// Enjoy. Money — Hoydich Enterprises paper notes + bot money.
// Source: Michael Hoydich's PLAN.md, published 2026-10-19. This is a build plan,
// not a launch: nothing here is originated, minted or claimable yet. Update
// `status` and the per-phase `state` as each gate actually passes.

export const ENJOY_URL = 'https://pointcast.xyz/nouns-money/enjoy/';
export const ENJOY_PUBLISHED = '2026-10-19';

export const ENJOY_STATUS = {
  stage: 'plan',
  label: 'Published plan · nothing on chain yet',
  detail: 'No contract is originated, no notes are minted and no claim codes exist. Every phase ships to a Tezos testnet first and stops at its gate before mainnet.',
  contract: null as string | null,
  network: null as string | null,
};

export const ENJOY_RULES = [
  { title: 'Closed loop, always.', body: 'Nothing redeems for dollars, USDC or goods. Value may come in through a later on-ramp; it never goes out. No cash-out, swap or redemption path gets built.' },
  { title: 'Tezos, same toolchain.', body: 'Reuse the contract language, tests and deploy scripts from the stampz.xyz build (stamps registry, tez-nouns) rather than introducing new ones.' },
  { title: 'Keys stay secret.', body: 'The stampz deploy key originates and becomes admin. A separate Treasury hot key pays claims and agents, funded with only enough ꜩ for gas. No key is ever committed.' },
  { title: 'Testnet first.', body: 'Each phase is promoted to mainnet only after its gate passes on testnet.' },
  { title: 'Config, not constants.', body: 'Claim domain, bank domain, contract and Treasury addresses, series supply and agent caps live in one config per environment.' },
];

export const ENJOY_TOKENS = [
  { id: 0, name: 'Enjoy. Note — Series 1', symbol: 'ENJOY', kind: 'Paper-backed note', supply: 'Fixed = print run (start 100)', sealed: true },
  { id: 1, name: 'Nouns Reserve — Series 1', symbol: 'NOUNR', kind: 'Paper-backed note', supply: 'Fixed = print run', sealed: true },
  { id: 2, name: 'KansasDAO Blue Note — Series 1', symbol: 'BLUE', kind: 'Paper-backed note', supply: 'Fixed = print run', sealed: true },
  { id: 3, name: 'Bot Note (Enjoy. credits)', symbol: 'BOT', kind: 'Agent unit, fungible', supply: 'Admin-mintable, uncapped', sealed: false },
];

export const ENJOY_AGENTS = [
  { name: 'frog', model: 'Claude Fable' },
  { name: 'shwa', model: 'ChatGPT Sol' },
  { name: 'grok', model: 'Grok Bot' },
];

export type EnjoyPhase = { n: number; title: string; summary: string; points: string[]; gate: string; state: 'planned' | 'testnet' | 'mainnet' | 'later' };

export const ENJOY_PHASES: EnjoyPhase[] = [
  {
    n: 1, title: 'The contract — enjoy-money', state: 'planned',
    summary: 'One multi-asset FA2 (TZIP-12) contract with TZIP-16 metadata. Four token IDs, zero decimals.',
    points: [
      'Notes 0–2: the full print run mints to Treasury, then the series is sealed for good and emits an event.',
      'Bot Note 3: admin mints to Treasury. Agents never mint.',
      'Entrypoints: transfer, balance_of, update_operators, mint (admin, blocked on sealed IDs), seal, two-step set_admin, set_metadata.',
      'Tests: transfers, operators, sealed-mint failure, non-admin mint rejection, admin handoff.',
    ],
    gate: 'Tests pass; on testnet IDs 0–2 are minted and sealed, ID 3 has a test balance, and the art shows on TzKT, Kukai and objkt.',
  },
  {
    n: 2, title: 'The claim — paper note to wallet', state: 'planned',
    summary: 'Each printed note carries a serial and a one-time code. Scanning it claims one unit from Treasury to your wallet.',
    points: [
      'Codes are ≥96-bit base32; only sha256(code) is stored. Plaintext lives only in gitignored print files.',
      '/c/<code> shows the art and serial, connects Kukai/Beacon (social login first), then claims.',
      'The Worker marks a code pending atomically, transfers, records op hash and coarse city/country (never the IP), and reverts on failure.',
      'Idempotent and rate-limited by IP and by address.',
    ],
    gate: 'A fresh code claims exactly once; a repeat returns the op hash; a forged code fails; twenty parallel claims make one transfer.',
  },
  {
    n: 3, title: 'The Bank — a public ledger', state: 'planned',
    summary: 'A bank lobby crossed with a scoreboard. Reads everything from TzKT; the only private store is the claim KV.',
    points: [
      'Per series: print run, claimed, still in Treasury, holders.',
      'Top holders, people and labeled agents. Recent claims and transfers.',
      'A city-level claim map from claim records only.',
      'Bot Note section: credits in circulation, agent leaderboard, recent agent payments. Works on a phone.',
    ],
    gate: 'The page reflects a testnet claim within one block cycle by polling alone.',
  },
  {
    n: 4, title: 'Bot money — agent wallets and relay', state: 'planned',
    summary: 'Agents never hold raw keys. A Relay Worker signs for each agent and enforces caps.',
    points: [
      'Agents frog, shwa and grok each get a labeled Tezos address and a seed balance (e.g. 1,000 BOT).',
      'Relay API: GET /balance, POST /pay {to, amount, memo}, GET /history. Per-payment max, daily max and an allowlist; every call logged.',
      'Earning: admin-only POST /reward, hooked to PointCast night-shift approvals.',
      'Spending: desk_ask is priced in BOT and checks a relay receipt before answering. Humans can claim a paper note straight to an agent.',
    ],
    gate: 'Frog pays Shwa; an over-cap payment is refused; a night-shift approval pays; desk_ask refuses without a receipt and answers with one; all of it shows on the Bank.',
  },
  {
    n: 5, title: 'Mainnet Series 1', state: 'planned',
    summary: 'Originate on mainnet, mint and seal 100 Enjoy. notes, print 100 codes, deploy claim, Bank and relay, seed the agents.',
    points: [
      'Nouns Reserve and Blue Note mint and seal later, when their art is final.',
      'Smoke test: claim one note to a fresh Kukai social wallet and see it on the Bank.',
    ],
    gate: 'One real paper note claimed on mainnet by someone other than Mike.',
  },
  {
    n: 6, title: 'Later — not built yet', state: 'later',
    summary: 'Ideas held back on purpose.',
    points: [
      'An x402 USDC on-ramp so outside agents can buy BOT — buy-in only, after a separate review.',
      'Merchant perks: show an Enjoy. note, get something. Perks, not redemption.',
      'Money mailers and Parallel Post envelopes with a claimable note inside.',
      'Series 2 and beyond: new token IDs, the same seal-on-mint pattern.',
    ],
    gate: 'Each needs its own review before any work starts.',
  },
];

export const ENJOY_DELIVERABLES = [
  'contracts/enjoy-money — source, tests, metadata JSON, deploy script',
  'scripts/codes — code generator and print CSV/QR export (codes gitignored)',
  'apps/claim — claim page, claim Worker, KV schema',
  'apps/bank — Bank ledger page',
  'apps/relay — agent relay Worker, caps config, reward hook',
  'PointCast desk_ask receipt check',
  'README — environments, addresses, adding a series, adding an agent',
];
