# Codex brief — broadcast-mode architecture review

**Audience:** Codex acting as architecture-review specialist.

**Context:** Mike (2026-04-19 morning chat) opened a new arc for PointCast: a broadcast mode for big-screen use. Cross-platform, not Apple-TV-locked, with live interactivity (polls while viewing, presence of other watchers, lite multiplayer games, visualizations). cc just shipped `/tv` v0 — a landscape ambient-feed page that auto-scrolls through recent blocks, reuses the existing presence WebSocket for a live viewer count, and renders live-polling results at scale.

Mike's verbatim from 2026-04-19 ~07:45 PT:

> "get codex and manus back in the loop, and yah lets start building this out, on some levels we don't want to be confined to just apple tv os, so yah, other pathways are interesting as well … the interactive part, polling while viewing, mini games, maybe some type of presense, where you know other people are watching, maybe lite games … and yah visualizations"

Full TV-direction block: `/b/0282` (shipping in the same tick as this brief). Platform-matrix question delegated to Manus: `docs/briefs/2026-04-19-manus-platform-matrix.md`.

---

## Task BC-1 — Review the `/tv` v0 route

**File:** `src/pages/tv.astro` (shipped in deploy that produces this brief)

Check:

1. **Auto-scroll cadence.** Does N-seconds-per-block feel right on a real TV, or too fast/slow? The current dwell is 12s per block. Recommend a range + a heuristic for dwell based on block type (READ = longer, WATCH = shorter because the embed carries its own time signal).
2. **Landscape-first layout.** Rendered for 1920×1080 and 3840×2160. Are the typography scales right, do the chip colors read at 3m viewing distance, does the contrast meet WCAG AA at glance distance?
3. **Presence WS reuse.** `/tv` reuses the existing `/api/presence` Durable Object. Under sustained traffic (e.g. 50+ concurrent TV viewers + the normal site traffic), does the DO's per-second broadcast become the bottleneck? Do we need a separate DO for TV-mode or is the shared one fine? If separate: propose the boundary.
4. **Burn-in risk.** Any static elements (masthead, logo) that would risk OLED burn-in if the TV idles on `/tv` for hours? List them. Recommend anti-burn-in drift or pixel shift.
5. **Accessibility.** Screen reader support on /tv is probably wrong — the auto-scroll doesn't pair well with AT. What's the right behavior when a screen reader is detected?

**Deliverable:** A review file at `docs/reviews/2026-04-19-codex-tv-v0.md` with findings + line-number references.

---

## Task BC-2 — Platform-path architecture trade-off

Given Manus is producing the platform matrix separately, **focus this task on the architecture end**: what CHANGES per platform, and what stays the same?

Questions to answer:

1. **What's the shared core?** If cc ships a single `/tv` route + companion APIs today, which platforms get it "for free" via browser + AirPlay/Chromecast, and which need a native wrapper? Concretely: Apple TV (needs AirPlay or a native app); Roku (native app, BrightScript/SceneGraph); Google TV / Android TV (can run Chrome, but lacks a comfortable browser UX); Fire TV (can use Silk browser; PWA support is weak); Samsung Tizen / LG webOS smart TVs (native browser, varied HTML5 coverage); Chromecast (cast from Chrome tab, works now).
2. **Where do interactive primitives diverge?** Polls + presence work in any browser. Mini games that need controller input differ across platforms — Siri Remote swipe (Apple TV), Roku remote D-pad, game controllers (Fire TV, Android TV), touch (phone-to-TV companion). Should we standardize on "phone is the controller" and keep the TV as pure display? Draft the pros/cons.
3. **Companion-mode pattern.** If phone == controller, we need a fast pairing flow. QR code on the TV → phone scans → websocket-paired. Any reason not to go QR-first?

**Deliverable:** `docs/reviews/2026-04-19-codex-platform-architecture.md`, ~300-600 words, with a concrete architecture recommendation (shared core + where native wraps become necessary).

---

## Task BC-3 — Light touch: interactive-primitives risk scan

cc is going to ship, in order over the next few ticks:

- `/tv` v0 — landscape feed + presence readout ✓ (this tick)
- Live poll visualization on /tv — poll bars scaled to full-screen, updating from the same `/api/polls` endpoint
- Presence-aware overlay — show watcher-count + mini avatars on the TV
- Mini-game v0 — probably a tap-tempo or pick-a-noun mini played from phones against the TV as the shared display
- Daily collection tie-in — today's drop featured prominently on the TV with a claim QR

Scan the shipped code as each lands. Flag:

- Any UX that assumes touch/pointer at the TV (there is no pointer — swipe remote only)
- Any interaction that would race-condition under multi-viewer load (50+ phones voting simultaneously from the same /tv session)
- Any content that would be unsafe to display on a shared screen (profanity in user-entered poll options, for instance)

**Deliverable:** Ongoing. A running file at `docs/reviews/2026-04-19-codex-broadcast-rollout.md` that gets appended as cc ships each sub-part.

---

## Working style

- Read `VOICE.md` + `BLOCKS.md` if you haven't this session.
- Don't modify code — cc ships; you review. Your author is `codex` on any block you author in response; source field must cite the review file path.
- If you find something that needs a fix, either (a) PR a tight fix with rationale, or (b) write it as a finding for cc to pick up in the next tick.
- Be blunt. Overnight-shipped code from cc has less review-time than daylight code; extra scrutiny is the point.

— brief filed by cc, 2026-04-19 08:15 PT, sprint `tv-mode-v0`
