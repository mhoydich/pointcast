/**
 * The PointCast faucet — a registry of tokens that drip.
 *
 * A faucet here is a 2018-style spigot with 2026 onboarding: you claim with a
 * PointCast account (Google, passkey, or email), PointCast holds the drip in
 * a ledger, and whenever you like you name an address and the spigot wallet
 * sends it. Nobody signs anything. The spigot pays gas.
 *
 * The first spigot is HELLO, an ERC-20 Mike deployed on Ethereum mainnet in
 * 2019 (see src/content/eth-legacy/hello.json). It has no value and never
 * will; the drip is a greeting, not a payout.
 *
 * Nothing here touches the network. Chain reads and sends live in
 * functions/api/faucet/_claims.ts.
 */

export type FaucetChain = 'ethereum';

export interface FaucetToken {
  /** URL and ledger key: /faucet/{slug} (the older /faucet reads the Visit Nouns tap), faucet_claims.faucet = slug. */
  slug: string;
  name: string;
  ticker: string;
  chain: FaucetChain;
  chainId: number;
  /** ERC-20 contract address, lowercase 0x. */
  contract: `0x${string}`;
  /**
   * The 2019 deployer. Mike chose this same key as the spigot signer, so it is
   * both the public origin story and the wallet the server signs with.
   */
  deployer: `0x${string}`;
  deployedYear: number;
  /** Whole tokens per drip. Decimals are read from the contract at send time. */
  dailyAmount: number;
  /** Plain-English line for the desk. */
  greeting: string;
  /** Where the token's own retrospective lives. */
  legacyHref: string;
  color: string;
  /** noun.pics seed for the front-door cell. */
  noun: number;
  /**
   * How a drip is earned. `button` is the 2018 faucet: sign in, click, done.
   * `receipt` means the desk will not write a line without a signed completion
   * receipt from an allowlisted satellite (see src/lib/rewards.ts), because the
   * token is the ending of something you did rather than a daily allowance.
   */
  claim: 'button' | 'receipt';
}

export const FAUCET_CANONICAL = 'https://pointcast.xyz/faucet/hello';
export const FAUCET_SPEC = 'pointcast.faucet/v1';

/** Default claims per faucet per Los Angeles day; env can lower or raise it (max 500). */
export const FAUCET_DEFAULT_DAILY_CAP = 50;

export const FAUCETS: FaucetToken[] = [
  {
    slug: 'hello',
    name: 'Hello | a greeting',
    ticker: 'HELLO',
    chain: 'ethereum',
    chainId: 1,
    contract: '0x1fda96405dd8ee22631abcf4f61282eae802012f',
    deployer: '0x676ac0931de1ae311c47f3fa2f3f653e668c186e',
    deployedYear: 2019,
    dailyAmount: 1,
    greeting: 'One HELLO a day. It says hello. That is the whole token.',
    legacyHref: '/eth-legacy',
    color: '#185FA5',
    noun: 1,
    claim: 'button',
  },
  {
    slug: 'fishclub',
    name: 'FishClub | All things fishing',
    ticker: 'FISHCLUB',
    chain: 'ethereum',
    chainId: 1,
    // A different 2019 address from HELLO's. See src/content/eth-legacy/fishclub.json;
    // the catalog is provenance, not a fresh balance or key check.
    contract: '0x3bca69e033b3605a714dd815f51cb4e9d5b4693a',
    deployer: '0xe62e0219053ddc0c5a1dafbdfb947310a528a3a7',
    deployedYear: 2019,
    dailyAmount: 1,
    greeting: 'One FISHCLUB for five quiet minutes. The room is still open.',
    legacyHref: '/eth-legacy',
    color: '#0F6E56',
    noun: 1088,
    claim: 'receipt',
  },
];

export function getFaucet(slug: string | undefined | null): FaucetToken | null {
  if (!slug) return null;
  const key = slug.toLowerCase();
  return FAUCETS.find((faucet) => faucet.slug === key) ?? null;
}

/**
 * Ethereum address, either case. Shape only — the delivery path additionally
 * checks EIP-55 when the paste is mixed case (see checkedDestination).
 */
export const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
/** Either case: viem lowercases, but a hash is never rejected for its casing. */
export const EVM_TX_HASH = /^0x[0-9a-fA-F]{64}$/;

export function isEvmAddress(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && EVM_ADDRESS.test(value);
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export function explorerAddressUrl(faucet: FaucetToken, address: string): string {
  return `https://etherscan.io/address/${address}`;
}

export function explorerTokenUrl(faucet: FaucetToken): string {
  return `https://etherscan.io/token/${faucet.contract}`;
}

export function explorerTxUrl(faucet: FaucetToken, hash: string): string {
  return `https://etherscan.io/tx/${hash}`;
}

/** YYYY-MM-DD in Los Angeles; the faucet resets at midnight Pacific like every other room. */
export function losAngelesDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function faucetDailyCap(value: string | undefined): number {
  const parsed = Number(value ?? FAUCET_DEFAULT_DAILY_CAP);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 500) : FAUCET_DEFAULT_DAILY_CAP;
}

/** The plain-English desk copy: what happens at each step, in order. */
export const FAUCET_STEPS = [
  {
    n: 1,
    title: 'Sign in',
    body: 'Google, a passkey, or an email link. No wallet, no extension, no seed phrase. The account is the claim ticket.',
  },
  {
    n: 2,
    title: 'Claim today’s drip',
    body: 'One click. PointCast writes a line in its ledger: this account is owed one HELLO. Nothing touches the chain yet.',
  },
  {
    n: 3,
    title: 'Come back tomorrow',
    body: 'The spigot resets at midnight Pacific. Drips stack in your ledger until you want them somewhere.',
  },
  {
    n: 4,
    title: 'Name an address, whenever',
    body: 'Paste any Ethereum address. The spigot wallet sends every drip you are owed in one transaction and pays the gas. You sign nothing.',
  },
] as const;
