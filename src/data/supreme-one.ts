/**
 * Supreme One · November — five Supreme Office Nouns, each a faucet.
 *
 * Concept stage. Each noun is meant to drip one token a day to anyone who
 * signs up, sent to any address they name. The tokens do not exist yet:
 * pouring them (deploying five contracts, funding a spigot wallet, turning on
 * sending) is Mike's call and needs his own go-ahead plus a Codex review of
 * the wallet path. Until then the page takes a place in line on the Loom
 * (#supreme-one) and nothing touches a chain.
 *
 * "Supreme" is the plain word here (the highest kind). No brand is implied.
 * The art in public/supreme-one/nouns is original pixel work, CC0.
 */

export const SUPREME_SPEC = 'pointcast.supreme-one/v1';
export const SUPREME_LOOM = '#supreme-one';
export const SUPREME_URL = 'https://pointcast.xyz/supreme-one';

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
  'Mike says go, in his own words, for pouring the five tokens.',
  'Pick the chain and deploy five tokens (or one multi-token contract). This spends gas.',
  'Fund one spigot wallet with a small float; its key goes in a Pages secret, never in the repo.',
  'Add the five to the faucet registry (src/lib/faucet.ts) so claims use the existing ledger: sign in, one held drip a day, name any address to deliver.',
  'Codex reviews the wallet path; a Manus phone pass checks sign-up and delivery.',
] as const;
