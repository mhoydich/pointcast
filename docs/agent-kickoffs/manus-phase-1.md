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

1. **Desktop wide** (≥1440px) — auto-fit grid flows to 6 columns, size variants show (0205 spans 3x2, 0209 spans 2x2, 0212/0213/0214/0215/0219 span 2x1)
2. **Laptop** (1024–1279px) — grid auto-fits to 4-ish columns
3. **Tablet** (768–1023px) — grid auto-fits to ~2 columns, size variants downgrade gracefully
4. **Mobile** (≤639px) — single column, full-bleed. **Channel chip bar should be sticky at top and horizontally scrollable.** Safari iOS + Chrome Android at minimum.

### What to check (score each 1–5)

- **Primitive legibility** — can you tell what channel + type + ID each block is at a glance?
- **Channel color as navigation** — do the 8 colors read as distinct? Ambiguous pairs?
- **Density vs. clutter** — BLOCKS.md wants a "wall of signal." Does it feel that, or does it feel crowded?
- **Typography** — self-hosted Inter + JetBrains Mono should be loaded. Two weights (400, 500). Any mono falling through to system ui-monospace is a bug.
- **Type-specific treatments** — LISTEN embed, MINT image+edition footer, FAUCET claim status, VISIT agent badge, LINK destination footer
- **Responsive behavior** — anything overflow, any size downgrade look awkward?
- **Permalink pages** — click any block to land on `/b/{id}`. The detail page now shows (a) the big BlockCard, (b) for MINT + FAUCET types, a mint strip with a "Mint/Claim" button, (c) a machine-readable agent strip with `/b/{id}.json`, `/c/{slug}.json`, `/c/{slug}.rss` links — **click each one, they should all load now (Phase 2 landed)**.

### Phase 2 + presence + mint surfaces

- **`/for-agents`** — a manifest page for AI agents. Check it reads as intentional rather than generic. Screenshot it.
- **`/blocks.json`** — full archive JSON. Pretty-print should be readable.
- **`/sitemap-blocks.xml`** — every block + channel URL.
- **`/c/{slug}.rss`** + **`/c/{slug}.json`** — RSS + JSON Feed per channel. Feed readers (NetNewsWire, Feedbin) should parse them cleanly — if you have one installed, subscribe and screenshot.
- **Presence bar** — in the masthead there's an "ON AIR" dot + counter that tries to open a WebSocket to `/api/presence`. **It will fail and hide** on the current ship because the Durable Object isn't live yet (Pages limitation — see `docs/presence-next-steps.md`). Don't flag that as a bug — flag the _hide_ as the expected graceful degradation. Log whether it hid within 4s or flashed.
- **Mint button** — on `/b/0210` (the FAUCET block) and `/b/0209` (wait, that was reframed as a LINK now — don't mint test there). On /b/0210 click "Claim →". Kukai should pop on Shadownet. **Do not sign.** We're just testing the UI flow. Log what happened: did the button lazy-load Taquito? Did Beacon pair modal appear? Did the status line update in real-time? Cancel the sign.

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
