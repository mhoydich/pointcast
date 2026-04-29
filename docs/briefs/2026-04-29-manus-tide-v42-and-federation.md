# Manus QA brief · Tide v4.2 + /federation/preview update

**Filed:** 2026-04-29
**Author:** cc
**Status:** new — supersedes [`2026-04-28-manus-tide-v4-qa.md`](./2026-04-28-manus-tide-v4-qa.md) for the parts that overlap. The v4 brief is still valid for what hasn't been re-tested yet (audio behaviors A/B/C, persistence E, /tide.json structure F).
**Surfaces under test:** /tide v4.2 (new scenes + soundscape), /tide/share/{palette}/{scene}, /tide/horizon, /tide/preview, /federation/preview (new stats banner).

## Why a new brief

Twelve sprints landed today. The April 28 brief was scoped to Tide v4. We're
now at v4.2 with two new visualization+audio modes, 48 SSR shareable cards
with og:image, an always-on TV variant, and a federation preview that audits
itself. Worth a fresh real-browser pass.

A previous Manus session (the visit you logged in /admin/feedback today)
was a happy-path tour of mood + /meditate + /drum — not the v4 QA. This
brief is what I'd most like a real browser to walk through.

## Accounts / tools

Same as last brief. Modern Chrome or Safari, audio permission via the SOUND
toggle, no login, no wallet. A second device for mobile pass.

## Test plan — Tide v4.2 (new since v4)

### A. Two new modes

Open https://pointcast.xyz/tide and verify the new scene + soundscape:

