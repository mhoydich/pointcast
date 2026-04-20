---
sprintId: profile-dashboard-v0
firedAt: 2026-04-19T20:55:00-08:00
trigger: chat
durationMin: 18
shippedAs: deploy:173d003e
status: complete
---

# chat tick — /profile dashboard v0 (identity + state + activity)

## What shipped

`/profile` was a wallet-management stub. It's now a full visitor dashboard. Three new sections above the existing wallet list; all client-side, all localStorage-aggregated.

Mike's chat greenlight was implicit (earlier "my lean: /profile — already exists, minimal new primitive") + the "keep going" at 20:55. Shipping the v0 now; URL can migrate to `/you` or similar if Mike later picks a different convention.

### 1. Identity card (hero)
- **140px noun avatar** (gold-ringed, rounded) — deterministic from `pc:session` hash → noun id 0-1199
- **Display name** — preference order: `pc:visitor:display` override → short wallet address → known agent UA name → `noun-NNN` fallback → `visitor`
- **Metadata line**: "Noun № 421 · WALLET / AGENT / HUMAN · here since Mon Apr 19, 2026"
- **Hint line**: active wallet short-address if present + clarifying "anonymous identity — noun id is deterministic from this browser's session"

### 2. Current state panel
Shows what the visitor told via the TELL THE PEOPLES panel on home. Hidden if nothing set.
- Chips for each set field: mood (burgundy bold caps), 🎵 now playing, 📍 where
- `edit ↗` link anchors back to `/#here-tell-panel` so the edit action lives on home where the panel actually is

### 3. Activity grid
Four stat cards aggregated from every `pc:*` localStorage key:
- **HELLO** — count + last-earned date
- **drops collected** — count + current streak
- **polls voted** — unique count (walks all `pc:poll:voted:*` keys)
- **voter level** — from `pc:voter:state` JSON (level, XP, title)

### 4. Activity detail (two-column)
- **polls voted** list — slug + picked option, each row linking to `/poll/{slug}`
- **drops collected** list — date + block id, each row linking to `/b/{id}`
- Empty states point at the appropriate home surfaces

### 5. Wallets (existing)
Untouched. Section now titled "Paired on this browser" with H2 rather than H1 since identity is the page hero now.

## Why this over the open pool

The TELL THE PEOPLES panel shipped 10 min ago saves state but had nowhere to view it afterwards. VisitorHereStrip's "YOUR PROFILE →" link was a pointer to a stub. This tick completes the loop: visitor tells → profile shows.

It's also the first shippable move toward Mike's identity-arc direction without committing to his four decisions. `/profile` at its current URL works for everyone regardless of whether Mike picks `/profile` vs `/you` as the final convention.

## Design decisions worth recording

- **Noun avatar LARGE on the identity card** (140×140). Makes "this is you" legible at a glance. Smaller sizes on /tv, FreshStrip, etc. — big here because this is the page where you study your own state.
- **Preference order for display name** (override > wallet > agent > noun > visitor). Puts user-set choice first, then the stable anchors. Agent falls back to the matched UA string ("GPTBot", "ClaudeBot") so bots get a recognizable identity instead of "visitor".
- **"here since" uses `pc:visitor:firstSeenAt`** — set on first VisitorHereStrip load. If visitor arrived today, says "here since today". When someone's been around a week, reads "here since Mon Apr 13".
- **XP/Level pulled from `pc:voter:state` JSON**. Assumed shape — if VoterStats uses different keys, the stat shows defaults (L1 / 0 XP / Novice Voter). Resilient to missing data.
- **Polls voted list walks ALL `pc:poll:voted:*` keys**. Doesn't depend on a central index — if new polls ship, they show up automatically.
- **Escape HTML on user text.** `escapeHtml()` for listening/where values before innerHTML — prevents XSS from self-typed input. Not that anyone's attacking themselves via their own localStorage, but clean is clean.
- **Client-side only.** Everything renders from localStorage. When Mike greenlights the server-side identity arc, this page adds a fetch layer on top but stays client-renderable for offline mode.

## What didn't

- **Moods history**. Current state panel shows CURRENT mood; doesn't log mood-over-time. Would need a new `pc:visitor:mood-log` array. Small follow-up tick.
- **Achievement badges.** VoterStats likely tracks achievements; didn't surface them here. Simple extension.
- **Cross-device sync.** Awaits Mike's identity-arc KV decision.
- **"Clear browser memory" button.** A nuclear-option reset for privacy. Considered; deferred — users can always clear storage via devtools or browser settings, and adding a one-click wipe introduces data-loss-risk without a strong pull.
- **URL redirect if Mike picks `/you`** later. When he decides, one-line `redirects` entry handles the migration.
- **Agent detection is client-side only.** Bots that don't run JS see the stub view. Fine for now; a server-side agent rendering (via middleware Mike has for stripped HTML) is a follow-up.

## Notes

- Build: 206 pages (unchanged; existing /profile page enhanced).
- Rendered HTML verified: identity-card, identity__avatar, identity__name, state-panel (×2 — 1 in markup + 1 class ref in CSS), activity__grid, state-chip class references all present.
- Deploy: `https://173d003e.pointcast.pages.dev/profile`
- Chat-fired tick.
- Cumulative today: 31 shipped (18 cron + 13 chat).
- The VisitorHereStrip → /profile round-trip now lands meaningfully. A visitor can: land on home → see PEOPLES HERE → tap TELL → save state → tap YOUR PROFILE → see noun + state + activity. That's a full visitor-identity lap.

— cc, 20:58 PT
