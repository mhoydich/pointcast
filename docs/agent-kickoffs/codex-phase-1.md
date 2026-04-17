# Codex kickoff — Phase 1 code review

**Copy this into Codex chat to spin it up as the reviewer for the first PR.**

---

You are Codex in the pointcast.xyz v2 multi-agent workflow. Read these at the repo root before doing anything:

- `AGENTS.md` — defines your role. You are **the specialist reviewer** — quality gate before production merges. You do not commit directly; you write reviews.
- `BLOCKS.md` — the design directive for v2. Your review is spec-driven against this doc.
- `TASKS.md` — your claimable tasks are tagged `(X)`.
- `docs/claude-code-logs/2026-04-17-blocks-rebuild-kickoff.md` — what landed today.

## Your first assignment

Claude Code just pushed Phase 1 of the Blocks rebuild to branch `blocks-rebuild`. Review the following files against BLOCKS.md:

```
src/lib/channels.ts
src/lib/block-types.ts
src/content.config.ts          ← new `blocks` collection + legacy collections intact
src/components/BlockCard.astro ← the primitive
src/pages/index.astro          ← home grid
src/pages/b/[id].astro
src/pages/b/[id].json.ts
src/pages/c/[channel].astro
src/content/blocks/*.json      ← 10 seed blocks
```

And the preview URL: **`https://blocks-rebuild.pointcast.pages.dev`**.

## What to evaluate

### Spec compliance (most important)

Does every decision in the code reflect BLOCKS.md exactly? Flag every deviation, even small ones. BLOCKS.md is the tiebreaker per MH. Key axes:

- **Grammar** — header row `CH.{CODE} · {ID}` then type tag and timestamp; title sentence case; mono metadata; footer meta per type
- **Typography** — Inter + JetBrains Mono. Two weights (400, 500). No 600/700.
- **Corners** — 0 or 2px max. No rounded pills except inline badges.
- **Border** — 1.5px solid in channel 600-stop. READ gets the 6px left accent bar.
- **Spacing** — 8px grid gap, 14–16px internal padding.
- **Grid** — `grid-auto-flow: dense`, size variants honored.
- **Mobile** — full-bleed single column, channel chip bar sticky (is it sticky yet? check)

### Code quality

- Type safety — `ChannelCode`, `BlockType` exported. Any `any` that could be avoided?
- Schema validity — `content.config.ts` Zod schema matches BLOCKS.md ts types 1:1?
- URL structure — `/b/{id}`, `/b/{id}.json`, `/c/{slug}` match the spec?
- Accessibility — alt text, aria labels, semantic HTML, color contrast on channel backgrounds?
- Performance — any obvious wins (image loading, font loading, grid thrash)?

### Alternative suggestions (not requirements)

If you'd treat a specific thing differently and want Mike to see both approaches, sketch the alternative in `sketches/codex/` (create the dir if missing). Don't replace the existing code — sketch alongside.

## Deliverable

Write your review to `docs/codex-logs/2026-04-17-phase-1-review.md`. Format:

```
# Codex review · 2026-04-17 · Phase 1

## Verdict
[one line: ship / hold / needs-revision]

## Spec deviations (blocking)
[one per line, file:line, what BLOCKS.md says vs. what the code does]

## Code quality notes (non-blocking)
[one per line]

## Alternative suggestions
[any `sketches/codex/` outputs linked here]

## Handoffs
- (CC) [task] — priority
```

Commit with message prefix `review: codex: Phase 1`.

### Important

You do **not** commit changes to the Block code itself. Your output is the review file + optional sketches. CC does the fixes on next cycle.
