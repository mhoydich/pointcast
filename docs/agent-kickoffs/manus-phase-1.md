# Manus kickoff — Phase 1 preview QA

**Copy this into Manus chat to spin it up for its first v2 task.**

---

You are Manus in the pointcast.xyz v2 multi-agent workflow. Before doing anything, read these files at the repo root:

- `AGENTS.md` — defines your role, coordination protocol, and the TASKS.md workflow. You are **operations and computer-use** — anything behind a login or requiring a real browser session.
- `BLOCKS.md` — design directive for v2. Every piece of content is a Block. Eight channels, eight types.
- `TASKS.md` — live task queue. Your claimable tasks are tagged `(M)`.
- `docs/claude-code-logs/2026-04-17-blocks-rebuild-kickoff.md` — what Claude Code shipped today.

## Your first assignment

Visit **`https://blocks-rebuild.pointcast.pages.dev`** — Phase 1 preview of the Blocks rebuild. Production pointcast.xyz is untouched and still serves v1.

Do a structured QA pass. Open TASKS.md and claim `(M) First pass end-to-end test — desktop + mobile screenshots, log to docs/manus-logs/`.

### Devices to test

1. **Desktop wide** (≥1440px) — full 6-column grid, size variants should show (0205 spans 3x2, 0209 spans 2x2, 0212 spans 2x1)
2. **Laptop** (1024–1279px) — 4-column grid
3. **Tablet** (768–1023px) — 2-column grid, size variants downgrade
4. **Mobile** (≤639px) — single column, full-bleed. Safari iOS + Chrome Android at minimum.

### What to check (score each 1–5)

- **Primitive legibility** — can you tell what channel + type + ID each block is at a glance?
- **Channel color as navigation** — do the 8 colors read as distinct? Ambiguous pairs?
- **Density vs. clutter** — BLOCKS.md wants a "wall of signal." Does it feel that, or does it feel crowded?
- **Typography** — mono metadata, sans title. Two weights (400, 500). Any weight used wrong?
- **Type-specific treatments** — LISTEN embed, MINT image+edition footer, FAUCET claim status, VISIT agent badge
- **Responsive behavior** — anything overflow, any size downgrade look awkward?
- **Permalink pages** — click any block to land on `/b/{id}`. Permalink page renders the detail. The agent-strip shows `/b/{id}.json`, `/c/{slug}.json`, `/c/{slug}.rss` links. Click each — the JSON should load; the .rss and .json feeds will 404 for now (Phase 2 work).

### Deliverable

Write a dated markdown log to `docs/manus-logs/2026-04-17.md`. Format:

```
# Manus log · 2026-04-17 · Phase 1 preview QA

## Summary
[one paragraph — overall impression]

## Desktop wide
[screenshot link, observations, 1–5 scores against the check list]

## Tablet / Mobile
[screenshots + notes]

## Bugs / deviations from BLOCKS.md
- [one per line]

## Suggestions (not requirements)
- [one per line]

## Handoffs back to Claude Code
- (CC) fix X — priority high/med/low
```

Embed screenshots inline or link to external image hosts. Commit the log file with message prefix `log: manus: 2026-04-17 Phase 1 QA`.

### Important

You do **not** commit any code or content changes — only your log file. If you spot bugs, they become tasks in TASKS.md assigned to (CC), not fixes you do yourself. Respect the lane boundaries per AGENTS.md.

Production pointcast.xyz is still v1. Do not deploy, do not touch DNS, do not merge `blocks-rebuild` → `main`. Preview QA only.
