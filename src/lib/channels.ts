/**
 * Channel constants — one of the two primitives defined in BLOCKS.md.
 *
 * Channels answer "what is this about?" Every Block belongs to exactly one.
 * Each channel has a short code, a display name, a color ramp, and a purpose
 * blurb. Do not add a ninth without MH decision (per BLOCKS.md).
 *
 * The 600-stop is the primary color (used for borders); the 800-stop is the
 * high-contrast text color (used for the channel code); the 50-stop is the
 * optional tinted background. All color values are picked so a hard black
 * title on a 50-tint background hits WCAG AA on mid-sized text.
 */

export type ChannelCode =
  | 'FD'  // Front Door — AI, interfaces, agent-era thinking
  | 'CRT' // Court — pickleball
  | 'SPN' // Spinning — music, listening
  | 'GF'  // Good Feels — cannabis, product drops
  | 'GDN' // Garden — balcony, birds, quiet noticing
  | 'ESC' // El Segundo — ESCU fiction, local
  | 'FCT' // Faucet — free daily claims
  | 'VST' // Visit — human/agent log entries
  ;

export interface ChannelSpec {
  code: ChannelCode;
  slug: string;       // URL segment: /c/front-door
  name: string;       // display name: "Front Door"
  purpose: string;    // one-line blurb
  /** Primary hex — used for borders and accent bars. */
  color600: string;
  /** Dark hex — used for channel code text + emphasized links. */
  color800: string;
  /** Very light tint — used as optional block background. */
  color50: string;
}

export const CHANNELS: Record<ChannelCode, ChannelSpec> = {
  FD: {
    code: 'FD',
    slug: 'front-door',
    name: 'Front Door',
    purpose: 'AI, interfaces, agent-era thinking.',
    color600: '#185FA5',
    color800: '#0B3E73',
    color50: '#EEF4FA',
  },
  CRT: {
    code: 'CRT',
    slug: 'court',
    name: 'Court',
    purpose: 'Pickleball — matches, paddles, drills.',
    color600: '#3B6D11',
    color800: '#24460A',
    color50: '#F0F5E9',
  },
  SPN: {
    code: 'SPN',
    slug: 'spinning',
    name: 'Spinning',
    purpose: 'Music, playlists, listening notes.',
    color600: '#993C1D',
    color800: '#6A2810',
    color50: '#FBEFEA',
  },
  GF: {
    code: 'GF',
    slug: 'good-feels',
    name: 'Good Feels',
    purpose: 'Cannabis/hemp, product drops, brand ops.',
    color600: '#993556',
    color800: '#6B2139',
    color50: '#FAEAF0',
  },
  GDN: {
    code: 'GDN',
    slug: 'garden',
    name: 'Garden',
    purpose: 'Balcony, birds, wildlife, quiet noticing.',
    color600: '#0F6E56',
    color800: '#074638',
    color50: '#E7F4EF',
  },
  ESC: {
    code: 'ESC',
    slug: 'el-segundo',
    name: 'El Segundo',
    purpose: 'ESCU fiction, local, community.',
    color600: '#534AB7',
    color800: '#332C7C',
    color50: '#EEEDF7',
  },
  FCT: {
    code: 'FCT',
    slug: 'faucet',
    name: 'Faucet',
    purpose: 'Free daily claims, giveaways.',
    color600: '#BA7517',
    color800: '#834F0A',
    color50: '#FBF1E1',
  },
  VST: {
    code: 'VST',
    slug: 'visit',
    name: 'Visit',
    purpose: 'Human and agent visit log entries.',
    color600: '#5F5E5A',
    color800: '#38373A',
    color50: '#EFEFEE',
  },
};

export const CHANNEL_LIST: ChannelSpec[] = Object.values(CHANNELS);

/** Resolve a channel by either code ("FD") or slug ("front-door"). */
export function getChannel(key: string): ChannelSpec | undefined {
  const upper = key.toUpperCase();
  if (upper in CHANNELS) return CHANNELS[upper as ChannelCode];
  return CHANNEL_LIST.find((c) => c.slug === key.toLowerCase());
}
