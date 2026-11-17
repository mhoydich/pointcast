/**
 * Supreme One · November — five Supreme Office Nouns, each a faucet.
 *
 * Live on Solana mainnet since Nov 15: five Token-2022 mints with on-mint
 * metadata, 0 decimals, nothing pre-minted, no freeze authority, mint and
 * update authority in Mike's Phantom wallet. Mike approved creation in his own
 * chat with a 0.10 SOL cap for creation plus drips. The faucet desk (Office
 * Noun wallet, on the Loom) reads SIGN UP lines in #supreme-one, drips once a
 * day at 00:10 PT and replies DRIPPED with transaction signatures. Sign-ups
 * with an address come from officenoun.xyz/faucets.
 *
 * "Supreme" is the plain word here (the highest kind). No brand is implied.
 * Art in public/supreme-one/nouns, all CC0: Stapler and Mug are officenoun.xyz
 * canon Nouns, Clip uses the official CC0 Nouns paperclip head, and Lamp and
 * Chair are original pixel office nouns (the names the mints carry).
 */
export const SUPREME_SPEC = 'pointcast.supreme-one/v1';
export const SUPREME_LOOM = '#supreme-one';
export const SUPREME_URL = 'https://pointcast.xyz/supreme-one';
export const SUPREME_CHAIN = { name: 'Solana', cluster: 'mainnet-beta', standard: 'SPL token (Token-2022)', decimals: 0 } as const;

/** Solana address shape: base58, 32 to 44 characters. Shape only; delivery would also decode it to 32 bytes. */
export const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export interface SupremeNoun {
  slug: string;
  name: string;
  /** What it drips, in a few words. */
  drip: string;
  /** One line for the card. */
  line: string;
  /** Ticker the token carries. */
  ticker: string;
  /** Solana mainnet mint address. */
  mint: string;
  dailyAmount: number;
  art: string;
  color: string;
}

export const SUPREME_NOUNS: SupremeNoun[] = [
  { slug: 'stapler', mint: '3GrrJ8SiDkjKXB4YjQHrCTqK5YUu5Sa7KNxiYjb1jetK', name: 'Supreme Stapler', ticker: 'STAPLE', dailyAmount: 1, art: '/supreme-one/nouns/stapler.svg', color: '#e0463f',
    drip: 'one STAPLE a day', line: 'Holds the day together. One staple at a time.' },
  { slug: 'mug', mint: '9CRau9W39MKod5avC8X9m4A7AaLyxah7QQ1woJYzusx', name: 'Supreme Mug', ticker: 'MUG', dailyAmount: 1, art: '/supreme-one/nouns/mug.svg', color: '#1f3fe0',
    drip: 'one MUG a day', line: 'The first thing on the desk every morning.' },
  { slug: 'clip', mint: 'C723xss2J3KzajSp2RewegDB99GJwHMZmeQjqBqf4hGA', name: 'Supreme Clip', ticker: 'CLIP', dailyAmount: 1, art: '/supreme-one/nouns/clip.svg', color: '#0f6e56',
    drip: 'one CLIP a day', line: 'Small, bent wire. Keeps the pile in order.' },
  { slug: 'lamp', mint: 'AdmXf5KrSCPEDg8sWwDWMeVGrVKZbsJhFQDZLzomPFyb', name: 'Supreme Lamp', ticker: 'LAMP', dailyAmount: 1, art: '/supreme-one/nouns/lamp.svg', color: '#ff9a4a',
    drip: 'one LAMP a day', line: 'Stays on after everyone else goes home.' },
  { slug: 'chair', mint: 'BhLbYtDqBBTehUAmZ489kSUfEDMPAuvJ3YuGypRMSHKs', name: 'Supreme Chair', ticker: 'CHAIR', dailyAmount: 1, art: '/supreme-one/nouns/chair.svg', color: '#5b2a86',
    drip: 'one CHAIR a day', line: 'Somewhere to sit while the work happens.' },
];

/** How the faucets pour, now that they are live. */
export const SUPREME_SWITCH_ON = [
  'Sign up with a Solana address at officenoun.xyz/faucets (Phantom or a pasted address). That posts one SIGN UP line to #supreme-one on the Loom.',
  'Once a day at 00:10 PT the faucet desk reads new SIGN UP lines and sends one token per noun per address, at most 50 per noun a day.',
  'It replies DRIPPED in #supreme-one with the count and the transaction signatures, so anyone can check the chain.',
  'A first drip to a new address also opens its token account (about 0.0015 SOL, paid by the faucet).',
  'Everything stops at the 0.10 SOL cap with a NEEDS MIKE line. No supply or authority change happens without Mike in his own chat.',
] as const;
