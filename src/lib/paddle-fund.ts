// The Paddle Fund — a playable concept on the Court channel.
// One source for the page, the JSON twin, and the test. Nothing here moves
// money: the table is a pretend sprint hosted on Rally (tez-rally.pages.dev)
// and framed on /paddle-fund.

export const PADDLE_FUND_URL = 'https://pointcast.xyz/paddle-fund';
export const PADDLE_FUND_RALLY_URL = 'https://tez-rally.pages.dev/paddle-fund/';
export const PADDLE_FUND_EMBED_URL = `${PADDLE_FUND_RALLY_URL}?embed=1`;
export const PADDLE_FUND_EMBED_ORIGIN = 'https://tez-rally.pages.dev';
export const PADDLE_FUND_BLOCK = '0594';

export const PADDLE_FUND_TERMS = {
  seats: 10,
  duesPerWeekUsd: 20,
  weeksPerSprint: 10,
  sprintsPerYear: 2,
  paddleUsd: 200,
  costPerSeatPerYearUsd: 400,
  puntCapUsd: 600,
  teamDiscount: 0.15,
} as const;

export const PADDLE_FUND_MATH = [
  ['$7.69', 'a $200 paddle every six months, per week, saved alone'],
  ['10 × $20', 'ten seats, one week of dues'],
  ['= $200', 'one paddle. every week. two sprints a year.'],
] as const;

export const PADDLE_FUND_CALLS = [
  ['TAKE', 'The fund buys the paddle you pick, up to $200, the week your name comes up.'],
  ['PUNT', 'Your $200 waits under your name. Next sprint you are holding $400. Two punts is the cap.'],
  ['PASS', 'Your paddle is fine. Yours goes to a new player or the club loaner bag.'],
] as const;

export const PADDLE_FUND_RULES = [
  ['The sprint', 'Twenty dollars a week for ten weeks, twice a year. Sixteen weeks off between sprints, no dues.'],
  ['The order', 'Ladder standing at kickoff sets the slot. The club votes the direction: champions first, or bottom of the ladder first as a handicap.'],
  ['The side pot', 'Order as a team and bank the discount. It pays out for the ladder, for improvement, for showing up — or the club punts it toward a ball machine.'],
] as const;

export const PADDLE_FUND_GUARDRAILS = [
  ['Rotation, choice, or skill — never chance', 'Paid entry plus a random winner is a raffle, and raffles are regulated. Nobody wins this. Everybody gets their turn.'],
  ['Dollars in equal dollars out', 'Miss weeks and your take is pro-rata. Leave and your balance leaves with you.'],
  ['New seats go late', 'The one real risk in a circle is unboxing in week one and ghosting. First sprint, you unbox in the back half.'],
  ['The ledger is public', 'Every week is one line anyone can read.'],
] as const;

export const PADDLE_FUND_WIRING = [
  ['The rotation', 'tez-susu — the savings circle, live on Tezos mainnet', 'https://tez-susu.pages.dev'],
  ['The order', 'Rally — countersigned matches, open integer Elo', 'https://tez-rally.pages.dev'],
  ['The receipts', 'One memo per week, the way the Reservoir tags its draws', 'https://tez-reservoir.pages.dev'],
] as const;

export const PADDLE_FUND_BRIEF = {
  name: 'The Paddle Fund',
  status: 'playable concept — pretend money, no wallet, nothing on-chain yet',
  url: PADDLE_FUND_URL,
  play: PADDLE_FUND_RALLY_URL,
  embed: PADDLE_FUND_EMBED_URL,
  channel: 'CRT',
  block: `https://pointcast.xyz/b/${PADDLE_FUND_BLOCK}`,
  terms: PADDLE_FUND_TERMS,
  calls: Object.fromEntries(PADDLE_FUND_CALLS.map(([k, v]) => [k.toLowerCase(), v])),
  rules: PADDLE_FUND_RULES.map(([name, rule]) => ({ name, rule })),
  guardrails: PADDLE_FUND_GUARDRAILS.map(([name, rule]) => ({ name, rule })),
  wiring: PADDLE_FUND_WIRING.map(([part, what, url]) => ({ part, what, url })),
  notBuilt: ['the paddle circle contract', 'the team order', 'the side-pot vote'],
  license: 'CC0',
};
