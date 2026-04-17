/**
 * Block type constants — the form primitive (channel is about-ness, type is form).
 *
 * Eight types. Each has a display label, a monospace tag for the block header,
 * and a footer template hint that describes what metadata appears at the bottom
 * of the card. BlockCard uses these to pick the right internal treatment.
 *
 * Per BLOCKS.md: 8 channels × 8 types = 64 combinations. Most will never appear,
 * that's fine. Adding a 9th type requires a BLOCKS.md schema change.
 */

export type BlockType =
  | 'READ'    // Long-form text — dispatch, essay
  | 'LISTEN'  // Spotify / SoundCloud / audio embed
  | 'WATCH'   // Video embed
  | 'MINT'    // Paid edition, FA2 collectible
  | 'FAUCET'  // Free daily claim
  | 'NOTE'    // Short observation, tweet-sized
  | 'VISIT'   // Someone stopped by — log entry
  | 'LINK';   // External link with context

export interface BlockTypeSpec {
  code: BlockType;
  label: string;     // Display label in the type tag, e.g. "READ"
  /** One-word hint describing what goes in the footer meta line. */
  footerHint:
    | 'readingTime'
    | 'externalLink'
    | 'duration'
    | 'edition'
    | 'claimStatus'
    | 'location'
    | 'agent'
    | 'destination';
  /** Short description — shown on /for-agents. */
  description: string;
}

export const BLOCK_TYPES: Record<BlockType, BlockTypeSpec> = {
  READ: {
    code: 'READ',
    label: 'READ',
    footerHint: 'readingTime',
    description: 'Long-form text — essay, dispatch, article.',
  },
  LISTEN: {
    code: 'LISTEN',
    label: 'LISTEN',
    footerHint: 'externalLink',
    description: 'Audio embed — Spotify, SoundCloud, or a single track.',
  },
  WATCH: {
    code: 'WATCH',
    label: 'WATCH',
    footerHint: 'duration',
    description: 'Video embed with external link and runtime.',
  },
  MINT: {
    code: 'MINT',
    label: 'MINT',
    footerHint: 'edition',
    description: 'Paid edition on Tezos FA2. Price in tez, supply, mint button.',
  },
  FAUCET: {
    code: 'FAUCET',
    label: 'FAUCET',
    footerHint: 'claimStatus',
    description: 'Free daily claim. One per wallet per day, gas only.',
  },
  NOTE: {
    code: 'NOTE',
    label: 'NOTE',
    footerHint: 'location',
    description: 'Short observation, tweet-sized. Often location-tagged.',
  },
  VISIT: {
    code: 'VISIT',
    label: 'VISIT',
    footerHint: 'agent',
    description: 'Visit-log entry. Shows the visitor vendor or geo.',
  },
  LINK: {
    code: 'LINK',
    label: 'LINK',
    footerHint: 'destination',
    description: 'External link — destination domain shown as the footer signal.',
  },
};

export const BLOCK_TYPE_LIST: BlockTypeSpec[] = Object.values(BLOCK_TYPES);
