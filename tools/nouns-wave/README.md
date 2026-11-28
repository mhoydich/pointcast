# Nouns Wave v0 — a habit chain

One block per day seals the day's six atomic habits for Noun Town and Noun School:
draw a noun, mint it, post it, gift one, write a note, ship code.

- Each block stores the day's counts, receipts (Loom message ids, contracts, commits) and `prev`, the previous block's hash.
- `hash = sha256(JSON of {height, date, prev, habits, receipts})`.
- The hash draws the day's Noun from the official CC0 Nouns traits (four 16-bit slices pick body, accessory, head, glasses; a fifth picks the background).
- Streaks grow on consecutive days a habit is kept and reset on a zero. Totals compound.
- Counts are only what can be checked: mints from TzKT, posts only once Grok Bot returns an X link.

Run (dir with `@nouns/assets @nouns/sdk sharp` installed):

    node nouns-wave.js ../../public/nouns-wave/chain.json day-YYYY-MM-DD.json ../../public/nouns-wave

Outputs `wave-<height>.png` (1080x1350 card) and `wave-<height>.webp` (32x32 Noun), and appends the block to `chain.json`.
Anyone can verify a block by recomputing the hash from its fields and re-drawing the Noun.

Next: anchor each block hash on Tezos (mint the day's wave Noun with the hash in its metadata).
