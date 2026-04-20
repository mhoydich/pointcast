---
sprintId: feedback-block-strip
firedAt: 2026-04-18T20:11:00-08:00
trigger: cron
durationMin: 14
shippedAs: deploy:6be60c55
status: complete
---

# Per-block feedback strip — 3 buttons + optional line

## What shipped

Third of Mike's three original /sprint PICKs from this morning. Cron read the queue (feedback-block-strip still oldest) + the "rebuild drum" custom directive + 1 archived ping. Picked feedback-block-strip, left "rebuild drum" queued for 9:11 tick where I'll sketch scope before shipping.

- **`functions/api/feedback.ts` extended** — now accepts optional `blockId` field (4-digit string, ≤16 chars). Relaxed the "message required" gate so mood-only posts are valid (buttons without typed text). Email subject + body include the block id when present for fast grouping in Mike's inbox.
- **`FeedbackStrip.astro` component** — dashed-red-border strip below the block nav on every `/b/{id}` page. Three reaction buttons: **RESONATED** (green ✓) / **CONFUSED** (amber ?) / **MISSED** (rose ✗). Optional 280-char one-liner behind a `+ add a line` disclosure. Kicker reads "FEEDBACK · PRIVATE TO MIKE · one tap, optional line" so the privacy commitment is visible at the surface.
- **Wired into `src/pages/b/[id].astro`** — renders between the related-blocks nav and the machine-readable strip. Every block page now has the feedback surface.
- **localStorage dedup per browser per block** (`pc:fb:{id}`) — if you've reacted on a block before, the UI paints the prior button as "voted" and says "you reacted: X · tap again to update". Server still accepts repeat submits (rate-limited to 5/min/IP via the existing feedback rate limit).
- **Smoke-tested** — POSTed a mood-only reaction with blockId=0273, got `{ok:true}`. The /admin/feedback viewer (already built) will group these by blockId for Mike.

## What didn't

- **No public count display** per the sprint brief. Counts stay private via /admin/feedback. A future sprint can add an opt-in "show counts on this block" flag if Mike wants public signal on specific high-engagement posts.
- **No aggregate cross-block sparkline yet.** "Which blocks are landing hardest this week" is a Mike-facing dashboard feature — belongs to a future admin sprint, not the reader surface.
- **No wallet-gated writes.** Anyone can react; the rate limit + 30-day KV TTL are the only guardrails. For high-signal polls we already have the wallet option; for block reactions we want low friction. Correct default.

## Follow-ups

- **9:11 next tick** → "can you rebuild drum" custom directive. I'll read `/drum` + the `major--drum` HomeMajors module and sketch three scope options in the recap, then either ship the narrowest or /ping you for a call.
- /admin/feedback viewer could grow a "by block" tab (currently chronological). Good follow-on once there's real data.
- If people start leaving lots of typed lines, consider adding a "cc digest" that reads 7-day feedback + emits a weekly NOTE block summarizing themes.

## Notes

- 19th sprint shipped today. Cumulative cc work: ~312 min.
- All three of Mike's morning /sprint PICKs (fresh-top-strip / shelling-point-poll / feedback-block-strip) have now shipped, plus two custom directives landed (polls-on-home done, rebuild-drum queued). The loop is digesting picks at roughly one per cron hour — matches the registered cadence.
- The feedback surface on every block is a bigger deal than it looks: every time someone reads a block (171 blocks × unknown visitors), a low-friction signal can land in Mike's inbox. The /admin/feedback viewer becomes the editorial north star once volume picks up.
- Kept the strip visually quiet — dashed light border, mono text, no color competing with the channel colors. It's infrastructure, not a performance.
