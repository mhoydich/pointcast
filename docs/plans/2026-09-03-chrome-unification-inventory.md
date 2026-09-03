# Chrome unification inventory

Date: 2026-09-03  
Baseline: `origin/main` at `34e078312bed34f2c69a71b7eb630bdfc1de9d4a`

## Count correction

The September 2 vision note recorded 62 BaseLayout pages. The requested baseline command, `git grep -l "BaseLayout" -- src/pages`, now returns 68 files. One is a comment-only mention in `src/pages/drum.astro`; the current tree therefore had 67 real BaseLayout imports. The five-page difference from the note is repository drift, not an omitted migration.

All 67 imported pages move to `BlockLayout legacy`. The `legacy` mode retains the former warm stylesheet, Google font set, body utility classes, title separator, default social image, theme colors, larger bottom clearance, and ClientRouter navigation. The only intentional visible shell change is replacement of Footer + CoNavigator + PeerCursors by FooterBar + TugRope + SpellLayer + CursorRoom.

## A. Shared-prop pages (48)

These pages used only props already understood by BlockLayout and required no compatibility API beyond the common `legacy` visual mode:

- `src/pages/about.astro`
- `src/pages/admin/deploy.astro`
- `src/pages/admin/deploy/[slug].astro`
- `src/pages/admin/deploy/new.astro`
- `src/pages/admin/feedback.astro`
- `src/pages/ads/report.astro`
- `src/pages/arcade-60.astro`
- `src/pages/booth.astro`
- `src/pages/cb.astro`
- `src/pages/coffee.astro`
- `src/pages/collect/[tokenId].astro`
- `src/pages/collect/shelf.astro`
- `src/pages/crystal-ball-pass.astro`
- `src/pages/crystal-ball-pass/play.astro`
- `src/pages/crystal-ball-pass/v2.astro`
- `src/pages/dispatch-drum.astro`
- `src/pages/federation/preview.astro`
- `src/pages/inhabited.astro`
- `src/pages/market.astro`
- `src/pages/marketplace.astro`
- `src/pages/mcps.astro`
- `src/pages/money.astro`
- `src/pages/mythos.astro`
- `src/pages/network-el-segundo/share.astro`
- `src/pages/passport.astro`
- `src/pages/post-office.astro`
- `src/pages/press.astro`
- `src/pages/press/[slug].astro`
- `src/pages/privacy.astro`
- `src/pages/race/front-door.astro`
- `src/pages/race/index.astro`
- `src/pages/residents.astro`
- `src/pages/reviews/beach-commons-v3.astro`
- `src/pages/reviews/crystal-ball-pass.astro`
- `src/pages/reviews/index.astro`
- `src/pages/reviews/the-listening-grove.astro`
- `src/pages/reviews/tone-bloom.astro`
- `src/pages/reviews/year-one.astro`
- `src/pages/scoreboard.astro`
- `src/pages/taproom.astro`
- `src/pages/tidepool.astro`
- `src/pages/token/[collection]/[tokenId].astro`
- `src/pages/treasury.astro`
- `src/pages/visiting.astro`
- `src/pages/wallet.astro`
- `src/pages/window.astro`
- `src/pages/wire.astro`
- `src/pages/x402.astro`

## B. Compatibility pages (19)

BlockLayout gained the following compatibility points rather than leaving a second layout stack:

- `hideAds`: suppresses OpenAdRail but never the shared dock.
- `hideNav`: retained as a documented no-op because BaseLayout declared it but never used it; preserving that behavior avoids a visual change.
- named `head` slot: renders page-specific discovery/social metadata in `<head>`.

Pages using them:

