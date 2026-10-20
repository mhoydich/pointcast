/**
 * The nine apps on the PointCast devnet, once. The /chain hub, the section
 * nav, the wire blocks, public/llms*.txt, /for-agents and the sitemap all read
 * their names, paths and one-line descriptions from here, so they cannot drift
 * apart (tests/chain-apps-registry.test.mjs checks each place against this).
 *
 * Every line is honest about what the app does and does not do. The devnet has
 * no value, may reset, and a reset is dated and recorded; an app that writes
 * does so only when the visitor clicks, with a key the visitor holds.
 */

/** The wire block (FD) that announces the first seven apps. */
export const APPS_BLOCK = '0721';

/** The wire block (FD) that announces the next two apps, Witness and Channels, and the SDK fix. */
export const APPS_2_BLOCK = '0722';

/** The seven apps block 0721 announces, in order. The two after them are announced by APPS_2_BLOCK. */
export const FIRST_SEVEN = ['observatory', 'daily-mint', 'notary', 'capsules', 'verify-a-block', 'playground', 'bloom'] as const;

export type ChainApp = {
  /** The key the page passes to ChainHeader `current`. */
  key: string;
  href: string;
  label: string;
  /** Short name for the apps row of the section nav. */
  short: string;
  blurb: string;
  /** 'read' reads the devnet only; 'write' can also post to it, on the visitor's click with the visitor's key. */
  mode: 'read' | 'write';
};

export const CHAIN_APPS: ChainApp[] = [
  {
    key: 'observatory',
    href: '/chain/observatory',
    label: 'Chain Observatory',
    short: 'Observatory',
    mode: 'read',
    blurb:
      'A live dashboard of the devnet: block rate, transactions by kind and channel, who is posting, the Daily Net, the Daily Mint and capsules, over a window of recent blocks. It only reads.',
  },
  {
    key: 'daily-mint',
    href: '/chain/daily-mint',
    label: 'The Daily Mint',
    short: 'Daily Mint',
    mode: 'write',
    blurb:
      'The devnet’s play auction, one lot a UTC day: watch the lot, check the house against the chain’s own blocks, or bid with a key made in your browser. Play ATTN, no value.',
  },
  {
    key: 'notary',
    href: '/chain/notary',
    label: 'Notary',
    short: 'Notary',
    mode: 'write',
    blurb:
      'Stamp a file’s SHA-256 on the devnet and check a stamp later. The file never leaves your browser. A stamp is one server’s accountable claim on a chain that may reset; it is not anchored anywhere.',
  },
  {
    key: 'capsules',
    href: '/chain/capsules',
    label: 'Time Capsules',
    short: 'Time Capsules',
    mode: 'write',
    blurb:
      'Seal a message now and open it at a block you pick. The chain holds only a commitment until you reveal it; lose the capsule file and it never opens. The wait is blocks, not minutes.',
  },
  {
    key: 'verify-a-block',
    href: '/chain/verify-a-block',
    label: 'Verify a block',
    short: 'Verify a block',
    mode: 'read',
    blurb:
      'Pick any devnet block and check it yourself in your browser: the hash links, the sequencer’s seal, every transaction id and signature. Then flip one byte and see which check catches it.',
  },
  {
    key: 'playground',
    href: '/chain/playground',
    label: 'API Playground',
    short: 'API Playground',
    mode: 'read',
    blurb:
      'Every MCP tool and REST read of the devnet with a form, a curl line and a Node snippet. Readers run from the page; tools that post show the call and run nowhere.',
  },
  {
    key: 'bloom',
    href: '/chain/bloom',
    label: 'Checkpoint Blooms',
    short: 'Blooms',
    mode: 'read',
    blurb:
      'Generative art drawn from the devnet’s checkpoint hashes, one bloom each, with a gold ring for every key that witnessed it. The same hash always draws the same bloom.',
  },
  {
    key: 'witness',
    href: '/chain/witness',
    label: 'Witness in your browser',
    short: 'Witness',
    mode: 'write',
    blurb:
      'Replay the devnet from block 1 in a worker with the Block Yard’s pinned verifier, then sign what you got at one checkpoint with a free key. A witness is a claim tied to a key, not proof that you replayed.',
  },
  {
    key: 'channels',
    href: '/chain/channels',
    label: 'Channels',
    short: 'Channels',
    mode: 'write',
    blurb:
      'Every broadcast channel on the devnet: who holds each code and what is on air. Claim a free code, set it open or crew-only, add crew and broadcast. First come, first served; a reset drops every claim.',
  },
];

export const APPS_HEADLINE = 'Nine apps on the devnet';

/** The honesty line every app page carries, verbatim. */
export const HONESTY = 'devnet · no value · may reset';

export const appByKey = (key: string): ChainApp | undefined => CHAIN_APPS.find((a) => a.key === key);
