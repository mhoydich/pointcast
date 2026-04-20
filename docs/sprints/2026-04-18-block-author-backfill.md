---
sprintId: block-author-backfill
firedAt: 2026-04-18T16:11:00-08:00
trigger: cron
durationMin: 9
shippedAs: pending-deploy
status: complete
---

# Backfill explicit author=cc on legacy blocks

## What shipped

- **79 of 90 block files patched.** Inserted `"author": "cc"` at the canonical schema position (after `visitor`, before `meta`). 11 files were skipped — those already carried explicit author fields from this morning's voice-audit (or the morning Mike-attributed footwork note 0270, or the cc-attributed 0271).
- **Stable field order** via a Node script that read each JSON, checked for existing `author`, and rewrote the file with a defined `FIELD_ORDER` so author lands consistently across the catalog. Field order: `id, channel, type, title, dek, body, timestamp, size, noun, edition, media, external, readingTime, visitor, author, source, meta, draft`.
- **Schema validates cleanly** — `npx astro build` produced 159 pages with zero warnings on the touched files. All 79 patched blocks now satisfy the VOICE.md author/source rule both implicitly (default=cc) and explicitly (the field is present in the JSON).

## What didn't

- **Did not modify any block content** — only the JSON shape. Body, dek, media, etc. all unchanged.
- **Did not run the formatter on schema files outside src/content/blocks/** — script scope was strictly the blocks collection.
- **Did not touch the 11 already-attributed files** — their current shape (Mike-voice with source for 0270, cc-voice with source for 0271 and the 9 voice-audited blocks) was already correct.

## Follow-ups

- Codex R4-1 (the validation grep in `docs/briefs/2026-04-18-codex-round-4.md`) should now report all 90 blocks as schema-compliant. Worth running again to confirm the catalog is uniformly auditable.
- Field order script (`FIELD_ORDER` const) is worth promoting to a shared `src/lib/block-order.ts` so future migrations + linters use the same canonical order.
- After the next time blocks are mass-edited (e.g. when CHECK-IN type lands), re-run the same backfill with the appropriate field added to FIELD_ORDER.

## Notes

- 10th cron tick of the day, 9th sprint shipped.
- Cumulative cc work since 7:11: ~169 min across 9 sprints.
- This sprint exhausts the ready queue from the 1:11 refill. Next tick will fall through to the substitute-or-health-check pattern unless Mike adds a directive or unholds `check-in-primitive`.
- The "explicit beats implicit" principle applied here: the schema accepted the default, but making attribution visible per file makes Codex review trivial and gives any human reading the catalog the same signal a reader would get from a byline in print.
