/**
 * Card of the Day — deterministic daily Nouns rotation for /battle.
 *
 * Every page render picks a Noun from a curated roster indexed by the UTC
 * date (YYYY-MM-DD). Same date → same Noun, everywhere, for every viewer.
 * Agents hitting /battle.json on the same day get the same card as a human
 * opening /battle in Safari.
 *
 * The roster is hand-curated: Nouns with visually distinct glasses +
 * recognizable heads, spread across the full type palette (WATER · BEAM ·
 * ARMOR · WILD · FEAST) so the daily card doesn't feel samey. Extend by
 * appending IDs here — the rotation length is just `ROSTER.length`, so
 * adding a card shifts the schedule forward by one day from that date.
 *
 * Rotation math: dayIndex = floor(UTC epoch ms / 86_400_000), then modulo
 * roster length. The UTC boundary means a West Coast viewer sees the new
 * card at 17:00/18:00 PT (ST/DT) — close enough to "end of day" to feel
 * ritualistic without being tied to a specific timezone.
 */

/**
 * Curated roster. Each entry is a Noun ID and a terse reason so future
 * editors know why it's in the rotation. Keep the list balanced across
 * head categories (ape, fish, wizard, taco, etc.) — the battler's type
 * derivation pulls primary type from the head, so a mono-type roster
 * makes matchups predictable in a boring way.
 */
export const CARD_ROSTER: Array<{ id: number; note: string }> = [
  { id: 42,   note: 'the canonical battler card — originals first' },
  { id: 137,  note: 'phase-1 launch card' },
  { id: 333,  note: 'bell tones, clean face' },
  { id: 420,  note: 'roster default challenger — classic meme Noun' },
  { id: 69,   note: 'short-head pop' },
  { id: 7,    note: 'low-ID collector bait' },
  { id: 888,  note: 'palindromic ID, strong glasses' },
  { id: 101,  note: 'high-timbre drum card' },
  { id: 256,  note: '2^8, nice round power-of-two' },
  { id: 512,  note: '2^9, larger pow-of-two' },
  { id: 999,  note: 'triple-digit max pop' },
  { id: 1024, note: '2^10 — developer friendly' },
  { id: 555,  note: 'shaker drum card — triples' },
  { id: 169,  note: 'perfect square (13²)' },
  { id: 729,  note: 'perfect cube (9³)' },
  { id: 11,   note: 'single-digit double-ups' },
  { id: 66,   note: 'mirror of 99' },
  { id: 333,  note: 'triple threes — high-focus rolls' },
  { id: 1111, note: 'quad one, maximal clean' },
  { id: 314,  note: 'pi Noun' },
  { id: 1200, note: 'edge of the roster — guaranteed valid' },
];

/**
 * Compute the integer day index for a given date (UTC). Using 86_400_000 ms
 * rather than calendar arithmetic keeps the function deterministic regardless
 * of DST transitions or local timezone weirdness.
 */
export function dayIndexForDate(date = new Date()): number {
  const ms = date.getTime();
  return Math.floor(ms / 86_400_000);
}

export interface CardOfTheDay {
  id: number;
  note: string;
  /** ISO UTC date (YYYY-MM-DD) — the "today" this card is pinned to. */
  date: string;
  /** Human label — "Apr 17, 2026 (UTC)". */
  dateLabel: string;
  /** Index into CARD_ROSTER that produced this id. Useful for debugging. */
  rosterIndex: number;
}

/**
 * Pick the Card of the Day for the given date (defaults to now).
 *
 * Deterministic: same date → same card, across all renders.
 */
export function pickCardOfTheDay(date = new Date()): CardOfTheDay {
  const dayIndex = dayIndexForDate(date);
  const rosterIndex = ((dayIndex % CARD_ROSTER.length) + CARD_ROSTER.length) % CARD_ROSTER.length;
  const entry = CARD_ROSTER[rosterIndex];

  const isoDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  )).toISOString().slice(0, 10);

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date) + ' (UTC)';

  return {
    id: entry.id,
    note: entry.note,
    date: isoDate,
    dateLabel,
    rosterIndex,
  };
}

/**
 * Convenience: just the ID for places where the full metadata is noise
 * (old call sites that used the CARD_OF_THE_DAY constant).
 */
export function todaysCardId(date = new Date()): number {
  return pickCardOfTheDay(date).id;
}
