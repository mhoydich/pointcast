/**
 * Sparrow TV · shared slide-list builder + helpers.
 *
 * Used by:
 *   - src/pages/sparrow/tv.astro          (ambient broadcast)
 *   - src/pages/sparrow/tv/ch/[slug].astro (channel-locked variant)
 *
 * Pure, side-effect-free; takes block collection entries + channel
 * lookup, returns the shape the TV pages actually render. Keeps
 * /sparrow/tv* pages from drifting apart as Phase 1 grows.
 *
 * v0.1 (2026-04-28) — see docs/plans/2026-04-28-sparrow-tv-mode.md.
 */

import type { CollectionEntry } from 'astro:content';
import { CHANNELS, type ChannelCode } from './channels';

export interface TVSlide {
  id: string;
  title: string;
  dek: string;
  channel: ChannelCode;
  channelName: string;
  type: string;
  mood: string;
  timestamp: string;
}

export interface BuildSlidesOpts {
  /** Cap the slide list. Default 18. */
  limit?: number;
  /** Filter to a single channel code. */
  channel?: ChannelCode;
}

/**
 * Build the TV slide list from a sorted (newest-first) blocks array.
 * Caller does the getCollection + sort; this just shapes the result.
 */
export function buildTVSlides(
  blocks: CollectionEntry<'blocks'>[],
  opts: BuildSlidesOpts = {},
): TVSlide[] {
  const limit = opts.limit ?? 18;
  const filtered = opts.channel
    ? blocks.filter((b) => b.data.channel === opts.channel)
    : blocks;
  return filtered.slice(0, limit).map((b) => ({
    id: b.data.id,
    title: b.data.title,
    dek: b.data.dek ?? '',
    channel: b.data.channel as ChannelCode,
    channelName: CHANNELS[b.data.channel as ChannelCode]?.name ?? b.data.channel,
    type: b.data.type,
    mood: b.data.mood ?? '',
    timestamp: b.data.timestamp.toISOString(),
  }));
}

/**
 * Format a block timestamp for the TV meta row. La time, MMM d.
 */
export function fmtTVDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
  });
}
