/**
 * decks — the versioned-narrative registry for PointCast.
 *
 * A Deck is a single-file HTML presentation under public/decks/. Each Deck
 * comes with a 1200×630 poster at public/posters/{slug}.png, rendered by
 * scripts/build-deck-poster.mjs. The registry below is the source of truth
 * consumed by both /decks (human index) and /decks.json (agent manifest).
 *
 * Adding a Vol. N:
 *   1. Drop the deck HTML at public/decks/vol-n.html (single file, CC0).
 *   2. Append an entry to DECKS in scripts/build-deck-poster.mjs + here.
 *   3. Run `node scripts/build-deck-poster.mjs` to render public/posters/vol-n.png.
 *   4. Publish a cover-letter Block referencing /decks/vol-n.html.
 *   5. File a sprint recap.
 *   6. Add matching ComputeLedger entries.
 *
 * Cadence: see block 0361 for the four public triggers that fire Vol. III.
 */

export interface DeckEntry {
  /** URL-safe slug, e.g. "vol-1". */
  slug: string;
  /** Roman-numeral volume label, e.g. "Vol. I". */
  roman: string;
  /** Short title, e.g. "The Network Shape". */
  title: string;
  /** Dek — one-line editorial subtitle. */
  dek: string;
  /** When this deck was published (ISO 8601 with offset). */
  publishedAt: string;
  /** Number of slides. */
  slides: number;
  /** File size in bytes. Updated by build-deck-poster.mjs when it has a chance. */
  bytes: number;
  /** Block id of the cover-letter block that introduces this deck. */
  coverBlock: string;
  /** One-liner on what's distinctive about this volume. */
  note?: string;
}

export const DECKS: DeckEntry[] = [
  {
    slug: 'vol-2',
    roman: 'Vol. II',
    title: 'The Network Shape',
    dek: '100 commits · 15 slides · Compute is the currency. The ledger is the receipt.',
    publishedAt: '2026-04-21T10:12:00-08:00',
    slides: 15,
    bytes: 53342,
    coverBlock: '0360',
    note: 'Network-shaped. Compute ledger, multi-agent PulseStrip, Workbench, federation spec, five-client field nodes, Magpie, CoNav HUD, Sky Clock beyond El Segundo, /play, pc-ping-v1 + x402.',
  },
  {
    slug: 'vol-1',
    roman: 'Vol. I',
    title: 'The Dispatch from El Segundo',
    dek: 'A living broadcast · 13 slides · Blocks, channels, meshes, the 25-mile beacon.',
    publishedAt: '2026-04-20T18:00:00-08:00',
    slides: 13,
    bytes: 38988,
    coverBlock: '0360',
    note: 'El-Segundo-shaped. The canonical framing before Vol. II went wider. Still a clean read on the Block primitive and the three meshes.',
  },
];

/** Most-recent-first. */
export function listDecks(): DeckEntry[] {
  return [...DECKS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/** Find a deck by slug, or null. */
export function getDeck(slug: string): DeckEntry | null {
  return DECKS.find((d) => d.slug === slug) ?? null;
}
