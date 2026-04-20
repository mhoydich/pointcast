---
sprintId: arrange-mood-up-sports-favicon
firedAt: 2026-04-20T13:50:00-08:00
trigger: chat
durationMin: 25
shippedAs: deploy:ae71b8e1
status: complete
---

# chat tick — drag-to-arrange + mood up + mood site-wide + sports redesign + broadcast favicon

## What shipped

Five directives in ~15 minutes, all one batch:

### 1. BlockReorder — pointer-event arrange mode

Rewrote `src/components/BlockReorder.astro` from HTML5-drag-API to Pointer Events with an explicit `ARRANGE · OFF / ON` toggle.

- **Problem with the old**: HTML5 drag events don't fire on touch devices, and the BlockCard is an `<a>` — dragging conflicted with link-clicking. Result: Mike couldn't arrange on mobile at all, and on desktop dragging often triggered navigation.
- **Fix**: Explicit toggle gates arrange mode. When ON: dashed outlines on every card, cursor → grab, link clicks suppressed in capture phase, cards become pointer-capturable via Pointer Events (works on mouse + touch + pen equally). A placeholder element holds drop-target space so the grid doesn't jump during drag.
- **Persistence** unchanged: `pc:block-order` localStorage key, same shape, same recovery. Toggle label also shows count of moved blocks when you have a custom arrangement.
- **Reset** button surfaces when custom order exists.

### 2. MoodChip moved up

Now renders immediately after FreshStrip at the very top of the home — before VisitorHereStrip, before NetworkStrip, before TodayOnPointCast. The reasoning per Mike: *"rolling thru the site in that mood"* — setting mood first means every surface below + every page after renders tinted.

### 3. Mood persists site-wide

Added a tiny inline script to `BaseLayout.astro` `<head>` that reads `pc:mood` from localStorage and sets `data-pc-mood` on `<html>` BEFORE paint — no flicker. Moved the mood-tint CSS rules out of MoodChip's scoped styles into a `<style is:global>` block in BaseLayout, so the tint applies on every page of the site — /here, /tv, /for-nodes, /collabs, /workbench, /b/*, everything. Select a mood on home, visit /here, the page is still tinted sage/violet/cobalt/whatever.

### 4. SportsStrip redesign

Old strip inherited the monospace site font + cramped game lines that looked inconsistent. Redesign:

- **Typography stack**: Inter for team names (condensed, modern), tabular-numerals monospace for scores (column-aligned), Georgia for loading/empty states, mono for the metadata chips. Looks intentional now.
- **Each game becomes a card**: status chip at top (FINAL / LIVE / UPCOMING), two team rows below (away then home), score prominent on the right in tabular-num mono, winner row highlighted in cobalt with bold weight.
- **Hot badge** ⚡ — surfaces when score diff is ≤3 points on a final or ≤2 during in-progress; also when the status contains OT / SO / ET / shootout / penalties / extra. Draws attention to close games without needing to parse the scores yourself.
- **LIVE state** — red chip with a `●` that pulses (1.4s infinite). Background shift to warm red so the tile stands out from final-state gray.
- **Upcoming state** — cobalt chip, muted scores (since none yet), shortDetail renders as the start time.
- **Grace-fallback unchanged**: ESPN fetch errors → "tap board →" link, no fake scores.

### 5. Broadcast-dish favicon

Old `public/favicon.ico` (32×32 PNG of an Anthropic-looking "A" on black — Mike's screenshot showed it) renamed to `favicon.ico.bak-antrope-a`. The existing `public/favicon.svg` is already a 📡 broadcast-dish emoji on cream background — browsers now fall back to it for any request that previously fetched the .ico. Browser favicon cache needs a hard refresh for Mike to see the update in an already-open tab.

## Deploy

- Build: 249 pages clean.
- Deploy: `https://ae71b8e1.pointcast.pages.dev/` → pointcast.xyz live on main.
- `/favicon.ico` now 404 on preview (correct — file renamed). Cloudflare edge cache will propagate the 404 over the next few min; in the meantime SVG is the tab icon.
- Home curl confirms: ARRANGE toggle present, data-pc-mood persisting, mood__soundtrack rendered, sports-game__status present (new redesign).

## Caveats

- **Favicon browser cache**: the old PNG is likely still in Mike's browser tab cache. Cmd+Shift+R on macOS or closing the tab fixes it.
- **Arrange mode touch behavior**: tested in logic + CSS, real-device test still TBD. If Mike's iPhone can't drag, the fix path is `touch-action: none` on `.block-card` in arrange mode (already applied) + perhaps widening the grab zone.
- **SportsStrip ⚡ hot-badge logic is heuristic**: close-game detection is ≤3pts for basketball-scale finals. For MLB (runs) a ≤3-run game is also close; for EPL (goals) ≤3 is too generous — 1-goal games only. Worth tuning per league if Mike wants precision. For now, "close game" = good approximation across all four leagues.

## Re: "upsets, previews, trends"

Mike's fuller ask was sports "quick interesting, upsets, previews, current state, trends." This tick delivers:

- ✅ **Current state** — LIVE pulse + big tabular scores
- ✅ **Previews** — UPCOMING status + start-time shortDetail
- ⚠️  **Upsets** — partial. The ESPN scoreboard basic endpoint doesn't include team records, so true "underdog won" detection needs the `/teams` or `/standings` API extension. Flagged as follow-up.
- ⚠️  **Trends** — even more data-dependent. Skipped for v0. Worth a dedicated brief later.

Next-tick candidate: extend SportsStrip with a second fetch per league for /teams records, then annotate wins as UPSET when the underdog-by-record beat the favorite.

## Notes

- Build: 249 pages (unchanged — no new routes, all deltas are component-level or layout-level).
- Deploy: `https://ae71b8e1.pointcast.pages.dev/`
- Files modified: 5 (BlockReorder.astro, BaseLayout.astro, SportsStrip.astro, MoodChip.astro, index.astro).
- File renamed: 1 (favicon.ico → favicon.ico.bak-antrope-a).
- Cumulative: **56 shipped** (28 cron + 28 chat).

— cc, 14:10 PT (2026-04-20) · 📡 now on the tab, mood tint rolls with you
