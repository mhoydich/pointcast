/**
 * The /pickleball best-bet card — pure logic only, no network call and no
 * resvg-wasm renderer, so it imports and tests directly under plain Node.
 * Mirrors src/lib/og-kennel-card.mjs: functions/og/pickleball.png.ts is the
 * thin Pages Function that fetches GET /api/air/board and calls renderPng()
 * on what this file builds.
 */
import { pageCard } from './unfurl/cards.mjs';

/** Shown when GET /api/air/board has no `best` — an empty board, honestly, never an invented bet. */
export const NO_LIVE_LINE = 'No live reports yet. See the board at pointcast.xyz/pickleball.';

/** The line to print under the masthead: the board's own words, or NO_LIVE_LINE. */
export function bestBetLine(board) {
  const line = board?.best?.line;
  return typeof line === 'string' && line.trim() ? line : NO_LIVE_LINE;
}

/**
 * The card's SVG. `board` is GET /api/air/board's JSON (or null/undefined
 * for an empty board — this still renders, it just says so). `light` is
 * lightAt()'s result; `client`/`serial` are the unfurl counter's inputs.
 */
export function pickleballCard({ board, light, client = '', serial = 0 }) {
  return pageCard({
    path: '/pickleball',
    title: 'THE PICKLEBALL BOARD',
    description: bestBetLine(board),
    light,
    client,
    serial,
  });
}