- `src/pages/ads.astro` — `hideAds`
- `src/pages/collect.astro` — `hideAds`
- `src/pages/collect/@[handle].astro` — `hideAds`
- `src/pages/digital-pets.astro` — `hideNav`
- `src/pages/digital-pets/commons.astro` — `hideNav`
- `src/pages/digital-pets/counsel.astro` — `hideNav`
- `src/pages/digital-pets/counsel/proofs.astro` — `hideNav`
- `src/pages/digital-pets/legacy.astro` — `hideNav`
- `src/pages/digital-pets/microduck.astro` — `hideAds`, `hideNav`
- `src/pages/digital-pets/office.astro` — `hideNav`
- `src/pages/digital-pets/share.astro` — `hideNav`
- `src/pages/haptic-dreams/build.astro` — `hideAds`
- `src/pages/listening-grove.astro` — `hideNav`
- `src/pages/lobby.astro` — named `head` slot
- `src/pages/p/[handle].astro` — `hideAds`
- `src/pages/p/index.astro` — `hideAds`
- `src/pages/rooms.astro` — `hideNav`
- `src/pages/tide/share/[palette]/[scene].astro` — named `head` slot
- `src/pages/week-in-review.astro` — `hideNav`

`jsonLd`, `alternates`, `imageWidth`, and `imageHeight` were already BlockLayout props. Several legacy pages had been passing them to BaseLayout even though BaseLayout did not declare or render them; the migration makes those existing calls effective.

## C. Intentional standalone document shells (52, unchanged)

These pages own their complete HTML document and were outside the two-layout migration. They remain dockless by design:

- `src/pages/auth/project.astro`
- `src/pages/beach-commons.astro`
- `src/pages/beach-commons/v1.astro`
- `src/pages/beach-commons/v10.astro`
- `src/pages/beach-commons/v11.astro`
- `src/pages/beach-commons/v12.astro`
- `src/pages/beach-commons/v13.astro`
- `src/pages/beach-commons/v14.astro`
- `src/pages/beach-commons/v15.astro`
- `src/pages/beach-commons/v16.astro`
- `src/pages/beach-commons/v17.astro`
- `src/pages/beach-commons/v18.astro`
- `src/pages/beach-commons/v18/engineering.astro`
- `src/pages/beach-commons/v18/outdoors.astro`
- `src/pages/beach-commons/v18/passport.astro`
- `src/pages/beach-commons/v18/shrines.astro`
- `src/pages/beach-commons/v18/skills.astro`
- `src/pages/beach-commons/v2.astro`
- `src/pages/beach-commons/v3.astro`
- `src/pages/beach-commons/v4.astro`
- `src/pages/beach-commons/v5.astro`
- `src/pages/beach-commons/v6.astro`
- `src/pages/beach-commons/v6/thanks.astro`
- `src/pages/beach-commons/v7.astro`
- `src/pages/beach-commons/v8.astro`
- `src/pages/beach-commons/v9.astro`
- `src/pages/bellflower.astro`
- `src/pages/corner.astro`
- `src/pages/drum-apr26.astro`
- `src/pages/field.astro`
- `src/pages/garden-signal/open-heart.astro`
- `src/pages/local-star-commons.astro`
- `src/pages/network-el-segundo.astro`
- `src/pages/network-el-segundo/field-kit.astro`
- `src/pages/network-el-segundo/mesh-commons.astro`
- `src/pages/network-el-segundo/v2.astro`
- `src/pages/nouns-nation-battler-mobile.astro`
- `src/pages/nouns-nation-battler-tv.astro`
- `src/pages/qwen-good-intelligence.astro`
- `src/pages/qwen-silver-letter.astro`
- `src/pages/qwen-weather.astro`
- `src/pages/recap/[week].astro`
- `src/pages/showcast/bells-bloom.astro`
- `src/pages/sparrow/about.astro`
- `src/pages/sparrow/deck.astro`
- `src/pages/sparrow/tv.astro`
- `src/pages/sparrow/tv/ch/[slug].astro`
- `src/pages/sparrow/tv/friends.astro`
- `src/pages/sparrow/tv/saved.astro`
- `src/pages/sunset-switchboard.astro`
- `src/pages/tv.astro`
- `src/pages/tv/[station].astro`

Specialized `DrumLayout`, `SparrowLayout`, and standalone live displays remain separate presentation shells. They no longer depend on PeerCursors: the drum-only NounsCursor is local and network-free.

## Presence route decision

The browser chrome no longer opens `/api/presence`; CursorRoom owns the single per-route `/api/room` client and the single `/api/burst` channel. The `/api/presence` server route remains because `agents.json`, agent/MCP documentation, `/here`, `/tv`, and other explicit public presence consumers still use it.
