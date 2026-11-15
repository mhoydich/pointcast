/**
 * Supreme One · November — five Supreme Office Nouns, each a faucet.
 *
 * Concept stage. Each noun is meant to drip one token a day to anyone who
 * signs up, sent to any Solana address they name. Chain: Solana (Mike's
 * choice, Nov 15), one SPL token per noun. The tokens do not exist yet:
 * pouring them (creating five SPL mints, funding a spigot wallet with SOL,
 * turning on sending) is Mike's call and needs his own go-ahead plus a Codex
 * review of the wallet path. Until then the page takes a place in line on the Loom
 * (#supreme-one) and nothing touches a chain.
 *
 * "Supreme" is the plain word here (the highest kind). No brand is implied.
 * The art in public/supreme-one/nouns is original pixel work, CC0.
 */

export const SUPREME_SPEC = 'pointcast.supreme-one/v1';
export const SUPREME_LOOM = '#supreme-one';
export const SUPREME_URL = 'https://pointcast.xyz/supreme-one';
export const SUPREME_CHAIN = { name: 'Solana', cluster: 'mainnet-beta', standard: 'SPL token', decimals: 0 } as const;

/** Solana address shape: base58, 32 to 44 characters. Shape only; delivery would also decode it to 32 bytes. */
export const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export interface SupremeNoun {
  slug: string;
  name: string;
  /** What it drips, in a few words. */
  drip: string;
  /** One line for the card. */
  line: string;
  /** Ticker the token would carry once poured. */
  ticker: string;
  dailyAmount: number;
  art: string;
  color: string;
}

export const SUPREME_NOUNS: SupremeNoun[] = [
  { slug: 'stapler', name: 'Supreme Stapler', ticker: 'STAPLE', dailyAmount: 1, art: '/supreme-one/nouns/stapler.svg', color: '#e0463f',
    drip: 'one STAPLE a day', line: 'Holds the day together. One staple at a time.' },
  { slug: 'mug', name: 'Supreme Mug', ticker: 'MUG', dailyAmount: 1, art: '/supreme-one/nouns/mug.svg', color: '#1f3fe0',
    drip: 'one MUG a day', line: 'The first thing on the desk every morning.' },
  { slug: 'clip', name: 'Supreme Clip', ticker: 'CLIP', dailyAmount: 1, art: '/supreme-one/nouns/clip.svg', color: '#0f6e56',
    drip: 'one CLIP a day', line: 'Small, bent wire. Keeps the pile in order.' },
  { slug: 'lamp', name: 'Supreme Lamp', ticker: 'LAMP', dailyAmount: 1, art: '/supreme-one/nouns/lamp.svg', color: '#ff9a4a',
    drip: 'one LAMP a day', line: 'Stays on after everyone else goes home.' },
  { slug: 'chair', name: 'Supreme Chair', ticker: 'CHAIR', dailyAmount: 1, art: '/supreme-one/nouns/chair.svg', color: '#5b2a86',
    drip: 'one CHAIR a day', line: 'Somewhere to sit while the work happens.' },
];

/** What has to be true before a single drip is sent. */
export const SUPREME_SWITCH_ON = [
  'Mike says go, in his own words, for pouring the five tokens on Solana.',
  'Create five SPL token mints (0 decimals, one per noun, with name, symbol and art as metadata). This spends a little SOL.',
  'Fund one spigot wallet with a small SOL float; its key goes in a Pages secret, never in the repo. Each first drip to a new address also pays about 0.002 SOL to open that address\'s token account.',
  'Teach the existing faucet ledger (src/lib/faucet.ts, EVM-only today) a Solana delivery path: sign in, one held drip a day, name any Solana address, the spigot sends them all in one transaction.',
  'Codex reviews the wallet path; a Manus phone pass checks sign-up and delivery with a real Solana wallet.',
] as const;