1. **TESSELLATE scene** — press M five times to land on it (or load
   https://pointcast.xyz/tide#abyss/tessellate). The viewport should fill
   with hexagonal tiles in palette swatch colors. Every ~700ms a few tiles
   should change color. Per-tile alpha should breathe gently. Capture a
   screenshot at ABYSS and at CRYSTAL.

2. **MARKOV soundscape** — toggle SOUND ON, switch SOUNDSCAPE pill to
   MARKOV. You should hear a recurring melodic line over a quiet pad fifth.
   Notes should land inside the palette tonality. The melody should *not*
   feel random — it should feel composed (Markov-chain weighted toward
   stepwise motion, 4ths, return-to-root). Capture a 10-second screen
   recording with audio.

### B. Manifest sanity

Visit https://pointcast.xyz/tide.json and verify:
- `scenes` array has 6 entries (waves, starfield, mystify, bounce, pipes, **tessellate**)
- `soundscapes` array has 5 entries (drift, chimes, bubbles, granular, **markov**)
- `versions.v4.1` and `versions.v4.2` entries present
- `companion` lists `/tide/preview`, `/tide/share/{palette}/{scene}`, **/tide/horizon**

## Test plan — /tide/share

### C. Share-card unfurl

For three combos, paste the share URL into Twitter / X (compose tweet, don't
post — just check the preview card):
- https://pointcast.xyz/tide/share/abyss/mystify
- https://pointcast.xyz/tide/share/lagoon/waves
- https://pointcast.xyz/tide/share/storm/pipes

Each should render a 1200×630 palette-tinted preview card with `/TIDE` in the
top-left and `{PALETTE} · {SCENE}` in the top-right. The "Open in /tide"
button should link to the matching `/tide#{palette}/{scene}` URL.

Same test on Discord and Slack (paste URL into a channel, check the unfurl).

### D. Direct og.svg

Visit https://pointcast.xyz/tide/share/abyss/mystify/og.svg directly.
Should render as a standalone SVG image. Right-click → save as → file
should be `*.svg` (Content-Type: `image/svg+xml`).

## Test plan — /tide/horizon

### E. Always-on TV variant

Open https://pointcast.xyz/tide/horizon.

1. Page renders WAVES scene only — no drawer, no SOUND button, no
   keyboard shortcuts, no tap-to-cycle, **cursor should be hidden**.
2. Bottom-left corner shows palette name + clock.
3. Wave paths morph smoothly.
4. If you wait an hour past a clock boundary (e.g. cross 11:00 from
   CRYSTAL into LAGOON), palette should auto-shift on the next minute
   tick. (Don't wait an hour — just check the JS reads `clockPaletteId()`
   on a 60s interval.)
5. At browser width ≥ 1920, corner chip should be dimmer (TV surface).
6. At width < 768 with touch, chip should be more opaque (mobile).

Specifically intended for: leaving on a smart TV. Confirm there's nothing
that demands attention.

## Test plan — /tide/preview gallery

### F. 40-card gallery

Visit https://pointcast.xyz/tide/preview.

1. 8 sections (one per palette) × 5 cards each ≠ 40 cards. Wait — this
   surface uses 5 scenes (the v3 scenes). After the v4.2 ship it should
   have **6 scenes**. **If you see 5 cards per row, that's a bug.** Capture
   a screenshot — that's a regression I missed.

2. Each card click should open `/tide#{palette}/{scene}` in the same tab.

3. At width < 900, cards should reflow to 2 columns.

## Test plan — /federation/preview new stats

### G. Full-corpus stats banner

Visit https://pointcast.xyz/federation/preview.

1. **Top banner** should show three stat cards:
   - **scanned** N
   - **lossless** N (~93.5%)
   - **drift** ~12 (with amber styling if > 0)

2. Below the stat grid, a **drift fields** chip line should show
   `visitor ×N`, `edition ×1`, `draft ×N`, `clock ×1`.

3. Four sample cards in the middle (0381, 0387, 0384, 0371). Each should
   show LOSSLESS chip (green).

4. **Bottom section** — "All drifting blocks" with a list of every drifting
   block id + the path. Should match the stats banner count.

5. Footer links: RFC 0004, RFC 0005, converter source, audit:lexicon CLI.

The numbers on the page should match `npm run audit:lexicon` output exactly.
If they don't, that's a real bug — capture both.

## Mobile pass

Tide v4.2, /tide/share/{any}/{any}, /tide/horizon, /tide/preview,
/federation/preview — all on a phone-class viewport. Specific things:

- /tide/share card should stack hero + body cleanly
- /tide/horizon foam pacing should feel patient, not frantic
- /tide/preview cards should reflow to 2 columns
- /federation/preview stats grid should stack to 2 columns at <700px
- /federation/preview sample cards should stack BLOCK + LEXICON columns vertically below 800px

## What to capture

For each test letter A-G:
- 1-2 screenshots (use device frame for mobile)
- Console errors (DevTools console)
- Any visible bug

For B (audio): a 10-second screen recording with sound.

For C (unfurl): screenshots of the Twitter/Discord/Slack preview.

## Where to write the result

`docs/manus-logs/2026-04-29-tide-v42-qa.md`

```
# Manus QA · Tide v4.2 + federation preview · 2026-04-29

## Summary
[1 line]

## A. TESSELLATE
## B. MARKOV
## C. share unfurl
## D. og.svg direct
## E. /tide/horizon
## F. /tide/preview (note: 5 vs 6 cards — was this fixed?)
## G. /federation/preview stats

## Mobile pass
[separate section]

## Console errors
[anything notable]

## Bugs found
[numbered with severity]
```

Open a GitHub issue for each P0/P1 bug. Tag `tide` for tide-related,
`federation` for federation-related, `qa` for QA-found.

## Mike approval needed?

No. Read-only QA. No mint, no transfer, no wallet.

## Note on /tide/preview cards

I noticed while writing this brief that /tide/preview was shipped with
**5 scenes** in sprint 6 (run 1) and the v4.2 ship in sprint 9 (run 3) added
TESSELLATE without updating the gallery to show 6 scenes. **If you see 5
cards per row, that's expected — it's the next polish item.** I'll catch
it in a follow-up sprint.

## Related links

- [Block 0405 — sprint 9-12 receipt](https://pointcast.xyz/b/0405)
- [Block 0400 — milestone](https://pointcast.xyz/b/0400)
- [PR #233 — Tide v4.2 TESSELLATE + MARKOV](https://github.com/mhoydich/pointcast/pull/233)
- [PR #236 — /tide/share + og.svg](https://github.com/mhoydich/pointcast/pull/236)
- [PR #238 — /tide/horizon](https://github.com/mhoydich/pointcast/pull/238)
- [PR #240 — /federation/preview stats](https://github.com/mhoydich/pointcast/pull/240)
- [Previous brief — 2026-04-28 v4 QA](./2026-04-28-manus-tide-v4-qa.md) (still partially valid)

— cc
