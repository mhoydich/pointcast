---
sprintId: conavigator-persistent-music
firedAt: 2026-04-20T14:05:00-08:00
trigger: chat
durationMin: 20
shippedAs: deploy:f3d6d9d9
status: complete
---

# chat tick — CoNavigator · persistent footer bar + music survives navigation

## What shipped

Mike 2026-04-20 14:05 PT: *"need a way to keep the music as you navigate · lets start to look into a footer bar co navigator for pointcast, has your mood, current pointcast state, data, interaction tools, etc."*

The missing primitive: a persistent bar that lives at the bottom of every page, carries mood + music + stats + interaction tools, and keeps audio alive across navigation.

### Files shipped

- **`src/components/CoNavigator.astro`** (new, ~340 lines) — the co-navigator. Fixed to viewport bottom, ~48-56px tall. Three zones:
  - **LEFT**: current mood (dot + label) + ▶ SOUNDTRACK button (appears when a mood is set).
  - **MID**: stats readouts — `here now` (live fetch from /api/presence/snapshot), `hello` (from pc:hello:count), `streak` (computed from pc:daily:collected).
  - **RIGHT**: quick-nav chips linking to /here, /workbench, /drop.
  - **DRAWER** (above the bar): iframe player for the mood's soundtrack. `transition:persist="pc-soundtrack"` keeps it alive across Astro soft-navs.

- **`src/layouts/BaseLayout.astro`** + **`src/layouts/BlockLayout.astro`** — both updated:
  - `<ClientRouter />` from astro:transitions for soft navigation.
  - Mood-persistence script in `<head>` reads `pc:mood` before paint and sets `data-pc-mood` on `<html>` for zero-flicker tinting.
  - Mood-tint CSS moved to a global `<style>` block (was scoped to MoodChip, only worked on home).
  - `body { padding-bottom: 60px }` so content doesn't hide under the fixed bar.
  - `<CoNavigator />` rendered in body at the end.

- **`src/components/MoodChip.astro`** (modified) — removed the inline soundtrack player markup (was duplicating CoNav's player). The mood buttons now also dispatch a `pc:mood-changed` CustomEvent, which CoNav listens for.

### Music-persistence model

1. User picks a mood on home → `MoodChip` writes `pc:mood` to localStorage + dispatches `pc:mood-changed` → `CoNavigator` paints the mood chip + reveals the ▶ SOUNDTRACK button with the playlist label.
2. User taps ▶ → iframe `src` is set to the mood's embed URL (YouTube lofi-girl / Spotify Deep Focus / etc.) → drawer expands above the bar → audio starts on first user gesture (browsers require this; works).
3. User clicks any link on the page → Astro's ClientRouter intercepts → soft-nav → DOM swaps but **the iframe element with `transition:persist="pc-soundtrack"` is kept alive** → audio continues uninterrupted.
4. User clicks × close → iframe.src back to `about:blank` → drawer hides → music stops cleanly.

localStorage keys `pc:music:mood` + `pc:music:playing` remember state across full reloads so a future hydration can offer "resume" — current v0 just reopens the drawer to the last-selected mood's player.

### Deploy

- Build: 249 pages clean.
- Deploy: `https://f3d6d9d9.pointcast.pages.dev/` → pointcast.xyz live on main.
- Home: 26 `pc-conav-*` class mentions, `conav__bar` present, `pc-soundtrack` persist name present, `transition:persist` attribute present.
- /here, /b/*, /c/*, /clock/*, and other BlockLayout pages all carry the CoNav.

## Why one-layout-only wouldn't have worked

First attempt added CoNavigator to BaseLayout only. Home (index.astro) uses BlockLayout, not BaseLayout → CoNav didn't render there. BlockLayout has its own `<html><head><body>` — they're sibling layouts not parent/child. Fixed by wiring both. Every page on pointcast.xyz uses one of the two, so coverage is now site-wide.

## Observations

- **ClientRouter side effects**: astro:transitions adds `astro-route-announcer` + view-transitions CSS. In dev these are loud; in production they're invisible unless a transition runs. Falls back to full-reload on cross-layout navigations (/ → /drum uses BaseLayout vs /b/0328 uses BlockLayout) — that's graceful.
- **Music-pauses-on-full-reload is expected**: if the user types a URL directly or hits an external link, the page fully reloads and the iframe is recreated. Soft-nav between like-layout pages is where persistence shines.
- **The bar's sizing leaves 60px/54px padding** so content reach-to-footer is preserved. Existing Footer still renders above CoNav in the body; scroll past Footer goes under the fixed bar but that's intended (the fixed bar is the interactive layer, Footer is the editorial layer).
- **The "data" zone** is v0: just here/hello/streak. Can grow to include deploy hash, last-shipped-at, Codex queue count, etc. in future ticks as Mike validates the surface.

## What didn't

- **"Broadcasting" the soundtrack selection to /here visitors**: presence protocol already has a `listening` field — wire CoNav's play event to send `listening: {playlist label}` via the WS identify message. Saved for next tick.
- **Touch-device arrange drag** (from prior tick) — shipped in theory; real-device test TBD.
- **Upsets / trends on SportsStrip** — ESPN basic endpoint doesn't include team records; needs a second fetch. Deferred.

## Notes

- Build: 249 pages (no new routes — all adds are component-level or layout-level).
- Deploy: `https://f3d6d9d9.pointcast.pages.dev/`
- Files new: 1 (CoNavigator.astro + this retro).
- Files modified: 3 (BaseLayout, BlockLayout, MoodChip).
- Cumulative: **57 shipped** (28 cron + 29 chat).

— cc, 14:25 PT (2026-04-20) · the bar is always with you, the music too
